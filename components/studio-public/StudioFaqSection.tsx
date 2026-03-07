"use client"
import { useState } from 'react'
import { ChevronDownIcon } from '@heroicons/react/24/outline'
import type { PublicStudioMockData } from '@/lib/studio-mock-data'

interface Props {
    mockData: PublicStudioMockData
}

export default function StudioFaqSection({ mockData }: Props) {
    const [openIndex, setOpenIndex] = useState<number | null>(null)

    if (mockData.faq.length === 0) return null

    return (
        <section className="py-16 bg-white">
            <div className="max-w-4xl mx-auto px-4">
                <h2 className="text-3xl font-bold text-gray-900 mb-2 text-center">Domande Frequenti</h2>
                <div className="w-16 h-1 bg-brand-600 rounded-full mb-12 mx-auto" />

                <div className="space-y-4">
                    {mockData.faq.map((item, idx) => (
                        <div
                            key={idx}
                            className="border border-gray-200 rounded-xl overflow-hidden bg-white hover:border-brand-300 transition-colors"
                        >
                            <button
                                onClick={() => setOpenIndex(openIndex === idx ? null : idx)}
                                className="w-full flex items-center justify-between p-5 text-left"
                            >
                                <span className="font-bold text-gray-900 pr-4">{item.question}</span>
                                <ChevronDownIcon
                                    className={`h-5 w-5 text-brand-600 flex-shrink-0 transition-transform ${openIndex === idx ? 'rotate-180' : ''
                                        }`}
                                />
                            </button>

                            {openIndex === idx && (
                                <div className="px-5 pb-5">
                                    <div className="pt-2 border-t border-gray-100">
                                        <p className="text-gray-700 leading-relaxed">{item.answer}</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        </section>
    )
}
