import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { UserProfile, UserRole } from '../../types';
import { UserAvatar } from '../common/UserAvatar';
import { 
  Users, 
  UserPlus, 
  Search, 
  ShieldCheck, 
  Scale, 
  Briefcase, 
  CheckCircle2, 
  Trash2, 
  Eye, 
  Filter, 
  X, 
  Building2, 
  MapPin, 
  Phone, 
  Mail, 
  Key, 
  AlertTriangle,
  ChevronDown
} from 'lucide-react';

const ROLE_OPTIONS: { role: UserRole; label: string; category: string; badgeColor: string }[] = [
  { role: 'deponent', label: 'Normal User (Deponent)', category: 'Public', badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  { role: 'commissioner', label: 'Commissioner for Oaths', category: 'Legal', badgeColor: 'bg-teal-50 text-teal-700 border-teal-200' },
  { role: 'advocate', label: 'Advocate of High Court', category: 'Legal', badgeColor: 'bg-blue-50 text-blue-700 border-blue-200' },
  { role: 'notary', label: 'Notary Public', category: 'Legal', badgeColor: 'bg-purple-50 text-purple-700 border-purple-200' },
  { role: 'judicial_officer', label: 'Judicial Officer (Magistrate / Judge)', category: 'Judiciary', badgeColor: 'bg-amber-50 text-amber-800 border-amber-200' },
  { role: 'justice_of_peace', label: 'Justice of the Peace (JP)', category: 'Judiciary', badgeColor: 'bg-orange-50 text-orange-800 border-orange-200' },
  { role: 'law_firm_admin', label: 'Law Firm Administrator', category: 'Chambers', badgeColor: 'bg-cyan-50 text-cyan-800 border-cyan-200' },
  { role: 'super_admin', label: 'Super Administrator', category: 'Admin', badgeColor: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
  { role: 'master_admin', label: 'Master Administrator', category: 'Admin', badgeColor: 'bg-rose-50 text-rose-700 border-rose-200' },
];

export const UserManagementSection: React.FC = () => {
  const {
    users,
    allPlatformUsers,
    currentUser,
    addUser,
    updateUserRole,
    deleteUser,
    switchUser,
    setOperatingView,
    setCurrentView
  } = useApp();

  // `users` only ever holds mock/seed accounts plus ADMITTED commissioners
  // (kept lean for bandwidth/privacy — every non-admin session loads it).
  // `allPlatformUsers` is the real full roster, streamed only for admins —
  // every account that's ever registered, any role, any status. Fall back
  // to `users` for an instant while the listener's first snapshot lands.
  const allUsers = allPlatformUsers.length > 0 ? allPlatformUsers : users;

  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<'ALL' | 'DEPONENTS' | 'LEGAL' | 'JUDICIARY' | 'ADMINS'>('ALL');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [roleChangeModalUser, setRoleChangeModalUser] = useState<UserProfile | null>(null);

  // New User Form State
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '+256 ',
    role: 'deponent' as UserRole,
    stationCity: 'Kampala',
    nationalIdNumber: '',
    lawFirmName: '',
    enrollmentNumber: '',
  });

  // Filtered users calculation
  const filteredUsers = useMemo(() => {
    return allUsers.filter(user => {
      // Search matching
      const query = searchQuery.trim().toLowerCase();
      const matchesSearch = !query || 
        user.fullName.toLowerCase().includes(query) ||
        user.email.toLowerCase().includes(query) ||
        (user.phone && user.phone.toLowerCase().includes(query)) ||
        (user.nationalIdNumber && user.nationalIdNumber.toLowerCase().includes(query)) ||
        (user.stationCity && user.stationCity.toLowerCase().includes(query)) ||
        (user.lawFirmName && user.lawFirmName.toLowerCase().includes(query));

      if (!matchesSearch) return false;

      // Tab matching
      if (roleFilter === 'DEPONENTS') {
        return user.role === 'deponent' || user.role === 'user';
      }
      if (roleFilter === 'LEGAL') {
        return ['commissioner', 'advocate', 'notary', 'law_firm_admin'].includes(user.role);
      }
      if (roleFilter === 'JUDICIARY') {
        return ['judicial_officer', 'justice_of_peace'].includes(user.role);
      }
      if (roleFilter === 'ADMINS') {
        return ['super_admin', 'master_admin', 'admin'].includes(user.role);
      }

      return true;
    });
  }, [allUsers, searchQuery, roleFilter]);

  // Statistics calculation
  const stats = useMemo(() => {
    return {
      total: allUsers.length,
      deponents: allUsers.filter(u => u.role === 'deponent' || u.role === 'user').length,
      commissioners: allUsers.filter(u => ['commissioner', 'advocate', 'notary'].includes(u.role)).length,
      judicial: allUsers.filter(u => ['judicial_officer', 'justice_of_peace'].includes(u.role)).length,
      admins: allUsers.filter(u => ['super_admin', 'master_admin', 'admin'].includes(u.role)).length,
    };
  }, [allUsers]);

  const handleCreateUserSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.fullName.trim() || !formData.email.trim()) {
      alert('Full Name and Email are mandatory statutory fields.');
      return;
    }

    addUser({
      fullName: formData.fullName.trim(),
      email: formData.email.trim(),
      phone: formData.phone.trim(),
      role: formData.role,
      stationCity: formData.stationCity.trim() || 'Kampala',
      nationalIdNumber: formData.nationalIdNumber.trim() || `CM${Math.floor(10000000 + Math.random() * 90000000)}88J`,
      lawFirmName: formData.lawFirmName.trim() || undefined,
      enrollmentNumber: formData.enrollmentNumber.trim() || undefined,
    });

    // Reset and close
    setFormData({
      fullName: '',
      email: '',
      phone: '+256 ',
      role: 'deponent',
      stationCity: 'Kampala',
      nationalIdNumber: '',
      lawFirmName: '',
      enrollmentNumber: '',
    });
    setIsAddModalOpen(false);
  };

  const handleRoleChangeConfirm = (newRole: UserRole) => {
    if (!roleChangeModalUser) return;
    updateUserRole(roleChangeModalUser.id, newRole);
    setRoleChangeModalUser(null);
  };

  const handleDeleteClick = (user: UserProfile) => {
    if (user.id === currentUser.id) {
      alert('Security Protection: You cannot delete your currently active administrator account.');
      return;
    }
    const confirmed = window.confirm(
      `Are you sure you want to permanently delete user "${user.fullName}" (${user.email})? This action will be logged in the immutable audit trail.`
    );
    if (confirmed) {
      deleteUser(user.id);
    }
  };

  const handleImpersonateUser = (user: UserProfile) => {
    switchUser(user.id);
    if (['super_admin', 'master_admin', 'admin'].includes(user.role)) {
      setOperatingView('ADMIN');
      setCurrentView('admin');
    } else if (['commissioner', 'advocate', 'notary', 'judicial_officer'].includes(user.role)) {
      setOperatingView('COMMISSIONER');
      setCurrentView('commissioner-dashboard');
    } else {
      setOperatingView('USER');
      setCurrentView('home');
    }
  };

  const getRoleBadge = (role: UserRole) => {
    const config = ROLE_OPTIONS.find(r => r.role === role);
    if (!config) {
      return (
        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono-code font-bold uppercase bg-slate-100 text-slate-700 border border-slate-200">
          {(role || '').replace(/_/g, ' ')}
        </span>
      );
    }
    return (
      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono-code font-bold uppercase border ${config.badgeColor}`}>
        {config.label}
      </span>
    );
  };

  return (
    <div className="space-y-6 animate-fadeIn" id="user-management-section-root">
      
      {/* Top Banner: Metrics & Add User CTA */}
      <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono-code font-bold bg-indigo-50 text-indigo-700 border border-indigo-200 flex items-center gap-1.5">
              <ShieldCheck className="w-3 h-3 text-indigo-600" />
              SUPER ADMIN RIGHTS
            </span>
            <span className="text-xs text-slate-500 font-mono-code">
              Statutory User Registry
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-display-legal font-bold text-[#0D1B3D]">
            User & Role Governance Console
          </h2>
          <p className="text-xs text-slate-500 max-w-xl leading-relaxed">
            Provision new practitioner accounts, assign statutory roles (Commissioners, Deponents, Judicial Officers, Admins), and manage platform access permissions.
          </p>
        </div>

        <button
          onClick={() => setIsAddModalOpen(true)}
          className="px-5 py-3 rounded-2xl bg-[#0D1B3D] hover:bg-[#14285A] text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-slate-900/15 transition-all cursor-pointer transform hover:-translate-y-0.5"
          id="btn-admin-add-user-modal"
        >
          <UserPlus className="w-4 h-4 text-amber-300" />
          <span>Add New User</span>
        </button>
      </div>

      {/* Metrics Summary Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs">
          <p className="text-[10px] font-mono-code font-semibold uppercase text-slate-500">Total Users</p>
          <p className="text-xl font-display-legal font-bold text-slate-900 mt-1">{stats.total}</p>
          <span className="text-[9px] text-slate-400">All registered records</span>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs">
          <p className="text-[10px] font-mono-code font-semibold uppercase text-emerald-700">Deponents</p>
          <p className="text-xl font-display-legal font-bold text-emerald-800 mt-1">{stats.deponents}</p>
          <span className="text-[9px] text-slate-400">Citizen / Client accounts</span>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs">
          <p className="text-[10px] font-mono-code font-semibold uppercase text-teal-700">Commissioners</p>
          <p className="text-xl font-display-legal font-bold text-teal-800 mt-1">{stats.commissioners}</p>
          <span className="text-[9px] text-slate-400">Authorized CFOs & Adv.</span>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs">
          <p className="text-[10px] font-mono-code font-semibold uppercase text-amber-700">Judicial Officers</p>
          <p className="text-xl font-display-legal font-bold text-amber-800 mt-1">{stats.judicial}</p>
          <span className="text-[9px] text-slate-400">Magistrates & JPs</span>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs">
          <p className="text-[10px] font-mono-code font-semibold uppercase text-indigo-700">Administrators</p>
          <p className="text-xl font-display-legal font-bold text-indigo-800 mt-1">{stats.admins}</p>
          <span className="text-[9px] text-slate-400">Super & Master Admins</span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        
        {/* Role Tabs */}
        <div className="flex flex-wrap items-center gap-1.5">
          {[
            { id: 'ALL', label: `All (${stats.total})` },
            { id: 'DEPONENTS', label: `Deponents (${stats.deponents})` },
            { id: 'LEGAL', label: `Commissioners (${stats.commissioners})` },
            { id: 'JUDICIARY', label: `Judicial (${stats.judicial})` },
            { id: 'ADMINS', label: `Admins (${stats.admins})` }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setRoleFilter(tab.id as any)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                roleFilter === tab.id
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search Input */}
        <div className="relative min-w-[240px] sm:w-72">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by name, email, NIN, city..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50/50"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Users Data Table */}
      <div className="rounded-3xl bg-white border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-50/80 text-slate-600 font-mono-code border-b border-slate-200 text-[11px]">
              <tr>
                <th className="px-5 py-3.5 font-semibold">User & Particulars</th>
                <th className="px-4 py-3.5 font-semibold">Current Role</th>
                <th className="px-4 py-3.5 font-semibold">Station / NIN</th>
                <th className="px-4 py-3.5 font-semibold">Statutory Authority</th>
                <th className="px-5 py-3.5 font-semibold text-right">Admin Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-400 space-y-2">
                    <Users className="w-8 h-8 mx-auto opacity-40 text-slate-400" />
                    <p className="font-semibold text-sm text-slate-600">No users found</p>
                    <p className="text-xs text-slate-400">Try adjusting your search query or role filter.</p>
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => {
                  const isCurrent = user.id === currentUser.id;
                  const verifiedAuth = user.authorities?.find(a => a.status === 'VERIFIED');

                  return (
                    <tr key={user.id} className="hover:bg-slate-50/70 transition-colors">
                      {/* User Info */}
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <UserAvatar
                            src={user.avatarUrl || null}
                            name={user.fullName}
                            size="md"
                          />
                          <div className="min-w-0">
                            <div className="font-bold text-slate-900 flex items-center gap-1.5">
                              <span className="truncate max-w-[200px]">{user.fullName}</span>
                              {isCurrent && (
                                <span className="text-[9px] px-1.5 py-0.2 rounded bg-indigo-100 text-indigo-700 font-bold font-mono-code">
                                  YOU
                                </span>
                              )}
                            </div>
                            <p className="text-[11px] text-slate-500 font-mono-code truncate max-w-[200px]">
                              {user.email}
                            </p>
                            {user.phone && (
                              <p className="text-[10px] text-slate-400 font-mono-code flex items-center gap-1 mt-0.5">
                                <Phone className="w-2.5 h-2.5" />
                                {user.phone}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Current Role + Quick Role Selector Dropdown */}
                      <td className="px-4 py-4">
                        <div className="space-y-1.5">
                          <div>{getRoleBadge(user.role)}</div>

                          {/* Quick Role Switcher Button */}
                          <button
                            type="button"
                            onClick={() => setRoleChangeModalUser(user)}
                            className="text-[10px] font-bold text-blue-600 hover:text-blue-800 hover:underline flex items-center gap-1 cursor-pointer"
                            id={`btn-change-role-${user.id}`}
                          >
                            <Key className="w-2.5 h-2.5" />
                            <span>Assign Role</span>
                            <ChevronDown className="w-2.5 h-2.5" />
                          </button>
                        </div>
                      </td>

                      {/* Station / City & NIN */}
                      <td className="px-4 py-4 space-y-1">
                        <div className="text-slate-800 font-semibold flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                          <span>{user.stationCity || 'Kampala'}</span>
                        </div>
                        <div className="text-[11px] font-mono-code text-slate-500">
                          NIN: {user.nationalIdNumber || 'N/A'}
                        </div>
                        {user.lawFirmName && (
                          <div className="text-[10px] text-slate-500 truncate max-w-[180px] flex items-center gap-1">
                            <Building2 className="w-2.5 h-2.5 text-slate-400 shrink-0" />
                            <span>{user.lawFirmName}</span>
                          </div>
                        )}
                      </td>

                      {/* Statutory Authority Status */}
                      <td className="px-4 py-4">
                        {verifiedAuth ? (
                          <div className="space-y-1">
                            <div className="inline-flex items-center gap-1 text-[10px] font-bold text-teal-700 bg-teal-50 border border-teal-200 px-2 py-0.5 rounded-md">
                              <CheckCircle2 className="w-3 h-3 text-teal-600" />
                              <span>{verifiedAuth.type.replace(/_/g, ' ').toUpperCase()}</span>
                            </div>
                            {verifiedAuth.licenceNumber && (
                              <p className="text-[10px] font-mono-code text-slate-500">
                                Ref: {verifiedAuth.licenceNumber}
                              </p>
                            )}
                          </div>
                        ) : (
                          <span className="text-[11px] text-slate-400 font-mono-code">
                            No Practising Warrant
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="px-5 py-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Impersonate / Switch User */}
                          <button
                            type="button"
                            onClick={() => handleImpersonateUser(user)}
                            className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
                            title={`Switch to ${user.fullName}'s view`}
                            id={`btn-impersonate-${user.id}`}
                          >
                            <Eye className="w-3.5 h-3.5 text-slate-600" />
                          </button>

                          {/* Delete User */}
                          {!isCurrent && (
                            <button
                              type="button"
                              onClick={() => handleDeleteClick(user)}
                              className="p-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 transition-colors cursor-pointer"
                              title={`Delete ${user.fullName}`}
                              id={`btn-delete-user-${user.id}`}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ===================================================================== */}
      {/* MODAL 1: ADD NEW USER                                                 */}
      {/* ===================================================================== */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex p-4 animate-fadeIn overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-slate-200 space-y-6 max-h-[90vh] overflow-y-auto m-auto">
            
            {/* Modal Header */}
            <div className="flex items-start justify-between gap-4 border-b border-slate-100 pb-4">
              <div className="space-y-1">
                <div className="inline-flex items-center gap-1.5 text-[10px] font-mono-code font-bold text-indigo-700 px-2.5 py-0.5 rounded-full bg-indigo-50 border border-indigo-200">
                  <UserPlus className="w-3 h-3 text-indigo-600" />
                  SUPER ADMIN PROVISIONING
                </div>
                <h3 className="text-xl font-display-legal font-bold text-[#0D1B3D]">
                  Add New Platform User
                </h3>
                <p className="text-xs text-slate-500">
                  Fill in the statutory particulars and assign their designated platform role.
                </p>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-2 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleCreateUserSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-800 mb-1">
                  Full Legal Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Adv. Robert Mugisha"
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-800 mb-1">
                    Email Address <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="name@chambers.ug"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono-code"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-800 mb-1">
                    Ugandan Phone Number
                  </label>
                  <input
                    type="tel"
                    placeholder="+256 772 123 456"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono-code"
                  />
                </div>
              </div>

              {/* Designated Role Selector */}
              <div>
                <label className="block font-bold text-slate-800 mb-1">
                  Assign Initial Role <span className="text-rose-500">*</span>
                </label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value as UserRole })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 font-semibold bg-white cursor-pointer"
                >
                  {ROLE_OPTIONS.map((opt) => (
                    <option key={opt.role} value={opt.role}>
                      [{opt.category}] {opt.label}
                    </option>
                  ))}
                </select>
                <p className="text-[10px] text-slate-500 mt-1">
                  Practitioners (Commissioners / Advocates) receive automated verification warrants.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-800 mb-1">
                    Station / City
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Kampala Central, Gulu, Jinja"
                    value={formData.stationCity}
                    onChange={(e) => setFormData({ ...formData, stationCity: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-800 mb-1">
                    NIRA National ID (NIN)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. CM88019238KL8A"
                    value={formData.nationalIdNumber}
                    onChange={(e) => setFormData({ ...formData, nationalIdNumber: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono-code uppercase"
                  />
                </div>
              </div>

              {/* Optional Chambers / Enrollment fields for legal pros */}
              {['commissioner', 'advocate', 'notary', 'judicial_officer', 'law_firm_admin'].includes(formData.role) && (
                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                  <p className="font-bold text-[11px] text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                    <Scale className="w-3.5 h-3.5 text-blue-600" />
                    Practising Authority Particulars
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">
                        Chambers / Court Station
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Mugisha & Partners Advocates"
                        value={formData.lawFirmName}
                        onChange={(e) => setFormData({ ...formData, lawFirmName: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white"
                      />
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">
                        Enrollment / Warrant Ref
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. ULC/PC/2026/089"
                        value={formData.enrollmentNumber}
                        onChange={(e) => setFormData({ ...formData, enrollmentNumber: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white font-mono-code"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Submit Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl text-slate-600 hover:bg-slate-100 font-bold transition-colors cursor-pointer"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold transition-all shadow-md shadow-blue-600/20 cursor-pointer flex items-center gap-2"
                  id="btn-submit-create-user"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Create User Account</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* MODAL 2: ASSIGN ROLE TO EXISTING USER                                  */}
      {/* ===================================================================== */}
      {roleChangeModalUser && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex p-4 animate-fadeIn overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl border border-slate-200 space-y-6 m-auto">
            
            <div className="flex items-start justify-between gap-4 border-b border-slate-100 pb-4">
              <div className="space-y-1">
                <span className="px-2 py-0.5 rounded text-[10px] font-mono-code font-bold bg-amber-50 text-amber-800 border border-amber-200">
                  STATUTORY ROLE REASSIGNMENT
                </span>
                <h3 className="text-xl font-display-legal font-bold text-[#0D1B3D]">
                  Assign Role to User
                </h3>
                <p className="text-xs text-slate-500">
                  Target: <strong className="text-slate-900">{roleChangeModalUser.fullName}</strong> ({roleChangeModalUser.email})
                </p>
              </div>
              <button
                onClick={() => setRoleChangeModalUser(null)}
                className="p-2 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2">
              <p className="text-xs font-bold text-slate-800">
                Select New Statutory Role:
              </p>

              <div className="space-y-1.5 max-h-60 overflow-y-auto pr-1">
                {ROLE_OPTIONS.map((opt) => {
                  const isCurrent = roleChangeModalUser.role === opt.role;
                  return (
                    <button
                      key={opt.role}
                      type="button"
                      onClick={() => handleRoleChangeConfirm(opt.role)}
                      className={`w-full p-3 rounded-xl border text-left flex items-center justify-between transition-all cursor-pointer ${
                        isCurrent
                          ? 'bg-blue-50 border-blue-400 text-blue-900 shadow-xs'
                          : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-700'
                      }`}
                      id={`btn-assign-role-${opt.role}`}
                    >
                      <div>
                        <p className="text-xs font-bold">{opt.label}</p>
                        <p className="text-[10px] text-slate-500 font-mono-code">Category: {opt.category}</p>
                      </div>
                      {isCurrent ? (
                        <span className="text-[10px] font-mono-code font-extrabold text-blue-700 px-2 py-0.5 rounded bg-blue-100">
                          CURRENT
                        </span>
                      ) : (
                        <span className="text-[11px] font-bold text-slate-400 group-hover:text-slate-600">
                          Assign →
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-amber-600" />
              <p className="leading-relaxed">
                Assigning a Commissioner or Judicial Officer role will grant statutory commissioning warrants and live oath powers.
              </p>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setRoleChangeModalUser(null)}
                className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 text-xs font-bold cursor-pointer"
              >
                Close
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
