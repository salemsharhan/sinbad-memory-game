import React from 'react';

const Settings = () => {
  return (
    <div className="min-h-screen bg-cream-500">
      <header className="bg-white shadow-child">
        <div className="container mx-auto px-6 py-6">
          <h1 className="text-child-2xl font-extrabold text-gray-900">
            الإعدادات
          </h1>
        </div>
      </header>
      <main className="container mx-auto px-6 py-8">
        <div className="card">
          <h2 className="text-child-xl font-bold mb-4">إعدادات المستويات</h2>
          <p className="text-gray-600">إعدادات التوقيت والصوت لكل مستوى ومرحلة</p>
        </div>
      </main>
    </div>
  );
};

export default Settings;
