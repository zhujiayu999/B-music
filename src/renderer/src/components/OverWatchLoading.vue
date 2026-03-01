<!-- 守望先锋风格加载动画 (Overwatch Loading Animation - Pure CSS recreation) -->
<template>
  <div class="ow-loading-overlay" v-if="visible">
    <!-- Custom Loading Animation -->
    <template v-if="customAnimPath">
      <video v-if="isVideo" :src="'file://' + customAnimPath" autoplay loop muted class="custom-loader"></video>
      <img v-else :src="'file://' + customAnimPath" class="custom-loader" />
    </template>

    <!-- Default Overwatch Spinner -->
    <div class="ow-spinner" v-else>
      <svg viewBox="0 0 100 100" class="ow-svg">
        <!-- Outer ring segments -->
        <circle class="ow-ring-bg" cx="50" cy="50" r="42" />
        <circle class="ow-ring-arc" cx="50" cy="50" r="42" />

        <!-- Inner hexagon logo -->
        <g class="ow-hex-group">
          <polygon
            class="ow-hex-outer"
            points="50,22 72,35 72,65 50,78 28,65 28,35"
          />
          <polygon
            class="ow-hex-inner"
            points="50,32 64,40 64,60 50,68 36,60 36,40"
          />
          <!-- The O-shape cross lines -->
          <line class="ow-line" x1="50" y1="32" x2="50" y2="68" />
          <line class="ow-line" x1="36" y1="40" x2="64" y2="60" />
          <line class="ow-line" x1="64" y1="40" x2="36" y2="60" />
        </g>
      </svg>
      <!-- Orbiting dot -->
      <div class="ow-orbit">
        <div class="ow-dot"></div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted } from 'vue';

const props = defineProps<{ visible: boolean }>();

const customAnimPath = ref('');
const isVideo = ref(false);

function checkLoadingConfig() {
    const path = localStorage.getItem('bmusic-custom-loading') || '';
    customAnimPath.value = path;
    isVideo.value = path.toLowerCase().endsWith('.mp4') || path.toLowerCase().endsWith('.webm');
}

onMounted(() => checkLoadingConfig());

watch(() => props.visible, (newVal) => {
    if (newVal) checkLoadingConfig();
});
</script>

<style scoped>
.ow-loading-overlay {
  position: absolute;
  inset: 0;
  z-index: 100;
  background: #0d0d14;
  display: flex;
  align-items: center;
  justify-content: center;
  pointer-events: none;
}

.custom-loader {
  max-width: 150px;
  max-height: 150px;
  object-fit: contain;
  filter: drop-shadow(0 4px 12px rgba(0,0,0,0.5));
}

.ow-spinner {
  position: relative;
  width: 90px;
  height: 90px;
}

/* ----  SVG ring ---- */
.ow-svg {
  width: 100%;
  height: 100%;
  animation: ow-spin 1.8s linear infinite;
}

.ow-ring-bg {
  fill: none;
  stroke: rgba(255, 180, 0, 0.10);
  stroke-width: 4;
}

.ow-ring-arc {
  fill: none;
  stroke: #F5A623;
  stroke-width: 4;
  stroke-linecap: round;
  stroke-dasharray: 60 210;   /* arc length + gap */
  stroke-dashoffset: 0;
  animation: ow-dash 1.8s ease-in-out infinite, ow-spin 1.8s linear infinite;
  transform-origin: 50% 50%;
  filter: drop-shadow(0 0 6px #F5A623);
}

.ow-hex-outer {
  fill: none;
  stroke: #F5A623;
  stroke-width: 2;
  opacity: 0.6;
  animation: ow-pulse 1.8s ease-in-out infinite;
}

.ow-hex-inner {
  fill: rgba(245, 166, 35, 0.05);
  stroke: #F5A623;
  stroke-width: 1.5;
  opacity: 0.9;
}

.ow-line {
  stroke: #F5A623;
  stroke-width: 1.5;
  opacity: 0.5;
}

.ow-hex-group {
  animation: ow-counter-spin 1.8s linear infinite;
  transform-origin: 50px 50px;
}

/* ---- orbiting dot ---- */
.ow-orbit {
  position: absolute;
  inset: 0;
  animation: ow-spin 1.8s linear infinite;
}
.ow-dot {
  position: absolute;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #F5A623;
  top: -4px;
  left: calc(50% - 4px);
  box-shadow: 0 0 10px 3px rgba(245, 166, 35, 0.8);
}

/* ---- Keyframes ---- */
@keyframes ow-spin {
  to { transform: rotate(360deg); }
}
@keyframes ow-counter-spin {
  to { transform: rotate(-360deg); }
}
@keyframes ow-dash {
  0%   { stroke-dashoffset: 0;   }
  50%  { stroke-dashoffset: -100; }
  100% { stroke-dashoffset: -270; }
}
@keyframes ow-pulse {
  0%, 100% { opacity: 0.4; stroke-width: 2; }
  50%       { opacity: 0.9; stroke-width: 3; filter: drop-shadow(0 0 5px #F5A623);}
}
</style>
