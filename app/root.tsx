import {
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  useLoaderData,
} from "@remix-run/react";
import { useEffect, useState } from "react";
import { CurrentMusic } from "~/types";
import { useStore } from "./store";
import "./tailwind.css";
import { convertJpgToFavicon } from "./utils/favicon";

export const loader = async () => {
  const response = await fetch(`${import.meta.env.VITE_API_URL}/api/currentMusic`);
  const initialCurrentMusic = await response.json();
  return { initialCurrentMusic };
};

export default function App() {
  const { initialCurrentMusic } = useLoaderData<{ initialCurrentMusic: { currentMusic: CurrentMusic | null, isPlaying: boolean } }>();
  const [favicon, setFavicon] = useState<string | null>(null);
  const { currentMusic, setCurrentMusic } = useStore();

  const currentSong: CurrentMusic | null = currentMusic ?? initialCurrentMusic.currentMusic;

  useEffect(() => {
    if (initialCurrentMusic.currentMusic) {
      setCurrentMusic(initialCurrentMusic.currentMusic);
    }
  }, [initialCurrentMusic, setCurrentMusic]);

  useEffect(() => {
    const updateFavicon = async () => {
      if (currentSong?.thumb) {
        try {

          const faviconUrl = await convertJpgToFavicon(currentSong.thumb);
          setFavicon(faviconUrl);
        } catch (error) {
          console.error("Error converting favicon:", error);
        }
      }
    };

    void updateFavicon();
  }, [currentSong]);

  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href={favicon ?? "/favicon.ico"} type="image/x-icon" />
        <title>{`${currentSong?.title ?? "Nothing playing"} - ${currentSong?.grandparentTitle ?? "Current Music"}`}</title>
        <Meta />
        <Links />
      </head>
      <body>
        <Outlet />
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}
