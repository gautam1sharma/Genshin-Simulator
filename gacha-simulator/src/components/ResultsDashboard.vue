<template>
  <div class="card results-dashboard fade-in">
    <!-- Header -->
    <div class="dashboard-header">
      <div class="header-left">
        <span class="header-icon">📈</span>
        <div>
          <h2 class="dashboard-title">Simulation Results</h2>
          <p class="dashboard-meta">{{ formatNumber(results.totalPulls) }} total wishes</p>
        </div>
      </div>
    </div>

    <!-- Primary Stats -->
    <div class="primary-stats">
      <div class="big-stat">
        <div class="big-value featured">{{ formatNumber(results.featured5Star) }}</div>
        <div class="big-label">Featured 5★</div>
      </div>
      <div class="stat-divider"></div>
      <div class="big-stat">
        <div class="big-value standard">{{ formatNumber(results.standard5Star) }}</div>
        <div class="big-label">Standard 5★</div>
      </div>
      <div class="stat-divider"></div>
      <div class="big-stat">
        <div class="big-value">{{ results.avgPullsPerFeatured.toFixed(1) }}</div>
        <div class="big-label">Avg Pulls/Featured</div>
      </div>
    </div>

    <!-- Stats Grid -->
    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-value">{{ (results.rate5Star * 100).toFixed(2) }}%</div>
        <div class="stat-label">5★ Rate</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">{{ (results.rateFeatured * 100).toFixed(1) }}%</div>
        <div class="stat-label">Featured / 5★</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">{{ results.avg5StarPity.toFixed(1) }}</div>
        <div class="stat-label">Avg Pity</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">{{ formatNumber(results.total5Star) }}</div>
        <div class="stat-label">Total 5★</div>
      </div>
    </div>

    <!-- 50/50 & Guarantee Stats -->
    <div class="section-card">
      <h3 class="section-title">📊 50/50 & Guarantee</h3>
      <div class="stats-row">
        <div class="mini-stat">
          <span class="mini-label">Won 50/50</span>
          <span class="mini-value win">{{ formatNumber(results.wonFiftyFifty) }}</span>
        </div>
        <div class="mini-stat">
          <span class="mini-label">Lost 50/50</span>
          <span class="mini-value lose">{{ formatNumber(results.lostFiftyFifty) }}</span>
        </div>
        <div class="mini-stat">
          <span class="mini-label">Guarantee Used</span>
          <span class="mini-value guarantee">{{ formatNumber(results.guaranteeUsed) }}</span>
        </div>
      </div>
      <div class="stat-highlight">
        50/50 Win Rate: <strong>{{ (results.fiftyFiftyWinRate * 100).toFixed(1) }}%</strong>
        <span class="expected">(expected ~50%)</span>
      </div>
    </div>

    <!-- Radiance Stats -->
    <div class="radiance-section">
      <div class="radiance-header">
        <span class="radiance-icon">✨</span>
        <div>
          <h3>Capturing Radiance</h3>
          <p class="radiance-subtitle">Saved from {{ formatNumber(results.radianceSaved) }} would-be losses</p>
        </div>
      </div>
      
      <div class="radiance-breakdown">
        <div class="radiance-item" v-for="(count, i) in results.radianceByCounter" :key="i">
          <div class="radiance-counter">Counter {{ i }}</div>
          <div class="radiance-count">{{ formatNumber(count) }}</div>
        </div>
      </div>
      
      <div class="stat-highlight radiance-rate">
        Radiance Save Rate: <strong class="radiance-text">{{ (results.radianceRate * 100).toFixed(1) }}%</strong>
        <span class="expected">(of would-be losses)</span>
      </div>
    </div>

    <!-- Statistical Reliability -->
    <div v-if="results.sampleStats && results.sampleStats.sampleSize" class="section-card stats-reliability">
      <h3 class="section-title">📊 Statistical Reliability (Sample Size: {{ results.sampleStats.sampleSize }})</h3>
      <div class="stats-grid compact">
        <div class="stat-card">
          <div class="stat-value">{{ results.sampleStats.sampleMean.toFixed(2) }}</div>
          <div class="stat-label">Expected Avg Pity</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">±{{ results.sampleStats.sampleStdDev.toFixed(2) }}</div>
          <div class="stat-label">Standard Deviation</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">{{ formatNumber(results.sampleStats.sampleCount) }}</div>
          <div class="stat-label">Sample Groups</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
const props = defineProps({
  results: { type: Object, required: true }
})

const formatNumber = (num) => {
  if (num >= 1000000000) return (num / 1000000000).toFixed(2) + 'B'
  if (num >= 1000000) return (num / 1000000).toFixed(2) + 'M'
  if (num >= 1000) return (num / 1000).toFixed(1) + 'K'
  return num.toLocaleString()
}
</script>

<style scoped>
.results-dashboard {
  background: linear-gradient(180deg, var(--glass-bg) 0%, rgba(21, 32, 54, 0.8) 100%);
}

.dashboard-header {
  display: flex;
  align-items: center;
  margin-bottom: 1.5rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid var(--border-light);
}

.header-left {
  display: flex;
  align-items: center;
  gap: 0.9rem;
}

.header-icon { font-size: 1.6rem; }

.dashboard-title {
  font-size: 1.1rem;
  margin-bottom: 0.1rem;
}

.dashboard-meta {
  font-size: 0.72rem;
  color: var(--text-muted);
}

.primary-stats {
  display: flex;
  align-items: center;
  justify-content: space-around;
  padding: 1.25rem 0.75rem;
  margin-bottom: 1rem;
  background: rgba(15, 23, 41, 0.35);
  border-radius: var(--radius-md);
}

.big-stat { text-align: center; flex: 1; }

.big-value {
  font-family: var(--font-display);
  font-size: 2rem;
  font-weight: 700;
  color: var(--ui-gold);
  line-height: 1;
  margin-bottom: 0.35rem;
}

.big-value.featured { color: var(--featured); }
.big-value.standard { color: var(--standard); }

.big-label {
  font-size: 0.65rem;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.stat-divider {
  width: 1px;
  height: 45px;
  background: linear-gradient(180deg, transparent, var(--border-light), transparent);
}

.section-card {
  margin-top: 1rem;
  padding: 1rem;
  background: rgba(15, 23, 41, 0.3);
  border-radius: var(--radius-md);
  border: 1px solid rgba(232, 213, 163, 0.06);
}

.section-title {
  font-size: 0.85rem;
  color: var(--ui-gold);
  margin-bottom: 0.75rem;
}

.stats-row {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 0.75rem;
}

.mini-stat {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 0.6rem;
  background: rgba(15, 23, 41, 0.4);
  border-radius: var(--radius-sm);
}

.mini-label {
  font-size: 0.6rem;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.3px;
  margin-bottom: 0.25rem;
}

.mini-value {
  font-family: var(--font-display);
  font-size: 1rem;
  font-weight: 600;
}

.mini-value.win { color: var(--featured); }
.mini-value.lose { color: var(--standard); }
.mini-value.guarantee { color: var(--geo); }

.stat-highlight {
  font-size: 0.75rem;
  color: var(--text-secondary);
  text-align: center;
  padding-top: 0.5rem;
  border-top: 1px solid rgba(232, 213, 163, 0.06);
}

.stat-highlight strong {
  color: var(--ui-gold);
  font-weight: 600;
}

.expected {
  font-size: 0.65rem;
  color: var(--text-muted);
  margin-left: 0.25rem;
}

.radiance-section {
  margin-top: 1rem;
  padding: 1rem;
  background: linear-gradient(135deg, rgba(128, 255, 212, 0.06) 0%, rgba(78, 166, 229, 0.03) 100%);
  border-radius: var(--radius-md);
  border: 1px solid rgba(128, 255, 212, 0.1);
}

.radiance-header {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  margin-bottom: 0.75rem;
}

.radiance-icon {
  font-size: 1.25rem;
  animation: pulse 2s ease infinite;
}

.radiance-header h3 {
  font-size: 0.9rem;
  color: var(--radiance);
  margin-bottom: 0.05rem;
}

.radiance-subtitle {
  font-size: 0.68rem;
  color: var(--text-muted);
}

.radiance-breakdown {
  display: flex;
  gap: 0.4rem;
  margin-bottom: 0.75rem;
}

.radiance-item {
  flex: 1;
  text-align: center;
  padding: 0.5rem;
  background: rgba(15, 23, 41, 0.4);
  border-radius: var(--radius-sm);
}

.radiance-counter {
  font-size: 0.55rem;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.3px;
  margin-bottom: 0.2rem;
}

.radiance-count {
  font-family: var(--font-display);
  font-size: 0.9rem;
  font-weight: 600;
  color: var(--radiance);
}

.radiance-rate strong.radiance-text {
  color: var(--radiance);
  text-shadow: 0 0 10px var(--radiance);
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.6; }
}

.stats-grid.compact {
  grid-template-columns: repeat(3, 1fr);
  gap: 0.5rem;
  margin-top: 0.5rem;
}

.stats-grid.compact .stat-value { font-size: 1.1rem; }
.stats-grid.compact .stat-label { font-size: 0.6rem; }
</style>
