import {
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  useRouteError
} from "@remix-run/react";
import { useEffect, useState } from "react";
import { Song } from "./routes/api.songs";
import { useStore } from "./store";
import "./tailwind.css";
import { convertJpgToFavicon } from "./utils/favicon";

// export const links: LinksFunction = () => [
//   { rel: "stylesheet", href: styles },
// ];
//

export default function App() {
  const [favicon, setFavicon] = useState<string | null>(null);
  const data = useStore()

  const currentSong: Song = data?.songs?.[0];

  useEffect(() => {
    const getFavicon = async () => {
      const faviconUrl = await convertJpgToFavicon(currentSong.albumArt);
      setFavicon(faviconUrl);
    }
    getFavicon();
  }, [currentSong])


  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href={favicon ?? "/favicon.ico"} type="blob" />
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

export function ErrorBoundary() {
  const error = useRouteError();
  console.error(error);
  return (
    <html lang="en">
      <head>
        <title>Oh no!</title>
        <Meta />
        <Links />
      </head>
      <body>
        <pre>{JSON.stringify(error, null, 2)}</pre>
        <Scripts />
      </body>
    </html>
  );
}
