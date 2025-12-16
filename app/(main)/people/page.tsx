"use client"
import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { UserCircleIcon, MagnifyingGlassIcon, MapPinIcon } from '@heroicons/react/24/outline'
import Avatar from '@/components/avatar'
import FollowButton from '@/components/follow-button'
import { SUPPORTED_SPORTS, PROFESSIONAL_ROLES } from '@/lib/types'
// Opzioni ruolo specifico e dominanza
const footballPrimaryOptions = [
    { value: "Portiere", label: "Portiere" },
    { value: "Difensore", label: "Difensore" },
    { value: "Centrocampista", label: "Centrocampista" },
    { value: "Attaccante", label: "Attaccante" },
];
const basketRoles = ["Playmaker", "Guardia", "Ala piccola", "Ala grande", "Centro"];
const volleyRoles = ["Palleggiatore", "Schiacciatore", "Centrale", "Opposto", "Libero"];
const handOptions = [
    { value: "destra", label: "Destra" },
    { value: "sinistra", label: "Sinistra" },
    { value: "ambidestra", label: "Ambidestra" },
];

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

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="max-w-4xl mx-auto py-6 px-4">
                {/* Filtri avanzati: visibili SOLO se mainSport !== '' e (selectedRole === 'Player' || selectedRole === 'all') */}
                {mainSport !== '' && (selectedRole === 'Player' || selectedRole === 'all') && (
                    <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Ruolo specifico */}
                        <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">Ruolo specifico</label>
                            {mainSport === 'Calcio' ? (
                                <select
                                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                                    value={selectedSpecificRole}
                                    onChange={e => setSelectedSpecificRole(e.target.value)}
                                >
                                    <option value="">Tutti i ruoli</option>
                                    {footballPrimaryOptions.map(opt => (
                                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                                    ))}
                                </select>
                            ) : mainSport === 'Basket' ? (
                                <select
                                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                                    value={selectedSpecificRole}
                                    onChange={e => setSelectedSpecificRole(e.target.value)}
                                >
                                    <option value="">Tutti i ruoli</option>
                                    {basketRoles.map(opt => (
                                        <option key={opt} value={opt}>{opt}</option>
                                    ))}
                                </select>
                            ) : mainSport === 'Pallavolo' ? (
                                <select
                                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                                    value={selectedSpecificRole}
                                    onChange={e => setSelectedSpecificRole(e.target.value)}
                                >
                                    <option value="">Tutti i ruoli</option>
                                    {volleyRoles.map(opt => (
                                        <option key={opt} value={opt}>{opt}</option>
                                    ))}
                                </select>
                            ) : null}
                        </div>
                        {/* Dominanza */}
                        <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">{mainSport === 'Calcio' ? 'Piede dominante' : (mainSport === 'Basket' || mainSport === 'Pallavolo') ? 'Mano dominante' : 'Dominanza'}</label>
                            {mainSport === 'Calcio' ? (
                                <select
                                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                                    value={selectedDominant}
                                    onChange={e => setSelectedDominant(e.target.value)}
                                >
                                    <option value="">Qualsiasi piede</option>
                                    <option value="destro">Destro</option>
                                    <option value="sinistro">Sinistro</option>
                                    <option value="ambidestro">Ambidestro</option>
                                </select>
                            ) : (mainSport === 'Basket' || mainSport === 'Pallavolo') ? (
                                <select
                                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                                    value={selectedDominant}
                                    onChange={e => setSelectedDominant(e.target.value)}
                                >
                                    <option value="">Qualsiasi mano</option>
                                    {handOptions.map(opt => (
                                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                                    ))}
                                </select>
                            ) : null}
                        </div>
                    </div>
                )}

                {/* Lista utenti filtrati */}
                <div className="mt-6 space-y-4">
                    {filteredUsers.map(user => (
                        <div key={user.id} className="bg-white rounded-lg shadow-sm hover:shadow-md transition p-6">
                            <div className="flex items-start gap-4">
                                {/* Avatar */}
                                <div
                                    className="cursor-pointer"
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

                                {/* User info */}
                                <div className="flex-1 min-w-0">
                                    <h3
                                        className="font-semibold text-lg text-gray-900 cursor-pointer hover:text-sprinta-blue"
                                        onClick={() => router.push(`/profile/${user.id}`)}
                                    >
                                        {user.firstName} {user.lastName}
                                    </h3>
                                    {user.username && (
                                        <p className="text-sm text-gray-500">@{user.username}</p>
                                    )}

                                    {/* Sport & Role */}
                                    <div className="flex items-center gap-2 mt-1">
                                        {user.professionalRole && (
                                            <span className="text-sprinta-blue font-medium text-sm">{user.professionalRole}</span>
                                        )}
                                        {user.professionalRole && user.sport && <span className="text-gray-400">•</span>}
                                        {user.sport && (
                                            <span className="text-gray-600 text-sm">{user.sport}</span>
                                        )}
                                    </div>

                                    {/* City & Availability */}
                                    <div className="flex items-center gap-2 mt-1 text-sm text-gray-500">
                                        {user.city && (
                                            <div className="flex items-center">
                                                <MapPinIcon className="h-4 w-4 mr-1" />
                                                {user.city}
                                            </div>
                                        )}
                                        {user.availability && (
                                            <>
                                                {user.city && <span>•</span>}
                                                <span className={`font-medium ${user.availability === 'Disponibile' ? 'text-sprinta-blue' :
                                                    user.availability === 'Valuta proposte' ? 'text-blue-600' :
                                                        'text-gray-500'
                                                    }`}>
                                                    {user.availability}
                                                </span>
                                            </>
                                        )}
                                    </div>

                                    {user.bio && (
                                        <p className="text-gray-600 text-sm mt-2 line-clamp-2">{user.bio}</p>
                                    )}
                                </div>

                                {/* Follow button */}
                                <div className="flex-shrink-0">
                                    <FollowButton targetId={user.id} />
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
