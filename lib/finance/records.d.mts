import type { FinanceState, StoredRecord } from './types';
export function encodeState(state: FinanceState): Map<string, StoredRecord>;
export function decodeState(rows: StoredRecord[]): FinanceState;
export function stateDelta(previous: Map<string, StoredRecord>, next: Map<string, StoredRecord>): {
 upsert: StoredRecord[]; remove: string[]; inverse: { upsert: StoredRecord[]; remove: string[] };
};
