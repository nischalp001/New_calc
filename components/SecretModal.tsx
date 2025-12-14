import React, { useState, useRef, useEffect } from 'react';
import { X, Upload, Loader2 } from 'lucide-react';
import { ModalProps } from '../types';

const SecretModal: React.FC<ModalProps> = ({ isOpen, onClose, onSubmit, isLoading }) => {
  const [text, setText] = useState('');
  const [image, setImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isOpen) {
      setText('');
      setImage(null);
    }
  }, [isOpen]);

  // Handle paste events for images
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      if (!isOpen) return;
      
      const items = e.clipboardData?.items;
      if (items) {
        for (let i = 0; i < items.length; i++) {
          if (items[i].type.indexOf('image') !== -1) {
            const blob = items[i].getAsFile();
            if (blob) {
              const reader = new FileReader();
              reader.onload = (event) => {
                setImage(event.target?.result as string);
              };
              reader.readAsDataURL(blob);
            }
          }
        }
      }
    };

    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, [isOpen]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setImage(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = () => {
    if (!text && !image) return;
    onSubmit(text, image);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-zinc-800 rounded-lg shadow-xl w-full max-w-lg overflow-hidden border border-gray-200 dark:border-zinc-700">
        <div className="flex justify-between items-center p-4 border-b border-gray-200 dark:border-zinc-700">
          <h3 className="font-mono text-lg font-bold text-gray-800 dark:text-gray-100">
            Advanced Input
          </h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300">
            <X size={20} />
          </button>
        </div>
        
        <div className="p-6 space-y-4">
          <textarea
            className="w-full h-32 p-3 bg-gray-50 dark:bg-zinc-900 border border-gray-300 dark:border-zinc-600 rounded-md focus:ring-2 focus:ring-gray-400 focus:outline-none dark:text-white resize-none"
            placeholder="Enter complex problem or description..."
            value={text}
            onChange={(e) => setText(e.target.value)}
            disabled={isLoading}
          />

          <div 
            className={`border-2 border-dashed rounded-md p-4 text-center cursor-pointer transition-colors ${
              image ? 'border-green-500 bg-green-50 dark:bg-green-900/10' : 'border-gray-300 dark:border-zinc-600 hover:bg-gray-50 dark:hover:bg-zinc-900'
            }`}
            onClick={() => fileInputRef.current?.click()}
          >
            {image ? (
              <div className="relative h-24 flex items-center justify-center">
                <img src={image} alt="Preview" className="h-full object-contain" />
                <button 
                  onClick={(e) => { e.stopPropagation(); setImage(null); }}
                  className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1"
                >
                  <X size={12} />
                </button>
              </div>
            ) : (
              <div className="flex flex-col items-center text-gray-500 dark:text-gray-400">
                <Upload size={24} className="mb-2" />
                <span className="text-sm">Click to upload or paste image</span>
              </div>
            )}
            <input 
              type="file" 
              ref={fileInputRef} 
              className="hidden" 
              accept="image/*"
              onChange={handleImageUpload}
              disabled={isLoading}
            />
          </div>

          <button
            onClick={handleSubmit}
            disabled={isLoading || (!text && !image)}
            className="w-full py-3 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 font-bold rounded-md hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <Loader2 className="animate-spin" size={20} />
                Processing...
              </>
            ) : (
              "Calculate"
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SecretModal;