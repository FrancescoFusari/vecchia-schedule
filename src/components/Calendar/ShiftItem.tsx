
import { Shift } from "@/lib/types";

interface ShiftItemProps {
  shift: Shift;
  employeeName: string;
  onClick?: () => void;
  isClickable?: boolean;
}

export function ShiftItem({ shift, employeeName, onClick, isClickable }: ShiftItemProps) {
  return (
    <div
      className={`text-xs p-1 rounded bg-gray-100 border border-gray-200 
      ${isClickable ? "cursor-pointer hover:bg-gray-200" : ""}`}
      onClick={onClick}
    >
      <div className="font-medium text-gray-900 truncate">{employeeName}</div>
      <div className="text-gray-600">
        {shift.startTime} - {shift.endTime}
      </div>
    </div>
  );
}

export default ShiftItem;
