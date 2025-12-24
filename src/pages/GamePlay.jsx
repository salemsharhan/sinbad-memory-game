import React from 'react';
import { useParams } from 'react-router-dom';

const GamePlay = () => {
  const { sessionId } = useParams();
  
  return (
    <div className="min-h-screen bg-cream-500 flex items-center justify-center">
      <div className="card max-w-4xl">
        <h1 className="text-child-2xl font-bold text-center mb-6">
          اللعبة
        </h1>
        <p className="text-center text-gray-600">Session: {sessionId}</p>
        <p className="text-center mt-4">واجهة اللعبة ستظهر هنا</p>
      </div>
    </div>
  );
};

export default GamePlay;
