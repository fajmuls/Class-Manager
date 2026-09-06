import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext.tsx';
import { api } from '../../../services/api.ts';
import { Meeting } from '../../../types/index.ts';
import {
  Video,
  Plus,
  Calendar,
  Clock,
  MapPin,
  FileText,
  CheckSquare,
  Users,
} from 'lucide-react';
import { Badge } from '../../UI/Badge.tsx';
import { Modal } from '../../UI/Modal.tsx';

export const MeetingsModule: React.FC = () => {
  const { hasPermission } = useAuth();
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [selectedMeeting, setSelectedMeeting] = useState<Meeting | null>(null);
  const [isMinutesModalOpen, setIsMinutesModalOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Minutes form
  const [minutesForm, setMinutesForm] = useState({
    discussion: '',
    decisions: '',
    action_items: '',
  });

  // Create meeting form
  const [createForm, setCreateForm] = useState({
    title: '',
    agenda: '',
    date: '2026-09-14',
    start_time: '19:30',
    end_time: '21:00',
    location: 'Google Meet',
    link: 'https://meet.google.com/xyz-abcd-efg',
  });

  const loadMeetings = async () => {
    try {
      setIsLoading(true);
      const list = await api.getMeetings();
      setMeetings(list);
    } catch (err) {
      console.error('Error loading meetings:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadMeetings();
  }, []);

  const handleOpenMinutes = (m: Meeting) => {
    setSelectedMeeting(m);
    setMinutesForm({
      discussion: m.minutes?.discussion || '',
      decisions: m.minutes?.decisions || '',
      action_items: m.minutes?.action_items?.map((a) => `${a.task} [${a.pic}]`).join('\n') || '',
    });
    setIsMinutesModalOpen(true);
  };

  const handleSaveMinutes = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMeeting) return;
    try {
      const parsedActions = minutesForm.action_items
        .split('\n')
        .filter((l) => l.trim())
        .map((l) => ({
          task: l,
          pic: 'Pengurus Terkait',
          deadline: '2026-09-20',
        }));

      await api.updateMeetingMinutes(selectedMeeting.id, {
        discussion: minutesForm.discussion,
        decisions: minutesForm.decisions,
        action_items: parsedActions,
      });

      setIsMinutesModalOpen(false);
      await loadMeetings();
      alert('Notulensi rapat dan action items berhasil disimpan!');
    } catch (err: any) {
      alert(err.message || 'Gagal menyimpan notulensi');
    }
  };

  const handleCreateMeeting = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.createMeeting(createForm);
      setIsAddModalOpen(false);
      setCreateForm({
        title: '',
        agenda: '',
        date: '2026-09-14',
        start_time: '19:30',
        end_time: '21:00',
        location: 'Google Meet',
        link: '',
      });
      await loadMeetings();
    } catch (err: any) {
      alert(err.message || 'Gagal membuat jadwal rapat');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Video className="w-5 h-5 text-purple-600" /> Rapat & Notulensi Kelas
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Penjadwalan rapat kelas, tautan telekonferensi, pencatatan hasil notulen, serta penugasan tindak lanjut.
          </p>
        </div>

        {hasPermission('create_meetings') && (
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 shadow-xs transition-colors"
          >
            <Plus className="w-4 h-4" /> Jadwalkan Rapat
          </button>
        )}
      </div>

      {/* Meetings Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {meetings.map((m) => (
          <div
            key={m.id}
            className="p-5 bg-white rounded-2xl border border-slate-200 shadow-2xs space-y-4 hover:border-purple-200 transition-colors"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <span className="text-[10px] font-bold text-purple-600 uppercase tracking-wider">
                  {m.type === 'coordination' ? 'Rapat Koordinasi' : 'Rapat Rutin'}
                </span>
                <h3 className="text-base font-bold text-slate-900 mt-0.5">{m.title}</h3>
              </div>
              <Badge variant={m.status === 'finished' ? 'success' : 'primary'}>
                {m.status === 'finished' ? 'Selesai' : 'Terjadwal'}
              </Badge>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">{m.agenda}</p>

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 space-y-1 text-xs text-slate-600">
              <div className="flex items-center gap-2">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                <span>{new Date(m.date).toLocaleDateString('id-ID', { dateStyle: 'full' })}</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                <span>{m.start_time} - {m.end_time} WIB</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="w-3.5 h-3.5 text-slate-400" />
                <span>{m.location}</span>
                {m.link && (
                  <a
                    href={m.link}
                    target="_blank"
                    rel="noreferrer"
                    className="text-blue-600 hover:underline font-semibold text-[11px] ml-1"
                  >
                    Buka Link Rapat ↗
                  </a>
                )}
              </div>
            </div>

            {/* Notulen Preview or Action */}
            <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
              <span className="text-[11px] text-slate-400">
                {m.minutes ? '✓ Notulen Tersedia' : 'Belum ada notulen'}
              </span>

              <button
                onClick={() => handleOpenMinutes(m)}
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <FileText className="w-3.5 h-3.5 text-purple-600" />
                {hasPermission('create_meetings') ? 'Tulis / Edit Notulen' : 'Buka Notulen'}
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Modal Notulensi Editor */}
      <Modal
        isOpen={isMinutesModalOpen}
        onClose={() => setIsMinutesModalOpen(false)}
        title={`Notulensi: ${selectedMeeting?.title}`}
        subtitle="Dokumentasi resmi hasil pembahasan dan keputusan rapat kelas"
        maxWidth="2xl"
      >
        <form onSubmit={handleSaveMinutes} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Poin Pembahasan Rapat</label>
            <textarea
              rows={4}
              placeholder="Rangkuman apa saja yang didiskusikan..."
              value={minutesForm.discussion}
              onChange={(e) => setMinutesForm({ ...minutesForm, discussion: e.target.value })}
              className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-blue-500"
              disabled={!hasPermission('create_meetings')}
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Keputusan / Kesimpulan Rapat</label>
            <textarea
              rows={3}
              placeholder="Keputusan final yang disepakati bersama..."
              value={minutesForm.decisions}
              onChange={(e) => setMinutesForm({ ...minutesForm, decisions: e.target.value })}
              className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-blue-500"
              disabled={!hasPermission('create_meetings')}
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Action Items (Tindak Lanjut & Tugas PIC - 1 baris per item)
            </label>
            <textarea
              rows={3}
              placeholder="Contoh: Cetak proposal [Sekretaris]&#10;Hubungi dosen pembimbing [Ketua Kelas]"
              value={minutesForm.action_items}
              onChange={(e) => setMinutesForm({ ...minutesForm, action_items: e.target.value })}
              className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-blue-500 font-mono"
              disabled={!hasPermission('create_meetings')}
            />
          </div>

          <div className="flex justify-end gap-2 pt-3">
            <button
              type="button"
              onClick={() => setIsMinutesModalOpen(false)}
              className="px-4 py-2 border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 font-semibold"
            >
              Tutup
            </button>
            {hasPermission('create_meetings') && (
              <button
                type="submit"
                className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl font-semibold"
              >
                Simpan Notulensi Rapat
              </button>
            )}
          </div>
        </form>
      </Modal>

      {/* Modal Add Meeting */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Jadwalkan Rapat Baru"
        subtitle="Siapkan rapat koordinasi atau evaluasi berkala kelas"
      >
        <form onSubmit={handleCreateMeeting} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Judul Rapat</label>
            <input
              type="text"
              required
              placeholder="Contoh: Rapat Persiapan Ujian Tengah Semester"
              value={createForm.title}
              onChange={(e) => setCreateForm({ ...createForm, title: e.target.value })}
              className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-blue-500"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Agenda Utama</label>
            <textarea
              rows={2}
              placeholder="Pokok bahasan yang akan dibahas..."
              value={createForm.agenda}
              onChange={(e) => setCreateForm({ ...createForm, agenda: e.target.value })}
              className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-blue-500"
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Tanggal</label>
              <input
                type="date"
                required
                value={createForm.date}
                onChange={(e) => setCreateForm({ ...createForm, date: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-blue-500"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Mulai</label>
              <input
                type="time"
                value={createForm.start_time}
                onChange={(e) => setCreateForm({ ...createForm, start_time: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-blue-500"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Selesai</label>
              <input
                type="time"
                value={createForm.end_time}
                onChange={(e) => setCreateForm({ ...createForm, end_time: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-blue-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Lokasi / Platform</label>
              <input
                type="text"
                value={createForm.location}
                onChange={(e) => setCreateForm({ ...createForm, location: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-blue-500"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Tautan Online (URL)</label>
              <input
                type="url"
                value={createForm.link}
                onChange={(e) => setCreateForm({ ...createForm, link: e.target.value })}
                placeholder="https://..."
                className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-blue-500"
              />
            </div>
          </div>

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
              className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl font-semibold"
            >
              Jadwalkan Rapat
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
