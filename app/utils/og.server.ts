import satori from 'satori';
import sharp from 'sharp';

export async function generatePng(component: React.ReactElement): Promise<Buffer> {
  const fontSans = () =>
    fetch(`${import.meta.env.VITE_API_URL}/fonts/inter-400.otf`).then((res) =>
      res.arrayBuffer()
    )

  const svg = await satori(component, {
    width: 1200,
    height: 630,
    fonts: [
      {
        name: 'Inter',
        data: await fontSans(),
        style: 'normal',
        weight: 400,
      },
    ],
  });

  const png = await sharp(Buffer.from(svg))
    .toFormat('png')
    .toBuffer();

  return png;
}
