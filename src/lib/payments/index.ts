import { env } from "@/lib/env";
import { OpenPixProvider } from "@/lib/payments/openpix";
import type { CreateChargeInput, CreateChargeResult, PaymentProvider } from "@/lib/payments/types";

class NotImplementedProvider implements PaymentProvider {
  constructor(private readonly name: string) {}

  async createCharge(_input: CreateChargeInput): Promise<CreateChargeResult> {
    void _input;
    throw new Error(`${this.name} ainda nao foi implementado neste projeto.`);
  }

  parseWebhook() {
    return [];
  }
}

export function getPaymentProvider(): PaymentProvider {
  if (env.PAYMENT_PROVIDER === "openpix") {
    return new OpenPixProvider();
  }

  if (env.PAYMENT_PROVIDER === "mercadopago") {
    return new NotImplementedProvider("Mercado Pago");
  }

  if (env.PAYMENT_PROVIDER === "efi") {
    return new NotImplementedProvider("Efí");
  }

  return new OpenPixProvider();
}
