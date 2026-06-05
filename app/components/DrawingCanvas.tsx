"use client";
import { useEffect, useState, useRef } from "react";
import { ColorPaletteSelector } from "./ColorPaletteSelector";
import { BackgroundSelector } from "./BackgroundSelector";
import { BrushSizeSelector } from "./BrushSizeSelector";
import { Canvas } from "./Canvas";
import { Toolbar } from "./Toolbar";
import { useDrawingStore } from "../store/drawingStore";
import { Style, Background } from "../types/prompts";

interface DrawingCanvasProps {
  onDrawingComplete: (base64Image: string) => void;
  selectedStyle: Style;
  selectedBackground: Background;
  onStyleChange: (style: Style) => void;
  onBackgroundChange: (background: Background) => void;
  isGenerating: boolean;
}

export function DrawingCanvas({
  onDrawingComplete,
  selectedStyle,
  selectedBackground,
  onStyleChange,
  onBackgroundChange,
  isGenerating,
}: DrawingCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [color, setColor] = useState("#000000");
  const [brushSize, setBrushSize] = useState(20);
  const [isEraser, setIsEraser] = useState(false);
  const [backgrounds, setBackgrounds] = useState<Background[]>([]);
  const [history, setHistory] = useState<ImageData[]>([]);
  const [currentStep, setCurrentStep] = useState(-1);

  const { drawing: savedDrawing, setDrawing } = useDrawingStore();

  const handleColorChange = (newColor: string) => {
    setColor(newColor);
    setIsEraser(false);
  };

  // Lade verfügbare Hintergründe
  useEffect(() => {
    const loadCustomBackgrounds = async () => {
      const backgroundList: Background[] = [
        { type: "white", name: "Weiß", value: "#FFFFFF" },
        { type: "black", name: "Schwarz", value: "#000000" },
        {
          type: "custom",
          name: "Klassenzimmer",
          value: "/backgrounds/Klassenzimmer.jpg",
        },
        { type: "custom", name: "Steppe", value: "/backgrounds/Steppe.jpg" },
        {
          type: "custom",
          name: "Horizont Meer",
          value: "/backgrounds/Horizont Meer.jpg",
        },
        { type: "custom", name: "Wiese", value: "/backgrounds/Wiese.jpg" },
        { type: "custom", name: "Wüste", value: "/backgrounds/Wüste.jpg" },
        { type: "custom", name: "Wald", value: "/backgrounds/Wald.jpg" },
        { type: "custom", name: "Strand", value: "/backgrounds/Strand.jpg" },
      ];
      setBackgrounds(backgroundList);
    };

    loadCustomBackgrounds();
  }, []);

  const handleBackgroundChange = (background: Background) => {
    onBackgroundChange(background);
  };

  // Single source of truth for canvas initialization on background or savedDrawing change.
  // handleBackgroundChange does no canvas work so there is no race condition.
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const restoreSavedDrawing = () => {
      if (!savedDrawing) {
        const newImageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        setHistory([newImageData]);
        setCurrentStep(0);
        return;
      }
      const drawingImg = new Image();
      drawingImg.onload = () => {
        ctx.drawImage(drawingImg, 0, 0);
        const newImageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        setHistory([newImageData]);
        setCurrentStep(0);
      };
      drawingImg.src = `data:image/png;base64,${savedDrawing}`;
    };

    if (selectedBackground.type === "custom") {
      const img = new window.Image();
      img.src = selectedBackground.value;
      img.onload = () => {
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        restoreSavedDrawing();
      };
    } else {
      ctx.fillStyle = selectedBackground.value;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      restoreSavedDrawing();
    }
  }, [selectedBackground.type, selectedBackground.value, savedDrawing]);

  const handleUndo = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleRedo = () => {
    if (currentStep < history.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleClear = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    if (selectedBackground.type === "custom") {
      const img = new window.Image();
      img.src = selectedBackground.value;
      img.onload = () => {
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        const newImageData = ctx.getImageData(
          0,
          0,
          canvas.width,
          canvas.height
        );
        setHistory([...history, newImageData]);
        setCurrentStep(currentStep + 1);
      };
    } else {
      ctx.fillStyle = selectedBackground.value;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      const newImageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      setHistory([...history, newImageData]);
      setCurrentStep(currentStep + 1);
    }
  };

  const handleSave = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const pngData = canvas.toDataURL("image/png", 1.0).split(",")[1];
    setDrawing(pngData);
    onDrawingComplete(pngData);
  };

  return (
    <div className="flex gap-4 h-full">
      {/* Linke Seite: Hintergrundauswahl */}
      <div className="flex flex-col gap-4 w-64 flex-shrink-0">
        <BackgroundSelector
          backgrounds={backgrounds}
          selectedBackground={selectedBackground}
          onBackgroundChange={handleBackgroundChange}
        />
      </div>

      {/* Mitte: Canvas und Toolbar */}
      <div className="flex flex-col items-center gap-4 flex-1">
        <div className="relative flex-shrink-0">
          <Canvas
            ref={canvasRef}
            width={512}
            height={512}
            color={color}
            brushSize={brushSize}
            isEraser={isEraser}
          />
          {isGenerating && (
            <div className="absolute inset-0 flex items-center justify-center backdrop-blur-sm bg-white/10 dark:bg-black/10 rounded-lg">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-white mx-auto"></div>
                <p className="mt-4 text-white text-lg">
                  KI generiert dein Bild...
                </p>
              </div>
            </div>
          )}
        </div>

        <div className="w-full flex-shrink-0">
          <Toolbar
            onUndo={handleUndo}
            onRedo={handleRedo}
            onClear={handleClear}
            onSave={handleSave}
            canUndo={currentStep > 0}
            canRedo={currentStep < history.length - 1}
            selectedStyle={selectedStyle}
            onStyleChange={onStyleChange}
          />
        </div>
      </div>

      {/* Rechte Seitenleiste: Pinselgröße und Farbauswahl */}
      <div className="flex flex-col gap-4 w-64 flex-shrink-0">
        {/* Pinselgröße */}
        <BrushSizeSelector
          currentSize={brushSize}
          onSizeChange={setBrushSize}
          minSize={5}
          maxSize={50}
        />

        {/* Farbauswahl */}
        <ColorPaletteSelector
          selectedColor={color}
          onColorChange={handleColorChange}
          isEraser={isEraser}
          onEraserToggle={() => setIsEraser(!isEraser)}
        />
      </div>
    </div>
  );
}
