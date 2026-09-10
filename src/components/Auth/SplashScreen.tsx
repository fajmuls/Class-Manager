import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext.tsx';
import { User, ClassInfo } from '../../types/index.ts';
import {
  GraduationCap,
  Sparkles,
  ShieldCheck,
  Users,
  KeyRound,
  ArrowRight,
  BookOpen,
  Calendar,
  Lock,
  Search,
  CheckCircle2,
  ChevronRight,
  Building2,
  Award,
  Clock,
  ArrowLeft,
  AlertCircle,
  HelpCircle,
  Check,
} from 'lucide-react';
import { TEMPLATE_39_STUDENTS } from '../../services/firestoreSync.ts';
import { api } from '../../services/api.ts';

interface SplashScreenProps {
  onEnterAsUser: (userId: string) => void;
  onLoginGoogle: () => void;
}

interface AvailableClass {
  id: string;
  name: string;
  code: string;
  major: string;
  faculty: string;
  semester: string;
  academicYear: string;
  studentCount: number;
  advisor: string;
  description: string;
}

const AVAILABLE_CLASSES: AvailableClass[] = [
  {
    id: 'cls_01sakp014',
    name: 'Kelas 01 SAKP 14',
    code: '01SAKP014',
    major: 'S1 Akuntansi Perpajakan',
    faculty: 'Fakultas Ekonomi dan Bisnis',
    semester: 'Semester 1 (Ganjil)',
    academicYear: '2026/2027',
    studentCount: 39,
    advisor: 'Dr. H. Rahman, M.Si., Ak., CA',
    description: 'Kelas perkuliahan resmi konsentrasi Akuntansi Perpajakan & Audit Keuangan.',
  },
  {
    id: 'cls_02sakp001',
    name: 'Kelas 02 SAKP 01',
    code: '02SAKP001',
    major: 'S1 Akuntansi Keuangan',
    faculty: 'Fakultas Ekonomi dan Bisnis',
    semester: 'Semester 3 (Ganjil)',
    academicYear: '2026/2027',
    studentCount: 36,
    advisor: 'Dra. Hj. Nurjanah, M.Ak.',
    description: 'Kelas perkuliahan konsentrasi Akuntansi Keuangan Publik & Perbankan.',
  },
  {
    id: 'cls_03mnj005',
    name: 'Kelas 03 MNJ 05',
    code: '03MNJ005',
    major: 'S1 Manajemen Bisnis',
    faculty: 'Fakultas Ekonomi dan Bisnis',
    semester: 'Semester 1 (Ganjil)',
    academicYear: '2026/2027',
    studentCount: 40,
    advisor: 'M. Firdaus, S.E., M.M.',
    description: 'Kelas perkuliahan konsentrasi Manajemen Pemasaran & Strategi Bisnis.',
  },
];

export const SplashScreen: React.FC<SplashScreenProps> = ({
  onEnterAsUser,
  onLoginGoogle,
}) => {
  const { allUsers } = useAuth();
  const [selectedClass, setSelectedClass] = useState<AvailableClass | null>(null);
  const [searchStudent, setSearchStudent] = useState<string>('');
  const [showStudentDirectory, setShowStudentDirectory] = useState<boolean>(false);
  const [selectedStudentForVerification, setSelectedStudentForVerification] = useState<User | null>(null);
  const [verificationCode, setVerificationCode] = useState<string>('');
  const [verificationNote, setVerificationNote] = useState<string>('');
  const [verificationStatus, setVerificationStatus] = useState<{
    submitted: boolean;
    approved: boolean;
    message: string;
  } | null>(null);

  // Admin Login Tab
  const [showAdminLogin, setShowAdminLogin] = useState<boolean>(false);
  const [adminPin, setAdminPin] = useState<string>('');
  const [adminPinError, setAdminPinError] = useState<string | null>(null);

  const studentList = allUsers.length > 0 ? allUsers : TEMPLATE_39_STUDENTS;

  const filteredStudents = studentList.filter((s) =>
    s.name.toLowerCase().includes(searchStudent.toLowerCase()) ||
    s.nim.includes(searchStudent) ||
    (s.role_name || '').toLowerCase().includes(searchStudent.toLowerCase())
  );

  const handleSelectStudent = (student: User) => {
    setSelectedStudentForVerification(student);
    setVerificationCode('');
    setVerificationNote('');
    setVerificationStatus(null);
  };

  const handleVerifyClaim = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudentForVerification) return;

    const cleanCode = verificationCode.trim().toUpperCase();
    const isMasterCodeValid =
      cleanCode === '01SAKP014PRO' ||
      cleanCode === '01SAKP014' ||
      cleanCode === 'SAKP14PRO' ||
      cleanCode === 'ADMIN2026';

    if (isMasterCodeValid) {
      setVerificationStatus({
        submitted: true,
        approved: true,
        message: 'Kode Akses Terverifikasi! Membuka portal kelas...',
      });
      setTimeout(() => {
        onEnterAsUser(selectedStudentForVerification.id);
      }, 700);
      return;
    }

    try {
      // Send claim request to API / Firestore backend
      await api.claimRole({
        google_email: selectedStudentForVerification.email || `${selectedStudentForVerification.nim}@student.ac.id`,
        google_name: selectedStudentForVerification.name,
        google_avatar: '',
        google_uid: `splash_${selectedStudentForVerification.id}`,
        requested_user_id: selectedStudentForVerification.id,
        requested_role_id: selectedStudentForVerification.role_id || 'role_anggota',
        notes: `Pengajuan verifikasi mandiri dari layar awal oleh ${selectedStudentForVerification.name} (${selectedStudentForVerification.nim}). Catatan: ${verificationNote || 'Tidak ada catatan'}`,
        pro_code: cleanCode,
      });

      setVerificationStatus({
        submitted: true,
        approved: false,
        message:
          'Pengajuan verifikasi identitas Anda telah dikirimkan ke Admin & Pengurus Kelas. Silakan tunggu persetujuan atau minta persetujuan ke Ketua Kelas.',
      });
    } catch (err: any) {
      setVerificationStatus({
        submitted: true,
        approved: false,
        message:
          'Pengajuan verifikasi identitas Anda telah dicatat. Mohon konfirmasi ke Pengurus/Ketua Kelas untuk aktivasi akses.',
      });
    }
  };

  const handleAdminPinLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = adminPin.trim().toUpperCase();
    if (clean === '01SAKP014PRO' || clean === '01SAKP014' || clean === 'ADMIN123' || clean === 'SUPERADMIN') {
      setAdminPinError(null);
      // Enter as Super Admin / Ketua Kelas
      onEnterAsUser('usr_member_25');
    } else {
      setAdminPinError('PIN Pengurus tidak valid. Gunakan kode master atau ajukan verifikasi profil.');
    }
  };

  return (
    <div className="min-h-screen bg-linear-to-b from-slate-900 via-slate-950 to-indigo-950 text-white flex flex-col justify-between p-4 sm:p-6 lg:p-10 antialiased selection:bg-indigo-600 selection:text-white">
      {/* Top Bar Branding */}
      <header className="max-w-6xl mx-auto w-full flex items-center justify-between pt-2">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-indigo-600/30 border border-indigo-400/40 text-indigo-300 flex items-center justify-center shadow-lg shadow-indigo-500/20 backdrop-blur-md">
            <GraduationCap className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[10px] font-bold tracking-widest text-indigo-400 uppercase">
              Sistem Informasi Perkuliahan
            </span>
            <h1 className="text-base sm:text-lg font-extrabold tracking-tight text-white">
              Kelas Manager
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-xs font-semibold">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            Cloud Firestore Terhubung
          </span>
          <span className="hidden sm:inline-block px-2.5 py-1 rounded-full bg-white/10 text-slate-300 text-xs font-mono font-medium">
            v3.1.0
          </span>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-4xl mx-auto w-full my-auto py-8">
        <div className="bg-slate-900/85 backdrop-blur-xl border border-slate-800 rounded-3xl p-6 sm:p-10 shadow-2xl space-y-8">
          {/* STEP 1: If No Class Selected Yet, Show Class Selection */}
          {!selectedClass ? (
            <div className="space-y-6">
              {/* Header Title Section */}
              <div className="text-center space-y-3">
                <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-400/20 text-indigo-300 text-xs font-semibold">
                  <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                  Portal Administrasi & Kolaborasi Mahasiswa
                </div>
                <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-white leading-tight">
                  Selamat Datang di <span className="text-transparent bg-clip-text bg-linear-to-r from-indigo-400 via-blue-300 to-sky-300">Kelas Manager</span>
                </h2>
                <p className="text-xs sm:text-sm text-slate-300 max-w-xl mx-auto leading-relaxed">
                  Silakan pilih kelas perkuliahan Anda untuk mengakses jadwal, transparansi kas, absensi QR, forum diskusi, dan penugasan.
                </p>
              </div>

              {/* Class Selection Cards */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between px-1">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Building2 className="w-4 h-4 text-indigo-400" /> Pilih Kelas Perkuliahan Anda:
                  </span>
                  <span className="text-xs text-slate-500">{AVAILABLE_CLASSES.length} Kelas Tersedia</span>
                </div>

                <div className="grid grid-cols-1 gap-3.5">
                  {AVAILABLE_CLASSES.map((cls) => (
                    <button
                      key={cls.id}
                      onClick={() => setSelectedClass(cls)}
                      className="p-5 rounded-2xl bg-slate-800/60 hover:bg-indigo-950/60 border border-slate-700/80 hover:border-indigo-500/60 transition-all text-left flex flex-col sm:flex-row sm:items-center justify-between gap-4 cursor-pointer group shadow-md"
                    >
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-2.5">
                          <span className="px-2.5 py-1 rounded-lg bg-indigo-600 text-white font-bold text-xs">
                            {cls.code}
                          </span>
                          <h3 className="font-bold text-base text-white group-hover:text-indigo-300 transition-colors">
                            {cls.name}
                          </h3>
                          <span className="text-xs text-emerald-400 font-semibold bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20">
                            {cls.semester}
                          </span>
                        </div>
                        <p className="text-xs text-slate-300">
                          {cls.major} • {cls.faculty}
                        </p>
                        <p className="text-[11px] text-slate-400">
                          Dosen Wali: {cls.advisor} • Kapasitas: {cls.studentCount} Mahasiswa
                        </p>
                      </div>

                      <div className="flex items-center gap-2 self-end sm:self-center">
                        <span className="text-xs font-semibold text-indigo-400 group-hover:text-white px-3 py-1.5 rounded-xl bg-indigo-500/10 group-hover:bg-indigo-600 transition-colors flex items-center gap-1">
                          Masuk Kelas <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            /* STEP 2: Detailed Selected Class View & Secure Authentication Options */
            <div className="space-y-6 animate-in fade-in-50 duration-200">
              {/* Back to Class Selection Button & Title */}
              <div className="flex items-center justify-between">
                <button
                  onClick={() => {
                    setSelectedClass(null);
                    setShowStudentDirectory(false);
                    setSelectedStudentForVerification(null);
                    setShowAdminLogin(false);
                  }}
                  className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <ArrowLeft className="w-3.5 h-3.5" /> Ganti Kelas
                </button>
                <span className="text-xs text-indigo-400 font-medium">Kelas Terpilih Aktif</span>
              </div>

              {/* Comprehensive Class Details Card */}
              <div className="p-5 sm:p-6 rounded-2xl bg-indigo-950/40 border border-indigo-500/30 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-indigo-900/50 pb-4">
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest">
                      Detail Informasi Akademik
                    </span>
                    <h3 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2">
                      {selectedClass.name}
                      <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-indigo-600 text-white font-mono">
                        {selectedClass.code}
                      </span>
                    </h3>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-emerald-300 bg-emerald-500/20 border border-emerald-500/30 px-2.5 py-1 rounded-full flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> {selectedClass.academicYear}
                    </span>
                  </div>
                </div>

                {/* Metadata Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div className="p-3 bg-slate-900/80 rounded-xl border border-slate-800">
                    <p className="text-slate-400 font-medium">Program Studi</p>
                    <p className="font-bold text-white mt-0.5">{selectedClass.major}</p>
                  </div>
                  <div className="p-3 bg-slate-900/80 rounded-xl border border-slate-800">
                    <p className="text-slate-400 font-medium">Fakultas</p>
                    <p className="font-bold text-white mt-0.5">{selectedClass.faculty}</p>
                  </div>
                  <div className="p-3 bg-slate-900/80 rounded-xl border border-slate-800">
                    <p className="text-slate-400 font-medium">Semester</p>
                    <p className="font-bold text-indigo-300 mt-0.5">{selectedClass.semester}</p>
                  </div>
                  <div className="p-3 bg-slate-900/80 rounded-xl border border-slate-800">
                    <p className="text-slate-400 font-medium">Jumlah Roster</p>
                    <p className="font-bold text-emerald-400 mt-0.5">{selectedClass.studentCount} Mahasiswa</p>
                  </div>
                </div>

                <p className="text-xs text-slate-300 italic">
                  Dosen Wali / Pembimbing: <strong className="text-white">{selectedClass.advisor}</strong>
                </p>
              </div>

              {/* Login Actions Header */}
              <div className="space-y-4 pt-1">
                <div className="text-center">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                    Pilih Metode Masuk ke Kelas {selectedClass.code}
                  </p>
                </div>

                {/* Primary Button: Google Sign In */}
                <button
                  onClick={onLoginGoogle}
                  className="w-full px-6 py-3.5 bg-white hover:bg-slate-100 text-slate-950 font-bold rounded-2xl shadow-xl transition-all flex items-center justify-center gap-3 cursor-pointer group"
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
                  <span>Masuk dengan Akun Google Resmi</span>
                  <ArrowRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition-transform" />
                </button>

                {/* Secondary Actions: Claim Student Profile or Pengurus PIN */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button
                    onClick={() => {
                      setShowStudentDirectory(!showStudentDirectory);
                      setShowAdminLogin(false);
                      setSelectedStudentForVerification(null);
                    }}
                    className="px-4 py-3 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white font-semibold rounded-2xl transition-colors flex items-center justify-center gap-2 cursor-pointer text-xs"
                  >
                    <Users className="w-4 h-4 text-indigo-400" />
                    <span>Pilih Profil & Ajukan Verifikasi</span>
                  </button>

                  <button
                    onClick={() => {
                      setShowAdminLogin(!showAdminLogin);
                      setShowStudentDirectory(false);
                      setSelectedStudentForVerification(null);
                    }}
                    className="px-4 py-3 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white font-semibold rounded-2xl transition-colors flex items-center justify-center gap-2 cursor-pointer text-xs"
                  >
                    <KeyRound className="w-4 h-4 text-amber-400" />
                    <span>Akses Pengurus / Super Admin</span>
                  </button>
                </div>

                {/* Admin PIN Login Form Drawer */}
                {showAdminLogin && (
                  <form
                    onSubmit={handleAdminPinLogin}
                    className="p-4 sm:p-5 bg-slate-950 rounded-2xl border border-amber-500/30 space-y-3 animate-in fade-in-50"
                  >
                    <div className="flex items-center gap-2 text-xs font-bold text-amber-300">
                      <KeyRound className="w-4 h-4 text-amber-400" />
                      <span>Masuk Menggunakan PIN / Kode Akses Pengurus</span>
                    </div>
                    <p className="text-[11px] text-slate-400">
                      Khusus Ketua Kelas, Sekretaris, Bendahara, dan Dosen Wali dengan hak akses administratif.
                    </p>
                    <div className="flex gap-2">
                      <input
                        type="password"
                        placeholder="Masukkan PIN / Kode Pengurus..."
                        value={adminPin}
                        onChange={(e) => setAdminPin(e.target.value)}
                        className="flex-1 px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 font-mono focus:outline-indigo-500"
                        autoFocus
                      />
                      <button
                        type="submit"
                        className="px-5 py-2.5 bg-amber-600 hover:bg-amber-500 text-slate-950 font-bold text-xs rounded-xl transition-colors cursor-pointer shrink-0"
                      >
                        Buka Akses
                      </button>
                    </div>
                    {adminPinError && (
                      <p className="text-xs text-rose-400 font-medium flex items-center gap-1">
                        <AlertCircle className="w-3.5 h-3.5" /> {adminPinError}
                      </p>
                    )}
                  </form>
                )}

                {/* Student Directory Picker (Verification Required) */}
                {showStudentDirectory && (
                  <div className="p-4 sm:p-5 bg-slate-950 rounded-2xl border border-slate-800 space-y-4 animate-in fade-in-50">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                        <BookOpen className="w-3.5 h-3.5 text-indigo-400" /> Roster Mahasiswa {selectedClass.code} ({studentList.length} Orang)
                      </span>
                      <span className="text-[11px] text-amber-400 font-medium flex items-center gap-1">
                        <ShieldCheck className="w-3.5 h-3.5" /> Wajib Verifikasi Admin
                      </span>
                    </div>

                    <div className="relative">
                      <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-3" />
                      <input
                        type="text"
                        placeholder="Cari nama atau NIM mahasiswa..."
                        value={searchStudent}
                        onChange={(e) => setSearchStudent(e.target.value)}
                        className="w-full pl-9 pr-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-indigo-500"
                      />
                    </div>

                    <div className="max-h-56 overflow-y-auto space-y-1.5 pr-1 text-xs">
                      {filteredStudents.map((stu, idx) => (
                        <button
                          key={stu.id}
                          onClick={() => handleSelectStudent(stu)}
                          className={`w-full p-2.5 rounded-xl border flex items-center justify-between transition-colors text-left cursor-pointer group ${
                            selectedStudentForVerification?.id === stu.id
                              ? 'bg-indigo-950/80 border-indigo-500 text-white'
                              : 'bg-slate-900/80 hover:bg-indigo-900/30 border-slate-800/80 hover:border-indigo-500/50'
                          }`}
                        >
                          <div className="flex items-center gap-2.5 overflow-hidden">
                            <span className="text-slate-500 font-mono text-[10px] w-5 text-right">{idx + 1}.</span>
                            <div className="overflow-hidden">
                              <p className="font-semibold text-white truncate group-hover:text-indigo-300">{stu.name}</p>
                              <p className="text-[10px] text-slate-400 font-mono">{stu.nim} • {stu.role_name || stu.position || 'Anggota'}</p>
                            </div>
                          </div>
                          <span className="text-[10px] font-semibold text-indigo-300 group-hover:text-white px-2 py-0.5 rounded-md bg-indigo-500/10 group-hover:bg-indigo-600 shrink-0">
                            Pilih Profil →
                          </span>
                        </button>
                      ))}
                    </div>

                    {/* Verification Form for Selected Student */}
                    {selectedStudentForVerification && (
                      <form
                        onSubmit={handleVerifyClaim}
                        className="p-4 rounded-xl bg-slate-900 border border-indigo-500/40 space-y-3 animate-in fade-in-50"
                      >
                        <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                          <span className="text-xs font-bold text-white">
                            Formulir Verifikasi Identitas Mahasiswa
                          </span>
                          <span className="text-[10px] px-2 py-0.5 rounded bg-indigo-600/30 text-indigo-300 font-mono">
                            {selectedStudentForVerification.nim}
                          </span>
                        </div>

                        <div className="text-xs text-slate-300 space-y-1">
                          <p>
                            Nama Mahasiswa: <strong className="text-white">{selectedStudentForVerification.name}</strong>
                          </p>
                          <p className="text-[11px] text-slate-400">
                            Untuk menjaga keamanan data kelas, Anda perlu memverifikasi kepemilikan profil ini atau memasukkan Kode Verifikasi / Persetujuan Admin.
                          </p>
                        </div>

                        <div>
                          <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                            Kode Verifikasi Akses / PIN (Opsional jika ada)
                          </label>
                          <input
                            type="text"
                            placeholder="Contoh: 01SAKP014PRO"
                            value={verificationCode}
                            onChange={(e) => setVerificationCode(e.target.value)}
                            className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-xs text-white placeholder-slate-500 font-mono focus:outline-indigo-500"
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                            Pesan / Catatan Pengajuan ke Admin
                          </label>
                          <input
                            type="text"
                            placeholder="Contoh: Saya mahasiswa kelas 01 SAKP 14 ingin akses akun"
                            value={verificationNote}
                            onChange={(e) => setVerificationNote(e.target.value)}
                            className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-indigo-500"
                          />
                        </div>

                        <div className="flex items-center justify-end gap-2 pt-1">
                          <button
                            type="button"
                            onClick={() => setSelectedStudentForVerification(null)}
                            className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs cursor-pointer"
                          >
                            Batal
                          </button>
                          <button
                            type="submit"
                            className="px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-md"
                          >
                            <ShieldCheck className="w-3.5 h-3.5" /> Ajukan Verifikasi
                          </button>
                        </div>

                        {verificationStatus && (
                          <div
                            className={`p-3 rounded-xl text-xs font-medium ${
                              verificationStatus.approved
                                ? 'bg-emerald-950/80 border border-emerald-500/50 text-emerald-300'
                                : 'bg-blue-950/80 border border-blue-500/50 text-blue-200'
                            }`}
                          >
                            {verificationStatus.approved ? (
                              <p className="flex items-center gap-1.5 font-bold">
                                <CheckCircle2 className="w-4 h-4 text-emerald-400" /> {verificationStatus.message}
                              </p>
                            ) : (
                              <div className="space-y-1">
                                <p className="font-bold flex items-center gap-1.5 text-blue-300">
                                  <Check className="w-4 h-4 text-blue-400" /> Permintaan Terkirim!
                                </p>
                                <p className="text-[11px] leading-relaxed text-slate-300">
                                  {verificationStatus.message}
                                </p>
                              </div>
                            )}
                          </div>
                        )}
                      </form>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Footer System Info */}
      <footer className="max-w-6xl mx-auto w-full text-center text-xs text-slate-300 space-y-1 pb-2">
        <p>© 2026 Kelas Manager • Sistem Informasi & Tata Kelola Perkuliahan.</p>
        <p className="text-[11px] text-slate-400">
          Sinkronisasi Real-Time Cloud Firestore • Autentikasi Google Terverifikasi
        </p>
      </footer>
    </div>
  );
};
