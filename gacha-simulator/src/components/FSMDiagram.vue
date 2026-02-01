<template>
  <div class="fsm-container">
    <!-- Compact Transition Table -->
    <div class="transitions-table">
      <!-- State 0 -->
      <div class="state-row">
        <div class="state-badge" style="--c: var(--hydro)">0</div>
        <div class="state-info">
          <span class="state-name">Initial</span>
          <span class="state-desc">50/50 chance</span>
        </div>
        <div class="outcomes">
          <div class="outcome win">
            <span class="outcome-icon">✓</span>
            <span class="outcome-count">{{ fmt(transitions['0_featured']) }}</span>
          </div>
          <div class="outcome lose">
            <span class="outcome-icon">✗</span>
            <span class="outcome-count">{{ fmt(transitions['0_standard']) }}</span>
          </div>
        </div>
      </div>

      <!-- State 1 -->
      <div class="state-row">
        <div class="state-badge" style="--c: var(--geo)">1</div>
        <div class="state-info">
          <span class="state-name">Lost 1</span>
          <span class="state-desc">50/50 chance</span>
        </div>
        <div class="outcomes">
          <div class="outcome win">
            <span class="outcome-icon">✓</span>
            <span class="outcome-count">{{ fmt(transitions['1_featured']) }}</span>
          </div>
          <div class="outcome lose">
            <span class="outcome-icon">✗</span>
            <span class="outcome-count">{{ fmt(transitions['1_standard']) }}</span>
          </div>
        </div>
      </div>

      <!-- State 2 (Radiance possible) -->
      <div class="state-row radiance-possible">
        <div class="state-badge" style="--c: var(--pyro)">2</div>
        <div class="state-info">
          <span class="state-name">Lost 2</span>
          <span class="state-desc">Radiance possible!</span>
        </div>
        <div class="outcomes three">
          <div class="outcome win">
            <span class="outcome-icon">✓</span>
            <span class="outcome-count">{{ fmt(transitions['2_featured']) }}</span>
          </div>
          <div class="outcome radiance">
            <span class="outcome-icon">✨</span>
            <span class="outcome-count">{{ fmt(transitions['2_radiance']) }}</span>
          </div>
          <div class="outcome lose">
            <span class="outcome-icon">✗</span>
            <span class="outcome-count">{{ fmt(transitions['2_standard']) }}</span>
          </div>
        </div>
      </div>

      <!-- State 3 (Guaranteed) -->
      <div class="state-row guaranteed">
        <div class="state-badge radiance-badge" style="--c: var(--radiance)">3</div>
        <div class="state-info">
          <span class="state-name radiance-text">Radiance</span>
          <span class="state-desc">100% guaranteed</span>
        </div>
        <div class="outcomes">
          <div class="outcome radiance large">
            <span class="outcome-icon">✨</span>
            <span class="outcome-count">{{ fmt(transitions['3_radiance']) }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Summary -->
    <div class="radiance-summary">
      <div class="summary-icon">✨</div>
      <div class="summary-text">
        <strong>Total Radiance Triggers:</strong>
        <span class="summary-values">
          {{ fmt(radianceS2) }} at State 2 + {{ fmt(radianceS3) }} at State 3 
          = <span class="total">{{ fmt(radianceS2 + radianceS3) }}</span>
        </span>
      </div>
    </div>

    <!-- Legend -->
    <div class="legend">
      <div class="legend-item"><span class="legend-dot win"></span> Featured (regular win)</div>
      <div class="legend-item"><span class="legend-dot radiance"></span> Radiance trigger</div>
      <div class="legend-item"><span class="legend-dot lose"></span> Standard (loss)</div>
    </div>
  </div>
</template>

<script setup>
const props = defineProps({
  transitions: { type: Object, required: true },
  radianceS2: { type: Number, default: 0 },
  radianceS3: { type: Number, default: 0 }
})

const fmt = (num) => {
  if (num >= 1000000) return (num / 1000000).toFixed(2) + 'M'
  if (num >= 1000) return (num / 1000).toFixed(1) + 'K'
  return (num || 0).toLocaleString()
}
</script>

<style scoped>
.fsm-container {
  padding: 0.5rem 0;
}

.transitions-table {
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
}

.state-row {
  display: flex;
  align-items: center;
  gap: 0.9rem;
  padding: 0.85rem 1rem;
  background: rgba(15, 23, 41, 0.35);
  border-radius: var(--radius-md);
  border: 1px solid rgba(232, 213, 163, 0.06);
  transition: all 0.2s ease;
}

.state-row:hover {
  border-color: var(--border-light);
  background: rgba(15, 23, 41, 0.5);
}

.state-row.radiance-possible {
  border-color: rgba(229, 115, 115, 0.15);
  background: linear-gradient(90deg, rgba(229, 115, 115, 0.04) 0%, rgba(15, 23, 41, 0.35) 100%);
}

.state-row.guaranteed {
  border-color: rgba(128, 255, 212, 0.2);
  background: linear-gradient(90deg, rgba(128, 255, 212, 0.06) 0%, rgba(15, 23, 41, 0.35) 100%);
}

.state-badge {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(15, 23, 41, 0.6);
  border: 2px solid var(--c);
  font-family: var(--font-display);
  font-weight: 700;
  font-size: 1rem;
  color: var(--c);
  flex-shrink: 0;
}

.radiance-badge {
  box-shadow: 0 0 15px rgba(128, 255, 212, 0.3);
  animation: glow 2s ease infinite alternate;
}

@keyframes glow {
  0% { box-shadow: 0 0 10px rgba(128, 255, 212, 0.2); }
  100% { box-shadow: 0 0 20px rgba(128, 255, 212, 0.4); }
}

.state-info {
  flex: 1;
  min-width: 0;
}

.state-name {
  display: block;
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--text-primary);
}

.state-name.radiance-text {
  color: var(--radiance);
  text-shadow: 0 0 10px var(--radiance);
}

.state-desc {
  display: block;
  font-size: 0.65rem;
  color: var(--text-muted);
  margin-top: 0.1rem;
}

.outcomes {
  display: flex;
  gap: 0.5rem;
}

.outcomes.three {
  gap: 0.4rem;
}

.outcome {
  display: flex;
  align-items: center;
  gap: 0.35rem;
  padding: 0.4rem 0.65rem;
  background: rgba(15, 23, 41, 0.5);
  border-radius: var(--radius-sm);
  min-width: 70px;
}

.outcome.large {
  min-width: 100px;
  padding: 0.5rem 0.8rem;
}

.outcome.win {
  border: 1px solid rgba(255, 215, 0, 0.15);
}

.outcome.lose {
  border: 1px solid rgba(201, 160, 220, 0.15);
}

.outcome.radiance {
  border: 1px solid rgba(128, 255, 212, 0.2);
  background: rgba(128, 255, 212, 0.05);
}

.outcome-icon {
  font-size: 0.75rem;
}

.outcome.win .outcome-icon { color: var(--featured); }
.outcome.lose .outcome-icon { color: var(--standard); }
.outcome.radiance .outcome-icon { 
  color: var(--radiance); 
  text-shadow: 0 0 8px var(--radiance);
}

.outcome-count {
  font-family: var(--font-display);
  font-size: 0.8rem;
  font-weight: 600;
}

.outcome.win .outcome-count { color: var(--featured); }
.outcome.lose .outcome-count { color: var(--standard); }
.outcome.radiance .outcome-count { color: var(--radiance); }

.radiance-summary {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-top: 1rem;
  padding: 0.9rem 1rem;
  background: linear-gradient(90deg, rgba(128, 255, 212, 0.08) 0%, rgba(78, 166, 229, 0.04) 100%);
  border-radius: var(--radius-md);
  border: 1px solid rgba(128, 255, 212, 0.15);
}

.summary-icon {
  font-size: 1.25rem;
  animation: pulse 2s ease infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.6; }
}

.summary-text {
  font-size: 0.8rem;
  color: var(--text-secondary);
  line-height: 1.5;
}

.summary-text strong {
  color: var(--radiance);
  font-weight: 600;
}

.summary-values .total {
  color: var(--radiance);
  font-weight: 700;
  font-family: var(--font-display);
  text-shadow: 0 0 10px var(--radiance);
}

.legend {
  display: flex;
  justify-content: center;
  gap: 1.25rem;
  margin-top: 1rem;
  flex-wrap: wrap;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  font-size: 0.7rem;
  color: var(--text-muted);
}

.legend-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
}

.legend-dot.win { background: var(--featured); }
.legend-dot.lose { background: var(--standard); }
.legend-dot.radiance { 
  background: var(--radiance); 
  box-shadow: 0 0 6px var(--radiance);
}
</style>
