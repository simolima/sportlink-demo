"use client"
interface StatBoxProps {
    label: string;
    value: number | string;
}

export default function StatBox({ label, value }: StatBoxProps) {
    return (
        <div className="flex flex-col items-center px-3 py-2 bg-base-200 rounded-lg border border-base-300 min-w-[80px]">
            <span className="text-lg font-bold text-primary">{value}</span>
            <span className="text-xs text-secondary mt-1">{label}</span>
        </div>
    );
}
