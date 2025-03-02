
import { Fragment } from "react";

const weekdays = [
  "Lunedì",
  "Martedì",
  "Mercoledì",
  "Giovedì",
  "Venerdì",
  "Sabato",
  "Domenica",
];

export function CalendarHeader() {
  return (
    <div className="grid grid-cols-7 gap-px bg-gray-200">
      {weekdays.map((day) => (
        <Fragment key={day}>
          <div className="bg-white p-2 text-center">
            <span className="hidden md:inline">{day}</span>
            <span className="md:hidden">{day.slice(0, 3)}</span>
          </div>
        </Fragment>
      ))}
    </div>
  );
}

export default CalendarHeader;
