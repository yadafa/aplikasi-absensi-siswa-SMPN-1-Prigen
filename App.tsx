
import React, { useState, useRef, useEffect } from 'react';
import { 
  LayoutDashboard, 
  ScanLine, 
  Users, 
  FileText, 
  LogOut, 
  ClipboardList,
  Menu,
  X,
  LogIn,
  LogOut as LogOutIcon,
  UserCheck,
  AlertCircle,
  ChevronDown,
  ChevronRight,
  Sun,
  Moon,
  GraduationCap,
  Presentation,
  UserCog,
  User,
  Search,
  CreditCard,
  Edit,
  Trash2,
  Download,
  Upload,
  Camera,
  Plus,
  Mail,
  Lock,
  Save,
  Clock,
  Filter,
  Calendar,
  Printer,
  FileSpreadsheet,
  Trophy,
  TrendingDown,
  FileDown,
  MessageCircle,
  Smartphone
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Page, Student, AttendanceRecord, ClassRoom, PicketTeacher, AppSettings } from './types';
import { Button } from './components/Button';
import { Card } from './components/Card';
import { generateAttendanceReport } from './services/geminiService';

// --- HELPER: LocalStorage Hook ---
function useLocalStorage<T>(key: string, initialValue: T) {
  // Get from local storage then parse stored json or return initialValue
  const readValue = () => {
    if (typeof window === 'undefined') {
      return initialValue;
    }
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.warn(`Error reading localStorage key “${key}”:`, error);
      return initialValue;
    }
  };

  const [storedValue, setStoredValue] = useState<T>(readValue);

  // Return a wrapped version of useState's setter function that ...
  // ... persists the new value to localStorage.
  const setValue = (value: T | ((val: T) => T)) => {
    try {
      // Allow value to be a function so we have same API as useState
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(key, JSON.stringify(valueToStore));
      }
    } catch (error) {
      console.warn(`Error setting localStorage key “${key}”:`, error);
    }
  };

  return [storedValue, setValue] as const;
}

// --- HELPER: Convert File to Base64 ---
const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (error) => reject(error);
  });
};

// --- INITIAL MOCK DATA (Used only if LocalStorage is empty) ---
const DEFAULT_STUDENTS: Student[] = [
  { 
    id: '1', rfid_code: '0011225812', nis: '32145675456', name: 'MUH. NUR ISHAK', class_name: 'Dua', gender: 'L', 
    student_phone: '081219745706', guardian_name: 'MUSLIMIN', guardian_phone: '082349570511' 
  },
  { 
    id: '2', rfid_code: '0011225808', nis: '55456785456', name: 'Arief Hidayat', class_name: 'Dua', gender: 'L', 
    student_phone: '08456789654', guardian_name: 'Robert', guardian_phone: '08789456123',
    photo_url: 'https://ui-avatars.com/api/?name=Arief+Hidayat&background=random'
  },
  { 
    id: '3', rfid_code: '0011225813', nis: '9879873216', name: 'Wati indi', class_name: 'Dua', gender: 'P', 
    student_phone: '98765432198', guardian_name: 'Samidi', guardian_phone: '98765432198',
    photo_url: 'https://ui-avatars.com/api/?name=Wati+indi&background=random'
  },
  { 
    id: '4', rfid_code: '0011225811', nis: '9876543218', name: 'Eko sugimo', class_name: 'Dua', gender: 'L', 
    student_phone: '9876543219', guardian_name: 'Sutarno', guardian_phone: '9876543219',
    photo_url: 'https://ui-avatars.com/api/?name=Eko+sugimo&background=random'
  },
  { 
    id: '5', rfid_code: '0011225814', nis: '6543219875', name: 'Galih sutejo', class_name: 'Satu', gender: 'L', 
    student_phone: '6543219875', guardian_name: 'Sugiyanto', guardian_phone: '6543219875',
    photo_url: 'https://ui-avatars.com/api/?name=Galih+sutejo&background=random'
  },
];

const DEFAULT_CLASSES: ClassRoom[] = [
  { id: '1', name: 'Satu', homeroom_teacher: 'Budi Santoso' },
  { id: '2', name: 'Dua', homeroom_teacher: 'Siti Aminah' },
  { id: '3', name: 'Tiga', homeroom_teacher: 'Agus Setiawan' },
];

const DEFAULT_TEACHERS: PicketTeacher[] = [
  { id: '1', username: 'piket_pagi', email: 'piket.pagi@sekolah.sch.id', password: 'password123' },
  { id: '2', username: 'piket_siang', email: 'piket.siang@sekolah.sch.id', password: 'password123' },
];

const DEFAULT_SETTINGS: AppSettings = {
  appName: 'Anoza',
  appLogo: '',
  checkInTime: '07:00',
  checkOutTime: '15:00',
  waTemplate: "Halo Bapak/Ibu *{guardian}*, diinformasikan bahwa siswa *{student}* telah melakukan absensi *{status}* pada pukul *{time}*.",
  whatsappToken: "",
};


// --- Components defined within App.tsx ---

// 1. LOGIN COMPONENT
const Login = ({ onLogin, teachers, appSettings }: { onLogin: (user: any) => void, teachers: PicketTeacher[], appSettings: AppSettings }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Check Hardcoded Admin
    if (username === 'admin' && password === 'admin') {
      onLogin({ username: 'Administrator', role: 'admin' });
      return;
    }

    // Check against Teachers Data
    const teacher = teachers.find(t => t.username === username && t.password === password);
    
    if (teacher) {
      onLogin(teacher);
    } else {
      setError('Username atau password salah. Silakan coba lagi.');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100 dark:bg-[#1e1e2f] p-4 transition-colors duration-300">
      <div className="bg-white dark:bg-[#27293d] p-8 rounded-2xl shadow-2xl w-full max-w-md border border-slate-200 dark:border-[#2b2d42]">
        <div className="text-center mb-8">
          <div className="flex flex-col items-center justify-center gap-3 mb-4">
             {appSettings.appLogo ? (
               <div className="w-24 h-24 rounded-2xl overflow-hidden bg-slate-50 dark:bg-[#1e1e2f] p-2 mb-2 border border-slate-200 dark:border-[#35374d]">
                  <img src={appSettings.appLogo} alt="Logo" className="w-full h-full object-contain" />
               </div>
             ) : (
                <div className="w-16 h-16 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-600/20 mb-2">
                   <span className="font-bold text-white text-3xl">{appSettings.appName.charAt(0)}</span>
                </div>
             )}
             <h1 className="text-3xl font-bold text-slate-800 dark:text-white">{appSettings.appName}</h1>
          </div>
          <p className="text-slate-500 dark:text-slate-400 mt-2">Login Dashboard</p>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-slate-500 dark:text-slate-400 mb-2">Username</label>
            <input 
              type="text" 
              className="w-full px-4 py-3 bg-slate-50 dark:bg-[#1e1e2f] border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all placeholder-slate-400 dark:placeholder-slate-600"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Username"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-500 dark:text-slate-400 mb-2">Password</label>
            <input 
              type="password" 
              className="w-full px-4 py-3 bg-slate-50 dark:bg-[#1e1e2f] border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all placeholder-slate-400 dark:placeholder-slate-600"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
            />
          </div>
          {error && <p className="text-red-500 dark:text-red-400 text-sm flex items-center gap-2"><AlertCircle size={14}/> {error}</p>}
          <Button type="submit" className="w-full justify-center py-3 text-lg">Masuk</Button>
        </form>
      </div>
    </div>
  );
};

// 2. DASHBOARD COMPONENT
const Dashboard = ({ 
  students, 
  records, 
  classes, 
  teachers, 
  currentUser 
}: { 
  students: Student[], 
  records: AttendanceRecord[], 
  classes: ClassRoom[], 
  teachers: PicketTeacher[],
  currentUser: any 
}) => {
  const today = new Date().toISOString().split('T')[0];
  
  // Calculate present unique students (Hadir or Terlambat)
  const presentCount = new Set(
    records
      .filter(r => r.date_str === today && (r.status === 'Hadir' || r.status === 'Terlambat'))
      .map(r => r.student_id)
  ).size;

  const totalStudents = students.length;
  const absentCount = Math.max(0, totalStudents - presentCount);
  const percentage = totalStudents > 0 ? ((presentCount / totalStudents) * 100).toFixed(1) : "0.0";
  
  // Prepare Bar Chart Data (Group by Hour)
  const todayRecords = records.filter(r => r.date_str === today && (r.status === 'Hadir' || r.status === 'Terlambat'));
  const hourlyData: Record<string, number> = {};
  
  todayRecords.forEach(r => {
    const hour = r.time_str.split(':')[0]; // Extract hour "07" from "07:30"
    hourlyData[hour] = (hourlyData[hour] || 0) + 1;
  });

  // Sort hours and create array
  const barData = Object.keys(hourlyData).sort().map(hour => ({
    name: `${hour}:00`,
    val: hourlyData[hour]
  }));

  // If no data, show dummy empty range for visual consistency
  if (barData.length === 0) {
    barData.push({ name: '07:00', val: 0 });
    barData.push({ name: '08:00', val: 0 });
  }

  const pieData = [
    { name: 'Hadir', value: presentCount, color: '#06b6d4' }, // Cyan
    { name: 'Belum Hadir', value: absentCount, color: '#64748b' }, // Slate
  ];

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Dashboard Absensi Hari ini</h2>
        <div className="bg-blue-600/10 dark:bg-blue-600/20 border border-blue-500/30 text-blue-600 dark:text-blue-300 px-4 py-2 rounded-lg flex items-center gap-2">
          <UserCheck size={18} />
          <span>Halo, <strong>{currentUser?.username || 'Admin'}</strong></span>
        </div>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Card 1: Siswa */}
        <div className="bg-white dark:bg-[#27293d] rounded-xl p-6 flex flex-col gap-4 shadow-sm dark:shadow-none border border-slate-200 dark:border-transparent">
           <div className="bg-indigo-500 w-12 h-12 rounded-lg flex items-center justify-center text-white shadow-lg shadow-indigo-500/30">
             <GraduationCap size={24} />
           </div>
           <div>
             <p className="text-slate-500 dark:text-slate-400 text-sm">Total Siswa</p>
             <p className="text-2xl font-bold text-slate-800 dark:text-white mt-1">{totalStudents}</p>
           </div>
        </div>

        {/* Card 2: Kelas */}
        <div className="bg-white dark:bg-[#27293d] rounded-xl p-6 flex flex-col gap-4 shadow-sm dark:shadow-none border border-slate-200 dark:border-transparent">
           <div className="bg-cyan-500 w-12 h-12 rounded-lg flex items-center justify-center text-white shadow-lg shadow-cyan-500/30">
             <Presentation size={24} />
           </div>
           <div>
             <p className="text-slate-500 dark:text-slate-400 text-sm">Total Kelas</p>
             <p className="text-2xl font-bold text-slate-800 dark:text-white mt-1">{classes.length}</p>
           </div>
        </div>

        {/* Card 3: Admin/Teachers */}
        <div className="bg-white dark:bg-[#27293d] rounded-xl p-6 flex flex-col gap-4 shadow-sm dark:shadow-none border border-slate-200 dark:border-transparent">
           <div className="bg-pink-500 w-12 h-12 rounded-lg flex items-center justify-center text-white shadow-lg shadow-pink-500/30">
             <UserCog size={24} />
           </div>
           <div>
             <p className="text-slate-500 dark:text-slate-400 text-sm">Total Guru/Admin</p>
             <p className="text-2xl font-bold text-slate-800 dark:text-white mt-1">{teachers.length + 1}</p>
           </div>
        </div>

        {/* Card 4: Hadir */}
        <div className="bg-white dark:bg-[#27293d] rounded-xl p-6 flex flex-col gap-4 shadow-sm dark:shadow-none border border-slate-200 dark:border-transparent">
           <div className="bg-orange-500 w-12 h-12 rounded-lg flex items-center justify-center text-white shadow-lg shadow-orange-500/30">
             <UserCheck size={24} />
           </div>
           <div>
             <p className="text-slate-500 dark:text-slate-400 text-sm">Hadir Hari Ini</p>
             <p className="text-2xl font-bold text-slate-800 dark:text-white mt-1">{presentCount}</p>
           </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-80">
        {/* Bar Chart */}
        <Card className="lg:col-span-2 flex flex-col" title="Tren Kedatangan Siswa (Per Jam)">
          <div className="flex-1 w-full min-h-0">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#35374d" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#9ca3af', fontSize: 12}} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#9ca3af', fontSize: 12}} allowDecimals={false} />
                <Tooltip 
                  cursor={{fill: '#35374d'}} 
                  contentStyle={{backgroundColor: 'var(--tooltip-bg)', borderRadius: '8px', border: '1px solid #35374d', color: 'var(--tooltip-text)'}}
                />
                <Bar dataKey="val" name="Jumlah Siswa" fill="#4f46e5" radius={[4, 4, 0, 0]} barSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Pie Chart */}
        <Card className="flex flex-col" title="Persentase Kehadiran">
          <div className="flex-1 w-full min-h-0 relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={0}
                  dataKey="value"
                  stroke="none"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-2xl font-bold text-slate-800 dark:text-white">{percentage}%</span>
                <span className="text-xs text-slate-500">Hadir</span>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

// 3. PRESENSI (RFID SCANNER) COMPONENT
const AttendanceScanner = ({ 
  students, 
  records,
  onScan,
  initialMode = 'masuk'
}: { 
  students: Student[], 
  records: AttendanceRecord[],
  onScan: (student: Student, status: AttendanceRecord['status'], description?: string) => boolean,
  initialMode?: 'masuk' | 'pulang' | 'izin'
}) => {
  const [rfidInput, setRfidInput] = useState('');
  const [description, setDescription] = useState('');
  const [permissionType, setPermissionType] = useState<'Izin' | 'Sakit' | 'Alpha'>('Sakit');
  const [lastScanned, setLastScanned] = useState<Student | null>(null);
  const [lastStatus, setLastStatus] = useState<AttendanceRecord['status'] | null>(null);
  const [lastTime, setLastTime] = useState<string>('');
  const [message, setMessage] = useState('Silahkan tempelkan kartu RFID');
  const [mode, setMode] = useState(initialMode);
  const inputRef = useRef<HTMLInputElement>(null);

  const today = new Date().toISOString().split('T')[0];
  const todayRecords = records.filter(r => r.date_str === today);
  const sortedRecords = [...todayRecords].sort((a, b) => b.timestamp - a.timestamp);

  useEffect(() => {
    setMode(initialMode);
    setMessage('Silahkan tempelkan kartu RFID');
    setDescription('');
    setRfidInput('');
    setPermissionType('Sakit');
  }, [initialMode]);

  useEffect(() => {
    const handleDocumentClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target.closest('input, select, textarea, button')) {
        return;
      }
      inputRef.current?.focus();
    };
    inputRef.current?.focus();
    document.addEventListener('click', handleDocumentClick);
    return () => document.removeEventListener('click', handleDocumentClick);
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      processScan();
    }
  };

  const processScan = () => {
    const code = rfidInput.trim();
    if (!code) return;

    const student = students.find(s => s.rfid_code === code);
    const now = new Date();
    const timeStr = now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

    if (student) {
      let status: AttendanceRecord['status'] = 'Hadir';
      if (mode === 'masuk') {
        const hour = now.getHours();
        status = hour >= 8 ? 'Terlambat' : 'Hadir'; 
      } else if (mode === 'pulang') {
        status = 'Pulang';
      } else if (mode === 'izin') {
        status = permissionType;
      }

      const success = onScan(student, status, description);
      setLastScanned(student);
      setLastStatus(status);
      setLastTime(`${today} ${timeStr}`);

      if (success) {
        setMessage(`Berhasil: ${student.name}`);
      } else {
        setMessage(`Sudah Absen: ${student.name}`);
      }
    } else {
      setLastScanned(null);
      setLastStatus(null);
      setMessage(`Kartu tidak dikenal (${code})`);
    }
    setRfidInput('');
  };

  if (mode === 'izin') {
    return (
      <div className="w-full max-w-4xl mx-auto h-full pb-10 pt-4">
        <h2 className="text-3xl font-bold text-slate-800 dark:text-white mb-8">Pengajuan Izin / Sakit / Alpha</h2>
        
        <div className="space-y-6">
          <div>
            <label className="block text-slate-500 dark:text-slate-400 mb-2 text-sm">Status Absensi</label>
            <div className="relative">
              <select 
                value={permissionType}
                onChange={(e) => setPermissionType(e.target.value as any)}
                className="w-full bg-white dark:bg-[#1e1e2f] border border-slate-300 dark:border-slate-700 rounded-lg p-4 text-slate-800 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none appearance-none cursor-pointer transition-all hover:border-blue-500"
              >
                <option value="Sakit">Sakit</option>
                <option value="Izin">Izin</option>
                <option value="Alpha">Alpha</option>
              </select>
              <div className="absolute right-4 top-1/2 transform -translate-y-1/2 pointer-events-none text-slate-400">
                <ChevronDown size={16} />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-slate-500 dark:text-slate-400 mb-2 text-sm">Keterangan</label>
            <textarea 
              className="w-full bg-white dark:bg-[#1e1e2f] border border-slate-300 dark:border-slate-700 rounded-lg p-4 text-slate-800 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none h-32 placeholder-slate-400 resize-none transition-all hover:border-blue-500"
              placeholder="Contoh: Sakit demam sejak semalam / Izin ada acara keluarga..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-slate-500 dark:text-slate-400 mb-2 text-sm">RFID / Scan Kartu</label>
            <div className="relative group">
              <input 
                ref={inputRef}
                type="text"
                className="w-full bg-white dark:bg-[#1e1e2f] border border-slate-300 dark:border-slate-700 rounded-lg p-4 text-slate-800 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none placeholder-slate-400 transition-all hover:border-blue-500"
                placeholder="Scan kartu atau ketik NIS untuk memproses..."
                value={rfidInput}
                onChange={(e) => setRfidInput(e.target.value)}
                onKeyDown={handleKeyDown}
              />
              <div className="absolute right-4 top-1/2 transform -translate-y-1/2 text-slate-500">
                <ScanLine size={20} />
              </div>
            </div>
          </div>

          <div>
              <Button 
                onClick={processScan} 
                className={`px-8 py-4 rounded-lg text-white font-bold text-lg transition-all shadow-lg hover:shadow-xl w-full sm:w-auto flex items-center justify-center gap-2 transform active:scale-95
                  ${permissionType === 'Alpha' ? 'bg-red-600 hover:bg-red-700 shadow-red-900/20' : 
                    permissionType === 'Sakit' ? 'bg-yellow-600 hover:bg-yellow-700 shadow-yellow-900/20' : 
                    'bg-blue-600 hover:bg-blue-700 shadow-blue-900/20'}`}
              >
                  Ajukan
              </Button>
          </div>
          
          {message && message !== 'Silahkan tempelkan kartu RFID' && (
            <div className={`p-4 rounded-lg border flex items-center gap-3 ${
              message.includes('Berhasil') 
                ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400' 
                : 'bg-red-500/10 border-red-500/20 text-red-600 dark:text-red-400'
            }`}>
               {message.includes('Berhasil') ? <UserCheck size={20} /> : <AlertCircle size={20} />}
               <span className="font-medium">{message}</span>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col w-full max-w-6xl mx-auto h-full space-y-8 pb-10">
      <div className="flex flex-col items-center pt-4">
        <h1 className="text-4xl font-bold text-slate-800 dark:text-white mb-2">
          Absensi {mode === 'masuk' ? 'Masuk' : 'Pulang'}
        </h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
        <div className="flex flex-col items-center justify-center space-y-8">
           <div className="relative">
             <CreditCard size={180} strokeWidth={1} className="text-slate-300 dark:text-slate-200 rotate-12" />
             <ScanLine size={100} strokeWidth={1.5} className="text-slate-800 dark:text-white absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
           </div>

           <div className="w-full max-w-md text-center space-y-3">
             <p className="text-slate-500 dark:text-slate-300 text-lg">Tempelkan kartu atau ketikkan NIS</p>
             <div className="relative group">
                <input
                  ref={inputRef}
                  type="text"
                  value={rfidInput}
                  onChange={(e) => setRfidInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className="w-full bg-white dark:bg-slate-50 text-slate-800 text-center text-xl py-3 px-4 rounded-lg border-2 border-slate-300 focus:border-blue-500 outline-none shadow-sm transition-all placeholder-slate-400"
                  autoFocus
                />
                <div className="absolute inset-0" onClick={() => inputRef.current?.focus()}></div>
             </div>
           </div>
        </div>

        <div className="flex justify-center md:justify-start h-full items-center">
           {lastScanned ? (
             <div className="bg-white rounded-xl shadow-2xl p-8 w-full max-w-xs lg:max-w-sm flex flex-col items-center text-center space-y-5 border-t-4 border-blue-500">
                <div className="w-40 h-40 rounded-full overflow-hidden border-4 border-slate-200 shadow-inner">
                   <img 
                     src={lastScanned.photo_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(lastScanned.name)}&background=random&size=256&bold=true`} 
                     alt={lastScanned.name}
                     className="w-full h-full object-cover"
                   />
                </div>
                <div className="space-y-1 w-full">
                   <h2 className="text-2xl font-bold text-slate-800">{lastScanned.name}</h2>
                   <p className="text-slate-500 font-medium">{lastTime}</p>
                   <div className={`mt-4 py-2 px-4 rounded-lg font-bold uppercase text-lg tracking-wider ${
                      lastStatus === 'Terlambat' || lastStatus === 'Alpha' ? 'bg-red-100 text-red-600' : 
                      lastStatus === 'Pulang' ? 'bg-amber-100 text-amber-600' :
                      lastStatus === 'Sakit' ? 'bg-yellow-100 text-yellow-600' :
                      lastStatus === 'Izin' ? 'bg-blue-100 text-blue-600' :
                      'bg-emerald-100 text-emerald-600'
                   }`}>
                      {lastStatus}
                   </div>
                </div>
             </div>
           ) : (
             <div className="bg-slate-100 dark:bg-[#27293d] rounded-xl border-2 border-dashed border-slate-300 dark:border-slate-600 w-full max-w-sm h-80 flex flex-col items-center justify-center text-slate-400 dark:text-slate-500 p-8 text-center">
                <User size={64} className="mb-4 opacity-50" />
                <p>Data Siswa akan muncul di sini setelah kartu discan.</p>
             </div>
           )}
        </div>
      </div>

      <div className="w-full pt-8">
        <div className="text-center mb-4">
           <h3 className="text-2xl font-bold text-slate-800 dark:text-white">Absensi Hari Ini:</h3>
        </div>
        <div className="bg-white dark:bg-[#27293d] rounded-lg overflow-hidden shadow-xl border border-slate-200 dark:border-transparent">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-red-600 text-white font-bold uppercase text-xs tracking-wider">
                <tr>
                  <th className="px-6 py-4 border-b border-red-700">Nomor</th>
                  <th className="px-6 py-4 border-b border-red-700">Nama Siswa</th>
                  <th className="px-6 py-4 border-b border-red-700">ID Kelas</th>
                  <th className="px-6 py-4 border-b border-red-700">Tanggal</th>
                  <th className="px-6 py-4 border-b border-red-700">Jam</th>
                  <th className="px-6 py-4 border-b border-red-700">Jenis</th>
                  <th className="px-6 py-4 border-b border-red-700">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-[#35374d]">
                {sortedRecords.length > 0 ? (
                  sortedRecords.map((r, index) => (
                    <tr 
                      key={r.id} 
                      className={`transition-colors font-medium ${
                        r.status === 'Terlambat' || r.status === 'Alpha'
                          ? 'bg-red-600 text-white hover:bg-red-700 border-b border-red-700' 
                          : r.status === 'Sakit' || r.status === 'Izin'
                          ? 'bg-blue-50 text-slate-800 hover:bg-blue-100 border-b border-blue-200'
                          : 'bg-white dark:bg-[#27293d] text-slate-800 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-[#32344d]'
                      }`}
                    >
                      <td className="px-6 py-4 whitespace-nowrap font-mono">{index + 1}</td>
                      <td className="px-6 py-4 whitespace-nowrap font-bold">{r.student_name}</td>
                      <td className="px-6 py-4 whitespace-nowrap">{r.class_name}</td>
                      <td className="px-6 py-4 whitespace-nowrap">{r.date_str}</td>
                      <td className="px-6 py-4 whitespace-nowrap font-mono">{r.time_str}</td>
                      <td className="px-6 py-4 whitespace-nowrap uppercase">
                        {r.status === 'Pulang' ? 'Keluar' : 'Masuk'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap uppercase font-bold">
                        {r.status}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-slate-500 bg-white dark:bg-[#27293d]">
                       Belum ada data absensi hari ini.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

// 4. MASTER DATA COMPONENT
const MasterData = ({ 
  students, 
  classes,
  teachers,
  onAddStudent, 
  onEditStudent,
  onDeleteStudent,
  onAddClass, 
  onEditClass,
  onDeleteClass,
  onAddTeacher,
  onEditTeacher,
  onDeleteTeacher,
  view = 'siswa',
  appSettings,
  onUpdateSettings,
  onImportStudents
}: { 
  students: Student[],
  classes: ClassRoom[],
  teachers: PicketTeacher[],
  onAddStudent: (s: Student) => void,
  onEditStudent: (s: Student) => void,
  onDeleteStudent: (id: string) => void,
  onAddClass: (c: ClassRoom) => void,
  onEditClass: (c: ClassRoom) => void,
  onDeleteClass: (id: string) => void,
  onAddTeacher: (t: PicketTeacher) => void,
  onEditTeacher: (t: PicketTeacher) => void,
  onDeleteTeacher: (id: string) => void,
  view?: 'siswa' | 'kelas' | 'guru' | 'pengaturan',
  appSettings: AppSettings,
  onUpdateSettings: (s: AppSettings) => void,
  onImportStudents: (s: Student[]) => void
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [newStudent, setNewStudent] = useState<Partial<Student>>({
    name: '', 
    class_name: '', 
    rfid_code: '', 
    gender: 'L',
    nis: '',
    student_phone: '',
    guardian_name: '',
    guardian_phone: '',
    photo_url: ''
  });

  const [isClassModalOpen, setIsClassModalOpen] = useState(false);
  const [editingClassId, setEditingClassId] = useState<string | null>(null);
  const [newClass, setNewClass] = useState<Partial<ClassRoom>>({ name: '', homeroom_teacher: '' });
  const [deleteClassId, setDeleteClassId] = useState<string | null>(null);

  const [isTeacherModalOpen, setIsTeacherModalOpen] = useState(false);
  const [editingTeacherId, setEditingTeacherId] = useState<string | null>(null);
  const [newTeacher, setNewTeacher] = useState<Partial<PicketTeacher>>({ username: '', email: '', password: '' });
  const [deleteTeacherId, setDeleteTeacherId] = useState<string | null>(null);

  const [localSettings, setLocalSettings] = useState<AppSettings>(appSettings);
  const logoInputRef = useRef<HTMLInputElement>(null);

  const [search, setSearch] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setLocalSettings(appSettings);
  }, [appSettings]);

  const handleSaveStudent = () => {
    if (newStudent.name && newStudent.rfid_code && newStudent.class_name) {
      if (editingId) {
        onEditStudent({
          ...newStudent as Student,
          id: editingId,
          photo_url: newStudent.photo_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(newStudent.name || '')}&background=random`
        });
      } else {
        onAddStudent({
          id: Date.now().toString(),
          name: newStudent.name || '',
          class_name: newStudent.class_name || '',
          rfid_code: newStudent.rfid_code || '',
          gender: (newStudent.gender as 'L' | 'P') || 'L',
          nis: newStudent.nis || '',
          student_phone: newStudent.student_phone || '',
          guardian_name: newStudent.guardian_name || '',
          guardian_phone: newStudent.guardian_phone || '',
          photo_url: newStudent.photo_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(newStudent.name || '')}&background=random`
        });
      }
      closeStudentModal();
    }
  };

  const handleEditClick = (student: Student) => {
    setEditingId(student.id);
    setNewStudent({ ...student });
    setIsModalOpen(true);
  };

  const closeStudentModal = () => {
    setIsModalOpen(false);
    setEditingId(null);
    setNewStudent({ name: '', class_name: '', rfid_code: '', gender: 'L', nis: '', student_phone: '', guardian_name: '', guardian_phone: '', photo_url: '' });
  };

  const handleSaveClass = () => {
    if (newClass.name && newClass.homeroom_teacher) {
      if (editingClassId) {
        onEditClass({
          ...newClass as ClassRoom,
          id: editingClassId
        });
      } else {
        onAddClass({
          id: Date.now().toString(),
          name: newClass.name || '',
          homeroom_teacher: newClass.homeroom_teacher || ''
        });
      }
      closeClassModal();
    }
  };

  const handleEditClassClick = (c: ClassRoom) => {
    setEditingClassId(c.id);
    setNewClass({ ...c });
    setIsClassModalOpen(true);
  };

  const closeClassModal = () => {
    setIsClassModalOpen(false);
    setEditingClassId(null);
    setNewClass({ name: '', homeroom_teacher: '' });
  };

  const handleSaveTeacher = () => {
    if (newTeacher.username && newTeacher.email) {
      if (editingTeacherId) {
        onEditTeacher({
          ...newTeacher as PicketTeacher,
          id: editingTeacherId
        });
      } else {
        onAddTeacher({
          id: Date.now().toString(),
          username: newTeacher.username || '',
          email: newTeacher.email || '',
          password: newTeacher.password || ''
        });
      }
      closeTeacherModal();
    }
  };

  const handleEditTeacherClick = (t: PicketTeacher) => {
    setEditingTeacherId(t.id);
    setNewTeacher({ ...t });
    setIsTeacherModalOpen(true);
  };

  const closeTeacherModal = () => {
    setIsTeacherModalOpen(false);
    setEditingTeacherId(null);
    setNewTeacher({ username: '', email: '', password: '' });
  };

  const handleSaveSettings = () => {
    onUpdateSettings(localSettings);
    alert('Pengaturan berhasil disimpan!');
  };

  const handleLogoSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const base64 = await fileToBase64(file);
        setLocalSettings({ ...localSettings, appLogo: base64 });
      } catch (err) {
        console.error("Failed to convert logo to base64", err);
      }
    }
  };

  const handleExportExcel = () => {
    const headers = "No,RFID,NIS,Nama Siswa,Kelas,L/P,Telepon Siswa,Nama Wali,Telepon Wali";
    const rows = students.map((s, index) => {
      return `${index + 1},"${s.rfid_code}","${s.nis || ''}","${s.name}","${s.class_name}","${s.gender}","${s.student_phone || ''}","${s.guardian_name || ''}","${s.guardian_phone || ''}"`;
    });
    const csvContent = [headers, ...rows].join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", "data_siswa.csv");
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDownloadTemplate = () => {
    const headers = "RFID,NIS,Nama Lengkap,Kelas,Jenis Kelamin (L/P),No HP Siswa,Nama Wali,No HP Wali";
    const exampleRow = "1234567890,1001,Contoh Siswa,X IPA 1,L,08123456789,Orang Tua,08198765432";
    const csvContent = [headers, exampleRow].join("\n");
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    
    link.setAttribute("href", url);
    link.setAttribute("download", "template_import_siswa.csv");
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const text = evt.target?.result as string;
        if (!text) return;

        const lines = text.split('\n').map(line => line.trim()).filter(line => line);
        const dataRows = lines.slice(1); // Skip header

        let successCount = 0;
        let failCount = 0;
        const importedStudents: Student[] = [];

        dataRows.forEach((row, index) => {
          // Simple split logic (works for simple CSVs)
          const cols = row.split(',').map(c => c.replace(/^"|"$/g, '').trim());
          
          if (cols.length >= 4) { 
             const [rfid, nis, name, className, gender, phone, guardian, guardianPhone] = cols;
             
             if (rfid && name && className) {
                const newS: Student = {
                   id: `${Date.now()}-${index}-${Math.floor(Math.random() * 10000)}`,
                   rfid_code: rfid,
                   nis: nis || '',
                   name: name,
                   class_name: className,
                   gender: (gender === 'P' ? 'P' : 'L'),
                   student_phone: phone || '',
                   guardian_name: guardian || '',
                   guardian_phone: guardianPhone || '',
                   photo_url: `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random`
                };
                importedStudents.push(newS);
                successCount++;
             } else {
                failCount++;
             }
          } else {
             failCount++;
          }
        });

        if (importedStudents.length > 0) {
            onImportStudents(importedStudents);
        }

        alert(`Import Selesai!\n\nBerhasil: ${successCount} data\nGagal: ${failCount} data (Format tidak sesuai)`);

      } catch (err) {
        console.error(err);
        alert("Gagal membaca file. Pastikan format .csv benar.");
      }
      if (fileInputRef.current) fileInputRef.current.value = '';
    };
    
    reader.readAsText(file);
  };

  const handlePhotoSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const base64 = await fileToBase64(file);
        setNewStudent({ ...newStudent, photo_url: base64 });
      } catch (err) {
         console.error("Failed to convert photo to base64", err);
      }
    }
  };

  if (view === 'guru') {
    return (
      <div className="space-y-6">
        <div className="flex flex-wrap gap-4">
          <div onClick={() => setIsTeacherModalOpen(true)} className="cursor-pointer border-2 border-blue-900/50 bg-white dark:bg-[#27293d] hover:bg-blue-50 dark:hover:bg-[#32344d] transition-colors rounded-lg p-3 flex items-center justify-center px-6">
              <span className="text-blue-600 dark:text-blue-500 font-medium flex items-center gap-2">
                <Plus size={18} />
                Tambah Guru Piket
              </span>
          </div>
        </div>

        <div className="overflow-x-auto rounded-lg border border-slate-200 dark:border-[#35374d]">
          <table className="w-full text-left text-sm text-slate-600 dark:text-slate-300">
            <thead className="bg-slate-100 dark:bg-[#27293d] text-slate-700 dark:text-slate-100 font-semibold uppercase text-xs tracking-wider">
              <tr>
                <th className="px-4 py-4 border-b border-slate-200 dark:border-[#35374d]">No</th>
                <th className="px-4 py-4 border-b border-slate-200 dark:border-[#35374d]">Username</th>
                <th className="px-4 py-4 border-b border-slate-200 dark:border-[#35374d]">Email</th>
                <th className="px-4 py-4 border-b border-slate-200 dark:border-[#35374d] w-32">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-[#35374d] bg-white dark:bg-[#1e1e2f]">
              {teachers.map((t, index) => (
                <tr key={t.id} className="hover:bg-slate-50 dark:hover:bg-[#27293d] transition-colors">
                  <td className="px-4 py-4 text-slate-500">{index + 1}</td>
                  <td className="px-4 py-4 font-medium text-slate-800 dark:text-white flex items-center gap-2">
                    <UserCog size={16} className="text-blue-500 dark:text-blue-400" />
                    {t.username}
                  </td>
                  <td className="px-4 py-4 text-slate-500 dark:text-slate-400">{t.email}</td>
                  <td className="px-4 py-4">
                    <div className="flex gap-2">
                      <button 
                        onClick={() => handleEditTeacherClick(t)}
                        className="bg-amber-500 hover:bg-amber-600 text-white p-2 rounded-lg transition-colors"
                        title="Edit"
                      >
                        <Edit size={14} />
                      </button>
                      <button 
                        onClick={() => setDeleteTeacherId(t.id)}
                        className="bg-red-600 hover:bg-red-700 text-white p-2 rounded-lg transition-colors"
                        title="Hapus"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {teachers.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-slate-500">
                    Belum ada data guru piket.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {isTeacherModalOpen && (
          <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
            <div className="bg-white dark:bg-[#27293d] rounded-xl shadow-2xl w-full max-w-md p-8 border border-slate-200 dark:border-[#35374d]">
              <h3 className="text-xl font-bold mb-6 text-slate-800 dark:text-white border-b border-slate-200 dark:border-slate-700 pb-4">
                {editingTeacherId ? 'Edit Data Guru Piket' : 'Tambah Guru Piket'}
              </h3>
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-xs text-slate-500 dark:text-slate-400 uppercase">Username</label>
                  <div className="relative">
                    <input 
                      className="w-full bg-slate-50 dark:bg-[#1e1e2f] border border-slate-300 dark:border-[#35374d] p-3 rounded text-slate-800 dark:text-white focus:border-blue-500 outline-none placeholder-slate-400 dark:placeholder-slate-600 pl-10" 
                      placeholder="Username" 
                      value={newTeacher.username}
                      onChange={e => setNewTeacher({...newTeacher, username: e.target.value})}
                    />
                    <User size={18} className="absolute left-3 top-3 text-slate-500" />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-xs text-slate-500 dark:text-slate-400 uppercase">Email</label>
                  <div className="relative">
                    <input 
                      type="email"
                      className="w-full bg-slate-50 dark:bg-[#1e1e2f] border border-slate-300 dark:border-[#35374d] p-3 rounded text-slate-800 dark:text-white focus:border-blue-500 outline-none placeholder-slate-400 dark:placeholder-slate-600 pl-10" 
                      placeholder="email@sekolah.id" 
                      value={newTeacher.email}
                      onChange={e => setNewTeacher({...newTeacher, email: e.target.value})}
                    />
                    <Mail size={18} className="absolute left-3 top-3 text-slate-500" />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-xs text-slate-500 dark:text-slate-400 uppercase">Password</label>
                  <div className="relative">
                    <input 
                      type="password"
                      className="w-full bg-slate-50 dark:bg-[#1e1e2f] border border-slate-300 dark:border-[#35374d] p-3 rounded text-slate-800 dark:text-white focus:border-blue-500 outline-none placeholder-slate-400 dark:placeholder-slate-600 pl-10" 
                      placeholder="********" 
                      value={newTeacher.password}
                      onChange={e => setNewTeacher({...newTeacher, password: e.target.value})}
                    />
                    <Lock size={18} className="absolute left-3 top-3 text-slate-500" />
                  </div>
                </div>
              </div>
              <div className="flex gap-3 mt-8 justify-end">
                <Button variant="secondary" onClick={closeTeacherModal}>Batal</Button>
                <Button onClick={handleSaveTeacher}>
                  {editingTeacherId ? 'Simpan Perubahan' : 'Simpan Data'}
                </Button>
              </div>
            </div>
          </div>
        )}

        {deleteTeacherId && (
          <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[60] p-4 backdrop-blur-sm">
            <div className="bg-white dark:bg-[#27293d] rounded-xl shadow-2xl w-full max-w-md p-6 border border-slate-200 dark:border-[#35374d] text-center">
              <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                 <Trash2 size={32} className="text-red-500" />
              </div>
              <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-2">Hapus Guru Piket?</h3>
              <p className="text-slate-500 dark:text-slate-400 mb-6">Apakah anda yakin ingin menghapus data ini?</p>
              <div className="flex gap-3 justify-center">
                 <Button variant="secondary" onClick={() => setDeleteTeacherId(null)}>Batal</Button>
                 <Button variant="danger" onClick={() => { onDeleteTeacher(deleteTeacherId); setDeleteTeacherId(null); }}>Hapus</Button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  if (view === 'pengaturan') return (
    <div className="max-w-3xl mx-auto">
      <div className="bg-white dark:bg-[#27293d] rounded-xl shadow-lg p-8 border border-slate-200 dark:border-[#35374d]">
        <div className="flex items-center gap-4 mb-8 border-b border-slate-200 dark:border-[#35374d] pb-6">
          <div className="p-3 bg-blue-600/10 dark:bg-blue-600/20 rounded-lg">
            <UserCog size={32} className="text-blue-600 dark:text-blue-500" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-slate-800 dark:text-white">Pengaturan Aplikasi</h3>
            <p className="text-slate-500 dark:text-slate-400 text-sm">Kelola identitas, integrasi WA, dan waktu operasional sekolah</p>
          </div>
        </div>
        
        <div className="space-y-8">
            <div className="flex flex-col sm:flex-row gap-6 items-center sm:items-start">
                <div className="flex flex-col items-center">
                    <label className="block text-sm font-medium text-slate-500 dark:text-slate-400 mb-3">Logo Aplikasi</label>
                    <div 
                        onClick={() => logoInputRef.current?.click()}
                        className="w-32 h-32 bg-slate-50 dark:bg-[#1e1e2f] border-2 border-dashed border-slate-300 dark:border-[#35374d] rounded-xl flex flex-col items-center justify-center cursor-pointer hover:border-blue-500 transition-colors overflow-hidden relative group"
                    >
                        {localSettings.appLogo ? (
                            <img src={localSettings.appLogo} alt="Logo" className="w-full h-full object-contain p-2" />
                        ) : (
                            <Upload size={32} className="text-slate-500 group-hover:text-blue-400" />
                        )}
                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                            <Camera size={20} className="text-white" />
                        </div>
                    </div>
                    <input type="file" ref={logoInputRef} className="hidden" accept="image/*" onChange={handleLogoSelect} />
                    <p className="text-xs text-slate-500 mt-2 text-center">Klik untuk upload logo</p>
                </div>

                <div className="flex-1 w-full space-y-5">
                     <div>
                        <label className="block text-sm font-bold text-slate-500 dark:text-slate-400 mb-2 uppercase tracking-wider">Nama Aplikasi</label>
                        <div className="relative">
                          <input 
                              type="text" 
                              value={localSettings.appName}
                              onChange={(e) => setLocalSettings({...localSettings, appName: e.target.value})}
                              className="w-full bg-slate-50 dark:bg-[#1e1e2f] border border-slate-300 dark:border-[#35374d] rounded-lg px-4 py-3 text-slate-800 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none pl-10"
                              placeholder="Masukkan nama aplikasi sekolah"
                          />
                          <Presentation size={18} className="absolute left-3 top-3.5 text-slate-500" />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-bold text-slate-500 dark:text-slate-400 mb-2 uppercase tracking-wider">Jam Masuk</label>
                            <div className="relative">
                              <input 
                                  type="time" 
                                  value={localSettings.checkInTime}
                                  onChange={(e) => setLocalSettings({...localSettings, checkInTime: e.target.value})}
                                  className="w-full bg-slate-50 dark:bg-[#1e1e2f] border border-slate-300 dark:border-[#35374d] rounded-lg px-4 py-3 text-slate-800 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none pl-10"
                              />
                              <Clock size={18} className="absolute left-3 top-3.5 text-slate-500" />
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-slate-500 dark:text-slate-400 mb-2 uppercase tracking-wider">Jam Pulang</label>
                             <div className="relative">
                                <input 
                                    type="time" 
                                    value={localSettings.checkOutTime}
                                    onChange={(e) => setLocalSettings({...localSettings, checkOutTime: e.target.value})}
                                    className="w-full bg-slate-50 dark:bg-[#1e1e2f] border border-slate-300 dark:border-[#35374d] rounded-lg px-4 py-3 text-slate-800 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none pl-10"
                                />
                                <Clock size={18} className="absolute left-3 top-3.5 text-slate-500" />
                             </div>
                        </div>
                    </div>

                    {/* Fonnte API Config */}
                    <div className="border-t border-slate-200 dark:border-[#35374d] pt-4 mt-4">
                        <h4 className="text-sm font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
                            <MessageCircle size={18} className="text-green-500" />
                            Konfigurasi WhatsApp (Fonnte API)
                        </h4>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1 uppercase">Fonnte API Token</label>
                                <input 
                                    type="password" 
                                    value={localSettings.whatsappToken || ''}
                                    onChange={(e) => setLocalSettings({...localSettings, whatsappToken: e.target.value})}
                                    className="w-full bg-slate-50 dark:bg-[#1e1e2f] border border-slate-300 dark:border-[#35374d] rounded-lg px-4 py-2 text-slate-800 dark:text-white focus:ring-2 focus:ring-green-500 outline-none text-sm"
                                    placeholder="Tempel token Fonnte di sini..."
                                />
                            </div>
                             <div>
                                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1 uppercase">Template Pesan (Manual WA)</label>
                                <div className="relative">
                                  <textarea 
                                      value={localSettings.waTemplate || "Halo Bapak/Ibu *{guardian}*, diinformasikan bahwa siswa *{student}* telah melakukan absensi *{status}* pada pukul *{time}*."}
                                      onChange={(e) => setLocalSettings({...localSettings, waTemplate: e.target.value})}
                                      className="w-full bg-slate-50 dark:bg-[#1e1e2f] border border-slate-300 dark:border-[#35374d] rounded-lg px-4 py-3 text-slate-800 dark:text-white focus:ring-2 focus:ring-green-500 outline-none h-24 resize-none text-sm"
                                      placeholder="Template pesan WA..."
                                  />
                                  <p className="text-xs text-slate-500 mt-1">Gunakan variabel: {'{student}'}, {'{guardian}'}, {'{status}'}, {'{time}'}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="pt-6 flex justify-end border-t border-slate-200 dark:border-[#35374d]">
                <Button onClick={handleSaveSettings} className="px-8 py-3 flex items-center gap-2 text-lg">
                   <Save size={20} />
                   Simpan Pengaturan
                </Button>
            </div>
        </div>
      </div>
    </div>
  );

  if (view === 'kelas') {
    return (
      <div className="space-y-6">
        <div className="flex flex-wrap gap-4">
          <div onClick={() => setIsClassModalOpen(true)} className="cursor-pointer border-2 border-blue-900/50 bg-white dark:bg-[#27293d] hover:bg-blue-50 dark:hover:bg-[#32344d] transition-colors rounded-lg p-3 flex items-center justify-center px-6">
              <span className="text-blue-600 dark:text-blue-500 font-medium flex items-center gap-2">
                <Plus size={18} />
                Tambah Kelas
              </span>
          </div>
        </div>

        <div className="overflow-x-auto rounded-lg border border-slate-200 dark:border-[#35374d]">
          <table className="w-full text-left text-sm text-slate-600 dark:text-slate-300">
            <thead className="bg-slate-100 dark:bg-[#27293d] text-slate-700 dark:text-slate-100 font-semibold uppercase text-xs tracking-wider">
              <tr>
                <th className="px-4 py-4 border-b border-slate-200 dark:border-[#35374d]">No</th>
                <th className="px-4 py-4 border-b border-slate-200 dark:border-[#35374d]">Nama Kelas</th>
                <th className="px-4 py-4 border-b border-slate-200 dark:border-[#35374d]">Nama Wali Kelas</th>
                <th className="px-4 py-4 border-b border-slate-200 dark:border-[#35374d] w-32">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-[#35374d] bg-white dark:bg-[#1e1e2f]">
              {classes.map((c, index) => (
                <tr key={c.id} className="hover:bg-slate-50 dark:hover:bg-[#27293d] transition-colors">
                  <td className="px-4 py-4 text-slate-500">{index + 1}</td>
                  <td className="px-4 py-4 font-medium text-slate-800 dark:text-white">{c.name}</td>
                  <td className="px-4 py-4 text-slate-500 dark:text-slate-400">{c.homeroom_teacher}</td>
                  <td className="px-4 py-4">
                    <div className="flex gap-2">
                      <button 
                        onClick={() => handleEditClassClick(c)}
                        className="bg-amber-500 hover:bg-amber-600 text-white p-2 rounded-lg transition-colors"
                        title="Edit"
                      >
                        <Edit size={14} />
                      </button>
                      <button 
                        onClick={() => setDeleteClassId(c.id)}
                        className="bg-red-600 hover:bg-red-700 text-white p-2 rounded-lg transition-colors"
                        title="Hapus"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {classes.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-slate-500">
                    Belum ada data kelas.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {isClassModalOpen && (
          <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
            <div className="bg-white dark:bg-[#27293d] rounded-xl shadow-2xl w-full max-w-md p-8 border border-slate-200 dark:border-[#35374d]">
              <h3 className="text-xl font-bold mb-6 text-slate-800 dark:text-white border-b border-slate-200 dark:border-slate-700 pb-4">
                {editingClassId ? 'Edit Data Kelas' : 'Tambah Data Kelas'}
              </h3>
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-xs text-slate-500 dark:text-slate-400 uppercase">Nama Kelas</label>
                  <input 
                    className="w-full bg-slate-50 dark:bg-[#1e1e2f] border border-slate-300 dark:border-[#35374d] p-3 rounded text-slate-800 dark:text-white focus:border-blue-500 outline-none placeholder-slate-400 dark:placeholder-slate-600" 
                    placeholder="Contoh: X IPA 1" 
                    value={newClass.name}
                    onChange={e => setNewClass({...newClass, name: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs text-slate-500 dark:text-slate-400 uppercase">Wali Kelas</label>
                  <input 
                    className="w-full bg-slate-50 dark:bg-[#1e1e2f] border border-slate-300 dark:border-[#35374d] p-3 rounded text-slate-800 dark:text-white focus:border-blue-500 outline-none placeholder-slate-400 dark:placeholder-slate-600" 
                    placeholder="Nama Guru" 
                    value={newClass.homeroom_teacher}
                    onChange={e => setNewClass({...newClass, homeroom_teacher: e.target.value})}
                  />
                </div>
              </div>
              <div className="flex gap-3 mt-8 justify-end">
                <Button variant="secondary" onClick={closeClassModal}>Batal</Button>
                <Button onClick={handleSaveClass}>
                  {editingClassId ? 'Simpan Perubahan' : 'Simpan Data'}
                </Button>
              </div>
            </div>
          </div>
        )}

        {deleteClassId && (
          <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[60] p-4 backdrop-blur-sm">
            <div className="bg-white dark:bg-[#27293d] rounded-xl shadow-2xl w-full max-w-md p-6 border border-slate-200 dark:border-[#35374d] text-center">
              <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                 <Trash2 size={32} className="text-red-500" />
              </div>
              <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-2">Hapus Data Kelas?</h3>
              <p className="text-slate-500 dark:text-slate-400 mb-6">Apakah anda yakin ingin menghapus kelas ini?</p>
              <div className="flex gap-3 justify-center">
                 <Button variant="secondary" onClick={() => setDeleteClassId(null)}>Batal</Button>
                 <Button variant="danger" onClick={() => { onDeleteClass(deleteClassId); setDeleteClassId(null); }}>Hapus</Button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  const filteredStudents = students.filter(s => 
    s.name.toLowerCase().includes(search.toLowerCase()) || 
    s.class_name.toLowerCase().includes(search.toLowerCase()) ||
    s.rfid_code.includes(search) ||
    (s.nis && s.nis.includes(search))
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-4">
        <div onClick={() => setIsModalOpen(true)} className="flex-1 cursor-pointer border-2 border-blue-900/50 bg-white dark:bg-[#27293d] hover:bg-blue-50 dark:hover:bg-[#32344d] transition-colors rounded-lg p-3 flex items-center justify-center">
            <span className="text-blue-600 dark:text-blue-500 font-medium flex items-center gap-2">
              <Plus size={18} />
              Add Siswa
            </span>
        </div>

        <div onClick={handleDownloadTemplate} className="cursor-pointer border-2 border-indigo-900/50 bg-white dark:bg-[#27293d] hover:bg-indigo-50 dark:hover:bg-[#32344d] transition-colors rounded-lg p-3 flex items-center justify-center px-6">
            <span className="text-indigo-600 dark:text-indigo-500 font-medium flex items-center gap-2">
              <FileDown size={18} />
              Template
            </span>
        </div>
        
        <div onClick={handleImportClick} className="cursor-pointer border-2 border-emerald-900/50 bg-white dark:bg-[#27293d] hover:bg-emerald-50 dark:hover:bg-[#32344d] transition-colors rounded-lg p-3 flex items-center justify-center px-6">
            <span className="text-emerald-600 dark:text-emerald-500 font-medium flex items-center gap-2">
              <Upload size={18} />
              Import CSV (Excel)
            </span>
            <input 
              type="file" 
              ref={fileInputRef} 
              className="hidden" 
              accept=".csv" 
              onChange={handleFileChange} 
            />
        </div>

        <div onClick={handleExportExcel} className="cursor-pointer border-2 border-emerald-900/50 bg-white dark:bg-[#27293d] hover:bg-emerald-50 dark:hover:bg-[#32344d] transition-colors rounded-lg p-3 flex items-center justify-center px-6">
            <span className="text-emerald-600 dark:text-emerald-500 font-medium flex items-center gap-2">
              <Download size={18} />
              Export Excel
            </span>
        </div>
      </div>

      <div className="overflow-x-auto rounded-lg border border-slate-200 dark:border-[#35374d]">
        <table className="w-full text-left text-sm text-slate-600 dark:text-slate-300">
          <thead className="bg-slate-100 dark:bg-[#27293d] text-slate-700 dark:text-slate-100 font-semibold uppercase text-xs tracking-wider">
            <tr>
              <th className="px-4 py-4 border-b border-slate-200 dark:border-[#35374d]">No</th>
              <th className="px-4 py-4 border-b border-slate-200 dark:border-[#35374d]">RFID</th>
              <th className="px-4 py-4 border-b border-slate-200 dark:border-[#35374d]">NIS</th>
              <th className="px-4 py-4 border-b border-slate-200 dark:border-[#35374d]">Siswa</th>
              <th className="px-4 py-4 border-b border-slate-200 dark:border-[#35374d]">Kelas</th>
              <th className="px-4 py-4 border-b border-slate-200 dark:border-[#35374d]">Tlp Siswa</th>
              <th className="px-4 py-4 border-b border-slate-200 dark:border-[#35374d]">Wali</th>
              <th className="px-4 py-4 border-b border-slate-200 dark:border-[#35374d]">Tlp Wali</th>
              <th className="px-4 py-4 border-b border-slate-200 dark:border-[#35374d]">Foto</th>
              <th className="px-4 py-4 border-b border-slate-200 dark:border-[#35374d]">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 dark:divide-[#35374d] bg-white dark:bg-[#1e1e2f]">
            {filteredStudents.map((s, index) => (
              <tr key={s.id} className="hover:bg-slate-50 dark:hover:bg-[#27293d] transition-colors">
                <td className="px-4 py-4 text-slate-500">{index + 1}</td>
                <td className="px-4 py-4 font-mono text-slate-500 dark:text-slate-400">{s.rfid_code}</td>
                <td className="px-4 py-4 font-mono text-slate-500 dark:text-slate-400">{s.nis || '-'}</td>
                <td className="px-4 py-4 font-medium text-slate-800 dark:text-white uppercase">{s.name}</td>
                <td className="px-4 py-4 text-slate-500 dark:text-slate-400">{s.class_name}</td>
                <td className="px-4 py-4 text-slate-500 dark:text-slate-400">{s.student_phone || '-'}</td>
                <td className="px-4 py-4 text-slate-500 dark:text-slate-400 uppercase">{s.guardian_name || '-'}</td>
                <td className="px-4 py-4 text-slate-500 dark:text-slate-400">{s.guardian_phone || '-'}</td>
                <td className="px-4 py-4">
                  <div className="w-10 h-10 rounded-sm overflow-hidden bg-slate-200 dark:bg-slate-700">
                    <img 
                      src={s.photo_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(s.name)}`} 
                      alt="Foto" 
                      className="w-full h-full object-cover"
                    />
                  </div>
                </td>
                <td className="px-4 py-4">
                  <div className="flex flex-col gap-1">
                    <button 
                      type="button"
                      onClick={() => handleEditClick(s)}
                      className="bg-amber-500 hover:bg-amber-600 text-white text-xs px-2 py-1 rounded font-medium transition-colors w-full text-center"
                    >
                      Edit
                    </button>
                    <button 
                      type="button"
                      onClick={() => setDeleteId(s.id)}
                      className="bg-red-600 hover:bg-red-700 text-white text-xs px-2 py-1 rounded font-medium transition-colors w-full text-center"
                    >
                      Hapus
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {filteredStudents.length === 0 && (
              <tr>
                <td colSpan={10} className="px-6 py-8 text-center text-slate-500">
                  Data siswa tidak ditemukan.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white dark:bg-[#27293d] rounded-xl shadow-2xl w-full max-w-4xl p-8 border border-slate-200 dark:border-[#35374d] max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-bold mb-6 text-slate-800 dark:text-white border-b border-slate-200 dark:border-slate-700 pb-4">
              {editingId ? 'Edit Data Siswa' : 'Tambah Data Siswa'}
            </h3>
            
            <div className="flex flex-col md:flex-row gap-8">
              <div className="w-full md:w-1/3 flex flex-col items-center">
                 <label className="block text-sm font-medium text-slate-500 dark:text-slate-400 mb-3 uppercase tracking-wider">Foto Siswa</label>
                 <div 
                    onClick={() => photoInputRef.current?.click()}
                    className="w-full aspect-square max-w-[200px] bg-slate-50 dark:bg-[#1e1e2f] border-2 border-dashed border-slate-300 dark:border-[#35374d] rounded-xl flex flex-col items-center justify-center cursor-pointer hover:border-blue-500 hover:bg-slate-100 dark:hover:bg-[#1e1e2f]/50 transition-all group relative overflow-hidden"
                 >
                    {newStudent.photo_url ? (
                       <img src={newStudent.photo_url} alt="Foto Siswa" className="w-full h-full object-cover" />
                    ) : (
                       <div className="flex flex-col items-center text-slate-400 dark:text-slate-500 group-hover:text-blue-500 dark:group-hover:text-blue-400 transition-colors">
                          <User size={48} strokeWidth={1.5} />
                          <span className="text-xs mt-2 font-medium">Upload Foto</span>
                       </div>
                    )}
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <Camera size={24} className="text-white" />
                    </div>
                 </div>
                 <input 
                   type="file" 
                   ref={photoInputRef} 
                   className="hidden" 
                   accept="image/*"
                   onChange={handlePhotoSelect}
                 />
                 <p className="text-[10px] text-slate-500 mt-2 text-center w-3/4">
                   Klik box di atas untuk memilih foto dari komputer.
                 </p>
              </div>

              <div className="w-full md:w-2/3 grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs text-slate-500 dark:text-slate-400 uppercase">Kode RFID</label>
                  <input 
                    className="w-full bg-slate-50 dark:bg-[#1e1e2f] border border-slate-300 dark:border-[#35374d] p-3 rounded text-slate-800 dark:text-white focus:border-blue-500 outline-none placeholder-slate-400 dark:placeholder-slate-600" 
                    placeholder="Scan Kartu..." 
                    value={newStudent.rfid_code}
                    onChange={e => setNewStudent({...newStudent, rfid_code: e.target.value})}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs text-slate-500 dark:text-slate-400 uppercase">NIS</label>
                  <input 
                    className="w-full bg-slate-50 dark:bg-[#1e1e2f] border border-slate-300 dark:border-[#35374d] p-3 rounded text-slate-800 dark:text-white focus:border-blue-500 outline-none placeholder-slate-400 dark:placeholder-slate-600" 
                    placeholder="Nomor Induk Siswa" 
                    value={newStudent.nis}
                    onChange={e => setNewStudent({...newStudent, nis: e.target.value})}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs text-slate-500 dark:text-slate-400 uppercase">Nama Lengkap</label>
                  <input 
                    className="w-full bg-slate-50 dark:bg-[#1e1e2f] border border-slate-300 dark:border-[#35374d] p-3 rounded text-slate-800 dark:text-white focus:border-blue-500 outline-none placeholder-slate-400 dark:placeholder-slate-600" 
                    placeholder="Nama Siswa" 
                    value={newStudent.name}
                    onChange={e => setNewStudent({...newStudent, name: e.target.value})}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs text-slate-500 dark:text-slate-400 uppercase">Kelas</label>
                  <select 
                    className="w-full bg-slate-50 dark:bg-[#1e1e2f] border border-slate-300 dark:border-[#35374d] p-3 rounded text-slate-800 dark:text-white focus:border-blue-500 outline-none appearance-none"
                    value={newStudent.class_name}
                    onChange={e => setNewStudent({...newStudent, class_name: e.target.value})}
                  >
                    <option value="">-- Pilih Kelas --</option>
                    {classes.map((c) => (
                      <option key={c.id} value={c.name}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-xs text-slate-500 dark:text-slate-400 uppercase">Jenis Kelamin</label>
                  <select 
                    className="w-full bg-slate-50 dark:bg-[#1e1e2f] border border-slate-300 dark:border-[#35374d] p-3 rounded text-slate-800 dark:text-white focus:border-blue-500 outline-none"
                    value={newStudent.gender}
                    onChange={e => setNewStudent({...newStudent, gender: e.target.value as 'L' | 'P'})}
                  >
                    <option value="L">Laki-laki</option>
                    <option value="P">Perempuan</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-xs text-slate-500 dark:text-slate-400 uppercase">No. Telp Siswa</label>
                  <input 
                    className="w-full bg-slate-50 dark:bg-[#1e1e2f] border border-slate-300 dark:border-[#35374d] p-3 rounded text-slate-800 dark:text-white focus:border-blue-500 outline-none placeholder-slate-400 dark:placeholder-slate-600" 
                    placeholder="08..." 
                    value={newStudent.student_phone}
                    onChange={e => setNewStudent({...newStudent, student_phone: e.target.value})}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs text-slate-500 dark:text-slate-400 uppercase">Nama Wali</label>
                  <input 
                    className="w-full bg-slate-50 dark:bg-[#1e1e2f] border border-slate-300 dark:border-[#35374d] p-3 rounded text-slate-800 dark:text-white focus:border-blue-500 outline-none placeholder-slate-400 dark:placeholder-slate-600" 
                    placeholder="Orang tua / Wali" 
                    value={newStudent.guardian_name}
                    onChange={e => setNewStudent({...newStudent, guardian_name: e.target.value})}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs text-slate-500 dark:text-slate-400 uppercase">No. Telp Wali</label>
                  <input 
                    className="w-full bg-slate-50 dark:bg-[#1e1e2f] border border-slate-300 dark:border-[#35374d] p-3 rounded text-slate-800 dark:text-white focus:border-blue-500 outline-none placeholder-slate-400 dark:placeholder-slate-600" 
                    placeholder="08..." 
                    value={newStudent.guardian_phone}
                    onChange={e => setNewStudent({...newStudent, guardian_phone: e.target.value})}
                  />
                </div>
              </div>

            </div>

            <div className="flex gap-3 mt-8 justify-end">
              <Button variant="secondary" onClick={closeStudentModal}>Batal</Button>
              <Button onClick={handleSaveStudent}>
                {editingId ? 'Simpan Perubahan' : 'Simpan Data'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {deleteId && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[60] p-4 backdrop-blur-sm">
          <div className="bg-white dark:bg-[#27293d] rounded-xl shadow-2xl w-full max-w-md p-6 border border-slate-200 dark:border-[#35374d] text-center animate-in fade-in zoom-in duration-200">
            <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
               <Trash2 size={32} className="text-red-500" />
            </div>
            <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-2">Hapus Data Siswa?</h3>
            <p className="text-slate-500 dark:text-slate-400 mb-6">Apakah anda yakin ingin menghapus data siswa ini? Tindakan ini tidak dapat dibatalkan.</p>
            <div className="flex gap-3 justify-center">
               <Button variant="secondary" onClick={() => setDeleteId(null)}>Batal</Button>
               <Button variant="danger" onClick={() => { onDeleteStudent(deleteId); setDeleteId(null); }}>Hapus</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// 5. DATA ABSENSI COMPONENT
const AttendanceHistory = ({ 
  records, 
  students, 
  view,
  appSettings 
}: { 
  records: AttendanceRecord[], 
  students: Student[],
  view: 'today' | 'range',
  appSettings: AppSettings
}) => {
  const getRfid = (studentId: string) => students.find(s => s.id === studentId)?.rfid_code || '-';
  
  const getJenis = (status: string) => {
    if (status === 'Pulang') return 'Pulang';
    if (['Izin', 'Sakit', 'Alpha'].includes(status)) return 'Izin';
    return 'Masuk';
  };

  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [filterJenis, setFilterJenis] = useState('Semua');
  const [filterStatus, setFilterStatus] = useState('Semua');
  const [filteredRecords, setFilteredRecords] = useState<AttendanceRecord[]>([]);

  const handleShowData = () => {
    const res = records.filter(r => {
      if (startDate && r.date_str < startDate) return false;
      if (endDate && r.date_str > endDate) return false;
      
      if (filterJenis !== 'Semua') {
        const jenis = getJenis(r.status);
        if (jenis !== filterJenis) return false;
      }

      if (filterStatus !== 'Semua') {
        if (filterStatus === 'Bolos' && r.status !== 'Alpha') return false; 
        if (filterStatus !== 'Bolos' && r.status !== filterStatus) return false;
      }

      return true;
    }).sort((a, b) => b.timestamp - a.timestamp);
    
    setFilteredRecords(res);
  };

  const sendWhatsApp = (record: AttendanceRecord) => {
    const student = students.find(s => s.id === record.student_id);
    if (!student || !student.guardian_phone) {
      alert("Nomor HP Wali Murid tidak ditemukan.");
      return;
    }

    let phone = student.guardian_phone.trim();
    // Normalize phone number to 62 format
    if (phone.startsWith('0')) {
      phone = '62' + phone.slice(1);
    } else if (phone.startsWith('+62')) {
      phone = phone.slice(1);
    }

    const defaultTemplate = "Halo Bapak/Ibu *{guardian}*, diinformasikan bahwa siswa *{student}* telah melakukan absensi *{status}* pada pukul *{time}*.";
    let message = appSettings.waTemplate || defaultTemplate;

    message = message
      .replace('{guardian}', student.guardian_name || 'Wali Murid')
      .replace('{student}', student.name)
      .replace('{status}', record.status)
      .replace('{time}', record.time_str);

    const url = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
  };

  if (view === 'today') {
    const today = new Date().toISOString().split('T')[0];
    const todayRecords = records.filter(r => r.date_str === today).sort((a, b) => b.timestamp - a.timestamp);

    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Data Absensi Hari Ini</h2>
        <Card className="overflow-hidden p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-500 dark:text-slate-400 min-w-[800px]">
              <thead className="bg-slate-100 dark:bg-[#27293d] text-slate-700 dark:text-slate-200 font-semibold uppercase text-xs">
                <tr>
                  <th className="px-4 py-3 whitespace-nowrap">No</th>
                  <th className="px-4 py-3 whitespace-nowrap">RFID</th>
                  <th className="px-4 py-3 whitespace-nowrap">Nama Siswa</th>
                  <th className="px-4 py-3 whitespace-nowrap">Jenis</th>
                  <th className="px-4 py-3 whitespace-nowrap">Status</th>
                  <th className="px-4 py-3 whitespace-nowrap">Keterangan</th>
                  <th className="px-4 py-3 whitespace-nowrap">Jam</th>
                  <th className="px-4 py-3 whitespace-nowrap">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-[#35374d]">
                {todayRecords.map((r, index) => (
                  <tr key={r.id} className="hover:bg-slate-50 dark:hover:bg-[#2e3048] transition-colors">
                    <td className="px-4 py-3">{index + 1}</td>
                    <td className="px-4 py-3 font-mono text-slate-500">{getRfid(r.student_id)}</td>
                    <td className="px-4 py-3 font-medium text-slate-800 dark:text-white">{r.student_name}</td>
                    <td className="px-4 py-3 uppercase text-xs font-bold tracking-wider">
                      <span className={`px-2 py-1 rounded ${
                        getJenis(r.status) === 'Masuk' ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' : 
                        getJenis(r.status) === 'Pulang' ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400' : 
                        'bg-blue-500/10 text-blue-600 dark:text-blue-400'
                      }`}>
                        {getJenis(r.status)}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`font-bold ${
                        r.status === 'Hadir' ? 'text-emerald-500 dark:text-emerald-400' :
                        r.status === 'Terlambat' ? 'text-red-500 dark:text-red-400' :
                        r.status === 'Izin' ? 'text-blue-500 dark:text-blue-400' :
                        r.status === 'Sakit' ? 'text-yellow-500 dark:text-yellow-400' :
                        r.status === 'Alpha' ? 'text-red-500' :
                        'text-slate-400'
                      }`}>
                        {r.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-500 italic">{r.description || '-'}</td>
                    <td className="px-4 py-3 font-mono text-slate-500 dark:text-slate-300">{r.time_str}</td>
                    <td className="px-4 py-3">
                       <button 
                          onClick={() => sendWhatsApp(r)}
                          className="bg-emerald-500 hover:bg-emerald-600 text-white p-2 rounded-full transition-colors flex items-center justify-center"
                          title="Kirim WA ke Wali Murid"
                        >
                          <MessageCircle size={16} />
                        </button>
                    </td>
                  </tr>
                ))}
                {todayRecords.length === 0 && (
                  <tr>
                    <td colSpan={8} className="px-6 py-8 text-center text-slate-500">
                      Tidak ada data absensi hari ini.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Riwayat Absensi</h2>
      </div>
      
      <div className="bg-white dark:bg-[#27293d] p-6 rounded-xl border border-slate-200 dark:border-[#35374d]">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-2 uppercase">Tanggal Mulai</label>
            <div className="relative">
              <input 
                  type="date" 
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-[#1e1e2f] border border-slate-300 dark:border-[#35374d] text-slate-800 dark:text-white rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                />
                <Calendar size={16} className="absolute right-3 top-3 text-slate-500 pointer-events-none" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-2 uppercase">Tanggal Selesai</label>
            <div className="relative">
              <input 
                  type="date" 
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-[#1e1e2f] border border-slate-300 dark:border-[#35374d] text-slate-800 dark:text-white rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                />
                <Calendar size={16} className="absolute right-3 top-3 text-slate-500 pointer-events-none" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-2 uppercase">Jenis</label>
            <div className="relative">
              <select 
                value={filterJenis}
                onChange={(e) => setFilterJenis(e.target.value)}
                className="w-full bg-slate-50 dark:bg-[#1e1e2f] border border-slate-300 dark:border-[#35374d] text-slate-800 dark:text-white rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none appearance-none"
              >
                <option value="Semua">Semua</option>
                <option value="Masuk">Masuk</option>
                <option value="Pulang">Pulang</option>
                <option value="Izin">Izin</option>
              </select>
              <ChevronDown size={16} className="absolute right-3 top-3 text-slate-500 pointer-events-none" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-2 uppercase">Status</label>
            <div className="relative">
              <select 
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="w-full bg-slate-50 dark:bg-[#1e1e2f] border border-slate-300 dark:border-[#35374d] text-slate-800 dark:text-white rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none appearance-none"
              >
                <option value="Semua">Semua</option>
                <option value="Hadir">Hadir</option>
                <option value="Terlambat">Terlambat</option>
                <option value="Bolos">Bolos</option>
                <option value="Pulang">Pulang</option>
                <option value="Izin">Izin</option>
                <option value="Sakit">Sakit</option>
              </select>
              <ChevronDown size={16} className="absolute right-3 top-3 text-slate-500 pointer-events-none" />
            </div>
          </div>
        </div>
        <div className="flex justify-end mt-4">
          <Button onClick={handleShowData} className="flex items-center gap-2">
            <Search size={16} />
            Tampilkan
          </Button>
        </div>
      </div>

      <Card className="overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-500 dark:text-slate-400 min-w-[800px]">
            <thead className="bg-slate-100 dark:bg-[#1e1e2f] text-slate-700 dark:text-slate-200 font-semibold uppercase text-xs">
              <tr>
                <th className="px-4 py-3 whitespace-nowrap">No</th>
                <th className="px-4 py-3 whitespace-nowrap">Tanggal</th>
                <th className="px-4 py-3 whitespace-nowrap">RFID</th>
                <th className="px-4 py-3 whitespace-nowrap">Nama Siswa</th>
                <th className="px-4 py-3 whitespace-nowrap">Jenis</th>
                <th className="px-4 py-3 whitespace-nowrap">Status</th>
                <th className="px-4 py-3 whitespace-nowrap">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-[#35374d]">
              {filteredRecords.map((r, index) => (
                <tr key={r.id} className="hover:bg-slate-50 dark:hover:bg-[#2e3048] transition-colors">
                  <td className="px-4 py-3">{index + 1}</td>
                  <td className="px-4 py-3 font-mono text-slate-500 whitespace-nowrap">{r.date_str}</td>
                  <td className="px-4 py-3 font-mono text-slate-500 whitespace-nowrap">{getRfid(r.student_id)}</td>
                  <td className="px-4 py-3 font-medium text-slate-800 dark:text-white whitespace-nowrap">{r.student_name}</td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span className={`px-2 py-1 rounded text-xs uppercase font-bold ${
                        getJenis(r.status) === 'Masuk' ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' : 
                        getJenis(r.status) === 'Pulang' ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400' : 
                        'bg-blue-500/10 text-blue-600 dark:text-blue-400'
                      }`}>
                      {getJenis(r.status)}
                    </span>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      r.status === 'Hadir' ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400' :
                      r.status === 'Terlambat' ? 'bg-amber-500/20 text-amber-600 dark:text-amber-400' :
                      r.status === 'Izin' ? 'bg-blue-500/20 text-blue-600 dark:text-blue-400' :
                      r.status === 'Sakit' ? 'bg-yellow-500/20 text-yellow-600 dark:text-yellow-400' :
                      r.status === 'Alpha' ? 'bg-red-500/20 text-red-600 dark:text-red-400' :
                      'bg-slate-500/20 text-slate-500 dark:text-slate-400'
                    }`}>
                      {r.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                       <button 
                          onClick={() => sendWhatsApp(r)}
                          className="bg-emerald-500 hover:bg-emerald-600 text-white p-2 rounded-full transition-colors flex items-center justify-center"
                          title="Kirim WA ke Wali Murid"
                        >
                          <MessageCircle size={16} />
                        </button>
                  </td>
                </tr>
              ))}
              {filteredRecords.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-slate-500">
                    Tidak ada data absensi sesuai filter.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};

// 6. REPORT GENERATOR COMPONENT
const ReportGenerator = ({ 
  students, 
  records,
  view,
  classes
}: { 
  students: Student[], 
  records: AttendanceRecord[], 
  view: 'range' | 'performa' | 'ai',
  classes: ClassRoom[]
}) => {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [filterJenis, setFilterJenis] = useState('Semua');
  const [filterStatus, setFilterStatus] = useState('Semua');
  const [rangeData, setRangeData] = useState<AttendanceRecord[]>([]);

  const [perfStartDate, setPerfStartDate] = useState('');
  const [perfEndDate, setPerfEndDate] = useState('');
  const [perfType, setPerfType] = useState<'rajin' | 'malas'>('rajin');
  const [perfClass, setPerfClass] = useState('Semua');
  const [perfData, setPerfData] = useState<any[]>([]);

  const [report, setReport] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);

  const handleShowRangeData = () => {
    const res = records.filter(r => {
      if (startDate && r.date_str < startDate) return false;
      if (endDate && r.date_str > endDate) return false;
      const jenis = r.status === 'Pulang' ? 'Pulang' : ['Izin', 'Sakit', 'Alpha'].includes(r.status) ? 'Izin' : 'Masuk';
      if (filterJenis !== 'Semua' && jenis !== filterJenis) return false;
      if (filterStatus !== 'Semua' && r.status !== filterStatus) return false;
      return true;
    }).sort((a, b) => b.timestamp - a.timestamp);
    
    setRangeData(res);
  };

  const handlePrint = () => {
    const printContent = document.getElementById('print-area');
    const win = window.open('', '', 'height=700,width=1000');
    if (win) {
      win.document.write('<html><head><title>Cetak Laporan</title>');
      win.document.write('<link href="https://cdn.tailwindcss.com" rel="stylesheet">');
      win.document.write('</head><body class="p-8">');
      win.document.write('<h1 class="text-2xl font-bold mb-4 text-center">Laporan Absensi</h1>');
      win.document.write(`<p class="text-center mb-6">Periode: ${startDate || '-'} s/d ${endDate || '-'}</p>`);
      win.document.write(printContent?.innerHTML || '');
      win.document.write('</body></html>');
      win.document.close();
      win.print();
    }
  };

  const handleExportRangeExcel = () => {
    const headers = "No,Tanggal,Waktu,RFID,Nama Siswa,Kelas,Jenis,Status,Keterangan";
    const rows = rangeData.map((r, index) => {
      const jenis = r.status === 'Pulang' ? 'Pulang' : ['Izin', 'Sakit', 'Alpha'].includes(r.status) ? 'Izin' : 'Masuk';
      const rfid = students.find(s => s.id === r.student_id)?.rfid_code || '-';
      return `${index + 1},"${r.date_str}","${r.time_str}","${rfid}","${r.student_name}","${r.class_name}","${jenis}","${r.status}","${r.description || ''}"`;
    });
    const csvContent = [headers, ...rows].join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `Laporan_Absensi_${startDate}_${endDate}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleShowPerfData = () => {
    const results = students.map(student => {
       const studentRecords = records.filter(r => {
         if (r.student_id !== student.id) return false;
         if (perfStartDate && r.date_str < perfStartDate) return false;
         if (perfEndDate && r.date_str > perfEndDate) return false;
         return true;
       });

       let score = 0;
       if (perfType === 'rajin') {
         score = studentRecords.filter(r => r.status === 'Hadir').length;
       } else {
         score = studentRecords.filter(r => ['Alpha', 'Bolos', 'Terlambat'].includes(r.status)).length;
       }

       return { ...student, score };
    });

    let filteredResults = results;
    if (perfClass !== 'Semua') {
      filteredResults = results.filter(s => s.class_name === perfClass);
    }
    filteredResults.sort((a, b) => b.score - a.score);
    setPerfData(filteredResults);
  };

  const handleGenerate = async () => {
    setIsLoading(true);
    const result = await generateAttendanceReport(records, students);
    setReport(result);
    setIsLoading(false);
  };

  if (view === 'range') {
    return (
       <div className="space-y-6">
          <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Laporan Absensi Periode</h2>
          
          <div className="bg-white dark:bg-[#27293d] p-6 rounded-xl border border-slate-200 dark:border-[#35374d]">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-2 uppercase">Tanggal Mulai</label>
                <div className="relative">
                  <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="w-full bg-slate-50 dark:bg-[#1e1e2f] border border-slate-300 dark:border-[#35374d] text-slate-800 dark:text-white rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
                  <Calendar size={16} className="absolute right-3 top-3 text-slate-500 pointer-events-none" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-2 uppercase">Tanggal Selesai</label>
                <div className="relative">
                   <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="w-full bg-slate-50 dark:bg-[#1e1e2f] border border-slate-300 dark:border-[#35374d] text-slate-800 dark:text-white rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
                   <Calendar size={16} className="absolute right-3 top-3 text-slate-500 pointer-events-none" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-2 uppercase">Jenis</label>
                <select value={filterJenis} onChange={(e) => setFilterJenis(e.target.value)} className="w-full bg-slate-50 dark:bg-[#1e1e2f] border border-slate-300 dark:border-[#35374d] text-slate-800 dark:text-white rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none">
                  <option value="Semua">Semua</option>
                  <option value="Masuk">Masuk</option>
                  <option value="Pulang">Pulang</option>
                  <option value="Izin">Izin</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-2 uppercase">Status</label>
                <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="w-full bg-slate-50 dark:bg-[#1e1e2f] border border-slate-300 dark:border-[#35374d] text-slate-800 dark:text-white rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none">
                  <option value="Semua">Semua</option>
                  <option value="Hadir">Hadir</option>
                  <option value="Terlambat">Terlambat</option>
                  <option value="Sakit">Sakit</option>
                  <option value="Izin">Izin</option>
                  <option value="Alpha">Alpha</option>
                </select>
              </div>
            </div>
            
            <div className="flex flex-wrap justify-end gap-3 mt-6 border-t border-slate-200 dark:border-[#35374d] pt-4">
               <Button onClick={handlePrint} variant="secondary" className="flex items-center gap-2">
                  <Printer size={16} /> Print
               </Button>
               <Button onClick={handleExportRangeExcel} variant="success" className="flex items-center gap-2">
                  <FileSpreadsheet size={16} /> Export Excel
               </Button>
               <Button onClick={handleShowRangeData} className="flex items-center gap-2">
                  <Search size={16} /> Tampilkan
               </Button>
            </div>
          </div>

          <Card className="overflow-hidden p-0">
             <div className="overflow-x-auto" id="print-area">
                <table className="w-full text-left text-sm text-slate-500 dark:text-slate-400 min-w-[800px]">
                   <thead className="bg-slate-100 dark:bg-[#1e1e2f] text-slate-700 dark:text-slate-200 font-semibold uppercase text-xs">
                      <tr>
                         <th className="px-4 py-3 border-b border-slate-200 dark:border-slate-700">No</th>
                         <th className="px-4 py-3 border-b border-slate-200 dark:border-slate-700">Tanggal</th>
                         <th className="px-4 py-3 border-b border-slate-200 dark:border-slate-700">Nama Siswa</th>
                         <th className="px-4 py-3 border-b border-slate-200 dark:border-slate-700">Kelas</th>
                         <th className="px-4 py-3 border-b border-slate-200 dark:border-slate-700">Status</th>
                         <th className="px-4 py-3 border-b border-slate-200 dark:border-slate-700">Jam</th>
                      </tr>
                   </thead>
                   <tbody className="divide-y divide-slate-200 dark:divide-[#35374d] text-slate-800 dark:text-slate-800">
                      {rangeData.map((r, index) => (
                         <tr key={r.id} className="text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-[#2e3048]">
                            <td className="px-4 py-3">{index + 1}</td>
                            <td className="px-4 py-3">{r.date_str}</td>
                            <td className="px-4 py-3 font-medium text-slate-800 dark:text-white">{r.student_name}</td>
                            <td className="px-4 py-3">{r.class_name}</td>
                            <td className="px-4 py-3">{r.status}</td>
                            <td className="px-4 py-3 font-mono">{r.time_str}</td>
                         </tr>
                      ))}
                      {rangeData.length === 0 && (
                         <tr><td colSpan={6} className="px-6 py-8 text-center text-slate-500">Silahkan filter data terlebih dahulu.</td></tr>
                      )}
                   </tbody>
                </table>
             </div>
          </Card>
       </div>
    );
  }

  if (view === 'performa') {
    return (
      <div className="space-y-6">
         <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Laporan Performa Siswa</h2>

         <div className="bg-white dark:bg-[#27293d] p-6 rounded-xl border border-slate-200 dark:border-[#35374d]">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
               <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-2 uppercase">Tanggal Mulai</label>
                <input type="date" value={perfStartDate} onChange={(e) => setPerfStartDate(e.target.value)} className="w-full bg-slate-50 dark:bg-[#1e1e2f] border border-slate-300 dark:border-[#35374d] text-slate-800 dark:text-white rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
               </div>
               <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-2 uppercase">Tanggal Selesai</label>
                <input type="date" value={perfEndDate} onChange={(e) => setPerfEndDate(e.target.value)} className="w-full bg-slate-50 dark:bg-[#1e1e2f] border border-slate-300 dark:border-[#35374d] text-slate-800 dark:text-white rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
               </div>
               <div>
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-2 uppercase">Kategori Performa</label>
                  <select value={perfType} onChange={(e) => setPerfType(e.target.value as 'rajin' | 'malas')} className="w-full bg-slate-50 dark:bg-[#1e1e2f] border border-slate-300 dark:border-[#35374d] text-slate-800 dark:text-white rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none">
                     <option value="rajin">Paling Rajin (Kehadiran Tepat Waktu)</option>
                     <option value="malas">Paling Malas (Alpha/Terlambat)</option>
                  </select>
               </div>
               <div>
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-2 uppercase">Kelas</label>
                  <select value={perfClass} onChange={(e) => setPerfClass(e.target.value)} className="w-full bg-slate-50 dark:bg-[#1e1e2f] border border-slate-300 dark:border-[#35374d] text-slate-800 dark:text-white rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none">
                     <option value="Semua">Semua Kelas</option>
                     {classes.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                  </select>
               </div>
            </div>
            <div className="flex justify-end mt-4">
               <Button onClick={handleShowPerfData} className="flex items-center gap-2">
                  <Trophy size={16} /> Tampilkan Peringkat
               </Button>
            </div>
         </div>

         <div className="grid grid-cols-1 gap-4">
            {perfData.slice(0, 5).map((student, index) => (
               <div key={student.id} className="bg-white dark:bg-[#27293d] p-4 rounded-xl border border-slate-200 dark:border-[#35374d] flex items-center gap-4 shadow-sm dark:shadow-none">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-xl shadow-lg ${
                     index === 0 ? 'bg-yellow-500 text-white' : 
                     index === 1 ? 'bg-slate-300 text-slate-600' : 
                     index === 2 ? 'bg-amber-700 text-amber-100' : 
                     'bg-slate-100 dark:bg-[#1e1e2f] text-slate-400 border border-slate-300 dark:border-slate-600'
                  }`}>
                     {index + 1}
                  </div>
                  <div className="w-12 h-12 rounded-full overflow-hidden bg-slate-200 dark:bg-slate-600">
                     <img src={student.photo_url} alt={student.name} className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1">
                     <h4 className="text-slate-800 dark:text-white font-bold text-lg">{student.name}</h4>
                     <p className="text-slate-500 dark:text-slate-400 text-sm">{student.class_name} - {student.nis}</p>
                  </div>
                  <div className="text-right">
                     <p className="text-3xl font-bold text-slate-800 dark:text-white">{student.score}</p>
                     <p className="text-xs text-slate-500 uppercase">{perfType === 'rajin' ? 'Hadir' : 'Pelanggaran'}</p>
                  </div>
               </div>
            ))}
            {perfData.length === 0 && (
               <div className="text-center py-10 text-slate-500">Klik "Tampilkan Peringkat" untuk melihat data.</div>
            )}
         </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex justify-between items-center">
         <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Laporan Cerdas AI</h2>
         <Button onClick={handleGenerate} isLoading={isLoading} disabled={isLoading}>
           {report ? 'Buat Ulang Laporan' : 'Buat Laporan Harian'}
         </Button>
      </div>

      {report && (
        <Card className="prose prose-invert max-w-none">
          <div className="whitespace-pre-wrap text-slate-600 dark:text-slate-300 leading-relaxed">
            {report}
          </div>
        </Card>
      )}
      
      {!report && !isLoading && (
        <div className="text-center py-20 text-slate-500 border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-xl">
          <FileText size={48} className="mx-auto mb-4 opacity-50" />
          <p>Tekan tombol di atas untuk membuat laporan analisis absensi otomatis.</p>
        </div>
      )}
    </div>
  );
};

// --- MAIN APP COMPONENT ---
export default function App() {
  const [activePage, setActivePage] = useState<Page>(Page.DASHBOARD);
  const [masterDataView, setMasterDataView] = useState<'siswa' | 'kelas' | 'guru' | 'pengaturan'>('siswa');
  const [dataAbsensiView, setDataAbsensiView] = useState<'today' | 'range'>('today');
  const [reportView, setReportView] = useState<'range' | 'performa' | 'ai'>('range');
  
  const [isMasterMenuOpen, setIsMasterMenuOpen] = useState(false);
  const [isPresensiMenuOpen, setIsPresensiMenuOpen] = useState(false);
  const [isDataAbsensiMenuOpen, setIsDataAbsensiMenuOpen] = useState(false);
  const [isReportMenuOpen, setIsReportMenuOpen] = useState(false);
  
  const [presensiMode, setPresensiMode] = useState<'masuk' | 'pulang' | 'izin'>('masuk');
  
  // --- PERSISTENT STATE ---
  // All major data is now wrapped with useLocalStorage to persist across refreshes.
  const [students, setStudents] = useLocalStorage<Student[]>('anoza_students', DEFAULT_STUDENTS);
  const [classes, setClasses] = useLocalStorage<ClassRoom[]>('anoza_classes', DEFAULT_CLASSES);
  const [teachers, setTeachers] = useLocalStorage<PicketTeacher[]>('anoza_teachers', DEFAULT_TEACHERS);
  const [records, setRecords] = useLocalStorage<AttendanceRecord[]>('anoza_records', []);
  const [appSettings, setAppSettings] = useLocalStorage<AppSettings>('anoza_settings', DEFAULT_SETTINGS);
  const [currentUser, setCurrentUser] = useLocalStorage<any>('anoza_user', null);
  const [isDarkMode, setIsDarkMode] = useLocalStorage<boolean>('anoza_theme', true);

  // Derived state for login status
  const isLoggedIn = !!currentUser;

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  const toggleTheme = () => setIsDarkMode(!isDarkMode);

  // --- WhatsApp Fonnte API Logic ---
  const sendFonnteWhatsApp = async (student: Student, record: AttendanceRecord) => {
    // 1. Check configuration
    if (!appSettings.whatsappToken) {
      // Silent return if no token configured
      return;
    }

    if (!student.guardian_phone) {
      console.warn("Guardian phone number not found for student:", student.name);
      return;
    }

    // 2. Format Phone Number to International ID (remove leading 0 or +)
    let formattedPhone = student.guardian_phone.replace(/\D/g, ''); // remove non-digits
    if (formattedPhone.startsWith('0')) {
      formattedPhone = '62' + formattedPhone.slice(1);
    } else if (!formattedPhone.startsWith('62')) {
      // Default assumption: if no code provided, assume Indonesia
      formattedPhone = '62' + formattedPhone;
    }

    // 3. Construct Message
    const message = `📚 *INFORMASI ABSENSI SISWA*
Nama: ${student.name}
Kelas: ${student.class_name}
Status: ${record.status}
Waktu: ${record.date_str} ${record.time_str}

Terima kasih.`;

    // 4. API Request
    try {
      // Use FormData as requested ("Body form-data")
      const formData = new FormData();
      formData.append('target', formattedPhone);
      formData.append('message', message);

      const response = await fetch("https://api.fonnte.com/send", {
        method: "POST",
        headers: {
          "Authorization": appSettings.whatsappToken,
          // Do NOT set Content-Type to application/json when using FormData, browser sets boundary automatically
        },
        body: formData
      });

      const data = await response.json();

      if (data.status) {
        console.log("WA Berhasil Dikirim");
      } else {
        // Improved error logging to show the object content
        console.error("Gagal mengirim WA (Fonnte Error):", JSON.stringify(data));
        
        // Handle specific "Disconnected" error to guide the user
        if (data.reason === 'request invalid on disconnected device') {
            alert(`GAGAL KIRIM WA: Device Fonnte Terputus!\n\nMohon buka https://fonnte.com, login, dan SCAN QR CODE kembali agar notifikasi dapat berjalan.\n\n(Siswa: ${student.name})`);
        }
      }
    } catch (err) {
      console.error("Gagal mengirim pesan WhatsApp (Network Error):", err);
    }
  };

  const handleScan = (student: Student, status: AttendanceRecord['status'], description?: string) => {
    const today = new Date().toISOString().split('T')[0];
    const existing = records.find(r => r.student_id === student.id && r.date_str === today);
    
    // Logic: Prevent multiple 'Masuk' but allow 'Pulang' after 'Masuk'
    if (existing && existing.status !== 'Pulang' && status !== 'Pulang') {
      return false;
    }

    const now = new Date();
    const newRecord: AttendanceRecord = {
      id: Date.now().toString(),
      student_id: student.id,
      student_name: student.name,
      class_name: student.class_name,
      timestamp: now.getTime(),
      date_str: today,
      time_str: now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      status: status,
      description: description || ''
    };
    
    setRecords(prev => [newRecord, ...prev]);
    
    // Trigger WhatsApp Sending
    sendFonnteWhatsApp(student, newRecord);

    return true;
  };

  const handleAddStudent = (s: Student) => {
    setStudents(prev => [...prev, s]);
  };

  // New handler for Bulk Import to fix overwrite issue
  const handleImportStudents = (newStudents: Student[]) => {
    setStudents(prev => [...prev, ...newStudents]);
  };

  const handleEditStudent = (updatedStudent: Student) => {
    setStudents(students.map(s => s.id === updatedStudent.id ? updatedStudent : s));
  };

  const handleDeleteStudent = (id: string) => {
    setStudents(prev => prev.filter(s => s.id !== id));
  }

  const handleAddClass = (c: ClassRoom) => {
    setClasses([...classes, c]);
  };

  const handleEditClass = (updatedClass: ClassRoom) => {
    setClasses(classes.map(c => c.id === updatedClass.id ? updatedClass : c));
  };

  const handleDeleteClass = (id: string) => {
    setClasses(prev => prev.filter(c => c.id !== id));
  };

  const handleAddTeacher = (t: PicketTeacher) => {
    setTeachers([...teachers, t]);
  };

  const handleEditTeacher = (updatedTeacher: PicketTeacher) => {
    setTeachers(teachers.map(t => t.id === updatedTeacher.id ? updatedTeacher : t));
  };

  const handleDeleteTeacher = (id: string) => {
    setTeachers(prev => prev.filter(t => t.id !== id));
  };

  const handleLogin = (user: any) => {
    setCurrentUser(user);
  };

  if (!isLoggedIn) {
    return <Login onLogin={handleLogin} teachers={teachers} appSettings={appSettings} />;
  }

  return (
    <div className="flex min-h-screen bg-slate-100 dark:bg-[#1e1e2f] text-slate-800 dark:text-slate-200 font-sans overflow-hidden transition-colors duration-300">
      
      {/* SIDEBAR */}
      <div className="w-64 bg-white dark:bg-[#1e1e2f] border-r border-slate-200 dark:border-[#35374d] flex flex-col flex-shrink-0 transition-all duration-300">
        <div className="p-8 flex flex-col items-center gap-4 border-b border-slate-200 dark:border-[#35374d]/50">
           <div className="flex flex-col items-center gap-2">
              <div className="w-24 h-24 bg-blue-50 dark:bg-blue-600/20 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-900/5 dark:shadow-blue-900/20 overflow-hidden border border-blue-100 dark:border-blue-500/30 p-2">
                {appSettings.appLogo ? (
                  <img src={appSettings.appLogo} alt="Logo" className="w-full h-full object-contain" />
                ) : (
                  <span className="font-bold text-blue-600 dark:text-white text-4xl">{appSettings.appName.charAt(0)}</span>
                )}
              </div>
              <span className="font-bold text-lg text-slate-800 dark:text-white tracking-wide text-center leading-tight">{appSettings.appName}</span>
           </div>
        </div>

        <nav className="flex-1 px-4 space-y-2 mt-4 overflow-y-auto custom-scrollbar">
           <p className="text-[10px] font-bold text-slate-500 px-4 mb-2 uppercase tracking-wider">Menu</p>
           
           <button 
              onClick={() => setActivePage(Page.DASHBOARD)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 group ${activePage === Page.DASHBOARD ? 'bg-blue-600 shadow-lg shadow-blue-600/20 dark:shadow-blue-900/20 text-white' : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-[#27293d] hover:text-slate-800 dark:hover:text-slate-200'}`}
           >
              <LayoutDashboard size={20} className={activePage === Page.DASHBOARD ? 'text-white' : 'text-slate-500 group-hover:text-slate-800 dark:group-hover:text-slate-300'} />
              <span className="font-medium">Dashboard</span>
           </button>

           {/* Presensi Expandable Menu */}
           <div className="space-y-1">
             <button 
                onClick={() => setIsPresensiMenuOpen(!isPresensiMenuOpen)}
                className={`w-full flex items-center justify-between px-4 py-3 rounded-lg transition-all duration-200 group ${activePage === Page.PRESENSI ? 'text-blue-600 dark:text-white bg-blue-50 dark:bg-[#27293d]' : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-[#27293d] hover:text-slate-800 dark:hover:text-slate-200'}`}
             >
                <div className="flex items-center gap-3">
                   <ScanLine size={20} className={activePage === Page.PRESENSI ? 'text-blue-600 dark:text-blue-400' : 'text-slate-500 group-hover:text-slate-800 dark:group-hover:text-slate-300'} />
                   <span className="font-medium">Presensi</span>
                </div>
                <ChevronDown size={16} className={`text-slate-400 dark:text-slate-600 transition-transform duration-200 ${isPresensiMenuOpen ? 'rotate-180' : ''}`} />
             </button>

             {isPresensiMenuOpen && (
               <div className="pl-4 space-y-1">
                  <button 
                    onClick={() => { setActivePage(Page.PRESENSI); setPresensiMode('masuk'); }}
                    className={`w-full flex items-center gap-3 px-4 py-2 rounded-lg text-sm transition-colors ${activePage === Page.PRESENSI && presensiMode === 'masuk' ? 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-[#27293d]' : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#27293d]/50'}`}
                  >
                    <span className={`w-1.5 h-1.5 rounded-full ${activePage === Page.PRESENSI && presensiMode === 'masuk' ? 'bg-blue-600 dark:bg-blue-400' : 'bg-slate-400 dark:bg-slate-600'}`}></span>
                    Masuk
                  </button>
                  <button 
                    onClick={() => { setActivePage(Page.PRESENSI); setPresensiMode('pulang'); }}
                    className={`w-full flex items-center gap-3 px-4 py-2 rounded-lg text-sm transition-colors ${activePage === Page.PRESENSI && presensiMode === 'pulang' ? 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-[#27293d]' : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#27293d]/50'}`}
                  >
                    <span className={`w-1.5 h-1.5 rounded-full ${activePage === Page.PRESENSI && presensiMode === 'pulang' ? 'bg-blue-600 dark:bg-blue-400' : 'bg-slate-400 dark:bg-slate-600'}`}></span>
                    Pulang
                  </button>
                  <button 
                    onClick={() => { setActivePage(Page.PRESENSI); setPresensiMode('izin'); }}
                    className={`w-full flex items-center gap-3 px-4 py-2 rounded-lg text-sm transition-colors ${activePage === Page.PRESENSI && presensiMode === 'izin' ? 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-[#27293d]' : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#27293d]/50'}`}
                  >
                    <span className={`w-1.5 h-1.5 rounded-full ${activePage === Page.PRESENSI && presensiMode === 'izin' ? 'bg-blue-600 dark:bg-blue-400' : 'bg-slate-400 dark:bg-slate-600'}`}></span>
                    Izin
                  </button>
               </div>
             )}
           </div>

           <div className="space-y-1">
             <button 
                onClick={() => setIsMasterMenuOpen(!isMasterMenuOpen)}
                className={`w-full flex items-center justify-between px-4 py-3 rounded-lg transition-all duration-200 group ${activePage === Page.MASTER_DATA ? 'text-blue-600 dark:text-white bg-blue-50 dark:bg-[#27293d]' : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-[#27293d] hover:text-slate-800 dark:hover:text-slate-200'}`}
             >
                <div className="flex items-center gap-3">
                   <Users size={20} className={activePage === Page.MASTER_DATA ? 'text-blue-600 dark:text-blue-400' : 'text-slate-500 group-hover:text-slate-800 dark:group-hover:text-slate-300'} />
                   <span className="font-medium">Master Data</span>
                </div>
                <ChevronDown size={16} className={`text-slate-400 dark:text-slate-600 transition-transform duration-200 ${isMasterMenuOpen ? 'rotate-180' : ''}`} />
             </button>

             {isMasterMenuOpen && (
               <div className="pl-4 space-y-1">
                  <button 
                    onClick={() => { setActivePage(Page.MASTER_DATA); setMasterDataView('siswa'); }}
                    className={`w-full flex items-center gap-3 px-4 py-2 rounded-lg text-sm transition-colors ${activePage === Page.MASTER_DATA && masterDataView === 'siswa' ? 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-[#27293d]' : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#27293d]/50'}`}
                  >
                    <span className={`w-1.5 h-1.5 rounded-full ${activePage === Page.MASTER_DATA && masterDataView === 'siswa' ? 'bg-blue-600 dark:bg-blue-400' : 'bg-slate-400 dark:bg-slate-600'}`}></span>
                    Siswa
                  </button>
                  <button 
                    onClick={() => { setActivePage(Page.MASTER_DATA); setMasterDataView('kelas'); }}
                    className={`w-full flex items-center gap-3 px-4 py-2 rounded-lg text-sm transition-colors ${activePage === Page.MASTER_DATA && masterDataView === 'kelas' ? 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-[#27293d]' : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#27293d]/50'}`}
                  >
                    <span className={`w-1.5 h-1.5 rounded-full ${activePage === Page.MASTER_DATA && masterDataView === 'kelas' ? 'bg-blue-600 dark:bg-blue-400' : 'bg-slate-400 dark:bg-slate-600'}`}></span>
                    Kelas
                  </button>
                  <button 
                    onClick={() => { setActivePage(Page.MASTER_DATA); setMasterDataView('guru'); }}
                    className={`w-full flex items-center gap-3 px-4 py-2 rounded-lg text-sm transition-colors ${activePage === Page.MASTER_DATA && masterDataView === 'guru' ? 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-[#27293d]' : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#27293d]/50'}`}
                  >
                    <span className={`w-1.5 h-1.5 rounded-full ${activePage === Page.MASTER_DATA && masterDataView === 'guru' ? 'bg-blue-600 dark:bg-blue-400' : 'bg-slate-400 dark:bg-slate-600'}`}></span>
                    Guru Piket
                  </button>
                  <button 
                    onClick={() => { setActivePage(Page.MASTER_DATA); setMasterDataView('pengaturan'); }}
                    className={`w-full flex items-center gap-3 px-4 py-2 rounded-lg text-sm transition-colors ${activePage === Page.MASTER_DATA && masterDataView === 'pengaturan' ? 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-[#27293d]' : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#27293d]/50'}`}
                  >
                    <span className={`w-1.5 h-1.5 rounded-full ${activePage === Page.MASTER_DATA && masterDataView === 'pengaturan' ? 'bg-blue-600 dark:bg-blue-400' : 'bg-slate-400 dark:bg-slate-600'}`}></span>
                    Pengaturan
                  </button>
               </div>
             )}
           </div>

           <div className="space-y-1">
             <button 
                onClick={() => setIsDataAbsensiMenuOpen(!isDataAbsensiMenuOpen)}
                className={`w-full flex items-center justify-between px-4 py-3 rounded-lg transition-all duration-200 group ${activePage === Page.DATA_ABSENSI ? 'text-blue-600 dark:text-white bg-blue-50 dark:bg-[#27293d]' : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-[#27293d] hover:text-slate-800 dark:hover:text-slate-200'}`}
             >
                <div className="flex items-center gap-3">
                   <ClipboardList size={20} className={activePage === Page.DATA_ABSENSI ? 'text-blue-600 dark:text-blue-400' : 'text-slate-500 group-hover:text-slate-800 dark:group-hover:text-slate-300'} />
                   <span className="font-medium">Data Absensi</span>
                </div>
                <ChevronDown size={16} className={`text-slate-400 dark:text-slate-600 transition-transform duration-200 ${isDataAbsensiMenuOpen ? 'rotate-180' : ''}`} />
             </button>

             {isDataAbsensiMenuOpen && (
               <div className="pl-4 space-y-1">
                  <button 
                    onClick={() => { setActivePage(Page.DATA_ABSENSI); setDataAbsensiView('today'); }}
                    className={`w-full flex items-center gap-3 px-4 py-2 rounded-lg text-sm transition-colors ${activePage === Page.DATA_ABSENSI && dataAbsensiView === 'today' ? 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-[#27293d]' : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#27293d]/50'}`}
                  >
                    <span className={`w-1.5 h-1.5 rounded-full ${activePage === Page.DATA_ABSENSI && dataAbsensiView === 'today' ? 'bg-blue-600 dark:bg-blue-400' : 'bg-slate-400 dark:bg-slate-600'}`}></span>
                    Hari Ini
                  </button>
                  <button 
                    onClick={() => { setActivePage(Page.DATA_ABSENSI); setDataAbsensiView('range'); }}
                    className={`w-full flex items-center gap-3 px-4 py-2 rounded-lg text-sm transition-colors ${activePage === Page.DATA_ABSENSI && dataAbsensiView === 'range' ? 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-[#27293d]' : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#27293d]/50'}`}
                  >
                    <span className={`w-1.5 h-1.5 rounded-full ${activePage === Page.DATA_ABSENSI && dataAbsensiView === 'range' ? 'bg-blue-600 dark:bg-blue-400' : 'bg-slate-400 dark:bg-slate-600'}`}></span>
                    By Range
                  </button>
               </div>
             )}
           </div>

           <div className="space-y-1">
             <button 
                onClick={() => setIsReportMenuOpen(!isReportMenuOpen)}
                className={`w-full flex items-center justify-between px-4 py-3 rounded-lg transition-all duration-200 group ${activePage === Page.LAPORAN ? 'text-blue-600 dark:text-white bg-blue-50 dark:bg-[#27293d]' : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-[#27293d] hover:text-slate-800 dark:hover:text-slate-200'}`}
             >
                <div className="flex items-center gap-3">
                   <FileText size={20} className={activePage === Page.LAPORAN ? 'text-blue-600 dark:text-blue-400' : 'text-slate-500 group-hover:text-slate-800 dark:group-hover:text-slate-300'} />
                   <span className="font-medium">Laporan</span>
                </div>
                <ChevronDown size={16} className={`text-slate-400 dark:text-slate-600 transition-transform duration-200 ${isReportMenuOpen ? 'rotate-180' : ''}`} />
             </button>

             {isReportMenuOpen && (
               <div className="pl-4 space-y-1">
                  <button 
                    onClick={() => { setActivePage(Page.LAPORAN); setReportView('range'); }}
                    className={`w-full flex items-center gap-3 px-4 py-2 rounded-lg text-sm transition-colors ${activePage === Page.LAPORAN && reportView === 'range' ? 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-[#27293d]' : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#27293d]/50'}`}
                  >
                    <span className={`w-1.5 h-1.5 rounded-full ${activePage === Page.LAPORAN && reportView === 'range' ? 'bg-blue-600 dark:bg-blue-400' : 'bg-slate-400 dark:bg-slate-600'}`}></span>
                    By Range
                  </button>
                  <button 
                    onClick={() => { setActivePage(Page.LAPORAN); setReportView('performa'); }}
                    className={`w-full flex items-center gap-3 px-4 py-2 rounded-lg text-sm transition-colors ${activePage === Page.LAPORAN && reportView === 'performa' ? 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-[#27293d]' : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#27293d]/50'}`}
                  >
                    <span className={`w-1.5 h-1.5 rounded-full ${activePage === Page.LAPORAN && reportView === 'performa' ? 'bg-blue-600 dark:bg-blue-400' : 'bg-slate-400 dark:bg-slate-600'}`}></span>
                    By Performa
                  </button>
                  <button 
                    onClick={() => { setActivePage(Page.LAPORAN); setReportView('ai'); }}
                    className={`w-full flex items-center gap-3 px-4 py-2 rounded-lg text-sm transition-colors ${activePage === Page.LAPORAN && reportView === 'ai' ? 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-[#27293d]' : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#27293d]/50'}`}
                  >
                    <span className={`w-1.5 h-1.5 rounded-full ${activePage === Page.LAPORAN && reportView === 'ai' ? 'bg-blue-600 dark:bg-blue-400' : 'bg-slate-400 dark:bg-slate-600'}`}></span>
                    AI Analysis
                  </button>
               </div>
             )}
           </div>

           <div className="pt-8">
             <button 
                onClick={() => {
                  setCurrentUser(null);
                  // isLoggedIn is derived from currentUser, so UI updates automatically
                }}
                className="w-full flex items-center gap-3 px-4 py-3 text-slate-500 dark:text-slate-400 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors"
             >
                <LogOutIcon size={20} />
                <span className="font-medium">Logout</span>
             </button>
           </div>
        </nav>
      </div>

      {/* MAIN CONTENT */}
      <div className="flex-1 flex flex-col overflow-hidden bg-slate-50 dark:bg-[#1e1e2f] transition-colors duration-300">
        {/* Top Bar */}
        <header className="h-16 border-b border-slate-200 dark:border-[#35374d] flex items-center justify-between px-8 bg-white dark:bg-[#1e1e2f] transition-colors duration-300">
           <h2 className="text-xl font-semibold text-slate-800 dark:text-white capitalize">
             {activePage === Page.MASTER_DATA ? `Master Data / ${masterDataView}` : 
              activePage === Page.PRESENSI ? `Presensi / ${presensiMode}` : 
              activePage === Page.DATA_ABSENSI ? `Data Absensi / ${dataAbsensiView === 'today' ? 'Hari Ini' : 'By Range'}` :
              activePage === Page.LAPORAN ? `Laporan / ${reportView === 'range' ? 'By Range' : reportView === 'performa' ? 'By Performa' : 'AI Analysis'}` :
              activePage.replace('_', ' ')}
           </h2>
           <div className="flex items-center gap-4">
              <div 
                onClick={toggleTheme} 
                className="flex items-center gap-2 bg-slate-100 dark:bg-[#27293d] px-3 py-1.5 rounded-full border border-slate-200 dark:border-[#35374d] cursor-pointer hover:bg-slate-200 dark:hover:bg-[#32344d] transition-colors"
              >
                <Sun size={16} className="text-yellow-500" />
                <div className="w-8 h-4 bg-slate-300 dark:bg-[#1e1e2f] rounded-full relative border border-slate-400 dark:border-slate-600 transition-colors">
                   <div className={`absolute top-0.5 w-3 h-3 bg-white rounded-full transition-all duration-300 ${isDarkMode ? 'right-0.5' : 'left-0.5'}`}></div>
                </div>
                <Moon size={16} className="text-slate-400" />
              </div>
              <div className="flex items-center gap-3">
                <div className="text-right hidden sm:block">
                  <p className="text-sm font-medium text-slate-800 dark:text-white">{currentUser?.username || 'Admin'}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Administrator</p>
                </div>
                <div className="w-8 h-8 bg-gradient-to-tr from-blue-500 to-purple-500 rounded-full"></div>
              </div>
           </div>
        </header>

        {/* Content Area */}
        <main className="flex-1 overflow-y-auto p-8 custom-scrollbar flex flex-col">
           <div className="flex-1">
               {activePage === Page.DASHBOARD && <Dashboard students={students} records={records} classes={classes} teachers={teachers} currentUser={currentUser} />}
               {activePage === Page.PRESENSI && <AttendanceScanner students={students} records={records} onScan={handleScan} initialMode={presensiMode} />}
               {activePage === Page.MASTER_DATA && (
                 <MasterData 
                    students={students}
                    classes={classes}
                    teachers={teachers}
                    onAddStudent={handleAddStudent} 
                    onEditStudent={handleEditStudent}
                    onDeleteStudent={handleDeleteStudent} 
                    onAddClass={handleAddClass}
                    onEditClass={handleEditClass}
                    onDeleteClass={handleDeleteClass}
                    onAddTeacher={handleAddTeacher}
                    onEditTeacher={handleEditTeacher}
                    onDeleteTeacher={handleDeleteTeacher}
                    view={masterDataView}
                    appSettings={appSettings}
                    onUpdateSettings={setAppSettings}
                    onImportStudents={handleImportStudents}
                 />
               )}
               {activePage === Page.DATA_ABSENSI && <AttendanceHistory records={records} students={students} view={dataAbsensiView} appSettings={appSettings} />}
               {activePage === Page.LAPORAN && <ReportGenerator students={students} records={records} view={reportView} classes={classes} />}
           </div>
           
           <div className="mt-10 pt-6 border-t border-slate-200 dark:border-[#35374d] text-center">
              <p className="text-slate-400 dark:text-slate-500 text-sm font-medium tracking-wide">
                dibuat oleh : akanghida @{new Date().getFullYear()}
              </p>
           </div>
        </main>
      </div>

    </div>
  );
}
