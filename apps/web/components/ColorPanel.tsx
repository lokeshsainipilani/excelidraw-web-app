import { Colors, lineWidths } from "@/lib/types";
import { cn } from "@/lib/utils";
import React from "react";

interface ColorPanelProps {
  selectedColor: string;
  setSelectedColor: (color: string) => void;
  lineWidth: lineWidths;
  setLineWidth: (value: lineWidths) => void;
}

export const ColorPanel = ({
  selectedColor,
  setSelectedColor,
  lineWidth,
  setLineWidth,
}: ColorPanelProps) => {
  return (
    <div className="fixed top-10 left-10 flex items-center bg-[rgb(34,35,40)] p-4  w-fit h-fit rounded-md z-10">
      <div className="space-y-4">
        <div className="flex flex-col justify-center gap-2">
          <p className="text-sm font-sans">Stroke</p>
          <div className="flex gap-2 items-center">
            {Colors.map((color) => (
              <button
                key={color}
                className={cn(
                  "w-6 h-6 rounded-full border-2",
                  selectedColor === color
                    ? "border-gray-100 border-2 transform scale-100 transition-all"
                    : "border-neutral-900"
                )}
                style={{ backgroundColor: color }}
                onClick={() => setSelectedColor(color)}
              />
            ))}
          </div>
        </div>
        <div className="flex flex-col justify-center gap-2">
          <p className="text-sm font-sans">Stroke width</p>
          <div className="flex gap-x-3 items-center cursor-pointer">
            <p
              className={cn(
                "py-1 px-2.5 bg-slate-500 rounded-sm",
                lineWidth === 1 ? "transform scale-125 transition-all" : ""
              )}
              onClick={() => setLineWidth(1)}
            >
              1
            </p>
            <p
              className={cn(
                "py-1 px-2.5 bg-slate-500 rounded-sm",
                lineWidth === 2 ? "transform scale-125 transition-all" : ""
              )}
              onClick={() => setLineWidth(2)}
            >
              2
            </p>
            <p
              className={cn(
                "py-1 px-2.5 bg-slate-500 rounded-sm",
                lineWidth === 4 ? "transform scale-125 transition-all" : ""
              )}
              onClick={() => setLineWidth(4)}
            >
              4
            </p>
            <p
              className={cn(
                "py-1 px-2.5 bg-slate-500 rounded-sm",
                lineWidth === 5 ? "transform scale-125 transition-all" : ""
              )}
              onClick={() => setLineWidth(5)}
            >
              5
            </p>
            <p
              className={cn(
                "py-1 px-2.5 bg-slate-500 rounded-sm",
                lineWidth === 10 ? "transform scale-125 transition-all" : ""
              )}
              onClick={() => setLineWidth(10)}
            >
              10
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};