/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useState, useCallback } from 'react';
import type { RepairCost, VehicleInfo } from '../types';
import { textToSpeech } from '../services/elevenLabsService';
import { SpeakerIcon, SpeakerMuteIcon } from './icons';
import type { Language } from '../App';

type TranslationKey =
  | 'costPanelTitle' | 'readDiagnosis' | 'stopDiagnosis' | 'tablePart'
  | 'tableDamage' | 'tableAction' | 'tableCostUSD' | 'tableCostRWF'
  | 'totalCost' | 'disclaimer';

interface CostEstimationPanelProps {
  costs: RepairCost[];
  vehicle: VehicleInfo;
  t: (key: TranslationKey) => string;
  language: Language;
}

type PlaybackState = 'idle' | 'loading' | 'playing' | 'error';

const CostEstimationPanel: React.FC<CostEstimationPanelProps> = ({ costs, vehicle, t, language }) => {
  const [playbackState, setPlaybackState] = useState<PlaybackState>('idle');
  const [audioPlayer, setAudioPlayer] = useState<HTMLAudioElement | null>(null);

  const handleECommerceSearch = (partName: string) => {
    const { make, model, year } = vehicle;
    const query = `buy ${year} ${make} ${model} ${partName} OEM`;
    const url = `https://www.google.com/search?q=${encodeURIComponent(query)}&tbm=shop`;
    window.open(url, '_blank');
  };
  
  const generateDiagnosisSummary = useCallback(() => {
    if (!costs || costs.length === 0) return "No damage was detected.";
    
    const totalCost = costs.reduce((acc, cost) => acc + cost.costUSD, 0);
    const partCount = costs.length;
    const vehicleName = `${vehicle.year} ${vehicle.make} ${vehicle.model}`;

    let summary = `Analysis for the ${vehicleName}. I've detected damage on ${partCount} ${partCount > 1 ? 'parts' : 'part'}. `;
    
    costs.forEach(cost => {
        summary += `The ${cost.part} has ${cost.damage}. My suggestion is to ${cost.suggestion.toLowerCase()} this part. `;
    });
    
    summary += `The total estimated cost for all repairs is approximately ${Math.round(totalCost)} US dollars.`;
    return summary;
  }, [costs, vehicle]);

  const handlePlayDiagnosis = useCallback(async () => {
    if (playbackState === 'playing' && audioPlayer) {
      audioPlayer.pause();
      audioPlayer.currentTime = 0;
      setPlaybackState('idle');
      return;
    }
    
    if (audioPlayer) {
      audioPlayer.play();
      setPlaybackState('playing');
      return;
    }

    setPlaybackState('loading');
    try {
      // The AI response for `costs` is already in the target language.
      // We generate a summary in English for ElevenLabs, as it's better at cross-language synthesis from an English source text.
      // For a more robust solution, we would have a separate prompt to summarize the translated text.
      const summary = generateDiagnosisSummary();
      const audioUrl = await textToSpeech(summary, language);
      const newPlayer = new Audio(audioUrl);
      
      newPlayer.onended = () => setPlaybackState('idle');
      newPlayer.onerror = () => setPlaybackState('error');
      
      newPlayer.play();
      setAudioPlayer(newPlayer);
      setPlaybackState('playing');

    } catch (error) {
      console.error("Failed to play audio diagnosis:", error);
      setPlaybackState('error');
    }
  }, [playbackState, audioPlayer, generateDiagnosisSummary, language]);


  if (!costs || costs.length === 0) {
    return (
      <div className="w-full mt-8 bg-gray-800/50 border border-gray-700 rounded-lg p-6 text-center">
        <h3 className="text-2xl font-bold text-gray-200 mb-2">{t('costPanelTitle')}</h3>
        <p className="text-gray-400">No damage was detected, or costs could not be estimated.</p>
      </div>
    );
  }

  const totals = costs.reduce(
    (acc, cost) => {
      acc.usd += cost.costUSD || 0;
      acc.rwf += cost.costRWF || 0;
      return acc;
    },
    { usd: 0, rwf: 0 }
  );

  const formatUSD = (amount: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
  const formatRWF = (amount: number) => new Intl.NumberFormat('en-RW', { style: 'currency', currency: 'RWF', currencyDisplay: 'code' }).format(amount);

  const renderPlayButtonIcon = () => {
    switch(playbackState) {
        case 'loading':
            return <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>;
        case 'playing':
            return <SpeakerMuteIcon className="w-5 h-5" />;
        case 'error':
             return <SpeakerIcon className="w-5 h-5 text-red-400" />;
        default:
            return <SpeakerIcon className="w-5 h-5" />;
    }
  };

  return (
    <div className="w-full mt-8 bg-gray-800/50 border border-gray-700 rounded-lg p-6 shadow-2xl">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-2xl font-bold text-gray-200">{t('costPanelTitle')}</h3>
        <div className="flex items-center gap-4">
            <button 
              onClick={handlePlayDiagnosis}
              disabled={playbackState === 'loading'}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold py-2 px-4 rounded-lg transition-all text-sm disabled:bg-gray-500 disabled:cursor-wait"
            >
              {renderPlayButtonIcon()}
              {playbackState === 'playing' ? t('stopDiagnosis') : t('readDiagnosis')}
            </button>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-max text-left text-gray-300">
          <thead className="border-b border-gray-600 text-sm text-gray-400 uppercase">
            <tr>
              <th className="py-3 px-4">{t('tablePart')}</th>
              <th className="py-3 px-4">{t('tableDamage')}</th>
              <th className="py-3 px-4">{t('tableAction')}</th>
              <th className="py-3 px-4 text-right">{t('tableCostUSD')}</th>
              <th className="py-3 px-4 text-right">{t('tableCostRWF')}</th>
            </tr>
          </thead>
          <tbody>
            {costs.map((item, index) => (
              <tr key={index} className="border-b border-gray-700/50 hover:bg-gray-700/30">
                <td 
                  className="py-4 px-4 font-medium capitalize cursor-pointer hover:text-blue-400 hover:underline"
                  onClick={() => handleECommerceSearch(item.part)}
                  title={`Search for "${item.part}"`}
                >
                  {item.part}
                </td>
                <td className="py-4 px-4 capitalize">{item.damage}</td>
                <td className={`py-4 px-4 font-bold ${item.suggestion.toLowerCase().includes('replace') ? 'text-yellow-400' : 'text-gray-300'}`}>
                  {item.suggestion}
                </td>
                <td className="py-4 px-4 text-right font-mono">{formatUSD(item.costUSD)}</td>
                <td className="py-4 px-4 text-right font-mono">{formatRWF(item.costRWF)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="font-bold text-white text-lg">
              <td colSpan={3} className="py-4 px-4 text-right">{t('totalCost')}</td>
              <td className="py-4 px-4 text-right font-mono">{formatUSD(totals.usd)}</td>
              <td className="py-4 px-4 text-right font-mono">{formatRWF(totals.rwf)}</td>
            </tr>
          </tfoot>
        </table>
      </div>
       <p className="text-xs text-gray-500 mt-4 text-center">
        {t('disclaimer')}
      </p>
    </div>
  );
};

export default CostEstimationPanel;
