import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ShieldCheck } from 'lucide-react';
import type { SocSignals } from '@/types/scan';

const SocCard = ({ data }: { data: SocSignals }) => (
  <Card>
    <CardHeader className="pb-3">
      <CardTitle className="flex items-center gap-2 text-lg">
        <ShieldCheck className="h-5 w-5 text-primary" />
        SOC & Trust Signals
      </CardTitle>
    </CardHeader>
    <CardContent className="space-y-2 text-sm">
      <div className="flex justify-between">
        <span className="text-muted-foreground">SOC Claimed</span>
        <Badge variant={data.socClaimed ? 'default' : 'secondary'}>
          {data.socClaimed ? 'Yes' : 'No'}
        </Badge>
      </div>
      <div className="flex justify-between">
        <span className="text-muted-foreground">Access Type</span>
        <span className="capitalize">{data.accessType}</span>
      </div>
      {data.urls.length > 0 && (
        <div className="pt-1 space-y-1">
          <span className="text-muted-foreground text-xs">Supporting URLs</span>
          {data.urls.map((url, i) => (
            <a key={i} href={url} target="_blank" rel="noopener noreferrer"
              className="block text-primary hover:underline text-xs font-mono truncate">
              {url}
            </a>
          ))}
        </div>
      )}
    </CardContent>
  </Card>
);

export default SocCard;
