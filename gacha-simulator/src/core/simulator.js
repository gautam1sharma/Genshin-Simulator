/**
 * Genshin Impact Gacha Monte Carlo Simulator
 * CORRECTED Implementation with proper guarantee system
 * 
 * === CORRECT MECHANICS ===
 * 
 * 1. BASE GUARANTEE SYSTEM:
 *    - If NOT guaranteed: 50/50 for featured vs standard
 *    - If you get STANDARD: Next 5★ is 100% GUARANTEED featured
 *    - If you get FEATURED: Back to 50/50 (no guarantee)
 * 
 * 2. CAPTURING RADIANCE (post-5.0):
 *    - When you WOULD lose the 50/50, Radiance can trigger to save you
 *    - Tracks "consecutive would-be losses without Radiance saving you"
 *    - At counter 3: Radiance MUST trigger (100%)
 *    
 * Key insight: You can NEVER get 2 standard 5★ in a row!
 * After any standard, the next is guaranteed featured.
 */

/**
 * PityCurve - Handles 5★ appearance probability
 */
export class PityCurve {
  constructor() {
    this.baseRate = 0.006; // 0.6%
    this.softPityStart = 73;
    this.softPityIncrease = 0.06; // 6% per pull after 73
    this.hardPity = 90;
  }

  getProbability(pity) {
    if (pity >= this.hardPity) return 1.0;
    if (pity <= this.softPityStart) return this.baseRate;
    return Math.min(this.baseRate + (pity - this.softPityStart) * this.softPityIncrease, 1.0);
  }

  roll(pity) {
    return Math.random() < this.getProbability(pity);
  }
}

/**
 * CapturingRadianceSystem - Correct implementation
 * 
 * Two separate tracking mechanisms:
 * 1. `guaranteed` (boolean): Is the next 5★ guaranteed featured?
 * 2. `radianceCounter` (0-3): How many times has Radiance failed to save a 50/50 loss?
 * 
 * Radiance chances at each counter:
 * - Counter 0: radianceChance[0] (e.g., 0%)
 * - Counter 1: radianceChance[1] (e.g., 25%)
 * - Counter 2: radianceChance[2] (e.g., 50%)
 * - Counter 3: 100% (forced Radiance)
 */
export class CapturingRadianceSystem {
  constructor(options = {}) {
    // Radiance trigger chances at each counter level
    // These can be tuned to fit real-world data
    this.radianceChances = options.radianceChances || [0.0, 0.25, 0.50, 1.0];

    // State
    this.guaranteed = false;      // Is next 5★ guaranteed?
    this.radianceCounter = 0;     // 50/50 loss streak without Radiance saving

    // Statistics
    this.stats = {
      wonFiftyFifty: 0,         // Won 50/50 naturally
      lostFiftyFifty: 0,        // Lost 50/50 (got standard)
      radianceSaved: 0,          // Radiance triggered to save from loss
      guaranteeUsed: 0,          // Used guarantee after previous loss
      radianceByCounter: [0, 0, 0, 0], // Radiance triggers at each counter level
      visitsToGuarantee: 0       // How many times we entered guarantee state
    };
  }

  reset() {
    this.guaranteed = false;
    this.radianceCounter = 0;
    this.stats = {
      wonFiftyFifty: 0,
      lostFiftyFifty: 0,
      radianceSaved: 0,
      guaranteeUsed: 0,
      radianceByCounter: [0, 0, 0, 0],
      visitsToGuarantee: 0
    };
  }

  /**
   * Called when a 5★ drop occurs
   * Returns: { isFeatured, wasRadiance, wasGuarantee }
   */
  determine() {
    // Case 1: Guaranteed from previous loss
    if (this.guaranteed) {
      this.stats.guaranteeUsed++;
      this.guaranteed = false;
      // Radiance counter continues (tracks 50/50 streak, not guarantee)
      return { isFeatured: true, wasRadiance: false, wasGuarantee: true };
    }

    // Case 2: 50/50 roll
    const wonFiftyFifty = Math.random() < 0.5;

    if (wonFiftyFifty) {
      // Won 50/50 naturally!
      this.stats.wonFiftyFifty++;
      this.radianceCounter = 0; // Reset radiance counter on natural win
      return { isFeatured: true, wasRadiance: false, wasGuarantee: false };
    }

    // Case 3: Lost 50/50 - check if Radiance saves us
    const radianceChance = this.radianceChances[Math.min(this.radianceCounter, 3)];
    const radianceTriggered = Math.random() < radianceChance;

    if (radianceTriggered) {
      // Radiance saved us!
      this.stats.radianceSaved++;
      this.stats.radianceByCounter[this.radianceCounter]++;
      this.radianceCounter = 0; // Reset counter after Radiance triggers
      return { isFeatured: true, wasRadiance: true, wasGuarantee: false };
    }

    // Case 4: Actually lost (Radiance didn't save)
    this.stats.lostFiftyFifty++;
    this.radianceCounter = Math.min(this.radianceCounter + 1, 3);
    this.guaranteed = true; // Next 5★ is guaranteed!
    this.stats.visitsToGuarantee++;
    return { isFeatured: false, wasRadiance: false, wasGuarantee: false };
  }
}

/**
 * High-performance simulator with correct mechanics
 */
export class HighPerformanceSimulator {
  constructor(options = {}) {
    // Radiance chances: [counter 0, counter 1, counter 2, counter 3]
    // Counter 3 is always 100% by specification
    this.radianceChances = options.radianceChances || [0.0, 0.25, 0.50, 1.0];
    // Sample size for percentile calculations
    this.sampleSize = options.sampleSize || 500; // Group 500 5★s for avg pity distribution
  }

  simulate(numSimulations, progressCallback = null) {
    // Pre-computed pity probability table
    const probTable = new Float64Array(90);
    for (let i = 0; i < 90; i++) {
      const pity = i + 1;
      if (pity >= 90) probTable[i] = 1.0;
      else if (pity <= 73) probTable[i] = 0.006;
      else probTable[i] = Math.min(0.006 + (pity - 73) * 0.06, 1.0);
    }

    // Statistics
    let totalPulls = 0;
    let total5Star = 0;
    let featured5Star = 0;
    let standard5Star = 0;

    // Detailed stats
    let wonFiftyFifty = 0;
    let lostFiftyFifty = 0;
    let radianceSaved = 0;
    let guaranteeUsed = 0;
    const radianceByCounter = [0, 0, 0, 0];

    const pityDistribution = new Uint32Array(90);

    // State visits: [not-guaranteed, guaranteed]
    const guaranteeStateVisits = [0, 0];

    let sumPullsFor5Star = 0;
    let sumPullsForFeatured = 0;

    // === SAMPLE GROUP TRACKING ===
    // Track groups of sampleSize 5★s for average pity distribution
    const sampleSize = this.sampleSize;
    const sampleAverages = []; // Will hold average pity for each sample group
    let currentSamplePitySum = 0;
    let currentSampleCount = 0;

    // FSM State
    let guaranteed = false;
    let radianceCounter = 0;

    const batchSize = 100000;
    let lastProgress = 0;
    const radianceChances = this.radianceChances;

    for (let sim = 0; sim < numSimulations; sim++) {
      let currentPity = 0;
      let pullsSinceLastFeatured = 0;
      let gotFeatured = false;

      while (!gotFeatured) {
        totalPulls++;
        currentPity++;
        pullsSinceLastFeatured++;

        // Roll for 5★
        if (Math.random() < probTable[currentPity - 1]) {
          total5Star++;
          pityDistribution[currentPity - 1]++;
          sumPullsFor5Star += currentPity;

          // Track for sample groups
          currentSamplePitySum += currentPity;
          currentSampleCount++;

          // When we have enough for a sample group, record the average
          if (currentSampleCount >= sampleSize) {
            sampleAverages.push(currentSamplePitySum / currentSampleCount);
            currentSamplePitySum = 0;
            currentSampleCount = 0;
          }

          let isFeatured = false;

          if (guaranteed) {
            // Guaranteed featured!
            guaranteeStateVisits[1]++;
            guaranteeUsed++;
            guaranteed = false;
            isFeatured = true;
          } else {
            // 50/50 roll
            guaranteeStateVisits[0]++;
            const won5050 = Math.random() < 0.5;

            if (won5050) {
              // Natural win
              wonFiftyFifty++;
              radianceCounter = 0;
              isFeatured = true;
            } else {
              // Would lose 50/50 - check Radiance
              const chance = radianceChances[Math.min(radianceCounter, 3)];
              const saved = Math.random() < chance;

              if (saved) {
                // Radiance saved!
                radianceSaved++;
                radianceByCounter[radianceCounter]++;
                radianceCounter = 0;
                isFeatured = true;
              } else {
                // Actually lost
                lostFiftyFifty++;
                radianceCounter = Math.min(radianceCounter + 1, 3);
                guaranteed = true; // Next is guaranteed!
                isFeatured = false;
              }
            }
          }

          if (isFeatured) {
            featured5Star++;
            sumPullsForFeatured += pullsSinceLastFeatured;
            gotFeatured = true;
            pullsSinceLastFeatured = 0;
          } else {
            standard5Star++;
          }

          currentPity = 0; // Reset pity on any 5★
        }
      }

      // Progress
      if (progressCallback && sim % batchSize === 0) {
        const progress = Math.round((sim / numSimulations) * 100);
        if (progress > lastProgress) {
          progressCallback(progress);
          lastProgress = progress;
        }
      }
    }

    // === CALCULATE SAMPLE AVERAGE DISTRIBUTION ===
    // Sort for percentile calculations
    sampleAverages.sort((a, b) => a - b);

    // Calculate percentile lookup table for average pity
    // This shows: "If your average pity is X, you're in the top Y%"
    const avgPityPercentileLookup = [];

    // For pity values 30-90 (reasonable range for averages)
    for (let avgPity = 30; avgPity <= 90; avgPity++) {
      // Find what percentile this average pity falls into
      // Lower average = luckier = higher percentile
      let countBelow = 0;
      for (let i = 0; i < sampleAverages.length; i++) {
        if (sampleAverages[i] <= avgPity) countBelow++;
        else break; // Sorted, so we can break early
      }
      const percentile = sampleAverages.length > 0 ? (countBelow / sampleAverages.length) * 100 : 50;
      avgPityPercentileLookup.push({ avgPity, percentile });
    }

    // Calculate sample statistics
    const sampleCount = sampleAverages.length;
    let sampleMean = 0, sampleVariance = 0;
    if (sampleCount > 0) {
      sampleMean = sampleAverages.reduce((a, b) => a + b, 0) / sampleCount;
      sampleVariance = sampleAverages.reduce((sum, v) => sum + Math.pow(v - sampleMean, 2), 0) / sampleCount;
    }
    const sampleStdDev = Math.sqrt(sampleVariance);

    // Get key percentiles from sample distribution
    const getPercentileValue = (p) => {
      if (sampleCount === 0) return 62.5;
      const index = Math.floor((p / 100) * sampleCount);
      return sampleAverages[Math.min(index, sampleCount - 1)];
    };

    return {
      totalPulls,
      total5Star,
      featured5Star,
      standard5Star,

      // Rates
      rate5Star: total5Star / totalPulls,
      rateFeatured: featured5Star / total5Star,
      avg5StarPity: sumPullsFor5Star / total5Star,
      avgPullsPerFeatured: sumPullsForFeatured / featured5Star,

      // 50/50 & Guarantee stats
      wonFiftyFifty,
      lostFiftyFifty,
      guaranteeUsed,
      fiftyFiftyWinRate: wonFiftyFifty / (wonFiftyFifty + lostFiftyFifty),

      // Radiance stats
      radianceSaved,
      radianceByCounter: Array.from(radianceByCounter),
      radianceRate: radianceSaved / (radianceSaved + lostFiftyFifty),

      // Distributions
      pityDistribution: Array.from(pityDistribution),
      guaranteeStateVisits: Array.from(guaranteeStateVisits),

      // === NEW: Sample-based average pity statistics ===
      sampleStats: {
        sampleSize: sampleSize,
        sampleCount: sampleCount,
        sampleMean: sampleMean,
        sampleStdDev: sampleStdDev,
        // Key percentiles (what avg pity value is at each percentile)
        percentiles: {
          p1: getPercentileValue(1),
          p5: getPercentileValue(5),
          p10: getPercentileValue(10),
          p25: getPercentileValue(25),
          p50: getPercentileValue(50), // Median
          p75: getPercentileValue(75),
          p90: getPercentileValue(90),
          p95: getPercentileValue(95),
          p99: getPercentileValue(99)
        },
        // Lookup table: for a given avg pity, what % of players have equal or lower avg?
        avgPityPercentileLookup: avgPityPercentileLookup
      }
    };
  }
}
