import React from "react";
import { Button } from "./ui/button";
import { useSelectedTool } from "@/app/store/store";
import {
  Circle,
  Move,
  MoveRight,
  Pencil,
  Square,
  SquareDashed,
  Trash2,
} from "lucide-react";
import { lineWidths } from "@/lib/types";
import { ColorPanel } from "./ColorPanel";


interface ToolbarProps {
  color: string;
  setColor: (color: string) => void | undefined;
  lineWidth: lineWidths;
  setLineWidth: (lineWidth: lineWidths) => void;
}

const Toolbar = ({
  setColor,

  color,
  lineWidth,
  setLineWidth,
}: ToolbarProps) => {
  const { selectedTool, setSelectedTool } = useSelectedTool();
  return (
    <div className="fixed top-10 left-120 right-120 bg-[rgb(34,35,40)] shadow-sm p-4 flex items-center gap-2 z-10 text-white rounded-md">
      <div className="flex items-center gap-2 border-r pr-4">
        <Button
          className=""
          variant={selectedTool === "rectangle" ? "default" : "ghost"}
          size={"icon"}
          onClick={() => setSelectedTool("rectangle")}
        >
          <Square size={4} />
        </Button>
        <Button
          className=""
          variant={selectedTool === "circle" ? "default" : "ghost"}
          size={"icon"}
          onClick={() => setSelectedTool("circle")}
        >
          <Circle size={4} />
        </Button>
        <Button
          className=""
          variant={selectedTool === "line" ? "default" : "ghost"}
          size={"icon"}
          onClick={() => setSelectedTool("line")}
        >
          <MoveRight size={4} />
        </Button>
        <Button
          className=""
          variant={selectedTool === "pencil" ? "default" : "ghost"}
          size={"icon"}
          onClick={() => setSelectedTool("pencil")}
        >
          <Pencil size={4} />
        </Button>
      </div>
      <div className="flex items-center gap-2 pr-4">
        <Button
          variant={selectedTool === "move" ? "default" : "ghost"}
          size={"icon"}
          onClick={() => setSelectedTool("move")}
        >
          <Move size={4} />
        </Button>
        <Button
          variant={selectedTool === "delete" ? "default" : "ghost"}
          size={"icon"}
          onClick={() => setSelectedTool("delete")}
        >
          <Trash2 size={4} />
        </Button>
        <Button
          variant={selectedTool === "select" ? "default" : "ghost"}
          size={"icon"}
          onClick={() => setSelectedTool("select")}
        >
          <SquareDashed size={4} />
        </Button>
      </div>
      <div className="flex items-center gap-2">
        <ColorPanel
          selectedColor={color}
          setSelectedColor={setColor}
          lineWidth={lineWidth}
          setLineWidth={setLineWidth}
        />
      </div>
    </div>
  );
};

export default Toolbar;