import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import gameData from '../assets/game-data.json';

const Settings = () => {
  const { teacher } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('global');
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);

  // Global settings (default for all students)
  const [globalSettings, setGlobalSettings] = useState({
    timingMode: 'medium', // short, medium, long
    waitTimer: 5, // 0-15 seconds
    defaultLevel: 'A' // A, B, C
  });

  // Per-level settings
  const [levelSettings, setLevelSettings] = useState({
    A: {
      timingMode: 'medium',
      waitTimer: 5
    },
    B: {
      timingMode: 'medium',
      waitTimer: 5
    },
    C: {
      timingMode: 'medium',
      waitTimer: 5
    }
  });

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      // Load from localStorage or database
      const savedGlobal = localStorage.getItem('gameSettings_global');
      if (savedGlobal) {
        setGlobalSettings(JSON.parse(savedGlobal));
      }

      const savedLevels = localStorage.getItem('gameSettings_levels');
      if (savedLevels) {
        setLevelSettings(JSON.parse(savedLevels));
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  };

  const saveSettings = async () => {
    try {
      setLoading(true);
      setSaved(false);

      // Save to localStorage (in production, save to database)
      localStorage.setItem('gameSettings_global', JSON.stringify(globalSettings));
      localStorage.setItem('gameSettings_levels', JSON.stringify(levelSettings));

      // TODO: Save to database via API
      // await updateGameSettings(teacher.id, { global: globalSettings, levels: levelSettings });

      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (error) {
      console.error('Error saving settings:', error);
      alert('حدث خطأ في حفظ الإعدادات');
    } finally {
      setLoading(false);
    }
  };

  const getTimingValue = (mode, stage) => {
    const config = gameData.timingConfigurations[mode] || gameData.timingConfigurations.medium;
    const stageIndex = Math.min(stage - 1, config.length - 1);
    return config[stageIndex] || 15;
  };

  return (
    <div className="min-h-screen bg-cream" dir="rtl">
      {/* Header */}
      <header className="bg-white shadow-soft border-b-2 border-beige-300">
        <div className="container mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold text-text">الإعدادات</h1>
            <button
              onClick={() => navigate('/dashboard')}
              className="px-4 py-2 text-gray-600 hover:text-primary transition-colors"
            >
              ← العودة
            </button>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <nav className="bg-white border-b-2 border-beige-300">
        <div className="container mx-auto px-6">
          <div className="flex gap-4">
            <button
              onClick={() => setActiveTab('global')}
              className={`px-6 py-4 text-base font-bold transition-all ${
                activeTab === 'global'
                  ? 'text-primary border-b-4 border-primary'
                  : 'text-gray-700 hover:text-primary hover:border-b-4 hover:border-primary-300'
              }`}
            >
              الإعدادات العامة
            </button>
            <button
              onClick={() => setActiveTab('levels')}
              className={`px-6 py-4 text-base font-bold transition-all ${
                activeTab === 'levels'
                  ? 'text-primary border-b-4 border-primary'
                  : 'text-gray-700 hover:text-primary hover:border-b-4 hover:border-primary-300'
              }`}
            >
              إعدادات المستويات
            </button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-8">
        {activeTab === 'global' && (
          <div className="max-w-4xl mx-auto">
            <div className="bg-white rounded-2xl shadow-soft p-8 mb-6">
              <h2 className="text-2xl font-bold text-text mb-6">الإعدادات العامة</h2>

              {/* Timing Mode */}
              <div className="mb-8">
                <label className="block text-lg font-bold text-text mb-4">
                  فترة عرض الصور (بالثواني)
                </label>
                <p className="text-sm text-gray-600 mb-4">
                  الفترة الزمنية التي ستعرض فيها الصور ويمكن للمتدرب الإجابة
                </p>
                <div className="flex gap-4 mb-4">
                  {['long', 'short'].map((mode) => (
                    <button
                      key={mode}
                      onClick={() => setGlobalSettings({ ...globalSettings, timingMode: mode })}
                      className={`px-6 py-3 rounded-lg font-bold transition-all border-2 ${
                        globalSettings.timingMode === mode
                          ? 'bg-blue-600 text-white border-blue-700 shadow-lg'
                          : 'bg-gray-100 text-gray-800 border-gray-300 hover:bg-gray-200'
                      }`}
                    >
                      {mode === 'long' ? 'طويل' : 'قصير'}
                    </button>
                  ))}
                </div>

                {/* Display timing values for each stage */}
                <div className="bg-gray-50 rounded-xl p-6">
                  <h3 className="text-lg font-bold text-text mb-4">قيم التوقيت لكل مرحلة:</h3>
                  <div className="grid grid-cols-6 gap-2">
                    {[1, 2, 3, 4, 5, 6].map((stage) => (
                      <div key={stage} className="text-center">
                        <div className="text-sm text-gray-600 mb-1">المرحلة {stage}</div>
                        <div className="text-2xl font-bold text-primary">
                          {getTimingValue(globalSettings.timingMode, stage)}
                        </div>
                        <div className="text-xs text-gray-500">ثانية</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Wait Timer */}
              <div className="mb-8">
                <label className="block text-lg font-bold text-text mb-4">
                  مؤقت التوقف قبل عرض الصور (بالثواني)
                </label>
                <p className="text-sm text-gray-600 mb-4">
                  الفترة الزمنية التي تسبق عرض الصور (من 0 حتى 15 ثانية)
                </p>
                <div className="flex items-center gap-4">
                  <span className="text-sm text-gray-600 min-w-[80px]">
                    {globalSettings.waitTimer} ثانية
                  </span>
                  <div className="flex-1 relative">
                    <input
                      type="range"
                      min="0"
                      max="15"
                      value={globalSettings.waitTimer}
                      onChange={(e) => {
                        const value = parseInt(e.target.value);
                        setGlobalSettings({ ...globalSettings, waitTimer: value });
                      }}
                      style={{
                        width: '100%'
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* Default Level */}
              <div className="mb-8">
                <label className="block text-lg font-bold text-text mb-4">
                  المستوى الافتراضي
                </label>
                <p className="text-sm text-gray-600 mb-4">
                  المستوى الذي سيبدأ به الطلاب الجدد
                </p>
                <div className="grid grid-cols-3 gap-4">
                  {['A', 'B', 'C'].map((level) => (
                    <button
                      key={level}
                      onClick={() => setGlobalSettings({ ...globalSettings, defaultLevel: level })}
                      className={`px-6 py-4 rounded-xl font-bold transition-all ${
                        globalSettings.defaultLevel === level
                          ? 'bg-primary text-white shadow-lg'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      المستوى {level}
                      {level === 'A' && ' (الأسهل)'}
                      {level === 'B' && ' (متوسط)'}
                      {level === 'C' && ' (الأصعب)'}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'levels' && (
          <div className="max-w-4xl mx-auto">
            {['A', 'B', 'C'].map((level) => (
              <div key={level} className="bg-white rounded-2xl shadow-soft p-8 mb-6">
                <h2 className="text-xl font-bold text-text mb-6">
                  {level === 'A' && '(الأسهل) '}
                  {level === 'B' && '(متوسط) '}
                  {level === 'C' && '(الأصعب) '}
                  إعدادات المستوى {level}
                </h2>

                {/* Timing Mode for Level */}
                <div className="mb-6">
                  <label className="block text-lg font-bold text-text mb-3">
                    فترة عرض الصور
                  </label>
                  <div className="flex gap-4">
                    {['long', 'short'].map((mode) => (
                      <button
                        key={mode}
                        onClick={() =>
                          setLevelSettings({
                            ...levelSettings,
                            [level]: { ...levelSettings[level], timingMode: mode }
                          })
                        }
                        className={`px-6 py-3 rounded-lg font-bold transition-all border-2 ${
                          levelSettings[level].timingMode === mode
                            ? 'bg-blue-600 text-white border-blue-700 shadow-lg'
                            : 'bg-gray-100 text-gray-800 border-gray-300 hover:bg-gray-200'
                        }`}
                      >
                        {mode === 'long' ? 'طويل' : 'قصير'}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Wait Timer for Level */}
                <div className="mb-4">
                  <label className="block text-lg font-bold text-text mb-3">
                    مؤقت التوقف قبل عرض الصور
                  </label>
                  <div className="flex items-center gap-4">
                    <span className="text-sm text-gray-600 min-w-[80px]">
                      {levelSettings[level].waitTimer} ثانية
                    </span>
                    <div className="flex-1 relative">
                      <input
                        type="range"
                        min="0"
                        max="15"
                        value={levelSettings[level].waitTimer}
                        onChange={(e) => {
                          const value = parseInt(e.target.value);
                          setLevelSettings({
                            ...levelSettings,
                            [level]: {
                              ...levelSettings[level],
                              waitTimer: value
                            }
                          });
                        }}
                        style={{
                          width: '100%'
                        }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Save Button */}
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-2xl shadow-soft p-6">
            <div className="flex items-center justify-between">
              <div>
                {saved && (
                  <p className="text-green-600 font-bold">✓ تم حفظ الإعدادات بنجاح</p>
                )}
              </div>
              <button
                onClick={saveSettings}
                disabled={loading}
                className="px-8 py-4 bg-primary text-white rounded-xl font-bold text-lg hover:bg-primary-dark transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'جاري الحفظ...' : 'حفظ الإعدادات'}
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Settings;
