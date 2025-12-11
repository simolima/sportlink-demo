"use client"
import React, { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import {
    BuildingOffice2Icon,
    MapPinIcon,
    UserGroupIcon,
    EnvelopeIcon,
    PhoneIcon,
    GlobeAltIcon,
    BriefcaseIcon,
    CheckBadgeIcon,
    ArrowLeftIcon
} from '@heroicons/react/24/outline'
import { type Club, OPPORTUNITY_TYPES, LEVELS, CONTRACT_TYPES, PROFESSIONAL_ROLES, SUPPORTED_SPORTS } from '@/lib/types'

export default function ClubDetailPage() {
    const router = useRouter()
    const params = useParams()
    const clubId = params?.id
    const [activeTab, setActiveTab] = useState<'info' | 'annunci' | 'membri'>('info')
    // Annunci club
    const [announcements, setAnnouncements] = useState<any[]>([])
    const [loadingAnnouncements, setLoadingAnnouncements] = useState(false)
    const [showCreateForm, setShowCreateForm] = useState(false)
    const [creating, setCreating] = useState(false)
    const [form, setForm] = useState<{
        title: string;
        type: string;
        sport: string;
        roleRequired: string;
        position: string;
        description: string;
        location: string;
        city: string;
        country: string;
        salary: string;
        contractType: string;
        level: string;
        requirements: string;
        expiryDate: string;
    }>({
        title: '',
        type: OPPORTUNITY_TYPES[0],
        sport: '',
        roleRequired: '',
        position: '',
        description: '',
        location: '',
        city: '',
        country: '',
        salary: '',
        contractType: '',
        level: '',
        requirements: '',
        expiryDate: ''
    })
    const fetchAnnouncements = async () => {
        setLoadingAnnouncements(true)
        try {
            const res = await fetch(`/api/opportunities?clubId=${clubId}`)
            const data = await res.json()
            setAnnouncements(data)
        } catch (e) {
            setAnnouncements([])
        } finally {
            setLoadingAnnouncements(false)
        }
    }

    useEffect(() => {
        if (typeof window === 'undefined') return
        // sync tab from query param ?tab=
        const tab = new URLSearchParams(window.location.search).get('tab')
        if (tab === 'annunci' || tab === 'membri' || tab === 'info') {
            setActiveTab(tab)
        }
        if (clubId && activeTab === 'annunci') fetchAnnouncements()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [activeTab, clubId])
    const handleCreateAnnouncement = async (e: React.FormEvent) => {
        e.preventDefault()
        setCreating(true)
        try {
            const userId = localStorage.getItem('currentUserId')
            const res = await fetch('/api/opportunities', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...form,
                    clubId,
                    createdBy: userId
                })
            })
            if (res.ok) {
                setShowCreateForm(false)
                setForm({
                    title: '', type: OPPORTUNITY_TYPES[0], sport: '', roleRequired: '', position: '', description: '', location: '', city: '', country: '', salary: '', contractType: '', level: '', requirements: '', expiryDate: ''
                })
                fetchAnnouncements()
            }
        } finally {
            setCreating(false)
        }
    }
    const [club, setClub] = useState<Club | null>(null)
    const [loading, setLoading] = useState(true)
    const [following, setFollowing] = useState(false)
    const [currentUserId, setCurrentUserId] = useState<string | null>(null)
    const [members, setMembers] = useState<any[]>([])
    const [pendingRequests, setPendingRequests] = useState<any[]>([])
    const [sendingRequest, setSendingRequest] = useState(false)
    const [isAdmin, setIsAdmin] = useState(false)
    const [loadingMembers, setLoadingMembers] = useState(false)
    const [loadingRequests, setLoadingRequests] = useState(false)
    const [allUsers, setAllUsers] = useState<any[]>([])
    const [userSearch, setUserSearch] = useState('')
    const [addingMemberId, setAddingMemberId] = useState<string | null>(null)
    const [removingMemberId, setRemovingMemberId] = useState<string | null>(null)

    useEffect(() => {
        if (typeof window === 'undefined') return
        const id = localStorage.getItem('currentUserId')
        setCurrentUserId(id)

        if (!id) {
            router.push('/login')
            return
        }

        if (clubId) {
            fetchClubDetails()
            fetchMembers()
            fetchRequests()
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [clubId])

    // Controlla se l'utente è admin del club
    useEffect(() => {
        if (!currentUserId || !members.length) return
        const admin = members.find(m => m.userId?.toString() === currentUserId && m.role === 'Admin' && m.isActive)
        setIsAdmin(!!admin)
    }, [currentUserId, members])

    useEffect(() => {
        const loadUsers = async () => {
            if (!isAdmin) return
            try {
                const res = await fetch('/api/users')
                if (res.ok) {
                    const data = await res.json()
                    setAllUsers(data)
                }
            } catch (e) {
                // ignore
            }
        }
        loadUsers()
    }, [isAdmin])
    const fetchMembers = async () => {
        setLoadingMembers(true)
        try {
            const res = await fetch(`/api/club-memberships?clubId=${clubId}`)
            const data = await res.json()
            setMembers(data.filter((m: any) => m.isActive))
        } catch (e) {
            setMembers([])
        } finally {
            setLoadingMembers(false)
        }
    }

    const fetchRequests = async () => {
        setLoadingRequests(true)
        try {
            const res = await fetch(`/api/club-join-requests?clubId=${clubId}&status=pending`)
            const data = await res.json()
            setPendingRequests(data)
        } catch (e) {
            setPendingRequests([])
        } finally {
            setLoadingRequests(false)
        }
    }

    const handleAcceptRequest = async (requestId: string) => {
        try {
            const res = await fetch('/api/club-join-requests/accept', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ requestId, respondedBy: currentUserId })
            })
            if (res.ok) {
                // Ottimizza: rimuovi subito la richiesta pending
                setPendingRequests((prev) => prev.filter(r => String(r.id) !== String(requestId)))
                fetchRequests()
                fetchMembers()
            } else {
                const e = await res.json().catch(() => ({}))
                alert(e.error || 'Errore durante accettazione')
            }
        } catch (err) {
            alert('Errore durante accettazione')
        }
    }

    const handleRejectRequest = async (requestId: string) => {
        try {
            const res = await fetch('/api/club-join-requests', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: requestId, status: 'rejected', respondedBy: currentUserId })
            })
            if (res.ok) {
                setPendingRequests((prev) => prev.filter(r => r.id !== requestId))
                fetchRequests()
            } else {
                const e = await res.json().catch(() => ({}))
                alert(e.error || 'Errore durante rifiuto')
            }
        } catch (err) {
            alert('Errore durante rifiuto')
        }
    }

    const handleRemoveMember = async (membershipId: string) => {
        try {
            setRemovingMemberId(membershipId)
            const res = await fetch(`/api/club-memberships?id=${membershipId}`, { method: 'DELETE' })
            if (res.ok) {
                setMembers(prev => prev.filter(m => String(m.id) !== String(membershipId)))
            } else {
                const e = await res.json().catch(() => ({}))
                alert(e.error || 'Errore nella rimozione del membro')
            }
        } catch (err) {
            alert('Errore nella rimozione del membro')
        } finally {
            setRemovingMemberId(null)
        }
    }

    const handleAddMember = async (userId: string) => {
        if (!clubId) return
        try {
            setAddingMemberId(userId)
            const res = await fetch('/api/club-memberships', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ clubId, userId, role: 'Player', position: '', permissions: [] })
            })
            if (res.ok) {
                fetchMembers()
            } else {
                const e = await res.json().catch(() => ({}))
                alert(e.error || 'Errore nell’aggiunta del membro')
            }
        } catch (err) {
            alert('Errore nell’aggiunta del membro')
        } finally {
            setAddingMemberId(null)
        }
    }

    const fetchClubDetails = async () => {
        try {
            const res = await fetch('/api/clubs')
            const clubs = await res.json()
            const foundClub = clubs.find((c: Club) => c.id.toString() === clubId)

            if (foundClub) {
                setClub(foundClub)
            } else {
                console.error('Club non trovato')
            }
        } catch (error) {
            console.error('Errore nel caricamento del club:', error)
        } finally {
            setLoading(false)
        }
    }

    const handleFollow = () => {
        setFollowing(!following)
        // TODO: Implement follow functionality via API
    }

    const handleJoinRequest = async () => {
        if (!currentUserId || !clubId) return
        setSendingRequest(true)
        try {
            await fetch('/api/club-join-requests', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    clubId,
                    userId: currentUserId,
                    requestedRole: 'Player',
                    requestedPosition: '',
                    message: ''
                })
            })
            fetchRequests()
        } finally {
            setSendingRequest(false)
        }
    }

    const handleContact = () => {
        if (club?.email) {
            window.location.href = `mailto:${club.email}`
        }
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sprinta-blue mx-auto"></div>
                    <p className="mt-4 text-gray-600">Caricamento...</p>
                </div>
            </div>
        )
    }

    if (!club) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <BuildingOffice2Icon className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Società non trovata</h3>
                    <button
                        onClick={() => router.push('/clubs')}
                        className="text-sprinta-blue hover:text-sprinta-blue-hover"
                    >
                        Torna alla lista
                    </button>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Back Button */}
            <div className="bg-white border-b border-gray-200">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                    <button
                        onClick={() => router.push('/clubs')}
                        className="flex items-center text-gray-600 hover:text-gray-900"
                    >
                        <ArrowLeftIcon className="h-5 w-5 mr-2" />
                        Torna alle società
                    </button>
                </div>
            </div>

            {/* Cover Image */}
            <div className="h-64 bg-gradient-to-br from-blue-50 to-blue-100 relative">
                {club.coverUrl && (
                    <img
                        src={club.coverUrl}
                        alt={club.name}
                        className="w-full h-full object-cover opacity-70"
                    />
                )}
            </div>

            {/* Main Content */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Logo & Header */}
                <div className="bg-white rounded-lg shadow-sm -mt-20 relative mb-6 p-6">
                    <div className="flex flex-col md:flex-row md:items-end md:justify-between">
                        <div className="flex items-end mb-4 md:mb-0">
                            {/* Logo */}
                            <div className="w-32 h-32 bg-white rounded-full border-4 border-white shadow-lg overflow-hidden -mt-16 mr-6">
                                {club.logoUrl ? (
                                    <img
                                        src={club.logoUrl}
                                        alt={club.name}
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                                        <BuildingOffice2Icon className="h-16 w-16 text-gray-400" />
                                    </div>
                                )}
                            </div>

                            {/* Name & Info */}
                            <div>
                                <div className="flex items-center gap-2 mb-2">
                                    <h1 className="text-3xl font-bold text-gray-900">{club.name}</h1>
                                    {club.verified && (
                                        <CheckBadgeIcon className="h-6 w-6 text-blue-500" />
                                    )}
                                </div>
                                <div className="flex flex-wrap items-center gap-4 text-gray-600">
                                    <div className="flex items-center">
                                        <MapPinIcon className="h-5 w-5 mr-1" />
                                        {club.city}
                                    </div>
                                    {club.sports && club.sports.length > 0 && (
                                        <span className="text-blue-600 font-medium">{club.sports.join(', ')}</span>
                                    )}
                                    {club.founded && (
                                        <span>Fondato nel {club.founded}</span>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex flex-wrap gap-3">
                            {isAdmin && (
                                <button
                                    onClick={() => router.push(`/clubs/${clubId}/applications`)}
                                    className="px-6 py-2 bg-primary text-white rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center gap-2"
                                >
                                    <BriefcaseIcon className="h-5 w-5" />
                                    Candidature
                                </button>
                            )}
                            <button
                                onClick={handleFollow}
                                className={`px-6 py-2 rounded-lg font-medium transition-all ${following
                                    ? 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                    : 'bg-sprinta-blue text-white hover:bg-sprinta-blue-hover'
                                    }`}
                            >
                                {following ? 'Seguito' : 'Segui'}
                            </button>
                            <button
                                onClick={handleContact}
                                className="px-6 py-2 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                            >
                                Contatta
                            </button>
                            <button
                                onClick={handleJoinRequest}
                                disabled={sendingRequest || isAdmin || members.some(m => m.userId?.toString() === currentUserId) || pendingRequests.some(r => r.userId?.toString() === currentUserId && r.status === 'pending')}
                                className={`px-6 py-2 rounded-lg font-medium transition-colors ${members.some(m => m.userId?.toString() === currentUserId)
                                    ? 'bg-success/10 text-success border border-success/20 cursor-default'
                                    : pendingRequests.some(r => r.userId?.toString() === currentUserId && r.status === 'pending')
                                        ? 'bg-yellow-50 text-yellow-700 border border-yellow-200 cursor-default'
                                        : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                                    }`}
                            >
                                {members.some(m => m.userId?.toString() === currentUserId)
                                    ? 'Già in rosa'
                                    : pendingRequests.some(r => r.userId?.toString() === currentUserId && r.status === 'pending')
                                        ? 'Richiesta in attesa'
                                        : sendingRequest
                                            ? 'Invio richiesta...'
                                            : 'Richiedi ingresso in rosa'}
                            </button>
                        </div>
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-2 gap-4 mt-6 pt-6 border-t border-gray-100">
                        <div className="text-center">
                            <UserGroupIcon className="h-6 w-6 text-gray-400 mx-auto mb-1" />
                            <div className="text-2xl font-bold text-gray-900">{club.followersCount || 0}</div>
                            <div className="text-sm text-gray-600">Follower</div>
                        </div>
                        <div className="text-center">
                            <UserGroupIcon className="h-6 w-6 text-gray-400 mx-auto mb-1" />
                            <div className="text-2xl font-bold text-gray-900">{club.membersCount || 0}</div>
                            <div className="text-sm text-gray-600">Membri</div>
                        </div>
                    </div>
                </div>

                {/* Tabs */}
                <div className="border-b border-gray-200 mb-6">
                    <nav className="-mb-px flex gap-8" aria-label="Tabs">
                        <button
                            className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'info' ? 'border-primary text-primary' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
                            onClick={() => setActiveTab('info')}
                        >Info</button>
                        <button
                            className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'annunci' ? 'border-primary text-primary' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
                            onClick={() => setActiveTab('annunci')}
                        >Annunci</button>
                        <button
                            className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'membri' ? 'border-primary text-primary' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
                            onClick={() => setActiveTab('membri')}
                        >Rosa / Membri</button>
                    </nav>
                </div>

                {/* Tab Content */}
                {activeTab === 'info' && (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pb-8">
                        {/* Left Column - Main Info */}
                        <div className="lg:col-span-2 space-y-6">
                            {/* Description */}
                            <div className="bg-white rounded-lg shadow-sm p-6">
                                <h2 className="text-xl font-bold text-gray-900 mb-4">Chi Siamo</h2>
                                <p className="text-gray-700 leading-relaxed">{club.description}</p>
                            </div>
                        </div>
                        {/* Right Column - Contact & Info */}
                        <div className="space-y-6">
                            {/* Contact Info */}
                            <div className="bg-white rounded-lg shadow-sm p-6">
                                <h2 className="text-xl font-bold text-gray-900 mb-4">Contatti</h2>
                                <div className="space-y-3">
                                    {club.email && (
                                        <a
                                            href={`mailto:${club.email}`}
                                            className="flex items-center text-sprinta-text-secondary hover:text-sprinta-primary transition-colors"
                                        >
                                            <EnvelopeIcon className="h-5 w-5 mr-3 text-sprinta-text-secondary" />
                                            {club.email}
                                        </a>
                                    )}
                                    {club.phone && (
                                        <a
                                            href={`tel:${club.phone}`}
                                            className="flex items-center text-sprinta-text-secondary hover:text-sprinta-primary transition-colors"
                                        >
                                            <PhoneIcon className="h-5 w-5 mr-3 text-sprinta-text-secondary" />
                                            {club.phone}
                                        </a>
                                    )}
                                    {club.website && (
                                        <a
                                            href={club.website}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="flex items-center text-sprinta-text-secondary hover:text-sprinta-primary transition-colors"
                                        >
                                            <GlobeAltIcon className="h-5 w-5 mr-3 text-sprinta-text-secondary" />
                                            Sito Web
                                        </a>
                                    )}
                                </div>
                            </div>
                            {/* Social Media */}
                            {club.socialMedia && (
                                <div className="bg-white rounded-lg shadow-sm p-6">
                                    <h2 className="text-xl font-bold text-gray-900 mb-4">Social Media</h2>
                                    <div className="space-y-3">
                                        {club.socialMedia.facebook && (
                                            <a
                                                href={club.socialMedia.facebook}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="block text-gray-700 hover:text-blue-600 transition-colors"
                                            >
                                                Facebook
                                            </a>
                                        )}
                                        {club.socialMedia.instagram && (
                                            <a
                                                href={club.socialMedia.instagram}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="block text-gray-700 hover:text-pink-600 transition-colors"
                                            >
                                                Instagram
                                            </a>
                                        )}
                                        {club.socialMedia.twitter && (
                                            <a
                                                href={club.socialMedia.twitter}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="block text-gray-700 hover:text-blue-400 transition-colors"
                                            >
                                                Twitter
                                            </a>
                                        )}
                                    </div>
                                </div>
                            )}
                            {/* Opportunities CTA */}
                            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg p-6 border border-blue-200">
                                <div className="flex items-center justify-between mb-3">
                                    <BriefcaseIcon className="h-8 w-8 text-blue-600" />
                                </div>
                                <h3 className="font-bold text-gray-900 mb-2">
                                    Opportunità
                                </h3>
                                <p className="text-sm text-gray-600 mb-4">
                                    Scopri le opportunità disponibili con questa società
                                </p>
                                <button
                                    onClick={() => router.push('/opportunities')}
                                    className="w-full px-4 py-2 bg-primary text-white rounded-lg hover:bg-blue-700 transition-colors"
                                >
                                    Vedi Opportunità
                                </button>
                            </div>
                        </div>
                    </div>
                )}
                {activeTab === 'annunci' && (
                    <div className="bg-white rounded-lg shadow-sm p-8 min-h-[200px]">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-xl font-bold text-gray-900">Opportunità</h2>
                            {isAdmin && (
                                <button onClick={() => router.push(`/opportunities/new?clubId=${clubId}`)} className="px-4 py-2 bg-primary text-white rounded hover:bg-blue-700 font-semibold text-sm">
                                    Crea Opportunità
                                </button>
                            )}
                        </div>
                        {loadingAnnouncements ? (
                            <div className="text-gray-500">Caricamento annunci...</div>
                        ) : announcements.length === 0 ? (
                            <div className="text-gray-500">Nessuna opportunità pubblicata dal club.</div>
                        ) : (
                            <ul className="divide-y divide-gray-100">
                                {announcements.map(a => (
                                    <li key={a.id} className="py-4">
                                        <div className="flex items-center gap-4">
                                            <BriefcaseIcon className="h-7 w-7 text-primary" />
                                            <div className="flex-1">
                                                <div className="font-semibold text-gray-900 text-lg">{a.title}</div>
                                                <div className="text-xs text-gray-500 mb-1">{a.type} • {a.sport} • {a.roleRequired}</div>
                                                <div className="text-sm text-gray-700 line-clamp-2">{a.description}</div>
                                                <div className="text-xs text-gray-400 mt-1">Scadenza: {a.expiryDate}</div>
                                            </div>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                )}
                {activeTab === 'membri' && (
                    <div className="bg-white rounded-lg shadow-sm p-8 min-h-[200px]">
                        <h2 className="text-xl font-bold text-gray-900 mb-4">Rosa / Membri</h2>
                        {isAdmin && (
                            <div className="mb-6 p-4 border border-yellow-200 bg-yellow-50 rounded-lg">
                                <div className="flex items-center justify-between mb-3">
                                    <div>
                                        <p className="text-sm font-semibold text-gray-800">Richieste di ingresso</p>
                                        <p className="text-xs text-gray-600">Approva o rifiuta le richieste dei giocatori.</p>
                                    </div>
                                    {loadingRequests && <span className="text-xs text-gray-500">Caricamento...</span>}
                                </div>
                                {(!pendingRequests || pendingRequests.length === 0) && !loadingRequests && (
                                    <p className="text-sm text-gray-600">Nessuna richiesta in attesa.</p>
                                )}
                                <div className="space-y-3">
                                    {pendingRequests && pendingRequests.map((r: any) => (
                                        <div key={r.id} className="flex items-center gap-3 p-3 bg-white rounded border border-gray-200">
                                            <img src={r.user?.avatarUrl || '/logo.svg'} alt={r.user?.firstName} className="w-10 h-10 rounded-full object-cover bg-primary/10" />
                                            <div className="flex-1">
                                                <div className="font-semibold text-gray-900 text-sm">{r.user?.firstName} {r.user?.lastName}</div>
                                                <div className="text-xs text-gray-600">Ruolo richiesto: {r.requestedRole}{r.requestedPosition ? ` • ${r.requestedPosition}` : ''}</div>
                                                {r.message && <div className="text-xs text-gray-500 line-clamp-2">{r.message}</div>}
                                            </div>
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => handleAcceptRequest(r.id)}
                                                    className="px-3 py-1.5 bg-primary text-white text-xs font-semibold rounded hover:bg-blue-700"
                                                >
                                                    Accetta
                                                </button>
                                                <button
                                                    onClick={() => handleRejectRequest(r.id)}
                                                    className="px-3 py-1.5 border border-gray-300 text-xs font-semibold rounded hover:bg-gray-50"
                                                >
                                                    Rifiuta
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                        {loadingMembers ? (
                            <div className="text-gray-500">Caricamento membri...</div>
                        ) : (
                            <ul className="divide-y divide-gray-100 mb-6">
                                {members.map((m) => {
                                    const canRemove = isAdmin || currentUserId === m.userId?.toString()
                                    return (
                                        <li key={m.id} className="flex items-center gap-4 py-3">
                                            <img src={m.user?.avatarUrl || '/logo.svg'} alt={m.user?.firstName} className="w-10 h-10 rounded-full object-cover bg-primary/5" />
                                            <div className="flex-1">
                                                <div className="font-semibold text-gray-900">{m.user?.firstName} {m.user?.lastName}</div>
                                                <div className="text-xs text-gray-500">{m.role}{m.position ? ` • ${m.position}` : ''}</div>
                                            </div>
                                            <span className={`text-xs px-2 py-1 rounded ${m.role === 'Admin' ? 'bg-success/20 text-success font-bold' : 'bg-gray-100 text-gray-600'}`}>{m.role}</span>
                                            {canRemove && m.role !== 'Admin' && (
                                                <button
                                                    onClick={() => handleRemoveMember(m.id)}
                                                    disabled={removingMemberId === String(m.id)}
                                                    className="px-3 py-1.5 text-xs font-semibold border border-red-200 text-red-700 rounded hover:bg-red-50 disabled:opacity-50"
                                                >
                                                    {removingMemberId === String(m.id) ? 'Rimozione...' : (currentUserId === m.userId?.toString() ? 'Esci' : 'Rimuovi')}
                                                </button>
                                            )}
                                        </li>
                                    )
                                })}
                                {members.length === 0 && <li className="text-gray-500">Nessun membro</li>}
                            </ul>
                        )}

                        {isAdmin && (
                            <>
                                <h3 className="text-lg font-bold text-gray-900 mb-2 mt-8">Richieste di ingresso</h3>
                                {loadingRequests ? (
                                    <div className="text-gray-500">Caricamento richieste...</div>
                                ) : (
                                    <ul className="divide-y divide-gray-100">
                                        {pendingRequests.map((r) => (
                                            <li key={r.id} className="flex items-center gap-4 py-3">
                                                <img src={r.user?.avatarUrl || '/logo.svg'} alt={r.user?.firstName} className="w-10 h-10 rounded-full object-cover bg-primary/10" />
                                                <div className="flex-1">
                                                    <div className="font-semibold text-gray-900">{r.user?.firstName} {r.user?.lastName}</div>
                                                    <div className="text-xs text-gray-500">{r.requestedRole}{r.requestedPosition ? ` • ${r.requestedPosition}` : ''}</div>
                                                    {r.message && <div className="text-xs text-gray-400 mt-1">{r.message}</div>}
                                                </div>
                                                <button onClick={() => handleAcceptRequest(r.id)} className="px-3 py-1 bg-primary text-white rounded hover:bg-blue-700 text-xs font-semibold mr-2">Accetta</button>
                                                <button onClick={() => handleRejectRequest(r.id)} className="px-3 py-1 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 text-xs">Rifiuta</button>
                                            </li>
                                        ))}
                                        {pendingRequests.length === 0 && <li className="text-gray-500">Nessuna richiesta pendente</li>}
                                    </ul>
                                )}

                                <div className="mt-8">
                                    <h3 className="text-lg font-bold text-gray-900 mb-2">Aggiungi un membro</h3>
                                    <p className="text-xs text-gray-600 mb-3">Cerca per nome o email, poi aggiungi alla rosa.</p>
                                    <input
                                        value={userSearch}
                                        onChange={e => setUserSearch(e.target.value)}
                                        placeholder="Cerca atleta o staff"
                                        className="w-full md:w-96 px-3 py-2 border rounded mb-3"
                                    />
                                    <div className="space-y-2 max-h-64 overflow-auto">
                                        {userSearch.length < 2 && <p className="text-sm text-gray-500">Digita almeno 2 caratteri.</p>}
                                        {userSearch.length >= 2 && allUsers
                                            .filter(u => {
                                                const q = userSearch.toLowerCase()
                                                const full = `${u.firstName || ''} ${u.lastName || ''}`.toLowerCase()
                                                const mail = (u.email || '').toLowerCase()
                                                const alreadyMember = members.some(m => String(m.userId) === String(u.id))
                                                return !alreadyMember && (full.includes(q) || mail.includes(q))
                                            })
                                            .slice(0, 10)
                                            .map(u => (
                                                <div key={u.id} className="flex items-center justify-between p-2 border border-gray-100 rounded">
                                                    <div>
                                                        <div className="text-sm font-semibold text-gray-900">{u.firstName} {u.lastName}</div>
                                                        <div className="text-xs text-gray-500">{u.email}</div>
                                                    </div>
                                                    <button
                                                        onClick={() => handleAddMember(u.id)}
                                                        disabled={addingMemberId === String(u.id)}
                                                        className="px-3 py-1.5 bg-primary text-white text-xs font-semibold rounded hover:bg-blue-700 disabled:opacity-50"
                                                    >
                                                        {addingMemberId === String(u.id) ? 'Aggiunta...' : 'Aggiungi'}
                                                    </button>
                                                </div>
                                            ))
                                        }
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                )}
            </div>
        </div>
    )
}
