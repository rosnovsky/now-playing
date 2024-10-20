import { Music, PauseIcon } from "lucide-react"

export const CurrentMusicNotPlaying = () => {
  return (
    <div className="bg-gray-800 p-4 rounded-lg shadow-lg">
      <h2 className="text-xl font-bold text-gray-400 mb-3 flex items-center">
        <PauseIcon className="w-5 h-5 mr-2" />
        Nothing playing right now
      </h2>
      <div className="flex items-center mt-3">
        <div className="w-16 h-16 bg-gray-700 rounded-md mr-4 flex items-center justify-center">
          <Music className="w-8 h-8 text-gray-400" />
        </div>
        <div className="flex-grow">
          <p className="text-white mb-2">Song not playing</p>
          <p className="text-gray-400 text-sm">Artist not playing</p>
        </div>
      </div>
    </div>
  )
}
