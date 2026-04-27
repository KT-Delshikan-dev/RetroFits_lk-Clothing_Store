const nodemailer = require('nodemailer');

const sendEmail = async (options) => {
  // Create a transporter
  const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST || 'smtp.mailtrap.io',
    port: process.env.EMAIL_PORT || 2525,
    auth: {
      user: process.env.EMAIL_USER || 'mock_user',
      pass: process.env.EMAIL_PASS || 'mock_pass',
    },
  });

  // Define email options
  const mailOptions = {
    from: `Retrofits LK <${process.env.EMAIL_FROM || 'no-reply@retrofits.lk'}>`,
    to: options.email,
    subject: options.subject,
    text: options.message,
    html: options.html,
  };

  // Send the email
  await transporter.sendMail(mailOptions);
  
  // For development/mock purposes, log to console
  console.log(`\n==============================================`);
  console.log(`[MOCK EMAIL SERVICE]`);
  console.log(`To: ${options.email}`);
  console.log(`Subject: ${options.subject}`);
  console.log(`Message: ${options.message}`);
  console.log(`==============================================\n`);
};

module.exports = sendEmail;
