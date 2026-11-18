# Demo hub

John David Mitchell's demo hub: a locked set of live demos. Sample data only. This build has real sign-in, a required authenticator code, and approval before anyone can enter. The demos themselves are still marked coming soon.

## What you can do

- **Request access.** The form saves a pending request. That person stays out until an admin approves it.
- **Sign in.** Approved email and a password. The first sign-in chooses the password. Google is wired, and stays off until `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` are set. Passkeys are marked coming soon.
- **Authenticator.** The first sign-in asks you to scan a QR code. Every later sign-in asks for the 6-digit code. The hub does not open without it.
- **Admin.** The email in `ADMIN_EMAIL` can open Access requests, then approve or deny. That page also requires the authenticator code.
- **Hub home.** John's name and title, a plain-English banner, three steps, and nine coming-soon cards.
- **Every screen** is labeled **Demo - sample data only**.

A direct visit to `/hub` or `/admin` without an approved, signed-in user who has passed the authenticator step is sent back to sign-in. There is no guest pass.

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

Sign in once as `ADMIN_EMAIL`, scan the authenticator QR code, then open **Access** on the hub to approve other people. Email sending is not required: sign-in is the email plus the password chosen on first use.
