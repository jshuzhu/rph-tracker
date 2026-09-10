'use client';
import Link from 'next/link';
export default function PlaceholderPage() {
  return (
    <div className="p-12 text-center text-slate-400">
      <h1 className="text-xl font-bold text-white mb-4">Halaman Sedang Diselenggara</h1>
      <p className="mb-6">Modul ini sedang dinaik taraf ke pangkalan data Firebase.</p>
      <Link href="/dashboard" className="bg-purple-600 text-white px-4 py-2 rounded-xl">Kembali</Link>
    </div>
  );
}