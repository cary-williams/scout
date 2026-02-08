import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Globe } from 'lucide-react';
import type { Discovery } from '@/types/scan';

const Bool = ({ value }: { value: boolean }) => (
  <Badge variant={value ? 'default' : 'secondary'} className="text-xs">
    {value ? 'Yes' : 'No'}
  </Badge>
);

const DiscoveryCard = ({ data }: { data: Discovery }) => (
  <Card>
    <CardHeader className="pb-3">
      <CardTitle className="flex items-center gap-2 text-lg">
        <Globe className="h-5 w-5 text-primary" />
        Discovery
      </CardTitle>
    </CardHeader>
    <CardContent className="space-y-2 text-sm">
      <div className="flex justify-between"><span className="text-muted-foreground">security.txt</span><Bool value={data.securityTxtPresent} /></div>
      <div className="flex justify-between"><span className="text-muted-foreground">robots.txt</span><Bool value={data.robotsTxtPresent} /></div>
      {data.sitemapUrls.length > 0 && (
        <div className="pt-1 space-y-1">
          <span className="text-muted-foreground text-xs">Sitemap URLs</span>
          {data.sitemapUrls.map((url, i) => (
            <a key={i} href={url} target="_blank" rel="noopener noreferrer"
              className="block text-primary hover:underline text-xs font-mono truncate">
              {url}
            </a>
          ))}
        </div>
      )}
      <div className="flex justify-between"><span className="text-muted-foreground">Status Page</span><Bool value={data.statusPagePresent} /></div>
    </CardContent>
  </Card>
);

export default DiscoveryCard;
