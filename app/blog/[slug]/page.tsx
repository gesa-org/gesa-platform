import { redirect } from "next/navigation";

// Disabled along with /blog itself (see app/blog/page.tsx) — no reason to
// leave individual post URLs reachable while the list page is turned off.
export default function BlogPostPage() {
  redirect("/");
}
