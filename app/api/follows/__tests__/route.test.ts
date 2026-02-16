import { describe, it, expect, vi, beforeEach } from 'vitest'import { describe, it, expect, vi, beforeEach } from 'vitest'



// ============================================================================// ============================================================================

// Mock Supabase BEFORE importing the route// Mock fs BEFORE importing the route

// ============================================================================// ============================================================================

let mockFollowsData: any[] = []const mockFiles: Record<string, string> = {}

let mockError: any = null

vi.mock('fs', () => ({

// Chainable Supabase query builder mock    default: {

const createSupabaseMock = () => {        existsSync: vi.fn((filePath: string) => filePath in mockFiles),

    const chain: any = {        readFileSync: vi.fn((filePath: string) => {

        select: vi.fn(() => chain),            if (filePath in mockFiles) return mockFiles[filePath]

        insert: vi.fn((data: any) => {            throw new Error(`ENOENT: ${filePath}`)

            // Simulate insert        }),

            const newFollow = {        writeFileSync: vi.fn((filePath: string, content: string) => {

                id: Date.now().toString(),            mockFiles[filePath] = content

                ...data,        }),

                created_at: new Date().toISOString()        mkdirSync: vi.fn(),

            }    },

            mockFollowsData.push(newFollow)    existsSync: vi.fn((filePath: string) => filePath in mockFiles),

            return chain    readFileSync: vi.fn((filePath: string) => {

        }),        if (filePath in mockFiles) return mockFiles[filePath]

        upsert: vi.fn(() => chain),        throw new Error(`ENOENT: ${filePath}`)

        delete: vi.fn(() => chain),    }),

        eq: vi.fn((column: string, value: any) => {    writeFileSync: vi.fn((filePath: string, content: string) => {

            // Filter mockFollowsData based on the column/value        mockFiles[filePath] = content

            if (column === 'follower_id') {    }),

                mockFollowsData = mockFollowsData.filter((f: any) => String(f.follower_id) === String(value))    mkdirSync: vi.fn(),

            } else if (column === 'following_id') {}))

                mockFollowsData = mockFollowsData.filter((f: any) => String(f.following_id) === String(value))

            }// Import AFTER mocking

            return chainimport { GET, POST, DELETE } from '@/app/api/follows/route'

        }),

        is: vi.fn(() => chain),// ============================================================================

        order: vi.fn(() => chain),// Helpers

        maybeSingle: vi.fn(() => Promise.resolve({ data: mockFollowsData[0] || null, error: mockError })),// ============================================================================

        single: vi.fn(() => Promise.resolve({ data: mockFollowsData[0] || null, error: mockError })),function setFileContent(filePath: string, data: any) {

    }    // Normalize path separators for cross-platform matching

        const normalized = filePath.replace(/\\/g, '/')

    // Make it thenable (for await)    // Store with both possible separators

    chain.then = (resolve: any) => resolve({ data: mockFollowsData, error: mockError })    mockFiles[filePath] = JSON.stringify(data)

        mockFiles[normalized] = JSON.stringify(data)

    return chain    // Also store with the other separator style

}    mockFiles[filePath.replace(/\//g, '\\')] = JSON.stringify(data)

}

vi.mock('@/lib/supabase-server', () => ({

    supabaseServer: {function makeRequest(url: string, options: RequestInit = {}): Request {

        from: vi.fn(() => createSupabaseMock()),    return new Request(url, options)

    },}

}))

function makeJsonRequest(url: string, body: any, method = 'POST'): Request {

// Mock notifications repository    return new Request(url, {

vi.mock('@/lib/notifications-repository', () => ({        method,

    createNotification: vi.fn(() => Promise.resolve({ id: '1' })),        headers: { 'Content-Type': 'application/json' },

}))        body: JSON.stringify(body),

    })

// Mock notification dispatcher}

vi.mock('@/lib/notification-dispatcher', () => ({

    notifyUser: vi.fn(),// ============================================================================

}))// Setup: seed mock files before each test

// ============================================================================

// Import AFTER mockingbeforeEach(() => {

import { GET, POST, DELETE } from '@/app/api/follows/route'    // Clear all mock files

    Object.keys(mockFiles).forEach(k => delete mockFiles[k])

// ============================================================================

// Helpers    // Seed default data - use patterns that match path.join output

// ============================================================================    // We need to set all possible path variations

function makeRequest(url: string, options: RequestInit = {}): Request {    const follows = [

    return new Request(url, options)        { id: 1, followerId: '10', followingId: '20', createdAt: '2025-01-01T00:00:00Z' },

}        { id: 2, followerId: '10', followingId: '30', createdAt: '2025-01-02T00:00:00Z' },

        { id: 3, followerId: '30', followingId: '10', createdAt: '2025-01-03T00:00:00Z' },

function makeJsonRequest(url: string, body: any, method = 'POST'): Request {    ]

    return new Request(url, {

        method,    const users = [

        headers: { 'Content-Type': 'application/json' },        { id: '10', firstName: 'Mario', lastName: 'Rossi', avatarUrl: null },

        body: JSON.stringify(body),        { id: '20', firstName: 'Luca', lastName: 'Bianchi', avatarUrl: null },

    })        { id: '30', firstName: 'Anna', lastName: 'Verdi', avatarUrl: null },

}    ]



// ============================================================================    const notifications: any[] = []

// Setup: seed mock data before each test

// ============================================================================    // Set for every possible path format

beforeEach(() => {    for (const sep of ['/', '\\']) {

    // Reset mock data        const base = `${process.cwd().replace(/\\/g, sep)}${sep}data${sep}`

    mockFollowsData = [        setFileContent(`${base}follows.json`, follows)

        { id: '1', follower_id: '10', following_id: '20', created_at: '2025-01-01T00:00:00Z' },        setFileContent(`${base}users.json`, users)

        { id: '2', follower_id: '10', following_id: '30', created_at: '2025-01-02T00:00:00Z' },        setFileContent(`${base}notifications.json`, notifications)

        { id: '3', follower_id: '30', following_id: '10', created_at: '2025-01-03T00:00:00Z' },    }

    ]

    mockError = null    vi.clearAllMocks()

    vi.clearAllMocks()})

})

// ============================================================================

// ============================================================================// GET /api/follows

// GET /api/follows// ============================================================================

// ============================================================================describe('GET /api/follows', () => {

describe('GET /api/follows', () => {    it('returns all follows when no query params', async () => {

    it('returns all follows when no query params', async () => {        const req = makeRequest('http://localhost:3000/api/follows')

        const req = makeRequest('http://localhost:3000/api/follows')        const res = await GET(req)

        const res = await GET(req)        const data = await res.json()

        const data = await res.json()

        expect(res.status).toBe(200)

        expect(res.status).toBe(200)        expect(Array.isArray(data)).toBe(true)

        expect(Array.isArray(data)).toBe(true)        // Should have CORS header

        expect(res.headers.get('Access-Control-Allow-Origin')).toBe('*')        expect(res.headers.get('Access-Control-Allow-Origin')).toBe('*')

    })    })



    it('filters by followerId', async () => {    it('filters by followerId', async () => {

        const req = makeRequest('http://localhost:3000/api/follows?followerId=10')        const req = makeRequest('http://localhost:3000/api/follows?followerId=10')

        const res = await GET(req)        const res = await GET(req)

        const data = await res.json()        const data = await res.json()



        expect(res.status).toBe(200)        expect(res.status).toBe(200)

        expect(data.every((f: any) => String(f.followerId) === '10')).toBe(true)        // User 10 follows users 20 and 30

    })        expect(data.every((f: any) => String(f.followerId) === '10')).toBe(true)

    })

    it('filters by followingId', async () => {

        const req = makeRequest('http://localhost:3000/api/follows?followingId=10')    it('filters by followingId', async () => {

        const res = await GET(req)        const req = makeRequest('http://localhost:3000/api/follows?followingId=10')

        const data = await res.json()        const res = await GET(req)

        const data = await res.json()

        expect(res.status).toBe(200)

        expect(data.every((f: any) => String(f.followingId) === '10')).toBe(true)        expect(res.status).toBe(200)

    })        expect(data.every((f: any) => String(f.followingId) === '10')).toBe(true)

})    })

})

// ============================================================================

// POST /api/follows// ============================================================================

// ============================================================================// POST /api/follows

describe('POST /api/follows', () => {// ============================================================================

    it('creates a new follow (201)', async () => {describe('POST /api/follows', () => {

        // Mock: relation doesn't exist yet    it('creates a new follow (201)', async () => {

        mockFollowsData = []        const req = makeJsonRequest('http://localhost:3000/api/follows', {

                    followerId: '20',

        const req = makeJsonRequest('http://localhost:3000/api/follows', {            followingId: '30',

            followerId: '20',        })

            followingId: '30',        const res = await POST(req)

        })        const data = await res.json()

        const res = await POST(req)

        const data = await res.json()        expect(res.status).toBe(201)

        expect(data.followerId).toBe('20')

        expect(res.status).toBe(201)        expect(data.followingId).toBe('30')

        expect(data.followerId).toBe('20')        expect(data.id).toBeDefined()

        expect(data.followingId).toBe('30')        expect(data.createdAt).toBeDefined()

    })    })



    it('returns 400 when followerId is missing', async () => {    it('returns 400 when followerId is missing', async () => {

        const req = makeJsonRequest('http://localhost:3000/api/follows', {        const req = makeJsonRequest('http://localhost:3000/api/follows', {

            followingId: '20',            followingId: '20',

        })        })

        const res = await POST(req)        const res = await POST(req)

        const data = await res.json()        const data = await res.json()



        expect(res.status).toBe(400)        expect(res.status).toBe(400)

        expect(data.error).toBeDefined()        expect(data.error).toBe('followerId_and_followingId_required')

    })    })



    it('returns 400 when followingId is missing', async () => {    it('returns 400 when followingId is missing', async () => {

        const req = makeJsonRequest('http://localhost:3000/api/follows', {        const req = makeJsonRequest('http://localhost:3000/api/follows', {

            followerId: '10',            followerId: '10',

        })        })

        const res = await POST(req)        const res = await POST(req)

        const data = await res.json()        const data = await res.json()



        expect(res.status).toBe(400)        expect(res.status).toBe(400)

        expect(data.error).toBeDefined()        expect(data.error).toBe('followerId_and_followingId_required')

    })    })



    it('returns 400 for self-follow', async () => {    it('returns 400 for self-follow', async () => {

        const req = makeJsonRequest('http://localhost:3000/api/follows', {        const req = makeJsonRequest('http://localhost:3000/api/follows', {

            followerId: '10',            followerId: '10',

            followingId: '10',            followingId: '10',

        })        })

        const res = await POST(req)        const res = await POST(req)

        const data = await res.json()        const data = await res.json()



        expect(res.status).toBe(400)        expect(res.status).toBe(400)

        expect(data.error).toBeDefined()        expect(data.error).toBe('cannot_follow_self')

    })    })



    it('returns 409 for duplicate follow', async () => {    it('returns 409 for duplicate follow', async () => {

        // Mock: relation already exists        const req = makeJsonRequest('http://localhost:3000/api/follows', {

        mockFollowsData = [{ id: '1', follower_id: '10', following_id: '20', created_at: '2025-01-01T00:00:00Z' }]            followerId: '10',

                    followingId: '20',

        const req = makeJsonRequest('http://localhost:3000/api/follows', {        })

            followerId: '10',        const res = await POST(req)

            followingId: '20',        const data = await res.json()

        })

        const res = await POST(req)        expect(res.status).toBe(409)

        const data = await res.json()        expect(data.error).toBe('already_following')

    })

        expect(res.status).toBe(409)

        expect(data.error).toBeDefined()    it('returns 400 for invalid JSON body', async () => {

    })        const req = new Request('http://localhost:3000/api/follows', {

})            method: 'POST',

            headers: { 'Content-Type': 'application/json' },

// ============================================================================            body: 'not json',

// DELETE /api/follows        })

// ============================================================================        const res = await POST(req)

describe('DELETE /api/follows', () => {

    it('removes an existing follow', async () => {        expect(res.status).toBe(400)

        // Mock: relation exists    })

        mockFollowsData = [{ id: '1', follower_id: '10', following_id: '20', created_at: '2025-01-01T00:00:00Z' }]})

        

        const req = makeJsonRequest(// ============================================================================

            'http://localhost:3000/api/follows',// DELETE /api/follows

            { followerId: '10', followingId: '20' },// ============================================================================

            'DELETE',describe('DELETE /api/follows', () => {

        )    it('removes an existing follow', async () => {

        const res = await DELETE(req)        const req = makeJsonRequest(

        const data = await res.json()            'http://localhost:3000/api/follows',

            { followerId: '10', followingId: '20' },

        expect(res.status).toBe(200)            'DELETE',

        expect(data.removed).toBeDefined()        )

    })        const res = await DELETE(req)

        const data = await res.json()

    it('returns 404 when relation not found', async () => {

        // Mock: no relation        expect(res.status).toBe(200)

        mockFollowsData = []        expect(data.removed).toBe(1)

            })

        const req = makeJsonRequest(

            'http://localhost:3000/api/follows',    it('returns 404 when relation not found', async () => {

            { followerId: '99', followingId: '88' },        const req = makeJsonRequest(

            'DELETE',            'http://localhost:3000/api/follows',

        )            { followerId: '99', followingId: '88' },

        const res = await DELETE(req)            'DELETE',

        const data = await res.json()        )

        const res = await DELETE(req)

        expect(res.status).toBe(404)        const data = await res.json()

        expect(data.warning).toBeDefined()

    })        expect(res.status).toBe(404)

        expect(data.warning).toBe('relation_not_found')

    it('returns 400 when missing params', async () => {    })

        const req = makeJsonRequest(

            'http://localhost:3000/api/follows',    it('returns 400 when missing params', async () => {

            { followerId: '10' },        const req = makeJsonRequest(

            'DELETE',            'http://localhost:3000/api/follows',

        )            { followerId: '10' },

        const res = await DELETE(req)            'DELETE',

        const data = await res.json()        )

        const res = await DELETE(req)

        expect(res.status).toBe(400)        const data = await res.json()

        expect(data.error).toBeDefined()

    })        expect(res.status).toBe(400)

})        expect(data.error).toBe('followerId_and_followingId_required')

    })
})
