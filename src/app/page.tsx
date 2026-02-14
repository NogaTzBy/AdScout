export default function Home() {
    return (
        <main className="min-h-screen flex items-center justify-center p-8">
            <div className="text-center space-y-8 max-w-2xl">
                <div className="space-y-3">
                    <h1 className="text-6xl font-bold tracking-tight">
                        Ad<span className="text-accent-cyan">Scout</span>
                    </h1>
                    <p className="text-text-secondary text-xl">
                        Automated Ad Research & Market Validation
                    </p>
                </div>

                <div className="card space-y-6">
                    <div className="space-y-3">
                        <h2 className="text-2xl font-semibold">Phase 2 Complete ✓</h2>
                        <p className="text-text-secondary">
                            Ad Library integration is ready. Search for products across Brazil, Mexico, Colombia, Chile, and USA markets.
                        </p>
                    </div>

                    <div className="space-y-3">
                        <a href="/dashboard" className="btn-primary block">
                            Go to Dashboard →
                        </a>
                        <p className="text-text-tertiary text-sm">
                            Start a research run to find product opportunities
                        </p>
                    </div>
                </div>

                <div className="card bg-background-secondary space-y-4 text-left">
                    <h3 className="text-lg font-semibold">Quick Start</h3>
                    <ol className="space-y-2 text-sm text-text-secondary list-decimal list-inside">
                        <li>Configure your .env file with Supabase credentials</li>
                        <li>Apply database schema from supabase/migrations/</li>
                        <li>Select target country (BR, MX, CO, CL, US)</li>
                        <li>Enter keywords in the country's language</li>
                        <li>Click "Start Research" and view validated candidates</li>
                    </ol>
                </div>
            </div>
        </main>
    );
}
