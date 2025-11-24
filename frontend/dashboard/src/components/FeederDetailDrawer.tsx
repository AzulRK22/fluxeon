// frontend/dashboard/src/components/FeederDetailDrawer.tsx
"use client";

import { useState, useMemo } from "react";
import StatusChip from "./StatusChip";
import type { Feeder } from "./FeederTable";
import { useFeederState } from "@/hooks/useFront2Hooks";

// Local minimal declaration for FeederStateV1 because the hook doesn't export it.
// Expand this type with additional fields if the backend/hook starts exposing them.
type FeederStateV1 = {
  load_kw?: number;
  threshold_kw?: number;
  critical_threshold_kw?: number;
};

interface Props {
  feeder: Feeder;
  onClose: () => void;
}

/**
 * Extendemos el tipo del hook por si el backend algún día
 * añade campos nuevos (current_load_kw, recent_history, etc.).
 * No usamos `any`, solo añadimos opcionales.
 */
type ExtendedFeederState = FeederStateV1 & {
  current_load_kw?: number;
  recent_history?: { temperature?: number }[];
};

export default function FeederDetailDrawer({ feeder, onClose }: Props) {
  const { state, isLoading, error } = useFeederState(feeder.id);

  // Lo tratamos como extendido, pero sin `any`
  const extState = state as ExtendedFeederState | null;

  // --- Normalizaciones sobre el shape del backend ---

  // Live load: primero backend (current_load_kw si existe, luego load_kw),
  // y si no, el valor de la tabla.
  const liveLoad = useMemo(() => {
    if (extState?.current_load_kw != null) return extState.current_load_kw;
    if (extState?.load_kw != null) return extState.load_kw;
    return feeder.load_kw;
  }, [extState, feeder.load_kw]);

  // Temperatura: último punto del recent_history, o la de la tabla, o null
  const temperature = useMemo(() => {
    const history = extState?.recent_history;
    if (history && history.length > 0) {
      const last = history[history.length - 1];
      if (typeof last.temperature === "number") return last.temperature;
    }
    return feeder.temperature ?? null;
  }, [extState, feeder.temperature]);

  // Thresholds: si el backend no los manda, los derivamos del liveLoad
  const thresholdKw = useMemo(() => {
    if (extState?.threshold_kw != null) return extState.threshold_kw;
    return liveLoad != null ? Math.round(liveLoad * 0.85) : undefined;
  }, [extState, liveLoad]);

  const criticalThresholdKw = useMemo(() => {
    if (extState?.critical_threshold_kw != null) {
      return extState.critical_threshold_kw;
    }
    return liveLoad != null ? Math.round(liveLoad * 0.95) : undefined;
  }, [extState, liveLoad]);

  const isOverThreshold =
    thresholdKw != null && liveLoad != null ? liveLoad >= thresholdKw : false;

  const estimatedReliefKw =
    thresholdKw != null && liveLoad != null && liveLoad > thresholdKw
      ? Math.max(0, Math.round(liveLoad - thresholdKw))
      : 0;

  // Mensajes de acciones simuladas
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  const handleProposeFlex = () => {
    if (!estimatedReliefKw) {
      setActionMessage(
        "No flexibility required: current load is below the AI threshold."
      );
      return;
    }

    setActionMessage(
      `Proposed dispatch: ${estimatedReliefKw} kW of flexibility (e.g. 60% battery, 40% EV chargers).`
    );
  };

  const handleMuteAlerts = () => {
    setActionMessage(
      "Alerts muted for this feeder for the next 30 minutes (simulated UI-only)."
    );
  };

  return (
    <section className="mt-4 border border-slate-800 rounded-2xl bg-[#02091F] px-4 py-4 shadow-lg shadow-emerald-500/5">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div>
          <h2 className="text-sm font-semibold text-slate-100">
            {feeder.name} — Feeder control
          </h2>
          <p className="text-[11px] text-slate-400 mt-0.5">
            AI-powered risk &amp; quick actions for this feeder.
          </p>
        </div>
        <button
          onClick={onClose}
          className="text-slate-400 hover:text-slate-200 text-sm transition-colors"
        >
          ✕
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Columna 1: Estado actual */}
        <div className="space-y-2">
          <div>
            <p className="text-[11px] text-slate-500 mb-0.5">Feeder ID</p>
            <p className="text-sm font-medium text-slate-100">{feeder.id}</p>
          </div>

          <div>
            <p className="text-[11px] text-slate-500 mb-0.5">Current state</p>
            <StatusChip state={feeder.state} showCode />
          </div>

          <div>
            <p className="text-[11px] text-slate-500 mb-0.5">Live load</p>
            <p className="text-sm font-semibold text-sky-300">
              {liveLoad != null && Number.isFinite(liveLoad)
                ? `${liveLoad.toFixed(1)} kW`
                : "–"}
            </p>
          </div>

          {temperature != null && Number.isFinite(temperature) && (
            <div>
              <p className="text-[11px] text-slate-500 mb-0.5">Temperature</p>
              <p className="text-sm font-medium text-amber-300">
                {temperature.toFixed(1)} °C
              </p>
            </div>
          )}
        </div>

        {/* Columna 2: Umbrales & AI */}
        <div className="space-y-2">
          <div>
            <p className="text-[11px] text-slate-500 mb-0.5">Threshold</p>
            <p className="text-sm font-medium text-red-400">
              {thresholdKw != null && Number.isFinite(thresholdKw)
                ? `${thresholdKw.toFixed(1)} kW`
                : "–"}
            </p>
          </div>

          {criticalThresholdKw != null &&
            Number.isFinite(criticalThresholdKw) && (
              <div>
                <p className="text-[11px] text-slate-500 mb-0.5">
                  Critical threshold
                </p>
                <p className="text-sm font-medium text-red-300">
                  {criticalThresholdKw.toFixed(1)} kW
                </p>
              </div>
            )}

          <div>
            <p className="text-[11px] text-slate-500 mb-0.5">AI insight</p>
            {error && (
              <p className="text-[11px] text-red-300">
                Error loading AI state.
              </p>
            )}
            {!error && isLoading && (
              <p className="text-[11px] text-slate-400">
                Pulling AI state from backend…
              </p>
            )}
            {!error && !isLoading && (
              <p className="text-[11px] text-slate-300">
                {isOverThreshold
                  ? "Load is above the AI threshold — flexibility is recommended."
                  : "Load is below the AI threshold — operating in safe band."}
              </p>
            )}
          </div>

          {estimatedReliefKw > 0 && (
            <div>
              <p className="text-[11px] text-slate-500 mb-0.5">
                Recommended relief
              </p>
              <p className="text-sm font-medium text-emerald-300">
                {estimatedReliefKw} kW flexibility to bring it below threshold.
              </p>
            </div>
          )}
        </div>

        {/* Columna 3: Acciones rápidas */}
        <div className="space-y-2">
          <p className="text-[11px] text-slate-500 mb-1">Quick actions</p>

          <button
            onClick={handleProposeFlex}
            className="w-full rounded-lg bg-emerald-500/90 hover:bg-emerald-400 text-slate-950 text-xs font-semibold py-2 transition-colors"
          >
            Propose flexibility plan
          </button>

          <button
            onClick={handleMuteAlerts}
            className="w-full rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-100 text-xs font-semibold py-2 transition-colors"
          >
            Mute alerts for 30 min
          </button>

          {actionMessage && (
            <div className="mt-2 rounded-lg border border-slate-700 bg-slate-900/80 px-3 py-2">
              <p className="text-[11px] text-slate-300 leading-relaxed">
                {actionMessage}
              </p>
            </div>
          )}

          <p className="mt-2 text-[10px] text-slate-500">
            Actions are simulated UI-side to illustrate how the DSO copilot
            would orchestrate flexibility and alert policies.
          </p>
        </div>
      </div>
    </section>
  );
}
