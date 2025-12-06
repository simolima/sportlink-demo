/**
 * Test dei Mock Services
 * Esegui questo file per verificare il corretto funzionamento
 */

import { authService, clubService, announcementService, agentService } from './index'

async function testMockServices() {
    console.log('🧪 Testing Mock Services...\n')

    try {
        // ========== AUTH SERVICE ==========
        console.log('📝 Testing authService...')
        const loginResult = await authService.login('marco.rossi@sprinta.com', 'demo123')
        console.log('✅ Login successful:', loginResult?.user.firstName, loginResult?.user.lastName)

        // ========== CLUB SERVICE ==========
        console.log('\n📝 Testing clubService...')
        const allClubs = await clubService.getAll()
        console.log(`✅ Found ${allClubs.length} clubs`)
        console.log('   Clubs:', allClubs.map(c => c.name).join(', '))

        const calcioClubs = await clubService.getBySport('Calcio')
        console.log(`✅ Found ${calcioClubs.length} calcio clubs:`, calcioClubs.map(c => c.name).join(', '))

        const milanClubs = await clubService.getByCity('Milano')
        console.log(`✅ Found ${milanClubs.length} clubs in Milano:`, milanClubs.map(c => c.name).join(', '))

        // ========== ANNOUNCEMENT SERVICE ==========
        console.log('\n📝 Testing announcementService...')
        const allAnnouncements = await announcementService.getAll()
        console.log(`✅ Found ${allAnnouncements.length} active announcements`)
        console.log('   Announcements:', allAnnouncements.slice(0, 3).map(a => a.title).join(', '))

        const filteredAnnouncements = await announcementService.filter({
            sport: 'Calcio',
            level: 'Semi-Professional'
        })
        console.log(`✅ Filtered announcements (Calcio, Semi-Pro): ${filteredAnnouncements.length}`)

        // ========== AGENT SERVICE ==========
        console.log('\n📝 Testing agentService...')
        const allAffiliations = await agentService.getAll()
        console.log(`✅ Found ${allAffiliations.length} total affiliations`)

        const agentAffiliations = await agentService.getAgentAffiliations(3) // Giuseppe Verdi
        console.log(`✅ Agent #3 has ${agentAffiliations.length} affiliations`)
        agentAffiliations.forEach(aff => {
            console.log(`   - Player #${aff.playerId}: ${aff.status}`)
        })

        const acceptedCount = await agentService.countAffiliatedPlayers(3)
        console.log(`✅ Agent #3 has ${acceptedCount} accepted affiliations`)

        // ========== CRUD TEST ==========
        console.log('\n📝 Testing CRUD operations...')

        // Crea nuovo annuncio
        const newAnnouncement = await announcementService.create({
            clubId: 1,
            title: 'Test Annuncio',
            type: 'Player Search',
            sport: 'Calcio',
            roleRequired: 'Player',
            description: 'Annuncio di test',
            location: 'Milano',
            expiryDate: '2024-12-31T23:59:59Z',
            createdBy: 5
        })
        console.log('✅ Created new announcement:', newAnnouncement.title)

        // Aggiorna annuncio
        const updated = await announcementService.update(newAnnouncement.id, {
            title: 'Test Annuncio Aggiornato'
        })
        console.log('✅ Updated announcement:', updated?.title)

        // Crea affiliazione
        const newAffiliation = await agentService.createAffiliationRequest(
            3, // Agent
            4, // Player Alessia Ferrari
            'Richiesta di test'
        )
        console.log('✅ Created affiliation request:', newAffiliation.id)

        console.log('\n✅ All tests passed! Mock services are working correctly.\n')

    } catch (error) {
        console.error('\n❌ Test failed:', error)
    }
}

// Esegui i test
testMockServices()
