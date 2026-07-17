// @vitest-environment node
import { describe, expect, it } from 'vitest';
import {
  SONGJAM_IFRAME_ALLOW,
  SONGJAM_IFRAME_SANDBOX,
  SONGJAM_SPACE_DESCRIPTION,
  SONGJAM_SPACE_LABEL,
  SONGJAM_SPACE_URL,
} from '../songjam';

// ---------------------------------------------------------------------------
// SONGJAM_SPACE_URL
// ---------------------------------------------------------------------------

describe('SONGJAM_SPACE_URL', () => {
  it('is the exact www.songjam.space/zabal URL', () => {
    expect(SONGJAM_SPACE_URL).toBe('https://www.songjam.space/zabal');
  });

  it('uses the www subdomain (required by Permissions-Policy exact-match)', () => {
    expect(SONGJAM_SPACE_URL).toContain('www.songjam.space');
  });

  it('targets the /zabal community path', () => {
    expect(SONGJAM_SPACE_URL).toContain('/zabal');
  });
});

// ---------------------------------------------------------------------------
// SONGJAM_SPACE_LABEL
// ---------------------------------------------------------------------------

describe('SONGJAM_SPACE_LABEL', () => {
  it('is "ZABAL Live"', () => {
    expect(SONGJAM_SPACE_LABEL).toBe('ZABAL Live');
  });
});

// ---------------------------------------------------------------------------
// SONGJAM_SPACE_DESCRIPTION
// ---------------------------------------------------------------------------

describe('SONGJAM_SPACE_DESCRIPTION', () => {
  it('is a non-empty string', () => {
    expect(typeof SONGJAM_SPACE_DESCRIPTION).toBe('string');
    expect(SONGJAM_SPACE_DESCRIPTION.length).toBeGreaterThan(0);
  });

  it('mentions Songjam', () => {
    expect(SONGJAM_SPACE_DESCRIPTION.toLowerCase()).toContain('songjam');
  });
});

// ---------------------------------------------------------------------------
// SONGJAM_IFRAME_ALLOW
// ---------------------------------------------------------------------------

describe('SONGJAM_IFRAME_ALLOW', () => {
  it('includes microphone permission', () => {
    expect(SONGJAM_IFRAME_ALLOW).toContain('microphone');
  });

  it('includes camera permission', () => {
    expect(SONGJAM_IFRAME_ALLOW).toContain('camera');
  });

  it('includes autoplay permission', () => {
    expect(SONGJAM_IFRAME_ALLOW).toContain('autoplay');
  });

  it('includes fullscreen permission', () => {
    expect(SONGJAM_IFRAME_ALLOW).toContain('fullscreen');
  });

  it('includes clipboard-write permission', () => {
    expect(SONGJAM_IFRAME_ALLOW).toContain('clipboard-write');
  });
});

// ---------------------------------------------------------------------------
// SONGJAM_IFRAME_SANDBOX
// ---------------------------------------------------------------------------

describe('SONGJAM_IFRAME_SANDBOX', () => {
  it('includes allow-scripts', () => {
    expect(SONGJAM_IFRAME_SANDBOX).toContain('allow-scripts');
  });

  it('includes allow-same-origin', () => {
    expect(SONGJAM_IFRAME_SANDBOX).toContain('allow-same-origin');
  });

  it('includes allow-popups', () => {
    expect(SONGJAM_IFRAME_SANDBOX).toContain('allow-popups');
  });

  it('includes allow-forms', () => {
    expect(SONGJAM_IFRAME_SANDBOX).toContain('allow-forms');
  });

  it('includes allow-top-navigation-by-user-activation', () => {
    expect(SONGJAM_IFRAME_SANDBOX).toContain('allow-top-navigation-by-user-activation');
  });
});
