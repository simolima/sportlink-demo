/**
 * Mock Services - Export centrale
 * Importa tutti i servizi mock da un unico punto
 */

export { authService } from './authService'
export { clubService } from './clubService'
export { announcementService } from './announcementService'
export { agentService } from './agentService'

// Re-export dei dati mock (opzionale, per test)
export { mockUsers } from './data/users'
export { mockClubs } from './data/clubs'
export { mockAnnouncements } from './data/announcements'
export { mockAffiliations } from './data/affiliations'
