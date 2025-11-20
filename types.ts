
export enum Page {
  DASHBOARD = 'dashboard',
  PRESENSI = 'presensi',
  MASTER_DATA = 'master_data',
  DATA_ABSENSI = 'data_absensi',
  LAPORAN = 'laporan',
}

export interface Student {
  id: string;
  rfid_code: string;
  name: string;
  class_name: string;
  gender: 'L' | 'P';
  nis: string;
  student_phone: string;
  guardian_name: string;
  guardian_phone: string;
  photo_url?: string;
}

export interface ClassRoom {
  id: string;
  name: string;
  homeroom_teacher: string;
}

export interface PicketTeacher {
  id: string;
  username: string;
  email: string;
  password?: string;
}

export interface AttendanceRecord {
  id: string;
  student_id: string;
  student_name: string;
  class_name: string;
  timestamp: number; // Unix timestamp
  date_str: string; // YYYY-MM-DD
  time_str: string; // HH:mm
  status: 'Hadir' | 'Terlambat' | 'Izin' | 'Pulang' | 'Sakit' | 'Alpha';
  description?: string;
}

export interface User {
  username: string;
  role: 'admin';
}

export interface DashboardStats {
  totalStudents: number;
  presentToday: number;
  lateToday: number;
}

export interface AppSettings {
  appName: string;
  appLogo: string;
  checkInTime: string;
  checkOutTime: string;
  waTemplate?: string; // Legacy click-to-chat template
  // Fonnte API Config
  whatsappToken?: string;
}
