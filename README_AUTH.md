Auth0 Local Configuration Setup

This document outlines how to configure Auth0 authentication for local development without exposing sensitive credentials in your version control system.

## Configuration File Setup

To enable Auth0 login locally, create a file named `auth-config.json` in the site root:

```json
{
  "auth0Domain": "dev-xxxxxx.us.auth0.com",
  "auth0ClientId": "YOUR_AUTH0_CLIENT_ID"
}
```

## How It Works

The application uses the **Auth0 SPA (Single Page Application) SDK** for secure authentication. After you create `auth-config.json` and reload the site:

1. The page loads `/auth-config.json` at startup
2. The Auth0 SDK initializes with your credentials
3. Users are redirected to Auth0's secure login page
4. After authentication, users return to your application
5. Session tokens are managed securely by the Auth0 SDK

## Security Measures

✅ **No Hardcoded Credentials**: Credentials stored only in `auth-config.json`
✅ **Server-Side Authentication**: Auth0 handles all security
✅ **OAuth 2.0 Standard**: Industry-standard protocol
✅ **Version Control Protection**: `auth-config.json` is in `.gitignore`

**Critical**: Do not commit `auth-config.json` to source control. An example is provided in `auth-config.example.json`.
