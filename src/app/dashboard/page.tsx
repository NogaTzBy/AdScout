'use client';

import { useState } from 'react';
import { COUNTRY_NAMES, type Country } from '@/types/api';

export default function DashboardPage() {
    const [selectedCountry, setSelectedCountry] = useState<Country>('BR');
    const [keywords, setKeywords] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [runId, setRunId] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    const handleCreateRun = async () => {
        setError(null);
        setIsLoading(true);

        try {
            const keywordsArray = keywords
                .split('\n')
                .map(k => k.trim())
                .filter(k => k.length > 0);

            if (keywordsArray.length === 0) {
                setError('Please enter at least one keyword');
                return;
            }

            const response = await fetch('/api/runs/create', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    country: selectedCountry,
                    keywords: keywordsArray,
                    filters: {
                        minActiveAds: 20,
                        minUniproductRatio: 0.8,
                        minDuplicatesScore: 0.3,
                    },
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to create run');
            }

            setRunId(data.runId);
            console.log('Run created:', data);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Unknown error');
            console.error('Error creating run:', err);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <main className="min-h-screen p-8">
            <div className="max-w-4xl mx-auto space-y-8">
                {/* Header */}
                <div className="text-center space-y-2">
                    <h1 className="text-5xl font-bold tracking-tight">
                        Ad<span className="text-accent-cyan">Scout</span>
                    </h1>
                    <p className="text-text-secondary">
                        Automated Ad Research & Market Validation
                    </p>
                </div>

                {/* Create Run Form */}
                <div className="card space-y-6">
                    <div>
                        <h2 className="text-2xl font-semibold mb-4">Create New Research Run</h2>
                        <p className="text-text-secondary text-sm">
                            Search for products/ebooks in foreign markets and validate against Argentina
                        </p>
                    </div>

                    {/* Country Selector */}
                    <div className="space-y-2">
                        <label className="block text-sm font-medium text-text-primary">
                            Target Country
                        </label>
                        <select
                            value={selectedCountry}
                            onChange={(e) => setSelectedCountry(e.target.value as Country)}
                            className="input w-full"
                        >
                            {Object.entries(COUNTRY_NAMES).map(([code, name]) => (
                                <option key={code} value={code}>
                                    {name}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Keywords Input */}
                    <div className="space-y-2">
                        <label className="block text-sm font-medium text-text-primary">
                            Keywords (one per line)
                        </label>
                        <textarea
                            value={keywords}
                            onChange={(e) => setKeywords(e.target.value)}
                            placeholder="ebook emagrecimento&#10;ebook fitness&#10;curso online"
                            rows={6}
                            className="input w-full font-mono text-sm"
                        />
                        <p className="text-text-tertiary text-xs">
                            Enter keywords in the target country's language (PT for Brazil, ES for Mexico/Colombia/Chile, EN for USA)
                        </p>
                    </div>

                    {/* Filters (expanded in future) */}
                    <div className="bg-background-secondary border border-border rounded-lg p-4 space-y-2">
                        <h3 className="text-sm font-semibold text-text-primary">Validation Filters</h3>
                        <div className="grid grid-cols-3 gap-4 text-xs text-text-secondary">
                            <div>
                                <span className="font-medium">Min Active Ads:</span> 20
                            </div>
                            <div>
                                <span className="font-medium">Uniproduct Ratio:</span> ≥80%
                            </div>
                            <div>
                                <span className="font-medium">Duplicates Score:</span> ≥30%
                            </div>
                        </div>
                    </div>

                    {/* Error Display */}
                    {error && (
                        <div className="bg-red-900/20 border border-red-500/50 rounded-lg p-4">
                            <p className="text-red-400 text-sm">{error}</p>
                        </div>
                    )}

                    {/* Success Display */}
                    {runId && (
                        <div className="bg-accent-cyan/10 border border-accent-cyan/50 rounded-lg p-4 space-y-2">
                            <p className="text-accent-cyan text-sm font-semibold">✓ Run Created Successfully</p>
                            <p className="text-text-secondary text-xs font-mono">Run ID: {runId}</p>
                            <a
                                href={`/runs/${runId}`}
                                className="inline-block text-accent-cyan hover:underline text-sm"
                            >
                                View Run Details →
                            </a>
                        </div>
                    )}

                    {/* Submit Button */}
                    <button
                        onClick={handleCreateRun}
                        disabled={isLoading}
                        className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isLoading ? (
                            <span className="flex items-center justify-center gap-2">
                                <span className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin"></span>
                                Creating Run...
                            </span>
                        ) : (
                            'Start Research'
                        )}
                    </button>
                </div>

                {/* Info Card */}
                <div className="card bg-background-secondary space-y-3">
                    <h3 className="text-lg font-semibold">How It Works</h3>
                    <ol className="space-y-2 text-sm text-text-secondary list-decimal list-inside">
                        <li>Select target country and enter keywords</li>
                        <li>AdScout searches Meta Ad Library for active advertisers</li>
                        <li>Validates advertisers (≥20 active ads, uniproduct 80%+, duplicates 30%+)</li>
                        <li>Compares candidates against Argentina market (Phase 3)</li>
                        <li>Recommends "copy as-is" or "copy + extras" based on replication</li>
                    </ol>
                </div>
            </div>
        </main>
    );
}
