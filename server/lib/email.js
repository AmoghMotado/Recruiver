// server/lib/email.js
// Simple email helper using Nodemailer (SMTP).
// Install dependency:  npm install nodemailer

const nodemailer = require("nodemailer");

let transporter = null;

function getTransporter() {
  if (transporter) return transporter;

  const {
    SMTP_HOST,
    SMTP_PORT,
    SMTP_USER,
    SMTP_PASS,
    MAIL_FROM = "no-reply@recruiver.com",
    MAIL_FROM_NAME = "Recruiver Hiring",
  } = process.env;

  if (!SMTP_HOST || !SMTP_PORT || !SMTP_USER || !SMTP_PASS) {
    console.warn(
      "[email] SMTP environment variables not fully configured. " +
        "Emails will be logged to console instead of being sent."
    );
    return null;
  }

  transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: Number(SMTP_PORT),
    secure: Number(SMTP_PORT) === 465, // true for 465, false for others
    auth: {
      user: SMTP_USER,
      pass: SMTP_PASS,
    },
  });

  // Pretty “From” header:  "Recruiver Hiring <no-reply@recruiver.com>"
  transporter.defaultFrom = MAIL_FROM_NAME
    ? `"${MAIL_FROM_NAME}" <${MAIL_FROM}>`
    : MAIL_FROM;

  return transporter;
}

/**
 * Low-level helper to send any email.
 */
async function sendEmail({
  to,
  subject,
  text,
  html,
  replyTo,
  from, // optional custom from, otherwise defaultFrom
}) {
  if (!to) {
    console.warn("[email] Missing 'to' address.");
    return;
  }

  const transporterInstance = getTransporter();

  // If SMTP is not configured, just log everything (dev / local env).
  if (!transporterInstance) {
    console.log("==== EMAIL (MOCK) ====");
    console.log("To:     ", to);
    console.log("From:   ", from || "DEFAULT_FROM");
    if (replyTo) console.log("Reply-To:", replyTo);
    console.log("Subject:", subject);
    console.log("Text:\n", text);
    if (html) {
      console.log("HTML:\n", html);
    }
    console.log("======================");
    return;
  }

  await transporterInstance.sendMail({
    from: from || transporterInstance.defaultFrom,
    to,
    replyTo,
    subject,
    text,
    html,
  });
}

/**
 * Build subject + text + HTML for the
 * "Selected for Final HR Round" email.
 */
function buildHrSelectionEmail({
  candidateName,
  jobTitle,
  companyName,
  hrDateTime,
  hrLocation,
  hrInstructions,
  meetingLink, // optional (Google Meet / Zoom etc.)
}) {
  const safeCandidateName = candidateName || "Candidate";
  const safeJobTitle = jobTitle || "the role";
  const safeCompany = companyName || "our company";

  const dateLine = hrDateTime
    ? `📅 Date & Time: ${new Date(hrDateTime).toLocaleString()}`
    : "📅 Date & Time: Will be communicated shortly";

  const locationLine = hrLocation
    ? `📍 Location: ${hrLocation}`
    : meetingLink
    ? `📍 Mode: Online`
    : "📍 Location: Will be communicated shortly";

  const meetingLine = meetingLink
    ? `🔗 Meeting Link: ${meetingLink}`
    : "";

  const instructionsBlock = hrInstructions
    ? `\nExtra Instructions:\n${hrInstructions}\n`
    : "";

  const subject = `Selected for Final HR Round – ${safeJobTitle} at ${safeCompany}`;

  const text = `
Hi ${safeCandidateName},

🎉 Congratulations! You have been shortlisted for the final HR round for the role of "${safeJobTitle}" at ${safeCompany}.

${dateLine}
${locationLine}
${meetingLine}

Please carry / keep ready:
- Updated resume
- One government photo ID
- Any supporting documents (certificates, portfolio, etc.)

${instructionsBlock}
If you have any questions or need to reschedule, please reply to this email.

Best regards,
${safeCompany} Recruitment Team
`.trim();

  const html = `
  <div style="font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; font-size: 14px; color: #111827; line-height: 1.6;">
    <p>Hi ${safeCandidateName},</p>

    <p>🎉 <strong>Congratulations!</strong> You have been shortlisted for the
    <strong>final HR round</strong> for the role of
    <strong>"${safeJobTitle}"</strong> at <strong>${safeCompany}</strong>.</p>

    <table style="margin: 16px 0; padding: 12px 14px; background: #f9fafb; border-radius: 8px;">
      <tr>
        <td style="padding: 2px 0;">${dateLine}</td>
      </tr>
      <tr>
        <td style="padding: 2px 0;">${locationLine}</td>
      </tr>
      ${
        meetingLine
          ? `<tr><td style="padding: 2px 0;">${meetingLine}</td></tr>`
          : ""
      }
    </table>

    <p>Please carry / keep ready:</p>
    <ul>
      <li>Updated resume</li>
      <li>One government photo ID</li>
      <li>Any supporting documents (certificates, portfolio, etc.)</li>
    </ul>

    ${
      hrInstructions
        ? `<p style="margin-top: 12px;"><strong>Extra instructions:</strong><br/>${hrInstructions
            .split("\n")
            .join("<br/>")}</p>`
        : ""
    }

    <p style="margin-top: 18px;">
      If you have any questions or need to reschedule, please reply to this email.
    </p>

    <p style="margin-top: 12px;">
      Best regards,<br/>
      <strong>${safeCompany} Recruitment Team</strong>
    </p>
  </div>
  `.trim();

  return { subject, text, html };
}

/**
 * Public helper to send "Selected for Final HR Round" email.
 *
 * `replyToEmail` should usually be the recruiter's own email so the
 * candidate's reply goes back to the recruiter instead of the no-reply ID.
 */
async function sendHrSelectionEmail({
  to,
  candidateName,
  jobTitle,
  companyName,
  hrDateTime,
  hrLocation,
  hrInstructions,
  meetingLink,
  replyToEmail,
}) {
  if (!to) {
    console.warn("[email] Missing 'to' address for HR selection email.");
    return;
  }

  const { subject, text, html } = buildHrSelectionEmail({
    candidateName,
    jobTitle,
    companyName,
    hrDateTime,
    hrLocation,
    hrInstructions,
    meetingLink,
  });

  await sendEmail({
    to,
    subject,
    text,
    html,
    replyTo: replyToEmail,
  });
}

module.exports = {
  getTransporter,
  sendEmail,
  sendHrSelectionEmail,
  buildHrSelectionEmail,
};
