import { useRef } from 'react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export default function Certificate({ student, session, onClose }) {
  const certificateRef = useRef(null);

  const downloadPDF = async () => {
    if (!certificateRef.current) return;

    try {
      const canvas = await html2canvas(certificateRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff'
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4'
      });

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`certificate-${student.name}-${session.level}-${session.stage}.pdf`);
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('حدث خطأ في إنشاء الشهادة');
    }
  };

  const printCertificate = () => {
    window.print();
  };

  const getMotivationalMessage = () => {
    const messages = [
      'أنت نجم ساطع في سماء التميز!',
      'إنجاز رائع! استمر في التقدم',
      'أحسنت! أنت قدوة للجميع',
      'مبروك! أنت بطل حقيقي',
      'إنجاز مذهل! نفتخر بك'
    ];
    return messages[Math.floor(Math.random() * messages.length)];
  };

  const getAchievementLevel = () => {
    const accuracy = session.totalQuestions > 0
      ? (session.correctAnswers / session.totalQuestions) * 100
      : 0;

    if (accuracy >= 90) return { level: 'ممتاز', color: '#10B981', emoji: '🏆' };
    if (accuracy >= 80) return { level: 'جيد جداً', color: '#4A90E2', emoji: '⭐' };
    if (accuracy >= 70) return { level: 'جيد', color: '#F59E0B', emoji: '👍' };
    return { level: 'مقبول', color: '#6B7280', emoji: '✓' };
  };

  const achievement = getAchievementLevel();
  const currentDate = new Date().toLocaleDateString('ar-EG', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" dir="rtl">
      <div className="bg-white rounded-2xl max-w-5xl w-full max-h-[90vh] overflow-y-auto">
        {/* Certificate Content */}
        <div ref={certificateRef} className="bg-white p-12">
          {/* Decorative Border */}
          <div className="border-8 border-double border-primary p-8 rounded-xl relative">
            {/* Corner Decorations */}
            <div className="absolute top-4 right-4 text-6xl">🌟</div>
            <div className="absolute top-4 left-4 text-6xl">🌟</div>
            <div className="absolute bottom-4 right-4 text-6xl">⭐</div>
            <div className="absolute bottom-4 left-4 text-6xl">⭐</div>

            {/* Header */}
            <div className="text-center mb-8">
              <h1 className="text-6xl font-bold text-primary mb-4">شهادة تقدير</h1>
              <div className="text-8xl mb-4">{achievement.emoji}</div>
              <p className="text-3xl text-gray-600">برنامج السندباد لتدريب الذاكرة</p>
            </div>

            {/* Main Content */}
            <div className="text-center mb-8">
              <p className="text-2xl text-gray-700 mb-6">تُمنح هذه الشهادة إلى</p>
              
              <div className="bg-cream rounded-xl p-6 mb-6 inline-block min-w-[400px]">
                <h2 className="text-5xl font-bold text-text">{student.name}</h2>
              </div>

              <p className="text-2xl text-gray-700 mb-4">لإتمامه بنجاح</p>
              
              <div className="bg-primary text-white rounded-xl p-6 inline-block mb-6">
                <p className="text-3xl font-bold">
                  المستوى {session.level} - المرحلة {session.stage}
                </p>
              </div>

              <p className="text-2xl text-gray-700 mb-6">بتقدير</p>
              
              <div 
                className="rounded-xl p-4 inline-block mb-6"
                style={{ backgroundColor: achievement.color + '20', color: achievement.color }}
              >
                <p className="text-4xl font-bold">{achievement.level}</p>
              </div>
            </div>

            {/* Statistics */}
            <div className="grid grid-cols-3 gap-6 mb-8">
              <div className="text-center bg-gray-50 rounded-xl p-4">
                <div className="text-4xl font-bold text-primary mb-2">{session.score}</div>
                <div className="text-lg text-gray-600">النقاط</div>
              </div>
              <div className="text-center bg-gray-50 rounded-xl p-4">
                <div className="text-4xl font-bold text-success mb-2">
                  {session.totalQuestions > 0
                    ? ((session.correctAnswers / session.totalQuestions) * 100).toFixed(0)
                    : 0}%
                </div>
                <div className="text-lg text-gray-600">الدقة</div>
              </div>
              <div className="text-center bg-gray-50 rounded-xl p-4">
                <div className="text-4xl font-bold text-warning mb-2">{session.correctAnswers}</div>
                <div className="text-lg text-gray-600">إجابات صحيحة</div>
              </div>
            </div>

            {/* Motivational Message */}
            <div className="text-center mb-8">
              <div className="bg-cream rounded-xl p-6 inline-block">
                <p className="text-2xl font-bold text-primary">{getMotivationalMessage()}</p>
              </div>
            </div>

            {/* Footer */}
            <div className="flex justify-between items-end mt-12 pt-8 border-t-2 border-gray-200">
              <div className="text-center">
                <div className="border-t-2 border-gray-400 pt-2 mb-2 min-w-[200px]">
                  <p className="text-lg font-bold">المدرب</p>
                </div>
              </div>
              
              <div className="text-center">
                <p className="text-xl text-gray-600">{currentDate}</p>
              </div>
              
              <div className="text-center">
                <div className="border-t-2 border-gray-400 pt-2 mb-2 min-w-[200px]">
                  <p className="text-lg font-bold">الإدارة</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-center gap-4 p-6 bg-gray-50 rounded-b-2xl">
          <button
            onClick={downloadPDF}
            className="btn-primary flex items-center gap-2"
          >
            <span>📥</span>
            تحميل PDF
          </button>
          <button
            onClick={printCertificate}
            className="btn-secondary flex items-center gap-2"
          >
            <span>🖨️</span>
            طباعة
          </button>
          <button
            onClick={onClose}
            className="px-6 py-3 bg-gray-300 text-gray-700 rounded-xl font-bold hover:bg-gray-400 transition-colors"
          >
            إغلاق
          </button>
        </div>
      </div>

      {/* Print Styles */}
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          ${certificateRef.current ? `
            .certificate-content,
            .certificate-content * {
              visibility: visible;
            }
            .certificate-content {
              position: absolute;
              left: 0;
              top: 0;
              width: 100%;
            }
          ` : ''}
        }
      `}</style>
    </div>
  );
}
