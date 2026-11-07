import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
  LayoutDashboard,
  BookOpen,
  FileText,
  CheckCircle,
  AlertTriangle,
  FileCheck,
  SpellCheck,
  Users,
  BarChart3,
  Settings,
  PlusCircle,
  Clock,
  Inbox,
  History,
  ShieldAlert,
} from 'lucide-react';

export const Sidebar: React.FC = () => {
  const { user } = useAuth();
  const role = user?.role;

  const linkClass = ({ isActive }: { isActive: boolean }) =>
    `flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-colors ${
      isActive
        ? 'bg-indigo-600 text-white shadow-sm'
        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
    }`;

  return (
    <aside className="w-64 bg-navy-950 border-r border-slate-800/80 min-h-[calc(100vh-4rem)] p-4 flex flex-col justify-between shrink-0">
      <div className="space-y-6">
        {/* Role-Specific Navigation Sections */}

        {/* 1. CREATOR LINKS */}
        {(role === 'CREATOR' || role === 'ADMIN') && (
          <div>
            <div className="px-3 mb-2 text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Content Studio
            </div>
            <nav className="space-y-1">
              <NavLink to="/creator/dashboard" className={linkClass}>
                <LayoutDashboard className="w-4 h-4" />
                <span>Creator Studio</span>
              </NavLink>
              <NavLink to="/creator/submit" className={linkClass}>
                <PlusCircle className="w-4 h-4" />
                <span>Submit Content</span>
              </NavLink>
              <NavLink to="/creator/submissions" className={linkClass}>
                <FileText className="w-4 h-4" />
                <span>My Submissions</span>
              </NavLink>
            </nav>
          </div>
        )}

        {/* 2. REVIEWER LINKS */}
        {(role === 'REVIEWER' || role === 'ADMIN') && (
          <div>
            <div className="px-3 mb-2 text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Governance & Review
            </div>
            <nav className="space-y-1">
              <NavLink to="/reviewer/queue" className={linkClass}>
                <Inbox className="w-4 h-4" />
                <span>Review Queue</span>
              </NavLink>
              <NavLink to="/reviewer/history" className={linkClass}>
                <History className="w-4 h-4" />
                <span>Approval History</span>
              </NavLink>
            </nav>
          </div>
        )}

        {/* 3. ADMIN KNOWLEDGE HUB & SETTINGS */}
        {role === 'ADMIN' && (
          <div>
            <div className="px-3 mb-2 text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Brand Knowledge Hub
            </div>
            <nav className="space-y-1">
              <NavLink to="/admin/analytics" className={linkClass}>
                <BarChart3 className="w-4 h-4" />
                <span>Governance Analytics</span>
              </NavLink>
              <NavLink to="/admin/knowledge" className={linkClass}>
                <BookOpen className="w-4 h-4" />
                <span>Brand Guidelines</span>
              </NavLink>
              <NavLink to="/admin/documents" className={linkClass}>
                <FileCheck className="w-4 h-4" />
                <span>Documents & RAG</span>
              </NavLink>
              <NavLink to="/admin/facts" className={linkClass}>
                <CheckCircle className="w-4 h-4" />
                <span>Approved Facts</span>
              </NavLink>
              <NavLink to="/admin/claims" className={linkClass}>
                <FileText className="w-4 h-4" />
                <span>Approved Claims</span>
              </NavLink>
              <NavLink to="/admin/restricted" className={linkClass}>
                <ShieldAlert className="w-4 h-4" />
                <span>Restricted Claims</span>
              </NavLink>
              <NavLink to="/admin/terminology" className={linkClass}>
                <SpellCheck className="w-4 h-4" />
                <span>Terminology Rules</span>
              </NavLink>
              <NavLink to="/admin/users" className={linkClass}>
                <Users className="w-4 h-4" />
                <span>User Management</span>
              </NavLink>
              <NavLink to="/admin/settings" className={linkClass}>
                <Settings className="w-4 h-4" />
                <span>Organisation Settings</span>
              </NavLink>
            </nav>
          </div>
        )}
      </div>

      {/* Footer Info */}
      <div className="pt-4 border-t border-slate-800/80 text-[11px] text-slate-500 flex items-center justify-between px-2">
        <span>BrandGuard AI v1.0</span>
        <span className="inline-block w-2 h-2 rounded-full bg-emerald-500" title="Online"></span>
      </div>
    </aside>
  );
};
