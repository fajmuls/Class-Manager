import React, { useState } from 'react';
import { useAuth } from '../../../context/AuthContext.tsx';
import { api } from '../../../services/api.ts';
import {
  Settings,
  Save,
  Download,
  Sparkles,
  Info,
  CheckCircle2,
  AlertCircle,
  Building,
  GraduationCap,
  Tag,
  ShieldCheck,
} from 'lucide-react';

export const SettingsModule: React.FC = () => {
  const { classInfo, setClassInfo, hasPermission } = useAuth();
  const [formData, setFormData] = useState({
    name: classInfo?.name || 'Teknik Informatika 2024 - Kelas A',
    code: classInfo?.code || 'TI-24A',
    semester: classInfo?.semester || 3,
    academic_year: classInfo?.academic_year || '2025/2026',
    department: classInfo?.department || 'Teknik Informatika',
    university: classInfo?.university || 'Universitas Sains & Teknologi',
    academic_advisor: classInfo?.academic_advisor || 'Dr. Ir. Hendra Wijaya, M.Kom.',
  });

  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // App version according to user instruction
  const APP_VERSION = 'v2.1.0';
  const BUILD_DATE = '6 September 2026';

  const [isRoleSwitcherActive, setIsRoleSwitcherActive] = useState<boolean>(() => {
    return localStorage.getItem('cms_show_role_switcher') === 'true';
  });

  const { allUsers, switchUser, role } = useAuth();

  const handleToggleRoleSwitcher = () => {
    const nextState = !isRoleSwitcherActive;
    setIsRoleSwitcherActive(nextState);
    localStorage.setItem('cms_show_role_switcher', String(nextState));
    window.dispatchEvent(new CustomEvent('cms-toggle-role-switcher', { detail: { show: nextState } }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSaving(true);
      const updated = await api.updateClassInfo(formData);
      setClassInfo(updated);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err: any) {
      alert(err.message || 'Gagal menyimpan pengaturan');
    } finally {
      setIsSaving(false);
    }
  };

  const handleExportDatabase = () => {
    const dataStr =
      'data:text/json;charset=utf-8,' +
      encodeURIComponent(JSON.stringify(classInfo, null, 2));
    const dlAnchor = document.createElement('a');
    dlAnchor.setAttribute('href', dataStr);
    dlAnchor.setAttribute(
      'download',
      `Backup_ClassManagement_${classInfo?.code}_${new Date().toISOString().slice(0, 10)}.json`
    );
    dlAnchor.click();
  };

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
          <Settings className="w-5 h-5 text-blue-600" /> Pengaturan Kelas & Versi Sistem
        </h2>
        <p className="text-xs text-slate-500 mt-1">
          Konfigurasi metadata kelas perkuliahan, identitas universitas, dosen pembimbing, serta pembaruan versi aplikasi.
        </p>
      </div>

      {/* App Version Card (Required by custom instruction) */}
      <div className="p-6 bg-[#0F172A] rounded-xl text-white shadow-sm border border-slate-800 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-indigo-600 text-white text-[10px] font-bold uppercase tracking-wider">
              Versi Terpasang
            </span>
            <span className="text-lg font-mono font-bold text-indigo-300">{APP_VERSION}</span>
            <span className="text-xs text-slate-400">({BUILD_DATE})</span>
          </div>
          <h3 className="text-base font-bold text-white">Class Management System (CMS Pro)</h3>
          <p className="text-xs text-slate-300">
            Arsitektur RBAC Granular, Multi-Role Dashboard, Tema Professional Polish, Transparansi Kas Terbuka.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 text-xs text-emerald-400 bg-emerald-950/60 px-3 py-1.5 rounded-lg border border-emerald-800 font-semibold">
            <CheckCircle2 className="w-4 h-4" /> Sistem Up-to-Date
          </span>
        </div>
      </div>

      {/* Form Settings Identitas Kelas */}
      <form onSubmit={handleSave} className="p-6 bg-white rounded-2xl border border-slate-200 shadow-2xs space-y-6">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Identitas & Profil Kelas Perkuliahan</h3>
            <p className="text-xs text-slate-500">Informasi ini tampil pada seluruh modul dan kop dokumen resmi</p>
          </div>

          {saveSuccess && (
            <span className="text-xs text-emerald-600 font-bold flex items-center gap-1">
              <CheckCircle2 className="w-4 h-4" /> Perubahan berhasil disimpan!
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Nama Resmi Kelas</label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-blue-500"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Kode Kelas / Singkatan</label>
            <input
              type="text"
              required
              value={formData.code}
              onChange={(e) => setFormData({ ...formData, code: e.target.value })}
              className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-blue-500 font-mono"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Semester Berjalan</label>
            <input
              type="number"
              min={1}
              max={14}
              value={formData.semester}
              onChange={(e) => setFormData({ ...formData, semester: Number(e.target.value) })}
              className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-blue-500"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Tahun Akademik</label>
            <input
              type="text"
              value={formData.academic_year}
              onChange={(e) => setFormData({ ...formData, academic_year: e.target.value })}
              className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-blue-500"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Jurusan / Program Studi</label>
            <input
              type="text"
              value={formData.department}
              onChange={(e) => setFormData({ ...formData, department: e.target.value })}
              className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-blue-500"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Perguruan Tinggi / Universitas</label>
            <input
              type="text"
              value={formData.university}
              onChange={(e) => setFormData({ ...formData, university: e.target.value })}
              className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-blue-500"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block font-semibold text-slate-700 mb-1">Dosen Wali / Pembimbing Akademik (DPA)</label>
            <input
              type="text"
              value={formData.academic_advisor}
              onChange={(e) => setFormData({ ...formData, academic_advisor: e.target.value })}
              className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-blue-500"
            />
          </div>
        </div>

        <div className="flex items-center justify-between pt-4 border-t border-slate-100">
          <button
            type="button"
            onClick={handleExportDatabase}
            className="px-4 py-2 border border-slate-200 text-slate-700 text-xs font-semibold rounded-xl hover:bg-slate-50 flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Download className="w-4 h-4 text-slate-500" /> Export Metadata Backup (JSON)
          </button>

          {hasPermission('manage_system_settings') ? (
            <button
              type="submit"
              disabled={isSaving}
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
            >
              <Save className="w-4 h-4" /> {isSaving ? 'Menyimpan...' : 'Simpan Pengaturan'}
            </button>
          ) : (
            <span className="text-xs text-slate-400">
              *Hanya Ketua Kelas & Super Admin yang berhak merubah identitas kelas.
            </span>
          )}
        </div>
      </form>

      {/* Admin Panel: Mode Uji Peran & Developer Tools */}
      <div className="p-6 bg-white rounded-2xl border border-slate-200 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-100 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-indigo-600" />
              <h3 className="text-sm font-bold text-slate-900">Panel Kontrol Admin & Mode Uji Peran</h3>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Kelola visibilitas bilah pengujian peran dan beralih persona pengguna untuk verifikasi hak akses RBAC.
            </p>
          </div>

          <button
            type="button"
            onClick={handleToggleRoleSwitcher}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
              isRoleSwitcherActive
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <span>{isRoleSwitcherActive ? '✓ Bilah Uji Peran: Aktif' : 'Tampilkan Bilah Uji Peran'}</span>
          </button>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-2">
            Beralih Persona Langsung (Quick Switch):
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {[
              { roleKey: 'role_superadmin', label: 'Super Admin', name: 'Dr. Hendra' },
              { roleKey: 'role_ketua', label: 'Ketua Kelas', name: 'Aditya Pratama' },
              { roleKey: 'role_bendahara', label: 'Bendahara', name: 'Siti Rahmawati' },
              { roleKey: 'role_anggota', label: 'Mahasiswa', name: 'Rian Hidayat' },
            ].map((persona) => {
              const targetUser = allUsers.find(u => u.role_id === persona.roleKey);
              const isActive = role?.id === persona.roleKey;
              return (
                <button
                  key={persona.roleKey}
                  type="button"
                  onClick={() => targetUser && switchUser(targetUser.id)}
                  className={`p-3 rounded-xl border text-left text-xs transition-all cursor-pointer ${
                    isActive
                      ? 'border-indigo-600 bg-indigo-50/70 text-indigo-900 font-bold'
                      : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <p className="text-[11px] text-slate-400 font-normal">{persona.label}</p>
                  <p className="font-semibold text-slate-900 truncate">{persona.name}</p>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Saran Update & Pembaruan Sistem (User Instruction) */}
      <div className="p-6 bg-white rounded-2xl border border-blue-200 shadow-2xs space-y-4">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-blue-600" />
          <h3 className="text-sm font-bold text-slate-900">
            Saran Pengembangan & Rekomendasi Pembaruan Aplikasi
          </h3>
        </div>
        <p className="text-xs text-slate-600 leading-relaxed">
          Berikut adalah rekomendasi peningkatan fungsional dan teknis yang telah dianalisis untuk mendukung skalabilitas operasional kelas perkuliahan:
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div className="p-3.5 rounded-xl bg-blue-50/60 border border-blue-100 space-y-1">
            <h4 className="font-bold text-blue-900 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-600" /> Integrasi Webhook WhatsApp / Telegram
            </h4>
            <p className="text-[11px] text-slate-600">
              Otomatisasi pengiriman notifikasi pengumuman baru, pengingat deadline tugas, dan tagihan kas langsung ke grup WhatsApp kelas.
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-purple-50/60 border border-purple-100 space-y-1">
            <h4 className="font-bold text-purple-900 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-purple-600" /> Sinkronisasi Google Calendar
            </h4>
            <p className="text-[11px] text-slate-600">
              Tombol satu-klik bagi setiap mahasiswa untuk menambahkan seluruh jadwal kuliah dan ujian ke kalender smartphone pribadi (iCal / Google Calendar).
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-emerald-50/60 border border-emerald-100 space-y-1">
            <h4 className="font-bold text-emerald-900 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" /> Payment Gateway Otomatis (Midtrans / Xendit)
            </h4>
            <p className="text-[11px] text-slate-600">
              Penerbitan Virtual Account (BCA, Mandiri, BRI, BNI) dan QRIS otomatis tanpa perlu bendahara mengecek bukti mutasi secara manual.
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-amber-50/60 border border-amber-100 space-y-1">
            <h4 className="font-bold text-amber-900 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-600" /> Mode Offline PWA (Progressive Web App)
            </h4>
            <p className="text-[11px] text-slate-600">
              Dukungan Service Worker caching agar mahasiswa tetap dapat membuka jadwal kuliah, dokumen silabus, dan kontak teman sekelas saat koneksi internet kampus lambat.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
