import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const { signIn, signUp } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isSignUp) {
        if (!fullName.trim()) {
          setError('الرجاء إدخال الاسم الكامل');
          setLoading(false);
          return;
        }
        await signUp(email, password, fullName);
        setError('');
        alert('تم إنشاء الحساب بنجاح! يرجى تسجيل الدخول.');
        setIsSignUp(false);
      } else {
        await signIn(email, password);
        navigate('/dashboard');
      }
    } catch (err) {
      setError(err.message || 'حدث خطأ في تسجيل الدخول');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-cream-400 to-beige-400 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h1 className="text-child-3xl font-extrabold text-gray-900 mb-2">
            برنامج السندباد
          </h1>
          <p className="text-child-lg text-gray-700">
            لتدريب الذاكرة للأطفال المصابين بالدسلكسيا
          </p>
        </div>

        <div className="card animate-fade-in">
          <h2 className="text-child-xl font-bold text-center text-gray-900 mb-6">
            {isSignUp ? 'إنشاء حساب جديد' : 'تسجيل الدخول'}
          </h2>

          {error && (
            <div className="mb-4 p-4 bg-error-50 border-r-4 border-error-500 rounded-child">
              <p className="text-child-base text-error-700">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {isSignUp && (
              <div>
                <label htmlFor="fullName" className="label">
                  الاسم الكامل
                </label>
                <input
                  id="fullName"
                  name="fullName"
                  type="text"
                  required={isSignUp}
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="input-field"
                  placeholder="أدخل اسمك الكامل"
                />
              </div>
            )}

            <div>
              <label htmlFor="email" className="label">
                البريد الإلكتروني
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input-field"
                placeholder="example@email.com"
                dir="ltr"
              />
            </div>

            <div>
              <label htmlFor="password" className="label">
                كلمة المرور
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete={isSignUp ? 'new-password' : 'current-password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input-field"
                placeholder="••••••••"
                dir="ltr"
                minLength={6}
              />
              {isSignUp && (
                <p className="mt-2 text-sm text-gray-600">
                  يجب أن تحتوي كلمة المرور على 6 أحرف على الأقل
                </p>
              )}
            </div>

            <div>
              <button
                type="submit"
                disabled={loading}
                className="w-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <span className="flex items-center justify-center">
                    <div className="spinner w-6 h-6 ml-3"></div>
                    جاري المعالجة...
                  </span>
                ) : (
                  isSignUp ? 'إنشاء الحساب' : 'تسجيل الدخول'
                )}
              </button>
            </div>
          </form>

          <div className="mt-6 text-center">
            <button
              type="button"
              onClick={() => {
                setIsSignUp(!isSignUp);
                setError('');
              }}
              className="text-child-base text-primary-600 hover:text-primary-700 font-bold"
            >
              {isSignUp
                ? 'لديك حساب بالفعل؟ سجل الدخول'
                : 'ليس لديك حساب؟ أنشئ حساباً جديداً'}
            </button>
          </div>
        </div>

        <div className="text-center text-child-sm text-gray-600">
          <p>للمساعدة أو الدعم الفني</p>
          <p className="font-bold">support@sinbad-game.com</p>
        </div>
      </div>
    </div>
  );
};

export default Login;
