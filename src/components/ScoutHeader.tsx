import scoutLogo from '@/assets/scout-logo.png';

const ScoutHeader = () => (
  <header className="text-center pt-12 pb-8">
    <div className="flex items-center justify-center gap-3 mb-3">
      <img src={scoutLogo} alt="SCOUT logo" className="h-10 w-10 object-contain" />
      <h1 className="text-4xl font-bold tracking-tight text-foreground">
        SCOUT
      </h1>
    </div>
    <p className="text-muted-foreground text-lg">
      SCOUT Collects Observable Untrusted Traits
    </p>
    <p className="text-muted-foreground text-sm mt-1">
      lightweight, non-invasive vendor security and compliance triage
    </p>
  </header>
);

export default ScoutHeader;
