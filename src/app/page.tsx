export default function Home() {
    return (
        <main className="min-h-screen flex items-center justify-center p-8">
            <div className="text-center space-y-6">
                <div className="space-y-2">
                    <h1 className="text-6xl font-bold tracking-tight">
                        Ad<span className="text-accent-cyan">Scout</span>
                    </h1>
                    <p className="text-text-secondary text-lg">
                        Automated Ad Research & Market Validation
                    </p>
                </div>

                <div className="card max-w-md mx-auto space-y-4 card-hover">
                    <h2 className="text-xl font-semibold">Setup in Progress</h2>
                    <p className="text-text-secondary text-sm">
                        The application is being configured. Database setup and core features coming next.
                    </p>
                    <div className="flex gap-3 justify-center pt-4">
                        <div className="w-2 h-2 bg-accent-cyan rounded-full animate-pulse"></div>
                        <div className="w-2 h-2 bg-accent-cyan rounded-full animate-pulse delay-75"></div>
                        <div className="w-2 h-2 bg-accent-cyan rounded-full animate-pulse delay-150"></div>
                    </div>
                </div>
            </div>
        </main>
    );
}
