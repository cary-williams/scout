import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { FileCheck } from 'lucide-react';
import type { FrameworkClaim } from '@/types/scan';

const FrameworkCard = ({ data }: { data: FrameworkClaim[] }) => (
  <Card>
    <CardHeader className="pb-3">
      <CardTitle className="flex items-center gap-2 text-lg">
        <FileCheck className="h-5 w-5 text-primary" />
        Framework Claims
      </CardTitle>
    </CardHeader>
    <CardContent className="space-y-3 text-sm">
      {data.map((fw) => (
        <div key={fw.name} className="flex items-center justify-between gap-2">
          <span className="text-foreground">{fw.name}</span>
          <div className="flex items-center gap-2">
            {fw.claimed && (
              <span className="text-xs text-muted-foreground">{Math.round(fw.confidence * 100)}%</span>
            )}
            <Badge variant={fw.claimed ? 'default' : 'secondary'} className="text-xs">
              {fw.claimed ? 'Claimed' : 'Not found'}
            </Badge>
          </div>
        </div>
      ))}
    </CardContent>
  </Card>
);

export default FrameworkCard;
