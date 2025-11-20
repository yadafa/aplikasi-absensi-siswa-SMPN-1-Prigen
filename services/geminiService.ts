import { GoogleGenAI } from "@google/genai";
import { AttendanceRecord, Student } from "../types";

// Initialize Gemini AI
// Note: In a real scenario, strict error handling for missing env var is needed.
// Here we assume the environment provides it as per instructions.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const generateAttendanceReport = async (
  records: AttendanceRecord[],
  students: Student[]
): Promise<string> => {
  try {
    // Prepare data for the prompt
    const totalStudents = students.length;
    const today = new Date().toISOString().split('T')[0];
    
    // Filter for records belonging to today
    const todayRecords = records.filter(r => r.date_str === today);
    
    // Get unique students who are present (Hadir or Terlambat)
    const presentStudentIds = new Set(
      todayRecords
        .filter(r => r.status === 'Hadir' || r.status === 'Terlambat')
        .map(r => r.student_id)
    );

    const permissionCount = todayRecords.filter(r => r.status === 'Izin').length;
    
    const summaryData = {
      total_students: totalStudents,
      attendance_count: presentStudentIds.size, // Unique students present
      late_count: todayRecords.filter(r => r.status === 'Terlambat').length,
      permission_count: permissionCount,
      checkout_count: todayRecords.filter(r => r.status === 'Pulang').length,
      date: today,
      sample_records: todayRecords.slice(0, 15) 
    };

    const prompt = `
      Bertindaklah sebagai analis data sekolah. Saya akan memberikan data ringkasan absensi hari ini dalam format JSON.
      
      Data: ${JSON.stringify(summaryData)}

      Tolong buatkan laporan singkat dan profesional dalam format Markdown (Bahasa Indonesia) yang mencakup:
      1. **Ringkasan Eksekutif**: Persentase kehadiran (Siswa yang status Hadir/Terlambat dibanding Total).
      2. **Analisis Keterlambatan**: Seberapa parah tingkat keterlambatan.
      3. **Catatan Izin**: Jumlah siswa yang izin.
      4. **Rekomendasi**: Saran singkat untuk meningkatkan kedisiplinan.
      
      Gunakan format yang rapi dengan bullet points. Jangan sertakan JSON dalam output, hanya teks laporan.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    return response.text || "Gagal menghasilkan laporan.";
  } catch (error) {
    console.error("Error generating report:", error);
    return "Maaf, terjadi kesalahan saat menghubungkan ke layanan AI untuk membuat laporan. Pastikan API Key valid.";
  }
};