# Demo hub

John David Mitchell's demo hub: a locked set of live demos. Sample data only. This build has real sign-in, a required authenticator code, and approval before anyone can enter. The demos themselves are still marked coming soon.

## What you can do

- **Visitors use a personal invite link.** No password and no authenticator. John creates the invite, and the app shows a long random link and a QR code once. Opening the link sets a signed session cookie and opens the hub. The database stores only a hash of the token.
- **Request access.** Optional. It saves a request. Approving it creates an invite link John can copy.
- **Admin sign-in.** The email in `ADMIN_EMAIL` signs in with a password and an authenticator code. Only that account can create or revoke invites. Google stays off until its keys are set. Passkeys are marked coming soon.
- **Revoke.** A revoked invite and every session from it stop working immediately. Invites expire in 30 days unless John picks another length.
- **Hub home.** John's name and title, a plain-English banner, three steps, and nine coming-soon cards.
- **Every screen** is labeled **Demo - sample data only**.

Without a valid invite session or an admin session, hub routes show a locked page: "This demo hub is private. Ask John for an invite link." There is no guest pass.

## What is not in this build

- No live demos, and no sample records beyond the card text and access requests you create.
- No passkeys yet.
- Not deployed.

## Stack

Next.js, Tailwind, Better Auth, and Postgres (a Neon connection string works). The route gate lives in `proxy.ts`. That is Next.js's server-side check on each request, the successor to middleware.

## Run locally

Copy the example env file and fill in real values. Do not commit `.env`.

```bash
cp .env.example .env
npm install
npx auth@latest migrate
npm run dev
```

### Env vars

| Name | Required | What to set |
| --- | --- | --- |
| `DATABASE_URL` | Yes | Postgres connection string. Local Postgres or Neon. |
| `BETTER_AUTH_SECRET` | Yes | A random secret, at least 32 characters. |
| `BETTER_AUTH_URL` | Yes | The URL you open in the browser, such as `http://localhost:3000`. |
| `ADMIN_EMAIL` | Yes | The one email that can approve requests. This account still signs in and uses an authenticator. |
| `GOOGLE_CLIENT_ID` | No | Google OAuth client id. Leave empty to keep the Google button disabled. |
| `GOOGLE_CLIENT_SECRET` | No | Google OAuth client secret. |

`npx auth@latest migrate` creates the Better Auth tables in `DATABASE_URL`. Access requests get their own table the first time someone submits one.

Sign in once at `/admin/sign-in` as `ADMIN_EMAIL` and scan the authenticator code. After that, open **Access** on the hub to create invite links. Visitors do not need email sending, a password, or an authenticator.
