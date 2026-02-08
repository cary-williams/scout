const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

// ---------- Types ----------

interface DnsRecord { type: number; data: string; name: string; TTL: number; }
interface DohResponse { Answer?: DnsRecord[]; Status: number; }

type Severity = 'high' | 'warning' | 'info';
interface Concern { severity: Severity; message: string; }

interface PageResult {
  url: string;
  statusCode: number;
  title: string;
  source: 'path' | 'subdomain' | 'sitemap';
}

interface FrameworkClaim {
  name: string;
  claimed: boolean;
  confidence: number;
  urls: string[];
}

// ---------- Constants ----------

const COMMON_PATHS = [
  '/', '/trust', '/trust-center', '/trustcenter',
  '/security', '/security-center', '/security-and-compliance',
  '/compliance', '/legal', '/legal/security',
  '/privacy', '/about/security', '/company/security',
  '/resources/security',
];

const COMMON_SUBDOMAINS = ['trust', 'security', 'compliance', 'status'];

const SECURITY_KEYWORDS = ['security', 'trust', 'compliance', 'privacy', 'soc', 'pci', 'gdpr', 'iso', 'status'];
const BLOG_EXCLUDE = ['blog', 'posts', 'news', '/tag/', '/category/', '/202'];

const FRAMEWORK_PATTERNS: Record<string, string[]> = {
  'SOC 2': ['soc 2', 'soc2', 'soc ii', 'soc type 2', 'soc type ii'],
  'SOC 1': ['soc 1', 'soc1', 'soc type 1', 'soc type i'],
  'PCI DSS': ['pci dss', 'pci-dss', 'pci compliant', 'payment card industry'],
  'GDPR': ['gdpr', 'general data protection'],
  'ISO 27001': ['iso 27001', 'iso27001'],
  'CCPA': ['ccpa', 'california consumer privacy'],
  'HIPAA': ['hipaa', 'health insurance portability'],
  'FedRAMP': ['fedramp', 'fed ramp'],
  'SOX': ['sarbanes-oxley', 'sox compliance'],
  'CSA STAR': ['csa star', 'cloud security alliance'],
};

// ---------- DNS helpers ----------

async function queryDns(domain: string, type: string): Promise<DohResponse> {
  const url = `https://cloudflare-dns.com/dns-query?name=${encodeURIComponent(domain)}&type=${type}`;
  const res = await fetch(url, { headers: { Accept: 'application/dns-json' } });
  if (!res.ok) throw new Error(`DNS query failed for ${type}: ${res.status}`);
  return res.json();
}

async function checkDnssec(domain: string): Promise<boolean> {
  try {
    const url = `https://cloudflare-dns.com/dns-query?name=${encodeURIComponent(domain)}&type=A&do=true`;
    const res = await fetch(url, { headers: { Accept: 'application/dns-json' } });
    const data = await res.json();
    return data.AD === true;
  } catch { return false; }
}

async function checkSpf(domain: string) {
  try {
    const data = await queryDns(domain, 'TXT');
    const rec = data.Answer?.find((r) => r.data?.includes('v=spf1'));
    return { present: !!rec, summary: rec ? rec.data.replace(/"/g, '') : '' };
  } catch { return { present: false, summary: '' }; }
}

async function checkDmarc(domain: string) {
  try {
    const data = await queryDns(`_dmarc.${domain}`, 'TXT');
    const rec = data.Answer?.find((r) => r.data?.includes('v=DMARC1'));
    if (!rec) return { present: false, policy: '', pct: null, rua: null, ruf: null };
    const raw = rec.data.replace(/"/g, '');
    const tag = (t: string) => { const m = raw.match(new RegExp(`${t}=([^;]+)`)); return m ? m[1].trim() : null; };
    return { present: true, policy: tag('p') || '', pct: tag('pct') ? parseInt(tag('pct')!, 10) : null, rua: tag('rua') || null, ruf: tag('ruf') || null };
  } catch { return { present: false, policy: '', pct: null, rua: null, ruf: null }; }
}

// ---------- Cert expiry cache (6-hour TTL, in-memory) ----------

interface CertCacheEntry {
  days: number | null;
  date: string | null;
  fetchedAt: number;
}

const CERT_CACHE_TTL_MS = 6 * 60 * 60 * 1000; // 6 hours
const certCache = new Map<string, CertCacheEntry>();

// ---------- TLS helpers ----------

async function checkTls(domain: string) {
  const defaults = { tls12Plus: false, certValid: false, hstsPresent: false, hstsMaxAge: null as number | null, hstsIncludeSubDomains: false, hstsPreload: false };
  try {
    const res = await fetch(`https://${domain}`, { method: 'HEAD', redirect: 'follow', signal: AbortSignal.timeout(10000) });
    const hsts = res.headers.get('strict-transport-security') || '';
    const hstsPresent = hsts.length > 0;
    let hstsMaxAge: number | null = null;
    if (hstsPresent) { const m = hsts.match(/max-age=(\d+)/); hstsMaxAge = m ? parseInt(m[1], 10) : null; }
    return { tls12Plus: true, certValid: true, hstsPresent, hstsMaxAge, hstsIncludeSubDomains: hsts.includes('includeSubDomains'), hstsPreload: hsts.includes('preload') };
  } catch (err) { console.error('TLS check error:', err); return { ...defaults }; }
}

async function fetchCertExpiryFromCrtSh(domain: string): Promise<{ days: number | null; date: string | null }> {
  const domainsToTry = [domain];
  if (!domain.startsWith('www.')) domainsToTry.push(`www.${domain}`);
  else domainsToTry.push(domain.replace(/^www\./, ''));

  for (const d of domainsToTry) {
    try {
      const res = await fetch(`https://crt.sh/?q=${encodeURIComponent(d)}&output=json`, { signal: AbortSignal.timeout(10000) });
      if (!res.ok) { console.warn('crt.sh non-OK status for', d, res.status); continue; }
      const raw = await res.text();
      let certs: Array<{ not_after: string }>;
      try { certs = JSON.parse(raw); } catch { console.warn('crt.sh returned non-JSON for', d); continue; }
      if (!Array.isArray(certs) || !certs.length) continue;

      const now = Date.now();
      let bestDays: number | null = null;
      let bestDate: string | null = null;
      for (const c of certs) {
        const exp = new Date(c.not_after).getTime();
        if (isNaN(exp)) continue;
        if (exp <= now) continue;
        const d2 = Math.ceil((exp - now) / 86400000);
        if (bestDays === null || d2 < bestDays) {
          bestDays = d2;
          bestDate = new Date(exp).toISOString();
        }
      }
      if (bestDays !== null) return { days: bestDays, date: bestDate };
    } catch (err) { console.warn('crt.sh error for', d, err); }
  }
  return { days: null, date: null };
}

async function checkCertExpiry(domain: string): Promise<{ days: number | null; date: string | null }> {
  const cacheKey = domain.replace(/^www\./, '');
  const cached = certCache.get(cacheKey);
  if (cached && (Date.now() - cached.fetchedAt) < CERT_CACHE_TTL_MS) {
    console.log('Cert expiry cache hit for', cacheKey);
    return { days: cached.days, date: cached.date };
  }

  const result = await fetchCertExpiryFromCrtSh(domain);
  // Only update cache if we got a real result, or if there's no cached value yet
  if (result.days !== null || !cached) {
    certCache.set(cacheKey, { ...result, fetchedAt: Date.now() });
  } else {
    // crt.sh failed but we have a previous cached value — keep using it
    console.log('crt.sh failed, returning stale cache for', cacheKey);
    return { days: cached.days, date: cached.date };
  }
  return result;
}

// ---------- HTML text extraction ----------

function extractVisibleText(html: string): string {
  // Remove script and style blocks
  let text = html.replace(/<script[\s\S]*?<\/script>/gi, ' ');
  text = text.replace(/<style[\s\S]*?<\/style>/gi, ' ');
  // Remove all HTML tags
  text = text.replace(/<[^>]+>/g, ' ');
  // Decode common entities
  text = text.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&nbsp;/g, ' ');
  // Collapse whitespace
  text = text.replace(/\s+/g, ' ').trim();
  return text;
}

function extractTitle(html: string): string {
  const m = html.match(/<title[^>]*>([^<]+)<\/title>/i);
  return m ? m[1].trim() : '';
}

// ---------- Page fetching ----------

async function fetchPageWithText(url: string, source: PageResult['source']): Promise<{ page: PageResult; text: string }> {
  try {
    const res = await fetch(url, { redirect: 'follow', signal: AbortSignal.timeout(8000), headers: { 'User-Agent': 'SCOUT-Scanner/1.0' } });
    const status = res.status;
    const contentType = res.headers.get('content-type') || '';
    const isHtml = contentType.includes('text/html') || contentType.includes('application/xhtml');
    if (isHtml) {
      const html = await res.text();
      return { page: { url: res.url || url, statusCode: status, title: extractTitle(html), source }, text: extractVisibleText(html) };
    }
    await res.text().catch(() => {});
    return { page: { url: res.url || url, statusCode: status, title: '', source }, text: '' };
  } catch {
    return { page: { url, statusCode: 0, title: 'Connection failed', source }, text: '' };
  }
}

// ---------- Robots / Sitemap ----------

async function fetchRobotsTxt(domain: string): Promise<{ present: boolean; sitemapUrls: string[] }> {
  try {
    const res = await fetch(`https://${domain}/robots.txt`, { signal: AbortSignal.timeout(5000) });
    if (!res.ok) return { present: false, sitemapUrls: [] };
    const text = await res.text();
    const sitemaps = [...text.matchAll(/Sitemap:\s*(\S+)/gi)].map((m) => m[1]);
    return { present: true, sitemapUrls: sitemaps };
  } catch { return { present: false, sitemapUrls: [] }; }
}

async function fetchSitemapSecurityUrls(sitemapUrls: string[], limit: number): Promise<string[]> {
  const found: string[] = [];
  for (const sitemapUrl of sitemapUrls.slice(0, 3)) {
    if (found.length >= limit) break;
    try {
      const res = await fetch(sitemapUrl, { signal: AbortSignal.timeout(8000) });
      if (!res.ok) continue;
      const xml = await res.text();
      // Extract <loc> entries
      const locs = [...xml.matchAll(/<loc>\s*(.*?)\s*<\/loc>/gi)].map((m) => m[1]);
      for (const loc of locs) {
        if (found.length >= limit) break;
        const lower = loc.toLowerCase();
        const hasKeyword = SECURITY_KEYWORDS.some((kw) => lower.includes(kw));
        const isBlog = BLOG_EXCLUDE.some((ex) => lower.includes(ex));
        if (hasKeyword && !isBlog) found.push(loc);
      }
    } catch { /* continue */ }
  }
  return found;
}

// ---------- security.txt & status page ----------

async function checkSecurityTxt(domain: string): Promise<boolean> {
  try {
    const res = await fetch(`https://${domain}/.well-known/security.txt`, { signal: AbortSignal.timeout(5000) });
    return res.ok;
  } catch { return false; }
}

async function checkStatusPage(domain: string): Promise<boolean> {
  for (const url of [`https://status.${domain}`, `https://${domain}/status`]) {
    try {
      const res = await fetch(url, { method: 'HEAD', redirect: 'follow', signal: AbortSignal.timeout(5000) });
      if (res.ok) return true;
    } catch { /* continue */ }
  }
  return false;
}

// ---------- Framework detection on combined text ----------

function detectFrameworks(pageTexts: Array<{ url: string; text: string }>): FrameworkClaim[] {
  const results: FrameworkClaim[] = Object.keys(FRAMEWORK_PATTERNS).map((name) => ({
    name, claimed: false, confidence: 0, urls: [],
  }));

  for (const { url, text } of pageTexts) {
    if (!text) continue;
    const lower = text.toLowerCase();
    for (const fw of results) {
      const pats = FRAMEWORK_PATTERNS[fw.name];
      if (pats.some((p) => lower.includes(p))) {
        fw.claimed = true;
        fw.confidence = Math.min(fw.confidence + 0.3, 0.95);
        if (!fw.urls.includes(url)) fw.urls.push(url);
      }
    }
  }
  return results;
}

// ---------- SOC signals from text ----------

function detectSocSignals(pageTexts: Array<{ url: string; text: string }>) {
  let socClaimed = false;
  let accessType: 'public' | 'request' | 'login' | 'unknown' = 'unknown';
  const urls: string[] = [];

  for (const { url, text } of pageTexts) {
    if (!text) continue;
    const lower = text.toLowerCase();
    if (lower.includes('soc 2') || lower.includes('soc2') || lower.includes('soc ii')) {
      socClaimed = true;
      if (!urls.includes(url)) urls.push(url);
      if (lower.includes('download') || lower.includes('request')) {
        accessType = 'request';
      } else if (accessType === 'unknown') {
        accessType = 'public';
      }
    }
  }
  return { socClaimed, accessType, urls };
}

// ---------- Concern generation ----------

function generateConcerns(result: any): Concern[] {
  const concerns: Concern[] = [];
  if (!result.dnsEmail.dnssecEnabled) concerns.push({ severity: 'warning', message: 'DNSSEC is not enabled' });
  if (!result.discovery.securityTxtPresent) concerns.push({ severity: 'info', message: 'security.txt is missing' });

  // TLS version concerns
  if (!result.tlsWebSecurity.tls12Plus) {
    concerns.push({ severity: 'high', message: 'TLS 1.2+ is not supported' });
  }

  // Certificate concerns
  if (!result.tlsWebSecurity.certValid) {
    concerns.push({ severity: 'high', message: 'TLS certificate is invalid or connection failed' });
  } else if (result.tlsWebSecurity.certExpirationDate == null) {
    concerns.push({ severity: 'info', message: 'Unable to determine certificate expiration date' });
  } else if (result.tlsWebSecurity.certDaysUntilExpiry != null && result.tlsWebSecurity.certDaysUntilExpiry <= 7) {
    concerns.push({ severity: 'high', message: `TLS certificate expires on ${result.tlsWebSecurity.certExpirationDate}` });
  } else if (result.tlsWebSecurity.certDaysUntilExpiry != null && result.tlsWebSecurity.certDaysUntilExpiry <= 30) {
    concerns.push({ severity: 'warning', message: `TLS certificate expires on ${result.tlsWebSecurity.certExpirationDate}` });
  }

  if (!result.dnsEmail.dmarcPresent || result.dnsEmail.dmarcPolicy === 'none') concerns.push({ severity: 'warning', message: 'DMARC missing or policy set to none' });
  if (!result.dnsEmail.spfPresent) {
    concerns.push({ severity: 'high', message: 'SPF record is missing' });
  } else if (result.dnsEmail.spfSummary.includes('+all')) {
    concerns.push({ severity: 'high', message: 'SPF policy uses +all (allows any sender)' });
  }
  if (!result.socSignals.socClaimed) concerns.push({ severity: 'info', message: 'No SOC compliance claims found' });
  if (!result.tlsWebSecurity.hstsPresent) concerns.push({ severity: 'warning', message: 'HSTS header is not present' });
  return concerns;
}

function deriveConcernLevel(concerns: Concern[]): string {
  if (concerns.some((c) => c.severity === 'high')) return 'High';
  if (concerns.some((c) => c.severity === 'warning')) return 'Medium';
  return 'Low';
}

// ---------- Registrable domain helper ----------

function getRegistrableDomain(domain: string): string {
  // Simple heuristic: take last two parts, or last three for known ccTLD+SLD combos
  const parts = domain.split('.');
  if (parts.length <= 2) return domain;
  // Handle co.uk, com.au style
  const knownSlds = ['co', 'com', 'org', 'net', 'ac', 'gov', 'edu'];
  if (parts.length >= 3 && knownSlds.includes(parts[parts.length - 2]) && parts[parts.length - 1].length <= 3) {
    return parts.slice(-3).join('.');
  }
  return parts.slice(-2).join('.');
}

// ---------- Main handler ----------

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { domain } = await req.json();
    if (!domain || typeof domain !== 'string') {
      return new Response(JSON.stringify({ error: 'domain is required' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const cleanDomain = domain.trim().toLowerCase().replace(/^https?:\/\//, '').replace(/\/.*$/, '');
    const registrable = getRegistrableDomain(cleanDomain);
    console.log('Scanning domain:', cleanDomain, '| registrable:', registrable);

    // Determine hosts to scan: bare + www
    const hosts = [cleanDomain];
    if (!cleanDomain.startsWith('www.')) hosts.push(`www.${cleanDomain}`);
    else hosts.push(cleanDomain.replace(/^www\./, ''));

    // Build list of page URLs to scan
    const urlSet = new Set<string>();

    // Common paths on each host
    for (const host of hosts) {
      for (const path of COMMON_PATHS) {
        urlSet.add(`https://${host}${path}`);
      }
    }

    // Common subdomains on the registrable domain
    for (const sub of COMMON_SUBDOMAINS) {
      urlSet.add(`https://${sub}.${registrable}/`);
    }

    // Run DNS/TLS checks in parallel with initial page scan setup
    const [dnssec, spf, dmarc, tlsInfo, certDays, securityTxt, robots, statusPage] = await Promise.all([
      checkDnssec(cleanDomain),
      checkSpf(cleanDomain),
      checkDmarc(cleanDomain),
      checkTls(cleanDomain),
      checkCertExpiry(cleanDomain),
      checkSecurityTxt(cleanDomain),
      fetchRobotsTxt(cleanDomain),
      checkStatusPage(cleanDomain),
    ]);

    // Add sitemap-derived security URLs
    if (robots.sitemapUrls.length > 0) {
      const sitemapUrls = await fetchSitemapSecurityUrls(robots.sitemapUrls, 30);
      for (const u of sitemapUrls) urlSet.add(u);
    }

    console.log(`Scanning ${urlSet.size} URLs...`);

    // Fetch all pages in parallel (with concurrency)
    const allUrls = [...urlSet];
    const pageResults: Array<{ page: PageResult; text: string }> = [];

    // Process in batches of 10
    for (let i = 0; i < allUrls.length; i += 10) {
      const batch = allUrls.slice(i, i + 10);
      const results = await Promise.all(
        batch.map((url) => {
          const source: PageResult['source'] = COMMON_SUBDOMAINS.some((s) => url.includes(`://${s}.`)) ? 'subdomain'
            : robots.sitemapUrls.length > 0 && !COMMON_PATHS.some((p) => url.endsWith(p)) ? 'sitemap'
            : 'path';
          return fetchPageWithText(url, source);
        })
      );
      pageResults.push(...results);
    }

    // Use ALL pages with extracted text for detection (regardless of status code)
    const pageTexts = pageResults.filter((p) => p.text.length > 0).map((p) => ({ url: p.page.url, text: p.text }));

    // Run framework and SOC detection on combined text
    const frameworkClaims = detectFrameworks(pageTexts);
    const socSignals = detectSocSignals(pageTexts);

    // Deduplicate by final URL
    const seenUrls = new Set<string>();
    const scannedPages: PageResult[] = [];
    for (const p of pageResults) {
      if (!seenUrls.has(p.page.url)) {
        seenUrls.add(p.page.url);
        scannedPages.push(p.page);
      }
    }

    const base = {
      domain: cleanDomain,
      timestamp: new Date().toISOString(),
      socSignals,
      frameworkClaims,
      dnsEmail: {
        dnssecEnabled: dnssec,
        spfPresent: spf.present,
        spfSummary: spf.summary,
        dmarcPresent: dmarc.present,
        dmarcPolicy: dmarc.policy,
        dmarcPct: dmarc.pct,
        dmarcRua: dmarc.rua,
        dmarcRuf: dmarc.ruf,
      },
      tlsWebSecurity: {
        tls12Plus: tlsInfo.tls12Plus,
        certValid: tlsInfo.certValid,
        certDaysUntilExpiry: certDays.days,
        certExpirationDate: certDays.date,
        hstsPresent: tlsInfo.hstsPresent,
        hstsMaxAge: tlsInfo.hstsMaxAge,
        hstsIncludeSubDomains: tlsInfo.hstsIncludeSubDomains,
        hstsPreload: tlsInfo.hstsPreload,
      },
      discovery: {
        securityTxtPresent: securityTxt,
        robotsTxtPresent: robots.present,
        sitemapUrls: robots.sitemapUrls,
        statusPagePresent: statusPage,
      },
      scannedPages,
    };

    const concerns = generateConcerns(base);
    const concernLevel = deriveConcernLevel(concerns);
    const result = { ...base, concerns, concernLevel };

    console.log('Scan complete for', cleanDomain, '- concern level:', concernLevel, `- ${scannedPages.length} pages scanned, ${pageTexts.length} with text`);

    return new Response(JSON.stringify(result), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (error) {
    console.error('Scan error:', error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Scan failed' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
