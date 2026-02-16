import { describe, it, expect, vi, beforeEach } from 'vitest'import { describe, it, expect, vi, beforeEach } from 'vitest'import { describe, it, expect, vi, beforeEach } from 'vitest'



// ============================================================================

// Mock Supabase BEFORE importing the route

// ============================================================================// ============================================================================// ============================================================================



// State that tests can configure per-test// Mock Supabase BEFORE importing the route// Mock fs BEFORE importing the route

let mockQueryResult: { data: any; error: any } = { data: [], error: null }

let mockSingleResult: { data: any; error: any } = { data: null, error: null }// ============================================================================// ============================================================================



// Chainable mock that always returns the configured statelet mockFollowsData: any[] = []const mockFiles: Record<string, string> = {}

function createChain() {

    const chain: any = {}let mockError: any = null



    const methods = [vi.mock('fs', () => ({

        'select', 'insert', 'upsert', 'delete', 'update',

        'eq', 'neq', 'is', 'order',    // Chainable Supabase query builder mock    default: {

    ]

    for (const m of methods) {    const createSupabaseMock = () => {

        chain[m] = vi.fn(() => chain)        existsSync: vi.fn((filePath: string) => filePath in mockFiles),

    }

    const chain: any = {

    // Terminal methods            readFileSync: vi.fn((filePath: string) => {

    chain.maybeSingle = vi.fn(() => Promise.resolve(mockSingleResult))

    chain.single = vi.fn(() => Promise.resolve(mockSingleResult))                select: vi.fn(() => chain),            if (filePath in mockFiles) return mockFiles[filePath]



    // Make the chain itself thenable (for `await query`)                insert: vi.fn((data: any) => {

    chain.then = (resolve: any) => resolve(mockQueryResult)                    throw new Error(`ENOENT: ${filePath}`)



    return chain                    // Simulate insert        }),

}

                    const newFollow = {

vi.mock('@/lib/supabase-server', () => ({                        writeFileSync: vi.fn((filePath: string, content: string) => {

    supabaseServer: {

        from: vi.fn(() => createChain()),                            id: Date.now().toString(), mockFiles[filePath] = content

    },

}))                ...data,        }),



vi.mock('@/lib/cors', () => ({                    created_at: new Date().toISOString()        mkdirSync: vi.fn(),

    withCors: (res: any) => {

        res.headers.set('Access-Control-Allow-Origin', '*')            }    },

        return res

    },            mockFollowsData.push(newFollow)    existsSync: vi.fn((filePath: string) => filePath in mockFiles),

    handleOptions: () => new Response(null, { status: 204 }),

}))    return chain    readFileSync: vi.fn((filePath: string) => {



// Import AFTER mocking    }), if(filePath in mockFiles) return mockFiles[filePath]

import { GET, POST, DELETE } from '@/app/api/follows/route'

        upsert: vi.fn(() => chain), throw new Error(`ENOENT: ${filePath}`)

// ============================================================================

// Helpers        delete: vi.fn(() => chain),

// ============================================================================}),

function makeRequest(url: string): Request {

    return new Request(url)    eq: vi.fn((column: string, value: any) => {

}        writeFileSync: vi.fn((filePath: string, content: string) => {



function makeJsonRequest(url: string, body: any, method = 'POST'): Request {            // Filter mockFollowsData based on the column/value        mockFiles[filePath] = content

    return new Request(url, {

        method,            if (column === 'follower_id') { }),

        headers: { 'Content-Type': 'application/json' },

        body: JSON.stringify(body),            mockFollowsData = mockFollowsData.filter((f: any) => String(f.follower_id) === String(value))    mkdirSync: vi.fn(),

    })

}            } else if (column === 'following_id') { }))



// ============================================================================mockFollowsData = mockFollowsData.filter((f: any) => String(f.following_id) === String(value))

// Reset before each test

// ============================================================================            }// Import AFTER mocking

beforeEach(() => {

    mockQueryResult = { data: [], error: null }return chainimport { GET, POST, DELETE } from '@/app/api/follows/route'

    mockSingleResult = { data: null, error: null }

    vi.clearAllMocks()        }),

})

is: vi.fn(() => chain),// ============================================================================

// ============================================================================

// GET /api/follows    order: vi.fn(() => chain),// Helpers

// ============================================================================

describe('GET /api/follows', () => {        maybeSingle: vi.fn(() => Promise.resolve({ data: mockFollowsData[0] || null, error: mockError })),// ============================================================================

    it('returns 200 with mapped follows', async () => {

        mockQueryResult = {            single: vi.fn(() => Promise.resolve({ data: mockFollowsData[0] || null, error: mockError })), function setFileContent(filePath: string, data: any) {

            data: [

                { follower_id: '10', following_id: '20', created_at: '2025-01-01T00:00:00Z' },            }    // Normalize path separators for cross-platform matching

                { follower_id: '10', following_id: '30', created_at: '2025-01-02T00:00:00Z' },

            ],const normalized = filePath.replace(/\\/g, '/')

            error: null,

        }// Make it thenable (for await)    // Store with both possible separators



        const res = await GET(makeRequest('http://localhost:3000/api/follows'))chain.then = (resolve: any) => resolve({ data: mockFollowsData, error: mockError })    mockFiles[filePath] = JSON.stringify(data)

        const data = await res.json()

mockFiles[normalized] = JSON.stringify(data)

        expect(res.status).toBe(200)

        expect(Array.isArray(data)).toBe(true)return chain    // Also store with the other separator style

        expect(data.length).toBe(2)

        expect(data[0].followerId).toBe('10')}    mockFiles[filePath.replace(/\//g, '\\')] = JSON.stringify(data)

        expect(data[0].followingId).toBe('20')

        expect(res.headers.get('Access-Control-Allow-Origin')).toBe('*')}

    })

vi.mock('@/lib/supabase-server', () => ({

    it('returns 500 when Supabase errors', async () => {

        mockQueryResult = { data: null, error: { message: 'db error' } }    supabaseServer: { function makeRequest(url: string, options: RequestInit = {}): Request {



        const res = await GET(makeRequest('http://localhost:3000/api/follows'))    from: vi.fn(() => createSupabaseMock()), return new Request(url, options)

        expect(res.status).toBe(500)

    })},}

})

}))

// ============================================================================

// POST /api/followsfunction makeJsonRequest(url: string, body: any, method = 'POST'): Request {

// ============================================================================

describe('POST /api/follows', () => {    // Mock notifications repository    return new Request(url, {

    it('returns 400 when followerId is missing', async () => {

        const res = await POST(    vi.mock('@/lib/notifications-repository', () => ({

            makeJsonRequest('http://localhost:3000/api/follows', { followingId: '20' }),        method,

        )

        expect(res.status).toBe(400)        createNotification: vi.fn(() => Promise.resolve({ id: '1' })), headers: { 'Content-Type': 'application/json' },

        const data = await res.json()

        expect(data.error).toBe('followerId_and_followingId_required')    }))        body: JSON.stringify(body),

    })

    })

    it('returns 400 when followingId is missing', async () => {

        const res = await POST(// Mock notification dispatcher}

            makeJsonRequest('http://localhost:3000/api/follows', { followerId: '10' }),

        )vi.mock('@/lib/notification-dispatcher', () => ({

        expect(res.status).toBe(400)

        const data = await res.json()    notifyUser: vi.fn(),// ============================================================================

        expect(data.error).toBe('followerId_and_followingId_required')

    })}))// Setup: seed mock files before each test



    it('returns 400 for self-follow', async () => {// ============================================================================

        const res = await POST(

            makeJsonRequest('http://localhost:3000/api/follows', {// Import AFTER mockingbeforeEach(() => {

                followerId: '10',

                followingId: '10',import { GET, POST, DELETE } from '@/app/api/follows/route'    // Clear all mock files

            }),

        )Object.keys(mockFiles).forEach(k => delete mockFiles[k])

        expect(res.status).toBe(400)

        const data = await res.json()// ============================================================================

        expect(data.error).toBe('cannot_follow_self')

    })// Helpers    // Seed default data - use patterns that match path.join output



    it('returns 409 when already following', async () => {// ============================================================================    // We need to set all possible path variations

        // maybeSingle returns existing row → duplicate

        mockSingleResult = {function makeRequest(url: string, options: RequestInit = {}): Request {

            data: { follower_id: '10', following_id: '20' },    const follows = [

            error: null,

        }    return new Request(url, options)        { id: 1, followerId: '10', followingId: '20', createdAt: '2025-01-01T00:00:00Z' },



        const res = await POST(} { id: 2, followerId: '10', followingId: '30', createdAt: '2025-01-02T00:00:00Z' },

            makeJsonRequest('http://localhost:3000/api/follows', {

                followerId: '10',{ id: 3, followerId: '30', followingId: '10', createdAt: '2025-01-03T00:00:00Z' },

                followingId: '20',

            }),function makeJsonRequest(url: string, body: any, method = 'POST'): Request {    ]

        )

        expect(res.status).toBe(409)    return new Request(url, {

        const data = await res.json()

        expect(data.error).toBe('already_following')        method, const users = [

    })

            headers: { 'Content-Type': 'application/json' }, { id: '10', firstName: 'Mario', lastName: 'Rossi', avatarUrl: null },

    it('creates a new follow (201)', async () => {

        // maybeSingle returns null → no existing follow            body: JSON.stringify(body), { id: '20', firstName: 'Luca', lastName: 'Bianchi', avatarUrl: null },

        mockSingleResult = { data: null, error: null }

        // After upsert, single() returns the new row    })        { id: '30', firstName: 'Anna', lastName: 'Verdi', avatarUrl: null },

        // We need a fresh chain where single returns the new follow

        // The mock auto-resolves single() with mockSingleResult,}    ]

        // so we set it to the new follow for the upsert .single() call

        // But first the check uses maybeSingle (returns null), then upsert uses single

        // Since both use the same mockSingleResult we need a workaround:

        // After the first maybeSingle call resolves null, swap result for single// ============================================================================    const notifications: any[] = []

        let callCount = 0

        const originalSingle = mockSingleResult// Setup: seed mock data before each test

        vi.mocked((await import('@/lib/supabase-server')).supabaseServer.from).mockImplementation(() => {

            const chain = createChain()// ============================================================================    // Set for every possible path format

            callCount++

            if (callCount === 1) {beforeEach(() => {

                // First from() call = check existing (maybeSingle → null)    for (const sep of ['/', '\\']) {

                chain.maybeSingle = vi.fn(() => Promise.resolve({ data: null, error: null }))

            } else if (callCount === 2) {        // Reset mock data        const base = `${process.cwd().replace(/\\/g, sep)}${sep}data${sep}`

                // Second from() call = upsert (single → new row)

                chain.single = vi.fn(() =>        mockFollowsData = [setFileContent(`${base}follows.json`, follows)

                    Promise.resolve({

                        data: {        { id: '1', follower_id: '10', following_id: '20', created_at: '2025-01-01T00:00:00Z' }, setFileContent(`${base}users.json`, users)

                            follower_id: '20',

                            following_id: '30',        { id: '2', follower_id: '10', following_id: '30', created_at: '2025-01-02T00:00:00Z' }, setFileContent(`${base}notifications.json`, notifications)

                            created_at: '2026-02-16T00:00:00Z',

                        },        { id: '3', follower_id: '30', following_id: '10', created_at: '2025-01-03T00:00:00Z' },    }

                        error: null,

                    }),    ]

                )

            } else {    mockError = null    vi.clearAllMocks()

                // Third from() call = get profile for notification

                chain.single = vi.fn(() =>    vi.clearAllMocks()

                    Promise.resolve({})

                        data: { id: '20', first_name: 'Mario', last_name: 'Rossi', avatar_url: null },

                        error: null,})

                    }),

                )// ============================================================================

                // Fourth from() call = insert notification

                chain.then = (resolve: any) => resolve({ data: {}, error: null })// ============================================================================// GET /api/follows

            }

            return chain// GET /api/follows// ============================================================================

        })

// ============================================================================describe('GET /api/follows', () => {

        const res = await POST(

            makeJsonRequest('http://localhost:3000/api/follows', {describe('GET /api/follows', () => {

                followerId: '20',    it('returns all follows when no query params', async () => {

                followingId: '30',

            }),        it('returns all follows when no query params', async () => {

        )            const req = makeRequest('http://localhost:3000/api/follows')

        expect(res.status).toBe(201)

        const data = await res.json()            const req = makeRequest('http://localhost:3000/api/follows')        const res = await GET(req)

        expect(data.followerId).toBe('20')

        expect(data.followingId).toBe('30')            const res = await GET(req)        const data = await res.json()

    })

            const data = await res.json()

    it('returns 400 for invalid JSON body', async () => {

        const req = new Request('http://localhost:3000/api/follows', {            expect(res.status).toBe(200)

            method: 'POST',

            headers: { 'Content-Type': 'application/json' },            expect(res.status).toBe(200)        expect(Array.isArray(data)).toBe(true)

            body: 'not json',

        })            expect(Array.isArray(data)).toBe(true)        // Should have CORS header

        const res = await POST(req)

        expect(res.status).toBe(400)            expect(res.headers.get('Access-Control-Allow-Origin')).toBe('*')        expect(res.headers.get('Access-Control-Allow-Origin')).toBe('*')

    })

})        })

    })

// ============================================================================

// DELETE /api/follows

// ============================================================================

describe('DELETE /api/follows', () => {    it('filters by followerId', async () => {

    it('returns 400 when missing params', async () => {        it('filters by followerId', async () => {

        const res = await DELETE(

            makeJsonRequest('http://localhost:3000/api/follows', { followerId: '10' }, 'DELETE'),            const req = makeRequest('http://localhost:3000/api/follows?followerId=10')        const req = makeRequest('http://localhost:3000/api/follows?followerId=10')

        )

        expect(res.status).toBe(400)            const res = await GET(req)        const res = await GET(req)

        const data = await res.json()

        expect(data.error).toBe('followerId_and_followingId_required')            const data = await res.json()        const data = await res.json()

    })



    it('removes an existing follow (200)', async () => {

        // delete().eq().eq() → resolves with no error            expect(res.status).toBe(200)        expect(res.status).toBe(200)

        mockQueryResult = { data: null, error: null }

            expect(data.every((f: any) => String(f.followerId) === '10')).toBe(true)        // User 10 follows users 20 and 30

        const res = await DELETE(

            makeJsonRequest(        })        expect(data.every((f: any) => String(f.followerId) === '10')).toBe(true)

                'http://localhost:3000/api/follows',

                { followerId: '10', followingId: '20' },    })

                'DELETE',

            ),    it('filters by followingId', async () => {

        )

        expect(res.status).toBe(200)        const req = makeRequest('http://localhost:3000/api/follows?followingId=10')    it('filters by followingId', async () => {

        const data = await res.json()

        expect(data.removed).toBe(1)            const res = await GET(req)        const req = makeRequest('http://localhost:3000/api/follows?followingId=10')

    })

            const data = await res.json()        const res = await GET(req)

    it('returns 400 for invalid JSON', async () => {

        const req = new Request('http://localhost:3000/api/follows', {            const data = await res.json()

            method: 'DELETE',

            headers: { 'Content-Type': 'application/json' },            expect(res.status).toBe(200)

            body: 'not json',

        })            expect(data.every((f: any) => String(f.followingId) === '10')).toBe(true)        expect(res.status).toBe(200)

        const res = await DELETE(req)

        expect(res.status).toBe(400)        })        expect(data.every((f: any) => String(f.followingId) === '10')).toBe(true)

    })

})    })

})

})

// ============================================================================

// POST /api/follows// ============================================================================

// ============================================================================// POST /api/follows

describe('POST /api/follows', () => {// ============================================================================

    it('creates a new follow (201)', async () => {
        describe('POST /api/follows', () => {

            // Mock: relation doesn't exist yet    it('creates a new follow (201)', async () => {

            mockFollowsData = []        const req = makeJsonRequest('http://localhost:3000/api/follows', {

                followerId: '20',

                const req = makeJsonRequest('http://localhost:3000/api/follows', {
                    followingId: '30',

                    followerId: '20',
                })

            followingId: '30', const res = await POST(req)

            })        const data = await res.json()

            const res = await POST(req)

            const data = await res.json()        expect(res.status).toBe(201)

            expect(data.followerId).toBe('20')

            expect(res.status).toBe(201)        expect(data.followingId).toBe('30')

            expect(data.followerId).toBe('20')        expect(data.id).toBeDefined()

            expect(data.followingId).toBe('30')        expect(data.createdAt).toBeDefined()

        })
    })



    it('returns 400 when followerId is missing', async () => {
        it('returns 400 when followerId is missing', async () => {

            const req = makeJsonRequest('http://localhost:3000/api/follows', {
                const req = makeJsonRequest('http://localhost:3000/api/follows', {

                    followingId: '20', followingId: '20',

                })
            })

            const res = await POST(req)        const res = await POST(req)

            const data = await res.json()        const data = await res.json()



            expect(res.status).toBe(400)        expect(res.status).toBe(400)

            expect(data.error).toBeDefined()        expect(data.error).toBe('followerId_and_followingId_required')

        })
    })



    it('returns 400 when followingId is missing', async () => {
        it('returns 400 when followingId is missing', async () => {

            const req = makeJsonRequest('http://localhost:3000/api/follows', {
                const req = makeJsonRequest('http://localhost:3000/api/follows', {

                    followerId: '10', followerId: '10',

                })
            })

            const res = await POST(req)        const res = await POST(req)

            const data = await res.json()        const data = await res.json()



            expect(res.status).toBe(400)        expect(res.status).toBe(400)

            expect(data.error).toBeDefined()        expect(data.error).toBe('followerId_and_followingId_required')

        })
    })



    it('returns 400 for self-follow', async () => {
        it('returns 400 for self-follow', async () => {

            const req = makeJsonRequest('http://localhost:3000/api/follows', {
                const req = makeJsonRequest('http://localhost:3000/api/follows', {

                    followerId: '10', followerId: '10',

                    followingId: '10', followingId: '10',

                })
            })

            const res = await POST(req)        const res = await POST(req)

            const data = await res.json()        const data = await res.json()



            expect(res.status).toBe(400)        expect(res.status).toBe(400)

            expect(data.error).toBeDefined()        expect(data.error).toBe('cannot_follow_self')

        })
    })



    it('returns 409 for duplicate follow', async () => {
        it('returns 409 for duplicate follow', async () => {

            // Mock: relation already exists        const req = makeJsonRequest('http://localhost:3000/api/follows', {

            mockFollowsData = [{ id: '1', follower_id: '10', following_id: '20', created_at: '2025-01-01T00:00:00Z' }]            followerId: '10',

                followingId: '20',

        const req = makeJsonRequest('http://localhost:3000/api/follows', {})

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

            it('removes an existing follow', async () => {
                expect(res.status).toBe(400)

                // Mock: relation exists    })

                mockFollowsData = [{ id: '1', follower_id: '10', following_id: '20', created_at: '2025-01-01T00:00:00Z' }]
            })



            const req = makeJsonRequest(// ============================================================================

                'http://localhost:3000/api/follows',// DELETE /api/follows

                { followerId: '10', followingId: '20' },// ============================================================================

                'DELETE', describe('DELETE /api/follows', () => {

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

        'http://localhost:3000/api/follows', it('returns 404 when relation not found', async () => {

            { followerId: '99', followingId: '88' }, const req = makeJsonRequest(

                'DELETE', 'http://localhost:3000/api/follows',

            )            { followerId: '99', followingId: '88' },

            const res = await DELETE(req)            'DELETE',

        const data = await res.json()        )

        const res = await DELETE(req)

    expect(res.status).toBe(404)        const data = await res.json()

    expect(data.warning).toBeDefined()

})        expect(res.status).toBe(404)

expect(data.warning).toBe('relation_not_found')

it('returns 400 when missing params', async () => { })

const req = makeJsonRequest(

    'http://localhost:3000/api/follows', it('returns 400 when missing params', async () => {

        { followerId: '10' }, const req = makeJsonRequest(

            'DELETE', 'http://localhost:3000/api/follows',

        )            { followerId: '10' },

        const res = await DELETE(req)            'DELETE',

        const data = await res.json()        )

        const res = await DELETE(req)

expect(res.status).toBe(400)        const data = await res.json()

expect(data.error).toBeDefined()

    }) expect(res.status).toBe(400)

}) expect(data.error).toBe('followerId_and_followingId_required')

    })
})
