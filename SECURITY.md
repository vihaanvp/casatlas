# Security Policy

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 0.1.x   | :white_check_mark: |

## Reporting a Vulnerability

If you discover a security vulnerability within CASAtlas, please report it privately via GitHub's [Security Advisories](https://github.com/vihaanvp/casatlas/security/advisories/new) tab, or open a private issue against this repository. All security vulnerabilities will be promptly addressed.

**Please do not report security vulnerabilities through public GitHub issues.**

### What to include

When reporting a vulnerability, please include:

- A description of the vulnerability
- Steps to reproduce the issue
- Potential impact
- Suggested fix (if any)

### Response timeline

- **Acknowledgment**: within 48 hours
- **Initial assessment**: within 1 week
- **Fix or mitigation**: depends on severity, typically within 2 weeks for critical issues

### Disclosure policy

- We will coordinate with you on the timing of public disclosure
- We will credit reporters in the release notes (unless you prefer anonymity)
- We will not take legal action against researchers who follow this policy

## Security Best Practices for Deployment

When deploying CASAtlas in production:

1. **Environment Variables**: Never commit `.env` files. Use your hosting platform's secrets management.
2. **Database**: Use strong passwords and restrict network access to PostgreSQL.
3. **HTTPS**: Always deploy behind HTTPS (use a reverse proxy like Caddy or Nginx).
4. **Updates**: Keep dependencies updated. Dependabot is configured to open PRs weekly.
5. **Docker**: Use the official Docker image or build from the provided Dockerfile. Do not modify the security headers in `next.config.ts` without understanding the implications.

## Authentication

CASAtlas uses Auth.js (NextAuth) for authentication. OAuth credentials are stored as environment variables and never exposed to the client. Session tokens are managed server-side via the database adapter.

If you find issues with the authentication flow, please report them following the process above.
