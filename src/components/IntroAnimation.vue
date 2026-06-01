<script setup>
import { ref, onMounted, onUnmounted, watch } from 'vue'

const props = defineProps({
  preloadedAudio: {
    type: Object,
    default: null
  }
})

const emit = defineEmits(['complete', 'music-ready', 'fade-start'])

const isAnimating = ref(true)
const isFadingOut = ref(false)
const showYear1 = ref(true)
const showYear2 = ref(false)
const progress = ref(0)
const bgOffset = ref(0)
const audio = ref(null)

// 监听预加载音频
watch(() => props.preloadedAudio, (newAudio) => {
  if (newAudio && !audio.value) {
    audio.value = newAudio
    audio.value.play().catch(() => {})
    emit('music-ready', audio.value)
  }
})

let animationFrame = null
let startTime = null
let canvas = null
let ctx = null
const duration = 5000

// 星星数据 - 分层（近景、中景、远景）
const stars = ref([])
const generateStars = () => {
  stars.value = []
  // 远景星（50颗）- 移动慢
  for (let i = 0; i < 50; i++) {
    stars.value.push({
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 1.5 + 0.5,
      opacity: Math.random() * 0.6 + 0.4,
      twinkle: Math.random() * 2,
      depth: 0.2, // 移动速度系数
      layer: 'far'
    })
  }
  // 中景星（40颗）- 移动中等
  for (let i = 0; i < 40; i++) {
    stars.value.push({
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 2 + 1,
      opacity: Math.random() * 0.7 + 0.4,
      twinkle: Math.random() * 2,
      depth: 0.5,
      layer: 'mid'
    })
  }
  // 近景星（30颗）- 移动快，有更大拖尾
  for (let i = 0; i < 30; i++) {
    stars.value.push({
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 3 + 1.5,
      opacity: Math.random() * 0.8 + 0.4,
      twinkle: Math.random() * 2,
      depth: 0.9,
      layer: 'near'
    })
  }
}
generateStars()

// 飞机位置（飞行路径：左下角 → 右上角，水平为主）
const planePos = ref({ x: 15, y: 65 })
const planeStartPos = { x: 15, y: 65 }
const planeEndPos = { x: 85, y: 35 }

// 粒子数组
const particles = []
const maxParticles = 120

const animate = (timestamp) => {
  if (!startTime) startTime = timestamp
  const elapsed = timestamp - startTime
  progress.value = Math.min(elapsed / duration, 1)

  // 背景视差移动 - 向左移动为主（飞机向右飞的视觉效果）
  bgOffset.value = progress.value * 200

  // 飞机沿飞行路径移动（从右下飞向左上）
  const t = progress.value
  // 使用缓动函数让飞行更自然
  const easeT = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2
  
  // 基础飞行路径
  const baseX = planeStartPos.x + (planeEndPos.x - planeStartPos.x) * easeT
  const baseY = planeStartPos.y + (planeEndPos.y - planeStartPos.y) * easeT
  
  // 添加S形曲线摆动（更自然的飞行感）
  const swayX = Math.sin(t * Math.PI * 3) * 4
  const swayY = Math.sin(t * Math.PI * 4) * 3
  
  // 轻微的俯仰变化（飞机头部的微小上下）
  const pitch = Math.sin(t * Math.PI * 2) * 2
  
  planePos.value = {
    x: baseX + swayX,
    y: baseY + swayY,
    pitch: pitch
  }

  // 添加粒子（从飞机后方飘出，向左飘散）
  if (progress.value < 0.95 && particles.length < maxParticles) {
    for (let i = 0; i < 5; i++) {
      particles.push({
        // 粒子在飞机后方产生，更聚拢
        x: planePos.value.x - 8 - Math.random() * 8,
        y: planePos.value.y + (Math.random() - 0.5) * 3,
        vx: -(Math.random() * 0.8 + 0.3), // 向左飘
        vy: (Math.random() - 0.5) * 0.3,
        size: Math.random() * 4 + 2,
        life: 1,
        decay: Math.random() * 0.01 + 0.005,
        hue: Math.random() * 25 + 195
      })
    }
  }

  // 更新粒子
  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i]
    p.x += p.vx
    p.y += p.vy
    p.life -= p.decay
    p.size *= 0.97
    if (p.life <= 0 || p.size < 0.5) {
      particles.splice(i, 1)
    }
  }

  // 绘制 Canvas
  drawCanvas()

  // 日期切换
  if (progress.value > 0.5 && showYear1.value) {
    showYear1.value = false
    setTimeout(() => {
      showYear2.value = true
    }, 300)
  }

  // 星星闪烁
  stars.value.forEach(s => {
    s.opacity = 0.3 + Math.abs(Math.sin(timestamp / 1000 + s.twinkle)) * 0.7
  })

  if (progress.value >= 1) {
    // 动画结束时开始淡出，并通知父组件显示相册
    isFadingOut.value = true
    emit('fade-start') // 通知父组件：开始淡出，此时相册可以开始淡入了
    setTimeout(() => {
      isAnimating.value = false
      emit('complete')
    }, 600)
    return
  }

  animationFrame = requestAnimationFrame(animate)
}

// Canvas 绘制函数
const drawCanvas = () => {
  if (!ctx || !canvas) return
  
  ctx.clearRect(0, 0, canvas.width, canvas.height)
  
  const w = canvas.width
  const h = canvas.height

  // === 绘制渐变背景 ===
  const bgGradient = ctx.createLinearGradient(0, h, w, 0)
  bgGradient.addColorStop(0, '#0f0f1a')
  bgGradient.addColorStop(0.4, '#1a1a30')
  bgGradient.addColorStop(1, '#12122a')
  ctx.fillStyle = bgGradient
  ctx.fillRect(0, 0, w, h)

  // === 绘制星空背景（带视差移动 - 向左移动为主） ===
  stars.value.forEach(star => {
    // 根据深度计算移动距离（向左移动）
    const moveX = bgOffset.value * star.depth
    let sx = (star.x / 100 * w - moveX) % w
    if (sx < 0) sx += w
    
    const sy = star.y / 100 * h
    
    // 近景星有拖尾效果（向右拖尾）
    if (star.layer === 'near') {
      // 拖尾向右
      const trailLength = 30 * star.depth
      const gradient = ctx.createLinearGradient(sx - trailLength, sy, sx, sy)
      gradient.addColorStop(0, `rgba(200, 220, 255, 0)`)
      gradient.addColorStop(1, `rgba(200, 220, 255, ${star.opacity * 0.3})`)
      
      ctx.beginPath()
      ctx.moveTo(sx - trailLength, sy)
      ctx.lineTo(sx, sy)
      ctx.strokeStyle = gradient
      ctx.lineWidth = star.size * 0.5
      ctx.lineCap = 'round'
      ctx.stroke()
    }
    
    // 星星本体
    ctx.beginPath()
    ctx.arc(sx, sy, star.size, 0, Math.PI * 2)
    ctx.fillStyle = `rgba(255, 255, 255, ${star.opacity})`
    ctx.fill()
    
    // 发光效果
    if (star.layer !== 'far') {
      const glow = ctx.createRadialGradient(sx, sy, 0, sx, sy, star.size * 3)
      glow.addColorStop(0, `rgba(200, 220, 255, ${star.opacity * 0.5})`)
      glow.addColorStop(1, 'rgba(200, 220, 255, 0)')
      ctx.beginPath()
      ctx.arc(sx, sy, star.size * 3, 0, Math.PI * 2)
      ctx.fillStyle = glow
      ctx.fill()
    }
  })

  // === 添加一些流星效果（向右飞） ===
  if (progress.value > 0.1 && progress.value < 0.9) {
    for (let i = 0; i < 2; i++) {
      const mt = ((Date.now() / 20 + i * 500) % 100) / 100
      if (mt < 0.3) {
        const mx = ((mt * 3.5 * w - bgOffset.value * 0.3) % w + w) % w
        const my = mt * 3.5 * h * 0.4 + h * 0.1
        const trailLen = 80
        
        const meteorGrad = ctx.createLinearGradient(mx + trailLen, my, mx, my)
        meteorGrad.addColorStop(0, 'rgba(255, 255, 255, 0.9)')
        meteorGrad.addColorStop(0.1, 'rgba(200, 220, 255, 0.6)')
        meteorGrad.addColorStop(1, 'rgba(200, 220, 255, 0)')
        
        ctx.beginPath()
        ctx.moveTo(mx + trailLen, my)
        ctx.lineTo(mx, my)
        ctx.strokeStyle = meteorGrad
        ctx.lineWidth = 2
        ctx.lineCap = 'round'
        ctx.stroke()
      }
    }
  }

  // === 绘制粒子拖尾 ===
  particles.forEach(p => {
    const px = (p.x / 100) * w
    const py = (p.y / 100) * h
    
    // 外发光
    const gradient = ctx.createRadialGradient(px, py, 0, px, py, p.size * 4)
    gradient.addColorStop(0, `hsla(${p.hue}, 85%, 95%, ${p.life})`)
    gradient.addColorStop(0.2, `hsla(${p.hue}, 80%, 85%, ${p.life * 0.8})`)
    gradient.addColorStop(0.5, `hsla(${p.hue}, 70%, 70%, ${p.life * 0.4})`)
    gradient.addColorStop(1, `hsla(${p.hue}, 60%, 50%, 0)`)
    
    ctx.beginPath()
    ctx.arc(px, py, p.size * 4, 0, Math.PI * 2)
    ctx.fillStyle = gradient
    ctx.fill()
    
    // 核心亮点
    ctx.beginPath()
    ctx.arc(px, py, p.size * 0.6, 0, Math.PI * 2)
    ctx.fillStyle = `rgba(255, 255, 255, ${p.life})`
    ctx.fill()
  })

  // === 绘制水晶精灵 ===
  drawCrystal(ctx, w, h)
}

// 绘制水晶精灵
const drawCrystal = (ctx, w, h) => {
  const px = (planePos.value.x / 100) * w
  const py = (planePos.value.y / 100) * h
  const scale = Math.min(w, h) / 700
  
  ctx.save()
  ctx.translate(px, py)
  
  const size = 90 * scale
  
  // 水晶旋转动画
  const rotation = Date.now() / 2000
  const float = Math.sin(Date.now() / 400) * size * 0.08
  const pulse = Math.sin(Date.now() / 300) * 0.1 + 1
  
  // === 外层光晕 ===
  const outerGlow = ctx.createRadialGradient(0, float, 0, 0, float, size * 2)
  outerGlow.addColorStop(0, 'rgba(180, 160, 255, 0.3)')
  outerGlow.addColorStop(0.5, 'rgba(150, 180, 255, 0.15)')
  outerGlow.addColorStop(1, 'rgba(100, 150, 255, 0)')
  ctx.beginPath()
  ctx.arc(0, float, size * 2, 0, Math.PI * 2)
  ctx.fillStyle = outerGlow
  ctx.fill()

  // === 水晶主体（六边形） ===
  ctx.save()
  ctx.rotate(rotation)
  ctx.scale(pulse, pulse)

  // 水晶外层边框
  ctx.beginPath()
  for (let i = 0; i < 6; i++) {
    const angle = (i * Math.PI / 3) - Math.PI / 2
    const x = Math.cos(angle) * size * 0.9
    const y = Math.sin(angle) * size * 0.9 + float
    if (i === 0) ctx.moveTo(x, y)
    else ctx.lineTo(x, y)
  }
  ctx.closePath()
  
  const crystalGrad = ctx.createRadialGradient(0, float - size * 0.3, 0, 0, float, size * 1.2)
  crystalGrad.addColorStop(0, 'rgba(255, 255, 255, 0.95)')
  crystalGrad.addColorStop(0.3, 'rgba(220, 240, 255, 0.8)')
  crystalGrad.addColorStop(0.6, 'rgba(180, 200, 255, 0.6)')
  crystalGrad.addColorStop(1, 'rgba(150, 180, 255, 0.4)')
  ctx.fillStyle = crystalGrad
  ctx.shadowColor = 'rgba(180, 200, 255, 0.9)'
  ctx.shadowBlur = 40 * scale
  ctx.fill()
  
  // 水晶边缘
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)'
  ctx.lineWidth = 2 * scale
  ctx.stroke()

  // === 内部折射线 ===
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)'
  ctx.lineWidth = 1 * scale
  
  // 主折射线
  ctx.beginPath()
  ctx.moveTo(0, float - size * 0.85)
  ctx.lineTo(0, float + size * 0.85)
  ctx.stroke()
  
  // 斜折射线
  ctx.beginPath()
  ctx.moveTo(-size * 0.74, float - size * 0.43)
  ctx.lineTo(size * 0.74, float + size * 0.43)
  ctx.stroke()
  
  ctx.beginPath()
  ctx.moveTo(size * 0.74, float - size * 0.43)
  ctx.lineTo(-size * 0.74, float + size * 0.43)
  ctx.stroke()

  // === 高光点 ===
  ctx.beginPath()
  ctx.arc(-size * 0.2, float - size * 0.3, size * 0.15, 0, Math.PI * 2)
  const highlightGrad = ctx.createRadialGradient(-size * 0.2, float - size * 0.3, 0, -size * 0.2, float - size * 0.3, size * 0.2)
  highlightGrad.addColorStop(0, 'rgba(255, 255, 255, 1)')
  highlightGrad.addColorStop(0.5, 'rgba(255, 255, 255, 0.6)')
  highlightGrad.addColorStop(1, 'rgba(255, 255, 255, 0)')
  ctx.fillStyle = highlightGrad
  ctx.fill()

  // 次高光
  ctx.beginPath()
  ctx.arc(size * 0.25, float + size * 0.15, size * 0.08, 0, Math.PI * 2)
  ctx.fillStyle = 'rgba(255, 255, 255, 0.7)'
  ctx.fill()

  ctx.restore()

  // === 环绕的小水晶碎片 ===
  ctx.shadowBlur = 0
  const shards = 6
  for (let i = 0; i < shards; i++) {
    const angle = rotation * 1.5 + (i * Math.PI * 2 / shards)
    const orbitRadius = size * 1.4
    const sx = Math.cos(angle) * orbitRadius
    const sy = Math.sin(angle) * orbitRadius * 0.6 + float
    
    ctx.save()
    ctx.translate(sx, sy)
    ctx.rotate(angle + Math.PI / 4)
    
    // 小水晶菱形
    ctx.beginPath()
    ctx.moveTo(0, -size * 0.12)
    ctx.lineTo(size * 0.08, 0)
    ctx.lineTo(0, size * 0.12)
    ctx.lineTo(-size * 0.08, 0)
    ctx.closePath()
    
    const shardGrad = ctx.createRadialGradient(0, 0, 0, 0, 0, size * 0.15)
    shardGrad.addColorStop(0, 'rgba(255, 255, 255, 0.9)')
    shardGrad.addColorStop(0.5, 'rgba(200, 220, 255, 0.6)')
    shardGrad.addColorStop(1, 'rgba(180, 200, 255, 0.2)')
    ctx.fillStyle = shardGrad
    ctx.shadowColor = 'rgba(200, 220, 255, 0.8)'
    ctx.shadowBlur = 10 * scale
    ctx.fill()
    
    ctx.restore()
  }

  // === 底部光芒 ===
  ctx.globalCompositeOperation = 'lighter'
  for (let i = 0; i < 8; i++) {
    const rayAngle = (i * Math.PI / 4) + rotation * 0.5
    const rayLength = size * (0.8 + Math.sin(Date.now() / 200 + i) * 0.3)
    
    ctx.beginPath()
    ctx.moveTo(0, float)
    ctx.lineTo(Math.cos(rayAngle) * rayLength, Math.sin(rayAngle) * rayLength + float)
    ctx.strokeStyle = `rgba(180, 200, 255, ${0.3 + Math.sin(Date.now() / 150 + i) * 0.2})`
    ctx.lineWidth = 2 * scale
    ctx.lineCap = 'round'
    ctx.stroke()
  }
  ctx.globalCompositeOperation = 'source-over'

  ctx.restore()
}

onMounted(() => {
  canvas = document.getElementById('introCanvas')
  if (canvas) {
    ctx = canvas.getContext('2d')
    canvas.width = window.innerWidth
    canvas.height = window.innerHeight
    
    window.addEventListener('resize', () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
      generateStars()
    })
  }
  
  // 初始化音频（使用预加载的音频）
  initAudio()
  
  animationFrame = requestAnimationFrame(animate)
})

// 初始化音频（使用预加载的音频）
const initAudio = () => {
  // 只使用父组件传入的预加载音频，不自己创建
  if (props.preloadedAudio) {
    audio.value = props.preloadedAudio
    // 尝试自动播放
    audio.value.play().catch(() => {})
    emit('music-ready', audio.value)
  }
}

// 接收预加载的音频
const setPreloadedAudio = (preloadedAudio) => {
  initAudio(preloadedAudio)
}

// 跳过动画
const skipAnimation = () => {
  if (!isAnimating.value) return
  progress.value = 1
}

// 播放音频（带淡入效果）
const playAudio = (fadeDuration = 2000) => {
  if (!audio.value) return
  
  audio.value.play().then(() => {
    // 淡入效果
    const startTime = Date.now()
    const fade = () => {
      const elapsed = Date.now() - startTime
      const progress = Math.min(elapsed / fadeDuration, 1)
      // 使用缓动函数
      const eased = 1 - Math.pow(1 - progress, 3)
      audio.value.volume = eased * 0.6 // 0.6 是目标音量
      
      if (progress < 1) {
        requestAnimationFrame(fade)
      }
    }
    requestAnimationFrame(fade)
  }).catch(e => {
    console.warn('音频播放失败:', e)
  })
}

// 暂停音频（带淡出效果）
const pauseAudio = (fadeDuration = 1500) => {
  if (!audio.value) return
  
  const startTime = Date.now()
  const startVolume = audio.value.volume
  
  const fade = () => {
    const elapsed = Date.now() - startTime
    const progress = Math.min(elapsed / fadeDuration, 1)
    // 使用缓动函数
    const eased = Math.pow(1 - progress, 2)
    audio.value.volume = startVolume * eased
    
    if (progress < 1) {
      requestAnimationFrame(fade)
    } else {
      audio.value.pause()
    }
  }
  requestAnimationFrame(fade)
}

// 暴露给父组件的方法
defineExpose({
  playAudio,
  pauseAudio,
  audio,
  setPreloadedAudio
})

onUnmounted(() => {
  if (animationFrame) {
    cancelAnimationFrame(animationFrame)
  }
  // 不销毁 audio，让父组件继续控制
})
</script>

<template>
  <div class="intro-container" :class="{ 'fade-out': isFadingOut }" v-if="isAnimating">
    <!-- Canvas: 星空背景 + 纸飞机 + 粒子拖尾 -->
    <canvas id="introCanvas" class="main-canvas" />

    <!-- 漂浮光斑 -->
    <div class="floating-orbs">
      <div class="orb orb-1"></div>
      <div class="orb orb-2"></div>
      <div class="orb orb-3"></div>
      <div class="orb orb-4"></div>
      <div class="orb orb-5"></div>
      <div class="orb orb-6"></div>
    </div>

    <!-- 日期显示 -->
    <div class="year-display">
      <transition name="year-fade" mode="out-in">
        <div class="year-text" :key="showYear1 ? 'year1' : 'year2'">
          <span class="year">{{ showYear1 ? '2016' : '2026' }}</span>
          <span class="date">06.20</span>
          <div class="year-glow" />
        </div>
      </transition>
    </div>

    <!-- 标题文字 -->
    <div class="intro-title" :class="{ visible: progress > 0.3 }">
      <h1>十年时光</h1>
      <p>2016 - 2026</p>
    </div>

    <!-- 底部提示 -->
    <div class="intro-hint" :class="{ visible: progress > 0.7 }">
      <span>即将开始播放</span>
      <div class="loading-dots">
        <span></span>
        <span></span>
        <span></span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.intro-container {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: linear-gradient(135deg, #0f0f1a 0%, #1a1a30 40%, #12122a 100%);
  z-index: 1000;
  overflow: hidden;
  transition: opacity 0.6s ease;
}

.intro-container.fade-out {
  opacity: 0;
}

.main-canvas {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 10;
}

.year-display {
  position: absolute;
  top: 38%;
  left: 50%;
  transform: translate(-50%, -50%);
  text-align: center;
  z-index: 20;
}

.year-text {
  position: relative;
}

.year {
  display: block;
  font-size: 5rem;
  font-weight: 700;
  color: #fff;
  text-shadow:
    0 0 20px rgba(100, 180, 255, 1),
    0 0 40px rgba(100, 180, 255, 0.6),
    2px 2px 4px rgba(0, 0, 0, 0.5);
  letter-spacing: 0.3em;
  animation: yearPulse 2s ease-in-out infinite;
}

.date {
  display: block;
  font-size: 2rem;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.95);
  margin-top: 0.5rem;
  letter-spacing: 0.2em;
  text-shadow: 0 0 15px rgba(100, 180, 255, 0.6), 1px 1px 3px rgba(0, 0, 0, 0.5);
}

@keyframes yearPulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.85; }
}

.year-glow {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 400px;
  height: 180px;
  background: radial-gradient(ellipse, rgba(100, 180, 255, 0.15) 0%, transparent 70%);
  pointer-events: none;
}

.year-fade-enter-active,
.year-fade-leave-active {
  transition: all 0.8s ease;
}

.year-fade-enter-from {
  opacity: 0;
  transform: scale(1.5);
  filter: blur(10px);
}

.year-fade-leave-to {
  opacity: 0;
  transform: scale(0.8);
  filter: blur(5px);
}

.intro-title {
  position: absolute;
  bottom: 32%;
  left: 50%;
  transform: translateX(-50%);
  text-align: center;
  opacity: 0;
  transition: opacity 1s ease;
  z-index: 25;
}

.intro-title.visible {
  opacity: 1;
}

/* === 漂浮光斑 === */
.floating-orbs {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 15;
}

.orb {
  position: absolute;
  border-radius: 50%;
  filter: blur(30px);
  opacity: 0.6;
  animation: orbFloat 10s ease-in-out infinite;
}

.orb-1 {
  width: 350px;
  height: 350px;
  background: radial-gradient(circle, rgba(167, 139, 250, 0.8) 0%, transparent 70%);
  top: -120px;
  left: -80px;
  animation-delay: 0s;
}

.orb-2 {
  width: 300px;
  height: 300px;
  background: radial-gradient(circle, rgba(129, 140, 248, 0.75) 0%, transparent 70%);
  bottom: -100px;
  right: -80px;
  animation-delay: -2s;
}

.orb-3 {
  width: 280px;
  height: 280px;
  background: radial-gradient(circle, rgba(192, 132, 252, 0.7) 0%, transparent 70%);
  top: 15%;
  right: 5%;
  animation-delay: -4s;
}

.orb-4 {
  width: 250px;
  height: 250px;
  background: radial-gradient(circle, rgba(147, 197, 253, 0.75) 0%, transparent 70%);
  bottom: 25%;
  left: 0%;
  animation-delay: -6s;
}

.orb-5 {
  width: 200px;
  height: 200px;
  background: radial-gradient(circle, rgba(196, 181, 253, 0.7) 0%, transparent 70%);
  top: 45%;
  left: 45%;
  animation-delay: -3s;
}

.orb-6 {
  width: 180px;
  height: 180px;
  background: radial-gradient(circle, rgba(165, 180, 252, 0.75) 0%, transparent 70%);
  top: 5%;
  left: 25%;
  animation-delay: -5s;
}

@keyframes orbFloat {
  0%, 100% {
    transform: translate(0, 0) scale(1);
    opacity: 0.6;
  }
  25% {
    transform: translate(30px, -40px) scale(1.15);
    opacity: 0.75;
  }
  50% {
    transform: translate(-15px, 30px) scale(0.9);
    opacity: 0.5;
  }
  75% {
    transform: translate(20px, 15px) scale(1.1);
    opacity: 0.7;
  }
}

.intro-title h1 {
  font-size: 3rem;
  font-weight: 700;
  color: #fff;
  margin: 0;
  letter-spacing: 0.5em;
  text-shadow: 0 0 20px rgba(100, 150, 255, 0.8), 0 0 40px rgba(100, 150, 255, 0.5), 2px 2px 4px rgba(0, 0, 0, 0.5);
}

.intro-title p {
  font-size: 1.2rem;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.9);
  margin-top: 1rem;
  letter-spacing: 0.3em;
  text-shadow: 0 0 15px rgba(100, 150, 255, 0.6), 1px 1px 3px rgba(0, 0, 0, 0.5);
}

.intro-hint {
  position: absolute;
  bottom: 15%;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  align-items: center;
  gap: 10px;
  opacity: 0;
  transition: opacity 0.5s ease;
  z-index: 25;
}

.intro-hint.visible {
  opacity: 1;
}

.intro-hint span {
  font-size: 0.9rem;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.9);
  letter-spacing: 0.1em;
  text-shadow: 0 0 10px rgba(100, 150, 255, 0.5), 1px 1px 2px rgba(0, 0, 0, 0.5);
}

.loading-dots {
  display: flex;
  gap: 4px;
}

.loading-dots span {
  width: 6px;
  height: 6px;
  background: rgba(255, 255, 255, 0.6);
  border-radius: 50%;
  animation: dotBounce 1.4s ease-in-out infinite;
}

.loading-dots span:nth-child(2) {
  animation-delay: 0.2s;
}

.loading-dots span:nth-child(3) {
  animation-delay: 0.4s;
}

@keyframes dotBounce {
  0%, 80%, 100% { transform: scale(1); opacity: 0.5; }
  40% { transform: scale(1.3); opacity: 1; }
}

@media (max-width: 768px) {
  .year {
    font-size: 3rem;
  }
  .date {
    font-size: 1.5rem;
  }
  .intro-title h1 {
    font-size: 2rem;
  }
}
</style>
