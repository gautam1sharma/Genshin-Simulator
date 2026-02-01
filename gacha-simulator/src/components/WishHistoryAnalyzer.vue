<template>
  <div class="card analyzer-card">
    <div class="card-header">
      <h2 class="card-title">
        <span class="card-icon">📝</span>
        Wish History Analyzer
      </h2>
      <button class="btn btn-sm btn-secondary" @click="showHelp = !showHelp">
        {{ showHelp ? 'Hide Help' : '?' }}
      </button>
    </div>

    <!-- Help Section -->
    <div v-if="showHelp" class="help-box">
      <p><strong>How to use:</strong></p>
      <p>Enter each 5★ you've pulled with the pity count and whether it was a 50/50 situation.</p>
      <ul>
        <li><strong>Pity:</strong> Number of pulls since last 5★ (1-90)</li>
        <li><strong>Won 50/50:</strong> Check if you got the featured character on 50/50</li>
        <li><strong>Was Guaranteed:</strong> Check if it was a guaranteed pull (after losing 50/50)</li>
      </ul>
    </div>

    <!-- Input Form -->
    <div class="input-section">
      <div class="input-row">
        <div class="input-group">
          <label>Pity</label>
          <input 
            type="number" 
            class="form-input mini" 
            v-model.number="newPity"
            min="1" max="90"
            placeholder="1-90"
          />
        </div>
        <div class="input-group checkbox-group">
          <label>
            <input type="checkbox" v-model="wasGuaranteed" @change="onGuaranteedChange" />
            Guaranteed
          </label>
        </div>
        <div class="input-group checkbox-group" v-if="!wasGuaranteed">
          <label>
            <input type="checkbox" v-model="wonFiftyFifty" />
            Won 50/50
          </label>
        </div>
        <button class="btn btn-primary btn-sm" @click="addWish" :disabled="!newPity || newPity < 1 || newPity > 90">
          Add
        </button>
      </div>
    </div>

    <!-- Wish List -->
    <div v-if="wishes.length > 0" class="wishes-list">
      <div class="wishes-header">
        <span>Your 5★ Pulls ({{ wishes.length }})</span>
        <button class="btn btn-sm btn-secondary" @click="clearAll">Clear All</button>
      </div>
      <div class="wishes-grid">
        <div 
          v-for="(wish, i) in wishes" 
          :key="i" 
          class="wish-chip"
          :class="{ 
            'featured': wish.isFeatured, 
            'standard': !wish.isFeatured,
            'guaranteed': wish.wasGuaranteed
          }"
        >
          <span class="wish-pity">{{ wish.pity }}</span>
          <span class="wish-type">
            {{ wish.wasGuaranteed ? '🔒' : (wish.wonFiftyFifty ? '✓' : '✗') }}
          </span>
          <button class="wish-remove" @click="removeWish(i)">×</button>
        </div>
      </div>
    </div>

    <!-- Analysis Results -->
    <div v-if="wishes.length > 0 && analysis" class="analysis-section">
      <h3 class="section-title">📊 Luck Analysis</h3>
      
      <!-- Overall Summary -->
      <div class="luck-summary">
        <div class="luck-meter" :class="overallLuckClass">
          <div class="luck-label">Overall Luck</div>
          <div class="luck-value">{{ overallLuckText }}</div>
          <div class="luck-bar">
            <div class="luck-fill" :style="{ width: analysis.overallPercentile + '%' }"></div>
            <div class="luck-marker" :style="{ left: analysis.overallPercentile + '%' }"></div>
          </div>
          <div class="luck-scale">
            <span>Unlucky</span>
            <span>Average</span>
            <span>Lucky</span>
          </div>
        </div>
      </div>

      <!-- Pity Analysis -->
      <div class="analysis-card">
        <div class="analysis-header">
          <span class="analysis-icon">⭐</span>
          <span>5★ Pity Luck</span>
        </div>
        <div class="analysis-stats">
          <div class="stat-item">
            <span class="stat-label">Your Avg Pity</span>
            <span class="stat-value">{{ analysis.avgPity.toFixed(1) }}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">Expected Avg</span>
            <span class="stat-value muted">{{ analysis.expectedAvgPity.toFixed(1) }}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">Percentile</span>
            <span class="stat-value" :class="getPityLuckClass">
              Top {{ (100 - analysis.pityPercentile).toFixed(1) }}%
            </span>
          </div>
        </div>
        <div class="analysis-bar">
          <div class="bar-track">
            <div class="bar-fill pity" :style="{ width: (100 - analysis.pityPercentile) + '%' }"></div>
          </div>
          <p class="analysis-desc">{{ getPityDescription }}</p>
        </div>
      </div>

      <!-- 50/50 Analysis -->
      <div class="analysis-card" v-if="analysis.fiftyFiftyCount > 0">
        <div class="analysis-header">
          <span class="analysis-icon">🎲</span>
          <span>50/50 Luck</span>
        </div>
        <div class="analysis-stats">
          <div class="stat-item">
            <span class="stat-label">Your Win Rate</span>
            <span class="stat-value">{{ (analysis.fiftyFiftyWinRate * 100).toFixed(0) }}%</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">Expected</span>
            <span class="stat-value muted">50%</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">Record</span>
            <span class="stat-value">{{ analysis.fiftyFiftyWins }}/{{ analysis.fiftyFiftyCount }}</span>
          </div>
        </div>
        <div class="analysis-bar">
          <div class="bar-track">
            <div class="bar-fill fifty" :style="{ width: analysis.fiftyFiftyPercentile + '%' }"></div>
          </div>
          <p class="analysis-desc">{{ getFiftyFiftyDescription }}</p>
        </div>
      </div>

      <!-- Individual Wish Percentiles -->
      <details class="wish-details">
        <summary>View Individual Pull Percentiles</summary>
        <div class="individual-list">
          <div v-for="(wish, i) in wishes" :key="i" class="individual-item">
            <span class="ind-num">#{{ i + 1 }}</span>
            <span class="ind-pity">Pity {{ wish.pity }}</span>
            <span class="ind-percentile" :class="getIndividualClass(wish.percentile)">
              Top {{ (100 - wish.percentile).toFixed(1) }}%
            </span>
            <span class="ind-type">{{ wish.wasGuaranteed ? '🔒' : (wish.wonFiftyFifty ? '✓ Won' : '✗ Lost') }}</span>
          </div>
        </div>
      </details>
    </div>

    <!-- No simulation warning -->
    <div v-if="wishes.length > 0 && !hasSimulationData" class="warning-box">
      ⚠️ Run a simulation first to get accurate percentile calculations!
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'

const props = defineProps({
  simulationData: { type: Object, default: null }
})

const showHelp = ref(false)
const wishes = ref([])
const newPity = ref(null)
const wonFiftyFifty = ref(true)
const wasGuaranteed = ref(false)

const hasSimulationData = computed(() => {
  return props.simulationData && props.simulationData.pityDistribution
})

const onGuaranteedChange = () => {
  if (wasGuaranteed.value) {
    wonFiftyFifty.value = false
  }
}

const addWish = () => {
  if (!newPity.value || newPity.value < 1 || newPity.value > 90) return
  
  wishes.value.push({
    pity: newPity.value,
    wonFiftyFifty: wasGuaranteed.value ? false : wonFiftyFifty.value,
    wasGuaranteed: wasGuaranteed.value,
    isFeatured: wasGuaranteed.value || wonFiftyFifty.value,
    percentile: 0
  })
  
  newPity.value = null
  wonFiftyFifty.value = true
  wasGuaranteed.value = false
}

const removeWish = (index) => {
  wishes.value.splice(index, 1)
}

const clearAll = () => {
  wishes.value = []
}

// Calculate percentile for a given pity value
const calculatePityPercentile = (pity) => {
  if (!hasSimulationData.value) {
    // Use theoretical distribution if no simulation
    // Based on soft pity starting at 74
    if (pity <= 73) {
      // Early pulls are rare - use cumulative probability
      const prob = 1 - Math.pow(0.994, pity)
      return prob * 100
    } else {
      // Soft pity - most people hit here
      const baseCumulative = 1 - Math.pow(0.994, 73)
      const softPityPulls = pity - 73
      const additionalProb = softPityPulls * 0.06
      return Math.min((baseCumulative + additionalProb) * 100, 99.9)
    }
  }
  
  const dist = props.simulationData.pityDistribution
  const total = dist.reduce((a, b) => a + b, 0)
  let cumulative = 0
  
  for (let i = 0; i < pity; i++) {
    cumulative += dist[i]
  }
  
  return (cumulative / total) * 100
}

// Calculate 50/50 win percentile using binomial distribution
const calculate5050Percentile = (wins, total) => {
  if (total === 0) return 50
  
  // Calculate probability of getting this many or fewer wins
  // Using normal approximation for binomial
  const p = 0.5
  const mean = total * p
  const std = Math.sqrt(total * p * (1 - p))
  
  if (std === 0) return wins >= mean ? 100 : 0
  
  // Z-score
  const z = (wins - mean) / std
  
  // Convert to percentile using error function approximation
  const percentile = 0.5 * (1 + erf(z / Math.sqrt(2)))
  return percentile * 100
}

// Error function approximation
const erf = (x) => {
  const a1 =  0.254829592
  const a2 = -0.284496736
  const a3 =  1.421413741
  const a4 = -1.453152027
  const a5 =  1.061405429
  const p  =  0.3275911
  
  const sign = x < 0 ? -1 : 1
  x = Math.abs(x)
  
  const t = 1.0 / (1.0 + p * x)
  const y = 1.0 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-x * x)
  
  return sign * y
}

const analysis = computed(() => {
  if (wishes.value.length === 0) return null
  
  // Update individual percentiles
  wishes.value.forEach(wish => {
    wish.percentile = calculatePityPercentile(wish.pity)
  })
  
  // Pity stats
  const totalPity = wishes.value.reduce((sum, w) => sum + w.pity, 0)
  const avgPity = totalPity / wishes.value.length
  const expectedAvgPity = hasSimulationData.value 
    ? props.simulationData.avg5StarPity 
    : 62.5 // Theoretical average
  
  // Average percentile for pity (lower pity = better = higher percentile)
  const avgPityPercentile = wishes.value.reduce((sum, w) => sum + w.percentile, 0) / wishes.value.length
  
  // 50/50 stats
  const fiftyFiftyWishes = wishes.value.filter(w => !w.wasGuaranteed)
  const fiftyFiftyCount = fiftyFiftyWishes.length
  const fiftyFiftyWins = fiftyFiftyWishes.filter(w => w.wonFiftyFifty).length
  const fiftyFiftyWinRate = fiftyFiftyCount > 0 ? fiftyFiftyWins / fiftyFiftyCount : 0
  const fiftyFiftyPercentile = calculate5050Percentile(fiftyFiftyWins, fiftyFiftyCount)
  
  // Combined overall percentile (weighted average)
  // Pity luck is weighted more heavily as it affects pull count
  const pityWeight = 0.6
  const fiftyWeight = 0.4
  const overallPercentile = fiftyFiftyCount > 0
    ? (100 - avgPityPercentile) * pityWeight + fiftyFiftyPercentile * fiftyWeight
    : (100 - avgPityPercentile)
  
  return {
    avgPity,
    expectedAvgPity,
    pityPercentile: avgPityPercentile,
    fiftyFiftyCount,
    fiftyFiftyWins,
    fiftyFiftyWinRate,
    fiftyFiftyPercentile,
    overallPercentile
  }
})

const overallLuckClass = computed(() => {
  if (!analysis.value) return ''
  const p = analysis.value.overallPercentile
  if (p >= 80) return 'very-lucky'
  if (p >= 60) return 'lucky'
  if (p >= 40) return 'average'
  if (p >= 20) return 'unlucky'
  return 'very-unlucky'
})

const overallLuckText = computed(() => {
  if (!analysis.value) return ''
  const p = analysis.value.overallPercentile
  if (p >= 90) return '🌟 Extremely Lucky!'
  if (p >= 75) return '✨ Very Lucky'
  if (p >= 60) return '😊 Above Average'
  if (p >= 40) return '😐 Average'
  if (p >= 25) return '😕 Below Average'
  if (p >= 10) return '😢 Unlucky'
  return '💀 Very Unlucky'
})

const getPityLuckClass = computed(() => {
  if (!analysis.value) return ''
  const p = 100 - analysis.value.pityPercentile
  if (p >= 70) return 'lucky'
  if (p >= 30) return 'average'
  return 'unlucky'
})

const getPityDescription = computed(() => {
  if (!analysis.value) return ''
  const diff = analysis.value.expectedAvgPity - analysis.value.avgPity
  if (diff > 10) return `You're hitting 5★ about ${diff.toFixed(0)} pulls earlier than average! Very lucky pity.`
  if (diff > 3) return `You're getting 5★ a bit earlier than most players.`
  if (diff > -3) return `Your pity luck is right around average.`
  if (diff > -10) return `You're hitting pity a bit later than average.`
  return `You're often going deep into pity. Tough luck on the 5★ timing.`
})

const getFiftyFiftyDescription = computed(() => {
  if (!analysis.value || analysis.value.fiftyFiftyCount === 0) return ''
  const rate = analysis.value.fiftyFiftyWinRate
  const wins = analysis.value.fiftyFiftyWins
  const total = analysis.value.fiftyFiftyCount
  
  if (rate >= 0.8) return `Winning ${wins}/${total} 50/50s is incredible luck!`
  if (rate >= 0.6) return `Above average 50/50 performance. Nice!`
  if (rate >= 0.4) return `Your 50/50 luck is around expected.`
  if (rate >= 0.2) return `Below average 50/50 wins. The gacha gods aren't kind.`
  return `Only ${wins}/${total} 50/50 wins... That's really rough.`
})

const getIndividualClass = (percentile) => {
  const p = 100 - percentile
  if (p >= 70) return 'lucky'
  if (p >= 30) return 'average'
  return 'unlucky'
}
</script>

<style scoped>
.analyzer-card {
  background: linear-gradient(180deg, var(--glass-bg) 0%, rgba(21, 32, 54, 0.85) 100%);
}

.help-box {
  background: rgba(78, 166, 229, 0.1);
  border: 1px solid rgba(78, 166, 229, 0.2);
  border-radius: var(--radius-md);
  padding: 1rem;
  margin-bottom: 1rem;
  font-size: 0.8rem;
  color: var(--text-secondary);
}

.help-box ul {
  margin: 0.5rem 0 0 1.2rem;
}

.help-box li { margin: 0.25rem 0; }

.input-section {
  margin-bottom: 1rem;
}

.input-row {
  display: flex;
  gap: 0.75rem;
  align-items: flex-end;
  flex-wrap: wrap;
}

.input-group {
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
}

.input-group label {
  font-size: 0.7rem;
  color: var(--text-muted);
  text-transform: uppercase;
}

.form-input.mini {
  width: 80px;
  padding: 0.5rem 0.75rem;
}

.checkbox-group {
  flex-direction: row;
  align-items: center;
}

.checkbox-group label {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  cursor: pointer;
  font-size: 0.75rem;
  color: var(--text-secondary);
  text-transform: none;
}

.checkbox-group input[type="checkbox"] {
  width: 16px;
  height: 16px;
  accent-color: var(--ui-gold);
}

.wishes-list {
  margin: 1rem 0;
}

.wishes-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
  font-size: 0.8rem;
  color: var(--text-secondary);
}

.wishes-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
}

.wish-chip {
  display: flex;
  align-items: center;
  gap: 0.3rem;
  padding: 0.35rem 0.5rem;
  border-radius: var(--radius-sm);
  font-size: 0.75rem;
  background: rgba(15, 23, 41, 0.5);
  border: 1px solid rgba(232, 213, 163, 0.1);
}

.wish-chip.featured { border-color: rgba(255, 215, 0, 0.3); }
.wish-chip.standard { border-color: rgba(201, 160, 220, 0.3); }
.wish-chip.guaranteed { background: rgba(242, 182, 63, 0.1); }

.wish-pity {
  font-family: var(--font-display);
  font-weight: 600;
  color: var(--ui-gold);
}

.wish-type {
  font-size: 0.7rem;
}

.wish-chip.featured .wish-type { color: var(--featured); }
.wish-chip.standard .wish-type { color: var(--standard); }

.wish-remove {
  background: none;
  border: none;
  color: var(--text-muted);
  cursor: pointer;
  padding: 0 0.2rem;
  font-size: 0.9rem;
  line-height: 1;
}

.wish-remove:hover { color: var(--pyro); }

.analysis-section {
  margin-top: 1.5rem;
  padding-top: 1rem;
  border-top: 1px solid var(--border-light);
}

.section-title {
  font-size: 0.9rem;
  color: var(--ui-gold);
  margin-bottom: 1rem;
}

.luck-summary {
  margin-bottom: 1.25rem;
}

.luck-meter {
  background: rgba(15, 23, 41, 0.4);
  border-radius: var(--radius-md);
  padding: 1rem;
  text-align: center;
}

.luck-label {
  font-size: 0.7rem;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.luck-value {
  font-family: var(--font-display);
  font-size: 1.25rem;
  font-weight: 600;
  margin: 0.4rem 0;
}

.luck-meter.very-lucky .luck-value { color: var(--radiance); text-shadow: 0 0 15px var(--radiance); }
.luck-meter.lucky .luck-value { color: var(--featured); }
.luck-meter.average .luck-value { color: var(--text-primary); }
.luck-meter.unlucky .luck-value { color: var(--standard); }
.luck-meter.very-unlucky .luck-value { color: var(--pyro); }

.luck-bar {
  position: relative;
  height: 8px;
  background: linear-gradient(90deg, var(--pyro), var(--geo), var(--radiance));
  border-radius: 4px;
  margin: 0.75rem 0 0.4rem;
}

.luck-fill {
  position: absolute;
  left: 0;
  top: 0;
  height: 100%;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 4px;
}

.luck-marker {
  position: absolute;
  top: -4px;
  width: 4px;
  height: 16px;
  background: white;
  border-radius: 2px;
  transform: translateX(-50%);
  box-shadow: 0 0 8px rgba(255, 255, 255, 0.5);
}

.luck-scale {
  display: flex;
  justify-content: space-between;
  font-size: 0.6rem;
  color: var(--text-muted);
}

.analysis-card {
  background: rgba(15, 23, 41, 0.3);
  border-radius: var(--radius-md);
  padding: 1rem;
  margin-bottom: 0.75rem;
  border: 1px solid rgba(232, 213, 163, 0.06);
}

.analysis-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 0.75rem;
}

.analysis-icon { font-size: 1rem; }

.analysis-stats {
  display: flex;
  gap: 1rem;
  margin-bottom: 0.75rem;
}

.stat-item {
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
}

.stat-label {
  font-size: 0.6rem;
  color: var(--text-muted);
  text-transform: uppercase;
}

.stat-value {
  font-family: var(--font-display);
  font-size: 1rem;
  font-weight: 600;
  color: var(--ui-gold);
}

.stat-value.muted { color: var(--text-secondary); }
.stat-value.lucky { color: var(--radiance); }
.stat-value.average { color: var(--text-primary); }
.stat-value.unlucky { color: var(--pyro); }

.analysis-bar { margin-top: 0.5rem; }

.bar-track {
  height: 6px;
  background: rgba(15, 23, 41, 0.5);
  border-radius: 3px;
  overflow: hidden;
}

.bar-fill {
  height: 100%;
  border-radius: 3px;
  transition: width 0.5s ease;
}

.bar-fill.pity { background: linear-gradient(90deg, var(--hydro), var(--radiance)); }
.bar-fill.fifty { background: linear-gradient(90deg, var(--geo), var(--featured)); }

.analysis-desc {
  font-size: 0.72rem;
  color: var(--text-secondary);
  margin-top: 0.5rem;
  font-style: italic;
}

.wish-details {
  margin-top: 1rem;
  background: rgba(15, 23, 41, 0.3);
  border-radius: var(--radius-md);
  border: 1px solid rgba(232, 213, 163, 0.06);
}

.wish-details summary {
  padding: 0.75rem 1rem;
  cursor: pointer;
  font-size: 0.8rem;
  color: var(--text-secondary);
}

.wish-details summary:hover { color: var(--ui-gold); }

.individual-list {
  padding: 0 1rem 1rem;
}

.individual-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.4rem 0;
  border-bottom: 1px solid rgba(232, 213, 163, 0.04);
  font-size: 0.75rem;
}

.ind-num { color: var(--text-muted); width: 30px; }
.ind-pity { color: var(--text-primary); width: 60px; }
.ind-percentile { font-weight: 600; width: 80px; }
.ind-percentile.lucky { color: var(--radiance); }
.ind-percentile.average { color: var(--text-primary); }
.ind-percentile.unlucky { color: var(--pyro); }
.ind-type { color: var(--text-muted); }

.warning-box {
  background: rgba(242, 182, 63, 0.1);
  border: 1px solid rgba(242, 182, 63, 0.2);
  border-radius: var(--radius-md);
  padding: 0.75rem;
  margin-top: 1rem;
  font-size: 0.8rem;
  color: var(--geo);
  text-align: center;
}
</style>
