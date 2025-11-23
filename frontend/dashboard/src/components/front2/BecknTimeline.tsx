import React from "react";

const BECKN_STEPS = [
  "DISCOVER",
  "SELECT",
  "INIT",
  "CONFIRM",
  "STATUS",
  "COMPLETE",
] as const;

export type BecknStep = (typeof BECKN_STEPS)[number];

interface BecknTimelineProps {
  currentStep: BecknStep;
  // opcionalmente timestamps por paso, ej: { DISCOVER: "14:23:01", SELECT: "14:23:02", ... }
  timestamps?: Partial<Record<BecknStep, string>>;
}

export const BecknTimeline: React.FC<BecknTimelineProps> = ({
  currentStep,
  timestamps = {},
}) => {
  const currentIndex = BECKN_STEPS.indexOf(currentStep);

  return (
    <div className="flex flex-col gap-4">
      {/* Timeline horizontal */}
      <div className="flex items-center justify-between gap-2">
        {BECKN_STEPS.map((step, index) => {
          const isCompleted = index < currentIndex;
          const isCurrent = index === currentIndex;

          return (
            <React.Fragment key={step}>
              {/* Step pill */}
              <div className="flex flex-col items-center gap-1 flex-1">
                <div
                  className={[
                    "w-9 h-9 md:w-10 md:h-10 rounded-full flex items-center justify-center text-[11px] font-semibold",
                    "transition-all duration-300",
                    isCurrent
                      ? "bg-emerald-400 text-slate-950 ring-2 ring-emerald-300 shadow-md shadow-emerald-500/30 scale-105"
                      : isCompleted
                      ? "bg-emerald-500 text-slate-950"
                      : "bg-slate-800 text-slate-400",
                  ].join(" ")}
                >
                  {isCompleted ? "✓" : step[0]}
                </div>
                <span className="text-[11px] text-slate-300 font-medium uppercase tracking-wide">
                  {step}
                </span>
                {timestamps[step] && (
                  <span className="text-[10px] text-slate-500">
                    {timestamps[step]}
                  </span>
                )}
              </div>

              {/* Connector */}
              {index < BECKN_STEPS.length - 1 && (
                <div
                  className={[
                    "flex-1 h-0.5 -mx-1 md:-mx-2 transition-colors duration-300",
                    index < currentIndex ? "bg-emerald-400" : "bg-slate-700",
                  ].join(" ")}
                />
              )}
            </React.Fragment>
          );
        })}
      </div>

      {/* Status summary */}
      <div className="text-[11px] text-slate-300 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
        <p>
          <span className="font-semibold text-emerald-300">Current step:</span>{" "}
          {currentStep}
        </p>
        <p className="text-slate-400">
          {currentIndex === BECKN_STEPS.length - 1
            ? "Workflow completed successfully."
            : `${
                BECKN_STEPS.length - currentIndex - 1
              } step(s) remaining in the Beckn flow.`}
        </p>
      </div>
    </div>
  );
};
