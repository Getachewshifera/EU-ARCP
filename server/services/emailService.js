// Purpose: Outbound email delivery.
const nodemailer = require('nodemailer');

let transporter;

function getTransporter() {
  if (transporter) return transporter;
  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_SECURE } = process.env;
  if (!SMTP_HOST || !SMTP_PORT || !SMTP_USER || !SMTP_PASS) return null;
  transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: Number(SMTP_PORT),
    secure: SMTP_SECURE === 'true',
    auth: { user: SMTP_USER, pass: SMTP_PASS },
  });
  return transporter;
}

async function sendOtpEmail(email, otp, purpose) {
  const mailer = getTransporter();
  if (!mailer) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('Email delivery is not configured. Set SMTP_HOST, SMTP_PORT, SMTP_USER, and SMTP_PASS.');
    }
    console.info(`[development OTP] ${purpose} code for ${email}: ${otp}`);
    return;
  }

  await mailer.sendMail({
    from: process.env.EMAIL_FROM || process.env.SMTP_USER,
    to: email,
    subject: purpose === 'registration' ? 'Verify your EU-ARCP account' : 'Reset your EU-ARCP password',
    text: `Your verification code is ${otp}. It expires in 10 minutes.`,
  });
}

module.exports = { sendOtpEmail };
