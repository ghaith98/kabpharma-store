export type Json = null | boolean | number | string | Json[] | { [key: string]: Json };
export type FinanceState = { [key: string]: Json };
export type Packet = { format: "kab-finance-local"; id: string; version: number; actor: string; state: FinanceState };
export type FinanceAction = { type: string; payload?: { [key: string]: Json } };
export type StoredRecord = { key: string; kind: string; position: number; payload: string; array: number };
export class FinanceError extends Error {
  constructor(message: string, public status = 400, public code = "INVALID") { super(message); }
}
