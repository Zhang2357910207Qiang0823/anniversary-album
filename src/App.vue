<script setup>
import { ref, computed, onMounted, onUnmounted, watch, nextTick } from 'vue'
import IntroAnimation from './components/IntroAnimation.vue'
import MusicController from './components/MusicController.vue'

// 欢迎页面状态
const showWelcome = ref(true)

// 开场动画状态
const showIntro = ref(false)
const showAlbum = ref(false)
const introRef = ref(null)

// 音乐控制
const isMusicPlaying = ref(true)  // 默认开启音乐
const audio = ref(null)
const isAudioLoaded = ref(false)

// 在欢迎页面时预加载音频
const preloadAudio = () => {
  if (!audio.value) {
    audio.value = new Audio()
    // 添加时间戳避免缓存问题
    const cacheBust = '?t=' + Date.now()
    audio.value.src = import.meta.env.BASE_URL + 'music/background.mp3' + cacheBust
    audio.value.loop = true
    audio.value.volume = 0
    audio.value.preload = 'auto'
    // 监听加载完成
    audio.value.addEventListener('canplay', () => {
      isAudioLoaded.value = true
    })
  }
}

// 开始按钮点击
const startExperience = () => {
  if (audio.value && isAudioLoaded.value) {
    audio.value.play().catch(() => {})
  }
  showWelcome.value = false
  showIntro.value = true
}

onMounted(() => {
  // 页面加载时就开始预加载音频
  preloadAudio()
})

// 生成星星样式
const getStarStyle = (i) => {
  const size = Math.random() * 2 + 1.5
  const x = Math.random() * 100
  const y = Math.random() * 100
  const delay = Math.random() * 4
  const duration = Math.random() * 2 + 2
  return {
    width: `${size}px`,
    height: `${size}px`,
    left: `${x}%`,
    top: `${y}%`,
    animationDelay: `${delay}s`,
    animationDuration: `${duration}s`
  }
}

// 开场动画开始淡出 - 立即显示相册，实现同步过渡
const onFadeStart = () => {
  showAlbum.value = true
}

// 开场动画完成 - 关闭动画
const onIntroComplete = () => {
  showIntro.value = false
  // 确保音乐继续播放（直接播放，无淡入）
  if (audio.value && isMusicPlaying.value && audio.value.paused) {
    audio.value.volume = 0.6  // 设置音量
    audio.value.play().catch(e => console.warn('音频播放失败:', e))
  }
  // 进入相册界面后开始自动播放
  startAutoplay()
}

// 音乐准备就绪（不覆盖已有的 audio，只更新音量）
const onMusicReady = (audioElement) => {
  // 已经有 audio 了（从 startExperience 创建的），只需要更新音量
  if (audio.value && audioElement) {
    audio.value.volume = audioElement.volume || 0.6
  }
}

// 音乐控制（仅控制音乐，不影响图片播放）
let fadeIntervalId = null
const toggleMusic = () => {
  if (isMusicPlaying.value) {
    // 暂停音乐 - 使用淡出效果
    if (audio.value) {
      fadeOutPause(audio.value, 1000)
    }
  } else {
    // 播放音乐 - 使用淡入效果
    if (audio.value) {
      fadeInPlay(audio.value, 1000)
    }
  }
  isMusicPlaying.value = !isMusicPlaying.value
}

// 淡入播放 - 使用 setInterval 减少性能消耗
const fadeInPlay = (audioEl, duration = 1000) => {
  audioEl.volume = 0
  audioEl.play().then(() => {
    const startTime = Date.now()
    const targetVolume = 0.6
    fadeIntervalId && clearInterval(fadeIntervalId)
    fadeIntervalId = setInterval(() => {
      const elapsed = Date.now() - startTime
      const progress = Math.min(elapsed / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      audioEl.volume = eased * targetVolume
      if (progress >= 1) {
        clearInterval(fadeIntervalId)
        fadeIntervalId = null
      }
    }, 50)
  }).catch(e => {
    console.warn('音频播放失败:', e)
  })
}

// 淡出暂停 - 使用 setInterval 减少性能消耗
const fadeOutPause = (audioEl, duration = 1000) => {
  const startVolume = audioEl.volume
  const startTime = Date.now()
  fadeIntervalId && clearInterval(fadeIntervalId)
  fadeIntervalId = setInterval(() => {
    const elapsed = Date.now() - startTime
    const progress = Math.min(elapsed / duration, 1)
    const eased = Math.pow(1 - progress, 2)
    audioEl.volume = startVolume * eased
    if (progress >= 1) {
      clearInterval(fadeIntervalId)
      fadeIntervalId = null
      audioEl.pause()
    }
  }, 50)
}

// 照片数据 - 按年份分类
const photos = ref([
  // 2026年 - 3张照片
  { year: 2026, url: new URL('./assets/images/2026/1.jpg', import.meta.url).href, title: '2026 时光印记 1' },
  { year: 2026, url: new URL('./assets/images/2026/2.jpg', import.meta.url).href, title: '2026 时光印记 2' },
  { year: 2026, url: new URL('./assets/images/2026/3.jpg', import.meta.url).href, title: '2026 时光印记 3' },

  // 2025年 - 20张照片
  { year: 2025, url: new URL('./assets/images/2025/1.jpg', import.meta.url).href, title: '2025 精彩瞬间 1' },
  { year: 2025, url: new URL('./assets/images/2025/2.jpg', import.meta.url).href, title: '2025 精彩瞬间 2' },
  { year: 2025, url: new URL('./assets/images/2025/3.jpg', import.meta.url).href, title: '2025 精彩瞬间 3' },
  { year: 2025, url: new URL('./assets/images/2025/4.jpg', import.meta.url).href, title: '2025 精彩瞬间 4' },
  { year: 2025, url: new URL('./assets/images/2025/5.jpg', import.meta.url).href, title: '2025 精彩瞬间 5' },
  { year: 2025, url: new URL('./assets/images/2025/6.jpg', import.meta.url).href, title: '2025 精彩瞬间 6' },
  { year: 2025, url: new URL('./assets/images/2025/7.jpg', import.meta.url).href, title: '2025 精彩瞬间 7' },
  { year: 2025, url: new URL('./assets/images/2025/8.jpg', import.meta.url).href, title: '2025 精彩瞬间 8' },
  { year: 2025, url: new URL('./assets/images/2025/9.jpg', import.meta.url).href, title: '2025 精彩瞬间 9' },
  { year: 2025, url: new URL('./assets/images/2025/10.jpg', import.meta.url).href, title: '2025 精彩瞬间 10' },
  { year: 2025, url: new URL('./assets/images/2025/11.jpg', import.meta.url).href, title: '2025 精彩瞬间 11' },
  { year: 2025, url: new URL('./assets/images/2025/12.jpg', import.meta.url).href, title: '2025 精彩瞬间 12' },
  { year: 2025, url: new URL('./assets/images/2025/13.jpg', import.meta.url).href, title: '2025 精彩瞬间 13' },
  { year: 2025, url: new URL('./assets/images/2025/14.jpg', import.meta.url).href, title: '2025 精彩瞬间 14' },
  { year: 2025, url: new URL('./assets/images/2025/15.jpg', import.meta.url).href, title: '2025 精彩瞬间 15' },
  { year: 2025, url: new URL('./assets/images/2025/16.jpg', import.meta.url).href, title: '2025 精彩瞬间 16' },
  { year: 2025, url: new URL('./assets/images/2025/17.jpg', import.meta.url).href, title: '2025 精彩瞬间 17' },
  { year: 2025, url: new URL('./assets/images/2025/18.jpg', import.meta.url).href, title: '2025 精彩瞬间 18' },
  { year: 2025, url: new URL('./assets/images/2025/19.jpg', import.meta.url).href, title: '2025 精彩瞬间 19' },
  { year: 2025, url: new URL('./assets/images/2025/20.jpg', import.meta.url).href, title: '2025 精彩瞬间 20' },

  // 2024年 - 3张照片
  { year: 2024, url: new URL('./assets/images/2024/1.jpg', import.meta.url).href, title: '2024 美好回忆 1' },
  { year: 2024, url: new URL('./assets/images/2024/2.jpg', import.meta.url).href, title: '2024 美好回忆 2' },
  { year: 2024, url: new URL('./assets/images/2024/3.jpg', import.meta.url).href, title: '2024 美好回忆 3' },

  // 2023年 - 3张照片
  { year: 2023, url: new URL('./assets/images/2023/1.jpg', import.meta.url).href, title: '2023 生活点滴 1' },
  { year: 2023, url: new URL('./assets/images/2023/2.jpg', import.meta.url).href, title: '2023 生活点滴 2' },
  { year: 2023, url: new URL('./assets/images/2023/3.jpg', import.meta.url).href, title: '2023 生活点滴 3' },

  // 2022年 - 3张照片
  { year: 2022, url: new URL('./assets/images/2022/1.jpg', import.meta.url).href, title: '2022 难忘时刻 1' },
  { year: 2022, url: new URL('./assets/images/2022/2.jpg', import.meta.url).href, title: '2022 难忘时刻 2' },
  { year: 2022, url: new URL('./assets/images/2022/3.jpg', import.meta.url).href, title: '2022 难忘时刻 3' },

  // 2021年 - 3张照片
  { year: 2021, url: new URL('./assets/images/2021/1.jpg', import.meta.url).href, title: '2021 珍藏记忆 1' },
  { year: 2021, url: new URL('./assets/images/2021/2.jpg', import.meta.url).href, title: '2021 珍藏记忆 2' },
  { year: 2021, url: new URL('./assets/images/2021/3.jpg', import.meta.url).href, title: '2021 珍藏记忆 3' },

  // 2020年 - 3张照片
  { year: 2020, url: new URL('./assets/images/2020/1.jpg', import.meta.url).href, title: '2020 特别时光 1' },
  { year: 2020, url: new URL('./assets/images/2020/2.jpg', import.meta.url).href, title: '2020 特别时光 2' },
  { year: 2020, url: new URL('./assets/images/2020/3.jpg', import.meta.url).href, title: '2020 特别时光 3' },

  // 2019年 - 3张照片
  { year: 2019, url: new URL('./assets/images/2019/1.jpg', import.meta.url).href, title: '2019 精彩瞬间 1' },
  { year: 2019, url: new URL('./assets/images/2019/2.jpg', import.meta.url).href, title: '2019 精彩瞬间 2' },
  { year: 2019, url: new URL('./assets/images/2019/3.jpg', import.meta.url).href, title: '2019 精彩瞬间 3' },

  // 2018年 - 3张照片
  { year: 2018, url: new URL('./assets/images/2018/1.jpg', import.meta.url).href, title: '2018 温馨回忆 1' },
  { year: 2018, url: new URL('./assets/images/2018/2.jpg', import.meta.url).href, title: '2018 温馨回忆 2' },
  { year: 2018, url: new URL('./assets/images/2018/3.jpg', import.meta.url).href, title: '2018 温馨回忆 3' },

  // 2017年 - 3张照片
  { year: 2017, url: new URL('./assets/images/2017/1.jpg', import.meta.url).href, title: '2017 甜蜜时光 1' },
  { year: 2017, url: new URL('./assets/images/2017/2.jpg', import.meta.url).href, title: '2017 甜蜜时光 2' },
  { year: 2017, url: new URL('./assets/images/2017/3.jpg', import.meta.url).href, title: '2017 甜蜜时光 3' },

  // 2016年 - 3张照片
  { year: 2016, url: new URL('./assets/images/2016/1.jpg', import.meta.url).href, title: '2016 起点记忆 1' },
  { year: 2016, url: new URL('./assets/images/2016/2.jpg', import.meta.url).href, title: '2016 起点记忆 2' },
  { year: 2016, url: new URL('./assets/images/2016/3.jpg', import.meta.url).href, title: '2016 起点记忆 3' },
])

// 按年份分组的照片
const photosByYear = computed(() => {
  const grouped = {}
  photos.value.forEach(photo => {
    if (!grouped[photo.year]) {
      grouped[photo.year] = []
    }
    grouped[photo.year].push(photo)
  })
  return grouped
})

const years = computed(() => Object.keys(photosByYear.value).sort((a, b) => b - a))

// 当前显示的年份索引
const currentYearIndex = ref(0)
const currentYear = computed(() => years.value[currentYearIndex.value])

// 当前年份内的照片索引
const currentPhotoIndex = ref(0)
const currentPhoto = computed(() => {
  const yearPhotos = photosByYear.value[currentYear.value]
  return yearPhotos ? yearPhotos[currentPhotoIndex.value] : null
})

// 缩略图滚动容器 ref
const thumbnailsRef = ref(null)
const photoFooterRef = ref(null)

// 自动播放
let autoplayTimer = null
const isPlaying = ref(true)
const autoplayInterval = 4000

const startAutoplay = () => {
  stopAutoplay()
  autoplayTimer = setInterval(() => {
    nextPhoto()
  }, autoplayInterval)
}

const stopAutoplay = () => {
  if (autoplayTimer) {
    clearInterval(autoplayTimer)
    autoplayTimer = null
  }
}

const nextPhoto = () => {
  const yearPhotos = photosByYear.value[currentYear.value]
  if (currentPhotoIndex.value < yearPhotos.length - 1) {
    currentPhotoIndex.value++
  } else if (currentYearIndex.value < years.value.length - 1) {
    currentYearIndex.value++
    currentPhotoIndex.value = 0
  } else {
    currentYearIndex.value = 0
    currentPhotoIndex.value = 0
  }
}

const prevPhoto = () => {
  if (currentPhotoIndex.value > 0) {
    currentPhotoIndex.value--
  } else if (currentYearIndex.value > 0) {
    currentYearIndex.value--
    const yearPhotos = photosByYear.value[currentYear.value]
    currentPhotoIndex.value = yearPhotos.length - 1
  } else {
    currentYearIndex.value = years.value.length - 1
    const yearPhotos = photosByYear.value[currentYear.value]
    currentPhotoIndex.value = yearPhotos.length - 1
  }
}

const togglePlay = () => {
  // 仅控制图片播放/暂停，不影响音乐
  isPlaying.value = !isPlaying.value
  if (isPlaying.value) {
    startAutoplay()
  } else {
    stopAutoplay()
  }
}

const selectYear = (index) => {
  currentYearIndex.value = index
  currentPhotoIndex.value = 0
}

// 缩略图自动滚动到当前选中项
const scrollToActiveThumb = () => {
  nextTick(() => {
    if (thumbnailsRef.value) {
      const container = thumbnailsRef.value
      const activeThumb = container.querySelector('.thumb.active')
      if (activeThumb) {
        const containerWidth = container.clientWidth
        const thumbLeft = activeThumb.offsetLeft
        const thumbWidth = activeThumb.offsetWidth
        const scrollTo = thumbLeft - (containerWidth / 2) + (thumbWidth / 2)
        container.scrollTo({
          left: scrollTo,
          behavior: 'smooth'
        })
      }
    }
  })
}

// 监听照片切换，自动滚动缩略图
watch(currentPhotoIndex, () => {
  scrollToActiveThumb()
})

// 监听年份切换，重置照片索引并滚动缩略图
watch(currentYearIndex, () => {
  // 使用 setTimeout 确保 DOM 更新完成
  setTimeout(() => {
    scrollToActiveThumb()
  }, 50)
})

// 触摸/滑动支持 - 只在主图区域响应
let touchStartX = 0
let touchEndX = 0
let touchStartY = 0
let isScrollingThumb = false

const handleTouchStart = (e) => {
  touchStartX = e.changedTouches[0].screenX
  touchStartY = e.changedTouches[0].screenY

  // 检测是否在底部控制栏区域滑动
  if (photoFooterRef.value) {
    const footerRect = photoFooterRef.value.getBoundingClientRect()
    if (touchStartY >= footerRect.top) {
      isScrollingThumb = true
      return
    }
  }
  isScrollingThumb = false
}

const handleTouchEnd = (e) => {
  // 如果是在底部区域滑动，不触发主图切换
  if (isScrollingThumb) {
    isScrollingThumb = false
    return
  }

  touchEndX = e.changedTouches[0].screenX
  const touchEndY = e.changedTouches[0].screenY

  // 计算水平和垂直方向的移动距离
  const diffX = touchStartX - touchEndX
  const diffY = touchStartY - touchEndY

  // 只有水平滑动距离大于垂直距离，且水平距离超过阈值时才切换图片
  if (Math.abs(diffX) > Math.abs(diffY) && Math.abs(diffX) > 50) {
    if (diffX > 0) {
      nextPhoto()
    } else {
      prevPhoto()
    }
  }
}

// 键盘控制
const handleKeydown = (e) => {
  if (e.key === 'ArrowRight' || e.key === ' ') {
    nextPhoto()
  } else if (e.key === 'ArrowLeft') {
    prevPhoto()
  } else if (e.key === 'p' || e.key === 'P') {
    togglePlay()
  }
}

// 是否显示侧边箭头
const showArrows = ref(false)

onMounted(() => {
  window.addEventListener('keydown', handleKeydown)
})

onUnmounted(() => {
  stopAutoplay()
  window.removeEventListener('keydown', handleKeydown)
})
</script>

<template>
  <!-- 欢迎页面 -->
  <div v-if="showWelcome" class="welcome-container">
    <!-- 漂浮光点 -->
    <div class="floating-orbs">
      <div class="orb orb-1"></div>
      <div class="orb orb-2"></div>
      <div class="orb orb-3"></div>
      <div class="orb orb-4"></div>
      <div class="orb orb-5"></div>
      <div class="orb orb-6"></div>
    </div>
    <!-- 星星粒子 -->
    <div class="stars">
      <div v-for="i in 100" :key="i" class="star" :style="getStarStyle(i)"></div>
    </div>
    <div class="welcome-content">
      <!-- 水晶六芒星图标 -->
      <div class="welcome-icon" @click="startExperience">
        <svg viewBox="0 0 100 100" fill="none">
          <circle cx="50" cy="50" r="45" stroke="url(#starGrad)" stroke-width="1" opacity="0.4"/>
          <circle cx="50" cy="50" r="35" stroke="url(#starGrad)" stroke-width="0.8" opacity="0.5"/>
          <circle cx="50" cy="50" r="25" stroke="url(#starGrad)" stroke-width="0.5" opacity="0.6"/>
          <path d="M50 12 L53 42 L83 50 L53 58 L50 88 L47 58 L17 50 L47 42 Z" fill="url(#starGrad)" opacity="0.85"/>
          <circle cx="50" cy="50" r="5" fill="#fff" opacity="0.95"/>
          <defs>
            <linearGradient id="starGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stop-color="#c4b5fd"/>
              <stop offset="100%" stop-color="#93c5fd"/>
            </linearGradient>
          </defs>
        </svg>
      </div>
      <button class="start-button" @click="startExperience">
        <span>踏入星河</span>
      </button>
    </div>
  </div>

  <!-- 主体内容容器（开场动画 + 相册） -->
  <div class="main-container">
    <!-- 相册主体（始终渲染，用 opacity 控制） -->
    <div class="album-container" :class="{ 'album-visible': showAlbum }">
      <!-- 主显示区域 -->
      <div
      class="photo-display"
      @touchstart="handleTouchStart"
      @touchend="handleTouchEnd"
      @mouseenter="showArrows = true"
      @mouseleave="showArrows = false"
    >
      <img
        v-if="currentPhoto"
        :key="currentPhoto.url"
        :src="currentPhoto.url"
        :alt="currentPhoto.title"
        class="photo"
      />

      <!-- 顶部标题信息 -->
      <div class="photo-header">
        <div class="header-left">
          <h2>{{ currentPhoto?.title }}</h2>
          <span class="photo-counter">{{ currentYear }} · {{ currentPhotoIndex + 1 }}/{{ photosByYear[currentYear]?.length }}</span>
        </div>
        <!-- 右侧按钮组：音乐控制 + 图片播放控制 -->
        <div class="header-controls">
          <!-- 音乐播放/暂停按钮 -->
          <button @click="toggleMusic" class="music-toggle" :title="isMusicPlaying ? '关闭音乐' : '开启音乐'">
            <svg v-show="isMusicPlaying" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/>
            </svg>
            <svg v-show="!isMusicPlaying" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/>
              <line x1="4" y1="4" x2="20" y2="20" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
            </svg>
          </button>
          <!-- 图片播放/暂停按钮 -->
          <button @click="togglePlay" class="play-toggle" :title="isPlaying ? '暂停轮播' : '播放轮播'">
            <svg v-show="isPlaying" viewBox="0 0 24 24" fill="currentColor"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>
            <svg v-show="!isPlaying" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
          </button>
        </div>
      </div>

      <!-- 左侧箭头 -->
      <button
        class="side-arrow left"
        @click="prevPhoto"
        :class="{ visible: showArrows }"
      >
        <svg viewBox="0 0 24 24"><path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z" fill="currentColor"/></svg>
      </button>

      <!-- 右侧箭头 -->
      <button
        class="side-arrow right"
        @click="nextPhoto"
        :class="{ visible: showArrows }"
      >
        <svg viewBox="0 0 24 24"><path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z" fill="currentColor"/></svg>
      </button>

      <!-- 底部控制栏 -->
      <div class="photo-footer" ref="photoFooterRef">
        <!-- 年份导航 -->
        <div class="year-nav-wrapper">
          <div class="year-nav">
            <button
              v-for="(year, index) in years"
              :key="year"
              :class="['year-btn', { active: index === currentYearIndex }]"
              @click="selectYear(index)"
            >
              {{ year }}
            </button>
          </div>
        </div>

        <!-- 缩略图 -->
        <div class="thumbnails" ref="thumbnailsRef">
          <img
            v-for="(photo, index) in photosByYear[currentYear]"
            :key="`${currentYear}-${index}`"
            :src="photo.url"
            :class="['thumb', { active: index === currentPhotoIndex }]"
            @click="currentPhotoIndex = index"
          />
        </div>
      </div>
    </div>
  </div>
  </div>

  <!-- 开场动画（叠加在相册上方） -->
  <IntroAnimation
    v-if="showIntro"
    :preloaded-audio="audio"
    @complete="onIntroComplete"
    @music-ready="onMusicReady"
    @fade-start="onFadeStart"
    ref="introRef"
  />
</template>

<style scoped>
/* 主容器 */
.main-container {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 100;
}

.album-container {
  width: 100%;
  height: 100%;
  background: linear-gradient(180deg, #121830 0%, #1a2040 40%, #1e2848 70%, #121830 100%);
  color: white;
  font-family: 'Segoe UI', system-ui, sans-serif;
  opacity: 0;
  transition: opacity 0.8s ease;
  pointer-events: none;
}

.album-container.album-visible {
  opacity: 1;
  pointer-events: auto;
}

/* 欢迎页面 */
.welcome-container {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: linear-gradient(135deg, #0f0f1a 0%, #1a1a30 40%, #12122a 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
  overflow: hidden;
}

.welcome-content {
  text-align: center;
  z-index: 10;
  animation: fadeInUp 1s ease-out;
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.welcome-icon {
  width: 140px;
  height: 140px;
  margin: 0 auto 40px;
  animation: pulse 3s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% {
    transform: scale(1);
    filter: drop-shadow(0 0 25px rgba(167, 139, 250, 0.6));
  }
  50% {
    transform: scale(1.1);
    filter: drop-shadow(0 0 45px rgba(167, 139, 250, 0.85));
  }
}

.welcome-icon svg {
  width: 100%;
  height: 100%;
}

.start-button {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 5px 20px;
  font-size: 0.95rem;
  font-weight: 500;
  color: #fff;
  background: linear-gradient(135deg, rgba(167, 139, 250, 0.25) 0%, rgba(129, 140, 248, 0.25) 100%);
  border: 1px solid rgba(167, 139, 250, 0.4);
  border-radius: 50px;
  cursor: pointer;
  transition: all 0.4s ease;
  backdrop-filter: blur(10px);
  box-shadow: 0 0 25px rgba(167, 139, 250, 0.15);
}

.start-button:hover {
  background: linear-gradient(135deg, rgba(167, 139, 250, 0.4) 0%, rgba(129, 140, 248, 0.4) 100%);
  border-color: rgba(167, 139, 250, 0.7);
  transform: translateY(-2px);
  box-shadow: 0 8px 30px rgba(167, 139, 250, 0.35);
}

.start-button:active {
  transform: translateY(0);
}

.start-button svg {
  width: 16px;
  height: 16px;
}

/* 漂浮光球 */
.floating-orbs {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
}

.orb {
  position: absolute;
  border-radius: 50%;
  filter: blur(30px);
  opacity: 0.6;
  animation: float 10s ease-in-out infinite;
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

@keyframes float {
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

/* 星星粒子 */
.stars {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
}

.star {
  position: absolute;
  background: #fff;
  border-radius: 50%;
  opacity: 0;
  animation: twinkle 3s ease-in-out infinite;
  box-shadow: 0 0 4px rgba(255, 255, 255, 0.8);
}

@keyframes twinkle {
  0%, 100% {
    opacity: 0;
    transform: scale(0.5);
  }
  50% {
    opacity: 1;
    transform: scale(1.2);
  }
}

/* 响应式 */
@media (max-width: 768px) {
  .welcome-icon {
    width: 200px;
    height: 200px;
    margin-bottom: 15px;
  }

  .start-button {
    padding: 5px 20px;
    font-size: 1rem;
  }
}

.photo-display {
  position: relative;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}

.photo {
  position: absolute;
  width: 100%;
  height: 100%;
  object-fit: contain;
}

/* 顶部标题 */
.photo-header {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  padding: 16px 24px;
  background: linear-gradient(to bottom, rgba(0,0,0,0.75) 0%, transparent 100%);
  z-index: 20;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
}

.header-left {
  display: flex;
  flex-direction: column;
}

.photo-header h2 {
  font-size: 1.5rem;
  font-weight: 300;
  margin-bottom: 4px;
  text-shadow: 0 2px 8px rgba(0,0,0,0.6);
}

.photo-counter {
  font-size: 0.9rem;
  opacity: 0.8;
  font-weight: 300;
}

/* 右侧按钮组 */
.header-controls {
  display: flex;
  gap: 10px;
  align-items: center;
}

/* 音乐按钮 */
.music-toggle {
  width: 40px;
  height: 40px;
  border: none;
  background: rgba(255,255,255,0.15);
  color: white;
  border-radius: 50%;
  cursor: pointer;
  transition: background 0.2s ease, box-shadow 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  backdrop-filter: blur(8px);
  flex-shrink: 0;
  will-change: transform;
}

.music-toggle svg {
  width: 20px;
  height: 20px;
}

.music-toggle:hover {
  background: rgba(255,255,255,0.25);
  box-shadow: 0 0 12px rgba(255,255,255,0.3);
}

.music-toggle:active {
  transform: scale(0.95);
}

/* 播放/暂停按钮 - 右上角 */
.play-toggle {
  width: 40px;
  height: 40px;
  border: none;
  background: rgba(255,255,255,0.15);
  color: white;
  border-radius: 50%;
  cursor: pointer;
  transition: background 0.2s ease, box-shadow 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  backdrop-filter: blur(8px);
  flex-shrink: 0;
  will-change: transform;
}

.play-toggle svg {
  width: 20px;
  height: 20px;
}

.play-toggle:hover {
  background: rgba(255,255,255,0.25);
  box-shadow: 0 0 12px rgba(255,255,255,0.3);
}

.play-toggle:active {
  transform: scale(0.95);
}

/* 侧边箭头按钮 */
.side-arrow {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  width: 50px;
  height: 80px;
  border: none;
  background: rgba(0,0,0,0.3);
  color: white;
  cursor: pointer;
  z-index: 15;
  opacity: 0;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
}

.side-arrow.visible {
  opacity: 1;
}

.side-arrow:hover {
  background: rgba(0,0,0,0.5);
}

.side-arrow.left {
  left: 0;
  border-radius: 0 8px 8px 0;
}

.side-arrow.right {
  right: 0;
  border-radius: 8px 0 0 8px;
}

.side-arrow svg {
  width: 28px;
  height: 28px;
}

/* 底部控制栏 */
.photo-footer {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 12px 16px 20px;
  background: linear-gradient(to top, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.6) 70%, transparent 100%);
  z-index: 20;
  max-height: 38%;
  display: flex;
  flex-direction: column;
}

/* 年份导航容器 */
.year-nav-wrapper {
  width: 100%;
  overflow-x: auto;
  overflow-y: visible;
  margin-bottom: 10px;
  -webkit-overflow-scrolling: touch;
}

.year-nav-wrapper::-webkit-scrollbar {
  height: 3px;
}

.year-nav-wrapper::-webkit-scrollbar-track {
  background: rgba(255,255,255,0.1);
  border-radius: 2px;
}

.year-nav-wrapper::-webkit-scrollbar-thumb {
  background: rgba(255,255,255,0.3);
  border-radius: 2px;
}

.year-nav {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 8px;
  padding: 2px 0;
}

.year-btn {
  padding: 5px 16px;
  border: 1px solid rgba(255,255,255,0.25);
  background: rgba(255,255,255,0.08);
  color: white;
  border-radius: 18px;
  cursor: pointer;
  transition: all 0.3s ease;
  font-size: 0.9rem;
  backdrop-filter: blur(8px);
  white-space: nowrap;
  flex-shrink: 0;
}

.year-btn:hover {
  background: rgba(255,255,255,0.15);
  border-color: rgba(255,255,255,0.4);
}

.year-btn.active {
  background: rgba(255,255,255,0.2);
  border-color: rgba(255,255,255,0.7);
  box-shadow: 0 0 12px rgba(255,255,255,0.25);
}

/* 缩略图 */
.thumbnails {
  display: flex;
  justify-content: flex-start;
  gap: 6px;
  overflow-x: auto;
  padding: 4px 16px;
  -webkit-overflow-scrolling: touch;
  scrollbar-width: thin;
  scrollbar-color: rgba(255,255,255,0.3) rgba(255,255,255,0.05);
}

.thumbnails::-webkit-scrollbar {
  height: 4px;
}

.thumbnails::-webkit-scrollbar-track {
  background: rgba(255,255,255,0.08);
  border-radius: 2px;
}

.thumbnails::-webkit-scrollbar-thumb {
  background: rgba(255,255,255,0.25);
  border-radius: 2px;
}

.thumb {
  width: 52px;
  height: 39px;
  object-fit: cover;
  border-radius: 4px;
  cursor: pointer;
  opacity: 0.35;
  transition: all 0.3s ease;
  border: 2px solid transparent;
  flex-shrink: 0;
}

.thumb:hover {
  opacity: 0.6;
}

.thumb.active {
  opacity: 1;
  border-color: #fff;
  box-shadow: 0 0 10px rgba(255,255,255,0.35);
}

/* 过渡动画 */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.5s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* 响应式适配 */
@media (max-width: 768px) {
  .photo-header {
    padding: 12px 16px;
  }

  .photo-header h2 {
    font-size: 1.2rem;
  }

  .header-controls {
    gap: 8px;
  }

  .music-toggle {
    width: 36px;
    height: 36px;
  }

  .music-toggle svg {
    width: 18px;
    height: 18px;
  }

  .play-toggle {
    width: 36px;
    height: 36px;
  }

  .play-toggle svg {
    width: 18px;
    height: 18px;
  }

  .photo-footer {
    padding: 10px 12px 16px;
    max-height: 42%;
  }

  .year-nav {
    gap: 6px;
  }

  .year-btn {
    padding: 4px 12px;
    font-size: 0.85rem;
  }

  .side-arrow {
    width: 40px;
    height: 60px;
  }

  .side-arrow svg {
    width: 24px;
    height: 24px;
  }

  .thumb {
    width: 46px;
    height: 35px;
  }
}

@media (max-width: 480px) {
  .photo-header {
    padding: 10px 12px;
  }

  .photo-header h2 {
    font-size: 1.05rem;
  }

  .photo-counter {
    font-size: 0.8rem;
  }

  .header-controls {
    gap: 6px;
  }

  .music-toggle {
    width: 32px;
    height: 32px;
  }

  .music-toggle svg {
    width: 16px;
    height: 16px;
  }

  .play-toggle {
    width: 32px;
    height: 32px;
  }

  .play-toggle svg {
    width: 16px;
    height: 16px;
  }

  .photo-footer {
    padding: 8px 10px 12px;
    max-height: 48%;
  }

  .year-nav-wrapper {
    margin-bottom: 6px;
  }

  .year-nav {
    gap: 5px;
  }

  .year-btn {
    padding: 3px 10px;
    font-size: 0.8rem;
  }

  .side-arrow {
    width: 36px;
    height: 50px;
  }

  .side-arrow svg {
    width: 20px;
    height: 20px;
  }

  .thumb {
    width: 40px;
    height: 30px;
  }

  .thumbnails {
    gap: 4px;
  }
}
</style>
