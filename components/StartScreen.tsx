/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React, { useState, useCallback, useRef } from 'react';
import { UploadIcon, CameraIcon, DocumentTextIcon, SparklesIcon, CheckCircleIcon } from './icons';
import type { TranslationKey } from '../App';

interface StartScreenProps {
  onAnalyze: (imageFile: File, description:string) => void;
  isLoading: boolean;
  t: (key: TranslationKey) => string;
}

const StartScreen: React.FC<StartScreenProps> = ({ onAnalyze, isLoading, t }) => {
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [description, setDescription] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = useCallback((files: FileList | null) => {
    if (files && files.length > 0) {
      const file = files[0];
      if (!file.type.startsWith('image/')) {
        setError(t('errorSelectImage'));
        return;
      }
      setError(null);
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  }, [t]);

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  }, []);
  
  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    handleFileChange(e.dataTransfer.files);
  }, [handleFileChange]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!imageFile) {
      setError(t('errorSelectImageToAnalyze'));
      return;
    }
    if (!description.trim()) {
      setError(t('errorProvideDescription'));
      return;
    }
    onAnalyze(imageFile, description);
  };
  
  const triggerFileSelect = () => {
      fileInputRef.current?.click();
  };

  return (
    <div className="w-full max-w-6xl mx-auto animate-fade-in text-center">
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-100 mb-2">{t('uploadTitle')}</h1>
        <p className="text-gray-400 text-base sm:text-lg mb-10 sm:mb-12 max-w-3xl mx-auto">
          {t('uploadSubtitle')}
        </p>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 lg:gap-12 items-start">
            
            {/* Left Side: Guide */}
            <div className="lg:col-span-2 flex flex-col gap-8 text-left">
                <div>
                    <h3 className="text-xl font-bold text-white mb-4">{t('howItWorksTitle')}</h3>
                    <ul className="space-y-4">
                        <li className="flex items-start gap-3">
                            <CameraIcon className="w-6 h-6 text-blue-400 mt-1 flex-shrink-0" />
                            <div>
                                <h4 className="font-semibold text-gray-200">{t('step1Title')}</h4>
                                <p className="text-sm text-gray-400">{t('step1Desc')}</p>
                            </div>
                        </li>
                        <li className="flex items-start gap-3">
                            <DocumentTextIcon className="w-6 h-6 text-blue-400 mt-1 flex-shrink-0" />
                            <div>
                                <h4 className="font-semibold text-gray-200">{t('step2Title')}</h4>
                                <p className="text-sm text-gray-400">{t('step2Desc')}</p>
                            </div>
                        </li>
                        <li className="flex items-start gap-3">
                            <SparklesIcon className="w-6 h-6 text-blue-400 mt-1 flex-shrink-0" />
                            <div>
                                <h4 className="font-semibold text-gray-200">{t('step3Title')}</h4>
                                <p className="text-sm text-gray-400">{t('step3Desc')}</p>
                            </div>
                        </li>
                    </ul>
                </div>
                <div>
                    <h3 className="text-xl font-bold text-white mb-4">{t('advantagesTitle')}</h3>
                    <ul className="space-y-3">
                       {['advantage1', 'advantage2', 'advantage3', 'advantage4'].map(key => (
                          <li key={key} className="flex items-center gap-3">
                            <CheckCircleIcon className="w-5 h-5 text-green-400 flex-shrink-0" />
                            <span className="text-sm text-gray-300">{t(key as TranslationKey)}</span>
                          </li>
                       ))}
                    </ul>
                </div>
            </div>

            {/* Right Side: Uploader Form */}
            <div className="lg:col-span-3">
                <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-6 sm:p-8 shadow-2xl">
                    <h3 className="text-xl font-bold text-white mb-5">{t('getStarted')}</h3>
                    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
                    <div
                        className={`relative border-2 border-dashed rounded-lg p-6 transition-colors duration-200 cursor-pointer 
                                    ${error ? 'border-red-500/60 bg-red-500/10' : 'border-gray-600 hover:border-blue-500 hover:bg-gray-700/50'}`}
                        onDragOver={handleDragOver}
                        onDrop={handleDrop}
                        onClick={triggerFileSelect}
                    >
                        <input
                        type="file"
                        accept="image/*"
                        ref={fileInputRef}
                        onChange={(e) => handleFileChange(e.target.files)}
                        className="hidden"
                        />
                        {imagePreview ? (
                        <div className="relative group">
                            <img src={imagePreview} alt="Selected vehicle" className="max-h-64 mx-auto rounded-md" />
                            <div className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                <p className="text-white text-lg font-semibold">{t('changeImage')}</p>
                            </div>
                        </div>
                        ) : (
                        <div className="flex flex-col items-center justify-center gap-3 text-gray-400">
                            <UploadIcon className="w-10 h-10 sm:w-12 sm:h-12" />
                            <p className="font-semibold text-base sm:text-lg">
                            <span className="text-blue-400">{t('uploadPrompt')}</span> {t('uploadDragDrop')}
                            </p>
                            <p className="text-xs sm:text-sm">{t('uploadFormats')}</p>
                        </div>
                        )}
                    </div>
                    
                    <textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder={t('descriptionPlaceholder')}
                        className="w-full bg-gray-900/50 border border-gray-600 rounded-lg p-3 text-gray-200 placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-sm sm:text-base"
                        rows={3}
                        disabled={isLoading}
                    />
                    
                    {error && <p className="text-red-400 text-sm font-medium animate-shake">{error}</p>}

                    <button
                        type="submit"
                        disabled={isLoading || !imageFile || !description.trim()}
                        className="w-full bg-blue-600 text-white font-bold py-3 px-6 rounded-lg text-lg transition-all duration-300 ease-in-out shadow-lg shadow-blue-500/20 hover:shadow-xl hover:shadow-blue-500/40 hover:-translate-y-px disabled:bg-gray-500 disabled:cursor-not-allowed disabled:shadow-none disabled:hover:-translate-y-0 active:scale-95 active:shadow-inner"
                    >
                        {isLoading ? t('analyzingButton') : t('analyzeButton')}
                    </button>
                    </form>
                </div>
            </div>

        </div>
    </div>
  );
};

export default StartScreen;
