'use client'
import React from 'react'
import { BriefcaseIcon, CalendarIcon } from '@heroicons/react/24/outline'

/* ─── Sport → emoji mapping ─── */
const sportEmoji: Record<string, string> = {
    calcio: '⚽', basket: '🏀', pallavolo: '🏐', tennis: '🎾',
    nuoto: '🏊', atletica: '🏃', rugby: '🏉', ciclismo: '🚴',
}
function getSportIcon(sport?: string) {
    if (!sport) return '🏅'
    return sportEmoji[sport.toLowerCase()] || '🏅'
}

interface PlayerExperienceCardProps {
    experience: {
        role?: string
        team?: string
        category?: string
        categoryTier?: string
        season?: string
        from?: string
        to?: string
        isCurrentlyPlaying?: boolean
        summary?: string
        country?: string
        competitionType?: string
        goals?: number
        assists?: number
        appearances?: number
        cleanSheets?: number
        pointsPerGame?: number
        rebounds?: number
        volleyAces?: number
        volleyBlocks?: number
        volleyDigs?: number
        minutesPlayed?: number
        yellowCards?: number
        redCards?: number
        penalties?: number
    }
    sport?: string
    isLatest?: boolean
}

export default function PlayerExperienceCard({ experience: exp, sport, isLatest = false }: PlayerExperienceCardProps) {
    const sportNorm = (sport || '').toLowerCase()
    const isFootball = sportNorm === 'calcio'
    const isBasket = sportNorm === 'basket'
    const isVolley = sportNorm === 'pallavolo'

    /* ── Build stat items ── */
    type StatItem = { label: string; value: number; color: string }
    const statItems: StatItem[] = []

    if (exp.appearances != null && exp.appearances > 0) statItems.push({ label: 'Presenze', value: exp.appearances, color: 'green' })
    if (isFootball && exp.goals != null) statItems.push({ label: 'Gol', value: exp.goals, color: 'emerald' })
    if (isFootball && exp.assists != null) statItems.push({ label: 'Assist', value: exp.assists, color: 'teal' })
    if (isFootball && exp.cleanSheets != null) statItems.push({ label: 'Clean Sheet', value: exp.cleanSheets, color: 'sky' })
    if (isBasket && exp.pointsPerGame != null) statItems.push({ label: 'PPG', value: exp.pointsPerGame, color: 'emerald' })
    if (isBasket && exp.assists != null) statItems.push({ label: 'Assist', value: exp.assists, color: 'teal' })
    if (isBasket && exp.rebounds != null) statItems.push({ label: 'Rimbalzi', value: exp.rebounds, color: 'amber' })
    if (isVolley && exp.volleyAces != null) statItems.push({ label: 'Ace', value: exp.volleyAces, color: 'emerald' })
    if (isVolley && exp.volleyBlocks != null) statItems.push({ label: 'Muri', value: exp.volleyBlocks, color: 'teal' })
    if (isVolley && exp.volleyDigs != null) statItems.push({ label: 'Difese', value: exp.volleyDigs, color: 'amber' })

    const colorMap: Record<string, string> = {
        green: 'bg-green-50 border-green-200 text-green-700',
        emerald: 'bg-emerald-50 border-emerald-200 text-emerald-700',
        teal: 'bg-teal-50 border-teal-200 text-teal-700',
        sky: 'bg-sky-50 border-sky-200 text-sky-700',
        amber: 'bg-amber-50 border-amber-200 text-amber-700',
    }

    /* ── Period text ── */
    let periodText = ''
    if (exp.season && exp.season.trim()) {
        periodText = `Stagione ${exp.season}`
    } else if (exp.from || exp.to) {
        const fromFormatted = exp.from ? new Date(exp.from).toLocaleDateString('it-IT', { day: '2-digit', month: '2-digit', year: 'numeric' }) : '—'
        const toFormatted = exp.isCurrentlyPlaying ? 'Presente' : exp.to ? new Date(exp.to).toLocaleDateString('it-IT', { day: '2-digit', month: '2-digit', year: 'numeric' }) : 'Presente'
        periodText = `${fromFormatted} – ${toFormatted}`
    }

    return (
        <div className={`border rounded-xl overflow-hidden transition-shadow hover:shadow-md ${isLatest ? 'border-green-300 ring-1 ring-green-200' : 'border-gray-200'}`}>
            {/* ── Header bar ── */}
            <div className={`px-4 py-3 flex items-center justify-between ${isLatest ? 'bg-gradient-to-r from-green-600 to-emerald-500 text-white' : 'bg-gray-50'}`}>
                <div className="flex items-center gap-2">
                    <BriefcaseIcon className={`w-5 h-5 ${isLatest ? 'text-white/80' : 'text-gray-500'}`} />
                    <span className={`font-bold text-sm ${isLatest ? 'text-white' : 'text-gray-900'}`}>
                        {exp.role || 'Ruolo non indicato'}
                    </span>
                    {exp.team && (
                        <span className={`text-sm ${isLatest ? 'text-white/80' : 'text-gray-500'}`}>
                            @ {exp.team}
                        </span>
                    )}
                </div>
                <div className="flex items-center gap-2">
                    {exp.category && (
                        <span className={`text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider ${isLatest
                                ? 'bg-white/20 border border-white/30 text-white'
                                : 'bg-green-100 text-green-800 border border-green-200'
                            }`}>
                            {exp.category}
                        </span>
                    )}
                    {exp.categoryTier && (
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${isLatest
                                ? 'bg-white text-green-700'
                                : 'bg-gray-900 text-white'
                            }`}>
                            {exp.categoryTier}
                        </span>
                    )}
                </div>
            </div>

            {/* ── Body ── */}
            <div className="px-4 py-3 space-y-3">
                {/* Period */}
                {periodText && (
                    <div className="flex items-center gap-1.5 text-xs text-gray-500">
                        <CalendarIcon className="w-3.5 h-3.5" />
                        {periodText}
                        {exp.country && <span className="ml-2">📍 {exp.country}</span>}
                    </div>
                )}

                {/* Summary */}
                {exp.summary && (
                    <p className="text-sm text-gray-700">{exp.summary}</p>
                )}

                {/* ── Stats grid ── */}
                {statItems.length > 0 && (
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        {statItems.map((si, i) => (
                            <div key={i} className={`${colorMap[si.color] || colorMap.green} border rounded-lg px-2 py-2 text-center`}>
                                <div className="text-lg font-extrabold">{si.value}</div>
                                <div className="text-[10px] font-semibold uppercase tracking-wider opacity-80">{si.label}</div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Extra stats details (secondary) */}
                {(exp.minutesPlayed != null || exp.yellowCards != null || exp.redCards != null || exp.penalties != null) && (
                    <div className="flex flex-wrap gap-2 text-xs pt-1 border-t border-gray-100">
                        {exp.minutesPlayed != null && (
                            <span className="text-gray-500">⏱ {exp.minutesPlayed} min</span>
                        )}
                        {exp.penalties != null && exp.penalties > 0 && (
                            <span className="text-gray-500">🎯 {exp.penalties} rigori</span>
                        )}
                        {exp.yellowCards != null && exp.yellowCards > 0 && (
                            <span className="text-yellow-600">🟨 {exp.yellowCards}</span>
                        )}
                        {exp.redCards != null && exp.redCards > 0 && (
                            <span className="text-red-600">🟥 {exp.redCards}</span>
                        )}
                    </div>
                )}
            </div>
        </div>
    )
}


