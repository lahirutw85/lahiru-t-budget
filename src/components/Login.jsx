import { useState } from 'react';
import { Wallet, Users, Lock } from 'lucide-react';
import { THEMES } from '../constants/themes';

export const Login = ({ onLoginSuccess }) => {
  const [loginUsername, setLoginUsername] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  
  const COLORS = THEMES.dark;

  const handleLoginSubmit = (e) => {
    e.preventDefault();
    if (loginUsername === 'lahirut85' && loginPassword === 'Sheran@2591277') {
      sessionStorage.setItem('isLoggedIn', 'true');
      onLoginSuccess();
      setLoginError('');
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

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider mb-2" style={{ color: COLORS.textSecondary }}>Username</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Users className="w-5 h-5" style={{ color: COLORS.textSecondary }} />
              </span>
              <input 
                type="text" 
                required
                placeholder="Enter your username"
                value={loginUsername}
                onChange={(e) => setLoginUsername(e.target.value)}
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
            className="w-full py-3.5 px-4 font-bold text-sm text-[#0B0F19] rounded-xl transition-all duration-300 transform hover:-translate-y-0.5 cursor-pointer shadow-lg hover:shadow-[#4FD1F5]/20"
            style={{ 
              backgroundColor: '#4FD1F5',
              background: 'linear-gradient(135deg, #4FD1F5 0%, #38BDF8 100%)'
            }}
          >
            Sign In
          </button>
        </form>
        
        <div className="mt-8 pt-6 border-t text-center text-xs" style={{ borderColor: 'rgba(255, 255, 255, 0.05)' }}>
          <span style={{ color: COLORS.textSecondary }}>Secured with enterprise session encryption</span>
        </div>
      </div>
    </div>
  );
};
