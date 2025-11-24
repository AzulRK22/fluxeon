// frontend/dashboard/src/app/layout.tsx
import type { Metadata } from "next";
import "./globals.css";
import { Inter } from "next/font/google";
import Link from "next/link";
import Image from "next/image";
import BackendStatusBadge from "@/components/BackendStatusBadge";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "FLUXEON Command Centre",
  description:
    "FLUXEON – DSO copilot for grid-scale flexibility orchestration using AI and Beckn.",
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
          {/* Top shell / app chrome */}
          <header className="border-b border-slate-800 px-6 py-3 bg-[#020617]/95 backdrop-blur flex items-center justify-between gap-4">
            {/* Brand block */}
            <div className="flex items-center gap-3">
              {/* Tu logo */}
              <div className="h-9 w-9 rounded-xl bg-slate-900/60 flex items-center justify-center overflow-hidden ">
                <Image
                  src="/logoof.png"
                  alt="FLUXEON logo"
                  width={40}
                  height={40}
                  className="object-contain"
                  priority
                />
              </div>

              <div className="space-y-0.5">
                <h1 className="text-lg sm:text-xl font-semibold tracking-tight">
                  <span className="text-slate-100">FLUXEON</span>{" "}
                  <span className="bg-linear-to-r from-emerald-400 via-sky-400 to-blue-400 bg-clip-text text-transparent">
                    Command Centre
                  </span>
                </h1>
                <p className="text-[11px] sm:text-xs text-slate-500">
                  DSO copilot for grid-scale demand flexibility &amp; Beckn
                  orchestration.
                </p>
              </div>
            </div>

            {/* Navigation */}
            <nav className="hidden sm:flex items-center gap-2 text-xs">
              <Link
                href="/"
                className="px-3 py-1.5 rounded-full border border-slate-700/80 bg-slate-900/60 text-slate-100 font-medium hover:border-sky-500/80 hover:text-sky-100 transition-colors"
              >
                Overview
              </Link>
              <Link
                href="/front2"
                className="px-3 py-1.5 rounded-full border border-slate-700/80 bg-slate-900/30 text-slate-400 hover:border-emerald-500/80 hover:text-emerald-100 transition-colors"
              >
                Flex orchestration
              </Link>
              <Link
                href="/events"
                className="px-3 py-1.5 rounded-full border border-slate-700/80 bg-slate-900/30 text-slate-400 hover:border-purple-500/80 hover:text-purple-100 transition-colors"
              >
                Events Centre
              </Link>
            </nav>

            {/* Status / meta info */}
            <div className="flex flex-col items-end gap-1 text-[11px] text-slate-400">
              <div className="hidden sm:flex items-center gap-2">
                <BackendStatusBadge />
              </div>
              <span className="hidden md:inline-flex px-2 py-0.5 rounded-full border border-slate-700 bg-slate-900/70 text-[10px] uppercase tracking-wide">
                Hackathon demo · FLUXEON v0.1
              </span>
            </div>
          </header>

          {/* Main content */}
          <main className="flex-1 px-4 sm:px-6 py-5">
            <div className="max-w-6xl mx-auto space-y-4">{children}</div>
          </main>

          {/* Optional slim footer */}
          <footer className="border-t border-slate-800 px-6 py-2 text-[11px] text-slate-500 bg-[#020617]/95">
            <div className="max-w-6xl mx-auto flex items-center justify-between gap-2">
              <span>
                © {new Date().getFullYear()} FLUXEON · Grid-flexibility copilot.
              </span>
              <span className="hidden sm:inline">
                Beckn-ready · AI classification 0/1/2 · Sub-5s SLA target.
              </span>
            </div>
          </footer>
        </div>
      </body>
    </html>
  );
}
