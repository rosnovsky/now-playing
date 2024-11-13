// app/routes/top.tsx (Layout route for all top lists)
import { json, LoaderFunction } from "@remix-run/node";
import { Link, Outlet } from "@remix-run/react";

export const loader: LoaderFunction = async ({ request }) => {
  const headers = Object.fromEntries(request.headers);
  return json({ headers });
};

export default function TopLayout() {
  return (
    <div className="bg-gray-900 text-white py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold text-center mb-4 text-green-400">
          Top Charts
        </h1>
        <nav className="mb-8">
          <ul className="flex justify-center space-x-4 text-sm">
            <li>
              <Link
                to="/top/songs"
                className="text-gray-400 hover:text-green-400 transition-colors"
              >
                Songs
              </Link>
            </li>
            <li>
              <Link
                to="/top/artists"
                className="text-gray-400 hover:text-green-400 transition-colors"
              >
                Artists
              </Link>
            </li>
            <li>
              <Link
                to="/top/albums"
                className="text-gray-400 hover:text-green-400 transition-colors"
              >
                Albums
              </Link>
            </li>
          </ul>
        </nav>
        <Outlet />
      </div>
    </div>
  );
}
