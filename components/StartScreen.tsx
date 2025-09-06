/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useState, useRef } from 'react';
import { UploadIcon } from './icons';

interface StartScreenProps {
  onAnalyze: (imageFile: File, description: string) => void;
  isLoading: boolean;
}

const StartScreen: React.FC<StartScreenProps> = ({ onAnalyze, isLoading }) => {
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [description, setDescription] = useState('');
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (files: FileList | null) => {
    setError(null);
    if (files && files[0]) {
      if (files[0].type.startsWith('image/')) {
        setSelectedFile(files[0]);
      } else {
        setError('Please select a valid image file (e.g., JPG, PNG).');
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedFile) {
      onAnalyze(selectedFile, description);
    } else {
      setError('Please upload an image before analyzing.');
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto text-center p-8 animate-fade-in">
      <div className="flex flex-col items-center gap-6">
        <h1 className="text-5xl font-extrabold tracking-tight text-gray-100 sm:text-6xl">
          Visualize Car Damage with <span className="text-blue-400">AI</span>
        </h1>
        <p className="max-w-2xl text-lg text-gray-400">
          Upload a photo of your car to get an AI-powered damage report, including highlighted problem areas and a realistic repair preview.
        </p>

        <form onSubmit={handleSubmit} className="w-full mt-6 flex flex-col items-center gap-6">
          <div 
            className={`w-full p-8 transition-all duration-300 rounded-2xl border-2 ${isDraggingOver ? 'bg-blue-500/10 border-dashed border-blue-400 scale-105' : 'bg-gray-800/50 border-gray-700'}`}
            onDragOver={(e) => { e.preventDefault(); setIsDraggingOver(true); }}
            onDragLeave={() => setIsDraggingOver(false)}
            onDrop={(e) => {
              e.preventDefault();
              setIsDraggingOver(false);
              handleFileSelect(e.dataTransfer.files);
            }}
            onClick={() => fileInputRef.current?.click()}
          >
            <input 
              ref={fileInputRef}
              id="image-upload-start" 
              type="file" 
              className="hidden" 
              accept="image/jpeg,image/png" 
              onChange={(e) => handleFileSelect(e.target.files)} 
            />
            {selectedFile ? (
                <div className="text-green-400 font-semibold text-lg">
                    <p>{selectedFile.name}</p>
                    <p className="text-sm text-gray-400">({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)</p>
                    <span className="text-sm text-blue-400 mt-2 block">Click here to change selection</span>
                </div>
            ) : (
                <div className="flex flex-col items-center gap-3 text-gray-400 cursor-pointer">
                    <UploadIcon className="w-10 h-10" />
                    <span className="font-semibold text-lg text-gray-200">Upload your car photo</span>
                    <span className="text-sm">or drag and drop a file here</span>
                </div>
            )}
          </div>
          
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe the issue (optional, e.g., 'dent on the driver side door and scratches on the bumper')"
            className="w-full bg-gray-800 border border-gray-600 text-gray-200 rounded-lg p-4 focus:ring-2 focus:ring-blue-500 focus:outline-none transition disabled:opacity-60 text-base"
            rows={3}
            disabled={isLoading}
          />
          
          {error && <p className="text-red-400 text-sm">{error}</p>}
          
          <button type="submit" disabled={!selectedFile || isLoading} className="relative inline-flex items-center justify-center px-10 py-4 text-xl font-bold text-white bg-blue-600 rounded-full group hover:bg-blue-500 transition-colors disabled:bg-blue-800 disabled:cursor-not-allowed">
            {isLoading ? 'Analyzing...' : 'Analyze Damage'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default StartScreen;
