import { useState, useEffect } from 'react';

/**
 * Hook para obtener eventos de flexibilidad activos
 * Hacer polling cada 2-3 segundos como especifica el SRS
 */
export const useFlexEvents = () => {
  const [events, setEvents] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchEvents = async () => {
      setIsLoading(true);
      try {
        const response = await fetch('http://localhost:8000/events/active');
        if (!response.ok) throw new Error('Failed to fetch events');
        
        const data = await response.json();
        setEvents(data.events || []);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
        console.error('Error fetching flex events:', err);
      } finally {
        setIsLoading(false);
      }
    };

    // Fetch inicial
    fetchEvents();

    // Polling cada 2.5 segundos
    const interval = setInterval(fetchEvents, 2500);

    return () => clearInterval(interval);
  }, []);

  return { events, isLoading, error };
};

/**
 * Hook para obtener DERs disponibles
 */
export const useDERs = () => {
  const [ders, setDers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDers = async () => {
      setIsLoading(true);
      try {
        const response = await fetch('http://localhost:8000/ders');
        if (!response.ok) throw new Error('Failed to fetch DERs');
        
        const data = await response.json();
        setDers(data.ders || []);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
        console.error('Error fetching DERs:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDers();

    // Actualizar cada 5 segundos
    const interval = setInterval(fetchDers, 5000);

    return () => clearInterval(interval);
  }, []);

  return { ders, isLoading, error };
};

/**
 * Hook para obtener logs de auditoría
 * Soporta filtrado por rango de tiempo
 */
export const useAuditLogs = (obpIdFilter?: string) => {
  const [logs, setLogs] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchLogs = async () => {
      setIsLoading(true);
      try {
        // Si hay un filtro de OBP ID específico
        const url = obpIdFilter
          ? `http://localhost:8000/audit/${obpIdFilter}`
          : 'http://localhost:8000/audit';

        const response = await fetch(url);
        if (!response.ok) throw new Error('Failed to fetch audit logs');
        
        const data = await response.json();
        setLogs(Array.isArray(data) ? data : [data]);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
        console.error('Error fetching audit logs:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchLogs();

    // Actualizar cada 5 segundos
    const interval = setInterval(fetchLogs, 5000);

    return () => clearInterval(interval);
  }, [obpIdFilter]);

  return { logs, isLoading, error };
};

/**
 * Hook para obtener el estado actual de un feeder
 */
export const useFeederState = (feederId: string) => {
  const [state, setState] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!feederId) return;

    const fetchState = async () => {
      setIsLoading(true);
      try {
        const response = await fetch(`http://localhost:8000/feeders/${feederId}/state`);
        if (!response.ok) throw new Error('Failed to fetch feeder state');
        
        const data = await response.json();
        setState(data);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
        console.error(`Error fetching state for feeder ${feederId}:`, err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchState();

    // Polling cada 2.5 segundos
    const interval = setInterval(fetchState, 2500);

    return () => clearInterval(interval);
  }, [feederId]);

  return { state, isLoading, error };
};

/**
 * Hook para WebSocket en tiempo real (future feature)
 * Útil para reducir latencia en actualizaciones de eventos
 */
export const useRealtimeEvents = () => {
  const [events, setEvents] = useState<any[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    try {
      const ws = new WebSocket('ws://localhost:8000/ws/events');

      ws.onopen = () => {
        setIsConnected(true);
        setError(null);
        console.log('WebSocket connected');
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          setEvents(data.events || []);
        } catch (err) {
          console.error('Error parsing WebSocket message:', err);
        }
      };

      ws.onerror = (event) => {
        setError('WebSocket error');
        setIsConnected(false);
        console.error('WebSocket error:', event);
      };

      ws.onclose = () => {
        setIsConnected(false);
      };

      return () => {
        ws.close();
      };
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      console.error('Error setting up WebSocket:', err);
    }
  }, []);

  return { events, isConnected, error };
};

/**
 * Hook para simular el progreso del Beckn workflow
 * En producción, esto vendría del backend
 */
export const useBecknProgress = () => {
  const [currentStep, setCurrentStep] = useState<string>('DISCOVER');
  const [timestamps, setTimestamps] = useState<Record<string, string>>({});

  const advanceStep = () => {
    const steps = ['DISCOVER', 'SELECT', 'INIT', 'CONFIRM', 'STATUS', 'COMPLETE'];
    const currentIndex = steps.indexOf(currentStep);
    
    if (currentIndex < steps.length - 1) {
      const nextStep = steps[currentIndex + 1];
      setCurrentStep(nextStep);
      
      // Actualizar timestamp
      const now = new Date();
      const timeStr = now.toLocaleTimeString('es-AR');
      setTimestamps(prev => ({
        ...prev,
        [nextStep]: timeStr
      }));
    }
  };

  const reset = () => {
    setCurrentStep('DISCOVER');
    setTimestamps({});
  };

  return { currentStep, timestamps, advanceStep, reset };
};

/**
 * Hook para manejo de errores y reintentos
 */
export const useRetry = (fn: () => Promise<any>, maxRetries = 3) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<any>(null);

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
        lastError = err instanceof Error ? err : new Error('Unknown error');
        console.warn(`Attempt ${i + 1} failed:`, lastError);
        
        // Esperar exponencialmente: 1s, 2s, 4s
        if (i < maxRetries - 1) {
          await new Promise(resolve => setTimeout(resolve, Math.pow(2, i) * 1000));
        }
      }
    }

    setError(lastError?.message || 'Max retries reached');
    setIsLoading(false);
  };

  return { execute, isLoading, error, data };
};
