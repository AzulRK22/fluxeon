import type { Metadata } from "next";
import "./globals.css";
import { Inter } from "next/font/google";
import Link from "next/link";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "FLUXEON Command Centre",
  description: "DSO copilot for grid-scale flexibility orchestration.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="min-h-screen">
      <body
        className={`${inter.className} bg-[#020617] text-slate-100 antialiased`}
      >
        <div className="min-h-screen flex flex-col">
          <header className="border-b border-slate-800 px-6 py-3 bg-[#020617]/95 backdrop-blur flex items-center justify-between">
            <div>
              <h1 className="text-xl font-semibold tracking-tight">
                FLUXEON <span className="text-emerald-400">Command Centre</span>
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">
                Monitor feeders, detect risk, dispatch flexibility in seconds.
              </p>
            </div>

            {/* 🔹 Navegación entre vistas */}
            <nav className="flex items-center gap-4 text-xs text-slate-400">
              <Link href="/" className="hover:text-slate-100">
                Overview
              </Link>
              <span className="h-4 w-px bg-slate-700" />
              <Link href="/front2" className="hover:text-slate-100">
                Flex orchestration
              </Link>
            </nav>

            <div className="hidden sm:flex items-center gap-2 text-xs text-slate-400">
              <span className="inline-flex items-center gap-1">
                <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                Backend: online
              </span>
            </div>
          </header>

          <main className="flex-1 px-6 py-5">
            <div className="max-w-6xl mx-auto space-y-4">{children}</div>
          </main>
        </div>
      </body>
    </html>
  );
}
