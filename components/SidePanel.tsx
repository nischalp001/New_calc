import React from 'react';
import { X, Clock, Zap } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { SidePanelProps } from '../types';

const SidePanel: React.FC<SidePanelProps> = ({ isOpen, onClose, results }) => {
  return (
    <>
      {/* Backdrop */}
      <div 
        className={`fixed inset-0 bg-black/40 backdrop-blur-sm z-40 transition-opacity duration-300 ${
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
      />
      
      {/* Panel */}
      <div 
        className={`fixed top-0 right-0 h-full w-full sm:w-[400px] bg-white dark:bg-zinc-900 shadow-2xl z-50 transform transition-transform duration-300 ease-in-out border-l border-gray-200 dark:border-zinc-800 ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="flex flex-col h-full">
          <div className="flex justify-between items-center p-5 border-b border-gray-200 dark:border-zinc-800 bg-gray-50 dark:bg-zinc-900">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <Clock size={20} />
              Computation Log
            </h2>
            <button onClick={onClose} className="p-2 hover:bg-gray-200 dark:hover:bg-zinc-800 rounded-full transition-colors">
              <X size={20} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {results.length === 0 ? (
              <div className="text-center text-gray-500 dark:text-gray-400 mt-10">
                <p>No history available.</p>
              </div>
            ) : (
              results.slice().reverse().map((result) => (
                <div 
                  key={result.id} 
                  className={`p-4 rounded-lg border ${
                    result.type === 'advanced' 
                      ? 'bg-purple-50 border-purple-100 dark:bg-zinc-800 dark:border-zinc-700' 
                      : 'bg-gray-50 border-gray-100 dark:bg-zinc-800/50 dark:border-zinc-800'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-mono text-gray-500 dark:text-gray-400">
                      {new Date(result.timestamp).toLocaleTimeString()}
                    </span>
                    {result.type === 'advanced' && (
                      <Zap size={14} className="text-purple-500" />
                    )}
                  </div>
                  
                  <div className="mb-2 text-sm text-gray-600 dark:text-gray-300 font-medium">
                    {result.input}
                  </div>
                  
                  <div className="text-gray-900 dark:text-gray-100 text-sm leading-relaxed overflow-x-auto">
                    {result.type === 'advanced' ? (
                       <div className="prose dark:prose-invert prose-sm max-w-none">
                         <ReactMarkdown>{result.output}</ReactMarkdown>
                       </div>
                    ) : (
                      <span className="font-mono text-lg font-bold">{result.output}</span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default SidePanel;