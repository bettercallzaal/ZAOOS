import { test } from 'vitest';
import assert from 'node:assert/strict';
import {
  classifyBucket,
  connectToProject,
  suggestNextStep,
  buildTriageSummary,
  triageMessage,
} from '../inbox-triage';

test('classifyBucket: BUILD for feature/implement/ship keywords', () => {
  const msg = { subject: 'new feature: implement dark mode', snippet: 'let\'s build this' };
  const bucket = classifyBucket(msg, 'subject + snippet');
  assert.equal(bucket, 'BUILD');
});

test('classifyBucket: ACT-NOW for deadline/urgent keywords', () => {
  const msg = { subject: 'response needed ASAP', snippet: 'urgent meeting confirm' };
  const bucket = classifyBucket(msg, 'subject + snippet');
  assert.equal(bucket, 'ACT-NOW');
});

test('classifyBucket: RESEARCH for investigate/explore keywords', () => {
  const msg = { subject: 'deep dive into music tokenomics', snippet: 'worth researching' };
  const bucket = classifyBucket(msg, 'subject + snippet');
  assert.equal(bucket, 'RESEARCH');
});

test('classifyBucket: REFERENCE for link/article/fyi keywords', () => {
  const msg = { subject: 'FYI article on solana scaling', snippet: 'reference: https://...' };
  const bucket = classifyBucket(msg, 'subject + snippet');
  assert.equal(bucket, 'REFERENCE');
});

test('classifyBucket: SOMEDAY by default', () => {
  const msg = { subject: 'random idea about music', snippet: 'just a thought' };
  const bucket = classifyBucket(msg, 'subject + snippet');
  assert.equal(bucket, 'SOMEDAY');
});

test('connectToProject: matches WaveWarZ', () => {
  const msg = { subject: 'WaveWarZ launch planning', snippet: 'solana mainnet' };
  const project = connectToProject(msg, 'waveWarz planning');
  assert.equal(project, 'WaveWarZ');
});

test('connectToProject: matches ZABAL Games', () => {
  const msg = { subject: 'ZABAL Games mentors', snippet: 'workshop update' };
  const project = connectToProject(msg, 'zabal games workshop');
  assert.equal(project, 'ZABAL Games');
});

test('connectToProject: returns undefined for non-matching', () => {
  const msg = { subject: 'random thought', snippet: 'no zao context' };
  const project = connectToProject(msg, 'random thought');
  assert.equal(project, undefined);
});

test('suggestNextStep: none for REFERENCE bucket', () => {
  const msg = { from: 'john@example.com', subject: 'article' };
  const step = suggestNextStep('REFERENCE', msg);
  assert.equal(step, undefined);
});

test('suggestNextStep: action for BUILD bucket', () => {
  const msg = { from: 'jane@example.com', subject: 'feature idea' };
  const step = suggestNextStep('BUILD', msg, 'The ZAO');
  assert.ok(step?.includes('research doc'));
});

test('suggestNextStep: reply action for ACT-NOW bucket', () => {
  const msg = { from: 'alice@example.com', subject: 'confirm time' };
  const step = suggestNextStep('ACT-NOW', msg);
  assert.ok(step?.includes('Reply'));
});

test('buildTriageSummary: abbreviates long summaries', () => {
  const longSum = 'x'.repeat(250);
  const abbrev = buildTriageSummary({ subject: 'test' }, longSum);
  assert.ok(abbrev.length <= 200, 'abbreviated to ~200 chars');
  assert.ok(abbrev.endsWith('...'), 'ends with ellipsis');
});

test('triageMessage: returns complete triage record', () => {
  const msg = {
    id: 'msg-123',
    from: 'alice@example.com',
    subject: 'let\'s build a feature for ZAOstock',
    snippet: 'i have an idea',
  };
  const triage = triageMessage(msg, 'alice — let\'s build a feature for ZAOstock — i have an idea');
  assert.equal(triage.bucket, 'BUILD');
  assert.equal(triage.connected_project, 'ZAOstock');
  assert.ok(triage.next_step?.includes('research doc'));
  assert.ok(triage.summary.length > 0);
});
