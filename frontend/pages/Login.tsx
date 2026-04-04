import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Logo } from '../components/Logo';
import { mockDb } from '../services/mockDb';
import { Lock, Loader2, Sparkles, User, ArrowRight } from 'lucide-react';

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
        setError('No pass found for this Aadhaar number.');
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 bg-viren-50">
      <div className="bg-white border border-viren-200 p-8 max-w-md w-full shadow-2xl rounded-lg animate-liquid-up">
        <div className="text-center mb-8">
          <div className="h-16 w-auto mx-auto mb-4 text-viren-950">
             <Logo className="h-full w-auto" />
          </div>
          <h1 className="text-2xl font-bold text-viren-950 mb-2 font-serif">Member Login</h1>
          <p className="text-viren-600 text-sm">Enter your registered Aadhaar number to access your digital pass.</p>
        </div>

        <form onSubmit={(e) => handleLogin(e)} className="space-y-6">
          <div>
            <label className="block text-viren-800 text-sm mb-2 font-semibold">Aadhaar Number</label>
            <div className="relative">
              <input 
                type="text" 
                value={aadhaar}
                onChange={(e) => setAadhaar(e.target.value.replace(/\D/g, '').slice(0, 12))}
                className="w-full bg-viren-50 border border-viren-200 p-3 pl-10 text-viren-950 focus:border-viren-600 outline-none rounded-md"
                placeholder="12-digit number"
              />
              <Lock className="absolute left-3 top-3.5 text-viren-400" size={18} />
            </div>
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-500 text-sm text-center rounded">
              {error}
            </div>
          )}

          <button 
            type="submit" 
            disabled={loading || aadhaar.length !== 12}
            className="btn-viren-filled w-full py-3 flex justify-center items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? <Loader2 className="animate-spin" /> : 'Access Pass'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-viren-600 text-sm">
            Don't have a pass? <a href="#/booking" className="text-viren-950 font-bold hover:underline">Book Now</a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;