const axios = require('axios');

exports.getGithubRepos = async (req, res) => {
  try {
    const { title, description, techStack } = req.body;

    if (!title) {
      return res.status(400).json({ success: false, message: 'Project title is required' });
    }

    // Prompt sent to Groq AI to generate GitHub search queries
    const keywordPrompt = `
Extract 3 GitHub repository search queries based on this project.
Each query should combine the project topic with relevant tech/language.

Project title: ${title}
Description: ${description || 'N/A'}
Tech stack: ${(techStack || []).join(', ')}

Return ONLY JSON:
{ "queries": ["query1", "query2", "query3"] }
`;

    const groqRes = await axios.post(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        model: "llama-3.3-70b-versatile",
        messages: [{ role: "user", content: keywordPrompt }],
        temperature: 0.3
      },
      {
        headers: {
          "Authorization": `Bearer ${process.env.GROQ_API_KEY}`,
          "Content-Type": "application/json"
        }
      }
    );

    let aiText = groqRes.data.choices[0].message.content.trim();

    // Remove markdown if AI sends ```json block
    if (aiText.startsWith("```")) {
      aiText = aiText
        .replace(/^```json?\n?/, "")
        .replace(/\n?```$/, "");
    }

    const queries = JSON.parse(aiText).queries;

    if (!queries || !Array.isArray(queries) || queries.length === 0) {
      return res.status(500).json({ success: false, message: 'Failed to generate search queries' });
    }

    const seen = new Set();
    const allRepos = [];

    for (const q of queries.slice(0, 3)) {
      try {
        const ghRes = await axios.get(
          "https://api.github.com/search/repositories",
          {
            params: {
              q: q,
              sort: "stars",
              order: "desc",
              per_page: 5
            },
            headers: {
              "Accept": "application/vnd.github+json",
              "User-Agent": "ProjectConnector"
            }
          }
        );

        for (const repo of (ghRes.data.items || []).slice(0, 5)) {
          const fullname = repo.full_name;
          if (!seen.has(fullname)) {
            seen.add(fullname);
            allRepos.push({
              name: repo.name,
              full_name: fullname,
              description: repo.description || "No description",
              html_url: repo.html_url,
              stargazers_count: repo.stargazers_count || 0
            });
          }
        }
      } catch (ghErr) {
        console.error(`GitHub search failed for "${q}":`, ghErr.message);
      }
    }

    res.json({ success: true, queries, repos: allRepos.slice(0, 10) });

  } catch (error) {
    console.error('GitHub search error:', error.message);
    res.status(500).json({ success: false, message: 'Failed to search GitHub repositories' });
  }
};