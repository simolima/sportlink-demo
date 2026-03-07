import { beforeEach, describe, expect, it, vi } from 'vitest'

function createChain(config?: {
    thenResult?: { data: any; error: any }
    maybeSingleResult?: { data: any; error: any }
    singleResult?: { data: any; error: any }
}) {
    const chain: any = {}

    const methods = ['select', 'insert', 'delete', 'eq', 'is', 'in', 'order', 'limit']
    for (const method of methods) {
        chain[method] = vi.fn(() => chain)
    }

    chain.maybeSingle = vi.fn(() => Promise.resolve(config?.maybeSingleResult ?? { data: null, error: null }))
    chain.single = vi.fn(() => Promise.resolve(config?.singleResult ?? { data: null, error: null }))
    chain.then = (resolve: any) => resolve(config?.thenResult ?? { data: [], error: null })

    return chain
}

vi.mock('@/lib/supabase-server', () => ({
    supabaseServer: {
        from: vi.fn(),
    },
    getUserIdFromAuthToken: vi.fn(async () => 'user-1'),
}))

vi.mock('@/lib/cors', () => ({
    withCors: (res: any) => {
        res.headers.set('Access-Control-Allow-Origin', '*')
        return res
    },
    handleOptions: () => new Response(null, { status: 204 }),
}))

import { GET, POST } from '@/app/api/users/roles/route'
import { getUserIdFromAuthToken, supabaseServer } from '@/lib/supabase-server'

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

beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(getUserIdFromAuthToken).mockResolvedValue('user-1')
})

describe('GET /api/users/roles', () => {
    it('returns 400 when no userId and no authenticated user', async () => {
        vi.mocked(getUserIdFromAuthToken).mockResolvedValue(null)

        const res = await GET(makeRequest('http://localhost:3000/api/users/roles'))
        const data = await res.json()

        expect(res.status).toBe(400)
        expect(data.error).toBe('userId required')
    })

    it('returns enriched roles from profile_roles + profile_sports', async () => {
        vi.mocked(supabaseServer.from)
            .mockImplementationOnce(() =>
                createChain({
                    thenResult: {
                        data: [
                            { role_id: 'coach', is_primary: false },
                            { role_id: 'player', is_primary: true },
                        ],
                        error: null,
                    },
                }),
            )
            .mockImplementationOnce(() =>
                createChain({
                    thenResult: {
                        data: [
                            { role_id: 'coach', is_main_sport: true, lookup_sports: { name: 'Pallavolo' } },
                            { role_id: 'player', is_main_sport: true, lookup_sports: { name: 'Calcio' } },
                        ],
                        error: null,
                    },
                }),
            )

        const res = await GET(makeRequest('http://localhost:3000/api/users/roles?userId=user-1'))
        const data = await res.json()

        expect(res.status).toBe(200)
        expect(data).toEqual([
            { role_id: 'coach', is_primary: false, sport_names: ['Pallavolo'] },
            { role_id: 'player', is_primary: true, sport_names: ['Calcio'] },
        ])
    })

    it('falls back to profiles.role_id when profile_roles is empty', async () => {
        vi.mocked(supabaseServer.from)
            .mockImplementationOnce(() =>
                createChain({
                    thenResult: { data: [], error: null },
                }),
            )
            .mockImplementationOnce(() =>
                createChain({
                    singleResult: {
                        data: { role_id: 'coach' },
                        error: null,
                    },
                }),
            )
            .mockImplementationOnce(() =>
                createChain({
                    maybeSingleResult: {
                        data: { lookup_sports: { name: 'Volley' } },
                        error: null,
                    },
                }),
            )

        const res = await GET(makeRequest('http://localhost:3000/api/users/roles?userId=user-1'))
        const data = await res.json()

        expect(res.status).toBe(200)
        expect(data).toEqual([
            {
                role_id: 'coach',
                is_primary: true,
                sport_names: ['Volley'],
            },
        ])
    })
})

describe('POST /api/users/roles', () => {
    it('returns 401 when user is not authenticated', async () => {
        vi.mocked(getUserIdFromAuthToken).mockResolvedValue(null)

        const res = await POST(
            makeJsonRequest('http://localhost:3000/api/users/roles', {
                roleId: 'coach',
                sports: ['Pallavolo'],
            }),
        )

        expect(res.status).toBe(401)
        const data = await res.json()
        expect(data.error).toBe('unauthorized')
    })

    it('returns 400 for invalid role', async () => {
        const res = await POST(
            makeJsonRequest('http://localhost:3000/api/users/roles', {
                roleId: 'invalid_role',
                sports: ['Pallavolo'],
            }),
        )

        expect(res.status).toBe(400)
        const data = await res.json()
        expect(data.error).toBe('invalid_role_id')
    })

    it('returns 409 when role already exists', async () => {
        vi.mocked(supabaseServer.from).mockImplementationOnce(() =>
            createChain({
                maybeSingleResult: {
                    data: { role_id: 'coach' },
                    error: null,
                },
            }),
        )

        const res = await POST(
            makeJsonRequest('http://localhost:3000/api/users/roles', {
                roleId: 'coach',
                sports: ['Pallavolo'],
            }),
        )

        expect(res.status).toBe(409)
        const data = await res.json()
        expect(data.error).toBe('role_already_exists')
    })

    it('creates a role and maps Pallavolo to Volley sport id', async () => {
        const profileSportsInsertChain = createChain({
            thenResult: { data: [{ id: 1 }], error: null },
        })

        vi.mocked(supabaseServer.from)
            .mockImplementationOnce(() =>
                createChain({
                    maybeSingleResult: { data: null, error: null },
                }),
            )
            .mockImplementationOnce(() =>
                createChain({
                    thenResult: { data: [{ role_id: 'coach' }], error: null },
                }),
            )
            .mockImplementationOnce(() =>
                createChain({
                    thenResult: {
                        data: [
                            { id: 1, name: 'Calcio' },
                            { id: 2, name: 'Volley' },
                        ],
                        error: null,
                    },
                }),
            )
            .mockImplementationOnce(() => profileSportsInsertChain)

        const res = await POST(
            makeJsonRequest('http://localhost:3000/api/users/roles', {
                roleId: 'coach',
                sports: ['Pallavolo'],
                primaryPositionId: 99,
            }),
        )
        const data = await res.json()

        expect(res.status).toBe(201)
        expect(data.roleId).toBe('coach')

        expect(profileSportsInsertChain.insert).toHaveBeenCalledWith([
            {
                user_id: 'user-1',
                sport_id: 2,
                role_id: 'coach',
                is_main_sport: true,
                primary_position_id: 99,
            },
        ])
    })
})
