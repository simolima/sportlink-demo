import { beforeEach, describe, expect, it, vi } from 'vitest'

function createChain(config?: {
    thenResult?: { data: any; error: any }
}) {
    const chain: any = {}

    const methods = ['select', 'eq', 'in', 'order']
    for (const method of methods) {
        chain[method] = vi.fn(() => chain)
    }

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

import { GET } from '@/app/api/lookup/positions/route'
import { supabaseServer } from '@/lib/supabase-server'

function makeRequest(url: string): Request {
    return new Request(url)
}

beforeEach(() => {
    vi.clearAllMocks()
})

describe('GET /api/lookup/positions', () => {
    it('returns 400 when params are missing', async () => {
        const res = await GET(makeRequest('http://localhost:3000/api/lookup/positions'))
        const data = await res.json()

        expect(res.status).toBe(400)
        expect(data.error).toBe('sportName and roleId required')
    })

    it('returns empty array when sport is not found', async () => {
        vi.mocked(supabaseServer.from).mockImplementationOnce(() =>
            createChain({
                thenResult: { data: [], error: null },
            }),
        )

        const res = await GET(
            makeRequest('http://localhost:3000/api/lookup/positions?sportName=Pallavolo&roleId=coach'),
        )
        const data = await res.json()

        expect(res.status).toBe(200)
        expect(data).toEqual([])
    })

    it('returns positions using Pallavolo/Volley alias mapping', async () => {
        const sportsChain = createChain({
            thenResult: {
                data: [{ id: 10, name: 'Volley' }],
                error: null,
            },
        })

        vi.mocked(supabaseServer.from)
            .mockImplementationOnce(() => sportsChain)
            .mockImplementationOnce(() =>
                createChain({
                    thenResult: {
                        data: [
                            { id: 1, name: 'Head Coach', category: null },
                            { id: 2, name: 'Assistant Coach', category: null },
                        ],
                        error: null,
                    },
                }),
            )

        const res = await GET(
            makeRequest('http://localhost:3000/api/lookup/positions?sportName=Pallavolo&roleId=coach'),
        )
        const data = await res.json()

        expect(res.status).toBe(200)
        expect(data).toEqual([
            { id: 1, name: 'Head Coach', category: null },
            { id: 2, name: 'Assistant Coach', category: null },
        ])

        expect(sportsChain.in).toHaveBeenCalledWith('name', ['Pallavolo', 'Volley'])
    })

    it('returns 500 when lookup_sports query fails', async () => {
        vi.mocked(supabaseServer.from).mockImplementationOnce(() =>
            createChain({
                thenResult: { data: null, error: { message: 'db_down' } },
            }),
        )

        const res = await GET(
            makeRequest('http://localhost:3000/api/lookup/positions?sportName=Calcio&roleId=player'),
        )
        const data = await res.json()

        expect(res.status).toBe(500)
        expect(data.error).toBe('db_down')
    })
})
