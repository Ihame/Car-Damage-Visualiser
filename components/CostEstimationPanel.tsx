/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React from 'react';
import type { RepairCost } from '../types';

interface CostEstimationPanelProps {
  costs: RepairCost[];
}

const CostEstimationPanel: React.FC<CostEstimationPanelProps> = ({ costs }) => {
  if (!costs || costs.length === 0) {
    return (
      <div className="w-full mt-8 bg-gray-800/50 border border-gray-700 rounded-lg p-6 text-center">
        <h3 className="text-2xl font-bold text-gray-200 mb-2">Estimated Repair Costs</h3>
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

  return (
    <div className="w-full mt-8 bg-gray-800/50 border border-gray-700 rounded-lg p-6 shadow-2xl">
      <h3 className="text-2xl font-bold text-gray-200 mb-4">Estimated Repair Costs</h3>
      <div className="overflow-x-auto">
        <table className="w-full min-w-max text-left text-gray-300">
          <thead className="border-b border-gray-600 text-sm text-gray-400 uppercase">
            <tr>
              <th className="py-3 px-4">Part</th>
              <th className="py-3 px-4">Detected Damage</th>
              <th className="py-3 px-4">Suggested Action</th>
              <th className="py-3 px-4 text-right">Est. Cost (USD)</th>
              <th className="py-3 px-4 text-right">Est. Cost (RWF)</th>
            </tr>
          </thead>
          <tbody>
            {costs.map((item, index) => (
              <tr key={index} className="border-b border-gray-700/50 hover:bg-gray-700/30">
                <td className="py-4 px-4 font-medium capitalize">{item.part}</td>
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
              <td colSpan={3} className="py-4 px-4 text-right">Total Estimated Cost</td>
              <td className="py-4 px-4 text-right font-mono">{formatUSD(totals.usd)}</td>
              <td className="py-4 px-4 text-right font-mono">{formatRWF(totals.rwf)}</td>
            </tr>
          </tfoot>
        </table>
      </div>
       <p className="text-xs text-gray-500 mt-4 text-center">
        Disclaimer: These are AI-generated estimates and suggestions, and should be used for informational purposes only. For an accurate quote, please consult a professional auto-body specialist.
      </p>
    </div>
  );
};

export default CostEstimationPanel;