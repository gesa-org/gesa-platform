import { redirect } from "next/navigation";

// Disabled for now — Roy asked for the Blog page to be unreachable since
// there's no real content to show yet. Its nav entry moved from the header
// into the Footer's Explore column as a non-clickable "Soon" label (see
// components/Footer.tsx), and this route now just bounces straight back to
// Home instead of rendering the (empty) blog list, in case someone hits
// /blog directly via a bookmark, old link, or search result. The real list
// page (queries against getPublishedBlogPosts(), card grid, etc.) is still
// in git history from before this change — re-enable by restoring that and
// removing this redirect once there's something to publish.
export default function BlogPage() {
  redirect("/");
}
