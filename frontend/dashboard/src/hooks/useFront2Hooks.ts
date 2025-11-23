import { useState, useEffect } from "react";
import type { FlexEvent } from "@/components/front2/EventsList";
import type { DERCardProps } from "@/components/front2/DERCard";
import type { AuditLog } from "@/components/front2/AuditView";
import type { BecknStep } from "@/components/front2/BecknTimeline";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? "http://localhost:8000";

/* ---------- Types ---------- */

export interface FeederState {
  id: string;
  state: number; // 0,1,2
  load_kw: number;
  threshold_kw: number;
  history_kw?: number[];
  forecast_kw?: number[];
}

/* ---------- Flex events ---------- */

/**
 * Hook to fetch active flexibility events.
 * Polls every 2.5 seconds as per SRS.
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
        const response = await fetch(`${API_BASE}/events/active`);
        if (!response.ok) throw new Error("Failed to fetch events");

        const data = await response.json();
        if (!isMounted) return;

        setEvents((data.events ?? []) as FlexEvent[]);
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

/* ---------- DERs ---------- */

/**
 * Hook to fetch available DERs.
 * Polls every 5 seconds.
 */
export const useDERs = () => {
  const [ders, setDers] = useState<DERCardProps[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const fetchDers = async () => {
      setIsLoading(true);
      try {
        const response = await fetch(`${API_BASE}/ders`);
        if (!response.ok) throw new Error("Failed to fetch DERs");

        const data = await response.json();
        if (!isMounted) return;

        setDers((data.ders ?? []) as DERCardProps[]);
        setError(null);
      } catch (err) {
        if (!isMounted) return;
        setError(err instanceof Error ? err.message : "Unknown error");
        console.error("Error fetching DERs:", err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    fetchDers();
    const interval = setInterval(fetchDers, 5000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  return { ders, isLoading, error };
};

/* ---------- Audit logs ---------- */

/**
 * Hook to fetch audit logs.
 * Optional OBP ID filter.
 */
export const useAuditLogs = (obpIdFilter?: string) => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const fetchLogs = async () => {
      setIsLoading(true);
      try {
        const url = obpIdFilter
          ? `${API_BASE}/audit/${obpIdFilter}`
          : `${API_BASE}/audit`;

        const response = await fetch(url);
        if (!response.ok) throw new Error("Failed to fetch audit logs");

        const data = await response.json();
        if (!isMounted) return;

        const normalized: AuditLog[] = Array.isArray(data) ? data : [data];
        setLogs(normalized);
        setError(null);
      } catch (err) {
        if (!isMounted) return;
        setError(err instanceof Error ? err.message : "Unknown error");
        console.error("Error fetching audit logs:", err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    fetchLogs();
    const interval = setInterval(fetchLogs, 5000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [obpIdFilter]);

  return { logs, isLoading, error };
};

/* ---------- Feeder state ---------- */

/**
 * Hook to fetch the current state of a feeder.
 * Polls every 2.5 seconds.
 */
export const useFeederState = (feederId: string | null) => {
  const [state, setState] = useState<FeederState | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!feederId) return;

    let isMounted = true;

    const fetchState = async () => {
      setIsLoading(true);
      try {
        const response = await fetch(
          `${API_BASE}/feeders/${encodeURIComponent(feederId)}/state`
        );
        if (!response.ok) throw new Error("Failed to fetch feeder state");

        const data = (await response.json()) as FeederState;
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

/* ---------- Realtime events (WebSocket, future) ---------- */

/**
 * Hook for real-time events via WebSocket (future enhancement).
 * Linter-friendly: setState only inside async handlers, no setState in effect body.
 */
export const useRealtimeEvents = () => {
  const [events, setEvents] = useState<FlexEvent[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let ws: WebSocket | null = null;

    const WS_BASE =
      process.env.NEXT_PUBLIC_WS_BASE ?? "ws://localhost:8000/ws/events";

    ws = new WebSocket(WS_BASE);

    ws.onopen = () => {
      setIsConnected(true);
      setError(null);
      console.log("WebSocket connected");
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        setEvents((data.events ?? []) as FlexEvent[]);
      } catch (err) {
        console.error("Error parsing WebSocket message:", err);
      }
    };

    ws.onerror = (event) => {
      setError("WebSocket error");
      setIsConnected(false);
      console.error("WebSocket error:", event);
    };

    ws.onclose = () => {
      setIsConnected(false);
    };

    return () => {
      ws?.close();
    };
  }, []);

  return { events, isConnected, error };
};

/* ---------- Beckn workflow progress (simulated) ---------- */

/**
 * Hook to simulate Beckn workflow progress.
 * In production this would come from backend.
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

/* ---------- Generic retry helper ---------- */

/**
 * Generic hook to execute an async function with retries and backoff.
 */
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
