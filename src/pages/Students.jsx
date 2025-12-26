import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { getAllStudents, createStudent, deleteStudent } from '../lib/api/students';
import { Users, Plus, Trash2, Eye, Search } from 'lucide-react';

const Students = () => {
  const { teacher, user, loading: authLoading } = useAuth();
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [newStudent, setNewStudent] = useState({
    student_id: '',
    name: '',
  });

  useEffect(() => {
    // Wait for auth to finish loading
    if (!authLoading) {
      if (teacher) {
        loadStudents();
      } else if (user && !teacher) {
        // Teacher profile doesn't exist, show error
        setLoading(false);
      } else {
        // Still loading or no user
        setLoading(false);
      }
    }
  }, [teacher, user, authLoading]);

  const loadStudents = async () => {
    if (!teacher || !teacher.id) {
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const data = await getAllStudents(teacher.id);
      setStudents(data);
    } catch (error) {
      console.error('Error loading students:', error);
      alert('حدث خطأ في تحميل بيانات الطلاب');
    } finally {
      setLoading(false);
    }
  };

  const handleAddStudent = async (e) => {
    e.preventDefault();
    if (!teacher || !teacher.id) {
      alert('خطأ: ملف المعلم غير موجود. يرجى تسجيل الخروج والدخول مرة أخرى.');
      return;
    }
    try {
      await createStudent({
        ...newStudent,
        teacher_id: teacher.id,
      });
      setShowAddModal(false);
      setNewStudent({ student_id: '', name: '' });
      loadStudents();
      alert('تم إضافة الطالب بنجاح');
    } catch (error) {
      console.error('Error adding student:', error);
      alert('حدث خطأ في إضافة الطالب');
    }
  };

  const handleDeleteStudent = async (studentId) => {
    if (window.confirm('هل أنت متأكد من حذف هذا الطالب؟')) {
      try {
        await deleteStudent(studentId);
        loadStudents();
        alert('تم حذف الطالب بنجاح');
      } catch (error) {
        console.error('Error deleting student:', error);
        alert('حدث خطأ في حذف الطالب');
      }
    }
  };

  const filteredStudents = students.filter(student =>
    student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.student_id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Show loading while auth is initializing
  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-cream-500 flex items-center justify-center">
        <div className="text-center">
          <div className="spinner mb-4"></div>
          <p className="text-child-lg">جاري التحميل...</p>
        </div>
      </div>
    );
  }

  // Show error if teacher profile doesn't exist
  if (user && !teacher) {
    return (
      <div className="min-h-screen bg-cream-500 flex items-center justify-center">
        <div className="card max-w-md text-center">
          <h2 className="text-child-xl font-bold text-error mb-4">خطأ في ملف المعلم</h2>
          <p className="text-child-base text-gray-700 mb-6">
            ملف المعلم غير موجود في قاعدة البيانات. يرجى المحاولة مرة أخرى أو الاتصال بالدعم الفني.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="btn-primary"
          >
            إعادة تحميل الصفحة
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cream-500">
      <header className="bg-white shadow-child">
        <div className="container mx-auto px-6 py-6">
          <h1 className="text-child-2xl font-extrabold text-gray-900">
            إدارة الطلاب
          </h1>
        </div>
      </header>

      <main className="container mx-auto px-6 py-8">
        <div className="card mb-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex-1 ml-4">
              <div className="relative">
                <Search className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="text"
                  placeholder="ابحث عن طالب..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="input-field pr-12"
                />
              </div>
            </div>
            <button
              onClick={() => setShowAddModal(true)}
              className="btn-primary flex items-center gap-2"
            >
              <Plus size={20} />
              إضافة طالب جديد
            </button>
          </div>

          {loading ? (
            <div className="text-center py-12">
              <div className="spinner mb-4"></div>
              <p className="text-child-lg">جاري التحميل...</p>
            </div>
          ) : filteredStudents.length === 0 ? (
            <div className="text-center py-12">
              <Users size={64} className="mx-auto text-gray-400 mb-4" />
              <p className="text-child-lg text-gray-600">
                {searchTerm ? 'لا توجد نتائج' : 'لا يوجد طلاب بعد'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredStudents.map((student) => (
                <div key={student.id} className="card bg-gradient-to-br from-white to-beige-50">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="text-child-lg font-bold text-gray-900 mb-1">
                        {student.name}
                      </h3>
                      <p className="text-child-sm text-gray-600">
                        الرقم: {student.student_id}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-2 mb-4">
                    <div className="flex justify-between text-child-base">
                      <span className="text-gray-700">المستوى:</span>
                      <span className="font-bold text-primary-600">
                        {student.current_level}
                      </span>
                    </div>
                    <div className="flex justify-between text-child-base">
                      <span className="text-gray-700">المرحلة:</span>
                      <span className="font-bold text-primary-600">
                        {student.current_stage}
                      </span>
                    </div>
                    <div className="flex justify-between text-child-base">
                      <span className="text-gray-700">الجلسات:</span>
                      <span className="font-bold">{student.total_sessions || 0}</span>
                    </div>
                    <div className="flex justify-between text-child-base">
                      <span className="text-gray-700">المتوسط:</span>
                      <span className="font-bold text-success-600">
                        {student.average_score || 0}%
                      </span>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Link
                      to={`/students/${student.id}`}
                      className="flex-1 btn-primary flex items-center justify-center gap-2"
                    >
                      <Eye size={18} />
                      عرض التفاصيل
                    </Link>
                    <button
                      onClick={() => handleDeleteStudent(student.id)}
                      className="btn-secondary flex items-center justify-center"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Add Student Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="card max-w-md w-full animate-bounce-in">
            <h2 className="text-child-xl font-bold text-gray-900 mb-6">
              إضافة طالب جديد
            </h2>

            <form onSubmit={handleAddStudent} className="space-y-4">
              <div>
                <label className="label">اسم الطالب</label>
                <input
                  type="text"
                  required
                  value={newStudent.name}
                  onChange={(e) => setNewStudent({ ...newStudent, name: e.target.value })}
                  className="input-field"
                  placeholder="أدخل اسم الطالب"
                />
              </div>

              <div>
                <label className="label">رقم الطالب</label>
                <input
                  type="text"
                  required
                  value={newStudent.student_id}
                  onChange={(e) => setNewStudent({ ...newStudent, student_id: e.target.value })}
                  className="input-field"
                  placeholder="أدخل رقم الطالب"
                />
              </div>

              <div className="flex gap-4 pt-4">
                <button type="submit" className="flex-1 btn-primary">
                  إضافة
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowAddModal(false);
                    setNewStudent({ student_id: '', name: '' });
                  }}
                  className="flex-1 btn-secondary"
                >
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Students;
