import { type Album, type CurrentMusic } from "~/types";

export const OpenGraphImage = ({
  albums,
  currentMusic,
}: {
  albums: Album[],
  currentMusic: CurrentMusic | null,
}) => {
  const displayAlbums = albums.slice(0, 10);
  const centerIndex = 5;

  return (
    <div
      style={{
        height: '630px',
        width: '1200px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        backgroundColor: '#111827',
        padding: '48px',
        fontFamily: 'Inter',
        position: 'relative',
        overflow: 'hidden'
      }}
    >
      <div style={{
        fontSize: '48px',
        fontWeight: 'bold',
        color: '#4ADE80',
        marginBottom: '68px',
      }}>
        Current Music
      </div>

      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: '1200px',
        height: '200px',
        marginBottom: '48px',
        position: 'relative',
        overflow: 'hidden'
      }}>
        {displayAlbums.map((album, index) => {
          const offset = index - centerIndex;
          const isCenter = offset === 0;

          const baseOffset = 500; // Center position
          const spacing = 180; // Space between albums
          const left = baseOffset + (offset * spacing);

          const distanceFromCenter = Math.abs(offset);
          const maxVisibleDistance = 4;
          const opacity = Math.max(0, 1 - (distanceFromCenter / maxVisibleDistance));

          return (
            <div
              key={album.ratingKey}
              style={{
                position: 'absolute',
                left: `${left}px`,
                opacity: opacity,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
              }}
            >
              <img
                src={`${import.meta.env.VITE_API_URL}${album.thumb}`}
                alt={album.title}
                style={{
                  width: '160px',
                  height: '160px',
                  objectFit: 'cover',
                  borderRadius: '8px',
                }}
              />
              {isCenter && (
                <div style={{
                  position: 'absolute',
                  top: '210px',
                  color: '#4ADE80',
                  fontSize: '16px',
                  fontWeight: 'bold',
                  display: 'flex',
                }}>
                  {album.title}
                </div>
              )}
            </div>
          );
        })}

        <div style={{
          position: 'absolute',
          left: '0px',
          top: '0px',
          width: '200px',
          height: '100%',
          background: 'linear-gradient(90deg, #111827 0%, rgba(17, 24, 39, 0) 100%)',
          display: 'flex',
        }} />
        <div style={{
          position: 'absolute',
          right: '0px',
          top: '0px',
          width: '200px',
          height: '100%',
          background: 'linear-gradient(270deg, #111827 0%, rgba(17, 24, 39, 0) 100%)',
          display: 'flex',
        }} />
      </div>

      {currentMusic && (
        <div style={{
          width: '1104px',
          backgroundColor: 'rgba(31, 41, 55, 0.9)',
          padding: '32px',
          borderRadius: '12px',
          display: 'flex',
          alignItems: 'center',
        }}>
          <img
            src={`${import.meta.env.VITE_API_URL}${currentMusic.albumArt}`}
            alt={currentMusic.title}
            style={{
              width: '120px',
              height: '120px',
              borderRadius: '8px',
              marginRight: '24px',
              objectFit: 'cover'
            }}
          />
          <div style={{
            display: 'flex',
            flexDirection: 'column',
          }}>
            <div style={{
              fontSize: '16px',
              color: '#4ADE80',
              fontWeight: '500',
              marginBottom: '8px',
              display: 'flex',
            }}>
              Last played
            </div>
            <div style={{
              fontSize: '36px',
              color: 'white',
              fontWeight: 'bold',
              marginBottom: '8px',
              width: '800px',
              overflow: 'hidden',
              display: 'flex',
            }}>
              {currentMusic.title}
            </div>
            <div style={{
              fontSize: '24px',
              color: '#9CA3AF',
              width: '800px',
              overflow: 'hidden',
              display: 'flex',
            }}>
              {currentMusic.grandparentTitle}
            </div>
            <div style={{
              fontSize: '20px',
              color: '#6B7280',
              width: '800px',
              overflow: 'hidden',
              display: 'flex',
            }}>
              {currentMusic.parentTitle}
            </div>
          </div>
        </div>
      )}

      <div style={{
        position: 'absolute',
        bottom: '0px',
        left: '0px',
        right: '0px',
        height: '200px',
        background: 'linear-gradient(180deg, rgba(17, 24, 39, 0) 0%, #111827 100%)',
        display: 'flex',
      }} />
    </div>
  );
};
