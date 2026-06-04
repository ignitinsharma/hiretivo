import { INDIA_STATES } from "./data/states";

export type IndiaState = (typeof INDIA_STATES)[number];

export interface IndiaLocation {
  city: string;
  state: IndiaState;
}
