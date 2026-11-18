import type { Metadata } from "next";
import { SignInFlow } from "@/components/sign-in-flow";

export const metadata: Metadata = {
  title: "Sign in",
  description:
    "Sign in to John David Mitchell's demo hub. Approved access and a second factor are required.",
};

export default function HomePage() {
  return <SignInFlow />;
}
