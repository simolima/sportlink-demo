'use client'
import { PhotoIcon } from '@heroicons/react/24/outline'

interface PostTabProps {
    userId: number
}

export default function PostTab({ userId }: PostTabProps) {
    // Placeholder for future Instagram-style photo gallery
    return (
        <div className="bg-white rounded-lg shadow p-12">
            <div className="text-center max-w-md mx-auto">
                <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-gray-100 flex items-center justify-center">
                    <PhotoIcon className="w-12 h-12 text-gray-400" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Galleria Foto</h3>
                <p className="text-gray-600 mb-4">
                    Questa sezione è in arrivo! Presto potrai condividere le tue foto in stile Instagram.
                </p>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <p className="text-sm text-blue-800">
                        <strong>Funzionalità in sviluppo:</strong>
                        <br />
                        • Upload multiplo di foto
                        <br />
                        • Griglia stile Instagram
                        <br />
                        • Filtri e modifiche immagini
                        <br />
                        • Galleria a schermo intero
                    </p>
                </div>
            </div>
        </div>
    )
}
