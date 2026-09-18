import { createAdminClient } from "@/lib/supabase/admin";
import { sendEmailSafely } from "@/lib/email/resend";
import { sendTrackedEmail } from "@/lib/email/tracked";

jest.mock("@/lib/supabase/admin", () => ({ createAdminClient: jest.fn() }));
jest.mock("@/lib/email/resend", () => ({
  htmlToPlainText: jest.fn(() => "Plain text"),
  isValidEmailFormat: jest.fn(() => true),
  sendEmailSafely: jest.fn(),
}));

const mockedCreateAdminClient = createAdminClient as jest.MockedFunction<typeof createAdminClient>;
const mockedSendEmailSafely = sendEmailSafely as jest.MockedFunction<typeof sendEmailSafely>;

const input = {
  idempotencyKey: "diary-booking-confirmed:event-1:client",
  templateType: "booking_confirmation" as const,
  recipientRole: "client" as const,
  recipientEmail: "client@example.com",
  relatedRecordType: "diary_scheduling_event",
  relatedRecordId: "event-1",
  subject: "Your session has been scheduled",
  html: "<p>Your session has been scheduled</p>",
};

describe("sendTrackedEmail", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("claims a delivery record before sending and records the provider message ID", async () => {
    const insert = jest.fn().mockResolvedValue({ error: null });
    const eq = jest.fn().mockResolvedValue({ error: null });
    const update = jest.fn(() => ({ eq }));
    mockedCreateAdminClient.mockReturnValue({ from: jest.fn(() => ({ insert, update })) } as never);
    mockedSendEmailSafely.mockResolvedValue({ skipped: false, messageId: "msg_123" });

    await expect(sendTrackedEmail(input)).resolves.toEqual({ sent: true, skipped: false });
    expect(insert).toHaveBeenCalledWith(expect.objectContaining({
      idempotency_key: input.idempotencyKey,
      status: "pending",
      attempt_count: 1,
    }));
    expect(update).toHaveBeenCalledWith(expect.objectContaining({
      status: "sent",
      provider_message_id: "msg_123",
    }));
    expect(eq).toHaveBeenCalledWith("idempotency_key", input.idempotencyKey);
  });

  it("does not call the provider when the idempotency key was already claimed", async () => {
    const insert = jest.fn().mockResolvedValue({ error: { code: "23505" } });
    mockedCreateAdminClient.mockReturnValue({ from: jest.fn(() => ({ insert })) } as never);

    await expect(sendTrackedEmail(input)).resolves.toEqual({ sent: false, skipped: true, duplicate: true });
    expect(mockedSendEmailSafely).not.toHaveBeenCalled();
  });
});
