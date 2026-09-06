import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext.tsx';
import { MemberDashboard } from './MemberDashboard.tsx';
import { ChairmanDashboard } from './ChairmanDashboard.tsx';
import { TreasurerDashboard } from './TreasurerDashboard.tsx';
import { SecretaryDashboard } from './SecretaryDashboard.tsx';
import { SuperAdminDashboard } from './SuperAdminDashboard.tsx';
import { Eye, ShieldAlert } from 'lucide-react';

interface DashboardHubProps {
  onNavigate: (module: string) => void;
}

export const DashboardHub: React.FC<DashboardHubProps> = ({ onNavigate }) => {
  const { role } = useAuth();
  const [viewOverride, setViewOverride] = useState<string | null>(null);

  const activeRoleKey = viewOverride || role?.id || 'role_anggota';

  return (
    <div className="space-y-4">
      {/* Perspective switcher for management/superadmin */}
      {(role?.id === 'role_superadmin' || role?.id === 'role_ketua') && (
        <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 bg-slate-100/80 rounded-xl border border-slate-200/80 text-xs">
          <div className="flex items-center gap-1.5 text-slate-600 font-medium">
            <Eye className="w-3.5 h-3.5 text-slate-500" />
            <span>Pratinjau Sudut Pandang Dashboard:</span>
          </div>
          <div className="flex items-center gap-1">
            {[
              { key: 'role_superadmin', label: 'Super Admin' },
              { key: 'role_ketua', label: 'Ketua' },
              { key: 'role_bendahara', label: 'Bendahara' },
              { key: 'role_sekretaris', label: 'Sekretaris' },
              { key: 'role_anggota', label: 'Anggota' },
            ].map((p) => (
              <button
                key={p.key}
                onClick={() => setViewOverride(p.key === role.id ? null : p.key)}
                className={`px-2 py-1 rounded-md text-[11px] font-medium transition-colors ${
                  activeRoleKey === p.key
                    ? 'bg-white text-blue-600 shadow-2xs font-semibold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Render matching dashboard */}
      {activeRoleKey === 'role_superadmin' ? (
        <SuperAdminDashboard onNavigate={onNavigate} />
      ) : activeRoleKey === 'role_ketua' || activeRoleKey === 'role_wakil' ? (
        <ChairmanDashboard onNavigate={onNavigate} />
      ) : activeRoleKey === 'role_bendahara' ? (
        <TreasurerDashboard onNavigate={onNavigate} />
      ) : activeRoleKey === 'role_sekretaris' ? (
        <SecretaryDashboard onNavigate={onNavigate} />
      ) : (
        <MemberDashboard onNavigate={onNavigate} />
      )}
    </div>
  );
};
