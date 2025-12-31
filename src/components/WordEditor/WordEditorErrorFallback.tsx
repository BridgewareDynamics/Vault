// path: src/components/WordEditor/WordEditorErrorFallback.tsx

import { AlertCircle } from 'lucide-react';

interface WordEditorErrorFallbackProps {
  error: Error | null;
  onReset: () => void;
}

export function WordEditorErrorFallback({ error, onReset }: WordEditorErrorFallbackProps) {
  return (
    <div className="flex flex-col h-full items-center justify-center p-8 bg-gray-900/50">
      <div className="max-w-md w-full bg-gray-800/95 backdrop-blur-md rounded-lg border-2 border-red-500/50 shadow-2xl p-6 text-center">
        <div className="mb-4">
          <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-3" />
          <h2 className="text-xl font-bold bg-gradient-purple bg-clip-text text-transparent mb-2">
            Word Editor Error
          </h2>
          <p className="text-gray-300 text-sm mb-3">
            An error occurred in the word editor. Your work is safe, but the editor needs to be reset.
          </p>
          {error && (
            <div className="mt-3 p-3 bg-red-900/50 border border-red-500/50 rounded-lg">
              <p className="text-red-200 text-xs font-mono break-words">
                {error.message}
              </p>
            </div>
          )}
        </div>
        <button
          onClick={onReset}
          className="px-4 py-2 bg-gradient-purple hover:opacity-90 text-white rounded-lg font-semibold transition-opacity border border-cyber-purple-500/60 shadow-lg"
        >
          Reset Editor
        </button>
      </div>
    </div>
  );
}







