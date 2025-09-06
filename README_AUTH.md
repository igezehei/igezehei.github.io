Auth0 local config

To enable Auth0 login locally without committing secrets, create a file named `auth-config.json` in the site root with the following shape:

{
  "auth0Domain": "dev-xxxxxx.us.auth0.com",
  "auth0ClientId": "YOUR_AUTH0_CLIENT_ID"
}

Then reload the site. The page will try to load `/auth-config.json` at startup and initialize the SDK when both the config and SDK have loaded.

Do not commit `auth-config.json` to source control. An example is provided in `auth-config.example.json`.
