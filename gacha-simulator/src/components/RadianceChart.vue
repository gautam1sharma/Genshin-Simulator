<template>
  <div class="chart-container">
    <canvas ref="chartCanvas"></canvas>
  </div>
</template>

<script setup>
import { ref, onMounted, watch, onUnmounted } from 'vue'
import { Chart, BarController, BarElement, CategoryScale, LinearScale, Tooltip, Legend } from 'chart.js'

Chart.register(BarController, BarElement, CategoryScale, LinearScale, Tooltip, Legend)

const props = defineProps({
  radianceByCounter: { type: Array, required: true }
})

const chartCanvas = ref(null)
let chartInstance = null

const createChart = () => {
  if (chartInstance) chartInstance.destroy()

  const ctx = chartCanvas.value.getContext('2d')
  
  // Gradient from dim to bright radiance
  const colors = [
    'rgba(128, 255, 212, 0.3)',
    'rgba(128, 255, 212, 0.5)',
    'rgba(128, 255, 212, 0.75)',
    'rgba(128, 255, 212, 1)'
  ]

  chartInstance = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: ['Counter 0', 'Counter 1', 'Counter 2', 'Counter 3'],
      datasets: [{
        label: 'Radiance Triggers',
        data: props.radianceByCounter,
        backgroundColor: colors,
        borderColor: 'rgba(128, 255, 212, 0.8)',
        borderWidth: 1,
        borderRadius: 6
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: 'rgba(30, 41, 59, 0.95)',
          titleColor: '#80ffd4',
          bodyColor: '#e3e1d5',
          borderColor: 'rgba(128, 255, 212, 0.3)',
          borderWidth: 1,
          padding: 12,
          cornerRadius: 8,
          callbacks: {
            label: (item) => ` ${formatNumber(item.raw)} triggers`,
            afterLabel: (item) => {
              const i = item.dataIndex
              if (i === 0) return '⚪ 0% chance (never triggers)'
              if (i === 1) return '🟡 Configurable chance'
              if (i === 2) return '🟠 Configurable chance'
              return '✨ 100% guaranteed'
            }
          }
        }
      },
      scales: {
        x: {
          grid: { display: false },
          ticks: {
            color: 'rgba(168, 164, 154, 0.7)',
            font: { size: 10, family: 'Inter' }
          }
        },
        y: {
          grid: { color: 'rgba(232, 213, 163, 0.04)' },
          ticks: {
            color: 'rgba(168, 164, 154, 0.7)',
            font: { size: 9, family: 'Inter' },
            callback: (v) => formatNumber(v)
          }
        }
      }
    }
  })
}

const formatNumber = (num) => {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M'
  if (num >= 1000) return (num / 1000).toFixed(0) + 'K'
  return num
}

onMounted(() => createChart())
watch(() => props.radianceByCounter, () => createChart(), { deep: true })
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
