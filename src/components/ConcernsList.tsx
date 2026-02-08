import { AlertTriangle, ShieldAlert, Info } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import type { Concern, Severity } from '@/types/scan';

const severityConfig: Record<Severity, { icon: typeof AlertTriangle; label: string; className: string }> = {
  high: { icon: ShieldAlert, label: 'High', className: 'bg-[hsl(var(--severity-high))] text-white border-transparent' },
  warning: { icon: AlertTriangle, label: 'Warning', className: 'bg-[hsl(var(--severity-warning))] text-black border-transparent' },
  info: { icon: Info, label: 'Info', className: 'bg-[hsl(var(--severity-info))] text-white border-transparent' },
};

const ConcernsList = ({ concerns }: { concerns: Concern[] }) => {
  if (!concerns.length) return null;

  const sorted = [...concerns].sort((a, b) => {
    const order: Record<Severity, number> = { high: 0, warning: 1, info: 2 };
    return order[a.severity] - order[b.severity];
  });

  return (
    <div className="space-y-2">
      <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Concerns</h3>
      <div className="space-y-1.5">
        {sorted.map((c, i) => {
          const config = severityConfig[c.severity];
          const Icon = config.icon;
          return (
            <div key={i} className="flex items-center gap-2 text-sm">
              <Badge className={config.className + ' text-xs gap-1 shrink-0'}>
                <Icon className="h-3 w-3" />
                {config.label}
              </Badge>
              <span className="text-foreground">{c.message}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ConcernsList;
