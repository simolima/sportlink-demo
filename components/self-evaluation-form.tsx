'use client'
import React, { useState } from 'react'

interface AbilitySliderProps {
    label: string
    value: number | undefined
    onChange: (value: number | undefined) => void
    className?: string
}

const AbilitySlider = ({ label, value = 0, onChange, className = '' }: AbilitySliderProps) => {
    const v = value || 0
    return (
        <div className={`space-y-2 ${className}`}>
            <div className="flex justify-between items-center">
                <label className="text-sm font-medium text-gray-700">{label}</label>
                <span className="text-sm font-semibold text-gray-900">{v}/5</span>
            </div>
            <input
                type="range"
                min="0"
                max="5"
                step="1"
                value={v}
                onChange={(e) => onChange(parseInt(e.target.value) || undefined)}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
            />
            <div className="flex justify-between text-xs text-gray-500">
                <span>Principiante</span>
                <span>Esperto</span>
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
                    💡 Valuta le tue abilità da <strong>1 (Principiante)</strong> a <strong>5 (Esperto)</strong>
                </p>
            </div>

            {/* UNIVERSAL ABILITIES */}
            <section className="space-y-4">
                <h3 className="text-lg font-bold text-gray-900 border-b-2 border-gray-200 pb-2">
                    Abilità Universali
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <AbilitySlider
                        label="Velocità"
                        value={evaluation.universal?.velocita}
                        onChange={(v) => updateUniversal('velocita', v)}
                    />
                    <AbilitySlider
                        label="Resistenza"
                        value={evaluation.universal?.resistenza}
                        onChange={(v) => updateUniversal('resistenza', v)}
                    />
                    <AbilitySlider
                        label="Comunicazione"
                        value={evaluation.universal?.comunicazione}
                        onChange={(v) => updateUniversal('comunicazione', v)}
                    />
                    <AbilitySlider
                        label="Intelligenza Tattica"
                        value={evaluation.universal?.intelligenzaTattica}
                        onChange={(v) => updateUniversal('intelligenzaTattica', v)}
                    />
                    <AbilitySlider
                        label="Movimento Senza Palla"
                        value={evaluation.universal?.movimentoSenzaPalla}
                        onChange={(v) => updateUniversal('movimentoSenzaPalla', v)}
                    />
                    <AbilitySlider
                        label="Concentrazione"
                        value={evaluation.universal?.concentrazione}
                        onChange={(v) => updateUniversal('concentrazione', v)}
                    />
                </div>
            </section>

            {/* FOOTBALL FOR PLAYERS */}
            {isPlayer && mainSport === 'Calcio' && (
                <section className="space-y-4">
                    <h3 className="text-lg font-bold text-gray-900 border-b-2 border-gray-200 pb-2">
                        Abilità Calcio
                    </h3>

                    {/* Common Abilities */}
                    <div className="space-y-4">
                        <h4 className="font-semibold text-gray-800 pl-4 border-l-4 border-blue-400">
                            Abilità Comuni
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pl-4">
                            <AbilitySlider
                                label="Controllo Palla"
                                value={evaluation.football?.common?.controlPalla}
                                onChange={(v) => updateFootballCommon('controlPalla', v)}
                            />
                            <AbilitySlider
                                label="Passaggio"
                                value={evaluation.football?.common?.passaggio}
                                onChange={(v) => updateFootballCommon('passaggio', v)}
                            />
                            <AbilitySlider
                                label="Tiro"
                                value={evaluation.football?.common?.tiro}
                                onChange={(v) => updateFootballCommon('tiro', v)}
                            />
                            <AbilitySlider
                                label="Visione di Gioco"
                                value={evaluation.football?.common?.visioneDiGioco}
                                onChange={(v) => updateFootballCommon('visioneDiGioco', v)}
                            />
                        </div>
                    </div>

                    {/* Role Selection */}
                    <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-700">Quale è il tuo ruolo?</label>
                        <select
                            value={selectedFootballRole}
                            onChange={(e) => {
                                const newRole = e.target.value
                                setSelectedFootballRole(newRole)
                                updateFootball('role', newRole)
                            }}
                            className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm text-gray-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                        >
                            <option value="attacker">Attaccante</option>
                            <option value="midfielder">Centrocampista</option>
                            <option value="defender">Difensore</option>
                            <option value="goalkeeper">Portiere</option>
                        </select>
                    </div>

                    {/* Role-Specific Abilities */}
                    {selectedFootballRole === 'attacker' && (
                        <div className="space-y-4">
                            <h4 className="font-semibold text-gray-800 pl-4 border-l-4 border-red-400">
                                Abilità Attaccante
                            </h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pl-4">
                                <AbilitySlider
                                    label="Efficacia Sottoporta"
                                    value={evaluation.football?.attacker?.efficaciaSottoporta}
                                    onChange={(v) => updateFootballRole('efficaciaSottoporta', v)}
                                />
                                <AbilitySlider
                                    label="Posizionamento Offensivo"
                                    value={evaluation.football?.attacker?.posizionamentoOffensivo}
                                    onChange={(v) => updateFootballRole('posizionamentoOffensivo', v)}
                                />
                            </div>
                        </div>
                    )}

                    {selectedFootballRole === 'midfielder' && (
                        <div className="space-y-4">
                            <h4 className="font-semibold text-gray-800 pl-4 border-l-4 border-green-400">
                                Abilità Centrocampista
                            </h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pl-4">
                                <AbilitySlider
                                    label="Distribuzione"
                                    value={evaluation.football?.midfielder?.distribuzione}
                                    onChange={(v) => updateFootballRole('distribuzione', v)}
                                />
                                <AbilitySlider
                                    label="Copertura Difensiva"
                                    value={evaluation.football?.midfielder?.coperturaDifensiva}
                                    onChange={(v) => updateFootballRole('coperturaDifensiva', v)}
                                />
                                <AbilitySlider
                                    label="Verticalizzazione"
                                    value={evaluation.football?.midfielder?.verticalizzazione}
                                    onChange={(v) => updateFootballRole('verticalizzazione', v)}
                                />
                            </div>
                        </div>
                    )}

                    {selectedFootballRole === 'defender' && (
                        <div className="space-y-4">
                            <h4 className="font-semibold text-gray-800 pl-4 border-l-4 border-purple-400">
                                Abilità Difensore
                            </h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pl-4">
                                <AbilitySlider
                                    label="Marcatura"
                                    value={evaluation.football?.defender?.marcatura}
                                    onChange={(v) => updateFootballRole('marcatura', v)}
                                />
                                <AbilitySlider
                                    label="Posizionamento Difensivo"
                                    value={evaluation.football?.defender?.posizionamentoDifensivo}
                                    onChange={(v) => updateFootballRole('posizionamentoDifensivo', v)}
                                />
                                <AbilitySlider
                                    label="Anticipo"
                                    value={evaluation.football?.defender?.anticipo}
                                    onChange={(v) => updateFootballRole('anticipo', v)}
                                />
                            </div>
                        </div>
                    )}

                    {selectedFootballRole === 'goalkeeper' && (
                        <div className="space-y-4">
                            <h4 className="font-semibold text-gray-800 pl-4 border-l-4 border-yellow-400">
                                Abilità Portiere
                            </h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pl-4">
                                <AbilitySlider
                                    label="Reattività"
                                    value={evaluation.football?.goalkeeper?.reattivita}
                                    onChange={(v) => updateFootballRole('reattivita', v)}
                                />
                                <AbilitySlider
                                    label="Posizionamento"
                                    value={evaluation.football?.goalkeeper?.posizionamento}
                                    onChange={(v) => updateFootballRole('posizionamento', v)}
                                />
                                <AbilitySlider
                                    label="Gioco coi Piedi"
                                    value={evaluation.football?.goalkeeper?.giocoConPiedi}
                                    onChange={(v) => updateFootballRole('giocoConPiedi', v)}
                                />
                                <AbilitySlider
                                    label="Distribuzione"
                                    value={evaluation.football?.goalkeeper?.distribuzione}
                                    onChange={(v) => updateFootballRole('distribuzione', v)}
                                />
                                <AbilitySlider
                                    label="Uscite Aeree"
                                    value={evaluation.football?.goalkeeper?.usciteAeree}
                                    onChange={(v) => updateFootballRole('usciteAeree', v)}
                                />
                                <AbilitySlider
                                    label="Presa Sicura"
                                    value={evaluation.football?.goalkeeper?.presaSicura}
                                    onChange={(v) => updateFootballRole('presaSicura', v)}
                                />
                            </div>
                        </div>
                    )}
                </section>
            )}

            {/* VOLLEYBALL FOR PLAYERS */}
            {isPlayer && mainSport === 'Pallavolo' && (
                <section className="space-y-4">
                    <h3 className="text-lg font-bold text-gray-900 border-b-2 border-gray-200 pb-2">
                        Abilità Pallavolo
                    </h3>

                    {/* Common Abilities */}
                    <div className="space-y-4">
                        <h4 className="font-semibold text-gray-800 pl-4 border-l-4 border-blue-400">
                            Abilità Comuni
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pl-4">
                            <AbilitySlider
                                label="Ricezione"
                                value={evaluation.volleyball?.common?.ricezione}
                                onChange={(v) => updateVolleyballCommon('ricezione', v)}
                            />
                            <AbilitySlider
                                label="Posizionamento"
                                value={evaluation.volleyball?.common?.posizionamento}
                                onChange={(v) => updateVolleyballCommon('posizionamento', v)}
                            />
                            <AbilitySlider
                                label="Salto"
                                value={evaluation.volleyball?.common?.salto}
                                onChange={(v) => updateVolleyballCommon('salto', v)}
                            />
                            <AbilitySlider
                                label="Reattività"
                                value={evaluation.volleyball?.common?.reattivita}
                                onChange={(v) => updateVolleyballCommon('reattivita', v)}
                            />
                        </div>
                    </div>

                    {/* Role Selection */}
                    <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-700">Quale è il tuo ruolo?</label>
                        <select
                            value={selectedVolleyballRole}
                            onChange={(e) => {
                                const newRole = e.target.value
                                setSelectedVolleyballRole(newRole)
                                updateVolleyball('role', newRole)
                            }}
                            className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm text-gray-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                        >
                            <option value="setter">Palleggiatore</option>
                            <option value="spiker">Schiacciatore</option>
                            <option value="middle">Centrale</option>
                            <option value="libero">Libero</option>
                        </select>
                    </div>

                    {/* Role-Specific Abilities */}
                    {selectedVolleyballRole === 'setter' && (
                        <div className="space-y-4">
                            <h4 className="font-semibold text-gray-800 pl-4 border-l-4 border-green-400">
                                Abilità Palleggiatore
                            </h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pl-4">
                                <AbilitySlider
                                    label="Distribuzione"
                                    value={evaluation.volleyball?.setter?.distribuzione}
                                    onChange={(v) => updateVolleyballRole('distribuzione', v)}
                                />
                                <AbilitySlider
                                    label="Lettura del Gioco"
                                    value={evaluation.volleyball?.setter?.letturaDelGioco}
                                    onChange={(v) => updateVolleyballRole('letturaDelGioco', v)}
                                />
                                <AbilitySlider
                                    label="Rapidità Esecutiva"
                                    value={evaluation.volleyball?.setter?.rapiditaEsecutiva}
                                    onChange={(v) => updateVolleyballRole('rapiditaEsecutiva', v)}
                                />
                            </div>
                        </div>
                    )}

                    {selectedVolleyballRole === 'spiker' && (
                        <div className="space-y-4">
                            <h4 className="font-semibold text-gray-800 pl-4 border-l-4 border-red-400">
                                Abilità Schiacciatore
                            </h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pl-4">
                                <AbilitySlider
                                    label="Potenza d'Attacco"
                                    value={evaluation.volleyball?.spiker?.potenzaAttacco}
                                    onChange={(v) => updateVolleyballRole('potenzaAttacco', v)}
                                />
                                <AbilitySlider
                                    label="Timing Salto"
                                    value={evaluation.volleyball?.spiker?.timingSalto}
                                    onChange={(v) => updateVolleyballRole('timingSalto', v)}
                                />
                                <AbilitySlider
                                    label="Fiuto d'Attacco"
                                    value={evaluation.volleyball?.spiker?.fiutoAttacco}
                                    onChange={(v) => updateVolleyballRole('fiutoAttacco', v)}
                                />
                            </div>
                        </div>
                    )}

                    {selectedVolleyballRole === 'middle' && (
                        <div className="space-y-4">
                            <h4 className="font-semibold text-gray-800 pl-4 border-l-4 border-purple-400">
                                Abilità Centrale
                            </h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pl-4">
                                <AbilitySlider
                                    label="Muro"
                                    value={evaluation.volleyball?.middle?.muro}
                                    onChange={(v) => updateVolleyballRole('muro', v)}
                                />
                                <AbilitySlider
                                    label="Attacco da Posto 3"
                                    value={evaluation.volleyball?.middle?.attaccoDaPost3}
                                    onChange={(v) => updateVolleyballRole('attaccoDaPost3', v)}
                                />
                            </div>
                        </div>
                    )}

                    {selectedVolleyballRole === 'libero' && (
                        <div className="space-y-4">
                            <h4 className="font-semibold text-gray-800 pl-4 border-l-4 border-yellow-400">
                                Abilità Libero
                            </h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pl-4">
                                <AbilitySlider
                                    label="Ricezione Specializzata"
                                    value={evaluation.volleyball?.libero?.ricezioneSpecializzata}
                                    onChange={(v) => updateVolleyballRole('ricezioneSpecializzata', v)}
                                />
                                <AbilitySlider
                                    label="Difesa Bassa"
                                    value={evaluation.volleyball?.libero?.difesaBassa}
                                    onChange={(v) => updateVolleyballRole('difesaBassa', v)}
                                />
                            </div>
                        </div>
                    )}
                </section>
            )}

            {/* BASKETBALL FOR PLAYERS */}
            {isPlayer && mainSport === 'Basket' && (
                <section className="space-y-4">
                    <h3 className="text-lg font-bold text-gray-900 border-b-2 border-gray-200 pb-2">
                        Abilità Basketball
                    </h3>

                    {/* Common Abilities */}
                    <div className="space-y-4">
                        <h4 className="font-semibold text-gray-800 pl-4 border-l-4 border-blue-400">
                            Abilità Comuni
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pl-4">
                            <AbilitySlider
                                label="Palleggio"
                                value={evaluation.basketball?.common?.palleggio}
                                onChange={(v) => updateBasketballCommon('palleggio', v)}
                            />
                            <AbilitySlider
                                label="Tiro"
                                value={evaluation.basketball?.common?.tiro}
                                onChange={(v) => updateBasketballCommon('tiro', v)}
                            />
                            <AbilitySlider
                                label="Lettura Difensiva"
                                value={evaluation.basketball?.common?.letturaDifensiva}
                                onChange={(v) => updateBasketballCommon('letturaDifensiva', v)}
                            />
                            <AbilitySlider
                                label="Movimento Offensivo"
                                value={evaluation.basketball?.common?.movimentoOffensivo}
                                onChange={(v) => updateBasketballCommon('movimentoOffensivo', v)}
                            />
                        </div>
                    </div>

                    {/* Role Selection */}
                    <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-700">Quale è il tuo ruolo?</label>
                        <select
                            value={selectedBasketballRole}
                            onChange={(e) => {
                                const newRole = e.target.value
                                setSelectedBasketballRole(newRole)
                                updateBasketball('role', newRole)
                            }}
                            className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm text-gray-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                        >
                            <option value="guard">Guardia</option>
                            <option value="wing">Ala</option>
                            <option value="center">Centro</option>
                        </select>
                    </div>

                    {/* Role-Specific Abilities */}
                    {selectedBasketballRole === 'guard' && (
                        <div className="space-y-4">
                            <h4 className="font-semibold text-gray-800 pl-4 border-l-4 border-green-400">
                                Abilità Guardia
                            </h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pl-4">
                                <AbilitySlider
                                    label="Visione di Gioco"
                                    value={evaluation.basketball?.guard?.visioneDiGioco}
                                    onChange={(v) => updateBasketballRole('visioneDiGioco', v)}
                                />
                                <AbilitySlider
                                    label="Gestione Pallone"
                                    value={evaluation.basketball?.guard?.gestionePallone}
                                    onChange={(v) => updateBasketballRole('gestionePallone', v)}
                                />
                            </div>
                        </div>
                    )}

                    {selectedBasketballRole === 'wing' && (
                        <div className="space-y-4">
                            <h4 className="font-semibold text-gray-800 pl-4 border-l-4 border-red-400">
                                Abilità Ala
                            </h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pl-4">
                                <AbilitySlider
                                    label="Versatilità"
                                    value={evaluation.basketball?.wing?.versatilita}
                                    onChange={(v) => updateBasketballRole('versatilita', v)}
                                />
                                <AbilitySlider
                                    label="Atletismo"
                                    value={evaluation.basketball?.wing?.atletismo}
                                    onChange={(v) => updateBasketballRole('atletismo', v)}
                                />
                            </div>
                        </div>
                    )}

                    {selectedBasketballRole === 'center' && (
                        <div className="space-y-4">
                            <h4 className="font-semibold text-gray-800 pl-4 border-l-4 border-purple-400">
                                Abilità Centro
                            </h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pl-4">
                                <AbilitySlider
                                    label="Dominio Area"
                                    value={evaluation.basketball?.center?.dominioArea}
                                    onChange={(v) => updateBasketballRole('dominioArea', v)}
                                />
                                <AbilitySlider
                                    label="Rimbalzo"
                                    value={evaluation.basketball?.center?.rimbalzo}
                                    onChange={(v) => updateBasketballRole('rimbalzo', v)}
                                />
                            </div>
                        </div>
                    )}
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
