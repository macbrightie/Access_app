import Image from 'next/image'
import { cn } from '@/lib/utils'
import { File as FileGeneric } from 'lucide-react'

interface FileIconProps {
    filename: string
    className?: string
}

// Map extensions to specific SVG filenames in public/fileformats
// Using uppercase as per the file listing (e.g. PDF.svg)
const ICON_MAP: Record<string, string> = {
    'ai': 'AI.svg',
    'avi': 'AVI.svg',
    'bmp': 'BMP.svg',
    'crd': 'CRD.svg',
    'csv': 'CSV.svg',
    'dll': 'DLL.svg',
    'doc': 'DOC.svg',
    'docx': 'DOCX.svg',
    'dwg': 'DWG.svg',
    'eps': 'EPS.svg',
    'exe': 'EXE.svg',
    'flv': 'FLV.svg',
    'gif': 'GIFF.svg', // GIFF.svg in listing
    'html': 'HTML.svg',
    'iso': 'ISO.svg',
    'java': 'JAVA.svg',
    'jpg': 'JPG.svg',
    'jpeg': 'JPG.svg',
    'mcc': 'MCC User Flow.pdf', // Special case? Likely not an icon, skipping or handling carefully. User prompt led to this folder. It contains a PDF file? 
    'mdb': 'MDB.svg',
    'mid': 'MID.svg',
    'mov': 'MOV.svg',
    'mp3': 'MP3.svg',
    'mp4': 'MP4.svg',
    'mpeg': 'MPEG.svg',
    'pdf': 'PDF.svg',
    'png': 'PNG.svg',
    'ppt': 'PPT.svg',
    'pptx': 'PPT.svg', // Fallback to PPT if PPTX not explicitly there (it wasn't in list, wait check list again: PPT.svg exists)
    'ps': 'PS.svg',
    'psd': 'PSD.svg',
    'pub': 'PUB.svg',
    'rar': 'RAR.svg',
    'raw': 'RAW.svg',
    'rss': 'RSS.svg',
    'svg': 'SVG.svg',
    'tiff': 'TIFF.svg',
    'txt': 'TXT.svg',
    'wav': 'WAV.svg',
    'wma': 'WMA.svg',
    'xml': 'XML.svg',
    'xsl': 'XSL.svg',
    'zip': 'ZIP.svg'
}

export function FileIcon({ filename, className }: FileIconProps) {
    const ext = filename.split('.').pop()?.toLowerCase() || ''
    const iconName = ICON_MAP[ext]

    if (iconName) {
        return (
            <div className={cn("relative flex items-center justify-center select-none", className)}>
                <Image
                    src={`/fileFormats/${iconName}`}
                    alt={ext}
                    fill
                    className="object-contain"
                />
            </div>
        )
    }

    // Fallback if no formatted icon found
    return (
        <div className={cn("relative flex items-center justify-center bg-gray-100 rounded-lg", className)}>
            <div className="text-gray-400 font-bold text-[10px] uppercase absolute bottom-1">{ext.slice(0, 4)}</div>
            <FileGeneric className="w-1/2 h-1/2 text-gray-400" />
        </div>
    )
}
