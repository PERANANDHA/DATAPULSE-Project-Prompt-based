
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
  topPerformers: { id: string; name?: string; cgpa: string; grade: string }[];
  needsImprovement: { id: string; name?: string; cgpa: string; subjects: string }[];
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
  'B': '#f97316',
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
  
  // Calculate pass/fail rates
  const passGrades = ['O', 'A+', 'A', 'B+', 'B', 'C'];
  const failGrades = ['U', 'WH'];
  
  const passCount = records.filter(record => passGrades.includes(record.GR)).length;
  const failCount = records.filter(record => failGrades.includes(record.GR)).length;
  
  const totalGrades = passCount + failCount;
  const passPercentage = totalGrades > 0 ? Math.round((passCount / totalGrades) * 100) : 0;
  const failPercentage = totalGrades > 0 ? Math.round((failCount / totalGrades) * 100) : 0;
  
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
    const passPercentage = totalSubjectStudents > 0 ? Math.round((subjectPassCount / totalSubjectStudents) * 100) : 0;
    const failPercentage = totalSubjectStudents > 0 ? Math.round((subjectFailCount / totalSubjectStudents) * 100) : 0;
    
    return {
      subject,
      pass: passPercentage,
      fail: failPercentage
    };
  });
  
  // Calculate CGPA for each student
  const studentCGPAs = uniqueStudents.map(studentId => {
    const studentRecords = records.filter(record => record.REGNO === studentId);
    const totalPoints = studentRecords.reduce((sum, record) => sum + record.gradePoint, 0);
    const cgpa = studentRecords.length > 0 ? (totalPoints / studentRecords.length).toFixed(2) : "0.00";
    
    // Count failed subjects for this student
    const failedSubjects = studentRecords
      .filter(record => failGrades.includes(record.GR))
      .map(record => record.SCODE);
    
    return {
      id: studentId,
      cgpa,
      failedSubjects
    };
  });
  
  // Sort by CGPA to get top performers and those needing improvement
  const sortedStudents = [...studentCGPAs].sort((a, b) => parseFloat(b.cgpa) - parseFloat(a.cgpa));
  
  // Top 5 performers
  const topPerformers = sortedStudents
    .slice(0, 5)
    .map(student => {
      const highestGradeRecord = records.find(record => 
        record.REGNO === student.id && ['O', 'A+'].includes(record.GR)
      );
      
      return {
        id: student.id,
        cgpa: student.cgpa,
        grade: highestGradeRecord?.GR || 'A'
      };
    });
  
  // Bottom 5 performers (needs improvement)
  const needsImprovement = sortedStudents
    .slice(-5)
    .reverse()
    .map(student => {
      const failedSubjectsStr = student.failedSubjects.join(', ');
      
      return {
        id: student.id,
        cgpa: student.cgpa,
        subjects: failedSubjectsStr || 'Overall performance'
      };
    });
  
  // Calculate other metrics
  const cgpaValues = studentCGPAs.map(s => parseFloat(s.cgpa)).filter(cgpa => !isNaN(cgpa));
  const averageCGPA = cgpaValues.length > 0 
    ? (cgpaValues.reduce((sum, cgpa) => sum + cgpa, 0) / cgpaValues.length).toFixed(2)
    : "0.00";
  
  const highestSGPA = cgpaValues.length > 0 ? Math.max(...cgpaValues).toFixed(2) : "0.00";
  const lowestSGPA = cgpaValues.length > 0 ? Math.min(...cgpaValues).toFixed(2) : "0.00";
  
  return {
    gradeDistribution,
    passFailData,
    subjectPerformance,
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
  
  // Subject performance
  csvContent += "SUBJECT PERFORMANCE\n";
  csvContent += "Subject Code,Pass %,Fail %\n";
  analysis.subjectPerformance.forEach(subject => {
    csvContent += `${subject.subject},${subject.pass}%,${subject.fail}%\n`;
  });
  csvContent += "\n";
  
  // Top performers
  csvContent += "TOP PERFORMERS\n";
  csvContent += "Registration Number,CGPA,Highest Grade\n";
  analysis.topPerformers.forEach(student => {
    csvContent += `${student.id},${student.cgpa},${student.grade}\n`;
  });
  csvContent += "\n";
  
  // Needs improvement
  csvContent += "NEEDS IMPROVEMENT\n";
  csvContent += "Registration Number,CGPA,Failed Subjects\n";
  analysis.needsImprovement.forEach(student => {
    csvContent += `${student.id},${student.cgpa},${student.subjects}\n`;
  });
  csvContent += "\n";
  
  // Student details
  csvContent += "STUDENT DETAILS\n";
  csvContent += "Registration Number,CGPA,Failed Subjects\n";
  
  // Calculate CGPA and failed subjects for each student
  uniqueStudents.forEach(studentId => {
    const studentRecords = records.filter(record => record.REGNO === studentId);
    const totalPoints = studentRecords.reduce((sum, record) => sum + record.gradePoint, 0);
    const cgpa = studentRecords.length > 0 ? (totalPoints / studentRecords.length).toFixed(2) : "0.00";
    
    const failedSubjects = studentRecords
      .filter(record => ['U', 'WH'].includes(record.GR))
      .map(record => record.SCODE)
      .join(', ');
    
    csvContent += `${studentId},${cgpa},${failedSubjects || 'None'}\n`;
  });
  
  return csvContent;
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
