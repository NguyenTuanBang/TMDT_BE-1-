// import nodemailer from "nodemailer";

// const sendEmail = async (options) => {
//   const transporter = nodemailer.createTransport({
//     service: "gmail",
//     auth: {
//       user: process.env.EMAIL_USER,
//       pass: process.env.EMAIL_PASS,
//     },
//   });

//   const mailOptions = {
//     from: "TMDT <no-reply@TMDT.com>",
//     to: options.email,
//     subject: options.subject,
//     text: options.message,
//   };

//   await transporter.sendMail(mailOptions);
// };

// export default sendEmail;
// import { Resend } from "resend";

// const sendEmail = async (options) => {
//   console.log("🚀 ~ file: mail.js:3 ~ Resend:", process.env.RESEND_API_KEY);
//   const resend = new Resend(process.env.RESEND_API_KEY);
//   try {
//     await resend.emails.send({
//       from: "TMDT <no-reply@tmdt.com>", // hoặc "onboarding@resend.dev" nếu bạn chưa verify domain
//       to: options.email,
//       subject: options.subject,
//       text: options.message,
//     });
//   } catch (error) {
//     console.error("❌ Error sending email:", error);
//     throw new Error("Failed to send email");
//   }
// };

// export default sendEmail;

import sgMail from "@sendgrid/mail";


const sendEmail = async (options) => {
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);
  const msg = {
    to: options.email,
    from: {
      name: "TMDT",
      email: process.env.EMAIL,
    },
    subject: options.subject,
    text: options.message,
  };

  try {
    const response = await sgMail.send(msg);
    console.log("✅ Email sent:", response[0].statusCode);
    return response;
  } catch (error) {
    console.error("❌ Error sending email:", error.response?.body || error);
    throw new Error("Failed to send email");
  }
};

export default sendEmail;

