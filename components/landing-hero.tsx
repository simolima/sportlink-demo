export default function LandingHero() {
    return (
        <div className="hidden lg:flex items-center justify-center bg-gradient-to-br from-blue-600 to-blue-500 text-white p-12 rounded-lg shadow-lg">
            <div className="max-w-md">
                <button className="mb-6 text-white/90">←</button>
                <h2 className="text-3xl font-extrabold mb-3">Find like-minded sports companions</h2>
                <p className="text-blue-100 mb-6">Connect with others who share your passion for sports.</p>
                <div className="flex items-center gap-4">
                    <a href="/create-profile" className="bg-white text-blue-600 px-5 py-3 rounded-full font-semibold">Get Started</a>
                </div>
                <div className="mt-6 text-blue-100">Log in</div>
            </div>
        </div>
    )
}
