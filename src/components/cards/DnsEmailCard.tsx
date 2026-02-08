import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Mail } from 'lucide-react';
import type { DnsEmail } from '@/types/scan';

const Bool = ({ value }: { value: boolean }) => (
  <Badge variant={value ? 'default' : 'secondary'} className="text-xs">
    {value ? 'Yes' : 'No'}
  </Badge>
);

const DnsEmailCard = ({ data }: { data: DnsEmail }) => (
  <Card>
    <CardHeader className="pb-3">
      <CardTitle className="flex items-center gap-2 text-lg">
        <Mail className="h-5 w-5 text-primary" />
        DNS / Email
      </CardTitle>
    </CardHeader>
    <CardContent className="space-y-2 text-sm">
      <div className="flex justify-between"><span className="text-muted-foreground">DNSSEC</span><Bool value={data.dnssecEnabled} /></div>
      <div className="flex justify-between"><span className="text-muted-foreground">SPF Present</span><Bool value={data.spfPresent} /></div>
      {data.spfPresent && (
        <div className="flex justify-between"><span className="text-muted-foreground">SPF</span><span className="font-mono text-xs max-w-[200px] truncate">{data.spfSummary}</span></div>
      )}
      <div className="flex justify-between"><span className="text-muted-foreground">DMARC Present</span><Bool value={data.dmarcPresent} /></div>
      {data.dmarcPresent && (
        <>
          <div className="flex justify-between"><span className="text-muted-foreground">DMARC Policy</span><span className="font-mono text-xs">{data.dmarcPolicy}</span></div>
          {data.dmarcPct !== null && <div className="flex justify-between"><span className="text-muted-foreground">DMARC pct</span><span>{data.dmarcPct}%</span></div>}
          {data.dmarcRua && <div className="flex justify-between"><span className="text-muted-foreground">rua</span><span className="font-mono text-xs truncate max-w-[180px]">{data.dmarcRua}</span></div>}
          {data.dmarcRuf && <div className="flex justify-between"><span className="text-muted-foreground">ruf</span><span className="font-mono text-xs truncate max-w-[180px]">{data.dmarcRuf}</span></div>}
        </>
      )}
    </CardContent>
  </Card>
);

export default DnsEmailCard;
