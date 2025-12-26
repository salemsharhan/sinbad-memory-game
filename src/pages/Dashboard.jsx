import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { getAllStudents } from '../lib/api/students';
import { Users, Settings, LogOut, TrendingUp, Award, Clock } from 'lucide-react';

const Dashboard = () => {
  const { teacher, signOut, loading: authLoading } = useAuth();
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalStudents: 0,
    activeSessions: 0,
    completedGames: 0,
    averageScore: 0,
  });
  const navigate = useNavigate();

  useEffect(() => {
    // Wait for auth to finish loading, then load dashboard data
    if (!authLoading) {
      if (teacher) {
        loadDashboardData();
      } else {
        // Teacher profile doesn't exist, but user is authenticated
        // Show dashboard with empty state
        setLoading(false);
      }
    }
  }, [teacher, authLoading]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const studentsData = await getAllStudents(teacher.id);
      setStudents(studentsData);
      
      // Calculate stats
      const totalStudents = studentsData.length;
      const totalSessions = studentsData.reduce((sum, s) => sum + (s.total_sessions || 0), 0);
      const avgScore = studentsData.reduce((sum, s) => sum + (s.average_score || 0), 0) / (totalStudents || 1);
      
      setStats({
        totalStudents,
        activeSessions: totalSessions,
        completedGames: totalSessions,
        averageScore: Math.round(avgScore),
      });
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate('/login');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  // Show loading only if auth is still loading or dashboard data is loading
  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="spinner mb-4"></div>
          <p className="text-child-lg">جاري التحميل...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cream-500">
      {/* Header */}
      <header className="bg-white shadow-child">
        <div className="container mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-child-2xl font-extrabold text-gray-900">
                لوحة التحكم - برنامج السندباد
              </h1>
              <p className="text-child-base text-gray-600 mt-1">
                مرحباً، {teacher?.full_name || 'المعلم'}
              </p>
            </div>
            <button
              onClick={handleSignOut}
              className="btn-secondary flex items-center gap-2"
            >
              <LogOut size={20} />
              تسجيل الخروج
            </button>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <nav className="bg-white border-b-2 border-beige-300">
        <div className="container mx-auto px-6">
          <div className="flex gap-4">
            <Link
              to="/dashboard"
              className="px-6 py-4 text-child-base font-bold text-primary-600 border-b-4 border-primary-600"
            >
              الرئيسية
            </Link>
            <Link
              to="/students"
              className="px-6 py-4 text-child-base font-bold text-gray-700 hover:text-primary-600 hover:border-b-4 hover:border-primary-300 transition-all"
            >
              الطلاب
            </Link>
            <Link
              to="/settings"
              className="px-6 py-4 text-child-base font-bold text-gray-700 hover:text-primary-600 hover:border-b-4 hover:border-primary-300 transition-all"
            >
              الإعدادات
            </Link>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-8">
        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="card bg-gradient-to-br from-primary-50 to-primary-100 border-primary-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-child-sm text-primary-700 font-bold mb-2">
                  إجمالي الطلاب
                </p>
                <p className="text-child-3xl font-extrabold text-primary-900">
                  {stats.totalStudents}
                </p>
              </div>
              <div className="bg-primary-500 p-4 rounded-child-lg">
                <Users size={32} className="text-white" />
              </div>
            </div>
          </div>

          <div className="card bg-gradient-to-br from-success-50 to-success-100 border-success-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-child-sm text-success-700 font-bold mb-2">
                  الجلسات المكتملة
                </p>
                <p className="text-child-3xl font-extrabold text-success-900">
                  {stats.completedGames}
                </p>
              </div>
              <div className="bg-success-500 p-4 rounded-child-lg">
                <Award size={32} className="text-white" />
              </div>
            </div>
          </div>

          <div className="card bg-gradient-to-br from-beige-200 to-beige-300 border-beige-400">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-child-sm text-gray-700 font-bold mb-2">
                  متوسط الدرجات
                </p>
                <p className="text-child-3xl font-extrabold text-gray-900">
                  {stats.averageScore}%
                </p>
              </div>
              <div className="bg-beige-600 p-4 rounded-child-lg">
                <TrendingUp size={32} className="text-white" />
              </div>
            </div>
          </div>

          <div className="card bg-gradient-to-br from-cream-300 to-cream-400 border-cream-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-child-sm text-gray-700 font-bold mb-2">
                  الجلسات النشطة
                </p>
                <p className="text-child-3xl font-extrabold text-gray-900">
                  {stats.activeSessions}
                </p>
              </div>
              <div className="bg-cream-600 p-4 rounded-child-lg">
                <Clock size={32} className="text-white" />
              </div>
            </div>
          </div>
        </div>

        {/* Recent Students */}
        <div className="card">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-child-xl font-bold text-gray-900">
              الطلاب الأخيرون
            </h2>
            <Link to="/students" className="btn-primary">
              عرض جميع الطلاب
            </Link>
          </div>

          {students.length === 0 ? (
            <div className="text-center py-12">
              <Users size={64} className="mx-auto text-gray-400 mb-4" />
              <p className="text-child-lg text-gray-600 mb-4">
                لا يوجد طلاب بعد
              </p>
              <Link to="/students" className="btn-primary">
                إضافة طالب جديد
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-beige-200">
                  <tr>
                    <th className="px-6 py-4 text-right text-child-base font-bold text-gray-900">
                      اسم الطالب
                    </th>
                    <th className="px-6 py-4 text-right text-child-base font-bold text-gray-900">
                      المستوى الحالي
                    </th>
                    <th className="px-6 py-4 text-right text-child-base font-bold text-gray-900">
                      المرحلة
                    </th>
                    <th className="px-6 py-4 text-right text-child-base font-bold text-gray-900">
                      عدد الجلسات
                    </th>
                    <th className="px-6 py-4 text-right text-child-base font-bold text-gray-900">
                      متوسط الدرجات
                    </th>
                    <th className="px-6 py-4 text-right text-child-base font-bold text-gray-900">
                      الإجراءات
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {students.slice(0, 5).map((student) => (
                    <tr
                      key={student.id}
                      className="border-b border-beige-200 hover:bg-beige-50 transition-colors"
                    >
                      <td className="px-6 py-4 text-child-base text-gray-900 font-bold">
                        {student.name}
                      </td>
                      <td className="px-6 py-4 text-child-base text-gray-700">
                        المستوى {student.current_level}
                      </td>
                      <td className="px-6 py-4 text-child-base text-gray-700">
                        المرحلة {student.current_stage}
                      </td>
                      <td className="px-6 py-4 text-child-base text-gray-700">
                        {student.total_sessions || 0}
                      </td>
                      <td className="px-6 py-4 text-child-base text-gray-700">
                        {student.average_score || 0}%
                      </td>
                      <td className="px-6 py-4">
                        <Link
                          to={`/students/${student.id}`}
                          className="text-primary-600 hover:text-primary-700 font-bold text-child-base"
                        >
                          عرض التفاصيل
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
