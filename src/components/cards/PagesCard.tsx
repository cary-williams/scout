import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { FileText } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import type { ScannedPage } from '@/types/scan';

const PagesCard = ({ pages }: { pages: ScannedPage[] }) => {
  const [showDebug, setShowDebug] = useState(false);
  const filtered = showDebug ? pages : pages.filter(p => p.statusCode >= 200 && p.statusCode < 300);

  return (
    <Card className="col-span-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <FileText className="h-5 w-5 text-primary" />
            Pages Scanned
          </CardTitle>
          <div className="flex items-center gap-2">
            <Label htmlFor="debug-toggle" className="text-xs text-muted-foreground cursor-pointer">
              Show debug
            </Label>
            <Switch id="debug-toggle" checked={showDebug} onCheckedChange={setShowDebug} />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-1.5 text-sm">
          {filtered.map((p, i) => (
            <div key={i} className="flex items-center gap-3">
              <Badge variant={p.statusCode === 200 ? 'default' : 'secondary'} className="text-xs font-mono w-10 justify-center shrink-0">
                {p.statusCode}
              </Badge>
              <span className="font-mono text-xs truncate text-muted-foreground">{p.url}</span>
              <span className="text-xs text-foreground ml-auto shrink-0">{p.title}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default PagesCard;
