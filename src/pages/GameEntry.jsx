import React from 'react';
import { useParams } from 'react-router-dom';

const GameEntry = () => {
  const { studentId } = useParams();
  
  return (
    <div className="min-h-screen bg-cream-500 flex items-center justify-center">
      <div className="card max-w-2xl">
        <h1 className="text-child-2xl font-bold text-center mb-6">
          مرحباً بك في برنامج السندباد
        </h1>
        <p className="text-child-lg text-center text-gray-700 mb-8">
          رقم الطالب: {studentId}
        </p>
        <div className="text-center">
          <button className="btn-primary">
            ابدأ اللعب
          </button>
        </div>
      </div>
    </div>
  );
};

export default GameEntry;
