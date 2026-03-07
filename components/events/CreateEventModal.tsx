'use client'

import { useRef, useTransition } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { PlusIcon, ArrowPathIcon, XMarkIcon } from '@heroicons/react/24/outline'
import {
    createTeamEvent,
    createTeamEventSchema,
    type CreateTeamEventInput,
} from '@/app/actions/team-events-actions'
import type { ProfessionalRole } from '@/lib/types'

/** Ruoli che possono creare eventi per una squadra */
const CAN_CREATE_EVENT: ProfessionalRole[] = [
    'coach',
    'sporting_director',
    'athletic_trainer',
]

interface CreateEventModalProps {
    teamId: string
    activeRole: ProfessionalRole
}

export default function CreateEventModal({ teamId, activeRole }: CreateEventModalProps) {
    // Non mostrare nulla se il ruolo non ha i permessi
    if (!CAN_CREATE_EVENT.includes(activeRole)) return null

    return <ModalInner teamId={teamId} activeRole={activeRole} />
}

// Componente interno separato così i hook sono sempre chiamati, indipendentemente
// dal guard sopra (evita chiamate condizionali di hook).
function ModalInner({ teamId, activeRole }: CreateEventModalProps) {
    const dialogRef = useRef<HTMLDialogElement>(null)
    const [isPending, startTransition] = useTransition()

    const {
        register,
        handleSubmit,
        watch,
        reset,
        setError,
        formState: { errors },
    } = useForm<CreateTeamEventInput>({
        resolver: zodResolver(createTeamEventSchema),
        defaultValues: {
            teamId,
            eventType: 'training',
            title: null,
            dateTime: '',
            location: null,
            description: null,
            opponent: null,
            isHome: null,
        },
    })

    const eventType = watch('eventType')

    function openModal() {
        reset({ teamId, eventType: 'training', title: null, dateTime: '', location: null, description: null, opponent: null, isHome: null })
        dialogRef.current?.showModal()
    }

    function closeModal() {
        dialogRef.current?.close()
    }

    function onSubmit(data: CreateTeamEventInput) {
        startTransition(async () => {
            const result = await createTeamEvent(data)
            if (result.success) {
                closeModal()
            } else {
                // Mostra l'errore del server nel campo "root" del form
                setError('root', { message: result.error })
            }
        })
    }

    // Minimo datetime: now (per l'input datetime-local, usa formato YYYY-MM-DDTHH:mm)
    const minDateTime = new Date(Date.now() + 60_000)
        .toISOString()
        .slice(0, 16)

    return (
        <>
            {/* Bottone che apre il modal */}
            <button
                type="button"
                onClick={openModal}
                className="btn btn-sm gap-1.5 bg-brand-600 text-white hover:bg-brand-700 border-0"
            >
                <PlusIcon className="h-4 w-4" />
                Nuovo evento
            </button>

            {/* Modal DaisyUI — usa il tag <dialog> nativo */}
            <dialog
                ref={dialogRef}
                className="modal modal-bottom sm:modal-middle"
                aria-label="Crea nuovo evento"
            >
                <div className="modal-box w-full max-w-lg">
                    {/* Header */}
                    <div className="flex items-center justify-between mb-5">
                        <h3 className="text-lg font-bold text-gray-900">Crea nuovo evento</h3>
                        <button
                            type="button"
                            onClick={closeModal}
                            className="btn btn-ghost btn-sm btn-circle"
                            aria-label="Chiudi"
                        >
                            <XMarkIcon className="h-5 w-5" />
                        </button>
                    </div>

                    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
                        {/* Tipo evento */}
                        <div className="form-control">
                            <label className="label pb-1">
                                <span className="label-text font-medium">Tipo evento *</span>
                            </label>
                            <div className="flex gap-3">
                                {(['training', 'match'] as const).map((type) => (
                                    <label
                                        key={type}
                                        className={`flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-lg border-2 py-2.5 text-sm font-medium transition-colors
                                            ${eventType === type
                                                ? 'border-brand-500 bg-brand-50 text-brand-700'
                                                : 'border-base-300 bg-white text-gray-600 hover:border-brand-300'
                                            }`}
                                    >
                                        <input
                                            type="radio"
                                            value={type}
                                            className="hidden"
                                            {...register('eventType')}
                                        />
                                        {type === 'training' ? 'Allenamento' : 'Partita'}
                                    </label>
                                ))}
                            </div>
                            {errors.eventType && (
                                <p className="mt-1 text-xs text-error">{errors.eventType.message}</p>
                            )}
                        </div>

                        {/* Titolo (opzionale) */}
                        <div className="form-control">
                            <label className="label pb-1">
                                <span className="label-text font-medium">Titolo</span>
                                <span className="label-text-alt text-gray-400">opzionale</span>
                            </label>
                            <input
                                type="text"
                                placeholder={eventType === 'match' ? 'Es. Semifinale Coppa Italia' : 'Es. Tattica difensiva'}
                                className={`input input-bordered w-full focus:border-brand-500 focus:outline-none text-sm
                                    ${errors.title ? 'input-error' : ''}`}
                                {...register('title')}
                            />
                            {errors.title && (
                                <p className="mt-1 text-xs text-error">{errors.title.message}</p>
                            )}
                        </div>

                        {/* Data e ora */}
                        <div className="form-control">
                            <label className="label pb-1">
                                <span className="label-text font-medium">Data e ora *</span>
                            </label>
                            <input
                                type="datetime-local"
                                min={minDateTime}
                                className={`input input-bordered w-full focus:border-brand-500 focus:outline-none text-sm
                                    ${errors.dateTime ? 'input-error' : ''}`}
                                {...register('dateTime')}
                            />
                            {errors.dateTime && (
                                <p className="mt-1 text-xs text-error">{errors.dateTime.message}</p>
                            )}
                        </div>

                        {/* Luogo */}
                        <div className="form-control">
                            <label className="label pb-1">
                                <span className="label-text font-medium">Luogo</span>
                                <span className="label-text-alt text-gray-400">opzionale</span>
                            </label>
                            <input
                                type="text"
                                placeholder="Es. Campo Centrale, Via Roma 1"
                                className="input input-bordered w-full focus:border-brand-500 focus:outline-none text-sm"
                                {...register('location')}
                            />
                        </div>

                        {/* Campi aggiuntivi per le partite */}
                        {eventType === 'match' && (
                            <div className="space-y-4 rounded-xl border border-base-200 bg-gray-50 p-4">
                                <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                                    Dettagli partita
                                </p>

                                {/* Avversario */}
                                <div className="form-control">
                                    <label className="label pb-1">
                                        <span className="label-text font-medium">Avversario</span>
                                    </label>
                                    <input
                                        type="text"
                                        placeholder="Nome squadra avversaria"
                                        className="input input-bordered bg-white w-full focus:border-brand-500 focus:outline-none text-sm"
                                        {...register('opponent')}
                                    />
                                </div>

                                {/* Casa / Trasferta */}
                                <div className="form-control">
                                    <label className="label pb-1">
                                        <span className="label-text font-medium">Locatione</span>
                                    </label>
                                    <div className="flex gap-3">
                                        {([
                                            { label: 'Casa', value: true },
                                            { label: 'Trasferta', value: false },
                                        ] as const).map(({ label, value }) => {
                                            const isHome = watch('isHome')
                                            return (
                                                <label
                                                    key={label}
                                                    className={`flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-lg border-2 py-2 text-sm font-medium transition-colors
                                                        ${isHome === value
                                                            ? 'border-brand-500 bg-brand-50 text-brand-700'
                                                            : 'border-base-300 bg-white text-gray-600 hover:border-brand-300'
                                                        }`}
                                                >
                                                    <input
                                                        type="radio"
                                                        className="hidden"
                                                        {...register('isHome', {
                                                            setValueAs: (v) => v === 'true' ? true : v === 'false' ? false : null,
                                                        })}
                                                        value={String(value)}
                                                    />
                                                    {label}
                                                </label>
                                            )
                                        })}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Descrizione */}
                        <div className="form-control">
                            <label className="label pb-1">
                                <span className="label-text font-medium">Note</span>
                                <span className="label-text-alt text-gray-400">opzionale</span>
                            </label>
                            <textarea
                                rows={3}
                                placeholder="Indicazioni tattiche, materiale necessario, ecc."
                                className="textarea textarea-bordered w-full focus:border-brand-500 focus:outline-none text-sm resize-none"
                                {...register('description')}
                            />
                            {errors.description && (
                                <p className="mt-1 text-xs text-error">{errors.description.message}</p>
                            )}
                        </div>

                        {/* Errore globale dal server */}
                        {errors.root && (
                            <div className="alert alert-error py-2 text-sm">
                                <span>{errors.root.message}</span>
                            </div>
                        )}

                        {/* Footer azioni */}
                        <div className="modal-action mt-6 flex gap-3">
                            <button
                                type="button"
                                onClick={closeModal}
                                disabled={isPending}
                                className="btn btn-ghost flex-1"
                            >
                                Annulla
                            </button>
                            <button
                                type="submit"
                                disabled={isPending}
                                className="btn flex-1 bg-brand-600 text-white hover:bg-brand-700 border-0 gap-2"
                            >
                                {isPending && (
                                    <ArrowPathIcon className="h-4 w-4 animate-spin" />
                                )}
                                {isPending ? 'Salvataggio…' : 'Crea evento'}
                            </button>
                        </div>
                    </form>
                </div>

                {/* Backdrop — clic fuori chiude il modal */}
                <form method="dialog" className="modal-backdrop">
                    <button type="submit">chiudi</button>
                </form>
            </dialog>
        </>
    )
}
