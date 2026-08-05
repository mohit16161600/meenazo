/**
 * SMS + WhatsApp delivery — provider-ready, zero-dep.
 * ---------------------------------------------------------------------------
 * WhatsApp messages (login OTP *and* order confirmations) go out through
 * AiSensy campaign templates. SMS + a generic WhatsApp webhook remain as
 * optional fallbacks. Until a provider is configured we run in DEV mode:
 * nothing is sent, the OTP is available in the API response (non-production)
 * and always stored in the DB so the owner can read it.
 *
 * Env:
 *   AISENSY_API_KEY, AISENSY_CAMPAIGN_NAME, AISENSY_SENDER_NAME  (WhatsApp OTP)
 *   AISENSY_ORDER_CAMPAIGN                                       (order confirmation)
 *   SMS_SEND_URL, SMS_API_KEY                                    (optional SMS)
 *   WHATSAPP_SEND_URL, WHATSAPP_API_KEY                          (optional generic WhatsApp)
 */

const AISENSY_URL = "https://backend.aisensy.com/campaign/t1/api/v2";
/** AiSensy is a third party — never let a slow call hold a checkout hostage. */
const AISENSY_TIMEOUT_MS = 15_000;

export function isSmsConfigured(): boolean {
  return Boolean((process.env.SMS_SEND_URL ?? "").trim());
}
export function isAisensyConfigured(): boolean {
  return Boolean((process.env.AISENSY_API_KEY ?? "").trim());
}
export function isWhatsappConfigured(): boolean {
  return Boolean((process.env.WHATSAPP_SEND_URL ?? "").trim()) || isAisensyConfigured();
}

interface SendResult {
  channel: "sms" | "whatsapp";
  sent: boolean;
  error?: string;
}

async function post(url: string, key: string | undefined, phone: string, message: string): Promise<boolean> {
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(key ? { Authorization: `Bearer ${key}` } : {}),
    },
    body: JSON.stringify({ to: phone, message }),
    cache: "no-store",
  });
  return res.ok;
}

export async function sendSms(phone: string, message: string): Promise<SendResult> {
  const url = (process.env.SMS_SEND_URL ?? "").trim();
  if (!url) return { channel: "sms", sent: false };
  try {
    return { channel: "sms", sent: await post(url, process.env.SMS_API_KEY, phone, message) };
  } catch (e) {
    return { channel: "sms", sent: false, error: String((e as Error)?.message ?? e) };
  }
}

export async function sendWhatsapp(phone: string, message: string): Promise<SendResult> {
  const url = (process.env.WHATSAPP_SEND_URL ?? "").trim();
  if (!url) return { channel: "whatsapp", sent: false };
  try {
    return { channel: "whatsapp", sent: await post(url, process.env.WHATSAPP_API_KEY, phone, message) };
  } catch (e) {
    return { channel: "whatsapp", sent: false, error: String((e as Error)?.message ?? e) };
  }
}

/* ------------------------- AiSensy campaign templates ------------------------ */

export interface AisensyButton {
  type: string;
  sub_type: string;
  index: number;
  parameters: { type: string; text: string }[];
}

export interface AisensyTemplateInput {
  /** The campaign name exactly as created in AiSensy. */
  campaignName: string;
  /** 10-digit Indian mobile (91 is added) or a full international number. */
  destination: string;
  /** Body params in template order: {{1}}, {{2}}, … */
  templateParams: string[];
  source?: string;
  buttons?: AisensyButton[];
  attributes?: Record<string, string>;
}

export interface AisensyResult {
  ok: boolean;
  error?: string;
}

/** AiSensy wants the country code: 9876500011 → 919876500011. */
export function toAisensyDestination(phone: string): string {
  const digits = String(phone ?? "").replace(/\D/g, "");
  if (!digits) return "";
  return digits.length === 10 ? `91${digits}` : digits;
}

/**
 * WhatsApp rejects template params that are blank or carry newlines/tabs, and
 * the whole message must stay well inside the template's limits — so every
 * value is flattened to one clean line with a non-empty fallback.
 */
export function templateParam(value: unknown, fallback = "-"): string {
  const s = String(value ?? "")
    .replace(/[\r\n\t]+/g, " ")
    .replace(/\s{2,}/g, " ")
    .trim();
  return s === "" ? fallback : s.slice(0, 700);
}

/**
 * Send ONE AiSensy campaign template. Returns a descriptive error instead of a
 * bare boolean so the caller can store *why* a message never reached the
 * customer (AiSensy answers 200 with `{success:false}` for template problems,
 * which a naive `res.ok` check would happily call a success).
 */
export async function sendAisensyTemplate(input: AisensyTemplateInput): Promise<AisensyResult> {
  const apiKey = (process.env.AISENSY_API_KEY ?? "").trim();
  if (!apiKey) return { ok: false, error: "AISENSY_API_KEY is not set" };

  const destination = toAisensyDestination(input.destination);
  if (destination.length < 10) return { ok: false, error: `invalid destination "${input.destination}"` };

  const userName = (process.env.AISENSY_SENDER_NAME ?? "Meenazo").trim();

  try {
    const res = await fetch(AISENSY_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        apiKey,
        campaignName: input.campaignName,
        destination,
        userName,
        templateParams: input.templateParams,
        source: input.source ?? "meenazo website",
        media: {},
        buttons: input.buttons ?? [],
        carouselCards: [],
        location: {},
        attributes: input.attributes ?? {},
        paramsFallbackValue: { FirstName: "user" },
      }),
      cache: "no-store",
      signal: AbortSignal.timeout(AISENSY_TIMEOUT_MS),
    });

    const text = await res.text().catch(() => "");
    if (!res.ok) return { ok: false, error: `AiSensy ${res.status}: ${text.slice(0, 300)}` };

    // 200 does not always mean delivered — check the body when it is JSON.
    try {
      const body = JSON.parse(text) as { success?: boolean; errorMessage?: string; message?: string };
      if (body && body.success === false) {
        return { ok: false, error: body.errorMessage ?? body.message ?? "AiSensy rejected the message" };
      }
    } catch {
      /* plain-text "Success" reply — treat 200 as sent */
    }
    return { ok: true };
  } catch (e) {
    return { ok: false, error: String((e as Error)?.message ?? e) };
  }
}

/**
 * Deliver the OTP over WhatsApp via AiSensy's campaign API. The template's body
 * param ($FirstName) and its "copy code" URL button both receive the OTP.
 * `phone` is the canonical 10-digit number; AiSensy needs it with the 91 prefix.
 */
export async function sendAisensyOtp(phone: string, code: string): Promise<SendResult> {
  if (!isAisensyConfigured()) return { channel: "whatsapp", sent: false };
  const res = await sendAisensyTemplate({
    campaignName: (process.env.AISENSY_CAMPAIGN_NAME ?? "meenazo_authentication_code").trim(),
    destination: phone,
    templateParams: [code], // body {{1}} ($FirstName) → OTP
    source: "meenazo login",
    buttons: [
      {
        type: "button",
        sub_type: "url",
        index: 0,
        parameters: [{ type: "text", text: code }], // URL/copy-code button → OTP
      },
    ],
  });
  return { channel: "whatsapp", sent: res.ok, error: res.error };
}

/**
 * Fire the OTP over WhatsApp (AiSensy first, else a generic webhook) plus SMS
 * when configured. WhatsApp is the primary channel for login.
 */
export async function deliverOtp(phone: string, code: string): Promise<SendResult[]> {
  const message = `Your Meenazo verification code is ${code}. Valid for 10 minutes. Do not share it with anyone.`;
  const whatsapp = isAisensyConfigured()
    ? sendAisensyOtp(phone, code)
    : sendWhatsapp(phone, message);
  return Promise.all([sendSms(phone, message), whatsapp]);
}
