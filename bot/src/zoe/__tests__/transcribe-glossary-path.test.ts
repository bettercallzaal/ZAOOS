// @vitest-environment node
//
// The one thing transcribe.test.ts structurally cannot check.
//
// That suite mocks `node:fs` in its entirety, so its glossary cases prove the
// JSON is parsed and the corrections applied - they say nothing about WHERE the
// file is read from. The path was `../../../../research/...` from `bot/src/zoe`,
// which resolves above the repository root, so the real glossary was never
// found on any machine and the whole suite stayed green anyway.
//
// This file deliberately does NOT mock fs: it asserts the exported path points
// at a file that actually exists, which is the only assertion that would have
// failed. Keep it in its own file - adding it to the mocked suite would make it
// pass against the mock again.
import { describe, expect, it } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';
import { GLOSSARY_PATH } from '../transcribe';

describe('GLOSSARY_PATH', () => {
  it('resolves to a file that exists on disk', () => {
    expect(existsSync(GLOSSARY_PATH)).toBe(true);
  });

  it('stays inside the repository (a path that escapes it can never resolve)', () => {
    expect(GLOSSARY_PATH.replace(/\\/g, '/')).toContain('/research/reference/');
  });

  it('parses and carries the fields transcribeAudio reads', () => {
    const glossary = JSON.parse(readFileSync(GLOSSARY_PATH, 'utf8')) as {
      whisperPrompt?: string;
      corrections?: Record<string, string>;
    };
    expect(typeof glossary.whisperPrompt).toBe('string');
    expect(glossary.whisperPrompt?.length).toBeGreaterThan(0);
    expect(glossary.corrections && typeof glossary.corrections).toBe('object');
  });
});
