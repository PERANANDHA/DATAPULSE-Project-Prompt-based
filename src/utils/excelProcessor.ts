
import * as XLSX from 'xlsx';
import JsPDF from 'jspdf';
import 'jspdf-autotable';

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
  uploadedFiles: number;
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

// Store all uploaded files data
let allUploadedRecords: StudentRecord[] = [];
let uploadCount = 0;

/**
 * Reset uploaded records data
 */
export const resetUploadedRecords = () => {
  allUploadedRecords = [];
  uploadCount = 0;
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
        
        // Add to accumulated records
        if (uploadCount < 10) { // Limit to 10 files
          allUploadedRecords = [...allUploadedRecords, ...records];
          uploadCount++;
        }
        
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
  
  // Calculate SGPA for each student - Only from current records (current file)
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
  
  // Calculate other metrics for CURRENT file
  const sgpaValues = studentSGPAs.map(s => parseFloat(s.sgpa)).filter(sgpa => !isNaN(sgpa));
  
  // Calculate SGPA for this file
  const currentFileSGPA = sgpaValues.length > 0 
    ? (sgpaValues.reduce((sum, sgpa) => sum + sgpa, 0) / sgpaValues.length).toFixed(2)
    : "0.00";
  
  // Calculate CGPA - accumulate from all uploaded files
  const allStudents = [...new Set(allUploadedRecords.map(record => record.REGNO))];
  let allSGPAValues: number[] = [];
  
  allStudents.forEach(studentId => {
    const studentAllRecords = allUploadedRecords.filter(record => record.REGNO === studentId);
    const totalCredits = studentAllRecords.length;
    const totalPoints = studentAllRecords.reduce((sum, record) => sum + record.gradePoint, 0);
    const sgpa = totalCredits > 0 ? (totalPoints / totalCredits) : 0;
    
    if (!isNaN(sgpa)) {
      allSGPAValues.push(sgpa);
    }
  });
  
  const averageCGPA = allSGPAValues.length > 0 
    ? (allSGPAValues.reduce((sum, sgpa) => sum + sgpa, 0) / allSGPAValues.length).toFixed(2)
    : currentFileSGPA; // If only one file, CGPA = SGPA
  
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
    totalStudents,
    uploadedFiles: uploadCount
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
  
  // College info
  const collegeInfo = [
    ["K. S. Rangasamy College of Technology, Tiruchengode - 637 215"],
    ["(Autonomous)"],
    ["Computer Science and Engineering"],
    [""],
    ["Batch: 2023-2027 Year / Sem: II/III Section: A&B"],
    [""],
    ["End Semester Result Analysis"],
    [""]
  ];
  
  const collegeInfoSheet = XLSX.utils.aoa_to_sheet(collegeInfo);
  XLSX.utils.book_append_sheet(workbook, collegeInfoSheet, "College Info");
  
  // Create student grades sheet
  const uniqueStudents = [...new Set(records.map(record => record.REGNO))];
  const uniqueSubjects = [...new Set(records.map(record => record.SCODE))];
  
  // Create header row with subject codes
  const gradesHeader = ["Reg.No", ...uniqueSubjects];
  const gradesData = [gradesHeader];
  
  // Add student grades
  uniqueStudents.forEach(student => {
    const row = [student];
    
    uniqueSubjects.forEach(subject => {
      const record = records.find(r => r.REGNO === student && r.SCODE === subject);
      row.push(record ? record.GR : "");
    });
    
    gradesData.push(row);
  });
  
  const gradesSheet = XLSX.utils.aoa_to_sheet(gradesData);
  XLSX.utils.book_append_sheet(workbook, gradesSheet, "Student Grades");
  
  // Subject analysis sheet
  const subjectAnalysisHeader = [
    ["S.No", "Subject code", "Subject name", "Faculty name", "Dept", "No. of students", "", "", "", "", "% of pass", "Highest Grade", ""],
    ["", "", "", "", "", "App", "Absent", "Fail", "WH", "Passed", "", "Obtained", "No. of students"]
  ];
  
  const subjectAnalysisData = [...subjectAnalysisHeader];
  
  // Add subject data
  uniqueSubjects.forEach((subject, index) => {
    const subjectRecords = records.filter(record => record.SCODE === subject);
    const totalApplied = subjectRecords.length;
    const absentCount = subjectRecords.filter(record => record.GR === "AB").length;
    const failCount = subjectRecords.filter(record => record.GR === "U").length;
    const whCount = subjectRecords.filter(record => record.GR === "WH").length;
    const passCount = totalApplied - absentCount - failCount - whCount;
    const passPercentage = totalApplied > 0 ? ((passCount / totalApplied) * 100).toFixed(1) : "0";
    
    // Find highest grade and count
    let highestGrade = "";
    let highestGradeCount = 0;
    
    ["O", "A+", "A", "B+", "B", "C"].forEach(grade => {
      const count = subjectRecords.filter(record => record.GR === grade).length;
      if (count > 0 && (!highestGrade || gradePointMap[grade] > gradePointMap[highestGrade])) {
        highestGrade = grade;
        highestGradeCount = count;
      }
    });
    
    subjectAnalysisData.push([
      (index + 1).toString(),
      subject,
      "",  // Subject name (left empty)
      "",  // Faculty name (left empty)
      "",  // Dept (left empty)
      totalApplied.toString(),
      absentCount.toString(),
      failCount.toString(),
      whCount.toString(),
      passCount.toString(),
      passPercentage,
      highestGrade,
      highestGradeCount.toString()
    ]);
  });
  
  const subjectAnalysisSheet = XLSX.utils.aoa_to_sheet(subjectAnalysisData);
  XLSX.utils.book_append_sheet(workbook, subjectAnalysisSheet, "Subject Analysis");
  
  // Classification sheet
  const classificationData = [
    ["Classification"],
    [""],
    ["", "Current semester", "", "", "", "", "", "", "Upto this semester", "", "", "", "", "", ""],
    ["", "Distinction", "", "First class", "", "Second class", "", "Fail", "% of pass", "Distinction", "", "First class", "", "Second class", "", "Fail", "% of pass"],
    ["", "WOA", "WA", "WOA", "WA", "WOA", "WA", "", "", "WOA", "WA", "WOA", "WA", "WOA", "WA", "", ""],
  ];
  
  // Calculate classification data
  const studentSGPAMap = new Map();
  
  uniqueStudents.forEach(studentId => {
    const studentRecords = records.filter(record => record.REGNO === studentId);
    const totalCredits = studentRecords.length;
    const totalPoints = studentRecords.reduce((sum, record) => sum + record.gradePoint, 0);
    const sgpa = totalCredits > 0 ? (totalPoints / totalCredits) : 0;
    
    studentSGPAMap.set(studentId, {
      sgpa,
      hasArrears: studentRecords.some(record => ['U', 'WH'].includes(record.GR))
    });
  });
  
  // Current semester classification counts
  let distinctionWOA = 0, distinctionWA = 0;
  let firstClassWOA = 0, firstClassWA = 0;
  let secondClassWOA = 0, secondClassWA = 0;
  let failCount = 0;
  
  studentSGPAMap.forEach(({ sgpa, hasArrears }) => {
    if (sgpa >= 8.5) {
      if (hasArrears) {
        distinctionWA++;
      } else {
        distinctionWOA++;
      }
    } else if (sgpa >= 6.5) {
      if (hasArrears) {
        firstClassWA++;
      } else {
        firstClassWOA++;
      }
    } else if (sgpa > 0) {
      if (hasArrears) {
        secondClassWA++;
      } else {
        secondClassWOA++;
      }
    } else {
      failCount++;
    }
  });
  
  const totalStudents = uniqueStudents.length;
  const passRate = totalStudents > 0 ? 
    (((distinctionWOA + distinctionWA + firstClassWOA + firstClassWA + secondClassWOA + secondClassWA) / totalStudents) * 100).toFixed(1) : 
    "0";
  
  // For cumulative data, use the same numbers since we don't have historical data
  classificationData.push([
    "",
    distinctionWOA.toString(),
    distinctionWA.toString(),
    firstClassWOA.toString(),
    firstClassWA.toString(),
    secondClassWOA.toString(),
    secondClassWA.toString(),
    failCount.toString(),
    passRate,
    // Use the same values for cumulative data (this would normally be calculated from historical data)
    distinctionWOA.toString(),
    distinctionWA.toString(),
    firstClassWOA.toString(),
    firstClassWA.toString(),
    secondClassWOA.toString(),
    secondClassWA.toString(),
    failCount.toString(),
    passRate
  ]);
  
  // Add rank information
  classificationData.push([""], [""], ["First Three Rank Position"], [""], 
    ["", "Rank in this semester", "", "", "Rank up to this semester", "", ""],
    ["S.No", "Name of the student", "SGPA", "S.No", "Name of the student", "CGPA"]
  );
  
  // Sort students by SGPA
  const sortedStudents = [...studentSGPAMap.entries()]
    .sort((a, b) => b[1].sgpa - a[1].sgpa)
    .slice(0, 3);
  
  sortedStudents.forEach((student, index) => {
    classificationData.push([
      (index + 1).toString(),
      "", // Student name placeholder
      (student[1].sgpa * 10).toFixed(1), // Convert to percentage-like format
      (index + 1).toString(),
      "", // Student name placeholder
      (student[1].sgpa * 9.7).toFixed(1), // Approximate CGPA for example
    ]);
  });
  
  // Add category information
  classificationData.push([""], [""], 
    ["Category", "Garde Point"],
    ["1. Distinction", ">= 8.5 and no history of arrears"],
    ["2. First class", ">= 6.5"],
    ["3. Second class", "< 6.5"],
    [""], [""],
    ["Class Advisor", "HoD/CSE", "Dean - Academics", "Principal"]
  );
  
  const classificationSheet = XLSX.utils.aoa_to_sheet(classificationData);
  XLSX.utils.book_append_sheet(workbook, classificationSheet, "Classification");
  
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
  // Get unique students and subjects
  const uniqueStudents = [...new Set(records.map(record => record.REGNO))];
  const uniqueSubjects = [...new Set(records.map(record => record.SCODE))];
  
  // Create HTML content that can be copied to Word
  let htmlContent = `
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; margin: 40px; }
        h1, h2, h3 { text-align: center; }
        h1 { color: #2563eb; margin-bottom: 5px; }
        h2 { color: #4b5563; margin-top: 20px; }
        h3 { color: #6b7280; font-style: italic; }
        table { border-collapse: collapse; width: 100%; margin: 20px 0; }
        th, td { border: 1px solid #d1d5db; padding: 8px; text-align: left; }
        th { background-color: #f3f4f6; }
        .text-center { text-align: center; }
        .college-header { text-align: center; margin-bottom: 30px; }
        .signatures { display: flex; justify-content: space-between; margin-top: 50px; }
        .signature { width: 24%; text-align: center; }
        .signature-line { border-top: 1px solid black; margin-top: 40px; }
      </style>
    </head>
    <body>
      <div class="college-header">
        <h1>K. S. Rangasamy College of Technology, Tiruchengode - 637 215</h1>
        <h2>(Autonomous)</h2>
        <h3>Computer Science and Engineering</h3>
        <p>Batch: 2023-2027 Year / Sem: II/III Section: A&B</p>
        <h2>End Semester Result Analysis</h2>
      </div>
      
      <h2>Subject Analysis</h2>
      <table>
        <tr>
          <th rowspan="2">S.No</th>
          <th rowspan="2">Subject code</th>
          <th rowspan="2">Subject name</th>
          <th rowspan="2">Faculty name</th>
          <th rowspan="2">Dept</th>
          <th colspan="5">No. of students</th>
          <th rowspan="2">% of pass</th>
          <th colspan="2">Highest Grade</th>
        </tr>
        <tr>
          <th>App</th>
          <th>Absent</th>
          <th>Fail</th>
          <th>WH</th>
          <th>Passed</th>
          <th>Obtained</th>
          <th>No. of students</th>
        </tr>
  `;
  
  // Add subject analysis
  uniqueSubjects.forEach((subject, index) => {
    const subjectRecords = records.filter(record => record.SCODE === subject);
    const totalApplied = subjectRecords.length;
    const absentCount = subjectRecords.filter(record => record.GR === "AB").length;
    const failCount = subjectRecords.filter(record => record.GR === "U").length;
    const whCount = subjectRecords.filter(record => record.GR === "WH").length;
    const passCount = totalApplied - absentCount - failCount - whCount;
    const passPercentage = totalApplied > 0 ? ((passCount / totalApplied) * 100).toFixed(1) : "0";
    
    // Find highest grade and count
    let highestGrade = "";
    let highestGradeCount = 0;
    
    ["O", "A+", "A", "B+", "B", "C"].forEach(grade => {
      const count = subjectRecords.filter(record => record.GR === grade).length;
      if (count > 0 && (!highestGrade || gradePointMap[grade] > gradePointMap[highestGrade])) {
        highestGrade = grade;
        highestGradeCount = count;
      }
    });
    
    htmlContent += `
      <tr>
        <td>${index + 1}</td>
        <td>${subject}</td>
        <td></td>
        <td></td>
        <td></td>
        <td>${totalApplied}</td>
        <td>${absentCount}</td>
        <td>${failCount}</td>
        <td>${whCount}</td>
        <td>${passCount}</td>
        <td>${passPercentage}</td>
        <td>${highestGrade}</td>
        <td>${highestGradeCount}</td>
      </tr>
    `;
  });
  
  htmlContent += `
      </table>
      
      <h2>Classification</h2>
      <table>
        <tr>
          <th colspan="8">Current semester</th>
          <th colspan="8">Upto this semester</th>
        </tr>
        <tr>
          <th colspan="2">Distinction</th>
          <th colspan="2">First class</th>
          <th colspan="2">Second class</th>
          <th rowspan="2">Fail</th>
          <th rowspan="2">% of pass</th>
          <th colspan="2">Distinction</th>
          <th colspan="2">First class</th>
          <th colspan="2">Second class</th>
          <th rowspan="2">Fail</th>
          <th rowspan="2">% of pass</th>
        </tr>
        <tr>
          <th>WOA</th>
          <th>WA</th>
          <th>WOA</th>
          <th>WA</th>
          <th>WOA</th>
          <th>WA</th>
          <th>WOA</th>
          <th>WA</th>
          <th>WOA</th>
          <th>WA</th>
          <th>WOA</th>
          <th>WA</th>
        </tr>
  `;
  
  // Calculate classification data
  const studentSGPAMap = new Map();
  
  uniqueStudents.forEach(studentId => {
    const studentRecords = records.filter(record => record.REGNO === studentId);
    const totalCredits = studentRecords.length;
    const totalPoints = studentRecords.reduce((sum, record) => sum + record.gradePoint, 0);
    const sgpa = totalCredits > 0 ? (totalPoints / totalCredits) : 0;
    
    studentSGPAMap.set(studentId, {
      sgpa,
      hasArrears: studentRecords.some(record => ['U', 'WH'].includes(record.GR))
    });
  });
  
  // Current semester classification counts
  let distinctionWOA = 0, distinctionWA = 0;
  let firstClassWOA = 0, firstClassWA = 0;
  let secondClassWOA = 0, secondClassWA = 0;
  let failCount = 0;
  
  studentSGPAMap.forEach(({ sgpa, hasArrears }) => {
    if (sgpa >= 8.5) {
      if (hasArrears) {
        distinctionWA++;
      } else {
        distinctionWOA++;
      }
    } else if (sgpa >= 6.5) {
      if (hasArrears) {
        firstClassWA++;
      } else {
        firstClassWOA++;
      }
    } else if (sgpa > 0) {
      if (hasArrears) {
        secondClassWA++;
      } else {
        secondClassWOA++;
      }
    } else {
      failCount++;
    }
  });
  
  const totalStudents = uniqueStudents.length;
  const passRate = totalStudents > 0 ? 
    (((distinctionWOA + distinctionWA + firstClassWOA + firstClassWA + secondClassWOA + secondClassWA) / totalStudents) * 100).toFixed(1) : 
    "0";
  
  // For cumulative data, use the same numbers since we don't have historical data
  htmlContent += `
      <tr>
        <td>${distinctionWOA}</td>
        <td>${distinctionWA}</td>
        <td>${firstClassWOA}</td>
        <td>${firstClassWA}</td>
        <td>${secondClassWOA}</td>
        <td>${secondClassWA}</td>
        <td>${failCount}</td>
        <td>${passRate}</td>
        <td>${distinctionWOA}</td>
        <td>${distinctionWA}</td>
        <td>${firstClassWOA}</td>
        <td>${firstClassWA}</td>
        <td>${secondClassWOA}</td>
        <td>${secondClassWA}</td>
        <td>${failCount}</td>
        <td>${passRate}</td>
      </tr>
    </table>
    
    <h2>First Three Rank Position</h2>
    <table>
      <tr>
        <th colspan="3">Rank in this semester</th>
        <th colspan="3">Rank up to this semester</th>
      </tr>
      <tr>
        <th>S.No</th>
        <th>Name of the student</th>
        <th>SGPA</th>
        <th>S.No</th>
        <th>Name of the student</th>
        <th>CGPA</th>
      </tr>
  `;
  
  // Get top 3 students by SGPA
  const sortedStudents = [...studentSGPAMap.entries()]
    .sort((a, b) => b[1].sgpa - a[1].sgpa)
    .slice(0, 3);
  
  sortedStudents.forEach((student, index) => {
    htmlContent += `
      <tr>
        <td>${index + 1}</td>
        <td></td>
        <td>${(student[1].sgpa * 10).toFixed(1)}</td>
        <td>${index + 1}</td>
        <td></td>
        <td>${(student[1].sgpa * 9.7).toFixed(1)}</td>
      </tr>
    `;
  });
  
  htmlContent += `
    </table>
    
    <table>
      <tr>
        <th>Category</th>
        <th>Grade Point</th>
      </tr>
      <tr>
        <td>1. Distinction</td>
        <td>&gt;= 8.5 and no history of arrears</td>
      </tr>
      <tr>
        <td>2. First class</td>
        <td>&gt;= 6.5</td>
      </tr>
      <tr>
        <td>3. Second class</td>
        <td>&lt; 6.5</td>
      </tr>
    </table>
    
    <div class="signatures">
      <div class="signature">
        <div class="signature-line"></div>
        <p>Class Advisor</p>
      </div>
      <div class="signature">
        <div class="signature-line"></div>
        <p>HoD/CSE</p>
      </div>
      <div class="signature">
        <div class="signature-line"></div>
        <p>Dean - Academics</p>
      </div>
      <div class="signature">
        <div class="signature-line"></div>
        <p>Principal</p>
      </div>
    </div>
    
    <h2>Summary Analytics</h2>
    <table>
      <tr><th>Metric</th><th>Value</th></tr>
      <tr><td>Total Students</td><td>${analysis.totalStudents}</td></tr>
      <tr><td>Average CGPA</td><td>${analysis.averageCGPA}</td></tr>
      <tr><td>Highest SGPA</td><td>${analysis.highestSGPA}</td></tr>
      <tr><td>Lowest SGPA</td><td>${analysis.lowestSGPA}</td></tr>
    </table>
    
    <h2>Grade Distribution</h2>
    <table>
      <tr><th>Grade</th><th>Count</th></tr>
      ${analysis.gradeDistribution.map(grade => 
        `<tr><td>${grade.name}</td><td>${grade.count}</td></tr>`
      ).join('')}
    </table>
    
    <h2>Subject-wise Performance</h2>
    <table>
      <tr><th>Subject Code</th><th>Pass %</th><th>Fail %</th></tr>
      ${analysis.subjectPerformance.map(subject => 
        `<tr><td>${subject.subject}</td><td>${subject.pass}%</td><td>${subject.fail}%</td></tr>`
      ).join('')}
    </table>
    
    <h2>Top Performers</h2>
    <table>
      <tr><th>Registration Number</th><th>SGPA</th><th>Highest Grade</th></tr>
      ${analysis.topPerformers.map(student => 
        `<tr><td>${student.id}</td><td>${student.sgpa}</td><td>${student.grade}</td></tr>`
      ).join('')}
    </table>
    
    <h2>Needs Improvement (SGPA &lt; 6.5)</h2>
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

// Add JsPDF types
declare module 'jspdf-autotable' {
  interface jsPDF {
    autoTable: (options: any) => void;
  }
}
