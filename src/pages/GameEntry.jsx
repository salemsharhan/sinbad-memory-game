import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getStudentById } from '../lib/api/students';
import { startGameSession } from '../lib/api/game';
import gameData from '../assets/game-data.json';

const GameEntry = () => {
  const { studentId } = useParams();
  const navigate = useNavigate();
  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  
  // Student-specific settings
  const [studentSettings, setStudentSettings] = useState({
    A: { timingMode: 'short', waitTimer: 5 },
    B: { timingMode: 'short', waitTimer: 5 },
    C: { timingMode: 'short', waitTimer: 5 }
  });

  useEffect(() => {
    loadStudent();
    loadStudentSettings();
  }, [studentId]);

  const loadStudentSettings = () => {
    // Load student-specific settings from localStorage
    const saved = localStorage.getItem(`studentSettings_${studentId}`);
    if (saved) {
      setStudentSettings(JSON.parse(saved));
    } else {
      // Load global level settings as defaults
      const globalLevels = JSON.parse(localStorage.getItem('gameSettings_levels') || '{}');
      if (Object.keys(globalLevels).length > 0) {
        setStudentSettings(globalLevels);
      }
    }
  };

  const loadStudent = async () => {
    try {
      setLoading(true);
      // studentId from URL might be the student_id (string) or UUID
      // Try to get by student_id first, then by UUID
      let studentData = null;
      try {
        // If it looks like a UUID, try that first
        if (studentId.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
          studentData = await getStudentById(studentId);
        } else {
          // Otherwise, it's probably a student_id string
          // We need to query by student_id - let me check the API
          const { default: supabaseApi } = await import('../lib/supabaseAxios');
          const result = await supabaseApi
            .from('students')
            .select('*')
            .eq('student_id', studentId)
            .single();
          
          if (result.data) {
            studentData = result.data;
          }
        }
      } catch (err) {
        console.error('Error loading student:', err);
      }
      
      if (studentData) {
        setStudent(studentData);
      } else {
        alert('الطالب غير موجود');
      }
    } catch (error) {
      console.error('Error loading student:', error);
      alert('حدث خطأ في تحميل بيانات الطالب');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSettings = () => {
    // Save student-specific settings
    localStorage.setItem(`studentSettings_${studentId}`, JSON.stringify(studentSettings));
    alert('تم حفظ الإعدادات بنجاح');
  };

  const handleStartGame = async () => {
    if (!student) {
      alert('الطالب غير موجود');
      return;
    }

    // If settings not shown yet, show them first
    if (!showSettings) {
      setShowSettings(true);
      return;
    }

    try {
      setStarting(true);
      
      // Get student's current level and stage
      const level = student.current_level || 'A';
      const stage = student.current_stage || 1;
      
      // Get settings for this level
      const levelSettings = studentSettings[level] || { timingMode: 'medium', waitTimer: 5 };
      
      // Start a new game session with student settings
      const session = await startGameSession(student.id, level, stage, {
        timingMode: levelSettings.timingMode,
        waitTimer: levelSettings.waitTimer
      });
      
      // Store session data in localStorage for GamePlay to use
      const sessionData = {
        id: session.id,
        sessionId: session.session_id,
        studentId: student.id,
        studentName: student.name,
        level: session.level,
        stage: session.stage,
        status: session.status,
        timingMode: session.timingMode || levelSettings.timingMode,
        waitTimer: session.waitTimer !== undefined ? session.waitTimer : levelSettings.waitTimer
      };
      localStorage.setItem(`session_${session.session_id}`, JSON.stringify(sessionData));
      
      // Navigate to gameplay
      navigate(`/game/play/${session.session_id}`);
    } catch (error) {
      console.error('Error starting game:', error);
      alert('حدث خطأ في بدء اللعبة. يرجى المحاولة مرة أخرى.');
      setStarting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-cream-500 flex items-center justify-center">
        <div className="text-center">
          <div className="spinner mb-4"></div>
          <p className="text-child-lg">جاري التحميل...</p>
        </div>
      </div>
    );
  }

  if (!student) {
    return (
      <div className="min-h-screen bg-cream-500 flex items-center justify-center">
        <div className="card max-w-2xl text-center">
          <h2 className="text-child-xl font-bold text-error mb-4">الطالب غير موجود</h2>
          <p className="text-child-base text-gray-700">رقم الطالب المدخل غير صحيح</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cream p-4 md:p-8" dir="rtl">
      <div className="max-w-4xl mx-auto">
        {/* Student Info Card */}
        <div className="bg-white rounded-2xl shadow-soft p-8 mb-6">
          <h1 className="text-3xl font-bold text-center text-text mb-6">
            مرحباً بك في برنامج السندباد
          </h1>
          <div className="text-center space-y-2 mb-6">
            <p className="text-xl text-gray-700">
              اسم الطالب: <span className="font-bold">{student.name}</span>
            </p>
            <p className="text-lg text-gray-600">
              رقم الطالب: {student.student_id || studentId}
            </p>
            <p className="text-lg text-gray-600">
              المستوى: {student.current_level || 'A'} - المرحلة: {student.current_stage || 1}
            </p>
          </div>
        </div>

        {/* Settings Section */}
        {showSettings && (
          <div className="bg-white rounded-2xl shadow-soft p-8 mb-6">
            <h2 className="text-2xl font-bold text-text mb-6 text-center">
              إعدادات اللعبة
            </h2>
            
            {/* Settings for each level */}
            {['A', 'B', 'C'].map((level) => (
              <div key={level} className="mb-8 last:mb-0 border-b border-gray-200 last:border-0 pb-8 last:pb-0">
                <h3 className="text-xl font-bold text-text mb-4">
                  {level === 'A' && '(الأسهل) '}
                  {level === 'B' && '(متوسط) '}
                  {level === 'C' && '(الأصعب) '}
                  إعدادات المستوى {level}
                </h3>

                {/* Image Display Period */}
                <div className="mb-6">
                  <label className="block text-lg font-bold text-text mb-3">
                    فترة عرض الصور
                  </label>
                  <div className="flex gap-4">
                    {['long', 'short'].map((mode) => (
                      <button
                        key={mode}
                        onClick={() =>
                          setStudentSettings({
                            ...studentSettings,
                            [level]: { ...studentSettings[level], timingMode: mode }
                          })
                        }
                        className={`px-6 py-3 rounded-lg font-bold transition-all border-2 ${
                          studentSettings[level].timingMode === mode
                            ? 'bg-blue-600 text-white border-blue-700 shadow-lg'
                            : 'bg-gray-100 text-gray-800 border-gray-300 hover:bg-gray-200'
                        }`}
                      >
                        {mode === 'long' ? 'طويل' : 'قصير'}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Wait Timer */}
                <div className="mb-4">
                  <label className="block text-lg font-bold text-text mb-3">
                    مؤقت التوقف قبل عرض الصور
                  </label>
                  <div className="flex items-center gap-4">
                    <span className="text-sm text-gray-600 min-w-[80px]">
                      {studentSettings[level].waitTimer} ثانية
                    </span>
                    <div className="flex-1 relative">
                      <input
                        type="range"
                        min="0"
                        max="15"
                        value={studentSettings[level].waitTimer}
                        onChange={(e) => {
                          const value = parseInt(e.target.value);
                          setStudentSettings({
                            ...studentSettings,
                            [level]: {
                              ...studentSettings[level],
                              waitTimer: value
                            }
                          });
                        }}
                        style={{
                          width: '100%'
                        }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            ))}

            <div className="flex gap-4 justify-center mt-6">
              <button
                onClick={handleSaveSettings}
                className="px-8 py-4 bg-gray-500 text-white rounded-xl font-bold text-lg hover:bg-gray-600 transition-all"
              >
                حفظ الإعدادات
              </button>
            </div>
          </div>
        )}

        {/* Start Button */}
        <div className="text-center">
          <button 
            className="px-12 py-6 bg-primary text-white rounded-xl font-bold text-xl hover:bg-primary-dark transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={handleStartGame}
            disabled={starting}
          >
            {starting ? 'جاري البدء...' : showSettings ? 'ابدأ اللعب' : 'تعديل الإعدادات'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default GameEntry;
