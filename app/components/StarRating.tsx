import { Star, StarHalf } from "lucide-react";

const getRatingText = (rating: number) => {
  if (rating < 0 || rating > 10) return "Invalid rating";

  switch (true) {
    case rating >= 10:
      return <><Star className="w-4 h-4 text-amber-200/70 fill-current mr-1" /><span>ON REPEAT!</span></>;
    case rating >= 8:
      return <><Star className="w-4 h-4 text-gray-300 fill-current mr-1" /><span>never skip</span></>;
    case rating >= 6:
      return <><Star className="w-4 h-4 text-gray-500 fill-current mr-1" /><span>Happy to hear</span></>;
    case rating >= 4:
      return <><StarHalf className="w-4 h-4 text-gray-700 fill-current mr-1" /><span>Glad to hear sometimes</span></>;
    case rating >= 2:
      return <><StarHalf className="w-4 h-4 text-gray-900 fill-current mr-1" /><span>Listen if in the mood</span></>;
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
