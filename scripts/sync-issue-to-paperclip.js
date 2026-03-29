const https = require('https');

const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const PAPERCLIP_API_KEY = process.env.PAPERCLIP_API_KEY;
const PAPERCLIP_COMPANY_ID = process.env.PAPERCLIP_COMPANY_ID;
const PAPERCLIP_API_URL = process.env.PAPERCLIP_API_URL;

async function makeRequest(url, method, body, headers) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const options = {
      hostname: urlObj.hostname,
      port: urlObj.port || 443,
      path: urlObj.pathname + urlObj.search,
      method,
      headers: {
        'Content-Type': 'application/json',
        ...headers,
      },
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(data) });
        } catch {
          resolve({ status: res.statusCode, data });
        }
      });
    });

    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

function mapPriority(labels) {
  const priorityLabels = ['critical', 'high', 'medium', 'low'];
  for (const label of labels) {
    if (priorityLabels.includes(label.name.toLowerCase())) {
      return label.name.toLowerCase();
    }
  }
  return 'medium';
}

function mapLabels(labels) {
  return labels.map((l) => l.name);
}

async function createOrUpdatePaperclipIssue(issue) {
  const payload = {
    companyId: PAPERCLIP_COMPANY_ID,
    title: issue.title,
    description: issue.body || '',
    priority: mapPriority(issue.labels || []),
    labels: mapLabels(issue.labels || []),
  };

  const response = await makeRequest(
    `${PAPERCLIP_API_URL}/api/issues`,
    'POST',
    payload,
    { Authorization: `Bearer ${PAPERCLIP_API_KEY}` }
  );

  return response;
}

async function addCommentToGitHubIssue(issueNumber, body) {
  const response = await makeRequest(
    `https://api.github.com/repos/${process.env.GITHUB_REPOSITORY}/issues/${issueNumber}/comments`,
    'POST',
    { body },
    { Authorization: `token ${GITHUB_TOKEN}`, Accept: 'application/vnd.github.v3+json' }
  );

  return response;
}

async function main() {
  const issue = process.env.GITHUB_CONTEXT
    ? JSON.parse(process.env.GITHUB_CONTEXT).payload?.issue
    : require('./github.context.json')?.payload?.issue;

  if (!issue) {
    console.log('No issue data found in payload');
    process.exit(0);
  }

  console.log(`Processing issue #${issue.number}: ${issue.title}`);

  try {
    const pcResponse = await createOrUpdatePaperclipIssue(issue);
    console.log('Paperclip response:', JSON.stringify(pcResponse.data, null, 2));

    if (pcResponse.data?.id) {
      const comment = `📋 Synced to Paperclip: [View Issue](${PAPERCLIP_API_URL}/issues/${pcResponse.data.id})`;
      await addCommentToGitHubIssue(issue.number, comment);
      console.log('Added Paperclip link comment to GitHub issue');
    }
  } catch (error) {
    console.error('Error syncing to Paperclip:', error.message);
    process.exit(1);
  }
}

main();
