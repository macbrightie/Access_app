import Link from 'next/link'

export function Footer() {
    return (
        <footer className="w-full py-8 mt-auto">
            <div className="container mx-auto flex flex-col items-center gap-4">
                <div className="w-16 h-[1px] bg-gray-200 mb-4"></div>
                <div className="flex items-center gap-4 text-sm text-gray-600">
                    <span>Created by Brightmac</span>
                    <a href="https://x.com/dbrightmac" target="_blank" rel="noopener noreferrer" className="font-bold text-black hover:text-gray-700 transition-colors">𝕏</a>
                    <a href="https://www.linkedin.com/in/brightmba/" target="_blank" rel="noopener noreferrer" className="font-bold text-black hover:text-gray-700 transition-colors">in</a>
                </div>
                <Link href="/privacy" className="text-xs text-gray-500 hover:text-gray-700 transition-colors">Privacy policy</Link>
            </div>
        </footer>
    )
}
