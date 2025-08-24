export async function convertJpgToFavicon(imageUrl: string): Promise<string> {
  const plexImageUrl = `${import.meta.env.VITE_API_URL}${imageUrl}`;

  const response = await fetch(plexImageUrl);
  const blob = await response.blob();

  const img = new Image();

  return new Promise((resolve, reject) => {
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = 32;
      canvas.height = 32;

      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, 32, 32);

      canvas.toBlob((blob) => {
        const url = URL.createObjectURL(blob);
        resolve(url);
      }, 'image/png');
    };

    img.onerror = reject;

    img.src = URL.createObjectURL(blob);
  });
}
