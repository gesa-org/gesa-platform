"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import Button from "@/components/ui/Button";
import ImageUploadField from "@/components/admin/content/ImageUploadField";
import type { HeroContent } from "@/lib/content";

// Full hero editor — currently only used on About (components/Hero.tsx),
// but written against the general HeroContent shape so it can be pointed
// at another page's hero later just by changing contentKey.
export default function HeroEditor({ contentKey, initial }: { contentKey: string; initial: HeroContent }) {
  const [eyebrow, setEyebrow] = useState(initial.eyebrow);
  const [title, setTitle] = useState(initial.title);
  const [highlight, setHighlight] = useState(initial.highlight);
  const [subtitle, setSubtitle] = useState(initial.subtitle);
  const [ctaPrimaryLabel, setCtaPrimaryLabel] = useState(initial.ctaPrimaryLabel);
  const [ctaPrimaryHref, setCtaPrimaryHref] = useState(initial.ctaPrimaryHref);
  const [ctaSecondaryLabel, setCtaSecondaryLabel] = useState(initial.ctaSecondaryLabel);
  const [ctaSecondaryHref, setCtaSecondaryHref] = useState(initial.ctaSecondaryHref);
  const [backgroundImage, setBackgroundImage] = useState(initial.backgroundImage);
  const [published, setPublished] = useState(initial.published);
  const [pending, setPending] = useState(false);
  const [status, setStatus] = useState<"idle" | "saved" | "error">("idle");

  async function onSave(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);
    setStatus("idle");
    const supabase = createClient();
    const value: HeroContent = {
      published,
      eyebrow,
      title,
      highlight,
      subtitle,
      ctaPrimaryLabel,
      ctaPrimaryHref,
      ctaSecondaryLabel,
      ctaSecondaryHref,
      backgroundImage,
    };
    const { error } = await supabase.from("site_content").upsert({ key: contentKey, value }, { onConflict: "key" });
    setPending(false);
    setStatus(error ? "error" : "saved");
  }

  return (
    <form onSubmit={onSave} className="flex flex-col gap-4">
      <label className="flex items-center gap-2.5 text-[14px] font-medium">
        <input type="checkbox" checked={published} onChange={(e) => setPublished(e.target.checked)} className="h-4 w-4" />
        Published
      </label>

      <div>
        <label className="mb-1.5 block text-sm font-semibold">Eyebrow label</label>
        <input
          value={eyebrow}
          onChange={(e) => setEyebrow(e.target.value)}
          className="w-full rounded-xl border border-border px-3.5 py-2.5 focus:border-primary focus:outline-none"
        />
      </div>

      <div>
        <label className="mb-1.5 block text-sm font-semibold">Hero title</label>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full rounded-xl border border-border px-3.5 py-2.5 focus:border-primary focus:outline-none"
        />
      </div>

      <div>
        <label className="mb-1.5 block text-sm font-semibold">Highlighted title text</label>
        <input
          value={highlight}
          onChange={(e) => setHighlight(e.target.value)}
          placeholder="Must exactly match a substring of the title above"
          className="w-full rounded-xl border border-border px-3.5 py-2.5 focus:border-primary focus:outline-none"
        />
      </div>

      <div>
        <label className="mb-1.5 block text-sm font-semibold">Subtitle</label>
        <textarea
          rows={3}
          value={subtitle}
          onChange={(e) => setSubtitle(e.target.value)}
          className="w-full rounded-xl border border-border px-3.5 py-2.5 focus:border-primary focus:outline-none"
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1.5 block text-sm font-semibold">Primary CTA label</label>
          <input
            value={ctaPrimaryLabel}
            onChange={(e) => setCtaPrimaryLabel(e.target.value)}
            className="w-full rounded-xl border border-border px-3.5 py-2.5 focus:border-primary focus:outline-none"
          />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-semibold">Primary CTA link</label>
          <input
            value={ctaPrimaryHref}
            onChange={(e) => setCtaPrimaryHref(e.target.value)}
            className="w-full rounded-xl border border-border px-3.5 py-2.5 focus:border-primary focus:outline-none"
          />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-semibold">Secondary CTA label</label>
          <input
            value={ctaSecondaryLabel}
            onChange={(e) => setCtaSecondaryLabel(e.target.value)}
            className="w-full rounded-xl border border-border px-3.5 py-2.5 focus:border-primary focus:outline-none"
          />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-semibold">Secondary CTA link</label>
          <input
            value={ctaSecondaryHref}
            onChange={(e) => setCtaSecondaryHref(e.target.value)}
            className="w-full rounded-xl border border-border px-3.5 py-2.5 focus:border-primary focus:outline-none"
          />
        </div>
      </div>

      {/* Phase 62 — was a plain URL text input with a manual preview; an
          admin had to already have the image hosted somewhere else and
          paste its address in. Now uses the shared Content Manager upload
          control (same one added to Founders) so a real file can be
          attached directly. */}
      <ImageUploadField
        label="Background image"
        value={backgroundImage}
        onChange={setBackgroundImage}
        pathPrefix="hero"
      />

      <div className="flex items-center gap-4 border-t border-border pt-4">
        <Button type="submit" disabled={pending}>
          {pending ? "Saving…" : "Save changes"}
        </Button>
        {status === "saved" && <span className="text-[13.5px] font-medium text-primary">Saved.</span>}
        {status === "error" && <span className="text-[13.5px] font-medium text-destructive">Couldn&apos;t save — try again.</span>}
      </div>
    </form>
  );
}
