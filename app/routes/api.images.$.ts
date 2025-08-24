import type { LoaderFunction } from "@remix-run/node";
import { kv } from "@vercel/kv";

export const loader: LoaderFunction = async ({ params }) => {
  const imagePath = params["*"];
  if (!imagePath) {
    return new Response("Image path is required", { status: 400 });
  }

  const cacheKey = `cover:${imagePath}`;

  try {
    // Check cache first
    const cachedImageData = await kv.get(cacheKey);
    if (cachedImageData && typeof cachedImageData === 'object' && 'data' in cachedImageData) {
      const { data, contentType } = cachedImageData as { data: string; contentType: string };
      const imageBuffer = Buffer.from(data, 'base64');

      return new Response(imageBuffer, {
        headers: {
          "Content-Type": contentType,
          "Cache-Control": "public, max-age=2592000", // 30 days
          "X-Cache": "HIT",
        },
      });
    }

    // Construct the Plex server URL
    const imageUrl = `${process.env.VITE_PLEX_SERVER_URL}/${imagePath}?X-Plex-Token=${process.env.VITE_PLEX_TOKEN}`;

    // Fetch image from Plex server with appropriate headers
    const response = await fetch(imageUrl, {
      headers: {
        'Accept': 'image/jpeg, image/png, image/webp, image/*',
        'User-Agent': 'Now-Playing/1.0',
      },
    });

    if (!response.ok) {
      console.error(`Failed to fetch image from Plex: ${response.status} ${response.statusText}`);
      return new Response(`Failed to fetch image: ${response.status}`, { status: response.status });
    }

    const contentType = response.headers.get("content-type") || "image/jpeg";

    // Validate content type
    if (!contentType.startsWith('image/')) {
      console.error(`Invalid content type received: ${contentType}`);
      return new Response("Invalid image content type", { status: 400 });
    }

    const imageBuffer = await response.arrayBuffer();

    // Cache the image data for 30 days (2592000 seconds)
    try {
      const base64Data = Buffer.from(imageBuffer).toString('base64');
      await kv.set(cacheKey, {
        data: base64Data,
        contentType: contentType,
      }, {
        ex: 2592000, // 30 days in seconds
      });
    } catch (cacheError) {
      console.warn("Failed to cache image:", cacheError);
      // Continue without caching - don't fail the request
    }

    return new Response(imageBuffer, {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=2592000", // 30 days
        "X-Cache": "MISS",
      },
    });
  } catch (error) {
    console.error("Error fetching image:", error);
    return new Response("Failed to fetch image", { status: 500 });
  }
};
