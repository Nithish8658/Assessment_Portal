import React, { useState, useEffect } from 'react';
import apiClient from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { ExcelStudentImporter } from '../../components/users/ExcelStudentImporter';
import { RosterApprovalQueue } from '../../components/users/RosterApprovalQueue';
import { FileSpreadsheet, Edit3, UserPlus, Search, ShieldCheck, Trash2 } from 'lucide-react';

export const UserManagement: React.FC = () => {
  const { user, activeRole } = useAuth();
  const [activeTab, setActiveTab] = useState<'students' | 'faculty' | 'import' | 'excel-upload' | 'hod-approvals'>(
    activeRole === 'Class Tutor' ? 'excel-upload' : (activeRole === 'HoD' ? 'hod-approvals' : 'students')
  );
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
  const [departments, setDepartments] = useState<any[]>([]);
  const [programmes, setProgrammes] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [courses, setCourses] = useState<any[]>([]);
  const [addDeptId, setAddDeptId] = useState<number>(1);
  const [addProgId, setAddProgId] = useState<number>(1);
  const [addClassId, setAddClassId] = useState<number | ''>('');
  const [addCourseId, setAddCourseId] = useState<number | ''>('');
  const [addUsername, setAddUsername] = useState('');
  const [addFullName, setAddFullName] = useState('');
  const [addEmail, setAddEmail] = useState('');
  const [addPassword, setAddPassword] = useState('password123');
  const [addRole, setAddRole] = useState('Student');
  const [addSection, setAddSection] = useState('A');
  const [addBatch, setAddBatch] = useState('2023-2026');
  const [addProgCode, setAddProgCode] = useState('23BCA');
  const [addDesignation, setAddDesignation] = useState('Assistant Professor');
  const [addSemesterNum, setAddSemesterNum] = useState<number>(1);

  // Edit / Correct Details Modal State
  const [showEditModal, setShowEditModal] = useState(false);
  const [editUserId, setEditUserId] = useState<number | null>(null);
  const [editFullName, setEditFullName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editRegOrEmpId, setEditRegOrEmpId] = useState('');
  const [editSection, setEditSection] = useState('A');
  const [editBatch, setEditBatch] = useState('2025-2028');
  const [editSemesterNum, setEditSemesterNum] = useState<number>(3);
  const [editAssignedProgId, setEditAssignedProgId] = useState<number | null>(null);
  const [editRole, setEditRole] = useState('');
  const [editPassword, setEditPassword] = useState('');
  const [editIsActive, setEditIsActive] = useState(true);

  useEffect(() => {
    fetchUsers();
    apiClient.get('/master/departments').then(res => {
      setDepartments(res.data);
      if (res.data && res.data.length > 0) {
        if (activeRole === 'HoD' && user?.assigned_department_name) {
          const myDept = res.data.find((d: any) =>
            d.name.toLowerCase() === user.assigned_department_name?.toLowerCase() ||
            d.code.toLowerCase() === ((user as any).assigned_department_code || '').toLowerCase()
          );
          if (myDept) setAddDeptId(myDept.id);
          else setAddDeptId(res.data[0].id);
        } else {
          setAddDeptId(res.data[0].id);
        }
      }
    }).catch(() => { });

    apiClient.get('/master/programmes').then(res => {
      setProgrammes(res.data);
      if (res.data && res.data.length > 0) {
        const available = activeRole === 'HoD' && user?.assigned_department_name
          ? res.data.filter((p: any) => p.department_name?.toLowerCase() === user.assigned_department_name?.toLowerCase())
          : res.data;
        const first = available.length > 0 ? available[0] : res.data[0];
        setAddProgId(first.id);
        setAddProgCode(first.code);
      }
    }).catch(() => { });

    apiClient.get('/master/classes').then(res => {
      setClasses(res.data);
      if (activeRole === 'Class Tutor') {
        const myClass = res.data.find((c: any) =>
          (c.programme_code?.toLowerCase() === user?.assigned_programme_code?.toLowerCase() ||
            c.programme_name?.toLowerCase() === user?.assigned_programme_name?.toLowerCase()) &&
          (c.batch_name === user?.assigned_batch || !user?.assigned_batch) &&
          (c.section_name === user?.assigned_section || !user?.assigned_section)
        );
        if (myClass && myClass.semester_num) {
          setAddSemesterNum(myClass.semester_num);
        }
      }
    }).catch(() => { });

    apiClient.get('/master/courses').then(res => {
      setCourses(res.data);
    }).catch(() => { });

    // Role-specific modal defaults
    if (activeRole === 'HoD') {
      setAddRole('Faculty');
    } else if (activeRole === 'Class Tutor') {
      setAddRole('Student');
      if (user?.assigned_batch) {
        setAddBatch(user.assigned_batch);
        if (user.assigned_batch.includes('2026')) setAddSemesterNum(1);
        else if (user.assigned_batch.includes('2025')) setAddSemesterNum(3);
        else if (user.assigned_batch.includes('2024')) setAddSemesterNum(5);
        else setAddSemesterNum(1);
      }
      if (user?.assigned_section) setAddSection(user.assigned_section);
    }
  }, [activeRole, user?.assigned_department_name, user?.assigned_batch, user?.assigned_section, user?.assigned_programme_code, user?.assigned_programme_name]);

  const fetchUsers = () => {
    apiClient.get('/users/students').then(res => setStudents(res.data));
    apiClient.get('/users/faculty').then(res => setFaculty(res.data));
  };

  const handleCreateUserSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      let finalProgId = addProgId;
      let finalProgCode = addProgCode;
      let finalDeptId = addDeptId;
      let finalSection = addSection;
      let finalBatch = addBatch;

      if (activeRole === 'Class Tutor') {
        if (user?.assigned_programme_code) {
          finalProgCode = user.assigned_programme_code;
          const foundProg = programmes.find(p =>
            p.code?.toLowerCase() === user.assigned_programme_code?.toLowerCase() ||
            p.name?.toLowerCase() === user.assigned_programme_name?.toLowerCase()
          );
          if (foundProg) {
            finalProgId = foundProg.id;
            if (foundProg.department_id) finalDeptId = foundProg.department_id;
          }
        }
        if (user?.assigned_section) finalSection = user.assigned_section;
        if (user?.assigned_batch) finalBatch = user.assigned_batch;
      }

      await apiClient.post('/users', {
        username: addUsername,
        full_name: addFullName,
        email: addEmail,
        password: addPassword || 'password123',
        role_name: addRole,
        register_number_or_emp_id: addUsername,
        programme_id: finalProgId,
        programme_code: finalProgCode,
        department_id: finalDeptId,
        course_id: addCourseId ? Number(addCourseId) : null,
        section_name: finalSection,
        batch_name: finalBatch,
        semester_num: addRole === 'Student' ? addSemesterNum : undefined,
        assigned_programme_id: finalProgId,
        assigned_batch: finalBatch,
        assigned_section: finalSection,
        designation: addRole === 'HoD' ? 'Head of Department (HoD)' : (addRole === 'Class Tutor' ? 'Class Tutor' : (addRole === 'ERP Coordinator' ? 'ERP Coordinator' : (addRole === 'Assessment Coordinator' ? 'Assessment Coordinator' : (addRole === 'Administrator' ? 'Administrator' : addDesignation))))
      });
      setShowAddModal(false);
      setAddUsername('');
      setAddFullName('');
      setAddEmail('');
      setAddCourseId('');
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
    setEditSection(item.section_name || item.assigned_section || 'A');
    setEditBatch(item.batch_name || item.assigned_batch || '2025-2028');
    setEditSemesterNum(item.semester_num || (item.batch_name?.includes('2026') ? 1 : item.batch_name?.includes('2025') ? 3 : 5));
    setEditAssignedProgId(item.assigned_programme_id || item.programme_id || (programmes.length > 0 ? programmes[0].id : 1));
    setEditRole(isStudent ? 'Student' : (item.designation === 'Class Tutor' ? 'Class Tutor' : 'Faculty'));
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
        batch_name: editBatch,
        semester_num: editRole === 'Student' ? editSemesterNum : undefined,
        assigned_programme_id: editAssignedProgId || undefined,
        assigned_batch: editBatch,
        assigned_section: editSection,
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

  const handleDeleteUser = async (userId: number, name: string) => {
    if (!window.confirm(`Are you sure you want to remove user "${name}" from the system?`)) return;
    try {
      await apiClient.delete(`/users/${userId}`);
      fetchUsers();
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to remove user');
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
    } catch {
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

  // Check real-time duplicate tutor conflict during creation
  const addTutorConflict = addRole === 'Class Tutor' ? faculty.find((f: any) =>
    f.designation === 'Class Tutor' &&
    f.assigned_programme_id === addProgId &&
    (f.assigned_batch || '2023-2026') === addBatch &&
    (f.assigned_section || 'A') === addSection
  ) : null;

  // Check real-time duplicate tutor conflict during edit
  const editTutorConflict = editRole === 'Class Tutor' && editAssignedProgId ? faculty.find((f: any) =>
    (f.user_id !== editUserId && f.id !== editUserId) &&
    f.designation === 'Class Tutor' &&
    f.assigned_programme_id === editAssignedProgId &&
    (f.assigned_batch || '2023-2026') === editBatch &&
    (f.assigned_section || 'A') === editSection
  ) : null;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-[#2A2824] pb-4">
        <div>
          <h2 className="text-xl font-bold text-[#F8F5ED]">Institutional User Registry & Profile Correction</h2>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={() => setShowAddModal(true)}
            className="bg-[#C9A227] hover:bg-[#B89220] text-[#11110F] text-xs font-bold px-4 py-2.5 rounded-lg shadow-sm transition flex items-center space-x-2 cursor-pointer"
          >
            <UserPlus className="w-4 h-4" />
            <span>+ Add New User</span>
          </button>

          <div className="flex bg-[#141311] p-1 rounded-xl border border-[#2A2824] text-xs flex-wrap gap-1">
            <button
              onClick={() => setActiveTab('excel-upload')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition flex items-center space-x-1 cursor-pointer ${activeTab === 'excel-upload' ? 'bg-[#C9A227] text-[#11110F] font-bold shadow-sm' : 'text-[#9E988A] hover:text-[#F8F5ED]'}`}
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>Excel Student Upload (Class Tutor)</span>
            </button>

            {activeRole !== 'Class Tutor' && activeRole !== 'Faculty' && (
              <button
                onClick={() => setActiveTab('hod-approvals')}
                className={`px-3 py-1.5 rounded-lg font-semibold transition flex items-center space-x-1 cursor-pointer ${activeTab === 'hod-approvals' ? 'bg-[#C9A227] text-[#11110F] font-bold shadow-sm' : 'text-[#9E988A] hover:text-[#F8F5ED]'}`}
              >
                <ShieldCheck className="w-3.5 h-3.5 text-[#E3C766]" />
                <span>HoD Roster Approvals</span>
              </button>
            )}

            <button
              onClick={() => setActiveTab('students')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition cursor-pointer ${activeTab === 'students' ? 'bg-[#C9A227] text-[#11110F] font-bold shadow-sm' : 'text-[#9E988A] hover:text-[#F8F5ED]'}`}
            >
              Students ({students.length})
            </button>

            <button
              onClick={() => setActiveTab('faculty')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition cursor-pointer ${activeTab === 'faculty' ? 'bg-[#C9A227] text-[#11110F] font-bold shadow-sm' : 'text-[#9E988A] hover:text-[#F8F5ED]'}`}
            >
              Faculty ({faculty.length})
            </button>
          </div>
        </div>
      </div>

      {/* Search Input Filter */}
      {activeTab !== 'import' && (
        <div className="relative max-w-md">
          <Search className="w-4 h-4 text-[#9E988A] absolute left-3 top-3" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search candidate name, reg number, employee ID, email..."
            className="w-full bg-[#141311] border border-[#2A2824] text-[#F8F5ED] placeholder-[#9E988A]/60 rounded-xl pl-9 pr-4 py-2 text-xs focus:border-[#C9A227] outline-none shadow-sm"
          />
        </div>
      )}

      {/* Excel Student Roster Upload for Class Tutors */}
      {activeTab === 'excel-upload' && (
        <ExcelStudentImporter onSuccess={fetchUsers} />
      )}

      {/* HoD Roster Approval Queue */}
      {activeTab === 'hod-approvals' && activeRole !== 'Class Tutor' && activeRole !== 'Faculty' && (
        <RosterApprovalQueue />
      )}

      {/* Students Directory Table */}
      {activeTab === 'students' && (
        <div className="bg-[#1C1B18] rounded-xl border border-[#2A2824] shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-[#2A2824] bg-[#141311] flex justify-between items-center">
            <h3 className="font-bold text-sm text-[#F8F5ED]">Student Register Directory</h3>
            <span className="text-xs text-[#9E988A]">Showing {filteredStudents.length} Students</span>
          </div>
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-[#141311] text-[#9E988A] font-semibold border-b border-[#2A2824]">
                <th className="p-3">Register No</th>
                <th className="p-3">Student Name</th>
                <th className="p-3">Email Address</th>
                <th className="p-3">Programme</th>
                <th className="p-3">Batch / Sec</th>
                <th className="p-3">Login Password</th>
                <th className="p-3">Status</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#2A2824]">
              {filteredStudents.map((s) => (
                <tr key={s.id} className="hover:bg-[#24231F]">
                  <td className="p-3 font-mono font-bold text-[#C9A227]">{s.register_number}</td>
                  <td className="p-3 font-semibold text-[#F8F5ED]">{s.full_name}</td>
                  <td className="p-3 text-[#9E988A] font-mono text-[11px]">{s.email}</td>
                  <td className="p-3 text-[#D8D2C5]">{s.programme_name} ({s.programme_code})</td>
                  <td className="p-3 text-[#9E988A]">{s.batch_name} (Sec {s.section_name})</td>
                  <td className="p-3">
                    <span className="font-mono font-bold text-[#E3C766] bg-[#141311] px-2 py-1 rounded border border-[#2A2824] text-[11px]">
                      {s.allocated_password || 'student123'}
                    </span>
                  </td>
                  <td className="p-3">
                    <span className="bg-[#4ADE80]/15 text-[#4ADE80] border border-[#4ADE80]/30 px-2 py-0.5 rounded text-[11px] font-semibold">
                      {s.status}
                    </span>
                  </td>
                  <td className="p-3 text-right">
                    <div className="flex items-center justify-end space-x-1.5">
                      <button
                        onClick={() => openEditModal(s, true)}
                        className="px-2.5 py-1 bg-[#24231F] hover:bg-[#2E2C27] text-[#E3C766] border border-[#2A2824] font-bold text-[11px] rounded-lg transition flex items-center space-x-1 cursor-pointer"
                      >
                        <Edit3 className="w-3 h-3" />
                        <span>Edit</span>
                      </button>
                      <button
                        onClick={() => handleDeleteUser(s.user_id || s.id, s.full_name)}
                        className="px-2.5 py-1 bg-[#141311] hover:bg-[#EF4444]/10 text-[#EF4444] border border-[#EF4444]/30 font-bold text-[11px] rounded-lg transition flex items-center space-x-1 cursor-pointer"
                      >
                        <Trash2 className="w-3 h-3" />
                        <span>Remove</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Faculty Directory Table */}
      {activeTab === 'faculty' && (
        <div className="bg-[#1C1B18] rounded-xl border border-[#2A2824] shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-[#2A2824] bg-[#141311] flex justify-between items-center">
            <h3 className="font-bold text-sm text-[#F8F5ED]">Faculty Staff Directory</h3>
            <span className="text-xs text-[#9E988A]">Showing {filteredFaculty.length} Staff</span>
          </div>
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-[#141311] text-[#9E988A] font-semibold border-b border-[#2A2824]">
                <th className="p-3">Employee ID</th>
                <th className="p-3">Faculty Name</th>
                <th className="p-3">Email Address</th>
                <th className="p-3">Designation</th>
                <th className="p-3">Department</th>
                <th className="p-3">Status</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#2A2824]">
              {filteredFaculty.map((f) => (
                <tr key={f.id} className="hover:bg-[#24231F]">
                  <td className="p-3 font-mono font-bold text-[#C9A227]">{f.employee_id}</td>
                  <td className="p-3">
                    <div className="font-semibold text-[#F8F5ED]">{f.full_name}</div>
                    {f.assigned_class_display && (
                      <span className="inline-flex items-center space-x-1 bg-[#24231F] text-[#E3C766] border border-[#2A2824] px-2 py-0.5 rounded text-[10px] font-bold mt-0.5">
                        <span>Assigned Class: {f.assigned_class_display}</span>
                      </span>
                    )}
                  </td>
                  <td className="p-3 text-[#9E988A] font-mono text-[11px]">{f.email}</td>
                  <td className="p-3 text-[#D8D2C5]">
                    <span className={`px-2 py-0.5 rounded font-semibold text-[11px] ${f.designation === 'Class Tutor' ? 'bg-[#C9A227]/15 text-[#E3C766] border border-[#C9A227]/30' : 'bg-[#141311] text-[#D8D2C5] border border-[#2A2824]'}`}>
                      {f.designation}
                    </span>
                  </td>
                  <td className="p-3 text-[#D8D2C5]">{f.department_name}</td>
                  <td className="p-3">
                    <span className="bg-[#4ADE80]/15 text-[#4ADE80] border border-[#4ADE80]/30 px-2 py-0.5 rounded text-[11px] font-semibold">
                      {f.status}
                    </span>
                  </td>
                  <td className="p-3 text-right">
                    <div className="flex items-center justify-end space-x-1.5">
                      <button
                        onClick={() => openEditModal(f, false)}
                        className="px-2.5 py-1 bg-[#24231F] hover:bg-[#2E2C27] text-[#E3C766] border border-[#2A2824] font-bold text-[11px] rounded-lg transition flex items-center space-x-1 cursor-pointer"
                      >
                        <Edit3 className="w-3 h-3" />
                        <span>Edit</span>
                      </button>
                      <button
                        onClick={() => handleDeleteUser(f.user_id || f.id, f.full_name)}
                        className="px-2.5 py-1 bg-[#141311] hover:bg-[#EF4444]/10 text-[#EF4444] border border-[#EF4444]/30 font-bold text-[11px] rounded-lg transition flex items-center space-x-1 cursor-pointer"
                      >
                        <Trash2 className="w-3 h-3" />
                        <span>Remove</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* CSV Bulk Import Section */}
      {activeTab === 'import' && (
        <div className="bg-[#1C1B18] p-6 rounded-xl border border-[#2A2824] shadow-sm space-y-4">
          <div className="border-b border-[#2A2824] pb-3">
            <h3 className="font-bold text-sm text-[#F8F5ED]">Institutional User Roster CSV Import</h3>
            <p className="text-xs text-[#9E988A]">Bulk upload student candidate accounts or faculty staff profiles directly via CSV</p>
          </div>

          {uploadMsg && (
            <div className={`p-3 rounded-lg text-xs font-semibold ${uploadMsg.includes('failed') ? 'bg-[#141311] text-[#EF4444] border border-[#EF4444]/30' : 'bg-[#141311] text-[#4ADE80] border border-[#4ADE80]/30'}`}>
              {uploadMsg}
            </div>
          )}

          <form onSubmit={handleBulkImport} className="space-y-4 max-w-lg">
            <div>
              <label className="block text-xs font-semibold text-[#D8D2C5] mb-1">Target Account Type</label>
              <select
                value={importType}
                onChange={(e) => setImportType(e.target.value as 'student' | 'faculty')}
                className="w-full bg-[#141311] border border-[#2A2824] text-[#F8F5ED] focus:border-[#C9A227] outline-none rounded-lg px-3 py-2 text-xs font-medium"
              >
                <option value="student">Student Profiles Bulk Import</option>
                <option value="faculty">Faculty Profiles Bulk Import</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#D8D2C5] mb-1">Select CSV File</label>
              <input
                type="file"
                accept=".csv"
                onChange={(e) => setImportFile(e.target.files ? e.target.files[0] : null)}
                className="w-full border border-[#2A2824] bg-[#141311] rounded-lg p-2 text-xs text-[#F8F5ED]"
                required
              />
            </div>

            <div className="p-3 bg-[#141311] border border-[#2A2824] rounded-lg text-[11px] text-[#9E988A]">
              <strong className="block font-semibold text-[#F8F5ED] mb-1">CSV Template Format Required:</strong>
              <p className="font-mono text-[10px] text-[#D8D2C5]">username, email, full_name, mobile, programme_code, batch, semester, section</p>
            </div>

            <button
              type="submit"
              disabled={loading || !importFile}
              className="bg-[#C9A227] hover:bg-[#B89220] text-[#11110F] font-bold text-xs px-6 py-2.5 rounded-lg shadow-sm transition disabled:opacity-50 cursor-pointer"
            >
              {loading ? 'Processing Import...' : 'Confirm Bulk Import'}
            </button>
          </form>
        </div>
      )}

      {/* Add New User Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-[#11110F]/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-[#1C1B18] border border-[#2A2824] rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 text-xs">
            <div className="flex justify-between items-center border-b border-[#2A2824] pb-3">
              <h3 className="text-base font-bold text-[#F8F5ED] flex items-center space-x-2">
                <UserPlus className="w-5 h-5 text-[#C9A227]" />
                <span>+ Add New Institutional User</span>
              </h3>
              <button onClick={() => setShowAddModal(false)} className="text-[#9E988A] hover:text-[#F8F5ED] font-bold cursor-pointer">✕</button>
            </div>

            <form onSubmit={handleCreateUserSubmit} className="space-y-3">
              <div>
                <label className="block font-semibold text-[#D8D2C5] mb-1">Account Role</label>
                <select
                  value={addRole}
                  onChange={(e) => {
                    const r = e.target.value;
                    setAddRole(r);
                    if (r === 'Student') {
                      if (addBatch.includes('2026')) setAddSemesterNum(1);
                      else if (addBatch.includes('2025')) setAddSemesterNum(3);
                      else if (addBatch.includes('2024')) setAddSemesterNum(5);
                    }
                  }}
                  className="w-full bg-[#141311] border border-[#2A2824] text-[#F8F5ED] focus:border-[#C9A227] outline-none rounded-lg p-2 font-medium text-xs"
                >
                  {activeRole !== 'HoD' && (
                    <option value="Student">Student Candidate</option>
                  )}
                  <option value="Faculty">Faculty Instructor</option>

                  {(activeRole === 'Administrator' || activeRole === 'HoD') && (
                    <option value="Class Tutor">Class Tutor</option>
                  )}

                  {activeRole === 'Administrator' && (
                    <>
                      <option value="HoD">Head of Department (HoD)</option>
                      <option value="ERP Coordinator">ERP Coordinator</option>
                      <option value="Assessment Coordinator">Assessment Coordinator</option>
                      <option value="Administrator">Administrator</option>
                    </>
                  )}
                </select>
              </div>

              {/* Class Tutor Student Auto-Inherit Information Banner */}
              {activeRole === 'Class Tutor' && addRole === 'Student' && (
                <div className="bg-[#141311] border border-[#2A2824] rounded-xl p-3 text-xs space-y-2 shadow-sm">
                  <div className="font-bold text-[#E3C766] flex items-center space-x-1.5 text-xs">
                    <ShieldCheck className="w-4 h-4 text-[#C9A227]" />
                    <span>Auto-Assigned to Your Class Roster</span>
                  </div>
                  <div className="text-[#9E988A] text-[11px] flex flex-wrap gap-x-3 gap-y-0.5 pt-0.5">
                    <span><strong className="text-[#D8D2C5]">Class:</strong> {user?.assigned_class_name || user?.assigned_programme_name || 'Assigned Class'}</span>
                    <span><strong className="text-[#D8D2C5]">Programme:</strong> {user?.assigned_programme_code || user?.assigned_programme_name || 'B.COM IT'}</span>
                    <span><strong className="text-[#D8D2C5]">Section:</strong> Section {user?.assigned_section || 'A'}</span>
                    <span><strong className="text-[#D8D2C5]">Batch:</strong> {user?.assigned_batch || '2025-2028'}</span>
                    <span><strong className="text-[#D8D2C5]">Semester:</strong> Semester {addSemesterNum}</span>
                  </div>
                </div>
              )}

              {/* Semester Selection for Student Candidate Creation (Only for Administrator) */}
              {activeRole !== 'Class Tutor' && addRole === 'Student' && (
                <div>
                  <label className="block font-semibold text-[#D8D2C5] mb-1">
                    Academic Semester <span className="text-[#EF4444]">*</span>
                  </label>
                  <select
                    value={addSemesterNum}
                    onChange={(e) => setAddSemesterNum(Number(e.target.value))}
                    className="w-full bg-[#141311] border border-[#2A2824] text-[#F8F5ED] focus:border-[#C9A227] outline-none rounded-lg p-2 font-medium text-xs"
                    required
                  >
                    <option value={1}>Semester 1 (1st Year - Odd)</option>
                    <option value={2}>Semester 2 (1st Year - Even)</option>
                    <option value={3}>Semester 3 (2nd Year - Odd)</option>
                    <option value={4}>Semester 4 (2nd Year - Even)</option>
                    <option value={5}>Semester 5 (3rd Year - Odd)</option>
                    <option value={6}>Semester 6 (3rd Year - Even)</option>
                  </select>
                </div>
              )}

              {/* For Class Tutor adding Faculty: Target Course Selection option */}
              {activeRole === 'Class Tutor' && addRole === 'Faculty' ? (
                <div>
                  <label className="block font-semibold text-[#D8D2C5] mb-1">
                    Target Course Selection <span className="text-[#EF4444]">*</span>
                  </label>
                  <select
                    value={addCourseId}
                    onChange={(e) => {
                      const cid = e.target.value ? Number(e.target.value) : '';
                      setAddCourseId(cid);
                      if (cid) {
                        const selectedCourse = courses.find((c: any) => c.id === cid);
                        if (selectedCourse) {
                          if (selectedCourse.department_id) setAddDeptId(selectedCourse.department_id);
                          if (selectedCourse.programme_id) setAddProgId(selectedCourse.programme_id);
                          if (selectedCourse.programme_code) setAddProgCode(selectedCourse.programme_code);
                        }
                      }
                    }}
                    className="w-full bg-[#141311] border border-[#2A2824] text-[#F8F5ED] focus:border-[#C9A227] outline-none rounded-lg p-2 font-medium text-xs"
                    required
                  >
                    <option value="">-- Select Target Course for {user?.assigned_programme_name || user?.assigned_class_name || 'Assigned Programme'} --</option>
                    {courses
                      .filter((c: any) => {
                        if (user?.assigned_programme_code) {
                          return (
                            c.programme_code?.toLowerCase() === user.assigned_programme_code?.toLowerCase() ||
                            c.programme_name?.toLowerCase() === user.assigned_programme_name?.toLowerCase()
                          );
                        }
                        return true;
                      })
                      .map((c: any) => (
                        <option key={c.id} value={c.id}>
                          {c.code} — {c.title} (Sem {c.semester_num} • {c.credits} Credits)
                        </option>
                      ))}
                  </select>
                </div>
              ) : activeRole === 'Administrator' ? (
                <div>
                  <label className="block font-semibold text-[#D8D2C5] mb-1">Target Department</label>
                  <select
                    value={addDeptId}
                    onChange={(e) => {
                      const did = Number(e.target.value);
                      setAddDeptId(did);
                      const progsInDept = programmes.filter(p => p.department_id === did);
                      if (progsInDept.length > 0) {
                        setAddProgId(progsInDept[0].id);
                        setAddProgCode(progsInDept[0].code);
                        const classesInProg = classes.filter(c => c.programme_id === progsInDept[0].id);
                        if (classesInProg.length > 0) {
                          setAddClassId(classesInProg[0].id);
                          setAddSection(classesInProg[0].section_name || 'A');
                          setAddBatch(classesInProg[0].batch_name || '2023-2026');
                        } else {
                          setAddClassId('');
                        }
                      }
                    }}
                    className="w-full bg-[#141311] border border-[#2A2824] text-[#F8F5ED] focus:border-[#C9A227] outline-none rounded-lg p-2 font-medium text-xs"
                  >
                    {departments.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.code} — {d.name}
                      </option>
                    ))}
                  </select>
                </div>
              ) : null}

              {/* Degree Programme Selector */}
              {activeRole !== 'Class Tutor' && (addRole === 'Class Tutor' || addRole === 'Student') && (
                <div>
                  <label className="block font-semibold text-[#D8D2C5] mb-1">
                    {addRole === 'Class Tutor' ? 'Degree Programme *' : 'Enrolled Programme *'}
                  </label>
                  <select
                    value={addProgId}
                    onChange={(e) => {
                      const pid = Number(e.target.value);
                      setAddProgId(pid);
                      const found = programmes.find(p => p.id === pid);
                      if (found) {
                        setAddProgCode(found.code);
                        if (found.department_id) setAddDeptId(found.department_id);
                      }
                      const matchingClasses = classes.filter(c => c.programme_id === pid);
                      if (matchingClasses.length > 0) {
                        setAddClassId(matchingClasses[0].id);
                        setAddSection(matchingClasses[0].section_name || 'A');
                        setAddBatch(matchingClasses[0].batch_name || '2023-2026');
                      } else {
                        setAddClassId('');
                      }
                    }}
                    className="w-full bg-[#141311] border border-[#2A2824] text-[#F8F5ED] focus:border-[#C9A227] outline-none rounded-lg p-2 font-medium text-xs"
                    required
                  >
                    {programmes
                      .filter((p: any) => {
                        if (activeRole === 'HoD' && user?.assigned_department_name) {
                          return p.department_name?.toLowerCase() === user.assigned_department_name?.toLowerCase();
                        }
                        if (activeRole === 'Administrator' && addDeptId) {
                          return p.department_id === addDeptId;
                        }
                        return true;
                      })
                      .map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.code} — {p.name}
                        </option>
                      ))}
                  </select>
                </div>
              )}

              {/* Assigned Academic Class Selector */}
              {activeRole !== 'Class Tutor' && (addRole === 'Class Tutor' || addRole === 'Student') && (
                <div>
                  <label className="block font-semibold text-[#D8D2C5] mb-1">
                    {addRole === 'Class Tutor' ? 'Assigned Academic Class *' : 'Target Academic Class *'}
                  </label>
                  <select
                    value={addClassId}
                    onChange={(e) => {
                      const cid = e.target.value ? Number(e.target.value) : '';
                      setAddClassId(cid);
                      if (cid) {
                        const foundClass = classes.find(c => c.id === cid);
                        if (foundClass) {
                          setAddSection(foundClass.section_name || 'A');
                          setAddBatch(foundClass.batch_name || '2023-2026');
                        }
                      }
                    }}
                    className="w-full bg-[#141311] border border-[#2A2824] text-[#F8F5ED] focus:border-[#C9A227] outline-none rounded-lg p-2 font-medium text-xs"
                    required={addRole === 'Class Tutor'}
                  >
                    <option value="">-- Select Academic Class --</option>
                    {classes
                      .filter((c: any) => c.programme_id === addProgId)
                      .map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.class_name || c.class_code} ({c.batch_name} • Sec {c.section_name} • Sem {c.semester_num})
                        </option>
                      ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block font-semibold text-[#D8D2C5] mb-1">
                  {addRole === 'Student' ? 'Register Number (Username) *' : 'Staff ID / Employee ID (Username) *'}
                </label>
                <input
                  type="text"
                  value={addUsername}
                  onChange={(e) => setAddUsername(e.target.value)}
                  placeholder={addRole === 'Student' ? 'e.g. 25UGCI053' : 'e.g. CS-FAC-99'}
                  className="w-full bg-[#141311] border border-[#2A2824] text-[#F8F5ED] placeholder-[#9E988A]/60 focus:border-[#C9A227] outline-none rounded-lg p-2 font-mono"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold text-[#D8D2C5] mb-1">Full Name *</label>
                <input
                  type="text"
                  value={addFullName}
                  onChange={(e) => setAddFullName(e.target.value)}
                  placeholder="e.g. Anand Sharma"
                  className="w-full bg-[#141311] border border-[#2A2824] text-[#F8F5ED] placeholder-[#9E988A]/60 focus:border-[#C9A227] outline-none rounded-lg p-2 font-medium"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold text-[#D8D2C5] mb-1">Email Address *</label>
                <input
                  type="email"
                  value={addEmail}
                  onChange={(e) => setAddEmail(e.target.value)}
                  placeholder="anand@nasc.edu.in"
                  className="w-full bg-[#141311] border border-[#2A2824] text-[#F8F5ED] placeholder-[#9E988A]/60 focus:border-[#C9A227] outline-none rounded-lg p-2 font-mono"
                  required
                />
              </div>

              <div className={(activeRole !== 'Class Tutor' && addRole === 'Faculty') ? "grid grid-cols-2 gap-2" : ""}>
                <div>
                  <label className="block font-semibold text-[#D8D2C5] mb-1">Initial Password *</label>
                  <input
                    type="text"
                    value={addPassword}
                    onChange={(e) => setAddPassword(e.target.value)}
                    className="w-full bg-[#141311] border border-[#2A2824] text-[#F8F5ED] focus:border-[#C9A227] outline-none rounded-lg p-2 font-mono"
                    required
                  />
                </div>
                {activeRole !== 'Class Tutor' && addRole === 'Faculty' && (
                  <div>
                    <label className="block font-semibold text-[#D8D2C5] mb-1">
                      Section
                    </label>
                    <select
                      value={addSection}
                      onChange={(e) => setAddSection(e.target.value)}
                      className="w-full bg-[#141311] border border-[#2A2824] text-[#F8F5ED] focus:border-[#C9A227] outline-none rounded-lg p-2 font-medium text-xs"
                    >
                      <option value="A">Section A</option>
                      <option value="B">Section B</option>
                      <option value="C">Section C</option>
                    </select>
                  </div>
                )}
              </div>

              {/* Duplicate Class Tutor Conflict Warning Banner for Add Modal */}
              {addRole === 'Class Tutor' && addTutorConflict && (
                <div className="bg-[#141311] border border-[#EF4444]/40 rounded-xl p-3 text-xs text-[#EF4444] flex items-start space-x-2.5 shadow-sm">
                  <div>
                    <strong className="block font-bold text-[#EF4444] text-xs">Duplicate Class Tutor Conflict</strong>
                    <p className="text-[11px] text-[#D8D2C5] mt-0.5">
                      Faculty <strong>{addTutorConflict.full_name}</strong> (ID: <code className="font-mono font-bold text-[#C9A227]">{addTutorConflict.employee_id}</code>) is already assigned as Class Tutor for this class.
                    </p>
                  </div>
                </div>
              )}

              <div className="flex justify-end space-x-3 pt-3 border-t border-[#2A2824]">
                <button type="button" onClick={() => setShowAddModal(false)} className="px-4 py-2 border border-[#2A2824] rounded-lg text-[#9E988A] hover:bg-[#24231F] cursor-pointer">Cancel</button>
                <button
                  type="submit"
                  disabled={Boolean(addRole === 'Class Tutor' && addTutorConflict)}
                  className={`px-5 py-2 text-[#11110F] font-bold rounded-lg shadow transition cursor-pointer ${
                    addRole === 'Class Tutor' && addTutorConflict
                      ? 'bg-[#24231F] text-[#9E988A] cursor-not-allowed opacity-60'
                      : 'bg-[#C9A227] hover:bg-[#B89220]'
                  }`}
                >
                  Create User
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit / Correct Details Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-[#11110F]/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-[#1C1B18] border border-[#2A2824] rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 text-xs">
            <div className="flex justify-between items-center border-b border-[#2A2824] pb-3">
              <h3 className="text-base font-bold text-[#F8F5ED] flex items-center space-x-2">
                <Edit3 className="w-5 h-5 text-[#C9A227]" />
                <span>Correct & Edit User Details</span>
              </h3>
              <button onClick={() => setShowEditModal(false)} className="text-[#9E988A] hover:text-[#F8F5ED] font-bold cursor-pointer">✕</button>
            </div>

            <form onSubmit={handleEditUserSubmit} className="space-y-3">
              <div>
                <label className="block font-semibold text-[#D8D2C5] mb-1">Full Name (Spelling Correction)</label>
                <input
                  type="text"
                  value={editFullName}
                  onChange={(e) => setEditFullName(e.target.value)}
                  className="w-full bg-[#141311] border border-[#2A2824] text-[#F8F5ED] focus:border-[#C9A227] outline-none rounded-lg p-2 font-medium"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold text-[#D8D2C5] mb-1">Email Address</label>
                <input
                  type="email"
                  value={editEmail}
                  onChange={(e) => setEditEmail(e.target.value)}
                  className="w-full bg-[#141311] border border-[#2A2824] text-[#F8F5ED] focus:border-[#C9A227] outline-none rounded-lg p-2 font-mono"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-semibold text-[#D8D2C5] mb-1">Register No / Staff ID</label>
                  <input
                    type="text"
                    value={editRegOrEmpId}
                    onChange={(e) => setEditRegOrEmpId(e.target.value)}
                    className="w-full bg-[#141311] border border-[#2A2824] text-[#F8F5ED] focus:border-[#C9A227] outline-none rounded-lg p-2 font-mono"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-[#D8D2C5] mb-1">Assigned Section</label>
                  <select
                    value={editSection}
                    onChange={(e) => setEditSection(e.target.value)}
                    className="w-full bg-[#141311] border border-[#2A2824] text-[#F8F5ED] focus:border-[#C9A227] outline-none rounded-lg p-2 font-medium text-xs"
                  >
                    <option value="A">Section A</option>
                    <option value="B">Section B</option>
                    <option value="C">Section C</option>
                  </select>
                </div>
              </div>

              {/* Semester Editing for Students */}
              {editRole === 'Student' && (
                <div>
                  <label className="block font-semibold text-[#D8D2C5] mb-1">Academic Semester</label>
                  <select
                    value={editSemesterNum}
                    onChange={(e) => setEditSemesterNum(Number(e.target.value))}
                    className="w-full bg-[#141311] border border-[#2A2824] text-[#F8F5ED] focus:border-[#C9A227] outline-none rounded-lg p-2 font-medium text-xs"
                  >
                    <option value={1}>Semester 1 (1st Year - Odd)</option>
                    <option value={2}>Semester 2 (1st Year - Even)</option>
                    <option value={3}>Semester 3 (2nd Year - Odd)</option>
                    <option value={4}>Semester 4 (2nd Year - Even)</option>
                    <option value={5}>Semester 5 (3rd Year - Odd)</option>
                    <option value={6}>Semester 6 (3rd Year - Even)</option>
                  </select>
                </div>
              )}

              {/* Class Tutor Specific Programme & Batch Adjustment */}
              {editRole === 'Class Tutor' && (
                <div className="p-3 bg-[#141311] border border-[#2A2824] rounded-xl space-y-2">
                  <div className="font-bold text-[#E3C766] text-xs">Class Tutor Assignment Details:</div>
                  <div>
                    <label className="block font-semibold text-[#D8D2C5] mb-0.5">Assigned Degree Programme</label>
                    <select
                      value={editAssignedProgId || ''}
                      onChange={(e) => setEditAssignedProgId(Number(e.target.value))}
                      className="w-full bg-[#1C1B18] border border-[#2A2824] text-[#F8F5ED] focus:border-[#C9A227] outline-none rounded-lg p-2 font-medium text-xs"
                    >
                      {programmes.map((p) => (
                        <option key={p.id} value={p.id}>{p.code} — {p.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block font-semibold text-[#D8D2C5] mb-0.5">Batch Year</label>
                    <select
                      value={editBatch}
                      onChange={(e) => setEditBatch(e.target.value)}
                      className="w-full bg-[#1C1B18] border border-[#2A2824] text-[#F8F5ED] focus:border-[#C9A227] outline-none rounded-lg p-2 font-medium text-xs"
                    >
                      <option value="2023-2026">2023-2026</option>
                      <option value="2024-2027">2024-2027</option>
                      <option value="2025-2028">2025-2028</option>
                      <option value="2026-2029">2026-2029</option>
                    </select>
                  </div>
                </div>
              )}

              {/* Duplicate Class Tutor Warning for Edit Modal */}
              {editRole === 'Class Tutor' && editTutorConflict && (
                <div className="bg-[#141311] border border-[#EF4444]/40 rounded-xl p-3 text-xs text-[#EF4444] flex items-start space-x-2.5 shadow-sm">
                  <div>
                    <strong className="block font-bold text-[#EF4444] text-xs">Duplicate Class Tutor Conflict</strong>
                    <p className="text-[11px] text-[#D8D2C5] mt-0.5">
                      Faculty <strong>{editTutorConflict.full_name}</strong> is already assigned as Class Tutor for this class.
                    </p>
                  </div>
                </div>
              )}

              <div>
                <label className="block font-semibold text-[#D8D2C5] mb-1">Reset Password (Optional)</label>
                <input
                  type="password"
                  value={editPassword}
                  onChange={(e) => setEditPassword(e.target.value)}
                  placeholder="Leave blank to keep unchanged"
                  className="w-full bg-[#141311] border border-[#2A2824] text-[#F8F5ED] focus:border-[#C9A227] outline-none rounded-lg p-2 font-mono"
                />
              </div>

              <div className="flex justify-end space-x-3 pt-3 border-t border-[#2A2824]">
                <button type="button" onClick={() => setShowEditModal(false)} className="px-4 py-2 border border-[#2A2824] rounded-lg text-[#9E988A] hover:bg-[#24231F] cursor-pointer">Cancel</button>
                <button
                  type="submit"
                  disabled={Boolean(editRole === 'Class Tutor' && editTutorConflict)}
                  className={`px-5 py-2 text-[#11110F] font-bold rounded-lg shadow transition cursor-pointer ${
                    editRole === 'Class Tutor' && editTutorConflict
                      ? 'bg-[#24231F] text-[#9E988A] cursor-not-allowed opacity-60'
                      : 'bg-[#C9A227] hover:bg-[#B89220]'
                  }`}
                >
                  Save Corrections
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
