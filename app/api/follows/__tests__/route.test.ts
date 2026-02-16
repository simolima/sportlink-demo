import { describe, it, expect, vi, beforeEach } from 'vitest'

// ============================================================================
// Mock Supabase BEFORE importing the route
// ============================================================================

let mockQueryResult: { data: any; error: any } = { data: [], error: null }
let mockSingleResult: { data: any; error: any } = { data: null, error: null }

function createChain() {
    const chain: any = {}

    const methods = [
        'select', 'insert', 'upsert', 'delete', 'update',
        'eq', 'neq', 'is', 'order',
    ]
    for (const m of methods) {
        chain[m] = vi.fn(() => chain)
    }

    chain.maybeSingle = vi.fn(() => Promise.resolve(mockSingleResult))
    chain.single = vi.fn(() => Promise.resolve(mockSingleResult))
    chain.then = (resolve: any) => resolve(mockQueryResult)

    return chain
}

vi.mock('@/lib/supabase-server', () => ({
    supabaseServer: {
        from: vi.fn(() => createChain()),
    },
}))

vi.mock('@/lib/cors', () => ({
    withCors: (res: any) => {
        res.headers.set('Access-Control-Allow-Origin', '*')
        return res
    },
    handleOptions: () => new Response(null, { status: 204 }),
}))

// Import AFTER mocking
import { GET, POST, DELETE } from '@/app/api/follows/route'

// ============================================================================
// Helpers
// ============================================================================
function makeRequest(url: string): Request {
    return new Request(url)
}

function makeJsonRequest(url: string, body: any, method = 'POST'): Request {
    return new Request(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
    })
}

// ============================================================================
// Reset before each test
// ============================================================================
beforeEach(() => {
    mockQueryResult = { data: [], error: null }
    mockSingleResult = { data: null, error: null }
    vi.clearAllMocks()
})

// ============================================================================
// GET /api/follows
// ============================================================================
describe('GET /api/follows', () => {
    it('returns 200 with mapped follows', async () => {
        mockQueryResult = {
            data: [
                { follower_id: '10', following_id: '20', created_at: '2025-01-01T00:00:00Z' },
                { follower_id: '10', following_id: '30', created_at: '2025-01-02T00:00:00Z' },
            ],
            error: null,
        }

        const res = await GET(makeRequest('http://localhost:3000/api/follows'))
        const data = await res.json()

        expect(res.status).toBe(200)
        expect(Array.isArray(data)).toBe(true)
        expect(data.length).toBe(2)
        expect(data[0].followerId).toBe('10')
        expect(data[0].followingId).toBe('20')
        expect(res.headers.get('Access-Control-Allow-Origin')).toBe('*')
    })

    it('returns 500 when Supabase errors', async () => {
        mockQueryResult = { data: null, error: { message: 'db error' } }

        const res = await GET(makeRequest('http://localhost:3000/api/follows'))
        expect(res.status).toBe(500)
    })
})

// ============================================================================
// POST /api/follows
// ============================================================================
describe('POST /api/follows', () => {
    it('returns 400 when followerId is missing', async () => {
        const res = await POST(
            makeJsonRequest('http://localhost:3000/api/follows', { followingId: '20' }),
        )
        expect(res.status).toBe(400)
        const data = await res.json()
        expect(data.error).toBe('followerId_and_followingId_required')
    })

    it('returns 400 when followingId is missing', async () => {
        const res = await POST(
            makeJsonRequest('http://localhost:3000/api/follows', { followerId: '10' }),
        )
        expect(res.status).toBe(400)
        const data = await res.json()
        expect(data.error).toBe('followerId_and_followingId_required')
    })

    it('returns 400 for self-follow', async () => {
        const res = await POST(
            makeJsonRequest('http://localhost:3000/api/follows', {
                followerId: '10',
                followingId: '10',
            }),
        )
        expect(res.status).toBe(400)
        const data = await res.json()
        expect(data.error).toBe('cannot_follow_self')
    })

    it('returns 409 when already following', async () => {
        mockSingleResult = {
            data: { follower_id: '10', following_id: '20' },
            error: null,
        }

        const res = await POST(
            makeJsonRequest('http://localhost:3000/api/follows', {
                followerId: '10',
                followingId: '20',
            }),
        )
        expect(res.status).toBe(409)
        const data = await res.json()
        expect(data.error).toBe('already_following')
    })

    it('creates a new follow (201)', async () => {
        let callCount = 0
        const { supabaseServer } = await import('@/lib/supabase-server')
        vi.mocked(supabaseServer.from).mockImplementation(() => {
            const chain = createChain()
            callCount++
            if (callCount === 1) {
                chain.maybeSingle = vi.fn(() => Promise.resolve({ data: null, error: null }))
            } else if (callCount === 2) {
                chain.single = vi.fn(() =>
                    Promise.resolve({
                        data: {
                            follower_id: '20',
                            following_id: '30',
                            created_at: '2026-02-16T00:00:00Z',
                        },
                        error: null,
                    }),
                )
            } else {
                chain.single = vi.fn(() =>
                    Promise.resolve({
                        data: { id: '20', first_name: 'Mario', last_name: 'Rossi', avatar_url: null },
                        error: null,
                    }),
                )
                chain.then = (resolve: any) => resolve({ data: {}, error: null })
            }
            return chain
        })

        const res = await POST(
            makeJsonRequest('http://localhost:3000/api/follows', {
                followerId: '20',
                followingId: '30',
            }),
        )
        expect(res.status).toBe(201)
        const data = await res.json()
        expect(data.followerId).toBe('20')
        expect(data.followingId).toBe('30')
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
    it('returns 400 when missing params', async () => {
        const res = await DELETE(
            makeJsonRequest('http://localhost:3000/api/follows', { followerId: '10' }, 'DELETE'),
        )
        expect(res.status).toBe(400)
        const data = await res.json()
        expect(data.error).toBe('followerId_and_followingId_required')
    })

    it('removes an existing follow (200)', async () => {
        mockQueryResult = { data: null, error: null }

        const res = await DELETE(
            makeJsonRequest(
                'http://localhost:3000/api/follows',
                { followerId: '10', followingId: '20' },
                'DELETE',
            ),
        )
        expect(res.status).toBe(200)
        const data = await res.json()
        expect(data.removed).toBe(1)
    })

    it('returns 400 for invalid JSON', async () => {
        const req = new Request('http://localhost:3000/api/follows', {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: 'not json',
        })
        const res = await DELETE(req)
        expect(res.status).toBe(400)
    })
})
