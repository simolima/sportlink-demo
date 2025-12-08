"use client"
interface StatBoxProps {
    label: string;
    value: number | string;
}

export default function StatBox({ label, value }: StatBoxProps) {
    return (
        <div className="flex flex-col items-center px-3 py-2 bg-green-50 rounded-lg border border-green-100 min-w-[80px]">
            <span className="text-lg font-bold text-green-700">{value}</span>
            <span className="text-xs text-green-600 mt-1">{label}</span>
        </div>
    );
}
