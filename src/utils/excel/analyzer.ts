
import { Document } from 'docx';
import { StudentRecord } from './types';
import { convertGradeToScore, getGradeDistribution, getPerformanceCategory } from './gradeUtils';
import { generateWordReport } from './reportGenerators/wordReportGenerator';

// Updated to include current semester subjects
export const analyzeResults = (
  records: (StudentRecord & { creditValue: number; isCurrentSemester?: boolean })[], 
  subjectCodes: string[],
  currentSemesterCodes: string[] // New parameter to identify current semester subjects
) => {
  // Filter records to only include subjects in the provided subject codes
  const filteredRecords = records.filter(record => subjectCodes.includes(record.SCODE));
  
  // Calculate student GPAs
  const studentGpas = calculateStudentGpas(filteredRecords);
  
  // Get unique students and calculate average GPA
  const uniqueStudents = [...new Set(filteredRecords.map(record => record.REGNO))];
  const averageGpa = calculateAverageGpa(studentGpas);
  
  // Get subject-wise performance
  const subjectPerformance = calculateSubjectPerformance(filteredRecords);
  
  // Get grade distribution
  const gradeDistribution = getGradeDistribution(filteredRecords);
  
  // Get student performance categories
  const performanceCategories = calculatePerformanceCategories(studentGpas);
  
  // Get current semester subject performance (new)
  const currentSemesterSubjectPerformance = calculateSubjectPerformance(
    filteredRecords.filter(record => currentSemesterCodes.includes(record.SCODE))
  );

  // Get overall student performance for current semester (new)
  const currentSemesterStudentGpas = calculateStudentGpas(
    filteredRecords.filter(record => currentSemesterCodes.includes(record.SCODE))
  );

  return {
    studentSgpaDetails: studentGpas,
    averageGpa,
    uniqueStudentCount: uniqueStudents.length,
    subjectPerformance,
    gradeDistribution,
    performanceCategories,
    currentSemesterSubjectPerformance, // New field
    currentSemesterStudentGpas, // New field
  };
};

const calculateStudentGpas = (records: (StudentRecord & { creditValue: number })[]) => {
  const studentGpas: { id: string; sgpa: number; hasArrears: boolean }[] = [];
  const uniqueStudents = [...new Set(records.map(record => record.REGNO))];
  
  uniqueStudents.forEach(studentId => {
    const studentRecords = records.filter(record => record.REGNO === studentId);
    const totalCredits = studentRecords.reduce((sum, record) => sum + (record.creditValue || 3), 0);
    const gradePoints = studentRecords.reduce((sum, record) => {
      const gradeScore = convertGradeToScore(record.GR);
      return sum + gradeScore * (record.creditValue || 3);
    }, 0);
    
    const hasArrears = studentRecords.some(record => record.GR === 'RA' || record.GR === 'F');
    const sgpa = totalCredits > 0 ? gradePoints / totalCredits : 0;
    
    studentGpas.push({ id: studentId, sgpa, hasArrears });
  });
  
  return studentGpas;
};

const calculateAverageGpa = (studentGpas: { id: string; sgpa: number; hasArrears: boolean }[]) => {
  if (studentGpas.length === 0) return 0;
  
  const sum = studentGpas.reduce((sum, student) => sum + student.sgpa, 0);
  return sum / studentGpas.length;
};

const calculateSubjectPerformance = (records: StudentRecord[]) => {
  const subjects = [...new Set(records.map(record => record.SCODE))];
  const performance: { 
    subjectCode: string; 
    passPercentage: number; 
    averageGrade: number;
    studentCount: number;
    passedCount: number;
    failedCount: number;
  }[] = [];
  
  subjects.forEach(subject => {
    const subjectRecords = records.filter(record => record.SCODE === subject);
    const total = subjectRecords.length;
    const passed = subjectRecords.filter(record => record.GR !== 'RA' && record.GR !== 'F').length;
    const passPercentage = total > 0 ? (passed / total) * 100 : 0;
    
    const averageGrade = subjectRecords.reduce((sum, record) => {
      return sum + convertGradeToScore(record.GR);
    }, 0) / (total || 1);
    
    performance.push({
      subjectCode: subject,
      passPercentage,
      averageGrade,
      studentCount: total,
      passedCount: passed,
      failedCount: total - passed
    });
  });
  
  return performance;
};

const calculatePerformanceCategories = (studentGpas: { id: string; sgpa: number }[]) => {
  const categories = {
    outstanding: 0,
    excellent: 0,
    veryGood: 0,
    good: 0,
    average: 0,
    satisfactory: 0,
    poor: 0
  };
  
  studentGpas.forEach(student => {
    const category = getPerformanceCategory(student.sgpa);
    categories[category]++;
  });
  
  return categories;
};

// Add export for Word document generation
export const generateAnalysisWordDocument = (
  analysis: any, 
  studentRecords: any[],
  currentSemesterCodes: string[]
) => {
  return generateWordReport(analysis, studentRecords, currentSemesterCodes);
};
