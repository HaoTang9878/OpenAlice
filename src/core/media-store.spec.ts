import { describe, it, expect } from 'vitest'
import { dirname, join } from 'node:path'
import { tmpdir } from 'node:os'
import { writeFile, mkdir } from 'node:fs/promises'
import { randomUUID } from 'node:crypto'
import { resolveMediaPath, persistMedia, MEDIA_DIR } from './media-store.js'

// ==================== resolveMediaPath ====================

describe('resolveMediaPath', () => {
  it('resolves an existing file inside MEDIA_DIR', async () => {
    // 造一个真实文件: 新实现走 realpath 包含性校验, 文件必须存在
    const rel = '2026-01-01/ace-aim-air.png'
    const abs = join(MEDIA_DIR, rel)
    await mkdir(dirname(abs), { recursive: true })
    await writeFile(abs, 'png')
    const result = await resolveMediaPath(rel)
    expect(result).toContain(join('data', 'media', '2026-01-01', 'ace-aim-air.png'))
  })

  it('rejects traversal outside MEDIA_DIR', async () => {
    // 安全回归(2026-09-21): ../ 穿越必须返回 null
    expect(await resolveMediaPath('../../config/auth.json')).toBeNull()
    expect(await resolveMediaPath('2026-01-01/../../sealing.key')).toBeNull()
  })

  it('returns null for a missing file', async () => {
    expect(await resolveMediaPath('2026-01-01/no-such-file.png')).toBeNull()
  })
})

// ==================== persistMedia ====================

describe('persistMedia', () => {
  it('should produce deterministic 3-word names for same content', async () => {
    const dir = join(tmpdir(), `media-test-${randomUUID()}`)
    await mkdir(dir, { recursive: true })

    const filePath = join(dir, 'test.png')
    await writeFile(filePath, 'deterministic content')

    const result1 = await persistMedia(filePath)
    const result2 = await persistMedia(filePath)

    // Same content → same name (content-addressable)
    expect(result1).toBe(result2)
    // Format: YYYY-MM-DD/word-word-word.ext
    expect(result1).toMatch(/^\d{4}-\d{2}-\d{2}\/[a-z]+-[a-z]+-[a-z]+\.png$/)
  })

  it('should preserve file extension', async () => {
    const dir = join(tmpdir(), `media-test-${randomUUID()}`)
    await mkdir(dir, { recursive: true })

    const filePath = join(dir, 'photo.jpg')
    await writeFile(filePath, 'jpg content')

    const result = await persistMedia(filePath)
    expect(result).toMatch(/\.jpg$/)
  })

  it('should use .bin for files with no extension', async () => {
    const dir = join(tmpdir(), `media-test-${randomUUID()}`)
    await mkdir(dir, { recursive: true })

    const filePath = join(dir, 'noext')
    await writeFile(filePath, 'binary stuff')

    const result = await persistMedia(filePath)
    expect(result).toMatch(/\.bin$/)
  })

  it('should produce different names for different content', async () => {
    const dir = join(tmpdir(), `media-test-${randomUUID()}`)
    await mkdir(dir, { recursive: true })

    const file1 = join(dir, 'a.png')
    const file2 = join(dir, 'b.png')
    await writeFile(file1, 'content A')
    await writeFile(file2, 'content B')

    const result1 = await persistMedia(file1)
    const result2 = await persistMedia(file2)

    // Different content → different names (with high probability)
    expect(result1).not.toBe(result2)
  })
})
