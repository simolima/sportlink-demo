/**
 * Mock Data - Affiliations
 * 3 affiliazioni agent-player per test
 */

import { Affiliation } from '@/lib/types'

export const mockAffiliations: Affiliation[] = [
    {
        id: 1,
        agentId: 3, // Giuseppe Verdi (Agent)
        playerId: 1, // Marco Rossi (Player)
        status: 'accepted',
        message: 'Ciao Marco, ho seguito la tua carriera e credo di poterti aiutare a fare il salto di qualità. Lavoro con diversi club di Serie B e potrei proporti per alcune opportunità interessanti.',
        requestedAt: '2024-02-01T10:00:00Z',
        respondedAt: '2024-02-02T14:30:00Z',
        affiliatedAt: '2024-02-02T14:30:00Z',
        notes: 'Ottimo rapporto. Obiettivo Serie B entro prossima stagione.'
    },
    {
        id: 2,
        agentId: 3, // Giuseppe Verdi (Agent)
        playerId: 7, // Andrea Galli (Player)
        status: 'pending',
        message: 'Buongiorno Andrea, rappresento diversi giovani calciatori e mi piacerebbe discutere una possibile collaborazione. Ho contatti con club professionistici che cercano talenti come te.',
        requestedAt: '2024-02-15T09:00:00Z',
        notes: 'In attesa di risposta. Giocatore molto promettente.'
    },
    {
        id: 3,
        agentId: 3, // Giuseppe Verdi (Agent)
        playerId: 10, // Elena Ricci (Player - Basket)
        status: 'rejected',
        message: 'Gentile Elena, ho notato il tuo profilo e le tue ottime prestazioni. Rappresento atleti di basket e calcio e vorrei proporti alcune opportunità.',
        requestedAt: '2024-02-10T11:30:00Z',
        respondedAt: '2024-02-12T16:00:00Z',
        notes: 'Rifiutata perché ha già un agente.'
    }
]
