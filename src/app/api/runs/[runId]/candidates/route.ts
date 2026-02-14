import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/client';
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
        const { searchParams } = new URL(request.url);
        const status = searchParams.get('status'); // Filter by status

        let query = supabase
            .from('external_candidates')
            .select('*')
            .eq('run_id', runId)
            .order('total_score', { ascending: false });

        if (status) {
            query = query.eq('status', status);
        }

        const { data: candidates, error } = await query;

        if (error) {
            console.error('Error fetching candidates:', error);
            return NextResponse.json(
                { error: 'Failed to fetch candidates' },
                { status: 500 }
            );
        }

        // Type assertion since Supabase types aren't fully inferred
        const response: CandidateResponse[] = (candidates as any[] || []).map((c: any) => ({
            id: c.id,
            advertiserName: c.advertiser_name,
            productDetected: c.product_detected,
            activeAdsCount: c.active_ads_count,
            uniproductRatio: c.uniproduct_ratio,
            duplicatesScore: c.duplicates_score,
            totalScore: c.total_score,
            validationReasons: c.validation_reasons,
            status: c.status,
            adLibraryPageUrl: c.ad_library_page_url,
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
