import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

const APP_NAME = "BlockMint";
const PRIMARY_COLOR = "#10b981"; // Emerald 500
const BG_COLOR = "#0f172a"; // Slate 900
const TEXT_COLOR = "#f8fafc"; // Slate 50
const CARD_BG = "#1e293b"; // Slate 800

function getHtmlTemplate(title: string, content: string) {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: ${BG_COLOR}; color: ${TEXT_COLOR}; margin: 0; padding: 0; }
          .container { max-width: 600px; margin: 20px auto; background-color: ${CARD_BG}; border-radius: 12px; overflow: hidden; border: 1px solid rgba(255,255,255,0.1); }
          .header { background: linear-gradient(135deg, ${PRIMARY_COLOR}, #059669); padding: 40px 20px; text-align: center; }
          .header h1 { margin: 0; color: white; font-size: 28px; letter-spacing: 1px; }
          .content { padding: 30px; line-height: 1.6; }
          .footer { padding: 20px; text-align: center; font-size: 12px; color: #94a3b8; border-top: 1px solid rgba(255,255,255,0.05); }
          .button { display: inline-block; padding: 12px 24px; background-color: ${PRIMARY_COLOR}; color: white; text-decoration: none; border-radius: 6px; font-weight: bold; margin-top: 20px; }
          .highlight { color: ${PRIMARY_COLOR}; font-weight: bold; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>${APP_NAME}</h1>
          </div>
          <div class="content">
            <h2 style="color: ${PRIMARY_COLOR}; margin-top: 0;">${title}</h2>
            ${content}
          </div>
          <div class="footer">
            &copy; ${new Date().getFullYear()} ${APP_NAME} - Cloud Mining Investment Platform<br>
            Ceci est un message automatique, merci de ne pas y répondre.
          </div>
        </div>
      </body>
    </html>
  `;
}

export async function sendEmail(to: string, subject: string, text: string, htmlTitle: string, htmlContent: string) {
  try {
    await transporter.sendMail({
      from: `"${APP_NAME}" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      text,
      html: getHtmlTemplate(htmlTitle, htmlContent),
    });
    console.log(`Email sent to ${to}`);
  } catch (error) {
    console.error("Error sending email:", error);
  }
}
