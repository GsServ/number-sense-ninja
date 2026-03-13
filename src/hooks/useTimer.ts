import { useState, useRef, useCallback, useEffect } from 'react';

interface UseTimerOptions {
  initialMs?: number;
  countDown?: boolean;
  onComplete?: () => void;
}

export function useTimer({ initialMs = 0, countDown = false, onComplete }: UseTimerOptions = {}) {
  const [ms, setMs] = useState(initialMs);
  const [running, setRunning] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  const tick = useCallback(() => {
    setMs(prev => {
      if (countDown) {
        const next = prev - 100;
        if (next <= 0) {
          return 0;
        }
        return next;
      }
      return prev + 100;
    });
  }, [countDown]);

  useEffect(() => {
    if (countDown && ms <= 0 && running) {
      stop();
      onCompleteRef.current?.();
    }
  }, [ms, countDown, running]);

  const start = useCallback(() => {
    if (intervalRef.current) return;
    setRunning(true);
    intervalRef.current = setInterval(tick, 100);
  }, [tick]);

  const stop = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setRunning(false);
  }, []);

  const reset = useCallback((newMs?: number) => {
    stop();
    setMs(newMs ?? initialMs);
  }, [stop, initialMs]);

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const displaySeconds = seconds % 60;

  return {
    ms,
    seconds,
    minutes,
    displaySeconds,
    running,
    start,
    stop,
    reset,
    formatted: `${minutes}:${displaySeconds.toString().padStart(2, '0')}`,
  };
}
