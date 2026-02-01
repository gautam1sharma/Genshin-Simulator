/**
 * Web Worker for running simulations in background thread
 */

import { HighPerformanceSimulator } from './simulator.js';

self.onmessage = function (e) {
    const { numSimulations, radianceChances, sampleSize } = e.data;

    const simulator = new HighPerformanceSimulator({
        radianceChances,
        sampleSize: sampleSize || 500
    });

    const results = simulator.simulate(numSimulations, (progress) => {
        self.postMessage({ type: 'progress', progress });
    });

    self.postMessage({ type: 'complete', results });
};
