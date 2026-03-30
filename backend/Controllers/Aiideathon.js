const User = require('../Models/User');
const axios = require('axios');

// ─── GENERATE AI IDEAS ──────────────────────────────────
exports.getIdea = async (req, res) => {
  try {
    const { idea } = req.body;

    // b. Validate
    if (!idea || idea.trim().length === 0) {
      return res.status(400).json({ success: false, message: 'Idea cannot be empty' });
    }

    // c. Fetch user profile from DB  (lowercase req.user — set by protect middleware)
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // d. Extract ALL useful profile data
    const allSkills = [
      ...user.skills.programmingLanguages,
      ...user.skills.webDevelopment,
      ...user.skills.mobileDevelopment,
      ...user.skills.aiMl,
      ...user.skills.databases,
      ...user.skills.tools,
    ];

    const interests = user.interests || [];
    const experienceLevel = user.experienceLevel || 'Not specified';
    const department = user.department || 'Not specified';
    const yearOfStudy = user.yearOfStudy || 'Not specified';
    const achievements = (user.achievements || []).map((a) => a.title).filter(Boolean);

    // e. Build a SMART prompt
    //    - Always send skills (needed for skill gap calculation)
    //    - Include interests + department as CONTEXT, but tell AI to only use them if relevant
    //    - Include year/experience so difficulty matches the student's level
    const prompt = `You are a project advisor for college students.

=== STUDENT PROFILE ===
Skills: ${allSkills.join(', ') || 'None listed'}
Department: ${department}
Year of study: ${yearOfStudy}
Experience level: ${experienceLevel}
Interests/Domains: ${interests.join(', ') || 'None listed'}
Past achievements: ${achievements.join(', ') || 'None listed'}

=== THEIR IDEA ===
"${idea}"

=== INSTRUCTIONS ===
1. Suggest 3 project ideas based on the student's idea.
2. Use the student's SKILLS to determine requiredSkills (what they know) and skillGap (what they need to learn).
3. If the idea is RELATED to the student's interests or department, incorporate those interests to make suggestions more relevant and domain-specific.
4. If the idea is UNRELATED to their interests (e.g., interests say "AI" but idea is about "event management"), IGNORE the interests — focus purely on the idea itself.
5. Match difficulty to the student's experience level and year of study.

Return a JSON array of 3 objects. Each object must have:
- title (string)
- description (string, 2-3 sentences)
- techStack (string array)
- difficulty ("easy", "medium", or "hard")
- estimatedDuration (string like "4-6 weeks")
- requiredSkills (skills from techStack that the student ALREADY knows)
- skillGap (skills from techStack the student does NOT know)
- datasets (string array, relevant dataset names if applicable, empty array if not)
- challenges (string array, 2-3 potential challenges)
- needsDataset (boolean — true ONLY if the project genuinely requires an external dataset for training/analysis, false otherwise. A web app or mobile app does NOT need a dataset.)
- category (string — exactly one of: "AI", "Web", "Mobile", "Data Science", "Hardware", "Design", "Other". Pick the best fit based on the project's primary domain.)

Return ONLY valid JSON. No markdown, no explanation, no wrapping.`;

    // f. Call Groq API  (llama-3.3-70b — free & fast)
    const groqRes = await axios.post('https://api.groq.com/openai/v1/chat/completions', {
      model: 'llama-3.3-70b-versatile',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7,
    }, {
      headers: {
        'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
        'Content-Type': 'application/json',
      },
    });

    // g. Extract text from Groq response
    const text = groqRes.data.choices[0].message.content;

    // h. Clean & parse JSON (AI sometimes wraps in ```json ... ```)
    let cleaned = text.trim();
    if (cleaned.startsWith('```')) {
      cleaned = cleaned.replace(/^```json?\n?/, '').replace(/\n?```$/, '');
    }
    const projects = JSON.parse(cleaned);

    // i. Send back to frontend
    res.json({ success: true, projects });

  } catch (error) {
    console.error('AI Ideation error:', error.message);
    res.status(500).json({ success: false, message: 'Failed to generate ideas' });
  }
};