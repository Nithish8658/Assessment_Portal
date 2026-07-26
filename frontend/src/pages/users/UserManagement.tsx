import React, { useState, useEffect } from 'react';
import apiClient from '../../api/client';
import { Users, Upload, FileSpreadsheet, CheckCircle, AlertCircle, Plus, RefreshCw, Edit3, UserPlus, Search, ShieldCheck } from 'lucide-react';

export const UserManagement: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'students' | 'faculty' | 'import'>('students');
  const [students, setStudents] = useState<any[]>([]);
  const [faculty, setFaculty] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);

  // CSV Import State
  const [importType, setImportType] = useState<'student' | 'faculty'>('student');
  const [importFile, setImportFile] = useState<File | null>(null);
  const [uploadMsg, setUploadMsg] = useState<string | null>(null);

  // Add User Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [addUsername, setAddUsername] = useState('');
  const [addFullName, setAddFullName] = useState('');
  const [addEmail, setAddEmail] = useState('');
  const [addPassword, setAddPassword] = useState('password123');
  const [addRole, setAddRole] = useState('Student');
  const [addSection, setAddSection] = useState('A');
  const [addProgCode, setAddProgCode] = useState('23BCA');
  const [addDesignation, setAddDesignation] = useState('Assistant Professor');

  // Edit / Correct Details Modal State
  const [showEditModal, setShowEditModal] = useState(false);
  const [editUserId, setEditUserId] = useState<number | null>(null);
  const [editFullName, setEditFullName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editRegOrEmpId, setEditRegOrEmpId] = useState('');
  const [editSection, setEditSection] = useState('');
  const [editRole, setEditRole] = useState('');
  const [editPassword, setEditPassword] = useState('');
  const [editIsActive, setEditIsActive] = useState(true);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = () => {
    apiClient.get('/users/students').then(res => setStudents(res.data));
    apiClient.get('/users/faculty').then(res => setFaculty(res.data));
  };

  const handleCreateUserSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiClient.post('/users', {
        username: addUsername,
        full_name: addFullName,
        email: addEmail,
        password: addPassword || 'password123',
        role_name: addRole,
        register_number_or_emp_id: addUsername,
        programme_code: addProgCode,
        section_name: addSection,
        designation: addDesignation
      });
      setShowAddModal(false);
      setAddUsername('');
      setAddFullName('');
      setAddEmail('');
      fetchUsers();
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to create user');
    }
  };

  const openEditModal = (item: any, isStudent: boolean) => {
    setEditUserId(item.user_id || item.id);
    setEditFullName(item.full_name);
    setEditEmail(item.email);
    setEditRegOrEmpId(item.register_number || item.employee_id || '');
    setEditSection(item.section_name || 'A');
    setEditRole(isStudent ? 'Student' : 'Faculty');
    setEditPassword('');
    setEditIsActive(item.status !== 'Inactive');
    setShowEditModal(true);
  };

  const handleEditUserSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editUserId) return;

    try {
      await apiClient.put(`/users/${editUserId}`, {
        full_name: editFullName,
        email: editEmail,
        register_number_or_emp_id: editRegOrEmpId,
        section_name: editSection,
        role_name: editRole,
        password: editPassword || undefined,
        is_active: editIsActive
      });
      setShowEditModal(false);
      fetchUsers();
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to update user details');
    }
  };

  const handleBulkImport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!importFile) return;

    const formData = new FormData();
    formData.append('file', importFile);

    setLoading(true);
    setUploadMsg(null);
    try {
      const res = await apiClient.post(`/users/bulk-import?user_type=${importType}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setUploadMsg(res.data.message);
      fetchUsers();
    } catch (err: any) {
      setUploadMsg('Import failed. Please check CSV format.');
    } finally {
      setLoading(false);
    }
  };

  const filteredStudents = students.filter(s =>
    s.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.register_number?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredFaculty = faculty.filter(f =>
    f.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    f.employee_id?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    f.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Institutional User Registry & Profile Correction</h2>
          <p className="text-xs text-slate-500">Coordinator & Admin Management Architecture — Add Users, Correct Register Records & Import Profiles</p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={() => setShowAddModal(true)}
            className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold px-4 py-2.5 rounded-lg shadow-sm transition flex items-center space-x-2"
          >
            <UserPlus className="w-4 h-4" />
            <span>+ Add New User</span>
          </button>

          <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs">
            <button
              onClick={() => setActiveTab('students')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition ${activeTab === 'students' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-600'}`}
            >
              Students ({students.length})
            </button>
            <button
              onClick={() => setActiveTab('faculty')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition ${activeTab === 'faculty' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-600'}`}
            >
              Faculty ({faculty.length})
            </button>
            <button
              onClick={() => setActiveTab('import')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition ${activeTab === 'import' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-600'}`}
            >
              CSV Bulk Import
            </button>
          </div>
        </div>
      </div>

      {/* Search Input Filter */}
      {activeTab !== 'import' && (
        <div className="relative max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search candidate name, reg number, employee ID, email..."
            className="w-full bg-white border border-slate-300 rounded-xl pl-9 pr-4 py-2 text-xs focus:ring-2 focus:ring-blue-500 shadow-sm"
          />
        </div>
      )}

      {/* Students Directory Table */}
      {activeTab === 'students' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
            <h3 className="font-bold text-sm text-slate-800">Student Register Directory</h3>
            <span className="text-xs text-slate-500">Showing {filteredStudents.length} Students</span>
          </div>
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200">
                <th className="p-3">Register No</th>
                <th className="p-3">Student Name</th>
                <th className="p-3">Email Address</th>
                <th className="p-3">Programme</th>
                <th className="p-3">Batch / Sec</th>
                <th className="p-3">Status</th>
                <th className="p-3 text-right">Correct / Edit</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredStudents.map((s) => (
                <tr key={s.id} className="hover:bg-slate-50">
                  <td className="p-3 font-mono font-bold text-blue-700">{s.register_number}</td>
                  <td className="p-3 font-semibold text-slate-900">{s.full_name}</td>
                  <td className="p-3 text-slate-600 font-mono text-[11px]">{s.email}</td>
                  <td className="p-3 text-slate-700">{s.programme_name} ({s.programme_code})</td>
                  <td className="p-3 text-slate-600">{s.batch_name} (Sec {s.section_name})</td>
                  <td className="p-3">
                    <span className="bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded text-[11px] font-semibold">
                      {s.status}
                    </span>
                  </td>
                  <td className="p-3 text-right">
                    <button
                      onClick={() => openEditModal(s, true)}
                      className="px-2.5 py-1 bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-300 font-bold text-[11px] rounded-lg transition flex items-center space-x-1 ml-auto"
                    >
                      <Edit3 className="w-3 h-3" />
                      <span>Edit Details</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Faculty Directory Table */}
      {activeTab === 'faculty' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
            <h3 className="font-bold text-sm text-slate-800">Faculty Staff Directory</h3>
            <span className="text-xs text-slate-500">Showing {filteredFaculty.length} Staff</span>
          </div>
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200">
                <th className="p-3">Employee ID</th>
                <th className="p-3">Faculty Name</th>
                <th className="p-3">Email Address</th>
                <th className="p-3">Designation</th>
                <th className="p-3">Department</th>
                <th className="p-3">Status</th>
                <th className="p-3 text-right">Correct / Edit</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredFaculty.map((f) => (
                <tr key={f.id} className="hover:bg-slate-50">
                  <td className="p-3 font-mono font-bold text-purple-700">{f.employee_id}</td>
                  <td className="p-3 font-semibold text-slate-900">{f.full_name}</td>
                  <td className="p-3 text-slate-600 font-mono text-[11px]">{f.email}</td>
                  <td className="p-3 text-slate-600">{f.designation}</td>
                  <td className="p-3 text-slate-700">{f.department_name}</td>
                  <td className="p-3">
                    <span className="bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded text-[11px] font-semibold">
                      {f.status}
                    </span>
                  </td>
                  <td className="p-3 text-right">
                    <button
                      onClick={() => openEditModal(f, false)}
                      className="px-2.5 py-1 bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-300 font-bold text-[11px] rounded-lg transition flex items-center space-x-1 ml-auto"
                    >
                      <Edit3 className="w-3 h-3" />
                      <span>Edit Details</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* CSV Bulk Import View */}
      {activeTab === 'import' && (
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-6">
          <div className="border-b border-slate-200 pb-4">
            <h3 className="font-bold text-base text-slate-900 flex items-center space-x-2">
              <Upload className="w-5 h-5 text-blue-600" />
              <span>Institutional CSV Bulk Import Architecture</span>
            </h3>
            <p className="text-xs text-slate-500 mt-1">Upload CSV spreadsheet containing Student Register numbers or Faculty Employee IDs</p>
          </div>

          {uploadMsg && (
            <div className="bg-blue-50 border border-blue-200 text-blue-800 p-4 rounded-xl text-xs font-semibold flex items-center space-x-2">
              <CheckCircle className="w-4 h-4 text-blue-600 shrink-0" />
              <span>{uploadMsg}</span>
            </div>
          )}

          <form onSubmit={handleBulkImport} className="space-y-4 max-w-lg">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Target Account Type</label>
              <select
                value={importType}
                onChange={(e) => setImportType(e.target.value as 'student' | 'faculty')}
                className="w-full bg-slate-50 border border-slate-300 text-slate-800 rounded-lg px-3 py-2 text-xs font-medium"
              >
                <option value="student">Student Profiles Bulk Import</option>
                <option value="faculty">Faculty Profiles Bulk Import</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Select CSV File</label>
              <input
                type="file"
                accept=".csv"
                onChange={(e) => setImportFile(e.target.files ? e.target.files[0] : null)}
                className="w-full border border-slate-300 bg-slate-50 rounded-lg p-2 text-xs text-slate-700"
                required
              />
            </div>

            <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-[11px] text-slate-600">
              <strong className="block font-semibold text-slate-800 mb-1">CSV Template Format Required:</strong>
              <p className="font-mono text-[10px] text-slate-700">username, email, full_name, mobile, programme_code, batch, semester, section</p>
            </div>

            <button
              type="submit"
              disabled={loading || !importFile}
              className="bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs px-6 py-2.5 rounded-lg shadow-sm transition disabled:opacity-50"
            >
              {loading ? 'Processing Import...' : 'Confirm Bulk Import'}
            </button>
          </form>
        </div>
      )}

      {/* Add New User Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 text-xs">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="text-base font-bold text-slate-900 flex items-center space-x-2">
                <UserPlus className="w-5 h-5 text-blue-600" />
                <span>+ Add New Institutional User</span>
              </h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600 font-bold">✕</button>
            </div>

            <form onSubmit={handleCreateUserSubmit} className="space-y-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Account Role</label>
                <select
                  value={addRole}
                  onChange={(e) => setAddRole(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 font-medium"
                >
                  <option value="Student">Student Candidate</option>
                  <option value="Faculty">Faculty Instructor</option>
                  <option value="Assessment Coordinator">Assessment Coordinator</option>
                  <option value="HoD">Head of Department (HoD)</option>
                  <option value="Administrator">Administrator</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Register No / Staff ID (Username)</label>
                <input
                  type="text"
                  value={addUsername}
                  onChange={(e) => setAddUsername(e.target.value)}
                  placeholder="e.g. 23BCA105 or CS-FAC-99"
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 font-mono"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Full Name</label>
                <input
                  type="text"
                  value={addFullName}
                  onChange={(e) => setAddFullName(e.target.value)}
                  placeholder="e.g. Anand Sharma"
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 font-medium"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Email Address</label>
                <input
                  type="email"
                  value={addEmail}
                  onChange={(e) => setAddEmail(e.target.value)}
                  placeholder="anand@nasc.edu.in"
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 font-mono"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Password</label>
                  <input
                    type="text"
                    value={addPassword}
                    onChange={(e) => setAddPassword(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 font-mono"
                    required
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Section / Dept Code</label>
                  <input
                    type="text"
                    value={addSection}
                    onChange={(e) => setAddSection(e.target.value)}
                    placeholder="A or CS"
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 font-mono"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-3 border-t">
                <button type="button" onClick={() => setShowAddModal(false)} className="px-4 py-2 border rounded-lg">Cancel</button>
                <button type="submit" className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-lg shadow">Create User</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit / Correct Details Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 text-xs">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="text-base font-bold text-slate-900 flex items-center space-x-2">
                <Edit3 className="w-5 h-5 text-amber-600" />
                <span>Correct & Edit User Details</span>
              </h3>
              <button onClick={() => setShowEditModal(false)} className="text-slate-400 hover:text-slate-600 font-bold">✕</button>
            </div>

            <form onSubmit={handleEditUserSubmit} className="space-y-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Full Name (Spelling Correction)</label>
                <input
                  type="text"
                  value={editFullName}
                  onChange={(e) => setEditFullName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 font-medium"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Email Address</label>
                <input
                  type="email"
                  value={editEmail}
                  onChange={(e) => setEditEmail(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 font-mono"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Register No / Staff ID</label>
                  <input
                    type="text"
                    value={editRegOrEmpId}
                    onChange={(e) => setEditRegOrEmpId(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 font-mono"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Section Name</label>
                  <input
                    type="text"
                    value={editSection}
                    onChange={(e) => setEditSection(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Reset Password (Optional)</label>
                <input
                  type="password"
                  value={editPassword}
                  onChange={(e) => setEditPassword(e.target.value)}
                  placeholder="Leave blank to keep unchanged"
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 font-mono"
                />
              </div>

              <div className="flex justify-end space-x-3 pt-3 border-t">
                <button type="button" onClick={() => setShowEditModal(false)} className="px-4 py-2 border rounded-lg">Cancel</button>
                <button type="submit" className="px-5 py-2 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-lg shadow">Save Corrections</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
