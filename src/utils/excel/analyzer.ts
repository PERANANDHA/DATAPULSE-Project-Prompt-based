
import { StudentRecord, ResultAnalysis, gradePointMap, passFailColors } from './types';
import { calculateSGPA, calculateCGPA, hasArrears, getSubjectsWithArrears, getGradeColor, formatTo2Decimals } from './gradeUtils';

// Analyze student records and generate comprehensive result analysis
export const analyzeResults = (
  records: StudentRecord[], 
  currentSubjectCodes?: string[], 
  cumulativeSubjectCodes?: string[]
): ResultAnalysis => {
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
  
  // Filter records based on the subject codes provided
  let currentSemesterRecords = records;
  let cumulativeSemesterRecords = records;
  
  // If current semester subject codes are provided, filter records for current semester analysis
  if (currentSubjectCodes && currentSubjectCodes.length > 0) {
    currentSemesterRecords = records.filter(record => 
      currentSubjectCodes.includes(record.SCODE)
    );
  }
  
  // If cumulative semester subject codes are provided, filter records for cumulative analysis
  if (cumulativeSubjectCodes && cumulativeSubjectCodes.length > 0) {
    cumulativeSemesterRecords = records.filter(record => 
      cumulativeSubjectCodes.includes(record.SCODE)
    );
  }
  
  // Calculate CGPA if multiple files - each file is treated as a separate semester
  let cgpaAnalysis;
  if (fileCount > 1) {
    const studentIds = [...new Set(cumulativeSemesterRecords.map(record => record.REGNO))];
    
    const studentCGPAs = studentIds.map(id => ({
      id,
      cgpa: calculateCGPA(cumulativeSemesterRecords, id, fileGroups)
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
  
  // ===== Current Semester Analysis =====
  const currentSemTotalStudents = [...new Set(currentSemesterRecords.map(record => record.REGNO))].length;
  
  // Calculate SGPA for each student in current semester
  const currentSemStudentSgpaMap: { [studentId: string]: number } = {};
  const currentSemStudentSgpaDetails: { id: string; sgpa: number; hasArrears: boolean }[] = [];
  
  [...new Set(currentSemesterRecords.map(record => record.REGNO))].forEach(studentId => {
    const sgpa = calculateSGPA(currentSemesterRecords, studentId);
    currentSemStudentSgpaMap[studentId] = sgpa;
    currentSemStudentSgpaDetails.push({
      id: studentId,
      sgpa: sgpa,
      hasArrears: hasArrears(currentSemesterRecords, studentId)
    });
  });
  
  // Sort by registration number
  currentSemStudentSgpaDetails.sort((a, b) => a.id.localeCompare(b.id));
  
  const currentSemAverageSGPA = currentSemTotalStudents > 0 ? 
    formatTo2Decimals(currentSemStudentSgpaDetails.reduce((sum, student) => sum + student.sgpa, 0) / currentSemTotalStudents) : 0;
  
  const currentSemHighestSGPA = currentSemStudentSgpaDetails.length > 0 ? 
    formatTo2Decimals(Math.max(...currentSemStudentSgpaDetails.map(student => student.sgpa))) : 0;
  
  const currentSemLowestSGPA = currentSemStudentSgpaDetails.length > 0 ? 
    formatTo2Decimals(Math.min(...currentSemStudentSgpaDetails.map(student => student.sgpa))) : 0;
  
  // Current semester grade distribution
  const currentSemGradeDistribution: { [grade: string]: number } = {};
  currentSemesterRecords.forEach(record => {
    if (record.GR in gradePointMap) {
      currentSemGradeDistribution[record.GR] = (currentSemGradeDistribution[record.GR] || 0) + 1;
    }
  });
  
  const currentSemGradeDistributionData = Object.entries(currentSemGradeDistribution).map(([grade, count]) => ({
    name: grade,
    count: count,
    fill: getGradeColor(grade),
  }));
  
  // ===== Cumulative Semester Analysis =====
  const cumulativeTotalStudents = [...new Set(cumulativeSemesterRecords.map(record => record.REGNO))].length;
  
  // Calculate SGPA for each student using cumulative data
  const cumulativeStudentSgpaMap: { [studentId: string]: number } = {};
  const cumulativeStudentSgpaDetails: { id: string; sgpa: number; hasArrears: boolean }[] = [];
  
  [...new Set(cumulativeSemesterRecords.map(record => record.REGNO))].forEach(studentId => {
    const sgpa = calculateSGPA(cumulativeSemesterRecords, studentId);
    cumulativeStudentSgpaMap[studentId] = sgpa;
    cumulativeStudentSgpaDetails.push({
      id: studentId,
      sgpa: sgpa,
      hasArrears: hasArrears(cumulativeSemesterRecords, studentId)
    });
  });
  
  // Sort by registration number
  cumulativeStudentSgpaDetails.sort((a, b) => a.id.localeCompare(b.id));
  
  const cumulativeAverageSGPA = cumulativeTotalStudents > 0 ? 
    formatTo2Decimals(cumulativeStudentSgpaDetails.reduce((sum, student) => sum + student.sgpa, 0) / cumulativeTotalStudents) : 0;
  
  const cumulativeHighestSGPA = cumulativeStudentSgpaDetails.length > 0 ? 
    formatTo2Decimals(Math.max(...cumulativeStudentSgpaDetails.map(student => student.sgpa))) : 0;
  
  const cumulativeLowestSGPA = cumulativeStudentSgpaDetails.length > 0 ? 
    formatTo2Decimals(Math.min(...cumulativeStudentSgpaDetails.map(student => student.sgpa))) : 0;
  
  // Get the total grades from the current semester records
  const currentSemTotalGrades = currentSemesterRecords.filter(record => record.GR in gradePointMap).length;
  
  // Current semester subject performance
  const currentSemSubjectPerformanceMap: { [subject: string]: { pass: number; fail: number; total: number; subjectName?: string } } = {};
  currentSemesterRecords.forEach(record => {
    // Skip records with invalid grades
    if (!(record.GR in gradePointMap)) return;
    
    const subject = record.SCODE;
    if (!currentSemSubjectPerformanceMap[subject]) {
      currentSemSubjectPerformanceMap[subject] = { 
        pass: 0, 
        fail: 0, 
        total: 0,
        subjectName: record.subjectName // Store subject name if available
      };
    } else if (record.subjectName && !currentSemSubjectPerformanceMap[subject].subjectName) {
      // Update subject name if it was previously not set but is now available
      currentSemSubjectPerformanceMap[subject].subjectName = record.subjectName;
    }
    
    currentSemSubjectPerformanceMap[subject].total++;
    if (record.GR !== 'U') {
      currentSemSubjectPerformanceMap[subject].pass++;
    } else {
      currentSemSubjectPerformanceMap[subject].fail++;
    }
  });
  
  const currentSemSubjectPerformanceData = Object.entries(currentSemSubjectPerformanceMap).map(([subject, data]) => ({
    subject: subject,
    pass: data.total > 0 ? formatTo2Decimals((data.pass / data.total) * 100) : 0,
    fail: data.total > 0 ? formatTo2Decimals((data.fail / data.total) * 100) : 0,
    subjectName: data.subjectName // Include subject name in the result
  }));
  
  // Current semester top performers
  const currentSemTopPerformers = currentSemStudentSgpaDetails
    .sort((a, b) => b.sgpa - a.sgpa)
    .slice(0, 6)
    .map(student => {
      const studentRecords = currentSemesterRecords.filter(record => record.REGNO === student.id && record.GR in gradePointMap);
      const bestGrade = studentRecords.length > 0 ? 
        studentRecords.sort((a, b) => (gradePointMap[b.GR] || 0) - (gradePointMap[a.GR] || 0))[0].GR : 'A';
      return {
        id: student.id,
        sgpa: student.sgpa,
        grade: bestGrade,
      };
    });
  
  // Current semester needs improvement
  const currentSemNeedsImprovement: { id: string; sgpa: number; subjects: string }[] = currentSemStudentSgpaDetails
    .filter(student => student.sgpa < 6.5 || student.hasArrears)
    .map(student => ({
      id: student.id,
      sgpa: student.sgpa,
      subjects: hasArrears(currentSemesterRecords, student.id) ? getSubjectsWithArrears(currentSemesterRecords, student.id) : '',
    }));
  
  // Current semester pass/fail data
  const currentSemPassCount = currentSemesterRecords.filter(record => record.GR in gradePointMap && record.GR !== 'U').length;
  const currentSemFailCount = currentSemesterRecords.filter(record => record.GR === 'U').length;
  const currentSemTotalValidGrades = currentSemPassCount + currentSemFailCount;
  
  const currentSemPassPercentage = currentSemTotalValidGrades > 0 ? formatTo2Decimals((currentSemPassCount / currentSemTotalValidGrades) * 100) : 0;
  const currentSemFailPercentage = currentSemTotalValidGrades > 0 ? formatTo2Decimals((currentSemFailCount / currentSemTotalValidGrades) * 100) : 0;
  
  const currentSemPassFailData = [
    { name: 'Pass', value: currentSemPassPercentage, fill: passFailColors.pass },
    { name: 'Fail', value: currentSemFailPercentage, fill: passFailColors.fail },
  ];

  // Current semester subject-wise grade distribution
  const currentSemSubjectGradeDistribution: { [subject: string]: { name: string; count: number; fill: string }[] } = {};
  const currentSemUniqueSubjects = [...new Set(currentSemesterRecords.map(record => record.SCODE))];

  currentSemUniqueSubjects.forEach(subject => {
    const subjectRecords = currentSemesterRecords.filter(record => record.SCODE === subject);
    const gradeCounts: { [grade: string]: number } = {};

    subjectRecords.forEach(record => {
      // Only count valid grades
      if (record.GR in gradePointMap) {
        gradeCounts[record.GR] = (gradeCounts[record.GR] || 0) + 1;
      }
    });

    currentSemSubjectGradeDistribution[subject] = Object.entries(gradeCounts).map(([grade, count]) => ({
      name: grade,
      count: count,
      fill: getGradeColor(grade),
    }));
  });
  
  // Classification table calculations using cumulative semester data
  // Calculate classification for single file/semester (current semester)
  const singleFileClassification = calculateSingleFileClassification(currentSemesterRecords, currentSemStudentSgpaDetails);
  
  // Calculate classification for multiple files/semesters (cumulative)
  const multipleFileClassification = calculateMultipleFileClassification(cumulativeSemesterRecords, cumulativeStudentSgpaDetails);
  
  return {
    // We'll use current semester data for some parts and cumulative data for others
    totalStudents: currentSemTotalStudents,
    averageCGPA: currentSemAverageSGPA,
    highestSGPA: currentSemHighestSGPA,
    lowestSGPA: currentSemLowestSGPA,
    gradeDistribution: currentSemGradeDistributionData,
    totalGrades: currentSemTotalGrades,
    subjectPerformance: currentSemSubjectPerformanceData,
    topPerformers: currentSemTopPerformers,
    needsImprovement: currentSemNeedsImprovement,
    studentSgpaDetails: currentSemStudentSgpaDetails,
    passFailData: currentSemPassFailData,
    subjectGradeDistribution: currentSemSubjectGradeDistribution,
    fileCount,
    filesProcessed,
    fileWiseAnalysis,
    cgpaAnalysis,
    singleFileClassification,
    multipleFileClassification,
    currentSemesterFile,
    // Store both sets of records for use in report generation
    cumulativeStudentSgpaDetails
  };
};

// Calculate classification data for single file/semester (current semester)
const calculateSingleFileClassification = (
  records: StudentRecord[],
  studentSgpaDetails: { id: string; sgpa: number; hasArrears: boolean }[]
) => {
  // Initialize counters
  const classification = {
    distinction: 0,
    firstClassWOA: 0, // Without arrears
    firstClassWA: 0,  // With arrears
    secondClassWOA: 0, // Without arrears
    secondClassWA: 0,  // With arrears
    fail: 0,
    totalStudents: studentSgpaDetails.length,
    passPercentage: 0
  };
  
  // Process each student according to the specified rules
  studentSgpaDetails.forEach(student => {
    if (student.hasArrears) {
      // Students with arrears
      if (student.sgpa >= 6.5) {
        classification.firstClassWA++;
      } else if (student.sgpa >= 5.0) {
        classification.secondClassWA++;
      } else {
        classification.fail++;
      }
    } else {
      // Students without arrears
      if (student.sgpa >= 8.5) {
        classification.distinction++;
      } else if (student.sgpa >= 6.5) {
        classification.firstClassWOA++;
      } else {
        classification.secondClassWOA++;
      }
    }
  });
  
  // Count U grades for fail column
  const failGradeCount = records.filter(record => record.GR === 'U').length;
  classification.fail = failGradeCount;
  
  // Calculate pass percentage
  const totalGrades = records.length;
  const passGrades = records.filter(record => record.GR !== 'U').length;
  
  classification.passPercentage = totalGrades > 0 ? 
    formatTo2Decimals((passGrades / totalGrades) * 100) : 0;
  
  return classification;
};

// Calculate classification data for multiple files/semesters (cumulative)
const calculateMultipleFileClassification = (
  records: StudentRecord[],
  studentSgpaDetails: { id: string; sgpa: number; hasArrears: boolean }[]
) => {
  // Initialize counters
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
  
  // Process each student according to the specified rules
  studentSgpaDetails.forEach(student => {
    if (student.hasArrears) {
      // Students with arrears
      if (student.sgpa >= 6.5) {
        classification.firstClassWA++;
      } else if (student.sgpa >= 5.0) {
        classification.secondClassWA++;
      } else {
        classification.fail++;
      }
    } else {
      // Students without arrears
      if (student.sgpa >= 8.5) {
        classification.distinction++;
      } else if (student.sgpa >= 6.5) {
        classification.firstClassWOA++;
      } else {
        classification.secondClassWOA++;
      }
    }
  });
  
  // Count U grades for fail column
  const failGradeCount = records.filter(record => record.GR === 'U').length;
  classification.fail = failGradeCount;
  
  // Calculate pass percentage
  const totalGrades = records.length;
  const passGrades = records.filter(record => record.GR !== 'U').length;
  
  classification.passPercentage = totalGrades > 0 ? 
    formatTo2Decimals((passGrades / totalGrades) * 100) : 0;
  
  return classification;
};
