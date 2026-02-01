<template>
  <div class="chart-container">
    <canvas ref="chartCanvas"></canvas>
  </div>
</template>

<script setup>
import { ref, onMounted, watch, onUnmounted } from 'vue'
import {
  Chart,
  LineController,
  LineElement,
  PointElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend,
  Filler
} from 'chart.js'

Chart.register(LineController, LineElement, PointElement, CategoryScale, LinearScale, Tooltip, Legend, Filler)

const props = defineProps({
  distribution: { type: Array, required: true }
})

const chartCanvas = ref(null)
let chartInstance = null

const createChart = () => {
  if (chartInstance) chartInstance.destroy()

  const ctx = chartCanvas.value.getContext('2d')
  const labels = Array.from({ length: 90 }, (_, i) => i + 1)
  
  const total = props.distribution.reduce((a, b) => a + b, 0)
  let cumSum = 0
  const cumulativeData = props.distribution.map(val => {
    cumSum += val
    return (cumSum / total) * 100
  })

  // Genshin Anemo gradient
  const gradient = ctx.createLinearGradient(0, 0, 0, 260)
  gradient.addColorStop(0, 'rgba(116, 194, 168, 0.5)')
  gradient.addColorStop(0.5, 'rgba(116, 194, 168, 0.2)')
  gradient.addColorStop(1, 'rgba(116, 194, 168, 0.02)')

  chartInstance = new Chart(ctx, {
    type: 'line',
    data: {
      labels,
      datasets: [{
        data: cumulativeData,
        borderColor: '#74c2a8',
        backgroundColor: gradient,
        borderWidth: 2.5,
        fill: true,
        tension: 0.35,
        pointRadius: 0,
        pointHoverRadius: 5,
        pointHoverBackgroundColor: '#74c2a8',
        pointHoverBorderColor: '#e3e1d5',
        pointHoverBorderWidth: 2
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: { intersect: false, mode: 'index' },
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: 'rgba(30, 41, 59, 0.95)',
          titleColor: '#74c2a8',
          bodyColor: '#e3e1d5',
          borderColor: 'rgba(116, 194, 168, 0.3)',
          borderWidth: 1,
          padding: 12,
          cornerRadius: 8,
          displayColors: false,
          callbacks: {
            title: (items) => `By Pity ${items[0].label}`,
            label: (item) => `${item.raw.toFixed(1)}% of 5★ obtained`,
            afterLabel: (item) => {
              const p = parseInt(item.label)
              if (p === 73) return '⚡ Soft pity starts next'
              if (p === 89) return '🎯 Hard pity next'
              return ''
            }
          }
        }
      },
      scales: {
        x: {
          grid: { display: false },
          ticks: {
            color: 'rgba(168, 164, 154, 0.7)',
            font: { size: 9, family: 'Inter' },
            maxTicksLimit: 10,
            callback: function(val) {
              const l = this.getLabelForValue(val)
              if ([1, 20, 40, 60, 73, 80, 90].includes(parseInt(l))) return l
              return ''
            }
          },
          title: {
            display: true,
            text: 'Pity',
            color: 'rgba(168, 164, 154, 0.5)',
            font: { size: 10, family: 'Inter' }
          }
        },
        y: {
          min: 0,
          max: 100,
          grid: { color: 'rgba(232, 213, 163, 0.04)', drawBorder: false },
          ticks: {
            color: 'rgba(168, 164, 154, 0.7)',
            font: { size: 9, family: 'Inter' },
            callback: (v) => v + '%'
          },
          title: {
            display: true,
            text: 'Cumulative %',
            color: 'rgba(168, 164, 154, 0.5)',
            font: { size: 10, family: 'Inter' }
          }
        }
      },
      animation: { duration: 900, easing: 'easeOutQuart' }
    }
  })
}

onMounted(() => createChart())
watch(() => props.distribution, () => createChart(), { deep: true })
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
