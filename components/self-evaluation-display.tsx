'use client'
import React from 'react'
import { StarIcon } from '@heroicons/react/24/solid'

interface AbilityBarProps {
    label: string
    value: number
    max?: number
}

interface StatItem {
    label: string
    value: number
}

const AbilityBar = ({ label, value, max = 99 }: AbilityBarProps) => {
    const percentage = (value / max) * 100
    const starCount = Math.round((value / max) * 5)

    return (
        <div className="space-y-2">
            <div className="flex justify-between items-center">
                <label className="text-sm font-medium text-gray-700">{label}</label>
                <div className="flex items-center gap-1">
                    <span className="text-sm font-semibold text-gray-900">{value}/99</span>
                    <div className="flex gap-0.5">
                        {Array.from({ length: 5 }).map((_, i) => (
                            <StarIcon
                                key={i}
                                className={`w-4 h-4 ${i < starCount ? 'text-yellow-400' : 'text-gray-300'}`}
                            />
                        ))}
                    </div>
                </div>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                    className="bg-gradient-to-r from-yellow-400 to-yellow-500 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${percentage}%` }}
                />
            </div>
        </div>
    )
}

const StarRating = ({ value, max = 99 }: { value: number; max?: number }) => {
    const starCount = Math.round((value / max) * 5)
    return (
        <div className="flex gap-1">
            {Array.from({ length: 5 }).map((_, i) => (
                <StarIcon
                    key={i}
                    className={`w-4 h-4 ${i < starCount ? 'text-yellow-400' : 'text-gray-300'}`}
                />
            ))}
        </div>
    )
}

const RadarChart = ({ stats, max = 99 }: { stats: StatItem[]; max?: number }) => {
    const size = 220
    const center = size / 2
    const radius = 78
    const levels = 4

    const toPoint = (index: number, value: number) => {
        const angle = (Math.PI * 2 * index) / stats.length - Math.PI / 2
        const r = (value / max) * radius
        return {
            x: center + Math.cos(angle) * r,
            y: center + Math.sin(angle) * r
        }
    }

    const polygonPoints = stats
        .map((s, i) => {
            const p = toPoint(i, s.value)
            return `${p.x},${p.y}`
        })
        .join(' ')

    return (
        <svg width={size} height={size} className="block">
            {/* Grid */}
            {Array.from({ length: levels }).map((_, level) => {
                const r = radius * ((level + 1) / levels)
                const points = stats
                    .map((_, i) => {
                        const angle = (Math.PI * 2 * i) / stats.length - Math.PI / 2
                        const x = center + Math.cos(angle) * r
                        const y = center + Math.sin(angle) * r
                        return `${x},${y}`
                    })
                    .join(' ')
                return (
                    <polygon
                        key={level}
                        points={points}
                        fill="none"
                        stroke="#E5E7EB"
                        strokeWidth="1"
                    />
                )
            })}

            {/* Axes */}
            {stats.map((_, i) => {
                const angle = (Math.PI * 2 * i) / stats.length - Math.PI / 2
                const x = center + Math.cos(angle) * radius
                const y = center + Math.sin(angle) * radius
                return (
                    <line
                        key={i}
                        x1={center}
                        y1={center}
                        x2={x}
                        y2={y}
                        stroke="#E5E7EB"
                        strokeWidth="1"
                    />
                )
            })}

            {/* Data polygon */}
            <polygon
                points={polygonPoints}
                fill="rgba(34, 197, 94, 0.18)"
                stroke="#22C55E"
                strokeWidth="2"
            />

            {/* Points */}
            {stats.map((s, i) => {
                const p = toPoint(i, s.value)
                return (
                    <circle key={s.label} cx={p.x} cy={p.y} r="3" fill="#22C55E" />
                )
            })}

            {/* Labels */}
            {stats.map((s, i) => {
                const angle = (Math.PI * 2 * i) / stats.length - Math.PI / 2
                const x = center + Math.cos(angle) * (radius + 18)
                const y = center + Math.sin(angle) * (radius + 18)
                const anchor = Math.abs(Math.cos(angle)) < 0.2 ? 'middle' : Math.cos(angle) > 0 ? 'start' : 'end'
                return (
                    <text
                        key={`${s.label}-label`}
                        x={x}
                        y={y}
                        textAnchor={anchor}
                        alignmentBaseline="middle"
                        className="fill-gray-500 text-[10px]"
                    >
                        {s.label}
                    </text>
                )
            })}
        </svg>
    )
}

interface SelfEvaluationDisplayProps {
    user?: any
    playerSelfEvaluation?: any
    coachSelfEvaluation?: any
    professionalRole?: string
    sports?: string[]
    className?: string
}

export default function SelfEvaluationDisplay({
    user,
    playerSelfEvaluation,
    coachSelfEvaluation,
    professionalRole,
    sports = [],
    className = ''
}: SelfEvaluationDisplayProps) {
    const isPlayer = professionalRole === 'Player'
    const isCoach = professionalRole === 'Coach'
    const evaluation = isPlayer ? playerSelfEvaluation : coachSelfEvaluation

    if (!evaluation) {
        return (
            <div className={`p-6 text-center text-gray-500 ${className}`}>
                <p>Nessuna autovalutazione compilata yet.</p>
            </div>
        )
    }

    const mainSport = sports?.[0] || null

    const getPlayerStats = (): StatItem[] => {
        if (!isPlayer) return []
        if (mainSport === 'Calcio') {
            return [
                { label: 'Velocità', value: evaluation.football?.velocita ?? 0 },
                { label: 'Tiro', value: evaluation.football?.tiro ?? 0 },
                { label: 'Passaggio', value: evaluation.football?.passaggio ?? 0 },
                { label: 'Dribbling', value: evaluation.football?.dribbling ?? 0 },
                { label: 'Difesa', value: evaluation.football?.difesa ?? 0 },
                { label: 'Fisico', value: evaluation.football?.fisico ?? 0 }
            ]
        }
        if (mainSport === 'Basket') {
            return [
                { label: 'Velocità', value: evaluation.basketball?.velocita ?? 0 },
                { label: 'Tiro', value: evaluation.basketball?.tiro ?? 0 },
                { label: 'Passaggio', value: evaluation.basketball?.passaggio ?? 0 },
                { label: 'Palleggio', value: evaluation.basketball?.palleggio ?? 0 },
                { label: 'Difesa', value: evaluation.basketball?.difesa ?? 0 },
                { label: 'Atletismo', value: evaluation.basketball?.atletismo ?? 0 }
            ]
        }
        if (mainSport === 'Pallavolo') {
            return [
                { label: 'Battuta', value: evaluation.volleyball?.battuta ?? 0 },
                { label: 'Ricezione', value: evaluation.volleyball?.ricezione ?? 0 },
                { label: 'Attacco', value: evaluation.volleyball?.attacco ?? 0 },
                { label: 'Muro', value: evaluation.volleyball?.muro ?? 0 },
                { label: 'Difesa', value: evaluation.volleyball?.difesa ?? 0 },
                { label: 'Elevazione', value: evaluation.volleyball?.elevazione ?? 0 }
            ]
        }
        return []
    }

    const playerStats = getPlayerStats()
    const radarStats: StatItem[] = playerStats.map((stat) => ({
        label: stat.label,
        value: stat.value
    }))

    if (mainSport === 'Calcio') {
        radarStats.forEach((stat) => {
            if (stat.label === 'Velocità') stat.label = 'Vel'
            if (stat.label === 'Passaggio') stat.label = 'Pass'
            if (stat.label === 'Dribbling') stat.label = 'Drib'
            if (stat.label === 'Difesa') stat.label = 'Dif'
            if (stat.label === 'Fisico') stat.label = 'Fis'
        })
    }
    if (mainSport === 'Basket') {
        radarStats.forEach((stat) => {
            if (stat.label === 'Velocità') stat.label = 'Vel'
            if (stat.label === 'Passaggio') stat.label = 'Pass'
            if (stat.label === 'Palleggio') stat.label = 'Pal'
            if (stat.label === 'Difesa') stat.label = 'Dif'
            if (stat.label === 'Atletismo') stat.label = 'Atl'
        })
    }
    if (mainSport === 'Pallavolo') {
        radarStats.forEach((stat) => {
            if (stat.label === 'Battuta') stat.label = 'Batt'
            if (stat.label === 'Ricezione') stat.label = 'Ric'
            if (stat.label === 'Attacco') stat.label = 'Att'
            if (stat.label === 'Difesa') stat.label = 'Dif'
            if (stat.label === 'Elevazione') stat.label = 'Elev'
        })
    }

    return (
        <div className={`space-y-8 ${className}`}>
            {/* PLAYER ABILITIES - MINIMAL + RADAR */}
            {isPlayer && playerStats.length > 0 && (
                <section className="space-y-4">
                    <div className="border-b-2 border-gray-200 pb-2">
                        <h3 className="text-lg font-bold text-gray-900">Abilità {mainSport}</h3>
                    </div>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <div className="space-y-4">
                            {playerStats.map((stat) => (
                                <div key={stat.label} className="flex items-center justify-between">
                                    <span className="text-sm text-gray-700 font-medium">{stat.label}</span>
                                    <StarRating value={stat.value} />
                                </div>
                            ))}
                        </div>
                        <div className="flex items-center justify-center">
                            <div className="rounded-xl bg-white border border-gray-200 p-4 shadow-sm">
                                <RadarChart stats={radarStats} max={99} />
                            </div>
                        </div>
                    </div>
                </section>
            )}

            {/* COACH ABILITIES */}
            {isCoach && evaluation.universal && (
                <section className="space-y-4">
                    <div className="border-b-2 border-gray-200 pb-2">
                        <h3 className="text-lg font-bold text-gray-900">Abilità Allenatore</h3>
                    </div>

                    {evaluation.universal && Object.keys(evaluation.universal).length > 0 && (
                        <div className="space-y-3 pl-4 border-l-4 border-blue-400">
                            <h4 className="font-semibold text-gray-800">Abilità Universali</h4>
                            {evaluation.universal.comunicazione !== undefined && (
                                <AbilityBar label="Comunicazione" value={evaluation.universal.comunicazione} />
                            )}
                            {evaluation.universal.preparazioneTattica !== undefined && (
                                <AbilityBar label="Preparazione Tattica" value={evaluation.universal.preparazioneTattica} />
                            )}
                            {evaluation.universal.gestioneDelGruppo !== undefined && (
                                <AbilityBar label="Gestione del Gruppo" value={evaluation.universal.gestioneDelGruppo} />
                            )}
                            {evaluation.universal.capacitaMotivationale !== undefined && (
                                <AbilityBar label="Capacità Motivazionale" value={evaluation.universal.capacitaMotivationale} />
                            )}
                            {evaluation.universal.sviluppoGiocatori !== undefined && (
                                <AbilityBar label="Sviluppo dei Giocatori" value={evaluation.universal.sviluppoGiocatori} />
                            )}
                            {evaluation.universal.adattamentoStrategico !== undefined && (
                                <AbilityBar label="Adattamento Strategico" value={evaluation.universal.adattamentoStrategico} />
                            )}
                        </div>
                    )}

                    {mainSport === 'Calcio' && evaluation.football && (
                        <div className="space-y-3 pl-4 border-l-4 border-green-400">
                            <h4 className="font-semibold text-gray-800">Abilità Calcio</h4>
                            {evaluation.football.imposizioneDifensiva !== undefined && (
                                <AbilityBar label="Imposizione Difensiva" value={evaluation.football.imposizioneDifensiva} />
                            )}
                            {evaluation.football.costruzioneOffensiva !== undefined && (
                                <AbilityBar label="Costruzione Offensiva" value={evaluation.football.costruzioneOffensiva} />
                            )}
                            {evaluation.football.transizioni !== undefined && (
                                <AbilityBar label="Transizioni" value={evaluation.football.transizioni} />
                            )}
                        </div>
                    )}

                    {mainSport === 'Pallavolo' && evaluation.volleyball && (
                        <div className="space-y-3 pl-4 border-l-4 border-green-400">
                            <h4 className="font-semibold text-gray-800">Abilità Pallavolo</h4>
                            {evaluation.volleyball.organizzazioneDifensiva !== undefined && (
                                <AbilityBar label="Organizzazione Difensiva" value={evaluation.volleyball.organizzazioneDifensiva} />
                            )}
                            {evaluation.volleyball.rotazioni !== undefined && (
                                <AbilityBar label="Rotazioni" value={evaluation.volleyball.rotazioni} />
                            )}
                            {evaluation.volleyball.gestioneTempi !== undefined && (
                                <AbilityBar label="Gestione Tempi" value={evaluation.volleyball.gestioneTempi} />
                            )}
                        </div>
                    )}

                    {mainSport === 'Basket' && evaluation.basketball && (
                        <div className="space-y-3 pl-4 border-l-4 border-green-400">
                            <h4 className="font-semibold text-gray-800">Abilità Basketball</h4>
                            {evaluation.basketball.offensiva !== undefined && (
                                <AbilityBar label="Offensiva" value={evaluation.basketball.offensiva} />
                            )}
                            {evaluation.basketball.difensiva !== undefined && (
                                <AbilityBar label="Difensiva" value={evaluation.basketball.difensiva} />
                            )}
                            {evaluation.basketball.gestionePanchina !== undefined && (
                                <AbilityBar label="Gestione Panchina" value={evaluation.basketball.gestionePanchina} />
                            )}
                        </div>
                    )}
                </section>
            )}
        </div>
    )
}
