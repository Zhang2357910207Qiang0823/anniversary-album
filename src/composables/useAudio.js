import { ref, watch } from 'vue'

// 音乐管理 composable
export function useAudio() {
  const audio = ref(null)
  const isPlaying = ref(false)
  const volume = ref(0.6) // 默认音量
  const currentVolume = ref(0) // 当前音量（用于淡入淡出）
  const targetVolume = ref(0.6)
  const isFading = ref(false)
  
  let fadeInterval = null
  let audioContext = null
  let gainNode = null

  // 初始化音频
  const initAudio = (src) => {
    if (audio.value) {
      audio.value.pause()
      audio.value = null
    }
    
    audio.value = new Audio()
    audio.value.src = src
    audio.value.loop = true // 循环播放
    audio.value.volume = 0
    
    // 监听播放状态
    audio.value.addEventListener('playing', () => {
      isPlaying.value = true
    })
    
    audio.value.addEventListener('pause', () => {
      isPlaying.value = false
    })
    
    audio.value.addEventListener('ended', () => {
      isPlaying.value = false
    })
    
    // 使用 Web Audio API 实现平滑淡入淡出
    setupAudioContext()
  }

  // 设置 AudioContext
  const setupAudioContext = () => {
    if (!audio.value) return
    
    try {
      audioContext = new (window.AudioContext || window.webkitAudioContext)()
      gainNode = audioContext.createGain()
      
      const source = audioContext.createMediaElementSource(audio.value)
      source.connect(gainNode)
      gainNode.connect(audioContext.destination)
      
      gainNode.gain.value = 0
    } catch (e) {
      console.warn('Web Audio API not supported, using fallback')
    }
  }

  // 播放音乐（带淡入效果）
  const play = (fadeDuration = 2000) => {
    if (!audio.value) return
    
    // 确保 AudioContext 已启动（用户交互后）
    if (audioContext && audioContext.state === 'suspended') {
      audioContext.resume()
    }
    
    audio.value.play().then(() => {
      isPlaying.value = true
      fadeIn(fadeDuration)
    }).catch(e => {
      console.warn('Audio play failed:', e)
    })
  }

  // 暂停音乐（带淡出效果）
  const pause = (fadeDuration = 1500) => {
    if (!audio.value) return
    
    fadeOut(fadeDuration, () => {
      audio.value.pause()
      isPlaying.value = false
    })
  }

  // 淡入
  const fadeIn = (duration = 2000) => {
    if (!gainNode || isFading.value) return
    
    isFading.value = true
    const startVolume = gainNode.gain.value
    const endVolume = targetVolume.value
    const startTime = Date.now()
    
    const fade = () => {
      const elapsed = Date.now() - startTime
      const progress = Math.min(elapsed / duration, 1)
      const easedProgress = easeInOutCubic(progress)
      
      gainNode.gain.value = startVolume + (endVolume - startVolume) * easedProgress
      
      if (progress < 1) {
        requestAnimationFrame(fade)
      } else {
        isFading.value = false
      }
    }
    
    requestAnimationFrame(fade)
  }

  // 淡出
  const fadeOut = (duration = 1500, callback) => {
    if (!gainNode || isFading.value) {
      if (callback) callback()
      return
    }
    
    isFading.value = true
    const startVolume = gainNode.gain.value
    const endVolume = 0
    const startTime = Date.now()
    
    const fade = () => {
      const elapsed = Date.now() - startTime
      const progress = Math.min(elapsed / duration, 1)
      const easedProgress = easeInOutCubic(progress)
      
      gainNode.gain.value = startVolume + (endVolume - startVolume) * easedProgress
      
      if (progress < 1) {
        requestAnimationFrame(fade)
      } else {
        isFading.value = false
        if (callback) callback()
      }
    }
    
    requestAnimationFrame(fade)
  }

  // 切换播放/暂停
  const toggle = () => {
    if (isPlaying.value) {
      pause()
    } else {
      play()
    }
  }

  // 设置音量
  const setVolume = (vol) => {
    targetVolume.value = vol
    volume.value = vol
    if (gainNode && !isFading.value) {
      gainNode.gain.value = vol
    }
  }

  // 缓动函数
  const easeInOutCubic = (t) => {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2
  }

  // 清理
  const cleanup = () => {
    if (audio.value) {
      audio.value.pause()
      audio.value = null
    }
    if (audioContext) {
      audioContext.close()
      audioContext = null
    }
    if (fadeInterval) {
      clearInterval(fadeInterval)
    }
  }

  return {
    audio,
    isPlaying,
    volume,
    initAudio,
    play,
    pause,
    toggle,
    setVolume,
    cleanup
  }
}
