import { beforeEach, describe, expect, it, vi } from 'vitest'

function createChain(config?: {
    maybeSingleResult?: { data: any; error: any }
    singleResult?: { data: any; error: any }
    thenResult?: { data: any; error: any }
}) {
    const chain: any = {}

    const methods = ['select', 'insert', 'update', 'delete', 'eq', 'is', 'in', 'ilike', 'order', 'limit']
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

import { POST } from '@/app/api/studios/route'
import { getUserIdFromAuthToken, supabaseServer } from '@/lib/supabase-server'

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

describe('POST /api/studios', () => {
    it('allows medical role from profile_roles even if profiles.role_id is not medical', async () => {
        vi.mocked(supabaseServer.from)
            .mockImplementationOnce(() =>
                createChain({
                    maybeSingleResult: {
                        data: { role_id: 'nutritionist' },
                        error: null,
                    },
                }),
            )
            .mockImplementationOnce(() =>
                createChain({
                    maybeSingleResult: { data: null, error: null },
                }),
            )
            .mockImplementationOnce(() =>
                createChain({
                    singleResult: {
                        data: {
                            id: 'studio-1',
                            owner_id: 'user-1',
                            name: 'Studio Test',
                            city: 'Milano',
                            address: null,
                            phone: null,
                            website: null,
                            logo_url: null,
                            description: null,
                            services_offered: [],
                            created_at: '2026-03-07T00:00:00.000Z',
                            updated_at: '2026-03-07T00:00:00.000Z',
                        },
                        error: null,
                    },
                }),
            )

        const res = await POST(
            makeJsonRequest('http://localhost:3000/api/studios', {
                name: 'Studio Test',
                city: 'Milano',
            }),
        )

        expect(res.status).toBe(201)
        const data = await res.json()
        expect(data.id).toBe('studio-1')
    })

    it('returns 403 when user has no medical role in profile_roles nor profiles.role_id', async () => {
        vi.mocked(supabaseServer.from)
            .mockImplementationOnce(() =>
                createChain({
                    maybeSingleResult: { data: null, error: null },
                }),
            )
            .mockImplementationOnce(() =>
                createChain({
                    maybeSingleResult: {
                        data: { role_id: 'agent' },
                        error: null,
                    },
                }),
            )

        const res = await POST(
            makeJsonRequest('http://localhost:3000/api/studios', {
                name: 'Studio Test',
                city: 'Milano',
            }),
        )

        expect(res.status).toBe(403)
        const data = await res.json()
        expect(data.error).toContain('Solo Preparatori Atletici')
    })
})
