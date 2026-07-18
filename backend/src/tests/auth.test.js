require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });
const connectDB = require('../config/db');
const User = require('../models/User');
const OTP = require('../models/OTP');
const authController = require('../controllers/authController');

const makeMockRes = () => {
  const res = {
    statusCode: 200,
    jsonPayload: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(data) {
      this.jsonPayload = data;
      return this;
    }
  };
  return res;
};

const runTests = async () => {
  console.log('🧪 Starting Authentication Integration Test Suite...');
  
  // 1. Connect to DB using the app's db.js logic (connects directly to persistent database)
  await connectDB();
  console.log('✅ Connected to MongoDB.');

  const testEmail = 'testuser_integration@example.com';
  const testPassword = 'Password123!';
  const newPassword = 'NewPassword123!';

  // Clean up any stale test user
  await User.deleteOne({ email: testEmail });
  await OTP.deleteMany({ email: testEmail });
  console.log('🧹 Cleaned up old test data.');

  try {
    // TEST 1: User Registration
    console.log('\n--- Test 1: Register User ---');
    const regReq = {
      body: {
        username: 'integration_test_user',
        email: testEmail,
        password: testPassword,
        firstName: 'Integration',
        lastName: 'Tester',
        phone: '1234567890'
      }
    };
    const regRes = makeMockRes();
    await authController.registerUser(regReq, regRes, (err) => {
      if (err) throw err;
    });

    if (regRes.statusCode !== 201) {
      throw new Error(`Registration failed with status ${regRes.statusCode}: ${JSON.stringify(regRes.jsonPayload)}`);
    }
    console.log('✅ Registration request completed successfully.');
    
    // Verify DB states
    const user = await User.findOne({ email: testEmail });
    if (!user || user.otpVerified !== false) {
      throw new Error('❌ User was not created in unverified state.');
    }
    console.log('✅ User document created in MongoDB in unverified state.');

    const otpDoc = await OTP.findOne({ email: testEmail, purpose: 'verification' });
    if (!otpDoc) {
      throw new Error('❌ Verification OTP document was not created.');
    }
    console.log(`✅ Verification OTP document created. Code in DB: ${otpDoc.otp}`);

    // TEST 2: Login attempt (should be blocked)
    console.log('\n--- Test 2: Login Before Verification (Blocked) ---');
    const blockReq = {
      body: {
        email: testEmail,
        password: testPassword
      }
    };
    const blockRes = makeMockRes();
    await authController.loginUser(blockReq, blockRes, (err) => {
      if (err) throw err;
    });

    if (blockRes.statusCode !== 403 || !blockRes.jsonPayload.unverified) {
      throw new Error(`Expected block (403), got status ${blockRes.statusCode}: ${JSON.stringify(blockRes.jsonPayload)}`);
    }
    console.log('✅ Login successfully blocked with 403 (Unverified Email).');

    // TEST 3: Verify OTP
    console.log('\n--- Test 3: OTP Verification ---');
    const verifyReq = {
      body: {
        email: testEmail,
        otp: otpDoc.otp
      }
    };
    const verifyRes = makeMockRes();
    await authController.verifyOtp(verifyReq, verifyRes, (err) => {
      if (err) throw err;
    });

    if (verifyRes.statusCode !== 200 || !verifyRes.jsonPayload.success) {
      throw new Error(`OTP Verification failed: ${JSON.stringify(verifyRes.jsonPayload)}`);
    }
    console.log('✅ OTP code verified successfully.');

    // Verify DB states updated
    const verifiedUser = await User.findOne({ email: testEmail });
    if (!verifiedUser || !verifiedUser.otpVerified) {
      throw new Error('❌ User remains unverified in database.');
    }
    console.log('✅ User marked as otpVerified: true in database.');

    const deletedOtp = await OTP.findOne({ email: testEmail, purpose: 'verification' });
    if (deletedOtp) {
      throw new Error('❌ OTP document was not deleted after use.');
    }
    console.log('✅ OTP document purged from database successfully.');

    // TEST 4: Login (should succeed now)
    console.log('\n--- Test 4: Login After Verification (Success) ---');
    const loginReq = {
      body: {
        email: testEmail,
        password: testPassword
      }
    };
    const loginRes = makeMockRes();
    await authController.loginUser(loginReq, loginRes, (err) => {
      if (err) throw err;
    });

    if (loginRes.statusCode !== 200 || !loginRes.jsonPayload.data.accessToken) {
      throw new Error(`Login failed: ${JSON.stringify(loginRes.jsonPayload)}`);
    }
    console.log('✅ User logged in successfully. Access and Refresh tokens generated.');

    // TEST 5: Request Password Reset OTP
    console.log('\n--- Test 5: Request Password Reset OTP ---');
    const forgotReq = {
      body: { email: testEmail }
    };
    const forgotRes = makeMockRes();
    await authController.forgotPassword(forgotReq, forgotRes, (err) => {
      if (err) throw err;
    });

    if (forgotRes.statusCode !== 200) {
      throw new Error(`Forgot password failed: ${JSON.stringify(forgotRes.jsonPayload)}`);
    }
    console.log('✅ Forgot password request processed.');

    const resetOtpDoc = await OTP.findOne({ email: testEmail, purpose: 'reset' });
    if (!resetOtpDoc) {
      throw new Error('❌ Reset OTP document not found in DB.');
    }
    console.log(`✅ Reset OTP document created. Code in DB: ${resetOtpDoc.otp}`);

    // TEST 6: Reset Password
    console.log('\n--- Test 6: Reset Password ---');
    const resetReq = {
      params: { token: resetOtpDoc.otp },
      body: {
        email: testEmail,
        password: newPassword
      }
    };
    const resetRes = makeMockRes();
    await authController.resetPassword(resetReq, resetRes, (err) => {
      if (err) throw err;
    });

    if (resetRes.statusCode !== 200) {
      throw new Error(`Password reset failed: ${JSON.stringify(resetRes.jsonPayload)}`);
    }
    console.log('✅ Password reset request completed.');

    // Verify login with new password
    console.log('\n--- Test 7: Verify Login with New Password ---');
    const newLoginReq = {
      body: {
        email: testEmail,
        password: newPassword
      }
    };
    const newLoginRes = makeMockRes();
    await authController.loginUser(newLoginReq, newLoginRes, (err) => {
      if (err) throw err;
    });

    if (newLoginRes.statusCode !== 200) {
      throw new Error(`Login with new password failed: ${JSON.stringify(newLoginRes.jsonPayload)}`);
    }
    console.log('✅ Logged in successfully with new password.');

    console.log('\n🌟 ALL TESTS PASSED SUCCESSFULLY! 🌟');
  } catch (error) {
    console.error('\n❌ TEST FAILED:', error.message);
  } finally {
    // Clean up test user
    await User.deleteOne({ email: testEmail });
    await OTP.deleteMany({ email: testEmail });
    console.log('\n🧹 Cleaned up integration test user.');
    await require('mongoose').disconnect();
    console.log('🔌 Disconnected from MongoDB.');
  }
};

runTests();
