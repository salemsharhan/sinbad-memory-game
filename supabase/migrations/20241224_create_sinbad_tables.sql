-- ==========================================
-- SINBAD MEMORY GAME DATABASE SCHEMA
-- Supabase (PostgreSQL) Migration
-- ==========================================

-- ==========================================
-- TEACHERS/ADMIN USERS TABLE
-- ==========================================
CREATE TABLE IF NOT EXISTS public.teachers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  auth_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  full_name TEXT NOT NULL,
  email VARCHAR(320),
  role VARCHAR(50) DEFAULT 'teacher' CHECK (role IN ('admin', 'teacher')),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==========================================
-- STUDENTS TABLE
-- ==========================================
CREATE TABLE IF NOT EXISTS public.students (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id VARCHAR(100) NOT NULL UNIQUE,
  name TEXT NOT NULL,
  teacher_id UUID REFERENCES public.teachers(id) ON DELETE SET NULL,
  current_level VARCHAR(1) DEFAULT 'A' CHECK (current_level IN ('A', 'B', 'C')),
  current_stage INTEGER DEFAULT 1 CHECK (current_stage BETWEEN 1 AND 3),
  total_sessions INTEGER DEFAULT 0,
  average_score DECIMAL(5,2) DEFAULT 0,
  last_played_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==========================================
-- GAME SESSIONS TABLE
-- ==========================================
CREATE TABLE IF NOT EXISTS public.game_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id VARCHAR(100) NOT NULL UNIQUE,
  student_id UUID REFERENCES public.students(id) ON DELETE CASCADE NOT NULL,
  level VARCHAR(1) NOT NULL CHECK (level IN ('A', 'B', 'C')),
  stage INTEGER NOT NULL CHECK (stage BETWEEN 1 AND 3),
  status VARCHAR(50) DEFAULT 'in-progress' CHECK (status IN ('in-progress', 'completed', 'abandoned')),
  start_time TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  end_time TIMESTAMP WITH TIME ZONE,
  duration_seconds INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==========================================
-- GAME RESULTS TABLE
-- ==========================================
CREATE TABLE IF NOT EXISTS public.game_results (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID REFERENCES public.game_sessions(id) ON DELETE CASCADE NOT NULL,
  student_id UUID REFERENCES public.students(id) ON DELETE CASCADE NOT NULL,
  level VARCHAR(1) NOT NULL CHECK (level IN ('A', 'B', 'C')),
  stage INTEGER NOT NULL CHECK (stage BETWEEN 1 AND 3),
  question_number INTEGER NOT NULL,
  required_items JSONB NOT NULL,
  selected_items JSONB NOT NULL,
  correct_selections INTEGER NOT NULL,
  total_items INTEGER NOT NULL,
  score INTEGER NOT NULL,
  is_correct BOOLEAN NOT NULL,
  completed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==========================================
-- LEVEL CONFIGURATIONS TABLE
-- ==========================================
CREATE TABLE IF NOT EXISTS public.level_configurations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  teacher_id UUID REFERENCES public.teachers(id) ON DELETE CASCADE NOT NULL,
  level VARCHAR(1) NOT NULL CHECK (level IN ('A', 'B', 'C')),
  stage INTEGER NOT NULL CHECK (stage BETWEEN 1 AND 3),
  timing_mode VARCHAR(10) DEFAULT 'medium' CHECK (timing_mode IN ('short', 'medium', 'long')),
  waiting_time_seconds INTEGER DEFAULT 5,
  audio_enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(teacher_id, level, stage)
);

-- ==========================================
-- ACHIEVEMENTS TABLE (for certificates)
-- ==========================================
CREATE TABLE IF NOT EXISTS public.achievements (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID REFERENCES public.students(id) ON DELETE CASCADE NOT NULL,
  level VARCHAR(1) NOT NULL CHECK (level IN ('A', 'B', 'C')),
  stage INTEGER NOT NULL CHECK (stage BETWEEN 1 AND 3),
  completed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  score INTEGER NOT NULL,
  certificate_generated BOOLEAN DEFAULT false,
  certificate_url TEXT
);

-- ==========================================
-- INDEXES FOR PERFORMANCE
-- ==========================================
CREATE INDEX idx_students_teacher_id ON public.students(teacher_id);
CREATE INDEX idx_students_student_id ON public.students(student_id);
CREATE INDEX idx_game_sessions_student_id ON public.game_sessions(student_id);
CREATE INDEX idx_game_sessions_session_id ON public.game_sessions(session_id);
CREATE INDEX idx_game_sessions_status ON public.game_sessions(status);
CREATE INDEX idx_game_results_session_id ON public.game_results(session_id);
CREATE INDEX idx_game_results_student_id ON public.game_results(student_id);
CREATE INDEX idx_achievements_student_id ON public.achievements(student_id);

-- ==========================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ==========================================

-- Enable RLS on all tables
ALTER TABLE public.teachers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.game_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.game_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.level_configurations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.achievements ENABLE ROW LEVEL SECURITY;

-- Teachers table policies
CREATE POLICY "Teachers can view their own profile"
  ON public.teachers FOR SELECT
  USING (auth.uid() = auth_user_id);

CREATE POLICY "Teachers can update their own profile"
  ON public.teachers FOR UPDATE
  USING (auth.uid() = auth_user_id);

-- Students table policies
CREATE POLICY "Teachers can view their own students"
  ON public.students FOR SELECT
  USING (teacher_id IN (SELECT id FROM public.teachers WHERE auth_user_id = auth.uid()));

CREATE POLICY "Teachers can insert students"
  ON public.students FOR INSERT
  WITH CHECK (teacher_id IN (SELECT id FROM public.teachers WHERE auth_user_id = auth.uid()));

CREATE POLICY "Teachers can update their own students"
  ON public.students FOR UPDATE
  USING (teacher_id IN (SELECT id FROM public.teachers WHERE auth_user_id = auth.uid()));

CREATE POLICY "Teachers can delete their own students"
  ON public.students FOR DELETE
  USING (teacher_id IN (SELECT id FROM public.teachers WHERE auth_user_id = auth.uid()));

-- Game sessions policies
CREATE POLICY "Teachers can view sessions of their students"
  ON public.game_sessions FOR SELECT
  USING (student_id IN (
    SELECT id FROM public.students 
    WHERE teacher_id IN (SELECT id FROM public.teachers WHERE auth_user_id = auth.uid())
  ));

CREATE POLICY "Anyone can create game sessions"
  ON public.game_sessions FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Anyone can update game sessions"
  ON public.game_sessions FOR UPDATE
  USING (true);

-- Game results policies
CREATE POLICY "Teachers can view results of their students"
  ON public.game_results FOR SELECT
  USING (student_id IN (
    SELECT id FROM public.students 
    WHERE teacher_id IN (SELECT id FROM public.teachers WHERE auth_user_id = auth.uid())
  ));

CREATE POLICY "Anyone can insert game results"
  ON public.game_results FOR INSERT
  WITH CHECK (true);

-- Level configurations policies
CREATE POLICY "Teachers can view their own configurations"
  ON public.level_configurations FOR SELECT
  USING (teacher_id IN (SELECT id FROM public.teachers WHERE auth_user_id = auth.uid()));

CREATE POLICY "Teachers can manage their own configurations"
  ON public.level_configurations FOR ALL
  USING (teacher_id IN (SELECT id FROM public.teachers WHERE auth_user_id = auth.uid()));

-- Achievements policies
CREATE POLICY "Teachers can view achievements of their students"
  ON public.achievements FOR SELECT
  USING (student_id IN (
    SELECT id FROM public.students 
    WHERE teacher_id IN (SELECT id FROM public.teachers WHERE auth_user_id = auth.uid())
  ));

CREATE POLICY "Anyone can insert achievements"
  ON public.achievements FOR INSERT
  WITH CHECK (true);

-- ==========================================
-- FUNCTIONS AND TRIGGERS
-- ==========================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_teachers_updated_at
  BEFORE UPDATE ON public.teachers
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_students_updated_at
  BEFORE UPDATE ON public.students
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_level_configurations_updated_at
  BEFORE UPDATE ON public.level_configurations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Function to automatically create teacher profile after user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.teachers (auth_user_id, full_name, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    NEW.email
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create teacher profile on signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();
