# Security Policy

## 🔒 Supported Versions

We actively provide security updates for the following versions:

| Version | Supported          |
| ------- | ------------------ |
| 1.x.x   | :white_check_mark: |
| < 1.0   | :x:                |

## 🚨 Reporting a Vulnerability

We take the security of Carlens seriously. If you believe you have found a security vulnerability, please report it to us as described below.

### Where to Report

**Please do NOT report security vulnerabilities through public GitHub issues.**

Instead, please report them via email to: **[security@carlens.dev]** (replace with actual email)

If you prefer, you can also use GitHub's private vulnerability reporting feature:
1. Go to the [Security tab](https://github.com/nguyenvanduocit/carlens/security) of this repository
2. Click "Report a vulnerability"
3. Fill out the form with details about the vulnerability

### What to Include

Please include the following information in your report:

- **Type of issue** (e.g., buffer overflow, SQL injection, cross-site scripting, etc.)
- **Full paths of source file(s)** related to the manifestation of the issue
- **The location of the affected source code** (tag/branch/commit or direct URL)
- **Any special configuration** required to reproduce the issue
- **Step-by-step instructions** to reproduce the issue
- **Proof-of-concept or exploit code** (if possible)
- **Impact of the issue**, including how an attacker might exploit the issue

This information will help us triage your report more quickly.

### Response Timeline

We will acknowledge receipt of your vulnerability report within **48 hours**.

We will provide a detailed response within **7 days** indicating the next steps in handling your report.

We will keep you informed of the progress towards a fix and may ask for additional information or guidance.

## 🛡️ Security Best Practices

### For Developers

When contributing to Carlens, please follow these security guidelines:

#### Environment Variables
- Never commit secrets, API keys, or sensitive configuration to the repository
- Use `.env.example` files to document required environment variables
- Validate all environment variables at startup

#### Input Validation
- Validate all user inputs on both client and server side
- Use parameterized queries for database operations
- Sanitize data before displaying in the UI

#### Authentication & Authorization
- Implement proper session management
- Use secure, httpOnly cookies for session tokens
- Validate user permissions for all API endpoints

#### Data Protection
- Encrypt sensitive data at rest
- Use HTTPS/TLS for all communications
- Implement proper logging without exposing sensitive information

#### MongoDB Security
- Use MongoDB connection strings with authentication
- Implement proper database access controls
- Regularly update MongoDB to the latest secure version

### For Users

#### Deployment Security
- Always use HTTPS in production environments
- Keep all dependencies updated to their latest secure versions
- Use strong, unique passwords for database connections
- Regularly backup your data and test restore procedures

#### Environment Configuration
- Restrict database access to authorized networks only
- Use environment-specific configuration files
- Monitor logs for suspicious activities

## 🔍 Known Security Considerations

### Data Sensitivity
- Vehicle telemetry data may contain location information
- Consider data retention policies and user privacy
- Implement data anonymization where appropriate

### API Security
- All API endpoints should implement rate limiting
- Sensitive operations should require authentication
- Input validation should be performed on all endpoints

### Client-Side Security
- Validate all data received from APIs before display
- Implement proper error handling to avoid information disclosure
- Use Content Security Policy (CSP) headers

## 📋 Security Checklist for Releases

Before each release, we verify:

- [ ] All dependencies are updated to secure versions
- [ ] Security scanning tools have been run
- [ ] No hardcoded secrets or sensitive information in code
- [ ] All API endpoints have proper input validation
- [ ] Database queries use parameterization
- [ ] Error messages don't expose sensitive information
- [ ] Authentication and authorization work correctly
- [ ] HTTPS is enforced in production configurations

## 🤝 Security Research

We welcome security research and responsible disclosure of vulnerabilities. We may recognize researchers who help improve our security through:

- Public acknowledgment (with your permission)
- Attribution in our security advisories
- Coordination on responsible disclosure timelines

## 📞 Contact

For any security-related questions or concerns, please contact:

- **Security Team**: security@carlens.dev (replace with actual email)
- **Maintainer**: [maintainer-email] (replace with actual email)

---

Thank you for helping keep Carlens and our users safe! 🚗🔒