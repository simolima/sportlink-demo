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
}

export default function EditProfilePage() {
    const router = useRouter()
    const [form, setForm] = useState<FormState>(initialForm)
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)

    const userId = useMemo(() => {
        if (typeof window === "undefined") return null
        return localStorage.getItem("currentUserId")
    }, [])

    useEffect(() => {
        if (!userId) return
        const fetchUser = async () => {
            try {
                const res = await fetch("/api/users")
                const users = await res.json()
                const user = (users || []).find((u: any) => String(u.id) === String(userId))
                if (!user) {
                    router.push("/login")
                    return
                }
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
                        }))
                        : [],
                    availability: user.availability || "Disponibile",
                })
            } catch (error) {
                console.error("Failed to load user", error)
            } finally {
                setLoading(false)
            }
        }
        fetchUser()
    }, [router, userId])

    const updateField = (key: keyof FormState, value: string) => {
        setForm((prev) => ({ ...prev, [key]: value }))
    }

    const handleExperienceChange = (id: string, key: keyof Experience, value: string) => {
        setForm((prev) => ({
            ...prev,
            experiences: prev.experiences.map((exp) =>
                exp.id === id ? { ...exp, [key]: value } : exp
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
            const res = await fetch("/api/users", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id: userId, ...form }),
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
                            <div>
                                <p className="text-sm text-gray-600">Ruolo</p>
                                <input
                                    value={form.currentRole}
                                    onChange={(e) => updateField("currentRole", e.target.value)}
                                    placeholder="Es. Procuratore, Attaccante..."
                                    className={inputBase}
                                />
                            </div>
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
