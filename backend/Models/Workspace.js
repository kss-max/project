const mongoose = require('mongoose');

const workspaceMemberSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    role: {
      type: String,
      default: 'member',
      trim: true,
    },
    joinedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    _id: false,
  }
);

const workspaceSchema = new mongoose.Schema(
  {
    projectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project',
      required: true,
      unique: true,
    },
    members: {
      type: [workspaceMemberSchema],
      default: [],
    },
    channels: {
      type: [mongoose.Schema.Types.ObjectId],
      ref: 'Channel',
      default: [],
    },
    settings: {
      allowGuests: {
        type: Boolean,
        default: false,
      },
      theme: {
        type: String,
        default: 'light',
        trim: true,
      },
    },
  },
  {
    timestamps: true,
  }
);

workspaceSchema.index({ projectId: 1 }, { unique: true });
workspaceSchema.index({ 'members.user': 1 });

module.exports = mongoose.model('Workspace', workspaceSchema);