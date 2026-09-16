import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Logo } from '../components/Logo';
import { mockDb } from '../services/mockDb';
import { Lock, Loader2, Sparkles, ArrowRight } from 'lucide-react';

const Login: React.FC = () => {
  const [aadhaar, setAadhaar] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent, aadhaarOverride?: string) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const loginAadhaar = aadhaarOverride || aadhaar;

    try {
      const user = await mockDb.loginUser(loginAadhaar);
      if (user) {
        localStorage.setItem('svar_user_id', user.id);
        navigate('/pass');
      } else {
        setError('No digital pass found for this Aadhaar number.');
      }
    } catch (err) {
      setError('A system error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 font-sans py-12">
      <div className="bg-white border border-slate-200/80 p-8 sm:p-10 max-w-md w-full shadow-2xl rounded-3xl animate-fade-in text-slate-900 space-y-8">
        
        {/* Header */}
        <div className="text-center space-y-3">
          <div className="h-16 w-auto mx-auto mb-2 text-[#731515] flex justify-center">
             <Logo className="h-full w-auto" />
          </div>
          <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-[#731515] text-amber-300 text-[11px] font-bold tracking-widest uppercase shadow">
            <Sparkles size={13} className="text-amber-300" />
            <span>SVAR 2026 MEMBER LOGIN</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-serif font-black text-slate-900 tracking-tight">
            Member Pass Access
          </h1>
          <p className="text-slate-600 text-xs sm:text-sm leading-relaxed font-medium">
            Enter your registered 12-digit Aadhaar number to view your digital QR pass.
          </p>
        </div>

        {/* Login Form */}
        <form onSubmit={(e) => handleLogin(e)} className="space-y-6">
          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
              Aadhaar Number *
            </label>
            <div className="relative">
              <input 
                type="text" 
                value={aadhaar}
                onChange={(e) => setAadhaar(e.target.value.replace(/\D/g, '').slice(0, 12))}
                className="w-full bg-slate-50 border border-slate-300 p-4 pl-12 text-slate-900 font-mono text-base font-bold focus:border-[#731515] focus:bg-white outline-none rounded-2xl shadow-inner placeholder:text-slate-400"
                placeholder="12-digit number"
              />
              <Lock className="absolute left-4 top-4 text-[#731515]" size={20} />
            </div>
          </div>

          {error && (
            <div className="p-3.5 bg-red-50 border border-red-200 text-red-600 text-xs text-center rounded-xl font-bold">
              {error}
            </div>
          )}

          <button 
            type="submit" 
            disabled={loading || aadhaar.length !== 12}
            className="w-full bg-[#731515] hover:bg-[#8E2121] text-white font-bold text-xs uppercase tracking-widest py-4 rounded-xl shadow-lg transition-transform hover:scale-[1.01] flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? <Loader2 size={18} className="animate-spin" /> : <span>Access Digital Pass</span>}
            <ArrowRight size={18} />
          </button>
        </form>

        {/* Footer Link */}
        <div className="pt-4 border-t border-slate-200 text-center">
          <p className="text-slate-600 text-xs font-medium">
            Don't have a digital pass yet? {' '}
            <Link to="/booking" className="text-[#731515] font-bold hover:underline">
              Book Pass Now
            </Link>
          </p>
        </div>

      </div>
    </div>
  );
};

export default Login;