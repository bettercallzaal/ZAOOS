const https = require('https');
const fs = require('fs');

// GitHub Actions provides these via the @actions/github context
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const PAPERCLIP_API_KEY = process.env.PAPERCLIP_API_KEY;
const PAPERCLIP_COMPANY_ID = process.env.PAPERCLIP_COMPANY_ID;
const PAPERCLIP_API_URL = process.env.PAPERCLIP_API_URL || 'https://paperclip.zaoos.com';

// GitHub Actions injects GITHUB_EVENT_PATH which contains the webhook payload
const eventPath = process.env.GITHUB_EVENT_PATH;

if (!eventPath) {
  console.error('GITHUB_EVENT_PATH not set — cannot get issue data');
  process.exit(1);
}

const event = JSON.parse(fs.readFileSync(eventPath, 'utf8'));
const issue = event.issue;
const action = event.action; // "opened", "closed", "labeled", "reopened", etc.

async function makeRequest(url, method, body) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const options = {
      hostname: urlObj.hostname,
      port: urlObj.port || 443,
      path: urlObj.pathname + urlObj.search,
      method,
      headers: {
        'Authorization': `Bearer ${PAPERCLIP_API_KEY}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, body: JSON.parse(data) });
        } catch {
          resolve({ status: res.statusCode, body: data });
        }
      });
    });

    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

function mapPriority(labels) {
  const labelNames = labels.map(l => l.name.toLowerCase());
  if (labelNames.includes('critical')) return 'critical';
  if (labelNames.includes('high') || labelNames.includes('priority:high')) return 'high';
  if (labelNames.includes('medium') || labelNames.includes('priority:medium')) return 'medium';
  if (labelNames.includes('low') || labelNames.includes('priority:low')) return 'low';
  return 'medium';
}

function buildDescription(issue) {
  return `${issue.body || ''}\n\n---\n**Source:** GitHub Issue #${issue.number}\n**Labels:** ${issue.labels.map(l => l.name).join(', ') || 'none'}\n**Author:** ${issue.user.login}\n**URL:** ${issue.html_url}`;
}

async function findPaperclipIssue(githubNumber) {
  // Search Paperclip issues for one whose title contains "[GitHub #XX]"
  const searchTitle = `[GitHub #${githubNumber}]`;
  const url = `${PAPERCLIP_API_URL}/api/companies/${PAPERCLIP_COMPANY_ID}/issues?q=${encodeURIComponent(searchTitle)}`;
  const result = await makeRequest(url, 'GET');

  if (result.status !== 200 || !Array.isArray(result.body)) {
    // Fallback: list all non-done issues and filter manually
    const fallbackUrl = `${PAPERCLIP_API_URL}/api/companies/${PAPERCLIP_COMPANY_ID}/issues?status=todo,in_progress,blocked,backlog`;
    const fallback = await makeRequest(fallbackUrl, 'GET');
    if (fallback.status === 200 && Array.isArray(fallback.body)) {
      return fallback.body.find(i => i.title.includes(searchTitle));
    }
    return null;
  }

  return result.body.find(i => i.title.includes(searchTitle));
}

async function addGitHubComment(issueNumber, body) {
  const url = `https://api.github.com/repos/bettercallzaal/ZAOOS/issues/${issueNumber}/comments`;
  const urlObj = new URL(url);
  const options = {
    hostname: urlObj.hostname,
    port: 443,
    path: urlObj.pathname,
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${GITHUB_TOKEN}`,
      'Content-Type': 'application/json',
      'Accept': 'application/vnd.github+json',
      'User-Agent': 'ZAO-Orchestrator-GitHubAction/1.0',
      'X-GitHub-Api-Version': '2022-11-28'
    }
  };

  return new Promise((resolve) => {
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          console.log('Added comment to GitHub issue');
        } else {
          console.log('Comment failed:', res.statusCode, data.substring(0, 200));
        }
        resolve(); // Don't fail the whole workflow for a comment
      });
    });
    req.on('error', () => resolve());
    req.write(JSON.stringify({ body }));
    req.end();
  });
}

async function syncIssue() {
  const issueNumber = issue.number;
  const title = `[GitHub #${issueNumber}] ${issue.title}`;
  const description = buildDescription(issue);
  const priority = mapPriority(issue.labels);
  const labelNames = issue.labels.map(l => l.name);

  console.log(`Syncing GitHub Issue #${issueNumber}: ${issue.title}`);
  console.log(`  Action: ${action}`);
  console.log(`  Priority: ${priority}`);

  if (action === 'closed') {
    // Find existing Paperclip issue and close it
    console.log(`  Looking up Paperclip issue for GitHub #${issueNumber}...`);
    const existing = await findPaperclipIssue(issueNumber);

    if (existing) {
      console.log(`  Found ${existing.identifier} (${existing.id}) — closing...`);
      const result = await makeRequest(
        `${PAPERCLIP_API_URL}/api/issues/${existing.id}`,
        'PATCH',
        { status: 'done', comment: `Closed via GitHub issue #${issueNumber} close event.` }
      );
      if (result.status === 200) {
        console.log(`  Closed ${existing.identifier}`);
        await addGitHubComment(issueNumber, `Paperclip issue ${existing.identifier} closed.`);
      } else {
        console.log(`  Failed to close: HTTP ${result.status}`, result.body);
      }
    } else {
      console.log(`  No matching Paperclip issue found for GitHub #${issueNumber} — nothing to close.`);
    }
    return;
  }

  if (action === 'opened' || action === 'reopened') {
    // Create new Paperclip issue
    const result = await makeRequest(
      `${PAPERCLIP_API_URL}/api/companies/${PAPERCLIP_COMPANY_ID}/issues`,
      'POST',
      { title, description, priority, status: 'todo', labels: labelNames }
    );

    if (result.status >= 200 && result.status < 300 && result.body && result.body.id) {
      console.log(`Created Paperclip issue: ${result.body.identifier} (${result.body.id})`);
      await addGitHubComment(issueNumber, `Synced to Paperclip: ${result.body.identifier}`);
    } else {
      console.log('Paperclip API response:', result.status, result.body);
    }
    return;
  }

  if (action === 'labeled') {
    // Update priority on existing Paperclip issue if it exists
    const existing = await findPaperclipIssue(issueNumber);
    if (existing) {
      console.log(`  Found ${existing.identifier} — updating priority to ${priority}...`);
      const result = await makeRequest(
        `${PAPERCLIP_API_URL}/api/issues/${existing.id}`,
        'PATCH',
        { priority }
      );
      if (result.status === 200) {
        console.log(`  Updated ${existing.identifier} priority to ${priority}`);
      } else {
        console.log(`  Failed to update: HTTP ${result.status}`, result.body);
      }
    } else {
      console.log(`  No matching Paperclip issue for GitHub #${issueNumber} — skipping label update.`);
    }
    return;
  }

  console.log(`  Unhandled action "${action}" — skipping.`);
}

syncIssue().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
