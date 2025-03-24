import * as XLSX from 'xlsx';
import JsPDF from 'jspdf';
import 'jspdf-autotable';

// Export interfaces for use in other components
export interface StudentRecord {
  CNo: string; // We'll keep this for backward compatibility, but won't focus on it
  SEM: string;
  REGNO: string;
  SCODE: string;
  GR: string;
  creditValue?: number;
  fileSource?: string; // To track which file the record came from
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
  }; // CGPA analysis when multiple files
}

const gradePointMap: { [grade: string]: number } = {
  'O': 10,
  'A+': 9,
  'A': 8,
  'B+': 7,
  'B': 6,
  'C': 5,
  'P': 4,
  'U': 0,
};

const gradeColors: { [grade: string]: string } = {
  'O': '#10b981',   // Emerald green
  'A+': '#34d399',  // Teal green
  'A': '#6ee7b7',   // Light green
  'B+': '#facc15',  // Yellow
  'B': '#fbbf24',   // Amber
  'C': '#f97316',   // Orange
  'P': '#ef4444',   // Red
  'U': '#dc2626',   // Dark red
};

const passFailColors = {
  pass: '#22c55e',  // Green
  fail: '#ef4444',  // Red
};

const getGradeColor = (grade: string): string => {
  return gradeColors[grade] || '#9ca3af'; // Default gray
};

// Helper function to format numbers to exactly 2 decimal places
const formatTo2Decimals = (value: number): number => {
  return Number(value.toFixed(2));
};

// Helper function to get unique department codes from the records - Keeping for backward compatibility but not used
export const getUniqueDepartmentCodes = (records: StudentRecord[]): string[] => {
  return [...new Set(records.map(record => record.CNo))].filter(code => code);
};

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

const hasArrears = (records: StudentRecord[], studentId: string): boolean => {
  return records.filter(record => record.REGNO === studentId).some(record => record.GR === 'U');
};

const getSubjectsWithArrears = (records: StudentRecord[], studentId: string): string => {
  const arrearsSubjects = records.filter(record => record.REGNO === studentId && record.GR === 'U').map(record => record.SCODE);
  return arrearsSubjects.join(', ');
};

export const parseExcelFile = async (file: File): Promise<StudentRecord[]> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e: any) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });

        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];

        const records: StudentRecord[] = XLSX.utils.sheet_to_json(worksheet, { raw: true })
          .map((row: any) => ({
            CNo: String(row['CNo'] || ''),
            SEM: String(row['SEM'] || ''),
            REGNO: String(row['REGNO'] || ''),
            SCODE: String(row['SCODE'] || ''),
            GR: String(row['GR'] || ''),
            fileSource: file.name, // Add the source file name
          }));

        resolve(records);
      } catch (error) {
        reject(error);
      }
    };

    reader.onerror = (error) => {
      reject(error);
    };

    reader.readAsArrayBuffer(file);
  });
};

// Parse multiple Excel files
export const parseMultipleExcelFiles = async (files: File[]): Promise<StudentRecord[]> => {
  try {
    // Process each file and get their records
    const recordPromises = files.map(file => parseExcelFile(file));
    const recordArrays = await Promise.all(recordPromises);
    
    // Combine all records into a single array
    const combinedRecords = recordArrays.flat();
    
    return combinedRecords;
  } catch (error) {
    throw new Error(`Error processing multiple files: ${error}`);
  }
};

export const analyzeResults = (records: StudentRecord[]): ResultAnalysis => {
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
  
  // Calculate CGPA if multiple files
  let cgpaAnalysis;
  if (fileCount > 1) {
    const studentIds = [...new Set(records.map(record => record.REGNO))];
    const studentCGPAs = studentIds.map(id => ({
      id,
      cgpa: calculateCGPA(records, id, fileGroups)
    }));
    
    const cgpaValues = studentCGPAs.map(s => s.cgpa);
    cgpaAnalysis = {
      studentCGPAs,
      averageCGPA: cgpaValues.length > 0 ? formatTo2Decimals(cgpaValues.reduce((sum, cgpa) => sum + cgpa, 0) / cgpaValues.length) : 0,
      highestCGPA: cgpaValues.length > 0 ? formatTo2Decimals(Math.max(...cgpaValues)) : 0,
      lowestCGPA: cgpaValues.length > 0 ? formatTo2Decimals(Math.min(...cgpaValues)) : 0,
    };
  }
  
  const totalStudents = [...new Set(records.map(record => record.REGNO))].length;
  
  // Calculate SGPA for each student
  const studentSgpaMap: { [studentId: string]: number } = {};
  const studentSgpaDetails: { id: string; sgpa: number; hasArrears: boolean }[] = [];
  
  [...new Set(records.map(record => record.REGNO))].forEach(studentId => {
    const sgpa = calculateSGPA(records, studentId);
    studentSgpaMap[studentId] = sgpa;
    studentSgpaDetails.push({
      id: studentId,
      sgpa: sgpa,
      hasArrears: hasArrears(records, studentId)
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
  
  // Subject-wise performance
  const subjectPerformanceMap: { [subject: string]: { pass: number; fail: number; total: number } } = {};
  records.forEach(record => {
    // Skip records with invalid grades
    if (!(record.GR in gradePointMap)) return;
    
    const subject = record.SCODE;
    if (!subjectPerformanceMap[subject]) {
      subjectPerformanceMap[subject] = { pass: 0, fail: 0, total: 0 };
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

  // Subject-wise grade distribution
  const subjectGradeDistribution: { [subject: string]: { name: string; count: number; fill: string }[] } = {};
  const uniqueSubjects = [...new Set(records.map(record => record.SCODE))];

  uniqueSubjects.forEach(subject => {
    const subjectRecords = records.filter(record => record.SCODE === subject);
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
    cgpaAnalysis
  };
};

// Function to download CSV report
export const downloadCSVReport = (analysis: ResultAnalysis, records: StudentRecord[]): void => {
  try {
    // Create CSV content
    let csvContent = "data:text/csv;charset=utf-8,";
    
    // Add headers
    csvContent += "Registration Number,SGPA,Status\n";
    
    // Add student data
    analysis.studentSgpaDetails?.forEach(student => {
      const status = student.hasArrears ? 'Has Arrears' : (student.sgpa < 6.5 ? 'SGPA below 6.5' : 'Good Standing');
      csvContent += `${student.id},${student.sgpa.toFixed(2)},${status}\n`;
    });
    
    // Create download link
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', 'result-analysis-report.csv');
    
    // Trigger download
    document.body.appendChild(link);
    link.click();
    
    // Clean up
    document.body.removeChild(link);
  } catch (error) {
    console.error('Error generating CSV report:', error);
  }
};

// Function to generate Excel data for reports
export const downloadExcelReport = (analysis: ResultAnalysis, records: StudentRecord[]): void => {
  const blob = generateExcelData(analysis, records);
  
  // Create download link
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = 'result-analysis-report.xlsx';
  
  // Trigger download
  document.body.appendChild(link);
  link.click();
  
  // Clean up
  document.body.removeChild(link);
  URL.revokeObjectURL(link.href);
};

// Add file information to Excel report
const generateExcelData = (analysis: ResultAnalysis, records: StudentRecord[]): Blob => {
  // Create a new workbook
  const workbook = XLSX.utils.book_new();

  // Helper function to add a sheet to the workbook
  const addSheet = (data: any[][], name: string, header: string[]) => {
    const ws = XLSX.utils.aoa_to_sheet([header, ...data]);
    
    // Set column widths
    const cols = header.map(() => ({ wch: 20 })); // Set width for each column
    ws['!cols'] = cols;
    
    XLSX.utils.book_append_sheet(workbook, ws, name);
  };
  
  // College Information
  const collegeInfoData = [
    ["College Name", "K. S. Rangasamy College of Technology"],
    ["Department", "Computer Science and Engineering"],
    ["Batch", "2023-2027"],
    ["Year/Semester", "II/III"],
    ["Section", "A&B"],
  ];
  
  // Performance Summary Data
  const performanceData = [
    ["Total Students", analysis.totalStudents],
    ["Average SGPA", analysis.averageCGPA.toFixed(2)],
    ["Highest SGPA", analysis.highestSGPA.toFixed(2)],
    ["Lowest SGPA", analysis.lowestSGPA.toFixed(2)],
  ];

  // Add file information if multiple files were used
  if (analysis.fileCount && analysis.fileCount > 1 && analysis.filesProcessed) {
    performanceData.push(["Number of Files Processed", analysis.fileCount]);
    
    // Add individual file analysis
    if (analysis.fileWiseAnalysis) {
      Object.entries(analysis.fileWiseAnalysis).forEach(([fileName, fileData]) => {
        performanceData.push([`${fileName} Average SGPA`, fileData.averageSGPA.toFixed(2)]);
        performanceData.push([`${fileName} Students`, fileData.students]);
        if (fileData.semesterName) {
          performanceData.push([`${fileName} Semester`, fileData.semesterName]);
        }
      });
    }
    
    // Add CGPA data if available
    if (analysis.cgpaAnalysis) {
      performanceData.push(["Average CGPA", analysis.cgpaAnalysis.averageCGPA.toFixed(2)]);
      performanceData.push(["Highest CGPA", analysis.cgpaAnalysis.highestCGPA.toFixed(2)]);
      performanceData.push(["Lowest CGPA", analysis.cgpaAnalysis.lowestCGPA.toFixed(2)]);
    }
  }

  // Subject-wise Performance Data (End Semester Result Analysis)
  const subjectPerformanceHeader = ["S.No", "Subject Code", "Subject Name", "Faculty Name", "Dept", "App", "Absent", "Fail", "WH", "Passed", "% of pass", "Highest Grade", "No. of students"];
  const uniqueSubjects = [...new Set(records.map(record => record.SCODE))];
  const subjectPerformanceData = uniqueSubjects.map((subject, index) => {
    const subjectRecords = records.filter(record => record.SCODE === subject);
    const totalStudents = subjectRecords.length;
    const passedStudents = subjectRecords.filter(record => record.GR !== 'U').length;
    const failedStudents = totalStudents - passedStudents;
    const passPercentage = (passedStudents / totalStudents) * 100;
    
    // Find the highest grade
    const grades = subjectRecords.map(record => record.GR);
    const highestGrade = grades.sort((a, b) => gradePointMap[b] - gradePointMap[a])[0];
    
    // Count students with highest grade
    const studentsWithHighestGrade = subjectRecords.filter(record => record.GR === highestGrade).length;
    
    // Generate subject name as "Subject 1", "Subject 2", etc.
    const subjectName = `Subject ${index + 1}`;
    
    return [
      index + 1,
      subject,
      subjectName, // Subject name 
      "", // Faculty name (empty)
      "CSE", // Department - now hardcoded to CSE since we no longer track department
      totalStudents,
      "Nil", // Absent
      failedStudents || "Nil", 
      1, // WH
      passedStudents,
      passPercentage.toFixed(1),
      highestGrade,
      studentsWithHighestGrade
    ];
  });

  // Grade Distribution Data
  const gradeDistributionHeader = ["Grade", "Count", "Percentage"];
  const gradeDistributionData = analysis.gradeDistribution.map(grade => [
    grade.name,
    grade.count,
    analysis.totalGrades > 0 ? ((grade.count / analysis.totalGrades) * 100).toFixed(2) + "%" : "0%"
  ]);

  // Top Performers Data
  const topPerformersHeader = ["S.No", "Name of the student", "SGPA"];
  const topPerformersData = analysis.topPerformers.map((student, index) => [
    index + 1,
    student.id,
    student.sgpa.toFixed(2)
  ]);

  // CGPA Top Performers if available
  let cgpaTopPerformersData: any[][] = [];
  if (analysis.cgpaAnalysis && analysis.cgpaAnalysis.studentCGPAs) {
    cgpaTopPerformersData = analysis.cgpaAnalysis.studentCGPAs
      .sort((a, b) => b.cgpa - a.cgpa)
      .slice(0, 5)
      .map((student, index) => [
        index + 1,
        student.id,
        student.cgpa.toFixed(2)
      ]);
  }

  // Classification Data
  const currentSemesterData = [
    ["Distinction", 40, "First class", "WOA", 65, "WA", 3, "Second class", "WOA", 5, "WA", 16, "Fail", 18, "% of pass", 71.6]
  ];

  // Category and Grade Point data
  const categoryData = [
    ["Category", "Grade Point"],
    ["1. Distinction", ">= 8.5 and no history of arrears"],
    ["2. First class", ">= 6.5"],
    ["3. Second class", "< 6.5"]
  ];

  // Add sheets for each analysis
  addSheet(collegeInfoData, "College Information", ["Field", "Value"]);
  addSheet(performanceData, "Performance Summary", ["Metric", "Value"]);
  addSheet(subjectPerformanceData, "End Semester Result Analysis", subjectPerformanceHeader);
  addSheet(gradeDistributionData, "Grade Distribution", gradeDistributionHeader);
  addSheet(topPerformersData, "Rank in this semester", topPerformersHeader);
  
  // Add CGPA rankings if multiple files
  if (cgpaTopPerformersData.length > 0) {
    addSheet(cgpaTopPerformersData, "Rank up to this semester", ["S.No", "Name of the student", "CGPA"]);
  }
  
  addSheet(currentSemesterData, "Classification", ["Current semester", "", "", "", "", "", "", "", "", "", "", "", "", ""]);
  addSheet(categoryData, "Categories", ["Category", "Grade Point"]);
  
  // Student-wise SGPA Details Data
  const studentSgpaDetailsHeader = ["Registration Number", "SGPA", "Status"];
  const studentSgpaDetailsData = analysis.studentSgpaDetails?.map(student => [
    student.id,
    student.sgpa.toFixed(2),
    student.hasArrears ? 'Has Arrears' : (student.sgpa < 6.5 ? 'SGPA below 6.5' : 'Good Standing')
  ]) || [];
  
  // CGPA details if available
  let cgpaDetailsData: any[][] = [];
  if (analysis.cgpaAnalysis && analysis.cgpaAnalysis.studentCGPAs) {
    cgpaDetailsData = analysis.cgpaAnalysis.studentCGPAs.map(student => [
      student.id,
      student.cgpa.toFixed(2)
    ]);
  }

  addSheet(studentSgpaDetailsData, "Student SGPA Details", studentSgpaDetailsHeader);
  
  // Add CGPA details if multiple files were processed
  if (cgpaDetailsData.length > 0) {
    addSheet(cgpaDetailsData, "Student CGPA Details", ["Registration Number", "CGPA"]);
  }
  
  // Add file details to the workbook if multiple files were processed
  if (analysis.fileCount && analysis.fileCount > 1 && analysis.filesProcessed) {
    const fileDetailsHeader = ["File Name", "Record Count", "Semester"];
    const fileDetailsData = analysis.filesProcessed.map(fileName => {
      const fileRecordCount = records.filter(record => record.fileSource === fileName).length;
      const semester = records.find(record => record.fileSource === fileName)?.SEM || 'Unknown';
      return [fileName, fileRecordCount, semester];
    });
    addSheet(fileDetailsData, "File Details", fileDetailsHeader);
  }

  // Convert the workbook to a binary string and create a Blob
  const wbout = XLSX.write(workbook, { bookType: 'xlsx', type: 'binary' });
  
  // Convert binary string to ArrayBuffer
  const buf = new ArrayBuffer(wbout.length);
  const view = new Uint8Array(buf);
  for (let i = 0; i < wbout.length; i++) {
    view[i] = wbout.charCodeAt(i) & 0xFF;
  }
  
  // Create and return Blob
  return new Blob([buf], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
};

// Generate Word report with improved formatting
export const generateWordReport = (analysis: ResultAnalysis, records: StudentRecord[]): string => {
  // Get unique students and subjects
  const uniqueStudents = [...new Set(records.map(record => record.REGNO))];
  const uniqueSubjects = [...new Set(records.map(record => record.SCODE))];
  
  // Create subject-wise analysis data
  const subjectAnalysisRows = uniqueSubjects.map((subject, index) => {
    const subjectRecords = records.filter(record => record.SCODE === subject);
    const totalStudents = subjectRecords.length;
    const passedStudents = subjectRecords.filter(record => record.GR !== 'U').length;
    const failedStudents = totalStudents - passedStudents;
    const passPercentage = (passedStudents / totalStudents) * 100;
    
    // Find the highest grade
    const grades = subjectRecords.map(record => record.GR);
    const highestGrade = grades.sort((a, b) => gradePointMap[b] - gradePointMap[a])[0];
    
    // Count students with highest grade
    const studentsWithHighestGrade = subjectRecords.filter(record => record.GR === highestGrade).length;
    
    // Generate subject name as "Subject 1", "Subject 2", etc.
    const subjectName = `Subject ${index + 1}`;
    
    return `
      <tr>
        <td style="width: 5%;">${index + 1}</td>
        <td style="width: 12%;">${subject}</td>
        <td style="width: 20%;">${subjectName}</td>
        <td style="width: 20%;"></td>
        <td style="width: 8%;">CSE</td>
        <td style="width: 5%;">${totalStudents}</td>
        <td style="width: 5%;">Nil</td>
        <td style="width: 5%;">${failedStudents || "Nil"}</td>
        <td style="width: 5%;">1</td>
        <td style="width: 5%;">${passedStudents}</td>
        <td style="width: 7%;">${passPercentage.toFixed(1)}</td>
        <td style="width: 8%;">${highestGrade}</td>
        <td style="width: 8%;">${studentsWithHighestGrade}</td>
      </tr>
    `;
  }).join('');
  
  // File wise analysis content
  let fileWiseContent = '';
  if (analysis.fileWiseAnalysis && Object.keys(analysis.fileWiseAnalysis).length > 0) {
    const fileRows = Object.entries(analysis.fileWiseAnalysis).map(([fileName, data]) => `
      <tr>
        <td>${fileName}</td>
        <td>${data.students}</td>
        <td>${data.averageSGPA.toFixed(2)}</td>
        <td>${data.semesterName || "N/A"}</td>
      </tr>
    `).join('');
    
    fileWiseContent = `
      <h3 style="margin-top: 20px; margin-bottom: 10px;">File Analysis</h3>
      <table border="1" cellpadding="5" cellspacing="0" style="width: 100%; border-collapse: collapse;">
        <tr style="background-color: #f2f2f2;">
          <th>File Name</th>
          <th>Students</th>
          <th>Average SGPA</th>
          <th>Semester</th>
        </tr>
        ${fileRows}
      </table>
    `;
  }
  
  // CGPA analysis content if available
  let cgpaContent = '';
  if (analysis.cgpaAnalysis) {
    const cgpaTopStudents = analysis.cgpaAnalysis.studentCGPAs
      .sort((a, b) => b.cgpa - a.cgpa)
      .slice(0, 5)
      .map((student, index) => `
        <tr>
          <td>${index + 1}</td>
          <td>${student.id}</td>
          <td>${student.cgpa.toFixed(2)}</td>
        </tr>
      `).join('');
    
    cgpaContent = `
      <h3 style="margin-top: 20px; margin-bottom: 10px;">CGPA Analysis</h3>
      <p>Average CGPA: ${analysis.cgpaAnalysis.averageCGPA.toFixed(2)}</p>
      <p>Highest CGPA: ${analysis.cgpaAnalysis.highestCGPA.toFixed(2)}</p>
      <p>Lowest CGPA: ${analysis.cgpaAnalysis.lowestCGPA.toFixed(2)}</p>
      
      <h4 style="margin-top: 15px; margin-bottom: 10px;">Top Performers (CGPA)</h4>
      <table border="1" cellpadding="5" cellspacing="0" style="width: 100%; border-collapse: collapse;">
        <tr style="background-color: #f2f2f2;">
          <th>Rank</th>
          <th>Registration Number</th>
          <th>CGPA</th>
        </tr>
        ${cgpaTopStudents}
      </table>
    `;
  }
  
  // Grade distribution content
  const gradeDistributionRows = analysis.gradeDistribution.map(grade => `
    <tr>
      <td>${grade.name}</td>
      <td>${grade.count}</td>
      <td>${((grade.count / analysis.totalGrades) * 100).toFixed(2)}%</td>
    </tr>
  `).join('');
  
  // Top performers content
  const topPerformersRows = analysis.topPerformers.map((student, index) => `
    <tr>
      <td>${index + 1}</td>
      <td>${student.id}</td>
      <td>${student.sgpa.toFixed(2)}</td>
    </tr>
  `).join('');
  
  // Needs improvement content
  const needsImprovementRows = analysis.needsImprovement.map((student, index) => `
    <tr>
      <td>${index + 1}</td>
      <td>${student.id}</td>
      <td>${student.sgpa.toFixed(2)}</td>
      <td>${student.subjects}</td>
    </tr>
  `).join('');
  
  // Subject performance content
  const subjectPerformanceRows = analysis.subjectPerformance.map((subject, index) => `
    <tr>
      <td>${index + 1}</td>
      <td>${subject.subject}</td>
      <td>${subject.pass.toFixed(2)}%</td>
      <td>${subject.fail.toFixed(2)}%</td>
    </tr>
  `).join('');
  
  // Create the complete HTML document
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Result Analysis Report</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; padding: 20px; }
        h1 { color: #333366; text-align: center; margin-bottom: 20px; }
        h2 { color: #333366; margin-top: 25px; margin-bottom: 15px; }
        h3 { color: #333366; margin-top: 20px; margin-bottom: 10px; }
        table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        th { background-color: #f2f2f2; font-weight: bold; }
        tr:nth-child(even) { background-color: #f9f9f9; }
        .header-section { display: flex; justify-content: space-between; margin-bottom: 20px; }
        .college-info { width: 60%; }
        .summary-info { width: 35%; border: 1px solid #ddd; padding: 10px; background-color: #f9f9f9; }
        .highlight { color: #cc0000; font-weight: bold; }
        .success { color: #007700; font-weight: bold; }
      </style>
    </head>
    <body>
      <h1>Result Analysis Report</h1>
      
      <div class="header-section">
        <div class="college-info">
          <h2>College Information</h2>
          <table border="1" cellpadding="5" cellspacing="0">
            <tr><td><strong>College Name</strong></td><td>K. S. Rangasamy College of Technology</td></tr>
            <tr><td><strong>Department</strong></td><td>Computer Science and Engineering</td></tr>
            <tr><td><strong>Total Students</strong></td><td>${analysis.totalStudents}</td></tr>
            <tr><td><strong>Files Processed</strong></td><td>${analysis.fileCount || 1}</td></tr>
          </table>
        </div>
        
        <div class="summary-info">
          <h3>Performance Summary</h3>
          <p><strong>Average SGPA:</strong> ${analysis.averageCGPA.toFixed(2)}</p>
          <p><strong>Highest SGPA:</strong> ${analysis.highestSGPA.toFixed(2)}</p>
          <p><strong>Lowest SGPA:</strong> ${analysis.lowestSGPA.toFixed(2)}</p>
          <p><strong>Pass Percentage:</strong> ${analysis.passFailData[0].value.toFixed(2)}%</p>
        </div>
      </div>
      
      ${fileWiseContent}
      
      ${cgpaContent}
      
      <h2>End Semester Result Analysis</h2>
      <table border="1" cellpadding="5" cellspacing="0">
        <tr style="background-color: #f2f2f2;">
          <th>S.No</th>
          <th>Subject Code</th>
          <th>Subject Name</th>
          <th>Faculty Name</th>
          <th>Dept</th>
          <th>App</th>
          <th>Absent</th>
          <th>Fail</th>
          <th>WH</th>
          <th>Passed</th>
          <th>% of pass</th>
          <th>Highest Grade</th>
          <th>No. of students</th>
        </tr>
        ${subjectAnalysisRows}
      </table>
      
      <h2>Grade Distribution</h2>
      <table border="1" cellpadding="5" cellspacing="0">
        <tr style="background-color: #f2f2f2;">
          <th>Grade</th>
          <th>Count</th>
          <th>Percentage</th>
        </tr>
        ${gradeDistributionRows}
      </table>
      
      <h2>Top Performers</h2>
      <table border="1" cellpadding="5" cellspacing="0">
        <tr style="background-color: #f2f2f2;">
          <th>Rank</th>
          <th>Registration Number</th>
          <th>SGPA</th>
        </tr>
        ${topPerformersRows}
      </table>
      
      <h2>Students Needing Improvement</h2>
      <table border="1" cellpadding="5" cellspacing="0">
        <tr style="background-color: #f2f2f2;">
          <th>S.No</th>
          <th>Registration Number</th>
          <th>SGPA</th>
          <th>Arrear Subjects</th>
        </tr>
        ${needsImprovementRows}
      </table>
      
      <h2>Subject-wise Performance</h2>
      <table border="1" cellpadding="5" cellspacing="0">
        <tr style="background-color: #f2f2f2;">
          <th>S.No</th>
          <th>Subject Code</th>
          <th>Pass %</th>
          <th>Fail %</th>
        </tr>
        ${subjectPerformanceRows}
      </table>
      
      <div style="margin-top: 50px; text-align: center; font-size: 12px; color: #666;">
        <p>Generated on ${new Date().toLocaleString()}</p>
      </div>
    </body>
    </html>
  `;
  
  return html;
};

// Function to download Word report (HTML Export)
export const downloadWordReport = (analysis: ResultAnalysis, records: StudentRecord[]): void => {
  try {
    const html = generateWordReport(analysis, records);
    
    const blob = new Blob([html], { type: 'application/msword' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'result-analysis-report.doc';
    
    // Trigger download
    document.body.appendChild(link);
    link.click();
    
    // Clean up
    document.body.removeChild(link);
    URL.revokeObjectURL(link.href);
  } catch (error) {
    console.error('Error generating Word report:', error);
  }
};

// Function to download PDF report using html2canvas
export const downloadPdfReport = async (elementId: string): Promise<boolean> => {
  try {
    const element = document.getElementById(elementId);
    if (!element) {
      console.error('Element not found:', elementId);
      return false;
    }
    
    // Create a new jsPDF instance
    const doc = new JsPDF('p', 'mm', 'a4');
    
    // Use html2canvas to capture the element
    const canvas = await import('html2canvas').then(html2canvas => html2canvas.default(element, {
      scale: 1,
      useCORS: true,
      logging: false
    }));
    
    const imgData = canvas.toDataURL('image/png');
    
    // Calculate dimensions to fit on the page
    const imgWidth = 210; // A4 width in mm
    const pageHeight = 295; // A4 height in mm
    const imgHeight = canvas.height * imgWidth / canvas.width;
    let heightLeft = imgHeight;
    let position = 0;
    
    // Add first page
    doc.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
    heightLeft -= pageHeight;
    
    // Add additional pages if needed for long content
    while (heightLeft >= 0) {
      position = heightLeft - imgHeight;
      doc.addPage();
      doc.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
    }
    
    // Save the PDF
    doc.save('result-analysis-report.pdf');
    return true;
  } catch (error) {
    console.error('Error generating PDF report:', error);
    return false;
  }
};

// Helper function to assign credit values to records
export const assignCreditValues = (
  records: StudentRecord[], 
  subjectCredits: { subjectCode: string; creditValue: number }[]
): StudentRecord[] => {
  return records.map(record => {
    const creditAssignment = subjectCredits.find(
      credit => credit.subjectCode === record.SCODE
    );
    
    return {
      ...record,
      creditValue: creditAssignment ? creditAssignment.creditValue : 0
    };
  });
};
