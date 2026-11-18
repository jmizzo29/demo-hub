# Demo hub

First look-and-feel of John David Mitchell's demo hub, for review before any demo is added.

This is a resume you can demo: a locked hub of live integrations, data, cloud, identity, AI, ML, and agent work. This build is the shell only, so the vision can be signed off before anything else is built.

## What is in this build

- **Sign in (visual only).** Email or Google, then a second step: authenticator code or passkey. **Request access** is there for people who are not approved yet. There is no guest pass and no public catalog.
- **Hub home.** John's name and title, a one-line intro, a plain-English banner that says what the hub is, three short steps for how to use it, and nine demo cards. Each card has the problem, the skill it proves, a tech tag, and the status **Coming soon**.
- **Every screen** is labeled **Demo - sample data only**.

Opening `/hub` directly, without stepping through sign-in, shows a locked screen.

## What is not in this build

- No real authentication, MFA, passkeys, or access requests. Any six-digit code, or the passkey button, continues into the preview. Nothing is stored on a server and nothing is sent.
- The sign-in flag is a browser cookie used only so this preview can show the hub. It is not access control.
- No live demos, and no sample records beyond the card text.
- Not deployed.

## Stack

Next.js and Tailwind. Small on purpose, and suitable to deploy on Vercel later.

## Run locally

```bash
npm install
npm run dev
```

Then open the local URL Next prints. Sign in with any email, enter any six digits (or choose the passkey), and the hub opens. Sign out returns to the lock.
