/**
 * @module services/email
 * @description Email delivery service using Nodemailer with Gmail SMTP.
 * Used for sending OTP codes during signup and password reset flows.
 */

import nodemailer from "nodemailer";
import SMTPTransport from "nodemailer/lib/smtp-transport";
import { env } from "../config/env";

/** Reusable SMTP transporter configured with Gmail credentials. */
const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 465,
  secure: true,
  auth: { user: env.SMTP_EMAIL, pass: env.SMTP_PASSWORD },
  tls: { family: 4 },
} as SMTPTransport.Options);

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
  await transporter.sendMail({
    from: `"Share Notes" <${env.SMTP_EMAIL}>`,
    to,
    subject,
    html: `<h2>Your ${purpose} OTP is: <strong>${otp}</strong></h2><p>This code expires in 5 minutes.</p>`,
  });
};
