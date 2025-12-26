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
        // Return resolved promise so sequence continues
        return Promise.resolve();
      }

      this.currentAudio = audio;
      this.isPlaying = true;

      await audio.play();

      return new Promise((resolve) => {
        const onEnded = () => {
          this.isPlaying = false;
          audio.removeEventListener('ended', onEnded);
          resolve();
        };
        audio.addEventListener('ended', onEnded, { once: true });
        
        // Fallback timeout in case 'ended' event doesn't fire
        setTimeout(() => {
          if (this.isPlaying) {
            console.warn(`Audio playback timeout for ${src}, forcing resolve`);
            this.isPlaying = false;
            audio.removeEventListener('ended', onEnded);
            resolve();
          }
        }, 10000); // 10 second timeout
      });
    } catch (error) {
      console.error('Error playing audio:', error);
      this.isPlaying = false;
      // Return resolved promise so sequence continues even on error
      return Promise.resolve();
    }
  }

  /**
   * Play multiple audio files in sequence
   * @param {string[]} srcs - Array of audio file paths
   * @param {number} delayMs - Delay between audio files in milliseconds
   * @returns {Promise<void>}
   */
  async playSequence(srcs, delayMs = 800) {
    // Clear any previous audio to prevent overlap
    this.stop();
    
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
    // Audio files are named: item-{itemName}.mp3
    // Replace spaces with dashes to match actual file names
    const fileName = itemName.replace(/\s+/g, '-');
    return `/audio/item-${fileName}.mp3`;
  }

  /**
   * Get audio file path for an instruction
   * @param {string} instructionKey - Instruction key
   * @returns {string}
   */
  getInstructionAudioPath(instructionKey) {
    // Audio files are named: instruction-{key}.mp3
    // Map common keys to actual file names
    const instructionMap = {
      'listen-carefully': 'watch_carefully',
      'watch-carefully': 'watch_carefully',
      'stage-complete': 'level_complete',
      'level-complete': 'level_complete',
      'correct': 'correct',
      'incorrect': 'incorrect',
      'get-ready': 'get_ready',
      'good-job': 'good_job',
      'welcome': 'welcome',
      'great-job': 'good_job',
      'excellent': 'excellent'
    };
    const fileName = instructionMap[instructionKey] || instructionKey.replace(/-/g, '_');
    return `/audio/instruction-${fileName}.mp3`;
  }

  /**
   * Get audio file path for encouragement
   * @param {string} encouragementKey - Encouragement key
   * @returns {string}
   */
  getEncouragementAudioPath(encouragementKey) {
    // Audio files are named: encouragement-{key}.mp3
    // Map common keys to actual file names
    const encouragementMap = {
      'great-job': 'great',
      'amazing': 'amazing',
      'fantastic': 'fantastic',
      'wonderful': 'wonderful',
      'you-can-do-it': 'you_can_do_it',
      'keep-going': 'keep_going',
      'almost-there': 'almost_there',
      'one-more-try': 'one_more_try'
    };
    const fileName = encouragementMap[encouragementKey] || encouragementKey.replace(/-/g, '_');
    return `/audio/encouragement-${fileName}.mp3`;
  }
}

// Export singleton instance
export const audioManager = new AudioManager();
