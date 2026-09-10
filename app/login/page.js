'use client';

import { useState } from 'react';
import { auth, db } from '../../lib/firebase';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, sendPasswordResetEmail } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';

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
        // Validation for Admin/Reviewer
        if (role === 'admin' && adminPasscode !== '0000') {
          setErrorMsg('Kod Laluan Admin tidak sah.');
          setIsLoading(false); return;
        }
        if (role === 'reviewer' && adminPasscode !== '1234') {
          setErrorMsg('Kod Laluan Penyemak tidak sah.');
          setIsLoading(false); return;
        }
        if (role === 'reviewer' && !title) {
          setErrorMsg('Sila pilih gelaran/jawatan anda.');
          setIsLoading(false); return;
        }

        // Create User in Firebase Auth
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        // Save User Profile in Firestore
        await setDoc(doc(db, 'users', user.uid), {
          email: user.email,
          fullName,
          role,
          title: role === 'reviewer' ? title : (role === 'admin' ? 'Admin' : 'Guru'),
          created_at: new Date().toISOString()
        });

        setSuccessMsg('Pendaftaran berjaya! Membuka portal anda...');
        window.location.href = '/dashboard';
        
      } else if (authMode === 'forgot') {
        // Firebase Password Reset
        await sendPasswordResetEmail(auth, email);
        setSuccessMsg('Pautan set semula kata laluan telah dihantar ke e-mel anda.');
        setIsLoading(false);
        
      } else {
        // Firebase Login
        await signInWithEmailAndPassword(auth, email, password);
        setSuccessMsg('Log masuk berjaya! Sedang memuatkan portal...');
        window.location.href = '/';
      }
    } catch (err) {
      console.error('Authentication error:', err);
      // Format ralat Firebase ke Bahasa Melayu
      if (err.code === 'auth/email-already-in-use') setErrorMsg('Emel ini telah didaftarkan.');
      else if (err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') setErrorMsg('Kata laluan atau emel salah.');
      else if (err.code === 'auth/user-not-found') setErrorMsg('Akaun tidak dijumpai.');
      else setErrorMsg('Terdapat ralat teknikal: ' + err.message);
      
      setIsLoading(false);
    }
  };

  return (
    <div className="relative flex-grow flex flex-col lg:flex-row min-h-[calc(100vh-4rem)] bg-transparent text-slate-100 overflow-hidden">
      <div className="hidden lg:block relative w-full lg:w-1/2 h-64 lg:h-auto flex-shrink-0 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-t lg:bg-gradient-to-r from-purple-900/90 to-purple-800/40 z-10"></div>
        <img src="/assets/image/teacher-and-kids-in-class.png" alt="Banner RPH" className="w-full h-full object-cover object-center scale-105 hover:scale-100 transition-transform duration-700" />
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

      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 lg:p-16">
        <div className="relative w-full max-w-md bg-slate-900/70 backdrop-blur-md border border-slate-800 p-8 rounded-[2rem] shadow-2xl shadow-purple-500/10 transition-all duration-300">
          <div className="flex flex-col items-center mb-8 text-center">
            <div className="w-20 h-20 rounded-2xl bg-slate-800 flex items-center justify-center p-4 shadow-xl border border-slate-100 dark:border-slate-700 mb-4 animate-pulse">
              <img src="/assets/logo/graduation.png" alt="App Logo" className="w-full h-full object-contain brightness-0 invert" />
            </div>
            <h1 className="text-2xl font-extrabold text-slate-100 tracking-tight">
              {authMode === 'signup' ? 'Daftar Akaun' : authMode === 'forgot' ? 'Set Semula Kata Laluan' : 'Selamat Datang!'}
            </h1>
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-1.5">
              {authMode === 'signup' ? 'Sila isi maklumat untuk mendaftar profil anda.' : authMode === 'forgot' ? 'Masukkan e-mel anda untuk menerima pautan set semula.' : 'Sila log masuk ke portal RPH Tracker anda.'}
            </p>
          </div>

          {errorMsg && (
            <div className="bg-rose-500/10 border border-rose-500/30 text-rose-500 p-3 rounded-xl mb-6 text-xs font-semibold flex items-center shadow-inner">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4 mr-2 flex-shrink-0">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              {errorMsg}
            </div>
          )}

          {successMsg && (
            <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-500 p-3 rounded-xl mb-6 text-xs font-semibold flex items-center shadow-inner animate-pulse">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4 mr-2 flex-shrink-0">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {successMsg}
            </div>
          )}

          <form onSubmit={handleAuth} className="space-y-4">
            {authMode === 'signup' && (
              <div>
                <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">Nama Penuh</label>
                <input type="text" placeholder="Isi nama penuh anda" className="w-full bg-slate-800 border border-slate-700 text-slate-100 rounded-xl py-2.5 px-3.5 text-xs focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500/20" value={fullName} onChange={(e) => setFullName(e.target.value)} required disabled={isLoading} />
              </div>
            )}

            <div>
              <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">Alamat E-mel</label>
              <input type="email" placeholder="contoh@sekolah.edu.my" className="w-full bg-slate-800 border border-slate-700 text-slate-100 rounded-xl py-2.5 px-3.5 text-xs focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500/20" value={email} onChange={(e) => setEmail(e.target.value)} required disabled={isLoading} />
            </div>

            {authMode !== 'forgot' && (
              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Kata Laluan</label>
                  {authMode === 'login' && (
                    <button type="button" onClick={() => { setAuthMode('forgot'); setErrorMsg(''); setSuccessMsg(''); }} className="text-[10px] font-bold text-purple-600 hover:underline cursor-pointer">Lupa Kata Laluan?</button>
                  )}
                </div>
                <input type="password" placeholder="********" className="w-full bg-slate-800 border border-slate-700 text-slate-100 rounded-xl py-2.5 px-3.5 text-xs focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500/20" value={password} onChange={(e) => setPassword(e.target.value)} required disabled={isLoading} />
              </div>
            )}

            {authMode === 'signup' && (
              <div>
                <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">Peranan</label>
                <select className="w-full bg-slate-800 border border-slate-700 text-slate-100 rounded-xl py-2.5 px-3.5 text-xs focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500/20" value={role} onChange={(e) => setRole(e.target.value)} disabled={isLoading}>
                  <option value="teacher">Guru (Teacher)</option>
                  <option value="reviewer">Penyemak (Reviewer)</option>
                  <option value="admin">Pentadbir (Admin)</option>
                </select>
              </div>
            )}

            {authMode === 'signup' && role === 'reviewer' && (
              <div>
                <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">Gelaran / Jawatan</label>
                <select className="w-full bg-slate-800 border border-slate-700 text-slate-100 rounded-xl py-2.5 px-3.5 text-xs focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500/20" value={title} onChange={(e) => setTitle(e.target.value)} disabled={isLoading} required>
                  <option value="">-- Pilih Jawatan --</option>
                  <option value="GB">GB (Guru Besar)</option>
                  <option value="PKP">PKP (Penolong Kanan Pentadbiran)</option>
                  <option value="PK HEM">PK HEM (Penolong Kanan Hal Ehwal Murid)</option>
                  <option value="PK KO">PK KO (Penolong Kanan Kokurikulum)</option>
                </select>
              </div>
            )}

            {authMode === 'signup' && (role === 'admin' || role === 'reviewer') && (
              <div>
                <label className="block text-[10px] font-bold text-rose-500 uppercase tracking-wider mb-1.5">{role === 'admin' ? 'Kod Laluan Admin' : 'Kod Laluan Penyemak'}</label>
                <input type="password" placeholder="Isi kod laluan" className="w-full bg-slate-800 border border-rose-900 text-slate-100 rounded-xl py-2.5 px-3.5 text-xs focus:outline-none focus:border-rose-500" value={adminPasscode} onChange={(e) => setAdminPasscode(e.target.value)} required disabled={isLoading} />
              </div>
            )}

            <button type="submit" className="w-full bg-gradient-to-r from-purple-650 to-purple-600 hover:from-purple-600 text-white font-bold py-3 px-4 rounded-full text-xs mt-6" disabled={isLoading}>
              {isLoading ? 'Sila tunggu...' : authMode === 'signup' ? 'Daftar Akaun' : authMode === 'forgot' ? 'Hantar E-mel Set Semula' : 'Log Masuk'}
            </button>
          </form>

          <div className="mt-6 text-center text-xs space-y-2">
            {authMode === 'login' && (
              <p className="text-slate-400">Belum mempunyai akaun? <button onClick={() => { setAuthMode('signup'); setErrorMsg(''); setSuccessMsg(''); }} className="text-purple-650 hover:text-purple-600 font-bold ml-1 cursor-pointer" disabled={isLoading}>Daftar Akaun</button></p>
            )}
            {authMode !== 'login' && (
              <p className="text-slate-400">Sudah mempunyai akaun? <button onClick={() => { setAuthMode('login'); setErrorMsg(''); setSuccessMsg(''); }} className="text-purple-650 hover:text-purple-600 font-bold ml-1 cursor-pointer" disabled={isLoading}>Log Masuk</button></p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
