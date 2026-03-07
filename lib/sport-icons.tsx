import { GiSoccerBall, GiBasketballBall, GiVolleyballBall, GiTrophy, GiMedal } from 'react-icons/gi'

const SPORT_ICON_MAP: Record<string, React.ElementType> = {
    calcio: GiSoccerBall,
    football: GiSoccerBall,
    soccer: GiSoccerBall,
    basket: GiBasketballBall,
    basketball: GiBasketballBall,
    pallacanestro: GiBasketballBall,
    pallavolo: GiVolleyballBall,
    volleyball: GiVolleyballBall,
    volley: GiVolleyballBall,
    'multi-sport': GiTrophy,
    multisport: GiTrophy,
}

// Sport-specific color classes (DaisyUI semantics + standard Tailwind, no green-*/emerald-*)
const SPORT_COLOR_MAP: Record<string, string> = {
    calcio: 'text-success',
    football: 'text-success',
    soccer: 'text-success',
    basket: 'text-orange-400',
    basketball: 'text-orange-400',
    pallacanestro: 'text-orange-400',
    pallavolo: 'text-blue-400',
    volleyball: 'text-blue-400',
    volley: 'text-blue-400',
    'multi-sport': 'text-brand-400',
    multisport: 'text-brand-400',
}

export function getSportColorClass(sport: string): string {
    const key = sport.toLowerCase().trim()
    return SPORT_COLOR_MAP[key] ?? 'text-white/80'
}

interface SportIconProps {
    sport: string
    className?: string
    colored?: boolean
}

/**
 * Renders a sport-specific icon for the given sport name.
 * Uses react-icons/gi (GameIcons) for recognisable sport silhouettes.
 * Falls back to GiMedal if no specific icon is found.
 * Pass colored={true} to apply sport-specific brand colors.
 */
export function SportIcon({ sport, className = 'w-5 h-5', colored = false }: SportIconProps) {
    const key = sport.toLowerCase().trim()
    const Icon = SPORT_ICON_MAP[key] ?? GiMedal
    const colorClass = colored ? getSportColorClass(sport) : ''
    return <Icon className={`${className} ${colorClass}`.trim()} />
}
