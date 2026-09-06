import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext.tsx';
import { api } from '../../../services/api.ts';
import { Announcement } from '../../../types/index.ts';
import {
  Megaphone,
  Plus,
  Pin,
  Trash2,
  Calendar,
  User,
  Users,
} from 'lucide-react';
import { Badge } from '../../UI/Badge.tsx';
import { Modal } from '../../UI/Modal.tsx';

export const AnnouncementsModule: React.FC = () => {
  const { hasPermission } = useAuth();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const [formData, setFormData] = useState({
    title: '',
    content: '',
    target: 'all',
    is_pinned: false,
  });

  const loadAnnouncements = async () => {
    try {
      setIsLoading(true);
      const list = await api.getAnnouncements();
      setAnnouncements(list);
    } catch (err) {
      console.error('Error loading announcements:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadAnnouncements();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.createAnnouncement(formData);
      setIsAddModalOpen(false);
      setFormData({ title: '', content: '', target: 'all', is_pinned: false });
      await loadAnnouncements();
    } catch (err: any) {
      alert(err.message || 'Gagal memposting pengumuman');
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Hapus pengumuman ini?')) {
      try {
        await api.deleteAnnouncement(id);
        await loadAnnouncements();
      } catch (err: any) {
        alert(err.message || 'Gagal menghapus');
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Megaphone className="w-5 h-5 text-amber-600" /> Pengumuman Resmi Kelas
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Pusat informasi dan siaran penting agar mahasiswa tidak perlu mencari-cari di riwayat chat WhatsApp.
          </p>
        </div>

        {hasPermission('create_announcements') && (
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 shadow-xs transition-colors"
          >
            <Plus className="w-4 h-4" /> Buat Pengumuman
          </button>
        )}
      </div>

      {/* Announcements List */}
      <div className="space-y-4">
        {announcements.map((a) => (
          <div
            key={a.id}
            className={`p-5 rounded-2xl border transition-all ${
              a.is_pinned
                ? 'bg-amber-50/40 border-amber-200/80 shadow-xs'
                : 'bg-white border-slate-200 shadow-2xs'
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold text-slate-900">{a.title}</h3>
                  {a.is_pinned && (
                    <Badge variant="warning">
                      <Pin className="w-3 h-3" /> Pinned
                    </Badge>
                  )}
                  <Badge variant="neutral">Target: {a.target}</Badge>
                </div>
                <p className="text-[11px] text-slate-400 flex items-center gap-3">
                  <span className="flex items-center gap-1">
                    <User className="w-3 h-3 text-slate-400" /> {a.author_name}
                  </span>
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3 text-slate-400" />
                    {new Date(a.created_at).toLocaleDateString('id-ID', { dateStyle: 'long' })}
                  </span>
                </p>
              </div>

              {hasPermission('delete_announcements') && (
                <button
                  onClick={() => handleDelete(a.id)}
                  className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                  title="Hapus Pengumuman"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>

            <div className="mt-3 pt-3 border-t border-slate-100/80 text-xs sm:text-sm text-slate-700 whitespace-pre-line leading-relaxed">
              {a.content}
            </div>
          </div>
        ))}
      </div>

      {/* Modal Add Announcement */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Buat Pengumuman Baru"
        subtitle="Siarkan informasi resmi ke seluruh anggota kelas"
      >
        <form onSubmit={handleCreate} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Judul Pengumuman</label>
            <input
              type="text"
              required
              placeholder="Contoh: Ketentuan Pengumpulan Laporan Proyek Akhir"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-blue-500"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Sasaran Audiens</label>
            <select
              value={formData.target}
              onChange={(e) => setFormData({ ...formData, target: e.target.value })}
              className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-blue-500"
            >
              <option value="all">Seluruh Anggota Kelas</option>
              <option value="pengurus">Pengurus Inti & Koordinator</option>
              <option value="kelompok">Peserta Proyek Kelompok</option>
            </select>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Isi Pengumuman</label>
            <textarea
              required
              rows={5}
              placeholder="Tuliskan detail pengumuman, batas waktu, dan instruksi jelas..."
              value={formData.content}
              onChange={(e) => setFormData({ ...formData, content: e.target.value })}
              className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-blue-500"
            />
          </div>

          <label className="flex items-center gap-2 cursor-pointer pt-1">
            <input
              type="checkbox"
              checked={formData.is_pinned}
              onChange={(e) => setFormData({ ...formData, is_pinned: e.target.checked })}
              className="rounded text-amber-600 focus:ring-amber-500"
            />
            <span className="font-semibold text-slate-700">
              Sematkan di bagian teratas (Pin Announcement)
            </span>
          </label>

          <div className="flex justify-end gap-2 pt-3">
            <button
              type="button"
              onClick={() => setIsAddModalOpen(false)}
              className="px-4 py-2 border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 font-semibold"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-xl font-semibold"
            >
              Siarkan Pengumuman
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
