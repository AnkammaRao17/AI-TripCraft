const nodemailer = require('nodemailer');
const logger = require('../utils/logger');
const path = require('path');

/**
 * Send an email strictly using real Gmail SMTP configurations
 * @param {Object} options - Email options
 * @param {string} options.to - Recipient email
 * @param {string} options.subject - Email subject
 * @param {string} options.html - Email HTML content
 * @returns {Promise<Object>} Send email transport result
 */
const sendEmail = async ({ to, subject, html }) => {
  const resendApiKey = process.env.RESEND_API_KEY ? process.env.RESEND_API_KEY.trim().replace(/^['"]|['"]$/g, '') : '';

  if (resendApiKey) {
    logger.info(`SMTP: RESEND_API_KEY detected. Dispatching mail via Resend HTTP REST API to: ${to}`);
    try {
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${resendApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: 'AI TripCraft <onboarding@resend.dev>',
          to: [to],
          subject: subject,
          html: html,
        }),
      });

      const resData = await response.json();
      if (!response.ok) {
        throw new Error(resData.message || JSON.stringify(resData));
      }
      logger.info(`SMTP: Email successfully sent via Resend API. Response ID: ${resData.id}`);
      return {
        messageId: resData.id,
        accepted: [to],
        rejected: [],
        response: '250 OK: Accepted via Resend API',
      };
    } catch (apiError) {
      logger.error(`SMTP: Resend API Send Failure: ${apiError.stack || apiError.message}`);
      throw new Error(`Resend API dispatch failed: ${apiError.message}`);
    }
  }

  const absoluteEnvPath = path.resolve(process.cwd(), '.env');
  logger.info(`SMTP: Loading .env configuration from absolute path: ${absoluteEnvPath}`);

  const host = (process.env.EMAIL_HOST || 'smtp.gmail.com').trim().replace(/^['"]|['"]$/g, '');
  const port = parseInt(process.env.EMAIL_PORT || '587');
  const secure = (process.env.EMAIL_SECURE || 'false').trim().replace(/^['"]|['"]$/g, '') === 'true'; // false for 587
  
  // Strip trailing spaces and surrounding quotes from credentials
  const user = process.env.EMAIL_USER ? process.env.EMAIL_USER.trim().replace(/^['"]|['"]$/g, '') : '';
  const pass = process.env.EMAIL_PASS ? process.env.EMAIL_PASS.trim().replace(/^['"]|['"]$/g, '') : '';

  // Requirement: Print loaded state (without exposing secrets)
  logger.info(`EMAIL_USER Loaded: ${!!user}`);
  logger.info(`EMAIL_PASS Loaded: ${!!pass}`);

  if (!user || !pass || user === 'your_gmail_address@gmail.com') {
    logger.error('SMTP Error: Gmail credentials (EMAIL_USER & EMAIL_PASS) are missing or set to defaults in .env.');
    throw new Error('SMTP Configuration Error: Real EMAIL_USER and EMAIL_PASS environment variables must be defined in your .env file.');
  }

  logger.info(`SMTP: Attempting connection to host: ${host}:${port} (secure: ${secure}) using user: ${user}`);

  const transporter = nodemailer.createTransport({
    host,
    port,
    secure,
    auth: {
      user,
      pass,
    },
    tls: {
      rejectUnauthorized: false, // Prevents certificate verification failures
    },
  });

  // Verify transporter configuration prior to sending
  logger.info('SMTP: Verifying transporter connection configuration...');
  try {
    await transporter.verify();
    logger.info('SMTP: Transporter verified successfully and is ready to send.');
  } catch (verifyError) {
    logger.error('SMTP Connection/Authentication Failed.');
    logger.error(`SMTP Configuration Used:`);
    logger.error(`  Host: ${host}`);
    logger.error(`  Port: ${port}`);
    logger.error(`  Secure: ${secure}`);
    logger.error(`  EMAIL_USER: "${user}"`);
    logger.error(`  Resolved .env Path: ${absoluteEnvPath}`);
    logger.error(`Root cause error details: ${verifyError.stack || verifyError.message}`);
    throw new Error(`SMTP Transporter Verification Failed: ${verifyError.message}`);
  }

  // Gmail SMTP requires the 'from' address to match the authenticated user
  const mailOptions = {
    from: `"AI TripCraft" <${user}>`,
    to,
    subject,
    html,
  };

  try {
    logger.info(`SMTP: Dispatched mail request to: ${to}`);
    const info = await transporter.sendMail(mailOptions);
    logger.info(`SMTP: Email accepted by Gmail SMTP. Message ID: ${info.messageId}`);
    logger.info(`SMTP: Server Response: ${JSON.stringify(info)}`);
    return info;
  } catch (sendError) {
    logger.error(`SMTP Send Error: ${sendError.message}`);
    throw sendError;
  }
};

module.exports = {
  sendEmail,
};
