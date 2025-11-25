// frontend/dashboard/src/components/front2/BecknTimeline.tsx
"use client";

import React from "react";

export type BecknStep =
  | "DISCOVER"
  | "SELECT"
  | "INIT"
  | "CONFIRM"
  | "STATUS"
  | "COMPLETE";

const STEPS: BecknStep[] = [
  "DISCOVER",
  "SELECT",
  "INIT",
  "CONFIRM",
  "STATUS",
  "COMPLETE",
];

interface BecknTimelineProps {
  currentStep: BecknStep;
  timestamps: Partial<Record<BecknStep, string>>;

  /** Fase 2: controles opcionales de simulación */
  showControls?: boolean;
  onAdvance?: () => void;
  onReset?: () => void;
}

export const BecknTimeline: React.FC<BecknTimelineProps> = ({
  currentStep,
  timestamps,
  showControls = false,
  onAdvance,
  onReset,
}) => {
  const currentIndex = STEPS.indexOf(currentStep);

  return (
    <div className="w-full">
      {/* Controles opcionales de simulación */}
      {showControls && (
        <div className="flex items-center justify-end gap-2 mb-3 text-[11px]">
          <button
            type="button"
            onClick={onAdvance}
            className="px-2.5 py-1 rounded-full border border-sky-500/60 bg-sky-500/10 text-sky-200 hover:bg-sky-500/20 transition-colors font-semibold"
          >
            Advance step
          </button>
          <button
            type="button"
            onClick={onReset}
            className="px-2.5 py-1 rounded-full border border-slate-600 bg-slate-800/70 text-slate-200 hover:bg-slate-700 transition-colors font-semibold"
          >
            Reset workflow
          </button>
        </div>
      )}

      <ol className="flex items-center justify-between gap-2">
        {STEPS.map((step, index) => {
          const isDone = index < currentIndex;
          const isActive = index === currentIndex;

          const ts = timestamps[step];

          return (
            <li
              key={step}
              className="flex-1 flex flex-col items-center min-w-0"
            >
              {/* Punto + línea */}
              <div className="flex items-center w-full">
                {/* Left connector */}
                {index > 0 && (
                  <div
                    className={[
                      "h-px flex-1 transition-all duration-500",
                      isDone
                        ? "bg-emerald-400"
                        : isActive
                        ? "bg-sky-400"
                        : "bg-slate-700",
                    ].join(" ")}
                  />
                )}

                {/* Dot with animation */}
                <div
                  className={[
                    "shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-semibold transition-all duration-300",
                    isDone
                      ? "bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/50"
                      : isActive
                      ? "bg-sky-400 text-slate-950 shadow-lg shadow-sky-400/50 animate-pulse"
                      : "bg-slate-800 text-slate-400 border border-slate-600",
                  ].join(" ")}
                >
                  {isDone ? "✓" : index + 1}
                </div>

                {/* Right connector */}
                {index < STEPS.length - 1 && (
                  <div
                    className={[
                      "h-px flex-1 transition-all duration-500",
                      isDone || isActive ? "bg-sky-400" : "bg-slate-700",
                    ].join(" ")}
                  />
                )}
              </div>

              {/* Label + timestamp */}
              <div className="mt-2 text-center">
                <p
                  className={[
                    "text-[11px] uppercase tracking-wide font-semibold transition-colors duration-300",
                    isActive
                      ? "text-sky-300"
                      : isDone
                      ? "text-emerald-300"
                      : "text-slate-500",
                  ].join(" ")}
                >
                  {step}
                </p>
                {/* Timestamp with highlight */}
                {ts && (
                  <p
                    className={[
                      "text-[10px] mt-1 px-2 py-0.5 rounded-full inline-block font-mono transition-all duration-300",
                      isDone
                        ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                        : isActive
                        ? "bg-sky-500/20 text-sky-300 border border-sky-500/30 animate-pulse"
                        : "bg-slate-800/50 text-slate-500",
                    ].join(" ")}
                  >
                    {ts}
                  </p>
                )}
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
};
