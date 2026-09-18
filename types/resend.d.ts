// resend@3.5.0 is installed with an empty declaration file in this checkout.
// Keep the small surface the application uses typed until dependencies are
// refreshed; this is intentionally not a provider-wide hand-written SDK.
declare module "resend" {
  export class Resend {
    constructor(apiKey: string);
    emails: {
      send(input: {
        from: string;
        to: string | string[];
        subject: string;
        html?: string;
        text?: string;
        replyTo?: string;
      }): Promise<{
        data: { id?: string } | null;
        error: unknown | null;
      }>;
    };
  }
}
