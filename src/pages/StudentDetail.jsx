import React from 'react';
import { useParams } from 'react-router-dom';

const StudentDetail = () => {
  const { studentId } = useParams();
  
  return (
    <div className="min-h-screen bg-cream-500">
      <header className="bg-white shadow-child">
        <div className="container mx-auto px-6 py-6">
          <h1 className="text-child-2xl font-extrabold text-gray-900">
            تفاصيل الطالب
          </h1>
        </div>
      </header>
      <main className="container mx-auto px-6 py-8">
        <div className="card">
          <p className="text-child-lg">Student ID: {studentId}</p>
          <p className="text-gray-600 mt-4">تفاصيل الطالب ستظهر هنا</p>
        </div>
      </main>
    </div>
  );
};

export default StudentDetail;
