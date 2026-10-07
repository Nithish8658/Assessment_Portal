import React, { useState } from 'react';
import * as XLSX from 'xlsx';
import apiClient from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { Upload, FileSpreadsheet, CheckCircle2, AlertCircle, ArrowRight, ShieldAlert, Check, RefreshCw } from 'lucide-react';

interface ExcelStudentImporterProps {
  onSuccess?: () => void;
}

export const ExcelStudentImporter: React.FC<ExcelStudentImporterProps> = ({ onSuccess }) => {
  const { user } = useAuth();

  // Class tutor options
  const [selectedProgId, setSelectedProgId] = useState<number>(1); // Default 1 (BCA)
  const [selectedSection, setSelectedSection] = useState<string>('A');
  const [batchName, setBatchName] = useState<string>('2023-2026');
  const [programmesList, setProgrammesList] = useState<any[]>([]);

  React.useEffect(() => {
    apiClient.get(`/users/my-department-programmes?user_id=${user?.id || 1}`)
      .then(res => {
        const progs = Array.isArray(res.data) ? res.data : (res.data.programmes || []);
        setProgrammesList(progs);
        if (progs.length > 0) {
          setSelectedProgId(progs[0].id);
        }
      })
      .catch(() => { });
  }, [user]);

  // Excel parsing state
  const [fileName, setFileName] = useState<string>('');
  const [headers, setHeaders] = useState<string[]>([]);
  const [rawRows, setRawRows] = useState<any[]>([]);

  // 5 Target Field Mappings
  const [nameCol, setNameCol] = useState<string>('');
  const [regNoCol, setRegNoCol] = useState<string>('');
  const [batchCol, setBatchCol] = useState<string>('');
  const [emailCol, setEmailCol] = useState<string>('');
  const [semCol, setSemCol] = useState<string>('');
  const [defaultSemester, setDefaultSemester] = useState<number>(4);

  // UI Flow state
  const [step, setStep] = useState<1 | 2 | 3>(1); // 1: Upload, 2: Map & Preview, 3: Submitted
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Auto-detect best column matches
  const autoDetectColumns = (cols: string[]) => {
    const lowerCols = cols.map(c => c.toLowerCase().trim());

    // Name detection
    const nameMatch = cols.find((_, i) =>
      ['name'].includes(lowerCols[i])
    ) || cols.find(c => c.toLowerCase().includes('name')) || '';

    // Register Number detection
    const regMatch = cols.find((_, i) =>
      ['univregno'].includes(lowerCols[i])
    ) || cols.find(c => c.toLowerCase().includes('reg') || c.toLowerCase().includes('roll')) || '';

    // Batch detection
    const batchMatch = cols.find((_, i) =>
      ['batch'].includes(lowerCols[i])
    ) || cols.find(c => c.toLowerCase().includes('batch')) || '';

    // Email detection
    const emailMatch = cols.find((_, i) =>
      ['email'].includes(lowerCols[i])
    ) || cols.find(c => c.toLowerCase().includes('email') || c.toLowerCase().includes('mail')) || '';

    const semMatch = cols.find((_, i) =>
      ['current sem/year'].includes(lowerCols[i])
    ) || cols.find(c => c.toLowerCase().includes('sem') || c.toLowerCase().includes('semester')) || '';

    setNameCol(nameMatch);
    setRegNoCol(regMatch);
    setBatchCol(batchMatch);
    setEmailCol(emailMatch);
    setSemCol(semMatch);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setErrorMsg(null);

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];

        // Parse JSON output
        const data: any[] = XLSX.utils.sheet_to_json(ws, { header: 1 });
        if (data.length < 2) {
          setErrorMsg("The selected Excel file is empty or does not contain a header row.");
          return;
        }

        const rawHeaders = (data[0] || []).map((h: any) => String(h || '').trim()).filter(Boolean);
        const rows = data.slice(1).filter((r: any[]) => r && r.some(cell => cell !== undefined && cell !== ''));

        setHeaders(rawHeaders);
        setRawRows(rows);
        autoDetectColumns(rawHeaders);
        setStep(2);
      } catch (err: any) {
        setErrorMsg(`Failed to parse Excel file: ${err.message || 'Unknown error'}`);
      }
    };
    reader.readAsBinaryString(file);
  };

  const getMappedStudents = () => {
    return rawRows.map((row) => {
      const getVal = (colName: string) => {
        if (!colName) return '';
        const idx = headers.indexOf(colName);
        if (idx === -1) return '';
        return String(row[idx] || '').trim();
      };

      const fullName = getVal(nameCol);
      const regNo = getVal(regNoCol);
      const batch = getVal(batchCol) || batchName;
      const semNum = Number(getVal(semCol)) || defaultSemester;
      let email = getVal(emailCol);
      if (!email && regNo) {
        email = `${regNo.toLowerCase()}@nasccbe.ac.in`;
      }

      return {
        full_name: fullName,
        register_number: regNo,
        batch_name: batch,
        semester_num: semNum,
        email: email,
        section_name: selectedSection
      };
    }).filter(s => s.full_name && s.register_number);
  };

  const handleSubmitForApproval = async () => {
    const students = getMappedStudents();
    if (students.length === 0) {
      setErrorMsg("No valid students found. Ensure Name and UnivregNo columns are mapped.");
      return;
    }

    setSubmitting(true);
    setErrorMsg(null);

    try {
      await apiClient.post('/users/upload-roster-staging', {
        programme_id: selectedProgId,
        section_name: selectedSection,
        batch_name: batchName,
        default_semester: defaultSemester,
        uploaded_by_id: user?.id || 1,
        source_filename: fileName,
        students: students
      });

      setSubmitting(false);
      setStep(3);
      if (onSuccess) onSuccess();
    } catch (err: any) {
      setSubmitting(false);
      setErrorMsg(err.response?.data?.detail || "Failed to submit roster for approval.");
    }
  };

  const mappedPreview = getMappedStudents();

  return (
    <div className="bg-[#1C1B18] rounded-2xl border border-[#2A2824] shadow-sm overflow-hidden">
      {/* Header Banner */}
      <div className="bg-[#141311] p-5 text-[#F8F5ED] border-b border-[#2A2824] flex items-center justify-between">
        <div>
          <div className="flex items-center space-x-2 text-xs font-semibold text-[#C9A227] uppercase tracking-wider">
            <FileSpreadsheet className="w-4 h-4 text-[#C9A227]" />
            <span>ICampus Excel Roster Upload — Class Tutor Portal</span>
          </div>
          <h3 className="text-lg font-bold mt-1 text-[#F8F5ED]">Upload & Map Student Data</h3>
        </div>
        <div className="hidden sm:flex items-center space-x-1.5 text-xs bg-[#F59E0B]/10 border border-[#F59E0B]/30 text-[#F59E0B] px-3 py-1.5 rounded-lg">
          <ShieldAlert className="w-4 h-4 text-[#F59E0B] shrink-0" />
          <span>Requires HoD Approval</span>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {errorMsg && (
          <div className="p-4 bg-[#141311] border border-[#EF4444]/40 text-[#EF4444] rounded-xl text-sm flex items-start space-x-3">
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-[#EF4444]" />
            <div>
              <div className="font-semibold">Error</div>
              <div>{errorMsg}</div>
            </div>
          </div>
        )}

        {/* STEP 1: Upload File & Select Class */}
        {step === 1 && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-[#141311] p-4 rounded-xl border border-[#2A2824]">
              <div>
                <label className="block text-xs font-semibold text-[#D8D2C5] mb-1">
                  Assigned Department Class / Programme
                </label>
                <select
                  value={selectedProgId}
                  onChange={(e) => setSelectedProgId(Number(e.target.value))}
                  className="w-full text-xs bg-[#1C1B18] text-[#F8F5ED] border border-[#2A2824] rounded-lg px-3 py-2 focus:border-[#C9A227] outline-none"
                >
                  {programmesList.length > 0 ? (
                    programmesList.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.code} - {p.name} ({p.department_name || 'CS'})
                      </option>
                    ))
                  ) : (
                    <>
                      <option value={1}>BCA - Bachelor of Computer Applications</option>
                      <option value={2}>BCOM - Bachelor of Commerce</option>
                      <option value={3}>BSCM - Bachelor of Science Mathematics</option>
                    </>
                  )}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#D8D2C5] mb-1">Section</label>
                <select
                  value={selectedSection}
                  onChange={(e) => setSelectedSection(e.target.value)}
                  className="w-full text-xs bg-[#1C1B18] text-[#F8F5ED] border border-[#2A2824] rounded-lg px-3 py-2 focus:border-[#C9A227] outline-none"
                >
                  <option value="A">Section A</option>
                  <option value="B">Section B</option>
                  <option value="C">Section C</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#D8D2C5] mb-1">Default Batch Year</label>
                <input
                  type="text"
                  value={batchName}
                  onChange={(e) => setBatchName(e.target.value)}
                  placeholder="e.g. 2023-2026"
                  className="w-full text-xs bg-[#1C1B18] text-[#F8F5ED] border border-[#2A2824] rounded-lg px-3 py-2 focus:border-[#C9A227] outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#D8D2C5] mb-1">Default Current Sem</label>
                <input
                  type="number"
                  value={defaultSemester}
                  onChange={(e) => setDefaultSemester(Number(e.target.value))}
                  placeholder="e.g. 4"
                  className="w-full text-xs bg-[#1C1B18] text-[#F8F5ED] border border-[#2A2824] rounded-lg px-3 py-2 focus:border-[#C9A227] outline-none"
                />
              </div>
            </div>

            {/* Drag and Drop Zone */}
            <div className="border-2 border-dashed border-[#2A2824] hover:border-[#C9A227] bg-[#141311]/50 hover:bg-[#141311] transition rounded-2xl p-8 text-center cursor-pointer relative group">
              <input
                type="file"
                accept=".xlsx, .xls, .csv"
                onChange={handleFileUpload}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
              <div className="flex flex-col items-center justify-center space-y-3">
                <div className="w-14 h-14 bg-[#24231F] text-[#C9A227] rounded-2xl flex items-center justify-center group-hover:scale-110 transition">
                  <Upload className="w-7 h-7" />
                </div>
                <div>
                  <div className="text-base font-bold text-[#F8F5ED]">Drop your ICampus Excel / CSV file here</div>
                  <div className="text-xs text-[#9E988A] mt-1">Supports files with N arbitrary columns (.xlsx, .xls, .csv)</div>
                </div>
                <button type="button" className="text-xs font-semibold bg-[#C9A227] text-[#11110F] px-4 py-2 rounded-lg shadow-sm hover:bg-[#B89220] transition cursor-pointer">
                  Browse File
                </button>
              </div>
            </div>
          </div>
        )}

        {/* STEP 2: Map & Preview */}
        {step === 2 && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between bg-[#141311] p-4 rounded-xl border border-[#2A2824] gap-3">
              <div>
                <div className="text-sm font-bold text-[#F8F5ED] flex items-center space-x-2">
                  <FileSpreadsheet className="w-4 h-4 text-[#C9A227]" />
                  <span>File Parsed: {fileName}</span>
                </div>
                <div className="text-xs text-[#9E988A] mt-0.5">
                  Found <span className="font-semibold text-[#F8F5ED]">{headers.length}</span> column headers and <span className="font-semibold text-[#F8F5ED]">{rawRows.length}</span> student records.
                </div>
              </div>

              <button
                onClick={() => { setStep(1); setRawRows([]); }}
                className="text-xs text-[#D8D2C5] hover:text-[#F8F5ED] bg-[#1C1B18] border border-[#2A2824] px-3 py-1.5 rounded-lg flex items-center space-x-1 cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Upload Different File</span>
              </button>
            </div>

            {/* Column Mapping Selectors */}
            <div className="bg-[#141311] p-5 rounded-2xl border border-[#2A2824] space-y-4">
              <div className="text-xs font-bold text-[#E3C766] uppercase tracking-wider flex items-center justify-between">
                <span>Field Column Mapping (Auto Detection)</span>
                <span className="text-[11px] text-[#9E988A] font-normal">Select matching headers from your file</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                <div>
                  <label className="block text-xs font-bold text-[#D8D2C5] mb-1 flex items-center justify-between">
                    <span>1. Name *</span>
                    {nameCol && <Check className="w-3.5 h-3.5 text-[#4ADE80]" />}
                  </label>
                  <select
                    value={nameCol}
                    onChange={(e) => setNameCol(e.target.value)}
                    className="w-full text-xs bg-[#1C1B18] text-[#F8F5ED] border border-[#2A2824] rounded-lg p-2 font-medium focus:border-[#C9A227]"
                  >
                    <option value="">-- Select Column --</option>
                    {headers.map(h => <option key={h} value={h}>{h}</option>)}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#D8D2C5] mb-1 flex items-center justify-between">
                    <span>2. UnivregNo *</span>
                    {regNoCol && <Check className="w-3.5 h-3.5 text-[#4ADE80]" />}
                  </label>
                  <select
                    value={regNoCol}
                    onChange={(e) => setRegNoCol(e.target.value)}
                    className="w-full text-xs bg-[#1C1B18] text-[#F8F5ED] border border-[#2A2824] rounded-lg p-2 font-medium focus:border-[#C9A227]"
                  >
                    <option value="">-- Select Column --</option>
                    {headers.map(h => <option key={h} value={h}>{h}</option>)}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#D8D2C5] mb-1 flex items-center justify-between">
                    <span>3. Batch</span>
                    {batchCol && <Check className="w-3.5 h-3.5 text-[#4ADE80]" />}
                  </label>
                  <select
                    value={batchCol}
                    onChange={(e) => setBatchCol(e.target.value)}
                    className="w-full text-xs bg-[#1C1B18] text-[#F8F5ED] border border-[#2A2824] rounded-lg p-2 font-medium focus:border-[#C9A227]"
                  >
                    <option value="">Default ({batchName})</option>
                    {headers.map(h => <option key={h} value={h}>{h}</option>)}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#D8D2C5] mb-1 flex items-center justify-between">
                    <span>4. Current Sem</span>
                    {semCol && <Check className="w-3.5 h-3.5 text-[#4ADE80]" />}
                  </label>
                  <select
                    value={semCol}
                    onChange={(e) => setSemCol(e.target.value)}
                    className="w-full text-xs bg-[#1C1B18] text-[#F8F5ED] border border-[#2A2824] rounded-lg p-2 font-medium focus:border-[#C9A227]"
                  >
                    <option value="">Default ({defaultSemester})</option>
                    {headers.map(h => <option key={h} value={h}>{h}</option>)}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#D8D2C5] mb-1 flex items-center justify-between">
                    <span>5. Email</span>
                    {emailCol && <Check className="w-3.5 h-3.5 text-[#4ADE80]" />}
                  </label>
                  <select
                    value={emailCol}
                    onChange={(e) => setEmailCol(e.target.value)}
                    className="w-full text-xs bg-[#1C1B18] text-[#F8F5ED] border border-[#2A2824] rounded-lg p-2 font-medium focus:border-[#C9A227]"
                  >
                    <option value="">Auto-generate (@nasccbe.ac.in)</option>
                    {headers.map(h => <option key={h} value={h}>{h}</option>)}
                  </select>
                </div>
              </div>
            </div>

            {/* Staging Data Live Preview Table */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-[#D8D2C5] uppercase tracking-wider">
                  Live Preview of Extracted Data ({mappedPreview.length} Records)
                </h4>
                <span className="text-xs text-[#F59E0B] bg-[#F59E0B]/10 px-2 py-0.5 rounded border border-[#F59E0B]/25 font-medium">
                  Staging Mode (Pending HoD Approval)
                </span>
              </div>

              <div className="max-h-64 overflow-y-auto border border-[#2A2824] rounded-xl shadow-inner">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#141311] text-[#9E988A] font-semibold sticky top-0 border-b border-[#2A2824]">
                    <tr>
                      <th className="py-2.5 px-4">#</th>
                      <th className="py-2.5 px-4">Name</th>
                      <th className="py-2.5 px-4">UnivregNo</th>
                      <th className="py-2.5 px-4">Batch</th>
                      <th className="py-2.5 px-4">Current Sem</th>
                      <th className="py-2.5 px-4">Email</th>
                      <th className="py-2.5 px-4">Section</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#2A2824]">
                    {mappedPreview.map((s, idx) => (
                      <tr key={idx} className="hover:bg-[#24231F]">
                        <td className="py-2 px-4 text-[#9E988A]">{idx + 1}</td>
                        <td className="py-2 px-4 font-semibold text-[#F8F5ED]">{s.full_name}</td>
                        <td className="py-2 px-4 text-[#C9A227] font-mono font-medium">{s.register_number}</td>
                        <td className="py-2 px-4 text-[#D8D2C5]">{s.batch_name}</td>
                        <td className="py-2 px-4 text-[#F8F5ED] font-bold">{s.semester_num}</td>
                        <td className="py-2 px-4 text-[#9E988A]">{s.email}</td>
                        <td className="py-2 px-4"><span className="bg-[#24231F] text-[#E3C766] px-2 py-0.5 rounded text-[10px] font-bold">{selectedSection}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Action Bar */}
            <div className="flex flex-col sm:flex-row items-center justify-between pt-4 border-t border-[#2A2824] gap-3">
              <div className="text-xs text-[#9E988A] flex items-center space-x-1.5">
                <ShieldAlert className="w-4 h-4 text-[#F59E0B]" />
                <span>Notice: Direct loading to main DB is locked for tutors. Submit will alert HoD for approval.</span>
              </div>

              <button
                onClick={handleSubmitForApproval}
                disabled={submitting || mappedPreview.length === 0}
                className="w-full sm:w-auto bg-[#C9A227] hover:bg-[#B89220] text-[#11110F] px-6 py-2.5 rounded-xl font-bold text-xs shadow-md flex items-center justify-center space-x-2 disabled:opacity-50 transition cursor-pointer"
              >
                {submitting ? (
                  <span>Submitting Batch...</span>
                ) : (
                  <>
                    <span>Submit Roster to HoD for Approval</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: Submission Confirmation */}
        {step === 3 && (
          <div className="p-8 text-center space-y-4">
            <div className="w-16 h-16 bg-[#4ADE80]/15 border border-[#4ADE80]/30 text-[#4ADE80] rounded-full flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-[#F8F5ED]">Roster Upload Submitted Successfully!</h3>
              <p className="text-sm text-[#D8D2C5] mt-1 max-w-md mx-auto">
                Your student roster containing {mappedPreview.length} records has been saved into the staging queue for <span className="font-semibold text-[#E3C766]">HoD Review & Approval</span>.
              </p>
            </div>

            <div className="bg-[#141311] border border-[#2A2824] rounded-xl p-4 max-w-md mx-auto text-xs text-[#D8D2C5] space-y-1 text-left">
              <div className="font-bold flex items-center space-x-1.5 text-[#F59E0B]">
                <ShieldAlert className="w-4 h-4 text-[#F59E0B]" />
                <span>Approval Workflow Notice</span>
              </div>
              <div>• HoD will inspect the uploaded student records and can edit any details.</div>
              <div>• The student accounts will be created in the database immediately upon HoD approval.</div>
            </div>

            <button
              onClick={() => { setStep(1); setRawRows([]); }}
              className="bg-[#C9A227] hover:bg-[#B89220] text-[#11110F] font-bold px-6 py-2.5 rounded-xl text-xs shadow-sm transition cursor-pointer"
            >
              Upload Another Class Roster
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
