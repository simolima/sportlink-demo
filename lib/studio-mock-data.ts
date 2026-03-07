// Mock data intelligente per pagine pubbliche studio
// basata sul ruolo del professionista (physio | nutritionist | athletic_trainer)

import { type MedicalRole } from './types'

export type Specialization = {
    name: string
    description: string
    icon: string // emoji o nome icona
}

export type Review = {
    id: string
    clientName: string
    clientAvatar?: string
    rating: number // 1-5
    text: string
    date: string
    verified: boolean
}

export type FAQ = {
    question: string
    answer: string
}

export type PublicStudioMockData = {
    role: MedicalRole
    yearsOfExperience: number
    languages: string[]
    workModes: Array<'in-person' | 'remote' | 'hybrid'>
    certifications: string[]
    specializations: Specialization[]
    methodology: string
    reviews: Review[]
    faq: FAQ[]
}

// ============================================================================
// FISIOTERAPISTA / MASSAGGIATORE
// ============================================================================
const physioMockData: PublicStudioMockData = {
    role: 'physio',
    yearsOfExperience: 12,
    languages: ['Italiano', 'Inglese'],
    workModes: ['in-person', 'hybrid'],
    certifications: [
        'Laurea in Fisioterapia - Università degli Studi di Milano',
        'Master in Riabilitazione Sportiva',
        'Certificazione in Taping Neuromuscolare',
        'Corso avanzato di Terapia Manuale (OMT)',
    ],
    specializations: [
        {
            name: 'Riabilitazione Sportiva',
            description: 'Recupero funzionale post-infortunio per atleti professionisti e amatoriali',
            icon: '🏃'
        },
        {
            name: 'Terapia Manuale',
            description: 'Tecniche manipolative per ridurre dolore e migliorare mobilità articolare',
            icon: '🤲'
        },
        {
            name: 'Riabilitazione Ortopedica',
            description: 'Trattamento post-chirurgico per lesioni muscolo-scheletriche',
            icon: '🦴'
        },
        {
            name: 'Postura e Biomeccanica',
            description: 'Correzione posturale e analisi del movimento',
            icon: '⚖️'
        }
    ],
    methodology: `Il mio approccio si basa su una valutazione approfondita della condizione del paziente, seguita da un piano terapeutico personalizzato che integra terapia manuale, esercizio terapeutico e tecnologie avanzate.

Credo fortemente nell'importanza di educare il paziente sulla propria condizione, rendendolo parte attiva del percorso di recupero. Ogni programma è costruito sulle esigenze specifiche della persona, con obiettivi chiari e misurabili.

La riabilitazione non si ferma alla seduta: fornisco esercizi da svolgere a casa e consigli pratici per prevenire ricadute e ottimizzare le performance nella vita quotidiana e sportiva.`,
    reviews: [
        {
            id: '1',
            clientName: 'Marco Bianchi',
            rating: 5,
            text: 'Dopo 3 mesi di fisioterapia sono tornato a correre senza dolore. Professionalità e competenza eccellenti, altamente consigliato!',
            date: '2025-02-10',
            verified: true
        },
        {
            id: '2',
            clientName: 'Laura Verdi',
            rating: 5,
            text: 'Ho risolto un problema cronico alla schiena che mi affliggeva da anni. Finalmente ho trovato un professionista che ascolta e cura davvero.',
            date: '2025-01-22',
            verified: true
        },
        {
            id: '3',
            clientName: 'Alessandro Rossi',
            rating: 5,
            text: 'Recupero post-operatorio perfetto. Mi ha seguito passo passo con grande attenzione. Studio moderno e accogliente.',
            date: '2024-12-15',
            verified: false
        }
    ],
    faq: [
        {
            question: 'Serve la prescrizione medica per la prima visita?',
            answer: 'Non è obbligatoria ma consigliata, soprattutto se hai già fatto esami diagnostici (RX, RM, ecografie). Portare con te la documentazione medica mi aiuta a valutare meglio la tua situazione.'
        },
        {
            question: 'Quanto dura una seduta di fisioterapia?',
            answer: 'Una seduta standard dura 45-60 minuti. La prima visita può durare fino a 90 minuti per permettermi di effettuare una valutazione completa.'
        },
        {
            question: 'Quanto costa una seduta?',
            answer: 'Il costo varia in base al tipo di trattamento. Contattami per un preventivo personalizzato. Rilascio fattura detraibile e ricevuta per rimborso assicurativo.'
        },
        {
            question: 'Quante sedute servono mediamente?',
            answer: 'Dipende dalla patologia e dai tuoi obiettivi. Mediamente un ciclo riabilitativo prevede 6-12 sedute, ma valuteremo insieme il percorso più adatto dopo la prima visita.'
        },
        {
            question: 'Fate anche domicilio?',
            answer: 'Sì, per pazienti con difficoltà di movimento offro servizio di fisioterapia a domicilio su Milano e hinterland. Contattami per verificare la disponibilità nella tua zona.'
        }
    ]
}

// ============================================================================
// NUTRIZIONISTA
// ============================================================================
const nutritionistMockData: PublicStudioMockData = {
    role: 'nutritionist',
    yearsOfExperience: 8,
    languages: ['Italiano', 'Inglese'],
    workModes: ['in-person', 'remote', 'hybrid'],
    certifications: [
        'Laurea Magistrale in Scienze della Nutrizione Umana',
        'Iscrizione ONB (Ordine Nazionale Biologi)',
        'Master in Nutrizione Sportiva',
        'Certificazione in Nutrizione per patologie metaboliche',
    ],
    specializations: [
        {
            name: 'Nutrizione Sportiva',
            description: 'Piani alimentari per ottimizzare performance e recupero negli atleti',
            icon: '💪'
        },
        {
            name: 'Dimagrimento Sostenibile',
            description: 'Percorsi personalizzati per perdita di peso senza effetto yo-yo',
            icon: '⚖️'
        },
        {
            name: 'Educazione Alimentare',
            description: 'Consulenze per imparare a nutrirsi in modo equilibrato e consapevole',
            icon: '🎓'
        },
        {
            name: 'Nutrizione Clinica',
            description: 'Supporto nutrizionale per patologie (diabete, ipertensione, PCOS, ecc.)',
            icon: '🩺'
        }
    ],
    methodology: `Il mio metodo si basa sull'ascolto e sulla personalizzazione. Non esistono diete universali: ogni persona ha un metabolismo, uno stile di vita e obiettivi diversi.

Durante la prima visita effettuo un'analisi completa (anamnesi, composizione corporea con BIA, abitudini alimentari) e costruisco un piano nutrizionale su misura che sia sostenibile nel tempo, senza rinunce estreme.

Credo nell'educazione alimentare: non ti consegnerò solo un menu, ma ti insegnerò a fare scelte consapevoli e a mantenere i risultati anche dopo il percorso insieme. Il mio obiettivo è che tu diventi autonomo nella gestione della tua alimentazione.`,
    reviews: [
        {
            id: '1',
            clientName: 'Giulia Ferrari',
            rating: 5,
            text: 'Ho perso 12 kg in 6 mesi senza soffrire la fame. Finalmente un approccio che funziona davvero! Consigliatissima.',
            date: '2025-02-05',
            verified: true
        },
        {
            id: '2',
            clientName: 'Matteo Conti',
            rating: 5,
            text: 'Come atleta ho migliorato enormemente le mie performance grazie al piano alimentare. Energia e recupero ottimali.',
            date: '2025-01-18',
            verified: true
        },
        {
            id: '3',
            clientName: 'Elena Russo',
            rating: 5,
            text: 'Professionale, empatica e molto preparata. Mi ha aiutato a capire come nutrirmi correttamente. Grazie!',
            date: '2024-12-20',
            verified: false
        }
    ],
    faq: [
        {
            question: 'Come si svolge la prima visita?',
            answer: 'La prima visita dura circa 60 minuti. Raccoglierò la tua storia clinica, analizzerò le tue abitudini alimentari e misurerò la tua composizione corporea. Riceverai subito il tuo primo piano nutrizionale personalizzato.'
        },
        {
            question: 'Rilasci diete online?',
            answer: 'Sì, offro consulenze anche da remoto in videocall. È comunque importante una prima visita (anche online) per conoscerti e valutare la tua situazione prima di elaborare il piano.'
        },
        {
            question: 'Quanto costa una consulenza?',
            answer: 'Il costo della prima visita include anamnesi, analisi BIA e piano alimentare iniziale. I controlli successivi hanno un costo ridotto. Contattami per info sui pacchetti.'
        },
        {
            question: 'Quanti controlli servono?',
            answer: 'Dipende dai tuoi obiettivi. Consiglio controlli mensili nei primi 3 mesi, poi ogni 2-3 mesi per consolidare i risultati. Sei sempre libero di contattarmi tra un controllo e l\'altro per domande o dubbi.'
        },
        {
            question: 'Lavori con atleti professionisti?',
            answer: 'Sì, seguo diversi atleti di sport individuali e di squadra. Il piano per sportivi è studiato per ottimizzare energia, recupero, composizione corporea e performance in base alla disciplina.'
        }
    ]
}

// ============================================================================
// PREPARATORE ATLETICO
// ============================================================================
const athleticTrainerMockData: PublicStudioMockData = {
    role: 'athletic_trainer',
    yearsOfExperience: 10,
    languages: ['Italiano', 'Inglese'],
    workModes: ['in-person', 'remote', 'hybrid'],
    certifications: [
        'Laurea in Scienze Motorie',
        'Master in Preparazione Atletica per Sport di Squadra',
        'Certificazione NSCA-CSCS (Strength & Conditioning Specialist)',
        'Istruttore Functional Training',
    ],
    specializations: [
        {
            name: 'Preparazione Atletica',
            description: 'Programmi di allenamento per migliorare forza, velocità e resistenza',
            icon: '🏋️'
        },
        {
            name: 'Prevenzione Infortuni',
            description: 'Esercizi specifici per ridurre il rischio di lesioni muscolari e articolari',
            icon: '🛡️'
        },
        {
            name: 'Recupero Post-Infortunio',
            description: 'Return to play progressivo per atleti reduci da infortuni',
            icon: '🔄'
        },
        {
            name: 'Allenamento Funzionale',
            description: 'Movimenti multi-articolari per migliorare performance reali',
            icon: '⚙️'
        }
    ],
    methodology: `Il mio metodo si basa sull'analisi delle esigenze specifiche di ogni atleta e sulla periodizzazione dell'allenamento per massimizzare i risultati e prevenire sovrallenamento.

Ogni programma parte da una valutazione funzionale completa (forza, mobilità, stabilità, velocità) e viene costruito su misura in base al livello, agli obiettivi e al calendario competitivo.

Non mi limito a scrivere schede: ti seguo durante gli allenamenti, correggo la tecnica in tempo reale e monitorizzo costantemente i progressi. L'obiettivo è farti esprimere il massimo potenziale atletico riducendo al minimo il rischio di infortuni.`,
    reviews: [
        {
            id: '1',
            clientName: 'Luca Moretti',
            rating: 5,
            text: 'In 4 mesi ho migliorato la mia esplosività e resistenza. Preparatore super competente, sa come tirare fuori il meglio da te!',
            date: '2025-02-08',
            verified: true
        },
        {
            id: '2',
            clientName: 'Stefano Galli',
            rating: 5,
            text: 'Dopo un grave infortunio mi ha aiutato a tornare in campo più forte di prima. Approccio scientifico e umano insieme.',
            date: '2025-01-25',
            verified: true
        },
        {
            id: '3',
            clientName: 'Davide Costa',
            rating: 5,
            text: 'Allenamenti intensi ma mai noiosi. Ogni sessione è diversa e stimolante. I risultati si vedono!',
            date: '2024-12-10',
            verified: false
        }
    ],
    faq: [
        {
            question: 'Che differenza c\'è tra preparatore atletico e personal trainer?',
            answer: 'Il preparatore atletico lavora specificamente con atleti per migliorare performance sportive (forza, velocità, resistenza, prevenzione infortuni). Il personal trainer si occupa più di fitness generale.'
        },
        {
            question: 'Quanto dura una seduta di allenamento?',
            answer: 'Una sessione standard dura 60-90 minuti, inclusi riscaldamento, parte centrale e defaticamento. La prima valutazione funzionale può richiedere fino a 2 ore.'
        },
        {
            question: 'Posso allenarmi da remoto?',
            answer: 'Sì, offro coaching online con programmazione personalizzata e video-analisi della tecnica. Ideale per atleti che non possono raggiungermi in studio ma vogliono un supporto professionale.'
        },
        {
            question: 'Lavori con squadre o solo con singoli atleti?',
            answer: 'Lavoro sia con atleti individuali che con squadre. Per i team offro programmazione di gruppo, test fisici periodici e gestione del carico di lavoro settimanale.'
        },
        {
            question: 'Quanto tempo serve per vedere risultati?',
            answer: 'Dipende dal punto di partenza e dagli obiettivi. Mediamente in 6-8 settimane di lavoro costante si vedono miglioramenti significativi in termini di forza e resistenza.'
        }
    ]
}

// ============================================================================
// EXPORT FUNCTION TO GET MOCK DATA BY ROLE
// ============================================================================
export function getStudioMockDataByRole(role: MedicalRole): PublicStudioMockData {
    switch (role) {
        case 'physio':
            return physioMockData
        case 'nutritionist':
            return nutritionistMockData
        case 'athletic_trainer':
            return athleticTrainerMockData
        default:
            return physioMockData // fallback
    }
}
