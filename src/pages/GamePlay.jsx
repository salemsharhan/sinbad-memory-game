import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { audioManager } from '../lib/audioManager';
import { saveGameResult } from '../lib/api/game';
import { getImagePath } from '../lib/itemMapping';
import gameData from '../assets/game-data.json';

const GAME_PHASES = {
  LOADING: 'loading',
  INSTRUCTIONS: 'instructions',
  LISTENING: 'listening',
  WAITING: 'waiting',
  SELECTING: 'selecting',
  FEEDBACK: 'feedback',
  COMPLETED: 'completed'
};

export default function GamePlay() {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  
  const [gameState, setGameState] = useState({
    phase: GAME_PHASES.LOADING,
    currentQuestionIndex: 0,
    selectedItems: [],
    score: 0,
    results: [],
    isCorrect: null
  });

  const [session, setSession] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [timeLeft, setTimeLeft] = useState(0);
  const [displayTimeLeft, setDisplayTimeLeft] = useState(0);
  const [isAudioPlaying, setIsAudioPlaying] = useState(false);
  const [shuffledItems, setShuffledItems] = useState([]);

  // Load session and questions
  useEffect(() => {
    loadSession();
  }, [sessionId]);

  // Update current question and shuffle items once per question
  useEffect(() => {
    if (questions.length > 0 && gameState.currentQuestionIndex < questions.length) {
      const question = questions[gameState.currentQuestionIndex];
      setCurrentQuestion(question);
      
      // Shuffle items once when question changes
      const allItems = [
        ...(question.requiredItems || []),
        ...(question.distractors || [])
      ];
      // Shuffle using a stable algorithm
      const shuffled = [...allItems].sort(() => Math.random() - 0.5);
      setShuffledItems(shuffled);
      
      console.log('[GamePlay] Current question updated:', {
        index: gameState.currentQuestionIndex,
        questionId: question.id,
        requiredItems: question.requiredItems,
        shuffledItemsCount: shuffled.length
      });
    }
  }, [questions, gameState.currentQuestionIndex]);

  // Auto-start instructions when question is loaded and ready
  useEffect(() => {
    // Use a ref to track if we've already started this question to prevent duplicate calls
    const questionKey = `${gameState.currentQuestionIndex}-${gameState.phase}`;
    
    console.log('[GamePlay] useEffect triggered:', {
      hasCurrentQuestion: !!currentQuestion,
      hasSession: !!session,
      questionsLength: questions.length,
      phase: gameState.phase,
      isAudioPlaying,
      currentQuestionIndex: gameState.currentQuestionIndex,
      questionKey
    });
    
    if (
      currentQuestion && 
      session && 
      questions.length > 0 && 
      gameState.phase === GAME_PHASES.INSTRUCTIONS
    ) {
      // Add a timeout fallback in case isAudioPlaying gets stuck
      const fallbackTimer = setTimeout(() => {
        console.warn('[GamePlay] Fallback: isAudioPlaying stuck, forcing transition');
        setIsAudioPlaying(false);
        if (gameState.currentQuestionIndex === 0) {
          playInstructions();
        } else {
          startListeningPhase();
        }
      }, 2000);
      
      if (!isAudioPlaying) {
        // For first question, play full instructions (welcome + watch carefully)
        // For subsequent questions, skip welcome and go straight to listening
        if (gameState.currentQuestionIndex === 0) {
          console.log('[GamePlay] Auto-starting instructions for first question');
          // Clear any cached audio before starting
          audioManager.clearCache();
          const timer = setTimeout(() => {
            clearTimeout(fallbackTimer);
            playInstructions();
          }, 500);
          return () => {
            clearTimeout(timer);
            clearTimeout(fallbackTimer);
          };
        } else {
          // For subsequent questions, skip welcome and go straight to listening
          console.log('[GamePlay] Starting listening phase for question', gameState.currentQuestionIndex + 1);
          // Clear any cached audio and stop any playing audio before starting
          // This prevents the first question audio from playing
          audioManager.stop();
          audioManager.clearCache();
          // Small delay to ensure audio is fully stopped
          const timer = setTimeout(() => {
            clearTimeout(fallbackTimer);
            startListeningPhase();
          }, 300);
          return () => {
            clearTimeout(timer);
            clearTimeout(fallbackTimer);
          };
        }
      } else {
        // If audio is playing, wait for it to finish, but set a timeout
        return () => clearTimeout(fallbackTimer);
      }
    }
  }, [currentQuestion, session, gameState.phase, questions.length, gameState.currentQuestionIndex, isAudioPlaying]);

  // Timer for waiting phase
  useEffect(() => {
    if (gameState.phase === GAME_PHASES.WAITING) {
      if (timeLeft > 0) {
        const timer = setTimeout(() => {
          setTimeLeft(prev => {
            const newTime = prev - 1;
            console.log('[GamePlay] Wait timer tick:', { prev, newTime });
            return newTime;
          });
        }, 1000);
        return () => clearTimeout(timer);
      } else if (timeLeft === 0) {
        console.log('[GamePlay] Wait timer reached 0, starting selecting phase', {
          hasSession: !!session,
          hasCurrentQuestion: !!currentQuestion,
          currentPhase: gameState.phase
        });
        
        if (!session || !currentQuestion) {
          console.error('[GamePlay] Cannot transition to selecting phase: missing session or currentQuestion');
          return;
        }
        
        // Transition directly here to avoid race conditions
        const timingMode = session.timingMode || 'medium';
        const timingConfig = gameData.timingConfigurations[timingMode] || gameData.timingConfigurations.medium;
        const stageIndex = Math.min(session.stage - 1, timingConfig.length - 1);
        const displayTime = timingConfig[stageIndex] || 15;
        
        console.log('[GamePlay] Setting display time and transitioning to SELECTING:', {
          timingMode,
          stage: session.stage,
          stageIndex,
          displayTime
        });
        
        // Set display time and phase together
        setDisplayTimeLeft(displayTime);
        setGameState(prev => {
          if (prev.phase === GAME_PHASES.WAITING) {
            console.log('[GamePlay] Successfully transitioning from WAITING to SELECTING');
            return { 
              ...prev, 
              phase: GAME_PHASES.SELECTING,
              selectedItems: []
            };
          }
          console.warn('[GamePlay] Phase changed before transition, current phase:', prev.phase);
          return prev;
        });
      }
    }
  }, [gameState.phase, timeLeft, session, currentQuestion]);

  // Timer for selecting phase (display period - فترة العرض)
  useEffect(() => {
    if (gameState.phase === GAME_PHASES.SELECTING && displayTimeLeft > 0) {
      const timer = setTimeout(() => {
        setDisplayTimeLeft(prev => {
          const newTime = prev - 1;
          if (newTime === 0) {
            // Time's up - auto-submit if they haven't submitted yet
            console.log('[GamePlay] Display timer reached 0, auto-submitting');
            if (gameState.selectedItems.length > 0) {
              submitAnswer();
            }
          }
          return newTime;
        });
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [gameState.phase, displayTimeLeft, gameState.selectedItems.length]);

  const loadSession = async () => {
    try {
      // In a real app, fetch session from Supabase
      // For now, use mock data from localStorage
      const sessionData = JSON.parse(localStorage.getItem(`session_${sessionId}`));
      
      if (!sessionData) {
        alert('الجلسة غير موجودة');
        navigate('/');
        return;
      }

      setSession(sessionData);
      
      // Load questions for this level and stage
      const level = gameData.levels[sessionData.level];
      if (!level) {
        console.error('Level not found:', sessionData.level);
        alert('المستوى غير موجود');
        navigate('/');
        return;
      }
      
      // Stage is stored as string key in JSON
      const stageKey = String(sessionData.stage);
      const stage = level.stages[stageKey];
      
      if (!stage || !stage.questions) {
        console.error('Stage not found:', sessionData.stage, 'in level', sessionData.level);
        alert('المرحلة غير موجودة');
        navigate('/');
        return;
      }
      
      setQuestions(stage.questions);
      
      // Set current question immediately after questions are loaded
      if (stage.questions.length > 0) {
        const firstQuestion = stage.questions[0];
        setCurrentQuestion(firstQuestion);
        console.log('[GamePlay] Set initial question:', {
          questionId: firstQuestion.id,
          requiredItems: firstQuestion.requiredItems
        });
      }
      
      setGameState(prev => ({ ...prev, phase: GAME_PHASES.INSTRUCTIONS }));
      
      // Don't call playInstructions here - let the useEffect handle it
      // This ensures currentQuestion is properly set before playing
      
    } catch (error) {
      console.error('Error loading session:', error);
      alert('حدث خطأ في تحميل الجلسة');
      navigate('/');
    }
  };

  const playInstructions = async () => {
    // Wait a bit to ensure currentQuestion is set
    if (!currentQuestion) {
      console.log('[GamePlay] Waiting for currentQuestion to be set...');
      // Try to get it from questions array
      if (questions.length > 0 && gameState.currentQuestionIndex < questions.length) {
        const question = questions[gameState.currentQuestionIndex];
        setCurrentQuestion(question);
        console.log('[GamePlay] Set currentQuestion from questions array:', question);
      } else {
        console.error('[GamePlay] Cannot play instructions: no currentQuestion and no questions');
        return;
      }
    }
    
    setIsAudioPlaying(true);
    try {
      // Only play welcome and watch carefully for the first question
      if (gameState.currentQuestionIndex === 0) {
        await audioManager.play(audioManager.getInstructionAudioPath('welcome'));
        await new Promise(r => setTimeout(r, 500));
        await audioManager.play(audioManager.getInstructionAudioPath('watch-carefully'));
        await new Promise(r => setTimeout(r, 1000));
      } else {
        // For subsequent questions, just a brief pause
        await new Promise(r => setTimeout(r, 500));
      }
      startListeningPhase();
    } catch (error) {
      console.error('Error playing instructions:', error);
      startListeningPhase();
    }
    setIsAudioPlaying(false);
  };

  const startListeningPhase = async () => {
    console.log('[GamePlay] startListeningPhase called', {
      hasCurrentQuestion: !!currentQuestion,
      hasSession: !!session,
      currentQuestionIndex: gameState.currentQuestionIndex,
      currentPhase: gameState.phase
    });
    
    if (!currentQuestion || !session) {
      console.error('[GamePlay] Cannot start listening phase: currentQuestion or session is null', {
        currentQuestion,
        session
      });
      // Try to get currentQuestion from questions array
      if (questions.length > 0 && gameState.currentQuestionIndex < questions.length) {
        const question = questions[gameState.currentQuestionIndex];
        console.log('[GamePlay] Setting currentQuestion from questions array:', question);
        setCurrentQuestion(question);
        // Retry after state update
        setTimeout(() => startListeningPhase(), 100);
        return;
      }
      return;
    }
    
    // Ensure we transition to LISTENING phase even if we're stuck in INSTRUCTIONS
    if (gameState.phase === GAME_PHASES.INSTRUCTIONS) {
      console.log('[GamePlay] Transitioning from INSTRUCTIONS to LISTENING phase');
      setGameState(prev => ({ ...prev, phase: GAME_PHASES.LISTENING }));
    }
    
    console.log('[GamePlay] Starting listening phase for question:', {
      questionId: currentQuestion.id,
      requiredItems: currentQuestion.requiredItems
    });
    
    setGameState(prev => ({ ...prev, phase: GAME_PHASES.LISTENING }));
    setIsAudioPlaying(true);

    try {
      // Play each required item's audio
      const audioFiles = (currentQuestion.requiredItems || []).map(item => 
        audioManager.getItemAudioPath(item)
      );
      
      console.log('[GamePlay] Playing audio files:', audioFiles);
      await audioManager.playSequence(audioFiles, 800);
      console.log('[GamePlay] Audio playback completed, starting waiting phase');
      
      // Start waiting phase after audio completes
      setIsAudioPlaying(false);
      startWaitingPhase();
    } catch (error) {
      console.error('Error playing items:', error);
      setIsAudioPlaying(false);
      startWaitingPhase();
    }
  };

  const startWaitingPhase = () => {
    console.log('[GamePlay] startWaitingPhase called');
    if (!session || !currentQuestion) {
      console.error('[GamePlay] Cannot start waiting phase: session or currentQuestion is null', {
        hasSession: !!session,
        hasCurrentQuestion: !!currentQuestion
      });
      return;
    }
    
    // Wait timer (مؤقت التوقف): 0-15 seconds between audio and showing images
    // Default to 5 seconds, but can be configured in session
    const waitTimer = session.waitTimer !== undefined ? session.waitTimer : 5;
    const waitTime = Math.max(0, Math.min(15, waitTimer)); // Clamp between 0-15
    
    console.log('[GamePlay] Starting waiting phase:', {
      waitTime,
      stage: session.stage,
      currentQuestionIndex: gameState.currentQuestionIndex
    });
    
    // Set timeLeft first, then phase, to avoid race condition
    setTimeLeft(waitTime);
    // Use a small delay to ensure timeLeft is set before phase changes
    setTimeout(() => {
      setGameState(prev => {
        console.log('[GamePlay] Setting phase to WAITING, previous phase:', prev.phase, 'timeLeft will be:', waitTime);
        return { ...prev, phase: GAME_PHASES.WAITING };
      });
    }, 50);
  };

  const startSelectingPhase = () => {
    if (!session || !currentQuestion) {
      console.error('[GamePlay] Cannot start selecting phase: session or currentQuestion is null', {
        hasSession: !!session,
        hasCurrentQuestion: !!currentQuestion
      });
      return;
    }
    
    // Display Period (فترة العرض): Use timingConfigurations based on stage
    // Get timing mode from session or default to 'medium'
    const timingMode = session.timingMode || 'medium';
    const timingConfig = gameData.timingConfigurations[timingMode] || gameData.timingConfigurations.medium;
    
    // Stage 1 = index 0, Stage 2 = index 1, Stage 3 = index 2
    // But we have 6 values, so map: Stage 1 -> index 0, Stage 2 -> index 2, Stage 3 -> index 4
    // Or use stage - 1 directly if we have 3 stages
    const stageIndex = Math.min(session.stage - 1, timingConfig.length - 1);
    const displayTime = timingConfig[stageIndex] || 15; // Default to 15 if not found
    
    console.log('[GamePlay] Starting selecting phase:', {
      timingMode,
      stage: session.stage,
      stageIndex,
      displayTime,
      currentPhase: gameState.phase
    });
    
    // Set display time first
    setDisplayTimeLeft(displayTime);
    
    // Then update phase - use functional update to ensure we have latest state
    setGameState(prev => {
      if (prev.phase === GAME_PHASES.WAITING) {
        console.log('[GamePlay] Transitioning from WAITING to SELECTING');
        return { 
          ...prev, 
          phase: GAME_PHASES.SELECTING,
          selectedItems: []
        };
      } else {
        console.warn('[GamePlay] startSelectingPhase called but phase is not WAITING, current phase:', prev.phase);
        return prev;
      }
    });
  };

  const toggleItemSelection = (item) => {
    setGameState(prev => {
      const isSelected = prev.selectedItems.includes(item);
      const newSelected = isSelected
        ? prev.selectedItems.filter(i => i !== item)
        : [...prev.selectedItems, item];
      
      return { ...prev, selectedItems: newSelected };
    });
  };

  const submitAnswer = async () => {
    if (!currentQuestion) {
      console.error('Cannot submit answer: currentQuestion is null');
      return;
    }
    
    const { selectedItems } = gameState;
    const requiredItems = currentQuestion.requiredItems || [];
    
    // Check if answer is correct
    const isCorrect = 
      selectedItems.length === requiredItems.length &&
      selectedItems.every(item => requiredItems.includes(item));
    
    // Update score
    const newScore = gameState.score + (isCorrect ? 1 : 0);
    
    // Save result
    const result = {
      questionIndex: gameState.currentQuestionIndex,
      selectedItems,
      requiredItems,
      isCorrect,
      timestamp: new Date().toISOString()
    };
    
    setGameState(prev => ({
      ...prev,
      phase: GAME_PHASES.FEEDBACK,
      isCorrect,
      score: newScore,
      results: [...prev.results, result]
    }));

    // Play feedback audio
    playFeedback(isCorrect);

    // Save to database
    try {
      await saveGameResult({
        sessionId: sessionId,
        questionNumber: gameState.currentQuestionIndex + 1,
        requiredItems: requiredItems.join(','),
        selectedItems: selectedItems.join(','),
        isCorrect,
        responseTime: 0 // TODO: Track actual response time
      });
    } catch (error) {
      console.error('Error saving result:', error);
    }

    // Move to next question after delay
    setTimeout(() => {
      if (gameState.currentQuestionIndex < questions.length - 1) {
        // Stop any playing audio and clear cache before moving to next question
        // This prevents the first question audio from playing
        audioManager.stop();
        audioManager.clearCache();
        
        // Reset timeLeft to prevent immediate transition
        setTimeLeft(0);
        setGameState(prev => ({
          ...prev,
          phase: GAME_PHASES.INSTRUCTIONS,
          currentQuestionIndex: prev.currentQuestionIndex + 1,
          selectedItems: [],
          isCorrect: null
        }));
        // Don't call startListeningPhase here - let the useEffect handle it
        // The useEffect will detect INSTRUCTIONS phase and start listening for subsequent questions
      } else {
        completeGame(newScore);
      }
    }, 3000);
  };

  const playFeedback = async (isCorrect) => {
    setIsAudioPlaying(true);
    try {
      const audioKey = isCorrect ? 'correct' : 'incorrect';
      await audioManager.play(audioManager.getInstructionAudioPath(audioKey));
      
      if (isCorrect) {
        await new Promise(r => setTimeout(r, 500));
        await audioManager.play(audioManager.getEncouragementAudioPath('great-job'));
      }
    } catch (error) {
      console.error('Error playing feedback:', error);
    }
    setIsAudioPlaying(false);
  };

  const completeGame = (finalScore) => {
    setGameState(prev => ({
      ...prev,
      phase: GAME_PHASES.COMPLETED,
      score: finalScore
    }));

    // Play completion audio
    setTimeout(async () => {
      try {
        await audioManager.play(audioManager.getInstructionAudioPath('stage-complete'));
      } catch (error) {
        console.error('Error playing completion audio:', error);
      }
    }, 500);

    // Navigate to results after delay
    setTimeout(() => {
      navigate(`/game/results/${sessionId}`);
    }, 4000);
  };

  // getImagePath is now imported from itemMapping.js

  if (!session || !currentQuestion || !questions.length) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-primary mx-auto mb-4"></div>
          <p className="text-2xl font-bold text-text">جاري التحميل...</p>
        </div>
      </div>
    );
  }

  // Use pre-shuffled items to maintain consistent order
  const allItems = shuffledItems;

  return (
    <div className="min-h-screen bg-cream p-4 md:p-8" dir="rtl">
      {/* Header */}
      <div className="max-w-6xl mx-auto mb-8">
        <div className="bg-white rounded-2xl shadow-soft p-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-text mb-2">
                المستوى {session.level} - المرحلة {session.stage}
              </h1>
              <p className="text-lg text-gray-600">
                السؤال {gameState.currentQuestionIndex + 1} من {questions.length}
              </p>
            </div>
            <div className="text-center">
              <div className="text-5xl font-bold text-primary">
                {gameState.score}
              </div>
              <p className="text-sm text-gray-600">النقاط</p>
            </div>
          </div>
          
          {/* Progress Bar */}
          <div className="mt-4 bg-gray-200 rounded-full h-3 overflow-hidden">
            <div 
              className="bg-primary h-full transition-all duration-500"
              style={{ 
                width: `${((gameState.currentQuestionIndex + 1) / questions.length) * 100}%` 
              }}
            ></div>
          </div>
        </div>
      </div>

      {/* Game Content */}
      <div className="max-w-6xl mx-auto">
        {/* Instructions Phase */}
        {gameState.phase === GAME_PHASES.INSTRUCTIONS && (
          <div className="bg-white rounded-2xl shadow-soft p-12 text-center">
            <div className="animate-pulse">
              <div className="text-6xl mb-6">👂</div>
              <h2 className="text-4xl font-bold text-text mb-4">
                استمع جيداً
              </h2>
              <p className="text-2xl text-gray-600">
                سوف تسمع أسماء العناصر التي يجب أن تتذكرها
              </p>
            </div>
          </div>
        )}

        {/* Listening Phase */}
        {gameState.phase === GAME_PHASES.LISTENING && (
          <div className="bg-white rounded-2xl shadow-soft p-12 text-center">
            <div className="animate-bounce">
              <div className="text-6xl mb-6">🔊</div>
              <h2 className="text-4xl font-bold text-text mb-4">
                استمع الآن...
              </h2>
              <div className="flex justify-center gap-2 mt-8">
                {[1, 2, 3, 4].map(i => (
                  <div 
                    key={i}
                    className="w-4 h-12 bg-primary rounded-full animate-pulse"
                    style={{ animationDelay: `${i * 0.2}s` }}
                  ></div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Waiting Phase */}
        {gameState.phase === GAME_PHASES.WAITING && (
          <div className="bg-white rounded-2xl shadow-soft p-12 text-center">
            <div className="text-8xl font-bold text-primary mb-6 animate-pulse">
              {timeLeft}
            </div>
            <h2 className="text-4xl font-bold text-text mb-4">
              تذكر العناصر...
            </h2>
            <p className="text-2xl text-gray-600">
              انتظر قليلاً، ثم اختر العناصر التي سمعتها
            </p>
          </div>
        )}

        {/* Selecting Phase */}
        {gameState.phase === GAME_PHASES.SELECTING && (
          <div>
            <div className="bg-white rounded-2xl shadow-soft p-8 mb-6">
              <div className="flex justify-between items-center mb-4">
                <div>
                  <h2 className="text-3xl font-bold text-text mb-2">
                    اختر العناصر التي سمعتها
                  </h2>
                  <p className="text-xl text-gray-600">
                    اختر {currentQuestion?.requiredItems?.length || 0} عناصر
                  </p>
                </div>
                {displayTimeLeft > 0 && (
                  <div className="text-right">
                    <div className="text-4xl font-bold text-primary">
                      {displayTimeLeft}
                    </div>
                    <p className="text-sm text-gray-600">ثانية</p>
                  </div>
                )}
              </div>
            </div>

            {/* Items Grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {allItems.map((item, index) => {
                const isSelected = gameState.selectedItems.includes(item);
                // Use item name as key to ensure React tracks the correct element
                const itemKey = `${gameState.currentQuestionIndex}-${item}`;
                return (
                  <button
                    key={itemKey}
                    onClick={() => toggleItemSelection(item)}
                    className={`
                      bg-white rounded-2xl shadow-soft p-6 
                      transition-all duration-300 transform hover:scale-105
                      ${isSelected ? 'ring-4 ring-primary bg-blue-50' : 'hover:shadow-lg'}
                    `}
                  >
                    <div className="aspect-square mb-4 bg-gray-100 rounded-xl overflow-hidden">
                      <img 
                        src={getImagePath(item)}
                        alt={item}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="200" height="200"%3E%3Crect fill="%23f0f0f0" width="200" height="200"/%3E%3Ctext x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" font-size="60"%3E%3F%3C/text%3E%3C/svg%3E';
                        }}
                      />
                    </div>
                    <p className="text-xl font-bold text-text text-center">
                      {item}
                    </p>
                    {isSelected && (
                      <div className="mt-2 text-3xl text-center">✓</div>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Submit Button */}
            <div className="mt-8 text-center">
              <button
                onClick={submitAnswer}
                disabled={!currentQuestion || gameState.selectedItems.length !== (currentQuestion.requiredItems?.length || 0)}
                className={`
                  px-12 py-6 rounded-2xl text-2xl font-bold
                  transition-all duration-300 transform
                  ${currentQuestion && gameState.selectedItems.length === (currentQuestion.requiredItems?.length || 0)
                    ? 'bg-primary text-white hover:scale-105 shadow-lg'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  }
                `}
              >
                تأكيد الإجابة
              </button>
            </div>
          </div>
        )}

        {/* Feedback Phase */}
        {gameState.phase === GAME_PHASES.FEEDBACK && (
          <div className="bg-white rounded-2xl shadow-soft p-12 text-center">
            <div className={`text-8xl mb-6 ${gameState.isCorrect ? 'animate-bounce' : 'animate-shake'}`}>
              {gameState.isCorrect ? '✅' : '❌'}
            </div>
            <h2 className={`text-5xl font-bold mb-4 ${gameState.isCorrect ? 'text-success' : 'text-error'}`}>
              {gameState.isCorrect ? 'أحسنت!' : 'حاول مرة أخرى'}
            </h2>
            <p className="text-2xl text-gray-600">
              {gameState.isCorrect 
                ? 'إجابة صحيحة! استمر بالتركيز' 
                : 'لا بأس، ستنجح في المرة القادمة'
              }
            </p>
          </div>
        )}

        {/* Completed Phase */}
        {gameState.phase === GAME_PHASES.COMPLETED && (
          <div className="bg-white rounded-2xl shadow-soft p-12 text-center">
            <div className="text-8xl mb-6 animate-bounce">🎉</div>
            <h2 className="text-5xl font-bold text-primary mb-4">
              أكملت المرحلة!
            </h2>
            <div className="text-6xl font-bold text-text my-8">
              {gameState.score} / {questions.length}
            </div>
            <p className="text-2xl text-gray-600">
              جاري الانتقال إلى صفحة النتائج...
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
