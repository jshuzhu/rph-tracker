'use client';

import { useState } from 'react';
import { supabase } from '../../lib/supabaseClient';

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
        // 1. Sign Up Validation for Admin/Reviewer
        if (role === 'admin' && adminPasscode !== '0000') {
          setErrorMsg('Kod Laluan Admin tidak sah. Sila hubungi pihak pentadbir.');
          setIsLoading(false);
          return;
        }
        if (role === 'reviewer' && adminPasscode !== '1234') {
          setErrorMsg('Kod Laluan Penyemak tidak sah. Sila hubungi pihak pentadbir.');
          setIsLoading(false);
          return;
        }

        if (role === 'reviewer' && !title) {
          setErrorMsg('Sila pilih gelaran/jawatan anda.');
          setIsLoading(false);
          return;
        }

        // 2. Perform Supabase Sign Up
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: typeof window !== 'undefined' ? `${window.location.origin}/` : undefined,
            data: {
              full_name: fullName,
              role: role,
              title: role === 'reviewer' ? title : (role === 'admin' ? 'Admin' : 'Guru'),
            },
          },
        });

        if (error) {
          setErrorMsg('Ralat Pendaftaran: ' + error.message);
          setIsLoading(false);
        } else {
          if (data.session) {
            setSuccessMsg('Pendaftaran berjaya! Membuka portal anda...');
          } else {
            setSuccessMsg('Pendaftaran berjaya! Sila semak peti masuk e-mel anda untuk pautan pengesahan akaun.');
            setIsLoading(false);
            setFullName('');
            setEmail('');
            setPassword('');
            setAdminPasscode('');
          }
        }
      } else if (authMode === 'forgot') {
        // Perform Supabase Password Reset Request
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: typeof window !== 'undefined' ? `${window.location.origin}/reset-password` : undefined,
        });

        if (error) {
          setErrorMsg('Ralat Penghantaran: ' + error.message);
        } else {
          setSuccessMsg('E-mel untuk set semula kata laluan telah dihantar. Sila semak peti masuk anda.');
          setEmail('');
        }
        setIsLoading(false);
      } else {
        // Perform Supabase Login
        let processedEmail = email;
        let processedPassword = password;
        if (email.trim().toLowerCase() === 'adminsekolah' && (password === '0000' || password === '000')) {
          processedEmail = 'adminsekolah@sekolah.com';
          processedPassword = '0000';
        }
        
        let { data, error } = await supabase.auth.signInWithPassword({
          email: processedEmail,
          password: processedPassword,
        });

        // Fallback to the old default credentials if the new database schema has not been run yet
        if (error && email.trim().toLowerCase() === 'adminsekolah' && (password === '0000' || password === '000')) {
          const fallback = await supabase.auth.signInWithPassword({
            email: 'admin@sekolah.com',
            password: 'password123',
          });
          if (!fallback.error) {
            data = fallback.data;
            error = null;
          }
        }

        if (error) {
          let malaysianError = error.message;
          if (error.message.includes('Invalid login credentials')) {
            malaysianError = 'E-mel atau kata laluan tidak sah. Sila cuba lagi.';
          } else if (error.message.includes('Email not confirmed')) {
            malaysianError = 'E-mel anda belum disahkan. Sila semak peti masuk anda.';
          }
          setErrorMsg(malaysianError);
          setIsLoading(false);
        } else {
          setSuccessMsg('Log masuk berjaya! Membuka portal...');
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
      {/* 1. Left Side: Beautiful Banner column (Hidden on mobile or shows as top banner) */}
      <div className="hidden lg:block relative w-full lg:w-1/2 h-64 lg:h-auto flex-shrink-0 overflow-hidden">
        {/* Banner image with a sleek purple gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t lg:bg-gradient-to-r from-purple-900/90 to-purple-800/40 z-10"></div>
        <img 
          src="/assets/image/teacher-and-kids-in-class.png" 
          alt="Banner RPH" 
          className="w-full h-full object-cover object-center scale-105 hover:scale-100 transition-transform duration-700"
        />
        {/* Banner text overlay */}
        <div className="absolute inset-0 z-20 flex flex-col justify-end p-8 lg:p-16 text-white max-w-xl">
          <div className="inline-flex items-center space-x-2 bg-white/20 backdrop-blur-md px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider mb-4 border border-white/10 w-fit">
            <span>Portal Pintar Akademik</span>
          </div>
          <h2 className="text-2xl lg:text-4xl font-extrabold tracking-tight leading-tight drop-shadow-md">
            Urus Rancangan Pengajaran Harian (RPH) Dengan Mudah
          </h2>
          <p className="text-xs lg:text-sm text-purple-200 mt-2 font-medium drop-shadow-sm">
            Sistem automasi yang memudahkan penyediaan RPH, pemantauan pentadbir, dan cetakan laporan PDF berkualiti tinggi.
          </p>
        </div>
      </div>

      {/* 2. Right Side: Login Form with the reference image design aesthetics */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 lg:p-16">
        <div className="relative w-full max-w-md bg-slate-900/70 backdrop-blur-md border border-slate-800 p-8 rounded-[2rem] shadow-2xl shadow-purple-500/10 transition-all duration-300">
          
          {/* App Logo & Header matching the reference styling */}
          <div className="flex flex-col items-center mb-8 text-center">
            {/* White rounded icon container just like "App" in the reference */}
            <div className="w-20 h-20 rounded-2xl bg-slate-800 flex items-center justify-center p-4 shadow-xl border border-slate-100 dark:border-slate-700 mb-4 animate-pulse">
              <img src="/assets/logo/graduation.png" alt="App Logo" className="w-full h-full object-contain brightness-0 invert" />
            </div>
            <h1 className="text-2xl font-extrabold text-slate-100 tracking-tight">
              {authMode === 'signup' 
                ? 'Daftar Akaun' 
                : authMode === 'forgot'
                ? 'Set Semula Kata Laluan'
                : 'Selamat Datang!'}
            </h1>
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-1.5">
              {authMode === 'signup' 
                ? 'Sila isi maklumat untuk mendaftar profil anda.' 
                : authMode === 'forgot'
                ? 'Masukkan e-mel anda untuk menerima pautan set semula.'
                : 'Sila log masuk ke portal RPH Tracker anda.'}
            </p>
          </div>

          {/* Success Alert Box */}
          {successMsg && (
            <div className="mb-4 p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/60 text-emerald-800 dark:text-emerald-300 text-xs font-semibold flex items-start space-x-2.5 animate-fadeIn">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" className="w-5 h-5 shrink-0 mt-0.5 text-emerald-600 dark:text-emerald-500">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 0 1-1.043 3.296 3.745 3.745 0 0 1-3.296 1.043A3.745 3.745 0 0 1 12 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 0 1-3.296-1.043 3.745 3.745 0 0 1-1.043-3.296A3.745 3.745 0 0 1 3 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 0 1 1.043-3.296 3.746 3.746 0 0 1 3.296-1.043A3.746 3.746 0 0 1 12 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 0 1 3.296 1.043 3.746 3.746 0 0 1 1.043 3.296A3.745 3.745 0 0 1 21 12Z" />
              </svg>
              <span>{successMsg}</span>
            </div>
          )}

          {/* Error Alert Box */}
          {errorMsg && (
            <div className="mb-4 p-4 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 text-red-800 dark:text-red-300 text-xs font-semibold flex items-start space-x-2.5 animate-fadeIn">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" className="w-5 h-5 shrink-0 mt-0.5 text-red-600 dark:text-red-500">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" />
              </svg>
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleAuth} className="space-y-4">
            
            {/* Full Name (Sign Up only) */}
            {authMode === 'signup' && (
              <div>
                <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                  Nama Penuh
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400 dark:text-slate-500">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" className="w-4 h-4">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
                    </svg>
                  </span>
                  <input 
                    type="text" 
                    placeholder="Contoh: Cikgu Ahmad Bin Yusof" 
                    className="w-full bg-slate-800 border border-slate-700 text-slate-100 rounded-xl py-2.5 pl-10 pr-4 text-xs focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500/20 placeholder-slate-400 dark:placeholder-slate-700 transition-all" 
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)} 
                    required 
                    disabled={isLoading}
                  />
                </div>
              </div>
            )}

            {/* Email */}
            <div>
              <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                E-mel
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400 dark:text-slate-500">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" className="w-4 h-4">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75" />
                  </svg>
                </span>
                <input 
                  type="email" 
                  placeholder="nama@sekolah.edu.my" 
                  className="w-full bg-slate-800 border border-slate-700 text-slate-100 rounded-xl py-2.5 pl-10 pr-4 text-xs focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500/20 placeholder-slate-400 dark:placeholder-slate-700 transition-all" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)} 
                  required 
                  disabled={isLoading}
                />
              </div>
            </div>
            
            {/* Password (Login & Signup only) */}
            {authMode !== 'forgot' && (
              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Kata Laluan
                  </label>
                  {authMode === 'login' && (
                    <button
                      type="button"
                      onClick={() => {
                        setAuthMode('forgot');
                        setErrorMsg('');
                        setSuccessMsg('');
                      }}
                      className="text-[10px] font-bold text-purple-600 dark:text-purple-400 hover:underline cursor-pointer"
                    >
                      Lupa Kata Laluan?
                    </button>
                  )}
                </div>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400 dark:text-slate-500">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" className="w-4 h-4">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0V10.5m-2.85 0a2.25 2.25 0 0 0-2.25 2.25v7.5a2.25 2.25 0 0 0 2.25 2.25h13.7a2.25 2.25 0 0 0 2.25-2.25v-7.5a2.25 2.25 0 0 0-2.25-2.25M16.5 10.5h-9" />
                    </svg>
                  </span>
                  <input 
                    type="password" 
                    placeholder="••••••••" 
                    className="w-full bg-slate-800 border border-slate-700 text-slate-100 rounded-xl py-2.5 pl-10 pr-4 text-xs focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500/20 placeholder-slate-400 dark:placeholder-slate-700 transition-all" 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)} 
                    required 
                    disabled={isLoading}
                  />
                </div>
              </div>
            )}

            {/* Role (Sign Up only) */}
            {authMode === 'signup' && (
              <div>
                <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                  Peranan
                </label>
                <select
                  className="w-full bg-slate-800 border border-slate-700 text-slate-100 rounded-xl py-2.5 px-3.5 text-xs focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500/20"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  disabled={isLoading}
                >
                  <option value="teacher">Guru (Teacher)</option>
                  <option value="reviewer">Penyemak (Reviewer)</option>
                  <option value="admin">Pentadbir (Admin)</option>
                </select>
              </div>
            )}

            {/* Reviewer Designation Title Dropdown (Reviewer role only) */}
            {authMode === 'signup' && role === 'reviewer' && (
              <div className="animate-slideDown">
                <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-455 uppercase tracking-wider mb-1.5">
                  Gelaran / Jawatan
                </label>
                <select
                  className="w-full bg-slate-800 border border-slate-700 text-slate-100 rounded-xl py-2.5 px-3.5 text-xs focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500/20"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  disabled={isLoading}
                  required
                >
                  <option value="">-- Pilih Jawatan --</option>
                  <option value="GB">GB (Guru Besar)</option>
                  <option value="PKP">PKP (Penolong Kanan Pentadbiran)</option>
                  <option value="PK HEM">PK HEM (Penolong Kanan Hal Ehwal Murid)</option>
                  <option value="PK KO">PK KO (Penolong Kanan Kokurikulum)</option>
                </select>
              </div>
            )}

            {/* Passcode (Sign Up & Admin/Reviewer role only) */}
            {authMode === 'signup' && (role === 'admin' || role === 'reviewer') && (
              <div className="animate-slideDown">
                <label className="block text-[10px] font-bold text-rose-500 dark:text-rose-455 uppercase tracking-wider mb-1.5">
                  {role === 'admin' ? 'Kod Laluan Admin' : 'Kod Laluan Penyemak'}
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400 dark:text-slate-500">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" className="w-4 h-4">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.75c0 5.592 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.57-.598-3.75h-.152c-3.196 0-6.1-1.249-8.25-3.286Zm0 13.036h.008v.008H12v-.008Z" />
                    </svg>
                  </span>
                  <input 
                    type="password" 
                    placeholder={role === 'admin' ? 'Isi kod laluan pentadbir sekolah' : 'Isi kod laluan penyemak'} 
                    className="w-full bg-slate-800 border border-rose-200 dark:border-rose-900 text-slate-100 rounded-xl py-2.5 pl-10 pr-4 text-xs focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500/20 placeholder-slate-400 dark:placeholder-slate-700 transition-all" 
                    value={adminPasscode}
                    onChange={(e) => setAdminPasscode(e.target.value)} 
                    required 
                    disabled={isLoading}
                  />
                </div>
              </div>
            )}

            {/* Submit Button */}
            <button 
              type="submit" 
              className="w-full bg-gradient-to-r from-purple-650 to-purple-600 hover:from-purple-600 hover:to-purple-550 active:scale-95 text-white font-bold py-3 px-4 rounded-full shadow-lg shadow-purple-500/25 transition duration-200 flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-55 disabled:cursor-not-allowed text-xs mt-6"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Sila tunggu...</span>
                </>
              ) : (
                <span>
                  {authMode === 'signup' 
                    ? 'Daftar Akaun' 
                    : authMode === 'forgot'
                    ? 'Hantar E-mel Set Semula'
                    : 'Log Masuk'}
                </span>
              )}
            </button>
          </form>

          {/* View Toggle Footers */}
          <div className="mt-6 text-center text-xs space-y-2">
            {authMode === 'login' && (
              <p className="text-slate-500 dark:text-slate-400">
                Belum mempunyai akaun?
                <button
                  onClick={() => {
                    setAuthMode('signup');
                    setErrorMsg('');
                    setSuccessMsg('');
                  }}
                  className="text-purple-650 hover:text-purple-600 font-bold ml-1 transition cursor-pointer"
                  disabled={isLoading}
                >
                  Daftar Akaun di sini
                </button>
              </p>
            )}

            {authMode !== 'login' && (
              <p className="text-slate-500 dark:text-slate-400">
                Sudah mempunyai akaun?
                <button
                  onClick={() => {
                    setAuthMode('login');
                    setErrorMsg('');
                    setSuccessMsg('');
                  }}
                  className="text-purple-650 hover:text-purple-600 font-bold ml-1 transition cursor-pointer"
                  disabled={isLoading}
                >
                  Log Masuk di sini
                </button>
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}