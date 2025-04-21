
import { StudentRecord, gradePointMap } from '../types';

// Classification logic for single and multiple file
export const calculateSingleFileClassification = (
  records: StudentRecord[],
  studentSgpaDetails: { id: string; sgpa: number; hasArrears: boolean }[]
) => {
  const classification = {
    distinction: 0,
    firstClassWOA: 0,
    firstClassWA: 0,
    secondClassWOA: 0,
    secondClassWA: 0,
    fail: 0,
    totalStudents: studentSgpaDetails.length,
    passPercentage: 0
  };
  studentSgpaDetails.forEach(student => {
    if (student.hasArrears) {
      if (student.sgpa >= 6.5) classification.firstClassWA++;
      else if (student.sgpa >= 5.0) classification.secondClassWA++;
      else classification.fail++;
    } else {
      if (student.sgpa >= 8.5) classification.distinction++;
      else if (student.sgpa >= 6.5) classification.firstClassWOA++;
      else classification.secondClassWOA++;
    }
  });
  const failGradeCount = records.filter(record => record.GR === 'U').length;
  classification.fail = failGradeCount;
  const totalGrades = records.length;
  const passGrades = records.filter(record => record.GR !== 'U').length;
  classification.passPercentage = totalGrades > 0 ?
    Number(((passGrades / totalGrades) * 100).toFixed(2)) : 0;
  return classification;
};

export const calculateMultipleFileClassification = (
  records: StudentRecord[],
  fileGroups: { [fileName: string]: StudentRecord[] },
  cgpaAnalysis?: {
    studentCGPAs: { id: string; cgpa: number }[];
    averageCGPA: number;
    highestCGPA: number;
    lowestCGPA: number;
    currentSemesterFile?: string;
  }
) => {
  const classification = {
    distinction: 0,
    firstClassWOA: 0,
    firstClassWA: 0,
    secondClassWOA: 0,
    secondClassWA: 0,
    fail: 0,
    totalStudents: 0,
    passPercentage: 0
  };
  const studentIds = [...new Set(records.map(record => record.REGNO))];
  classification.totalStudents = studentIds.length;
  studentIds.forEach(studentId => {
    const hasArrearsInAnySemester = Object.keys(fileGroups).some(fileName => {
      const fileRecords = fileGroups[fileName];
      return fileRecords.some(r => r.REGNO === studentId && r.GR === 'U');
    });
    const cgpa = cgpaAnalysis?.studentCGPAs.find(s => s.id === studentId)?.cgpa || 0;
    if (hasArrearsInAnySemester) {
      if (cgpa >= 6.5) classification.firstClassWA++;
      else if (cgpa >= 5.0) classification.secondClassWA++;
      else classification.fail++;
    } else {
      if (cgpa >= 8.5) classification.distinction++;
      else if (cgpa >= 6.5) classification.firstClassWOA++;
      else classification.secondClassWOA++;
    }
  });
  const failGradeCount = records.filter(record => record.GR === 'U').length;
  classification.fail = failGradeCount;
  const totalGrades = records.length;
  const passGrades = records.filter(record => record.GR !== 'U').length;
  classification.passPercentage = totalGrades > 0 ?
    Number(((passGrades / totalGrades) * 100).toFixed(2)) : 0;
  return classification;
};
