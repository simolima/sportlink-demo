import { beforeEach, describe, expect, it, vi } from 'vitest'

function createChain(config?: {
    maybeSingleResult?: { data: any; error: any }
    singleResult?: { data: any; error: any }
    thenResult?: { data: any; error: any }
}) {
    const chain: any = {}

    const methods = ['select', 'insert', 'upsert', 'update', 'delete', 'eq', 'is', 'in', 'ilike', 'order']
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
}))

vi.mock('@/lib/cors', () => ({
    withCors: (res: any) => {
        res.headers.set('Access-Control-Allow-Origin', '*')
        return res
    },
    handleOptions: () => new Response(null, { status: 204 }),
}))

import { POST } from '@/app/api/clubs/route'
import { supabaseServer } from '@/lib/supabase-server'

function makeJsonRequest(url: string, body: any, method = 'POST'): Request {
    return new Request(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
    })
}

beforeEach(() => {
    vi.clearAllMocks()
})

describe('POST /api/clubs', () => {
    it('allows creator when sporting_director exists in profile_roles (multi-profile)', async () => {
        vi.mocked(supabaseServer.from)
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
                        data: { role_id: 'sporting_director' },
                        error: null,
                    },
                }),
            )
            .mockImplementationOnce(() =>
                createChain({
                    singleResult: {
                        data: null,
                        error: { message: 'insert_failed' },
                    },
                }),
            )

        const res = await POST(
            makeJsonRequest('http://localhost:3000/api/clubs', {
                name: 'Club Test',
                city: 'Roma',
                createdBy: 'user-1',
                organizationId: 'org-1',
            }),
        )

        expect(res.status).toBe(500)
        const data = await res.json()
        expect(data.error).toBe('insert_failed')
    })

    it('returns 403 when creator is not sporting_director in any active role', async () => {
        vi.mocked(supabaseServer.from)
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
                        data: null,
                        error: null,
                    },
                }),
            )
            .mockImplementationOnce(() =>
                createChain({
                    maybeSingleResult: {
                        data: { role_id: 'coach' },
                        error: null,
                    },
                }),
            )

        const res = await POST(
            makeJsonRequest('http://localhost:3000/api/clubs', {
                name: 'Club Test',
                city: 'Roma',
                createdBy: 'user-1',
                organizationId: 'org-1',
            }),
        )

        expect(res.status).toBe(403)
        const data = await res.json()
        expect(data.error).toContain('Direttori Sportivi')
    })
})
