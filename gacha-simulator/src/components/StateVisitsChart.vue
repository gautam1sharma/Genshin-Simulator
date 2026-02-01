<template>
  <div class="chart-container">
    <canvas ref="chartCanvas"></canvas>
  </div>
</template>

<script setup>
import { ref, onMounted, watch, onUnmounted } from 'vue'
import {
  Chart,
  DoughnutController,
  ArcElement,
  Tooltip,
  Legend
} from 'chart.js'

Chart.register(DoughnutController, ArcElement, Tooltip, Legend)

const props = defineProps({
  stateVisits: {
    type: Array,
    required: true
  }
})

const chartCanvas = ref(null)
let chartInstance = null

const createChart = () => {
  if (chartInstance) {
    chartInstance.destroy()
  }

  const ctx = chartCanvas.value.getContext('2d')
  
  const stateLabels = ['State 0 (Initial)', 'State 1 (Lost 1)', 'State 2 (Lost 2)', 'State 3 (Radiance)']
  const stateColors = [
    'rgba(78, 166, 229, 0.85)',   // Hydro blue
    'rgba(255, 177, 66, 0.85)',    // Geo gold
    'rgba(229, 115, 115, 0.85)',   // Pyro red
    'rgba(128, 255, 212, 0.85)'    // Radiance cyan
  ]
  const borderColors = [
    'rgba(78, 166, 229, 1)',
    'rgba(255, 177, 66, 1)',
    'rgba(229, 115, 115, 1)',
    'rgba(128, 255, 212, 1)'
  ]

  const total = props.stateVisits.reduce((a, b) => a + b, 0)

  chartInstance = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: stateLabels,
      datasets: [{
        data: props.stateVisits,
        backgroundColor: stateColors,
        borderColor: borderColors,
        borderWidth: 2,
        hoverBorderWidth: 3,
        hoverOffset: 8
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      cutout: '55%',
      plugins: {
        legend: {
          position: 'bottom',
          labels: {
            color: 'rgba(227, 225, 213, 0.9)',
            font: { size: 11, family: 'Inter' },
            padding: 15,
            usePointStyle: true,
            pointStyle: 'circle'
          }
        },
        tooltip: {
          backgroundColor: 'rgba(30, 41, 59, 0.95)',
          titleColor: '#e8d5a3',
          bodyColor: '#e3e1d5',
          borderColor: 'rgba(232, 213, 163, 0.3)',
          borderWidth: 1,
          padding: 14,
          cornerRadius: 10,
          callbacks: {
            label: (item) => {
              const value = item.raw
              const percent = ((value / total) * 100).toFixed(1)
              return ` ${formatNumber(value)} visits (${percent}%)`
            }
          }
        }
      },
      animation: {
        animateRotate: true,
        animateScale: true,
        duration: 1000,
        easing: 'easeOutQuart'
      }
    }
  })
}

const formatNumber = (num) => {
  if (num >= 1000000) return (num / 1000000).toFixed(2) + 'M'
  if (num >= 1000) return (num / 1000).toFixed(1) + 'K'
  return num.toLocaleString()
}

onMounted(() => {
  createChart()
})

watch(() => props.stateVisits, () => {
  createChart()
}, { deep: true })

onUnmounted(() => {
  if (chartInstance) {
    chartInstance.destroy()
  }
})
</script>

<style scoped>
.chart-container {
  position: relative;
  width: 100%;
  height: 300px;
  margin-top: 0.5rem;
}
</style>
