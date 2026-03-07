import { beforeEach, describe, expect, it, vi } from 'vitest'

let callCount = 0
let hasDsRoleInProfileRoles = true
let fallbackProfileRoleId: string | null = 'coach'

function createChain(config?: {
    maybeSingleResult?: { data: any; error: any }
    singleResult?: { data: any; error: any }
    thenResult?: { data: any; error: any }
}) {
    const chain: any = {}

    const methods = ['select', 'insert', 'update', 'delete', 'eq', 'is', 'in', 'order', 'limit']
    for (const method of methods) {
        chain[method] = vi.fn(() => chain)
    }

    chain.maybeSingle = vi.fn(() => Promise.resolve(config?.maybeSingleResult ?? { data: null, error: null }))
    chain.single = vi.fn(() => Promise.resolve(config?.singleResult ?? { data: null, error: null }))
    chain.then = (resolve: any) => resolve(config?.thenResult ?? { data: [], error: null })

    return chain
}

vi.mock('next/cache', () => ({
    revalidatePath: vi.fn(),
}))

vi.mock('@/lib/supabase-server', () => ({
    supabaseServer: {
        from: vi.fn(() => {
            callCount++
            // 1) check ownedClub => no owner
            if (callCount === 1) {
                return createChain({ maybeSingleResult: { data: null, error: null } })
            }
            // 2) check membership => Staff
            if (callCount === 2) {
                return createChain({ maybeSingleResult: { data: { club_role: 'Staff' }, error: null } })
            }
            // 3) check profile_roles => sporting_director active (configurabile)
            if (callCount === 3) {
                return createChain({
                    maybeSingleResult: {
                        data: hasDsRoleInProfileRoles ? { role_id: 'sporting_director' } : null,
                        error: null,
                    },
                })
            }

            // 4) se DS non è in profile_roles, check fallback su profiles.role_id
            if (callCount === 4) {
                if (!hasDsRoleInProfileRoles) {
                    return createChain({
                        maybeSingleResult: {
                            data: fallbackProfileRoleId ? { role_id: fallbackProfileRoleId } : null,
                            error: null,
                        },
                    })
                }

                return createChain({ singleResult: { data: { id: 'team-1' }, error: null } })
            }

            // 5) insert team => success (ramo fallback positivo)
            if (callCount === 5) {
                return createChain({ singleResult: { data: { id: 'team-1' }, error: null } })
            }

            return createChain()
        }),
    },
}))

import { createTeam } from '@/app/actions/team-management-actions'

beforeEach(() => {
    vi.clearAllMocks()
    callCount = 0
    hasDsRoleInProfileRoles = true
    fallbackProfileRoleId = 'coach'
})

describe('createTeam', () => {
    it('allows Staff user when sporting_director is present in active profile_roles', async () => {
        hasDsRoleInProfileRoles = true
        fallbackProfileRoleId = 'coach'

        const result = await createTeam(
            {
                clubId: '11111111-1111-1111-1111-111111111111',
                name: 'Primavera',
                category: 'U19',
                season: '2025/2026',
            },
            'user-1',
        )

        expect(result.success).toBe(true)
        if (result.success) {
            expect(result.data?.teamId).toBe('team-1')
        }
    })

    it('denies Staff user when sporting_director is missing in profile_roles and profiles.role_id', async () => {
        hasDsRoleInProfileRoles = false
        fallbackProfileRoleId = 'coach'

        const result = await createTeam(
            {
                clubId: '11111111-1111-1111-1111-111111111111',
                name: 'Primavera',
                category: 'U19',
                season: '2025/2026',
            },
            'user-1',
        )

        expect(result.success).toBe(false)
        if (!result.success) {
            expect(result.error).toContain('permessi')
        }
    })
})
