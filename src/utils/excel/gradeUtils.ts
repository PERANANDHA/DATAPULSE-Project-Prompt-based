import { gradePointMap, gradeColors, StudentRecord } from './types';

// Helper function to get color for a specific grade
export const getGradeColor = (grade: string): string => {
  return gradeColors[grade] || '#9ca3af'; // Default gray
};

// Helper function to format numbers to exactly 2 decimal places
export const formatTo2Decimals = (value: number): number => {
  return Number(value.toFixed(2));
};

// Helper function to get unique department codes from the records - Keeping for backward compatibility but not used
export const getUniqueDepartmentCodes = (records: StudentRecord[]): string[] => {
  return [...new Set(records.map(record => record.CNo))].filter(code => code);
};

// Calculate SGPA for a given student
export const calculateSGPA = (records: StudentRecord[], studentId: string): number => {
  const studentRecords = records.filter(record => record.REGNO === studentId);
  let totalCredits = 0;
  let weightedSum = 0;

  studentRecords.forEach(record => {
    if (record.GR in gradePointMap) {
      const gradePoint = gradePointMap[record.GR];
      const creditValue = record.creditValue || 0;

      weightedSum += gradePoint * creditValue;
      totalCredits += creditValue;
    }
  });

  // Ensure exactly 2 decimal places with proper rounding
  return totalCredits === 0 ? 0 : formatTo2Decimals(weightedSum / totalCredits);
};

// Calculate CGPA from multiple semesters (files)
export const calculateCGPA = (
  records: StudentRecord[], 
  studentId: string, 
  fileGroups: { [fileName: string]: StudentRecord[] }
): number => {
  const allSemesters = Object.keys(fileGroups);
  if (allSemesters.length <= 1) {
    // If only one semester, CGPA is the same as SGPA
    return calculateSGPA(records, studentId);
  }
  
  let totalCredits = 0;
  let totalWeightedSum = 0;
  
  // For each semester (file)
  allSemesters.forEach(semester => {
    const semesterRecords = fileGroups[semester];
    const studentSemRecords = semesterRecords.filter(record => record.REGNO === studentId);
    
    // Calculate this semester's contribution
    let semCredits = 0;
    let semWeightedSum = 0;
    
    studentSemRecords.forEach(record => {
      if (record.GR in gradePointMap) {
        const gradePoint = gradePointMap[record.GR];
        const creditValue = record.creditValue || 0;
        
        semWeightedSum += gradePoint * creditValue;
        semCredits += creditValue;
      }
    });
    
    // Add to overall totals
    totalWeightedSum += semWeightedSum;
    totalCredits += semCredits;
  });
  
  // Ensure exactly 2 decimal places with proper rounding
  return totalCredits === 0 ? 0 : formatTo2Decimals(totalWeightedSum / totalCredits);
};

// Check if student has arrears (U grade)
export const hasArrears = (records: StudentRecord[], studentId: string): boolean => {
  return records.filter(record => record.REGNO === studentId).some(record => record.GR === 'U');
};

// Get list of subjects where student has arrears
export const getSubjectsWithArrears = (records: StudentRecord[], studentId: string): string => {
  const arrearsSubjects = records.filter(record => record.REGNO === studentId && record.GR === 'U').map(record => record.SCODE);
  return arrearsSubjects.join(', ');
};
