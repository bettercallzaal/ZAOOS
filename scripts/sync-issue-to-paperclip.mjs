import https from 'node:https';
import fs from 'node:fs';

// GitHub Actions provides these via the @actions/github context
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const PAPERCLIP_API_KEY = process.env.PAPERCLIP_API_KEY;
const PAPERCLIP_COMPANY_ID = process.env.PAPERCLIP_COMPANY_ID;
const PAPERCLIP_API_URL = process.env.PAPERCLIP_API_URL || 'https://paperclip.zaoos.com';

// GitHub Actions injects GITHUB_EVENT_PATH which contains the webhook payload
const eventPath = process.env.GITHUB_EVENT_PATH;

let issueData;

if (eventPath) {
  issueData = JSON.parse(fs.readFileSync(eventPath, 'utf8')).issue;
} else {
  console.error('GITHUB_EVENT_PATH not set — cannot get issue data');
  process.exit(1);
}

const issue = issueData;


async function makeRequest(url, method, body, headers = {}) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const options = {
      hostname: urlObj.hostname,
      port: urlObj.port || 443,
      path: urlObj.pathname + urlObj.search,
      method: method,
      headers: {
        'Authorization': `Bearer ${PAPERCLIP_API_KEY}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        ...headers
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch {
          resolve(data);
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

function mapStatus(/* _action */) {
  // action is from GITHUB_EVENT_NAME: issues, pull_request, etc.
  // We care about the issue action type
  if (issue.action === 'opened') return 'in_progress';
  if (issue.action === 'closed') return 'done';
  return null; // no status change for other events
}

async function syncIssue() {
  const issueNumber = issue.number;
  const title = `[GitHub #${issueNumber}] ${issue.title}`;
  const description = `${issue.body || ''}\n\n---\n**Source:** GitHub Issue #${issueNumber}\n**Labels:** ${issue.labels.map(l => l.name).join(', ') || 'none'}\n**Author:** ${issue.user.login}\n**URL:** ${issue.html_url}`;
  const priority = mapPriority(issue.labels);
  const paperclipStatus = mapStatus(issue.action);
  const labelNames = issue.labels.map(l => l.name);

  console.log(`Syncing GitHub Issue #${issueNumber}: ${issue.title}`);
  console.log(`  Action: ${issue.action}`);
  console.log(`  Priority: ${priority}`);
  console.log(`  Paperclip Status: ${paperclipStatus}`);

  try {
    // Try to create the issue
    const result = await makeRequest(
      `${PAPERCLIP_API_URL}/api/companies/${PAPERCLIP_COMPANY_ID}/issues`,
      'POST',
      {
        title,
        description,
        priority,
        status: 'todo',
        labels: labelNames
      }
    );

    if (result && result.id) {
      console.log(`Created Paperclip issue: ${result.identifier} (${result.id})`);
      console.log(`View at: ${PAPERCLIP_API_URL}/THE/dashboard`);

      // Add a comment back to GitHub
      await addGitHubComment(issueNumber, `Synced to Paperclip: ${result.identifier}`);
    } else {
      console.log('Paperclip API response:', result);
    }
  } catch (error) {
    console.error('Error syncing to Paperclip:', error.message);
    process.exit(1);
  }
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

  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          console.log('Added comment to GitHub issue');
          resolve();
        } else {
          console.log('Comment failed:', res.statusCode, data.substring(0, 200));
          resolve(); // Don't fail the whole workflow for a comment
        }
      });
    });
    req.on('error', reject);
    req.write(JSON.stringify({ body }));
    req.end();
  });
}

syncIssue().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
