import { useState, useEffect } from 'react';
import { useRoute, useLocation } from 'wouter';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { getStudentById, getStudentSessions } from '../lib/api/students';

const COLORS = ['#4A90E2', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];

export default function StudentDetail() {
  const [, params] = useRoute('/students/:studentId');
  const [, setLocation] = useLocation();
  
  const [student, setStudent] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    loadStudentData();
  }, [params?.studentId]);

  const loadStudentData = async () => {
    try {
      setLoading(true);
      
      const studentData = await getStudentById(params.studentId);
      setStudent(studentData);
      
      const sessionsData = await getStudentSessions(params.studentId);
      setSessions(sessionsData || []);
      
    } catch (error) {
      console.error('Error loading student data:', error);
      alert('حدث خطأ في تحميل بيانات الطالب');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-primary mx-auto mb-4"></div>
          <p className="text-2xl font-bold text-text">جاري التحميل...</p>
        </div>
      </div>
    );
  }

  if (!student) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center">
        <div className="text-center">
          <p className="text-2xl font-bold text-text mb-4">الطالب غير موجود</p>
          <button
            onClick={() => setLocation('/students')}
            className="btn-primary"
          >
            العودة إلى قائمة الطلاب
          </button>
        </div>
      </div>
    );
  }

  const totalSessions = sessions.length;
  const completedSessions = sessions.filter(s => s.status === 'completed').length;
  const averageScore = sessions.length > 0
    ? sessions.reduce((sum, s) => sum + (s.score || 0), 0) / sessions.length
    : 0;
  const totalQuestionsAnswered = sessions.reduce((sum, s) => sum + (s.totalQuestions || 0), 0);
  const totalCorrectAnswers = sessions.reduce((sum, s) => sum + (s.correctAnswers || 0), 0);
  const accuracyRate = totalQuestionsAnswered > 0
    ? (totalCorrectAnswers / totalQuestionsAnswered) * 100
    : 0;

  const progressData = sessions.slice(-10).map((session, index) => ({
    name: \`جلسة \${index + 1}\`,
    score: session.score || 0,
    accuracy: session.totalQuestions > 0 
      ? ((session.correctAnswers / session.totalQuestions) * 100).toFixed(1)
      : 0,
    date: new Date(session.createdAt).toLocaleDateString('ar-EG')
  }));

  return (
    <div className="min-h-screen bg-cream p-4 md:p-8" dir="rtl">
      <div className="max-w-7xl mx-auto mb-8">
        <button
          onClick={() => setLocation('/students')}
          className="mb-4 text-primary hover:text-primary-dark flex items-center gap-2"
        >
          ← العودة إلى قائمة الطلاب
        </button>

        <div className="bg-white rounded-2xl shadow-soft p-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <div className="w-24 h-24 bg-primary rounded-full flex items-center justify-center text-white text-4xl font-bold">
                {student.name.charAt(0)}
              </div>
              <div>
                <h1 className="text-4xl font-bold text-text mb-2">{student.name}</h1>
                <p className="text-xl text-gray-600">رقم الطالب: {student.studentNumber}</p>
              </div>
            </div>
            <div className="text-left">
              <button
                onClick={() => setLocation(\`/game/entry?studentId=\${student.id}\`)}
                className="btn-primary text-xl px-8 py-4"
              >
                بدء جلسة جديدة
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto mb-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white rounded-2xl shadow-soft p-6">
            <div className="text-primary text-4xl mb-2">📊</div>
            <div className="text-3xl font-bold text-text mb-1">{totalSessions}</div>
            <div className="text-gray-600">إجمالي الجلسات</div>
          </div>

          <div className="bg-white rounded-2xl shadow-soft p-6">
            <div className="text-success text-4xl mb-2">✅</div>
            <div className="text-3xl font-bold text-text mb-1">{completedSessions}</div>
            <div className="text-gray-600">جلسات مكتملة</div>
          </div>

          <div className="bg-white rounded-2xl shadow-soft p-6">
            <div className="text-warning text-4xl mb-2">⭐</div>
            <div className="text-3xl font-bold text-text mb-1">{averageScore.toFixed(1)}</div>
            <div className="text-gray-600">متوسط النقاط</div>
          </div>

          <div className="bg-white rounded-2xl shadow-soft p-6">
            <div className="text-primary text-4xl mb-2">🎯</div>
            <div className="text-3xl font-bold text-text mb-1">{accuracyRate.toFixed(1)}%</div>
            <div className="text-gray-600">معدل الدقة</div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-2xl shadow-soft p-8">
          <h2 className="text-2xl font-bold text-text mb-6">تطور الأداء</h2>
          {progressData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={progressData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="score" stroke="#4A90E2" strokeWidth={3} name="النقاط" />
                <Line type="monotone" dataKey="accuracy" stroke="#10B981" strokeWidth={3} name="الدقة %" />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-center text-gray-500 py-12">لا توجد بيانات كافية لعرض الرسم البياني</p>
          )}
        </div>
      </div>
    </div>
  );
}
