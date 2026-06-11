const nodemailer = require('nodemailer');
require('dotenv').config();

async function testEmail() {
  console.log('Testing SMTP Connection...');
  console.log('SMTP_HOST:', process.env.SMTP_HOST || 'smtp.gmail.com');
  console.log('SMTP_PORT:', process.env.SMTP_PORT || '465');
  console.log('SMTP_USER:', process.env.SMTP_USER);
  
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '465'),
    secure: process.env.SMTP_SECURE === 'true' || true,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  try {
    const info = await transporter.sendMail({
      from: `"Test System" <${process.env.SMTP_USER}>`,
      to: process.env.SMTP_USER, // Send to self
      subject: 'Test Email SMTP',
      text: 'This is a test email to verify SMTP settings.',
    });
    console.log('Email sent successfully! Message ID:', info.messageId);
  } catch (error) {
    console.error('Failed to send email. Error details:');
    console.error(error);
  }
}

testEmail();
