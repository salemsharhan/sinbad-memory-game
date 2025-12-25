import supabaseApi from '../supabaseAxios';

/**
 * Get all students for the current teacher
 */
export const getAllStudents = async (teacherId) => {
  const result = await supabaseApi
    .from('students')
    .select('*')
    .eq('teacher_id', teacherId)
    .order('created_at', { ascending: false });
  
  const { data, error } = await result;
  
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
  const { data, error } = await supabaseApi
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
  const { data, error } = await supabaseApi
    .from('students')
    .insert(studentData)
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
  const { data, error } = await supabaseApi
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
  const { error } = await supabaseApi
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
  const result = await supabaseApi
    .from('game_sessions')
    .select('*')
    .eq('student_id', studentId)
    .order('created_at', { ascending: false });
  
  const { data, error } = await result;
  
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
  const result = await supabaseApi
    .from('achievements')
    .select('*')
    .eq('student_id', studentId)
    .order('completed_at', { ascending: false });
  
  const { data, error } = await result;
  
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
  // Get all completed sessions - need to filter by status in code since we can't chain multiple eq
  const result = await supabaseApi
    .from('game_sessions')
    .select('*')
    .eq('student_id', studentId)
    .order('created_at', { ascending: false });
  
  const { data: allSessions, error: sessionsError } = await result;
  
  if (sessionsError) {
    console.error('Error fetching student progress:', sessionsError);
    throw sessionsError;
  }
  
  // Filter completed sessions
  const sessions = allSessions?.filter(s => s.status === 'completed') || [];
  
  // Get results for all sessions
  const sessionIds = sessions.map(s => s.id);
  const allResults = [];
  
  for (const sessionId of sessionIds) {
    const result = await supabaseApi
      .from('game_results')
      .select('*')
      .eq('session_id', sessionId);
    
    const { data: results } = await result;
    
    if (results) {
      allResults.push(...results);
    }
  }
  
  // Attach results to sessions
  const sessionsWithResults = sessions.map(session => ({
    ...session,
    game_results: allResults.filter(r => r.session_id === session.id)
  }));
  
  // Calculate statistics
  const totalSessions = sessions.length;
  const totalQuestions = allResults.length;
  const correctAnswers = allResults.filter(r => r.is_correct).length;
  const averageScore = totalQuestions > 0 
    ? Math.round((correctAnswers / totalQuestions) * 100) 
    : 0;
  
  return {
    totalSessions,
    totalQuestions,
    correctAnswers,
    averageScore,
    sessions: sessionsWithResults,
  };
};
