'use client'
import React, { useState } from 'react'

interface AbilitySliderProps {
    label: string
    value: number | undefined
    onChange: (value: number | undefined) => void
    className?: string
}

const AbilitySlider = ({ label, value = 1, onChange, className = '' }: AbilitySliderProps) => {
    const v = value ?? 1
    return (
        <div className={`space-y-2 ${className}`}>
            <div className="flex justify-between items-center">
                <label className="text-sm font-medium text-gray-700">{label}</label>
                <span className="text-sm font-semibold text-gray-900">{v}/99</span>
            </div>
            <input
                type="range"
                min="1"
                max="99"
                step="1"
                value={v}
                onChange={(e) => onChange(parseInt(e.target.value) || undefined)}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
            />
            <div className="flex justify-between text-xs text-gray-500">
                <span>1</span>
                <span>99</span>
            </div>
        </div>
    )
}

interface SelfEvaluationFormProps {
    evaluation?: any
    professionalRole?: string
    sports?: string[]
    onChange: (evaluation: any) => void
    className?: string
}

export default function SelfEvaluationForm({
    evaluation = {},
    professionalRole,
    sports = [],
    onChange,
    className = ''
}: SelfEvaluationFormProps) {
    const [selectedFootballRole, setSelectedFootballRole] = useState<string>(
        evaluation.football?.role || 'attacker'
    )
    const [selectedVolleyballRole, setSelectedVolleyballRole] = useState<string>(
        evaluation.volleyball?.role || 'setter'
    )
    const [selectedBasketballRole, setSelectedBasketballRole] = useState<string>(
        evaluation.basketball?.role || 'guard'
    )

    const isPlayer = professionalRole === 'Player'
    const isCoach = professionalRole === 'Coach'
    const mainSport = sports?.[0] || null

    const updateUniversal = (field: string, value: number | undefined) => {
        const updated = { ...evaluation }
        if (!updated.universal) updated.universal = {}
        updated.universal[field] = value
        onChange(updated)
    }

    const updateFootball = (field: string, value: any) => {
        const updated = { ...evaluation }
        if (!updated.football) updated.football = {}
        updated.football[field] = value
        onChange(updated)
    }

    const updateFootballCommon = (field: string, value: number | undefined) => {
        const updated = { ...evaluation }
        if (!updated.football) updated.football = {}
        if (!updated.football.common) updated.football.common = {}
        updated.football.common[field] = value
        onChange(updated)
    }

    const updateFootballRole = (field: string, value: number | undefined) => {
        const updated = { ...evaluation }
        if (!updated.football) updated.football = {}
        const role = selectedFootballRole
        if (!updated.football[role]) updated.football[role] = {}
        updated.football[role][field] = value
        onChange(updated)
    }

    const updateVolleyball = (field: string, value: any) => {
        const updated = { ...evaluation }
        if (!updated.volleyball) updated.volleyball = {}
        updated.volleyball[field] = value
        onChange(updated)
    }

    const updateVolleyballCommon = (field: string, value: number | undefined) => {
        const updated = { ...evaluation }
        if (!updated.volleyball) updated.volleyball = {}
        if (!updated.volleyball.common) updated.volleyball.common = {}
        updated.volleyball.common[field] = value
        onChange(updated)
    }

    const updateVolleyballRole = (field: string, value: number | undefined) => {
        const updated = { ...evaluation }
        if (!updated.volleyball) updated.volleyball = {}
        const role = selectedVolleyballRole
        if (!updated.volleyball[role]) updated.volleyball[role] = {}
        updated.volleyball[role][field] = value
        onChange(updated)
    }

    const updateBasketball = (field: string, value: any) => {
        const updated = { ...evaluation }
        if (!updated.basketball) updated.basketball = {}
        updated.basketball[field] = value
        onChange(updated)
    }

    const updateBasketballCommon = (field: string, value: number | undefined) => {
        const updated = { ...evaluation }
        if (!updated.basketball) updated.basketball = {}
        if (!updated.basketball.common) updated.basketball.common = {}
        updated.basketball.common[field] = value
        onChange(updated)
    }

    const updateBasketballRole = (field: string, value: number | undefined) => {
        const updated = { ...evaluation }
        if (!updated.basketball) updated.basketball = {}
        const role = selectedBasketballRole
        if (!updated.basketball[role]) updated.basketball[role] = {}
        updated.basketball[role][field] = value
        onChange(updated)
    }

    const updateCoachUniversal = (field: string, value: number | undefined) => {
        const updated = { ...evaluation }
        if (!updated.universal) updated.universal = {}
        updated.universal[field] = value
        onChange(updated)
    }

    const updateCoachSport = (sport: string, field: string, value: number | undefined) => {
        const updated = { ...evaluation }
        if (!updated[sport.toLowerCase()]) updated[sport.toLowerCase()] = {}
        updated[sport.toLowerCase()][field] = value
        onChange(updated)
    }

    return (
        <div className={`space-y-8 ${className}`}>
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-900">
                    💡 Valuta le tue abilità da <strong>1</strong> a <strong>99</strong>
                </p>
            </div>

            {/* PLAYER ABILITIES - CUSTOM BY SPORT */}
            {isPlayer && mainSport === 'Calcio' && (
                <section className="space-y-4">
                    <h3 className="text-lg font-bold text-gray-900 border-b-2 border-gray-200 pb-2">
                        Abilità Calcio
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <AbilitySlider
                            label="Velocità"
                            value={evaluation.football?.velocita}
                            onChange={(v) => updateFootball('velocita', v)}
                        />
                        <AbilitySlider
                            label="Tiro"
                            value={evaluation.football?.tiro}
                            onChange={(v) => updateFootball('tiro', v)}
                        />
                        <AbilitySlider
                            label="Passaggio"
                            value={evaluation.football?.passaggio}
                            onChange={(v) => updateFootball('passaggio', v)}
                        />
                        <AbilitySlider
                            label="Dribbling"
                            value={evaluation.football?.dribbling}
                            onChange={(v) => updateFootball('dribbling', v)}
                        />
                        <AbilitySlider
                            label="Difesa"
                            value={evaluation.football?.difesa}
                            onChange={(v) => updateFootball('difesa', v)}
                        />
                        <AbilitySlider
                            label="Fisico"
                            value={evaluation.football?.fisico}
                            onChange={(v) => updateFootball('fisico', v)}
                        />
                    </div>
                </section>
            )}

            {isPlayer && mainSport === 'Basket' && (
                <section className="space-y-4">
                    <h3 className="text-lg font-bold text-gray-900 border-b-2 border-gray-200 pb-2">
                        Abilità Basket
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <AbilitySlider
                            label="Velocità"
                            value={evaluation.basketball?.velocita}
                            onChange={(v) => updateBasketball('velocita', v)}
                        />
                        <AbilitySlider
                            label="Tiro"
                            value={evaluation.basketball?.tiro}
                            onChange={(v) => updateBasketball('tiro', v)}
                        />
                        <AbilitySlider
                            label="Passaggio"
                            value={evaluation.basketball?.passaggio}
                            onChange={(v) => updateBasketball('passaggio', v)}
                        />
                        <AbilitySlider
                            label="Palleggio"
                            value={evaluation.basketball?.palleggio}
                            onChange={(v) => updateBasketball('palleggio', v)}
                        />
                        <AbilitySlider
                            label="Difesa"
                            value={evaluation.basketball?.difesa}
                            onChange={(v) => updateBasketball('difesa', v)}
                        />
                        <AbilitySlider
                            label="Atletismo"
                            value={evaluation.basketball?.atletismo}
                            onChange={(v) => updateBasketball('atletismo', v)}
                        />
                    </div>
                </section>
            )}

            {isPlayer && mainSport === 'Pallavolo' && (
                <section className="space-y-4">
                    <h3 className="text-lg font-bold text-gray-900 border-b-2 border-gray-200 pb-2">
                        Abilità Pallavolo
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <AbilitySlider
                            label="Battuta"
                            value={evaluation.volleyball?.battuta}
                            onChange={(v) => updateVolleyball('battuta', v)}
                        />
                        <AbilitySlider
                            label="Ricezione"
                            value={evaluation.volleyball?.ricezione}
                            onChange={(v) => updateVolleyball('ricezione', v)}
                        />
                        <AbilitySlider
                            label="Attacco"
                            value={evaluation.volleyball?.attacco}
                            onChange={(v) => updateVolleyball('attacco', v)}
                        />
                        <AbilitySlider
                            label="Muro"
                            value={evaluation.volleyball?.muro}
                            onChange={(v) => updateVolleyball('muro', v)}
                        />
                        <AbilitySlider
                            label="Difesa"
                            value={evaluation.volleyball?.difesa}
                            onChange={(v) => updateVolleyball('difesa', v)}
                        />
                        <AbilitySlider
                            label="Elevazione"
                            value={evaluation.volleyball?.elevazione}
                            onChange={(v) => updateVolleyball('elevazione', v)}
                        />
                    </div>
                </section>
            )}

            {/* COACH ABILITIES */}
            {isCoach && (
                <section className="space-y-4">
                    <h3 className="text-lg font-bold text-gray-900 border-b-2 border-gray-200 pb-2">
                        Abilità Allenatore
                    </h3>

                    {/* Universal Coach Abilities */}
                    <div className="space-y-4">
                        <h4 className="font-semibold text-gray-800 pl-4 border-l-4 border-blue-400">
                            Abilità Universali
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pl-4">
                            <AbilitySlider
                                label="Comunicazione"
                                value={evaluation.universal?.comunicazione}
                                onChange={(v) => updateCoachUniversal('comunicazione', v)}
                            />
                            <AbilitySlider
                                label="Preparazione Tattica"
                                value={evaluation.universal?.preparazioneTattica}
                                onChange={(v) => updateCoachUniversal('preparazioneTattica', v)}
                            />
                            <AbilitySlider
                                label="Gestione del Gruppo"
                                value={evaluation.universal?.gestioneDelGruppo}
                                onChange={(v) => updateCoachUniversal('gestioneDelGruppo', v)}
                            />
                            <AbilitySlider
                                label="Capacità Motivazionale"
                                value={evaluation.universal?.capacitaMotivationale}
                                onChange={(v) => updateCoachUniversal('capacitaMotivationale', v)}
                            />
                            <AbilitySlider
                                label="Sviluppo dei Giocatori"
                                value={evaluation.universal?.sviluppoGiocatori}
                                onChange={(v) => updateCoachUniversal('sviluppoGiocatori', v)}
                            />
                            <AbilitySlider
                                label="Adattamento Strategico"
                                value={evaluation.universal?.adattamentoStrategico}
                                onChange={(v) => updateCoachUniversal('adattamentoStrategico', v)}
                            />
                        </div>
                    </div>

                    {/* Sport-Specific */}
                    {mainSport === 'Calcio' && (
                        <div className="space-y-4">
                            <h4 className="font-semibold text-gray-800 pl-4 border-l-4 border-green-400">
                                Abilità Calcio
                            </h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pl-4">
                                <AbilitySlider
                                    label="Imposizione Difensiva"
                                    value={evaluation.football?.imposizioneDifensiva}
                                    onChange={(v) => updateCoachSport('football', 'imposizioneDifensiva', v)}
                                />
                                <AbilitySlider
                                    label="Costruzione Offensiva"
                                    value={evaluation.football?.costruzioneOffensiva}
                                    onChange={(v) => updateCoachSport('football', 'costruzioneOffensiva', v)}
                                />
                                <AbilitySlider
                                    label="Transizioni"
                                    value={evaluation.football?.transizioni}
                                    onChange={(v) => updateCoachSport('football', 'transizioni', v)}
                                />
                            </div>
                        </div>
                    )}

                    {mainSport === 'Pallavolo' && (
                        <div className="space-y-4">
                            <h4 className="font-semibold text-gray-800 pl-4 border-l-4 border-green-400">
                                Abilità Pallavolo
                            </h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pl-4">
                                <AbilitySlider
                                    label="Organizzazione Difensiva"
                                    value={evaluation.volleyball?.organizzazioneDifensiva}
                                    onChange={(v) => updateCoachSport('volleyball', 'organizzazioneDifensiva', v)}
                                />
                                <AbilitySlider
                                    label="Rotazioni"
                                    value={evaluation.volleyball?.rotazioni}
                                    onChange={(v) => updateCoachSport('volleyball', 'rotazioni', v)}
                                />
                                <AbilitySlider
                                    label="Gestione Tempi"
                                    value={evaluation.volleyball?.gestioneTempi}
                                    onChange={(v) => updateCoachSport('volleyball', 'gestioneTempi', v)}
                                />
                            </div>
                        </div>
                    )}

                    {mainSport === 'Basket' && (
                        <div className="space-y-4">
                            <h4 className="font-semibold text-gray-800 pl-4 border-l-4 border-green-400">
                                Abilità Basketball
                            </h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pl-4">
                                <AbilitySlider
                                    label="Offensiva"
                                    value={evaluation.basketball?.offensiva}
                                    onChange={(v) => updateCoachSport('basketball', 'offensiva', v)}
                                />
                                <AbilitySlider
                                    label="Difensiva"
                                    value={evaluation.basketball?.difensiva}
                                    onChange={(v) => updateCoachSport('basketball', 'difensiva', v)}
                                />
                                <AbilitySlider
                                    label="Gestione Panchina"
                                    value={evaluation.basketball?.gestionePanchina}
                                    onChange={(v) => updateCoachSport('basketball', 'gestionePanchina', v)}
                                />
                            </div>
                        </div>
                    )}
                </section>
            )}
        </div>
    )
}
