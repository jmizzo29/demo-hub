"use server";

import { revalidatePath } from "next/cache";
import { decideRequest } from "@/lib/access";
import { requireAdmin } from "@/lib/guard";

export async function decide(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const decision = formData.get("decision");
  if (!id || (decision !== "approved" && decision !== "denied")) return;
  await decideRequest(id, decision);
  revalidatePath("/admin");
}
