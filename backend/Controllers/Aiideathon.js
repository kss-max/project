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

    // d. Extract ALL useful profile data safely
    const skills = user.skills || {};
    const allSkills = [
      ...(skills.programmingLanguages || []),
      ...(skills.webDevelopment || []),
      ...(skills.mobileDevelopment || []),
      ...(skills.aiMl || []),
      ...(skills.databases || []),
      ...(skills.tools || []),
    ];

    const interests = user.interests || [];
    const experienceLevel = user.experienceLevel || 'Not specified';
    const department = user.department || 'Not specified';
    const yearOfStudy = user.yearOfStudy || 'Not specified';
    const achievements = (user.achievements || []).map((a) => a?.title).filter(Boolean);

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

    // f. Call Groq API with automatic fallback models
    const candidateModels = [
      process.env.GROQ_MODEL || 'openai/gpt-oss-20b',
      'openai/gpt-oss-120b',
      'qwen/qwen3.8-27b'
    ];
    const modelsToTry = [...new Set(candidateModels)];

    let groqRes;
    let lastError;
    for (const model of modelsToTry) {
      try {
        groqRes = await axios.post('https://api.groq.com/openai/v1/chat/completions', {
          model,
          messages: [{ role: 'user', content: prompt }],
          temperature: 0.7,
        }, {
          headers: {
            'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
            'Content-Type': 'application/json',
          },
          timeout: 45000,
        });

        if (groqRes?.data?.choices?.[0]?.message?.content) {
          break;
        }
      } catch (err) {
        lastError = err;
        console.warn(`Groq model ${model} failed:`, err.response?.data?.error?.message || err.message);
      }
    }

    if (!groqRes) {
      throw lastError || new Error('All Groq candidate models failed to respond');
    }

    // g. Extract text from Groq response
    const text = groqRes.data.choices[0].message.content;

    // h. Clean & parse JSON (extract JSON array even if model wraps in markdown or text)
    let cleaned = text.trim();
    const jsonMatch = cleaned.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      cleaned = jsonMatch[0];
    } else if (cleaned.startsWith('```')) {
      cleaned = cleaned.replace(/^```json?\s*/i, '').replace(/\s*```$/i, '').trim();
    }

    let rawProjects;
    try {
      rawProjects = JSON.parse(cleaned);
    } catch (parseErr) {
      console.error('AI Ideation JSON parse error. Raw text:', text);
      return res.status(500).json({ success: false, message: 'AI returned invalid JSON. Please try again.' });
    }

    // Sanitize array items to ensure frontend safety
    const projects = (Array.isArray(rawProjects) ? rawProjects : [rawProjects]).map(p => ({
      title: p?.title || 'Untitled Project',
      description: p?.description || '',
      techStack: Array.isArray(p?.techStack) ? p.techStack : (typeof p?.techStack === 'string' ? p.techStack.split(',').map(s => s.trim()) : []),
      difficulty: (p?.difficulty || 'medium').toLowerCase(),
      estimatedDuration: p?.estimatedDuration || '4-6 weeks',
      requiredSkills: Array.isArray(p?.requiredSkills) ? p.requiredSkills : [],
      skillGap: Array.isArray(p?.skillGap) ? p.skillGap : [],
      datasets: Array.isArray(p?.datasets) ? p.datasets : [],
      challenges: Array.isArray(p?.challenges) ? p.challenges : [],
      needsDataset: Boolean(p?.needsDataset),
      category: p?.category || 'Other'
    }));

    // i. Send back to frontend
    res.json({ success: true, projects });

  } catch (error) {
    // Log full Axios error details so we can debug API failures
    if (error.response) {
      console.error('AI Ideation Axios error:', error.response.status, JSON.stringify(error.response.data));
    } else {
      console.error('AI Ideation error:', error.message);
    }
    const message =
      error.response?.data?.error?.message ||
      error.response?.data?.message ||
      error.message ||
      'Failed to generate ideas';
    res.status(500).json({ success: false, message });
  }
};