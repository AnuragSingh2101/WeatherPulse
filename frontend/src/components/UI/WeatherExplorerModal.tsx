import React from 'react';
import { X, Radio } from 'lucide-react';
import { WeatherExplorer } from '../WeatherExplorer';

interface WeatherExplorerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function WeatherExplorerModal({ isOpen, onClose }: WeatherExplorerModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/60 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-4xl max-h-[92vh] flex flex-col rounded-2xl glass-panel border border-cyan-500/30 shadow-2xl overflow-hidden bg-dark-950/95">
        {/* Modal Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-20 p-2 rounded-xl bg-dark-800/80 hover:bg-dark-700 text-dark-300 hover:text-white border border-white/10 transition-colors"
          title="Close Weather Explorer"
          aria-label="Close Weather Explorer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Content */}
        <div className="flex-1 overflow-hidden">
          <WeatherExplorer onClose={onClose} />
        </div>
      </div>
    </div>
  );
}

export default WeatherExplorerModal;
