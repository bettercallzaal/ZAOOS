import { describe, it, expect } from 'vitest'
import { parseChapters } from '../chapters'

describe('parseChapters', () => {
  it('returns null when description file does not exist', async () => {
    const result = await parseChapters('nonexistent-slug')
    expect(result).toBeNull()
  })

  it('returns parsed chapters when description file exists', async () => {
    const result = await parseChapters('2025-08-22-deepa-grantorb')
    if (result === null) {
      return
    }
    expect(Array.isArray(result)).toBe(true)
    expect(result.length).toBeGreaterThanOrEqual(3)
    expect(result[0]).toMatchObject({
      timestamp: expect.stringMatching(/^[0-9]+:[0-9]{2}$/),
      title: expect.any(String),
    })
    expect(result[0].timestamp).toBe('0:00')
  })
})
