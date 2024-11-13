import { LoaderFunction, json } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { TopArtistsList } from "~/components/TopLists/TopArtistsList";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs";

export const loader: LoaderFunction = async ({ request }) => {
  const headers = Object.fromEntries(request.headers);
  return json({ headers });
};

export default function TopArtists() {
  const { headers } = useLoaderData<typeof loader>();

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6 text-green-400">Top Artists</h2>
      <Tabs defaultValue="all-time" className="w-full">
        <TabsList className="w-full bg-gray-800 border-b border-gray-700 mb-6">
          <TabsTrigger
            value="all-time"
            className="flex-1 data-[state=active]:bg-gray-700"
          >
            All Time
          </TabsTrigger>
          <TabsTrigger
            value="year"
            className="flex-1 data-[state=active]:bg-gray-700"
          >
            This Year
          </TabsTrigger>
          <TabsTrigger
            value="month"
            className="flex-1 data-[state=active]:bg-gray-700"
          >
            This Month
          </TabsTrigger>
          <TabsTrigger
            value="week"
            className="flex-1 data-[state=active]:bg-gray-700"
          >
            This Week
          </TabsTrigger>
        </TabsList>
        <TabsContent value="all-time">
          <TopArtistsList timeRange="all-time" />
        </TabsContent>
        <TabsContent value="year">
          <TopArtistsList timeRange="year" />
        </TabsContent>
        <TabsContent value="month">
          <TopArtistsList timeRange="month" />
        </TabsContent>
        <TabsContent value="week">
          <TopArtistsList timeRange="week" />
        </TabsContent>
      </Tabs>
    </div>
  );
}
