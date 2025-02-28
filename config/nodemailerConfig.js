const nodemailer = require("nodemailer");
var dotenv = require("dotenv");
dotenv.config({ path: `environments/dev.env` });
const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 465,
  secure: true,
  auth: {
    user: process.env.NODEMAILER_USER,
    pass: process.env.NODEMAILER_PASSWORD
  }
});
// send mail with defined transport object
let triggerMail = async (to, sub, msg) => {
  try {
    const info = await transporter.sendMail({
      //from: '"Maddison Foo Koch 👻" <maddison53@ethereal.email>', // sender address
      to: to, // list of receivers
      subject: sub, // Subject line
      //text: "Hello world?", // plain text body
      html: msg // html body
    });
    console.log("Message sent: %s", info.messageId);
  } catch (err) {
    console.log(err);
  }
};
module.exports = triggerMail;
