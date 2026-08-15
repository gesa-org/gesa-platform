// Minimal, inline-styled HTML templates — no build step, safe across email
// clients. Keep GESA's palette (sage/clay/cream) consistent with the site.

function shell(bodyHtml: string) {
  return `
  <div style="font-family:Arial,Helvetica,sans-serif;background:#f7f3ea;padding:32px 0;">
    <div style="max-width:520px;margin:0 auto;background:#fffdf8;border-radius:16px;padding:32px;border:1px solid #e6ded0;">
      <div style="display:flex;align-items:center;gap:10px;margin-bottom:20px;">
        <div style="width:32px;height:32px;border-radius:9px;background:#5c6a4c;color:#fff;display:inline-block;text-align:center;line-height:32px;font-weight:bold;">G</div>
        <span style="font-size:19px;font-weight:700;color:#5c6a4c;">GESA</span>
      </div>
      ${bodyHtml}
      <p style="margin-top:28px;font-size:12.5px;color:#6f6a5c;">
        GESA — Global Emotional Support Alliance. If you weren't expecting this email, you can ignore it.
      </p>
    </div>
  </div>`;
}

export function welcomeEmail(fullName: string) {
  return shell(`
    <h1 style="font-size:22px;color:#33352d;margin:0 0 12px;">Welcome to GESA, ${fullName || "friend"}</h1>
    <p style="color:#33352d;line-height:1.6;">
      Thanks for creating an account. From here you can browse our verified volunteer therapists,
      start a confidential conversation, and keep track of your sessions.
    </p>
    <p style="color:#33352d;line-height:1.6;">
      Everyone gets six free sessions — no forms, no pressure. If you're not sure where to start,
      just reply to this email.
    </p>
  `);
}

export function contactReceivedEmail(name: string, subject: string) {
  return shell(`
    <h1 style="font-size:22px;color:#33352d;margin:0 0 12px;">Thanks for reaching out, ${name}</h1>
    <p style="color:#33352d;line-height:1.6;">
      We've received your message${subject ? ` about "${subject}"` : ""} and someone from our team
      will get back to you soon.
    </p>
  `);
}

export function contactNotificationEmail(name: string, email: string, subject: string, message: string) {
  return shell(`
    <h1 style="font-size:20px;color:#33352d;margin:0 0 12px;">New contact form submission</h1>
    <p style="color:#33352d;line-height:1.6;margin:4px 0;"><strong>From:</strong> ${name} (${email})</p>
    <p style="color:#33352d;line-height:1.6;margin:4px 0;"><strong>Subject:</strong> ${subject || "General inquiry"}</p>
    <p style="color:#33352d;line-height:1.6;white-space:pre-line;background:#efe8d9;border-radius:10px;padding:12px;margin-top:10px;">${message}</p>
  `);
}

export function bookingConfirmationEmail(name: string, therapistName: string) {
  return shell(`
    <h1 style="font-size:22px;color:#33352d;margin:0 0 12px;">You're matched, ${name || "friend"}</h1>
    <p style="color:#33352d;line-height:1.6;">
      We've matched you with <strong>${therapistName}</strong>, one of our verified volunteer therapists.
      They (or our team) will reach out to you at this email address shortly to set up your first
      free session.
    </p>
    <p style="color:#33352d;line-height:1.6;">
      In the meantime, if anything feels urgent, use the crisis resources on our site any time — you
      don't need to wait for a reply.
    </p>
  `);
}

export function bookingTeamNotificationEmail(
  entryRouteLabel: string,
  name: string,
  email: string,
  therapistName: string
) {
  return shell(`
    <h1 style="font-size:20px;color:#33352d;margin:0 0 12px;">New booking request: ${entryRouteLabel}</h1>
    <p style="color:#33352d;line-height:1.6;margin:4px 0;"><strong>From:</strong> ${name} (${email})</p>
    <p style="color:#33352d;line-height:1.6;margin:4px 0;"><strong>Matched with:</strong> ${therapistName}</p>
    <p style="color:#33352d;line-height:1.6;margin-top:10px;">
      Please help connect them — this therapist doesn't have a linked login yet, so the match needs a
      human follow-up for now.
    </p>
  `);
}

export function groupRegistrationEmail(name: string, groupTitle: string, schedule: string) {
  return shell(`
    <h1 style="font-size:22px;color:#33352d;margin:0 0 12px;">You're registered, ${name}</h1>
    <p style="color:#33352d;line-height:1.6;">
      You're confirmed for <strong>${groupTitle}</strong>${schedule ? ` — ${schedule}` : ""}. We'll send
      a reminder before the session starts.
    </p>
  `);
}
