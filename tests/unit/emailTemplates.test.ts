import {
  welcomeEmail,
  contactReceivedEmail,
  contactNotificationEmail,
  groupRegistrationEmail,
} from "@/lib/email/templates";

describe("email templates", () => {
  it("welcomeEmail includes the recipient's name and GESA branding", () => {
    const html = welcomeEmail("Dana");
    expect(html).toContain("Dana");
    expect(html).toContain("GESA");
  });

  it("welcomeEmail falls back to a generic greeting when no name is given", () => {
    expect(welcomeEmail("")).toContain("friend");
  });

  it("contactReceivedEmail mentions the subject when provided", () => {
    const html = contactReceivedEmail("Sam", "Volunteer");
    expect(html).toContain("Sam");
    expect(html).toContain("Volunteer");
  });

  it("contactNotificationEmail surfaces sender details and message body", () => {
    const html = contactNotificationEmail("Sam", "sam@example.com", "Donation", "I'd like to give.");
    expect(html).toContain("sam@example.com");
    expect(html).toContain("I'd like to give.");
  });

  it("groupRegistrationEmail includes the group title and schedule", () => {
    const html = groupRegistrationEmail("Sam", "Steady Ground", "Wednesdays, 20:00 GMT");
    expect(html).toContain("Steady Ground");
    expect(html).toContain("Wednesdays, 20:00 GMT");
  });
});
