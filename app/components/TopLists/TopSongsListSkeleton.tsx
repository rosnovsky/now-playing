export function TopSongsListSkeleton() {
  return (
    <ul className="space-y-4">
      {[...Array(10)].map((_, index) => (
        <li key={index} className="bg-gray-800 rounded-lg p-4 animate-pulse">
          <div className="flex items-center">
            <div className="w-16 h-16 bg-gray-700 rounded-md mr-4" />
            <div className="flex-grow">
              <div className="h-5 bg-gray-700 rounded w-3/4 mb-2" />
              <div className="h-4 bg-gray-700 rounded w-1/2 mb-2" />
              <div className="h-4 bg-gray-700 rounded w-2/3" />
            </div>
            <div className="text-right">
              <div className="h-5 bg-gray-700 rounded w-20 mb-2" />
              <div className="h-4 bg-gray-700 rounded w-12" />
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
}
