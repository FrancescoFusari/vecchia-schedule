
import React from 'react';

interface TimeSlotMarkerProps {
  startTime: string;
}

export function TimeSlotMarker({ startTime }: TimeSlotMarkerProps) {
  return (
    <div className="h-24 flex items-center justify-center border-b border-r border-gray-200 bg-gray-50 text-sm font-medium text-gray-600">
      {startTime}
    </div>
  );
}
