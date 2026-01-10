import { BrevoEmailService, EmailRecipient } from "@/email/brevo-email";
import { BREVO_API_KEY, SENDER_EMAIL, APP_NAME } from "@/lib/constants";
import { Order } from "@/types";
import { render } from "@react-email/render";
import PurchaseReceiptEmail from "@/email/purchase-receipt";

// Lazy initialization to avoid build-time errors
let brevoService: BrevoEmailService | null = null;

function getBrevoService(): BrevoEmailService {
  if (!brevoService) {
    if (!BREVO_API_KEY) {
      throw new Error("BREVO_API_KEY environment variable is required");
    }
    brevoService = new BrevoEmailService({
      apiKey: BREVO_API_KEY,
      defaultSender: {
        email: SENDER_EMAIL || "mike@muddyfrog.com",
        name: APP_NAME,
      },
    });
  }
  return brevoService;
}

// Retry configuration
const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 1000;

async function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function sendWithRetry<T>(
  fn: () => Promise<T>,
  retries = MAX_RETRIES
): Promise<T> {
  let lastError: Error | undefined;

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;
      console.error(`Email send attempt ${attempt}/${retries} failed:`, error);

      if (attempt < retries) {
        const delay = RETRY_DELAY_MS * Math.pow(2, attempt - 1); // Exponential backoff
        await sleep(delay);
      }
    }
  }

  throw lastError;
}

export const sendEmail = async ({ order }: { order: Order }) => {
  const emailHtml = await render(PurchaseReceiptEmail({ order }));
  const emailText = `Purchase Receipt for Order ${order.id}`;

  return sendWithRetry(() =>
    getBrevoService().sendHtmlEmail(
      [{ email: order.user.email, name: order.user.firstName }],
      `Purchase Receipt - Order ${order.id}`,
      emailHtml,
      emailText
    )
  );
};

export const sendHtmlEmail = async (
  to: EmailRecipient[],
  subject: string,
  htmlContent: string,
  textContent?: string
) => {
  return sendWithRetry(() =>
    getBrevoService().sendHtmlEmail(to, subject, htmlContent, textContent)
  );
};

export const sendTemplateEmail = async (
  to: EmailRecipient[],
  templateId: number,
  params: Record<string, unknown> = {}
) => {
  return sendWithRetry(() =>
    getBrevoService().sendTemplateEmail(to, templateId, params)
  );
};

export const sendPasswordResetEmail = async (email: string, resetToken: string) => {
  const resetUrl = `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/reset-password/confirm?token=${resetToken}`;
  
  const htmlContent = `
    <div style="max-width: 600px; margin: 0 auto; padding: 20px; font-family: Arial, sans-serif;">
      <h2 style="color: #333; text-align: center;">Reset Your Password</h2>
      <p>Hello,</p>
      <p>You requested a password reset for your ${APP_NAME} account. Click the link below to reset your password:</p>
      <div style="text-align: center; margin: 30px 0;">
        <a href="${resetUrl}" style="background-color: #007bff; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">Reset Password</a>
      </div>
      <p>This link will expire in 15 minutes for security reasons.</p>
      <p>If you didn't request this password reset, please ignore this email.</p>
      <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
      <p style="color: #666; font-size: 12px; text-align: center;">
        This email was sent by ${APP_NAME}. If you're having trouble clicking the button, copy and paste this URL into your browser: ${resetUrl}
      </p>
    </div>
  `;

  const textContent = `
    Reset Your Password
    
    You requested a password reset for your ${APP_NAME} account.
    
    Click this link to reset your password: ${resetUrl}
    
    This link will expire in 15 minutes for security reasons.
    
    If you didn't request this password reset, please ignore this email.
  `;

  return getBrevoService().sendHtmlEmail(
    [{ email, name: email.split('@')[0] }],
    `Reset Your Password - ${APP_NAME}`,
    htmlContent,
    textContent
  );
};

export { getBrevoService as brevoService };
