'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Avatar from './avatar'
import SocialLinks from './social-links'
import { formatCountryWithFlag } from '@/lib/countries'
import { supabase } from '@/lib/supabase-browser'
import {
    UserPlusIcon,
    EnvelopeIcon,
    UserMinusIcon,
    CheckIcon,
    PlusCircleIcon,
    XMarkIcon,
    ShieldCheckIcon,
    StarIcon,
} from '@heroicons/react/24/outline'

interface ProfileSidebarProps {
    user: any
    clubName?: string | null
    verificationsCount?: number
    favoritesCount?: number
    followersCount?: number
    followingCount?: number
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
    followersCount = 0,
    followingCount = 0,
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
    const [currentUserRole, setCurrentUserRole] = useState<string | null>(null)
    const [requestingAffiliation, setRequestingAffiliation] = useState(false)
    const [affiliationStatus, setAffiliationStatus] = useState<'none' | 'pending' | 'active'>('none')

    // Local counters (so we can update them without page reload)
    const [localVerificationsCount, setLocalVerificationsCount] = useState(verificationsCount)
    const [localFavoritesCount, setLocalFavoritesCount] = useState(favoritesCount)

    // Modal state for verifiers/favorites list
    const [showVerifiersModal, setShowVerifiersModal] = useState(false)
    const [showFavoritesModal, setShowFavoritesModal] = useState(false)
    const [verifierProfiles, setVerifierProfiles] = useState<any[]>([])
    const [favoriteProfiles, setFavoriteProfiles] = useState<any[]>([])
    const [loadingVerifiers, setLoadingVerifiers] = useState(false)
    const [loadingFavorites, setLoadingFavorites] = useState(false)

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
                { label: 'Nazionalità', value: formatCountryWithFlag(user?.country) },
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
                { label: 'Nazionalità', value: formatCountryWithFlag(user?.country) },
                { label: 'Licenza', value: licenseLabel }
            ] as StatItem[]
        }
        if (isDS) {
            return [
                { label: 'Data di nascita', value: getBirthDateAndAge(user?.birthDate) },
                { label: 'Nazionalità', value: formatCountryWithFlag(user?.country) },
                { label: 'Club gestito', value: clubName || 'Nessuno' }
            ] as StatItem[]
        }
        if (isAgent) {
            const hasFifa = !!user?.hasFifaLicense
            const fifaNumber = user?.fifaLicenseNumber
            const stats = [
                { label: 'Data di nascita', value: getBirthDateAndAge(user?.birthDate) },
                { label: 'Nazionalità', value: formatCountryWithFlag(user?.country) },
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
            const storedUserRole = localStorage.getItem('currentUserRole')
            setCurrentUserId(storedUserId)
            setCurrentUserRole(storedUserRole)

            if (!storedUserId || !user?.id) return

            // Check se è il proprio profilo
            if (String(storedUserId) === String(user.id)) {
                setIsSelf(true)
                return
            }

            // Check affiliation status if current user is an agent and viewing a player
            if (storedUserRole === 'agent' && isPlayer) {
                try {
                    const resAff = await fetch(`/api/affiliations?agentId=${storedUserId}&playerId=${user.id}`)
                    if (resAff.ok) {
                        const data = await resAff.json()
                        if (data && data.length > 0) {
                            const affiliation = data[0]
                            setAffiliationStatus(affiliation.status)
                        }
                    }
                } catch (e) {
                    console.error('Error fetching affiliation status', e)
                }
            }

            // Check se ha già verificato questo utente
            try {
                const resVerify = await fetch(`/api/verifications?verifierId=${storedUserId}`)
                if (resVerify.ok) {
                    const data = await resVerify.json()
                    const exists = (data || []).find((v: any) => String(v.verified_id) === String(user.id))
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
                    const exists = (data || []).find((f: any) => String(f.favorite_id) === String(user.id))
                    setIsFavorited(Boolean(exists))
                }
            } catch (e) {
                console.error('Error fetching favorites status', e)
            }
        }
        checkUserStatus()
        // eslint-disable-next-line react-hooks/exhaustive-deps
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
                setLocalVerificationsCount(prev => prev + 1)
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
                setLocalVerificationsCount(prev => Math.max(0, prev - 1))
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
                setLocalFavoritesCount(prev => prev + 1)
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
                setLocalFavoritesCount(prev => Math.max(0, prev - 1))
            }
        } catch (e) {
            console.error('Error removing from favorites', e)
        } finally {
            setFavoriteLoading(false)
        }
    }

    // Fetch verifier profiles for the modal
    const fetchVerifierProfiles = async () => {
        if (!user?.id || loadingVerifiers) return
        setLoadingVerifiers(true)
        try {
            // Get all verifications for this user
            const { data: verifications, error } = await supabase
                .from('verifications')
                .select('verifier_id, created_at')
                .eq('verified_id', user.id)
                .order('created_at', { ascending: false })

            if (error || !verifications?.length) {
                setVerifierProfiles([])
                setLoadingVerifiers(false)
                return
            }

            // Fetch profiles for all verifier IDs
            const verifierIds = verifications.map((v: any) => v.verifier_id)
            const { data: profiles } = await supabase
                .from('profiles')
                .select('id, first_name, last_name, avatar_url, role_id, city, country')
                .in('id', verifierIds)

            setVerifierProfiles(profiles || [])
        } catch (e) {
            console.error('Error fetching verifier profiles', e)
            setVerifierProfiles([])
        } finally {
            setLoadingVerifiers(false)
        }
    }

    // Fetch favorite profiles for the modal
    const fetchFavoriteProfiles = async () => {
        if (!user?.id || loadingFavorites) return
        setLoadingFavorites(true)
        try {
            // Get all users who favorited this profile
            const { data: favorites, error } = await supabase
                .from('favorites')
                .select('user_id, created_at')
                .eq('favorite_id', user.id)
                .order('created_at', { ascending: false })

            if (error || !favorites?.length) {
                setFavoriteProfiles([])
                setLoadingFavorites(false)
                return
            }

            // Fetch profiles for all user IDs who added this user to favorites
            const userIds = favorites.map((f: any) => f.user_id)
            const { data: profiles } = await supabase
                .from('profiles')
                .select('id, first_name, last_name, avatar_url, role_id, city, country')
                .in('id', userIds)

            setFavoriteProfiles(profiles || [])
        } catch (e) {
            console.error('Error fetching favorite profiles', e)
            setFavoriteProfiles([])
        } finally {
            setLoadingFavorites(false)
        }
    }

    // Open verifiers modal
    const handleOpenVerifiers = () => {
        if (verificationsCount === 0) return
        setShowVerifiersModal(true)
        fetchVerifierProfiles()
    }

    // Open favorites modal
    const handleOpenFavorites = () => {
        if (favoritesCount === 0) return
        setShowFavoritesModal(true)
        fetchFavoriteProfiles()
    }

    // Funzione per contattare l'utente (apre la chat)
    const handleMessage = () => {
        if (!user?.id) return
        router.push(`/messages/${user.id}`)
    }

    // Funzione per richiedere affiliazione (Agent -> Player)
    const handleRequestAffiliation = async () => {
        if (requestingAffiliation || !currentUserId || !user?.id) return
        setRequestingAffiliation(true)
        try {
            const res = await fetch('/api/affiliations', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    agentId: currentUserId,
                    playerId: user.id,
                    notes: 'Richiesta di affiliazione dal profilo'
                })
            })
            if (res.ok) {
                setAffiliationStatus('pending')
                // Optional: show success toast
                alert('Richiesta di affiliazione inviata con successo!')
            } else {
                const error = await res.json()
                alert(error.error || 'Errore durante l\'invio della richiesta')
            }
        } catch (e) {
            console.error('Error requesting affiliation', e)
            alert('Errore durante l\'invio della richiesta')
        } finally {
            setRequestingAffiliation(false)
        }
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
                bg: 'bg-brand-50',
                border: 'border-brand-200',
                text: 'text-brand-700'
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
            {user?.socialLinks && Object.values(user.socialLinks).some(link => typeof link === 'string' && link.trim()) && (
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
                <button
                    type="button"
                    onClick={handleOpenVerifiers}
                    disabled={localVerificationsCount === 0}
                    className={`bg-[#eaf2ff] rounded-lg p-3 text-center border border-[#2341F0]/30 transition-all duration-200 ${localVerificationsCount > 0
                        ? 'cursor-pointer hover:bg-[#d9e6ff] hover:border-[#2341F0]/50 hover:shadow-sm active:scale-95'
                        : 'cursor-default'
                        }`}
                >
                    <div className="text-2xl font-bold text-[#2341F0]">{localVerificationsCount}</div>
                    <div className="text-xs text-[#2341F0] uppercase">Verificati</div>
                </button>
                <button
                    type="button"
                    onClick={handleOpenFavorites}
                    disabled={localFavoritesCount === 0}
                    className={`bg-[#eaf2ff] rounded-lg p-3 text-center border border-[#2341F0]/30 transition-all duration-200 ${localFavoritesCount > 0
                        ? 'cursor-pointer hover:bg-[#d9e6ff] hover:border-[#2341F0]/50 hover:shadow-sm active:scale-95'
                        : 'cursor-default'
                        }`}
                >
                    <div className="text-2xl font-bold text-[#2341F0]">{localFavoritesCount}</div>
                    <div className="text-xs text-[#2341F0] uppercase">Preferiti</div>
                </button>
            </div>

            {/* Azioni */}
            {!isSelf && (
                <div className="space-y-3">
                    {/* Verifica profilo */}
                    {isVerified ? (
                        <button
                            onClick={handleUnverify}
                            disabled={verifyLoading}
                            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-red-50 text-red-600 rounded-lg font-semibold hover:bg-red-100 transition border border-red-300 disabled:opacity-50"
                        >
                            <XMarkIcon className="w-5 h-5" />
                            {verifyLoading ? 'Caricamento...' : 'Annulla verifica profilo'}
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
                            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-red-50 text-red-600 rounded-lg font-semibold hover:bg-red-100 transition border border-red-300 disabled:opacity-50"
                        >
                            <XMarkIcon className="w-5 h-5" />
                            {favoriteLoading ? 'Caricamento...' : 'Elimina dai preferiti'}
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

                    {/* Richiesta affiliazione: Agent guarda Player */}
                    {currentUserRole === 'agent' && isPlayer && (
                        <>
                            {affiliationStatus === 'none' && (
                                <button
                                    onClick={handleRequestAffiliation}
                                    disabled={requestingAffiliation}
                                    className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-[#2341F0] text-white rounded-lg font-semibold hover:bg-[#3B52F5] transition shadow-lg disabled:opacity-50"
                                >
                                    <UserPlusIcon className="w-5 h-5" />
                                    {requestingAffiliation ? 'Invio in corso...' : 'Richiedi Affiliazione'}
                                </button>
                            )}
                            {affiliationStatus === 'pending' && (
                                <div className="w-full px-4 py-3 bg-yellow-100 text-yellow-700 rounded-lg font-semibold border border-yellow-300 text-center">
                                    <div className="flex items-center justify-center gap-2">
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                        Richiesta in attesa
                                    </div>
                                </div>
                            )}
                            {affiliationStatus === 'active' && (
                                <div className="w-full px-4 py-3 bg-brand-100 text-brand-700 rounded-lg font-semibold border border-brand-300 text-center">
                                    <div className="flex items-center justify-center gap-2">
                                        <CheckIcon className="w-5 h-5" />
                                        Affiliato
                                    </div>
                                </div>
                            )}
                        </>
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

            {/* ═══════════ Verifiers Modal ═══════════ */}
            {showVerifiersModal && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center p-4"
                    onClick={() => setShowVerifiersModal(false)}
                >
                    <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
                    <div
                        className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[70vh] flex flex-col overflow-hidden"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 bg-gradient-to-r from-[#2341F0]/5 to-transparent flex-shrink-0">
                            <div className="flex items-center gap-2">
                                <ShieldCheckIcon className="w-5 h-5 text-[#2341F0]" />
                                <div>
                                    <h3 className="text-lg font-bold text-gray-900">Verifiche</h3>
                                    <p className="text-xs text-gray-500">{verificationsCount} utent{verificationsCount === 1 ? 'e' : 'i'} ha{verificationsCount === 1 ? '' : 'nno'} verificato questo profilo</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setShowVerifiersModal(false)}
                                className="p-2 rounded-lg hover:bg-gray-100 transition-colors text-gray-400 hover:text-gray-600"
                            >
                                <XMarkIcon className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Content */}
                        <div className="overflow-y-auto flex-1 p-4">
                            {loadingVerifiers ? (
                                <div className="flex items-center justify-center py-8">
                                    <div className="w-8 h-8 border-2 border-[#2341F0]/30 border-t-[#2341F0] rounded-full animate-spin" />
                                </div>
                            ) : verifierProfiles.length === 0 ? (
                                <p className="text-center text-gray-500 py-8 text-sm">Nessuna verifica ancora</p>
                            ) : (
                                <div className="space-y-2">
                                    {verifierProfiles.map((profile) => (
                                        <button
                                            key={profile.id}
                                            type="button"
                                            onClick={() => {
                                                setShowVerifiersModal(false)
                                                router.push(`/profile/${profile.id}`)
                                            }}
                                            className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors text-left group"
                                        >
                                            <Avatar
                                                src={profile.avatar_url}
                                                alt={`${profile.first_name} ${profile.last_name}`}
                                                fallbackText={profile.first_name?.[0] || '?'}
                                                size="md"
                                            />
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-semibold text-gray-900 group-hover:text-[#2341F0] transition-colors truncate">
                                                    {profile.first_name} {profile.last_name}
                                                </p>
                                                <p className="text-xs text-gray-500 truncate">
                                                    {[
                                                        profile.role_id ? profile.role_id.charAt(0).toUpperCase() + profile.role_id.slice(1) : null,
                                                        profile.city,
                                                    ].filter(Boolean).join(' · ') || 'Professionista'}
                                                </p>
                                            </div>
                                            <ShieldCheckIcon className="w-4 h-4 text-[#2341F0] flex-shrink-0 opacity-50" />
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Footer */}
                        <div className="px-5 py-3 border-t border-gray-100 flex-shrink-0 bg-gray-50/50">
                            <button
                                onClick={() => setShowVerifiersModal(false)}
                                className="w-full py-2 text-sm font-semibold text-gray-600 hover:text-gray-900 transition-colors rounded-lg hover:bg-gray-100"
                            >
                                Chiudi
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ═══════════ Favorites Modal ═══════════ */}
            {showFavoritesModal && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center p-4"
                    onClick={() => setShowFavoritesModal(false)}
                >
                    <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
                    <div
                        className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[70vh] flex flex-col overflow-hidden"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 bg-gradient-to-r from-yellow-500/5 to-transparent flex-shrink-0">
                            <div className="flex items-center gap-2">
                                <StarIcon className="w-5 h-5 text-yellow-500" />
                                <div>
                                    <h3 className="text-lg font-bold text-gray-900">Preferiti</h3>
                                    <p className="text-xs text-gray-500">{favoritesCount} utent{favoritesCount === 1 ? 'e' : 'i'} ha{favoritesCount === 1 ? '' : 'nno'} aggiunto ai preferiti</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setShowFavoritesModal(false)}
                                className="p-2 rounded-lg hover:bg-gray-100 transition-colors text-gray-400 hover:text-gray-600"
                            >
                                <XMarkIcon className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Content */}
                        <div className="overflow-y-auto flex-1 p-4">
                            {loadingFavorites ? (
                                <div className="flex items-center justify-center py-8">
                                    <div className="w-8 h-8 border-2 border-yellow-400/30 border-t-yellow-500 rounded-full animate-spin" />
                                </div>
                            ) : favoriteProfiles.length === 0 ? (
                                <p className="text-center text-gray-500 py-8 text-sm">Nessun preferito ancora</p>
                            ) : (
                                <div className="space-y-2">
                                    {favoriteProfiles.map((profile) => (
                                        <button
                                            key={profile.id}
                                            type="button"
                                            onClick={() => {
                                                setShowFavoritesModal(false)
                                                router.push(`/profile/${profile.id}`)
                                            }}
                                            className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors text-left group"
                                        >
                                            <Avatar
                                                src={profile.avatar_url}
                                                alt={`${profile.first_name} ${profile.last_name}`}
                                                fallbackText={profile.first_name?.[0] || '?'}
                                                size="md"
                                            />
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-semibold text-gray-900 group-hover:text-yellow-600 transition-colors truncate">
                                                    {profile.first_name} {profile.last_name}
                                                </p>
                                                <p className="text-xs text-gray-500 truncate">
                                                    {[
                                                        profile.role_id ? profile.role_id.charAt(0).toUpperCase() + profile.role_id.slice(1) : null,
                                                        profile.city,
                                                    ].filter(Boolean).join(' · ') || 'Professionista'}
                                                </p>
                                            </div>
                                            <StarIcon className="w-4 h-4 text-yellow-500 flex-shrink-0 opacity-50" />
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Footer */}
                        <div className="px-5 py-3 border-t border-gray-100 flex-shrink-0 bg-gray-50/50">
                            <button
                                onClick={() => setShowFavoritesModal(false)}
                                className="w-full py-2 text-sm font-semibold text-gray-600 hover:text-gray-900 transition-colors rounded-lg hover:bg-gray-100"
                            >
                                Chiudi
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
