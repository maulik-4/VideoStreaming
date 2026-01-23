import React from 'react';

const ShimmerVideoCard = () => {
  return (
    <div className="animate-pulse p-4 w-full max-w-sm">
      <div className="bg-shimmer h-48 w-full rounded-xl mb-4"></div>
      <div className="flex gap-3">
        <div className="h-10 w-10 bg-shimmer rounded-full"></div>
        <div className="flex flex-col gap-2 flex-1">
          <div className="h-4 bg-shimmer rounded w-3/4"></div>
          <div className="h-4 bg-shimmer rounded w-1/2"></div>
        </div>
      </div>
    </div>
  );
};

export default ShimmerVideoCard;
