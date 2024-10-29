import { type LoaderFunction } from "@remix-run/node";
import { OpenGraphImage } from "~/components/OpenGraphImage";
import { generatePng } from "~/utils/og.server";

export const loader: LoaderFunction = async () => {
  try {
    const [currentMusicResponse, albumsResponse] = await Promise.all([
      fetch(`${import.meta.env.VITE_API_URL}/api/currentMusic`),
      fetch(`${import.meta.env.VITE_API_URL}/api/albums`)
    ]);

    const [currentMusicData, albums] = await Promise.all([
      currentMusicResponse.json(),
      albumsResponse.json()
    ]);

    const png = await generatePng(
      <OpenGraphImage
        albums={albums}
        currentMusic={currentMusicData.currentMusic}
      />
    );

    return new Response(png, {
      status: 200,
      headers: {
        "Content-Type": "image/png",
        "Content-Length": Buffer.byteLength(png).toString(),
        "Cache-Control": "public, max-age=300",
        "Content-Disposition": "inline",
      },
    });
  } catch (error) {
    console.error("Error generating OG image:", error);
    return new Response("Error generating image", { status: 500 });
  }
};
