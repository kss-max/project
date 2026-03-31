const axios = require('axios');
const Project = require('../Models/Project');

// ─── Helper: parse owner/repo from GitHub URL ────────────
function parseGithubUrl(url) {
    // Supports: https://github.com/owner/repo or https://github.com/owner/repo.git
    const match = url.match(/github\.com\/([^/]+)\/([^/.]+)/);
    if (!match) return null;
    return { owner: match[1], repo: match[2] };
}

// GitHub API base headers (unauthenticated = 60 req/hr, with token = 5000 req/hr)
function getHeaders() {
    const headers = { 'Accept': 'application/vnd.github.v3+json' };
    if (process.env.GITHUB_TOKEN) {
        headers['Authorization'] = `token ${process.env.GITHUB_TOKEN}`;
    }
    return headers;
}

// ─── GET BRANCHES ────────────────────────────────────────
exports.getBranches = async (req, res) => {
    try {
        const project = await Project.findById(req.params.projectId);
        if (!project || !project.githubRepo) {
            return res.status(400).json({ success: false, message: 'No GitHub repo linked' });
        }

        const parsed = parseGithubUrl(project.githubRepo);
        if (!parsed) {
            return res.status(400).json({ success: false, message: 'Invalid GitHub URL' });
        }

        const { data } = await axios.get(
            `https://api.github.com/repos/${parsed.owner}/${parsed.repo}/branches`,
            { headers: getHeaders() }
        );

        const branches = data.map(b => ({
            name: b.name,
            lastCommitSha: b.commit.sha,
            protected: b.protected,
        }));

        res.json({ success: true, branches });
    } catch (error) {
        const msg = error.response?.data?.message || error.message;
        res.status(500).json({ success: false, message: `GitHub API error: ${msg}` });
    }
};

// ─── GET RECENT COMMITS ──────────────────────────────────
exports.getCommits = async (req, res) => {
    try {
        const project = await Project.findById(req.params.projectId);
        if (!project || !project.githubRepo) {
            return res.status(400).json({ success: false, message: 'No GitHub repo linked' });
        }

        const parsed = parseGithubUrl(project.githubRepo);
        if (!parsed) {
            return res.status(400).json({ success: false, message: 'Invalid GitHub URL' });
        }

        const { data } = await axios.get(
            `https://api.github.com/repos/${parsed.owner}/${parsed.repo}/commits?per_page=15`,
            { headers: getHeaders() }
        );

        const commits = data.map(c => ({
            sha: c.sha.substring(0, 7),
            message: c.commit.message,
            author: c.commit.author.name,
            date: c.commit.author.date,
            avatarUrl: c.author?.avatar_url || '',
            url: c.html_url,
        }));

        res.json({ success: true, commits });
    } catch (error) {
        const msg = error.response?.data?.message || error.message;
        res.status(500).json({ success: false, message: `GitHub API error: ${msg}` });
    }
};

// ─── GET PULL REQUESTS ───────────────────────────────────
exports.getPullRequests = async (req, res) => {
    try {
        const project = await Project.findById(req.params.projectId);
        if (!project || !project.githubRepo) {
            return res.status(400).json({ success: false, message: 'No GitHub repo linked' });
        }

        const parsed = parseGithubUrl(project.githubRepo);
        if (!parsed) {
            return res.status(400).json({ success: false, message: 'Invalid GitHub URL' });
        }

        const { data } = await axios.get(
            `https://api.github.com/repos/${parsed.owner}/${parsed.repo}/pulls?state=all&per_page=10`,
            { headers: getHeaders() }
        );

        const pulls = data.map(pr => ({
            number: pr.number,
            title: pr.title,
            state: pr.state,       // 'open' or 'closed'
            merged: pr.merged_at !== null,
            author: pr.user.login,
            avatarUrl: pr.user.avatar_url,
            createdAt: pr.created_at,
            url: pr.html_url,
        }));

        res.json({ success: true, pulls });
    } catch (error) {
        const msg = error.response?.data?.message || error.message;
        res.status(500).json({ success: false, message: `GitHub API error: ${msg}` });
    }
};
