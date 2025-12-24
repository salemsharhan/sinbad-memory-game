import { supabase } from '../supabaseClient';

/**
 * Get all students for the current teacher
 */
export const getAllStudents = async (teacherId) => {
  const { data, error } = await supabase
    .from('students')
    .select('*')
    .eq('teacher_id', teacherId)
    .order('created_at', { ascending: false });
  
  if (error) {
    console.error('Error fetching students:', error);
    throw error;
  }
  return data;
};

/**
 * Get a single student by ID
 */
export const getStudentById = async (studentId) => {
  const { data, error } = await supabase
    .from('students')
    .select('*')
    .eq('id', studentId)
    .single();
  
  if (error) {
    console.error('Error fetching student:', error);
    throw error;
  }
  return data;
};

/**
 * Create a new student
 */
export const createStudent = async (studentData) => {
  const { data, error } = await supabase
    .from('students')
    .insert([studentData])
    .select()
    .single();
  
  if (error) {
    console.error('Error creating student:', error);
    throw error;
  }
  return data;
};

/**
 * Update student information
 */
export const updateStudent = async (studentId, updates) => {
  const { data, error } = await supabase
    .from('students')
    .update(updates)
    .eq('id', studentId)
    .select()
    .single();
  
  if (error) {
    console.error('Error updating student:', error);
    throw error;
  }
  return data;
};

/**
 * Delete a student
 */
export const deleteStudent = async (studentId) => {
  const { error } = await supabase
    .from('students')
    .delete()
    .eq('id', studentId);
  
  if (error) {
    console.error('Error deleting student:', error);
    throw error;
  }
  return true;
};

/**
 * Get student's game sessions
 */
export const getStudentSessions = async (studentId) => {
  const { data, error } = await supabase
    .from('game_sessions')
    .select('*')
    .eq('student_id', studentId)
    .order('created_at', { ascending: false });
  
  if (error) {
    console.error('Error fetching student sessions:', error);
    throw error;
  }
  return data;
};

/**
 * Get student's achievements
 */
export const getStudentAchievements = async (studentId) => {
  const { data, error } = await supabase
    .from('achievements')
    .select('*')
    .eq('student_id', studentId)
    .order('completed_at', { ascending: false });
  
  if (error) {
    console.error('Error fetching student achievements:', error);
    throw error;
  }
  return data;
};

/**
 * Get student progress statistics
 */
export const getStudentProgress = async (studentId) => {
  // Get all completed sessions
  const { data: sessions, error: sessionsError } = await supabase
    .from('game_sessions')
    .select('*, game_results(*)')
    .eq('student_id', studentId)
    .eq('status', 'completed');
  
  if (sessionsError) {
    console.error('Error fetching student progress:', sessionsError);
    throw sessionsError;
  }
  
  // Calculate statistics
  const totalSessions = sessions.length;
  const totalQuestions = sessions.reduce((sum, session) => 
    sum + (session.game_results?.length || 0), 0
  );
  const correctAnswers = sessions.reduce((sum, session) => 
    sum + (session.game_results?.filter(r => r.is_correct).length || 0), 0
  );
  const averageScore = totalQuestions > 0 
    ? Math.round((correctAnswers / totalQuestions) * 100) 
    : 0;
  
  return {
    totalSessions,
    totalQuestions,
    correctAnswers,
    averageScore,
    sessions,
  };
};
