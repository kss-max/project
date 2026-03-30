const mongoose = require('mongoose');

const invitationSchema = new mongoose.Schema(
  {
    projectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project',
      required: true,
    },
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    receiver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    status: {
      type: String,
      enum: ['pending', 'accepted', 'rejected'],
      default: 'pending',
    },
    role: {
      type: String,
      default: 'Member',
    },
    type: {
      type: String,
      enum: ['invitation', 'application'],
      default: 'invitation',
    },
    message: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

invitationSchema.index({ projectId: 1, receiver: 1, status: 1 });
invitationSchema.index({ receiver: 1, createdAt: -1 });
invitationSchema.index(
  { projectId: 1, sender: 1, receiver: 1 },
  {
    unique: true,
    partialFilterExpression: { status: 'pending' },
  }
);

module.exports = mongoose.model('Invitation', invitationSchema);