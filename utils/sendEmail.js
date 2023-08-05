const nodemailer = require("nodemailer");

const sendEmail = async (options) => {
  // 1- Create Transporter
  const transporter = nodemailer.createTransport({
    service: "gmail",
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    secure: true,
    auth: {
      user: process.env.EMAIL_USER_NAME,
      pass: process.env.EMAIL_PASSWORD,
    },
  });
  // 2- Define Email options
  const mailOpts = {
    from: "E-Commerce",
    to: options.email,
    subject: options.subject,
    text: options.message,
  };
  // 3- Send Email
  await transporter.sendMail(mailOpts);
};

module.exports = sendEmail;
