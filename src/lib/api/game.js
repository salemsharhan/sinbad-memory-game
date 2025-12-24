import { supabase } from '../supabaseClient';
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
export const startGameSession = async (studentId, level, stage) => {
  const sessionId = nanoid();
  
  const { data, error } = await supabase
    .from('game_sessions')
    .insert([{
      session_id: sessionId,
      student_id: studentId,
      level,
      stage,
      status: 'in-progress',
    }])
    .select()
    .single();
  
  if (error) {
    console.error('Error starting game session:', error);
    throw error;
  }
  
  return data;
};

/**
 * Complete a game session
 */
export const completeGameSession = async (sessionId, durationSeconds) => {
  const { data, error} = await supabase
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
 * Submit a game result for a question
 */
export const submitGameResult = async (resultData) => {
  // First, get the session to get its UUID
  const { data: session, error: sessionError } = await supabase
    .from('game_sessions')
    .select('id')
    .eq('session_id', resultData.sessionId)
    .single();
  
  if (sessionError) {
    console.error('Error finding session:', sessionError);
    throw sessionError;
  }
  
  const { data, error } = await supabase
    .from('game_results')
    .insert([{
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
    }])
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
  const { data: session, error: sessionError } = await supabase
    .from('game_sessions')
    .select('id')
    .eq('session_id', sessionId)
    .single();
  
  if (sessionError) {
    console.error('Error finding session:', sessionError);
    return [];
  }
  
  const { data, error } = await supabase
    .from('game_results')
    .select('*')
    .eq('session_id', session.id)
    .order('question_number', { ascending: true });
  
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
  const { data, error } = await supabase
    .from('level_configurations')
    .select('*')
    .eq('teacher_id', teacherId)
    .eq('level', level)
    .eq('stage', stage)
    .single();
  
  if (error && error.code !== 'PGRST116') { // PGRST116 is "not found" error
    console.error('Error fetching level configuration:', error);
    throw error;
  }
  
  // Return default configuration if not found
  return data || {
    timing_mode: 'medium',
    waiting_time_seconds: 5,
    audio_enabled: true,
  };
};

/**
 * Update or create level configuration
 */
export const upsertLevelConfiguration = async (teacherId, configData) => {
  const { data, error } = await supabase
    .from('level_configurations')
    .upsert([{
      teacher_id: teacherId,
      level: configData.level,
      stage: configData.stage,
      timing_mode: configData.timingMode,
      waiting_time_seconds: configData.waitingTimeSeconds,
      audio_enabled: configData.audioEnabled,
    }], {
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
  const { data, error } = await supabase
    .from('achievements')
    .insert([achievementData])
    .select()
    .single();
  
  if (error) {
    console.error('Error creating achievement:', error);
    throw error;
  }
  
  return data;
};
