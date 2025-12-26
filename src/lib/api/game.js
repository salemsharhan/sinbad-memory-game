import supabaseApi from '../supabaseAxios';
import { nanoid } from 'nanoid';
import gameData from '../../assets/game-data.json';

/**
 * Get game data for a specific level and stage
 */
export const getGameData = (level, stage) => {
  const levels = gameData.levels;
  const levelData = levels[level];
  
  if (!levelData) {
    throw new Error(`Level ${level} not found`);
  }
  
  const stageData = levelData.stages[stage.toString()];
  
  if (!stageData) {
    throw new Error(`Stage ${stage} not found in level ${level}`);
  }
  
  return {
    level,
    stage,
    questions: stageData.questions,
    timingConfigurations: gameData.timingConfigurations,
  };
};

/**
 * Start a new game session
 */
export const startGameSession = async (studentId, level, stage, options = {}) => {
  const sessionId = nanoid();
  
  // Get settings from localStorage or use defaults
  const globalSettings = JSON.parse(localStorage.getItem('gameSettings_global') || '{}');
  const levelSettings = JSON.parse(localStorage.getItem('gameSettings_levels') || '{}');
  
  // Use level-specific settings if available, otherwise use global settings
  const timingMode = options.timingMode || levelSettings[level]?.timingMode || globalSettings.timingMode || 'medium';
  const waitTimer = options.waitTimer !== undefined 
    ? options.waitTimer 
    : (levelSettings[level]?.waitTimer !== undefined 
        ? levelSettings[level].waitTimer 
        : (globalSettings.waitTimer !== undefined ? globalSettings.waitTimer : 5));
  
  const { data, error } = await supabaseApi
    .from('game_sessions')
    .insert({
      session_id: sessionId,
      student_id: studentId,
      level,
      stage,
      status: 'in-progress',
    })
    .select()
    .single();
  
  if (error) {
    console.error('Error starting game session:', error);
    throw error;
  }
  
  // Return session data with settings
  return {
    ...data,
    timingMode,
    waitTimer
  };
};

/**
 * Complete a game session
 */
export const completeGameSession = async (sessionId, durationSeconds) => {
  const { data, error} = await supabaseApi
    .from('game_sessions')
    .update({
      status: 'completed',
      end_time: new Date().toISOString(),
      duration_seconds: durationSeconds,
    })
    .eq('session_id', sessionId)
    .select()
    .single();
  
  if (error) {
    console.error('Error completing game session:', error);
    throw error;
  }
  
  return data;
};

/**
 * Save a game result (simplified wrapper for GamePlay component)
 */
export const saveGameResult = async (resultData) => {
  // First, get the session to extract needed data
  const { data: session, error: sessionError } = await supabaseApi
    .from('game_sessions')
    .select('*')
    .eq('session_id', resultData.sessionId)
    .single();
  
  if (sessionError) {
    console.error('Error finding session:', sessionError);
    throw sessionError;
  }
  
  // Parse required and selected items
  const requiredItems = typeof resultData.requiredItems === 'string' 
    ? resultData.requiredItems.split(',') 
    : resultData.requiredItems;
  const selectedItems = typeof resultData.selectedItems === 'string'
    ? resultData.selectedItems.split(',')
    : resultData.selectedItems;
  
  // Calculate statistics
  const totalItems = requiredItems.length;
  const correctSelections = selectedItems.filter(item => requiredItems.includes(item)).length;
  const score = resultData.isCorrect ? 1 : 0;
  
  // Submit the result directly
  const { data: sessionData, error: sessionDataError } = await supabaseApi
    .from('game_sessions')
    .select('id')
    .eq('session_id', resultData.sessionId)
    .single();
  
  if (sessionDataError) {
    console.error('Error finding session:', sessionDataError);
    throw sessionDataError;
  }
  
  const { data, error } = await supabaseApi
    .from('game_results')
    .insert({
      session_id: sessionData.id,
      student_id: session.student_id,
      level: session.level,
      stage: session.stage,
      question_number: resultData.questionNumber,
      required_items: requiredItems,
      selected_items: selectedItems,
      correct_selections: correctSelections,
      total_items: totalItems,
      score: score,
      is_correct: resultData.isCorrect,
    })
    .select()
    .single();
  
  if (error) {
    console.error('Error saving game result:', error);
    throw error;
  }
  
  return data;
};

/**
 * Submit a game result for a question
 */
export const submitGameResult = async (resultData) => {
  // First, get the session to get its UUID
  const { data: session, error: sessionError } = await supabaseApi
    .from('game_sessions')
    .select('id')
    .eq('session_id', resultData.sessionId)
    .single();
  
  if (sessionError) {
    console.error('Error finding session:', sessionError);
    throw sessionError;
  }
  
  const { data, error } = await supabaseApi
    .from('game_results')
    .insert({
      session_id: session.id,
      student_id: resultData.studentId,
      level: resultData.level,
      stage: resultData.stage,
      question_number: resultData.questionNumber,
      required_items: resultData.requiredItems,
      selected_items: resultData.selectedItems,
      correct_selections: resultData.correctSelections,
      total_items: resultData.totalItems,
      score: resultData.score,
      is_correct: resultData.isCorrect,
    })
    .select()
    .single();
  
  if (error) {
    console.error('Error submitting game result:', error);
    throw error;
  }
  
  return data;
};

/**
 * Get results for a game session
 */
export const getSessionResults = async (sessionId) => {
  // First, get the session UUID
  const { data: session, error: sessionError } = await supabaseApi
    .from('game_sessions')
    .select('id')
    .eq('session_id', sessionId)
    .single();
  
  if (sessionError) {
    console.error('Error finding session:', sessionError);
    return [];
  }
  
  const result = await supabaseApi
    .from('game_results')
    .select('*')
    .eq('session_id', session.id)
    .order('question_number', { ascending: true });
  
  const { data, error } = await result;
  
  if (error) {
    console.error('Error fetching session results:', error);
    throw error;
  }
  
  return data;
};

/**
 * Get level configuration for a teacher
 */
export const getLevelConfiguration = async (teacherId, level, stage) => {
  // First query for teacher_id and level
  const { data: levelData, error: levelError } = await supabaseApi
    .from('level_configurations')
    .select('*')
    .eq('teacher_id', teacherId)
    .eq('level', level)
    .then((result) => result);
  
  if (levelError) {
    console.error('Error fetching level configuration:', levelError);
    // Return default configuration if not found
    return {
      timing_mode: 'medium',
      waiting_time_seconds: 5,
      audio_enabled: true,
    };
  }
  
  // Filter by stage in JavaScript since we can't chain multiple eq filters easily
  const config = levelData?.find(c => c.stage === stage);
  
  return config || {
    timing_mode: 'medium',
    waiting_time_seconds: 5,
    audio_enabled: true,
  };
};

/**
 * Update or create level configuration
 */
export const upsertLevelConfiguration = async (teacherId, configData) => {
  const { data, error } = await supabaseApi
    .from('level_configurations')
    .upsert({
      teacher_id: teacherId,
      level: configData.level,
      stage: configData.stage,
      timing_mode: configData.timingMode,
      waiting_time_seconds: configData.waitingTimeSeconds,
      audio_enabled: configData.audioEnabled,
    }, {
      onConflict: 'teacher_id,level,stage'
    })
    .select()
    .single();
  
  if (error) {
    console.error('Error upserting level configuration:', error);
    throw error;
  }
  
  return data;
};

/**
 * Create an achievement record
 */
export const createAchievement = async (achievementData) => {
  const { data, error } = await supabaseApi
    .from('achievements')
    .insert(achievementData)
    .select()
    .single();
  
  if (error) {
    console.error('Error creating achievement:', error);
    throw error;
  }
  
  return data;
};

/**
 * Get a game session by session ID
 */
export const getSessionById = async (sessionId) => {
  const { data: session, error: sessionError } = await supabaseApi
    .from('game_sessions')
    .select('*')
    .eq('session_id', sessionId)
    .single();
  
  if (sessionError) {
    console.error('Error finding session:', sessionError);
    throw sessionError;
  }
  
  // Get results for this session
  const result = await supabaseApi
    .from('game_results')
    .select('*')
    .eq('session_id', session.id)
    .order('question_number', { ascending: true });
  
  const { data: results, error: resultsError } = await result;
  
  if (resultsError) {
    console.error('Error fetching session results:', resultsError);
  }
  
  // Calculate summary statistics
  const totalQuestions = results?.length || 0;
  const correctAnswers = results?.filter(r => r.is_correct).length || 0;
  const totalScore = results?.reduce((sum, r) => sum + (r.score || 0), 0) || 0;
  
  return {
    ...session,
    results: results || [],
    totalQuestions,
    correctAnswers,
    score: totalScore,
    accuracy: totalQuestions > 0 ? (correctAnswers / totalQuestions) * 100 : 0
  };
};
