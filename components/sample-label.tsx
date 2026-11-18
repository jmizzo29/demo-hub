export function SampleLabel({ tone = "muted" }: { tone?: "muted" | "light" }) {
  return (
    <p
      className={
        tone === "light"
          ? "text-[11px] font-medium tracking-wide whitespace-nowrap text-[#c9d3e3]"
          : "text-[11px] font-medium tracking-wide whitespace-nowrap text-muted"
      }
    >
      Demo - sample data only
    </p>
  );
}
