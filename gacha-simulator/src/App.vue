<template>
  <div class="container">
    <!-- Header -->
    <header class="header">
      <h1>✨ Genshin Gacha Simulator</h1>
      <p class="header-subtitle">
        Monte Carlo Simulation • Pity Curve • Capturing Radiance
      </p>
    </header>

    <!-- Main Layout -->
    <div class="main-grid">
      <!-- Sidebar -->
      <aside class="sidebar">
        <ConfigPanel
          :isRunning="isRunning"
          :progress="progress"
          @run="runSimulation"
          @stop="stopSimulation"
        />
        <WishHistoryAnalyzer
          :simulationData="results"
          class="mt-4"
        />
      </aside>

      <!-- Results -->
      <main class="results-grid">
        <ResultsDashboard
          v-if="results"
          :results="results"
          class="fade-in"
        />
        
        <!-- Distribution Charts Row -->
        <div v-if="results" class="charts-row">
          <div class="card fade-in">
            <div class="card-header">
              <h2 class="card-title">
                <span class="card-icon">📊</span>
                Pity Distribution
              </h2>
            </div>
            <PityChart :distribution="results.pityDistribution" />
          </div>

          <div class="card fade-in">
            <div class="card-header">
              <h2 class="card-title">
                <span class="card-icon">📈</span>
                Cumulative Frequency
              </h2>
            </div>
            <CumulativeChart :distribution="results.pityDistribution" />
          </div>
        </div>

        <!-- Percentile Chart (Full Width) -->
        <div v-if="results" class="card fade-in">
          <div class="card-header">
            <h2 class="card-title">
              <span class="card-icon">📐</span>
              Pity Percentiles & Statistics
            </h2>
          </div>
          <PercentileChart 
            :distribution="results.pityDistribution" 
            :sampleStats="results.sampleStats"
          />
        </div>

        <!-- State Charts Row -->
        <div v-if="results" class="charts-row">
          <div class="card fade-in">
            <div class="card-header">
              <h2 class="card-title">
                <span class="card-icon">🔄</span>
                Guarantee State Visits
              </h2>
            </div>
            <GuaranteeChart :guaranteeVisits="results.guaranteeStateVisits" />
          </div>

          <div class="card fade-in">
            <div class="card-header">
              <h2 class="card-title">
                <span class="card-icon">✨</span>
                Radiance by Counter
              </h2>
            </div>
            <RadianceChart :radianceByCounter="results.radianceByCounter" />
          </div>
        </div>

        <!-- Empty State -->
        <div v-if="!results && !isRunning" class="card empty-state">
          <div class="empty-content">
            <div class="empty-icon float">🎲</div>
            <h2>Ready to Wish</h2>
            <p class="text-muted">Configure and begin your simulation</p>
            <div class="empty-features">
              <span>⚡ Millions of wishes</span>
              <span>📊 Deep analytics</span>
              <span>✨ Correct mechanics</span>
            </div>
          </div>
        </div>

        <!-- Running State -->
        <div v-if="isRunning && !results" class="card running-state">
          <div class="running-content">
            <div class="running-spinner"></div>
            <h3>Wishing...</h3>
            <p class="text-muted">Processing {{ formatNumber(currentSimCount) }} wishes</p>
          </div>
        </div>
      </main>
    </div>
  </div>
</template>

<script setup>
import { ref, shallowRef } from 'vue'
import ConfigPanel from './components/ConfigPanel.vue'
import ResultsDashboard from './components/ResultsDashboard.vue'
import PityChart from './components/PityChart.vue'
import CumulativeChart from './components/CumulativeChart.vue'
import GuaranteeChart from './components/GuaranteeChart.vue'
import RadianceChart from './components/RadianceChart.vue'
import PercentileChart from './components/PercentileChart.vue'
import WishHistoryAnalyzer from './components/WishHistoryAnalyzer.vue'

const isRunning = ref(false)
const progress = ref(0)
const results = shallowRef(null)
const currentSimCount = ref(0)
let worker = null

const formatNumber = (num) => {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M'
  if (num >= 1000) return (num / 1000).toFixed(0) + 'K'
  return num.toLocaleString()
}

const runSimulation = ({ numSimulations, radianceChances, sampleSize }) => {
  isRunning.value = true
  progress.value = 0
  results.value = null
  currentSimCount.value = numSimulations

  worker = new Worker(
    new URL('./core/worker.js', import.meta.url),
    { type: 'module' }
  )

  worker.onmessage = (e) => {
    if (e.data.type === 'progress') {
      progress.value = e.data.progress
    } else if (e.data.type === 'complete') {
      results.value = e.data.results
      isRunning.value = false
      progress.value = 100
      worker.terminate()
      worker = null
    }
  }

  worker.onerror = (error) => {
    console.error('Worker error:', error)
    isRunning.value = false
    worker.terminate()
    worker = null
  }

  worker.postMessage({ numSimulations, radianceChances, sampleSize })
}

const stopSimulation = () => {
  if (worker) {
    worker.terminate()
    worker = null
  }
  isRunning.value = false
  progress.value = 0
}
</script>

<style scoped>
.empty-state {
  min-height: 300px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.empty-content {
  text-align: center;
  max-width: 350px;
}

.empty-icon {
  font-size: 3rem;
  margin-bottom: 1rem;
  display: inline-block;
}

.empty-content h2 {
  font-size: 1.3rem;
  margin-bottom: 0.4rem;
  background: linear-gradient(135deg, var(--ui-cream), var(--ui-gold));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.empty-features {
  display: flex;
  gap: 1rem;
  justify-content: center;
  margin-top: 1rem;
  font-size: 0.75rem;
  color: var(--text-secondary);
}

.running-state {
  min-height: 200px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.running-content { text-align: center; }

.running-spinner {
  width: 45px;
  height: 45px;
  border: 3px solid rgba(232, 213, 163, 0.15);
  border-top-color: var(--ui-gold);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  margin: 0 auto 1rem;
}

@keyframes spin { to { transform: rotate(360deg); } }

.running-content h3 {
  color: var(--ui-gold);
  margin-bottom: 0.3rem;
}
</style>
