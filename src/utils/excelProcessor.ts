
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

export const calculateSGPA = (records: StudentRecord[], studentId: string): number => {
  const studentRecords = records.filter(record => record.REGNO === studentId);
  let totalCredits = 0;
  let weightedSum = 0;

  studentRecords.forEach(record => {
    const gradePoint = gradePointMap[record.GR];
    const creditValue = record.creditValue || 0;

    weightedSum += gradePoint * creditValue;
    totalCredits += creditValue;
  });

  return totalCredits === 0 ? 0 : weightedSum / totalCredits;
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
      const gradePoint = gradePointMap[record.GR];
      const creditValue = record.creditValue || 0;
      
      semWeightedSum += gradePoint * creditValue;
      semCredits += creditValue;
    });
    
    // Add to overall totals
    totalWeightedSum += semWeightedSum;
    totalCredits += semCredits;
  });
  
  return totalCredits === 0 ? 0 : totalWeightedSum / totalCredits;
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
    
    const avgSGPA = fileStudentCount > 0 ? totalSGPA / fileStudentCount : 0;
    
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
      averageCGPA: cgpaValues.reduce((sum, cgpa) => sum + cgpa, 0) / cgpaValues.length,
      highestCGPA: Math.max(...cgpaValues),
      lowestCGPA: Math.min(...cgpaValues),
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
  
  const averageCGPA = studentSgpaDetails.reduce((sum, student) => sum + student.sgpa, 0) / totalStudents;
  const highestSGPA = Math.max(...studentSgpaDetails.map(student => student.sgpa));
  const lowestSGPA = Math.min(...studentSgpaDetails.map(student => student.sgpa));
  
  // Grade distribution
  const gradeDistribution: { [grade: string]: number } = {};
  records.forEach(record => {
    gradeDistribution[record.GR] = (gradeDistribution[record.GR] || 0) + 1;
  });
  
  const gradeDistributionData = Object.entries(gradeDistribution).map(([grade, count]) => ({
    name: grade,
    count: count,
    fill: getGradeColor(grade),
  }));
  
  const totalGrades = records.length;
  
  // Subject-wise performance
  const subjectPerformanceMap: { [subject: string]: { pass: number; fail: number; total: number } } = {};
  records.forEach(record => {
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
    pass: (data.pass / data.total) * 100,
    fail: (data.fail / data.total) * 100,
  }));
  
  // Top performers
  const topPerformers = studentSgpaDetails
    .sort((a, b) => b.sgpa - a.sgpa)
    .slice(0, 5)
    .map(student => {
      const studentRecords = records.filter(record => record.REGNO === student.id);
      const bestGrade = studentRecords.sort((a, b) => gradePointMap[b.GR] - gradePointMap[a.GR])[0].GR;
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
  const passCount = records.filter(record => record.GR !== 'U').length;
  const failCount = totalGrades - passCount;
  const passPercentage = (passCount / totalGrades) * 100;
  const failPercentage = (failCount / totalGrades) * 100;
  
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
      gradeCounts[record.GR] = (gradeCounts[record.GR] || 0) + 1;
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
  
  // Performance Summary Data
  const performanceData = [
    ["Total Students", analysis.totalStudents],
    ["Average CGPA", analysis.averageCGPA.toFixed(4)],
    ["Highest SGPA", analysis.highestSGPA.toFixed(4)],
    ["Lowest SGPA", analysis.lowestSGPA.toFixed(4)],
  ];

  // Add file information if multiple files
  if (analysis.fileCount && analysis.fileCount > 1 && analysis.filesProcessed) {
    performanceData.push(["Number of Files Processed", analysis.fileCount]);
    
    // Add individual file analysis
    if (analysis.fileWiseAnalysis) {
      Object.entries(analysis.fileWiseAnalysis).forEach(([fileName, fileData]) => {
        performanceData.push([`${fileName} Average SGPA`, fileData.averageSGPA.toFixed(4)]);
        performanceData.push([`${fileName} Students`, fileData.students]);
        if (fileData.semesterName) {
          performanceData.push([`${fileName} Semester`, fileData.semesterName]);
        }
      });
    }
    
    // Add CGPA data if available
    if (analysis.cgpaAnalysis) {
      performanceData.push(["Average CGPA", analysis.cgpaAnalysis.averageCGPA.toFixed(4)]);
      performanceData.push(["Highest CGPA", analysis.cgpaAnalysis.highestCGPA.toFixed(4)]);
      performanceData.push(["Lowest CGPA", analysis.cgpaAnalysis.lowestCGPA.toFixed(4)]);
    }
  }

  // Grade Distribution Data
  const gradeDistributionHeader = ["Grade", "Count", "Percentage"];
  const gradeDistributionData = analysis.gradeDistribution.map(grade => [
    grade.name,
    grade.count,
    ((grade.count / analysis.totalGrades) * 100).toFixed(2) + "%"
  ]);

  // Subject-wise Performance Data
  const subjectPerformanceHeader = ["Subject Code", "Pass %", "Fail %"];
  const subjectPerformanceData = analysis.subjectPerformance.map(subject => [
    subject.subject,
    subject.pass.toFixed(2) + "%",
    subject.fail.toFixed(2) + "%"
  ]);

  // Top Performers Data
  const topPerformersHeader = ["Registration Number", "SGPA", "Grade"];
  const topPerformersData = analysis.topPerformers.map(student => [
    student.id,
    student.sgpa.toFixed(4),
    student.grade
  ]);

  // Students Needing Improvement Data
  const needsImprovementHeader = ["Registration Number", "SGPA", "Issue"];
  const needsImprovementData = analysis.needsImprovement.map(student => [
    student.id,
    student.sgpa.toFixed(4),
    student.subjects ? 'Has Arrears' : 'SGPA below 6.5'
  ]);

  // Student-wise SGPA Details Data
  const studentSgpaDetailsHeader = ["Registration Number", "SGPA", "Status"];
  const studentSgpaDetailsData = analysis.studentSgpaDetails?.map(student => [
    student.id,
    student.sgpa.toFixed(4),
    student.hasArrears ? 'Has Arrears' : (student.sgpa < 6.5 ? 'SGPA below 6.5' : 'Good Standing')
  ]) || [];
  
  // CGPA details if available
  let cgpaDetailsData: any[][] = [];
  if (analysis.cgpaAnalysis && analysis.cgpaAnalysis.studentCGPAs) {
    cgpaDetailsData = analysis.cgpaAnalysis.studentCGPAs.map(student => [
      student.id,
      student.cgpa.toFixed(4)
    ]);
  }

  // Add sheets for each analysis
  addSheet(performanceData, "Performance Summary", ["Metric", "Value"]);
  addSheet(gradeDistributionData, "Grade Distribution", gradeDistributionHeader);
  addSheet(subjectPerformanceData, "Subject Performance", subjectPerformanceHeader);
  addSheet(topPerformersData, "Top Performers", topPerformersHeader);
  addSheet(needsImprovementData, "Needs Improvement", needsImprovementHeader);
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
  
  // Add file processing information if multiple files were used
  let fileInfoContent = '';
  if (analysis.fileCount && analysis.fileCount > 1 && analysis.filesProcessed) {
    fileInfoContent = `
      <div class="summary-card">
        <h2>Files Processed</h2>
        <p><strong>Number of Files:</strong> ${analysis.fileCount}</p>
        <table class="result-table">
          <thead>
            <tr>
              <th>File Name</th>
              <th>Record Count</th>
              <th>Semester</th>
              <th>Average SGPA</th>
            </tr>
          </thead>
          <tbody>
            ${analysis.filesProcessed.map(fileName => {
              const fileRecordCount = records.filter(record => record.fileSource === fileName).length;
              const semester = records.find(record => record.fileSource === fileName)?.SEM || 'Unknown';
              const avgSGPA = analysis.fileWiseAnalysis?.[fileName]?.averageSGPA.toFixed(4) || 'N/A';
              return `
                <tr>
                  <td>${fileName}</td>
                  <td>${fileRecordCount}</td>
                  <td>${semester}</td>
                  <td>${avgSGPA}</td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
      </div>
    `;
  }
  
  // CGPA analysis section if multiple files
  let cgpaContent = '';
  if (analysis.fileCount && analysis.fileCount > 1 && analysis.cgpaAnalysis) {
    cgpaContent = `
      <div class="summary-card">
        <h2>CGPA Analysis</h2>
        <p><strong>Average CGPA:</strong> ${analysis.cgpaAnalysis.averageCGPA.toFixed(4)}</p>
        <p><strong>Highest CGPA:</strong> ${analysis.cgpaAnalysis.highestCGPA.toFixed(4)}</p>
        <p><strong>Lowest CGPA:</strong> ${analysis.cgpaAnalysis.lowestCGPA.toFixed(4)}</p>
        
        <h3>Student CGPA Details</h3>
        <table class="result-table">
          <thead>
            <tr>
              <th>Registration Number</th>
              <th>CGPA</th>
            </tr>
          </thead>
          <tbody>
            ${analysis.cgpaAnalysis.studentCGPAs.map(student => `
              <tr>
                <td>${student.id}</td>
                <td>${student.cgpa.toFixed(4)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;
  }
  
  // Insert file information after the performance summary in the HTML
  let htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Result Analysis Report</title>
      <style>
        @page {
          size: A4;
          margin: 2cm;
        }
        body {
          font-family: Arial, sans-serif;
          font-size: 12pt;
          line-height: 1.5;
          margin: 0;
          padding: 0;
        }
        h1 {
          text-align: center;
          color: #2563eb;
          font-size: 24pt;
          margin-bottom: 20pt;
        }
        h2 {
          color: #1d4ed8;
          font-size: 18pt;
          margin-top: 20pt;
          margin-bottom: 10pt;
          border-bottom: 1pt solid #e5e7eb;
          padding-bottom: 5pt;
        }
        h3 {
          color: #1d4ed8;
          font-size: 14pt;
          margin-top: 15pt;
          margin-bottom: 5pt;
        }
        .result-table {
          width: 100%;
          border-collapse: collapse;
          margin: 15pt 0;
          font-size: 10pt;
        }
        .result-table th, .result-table td {
          border: 1pt solid #d1d5db;
          padding: 8pt;
          text-align: left;
        }
        .result-table th {
          background-color: #f3f4f6;
          font-weight: bold;
        }
        .college-header {
          text-align: center;
          margin-bottom: 30pt;
        }
        .college-name {
          font-size: 20pt;
          font-weight: bold;
          margin-bottom: 5pt;
        }
        .department {
          font-size: 16pt;
          margin-bottom: 5pt;
        }
        .batch {
          font-size: 14pt;
        }
        .summary-card {
          border: 1pt solid #e5e7eb;
          border-radius: 8pt;
          padding: 15pt;
          margin-bottom: 20pt;
        }
        .footer {
          margin-top: 40pt;
          text-align: center;
          font-size: 10pt;
          color: #6b7280;
        }
      </style>
    </head>
    <body>
      <div class="college-header">
        <div class="college-name">Result Analysis Report</div>
        <div class="department">Academic Performance Summary</div>
        <div class="batch">Generated on ${new Date().toLocaleDateString()}</div>
      </div>
      
      <h1>Result Analysis Report</h1>
      
      <div class="summary-card">
        <h2>Performance Summary</h2>
        <p><strong>Total Students:</strong> ${analysis.totalStudents}</p>
        <p><strong>Average SGPA:</strong> ${analysis.averageCGPA.toFixed(4)}</p>
        <p><strong>Highest SGPA:</strong> ${analysis.highestSGPA.toFixed(4)}</p>
        <p><strong>Lowest SGPA:</strong> ${analysis.lowestSGPA.toFixed(4)}</p>
      </div>
      
      ${fileInfoContent}
      
      ${cgpaContent}
      
      <h2>Grade Distribution</h2>
      <table class="result-table">
        <thead>
          <tr>
            <th>Grade</th>
            <th>Count</th>
            <th>Percentage</th>
          </tr>
        </thead>
        <tbody>
          ${analysis.gradeDistribution.map(grade => `
            <tr>
              <td>${grade.name}</td>
              <td>${grade.count}</td>
              <td>${((grade.count / analysis.totalGrades) * 100).toFixed(2)}%</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
      
      <h2>Subject-wise Performance</h2>
      <table class="result-table">
        <thead>
          <tr>
            <th>Subject Code</th>
            <th>Pass %</th>
            <th>Fail %</th>
          </tr>
        </thead>
        <tbody>
          ${analysis.subjectPerformance.map(subject => `
            <tr>
              <td>${subject.subject}</td>
              <td>${subject.pass.toFixed(2)}%</td>
              <td>${subject.fail.toFixed(2)}%</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
      
      <h2>Top Performers</h2>
      <table class="result-table">
        <thead>
          <tr>
            <th>Registration Number</th>
            <th>SGPA</th>
            <th>Grade</th>
          </tr>
        </thead>
        <tbody>
          ${analysis.topPerformers.map(student => `
            <tr>
              <td>${student.id}</td>
              <td>${student.sgpa.toFixed(4)}</td>
              <td>${student.grade}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
      
      <h2>Students Needing Improvement</h2>
      <table class="result-table">
        <thead>
          <tr>
            <th>Registration Number</th>
            <th>SGPA</th>
            <th>Issue</th>
          </tr>
        </thead>
        <tbody>
          ${analysis.needsImprovement.map(student => `
            <tr>
              <td>${student.id}</td>
              <td>${student.sgpa.toFixed(4)}</td>
              <td>${student.subjects ? 'Has Arrears' : 'SGPA below 6.5'}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
      
      <h2>Student-wise SGPA Details</h2>
      <table class="result-table">
        <thead>
          <tr>
            <th>Registration Number</th>
            <th>SGPA</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          ${analysis.studentSgpaDetails?.map(student => `
            <tr>
              <td>${student.id}</td>
              <td>${student.sgpa.toFixed(4)}</td>
              <td>${student.hasArrears ? 'Has Arrears' : (student.sgpa < 6.5 ? 'SGPA below 6.5' : 'Good Standing')}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
      
      <div class="footer">
        <p>This report was generated automatically by ResultAnalyzer.</p>
      </div>
    </body>
    </html>
  `;
  
  return htmlContent;
};

// Download PNG chart
export const downloadChartAsPng = (elementId: string, fileName: string): void => {
  const element = document.getElementById(elementId);
  if (!element) {
    console.error('Element not found:', elementId);
    return;
  }
  
  // Use html2canvas library (needs to be added)
  // @ts-ignore - html2canvas is loaded as global
  if (typeof html2canvas !== 'undefined') {
    // @ts-ignore
    html2canvas(element).then((canvas: HTMLCanvasElement) => {
      const link = document.createElement('a');
      link.download = `${fileName}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    });
  } else {
    console.error('html2canvas library not loaded');
  }
};

/**
 * Download PDF Report
 */
export const downloadPdfReport = async (elementId: string): Promise<boolean> => {
  try {
    // Create a new PDF document
    const pdf = new JsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });
    
    // Get the element to be converted to PDF
    const element = document.getElementById(elementId);
    if (!element) {
      console.error('Element not found:', elementId);
      return false;
    }
    
    // Extract data from the element
    const title = "Result Analysis Report";
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(16);
    pdf.text(title, pdf.internal.pageSize.getWidth() / 2, 20, { align: 'center' });
    
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(10);
    pdf.text(`Generated on ${new Date().toLocaleDateString()}`, pdf.internal.pageSize.getWidth() / 2, 28, { align: 'center' });
    
    // Use autoTable to create tables from data
    // This part is very dependent on your actual UI structure
    // This is a simplified approach
    
    pdf.setFontSize(12);
    let yPos = 40;
    
    // Performance Summary
    pdf.setFont("helvetica", "bold");
    pdf.text("Performance Summary", 14, yPos);
    yPos += 10;
    
    // Find the performance summary elements
    const summaryItems = element.querySelectorAll('.flex.justify-between.items-center');
    if (summaryItems && summaryItems.length > 0) {
      const summaryData = Array.from(summaryItems).map(item => {
        const label = item.querySelector('.text-sm')?.textContent || '';
        const value = item.querySelector('.text-lg')?.textContent || '';
        return [label, value];
      });
      
      if (summaryData.length > 0) {
        // @ts-ignore - jspdf-autotable types may not be properly recognized
        pdf.autoTable({
          startY: yPos,
          head: [['Metric', 'Value']],
          body: summaryData,
          theme: 'grid',
          styles: { fontSize: 9 },
          headStyles: { fillColor: [41, 128, 185] }
        });
        
        // @ts-ignore - get the end Y position for the next section
        yPos = pdf.autoTable.previous.finalY + 10;
      }
    }
    
    // Grade Distribution
    pdf.setFont("helvetica", "bold");
    pdf.text("Grade Distribution", 14, yPos);
    yPos += 10;
    
    // Find grade distribution data
    // This is highly specific to your UI structure
    // You'll need to adapt this to your actual DOM structure
    
    // Top Performers
    pdf.setFont("helvetica", "bold");
    pdf.text("Top Performers", 14, yPos);
    yPos += 10;
    
    // Add more sections as needed...
    
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
    csvContent += `${student.id},${student.sgpa.toFixed(4)},${status}\n`;
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
