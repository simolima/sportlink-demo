'use client'

import { useRef, useTransition } from 'react'
import { useForm, useFieldArray } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { PlusIcon, XMarkIcon, ArrowPathIcon, TrashIcon } from '@heroicons/react/24/outline'
import {
    createOrUpdateStudio,
    studioSchema,
    type StudioInput,
} from '@/app/actions/studio-actions'

interface CreateStudioModalProps {
    /** Se fornito, pre-popola il form per la modalità "modifica" */
    existing?: Partial<StudioInput> & { id?: string }
}

export default function CreateStudioModal({ existing }: CreateStudioModalProps) {
    const dialogRef = useRef<HTMLDialogElement>(null)
    const [isPending, startTransition] = useTransition()

    const defaultValues: StudioInput = {
        name: existing?.name ?? '',
        city: existing?.city ?? '',
        address: existing?.address ?? null,
        phone: existing?.phone ?? null,
        website: existing?.website ?? null,
        description: existing?.description ?? null,
        services_offered: existing?.services_offered ?? [''],
    }

    const {
        register,
        handleSubmit,
        control,
        reset,
        setError,
        formState: { errors },
    } = useForm<StudioInput>({
        resolver: zodResolver(studioSchema),
        defaultValues,
    })

    const { fields, append, remove } = useFieldArray({
        // react-hook-form tratta array di stringhe come oggetti internamente;
        // usiamo il cast a any per compatibilità con la firma di useFieldArray.
        control: control as any,
        name: 'services_offered' as any,
    })

    const isEditing = !!existing?.id

    function openModal() {
        reset(defaultValues)
        dialogRef.current?.showModal()
    }

    function closeModal() {
        dialogRef.current?.close()
    }

    function onSubmit(data: StudioInput) {
        startTransition(async () => {
            const result = await createOrUpdateStudio(data)
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
                className="btn btn-sm gap-1.5 bg-green-600 text-white hover:bg-green-700 border-0"
            >
                <PlusIcon className="h-4 w-4" />
                {isEditing ? 'Modifica Studio' : 'Crea il tuo Studio'}
            </button>

            <dialog
                ref={dialogRef}
                className="modal modal-bottom sm:modal-middle"
                aria-label={isEditing ? 'Modifica studio' : 'Crea studio'}
            >
                <div className="modal-box w-full max-w-lg">
                    <div className="flex items-center justify-between mb-5">
                        <h3 className="text-lg font-bold text-gray-900">
                            {isEditing ? 'Modifica il tuo Studio' : 'Crea il tuo Studio'}
                        </h3>
                        <button
                            type="button"
                            onClick={closeModal}
                            disabled={isPending}
                            className="btn btn-ghost btn-sm btn-circle"
                            aria-label="Chiudi"
                        >
                            <XMarkIcon className="h-5 w-5" />
                        </button>
                    </div>

                    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
                        {/* Nome */}
                        <div className="form-control">
                            <label className="label pb-1">
                                <span className="label-text font-medium">Nome studio *</span>
                            </label>
                            <input
                                type="text"
                                placeholder="Es. Studio Fisio Milano"
                                className={`input input-bordered w-full focus:border-green-500 focus:outline-none text-sm ${errors.name ? 'input-error' : ''}`}
                                {...register('name')}
                            />
                            {errors.name && <p className="mt-1 text-xs text-error">{errors.name.message}</p>}
                        </div>

                        {/* Città */}
                        <div className="form-control">
                            <label className="label pb-1">
                                <span className="label-text font-medium">Città *</span>
                            </label>
                            <input
                                type="text"
                                placeholder="Es. Milano"
                                className={`input input-bordered w-full focus:border-green-500 focus:outline-none text-sm ${errors.city ? 'input-error' : ''}`}
                                {...register('city')}
                            />
                            {errors.city && <p className="mt-1 text-xs text-error">{errors.city.message}</p>}
                        </div>

                        {/* Indirizzo */}
                        <div className="form-control">
                            <label className="label pb-1">
                                <span className="label-text font-medium">Indirizzo</span>
                                <span className="label-text-alt text-gray-400">opzionale</span>
                            </label>
                            <input
                                type="text"
                                placeholder="Es. Via Roma 1, 20121"
                                className="input input-bordered w-full focus:border-green-500 focus:outline-none text-sm"
                                {...register('address')}
                            />
                        </div>

                        {/* Telefono + Sito web — affiancati */}
                        <div className="grid grid-cols-2 gap-3">
                            <div className="form-control">
                                <label className="label pb-1">
                                    <span className="label-text font-medium">Telefono</span>
                                </label>
                                <input
                                    type="tel"
                                    placeholder="+39 02 1234567"
                                    className="input input-bordered w-full focus:border-green-500 focus:outline-none text-sm"
                                    {...register('phone')}
                                />
                            </div>
                            <div className="form-control">
                                <label className="label pb-1">
                                    <span className="label-text font-medium">Sito web</span>
                                </label>
                                <input
                                    type="url"
                                    placeholder="https://…"
                                    className={`input input-bordered w-full focus:border-green-500 focus:outline-none text-sm ${errors.website ? 'input-error' : ''}`}
                                    {...register('website')}
                                />
                                {errors.website && <p className="mt-1 text-xs text-error">{errors.website.message}</p>}
                            </div>
                        </div>

                        {/* Servizi offerti — array dinamico */}
                        <div className="form-control">
                            <label className="label pb-1">
                                <span className="label-text font-medium">Servizi offerti *</span>
                            </label>
                            <div className="space-y-2">
                                {fields.map((field, index) => (
                                    <div key={field.id} className="flex gap-2">
                                        <input
                                            type="text"
                                            placeholder={`Es. ${['Fisioterapia', 'Massoterapia', 'Tecar', 'Osteopatia'][index] ?? 'Servizio'}`}
                                            className="input input-bordered flex-1 focus:border-green-500 focus:outline-none text-sm"
                                            {...register(`services_offered.${index}` as const)}
                                        />
                                        {fields.length > 1 && (
                                            <button
                                                type="button"
                                                onClick={() => remove(index)}
                                                className="btn btn-ghost btn-sm btn-circle text-gray-400 hover:text-error"
                                                aria-label="Rimuovi servizio"
                                            >
                                                <TrashIcon className="h-4 w-4" />
                                            </button>
                                        )}
                                    </div>
                                ))}
                                {errors.services_offered && (
                                    <p className="text-xs text-error">
                                        {(errors.services_offered as any)?.message ?? 'Controlla i servizi inseriti'}
                                    </p>
                                )}
                            </div>
                            {fields.length < 20 && (
                                <button
                                    type="button"
                                    onClick={() => append('' as any)}
                                    className="btn btn-ghost btn-xs mt-2 gap-1 text-green-600 hover:text-green-700 w-fit"
                                >
                                    <PlusIcon className="h-3.5 w-3.5" />
                                    Aggiungi servizio
                                </button>
                            )}
                        </div>

                        {/* Descrizione */}
                        <div className="form-control">
                            <label className="label pb-1">
                                <span className="label-text font-medium">Descrizione</span>
                                <span className="label-text-alt text-gray-400">opzionale</span>
                            </label>
                            <textarea
                                rows={3}
                                placeholder="Presenta il tuo studio, metodologie, specializzazioni…"
                                className="textarea textarea-bordered w-full focus:border-green-500 focus:outline-none text-sm resize-none"
                                {...register('description')}
                            />
                        </div>

                        {/* Errore globale server */}
                        {errors.root && (
                            <div className="alert alert-error py-2 text-sm">
                                <span>{errors.root.message}</span>
                            </div>
                        )}

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
                                className="btn flex-1 bg-green-600 text-white hover:bg-green-700 border-0 gap-2"
                            >
                                {isPending && <ArrowPathIcon className="h-4 w-4 animate-spin" />}
                                {isPending ? 'Salvataggio…' : isEditing ? 'Salva modifiche' : 'Crea Studio'}
                            </button>
                        </div>
                    </form>
                </div>

                <form method="dialog" className="modal-backdrop">
                    <button type="submit">chiudi</button>
                </form>
            </dialog>
        </>
    )
}
