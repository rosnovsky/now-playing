import { Pause } from "lucide-react"

export const CurrentMusicSkeleton = () => {
  return (
    <div className="bg-gray-800 p-4 rounded-lg shadow-lg animate-pulse">
      <h2 className="h-6 flex items-center mb-3">
        <Pause className="w-5 h-5 mr-2" />
        <div className="h-7 bg-gray-600 rounded w-36"></div>
      </h2>
      <div className="flex items-center mt-3">
        <div className="w-16 h-16 bg-gray-700 rounded-md mr-4"></div>
        <div className="flex-grow">
          <div className="h-6 bg-gray-600 rounded w-3/4 mb-2"></div>
          <div className="h-4 bg-gray-700 rounded w-1/2 mb-2"></div>
          <div className="h-3 bg-gray-700 rounded w-2/3"></div>
        </div>
      </div>
    </div>
  )
}
