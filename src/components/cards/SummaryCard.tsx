import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Shield } from 'lucide-react';
import type { ConcernLevel } from '@/types/scan';

const levelColors: Record<ConcernLevel, string> = {
  Low: 'bg-[hsl(var(--severity-low))] text-white border-transparent',
  Medium: 'bg-[hsl(var(--severity-warning))] text-black border-transparent',
  High: 'bg-[hsl(var(--severity-high))] text-white border-transparent',
};

interface Props {
  domain: string;
  timestamp: string;
  concernLevel: ConcernLevel;
}

const SummaryCard = ({ domain, timestamp, concernLevel }: Props) => (
  <Card>
    <CardHeader className="pb-3">
      <CardTitle className="flex items-center gap-2 text-lg">
        <Shield className="h-5 w-5 text-primary" />
        Summary
      </CardTitle>
    </CardHeader>
    <CardContent className="space-y-2 text-sm">
      <div className="flex justify-between">
        <span className="text-muted-foreground">Domain</span>
        <span className="font-mono">{domain}</span>
      </div>
      <div className="flex justify-between">
        <span className="text-muted-foreground">Scanned</span>
        <span>{new Date(timestamp).toLocaleString()}</span>
      </div>
      <div className="flex justify-between items-center">
        <span className="text-muted-foreground">Concern Level</span>
        <Badge className={levelColors[concernLevel]}>{concernLevel}</Badge>
      </div>
    </CardContent>
  </Card>
);

export default SummaryCard;
