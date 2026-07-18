const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UserSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: [true, 'Username is required'],
      unique: true,
      trim: true,
      minlength: [3, 'Username must be at least 3 characters'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      trim: true,
      lowercase: true,
      match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please fill a valid email address'],
    },
    hashedPassword: {
      type: String,
      select: false, // hide password by default in queries
    },
    role: {
      type: String,
      enum: ['user'],
      default: 'user',
    },
    refreshTokens: {
      type: [String],
      default: [],
    },
    resetPasswordToken: String,
    resetPasswordExpires: Date,
    profile: {
      firstName: { type: String, default: '' },
      lastName: { type: String, default: '' },
      phone: { type: String, default: '' },
      avatarUrl: { type: String, default: '' },
    },
    firstName: { type: String, default: '' },
    lastName: { type: String, default: '' },
    fullName: { type: String, default: '' },
    phone: { type: String, default: '' },
    avatar: { type: String, default: '' },
    emailVerified: { type: Boolean, default: false },
    otpVerified: { type: Boolean, default: false },
    lastLogin: { type: Date, default: Date.now },
  },
  {
    timestamps: true,
  }
);

// Sync top-level and profile fields
UserSchema.pre('save', function (next) {
  if (this.firstName) this.profile.firstName = this.firstName;
  if (this.profile.firstName) this.firstName = this.profile.firstName;
  
  if (this.lastName) this.profile.lastName = this.lastName;
  if (this.profile.lastName) this.lastName = this.profile.lastName;
  
  if (this.firstName || this.lastName) {
    this.fullName = `${this.firstName || ''} ${this.lastName || ''}`.trim();
  }
  
  if (this.phone) this.profile.phone = this.phone;
  if (this.profile.phone) this.phone = this.profile.phone;
  
  if (this.avatar) this.profile.avatarUrl = this.avatar;
  if (this.profile.avatarUrl) this.avatar = this.profile.avatarUrl;
  
  next();
});

// Virtual field for password
UserSchema.virtual('password')
  .set(function (password) {
    this._password = password;
  })
  .get(function () {
    return this._password;
  });

// Validate virtual password or existing hashedPassword
UserSchema.pre('validate', function (next) {
  if (this.isNew && !this._password && !this.hashedPassword) {
    this.invalidate('password', 'Password is required');
  }
  if (this._password && this._password.length < 6) {
    this.invalidate('password', 'Password must be at least 6 characters');
  }
  next();
});

// Encrypt password before saving
UserSchema.pre('save', async function (next) {
  if (!this._password) {
    return next();
  }
  try {
    const salt = await bcrypt.genSalt(10);
    this.hashedPassword = await bcrypt.hash(this._password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Compare input password with database hashed password
UserSchema.methods.comparePassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.hashedPassword);
};

module.exports = mongoose.model('User', UserSchema);
