// A utility function that would discover specific sections and types of data given Plex server URL by iterating over sections using HTTP requests
//
// Base URL: https://plex.art0.us
// Token: import.meta.env.VITE_PLEX_TOKEN
// Library structure docs: https://support.plex.tv/articles/201638786-plex-media-server-url-commands/

import { fetcher } from "./fetcher";

// The function should take no arguments, and return a Promise that resolves to an object containing the discovered data.
// Discovered data should be an object like { sections: [{id: number, title: string, type: string, path: string }]}

interface PlexItem {
  id: number;
  title: string;
  type: string;
  path: string;
}

interface PlexSection {
  id: number;
  title: string;
  type: string;
  path: string;
  items: PlexItem[];
}

interface PlexDiscoveryResult {
  sections: PlexSection[];
}

async function discoverPlexData(): Promise<PlexDiscoveryResult> {
  const baseUrl = "https://plex.art0.us";
  const token = import.meta.env.VITE_PLEX_TOKEN;

  if (!token) {
    throw new Error("VITE_PLEX_TOKEN environment variable is required");
  }

  try {
    // Fetch library sections from Plex server
    const response = await fetcher(
      `${baseUrl}/library/sections?X-Plex-Token=${token}`,
      {
        headers: {
          Accept: "application/json",
        },
      }
    );

    if (!response.data) {
      throw new Error(
        `Failed to fetch Plex library sections: ${response.status}`
      );
    }

    const data = response.data;

    // Extract sections from the response
    const sectionsData =
      data.MediaContainer?.Directory?.map((section: any) => ({
        id: parseInt(section.key),
        title: section.title,
        type: section.type,
        path: section.key,
      })) || [];

    // Now iterate over each section to discover items within
    const sections: PlexSection[] = [];

    for (const sectionData of sectionsData) {
      try {
        const sectionResponse = await fetcher(
          `${baseUrl}/library/sections/${sectionData.path}/all?X-Plex-Token=${token}`,
          {
            headers: {
              Accept: "application/json",
            },
          }
        );

        let items: PlexItem[] = [];

        if (sectionResponse.data) {
          const sectionContent = sectionResponse.data;

          // Extract items from the section
          items =
            sectionContent.MediaContainer?.Metadata?.map((item: any) => ({
              id: parseInt(item.ratingKey || item.key),
              title: item.title,
              type: item.type || sectionData.type,
              path: item.key,
            })) || [];
        } else {
          console.warn(
            `Failed to fetch content for section ${sectionData.title}: ${sectionResponse.status}`
          );
        }

        sections.push({
          ...sectionData,
          items,
        });
      } catch (error) {
        console.warn(
          `Error fetching content for section ${sectionData.title}:`,
          error
        );
        // Still add the section but with empty items
        sections.push({
          ...sectionData,
          items: [],
        });
      }
    }

    return { sections };
  } catch (error) {
    console.error("Error discovering Plex data:", error);
    throw error;
  }
}

export {
  discoverPlexData,
  type PlexDiscoveryResult,
  type PlexItem,
  type PlexSection,
};
