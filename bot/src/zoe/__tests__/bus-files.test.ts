import { afterEach, describe, expect, it, vi } from 'vitest';
import { uploadFileToBus, hashFile } from '../bus-upload';
import { verifyReceipt, ackReceipt, type DreamNetReceipt } from '../bus-receipt';

// Mock fetch and readFile globally so both modules can use them.
const { fetchMock, readFileMock } = vi.hoisted(() => ({
  fetchMock: vi.fn(),
  readFileMock: vi.fn(),
}));

vi.stubGlobal('fetch', fetchMock);

describe('uploadFileToBus', () => {
  afterEach(() => {
    fetchMock.mockReset();
    readFileMock.mockReset();
  });

  it('uploads a file successfully and returns fileId + sha256', async () => {
    const testBytes = Buffer.from('test file content');
    readFileMock.mockResolvedValue(testBytes);

    fetchMock.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ id: 'file-abc123def456' }),
    });

    const result = await uploadFileToBus(
      '/tmp/test.sol',
      'test.sol',
      { url: 'https://bus.test', token: 'token123' },
      readFileMock,
      fetchMock,
    );

    expect(result.ok).toBe(true);
    expect(result.fileId).toBe('file-abc123def456');
    expect(result.sha256).toBeDefined();
    expect(result.sha256).toHaveLength(64); // sha256 hex is 64 chars
    expect(result.reply).toContain('test.sol');
    expect(result.reply).toContain('file-abc'); // first 8 chars of ID in reply
  });

  it('computes the same sha256 locally as the module returns', async () => {
    const testBytes = Buffer.from('deterministic test content');
    readFileMock.mockResolvedValue(testBytes);

    fetchMock.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ id: 'file-123' }),
    });

    const uploadResult = await uploadFileToBus(
      '/tmp/test.sol',
      'test.sol',
      { url: 'https://bus.test', token: 'token123' },
      readFileMock,
      fetchMock,
    );

    // Compute locally what we expect
    const expectedHash = await hashFile('/tmp/test.sol', readFileMock);

    expect(uploadResult.sha256).toBe(expectedHash);
  });

  it('returns CANNOT_UPLOAD when filename is empty', async () => {
    const result = await uploadFileToBus(
      '/tmp/test.sol',
      '',
      { url: 'https://bus.test', token: 'token123' },
      readFileMock,
      fetchMock,
    );

    expect(result.ok).toBe(false);
    expect(result.reason).toBe('empty_filename');
    expect(result.reply).toContain('Filename cannot be empty');
  });

  it('returns unconfigured message when BUS_URL is not set', async () => {
    const result = await uploadFileToBus(
      '/tmp/test.sol',
      'test.sol',
      { url: '', token: 'token123' },
      readFileMock,
      fetchMock,
    );

    expect(result.ok).toBe(false);
    expect(result.reason).toBe('unconfigured');
    expect(result.reply).toContain('BUS_URL and BUS_TOKEN are not set');
    expect(result.reply).toContain('test.sol');
  });

  it('returns unconfigured message when BUS_TOKEN is not set', async () => {
    const result = await uploadFileToBus(
      '/tmp/test.sol',
      'test.sol',
      { url: 'https://bus.test', token: '' },
      readFileMock,
      fetchMock,
    );

    expect(result.ok).toBe(false);
    expect(result.reason).toBe('unconfigured');
    expect(result.reply).toContain('BUS_URL and BUS_TOKEN are not set');
  });

  it('rejects upload with HTTP error status', async () => {
    readFileMock.mockResolvedValue(Buffer.from('test'));

    fetchMock.mockResolvedValue({
      ok: false,
      status: 403,
    });

    const result = await uploadFileToBus(
      '/tmp/test.sol',
      'test.sol',
      { url: 'https://bus.test', token: 'token123' },
      readFileMock,
      fetchMock,
    );

    expect(result.ok).toBe(false);
    expect(result.reason).toBe('http 403');
    expect(result.reply).toContain('Bus rejected');
    expect(result.reply).toContain('403');
  });

  it('handles timeout gracefully', async () => {
    readFileMock.mockResolvedValue(Buffer.from('test'));

    const abortErr = new Error('Aborted');
    (abortErr as any).name = 'AbortError';
    fetchMock.mockRejectedValue(abortErr);

    const result = await uploadFileToBus(
      '/tmp/test.sol',
      'test.sol',
      { url: 'https://bus.test', token: 'token123' },
      readFileMock,
      fetchMock,
    );

    expect(result.ok).toBe(false);
    expect(result.reason).toBe('timeout');
    expect(result.reply).toContain('timed out');
  });

  it('handles network errors gracefully', async () => {
    readFileMock.mockResolvedValue(Buffer.from('test'));

    fetchMock.mockRejectedValue(new Error('Connection refused'));

    const result = await uploadFileToBus(
      '/tmp/test.sol',
      'test.sol',
      { url: 'https://bus.test', token: 'token123' },
      readFileMock,
      fetchMock,
    );

    expect(result.ok).toBe(false);
    expect(result.reason).toBe('Connection refused');
    expect(result.reply).toContain('Could not upload to the bus');
  });

  it('handles JSON parse error when response is not JSON', async () => {
    readFileMock.mockResolvedValue(Buffer.from('test'));

    fetchMock.mockResolvedValue({
      ok: true,
      json: () => Promise.reject(new Error('Not JSON')),
    });

    const result = await uploadFileToBus(
      '/tmp/test.sol',
      'test.sol',
      { url: 'https://bus.test', token: 'token123' },
      readFileMock,
      fetchMock,
    );

    // Should still succeed - fileId will be undefined, but sha256 is there
    expect(result.ok).toBe(true);
    expect(result.sha256).toBeDefined();
    expect(result.fileId).toBeUndefined();
  });

  it('includes Authorization header with Bearer token', async () => {
    readFileMock.mockResolvedValue(Buffer.from('test'));

    fetchMock.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ id: 'file-123' }),
    });

    await uploadFileToBus(
      '/tmp/test.sol',
      'test.sol',
      { url: 'https://bus.test', token: 'mytoken' },
      readFileMock,
      fetchMock,
    );

    const callArgs = fetchMock.mock.calls[0];
    expect(callArgs[0]).toContain('/files/upload');
    expect(callArgs[1]?.headers).toEqual({
      'Content-Type': 'application/octet-stream',
      Authorization: 'Bearer mytoken',
    });
  });

  it('encodes filename in query parameter', async () => {
    readFileMock.mockResolvedValue(Buffer.from('test'));

    fetchMock.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ id: 'file-123' }),
    });

    await uploadFileToBus(
      '/tmp/test.sol',
      'my special file.sol',
      { url: 'https://bus.test', token: 'token' },
      readFileMock,
      fetchMock,
    );

    const callUrl = fetchMock.mock.calls[0][0];
    expect(callUrl).toContain('name=');
    expect(callUrl).toContain(encodeURIComponent('my special file.sol'));
  });
});

describe('verifyReceipt', () => {
  it('returns MATCH when contentHash and messageId both match', () => {
    const receipt: DreamNetReceipt = {
      messageId: 'msg-123abc',
      contentHash: 'abc123def456789',
    };

    const result = verifyReceipt(receipt, 'msg-123abc', 'abc123def456789');
    expect(result).toBe('MATCH');
  });

  it('returns MISMATCH when contentHash differs', () => {
    const receipt: DreamNetReceipt = {
      messageId: 'msg-123abc',
      contentHash: 'wrong_hash',
    };

    const result = verifyReceipt(receipt, 'msg-123abc', 'abc123def456789');
    expect(result).toBe('MISMATCH');
  });

  it('returns MISMATCH when messageId differs', () => {
    const receipt: DreamNetReceipt = {
      messageId: 'wrong-id',
      contentHash: 'abc123def456789',
    };

    const result = verifyReceipt(receipt, 'msg-123abc', 'abc123def456789');
    expect(result).toBe('MISMATCH');
  });

  it('returns MISMATCH when both fields differ', () => {
    const receipt: DreamNetReceipt = {
      messageId: 'wrong-id',
      contentHash: 'wrong_hash',
    };

    const result = verifyReceipt(receipt, 'msg-123abc', 'abc123def456789');
    expect(result).toBe('MISMATCH');
  });

  it('returns CANNOT_VERIFY when contentHash is missing', () => {
    const receipt: DreamNetReceipt = {
      messageId: 'msg-123abc',
    };

    const result = verifyReceipt(receipt, 'msg-123abc', 'abc123def456789');
    expect(result).toBe('CANNOT_VERIFY');
  });

  it('returns CANNOT_VERIFY when messageId is missing', () => {
    const receipt: DreamNetReceipt = {
      contentHash: 'abc123def456789',
    };

    const result = verifyReceipt(receipt, 'msg-123abc', 'abc123def456789');
    expect(result).toBe('CANNOT_VERIFY');
  });

  it('returns CANNOT_VERIFY when both fields are missing', () => {
    const receipt: DreamNetReceipt = {};

    const result = verifyReceipt(receipt, 'msg-123abc', 'abc123def456789');
    expect(result).toBe('CANNOT_VERIFY');
  });

  it('returns CANNOT_VERIFY when contentHash is null', () => {
    const receipt: DreamNetReceipt = {
      messageId: 'msg-123abc',
      contentHash: null,
    };

    const result = verifyReceipt(receipt, 'msg-123abc', 'abc123def456789');
    expect(result).toBe('CANNOT_VERIFY');
  });

  it('returns CANNOT_VERIFY when messageId is null', () => {
    const receipt: DreamNetReceipt = {
      messageId: null,
      contentHash: 'abc123def456789',
    };

    const result = verifyReceipt(receipt, 'msg-123abc', 'abc123def456789');
    expect(result).toBe('CANNOT_VERIFY');
  });

  it('returns CANNOT_VERIFY when both are null', () => {
    const receipt: DreamNetReceipt = {
      messageId: null,
      contentHash: null,
    };

    const result = verifyReceipt(receipt, 'msg-123abc', 'abc123def456789');
    expect(result).toBe('CANNOT_VERIFY');
  });

  it('converts contentHash to string for comparison (number)', () => {
    const receipt: DreamNetReceipt = {
      messageId: 'msg-123abc',
      contentHash: 12345 as any, // simulate a numeric hash from an API
    };

    const result = verifyReceipt(receipt, 'msg-123abc', '12345');
    expect(result).toBe('MATCH');
  });

  it('converts messageId to string for comparison (number)', () => {
    const receipt: DreamNetReceipt = {
      messageId: 123 as any, // simulate a numeric ID from an API
      contentHash: 'abc123def456789',
    };

    const result = verifyReceipt(receipt, '123', 'abc123def456789');
    expect(result).toBe('MATCH');
  });

  it('includes extra fields in receipt without affecting verification', () => {
    const receipt: DreamNetReceipt = {
      messageId: 'msg-123abc',
      contentHash: 'abc123def456789',
      extraField: 'ignored',
      anotherField: 42,
      nested: { value: 'also ignored' },
    };

    const result = verifyReceipt(receipt, 'msg-123abc', 'abc123def456789');
    expect(result).toBe('MATCH');
  });
});

describe('ackReceipt', () => {
  afterEach(() => {
    fetchMock.mockReset();
  });

  it('sends ACK for MATCH verification', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ id: 'ack-123' }),
    });

    const receipt: DreamNetReceipt = {
      messageId: 'msg-123abc',
      contentHash: 'abc123def456789',
    };

    const result = await ackReceipt(
      receipt,
      'receipt-msg-456',
      'msg-123abc',
      'abc123def456789',
      { url: 'https://bus.test', token: 'token' },
      fetchMock,
    );

    expect(result.ok).toBe(true);
    expect(result.verification).toBe('MATCH');
    expect(result.reply).toContain('Sent to coordinator');
  });

  it('sends ACK for MISMATCH and reports the problem', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ id: 'ack-123' }),
    });

    const receipt: DreamNetReceipt = {
      messageId: 'msg-123abc',
      contentHash: 'wrong_hash',
    };

    const result = await ackReceipt(
      receipt,
      'receipt-msg-456',
      'msg-123abc',
      'abc123def456789',
      { url: 'https://bus.test', token: 'token' },
      fetchMock,
    );

    expect(result.ok).toBe(true); // ACK itself succeeded
    expect(result.verification).toBe('MISMATCH');
    // Verify the ACK message contains the problem report
    const sendCall = fetchMock.mock.calls.find((call) => String(call[0]).includes('/send'));
    expect(sendCall).toBeDefined();
    const sendBody = sendCall?.[1]?.body;
    if (typeof sendBody === 'string') {
      const parsed = JSON.parse(sendBody);
      expect(parsed.body).toContain('MISMATCH');
      expect(parsed.body).toContain('wrong_hash');
    }
  });

  it('sends ACK for CANNOT_VERIFY and reports missing fields', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ id: 'ack-123' }),
    });

    const receipt: DreamNetReceipt = {
      messageId: 'msg-123abc',
      // contentHash missing
    };

    const result = await ackReceipt(
      receipt,
      'receipt-msg-456',
      'msg-123abc',
      'abc123def456789',
      { url: 'https://bus.test', token: 'token' },
      fetchMock,
    );

    expect(result.ok).toBe(true);
    expect(result.verification).toBe('CANNOT_VERIFY');
    // Verify the ACK message mentions missing fields
    const sendCall = fetchMock.mock.calls.find((call) => String(call[0]).includes('/send'));
    expect(sendCall).toBeDefined();
    const sendBody = sendCall?.[1]?.body;
    if (typeof sendBody === 'string') {
      const parsed = JSON.parse(sendBody);
      expect(parsed.body).toContain('CANNOT_VERIFY');
      expect(parsed.body).toContain('Missing');
    }
  });

  it('returns unconfigured when bus is not configured', async () => {
    const receipt: DreamNetReceipt = {
      messageId: 'msg-123abc',
      contentHash: 'abc123def456789',
    };

    const result = await ackReceipt(
      receipt,
      'receipt-msg-456',
      'msg-123abc',
      'abc123def456789',
      { url: '', token: '' },
      fetchMock,
    );

    expect(result.ok).toBe(false);
    expect(result.reason).toBe('unconfigured');
    expect(result.reply).toContain('Bus not connected');
  });

  it('handles fetch error when sending ACK', async () => {
    fetchMock.mockRejectedValue(new Error('Network error'));

    const receipt: DreamNetReceipt = {
      messageId: 'msg-123abc',
      contentHash: 'abc123def456789',
    };

    const result = await ackReceipt(
      receipt,
      'receipt-msg-456',
      'msg-123abc',
      'abc123def456789',
      { url: 'https://bus.test', token: 'token' },
      fetchMock,
    );

    expect(result.ok).toBe(false);
    // Error comes from sendBusReply catch block
    expect(result.reply).toContain('Could not reach the bus');
    // Still reports the verification result even though send failed
    expect(result.verification).toBe('MATCH');
  });

  it('includes receipt message ID in ACK subject line', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ id: 'ack-123' }),
    });

    const receipt: DreamNetReceipt = {
      messageId: 'msg-123abc',
      contentHash: 'abc123def456789',
    };

    await ackReceipt(
      receipt,
      'abc12345-other-chars',
      'msg-123abc',
      'abc123def456789',
      { url: 'https://bus.test', token: 'token' },
      fetchMock,
    );

    const sendCall = fetchMock.mock.calls.find((call) => String(call[0]).includes('/send'));
    expect(sendCall).toBeDefined();
    const sendBody = sendCall?.[1]?.body;
    if (typeof sendBody === 'string') {
      const parsed = JSON.parse(sendBody);
      expect(parsed.subject).toContain('ACK receipt');
      // Subject should include the ID (first 8 chars: abc12345)
      expect(parsed.subject).toContain('abc12345');
    }
  });
});

describe('hashFile', () => {
  afterEach(() => {
    readFileMock.mockReset();
  });

  it('computes sha256 of file contents', async () => {
    const testBytes = Buffer.from('test content');
    readFileMock.mockResolvedValue(testBytes);

    const hash = await hashFile('/tmp/test.sol', readFileMock);

    expect(hash).toHaveLength(64); // sha256 hex
    expect(/^[a-f0-9]{64}$/.test(hash)).toBe(true); // valid hex
  });

  it('produces deterministic hashes', async () => {
    const testBytes = Buffer.from('same content');
    readFileMock.mockResolvedValue(testBytes);

    const hash1 = await hashFile('/tmp/test1.sol', readFileMock);
    const hash2 = await hashFile('/tmp/test2.sol', readFileMock);

    expect(hash1).toBe(hash2);
  });

  it('produces different hashes for different content', async () => {
    const bytes1 = Buffer.from('content1');
    const bytes2 = Buffer.from('content2');

    readFileMock.mockResolvedValueOnce(bytes1);
    const hash1 = await hashFile('/tmp/test1.sol', readFileMock);

    readFileMock.mockResolvedValueOnce(bytes2);
    const hash2 = await hashFile('/tmp/test2.sol', readFileMock);

    expect(hash1).not.toBe(hash2);
  });
});
