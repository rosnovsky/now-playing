import { AlertCircle, RefreshCcw } from "lucide-react"

export const CurrentMusicError = () => {
  return (
    <div className="bg-gray-800 p-4 rounded-lg shadow-lg">
      <h2 className="text-xl font-bold text-red-400 mb-3 flex items-center">
        <AlertCircle className="w-5 h-5 mr-2" />
        Shit!..
      </h2>
      <div className="flex items-center mt-3">
        <div className="w-16 h-16 bg-gray-700 rounded-md mr-4 flex items-center justify-center">
          <AlertCircle className="w-8 h-8 text-red-400" />
        </div>
        <div className="flex-grow">
          <p className="text-white mb-2">Well, something is clearly broken.</p>
          <p className="text-gray-400 text-sm">I mean, it worked on my machine, you know? ;)</p>
        </div>
      </div>
      <div className="mt-4">
        <button

          className="w-full bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded flex items-center justify-center"
        >
          <RefreshCcw className="w-4 h-4 mr-2" />
          How about now?
        </button>
      </div>
    </div>
  )
}
