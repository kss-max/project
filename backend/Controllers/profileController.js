const User = require('../Models/User');

// ─── GET PROFILE ────────────────────────────────────────
exports.getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    res.status(200).json({ success: true, user });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─── UPDATE PROFILE ─────────────────────────────────────
exports.updateProfile = async (req, res) => {
  try {
    // Fields that can be updated
    const allowedFields = [
      'name', 'college', 'department', 'yearOfStudy',
      'bio', 'avatar', 'location',
      'skills', 'achievements', 'certificates',
      'interests', 'portfolioLinks',
      'availability', 'availabilityHours', 'experienceLevel',
      'learningGoals', 'rolePreference',
    ];

    const updates = {};
    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    }

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { $set: updates },
      { new: true, runValidators: true }
    );

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    res.status(200).json({ success: true, user });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─── GET PUBLIC PROFILE BY ID ────────────────────────────
exports.getPublicProfile = async (req, res) => {
  try {
    const { userId } = req.params;
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    res.status(200).json({ success: true, user });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
