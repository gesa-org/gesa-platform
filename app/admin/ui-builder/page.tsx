import { requireAdmin } from "@/lib/auth/requireAdmin";
import UiBuilderTabs from "@/components/admin/ui-builder/UiBuilderTabs";

export const dynamic = "force-dynamic";

// Phase 132 — UI Builder entry page. `requireAdmin()` (redirect-based) is
// correct here since this is a Server Component page, not a fetch-based API
// route — see app/api/admin/ui-builder/*/route.ts for why those use the
// inline getCurrentProfile()+JSON pattern instead. app/admin/layout.tsx
// already calls requireAdmin() once for every /admin/** route; calling it
// again here is redundant but harmless and matches the existing convention
// in app/admin/users/page.tsx.
export default async function UIBuilderPage() {
  await requireAdmin();

  return (
    <div>
      <div className="mb-5">
        <h2 className="text-lg">UI Builder</h2>
        <p className="mt-1 text-[13px] text-muted-fg">
          Edit site-wide colors and typography, or switch to Page Content to click-select and edit text directly
          on a live preview of a specific page. Draft edits save automatically as you go — nothing goes live
          until you click Publish.
        </p>
      </div>
      <UiBuilderTabs />
    </div>
  );
}
