# Mobile UX audit

## Scope and evidence

The supplied iPhone screenshots showed two visible symptoms: a desktop-scale header consuming too much vertical space, and fixed help/accessibility controls competing with the first pathway cards. The shared responsive layout, public routes, professional directory/profile, booking and support dialogs, volunteer/donation forms, dashboard navigation, data tables, footer, and reusable primitives were reviewed.

The current production homepage was inspected at 390 px before these source changes. It already has the corrected `viewport-fit=cover` metadata and compact mobile header from the preceding responsive release; the document width matched the content width with no page-level horizontal scrollbar. The changes below close remaining reusable component gaps so the same behaviour is retained across pages and dialogs.

| Finding | Root cause | Affected areas | Fix implemented | Verification |
| --- | --- | --- | --- | --- |
| Mobile browser content was previously rendered at a desktop-like scale. | Missing/incorrect mobile viewport handling in the earlier release. | Shared application shell and header. | The shared layout now retains `width=device-width`, `initial-scale=1`, and `viewport-fit=cover`; the existing compact header/drawer activates below `lg`. | Production checked at 390 px: compact header and document/content widths matched. |
| Text inputs could trigger iOS zoom and controls could be hard to tap. | Many independently styled forms used sub-16 px text or lacked an explicit minimum control height. | Contact, booking, support, volunteer, donation, and dashboard forms. | Shared mobile CSS applies 16 px text and 44 px minimum height to text inputs/selects. The shared button, dashboard/professional navigation, and dialog close buttons have 44 px targets and visible focus rings. | Unit tests assert the shared button and mobile menu touch-target classes; type-check/build run after changes. |
| Complex dialogs could be cut off by mobile browser chrome/notches or have undersized close controls. | Custom dialog shells used fixed `vh` max-heights and fixed padding without safe-area calculations. | Find Support, Browse Professionals, legacy booking, inquiry details, notification details, destructive confirmation; all shared `Modal` consumers. | Dialogs use `100dvh` and safe-area-aware outer padding; tall content scrolls inside the panel; close controls are 44 px. The shared `Modal` already portals and traps focus, preserving background/keyboard behaviour. | Source review of modal shell classes plus type-check/build. |
| Profile actions and selected donation/volunteer fields could overflow or feel cramped on a narrow phone. | Fixed desktop widths were retained at the base breakpoint. | Individual professional page, volunteer duration, donation amount and phone fields. | Actions and affected fields are full-width by default, with the previous fixed widths restored from `sm` upward. | Responsive class review and type-check/build. |
| Dense CRM tables became too compressed on phones. | Tables were technically contained by scroll wrappers but had no minimum readable table width. | Admin tables and content directories. | Existing `.overflow-x-auto` wrappers now provide touch momentum/scroll containment and their direct tables retain a 42rem minimum width below 768 px, preserving readable columns inside the local scroller rather than creating document overflow. | Wrapper/table audit and build. |
| Long inquiry text/email could expand beyond a modal column. | Dynamic strings lacked explicit breaking rules. | Admin inquiry detail dialog. | Added `break-all` for email and `break-words` for message content. | Source review and type-check/build. |
| The filters sheet could sit under iPhone safe areas. | Full-screen filter layer used `inset-0` with no safe-area padding. | Our Professionals directory. | Added top/bottom safe-area padding and an explicit 44 px focus-visible filter trigger. | Existing directory tests plus type-check/build. |

## Layout rules retained or confirmed

- Shared page containers use fluid widths, `min-width: 0`, and phone-safe horizontal padding.
- Desktop navigation remains unchanged at `lg` and above; below that breakpoint the accessible drawer exposes the same primary links and Donate action.
- Footer/contact content collapses before desktop; footer fields already use fluid widths.
- Images and media are constrained to their containers. No page-level `overflow-x: hidden` rule was added.
- Existing reduced-motion handling remains in place for reveal/parallax/animated modal transitions.

## QA matrix

Target breakpoints for release validation: 320 x 568, 360 x 800, 375 x 667, 390 x 844, 412 x 915, 768 x 1024, 1024 x 768, and 1280 x 800; repeat phone checks in landscape. Confirm the homepage/header/footer, directory/filter sheet, profile actions, Find Support/Browse dialogs, booking and donation forms, and an admin table/dialog at each applicable authenticated state.

Automated verification included the shared button/menu regression tests and the established directory tests. Production browser inspection at 390 px confirmed the pre-existing viewport/header correction and no document-level horizontal overflow. Local browser rendering of data-backed routes is blocked by this sandbox's outbound Supabase restriction, so complete visual re-validation of the newly changed source should be repeated against the preview deployment after release.
