# Security Policy

## Supported versions

| Version | Supported |
| ------- | --------- |
| `main` (latest) | Yes |

## Reporting a vulnerability

**Do not open a public GitHub issue for security vulnerabilities.**

Use [GitHub Private Vulnerability Reporting](https://github.com/QuantumLogicsLabs/Quantum-AI-Frontend/security/advisories/new).

Include reproduction steps, affected UI flows, and impact.

### What to expect

- Triage acknowledgement
- Coordinated fix and disclosure
- Credit when appropriate and desired

## In scope

- XSS or client bugs that steal session tokens
- Accidental exposure of API keys or JWTs in the client bundle or logs
- Unauthorized access to another user’s conversations via the UI

## Out of scope

- Issues solely in Quantum-AI-Backend (report there)
- Model quality / hallucination without a security impact

## XSS controls

- Content-Security-Policy on the SPA (`script-src 'self'`)
- Assistant markdown sanitized with `rehype-sanitize` + http(s)-only link URLs
- Search result links only render when the URL is `http:` / `https:`

## Safe harbor

Good-faith research that follows this policy and avoids abusing real user data
will not be pursued legally by the maintainers.
