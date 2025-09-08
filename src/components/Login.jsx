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
            
        console.log('🔍 Auth result:', result);
        
        // Check if the error indicates CDN blocking
        if (result.error && (
            result.error.name === 'AuthRetryableFetchError' ||
            result.error.message.includes('Failed to fetch') ||
            result.error.message.includes('NetworkError') ||
            result.error.message.includes('fetch')
          )) {
          
          console.warn('🔄 Supabase CDN blocked (via result.error), switching to demo mode');
          ErrorHandler.showUserError('Supabase CDN blockiert - Demo-Modus wird verwendet', 'warning');
          
          // Switch to fallback globally
          const fallbackClient = switchToFallbackMode();
          
          // Retry with fallback
          result = isLogin
            ? await fallbackClient.auth.signInWithPassword({
                email: FormValidator.sanitizeInput(email),
                password
              })
            : await fallbackClient.auth.signUp({
                email: FormValidator.sanitizeInput(email),
                password
              });
        }
      } catch (error) {
        console.log('🔍 Caught auth error:', error.name, error.message);
        
        // Check if this is a CDN blocked error
        if (error.name === 'AuthRetryableFetchError' || 
            error.message.includes('Failed to fetch') ||
            error.message.includes('NetworkError') ||
            error.message.includes('fetch')) {
          
          console.warn('🔄 Supabase CDN blocked (via exception), switching to demo mode');
          ErrorHandler.showUserError('Supabase CDN blockiert - Demo-Modus wird verwendet', 'warning');
          
          // Switch to fallback globally
          const fallbackClient = switchToFallbackMode();
          
          // Retry with fallback
          result = isLogin
            ? await fallbackClient.auth.signInWithPassword({
                email: FormValidator.sanitizeInput(email),
                password
              })
            : await fallbackClient.auth.signUp({
                email: FormValidator.sanitizeInput(email),
                password
              });
        } else {
          throw error;
        }
      }

      if (result.error) throw result.error;

      if (!isLogin) {
        ErrorHandler.showUserError(
          'Bitte bestätige deine Email und logge dich dann ein.',
          'success'
        );
        setIsLogin(true);
      } else {
        ErrorHandler.showUserError('Erfolgreich angemeldet!', 'success');
      }
    } catch (error) {
      ErrorHandler.handleAuthError(error, isLogin ? 'Anmeldung' : 'Registrierung');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-green to-primary-green-dark flex items-center justify-center p-4 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="floating-orb floating-orb-1"></div>
        <div className="floating-orb floating-orb-2"></div>
        <div className="floating-orb floating-orb-3"></div>
        <div className="floating-pattern floating-pattern-1">⚽</div>
        <div className="floating-pattern floating-pattern-2">🏆</div>
        <div className="floating-pattern floating-pattern-3">⭐</div>
      </div>
      
      <div className="w-full max-w-md relative z-10">
        <div className="login-card bg-bg-secondary rounded-2xl shadow-xl p-8 backdrop-blur-sm">
          {/* Logo */}
          <div className="text-center mb-8 login-header">
            <div className="soccer-ball text-4xl mb-4 animate-bounce-gentle">⚽</div>
            <h1 className="text-2xl font-bold text-text-primary slide-up-delay-1">
              FIFA Tracker
            </h1>
            <p className="text-text-muted mt-2 slide-up-delay-2">
              Verfolge FIFA-Spiele, Spieler und Statistiken
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleAuth} className="space-y-6 slide-up-delay-3">
            <div className="form-group">
              <label htmlFor="email" className="form-label block text-sm font-medium text-text-primary mb-2">
                E-Mail
              </label>
              <div className="input-container">
                <input
                  id="email"
                  name="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={`form-input-enhanced ${errors.email ? 'error' : ''}`}
                  placeholder="deine@email.de"
                  autoComplete="email"
                  required
                  disabled={loading}
                  aria-describedby="email-error"
                  aria-invalid={!!errors.email}
                />
                <div className="input-focus-ring"></div>
              </div>
              {errors.email && (
                <p id="email-error" className="error-message mt-1 text-sm text-red-600" role="alert">
                  {errors.email}
                </p>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="password" className="form-label block text-sm font-medium text-text-primary mb-2">
                Passwort
              </label>
              <div className="input-container">
                <input
                  id="password"
                  name="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={`form-input-enhanced ${errors.password ? 'error' : ''}`}
                  placeholder="Dein Passwort"
                  autoComplete={isLogin ? "current-password" : "new-password"}
                  required
                  disabled={loading}
                  aria-describedby="password-error"
                  aria-invalid={!!errors.password}
                  minLength={6}
                />
                <div className="input-focus-ring"></div>
              </div>
              {errors.password && (
                <p id="password-error" className="error-message mt-1 text-sm text-red-600" role="alert">
                  {errors.password}
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className={`w-full btn-enhanced ${loading ? 'loading' : ''}`}
              aria-describedby={loading ? "loading-status" : undefined}
            >
              <span className="btn-content">
                {loading ? (
                  <div className="flex items-center justify-center" id="loading-status">
                    <div className="loading-spinner mr-2"></div>
                    {isLogin ? 'Anmelden...' : 'Registrieren...'}
                  </div>
                ) : (
                  isLogin ? 'Anmelden' : 'Registrieren'
                )}
              </span>
              <div className="btn-ripple"></div>
            </button>
          </form>

          {/* Toggle */}
          <div className="mt-6 text-center slide-up-delay-4">
            <button
              type="button"
              onClick={() => setIsLogin(!isLogin)}
              className="toggle-btn text-primary-green hover:text-primary-green-dark text-sm font-medium transition-all duration-300"
              disabled={loading}
            >
              {isLogin 
                ? 'Noch kein Konto? Registrieren'
                : 'Bereits ein Konto? Anmelden'
              }
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}