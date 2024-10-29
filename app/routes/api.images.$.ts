import type { LoaderFunction } from "@remix-run/node";
import { kv } from "@vercel/kv";

export const loader: LoaderFunction = async ({ params }) => {
  const imagePath = params["*"];
  if (!imagePath) {
    return new Response("Image path is required", { status: 400 });
  }

  const imageUrl = `${process.env.VITE_PLEX_SERVER_URL}/${imagePath}?X-Plex-Token=${process.env.VITE_PLEX_TOKEN}`;

  try {
    const response = await fetch(imageUrl);

    if (!response.ok) {
      throw new Error(`Failed to fetch image: ${response.statusText}`);
    }

    const cacheKey = `cover:${imagePath}`;
    const cachedImageUrl = await kv.get(cacheKey);

    if (cachedImageUrl) {
      const contentType = response.headers.get("content-type") || "image/jpeg";
      const imageData = await response.arrayBuffer();

      return new Response(imageData, {
        headers: {
          "Content-Type": contentType,
          "Cache-Control": "public, max-age=31536000",
        },
      });
    }

    const contentType = response.headers.get("content-type") || "image/jpeg";
    const imageData = await response.arrayBuffer();

    kv.set(cacheKey, imageUrl, {
      ex: 604800,
    })

    return new Response(imageData, {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=31536000",
      },
    });
  } catch (error) {
    console.error("Error fetching image:", error);
    return new Response("Failed to fetch image", { status: 500 });
  }
};
