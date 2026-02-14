'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import type { GetRunResponse, CandidateResponse } from '@/types/api';

export default function RunDetailsPage() {
    const params = useParams();
    const runId = params.runId as string;

    const [run, setRun] = useState<GetRunResponse | null>(null);
    const [candidates, setCandidates] = useState<CandidateResponse[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!runId) return;

        const fetchData = async () => {
            try {
                setIsLoading(true);

                // Fetch run details
                const runResponse = await fetch(`/api/runs/${runId}`);
                if (!runResponse.ok) throw new Error('Failed to fetch run');
                const runData = await runResponse.json();
                setRun(runData);

                // Fetch candidates
                const candidatesResponse = await fetch(`/api/runs/${runId}/candidates`);
                if (!candidatesResponse.ok) throw new Error('Failed to fetch candidates');
                const candidatesData = await candidatesResponse.json();
                setCandidates(candidatesData);
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Unknown error');
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();

        // Poll every 5 seconds if run is in progress
        const interval = setInterval(() => {
            if (run?.status === 'in_progress') {
                fetchData();
            }
        }, 5000);

        return () => clearInterval(interval);
    }, [runId, run?.status]);

    if (isLoading) {
        return (
            <main className="min-h-screen flex items-center justify-center">
                <div className="text-center space-y-4">
                    <div className="w-12 h-12 border-4 border-accent-cyan border-t-transparent rounded-full animate-spin mx-auto"></div>
                    <p className="text-text-secondary">Loading run details...</p>
                </div>
            </main>
        );
    }

    if (error || !run) {
        return (
            <main className="min-h-screen flex items-center justify-center">
                <div className="card max-w-md text-center space-y-4">
                    <h2 className="text-xl font-semibold text-red-400">Error</h2>
                    <p className="text-text-secondary">{error || 'Run not found'}</p>
                    <a href="/dashboard" className="btn-primary inline-block">
                        Back to Dashboard
                    </a>
                </div>
            </main>
        );
    }

    const getStatusBadge = (status: string) => {
        const styles = {
            in_progress: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50',
            completed: 'bg-green-500/20 text-green-400 border-green-500/50',
            error: 'bg-red-500/20 text-red-400 border-red-500/50',
        };
        return (
            <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${styles[status as keyof typeof styles]}`}>
                {status.replace('_', ' ').toUpperCase()}
            </span>
        );
    };

    const getScoreBadge = (score: number) => {
        if (score >= 80) return 'bg-green-500/20 text-green-400';
        if (score >= 60) return 'bg-yellow-500/20 text-yellow-400';
        return 'bg-red-500/20 text-red-400';
    };

    return (
        <main className="min-h-screen p-8">
            <div className="max-w-6xl mx-auto space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold">Run Details</h1>
                        <p className="text-text-secondary text-sm mt-1">
                            {run.country} • {run.keywords.length} keywords • {run.candidatesCount} candidates
                        </p>
                    </div>
                    {getStatusBadge(run.status)}
                </div>

                {/* Run Info Card */}
                <div className="card space-y-4">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div>
                            <p className="text-text-tertiary text-xs uppercase tracking-wide mb-1">Country</p>
                            <p className="text-text-primary font-semibold">{run.country}</p>
                        </div>
                        <div>
                            <p className="text-text-tertiary text-xs uppercase tracking-wide mb-1">Language</p>
                            <p className="text-text-primary font-semibold">{run.language}</p>
                        </div>
                        <div>
                            <p className="text-text-tertiary text-xs uppercase tracking-wide mb-1">Created</p>
                            <p className="text-text-primary font-semibold">
                                {new Date(run.createdAt).toLocaleString()}
                            </p>
                        </div>
                        <div>
                            <p className="text-text-tertiary text-xs uppercase tracking-wide mb-1">Candidates</p>
                            <p className="text-text-primary font-semibold">{run.candidatesCount}</p>
                        </div>
                    </div>
                    <div>
                        <p className="text-text-tertiary text-xs uppercase tracking-wide mb-2">Keywords</p>
                        <div className="flex flex-wrap gap-2">
                            {run.keywords.map((keyword, idx) => (
                                <span
                                    key={idx}
                                    className="px-3 py-1 bg-background-secondary border border-border rounded-full text-sm"
                                >
                                    {keyword}
                                </span>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Candidates List */}
                <div className="space-y-4">
                    <h2 className="text-2xl font-semibold">Candidates ({candidates.length})</h2>

                    {candidates.length === 0 ? (
                        <div className="card text-center py-12">
                            <p className="text-text-secondary">
                                {run.status === 'in_progress' ? 'Processing... candidates will appear here' : 'No candidates found'}
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {candidates.map((candidate) => (
                                <div key={candidate.id} className="card card-hover">
                                    <div className="flex items-start justify-between gap-4">
                                        <div className="flex-1 space-y-2">
                                            <div className="flex items-center gap-3">
                                                <h3 className="font-semibold text-lg">{candidate.advertiserName}</h3>
                                                <span className={`px-2 py-1 rounded text-xs font-bold ${getScoreBadge(candidate.totalScore)}`}>
                                                    {candidate.totalScore}
                                                </span>
                                            </div>

                                            {candidate.productDetected && (
                                                <p className="text-text-secondary text-sm">
                                                    Product: {candidate.productDetected}
                                                </p>
                                            )}

                                            <div className="grid grid-cols-3 gap-4 text-sm">
                                                <div>
                                                    <span className="text-text-tertiary">Active Ads:</span>{' '}
                                                    <span className="text-text-primary font-semibold">{candidate.activeAdsCount}</span>
                                                </div>
                                                <div>
                                                    <span className="text-text-tertiary">Uniproduct:</span>{' '}
                                                    <span className="text-text-primary font-semibold">
                                                        {(candidate.uniproductRatio * 100).toFixed(0)}%
                                                    </span>
                                                </div>
                                                <div>
                                                    <span className="text-text-tertiary">Duplicates:</span>{' '}
                                                    <span className="text-text-primary font-semibold">
                                                        {(candidate.duplicatesScore * 100).toFixed(0)}%
                                                    </span>
                                                </div>
                                            </div>

                                            <details className="text-sm">
                                                <summary className="cursor-pointer text-accent-cyan hover:underline">
                                                    View validation reasons
                                                </summary>
                                                <p className="text-text-secondary mt-2 pl-4">
                                                    {candidate.validationReasons}
                                                </p>
                                            </details>
                                        </div>

                                        {candidate.adLibraryPageUrl && (
                                            <a
                                                href={candidate.adLibraryPageUrl}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="btn-secondary text-sm"
                                            >
                                                View Ads →
                                            </a>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Actions */}
                <div className="flex gap-3">
                    <a href="/dashboard" className="btn-secondary">
                        ← Back to Dashboard
                    </a>
                    {run.status === 'completed' && candidates.length > 0 && (
                        <button className="btn-primary">
                            Validate Against Argentina →
                        </button>
                    )}
                </div>
            </div>
        </main>
    );
}
