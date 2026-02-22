import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/client';
import type { GetRunResponse } from '@/types/api';

/**
 * GET /api/runs/[runId]
 * Get run details and status
 */
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ runId: string }> }
) {
    try {
        const { runId } = await params;

        // Fetch run
        const { data: run, error: runError } = await supabaseAdmin
            .from('runs')
            .select('*')
            .eq('id', runId)
            .single();

        if (runError || !run) {
            return NextResponse.json(
                { error: 'Run not found' },
                { status: 404 }
            );
        }

        // Count candidates
        const { count: candidatesCount } = await supabaseAdmin
            .from('external_candidates')
            .select('*', { count: 'exact', head: true })
            .eq('run_id', runId);

        // Type assertion since Supabase types aren't fully inferred
        const runData: any = run;

        const response: GetRunResponse = {
            id: runData.id,
            country: runData.target_country,
            language: runData.language,
            keywords: runData.keywords_input,
            status: runData.status,
            createdAt: runData.created_at,
            finishedAt: runData.finished_at,
            candidatesCount: candidatesCount || 0,
        };

        return NextResponse.json(response);
    } catch (error) {
        console.error('Error in /api/runs/[runId]:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
