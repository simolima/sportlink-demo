"use client"

import Image from 'next/image'

interface OnboardingHeaderProps {
    title: string
    subtitle: string
    currentStep: 1 | 2
    totalSteps?: number
}

export default function OnboardingHeader({
    title,
    subtitle,
    currentStep,
    totalSteps = 2
}: OnboardingHeaderProps) {
    return (
        <div className="mb-10">
            {/* Brand Lockup: Logo Mark + Wordmark */}
            <div className="flex items-center justify-center gap-4 mb-8">
                {/* Logo Mark (S symbol only) */}
                <Image
                    src="/logo-mark.svg"
                    alt="SPRINTA"
                    width={88}
                    height={88}
                    className="brightness-0 invert w-[72px] h-[72px] md:w-[88px] md:h-[88px]"
                />
                {/* Wordmark + Tagline */}
                <div className="flex flex-col">
                    <h2 className="text-2xl md:text-3xl font-bold text-white tracking-tight leading-none">SPRINTA</h2>
                    <p className="text-xs text-secondary tracking-widest uppercase mt-1">Sport Network</p>
                </div>
            </div>

            {/* Title + Subtitle */}
            <div className="text-center mb-8">
                <h1 className="text-3xl md:text-4xl font-semibold text-white mb-3">{title}</h1>
                <p className="text-secondary text-lg">{subtitle}</p>
            </div>

            {/* Progress Bar */}
            <div className="flex items-center justify-center gap-3 max-w-md mx-auto">
                <div className={`flex-1 h-1.5 rounded-full transition-colors ${currentStep >= 1 ? 'bg-primary' : 'bg-base-300'}`} />
                <span className="text-xs font-semibold text-secondary whitespace-nowrap px-2">
                    Passo {currentStep} di {totalSteps}
                </span>
                <div className={`flex-1 h-1.5 rounded-full transition-colors ${currentStep >= 2 ? 'bg-primary' : 'bg-base-300'}`} />
            </div>
        </div>
    )
}
