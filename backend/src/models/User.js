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
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [6, 'Password must be at least 6 characters'],
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
    phone: { type: String, default: '' },
    avatar: { type: String, default: '' },
    emailVerified: { type: Boolean, default: false },
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
  
  if (this.phone) this.profile.phone = this.phone;
  if (this.profile.phone) this.phone = this.profile.phone;
  
  if (this.avatar) this.profile.avatarUrl = this.avatar;
  if (this.profile.avatarUrl) this.avatar = this.profile.avatarUrl;
  
  next();
});

// Encrypt password before saving
UserSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    return next();
  }
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Compare input password with database hashed password
UserSchema.methods.comparePassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', UserSchema);
