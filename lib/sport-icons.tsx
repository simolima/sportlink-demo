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

interface SportIconProps {
    sport: string
    className?: string
}

/**
 * Renders a sport-specific icon for the given sport name.
 * Uses react-icons/gi (GameIcons) for recognisable sport silhouettes.
 * Falls back to GiMedal if no specific icon is found.
 */
export function SportIcon({ sport, className = 'w-5 h-5' }: SportIconProps) {
    const key = sport.toLowerCase().trim()
    const Icon = SPORT_ICON_MAP[key] ?? GiMedal
    return <Icon className={className} />
}
