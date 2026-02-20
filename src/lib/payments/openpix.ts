import crypto from "node:crypto";

import { z } from "zod";

import { env } from "@/lib/env";
import type { CreateChargeInput, PaymentProvider, ParsedPaymentEvent } from "@/lib/payments/types";

const chargeResponseSchema = z.object({
  charge: z
    .object({
      correlationID: z.string(),
      identifier: z.string().optional(),
      txid: z.string().optional(),
      status: z.string(),
      brCode: z.string(),
      qrCodeImage: z.string(),
      paymentLinkUrl: z.string().optional(),
      expiresDate: z.string().optional(),
    })
    .passthrough(),
});

function mapStatus(value: string) {
  const normalized = value.toUpperCase();

  if (normalized.includes("COMPLETED") || normalized.includes("PAID")) {
    return "PAID" as const;
  }

  if (normalized.includes("CANCEL")) {
    return "CANCELED" as const;
  }

  return "PENDING" as const;
}

function hashPayload(payload: unknown) {
  return crypto
    .createHash("sha256")
    .update(typeof payload === "string" ? payload : JSON.stringify(payload))
    .digest("hex");
}

function asRecord(value: unknown): Record<string, unknown> {
  if (typeof value === "object" && value !== null) {
    return value as Record<string, unknown>;
  }

  return {};
}

function normalizeCustomerPhone(raw?: string) {
  if (!raw) {
    return undefined;
  }

  const digits = raw.replace(/\D/g, "");

  if (!digits) {
    return undefined;
  }

  if (digits.length === 10 || digits.length === 11) {
    return `+55${digits}`;
  }

  if (digits.length === 12 || digits.length === 13) {
    return `+${digits}`;
  }

  return undefined;
}

function parseOneEvent(eventPayload: unknown): ParsedPaymentEvent | null {
  const root = asRecord(eventPayload);
  const charge = asRecord(root.charge ?? root);
  const pixTransaction = asRecord(root.pixTransaction);

  const eventType = String(
    root.event ||
      root.eventType ||
      charge.status ||
      "OPENPIX_EVENT",
  );

  const status = String(charge.status ?? root.status ?? "");
  const normalizedStatus = status.toUpperCase();
  const paid = normalizedStatus.includes("COMPLETED") || normalizedStatus.includes("PAID");
  const canceled = normalizedStatus.includes("CANCEL");

  const providerCorrelationId =
    charge.correlationID || charge.correlationId || root.correlationID;
  const providerChargeId = charge.identifier || charge.txid || root.chargeId;

  const providerEventId =
    String(
      root.eventId ||
        root.id ||
        pixTransaction.endToEndId ||
        charge.transactionID ||
        charge.txid ||
        "",
    ) || `${eventType}:${providerCorrelationId || providerChargeId || hashPayload(root)}`;

  return {
    providerEventId,
    providerChargeId: providerChargeId ? String(providerChargeId) : undefined,
    providerCorrelationId: providerCorrelationId ? String(providerCorrelationId) : undefined,
    type: eventType,
    paid,
    canceled,
    raw: root,
  };
}

export class OpenPixProvider implements PaymentProvider {
  async createCharge(input: CreateChargeInput) {
    if (!env.OPENPIX_APP_ID) {
      throw new Error("OPENPIX_APP_ID nao configurado.");
    }

    const customerPhone = normalizeCustomerPhone(input.customerWhatsapp);
    const customerPayload = {
      name: input.customerName,
      email: input.customerEmail,
      ...(customerPhone ? { phone: customerPhone } : {}),
    };

    const response = await fetch(`${env.OPENPIX_BASE_URL}/api/v1/charge`, {
      method: "POST",
      headers: {
        Authorization: env.OPENPIX_APP_ID,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        correlationID: input.orderId,
        value: input.amountCents,
        comment: input.description,
        customer: customerPayload,
        expiresIn: input.expiresInSeconds,
      }),
      cache: "no-store",
    });

    const rawText = await response.text();
    let rawJson: unknown = {};

    if (rawText) {
      try {
        rawJson = JSON.parse(rawText);
      } catch {
        rawJson = { rawText };
      }
    }

    if (!response.ok) {
      throw new Error(`OPENPIX_HTTP_${response.status}:${JSON.stringify(rawJson)}`);
    }

    const parsed = chargeResponseSchema.parse(rawJson);
    const status = mapStatus(parsed.charge.status);

    return {
      provider: "openpix" as const,
      providerChargeId: parsed.charge.identifier || parsed.charge.txid || parsed.charge.correlationID,
      providerCorrelationId: parsed.charge.correlationID,
      status,
      brCode: parsed.charge.brCode,
      qrCodeImage: parsed.charge.qrCodeImage,
      paymentLinkUrl: parsed.charge.paymentLinkUrl,
      expiresAt: parsed.charge.expiresDate ? new Date(parsed.charge.expiresDate) : undefined,
      raw: parsed,
    };
  }

  parseWebhook(payload: unknown) {
    const root = asRecord(payload);
    const eventsFromPayload = root.events;
    const charges = root.charges;
    const candidates = Array.isArray(eventsFromPayload)
      ? eventsFromPayload
      : Array.isArray(charges)
        ? charges
        : [root];

    const parsedEvents = candidates
      .map((candidate) => parseOneEvent(candidate))
      .filter((value): value is ParsedPaymentEvent => value !== null);

    return parsedEvents;
  }
}
