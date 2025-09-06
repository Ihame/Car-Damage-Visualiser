/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

export interface RepairCost {
  part: string;
  damage: string;
  suggestion: string; // e.g., 'Repair', 'Replace'
  costUSD: number;
  costRWF: number;
}