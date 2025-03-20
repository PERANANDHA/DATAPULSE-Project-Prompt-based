import * as XLSX from 'xlsx';
import JsPDF from 'jspdf';
import 'jspdf-autotable';

// Export interfaces for use in other components
export interface StudentRecord {
  CNo: string;
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
  
  // Calculate CGPA if multiple files - ensure 2 decimal places
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
  
  // Calculate SGPA for each student - ensure 2 decimal places
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
  
  // Top performers - Get top 6 instead of 5
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
    
    return [
      index + 1,
      subject,
      "", // Subject name (empty)
      "", // Faculty name (empty)
      "", // Department (empty)
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
    
    return `
      <tr>
        <td style="width: 5%;">${index + 1}</td>
        <td style="width: 12%;">${subject}</td>
        <td style="width: 20%;"></td>
        <td style="width: 20%;"></td>
        <td style="width: 8%;"></td>
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
  
  // Format SGPA values to always have 2 decimal places
  const topSgpaRows = analysis.topPerformers
    .slice(0, 3)
    .map((student, index) => `
      <tr>
        <td>${index + 1}</td>
        <td>${student.id}</td>
        <td>${student.sgpa.toFixed(2)}</td>
      </tr>
    `).join('');
  
  // Format CGPA values to always have 2 decimal places
  let topCgpaRows = '';
  if (analysis.cgpaAnalysis && analysis.cgpaAnalysis.studentCGPAs) {
    topCgpaRows = analysis.cgpaAnalysis.studentCGPAs
      .sort((a, b) => b.cgpa - a.cgpa)
      .slice(0, 3)
      .map((student, index) => `
        <tr>
          <td>${index + 1}</td>
          <td>${student.id}</td>
          <td>${student.cgpa.toFixed(2)}</td>
        </tr>
      `).join('');
  } else {
    // If no CGPA, use SGPA data
    topCgpaRows = topSgpaRows;
  }
  
  // Add file processing information if multiple files were used
  let fileInfoContent = '';
  if (analysis.fileCount && analysis.fileCount > 1 && analysis.filesProcessed) {
    const fileRows = analysis.filesProcessed.map(fileName => {
      const fileRecordCount = records.filter(record => record.fileSource === fileName).length;
      const semester = records.find(record => record.fileSource === fileName)?.SEM || 'Unknown';
      const avgSGPA = analysis.fileWiseAnalysis?.[fileName]?.averageSGPA.toFixed(2) || 'N/A';
      return `
        <tr>
          <td>${fileName}</td>
          <td>${fileRecordCount}</td>
          <td>${semester}</td>
          <td>${avgSGPA}</td>
        </tr>
      `;
    }).join('');
    
    fileInfoContent = `
      <h2 style="margin-top: 20px; margin-bottom: 10px; color: #1d4ed8; text-align: center;">Files Processed</h2>
      <table border="1" cellpadding="5" cellspacing="0" style="width: 90%; margin: 0 auto; border-collapse: collapse; margin-bottom: 20px;">
        <thead>
          <tr style="background-color: #f3f4f6;">
            <th>File Name</th>
            <th>Record Count</th>
            <th>Semester</th>
            <th>Average SGPA</th>
          </tr>
        </thead>
        <tbody>
          ${fileRows}
        </tbody>
      </table>
    `;
  }
  
  // CGPA analysis section if multiple files - ensure 2 decimal places
  let cgpaContent = '';
  if (analysis.fileCount && analysis.fileCount > 1 && analysis.cgpaAnalysis) {
    cgpaContent = `
      <h2 style="margin-top: 20px; margin-bottom: 10px; color: #1d4ed8; text-align: center;">CGPA Analysis</h2>
      <table border="1" cellpadding="5" cellspacing="0" style="width: 90%; margin: 0 auto; border-collapse: collapse; margin-bottom: 20px;">
        <tr>
          <td style="width: 30%;"><strong>Average CGPA:</strong></td>
          <td>${analysis.cgpaAnalysis.averageCGPA.toFixed(2)}</td>
        </tr>
        <tr>
          <td><strong>Highest CGPA:</strong></td>
          <td>${analysis.cgpaAnalysis.highestCGPA.toFixed(2)}</td>
        </tr>
        <tr>
          <td><strong>Lowest CGPA:</strong></td>
          <td>${analysis.cgpaAnalysis.lowestCGPA.toFixed(2)}</td>
        </tr>
      </table>
    `;
  }
  
  // Create the Word document HTML content with wider scales and center alignment
  let htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Result Analysis Report</title>
      <style>
        /* Reset styles */
        body, h1, h2, h3, p, table {
          margin: 0;
          padding: 0;
        }
        
        body {
          font-family: 'Times New Roman', Times, serif;
          font-size: 12pt;
          line-height: 1.3;
          margin: 2cm;
          text-align: center;
        }
        
        h1 {
          font-size: 16pt;
          text-align: center;
          margin-bottom: 0.5cm;
        }
        
        h2 {
          font-size: 14pt;
          margin-top: 0.8cm;
          margin-bottom: 0.3cm;
          text-align: center;
        }
        
        table {
          width: 90%;
          border-collapse: collapse;
          margin-bottom: 0.5cm;
          page-break-inside: avoid;
          margin-left: auto;
          margin-right: auto;
        }
        
        th, td {
          border: 1px solid #000;
          padding: 0.2cm;
          text-align: center;
          font-size: 10pt;
        }
        
        th {
          background-color: #f0f0f0;
          font-weight: bold;
        }
        
        .college-header {
          text-align: center;
          margin-bottom: 1cm;
        }
        
        .section-title {
          font-weight: bold;
          margin-top: 0.5cm;
          margin-bottom: 0.2cm;
          text-align: center;
        }
        
        .signatures {
          display: flex;
          justify-content: space-between;
          margin-top: 2cm;
          width: 90%;
          margin-left: auto;
          margin-right: auto;
        }
        
        .signature {
          text-align: center;
          width: 30%;
        }
        
        .signature-line {
          margin-top: 1cm;
          border-top: 1px solid #000;
        }
        
        /* Wider scale for tables */
        .wide-table {
          width: 90%;
          table-layout: fixed;
          margin-left: auto;
          margin-right: auto;
        }
        
        /* Ensure proper page breaks */
        .page-break {
          page-break-before: always;
        }
      </style>
    </head>
    <body>
      <div class="college-header">
        <h1>K. S. Rangasamy College of Technology, Tiruchengode - 637 215</h1>
        <p style="text-align: center; margin-bottom: 10px;">(Autonomous)</p>
        <p style="text-align: center; margin-bottom: 10px;">Computer Science and Engineering</p>
        <table style="width: 90%; margin: 0 auto; border: none;">
          <tr style="border: none;">
            <td style="border: none; text-align: left; width: 33%;">Batch: 2023-2027</td>
            <td style="border: none; text-align: center; width: 34%;">Year / Sem: II/III</td>
            <td style="border: none; text-align: right; width: 33%;">Section: A&B</td>
          </tr>
        </table>
      </div>
      
      <h2 style="text-align: center; margin: 20px 0;">End Semester Result Analysis</h2>
      
      <table class="wide-table" border="1" cellpadding="3" cellspacing="0">
        <thead>
          <tr>
            <th rowspan="2" style="width: 5%;">S. No</th>
            <th rowspan="2" style="width: 12%;">Subject code</th>
            <th rowspan="2" style="width: 18%;">Subject name</th>
            <th rowspan="2" style="width: 18%;">Faculty name</th>
            <th rowspan="2" style="width: 8%;">Dept</th>
            <th colspan="5" style="width: 25%;">No. of students</th>
            <th rowspan="2" style="width: 7%;">% of pass</th>
            <th colspan="2" style="width: 16%;">Highest Grade</th>
          </tr>
          <tr>
            <th style="width: 5%;">App</th>
            <th style="width: 5%;">Absent</th>
            <th style="width: 5%;">Fail</th>
            <th style="width: 5%;">WH</th>
            <th style="width: 5%;">Passed</th>
            <th style="width: 8%;">Obtained</th>
            <th style="width: 8%;">No. of students</th>
          </tr>
        </thead>
        <tbody>
          ${subjectAnalysisRows}
        </tbody>
      </table>
      
      <h2 style="text-align: center; margin: 20px 0;">Classification</h2>
      
      <table class="wide-table" border="1" cellpadding="3" cellspacing="0">
        <tr>
          <th colspan="7" style="width: 50%;">Current semester</th>
          <th colspan="7" style="width: 50%;">Upto this semester</th>
        </tr>
        <tr>
          <th rowspan="2" style="width: 8%;">Distinction</th>
          <th colspan="2" style="width: 16%;">First class</th>
          <th colspan="2" style="width: 16%;">Second class</th>
          <th rowspan="2" style="width: 5%;">Fail</th>
          <th rowspan="2" style="width: 5%;">% of pass</th>
          <th rowspan="2" style="width: 8%;">Distinction</th>
          <th colspan="2" style="width: 16%;">First class</th>
          <th colspan="2" style="width: 16%;">Second class</th>
          <th rowspan="2" style="width: 5%;">Fail</th>
          <th rowspan="2" style="width: 5%;">% of pass</th>
        </tr>
        <tr>
          <th style="width: 8%;">WOA</th>
          <th style="width: 8%;">WA</th>
          <th style="width: 8%;">WOA</th>
          <th style="width: 8%;">WA</th>
          <th style="width: 8%;">WOA</th>
          <th style="width: 8%;">WA</th>
          <th style="width: 8%;">WOA</th>
          <th style="width: 8%;">WA</th>
        </tr>
        <tr>
          <td>40</td>
          <td>65</td>
          <td>3</td>
          <td>5</td>
          <td>16</td>
          <td>18</td>
          <td>71.6</td>
          <td>25</td>
          <td>62</td>
          <td>2</td>
          <td>22</td>
          <td>18</td>
          <td>20</td>
          <td>64.5</td>
        </tr>
      </table>
      
      <h2 style="text-align: center; margin: 20px 0;">First Three Rank Position</h2>
      
      <table class="wide-table" border="1" cellpadding="3" cellspacing="0">
        <tr>
          <th colspan="3" style="width: 50%;">Rank in this semester</th>
          <th colspan="3" style="width: 50%;">Rank up to this semester</th>
        </tr>
        <tr>
          <th style="width: 8%;">S.No</th>
          <th style="width: 34%;">Name of the student</th>
          <th style="width: 8%;">SGPA</th>
          <th style="width: 8%;">S.No</th>
          <th style="width: 34%;">Name of the student</th>
          <th style="width: 8%;">CGPA</th>
        </tr>
        ${topSgpaRows}
        ${topCgpaRows}
        <tr>
          <th colspan="3">Category</th>
          <th colspan="3">Grade Point</th>
        </tr>
        <tr>
          <td colspan="3">1. Distinction</td>
          <td colspan="3">>= 8.5 and no history of arrears</td>
        </tr>
        <tr>
          <td colspan="3">2. First class</td>
          <td colspan="3">>= 6.5</td>
        </tr>
        <tr>
          <td colspan="3">3. Second class</td>
          <td colspan="3">< 6.5</td>
        </tr>
      </table>
      
      ${fileInfoContent}
      
      ${cgpaContent}
      
      <div class="signatures">
        <div class="signature">
          <p>Class Advisor</p>
          <div class="signature-line"></div>
          <p>HoD/CSE</p>
        </div>
        
        <div class="signature">
          <p>Dean - Academics</p>
          <div class="signature-line"></div>
        </div>
        
        <div class="signature">
          <p>Principal</p>
          <div class="signature-line"></div>
        </div>
      </div>
    </body>
    </html>
  `;
  
  return htmlContent;
};

// Download PNG chart
export const downloadChartAsPng = (elementId: string, fileName: string): void => {
  try {
    const element = document.getElementById(elementId);
    if (!element) {
      console.error('Element not found:', elementId);
      return;
    }
    
    // @ts-ignore - html2canvas is imported as an external script
    html2canvas(element).then((canvas: HTMLCanvasElement) => {
      const link = document.createElement('a');
      link.download = `${fileName}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    });
  } catch (error) {
    console.error('Error generating PNG:', error);
  }
};

/**
 * Download PDF Report - Improved to better capture the full page
 */
export const downloadPdfReport = async (elementId: string): Promise<boolean> => {
  try {
    // Use html2canvas to capture the element as an image
    const element = document.getElementById(elementId);
    if (!element) {
      console.error('Element not found:', elementId);
      return false;
    }
    
    // Create a clone of the element to avoid modifying the original
    const clonedElement = element.cloneNode(true) as HTMLElement;
    
    // Apply styles to the clone for better rendering
    clonedElement.style.width = element.scrollWidth + 'px';
    clonedElement.style.backgroundColor = '#ffffff';
    clonedElement.style.position = 'absolute';
    clonedElement.style.top = '-9999px';
    clonedElement.style.left = '-9999px';
    document.body.appendChild(clonedElement);
    
    // Set a slightly higher scale for better quality
    // @ts-ignore - html2canvas is imported as an external script
    const canvas = await html2canvas(clonedElement, {
      scale: 1.5,
      useCORS: true,
      allowTaint: true,
      backgroundColor: "#ffffff",
      logging: false,
      width: clonedElement.scrollWidth,
      height: clonedElement.scrollHeight,
      x: 0,
      y: 0,
      windowWidth: document.documentElement.offsetWidth,
      windowHeight: document.documentElement.offsetHeight
    });
    
    // Clean up the DOM
    document.body.removeChild(clonedElement);
    
    // Create a new PDF document matching the aspect ratio of the captured element
    const imgData = canvas.toDataURL('image/png');
    const pdf = new JsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });
    
    // Calculate dimensions to fit PDF page
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();
    const imgWidth = canvas.width;
    const imgHeight = canvas.height;
    
    // Calculate scaling factor to fit in PDF while maintaining aspect ratio
    const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight);
    const scaledWidth = imgWidth * ratio;
    const scaledHeight = imgHeight * ratio;
    
    // Calculate how many pages we need
    const totalPages = Math.ceil(imgHeight * ratio / pdfHeight);
    
    // Add each portion of the image to a new page
    let remainingHeight = imgHeight;
    let currentY = 0;
    
    for (let page = 0; page < totalPages; page++) {
      // Add a new page after the first one
      if (page > 0) {
        pdf.addPage();
      }
      
      // Calculate the height for this page (remaining or full page)
      const segmentHeight = Math.min(pdfHeight / ratio, remainingHeight);
      
      // Add this segment of the image to the PDF
      pdf.addImage(
        imgData,
        'PNG',
        0,
        -currentY * ratio,
        pdfWidth,
        imgHeight * ratio,
        undefined,
        'FAST'
      );
      
      // Update for next page
      currentY += pdfHeight / ratio;
      remainingHeight -= segmentHeight;
    }
    
    // Save the PDF
    pdf.save('result-analysis-report.pdf');
    return true;
  } catch (error) {
    console.error('Error generating PDF:', error);
    return false;
  }
};

/**
 * Download Word Report
 */
export const downloadWordReport = (analysis: ResultAnalysis, records: StudentRecord[]): void => {
  const htmlContent = generateWordReport(analysis, records);
  
  // Create a Blob from the HTML content
  const blob = new Blob([htmlContent], { type: 'application/msword' });
  
  // Create download link
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = 'result-analysis-report.doc';
  
  // Trigger download
  document.body.appendChild(link);
  link.click();
  
  // Clean up
  document.body.removeChild(link);
  URL.revokeObjectURL(link.href);
};

/**
 * Download CSV Report
 */
export const downloadCSVReport = (analysis: ResultAnalysis, records: StudentRecord[]): void => {
  // Create CSV content
  let csvContent = "data:text/csv;charset=utf-8,";
  
  // Add headers
  csvContent += "Registration Number,SGPA,Status\n";
  
  // Add data for each student
  analysis.studentSgpaDetails?.forEach(student => {
    const status = student.hasArrears ? 'Has Arrears' : (student.sgpa < 6.5 ? 'SGPA below 6.5' : 'Good Standing');
    csvContent += `${student.id},${student.sgpa.toFixed(2)},${status}\n`;
  });
  
  // Create download link
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  link.setAttribute("download", "result-analysis-report.csv");
  
  // Trigger download
  document.body.appendChild(link);
  link.click();
  
  // Clean up
  document.body.removeChild(link);
};
