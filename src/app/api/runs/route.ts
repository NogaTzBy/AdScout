import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/client';

/**
 * GET /api/runs
 * Get all runs (most recent first)
 */
export async function GET(request: NextRequest) {
    try {
        const { data: runs, error } = await supabaseAdmin

            .from('runs')
            .select('id, target_country, language, keywords_input, status, created_at, finished_at, summary_logs')
            .order('created_at', { ascending: false })
            .limit(50);

        if (error) {
            console.error('Error fetching runs:', error);
            return NextResponse.json(
                { error: 'Failed to fetch runs' },
                { status: 500 }
            );
        }

        const response = (runs || []).map((r: any) => ({
            id: r.id,
            country: r.target_country,
            keywords: r.keywords_input,
            status: r.status,
            createdAt: r.created_at,
            finishedAt: r.finished_at,
            summaryLogs: r.summary_logs,
        }));

        return NextResponse.json(response);
    } catch (error) {
        console.error('Error in /api/runs:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
