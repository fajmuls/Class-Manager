import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext.tsx';
import { api } from '../../services/api.ts';
import { User, Role } from '../../types/index.ts';
import {
  ShieldCheck,
  UserCheck,
  Clock,
  CheckCircle2,
  AlertCircle,
  LogOut,
  Send,
  Sparkles,
  RefreshCw,
  Search,
  KeyRound,
  GraduationCap,
} from 'lucide-react';
import { TEMPLATE_39_STUDENTS } from '../../services/firestoreSync.ts';

interface GoogleRoleClaimModalProps {
  isOpen: boolean;
  onClose?: () => void;
}

export const GoogleRoleClaimModal: React.FC<GoogleRoleClaimModalProps> = ({
  isOpen,
}) => {
  const {
    firebaseUser,
    logoutGoogle,
    refreshAuth,
    allUsers,
  } = useAuth();

  const [students, setStudents] = useState<User[]>(TEMPLATE_39_STUDENTS);
  const [roles, setRoles] = useState<Role[]>([]);
  const [nimInput, setNimInput] = useState('');
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [selectedRoleId, setSelectedRoleId] = useState('role_anggota');
  const [proCodeInput, setProCodeInput] = useState('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const [isPending, setIsPending] = useState(false);
  const [submittedClaim, setSubmittedClaim] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Load students & roles
  useEffect(() => {
    const init = async () => {
      try {
        let uList = allUsers.length > 0 ? allUsers : TEMPLATE_39_STUDENTS;
        const rList = await api.getRoles();
        
        // Filter out superadmin and sort students A-Z
        const filteredStudents = uList.filter(u => u.role_id !== 'role_superadmin');
        const sorted = [...filteredStudents].sort((a, b) => a.name.localeCompare(b.name, 'id-ID'));
        
        setStudents(sorted.length > 0 ? sorted : TEMPLATE_39_STUDENTS);
        setRoles(rList);
        if (sorted.length > 0) {
          setSelectedStudentId(sorted[0].id);
          setNimInput(sorted[0].nim);
        }
      } catch (err) {
        console.error('Failed to load students for claim:', err);
      }
    };
    if (isOpen) {
      init();
    }
  }, [isOpen, allUsers.length]);

  // When NIM input changes, auto-select corresponding student if matched
  const handleNimChange = (val: string) => {
    setNimInput(val);
    const matched = students.find(s => s.nim === val.trim() || s.nim.endsWith(val.trim()));
    if (matched) {
      setSelectedStudentId(matched.id);
    }
  };

  // When student selection changes, sync NIM
  const handleStudentSelect = (id: string) => {
    setSelectedStudentId(id);
    const found = students.find(s => s.id === id);
    if (found) {
      setNimInput(found.nim);
    }
  };

  // Check current claim status on open or mount
  useEffect(() => {
    if (firebaseUser?.email) {
      checkStatus();
    }
  }, [firebaseUser?.email]);

  const checkStatus = async () => {
    if (!firebaseUser?.email) return;
    try {
      setIsChecking(true);
      const res = await api.googleLogin({
        email: firebaseUser.email,
        displayName: firebaseUser.displayName,
        photoURL: firebaseUser.photoURL,
        uid: firebaseUser.uid,
      });

      if (res.isPendingApproval) {
        setIsPending(true);
        setSubmittedClaim(res.claimRequest);
      } else if (res.isApproved && res.user) {
        setIsPending(false);
        await refreshAuth();
      } else if (res.requiresClaim) {
        setIsPending(false);
      }
    } catch (err) {
      console.error('Error checking claim status:', err);
    } finally {
      setIsChecking(false);
    }
  };

  const handleSubmitClaim = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firebaseUser?.email || !selectedStudentId) return;

    try {
      setIsSubmitting(true);
      const chosenStudent = students.find(s => s.id === selectedStudentId);
      
      const payloadNotes = [
        notes.trim(),
        proCodeInput.trim() ? `[KODE PRO / AKSES: ${proCodeInput.trim()}]` : '',
        nimInput.trim() ? `[NIM: ${nimInput.trim()}]` : '',
      ].filter(Boolean).join(' - ');

      const res = await api.claimRole({
        google_email: firebaseUser.email,
        google_name: firebaseUser.displayName || chosenStudent?.name || 'Pengguna Google',
        google_avatar: firebaseUser.photoURL || chosenStudent?.avatar || '',
        google_uid: firebaseUser.uid,
        requested_user_id: selectedStudentId,
        requested_role_id: selectedRoleId,
        notes: payloadNotes,
      });

      if (res.success) {
        setIsPending(true);
        setSubmittedClaim(res.claimRequest);
      }
    } catch (err: any) {
      alert(err.message || 'Gagal mengirim permintaan klaim identitas');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  const filteredList = students.filter(s =>
    s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.nim.includes(searchQuery)
  );

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full p-5 sm:p-7 space-y-5 animate-in fade-in-50 zoom-in-95 border border-slate-100 my-8">
        {/* Header Badge */}
        <div className="flex items-center justify-between">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-semibold border border-blue-200">
            <GraduationCap className="w-3.5 h-3.5" /> Kelas 01 SAKP 14 • Registrasi Mahasiswa
          </div>
          <button
            onClick={logoutGoogle}
            className="text-xs text-rose-600 hover:text-rose-800 flex items-center gap-1 font-medium cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" /> Ganti Akun Google
          </button>
        </div>

        {/* Google User Profile Snippet */}
        <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 flex items-center gap-3">
          <img
            src={
              firebaseUser?.photoURL ||
              'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80'
            }
            alt={firebaseUser?.displayName || 'User'}
            className="w-10 h-10 rounded-full border border-slate-300 shadow-2xs"
          />
          <div className="overflow-hidden">
            <p className="text-sm font-bold text-slate-900 truncate">
              {firebaseUser?.displayName || 'Mahasiswa Google'}
            </p>
            <p className="text-xs text-slate-500 font-mono truncate">
              {firebaseUser?.email}
            </p>
          </div>
        </div>

        {isPending ? (
          /* State: Menunggu Persetujuan Super Admin */
          <div className="text-center space-y-4 py-2">
            <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center mx-auto shadow-sm">
              <Clock className="w-6 h-6 animate-spin" />
            </div>

            <div className="space-y-1">
              <h3 className="text-base font-bold text-slate-900">
                Pengajuan Terkirim (Menunggu Persetujuan)
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed max-w-sm mx-auto">
                Permintaan Anda telah tersimpan di Firebase. Super Admin / Ketua Kelas (
                <span className="font-semibold text-slate-800">
                  mrachmanfm@gmail.com
                </span>
                ) akan menyetujui klaim NIM & role Anda.
              </p>
            </div>

            {submittedClaim && (
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-xs text-left space-y-1.5 font-medium">
                <div className="flex justify-between">
                  <span className="text-slate-500">Mahasiswa:</span>
                  <span className="text-slate-900 font-bold">
                    {submittedClaim.user_name}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">NIM:</span>
                  <span className="text-slate-900 font-mono">
                    {submittedClaim.user_nim}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Role Diminta:</span>
                  <span className="text-blue-600 font-bold">
                    {submittedClaim.role_name}
                  </span>
                </div>
              </div>
            )}

            <div className="pt-2 flex flex-col sm:flex-row items-center gap-2 justify-center">
              <button
                type="button"
                onClick={checkStatus}
                disabled={isChecking}
                className="w-full sm:w-auto px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-2 shadow-xs transition-colors cursor-pointer"
              >
                <RefreshCw
                  className={`w-3.5 h-3.5 ${isChecking ? 'animate-spin' : ''}`}
                />
                <span>{isChecking ? 'Memeriksa...' : 'Cek Status Persetujuan'}</span>
              </button>
            </div>
          </div>
        ) : (
          /* State: Form Input NIM & Pilih Siapa Akun Ini */
          <form onSubmit={handleSubmitClaim} className="space-y-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-800 mb-1">
                Langkah 1: Masukkan NIM Anda
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  placeholder="Ketik NIM Anda (contoh: 261011201412)"
                  value={nimInput}
                  onChange={(e) => handleNimChange(e.target.value)}
                  className="w-full pl-3.5 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-blue-500 text-slate-800 font-mono text-sm"
                />
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                Sistem akan otomatis mencocokkan dengan data 39 mahasiswa kelas 01 SAKP 14.
              </p>
            </div>

            <div>
              <label className="block font-semibold text-slate-800 mb-1">
                Langkah 2: Pilih Nama Mahasiswa di Roster
              </label>
              <select
                required
                value={selectedStudentId}
                onChange={(e) => handleStudentSelect(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-blue-500 text-slate-800 font-medium"
              >
                {filteredList.map((s, idx) => (
                  <option key={s.id} value={s.id}>
                    {idx + 1}. {s.name} — NIM: {s.nim}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-800 mb-1">
                  Langkah 3: Ajukan Role / Jabatan
                </label>
                <select
                  value={selectedRoleId}
                  onChange={(e) => setSelectedRoleId(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-blue-500 text-slate-800 font-medium"
                >
                  {roles
                    .filter((r) => r.id !== 'role_superadmin')
                    .map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.name}
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-800 mb-1 flex items-center gap-1">
                  <KeyRound className="w-3.5 h-3.5 text-amber-600" /> Kode Pro / Akses (Opsional)
                </label>
                <input
                  type="text"
                  placeholder="Contoh: PRO-2026"
                  value={proCodeInput}
                  onChange={(e) => setProCodeInput(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-blue-500 text-slate-800 font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-800 mb-1">
                Catatan / Keterangan Tambahan (Opsional)
              </label>
              <textarea
                rows={2}
                placeholder="Tuliskan keterangan pengurus atau informasi untuk Ketua Kelas..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-blue-500 text-slate-800"
              />
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
              <button
                type="button"
                onClick={logoutGoogle}
                className="px-4 py-2 border border-slate-200 text-slate-600 hover:bg-slate-50 rounded-xl font-semibold cursor-pointer"
              >
                Batal
              </button>

              <button
                type="submit"
                disabled={isSubmitting}
                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
                <span>
                  {isSubmitting ? 'Mengirim...' : 'Kirim Pengajuan Klaim'}
                </span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
