<template>
  <div class="chart-container">
    <canvas ref="chartCanvas"></canvas>
  </div>
</template>

<script setup>
import { ref, onMounted, watch, onUnmounted } from 'vue'
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
  distribution: { type: Array, required: true }
})

const chartCanvas = ref(null)
let chartInstance = null

const createChart = () => {
  if (chartInstance) chartInstance.destroy()

  const ctx = chartCanvas.value.getContext('2d')
  const labels = Array.from({ length: 90 }, (_, i) => i + 1)
  
  // Genshin-inspired gradients
  const gradientBase = ctx.createLinearGradient(0, 0, 0, 260)
  gradientBase.addColorStop(0, 'rgba(78, 166, 229, 0.85)')  // Hydro
  gradientBase.addColorStop(1, 'rgba(78, 166, 229, 0.25)')
  
  const gradientSoft = ctx.createLinearGradient(0, 0, 0, 260)
  gradientSoft.addColorStop(0, 'rgba(242, 182, 63, 0.9)')   // Geo
  gradientSoft.addColorStop(1, 'rgba(242, 182, 63, 0.3)')
  
  const gradientHard = ctx.createLinearGradient(0, 0, 0, 260)
  gradientHard.addColorStop(0, 'rgba(229, 115, 115, 0.95)') // Pyro
  gradientHard.addColorStop(1, 'rgba(229, 115, 115, 0.35)')
  
  const colors = props.distribution.map((_, i) => {
    const pity = i + 1
    if (pity <= 73) return gradientBase
    if (pity < 90) return gradientSoft
    return gradientHard
  })

  chartInstance = new Chart(ctx, {
    type: 'bar',
    data: {
      labels,
      datasets: [{
        data: props.distribution,
        backgroundColor: colors,
        borderColor: 'transparent',
        borderRadius: 3,
        borderSkipped: false
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
          borderColor: 'rgba(232, 213, 163, 0.25)',
          borderWidth: 1,
          padding: 12,
          cornerRadius: 8,
          displayColors: false,
          callbacks: {
            title: (items) => `Pity ${items[0].label}`,
            label: (item) => {
              const count = item.raw
              const total = props.distribution.reduce((a, b) => a + b, 0)
              return `${count.toLocaleString()} (${((count / total) * 100).toFixed(2)}%)`
            },
            afterLabel: (item) => {
              const pity = parseInt(item.label)
              if (pity <= 73) return '💧 Base rate zone'
              if (pity < 90) return '🌟 Soft pity zone'
              return '🔥 Hard pity'
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
          grid: { color: 'rgba(232, 213, 163, 0.04)', drawBorder: false },
          ticks: {
            color: 'rgba(168, 164, 154, 0.7)',
            font: { size: 9, family: 'Inter' },
            callback: (v) => v >= 1000000 ? (v/1000000).toFixed(1)+'M' : v >= 1000 ? (v/1000).toFixed(0)+'K' : v
          },
          title: {
            display: true,
            text: 'Frequency',
            color: 'rgba(168, 164, 154, 0.5)',
            font: { size: 10, family: 'Inter' }
          }
        }
      },
      animation: { duration: 700, easing: 'easeOutQuart' }
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
