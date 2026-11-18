export function Mark({ tone = "solid" }: { tone?: "solid" | "ghost" }) {
  const styles =
    tone === "ghost"
      ? "border border-white/20 bg-white/10 text-white"
      : "bg-ink text-white";

  return (
    <span
      className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl text-sm font-bold tracking-tight ${styles}`}
      aria-hidden="true"
    >
      JM
    </span>
  );
}
