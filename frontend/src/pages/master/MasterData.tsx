import React, { useState, useEffect } from 'react';
import apiClient from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { Department, Programme, Course, AcademicClass } from '../../types';
import { Building2, BookOpen, Layers, Plus, Trash2, Users, Edit3, AlertCircle } from 'lucide-react';

export const MasterData: React.FC = () => {
  const { user, activeRole } = useAuth();
  const [activeTab, setActiveTab] = useState<'departments' | 'programmes' | 'classes' | 'courses' | 'allocations'>(
    activeRole === 'Administrator' ? 'departments' : (activeRole === 'Class Tutor' ? 'courses' : 'programmes')
  );
  const [departments, setDepartments] = useState<Department[]>([]);
  const [programmes, setProgrammes] = useState<Programme[]>([]);
  const [classes, setClasses] = useState<AcademicClass[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [allocations, setAllocations] = useState<any[]>([]);
  const [faculties, setFaculties] = useState<any[]>([]);
  const [selectedDeptFilter, setSelectedDeptFilter] = useState<number | 'all'>('all');
  const [selectedProgFilter, setSelectedProgFilter] = useState<number | 'all'>('all');
  const [selectedClassFilter, setSelectedClassFilter] = useState<number | 'all'>('all');
  const [courseSemFilter, setCourseSemFilter] = useState<'class-sem' | 'all'>('class-sem');

  // Edit States
  const [editingDept, setEditingDept] = useState<Department | null>(null);
  const [editingProg, setEditingProg] = useState<Programme | null>(null);
  const [editingClass, setEditingClass] = useState<AcademicClass | null>(null);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const [editingAlloc, setEditingAlloc] = useState<any | null>(null);

  // Add Department Modal (Admin Only)
  const [showAddDeptModal, setShowAddDeptModal] = useState(false);
  const [newDeptCode, setNewDeptCode] = useState('');
  const [newDeptName, setNewDeptName] = useState('');
  const [newDeptHodId, setNewDeptHodId] = useState<number | ''>('');

  // Add Degree Programme Modal (Admin, HoD, ERP Coordinator)
  const [showAddProgModal, setShowAddProgModal] = useState(false);
  const [newProgCode, setNewProgCode] = useState('');
  const [newProgName, setNewProgName] = useState('');
  const [newProgDegree, setNewProgDegree] = useState('UG');
  const [newProgDeptId, setNewProgDeptId] = useState<number>(1);
  const [newProgDuration, setNewProgDuration] = useState(3);

  // Add Class Modal (Admin, HoD, ERP Coordinator)
  const [showAddClassModal, setShowAddClassModal] = useState(false);
  const [newClassCode, setNewClassCode] = useState('');
  const [newClassName, setNewClassName] = useState('');
  const [newClassProgId, setNewClassProgId] = useState<number>(1);
  const [newClassBatch, setNewClassBatch] = useState('2023-2026');
  const [newClassSemester, setNewClassSemester] = useState(4);
  const [newClassSection, setNewClassSection] = useState('A');
  const [newClassTutorId, setNewClassTutorId] = useState<number | ''>('');

  // Add Course Modal (Admin, HoD, ERP Coordinator)
  const [showAddCourseModal, setShowAddCourseModal] = useState(false);
  const [newCourseCode, setNewCourseCode] = useState('');
  const [newCourseTitle, setNewCourseTitle] = useState('');
  const [newCourseType, setNewCourseType] = useState('Theory');
  const [newCourseCredits, setNewCourseCredits] = useState(4.0);
  const [newCourseSemester, setNewCourseSemester] = useState(1);
  const [newCourseRegulation, setNewCourseRegulation] = useState('2023');
  const [newCourseProgId, setNewCourseProgId] = useState<number>(1);
  const [newCourseFacultyId, setNewCourseFacultyId] = useState<number | ''>('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const res = await apiClient.get('/master/bundle');
      const { departments: depts, programmes: progs, classes: cls, courses: crs, allocations: allocs, faculties: facs } = res.data;

      if (depts) {
        setDepartments(depts);
        if (depts.length > 0) {
          if (activeRole === 'HoD') {
            const myDept = depts.find((d: any) =>
              (user?.assigned_department_id && d.id === user.assigned_department_id) ||
              (user?.assigned_department_name && d.name?.toLowerCase() === user.assigned_department_name?.toLowerCase()) ||
              (user?.faculty_id && d.hod_id === user.faculty_id)
            ) || depts[0];
            if (myDept) {
              setSelectedDeptFilter(myDept.id);
              setNewProgDeptId(myDept.id);
            }
          } else {
            setNewProgDeptId(depts[0].id);
          }
        }
      }

      if (progs) {
        setProgrammes(progs);
        if (progs.length > 0) {
          setNewCourseProgId(progs[0].id);
          setNewClassProgId(progs[0].id);
        }
        if (activeRole === 'Class Tutor' && user?.assigned_programme_code) {
          const myProg = progs.find((p: any) =>
            p.code.toLowerCase() === user.assigned_programme_code?.toLowerCase() ||
            p.name.toLowerCase() === user.assigned_programme_name?.toLowerCase()
          );
          if (myProg) {
            setSelectedProgFilter(myProg.id);
            setSelectedDeptFilter(myProg.department_id);
          }
        }
      }

      if (cls) {
        setClasses(cls);
        if (activeRole === 'Class Tutor' && user?.assigned_batch) {
          const myClass = cls.find((c: any) =>
            c.batch_name === user.assigned_batch &&
            (!user.assigned_section || c.section_name?.toUpperCase() === user.assigned_section?.toUpperCase())
          );
          if (myClass) {
            setSelectedClassFilter(myClass.id);
          }
        }
      }

      if (crs) setCourses(crs);
      if (allocs) setAllocations(allocs);
      if (facs) setFaculties(facs);
    } catch {
      apiClient.get('/master/departments').then(res => setDepartments(res.data)).catch(() => {});
      apiClient.get('/master/programmes').then(res => setProgrammes(res.data)).catch(() => {});
      apiClient.get('/master/classes').then(res => setClasses(res.data)).catch(() => {});
      apiClient.get('/master/courses').then(res => setCourses(res.data)).catch(() => {});
      apiClient.get('/master/allocations').then(res => setAllocations(res.data)).catch(() => {});
      apiClient.get('/users/faculty').then(res => setFaculties(res.data)).catch(() => {});
    }
  };

  // --- CREATE HANDLERS ---
  const handleCreateDepartment = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiClient.post('/master/departments', {
        code: newDeptCode.toUpperCase().trim(),
        name: newDeptName.trim(),
        school_id: 1,
        hod_id: newDeptHodId ? Number(newDeptHodId) : null
      });
      setShowAddDeptModal(false);
      setNewDeptCode('');
      setNewDeptName('');
      setNewDeptHodId('');
      fetchData();
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to create department');
    }
  };

  const handleCreateProgramme = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      let deptIdToUse = newProgDeptId;
      if (activeRole === 'HoD' && user?.assigned_department_name) {
        const myDept = departments.find((d: any) =>
          d.name.toLowerCase() === user.assigned_department_name?.toLowerCase() ||
          d.code.toLowerCase() === ((user as any).assigned_department_code || '').toLowerCase()
        );
        if (myDept) deptIdToUse = myDept.id;
      }

      await apiClient.post('/master/programmes', {
        code: newProgCode.toUpperCase().trim(),
        name: newProgName.trim(),
        degree_type: newProgDegree,
        department_id: deptIdToUse,
        duration_years: Number(newProgDuration)
      });
      setShowAddProgModal(false);
      setNewProgCode('');
      setNewProgName('');
      fetchData();
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to create degree programme');
    }
  };

  const handleCreateClass = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiClient.post('/master/classes', {
        class_code: newClassCode.toUpperCase().trim(),
        name: newClassName.trim(),
        programme_id: Number(newClassProgId),
        batch_name: newClassBatch.trim(),
        semester_num: Number(newClassSemester),
        section_name: newClassSection.trim().toUpperCase(),
        tutor_id: newClassTutorId ? Number(newClassTutorId) : null
      });
      setShowAddClassModal(false);
      setNewClassCode('');
      setNewClassName('');
      setNewClassTutorId('');
      fetchData();
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to create class');
    }
  };

  const handleCreateCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiClient.post('/master/courses', {
        code: newCourseCode.toUpperCase().trim(),
        title: newCourseTitle.trim(),
        course_type: newCourseType,
        credits: Number(newCourseCredits),
        semester_num: Number(newCourseSemester),
        regulation: newCourseRegulation.trim() || '2023',
        programme_id: Number(newCourseProgId),
        faculty_id: newCourseFacultyId ? Number(newCourseFacultyId) : null
      });
      setShowAddCourseModal(false);
      setNewCourseCode('');
      setNewCourseTitle('');
      setNewCourseFacultyId('');
      fetchData();
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to create course');
    }
  };

  // --- UPDATE HANDLERS ---
  const handleUpdateDepartment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingDept) return;
    try {
      await apiClient.put(`/master/departments/${editingDept.id}`, {
        code: editingDept.code.toUpperCase().trim(),
        name: editingDept.name.trim(),
        hod_id: editingDept.hod_id ? Number(editingDept.hod_id) : null
      });
      setEditingDept(null);
      fetchData();
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to update department');
    }
  };

  const handleUpdateProgramme = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProg) return;
    try {
      await apiClient.put(`/master/programmes/${editingProg.id}`, {
        code: editingProg.code.toUpperCase().trim(),
        name: editingProg.name.trim(),
        degree_type: editingProg.degree_type,
        department_id: Number(editingProg.department_id),
        duration_years: Number(editingProg.duration_years)
      });
      setEditingProg(null);
      fetchData();
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to update degree programme');
    }
  };

  const handleUpdateClass = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingClass) return;
    try {
      await apiClient.put(`/master/classes/${editingClass.id}`, {
        class_code: editingClass.class_code.toUpperCase().trim(),
        name: editingClass.name.trim(),
        programme_id: Number(editingClass.programme_id),
        batch_name: editingClass.batch_name.trim(),
        semester_num: Number(editingClass.semester_num),
        section_name: editingClass.section_name.trim().toUpperCase(),
        tutor_id: editingClass.tutor_id ? Number(editingClass.tutor_id) : null
      });
      setEditingClass(null);
      fetchData();
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to update class');
    }
  };

  const handleUpdateCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCourse) return;
    try {
      await apiClient.put(`/master/courses/${editingCourse.id}`, {
        code: editingCourse.code.toUpperCase().trim(),
        title: editingCourse.title.trim(),
        course_type: editingCourse.course_type,
        credits: Number(editingCourse.credits),
        semester_num: Number(editingCourse.semester_num),
        regulation: editingCourse.regulation || '2023',
        programme_id: Number(editingCourse.programme_id),
        faculty_id: (editingCourse as any).faculty_id !== undefined ? ((editingCourse as any).faculty_id ? Number((editingCourse as any).faculty_id) : null) : (editingCourse.allocated_faculty && editingCourse.allocated_faculty[0] ? Number(editingCourse.allocated_faculty[0].id) : null)
      });
      setEditingCourse(null);
      fetchData();
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to update course');
    }
  };

  const handleUpdateAllocation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingAlloc) return;
    try {
      await apiClient.put(`/master/allocations/${editingAlloc.id}`, {
        faculty_id: Number(editingAlloc.faculty_id),
        course_id: Number(editingAlloc.course_id),
        academic_year: editingAlloc.academic_year,
        semester_num: Number(editingAlloc.semester_num),
        section_name: editingAlloc.section_name,
        batch_name: editingAlloc.batch_name
      });
      setEditingAlloc(null);
      fetchData();
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to update allocation');
    }
  };

  // --- DELETE HANDLERS ---
  const handleDeleteDepartment = async (deptId: number, deptName: string) => {
    if (!window.confirm(`Are you sure you want to remove Department "${deptName}" from the database?`)) return;
    try {
      await apiClient.delete(`/master/departments/${deptId}`);
      fetchData();
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to delete department');
    }
  };

  const handleDeleteProgramme = async (id: number, name: string) => {
    if (!window.confirm(`Are you sure you want to remove Programme "${name}"?`)) return;
    try {
      await apiClient.delete(`/master/programmes/${id}`);
      fetchData();
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to delete programme');
    }
  };

  const handleDeleteClass = async (id: number, name: string) => {
    if (!window.confirm(`Are you sure you want to remove Class "${name}"?`)) return;
    try {
      await apiClient.delete(`/master/classes/${id}`);
      fetchData();
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to delete class');
    }
  };

  const handleDeleteCourse = async (id: number, title: string) => {
    if (!window.confirm(`Are you sure you want to remove Course "${title}"?`)) return;
    try {
      await apiClient.delete(`/master/courses/${id}`);
      fetchData();
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to delete course');
    }
  };

  const handleDeleteAllocation = async (id: number) => {
    if (!window.confirm('Are you sure you want to remove this course allocation?')) return;
    try {
      await apiClient.delete(`/master/allocations/${id}`);
      fetchData();
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to delete allocation');
    }
  };

  const handleDeptFilterChange = (deptId: number | 'all') => {
    setSelectedDeptFilter(deptId);
    setSelectedProgFilter('all');
    setSelectedClassFilter('all');
  };

  const filteredProgrammes = programmes.filter(p => {
    const deptMatch = selectedDeptFilter === 'all' || p.department_id === selectedDeptFilter;
    const progMatch = selectedProgFilter === 'all' || p.id === selectedProgFilter;
    return deptMatch && progMatch;
  });

  const filteredClasses = classes.filter(c => {
    const deptMatch = selectedDeptFilter === 'all' || c.department_id === selectedDeptFilter;
    const progMatch = selectedProgFilter === 'all' || c.programme_id === selectedProgFilter;
    const classMatch = selectedClassFilter === 'all' || c.id === selectedClassFilter;
    return deptMatch && progMatch && classMatch;
  });

  const selectedClass = selectedClassFilter === 'all'
    ? null
    : classes.find(c => c.id === selectedClassFilter);

  const filteredCourses = courses.filter(c => {
    const deptMatch = selectedDeptFilter === 'all' ||
      (c as any).department_id === selectedDeptFilter ||
      programmes.some(p => p.id === c.programme_id && p.department_id === selectedDeptFilter);
    const progMatch = selectedProgFilter === 'all' || c.programme_id === selectedProgFilter;

    if (selectedClass) {
      const classSemMatch = courseSemFilter === 'all' || c.semester_num === selectedClass.semester_num;
      return deptMatch && progMatch && classSemMatch;
    }

    return deptMatch && progMatch;
  });

  return (
    <div className="space-y-6">
      {/* Interactive Institutional Hierarchy Breadcrumb Header */}
      <div className="bg-[#141311] text-[#F8F5ED] border border-[#2A2824] rounded-xl p-3.5 px-4 flex flex-col lg:flex-row lg:items-center justify-between gap-3 shadow-md text-xs">
        <div className="flex flex-wrap items-center gap-1.5 font-mono font-semibold text-[#D8D2C5]">
          {activeRole === 'Administrator' ? (
            <span
              onClick={() => handleDeptFilterChange('all')}
              className={`cursor-pointer hover:text-[#C9A227] transition font-bold ${selectedDeptFilter === 'all' ? 'text-[#C9A227]' : ''}`}
            >
              All Departments
            </span>
          ) : (
            <span className="text-[#E3C766] font-bold">
              {departments.find(d => d.id === selectedDeptFilter)?.code || user?.assigned_department_name || 'My Department'}
            </span>
          )}

          <span className="text-[#9E988A]">&gt;</span>
          <span
            onClick={() => {
              setSelectedProgFilter('all');
              setSelectedClassFilter('all');
            }}
            className={`cursor-pointer hover:text-[#E3C766] transition font-bold ${selectedDeptFilter !== 'all' && selectedProgFilter === 'all' ? 'text-[#E3C766]' : ''}`}
          >
            {selectedProgFilter !== 'all'
              ? (programmes.find(p => p.id === selectedProgFilter)?.code || 'Prog Selected')
              : 'Degree Programmes'}
          </span>

          <span className="text-[#9E988A]">&gt;</span>
          <span
            onClick={() => {
              setSelectedClassFilter('all');
            }}
            className={`cursor-pointer hover:text-[#E3C766] transition font-bold ${selectedProgFilter !== 'all' && selectedClassFilter === 'all' ? 'text-[#E3C766]' : ''}`}
          >
            {selectedClassFilter !== 'all'
              ? (classes.find(c => c.id === selectedClassFilter)?.class_code || 'Class Selected')
              : 'Classes / Batches'}
          </span>

          <span className="text-[#9E988A]">&gt;</span>
          <span
            className={`font-bold ${selectedClassFilter !== 'all' ? 'text-[#4ADE80]' : 'text-[#9E988A]'}`}
          >
            {selectedClassFilter !== 'all'
              ? (classes.find(c => c.id === selectedClassFilter)?.class_code || 'Class Selected')
              : 'Courses'}
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Department Filter: Dropdown for Admin; Locked Badge for HoD */}
          {activeRole === 'Administrator' ? (
            <div className="flex items-center space-x-1.5">
              <label className="text-[10px] text-[#9E988A] font-bold uppercase tracking-wider">Dept:</label>
              <select
                value={selectedDeptFilter}
                onChange={(e) => handleDeptFilterChange(e.target.value === 'all' ? 'all' : Number(e.target.value))}
                className="bg-[#1C1B18] border border-[#2A2824] text-[#F8F5ED] text-xs rounded-lg px-2.5 py-1 font-semibold focus:border-[#C9A227] outline-none transition"
              >
                <option value="all">All Departments ({departments.length})</option>
                {departments.map(d => (
                  <option key={d.id} value={d.id}>{d.code} — {d.name}</option>
                ))}
              </select>
            </div>
          ) : activeRole === 'HoD' ? (
            <div className="flex items-center space-x-1.5 bg-[#1C1B18] px-2.5 py-1 rounded-lg border border-[#C9A227]/40 text-xs">
              <label className="text-[10px] text-[#9E988A] font-bold uppercase tracking-wider">Dept:</label>
              <span className="font-bold text-[#E3C766]">
                {departments.find(d => d.id === selectedDeptFilter)?.code || user?.assigned_department_name || 'My Department'}
              </span>
              <span className="text-[9px] text-[#4ADE80] bg-[#4ADE80]/15 px-1 rounded border border-[#4ADE80]/30 font-semibold ml-1">Assigned</span>
            </div>
          ) : null}

          <div className="flex items-center space-x-1.5">
            <label className="text-[10px] text-[#9E988A] font-bold uppercase tracking-wider">Prog:</label>
            <select
              value={selectedProgFilter}
              onChange={(e) => {
                const val = e.target.value === 'all' ? 'all' : Number(e.target.value);
                setSelectedProgFilter(val);
                setSelectedClassFilter('all');
                if (val !== 'all') {
                  const p = programmes.find(prog => prog.id === val);
                  if (p && activeRole === 'Administrator') setSelectedDeptFilter(p.department_id);
                }
              }}
              className="bg-[#1C1B18] border border-[#2A2824] text-[#F8F5ED] text-xs rounded-lg px-2.5 py-1 font-semibold focus:border-[#C9A227] outline-none transition"
            >
              <option value="all">All Programmes</option>
              {programmes
                .filter(p => selectedDeptFilter === 'all' || p.department_id === selectedDeptFilter)
                .map(p => (
                  <option key={p.id} value={p.id}>{p.code} — {p.name}</option>
                ))}
            </select>
          </div>

          <div className="flex items-center space-x-1.5">
            <label className="text-[10px] text-[#9E988A] font-bold uppercase tracking-wider">Class:</label>
            <select
              value={selectedClassFilter}
              onChange={(e) => {
                const val = e.target.value === 'all' ? 'all' : Number(e.target.value);
                setSelectedClassFilter(val);
                if (val !== 'all') {
                  const c = classes.find(cls => cls.id === val);
                  if (c) {
                    setSelectedProgFilter(c.programme_id);
                    if (activeRole === 'Administrator') setSelectedDeptFilter(c.department_id);
                  }
                }
              }}
              className="bg-[#1C1B18] border border-[#2A2824] text-[#F8F5ED] text-xs rounded-lg px-2.5 py-1 font-semibold focus:border-[#C9A227] outline-none transition"
            >
              <option value="all">All Classes</option>
              {classes
                .filter(c => selectedProgFilter === 'all' || c.programme_id === selectedProgFilter)
                .map(c => (
                  <option key={c.id} value={c.id}>{c.class_code} ({c.batch_name} - {c.section_name})</option>
                ))}
            </select>
          </div>

          {((activeRole === 'Administrator' && selectedDeptFilter !== 'all') || selectedProgFilter !== 'all' || selectedClassFilter !== 'all') && (
            <button
              onClick={() => {
                if (activeRole === 'Administrator') {
                  setSelectedDeptFilter('all');
                }
                setSelectedProgFilter('all');
                setSelectedClassFilter('all');
              }}
              className="bg-[#EF4444]/15 hover:bg-[#EF4444]/25 border border-[#EF4444]/30 text-[#EF4444] text-[10px] font-bold px-2 py-1 rounded transition cursor-pointer"
            >
              Reset Filters
            </button>
          )}
        </div>
      </div>

      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-[#2A2824] pb-4">
        <div>
          <h2 className="text-xl font-bold text-[#F8F5ED]">
            {activeRole === 'Class Tutor' ? 'Assigned Class & Degree Curriculum Courses' : 'Academic & Department Master Management'}
          </h2>
          <p className="text-xs text-[#9E988A]">
            {activeRole === 'Class Tutor'
              ? `Curriculum and course structures for ${user?.assigned_class_name || user?.assigned_programme_name || 'Assigned Class'}`
              : 'Configure Departments, Degree Programmes, Classes, Courses & Faculty Allocations'}
          </p>
        </div>

        <div className="flex items-center space-x-3">
          {activeTab === 'departments' && activeRole === 'Administrator' && (
            <button
              onClick={() => setShowAddDeptModal(true)}
              className="bg-[#C9A227] hover:bg-[#B89220] text-[#11110F] text-xs font-bold px-4 py-2 rounded-lg shadow-sm transition flex items-center space-x-2 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>+ Create Department</span>
            </button>
          )}

          {activeTab === 'programmes' && (activeRole === 'HoD' || activeRole === 'ERP Coordinator' || activeRole === 'Administrator') && (
            <button
              onClick={() => setShowAddProgModal(true)}
              className="bg-[#C9A227] hover:bg-[#B89220] text-[#11110F] text-xs font-bold px-4 py-2 rounded-lg shadow-sm transition flex items-center space-x-2 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>+ Add Degree Programme</span>
            </button>
          )}

          {activeTab === 'classes' && (activeRole === 'HoD' || activeRole === 'ERP Coordinator' || activeRole === 'Administrator') && (
            <button
              onClick={() => setShowAddClassModal(true)}
              className="bg-[#C9A227] hover:bg-[#B89220] text-[#11110F] text-xs font-bold px-4 py-2 rounded-lg shadow-sm transition flex items-center space-x-2 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>+ Add Class / Batch</span>
            </button>
          )}

          {activeTab === 'courses' && (activeRole === 'HoD' || activeRole === 'ERP Coordinator' || activeRole === 'Administrator') && (
            <button
              onClick={() => setShowAddCourseModal(true)}
              className="bg-[#C9A227] hover:bg-[#B89220] text-[#11110F] text-xs font-bold px-4 py-2 rounded-lg shadow-sm transition flex items-center space-x-2 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>+ Add Course</span>
            </button>
          )}

          {/* Tab Switchers */}
          <div className="flex bg-[#141311] p-1 rounded-xl border border-[#2A2824] text-xs">
            {activeRole === 'Administrator' && (
              <button
                onClick={() => setActiveTab('departments')}
                className={`px-3 py-1.5 rounded-lg font-semibold transition cursor-pointer ${activeTab === 'departments' ? 'bg-[#C9A227] text-[#11110F] font-bold shadow-sm' : 'text-[#9E988A] hover:text-[#F8F5ED]'}`}
              >
                Departments ({departments.length})
              </button>
            )}

            {(activeRole === 'Administrator' || activeRole === 'HoD' || activeRole === 'ERP Coordinator' || activeRole === 'Assessment Coordinator') && (
              <>
                <button
                  onClick={() => setActiveTab('programmes')}
                  className={`px-3 py-1.5 rounded-lg font-semibold transition cursor-pointer ${activeTab === 'programmes' ? 'bg-[#C9A227] text-[#11110F] font-bold shadow-sm' : 'text-[#9E988A] hover:text-[#F8F5ED]'}`}
                >
                  Degree Programmes ({filteredProgrammes.length})
                </button>
                <button
                  onClick={() => setActiveTab('classes')}
                  className={`px-3 py-1.5 rounded-lg font-semibold transition cursor-pointer ${activeTab === 'classes' ? 'bg-[#C9A227] text-[#11110F] font-bold shadow-sm' : 'text-[#9E988A] hover:text-[#F8F5ED]'}`}
                >
                  Classes ({filteredClasses.length})
                </button>
              </>
            )}

            <button
              onClick={() => setActiveTab('courses')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition cursor-pointer ${activeTab === 'courses' ? 'bg-[#C9A227] text-[#11110F] font-bold shadow-sm' : 'text-[#9E988A] hover:text-[#F8F5ED]'}`}
            >
              {activeRole === 'Class Tutor' ? 'Assigned Class Courses' : 'Courses'} ({filteredCourses.length})
            </button>
            <button
              onClick={() => setActiveTab('allocations')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition cursor-pointer ${activeTab === 'allocations' ? 'bg-[#C9A227] text-[#11110F] font-bold shadow-sm' : 'text-[#9E988A] hover:text-[#F8F5ED]'}`}
            >
              {activeRole === 'Class Tutor' ? 'Faculty Allocations' : 'Allocations'} ({allocations.length})
            </button>
          </div>
        </div>
      </div>

      {/* Departments Table (Admin Only) */}
      {activeTab === 'departments' && activeRole === 'Administrator' && (
        <div className="bg-[#1C1B18] rounded-xl border border-[#2A2824] shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-[#2A2824] bg-[#141311] flex justify-between items-center">
            <h3 className="font-bold text-sm text-[#F8F5ED]">Department Master Registry</h3>
          </div>
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-[#141311] text-[#9E988A] font-semibold border-b border-[#2A2824]">
                <th className="p-3">Code</th>
                <th className="p-3">Department Name</th>
                <th className="p-3">School</th>
                <th className="p-3">Head of Dept (HoD)</th>
                <th className="p-3">Programmes</th>
                <th className="p-3">Faculty Count</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#2A2824]">
              {departments.map((d) => (
                <tr key={d.id} className="hover:bg-[#24231F]">
                  <td className="p-3 font-mono font-bold text-[#C9A227]">{d.code}</td>
                  <td className="p-3 font-semibold text-[#F8F5ED]">{d.name}</td>
                  <td className="p-3 text-[#9E988A]">{d.school_name}</td>
                  <td className="p-3 text-[#D8D2C5]">
                    {d.hod_name && d.hod_name !== 'Not Set' ? (
                      <span className="bg-[#24231F] text-[#E3C766] border border-[#2A2824] px-2 py-0.5 rounded text-[11px] font-semibold flex items-center space-x-1 w-max">
                        <Users className="w-3 h-3 text-[#C9A227] inline mr-1" />
                        {d.hod_name}
                      </span>
                    ) : (
                      <span className="text-[#9E988A] font-medium italic text-[11px]">Not Set</span>
                    )}
                  </td>
                  <td className="p-3 text-[#D8D2C5]">{d.programme_count} Programmes</td>
                  <td className="p-3 text-[#D8D2C5]">{d.faculty_count} Faculty Members</td>
                  <td className="p-3 text-right">
                    <div className="flex items-center justify-end space-x-1.5">
                      <button
                        onClick={() => setEditingDept(d)}
                        className="px-2.5 py-1 bg-[#24231F] hover:bg-[#2E2C27] text-[#E3C766] border border-[#2A2824] font-bold text-[11px] rounded-lg transition flex items-center space-x-1 cursor-pointer"
                      >
                        <Edit3 className="w-3 h-3" />
                        <span>Edit</span>
                      </button>
                      <button
                        onClick={() => handleDeleteDepartment(d.id, `${d.code} - ${d.name}`)}
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

      {/* Degree Programmes Table */}
      {activeTab === 'programmes' && (
        <div className="bg-[#1C1B18] rounded-xl border border-[#2A2824] shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-[#2A2824] bg-[#141311] flex justify-between items-center">
            <div>
              <h3 className="font-bold text-sm text-[#F8F5ED]">Degree Programmes Offered</h3>
            </div>
            <span className="text-xs font-semibold text-[#E3C766]">{filteredProgrammes.length} Active Programmes</span>
          </div>
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-[#141311] text-[#9E988A] font-semibold border-b border-[#2A2824]">
                <th className="p-3">Programme Code</th>
                <th className="p-3">Programme Full Name</th>
                <th className="p-3">Degree Type</th>
                <th className="p-3">Department</th>
                <th className="p-3">Duration</th>
                <th className="p-3">Courses</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#2A2824]">
              {filteredProgrammes.map((p) => (
                <tr key={p.id} className="hover:bg-[#24231F]">
                  <td className="p-3">
                    <button
                      onClick={() => {
                        setSelectedProgFilter(p.id);
                        setSelectedDeptFilter(p.department_id);
                        setActiveTab('classes');
                      }}
                      className="font-mono font-bold text-[#C9A227] hover:text-[#E3C766] bg-[#24231F] border border-[#2A2824] px-2 py-1 rounded transition text-xs shadow-sm flex items-center space-x-1 cursor-pointer group"
                      title="Click to view classes under this programme"
                    >
                      <span>{p.code}</span>
                      <Layers className="w-3 h-3 text-[#C9A227] group-hover:text-[#E3C766] transition" />
                    </button>
                  </td>
                  <td className="p-3 font-semibold text-[#F8F5ED]">{p.name}</td>
                  <td className="p-3 text-[#9E988A] font-medium">{p.degree_type}</td>
                  <td className="p-3 text-[#D8D2C5] font-semibold">
                    <span className="bg-[#141311] border border-[#2A2824] text-[#D8D2C5] px-2 py-0.5 rounded text-[11px]">{p.department_name}</span>
                  </td>
                  <td className="p-3 text-[#9E988A]">{p.duration_years} Years</td>
                  <td className="p-3 text-[#D8D2C5] font-semibold">{p.course_count} Courses</td>
                  <td className="p-3 text-right">
                    <div className="flex items-center justify-end space-x-1.5">
                      <button
                        onClick={() => setEditingProg(p)}
                        className="px-2.5 py-1 bg-[#24231F] hover:bg-[#2E2C27] text-[#E3C766] border border-[#2A2824] font-bold text-[11px] rounded-lg transition flex items-center space-x-1 cursor-pointer"
                      >
                        <Edit3 className="w-3 h-3" />
                        <span>Edit</span>
                      </button>
                      <button
                        onClick={() => handleDeleteProgramme(p.id, `${p.code} - ${p.name}`)}
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

      {/* Classes / Batches Table */}
      {activeTab === 'classes' && (
        <div className="bg-[#1C1B18] rounded-xl border border-[#2A2824] shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-[#2A2824] bg-[#141311] flex justify-between items-center">
            <div>
              <h3 className="font-bold text-sm text-[#F8F5ED]">Class & Batch Registry</h3>
              <p className="text-[11px] text-[#9E988A]">Classes created under Degree Programmes for student sectioning & tutor assignments</p>
            </div>
            <span className="text-xs font-semibold text-[#E3C766]">{filteredClasses.length} Active Classes</span>
          </div>
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-[#141311] text-[#9E988A] font-semibold border-b border-[#2A2824]">
                <th className="p-3">Class Code</th>
                <th className="p-3">Class Name</th>
                <th className="p-3">Degree Programme</th>
                <th className="p-3">Department</th>
                <th className="p-3">Batch & Sec</th>
                <th className="p-3">Term</th>
                <th className="p-3">Class Tutor</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#2A2824]">
              {filteredClasses.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-6 text-center text-[#9E988A] text-xs">
                    No classes created yet. Click <span className="font-bold text-[#C9A227]">+ Add Class / Batch</span> to create one under a programme.
                  </td>
                </tr>
              ) : (
                filteredClasses.map((c) => (
                  <tr key={c.id} className="hover:bg-[#24231F]">
                    <td className="p-3">
                      <button
                        onClick={() => {
                          setSelectedClassFilter(c.id);
                          setSelectedProgFilter(c.programme_id);
                          setSelectedDeptFilter(c.department_id);
                          setActiveTab('courses');
                          setCourseSemFilter('class-sem');
                        }}
                        className="font-mono font-bold text-[#C9A227] hover:text-[#E3C766] bg-[#24231F] border border-[#2A2824] px-2 py-1 rounded transition text-xs shadow-sm flex items-center space-x-1 cursor-pointer group"
                        title="Click to view courses and allocations for this class"
                      >
                        <span>{c.class_code}</span>
                        <BookOpen className="w-3 h-3 text-[#C9A227] group-hover:text-[#E3C766] transition" />
                      </button>
                    </td>
                    <td className="p-3 font-semibold text-[#F8F5ED]">{c.name}</td>
                    <td className="p-3 text-[#D8D2C5] font-medium">{c.programme_name}</td>
                    <td className="p-3 text-[#D8D2C5]">
                      <span className="bg-[#141311] text-[#D8D2C5] border border-[#2A2824] px-2 py-0.5 rounded text-[11px] font-semibold">{c.department_name}</span>
                    </td>
                    <td className="p-3 text-[#9E988A] font-mono">{c.batch_name} (Sec {c.section_name})</td>
                    <td className="p-3 text-[#9E988A] font-semibold">Sem {c.semester_num}</td>
                    <td className="p-3 text-[#D8D2C5] font-medium">{c.tutor_name || 'Unassigned'}</td>
                    <td className="p-3 text-right">
                      <div className="flex items-center justify-end space-x-1.5">
                        <button
                          onClick={() => setEditingClass(c)}
                          className="px-2.5 py-1 bg-[#24231F] hover:bg-[#2E2C27] text-[#E3C766] border border-[#2A2824] font-bold text-[11px] rounded-lg transition flex items-center space-x-1 cursor-pointer"
                        >
                          <Edit3 className="w-3 h-3" />
                          <span>Edit</span>
                        </button>
                        <button
                          onClick={() => handleDeleteClass(c.id, `${c.class_code} - ${c.name}`)}
                          className="px-2.5 py-1 bg-[#141311] hover:bg-[#EF4444]/10 text-[#EF4444] border border-[#EF4444]/30 font-bold text-[11px] rounded-lg transition flex items-center space-x-1 cursor-pointer"
                        >
                          <Trash2 className="w-3 h-3" />
                          <span>Remove</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Courses Table */}
      {activeTab === 'courses' && (
        <div className="bg-[#1C1B18] rounded-xl border border-[#2A2824] shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-[#2A2824] bg-[#141311] flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h3 className="font-bold text-sm text-[#F8F5ED] flex items-center space-x-2">
                <span className="bg-[#C9A227]/10 text-[#E3C766] border border-[#C9A227]/25 px-2 py-0.5 rounded text-[11px] font-bold">Courses</span>
                <span>{selectedClass ? `Courses for Class: ${selectedClass.class_code}` : 'Course Master Catalog'}</span>
              </h3>
              <p className="text-[11px] text-[#9E988A] mt-1">
                {selectedClass
                  ? `Viewing courses under ${selectedClass.programme_name} (Batch: ${selectedClass.batch_name}, Section: ${selectedClass.section_name}, Sem: ${selectedClass.semester_num})`
                  : 'Courses linked under respective Department Degree Programmes'}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              {selectedClass && (
                <div className="flex bg-[#141311] p-1 rounded-lg border border-[#2A2824] text-xs items-center space-x-1">
                  <button
                    onClick={() => setCourseSemFilter('class-sem')}
                    className={`px-2.5 py-1 rounded font-semibold transition cursor-pointer ${courseSemFilter === 'class-sem' ? 'bg-[#C9A227] text-[#11110F] font-bold shadow-sm' : 'text-[#9E988A] hover:text-[#F8F5ED]'}`}
                  >
                    Sem {selectedClass.semester_num} Courses Only
                  </button>
                  <button
                    onClick={() => setCourseSemFilter('all')}
                    className={`px-2.5 py-1 rounded font-semibold transition cursor-pointer ${courseSemFilter === 'all' ? 'bg-[#C9A227] text-[#11110F] font-bold shadow-sm' : 'text-[#9E988A] hover:text-[#F8F5ED]'}`}
                  >
                    All Semesters
                  </button>
                </div>
              )}

              {selectedClass && (
                <button
                  onClick={() => setSelectedClassFilter('all')}
                  className="bg-[#24231F] hover:bg-[#2E2C27] border border-[#2A2824] text-[#E3C766] font-bold text-[11px] px-2.5 py-1.5 rounded-lg transition cursor-pointer"
                >
                  Clear Class Filter
                </button>
              )}

              <span className="text-xs font-semibold text-[#E3C766] bg-[#141311] px-2 py-1 rounded border border-[#2A2824]">{filteredCourses.length} Courses Listed</span>
            </div>
          </div>

          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-[#141311] text-[#9E988A] font-semibold border-b border-[#2A2824]">
                <th className="p-3">Code</th>
                <th className="p-3">Course Title</th>
                <th className="p-3">Type</th>
                <th className="p-3">Credits</th>
                <th className="p-3">Semester</th>
                <th className="p-3">Programme & Department</th>
                <th className="p-3">Assigned Faculty</th>
                <th className="p-3">Regulation</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#2A2824]">
              {filteredCourses.length === 0 ? (
                <tr>
                  <td colSpan={9} className="p-6 text-center text-[#9E988A] text-xs">
                    No courses found matching current filters.
                  </td>
                </tr>
              ) : (
                filteredCourses.map((c) => {
                  const allocationsToDisplay = selectedClass
                    ? (c.allocated_faculty || []).filter(f => f.section === selectedClass.section_name)
                    : (c.allocated_faculty || []);

                  return (
                    <tr key={c.id} className="hover:bg-[#24231F]">
                      <td className="p-3 font-mono font-bold text-[#C9A227]">{c.code}</td>
                      <td className="p-3 font-semibold text-[#F8F5ED]">{c.title}</td>
                      <td className="p-3 text-[#9E988A]">{c.course_type}</td>
                      <td className="p-3 text-[#D8D2C5] font-mono">{c.credits}</td>
                      <td className="p-3 text-[#D8D2C5] font-semibold">
                        Sem {c.semester_num}
                        {selectedClass && c.semester_num === selectedClass.semester_num && (
                          <span className="ml-1.5 bg-[#4ADE80]/15 text-[#4ADE80] border border-[#4ADE80]/30 px-1 py-0.25 rounded text-[9px] font-bold">Active Sem</span>
                        )}
                      </td>
                      <td className="p-3 text-[#D8D2C5]">
                        <div className="font-semibold text-[#F8F5ED]">{c.programme_name}</div>
                        <div className="text-[10px] text-[#C9A227] font-bold uppercase tracking-wider font-mono">{(c as any).department_name || 'N/A'}</div>
                      </td>
                      <td className="p-3 text-[#D8D2C5]">
                        {allocationsToDisplay.length > 0 ? (
                          <div className="space-y-1">
                            {allocationsToDisplay.map((f, idx) => (
                              <span key={idx} className="bg-[#24231F] text-[#E3C766] border border-[#2A2824] px-2 py-0.5 rounded text-[11px] font-semibold flex items-center space-x-1 w-max">
                                <Users className="w-3 h-3 text-[#C9A227] inline mr-1" />
                                {f.name} {f.section ? `(Sec ${f.section})` : ''}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="text-[#9E988A] font-medium italic text-[11px]">
                            {selectedClass ? `Unassigned for Sec ${selectedClass.section_name}` : 'Unassigned'}
                          </span>
                        )}
                      </td>
                      <td className="p-3 text-[#D8D2C5] font-mono">{c.regulation || '2023'}</td>
                      {(activeRole === 'Administrator' || activeRole === 'HoD' || activeRole === 'ERP Coordinator') && (
                        <td className="p-3 text-right">
                          <div className="flex items-center justify-end space-x-1.5">
                            <button
                              onClick={() => setEditingCourse(c)}
                              className="px-2.5 py-1 bg-[#24231F] hover:bg-[#2E2C27] text-[#E3C766] border border-[#2A2824] font-bold text-[11px] rounded-lg transition flex items-center space-x-1 cursor-pointer"
                            >
                              <Edit3 className="w-3 h-3" />
                              <span>Edit</span>
                            </button>
                            <button
                              onClick={() => handleDeleteCourse(c.id, `${c.code} - ${c.title}`)}
                              className="px-2.5 py-1 bg-[#141311] hover:bg-[#EF4444]/10 text-[#EF4444] border border-[#EF4444]/30 font-bold text-[11px] rounded-lg transition flex items-center space-x-1 cursor-pointer"
                            >
                              <Trash2 className="w-3 h-3" />
                              <span>Remove</span>
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Allocations Table */}
      {activeTab === 'allocations' && (
        <div className="bg-[#1C1B18] rounded-xl border border-[#2A2824] shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-[#2A2824] bg-[#141311]">
            <h3 className="font-bold text-sm text-[#F8F5ED]">Faculty Course Allocation Registry</h3>
          </div>
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-[#141311] text-[#9E988A] font-semibold border-b border-[#2A2824]">
                <th className="p-3">Faculty Name</th>
                <th className="p-3">Course Allocated</th>
                <th className="p-3">Section</th>
                <th className="p-3">Term</th>
                {(activeRole === 'Administrator' || activeRole === 'HoD' || activeRole === 'ERP Coordinator') && (
                  <th className="p-3 text-right">Actions</th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#2A2824]">
              {allocations.map((a) => (
                <tr key={a.id} className="hover:bg-[#24231F]">
                  <td className="p-3 font-semibold text-[#F8F5ED]">{a.faculty_name}</td>
                  <td className="p-3 font-medium text-[#C9A227]">{a.course_code} - {a.course_title}</td>
                  <td className="p-3 text-[#D8D2C5]"><span className="bg-[#141311] border border-[#2A2824] px-2 py-0.5 rounded text-[10px] font-bold">Sec {a.section_name}</span></td>
                  <td className="p-3 text-[#9E988A]">{a.academic_year} (Sem {a.semester_num})</td>
                  {(activeRole === 'Administrator' || activeRole === 'HoD' || activeRole === 'ERP Coordinator') && (
                    <td className="p-3 text-right">
                      <div className="flex items-center justify-end space-x-1.5">
                        <button
                          onClick={() => setEditingAlloc(a)}
                          className="px-2.5 py-1 bg-[#24231F] hover:bg-[#2E2C27] text-[#E3C766] border border-[#2A2824] font-bold text-[11px] rounded-lg transition flex items-center space-x-1 cursor-pointer"
                        >
                          <Edit3 className="w-3 h-3" />
                          <span>Edit</span>
                        </button>
                        <button
                          onClick={() => handleDeleteAllocation(a.id)}
                          className="px-2.5 py-1 bg-[#141311] hover:bg-[#EF4444]/10 text-[#EF4444] border border-[#EF4444]/30 font-bold text-[11px] rounded-lg transition flex items-center space-x-1 cursor-pointer"
                        >
                          <Trash2 className="w-3 h-3" />
                          <span>Remove</span>
                        </button>
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* CREATE DEPARTMENT MODAL (ADMIN ONLY) */}
      {showAddDeptModal && activeRole === 'Administrator' && (
        <div className="fixed inset-0 bg-[#11110F]/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#1C1B18] rounded-2xl border border-[#2A2824] shadow-2xl w-full max-w-md p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-[#2A2824] pb-3">
              <h3 className="text-base font-bold text-[#F8F5ED] flex items-center space-x-2">
                <Building2 className="w-5 h-5 text-[#C9A227]" />
                <span>+ Create New Department</span>
              </h3>
              <button onClick={() => setShowAddDeptModal(false)} className="text-[#9E988A] hover:text-[#F8F5ED] font-bold cursor-pointer">✕</button>
            </div>

            <form onSubmit={handleCreateDepartment} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#D8D2C5] mb-1">Department Code *</label>
                <input
                  type="text"
                  value={newDeptCode}
                  onChange={(e) => setNewDeptCode(e.target.value)}
                  placeholder="e.g. AI, ECE, AI&DS"
                  className="w-full bg-[#141311] border border-[#2A2824] text-[#F8F5ED] placeholder-[#9E988A]/60 focus:border-[#C9A227] outline-none rounded-lg p-2.5 text-xs font-mono font-bold uppercase"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#D8D2C5] mb-1">Department Full Name *</label>
                <input
                  type="text"
                  value={newDeptName}
                  onChange={(e) => setNewDeptName(e.target.value)}
                  placeholder="e.g. Department of Artificial Intelligence & Data Science"
                  className="w-full bg-[#141311] border border-[#2A2824] text-[#F8F5ED] placeholder-[#9E988A]/60 focus:border-[#C9A227] outline-none rounded-lg p-2.5 text-xs font-medium"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#D8D2C5] mb-1">
                  Head of Department (HoD) <span className="text-[#9E988A] font-normal">(Optional)</span>
                </label>
                <select
                  value={newDeptHodId}
                  onChange={(e) => setNewDeptHodId(e.target.value ? Number(e.target.value) : '')}
                  className="w-full bg-[#141311] border border-[#2A2824] text-[#F8F5ED] focus:border-[#C9A227] outline-none rounded-lg p-2.5 text-xs font-medium"
                >
                  <option value="">-- Not Set / Unassigned --</option>
                  {faculties.map((f) => (
                    <option key={f.id} value={f.id}>{f.full_name} ({f.designation})</option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end space-x-2 pt-2 border-t border-[#2A2824]">
                <button
                  type="button"
                  onClick={() => setShowAddDeptModal(false)}
                  className="bg-[#24231F] hover:bg-[#2E2C27] border border-[#2A2824] text-[#9E988A] text-xs font-semibold px-4 py-2 rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-[#C9A227] hover:bg-[#B89220] text-[#11110F] text-xs font-bold px-5 py-2 rounded-lg shadow-sm cursor-pointer"
                >
                  Create Department
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CREATE DEGREE PROGRAMME MODAL */}
      {showAddProgModal && (
        <div className="fixed inset-0 bg-[#11110F]/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#1C1B18] rounded-2xl border border-[#2A2824] shadow-2xl w-full max-w-md p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-[#2A2824] pb-3">
              <h3 className="text-base font-bold text-[#F8F5ED] flex items-center space-x-2">
                <BookOpen className="w-5 h-5 text-[#C9A227]" />
                <span>+ Add Degree Programme</span>
              </h3>
              <button onClick={() => setShowAddProgModal(false)} className="text-[#9E988A] hover:text-[#F8F5ED] font-bold cursor-pointer">✕</button>
            </div>

            <form onSubmit={handleCreateProgramme} className="space-y-4 text-xs">
              <div>
                <label className="block text-xs font-semibold text-[#D8D2C5] mb-1">Programme Code *</label>
                <input
                  type="text"
                  value={newProgCode}
                  onChange={(e) => setNewProgCode(e.target.value)}
                  placeholder="e.g. BCA, BSCAI, BCOM"
                  className="w-full bg-[#141311] border border-[#2A2824] text-[#F8F5ED] placeholder-[#9E988A]/60 focus:border-[#C9A227] outline-none rounded-lg p-2.5 text-xs font-mono font-bold uppercase"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#D8D2C5] mb-1">Programme Full Name *</label>
                <input
                  type="text"
                  value={newProgName}
                  onChange={(e) => setNewProgName(e.target.value)}
                  placeholder="e.g. Bachelor of Computer Applications"
                  className="w-full bg-[#141311] border border-[#2A2824] text-[#F8F5ED] placeholder-[#9E988A]/60 focus:border-[#C9A227] outline-none rounded-lg p-2.5 text-xs font-medium"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#D8D2C5] mb-1">Degree Type</label>
                  <select
                    value={newProgDegree}
                    onChange={(e) => setNewProgDegree(e.target.value)}
                    className="w-full bg-[#141311] border border-[#2A2824] text-[#F8F5ED] focus:border-[#C9A227] outline-none rounded-lg p-2.5 text-xs font-medium"
                  >
                    <option value="UG">Undergraduate (UG)</option>
                    <option value="PG">Postgraduate (PG)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#D8D2C5] mb-1">Duration (Years)</label>
                  <input
                    type="number"
                    value={newProgDuration}
                    onChange={(e) => setNewProgDuration(Number(e.target.value))}
                    min={1}
                    max={5}
                    className="w-full bg-[#141311] border border-[#2A2824] text-[#F8F5ED] focus:border-[#C9A227] outline-none rounded-lg p-2.5 text-xs font-medium"
                    required
                  />
                </div>
              </div>

              {activeRole === 'Administrator' && (
                <div>
                  <label className="block text-xs font-semibold text-[#D8D2C5] mb-1">Assigned Department</label>
                  <select
                    value={newProgDeptId}
                    onChange={(e) => setNewProgDeptId(Number(e.target.value))}
                    className="w-full bg-[#141311] border border-[#2A2824] text-[#F8F5ED] focus:border-[#C9A227] outline-none rounded-lg p-2.5 text-xs font-medium"
                  >
                    {departments.map((d) => (
                      <option key={d.id} value={d.id}>{d.code} — {d.name}</option>
                    ))}
                  </select>
                </div>
              )}

              <div className="flex justify-end space-x-2 pt-2 border-t border-[#2A2824]">
                <button
                  type="button"
                  onClick={() => setShowAddProgModal(false)}
                  className="bg-[#24231F] hover:bg-[#2E2C27] border border-[#2A2824] text-[#9E988A] text-xs font-semibold px-4 py-2 rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-[#C9A227] hover:bg-[#B89220] text-[#11110F] text-xs font-bold px-5 py-2 rounded-lg shadow-sm cursor-pointer"
                >
                  Create Programme
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CREATE CLASS MODAL */}
      {showAddClassModal && (
        <div className="fixed inset-0 bg-[#11110F]/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#1C1B18] rounded-2xl border border-[#2A2824] shadow-2xl w-full max-w-md p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-[#2A2824] pb-3">
              <h3 className="text-base font-bold text-[#F8F5ED] flex items-center space-x-2">
                <Users className="w-5 h-5 text-[#C9A227]" />
                <span>+ Add Class / Batch</span>
              </h3>
              <button onClick={() => setShowAddClassModal(false)} className="text-[#9E988A] hover:text-[#F8F5ED] font-bold cursor-pointer">✕</button>
            </div>

            <form onSubmit={handleCreateClass} className="space-y-4 text-xs">
              <div>
                <label className="block text-xs font-semibold text-[#D8D2C5] mb-1">Class Code *</label>
                <input
                  type="text"
                  value={newClassCode}
                  onChange={(e) => setNewClassCode(e.target.value)}
                  placeholder="e.g. 23BCA-A, 24BSCAI-A"
                  className="w-full bg-[#141311] border border-[#2A2824] text-[#F8F5ED] placeholder-[#9E988A]/60 focus:border-[#C9A227] outline-none rounded-lg p-2.5 text-xs font-mono font-bold uppercase"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#D8D2C5] mb-1">Class Name / Description *</label>
                <input
                  type="text"
                  value={newClassName}
                  onChange={(e) => setNewClassName(e.target.value)}
                  placeholder="e.g. 2023-2026 BCA Section A"
                  className="w-full bg-[#141311] border border-[#2A2824] text-[#F8F5ED] placeholder-[#9E988A]/60 focus:border-[#C9A227] outline-none rounded-lg p-2.5 text-xs font-medium"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#D8D2C5] mb-1">Parent Degree Programme *</label>
                <select
                  value={newClassProgId}
                  onChange={(e) => setNewClassProgId(Number(e.target.value))}
                  className="w-full bg-[#141311] border border-[#2A2824] text-[#F8F5ED] focus:border-[#C9A227] outline-none rounded-lg p-2.5 text-xs font-semibold"
                >
                  {programmes.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.code} — {p.name} ({p.department_name})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#D8D2C5] mb-1">Batch</label>
                  <input
                    type="text"
                    value={newClassBatch}
                    onChange={(e) => setNewClassBatch(e.target.value)}
                    placeholder="2023-2026"
                    className="w-full bg-[#141311] border border-[#2A2824] text-[#F8F5ED] focus:border-[#C9A227] outline-none rounded-lg p-2.5 text-xs font-medium"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#D8D2C5] mb-1">Semester</label>
                  <input
                    type="number"
                    value={newClassSemester}
                    onChange={(e) => setNewClassSemester(Number(e.target.value))}
                    min={1}
                    max={8}
                    className="w-full bg-[#141311] border border-[#2A2824] text-[#F8F5ED] focus:border-[#C9A227] outline-none rounded-lg p-2.5 text-xs font-medium"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#D8D2C5] mb-1">Section</label>
                  <input
                    type="text"
                    value={newClassSection}
                    onChange={(e) => setNewClassSection(e.target.value)}
                    placeholder="A"
                    className="w-full bg-[#141311] border border-[#2A2824] text-[#F8F5ED] focus:border-[#C9A227] outline-none rounded-lg p-2.5 text-xs font-medium uppercase"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#D8D2C5] mb-1">
                  Class Tutor <span className="text-[#9E988A] font-normal">(Optional)</span>
                </label>
                <select
                  value={newClassTutorId}
                  onChange={(e) => setNewClassTutorId(e.target.value ? Number(e.target.value) : '')}
                  className="w-full bg-[#141311] border border-[#2A2824] text-[#F8F5ED] focus:border-[#C9A227] outline-none rounded-lg p-2.5 text-xs font-medium"
                >
                  <option value="">-- Unassigned / Not Set --</option>
                  {faculties.map((f) => {
                    const assignedClass = classes.find((c: any) => c.tutor_id === f.id);
                    return (
                      <option key={f.id} value={f.id}>
                        {f.full_name} ({f.designation}){assignedClass ? ` — Assigned to ${assignedClass.class_code}` : ''}
                      </option>
                    );
                  })}
                </select>
              </div>

              {/* Conflict Warning Banner for Add Class Modal */}
              {newClassTutorId && classes.some((c: any) => c.tutor_id === Number(newClassTutorId)) && (
                <div className="bg-[#141311] border border-[#EF4444]/40 rounded-xl p-3 text-xs text-[#EF4444] flex items-start space-x-2 shadow-sm">
                  <AlertCircle className="w-4 h-4 text-[#EF4444] shrink-0 mt-0.5" />
                  <div>
                    <strong className="block font-bold text-[#EF4444] text-[11px]">Tutor Already Assigned</strong>
                    <p className="text-[10px] text-[#D8D2C5] mt-0.5">
                      This faculty member is already assigned as Class Tutor to <strong>{classes.find((c: any) => c.tutor_id === Number(newClassTutorId))?.class_code}</strong>. A tutor cannot be assigned to two classes simultaneously.
                    </p>
                  </div>
                </div>
              )}

              <div className="flex justify-end space-x-2 pt-2 border-t border-[#2A2824]">
                <button
                  type="button"
                  onClick={() => setShowAddClassModal(false)}
                  className="bg-[#24231F] hover:bg-[#2E2C27] border border-[#2A2824] text-[#9E988A] text-xs font-semibold px-4 py-2 rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={Boolean(newClassTutorId && classes.some((c: any) => c.tutor_id === Number(newClassTutorId)))}
                  className={`text-xs font-bold px-5 py-2 rounded-lg shadow-sm transition cursor-pointer ${
                    newClassTutorId && classes.some((c: any) => c.tutor_id === Number(newClassTutorId))
                      ? 'bg-[#24231F] text-[#9E988A] cursor-not-allowed opacity-60'
                      : 'bg-[#C9A227] hover:bg-[#B89220] text-[#11110F]'
                  }`}
                >
                  Create Class
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CREATE COURSE MODAL */}
      {showAddCourseModal && (
        <div className="fixed inset-0 bg-[#11110F]/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#1C1B18] rounded-2xl border border-[#2A2824] shadow-2xl w-full max-w-md p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-[#2A2824] pb-3">
              <h3 className="text-base font-bold text-[#F8F5ED] flex items-center space-x-2">
                <Layers className="w-5 h-5 text-[#C9A227]" />
                <span>+ Add Course to Programme</span>
              </h3>
              <button onClick={() => setShowAddCourseModal(false)} className="text-[#9E988A] hover:text-[#F8F5ED] font-bold cursor-pointer">✕</button>
            </div>

            <form onSubmit={handleCreateCourse} className="space-y-4 text-xs">
              <div>
                <label className="block text-xs font-semibold text-[#D8D2C5] mb-1">Course Code *</label>
                <input
                  type="text"
                  value={newCourseCode}
                  onChange={(e) => setNewCourseCode(e.target.value)}
                  placeholder="e.g. 23BCA405, 23BSCM403"
                  className="w-full bg-[#141311] border border-[#2A2824] text-[#F8F5ED] placeholder-[#9E988A]/60 focus:border-[#C9A227] outline-none rounded-lg p-2.5 text-xs font-mono font-bold uppercase"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#D8D2C5] mb-1">Course Title *</label>
                <input
                  type="text"
                  value={newCourseTitle}
                  onChange={(e) => setNewCourseTitle(e.target.value)}
                  placeholder="e.g. Machine Learning & Artificial Intelligence"
                  className="w-full bg-[#141311] border border-[#2A2824] text-[#F8F5ED] placeholder-[#9E988A]/60 focus:border-[#C9A227] outline-none rounded-lg p-2.5 text-xs font-medium"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#D8D2C5] mb-1">Course Type</label>
                  <select
                    value={newCourseType}
                    onChange={(e) => setNewCourseType(e.target.value)}
                    className="w-full bg-[#141311] border border-[#2A2824] text-[#F8F5ED] focus:border-[#C9A227] outline-none rounded-lg p-2.5 text-xs font-medium"
                  >
                    <option value="Theory">Theory</option>
                    <option value="Practical">Practical</option>
                    <option value="Theory + Practical">Theory + Practical</option>
                    <option value="Project">Project / Field Work</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#D8D2C5] mb-1">Credits</label>
                  <input
                    type="number"
                    step="0.5"
                    value={newCourseCredits}
                    onChange={(e) => setNewCourseCredits(Number(e.target.value))}
                    min={1}
                    max={12}
                    className="w-full bg-[#141311] border border-[#2A2824] text-[#F8F5ED] focus:border-[#C9A227] outline-none rounded-lg p-2.5 text-xs font-medium"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#D8D2C5] mb-1">Semester Number</label>
                  <input
                    type="number"
                    value={newCourseSemester}
                    onChange={(e) => setNewCourseSemester(Number(e.target.value))}
                    min={1}
                    max={8}
                    className="w-full bg-[#141311] border border-[#2A2824] text-[#F8F5ED] focus:border-[#C9A227] outline-none rounded-lg p-2.5 text-xs font-medium"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#D8D2C5] mb-1">Regulation</label>
                  <input
                    type="text"
                    value={newCourseRegulation}
                    onChange={(e) => setNewCourseRegulation(e.target.value)}
                    placeholder="e.g. 2023"
                    className="w-full bg-[#141311] border border-[#2A2824] text-[#F8F5ED] placeholder-[#9E988A]/60 focus:border-[#C9A227] outline-none rounded-lg p-2.5 text-xs font-medium"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#D8D2C5] mb-1">Target Programme / Class *</label>
                <select
                  value={newCourseProgId}
                  onChange={(e) => setNewCourseProgId(Number(e.target.value))}
                  className="w-full bg-[#141311] border border-[#2A2824] text-[#F8F5ED] focus:border-[#C9A227] outline-none rounded-lg p-2.5 text-xs font-semibold"
                >
                  {programmes.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.code} — {p.name} ({p.department_name})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#D8D2C5] mb-1">
                  Assigned Faculty <span className="text-[#9E988A] font-normal">(Optional)</span>
                </label>
                <select
                  value={newCourseFacultyId}
                  onChange={(e) => setNewCourseFacultyId(e.target.value ? Number(e.target.value) : '')}
                  className="w-full bg-[#141311] border border-[#2A2824] text-[#F8F5ED] focus:border-[#C9A227] outline-none rounded-lg p-2.5 text-xs font-medium"
                >
                  <option value="">-- Unassigned / Not Set --</option>
                  {faculties.map((f) => (
                    <option key={f.id} value={f.id}>{f.full_name} ({f.designation})</option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end space-x-2 pt-2 border-t border-[#2A2824]">
                <button
                  type="button"
                  onClick={() => setShowAddCourseModal(false)}
                  className="bg-[#24231F] hover:bg-[#2E2C27] border border-[#2A2824] text-[#9E988A] text-xs font-semibold px-4 py-2 rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-[#C9A227] hover:bg-[#B89220] text-[#11110F] text-xs font-bold px-5 py-2 rounded-lg shadow-sm cursor-pointer"
                >
                  Create Course
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT DEPARTMENT MODAL */}
      {editingDept && (
        <div className="fixed inset-0 bg-[#11110F]/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#1C1B18] rounded-2xl border border-[#2A2824] shadow-2xl w-full max-w-md p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-[#2A2824] pb-3">
              <h3 className="text-base font-bold text-[#F8F5ED] flex items-center space-x-2">
                <Edit3 className="w-5 h-5 text-[#C9A227]" />
                <span>Edit Department</span>
              </h3>
              <button onClick={() => setEditingDept(null)} className="text-[#9E988A] hover:text-[#F8F5ED] font-bold cursor-pointer">✕</button>
            </div>

            <form onSubmit={handleUpdateDepartment} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#D8D2C5] mb-1">Department Code *</label>
                <input
                  type="text"
                  value={editingDept.code}
                  onChange={(e) => setEditingDept({ ...editingDept, code: e.target.value })}
                  className="w-full bg-[#141311] border border-[#2A2824] text-[#F8F5ED] focus:border-[#C9A227] outline-none rounded-lg p-2.5 text-xs font-mono font-bold uppercase"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#D8D2C5] mb-1">Department Full Name *</label>
                <input
                  type="text"
                  value={editingDept.name}
                  onChange={(e) => setEditingDept({ ...editingDept, name: e.target.value })}
                  className="w-full bg-[#141311] border border-[#2A2824] text-[#F8F5ED] focus:border-[#C9A227] outline-none rounded-lg p-2.5 text-xs font-medium"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#D8D2C5] mb-1">
                  Head of Department (HoD) <span className="text-[#9E988A] font-normal">(Optional)</span>
                </label>
                <select
                  value={editingDept.hod_id || ''}
                  onChange={(e) => setEditingDept({ ...editingDept, hod_id: e.target.value ? Number(e.target.value) : null })}
                  className="w-full bg-[#141311] border border-[#2A2824] text-[#F8F5ED] focus:border-[#C9A227] outline-none rounded-lg p-2.5 text-xs font-medium"
                >
                  <option value="">-- Not Set / Unassigned --</option>
                  {faculties.map((f) => (
                    <option key={f.id} value={f.id}>{f.full_name} ({f.designation})</option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end space-x-2 pt-2 border-t border-[#2A2824]">
                <button
                  type="button"
                  onClick={() => setEditingDept(null)}
                  className="bg-[#24231F] hover:bg-[#2E2C27] border border-[#2A2824] text-[#9E988A] text-xs font-semibold px-4 py-2 rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-[#C9A227] hover:bg-[#B89220] text-[#11110F] text-xs font-bold px-5 py-2 rounded-lg shadow-sm cursor-pointer"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT DEGREE PROGRAMME MODAL */}
      {editingProg && (
        <div className="fixed inset-0 bg-[#11110F]/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#1C1B18] rounded-2xl border border-[#2A2824] shadow-2xl w-full max-w-md p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-[#2A2824] pb-3">
              <h3 className="text-base font-bold text-[#F8F5ED] flex items-center space-x-2">
                <Edit3 className="w-5 h-5 text-[#C9A227]" />
                <span>Edit Degree Programme</span>
              </h3>
              <button onClick={() => setEditingProg(null)} className="text-[#9E988A] hover:text-[#F8F5ED] font-bold cursor-pointer">✕</button>
            </div>

            <form onSubmit={handleUpdateProgramme} className="space-y-4 text-xs">
              <div>
                <label className="block text-xs font-semibold text-[#D8D2C5] mb-1">Programme Code *</label>
                <input
                  type="text"
                  value={editingProg.code}
                  onChange={(e) => setEditingProg({ ...editingProg, code: e.target.value })}
                  className="w-full bg-[#141311] border border-[#2A2824] text-[#F8F5ED] focus:border-[#C9A227] outline-none rounded-lg p-2.5 text-xs font-mono font-bold uppercase"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#D8D2C5] mb-1">Programme Full Name *</label>
                <input
                  type="text"
                  value={editingProg.name}
                  onChange={(e) => setEditingProg({ ...editingProg, name: e.target.value })}
                  className="w-full bg-[#141311] border border-[#2A2824] text-[#F8F5ED] focus:border-[#C9A227] outline-none rounded-lg p-2.5 text-xs font-medium"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#D8D2C5] mb-1">Degree Type</label>
                  <select
                    value={editingProg.degree_type}
                    onChange={(e) => setEditingProg({ ...editingProg, degree_type: e.target.value })}
                    className="w-full bg-[#141311] border border-[#2A2824] text-[#F8F5ED] focus:border-[#C9A227] outline-none rounded-lg p-2.5 text-xs font-medium"
                  >
                    <option value="UG">Undergraduate (UG)</option>
                    <option value="PG">Postgraduate (PG)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#D8D2C5] mb-1">Duration (Years)</label>
                  <input
                    type="number"
                    value={editingProg.duration_years}
                    onChange={(e) => setEditingProg({ ...editingProg, duration_years: Number(e.target.value) })}
                    min={1}
                    max={5}
                    className="w-full bg-[#141311] border border-[#2A2824] text-[#F8F5ED] focus:border-[#C9A227] outline-none rounded-lg p-2.5 text-xs font-medium"
                    required
                  />
                </div>
              </div>

              {activeRole === 'Administrator' && (
                <div>
                  <label className="block text-xs font-semibold text-[#D8D2C5] mb-1">Assigned Department</label>
                  <select
                    value={editingProg.department_id}
                    onChange={(e) => setEditingProg({ ...editingProg, department_id: Number(e.target.value) })}
                    className="w-full bg-[#141311] border border-[#2A2824] text-[#F8F5ED] focus:border-[#C9A227] outline-none rounded-lg p-2.5 text-xs font-medium"
                  >
                    {departments.map((d) => (
                      <option key={d.id} value={d.id}>{d.code} — {d.name}</option>
                    ))}
                  </select>
                </div>
              )}

              <div className="flex justify-end space-x-2 pt-2 border-t border-[#2A2824]">
                <button
                  type="button"
                  onClick={() => setEditingProg(null)}
                  className="bg-[#24231F] hover:bg-[#2E2C27] border border-[#2A2824] text-[#9E988A] text-xs font-semibold px-4 py-2 rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-[#C9A227] hover:bg-[#B89220] text-[#11110F] text-xs font-bold px-5 py-2 rounded-lg shadow-sm cursor-pointer"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT CLASS MODAL */}
      {editingClass && (
        <div className="fixed inset-0 bg-[#11110F]/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#1C1B18] rounded-2xl border border-[#2A2824] shadow-2xl w-full max-w-md p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-[#2A2824] pb-3">
              <h3 className="text-base font-bold text-[#F8F5ED] flex items-center space-x-2">
                <Edit3 className="w-5 h-5 text-[#C9A227]" />
                <span>Edit Class / Batch</span>
              </h3>
              <button onClick={() => setEditingClass(null)} className="text-[#9E988A] hover:text-[#F8F5ED] font-bold cursor-pointer">✕</button>
            </div>

            <form onSubmit={handleUpdateClass} className="space-y-4 text-xs">
              <div>
                <label className="block text-xs font-semibold text-[#D8D2C5] mb-1">Class Code *</label>
                <input
                  type="text"
                  value={editingClass.class_code}
                  onChange={(e) => setEditingClass({ ...editingClass, class_code: e.target.value })}
                  className="w-full bg-[#141311] border border-[#2A2824] text-[#F8F5ED] focus:border-[#C9A227] outline-none rounded-lg p-2.5 text-xs font-mono font-bold uppercase"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#D8D2C5] mb-1">Class Name / Description *</label>
                <input
                  type="text"
                  value={editingClass.name}
                  onChange={(e) => setEditingClass({ ...editingClass, name: e.target.value })}
                  className="w-full bg-[#141311] border border-[#2A2824] text-[#F8F5ED] focus:border-[#C9A227] outline-none rounded-lg p-2.5 text-xs font-medium"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#D8D2C5] mb-1">Parent Degree Programme *</label>
                <select
                  value={editingClass.programme_id}
                  onChange={(e) => setEditingClass({ ...editingClass, programme_id: Number(e.target.value) })}
                  className="w-full bg-[#141311] border border-[#2A2824] text-[#F8F5ED] focus:border-[#C9A227] outline-none rounded-lg p-2.5 text-xs font-semibold"
                >
                  {programmes.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.code} — {p.name} ({p.department_name})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#D8D2C5] mb-1">Batch</label>
                  <input
                    type="text"
                    value={editingClass.batch_name}
                    onChange={(e) => setEditingClass({ ...editingClass, batch_name: e.target.value })}
                    className="w-full bg-[#141311] border border-[#2A2824] text-[#F8F5ED] focus:border-[#C9A227] outline-none rounded-lg p-2.5 text-xs font-medium"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#D8D2C5] mb-1">Semester</label>
                  <input
                    type="number"
                    value={editingClass.semester_num}
                    onChange={(e) => setEditingClass({ ...editingClass, semester_num: Number(e.target.value) })}
                    min={1}
                    max={8}
                    className="w-full bg-[#141311] border border-[#2A2824] text-[#F8F5ED] focus:border-[#C9A227] outline-none rounded-lg p-2.5 text-xs font-medium"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#D8D2C5] mb-1">Section</label>
                  <input
                    type="text"
                    value={editingClass.section_name}
                    onChange={(e) => setEditingClass({ ...editingClass, section_name: e.target.value })}
                    className="w-full bg-[#141311] border border-[#2A2824] text-[#F8F5ED] focus:border-[#C9A227] outline-none rounded-lg p-2.5 text-xs font-medium uppercase"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#D8D2C5] mb-1">
                  Class Tutor <span className="text-[#9E988A] font-normal">(Optional)</span>
                </label>
                <select
                  value={editingClass.tutor_id || ''}
                  onChange={(e) => setEditingClass({ ...editingClass, tutor_id: e.target.value ? Number(e.target.value) : undefined })}
                  className="w-full bg-[#141311] border border-[#2A2824] text-[#F8F5ED] focus:border-[#C9A227] outline-none rounded-lg p-2.5 text-xs font-medium"
                >
                  <option value="">-- Unassigned / Not Set --</option>
                  {faculties.map((f) => {
                    const assignedClass = classes.find((c: any) => c.tutor_id === f.id && c.id !== editingClass.id);
                    return (
                      <option key={f.id} value={f.id}>
                        {f.full_name} ({f.designation}){assignedClass ? ` — Assigned to ${assignedClass.class_code}` : ''}
                      </option>
                    );
                  })}
                </select>
              </div>

              {/* Conflict Warning Banner for Edit Class Modal */}
              {editingClass.tutor_id && classes.some((c: any) => c.id !== editingClass.id && c.tutor_id === Number(editingClass.tutor_id)) && (
                <div className="bg-[#141311] border border-[#EF4444]/40 rounded-xl p-3 text-xs text-[#EF4444] flex items-start space-x-2 shadow-sm">
                  <AlertCircle className="w-4 h-4 text-[#EF4444] shrink-0 mt-0.5" />
                  <div>
                    <strong className="block font-bold text-[#EF4444] text-[11px]">Tutor Already Assigned</strong>
                    <p className="text-[10px] text-[#D8D2C5] mt-0.5">
                      This faculty member is already assigned as Class Tutor to <strong>{classes.find((c: any) => c.id !== editingClass.id && c.tutor_id === Number(editingClass.tutor_id))?.class_code}</strong>. A tutor cannot be assigned to multiple classes simultaneously.
                    </p>
                  </div>
                </div>
              )}

              <div className="flex justify-end space-x-2 pt-2 border-t border-[#2A2824]">
                <button
                  type="button"
                  onClick={() => setEditingClass(null)}
                  className="bg-[#24231F] hover:bg-[#2E2C27] border border-[#2A2824] text-[#9E988A] text-xs font-semibold px-4 py-2 rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={Boolean(editingClass.tutor_id && classes.some((c: any) => c.id !== editingClass.id && c.tutor_id === Number(editingClass.tutor_id)))}
                  className={`text-xs font-bold px-5 py-2 rounded-lg shadow-sm transition cursor-pointer ${
                    editingClass.tutor_id && classes.some((c: any) => c.id !== editingClass.id && c.tutor_id === Number(editingClass.tutor_id))
                      ? 'bg-[#24231F] text-[#9E988A] cursor-not-allowed opacity-60'
                      : 'bg-[#C9A227] hover:bg-[#B89220] text-[#11110F]'
                  }`}
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT COURSE MODAL */}
      {editingCourse && (
        <div className="fixed inset-0 bg-[#11110F]/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#1C1B18] rounded-2xl border border-[#2A2824] shadow-2xl w-full max-w-md p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-[#2A2824] pb-3">
              <h3 className="text-base font-bold text-[#F8F5ED] flex items-center space-x-2">
                <Edit3 className="w-5 h-5 text-[#C9A227]" />
                <span>Edit Course</span>
              </h3>
              <button onClick={() => setEditingCourse(null)} className="text-[#9E988A] hover:text-[#F8F5ED] font-bold cursor-pointer">✕</button>
            </div>

            <form onSubmit={handleUpdateCourse} className="space-y-4 text-xs">
              <div>
                <label className="block text-xs font-semibold text-[#D8D2C5] mb-1">Course Code *</label>
                <input
                  type="text"
                  value={editingCourse.code}
                  onChange={(e) => setEditingCourse({ ...editingCourse, code: e.target.value })}
                  className="w-full bg-[#141311] border border-[#2A2824] text-[#F8F5ED] focus:border-[#C9A227] outline-none rounded-lg p-2.5 text-xs font-mono font-bold uppercase"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#D8D2C5] mb-1">Course Title *</label>
                <input
                  type="text"
                  value={editingCourse.title}
                  onChange={(e) => setEditingCourse({ ...editingCourse, title: e.target.value })}
                  className="w-full bg-[#141311] border border-[#2A2824] text-[#F8F5ED] focus:border-[#C9A227] outline-none rounded-lg p-2.5 text-xs font-medium"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#D8D2C5] mb-1">Course Type</label>
                  <select
                    value={editingCourse.course_type}
                    onChange={(e) => setEditingCourse({ ...editingCourse, course_type: e.target.value })}
                    className="w-full bg-[#141311] border border-[#2A2824] text-[#F8F5ED] focus:border-[#C9A227] outline-none rounded-lg p-2.5 text-xs font-medium"
                  >
                    <option value="Theory">Theory</option>
                    <option value="Practical">Practical</option>
                    <option value="Theory + Practical">Theory + Practical</option>
                    <option value="Project">Project / Field Work</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#D8D2C5] mb-1">Credits</label>
                  <input
                    type="number"
                    step="0.5"
                    value={editingCourse.credits}
                    onChange={(e) => setEditingCourse({ ...editingCourse, credits: Number(e.target.value) })}
                    min={1}
                    max={12}
                    className="w-full bg-[#141311] border border-[#2A2824] text-[#F8F5ED] focus:border-[#C9A227] outline-none rounded-lg p-2.5 text-xs font-medium"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#D8D2C5] mb-1">Semester Number</label>
                  <input
                    type="number"
                    value={editingCourse.semester_num}
                    onChange={(e) => setEditingCourse({ ...editingCourse, semester_num: Number(e.target.value) })}
                    min={1}
                    max={8}
                    className="w-full bg-[#141311] border border-[#2A2824] text-[#F8F5ED] focus:border-[#C9A227] outline-none rounded-lg p-2.5 text-xs font-medium"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#D8D2C5] mb-1">Regulation</label>
                  <input
                    type="text"
                    value={editingCourse.regulation || '2023'}
                    onChange={(e) => setEditingCourse({ ...editingCourse, regulation: e.target.value })}
                    className="w-full bg-[#141311] border border-[#2A2824] text-[#F8F5ED] focus:border-[#C9A227] outline-none rounded-lg p-2.5 text-xs font-medium"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#D8D2C5] mb-1">Target Programme *</label>
                <select
                  value={editingCourse.programme_id}
                  onChange={(e) => setEditingCourse({ ...editingCourse, programme_id: Number(e.target.value) })}
                  className="w-full bg-[#141311] border border-[#2A2824] text-[#F8F5ED] focus:border-[#C9A227] outline-none rounded-lg p-2.5 text-xs font-semibold"
                >
                  {programmes.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.code} — {p.name} ({p.department_name})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#D8D2C5] mb-1">
                  Assigned Faculty <span className="text-[#9E988A] font-normal">(Optional)</span>
                </label>
                <select
                  value={(editingCourse as any).faculty_id !== undefined ? ((editingCourse as any).faculty_id || '') : (editingCourse.allocated_faculty && editingCourse.allocated_faculty[0] ? editingCourse.allocated_faculty[0].id : '')}
                  onChange={(e) => setEditingCourse({ ...editingCourse, faculty_id: e.target.value ? Number(e.target.value) : null } as any)}
                  className="w-full bg-[#141311] border border-[#2A2824] text-[#F8F5ED] focus:border-[#C9A227] outline-none rounded-lg p-2.5 text-xs font-medium"
                >
                  <option value="">-- Unassigned / Not Set --</option>
                  {faculties.map((f) => (
                    <option key={f.id} value={f.id}>{f.full_name} ({f.designation})</option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end space-x-2 pt-2 border-t border-[#2A2824]">
                <button
                  type="button"
                  onClick={() => setEditingCourse(null)}
                  className="bg-[#24231F] hover:bg-[#2E2C27] border border-[#2A2824] text-[#9E988A] text-xs font-semibold px-4 py-2 rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-[#C9A227] hover:bg-[#B89220] text-[#11110F] text-xs font-bold px-5 py-2 rounded-lg shadow-sm cursor-pointer"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT ALLOCATION MODAL */}
      {editingAlloc && (
        <div className="fixed inset-0 bg-[#11110F]/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#1C1B18] rounded-2xl border border-[#2A2824] shadow-2xl w-full max-w-md p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-[#2A2824] pb-3">
              <h3 className="text-base font-bold text-[#F8F5ED] flex items-center space-x-2">
                <Edit3 className="w-5 h-5 text-[#C9A227]" />
                <span>Edit Faculty Course Allocation</span>
              </h3>
              <button onClick={() => setEditingAlloc(null)} className="text-[#9E988A] hover:text-[#F8F5ED] font-bold cursor-pointer">✕</button>
            </div>

            <form onSubmit={handleUpdateAllocation} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#D8D2C5] mb-1">Academic Year</label>
                  <input
                    type="text"
                    value={editingAlloc.academic_year}
                    onChange={(e) => setEditingAlloc({ ...editingAlloc, academic_year: e.target.value })}
                    className="w-full bg-[#141311] border border-[#2A2824] text-[#F8F5ED] focus:border-[#C9A227] outline-none rounded-lg p-2.5 text-xs font-medium"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#D8D2C5] mb-1">Semester Number</label>
                  <input
                    type="number"
                    value={editingAlloc.semester_num}
                    onChange={(e) => setEditingAlloc({ ...editingAlloc, semester_num: Number(e.target.value) })}
                    className="w-full bg-[#141311] border border-[#2A2824] text-[#F8F5ED] focus:border-[#C9A227] outline-none rounded-lg p-2.5 text-xs font-medium"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#D8D2C5] mb-1">Section</label>
                  <input
                    type="text"
                    value={editingAlloc.section_name}
                    onChange={(e) => setEditingAlloc({ ...editingAlloc, section_name: e.target.value })}
                    className="w-full bg-[#141311] border border-[#2A2824] text-[#F8F5ED] focus:border-[#C9A227] outline-none rounded-lg p-2.5 text-xs font-medium uppercase"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#D8D2C5] mb-1">Batch</label>
                  <input
                    type="text"
                    value={editingAlloc.batch_name}
                    onChange={(e) => setEditingAlloc({ ...editingAlloc, batch_name: e.target.value })}
                    className="w-full bg-[#141311] border border-[#2A2824] text-[#F8F5ED] focus:border-[#C9A227] outline-none rounded-lg p-2.5 text-xs font-medium"
                    required
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-2 border-t border-[#2A2824]">
                <button
                  type="button"
                  onClick={() => setEditingAlloc(null)}
                  className="bg-[#24231F] hover:bg-[#2E2C27] border border-[#2A2824] text-[#9E988A] text-xs font-semibold px-4 py-2 rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-[#C9A227] hover:bg-[#B89220] text-[#11110F] text-xs font-bold px-5 py-2 rounded-lg shadow-sm cursor-pointer"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
