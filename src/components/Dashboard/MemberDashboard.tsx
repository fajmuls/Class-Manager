import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext.tsx';
import { api } from '../../services/api.ts';
import { Payment, EventItem, Announcement, TaskItem, NotificationItem } from '../../types/index.ts';
import {
  CreditCard,
  Calendar,
  Megaphone,
  CheckSquare,
  ArrowRight,
  Upload,
  AlertCircle,
  CheckCircle2,
  Clock,
  Sparkles,
  Vote,
  BookOpen,
} from 'lucide-react';
import { Badge } from '../UI/Badge.tsx';

interface MemberDashboardProps {
  onNavigate: (module: string) => void;
}

export const MemberDashboard: React.FC<MemberDashboardProps> = ({ onNavigate }) => {
  const { user, classInfo } = useAuth();
  const [myPayments, setMyPayments] = useState<Payment[]>([]);
  const [upcomingEvents, setUpcomingEvents] = useState<EventItem[]>([]);
  const [recentAnnouncements, setRecentAnnouncements] = useState<Announcement[]>([]);
  const [myTasks, setMyTasks] = useState<TaskItem[]>([]);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const [pays, evts, anns, tsks, notifs] = await Promise.all([
          api.getPayments({ user_id: user?.id }),
          api.getEvents(),
          api.getAnnouncements(),
          api.getTasks(),
          api.getNotifications(),
        ]);

        setMyPayments(pays);
        setUpcomingEvents(evts.slice(0, 3));
        setRecentAnnouncements(anns.slice(0, 2));
        setMyTasks(tsks.filter(t => t.assignee_id === user?.id || t.creator_id === user?.id).slice(0, 3));
        setNotifications(notifs.slice(0, 3));
      } catch (err) {
        console.error('Error fetching member dashboard data:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [user?.id]);

  const activeBill = myPayments.find(p => p.status === 'unpaid' || p.status === 'pending');
  const isPaidUp = !activeBill;

  return (
    <div className="space-y-6">
      {/* Sapaan Mahasiswa (Warm greeting & student overview) */}
      <div className="p-6 bg-[#0F172A] rounded-xl text-white shadow-sm border border-slate-800 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-semibold border border-indigo-500/30 mb-2">
            <Sparkles className="w-3.5 h-3.5 text-indigo-400" /> Portal Mahasiswa • {classInfo?.code}
          </div>
          <h2 className="text-2xl font-bold tracking-tight">Halo, {user?.name}! 👋</h2>
          <p className="text-slate-400 text-xs sm:text-sm mt-1">
            NIM: {user?.nim} • {user?.department} • Angkatan {user?.cohort}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => onNavigate('courses')}
            className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-lg shadow-sm transition-colors cursor-pointer flex items-center gap-2"
          >
            <BookOpen className="w-4 h-4" /> 8 Mata Kuliah & Tugas
          </button>
          <button
            onClick={() => onNavigate('my-kas')}
            className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg shadow-sm transition-colors cursor-pointer flex items-center gap-2"
          >
            <CreditCard className="w-4 h-4" /> Kas Saya
          </button>
          <button
            onClick={() => onNavigate('agenda')}
            className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-lg transition-colors cursor-pointer flex items-center gap-2 border border-slate-700"
          >
            <Calendar className="w-4 h-4" /> Jadwal & Agenda
          </button>
        </div>
      </div>

      {/* Grid 2 Kolom: Kas Saya & Agenda Terdekat */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Kolom 1: Status Kas Pribadi */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <CreditCard className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-bold text-slate-900">Status Kas Pribadi</h3>
            </div>
            <button
              onClick={() => onNavigate('my-kas')}
              className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold"
            >
              Rincian
            </button>
          </div>

          {activeBill ? (
            <div className="p-4 rounded-xl bg-amber-50 border border-amber-200/80 space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[10px] font-bold tracking-wider uppercase text-amber-700">
                    Tagihan Berjalan
                  </span>
                  <p className="text-sm font-bold text-slate-900 mt-0.5">{activeBill.bill_title}</p>
                </div>
                <Badge variant={activeBill.status === 'pending' ? 'warning' : 'danger'}>
                  {activeBill.status === 'pending' ? 'Menunggu Verifikasi' : 'Belum Bayar'}
                </Badge>
              </div>

              <div className="flex items-baseline justify-between pt-2 border-t border-amber-200/50">
                <span className="text-xs text-slate-600 font-medium">Nominal:</span>
                <span className="text-lg font-bold text-slate-900">
                  Rp {activeBill.amount.toLocaleString('id-ID')}
                </span>
              </div>

              <button
                onClick={() => onNavigate('my-kas')}
                className="w-full py-2.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-lg flex items-center justify-center gap-1.5 transition-colors shadow-xs"
              >
                <Upload className="w-3.5 h-3.5" /> Upload Bukti Transfer
              </button>
            </div>
          ) : (
            <div className="p-5 rounded-xl bg-emerald-50 border border-emerald-200/80 text-center space-y-2">
              <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto" />
              <p className="text-sm font-bold text-emerald-900">Tidak Ada Tunggakan Kas</p>
              <p className="text-xs text-emerald-700">
                Semua iuran kas Anda untuk periode ini telah lunas tercatat di buku kas.
              </p>
            </div>
          )}

          {/* Quick Actions for Member */}
          <div className="pt-2 border-t border-slate-100">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Aksi Cepat</p>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => onNavigate('transparency')}
                className="p-3 rounded-lg border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/40 text-left transition-all group"
              >
                <p className="text-xs font-bold text-slate-900 group-hover:text-indigo-600">Transparansi Kas</p>
                <p className="text-[10px] text-slate-500 mt-0.5">Cek saldo & mutasi</p>
              </button>
              <button
                onClick={() => onNavigate('polls')}
                className="p-3 rounded-lg border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/40 text-left transition-all group"
              >
                <p className="text-xs font-bold text-slate-900 group-hover:text-indigo-600">Ikuti Polling</p>
                <p className="text-[10px] text-slate-500 mt-0.5">Beri suara musyawarah</p>
              </button>
            </div>
          </div>
        </div>

        {/* Kolom 2: Agenda Terdekat & Kalender Kuliah */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4 lg:col-span-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                <Calendar className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-bold text-slate-900">Agenda & Jadwal Mendatang</h3>
            </div>
            <button
              onClick={() => onNavigate('agenda')}
              className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold flex items-center gap-1"
            >
              Lihat Kalender <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {upcomingEvents.length === 0 ? (
            <p className="text-xs text-slate-400 py-8 text-center">Belum ada agenda terdekat</p>
          ) : (
            <div className="space-y-3">
              {upcomingEvents.map((evt) => (
                <div
                  key={evt.id}
                  className="p-3.5 rounded-xl border border-slate-100 hover:border-slate-200 bg-slate-50/60 hover:bg-slate-50 transition-colors flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 flex-col items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 shadow-2xs">
                      <span className="text-xs font-bold uppercase leading-tight">
                        {new Date(evt.date).toLocaleDateString('id-ID', { month: 'short' })}
                      </span>
                      <span className="text-lg font-black leading-none">
                        {new Date(evt.date).getDate()}
                      </span>
                    </div>
                    <div>
                      <p className="text-xs sm:text-sm font-bold text-slate-900">{evt.title}</p>
                      <p className="text-xs text-slate-500 italic mt-0.5">
                        {evt.start_time} - {evt.end_time} WIB • {evt.location}
                      </p>
                    </div>
                  </div>
                  <Badge variant={evt.type === 'exam' ? 'danger' : evt.type === 'lecture' ? 'primary' : 'neutral'}>
                    {evt.type}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Grid Bawah: Pengumuman Terbaru & Tugas Mahasiswa */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pengumuman Terbaru */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
                <Megaphone className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-bold text-slate-800">Pengumuman Terbaru</h3>
            </div>
            <button
              onClick={() => onNavigate('announcements')}
              className="text-xs text-blue-600 hover:underline font-medium"
            >
              Semua
            </button>
          </div>

          <div className="space-y-3">
            {recentAnnouncements.map((ann) => (
              <div
                key={ann.id}
                className="p-3.5 rounded-xl border border-slate-100 bg-slate-50/40 hover:bg-slate-50 space-y-1.5 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800 line-clamp-1">{ann.title}</span>
                  {ann.is_pinned && <Badge variant="warning">Pinned</Badge>}
                </div>
                <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">{ann.content}</p>
                <p className="text-[10px] text-slate-400">
                  Diposting oleh {ann.author_name} • {new Date(ann.created_at).toLocaleDateString('id-ID')}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Tugas Mahasiswa / Task Saya */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                <CheckSquare className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-bold text-slate-800">Tugas & Tanggung Jawab</h3>
            </div>
            <button
              onClick={() => onNavigate('tasks')}
              className="text-xs text-blue-600 hover:underline font-medium"
            >
              Buka Modul Tugas
            </button>
          </div>

          {myTasks.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-400">
              Tidak ada tugas yang sedang ditugaskan kepada Anda.
            </div>
          ) : (
            <div className="space-y-2.5">
              {myTasks.map((t) => (
                <div
                  key={t.id}
                  className="p-3 rounded-xl border border-slate-100 bg-slate-50/50 flex items-center justify-between gap-2"
                >
                  <div>
                    <p className="text-xs font-bold text-slate-800">{t.title}</p>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Deadline: {t.deadline} • Prioritas: {t.priority}
                    </p>
                  </div>
                  <Badge
                    variant={
                      t.status === 'completed'
                        ? 'success'
                        : t.status === 'in_progress'
                        ? 'primary'
                        : 'neutral'
                    }
                  >
                    {t.status}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
