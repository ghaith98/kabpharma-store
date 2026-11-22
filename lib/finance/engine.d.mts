import type { FinanceState, FinanceAction, Packet } from './types';
export function applyAction(state: FinanceState, action: FinanceAction, actor: string): FinanceState;
export function validateState(state: FinanceState): void;
export function emptyState(actor: string): FinanceState;
export function parsePacket(raw: string): Packet;
export function projectState(state: FinanceState): { bills: Map<string, { total: number; remaining: number; paid: number; status: string }> };
