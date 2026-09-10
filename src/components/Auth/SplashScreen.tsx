import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext.tsx';
import { User } from '../../types/index.ts';
import {
  GraduationCap,
  Sparkles,
  ShieldCheck,
  Users,
  KeyRound,
  ArrowRight,
  BookOpen,
  DollarSign,
  Calendar,
  Lock,
  Search,
  CheckCircle2,
} from 'lucide-react';
import { TEMPLATE_39_STUDENTS } from '../../services/firestoreSync.ts';

interface SplashScreenProps {
  onEnterAsUser: (userId: string) => void;
  onLoginGoogle: () => void;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({
  onEnterAsUser,
  onLoginGoogle,
}) => {
  const { allUsers } = useAuth();
  const [selectedStudentId, setSelectedStudentId] = useState<string>('usr_member_25'); // Default to Ketua / Super Admin
  const [showPicker, setShowPicker] = useState<boolean>(false);
  const [proCode, setProCode] = useState<string>('');
  const [searchFilter, setSearchFilter] = useState<string>('');
  const [proCodeMsg, setProCodeMsg] = useState<string | null>(null);

  const studentList = allUsers.length > 0 ? allUsers : TEMPLATE_39_STUDENTS;

  const handleProCodeEnter = () => {
    const clean = proCode.trim().toUpperCase();
    if (clean === '01SAKP014PRO' || clean === '01SAKP014' || clean === 'SAKP14PRO') {
      setProCodeMsg('✨ Kode Pro Terverifikasi! Membuka Portal...');
      setTimeout(() => {
        onEnterAsUser('usr_member_25'); // Enter as Super Admin / Ketua
      }, 500);
    } else if (clean) {
      setProCodeMsg('❌ Kode Pro tidak valid. Gunakan 01SAKP014PRO atau pilih profil di bawah.');
    }
  };

  const filteredStudents = studentList.filter((s) =>
    s.name.toLowerCase().includes(searchFilter.toLowerCase()) ||
    s.nim.includes(searchFilter) ||
    (s.role_name || '').toLowerCase().includes(searchFilter.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-linear-to-b from-slate-900 via-slate-950 to-blue-950 text-white flex flex-col justify-between p-4 sm:p-6 lg:p-10 antialiased selection:bg-blue-600 selection:text-white">
      {/* Top Bar Branding */}
      <header className="max-w-6xl mx-auto w-full flex items-center justify-between pt-2">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-blue-600/30 border border-blue-400/40 text-blue-300 flex items-center justify-center shadow-lg shadow-blue-500/20 backdrop-blur-md">
            <GraduationCap className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-bold tracking-widest text-blue-400 uppercase">
              Portal Akademik Digital
            </span>
            <h1 className="text-sm sm:text-base font-extrabold tracking-tight text-white">
              01 SAKP 14 • FEB
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-xs font-semibold">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            Cloud Firestore Aktif
          </span>
          <span className="hidden sm:inline-block px-2.5 py-1 rounded-full bg-white/10 text-slate-300 text-xs font-mono font-medium">
            v3.0.0
          </span>
        </div>
      </header>

      {/* Main Hero Card Container */}
      <main className="max-w-4xl mx-auto w-full my-auto py-8">
        <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-800 rounded-3xl p-6 sm:p-10 shadow-2xl space-y-8">
          {/* Header Title Section */}
          <div className="text-center space-y-3">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-500/10 border border-blue-400/20 text-blue-300 text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5 text-blue-400" />
              S1 Akuntansi Perpajakan • Semester 1 (Ganjil)
            </div>
            <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-white leading-tight">
              Selamat Datang di <span className="text-transparent bg-clip-text bg-linear-to-r from-blue-400 to-indigo-300">Kelas Manajer</span>
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 max-w-xl mx-auto leading-relaxed">
              Sistem koordinasi perkuliahan resmi Kelas 01 SAKP 14. Transparansi kas kelas, agenda perkuliahan, notulensi rapat, dan arsip penugasan terpadu.
            </p>
          </div>

          {/* Quick Stats Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
            <div className="p-3.5 bg-slate-800/60 rounded-2xl border border-slate-700/60">
              <p className="text-xs text-slate-400 font-medium">Roster Kelas</p>
              <p className="text-lg sm:text-xl font-bold text-white mt-0.5">39 Mahasiswa</p>
            </div>
            <div className="p-3.5 bg-slate-800/60 rounded-2xl border border-slate-700/60">
              <p className="text-xs text-slate-400 font-medium">Iuran Kas Wajib</p>
              <p className="text-lg sm:text-xl font-bold text-emerald-400 mt-0.5">Rp 20.000 / bln</p>
            </div>
            <div className="p-3.5 bg-slate-800/60 rounded-2xl border border-slate-700/60">
              <p className="text-xs text-slate-400 font-medium">Sistem Keamanan</p>
              <p className="text-lg sm:text-xl font-bold text-indigo-300 mt-0.5">RBAC Matrix</p>
            </div>
            <div className="p-3.5 bg-slate-800/60 rounded-2xl border border-slate-700/60">
              <p className="text-xs text-slate-400 font-medium">Database Isolasi</p>
              <p className="text-lg sm:text-xl font-bold text-amber-300 mt-0.5">Classify Pro</p>
            </div>
          </div>

          {/* Action Center */}
          <div className="space-y-4 pt-2">
            {/* Primary Action: Google Login */}
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={onLoginGoogle}
                className="flex-1 px-6 py-3.5 bg-white hover:bg-slate-100 text-slate-950 font-bold rounded-2xl shadow-xl transition-all flex items-center justify-center gap-3 cursor-pointer group"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
                <span>Masuk dengan Akun Google</span>
                <ArrowRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition-transform" />
              </button>

              <button
                onClick={() => setShowPicker(!showPicker)}
                className="px-5 py-3.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white font-semibold rounded-2xl transition-colors flex items-center justify-center gap-2 cursor-pointer"
              >
                <Users className="w-4 h-4 text-blue-400" />
                <span>Pilih Profil Mahasiswa</span>
              </button>
            </div>

            {/* Passcode Auto-Approval Instant Bar */}
            <div className="p-4 bg-slate-950/60 rounded-2xl border border-slate-800 flex flex-col sm:flex-row items-center gap-3">
              <div className="flex items-center gap-2 text-xs text-amber-300 font-semibold shrink-0">
                <KeyRound className="w-4 h-4 text-amber-400" />
                <span>Master Passcode:</span>
              </div>
              <div className="flex-1 flex w-full items-center gap-2">
                <input
                  type="text"
                  placeholder="Ketik 01SAKP014PRO untuk akses instan..."
                  value={proCode}
                  onChange={(e) => {
                    setProCode(e.target.value);
                    setProCodeMsg(null);
                  }}
                  onKeyDown={(e) => e.key === 'Enter' && handleProCodeEnter()}
                  className="flex-1 px-3.5 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 font-mono focus:outline-blue-500"
                />
                <button
                  onClick={handleProCodeEnter}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl transition-colors cursor-pointer shrink-0"
                >
                  Buka Akses
                </button>
              </div>
            </div>

            {proCodeMsg && (
              <p className="text-xs text-center font-medium animate-in fade-in-50 text-amber-300">
                {proCodeMsg}
              </p>
            )}

            {/* Quick Profile Select Drawer */}
            {showPicker && (
              <div className="p-4 sm:p-5 bg-slate-950 rounded-2xl border border-slate-800 space-y-3 animate-in fade-in-50">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                    <BookOpen className="w-3.5 h-3.5 text-blue-400" /> Daftar Mahasiswa Roster (39 Orang)
                  </span>
                  <span className="text-[11px] text-slate-500">Klik nama untuk langsung masuk</span>
                </div>

                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-3" />
                  <input
                    type="text"
                    placeholder="Cari nama atau NIM mahasiswa..."
                    value={searchFilter}
                    onChange={(e) => setSearchFilter(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-blue-500"
                  />
                </div>

                <div className="max-h-56 overflow-y-auto space-y-1.5 pr-1 text-xs">
                  {filteredStudents.map((stu, idx) => (
                    <button
                      key={stu.id}
                      onClick={() => onEnterAsUser(stu.id)}
                      className="w-full p-2.5 rounded-xl bg-slate-900/80 hover:bg-blue-600/30 border border-slate-800/80 hover:border-blue-500/50 flex items-center justify-between transition-colors text-left cursor-pointer group"
                    >
                      <div className="flex items-center gap-2.5 overflow-hidden">
                        <span className="text-slate-500 font-mono text-[10px] w-5 text-right">{idx + 1}.</span>
                        <div className="overflow-hidden">
                          <p className="font-semibold text-white truncate group-hover:text-blue-300">{stu.name}</p>
                          <p className="text-[10px] text-slate-400 font-mono">{stu.nim} • {stu.role_name || stu.position || 'Anggota'}</p>
                        </div>
                      </div>
                      <span className="text-[10px] font-semibold text-blue-400 group-hover:text-white px-2 py-0.5 rounded-md bg-blue-500/10 group-hover:bg-blue-600 shrink-0">
                        Masuk →
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Footer System Info */}
      <footer className="max-w-6xl mx-auto w-full text-center text-xs text-slate-300 space-y-1 pb-2">
        <p>© 2026 Kelas Manajer 01 SAKP 14 • Fakultas Ekonomi dan Bisnis.</p>
        <p className="text-[11px] text-slate-400">
          Powered by Cloud Firestore Realtime Sync • Zero-Spill Database Isolation
        </p>
      </footer>
    </div>
  );
};
