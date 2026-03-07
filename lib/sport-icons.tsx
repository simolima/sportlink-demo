import { CircleDot, Dribbble, Circle, Layers, Medal } from 'lucide-react'

const SPORT_ICON_MAP: Record<string, React.ElementType> = {
    calcio: CircleDot,
    football: CircleDot,
    soccer: CircleDot,
    basket: Dribbble,
    basketball: Dribbble,
    pallacanestro: Dribbble,
    pallavolo: Circle,
    volleyball: Circle,
    volley: Circle,
    'multi-sport': Layers,
    multisport: Layers,
}

interface SportIconProps {
    sport: string
    className?: string
}

/**
 * Renders a Lucide icon representing the given sport name.
 * Falls back to Medal if no specific icon is found.
 */
export function SportIcon({ sport, className = 'w-5 h-5' }: SportIconProps) {
    const key = sport.toLowerCase().trim()
    const Icon = SPORT_ICON_MAP[key] ?? Medal
    return <Icon className={className} />
}
