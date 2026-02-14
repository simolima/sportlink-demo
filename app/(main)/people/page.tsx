"use client"
import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { MagnifyingGlassIcon, MapPinIcon, FunnelIcon, XMarkIcon } from '@heroicons/react/24/outline'
import Avatar from '@/components/avatar'
import FollowButton from '@/components/follow-button'
import { SUPPORTED_SPORTS, PROFESSIONAL_ROLES } from '@/lib/types'

// Sport-specific roles for cascade filtering
const rolesByProfession: Record<string, string[]> = {
    'Calcio': ['Portiere', 'Difensore', 'Centrocampista', 'Attaccante'],
    'Basket': ['Playmaker', 'Guardia', 'Ala piccola', 'Ala grande', 'Centro'],
    'Pallavolo': ['Palleggiatore', 'Schiacciatore', 'Centrale', 'Opposto', 'Libero'],
}

const dominanceOptions: Record<string, Array<{ value: string; label: string }>> = {
    'Calcio': [
        { value: 'destro', label: 'Piede destro' },
        { value: 'sinistro', label: 'Piede sinistro' },
        { value: 'ambidestro', label: 'Ambidestro' },
    ],
    'Basket': [
        { value: 'destra', label: 'Mano destra' },
        { value: 'sinistra', label: 'Mano sinistra' },
        { value: 'ambidestra', label: 'Ambidestra' },
    ],
    'Pallavolo': [
        { value: 'destra', label: 'Mano destra' },
        { value: 'sinistra', label: 'Mano sinistra' },
        { value: 'ambidestra', label: 'Ambidestra' },
    ],
}

const categoryOptions: Record<string, string[]> = {
    'Calcio': ['Professionisti', 'Dilettanti', 'Amatori', 'Settore giovanile professionistico', 'Settore giovanile dilettantistico'],
    'Basket': ['Professionisti', 'Dilettanti', 'Amatori', 'Settore giovanile professionistico', 'Settore giovanile dilettantistico'],
    'Pallavolo': ['Professionisti', 'Dilettanti', 'Amatori', 'Settore giovanile professionistico', 'Settore giovanile dilettantistico'],
}

export default function PeoplePage() {
    const router = useRouter()
    const [users, setUsers] = useState<any[]>([])
    const [filteredUsers, setFilteredUsers] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState('')
    const [selectedSport, setSelectedSport] = useState('all')
    const [selectedRole, setSelectedRole] = useState('all')
    const [selectedAvailability, setSelectedAvailability] = useState('all')
    const [currentUserId, setCurrentUserId] = useState<string | null>(null)
    // Filtri avanzati contestuali
    const [selectedSpecificRole, setSelectedSpecificRole] = useState('')
    const [selectedDominant, setSelectedDominant] = useState('')
    // mainSport è una costante derivata


    // useEffect #1: auth + fetchUsers
    useEffect(() => {
        if (typeof window === 'undefined') return;
        const id = localStorage.getItem('currentUserId');
        if (!id) {
            router.push('/login');
            return;
        }
        setCurrentUserId(id);
        setLoading(true);
        fetch('/api/users')
            .then(res => res.json())
            .then(data => {
                setUsers(Array.isArray(data) ? data : []);
                setFilteredUsers(Array.isArray(data) ? data : []);
            })
            .catch(e => {
                setUsers([]);
                setFilteredUsers([]);
            })
            .finally(() => setLoading(false));
    }, [router]);

    // useEffect #2: reset filtri avanzati quando cambia sport
    useEffect(() => {
        setSelectedSpecificRole('');
        setSelectedDominant('');
    }, [selectedSport]);

    // useEffect #3: reset filtri avanzati quando cambia ruolo e diventa != Player
    useEffect(() => {
        if (selectedRole !== 'Player' && selectedRole !== 'all') {
            setSelectedSpecificRole('');
            setSelectedDominant('');
        }
    }, [selectedRole]);

    // mainSport come costante derivata
    const mainSport = selectedSport !== 'all' ? selectedSport : '';

    // useEffect #4: filtro utenti
    useEffect(() => {
        let result = users;

        // Search filter
        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase();
            result = result.filter(u =>
                `${u.firstName} ${u.lastName}`.toLowerCase().includes(query) ||
                u.email?.toLowerCase().includes(query) ||
                u.currentRole?.toLowerCase().includes(query) ||
                u.username?.toLowerCase().includes(query) ||
                u.bio?.toLowerCase().includes(query)
            );
        }

        // Sport filter (supporta sia u.sport che u.sports)
        if (selectedSport !== 'all') {
            result = result.filter(u => {
                const uSport = u.sport || '';
                const uSports = Array.isArray(u.sports) ? u.sports : [];
                return uSport === selectedSport || uSports.includes(selectedSport);
            });
        }

        // professionalRole filter
        if (selectedRole !== 'all') {
            result = result.filter(u => u.professionalRole === selectedRole);
        }

        // availability filter
        if (selectedAvailability !== 'all') {
            result = result.filter(u => u.availability === selectedAvailability);
        }

        // Filtri avanzati SOLO se mainSport !== '' e (selectedRole === 'Player' || selectedRole === 'all')
        if (
            mainSport !== '' &&
            (selectedRole === 'Player' || selectedRole === 'all')
        ) {
            // Applica SOLO a u.professionalRole === 'Player'
            if (selectedSpecificRole) {
                result = result.filter(u => u.professionalRole === 'Player' && u.specificRole === selectedSpecificRole);
            }
            if (selectedDominant) {
                if (mainSport === 'Calcio') {
                    result = result.filter(u => u.professionalRole === 'Player' && u.dominantFoot === selectedDominant);
                } else if (mainSport === 'Basket' || mainSport === 'Pallavolo') {
                    result = result.filter(u => u.professionalRole === 'Player' && u.dominantHand === selectedDominant);
                }
            }
        }

        setFilteredUsers(result);
    }, [searchQuery, selectedSport, selectedRole, selectedAvailability, users, selectedSpecificRole, selectedDominant, mainSport]);

    // ...existing code...


    if (!currentUserId) return null;

    // Reset advanced filters when sport changes
    const handleSportChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setSelectedSport(e.target.value)
        setSelectedSpecificRole('')
        setSelectedDominant('')
    }

    // Reset advanced filters when role changes
    const handleRoleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setSelectedRole(e.target.value)
        setSelectedSpecificRole('')
        setSelectedDominant('')
    }

    // Reset all filters
    const handleResetFilters = () => {
        setSearchQuery('')
        setSelectedSport('all')
        setSelectedRole('all')
        setSelectedAvailability('all')
        setSelectedSpecificRole('')
        setSelectedDominant('')
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="max-w-6xl mx-auto py-6 px-4">
                {/* Title */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900">Scopri Professionisti</h1>
                    <p className="text-gray-600 mt-1">Trova e connettiti con i migliori talenti dello sport</p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                    {/* Filtri Sidebar */}
                    <aside className="lg:col-span-1">
                        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 sticky top-20">
                            {/* Filter Header */}
                            <div className="flex items-center justify-between mb-6">
                                <div className="flex items-center gap-2">
                                    <FunnelIcon className="w-5 h-5 text-green-600" />
                                    <h2 className="font-bold text-gray-900">Filtra</h2>
                                </div>
                                {(selectedSport !== 'all' || selectedRole !== 'all' || selectedAvailability !== 'all' || searchQuery) && (
                                    <button
                                        onClick={handleResetFilters}
                                        className="text-xs text-green-600 hover:text-green-700 font-medium"
                                    >
                                        Ripristina
                                    </button>
                                )}
                            </div>

                            {/* Search Input */}
                            <div className="mb-6">
                                <label className="block text-sm font-medium text-gray-700 mb-2">Ricerca</label>
                                <div className="relative">
                                    <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                    <input
                                        type="text"
                                        placeholder="Nome, email..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-100 text-sm"
                                    />
                                </div>
                            </div>

                            {/* Sport Filter */}
                            <div className="mb-6">
                                <label className="block text-sm font-medium text-gray-700 mb-2">Sport</label>
                                <select
                                    value={selectedSport}
                                    onChange={handleSportChange}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-100 text-sm bg-white"
                                >
                                    <option value="all">Tutti gli sport</option>
                                    {SUPPORTED_SPORTS.map(sport => (
                                        <option key={sport} value={sport}>{sport}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Professional Role Filter */}
                            <div className="mb-6">
                                <label className="block text-sm font-medium text-gray-700 mb-2">Ruolo Professionale</label>
                                <select
                                    value={selectedRole}
                                    onChange={handleRoleChange}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-100 text-sm bg-white"
                                >
                                    <option value="all">Tutti i ruoli</option>
                                    {PROFESSIONAL_ROLES.map(role => (
                                        <option key={role} value={role}>{role}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Availability Filter */}
                            <div className="mb-6">
                                <label className="block text-sm font-medium text-gray-700 mb-2">Disponibilità</label>
                                <select
                                    value={selectedAvailability}
                                    onChange={(e) => setSelectedAvailability(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-100 text-sm bg-white"
                                >
                                    <option value="all">Qualsiasi</option>
                                    <option value="Disponibile">Disponibile</option>
                                    <option value="Valuta proposte">Valuta proposte</option>
                                    <option value="Non disponibile">Non disponibile</option>
                                </select>
                            </div>

                            {/* Cascading Filters for Players */}
                            {selectedRole === 'Player' && mainSport !== '' && (
                                <>
                                    {/* Specific Role Filter */}
                                    {rolesByProfession[mainSport] && (
                                        <div className="mb-6">
                                            <label className="block text-sm font-medium text-gray-700 mb-2">Ruolo Specifico</label>
                                            <select
                                                value={selectedSpecificRole}
                                                onChange={(e) => setSelectedSpecificRole(e.target.value)}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-100 text-sm bg-white"
                                            >
                                                <option value="">Tutti i ruoli</option>
                                                {rolesByProfession[mainSport].map(role => (
                                                    <option key={role} value={role}>{role}</option>
                                                ))}
                                            </select>
                                        </div>
                                    )}

                                    {/* Dominance Filter */}
                                    {dominanceOptions[mainSport] && (
                                        <div className="mb-6">
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                {mainSport === 'Calcio' ? 'Piede Dominante' : 'Mano Dominante'}
                                            </label>
                                            <select
                                                value={selectedDominant}
                                                onChange={(e) => setSelectedDominant(e.target.value)}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-100 text-sm bg-white"
                                            >
                                                <option value="">Qualsiasi</option>
                                                {dominanceOptions[mainSport].map(opt => (
                                                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                                                ))}
                                            </select>
                                        </div>
                                    )}
                                </>
                            )}

                            {/* Help text */}
                            <div className="text-xs text-gray-500 bg-green-50 border border-green-200 rounded p-3">
                                💡 Seleziona uno sport per visualizzare i filtri specifici
                            </div>
                        </div>
                    </aside>

                    {/* Users List */}
                    <div className="lg:col-span-3">
                        {/* Results count */}
                        <div className="mb-4 text-sm text-gray-600">
                            Risultati: <span className="font-semibold text-gray-900">{filteredUsers.length}</span>
                        </div>

                        {/* Users Grid */}
                        {filteredUsers.length > 0 ? (
                            <div className="space-y-4">
                                {filteredUsers.map(user => (
                                    <div
                                        key={user.id}
                                        className="bg-white rounded-lg shadow-sm hover:shadow-lg transition-all duration-200 border border-gray-100 overflow-hidden"
                                    >
                                        <div className="p-6">
                                            <div className="flex items-start gap-4">
                                                {/* Avatar */}
                                                <div
                                                    className="cursor-pointer flex-shrink-0"
                                                    onClick={() => router.push(`/profile/${user.id}`)}
                                                >
                                                    <Avatar
                                                        src={user.avatarUrl}
                                                        alt={`${user.firstName} ${user.lastName}`}
                                                        size="lg"
                                                        fallbackText={user.firstName?.[0] || 'U'}
                                                        className="w-16 h-16"
                                                    />
                                                </div>

                                                {/* User Info */}
                                                <div className="flex-1 min-w-0">
                                                    {/* Name & Username */}
                                                    <div className="flex items-center gap-2">
                                                        <h3
                                                            className="font-semibold text-lg text-gray-900 cursor-pointer hover:text-green-600 truncate"
                                                            onClick={() => router.push(`/profile/${user.id}`)}
                                                        >
                                                            {user.firstName} {user.lastName}
                                                        </h3>
                                                    </div>
                                                    {user.username && (
                                                        <p className="text-sm text-gray-500">@{user.username}</p>
                                                    )}

                                                    {/* Role & Sport Tags */}
                                                    <div className="flex items-center gap-2 mt-2 flex-wrap">
                                                        {user.professionalRole && (
                                                            <span className="inline-flex items-center gap-1 bg-green-100 text-green-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
                                                                {user.professionalRole}
                                                            </span>
                                                        )}
                                                        {user.sport && (
                                                            <span className="inline-flex items-center gap-1 bg-gray-100 text-gray-700 text-xs font-medium px-2.5 py-0.5 rounded-full">
                                                                {user.sport}
                                                            </span>
                                                        )}
                                                    </div>

                                                    {/* Location & Availability */}
                                                    <div className="flex items-center gap-3 mt-3 text-sm text-gray-600 flex-wrap">
                                                        {user.city && (
                                                            <div className="flex items-center">
                                                                <MapPinIcon className="h-4 w-4 mr-1 text-gray-400" />
                                                                <span>{user.city}</span>
                                                            </div>
                                                        )}
                                                        {user.availability && (
                                                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${user.availability === 'Disponibile'
                                                                ? 'bg-green-50 text-green-700'
                                                                : user.availability === 'Valuta proposte'
                                                                    ? 'bg-amber-50 text-amber-700'
                                                                    : 'bg-gray-100 text-gray-600'
                                                                }`}>
                                                                {user.availability}
                                                            </span>
                                                        )}
                                                    </div>

                                                    {/* Bio */}
                                                    {user.bio && (
                                                        <p className="text-gray-600 text-sm mt-3 line-clamp-2">{user.bio}</p>
                                                    )}
                                                </div>

                                                {/* Follow Button */}
                                                <div className="flex-shrink-0">
                                                    <FollowButton targetId={user.id} />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
                                <MagnifyingGlassIcon className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                                <h3 className="text-lg font-medium text-gray-900">Nessun risultato trovato</h3>
                                <p className="text-gray-600 text-sm mt-1">Prova a modificare i filtri di ricerca</p>
                                <button
                                    onClick={handleResetFilters}
                                    className="mt-4 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition text-sm font-medium"
                                >
                                    Ripristina filtri
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
