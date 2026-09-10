import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext.tsx';
import { RoleSwitcherBar } from './components/Layout/RoleSwitcherBar.tsx';
import { Navbar } from './components/Layout/Navbar.tsx';
import { Sidebar } from './components/Layout/Sidebar.tsx';
import { DashboardHub } from './components/Dashboard/index.tsx';
import { MembersModule } from './components/Modules/Members/index.tsx';
import { FinanceModule } from './components/Modules/Finance/index.tsx';
import { MyKasModule } from './components/Modules/Finance/MyKas.tsx';
import { TransparencyModule } from './components/Modules/Finance/Transparency.tsx';
import { AgendaModule } from './components/Modules/Agenda/index.tsx';
import { AnnouncementsModule } from './components/Modules/Announcements/index.tsx';
import { MeetingsModule } from './components/Modules/Meetings/index.tsx';
import { TasksModule } from './components/Modules/Tasks/index.tsx';
import { DocumentsModule } from './components/Modules/Documents/index.tsx';
import { PollsModule } from './components/Modules/Polls/index.tsx';
import { AttendanceModule } from './components/Modules/Attendance/index.tsx';
import { ReportsModule } from './components/Modules/Reports/index.tsx';
import { RolesModule } from './components/Modules/Roles/index.tsx';
import { AuditLogsModule } from './components/Modules/AuditLogs/index.tsx';
import { SettingsModule } from './components/Modules/Settings/index.tsx';
import { CoursesModule } from './components/Modules/Courses/index.tsx';
import { GlobalSearchModal } from './components/UI/GlobalSearchModal.tsx';
import { GoogleRoleClaimModal } from './components/Auth/GoogleRoleClaimModal.tsx';
import { DashboardSkeleton } from './components/UI/DashboardSkeleton.tsx';

const AppContent: React.FC = () => {
  const { user, role, isLoading, claimStatus } = useAuth();
  const [currentModule, setCurrentModule] = useState<string>('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [showRoleSwitcher, setShowRoleSwitcher] = useState<boolean>(() => {
    return localStorage.getItem('cms_show_role_switcher') === 'true';
  });

  // Listen to custom event to toggle role switcher from settings
  useEffect(() => {
    const handleToggleRoleSwitcher = (e: any) => {
      if (typeof e.detail?.show === 'boolean') {
        setShowRoleSwitcher(e.detail.show);
        localStorage.setItem('cms_show_role_switcher', String(e.detail.show));
      } else {
        setShowRoleSwitcher(prev => {
          const next = !prev;
          localStorage.setItem('cms_show_role_switcher', String(next));
          return next;
        });
      }
    };
    window.addEventListener('cms-toggle-role-switcher', handleToggleRoleSwitcher);
    return () => window.removeEventListener('cms-toggle-role-switcher', handleToggleRoleSwitcher);
  }, []);

  // Keyboard shortcut Cmd/Ctrl + K for global search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsSearchOpen(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  if (isLoading) {
    return <DashboardSkeleton />;
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col antialiased text-slate-900 selection:bg-indigo-100 selection:text-indigo-900">
      {/* Role Switcher Bar - Only shown if toggled in Admin settings */}
      {showRoleSwitcher && (
        <RoleSwitcherBar
          onClose={() => {
            setShowRoleSwitcher(false);
            localStorage.setItem('cms_show_role_switcher', 'false');
          }}
        />
      )}

      {/* Top Navigation Bar */}
      <Navbar
        onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
        onOpenSearch={() => setIsSearchOpen(true)}
      />

      {/* Main Layout Container */}
      <div className="flex-1 flex w-full">
        {/* Dynamic RBAC Sidebar */}
        <Sidebar
          currentModule={currentModule}
          onSelectModule={(mod) => setCurrentModule(mod)}
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
        />

        {/* Content Area */}
        <main className="flex-1 overflow-x-hidden p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full">
          {currentModule === 'dashboard' && (
            <DashboardHub onNavigate={(mod) => setCurrentModule(mod)} />
          )}
          {currentModule === 'courses' && <CoursesModule />}
          {currentModule === 'members' && <MembersModule />}
          {currentModule === 'finance' && <FinanceModule />}
          {currentModule === 'my-kas' && <MyKasModule />}
          {currentModule === 'transparency' && <TransparencyModule />}
          {currentModule === 'agenda' && <AgendaModule />}
          {currentModule === 'announcements' && <AnnouncementsModule />}
          {currentModule === 'meetings' && <MeetingsModule />}
          {currentModule === 'tasks' && <TasksModule />}
          {currentModule === 'documents' && <DocumentsModule />}
          {currentModule === 'polls' && <PollsModule />}
          {currentModule === 'attendance' && <AttendanceModule />}
          {currentModule === 'reports' && <ReportsModule />}
          {currentModule === 'roles' && <RolesModule />}
          {currentModule === 'audit-logs' && <AuditLogsModule />}
          {currentModule === 'settings' && <SettingsModule />}
        </main>
      </div>

      {/* Global Quick Search Modal */}
      <GlobalSearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        onSelectModule={(mod) => setCurrentModule(mod)}
      />

      {/* Google Sign-in Identity & Role Claim Modal */}
      <GoogleRoleClaimModal
        isOpen={claimStatus.requiresClaim || claimStatus.isPendingApproval}
      />
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
