'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Avatar from './avatar'
import SocialLinks from './social-links'
import {
    UserPlusIcon,
    EnvelopeIcon,
    UserMinusIcon,
    CheckIcon,
    PlusCircleIcon
} from '@heroicons/react/24/outline'

interface ProfileSidebarProps {
    user: any
    clubName?: string | null
    verificationsCount?: number
    favoritesCount?: number
    assistatiCount?: number
    agentName?: string | null
    agentId?: string | number | null
    isOwn?: boolean
    onApply?: () => void
    onAddPlayer?: () => void
}

export default function ProfileSidebar({
    user,
    clubName,
    verificationsCount = 0,
    favoritesCount = 0,
    assistatiCount = 0,
    agentName = null,
    agentId = null,
    isOwn = false,
    onApply,
    onAddPlayer,
}: ProfileSidebarProps) {
    const router = useRouter()
    const [isSelf, setIsSelf] = useState(isOwn)
    const [isVerified, setIsVerified] = useState(false)
    const [isFavorited, setIsFavorited] = useState(false)
    const [verifyLoading, setVerifyLoading] = useState(false)
    const [favoriteLoading, setFavoriteLoading] = useState(false)
    const [currentUserId, setCurrentUserId] = useState<string | null>(null)

    const role = user?.professionalRole || 'Professionista'
    const isPlayer = role.toLowerCase().includes('player') || role.toLowerCase().includes('giocatore')
    const isCoach = role.toLowerCase().includes('coach') || role.toLowerCase().includes('allenatore')
    const isAgent = role.toLowerCase().includes('agent') || role.toLowerCase().includes('agente')
    const isDS = role.toLowerCase().includes('director') || role.toLowerCase().includes('ds')

    type StatItem = {
        label: string
        value: string | number
        link?: string
    }

    // Determina statistiche in base al ruolo
    const getStats = () => {
        if (isPlayer) {
            const foot = user?.preferredFoot || user?.dominantFoot
            const footLabel = foot === 'destro' ? 'Destro' : foot === 'sinistro' ? 'Sinistro' : foot === 'ambidestro' ? 'Ambidestro' : undefined
            return [
                { label: 'Data di nascita', value: getBirthDateAndAge(user?.birthDate) },
                { label: 'Nazionalità', value: user?.nationality || 'Non specificato' },
                { label: 'Altezza', value: user?.height ? `${user.height} cm` : 'Non specificato' },
                { label: 'Peso', value: user?.weight ? `${user.weight} kg` : 'Non specificato' },
                { label: 'Piede', value: footLabel || 'Non specificato' },
                ...(agentName ? [{ label: 'Procuratore', value: agentName, link: agentId ? `/profile/${agentId}` : undefined }] : [])
            ] as StatItem[]
        }
        if (isCoach) {
            const licenses = Array.isArray(user?.uefaLicenses) ? user.uefaLicenses.filter(Boolean) : []
            const licenseLabel = licenses.length > 0 ? licenses.join(', ') : 'Non specificato'
            return [
                { label: 'Data di nascita', value: getBirthDateAndAge(user?.birthDate) },
                { label: 'Nazionalità', value: user?.nationality || 'Non specificato' },
                { label: 'Licenza', value: licenseLabel }
            ] as StatItem[]
        }
        if (isDS) {
            return [
                { label: 'Data di nascita', value: getBirthDateAndAge(user?.birthDate) },
                { label: 'Nazionalità', value: user?.nationality || 'Non specificato' },
                { label: 'Club gestito', value: clubName || 'Nessuno' }
            ] as StatItem[]
        }
        if (isAgent) {
            const hasFifa = !!user?.hasFifaLicense
            const fifaNumber = user?.fifaLicenseNumber
            const stats = [
                { label: 'Data di nascita', value: getBirthDateAndAge(user?.birthDate) },
                { label: 'Nazionalità', value: user?.nationality || 'Non specificato' },
                { label: 'Assistiti', value: assistatiCount || 0 },
                { label: 'Licenza FIFA', value: hasFifa ? 'Sì' : 'No' },
            ]
            if (hasFifa && fifaNumber) {
                stats.push({ label: 'Numero licenza', value: fifaNumber })
            }
            return stats as StatItem[]
        }
        return []
    }

    useEffect(() => {
        const checkUserStatus = async () => {
            if (typeof window === 'undefined') return
            const storedUserId = localStorage.getItem('currentUserId')
            setCurrentUserId(storedUserId)

            if (!storedUserId || !user?.id) return

            // Check se è il proprio profilo
            if (String(storedUserId) === String(user.id)) {
                setIsSelf(true)
                return
            }

            // Check se ha già verificato questo utente
            try {
                const resVerify = await fetch(`/api/verifications?verifierId=${storedUserId}`)
                if (resVerify.ok) {
                    const data = await res.json()
                    const exists = (data || []).find((v: any) => String(v.verifiedId) === String(user.id))
                    setIsVerified(Boolean(exists))
                }
            } catch (e) {
                console.error('Error fetching verification status', e)
            }

            // Check se l'ha già aggiunto ai preferiti
            try {
                const resFav = await fetch(`/api/favorites?userId=${storedUserId}`)
                if (resFav.ok) {
                    const data = await resFav.json()
                    const exists = (data || []).find((f: any) => String(f.favoriteId) === String(user.id))
                    setIsFavorited(Boolean(exists))
                }
            } catch (e) {
                console.error('Error fetching favorites status', e)
            }
        }
        checkUserStatus()
    }, [user?.id])

    // Funzione per verificare il profilo
    const handleVerify = async () => {
        if (verifyLoading || !currentUserId || !user?.id) return
        setVerifyLoading(true)
        try {
            const res = await fetch('/api/verifications', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ verifierId: currentUserId, verifiedId: user.id })
            })
            if (res.ok) {
                setIsVerified(true)
            }
        } catch (e) {
            console.error('Error verifying user', e)
        } finally {
            setVerifyLoading(false)
        }
    }

    // Funzione per rimuovere la verifica
    const handleUnverify = async () => {
        if (verifyLoading || !currentUserId || !user?.id) return
        setVerifyLoading(true)
        try {
            const res = await fetch(`/api/verifications?verifierId=${currentUserId}&verifiedId=${user.id}`, {
                method: 'DELETE'
            })
            if (res.ok) {
                setIsVerified(false)
            }
        } catch (e) {
            console.error('Error removing verification', e)
        } finally {
            setVerifyLoading(false)
        }
    }

    // Funzione per aggiungere ai preferiti
    const handleAddFavorite = async () => {
        if (favoriteLoading || !currentUserId || !user?.id) return
        setFavoriteLoading(true)
        try {
            const res = await fetch('/api/favorites', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: currentUserId, favoriteId: user.id })
            })
            if (res.ok) {
                setIsFavorited(true)
            }
        } catch (e) {
            console.error('Error adding to favorites', e)
        } finally {
            setFavoriteLoading(false)
        }
    }

    // Funzione per rimuovere dai preferiti
    const handleRemoveFavorite = async () => {
        if (favoriteLoading || !currentUserId || !user?.id) return
        setFavoriteLoading(true)
        try {
            const res = await fetch(`/api/favorites?userId=${currentUserId}&favoriteId=${user.id}`, {
                method: 'DELETE'
            })
            if (res.ok) {
                setIsFavorited(false)
            }
        } catch (e) {
            console.error('Error removing from favorites', e)
        } finally {
            setFavoriteLoading(false)
        }
    }

    // Funzione per contattare l'utente (apre la chat)
    const handleMessage = () => {
        if (!user?.id) return
        router.push(`/messages/${user.id}`)
    }

    const calculateAge = (birthDate: string) => {
        const today = new Date()
        const birth = new Date(birthDate)
        let age = today.getFullYear() - birth.getFullYear()
        const m = today.getMonth() - birth.getMonth()
        if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
            age--
        }
        return age
    }

    const formatBirthDate = (birthDate: string) => {
        const date = new Date(birthDate)
        const day = String(date.getDate()).padStart(2, '0')
        const month = String(date.getMonth() + 1).padStart(2, '0')
        const year = date.getFullYear()
        return `${day}/${month}/${year}`
    }

    const getBirthDateAndAge = (birthDate?: string) => {
        if (!birthDate) return 'Non specificato'
        const age = calculateAge(birthDate)
        const formatted = formatBirthDate(birthDate)
        return `${formatted} (${age} anni)`
    }

    const getContractStatus = (status?: string, endDate?: string) => {
        if (!status) return 'Non specificato'
        if (status === 'svincolato') return 'Svincolato'
        if (status === 'sotto contratto' && endDate) {
            const date = new Date(endDate)
            const day = String(date.getDate()).padStart(2, '0')
            const month = String(date.getMonth() + 1).padStart(2, '0')
            const year = date.getFullYear()
            return `Sotto contratto fino al ${day}/${month}/${year}`
        }
        return 'Sotto contratto'
    }

    const getContractStatusColors = (status?: string, endDate?: string) => {
        if (status === 'svincolato') {
            // Verde - disponibile
            return {
                bg: 'bg-green-50',
                border: 'border-green-200',
                text: 'text-green-700'
            }
        }
        if (status === 'sotto contratto' && endDate) {
            const today = new Date()
            const contractEnd = new Date(endDate)
            const sixMonthsFromNow = new Date()
            sixMonthsFromNow.setMonth(today.getMonth() + 6)

            if (contractEnd < sixMonthsFromNow) {
                // Arancione - scade tra meno di 6 mesi
                return {
                    bg: 'bg-orange-50',
                    border: 'border-orange-200',
                    text: 'text-orange-700'
                }
            } else {
                // Rosso - contratto lungo (più di 6 mesi)
                return {
                    bg: 'bg-red-50',
                    border: 'border-red-200',
                    text: 'text-red-700'
                }
            }
        }
        // Default (rosso se sotto contratto senza data)
        return {
            bg: 'bg-red-50',
            border: 'border-red-200',
            text: 'text-red-700'
        }
    }

    const stats = getStats()

    return (
        <div className="bg-white rounded-2xl shadow-lg p-6 sticky top-6 border border-gray-200">
            {/* Avatar e Nome */}
            <div className="flex flex-col items-center text-center mb-6">
                <Avatar
                    src={user?.avatarUrl}
                    alt={`${user?.firstName} ${user?.lastName}`}
                    fallbackText={user?.firstName?.[0] || 'U'}
                    className="w-24 h-24 mb-4 ring-4 ring-[#2341F0]/20"
                />
                <h1 className="text-2xl font-bold text-gray-900 uppercase tracking-wide mb-1">
                    {user?.firstName} {user?.lastName}
                </h1>
                <p className="text-[#2341F0] font-semibold text-lg mb-2">
                    {user?.currentRole || role}
                </p>
                {clubName && (
                    <p className="text-gray-600 text-sm">
                        {clubName}
                    </p>
                )}
            </div>

            {/* Stato disponibilità o contrattuale */}
            {(isPlayer || isCoach || isDS) ? (
                // Per Player, Coach, DS: mostra stato contrattuale
                user?.contractStatus && (() => {
                    const colors = getContractStatusColors(user.contractStatus, user.contractEndDate)
                    return (
                        <div className={`mb-6 px-4 py-2 ${colors.bg} rounded-lg border ${colors.border} text-center`}>
                            <span className={`text-sm ${colors.text} font-semibold`}>
                                {getContractStatus(user.contractStatus, user.contractEndDate)}
                            </span>
                        </div>
                    )
                })()
            ) : (
                // Per altri ruoli: mostra disponibilità
                user?.availability && (
                    <div className="mb-6 px-4 py-2 bg-[#eaf2ff] rounded-lg border border-[#2341F0]/30 text-center">
                        <span className="text-sm text-[#2341F0] font-semibold">
                            {user.availability === 'Disponibile' && '✓ '}
                            {user.availability}
                        </span>
                    </div>
                )
            )}

            {/* Social Links Icons */}
            {user?.socialLinks && Object.values(user.socialLinks).some(link => link?.trim()) && (
                <div className="mb-6 flex justify-center">
                    <SocialLinks
                        socialLinks={user.socialLinks}
                        className="gap-3"
                        showLabels={false}
                    />
                </div>
            )}

            {/* Statistiche */}
            {stats.length > 0 && (
                <div className="mb-6 space-y-3">
                    <h3 className="text-sm font-semibold text-gray-600 uppercase tracking-wider mb-3">
                        Informazioni
                    </h3>
                    {stats.map((stat, idx) => (
                        <div key={idx} className="flex justify-between items-center p-2 bg-gray-50 rounded-lg">
                            <span className="text-gray-600 text-sm font-medium">{stat.label}</span>
                            {stat.link ? (
                                <button
                                    type="button"
                                    onClick={() => router.push(stat.link!)}
                                    className="text-[#2341F0] font-bold text-lg hover:underline"
                                >
                                    {stat.value}
                                </button>
                            ) : (
                                <span className="text-gray-900 font-bold text-lg">{stat.value}</span>
                            )}
                        </div>
                    ))}
                </div>
            )}

            {/* Verifications/Favorites */}
            <div className="mb-6 grid grid-cols-2 gap-3">
                <div className="bg-[#eaf2ff] rounded-lg p-3 text-center border border-[#2341F0]/30">
                    <div className="text-2xl font-bold text-[#2341F0]">{verificationsCount}</div>
                    <div className="text-xs text-[#2341F0] uppercase">Verificati</div>
                </div>
                <div className="bg-[#eaf2ff] rounded-lg p-3 text-center border border-[#2341F0]/30">
                    <div className="text-2xl font-bold text-[#2341F0]">{favoritesCount}</div>
                    <div className="text-xs text-[#2341F0] uppercase">Preferiti</div>
                </div>
            </div>

            {/* Azioni */}
            {!isSelf && (
                <div className="space-y-3">
                    {/* Verifica profilo */}
                    {isVerified ? (
                        <button
                            onClick={handleUnverify}
                            disabled={verifyLoading}
                            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-green-100 text-green-700 rounded-lg font-semibold hover:bg-green-200 transition border border-green-300 disabled:opacity-50"
                        >
                            <CheckIcon className="w-5 h-5" />
                            {verifyLoading ? 'Caricamento...' : 'Verificato'}
                        </button>
                    ) : (
                        <button
                            onClick={handleVerify}
                            disabled={verifyLoading}
                            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-[#2341F0] text-white rounded-lg font-semibold hover:bg-[#3B52F5] transition shadow-lg disabled:opacity-50"
                        >
                            <CheckIcon className="w-5 h-5" />
                            {verifyLoading ? 'Caricamento...' : 'Verifica profilo'}
                        </button>
                    )}

                    {/* Aggiungi ai preferiti */}
                    {isFavorited ? (
                        <button
                            onClick={handleRemoveFavorite}
                            disabled={favoriteLoading}
                            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-yellow-100 text-yellow-700 rounded-lg font-semibold hover:bg-yellow-200 transition border border-yellow-300 disabled:opacity-50"
                        >
                            <PlusCircleIcon className="w-5 h-5" />
                            {favoriteLoading ? 'Caricamento...' : 'Nei preferiti'}
                        </button>
                    ) : (
                        <button
                            onClick={handleAddFavorite}
                            disabled={favoriteLoading}
                            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gray-100 text-gray-900 rounded-lg font-semibold hover:bg-gray-200 transition border border-gray-300 disabled:opacity-50"
                        >
                            <PlusCircleIcon className="w-5 h-5" />
                            {favoriteLoading ? 'Caricamento...' : 'Aggiungi ai preferiti'}
                        </button>
                    )}

                    {/* Contatta */}
                    <button
                        onClick={handleMessage}
                        className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gray-100 text-gray-900 rounded-lg font-semibold hover:bg-gray-200 transition border border-gray-300"
                    >
                        <EnvelopeIcon className="w-5 h-5" />
                        Contatta
                    </button>

                    {/* Bottoni contestuali */}
                    {isPlayer && onApply && (
                        <button
                            onClick={onApply}
                            className="w-full px-4 py-3 bg-gray-100 text-[#2341F0] rounded-lg font-semibold hover:bg-gray-200 transition border border-[#2341F0]/50"
                        >
                            Candidati
                        </button>
                    )}
                    {isAgent && onAddPlayer && (
                        <button
                            onClick={onAddPlayer}
                            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gray-100 text-[#2341F0] rounded-lg font-semibold hover:bg-gray-200 transition border border-[#2341F0]/50"
                        >
                            <PlusCircleIcon className="w-5 h-5" />
                            Aggiungi assistito
                        </button>
                    )}
                </div>
            )}

            {/* Link modifica profilo se proprio */}
            {isSelf && (
                <a
                    href="/profile/edit"
                    className="w-full block text-center px-4 py-3 bg-[#2341F0] text-white rounded-lg font-semibold hover:bg-[#3B52F5] transition shadow-lg"
                >
                    Modifica profilo
                </a>
            )}
        </div>
    )
}
