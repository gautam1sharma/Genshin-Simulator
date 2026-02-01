<template>
  <div class="card config-panel">
    <!-- Header -->
    <div class="panel-header">
      <div class="header-icon">⚙️</div>
      <div>
        <h2 class="panel-title">Wish Configuration</h2>
        <p class="panel-subtitle">Monte Carlo Settings</p>
      </div>
    </div>

    <!-- Target Simulations -->
    <div class="form-group">
      <label class="form-label">
        Target Featured 5★
        <span class="label-value">{{ formatNumber(numSimulations) }}</span>
      </label>
      <input
        type="number"
        class="form-input"
        v-model.number="numSimulations"
        :disabled="isRunning"
        min="1"
        max="100000000"
        step="10000"
        placeholder="e.g., 1000000"
      />
    </div>

    <!-- Radiance Chances -->
    <div class="form-group">
      <label class="form-label">
        Radiance Trigger Rates
      </label>
      <div class="radiance-sliders">
        <div class="slider-row">
          <span class="slider-label">After 1 loss:</span>
          <input type="range" class="range-slider mini" v-model.number="radiance1" 
                 :disabled="isRunning" min="0" max="1" step="0.05" />
          <span class="slider-value">{{ (radiance1 * 100).toFixed(0) }}%</span>
        </div>
        <div class="slider-row">
          <span class="slider-label">After 2 losses:</span>
          <input type="range" class="range-slider mini" v-model.number="radiance2" 
                 :disabled="isRunning" min="0" max="1" step="0.05" />
          <span class="slider-value">{{ (radiance2 * 100).toFixed(0) }}%</span>
        </div>
      </div>
      <p class="range-hint">Counter 0: 0%, Counter 3: 100% (fixed)</p>
    </div>

    <!-- Sample Size -->
    <div class="form-group">
      <label class="form-label">
        Percentile Sample Size
        <span class="label-value">{{ sampleSize }} 5★</span>
      </label>
      <div class="sample-options">
        <button 
          v-for="opt in samplePresets" 
          :key="opt.value"
          class="sample-btn"
          :class="{ active: sampleSize === opt.value }"
          @click="sampleSize = opt.value"
          :disabled="isRunning"
        >
          {{ opt.label }}
        </button>
      </div>
      <p class="range-hint">Groups of 5★ for avg pity percentile calculation</p>
    </div>

    <!-- Presets -->
    <div class="presets-section">
      <label class="form-label">Quick Presets</label>
      <div class="presets-grid">
        <button class="preset-btn" @click="applyPreset('quick')" :disabled="isRunning">
          <span class="preset-icon">🚀</span>
          <span class="preset-label">Quick</span>
          <span class="preset-value">10K</span>
        </button>
        <button class="preset-btn" @click="applyPreset('standard')" :disabled="isRunning">
          <span class="preset-icon">📊</span>
          <span class="preset-label">Standard</span>
          <span class="preset-value">1M</span>
        </button>
        <button class="preset-btn" @click="applyPreset('precise')" :disabled="isRunning">
          <span class="preset-icon">🎯</span>
          <span class="preset-label">Precise</span>
          <span class="preset-value">10M</span>
        </button>
      </div>
    </div>

    <!-- Progress -->
    <div v-if="isRunning" class="progress-section">
      <div class="progress-bar">
        <div class="progress-fill" :style="{ width: `${progress}%` }"></div>
      </div>
      <div class="progress-info">
        <span class="progress-label">Wishing</span>
        <span class="progress-percent">{{ progress }}%</span>
      </div>
    </div>

    <!-- Button -->
    <button
      v-if="!isRunning"
      class="btn btn-primary btn-lg w-full"
      @click="handleRun"
      :disabled="numSimulations < 1"
    >
      <span>▶</span> Make Wishes
    </button>
    <button v-else class="btn btn-danger btn-lg w-full" @click="$emit('stop')">
      <span>⏹</span> Stop
    </button>

    <!-- Mechanics -->
    <div class="mechanics-card">
      <div class="mechanics-header">📖 Correct Mechanics</div>
      <div class="mechanics-list">
        <div class="mechanics-item">
          <span class="dot hydro"></span>
          <span>50/50: Win → featured, Lose → standard</span>
        </div>
        <div class="mechanics-item">
          <span class="dot geo"></span>
          <span><strong>Guarantee:</strong> After loss, next is 100% featured</span>
        </div>
        <div class="mechanics-item">
          <span class="dot radiance"></span>
          <span><strong>Radiance:</strong> Can save a would-be loss</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'

const props = defineProps({
  isRunning: Boolean,
  progress: Number
})

const emit = defineEmits(['run', 'stop'])

const numSimulations = ref(1000000)
const radiance1 = ref(0.25) // After 1 loss
const radiance2 = ref(0.50) // After 2 losses
const sampleSize = ref(500) // Sample size for percentile grouping

const samplePresets = [
  { label: '10', value: 10 },
  { label: '50', value: 50 },
  { label: '100', value: 100 },
  { label: '500', value: 500 },
  { label: '1000', value: 1000 }
]

const presets = {
  quick: { numSimulations: 10000 },
  standard: { numSimulations: 1000000 },
  precise: { numSimulations: 10000000 }
}

const formatNumber = (num) => {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M'
  if (num >= 1000) return (num / 1000).toFixed(0) + 'K'
  return num.toLocaleString()
}

const applyPreset = (name) => {
  numSimulations.value = presets[name].numSimulations
}

const handleRun = () => {
  emit('run', {
    numSimulations: numSimulations.value,
    radianceChances: [0.0, radiance1.value, radiance2.value, 1.0],
    sampleSize: sampleSize.value
  })
}
</script>

<style scoped>
.config-panel {
  background: linear-gradient(180deg, var(--glass-bg) 0%, rgba(21, 32, 54, 0.85) 100%);
}

.panel-header {
  display: flex;
  align-items: center;
  gap: 0.9rem;
  margin-bottom: 1.75rem;
  padding-bottom: 1.25rem;
  border-bottom: 1px solid var(--border-light);
}

.header-icon { font-size: 1.75rem; }

.panel-title {
  font-size: 1.1rem;
  color: var(--text-primary);
  margin-bottom: 0.1rem;
}

.panel-subtitle {
  font-size: 0.7rem;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.8px;
}

.label-value {
  font-family: var(--font-display);
  font-weight: 600;
  color: var(--ui-gold);
}

.radiance-sliders {
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
  margin-top: 0.5rem;
}

.slider-row {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.slider-label {
  font-size: 0.75rem;
  color: var(--text-secondary);
  min-width: 85px;
}

.range-slider.mini {
  flex: 1;
  height: 4px;
}

.slider-value {
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--radiance);
  min-width: 35px;
  text-align: right;
}

.range-hint {
  font-size: 0.65rem;
  color: var(--text-muted);
  font-style: italic;
  margin-top: 0.4rem;
}

.presets-section { margin-bottom: 1.5rem; }

.presets-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 0.5rem;
  margin-top: 0.5rem;
}

.preset-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.2rem;
  padding: 0.8rem 0.4rem;
  background: rgba(232, 213, 163, 0.04);
  border: 1px solid var(--border-light);
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: all var(--transition-normal);
}

.preset-btn:hover:not(:disabled) {
  background: rgba(232, 213, 163, 0.1);
  border-color: var(--border-glow);
  transform: translateY(-2px);
}

.preset-btn:disabled { opacity: 0.4; cursor: not-allowed; }

.preset-icon { font-size: 1.15rem; }
.preset-label {
  font-size: 0.65rem;
  color: var(--text-secondary);
  text-transform: uppercase;
}
.preset-value {
  font-family: var(--font-display);
  font-size: 0.8rem;
  font-weight: 600;
  color: var(--ui-gold);
}

.progress-section { margin: 1.25rem 0; }

.progress-info {
  display: flex;
  justify-content: space-between;
  font-size: 0.75rem;
  margin-top: 0.5rem;
}

.progress-label { color: var(--text-secondary); }
.progress-percent { color: var(--ui-gold); font-weight: 600; }

.mechanics-card {
  margin-top: 1.5rem;
  padding: 1rem;
  background: rgba(15, 23, 41, 0.4);
  border-radius: var(--radius-md);
  border: 1px solid rgba(232, 213, 163, 0.06);
}

.mechanics-header {
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--text-secondary);
  margin-bottom: 0.6rem;
}

.mechanics-list {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}

.mechanics-item {
  display: flex;
  align-items: flex-start;
  gap: 0.5rem;
  font-size: 0.7rem;
  color: var(--text-muted);
  line-height: 1.4;
}

.mechanics-item strong { color: var(--ui-gold); }

.dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
  margin-top: 3px;
}

.dot.hydro { background: var(--hydro); }
.dot.geo { background: var(--geo); }
.dot.radiance { 
  background: var(--radiance); 
  box-shadow: 0 0 8px var(--radiance);
}

.sample-options {
  display: flex;
  gap: 0.4rem;
  margin-top: 0.5rem;
}

.sample-btn {
  flex: 1;
  padding: 0.5rem 0.3rem;
  font-family: var(--font-display);
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--text-secondary);
  background: rgba(232, 213, 163, 0.04);
  border: 1px solid var(--border-light);
  border-radius: var(--radius-sm);
  cursor: pointer;
  transition: all var(--transition-fast);
}

.sample-btn:hover:not(:disabled) {
  background: rgba(232, 213, 163, 0.1);
  border-color: var(--border-glow);
}

.sample-btn.active {
  background: rgba(128, 255, 212, 0.15);
  border-color: var(--radiance);
  color: var(--radiance);
}

.sample-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}
</style>
