"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { CameraIcon, PlusIcon, XMarkIcon } from "@heroicons/react/24/outline"
import Avatar from "@/components/avatar"
import { uploadService } from "@/lib/upload-service"

interface Experience {
    id: string
    role: string
    primaryPosition?: string
    positionDetail?: string
    team: string
    country: string
    category: string
    from: string
    to: string
    summary: string
    // Statistiche opzionali per sport
    goals?: number
    cleanSheets?: number
    appearances?: number
    pointsPerGame?: number
    assists?: number
    rebounds?: number
    volleyAces?: number
    volleyBlocks?: number
    volleyDigs?: number
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
    role: "",
    primaryPosition: "",
    positionDetail: "",
    team: "",
    country: "",
    category: "",
    from: "",
    to: "",
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
    availability: "Disponibile",
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
    const [isStaff, setIsStaff] = useState(false);

    // --- Sport principale per logica ruolo/dominanza ---
    const [mainSport, setMainSport] = useState<string | undefined>(undefined);
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
                setIsPlayer(user.professionalRole === "Player");
                setIsFootball(Array.isArray(user.sports) && user.sports.includes("Calcio"));
                setIsCoach(user.professionalRole === "Coach");
                setIsAgent(user.professionalRole === "Agent");
                setIsStaff(["Athletic Trainer", "Nutritionist", "Physio/Masseur"].includes(user.professionalRole));
                const sport = Array.isArray(user.sports) && user.sports.length > 0 ? user.sports[0] : user.sport || undefined;
                setMainSport(sport);

                setForm({
                    firstName: user.firstName || "",
                    lastName: user.lastName || "",
                    username: user.username || "",
                    email: user.email || "",
                    birthDate: user.birthDate || "",
                    currentRole: user.currentRole || "",
                    bio: user.bio || "",
                    city: user.city || "",
                    country: user.country || "",
                    avatarUrl: user.avatarUrl || user.avatar || "",
                    coverUrl: user.coverUrl || "",
                    experiences: Array.isArray(user.experiences)
                        ? user.experiences.map((e: any, idx: number) => ({
                            id: `${Date.now()}-${idx}`,
                            role: e.role || e.title || "",
                            primaryPosition: e.primaryPosition || "",
                            positionDetail: e.positionDetail || "",
                            team: e.team || e.company || "",
                            country: e.country || "",
                            category: e.category || "",
                            from: e.from || "",
                            to: e.to || "",
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
                        }))
                        : [],
                    availability: user.availability || "Disponibile",
                    dominantFoot: user.professionalRole === "Player" && sport === "Calcio" ? (user.dominantFoot ?? undefined) : undefined,
                    dominantHand: user.professionalRole === "Player" && (sport === "Basket" || sport === "Pallavolo") ? (user.dominantHand ?? undefined) : undefined,
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

    // Paesi e categorie per sport (semplificati, demo)
    const footballCountries = ["Italia", "Spagna", "Francia", "Germania", "Inghilterra", "Altro"];
    const footballCategoriesByCountry: Record<string, string[]> = {
        Italia: ["Serie A", "Serie B", "Serie C", "Serie D", "Eccellenza", "Promozione", "Prima Categoria", "Giovanili"],
        Spagna: ["La Liga", "Segunda", "Primera RFEF", "Segunda RFEF", "Giovanili"],
        Francia: ["Ligue 1", "Ligue 2", "National", "National 2", "Giovanili"],
        Germania: ["Bundesliga", "2. Bundesliga", "3. Liga", "Regionalliga", "Giovanili"],
        Inghilterra: ["Premier League", "Championship", "League One", "League Two", "National League", "Giovanili"],
    };

    const basketCountries = ["Italia", "Spagna", "Francia", "Germania", "Inghilterra", "Altro"];
    const basketCategoriesByCountry: Record<string, string[]> = {
        Italia: ["Serie A", "Serie A2", "Serie B", "Serie C", "Divisioni Regionali", "Amatori"],
        Spagna: ["Liga ACB", "LEB Oro", "LEB Plata", "Liga EBA", "Regional"],
        Francia: ["LNB Pro A", "LNB Pro B", "Nationale 1", "Nationale 2", "Régionales"],
        Germania: ["BBL", "ProA", "ProB", "Regionalliga", "Oberliga"],
        Inghilterra: ["BBL", "NBL Division 1", "NBL Division 2", "Regional"],
    };

    const volleyCountries = ["Italia", "Spagna", "Francia", "Germania", "Inghilterra", "Altro"];
    const volleyCategoriesByCountry: Record<string, string[]> = {
        Italia: ["SuperLega", "Serie A2", "Serie A3", "Serie B", "Serie C", "Divisioni Regionali"],
        Spagna: ["Superliga", "Superliga 2", "Primera División", "Regional"],
        Francia: ["Ligue A", "Ligue B", "Nationale 1", "Régionales"],
        Germania: ["1. Bundesliga", "2. Bundesliga", "3. Liga", "Regionalliga"],
        Inghilterra: ["Super League", "National League", "Regional"],
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

    const handleExperienceChange = (id: string, key: keyof Experience, value: string | number) => {
        const numericKeys: (keyof Experience)[] = [
            'goals', 'cleanSheets', 'appearances', 'pointsPerGame', 'assists', 'rebounds', 'volleyAces', 'volleyBlocks', 'volleyDigs'
        ]
        const coercedValue = numericKeys.includes(key)
            ? (typeof value === 'number' ? value : value === '' ? undefined : Number(value))
            : value
        setForm((prev) => ({
            ...prev,
            experiences: prev.experiences.map((exp) =>
                exp.id === id ? { ...exp, [key]: coercedValue as any } : exp
            ),
        }))
    }

    const addExperience = () => {
        setForm((prev) => ({ ...prev, experiences: [...prev.experiences, emptyExperience()] }))
    }

    const removeExperience = (id: string) => {
        setForm((prev) => ({
            ...prev,
            experiences: prev.experiences.filter((exp) => exp.id !== id),
        }))
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
        setSaving(true)
        try {
            // Sanificazione payload
            let payload = { ...form, id: userId };
            if (isPlayer) {
                // Player: logica sport dominanza
                if (mainSport === "Calcio") {
                    payload.dominantHand = undefined;
                } else if (mainSport === "Basket" || mainSport === "Pallavolo") {
                    payload.dominantFoot = undefined;
                } else {
                    payload.dominantFoot = undefined;
                    payload.dominantHand = undefined;
                }
            } else {
                // Non Player: azzera tutto
                payload.specificRole = undefined;
                payload.dominantFoot = undefined;
                payload.dominantHand = undefined;
            }

            // Sanificazione campi qualifiche per ruolo
            if (!isCoach) {
                payload.uefaLicenses = undefined;
                payload.coachSpecializations = undefined;
            }
            if (!isAgent) {
                payload.hasFifaLicense = undefined;
                payload.fifaLicenseNumber = undefined;
                payload.agentNotes = undefined;
            }
            if (!isStaff) {
                payload.certifications = undefined;
            }

            const res = await fetch("/api/users", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            })
            if (!res.ok) throw new Error("Save failed")
            const updated = await res.json()
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
                        </div>
                    </section>

                    <section className="rounded-2xl border border-gray-200 bg-white p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs uppercase tracking-[0.2em] text-gray-500">Esperienze</p>
                                <h2 className="text-xl font-semibold mt-1 text-gray-900">Percorso professionale</h2>
                                {/* Sezione Qualifiche Coach */}
                                {isCoach && (
                                    <section className="rounded-2xl border border-gray-200 bg-white p-6">
                                        <div className="mb-6">
                                            <p className="text-xs uppercase tracking-[0.2em] text-gray-500">Qualifiche</p>
                                            <h2 className="text-xl font-semibold mt-1 text-gray-900">Licenze e Specializzazioni</h2>
                                        </div>

                                        <div className="space-y-6">
                                            {/* Licenze UEFA */}
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-3">
                                                    Licenze UEFA e Qualifiche
                                                </label>
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                                    {uefaLicenseOptions.map((license) => (
                                                        <label
                                                            key={license}
                                                            className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition"
                                                        >
                                                            <input
                                                                type="checkbox"
                                                                checked={(form.uefaLicenses || []).includes(license)}
                                                                onChange={() => toggleUefaLicense(license)}
                                                                className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                                                            />
                                                            <span className="text-sm text-gray-700">{license}</span>
                                                        </label>
                                                    ))}
                                                </div>
                                            </div>

                                            {/* Specializzazioni */}
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                                    Specializzazioni
                                                </label>
                                                <textarea
                                                    value={form.coachSpecializations || ""}
                                                    onChange={(e) => updateField("coachSpecializations", e.target.value)}
                                                    rows={3}
                                                    placeholder="Es: Tattica difensiva, Settore giovanile, Preparazione fisica..."
                                                    className="w-full rounded-xl border border-gray-300 bg-gray-50 px-4 py-3 text-sm text-gray-900 resize-none focus:border-green-500 focus:ring-1 focus:ring-green-500"
                                                />
                                            </div>
                                        </div>
                                    </section>
                                )}

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
                                            {isPlayer && mainSport === "Calcio" ? (
                                                <>
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
                                            ) : isPlayer && mainSport === "Pallavolo" ? (
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
                                            ) : (
                                                <input
                                                    value={exp.role}
                                                    onChange={(e) => handleExperienceChange(exp.id, "role", e.target.value)}
                                                    placeholder="Ruolo"
                                                    className={inputBase}
                                                />
                                            )}
                                            <input
                                                value={exp.team}
                                                onChange={(e) => handleExperienceChange(exp.id, "team", e.target.value)}
                                                placeholder="Organizzazione/Club"
                                                className={inputBase}
                                            />
                                            {isPlayer && (mainSport === "Calcio" || mainSport === "Basket" || mainSport === "Pallavolo") ? (
                                                <>
                                                    <select
                                                        value={exp.country}
                                                        onChange={(e) => {
                                                            handleExperienceChange(exp.id, "country", e.target.value)
                                                            // Reset categoria quando cambia nazione
                                                            handleExperienceChange(exp.id, "category", "")
                                                        }}
                                                        className={inputBase}
                                                    >
                                                        <option value="">Seleziona nazione</option>
                                                        {(mainSport === "Calcio" ? footballCountries : mainSport === "Basket" ? basketCountries : volleyCountries).map((country) => (
                                                            <option key={country} value={country}>{country}</option>
                                                        ))}
                                                    </select>
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
                                                            disabled={!exp.country}
                                                        >
                                                            <option value="">{exp.country ? "Seleziona categoria" : "Prima seleziona una nazione"}</option>
                                                            {exp.country && (mainSport === "Calcio" ? footballCategoriesByCountry : mainSport === "Basket" ? basketCategoriesByCountry : volleyCategoriesByCountry)[exp.country]?.map((cat) => (
                                                                <option key={cat} value={cat}>{cat}</option>
                                                            ))}
                                                        </select>
                                                    )}
                                                </>
                                            ) : (
                                                <>
                                                    <input
                                                        value={exp.country}
                                                        onChange={(e) => handleExperienceChange(exp.id, "country", e.target.value)}
                                                        placeholder="Nazione"
                                                        className={inputBase}
                                                    />
                                                    <input
                                                        value={exp.category}
                                                        onChange={(e) => handleExperienceChange(exp.id, "category", e.target.value)}
                                                        placeholder="Categoria"
                                                        className={inputBase}
                                                    />
                                                </>
                                            )}
                                            <div className="grid grid-cols-2 gap-3">
                                                <input
                                                    type="date"
                                                    value={exp.from}
                                                    onChange={(e) => handleExperienceChange(exp.id, "from", e.target.value)}
                                                    placeholder="Inizio"
                                                    className={inputBase}
                                                />
                                                <input
                                                    type="date"
                                                    value={exp.to}
                                                    onChange={(e) => handleExperienceChange(exp.id, "to", e.target.value)}
                                                    placeholder="Fine"
                                                    className={inputBase}
                                                />
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
                                                            <label className="text-xs text-gray-600">Clean sheet</label>
                                                            <input
                                                                type="number"
                                                                min={0}
                                                                value={exp.cleanSheets ?? ''}
                                                                onChange={(e) => handleExperienceChange(exp.id, 'cleanSheets', e.target.value)}
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
