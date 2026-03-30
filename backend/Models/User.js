const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// ─── Sub-schemas ─────────────────────────────────────────

const achievementSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  description: { type: String, default: '', trim: true },
  year: { type: Number },
}, { _id: true });

const certificateSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  organization: { type: String, default: '', trim: true },
  issueDate: { type: String, default: '' },
  fileUrl: { type: String, default: '' },
  link: { type: String, default: '' },
}, { _id: true });

// ─── Main User Schema ───────────────────────────────────

const userSchema = new mongoose.Schema(
  {
    // ── Basic Info ──
    name: {
      type: String,
      required: [true, 'Full name is required'],
      trim: true,
      maxlength: 100,
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email'],
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: 6,
      select: false,
    },
    college: {
      type: String,
      required: [true, 'College / University is required'],
      trim: true,
    },
    department: {
      type: String,
      required: [true, 'Department / Branch is required'],
      trim: true,
    },
    yearOfStudy: {
      type: Number,
      required: [true, 'Year of study is required'],
      min: 1,
      max: 5,
    },
    bio: {
      type: String,
      default: '',
      maxlength: 500,
    },
    avatar: {
      type: String,
      default: '',
    },
    location: {
      type: String,
      default: '',
      trim: true,
    },

    // ── Skills (categorized) ──
    skills: {
      programmingLanguages: { type: [String], default: [] },
      webDevelopment: { type: [String], default: [] },
      mobileDevelopment: { type: [String], default: [] },
      aiMl: { type: [String], default: [] },
      databases: { type: [String], default: [] },
      tools: { type: [String], default: [] },
    },

    // ── Achievements ──
    achievements: {
      type: [achievementSchema],
      default: [],
    },

    // ── Certificates ──
    certificates: {
      type: [certificateSchema],
      default: [],
    },

    // ── Interests / Domains ──
    interests: {
      type: [String],
      default: [],
    },

    // ── Matching preferences ──
    learningGoals: {
      type: [String],
      default: [],
    },
    rolePreference: {
      type: String,
      enum: ['', 'frontend', 'backend', 'ml', 'design'],
      default: '',
    },

    // ── Portfolio Links ──
    portfolioLinks: {
      github: { type: String, default: '' },
      linkedin: { type: String, default: '' },
      portfolio: { type: String, default: '' },
      kaggle: { type: String, default: '' },
      leetcode: { type: String, default: '' },
    },

    // ── Availability ──
    availability: {
      type: String,
      enum: ['', '5 hours/week', '10 hours/week', '15+ hours/week'],
      default: '',
    },
    availabilityHours: {
      type: Number,
      default: 0,
      min: 0,
    },

    // ── Experience Level ──
    experienceLevel: {
      type: String,
      enum: ['', 'Beginner', 'Intermediate', 'Advanced'],
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

// Hash password before saving
userSchema.pre('save', async function () {
  if (!this.isModified('password')) return;
  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
});

// Compare entered password with hashed password
userSchema.methods.comparePassword = async function (enteredPassword) {
  return bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
