import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: false, // Use STARTTLS
  auth: {
    user: "trackitnoww@gmail.com",
    pass: "dxjp wcrk jhvu xufo",
  },
  tls: {
    rejectUnauthorized: false
  }
});

const APP_NAME = "BlockMint";
const PRIMARY_COLOR = "#10b981"; 
const BG_COLOR = "#ffffff";
const TEXT_COLOR = "#1e293b";
const BORDER_COLOR = "#e2e8f0";

function getHtmlTemplate(title: string, content: string) {
  return `
    <!DOCTYPE html>
    <html lang="fr">
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f4f7fa; color: ${TEXT_COLOR}; margin: 0; padding: 0; -webkit-font-smoothing: antialiased; }
          .wrapper { width: 100%; table-layout: fixed; background-color: #f4f7fa; padding-bottom: 40px; }
          .container { max-width: 600px; margin: 0 auto; background-color: ${BG_COLOR}; border-radius: 8px; margin-top: 40px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06); overflow: hidden; }
          .header { padding: 32px; text-align: center; border-bottom: 1px solid ${BORDER_COLOR}; }
          .header h1 { margin: 0; color: ${PRIMARY_COLOR}; font-size: 24px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; }
          .content { padding: 40px 32px; }
          .content h2 { margin-top: 0; color: #0f172a; font-size: 20px; font-weight: 600; margin-bottom: 16px; }
          .content p { margin: 0 0 16px; line-height: 1.6; color: #475569; }
          .footer { padding: 32px; text-align: center; background-color: #f8fafc; border-top: 1px solid ${BORDER_COLOR}; }
          .footer p { margin: 0; font-size: 13px; color: #94a3b8; }
          .button { display: inline-block; padding: 12px 28px; background-color: ${PRIMARY_COLOR}; color: #ffffff !important; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 14px; margin-top: 8px; }
          .info-card { background-color: #f8fafc; border: 1px solid ${BORDER_COLOR}; border-radius: 6px; padding: 20px; margin: 24px 0; }
          .status-badge { display: inline-block; padding: 4px 12px; border-radius: 9999px; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; }
          .status-success { background-color: #dcfce7; color: #166534; }
          .status-error { background-color: #fee2e2; color: #991b1b; }
          .highlight { color: ${PRIMARY_COLOR}; font-weight: 600; }
        </style>
      </head>
      <body>
        <div class="wrapper">
          <div class="container">
            <div class="header">
              <h1>${APP_NAME}</h1>
            </div>
            <div class="content">
              <h2>${title}</h2>
              ${content}
            </div>
            <div class="footer">
              <p>&copy; ${new Date().getFullYear()} ${APP_NAME}. Tous droits réservés.</p>
              <p style="margin-top: 8px;">Plateforme d'investissement Cloud Mining sécurisée.</p>
            </div>
          </div>
        </div>
      </body>
    </html>
  `;
}

export async function sendEmail(to: string, subject: string, text: string, htmlTitle: string, htmlContent: string) {
  console.log(`[Email] Attempting to send email to: ${to} | Subject: ${subject}`);
  try {
    const info = await transporter.sendMail({
      from: `"BlockMint" <trackitnoww@gmail.com>`,
      to,
      subject,
      text,
      html: getHtmlTemplate(htmlTitle, htmlContent),
    });
    console.log(`[Email] Success! MessageId: ${info.messageId} | Response: ${info.response}`);
  } catch (error) {
    console.error("[Email] Critical Error:", error);
  }
}
