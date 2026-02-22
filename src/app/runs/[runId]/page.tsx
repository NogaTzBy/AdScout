'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams } from 'next/navigation';
import type { GetRunResponse, CandidateResponse } from '@/types/api';
import { COUNTRY_NAMES } from '@/types/api';

/* ---------- helpers ---------- */
function timeAgo(dateStr: string): string {
    const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
    if (diff < 60) return 'Hace un momento';
    if (diff < 3600) return `Hace ${Math.floor(diff / 60)} min`;
    if (diff < 86400) return `Hace ${Math.floor(diff / 3600)} h`;
    return `Hace ${Math.floor(diff / 86400)} días`;
}

function ScoreGauge({ score }: { score: number }) {
    const r = 44;
    const circumference = 2 * Math.PI * r;
    const offset = circumference * (1 - score / 100);
    const color = score >= 70 ? '#FF5F1F' : score >= 40 ? '#f59e0b' : '#22c55e';
    const label = score >= 70 ? 'Competencia Muy Alta' : score >= 40 ? 'Competencia Media' : 'Mercado Libre';
    const statusLabel = score >= 70 ? 'Saturado' : score >= 40 ? 'Moderado' : 'Oportunidad';
    const statusClass = score >= 70 ? 'bg-red-50 text-red-500 border border-red-100' : score >= 40 ? 'bg-yellow-50 text-yellow-600 border border-yellow-100' : 'bg-green-50 text-green-600 border border-green-100';

    return (
        <div className="apple-card p-8 flex flex-col items-center">
            <div className="w-full flex justify-between items-center mb-10">
                <h3 className="text-[10px] font-bold text-soft-gray uppercase tracking-[0.15em]">Validación AR</h3>
                <span className={`px-2 py-0.5 text-[9px] font-bold rounded-md uppercase ${statusClass}`}>
                    {statusLabel}
                </span>
            </div>
            {/* Circular gauge */}
            <div className="relative w-48 h-48 flex items-center justify-center">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100"
                    style={{ filter: `drop-shadow(0 0 8px ${color}66)` }}>
                    <circle cx="50" cy="50" r={r} fill="transparent" stroke="#F2F2F7" strokeWidth="7" />
                    <circle
                        cx="50" cy="50" r={r}
                        fill="transparent"
                        stroke={color}
                        strokeWidth="7"
                        strokeDasharray={circumference}
                        strokeDashoffset={offset}
                        strokeLinecap="round"
                        className="transition-all duration-1000 ease-out"
                    />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-5xl font-bold tracking-tight text-ios-black">{score}%</span>
                    <span className="text-[9px] font-bold text-soft-gray uppercase tracking-[0.2em] mt-1">Similitud</span>
                </div>
            </div>
            <div className="w-full mt-10">
                <div className="bg-ios-black text-white text-center py-2.5 rounded-xl mb-4">
                    <span className="text-[10px] font-bold tracking-widest uppercase">{label}</span>
                </div>
                <p className="text-[11px] text-soft-gray text-center leading-relaxed">
                    El mercado local ya cuenta con oferta consolidada. La entrada requiere una estrategia de{' '}
                    <span className="font-bold text-ios-black">diferenciación por bundle</span> o valor agregado superior.
                </p>
            </div>
        </div>
    );
}

function DifferentiationCard() {
    return (
        <div className="bg-primary/5 rounded-[20px] p-6 border border-primary/10">
            <div className="flex items-center gap-2 mb-6">
                <span className="material-symbols-outlined text-primary text-xl">auto_awesome</span>
                <h4 className="text-[10px] font-bold text-primary uppercase tracking-widest">Diferenciación Sugerida</h4>
            </div>
            <div className="space-y-6">
                {[
                    { icon: 'card_giftcard', title: 'Bundle Kit Pro', desc: 'Aumenta el ticket promedio percibido.' },
                    { icon: 'workspace_premium', title: 'Garantía Local 6M', desc: 'Factor clave de conversión local.' },
                    { icon: 'video_library', title: 'Contenido UGC', desc: 'Anuncios en español nativo.' },
                ].map(item => (
                    <div key={item.title} className="flex gap-4">
                        <div className="w-9 h-9 shrink-0 bg-white rounded-lg flex items-center justify-center shadow-sm border border-primary/5">
                            <span className="material-symbols-outlined text-ios-black" style={{ fontSize: '18px' }}>{item.icon}</span>
                        </div>
                        <div>
                            <p className="text-xs font-bold text-ios-black">{item.title}</p>
                            <p className="text-[10px] text-soft-gray mt-0.5">{item.desc}</p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

function CandidateCard({ candidate, country }: { candidate: CandidateResponse; country: string }) {
    const now = new Date();
    const dateMax = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);   // hoy - 3 días
    const dateMin = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000); // hoy - 30 días
    const fmt = (d: Date) => d.toISOString().slice(0, 10);

    const adLibraryUrl = [
        'https://www.facebook.com/ads/library/',
        '?active_status=active',
        '&ad_type=all',
        `&country=${encodeURIComponent(country)}`,
        '&is_targeted_country=false',
        '&media_type=all',
        `&q=${encodeURIComponent(candidate.advertiserName)}`,
        '&search_type=keyword_unordered',
        `&start_date[min]=${fmt(dateMin)}`,
        `&start_date[max]=${fmt(dateMax)}`,
    ].join('');

    return (
        <div className="apple-card p-5">
            <div className="flex gap-4 mb-4">
                <div className="w-16 h-16 rounded-xl bg-ios-gray shrink-0 flex items-center justify-center">
                    <span className="material-symbols-outlined text-soft-gray" style={{ fontSize: '28px', fontVariationSettings: "'FILL' 0" }}>storefront</span>
                </div>
                <div className="flex-1 min-w-0">
                    <p className="text-[10px] uppercase tracking-widest text-primary font-bold mb-0.5">
                        Score: {candidate.totalScore}
                    </p>
                    <h4 className="font-bold text-sm truncate">{candidate.advertiserName}</h4>
                    <p className="text-[11px] text-soft-gray truncate">{candidate.productDetected || 'Producto detectado'}</p>
                </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
                <div className="bg-gray-50/80 p-2.5 rounded-xl border border-gray-100">
                    <span className="block text-[9px] text-soft-gray uppercase font-bold mb-0.5">Ads Activos (Origen)</span>
                    <span className="text-sm font-bold">{candidate.activeAdsCount}</span>
                </div>
                {candidate.arAdsCount !== undefined && candidate.arAdsCount !== null ? (
                    <div className="bg-blue-50/80 p-2.5 rounded-xl border border-blue-100">
                        <span className="block text-[9px] text-blue-600 uppercase font-bold mb-0.5">Ads en AR</span>
                        <span className="text-sm font-bold text-blue-700">{candidate.arAdsCount}</span>
                    </div>
                ) : (
                    <div className="bg-gray-50/80 p-2.5 rounded-xl border border-gray-100">
                        <span className="block text-[9px] text-soft-gray uppercase font-bold mb-0.5">Uniproduct</span>
                        <span className="text-sm font-bold">{(candidate.uniproductRatio * 100).toFixed(0)}%</span>
                    </div>
                )}
            </div>
            <a
                href={adLibraryUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-4 flex items-center justify-between text-xs font-semibold text-primary hover:underline"
            >
                <span>Ver en Ad Library</span>
                <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>open_in_new</span>
            </a>
        </div>
    );
}


function EmptyCandidates({ isLoading }: { isLoading: boolean }) {
    if (isLoading) {
        return (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[1, 2].map(i => (
                    <div key={i} className="apple-card p-5 animate-pulse">
                        <div className="flex gap-4 mb-4">
                            <div className="w-16 h-16 rounded-xl bg-ios-gray" />
                            <div className="flex-1 space-y-2">
                                <div className="h-3 bg-ios-gray rounded w-1/3" />
                                <div className="h-4 bg-ios-gray rounded w-2/3" />
                                <div className="h-3 bg-ios-gray rounded w-1/2" />
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        );
    }
    return (
        <div className="apple-card p-10 text-center">
            <span className="material-symbols-outlined text-soft-gray/40 block mb-3" style={{ fontSize: '40px' }}>search</span>
            <p className="font-semibold text-ios-black mb-1">Sin candidatos aún</p>
            <p className="text-sm text-soft-gray">El análisis está en progreso...</p>
        </div>
    );
}

/* ---------- main ---------- */
export default function RunDetailPage() {
    const params = useParams();
    const runId = params.runId as string;

    const [run, setRun] = useState<GetRunResponse | null>(null);
    const [candidates, setCandidates] = useState<CandidateResponse[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchData = useCallback(async () => {
        try {
            const [runRes, candidatesRes] = await Promise.all([
                fetch(`/api/runs/${runId}`),
                fetch(`/api/runs/${runId}/candidates`),
            ]);
            if (!runRes.ok) throw new Error('Run no encontrado');
            const [runData, candidatesData] = await Promise.all([runRes.json(), candidatesRes.json()]);
            setRun(runData);
            setCandidates(Array.isArray(candidatesData) ? candidatesData : []);
            setError(null);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Error desconocido');
        } finally {
            setLoading(false);
        }
    }, [runId]);

    useEffect(() => { fetchData(); }, [fetchData]);

    useEffect(() => {
        if (run?.status !== 'in_progress') return;
        const interval = setInterval(fetchData, 3000);
        return () => clearInterval(interval);
    }, [run?.status, fetchData]);

    // Calculate opportunity score based on AR ads count
    // Lower AR ads count = Higher opportunity (lower competition)
    const approvedCandidates = candidates.filter(c => c.status === 'approved_for_ar' && c.arAdsCount !== undefined && c.arAdsCount !== null);

    // Calculate average AR ads among approved candidates, max 100
    const avgArAds = approvedCandidates.length > 0
        ? approvedCandidates.reduce((sum, c) => sum + (c.arAdsCount || 0), 0) / approvedCandidates.length
        : 0;

    // Similarity/Competition score: >50 ads is 100% saturated
    const similarityScore = approvedCandidates.length > 0
        ? Math.min(100, Math.round((avgArAds / 50) * 100))
        : 0;

    if (loading) {
        return (
            <div className="flex h-screen items-center justify-center bg-ios-bg">
                <div className="text-center space-y-3">
                    <div className="w-10 h-10 border-2 border-primary/30 border-t-primary rounded-full animate-spin mx-auto" />
                    <p className="text-soft-gray text-sm">Cargando análisis...</p>
                </div>
            </div>
        );
    }

    if (error || !run) {
        return (
            <div className="flex h-screen items-center justify-center bg-ios-bg">
                <div className="apple-card p-10 text-center max-w-md">
                    <span className="material-symbols-outlined text-5xl text-red-400 block mb-4">error</span>
                    <p className="font-bold text-ios-black mb-2">{error || 'Run no encontrado'}</p>
                    <a href="/dashboard" className="inline-flex items-center gap-2 mt-4 px-6 py-3 bg-ios-black text-white text-sm font-semibold rounded-full hover:bg-black transition-colors">
                        ← Volver al Panel
                    </a>
                </div>
            </div>
        );
    }

    const country = COUNTRY_NAMES[run.country] || run.country;
    const topCandidates = candidates.slice(0, 4);

    return (
        <div className="flex h-screen overflow-hidden bg-ios-bg font-sans">
            {/* Sidebar */}
            <aside className="w-64 bg-white border-r border-gray-100 flex flex-col h-full shrink-0 z-50">
                <a href="/dashboard" className="p-6 flex items-center gap-3 hover:opacity-80 transition-opacity">
                    <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                        <span className="material-symbols-outlined text-white" style={{ fontSize: '18px', fontVariationSettings: "'FILL' 1" }}>radar</span>
                    </div>
                    <span className="font-bold text-xl tracking-tight">AdScout</span>
                </a>

                <nav className="flex-1 px-3 space-y-1">
                    <div className="text-[10px] font-bold text-soft-gray/60 uppercase tracking-widest px-4 mb-2 mt-4">Exploración</div>
                    <a href="/dashboard" className="sidebar-item">
                        <span className="material-symbols-outlined">explore</span>
                        Explorar
                    </a>
                    <a href="#" className="sidebar-item active">
                        <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>analytics</span>
                        Análisis de Productos
                    </a>
                    <a href="#" className="sidebar-item">
                        <span className="material-symbols-outlined">public</span>
                        Mercados Globales
                    </a>
                    <div className="text-[10px] font-bold text-soft-gray/60 uppercase tracking-widest px-4 mb-2 mt-6">Herramientas</div>
                    <a href="#" className="sidebar-item">
                        <span className="material-symbols-outlined">monitoring</span>
                        Validación AR
                    </a>
                    <a href="/dashboard" className="sidebar-item">
                        <span className="material-symbols-outlined">history</span>
                        Historial
                    </a>
                </nav>

                <div className="p-4 mt-auto border-t border-gray-100">
                    <a href="#" className="sidebar-item">
                        <span className="material-symbols-outlined">settings</span>
                        Configuración
                    </a>
                </div>
            </aside>

            {/* Main content */}
            <main className="flex-1 flex flex-col overflow-hidden">
                {/* Top header */}
                <header className="h-16 bg-white/80 backdrop-blur-xl border-b border-gray-100 flex items-center justify-between px-8 z-40 shrink-0">
                    <div className="flex items-center gap-2">
                        <a href="/dashboard" className="text-xs font-medium text-soft-gray hover:text-ios-black transition-colors">Panel</a>
                        <span className="text-xs text-gray-300">/</span>
                        <span className="text-xs font-semibold text-ios-black truncate max-w-xs">
                            {country} — {run.keywords.slice(0, 2).join(', ')}
                        </span>
                        {run.status === 'in_progress' && (
                            <span className="ml-2 flex items-center gap-1.5 text-xs text-yellow-600 font-medium">
                                <span className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse" />
                                Procesando...
                            </span>
                        )}
                    </div>
                    <div className="flex items-center gap-4">
                        <button className="px-4 py-1.5 bg-ios-black text-white text-xs font-semibold rounded-full hover:bg-black transition-colors flex items-center gap-1.5">
                            <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>download</span>
                            Exportar Reporte
                        </button>
                        <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                            <span className="material-symbols-outlined text-primary" style={{ fontSize: '16px' }}>person</span>
                        </div>
                    </div>
                </header>

                {/* Scrollable body */}
                <div className="flex-1 overflow-y-auto p-8 no-scrollbar">
                    <div className="max-w-7xl mx-auto">
                        {/* Page title */}
                        <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-4">
                            <div>
                                <div className="flex items-center gap-3 mb-2">
                                    <h2 className="text-3xl font-bold tracking-tight">Análisis de Similitud</h2>
                                    <span className="px-3 py-1 bg-orange-50 text-primary text-[10px] font-bold rounded-full border border-primary/10 uppercase tracking-wide">
                                        Mercado Argentino
                                    </span>
                                </div>
                                <p className="text-soft-gray text-sm max-w-xl">
                                    Evaluación técnica de saturación y potencial de escalado basado en el comportamiento de candidatos externos.
                                </p>
                            </div>
                        </div>

                        {/* Two-column layout */}
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                            {/* Left: candidates + replicators */}
                            <div className="lg:col-span-8 space-y-8">
                                {/* Candidatos externos */}
                                <section>
                                    <div className="flex items-center justify-between mb-4">
                                        <h3 className="text-sm font-bold text-ios-black uppercase tracking-widest">Candidatos Externos</h3>
                                        <span className="text-xs font-semibold text-soft-gray">{candidates.length} encontrados</span>
                                    </div>
                                    {topCandidates.length > 0 ? (
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            {topCandidates.map(c => <CandidateCard key={c.id} candidate={c} country={run.country} />)}
                                        </div>
                                    ) : (
                                        <EmptyCandidates isLoading={run.status === 'in_progress'} />
                                    )}
                                </section>

                                {/* Run info */}
                                <section>
                                    <div className="flex items-center justify-between mb-4">
                                        <h3 className="text-sm font-bold text-ios-black uppercase tracking-widest">Detalles del Run</h3>
                                    </div>
                                    <div className="apple-card overflow-hidden">
                                        <div className="divide-y divide-gray-50">
                                            {/* Run ID */}
                                            <div className="flex items-center justify-between p-4">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-10 h-10 rounded-lg bg-ios-gray flex items-center justify-center">
                                                        <span className="material-symbols-outlined text-soft-gray" style={{ fontSize: '18px' }}>tag</span>
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-bold">Run ID</p>
                                                        <p className="text-[10px] text-soft-gray font-mono truncate max-w-[200px]">{run.id}</p>
                                                    </div>
                                                </div>
                                            </div>
                                            {/* Keywords */}
                                            <div className="p-4">
                                                <div className="flex items-center gap-4 mb-3">
                                                    <div className="w-10 h-10 rounded-lg bg-ios-gray flex items-center justify-center">
                                                        <span className="material-symbols-outlined text-soft-gray" style={{ fontSize: '18px' }}>label</span>
                                                    </div>
                                                    <p className="text-sm font-bold">Keywords analizadas</p>
                                                </div>
                                                <div className="flex flex-wrap gap-2 pl-14">
                                                    {run.keywords.map(kw => (
                                                        <span key={kw} className="px-2.5 py-1 bg-ios-gray rounded-lg text-xs font-semibold text-ios-black">
                                                            {kw}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                            {/* Timestamps */}
                                            <div className="flex items-center justify-between p-4">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-10 h-10 rounded-lg bg-ios-gray flex items-center justify-center">
                                                        <span className="material-symbols-outlined text-soft-gray" style={{ fontSize: '18px' }}>schedule</span>
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-bold">Iniciado</p>
                                                        <p className="text-[10px] text-soft-gray">{timeAgo(run.createdAt)}</p>
                                                    </div>
                                                </div>
                                                {run.finishedAt && (
                                                    <div className="text-right">
                                                        <p className="text-xs font-bold text-ios-black">
                                                            {Math.round((new Date(run.finishedAt).getTime() - new Date(run.createdAt).getTime()) / 1000)}s
                                                        </p>
                                                        <p className="text-[9px] text-soft-gray uppercase">Duración</p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </section>
                            </div>

                            {/* Right: gauge + suggestions */}
                            <div className="lg:col-span-4 space-y-8">
                                <ScoreGauge score={similarityScore} />
                                <DifferentiationCard />
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
