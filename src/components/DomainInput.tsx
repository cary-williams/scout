import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Loader2, Search } from 'lucide-react';

interface DomainInputProps {
  onSubmit: (domain: string) => void;
  isLoading: boolean;
}

const DOMAIN_REGEX = /^([a-zA-Z0-9]([a-zA-Z0-9-]*[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}$/;

function cleanDomain(input: string): string {
  let d = input.trim().toLowerCase();
  d = d.replace(/^(https?:\/\/)/, '');
  d = d.replace(/\/.*$/, '');
  return d;
}

const DomainInput = ({ onSubmit, isLoading }: DomainInputProps) => {
  const [value, setValue] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const domain = cleanDomain(value);
    if (!DOMAIN_REGEX.test(domain)) {
      setError('Enter a valid domain (e.g. example.com)');
      return;
    }
    setError('');
    onSubmit(domain);
  };

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-lg mx-auto space-y-2">
      <div className="flex gap-2">
        <Input
          value={value}
          onChange={(e) => { setValue(e.target.value); setError(''); }}
          placeholder="example.com"
          className="bg-secondary border-border font-mono text-sm"
          disabled={isLoading}
        />
        <Button type="submit" disabled={isLoading} className="shrink-0 gap-2">
          {isLoading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Scanning…
            </>
          ) : (
            <>
              <Search className="h-4 w-4" />
              Run Snapshot
            </>
          )}
        </Button>
      </div>
      {error && <p className="text-destructive text-sm">{error}</p>}
    </form>
  );
};

export default DomainInput;
