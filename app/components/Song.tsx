import React from 'react';
import { type CurrentMusic, type Song } from '~/types';

type SongOrCurrentMusic = Song | CurrentMusic;

const isCurrentMusic = (song: SongOrCurrentMusic): song is CurrentMusic => {
  return (song as CurrentMusic).isPlaying !== undefined;
};

const QualityBadge: React.FC<{ media?: SongOrCurrentMusic["Media"] }> = ({ media }) => {
  let quality = 'Unknown';
  if (media && media[0]) {
    const { audioCodec, bitrate } = media[0];
    if (audioCodec === 'flac' || audioCodec === 'alac') {
      quality = (bitrate ?? 0) > 1000 ? 'Hi-Res' : 'Lossless';
    } else if (audioCodec) {
      quality = audioCodec.toUpperCase();
    }
  }
  return (
    <span className="border-[1px] border-gray-700 rounded-md text-gray-600 text-xs font-extralight p-1">
      {quality}
    </span>
  );
};

export const SongComponent: React.FC<{ song: SongOrCurrentMusic }> = ({ song }) => {
  const albumArt = isCurrentMusic(song) ? song.albumArt : song.thumb;

  return (
    <div className="flex items-center">
      <img src={albumArt} alt={`${song.parentTitle} cover`} className="w-16 h-16 object-cover rounded-md mr-4" />
      <div className="flex-grow">
        <div className="inline-flex items-center gap-2">
          <h3 className="text-lg font-semibold text-white truncate">{song.title}</h3>
          <QualityBadge media={song.Media} />
        </div>
        <p className="text-gray-400 truncate">{song.grandparentTitle}</p>
        <p className="text-gray-500 text-sm truncate">{song.parentTitle}</p>
      </div>
    </div>
  );
};
