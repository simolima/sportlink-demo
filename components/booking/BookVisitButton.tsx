"use client"

import { useRef, useState, useTransition } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { bookAppointment } from '@/app/actions/appointment-actions'

const TIME_SLOTS = [
    '09:00', '10:00', '11:00', '12:00',
    '13:00', '14:00', '15:00', '16:00', '17:00', '18:00',
]

const schema = z.object({
    service: z.string().min(1, 'Seleziona un servizio'),
    date: z
        .string()
        .min(1, 'Seleziona una data')
        .refine((v) => {
            const today = new Date()
            today.setHours(0, 0, 0, 0)
            return new Date(v) >= today
        }, 'La data deve essere oggi o futura'),
    time: z.string().min(1, 'Seleziona un orario'),
    notes: z.string().max(500, 'Le note non possono superare i 500 caratteri').optional(),
})

type FormValues = z.infer<typeof schema>

interface Props {
    studioId: string
    professionalId: string
    services: string[]
    clientProfileId: string
}

export default function BookVisitButton({ studioId, services, clientProfileId }: Props) {
    const dialogRef = useRef<HTMLDialogElement>(null)
    const [isPending, startTransition] = useTransition()
    const [successMsg, setSuccessMsg] = useState<string | null>(null)
    const [errorMsg, setErrorMsg] = useState<string | null>(null)

    const today = new Date().toISOString().split('T')[0]

    const {
        register,
        handleSubmit,
        reset,
        formState: { errors },
    } = useForm<FormValues>({
        resolver: zodResolver(schema),
    })

    const openModal = () => {
        setSuccessMsg(null)
        setErrorMsg(null)
        dialogRef.current?.showModal()
    }

    const closeModal = () => {
        dialogRef.current?.close()
    }

    const onSubmit = (values: FormValues) => {
        const startDt = new Date(`${values.date}T${values.time}:00`)
        const endDt = new Date(startDt.getTime() + 60 * 60 * 1000) // +1 ora

        startTransition(async () => {
            const result = await bookAppointment({
                studioId,
                clientProfileId,
                startTime: startDt.toISOString(),
                endTime: endDt.toISOString(),
                serviceType: values.service,
                notes: values.notes || null,
            })

            if (result.success) {
                setSuccessMsg('Prenotazione inviata con successo! Il professionista riceverà la richiesta.')
                setErrorMsg(null)
                reset()
                closeModal()
            } else {
                setErrorMsg(result.error)
            }
        })
    }

    return (
        <>
            {successMsg && (
                <div className="alert alert-success mt-2 text-sm">
                    <span>{successMsg}</span>
                </div>
            )}

            <button
                type="button"
                className="btn btn-primary btn-sm mt-3"
                onClick={openModal}
            >
                Prenota Visita
            </button>

            <dialog ref={dialogRef} className="modal">
                <div className="modal-box max-w-md">
                    <h3 className="font-bold text-lg mb-4">Prenota una visita</h3>

                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
                        {/* Servizio */}
                        <div className="form-control">
                            <label className="label" htmlFor="book-service">
                                <span className="label-text font-medium">Servizio *</span>
                            </label>
                            <select
                                id="book-service"
                                className="select select-bordered w-full"
                                {...register('service')}
                            >
                                <option value="">Seleziona un servizio</option>
                                {services.map((s) => (
                                    <option key={s} value={s}>{s}</option>
                                ))}
                            </select>
                            {errors.service && (
                                <p className="text-error text-xs mt-1">{errors.service.message}</p>
                            )}
                        </div>

                        {/* Data */}
                        <div className="form-control">
                            <label className="label" htmlFor="book-date">
                                <span className="label-text font-medium">Data *</span>
                            </label>
                            <input
                                id="book-date"
                                type="date"
                                min={today}
                                className="input input-bordered w-full"
                                {...register('date')}
                            />
                            {errors.date && (
                                <p className="text-error text-xs mt-1">{errors.date.message}</p>
                            )}
                        </div>

                        {/* Orario */}
                        <div className="form-control">
                            <label className="label" htmlFor="book-time">
                                <span className="label-text font-medium">Orario *</span>
                            </label>
                            <select
                                id="book-time"
                                className="select select-bordered w-full"
                                {...register('time')}
                            >
                                <option value="">Seleziona un orario</option>
                                {TIME_SLOTS.map((t) => (
                                    <option key={t} value={t}>{t}</option>
                                ))}
                            </select>
                            {errors.time && (
                                <p className="text-error text-xs mt-1">{errors.time.message}</p>
                            )}
                        </div>

                        {/* Note */}
                        <div className="form-control">
                            <label className="label" htmlFor="book-notes">
                                <span className="label-text font-medium">Note (opzionale)</span>
                            </label>
                            <textarea
                                id="book-notes"
                                className="textarea textarea-bordered w-full"
                                rows={3}
                                placeholder="Eventuali note per il professionista..."
                                {...register('notes')}
                            />
                            {errors.notes && (
                                <p className="text-error text-xs mt-1">{errors.notes.message}</p>
                            )}
                        </div>

                        {errorMsg && (
                            <div className="alert alert-error text-sm">
                                <span>{errorMsg}</span>
                            </div>
                        )}

                        <div className="modal-action mt-2">
                            <button
                                type="button"
                                className="btn btn-ghost"
                                onClick={closeModal}
                                disabled={isPending}
                            >
                                Annulla
                            </button>
                            <button
                                type="submit"
                                className="btn btn-primary"
                                disabled={isPending}
                            >
                                {isPending
                                    ? <span className="loading loading-spinner loading-sm" />
                                    : 'Conferma Prenotazione'
                                }
                            </button>
                        </div>
                    </form>
                </div>

                {/* Chiudi cliccando sul backdrop */}
                <form method="dialog" className="modal-backdrop">
                    <button type="submit">close</button>
                </form>
            </dialog>
        </>
    )
}
