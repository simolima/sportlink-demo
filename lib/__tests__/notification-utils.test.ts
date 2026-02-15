import { describe, it, expect } from 'vitest'
import {
    getNotificationCategory,
    isMessageNotification,
    filterSystemNotifications,
    getNotificationDestination,
    getNotificationColor,
    getNotificationDotColor,
    formatNotificationType,
    isNotificationEnabled,
    groupNotifications,
    isGroupedNotification,
    DEFAULT_NOTIFICATION_PREFERENCES,
    NOTIFICATION_CATEGORIES,
    CATEGORY_TRANSLATIONS,
    CATEGORY_DESCRIPTIONS,
    type GroupedNotification,
} from '../notification-utils'
import type { Notification } from '../types'

// ============================================================================
// HELPER: crea una notifica fake per i test
// ============================================================================
function makeNotification(overrides: Partial<Notification> = {}): Notification {
    return {
        id: overrides.id ?? 1,
        userId: overrides.userId ?? 'user-1',
        type: overrides.type ?? 'new_follower',
        title: overrides.title ?? 'Test',
        message: overrides.message ?? 'Test message',
        metadata: overrides.metadata ?? {},
        read: overrides.read ?? false,
        createdAt: overrides.createdAt ?? new Date().toISOString(),
    }
}

// ============================================================================
// getNotificationCategory
// ============================================================================
describe('getNotificationCategory', () => {
    it('returns "follower" for new_follower', () => {
        expect(getNotificationCategory('new_follower')).toBe('follower')
    })

    it('returns "messages" for message_received', () => {
        expect(getNotificationCategory('message_received')).toBe('messages')
    })

    it('returns "applications" for candidacy_accepted', () => {
        expect(getNotificationCategory('candidacy_accepted')).toBe('applications')
    })

    it('returns "affiliations" for affiliation_request', () => {
        expect(getNotificationCategory('affiliation_request')).toBe('affiliations')
    })

    it('returns "club" for club_join_request', () => {
        expect(getNotificationCategory('club_join_request')).toBe('club')
    })

    it('returns "opportunities" for new_opportunity', () => {
        expect(getNotificationCategory('new_opportunity')).toBe('opportunities')
    })

    it('returns "permissions" for permission_granted', () => {
        expect(getNotificationCategory('permission_granted')).toBe('permissions')
    })

    it('returns null for unknown type', () => {
        expect(getNotificationCategory('tipo_inventato')).toBeNull()
    })
})

// ============================================================================
// isMessageNotification
// ============================================================================
describe('isMessageNotification', () => {
    it('returns true for message_received', () => {
        const notif = makeNotification({ type: 'message_received' })
        expect(isMessageNotification(notif)).toBe(true)
    })

    it('returns false for new_follower', () => {
        const notif = makeNotification({ type: 'new_follower' })
        expect(isMessageNotification(notif)).toBe(false)
    })

    it('returns false for affiliation_request', () => {
        const notif = makeNotification({ type: 'affiliation_request' })
        expect(isMessageNotification(notif)).toBe(false)
    })
})

// ============================================================================
// filterSystemNotifications
// ============================================================================
describe('filterSystemNotifications', () => {
    it('removes message_received notifications', () => {
        const notifications: Notification[] = [
            makeNotification({ id: 1, type: 'new_follower' }),
            makeNotification({ id: 2, type: 'message_received' }),
            makeNotification({ id: 3, type: 'new_follower' }),
        ]
        const result = filterSystemNotifications(notifications)
        expect(result).toHaveLength(2)
        expect(result.every(n => n.type === 'new_follower')).toBe(true)
    })

    it('returns empty array for empty input', () => {
        expect(filterSystemNotifications([])).toEqual([])
    })

    it('returns all notifications when none are messages', () => {
        const notifications: Notification[] = [
            makeNotification({ id: 1, type: 'new_follower' }),
            makeNotification({ id: 2, type: 'affiliation_request' }),
        ]
        const result = filterSystemNotifications(notifications)
        expect(result).toHaveLength(2)
    })
})

// ============================================================================
// getNotificationDestination
// ============================================================================
describe('getNotificationDestination', () => {
    it('navigates to follower profile for new_follower', () => {
        const result = getNotificationDestination('new_follower', { followerId: '42' })
        expect(result).toBe('/profile/42')
    })

    it('navigates to follower profile using fromUserId fallback', () => {
        const result = getNotificationDestination('new_follower', { fromUserId: '99' })
        expect(result).toBe('/profile/99')
    })

    it('returns null for new_follower without metadata IDs', () => {
        const result = getNotificationDestination('new_follower', {})
        expect(result).toBeNull()
    })

    it('navigates to conversation for message_received', () => {
        const result = getNotificationDestination('message_received', { conversationId: '7' })
        expect(result).toBe('/messages/7')
    })

    it('falls back to fromUserId for message_received without conversationId', () => {
        const result = getNotificationDestination('message_received', { fromUserId: '5' })
        expect(result).toBe('/messages/5')
    })

    it('falls back to /messages when no metadata for message_received', () => {
        const result = getNotificationDestination('message_received', {})
        expect(result).toBe('/messages')
    })

    it('navigates to /my-applications for candidacy_accepted', () => {
        expect(getNotificationDestination('candidacy_accepted')).toBe('/my-applications')
    })

    it('navigates to /my-applications for candidacy_rejected', () => {
        expect(getNotificationDestination('candidacy_rejected')).toBe('/my-applications')
    })

    it('navigates to /club-applications for new_application', () => {
        expect(getNotificationDestination('new_application')).toBe('/club-applications')
    })

    it('navigates to /player/affiliations for affiliation_request', () => {
        expect(getNotificationDestination('affiliation_request')).toBe('/player/affiliations')
    })

    it('navigates to /agent/affiliations for affiliation_accepted', () => {
        expect(getNotificationDestination('affiliation_accepted')).toBe('/agent/affiliations')
    })

    it('navigates to /clubs for club_join_request', () => {
        expect(getNotificationDestination('club_join_request')).toBe('/clubs')
    })

    it('navigates to opportunity page when opportunityId present', () => {
        const result = getNotificationDestination('new_opportunity', { opportunityId: '123' })
        expect(result).toBe('/opportunities/123')
    })

    it('navigates to /opportunities when no opportunityId', () => {
        const result = getNotificationDestination('new_opportunity', {})
        expect(result).toBe('/opportunities')
    })

    it('returns null for unknown type', () => {
        expect(getNotificationDestination('tipo_sconosciuto')).toBeNull()
    })
})

// ============================================================================
// getNotificationColor
// ============================================================================
describe('getNotificationColor', () => {
    it('returns blue for new_follower', () => {
        expect(getNotificationColor('new_follower')).toBe('bg-blue-100 text-blue-800')
    })

    it('returns green for candidacy_accepted', () => {
        expect(getNotificationColor('candidacy_accepted')).toBe('bg-green-100 text-green-800')
    })

    it('returns red for candidacy_rejected', () => {
        expect(getNotificationColor('candidacy_rejected')).toBe('bg-red-100 text-red-800')
    })

    it('returns purple for affiliation_request', () => {
        expect(getNotificationColor('affiliation_request')).toBe('bg-purple-100 text-purple-800')
    })

    it('returns cyan for message_received', () => {
        expect(getNotificationColor('message_received')).toBe('bg-cyan-100 text-cyan-800')
    })

    it('returns yellow for new_application', () => {
        expect(getNotificationColor('new_application')).toBe('bg-yellow-100 text-yellow-800')
    })

    it('returns gray for unknown type', () => {
        expect(getNotificationColor('tipo_sconosciuto')).toBe('bg-gray-100 text-gray-800')
    })
})

// ============================================================================
// getNotificationDotColor
// ============================================================================
describe('getNotificationDotColor', () => {
    it('returns bg-blue-500 for new_follower', () => {
        expect(getNotificationDotColor('new_follower')).toBe('bg-blue-500')
    })

    it('returns bg-cyan-500 for message_received', () => {
        expect(getNotificationDotColor('message_received')).toBe('bg-cyan-500')
    })

    it('returns bg-blue-500 for unknown type (default)', () => {
        expect(getNotificationDotColor('tipo_sconosciuto')).toBe('bg-blue-500')
    })
})

// ============================================================================
// formatNotificationType
// ============================================================================
describe('formatNotificationType', () => {
    it('converts snake_case to UPPER CASE', () => {
        expect(formatNotificationType('new_follower')).toBe('NEW FOLLOWER')
    })

    it('converts single word', () => {
        expect(formatNotificationType('test')).toBe('TEST')
    })

    it('converts multiple underscores', () => {
        expect(formatNotificationType('a_b_c')).toBe('A B C')
    })
})

// ============================================================================
// isNotificationEnabled
// ============================================================================
describe('isNotificationEnabled', () => {
    it('returns true when category is enabled', () => {
        const prefs = { ...DEFAULT_NOTIFICATION_PREFERENCES, follower: true }
        expect(isNotificationEnabled('new_follower', prefs)).toBe(true)
    })

    it('returns false when category is disabled', () => {
        const prefs = { ...DEFAULT_NOTIFICATION_PREFERENCES, follower: false }
        expect(isNotificationEnabled('new_follower', prefs)).toBe(false)
    })

    it('returns true for unknown type (safe default)', () => {
        expect(isNotificationEnabled('tipo_sconosciuto', DEFAULT_NOTIFICATION_PREFERENCES)).toBe(true)
    })

    it('returns false when messages category is disabled', () => {
        const prefs = { ...DEFAULT_NOTIFICATION_PREFERENCES, messages: false }
        expect(isNotificationEnabled('message_received', prefs)).toBe(false)
    })
})

// ============================================================================
// groupNotifications
// ============================================================================
describe('groupNotifications', () => {
    it('returns empty array for empty input', () => {
        expect(groupNotifications([])).toEqual([])
    })

    it('returns single notification as-is (not grouped)', () => {
        const notif = makeNotification({ id: 1, type: 'new_follower' })
        const result = groupNotifications([notif])
        expect(result).toHaveLength(1)
        expect(isGroupedNotification(result[0])).toBe(false)
    })

    it('groups multiple new_follower notifications within time window', () => {
        const now = new Date()
        const notifications: Notification[] = [
            makeNotification({
                id: 1,
                type: 'new_follower',
                metadata: { followerName: 'Alice', followerId: 'a' },
                createdAt: now.toISOString(),
            }),
            makeNotification({
                id: 2,
                type: 'new_follower',
                metadata: { followerName: 'Bob', followerId: 'b' },
                createdAt: new Date(now.getTime() - 1000 * 60 * 30).toISOString(), // 30 min ago
            }),
            makeNotification({
                id: 3,
                type: 'new_follower',
                metadata: { followerName: 'Charlie', followerId: 'c' },
                createdAt: new Date(now.getTime() - 1000 * 60 * 60).toISOString(), // 1h ago
            }),
        ]

        const result = groupNotifications(notifications)
        // Should produce 1 group with 3 notifications
        expect(result).toHaveLength(1)
        expect(isGroupedNotification(result[0])).toBe(true)

        const group = result[0] as GroupedNotification
        expect(group.count).toBe(3)
        expect(group.notificationType).toBe('new_follower')
        expect(group.title).toContain('3')
        expect(group.hasUnread).toBe(true)
    })

    it('does NOT group non-groupable types like affiliation_request', () => {
        const now = new Date()
        const notifications: Notification[] = [
            makeNotification({
                id: 1,
                type: 'affiliation_request',
                createdAt: now.toISOString(),
            }),
            makeNotification({
                id: 2,
                type: 'affiliation_request',
                createdAt: new Date(now.getTime() - 1000 * 60).toISOString(),
            }),
        ]

        const result = groupNotifications(notifications)
        // Both should remain as individual notifications
        expect(result).toHaveLength(2)
        expect(result.every(r => !isGroupedNotification(r))).toBe(true)
    })

    it('sorts results by date (most recent first)', () => {
        const now = new Date()
        const notifications: Notification[] = [
            makeNotification({
                id: 1,
                type: 'affiliation_request',
                createdAt: new Date(now.getTime() - 1000 * 60 * 60 * 2).toISOString(), // 2h ago
            }),
            makeNotification({
                id: 2,
                type: 'club_join_request',
                createdAt: now.toISOString(), // now
            }),
        ]

        const result = groupNotifications(notifications)
        expect(result).toHaveLength(2)
        // Most recent first
        const firstDate = new Date('createdAt' in result[0] ? result[0].createdAt : '').getTime()
        const secondDate = new Date('createdAt' in result[1] ? result[1].createdAt : '').getTime()
        expect(firstDate).toBeGreaterThanOrEqual(secondDate)
    })
})

// ============================================================================
// isGroupedNotification
// ============================================================================
describe('isGroupedNotification', () => {
    it('returns true for grouped notification', () => {
        const group: GroupedNotification = {
            id: 'group_test',
            type: 'group',
            notificationType: 'new_follower',
            notifications: [],
            title: 'Test',
            message: 'Test',
            count: 0,
            hasUnread: false,
            destination: null,
            hasSameDestination: false,
            createdAt: new Date().toISOString(),
            groupKey: 'test',
        }
        expect(isGroupedNotification(group)).toBe(true)
    })

    it('returns false for regular notification', () => {
        const notif = makeNotification()
        expect(isGroupedNotification(notif)).toBe(false)
    })
})

// ============================================================================
// Constants exported correctly
// ============================================================================
describe('exported constants', () => {
    it('NOTIFICATION_CATEGORIES has all expected keys', () => {
        const keys = Object.keys(NOTIFICATION_CATEGORIES)
        expect(keys).toContain('follower')
        expect(keys).toContain('messages')
        expect(keys).toContain('applications')
        expect(keys).toContain('affiliations')
        expect(keys).toContain('club')
        expect(keys).toContain('opportunities')
        expect(keys).toContain('permissions')
    })

    it('CATEGORY_TRANSLATIONS has a translation for every category', () => {
        for (const key of Object.keys(NOTIFICATION_CATEGORIES)) {
            expect(CATEGORY_TRANSLATIONS).toHaveProperty(key)
            expect(typeof CATEGORY_TRANSLATIONS[key as keyof typeof CATEGORY_TRANSLATIONS]).toBe('string')
        }
    })

    it('CATEGORY_DESCRIPTIONS has a description for every category', () => {
        for (const key of Object.keys(NOTIFICATION_CATEGORIES)) {
            expect(CATEGORY_DESCRIPTIONS).toHaveProperty(key)
        }
    })

    it('DEFAULT_NOTIFICATION_PREFERENCES has all categories enabled', () => {
        for (const key of Object.keys(NOTIFICATION_CATEGORIES)) {
            expect(DEFAULT_NOTIFICATION_PREFERENCES[key as keyof typeof DEFAULT_NOTIFICATION_PREFERENCES]).toBe(true)
        }
    })
})
