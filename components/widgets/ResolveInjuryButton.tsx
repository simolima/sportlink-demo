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
            className="btn btn-xs btn-outline border-green-500 text-green-600 hover:bg-green-50 hover:border-green-600 gap-1"
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
