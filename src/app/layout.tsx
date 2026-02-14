import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
    title: "AdScout - Automated Ad Research",
    description: "Automated product research and validation across markets",
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en">
            <body className="antialiased">
                {children}
            </body>
        </html>
    );
}
