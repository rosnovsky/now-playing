import {
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  useLoaderData,
} from "@remix-run/react";
import { useEffect, useState } from "react";
import { CurrentMusic, Song } from "~/types";
import { useStore } from "./store";
import "./tailwind.css";
import { convertJpgToFavicon } from "./utils/favicon";

export const loader = async () => {
  const response = await fetch(`${import.meta.env.VITE_API_URL}/api/currentMusic`);
  const initialCurrentMusic = await response.json();
  return { initialCurrentMusic };
};

export default function App() {
  const { initialCurrentMusic } = useLoaderData<{ initialCurrentMusic: CurrentMusic | null }>();
  const [favicon, setFavicon] = useState<string | null>(null);
  const { currentMusic, setCurrentMusic } = useStore();

  const currentSong: Song | null = currentMusic || initialCurrentMusic;

  useEffect(() => {
    if (initialCurrentMusic) {
      setCurrentMusic(initialCurrentMusic);
    }
  }, [initialCurrentMusic, setCurrentMusic]);

  useEffect(() => {
    if (currentSong?.albumArt) {
      const getFavicon = async () => {
        const faviconUrl = await convertJpgToFavicon(currentSong.albumArt);
        setFavicon(faviconUrl);
      };
      getFavicon();
    }
  }, [currentSong]);

  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href={favicon ?? "/favicon.ico"} type="image/x-icon" />
        <title>{`${currentSong?.title ?? "Nothing playing"} - ${currentSong?.artist ?? "Current Music"}`}</title>
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
