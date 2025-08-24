import { json } from "@remix-run/node";
import { discoverPlexData } from "~/utils/discovery";

export async function loader() {
  try {
    const plex = await discoverPlexData();

    return json(plex);
  } catch (error) {
    console.error("Error fetching songs:", error);
    return json({ error: "Failed to fetch songs" }, { status: 500 });
  }
}
