const User = require('../models/User');
const OTP = require('../models/OTP');
const Notification = require('../models/Notification');
const emailService = require('../services/emailService');
const ApiResponse = require('../utils/apiResponse');
const jwt = require('jsonwebtoken');
const logger = require('../utils/logger');

// Generate 6-digit random numeric OTP
const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Generate Access Token (JWT)
const generateAccessToken = (user) => {
  return jwt.sign(
    { id: user._id, role: user.role },
    process.env.JWT_SECRET || 'supersecretjwtkeyforaitripcraft',
    { expiresIn: process.env.ACCESS_TOKEN_EXPIRY || '1h' }
  );
};

// Generate Refresh Token
const generateRefreshToken = (user) => {
  return jwt.sign(
    { id: user._id },
    process.env.REFRESH_SECRET || 'supersecretrefreshkeyforaitripcraft',
    { expiresIn: process.env.REFRESH_TOKEN_EXPIRY || '7d' }
  );
};

// Professional Responsive HTML Email Template Wrapper
const getHtmlTemplate = (title, message, otp) => {
  return `
    <div style="font-family: 'Inter', 'Helvetica Neue', Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px; background-color: #f8fafc;">
      <div style="background-color: #ffffff; border-radius: 16px; padding: 40px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06); border: 1px solid #e2e8f0;">
        <!-- Logo -->
        <div style="text-align: center; margin-bottom: 32px;">
          <div style="display: inline-block; padding: 12px 24px; background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%); border-radius: 12px; color: #ffffff; font-weight: 800; font-size: 24px; letter-spacing: -0.5px; box-shadow: 0 4px 12px rgba(99, 102, 241, 0.3);">
            🌌 AI TripCraft
          </div>
        </div>
        
        <!-- Welcome Message -->
        <h2 style="color: #0f172a; font-size: 22px; font-weight: 700; text-align: center; margin-top: 0; margin-bottom: 12px; font-family: 'Outfit', sans-serif;">
          ${title}
        </h2>
        <p style="color: #475569; font-size: 15px; line-height: 1.6; text-align: center; margin-bottom: 32px;">
          ${message}
        </p>
        
        <!-- 6-digit OTP -->
        <div style="background-color: #f1f5f9; border-radius: 12px; padding: 24px; text-align: center; margin-bottom: 32px; border: 1px solid #e2e8f0;">
          <span style="display: block; font-size: 12px; text-transform: uppercase; letter-spacing: 1.5px; color: #64748b; font-weight: 700; margin-bottom: 8px;">Verification Code</span>
          <span style="font-size: 38px; font-weight: 800; letter-spacing: 8px; color: #4f46e5; font-family: 'Courier New', Courier, monospace;">${otp}</span>
        </div>
        
        <!-- Security Warning & Expiration -->
        <div style="background-color: #fef2f2; border-left: 4px solid #ef4444; padding: 16px; border-radius: 8px; margin-bottom: 32px;">
          <p style="color: #991b1b; font-size: 13px; line-height: 1.5; margin: 0; font-weight: 500;">
            <strong>⚠️ Expiry Alert:</strong> This code is valid for exactly <strong>5 minutes</strong> and will expire soon. Do not disclose this OTP code to anyone.
          </p>
        </div>
        
        <hr style="border: 0; border-top: 1px solid #e2e8f0; margin-bottom: 24px;" />
        
        <!-- Footer -->
        <p style="color: #94a3b8; font-size: 11px; line-height: 1.5; text-align: center; margin: 0;">
          This is an automated security transmission from AI TripCraft. If you did not trigger this request, please ignore this email or contact support.
        </p>
      </div>
      <div style="text-align: center; margin-top: 24px; color: #94a3b8; font-size: 12px;">
        © 2026 AI TripCraft. Made with ❤️ for travelers.
      </div>
    </div>
  `;
};

// Send HTML Email for registration verification
const sendVerificationEmail = async (email, otp, name) => {
  const title = 'Verify Your AI TripCraft Account';
  const message = `Hi ${name || 'Traveler'}, thank you for signing up! To complete your registration and unlock access to AI-crafted itineraries, please verify your email address by entering the 6-digit OTP code below:`;
  const html = getHtmlTemplate(title, message, otp);
  
  await emailService.sendEmail({
    to: email,
    subject: `Verify your AI TripCraft Account - OTP [${otp}]`,
    html,
  });
};

// Send HTML Email for password resets
const sendResetPasswordEmail = async (email, otp, name) => {
  const title = 'Reset Your AI TripCraft Password';
  const message = `Hi ${name || 'Traveler'}, we received a request to reset your password. Please use the following 6-digit security code to finalize the reset:`;
  const html = getHtmlTemplate(title, message, otp);
  
  await emailService.sendEmail({
    to: email,
    subject: `Reset your AI TripCraft Password - OTP [${otp}]`,
    html,
  });
};

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
const registerUser = async (req, res, next) => {
  try {
    const { username, email, password, firstName, lastName, phone } = req.body;

    const existingEmailUser = await User.findOne({ email: email.toLowerCase() });
    if (existingEmailUser) {
      return ApiResponse.error(res, 'Email already registered.', 400);
    }

    const existingUsernameUser = await User.findOne({ username });
    if (existingUsernameUser) {
      return ApiResponse.error(res, 'User with this username already exists', 400);
    }

    const user = await User.create({
      username,
      email,
      password,
      emailVerified: false,
      otpVerified: false,
      firstName: firstName || '',
      lastName: lastName || '',
      phone: phone || '',
      avatar: `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(username)}`,
      profile: {
        firstName: firstName || '',
        lastName: lastName || '',
        phone: phone || '',
        avatarUrl: `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(username)}`,
      },
    });

    // Generate secure 6-digit OTP
    const otpCode = generateOTP();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes validity

    // Store OTP in database
    await OTP.create({
      email: email.toLowerCase(),
      otp: otpCode,
      purpose: 'verification',
      expiresAt,
    });

    // Send OTP to user's email, rollback transaction if SMTP connection fails
    try {
      await sendVerificationEmail(email.toLowerCase(), otpCode, firstName);
    } catch (emailError) {
      // Rollback registration
      await User.deleteOne({ _id: user._id });
      await OTP.deleteMany({ email: email.toLowerCase(), purpose: 'verification' });
      logger.error(`Registration rolled back due to email sending failure: ${emailError.message}`);
      return ApiResponse.error(
        res,
        `SMTP Error: Email delivery failed. Registration rolled back. Reason: ${emailError.message}`,
        500
      );
    }

    // Create system notification
    await Notification.create({
      user: user._id,
      title: 'Welcome to AI TripCraft!',
      message: 'Please verify your email using the 6-digit OTP code sent to your inbox.',
    });

    logger.info(`User registered, verification OTP sent to: ${user.email}`);

    return ApiResponse.success(res, 'Registration successful. An OTP verification code has been sent to your email.', {
      email: user.email,
      otpVerified: false,
    }, 201);
  } catch (error) {
    next(error);
  }
};

// @desc    Authenticate a user & get token
// @route   POST /api/auth/login
// @access  Public
const loginUser = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email }).select('+hashedPassword');
    if (!user) {
      return ApiResponse.error(res, 'Invalid credentials', 401);
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return ApiResponse.error(res, 'Invalid credentials', 401);
    }

    // Block login for unverified users
    if (!user.emailVerified || !user.otpVerified) {
      return res.status(403).json({
        success: false,
        message: 'Your email address is not verified yet. Please enter the OTP code sent during registration.',
        unverified: true,
        email: user.email
      });
    }

    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    // Save refresh token to user DB
    user.refreshTokens.push(refreshToken);
    if (user.refreshTokens.length > 5) {
      user.refreshTokens.shift();
    }
    
    // Save last login time
    user.lastLogin = new Date();
    await user.save();

    logger.info(`User logged in successfully: ${user.email}`);

    return ApiResponse.success(res, 'Logged in successfully', {
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        profile: user.profile,
        createdAt: user.createdAt,
      },
      accessToken,
      refreshToken,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Verify OTP for account activation
// @route   POST /api/auth/verify-otp
// @access  Public
const verifyOtp = async (req, res, next) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) {
      return ApiResponse.error(res, 'Email and OTP are required', 400);
    }

    const otpDoc = await OTP.findOne({ email: email.toLowerCase(), purpose: 'verification' });
    if (!otpDoc) {
      return ApiResponse.error(res, 'OTP has expired or does not exist. Please request a new code.', 400);
    }

    // Check expiration
    if (otpDoc.expiresAt < new Date()) {
      await OTP.deleteOne({ _id: otpDoc._id });
      return ApiResponse.error(res, 'OTP has expired. Please request a new code.', 400);
    }

    // Increment attempts
    otpDoc.attempts += 1;
    await otpDoc.save();

    if (otpDoc.attempts > 5) {
      await OTP.deleteOne({ _id: otpDoc._id });
      return ApiResponse.error(res, 'Too many verification attempts. Please request a new OTP.', 400);
    }

    // Match OTP
    if (otpDoc.otp !== otp.trim()) {
      return ApiResponse.error(res, `Invalid OTP. Attempt ${otpDoc.attempts} of 5.`, 400);
    }

    // Mark user as verified
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return ApiResponse.error(res, 'User not found', 404);
    }

    user.otpVerified = true;
    user.emailVerified = true;
    await user.save();

    // Delete verified OTP record
    await OTP.deleteOne({ _id: otpDoc._id });

    logger.info(`User email verified successfully: ${email}`);

    // Log verification notification
    await Notification.create({
      user: user._id,
      title: 'Email Verified Successfully',
      message: 'Thank you! Your email is verified. You can now plan your trips.',
    });

    return ApiResponse.success(res, 'Email verified successfully. You can now log in.', {
      verified: true
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Resend registration verification OTP
// @route   POST /api/auth/resend-otp
// @access  Public
const resendOtp = async (req, res, next) => {
  try {
    const { email } = req.body;
    if (!email) {
      return ApiResponse.error(res, 'Email is required', 400);
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return ApiResponse.error(res, 'User not found', 404);
    }

    if (user.otpVerified) {
      return ApiResponse.error(res, 'This account is already verified. Please log in.', 400);
    }

    // Clear old OTPs
    await OTP.deleteMany({ email: email.toLowerCase(), purpose: 'verification' });

    // Generate new OTP
    const otpCode = generateOTP();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

    await OTP.create({
      email: email.toLowerCase(),
      otp: otpCode,
      purpose: 'verification',
      expiresAt,
    });

    // Send email, catch errors cleanly
    try {
      await sendVerificationEmail(email.toLowerCase(), otpCode, user.profile?.firstName || user.username);
    } catch (emailError) {
      await OTP.deleteMany({ email: email.toLowerCase(), purpose: 'verification' });
      logger.error(`Resend OTP failed: ${emailError.message}`);
      return ApiResponse.error(res, `Failed to resend verification email: ${emailError.message}`, 500);
    }

    logger.info(`OTP resent successfully to: ${email}`);

    return ApiResponse.success(res, 'A new verification OTP code has been sent to your email.');
  } catch (error) {
    next(error);
  }
};

// @desc    Refresh access token
// @route   POST /api/auth/refresh
// @access  Public
const refreshAccessToken = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      return ApiResponse.error(res, 'Refresh token is required', 400);
    }

    let decoded;
    try {
      decoded = jwt.verify(refreshToken, process.env.REFRESH_SECRET || 'supersecretrefreshkeyforaitripcraft');
    } catch (err) {
      return ApiResponse.error(res, 'Invalid or expired refresh token', 401);
    }

    const user = await User.findById(decoded.id);
    if (!user || !user.refreshTokens.includes(refreshToken)) {
      return ApiResponse.error(res, 'Invalid refresh token session', 401);
    }

    const newAccessToken = generateAccessToken(user);
    
    return ApiResponse.success(res, 'Token refreshed successfully', {
      accessToken: newAccessToken,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Logout user & invalidate refresh token
// @route   POST /api/auth/logout
// @access  Private
const logoutUser = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      return ApiResponse.error(res, 'Refresh token is required to logout', 400);
    }

    const user = await User.findById(req.user.id);
    if (user) {
      user.refreshTokens = user.refreshTokens.filter((token) => token !== refreshToken);
      await user.save();
    }

    logger.info(`User logged out: ${req.user.email}`);
    return ApiResponse.success(res, 'Logged out successfully');
  } catch (error) {
    next(error);
  }
};

// @desc    Request Password Reset OTP
// @route   POST /api/auth/forgot-password
// @access  Public
const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    if (!email) {
      return ApiResponse.error(res, 'Email is required', 400);
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return ApiResponse.error(res, 'User with this email does not exist', 404);
    }

    // Delete any existing reset OTPs
    await OTP.deleteMany({ email: email.toLowerCase(), purpose: 'reset' });

    // Generate secure 6-digit Reset OTP
    const resetOtp = generateOTP();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // exactly 5 minutes validity

    await OTP.create({
      email: email.toLowerCase(),
      otp: resetOtp,
      purpose: 'reset',
      expiresAt,
    });

    // Send email, rollback and delete OTP document on error
    try {
      await sendResetPasswordEmail(email.toLowerCase(), resetOtp, user.profile?.firstName || user.username);
    } catch (emailError) {
      await OTP.deleteMany({ email: email.toLowerCase(), purpose: 'reset' });
      logger.error(`Password reset failed due to email error: ${emailError.message}`);
      return ApiResponse.error(res, `Failed to send password reset email: ${emailError.message}`, 500);
    }

    logger.info(`Password reset OTP generated for: ${email}`);
    
    return ApiResponse.success(res, 'Password reset OTP has been sent to your email.', {
      resetToken: resetOtp,
      email: user.email
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Reset password using OTP code
// @route   POST /api/auth/reset-password/:token
// @access  Public
const resetPassword = async (req, res, next) => {
  try {
    const { token } = req.params; // The reset OTP code
    const { password, email } = req.body;

    if (!email || !password) {
      return ApiResponse.error(res, 'Email and new password are required', 400);
    }

    const otpDoc = await OTP.findOne({ email: email.toLowerCase(), otp: token.trim(), purpose: 'reset' });
    if (!otpDoc) {
      return ApiResponse.error(res, 'Invalid or expired password reset OTP. Please try again.', 400);
    }

    // Check expiration
    if (otpDoc.expiresAt < new Date()) {
      await OTP.deleteOne({ _id: otpDoc._id });
      return ApiResponse.error(res, 'Reset OTP has expired. Please request a new reset code.', 400);
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return ApiResponse.error(res, 'User not found', 404);
    }

    // Set new password (User model pre-save will automatically hash it)
    user.password = password;
    user.refreshTokens = []; // Log out all active sessions for security
    await user.save();

    // Delete used OTP
    await OTP.deleteOne({ _id: otpDoc._id });

    logger.info(`Password reset successfully for user: ${user.email}`);

    // System Notification
    await Notification.create({
      user: user._id,
      title: 'Security Alert: Password Changed',
      message: 'Your account password was updated successfully. If this wasn\'t you, secure your account.',
    });

    return ApiResponse.success(res, 'Password reset successful. Please log in with your new password.');
  } catch (error) {
    next(error);
  }
};

// @desc    Get user profile details
// @route   GET /api/auth/profile
// @access  Private
const getUserProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return ApiResponse.error(res, 'User not found', 404);
    }

    return ApiResponse.success(res, 'Profile retrieved', {
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        profile: user.profile,
        createdAt: user.createdAt,
        lastLogin: user.lastLogin,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update user profile
// @route   PUT /api/auth/profile
// @access  Private
const updateUserProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return ApiResponse.error(res, 'User not found', 404);
    }

    const { firstName, lastName, phone, avatarUrl } = req.body;
    
    if (firstName !== undefined) user.profile.firstName = firstName;
    if (lastName !== undefined) user.profile.lastName = lastName;
    if (phone !== undefined) user.profile.phone = phone;
    if (avatarUrl !== undefined) user.profile.avatarUrl = avatarUrl;

    // Sync top-level fields
    if (firstName !== undefined) user.firstName = firstName;
    if (lastName !== undefined) user.lastName = lastName;
    if (phone !== undefined) user.phone = phone;
    if (avatarUrl !== undefined) user.avatar = avatarUrl;

    await user.save();

    logger.info(`User profile updated: ${user.email}`);

    return ApiResponse.success(res, 'Profile updated successfully', {
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        profile: user.profile,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Test SMTP configurations by sending a real test email
// @route   GET /api/auth/smtp-test
// @access  Public
const smtpTest = async (req, res, next) => {
  try {
    const user = process.env.EMAIL_USER ? process.env.EMAIL_USER.trim().replace(/^['"]|['"]$/g, '') : '';
    if (!user) {
      return ApiResponse.error(res, 'SMTP-TEST Error: EMAIL_USER environment variable is not defined or empty.', 400);
    }
    
    logger.info(`SMTP-TEST: Initiating test email dispatch to: ${user}`);
    
    const info = await emailService.sendEmail({
      to: user,
      subject: 'AI TripCraft - SMTP Diagnostic Test Email',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 30px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff;">
          <h2 style="color: #4f46e5; margin-top: 0;">AI TripCraft SMTP Connection Successful!</h2>
          <p>This message confirms that your real Gmail SMTP configuration is fully integrated and working correctly.</p>
          <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
          <p style="font-size: 13px; color: #64748b; margin-bottom: 0;"><strong>Timestamp:</strong> ${new Date().toString()}</p>
        </div>
      `
    });

    logger.info(`SMTP-TEST Success: Message ID: ${info.messageId}`);

    return ApiResponse.success(res, 'SMTP Diagnostic test email accepted by Gmail SMTP!', {
      accepted: info.accepted,
      rejected: info.rejected,
      response: info.response,
      messageId: info.messageId,
      responseCode: info.response ? info.response.split(' ')[0] : 'N/A'
    });
  } catch (error) {
    logger.error(`SMTP-TEST Failure: ${error.stack || error.message}`);
    return res.status(500).json({
      success: false,
      message: `SMTP Diagnostic test email failed to send: ${error.message}`,
      error: error.message,
      stack: error.stack
    });
  }
};

module.exports = {
  registerUser,
  loginUser,
  verifyOtp,
  resendOtp,
  refreshAccessToken,
  logoutUser,
  forgotPassword,
  resetPassword,
  getUserProfile,
  updateUserProfile,
  smtpTest,
};
