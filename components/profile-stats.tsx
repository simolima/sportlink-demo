'use client'

interface StatItemProps {
    label: string
    value: string | number
    maxValue?: number
    color?: string
}

function StatItem({ label, value, maxValue, color = 'blue' }: StatItemProps) {
    const percentage = maxValue ? (Number(value) / maxValue) * 100 : 0

    const colorClasses = {
        blue: 'bg-primary',
        purple: 'bg-purple-500',
        success: 'bg-success',
        orange: 'bg-warning'
    }

    return (
        <div className="space-y-2">
            <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-700">{label}</span>
                <span className="text-lg font-bold text-gray-900">{value}</span>
            </div>
            {maxValue && (
                <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                        className={`h-2 rounded-full ${colorClasses[color as keyof typeof colorClasses] || colorClasses.blue}`}
                        style={{ width: `${Math.min(percentage, 100)}%` }}
                    />
                </div>
            )}
        </div>
    )
}

interface ProfileStatsProps {
    stats?: {
        matches?: number
        goals?: number
        assists?: number
        yellowCards?: number
        redCards?: number
        // Statistiche generiche
        label?: string
        value?: string | number
        maxValue?: number
    }[]
    customStats?: Array<{
        label: string
        value: string | number
        maxValue?: number
        color?: string
    }>
}

export default function ProfileStats({ stats, customStats }: ProfileStatsProps) {
    // Statistiche predefinite per un giocatore
    const defaultStats = [
        { label: 'Partite Giocate', value: 0, maxValue: 600, color: 'blue' },
        { label: 'Presenze Giocate', value: 0, maxValue: 600, color: 'success' }
    ]

    const displayStats = customStats || defaultStats.map(stat => {
        const matchingStat = stats?.find(s =>
            s.label?.toLowerCase().includes(stat.label.toLowerCase().split(' ')[0])
        )
        return {
            ...stat,
            value: matchingStat?.value || stat.value
        }
    })

    return (
        <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-4">Statistiche Chiave</h2>
            <div className="space-y-4">
                {displayStats.map((stat, index) => (
                    <StatItem
                        key={index}
                        label={stat.label}
                        value={stat.value}
                        maxValue={stat.maxValue}
                        color={stat.color}
                    />
                ))}
            </div>
        </div>
    )
}
