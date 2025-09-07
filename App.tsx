/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { generateDamageAnalysis, generateRepairedPreview } from './services/geminiService';
import Header from './components/Header';
import Spinner from './components/Spinner';
import StartScreen from './components/StartScreen';
import CostEstimationPanel from './components/CostEstimationPanel';
import AboutMe from './components/AboutMe';
import type { RepairCost, VehicleInfo } from './types';

const translations = {
  en: {
    headerTitle: "Smart Garage Car Damage Visualizer",
    uploadTitle: "Upload Your Vehicle's Photo",
    uploadSubtitle: "Get an instant AI-powered damage assessment, cost estimate, and a preview of the repaired vehicle.",
    uploadPrompt: "Click to upload",
    uploadDragDrop: "or drag and drop",
    uploadFormats: "PNG, JPG, WEBP, etc. (Max 10MB)",
    descriptionPlaceholder: "Briefly describe the vehicle and any known damage (e.g., '2022 Tesla Model 3, rear-ended at low speed')...",
    analyzeButton: "Analyze Damage",
    analyzingButton: "Analyzing...",
    analyzingTitle: "Analyzing your vehicle...",
    analyzingSubtitle: "The AI is detecting damage, estimating costs, and generating a repair preview. This may take a moment.",
    errorTitle: "An Error Occurred",
    tryAgainButton: "Try Again",
    originalVehicle: "Original Vehicle",
    annotatedDamage: "Annotated Damage",
    repairedPreview: "Repaired Preview",
    analyzeAnotherButton: "Analyze Another Vehicle",
    costPanelTitle: "Estimated Repair Costs",
    readDiagnosis: "Read Diagnosis",
    stopDiagnosis: "Stop",
    tablePart: "Part",
    tableDamage: "Detected Damage",
    tableAction: "Suggested Action",
    tableCostUSD: "Est. Cost (USD)",
    tableCostRWF: "Est. Cost (RWF)",
    totalCost: "Total Estimated Cost",
    disclaimer: "Disclaimer: These are AI-generated estimates and suggestions, and should be used for informational purposes only. For an accurate quote, please consult a professional auto-body specialist.",
    errorSelectImage: "Please select a valid image file (JPEG, PNG, WEBP, etc.).",
    errorSelectImageToAnalyze: "Please select an image file to analyze.",
    errorProvideDescription: "Please provide a brief description of the vehicle or incident.",
    changeImage: "Click to change image",
    language: "Language",
    english: "English",
    swahili: "Swahili",
    aboutTitle: "About the Founder",
    howItWorksTitle: "How It Works",
    step1Title: "Upload Photo",
    step1Desc: "Provide a clear image of the damaged area of your vehicle.",
    step2Title: "Add Details",
    step2Desc: "Briefly describe the incident for a more accurate assessment.",
    step3Title: "Get Instant Analysis",
    step3Desc: "Receive a detailed report with annotated images and cost estimates.",
    advantagesTitle: "Key Advantages",
    advantage1: "Instant AI-powered assessment",
    advantage2: "Transparent, multi-currency cost estimates",
    advantage3: "Photorealistic repair previews",
    advantage4: "Multilingual support (English & Swahili)",
    getStarted: "Get Started"
  },
  sw: {
    headerTitle: "Kionyeshi cha Uharibifu wa Gari",
    uploadTitle: "Pakia Picha ya Gari Lako",
    uploadSubtitle: "Pata tathmini ya haraka ya uharibifu inayotumia AI, makadirio ya gharama, na ona muonekano wa gari baada ya ukarabati.",
    uploadPrompt: "Bofya kupakia",
    uploadDragDrop: "au buruta na uangushe",
    uploadFormats: "PNG, JPG, WEBP, n.k. (Upeo 10MB)",
    descriptionPlaceholder: "Eleza kwa kifupi kuhusu gari na uharibifu wowote unaojulikana (k.m., 'Tesla Model 3 ya 2022, imegongwa kwa nyuma kwa kasi ndogo')...",
    analyzeButton: "Changanua Uharibifu",
    analyzingButton: "Inachanganua...",
    analyzingTitle: "Tunachanganua gari lako...",
    analyzingSubtitle: "AI inatambua uharibifu, inakadiria gharama, na kuandaa muonekano wa awali baada ya ukarabati. Hii inaweza kuchukua muda mfupi.",
    errorTitle: "Hitilafu Imetokea",
    tryAgainButton: "Jaribu Tena",
    originalVehicle: "Gari Halisi",
    annotatedDamage: "Uharibifu Uliowekewa Alama",
    repairedPreview: "Muonekano Baada ya Ukarabati",
    analyzeAnotherButton: "Changanua Gari Jingine",
    costPanelTitle: "Makadirio ya Gharama za Ukarabati",
    readDiagnosis: "Soma Uchunguzi",
    stopDiagnosis: "Simamisha",
    tablePart: "Sehemu",
    tableDamage: "Uharibifu Uliotambuliwa",
    tableAction: "Hatua Iliyopendekezwa",
    tableCostUSD: "Gharama (USD)",
    tableCostRWF: "Gharama (RWF)",
    totalCost: "Jumla ya Gharama Zilizokadiriwa",
    disclaimer: "Kanusho: Haya ni makadirio na mapendekezo yaliyotolewa na AI, na yanapaswa kutumika kwa madhumuni ya habari tu. Kwa bei kamili, tafadhali wasiliana na fundi stadi wa magari.",
    errorSelectImage: "Tafadhali chagua faili sahihi ya picha (JPEG, PNG, WEBP, n.k.).",
    errorSelectImageToAnalyze: "Tafadhali chagua faili ya picha ili kuchanganua.",
    errorProvideDescription: "Tafadhali toa maelezo mafupi ya gari au tukio.",
    changeImage: "Bofya kubadilisha picha",
    language: "Lugha",
    english: "Kiingereza",
    swahili: "Kiswahili",
    aboutTitle: "Kuhusu Mwanzilishi",
    howItWorksTitle: "Inavyofanya Kazi",
    step1Title: "Pakia Picha",
    step1Desc: "Toa picha inayoonekana vizuri ya eneo lenye uharibifu kwenye gari lako.",
    step2Title: "Ongeza Maelezo",
    step2Desc: "Eleza tukio kwa ufupi ili kupata tathmini sahihi zaidi.",
    step3Title: "Pata Uchambuzi wa Papo Hapo",
    step3Desc: "Pokea ripoti ya kina yenye picha zilizowekewa alama na makadirio ya gharama.",
    advantagesTitle: "Faida Muhimu",
    advantage1: "Tathmini ya papo hapo inayoendeshwa na AI",
    advantage2: "Makadirio ya gharama ya wazi kwa sarafu tofauti",
    advantage3: "Muonekano halisi wa gari baada ya ukarabati",
    advantage4: "Usaidizi wa lugha nyingi (Kiingereza na Kiswahili)",
    getStarted: "Anza Sasa"
  }
};

export type Language = keyof typeof translations;
const DEFAULT_LANGUAGE: Language = 'en';

export type TranslationKey = keyof typeof translations[typeof DEFAULT_LANGUAGE];

const App: React.FC = () => {
  const [originalImage, setOriginalImage] = useState<{ file: File, url: string } | null>(null);
  const [annotatedImage, setAnnotatedImage] = useState<string | null>(null);
  const [repairedImage, setRepairedImage] = useState<string | null>(null);
  const [costData, setCostData] = useState<RepairCost[] | null>(null);
  const [vehicleInfo, setVehicleInfo] = useState<VehicleInfo | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [language, setLanguage] = useState<Language>(DEFAULT_LANGUAGE);

  const t = useMemo(() => (key: TranslationKey): string => {
    return translations[language][key] || translations[DEFAULT_LANGUAGE][key];
  }, [language]);


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
    setCostData(null);
    setVehicleInfo(null);

    // Revoke previous object URL if it exists
    if (originalImage) {
      URL.revokeObjectURL(originalImage.url);
    }
    setOriginalImage({ file: imageFile, url: URL.createObjectURL(imageFile) });

    try {
      const [analysisResult, repairResult] = await Promise.allSettled([
        generateDamageAnalysis(imageFile, description, language),
        generateRepairedPreview(imageFile, description),
      ]);

      let analysisError: string | null = null;
      let repairError: string | null = null;

      if (analysisResult.status === 'fulfilled') {
        setAnnotatedImage(analysisResult.value.annotatedImage);
        setCostData(analysisResult.value.analysis.costs);
        setVehicleInfo(analysisResult.value.analysis.vehicle);
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
  }, [originalImage, language]);

  const handleStartOver = useCallback(() => {
    setOriginalImage(null);
    setAnnotatedImage(null);
    setRepairedImage(null);
    setCostData(null);
    setVehicleInfo(null);
    setError(null);
    setIsLoading(false);
  }, []);
  
  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="text-center animate-fade-in flex flex-col items-center gap-4">
          <Spinner />
          <h2 className="text-2xl font-bold text-gray-200">{t('analyzingTitle')}</h2>
          <p className="text-md text-gray-400 max-w-md">{t('analyzingSubtitle')}</p>
        </div>
      );
    }

    if (error) {
       return (
           <div className="text-center animate-fade-in bg-red-500/10 border border-red-500/20 p-6 sm:p-8 rounded-lg max-w-2xl mx-auto flex flex-col items-center gap-4">
            <h2 className="text-xl sm:text-2xl font-bold text-red-300">{t('errorTitle')}</h2>
            <p className="text-sm sm:text-md text-red-400">{error}</p>
            <button
                onClick={handleStartOver}
                className="bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-6 rounded-lg text-md transition-colors mt-4"
              >
                {t('tryAgainButton')}
            </button>
          </div>
        );
    }
    
    if (originalImage && annotatedImage && repairedImage) {
        return (
            <div className="w-full max-w-7xl mx-auto flex flex-col items-center gap-8 animate-fade-in">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8 w-full items-start">
                    <div className="flex flex-col items-center gap-3">
                        <h3 className="text-lg sm:text-xl font-bold text-gray-200">{t('originalVehicle')}</h3>
                        <img src={originalImage.url} alt="Original car" className="w-full h-auto object-contain rounded-lg shadow-2xl" />
                    </div>
                    <div className="flex flex-col items-center gap-3">
                        <h3 className="text-lg sm:text-xl font-bold text-gray-200">{t('annotatedDamage')}</h3>
                        <img src={annotatedImage} alt="Car with annotated damage" className="w-full h-auto object-contain rounded-lg shadow-2xl" />
                    </div>
                    <div className="flex flex-col items-center gap-3">
                        <h3 className="text-lg sm:text-xl font-bold text-gray-200">{t('repairedPreview')}</h3>
                        <img src={repairedImage} alt="Repaired car" className="w-full h-auto object-contain rounded-lg shadow-2xl" />
                    </div>
                </div>

                {costData && vehicleInfo && <CostEstimationPanel costs={costData} vehicle={vehicleInfo} t={t} language={language} />}

                <button 
                    onClick={handleStartOver}
                    className="mt-6 bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 px-8 text-lg rounded-lg transition-all duration-300 ease-in-out shadow-lg shadow-blue-500/20 hover:shadow-xl hover:shadow-blue-500/40 hover:-translate-y-px active:scale-95 active:shadow-inner"
                >
                    {t('analyzeAnotherButton')}
                </button>
            </div>
        )
    }

    return <StartScreen onAnalyze={handleAnalyze} isLoading={isLoading} t={t} />;
  };
  
  return (
    <div className="min-h-screen text-gray-100 flex flex-col">
      <Header t={t} language={language} setLanguage={setLanguage} />
      <main className="flex-grow w-full max-w-[1600px] mx-auto p-4 sm:p-6 md:p-8 flex justify-center items-center">
        {renderContent()}
      </main>
      <footer className="w-full p-4 sm:p-6 md:p-8 pt-0">
        {!originalImage && !isLoading && !error && <AboutMe t={t} />}
      </footer>
    </div>
  );
};

export default App;
