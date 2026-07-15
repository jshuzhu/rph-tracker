'use client';

import { useState } from 'react';
import { supabase } from '../../lib/supabaseClient';

export default function ResetPasswordPage() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const handleReset = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    if (password !== confirmPassword) {
      setErrorMsg('Kata laluan tidak sepadan.');
      setIsLoading(false);
      return;
    }

    try {
      const { error } = await supabase.auth.updateUser({
        password: password,
      });

      if (error) {
        setErrorMsg('Gagal mengemas kini kata laluan: ' + error.message);
      } else {
        setSuccessMsg('Kata laluan berjaya dikemas kini! Mengarahkan anda ke halaman log masuk...');
        setTimeout(() => {
          window.location.href = '/login';
        }, 3000);
      }
    } catch (err) {
      console.error(err);
      setErrorMsg('Terdapat ralat teknikal. Sila cuba lagi.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative flex-grow flex items-center justify-center min-h-[calc(100vh-8rem)] bg-transparent text-slate-150 overflow-hidden px-4">
      {/* Decorative blurred background blobs */}
      <div className="absolute top-1/4 left-1/4 w-72 h-72 rounded-full bg-blue-600/10 blur-[100px] animate-pulse"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full bg-indigo-600/10 blur-[120px] animate-pulse [animation-delay:2s]"></div>

      {/* Card */}
      <div className="relative w-full max-w-md bg-slate-900/60 border border-slate-700 p-8 rounded-2xl shadow-2xl transition-all duration-300">
        
        {/* Header */}
        <div className="flex flex-col items-center mb-6 text-center">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center font-extrabold text-xl text-white shadow-xl shadow-blue-500/20 mb-3">
            R
          </div>
          <h1 className="text-2xl font-extrabold text-slate-100 tracking-tight">
            Kemaskini Kata Laluan
          </h1>
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-1.5">
            Sila masukkan kata laluan baharu anda di bawah.
          </p>
        </div>

        {/* Success message */}
        {successMsg && (
          <div className="mb-4 p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/60 text-emerald-800 dark:text-emerald-300 text-xs font-semibold flex items-start space-x-2.5 animate-fadeIn">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" className="w-5 h-5 shrink-0 mt-0.5 text-emerald-600 dark:text-emerald-500">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 0 1-1.043 3.296 3.745 3.745 0 0 1-3.296 1.043A3.745 3.745 0 0 1 12 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 0 1-3.296-1.043 3.745 3.745 0 0 1-1.043-3.296A3.745 3.745 0 0 1 3 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 0 1 1.043-3.296 3.746 3.746 0 0 1 3.296-1.043A3.746 3.746 0 0 1 12 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 0 1 3.296 1.043 3.746 3.746 0 0 1 1.043 3.296A3.745 3.745 0 0 1 21 12Z" />
            </svg>
            <span>{successMsg}</span>
          </div>
        )}

        {/* Error message */}
        {errorMsg && (
          <div className="mb-4 p-4 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 text-red-800 dark:text-red-300 text-xs font-semibold flex items-start space-x-2.5 animate-fadeIn">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" className="w-5 h-5 shrink-0 mt-0.5 text-red-600 dark:text-red-500">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" />
            </svg>
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleReset} className="space-y-4">
          <div>
            <label className="block text-[10px] font-bold text-slate-200 uppercase tracking-wider mb-1.5">
              Kata Laluan Baharu
            </label>
            <input 
              type="password" 
              placeholder="••••••••" 
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-slate-100 rounded-xl py-2.5 px-3.5 text-xs focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20" 
              value={password}
              onChange={(e) => setPassword(e.target.value)} 
              required 
              disabled={isLoading}
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-200 uppercase tracking-wider mb-1.5">
              Sahkan Kata Laluan Baharu
            </label>
            <input 
              type="password" 
              placeholder="••••••••" 
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-slate-100 rounded-xl py-2.5 px-3.5 text-xs focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20" 
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)} 
              required 
              disabled={isLoading}
            />
          </div>

          <button 
            type="submit" 
            className="w-full bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white font-bold py-2.5 px-4 rounded-xl shadow-lg transition duration-200 flex items-center justify-center space-x-2 text-xs cursor-pointer disabled:opacity-55"
            disabled={isLoading}
          >
            {isLoading ? 'Mengemaskini...' : 'Simpan Kata Laluan'}
          </button>
        </form>
      </div>
    </div>
  );
}
