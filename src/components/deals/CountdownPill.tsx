import { Badge } from "@/components/ui/badge";
import { useCountdown } from "@/lib/useCountdown";

function pad(n: number) {
  return String(n).padStart(2, "0");
}

export default function CountdownPill({ endsAt }: { endsAt: string }) {
  const c = useCountdown(endsAt);
  if (c.isComplete) return <Badge variant="secondary">Ended</Badge>;

  const label = c.days > 0 ? `${c.days}d ${pad(c.hours)}:${pad(c.minutes)}` : `${pad(c.hours)}:${pad(c.minutes)}:${pad(c.seconds)}`;
  return (
    <Badge className="bg-brand text-brand-foreground hover:bg-brand/90" aria-label={`Time left ${label}`}>
      {label} left
    </Badge>
  );
}
