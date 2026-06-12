import type { Report, CheckResult } from '../types';

const STICKY_MARKER = '<!-- estate-control-plane -->';

const statusEmoji: Record<string, string> = { ok: 'OK', warn: 'WARN', fail: 'FAIL', skipped: 'SKIP' };

function scoreColor(score: number): string {
  if (score >= 85) return '#3ECF8E';
  if (score >= 50) return '#f5a623';
  return '#ff5c5c';
}

/** Self-contained dark-theme dashboard. No external assets. */
export function renderDashboardHtml(report: Report): string {
  const color = scoreColor(report.healthScore);
  const checkCards = report.checks
    .map((c) => {
      const findings = c.findings
        .map(
          (f) =>
            `<li class="f-${f.severity}"><b>[${f.severity}]</b> ${esc(f.title)}${f.detail ? ` <span class="muted">- ${esc(f.detail)}</span>` : ''}</li>`,
        )
        .join('');
      return `<div class="card">
        <div class="card-h"><span class="badge b-${c.status}">${statusEmoji[c.status]}</span> ${esc(c.id)}${c.note ? `<span class="muted"> - ${esc(c.note)}</span>` : ''}</div>
        ${findings ? `<ul>${findings}</ul>` : '<div class="muted">clean</div>'}
      </div>`;
    })
    .join('');

  return `<!doctype html><html lang="en"><head><meta charset="utf-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1"/>
<title>ZAO Estate Health</title>
<style>
  :root { color-scheme: dark; }
  body { background:#0a1628; color:#e8eef7; font:15px/1.5 -apple-system,system-ui,sans-serif; margin:0; padding:24px; }
  .wrap { max-width:880px; margin:0 auto; }
  h1 { font-size:20px; margin:0 0 4px; }
  .muted { color:#7e8aa0; }
  .score { font-size:64px; font-weight:700; color:${color}; line-height:1; margin:8px 0; }
  .meta { color:#7e8aa0; font-size:13px; margin-bottom:20px; }
  .card { background:#0f1f38; border:1px solid #1c3157; border-radius:10px; padding:14px 16px; margin:12px 0; }
  .card-h { font-weight:600; margin-bottom:6px; }
  ul { margin:8px 0 0; padding-left:18px; }
  li { margin:3px 0; }
  .f-fail { color:#ff8c8c; } .f-warn { color:#ffd27a; } .f-info { color:#9fb3d0; }
  .badge { font-size:11px; font-weight:700; padding:2px 7px; border-radius:5px; margin-right:6px; }
  .b-ok { background:#10351f; color:#3ECF8E; } .b-warn { background:#3a2e0e; color:#f5a623; }
  .b-fail { background:#3a1414; color:#ff5c5c; } .b-skipped { background:#1c2538; color:#7e8aa0; }
</style></head>
<body><div class="wrap">
  <h1>ZAO Estate Health <span class="muted">/ ${esc(report.repo.split('/').pop() ?? '')}</span></h1>
  <div class="score">${report.healthScore}<span style="font-size:24px;color:#7e8aa0">/100</span></div>
  <div class="meta">${report.summary.fail} fails &middot; ${report.summary.warn} warns &middot; ${report.summary.fixable} auto-fixable &middot; generated ${esc(report.generatedAt)}</div>
  ${checkCards}
  <p class="muted" style="margin-top:24px;font-size:12px">ZAO Estate Control Plane &middot; propose-don't-act &middot; tools/estate-control-plane</p>
</div></body></html>`;
}

/** Short plain-text digest for Telegram. Change-only gating is the caller's job. */
export function renderDigest(report: Report): string {
  const lines = [
    `ZAO Estate Health: ${report.healthScore}/100`,
    `${report.summary.fail} fails, ${report.summary.warn} warns, ${report.summary.fixable} auto-fixable`,
    '',
  ];
  for (const c of report.checks) {
    if (c.status === 'ok') continue;
    lines.push(`[${statusEmoji[c.status]}] ${c.id}`);
    for (const f of c.findings.slice(0, 4)) lines.push(`  - ${f.title}`);
  }
  return lines.join('\n').trim();
}

/** Sticky markdown PR comment (the marker lets the Action update in place). */
export function renderPrComment(report: Report, baselineFails?: number): string {
  const rows = report.checks
    .map((c) => `| ${statusEmoji[c.status]} | \`${c.id}\` | ${c.findings.length} |`)
    .join('\n');
  const ratchet =
    baselineFails != null
      ? report.summary.fail > baselineFails
        ? `**Ratchet: BLOCKED** - fails rose ${baselineFails} -> ${report.summary.fail}. Resolve the new failure(s) below.`
        : `**Ratchet: ok** - no new failures vs base (${baselineFails}).`
      : '';
  const findingLines = report.checks
    .flatMap((c) => c.findings.filter((f) => f.severity === 'fail'))
    .map((f) => `- **${f.title}**${f.detail ? ` - ${f.detail}` : ''}${f.fixable ? ' _(auto-fixable)_' : ''}`)
    .join('\n');

  return `${STICKY_MARKER}
## ZAO Estate Health: ${report.healthScore}/100

${ratchet}

| | check | findings |
|---|---|---|
${rows}

${findingLines ? `### Failures\n${findingLines}` : '_No failures._'}

<sub>ZAO Estate Control Plane - propose-don't-act. ${report.summary.fixable} auto-fixable.</sub>`;
}

export const STICKY = STICKY_MARKER;

function esc(s: string): string {
  return s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c] ?? c);
}
