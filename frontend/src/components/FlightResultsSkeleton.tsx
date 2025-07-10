import React from 'react';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export const FlightResultsSkeleton: React.FC = () => {
  return (
    <div className="space-y-4">
      {[...Array(3)].map((_, i) => (
        <Card key={i} className="p-4 border-0 shadow-lg bg-white/80 backdrop-blur-sm">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4 w-full sm:w-auto">
              <Skeleton className="h-10 w-10 rounded-full" />
              <div className="w-24">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-3 w-3/4 mt-1" />
              </div>
            </div>
            <div className="flex items-center gap-4 w-full sm:w-auto">
              <div className="text-center">
                <Skeleton className="h-6 w-20" />
                <Skeleton className="h-4 w-16 mt-1" />
              </div>
              <div className="hidden sm:block">
                <Skeleton className="h-px w-24 bg-gray-200" />
              </div>
              <div className="text-center">
                <Skeleton className="h-6 w-20" />
                <Skeleton className="h-4 w-16 mt-1" />
              </div>
            </div>
            <div className="text-center w-full sm:w-auto">
              <Skeleton className="h-5 w-24" />
              <Skeleton className="h-4 w-20 mt-1" />
            </div>
            <div className="text-right w-full sm:w-auto">
              <Skeleton className="h-7 w-28" />
              <Skeleton className="h-10 w-full sm:w-32 mt-2" />
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
};
