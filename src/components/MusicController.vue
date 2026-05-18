<script setup>
import { ref, onMounted, onUnmounted, watch } from 'vue'

const props = defineProps({
  audio: {
    type: Object,
    default: null
  },
  isPlaying: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['toggle'])

const showButton = ref(true)
const isHovered = ref(false)
const isAnimating = ref(false)

// 切换播放状态
const togglePlay = () => {
  emit('toggle')
}

// 监听播放状态变化来添加动画效果
watch(() => props.isPlaying, (newVal, oldVal) => {
  if (newVal !== oldVal) {
    isAnimating.value = true
    setTimeout(() => {
      isAnimating.value = false
    }, 300)
  }
})
</script>

<template>
  <div 
    class="music-controller"
    :class="{ 
      'is-playing': isPlaying, 
      'is-animating': isAnimating,
      'is-hovered': isHovered 
    }"
    @click="togglePlay"
    @mouseenter="isHovered = true"
    @mouseleave="isHovered = false"
  >
    <!-- 音乐波形动画 -->
    <div class="music-bars" v-if="isPlaying">
      <span class="bar"></span>
      <span class="bar"></span>
      <span class="bar"></span>
      <span class="bar"></span>
      <span class="bar"></span>
    </div>
    
    <!-- 播放图标 -->
    <svg v-if="!isPlaying" class="icon play-icon" viewBox="0 0 24 24" fill="currentColor">
      <path d="M8 5v14l11-7z"/>
    </svg>
    
    <!-- 暂停图标 -->
    <svg v-else class="icon pause-icon" viewBox="0 0 24 24" fill="currentColor">
      <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/>
    </svg>
    
    <!-- 外圈光晕 -->
    <div class="glow-ring"></div>
  </div>
</template>

<style scoped>
.music-controller {
  position: fixed;
  top: 20px;
  right: 20px;
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: rgba(30, 40, 72, 0.8);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(150, 180, 255, 0.3);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  transition: all 0.3s ease;
  box-shadow: 0 4px 15px rgba(100, 150, 255, 0.2);
}

.music-controller:hover {
  background: rgba(40, 50, 85, 0.9);
  border-color: rgba(150, 180, 255, 0.5);
  transform: scale(1.1);
  box-shadow: 0 6px 25px rgba(100, 150, 255, 0.4);
}

.music-controller.is-playing {
  border-color: rgba(180, 200, 255, 0.6);
}

.music-controller.is-animating {
  animation: pulse 0.3s ease;
}

@keyframes pulse {
  0% { transform: scale(1); }
  50% { transform: scale(1.2); }
  100% { transform: scale(1); }
}

.icon {
  width: 24px;
  height: 24px;
  color: rgba(255, 255, 255, 0.9);
  transition: all 0.3s ease;
}

.music-controller:hover .icon {
  color: #fff;
}

/* 音乐波形 */
.music-bars {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 2px;
  height: 20px;
}

.bar {
  width: 3px;
  height: 100%;
  background: linear-gradient(to top, rgba(150, 180, 255, 0.8), rgba(200, 220, 255, 0.9));
  border-radius: 2px;
  animation: barDance 0.8s ease-in-out infinite;
}

.bar:nth-child(1) { animation-delay: 0s; height: 60%; }
.bar:nth-child(2) { animation-delay: 0.1s; height: 100%; }
.bar:nth-child(3) { animation-delay: 0.2s; height: 80%; }
.bar:nth-child(4) { animation-delay: 0.3s; height: 90%; }
.bar:nth-child(5) { animation-delay: 0.4s; height: 70%; }

@keyframes barDance {
  0%, 100% { transform: scaleY(1); }
  50% { transform: scaleY(0.5); }
}

/* 外圈光晕 */
.glow-ring {
  position: absolute;
  top: -4px;
  left: -4px;
  right: -4px;
  bottom: -4px;
  border-radius: 50%;
  border: 2px solid transparent;
  opacity: 0;
  transition: all 0.3s ease;
}

.music-controller.is-playing .glow-ring {
  border-color: rgba(150, 180, 255, 0.4);
  opacity: 1;
  animation: ringPulse 2s ease-in-out infinite;
}

@keyframes ringPulse {
  0%, 100% { 
    transform: scale(1);
    opacity: 0.6;
  }
  50% { 
    transform: scale(1.15);
    opacity: 0.3;
  }
}

/* 移动端适配 */
@media (max-width: 768px) {
  .music-controller {
    width: 42px;
    height: 42px;
    top: 15px;
    right: 15px;
  }
  
  .icon {
    width: 20px;
    height: 20px;
  }
  
  .music-bars {
    height: 16px;
  }
  
  .bar {
    width: 2px;
  }
}
</style>
