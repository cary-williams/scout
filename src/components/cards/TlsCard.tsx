import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Lock } from 'lucide-react';
import type { TlsWebSecurity } from '@/types/scan';

const Bool = ({ value, invert }: { value: boolean | null; invert?: boolean }) => {
  if (value === null) return <span className="text-xs text-muted-foreground">Unknown</span>;
  const good = invert ? !value : value;
  return (
    <Badge variant={good ? 'default' : 'secondary'} className="text-xs">
      {value ? 'Yes' : 'No'}
    </Badge>
  );
};

const formatDate = (iso: string | null): string => {
  if (!iso) return 'Unknown';
  try {
    return new Date(iso).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  } catch { return 'Unknown'; }
};

const TlsCard = ({ data }: { data: TlsWebSecurity }) => (
  <Card>
    <CardHeader className="pb-3">
      <CardTitle className="flex items-center gap-2 text-lg">
        <Lock className="h-5 w-5 text-primary" />
        TLS / Web Security
      </CardTitle>
    </CardHeader>
    <CardContent className="space-y-2 text-sm">
      <div className="flex justify-between"><span className="text-muted-foreground">TLS 1.2+</span><Bool value={data.tls12Plus} /></div>
      <div className="flex justify-between"><span className="text-muted-foreground">Cert Valid</span><Bool value={data.certValid} /></div>
      <div className="flex justify-between">
        <span className="text-muted-foreground">Cert Expiration Date</span>
        <span className={data.certDaysUntilExpiry != null && data.certDaysUntilExpiry <= 7 ? 'text-destructive font-semibold' : data.certDaysUntilExpiry != null && data.certDaysUntilExpiry <= 30 ? 'text-[hsl(var(--severity-warning))]' : ''}>
          {formatDate(data.certExpirationDate)}
        </span>
      </div>
      <div className="flex justify-between"><span className="text-muted-foreground">HSTS</span><Bool value={data.hstsPresent} /></div>
      {data.hstsPresent && (
        <>
          <div className="flex justify-between"><span className="text-muted-foreground">max-age</span><span className="font-mono text-xs">{data.hstsMaxAge?.toLocaleString()}</span></div>
          <div className="flex justify-between"><span className="text-muted-foreground">includeSubDomains</span><Bool value={data.hstsIncludeSubDomains} /></div>
          <div className="flex justify-between"><span className="text-muted-foreground">preload</span><Bool value={data.hstsPreload} /></div>
        </>
      )}
    </CardContent>
  </Card>
);

export default TlsCard;
