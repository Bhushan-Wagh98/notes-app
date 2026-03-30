/**
 * @module services/email
 * @description Email delivery service using Brevo (Sendinblue) HTTP API.
 * Used for sending OTP codes during signup and password reset flows.
 */

import { env } from "../config/env";

/**
 * Sends an OTP email to the specified recipient.
 * @param to      - Recipient email address.
 * @param otp     - The one-time password to include in the email body.
 * @param subject - Email subject line.
 * @param purpose - Human-readable purpose (e.g. "signup", "password reset").
 */
export const sendOtpEmail = async (
  to: string,
  otp: string,
  subject: string,
  purpose: string,
): Promise<void> => {
  const res = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: {
      "api-key": env.BREVO_API_KEY,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      sender: { name: "Share Notes", email: env.SMTP_EMAIL },
      to: [{ email: to }],
      subject,
      htmlContent: `<h2>Your ${purpose} OTP is: <strong>${otp}</strong></h2><p>This code expires in 5 minutes.</p>`,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Brevo email failed: ${err}`);
  }
};
