import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { audioManager } from '../lib/audioManager';
import { saveGameResult } from '../lib/api/game';
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
  const [isAudioPlaying, setIsAudioPlaying] = useState(false);

  // Load session and questions
  useEffect(() => {
    loadSession();
  }, [sessionId]);

  // Update current question
  useEffect(() => {
    if (questions.length > 0 && gameState.currentQuestionIndex < questions.length) {
      setCurrentQuestion(questions[gameState.currentQuestionIndex]);
    }
  }, [questions, gameState.currentQuestionIndex]);

  // Timer for waiting phase
  useEffect(() => {
    if (gameState.phase === GAME_PHASES.WAITING && timeLeft > 0) {
      const timer = setTimeout(() => {
        setTimeLeft(timeLeft - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else if (gameState.phase === GAME_PHASES.WAITING && timeLeft === 0) {
      startSelectingPhase();
    }
  }, [gameState.phase, timeLeft]);

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
      const stage = level.stages[sessionData.stage];
      
      setQuestions(stage.questions);
      setGameState(prev => ({ ...prev, phase: GAME_PHASES.INSTRUCTIONS }));
      
      // Play welcome audio
      setTimeout(() => {
        playInstructions();
      }, 1000);
      
    } catch (error) {
      console.error('Error loading session:', error);
      alert('حدث خطأ في تحميل الجلسة');
      navigate('/');
    }
  };

  const playInstructions = async () => {
    setIsAudioPlaying(true);
    try {
      await audioManager.play(audioManager.getInstructionAudioPath('listen-carefully'));
      await new Promise(r => setTimeout(r, 1000));
      startListeningPhase();
    } catch (error) {
      console.error('Error playing instructions:', error);
      startListeningPhase();
    }
    setIsAudioPlaying(false);
  };

  const startListeningPhase = async () => {
    setGameState(prev => ({ ...prev, phase: GAME_PHASES.LISTENING }));
    setIsAudioPlaying(true);

    try {
      // Play each required item's audio
      const audioFiles = currentQuestion.requiredItems.map(item => 
        audioManager.getItemAudioPath(item)
      );
      
      await audioManager.playSequence(audioFiles, 800);
      
      // Start waiting phase
      startWaitingPhase();
    } catch (error) {
      console.error('Error playing items:', error);
      startWaitingPhase();
    }
    
    setIsAudioPlaying(false);
  };

  const startWaitingPhase = () => {
    const level = gameData.levels[session.level];
    const timingMode = session.timingMode || 'medium';
    const waitTime = level.displayTiming[timingMode][session.stage - 1];
    
    setTimeLeft(waitTime);
    setGameState(prev => ({ ...prev, phase: GAME_PHASES.WAITING }));
  };

  const startSelectingPhase = () => {
    setGameState(prev => ({ 
      ...prev, 
      phase: GAME_PHASES.SELECTING,
      selectedItems: []
    }));
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
    const { selectedItems } = gameState;
    const requiredItems = currentQuestion.requiredItems;
    
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
        setGameState(prev => ({
          ...prev,
          phase: GAME_PHASES.INSTRUCTIONS,
          currentQuestionIndex: prev.currentQuestionIndex + 1,
          selectedItems: [],
          isCorrect: null
        }));
        setTimeout(playInstructions, 1000);
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

  const getImagePath = (itemName) => {
    return `/game-images/${itemName.replace(/\s+/g, '-').toLowerCase()}.png`;
  };

  if (!session || !currentQuestion) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-primary mx-auto mb-4"></div>
          <p className="text-2xl font-bold text-text">جاري التحميل...</p>
        </div>
      </div>
    );
  }

  // All display items (required + distractors)
  const allItems = [
    ...currentQuestion.requiredItems,
    ...currentQuestion.distractorItems
  ].sort(() => Math.random() - 0.5); // Shuffle

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
              <h2 className="text-3xl font-bold text-text mb-4 text-center">
                اختر العناصر التي سمعتها
              </h2>
              <p className="text-xl text-gray-600 text-center">
                اختر {currentQuestion.requiredItems.length} عناصر
              </p>
            </div>

            {/* Items Grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {allItems.map((item, index) => {
                const isSelected = gameState.selectedItems.includes(item);
                return (
                  <button
                    key={index}
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
                disabled={gameState.selectedItems.length !== currentQuestion.requiredItems.length}
                className={`
                  px-12 py-6 rounded-2xl text-2xl font-bold
                  transition-all duration-300 transform
                  ${gameState.selectedItems.length === currentQuestion.requiredItems.length
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
