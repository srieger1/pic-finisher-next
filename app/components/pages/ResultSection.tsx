import { motion } from "framer-motion";
import React from "react";
import { Style } from "../../types/prompts";
import { RefreshCw } from "lucide-react";

interface Word {
  display: string;
  prompt: string;
}

interface ResultSectionProps {
  drawing: string;
  generatedImage: string;
  onStyleChange: (style: Style) => void;
  currentStyle: Style;
  availableStyles: Style[];
  isGenerating: boolean;
  selectedWord: Word;
  onRedraw: () => void;
}

export function ResultSection({
  drawing,
  generatedImage,
  onStyleChange,
  currentStyle,
  availableStyles,
  isGenerating,
  selectedWord,
  onRedraw,
}: ResultSectionProps) {
  const drawingSrc = `data:image/png;base64,${drawing}`;
  const generatedSrc = `data:image/png;base64,${generatedImage}`;

  return (
    <section className="flex-1 flex flex-col min-h-0">
      <h2 className="text-3xl font-semibold mb-6 text-center">Ergebnis</h2>

      {/* Bild-Container mit gleicher Höhe */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 flex-1 min-h-0 mb-6">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="flex flex-col"
        >
          <h3 className="text-xl font-medium mb-3 text-center">
            Du hast gemalt: {selectedWord.display}
          </h3>
          <div className="flex justify-center flex-1 items-center">
            <img
              src={drawingSrc}
              alt="Gezeichnetes Bild"
              width={512}
              height={512}
              className="max-w-full max-h-full object-contain rounded-lg shadow-lg"
            />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4 }}
          className="flex flex-col"
        >
          <h3 className="text-xl font-medium mb-3 text-center">
            KI-generiertes Bild
          </h3>
          <div className="relative flex-1 flex items-center justify-center">
            <img
              src={generatedSrc}
              alt="KI-generiertes Bild"
              width={512}
              height={512}
              className="max-w-full max-h-full object-contain rounded-lg shadow-lg"
              onError={(e) => {
                console.error("Error loading generated image:", e);
                const imgElement = e.target as HTMLImageElement;
                console.log("Failed src:", imgElement.src);
              }}
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
        </motion.div>
      </div>

      {/* Controls separat unter den Bildern */}
      <div className="flex flex-col items-center gap-3">
        <div className="flex flex-wrap justify-center gap-2">
          {availableStyles.map((style) => (
            <button
              key={style}
              onClick={() => onStyleChange(style)}
              disabled={isGenerating}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                currentStyle === style
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-900 dark:text-white'
              }`}
            >
              {style}
            </button>
          ))}
        </div>

        <button
          onClick={onRedraw}
          disabled={isGenerating}
          className="flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-900 dark:text-white shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
          style={{ fontSize: 16 }}
        >
          <RefreshCw className="w-5 h-5" />
          Neu generieren
        </button>
      </div>

      <div className="mt-4 text-center">
        <p className="text-xs text-gray-500 break-words">
          {selectedWord.prompt}
        </p>
      </div>
    </section>
  );
}
