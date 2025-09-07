/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React from 'react';
import { CarIcon } from './icons';
import type { Language } from '../App';

type TranslationKey = 'headerTitle' | 'language' | 'english' | 'swahili';

interface HeaderProps {
  t: (key: TranslationKey) => string;
  language: Language;
  setLanguage: (lang: Language) => void;
}


const Header: React.FC<HeaderProps> = ({ t, language, setLanguage }) => {
  return (
    <header className="w-full py-4 px-4 sm:px-8 border-b border-gray-700/50 bg-gray-900/30 backdrop-blur-sm sticky top-0 z-50">
      <div className="w-full max-w-[1600px] mx-auto flex items-center justify-between">
        <div className="flex items-center justify-center gap-3">
            <CarIcon className="w-7 h-7 sm:w-8 sm:h-8 text-blue-400" />
            <h1 className="text-lg sm:text-xl font-bold tracking-tight text-gray-100">
              {t('headerTitle')}
            </h1>
        </div>
        <div className="flex items-center gap-2">
          <label htmlFor="language-select" className="text-sm text-gray-400 sr-only">{t('language')}:</label>
          <select 
            id="language-select"
            value={language} 
            onChange={(e) => setLanguage(e.target.value as Language)}
            className="bg-gray-700 border border-gray-600 rounded-md px-3 py-1 text-sm focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="en">{t('english')}</option>
            <option value="sw">{t('swahili')}</option>
          </select>
        </div>
      </div>
    </header>
  );
};

export default Header;
