/**
 * Mock Data - Users
 * 10 utenti con ruoli diversi per test
 */

import { User, UserRole } from '@/lib/types'

export const mockUsers: User[] = [
    {
        id: 1,
        firstName: 'Marco',
        lastName: 'Gregorio',
        email: 'marco@example.com',
        password: 'password123',
        birthDate: '1995-03-15',
        sport: 'Calcio' as any,
        professionalRole: 'Player' as any,
        bio: undefined,
        avatarUrl: undefined,
        city: undefined,
        country: 'Italia',
        availability: 'Unavailable',
        level: undefined,
        verified: false,
        createdAt: '2024-12-06T10:00:00Z'
    },
    {
        id: 2,
        firstName: 'Gianna',
        lastName: 'Rossi',
        email: 'gianna@example.com',
        password: 'password123',
        birthDate: '1988-07-22',
        sport: 'Calcio',
        professionalRole: 'Agent',
        bio: 'Agente sportivo specializzato in calcio',
        avatarUrl: undefined,
        city: 'Milano',
        country: 'Italia',
        availability: 'Available',
        level: 'Professional',
        verified: true,
        createdAt: '2024-12-06T10:15:00Z'
    },
    {
        id: 3,
        firstName: 'Carlo',
        lastName: 'Bianchi',
        email: 'carlo@example.com',
        password: 'password123',
        birthDate: '1982-11-05',
        sport: 'Calcio',
        professionalRole: 'President',
        bio: 'Presidente di una società calcistica',
        avatarUrl: undefined,
        city: 'Roma',
        country: 'Italia',
        availability: 'Available',
        level: 'Professional',
        verified: true,
        createdAt: '2024-12-06T10:30:00Z'
    },
    {
        id: 4,
        firstName: 'Anna',
        lastName: 'Verdi',
        email: 'anna@example.com',
        password: 'password123',
        birthDate: '1992-04-18',
        sport: 'Basket',
        professionalRole: 'Coach',
        bio: 'Allenatrice di pallacanestro',
        avatarUrl: undefined,
        city: 'Torino',
        country: 'Italia',
        availability: 'Available',
        level: 'Professional',
        verified: true,
        createdAt: '2024-12-06T10:45:00Z'
    },
    {
        id: 5,
        firstName: 'Luca',
        lastName: 'Neri',
        email: 'luca@example.com',
        password: 'password123',
        birthDate: '1990-09-30',
        sport: 'Tennis',
        professionalRole: 'Player',
        bio: 'Tennista professionista',
        avatarUrl: undefined,
        city: 'Palermo',
        country: 'Italia',
        availability: 'Available',
        level: 'Professional',
        verified: true,
        createdAt: '2024-12-06T11:00:00Z'
    }
]
