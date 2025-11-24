// frontend/dashboard/src/hooks/useFront2Hooks.ts
import { useEffect, useState } from "react";

import type { FlexEvent } from "@/components/front2/EventsList";
import type { BecknStep } from "@/components/front2/BecknTimeline";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? "http://localhost:8000";

/* -------------------------------------------------------------------------- */
/*                                Backend DTOs                                */
/* -------------------------------------------------------------------------- */

interface BackendEventDTO {
  event_id: string;
  feeder_id: string;
  status: string; // Beckn step: DISCOVER/SELECT/INIT/CONFIRM/STATUS/COMPLETE/FAILED
  requested_kw: number;
  delivered_kw: number;
}

interface BackendAuditEntryDTO {
  ts: string;
  message: string;
}

interface BackendAuditDTO {
  obp_id: string;
  entries: BackendAuditEntryDTO[];
}

/* ------------------------------ Feeders (list) ----------------------------- */

export interface FeederSummary {
  id: string;
  name: string;
  state: number; // 0: Normal, 1: Warning, 2: Critical
  load_kw: number;
  temperature?: number;
}

/* ----------------------------- Feeder state v2 ----------------------------- */

export interface FeederReading {
  timestamp: string;
  load_kw: number;
  temperature?: number;
  is_workday?: boolean;
  risk_label?: number;
}

/**
 * Estado detallado de un feeder.
 * Lo definimos como unión “flexible” para soportar backend nuevo (AI)
 * y backend antiguo (simple) sin romper el tipado en LoadChart/Dashboard.
 */
export interface FeederStateResponse {
  // Versión nueva AI
  feeder_id?: string;
  timestamp?: string;
  risk_level?: number; // 0/1/2
  current_load_kw?: number;
  forecast_load_kw?: number;
  message?: string;
  recent_history?: FeederReading[];

  // Versión antigua simple / simulador
  id?: string;
  state?: number;
  load_kw?: number;
  threshold_kw?: number;
  critical_threshold_kw?: number;
  history_kw?: number[];
  forecast_kw?: number[];
  temperature?: number;
}

/* -------------------------------------------------------------------------- */
/*                              Feeders overview                              */
/* -------------------------------------------------------------------------- */

/**
 * Hook para listar feeders con estado agregado
 * GET /feeders
 */
export const useFeederSummaries = () => {
  const [feeders, setFeeders] = useState<FeederSummary[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const fetchFeeders = async () => {
      setIsLoading(true);
      try {
        const response = await fetch(`${API_BASE}/feeders`, {
          cache: "no-store",
        });
        if (!response.ok) throw new Error("Failed to fetch feeders");

        const data = (await response.json()) as FeederSummary[];
        if (!isMounted) return;

        setFeeders(data);
        setError(null);
      } catch (err) {
        if (!isMounted) return;
        setError(err instanceof Error ? err.message : "Unknown error");
        console.error("Error fetching feeders:", err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    fetchFeeders();
    const interval = setInterval(fetchFeeders, 2500); // 2.5s como en el SRS

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  return { feeders, isLoading, error };
};

/* -------------------------------------------------------------------------- */
/*                               Feeder state                                 */
/* -------------------------------------------------------------------------- */

/**
 * Hook para el estado detallado de un feeder
 * GET /feeders/{id}/state
 */
export const useFeederState = (feederId: string | null) => {
  const [state, setState] = useState<FeederStateResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!feederId) {
      setState(null);
      setError(null);
      return;
    }

    let isMounted = true;

    const fetchState = async () => {
      setIsLoading(true);
      try {
        const response = await fetch(
          `${API_BASE}/feeders/${encodeURIComponent(feederId)}/state`,
          { cache: "no-store" }
        );
        if (!response.ok) throw new Error("Failed to fetch feeder state");

        const data = (await response.json()) as FeederStateResponse;
        if (!isMounted) return;

        setState(data);
        setError(null);
      } catch (err) {
        if (!isMounted) return;
        setError(err instanceof Error ? err.message : "Unknown error");
        console.error(`Error fetching state for feeder ${feederId}:`, err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    fetchState();
    const interval = setInterval(fetchState, 2500);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [feederId]);

  return { state, isLoading, error };
};

/* -------------------------------------------------------------------------- */
/*                              Flex events (Beckn)                           */
/* -------------------------------------------------------------------------- */

const BECKN_STEPS: BecknStep[] = [
  "DISCOVER",
  "SELECT",
  "INIT",
  "CONFIRM",
  "STATUS",
  "COMPLETE",
];

const mapBackendEventToFlexEvent = (e: BackendEventDTO): FlexEvent => {
  // 1) Normalizamos el estado “visual” de la card
  const normalizedStatus: FlexEvent["status"] = (() => {
    if (e.status === "COMPLETE") return "COMPLETED";
    if (e.status === "FAILED") return "FAILED";
    // DISCOVER/SELECT/INIT/CONFIRM/STATUS => ACTIVE
    return "ACTIVE";
  })();

  // 2) Intentamos interpretar el status del backend como BecknStep
  const maybeBecknStep = BECKN_STEPS.includes(e.status as BecknStep)
    ? (e.status as BecknStep)
    : undefined;

  return {
    id: e.event_id,
    feederId: e.feeder_id,
    feederName: `Feeder ${e.feeder_id}`,
    status: normalizedStatus,
    flexRequested: e.requested_kw,
    flexDelivered: e.delivered_kw,
    // Fijos para evitar problemas de SSR/hydration
    timestamp: "2025-11-22T10:00:00Z",
    derCount: 3,
    obpId: `OBP-${e.event_id}`,
    becknStep: maybeBecknStep,
  };
};

/**
 * Hook para eventos activos de flexibilidad
 * GET /events/active
 */
export const useFlexEvents = () => {
  const [events, setEvents] = useState<FlexEvent[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const fetchEvents = async () => {
      setIsLoading(true);
      try {
        const response = await fetch(`${API_BASE}/events/active`, {
          cache: "no-store",
        });
        if (!response.ok) throw new Error("Failed to fetch events");

        const data = (await response.json()) as BackendEventDTO[];
        if (!isMounted) return;

        setEvents(data.map(mapBackendEventToFlexEvent));
        setError(null);
      } catch (err) {
        if (!isMounted) return;
        setError(err instanceof Error ? err.message : "Unknown error");
        console.error("Error fetching flex events:", err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    fetchEvents();
    const interval = setInterval(fetchEvents, 2500);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  return { events, isLoading, error };
};

/* -------------------------------------------------------------------------- */
/*                               Audit (OBP trail)                            */
/* -------------------------------------------------------------------------- */

export interface SimpleAuditEntry {
  ts: string;
  message: string;
}

export interface SimpleAuditLog {
  obpId: string;
  entries: SimpleAuditEntry[];
}

/**
 * Hook para leer el trail de un OBP concreto
 * GET /audit/{obp_id}
 */
export const useAuditTrail = (obpId?: string) => {
  const [log, setLog] = useState<SimpleAuditLog | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!obpId) {
      setLog(null);
      setError(null);
      return;
    }

    let isMounted = true;

    const fetchLog = async () => {
      setIsLoading(true);
      try {
        const response = await fetch(
          `${API_BASE}/audit/${encodeURIComponent(obpId)}`,
          { cache: "no-store" }
        );
        if (!response.ok) throw new Error("Failed to fetch audit log");

        const data = (await response.json()) as BackendAuditDTO;
        if (!isMounted) return;

        setLog({
          obpId: data.obp_id,
          entries: data.entries,
        });
        setError(null);
      } catch (err) {
        if (!isMounted) return;
        setError(err instanceof Error ? err.message : "Unknown error");
        console.error("Error fetching audit log:", err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    fetchLog();

    return () => {
      isMounted = false;
    };
  }, [obpId]);

  return { log, isLoading, error };
};

/* -------------------------------------------------------------------------- */
/*                          Beckn workflow (simulado)                         */
/* -------------------------------------------------------------------------- */

/**
 * Hook para simular el progreso Beckn en UI.
 * En producción esto vendría del backend.
 */
export const useBecknProgress = () => {
  const steps: BecknStep[] = [
    "DISCOVER",
    "SELECT",
    "INIT",
    "CONFIRM",
    "STATUS",
    "COMPLETE",
  ];

  const [currentStep, setCurrentStep] = useState<BecknStep>("DISCOVER");
  const [timestamps, setTimestamps] = useState<
    Partial<Record<BecknStep, string>>
  >({});

  const advanceStep = () => {
    const currentIndex = steps.indexOf(currentStep);

    if (currentIndex < steps.length - 1) {
      const nextStep = steps[currentIndex + 1];
      setCurrentStep(nextStep);

      const now = new Date();
      const timeStr = now.toLocaleTimeString();
      setTimestamps((prev) => ({
        ...prev,
        [nextStep]: timeStr,
      }));
    }
  };

  const reset = () => {
    setCurrentStep("DISCOVER");
    setTimestamps({});
  };

  return { currentStep, timestamps, advanceStep, reset };
};

/* -------------------------------------------------------------------------- */
/*                        WebSocket realtime (future)                         */
/* -------------------------------------------------------------------------- */

export const useRealtimeEvents = () => {
  const [events, setEvents] = useState<FlexEvent[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const WS_BASE =
      process.env.NEXT_PUBLIC_WS_BASE ?? "ws://localhost:8000/ws/events";

    let ws: WebSocket | null = null;
    let isMounted = true;

    try {
      ws = new WebSocket(WS_BASE);

      ws.onopen = () => {
        if (!isMounted) return;
        setIsConnected(true);
        setError(null);
        console.log("WebSocket connected");
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data) as { events?: FlexEvent[] };
          if (!isMounted) return;
          setEvents(data.events ?? []);
        } catch (err) {
          console.error("Error parsing WebSocket message:", err);
        }
      };

      ws.onerror = (event) => {
        if (!isMounted) return;
        setError("WebSocket error");
        setIsConnected(false);
        console.error("WebSocket error:", event);
      };

      ws.onclose = () => {
        if (!isMounted) return;
        setIsConnected(false);
      };
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      // Schedule state update to avoid synchronous setState inside effect
      setTimeout(() => {
        if (!isMounted) return;
        setError(msg);
      }, 0);
      console.error("Error setting up WebSocket:", err);
    }

    return () => {
      isMounted = false;
      ws?.close();
    };
  }, []);

  return { events, isConnected, error };
};

/* -------------------------------------------------------------------------- */
/*                             Generic retry helper                           */
/* -------------------------------------------------------------------------- */

export const useRetry = <T>(fn: () => Promise<T>, maxRetries = 3) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<T | null>(null);

  const execute = async () => {
    setIsLoading(true);
    setError(null);
    let lastError: Error | null = null;

    for (let i = 0; i < maxRetries; i++) {
      try {
        const result = await fn();
        setData(result);
        setIsLoading(false);
        return result;
      } catch (err) {
        lastError = err instanceof Error ? err : new Error("Unknown error");
        console.warn(`Attempt ${i + 1} failed:`, lastError);

        if (i < maxRetries - 1) {
          await new Promise((resolve) =>
            setTimeout(resolve, Math.pow(2, i) * 1000)
          );
        }
      }
    }

    setError(lastError?.message ?? "Max retries reached");
    setIsLoading(false);
    return null;
  };

  return { execute, isLoading, error, data };
};
