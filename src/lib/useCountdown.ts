import * as React from "react";

export type Countdown = {
  totalMs: number;
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  isComplete: boolean;
};

function toCountdown(totalMs: number): Countdown {
  const safe = Math.max(0, totalMs);
  const seconds = Math.floor(safe / 1000);
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  return {
    totalMs: safe,
    days,
    hours,
    minutes,
    seconds: secs,
    isComplete: safe === 0,
  };
}

export function useCountdown(targetIso: string) {
  const target = React.useMemo(() => new Date(targetIso).getTime(), [targetIso]);
  const [now, setNow] = React.useState(() => Date.now());

  React.useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, []);

  return React.useMemo(() => toCountdown(target - now), [now, target]);
}
