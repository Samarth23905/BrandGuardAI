import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { User, Shield, Mail, Building, Key } from 'lucide-react';

export const UserProfilePage: React.FC = () => {
  const { user, organisation } = useAuth();

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">User Account Profile</h1>
        <p className="text-sm text-slate-500">Your role, assigned organization, and access identity.</p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-indigo-600 flex items-center justify-center font-bold text-2xl text-white shadow-md shadow-indigo-600/30 overflow-hidden">
            {user?.avatarUrl ? (
              <img src={user.avatarUrl} alt={user.name} className="w-full h-full object-cover" />
            ) : (
              <User className="w-8 h-8" />
            )}
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900">{user?.name}</h2>
            <div className="flex items-center gap-2 mt-1">
              <span className="font-bold text-xs uppercase text-indigo-600 bg-indigo-50 px-2.5 py-0.5 rounded-full border border-indigo-100">
                {user?.role}
              </span>
              <span className="text-xs text-slate-400">&bull; {organisation?.name}</span>
            </div>
          </div>
        </div>

        <div className="space-y-3 border-t border-slate-100 pt-6 text-xs text-slate-600">
          <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
            <Mail className="w-4 h-4 text-slate-400" />
            <div>
              <span className="font-semibold text-slate-500">Email Address:</span>{' '}
              <span className="text-slate-900 font-mono font-medium">{user?.email}</span>
            </div>
          </div>

          <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
            <Building className="w-4 h-4 text-slate-400" />
            <div>
              <span className="font-semibold text-slate-500">Organization Slug:</span>{' '}
              <span className="text-slate-900 font-mono font-medium">{organisation?.slug}</span>
            </div>
          </div>

          <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
            <Shield className="w-4 h-4 text-slate-400" />
            <div>
              <span className="font-semibold text-slate-500">System Role:</span>{' '}
              <span className="text-slate-900 font-bold">{user?.role}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
