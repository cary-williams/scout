export type Severity = 'high' | 'warning' | 'info';

export type ConcernLevel = 'Low' | 'Medium' | 'High';

export interface Concern {
  severity: Severity;
  message: string;
}

export interface SocSignals {
  socClaimed: boolean;
  accessType: 'public' | 'request' | 'login' | 'unknown';
  urls: string[];
}

export interface FrameworkClaim {
  name: string;
  claimed: boolean;
  confidence: number;
  urls: string[];
}

export interface DnsEmail {
  dnssecEnabled: boolean;
  spfPresent: boolean;
  spfSummary: string;
  dmarcPresent: boolean;
  dmarcPolicy: string;
  dmarcPct: number | null;
  dmarcRua: string | null;
  dmarcRuf: string | null;
}

export interface TlsWebSecurity {
  tls12Plus: boolean;
  certValid: boolean;
  certDaysUntilExpiry: number | null;
  certExpirationDate: string | null;
  hstsPresent: boolean;
  hstsMaxAge: number | null;
  hstsIncludeSubDomains: boolean;
  hstsPreload: boolean;
}

export interface Discovery {
  securityTxtPresent: boolean;
  robotsTxtPresent: boolean;
  sitemapUrls: string[];
  statusPagePresent: boolean;
}

export interface ScannedPage {
  url: string;
  statusCode: number;
  title: string;
  source?: 'path' | 'subdomain' | 'sitemap';
}

export interface ScanResult {
  domain: string;
  timestamp: string;
  concernLevel: ConcernLevel;
  concerns: Concern[];
  socSignals: SocSignals;
  frameworkClaims: FrameworkClaim[];
  dnsEmail: DnsEmail;
  tlsWebSecurity: TlsWebSecurity;
  discovery: Discovery;
  scannedPages: ScannedPage[];
}
