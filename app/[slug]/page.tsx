import { notFound } from "next/navigation";
import { getLegalPage } from "@/lib/queries";
import { getPageDefinition } from "@/lib/ui-builder/pageRegistry";
import { resolveEditorPreview } from "@/lib/ui-builder/pageContentResolver";
import EditorPreviewBridge from "@/components/ui-builder/public/EditorPreviewBridge";
import EditableText from "@/components/ui-builder/public/EditableText";

// Phase 140 — every legal page's `slug` doubles as its Page Content
// registry `pageKey` (see lib/ui-builder/pageRegistry.ts's `legalPageSlug`
// field) — checking `supportsVisualEditor` here is a defensive fallback for
// any slug that isn't one of the 5 registered legal pages (there shouldn't
// be one, since `getLegalPage` already 404s on an unknown slug, but this
// keeps a random future `legal_pages` row from being treated as visually
// editable before it's deliberately registered).
export default async function LegalPage({
  params,
  searchParams,
}: {
  params: { slug: string };
  searchParams?: { [key: string]: string | string[] | undefined };
}) {
  const page = await getLegalPage(params.slug);
  if (!page) notFound();

  const def = getPageDefinition(params.slug);
  if (!def?.supportsVisualEditor) {
    return (
      <section className="section narrow">
        <h1 className="mb-4 text-[34px]">{page.title}</h1>
        <p className="whitespace-pre-line text-muted-fg">{page.body}</p>
      </section>
    );
  }

  const { resolved, isEditorPreview } = await resolveEditorPreview(
    params.slug,
    { title: page.title, body: page.body } as unknown as Record<string, unknown>,
    searchParams
  );
  const content = resolved as unknown as { title: string; body: string };

  const rendered = (
    <section className="section narrow">
      <h1 className="mb-4 text-[34px]">
        <EditableText contentId={`${params.slug}.title`} label="Title" value={content.title} as="span" />
      </h1>
      <div className="whitespace-pre-line text-muted-fg">
        <EditableText contentId={`${params.slug}.body`} label="Body" value={content.body} as="span" />
      </div>
    </section>
  );

  return isEditorPreview ? <EditorPreviewBridge>{rendered}</EditorPreviewBridge> : rendered;
}
