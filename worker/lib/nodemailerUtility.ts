import nodemailer from "nodemailer";

// Configure nodemailer transporter
const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 465,
  secure: true,
  auth: {
    user: process.env.SMTP_EMAIL, // Your email
    pass: process.env.SMTP_PASSWORD, // App password
  },
});

// Utility function for sending emails
const sendEmail = async (
  fromEmail: string,
  fromName: string,
  toEmail: string,
  subject: string,
  message: string
) => {
  const mailOptions = {
    from: `"${fromName}" <${fromEmail}>`,
    to: toEmail,
    subject: subject,
    html: message, // HTML version
  };

  await transporter.sendMail(mailOptions);
};

export default sendEmail;
