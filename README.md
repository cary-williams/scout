# SCOUT

**SCOUT Collects Observable Untrusted Traits**

SCOUT is a lightweight, non-invasive vendor security and compliance triage tool.
It is designed to help quickly assess a vendor’s security maturity using publicly
observable signals before initiating a full risk assessment or requesting formal
evidence.

SCOUT is intentionally conservative in scope. It does not perform intrusive
scanning, authenticated testing, or exploit attempts, and it does not claim to
validate compliance. It surfaces signals to support decision-making, not replace
due diligence.

Working Demo: https://scout-plum-ten.vercel.app

---

## What SCOUT is designed to do

SCOUT performs an initial, external-facing review of a vendor by collecting and
correlating publicly available information, including:

- Compliance framework claims (SOC, PCI DSS, GDPR, ISO 27001, CCPA, etc.)
- Trust portal and security page discovery
- DNS and email security posture (DNSSEC, SPF, DMARC)
- TLS and web security hygiene (TLS version, legacy TLS allowance, HSTS)
- Certificate validity and expiration (when determinable)
- security.txt presence
- robots.txt and sitemap discovery
- Status page detection
- Identification of potential concerns based on observed signals

The output is intended to answer questions like:
- Does this vendor appear to take security seriously?
- Are there obvious hygiene gaps?
- Is it worth proceeding to a full vendor risk assessment?
- What evidence should be requested next?

---

## What SCOUT is not

- SCOUT is not a vulnerability scanner
- SCOUT is not a penetration testing tool
- SCOUT does not validate or certify compliance
- SCOUT does not bypass authentication or access controls
- SCOUT does not replace audits, questionnaires, or evidence review

All results are informational and should be interpreted in context.

---

## Architecture overview

SCOUT consists of two parts:

1. **Frontend (Web UI)**
   - Accepts a vendor domain
   - Displays results, highlights concerns, and shows scanned pages
   - Provides JSON export for automation or record keeping

2. **Backend (Scan Engine)**
   - Executes the scan logic
   - Performs DNS, HTTP, and TLS checks
   - Aggregates and normalizes results
   - Returns structured JSON to the frontend

The backend is stateless and designed to be portable.

---

## Deployment options

SCOUT can be deployed in multiple ways depending on your needs.

### Option 1: Local development

Use this for testing or personal evaluation.

**Requirements**
- Node.js or Python (depending on backend implementation)
- Internet access for outbound HTTP and DNS queries

**Steps**
1. Clone the repository
2. Install dependencies
3. Start the backend service
4. Start the frontend
5. Access the UI locally

---

### Option 2: Cloud deployment (recommended)

SCOUT works well as a small, stateless web service.

Typical deployment targets include:
- Fly.io
- Render
- Railway
- DigitalOcean
- AWS (ECS, EC2, or Lambda with a non-edge runtime)
- Any VPS with outbound internet access

**Key considerations**
- The backend must be able to perform DNS queries and outbound HTTPS requests
- Some TLS and certificate checks require a full runtime (Node or Python), not a restricted edge environment
  
---

### Option 3: Split deployment (Edge plus Backend)

If using an edge platform (such as Supabase Edge Functions):

- Run most discovery and content analysis at the edge
- Offload TLS protocol probing and certificate inspection to a small non-edge backend
- Call that backend from the edge function when deeper checks are needed

This preserves accuracy while keeping the UI responsive.

---

## Interpreting results

SCOUT highlights potential concerns using severity levels:

- **High** - Likely security hygiene issue or strong indicator of risk
- **Warning** - Notable gap or configuration worth follow-up
- **Info** - Observational finding or missing signal

A Medium or High concern level does not mean a vendor is insecure.
It means additional review or evidence collection is likely warranted.

---

## Example use cases

- Vendor intake and pre-screening
- Prioritizing vendor risk assessments
- Supporting security reviews with objective external signals
- Identifying follow-up questions for vendors
- Demonstrating security maturity evaluation processes

---

## License and usage

SCOUT is intended for risk assessment use only.
Use responsibly and in accordance with applicable laws and organizational policies.
