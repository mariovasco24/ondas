import type { Clock } from '../../application/ports.js';

export const systemClock: Clock = { now: () => Date.now() };
