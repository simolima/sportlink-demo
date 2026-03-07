'use client'

import { useRef, useTransition } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { PlusIcon, XMarkIcon, ArrowPathIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline'
import {
    reportInjury,
    reportInjurySchema,
    INJURY_TYPES,
    INJURY_SEVERITIES,
    type ReportInjuryInput,
} from '@/app/actions/injury-actions'

interface Props {
    athleteId: string
}

const SEVERITY_LABELS: Record<string, string> = {
    Lieve: '🟡 Lieve',
    Moderato: '🟠 Moderato',
    Grave: '🔴 Grave',
}

export default function ReportInjuryModal({ athleteId }: Props) {
    const dialogRef = useRef<HTMLDialogElement>(null)
    const [isPending, startTransition] = useTransition()

    const {
        register,
        handleSubmit,
        reset,
        setError,
        formState: { errors },
    } = useForm<ReportInjuryInput>({
        resolver: zodResolver(reportInjurySchema),
        defaultValues: {
            athleteProfileId: athleteId,
            injuryType: 'Muscolare',
            bodyPart: '',
            severity: 'Lieve',
            startDate: new Date().toISOString().slice(0, 10),
            expectedReturnDate: '',
            notes: '',
        },
    })

    function openModal() {
        reset({
            athleteProfileId: athleteId,
            injuryType: 'Muscolare',
            bodyPart: '',
            severity: 'Lieve',
            startDate: new Date().toISOString().slice(0, 10),
            expectedReturnDate: '',
            notes: '',
        })
        dialogRef.current?.showModal()
    }

    function closeModal() {
        dialogRef.current?.close()
    }

    function onSubmit(data: ReportInjuryInput) {
        startTransition(async () => {
            // Normalizza i campi opzionali vuoti → null
            const payload: ReportInjuryInput = {
                ...data,
                bodyPart: data.bodyPart?.trim() || null,
                expectedReturnDate: data.expectedReturnDate?.trim() || null,
                notes: data.notes?.trim() || null,
            }
            const result = await reportInjury(payload)
            if (result.success) {
                closeModal()
            } else {
                setError('root', { message: result.error })
            }
        })
    }

    return (
        <>
            <button
                type="button"
                onClick={openModal}
                className="btn btn-sm gap-1.5 border-red-400 text-red-600 hover:bg-red-50 hover:border-red-500 bg-white"
            >
                <ExclamationTriangleIcon className="h-4 w-4" />
                Segnala Infortunio
            </button>

            <dialog
                ref={dialogRef}
                className="modal modal-bottom sm:modal-middle"
                aria-label="Segnala infortunio"
            >
                <div className="modal-box w-full max-w-lg">
                    {/* Header */}
                    <div className="flex items-center justify-between mb-5">
                        <div>
                            <h3 className="text-lg font-bold text-gray-900">Segnala Infortunio</h3>
                            <p className="text-xs text-gray-400 mt-0.5">
                                Solo informazioni funzionali — nessun dato clinico.
                            </p>
                        </div>
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
                        <input type="hidden" {...register('athleteProfileId')} />

                        {/* Tipo infortunio */}
                        <div>
                            <label className="label pb-1">
                                <span className="label-text font-medium">Tipo infortunio *</span>
                            </label>
                            <select
                                {...register('injuryType')}
                                className="select select-bordered w-full focus:border-red-400 focus:outline-none"
                            >
                                {INJURY_TYPES.map((t) => (
                                    <option key={t} value={t}>
                                        {t}
                                    </option>
                                ))}
                            </select>
                            {errors.injuryType && (
                                <p className="text-red-500 text-xs mt-1">{errors.injuryType.message}</p>
                            )}
                        </div>

                        {/* Parte del corpo + Gravità — riga a 2 colonne */}
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="label pb-1">
                                    <span className="label-text font-medium">Parte del corpo</span>
                                    <span className="label-text-alt text-gray-400">opz.</span>
                                </label>
                                <input
                                    {...register('bodyPart')}
                                    placeholder="es. Ginocchio destro"
                                    className="input input-bordered w-full focus:border-red-400 focus:outline-none"
                                />
                                {errors.bodyPart && (
                                    <p className="text-red-500 text-xs mt-1">{errors.bodyPart.message}</p>
                                )}
                            </div>

                            <div>
                                <label className="label pb-1">
                                    <span className="label-text font-medium">Gravità *</span>
                                </label>
                                <select
                                    {...register('severity')}
                                    className="select select-bordered w-full focus:border-red-400 focus:outline-none"
                                >
                                    {INJURY_SEVERITIES.map((s) => (
                                        <option key={s} value={s}>
                                            {SEVERITY_LABELS[s] ?? s}
                                        </option>
                                    ))}
                                </select>
                                {errors.severity && (
                                    <p className="text-red-500 text-xs mt-1">{errors.severity.message}</p>
                                )}
                            </div>
                        </div>

                        {/* Date — riga a 2 colonne */}
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="label pb-1">
                                    <span className="label-text font-medium">Data inizio *</span>
                                </label>
                                <input
                                    type="date"
                                    {...register('startDate')}
                                    className="input input-bordered w-full focus:border-red-400 focus:outline-none"
                                />
                                {errors.startDate && (
                                    <p className="text-red-500 text-xs mt-1">{errors.startDate.message}</p>
                                )}
                            </div>

                            <div>
                                <label className="label pb-1">
                                    <span className="label-text font-medium">Rientro stimato</span>
                                    <span className="label-text-alt text-gray-400">opz.</span>
                                </label>
                                <input
                                    type="date"
                                    {...register('expectedReturnDate')}
                                    className="input input-bordered w-full focus:border-red-400 focus:outline-none"
                                />
                                {errors.expectedReturnDate && (
                                    <p className="text-red-500 text-xs mt-1">
                                        {errors.expectedReturnDate.message}
                                    </p>
                                )}
                            </div>
                        </div>

                        {/* Note */}
                        <div>
                            <label className="label pb-1">
                                <span className="label-text font-medium">Note</span>
                                <span className="label-text-alt text-gray-400">opz. — max 800 caratteri</span>
                            </label>
                            <textarea
                                {...register('notes')}
                                rows={3}
                                placeholder="Indicazioni funzionali sui tempi di recupero..."
                                className="textarea textarea-bordered w-full resize-none focus:border-red-400 focus:outline-none text-sm"
                            />
                            {errors.notes && (
                                <p className="text-red-500 text-xs mt-1">{errors.notes.message}</p>
                            )}
                        </div>

                        {/* Errore server */}
                        {errors.root && (
                            <div className="alert alert-error text-sm py-2 px-3">
                                <ExclamationTriangleIcon className="h-4 w-4 flex-shrink-0" />
                                <span>{errors.root.message}</span>
                            </div>
                        )}

                        <div className="modal-action mt-2 pt-2 border-t border-base-200">
                            <button
                                type="button"
                                onClick={closeModal}
                                className="btn btn-ghost"
                                disabled={isPending}
                            >
                                Annulla
                            </button>
                            <button
                                type="submit"
                                disabled={isPending}
                                className="btn bg-red-600 text-white hover:bg-red-700 border-0 gap-1.5"
                            >
                                {isPending && <ArrowPathIcon className="h-4 w-4 animate-spin" />}
                                Segnala
                            </button>
                        </div>
                    </form>
                </div>

                <form method="dialog" className="modal-backdrop">
                    <button>chiudi</button>
                </form>
            </dialog>
        </>
    )
}
