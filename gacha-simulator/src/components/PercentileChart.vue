<template>
  <div class="percentile-chart">
    <!-- Explanation -->
    <div class="explanation-box">
      <p><strong>📊 How to read this chart:</strong></p>
      <p>Based on {{ sampleStats?.sampleCount || 0 }} sample groups of {{ sampleStats?.sampleSize || 500 }} 5★ each.</p>
      <p>Find your average pity → See what percentile of players you're luckier than.</p>
    </div>

    <!-- Sample Statistics -->
    <div v-if="sampleStats" class="sample-stats">
      <div class="stat-row">
        <div class="stat-box">
          <span class="stat-label">Expected Average</span>
          <span class="stat-value">{{ sampleStats.sampleMean.toFixed(2) }}</span>
        </div>
        <div class="stat-box">
          <span class="stat-label">Std Deviation</span>
          <span class="stat-value">{{ sampleStats.sampleStdDev.toFixed(2) }}</span>
        </div>
        <div class="stat-box">
          <span class="stat-label">Sample Groups</span>
          <span class="stat-value">{{ formatNumber(sampleStats.sampleCount) }}</span>
        </div>
      </div>
    </div>
    
    <!-- Key Percentiles -->
    <div v-if="sampleStats" class="percentile-stats">
      <h4>Average Pity at Key Percentiles</h4>
      <div class="percentile-grid">
        <div class="percentile-item godly">
          <span class="percentile-label">Top 1%</span>
          <span class="percentile-value">≤ {{ sampleStats.percentiles.p1.toFixed(1) }}</span>
          <span class="percentile-tag">🌟 Godly</span>
        </div>
        <div class="percentile-item lucky">
          <span class="percentile-label">Top 5%</span>
          <span class="percentile-value">≤ {{ sampleStats.percentiles.p5.toFixed(1) }}</span>
          <span class="percentile-tag">✨ Very Lucky</span>
        </div>
        <div class="percentile-item good">
          <span class="percentile-label">Top 25%</span>
          <span class="percentile-value">≤ {{ sampleStats.percentiles.p25.toFixed(1) }}</span>
          <span class="percentile-tag">😊 Lucky</span>
        </div>
        <div class="percentile-item median">
          <span class="percentile-label">Median (50%)</span>
          <span class="percentile-value">{{ sampleStats.percentiles.p50.toFixed(1) }}</span>
          <span class="percentile-tag">📊 Average</span>
        </div>
        <div class="percentile-item below">
          <span class="percentile-label">Bottom 25%</span>
          <span class="percentile-value">≥ {{ sampleStats.percentiles.p75.toFixed(1) }}</span>
          <span class="percentile-tag">😐 Unlucky</span>
        </div>
        <div class="percentile-item bad">
          <span class="percentile-label">Bottom 5%</span>
          <span class="percentile-value">≥ {{ sampleStats.percentiles.p95.toFixed(1) }}</span>
          <span class="percentile-tag">💀 Very Unlucky</span>
        </div>
      </div>
    </div>
    
    <!-- Average Pity Lookup Table -->
    <details class="lookup-section" open>
      <summary>📋 Average Pity → Percentile Lookup</summary>
      <div class="lookup-content">
        <p class="lookup-description">
          Enter your average pity to see your percentile. Lower avg pity = luckier!
        </p>
        
        <!-- Quick Lookup Input -->
        <div class="quick-lookup">
          <label>Your Avg Pity:</label>
          <input 
            type="number" 
            class="form-input mini" 
            v-model.number="userAvgPity"
            min="30" max="90" step="0.1"
            placeholder="e.g., 55"
          />
          <div v-if="userPercentile !== null" class="user-result" :class="userLuckClass">
            <span class="result-percentile">Top {{ userPercentile.toFixed(1) }}%</span>
            <span class="result-label">{{ userLuckLabel }}</span>
          </div>
        </div>

        <div class="lookup-table-wrapper">
          <table class="lookup-table">
            <thead>
              <tr>
                <th>Avg Pity</th>
                <th>Top %</th>
                <th>Luck Rating</th>
              </tr>
            </thead>
            <tbody>
              <tr 
                v-for="row in lookupTable" 
                :key="row.avgPity"
                :class="row.luckClass"
              >
                <td class="pity-cell">{{ row.avgPity }}</td>
                <td class="percent-cell">{{ row.percentile.toFixed(1) }}%</td>
                <td class="luck-cell">{{ row.luckEmoji }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </details>

    <!-- Individual Pity Distribution (collapsed by default) -->
    <details class="lookup-section">
      <summary>📈 Individual Pull Distribution</summary>
      <div class="lookup-content">
        <p class="lookup-description">
          This shows the distribution of individual 5★ pity values (not averages).
        </p>
        <div class="chart-container">
          <canvas ref="chartCanvas"></canvas>
        </div>
        
        <div class="individual-percentiles">
          <h5>Individual Pull Percentiles</h5>
          <div class="ind-grid">
            <div v-for="row in individualPercentiles" :key="row.pity" class="ind-item">
              <span class="ind-pity">Pity {{ row.pity }}</span>
              <span class="ind-percent" :class="row.luckClass">Top {{ row.percentile.toFixed(0) }}%</span>
            </div>
          </div>
        </div>
      </div>
    </details>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch, onUnmounted } from 'vue'
import {
  Chart,
  BarController,
  BarElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend
} from 'chart.js'

Chart.register(BarController, BarElement, CategoryScale, LinearScale, Tooltip, Legend)

const props = defineProps({
  distribution: { type: Array, required: true },
  sampleStats: { type: Object, default: null }
})

const chartCanvas = ref(null)
const userAvgPity = ref(null)
let chartInstance = null

const formatNumber = (num) => {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M'
  if (num >= 1000) return (num / 1000).toFixed(0) + 'K'
  return num?.toLocaleString() || '0'
}

// User percentile lookup
const userPercentile = computed(() => {
  if (!userAvgPity.value || !props.sampleStats?.avgPityPercentileLookup) return null
  
  const lookup = props.sampleStats.avgPityPercentileLookup
  const avg = userAvgPity.value
  
  // Find closest entry
  const entry = lookup.find(r => r.avgPity >= avg)
  if (!entry) return 100
  
  // Interpolate for more accuracy
  const idx = lookup.indexOf(entry)
  if (idx === 0 || avg >= entry.avgPity) return entry.percentile
  
  const prevEntry = lookup[idx - 1]
  const ratio = (avg - prevEntry.avgPity) / (entry.avgPity - prevEntry.avgPity)
  return prevEntry.percentile + ratio * (entry.percentile - prevEntry.percentile)
})

const userLuckClass = computed(() => {
  const p = userPercentile.value
  if (p === null) return ''
  if (p <= 1) return 'godly'
  if (p <= 5) return 'very-lucky'
  if (p <= 25) return 'lucky'
  if (p <= 50) return 'average'
  if (p <= 75) return 'unlucky'
  if (p <= 95) return 'very-unlucky'
  return 'cursed'
})

const userLuckLabel = computed(() => {
  const p = userPercentile.value
  if (p === null) return ''
  if (p <= 1) return '🌟 Godly Luck!'
  if (p <= 5) return '✨ Very Lucky!'
  if (p <= 25) return '😊 Lucky'
  if (p <= 50) return '📊 Above Average'
  if (p <= 75) return '😐 Below Average'
  if (p <= 95) return '😢 Unlucky'
  return '💀 Very Unlucky'
})

// Generate lookup table from sample stats
const lookupTable = computed(() => {
  const lookup = props.sampleStats?.avgPityPercentileLookup
  if (!lookup) return []
  
  return lookup.map(row => {
    let luckEmoji, luckClass
    const p = row.percentile
    
    if (p <= 1) { luckEmoji = '🌟 Godly'; luckClass = 'godly' }
    else if (p <= 5) { luckEmoji = '✨ Very Lucky'; luckClass = 'very-lucky' }
    else if (p <= 15) { luckEmoji = '😊 Lucky'; luckClass = 'lucky' }
    else if (p <= 50) { luckEmoji = '📊 Above Avg'; luckClass = 'above-avg' }
    else if (p <= 85) { luckEmoji = '😐 Below Avg'; luckClass = 'below-avg' }
    else if (p <= 95) { luckEmoji = '😢 Unlucky'; luckClass = 'unlucky' }
    else { luckEmoji = '💀 Very Unlucky'; luckClass = 'very-unlucky' }
    
    return { ...row, luckEmoji, luckClass }
  })
})

// Individual pull percentiles (for the expanded section)
const individualPercentiles = computed(() => {
  const dist = props.distribution
  const total = dist.reduce((a, b) => a + b, 0)
  if (total === 0) return []
  
  const milestones = [1, 10, 20, 30, 40, 50, 60, 70, 73, 75, 77, 80, 85, 90]
  let cumulative = 0
  const results = []
  
  for (let i = 0; i < dist.length; i++) {
    cumulative += dist[i]
    if (milestones.includes(i + 1)) {
      const percentile = (cumulative / total) * 100
      let luckClass = 'average'
      if (percentile <= 15) luckClass = 'lucky'
      else if (percentile <= 50) luckClass = 'above-avg'
      else if (percentile >= 85) luckClass = 'unlucky'
      
      results.push({ pity: i + 1, percentile, luckClass })
    }
  }
  
  return results
})

const createChart = () => {
  if (!chartCanvas.value) return
  if (chartInstance) chartInstance.destroy()
  
  const ctx = chartCanvas.value.getContext('2d')
  const labels = Array.from({ length: 90 }, (_, i) => i + 1)
  const total = props.distribution.reduce((a, b) => a + b, 0)
  
  const normalizedData = props.distribution.map(v => (v / total) * 100)
  
  const gradient = ctx.createLinearGradient(0, 0, 0, 200)
  gradient.addColorStop(0, 'rgba(78, 166, 229, 0.8)')
  gradient.addColorStop(1, 'rgba(78, 166, 229, 0.2)')
  
  chartInstance = new Chart(ctx, {
    type: 'bar',
    data: {
      labels,
      datasets: [{
        label: 'Probability (%)',
        data: normalizedData,
        backgroundColor: gradient,
        borderColor: 'rgba(78, 166, 229, 0.9)',
        borderWidth: 1,
        borderRadius: 2
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: 'rgba(30, 41, 59, 0.95)',
          titleColor: '#e8d5a3',
          bodyColor: '#e3e1d5',
          callbacks: {
            title: (items) => `Pity ${items[0].label}`,
            label: (item) => `${item.raw.toFixed(2)}% of 5★ hit here`
          }
        }
      },
      scales: {
        x: {
          grid: { display: false },
          ticks: {
            color: 'rgba(168, 164, 154, 0.7)',
            font: { size: 8 },
            maxTicksLimit: 10
          }
        },
        y: {
          grid: { color: 'rgba(232, 213, 163, 0.04)' },
          ticks: {
            color: 'rgba(168, 164, 154, 0.7)',
            font: { size: 8 },
            callback: (v) => v.toFixed(0) + '%'
          }
        }
      }
    }
  })
}

onMounted(() => createChart())
watch(() => props.distribution, () => createChart(), { deep: true })
onUnmounted(() => chartInstance?.destroy())
</script>

<style scoped>
.percentile-chart {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.explanation-box {
  background: rgba(78, 166, 229, 0.1);
  border: 1px solid rgba(78, 166, 229, 0.2);
  border-radius: var(--radius-md);
  padding: 0.75rem 1rem;
  font-size: 0.75rem;
  color: var(--text-secondary);
}

.explanation-box p { margin: 0.2rem 0; }
.explanation-box strong { color: var(--hydro); }

.sample-stats {
  margin-bottom: 0.5rem;
}

.stat-row {
  display: flex;
  gap: 0.75rem;
}

.stat-box {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.2rem;
  padding: 0.6rem;
  background: rgba(15, 23, 41, 0.4);
  border-radius: var(--radius-sm);
  border: 1px solid rgba(232, 213, 163, 0.06);
}

.stat-label {
  font-size: 0.6rem;
  color: var(--text-muted);
  text-transform: uppercase;
}

.stat-value {
  font-family: var(--font-display);
  font-size: 1rem;
  font-weight: 700;
  color: var(--ui-gold);
}

.percentile-stats h4 {
  font-size: 0.75rem;
  color: var(--text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 0.6rem;
}

.percentile-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 0.5rem;
}

@media (max-width: 500px) {
  .percentile-grid { grid-template-columns: repeat(2, 1fr); }
}

.percentile-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.15rem;
  padding: 0.5rem 0.3rem;
  background: rgba(15, 23, 41, 0.4);
  border-radius: var(--radius-sm);
  border-left: 3px solid;
}

.percentile-item.godly { border-color: #ffd700; }
.percentile-item.lucky { border-color: var(--radiance); }
.percentile-item.good { border-color: var(--anemo); }
.percentile-item.median { border-color: var(--geo); }
.percentile-item.below { border-color: var(--standard); }
.percentile-item.bad { border-color: var(--pyro); }

.percentile-label {
  font-size: 0.55rem;
  color: var(--text-muted);
  text-transform: uppercase;
}

.percentile-value {
  font-family: var(--font-display);
  font-size: 0.95rem;
  font-weight: 700;
}

.percentile-item.godly .percentile-value { color: #ffd700; text-shadow: 0 0 8px rgba(255, 215, 0, 0.5); }
.percentile-item.lucky .percentile-value { color: var(--radiance); }
.percentile-item.good .percentile-value { color: var(--anemo); }
.percentile-item.median .percentile-value { color: var(--geo); }
.percentile-item.below .percentile-value { color: var(--standard); }
.percentile-item.bad .percentile-value { color: var(--pyro); }

.percentile-tag { font-size: 0.5rem; color: var(--text-muted); }

/* Quick Lookup */
.quick-lookup {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 1rem;
  flex-wrap: wrap;
}

.quick-lookup label {
  font-size: 0.75rem;
  color: var(--text-secondary);
}

.quick-lookup .form-input.mini {
  width: 80px;
  padding: 0.5rem 0.6rem;
  font-size: 0.9rem;
}

.user-result {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.4rem 0.75rem;
  border-radius: var(--radius-sm);
  background: rgba(15, 23, 41, 0.5);
}

.result-percentile {
  font-family: var(--font-display);
  font-weight: 700;
  font-size: 1rem;
}

.result-label { font-size: 0.7rem; }

.user-result.godly .result-percentile { color: #ffd700; text-shadow: 0 0 10px rgba(255, 215, 0, 0.6); }
.user-result.very-lucky .result-percentile { color: var(--radiance); }
.user-result.lucky .result-percentile { color: var(--anemo); }
.user-result.average .result-percentile { color: var(--geo); }
.user-result.unlucky .result-percentile { color: var(--standard); }
.user-result.very-unlucky .result-percentile { color: var(--pyro); }
.user-result.cursed .result-percentile { color: var(--pyro); }

/* Lookup Table */
.lookup-section {
  background: rgba(15, 23, 41, 0.3);
  border-radius: var(--radius-md);
  border: 1px solid var(--border-light);
  overflow: hidden;
}

.lookup-section summary {
  padding: 0.75rem 1rem;
  cursor: pointer;
  font-size: 0.8rem;
  font-weight: 600;
  color: var(--text-secondary);
}

.lookup-section summary:hover { color: var(--ui-gold); }
.lookup-section[open] summary { border-bottom: 1px solid var(--border-light); }

.lookup-content { padding: 1rem; }

.lookup-description {
  font-size: 0.7rem;
  color: var(--text-muted);
  margin-bottom: 0.75rem;
  text-align: center;
}

.lookup-table-wrapper {
  max-height: 350px;
  overflow-y: auto;
}

.lookup-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.7rem;
}

.lookup-table thead {
  position: sticky;
  top: 0;
  background: rgba(21, 32, 54, 0.98);
}

.lookup-table th {
  padding: 0.5rem;
  text-align: center;
  font-size: 0.6rem;
  text-transform: uppercase;
  color: var(--text-muted);
  border-bottom: 1px solid var(--border-light);
}

.lookup-table td {
  padding: 0.4rem 0.5rem;
  text-align: center;
  border-bottom: 1px solid rgba(232, 213, 163, 0.03);
}

.lookup-table tbody tr:hover { background: rgba(232, 213, 163, 0.05); }

.pity-cell { font-weight: 600; color: var(--text-primary); }
.percent-cell { font-family: var(--font-display); font-weight: 700; }
.luck-cell { font-size: 0.6rem; }

.lookup-table tr.godly .percent-cell { color: #ffd700; }
.lookup-table tr.very-lucky .percent-cell { color: var(--radiance); }
.lookup-table tr.lucky .percent-cell { color: var(--anemo); }
.lookup-table tr.above-avg .percent-cell { color: var(--text-secondary); }
.lookup-table tr.below-avg .percent-cell { color: var(--standard); }
.lookup-table tr.unlucky .percent-cell { color: var(--electro); }
.lookup-table tr.very-unlucky .percent-cell { color: var(--pyro); }

.chart-container {
  position: relative;
  height: 200px;
  margin-bottom: 1rem;
}

.individual-percentiles h5 {
  font-size: 0.7rem;
  color: var(--text-muted);
  text-transform: uppercase;
  margin-bottom: 0.5rem;
}

.ind-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 0.4rem;
}

@media (max-width: 500px) {
  .ind-grid { grid-template-columns: repeat(3, 1fr); }
}

.ind-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.1rem;
  padding: 0.4rem;
  background: rgba(15, 23, 41, 0.4);
  border-radius: var(--radius-sm);
  font-size: 0.65rem;
}

.ind-pity { color: var(--text-muted); }
.ind-percent { font-weight: 600; }
.ind-percent.lucky { color: var(--radiance); }
.ind-percent.above-avg { color: var(--anemo); }
.ind-percent.average { color: var(--text-secondary); }
.ind-percent.unlucky { color: var(--pyro); }
</style>
