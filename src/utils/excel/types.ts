
import JsPDF from 'jspdf';

// Export interfaces for use in other components
export interface StudentRecord {
  CNo: string; // We'll keep this for backward compatibility, but won't focus on it
  SEM: string;
  REGNO: string;
  SCODE: string;
  GR: string;
  creditValue?: number;
  subjectName?: string; // Added for storing subject names
  facultyName?: string; // Added for storing faculty names
  fileSource?: string; // To track which file the record came from
}

export interface ClassificationData {
  distinction: number;
  firstClassWOA: number; // Without arrears
  firstClassWA: number;  // With arrears
  secondClassWOA: number; // Without arrears
  secondClassWA: number;  // With arrears
  fail: number;
  totalStudents: number;
  passPercentage: number;
}

export interface ResultAnalysis {
  totalStudents: number;
  averageCGPA: number;
  highestSGPA: number;
  lowestSGPA: number;
  gradeDistribution: { name: string; count: number; fill: string }[];
  totalGrades: number;
  subjectPerformance: { subject: string; pass: number; fail: number }[];
  topPerformers: { id: string; sgpa: number; grade: string }[];
  needsImprovement: { id: string; sgpa: number; subjects: string }[];
  studentSgpaDetails?: { id: string; sgpa: number; hasArrears: boolean }[];
  passFailData: { name: string; value: number; fill: string }[];
  subjectGradeDistribution: { [subject: string]: { name: string; count: number; fill: string }[] };
  fileCount?: number; // Number of files processed
  filesProcessed?: string[]; // Names of files processed
  fileWiseAnalysis?: { 
    [fileName: string]: {
      averageSGPA: number;
      students: number;
      semesterName?: string;
    } 
  }; // Analysis per file
  cgpaAnalysis?: {
    studentCGPAs: { id: string; cgpa: number }[];
    averageCGPA: number;
    highestCGPA: number;
    lowestCGPA: number;
    toppersList?: { id: string; cgpa: number }[]; // Added for toppers list
    currentSemesterFile?: string; // File representing the current semester
  }; // CGPA analysis when multiple files
  singleFileClassification: ClassificationData; // Classification for single file/semester
  multipleFileClassification: ClassificationData; // Classification for multiple files/semesters
  currentSemesterFile?: string; // Added for direct access to current semester file
}

// Re-export JsPDF with the autotable extension for use in other files
declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: any) => jsPDF;
  }
}

// Color mappings and utilities
export const gradePointMap: { [grade: string]: number } = {
  'O': 10,
  'A+': 9,
  'A': 8,
  'B+': 7,
  'B': 6,
  'C': 5,
  'P': 4,
  'U': 0,
};

export const gradeColors: { [grade: string]: string } = {
  'O': '#10b981',   // Emerald green
  'A+': '#34d399',  // Teal green
  'A': '#6ee7b7',   // Light green
  'B+': '#facc15',  // Yellow
  'B': '#fbbf24',   // Amber
  'C': '#f97316',   // Orange
  'P': '#ef4444',   // Red
  'U': '#dc2626',   // Dark red
};

export const passFailColors = {
  pass: '#22c55e',  // Green
  fail: '#ef4444',  // Red
};
