"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { CameraIcon, PlusIcon, XMarkIcon, ExclamationCircleIcon, ChevronDownIcon } from "@heroicons/react/24/outline"
import Avatar from "@/components/avatar"
import SocialLinksForm from "@/components/social-links-form"
import SelfEvaluationForm from "@/components/self-evaluation-form"
import OrganizationAutocomplete from "@/components/organization-autocomplete"
import CustomSelect from "@/components/custom-select"
import { uploadService } from "@/lib/upload-service"
import { allCountries } from "@/lib/countries"
import { getAuthHeaders } from "@/lib/auth-fetch"

interface Experience {
    id: string
    season: string // "2024/2025" - OBBLIGATORIO
    role: string
    primaryPosition?: string
    positionDetail?: string
    team: string
    country: string
    city?: string
    sport?: string // Sport dell'organizzazione
    category: string
    categoryTier?: string
    competitionType?: string // 'male' | 'female' | 'open' | 'mixed'
    // Date opzionali per precisione temporale
    from?: string
    to?: string
    isCurrentlyPlaying?: boolean // "Gioca/Allena ancora qui"
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
    // Stato contrattuale (Player, Coach, DS)
    contractStatus?: 'svincolato' | 'sotto contratto'
    contractEndDate?: string
    // Qualifiche Coach
    uefaLicenses?: string[]
    coachSpecializations?: string
    // Qualifiche Agent
    hasFifaLicense?: boolean
    fifaLicenseNumber?: string
    agentNotes?: string
    // Certificazioni Staff
    certifications?: Certification[]
    // Social Links (JSONB) - deve corrispondere a branch_3101
    socialLinks?: {
        instagram?: string
        tiktok?: string
        youtube?: string
        facebook?: string
        twitter?: string
        linkedin?: string
        transfermarkt?: string
    }
    // Self Evaluation (JSONB)
    playerSelfEvaluation?: any
    coachSelfEvaluation?: any
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
    socialLinks: {
        instagram: "",
        tiktok: "",
        youtube: "",
        facebook: "",
        twitter: "",
        linkedin: "",
        transfermarkt: ""
    },
    playerSelfEvaluation: undefined,
    coachSelfEvaluation: undefined
}

export default function EditProfilePage() {
    // --- HOOKS: always before any return ---
    const router = useRouter();
    const activeRole = useMemo(() => {
        if (typeof window === "undefined") return null;
        return localStorage.getItem("currentUserRole")?.toLowerCase() || null;
    }, []);
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
    const [saveError, setSaveError] = useState<string | null>(null);
    const [resolvedRoleId, setResolvedRoleId] = useState<string | null>(null);

    // --- Sport principale per logica ruolo/dominanza ---
    const [mainSport, setMainSport] = useState<string | undefined>(undefined);

    // --- Stati per gestire date opzionali per esperienza ---
    const [showDatesForExp, setShowDatesForExp] = useState<Record<string, boolean>>({})

    // --- Accordion: esperienze aperte/chiuse (nuove aperte, salvate chiuse) ---
    const [expandedExps, setExpandedExps] = useState<Record<string, boolean>>({})

    const toggleExpAccordion = (id: string) => {
        setExpandedExps(prev => ({ ...prev, [id]: !prev[id] }))
    }

    // Helper: indica se un'esperienza è già salvata nel DB (UUID lungo)
    const isSavedExperience = (id: string) => id.length > 20

    // --- Stati per errori validazione date ---
    const [dateErrors, setDateErrors] = useState<Record<string, string>>({})

    // --- Stati per autocomplete nazionalità ---
    const [countrySearchTerm, setCountrySearchTerm] = useState("")
    const [showCountryDropdown, setShowCountryDropdown] = useState(false)

    // --- Stati per dropdown disponibilità ---
    const [showAvailabilityDropdown, setShowAvailabilityDropdown] = useState(false)

    // --- Stati per dropdown piede/mano dominante ---
    const [showFootDropdown, setShowFootDropdown] = useState(false)
    const [showHandDropdown, setShowHandDropdown] = useState(false)

    // --- Stato per dropdown stato contrattuale ---
    const [showContractStatusDropdown, setShowContractStatusDropdown] = useState(false)

    // --- Posizioni dinamiche da lookup_positions (Supabase) ---
    const [lookupPositions, setLookupPositions] = useState<{ id: number, name: string, category: string }[]>([])

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
                setResolvedRoleId(roleId || null)
                const professionalRole = roleId === 'player' ? 'Player' :
                    roleId === 'coach' ? 'Coach' :
                        roleId === 'agent' ? 'Agent' :
                            roleId === 'sporting_director' ? 'Sporting Director' :
                                roleId === 'athletic_trainer' ? 'Athletic Trainer' :
                                    roleId === 'nutritionist' ? 'Nutritionist' :
                                        roleId === 'physio' ? 'Physio/Masseur' :
                                            roleId === 'talent_scout' ? 'Talent Scout' :
                                                user.professionalRole || 'Player'

                // Use roleId (lowercase from DB) for comparisons instead of professionalRole
                setIsPlayer(roleId === "player");
                setIsCoach(roleId === "coach");
                setIsAgent(roleId === "agent");
                setIsSportingDirector(roleId === "sporting_director");
                setIsPhysio(roleId === "physio");
                setIsAthleticTrainer(roleId === "athletic_trainer");
                setIsStaff(["athletic_trainer", "nutritionist", "physio", "talent_scout"].includes(roleId));

                const scopedRole = activeRole || roleId || null

                // Fetch sports from profile_sports table (nuovo schema Supabase)
                const fetchSports = async () => {
                    const { supabase: supabaseClient } = await import('@/lib/supabase-browser')
                    let query = supabaseClient
                        .from('profile_sports')
                        .select('sport_id, role_id, lookup_sports(name)')
                        .eq('user_id', userId)

                    if (scopedRole) {
                        query = query.eq('role_id', scopedRole)
                    }

                    let { data: sportsData } = await query

                    // Fallback legacy: righe pre-migrazione con role_id NULL
                    if ((!sportsData || sportsData.length === 0) && scopedRole) {
                        const { data: legacySportsData } = await supabaseClient
                            .from('profile_sports')
                            .select('sport_id, role_id, lookup_sports(name)')
                            .eq('user_id', userId)
                            .is('role_id', null)
                        sportsData = legacySportsData || []
                    }

                    return sportsData?.map((s: any) => s.lookup_sports?.name).filter(Boolean) || []
                }

                const userSports = user.sports || await fetchSports()
                const fetchRoleSelfEvaluation = async () => {
                    if (!scopedRole) return undefined
                    const { supabase: supabaseClient } = await import('@/lib/supabase-browser')
                    const { data } = await supabaseClient
                        .from('profile_roles')
                        .select('role_self_evaluation')
                        .eq('user_id', userId)
                        .eq('role_id', scopedRole)
                        .eq('is_active', true)
                        .maybeSingle()

                    return data?.role_self_evaluation ?? undefined
                }

                const roleSelfEvaluation = await fetchRoleSelfEvaluation()
                const sport = Array.isArray(userSports) && userSports.length > 0 ? userSports[0] : user.sport || undefined;
                setMainSport(sport);
                setIsFootball(Array.isArray(userSports) && userSports.includes("Calcio"));

                // Fetch posizioni da lookup_positions (Supabase)
                if (sport) {
                    const fetchPositions = async () => {
                        try {
                            const { supabase: supabaseClient } = await import('@/lib/supabase-browser')
                            const { data: sportData } = await supabaseClient
                                .from('lookup_sports')
                                .select('id')
                                .eq('name', sport)
                                .single()

                            if (sportData) {
                                const { data: positions } = await supabaseClient
                                    .from('lookup_positions')
                                    .select('id, name, category')
                                    .eq('sport_id', sportData.id)
                                    .eq('role_id', 'player')
                                    .order('id')

                                setLookupPositions(positions || [])
                            }
                        } catch (err) {
                            console.error('Error fetching lookup positions:', err)
                        }
                    }
                    fetchPositions()
                }

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

                // Fetch career experiences from dedicated table
                const fetchCareerExperiences = async () => {
                    try {
                        const res = await fetch(`/api/career-experiences?userId=${userId}`)
                        if (!res.ok) return []
                        const data = await res.json()

                        // Reverse map: English DB country → Italian form label
                        const countryEnToIt: Record<string, string> = {
                            'Italy': 'Italia', 'Spain': 'Spagna', 'France': 'Francia',
                            'Germany': 'Germania', 'England': 'Inghilterra', 'Portugal': 'Portogallo',
                            'Netherlands': 'Olanda', 'Belgium': 'Belgio', 'Switzerland': 'Svizzera',
                            'Austria': 'Austria', 'Greece': 'Grecia', 'Turkey': 'Turchia',
                            'United States': 'Stati Uniti', 'Brazil': 'Brasile', 'Argentina': 'Argentina',
                        }

                        // Map DB fields to form fields
                        return data.map((exp: any) => {
                            const dbCountry = exp.organization?.country || ''
                            const formCountry = countryEnToIt[dbCountry] || dbCountry

                            return {
                                id: exp.id, // UUID from database
                                season: exp.season || '',
                                role: exp.role || 'Player',
                                primaryPosition: exp.position?.category || '',
                                positionDetail: exp.position?.name || exp.role_detail || '',
                                team: exp.organization?.name || '',
                                country: formCountry,
                                city: exp.organization?.city || '',
                                sport: exp.organization?.sport || 'Calcio',
                                category: exp.category || '',
                                categoryTier: exp.category_tier || '',
                                competitionType: exp.competition_type || 'male',
                                from: exp.start_date || '',
                                to: exp.end_date || '',
                                isCurrentlyPlaying: exp.is_current || false,
                                // Player stats (use ?? to preserve 0 values)
                                goals: exp.goals ?? undefined,
                                assists: exp.assists ?? undefined,
                                cleanSheets: exp.clean_sheets ?? undefined,
                                appearances: exp.appearances ?? undefined,
                                minutesPlayed: exp.minutes_played ?? undefined,
                                penalties: exp.penalties ?? undefined,
                                yellowCards: exp.yellow_cards ?? undefined,
                                redCards: exp.red_cards ?? undefined,
                                substitutionsIn: exp.substitutions_in ?? undefined,
                                substitutionsOut: exp.substitutions_out ?? undefined,
                                // Basket
                                pointsPerGame: exp.points_per_game ?? undefined,
                                rebounds: exp.rebounds ?? undefined,
                                // Volley (DB columns: aces, blocks, digs)
                                volleyAces: exp.aces ?? undefined,
                                volleyBlocks: exp.blocks ?? undefined,
                                volleyDigs: exp.digs ?? undefined,
                                // Coach stats
                                matchesCoached: exp.matches_coached ?? undefined,
                                wins: exp.wins ?? undefined,
                                draws: exp.draws ?? undefined,
                                losses: exp.losses ?? undefined,
                                trophies: exp.trophies ?? undefined,
                            }
                        })
                    } catch (err) {
                        console.error('Error fetching career experiences:', err)
                        return []
                    }
                }

                const physicalStats = await fetchPhysicalStats()
                const careerExperiences = await fetchCareerExperiences()

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
                    experiences: careerExperiences.length > 0
                        ? careerExperiences
                        : [],
                    availability: user.availability || "Disponibile",
                    height: physicalStats?.height_cm || user.height || undefined,
                    weight: physicalStats?.weight_kg || user.weight || undefined,
                    dominantFoot: physicalStats?.dominant_foot || user.dominantFoot || undefined,
                    dominantHand: physicalStats?.dominant_hand || user.dominantHand || undefined,
                    specificRole: roleId === "player" ? (user.specificRole ?? undefined) : undefined,
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
                    socialLinks: {
                        instagram: user.social_links?.instagram || user.socialLinks?.instagram || "",
                        tiktok: user.social_links?.tiktok || user.socialLinks?.tiktok || "",
                        youtube: user.social_links?.youtube || user.socialLinks?.youtube || "",
                        facebook: user.social_links?.facebook || user.socialLinks?.facebook || "",
                        twitter: user.social_links?.twitter || user.socialLinks?.twitter || "",
                        linkedin: user.social_links?.linkedin || user.socialLinks?.linkedin || "",
                        transfermarkt: user.social_links?.transfermarkt || user.socialLinks?.transfermarkt || ""
                    },
                    playerSelfEvaluation: roleId === 'player'
                        ? (roleSelfEvaluation || user.player_self_evaluation || user.playerSelfEvaluation || undefined)
                        : (user.player_self_evaluation || user.playerSelfEvaluation || undefined),
                    coachSelfEvaluation: roleId === 'coach'
                        ? (roleSelfEvaluation || user.coach_self_evaluation || user.coachSelfEvaluation || undefined)
                        : (user.coach_self_evaluation || user.coachSelfEvaluation || undefined),
                    // Stato contrattuale
                    contractStatus: user.contract_status || user.contractStatus || undefined,
                    contractEndDate: user.contract_end_date || user.contractEndDate || undefined,
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
    }, [activeRole, router, userId]);

    // Sincronizza il campo di ricerca con il valore del form
    useEffect(() => {
        setCountrySearchTerm(form.country || "")
    }, [form.country])

    const volleyRoles = useMemo(() => {
        if (mainSport !== 'Pallavolo' && mainSport !== 'Volley') return []
        return lookupPositions.map(p => p.name)
    }, [lookupPositions, mainSport])

    // Basket: ruoli base (dinamici da lookup_positions)
    const basketRoles = useMemo(() => {
        if (mainSport !== 'Basket') return []
        return lookupPositions.map(p => p.name)
    }, [lookupPositions, mainSport])

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

    // --- Calcio: opzioni guidate (dinamiche da lookup_positions) ---
    const footballPrimaryOptions = useMemo(() => {
        const cats = [...new Set(lookupPositions.map(p => p.category).filter(Boolean))]
        return cats.map(c => ({ value: c, label: c }))
    }, [lookupPositions])

    const footballSecondaryOptions: Record<string, { value: string; label: string }[]> = useMemo(() => {
        const map: Record<string, { value: string; label: string }[]> = {}
        lookupPositions.forEach(p => {
            if (!p.category) return
            if (!map[p.category]) map[p.category] = []
            map[p.category].push({ value: p.name, label: p.name })
        })
        return map
    }, [lookupPositions])

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
        const newExp = emptyExperience()
        setForm((prev) => ({ ...prev, experiences: [...prev.experiences, newExp] }))
        // Auto-expand new experiences
        setExpandedExps(prev => ({ ...prev, [newExp.id]: true }))
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
        // Rimuovi stato accordion
        setExpandedExps(prev => {
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
        setSaveError(null)

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
                socialLinks: form.socialLinks,
                playerSelfEvaluation: isPlayer ? form.playerSelfEvaluation : undefined,
                coachSelfEvaluation: isCoach ? form.coachSelfEvaluation : undefined,
                activeRoleId: activeRole || resolvedRoleId || undefined,
                roleSelfEvaluation: isPlayer
                    ? form.playerSelfEvaluation
                    : isCoach
                        ? form.coachSelfEvaluation
                        : undefined,
                // Stato contrattuale (solo per Player, Coach, Sporting Director)
                contractStatus: (isPlayer || isCoach || isSportingDirector) ? form.contractStatus : undefined,
                contractEndDate: (isPlayer || isCoach || isSportingDirector) ? form.contractEndDate : undefined,
            }

            // Le experiences NON vanno nella tabella profiles (verranno gestite separatamente)
            // I dati fisici (height, weight, dominantFoot, dominantHand) vanno in physical_stats
            // Tutti i campi role-specific (uefaLicenses, certifications, ecc.) non sono più nella tabella profiles
            const authHeaders = await getAuthHeaders()
            const commonHeaders = {
                "Content-Type": "application/json",
                ...authHeaders,
            }

            const res = await fetch("/api/users", {
                method: "PATCH",
                credentials: "include",
                headers: commonHeaders,
                body: JSON.stringify(payload),
            })
            if (!res.ok) {
                const errorBody = await res.json().catch(async () => ({ error: await res.text() }))
                const errorKey = String(errorBody?.error || '')
                console.error('Save failed:', res.status, errorBody)

                if (res.status === 401 || errorKey === 'unauthorized') {
                    setSaveError('Sessione scaduta. Effettua di nuovo il login e riprova.')
                    return
                }
                if (res.status === 403 || errorKey === 'forbidden_user_mismatch') {
                    setSaveError('Profilo non coerente con l’utente autenticato. Ricarica la pagina o accedi di nuovo.')
                    return
                }

                const serverMessage = typeof errorBody?.message === 'string'
                    ? errorBody.message
                    : typeof errorBody?.error === 'string'
                        ? errorBody.error
                        : `Errore salvataggio (${res.status})`
                setSaveError(serverMessage)
                return
            }
            const updated = await res.json()

            // Save physical stats to dedicated table if user is a player
            if (isPlayer && (form.height || form.weight || form.dominantFoot || form.dominantHand)) {
                try {
                    const physRes = await fetch("/api/physical-stats", {
                        method: "POST",
                        credentials: "include",
                        headers: commonHeaders,
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

            // Save career experiences
            if (form.experiences && form.experiences.length > 0) {
                try {
                    // Debug: mostra cosa stiamo per salvare
                    console.log('🔍 Tentativo salvataggio esperienze:', {
                        count: form.experiences.length,
                        experiences: form.experiences.map(exp => ({
                            season: exp.season,
                            team: exp.team,
                            country: exp.country,
                            sport: exp.sport,
                            category: exp.category
                        }))
                    })

                    const expRes = await fetch("/api/career-experiences", {
                        method: "POST",
                        credentials: "include",
                        headers: commonHeaders,
                        body: JSON.stringify({
                            userId: userId,
                            experiences: form.experiences,
                        }),
                    })

                    const expResult = await expRes.json()

                    // Debug: mostra risposta completa
                    console.log('📦 Risposta API:', expResult)

                    if (!expRes.ok) {
                        console.error('❌ Salvataggio fallito:', expRes.status, expResult)
                        alert(
                            `❌ NESSUNA esperienza salvata!\n\n` +
                            `Errore: ${expResult.error || 'Errore sconosciuto'}\n\n` +
                            `Possibili cause:\n` +
                            `• Organizzazione/Club non esiste nel database\n` +
                            `• Devi SELEZIONARE il club dall'autocomplete (non solo digitarlo)\n` +
                            `• Campo "Stagione" mancante (es: 2024/2025)\n\n` +
                            `Per aggiungere un nuovo club, contatta l'amministratore.`
                        )
                    } else {
                        console.log(`✅ Salvate ${expResult.count}/${form.experiences.length} esperienze`)

                        // Mostra warning se alcune esperienze non sono state salvate
                        if (expResult.errors && expResult.errors.length > 0) {
                            const failedItems = expResult.errors.map((e: any) => {
                                const exp = e.experience || {}
                                const season = exp.season || 'N/A'
                                const team = exp.team || 'N/A'
                                const category = exp.category || ''
                                return `• Stagione: ${season}, Club: ${team}${category ? ` (${category})` : ''}\n  → ${e.error}`
                            }).join('\n\n')

                            alert(
                                `⚠️ ATTENZIONE - Salvataggio parziale:\n\n` +
                                `✅ ${expResult.count} esperienze salvate\n` +
                                `❌ ${expResult.errors.length} esperienze NON salvate:\n\n` +
                                `${failedItems}\n\n` +
                                `💡 IMPORTANTE:\n` +
                                `Devi SELEZIONARE il club dall'autocomplete.\n` +
                                `Non basta digitare il nome - devi cliccare sulla voce che appare.\n\n` +
                                `Se il club non esiste nella lista, contatta l'amministratore.`
                            )
                        } else if (expResult.count > 0) {
                            // Tutto ok - messaggio di successo
                            console.log(`✅ Tutte le ${expResult.count} esperienze salvate con successo`)
                        }
                    }
                } catch (expErr) {
                    console.error('💥 Errore inatteso:', expErr)
                    alert('❌ Errore di rete nel salvataggio esperienze.\n\nControlla la connessione e riprova.')
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
        "w-full rounded-xl border border-base-300 bg-base-200 px-4 py-3 text-sm text-base-content placeholder:text-secondary focus:border-primary focus:ring-2 focus:ring-primary/30"

    if (loading) {
        return (
            <div className="min-h-screen glass-page-bg text-base-content flex items-center justify-center">
                <div className="text-lg font-semibold">Caricamento profilo...</div>
            </div>
        )
    }

    return (
        <div className="min-h-screen glass-page-bg text-base-content">
            <div className="max-w-6xl mx-auto px-4 py-10 lg:py-12">
                {saveError && (
                    <div className="mb-6 rounded-xl border border-error/40 bg-error/10 p-4 text-sm text-error-content">
                        <div className="font-semibold">Impossibile salvare le modifiche</div>
                        <div className="mt-1">{saveError}</div>
                    </div>
                )}
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <p className="text-sm uppercase tracking-[0.2em] glass-subtle-text">Profilo</p>
                        <h1 className="text-3xl font-semibold mt-1">Modifica il tuo profilo</h1>
                    </div>
                    <div className="flex gap-3">
                        <button
                            onClick={() => router.back()}
                            className="rounded-xl border border-base-300 bg-base-200 px-4 py-2 text-sm text-base-content hover:bg-base-300"
                        >
                            Annulla
                        </button>
                        <button
                            onClick={handleSave}
                            disabled={saving}
                            className="rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary-hover disabled:opacity-60"
                        >
                            {saving ? "Salvataggio..." : "Salva modifiche"}
                        </button>
                    </div>
                </div>

                {/* Main content */}
                <div className="space-y-6">
                    <section className="glass-widget rounded-2xl border border-base-300/70 p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs uppercase tracking-[0.2em] glass-subtle-text">Informazioni personali</p>
                                <h2 className="text-xl font-semibold mt-1">Dettagli principali</h2>
                            </div>
                            <div className="text-xs glass-subtle-text">Completa per aumentare la fiducia</div>
                        </div>
                        <div className="mt-6 grid gap-4 lg:grid-cols-2">
                            <div className="space-y-2">
                                <label className="text-sm text-secondary">Email</label>
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
                                <label className="text-sm text-secondary">Data di nascita</label>
                                <input
                                    type="date"
                                    value={form.birthDate}
                                    onChange={(e) => updateField("birthDate", e.target.value)}
                                    className={inputBase}
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm text-secondary">Bio</label>
                                <textarea
                                    value={form.bio}
                                    onChange={(e) => updateField("bio", e.target.value)}
                                    maxLength={500}
                                    rows={4}
                                    placeholder="Racconta la tua storia, specializzazioni, risultati..."
                                    className={`${inputBase} resize-none`}
                                />
                                <div className="flex items-center justify-between text-xs">
                                    <span className={`${form.bio.length > 450 ? 'text-warning' : 'glass-subtle-text'}`}>
                                        {form.bio.length}/500 caratteri
                                    </span>
                                    <span className="glass-quiet-text text-right">
                                        Usa un linguaggio professionale e rispettoso
                                    </span>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm text-secondary">Nazionalità</label>
                                <div className="relative">
                                    <input
                                        type="text"
                                        value={countrySearchTerm}
                                        onChange={(e) => {
                                            setCountrySearchTerm(e.target.value)
                                            setShowCountryDropdown(true)
                                        }}
                                        onFocus={() => setShowCountryDropdown(true)}
                                        onBlur={() => setTimeout(() => setShowCountryDropdown(false), 200)}
                                        placeholder="Cerca nazionalità..."
                                        className={inputBase}
                                    />
                                    {showCountryDropdown && (
                                        <div className="absolute z-50 w-full mt-1 bg-base-100 border border-base-300 rounded-xl shadow-lg max-h-60 overflow-y-auto">
                                            {allCountries
                                                .filter((country) =>
                                                    country.name.toLowerCase().includes(countrySearchTerm.toLowerCase())
                                                )
                                                .slice(0, 10)
                                                .map((country) => (
                                                    <div
                                                        key={country.code}
                                                        onClick={() => {
                                                            updateField("country", country.name)
                                                            setCountrySearchTerm(country.name)
                                                            setShowCountryDropdown(false)
                                                        }}
                                                        className="px-4 py-2.5 cursor-pointer hover:bg-base-200 transition-colors flex items-center gap-2 first:rounded-t-xl last:rounded-b-xl"
                                                    >
                                                        <span
                                                            className={`fi fi-${country.code.toLowerCase()} rounded-sm shadow-sm shrink-0`}
                                                            style={{ width: '1.25rem', height: '0.9375rem', display: 'inline-block' }}
                                                            aria-label={country.name}
                                                            role="img"
                                                        />
                                                        <span>{country.name}</span>
                                                    </div>
                                                ))}
                                            {allCountries.filter((country) =>
                                                country.name.toLowerCase().includes(countrySearchTerm.toLowerCase())
                                            ).length === 0 && (
                                                    <div className="px-4 py-2 glass-subtle-text text-sm">
                                                        Nessun paese trovato
                                                    </div>
                                                )}
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm text-secondary">Disponibilità per lavori</label>
                                <div className="relative">
                                    <input
                                        type="text"
                                        value={form.availability}
                                        readOnly
                                        onFocus={() => setShowAvailabilityDropdown(true)}
                                        onBlur={() => setTimeout(() => setShowAvailabilityDropdown(false), 200)}
                                        placeholder="Seleziona disponibilità"
                                        className={`${inputBase} cursor-pointer`}
                                    />
                                    {showAvailabilityDropdown && (
                                        <div className="absolute z-50 w-full mt-1 bg-base-100 border border-base-300 rounded-xl shadow-lg overflow-hidden">
                                            {['Disponibile', 'Non disponibile'].map((option) => (
                                                <div
                                                    key={option}
                                                    onClick={() => {
                                                        updateField("availability", option)
                                                        setShowAvailabilityDropdown(false)
                                                    }}
                                                    className={`px-4 py-2.5 cursor-pointer transition-colors ${form.availability === option
                                                        ? 'bg-base-200 font-medium'
                                                        : 'hover:bg-base-200'
                                                        }`}
                                                >
                                                    {option}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Stato Contrattuale - Solo per Player, Coach, Sporting Director */}
                            {(isPlayer || isCoach || isSportingDirector) && (
                                <>
                                    <div className="space-y-2">
                                        <label className="text-sm text-secondary">Stato contrattuale</label>
                                        <div className="relative">
                                            <input
                                                type="text"
                                                value={form.contractStatus
                                                    ? form.contractStatus === 'svincolato' ? 'Svincolato' : 'Sotto contratto'
                                                    : ''}
                                                readOnly
                                                onFocus={() => setShowContractStatusDropdown(true)}
                                                onBlur={() => setTimeout(() => setShowContractStatusDropdown(false), 200)}
                                                placeholder="Seleziona stato"
                                                className={`${inputBase} cursor-pointer`}
                                            />
                                            {showContractStatusDropdown && (
                                                <div className="absolute z-50 w-full mt-1 bg-base-100 border border-base-300 rounded-xl shadow-lg overflow-hidden">
                                                    {[{ value: 'svincolato', label: 'Svincolato' }, { value: 'sotto contratto', label: 'Sotto contratto' }].map((option) => (
                                                        <div
                                                            key={option.value}
                                                            onClick={() => {
                                                                updateField('contractStatus', option.value)
                                                                if (option.value === 'svincolato') updateField('contractEndDate', undefined)
                                                                setShowContractStatusDropdown(false)
                                                            }}
                                                            className={`px-4 py-2.5 cursor-pointer transition-colors ${form.contractStatus === option.value
                                                                ? 'bg-base-200 font-medium'
                                                                : 'hover:bg-base-200'
                                                                }`}
                                                        >
                                                            {option.label}
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {form.contractStatus === 'sotto contratto' && (
                                        <div className="space-y-2">
                                            <label className="text-sm text-secondary">Data fine contratto</label>
                                            <input
                                                type="date"
                                                value={form.contractEndDate || ""}
                                                onChange={(e) => updateField("contractEndDate", e.target.value || undefined)}
                                                className={inputBase}
                                                min={new Date().toISOString().split('T')[0]}
                                            />
                                        </div>
                                    )}
                                </>
                            )}

                            {isPlayer && (
                                <>
                                    <div className="space-y-2">
                                        <label className="text-sm text-secondary">Altezza (cm)</label>
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
                                        <label className="text-sm text-secondary">Peso (kg)</label>
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
                                            <label className="text-sm text-secondary">Piede dominante</label>
                                            <div className="relative">
                                                <input
                                                    type="text"
                                                    value={form.dominantFoot || ""}
                                                    readOnly
                                                    onFocus={() => setShowFootDropdown(true)}
                                                    onBlur={() => setTimeout(() => setShowFootDropdown(false), 200)}
                                                    placeholder="Seleziona piede"
                                                    className={`${inputBase} cursor-pointer`}
                                                />
                                                {showFootDropdown && (
                                                    <div className="absolute z-50 w-full mt-1 bg-base-100 border border-base-300 rounded-xl shadow-lg overflow-hidden">
                                                        {['', 'destro', 'sinistro', 'ambidestro'].map((option) => (
                                                            <div
                                                                key={option || 'empty'}
                                                                onClick={() => {
                                                                    updateField("dominantFoot", option || undefined)
                                                                    setShowFootDropdown(false)
                                                                }}
                                                                className={`px-4 py-2.5 cursor-pointer transition-colors ${form.dominantFoot === option || (!form.dominantFoot && !option)
                                                                    ? 'bg-base-200 font-medium'
                                                                    : 'hover:bg-base-200'
                                                                    }`}
                                                            >
                                                                {option ? option.charAt(0).toUpperCase() + option.slice(1) : 'Seleziona piede'}
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                    {(mainSport === "Basket" || mainSport === "Pallavolo") && (
                                        <div className="space-y-2">
                                            <label className="text-sm text-secondary">Mano dominante</label>
                                            <div className="relative">
                                                <input
                                                    type="text"
                                                    value={form.dominantHand || ""}
                                                    readOnly
                                                    onFocus={() => setShowHandDropdown(true)}
                                                    onBlur={() => setTimeout(() => setShowHandDropdown(false), 200)}
                                                    placeholder="Seleziona mano"
                                                    className={`${inputBase} cursor-pointer`}
                                                />
                                                {showHandDropdown && (
                                                    <div className="absolute z-50 w-full mt-1 bg-base-100 border border-base-300 rounded-xl shadow-lg overflow-hidden">
                                                        {['', 'destra', 'sinistra', 'ambidestra'].map((option) => (
                                                            <div
                                                                key={option || 'empty'}
                                                                onClick={() => {
                                                                    updateField("dominantHand", option || undefined)
                                                                    setShowHandDropdown(false)
                                                                }}
                                                                className={`px-4 py-2.5 cursor-pointer transition-colors ${form.dominantHand === option || (!form.dominantHand && !option)
                                                                    ? 'bg-base-200 font-medium'
                                                                    : 'hover:bg-base-200'
                                                                    }`}
                                                            >
                                                                {option ? option.charAt(0).toUpperCase() + option.slice(1) : 'Seleziona mano'}
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                    </section>

                    {/* Sezione Qualifiche Agent */}
                    {isAgent && (
                        <section className="glass-widget rounded-2xl border border-base-300/70 p-6">
                            <div className="mb-6">
                                <p className="text-xs uppercase tracking-[0.2em] glass-subtle-text">Qualifiche</p>
                                <h2 className="text-xl font-semibold mt-1 text-base-content">Licenza e Informazioni</h2>
                            </div>

                            <div className="space-y-4">
                                {/* Licenza FIFA */}
                                <label className="flex items-center gap-3 p-4 border border-base-300 rounded-lg hover:bg-base-200/70 cursor-pointer transition">
                                    <input
                                        type="checkbox"
                                        checked={form.hasFifaLicense || false}
                                        onChange={(e) => updateField("hasFifaLicense", e.target.checked)}
                                        className="w-5 h-5 text-primary border-base-300 rounded focus:ring-primary"
                                    />
                                    <div>
                                        <span className="block text-sm font-semibold text-base-content">Licenza FIFA</span>
                                        <span className="text-xs glass-subtle-text">Sono un agente FIFA registrato</span>
                                    </div>
                                </label>

                                {/* Numero Licenza */}
                                {form.hasFifaLicense && (
                                    <div>
                                        <label className="block text-sm font-medium text-secondary mb-2">
                                            Numero Licenza FIFA
                                        </label>
                                        <input
                                            type="text"
                                            value={form.fifaLicenseNumber || ""}
                                            onChange={(e) => updateField("fifaLicenseNumber", e.target.value)}
                                            placeholder="Es: 123456789"
                                            className="w-full rounded-xl border border-base-300 bg-base-200 px-4 py-3 text-sm text-base-content focus:border-primary focus:ring-1 focus:ring-primary"
                                        />
                                    </div>
                                )}

                                {/* Note Agente */}
                                <div>
                                    <label className="block text-sm font-medium text-secondary mb-2">
                                        Informazioni Aggiuntive
                                    </label>
                                    <textarea
                                        value={form.agentNotes || ""}
                                        onChange={(e) => updateField("agentNotes", e.target.value)}
                                        rows={3}
                                        placeholder="Es: Specializzazione in trasferimenti internazionali, focus su giovani talenti..."
                                        className="w-full rounded-xl border border-base-300 bg-base-200 px-4 py-3 text-sm text-base-content resize-none focus:border-primary focus:ring-1 focus:ring-primary"
                                    />
                                </div>
                            </div>
                        </section>
                    )}

                    {/* Sezione Certificazioni Coach */}
                    {isCoach && (
                        <section className="glass-widget rounded-2xl border border-base-300/70 p-6">
                            <div className="flex items-center justify-between mb-6">
                                <div>
                                    <p className="text-xs uppercase tracking-[0.2em] glass-subtle-text">Qualifiche</p>
                                    <h2 className="text-xl font-semibold mt-1 text-base-content">Certificazioni Allenatore</h2>
                                </div>
                                <button
                                    type="button"
                                    onClick={addCertification}
                                    className="inline-flex items-center gap-2 rounded-full bg-primary px-3 py-2 text-xs font-semibold text-white hover:bg-primary-hover"
                                >
                                    <PlusIcon className="h-4 w-4" />
                                    Aggiungi certificazione
                                </button>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <p className="text-xs glass-subtle-text mb-3">Seleziona dalle certificazioni suggerite:</p>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-4">
                                        {mainSport && coachCertificationOptions[mainSport]?.map((cert) => (
                                            <button
                                                key={cert}
                                                type="button"
                                                onClick={() => setForm(prev => ({ ...prev, certifications: [...(prev.certifications || []), { ...emptyCertification(), name: cert }] }))}
                                                className="text-left p-2 text-sm border border-brand-300 rounded-lg bg-brand-50 hover:bg-brand-100 transition"
                                            >
                                                + {cert}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {(form.certifications || []).length === 0 && (
                                    <div className="rounded-xl border border-dashed border-base-300 bg-base-200 p-4 text-sm glass-subtle-text">
                                        Nessuna certificazione inserita. Aggiungi le tue qualifiche professionali.
                                    </div>
                                )}

                                {(form.certifications || []).map((cert) => (
                                    <div key={cert.id} className="rounded-xl border border-base-300 bg-base-100 p-4">
                                        <div className="flex items-start justify-between gap-3">
                                            <div className="flex-1 grid gap-3 md:grid-cols-2">
                                                <input
                                                    value={cert.name}
                                                    onChange={(e) => handleCertificationChange(cert.id, "name", e.target.value)}
                                                    placeholder="Nome certificazione"
                                                    className="w-full rounded-xl border border-base-300 bg-base-200 px-4 py-3 text-sm text-base-content"
                                                />
                                                <input
                                                    value={cert.issuingOrganization}
                                                    onChange={(e) => handleCertificationChange(cert.id, "issuingOrganization", e.target.value)}
                                                    placeholder="Ente rilascio (FIGC, FIP, FIPAV)"
                                                    className="w-full rounded-xl border border-base-300 bg-base-200 px-4 py-3 text-sm text-base-content"
                                                />
                                                <input
                                                    type="number"
                                                    value={cert.yearObtained}
                                                    onChange={(e) => handleCertificationChange(cert.id, "yearObtained", e.target.value)}
                                                    placeholder="Anno conseguimento"
                                                    min="1950"
                                                    max={new Date().getFullYear()}
                                                    className="w-full rounded-xl border border-base-300 bg-base-200 px-4 py-3 text-sm text-base-content"
                                                />
                                                <input
                                                    type="number"
                                                    value={cert.expiryDate || ""}
                                                    onChange={(e) => handleCertificationChange(cert.id, "expiryDate", e.target.value)}
                                                    placeholder="Scadenza (opzionale)"
                                                    min={cert.yearObtained || "1950"}
                                                    className="w-full rounded-xl border border-base-300 bg-base-200 px-4 py-3 text-sm text-base-content"
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
                        <section className="glass-widget rounded-2xl border border-base-300/70 p-6">
                            <div className="flex items-center justify-between mb-6">
                                <div>
                                    <p className="text-xs uppercase tracking-[0.2em] glass-subtle-text">Qualifiche</p>
                                    <h2 className="text-xl font-semibold mt-1 text-base-content">Certificazioni Direttore Sportivo</h2>
                                </div>
                                <button
                                    type="button"
                                    onClick={addCertification}
                                    className="inline-flex items-center gap-2 rounded-full bg-primary px-3 py-2 text-xs font-semibold text-white hover:bg-primary-hover"
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
                                                className="text-left p-2 text-sm border border-brand-300 rounded-lg bg-brand-50 hover:bg-brand-100 transition"
                                            >
                                                + {cert}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {(form.certifications || []).length === 0 && (
                                    <div className="rounded-xl border border-dashed border-base-300 bg-base-200 p-4 text-sm glass-subtle-text">
                                        Nessuna certificazione inserita. Aggiungi le tue qualifiche professionali.
                                    </div>
                                )}

                                {(form.certifications || []).map((cert) => (
                                    <div key={cert.id} className="rounded-xl border border-base-300 bg-base-100 p-4">
                                        <div className="flex items-start justify-between gap-3">
                                            <div className="flex-1 grid gap-3 md:grid-cols-2">
                                                <input
                                                    value={cert.name}
                                                    onChange={(e) => handleCertificationChange(cert.id, "name", e.target.value)}
                                                    placeholder="Nome certificazione"
                                                    className="w-full rounded-xl border border-base-300 bg-base-200 px-4 py-3 text-sm text-base-content"
                                                />
                                                <input
                                                    value={cert.issuingOrganization}
                                                    onChange={(e) => handleCertificationChange(cert.id, "issuingOrganization", e.target.value)}
                                                    placeholder="Ente rilascio (FIGC, FIP, FIPAV)"
                                                    className="w-full rounded-xl border border-base-300 bg-base-200 px-4 py-3 text-sm text-base-content"
                                                />
                                                <input
                                                    type="number"
                                                    value={cert.yearObtained}
                                                    onChange={(e) => handleCertificationChange(cert.id, "yearObtained", e.target.value)}
                                                    placeholder="Anno conseguimento"
                                                    min="1950"
                                                    max={new Date().getFullYear()}
                                                    className="w-full rounded-xl border border-base-300 bg-base-200 px-4 py-3 text-sm text-base-content"
                                                />
                                                <input
                                                    type="number"
                                                    value={cert.expiryDate || ""}
                                                    onChange={(e) => handleCertificationChange(cert.id, "expiryDate", e.target.value)}
                                                    placeholder="Scadenza (opzionale)"
                                                    min={cert.yearObtained || "1950"}
                                                    className="w-full rounded-xl border border-base-300 bg-base-200 px-4 py-3 text-sm text-base-content"
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
                        <section className="glass-widget rounded-2xl border border-base-300/70 p-6">
                            <div className="flex items-center justify-between mb-6">
                                <div>
                                    <p className="text-xs uppercase tracking-[0.2em] glass-subtle-text">Qualifiche</p>
                                    <h2 className="text-xl font-semibold mt-1 text-base-content">Certificazioni Fisioterapista</h2>
                                </div>
                                <button
                                    type="button"
                                    onClick={addCertification}
                                    className="inline-flex items-center gap-2 rounded-full bg-primary px-3 py-2 text-xs font-semibold text-white hover:bg-primary-hover"
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
                                                className="text-left p-2 text-sm border border-brand-300 rounded-lg bg-brand-50 hover:bg-brand-100 transition"
                                            >
                                                + {cert}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {(form.certifications || []).length === 0 && (
                                    <div className="rounded-xl border border-dashed border-base-300 bg-base-200 p-4 text-sm glass-subtle-text">
                                        Nessuna certificazione inserita. Aggiungi le tue qualifiche professionali.
                                    </div>
                                )}

                                {(form.certifications || []).map((cert) => (
                                    <div key={cert.id} className="rounded-xl border border-base-300 bg-base-100 p-4">
                                        <div className="flex items-start justify-between gap-3">
                                            <div className="flex-1 grid gap-3 md:grid-cols-2">
                                                <input
                                                    value={cert.name}
                                                    onChange={(e) => handleCertificationChange(cert.id, "name", e.target.value)}
                                                    placeholder="Nome certificazione"
                                                    className="w-full rounded-xl border border-base-300 bg-base-200 px-4 py-3 text-sm text-base-content"
                                                />
                                                <input
                                                    value={cert.issuingOrganization}
                                                    onChange={(e) => handleCertificationChange(cert.id, "issuingOrganization", e.target.value)}
                                                    placeholder="Ente rilascio (TSRM PSTRP, IAASP)"
                                                    className="w-full rounded-xl border border-base-300 bg-base-200 px-4 py-3 text-sm text-base-content"
                                                />
                                                <input
                                                    type="number"
                                                    value={cert.yearObtained}
                                                    onChange={(e) => handleCertificationChange(cert.id, "yearObtained", e.target.value)}
                                                    placeholder="Anno conseguimento"
                                                    min="1950"
                                                    max={new Date().getFullYear()}
                                                    className="w-full rounded-xl border border-base-300 bg-base-200 px-4 py-3 text-sm text-base-content"
                                                />
                                                <input
                                                    type="number"
                                                    value={cert.expiryDate || ""}
                                                    onChange={(e) => handleCertificationChange(cert.id, "expiryDate", e.target.value)}
                                                    placeholder="Scadenza (opzionale)"
                                                    min={cert.yearObtained || "1950"}
                                                    className="w-full rounded-xl border border-base-300 bg-base-200 px-4 py-3 text-sm text-base-content"
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
                        <section className="glass-widget rounded-2xl border border-base-300/70 p-6">
                            <div className="flex items-center justify-between mb-6">
                                <div>
                                    <p className="text-xs uppercase tracking-[0.2em] glass-subtle-text">Qualifiche</p>
                                    <h2 className="text-xl font-semibold mt-1 text-base-content">Certificazioni Preparatore Atletico</h2>
                                </div>
                                <button
                                    type="button"
                                    onClick={addCertification}
                                    className="inline-flex items-center gap-2 rounded-full bg-primary px-3 py-2 text-xs font-semibold text-white hover:bg-primary-hover"
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
                                                className="text-left p-2 text-sm border border-brand-300 rounded-lg bg-brand-50 hover:bg-brand-100 transition"
                                            >
                                                + {cert}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {(form.certifications || []).length === 0 && (
                                    <div className="rounded-xl border border-dashed border-base-300 bg-base-200 p-4 text-sm glass-subtle-text">
                                        Nessuna certificazione inserita. Aggiungi le tue qualifiche professionali.
                                    </div>
                                )}

                                {(form.certifications || []).map((cert) => (
                                    <div key={cert.id} className="rounded-xl border border-base-300 bg-base-100 p-4">
                                        <div className="flex items-start justify-between gap-3">
                                            <div className="flex-1 grid gap-3 md:grid-cols-2">
                                                <input
                                                    value={cert.name}
                                                    onChange={(e) => handleCertificationChange(cert.id, "name", e.target.value)}
                                                    placeholder="Nome certificazione"
                                                    className="w-full rounded-xl border border-base-300 bg-base-200 px-4 py-3 text-sm text-base-content"
                                                />
                                                <input
                                                    value={cert.issuingOrganization}
                                                    onChange={(e) => handleCertificationChange(cert.id, "issuingOrganization", e.target.value)}
                                                    placeholder="Ente rilascio (NSCA, IUSCA)"
                                                    className="w-full rounded-xl border border-base-300 bg-base-200 px-4 py-3 text-sm text-base-content"
                                                />
                                                <input
                                                    type="number"
                                                    value={cert.yearObtained}
                                                    onChange={(e) => handleCertificationChange(cert.id, "yearObtained", e.target.value)}
                                                    placeholder="Anno conseguimento"
                                                    min="1950"
                                                    max={new Date().getFullYear()}
                                                    className="w-full rounded-xl border border-base-300 bg-base-200 px-4 py-3 text-sm text-base-content"
                                                />
                                                <input
                                                    type="number"
                                                    value={cert.expiryDate || ""}
                                                    onChange={(e) => handleCertificationChange(cert.id, "expiryDate", e.target.value)}
                                                    placeholder="Scadenza (opzionale)"
                                                    min={cert.yearObtained || "1950"}
                                                    className="w-full rounded-xl border border-base-300 bg-base-200 px-4 py-3 text-sm text-base-content"
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
                        <section className="glass-widget rounded-2xl border border-base-300/70 p-6">
                            <div className="flex items-center justify-between mb-6">
                                <div>
                                    <p className="text-xs uppercase tracking-[0.2em] glass-subtle-text">Qualifiche</p>
                                    <h2 className="text-xl font-semibold mt-1 text-base-content">Certificazioni e Abilitazioni</h2>
                                </div>
                                <button
                                    type="button"
                                    onClick={addCertification}
                                    className="inline-flex items-center gap-2 rounded-full bg-primary px-3 py-2 text-xs font-semibold text-white hover:bg-primary-hover"
                                >
                                    <PlusIcon className="h-4 w-4" />
                                    Aggiungi certificazione
                                </button>
                            </div>

                            <div className="space-y-4">
                                {(form.certifications || []).length === 0 && (
                                    <div className="rounded-xl border border-dashed border-base-300 bg-base-200 p-4 text-sm glass-subtle-text">
                                        Nessuna certificazione inserita. Aggiungi le tue qualifiche professionali.
                                    </div>
                                )}

                                {(form.certifications || []).map((cert) => (
                                    <div
                                        key={cert.id}
                                        className="rounded-xl border border-base-300 bg-base-100 p-4"
                                    >
                                        <div className="flex items-start justify-between gap-3">
                                            <div className="flex-1 grid gap-3 md:grid-cols-2">
                                                <input
                                                    value={cert.name}
                                                    onChange={(e) => handleCertificationChange(cert.id, "name", e.target.value)}
                                                    placeholder="Nome certificazione"
                                                    className="w-full rounded-xl border border-base-300 bg-base-200 px-4 py-3 text-sm text-base-content"
                                                />
                                                <input
                                                    value={cert.issuingOrganization}
                                                    onChange={(e) => handleCertificationChange(cert.id, "issuingOrganization", e.target.value)}
                                                    placeholder="Ente rilascio"
                                                    className="w-full rounded-xl border border-base-300 bg-base-200 px-4 py-3 text-sm text-base-content"
                                                />
                                                <input
                                                    type="number"
                                                    value={cert.yearObtained}
                                                    onChange={(e) => handleCertificationChange(cert.id, "yearObtained", e.target.value)}
                                                    placeholder="Anno conseguimento"
                                                    min="1950"
                                                    max={new Date().getFullYear()}
                                                    className="w-full rounded-xl border border-base-300 bg-base-200 px-4 py-3 text-sm text-base-content"
                                                />
                                                <input
                                                    type="number"
                                                    value={cert.expiryDate || ""}
                                                    onChange={(e) => handleCertificationChange(cert.id, "expiryDate", e.target.value)}
                                                    placeholder="Scadenza (opzionale)"
                                                    min={cert.yearObtained || "1950"}
                                                    className="w-full rounded-xl border border-base-300 bg-base-200 px-4 py-3 text-sm text-base-content"
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

                    {/* Social Links Section */}
                    <section className="space-y-6 glass-widget rounded-2xl border border-base-300/70 p-6 md:p-8 shadow-sm">
                        <SocialLinksForm
                            socialLinks={form.socialLinks}
                            onChange={(updated) => setForm(prev => ({ ...prev, socialLinks: updated }))}
                            inputClassName={inputBase}
                            showTransfermarkt={isPlayer}
                        />
                    </section>

                    {/* Player Self Evaluation Section */}
                    {isPlayer && (
                        <section className="space-y-6 glass-widget rounded-2xl border border-base-300/70 p-6 md:p-8 shadow-sm">
                            <SelfEvaluationForm
                                evaluation={form.playerSelfEvaluation}
                                professionalRole="Player"
                                sports={mainSport ? [mainSport] : []}
                                onChange={(updated) => setForm(prev => ({ ...prev, playerSelfEvaluation: updated }))}
                            />
                        </section>
                    )}

                    {/* Coach Self Evaluation Section */}
                    {isCoach && (
                        <section className="space-y-6 glass-widget rounded-2xl border border-base-300/70 p-6 md:p-8 shadow-sm">
                            <SelfEvaluationForm
                                evaluation={form.coachSelfEvaluation}
                                professionalRole="Coach"
                                sports={mainSport ? [mainSport] : []}
                                onChange={(updated) => setForm(prev => ({ ...prev, coachSelfEvaluation: updated }))}
                            />
                        </section>
                    )}

                    {/* Esperienze Section */}
                    <section className="glass-widget rounded-2xl border border-base-300/70 p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs uppercase tracking-[0.2em] glass-subtle-text">Esperienze</p>
                                <h2 className="text-xl font-semibold mt-1 text-base-content">Percorso professionale</h2>
                            </div>
                            <button
                                type="button"
                                onClick={addExperience}
                                className="inline-flex items-center gap-2 rounded-full bg-primary px-3 py-2 text-xs font-semibold text-white hover:bg-primary-hover"
                            >
                                <PlusIcon className="h-4 w-4" />
                                Aggiungi esperienza
                            </button>
                        </div>

                        <div className="mt-6 space-y-4">
                            {form.experiences.length === 0 && (
                                <div className="rounded-xl border border-dashed border-base-300 bg-base-200 p-4 text-sm glass-subtle-text">
                                    Nessuna esperienza inserita. Aggiungi il tuo percorso.
                                </div>
                            )}

                            {form.experiences.map((exp) => {
                                const isExpanded = expandedExps[exp.id] ?? !isSavedExperience(exp.id) // nuove aperte, salvate chiuse
                                const summaryParts = [
                                    exp.team || 'Club non specificato',
                                    exp.season ? `Stagione ${exp.season}` : null,
                                    exp.category || null,
                                    exp.positionDetail || exp.role || null,
                                ].filter(Boolean)

                                return (
                                    <div
                                        key={exp.id}
                                        className={`rounded-xl border ${isExpanded ? 'border-primary/30 bg-base-100 shadow-sm' : 'border-base-300 bg-base-200/50'} transition-all duration-200`}
                                    >
                                        {/* ── Accordion Header ── */}
                                        <div
                                            className="flex items-center justify-between gap-3 px-4 py-3 cursor-pointer select-none"
                                            onClick={() => toggleExpAccordion(exp.id)}
                                        >
                                            <div className="flex items-center gap-3 min-w-0 flex-1">
                                                <div className={`flex-shrink-0 w-2 h-2 rounded-full ${exp.isCurrentlyPlaying ? 'bg-primary' : 'bg-base-300'}`} />
                                                <div className="min-w-0 flex-1">
                                                    <p className="text-sm font-semibold text-base-content truncate">
                                                        {exp.team || <span className="glass-quiet-text italic">Nuova esperienza</span>}
                                                    </p>
                                                    <p className="text-xs glass-subtle-text truncate">
                                                        {[exp.season, exp.category, exp.positionDetail || exp.role].filter(Boolean).join(' · ') || 'Compila i dettagli'}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2 flex-shrink-0">
                                                {exp.isCurrentlyPlaying && (
                                                    <span className="hidden sm:inline-flex text-[10px] font-semibold uppercase tracking-wider bg-brand-100 text-brand-700 px-2 py-0.5 rounded-full">
                                                        Attuale
                                                    </span>
                                                )}
                                                <button
                                                    type="button"
                                                    onClick={(e) => { e.stopPropagation(); removeExperience(exp.id) }}
                                                    className="inline-flex h-7 w-7 items-center justify-center rounded-full text-red-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                                                    title="Rimuovi esperienza"
                                                >
                                                    <XMarkIcon className="h-4 w-4" />
                                                </button>
                                                <ChevronDownIcon className={`h-4 w-4 text-secondary transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`} />
                                            </div>
                                        </div>

                                        {/* ── Accordion Body ── */}
                                        {isExpanded && (
                                            <div className="px-4 pb-4 border-t border-base-300/70">
                                                <div className="pt-3">
                                                    <div className="flex items-start justify-between gap-3">
                                                        <div className="flex-1 grid gap-3 md:grid-cols-2">
                                                            {isCoach ? (
                                                                <>
                                                                    {/* Stagione - OBBLIGATORIO */}
                                                                    <CustomSelect
                                                                        value={exp.season}
                                                                        onChange={(value) => handleExperienceChange(exp.id, "season", value)}
                                                                        options={[
                                                                            { value: "", label: "Seleziona stagione *" },
                                                                            ...availableSeasons.map(season => ({ value: season, label: `Stagione ${season}` }))
                                                                        ]}
                                                                        className={inputBase}
                                                                        required
                                                                    />

                                                                    {/* Ruolo Coach */}
                                                                    <CustomSelect
                                                                        value={exp.role}
                                                                        onChange={(value) => handleExperienceChange(exp.id, "role", value)}
                                                                        options={[
                                                                            { value: "", label: "Seleziona ruolo" },
                                                                            ...(mainSport === "Calcio" ? coachFootballRoles : coachRoles).map(role => ({ value: role, label: role }))
                                                                        ]}
                                                                        className={inputBase}
                                                                    />

                                                                    {/* Team/Club - Autocomplete */}
                                                                    <OrganizationAutocomplete
                                                                        value={exp.team}
                                                                        onChange={(value, org) => {
                                                                            handleExperienceChange(exp.id, "team", value)
                                                                            // Auto-fill country, city, sport if organization is selected
                                                                            if (org) {
                                                                                handleExperienceChange(exp.id, "country", org.country)
                                                                                if (org.city) handleExperienceChange(exp.id, "city", org.city)
                                                                                handleExperienceChange(exp.id, "sport", org.sport)
                                                                            }
                                                                        }}
                                                                        sport={mainSport}
                                                                        country={exp.country || undefined}
                                                                        placeholder="Cerca organizzazione/club..."
                                                                        className={inputBase}
                                                                    />

                                                                    {/* Nazione */}
                                                                    <CustomSelect
                                                                        value={exp.country}
                                                                        onChange={(value) => {
                                                                            handleExperienceChange(exp.id, "country", value)
                                                                            handleExperienceChange(exp.id, "categoryTier", "")
                                                                            handleExperienceChange(exp.id, "competitionType", "")
                                                                            handleExperienceChange(exp.id, "category", "")
                                                                        }}
                                                                        options={[
                                                                            { value: "", label: "Seleziona nazione" },
                                                                            ...footballCountries.map(country => ({ value: country, label: country }))
                                                                        ]}
                                                                        className={inputBase}
                                                                    />

                                                                    {/* Macro Categoria */}
                                                                    <CustomSelect
                                                                        value={exp.categoryTier || ""}
                                                                        onChange={(value) => {
                                                                            handleExperienceChange(exp.id, "categoryTier", value)
                                                                            handleExperienceChange(exp.id, "competitionType", "")
                                                                            handleExperienceChange(exp.id, "category", "")
                                                                        }}
                                                                        options={[
                                                                            { value: "", label: exp.country ? "Seleziona macro categoria" : "Prima seleziona una nazione" },
                                                                            ...footballMacroCategories.map(tier => ({ value: tier, label: tier }))
                                                                        ]}
                                                                        className={inputBase}
                                                                        disabled={!exp.country}
                                                                    />

                                                                    {/* Tipologia Competizione */}
                                                                    <CustomSelect
                                                                        value={exp.competitionType || ""}
                                                                        onChange={(value) => {
                                                                            handleExperienceChange(exp.id, "competitionType", value)
                                                                            handleExperienceChange(exp.id, "category", "")
                                                                        }}
                                                                        options={[
                                                                            { value: "", label: exp.categoryTier ? "Seleziona tipologia competizione" : "Prima seleziona macro categoria" },
                                                                            ...competitionTypes.map(type => ({ value: type.value, label: type.label }))
                                                                        ]}
                                                                        className={inputBase}
                                                                        disabled={!exp.country || !exp.categoryTier}
                                                                    />

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
                                                                        <CustomSelect
                                                                            value={exp.category}
                                                                            onChange={(value) => handleExperienceChange(exp.id, "category", value)}
                                                                            options={[
                                                                                { value: "", label: exp.competitionType ? "Seleziona categoria" : "Prima seleziona tipologia competizione" },
                                                                                ...(exp.country && exp.categoryTier && exp.competitionType ? (
                                                                                    exp.competitionType === "female" ? (
                                                                                        exp.country === "Italia"
                                                                                            ? (footballFemaleCategoriesByTierItaly[exp.categoryTier] || []).map(cat => ({ value: cat, label: cat }))
                                                                                            : (footballFemaleCategoriesByTierDefault[exp.categoryTier] || []).map(cat => ({ value: cat, label: cat }))
                                                                                    ) : (
                                                                                        exp.country === "Italia"
                                                                                            ? (footballCategoriesByTierItaly[exp.categoryTier] || []).map(cat => ({ value: cat, label: cat }))
                                                                                            : (footballCategoriesByTierDefault[exp.categoryTier] || []).map(cat => ({ value: cat, label: cat }))
                                                                                    )
                                                                                ) : [])
                                                                            ]}
                                                                            className={inputBase}
                                                                            disabled={!exp.country || !exp.categoryTier || !exp.competitionType}
                                                                        />
                                                                    )}
                                                                </>
                                                            ) : isPlayer && mainSport === "Calcio" ? (
                                                                <>
                                                                    {/* Stagione - OBBLIGATORIO */}
                                                                    <CustomSelect
                                                                        value={exp.season}
                                                                        onChange={(value) => handleExperienceChange(exp.id, "season", value)}
                                                                        options={[
                                                                            { value: "", label: "Seleziona stagione *" },
                                                                            ...availableSeasons.map(season => ({ value: season, label: `Stagione ${season}` }))
                                                                        ]}
                                                                        className={inputBase}
                                                                        required
                                                                    />

                                                                    <CustomSelect
                                                                        value={exp.primaryPosition || ''}
                                                                        onChange={(value) => {
                                                                            handleExperienceChange(exp.id, "primaryPosition", value)
                                                                            handleExperienceChange(exp.id, "role", "Player")
                                                                            // Reset positionDetail quando cambia primaryPosition
                                                                            handleExperienceChange(exp.id, "positionDetail", "")
                                                                        }}
                                                                        options={[
                                                                            { value: "", label: "Seleziona ruolo" },
                                                                            ...footballPrimaryOptions.map(opt => ({ value: opt.value, label: opt.label }))
                                                                        ]}
                                                                        className={inputBase}
                                                                    />
                                                                    <CustomSelect
                                                                        value={exp.positionDetail || ''}
                                                                        onChange={(value) => handleExperienceChange(exp.id, "positionDetail", value)}
                                                                        options={[
                                                                            { value: "", label: exp.primaryPosition ? "Seleziona dettaglio ruolo" : "Prima seleziona un ruolo" },
                                                                            ...(exp.primaryPosition && footballSecondaryOptions[exp.primaryPosition] ? footballSecondaryOptions[exp.primaryPosition].map(opt => ({ value: opt.value, label: opt.label })) : [])
                                                                        ]}
                                                                        className={inputBase}
                                                                        disabled={!exp.primaryPosition}
                                                                    />
                                                                </>
                                                            ) : isPlayer && mainSport === "Basket" ? (
                                                                <>
                                                                    {/* Stagione - OBBLIGATORIO */}
                                                                    <CustomSelect
                                                                        value={exp.season}
                                                                        onChange={(value) => handleExperienceChange(exp.id, "season", value)}
                                                                        options={[
                                                                            { value: "", label: "Seleziona stagione *" },
                                                                            ...availableSeasons.map(season => ({ value: season, label: `Stagione ${season}` }))
                                                                        ]}
                                                                        className={inputBase}
                                                                        required
                                                                    />

                                                                    <CustomSelect
                                                                        value={exp.role}
                                                                        onChange={(value) => handleExperienceChange(exp.id, "role", value)}
                                                                        options={[
                                                                            { value: "", label: "Seleziona ruolo" },
                                                                            ...basketRoles.map(role => ({ value: role, label: role }))
                                                                        ]}
                                                                        className={inputBase}
                                                                    />
                                                                </>
                                                            ) : isPlayer && mainSport === "Pallavolo" ? (
                                                                <>
                                                                    {/* Stagione - OBBLIGATORIO */}
                                                                    <CustomSelect
                                                                        value={exp.season}
                                                                        onChange={(value) => handleExperienceChange(exp.id, "season", value)}
                                                                        options={[
                                                                            { value: "", label: "Seleziona stagione *" },
                                                                            ...availableSeasons.map(season => ({ value: season, label: `Stagione ${season}` }))
                                                                        ]}
                                                                        className={inputBase}
                                                                        required
                                                                    />

                                                                    <CustomSelect
                                                                        value={exp.role}
                                                                        onChange={(value) => handleExperienceChange(exp.id, "role", value)}
                                                                        options={[
                                                                            { value: "", label: "Seleziona ruolo" },
                                                                            ...volleyRoles.map(role => ({ value: role, label: role }))
                                                                        ]}
                                                                        className={inputBase}
                                                                    />
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
                                                                <OrganizationAutocomplete
                                                                    value={exp.team}
                                                                    onChange={(value, org) => {
                                                                        handleExperienceChange(exp.id, "team", value)
                                                                        // Auto-fill country, city, sport if organization is selected
                                                                        if (org) {
                                                                            handleExperienceChange(exp.id, "country", org.country)
                                                                            if (org.city) handleExperienceChange(exp.id, "city", org.city)
                                                                            handleExperienceChange(exp.id, "sport", org.sport)
                                                                        }
                                                                    }}
                                                                    sport={mainSport}
                                                                    country={exp.country || undefined}
                                                                    placeholder="Cerca organizzazione/club..."
                                                                    className={inputBase}
                                                                />
                                                            )}
                                                            {!isCoach && isPlayer && mainSport === "Calcio" ? (
                                                                <>
                                                                    {/* Nazione */}
                                                                    <CustomSelect
                                                                        value={exp.country}
                                                                        onChange={(value) => {
                                                                            handleExperienceChange(exp.id, "country", value)
                                                                            // Reset tutti i campi successivi quando cambia nazione
                                                                            handleExperienceChange(exp.id, "categoryTier", "")
                                                                            handleExperienceChange(exp.id, "competitionType", "")
                                                                            handleExperienceChange(exp.id, "category", "")
                                                                        }}
                                                                        options={[
                                                                            { value: "", label: "Seleziona nazione" },
                                                                            ...footballCountries.map(country => ({ value: country, label: country }))
                                                                        ]}
                                                                        className={inputBase}
                                                                    />

                                                                    {/* Macro categoria */}
                                                                    <CustomSelect
                                                                        value={exp.categoryTier || ""}
                                                                        onChange={(value) => {
                                                                            handleExperienceChange(exp.id, "categoryTier", value)
                                                                            // Reset campi successivi quando cambia macro
                                                                            handleExperienceChange(exp.id, "competitionType", "")
                                                                            handleExperienceChange(exp.id, "category", "")
                                                                        }}
                                                                        options={[
                                                                            { value: "", label: exp.country ? "Seleziona macro categoria" : "Prima seleziona una nazione" },
                                                                            ...footballMacroCategories.map(tier => ({ value: tier, label: tier }))
                                                                        ]}
                                                                        className={inputBase}
                                                                        disabled={!exp.country}
                                                                    />

                                                                    {/* Tipologia Competizione (NUOVO) */}
                                                                    <CustomSelect
                                                                        value={exp.competitionType || ""}
                                                                        onChange={(value) => {
                                                                            handleExperienceChange(exp.id, "competitionType", value)
                                                                            // Reset categoria quando cambia tipologia
                                                                            handleExperienceChange(exp.id, "category", "")
                                                                        }}
                                                                        options={[
                                                                            { value: "", label: exp.categoryTier ? "Seleziona tipologia competizione" : "Prima seleziona macro categoria" },
                                                                            ...competitionTypes.map(type => ({ value: type.value, label: type.label }))
                                                                        ]}
                                                                        className={inputBase}
                                                                        disabled={!exp.country || !exp.categoryTier}
                                                                    />

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
                                                                        <CustomSelect
                                                                            value={exp.category}
                                                                            onChange={(value) => handleExperienceChange(exp.id, "category", value)}
                                                                            options={[
                                                                                { value: "", label: exp.competitionType ? "Seleziona categoria" : "Prima seleziona tipologia competizione" },
                                                                                ...(exp.country && exp.categoryTier && exp.competitionType ? (
                                                                                    exp.competitionType === "female" ? (
                                                                                        exp.country === "Italia"
                                                                                            ? (footballFemaleCategoriesByTierItaly[exp.categoryTier] || []).map(cat => ({ value: cat, label: cat }))
                                                                                            : (footballFemaleCategoriesByTierDefault[exp.categoryTier] || []).map(cat => ({ value: cat, label: cat }))
                                                                                    ) : (
                                                                                        exp.country === "Italia"
                                                                                            ? (footballCategoriesByTierItaly[exp.categoryTier] || []).map(cat => ({ value: cat, label: cat }))
                                                                                            : (footballCategoriesByTierDefault[exp.categoryTier] || []).map(cat => ({ value: cat, label: cat }))
                                                                                    )
                                                                                ) : [])
                                                                            ]}
                                                                            className={inputBase}
                                                                            disabled={!exp.country || !exp.categoryTier || !exp.competitionType}
                                                                        />
                                                                    )}
                                                                </>
                                                            ) : !isCoach && isPlayer && (mainSport === "Basket" || mainSport === "Pallavolo") ? (
                                                                <>
                                                                    {/* Nazione */}
                                                                    <CustomSelect
                                                                        value={exp.country}
                                                                        onChange={(value) => {
                                                                            handleExperienceChange(exp.id, "country", value)
                                                                            handleExperienceChange(exp.id, "categoryTier", "")
                                                                            handleExperienceChange(exp.id, "competitionType", "")
                                                                            handleExperienceChange(exp.id, "category", "")
                                                                        }}
                                                                        options={[
                                                                            { value: "", label: "Seleziona nazione" },
                                                                            ...(mainSport === "Basket" ? basketCountries : volleyCountries).map(country => ({ value: country, label: country }))
                                                                        ]}
                                                                        className={inputBase}
                                                                    />

                                                                    {/* Macro categoria (Italia per Basket e Pallavolo) */}
                                                                    {(mainSport === "Basket" || mainSport === "Pallavolo") && exp.country === "Italia" && (
                                                                        <CustomSelect
                                                                            value={exp.categoryTier || ""}
                                                                            onChange={(value) => {
                                                                                handleExperienceChange(exp.id, "categoryTier", value)
                                                                                handleExperienceChange(exp.id, "competitionType", "")
                                                                                handleExperienceChange(exp.id, "category", "")
                                                                            }}
                                                                            options={[
                                                                                { value: "", label: exp.country ? "Seleziona macro categoria" : "Prima seleziona una nazione" },
                                                                                ...(mainSport === "Basket" ? basketMacroCategories : volleyMacroCategories).map(tier => ({ value: tier, label: tier }))
                                                                            ]}
                                                                            className={inputBase}
                                                                            disabled={!exp.country}
                                                                        />
                                                                    )}

                                                                    {/* Tipologia Competizione */}
                                                                    <CustomSelect
                                                                        value={exp.competitionType || ""}
                                                                        onChange={(value) => {
                                                                            handleExperienceChange(exp.id, "competitionType", value)
                                                                            handleExperienceChange(exp.id, "category", "")
                                                                        }}
                                                                        options={[
                                                                            { value: "", label: exp.country === "Italia" ? (exp.categoryTier ? "Seleziona tipologia competizione" : "Prima seleziona macro categoria") : (exp.country ? "Seleziona tipologia competizione" : "Prima seleziona una nazione") },
                                                                            ...competitionTypes.map(type => ({ value: type.value, label: type.label }))
                                                                        ]}
                                                                        className={inputBase}
                                                                        disabled={exp.country === "Italia" ? !exp.country || !exp.categoryTier : !exp.country}
                                                                    />

                                                                    {/* Categoria dettagliata */}
                                                                    {exp.country === "Altro" ? (
                                                                        <input
                                                                            value={exp.category}
                                                                            onChange={(e) => handleExperienceChange(exp.id, "category", e.target.value)}
                                                                            placeholder="Categoria"
                                                                            className={inputBase}
                                                                        />
                                                                    ) : (
                                                                        <CustomSelect
                                                                            value={exp.category}
                                                                            onChange={(value) => handleExperienceChange(exp.id, "category", value)}
                                                                            options={[
                                                                                { value: "", label: exp.competitionType ? "Seleziona categoria" : "Prima seleziona tipologia competizione" },
                                                                                ...(mainSport === "Basket" ? (
                                                                                    exp.country && exp.categoryTier && exp.competitionType ? (
                                                                                        exp.competitionType === "female" ? (
                                                                                            exp.country === "Italia"
                                                                                                ? (basketFemaleCategoresByTierItaly[exp.categoryTier] || []).map(cat => ({ value: cat, label: cat }))
                                                                                                : (basketCategoriesByTierDefault[exp.categoryTier] || []).map(cat => ({ value: cat, label: cat }))
                                                                                        ) : (
                                                                                            exp.country === "Italia"
                                                                                                ? (basketMaleCategoresByTierItaly[exp.categoryTier] || []).map(cat => ({ value: cat, label: cat }))
                                                                                                : (basketCategoriesByTierDefault[exp.categoryTier] || []).map(cat => ({ value: cat, label: cat }))
                                                                                        )
                                                                                    ) : []
                                                                                ) : (
                                                                                    // Pallavolo
                                                                                    exp.country === "Italia" ? (
                                                                                        exp.country && exp.categoryTier && exp.competitionType ? (
                                                                                            exp.competitionType === "female" ? (
                                                                                                (volleyFemaleCategoresByTierItaly[exp.categoryTier] || []).map(cat => ({ value: cat, label: cat }))
                                                                                            ) : (
                                                                                                (volleyMaleCategoresByTierItaly[exp.categoryTier] || []).map(cat => ({ value: cat, label: cat }))
                                                                                            )
                                                                                        ) : []
                                                                                    ) : (
                                                                                        exp.country && exp.competitionType ? (
                                                                                            (volleyCategoriesByCountry[exp.country] || []).map(cat => ({ value: cat, label: cat }))
                                                                                        ) : []
                                                                                    )
                                                                                ))
                                                                            ]}
                                                                            className={inputBase}
                                                                            disabled={exp.country === "Italia" ? !exp.country || !exp.categoryTier || !exp.competitionType : !exp.country || !exp.competitionType}
                                                                        />
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
                                                                        className="w-4 h-4 text-brand-600 border-gray-300 rounded focus:ring-brand-500"
                                                                    />
                                                                    <span className="text-sm text-secondary">
                                                                        Specifica periodo esatto (opzionale)
                                                                    </span>
                                                                </label>

                                                                {/* Date opzionali - mostrate solo se checkbox attivo */}
                                                                {showDatesForExp[exp.id] && (
                                                                    <div className="space-y-3 pl-6 border-l-2 border-base-300/70">
                                                                        <div className="grid grid-cols-2 gap-3">
                                                                            <div>
                                                                                <label className="text-xs glass-subtle-text mb-1 block">Data inizio</label>
                                                                                <input
                                                                                    type="date"
                                                                                    value={exp.from || ""}
                                                                                    onChange={(e) => handleExperienceChange(exp.id, "from", e.target.value)}
                                                                                    placeholder="Inizio"
                                                                                    className={inputBase}
                                                                                />
                                                                            </div>
                                                                            <div>
                                                                                <label className="text-xs glass-subtle-text mb-1 block">Data fine</label>
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
                                                                                className="w-4 h-4 text-brand-600 border-gray-300 rounded focus:ring-brand-500"
                                                                            />
                                                                            <span className="text-sm text-secondary">
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

                                                            {isPlayer && mainSport === "Calcio" && (
                                                                <div className="mt-3 md:col-span-2 w-full">
                                                                    <p className="text-sm text-secondary mb-2">Statistiche (opzionali)</p>
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
                                                                    <p className="text-sm text-secondary mb-2">Statistiche (opzionali)</p>
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
                                                                    <p className="text-sm text-secondary mb-2">Statistiche (opzionali)</p>
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
                                                                    <p className="text-sm text-secondary mb-2">Statistiche (opzionali)</p>
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
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )
                            })}
                        </div>
                    </section>

                    <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
                        <button
                            onClick={() => router.back()}
                            className="w-full sm:w-auto rounded-xl border border-base-300 bg-base-100 px-4 py-3 text-sm text-secondary hover:bg-base-200"
                        >
                            Annulla
                        </button>
                        <button
                            onClick={handleSave}
                            disabled={saving}
                            className="w-full sm:w-auto rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-white hover:bg-primary-hover disabled:opacity-60"
                        >
                            {saving ? "Salvataggio..." : "Salva modifiche"}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}
