<template>
  <div class="chart-container">
    <canvas ref="chartCanvas"></canvas>
  </div>
</template>

<script setup>
import { ref, onMounted, watch, onUnmounted } from 'vue'
import { Chart, DoughnutController, ArcElement, Tooltip, Legend } from 'chart.js'

Chart.register(DoughnutController, ArcElement, Tooltip, Legend)

const props = defineProps({
  guaranteeVisits: { type: Array, required: true }
})

const chartCanvas = ref(null)
let chartInstance = null

const createChart = () => {
  if (chartInstance) chartInstance.destroy()

  const ctx = chartCanvas.value.getContext('2d')
  const total = props.guaranteeVisits.reduce((a, b) => a + b, 0)

  chartInstance = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: ['50/50 Roll', 'Guaranteed'],
      datasets: [{
        data: props.guaranteeVisits,
        backgroundColor: [
          'rgba(78, 166, 229, 0.85)',   // Hydro - 50/50
          'rgba(242, 182, 63, 0.85)'     // Geo - Guaranteed
        ],
        borderColor: [
          'rgba(78, 166, 229, 1)',
          'rgba(242, 182, 63, 1)'
        ],
        borderWidth: 2,
        hoverOffset: 8
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      cutout: '60%',
      plugins: {
        legend: {
          position: 'bottom',
          labels: {
            color: 'rgba(227, 225, 213, 0.9)',
            font: { size: 11, family: 'Inter' },
            padding: 15,
            usePointStyle: true
          }
        },
        tooltip: {
          backgroundColor: 'rgba(30, 41, 59, 0.95)',
          titleColor: '#e8d5a3',
          bodyColor: '#e3e1d5',
          borderColor: 'rgba(232, 213, 163, 0.25)',
          borderWidth: 1,
          padding: 12,
          cornerRadius: 8,
          callbacks: {
            label: (item) => {
              const val = item.raw
              const pct = ((val / total) * 100).toFixed(1)
              return ` ${formatNumber(val)} (${pct}%)`
            }
          }
        }
      }
    }
  })
}

const formatNumber = (num) => {
  if (num >= 1000000) return (num / 1000000).toFixed(2) + 'M'
  if (num >= 1000) return (num / 1000).toFixed(1) + 'K'
  return num.toLocaleString()
}

onMounted(() => createChart())
watch(() => props.guaranteeVisits, () => createChart(), { deep: true })
onUnmounted(() => chartInstance?.destroy())
</script>

<style scoped>
.chart-container {
  position: relative;
  width: 100%;
  height: 260px;
  margin-top: 0.25rem;
}
</style>
