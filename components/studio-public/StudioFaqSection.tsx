"use client"
import { useState } from 'react'
import { ChevronDownIcon } from '@heroicons/react/24/outline'

interface FAQ {
    id: string
    question: string
    answer: string
}

interface Props {
    faqs: FAQ[]
}

export default function StudioFaqSection({ faqs }: Props) {
    const [openIndex, setOpenIndex] = useState<number | null>(null)

    if (!faqs || faqs.length === 0) return null

    return (
        <section className="py-16 bg-base-100">
            <div className="max-w-4xl mx-auto px-4">
                <h2 className="text-3xl font-bold text-base-content mb-2 text-center">Domande Frequenti</h2>
                <div className="w-16 h-1 bg-brand-600 rounded-full mb-12 mx-auto" />

                <div className="space-y-4">
                    {faqs.map((item, idx) => (
                        <div
                            key={item.id}
                            className="border border-base-300 rounded-xl overflow-hidden bg-base-100 hover:border-primary/40 transition-colors"
                        >
                            <button
                                onClick={() => setOpenIndex(openIndex === idx ? null : idx)}
                                className="w-full flex items-center justify-between p-5 text-left"
                            >
                                <span className="font-bold text-base-content pr-4">{item.question}</span>
                                <ChevronDownIcon
                                    className={`h-5 w-5 text-brand-600 flex-shrink-0 transition-transform ${openIndex === idx ? 'rotate-180' : ''
                                        }`}
                                />
                            </button>

                            {openIndex === idx && (
                                <div className="px-5 pb-5">
                                    <div className="pt-2 border-t border-base-300">
                                        <p className="text-secondary leading-relaxed">{item.answer}</p>
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
