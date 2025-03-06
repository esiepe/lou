const nodemailer = require('nodemailer');
const winston = require('winston');
const { createLogger } = require('../utils/logger');

const logger = createLogger(module);

let transporter;

// Initialize email transporter based on environment
if (process.env.NODE_ENV === 'production') {
  // Production setup with actual email service
  transporter = nodemailer.createTransport({
    service: process.env.EMAIL_SERVICE, // e.g., 'Gmail', 'SendGrid'
    auth: {
      user: process.env.EMAIL_USERNAME,
      pass: process.env.EMAIL_PASSWORD
    }
  });
} else {
  // Development setup with ethereal.email
  transporter = nodemailer.createTransport({
    host: 'smtp.ethereal.email',
    port: 587,
    secure: false, // true for 465, false for other ports
    auth: {
      user: process.env.DEV_EMAIL_USERNAME || 'ethereal-test@example.com',
      pass: process.env.DEV_EMAIL_PASSWORD || 'ethereal-password'
    }
  });
}

/**
 * Send an email
 * @param {Object} options - Email options
 * @param {string} options.email - Recipient email
 * @param {string} options.subject - Email subject
 * @param {string} options.message - Email message (plain text)
 * @param {string} options.html - Email HTML content (optional)
 * @returns {Promise<Object>} Email send info
 */
exports.sendEmail = async (options) => {
  try {
    const mailOptions = {
      from: `"${process.env.EMAIL_FROM_NAME || 'Lost and Found'}" <${process.env.EMAIL_FROM_ADDRESS || 'noreply@lostandfound.com'}>`,
      to: options.email,
      subject: options.subject,
      text: options.message
    };
    
    // Add HTML if provided
    if (options.html) {
      mailOptions.html = options.html;
    }
    
    const info = await transporter.sendMail(mailOptions);
    
    // Log success in development
    if (process.env.NODE_ENV === 'development') {
      logger.info(`Email sent: ${info.messageId}`);
      logger.info(`Preview URL: ${nodemailer.getTestMessageUrl(info)}`);
    }
    
    return info;
  } catch (error) {
    logger.error(`Error sending email: ${error.message}`);
    throw error;
  }
};

/**
 * Send a verification email
 * @param {string} email - User email
 * @param {string} token - Verification token
 * @returns {Promise<Object>} Email send info
 */
exports.sendVerificationEmail = async (email, token) => {
  const verificationUrl = `${process.env.FRONTEND_URL}/verify-email/${token}`;
  
  const message = `
    Please verify your email address by clicking on the link below:
    
    ${verificationUrl}
    
    If you did not create an account, please ignore this email.
  `;
  
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2>Verify Your Email Address</h2>
      <p>Thank you for registering. Please verify your email address by clicking the button below:</p>
      <div style="text-align: center; margin: 30px 0;">
        <a href="${verificationUrl}" style="background-color: #4CAF50; color: white; padding: 12px 20px; text-decoration: none; border-radius: 4px; font-weight: bold;">Verify Email</a>
      </div>
      <p>Or copy and paste this link in your browser:</p>
      <p><a href="${verificationUrl}">${verificationUrl}</a></p>
      <p>If you did not create an account, please ignore this email.</p>
    </div>
  `;
  
  return this.sendEmail({
    email,
    subject: 'Please Verify Your Email',
    message,
    html
  });
};

/**
 * Send a password reset email
 * @param {string} email - User email
 * @param {string} token - Reset token
 * @returns {Promise<Object>} Email send info
 */
exports.sendPasswordResetEmail = async (email, token) => {
  const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${token}`;
  
  const message = `
    You requested a password reset. Please click on the link below to reset your password:
    
    ${resetUrl}
    
    If you didn't request a password reset, please ignore this email and your password will remain unchanged.
  `;
  
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2>Reset Your Password</h2>
      <p>You requested a password reset. Please click the button below to reset your password:</p>
      <div style="text-align: center; margin: 30px 0;">
        <a href="${resetUrl}" style="background-color: #4CAF50; color: white; padding: 12px 20px; text-decoration: none; border-radius: 4px; font-weight: bold;">Reset Password</a>
      </div>
      <p>Or copy and paste this link in your browser:</p>
      <p><a href="${resetUrl}">${resetUrl}</a></p>
      <p>If you didn't request a password reset, please ignore this email and your password will remain unchanged.</p>
      <p>This link is valid for 1 hour.</p>
    </div>
  `;
  
  return this.sendEmail({
    email,
    subject: 'Password Reset Request',
    message,
    html
  });
}; 