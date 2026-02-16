import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export default function PrivacyPolicy() {
    return (
        <div className="max-w-3xl mx-auto px-6 py-12 space-y-8 animate-in fade-in duration-500">
            <Link
                href="/"
                className="text-gray-500 hover:text-black gap-2 hover:bg-transparent flex items-center mb-8 w-fit"
            >
                <ArrowLeft className="w-4 h-4" /> Go back
            </Link>

            <div className="space-y-4">
                <h1 className="text-4xl md:text-5xl font-normal tracking-tight text-black font-tex-gyre">Privacy Policy</h1>
                <p className="text-gray-500">Last updated: February 2026</p>
            </div>

            <section className="space-y-4">
                <h2 className="text-xl font-semibold">1. Overview</h2>
                <p className="text-gray-600 leading-relaxed">
                    Access ("we", "us", or "our") respects your privacy. This Privacy Policy describes how we collect, use, and share information when you use our file sharing service. By using Access, you agree to the collection and use of information in accordance with this policy.
                </p>
            </section>

            <section className="space-y-4">
                <h2 className="text-xl font-semibold">2. Information We Collect</h2>
                <p className="text-gray-600 leading-relaxed">
                    We collect minimal data to provide our service:
                </p>
                <ul className="list-disc pl-5 space-y-2 text-gray-600">
                    <li>**Files**: The files you upload are stored securely in our cloud storage provider.</li>
                    <li>**Metadata**: We store filenames, sizes, and timestamps associated with your uploads.</li>
                    <li>**Usage Data**: We may collect non-identifiable usage statistics (e.g., number of downloads) to improve our service.</li>
                </ul>
            </section>

            <section className="space-y-4">
                <h2 className="text-xl font-semibold">3. How We Use Your Information</h2>
                <p className="text-gray-600 leading-relaxed">
                    We use your information solely to:
                </p>
                <ul className="list-disc pl-5 space-y-2 text-gray-600">
                    <li>Facilitate file hosting and sharing as requested by you.</li>
                    <li>Generate unique links for your content.</li>
                    <li>Maintain and improve the performance of our application.</li>
                </ul>
            </section>

            <section className="space-y-4">
                <h2 className="text-xl font-semibold">4. Data Security</h2>
                <p className="text-gray-600 leading-relaxed">
                    We implement industry-standard security measures to protect your files. However, no method of transmission over the Internet is 100% secure. While we strive to protect your data, we cannot guarantee its absolute security.
                </p>
            </section>

            <section className="space-y-4">
                <h2 className="text-xl font-semibold">5. Contact Us</h2>
                <p className="text-gray-600 leading-relaxed">
                    If you have any questions about this Privacy Policy, please contact us via X (formerly Twitter) at <a href="https://x.com/dbrightmac" className="text-black underline underline-offset-4">@dbrightmac</a>.
                </p>
            </section>
        </div>
    )
}
