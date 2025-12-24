/**
 * AudioManager - Handles audio playback for the Sinbad Memory Game
 * Supports preloading, sequential playback, and caching
 */

class AudioManager {
  constructor() {
    this.audioCache = new Map();
    this.currentAudio = null;
    this.isPlaying = false;
  }

  /**
   * Preload an audio file
   * @param {string} src - Audio file path
   * @returns {Promise<HTMLAudioElement>}
   */
  async preloadAudio(src) {
    if (this.audioCache.has(src)) {
      return this.audioCache.get(src);
    }

    const audio = new Audio(src);
    
    return new Promise((resolve, reject) => {
      audio.addEventListener('canplaythrough', () => {
        this.audioCache.set(src, audio);
        resolve(audio);
      }, { once: true });
      
      audio.addEventListener('error', (e) => {
        console.error(`Failed to load audio: ${src}`, e);
        reject(e);
      }, { once: true });
      
      audio.load();
    });
  }

  /**
   * Play a single audio file
   * @param {string} src - Audio file path
   * @returns {Promise<void>}
   */
  async play(src) {
    try {
      // Stop current audio if playing
      if (this.currentAudio) {
        this.currentAudio.pause();
        this.currentAudio.currentTime = 0;
      }

      // Try to get from cache or load
      let audio;
      try {
        audio = await this.preloadAudio(src);
      } catch (error) {
        console.warn(`Audio file not found: ${src}, skipping...`);
        return;
      }

      this.currentAudio = audio;
      this.isPlaying = true;

      await audio.play();

      return new Promise((resolve) => {
        audio.addEventListener('ended', () => {
          this.isPlaying = false;
          resolve();
        }, { once: true });
      });
    } catch (error) {
      console.error('Error playing audio:', error);
      this.isPlaying = false;
    }
  }

  /**
   * Play multiple audio files in sequence
   * @param {string[]} srcs - Array of audio file paths
   * @param {number} delayMs - Delay between audio files in milliseconds
   * @returns {Promise<void>}
   */
  async playSequence(srcs, delayMs = 800) {
    for (const src of srcs) {
      await this.play(src);
      if (delayMs > 0) {
        await new Promise(resolve => setTimeout(resolve, delayMs));
      }
    }
  }

  /**
   * Stop current audio playback
   */
  stop() {
    if (this.currentAudio) {
      this.currentAudio.pause();
      this.currentAudio.currentTime = 0;
      this.isPlaying = false;
    }
  }

  /**
   * Preload multiple audio files
   * @param {string[]} srcs - Array of audio file paths
   * @returns {Promise<void>}
   */
  async preloadMultiple(srcs) {
    const promises = srcs.map(src => 
      this.preloadAudio(src).catch(err => {
        console.warn(`Failed to preload: ${src}`, err);
      })
    );
    await Promise.all(promises);
  }

  /**
   * Clear audio cache
   */
  clearCache() {
    this.audioCache.clear();
  }

  /**
   * Get audio file path for an item name
   * @param {string} itemName - Item name in Arabic
   * @returns {string}
   */
  getItemAudioPath(itemName) {
    return `/audio/items/${itemName}.mp3`;
  }

  /**
   * Get audio file path for an instruction
   * @param {string} instructionKey - Instruction key
   * @returns {string}
   */
  getInstructionAudioPath(instructionKey) {
    return `/audio/instructions/${instructionKey}.mp3`;
  }

  /**
   * Get audio file path for encouragement
   * @param {string} encouragementKey - Encouragement key
   * @returns {string}
   */
  getEncouragementAudioPath(encouragementKey) {
    return `/audio/encouragement/${encouragementKey}.mp3`;
  }
}

// Export singleton instance
export const audioManager = new AudioManager();
