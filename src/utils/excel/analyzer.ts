
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
    
    // CRITICAL FIX: Only use explicitly marked current semester subjects for SGPA calculation
    const currentSemesterSubjects = fileRecords.filter(record => record.isArrear === true);
    
    // If no subjects are explicitly marked, fall back to all subjects in the file
    const recordsForSgpaCalculation = currentSemesterSubjects.length > 0 ? 
      currentSemesterSubjects : 
      fileRecords;
    
    console.log(`File ${fileName}: ${currentSemesterSubjects.length} subjects marked as current semester out of ${fileRecords.length} total`);
    
    const fileStudentIds = [...new Set(recordsForSgpaCalculation.map(record => record.REGNO))];
    const fileStudentCount = fileStudentIds.length;
    
    // Get the semester name if available (assuming all records in a file have the same semester)
    const semName = fileRecords[0]?.SEM || '';
    
    // Calculate average SGPA for this file - USING ONLY MARKED CURRENT SEMESTER SUBJECTS
    let totalSGPA = 0;
    let studentsWithValidSgpa = 0;
    
    fileStudentIds.forEach(studentId => {
      // Get only marked current semester subjects for this student
      const studentRecords = recordsForSgpaCalculation.filter(
        record => record.REGNO === studentId
      );
      
      // Ensure we have records with valid credit values
      if (studentRecords.some(record => record.creditValue && record.creditValue > 0)) {
        // Calculate SGPA with current semester subjects only
        const sgpa = calculateSGPA(studentRecords, studentId);
        
        // Only count if the SGPA is valid
        if (sgpa > 0) {
          totalSGPA += sgpa;
          studentsWithValidSgpa++;
        }
      }
    });
    
    // FIX: Calculate average only for students with valid SGPA (non-zero) to prevent wrong averages
    const avgSGPA = studentsWithValidSgpa > 0 ? formatTo2Decimals(totalSGPA / studentsWithValidSgpa) : 0;
    
    console.log(`File ${fileName}: Average SGPA = ${avgSGPA} from ${studentsWithValidSgpa} students with valid SGPA`);
    
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
    
    // For CGPA calculation, we need to ensure that each student has valid records in each semester
    const studentCGPAs = studentIds.map(id => {
      // For CGPA, calculate using marked current semester subjects
      const cgpa = calculateCGPA(records, id, fileGroups);
      return {
        id,
        cgpa
      };
    });
    
    // Filter out students with invalid/zero CGPA before calculating stats
    const validCgpaStudents = studentCGPAs.filter(s => s.cgpa > 0);
    
    // Sort by CGPA in descending order for toppers list
    validCgpaStudents.sort((a, b) => b.cgpa - a.cgpa);
    
    const cgpaValues = validCgpaStudents.map(s => s.cgpa);
    
    // FIX: Calculate CGPA statistics only from students with valid (non-zero) CGPA values
    cgpaAnalysis = {
      studentCGPAs: studentCGPAs, // Keep all students for reference
      averageCGPA: cgpaValues.length > 0 ? formatTo2Decimals(cgpaValues.reduce((sum, cgpa) => sum + cgpa, 0) / cgpaValues.length) : 0,
      highestCGPA: cgpaValues.length > 0 ? formatTo2Decimals(Math.max(...cgpaValues)) : 0,
      lowestCGPA: cgpaValues.length > 0 ? formatTo2Decimals(Math.min(...cgpaValues)) : 0,
      toppersList: validCgpaStudents.slice(0, 10), // Get top 10 students with valid CGPA
      currentSemesterFile: currentSemesterFile // Use the file with highest sem value as current semester
    };
    
    console.log(`CGPA Analysis: Average=${cgpaAnalysis.averageCGPA}, Highest=${cgpaAnalysis.highestCGPA}, Lowest=${cgpaAnalysis.lowestCGPA}`);
  }
  
  const totalStudents = [...new Set(records.map(record => record.REGNO))].length;
  
  // CRITICAL FIX: Calculate SGPA specifically for current semester records - ONLY USING MARKED SUBJECTS
  const currentSemesterRecords = currentSemesterFile ? 
    records.filter(record => record.fileSource === currentSemesterFile) : 
    records;
  
  console.log(`Using ${currentSemesterRecords.length} records from "${currentSemesterFile}" for current semester SGPA calculation`);
  
  // Only include records that were explicitly marked as "current semester" by the user
  const currentSemesterOnlyRecords = currentSemesterRecords.filter(record => record.isArrear === true);
  console.log(`Including ${currentSemesterOnlyRecords.length} subjects explicitly marked as current semester for SGPA calculation`);
  
  // If no subjects are marked as current semester, fall back to default behavior
  const recordsForSgpaCalculation = currentSemesterOnlyRecords.length > 0 ? 
    currentSemesterOnlyRecords : 
    currentSemesterRecords;
  
  if (currentSemesterOnlyRecords.length === 0) {
    console.log(`No subjects marked as current semester. Falling back to default behavior (using all subjects in current semester file)`);
  }
  
  // Calculate SGPA for each student based on current semester only
  const studentSgpaDetails: { id: string; sgpa: number; hasArrears: boolean }[] = [];
  
  const currentSemStudentIds = [...new Set(recordsForSgpaCalculation.map(record => record.REGNO))];
  
  // Check if records have credit values
  const recordsWithCredits = recordsForSgpaCalculation.filter(r => r.creditValue && r.creditValue > 0);
  console.log(`Records with credits for SGPA: ${recordsWithCredits.length} out of ${recordsForSgpaCalculation.length}`);
  
  if (recordsWithCredits.length === 0 && recordsForSgpaCalculation.length > 0) {
    console.warn("WARNING: No records have credit values assigned in SGPA calculation! This will result in all SGPAs being 0.");
  }

  currentSemStudentIds.forEach(studentId => {
    // Get only explicitly marked current semester records for this student
    const studentRecords = recordsForSgpaCalculation.filter(record => record.REGNO === studentId);
    
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
    console.log(`Student ${studentId}: SGPA calculated = ${sgpa} (from ${studentRecords.length} records, ${totalCredits} credits)`);
    
    studentSgpaDetails.push({
      id: studentId,
      sgpa: sgpa,
      hasArrears: hasArrears(studentRecords, studentId)
    });
  });
  
  // Sort by registration number
  studentSgpaDetails.sort((a, b) => a.id.localeCompare(b.id));
  
  // Calculate average SGPA from valid (non-zero) values only
  const validSgpaValues = studentSgpaDetails.filter(student => student.sgpa > 0).map(student => student.sgpa);
  const averageCGPA = validSgpaValues.length > 0 ? 
    formatTo2Decimals(validSgpaValues.reduce((sum, sgpa) => sum + sgpa, 0) / validSgpaValues.length) : 0;
  
  const highestSGPA = validSgpaValues.length > 0 ? 
    formatTo2Decimals(Math.max(...validSgpaValues)) : 0;
  
  const lowestSGPA = validSgpaValues.length > 0 ? 
    formatTo2Decimals(Math.min(...validSgpaValues)) : 0;
  
  // Grade distribution - filter out any non-standard grades
  const gradeDistribution: { [grade: string]: number } = {};
  // Use only current semester subjects for grade distribution
  recordsForSgpaCalculation.forEach(record => {
    if (record.GR in gradePointMap) {
      gradeDistribution[record.GR] = (gradeDistribution[record.GR] || 0) + 1;
    }
  });
  
  const gradeDistributionData = Object.entries(gradeDistribution).map(([grade, count]) => ({
    name: grade,
    count: count,
    fill: getGradeColor(grade),
  }));
  
  const totalGrades = recordsForSgpaCalculation.filter(record => record.GR in gradePointMap).length;
  
  // Subject-wise performance - Now includes preservation of subject names
  // For current semester, use only records explicitly marked as current semester
  const recordsForSubjectAnalysis = recordsForSgpaCalculation;
  
  console.log(`Using ${recordsForSubjectAnalysis.length} records for subject performance analysis`);
  
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
  
  // Top performers - using only current semester records
  const topPerformers = studentSgpaDetails
    .filter(student => student.sgpa > 0) // Only include students with valid SGPA
    .sort((a, b) => b.sgpa - a.sgpa)
    .slice(0, 6)
    .map(student => {
      const studentRecords = recordsForSgpaCalculation.filter(record => record.REGNO === student.id && record.GR in gradePointMap);
      const bestGrade = studentRecords.length > 0 ? 
        studentRecords.sort((a, b) => (gradePointMap[b.GR] || 0) - (gradePointMap[a.GR] || 0))[0].GR : 'A';
      return {
        id: student.id,
        sgpa: student.sgpa,
        grade: bestGrade,
      };
    });
  
  // Needs improvement - using only current semester records
  const needsImprovement: { id: string; sgpa: number; subjects: string }[] = studentSgpaDetails
    .filter(student => student.sgpa < 6.5 || student.hasArrears)
    .map(student => ({
      id: student.id,
      sgpa: student.sgpa,
      subjects: hasArrears(recordsForSgpaCalculation.filter(r => r.REGNO === student.id), student.id) ? 
        getSubjectsWithArrears(recordsForSgpaCalculation.filter(r => r.REGNO === student.id), student.id) : '',
    }));
  
  // Pass/Fail data - using only current semester records
  const passCount = recordsForSgpaCalculation.filter(record => record.GR in gradePointMap && record.GR !== 'U').length;
  const failCount = recordsForSgpaCalculation.filter(record => record.GR === 'U').length;
  const totalValidGrades = passCount + failCount;
  
  const passPercentage = totalValidGrades > 0 ? formatTo2Decimals((passCount / totalValidGrades) * 100) : 0;
  const failPercentage = totalValidGrades > 0 ? formatTo2Decimals((failCount / totalValidGrades) * 100) : 0;
  
  const passFailData = [
    { name: 'Pass', value: passPercentage, fill: passFailColors.pass },
    { name: 'Fail', value: failPercentage, fill: passFailColors.fail },
  ];

  // Subject-wise grade distribution - using only current semester records
  const subjectGradeDistribution: { [subject: string]: { name: string; count: number; fill: string }[] } = {};
  const uniqueSubjects = [...new Set(recordsForSgpaCalculation.map(record => record.SCODE))];

  uniqueSubjects.forEach(subject => {
    const subjectRecords = recordsForSgpaCalculation.filter(record => record.SCODE === subject);
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
  
  // Classification table calculations - use only current semester subjects
  const currentSemesterRecordsForClassification = recordsForSgpaCalculation;
  const currentSemesterStudentSgpaDetails = [...new Set(currentSemesterRecordsForClassification.map(record => record.REGNO))].map(studentId => {
    return studentSgpaDetails.find(detail => detail.id === studentId) || {
      id: studentId,
      sgpa: 0,
      hasArrears: hasArrears(currentSemesterRecordsForClassification, studentId)
    };
  });
  
  console.log(`Excluded ${currentSemesterRecords.length - recordsForSgpaCalculation.length} non-current-semester subjects from End Semester Analysis`);
  
  const singleFileClassification = calculateSingleFileClassification(currentSemesterRecordsForClassification, currentSemesterStudentSgpaDetails);
  const multipleFileClassification = fileCount > 1 
    ? calculateMultipleFileClassification(records, fileGroups, cgpaAnalysis)
    : singleFileClassification; // Fallback to single file data if no multiple files
    
  // Log top students for debugging
  const topSemesterStudents = [...studentSgpaDetails]
    .filter(s => s.sgpa > 0)
    .sort((a, b) => b.sgpa - a.sgpa)
    .slice(0, 3)
    .map((student, index) => ({
      rank: index + 1,
      id: student.id,
      value: student.sgpa
    }));
  console.log(`Top current semester students for Rank table: ${JSON.stringify(topSemesterStudents, null, 2)}`);
  
  // Log top cumulative students for debugging
  if (cgpaAnalysis?.toppersList) {
    const topCumulativeStudents = cgpaAnalysis.toppersList
      .slice(0, 3)
      .map((student, index) => ({
        rank: index + 1,
        id: student.id,
        value: student.cgpa
      }));
    console.log(`Top cumulative students for Rank table: ${JSON.stringify(topCumulativeStudents, null, 2)}`);
  }
  
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

// Calculate classification data for single file
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

// Calculate classification data for multiple files
const calculateMultipleFileClassification = (
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
      } else {
        classification.secondClassWOA++;
      }
    }
  });
  
  // Count U grades across all semesters for fail column
  const failGradeCount = records.filter(record => record.GR === 'U').length;
  classification.fail = failGradeCount;
  
  // Calculate overall pass percentage across all semesters
  const totalGrades = records.length;
  const passGrades = records.filter(record => record.GR !== 'U').length;
  
  classification.passPercentage = totalGrades > 0 ? 
    formatTo2Decimals((passGrades / totalGrades) * 100) : 0;
  
  return classification;
};
