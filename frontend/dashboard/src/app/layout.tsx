import type { Metadata } from "next";
import "./globals.css";

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
      <body className="bg-slate-950 text-slate-100">
        <div className="min-h-screen flex flex-col">
          <header className="border-b border-slate-800 px-6 py-3 flex items-center justify-between bg-slate-950/80 backdrop-blur">
            <h1 className="text-xl font-semibold tracking-tight">
              FLUXEON <span className="text-emerald-400">Command Centre</span>
            </h1>
            <span className="text-xs text-slate-400">
              DSO Copilot · Grid Flexibility
            </span>
          </header>
          <main className="flex-1 px-6 py-4">{children}</main>
        </div>
      </body>
    </html>
  );
}
