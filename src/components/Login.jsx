import { useState } from 'react';
import { Wallet, Users, Lock, Mail } from 'lucide-react';
import { THEMES } from '../constants/themes';
import { supabase, hasSupabase } from '../utils/supabaseClient';

const AUTH_USERNAME = import.meta.env.VITE_AUTH_USERNAME || 'lahirut85';
const AUTH_PASS_HASH = import.meta.env.VITE_AUTH_PASS_HASH || '5c2a24625b8254fa3a97166baa5566014554667051ba3b7938f7eb2e6031216a';

const sha256Hex = async (text) => {
  const data = new TextEncoder().encode(text);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hashBuffer))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
};

export const Login = ({ onLoginSuccess }) => {
  const useSupabaseAuth = hasSupabase();
  const [isSignUp, setIsSignUp] = useState(false);
  const [loginIdentifier, setLoginIdentifier] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [infoMessage, setInfoMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const COLORS = THEMES.dark;

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setLoginError('');
    setInfoMessage('');

    if (useSupabaseAuth && supabase) {
      setIsSubmitting(true);
      try {
        const email = loginIdentifier.trim();
        if (isSignUp) {
          const { data, error } = await supabase.auth.signUp({
            email,
            password: loginPassword,
            options: {
              emailRedirectTo: `${window.location.origin}${window.location.pathname}`,
            },
          });
          if (error) {
            setLoginError(error.message);
          } else if (data?.session) {
            onLoginSuccess();
          } else {
            setInfoMessage('Account created! Please check your email to confirm, then sign in.');
            setIsSignUp(false);
          }
        } else {
          const { error } = await supabase.auth.signInWithPassword({
            email,
            password: loginPassword,
          });
          if (error) {
            setLoginError(error.message);
          } else {
            onLoginSuccess();
          }
        }
      } catch (err) {
        setLoginError(err.message || 'Authentication failed');
      } finally {
        setIsSubmitting(false);
      }
      return;
    }

    // Legacy fallback when Supabase is not configured
    const enteredHash = await sha256Hex(loginPassword);
    if (loginIdentifier.trim() === AUTH_USERNAME && enteredHash === AUTH_PASS_HASH) {
      sessionStorage.setItem('isLoggedIn', 'true');
      onLoginSuccess();
    } else {
      setLoginError('Invalid username or password');
    }
  };

  return (
    <div 
      className="min-h-screen w-screen flex items-center justify-center font-sans transition-colors duration-300 relative overflow-hidden" 
      style={{ 
        backgroundColor: '#070A13',
        backgroundImage: 'radial-gradient(circle at 10% 20%, rgba(79, 209, 245, 0.08) 0%, transparent 40%), radial-gradient(circle at 90% 80%, rgba(236, 141, 245, 0.06) 0%, transparent 40%)'
      }}
    >
      <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-[#4FD1F5]/10 rounded-full blur-[80px] pointer-events-none animate-pulse"></div>
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-[#EC8DF5]/5 rounded-full blur-[100px] pointer-events-none animate-pulse" style={{ animationDelay: '2s' }}></div>

      <div 
        className="relative w-full max-w-md mx-4 p-8 rounded-3xl border shadow-2xl backdrop-blur-xl transition-all duration-300"
        style={{ 
          backgroundColor: 'rgba(21, 26, 45, 0.8)', 
          borderColor: 'rgba(255, 255, 255, 0.08)',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
        }}
      >
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4 shadow-inner" style={{ backgroundColor: 'rgba(79, 209, 245, 0.1)', border: '1px solid rgba(79, 209, 245, 0.2)' }}>
            <Wallet className="w-8 h-8 text-[#4FD1F5]" />
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white mb-2">Budget Master</h1>
          <p className="text-sm font-medium" style={{ color: COLORS.textSecondary }}>Personal Finance & Strategic Planning</p>
        </div>

        <form onSubmit={handleLoginSubmit} className="space-y-6">
          {loginError && (
            <div 
              className="p-4 rounded-xl text-sm font-medium border flex items-center gap-3 animate-pulse"
              style={{ 
                backgroundColor: 'rgba(239, 68, 68, 0.1)', 
                borderColor: 'rgba(239, 68, 68, 0.2)', 
                color: '#FCA5A5' 
              }}
            >
              <div className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
              {loginError}
            </div>
          )}

          {infoMessage && (
            <div 
              className="p-4 rounded-xl text-sm font-medium border flex items-center gap-3"
              style={{ 
                backgroundColor: 'rgba(79, 209, 245, 0.1)', 
                borderColor: 'rgba(79, 209, 245, 0.2)', 
                color: '#7DD3FC' 
              }}
            >
              {infoMessage}
            </div>
          )}

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider mb-2" style={{ color: COLORS.textSecondary }}>
              {useSupabaseAuth ? 'Email' : 'Username'}
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                {useSupabaseAuth ? (
                  <Mail className="w-5 h-5" style={{ color: COLORS.textSecondary }} />
                ) : (
                  <Users className="w-5 h-5" style={{ color: COLORS.textSecondary }} />
                )}
              </span>
              <input 
                type={useSupabaseAuth ? 'email' : 'text'}
                required
                placeholder={useSupabaseAuth ? 'Enter your email' : 'Enter your username'}
                value={loginIdentifier}
                onChange={(e) => setLoginIdentifier(e.target.value)}
                className="block w-full pl-10 pr-4 py-3 text-sm rounded-xl focus:outline-none focus:ring-2 focus:ring-[#4FD1F5] transition-all border text-white font-medium"
                style={{ 
                  backgroundColor: '#1C2237', 
                  borderColor: 'rgba(255, 255, 255, 0.1)' 
                }}
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider mb-2" style={{ color: COLORS.textSecondary }}>Password</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Lock className="w-5 h-5" style={{ color: COLORS.textSecondary }} />
              </span>
              <input 
                type="password" 
                required
                placeholder="••••••••••••"
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                className="block w-full pl-10 pr-4 py-3 text-sm rounded-xl focus:outline-none focus:ring-2 focus:ring-[#4FD1F5] transition-all border text-white font-medium"
                style={{ 
                  backgroundColor: '#1C2237', 
                  borderColor: 'rgba(255, 255, 255, 0.1)' 
                }}
              />
            </div>
          </div>

          <button 
            type="submit" 
            disabled={isSubmitting}
            className="w-full py-3.5 px-4 font-bold text-sm text-[#0B0F19] rounded-xl transition-all duration-300 transform hover:-translate-y-0.5 cursor-pointer shadow-lg hover:shadow-[#4FD1F5]/20 disabled:opacity-60 disabled:cursor-not-allowed"
            style={{ 
              backgroundColor: '#4FD1F5',
              background: 'linear-gradient(135deg, #4FD1F5 0%, #38BDF8 100%)'
            }}
          >
            {isSubmitting
              ? (isSignUp ? 'Creating Account...' : 'Signing In...')
              : (isSignUp ? 'Create Account' : 'Sign In')}
          </button>

          {useSupabaseAuth && (
            <div className="text-center">
              <button
                type="button"
                onClick={() => {
                  setIsSignUp(prev => !prev);
                  setLoginError('');
                  setInfoMessage('');
                }}
                className="text-xs font-medium text-[#4FD1F5] hover:underline cursor-pointer"
              >
                {isSignUp ? 'Already have an account? Sign In' : "Don't have an account? Create one"}
              </button>
            </div>
          )}
        </form>
        
        <div className="mt-8 pt-6 border-t text-center text-xs" style={{ borderColor: 'rgba(255, 255, 255, 0.05)' }}>
          <span style={{ color: COLORS.textSecondary }}>
            {useSupabaseAuth ? 'Secured with Supabase Auth' : 'Secured with enterprise session encryption'}
          </span>
        </div>
      </div>
    </div>
  );
};
