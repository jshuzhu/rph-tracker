'use client';

import { useState } from 'react';
import { loginSimple, registerSimple } from '../actions/auth';

export default function LoginPage() {
  const [authMode, setAuthMode] = useState('login'); // 'login', 'signup', or 'forgot'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState('teacher'); // 'teacher', 'reviewer', or 'admin'
  const [adminPasscode, setAdminPasscode] = useState('');
  const [title, setTitle] = useState('');
  
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const handleAuth = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      if (authMode === 'signup') {
        if (role === 'admin' && adminPasscode !== '0000') {
          setErrorMsg('Kod Laluan Admin tidak sah.');
          setIsLoading(false);
          return;
        }
        if (role === 'reviewer' && adminPasscode !== '1234') {
          setErrorMsg('Kod Laluan Penyemak tidak sah.');
          setIsLoading(false);
          return;
        }
        if (role === 'reviewer' && !title) {
          setErrorMsg('Sila pilih gelaran/jawatan anda.');
          setIsLoading(false);
          return;
        }

        const res = await registerSimple(email, password, fullName, role, title);
        if (res.error) {
          setErrorMsg(res.error);
          setIsLoading(false);
        } else {
          setSuccessMsg('Pendaftaran berjaya! Membuka portal anda...');
          window.location.href = '/dashboard';
        }
      } else if (authMode === 'forgot') {
        setSuccessMsg('Sila hubungi admin untuk tukar password.');
        setIsLoading(false);
      } else {
        const res = await loginSimple(email, password);
        if (res.error) {
          setErrorMsg(res.error);
          setIsLoading(false);
        } else {
          setSuccessMsg('Log masuk berjaya! Sedang memuatkan portal...');
          window.location.href = '/dashboard';
        }
      }
    } catch (err) {
      console.error('Authentication error:', err);
      setErrorMsg('Terdapat ralat teknikal. Sila cuba seketika lagi.');
      setIsLoading(false);
    }
  };

  return (
    <div className="relative flex-grow flex flex-col lg:flex-row min-h-[calc(100vh-4rem)] bg-transparent text-slate-100 overflow-hidden">
      <div className="hidden lg:block relative w-full lg:w-1/2 h-64 lg:h-auto flex-shrink-0 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-t lg:bg-gradient-to-r from-purple-900/90 to-purple-800/40 z-10"></div>
        <img 
          src="/assets/image/teacher-and-kids-in-class.png" 
          alt="Banner RPH" 
          className="w-full h-full object-cover object-center scale-105 hover:scale-100 transition-transform duration-700"
        />
        <div className="absolute inset-0 z-20 flex flex-col justify-end p-8 lg:p-16 text-white max-w-xl">
          <div className="inline-flex items-center space-x-2 bg-white/20 backdrop-blur-md px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider mb-4 border border-white/10 w-fit">
            <span>Portal Pintar Akademik</span>
          </div>
          <h2 className="text-2xl lg:text-4xl font-extrabold tracking-tight leading-tight drop-shadow-md">
            Urus Rancangan Pengajaran Harian (RPH) Dengan Mudah
          </h2>
          <p className="text-xs lg:text-sm text-purple-200 mt-2 font-medium drop-shadow-sm">
            Sistem automasi ringkas dan pantas.
          </p>
        </div>
      </div>

      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 lg:p-16">
        <div className="relative w-full max-w-md bg-slate-900/70 backdrop-blur-md border border-slate-800 p-8 rounded-[2rem] shadow-2xl shadow-purple-500/10 transition-all duration-300">
          
          <div className="flex flex-col items-center mb-8 text-center">
            <div className="w-20 h-20 rounded-2xl bg-slate-800 flex items-center justify-center p-4 shadow-xl border border-slate-100 dark:border-slate-700 mb-4">
              <img src="/assets/logo/graduation.png" alt="App Logo" className="w-full h-full object-contain brightness-0 invert" />
            </div>
            <h1 className="text-2xl font-extrabold text-slate-100 tracking-tight">
              {authMode === 'signup' ? 'Daftar Akaun' : authMode === 'forgot' ? 'Set Semula' : 'Selamat Datang!'}
            </h1>
          </div>

          {successMsg && (
            <div className="mb-4 p-4 rounded-xl bg-emerald-50 text-emerald-800 text-xs font-semibold">
              {successMsg}
            </div>
          )}

          {errorMsg && (
            <div className="mb-4 p-4 rounded-xl bg-red-50 text-red-800 text-xs font-semibold">
              {errorMsg}
            </div>
          )}

          <form onSubmit={handleAuth} className="space-y-4">
            
            {authMode === 'signup' && (
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Nama Penuh</label>
                <input 
                  type="text" 
                  className="w-full bg-slate-800 border border-slate-700 text-slate-100 rounded-xl py-2.5 px-4 text-xs" 
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)} 
                  required 
                  disabled={isLoading}
                />
              </div>
            )}

            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">E-mel</label>
              <input 
                type="email" 
                className="w-full bg-slate-800 border border-slate-700 text-slate-100 rounded-xl py-2.5 px-4 text-xs" 
                value={email}
                onChange={(e) => setEmail(e.target.value)} 
                required 
                disabled={isLoading}
              />
            </div>
            
            {authMode !== 'forgot' && (
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Kata Laluan</label>
                <input 
                  type="password" 
                  className="w-full bg-slate-800 border border-slate-700 text-slate-100 rounded-xl py-2.5 px-4 text-xs" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)} 
                  required 
                  disabled={isLoading}
                />
              </div>
            )}

            {authMode === 'signup' && (
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Peranan</label>
                <select
                  className="w-full bg-slate-800 border border-slate-700 text-slate-100 rounded-xl py-2.5 px-3.5 text-xs"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  disabled={isLoading}
                >
                  <option value="teacher">Guru</option>
                  <option value="reviewer">Penyemak</option>
                  <option value="admin">Pentadbir</option>
                </select>
              </div>
            )}

            {authMode === 'signup' && role === 'reviewer' && (
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Gelaran</label>
                <select
                  className="w-full bg-slate-800 border border-slate-700 text-slate-100 rounded-xl py-2.5 px-3.5 text-xs"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  disabled={isLoading}
                >
                  <option value="">-- Pilih --</option>
                  <option value="GB">GB</option>
                  <option value="PKP">PKP</option>
                </select>
              </div>
            )}

            {authMode === 'signup' && (role === 'admin' || role === 'reviewer') && (
              <div>
                <label className="block text-[10px] font-bold text-rose-500 uppercase tracking-wider mb-1.5">Kod Laluan</label>
                <input 
                  type="password" 
                  className="w-full bg-slate-800 border border-rose-200 text-slate-100 rounded-xl py-2.5 px-4 text-xs" 
                  value={adminPasscode}
                  onChange={(e) => setAdminPasscode(e.target.value)} 
                  required 
                  disabled={isLoading}
                />
              </div>
            )}

            <button 
              type="submit" 
              className="w-full bg-purple-600 hover:bg-purple-500 text-white font-bold py-3 px-4 rounded-xl text-xs mt-6"
              disabled={isLoading}
            >
              {isLoading ? 'Sila tunggu...' : (authMode === 'signup' ? 'Daftar Akaun' : authMode === 'forgot' ? 'Hantar' : 'Log Masuk')}
            </button>
          </form>

          <div className="mt-6 text-center text-xs space-y-2">
            {authMode === 'login' && (
              <p className="text-slate-500">
                Belum mempunyai akaun?
                <button onClick={() => setAuthMode('signup')} className="text-purple-400 font-bold ml-1">Daftar</button>
              </p>
            )}
            {authMode !== 'login' && (
              <p className="text-slate-500">
                Sudah mempunyai akaun?
                <button onClick={() => setAuthMode('login')} className="text-purple-400 font-bold ml-1">Log Masuk</button>
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}