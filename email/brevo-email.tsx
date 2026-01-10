import { SENDER_EMAIL, APP_NAME } from "@/lib/constants";

interface EmailRecipient {
  email: string;
  name?: string;
}

interface EmailData {
  to: EmailRecipient[];
  subject?: string;
  htmlContent?: string;
  textContent?: string;
  templateId?: number;
  params?: Record<string, any>;
  sender?: {
    email: string;
    name?: string;
  };
}

interface BrevoConfig {
  apiKey: string;
  defaultSender?: {
    email: string;
    name?: string;
  };
}

class BrevoEmailService {
  private apiKey: string;
  private defaultSender: { email: string; name?: string };

  constructor(config: BrevoConfig) {
    this.apiKey = config.apiKey;
    this.defaultSender = config.defaultSender || {
      email: SENDER_EMAIL || "noreply@pinkcloverusa.com",
      name: APP_NAME,
    };
  }

  async sendEmail(emailData: EmailData): Promise<any> {
    try {
      const payload: any = {
        to: emailData.to.map(recipient => ({
          email: recipient.email,
          name: recipient.name
        })),
        sender: emailData.sender || this.defaultSender,
      };
      
      if (emailData.templateId) {
        payload.templateId = emailData.templateId;
        payload.params = emailData.params || {};
      } else {
        payload.subject = emailData.subject;
        payload.htmlContent = emailData.htmlContent;
        payload.textContent = emailData.textContent;
      }

      const response = await fetch('https://api.brevo.com/v3/smtp/email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'api-key': this.apiKey,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Brevo API error: ${response.status} - ${JSON.stringify(errorData)}`);
      }

      const result = await response.json();
      console.log("Email sent successfully:", result);
      return result;
    } catch (error) {
      console.error("Failed to send email:", error);
      throw error;
    }
  }

  async sendTemplateEmail(
    to: EmailRecipient[],
    templateId: number,
    params: Record<string, any> = {},
    sender?: { email: string; name?: string }
  ): Promise<any> {
    return this.sendEmail({
      to,
      templateId,
      params,
      sender,
    });
  }

  async sendHtmlEmail(
    to: EmailRecipient[],
    subject: string,
    htmlContent: string,
    textContent?: string,
    sender?: { email: string; name?: string }
  ): Promise<any> {
    return this.sendEmail({
      to,
      subject,
      htmlContent,
      textContent,
      sender,
    });
  }
}

export { BrevoEmailService, type EmailRecipient, type EmailData, type BrevoConfig };
