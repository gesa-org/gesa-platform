const STATS = [
  { value: "200+", label: "Verified therapists" },
  { value: "6", label: "Free sessions each" },
  { value: "20+", label: "Languages supported" },
  { value: "Global", label: "Support circles" },
];

export default function Stats() {
  return (
    <section className="border-y border-border bg-card py-14">
      <div className="mx-auto grid max-w-[1160px] grid-cols-2 gap-6 px-6 text-center md:grid-cols-4">
        {STATS.map((s) => (
          <div key={s.label}>
            <div className="font-serif text-[46px] font-semibold tracking-tight text-primary">{s.value}</div>
            <div className="text-muted-fg">{s.label}</div>
          </div>
        ))}
      </div>
    </section>
  );
}
