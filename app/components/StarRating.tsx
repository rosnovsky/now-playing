import { Star, StarHalf } from 'lucide-react';

const convertTo5StarRating = (userRating: number) => {
  if (userRating === undefined) return 0;
  const convertedRating = userRating / 2;
  return Math.round(convertedRating * 2) / 2;
};

export const StarRating = ({ rating }: { rating: number }) => {
  const starRating = convertTo5StarRating(rating);
  const fullStars = Math.floor(starRating);
  const hasHalfStar = starRating % 1 !== 0;

  return (
    <div className="flex items-center">
      {[...Array(5)].map((_, i) => (
        <span key={i}>
          {i < fullStars ? (
            <Star className="w-4 h-4 text-gray-600 fill-current" />
          ) : i === fullStars && hasHalfStar ? (
            <StarHalf className="w-4 h-4 text-gray-600 fill-current" />
          ) : (
            <Star className="w-4 h-4 text-gray-800" />
          )}
        </span>
      ))}
    </div>
  );
};
