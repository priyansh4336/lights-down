import { useState, useEffect, useCallback } from 'react';

export function useCountdown(initialSeconds = 90) {
  const [seconds, setSeconds] = useState(initialSeconds);
  const [running, setRunning] = useState(false);

  const startCountdown = useCallback((duration = initialSeconds) => {
    setSeconds(duration);
    setRunning(true);
  }, [initialSeconds]);

  const stopCountdown = useCallback(() => {
    setRunning(false);
  }, []);

  useEffect(() => {
    if (!running) return undefined;
    const timer = setInterval(() => {
      setSeconds((prev) => {
        if (prev <= 1) {
          setRunning(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [running]);

  return {
    countdownSeconds: seconds,
    countdownRunning: running,
    startCountdown,
    stopCountdown
  };
}
