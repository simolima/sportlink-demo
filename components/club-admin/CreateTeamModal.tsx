'use client'

import { useRef, useTransition } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { PlusIcon, XMarkIcon, ArrowPathIcon } from '@heroicons/react/24/outline'
import {
    createTeam,
    createTeamSchema,
    type CreateTeamInput,
} from '@/app/actions/team-management-actions'

interface Props {
    clubId: string
    userId: string
    onCreated?: () => void
}

export default function CreateTeamModal({ clubId, userId, onCreated }: Props) {
    const dialogRef = useRef<HTMLDialogElement>(null)
    const [isPending, startTransition] = useTransition()

    const {
        register,
        handleSubmit,
        reset,
        setError,
        formState: { errors },
    } = useForm<CreateTeamInput>({
        resolver: zodResolver(createTeamSchema),
        defaultValues: { clubId, name: '', category: '', season: '' },
    })

    function openModal() {
        reset({ clubId, name: '', category: '', season: '' })
        dialogRef.current?.showModal()
    }

    function closeModal() {
        dialogRef.current?.close()
    }

    function onSubmit(data: CreateTeamInput) {
        startTransition(async () => {
            const result = await createTeam(data, userId)
            if (result.success) {
                closeModal()
                onCreated?.()
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
                className="btn btn-sm gap-1.5 bg-green-600 text-white hover:bg-green-700 border-0"
            >
                <PlusIcon className="h-4 w-4" />
                Crea Squadra
            </button>

            <dialog
                ref={dialogRef}
                className="modal modal-bottom sm:modal-middle"
                aria-label="Crea nuova squadra"
            >
                <div className="modal-box w-full max-w-md">
                    {/* Header */}
                    <div className="flex items-center justify-between mb-5">
                        <h3 className="text-lg font-bold text-gray-900">Nuova Squadra</h3>
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
                        <input type="hidden" {...register('clubId')} />

                        {/* Nome */}
                        <div>
                            <label className="label pb-1">
                                <span className="label-text font-medium">Nome squadra *</span>
                            </label>
                            <input
                                {...register('name')}
                                placeholder="es. Prima Squadra, Under 19, Femminile..."
                                className="input input-bordered w-full focus:border-green-500 focus:outline-none"
                                autoFocus
                            />
                            {errors.name && (
                                <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>
                            )}
                        </div>

                        {/* Categoria */}
                        <div>
                            <label className="label pb-1">
                                <span className="label-text font-medium">Categoria</span>
                                <span className="label-text-alt text-gray-400">opzionale</span>
                            </label>
                            <input
                                {...register('category')}
                                placeholder="es. Eccellenza, Serie C, Promozione..."
                                className="input input-bordered w-full focus:border-green-500 focus:outline-none"
                            />
                        </div>

                        {/* Stagione */}
                        <div>
                            <label className="label pb-1">
                                <span className="label-text font-medium">Stagione</span>
                                <span className="label-text-alt text-gray-400">opzionale</span>
                            </label>
                            <input
                                {...register('season')}
                                placeholder="es. 2025/2026"
                                className="input input-bordered w-full focus:border-green-500 focus:outline-none"
                            />
                        </div>

                        {/* Errore server */}
                        {errors.root && (
                            <div className="alert alert-error text-sm py-2 px-3">
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
                                className="btn bg-green-600 text-white hover:bg-green-700 border-0 gap-1.5"
                            >
                                {isPending && <ArrowPathIcon className="h-4 w-4 animate-spin" />}
                                Crea Squadra
                            </button>
                        </div>
                    </form>
                </div>

                {/* Chiudi cliccando fuori */}
                <form method="dialog" className="modal-backdrop">
                    <button>chiudi</button>
                </form>
            </dialog>
        </>
    )
}
