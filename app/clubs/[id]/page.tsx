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
import { type Club } from '@/lib/types'

export default function ClubDetailPage() {
    const router = useRouter()
    const params = useParams()
    const clubId = params?.id
    const [club, setClub] = useState<Club | null>(null)
    const [loading, setLoading] = useState(true)
    const [following, setFollowing] = useState(false)
    const [currentUserId, setCurrentUserId] = useState<string | null>(null)

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
        }
    }, [clubId, router])

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
            <div className="h-64 bg-sprinta-navy relative">
                {club.coverUrl && (
                    <img
                        src={club.coverUrl}
                        alt={club.name}
                        className="w-full h-full object-cover"
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
                            <div className="w-32 h-32 bg-white rounded-lg border-4 border-white shadow-lg overflow-hidden -mt-16 mr-6">
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
                        <div className="flex gap-3">
                            <button
                                onClick={handleFollow}
                                className={`px-6 py-2 rounded-lg font-medium transition-all ${
                                    following
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

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pb-8">
                    {/* Left Column - Main Info */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Description */}
                        <div className="bg-white rounded-lg shadow-sm p-6">
                            <h2 className="text-xl font-bold text-gray-900 mb-4">Chi Siamo</h2>
                            <p className="text-gray-700 leading-relaxed">{club.description}</p>
                        </div>

                        {/* Members section - could be added later by fetching club-memberships */}
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
                                onClick={() => router.push('/jobs')}
                                className="w-full px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                            >
                                Vedi Opportunità
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
