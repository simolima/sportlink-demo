'use client'

import { useTransition } from 'react'
import { CheckCircleIcon, ArrowPathIcon } from '@heroicons/react/24/outline'
import { resolveInjury } from '@/app/actions/injury-actions'

interface Props {
    injuryId: string
    athleteId: string
}

export default function ResolveInjuryButton({ injuryId }: Props) {
    const [isPending, startTransition] = useTransition()

    function handleResolve() {
        startTransition(async () => {
            await resolveInjury(injuryId)
        })
    }

    return (
        <button
            type="button"
            onClick={handleResolve}
            disabled={isPending}
            className="btn btn-xs btn-outline border-brand-500 text-brand-600 hover:bg-brand-50 hover:border-brand-600 gap-1"
            title="Segna come Guarito"
        >
            {isPending ? (
                <ArrowPathIcon className="h-3 w-3 animate-spin" />
            ) : (
                <CheckCircleIcon className="h-3 w-3" />
            )}
            Guarito
        </button>
    )
}
