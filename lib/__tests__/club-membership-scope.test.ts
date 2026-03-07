import { beforeEach, describe, expect, it, vi } from 'vitest'
import { syncLegacySelectedClubIdForRole } from '../club-membership-scope'

function createMockStorage() {
    const store = new Map<string, string>()
    return {
        getItem: (key: string) => (store.has(key) ? store.get(key)! : null),
        setItem: (key: string, value: string) => {
            store.set(key, String(value))
        },
        removeItem: (key: string) => {
            store.delete(key)
        },
        clear: () => {
            store.clear()
        },
    }
}

describe('syncLegacySelectedClubIdForRole', () => {
    beforeEach(() => {
        vi.stubGlobal('localStorage', createMockStorage())
        localStorage.clear()
    })

    it('copies scoped selected club to legacy key when scoped key exists', () => {
        localStorage.setItem('selectedClubId:coach', 'club-123')
        localStorage.setItem('selectedClubId', 'legacy-old')

        syncLegacySelectedClubIdForRole('coach')

        expect(localStorage.getItem('selectedClubId')).toBe('club-123')
    })

    it('removes legacy selected club when scoped key does not exist', () => {
        localStorage.setItem('selectedClubId', 'legacy-old')

        syncLegacySelectedClubIdForRole('coach')

        expect(localStorage.getItem('selectedClubId')).toBeNull()
    })

    it('uses fallback key when role is invalid or missing', () => {
        localStorage.setItem('selectedClubId', 'club-999')

        syncLegacySelectedClubIdForRole('invalid-role')
        expect(localStorage.getItem('selectedClubId')).toBe('club-999')

        syncLegacySelectedClubIdForRole(null)
        expect(localStorage.getItem('selectedClubId')).toBe('club-999')
    })
})
