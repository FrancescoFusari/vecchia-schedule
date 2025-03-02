
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Info } from "lucide-react";

export function CalendarLegend() {
  return (
    <div className="bg-white rounded-lg p-3 mb-4 border border-gray-200 text-sm flex flex-wrap gap-3 items-center">
      <div className="flex items-center">
        <span className="font-medium mr-2">Orari standard:</span>
        <span className="mr-4">Lun-Ven: <span className="font-semibold">12:00-17:00</span></span>
        <span>Sab-Dom: <span className="font-semibold">17:00-23:00</span></span>
      </div>
      
      <div className="flex-1"></div>
      
      <div className="flex gap-3 items-center">
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded-full bg-blue-100 border border-blue-200"></div>
          <span>Standard</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded-full bg-amber-100 border border-amber-200"></div>
          <span>Non-standard</span>
        </div>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="cursor-help">
                <Info className="h-4 w-4 text-gray-400" />
              </div>
            </TooltipTrigger>
            <TooltipContent className="max-w-xs">
              <p>Gli orari sono mostrati solo una volta per colonna. I turni standard mostrano solo il nome del dipendente.</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    </div>
  );
}
