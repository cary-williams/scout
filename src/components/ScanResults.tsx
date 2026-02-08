import { Copy, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import ConcernsList from './ConcernsList';
import SummaryCard from './cards/SummaryCard';
import SocCard from './cards/SocCard';
import FrameworkCard from './cards/FrameworkCard';
import DnsEmailCard from './cards/DnsEmailCard';
import TlsCard from './cards/TlsCard';
import DiscoveryCard from './cards/DiscoveryCard';
import PagesCard from './cards/PagesCard';
import type { ScanResult } from '@/types/scan';

const ScanResults = ({ result }: { result: ScanResult }) => {
  const { toast } = useToast();

  const json = JSON.stringify(result, null, 2);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(json);
    toast({ title: 'Copied', description: 'JSON copied to clipboard' });
  };

  const handleDownload = () => {
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `scout-${result.domain}-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-foreground">Results</h2>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleCopy} className="gap-1.5">
            <Copy className="h-3.5 w-3.5" /> Copy JSON
          </Button>
          <Button variant="outline" size="sm" onClick={handleDownload} className="gap-1.5">
            <Download className="h-3.5 w-3.5" /> Download
          </Button>
        </div>
      </div>

      <ConcernsList concerns={result.concerns} />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <SummaryCard domain={result.domain} timestamp={result.timestamp} concernLevel={result.concernLevel} />
        <SocCard data={result.socSignals} />
        <FrameworkCard data={result.frameworkClaims} />
        <DnsEmailCard data={result.dnsEmail} />
        <TlsCard data={result.tlsWebSecurity} />
        <DiscoveryCard data={result.discovery} />
        <PagesCard pages={result.scannedPages} />
      </div>
    </div>
  );
};

export default ScanResults;
