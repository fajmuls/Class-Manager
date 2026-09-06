import {
  User,
  Role,
  Permission,
  ClassInfo,
  Transaction,
  TransactionCategory,
  Bill,
  Payment,
  EventItem,
  Announcement,
  Meeting,
  TaskItem,
  DocumentItem,
  Poll,
  AttendanceRecord,
  NotificationItem,
  AuditLog,
  FinanceSummary,
} from '../types/index.ts';

class ApiService {
  private currentUserId: string = 'usr_superadmin';

  setUserId(id: string) {
    this.currentUserId = id;
    localStorage.setItem('cms_user_id', id);
  }

  getUserId(): string {
    if (!this.currentUserId) {
      this.currentUserId = localStorage.getItem('cms_user_id') || 'usr_superadmin';
    }
    return this.currentUserId;
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const headers = {
      'Content-Type': 'application/json',
      'x-user-id': this.getUserId(),
      ...(options.headers || {}),
    };

    const response = await fetch(`/api${endpoint}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({ error: response.statusText }));
      throw new Error(errData.error || `HTTP error ${response.status}`);
    }

    return response.json();
  }

  // Auth & Profiles
  async getMe(): Promise<{ user: User; role: Role; permissions: string[]; classInfo: ClassInfo }> {
    return this.request('/auth/me');
  }

  async googleLogin(payload: {
    email: string;
    displayName: string | null;
    photoURL: string | null;
    uid: string;
  }): Promise<{ success: boolean; user: User; role: Role; permissions: string[]; classInfo: ClassInfo }> {
    const res = await this.request<{ success: boolean; user: User; role: Role; permissions: string[]; classInfo: ClassInfo }>('/auth/google-login', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    if (res.user) {
      this.setUserId(res.user.id);
    }
    return res;
  }

  async assignUserRole(userId: string, roleId: string): Promise<{ success: boolean; user: User; role: Role }> {
    return this.request('/auth/assign-role', {
      method: 'POST',
      body: JSON.stringify({ userId, roleId }),
    });
  }

  async getAllUsers(): Promise<User[]> {
    return this.request('/auth/users');
  }

  async switchUser(userId: string): Promise<{ success: boolean; user: User; role: Role }> {
    this.setUserId(userId);
    return this.request('/auth/switch', {
      method: 'POST',
      body: JSON.stringify({ userId }),
    });
  }

  // Class Info
  async getClassInfo(): Promise<ClassInfo> {
    return this.request('/class');
  }

  async updateClassInfo(data: Partial<ClassInfo>): Promise<ClassInfo> {
    return this.request('/class', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  // Members
  async getMembers(params?: { search?: string; role?: string; status?: string }): Promise<User[]> {
    const query = new URLSearchParams(params as any).toString();
    return this.request(`/members${query ? `?${query}` : ''}`);
  }

  async createMember(data: any): Promise<User> {
    return this.request('/members', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateMember(id: string, data: any): Promise<User> {
    return this.request(`/members/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async assignRole(userId: string, roleId: string): Promise<User> {
    return this.request(`/members/${userId}/role`, {
      method: 'POST',
      body: JSON.stringify({ role_id: roleId }),
    });
  }

  async deactivateMember(id: string): Promise<{ success: boolean }> {
    return this.request(`/members/${id}`, { method: 'DELETE' });
  }

  // Roles & Permissions
  async getRoles(): Promise<Role[]> {
    return this.request('/roles');
  }

  async getPermissions(): Promise<Permission[]> {
    return this.request('/permissions');
  }

  async createRole(data: { name: string; description: string; permissions: string[] }): Promise<Role> {
    return this.request('/roles', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateRole(id: string, data: Partial<Role>): Promise<Role> {
    return this.request(`/roles/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async updateRolePermissions(id: string, permissions: string[]): Promise<Role> {
    return this.request(`/roles/${id}/permissions`, {
      method: 'PUT',
      body: JSON.stringify({ permissions }),
    });
  }

  // Finance
  async getFinanceSummary(): Promise<FinanceSummary> {
    return this.request('/finance/summary');
  }

  async getTransactions(params?: { type?: string; category?: string; date_from?: string; date_to?: string }): Promise<Transaction[]> {
    const query = new URLSearchParams(params as any).toString();
    return this.request(`/finance/transactions${query ? `?${query}` : ''}`);
  }

  async getCategories(): Promise<TransactionCategory[]> {
    return this.request('/finance/categories');
  }

  async createTransaction(data: any): Promise<Transaction> {
    return this.request('/finance/transactions', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateTransaction(id: string, data: any): Promise<Transaction> {
    return this.request(`/finance/transactions/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteTransaction(id: string): Promise<{ success: boolean }> {
    return this.request(`/finance/transactions/${id}`, { method: 'DELETE' });
  }

  // Bills & Payments
  async getBills(): Promise<Bill[]> {
    return this.request('/finance/bills');
  }

  async createBill(data: { title: string; description?: string; amount: number; due_date?: string; period?: string }): Promise<Bill> {
    return this.request('/finance/bills', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getPayments(params?: { bill_id?: string; user_id?: string }): Promise<Payment[]> {
    const query = new URLSearchParams(params as any).toString();
    return this.request(`/finance/payments${query ? `?${query}` : ''}`);
  }

  async updatePayment(id: string, data: Partial<Payment>): Promise<Payment> {
    return this.request(`/finance/payments/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  // Agenda
  async getEvents(): Promise<EventItem[]> {
    return this.request('/agenda');
  }

  async createEvent(data: Partial<EventItem>): Promise<EventItem> {
    return this.request('/agenda', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async deleteEvent(id: string): Promise<{ success: boolean }> {
    return this.request(`/agenda/${id}`, { method: 'DELETE' });
  }

  // Announcements
  async getAnnouncements(): Promise<Announcement[]> {
    return this.request('/announcements');
  }

  async createAnnouncement(data: Partial<Announcement>): Promise<Announcement> {
    return this.request('/announcements', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async deleteAnnouncement(id: string): Promise<{ success: boolean }> {
    return this.request(`/announcements/${id}`, { method: 'DELETE' });
  }

  // Meetings
  async getMeetings(): Promise<Meeting[]> {
    return this.request('/meetings');
  }

  async createMeeting(data: Partial<Meeting>): Promise<Meeting> {
    return this.request('/meetings', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateMeetingMinutes(id: string, data: any): Promise<Meeting> {
    return this.request(`/meetings/${id}/minutes`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  // Tasks
  async getTasks(): Promise<TaskItem[]> {
    return this.request('/tasks');
  }

  async createTask(data: Partial<TaskItem>): Promise<TaskItem> {
    return this.request('/tasks', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateTask(id: string, data: Partial<TaskItem>): Promise<TaskItem> {
    return this.request(`/tasks/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteTask(id: string): Promise<{ success: boolean }> {
    return this.request(`/tasks/${id}`, { method: 'DELETE' });
  }

  // Courses & Assignments
  async getCourses(): Promise<any[]> {
    return this.request('/courses');
  }

  async createCourse(data: any): Promise<any> {
    return this.request('/courses', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateCourse(id: string, data: any): Promise<any> {
    return this.request(`/courses/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteCourse(id: string): Promise<{ success: boolean }> {
    return this.request(`/courses/${id}`, { method: 'DELETE' });
  }

  async getAssignments(): Promise<any[]> {
    return this.request('/assignments');
  }

  async createAssignment(data: any): Promise<any> {
    return this.request('/assignments', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async deleteAssignment(id: string): Promise<{ success: boolean }> {
    return this.request(`/assignments/${id}`, { method: 'DELETE' });
  }

  async getAssignmentSubmissions(id: string): Promise<any[]> {
    return this.request(`/assignments/${id}/submissions`);
  }

  async submitAssignment(id: string, data: { submission_url: string; notes?: string }): Promise<{ success: boolean; submission: any }> {
    return this.request(`/assignments/${id}/submit`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Documents
  async getDocuments(): Promise<DocumentItem[]> {
    return this.request('/documents');
  }

  async createDocument(data: Partial<DocumentItem>): Promise<DocumentItem> {
    return this.request('/documents', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async deleteDocument(id: string): Promise<{ success: boolean }> {
    return this.request(`/documents/${id}`, { method: 'DELETE' });
  }

  // Polls
  async getPolls(): Promise<Poll[]> {
    return this.request('/polls');
  }

  async createPoll(data: { question: string; description?: string; options: string[]; deadline?: string; is_anonymous?: boolean }): Promise<Poll> {
    return this.request('/polls', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async votePoll(pollId: string, optionId: string): Promise<{ success: boolean; poll: Poll }> {
    return this.request(`/polls/${pollId}/vote`, {
      method: 'POST',
      body: JSON.stringify({ option_id: optionId }),
    });
  }

  // Attendance
  async getAttendance(): Promise<AttendanceRecord[]> {
    return this.request('/attendance');
  }

  async recordAttendance(data: { title: string; date?: string; records: any[] }): Promise<{ success: boolean }> {
    return this.request('/attendance', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Notifications
  async getNotifications(): Promise<NotificationItem[]> {
    return this.request('/notifications');
  }

  async markNotificationRead(id: string): Promise<{ success: boolean }> {
    return this.request(`/notifications/${id}/read`, { method: 'POST' });
  }

  // Audit Logs
  async getAuditLogs(): Promise<AuditLog[]> {
    return this.request('/audit-logs');
  }

  // Arrears Report
  async getArrearsReport(): Promise<Payment[]> {
    return this.request('/reports/arrears');
  }

  // System Backup
  async getSystemBackup(): Promise<any> {
    return this.request('/system/backup');
  }
}

export const api = new ApiService();
