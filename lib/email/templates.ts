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

// Phase 63 — sent when someone submits the new volunteer therapist
// application (components/volunteer/VolunteerApplicationModal.tsx),
// replacing the old generic contact-form "Volunteer" subject option.
export function volunteerApplicationReceivedEmail(fullName: string) {
  return shell(`
    <h1 style="font-size:22px;color:#33352d;margin:0 0 12px;">Thanks for applying, ${fullName || "friend"}</h1>
    <p style="color:#33352d;line-height:1.6;">
      We've received your application to volunteer as a therapist with GESA. Our team reviews every
      application by hand, including the credentials you shared, and will follow up at this email
      address once we have.
    </p>
  `);
}

// Phase 64 — `meetingDurationLabel` is passed in already-formatted (e.g.
// "60 min", "Anytime") rather than the raw "60"/"anytime" DB value, so this
// template doesn't need its own copy of the label mapping the modal owns.
export function volunteerApplicationNotificationEmail(app: {
  fullName: string;
  email: string;
  phone: string | null;
  credentialsProof: string;
  specialties: string[];
  languages: string[];
  meetingDurationLabel: string;
  bio: string;
}) {
  return shell(`
    <h1 style="font-size:20px;color:#33352d;margin:0 0 12px;">New volunteer therapist application</h1>
    <p style="color:#33352d;line-height:1.6;margin:4px 0;"><strong>Name:</strong> ${app.fullName}</p>
    <p style="color:#33352d;line-height:1.6;margin:4px 0;"><strong>Email:</strong> ${app.email}</p>
    ${app.phone ? `<p style="color:#33352d;line-height:1.6;margin:4px 0;"><strong>Phone:</strong> ${app.phone}</p>` : ""}
    <p style="color:#33352d;line-height:1.6;margin:4px 0;"><strong>Specialties:</strong> ${app.specialties.join(", ")}</p>
    <p style="color:#33352d;line-height:1.6;margin:4px 0;"><strong>Languages:</strong> ${app.languages.join(", ")}</p>
    <p style="color:#33352d;line-height:1.6;margin:4px 0;"><strong>Meeting duration:</strong> ${app.meetingDurationLabel}</p>
    <p style="color:#33352d;line-height:1.6;margin:12px 0 4px;"><strong>Proof of license / credentials:</strong></p>
    <p style="color:#33352d;line-height:1.6;white-space:pre-line;background:#efe8d9;border-radius:10px;padding:12px;">${app.credentialsProof}</p>
    <p style="color:#33352d;line-height:1.6;margin:12px 0 4px;"><strong>Bio:</strong></p>
    <p style="color:#33352d;line-height:1.6;white-space:pre-line;background:#efe8d9;border-radius:10px;padding:12px;">${app.bio}</p>
    <p style="color:#33352d;line-height:1.6;margin-top:14px;">Review in the CRM at /admin/volunteer-applications.</p>
  `);
}

// Phase 98 — sent when someone submits the gift-intent form on the new
// /donate page (components/donate/DonateForm.tsx). Same received/notify
// pair shape as the volunteer application templates above, adapted for a
// donation pledge (frequency + amount) instead of an application.
export function donationReceivedEmail(fullName: string, frequency: string, amount: number) {
  const cadence = frequency === "monthly" ? "monthly" : "one-time";
  return shell(`
    <h1 style="font-size:22px;color:#33352d;margin:0 0 12px;">Thank you, ${fullName || "friend"}</h1>
    <p style="color:#33352d;line-height:1.6;">
      We've received your ${cadence} gift pledge of €${amount.toLocaleString()}. Your choice helps carry gifted
      professional support to people and communities across borders. Our team will follow up at this
      email address with next steps for completing your gift.
    </p>
  `);
}

export function donationNotificationEmail(donation: {
  fullName: string;
  email: string;
  phone: string | null;
  frequency: string;
  amount: number;
  amountChoice: string | null;
  message: string | null;
}) {
  return shell(`
    <h1 style="font-size:20px;color:#33352d;margin:0 0 12px;">New donation pledge</h1>
    <p style="color:#33352d;line-height:1.6;margin:4px 0;"><strong>Name:</strong> ${donation.fullName}</p>
    <p style="color:#33352d;line-height:1.6;margin:4px 0;"><strong>Email:</strong> ${donation.email}</p>
    ${donation.phone ? `<p style="color:#33352d;line-height:1.6;margin:4px 0;"><strong>Phone:</strong> ${donation.phone}</p>` : ""}
    <p style="color:#33352d;line-height:1.6;margin:4px 0;"><strong>Frequency:</strong> ${donation.frequency === "monthly" ? "Monthly" : "One-time"}</p>
    <p style="color:#33352d;line-height:1.6;margin:4px 0;"><strong>Amount:</strong> €${donation.amount.toLocaleString()}${donation.amountChoice === "custom" ? " (custom amount)" : ""}</p>
    ${donation.message ? `<p style="color:#33352d;line-height:1.6;margin:12px 0 4px;"><strong>Message:</strong></p><p style="color:#33352d;line-height:1.6;white-space:pre-line;background:#efe8d9;border-radius:10px;padding:12px;">${donation.message}</p>` : ""}
    <p style="color:#33352d;line-height:1.6;margin-top:14px;">Review in the CRM at /admin/donations.</p>
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

export function therapistNewMatchEmail(
  therapistName: string,
  clientName: string,
  clientEmail: string,
  entryRouteLabel: string
) {
  return shell(`
    <h1 style="font-size:22px;color:#33352d;margin:0 0 12px;">You've been matched, ${therapistName || "there"}</h1>
    <p style="color:#33352d;line-height:1.6;">
      GESA has matched you with a new client through our site: <strong>${clientName}</strong>
      (${clientEmail}), reaching out via "${entryRouteLabel}".
    </p>
    <p style="color:#33352d;line-height:1.6;">
      Please reach out to them directly to schedule their first free session. If anything about this
      match doesn't feel right, reply to this email and our team will help reassign it.
    </p>
  `);
}

const FORMAT_LABEL: Record<string, string> = {
  online: "Online (video)",
  call: "Call",
  in_person: "In-Person",
};

export function matchConfirmationEmail(
  name: string,
  therapistName: string,
  sessionFormat: string,
  preferredDate: string | null,
  preferredTime: string | null
) {
  const when =
    preferredDate || preferredTime
      ? `<p style="color:#33352d;line-height:1.6;margin:4px 0;"><strong>Requested time:</strong> ${
          preferredDate ?? ""
        } ${preferredTime ?? ""}</p>`
      : "";
  return shell(`
    <h1 style="font-size:22px;color:#33352d;margin:0 0 12px;">You're all set, ${name || "friend"}</h1>
    <p style="color:#33352d;line-height:1.6;">
      We've sent your session request to <strong>${therapistName}</strong> for a
      <strong>${FORMAT_LABEL[sessionFormat] ?? sessionFormat}</strong> session.
    </p>
    ${when}
    <p style="color:#33352d;line-height:1.6;">
      This is a request, not a confirmed slot — our team or your therapist will follow up shortly to confirm the
      exact time and share any session details you'll need.
    </p>
  `);
}

export function matchTeamNotificationEmail(
  name: string,
  email: string,
  therapistName: string,
  sessionFormat: string,
  symptoms: string[],
  treatmentType: string | null,
  preferredDate: string | null,
  preferredTime: string | null
) {
  return shell(`
    <h1 style="font-size:20px;color:#33352d;margin:0 0 12px;">New AI-matched session request</h1>
    <p style="color:#33352d;line-height:1.6;margin:4px 0;"><strong>From:</strong> ${name} (${email})</p>
    <p style="color:#33352d;line-height:1.6;margin:4px 0;"><strong>Matched with:</strong> ${therapistName}</p>
    <p style="color:#33352d;line-height:1.6;margin:4px 0;"><strong>Format:</strong> ${FORMAT_LABEL[sessionFormat] ?? sessionFormat}</p>
    ${treatmentType ? `<p style="color:#33352d;line-height:1.6;margin:4px 0;"><strong>Preferred treatment:</strong> ${treatmentType}</p>` : ""}
    ${symptoms.length ? `<p style="color:#33352d;line-height:1.6;margin:4px 0;"><strong>Shared:</strong> ${symptoms.join(", ")}</p>` : ""}
    ${
      preferredDate || preferredTime
        ? `<p style="color:#33352d;line-height:1.6;margin:4px 0;"><strong>Requested time:</strong> ${preferredDate ?? ""} ${preferredTime ?? ""}</p>`
        : ""
    }
    <p style="color:#33352d;line-height:1.6;margin-top:10px;">Please help confirm this session.</p>
  `);
}

const CHANNEL_LABEL: Record<string, string> = {
  email: "Email",
  whatsapp: "WhatsApp",
  zoom: "Zoom",
};

// Phase 20 — real, conflict-free session booking (as opposed to the earlier
// match_requests/booking_requests flows, which only ever captured a
// "preferred" date/time with no guarantee it was actually free). These three
// templates confirm an actual reserved slot in session_bookings.
export function sessionBookingConfirmationEmail(
  name: string,
  therapistName: string,
  sessionDate: string,
  sessionTime: string,
  contactChannel: string
) {
  const channelNote =
    contactChannel === "whatsapp"
      ? "We've shared a WhatsApp link so you can message your therapist directly."
      : contactChannel === "zoom"
        ? "We'll email you the Zoom link before your session starts."
        : "Your therapist will reach out to you at this email address to confirm any final details.";
  return shell(`
    <h1 style="font-size:22px;color:#33352d;margin:0 0 12px;">You're booked, ${name || "friend"}</h1>
    <p style="color:#33352d;line-height:1.6;">
      Your session with <strong>${therapistName}</strong> is confirmed for
      <strong>${sessionDate} at ${sessionTime}</strong> via <strong>${CHANNEL_LABEL[contactChannel] ?? contactChannel}</strong>.
    </p>
    <p style="color:#33352d;line-height:1.6;">${channelNote}</p>
    <p style="color:#33352d;line-height:1.6;">
      This slot is reserved just for you — no one else can book it. If you need to reschedule, reply to
      this email and our team will help.
    </p>
  `);
}

export function sessionBookingTeamNotificationEmail(
  name: string,
  email: string,
  therapistName: string,
  sessionDate: string,
  sessionTime: string,
  contactChannel: string,
  path: string | null
) {
  return shell(`
    <h1 style="font-size:20px;color:#33352d;margin:0 0 12px;">New confirmed session booking</h1>
    <p style="color:#33352d;line-height:1.6;margin:4px 0;"><strong>From:</strong> ${name} (${email})</p>
    <p style="color:#33352d;line-height:1.6;margin:4px 0;"><strong>Therapist:</strong> ${therapistName}</p>
    <p style="color:#33352d;line-height:1.6;margin:4px 0;"><strong>When:</strong> ${sessionDate} at ${sessionTime}</p>
    <p style="color:#33352d;line-height:1.6;margin:4px 0;"><strong>Channel:</strong> ${CHANNEL_LABEL[contactChannel] ?? contactChannel}</p>
    ${path ? `<p style="color:#33352d;line-height:1.6;margin:4px 0;"><strong>Path:</strong> ${path}</p>` : ""}
    <p style="color:#33352d;line-height:1.6;margin-top:10px;">This slot is reserved and cannot be double-booked.</p>
  `);
}

export function sessionBookingTherapistNotificationEmail(
  therapistName: string,
  clientName: string,
  clientEmail: string,
  sessionDate: string,
  sessionTime: string,
  contactChannel: string
) {
  return shell(`
    <h1 style="font-size:22px;color:#33352d;margin:0 0 12px;">New session booked, ${therapistName || "there"}</h1>
    <p style="color:#33352d;line-height:1.6;">
      <strong>${clientName}</strong> (${clientEmail}) has booked a session with you for
      <strong>${sessionDate} at ${sessionTime}</strong>, preferring to connect via
      <strong>${CHANNEL_LABEL[contactChannel] ?? contactChannel}</strong>.
    </p>
    <p style="color:#33352d;line-height:1.6;">
      This time is reserved on your calendar — no one else can be booked into the same slot.
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
