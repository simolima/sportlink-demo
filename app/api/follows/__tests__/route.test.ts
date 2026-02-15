import { describe, it, expect, vi, beforeEach } from 'vitest'

// ============================================================================
// Mock fs BEFORE importing the route
// ============================================================================
const mockFiles: Record<string, string> = {}

vi.mock('fs', () => ({
    default: {
        existsSync: vi.fn((filePath: string) => filePath in mockFiles),
        readFileSync: vi.fn((filePath: string) => {
            if (filePath in mockFiles) return mockFiles[filePath]
            throw new Error(`ENOENT: ${filePath}`)
        }),
        writeFileSync: vi.fn((filePath: string, content: string) => {
            mockFiles[filePath] = content
        }),
        mkdirSync: vi.fn(),
    },
    existsSync: vi.fn((filePath: string) => filePath in mockFiles),
    readFileSync: vi.fn((filePath: string) => {
        if (filePath in mockFiles) return mockFiles[filePath]
        throw new Error(`ENOENT: ${filePath}`)
    }),
    writeFileSync: vi.fn((filePath: string, content: string) => {
        mockFiles[filePath] = content
    }),
    mkdirSync: vi.fn(),
}))

// Import AFTER mocking
import { GET, POST, DELETE } from '@/app/api/follows/route'

// ============================================================================
// Helpers
// ============================================================================
function setFileContent(filePath: string, data: any) {
    // Normalize path separators for cross-platform matching
    const normalized = filePath.replace(/\\/g, '/')
    // Store with both possible separators
    mockFiles[filePath] = JSON.stringify(data)
    mockFiles[normalized] = JSON.stringify(data)
    // Also store with the other separator style
    mockFiles[filePath.replace(/\//g, '\\')] = JSON.stringify(data)
}

function makeRequest(url: string, options: RequestInit = {}): Request {
    return new Request(url, options)
}

function makeJsonRequest(url: string, body: any, method = 'POST'): Request {
    return new Request(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
    })
}

// ============================================================================
// Setup: seed mock files before each test
// ============================================================================
beforeEach(() => {
    // Clear all mock files
    Object.keys(mockFiles).forEach(k => delete mockFiles[k])

    // Seed default data - use patterns that match path.join output
    // We need to set all possible path variations
    const follows = [
        { id: 1, followerId: '10', followingId: '20', createdAt: '2025-01-01T00:00:00Z' },
        { id: 2, followerId: '10', followingId: '30', createdAt: '2025-01-02T00:00:00Z' },
        { id: 3, followerId: '30', followingId: '10', createdAt: '2025-01-03T00:00:00Z' },
    ]

    const users = [
        { id: '10', firstName: 'Mario', lastName: 'Rossi', avatarUrl: null },
        { id: '20', firstName: 'Luca', lastName: 'Bianchi', avatarUrl: null },
        { id: '30', firstName: 'Anna', lastName: 'Verdi', avatarUrl: null },
    ]

    const notifications: any[] = []

    // Set for every possible path format
    for (const sep of ['/', '\\']) {
        const base = `${process.cwd().replace(/\\/g, sep)}${sep}data${sep}`
        setFileContent(`${base}follows.json`, follows)
        setFileContent(`${base}users.json`, users)
        setFileContent(`${base}notifications.json`, notifications)
    }

    vi.clearAllMocks()
})

// ============================================================================
// GET /api/follows
// ============================================================================
describe('GET /api/follows', () => {
    it('returns all follows when no query params', async () => {
        const req = makeRequest('http://localhost:3000/api/follows')
        const res = await GET(req)
        const data = await res.json()

        expect(res.status).toBe(200)
        expect(Array.isArray(data)).toBe(true)
        // Should have CORS header
        expect(res.headers.get('Access-Control-Allow-Origin')).toBe('*')
    })

    it('filters by followerId', async () => {
        const req = makeRequest('http://localhost:3000/api/follows?followerId=10')
        const res = await GET(req)
        const data = await res.json()

        expect(res.status).toBe(200)
        // User 10 follows users 20 and 30
        expect(data.every((f: any) => String(f.followerId) === '10')).toBe(true)
    })

    it('filters by followingId', async () => {
        const req = makeRequest('http://localhost:3000/api/follows?followingId=10')
        const res = await GET(req)
        const data = await res.json()

        expect(res.status).toBe(200)
        expect(data.every((f: any) => String(f.followingId) === '10')).toBe(true)
    })
})

// ============================================================================
// POST /api/follows
// ============================================================================
describe('POST /api/follows', () => {
    it('creates a new follow (201)', async () => {
        const req = makeJsonRequest('http://localhost:3000/api/follows', {
            followerId: '20',
            followingId: '30',
        })
        const res = await POST(req)
        const data = await res.json()

        expect(res.status).toBe(201)
        expect(data.followerId).toBe('20')
        expect(data.followingId).toBe('30')
        expect(data.id).toBeDefined()
        expect(data.createdAt).toBeDefined()
    })

    it('returns 400 when followerId is missing', async () => {
        const req = makeJsonRequest('http://localhost:3000/api/follows', {
            followingId: '20',
        })
        const res = await POST(req)
        const data = await res.json()

        expect(res.status).toBe(400)
        expect(data.error).toBe('followerId_and_followingId_required')
    })

    it('returns 400 when followingId is missing', async () => {
        const req = makeJsonRequest('http://localhost:3000/api/follows', {
            followerId: '10',
        })
        const res = await POST(req)
        const data = await res.json()

        expect(res.status).toBe(400)
        expect(data.error).toBe('followerId_and_followingId_required')
    })

    it('returns 400 for self-follow', async () => {
        const req = makeJsonRequest('http://localhost:3000/api/follows', {
            followerId: '10',
            followingId: '10',
        })
        const res = await POST(req)
        const data = await res.json()

        expect(res.status).toBe(400)
        expect(data.error).toBe('cannot_follow_self')
    })

    it('returns 409 for duplicate follow', async () => {
        const req = makeJsonRequest('http://localhost:3000/api/follows', {
            followerId: '10',
            followingId: '20',
        })
        const res = await POST(req)
        const data = await res.json()

        expect(res.status).toBe(409)
        expect(data.error).toBe('already_following')
    })

    it('returns 400 for invalid JSON body', async () => {
        const req = new Request('http://localhost:3000/api/follows', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: 'not json',
        })
        const res = await POST(req)

        expect(res.status).toBe(400)
    })
})

// ============================================================================
// DELETE /api/follows
// ============================================================================
describe('DELETE /api/follows', () => {
    it('removes an existing follow', async () => {
        const req = makeJsonRequest(
            'http://localhost:3000/api/follows',
            { followerId: '10', followingId: '20' },
            'DELETE',
        )
        const res = await DELETE(req)
        const data = await res.json()

        expect(res.status).toBe(200)
        expect(data.removed).toBe(1)
    })

    it('returns 404 when relation not found', async () => {
        const req = makeJsonRequest(
            'http://localhost:3000/api/follows',
            { followerId: '99', followingId: '88' },
            'DELETE',
        )
        const res = await DELETE(req)
        const data = await res.json()

        expect(res.status).toBe(404)
        expect(data.warning).toBe('relation_not_found')
    })

    it('returns 400 when missing params', async () => {
        const req = makeJsonRequest(
            'http://localhost:3000/api/follows',
            { followerId: '10' },
            'DELETE',
        )
        const res = await DELETE(req)
        const data = await res.json()

        expect(res.status).toBe(400)
        expect(data.error).toBe('followerId_and_followingId_required')
    })
})
