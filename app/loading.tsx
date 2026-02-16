import { CustomLoader } from "@/components/ui/custom-loader"

export default function Loading() {
    return (
        <div className="min-h-screen flex items-center justify-center">
            <CustomLoader />
        </div>
    )
}
