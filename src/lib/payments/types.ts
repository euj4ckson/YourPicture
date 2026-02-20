export type CreateChargeInput = {
  orderId: string;
  amountCents: number;
  customerName: string;
  customerEmail: string;
  customerWhatsapp?: string;
  description: string;
  expiresInSeconds: number;
};

export type CreateChargeResult = {
  provider: "openpix" | "mercadopago" | "efi";
  providerChargeId: string;
  providerCorrelationId: string;
  status: "PENDING" | "PAID" | "CANCELED";
  brCode: string;
  qrCodeImage: string;
  paymentLinkUrl?: string;
  expiresAt?: Date;
  raw: unknown;
};

export type ParsedPaymentEvent = {
  providerEventId: string;
  providerChargeId?: string;
  providerCorrelationId?: string;
  type: string;
  paid: boolean;
  canceled: boolean;
  raw: unknown;
};

export interface PaymentProvider {
  createCharge(input: CreateChargeInput): Promise<CreateChargeResult>;
  parseWebhook(payload: unknown): ParsedPaymentEvent[];
}
