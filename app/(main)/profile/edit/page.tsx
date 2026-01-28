"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { CameraIcon, PlusIcon, XMarkIcon, ExclamationCircleIcon } from "@heroicons/react/24/outline"
import Avatar from "@/components/avatar"
import { uploadService } from "@/lib/upload-service"

interface Experience {
    id: string
    season: string // "2024/2025" - OBBLIGATORIO
    role: string
    primaryPosition?: string
    positionDetail?: string
    team: string
    country: string
    category: string
    categoryTier?: string
    competitionType?: string // 'male' | 'female' | 'open' | 'mixed'
    // Date opzionali per precisione temporale
    from?: string
    to?: string
    isCurrentlyPlaying?: boolean // "Gioca/Allena ancora qui"
    summary: string
    // Statistiche opzionali per Player
    goals?: number
    cleanSheets?: number
    appearances?: number
    pointsPerGame?: number
    assists?: number
    rebounds?: number
    volleyAces?: number
    volleyBlocks?: number
    volleyDigs?: number
    // Statistiche Calcio specifiche
    minutesPlayed?: number
    penalties?: number
    yellowCards?: number
    redCards?: number
    substitutionsIn?: number
    substitutionsOut?: number
    // Statistiche opzionali per Coach
    matchesCoached?: number
    wins?: number
    draws?: number
    losses?: number
    trophies?: number
}

interface Certification {
    id: string
    name: string
    issuingOrganization: string
    yearObtained: string
    expiryDate?: string
}

interface FormState {
    firstName: string
    lastName: string
    username: string
    email: string
    birthDate: string
    currentRole: string
    bio: string
    city: string
    country: string
    avatarUrl: string
    coverUrl: string
    experiences: Experience[]
    availability: string
    height?: number
    weight?: number
    dominantFoot?: 'destro' | 'sinistro' | 'ambidestro'
    dominantHand?: 'destra' | 'sinistra' | 'ambidestra'
    specificRole?: string
    secondaryRole?: string
    footballPrimaryPosition?: 'Portiere' | 'Difensore' | 'Centrocampista' | 'Attaccante'
    footballSecondaryPosition?: string
    // Qualifiche Coach
    uefaLicenses?: string[]
    coachSpecializations?: string
    // Qualifiche Agent
    hasFifaLicense?: boolean
    fifaLicenseNumber?: string
    agentNotes?: string
    // Certificazioni Staff
    certifications?: Certification[]
}

const emptyExperience = (): Experience => ({
    id: Date.now().toString(),
    season: "", // Sarà selezionato dall'utente
    role: "",
    primaryPosition: "",
    positionDetail: "",
    team: "",
    country: "",
    category: "",
    categoryTier: "",
    competitionType: "",
    from: "",
    to: "",
    isCurrentlyPlaying: false,
    summary: "",
})

const emptyCertification = (): Certification => ({
    id: Date.now().toString(),
    name: "",
    issuingOrganization: "",
    yearObtained: "",
    expiryDate: "",
})

const initialForm: FormState = {
    firstName: "",
    lastName: "",
    username: "",
    email: "",
    birthDate: "",
    currentRole: "",
    bio: "",
    city: "",
    country: "",
    avatarUrl: "",
    coverUrl: "",
    experiences: [],
    availability: "Non disponibile",
    dominantFoot: undefined,
    dominantHand: undefined,
    specificRole: undefined,
    secondaryRole: undefined,
    uefaLicenses: [],
    coachSpecializations: "",
    hasFifaLicense: false,
    fifaLicenseNumber: "",
    agentNotes: "",
    certifications: [],
}

export default function EditProfilePage() {
    // --- HOOKS: always before any return ---
    const router = useRouter();
    const userId = useMemo(() => {
        if (typeof window === "undefined") return null;
        return localStorage.getItem("currentUserId");
    }, []);
    const [form, setForm] = useState<FormState>(initialForm);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [isPlayer, setIsPlayer] = useState(false);
    const [isFootball, setIsFootball] = useState(false);
    const [isCoach, setIsCoach] = useState(false);
    const [isAgent, setIsAgent] = useState(false);
    const [isSportingDirector, setIsSportingDirector] = useState(false);
    const [isPhysio, setIsPhysio] = useState(false);
    const [isAthleticTrainer, setIsAthleticTrainer] = useState(false);
    const [isStaff, setIsStaff] = useState(false);

    // --- Sport principale per logica ruolo/dominanza ---
    const [mainSport, setMainSport] = useState<string | undefined>(undefined);

    // --- Stati per gestire date opzionali per esperienza ---
    const [showDatesForExp, setShowDatesForExp] = useState<Record<string, boolean>>({})

    // --- Stati per errori validazione date ---
    const [dateErrors, setDateErrors] = useState<Record<string, string>>({})

    useEffect(() => {
        let didRedirect = false;
        const fetchUser = async () => {
            try {
                const res = await fetch("/api/users");
                if (!res.ok) throw new Error("Impossibile caricare il profilo");
                const users = await res.json();
                const user = (users || []).find((u: any) => String(u.id) === String(userId));
                if (!user) {
                    alert("Utente non trovato o sessione scaduta");
                    didRedirect = true;
                    router.push("/home");
                    return;
                }

                // Supporta sia vecchio schema (professionalRole) che nuovo (role_id)
                const roleId = user.role_id || user.professionalRole
                const professionalRole = roleId === 'player' ? 'Player' :
                    roleId === 'coach' ? 'Coach' :
                        roleId === 'agent' ? 'Agent' :
                            roleId === 'sporting_director' ? 'Sporting Director' :
                                roleId === 'athletic_trainer' ? 'Athletic Trainer' :
                                    roleId === 'nutritionist' ? 'Nutritionist' :
                                        roleId === 'physio' ? 'Physio/Masseur' :
                                            roleId === 'talent_scout' ? 'Talent Scout' :
                                                user.professionalRole || 'Player'

                setIsPlayer(professionalRole === "Player");
                setIsCoach(professionalRole === "Coach");
                setIsAgent(professionalRole === "Agent");
                setIsSportingDirector(professionalRole === "Sporting Director");
                setIsPhysio(professionalRole === "Physio/Masseur");
                setIsAthleticTrainer(professionalRole === "Athletic Trainer");
                setIsStaff(["Athletic Trainer", "Nutritionist", "Physio/Masseur", "Talent Scout"].includes(professionalRole));

                // Fetch sports from profile_sports table (nuovo schema Supabase)
                const fetchSports = async () => {
                    const { supabase: supabaseClient } = await import('@/lib/supabase-browser')
                    const { data: sportsData } = await supabaseClient
                        .from('profile_sports')
                        .select('sport_id, lookup_sports(name)')
                        .eq('user_id', userId)

                    return sportsData?.map((s: any) => s.lookup_sports?.name).filter(Boolean) || []
                }

                const userSports = user.sports || await fetchSports()
                const sport = Array.isArray(userSports) && userSports.length > 0 ? userSports[0] : user.sport || undefined;
                setMainSport(sport);
                setIsFootball(Array.isArray(userSports) && userSports.includes("Calcio"));

                // Fetch physical stats from dedicated table
                const fetchPhysicalStats = async () => {
                    try {
                        const res = await fetch(`/api/physical-stats?userId=${userId}`)
                        if (!res.ok) return null
                        return await res.json()
                    } catch (err) {
                        console.error('Error fetching physical stats:', err)
                        return null
                    }
                }

                const physicalStats = await fetchPhysicalStats()

                setForm({
                    firstName: user.first_name || user.firstName || "",
                    lastName: user.last_name || user.lastName || "",
                    username: user.username || "",
                    email: user.email || "",
                    birthDate: user.birth_date || user.birthDate || "",
                    currentRole: user.currentRole || "",
                    bio: user.bio || "",
                    city: user.city || "",
                    country: user.country || "",
                    avatarUrl: user.avatar_url || user.avatarUrl || user.avatar || "",
                    coverUrl: user.cover_url || user.coverUrl || "",
                    experiences: Array.isArray(user.experiences)
                        ? user.experiences.map((e: any, idx: number) => ({
                            id: `${Date.now()}-${idx}`,
                            season: e.season || "", // Nuovo campo
                            role: e.role || e.title || "",
                            primaryPosition: e.primaryPosition || "",
                            positionDetail: e.positionDetail || "",
                            team: e.team || e.company || "",
                            country: e.country || "",
                            category: e.category || "",
                            categoryTier: e.categoryTier || "",
                            competitionType: e.competitionType || "",
                            from: e.from || "",
                            to: e.to || "",
                            isCurrentlyPlaying: e.isCurrentlyPlaying || false,
                            summary: e.summary || e.description || "",
                            goals: typeof e.goals === 'number' ? e.goals : undefined,
                            cleanSheets: typeof e.cleanSheets === 'number' ? e.cleanSheets : undefined,
                            appearances: typeof e.appearances === 'number' ? e.appearances : undefined,
                            pointsPerGame: typeof e.pointsPerGame === 'number' ? e.pointsPerGame : undefined,
                            assists: typeof e.assists === 'number' ? e.assists : undefined,
                            rebounds: typeof e.rebounds === 'number' ? e.rebounds : undefined,
                            volleyAces: typeof e.volleyAces === 'number' ? e.volleyAces : undefined,
                            volleyBlocks: typeof e.volleyBlocks === 'number' ? e.volleyBlocks : undefined,
                            volleyDigs: typeof e.volleyDigs === 'number' ? e.volleyDigs : undefined,
                            minutesPlayed: typeof e.minutesPlayed === 'number' ? e.minutesPlayed : undefined,
                            penalties: typeof e.penalties === 'number' ? e.penalties : undefined,
                            yellowCards: typeof e.yellowCards === 'number' ? e.yellowCards : undefined,
                            redCards: typeof e.redCards === 'number' ? e.redCards : undefined,
                            substitutionsIn: typeof e.substitutionsIn === 'number' ? e.substitutionsIn : undefined,
                            substitutionsOut: typeof e.substitutionsOut === 'number' ? e.substitutionsOut : undefined,
                            matchesCoached: typeof e.matchesCoached === 'number' ? e.matchesCoached : undefined,
                            wins: typeof e.wins === 'number' ? e.wins : undefined,
                            draws: typeof e.draws === 'number' ? e.draws : undefined,
                            losses: typeof e.losses === 'number' ? e.losses : undefined,
                            trophies: typeof e.trophies === 'number' ? e.trophies : undefined,
                        }))
                        : [],
                    availability: user.availability || "Disponibile",
                    height: physicalStats?.height_cm || user.height || undefined,
                    weight: physicalStats?.weight_kg || user.weight || undefined,
                    dominantFoot: physicalStats?.dominant_foot || user.dominantFoot || undefined,
                    dominantHand: physicalStats?.dominant_hand || user.dominantHand || undefined,
                    specificRole: user.professionalRole === "Player" ? (user.specificRole ?? undefined) : undefined,
                    secondaryRole: user.secondaryRole ?? undefined,
                    footballPrimaryPosition: user.footballPrimaryPosition ?? undefined,
                    footballSecondaryPosition: user.footballSecondaryPosition ?? undefined,
                    uefaLicenses: Array.isArray(user.uefaLicenses) ? user.uefaLicenses : [],
                    coachSpecializations: user.coachSpecializations || "",
                    hasFifaLicense: user.hasFifaLicense || false,
                    fifaLicenseNumber: user.fifaLicenseNumber || "",
                    agentNotes: user.agentNotes || "",
                    certifications: Array.isArray(user.certifications)
                        ? user.certifications.map((c: any, idx: number) => ({
                            id: `${Date.now()}-cert-${idx}`,
                            name: c.name || "",
                            issuingOrganization: c.issuingOrganization || "",
                            yearObtained: c.yearObtained || "",
                            expiryDate: c.expiryDate || "",
                        }))
                        : [],
                });
            } catch (error) {
                console.error(error);
                alert("Errore nel caricamento del profilo");
                didRedirect = true;
                router.push("/home");
            } finally {
                setLoading(false);
            }
        };
        if (userId) fetchUser();
        else {
            setLoading(false);
            alert("Sessione scaduta");
            router.push("/home");
        }
    }, [router, userId]);

    const volleyRoles = [
        "Palleggiatore",
        "Schiacciatore",
        "Centrale",
        "Opposto",
        "Libero"
    ];

    // Basket: ruoli base
    const basketRoles = [
        "Playmaker",
        "Guardia",
        "Ala",
        "Ala grande",
        "Centro",
    ];

    // Coach: ruoli
    const coachRoles = [
        "Allenatore",
        "Allenatore in Seconda",
        "Analista Tattico",
        "Collaboratore Tecnico",
    ];

    // Coach Calcio: ruolo specifico
    const coachFootballRoles = [
        "Allenatore",
        "Allenatore in Seconda",
        "Allenatore dei Portieri",
        "Analista Tattico",
        "Collaboratore Tecnico",
    ];

    // Funzione per generare lista stagioni
    const generateSeasons = (): string[] => {
        const seasons: string[] = []
        const startYear = 2014
        const currentDate = new Date()
        const currentYear = currentDate.getFullYear()
        const currentMonth = currentDate.getMonth() + 1 // 1-12

        // Se siamo post-1 agosto (mese 8), aggiungi la stagione successiva
        const endYear = currentMonth >= 8 ? currentYear + 1 : currentYear

        // Genera dalla più recente alla più vecchia
        for (let year = endYear; year >= startYear; year--) {
            seasons.push(`${year}/${year + 1}`)
        }

        return seasons
    }

    const availableSeasons = generateSeasons()

    // Funzione per estrarre gli anni dalla stagione (es. "2022/2023" -> {startYear: 2022, endYear: 2023})
    const getSeasonYearRange = (season: string): { startYear: number; endYear: number } | null => {
        const match = season.match(/^(\d{4})\/(\d{4})$/)
        if (!match) return null
        return {
            startYear: parseInt(match[1]),
            endYear: parseInt(match[2])
        }
    }

    // Funzione per validare le date di un'esperienza rispetto alla stagione
    const validateExperienceDates = (exp: Experience, showDates: boolean): string | null => {
        // IMPORTANTE: Validare solo se l'utente ha attivato il checkbox "Specifica periodo esatto"
        if (!showDates) return null

        // Se non c'è stagione o non ci sono date inserite, skip validazione
        if (!exp.season) return null
        if (!exp.from && !exp.to) return null

        const range = getSeasonYearRange(exp.season)
        if (!range) return null

        const minDate = `${range.startYear}-01-01`
        const maxDate = `${range.endYear}-12-31`

        // Validazione data inizio
        if (exp.from && exp.from < minDate) {
            return `La data di inizio deve essere successiva al 1 gennaio ${range.startYear} (stagione ${exp.season})`
        }

        if (exp.from && exp.from > maxDate) {
            return `La data di inizio deve essere precedente al 31 dicembre ${range.endYear} (stagione ${exp.season})`
        }

        // Validazione data fine (solo se non sta ancora giocando/allenando)
        if (!exp.isCurrentlyPlaying && exp.to) {
            if (exp.to < minDate) {
                return `La data di fine deve essere successiva al 1 gennaio ${range.startYear} (stagione ${exp.season})`
            }

            if (exp.to > maxDate) {
                return `La data di fine deve essere precedente al 31 dicembre ${range.endYear} (stagione ${exp.season})`
            }
        }

        // Validazione coerenza inizio-fine
        if (exp.from && exp.to && !exp.isCurrentlyPlaying && exp.from > exp.to) {
            return "La data di inizio non può essere successiva alla data di fine"
        }

        return null // Tutto OK
    }

    // Paesi e categorie per sport (semplificati, demo)
    const footballCountries = ["Italia", "Spagna", "Francia", "Germania", "Inghilterra", "Altro"];
    const footballCategoriesByCountry: Record<string, string[]> = {
        Italia: ["Serie A", "Serie B", "Serie C", "Serie D", "Eccellenza", "Promozione", "Prima Categoria", "Giovanili"],
        Spagna: ["La Liga", "Segunda", "Primera RFEF", "Segunda RFEF", "Giovanili"],
        Francia: ["Ligue 1", "Ligue 2", "National", "National 2", "Giovanili"],
        Germania: ["Bundesliga", "2. Bundesliga", "3. Liga", "Regionalliga", "Giovanili"],
        Inghilterra: ["Premier League", "Championship", "League One", "League Two", "National League", "Giovanili"],
    };

    // Calcio: macro-categorie e categorie dettagliate (Italia)
    const footballMacroCategories = [
        "Professionisti",
        "Dilettanti",
        "Amatori",
        "Settore giovanile professionistico",
        "Settore giovanile dilettantistico",
        "Altro",
    ];

    const footballCategoriesByTierItaly: Record<string, string[]> = {
        Professionisti: ["Serie A", "Serie B", "Lega Pro", "Altro"],
        Dilettanti: [
            "Serie D",
            "Eccellenza",
            "Promozione",
            "Prima Categoria",
            "Seconda Categoria",
            "Terza Categoria",
            "Altro",
        ],
        Amatori: ["CSI", "Altro"],
        "Settore giovanile professionistico": [
            "Primavera 1",
            "Primavera 2",
            "Primavera 3",
            "Primavera 4",
            "Under 18 Nazionali",
            "Under 17 Nazionali",
            "Under 17 Nazionali Serie C",
            "Under 16 Nazionali",
            "Under 16 Nazionali Serie C",
            "Under 15 Nazionali",
            "Under 15 Nazionali Serie C",
            "Under 14 Nazionali",
            "Altro",
        ],
        "Settore giovanile dilettantistico": [
            "Juniores Nazionale U19",
            "Juniores Élite U19",
            "Juniores Regionali U19",
            "Juniores Provinciali U19",
            "Under 18 Regionali",
            "Under 17 Élite",
            "Under 17 Regionali",
            "Under 17 Provinciali",
            "Under 16 Élite",
            "Under 16 Regionali",
            "Under 16 Provinciali",
            "Under 15 Élite",
            "Under 15 Regionali",
            "Under 15 Provinciali",
            "Under 14 Élite",
            "Under 14 Regionali",
            "Under 14 Provinciali",
            "Altro",
        ],
        Altro: ["Altro"],
    };

    // Calcio Femminile (Italia)
    const footballFemaleCategoriesItaly = [
        "Serie A Femminile",
        "Serie B Femminile",
        "Serie C Femminile",
        "Dilettanti (Eccellenza)",
        "Primavera 1 Femminile",
        "Primavera 2 Femminile",
        "Under 19 Femminile",
        "Under 17 Femminile",
        "Under 15 Femminile",
        "Altro",
    ];

    // Calcio Femminile organizzato per macro-categoria (Italia)
    const footballFemaleCategoriesByTierItaly: Record<string, string[]> = {
        Professionisti: ["Serie A", "Serie B", "Serie C"],
        Dilettanti: ["Eccellenza"],
        "Settore giovanile professionistico": ["Primavera 1", "Primavera 2"],
        "Settore giovanile dilettantistico": ["Under 19", "Under 17", "Under 15"],
        Amatori: ["Altro"],
        Altro: ["Altro"],
    };

    // Calcio Femminile (fallback per altri Paesi)
    const footballFemaleCategoriesDefault = [
        "Prima Divisione Femminile",
        "Seconda Divisione Femminile",
        "Giovanili U19 Femminile",
        "Giovanili U17 Femminile",
        "Giovanili U15 Femminile",
        "Altro",
    ];

    // Calcio Femminile per altri paesi (fallback)
    const footballFemaleCategoriesByTierDefault: Record<string, string[]> = {
        Professionisti: ["Prima Divisione", "Seconda Divisione", "Altro"],
        Dilettanti: ["Divisioni Regionali", "Divisioni Locali", "Altro"],
        "Settore giovanile professionistico": ["U19", "U17", "U15", "Altro"],
        "Settore giovanile dilettantistico": ["U19 Regional", "U17 Regional", "U15 Regional", "Altro"],
        Amatori: ["Amatori", "Altro"],
        Altro: ["Altro"],
    };

    // Tipologie Competizione (universale per tutti gli sport)
    const competitionTypes = [
        { value: "male", label: "Maschile" },
        { value: "female", label: "Femminile" },
        { value: "open", label: "Open" },
        { value: "mixed", label: "Misto" },
    ];

    // Fallback categorie per altri Paesi (MVP semplificato)
    const footballCategoriesByTierDefault: Record<string, string[]> = {
        Professionisti: ["Prima Divisione", "Seconda Divisione", "Coppe", "Altro"],
        Dilettanti: ["Divisioni Regionali", "Divisioni Locali", "Altro"],
        Amatori: ["Amatori", "Altro"],
        "Settore giovanile professionistico": ["U19", "U17", "U15", "Altro"],
        "Settore giovanile dilettantistico": ["U19 Regional", "U17 Regional", "U15 Regional", "Altro"],
        Altro: ["Altro"],
    };

    const basketCountries = ["Italia", "Spagna", "Francia", "Germania", "Inghilterra", "Altro"];

    // Basket: macro-categorie (come per il calcio)
    const basketMacroCategories = [
        "Professionisti",
        "Dilettanti",
        "Amatori",
        "Settore giovanile professionistico",
        "Settore giovanile dilettantistico",
        "Altro",
    ];

    // Basket Maschile (Italia) - organizzato per macro-categoria
    const basketMaleCategoresByTierItaly: Record<string, string[]> = {
        Professionisti: ["Serie A (LBA)", "Serie A2", "Serie B", "Altro"],
        Dilettanti: ["Serie B interregionale", "Serie C gold", "Serie C silver", "Serie D", "Prima Divisione", "Seconda Divisione", "Altro"],
        Amatori: ["Promozionali / Amatori", "Altro"],
        "Settore giovanile professionistico": ["Under 19 Eccellenza", "Under 17 Eccellenza", "Under 15 Eccellenza", "Altro"],
        "Settore giovanile dilettantistico": ["Under 19 Gold", "Under 17 Gold", "Under 15 Gold", "Under 14", "Under 13", "Altro"],
        Altro: ["Altro"],
    };

    // Basket Femminile (Italia) - organizzato per macro-categoria
    const basketFemaleCategoresByTierItaly: Record<string, string[]> = {
        Professionisti: ["Serie A1", "Serie A2", "Altro"],
        Dilettanti: ["Serie B", "Serie C", "Serie D", "Altro"],
        Amatori: ["Amatori", "Altro"],
        "Settore giovanile professionistico": ["Under 19 Eccellenza", "Under 17 Eccellenza", "Under 15 Eccellenza", "Altro"],
        "Settore giovanile dilettantistico": ["Under 19 Gold", "Under 17 Gold", "Under 15 Gold", "Under 14", "Under 13", "Altro"],
        Altro: ["Altro"],
    };

    // Basket per altri paesi (fallback)
    const basketCategoriesByCountry: Record<string, string[]> = {
        Italia: ["Serie A1", "Serie A2", "Serie B", "Serie C", "Divisioni Regionali", "Amatori"],
        Spagna: ["Liga ACB", "LEB Oro", "LEB Plata", "Liga EBA", "Regional"],
        Francia: ["LNB Pro A", "LNB Pro B", "Nationale 1", "Nationale 2", "Régionales"],
        Germania: ["BBL", "ProA", "ProB", "Regionalliga", "Oberliga"],
        Inghilterra: ["BBL", "NBL Division 1", "NBL Division 2", "Regional"],
    };

    // Basket fallback per altri paesi (struttura con tier)
    const basketCategoriesByTierDefault: Record<string, string[]> = {
        Professionisti: ["Prima Divisione", "Seconda Divisione", "Altro"],
        Dilettanti: ["Divisioni Regionali", "Divisioni Locali", "Altro"],
        Amatori: ["Amatori", "Altro"],
        "Settore giovanile professionistico": ["U19", "U17", "U15", "Altro"],
        "Settore giovanile dilettantistico": ["U19 Regional", "U17 Regional", "U15 Regional", "Altro"],
        Altro: ["Altro"],
    };

    const volleyCountries = ["Italia", "Spagna", "Francia", "Germania", "Inghilterra", "Altro"];

    // Pallavolo: macro-categorie (come per il calcio e basket)
    const volleyMacroCategories = [
        "Professionisti",
        "Dilettanti",
        "Amatori",
        "Settore giovanile professionistico",
        "Settore giovanile dilettantistico",
        "Altro",
    ];

    // Pallavolo Maschile (Italia) - organizzato per macro-categoria
    const volleyMaleCategoresByTierItaly: Record<string, string[]> = {
        Professionisti: ["SuperLega Serie A", "Serie A2", "Altro"],
        Dilettanti: ["Serie A3", "Serie B", "Serie C", "Serie D", "Prima divisione", "Seconda divisione", "Terza divisione", "Altro"],
        Amatori: ["Amatoriali", "Altro"],
        "Settore giovanile professionistico": ["Under 19", "Under 17", "Under 15", "Altro"],
        "Settore giovanile dilettantistico": ["Under 14", "Under 13", "Under 12", "Altro"],
        Altro: ["Altro"],
    };

    // Pallavolo Femminile (Italia) - organizzato per macro-categoria
    const volleyFemaleCategoresByTierItaly: Record<string, string[]> = {
        Professionisti: ["Serie A1", "Serie A2", "Altro"],
        Dilettanti: ["Serie B1", "Serie B2", "Serie C", "Serie D", "Divisioni provinciali", "Altro"],
        Amatori: ["Amatori", "Altro"],
        "Settore giovanile professionistico": ["Under 19", "Under 17", "Under 15", "Altro"],
        "Settore giovanile dilettantistico": ["Under 14", "Under 13", "Under 12", "Altro"],
        Altro: ["Altro"],
    };

    // Pallavolo per altri paesi (fallback)
    const volleyCategoriesByCountry: Record<string, string[]> = {
        Italia: ["SuperLega", "Serie A2", "Serie A3", "Serie B", "Serie C", "Divisioni Regionali"],
        Spagna: ["Superliga", "Superliga 2", "Primera División", "Regional"],
        Francia: ["Ligue A", "Ligue B", "Nationale 1", "Régionales"],
        Germania: ["1. Bundesliga", "2. Bundesliga", "3. Liga", "Regionalliga"],
        Inghilterra: ["Super League", "National League", "Regional"],
    };

    // Pallavolo fallback per altri paesi (struttura con tier)
    const volleyCategoriesByTierDefault: Record<string, string[]> = {
        Professionisti: ["Prima Divisione", "Seconda Divisione", "Altro"],
        Dilettanti: ["Divisioni Regionali", "Divisioni Locali", "Altro"],
        Amatori: ["Amatori", "Altro"],
        "Settore giovanile professionistico": ["U19", "U17", "U15", "Altro"],
        "Settore giovanile dilettantistico": ["U14", "U13", "U12", "Altro"],
        Altro: ["Altro"],
    };

    // --- Coach: Licenze UEFA ---
    const uefaLicenseOptions = [
        "UEFA Pro License",
        "UEFA A License",
        "UEFA B License",
        "UEFA C License",
        "Youth License",
        "Grassroots License",
        "Allenatore di Base (Italia)",
        "Allenatore UEFA C Giovanile (Italia)"
    ];

    // --- Certificazioni suggerite per Allenatore (Coach) ---
    const coachCertificationOptions: Record<string, string[]> = {
        Calcio: [
            "Licenza UEFA Pro",
            "Licenza UEFA A",
            "Licenza UEFA B",
            "Licenza UEFA C",
            "Corsi FIGC / Settore Tecnico Coverciano",
            "Allenatore di Base (FIGC)",
            "Allenatore UEFA C Giovanile (FIGC)",
            "Youth License",
            "Grassroots License",
        ],
        Basket: [
            "Corso Allenatori FIP (Federazione Italiana Pallacanestro)",
            "Patentino Allenatore FIP A",
            "Patentino Allenatore FIP B",
            "Patentino Allenatore FIP C",
            "Corso Allenatori Giovanili FIP",
        ],
        Pallavolo: [
            "Corso Allenatori FIPAV (Federazione Italiana Pallavolo)",
            "Patentino Allenatore FIPAV A",
            "Patentino Allenatore FIPAV B",
            "Patentino Allenatore FIPAV C",
            "Corso Allenatori Giovanili FIPAV",
        ],
    };

    // --- Certificazioni suggerite per Direttore Sportivo ---
    const directorCertificationOptions: Record<string, string[]> = {
        Calcio: [
            "Elenco Speciale Direttori Sportivi (FIGC)",
            "Corso Direttore Sportivo FIGC",
            "Certificazione Gestione Sportiva",
        ],
        Basket: [
            "Elenco Ufficiale Direttori Sportivi (FIP)",
            "Corso Direttore Sportivo FIP",
        ],
        Pallavolo: [
            "Elenco Ufficiale Direttori Sportivi (FIPAV)",
            "Corso Direttore Sportivo FIPAV",
        ],
    };

    // --- Certificazioni suggerite per Fisioterapista ---
    const physioCertificationOptions: Record<string, string[]> = {
        Calcio: [
            "Laurea in Fisioterapia",
            "Iscrizione Albo Professionale TSRM PSTRP",
            "Specializzazione Fisioterapia dello Sport",
            "Certificazione IAASP (International Association of Athletic and Sports Physical Therapists)",
        ],
        Basket: [
            "Laurea in Fisioterapia",
            "Iscrizione Albo Professionale TSRM PSTRP",
            "Specializzazione Fisioterapia dello Sport",
            "Certificazione IAASP",
        ],
        Pallavolo: [
            "Laurea in Fisioterapia",
            "Iscrizione Albo Professionale TSRM PSTRP",
            "Specializzazione Fisioterapia dello Sport",
            "Certificazione IAASP",
        ],
    };

    // --- Certificazioni suggerite per Preparatore Atletico ---
    const athleticTrainerCertificationOptions: Record<string, string[]> = {
        Calcio: [
            "Laurea in Scienze Motorie",
            "NSCA CSCS (Certified Strength and Conditioning Specialist)",
            "IUSCA IQF Levels",
            "Certificazione Preparatore Atletico",
            "Specializzazione Allenamento della Forza e del Condizionamento",
        ],
        Basket: [
            "Laurea in Scienze Motorie",
            "NSCA CSCS",
            "IUSCA IQF Levels",
            "Certificazione Preparatore Atletico",
            "Specializzazione Allenamento della Forza e del Condizionamento",
        ],
        Pallavolo: [
            "Laurea in Scienze Motorie",
            "NSCA CSCS",
            "IUSCA IQF Levels",
            "Certificazione Preparatore Atletico",
            "Specializzazione Allenamento della Forza e del Condizionamento",
        ],
    };

    // ...existing code...
    const updateField = (key: keyof FormState, value: any) => {
        setForm((prev) => ({ ...prev, [key]: value }))
    }

    // --- Gestione UEFA Licenses (multi-select) ---
    const toggleUefaLicense = (license: string) => {
        setForm(prev => {
            const current = prev.uefaLicenses || [];
            const isSelected = current.includes(license);
            return {
                ...prev,
                uefaLicenses: isSelected
                    ? current.filter(l => l !== license)
                    : [...current, license]
            };
        });
    };

    // --- Gestione Certificazioni Staff ---
    const addCertification = () => {
        setForm(prev => ({ ...prev, certifications: [...(prev.certifications || []), emptyCertification()] }));
    };

    const removeCertification = (id: string) => {
        setForm(prev => ({
            ...prev,
            certifications: (prev.certifications || []).filter(c => c.id !== id)
        }));
    };

    const handleCertificationChange = (id: string, key: keyof Certification, value: string) => {
        setForm(prev => ({
            ...prev,
            certifications: (prev.certifications || []).map(cert =>
                cert.id === id ? { ...cert, [key]: value } : cert
            )
        }));
    };

    // --- Calcio: opzioni guidate ---
    const footballPrimaryOptions = [
        { value: "Portiere", label: "Portiere" },
        { value: "Difensore", label: "Difensore" },
        { value: "Centrocampista", label: "Centrocampista" },
        { value: "Attaccante", label: "Attaccante" },
    ];
    const footballSecondaryOptions: Record<string, { value: string; label: string }[]> = {
        Portiere: [{ value: "Portiere", label: "Portiere" }],
        Difensore: [
            { value: "Difensore centrale", label: "Difensore centrale" },
            { value: "Terzino destro", label: "Terzino destro" },
            { value: "Terzino sinistro", label: "Terzino sinistro" },
        ],
        Centrocampista: [
            { value: "Mediano", label: "Mediano" },
            { value: "Mezzala", label: "Mezzala" },
            { value: "Trequartista", label: "Trequartista" },
            { value: "Esterno destro", label: "Esterno destro" },
            { value: "Esterno sinistro", label: "Esterno sinistro" },
        ],
        Attaccante: [
            { value: "Ala destra", label: "Ala destra" },
            { value: "Ala sinistra", label: "Ala sinistra" },
            { value: "Punta centrale", label: "Punta centrale" },
            { value: "Seconda punta", label: "Seconda punta" },
        ],
    };

    // Gestione auto-popola e compatibilità
    const handleFootballPrimaryChange = (value: string) => {
        setForm(prev => {
            // Se il dettaglio non è valido per il nuovo primario, resetta
            const validSecondaries = footballSecondaryOptions[value] || [];
            const isValid = validSecondaries.some(opt => opt.value === prev.footballSecondaryPosition);
            return {
                ...prev,
                footballPrimaryPosition: value as any,
                footballSecondaryPosition: isValid ? prev.footballSecondaryPosition : undefined,
                // Auto-popola compatibilità
                secondaryRole: value || undefined,
                currentRole: isValid ? prev.footballSecondaryPosition || "" : "",
            };
        });
    };
    const handleFootballSecondaryChange = (value: string) => {
        setForm(prev => ({
            ...prev,
            footballSecondaryPosition: value,
            currentRole: value,
        }));
    };

    const handleExperienceChange = (id: string, key: keyof Experience, value: string | number | boolean) => {
        const numericKeys: (keyof Experience)[] = [
            'goals', 'cleanSheets', 'appearances', 'pointsPerGame', 'assists', 'rebounds',
            'volleyAces', 'volleyBlocks', 'volleyDigs',
            'minutesPlayed', 'penalties', 'yellowCards', 'redCards', 'substitutionsIn', 'substitutionsOut',
            'matchesCoached', 'wins', 'draws', 'losses', 'trophies'
        ]
        const coercedValue = numericKeys.includes(key)
            ? (typeof value === 'number' ? value : value === '' ? undefined : Number(value))
            : value

        // Aggiorna l'esperienza
        setForm((prev) => ({
            ...prev,
            experiences: prev.experiences.map((exp) =>
                exp.id === id ? { ...exp, [key]: coercedValue as any } : exp
            ),
        }))

        // Se il campo modificato è rilevante per la validazione date, valida dopo l'update
        if (['season', 'from', 'to', 'isCurrentlyPlaying'].includes(key)) {
            // Usa setTimeout per permettere allo state di aggiornarsi prima della validazione
            setTimeout(() => {
                setForm((prev) => {
                    const exp = prev.experiences.find(e => e.id === id)
                    if (!exp) return prev

                    const error = validateExperienceDates(exp, showDatesForExp[id] || false)
                    setDateErrors(prevErrors => {
                        if (error) {
                            return { ...prevErrors, [id]: error }
                        } else {
                            const { [id]: _, ...rest } = prevErrors
                            return rest
                        }
                    })

                    return prev
                })
            }, 0)
        }
    }

    const addExperience = () => {
        setForm((prev) => ({ ...prev, experiences: [...prev.experiences, emptyExperience()] }))
    }

    const removeExperience = (id: string) => {
        setForm((prev) => ({
            ...prev,
            experiences: prev.experiences.filter((exp) => exp.id !== id),
        }))
        // Rimuovi anche lo stato delle date per questa esperienza
        setShowDatesForExp(prev => {
            const { [id]: _, ...rest } = prev
            return rest
        })
        // Rimuovi anche eventuali errori di validazione date
        setDateErrors(prev => {
            const { [id]: _, ...rest } = prev
            return rest
        })
    }

    const toggleDatesForExp = (id: string) => {
        setShowDatesForExp(prev => {
            const newValue = !prev[id]

            // Se si attiva il checkbox (da false a true), valida le date
            if (newValue) {
                setTimeout(() => {
                    const exp = form.experiences.find(e => e.id === id)
                    if (exp) {
                        const error = validateExperienceDates(exp, true)
                        setDateErrors(prevErrors => {
                            if (error) {
                                return { ...prevErrors, [id]: error }
                            } else {
                                const { [id]: _, ...rest } = prevErrors
                                return rest
                            }
                        })
                    }
                }, 0)
            } else {
                // Se si disattiva il checkbox, rimuovi eventuali errori
                setDateErrors(prevErrors => {
                    const { [id]: _, ...rest } = prevErrors
                    return rest
                })
            }

            return {
                ...prev,
                [id]: newValue
            }
        })
    }

    // Validazione coerenza statistiche Coach
    const validateCoachStats = (exp: Experience): boolean => {
        if (!isCoach) return true
        const { matchesCoached, wins, draws, losses } = exp
        if (!matchesCoached || matchesCoached === 0) return true // Se non inserito, skip validazione
        const total = (wins || 0) + (draws || 0) + (losses || 0)
        return total === matchesCoached
    }

    const handleUpload = async (file: File, folder: "avatars" | "covers", field: "avatarUrl" | "coverUrl") => {
        try {
            const result = await uploadService.uploadFile(file, folder)
            if (!result.success || !result.url) throw new Error(result.error || "Upload fallito")
            updateField(field, result.url)
        } catch (error) {
            console.error(error)
            alert("Errore nel caricamento del file")
        }
    }

    const handleSave = async () => {
        if (!userId) return

        // Validazione pre-salvataggio: verifica errori date (solo per esperienze con date specificate)
        const experiencesWithDateErrors: string[] = []
        form.experiences.forEach(exp => {
            const error = validateExperienceDates(exp, showDatesForExp[exp.id] || false)
            if (error) {
                experiencesWithDateErrors.push(exp.id)
                setDateErrors(prev => ({ ...prev, [exp.id]: error }))
            }
        })

        if (experiencesWithDateErrors.length > 0) {
            alert(`Ci sono ${experiencesWithDateErrors.length} esperienze con date non valide. Correggi gli errori prima di salvare.`)
            return
        }

        setSaving(true)
        try {
            // Sanificazione payload: rimuovi campi non supportati dalla tabella profiles
            let payload: any = {
                id: userId,
                firstName: form.firstName,
                lastName: form.lastName,
                username: form.username,
                email: form.email,
                birthDate: form.birthDate,
                bio: form.bio,
                city: form.city,
                country: form.country,
                avatarUrl: form.avatarUrl,
                coverUrl: form.coverUrl,
            }

            // Le experiences NON vanno nella tabella profiles (verranno gestite separatamente)
            // I dati fisici (height, weight, dominantFoot, dominantHand) vanno in physical_stats
            // Tutti i campi role-specific (uefaLicenses, certifications, ecc.) non sono più nella tabella profiles

            const res = await fetch("/api/users", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            })
            if (!res.ok) {
                const errorData = await res.text()
                console.error('Save failed:', res.status, errorData)
                throw new Error(`Save failed: ${res.status}`)
            }
            const updated = await res.json()

            // Save physical stats to dedicated table if user is a player
            if (isPlayer && (form.height || form.weight || form.dominantFoot || form.dominantHand)) {
                try {
                    const physRes = await fetch("/api/physical-stats", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                            userId: userId,
                            height_cm: form.height || null,
                            weight_kg: form.weight || null,
                            dominant_foot: form.dominantFoot || null,
                            dominant_hand: form.dominantHand || null,
                        }),
                    })
                    if (!physRes.ok) {
                        const physError = await physRes.text()
                        console.error('Physical stats save failed:', physRes.status, physError)
                    }
                } catch (physErr) {
                    console.error('Error saving physical stats:', physErr)
                    // Non blocchiamo il salvataggio principale
                }
            }

            localStorage.setItem("currentUserName", `${updated.firstName ?? ""} ${updated.lastName ?? ""}`.trim())
            localStorage.setItem("currentUserEmail", updated.email ?? "")
            if (updated.avatarUrl) localStorage.setItem("currentUserAvatar", updated.avatarUrl)
            router.push(`/profile/${updated.id}`)
        } catch (error) {
            console.error(error)
            alert("Impossibile salvare le modifiche")
        } finally {
            setSaving(false)
        }
    }

    const inputBase =
        "w-full rounded-xl border border-gray-300 bg-gray-50 px-4 py-3 text-sm text-gray-900 placeholder:text-gray-500 focus:border-[#2341F0] focus:ring-2 focus:ring-[#2341F0] focus:ring-opacity-40"

    if (loading) {
        return (
            <div className="min-h-screen bg-white text-gray-900 flex items-center justify-center">
                <div className="text-lg font-semibold">Caricamento profilo...</div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-white text-gray-900">
            <div className="max-w-6xl mx-auto px-4 py-10 lg:py-12">
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <p className="text-sm uppercase tracking-[0.2em] text-gray-600">Profilo</p>
                        <h1 className="text-3xl font-semibold mt-1">Modifica il tuo profilo</h1>
                    </div>
                    <div className="flex gap-3">
                        <button
                            onClick={() => router.back()}
                            className="rounded-xl border border-gray-300 bg-gray-100 px-4 py-2 text-sm text-gray-900 hover:bg-gray-200"
                        >
                            Annulla
                        </button>
                        <button
                            onClick={handleSave}
                            disabled={saving}
                            className="rounded-xl bg-[#2341F0] px-4 py-2 text-sm font-semibold text-white hover:bg-[#1f35c2] disabled:opacity-60"
                        >
                            {saving ? "Salvataggio..." : "Salva modifiche"}
                        </button>
                    </div>
                </div>

                {/* Main content */}
                <div className="space-y-6">
                    <section className="rounded-2xl border border-gray-200 bg-white p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs uppercase tracking-[0.2em] text-gray-600">Informazioni personali</p>
                                <h2 className="text-xl font-semibold mt-1">Dettagli principali</h2>
                            </div>
                            <div className="text-xs text-gray-600">Completa per aumentare la fiducia</div>
                        </div>
                        <div className="mt-6 grid gap-4 lg:grid-cols-2">
                            <div className="space-y-2">
                                <label className="text-sm text-gray-700">Email</label>
                                <input
                                    type="email"
                                    value={form.email}
                                    onChange={(e) => updateField("email", e.target.value)}
                                    placeholder="Email"
                                    className={inputBase}
                                    disabled
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm text-gray-700">Username</label>
                                <input
                                    value={form.username}
                                    onChange={(e) => updateField("username", e.target.value)}
                                    placeholder="Username"
                                    className={inputBase}
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm text-gray-700">Data di nascita</label>
                                <input
                                    type="date"
                                    value={form.birthDate}
                                    onChange={(e) => updateField("birthDate", e.target.value)}
                                    className={inputBase}
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm text-gray-700">Bio</label>
                                <textarea
                                    value={form.bio}
                                    onChange={(e) => updateField("bio", e.target.value)}
                                    rows={4}
                                    placeholder="Racconta la tua storia, specializzazioni, risultati..."
                                    className={`${inputBase} resize-none`}
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm text-gray-700">Disponibilità per lavori</label>
                                <select
                                    value={form.availability}
                                    onChange={(e) => updateField("availability", e.target.value)}
                                    className={inputBase}
                                >
                                    <option value="Disponibile">Disponibile</option>
                                    <option value="Non disponibile">Non disponibile</option>
                                </select>
                            </div>
                            {isPlayer && (
                                <>
                                    <div className="space-y-2">
                                        <label className="text-sm text-gray-700">Altezza (cm)</label>
                                        <input
                                            type="number"
                                            min="0"
                                            max="250"
                                            value={form.height || ""}
                                            onChange={(e) => updateField("height", e.target.value ? Number(e.target.value) : undefined)}
                                            placeholder="Es: 180"
                                            className={inputBase}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm text-gray-700">Peso (kg)</label>
                                        <input
                                            type="number"
                                            min="0"
                                            max="200"
                                            value={form.weight || ""}
                                            onChange={(e) => updateField("weight", e.target.value ? Number(e.target.value) : undefined)}
                                            placeholder="Es: 75"
                                            className={inputBase}
                                        />
                                    </div>
                                    {mainSport === "Calcio" && (
                                        <div className="space-y-2">
                                            <label className="text-sm text-gray-700">Piede dominante</label>
                                            <select
                                                value={form.dominantFoot || ""}
                                                onChange={(e) => updateField("dominantFoot", e.target.value || undefined)}
                                                className={inputBase}
                                            >
                                                <option value="">Seleziona piede</option>
                                                <option value="destro">Destro</option>
                                                <option value="sinistro">Sinistro</option>
                                                <option value="ambidestro">Ambidestro</option>
                                            </select>
                                        </div>
                                    )}
                                    {(mainSport === "Basket" || mainSport === "Pallavolo") && (
                                        <div className="space-y-2">
                                            <label className="text-sm text-gray-700">Mano dominante</label>
                                            <select
                                                value={form.dominantHand || ""}
                                                onChange={(e) => updateField("dominantHand", e.target.value || undefined)}
                                                className={inputBase}
                                            >
                                                <option value="">Seleziona mano</option>
                                                <option value="destra">Destra</option>
                                                <option value="sinistra">Sinistra</option>
                                                <option value="ambidestra">Ambidestra</option>
                                            </select>
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                    </section>

                    {/* Sezione Qualifiche Agent */}
                    {isAgent && (
                        <section className="rounded-2xl border border-gray-200 bg-white p-6">
                            <div className="mb-6">
                                <p className="text-xs uppercase tracking-[0.2em] text-gray-500">Qualifiche</p>
                                <h2 className="text-xl font-semibold mt-1 text-gray-900">Licenza e Informazioni</h2>
                            </div>

                            <div className="space-y-4">
                                {/* Licenza FIFA */}
                                <label className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition">
                                    <input
                                        type="checkbox"
                                        checked={form.hasFifaLicense || false}
                                        onChange={(e) => updateField("hasFifaLicense", e.target.checked)}
                                        className="w-5 h-5 text-green-600 border-gray-300 rounded focus:ring-green-500"
                                    />
                                    <div>
                                        <span className="block text-sm font-semibold text-gray-900">Licenza FIFA</span>
                                        <span className="text-xs text-gray-500">Sono un agente FIFA registrato</span>
                                    </div>
                                </label>

                                {/* Numero Licenza */}
                                {form.hasFifaLicense && (
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Numero Licenza FIFA
                                        </label>
                                        <input
                                            type="text"
                                            value={form.fifaLicenseNumber || ""}
                                            onChange={(e) => updateField("fifaLicenseNumber", e.target.value)}
                                            placeholder="Es: 123456789"
                                            className="w-full rounded-xl border border-gray-300 bg-gray-50 px-4 py-3 text-sm text-gray-900 focus:border-green-500 focus:ring-1 focus:ring-green-500"
                                        />
                                    </div>
                                )}

                                {/* Note Agente */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Informazioni Aggiuntive
                                    </label>
                                    <textarea
                                        value={form.agentNotes || ""}
                                        onChange={(e) => updateField("agentNotes", e.target.value)}
                                        rows={3}
                                        placeholder="Es: Specializzazione in trasferimenti internazionali, focus su giovani talenti..."
                                        className="w-full rounded-xl border border-gray-300 bg-gray-50 px-4 py-3 text-sm text-gray-900 resize-none focus:border-green-500 focus:ring-1 focus:ring-green-500"
                                    />
                                </div>
                            </div>
                        </section>
                    )}

                    {/* Sezione Certificazioni Coach */}
                    {isCoach && (
                        <section className="rounded-2xl border border-gray-200 bg-white p-6">
                            <div className="flex items-center justify-between mb-6">
                                <div>
                                    <p className="text-xs uppercase tracking-[0.2em] text-gray-500">Qualifiche</p>
                                    <h2 className="text-xl font-semibold mt-1 text-gray-900">Certificazioni Allenatore</h2>
                                </div>
                                <button
                                    type="button"
                                    onClick={addCertification}
                                    className="inline-flex items-center gap-2 rounded-full bg-green-600 px-3 py-2 text-xs font-semibold text-white hover:bg-green-700"
                                >
                                    <PlusIcon className="h-4 w-4" />
                                    Aggiungi certificazione
                                </button>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <p className="text-xs text-gray-600 mb-3">Seleziona dalle certificazioni suggerite:</p>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-4">
                                        {mainSport && coachCertificationOptions[mainSport]?.map((cert) => (
                                            <button
                                                key={cert}
                                                type="button"
                                                onClick={() => setForm(prev => ({ ...prev, certifications: [...(prev.certifications || []), { ...emptyCertification(), name: cert }] }))}
                                                className="text-left p-2 text-sm border border-green-300 rounded-lg bg-green-50 hover:bg-green-100 transition"
                                            >
                                                + {cert}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {(form.certifications || []).length === 0 && (
                                    <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50 p-4 text-sm text-gray-500">
                                        Nessuna certificazione inserita. Aggiungi le tue qualifiche professionali.
                                    </div>
                                )}

                                {(form.certifications || []).map((cert) => (
                                    <div key={cert.id} className="rounded-xl border border-gray-200 bg-white p-4">
                                        <div className="flex items-start justify-between gap-3">
                                            <div className="flex-1 grid gap-3 md:grid-cols-2">
                                                <input
                                                    value={cert.name}
                                                    onChange={(e) => handleCertificationChange(cert.id, "name", e.target.value)}
                                                    placeholder="Nome certificazione"
                                                    className="w-full rounded-xl border border-gray-300 bg-gray-50 px-4 py-3 text-sm text-gray-900"
                                                />
                                                <input
                                                    value={cert.issuingOrganization}
                                                    onChange={(e) => handleCertificationChange(cert.id, "issuingOrganization", e.target.value)}
                                                    placeholder="Ente rilascio (FIGC, FIP, FIPAV)"
                                                    className="w-full rounded-xl border border-gray-300 bg-gray-50 px-4 py-3 text-sm text-gray-900"
                                                />
                                                <input
                                                    type="number"
                                                    value={cert.yearObtained}
                                                    onChange={(e) => handleCertificationChange(cert.id, "yearObtained", e.target.value)}
                                                    placeholder="Anno conseguimento"
                                                    min="1950"
                                                    max={new Date().getFullYear()}
                                                    className="w-full rounded-xl border border-gray-300 bg-gray-50 px-4 py-3 text-sm text-gray-900"
                                                />
                                                <input
                                                    type="number"
                                                    value={cert.expiryDate || ""}
                                                    onChange={(e) => handleCertificationChange(cert.id, "expiryDate", e.target.value)}
                                                    placeholder="Scadenza (opzionale)"
                                                    min={cert.yearObtained || "1950"}
                                                    className="w-full rounded-xl border border-gray-300 bg-gray-50 px-4 py-3 text-sm text-gray-900"
                                                />
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => removeCertification(cert.id)}
                                                className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-red-300 text-red-500 hover:border-red-500 hover:bg-red-50"
                                            >
                                                <XMarkIcon className="h-5 w-5" />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </section>
                    )}

                    {/* Sezione Certificazioni Direttore Sportivo */}
                    {isSportingDirector && (
                        <section className="rounded-2xl border border-gray-200 bg-white p-6">
                            <div className="flex items-center justify-between mb-6">
                                <div>
                                    <p className="text-xs uppercase tracking-[0.2em] text-gray-500">Qualifiche</p>
                                    <h2 className="text-xl font-semibold mt-1 text-gray-900">Certificazioni Direttore Sportivo</h2>
                                </div>
                                <button
                                    type="button"
                                    onClick={addCertification}
                                    className="inline-flex items-center gap-2 rounded-full bg-green-600 px-3 py-2 text-xs font-semibold text-white hover:bg-green-700"
                                >
                                    <PlusIcon className="h-4 w-4" />
                                    Aggiungi certificazione
                                </button>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <p className="text-xs text-gray-600 mb-3">Seleziona dalle certificazioni suggerite:</p>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-4">
                                        {mainSport && directorCertificationOptions[mainSport]?.map((cert) => (
                                            <button
                                                key={cert}
                                                type="button"
                                                onClick={() => setForm(prev => ({ ...prev, certifications: [...(prev.certifications || []), { ...emptyCertification(), name: cert }] }))}
                                                className="text-left p-2 text-sm border border-green-300 rounded-lg bg-green-50 hover:bg-green-100 transition"
                                            >
                                                + {cert}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {(form.certifications || []).length === 0 && (
                                    <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50 p-4 text-sm text-gray-500">
                                        Nessuna certificazione inserita. Aggiungi le tue qualifiche professionali.
                                    </div>
                                )}

                                {(form.certifications || []).map((cert) => (
                                    <div key={cert.id} className="rounded-xl border border-gray-200 bg-white p-4">
                                        <div className="flex items-start justify-between gap-3">
                                            <div className="flex-1 grid gap-3 md:grid-cols-2">
                                                <input
                                                    value={cert.name}
                                                    onChange={(e) => handleCertificationChange(cert.id, "name", e.target.value)}
                                                    placeholder="Nome certificazione"
                                                    className="w-full rounded-xl border border-gray-300 bg-gray-50 px-4 py-3 text-sm text-gray-900"
                                                />
                                                <input
                                                    value={cert.issuingOrganization}
                                                    onChange={(e) => handleCertificationChange(cert.id, "issuingOrganization", e.target.value)}
                                                    placeholder="Ente rilascio (FIGC, FIP, FIPAV)"
                                                    className="w-full rounded-xl border border-gray-300 bg-gray-50 px-4 py-3 text-sm text-gray-900"
                                                />
                                                <input
                                                    type="number"
                                                    value={cert.yearObtained}
                                                    onChange={(e) => handleCertificationChange(cert.id, "yearObtained", e.target.value)}
                                                    placeholder="Anno conseguimento"
                                                    min="1950"
                                                    max={new Date().getFullYear()}
                                                    className="w-full rounded-xl border border-gray-300 bg-gray-50 px-4 py-3 text-sm text-gray-900"
                                                />
                                                <input
                                                    type="number"
                                                    value={cert.expiryDate || ""}
                                                    onChange={(e) => handleCertificationChange(cert.id, "expiryDate", e.target.value)}
                                                    placeholder="Scadenza (opzionale)"
                                                    min={cert.yearObtained || "1950"}
                                                    className="w-full rounded-xl border border-gray-300 bg-gray-50 px-4 py-3 text-sm text-gray-900"
                                                />
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => removeCertification(cert.id)}
                                                className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-red-300 text-red-500 hover:border-red-500 hover:bg-red-50"
                                            >
                                                <XMarkIcon className="h-5 w-5" />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </section>
                    )}

                    {/* Sezione Certificazioni Fisioterapista */}
                    {isPhysio && (
                        <section className="rounded-2xl border border-gray-200 bg-white p-6">
                            <div className="flex items-center justify-between mb-6">
                                <div>
                                    <p className="text-xs uppercase tracking-[0.2em] text-gray-500">Qualifiche</p>
                                    <h2 className="text-xl font-semibold mt-1 text-gray-900">Certificazioni Fisioterapista</h2>
                                </div>
                                <button
                                    type="button"
                                    onClick={addCertification}
                                    className="inline-flex items-center gap-2 rounded-full bg-green-600 px-3 py-2 text-xs font-semibold text-white hover:bg-green-700"
                                >
                                    <PlusIcon className="h-4 w-4" />
                                    Aggiungi certificazione
                                </button>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <p className="text-xs text-gray-600 mb-3">Seleziona dalle certificazioni suggerite:</p>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-4">
                                        {mainSport && physioCertificationOptions[mainSport]?.map((cert) => (
                                            <button
                                                key={cert}
                                                type="button"
                                                onClick={() => setForm(prev => ({ ...prev, certifications: [...(prev.certifications || []), { ...emptyCertification(), name: cert }] }))}
                                                className="text-left p-2 text-sm border border-green-300 rounded-lg bg-green-50 hover:bg-green-100 transition"
                                            >
                                                + {cert}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {(form.certifications || []).length === 0 && (
                                    <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50 p-4 text-sm text-gray-500">
                                        Nessuna certificazione inserita. Aggiungi le tue qualifiche professionali.
                                    </div>
                                )}

                                {(form.certifications || []).map((cert) => (
                                    <div key={cert.id} className="rounded-xl border border-gray-200 bg-white p-4">
                                        <div className="flex items-start justify-between gap-3">
                                            <div className="flex-1 grid gap-3 md:grid-cols-2">
                                                <input
                                                    value={cert.name}
                                                    onChange={(e) => handleCertificationChange(cert.id, "name", e.target.value)}
                                                    placeholder="Nome certificazione"
                                                    className="w-full rounded-xl border border-gray-300 bg-gray-50 px-4 py-3 text-sm text-gray-900"
                                                />
                                                <input
                                                    value={cert.issuingOrganization}
                                                    onChange={(e) => handleCertificationChange(cert.id, "issuingOrganization", e.target.value)}
                                                    placeholder="Ente rilascio (TSRM PSTRP, IAASP)"
                                                    className="w-full rounded-xl border border-gray-300 bg-gray-50 px-4 py-3 text-sm text-gray-900"
                                                />
                                                <input
                                                    type="number"
                                                    value={cert.yearObtained}
                                                    onChange={(e) => handleCertificationChange(cert.id, "yearObtained", e.target.value)}
                                                    placeholder="Anno conseguimento"
                                                    min="1950"
                                                    max={new Date().getFullYear()}
                                                    className="w-full rounded-xl border border-gray-300 bg-gray-50 px-4 py-3 text-sm text-gray-900"
                                                />
                                                <input
                                                    type="number"
                                                    value={cert.expiryDate || ""}
                                                    onChange={(e) => handleCertificationChange(cert.id, "expiryDate", e.target.value)}
                                                    placeholder="Scadenza (opzionale)"
                                                    min={cert.yearObtained || "1950"}
                                                    className="w-full rounded-xl border border-gray-300 bg-gray-50 px-4 py-3 text-sm text-gray-900"
                                                />
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => removeCertification(cert.id)}
                                                className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-red-300 text-red-500 hover:border-red-500 hover:bg-red-50"
                                            >
                                                <XMarkIcon className="h-5 w-5" />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </section>
                    )}

                    {/* Sezione Certificazioni Preparatore Atletico */}
                    {isAthleticTrainer && (
                        <section className="rounded-2xl border border-gray-200 bg-white p-6">
                            <div className="flex items-center justify-between mb-6">
                                <div>
                                    <p className="text-xs uppercase tracking-[0.2em] text-gray-500">Qualifiche</p>
                                    <h2 className="text-xl font-semibold mt-1 text-gray-900">Certificazioni Preparatore Atletico</h2>
                                </div>
                                <button
                                    type="button"
                                    onClick={addCertification}
                                    className="inline-flex items-center gap-2 rounded-full bg-green-600 px-3 py-2 text-xs font-semibold text-white hover:bg-green-700"
                                >
                                    <PlusIcon className="h-4 w-4" />
                                    Aggiungi certificazione
                                </button>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <p className="text-xs text-gray-600 mb-3">Seleziona dalle certificazioni suggerite:</p>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-4">
                                        {mainSport && athleticTrainerCertificationOptions[mainSport]?.map((cert) => (
                                            <button
                                                key={cert}
                                                type="button"
                                                onClick={() => setForm(prev => ({ ...prev, certifications: [...(prev.certifications || []), { ...emptyCertification(), name: cert }] }))}
                                                className="text-left p-2 text-sm border border-green-300 rounded-lg bg-green-50 hover:bg-green-100 transition"
                                            >
                                                + {cert}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {(form.certifications || []).length === 0 && (
                                    <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50 p-4 text-sm text-gray-500">
                                        Nessuna certificazione inserita. Aggiungi le tue qualifiche professionali.
                                    </div>
                                )}

                                {(form.certifications || []).map((cert) => (
                                    <div key={cert.id} className="rounded-xl border border-gray-200 bg-white p-4">
                                        <div className="flex items-start justify-between gap-3">
                                            <div className="flex-1 grid gap-3 md:grid-cols-2">
                                                <input
                                                    value={cert.name}
                                                    onChange={(e) => handleCertificationChange(cert.id, "name", e.target.value)}
                                                    placeholder="Nome certificazione"
                                                    className="w-full rounded-xl border border-gray-300 bg-gray-50 px-4 py-3 text-sm text-gray-900"
                                                />
                                                <input
                                                    value={cert.issuingOrganization}
                                                    onChange={(e) => handleCertificationChange(cert.id, "issuingOrganization", e.target.value)}
                                                    placeholder="Ente rilascio (NSCA, IUSCA)"
                                                    className="w-full rounded-xl border border-gray-300 bg-gray-50 px-4 py-3 text-sm text-gray-900"
                                                />
                                                <input
                                                    type="number"
                                                    value={cert.yearObtained}
                                                    onChange={(e) => handleCertificationChange(cert.id, "yearObtained", e.target.value)}
                                                    placeholder="Anno conseguimento"
                                                    min="1950"
                                                    max={new Date().getFullYear()}
                                                    className="w-full rounded-xl border border-gray-300 bg-gray-50 px-4 py-3 text-sm text-gray-900"
                                                />
                                                <input
                                                    type="number"
                                                    value={cert.expiryDate || ""}
                                                    onChange={(e) => handleCertificationChange(cert.id, "expiryDate", e.target.value)}
                                                    placeholder="Scadenza (opzionale)"
                                                    min={cert.yearObtained || "1950"}
                                                    className="w-full rounded-xl border border-gray-300 bg-gray-50 px-4 py-3 text-sm text-gray-900"
                                                />
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => removeCertification(cert.id)}
                                                className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-red-300 text-red-500 hover:border-red-500 hover:bg-red-50"
                                            >
                                                <XMarkIcon className="h-5 w-5" />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </section>
                    )}

                    {/* Sezione Certificazioni Staff */}
                    {isStaff && (
                        <section className="rounded-2xl border border-gray-200 bg-white p-6">
                            <div className="flex items-center justify-between mb-6">
                                <div>
                                    <p className="text-xs uppercase tracking-[0.2em] text-gray-500">Qualifiche</p>
                                    <h2 className="text-xl font-semibold mt-1 text-gray-900">Certificazioni e Abilitazioni</h2>
                                </div>
                                <button
                                    type="button"
                                    onClick={addCertification}
                                    className="inline-flex items-center gap-2 rounded-full bg-green-600 px-3 py-2 text-xs font-semibold text-white hover:bg-green-700"
                                >
                                    <PlusIcon className="h-4 w-4" />
                                    Aggiungi certificazione
                                </button>
                            </div>

                            <div className="space-y-4">
                                {(form.certifications || []).length === 0 && (
                                    <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50 p-4 text-sm text-gray-500">
                                        Nessuna certificazione inserita. Aggiungi le tue qualifiche professionali.
                                    </div>
                                )}

                                {(form.certifications || []).map((cert) => (
                                    <div
                                        key={cert.id}
                                        className="rounded-xl border border-gray-200 bg-white p-4"
                                    >
                                        <div className="flex items-start justify-between gap-3">
                                            <div className="flex-1 grid gap-3 md:grid-cols-2">
                                                <input
                                                    value={cert.name}
                                                    onChange={(e) => handleCertificationChange(cert.id, "name", e.target.value)}
                                                    placeholder="Nome certificazione"
                                                    className="w-full rounded-xl border border-gray-300 bg-gray-50 px-4 py-3 text-sm text-gray-900"
                                                />
                                                <input
                                                    value={cert.issuingOrganization}
                                                    onChange={(e) => handleCertificationChange(cert.id, "issuingOrganization", e.target.value)}
                                                    placeholder="Ente rilascio"
                                                    className="w-full rounded-xl border border-gray-300 bg-gray-50 px-4 py-3 text-sm text-gray-900"
                                                />
                                                <input
                                                    type="number"
                                                    value={cert.yearObtained}
                                                    onChange={(e) => handleCertificationChange(cert.id, "yearObtained", e.target.value)}
                                                    placeholder="Anno conseguimento"
                                                    min="1950"
                                                    max={new Date().getFullYear()}
                                                    className="w-full rounded-xl border border-gray-300 bg-gray-50 px-4 py-3 text-sm text-gray-900"
                                                />
                                                <input
                                                    type="number"
                                                    value={cert.expiryDate || ""}
                                                    onChange={(e) => handleCertificationChange(cert.id, "expiryDate", e.target.value)}
                                                    placeholder="Scadenza (opzionale)"
                                                    min={cert.yearObtained || "1950"}
                                                    className="w-full rounded-xl border border-gray-300 bg-gray-50 px-4 py-3 text-sm text-gray-900"
                                                />
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => removeCertification(cert.id)}
                                                className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-red-300 text-red-500 hover:border-red-500 hover:bg-red-50"
                                            >
                                                <XMarkIcon className="h-5 w-5" />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </section>
                    )}

                    <section className="rounded-2xl border border-gray-200 bg-white p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs uppercase tracking-[0.2em] text-gray-500">Esperienze</p>
                                <h2 className="text-xl font-semibold mt-1 text-gray-900">Percorso professionale</h2>
                            </div>
                            <button
                                type="button"
                                onClick={addExperience}
                                className="inline-flex items-center gap-2 rounded-full bg-[#2341F0] px-3 py-2 text-xs font-semibold text-white hover:bg-[#1f35c2]"
                            >
                                <PlusIcon className="h-4 w-4" />
                                Aggiungi esperienza
                            </button>
                        </div>

                        <div className="mt-6 space-y-4">
                            {form.experiences.length === 0 && (
                                <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50 p-4 text-sm text-gray-500">
                                    Nessuna esperienza inserita. Aggiungi il tuo percorso.
                                </div>
                            )}

                            {form.experiences.map((exp) => (
                                <div
                                    key={exp.id}
                                    className="rounded-xl border border-gray-200 bg-white p-4"
                                >
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="flex-1 grid gap-3 md:grid-cols-2">
                                            {isCoach ? (
                                                <>
                                                    {/* Stagione - OBBLIGATORIO */}
                                                    <select
                                                        value={exp.season}
                                                        onChange={(e) => handleExperienceChange(exp.id, "season", e.target.value)}
                                                        className={inputBase}
                                                        required
                                                    >
                                                        <option value="">Seleziona stagione *</option>
                                                        {availableSeasons.map((season) => (
                                                            <option key={season} value={season}>
                                                                Stagione {season}
                                                            </option>
                                                        ))}
                                                    </select>

                                                    {/* Ruolo Coach */}
                                                    <select
                                                        value={exp.role}
                                                        onChange={(e) => handleExperienceChange(exp.id, "role", e.target.value)}
                                                        className={inputBase}
                                                    >
                                                        <option value="">Seleziona ruolo</option>
                                                        {(mainSport === "Calcio" ? coachFootballRoles : coachRoles).map((role) => (
                                                            <option key={role} value={role}>{role}</option>
                                                        ))}
                                                    </select>

                                                    {/* Team/Club */}
                                                    <input
                                                        value={exp.team}
                                                        onChange={(e) => handleExperienceChange(exp.id, "team", e.target.value)}
                                                        placeholder="Organizzazione/Club"
                                                        className={inputBase}
                                                    />

                                                    {/* Nazione */}
                                                    <select
                                                        value={exp.country}
                                                        onChange={(e) => {
                                                            handleExperienceChange(exp.id, "country", e.target.value)
                                                            handleExperienceChange(exp.id, "categoryTier", "")
                                                            handleExperienceChange(exp.id, "competitionType", "")
                                                            handleExperienceChange(exp.id, "category", "")
                                                        }}
                                                        className={inputBase}
                                                    >
                                                        <option value="">Seleziona nazione</option>
                                                        {footballCountries.map((country) => (
                                                            <option key={country} value={country}>{country}</option>
                                                        ))}
                                                    </select>

                                                    {/* Macro Categoria */}
                                                    <select
                                                        value={exp.categoryTier || ""}
                                                        onChange={(e) => {
                                                            handleExperienceChange(exp.id, "categoryTier", e.target.value)
                                                            handleExperienceChange(exp.id, "competitionType", "")
                                                            handleExperienceChange(exp.id, "category", "")
                                                        }}
                                                        className={inputBase}
                                                        disabled={!exp.country}
                                                    >
                                                        <option value="">{exp.country ? "Seleziona macro categoria" : "Prima seleziona una nazione"}</option>
                                                        {footballMacroCategories.map((tier) => (
                                                            <option key={tier} value={tier}>{tier}</option>
                                                        ))}
                                                    </select>

                                                    {/* Tipologia Competizione */}
                                                    <select
                                                        value={exp.competitionType || ""}
                                                        onChange={(e) => {
                                                            handleExperienceChange(exp.id, "competitionType", e.target.value)
                                                            handleExperienceChange(exp.id, "category", "")
                                                        }}
                                                        className={inputBase}
                                                        disabled={!exp.country || !exp.categoryTier}
                                                    >
                                                        <option value="">{exp.categoryTier ? "Seleziona tipologia competizione" : "Prima seleziona macro categoria"}</option>
                                                        {competitionTypes.map((type) => (
                                                            <option key={type.value} value={type.value}>{type.label}</option>
                                                        ))}
                                                    </select>

                                                    {/* Categoria */}
                                                    {exp.categoryTier === "Altro" ? (
                                                        <input
                                                            value={exp.category}
                                                            onChange={(e) => handleExperienceChange(exp.id, "category", e.target.value)}
                                                            placeholder="Categoria (testo libero)"
                                                            className={inputBase}
                                                            disabled={!exp.country}
                                                        />
                                                    ) : (
                                                        <select
                                                            value={exp.category}
                                                            onChange={(e) => handleExperienceChange(exp.id, "category", e.target.value)}
                                                            className={inputBase}
                                                            disabled={!exp.country || !exp.categoryTier || !exp.competitionType}
                                                        >
                                                            <option value="">{exp.competitionType ? "Seleziona categoria" : "Prima seleziona tipologia competizione"}</option>
                                                            {exp.country && exp.categoryTier && exp.competitionType ? (
                                                                exp.competitionType === "female" ? (
                                                                    // Categorie femminili
                                                                    exp.country === "Italia"
                                                                        ? footballFemaleCategoriesByTierItaly[exp.categoryTier]?.map((cat) => (
                                                                            <option key={cat} value={cat}>{cat}</option>
                                                                        ))
                                                                        : footballFemaleCategoriesByTierDefault[exp.categoryTier]?.map((cat) => (
                                                                            <option key={cat} value={cat}>{cat}</option>
                                                                        ))
                                                                ) : (
                                                                    // Categorie maschili/open/miste
                                                                    exp.country === "Italia"
                                                                        ? footballCategoriesByTierItaly[exp.categoryTier]?.map((cat) => (
                                                                            <option key={cat} value={cat}>{cat}</option>
                                                                        ))
                                                                        : footballCategoriesByTierDefault[exp.categoryTier]?.map((cat) => (
                                                                            <option key={cat} value={cat}>{cat}</option>
                                                                        ))
                                                                )
                                                            ) : null}
                                                        </select>
                                                    )}
                                                </>
                                            ) : isPlayer && mainSport === "Calcio" ? (
                                                <>
                                                    {/* Stagione - OBBLIGATORIO */}
                                                    <select
                                                        value={exp.season}
                                                        onChange={(e) => handleExperienceChange(exp.id, "season", e.target.value)}
                                                        className={inputBase}
                                                        required
                                                    >
                                                        <option value="">Seleziona stagione *</option>
                                                        {availableSeasons.map((season) => (
                                                            <option key={season} value={season}>
                                                                Stagione {season}
                                                            </option>
                                                        ))}
                                                    </select>

                                                    <select
                                                        value={exp.primaryPosition || ''}
                                                        onChange={(e) => {
                                                            handleExperienceChange(exp.id, "primaryPosition", e.target.value)
                                                            handleExperienceChange(exp.id, "role", e.target.value)
                                                            // Reset positionDetail quando cambia primaryPosition
                                                            handleExperienceChange(exp.id, "positionDetail", "")
                                                        }}
                                                        className={inputBase}
                                                    >
                                                        <option value="">Seleziona ruolo</option>
                                                        {footballPrimaryOptions.map((opt) => (
                                                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                                                        ))}
                                                    </select>
                                                    <select
                                                        value={exp.positionDetail || ''}
                                                        onChange={(e) => handleExperienceChange(exp.id, "positionDetail", e.target.value)}
                                                        className={inputBase}
                                                        disabled={!exp.primaryPosition}
                                                    >
                                                        <option value="">{exp.primaryPosition ? "Seleziona dettaglio ruolo" : "Prima seleziona un ruolo"}</option>
                                                        {exp.primaryPosition && footballSecondaryOptions[exp.primaryPosition]?.map((opt) => (
                                                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                                                        ))}
                                                    </select>
                                                </>
                                            ) : isPlayer && mainSport === "Basket" ? (
                                                <>
                                                    {/* Stagione - OBBLIGATORIO */}
                                                    <select
                                                        value={exp.season}
                                                        onChange={(e) => handleExperienceChange(exp.id, "season", e.target.value)}
                                                        className={inputBase}
                                                        required
                                                    >
                                                        <option value="">Seleziona stagione *</option>
                                                        {availableSeasons.map((season) => (
                                                            <option key={season} value={season}>
                                                                Stagione {season}
                                                            </option>
                                                        ))}
                                                    </select>

                                                    <select
                                                        value={exp.role}
                                                        onChange={(e) => handleExperienceChange(exp.id, "role", e.target.value)}
                                                        className={inputBase}
                                                    >
                                                        <option value="">Seleziona ruolo</option>
                                                        {basketRoles.map((role) => (
                                                            <option key={role} value={role}>{role}</option>
                                                        ))}
                                                    </select>
                                                </>
                                            ) : isPlayer && mainSport === "Pallavolo" ? (
                                                <>
                                                    {/* Stagione - OBBLIGATORIO */}
                                                    <select
                                                        value={exp.season}
                                                        onChange={(e) => handleExperienceChange(exp.id, "season", e.target.value)}
                                                        className={inputBase}
                                                        required
                                                    >
                                                        <option value="">Seleziona stagione *</option>
                                                        {availableSeasons.map((season) => (
                                                            <option key={season} value={season}>
                                                                Stagione {season}
                                                            </option>
                                                        ))}
                                                    </select>

                                                    <select
                                                        value={exp.role}
                                                        onChange={(e) => handleExperienceChange(exp.id, "role", e.target.value)}
                                                        className={inputBase}
                                                    >
                                                        <option value="">Seleziona ruolo</option>
                                                        {volleyRoles.map((role) => (
                                                            <option key={role} value={role}>{role}</option>
                                                        ))}
                                                    </select>
                                                </>
                                            ) : (
                                                <input
                                                    value={exp.role}
                                                    onChange={(e) => handleExperienceChange(exp.id, "role", e.target.value)}
                                                    placeholder="Ruolo"
                                                    className={inputBase}
                                                />
                                            )}
                                            {!isCoach && (
                                                <input
                                                    value={exp.team}
                                                    onChange={(e) => handleExperienceChange(exp.id, "team", e.target.value)}
                                                    placeholder="Organizzazione/Club"
                                                    className={inputBase}
                                                />
                                            )}
                                            {!isCoach && isPlayer && mainSport === "Calcio" ? (
                                                <>
                                                    {/* Nazione */}
                                                    <select
                                                        value={exp.country}
                                                        onChange={(e) => {
                                                            handleExperienceChange(exp.id, "country", e.target.value)
                                                            // Reset tutti i campi successivi quando cambia nazione
                                                            handleExperienceChange(exp.id, "categoryTier", "")
                                                            handleExperienceChange(exp.id, "competitionType", "")
                                                            handleExperienceChange(exp.id, "category", "")
                                                        }}
                                                        className={inputBase}
                                                    >
                                                        <option value="">Seleziona nazione</option>
                                                        {footballCountries.map((country) => (
                                                            <option key={country} value={country}>{country}</option>
                                                        ))}
                                                    </select>

                                                    {/* Macro categoria */}
                                                    <select
                                                        value={exp.categoryTier || ""}
                                                        onChange={(e) => {
                                                            handleExperienceChange(exp.id, "categoryTier", e.target.value)
                                                            // Reset campi successivi quando cambia macro
                                                            handleExperienceChange(exp.id, "competitionType", "")
                                                            handleExperienceChange(exp.id, "category", "")
                                                        }}
                                                        className={inputBase}
                                                        disabled={!exp.country}
                                                    >
                                                        <option value="">{exp.country ? "Seleziona macro categoria" : "Prima seleziona una nazione"}</option>
                                                        {footballMacroCategories.map((tier) => (
                                                            <option key={tier} value={tier}>{tier}</option>
                                                        ))}
                                                    </select>

                                                    {/* Tipologia Competizione (NUOVO) */}
                                                    <select
                                                        value={exp.competitionType || ""}
                                                        onChange={(e) => {
                                                            handleExperienceChange(exp.id, "competitionType", e.target.value)
                                                            // Reset categoria quando cambia tipologia
                                                            handleExperienceChange(exp.id, "category", "")
                                                        }}
                                                        className={inputBase}
                                                        disabled={!exp.country || !exp.categoryTier}
                                                    >
                                                        <option value="">{exp.categoryTier ? "Seleziona tipologia competizione" : "Prima seleziona macro categoria"}</option>
                                                        {competitionTypes.map((type) => (
                                                            <option key={type.value} value={type.value}>{type.label}</option>
                                                        ))}
                                                    </select>

                                                    {/* Categoria dettagliata */}
                                                    {exp.categoryTier === "Altro" ? (
                                                        <input
                                                            value={exp.category}
                                                            onChange={(e) => handleExperienceChange(exp.id, "category", e.target.value)}
                                                            placeholder="Categoria (testo libero)"
                                                            className={inputBase}
                                                            disabled={!exp.country}
                                                        />
                                                    ) : (
                                                        <select
                                                            value={exp.category}
                                                            onChange={(e) => handleExperienceChange(exp.id, "category", e.target.value)}
                                                            className={inputBase}
                                                            disabled={!exp.country || !exp.categoryTier || !exp.competitionType}
                                                        >
                                                            <option value="">{exp.competitionType ? "Seleziona categoria" : "Prima seleziona tipologia competizione"}</option>
                                                            {exp.country && exp.categoryTier && exp.competitionType ? (
                                                                exp.competitionType === "female" ? (
                                                                    // Categorie femminili
                                                                    exp.country === "Italia"
                                                                        ? footballFemaleCategoriesByTierItaly[exp.categoryTier]?.map((cat) => (
                                                                            <option key={cat} value={cat}>{cat}</option>
                                                                        ))
                                                                        : footballFemaleCategoriesByTierDefault[exp.categoryTier]?.map((cat) => (
                                                                            <option key={cat} value={cat}>{cat}</option>
                                                                        ))
                                                                ) : (
                                                                    // Categorie maschili/open/miste (usa struttura esistente)
                                                                    exp.country === "Italia"
                                                                        ? footballCategoriesByTierItaly[exp.categoryTier]?.map((cat) => (
                                                                            <option key={cat} value={cat}>{cat}</option>
                                                                        ))
                                                                        : footballCategoriesByTierDefault[exp.categoryTier]?.map((cat) => (
                                                                            <option key={cat} value={cat}>{cat}</option>
                                                                        ))
                                                                )
                                                            ) : null}
                                                        </select>
                                                    )}
                                                </>
                                            ) : !isCoach && isPlayer && (mainSport === "Basket" || mainSport === "Pallavolo") ? (
                                                <>
                                                    {/* Nazione */}
                                                    <select
                                                        value={exp.country}
                                                        onChange={(e) => {
                                                            handleExperienceChange(exp.id, "country", e.target.value)
                                                            handleExperienceChange(exp.id, "categoryTier", "")
                                                            handleExperienceChange(exp.id, "competitionType", "")
                                                            handleExperienceChange(exp.id, "category", "")
                                                        }}
                                                        className={inputBase}
                                                    >
                                                        <option value="">Seleziona nazione</option>
                                                        {(mainSport === "Basket" ? basketCountries : volleyCountries).map((country) => (
                                                            <option key={country} value={country}>{country}</option>
                                                        ))}
                                                    </select>

                                                    {/* Macro categoria (Italia per Basket e Pallavolo) */}
                                                    {(mainSport === "Basket" || mainSport === "Pallavolo") && exp.country === "Italia" && (
                                                        <select
                                                            value={exp.categoryTier || ""}
                                                            onChange={(e) => {
                                                                handleExperienceChange(exp.id, "categoryTier", e.target.value)
                                                                handleExperienceChange(exp.id, "competitionType", "")
                                                                handleExperienceChange(exp.id, "category", "")
                                                            }}
                                                            className={inputBase}
                                                            disabled={!exp.country}
                                                        >
                                                            <option value="">{exp.country ? "Seleziona macro categoria" : "Prima seleziona una nazione"}</option>
                                                            {(mainSport === "Basket" ? basketMacroCategories : volleyMacroCategories).map((tier) => (
                                                                <option key={tier} value={tier}>{tier}</option>
                                                            ))}
                                                        </select>
                                                    )}

                                                    {/* Tipologia Competizione */}
                                                    <select
                                                        value={exp.competitionType || ""}
                                                        onChange={(e) => {
                                                            handleExperienceChange(exp.id, "competitionType", e.target.value)
                                                            handleExperienceChange(exp.id, "category", "")
                                                        }}
                                                        className={inputBase}
                                                        disabled={exp.country === "Italia" ? !exp.country || !exp.categoryTier : !exp.country}
                                                    >
                                                        <option value="">{exp.country === "Italia" ? (exp.categoryTier ? "Seleziona tipologia competizione" : "Prima seleziona macro categoria") : (exp.country ? "Seleziona tipologia competizione" : "Prima seleziona una nazione")}</option>
                                                        {competitionTypes.map((type) => (
                                                            <option key={type.value} value={type.value}>{type.label}</option>
                                                        ))}
                                                    </select>

                                                    {/* Categoria dettagliata */}
                                                    {exp.country === "Altro" ? (
                                                        <input
                                                            value={exp.category}
                                                            onChange={(e) => handleExperienceChange(exp.id, "category", e.target.value)}
                                                            placeholder="Categoria"
                                                            className={inputBase}
                                                        />
                                                    ) : (
                                                        <select
                                                            value={exp.category}
                                                            onChange={(e) => handleExperienceChange(exp.id, "category", e.target.value)}
                                                            className={inputBase}
                                                            disabled={exp.country === "Italia" ? !exp.country || !exp.categoryTier || !exp.competitionType : !exp.country || !exp.competitionType}
                                                        >
                                                            <option value="">{exp.competitionType ? "Seleziona categoria" : "Prima seleziona tipologia competizione"}</option>
                                                            {mainSport === "Basket" ? (
                                                                exp.country && exp.categoryTier && exp.competitionType ? (
                                                                    exp.competitionType === "female" ? (
                                                                        // Categorie femminili Basket
                                                                        exp.country === "Italia"
                                                                            ? basketFemaleCategoresByTierItaly[exp.categoryTier]?.map((cat) => (
                                                                                <option key={cat} value={cat}>{cat}</option>
                                                                            ))
                                                                            : basketCategoriesByTierDefault[exp.categoryTier]?.map((cat) => (
                                                                                <option key={cat} value={cat}>{cat}</option>
                                                                            ))
                                                                    ) : (
                                                                        // Categorie maschili/open/miste Basket
                                                                        exp.country === "Italia"
                                                                            ? basketMaleCategoresByTierItaly[exp.categoryTier]?.map((cat) => (
                                                                                <option key={cat} value={cat}>{cat}</option>
                                                                            ))
                                                                            : basketCategoriesByTierDefault[exp.categoryTier]?.map((cat) => (
                                                                                <option key={cat} value={cat}>{cat}</option>
                                                                            ))
                                                                    )
                                                                ) : null
                                                            ) : (
                                                                // Pallavolo
                                                                exp.country === "Italia" ? (
                                                                    exp.country && exp.categoryTier && exp.competitionType ? (
                                                                        exp.competitionType === "female" ? (
                                                                            // Categorie femminili Pallavolo (Italia)
                                                                            volleyFemaleCategoresByTierItaly[exp.categoryTier]?.map((cat) => (
                                                                                <option key={cat} value={cat}>{cat}</option>
                                                                            ))
                                                                        ) : (
                                                                            // Categorie maschili/open/miste Pallavolo (Italia)
                                                                            volleyMaleCategoresByTierItaly[exp.categoryTier]?.map((cat) => (
                                                                                <option key={cat} value={cat}>{cat}</option>
                                                                            ))
                                                                        )
                                                                    ) : null
                                                                ) : (
                                                                    // Pallavolo altri paesi - senza macro-categoria
                                                                    exp.country && exp.competitionType ? (
                                                                        exp.competitionType === "female" ? (
                                                                            volleyCategoriesByCountry[exp.country]?.map((cat) => (
                                                                                <option key={cat} value={cat}>{cat}</option>
                                                                            ))
                                                                        ) : (
                                                                            volleyCategoriesByCountry[exp.country]?.map((cat) => (
                                                                                <option key={cat} value={cat}>{cat}</option>
                                                                            ))
                                                                        )
                                                                    ) : null
                                                                )
                                                            )}
                                                        </select>
                                                    )}
                                                </>
                                            ) : !isCoach ? (
                                                <>
                                                    <input
                                                        value={exp.country}
                                                        onChange={(e) => handleExperienceChange(exp.id, "country", e.target.value)}
                                                        placeholder="Nazione"
                                                        className={inputBase}
                                                    />
                                                    <select
                                                        value={exp.competitionType || ""}
                                                        onChange={(e) => handleExperienceChange(exp.id, "competitionType", e.target.value)}
                                                        className={inputBase}
                                                    >
                                                        <option value="">Tipologia competizione (opzionale)</option>
                                                        {competitionTypes.map((type) => (
                                                            <option key={type.value} value={type.value}>{type.label}</option>
                                                        ))}
                                                    </select>
                                                    <input
                                                        value={exp.category}
                                                        onChange={(e) => handleExperienceChange(exp.id, "category", e.target.value)}
                                                        placeholder="Categoria"
                                                        className={inputBase}
                                                    />
                                                </>
                                            ) : null}

                                            {/* Checkbox per mostrare date opzionali */}
                                            <div className="md:col-span-2 space-y-3">
                                                <label className="flex items-center gap-2 cursor-pointer">
                                                    <input
                                                        type="checkbox"
                                                        checked={showDatesForExp[exp.id] || false}
                                                        onChange={() => toggleDatesForExp(exp.id)}
                                                        className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                                                    />
                                                    <span className="text-sm text-gray-700">
                                                        Specifica periodo esatto (opzionale)
                                                    </span>
                                                </label>

                                                {/* Date opzionali - mostrate solo se checkbox attivo */}
                                                {showDatesForExp[exp.id] && (
                                                    <div className="space-y-3 pl-6 border-l-2 border-gray-200">
                                                        <div className="grid grid-cols-2 gap-3">
                                                            <div>
                                                                <label className="text-xs text-gray-600 mb-1 block">Data inizio</label>
                                                                <input
                                                                    type="date"
                                                                    value={exp.from || ""}
                                                                    onChange={(e) => handleExperienceChange(exp.id, "from", e.target.value)}
                                                                    placeholder="Inizio"
                                                                    className={inputBase}
                                                                />
                                                            </div>
                                                            <div>
                                                                <label className="text-xs text-gray-600 mb-1 block">Data fine</label>
                                                                <input
                                                                    type="date"
                                                                    value={exp.to || ""}
                                                                    onChange={(e) => handleExperienceChange(exp.id, "to", e.target.value)}
                                                                    placeholder="Fine"
                                                                    className={inputBase}
                                                                    disabled={exp.isCurrentlyPlaying}
                                                                />
                                                            </div>
                                                        </div>
                                                        <label className="flex items-center gap-2 cursor-pointer">
                                                            <input
                                                                type="checkbox"
                                                                checked={exp.isCurrentlyPlaying || false}
                                                                onChange={(e) => {
                                                                    handleExperienceChange(exp.id, "isCurrentlyPlaying", e.target.checked)
                                                                    if (e.target.checked) {
                                                                        handleExperienceChange(exp.id, "to", "")
                                                                    }
                                                                }}
                                                                className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                                                            />
                                                            <span className="text-sm text-gray-700">
                                                                {isCoach ? "Alleno ancora qui" : "Gioco ancora qui"}
                                                            </span>
                                                        </label>
                                                    </div>
                                                )}

                                                {/* Messaggio di errore validazione date */}
                                                {dateErrors[exp.id] && (
                                                    <div className="flex items-start gap-2 text-red-600 text-sm bg-red-50 border border-red-200 rounded-lg p-3">
                                                        <ExclamationCircleIcon className="w-5 h-5 flex-shrink-0 mt-0.5" />
                                                        <span>{dateErrors[exp.id]}</span>
                                                    </div>
                                                )}
                                            </div>

                                            <textarea
                                                value={exp.summary}
                                                onChange={(e) => handleExperienceChange(exp.id, "summary", e.target.value)}
                                                placeholder="Responsabilita, risultati..."
                                                className={`${inputBase} md:col-span-2 resize-none`}
                                                rows={3}
                                            />
                                            {isPlayer && mainSport === "Calcio" && (
                                                <div className="mt-3 md:col-span-2 w-full">
                                                    <p className="text-sm text-gray-700 mb-2">Statistiche (opzionali)</p>
                                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                                        <div className="space-y-1">
                                                            <label className="text-xs text-gray-600">Presenze</label>
                                                            <input
                                                                type="number"
                                                                min={0}
                                                                value={exp.appearances ?? ''}
                                                                onChange={(e) => handleExperienceChange(exp.id, 'appearances', e.target.value)}
                                                                className={inputBase}
                                                            />
                                                        </div>
                                                        <div className="space-y-1">
                                                            <label className="text-xs text-gray-600">Minuti Giocati</label>
                                                            <input
                                                                type="number"
                                                                min={0}
                                                                value={exp.minutesPlayed ?? ''}
                                                                onChange={(e) => handleExperienceChange(exp.id, 'minutesPlayed', e.target.value)}
                                                                className={inputBase}
                                                            />
                                                        </div>
                                                        <div className="space-y-1">
                                                            <label className="text-xs text-gray-600">Gol</label>
                                                            <input
                                                                type="number"
                                                                min={0}
                                                                value={exp.goals ?? ''}
                                                                onChange={(e) => handleExperienceChange(exp.id, 'goals', e.target.value)}
                                                                className={inputBase}
                                                            />
                                                        </div>
                                                        <div className="space-y-1">
                                                            <label className="text-xs text-gray-600">Assist</label>
                                                            <input
                                                                type="number"
                                                                min={0}
                                                                value={exp.assists ?? ''}
                                                                onChange={(e) => handleExperienceChange(exp.id, 'assists', e.target.value)}
                                                                className={inputBase}
                                                            />
                                                        </div>
                                                        <div className="space-y-1">
                                                            <label className="text-xs text-gray-600">Rete Inviolata</label>
                                                            <input
                                                                type="number"
                                                                min={0}
                                                                value={exp.cleanSheets ?? ''}
                                                                onChange={(e) => handleExperienceChange(exp.id, 'cleanSheets', e.target.value)}
                                                                className={inputBase}
                                                            />
                                                        </div>
                                                        <div className="space-y-1">
                                                            <label className="text-xs text-gray-600">Rigori</label>
                                                            <input
                                                                type="number"
                                                                min={0}
                                                                value={exp.penalties ?? ''}
                                                                onChange={(e) => handleExperienceChange(exp.id, 'penalties', e.target.value)}
                                                                className={inputBase}
                                                            />
                                                        </div>
                                                        <div className="space-y-1">
                                                            <label className="text-xs text-gray-600">Ammonizioni</label>
                                                            <input
                                                                type="number"
                                                                min={0}
                                                                value={exp.yellowCards ?? ''}
                                                                onChange={(e) => handleExperienceChange(exp.id, 'yellowCards', e.target.value)}
                                                                className={inputBase}
                                                            />
                                                        </div>
                                                        <div className="space-y-1">
                                                            <label className="text-xs text-gray-600">Espulsioni</label>
                                                            <input
                                                                type="number"
                                                                min={0}
                                                                value={exp.redCards ?? ''}
                                                                onChange={(e) => handleExperienceChange(exp.id, 'redCards', e.target.value)}
                                                                className={inputBase}
                                                            />
                                                        </div>
                                                        <div className="space-y-1">
                                                            <label className="text-xs text-gray-600">Sost. (IN)</label>
                                                            <input
                                                                type="number"
                                                                min={0}
                                                                value={exp.substitutionsIn ?? ''}
                                                                onChange={(e) => handleExperienceChange(exp.id, 'substitutionsIn', e.target.value)}
                                                                className={inputBase}
                                                                placeholder="Entrate"
                                                            />
                                                        </div>
                                                        <div className="space-y-1">
                                                            <label className="text-xs text-gray-600">Sost. (OUT)</label>
                                                            <input
                                                                type="number"
                                                                min={0}
                                                                value={exp.substitutionsOut ?? ''}
                                                                onChange={(e) => handleExperienceChange(exp.id, 'substitutionsOut', e.target.value)}
                                                                className={inputBase}
                                                                placeholder="Uscite"
                                                            />
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                            {isPlayer && mainSport === "Basket" && (
                                                <div className="mt-3 md:col-span-2 w-full">
                                                    <p className="text-sm text-gray-700 mb-2">Statistiche (opzionali)</p>
                                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                                        <div className="space-y-1">
                                                            <label className="text-xs text-gray-600">Punti/partita</label>
                                                            <input
                                                                type="number"
                                                                step="0.1"
                                                                min={0}
                                                                value={exp.pointsPerGame ?? ''}
                                                                onChange={(e) => handleExperienceChange(exp.id, 'pointsPerGame', e.target.value)}
                                                                className={inputBase}
                                                            />
                                                        </div>
                                                        <div className="space-y-1">
                                                            <label className="text-xs text-gray-600">Assist</label>
                                                            <input
                                                                type="number"
                                                                min={0}
                                                                value={exp.assists ?? ''}
                                                                onChange={(e) => handleExperienceChange(exp.id, 'assists', e.target.value)}
                                                                className={inputBase}
                                                            />
                                                        </div>
                                                        <div className="space-y-1">
                                                            <label className="text-xs text-gray-600">Rimbalzi</label>
                                                            <input
                                                                type="number"
                                                                min={0}
                                                                value={exp.rebounds ?? ''}
                                                                onChange={(e) => handleExperienceChange(exp.id, 'rebounds', e.target.value)}
                                                                className={inputBase}
                                                            />
                                                        </div>
                                                        <div className="space-y-1">
                                                            <label className="text-xs text-gray-600">Presenze</label>
                                                            <input
                                                                type="number"
                                                                min={0}
                                                                value={exp.appearances ?? ''}
                                                                onChange={(e) => handleExperienceChange(exp.id, 'appearances', e.target.value)}
                                                                className={inputBase}
                                                            />
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                            {isPlayer && mainSport === "Pallavolo" && (
                                                <div className="mt-3 md:col-span-2 w-full">
                                                    <p className="text-sm text-gray-700 mb-2">Statistiche (opzionali)</p>
                                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                                        <div className="space-y-1">
                                                            <label className="text-xs text-gray-600">Ace</label>
                                                            <input
                                                                type="number"
                                                                min={0}
                                                                value={exp.volleyAces ?? ''}
                                                                onChange={(e) => handleExperienceChange(exp.id, 'volleyAces', e.target.value)}
                                                                className={inputBase}
                                                            />
                                                        </div>
                                                        <div className="space-y-1">
                                                            <label className="text-xs text-gray-600">Muri</label>
                                                            <input
                                                                type="number"
                                                                min={0}
                                                                value={exp.volleyBlocks ?? ''}
                                                                onChange={(e) => handleExperienceChange(exp.id, 'volleyBlocks', e.target.value)}
                                                                className={inputBase}
                                                            />
                                                        </div>
                                                        <div className="space-y-1">
                                                            <label className="text-xs text-gray-600">Difese</label>
                                                            <input
                                                                type="number"
                                                                min={0}
                                                                value={exp.volleyDigs ?? ''}
                                                                onChange={(e) => handleExperienceChange(exp.id, 'volleyDigs', e.target.value)}
                                                                className={inputBase}
                                                            />
                                                        </div>
                                                        <div className="space-y-1">
                                                            <label className="text-xs text-gray-600">Presenze</label>
                                                            <input
                                                                type="number"
                                                                min={0}
                                                                value={exp.appearances ?? ''}
                                                                onChange={(e) => handleExperienceChange(exp.id, 'appearances', e.target.value)}
                                                                className={inputBase}
                                                            />
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                            {isCoach && (
                                                <div className="mt-3 md:col-span-2 w-full">
                                                    <p className="text-sm text-gray-700 mb-2">Statistiche (opzionali)</p>
                                                    <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                                                        <div className="space-y-1">
                                                            <label className="text-xs text-gray-600">Partite Allenate</label>
                                                            <input
                                                                type="number"
                                                                min={0}
                                                                value={exp.matchesCoached ?? ''}
                                                                onChange={(e) => handleExperienceChange(exp.id, 'matchesCoached', e.target.value)}
                                                                className={inputBase}
                                                            />
                                                        </div>
                                                        <div className="space-y-1">
                                                            <label className="text-xs text-gray-600">Vittorie</label>
                                                            <input
                                                                type="number"
                                                                min={0}
                                                                value={exp.wins ?? ''}
                                                                onChange={(e) => handleExperienceChange(exp.id, 'wins', e.target.value)}
                                                                className={inputBase}
                                                            />
                                                        </div>
                                                        <div className="space-y-1">
                                                            <label className="text-xs text-gray-600">Pareggi</label>
                                                            <input
                                                                type="number"
                                                                min={0}
                                                                value={exp.draws ?? ''}
                                                                onChange={(e) => handleExperienceChange(exp.id, 'draws', e.target.value)}
                                                                className={inputBase}
                                                            />
                                                        </div>
                                                        <div className="space-y-1">
                                                            <label className="text-xs text-gray-600">Sconfitte</label>
                                                            <input
                                                                type="number"
                                                                min={0}
                                                                value={exp.losses ?? ''}
                                                                onChange={(e) => handleExperienceChange(exp.id, 'losses', e.target.value)}
                                                                className={inputBase}
                                                            />
                                                        </div>
                                                        <div className="space-y-1">
                                                            <label className="text-xs text-gray-600">Trofei</label>
                                                            <input
                                                                type="number"
                                                                min={0}
                                                                value={exp.trophies ?? ''}
                                                                onChange={(e) => handleExperienceChange(exp.id, 'trophies', e.target.value)}
                                                                className={inputBase}
                                                            />
                                                        </div>
                                                    </div>
                                                    {!validateCoachStats(exp) && (
                                                        <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                                                            <p className="text-sm text-red-700">
                                                                ⚠️ Errore: Le partite allenate ({exp.matchesCoached}) devono essere uguali alla somma di vittorie ({exp.wins || 0}) + pareggi ({exp.draws || 0}) + sconfitte ({exp.losses || 0}) = {(exp.wins || 0) + (exp.draws || 0) + (exp.losses || 0)}
                                                            </p>
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => removeExperience(exp.id)}
                                            className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-red-300 text-red-500 hover:border-red-500 hover:bg-red-50"
                                        >
                                            <XMarkIcon className="h-5 w-5" />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>

                    <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
                        <button
                            onClick={() => router.back()}
                            className="w-full sm:w-auto rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm text-gray-700 hover:bg-gray-50"
                        >
                            Annulla
                        </button>
                        <button
                            onClick={handleSave}
                            disabled={saving}
                            className="w-full sm:w-auto rounded-xl bg-[#2341F0] px-4 py-3 text-sm font-semibold text-white hover:bg-[#1f35c2] disabled:opacity-60"
                        >
                            {saving ? "Salvataggio..." : "Salva modifiche"}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}
