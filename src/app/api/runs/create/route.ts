import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/client';
import { searchAdsByKeywords } from '@/lib/ad-library/scraper';
import { validateAdvertiser } from '@/lib/ad-library/validator';
import { COUNTRY_LANGUAGES } from '@/types/api';
import type { CreateRunRequest, CreateRunResponse, Country } from '@/types/api';

/**
 * POST /api/runs/create
 * Create a new research run
 */
export async function POST(request: NextRequest) {
    try {
        const body: CreateRunRequest = await request.json();

        // Validate input
        if (!body.country || !body.keywords || body.keywords.length === 0) {
            return NextResponse.json(
                { error: 'Missing required fields: country, keywords' },
                { status: 400 }
            );
        }

        const { country, keywords, filters } = body;
        const language = COUNTRY_LANGUAGES[country];

        // TODO: Get user_id from auth session (for MVP, use a default user)
        // For now, create a default user if not exists
        const { data: users } = await supabaseAdmin
            .from('users')
            .select('id')
            .limit(1);

        // Type assertion since Supabase types aren't fully inferred
        const usersArray = users as any[] || [];
        let userId: string;
        if (usersArray.length > 0) {
            userId = usersArray[0].id;
        } else {
            // Create default user for MVP
            // @ts-ignore - Supabase types need to be regenerated
            const { data: newUser, error: userError } = await supabaseAdmin
                .from('users')
                .insert({ email: 'mvp@adscout.com' })
                .select('id')
                .single();

            if (userError || !newUser) {
                throw new Error('Failed to create user');
            }
            userId = (newUser as any).id;
        }

        // Create run record
        // @ts-ignore - Supabase types need to be regenerated
        const { data: run, error: runError } = await supabaseAdmin
            .from('runs')
            .insert({
                user_id: userId,
                target_country: country,
                language,
                keywords_input: keywords,
                status: 'in_progress',
                filter_params: filters || {},
            })
            .select('id')
            .single();

        if (runError || !run) {
            console.error('Error creating run:', runError);
            return NextResponse.json(
                { error: 'Failed to create run' },
                { status: 500 }
            );
        }

        const runId = (run as any).id;

        // Process in background (don't wait for completion)
        processRun(runId, country, keywords, filters).catch(err => {
            console.error('Background processing error:', err);
        });

        const response: CreateRunResponse = {
            runId,
            status: 'in_progress',
            message: 'Run created successfully. Processing in background.',
        };

        return NextResponse.json(response, { status: 201 });
    } catch (error) {
        console.error('Error in /api/runs/create:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

/**
 * Background processing of a run
 */
async function processRun(
    runId: string,
    country: Country,
    keywords: string[],
    filters?: CreateRunRequest['filters']
) {
    try {
        console.log(`[Run ${runId}] Starting processing...`);

        // Step 1: Search Ad Library
        console.log(`[Run ${runId}] Searching Ad Library for ${keywords.length} keywords...`);
        const advertisersMap = await searchAdsByKeywords({
            country,
            keywords,
            limit: 50,
        });

        console.log(`[Run ${runId}] Found ${advertisersMap.size} advertisers`);

        // Step 2: Validate advertisers and save candidates
        const validationCriteria = {
            minActiveAds: filters?.minActiveAds || 20,
            minUniproductRatio: filters?.minUniproductRatio || 0.8,
            minDuplicatesScore: filters?.minDuplicatesScore || 0.3,
        };

        const candidates: any[] = [];

        for (const [advertiserName, advertiserData] of advertisersMap.entries()) {
            const metrics = validateAdvertiser(advertiserData, validationCriteria);

            // Extract product name (first keyword that matches, or first significant phrase from ads)
            const productDetected = keywords[0] || extractProductName(advertiserData.ads[0]?.adText);

            candidates.push({
                run_id: runId,
                keyword_origin: keywords[0], // Track which keyword found this
                advertiser_name: advertiserName,
                ad_library_page_url: advertiserData.pageUrl,
                product_detected: productDetected,
                active_ads_count: metrics.activeAdsCount,
                uniproduct_ratio: metrics.uniproductRatio,
                duplicates_score: metrics.duplicatesScore,
                total_score: metrics.totalScore,
                validation_reasons: metrics.reasons.join(' | '),
                status: metrics.passed ? 'approved_for_ar' : 'pending',
                ar_ads_count: null, // Will be updated in the next step
            });
        }    // Find AR matches for approved candidates
        for (const candidate of candidates) {
            if (candidate.status === 'approved_for_ar') {
                console.log(`[Run ${runId}] Cross-checking candidate ${candidate.advertiser_name} (Product: ${candidate.product_detected}) in AR...`);
                try {
                    // Search in AR using the detected product
                    // Using limit 100 to get a good estimate of total ads
                    const arAdvertisersMap = await searchAdsByKeywords({
                        country: 'AR',
                        keywords: [candidate.product_detected],
                        limit: 100,
                    });

                    // Count total active ads in AR for this product across all advertisers
                    let totalArAds = 0;
                    for (const arAdvertiser of arAdvertisersMap.values()) {
                        totalArAds += arAdvertiser.activeAdsCount;
                    }

                    candidate.ar_ads_count = totalArAds;
                    console.log(`[Run ${runId}] Found ${totalArAds} total ads in AR for "${candidate.product_detected}"`);
                } catch (error) {
                    console.error(`[Run ${runId}] Failed to cross-check in AR:`, error);
                    candidate.ar_ads_count = 0;
                }
            } else {
                candidate.ar_ads_count = null;
            }
        }

        // Insert candidates
        if (candidates.length > 0) {
            const { error: candidatesError } = await (supabaseAdmin
                .from('external_candidates')
                .insert(candidates as any) as any);

            if (candidatesError) {
                console.error(`[Run ${runId}] Error saving candidates:`, candidatesError);
                throw candidatesError;
            }

            console.log(`[Run ${runId}] Saved ${candidates.length} candidates`);
        }

        // Step 3: Update run status
        const { error: updateError } = await (supabaseAdmin
            .from('runs')
            .update({
                status: 'completed',
                finished_at: new Date().toISOString(),
                summary_logs: `Found ${advertisersMap.size} advertisers, ${candidates.length} candidates saved`,
            } as any)
            .eq('id', runId) as any);

        if (updateError) {
            console.error(`[Run ${runId}] Error updating run status:`, updateError);
        }

        console.log(`[Run ${runId}] Processing complete`);
    } catch (error) {
        console.error(`[Run ${runId}] Processing failed:`, error);

        // Update run status to error
        await (supabaseAdmin
            .from('runs')
            .update({
                status: 'error',
                finished_at: new Date().toISOString(),
                summary_logs: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
            } as any)
            .eq('id', runId) as any);
    }
}

/**
 * Extract product name from ad text
 */
function extractProductName(adText?: string): string {
    if (!adText) return 'Unknown Product';

    // Extract first capitalized phrase or first few words
    const words = adText.split(' ').slice(0, 5);
    return words.join(' ').substring(0, 50);
}
