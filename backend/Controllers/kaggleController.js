const axios = require('axios');

// Function: Search datasets from Kaggle
exports.searchDatasets = async (req, res) => {
  try {

    // Get project details from request
    const { title, description, techStack } = req.body;

    // Title is mandatory
    if (!title) {
      return res.status(400).json({
        success: false,
        message: 'Project title is required'
      });
    }

    // Get Kaggle API credentials from .env
    const kaggleUser = process.env.KAGGLE_USERNAME;
    const kaggleKey = process.env.KAGGLE_KEY;

    // If credentials are missing
    if (!kaggleUser || !kaggleKey) {
      return res.status(503).json({
        success: false,
        message: 'Kaggle API not configured. Add KAGGLE_USERNAME and KAGGLE_KEY to .env'
      });
    }

    // Prompt sent to Groq AI to generate Kaggle search keywords
    const keywordPrompt = `
Extract 3 dataset search keywords for Kaggle based on this project.

Project title: ${title}
Description: ${description || 'N/A'}
Tech stack: ${(techStack || []).join(', ')}

Return ONLY JSON:
{ "keywords": ["keyword1", "keyword2", "keyword3"] }
`;

    // Call Groq AI
    const groqRes = await axios.post(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        model: "llama-3.3-70b-versatile",
        messages: [{ role: "user", content: keywordPrompt }],
        temperature: 0.3
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
          "Content-Type": "application/json"
        }
      }
    );

    // Get AI response text
    let aiText = groqRes.data.choices[0].message.content.trim();

    // Remove markdown if AI sends ```json block
    if (aiText.startsWith("```")) {
      aiText = aiText
        .replace(/^```json?\n?/, "")
        .replace(/\n?```$/, "");
    }

    // Convert text to JSON
    const { keywords } = JSON.parse(aiText);

    // Validate keywords
    if (!keywords || !Array.isArray(keywords) || keywords.length === 0) {
      return res.status(500).json({
        success: false,
        message: "AI failed to extract keywords"
      });
    }

    // Create Kaggle authentication header
    const kaggleAuth = Buffer
      .from(`${kaggleUser}:${kaggleKey}`)
      .toString("base64");

    const seen = new Set();     // to remove duplicate datasets
    const allDatasets = [];     // final dataset list

    // Search Kaggle for each keyword
    for (const kw of keywords.slice(0, 3)) {
      try {

        const kaggleRes = await axios.get(
          "https://www.kaggle.com/api/v1/datasets/list",
          {
            params: {
              search: kw,
              sortBy: "relevance"
            },
            headers: {
              Authorization: `Basic ${kaggleAuth}`
            }
          }
        );

        // Take top 5 results for each keyword
        for (const ds of (kaggleRes.data || []).slice(0, 5)) {

          const ref = ds.ref;   // unique dataset id

          // Avoid duplicates
          if (!seen.has(ref)) {

            seen.add(ref);

            allDatasets.push({
              name: ds.title,
              url: `https://www.kaggle.com/datasets/${ref}`,
              size: formatSize(ds.totalBytes),
              downloads: ds.downloadCount || 0,
              lastUpdated: ds.lastUpdated || "",
              keyword: kw
            });
          }
        }

      } catch (kaggleErr) {
        console.error(
          `Kaggle search failed for "${kw}":`,
          kaggleErr.message
        );
      }
    }

    // Return final response
    res.json({
      success: true,
      keywords,
      datasets: allDatasets.slice(0, 10)
    });

  } catch (error) {

    console.error("Kaggle search error:", error.message);

    res.status(500).json({
      success: false,
      message: "Failed to search datasets"
    });
  }
};


// Helper function to convert bytes to readable format
function formatSize(bytes) {

  if (!bytes || bytes === 0) return "Unknown";

  const units = ["B", "KB", "MB", "GB"];

  let i = 0;
  let size = bytes;

  while (size >= 1024 && i < units.length - 1) {
    size = size / 1024;
    i++;
  }

  return `${size.toFixed(1)} ${units[i]}`;
}