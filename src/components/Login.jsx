import { useState } from 'react';
import { supabase, switchToFallbackMode } from '../utils/supabase';
import { ErrorHandler, FormValidator } from '../utils/errorHandling';

export default function Login() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const handleAuth = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrors({});

    try {
      // Client-side validation
      const newErrors = {};
      if (!email.trim()) {
        newErrors.email = 'E-Mail ist erforderlich';
      } else {
        try {
          FormValidator.validateEmail(email);
        } catch (err) {
          newErrors.email = 'Ungültige E-Mail-Adresse';
        }
      }
      
      if (!password.trim()) {
        newErrors.password = 'Passwort ist erforderlich';
      } else if (!isLogin && password.length < 6) {
        newErrors.password = 'Passwort muss mindestens 6 Zeichen haben';
      }

      if (Object.keys(newErrors).length > 0) {
        setErrors(newErrors);
        return;
      }

      // Use current supabase client for auth
      let result;
      try {
        result = isLogin
          ? await supabase.auth.signInWithPassword({
              email: FormValidator.sanitizeInput(email),
              password
            })
          : await supabase.auth.signUp({
              email: FormValidator.sanitizeInput(email),
              password
            });
      } catch (authError) {
        console.error('Auth operation failed:', authError);
        
        // If auth fails, try switching to fallback mode
        if (authError.message?.includes('Failed to fetch') || 
            authError.name === 'AuthRetryableFetchError') {
          console.warn('🔄 Auth failed, switching to fallback mode');
          await switchToFallbackMode();
          
          // Retry with fallback
          result = isLogin
            ? await supabase.auth.signInWithPassword({
                email: FormValidator.sanitizeInput(email),
                password
              })
            : await supabase.auth.signUp({
                email: FormValidator.sanitizeInput(email),
                password
              });
        } else {
          throw authError;
        }
      }

      console.log('🔍 Auth result:', result);

      if (result.error) {
        if (result.error.message?.includes('Invalid login credentials')) {
          setErrors({ form: 'Ungültige Anmeldedaten. Bitte überprüfen Sie E-Mail und Passwort.' });
        } else if (result.error.message?.includes('Email not confirmed')) {
          setErrors({ form: 'Bitte bestätigen Sie Ihre E-Mail-Adresse.' });
        } else if (result.error.message?.includes('User already registered')) {
          setErrors({ form: 'Diese E-Mail ist bereits registriert. Versuchen Sie sich anzumelden.' });
        } else {
          setErrors({ form: result.error.message });
        }
      } else {
        // Success - component will unmount when user state changes
        if (!isLogin) {
          setErrors({ form: 'Registrierung erfolgreich! Sie können sich jetzt anmelden.' });
          setIsLogin(true);
        }
      }
    } catch (error) {
      console.error('Auth error:', error);
      setErrors({ form: ErrorHandler.getErrorMessage(error) });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-system-green/20 via-bg-primary to-system-blue/20 flex items-center justify-center p-4 safe-area-all">
      {/* Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="floating-orb floating-orb-1 bg-system-green/10"></div>
        <div className="floating-orb floating-orb-2 bg-system-blue/10"></div>
        <div className="floating-orb floating-orb-3 bg-fifa-green/10"></div>
        <div className="floating-pattern floating-pattern-1">⚽</div>
        <div className="floating-pattern floating-pattern-2">🏆</div>
        <div className="floating-pattern floating-pattern-3">⭐</div>
      </div>

      {/* Login Card */}
      <div className="w-full max-w-md relative z-10">
        <div className="card-ios p-8 login-card">
          {/* Header */}
          <div className="text-center mb-8 login-header">
            <div className="mb-6 flex justify-center">
              <div className="w-20 h-20 bg-gradient-to-br from-system-green to-system-blue rounded-ios-2xl flex items-center justify-center shadow-ios-lg">
                <img 
                  src="/assets/logo.png" 
                  alt="FIFA Tracker Logo" 
                  className="w-10 h-10 object-contain brightness-0 invert"
                  loading="eager"
                />
              </div>
            </div>
            <h1 className="text-title1 font-bold text-text-primary mb-2">FIFA Tracker</h1>
            <p className="text-callout text-text-secondary">Verfolge FIFA-Spiele, Spieler und Statistiken</p>
          </div>

          {/* Form */}
          <form onSubmit={handleAuth} className="space-y-6">
            {/* Email Field */}
            <div className="form-group slide-up-delay-1">
              <label htmlFor="email" className="block text-footnote font-medium text-text-secondary mb-2">
                E-Mail
              </label>
              <div className="input-container">
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={`w-full px-4 py-4 bg-bg-tertiary border border-border-light rounded-ios-lg text-body text-text-primary placeholder-text-tertiary transition-all duration-ios focus:outline-none focus:border-system-blue focus:ring-4 focus:ring-system-blue/20 ${
                    errors.email ? 'border-system-red focus:border-system-red focus:ring-system-red/20' : ''
                  }`}
                  placeholder="deine@email.de"
                  autoComplete="email"
                  autoCapitalize="none"
                  required
                />
              </div>
              {errors.email && (
                <p className="text-caption1 text-system-red mt-2 error-message">{errors.email}</p>
              )}
            </div>

            {/* Password Field */}
            <div className="form-group slide-up-delay-2">
              <label htmlFor="password" className="block text-footnote font-medium text-text-secondary mb-2">
                Passwort
              </label>
              <div className="input-container">
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={`w-full px-4 py-4 bg-bg-tertiary border border-border-light rounded-ios-lg text-body text-text-primary placeholder-text-tertiary transition-all duration-ios focus:outline-none focus:border-system-blue focus:ring-4 focus:ring-system-blue/20 ${
                    errors.password ? 'border-system-red focus:border-system-red focus:ring-system-red/20' : ''
                  }`}
                  placeholder="Dein Passwort"
                  autoComplete={isLogin ? 'current-password' : 'new-password'}
                  required
                />
              </div>
              {errors.password && (
                <p className="text-caption1 text-system-red mt-2 error-message">{errors.password}</p>
              )}
            </div>

            {/* Form Error */}
            {errors.form && (
              <div className={`p-4 rounded-ios bg-system-red/10 border border-system-red/20 slide-up-delay-3 ${
                errors.form.includes('erfolgreich') ? 'bg-system-green/10 border-system-green/20' : ''
              }`}>
                <p className={`text-footnote ${
                  errors.form.includes('erfolgreich') ? 'text-system-green' : 'text-system-red'
                }`}>
                  {errors.form}
                </p>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full btn-primary-ios text-body font-semibold py-4 slide-up-delay-3 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              <div className="flex items-center justify-center gap-3">
                {loading && (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                )}
                <span>{isLogin ? 'Anmelden' : 'Registrieren'}</span>
              </div>
            </button>

            {/* Toggle Button */}
            <button
              type="button"
              onClick={() => {
                setIsLogin(!isLogin);
                setErrors({});
              }}
              className="w-full text-callout text-system-blue font-medium py-2 slide-up-delay-4 transition-all duration-ios hover:opacity-70 active:scale-95"
            >
              {isLogin ? 'Noch kein Konto? Registrieren' : 'Bereits ein Konto? Anmelden'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}