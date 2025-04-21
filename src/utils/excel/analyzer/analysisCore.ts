import { 
  StudentRecord, ResultAnalysis, gradePointMap, passFailColors 
} from '../types';
import { 
  calculateSGPA, calculateCGPA, hasArrears, getSubjectsWithArrears, getGradeColor, formatTo2Decimals 
} from '../gradeUtils';
import { calculateSingleFileClassification, calculateMultipleFileClassification } from './classification';

// Main analyzeResults logic here; nearly verbatim from original file
export const analyzeResults = (records: StudentRecord[], assignedSubjects?: string[]): ResultAnalysis => {
  // If assignedSubjects is provided, filter records to only include those subjects
  if (assignedSubjects && assignedSubjects.length > 0) {
    records = records.filter(record => assignedSubjects.includes(record.SCODE));
  }
  
  // Get unique files processed
  const filesProcessed = [...new Set(records.map(record => record.fileSource || 'Unknown'))];
  const fileCount = filesProcessed.length;
  
  // Group records by file source
  const fileGroups: { [fileName: string]: StudentRecord[] } = {};
  filesProcessed.forEach(fileName => {
    fileGroups[fileName] = records.filter(record => record.fileSource === fileName);
  });
  
  // Per-file analysis
  const fileWiseAnalysis: { [fileName: string]: { averageSGPA: number; students: number; semesterName?: string } } = {};
  
  filesProcessed.forEach(fileName => {
    const fileRecords = fileGroups[fileName];
    const fileStudentIds = [...new Set(fileRecords.map(record => record.REGNO))];
    const fileStudentCount = fileStudentIds.length;
    
    // Get the semester name if available (assuming all records in a file have the same semester)
    const semName = fileRecords[0]?.SEM || '';
    
    // Calculate average SGPA for this file
    let totalSGPA = 0;
    fileStudentIds.forEach(studentId => {
      totalSGPA += calculateSGPA(fileRecords, studentId);
    });
    
    const avgSGPA = fileStudentCount > 0 ? formatTo2Decimals(totalSGPA / fileStudentCount) : 0;
    
    fileWiseAnalysis[fileName] = {
      averageSGPA: avgSGPA,
      students: fileStudentCount,
      semesterName: semName || undefined
    };
  });
  
  // Determine the current semester file by finding the file with the highest semester number
  let currentSemesterFile = filesProcessed[0]; // Default to first file
  let highestSemValue = -1;
  
  // If multiple files, find the one with the highest semester number
  if (fileCount > 0) {
    filesProcessed.forEach(fileName => {
      const fileRecords = fileGroups[fileName];
      if (fileRecords.length > 0) {
        // Extract semester value, convert to number for comparison
        const semValue = parseInt(fileRecords[0]?.SEM || '0', 10);
        if (!isNaN(semValue) && semValue > highestSemValue) {
          highestSemValue = semValue;
          currentSemesterFile = fileName;
        }
      }
    });
  }
  
  // Calculate CGPA if multiple files - each file is treated as a separate semester
  let cgpaAnalysis;
  if (fileCount > 1) {
    const studentIds = [...new Set(records.map(record => record.REGNO))];
    
    const studentCGPAs = studentIds.map(id => ({
      id,
      cgpa: calculateCGPA(records, id, fileGroups)
    }));
    
    // Sort by CGPA in descending order for toppers list
    studentCGPAs.sort((a, b) => b.cgpa - a.cgpa);
    
    const cgpaValues = studentCGPAs.map(s => s.cgpa);
    cgpaAnalysis = {
      studentCGPAs,
      averageCGPA: cgpaValues.length > 0 ? formatTo2Decimals(cgpaValues.reduce((sum, cgpa) => sum + cgpa, 0) / cgpaValues.length) : 0,
      highestCGPA: cgpaValues.length > 0 ? formatTo2Decimals(Math.max(...cgpaValues)) : 0,
      lowestCGPA: cgpaValues.length > 0 ? formatTo2Decimals(Math.min(...cgpaValues)) : 0,
      toppersList: studentCGPAs.slice(0, 10), // Get top 10 students
      currentSemesterFile: currentSemesterFile // Use the file with highest sem value as current semester
    };
  }
  
  const totalStudents = [...new Set(records.map(record => record.REGNO))].length;

  // [MOD] Current semester stats: filter out 'isArrear'
  const currentSemesterRecords = currentSemesterFile
    ? records.filter(record => record.fileSource === currentSemesterFile && !record.isArrear)
    : records.filter(record => !record.isArrear);
  
  // Calculate SGPA (exclude arrear-marked) for "current" stats/table/classification
  const studentSgpaMap: { [studentId: string]: number } = {};
  const studentSgpaDetails: { id: string; sgpa: number; hasArrears: boolean }[] = [];
  const currentSemStudentIds = [...new Set(currentSemesterRecords.map(record => record.REGNO))];
  const recordsWithCredits = currentSemesterRecords.filter(r => r.creditValue && r.creditValue > 0);

  currentSemStudentIds.forEach(studentId => {
    const studentRecords = currentSemesterRecords.filter(record => record.REGNO === studentId);
    let totalPoints = 0;
    let totalCredits = 0;
    studentRecords.forEach(record => {
      if (record.GR in gradePointMap) {
        const gradePoint = gradePointMap[record.GR];
        const creditValue = record.creditValue || 0;
        if (creditValue > 0) {
          totalPoints += gradePoint * creditValue;
          totalCredits += creditValue;
        }
      }
    });
    const sgpa = totalCredits > 0 ? formatTo2Decimals(totalPoints / totalCredits) : 0;
    studentSgpaMap[studentId] = sgpa;
    studentSgpaDetails.push({
      id: studentId,
      sgpa: sgpa,
      hasArrears: hasArrears(studentRecords, studentId)
    });
  });
  studentSgpaDetails.sort((a, b) => a.id.localeCompare(b.id));

  // -- Current semester average CGPA from SGPA values (excludes arrear-marked)
  const averageCGPA = totalStudents > 0
    ? formatTo2Decimals(studentSgpaDetails.reduce((sum, student) => sum + student.sgpa, 0) / totalStudents)
    : 0;
  const highestSGPA = studentSgpaDetails.length > 0
    ? formatTo2Decimals(Math.max(...studentSgpaDetails.map(student => student.sgpa))) : 0;
  const lowestSGPA = studentSgpaDetails.length > 0
    ? formatTo2Decimals(Math.min(...studentSgpaDetails.map(student => student.sgpa))) : 0;
  
  // Grade distribution - filter out any non-standard grades
  const gradeDistribution: { [grade: string]: number } = {};
  records.forEach(record => {
    if (record.GR in gradePointMap) {
      gradeDistribution[record.GR] = (gradeDistribution[record.GR] || 0) + 1;
    }
  });
  
  const gradeDistributionData = Object.entries(gradeDistribution).map(([grade, count]) => ({
    name: grade,
    count: count,
    fill: getGradeColor(grade),
  }));
  
  const totalGrades = records.filter(record => record.GR in gradePointMap).length;

  // Subject-wise performance (again, NOT including 'isArrear')
  const recordsForSubjectAnalysis = currentSemesterFile
    ? records.filter(record => record.fileSource === currentSemesterFile && !record.isArrear)
    : records.filter(record => !record.isArrear);
  
  const subjectPerformanceMap: { [subject: string]: { pass: number; fail: number; total: number; subjectName?: string } } = {};
  recordsForSubjectAnalysis.forEach(record => {
    if (!(record.GR in gradePointMap)) return;
    const subject = record.SCODE;
    if (!subjectPerformanceMap[subject]) {
      subjectPerformanceMap[subject] = {
        pass: 0,
        fail: 0,
        total: 0,
        subjectName: record.subjectName
      };
    } else if (record.subjectName && !subjectPerformanceMap[subject].subjectName) {
      subjectPerformanceMap[subject].subjectName = record.subjectName;
    }
    subjectPerformanceMap[subject].total++;
    if (record.GR !== 'U') subjectPerformanceMap[subject].pass++;
    else subjectPerformanceMap[subject].fail++;
  });
  const subjectPerformanceData = Object.entries(subjectPerformanceMap).map(([subject, data]) => ({
    subject: subject,
    pass: data.total > 0 ? formatTo2Decimals((data.pass / data.total) * 100) : 0,
    fail: data.total > 0 ? formatTo2Decimals((data.fail / data.total) * 100) : 0,
    subjectName: data.subjectName
  }));
  
  // Top performers
  const topPerformers = studentSgpaDetails
    .sort((a, b) => b.sgpa - a.sgpa)
    .slice(0, 6)
    .map(student => {
      const studentRecords = records.filter(record => record.REGNO === student.id && record.GR in gradePointMap);
      const bestGrade = studentRecords.length > 0 ? 
        studentRecords.sort((a, b) => (gradePointMap[b.GR] || 0) - (gradePointMap[a.GR] || 0))[0].GR : 'A';
      return {
        id: student.id,
        sgpa: student.sgpa,
        grade: bestGrade,
      };
    });
  
  // Needs improvement
  const needsImprovement: { id: string; sgpa: number; subjects: string }[] = studentSgpaDetails
    .filter(student => student.sgpa < 6.5 || student.hasArrears)
    .map(student => ({
      id: student.id,
      sgpa: student.sgpa,
      subjects: hasArrears(records, student.id) ? getSubjectsWithArrears(records, student.id) : '',
    }));
  
  // Pass/Fail data
  const passCount = records.filter(record => record.GR in gradePointMap && record.GR !== 'U').length;
  const failCount = records.filter(record => record.GR === 'U').length;
  const totalValidGrades = passCount + failCount;
  
  const passPercentage = totalValidGrades > 0 ? formatTo2Decimals((passCount / totalValidGrades) * 100) : 0;
  const failPercentage = totalValidGrades > 0 ? formatTo2Decimals((failCount / totalValidGrades) * 100) : 0;
  
  const passFailData = [
    { name: 'Pass', value: passPercentage, fill: passFailColors.pass },
    { name: 'Fail', value: failPercentage, fill: passFailColors.fail },
  ];

  // Subject-wise grade distribution (still, NOT including arrears)
  const subjectGradeDistribution: { [subject: string]: { name: string; count: number; fill: string }[] } = {};
  const uniqueSubjects = [...new Set(recordsForSubjectAnalysis.map(record => record.SCODE))];

  uniqueSubjects.forEach(subject => {
    const subjectRecords = recordsForSubjectAnalysis.filter(record => record.SCODE === subject);
    const gradeCounts: { [grade: string]: number } = {};
    subjectRecords.forEach(record => {
      if (record.GR in gradePointMap) {
        gradeCounts[record.GR] = (gradeCounts[record.GR] || 0) + 1;
      }
    });
    subjectGradeDistribution[subject] = Object.entries(gradeCounts).map(([grade, count]) => ({
      name: grade,
      count: count,
      fill: getGradeColor(grade),
    }));
  });
  
  // Classification table calculations - these follow the specified rules
  // For CGPA mode, current semester is the file with highest semester number

  // Calculate classification for current semester: pass studentSgpaDetails *excluding arrears* (from above)
  const currentSemesterRecordsForClassification = records.filter(
    record => record.fileSource === currentSemesterFile && !record.isArrear
  );
  const currentSemesterStudentSgpaDetails = [...new Set(currentSemesterRecordsForClassification.map(record => record.REGNO))]
    .map(studentId => {
      return studentSgpaDetails.find(detail => detail.id === studentId) || {
        id: studentId,
        sgpa: 0,
        hasArrears: hasArrears(currentSemesterRecordsForClassification, studentId)
      };
    });

  const singleFileClassification = calculateSingleFileClassification(
    currentSemesterRecordsForClassification,
    currentSemesterStudentSgpaDetails
  );

  // For cumulative: use ALL records for classification + cgpaAnalysis
  const multipleFileClassification = fileCount > 1
    ? calculateMultipleFileClassification(records, fileGroups, cgpaAnalysis)
    : singleFileClassification;
  
  return {
    totalStudents,
    averageCGPA,
    highestSGPA,
    lowestSGPA,
    gradeDistribution: gradeDistributionData,
    totalGrades,
    subjectPerformance: subjectPerformanceData,
    topPerformers,
    needsImprovement,
    studentSgpaDetails,
    passFailData,
    subjectGradeDistribution,
    fileCount,
    filesProcessed,
    fileWiseAnalysis,
    cgpaAnalysis,
    singleFileClassification,
    multipleFileClassification,
    currentSemesterFile
  };
};
