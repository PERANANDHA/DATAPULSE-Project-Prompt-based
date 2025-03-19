
import * as XLSX from 'xlsx';

// Define grade point mapping as specified
const gradePointMap: Record<string, number> = {
  'O': 10,
  'A+': 9,
  'A': 8,
  'B+': 7,
  'B': 6,
  'C': 5,
  'U': 0,
  'WH': 0
};

// Interfaces for the Excel data structure
export interface StudentRecord {
  CNo: string;       // Department code
  SEM: string;       // Semester
  REGNO: string;     // Registration Number
  SCODE: string;     // Subject Code
  GR: string;        // Grade
  gradePoint: number; // Calculated grade point
}

export interface ResultAnalysis {
  gradeDistribution: { name: string; count: number; fill: string }[];
  passFailData: { name: string; value: number; fill: string }[];
  subjectPerformance: { subject: string; pass: number; fail: number }[];
  subjectGradeDistribution: Record<string, { name: string; count: number; fill: string }[]>;
  topPerformers: { id: string; name?: string; sgpa: string; grade: string }[];
  needsImprovement: { id: string; name?: string; sgpa: string; subjects: string }[];
  averageCGPA: string;
  highestSGPA: string;
  lowestSGPA: string;
  totalStudents: number;
}

// Color map for visualization
const gradeColors: Record<string, string> = {
  'O': '#0ea5e9',
  'A+': '#22c55e',
  'A': '#84cc16',
  'B+': '#eab308',
  'B': '#6b7280',
  'C': '#8b5cf6',
  'U': '#ef4444',
  'WH': '#6b7280'
};

/**
 * Parses an Excel file and returns structured student records
 */
export const parseExcelFile = async (file: File): Promise<StudentRecord[]> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        
        // Convert to JSON with header row
        const jsonData = XLSX.utils.sheet_to_json<any>(worksheet);
        
        // Map and normalize the data
        const records: StudentRecord[] = jsonData.map(row => ({
          CNo: String(row.CNo || ''),
          SEM: String(row.SEM || ''),
          REGNO: String(row.REGNO || ''),
          SCODE: String(row.SCODE || ''),
          GR: String(row.GR || ''),
          gradePoint: gradePointMap[row.GR] || 0
        }));
        
        resolve(records);
      } catch (error) {
        console.error('Error parsing Excel file:', error);
        reject(new Error('Failed to parse Excel file. Please ensure it has the correct format.'));
      }
    };
    
    reader.onerror = () => {
      reject(new Error('Error reading the file.'));
    };
    
    reader.readAsBinaryString(file);
  });
};

/**
 * Analyze student records and generate result analysis
 */
export const analyzeResults = (records: StudentRecord[]): ResultAnalysis => {
  // Get unique students by registration number
  const uniqueStudents = [...new Set(records.map(record => record.REGNO))];
  const totalStudents = uniqueStudents.length;
  
  // Get unique subjects
  const uniqueSubjects = [...new Set(records.map(record => record.SCODE))];
  
  // Calculate grade distribution
  const grades = ['O', 'A+', 'A', 'B+', 'B', 'C', 'U', 'WH'];
  const gradeDistribution = grades.map(grade => {
    const count = records.filter(record => record.GR === grade).length;
    return { 
      name: grade, 
      count, 
      fill: gradeColors[grade] 
    };
  }).filter(item => item.count > 0); // Only include grades that exist in the data
  
  // Calculate subject-wise grade distribution
  const subjectGradeDistribution: Record<string, { name: string; count: number; fill: string }[]> = {};
  
  uniqueSubjects.forEach(subject => {
    const subjectRecords = records.filter(record => record.SCODE === subject);
    
    subjectGradeDistribution[subject] = grades.map(grade => {
      const count = subjectRecords.filter(record => record.GR === grade).length;
      return { name: grade, count, fill: gradeColors[grade] };
    }).filter(item => item.count > 0); // Only include grades that exist
  });
  
  // Calculate pass/fail rates
  const passGrades = ['O', 'A+', 'A', 'B+', 'B', 'C'];
  const failGrades = ['U', 'WH'];
  
  const passCount = records.filter(record => passGrades.includes(record.GR)).length;
  const failCount = records.filter(record => failGrades.includes(record.GR)).length;
  
  const totalGrades = passCount + failCount;
  const passPercentage = totalGrades > 0 ? Math.floor((passCount / totalGrades) * 100) : 0;
  const failPercentage = totalGrades > 0 ? Math.ceil((failCount / totalGrades) * 100) : 0;
  
  const passFailData = [
    { name: 'Pass', value: passPercentage, fill: '#22c55e' },
    { name: 'Fail', value: failPercentage, fill: '#ef4444' }
  ];
  
  // Calculate subject-wise performance
  const subjectPerformance = uniqueSubjects.map(subject => {
    const subjectRecords = records.filter(record => record.SCODE === subject);
    const subjectPassCount = subjectRecords.filter(record => passGrades.includes(record.GR)).length;
    const subjectFailCount = subjectRecords.filter(record => failGrades.includes(record.GR)).length;
    
    const totalSubjectStudents = subjectPassCount + subjectFailCount;
    const passPercentage = totalSubjectStudents > 0 ? Math.floor((subjectPassCount / totalSubjectStudents) * 100) : 0;
    const failPercentage = totalSubjectStudents > 0 ? Math.ceil((subjectFailCount / totalSubjectStudents) * 100) : 0;
    
    return {
      subject,
      pass: passPercentage,
      fail: failPercentage
    };
  });
  
  // Calculate SGPA for each student
  const studentSGPAs = uniqueStudents.map(studentId => {
    const studentRecords = records.filter(record => record.REGNO === studentId);
    const totalCredits = studentRecords.length; // Assuming each subject has 1 credit for simplicity
    const totalPoints = studentRecords.reduce((sum, record) => sum + record.gradePoint, 0);
    const sgpa = totalCredits > 0 ? (totalPoints / totalCredits) : 0;
    
    // Count failed subjects for this student
    const failedSubjects = studentRecords
      .filter(record => failGrades.includes(record.GR))
      .map(record => record.SCODE);
    
    return {
      id: studentId,
      sgpa: sgpa.toFixed(2),
      failedSubjects
    };
  });
  
  // Sort by SGPA to get top performers and those needing improvement
  const sortedStudents = [...studentSGPAs].sort((a, b) => parseFloat(b.sgpa) - parseFloat(a.sgpa));
  
  // Top 5 performers
  const topPerformers = sortedStudents
    .slice(0, 5)
    .map(student => {
      const highestGradeRecord = records.find(record => 
        record.REGNO === student.id && ['O', 'A+'].includes(record.GR)
      );
      
      return {
        id: student.id,
        sgpa: student.sgpa,
        grade: highestGradeRecord?.GR || 'A'
      };
    });
  
  // Students needing improvement (SGPA below 6.5)
  const needsImprovement = sortedStudents
    .filter(student => parseFloat(student.sgpa) < 6.5)
    .slice(0, 5)
    .map(student => {
      const failedSubjectsStr = student.failedSubjects.join(', ');
      
      return {
        id: student.id,
        sgpa: student.sgpa,
        subjects: failedSubjectsStr || 'Overall performance'
      };
    });
  
  // Calculate other metrics
  const sgpaValues = studentSGPAs.map(s => parseFloat(s.sgpa)).filter(sgpa => !isNaN(sgpa));
  
  // Calculate CGPA as average of all SGPAs (in a real app this would be more complex)
  const averageCGPA = sgpaValues.length > 0 
    ? (sgpaValues.reduce((sum, sgpa) => sum + sgpa, 0) / sgpaValues.length).toFixed(2)
    : "0.00";
  
  const highestSGPA = sgpaValues.length > 0 ? Math.max(...sgpaValues).toFixed(2) : "0.00";
  const lowestSGPA = sgpaValues.length > 0 ? Math.min(...sgpaValues).toFixed(2) : "0.00";
  
  return {
    gradeDistribution,
    passFailData,
    subjectPerformance,
    subjectGradeDistribution,
    topPerformers,
    needsImprovement,
    averageCGPA,
    highestSGPA,
    lowestSGPA,
    totalStudents
  };
};

/**
 * Generate a downloadable report in CSV format
 */
export const generateReportCSV = (analysis: ResultAnalysis, records: StudentRecord[]): string => {
  // Get unique registration numbers
  const uniqueStudents = [...new Set(records.map(record => record.REGNO))];
  
  // Get unique subjects
  const uniqueSubjects = [...new Set(records.map(record => record.SCODE))];
  
  // Create CSV content
  let csvContent = "Result Analysis Report\n\n";
  
  // Summary section
  csvContent += "SUMMARY\n";
  csvContent += `Total Students,${analysis.totalStudents}\n`;
  csvContent += `Average CGPA,${analysis.averageCGPA}\n`;
  csvContent += `Highest SGPA,${analysis.highestSGPA}\n`;
  csvContent += `Lowest SGPA,${analysis.lowestSGPA}\n\n`;
  
  // Grade distribution
  csvContent += "GRADE DISTRIBUTION\n";
  csvContent += "Grade,Count\n";
  analysis.gradeDistribution.forEach(grade => {
    csvContent += `${grade.name},${grade.count}\n`;
  });
  csvContent += "\n";
  
  // Subject-wise grade distribution
  csvContent += "SUBJECT-WISE GRADE DISTRIBUTION\n";
  Object.keys(analysis.subjectGradeDistribution).forEach(subject => {
    csvContent += `${subject}\n`;
    csvContent += "Grade,Count\n";
    analysis.subjectGradeDistribution[subject].forEach(grade => {
      csvContent += `${grade.name},${grade.count}\n`;
    });
    csvContent += "\n";
  });
  
  // Subject performance
  csvContent += "SUBJECT PERFORMANCE\n";
  csvContent += "Subject Code,Pass %,Fail %\n";
  analysis.subjectPerformance.forEach(subject => {
    csvContent += `${subject.subject},${subject.pass}%,${subject.fail}%\n`;
  });
  csvContent += "\n";
  
  // Top performers
  csvContent += "TOP PERFORMERS\n";
  csvContent += "Registration Number,SGPA,Highest Grade\n";
  analysis.topPerformers.forEach(student => {
    csvContent += `${student.id},${student.sgpa},${student.grade}\n`;
  });
  csvContent += "\n";
  
  // Needs improvement
  csvContent += "NEEDS IMPROVEMENT (SGPA < 6.5)\n";
  csvContent += "Registration Number,SGPA,Failed Subjects\n";
  analysis.needsImprovement.forEach(student => {
    csvContent += `${student.id},${student.sgpa},${student.subjects}\n`;
  });
  csvContent += "\n";
  
  // Student details
  csvContent += "STUDENT DETAILS\n";
  csvContent += "Registration Number,SGPA,Failed Subjects\n";
  
  // Calculate SGPA and failed subjects for each student
  uniqueStudents.forEach(studentId => {
    const studentRecords = records.filter(record => record.REGNO === studentId);
    const totalCredits = studentRecords.length; // Assuming each subject has 1 credit
    const totalPoints = studentRecords.reduce((sum, record) => sum + record.gradePoint, 0);
    const sgpa = totalCredits > 0 ? (totalPoints / totalCredits).toFixed(2) : "0.00";
    
    const failedSubjects = studentRecords
      .filter(record => ['U', 'WH'].includes(record.GR))
      .map(record => record.SCODE)
      .join(', ');
    
    csvContent += `${studentId},${sgpa},${failedSubjects || 'None'}\n`;
  });
  
  return csvContent;
};

/**
 * Generate a downloadable report in Excel format
 */
export const generateExcelReport = (analysis: ResultAnalysis, records: StudentRecord[]): Blob => {
  const workbook = XLSX.utils.book_new();
  
  // Summary worksheet
  const summaryData = [
    ["Result Analysis Summary"],
    [],
    ["Total Students", analysis.totalStudents],
    ["Average CGPA", analysis.averageCGPA],
    ["Highest SGPA", analysis.highestSGPA],
    ["Lowest SGPA", analysis.lowestSGPA],
    []
  ];
  
  // Grade distribution
  summaryData.push(["Grade Distribution"]);
  summaryData.push(["Grade", "Count"]);
  analysis.gradeDistribution.forEach(grade => {
    summaryData.push([grade.name, grade.count]);
  });
  summaryData.push([]);
  
  // Pass/Fail data
  summaryData.push(["Pass/Fail Rate"]);
  summaryData.push(["Result", "Percentage"]);
  analysis.passFailData.forEach(data => {
    summaryData.push([data.name, `${data.value}%`]);
  });
  summaryData.push([]);
  
  // Subject performance
  summaryData.push(["Subject Performance"]);
  summaryData.push(["Subject Code", "Pass %", "Fail %"]);
  analysis.subjectPerformance.forEach(subject => {
    summaryData.push([subject.subject, subject.pass, subject.fail]);
  });
  
  const summaryWorksheet = XLSX.utils.aoa_to_sheet(summaryData);
  XLSX.utils.book_append_sheet(workbook, summaryWorksheet, "Summary");
  
  // Subject-wise grade distribution
  const subjectGradeData: any[][] = [["Subject-wise Grade Distribution"]];
  
  Object.keys(analysis.subjectGradeDistribution).forEach(subject => {
    subjectGradeData.push([]);
    subjectGradeData.push([subject]);
    subjectGradeData.push(["Grade", "Count"]);
    analysis.subjectGradeDistribution[subject].forEach(grade => {
      subjectGradeData.push([grade.name, grade.count]);
    });
  });
  
  const subjectGradeWorksheet = XLSX.utils.aoa_to_sheet(subjectGradeData);
  XLSX.utils.book_append_sheet(workbook, subjectGradeWorksheet, "Subject Grades");
  
  // Student details
  const uniqueStudents = [...new Set(records.map(record => record.REGNO))];
  const studentDetailsData: any[][] = [
    ["Student Performance Details"],
    [],
    ["Registration Number", "SGPA", "Failed Subjects"]
  ];
  
  uniqueStudents.forEach(studentId => {
    const studentRecords = records.filter(record => record.REGNO === studentId);
    const totalCredits = studentRecords.length;
    const totalPoints = studentRecords.reduce((sum, record) => sum + record.gradePoint, 0);
    const sgpa = totalCredits > 0 ? (totalPoints / totalCredits).toFixed(2) : "0.00";
    
    const failedSubjects = studentRecords
      .filter(record => ['U', 'WH'].includes(record.GR))
      .map(record => record.SCODE)
      .join(', ');
    
    studentDetailsData.push([studentId, sgpa, failedSubjects || 'None']);
  });
  
  const studentDetailsWorksheet = XLSX.utils.aoa_to_sheet(studentDetailsData);
  XLSX.utils.book_append_sheet(workbook, studentDetailsWorksheet, "Student Details");
  
  // Top performers and improvement needed
  const performanceData: any[][] = [
    ["Performance Highlights"],
    [],
    ["Top Performers"],
    ["Registration Number", "SGPA", "Highest Grade"]
  ];
  
  analysis.topPerformers.forEach(student => {
    performanceData.push([student.id, student.sgpa, student.grade]);
  });
  
  performanceData.push([]);
  performanceData.push(["Needs Improvement (SGPA < 6.5)"]);
  performanceData.push(["Registration Number", "SGPA", "Failed Subjects"]);
  
  analysis.needsImprovement.forEach(student => {
    performanceData.push([student.id, student.sgpa, student.subjects]);
  });
  
  const performanceWorksheet = XLSX.utils.aoa_to_sheet(performanceData);
  XLSX.utils.book_append_sheet(workbook, performanceWorksheet, "Performance Highlights");
  
  // Convert to blob
  const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
  const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  
  return blob;
};

/**
 * Generate a downloadable report in Word (HTML) format
 */
export const generateWordReport = (analysis: ResultAnalysis, records: StudentRecord[]): string => {
  // Create HTML content that can be copied to Word
  let htmlContent = `
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; }
        h1 { color: #2563eb; }
        h2 { color: #4b5563; margin-top: 20px; }
        table { border-collapse: collapse; width: 100%; margin: 10px 0 20px 0; }
        th, td { border: 1px solid #d1d5db; padding: 8px; text-align: left; }
        th { background-color: #f3f4f6; }
      </style>
    </head>
    <body>
      <h1>Result Analysis Report</h1>
      
      <h2>Summary</h2>
      <table>
        <tr><th>Total Students</th><td>${analysis.totalStudents}</td></tr>
        <tr><th>Average CGPA</th><td>${analysis.averageCGPA}</td></tr>
        <tr><th>Highest SGPA</th><td>${analysis.highestSGPA}</td></tr>
        <tr><th>Lowest SGPA</th><td>${analysis.lowestSGPA}</td></tr>
      </table>
      
      <h2>Grade Distribution</h2>
      <table>
        <tr><th>Grade</th><th>Count</th></tr>
        ${analysis.gradeDistribution.map(grade => 
          `<tr><td>${grade.name}</td><td>${grade.count}</td></tr>`
        ).join('')}
      </table>
      
      <h2>Pass/Fail Rate</h2>
      <table>
        <tr><th>Result</th><th>Percentage</th></tr>
        ${analysis.passFailData.map(data => 
          `<tr><td>${data.name}</td><td>${data.value}%</td></tr>`
        ).join('')}
      </table>
      
      <h2>Subject Performance</h2>
      <table>
        <tr><th>Subject Code</th><th>Pass %</th><th>Fail %</th></tr>
        ${analysis.subjectPerformance.map(subject => 
          `<tr><td>${subject.subject}</td><td>${subject.pass}%</td><td>${subject.fail}%</td></tr>`
        ).join('')}
      </table>
  `;
  
  // Add subject-wise grade distribution
  htmlContent += `
      <h2>Subject-wise Grade Distribution</h2>
  `;
  
  Object.keys(analysis.subjectGradeDistribution).forEach(subject => {
    htmlContent += `
      <h3>Subject: ${subject}</h3>
      <table>
        <tr><th>Grade</th><th>Count</th></tr>
        ${analysis.subjectGradeDistribution[subject].map(grade => 
          `<tr><td>${grade.name}</td><td>${grade.count}</td></tr>`
        ).join('')}
      </table>
    `;
  });
  
  // Add top performers
  htmlContent += `
      <h2>Top Performers</h2>
      <table>
        <tr><th>Registration Number</th><th>SGPA</th><th>Highest Grade</th></tr>
        ${analysis.topPerformers.map(student => 
          `<tr><td>${student.id}</td><td>${student.sgpa}</td><td>${student.grade}</td></tr>`
        ).join('')}
      </table>
      
      <h2>Needs Improvement (SGPA < 6.5)</h2>
      <table>
        <tr><th>Registration Number</th><th>SGPA</th><th>Failed Subjects</th></tr>
        ${analysis.needsImprovement.map(student => 
          `<tr><td>${student.id}</td><td>${student.sgpa}</td><td>${student.subjects}</td></tr>`
        ).join('')}
      </table>
    </body>
    </html>
  `;
  
  return htmlContent;
};

/**
 * Download analysis as a CSV file
 */
export const downloadCSVReport = (analysis: ResultAnalysis, records: StudentRecord[]) => {
  const csvContent = generateReportCSV(analysis, records);
  
  // Create a Blob with the CSV content
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  
  // Create a temporary link element and trigger download
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', 'result_analysis_report.csv');
  document.body.appendChild(link);
  link.click();
  
  // Clean up
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

/**
 * Download analysis as an Excel file
 */
export const downloadExcelReport = (analysis: ResultAnalysis, records: StudentRecord[]) => {
  const blob = generateExcelReport(analysis, records);
  const url = URL.createObjectURL(blob);
  
  // Create a temporary link element and trigger download
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', 'result_analysis_report.xlsx');
  document.body.appendChild(link);
  link.click();
  
  // Clean up
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

/**
 * Download analysis as a Word (HTML) file
 */
export const downloadWordReport = (analysis: ResultAnalysis, records: StudentRecord[]) => {
  const htmlContent = generateWordReport(analysis, records);
  
  // Create a Blob with the HTML content
  const blob = new Blob([htmlContent], { type: 'application/msword' });
  const url = URL.createObjectURL(blob);
  
  // Create a temporary link element and trigger download
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', 'result_analysis_report.doc');
  document.body.appendChild(link);
  link.click();
  
  // Clean up
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

/**
 * Capture and download the dashboard as an image
 */
export const captureAndDownloadDashboard = async (elementId: string) => {
  try {
    // This requires the html2canvas library
    // We'll provide a simple implementation that uses browser native screenshot
    const element = document.getElementById(elementId);
    if (!element) {
      throw new Error('Element not found');
    }
    
    alert('To capture this dashboard as an image, please use your browser\'s screenshot functionality (usually by pressing Ctrl+Shift+S or Cmd+Shift+4)');
  } catch (error) {
    console.error('Error capturing dashboard:', error);
  }
};
