# Security Policy

## Supported Versions

The following versions of **Multi-Model Agent Platform** are currently supported with security updates:

| Version | Supported          |
| ------- | ------------------ |
| 0.1.x   | :white_check_mark: |
| < 0.1.0 | :x:                |

## Reporting a Vulnerability

We take security seriously and appreciate your help in disclosing vulnerabilities responsibly.

### How to Report

**Please do NOT report security vulnerabilities through public GitHub issues.**

Instead, report security vulnerabilities by emailing the maintainers directly at:

- **security@multi-model-agent-platform.dev** (preferred)

If you do not receive a response within 48 hours, please follow up to ensure we received your report.

### What to Include

When reporting a vulnerability, please include as much of the following information as possible:

- **Description**: A clear description of the vulnerability and its potential impact.
- **Steps to Reproduce**: Detailed steps to reproduce the vulnerability.
- **Affected Versions**: Which versions or components are affected.
- **Proof of Concept**: If applicable, a minimal proof of concept demonstrating the issue.
- **Suggested Fix**: Any recommendations for remediation (optional).
- **Your Contact**: How we can reach you for follow-up questions (optional).

### Disclosure Policy

We follow a **coordinated disclosure** approach:

1. **Acknowledgment**: We will acknowledge receipt of your report within 48 hours.
2. **Investigation**: We will investigate and validate the vulnerability within 7 days.
3. **Fix & Release**: We will work to develop and release a fix as quickly as possible.
4. **Public Disclosure**: We will publicly disclose the vulnerability with credit to the reporter after a fix is available, unless the reporter requests anonymity.

## Security Best Practices for Users

- Keep your Node.js runtime up to date (Node.js >= 20.0.0 is required).
- Rotate API keys regularly and store them securely (use environment variables, never commit secrets).
- Keep dependencies up to date by running `npm audit` regularly.
- Enable HTTPS in production (the platform enforces this via security headers).
- Review the [QA Security Report](QA_REPORT_SECURITY.md) for known security considerations.

## Known Security Considerations

- **API Key Storage**: Provider API keys are stored in the database. Ensure your database is properly secured.
- **Authentication**: The platform uses JWT-based authentication. Keep your `JWT_SECRET` environment variable secure and unique per deployment.
- **CORS**: Configure `ALLOWED_ORIGINS` appropriately for your deployment environment.
- **Rate Limiting**: Consider adding rate limiting at the reverse proxy or CDN level for production deployments.

## Acknowledgments

We thank the security researchers and community members who have responsibly disclosed vulnerabilities and helped make this project more secure.
