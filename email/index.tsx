import { BrevoEmailService, EmailRecipient, EmailData, BrevoConfig } from "./brevo-email";
import { Order } from "@/types";
import { BREVO_API_KEY } from "@/lib/constants";
import PurchaseReceiptEmail from "./purchase-receipt";

// Initialize Brevo email service
const brevoService = new BrevoEmailService({
  apiKey: BREVO_API_KEY!,
});

export const sendPurchaseReceipt = async ({order}:{order: Order;}) => {
  // Implementation can be added here if needed
};
