# Security Guidelines

This document outlines security best practices for this public repository.

## ✅ Safe to Commit

- HTML, CSS, JavaScript (without credentials)
- Example configuration files (`*.example.json`)
- Documentation and README files
- Public assets (images, fonts, icons)

## ❌ NEVER Commit

- `auth-config.json` - Contains real Auth0 credentials
- API keys or secrets
- Private keys or certificates
- `.env` files with real values
- User data or logs

## Configuration Files

### auth-config.json (Local Only - NOT in Git)

Create this file locally to enable Auth0 authentication:

```json
{
  "auth0Domain": "your-actual-domain.auth0.com",
  "auth0ClientId": "your_actual_client_id",
  "webhookUrl": "https://your-actual-webhook.com/endpoint",
  "llmApiUrl": "https://your-actual-llm-api.com/query"
}
```

This file is listed in `.gitignore` and will never be committed.

### auth-config.example.json (In Git - Template Only)

This file shows the structure but contains only placeholder values. It's safe to commit.

## Placeholder Values

The following are safe placeholders used in the codebase:

- `YOUR_AUTH0_DOMAIN`
- `YOUR_AUTH0_CLIENT_ID`
- `https://your-webhook-url.example.com`
- `https://your-notebook-llm-api.example.com`

These will NOT work until you create `auth-config.json` with real values.

## Before Pushing to GitHub

1. ✅ Ensure `auth-config.json` is in `.gitignore`
2. ✅ Verify no real credentials in code with: `git diff`
3. ✅ Check for accidentally committed secrets: `git log -p | grep -i "secret\|key\|password"`
4. ✅ Remove `.DS_Store` files: `find . -name .DS_Store -delete`

## Reporting Security Issues

If you find a security vulnerability, please email igezehei@gmail.com instead of opening a public issue.

## OAuth Security

This site uses Auth0 for authentication:
- All authentication happens via Auth0's secure servers
- No passwords are stored or handled by this application
- OAuth 2.0 / OpenID Connect standards are followed
- Sessions are managed by Auth0 SDK

## Additional Resources

- [Auth0 Security Documentation](https://auth0.com/docs/secure)
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [GitHub Security Best Practices](https://docs.github.com/en/code-security)
