import { type Song } from "~/types";

const QualityBadge = ({ audioCodec, bitrate }: { audioCodec: string, bitrate: number }) => {
  let quality = 'MP3';
  if (audioCodec === 'flac' || audioCodec === 'alac') {
    quality = bitrate > 1000 ? 'Hi-Res' : 'Lossless';
  }
  return (
    <span className="border-[1px] border-gray-700 rounded-md text-gray-600 text-xs font-extralight p-1">
      {quality}
    </span>
  );
};

export const SongComponent = ({ song }: { song: Partial<Song> }) => {
  console.log(song)
  return (
    <div className="flex items-center">
      <img src={song.albumArt} alt={`${song.album} cover`} className="w-16 h-16 object-cover rounded-md mr-4" />
      <div className="flex-grow">
        <div className="inline-flex items-center gap-2">
          <h3 className="text-lg font-semibold text-white truncate">{song.title}</h3>
          <QualityBadge audioCodec={song.audioCodec} bitrate={song.bitrate} />
        </div>
        <p className="text-gray-400 truncate">{song.artist}</p>
        <p className="text-gray-500 text-sm truncate">{song.album}</p>
      </div>
    </div>
  )
}
