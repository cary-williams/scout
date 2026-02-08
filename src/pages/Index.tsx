import { useState } from 'react';
import ScoutHeader from '@/components/ScoutHeader';
import DomainInput from '@/components/DomainInput';
import ScanResults from '@/components/ScanResults';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle } from 'lucide-react';
import { runScan } from '@/lib/scan';
import type { ScanResult } from '@/types/scan';

const Index = () => {
  const [result, setResult] = useState<ScanResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleScan = async (domain: string) => {
    setIsLoading(true);
    setError('');
    setResult(null);
    try {
      const data = await runScan(domain);
      setResult(data);
    } catch {
      setError('Scan failed. Please check the domain and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 pb-16">
        <ScoutHeader />
        <DomainInput onSubmit={handleScan} isLoading={isLoading} />

        {error && (
          <Alert variant="destructive" className="mt-6 max-w-lg mx-auto">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {result && (
          <div className="mt-10">
            <ScanResults result={result} />
          </div>
        )}
      </div>
    </div>
  );
};

export default Index;
