/**
 * Shared file system utilities for JSON data storage
 * Used across API routes to eliminate code duplication
 */

import fs from 'fs'
import path from 'path'

/**
 * Ensures a file exists, creating it with default content if it doesn't
 */
export function ensureFile(filePath: string, defaultContent: string = '[]'): void {
    if (!fs.existsSync(filePath)) {
        fs.mkdirSync(path.dirname(filePath), { recursive: true })
        fs.writeFileSync(filePath, defaultContent, 'utf-8')
    }
}

/**
 * Reads and parses JSON from a file, with error handling
 */
export function readJson<T = any>(filePath: string, defaultValue: T = [] as any): T {
    ensureFile(filePath, JSON.stringify(defaultValue))
    const raw = fs.readFileSync(filePath, 'utf-8') || JSON.stringify(defaultValue)
    try {
        return JSON.parse(raw)
    } catch (error) {
        console.error(`Error parsing JSON from ${filePath}:`, error)
        return defaultValue
    }
}

/**
 * Writes JSON data to a file with pretty formatting
 */
export function writeJson<T = any>(filePath: string, data: T): void {
    ensureFile(filePath, '[]')
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8')
}

/**
 * Gets the full path to a data file in the data directory
 */
export function getDataPath(filename: string): string {
    return path.join(process.cwd(), 'data', filename)
}

/**
 * Higher-level convenience functions for common data files
 */

export function readUsers() {
    return readJson(getDataPath('users.json'))
}

export function writeUsers(users: any[]) {
    writeJson(getDataPath('users.json'), users)
}

export function readClubs() {
    return readJson(getDataPath('clubs.json'))
}

export function writeClubs(clubs: any[]) {
    writeJson(getDataPath('clubs.json'), clubs)
}

export function readNotifications() {
    return readJson(getDataPath('notifications.json'))
}

export function writeNotifications(notifications: any[]) {
    writeJson(getDataPath('notifications.json'), notifications)
}

export function readOpportunities() {
    return readJson(getDataPath('opportunities.json'))
}

export function writeOpportunities(opportunities: any[]) {
    writeJson(getDataPath('opportunities.json'), opportunities)
}

export function readApplications() {
    return readJson(getDataPath('applications.json'))
}

export function writeApplications(applications: any[]) {
    writeJson(getDataPath('applications.json'), applications)
}

export function readAffiliations() {
    return readJson(getDataPath('affiliations.json'))
}

export function writeAffiliations(affiliations: any[]) {
    writeJson(getDataPath('affiliations.json'), affiliations)
}

export function readFollows() {
    return readJson(getDataPath('follows.json'))
}

export function writeFollows(follows: any[]) {
    writeJson(getDataPath('follows.json'), follows)
}

export function readMessages() {
    return readJson(getDataPath('messages.json'))
}

export function writeMessages(messages: any[]) {
    writeJson(getDataPath('messages.json'), messages)
}

export function readClubMemberships() {
    return readJson(getDataPath('club-memberships.json'))
}

export function writeClubMemberships(memberships: any[]) {
    writeJson(getDataPath('club-memberships.json'), memberships)
}

export function readBlockedAgents() {
    return readJson(getDataPath('blocked-agents.json'))
}

export function writeBlockedAgents(blocked: any[]) {
    writeJson(getDataPath('blocked-agents.json'), blocked)
}

export function readClubJoinRequests() {
    return readJson(getDataPath('club-join-requests.json'))
}

export function writeClubJoinRequests(requests: any[]) {
    writeJson(getDataPath('club-join-requests.json'), requests)
}

export function readNotificationPreferences(): Array<{ userId: string; preferences: Record<string, boolean> }> {
    return readJson(getDataPath('notification-preferences.json'), [])
}

export function writeNotificationPreferences(data: Array<{ userId: string; preferences: Record<string, boolean> }>) {
    writeJson(getDataPath('notification-preferences.json'), data)
}
