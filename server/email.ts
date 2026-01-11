import { MailerSend, EmailParams, Sender, Recipient } from "mailersend";

const mailersend = new MailerSend({
  apiKey: process.env.MAILERSEND_API_KEY || "",
});

const sentFrom = new Sender("blockmintoperator@proton.me", "BlockMint Operator");

export async function sendEmail(to: string, subject: string, html: string) {
  if (!process.env.MAILERSEND_API_KEY) {
    console.log("MAILERSEND_API_KEY not set, skipping email send");
    return;
  }

  const recipients = [new Recipient(to)];

  const emailParams = new EmailParams()
    .setFrom(sentFrom)
    .setTo(recipients)
    .setReplyTo(sentFrom)
    .setSubject(subject)
    .setHtml(html);

  try {
    await mailersend.email.send(emailParams);
    console.log(`Email sent to ${to}: ${subject}`);
  } catch (error) {
    console.error("Failed to send email:", error);
  }
}
