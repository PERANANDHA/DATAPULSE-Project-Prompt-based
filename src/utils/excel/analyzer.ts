
import { StudentRecord, ResultAnalysis, gradePointMap, passFailColors } from './types';
import { calculateSGPA, calculateCGPA, hasArrears, getSubjectsWithArrears, getGradeColor, formatTo2Decimals } from './gradeUtils';

// Analyze student records and generate comprehensive result analysis
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
    
    // Calculate average SGPA for this file - EXCLUDE ARREAR SUBJECTS
    let totalSGPA = 0;
    fileStudentIds.forEach(studentId => {
      // Filter out arrear subjects for SGPA calculation
      const nonArrearStudentRecords = fileRecords.filter(record => 
        record.REGNO === studentId && !record.isArrear
      );
      
      totalSGPA += calculateSGPA(nonArrearStudentRecords, studentId);
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
  // IMPORTANT: For CGPA calculation, we need to exclude arrear subjects
  let cgpaAnalysis;
  if (fileCount > 1) {
    const studentIds = [...new Set(records.map(record => record.REGNO))];
    
    // Filter out arrear subjects for CGPA calculation
    const nonArrearRecords = records.filter(record => !record.isArrear);
    
    // Create new fileGroups with non-arrear records only
    const nonArrearFileGroups: { [fileName: string]: StudentRecord[] } = {};
    filesProcessed.forEach(fileName => {
      nonArrearFileGroups[fileName] = nonArrearRecords.filter(record => record.fileSource === fileName);
    });
    
    const studentCGPAs = studentIds.map(id => ({
      id,
      cgpa: calculateCGPA(nonArrearRecords, id, nonArrearFileGroups),
      // Include list of arrear subjects for each student
      arrearSubjects: getSubjectsWithArrears(records, id)
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
  
  // IMPORTANT: Calculate SGPA specifically for current semester records - EXCLUDING ARREAR SUBJECTS
  const currentSemesterRecords = currentSemesterFile ? 
    records.filter(record => record.fileSource === currentSemesterFile) : 
    records;
  
  console.log(`Using ${currentSemesterRecords.length} records from "${currentSemesterFile}" for current semester SGPA calculation`);
  
  // Filter out arrear subjects for SGPA calculation
  const nonArrearCurrentSemesterRecords = currentSemesterRecords.filter(record => !record.isArrear);
  console.log(`Excluded ${currentSemesterRecords.length - nonArrearCurrentSemesterRecords.length} arrear subjects for SGPA calculation`);
  
  // Calculate SGPA for each student based on current semester only (excluding arrear subjects)
  const studentSgpaMap: { [studentId: string]: number } = {};
  const studentSgpaDetails: { id: string; sgpa: number; hasArrears: boolean; arrearSubjects?: string }[] = [];
  
  const currentSemStudentIds = [...new Set(nonArrearCurrentSemesterRecords.map(record => record.REGNO))];
  
  // Check if records have credit values
  const recordsWithCredits = nonArrearCurrentSemesterRecords.filter(r => r.creditValue && r.creditValue > 0);
  console.log(`Records with credits for SGPA: ${recordsWithCredits.length} out of ${nonArrearCurrentSemesterRecords.length}`);
  
  if (recordsWithCredits.length === 0 && nonArrearCurrentSemesterRecords.length > 0) {
    console.warn("WARNING: No records have credit values assigned in SGPA calculation! This will result in all SGPAs being 0.");
  }

  currentSemStudentIds.forEach(studentId => {
    // Only use non-arrear subjects for SGPA calculation
    const studentRecords = nonArrearCurrentSemesterRecords.filter(record => record.REGNO === studentId);
    
    // Manual SGPA calculation for better control and debugging
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
    console.log(`Student ${studentId}: SGPA calculated = ${sgpa}`);
    
    studentSgpaMap[studentId] = sgpa;
    
    // Check for arrears in ALL subjects (including those marked as arrear)
    // This is important for classification purposes
    const hasArrear = hasArrears(currentSemesterRecords, studentId);
    const arrearSubjectsList = hasArrear ? getSubjectsWithArrears(currentSemesterRecords, studentId) : '';
    
    studentSgpaDetails.push({
      id: studentId,
      sgpa: sgpa,
      hasArrears: hasArrear,
      arrearSubjects: arrearSubjectsList
    });
  });
  
  // Sort by registration number
  studentSgpaDetails.sort((a, b) => a.id.localeCompare(b.id));
  
  const averageCGPA = totalStudents > 0 ? 
    formatTo2Decimals(studentSgpaDetails.reduce((sum, student) => sum + student.sgpa, 0) / totalStudents) : 0;
  
  const highestSGPA = studentSgpaDetails.length > 0 ? 
    formatTo2Decimals(Math.max(...studentSgpaDetails.map(student => student.sgpa))) : 0;
  
  const lowestSGPA = studentSgpaDetails.length > 0 ? 
    formatTo2Decimals(Math.min(...studentSgpaDetails.map(student => student.sgpa))) : 0;
  
  // Grade distribution - filter out any non-standard grades
  // IMPORTANT: Only use non-arrear subjects for grade distribution
  const gradeDistribution: { [grade: string]: number } = {};
  nonArrearCurrentSemesterRecords.forEach(record => {
    if (record.GR in gradePointMap) {
      gradeDistribution[record.GR] = (gradeDistribution[record.GR] || 0) + 1;
    }
  });
  
  const gradeDistributionData = Object.entries(gradeDistribution).map(([grade, count]) => ({
    name: grade,
    count: count,
    fill: getGradeColor(grade),
  }));
  
  const totalGrades = nonArrearCurrentSemesterRecords.filter(record => record.GR in gradePointMap).length;
  
  // Subject-wise performance - Now includes preservation of subject names
  // For current semester, use non-arrear records only
  const recordsForSubjectAnalysis = nonArrearCurrentSemesterRecords;
  
  console.log(`Using ${recordsForSubjectAnalysis.length} non-arrear records for subject performance analysis`);
  
  const subjectPerformanceMap: { [subject: string]: { pass: number; fail: number; total: number; subjectName?: string } } = {};
  recordsForSubjectAnalysis.forEach(record => {
    // Skip records with invalid grades
    if (!(record.GR in gradePointMap)) return;
    
    const subject = record.SCODE;
    if (!subjectPerformanceMap[subject]) {
      subjectPerformanceMap[subject] = { 
        pass: 0, 
        fail: 0, 
        total: 0,
        subjectName: record.subjectName // Store subject name if available
      };
    } else if (record.subjectName && !subjectPerformanceMap[subject].subjectName) {
      // Update subject name if it was previously not set but is now available
      subjectPerformanceMap[subject].subjectName = record.subjectName;
    }
    
    subjectPerformanceMap[subject].total++;
    if (record.GR !== 'U') {
      subjectPerformanceMap[subject].pass++;
    } else {
      subjectPerformanceMap[subject].fail++;
    }
  });
  
  const subjectPerformanceData = Object.entries(subjectPerformanceMap).map(([subject, data]) => ({
    subject: subject,
    pass: data.total > 0 ? formatTo2Decimals((data.pass / data.total) * 100) : 0,
    fail: data.total > 0 ? formatTo2Decimals((data.fail / data.total) * 100) : 0,
    subjectName: data.subjectName // Include subject name in the result
  }));
  
  // Top performers - Only consider non-arrear subjects
  const topPerformers = studentSgpaDetails
    .sort((a, b) => b.sgpa - a.sgpa)
    .slice(0, 6)
    .map(student => {
      const studentRecords = nonArrearCurrentSemesterRecords.filter(record => record.REGNO === student.id && record.GR in gradePointMap);
      const bestGrade = studentRecords.length > 0 ? 
        studentRecords.sort((a, b) => (gradePointMap[b.GR] || 0) - (gradePointMap[a.GR] || 0))[0].GR : 'A';
      return {
        id: student.id,
        sgpa: student.sgpa,
        grade: bestGrade,
      };
    });
  
  // Needs improvement - Check for arrears in all subjects but use SGPA from non-arrear
  const needsImprovement: { id: string; sgpa: number; subjects: string }[] = studentSgpaDetails
    .filter(student => student.sgpa < 6.5 || student.hasArrears)
    .map(student => ({
      id: student.id,
      sgpa: student.sgpa,
      subjects: student.hasArrears ? student.arrearSubjects || '' : '',
    }));
  
  // Pass/Fail data - Only use non-arrear subjects
  const passCount = nonArrearCurrentSemesterRecords.filter(record => record.GR in gradePointMap && record.GR !== 'U').length;
  const failCount = nonArrearCurrentSemesterRecords.filter(record => record.GR === 'U').length;
  const totalValidGrades = passCount + failCount;
  
  const passPercentage = totalValidGrades > 0 ? formatTo2Decimals((passCount / totalValidGrades) * 100) : 0;
  const failPercentage = totalValidGrades > 0 ? formatTo2Decimals((failCount / totalValidGrades) * 100) : 0;
  
  const passFailData = [
    { name: 'Pass', value: passPercentage, fill: passFailColors.pass },
    { name: 'Fail', value: failPercentage, fill: passFailColors.fail },
  ];

  // Subject-wise grade distribution - Only non-arrear subjects
  const subjectGradeDistribution: { [subject: string]: { name: string; count: number; fill: string }[] } = {};
  const uniqueSubjects = [...new Set(recordsForSubjectAnalysis.map(record => record.SCODE))];

  uniqueSubjects.forEach(subject => {
    // Use only non-arrear subjects for grade distribution analysis
    const subjectRecords = recordsForSubjectAnalysis.filter(record => record.SCODE === subject);
    const gradeCounts: { [grade: string]: number } = {};

    subjectRecords.forEach(record => {
      // Only count valid grades
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
  
  // IMPORTANT: Classification table calculations - EXCLUDE ARREAR SUBJECTS
  // For current semester classification, use only non-arrear subjects
  const singleFileClassification = calculateSingleFileClassification(
    nonArrearCurrentSemesterRecords, 
    studentSgpaDetails
  );
  
  // For multiple file classification, use cumulative data but exclude arrear subjects
  const multipleFileClassification = fileCount > 1 
    ? calculateMultipleFileClassification(
        records.filter(r => !r.isArrear), // Exclude arrear subjects from all files 
        nonArrearFileGroups,
        cgpaAnalysis
      )
    : singleFileClassification; // Fallback to single file data if no multiple files
  
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

// Calculate classification data for single file - MODIFIED to handle arrear subjects correctly
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
      } else if (student.sgpa >= 5.0) {
        classification.secondClassWOA++;
      } else {
        classification.fail++;
      }
    }
  });
  
  // Calculate pass percentage - only using non-arrear records
  const totalGrades = records.length;
  const passGrades = records.filter(record => record.GR !== 'U').length;
  
  classification.passPercentage = totalGrades > 0 ? 
    formatTo2Decimals((passGrades / totalGrades) * 100) : 0;
  
  return classification;
};

// Calculate classification data for multiple files - MODIFIED to handle arrear subjects correctly
const calculateMultipleFileClassification = (
  records: StudentRecord[],
  fileGroups: { [fileName: string]: StudentRecord[] },
  cgpaAnalysis?: {
    studentCGPAs: { id: string; cgpa: number; arrearSubjects?: string }[];
    averageCGPA: number;
    highestCGPA: number;
    lowestCGPA: number;
    currentSemesterFile?: string;
  }
) => {
  // Initialize counters
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
  
  // Get unique student IDs
  const studentIds = [...new Set(records.map(record => record.REGNO))];
  classification.totalStudents = studentIds.length;
  
  // Process each student according to the specified rules for multiple files
  studentIds.forEach(studentId => {
    // Check if student has arrears in ANY semester
    const hasArrearsInAnySemester = Object.keys(fileGroups).some(fileName => {
      const fileRecords = fileGroups[fileName];
      return hasArrears(fileRecords, studentId);
    });
    
    // Get student's CGPA
    const cgpaInfo = cgpaAnalysis?.studentCGPAs.find(s => s.id === studentId);
    const cgpa = cgpaInfo?.cgpa || 0;
    
    if (hasArrearsInAnySemester) {
      // Students with arrears in any semester
      if (cgpa >= 6.5) {
        classification.firstClassWA++;
      } else if (cgpa >= 5.0) {
        classification.secondClassWA++;
      } else {
        classification.fail++;
      }
    } else {
      // Students without arrears in any semester
      if (cgpa >= 8.5) {
        classification.distinction++;
      } else if (cgpa >= 6.5) {
        classification.firstClassWOA++;
      } else if (cgpa >= 5.0) {
        classification.secondClassWOA++;
      } else {
        classification.fail++;
      }
    }
  });
  
  // Calculate overall pass percentage across all semesters (excluding arrear subjects)
  const totalGrades = records.length;
  const passGrades = records.filter(record => record.GR !== 'U').length;
  
  classification.passPercentage = totalGrades > 0 ? 
    formatTo2Decimals((passGrades / totalGrades) * 100) : 0;
  
  return classification;
};
