import type { Metadata } from "next";
import "./globals.css";
import { Inter } from "next/font/google";

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
    <html lang="en">
      <body className={`${inter.className} bg-slate-950 text-slate-100`}>
        <div className="min-h-screen flex flex-col">
          <header className="border-b border-slate-800 px-6 py-3 flex items-center justify-between bg-slate-950/80 backdrop-blur">
            <h1 className="text-xl font-semibold tracking-tight">
              FLUXEON <span className="text-[#00E698]">Command Centre</span>
            </h1>
            <span className="text-xs text-slate-400">
              DSO Copilot · Grid Flexibility
            </span>
          </header>
          <main className="flex-1 px-6 py-4 bg-linear-to-b from-slate-950 to-slate-900">
            <div className="max-w-6xl mx-auto">{children}</div>
          </main>
        </div>
      </body>
    </html>
  );
}
