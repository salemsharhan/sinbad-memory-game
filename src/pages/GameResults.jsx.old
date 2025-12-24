import React from 'react';
import { useParams, Link } from 'react-router-dom';

const GameResults = () => {
  const { sessionId } = useParams();
  
  return (
    <div className="min-h-screen bg-cream-500 flex items-center justify-center">
      <div className="card max-w-2xl text-center">
        <h1 className="text-child-2xl font-bold mb-6">
          أحسنت! لقد أنهيت اللعبة
        </h1>
        <p className="text-child-lg text-gray-700 mb-8">
          Session: {sessionId}
        </p>
        <Link to="/dashboard" className="btn-primary">
          العودة للرئيسية
        </Link>
      </div>
    </div>
  );
};

export default GameResults;
