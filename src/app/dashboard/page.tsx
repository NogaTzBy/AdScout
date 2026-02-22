'use client';

import { useState, useEffect } from 'react';
import { COUNTRY_NAMES, type Country } from '@/types/api';

const COUNTRY_OPTIONS = [
    { code: 'BR' as Country, label: 'Brasil (BR)' },
    { code: 'MX' as Country, label: 'México (MX)' },
    { code: 'CO' as Country, label: 'Colombia (CO)' },
    { code: 'CL' as Country, label: 'Chile (CL)' },
    { code: 'US' as Country, label: 'Estados Unidos (US)' },
];

const STATUS_CONFIG = {
    in_progress: { label: 'ANALIZANDO', badge: 'badge-pending', dot: 'bg-yellow-400 animate-pulse' },
    completed: { label: 'ÉXITO', badge: 'badge-success', dot: 'bg-green-500' },
    error: { label: 'ERROR', badge: 'badge-error', dot: 'bg-red-500' },
} as const;

const RUN_ICONS = ['monitoring', 'auto_awesome', 'home_max', 'rocket_launch', 'analytics', 'explore'];

interface RunSummary {
    id: string;
    country: Country;
    keywords: string[];
    status: 'in_progress' | 'completed' | 'error';
    createdAt: string;
    finishedAt?: string;
    summaryLogs?: string;
}

function timeAgo(dateStr: string): string {
    const now = Date.now();
    const then = new Date(dateStr).getTime();
    const diff = Math.floor((now - then) / 1000);
    if (diff < 60) return 'Hace un momento';
    if (diff < 3600) return `Hace ${Math.floor(diff / 60)} min`;
    if (diff < 86400) return `Hace ${Math.floor(diff / 3600)} h`;
    return `Hace ${Math.floor(diff / 86400)} días`;
}

export default function DashboardPage() {
    const [selectedCountry, setSelectedCountry] = useState<Country>('BR');
    const [keywords, setKeywords] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [runId, setRunId] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [pastRuns, setPastRuns] = useState<RunSummary[]>([]);
    const [loadingRuns, setLoadingRuns] = useState(true);

    const fetchRuns = async () => {
        try {
            const res = await fetch('/api/runs');
            if (res.ok) setPastRuns(await res.json());
        } catch { /* silently ignore */ }
        finally { setLoadingRuns(false); }
    };

    useEffect(() => { fetchRuns(); }, []);

    const handleCreateRun = async () => {
        setError(null);
        setIsLoading(true);
        try {
            const keywordsArray = keywords.split(/[\n,]/).map(k => k.trim()).filter(Boolean);
            if (!keywordsArray.length) { setError('Ingresá al menos una keyword'); return; }

            const res = await fetch('/api/runs/create', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    country: selectedCountry,
                    keywords: keywordsArray,
                    filters: { minActiveAds: 20, minUniproductRatio: 0.8, minDuplicatesScore: 0.3 },
                }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Error al crear el run');
            setRunId(data.runId);
            fetchRuns();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Error desconocido');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <>
            {/* Background glows */}
            <div className="fixed top-0 right-0 w-[500px] h-[500px] bg-primary/5 blur-[120px] rounded-full -z-10 opacity-50 pointer-events-none" />
            <div className="fixed bottom-0 left-0 w-[400px] h-[400px] bg-primary/5 blur-[100px] rounded-full -z-10 opacity-40 pointer-events-none" />

            {/* Header */}
            <header className="fixed top-0 left-0 right-0 bg-white/80 backdrop-blur-xl z-50 border-b border-gray-100">
                <div className="max-w-7xl mx-auto px-8 h-20 flex items-center justify-between">
                    <div className="flex items-center gap-8">
                        <div className="flex items-center gap-4">
                            <button className="size-10 flex items-center justify-center rounded-full hover:bg-ios-gray transition-colors">
                                <span className="material-symbols-outlined">menu</span>
                            </button>
                            <h1 className="text-2xl font-bold tracking-tight text-ios-black">AdScout</h1>
                        </div>
                        <nav className="hidden md:flex items-center gap-6">
                            <a className="text-sm font-semibold text-ios-black" href="#">Panel</a>
                            <a className="text-sm font-medium text-soft-gray hover:text-ios-black transition-colors" href="#">Proyectos</a>
                            <a className="text-sm font-medium text-soft-gray hover:text-ios-black transition-colors" href="#">Tutoriales</a>
                        </nav>
                    </div>
                    <div className="flex items-center gap-4">
                        <button className="flex items-center justify-center size-10 rounded-full hover:bg-ios-gray transition-colors">
                            <span className="material-symbols-outlined text-ios-black">notifications</span>
                        </button>
                        <div className="h-8 w-px bg-gray-200 mx-2" />
                        <div className="flex items-center gap-3 pl-2">
                            <span className="text-sm font-semibold text-ios-black">Mi Cuenta</span>
                            <div className="size-10 rounded-full bg-primary/20 border border-gray-100 shadow-sm flex items-center justify-center">
                                <span className="material-symbols-outlined text-primary text-lg">person</span>
                            </div>
                        </div>
                    </div>
                </div>
            </header>

            <main className="pt-32 pb-20 px-8 max-w-7xl mx-auto">

                {/* Hero Form */}
                <section className="mb-16">
                    <div className="max-w-4xl mx-auto">
                        <div className="bg-white rounded-2xl p-10 shadow-premium border border-gray-50 text-center">
                            <div className="inline-flex items-center justify-center size-16 rounded-2xl bg-primary/10 mb-6">
                                <span className="material-symbols-outlined text-primary" style={{ fontSize: '30px', fontVariationSettings: "'FILL' 1" }}>rocket_launch</span>
                            </div>
                            <h2 className="text-3xl font-bold text-ios-black mb-2">Nueva Corrida de Análisis</h2>
                            <p className="text-soft-gray text-lg mb-10">
                                Validá productos en Meta Ads con inteligencia de mercado avanzada.
                            </p>

                            <div className="grid md:grid-cols-2 gap-6 text-left">
                                {/* Country */}
                                <div className="space-y-2">
                                    <label className="block text-[11px] font-bold uppercase tracking-[0.1em] text-soft-gray ml-1">
                                        País de Análisis
                                    </label>
                                    <div className="relative">
                                        <select
                                            value={selectedCountry}
                                            onChange={(e) => setSelectedCountry(e.target.value as Country)}
                                            className="w-full h-14 bg-ios-gray border-none rounded-xl px-5 text-ios-black font-semibold focus:ring-2 focus:ring-primary/20 appearance-none transition-all cursor-pointer text-sm"
                                        >
                                            {COUNTRY_OPTIONS.map(c => (
                                                <option key={c.code} value={c.code}>{c.label}</option>
                                            ))}
                                        </select>
                                        <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 text-soft-gray pointer-events-none">
                                            expand_more
                                        </span>
                                    </div>
                                </div>
                                {/* Keywords */}
                                <div className="space-y-2">
                                    <label className="block text-[11px] font-bold uppercase tracking-[0.1em] text-soft-gray ml-1">
                                        Palabras Clave
                                    </label>
                                    <input
                                        type="text"
                                        value={keywords}
                                        onChange={(e) => setKeywords(e.target.value)}
                                        placeholder="Ej: Belleza, Tecnología, Fitness..."
                                        className="w-full h-14 bg-ios-gray border-none rounded-xl px-5 text-ios-black font-semibold placeholder:text-soft-gray/60 focus:ring-2 focus:ring-primary/20 transition-all text-sm"
                                    />
                                </div>
                            </div>

                            {/* Error */}
                            {error && (
                                <div className="mt-6 p-4 bg-red-50 border border-red-100 rounded-xl text-red-500 text-sm text-left">
                                    {error}
                                </div>
                            )}

                            {/* Success */}
                            {runId && !error && (
                                <div className="mt-6 p-4 bg-green-50 border border-green-100 rounded-xl text-left">
                                    <p className="text-sm font-semibold text-green-700 mb-1">✓ Run creado exitosamente</p>
                                    <a href={`/runs/${runId}`} className="text-sm text-primary font-semibold hover:underline">
                                        Ver resultados del análisis →
                                    </a>
                                </div>
                            )}

                            <div className="mt-10 flex justify-center">
                                <button
                                    onClick={handleCreateRun}
                                    disabled={isLoading}
                                    className="h-16 px-12 bg-ios-black hover:bg-black transition-all text-white font-bold rounded-full flex items-center gap-3 shadow-xl hover:shadow-2xl hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                                >
                                    {isLoading ? (
                                        <>
                                            <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                            <span className="text-lg">Procesando...</span>
                                        </>
                                    ) : (
                                        <>
                                            <span className="text-lg">Empezar Análisis</span>
                                            <span className="material-symbols-outlined">trending_flat</span>
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </section>

                {/* History */}
                <section>
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h3 className="text-xl font-bold text-ios-black">Historial Reciente</h3>
                            <p className="text-sm text-soft-gray">Tus últimas validaciones ejecutadas</p>
                        </div>
                        <button
                            onClick={fetchRuns}
                            className="px-5 py-2.5 rounded-full border border-gray-200 text-sm font-bold hover:bg-ios-gray transition-colors flex items-center gap-2"
                        >
                            Actualizar
                            <span className="material-symbols-outlined text-sm">refresh</span>
                        </button>
                    </div>

                    {loadingRuns ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {[1, 2, 3].map(i => (
                                <div key={i} className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm animate-pulse">
                                    <div className="flex items-start justify-between mb-4">
                                        <div className="size-12 rounded-xl bg-ios-gray" />
                                        <div className="h-6 w-20 rounded-full bg-ios-gray" />
                                    </div>
                                    <div className="h-4 bg-ios-gray rounded w-3/4 mb-2" />
                                    <div className="h-3 bg-ios-gray rounded w-1/2" />
                                </div>
                            ))}
                        </div>
                    ) : pastRuns.length === 0 ? (
                        <div className="text-center py-20 bg-white rounded-xl border border-gray-100">
                            <span className="material-symbols-outlined text-5xl text-soft-gray/40 mb-4 block" style={{ fontSize: '48px' }}>inbox</span>
                            <p className="font-semibold text-ios-black mb-1">No hay corridas todavía</p>
                            <p className="text-sm text-soft-gray">Hacé tu primer análisis arriba ↑</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {pastRuns.map((run, i) => {
                                const status = STATUS_CONFIG[run.status] || STATUS_CONFIG.in_progress;
                                const icon = RUN_ICONS[i % RUN_ICONS.length];
                                const country = COUNTRY_NAMES[run.country] || run.country;
                                const kwLabel = run.keywords.slice(0, 2).join(', ') + (run.keywords.length > 2 ? ` +${run.keywords.length - 2}` : '');

                                return (
                                    <a
                                        key={run.id}
                                        href={`/runs/${run.id}`}
                                        className="group bg-white p-6 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-all hover:-translate-y-1 cursor-pointer block"
                                    >
                                        <div className="flex items-start justify-between mb-4">
                                            <div className="size-12 rounded-xl bg-ios-gray flex items-center justify-center group-hover:bg-primary/10 transition-colors">
                                                <span className="material-symbols-outlined text-ios-black group-hover:text-primary transition-colors">
                                                    {icon}
                                                </span>
                                            </div>
                                            <span className={`badge ${status.badge}`}>
                                                {status.label}
                                            </span>
                                        </div>
                                        <h4 className="text-base font-bold text-ios-black mb-1 truncate">{kwLabel}</h4>
                                        <p className="text-sm text-soft-gray mb-4">{country} • {timeAgo(run.createdAt)}</p>
                                        <div className="h-px w-full bg-gray-50 mb-4" />
                                        <div className="flex items-center justify-between text-xs font-semibold">
                                            <span className="text-soft-gray">
                                                {run.keywords.length} keyword{run.keywords.length !== 1 ? 's' : ''}
                                            </span>
                                            <span className="text-primary group-hover:underline">Ver reporte</span>
                                        </div>
                                    </a>
                                );
                            })}
                        </div>
                    )}
                </section>
            </main>
        </>
    );
}
