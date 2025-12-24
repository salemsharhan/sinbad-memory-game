import React from 'react';
import { Link } from 'react-router-dom';
import { Home } from 'lucide-react';

const NotFound = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-cream-500 px-4">
      <div className="text-center">
        <h1 className="text-9xl font-extrabold text-primary-500 mb-4">404</h1>
        <h2 className="text-child-2xl font-bold text-gray-900 mb-4">
          الصفحة غير موجودة
        </h2>
        <p className="text-child-lg text-gray-700 mb-8">
          عذراً، الصفحة التي تبحث عنها غير موجودة
        </p>
        <Link to="/dashboard" className="btn-primary inline-flex items-center gap-2">
          <Home size={20} />
          العودة للرئيسية
        </Link>
      </div>
    </div>
  );
};

export default NotFound;
