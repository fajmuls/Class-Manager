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
} from 'lucide-react';
import { Modal } from '../UI/Modal.tsx';

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

  const [students, setStudents] = useState<User[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [selectedRoleId, setSelectedRoleId] = useState('role_anggota');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const [isPending, setIsPending] = useState(false);
  const [submittedClaim, setSubmittedClaim] = useState<any>(null);

  // Load students (sorted 1 - 39) and roles
  useEffect(() => {
    const init = async () => {
      try {
        const [uList, rList] = await Promise.all([
          api.getAllUsers(),
          api.getRoles(),
        ]);
        // Sort students alphabetically A to Z
        const sorted = [...uList].sort((a, b) => a.name.localeCompare(b.name, 'id-ID'));
        setStudents(sorted);
        setRoles(rList);
        if (sorted.length > 0) {
          setSelectedStudentId(sorted[0].id);
        }
      } catch (err) {
        console.error('Failed to load students for claim:', err);
      }
    };
    init();
  }, []);

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
        // User has been approved!
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
      const res = await api.claimRole({
        google_email: firebaseUser.email,
        google_name: firebaseUser.displayName || 'Pengguna Google',
        google_avatar: firebaseUser.photoURL || '',
        google_uid: firebaseUser.uid,
        requested_user_id: selectedStudentId,
        requested_role_id: selectedRoleId,
        notes: notes.trim(),
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

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full p-6 sm:p-8 space-y-6 animate-in fade-in-50 zoom-in-95 border border-slate-100">
        {/* Header Badge */}
        <div className="flex items-center justify-between">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 text-xs font-semibold border border-indigo-200">
            <ShieldCheck className="w-3.5 h-3.5" /> Konfirmasi Identitas Mahasiswa
          </div>
          <button
            onClick={logoutGoogle}
            className="text-xs text-rose-600 hover:text-rose-800 flex items-center gap-1 font-medium cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" /> Ganti Akun Google
          </button>
        </div>

        {/* Google User Profile Snippet */}
        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 flex items-center gap-3.5">
          <img
            src={
              firebaseUser?.photoURL ||
              'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80'
            }
            alt={firebaseUser?.displayName || 'User'}
            className="w-11 h-11 rounded-full border border-slate-300 shadow-2xs"
          />
          <div className="overflow-hidden">
            <p className="text-sm font-bold text-slate-900 truncate">
              {firebaseUser?.displayName || 'Pengguna Google'}
            </p>
            <p className="text-xs text-slate-500 font-mono truncate">
              {firebaseUser?.email}
            </p>
          </div>
        </div>

        {isPending ? (
          /* State: Menunggu Persetujuan Super Admin */
          <div className="text-center space-y-4 py-2">
            <div className="w-14 h-14 rounded-2xl bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center mx-auto shadow-sm">
              <Clock className="w-7 h-7 animate-spin" />
            </div>

            <div className="space-y-1">
              <h3 className="text-lg font-bold text-slate-900">
                Menunggu Persetujuan Super Admin
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed max-w-sm mx-auto">
                Permintaan klaim Anda telah terkirim ke Super Admin (
                <span className="font-semibold text-slate-800">
                  mrachmanfm@gmail.com
                </span>
                ). Super Admin akan memverifikasi bahwa akun Google ini adalah
                pemilik identitas mahasiswa yang dipilih.
              </p>
            </div>

            {submittedClaim && (
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-xs text-left space-y-1.5 font-medium">
                <div className="flex justify-between">
                  <span className="text-slate-500">Mahasiswa Dipilih:</span>
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
                  <span className="text-indigo-600 font-bold">
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
                className="w-full sm:w-auto px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-2 shadow-xs transition-colors cursor-pointer"
              >
                <RefreshCw
                  className={`w-3.5 h-3.5 ${isChecking ? 'animate-spin' : ''}`}
                />
                <span>{isChecking ? 'Memeriksa...' : 'Cek Status Persetujuan'}</span>
              </button>
            </div>
          </div>
        ) : (
          /* State: Form Pilih Siapa Akun Ini */
          <form onSubmit={handleSubmitClaim} className="space-y-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-800 mb-1">
                Langkah 1: Pilih Nama Anda di Daftar Absen Kelas (1 - 39)
              </label>
              <select
                required
                value={selectedStudentId}
                onChange={(e) => setSelectedStudentId(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-blue-500 text-slate-800 font-medium"
              >
                {students.map((s, idx) => (
                  <option key={s.id} value={s.id}>
                    {idx + 1}. {s.name} (NIM: {s.nim})
                  </option>
                ))}
              </select>
              <p className="text-[11px] text-slate-400 mt-1">
                Daftar terurut alfabetis resmi kelas 01SAKP014.
              </p>
            </div>

            <div>
              <label className="block font-semibold text-slate-800 mb-1">
                Langkah 2: Ajukan Permintaan Role / Jabatan
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
                      {r.name} - {r.description}
                    </option>
                  ))}
              </select>
              <p className="text-[11px] text-slate-400 mt-1">
                Super Admin akan mengkonfirmasi atau menyesuaikan role yang sesuai.
              </p>
            </div>

            <div>
              <label className="block font-semibold text-slate-800 mb-1">
                Langkah 3: Catatan Tambahan untuk Super Admin (Opsional)
              </label>
              <textarea
                rows={2}
                placeholder="Contoh: Saya adalah bendahara 1 yang mengelola kas kelas..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-blue-500 text-slate-800"
              />
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
              <button
                type="button"
                onClick={logoutGoogle}
                className="px-4 py-2 border border-slate-200 text-slate-600 hover:bg-slate-50 rounded-xl font-semibold"
              >
                Batal
              </button>

              <button
                type="submit"
                disabled={isSubmitting}
                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
                <span>
                  {isSubmitting ? 'Mengirim...' : 'Kirim Pengajuan ke Super Admin'}
                </span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
