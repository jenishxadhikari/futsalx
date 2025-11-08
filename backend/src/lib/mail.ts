import { Resend } from 'resend';

import { resendApiKey, resendMail } from '../config.ts';

const resend = new Resend(resendApiKey);

type SendMail = {
  to: string 
  subject: string
  html: string
}

export async function sendMail({ to, subject, html }: SendMail) {
  try {
    await resend.emails.send({
      from: resendMail,
      to: to,
      subject: subject,
      html: html,
    });
  } catch (error) {
    console.log(`[SEND_MAIL_ERROR]`, error);
  }
}