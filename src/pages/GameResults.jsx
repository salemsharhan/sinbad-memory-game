import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Certificate from '../components/Certificate';
import { getSessionById } from '../lib/api/game';
import { getStudentById } from '../lib/api/students';

export default function GameResults() {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  
  const [session, setSession] = useState(null);
  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showCertificate, setShowCertificate] = useState(false);

  useEffect(() => {
    loadResults();
  }, [sessionId]);

  const loadResults = async () => {
    try {
      setLoading(true);
      const sessionData = await getSessionById(sessionId);
      setSession(sessionData);
      if (sessionData.studentId) {
        const studentData = await getStudentById(sessionData.studentId);
        setStudent(studentData);
      }
    } catch (error) {
      console.error('Error loading results:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-primary"></div>
      </div>
    );
  }

  if (!session) return null;

  const accuracy = session.totalQuestions > 0
    ? (session.correctAnswers / session.totalQuestions) * 100
    : 0;
  const isPassed = accuracy >= 60;

  return (
    <div className="min-h-screen bg-cream p-4 md:p-8" dir="rtl">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <div className="text-8xl mb-6">{isPassed ? '🎉' : '💪'}</div>
          <h1 className="text-5xl font-bold text-text mb-4">
            {isPassed ? 'أحسنت!' : 'استمر في المحاولة!'}
          </h1>
        </div>

        <div className="bg-white rounded-2xl shadow-soft p-8 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center bg-gray-50 rounded-xl p-6">
              <div className="text-5xl font-bold text-primary">{session.score}</div>
              <div className="text-xl text-gray-600">النقاط</div>
            </div>
            <div className="text-center bg-gray-50 rounded-xl p-6">
              <div className="text-5xl font-bold text-success">{accuracy.toFixed(0)}%</div>
              <div className="text-xl text-gray-600">الدقة</div>
            </div>
            <div className="text-center bg-gray-50 rounded-xl p-6">
              <div className="text-5xl font-bold text-warning">
                {session.correctAnswers}/{session.totalQuestions}
              </div>
              <div className="text-xl text-gray-600">إجابات صحيحة</div>
            </div>
          </div>
        </div>

        <div className="flex flex-col md:flex-row gap-4 justify-center">
          {isPassed && student && (
            <button
              onClick={() => setShowCertificate(true)}
              className="btn-primary text-xl px-8 py-4"
            >
              🏆 عرض الشهادة
            </button>
          )}
          <button
            onClick={() => navigate('/dashboard')}
            className="btn-secondary text-xl px-8 py-4"
          >
            العودة إلى لوحة التحكم
          </button>
        </div>
      </div>

      {showCertificate && student && (
        <Certificate
          student={student}
          session={session}
          onClose={() => setShowCertificate(false)}
        />
      )}
    </div>
  );
}
