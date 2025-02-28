const twilio = require("twilio");

const client = () => {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  return new twilio(accountSid, authToken);
};

module.exports = client;
