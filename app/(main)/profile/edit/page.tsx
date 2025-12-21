"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { CameraIcon, PlusIcon, XMarkIcon } from "@heroicons/react/24/outline"
import Avatar from "@/components/avatar"
import { uploadService } from "@/lib/upload-service"

interface Experience {
    id: string
    role: string
    team: string
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
}

const emptyExperience = (): Experience => ({
    id: Date.now().toString(),
    role: "",
    team: "",
    category: "",
    from: "",
    to: "",
    summary: "",
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
                const sport = Array.isArray(user.sports) && user.sports.length > 0 ? user.sports[0] : user.sport || undefined;
                setMainSport(sport);
                // Solo Player può vedere/gestire questi campi
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
                            team: e.team || e.company || "",
                            category: e.category || "",
                            from: e.from || "",
                            to: e.to || "",
                            summary: e.summary || e.description || "",
                            goals: e.goals === '' ? undefined : typeof e.goals === 'number' ? e.goals : Number(e.goals ?? undefined),
                            cleanSheets: e.cleanSheets === '' ? undefined : typeof e.cleanSheets === 'number' ? e.cleanSheets : Number(e.cleanSheets ?? undefined),
                            appearances: e.appearances === '' ? undefined : typeof e.appearances === 'number' ? e.appearances : Number(e.appearances ?? undefined),
                            pointsPerGame: e.pointsPerGame === '' ? undefined : typeof e.pointsPerGame === 'number' ? e.pointsPerGame : Number(e.pointsPerGame ?? undefined),
                            assists: e.assists === '' ? undefined : typeof e.assists === 'number' ? e.assists : Number(e.assists ?? undefined),
                            rebounds: e.rebounds === '' ? undefined : typeof e.rebounds === 'number' ? e.rebounds : Number(e.rebounds ?? undefined),
                            volleyAces: e.volleyAces === '' ? undefined : typeof e.volleyAces === 'number' ? e.volleyAces : Number(e.volleyAces ?? undefined),
                            volleyBlocks: e.volleyBlocks === '' ? undefined : typeof e.volleyBlocks === 'number' ? e.volleyBlocks : Number(e.volleyBlocks ?? undefined),
                            volleyDigs: e.volleyDigs === '' ? undefined : typeof e.volleyDigs === 'number' ? e.volleyDigs : Number(e.volleyDigs ?? undefined),
                        }))
                        : [],
                    availability: user.availability || "Disponibile",
                    dominantFoot: user.professionalRole === "Player" && sport === "Calcio" ? user.dominantFoot ?? undefined : undefined,
                    dominantHand: user.professionalRole === "Player" && (sport === "Basket" || sport === "Pallavolo") ? user.dominantHand ?? undefined : undefined,
                    specificRole: user.professionalRole === "Player" ? user.specificRole ?? undefined : undefined,
                    secondaryRole: user.secondaryRole ?? undefined,
                    footballPrimaryPosition: user.footballPrimaryPosition ?? undefined,
                    footballSecondaryPosition: user.footballSecondaryPosition ?? undefined,
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
    // --- Opzioni ruolo specifico ---
    const basketRoles = [
        "Playmaker",
        "Guardia",
        "Ala piccola",
        "Ala grande",
        "Centro"
    ];
    const volleyRoles = [
        "Palleggiatore",
        "Schiacciatore",
        "Centrale",
        "Opposto",
        "Libero"
    ];

    // ...existing code...
    const updateField = (key: keyof FormState, value: any) => {
        setForm((prev) => ({ ...prev, [key]: value }))
    }

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

                <div className="grid gap-6 lg:grid-cols-[340px_1fr] items-start">
                    {/* Sidebar */}
                    <div className="space-y-6">
                        <div className="rounded-2xl border border-gray-200 bg-white p-6">
                            <div className="relative h-40 w-full overflow-hidden rounded-xl bg-gray-100">
                                {form.coverUrl ? (
                                    <img
                                        src={form.coverUrl}
                                        alt="Cover"
                                        className="h-full w-full object-cover"
                                    />
                                ) : (
                                    <div className="h-full w-full bg-gradient-to-br from-[#2341F0]/20 via-gray-100 to-gray-50" />
                                )}
                                <label className="absolute bottom-3 right-3 inline-flex cursor-pointer items-center gap-2 rounded-full bg-black/50 px-3 py-2 text-xs font-semibold text-white backdrop-blur hover:bg-black/70">
                                    <CameraIcon className="h-4 w-4" />
                                    <span>Modifica cover</span>
                                    <input
                                        type="file"
                                        accept="image/*"
                                        className="hidden"
                                        onChange={(e) => {
                                            const file = e.target.files?.[0]
                                            if (file) handleUpload(file, "covers", "coverUrl")
                                        }}
                                    />
                                </label>
                            </div>

                            <div className="-mt-12 flex items-end gap-3">
                                <div className="relative h-24 w-24 rounded-2xl border-4 border-white bg-gray-100 shadow-lg shadow-black/10">
                                    <Avatar
                                        src={form.avatarUrl}
                                        alt={`${form.firstName} ${form.lastName}`.trim() || "Avatar"}
                                        fallbackText={`${form.firstName?.[0] ?? ""}${form.lastName?.[0] ?? ""}` || "?"}
                                        className="h-full w-full"
                                    />
                                    <label className="absolute bottom-1 right-1 inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-full bg-[#2341F0] text-white shadow-lg hover:bg-[#1f35c2]">
                                        <CameraIcon className="h-4 w-4" />
                                        <input
                                            type="file"
                                            accept="image/*"
                                            className="hidden"
                                            onChange={(e) => {
                                                const file = e.target.files?.[0]
                                                if (file) handleUpload(file, "avatars", "avatarUrl")
                                            }}
                                        />
                                    </label>
                                </div>
                                <div className="flex-1">
                                    <input
                                        value={form.firstName}
                                        onChange={(e) => updateField("firstName", e.target.value)}
                                        placeholder="Nome"
                                        className={`${inputBase} mb-2`}
                                    />
                                    <input
                                        value={form.lastName}
                                        onChange={(e) => updateField("lastName", e.target.value)}
                                        placeholder="Cognome"
                                        className={inputBase}
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="rounded-2xl border border-gray-200 bg-white p-6 space-y-4">
                            {/* Ruolo specifico e dominanza: SOLO Player */}
                            {isPlayer && (
                                <>
                                    {/* Campi specifici per Calcio */}
                                    {mainSport === "Calcio" && (
                                        <>
                                            <div className="mb-4">
                                                <label className="block text-sm font-medium text-gray-700 mb-2">Ruolo (Calcio)</label>
                                                <select
                                                    className="w-full rounded-xl border border-gray-300 bg-gray-50 px-4 py-3 text-sm text-gray-900"
                                                    value={form.footballPrimaryPosition || ''}
                                                    onChange={e => handleFootballPrimaryChange(e.target.value)}
                                                >
                                                    <option value="">Seleziona</option>
                                                    {footballPrimaryOptions.map(opt => (
                                                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                                                    ))}
                                                </select>
                                            </div>

                                            {form.footballPrimaryPosition && (
                                                <div className="mb-4">
                                                    <label className="block text-sm font-medium text-gray-700 mb-2">Dettaglio ruolo</label>
                                                    <select
                                                        className="w-full rounded-xl border border-gray-300 bg-gray-50 px-4 py-3 text-sm text-gray-900"
                                                        value={form.footballSecondaryPosition || ''}
                                                        onChange={e => handleFootballSecondaryChange(e.target.value)}
                                                    >
                                                        <option value="">Seleziona</option>
                                                        {(footballSecondaryOptions[form.footballPrimaryPosition] || []).map(opt => (
                                                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                                                        ))}
                                                    </select>
                                                </div>
                                            )}
                                        </>
                                    )}

                                    {/* Ruolo specifico generico */}
                                    <div className="mb-4">
                                        <label className="block text-sm font-medium text-gray-700 mb-2">{mainSport === "Calcio" ? "Altro ruolo" : "Ruolo specifico"}</label>
                                        {mainSport === "Calcio" ? (
                                            <input
                                                className={inputBase}
                                                value={form.specificRole || ''}
                                                onChange={e => setForm(prev => ({ ...prev, specificRole: e.target.value || undefined }))}
                                                placeholder="Altre informazioni (opzionale)"
                                            />
                                        ) : mainSport === "Basket" ? (
                                            <select
                                                className="w-full rounded-xl border border-gray-300 bg-gray-50 px-4 py-3 text-sm text-gray-900"
                                                value={form.specificRole || ''}
                                                onChange={e => setForm(prev => ({ ...prev, specificRole: e.target.value || undefined }))}
                                            >
                                                <option value="">Seleziona</option>
                                                {basketRoles.map(opt => (
                                                    <option key={opt} value={opt}>{opt}</option>
                                                ))}
                                            </select>
                                        ) : mainSport === "Pallavolo" ? (
                                            <select
                                                className="w-full rounded-xl border border-gray-300 bg-gray-50 px-4 py-3 text-sm text-gray-900"
                                                value={form.specificRole || ''}
                                                onChange={e => setForm(prev => ({ ...prev, specificRole: e.target.value || undefined }))}
                                            >
                                                <option value="">Seleziona</option>
                                                {volleyRoles.map(opt => (
                                                    <option key={opt} value={opt}>{opt}</option>
                                                ))}
                                            </select>
                                        ) : (
                                            <input
                                                className={inputBase}
                                                value={form.specificRole || ''}
                                                onChange={e => setForm(prev => ({ ...prev, specificRole: e.target.value || undefined }))}
                                                placeholder="Ruolo specifico (es. playmaker, centrale...)"
                                            />
                                        )}
                                    </div>

                                    {/* Dominanza: logica condizionale */}
                                    {(mainSport === "Calcio") && (
                                        <div className="mb-4">
                                            <label className="block text-sm font-medium text-gray-700 mb-2">Piede dominante</label>
                                            <select
                                                className="w-full rounded-xl border border-gray-300 bg-gray-50 px-4 py-3 text-sm text-gray-900"
                                                value={form.dominantFoot || ''}
                                                onChange={e => setForm(prev => ({ ...prev, dominantFoot: e.target.value as any || undefined, dominantHand: undefined }))}
                                            >
                                                <option value="">Seleziona</option>
                                                <option value="destro">Destro</option>
                                                <option value="sinistro">Sinistro</option>
                                                <option value="ambidestro">Ambidestro</option>
                                            </select>
                                        </div>
                                    )}
                                    {(mainSport === "Basket" || mainSport === "Pallavolo") && (
                                        <div className="mb-4">
                                            <label className="block text-sm font-medium text-gray-700 mb-2">Mano dominante</label>
                                            <select
                                                className="w-full rounded-xl border border-gray-300 bg-gray-50 px-4 py-3 text-sm text-gray-900"
                                                value={form.dominantHand || ''}
                                                onChange={e => setForm(prev => ({ ...prev, dominantHand: e.target.value as any || undefined, dominantFoot: undefined }))}
                                            >
                                                <option value="">Seleziona</option>
                                                <option value="destra">Destra</option>
                                                <option value="sinistra">Sinistra</option>
                                                <option value="ambidestra">Ambidestra</option>
                                            </select>
                                        </div>
                                    )}
                                </>
                            )}
                            <div>
                                <p className="text-sm text-gray-600">Localita</p>
                                <div className="grid grid-cols-2 gap-3">
                                    <input
                                        value={form.city}
                                        onChange={(e) => updateField("city", e.target.value)}
                                        placeholder="Citta"
                                        className={inputBase}
                                    />
                                    <input
                                        value={form.country}
                                        onChange={(e) => updateField("country", e.target.value)}
                                        placeholder="Nazione"
                                        className={inputBase}
                                    />
                                </div>
                            </div>
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
                                                <input
                                                    value={exp.role}
                                                    onChange={(e) => handleExperienceChange(exp.id, "role", e.target.value)}
                                                    placeholder="Ruolo"
                                                    className={inputBase}
                                                />
                                                <input
                                                    value={exp.team}
                                                    onChange={(e) => handleExperienceChange(exp.id, "team", e.target.value)}
                                                    placeholder="Organizzazione/Club"
                                                    className={inputBase}
                                                />
                                                <input
                                                    value={exp.category}
                                                    onChange={(e) => handleExperienceChange(exp.id, "category", e.target.value)}
                                                    placeholder="Categoria"
                                                    className={inputBase}
                                                />
                                                <div className="grid grid-cols-2 gap-3">
                                                    <input
                                                        value={exp.from}
                                                        onChange={(e) => handleExperienceChange(exp.id, "from", e.target.value)}
                                                        placeholder="Inizio"
                                                        className={inputBase}
                                                    />
                                                    <input
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
        </div>
    )
}
