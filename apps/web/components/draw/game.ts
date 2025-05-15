import { Shape, Tool } from "@/lib/types";

import { nanoid } from "nanoid";
import { getCanvasShapes } from "./http";

export class Game {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private existingShapes: Shape[];
  private roomId: string;
  private isDrawing: boolean;
  private startX: number;
  private startY: number;
  private selectedTool: Tool;
  private selectedColor: string;
  private lineWidth: number;
  private currentPath: { x: number; y: number }[];
  socket: WebSocket;
  private zoomScale: number;

  private selectedShapeIndex: number | null;
  private isDragging: boolean;

  private deleteShapeIndex: number | null;

  private selectionRectangle: {
    startX: number;
    startY: number;
    endX: number;
    endY: number;
  } | null;
  private shapesToBeDeleted: Shape[];

  constructor(canvas: HTMLCanvasElement, roomId: string, socket: WebSocket) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d")!;
    this.existingShapes = [];
    this.roomId = roomId;
    this.isDrawing = false;
    this.startX = 0;
    this.startY = 0;
    this.selectedTool = "rectangle";
    this.selectedColor = "#FFFFFF";
    this.lineWidth = 1;
    this.currentPath = [];
    this.socket = socket;
    this.zoomScale = 1;

    this.selectedShapeIndex = null;
    this.isDragging = false;

    this.deleteShapeIndex = null;

    this.selectionRectangle = null;
    this.shapesToBeDeleted = [];

    // Bind the event handler methods to the instance
    this.startDrawing = this.startDrawing.bind(this);
    this.Drawing = this.Drawing.bind(this);
    this.stopDrawing = this.stopDrawing.bind(this);
    this.handleDoubleClick = this.handleDoubleClick.bind(this);

    this.initCanvas();
    this.initExistingShapes();
    this.initMouseHandlers();
    this.initHandlers();
    this.initZoomHandlers();
  }
  private initCanvas() {
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
    this.ctx.scale(this.zoomScale, this.zoomScale);
  }

  private async initExistingShapes() {
    this.existingShapes = await getCanvasShapes(this.roomId);
    console.log(this.existingShapes);

    this.clearCanvas();
  }

  private initZoomHandlers() {
    window.addEventListener("keydown", (event) => {
      if (event.ctrlKey) {
        if (event.key === "=" || event.key === "+") {
          this.zoomScale += 0.01;
          this.applyZoom();
          event.preventDefault();
        } else if (event.key === "-") {
          this.zoomScale = Math.max(0.5, this.zoomScale - 0.01);
          this.applyZoom();
          event.preventDefault();
        }
      }
    });
  }

  private applyZoom() {
    this.ctx.setTransform(this.zoomScale, 0, 0, this.zoomScale, 0, 0);
    this.clearCanvas();
  }

  setSelectedTool(tool: Tool) {
    this.selectedTool = tool;
    console.log(this.selectedTool);
    // this.clearCanvas();
  }

  setSelectedColor(color: string) {
    this.selectedColor = color;
    console.log(this.selectedColor);
  }

  setLineWidth(lineWidth: number) {
    this.lineWidth = lineWidth;
    console.log(lineWidth);
  }

  handleDoubleClick(e: MouseEvent) {
    const x = e.offsetX + this.canvas.offsetLeft;
    const y = e.offsetY + this.canvas.offsetTop;

    this.clearCanvas();

    const clickedShape = this.existingShapes.find((shape) => {
      if (shape.type === "text") {
        const { startX, startY, endX, endY } = this.getBoundingBox(shape)!;
        console.log({
          startX,
          startY,
          endX,
          endY,
        });

        return (x >= startX && x <= endX) || (y >= startY && y <= endY);
      }
      return false;
    });

    if (clickedShape) {
      console.log("clickedShape -> ", clickedShape);

      this.socket.send(
        JSON.stringify({
          type: "delete_shape_by_id",
          shapeId: clickedShape.id,
          roomId: this.roomId,
        })
      );
    }

    const input = document.createElement("input");
    input.type = "text";
    input.value = (clickedShape ? clickedShape.value : "") as string;
    input.style.position = "absolute";
    input.style.left = `${clickedShape ? clickedShape.startX : x}px`;

    input.style.top = `${clickedShape ? clickedShape.startY : y - 10}px`;
    input.style.font = "20px Arial";
    input.style.background = "transparent";
    input.style.color = `${clickedShape ? clickedShape.color : this.selectedColor}`;
    input.style.border = "none";
    input.style.outline = "none";
    input.style.zIndex = "1000";

    document.body.appendChild(input);
    input.focus();

    let isRemoved = false;

    const removeInput = () => {
      if (!isRemoved && document.body.contains(input)) {
        isRemoved = true;
        document.body.removeChild(input);
      }
    };

    input.addEventListener("keydown", (event) => {
      if (event.key === "Enter") {
        const text = input.value;
        if (text) {
          this.renderText(
            text,
            clickedShape ? clickedShape.startX : x,
            clickedShape ? clickedShape.startY : y + 10
          );
        }
        removeInput();
      }
    });

    input.addEventListener("blur", () => {
      if (input.value) {
        this.renderText(
          input.value,
          clickedShape ? clickedShape.startX : x,
          clickedShape ? clickedShape.startY : y + 10
        );
      }
      removeInput();
    });
  }

  renderText(text: string, x: number, y: number) {
    this.ctx.font = "20px Arial";
    this.ctx.fillStyle = this.selectedColor;
    this.ctx.fillText(text, x, y);

    const existingTextShape = this.existingShapes.find(
      (shape) =>
        shape.type === "text" && shape.startX === x && shape.startY === y
    );

    if (existingTextShape) return;

    const shape: Shape = {
      id: nanoid(),
      type: "text",
      startX: x,
      startY: y,
      color: this.selectedColor,
      endX: 0,
      endY: 0,
      lineWidth: this.lineWidth,
      value: text,
    };
    this.existingShapes.push(shape);

    this.socket.send(
      JSON.stringify({
        type: "chat",
        message: JSON.stringify({
          shape,
        }),
        roomId: this.roomId,
      })
    );
  }

  isShapeClicked(shape: Shape, mouseX: number, mouseY: number): boolean {
    switch (shape.type) {
      case "rectangle":
        return (
          mouseX >= shape.startX &&
          mouseX <= shape.endX &&
          mouseY >= shape.startY &&
          mouseY <= shape.endY
        );
      case "circle":
        const radius = Math.sqrt(
          Math.pow(shape.endX - shape.startX, 2) +
            Math.pow(shape.endY - shape.startY, 2)
        );
        const distance = Math.sqrt(
          Math.pow(mouseX - shape.startX, 2) +
            Math.pow(mouseY - shape.startY, 2)
        );
        return distance <= radius;
      case "line":
        // Check proximity to the line
        const distanceToLine = this.distanceToLine(
          shape.startX,
          shape.startY,
          shape.endX,
          shape.endY,
          mouseX,
          mouseY
        );
        return distanceToLine <= shape.lineWidth;
      case "text":
        // Approximate the bounding box of the text
        const textWidth = this.ctx.measureText(shape.value!).width;
        const textHeight = 20;
        return (
          mouseX >= shape.startX &&
          mouseX <= shape.startX + textWidth &&
          mouseY >= shape.startY - textHeight &&
          mouseY <= shape.startY
        );
      default:
        return false;
    }
  }

  distanceToLine(
    x1: number,
    y1: number,
    x2: number,
    y2: number,
    px: number,
    py: number
  ): number {
    const numerator = Math.abs(
      (y2 - y1) * px - (x2 - x1) * py + x2 * y1 - y2 * x1
    );
    const denominator = Math.sqrt(Math.pow(y2 - y1, 2) + Math.pow(x2 - x1, 2));
    return numerator / denominator;
  }

  startDrawing(e: MouseEvent) {
    const { offsetX, offsetY } = e;

    if (this.selectedTool === "delete") {
      for (let i = this.existingShapes.length - 1; i >= 0; i--) {
        if (this.isShapeClicked(this.existingShapes[i], offsetX, offsetY)) {
          this.deleteShapeIndex = i;
          break;
        }
      }

      if (this.deleteShapeIndex !== null && this.deleteShapeIndex >= 0) {
        // this.existingShapes = this.existingShapes.filter(
        //   (_, index) => index !== this.deleteShapeIndex
        // );

        // this.existingShapes.splice(this.deleteShapeIndex, 1);
        this.socket.send(
          JSON.stringify({
            type: "delete_shape",
            deleteIndex: this.deleteShapeIndex,
            roomId: this.roomId,
          })
        );
        this.deleteShapeIndex = null;
      }

      // this.clearCanvas();

      return;
    }

    if (this.selectedTool === "move") {
      for (let i = this.existingShapes.length - 1; i >= 0; i--) {
        if (this.isShapeClicked(this.existingShapes[i], offsetX, offsetY)) {
          this.selectedShapeIndex = i;
          break;
        }
      }

      if (this.selectedShapeIndex !== null && this.selectedShapeIndex >= 0) {
        this.isDragging = true;
      } else {
        // this.setSelectedTool("rectangle");
      }
    } else {
      this.isDrawing = true;
      this.startX = offsetX;
      this.startY = offsetY;
      if (this.selectedTool === "pencil") {
        this.currentPath.push({ x: this.startX, y: this.startY });
      }
    }
  }

  Drawing(e: MouseEvent) {
    const { offsetX, offsetY } = e;

    if (
      this.selectedTool === "move" &&
      this.isDragging &&
      this.selectedShapeIndex !== null
    ) {
      const shape = this.existingShapes[this.selectedShapeIndex]; //memory ref

      const deltaX = e.movementX;
      const deltaY = e.movementY;

      shape.startX += deltaX;
      shape.startY += deltaY;

      if (shape.endX && shape.endY) {
        shape.endX += deltaX;
        shape.endY += deltaY;
      }

      this.socket.send(
        JSON.stringify({
          type: "move_shape",
          roomId: this.roomId,
          shape,
          shapeIndex: this.selectedShapeIndex,
        })
      );

      // this.clearCanvas();
      return;
    }

    if (!this.isDrawing) {
      return;
    }

    const width = offsetX - this.startX;
    const height = offsetY - this.startY;

    const endX = e.offsetX;
    const endY = e.offsetY;

    this.clearCanvas();

    const selectedTool = this.selectedTool;

    this.ctx.strokeStyle = this.selectedColor;
    this.ctx.lineWidth = this.lineWidth;

    switch (selectedTool) {
      case "select":
        this.ctx.setLineDash([6]);
        this.ctx.strokeRect(this.startX, this.startY, width, height);
        this.selectionRectangle = {
          startX: this.startX,
          startY: this.startY,
          endX: this.startX + width,
          endY: this.startY + height,
        };

        this.ctx.setLineDash([0]);
        break;
      case "rectangle":
        this.ctx.strokeStyle = this.selectedColor;
        this.ctx.strokeRect(this.startX, this.startY, width, height);
        break;
      case "circle":
        this.ctx.strokeStyle = this.selectedColor;
        // const radius = Math.max(width, height) / 2;
        const radius = Math.sqrt(
          Math.pow(endX - this.startX, 2) + Math.pow(endY - this.startY, 2)
        );
        // const centerX = this.startX + radius;
        // const centerY = this.startY + radius;
        this.ctx.beginPath();
        // this.ctx.arc(centerX, centerY, Math.abs(radius), 0, Math.PI * 2);
        this.ctx.arc(this.startX, this.startY, radius, 0, 2 * Math.PI);
        this.ctx.stroke();
        this.ctx.closePath();
        break;
      case "line":
        this.ctx.beginPath();
        this.ctx.moveTo(this.startX, this.startY);
        this.ctx.lineTo(endX, endY);
        this.ctx.stroke();
        this.drawArrowhead(this.ctx, this.startX, this.startY, endX, endY);
        break;
      case "pencil":
        this.currentPath.push({ x: endX, y: endY });

        if (this.currentPath.length < 2) return;
        this.ctx.strokeStyle = this.selectedColor;
        this.ctx.lineWidth = this.lineWidth;
        this.ctx.beginPath();

        this.ctx.moveTo(this.currentPath[0].x, this.currentPath[0].y);
        for (let i = 1; i < this.currentPath.length; i++) {
          this.ctx.lineTo(this.currentPath[i].x, this.currentPath[i].y);
        }

        this.ctx.stroke();
    }
  }

  clearCanvas() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    // this.ctx.fillStyle = "#000000";
    // this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    // console.log(this.existingShapes);

    this.existingShapes.forEach((shape) => {
      switch (shape.type) {
        case "rectangle":
          const width = shape.endX - shape.startX;
          const height = shape.endY - shape.startY;

          this.ctx.strokeStyle = shape.color;
          this.ctx.lineWidth = shape.lineWidth;
          this.ctx.strokeRect(shape.startX, shape.startY, width, height);
          break;
        case "circle":
          this.ctx.strokeStyle = shape.color;
          const radius = Math.sqrt(
            Math.pow(shape.endX - shape.startX, 2) +
              Math.pow(shape.endY - shape.startY, 2)
          );
          this.ctx.beginPath();
          this.ctx.arc(shape.startX, shape.startY, radius, 0, 2 * Math.PI);
          this.ctx.stroke();
          this.ctx.closePath();
          break;
        case "line":
          this.ctx.strokeStyle = shape.color;
          this.ctx.lineWidth = shape.lineWidth;
          this.ctx.beginPath();
          this.ctx.moveTo(shape.startX, shape.startY);
          this.ctx.lineTo(shape.endX, shape.endY);
          this.ctx.stroke();
          this.drawArrowhead(
            this.ctx,
            shape.startX,
            shape.startY,
            shape.endX,
            shape.endY
          );
          break;
        case "text":
          if (!shape.value) {
            return;
          }
          this.ctx.font = "20px Arial";
          this.ctx.fillStyle = shape.color;
          this.ctx.lineWidth = shape.lineWidth;
          this.ctx.fillText(shape.value, shape.startX, shape.startY);
          break;
        case "pencil":
          if (shape.points?.length === undefined || shape.points?.length < 2)
            return;
          // console.log("painting...");

          this.ctx.strokeStyle = shape.color;
          this.ctx.lineWidth = shape.lineWidth;
          this.ctx.beginPath();

          this.ctx.moveTo(shape.points[0].x, shape.points[0].y);
          for (let i = 1; i < shape.points.length; i++) {
            this.ctx.lineTo(shape.points[i].x, shape.points[i].y);
          }

          this.ctx.stroke();
      }
    });
  }

  stopDrawing(e: MouseEvent) {
    const endX = e.offsetX;
    const endY = e.offsetY;
    const selectedTool = this.selectedTool;
    let shape: Shape | null = null;

    if (selectedTool === "move") {
      this.isDragging = false;
      this.selectedShapeIndex = null;
      return;
    } else {
      this.isDrawing = false;
    }

    if (selectedTool === "select" && this.selectionRectangle) {
      const { startX, startY, endX, endY } = this.selectionRectangle;
      this.shapesToBeDeleted = this.existingShapes.filter((shape) => {
        const boundingBox = this.getBoundingBox(shape)!;

        // if (shape.type === "line") {
        //   return (
        //     (boundingBox.startX >= startX || boundingBox.endX <= endX) &&
        //     (boundingBox.startY >= startY || boundingBox.endY <= endY)
        //   );
        // }
        return (
          boundingBox.startX >= startX &&
          boundingBox.endX <= endX &&
          boundingBox.startY >= startY &&
          boundingBox.endY <= endY
        );
      });

      console.log("Shapes selected:", this.shapesToBeDeleted);

      this.shapesToBeDeleted.forEach((shapeTOBeDelete) => {
        const shape = this.existingShapes.find(
          (s) => s.id === shapeTOBeDelete.id
        );
        if (shape) {
          //* Due to indexing logic , after deleting one element , remaining element shifs -> change in Index , -> use id's
          this.socket.send(
            JSON.stringify({
              type: "delete_shape_by_id",
              shapeId: shape.id,
              roomId: this.roomId,
            })
          );
        }
      });
      this.selectionRectangle = null;
      this.isDrawing = false;

      this.clearCanvas();
      return;
    }

    switch (selectedTool) {
      case "rectangle":
        shape = {
          id: nanoid(),
          type: "rectangle",
          startX: this.startX,
          startY: this.startY,
          endX,
          endY,
          color: this.selectedColor,
          lineWidth: this.lineWidth,
        };
        break;
      case "circle":
        shape = {
          id: nanoid(),
          type: "circle",
          startX: this.startX,
          startY: this.startY,
          endX,
          endY,
          color: this.selectedColor,
          lineWidth: this.lineWidth,
        };
        break;
      case "line":
        shape = {
          id: nanoid(),
          type: "line",
          startX: this.startX,
          startY: this.startY,
          endX,
          endY,
          color: this.selectedColor,
          lineWidth: this.lineWidth,
        };

        break;
      case "pencil":
        shape = {
          id: nanoid(),
          type: "pencil",
          points: [...this.currentPath],
          startX: 0,
          startY: 0,
          endX: 0,
          endY: 0,
          color: this.selectedColor,
          lineWidth: this.lineWidth,
        };

        this.currentPath = [];
        break;
    }

    if (!shape) return;

    this.existingShapes.push(shape);

    this.clearCanvas();

    this.socket.send(
      JSON.stringify({
        type: "chat",
        message: JSON.stringify({
          shape,
        }),
        roomId: this.roomId,
      })
    );
  }

  initMouseHandlers() {
    this.canvas.addEventListener("mousedown", this.startDrawing);

    this.canvas.addEventListener("mouseup", this.stopDrawing);

    this.canvas.addEventListener("mousemove", this.Drawing);

    this.canvas.addEventListener("dblclick", this.handleDoubleClick);
  }

  destroy() {
    this.canvas.removeEventListener("mousedown", this.startDrawing);

    this.canvas.removeEventListener("mouseup", this.stopDrawing);

    this.canvas.removeEventListener("mousemove", this.Drawing);

    this.canvas.removeEventListener("dblclick", this.handleDoubleClick);
  }

  private drawArrowhead(
    ctx: CanvasRenderingContext2D,
    fromX: number,
    fromY: number,
    toX: number,
    toY: number
  ) {
    const headLengthInPixels = 5 * 5;
    const angle = Math.atan2(toY - fromY, toX - fromX);
    ctx.beginPath();
    ctx.moveTo(toX, toY);
    ctx.lineTo(
      toX - headLengthInPixels * Math.cos(angle - Math.PI / 6),
      toY - headLengthInPixels * Math.sin(angle - Math.PI / 6)
    );
    ctx.moveTo(toX, toY);
    ctx.lineTo(
      toX - headLengthInPixels * Math.cos(angle + Math.PI / 6),
      toY - headLengthInPixels * Math.sin(angle + Math.PI / 6)
    );
    ctx.stroke();
  }

  initHandlers() {
    this.socket.onmessage = (event) => {
      const message = JSON.parse(event.data);
      console.log(message);

      if (message.type === "chat") {
        const parsedShape = JSON.parse(message.message);
        // console.log(JSON.stringify(parsedShape));

        const isDuplicate = this.existingShapes.some(
          (existingShape) =>
            JSON.stringify(existingShape) === JSON.stringify(parsedShape.shape)
        );
        if (isDuplicate) return;
        this.existingShapes.push(parsedShape.shape);
        this.clearCanvas();
      }

      if (message.type === "move_shape") {
        const { shape, shapeIndex } = message;

        if (this.existingShapes[shapeIndex]) {
          this.existingShapes[shapeIndex] = shape;
        }
        this.clearCanvas();
      }

      if (message.type === "delete_shape") {
        const { deleteIndex } = message;

        this.existingShapes = this.existingShapes.filter(
          (_, index) => index !== deleteIndex
        );

        this.clearCanvas();
      }

      if (message.type === "delete_shape_by_id") {
        const { shapeId } = message;

        this.existingShapes = this.existingShapes.filter(
          (shape) => shape.id !== shapeId
        );

        this.clearCanvas();
      }
    };
  }

  private getBoundingBox(shape: Shape) {
    switch (shape.type) {
      case "rectangle":
        return {
          startX: Math.min(shape.startX, shape.endX),
          endX: Math.max(shape.startX, shape.endX),
          startY: Math.min(shape.startY, shape.endY),
          endY: Math.max(shape.startY, shape.endY),
        };
      case "circle":
        const centerX = (shape.startX + shape.endX) / 2;
        const centerY = (shape.startY + shape.endY) / 2;
        const radius =
          Math.sqrt(
            Math.pow(shape.endX - shape.startX, 2) +
              Math.pow(shape.endY - shape.startY, 2)
          ) / 2;
        return {
          startX: centerX - radius,
          endX: centerX + radius,
          startY: centerY - radius,
          endY: centerY + radius,
        };
      case "line":
        return {
          startX: Math.min(shape.startX, shape.endX),
          endX: Math.max(shape.startX, shape.endX),
          startY: Math.min(shape.startY, shape.endY),
          endY: Math.max(shape.startY, shape.endY),
        };
      case "pencil":
        const xValues = shape.points!.map((point) => point.x);
        const yValues = shape.points!.map((point) => point.y);
        return {
          startX: Math.min(...xValues),
          endX: Math.max(...xValues),
          startY: Math.min(...yValues),
          endY: Math.max(...yValues),
        };
      case "text":
        const fontSize = 16;
        const width = shape.value!.length * fontSize * 0.6;
        const height = fontSize;
        return {
          startX: shape.startX,
          endX: shape.startX + width,
          startY: shape.startY,
          endY: shape.startY + height,
        };
      default:
        return;
    }
  }
}