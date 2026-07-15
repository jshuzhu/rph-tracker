import './globals.css';
import { AuthProvider } from '../lib/authProvider';
import AuthGuard from '../components/authGuard';
import Navbar from '../components/Navbar';
import BottomNav from '../components/BottomNav';

export const metadata = {
  title: 'RPH Tracker',
  description: 'Sistem Automasi Sekolah Pintar',
};

export default function RootLayout({ children }) {
  return (
    <html lang="ms" className="h-full">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;750;800&display=swap" rel="stylesheet" />
      </head>
      <body className="bg-slate-950 text-slate-900 min-h-full flex flex-col antialiased font-sans">
        <AuthProvider>
          <AuthGuard>
            {/* Global Navbar */}
            <Navbar />
            
            {/* Global Mobile Bottom Navigation */}
            <BottomNav />

            {/* Main content area */}
            <main className="flex-grow flex flex-col pb-16 md:pb-0 animated-gradient-bg">
              {children}
            </main>


          </AuthGuard>
        </AuthProvider>
      </body>
    </html>
  );
}