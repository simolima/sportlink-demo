/**
 * Mock Data - Clubs
 * 5 club multisport per test
 */

import { Club } from '@/lib/types'

export const mockClubs: Club[] = [
    {
        id: 1,
        name: 'ASD Sporting Milano',
        sports: ['Calcio', 'Basket'],
        city: 'Milano',
        country: 'Italia',
        region: 'Lombardia',
        description: 'Società sportiva dilettantistica con oltre 50 anni di storia. Sezioni calcio e basket con squadre giovanili e senior.',
        logoUrl: '/clubs/sporting-milano.jpg',
        coverUrl: '/covers/sporting-milano-cover.jpg',
        founded: 1970,
        website: 'https://sportingmilano.it',
        email: 'info@sportingmilano.it',
        phone: '+39 02 1234567',
        socialMedia: {
            facebook: 'sportingmilano',
            instagram: '@sportingmilano',
            twitter: '@sporting_mi'
        },
        verified: true,
        followersCount: 1250,
        membersCount: 85,
        createdAt: '2024-01-05T10:00:00Z',
        createdBy: 5 // Roberto Colombo (Sporting Director)
    },
    {
        id: 2,
        name: 'Pallavolo Roma ASD',
        sports: ['Pallavolo'],
        city: 'Roma',
        country: 'Italia',
        region: 'Lazio',
        description: 'Club di pallavolo femminile e maschile. Militiamo in Serie B con ambizioni di promozione.',
        logoUrl: '/clubs/pallavolo-roma.jpg',
        founded: 1985,
        website: 'https://pallavoloroma.it',
        email: 'contact@pallavoloroma.it',
        phone: '+39 06 9876543',
        verified: true,
        followersCount: 890,
        membersCount: 42,
        createdAt: '2024-01-12T14:30:00Z',
        createdBy: 4 // Alessia Ferrari (Player)
    },
    {
        id: 3,
        name: 'US Torino Calcio',
        sports: ['Calcio'],
        city: 'Torino',
        country: 'Italia',
        region: 'Piemonte',
        description: 'Società calcistica amatoriale con settore giovanile sviluppato. Focus su formazione e valorizzazione talenti.',
        logoUrl: '/clubs/torino-calcio.jpg',
        coverUrl: '/covers/torino-calcio-cover.jpg',
        founded: 1995,
        website: 'https://ustorinocalcio.it',
        email: 'info@ustorinocalcio.it',
        verified: false,
        followersCount: 520,
        membersCount: 68,
        createdAt: '2024-01-18T09:15:00Z',
        createdBy: 1 // Marco Rossi (Player)
    },
    {
        id: 4,
        name: 'Basket Napoli Academy',
        sports: ['Basket'],
        city: 'Napoli',
        country: 'Italia',
        region: 'Campania',
        description: 'Academy di basket per giovani talenti. Collaborazioni con università americane per borse di studio.',
        logoUrl: '/clubs/basket-napoli.jpg',
        founded: 2010,
        website: 'https://basketnapoliacademy.it',
        email: 'academy@basketnapoli.it',
        phone: '+39 081 5551234',
        socialMedia: {
            instagram: '@basketnapoliacademy',
            facebook: 'basketnapoliacademy'
        },
        verified: true,
        followersCount: 2100,
        membersCount: 95,
        createdAt: '2024-01-22T11:00:00Z',
        createdBy: 2 // Laura Bianchi (Coach)
    },
    {
        id: 5,
        name: 'Polisportiva Firenze',
        sports: ['Tennis', 'Nuoto', 'Atletica'],
        city: 'Firenze',
        country: 'Italia',
        region: 'Toscana',
        description: 'Centro sportivo polivalente con corsi per tutte le età. Sezioni competitive e amatoriali.',
        logoUrl: '/clubs/polisportiva-firenze.jpg',
        coverUrl: '/covers/polisportiva-firenze-cover.jpg',
        founded: 1978,
        website: 'https://polisportivafirenze.it',
        email: 'info@polisportivafirenze.it',
        phone: '+39 055 7778888',
        socialMedia: {
            facebook: 'polisportivafirenze',
            instagram: '@polisportiva_fi'
        },
        verified: true,
        followersCount: 3450,
        membersCount: 210,
        createdAt: '2024-01-08T16:45:00Z',
        createdBy: 6 // Francesca Romano (Athletic Trainer)
    }
]
