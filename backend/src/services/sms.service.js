const twilio = require("twilio");

let client = null;
if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
  client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
}

/**
 * Sends an OTP SMS via Twilio. Falls back to a console log in
 * development when Twilio credentials are not configured, so local
 * development doesn't require a live Twilio account.
 */
const sendOtpSms = async (phone, otp) => {
  const body = `Your Geo Micro Job Platform verification code is ${otp}. It expires in ${process.env.OTP_EXPIRY_MINUTES || 10} minutes.`;

  if (!client) {
    console.log(`[SmsService][DEV MODE] OTP for ${phone}: ${otp}`);
    return { sid: "dev-mode", status: "logged" };
  }

  return client.messages.create({
    body,
    from: process.env.TWILIO_PHONE_NUMBER,
    to: `+91${phone}`,
  });
};

module.exports = { sendOtpSms };
