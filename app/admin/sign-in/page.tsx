import type { Metadata } from "next";
import { SignInFlow } from "@/components/sign-in-flow";

export const metadata: Metadata = {
  title: "Admin sign in",
  description: "Admin sign-in for John David Mitchell's demo hub.",
};

export default function AdminSignInPage() {
  return <SignInFlow />;
}
