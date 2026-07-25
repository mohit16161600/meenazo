/**
 * SMS + WhatsApp OTP delivery — provider-ready, zero-dep.
 * ---------------------------------------------------------------------------
 * WhatsApp OTP goes out through AiSensy (campaign template). SMS + a generic
 * WhatsApp webhook remain as optional fallbacks. Until a provider is
 * configured we run in DEV mode: nothing is sent, the OTP is available in the
 * API response (non-production) and always stored in the DB so the owner can
 * read it.
 *
 * Env:
 *   AISENSY_API_KEY, AISENSY_CAMPAIGN_NAME, AISENSY_SENDER_NAME  (WhatsApp OTP)
 *   SMS_SEND_URL, SMS_API_KEY                                    (optional SMS)
 *   WHATSAPP_SEND_URL, WHATSAPP_API_KEY                          (optional generic WhatsApp)
 */

const AISENSY_URL = "https://backend.aisensy.com/campaign/t1/api/v2";

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

/**
 * Deliver the OTP over WhatsApp via AiSensy's campaign API. The template's body
 * param ($FirstName) and its "copy code" URL button both receive the OTP.
 * `phone` is the canonical 10-digit number; AiSensy needs it with the 91 prefix.
 */
export async function sendAisensyOtp(phone: string, code: string): Promise<SendResult> {
  const apiKey = (process.env.AISENSY_API_KEY ?? "").trim();
  if (!apiKey) return { channel: "whatsapp", sent: false };
  const campaignName = (process.env.AISENSY_CAMPAIGN_NAME ?? "meenazo_authentication_code").trim();
  const userName = (process.env.AISENSY_SENDER_NAME ?? "Meenazo").trim();
  const destination = phone.length === 10 ? `91${phone}` : phone;
  try {
    const res = await fetch(AISENSY_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        apiKey,
        campaignName,
        destination,
        userName,
        templateParams: [code], // body {{1}} ($FirstName) → OTP
        source: "meenazo login",
        media: {},
        buttons: [
          {
            type: "button",
            sub_type: "url",
            index: 0,
            parameters: [{ type: "text", text: code }], // URL/copy-code button → OTP
          },
        ],
        carouselCards: [],
        location: {},
        attributes: {},
        paramsFallbackValue: { FirstName: "user" },
      }),
      cache: "no-store",
    });
    return { channel: "whatsapp", sent: res.ok };
  } catch (e) {
    return { channel: "whatsapp", sent: false, error: String((e as Error)?.message ?? e) };
  }
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
