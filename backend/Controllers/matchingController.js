const Project = require('../Models/Project');
const User = require('../Models/User');

/* -----------------------------
   Helper: normalize array
------------------------------*/
function normalizeArray(arr = []) {
  return arr.map(v => v.toLowerCase().trim());
}

/* -----------------------------
   Helper: get all user skills
------------------------------*/
function getUserSkills(user) {
  const skills = user.skills || {};
  let allSkills = [];

  Object.keys(skills).forEach(key => {
    allSkills = allSkills.concat(skills[key]);
  });

  return normalizeArray(allSkills);
}

/* -----------------------------
   Helper: convert availability
------------------------------*/
function getHours(user) {
  if (user.availabilityHours) return user.availabilityHours;

  if (user.availability === "5 hours/week") return 5;
  if (user.availability === "10 hours/week") return 10;
  if (user.availability === "15+ hours/week") return 15;

  return 0;
}

/* -----------------------------
   Score a candidate
------------------------------*/
function calculateScore(projectTech, rolesNeeded, user) {

  const userSkills = getUserSkills(user);

  /* Skill match */
  let overlap = projectTech.filter(tech => userSkills.includes(tech));

  let skillScore = 0;
  if (projectTech.length > 0) {
    skillScore = Math.round((overlap.length / projectTech.length) * 60);
  }

  /* Role match */
  let roleScore = 0;
  const role = (user.rolePreference || "").toLowerCase();

  if (rolesNeeded.includes(role)) {
    roleScore = 20;
  }

  /* Availability score */
  const hours = getHours(user);
  let availabilityScore = Math.round((hours / 15) * 20);

  if (availabilityScore > 20) availabilityScore = 20;

  /* Total score */
  const totalScore = skillScore + roleScore + availabilityScore;

  return {
    user: {
      _id: user._id,
      name: user.name,
      email: user.email,
      rolePreference: user.rolePreference,
      availabilityHours: hours,
      topSkills: userSkills.slice(0, 8)
    },
    matchScore: totalScore,
    explanation: {
      skillScore,
      roleScore,
      availabilityScore
    }
  };
}

/* -----------------------------
   API: Get teammate matches
------------------------------*/
exports.getProjectMatches = async (req, res) => {
  try {

    const projectId = req.params.projectId;
    const teamSize = req.body.teamSize || 5;

    /* Get project */
    const project = await Project.findById(projectId)
      .populate("teamMembers.user", "_id");

    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    const projectTech = normalizeArray(project.techStack || []);
    const rolesNeeded = normalizeArray(project.requiredRoles || []);

    /* Existing team members */
    const existingIds = project.teamMembers.map(m => m.user._id.toString());
    existingIds.push(req.user._id.toString());

    /* Find other users */
    const users = await User.find({
      _id: { $nin: existingIds }
    }).select("name email skills rolePreference availability availabilityHours");

    /* Score each user */
    const results = users.map(user =>
      calculateScore(projectTech, rolesNeeded, user)
    );

    /* Sort by score */
    results.sort((a, b) => b.matchScore - a.matchScore);

    /* Limit results */
    const matches = results.slice(0, teamSize * 5);

    res.json({
      success: true,
      projectId: project._id,
      matches
    });

  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message
    });
  }
};