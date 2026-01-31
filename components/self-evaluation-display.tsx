'use client'
import React from 'react'
import { StarIcon } from '@heroicons/react/24/solid'

interface AbilityBarProps {
    label: string
    value: number
    max?: number
}

const AbilityBar = ({ label, value, max = 5 }: AbilityBarProps) => {
    const percentage = (value / max) * 100

    return (
        <div className="space-y-2">
            <div className="flex justify-between items-center">
                <label className="text-sm font-medium text-gray-700">{label}</label>
                <div className="flex items-center gap-1">
                    <span className="text-sm font-semibold text-gray-900">{value}/5</span>
                    <div className="flex gap-0.5">
                        {Array.from({ length: 5 }).map((_, i) => (
                            <StarIcon
                                key={i}
                                className={`w-4 h-4 ${i < value ? 'text-yellow-400' : 'text-gray-300'
                                    }`}
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

    return (
        <div className={`space-y-8 ${className}`}>
            {/* UNIVERSAL ABILITIES */}
            {evaluation.universal && Object.keys(evaluation.universal).length > 0 && (
                <section className="space-y-4">
                    <div className="border-b-2 border-gray-200 pb-2">
                        <h3 className="text-lg font-bold text-gray-900">Abilità Universali</h3>
                    </div>
                    <div className="space-y-3">
                        {evaluation.universal.velocita !== undefined && (
                            <AbilityBar label="Velocità" value={evaluation.universal.velocita} />
                        )}
                        {evaluation.universal.resistenza !== undefined && (
                            <AbilityBar label="Resistenza" value={evaluation.universal.resistenza} />
                        )}
                        {evaluation.universal.comunicazione !== undefined && (
                            <AbilityBar label="Comunicazione" value={evaluation.universal.comunicazione} />
                        )}
                        {evaluation.universal.intelligenzaTattica !== undefined && (
                            <AbilityBar label="Intelligenza Tattica" value={evaluation.universal.intelligenzaTattica} />
                        )}
                        {evaluation.universal.movimentoSenzaPalla !== undefined && (
                            <AbilityBar label="Movimento Senza Palla" value={evaluation.universal.movimentoSenzaPalla} />
                        )}
                        {evaluation.universal.concentrazione !== undefined && (
                            <AbilityBar label="Concentrazione" value={evaluation.universal.concentrazione} />
                        )}
                    </div>
                </section>
            )}

            {/* FOOTBALL ABILITIES */}
            {isPlayer && mainSport === 'Calcio' && evaluation.football && (
                <section className="space-y-4">
                    <div className="border-b-2 border-gray-200 pb-2">
                        <h3 className="text-lg font-bold text-gray-900">Abilità Calcio</h3>
                    </div>

                    {/* Common */}
                    {evaluation.football.common && Object.keys(evaluation.football.common).length > 0 && (
                        <div className="space-y-3 pl-4 border-l-4 border-blue-400">
                            <h4 className="font-semibold text-gray-800">Abilità Comuni</h4>
                            {evaluation.football.common.controlPalla !== undefined && (
                                <AbilityBar label="Controllo Palla" value={evaluation.football.common.controlPalla} />
                            )}
                            {evaluation.football.common.passaggio !== undefined && (
                                <AbilityBar label="Passaggio" value={evaluation.football.common.passaggio} />
                            )}
                            {evaluation.football.common.tiro !== undefined && (
                                <AbilityBar label="Tiro" value={evaluation.football.common.tiro} />
                            )}
                            {evaluation.football.common.visioneDiGioco !== undefined && (
                                <AbilityBar label="Visione di Gioco" value={evaluation.football.common.visioneDiGioco} />
                            )}
                        </div>
                    )}

                    {/* Role-Specific */}
                    {evaluation.football.role === 'attacker' && evaluation.football.attacker && (
                        <div className="space-y-3 pl-4 border-l-4 border-red-400">
                            <h4 className="font-semibold text-gray-800">Abilità Attaccante</h4>
                            {evaluation.football.attacker.efficaciaSottoporta !== undefined && (
                                <AbilityBar label="Efficacia Sottoporta" value={evaluation.football.attacker.efficaciaSottoporta} />
                            )}
                            {evaluation.football.attacker.posizionamentoOffensivo !== undefined && (
                                <AbilityBar label="Posizionamento Offensivo" value={evaluation.football.attacker.posizionamentoOffensivo} />
                            )}
                        </div>
                    )}

                    {evaluation.football.role === 'midfielder' && evaluation.football.midfielder && (
                        <div className="space-y-3 pl-4 border-l-4 border-green-400">
                            <h4 className="font-semibold text-gray-800">Abilità Centrocampista</h4>
                            {evaluation.football.midfielder.distribuzione !== undefined && (
                                <AbilityBar label="Distribuzione" value={evaluation.football.midfielder.distribuzione} />
                            )}
                            {evaluation.football.midfielder.coperturaDifensiva !== undefined && (
                                <AbilityBar label="Copertura Difensiva" value={evaluation.football.midfielder.coperturaDifensiva} />
                            )}
                            {evaluation.football.midfielder.verticalizzazione !== undefined && (
                                <AbilityBar label="Verticalizzazione" value={evaluation.football.midfielder.verticalizzazione} />
                            )}
                        </div>
                    )}

                    {evaluation.football.role === 'defender' && evaluation.football.defender && (
                        <div className="space-y-3 pl-4 border-l-4 border-purple-400">
                            <h4 className="font-semibold text-gray-800">Abilità Difensore</h4>
                            {evaluation.football.defender.marcatura !== undefined && (
                                <AbilityBar label="Marcatura" value={evaluation.football.defender.marcatura} />
                            )}
                            {evaluation.football.defender.posizionamentoDifensivo !== undefined && (
                                <AbilityBar label="Posizionamento Difensivo" value={evaluation.football.defender.posizionamentoDifensivo} />
                            )}
                            {evaluation.football.defender.anticipo !== undefined && (
                                <AbilityBar label="Anticipo" value={evaluation.football.defender.anticipo} />
                            )}
                        </div>
                    )}

                    {evaluation.football.role === 'goalkeeper' && evaluation.football.goalkeeper && (
                        <div className="space-y-3 pl-4 border-l-4 border-yellow-400">
                            <h4 className="font-semibold text-gray-800">Abilità Portiere</h4>
                            {evaluation.football.goalkeeper.reattivita !== undefined && (
                                <AbilityBar label="Reattività" value={evaluation.football.goalkeeper.reattivita} />
                            )}
                            {evaluation.football.goalkeeper.posizionamento !== undefined && (
                                <AbilityBar label="Posizionamento" value={evaluation.football.goalkeeper.posizionamento} />
                            )}
                            {evaluation.football.goalkeeper.giocoConPiedi !== undefined && (
                                <AbilityBar label="Gioco coi Piedi" value={evaluation.football.goalkeeper.giocoConPiedi} />
                            )}
                            {evaluation.football.goalkeeper.distribuzione !== undefined && (
                                <AbilityBar label="Distribuzione" value={evaluation.football.goalkeeper.distribuzione} />
                            )}
                            {evaluation.football.goalkeeper.usciteAeree !== undefined && (
                                <AbilityBar label="Uscite Aeree" value={evaluation.football.goalkeeper.usciteAeree} />
                            )}
                            {evaluation.football.goalkeeper.presaSicura !== undefined && (
                                <AbilityBar label="Presa Sicura" value={evaluation.football.goalkeeper.presaSicura} />
                            )}
                        </div>
                    )}
                </section>
            )}

            {/* VOLLEYBALL ABILITIES */}
            {isPlayer && mainSport === 'Pallavolo' && evaluation.volleyball && (
                <section className="space-y-4">
                    <div className="border-b-2 border-gray-200 pb-2">
                        <h3 className="text-lg font-bold text-gray-900">Abilità Pallavolo</h3>
                    </div>

                    {evaluation.volleyball.common && Object.keys(evaluation.volleyball.common).length > 0 && (
                        <div className="space-y-3 pl-4 border-l-4 border-blue-400">
                            <h4 className="font-semibold text-gray-800">Abilità Comuni</h4>
                            {evaluation.volleyball.common.ricezione !== undefined && (
                                <AbilityBar label="Ricezione" value={evaluation.volleyball.common.ricezione} />
                            )}
                            {evaluation.volleyball.common.posizionamento !== undefined && (
                                <AbilityBar label="Posizionamento" value={evaluation.volleyball.common.posizionamento} />
                            )}
                            {evaluation.volleyball.common.salto !== undefined && (
                                <AbilityBar label="Salto" value={evaluation.volleyball.common.salto} />
                            )}
                            {evaluation.volleyball.common.reattivita !== undefined && (
                                <AbilityBar label="Reattività" value={evaluation.volleyball.common.reattivita} />
                            )}
                        </div>
                    )}

                    {evaluation.volleyball.role === 'setter' && evaluation.volleyball.setter && (
                        <div className="space-y-3 pl-4 border-l-4 border-green-400">
                            <h4 className="font-semibold text-gray-800">Abilità Palleggiatore</h4>
                            {evaluation.volleyball.setter.distribuzione !== undefined && (
                                <AbilityBar label="Distribuzione" value={evaluation.volleyball.setter.distribuzione} />
                            )}
                            {evaluation.volleyball.setter.letturaDelGioco !== undefined && (
                                <AbilityBar label="Lettura del Gioco" value={evaluation.volleyball.setter.letturaDelGioco} />
                            )}
                            {evaluation.volleyball.setter.rapiditaEsecutiva !== undefined && (
                                <AbilityBar label="Rapidità Esecutiva" value={evaluation.volleyball.setter.rapiditaEsecutiva} />
                            )}
                        </div>
                    )}

                    {evaluation.volleyball.role === 'spiker' && evaluation.volleyball.spiker && (
                        <div className="space-y-3 pl-4 border-l-4 border-red-400">
                            <h4 className="font-semibold text-gray-800">Abilità Schiacciatore</h4>
                            {evaluation.volleyball.spiker.potenzaAttacco !== undefined && (
                                <AbilityBar label="Potenza d'Attacco" value={evaluation.volleyball.spiker.potenzaAttacco} />
                            )}
                            {evaluation.volleyball.spiker.timingSalto !== undefined && (
                                <AbilityBar label="Timing Salto" value={evaluation.volleyball.spiker.timingSalto} />
                            )}
                            {evaluation.volleyball.spiker.fiutoAttacco !== undefined && (
                                <AbilityBar label="Fiuto d'Attacco" value={evaluation.volleyball.spiker.fiutoAttacco} />
                            )}
                        </div>
                    )}

                    {evaluation.volleyball.role === 'middle' && evaluation.volleyball.middle && (
                        <div className="space-y-3 pl-4 border-l-4 border-purple-400">
                            <h4 className="font-semibold text-gray-800">Abilità Centrale</h4>
                            {evaluation.volleyball.middle.muro !== undefined && (
                                <AbilityBar label="Muro" value={evaluation.volleyball.middle.muro} />
                            )}
                            {evaluation.volleyball.middle.attaccoDaPost3 !== undefined && (
                                <AbilityBar label="Attacco da Posto 3" value={evaluation.volleyball.middle.attaccoDaPost3} />
                            )}
                        </div>
                    )}

                    {evaluation.volleyball.role === 'libero' && evaluation.volleyball.libero && (
                        <div className="space-y-3 pl-4 border-l-4 border-yellow-400">
                            <h4 className="font-semibold text-gray-800">Abilità Libero</h4>
                            {evaluation.volleyball.libero.ricezioneSpecializzata !== undefined && (
                                <AbilityBar label="Ricezione Specializzata" value={evaluation.volleyball.libero.ricezioneSpecializzata} />
                            )}
                            {evaluation.volleyball.libero.difesaBassa !== undefined && (
                                <AbilityBar label="Difesa Bassa" value={evaluation.volleyball.libero.difesaBassa} />
                            )}
                        </div>
                    )}
                </section>
            )}

            {/* BASKETBALL ABILITIES */}
            {isPlayer && mainSport === 'Basket' && evaluation.basketball && (
                <section className="space-y-4">
                    <div className="border-b-2 border-gray-200 pb-2">
                        <h3 className="text-lg font-bold text-gray-900">Abilità Basketball</h3>
                    </div>

                    {evaluation.basketball.common && Object.keys(evaluation.basketball.common).length > 0 && (
                        <div className="space-y-3 pl-4 border-l-4 border-blue-400">
                            <h4 className="font-semibold text-gray-800">Abilità Comuni</h4>
                            {evaluation.basketball.common.palleggio !== undefined && (
                                <AbilityBar label="Palleggio" value={evaluation.basketball.common.palleggio} />
                            )}
                            {evaluation.basketball.common.tiro !== undefined && (
                                <AbilityBar label="Tiro" value={evaluation.basketball.common.tiro} />
                            )}
                            {evaluation.basketball.common.letturaDifensiva !== undefined && (
                                <AbilityBar label="Lettura Difensiva" value={evaluation.basketball.common.letturaDifensiva} />
                            )}
                            {evaluation.basketball.common.movimentoOffensivo !== undefined && (
                                <AbilityBar label="Movimento Offensivo" value={evaluation.basketball.common.movimentoOffensivo} />
                            )}
                        </div>
                    )}

                    {evaluation.basketball.role === 'guard' && evaluation.basketball.guard && (
                        <div className="space-y-3 pl-4 border-l-4 border-green-400">
                            <h4 className="font-semibold text-gray-800">Abilità Guardia</h4>
                            {evaluation.basketball.guard.visioneDiGioco !== undefined && (
                                <AbilityBar label="Visione di Gioco" value={evaluation.basketball.guard.visioneDiGioco} />
                            )}
                            {evaluation.basketball.guard.gestionePallone !== undefined && (
                                <AbilityBar label="Gestione Pallone" value={evaluation.basketball.guard.gestionePallone} />
                            )}
                        </div>
                    )}

                    {evaluation.basketball.role === 'wing' && evaluation.basketball.wing && (
                        <div className="space-y-3 pl-4 border-l-4 border-red-400">
                            <h4 className="font-semibold text-gray-800">Abilità Ala</h4>
                            {evaluation.basketball.wing.versatilita !== undefined && (
                                <AbilityBar label="Versatilità" value={evaluation.basketball.wing.versatilita} />
                            )}
                            {evaluation.basketball.wing.atletismo !== undefined && (
                                <AbilityBar label="Atletismo" value={evaluation.basketball.wing.atletismo} />
                            )}
                        </div>
                    )}

                    {evaluation.basketball.role === 'center' && evaluation.basketball.center && (
                        <div className="space-y-3 pl-4 border-l-4 border-purple-400">
                            <h4 className="font-semibold text-gray-800">Abilità Centro</h4>
                            {evaluation.basketball.center.dominioArea !== undefined && (
                                <AbilityBar label="Dominio Area" value={evaluation.basketball.center.dominioArea} />
                            )}
                            {evaluation.basketball.center.rimbalzo !== undefined && (
                                <AbilityBar label="Rimbalzo" value={evaluation.basketball.center.rimbalzo} />
                            )}
                        </div>
                    )}
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
