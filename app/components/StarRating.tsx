import { Star, StarHalf } from "lucide-react";

const getRatingText = (rating: number) => {
  if (rating < 0 || rating > 10) return "Invalid rating";

  switch (true) {
    case rating >= 10:
      return <><Star className="w-4 h-4 text-gray-400 fill-current mr-1" /><span>Would listen on repeat</span></>;
    case rating >= 8:
      return <><Star className="w-4 h-4 text-gray-500 fill-current mr-1" /><span>Would never skip</span></>;
    case rating >= 6:
      return <><Star className="w-4 h-4 text-gray-600 fill-current mr-1" /><span>Happy to hear every time</span></>;
    case rating >= 4:
      return <><StarHalf className="w-4 h-4 text-gray-600 fill-current mr-1" /><span>Glad to hear from time to time</span></>;
    case rating >= 2:
      return <><StarHalf className="w-4 h-4 text-gray-600 fill-current mr-1" /><span>Listen or skip depending on mood</span></>;
    default:
      return "Not rated yet";
  }
};

export const TextRating = ({ rating }: { rating: number }) => {
  const ratingText = getRatingText(rating);

  return (
    <div className="inline-flex items-center text-sm font-medium text-gray-500">
      {ratingText}
    </div>
  );
};
