"use client";

import { useEffect, useId, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import QRCode from "react-qr-code";
import { Mark } from "@/components/mark";
import { SampleLabel } from "@/components/sample-label";
import { authClient } from "@/lib/auth-client";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type Step = "identify" | "mfa" | "enroll" | "request" | "sent";
type Method = "email" | "google";

const principles = [
  {
    title: "Approved access",
    body: "John allows who can enter. There is no guest pass.",
  },
  {
    title: "Second factor",
    body: "Every visit confirms a code from an authenticator app.",
  },
  {
    title: "No public browsing",
    body: "The hub stays closed until both checks are done.",
  },
];

export function SignInFlow() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("identify");
  const [method, setMethod] = useState<Method>("email");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [googleEnabled, setGoogleEnabled] = useState(false);
  const [name, setName] = useState("");
  const [requestEmail, setRequestEmail] = useState("");
  const [note, setNote] = useState("");
  const [error, setError] = useState("");
  const headingRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    headingRef.current?.focus();
  }, [step]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const accessDenied = params.get("error") === "access";
    const enrollRequested = params.get("enroll") === "1";
    const mfaRequested = params.get("mfa") === "1";
    let cancelled = false;
    void (async () => {
      const response = await fetch("/api/gate");
      const data = (await response.json()) as {
        state: "ready" | "enroll" | "mfa" | "signed-out";
        email?: string;
        google?: boolean;
      };
      if (cancelled) return;
      if (accessDenied) {
        setError(
          "This email does not have access yet. Request access and wait for approval.",
        );
      }
      setGoogleEnabled(Boolean(data.google));
      if (data.email) setEmail(data.email);
      if (data.state === "ready") {
        router.push("/hub");
        return;
      }
      if (data.state === "enroll" || enrollRequested) setStep("enroll");
      if (data.state === "mfa" || mfaRequested) setStep("mfa");
    })();
    return () => {
      cancelled = true;
    };
  }, [router]);

  async function submitEmail(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!EMAIL_PATTERN.test(email.trim())) {
      setError("Enter the email on your approved access.");
      return;
    }
    if (password.length < 8) {
      setError("Use a password of at least 8 characters.");
      return;
    }
    setError("");
    setMethod("email");
    const response = await fetch("/api/sign-in", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email: email.trim(), password }),
    });
    const data = (await response.json()) as { error?: string; step?: "mfa" | "enroll" };
    if (!response.ok) {
      setError(data.error || "Sign-in failed.");
      return;
    }
    setStep(data.step === "mfa" ? "mfa" : "enroll");
  }

  async function continueWithGoogle() {
    if (!googleEnabled) {
      setError("Google sign-in is not set up yet.");
      return;
    }
    setError("");
    setMethod("google");
    await authClient.signIn.social({
      provider: "google",
      callbackURL: "/hub",
    });
  }

  async function confirmCode(code: string) {
    const result = await authClient.twoFactor.verifyTotp({ code });
    if (result.error) {
      setError("That code is not valid. Try the current code from your authenticator.");
      return;
    }
    router.push("/hub");
  }

  async function submitRequest(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (name.trim().length < 2) {
      setError("Enter your name.");
      return;
    }
    if (!EMAIL_PATTERN.test(requestEmail.trim())) {
      setError("Enter an email address.");
      return;
    }
    setError("");
    const response = await fetch("/api/access-request", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        name: name.trim(),
        email: requestEmail.trim(),
        note,
      }),
    });
    const data = (await response.json()) as { error?: string };
    if (!response.ok) {
      setError(data.error || "The request could not be saved.");
      return;
    }
    setStep("sent");
  }

  return (
    <div className="flex min-h-dvh flex-col bg-white lg:grid lg:grid-cols-2">
      <header className="sticky top-0 z-10 border-b border-white/10 bg-ink px-5 py-3 text-white lg:hidden">
        <div className="flex items-center gap-3">
          <Mark tone="ghost" />
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold">John David Mitchell</p>
            <p className="truncate text-xs text-mist">
              Solutions Architect &amp; Integration Leader
            </p>
          </div>
        </div>
        <p className="mt-2 text-xs leading-snug text-[#c9d3e3]">
          Approved access and a second factor. No guest pass.
        </p>
        <div className="mt-1.5">
          <SampleLabel tone="light" />
        </div>
      </header>
      <aside className="hidden bg-ink bg-linear-to-b from-ink to-ink-2 px-5 py-5 text-white sm:px-8 lg:sticky lg:top-0 lg:flex lg:h-dvh lg:flex-col lg:overflow-y-auto lg:px-14 lg:py-12">
        <div className="mx-auto flex w-full max-w-xl flex-1 flex-col justify-center">
          <div className="flex items-center justify-between gap-4">
            <Mark tone="ghost" />
            <SampleLabel tone="light" />
          </div>

          <div className="mt-10">
            <p className="text-xs font-bold tracking-[0.16em] text-mist uppercase">
              Private demo hub
            </p>
            <p className="mt-4 text-sm font-semibold text-white">
              John David Mitchell
            </p>
            <p className="mt-1 text-sm text-mist">
              Solutions Architect &amp; Integration Leader
            </p>
            <p className="mt-6 max-w-[12ch] text-5xl font-extrabold tracking-tight text-white">
              A resume you can demo.
            </p>
            <p className="mt-5 max-w-md text-lg leading-relaxed text-[#d5deea]">
              Integrations, data, cloud, identity, AI, ML, and agents. Live,
              and only for people with approved access.
            </p>
            <ul className="mt-10 space-y-5">
              {principles.map((item, index) => (
                <li key={item.title} className="flex gap-4">
                  <span className="mt-0.5 text-xs font-bold tracking-[0.14em] text-mist">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <span>
                    <span className="block text-sm font-semibold text-white">
                      {item.title}
                    </span>
                    <span className="mt-1 block text-sm leading-relaxed text-[#c9d3e3]">
                      {item.body}
                    </span>
                  </span>
                </li>
              ))}
            </ul>
          </div>

          <p className="mt-12 text-sm text-[#c9d3e3]">
            <a
              href="https://johndavidmitchell.vercel.app"
              target="_blank"
              rel="noreferrer"
              className="font-semibold text-white underline-offset-4 hover:underline"
            >
              Public portfolio
            </a>
          </p>
        </div>
      </aside>

      <main className="flex flex-1 bg-white px-5 py-8 sm:px-8 lg:items-center lg:px-14 lg:py-12">
        <div className="mx-auto w-full max-w-md">
          <div>
            {step === "identify" ? (
              <IdentifyStep
                email={email}
                password={password}
                error={error}
                headingRef={headingRef}
                onEmailChange={(value) => {
                  setEmail(value);
                  if (error) setError("");
                }}
                onPasswordChange={(value) => {
                  setPassword(value);
                  if (error) setError("");
                }}
                onSubmitEmail={submitEmail}
                onGoogle={continueWithGoogle}
                onRequest={() => {
                  setError("");
                  setStep("request");
                }}
              />
            ) : null}
            {step === "mfa" ? (
              <MfaStep
                method={method}
                email={email.trim()}
                error={error}
                headingRef={headingRef}
                onConfirm={confirmCode}
                onBack={() => {
                  setError("");
                  setStep("identify");
                }}
              />
            ) : null}
            {step === "enroll" ? (
              <EnrollStep
                password={password}
                headingRef={headingRef}
                error={error}
                onError={setError}
                onConfirm={confirmCode}
              />
            ) : null}
            {step === "request" ? (
              <RequestStep
                name={name}
                email={requestEmail}
                note={note}
                error={error}
                headingRef={headingRef}
                onNameChange={(value) => {
                  setName(value);
                  if (error) setError("");
                }}
                onEmailChange={(value) => {
                  setRequestEmail(value);
                  if (error) setError("");
                }}
                onNoteChange={setNote}
                onSubmit={submitRequest}
                onBack={() => {
                  setError("");
                  setStep("identify");
                }}
              />
            ) : null}
            {step === "sent" ? (
              <SentStep
                headingRef={headingRef}
                onBack={() => {
                  setName("");
                  setRequestEmail("");
                  setNote("");
                  setError("");
                  setStep("identify");
                }}
              />
            ) : null}
          </div>
        </div>
      </main>
    </div>
  );
}

function IdentifyStep({
  email,
  password,
  error,
  headingRef,
  onEmailChange,
  onPasswordChange,
  onSubmitEmail,
  onGoogle,
  onRequest,
}: {
  email: string;
  password: string;
  error: string;
  headingRef: React.RefObject<HTMLHeadingElement | null>;
  onEmailChange: (value: string) => void;
  onPasswordChange: (value: string) => void;
  onSubmitEmail: (event: React.FormEvent<HTMLFormElement>) => void;
  onGoogle: () => void;
  onRequest: () => void;
}) {
  const emailId = useId();
  const passwordId = useId();
  const errorId = useId();

  return (
    <>
      <h1
        ref={headingRef}
        tabIndex={-1}
        className="text-3xl font-extrabold tracking-tight text-ink outline-none"
      >
        Sign in
      </h1>
      <p className="mt-3 text-base leading-relaxed text-muted">
        Use the email on your approved access, or Google. A second factor
        comes next.
      </p>
      <form className="mt-8 space-y-4" onSubmit={onSubmitEmail} noValidate>
        <div className="flex flex-col gap-1.5">
          <label htmlFor={emailId} className="text-sm font-semibold text-ink">
            Email
          </label>
          <input
            id={emailId}
            type="email"
            inputMode="email"
            autoComplete="username"
            value={email}
            onChange={(event) => onEmailChange(event.target.value)}
            placeholder="name@company.com"
            aria-invalid={error ? true : undefined}
            aria-describedby={error ? errorId : undefined}
            className="h-12 rounded-xl border border-line bg-white px-3.5 text-base text-ink placeholder:text-muted/70"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor={passwordId} className="text-sm font-semibold text-ink">
            Password
          </label>
          <input
            id={passwordId}
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(event) => onPasswordChange(event.target.value)}
            aria-invalid={error ? true : undefined}
            aria-describedby={error ? errorId : undefined}
            className="h-12 rounded-xl border border-line bg-white px-3.5 text-base text-ink"
          />
          <p className="text-xs leading-relaxed text-muted">
            The first sign-in sets this password. After that, use it with your authenticator.
          </p>
        </div>
        {error ? (
          <p id={errorId} role="alert" className="text-sm font-medium text-red-700">
            {error}
          </p>
        ) : null}
        <button
          type="submit"
          className="h-12 w-full rounded-xl bg-ink text-sm font-semibold text-white hover:bg-ink-2"
        >
          Continue
        </button>
      </form>
      <div className="my-5 flex items-center gap-3 text-xs font-semibold tracking-wide text-muted uppercase">
        <span className="h-px flex-1 bg-line" />
        or
        <span className="h-px flex-1 bg-line" />
      </div>
      <button
        type="button"
        onClick={onGoogle}
        className="flex h-12 w-full items-center justify-center gap-3 rounded-xl border border-line bg-white text-sm font-semibold text-ink hover:bg-soft"
      >
        <GoogleMark />
        Continue with Google
      </button>
      <p className="mt-8 text-sm text-muted">
        No access yet?{" "}
        <button
          type="button"
          onClick={onRequest}
          className="font-semibold text-accent hover:underline"
        >
          Request access
        </button>
      </p>
    </>
  );
}

function MfaStep({
  method,
  email,
  error,
  headingRef,
  onConfirm,
  onBack,
}: {
  method: Method;
  email: string;
  error: string;
  headingRef: React.RefObject<HTMLHeadingElement | null>;
  onConfirm: (code: string) => void;
  onBack: () => void;
}) {
  return (
    <>
      <h1
        ref={headingRef}
        tabIndex={-1}
        className="text-3xl font-extrabold tracking-tight text-ink outline-none"
      >
        Second step
      </h1>
      <p className="mt-3 text-base leading-relaxed text-muted">
        {method === "google" ? "Continuing with Google." : `${email}.`} Confirm
        with the code from your authenticator.
      </p>
      <AuthenticatorForm onConfirm={onConfirm} />
      {error ? (
        <p role="alert" className="mt-3 text-sm font-medium text-red-700">
          {error}
        </p>
      ) : null}
      <div className="my-5 flex items-center gap-3 text-xs font-semibold tracking-wide text-muted uppercase">
        <span className="h-px flex-1 bg-line" />
        or
        <span className="h-px flex-1 bg-line" />
      </div>
      <button
        type="button"
        disabled
        className="flex h-12 w-full items-center justify-center gap-3 rounded-xl border border-line bg-white text-sm font-semibold text-ink disabled:cursor-not-allowed disabled:text-muted"
      >
        <PasskeyIcon />
        Use a passkey
        <span className="text-xs font-medium">Coming soon</span>
      </button>
      <button
        type="button"
        onClick={onBack}
        className="mt-6 text-sm font-semibold text-accent hover:underline"
      >
        Back
      </button>
    </>
  );
}

function AuthenticatorForm({ onConfirm }: { onConfirm: (code: string) => void }) {
  const [digits, setDigits] = useState<string[]>(["", "", "", "", "", ""]);
  const inputs = useRef<Array<HTMLInputElement | null>>([]);
  const groupId = useId();
  const complete = digits.every((digit) => digit.length === 1);

  function focusAt(index: number) {
    inputs.current[Math.max(0, Math.min(index, 5))]?.focus();
  }

  function writeFrom(index: number, raw: string) {
    const clean = raw.replace(/\D/g, "");
    if (!clean) {
      setDigits((current) => {
        const next = [...current];
        next[index] = "";
        return next;
      });
      return;
    }
    const chars = clean.slice(0, 6 - index).split("");
    setDigits((current) => {
      const next = [...current];
      chars.forEach((char, offset) => {
        next[index + offset] = char;
      });
      return next;
    });
    focusAt(index + chars.length);
  }

  return (
    <form
      className="mt-8"
      onSubmit={(event) => {
        event.preventDefault();
        if (complete) onConfirm(digits.join(""));
      }}
    >
      <label id={groupId} className="text-sm font-semibold text-ink">
        Authenticator code
      </label>
      <div
        className="mt-2 flex gap-2"
        role="group"
        aria-labelledby={groupId}
        onPaste={(event) => {
          const text = event.clipboardData.getData("text");
          if (!/\d/.test(text)) return;
          event.preventDefault();
          writeFrom(0, text);
        }}
      >
        {digits.map((digit, index) => (
          <input
            key={index}
            ref={(node) => {
              inputs.current[index] = node;
            }}
            value={digit}
            onChange={(event) => writeFrom(index, event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Backspace" && !digits[index] && index > 0) {
                setDigits((current) => {
                  const next = [...current];
                  next[index - 1] = "";
                  return next;
                });
                focusAt(index - 1);
              }
              if (event.key === "ArrowLeft") focusAt(index - 1);
              if (event.key === "ArrowRight") focusAt(index + 1);
            }}
            inputMode="numeric"
            autoComplete={index === 0 ? "one-time-code" : "off"}
            aria-label={`Digit ${index + 1}`}
            onFocus={(event) => event.currentTarget.select()}
            className="h-12 w-full min-w-0 rounded-xl border border-line bg-white text-center text-lg font-semibold text-ink tabular-nums"
          />
        ))}
      </div>
      <button
        type="submit"
        disabled={!complete}
        className="mt-4 h-12 w-full rounded-xl bg-ink text-sm font-semibold text-white hover:bg-ink-2 disabled:cursor-not-allowed disabled:bg-line disabled:text-muted"
      >
        Confirm
      </button>
    </form>
  );
}

function RequestStep({
  name,
  email,
  note,
  error,
  headingRef,
  onNameChange,
  onEmailChange,
  onNoteChange,
  onSubmit,
  onBack,
}: {
  name: string;
  email: string;
  note: string;
  error: string;
  headingRef: React.RefObject<HTMLHeadingElement | null>;
  onNameChange: (value: string) => void;
  onEmailChange: (value: string) => void;
  onNoteChange: (value: string) => void;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
  onBack: () => void;
}) {
  const nameId = useId();
  const emailId = useId();
  const noteId = useId();
  const errorId = useId();

  return (
    <>
      <h1
        ref={headingRef}
        tabIndex={-1}
        className="text-3xl font-extrabold tracking-tight text-ink outline-none"
      >
        Request access
      </h1>
      <p className="mt-3 text-base leading-relaxed text-muted">
        Tell John who you are. He approves access before anyone can sign in.
      </p>
      <form className="mt-8 space-y-4" onSubmit={onSubmit} noValidate>
        <Field
          id={nameId}
          label="Name"
          value={name}
          onChange={onNameChange}
          autoComplete="name"
          describedBy={error ? errorId : undefined}
          invalid={Boolean(error) && name.trim().length < 2}
        />
        <Field
          id={emailId}
          label="Email"
          type="email"
          value={email}
          onChange={onEmailChange}
          autoComplete="email"
          describedBy={error ? errorId : undefined}
          invalid={Boolean(error) && !EMAIL_PATTERN.test(email.trim())}
        />
        <div className="flex flex-col gap-1.5">
          <label htmlFor={noteId} className="text-sm font-semibold text-ink">
            What you want to see
            <span className="ml-2 font-medium text-muted">Optional</span>
          </label>
          <textarea
            id={noteId}
            value={note}
            onChange={(event) => onNoteChange(event.target.value)}
            rows={3}
            className="rounded-xl border border-line bg-white px-3.5 py-3 text-base text-ink"
          />
        </div>
        {error ? (
          <p id={errorId} role="alert" className="text-sm font-medium text-red-700">
            {error}
          </p>
        ) : null}
        <button
          type="submit"
          className="h-12 w-full rounded-xl bg-ink text-sm font-semibold text-white hover:bg-ink-2"
        >
          Submit request
        </button>
      </form>
      <button
        type="button"
        onClick={onBack}
        className="mt-6 text-sm font-semibold text-accent hover:underline"
      >
        Back to sign in
      </button>
    </>
  );
}

function EnrollStep({
  password,
  headingRef,
  error,
  onError,
  onConfirm,
}: {
  password: string;
  headingRef: React.RefObject<HTMLHeadingElement | null>;
  error: string;
  onError: (message: string) => void;
  onConfirm: (code: string) => void;
}) {
  const [totpUri, setTotpUri] = useState("");
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [savedPassword, setSavedPassword] = useState(password);

  useEffect(() => {
    if (!savedPassword) return;
    let cancelled = false;
    void (async () => {
      const enabled = await authClient.twoFactor.enable({ password: savedPassword });
      if (cancelled) return;
      if (enabled.data && "totpURI" in enabled.data && enabled.data.totpURI) {
        setTotpUri(enabled.data.totpURI);
        setBackupCodes(enabled.data.backupCodes ?? []);
        return;
      }
      const existing = await authClient.twoFactor.getTotpUri({ password: savedPassword });
      if (cancelled) return;
      if (existing.data?.totpURI) {
        setTotpUri(existing.data.totpURI);
        return;
      }
      onError(enabled.error?.message || "The authenticator could not be set up.");
    })();
    return () => {
      cancelled = true;
    };
  }, [onError, savedPassword]);

  if (!savedPassword) {
    return (
      <form
        className="space-y-4"
        onSubmit={(event) => {
          event.preventDefault();
          const field = new FormData(event.currentTarget).get("password");
          const value = String(field ?? "");
          if (value.length < 8) {
            onError("Enter the password for this email.");
            return;
          }
          onError("");
          setSavedPassword(value);
        }}
      >
        <h1
          ref={headingRef}
          tabIndex={-1}
          className="text-3xl font-extrabold tracking-tight text-ink outline-none"
        >
          Set up your authenticator
        </h1>
        <p className="mt-3 text-base leading-relaxed text-muted">
          Enter the password for this email to start the authenticator setup.
        </p>
        <label htmlFor="enroll-password" className="mt-6 block text-sm font-semibold text-ink">
          Password
        </label>
        <input
          id="enroll-password"
          name="password"
          type="password"
          autoComplete="current-password"
          className="mt-1.5 h-12 w-full rounded-xl border border-line bg-white px-3.5 text-base text-ink"
        />
        {error ? (
          <p role="alert" className="text-sm font-medium text-red-700">
            {error}
          </p>
        ) : null}
        <button
          type="submit"
          className="h-12 w-full rounded-xl bg-ink text-sm font-semibold text-white hover:bg-ink-2"
        >
          Continue
        </button>
      </form>
    );
  }

  const secret = new URL(totpUri || "otpauth://totp/setup").searchParams.get("secret");

  return (
    <>
      <h1
        ref={headingRef}
        tabIndex={-1}
        className="text-3xl font-extrabold tracking-tight text-ink outline-none"
      >
        Set up your authenticator
      </h1>
      <p className="mt-3 text-base leading-relaxed text-muted">
        Scan this with an authenticator app, then enter the 6-digit code. This
        is required before the hub opens.
      </p>
      {totpUri ? (
        <div className="mt-6 flex justify-center rounded-2xl border border-line bg-white p-4">
          <QRCode value={totpUri} size={168} />
        </div>
      ) : null}
      {secret ? (
        <p className="mt-3 break-all text-xs leading-relaxed text-muted">
          Or enter this key manually: <span className="font-semibold text-ink">{secret}</span>
        </p>
      ) : null}
      {backupCodes.length > 0 ? (
        <p className="mt-3 text-xs leading-relaxed text-muted">
          Save these backup codes. Each works once if you lose the app:{" "}
          <span className="font-semibold text-ink">{backupCodes.join(", ")}</span>
        </p>
      ) : null}
      <AuthenticatorForm onConfirm={onConfirm} />
      {error ? (
        <p role="alert" className="mt-3 text-sm font-medium text-red-700">
          {error}
        </p>
      ) : null}
    </>
  );
}

function SentStep({
  headingRef,
  onBack,
}: {
  headingRef: React.RefObject<HTMLHeadingElement | null>;
  onBack: () => void;
}) {
  return (
    <>
      <h1
        ref={headingRef}
        tabIndex={-1}
        className="text-3xl font-extrabold tracking-tight text-ink outline-none"
      >
        Request noted
      </h1>
      <p className="mt-3 text-base leading-relaxed text-muted">
        John reviews the request before you can sign in.
      </p>
      <button
        type="button"
        onClick={onBack}
        className="mt-8 h-12 w-full rounded-xl bg-ink text-sm font-semibold text-white hover:bg-ink-2"
      >
        Back to sign in
      </button>
    </>
  );
}

function Field({
  id,
  label,
  value,
  onChange,
  type = "text",
  autoComplete,
  describedBy,
  invalid,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  autoComplete?: string;
  describedBy?: string;
  invalid?: boolean;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-semibold text-ink">
        {label}
      </label>
      <input
        id={id}
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        autoComplete={autoComplete}
        aria-invalid={invalid || undefined}
        aria-describedby={describedBy}
        className="h-12 rounded-xl border border-line bg-white px-3.5 text-base text-ink"
      />
    </div>
  );
}

function GoogleMark() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z"
      />
      <path
        fill="#34A853"
        d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z"
      />
      <path
        fill="#FBBC05"
        d="M3.964 10.706A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.706V4.962H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.038l3.007-2.332z"
      />
      <path
        fill="#EA4335"
        d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.962L3.964 7.294C4.672 5.167 6.656 3.58 9 3.58z"
      />
    </svg>
  );
}

function PasskeyIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="9" cy="14" r="4" stroke="currentColor" strokeWidth="1.8" />
      <path
        d="M12.2 12.2 20 4.5m0 0h-3.2M20 4.5v3.2"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
