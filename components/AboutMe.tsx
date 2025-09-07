/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React from 'react';
import { LinkedInIcon } from './icons';

type TranslationKey = 'aboutTitle';

interface AboutMeProps {
  t: (key: TranslationKey) => string;
}

const AboutMe: React.FC<AboutMeProps> = ({ t }) => {
  return (
    <div className="w-full max-w-4xl mx-auto mt-12 sm:mt-16 animate-fade-in border-t border-gray-700/50 pt-8 sm:pt-10">
      <h2 className="text-xl sm:text-2xl font-bold text-center text-gray-300 mb-6">{t('aboutTitle')}</h2>
      <div className="flex flex-col md:flex-row items-center gap-6 sm:gap-8 bg-gray-800/40 rounded-lg p-6 sm:p-8">
        <div className="flex-shrink-0">
          {/* Placeholder for a profile picture */}
          <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-full bg-gray-700 flex items-center justify-center">
            <span className="text-4xl sm:text-5xl font-bold text-gray-500">IL</span>
          </div>
        </div>
        <div className="text-center md:text-left">
          <h3 className="text-lg sm:text-xl font-bold text-white">IHAME Lievin</h3>
          <p className="text-sm text-blue-400 mb-3">Founder @ Smart Garage | Embedded Systems & Software Engineer</p>
          <p className="text-gray-400 text-sm sm:text-base mb-4">
            My lifelong passion for automobiles is matched only by my expertise in software engineering. I created this tool to merge these two worlds. 
            My mission is to revolutionize vehicle care in Africa, making advanced diagnostics and cutting-edge technology accessible to every car owner. 
            I believe in a future where technology empowers us to build a smarter, greener, and more efficient automotive landscape.
          </p>
          <a
            href="https://www.linkedin.com/in/ihamelievin/"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-sm font-semibold text-gray-300 hover:text-blue-400 transition-colors"
          >
            <LinkedInIcon className="w-5 h-5" />
            Connect on LinkedIn
          </a>
        </div>
      </div>
    </div>
  );
};

export default AboutMe;
