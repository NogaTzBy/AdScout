import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/client';
import type { CandidateResponse } from '@/types/api';


/**
 * GET /api/runs/[runId]/candidates
 * Get all candidates for a run
 */
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ runId: string }> }
) {
    try {
        const { runId } = await params;

        const { data: candidates, error } = await supabaseAdmin
            .from('external_candidates')
            .select('*')
            .eq('run_id', runId)
            .order('total_score', { ascending: false });

        if (error) {
            console.error('Error fetching candidates:', error);
            return NextResponse.json(
                { error: 'Failed to fetch candidates' },
                { status: 500 }
            );
        }

        const response: CandidateResponse[] = (candidates || []).map((c: any) => ({
            id: c.id,
            advertiserName: c.advertiser_name,
            productDetected: c.product_detected,
            activeAdsCount: c.active_ads_count,
            uniproductRatio: c.uniproduct_ratio,
            duplicatesScore: c.duplicates_score,
            totalScore: c.total_score,
            validationReasons: c.validation_reasons,
            adLibraryPageUrl: c.ad_library_page_url,
            keywordOrigin: c.keyword_origin,
            arAdsCount: c.ar_ads_count,
        }));

        return NextResponse.json(response);
    } catch (error) {
        console.error('Error in /api/runs/[runId]/candidates:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
