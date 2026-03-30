/**
 * @module services/email
 * @description Email delivery service using Resend HTTP API.
 * Used for sending OTP codes during signup and password reset flows.
 */

import { Resend } from "resend";
import { env } from "../config/env";

const resend = new Resend(env.RESEND_API_KEY);

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
  await resend.emails.send({
    from: `Share Notes <${env.RESEND_FROM_EMAIL}>`,
    to,
    subject,
    html: `<h2>Your ${purpose} OTP is: <strong>${otp}</strong></h2><p>This code expires in 5 minutes.</p>`,
  });
};
