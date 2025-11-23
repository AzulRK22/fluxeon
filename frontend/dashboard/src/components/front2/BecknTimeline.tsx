import React from 'react';

interface BecknTimelineProps {
  currentStep: 'DISCOVER' | 'SELECT' | 'INIT' | 'CONFIRM' | 'STATUS' | 'COMPLETE';
  timestamps?: Record<string, string>;
}

const BECKN_STEPS = ['DISCOVER', 'SELECT', 'INIT', 'CONFIRM', 'STATUS', 'COMPLETE'] as const;

export const BecknTimeline: React.FC<BecknTimelineProps> = ({ 
  currentStep, 
  timestamps = {} 
}) => {
  const currentIndex = BECKN_STEPS.indexOf(currentStep);

  return (
    <div className="w-full bg-slate-900 rounded-lg p-6 border border-slate-700">
      <h3 className="text-sm font-semibold text-slate-300 mb-4 uppercase tracking-wider">
        Beckn Workflow
      </h3>
      
      {/* Timeline Horizontal */}
      <div className="flex items-center justify-between gap-2">
        {BECKN_STEPS.map((step, index) => {
          const isCompleted = index < currentIndex;
          const isCurrent = index === currentIndex;
          const isUpcoming = index > currentIndex;

          return (
            <React.Fragment key={step}>
              {/* Pill/Badge */}
              <div className="flex flex-col items-center gap-1 flex-1">
                <div
                  className={`
                    w-12 h-12 rounded-full flex items-center justify-center text-xs font-bold
                    transition-all duration-300
                    ${
                      isCurrent
                        ? 'bg-green-500 text-white scale-110 ring-2 ring-green-400'
                        : isCompleted
                        ? 'bg-green-600 text-white'
                        : 'bg-slate-700 text-slate-400'
                    }
                  `}
                >
                  {isCompleted ? '✓' : step[0]}
                </div>
                <span className="text-xs text-slate-400 font-medium">{step}</span>
                {timestamps[step] && (
                  <span className="text-xs text-slate-500">{timestamps[step]}</span>
                )}
              </div>

              {/* Connector Line */}
              {index < BECKN_STEPS.length - 1 && (
                <div
                  className={`
                    flex-1 h-1 transition-colors duration-300 -mx-1
                    ${
                      isCompleted || isCurrent
                        ? 'bg-green-500'
                        : 'bg-slate-700'
                    }
                  `}
                />
              )}
            </React.Fragment>
          );
        })}
      </div>

      {/* Status Info */}
      <div className="mt-6 p-3 bg-slate-800 rounded border border-slate-600">
        <p className="text-xs text-slate-300">
          <span className="font-semibold text-green-400">Current Step:</span> {currentStep}
        </p>
        <p className="text-xs text-slate-400 mt-1">
          {currentIndex === BECKN_STEPS.length - 1
            ? 'Workflow completed successfully'
            : `${BECKN_STEPS.length - currentIndex - 1} step(s) remaining`}
        </p>
      </div>
    </div>
  );
};
