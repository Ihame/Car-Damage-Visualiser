/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useState, useCallback, useEffect } from 'react';
import { generateDamageAnalysis, generateRepairedPreview } from './services/geminiService';
import Header from './components/Header';
import Spinner from './components/Spinner';
import StartScreen from './components/StartScreen';
import CostEstimationPanel from './components/CostEstimationPanel';
import type { RepairCost } from './types';

const App: React.FC = () => {
  const [originalImage, setOriginalImage] = useState<{ file: File, url: string } | null>(null);
  const [annotatedImage, setAnnotatedImage] = useState<string | null>(null);
  const [repairedImage, setRepairedImage] = useState<string | null>(null);
  const [costData, setCostData] = useState<RepairCost[] | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Clean up the object URL when the component unmounts or the image changes
  useEffect(() => {
    return () => {
      if (originalImage) {
        URL.revokeObjectURL(originalImage.url);
      }
    };
  }, [originalImage]);

  const handleAnalyze = useCallback(async (imageFile: File, description: string) => {
    setIsLoading(true);
    setError(null);
    setAnnotatedImage(null);
    setRepairedImage(null);
    setCostData(null); // Clear previous cost data
    // Revoke previous object URL if it exists
    if (originalImage) {
      URL.revokeObjectURL(originalImage.url);
    }
    setOriginalImage({ file: imageFile, url: URL.createObjectURL(imageFile) });

    try {
      const [analysisResult, repairResult] = await Promise.allSettled([
        generateDamageAnalysis(imageFile, description),
        generateRepairedPreview(imageFile, description),
      ]);

      let analysisError: string | null = null;
      let repairError: string | null = null;

      if (analysisResult.status === 'fulfilled') {
        setAnnotatedImage(analysisResult.value.annotatedImage);
        setCostData(analysisResult.value.costData);
      } else {
        analysisError = `Analysis Failed: ${analysisResult.reason.message}`;
        console.error(analysisError, analysisResult.reason);
      }

      if (repairResult.status === 'fulfilled') {
        setRepairedImage(repairResult.value);
      } else {
        repairError = `Repair Preview Failed: ${repairResult.reason.message}`;
        console.error(repairError, repairResult.reason);
      }

      if (analysisError || repairError) {
        throw new Error([analysisError, repairError].filter(Boolean).join('; '));
      }

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
      setError(`Failed to analyze the image. ${errorMessage}`);
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [originalImage]);

  const handleStartOver = useCallback(() => {
    setOriginalImage(null);
    setAnnotatedImage(null);
    setRepairedImage(null);
    setCostData(null); // Clear cost data
    setError(null);
    setIsLoading(false);
  }, []);
  
  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="text-center animate-fade-in flex flex-col items-center gap-4">
          <Spinner />
          <h2 className="text-2xl font-bold text-gray-200">Analyzing your vehicle...</h2>
          <p className="text-md text-gray-400 max-w-md">The AI is detecting damage, estimating costs, and generating a repair preview. This may take a moment.</p>
        </div>
      );
    }

    if (error) {
       return (
           <div className="text-center animate-fade-in bg-red-500/10 border border-red-500/20 p-8 rounded-lg max-w-2xl mx-auto flex flex-col items-center gap-4">
            <h2 className="text-2xl font-bold text-red-300">An Error Occurred</h2>
            <p className="text-md text-red-400">{error}</p>
            <button
                onClick={handleStartOver}
                className="bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-6 rounded-lg text-md transition-colors mt-4"
              >
                Try Again
            </button>
          </div>
        );
    }
    
    if (originalImage && annotatedImage && repairedImage) {
        return (
            <div className="w-full max-w-7xl mx-auto flex flex-col items-center gap-8 animate-fade-in">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 w-full">
                    
                    <div className="flex flex-col items-center gap-3">
                        <h3 className="text-xl font-bold text-gray-200">Original</h3>
                        <img src={originalImage.url} alt="Original car" className="w-full h-auto object-contain rounded-lg shadow-2xl" />
                    </div>

                    <div className="flex flex-col items-center gap-3">
                        <h3 className="text-xl font-bold text-red-400">Annotated Damage</h3>
                        <img src={annotatedImage} alt="Car with damage annotated" className="w-full h-auto object-contain rounded-lg shadow-2xl" />
                    </div>

                    <div className="flex flex-col items-center gap-3">
                        <h3 className="text-xl font-bold text-green-400">Repaired Preview</h3>
                        <img src={repairedImage} alt="Repaired car preview" className="w-full h-auto object-contain rounded-lg shadow-2xl" />
                    </div>
                </div>

                {costData && <CostEstimationPanel costs={costData} />}

                <button 
                    onClick={handleStartOver}
                    className="mt-6 bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 px-8 text-lg rounded-lg transition-all duration-300 ease-in-out shadow-lg shadow-blue-500/20 hover:shadow-xl hover:shadow-blue-500/40 hover:-translate-y-px active:scale-95 active:shadow-inner"
                >
                    Analyze Another Vehicle
                </button>
            </div>
        )
    }

    return <StartScreen onAnalyze={handleAnalyze} isLoading={isLoading} />;
  };
  
  return (
    <div className="min-h-screen text-gray-100 flex flex-col">
      <Header />
      <main className="flex-grow w-full max-w-[1600px] mx-auto p-4 md:p-8 flex justify-center items-center">
        {renderContent()}
      </main>
    </div>
  );
};

export default App;