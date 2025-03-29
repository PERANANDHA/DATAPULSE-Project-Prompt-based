import JsPDF from 'jspdf';
import 'jspdf-autotable';
import { ResultAnalysis, StudentRecord, gradePointMap } from '../types';
import { calculateSGPA } from '../gradeUtils';

interface PdfReportOptions {
  logoImagePath?: string;
  department?: string;
  departmentFullName?: string;
  calculationMode: 'sgpa' | 'cgpa';
}

export const downloadPdfReport = async (
  analysis: ResultAnalysis, 
  records: StudentRecord[],
  options: PdfReportOptions
): Promise<void> => {
  // Create PDF document in portrait mode, mm units, A4 size
  const doc = new JsPDF('p', 'mm', 'a4');
  await createPdfDocument(doc, analysis, records, options);
  
  // Save the document
  doc.save(options.calculationMode === 'sgpa' 
    ? 'sgpa-analysis-report.pdf' 
    : 'cgpa-analysis-report.pdf');
};

// Legacy function for html2canvas capture (keeping for backward compatibility)
export const captureElementAsPdf = async (elementId: string): Promise<void> => {
  try {
    const element = document.getElementById(elementId);
    
    if (!element) {
      throw new Error(`Element with ID '${elementId}' not found`);
    }
    
    // Create PDF document
    const doc = new JsPDF('p', 'mm', 'a4');
    
    // Add title to PDF
    doc.setFontSize(16);
    doc.text('End Semester Result Analysis', 14, 15);
    
    const elementRect = element.getBoundingClientRect();
    
    // Calculate optimal width and height for the PDF
    const imgWidth = 210 - 20; // A4 width (210mm) minus margins
    const imgHeight = (elementRect.height * imgWidth) / elementRect.width;
    
    // Use HTML2Canvas to capture the DOM content
    const html2canvas = (await import('html2canvas')).default;
    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      logging: false,
    });
    
    // Add the captured content to the PDF
    const imgData = canvas.toDataURL('image/png');
    doc.addImage(imgData, 'PNG', 10, 25, imgWidth, imgHeight);
    
    // Save the PDF
    doc.save('result-analysis-report.pdf');
    
  } catch (error) {
    console.error('Error generating PDF report:', error);
    throw error;
  }
};

const createPdfDocument = async (
  doc: JsPDF,
  analysis: ResultAnalysis, 
  records: StudentRecord[],
  options: PdfReportOptions
): Promise<void> => {
  // Destructure options with defaults
  const { 
    logoImagePath = "/lovable-uploads/e199a42b-b04e-4918-8bb4-48f3583e7928.png",
    department = "CSE",
    departmentFullName = "Computer Science and Engineering",
    calculationMode
  } = options;

  // Define common styles
  const headerStyle = { fontSize: 14, fontStyle: 'bold', halign: 'center' };
  const normalStyle = { fontSize: 10, halign: 'center' };
  const titleStyle = { fontSize: 12, fontStyle: 'bold', halign: 'left', textColor: [46, 49, 146] };
  
  // Add headers
  await addHeaderWithLogo(doc, logoImagePath);

  // Add college information
  let yPos = 40; // Starting Y position after header
  
  // Title: College Information
  doc.setTextColor(46, 49, 146); // RGB for #2E3192
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.text("College Information", 14, yPos);
  yPos += 5;

  // College Information Table
  const collegeInfoData = [
    ["College Name", "K. S. Rangasamy College of Technology"],
    ["Department", departmentFullName],
    ["Total Students", analysis.totalStudents.toString()]
  ];

  // Add file count for CGPA mode
  if (calculationMode === 'cgpa' && analysis.fileCount && analysis.fileCount > 0) {
    collegeInfoData.push(["Files Processed", analysis.fileCount.toString()]);
  }

  // Add calculation mode
  const calculationModeDisplay = calculationMode === 'sgpa' 
    ? "SGPA (Semester Grade Point Average)" 
    : "CGPA (Cumulative Grade Point Average)";
  collegeInfoData.push(["Calculation Mode", calculationModeDisplay]);

  doc.autoTable({
    startY: yPos,
    head: [],
    body: collegeInfoData,
    theme: 'grid',
    styles: { fontSize: 10, cellPadding: 3 },
    columnStyles: {
      0: { fontStyle: 'bold', cellWidth: 50 },
      1: { cellWidth: 100 }
    },
    margin: { left: 14 }
  });

  yPos = (doc as any).lastAutoTable.finalY + 10;

  // Performance Summary
  doc.setTextColor(46, 49, 146);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.text("Performance Summary", 14, yPos);
  yPos += 7;

  // Performance metrics
  doc.setTextColor(0);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);

  let performanceMetrics = [];

  if (calculationMode === 'sgpa') {
    // For SGPA mode
    performanceMetrics = [
      ["Average SGPA:", analysis.averageCGPA.toFixed(2)],
      ["Highest SGPA:", analysis.highestSGPA.toFixed(2)],
      ["Lowest SGPA:", analysis.lowestSGPA.toFixed(2)],
      ["Pass Percentage:", analysis.singleFileClassification.passPercentage.toFixed(2) + "%"]
    ];
  } else {
    // For CGPA mode
    if (analysis.cgpaAnalysis) {
      performanceMetrics = [
        ["Average CGPA:", analysis.cgpaAnalysis.averageCGPA.toFixed(2)],
        ["Highest CGPA:", analysis.cgpaAnalysis.highestCGPA.toFixed(2)],
        ["Lowest CGPA:", analysis.cgpaAnalysis.lowestCGPA.toFixed(2)],
        ["Pass Percentage:", analysis.multipleFileClassification.passPercentage.toFixed(2) + "%"]
      ];
    }
  }

  // Add performance metrics
  performanceMetrics.forEach(metric => {
    doc.setFont("helvetica", "normal");
    doc.text(metric[0], 14, yPos);
    doc.setFont("helvetica", "bold");
    doc.text(metric[1], 50, yPos);
    yPos += 6;
  });
  
  // File Analysis section for CGPA mode
  if (calculationMode === 'cgpa' && analysis.fileWiseAnalysis) {
    yPos += 4;
    doc.setTextColor(46, 49, 146);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.text("File Analysis", 14, yPos);
    yPos += 5;

    // File analysis table headers
    const fileAnalysisHeaders = [["File Name", "Students", "Average SGPA", "Semester", "Note"]];
    
    // File analysis table data
    const fileAnalysisData = [];
    
    if (analysis.filesProcessed && analysis.fileWiseAnalysis) {
      analysis.filesProcessed.forEach(fileName => {
        const fileAnalysis = analysis.fileWiseAnalysis![fileName];
        if (fileAnalysis) {
          const isCurrentSemester = fileName === analysis.currentSemesterFile;
          fileAnalysisData.push([
            fileName,
            fileAnalysis.students.toString(),
            fileAnalysis.averageSGPA.toFixed(2),
            fileAnalysis.semesterName || "",
            isCurrentSemester ? "Current Semester" : "Previous Semester"
          ]);
        }
      });
    }

    // Add file analysis table
    doc.autoTable({
      startY: yPos,
      head: fileAnalysisHeaders,
      body: fileAnalysisData,
      theme: 'grid',
      styles: { fontSize: 9, cellPadding: 2 },
      headStyles: { fillColor: [220, 220, 220], textColor: [0, 0, 0], fontStyle: 'bold' },
      columnStyles: {
        0: { cellWidth: 45 },
        1: { cellWidth: 20 },
        2: { cellWidth: 25 },
        3: { cellWidth: 25 },
        4: { cellWidth: 30 }
      },
      margin: { left: 14 }
    });

    yPos = (doc as any).lastAutoTable.finalY + 10;
  }

  // Determine current semester records for subject analysis
  let currentSemesterRecords = records;
  if (calculationMode === 'cgpa' && analysis.currentSemesterFile) {
    currentSemesterRecords = records.filter(record => 
      record.fileSource === analysis.currentSemesterFile
    );
  }

  // End Semester Result Analysis
  doc.setTextColor(46, 49, 146);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.text("End Semester Result Analysis", 14, yPos);
  yPos += 5;

  // Subject Analysis
  const uniqueSubjects = [...new Set(currentSemesterRecords.map(record => record.SCODE))];
  
  // Prepare subject analysis table data
  const subjectHeaders = [
    ["S.No", "Subject Code", "Subject Name", "Faculty Name", "Dept", "App", "Ab", "Fail", "WH", "Passed", "% of pass", "Highest Grade", "No. of students"]
  ];
  
  const subjectData = uniqueSubjects.map((subject, index) => {
    const subjectRecords = currentSemesterRecords.filter(record => record.SCODE === subject);
    const totalStudents = subjectRecords.length;
    const passedStudents = subjectRecords.filter(record => record.GR !== 'U').length;
    const failedStudents = subjectRecords.filter(record => record.GR === 'U').length;
    const passPercentage = totalStudents > 0 ? (passedStudents / totalStudents) * 100 : 0;
    
    // Find the highest grade
    const grades = subjectRecords.map(record => record.GR);
    const validGrades = grades.filter(grade => grade in gradePointMap);
    const highestGrade = validGrades.length > 0 
      ? validGrades.sort((a, b) => (gradePointMap[b] || 0) - (gradePointMap[a] || 0))[0] 
      : '';
    
    // Count students with highest grade
    const studentsWithHighestGrade = highestGrade 
      ? subjectRecords.filter(record => record.GR === highestGrade).length 
      : 0;
    
    // Get subject name and faculty name
    let subjectName = "";
    let facultyName = "";
    
    const recordWithInfo = subjectRecords.find(record => record.subjectName || record.facultyName);
    if (recordWithInfo) {
      if (recordWithInfo.subjectName) {
        subjectName = recordWithInfo.subjectName;
      }
      if (recordWithInfo.facultyName) {
        facultyName = recordWithInfo.facultyName;
      }
    }
    
    return [
      (index + 1).toString(),
      subject,
      subjectName,
      facultyName,
      department,
      totalStudents.toString(),
      "0",
      failedStudents.toString(),
      "0",
      passedStudents.toString(),
      passPercentage.toFixed(1),
      highestGrade,
      studentsWithHighestGrade.toString()
    ];
  });

  // Add subject analysis table - use a smaller font size to fit all columns
  doc.autoTable({
    startY: yPos,
    head: subjectHeaders,
    body: subjectData,
    theme: 'grid',
    styles: { fontSize: 8, cellPadding: 2 },
    headStyles: { fillColor: [220, 220, 220], textColor: [0, 0, 0], fontStyle: 'bold' },
    columnStyles: {
      0: { cellWidth: 10 },  // S.No
      1: { cellWidth: 20 },  // Subject Code
      2: { cellWidth: 25 },  // Subject Name
      3: { cellWidth: 25 },  // Faculty Name
      4: { cellWidth: 10 },  // Dept
      5: { cellWidth: 10 },  // App
      6: { cellWidth: 10 },  // Ab
      7: { cellWidth: 10 },  // Fail
      8: { cellWidth: 10 },  // WH
      9: { cellWidth: 15 },  // Passed
      10: { cellWidth: 15 }, // % of pass
      11: { cellWidth: 15 }, // Highest Grade
      12: { cellWidth: 15 }  // No. of students
    },
    margin: { left: 10 }
  });

  yPos = (doc as any).lastAutoTable.finalY + 10;

  // Check if we need to add a new page for Classification section
  if (yPos > 230) { // if we're getting close to the bottom of the page
    doc.addPage();
    yPos = 20;
  }

  // Classification Section
  doc.setTextColor(46, 49, 146);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.text("Classification", 14, yPos);
  yPos += 5;

  // Classification Table - Create a complex nested table
  // First row of headers
  const classificationHeaders = [
    [
      { content: 'Current semester', colSpan: 7, styles: headerStyle },
      { content: 'Upto this semester', colSpan: 7, styles: headerStyle }
    ],
    [
      { content: 'Distinction', rowSpan: 2, styles: headerStyle },
      { content: 'First class', colSpan: 2, styles: headerStyle },
      { content: 'Second class', colSpan: 2, styles: headerStyle },
      { content: 'Fail', rowSpan: 2, styles: headerStyle },
      { content: '% of pass', rowSpan: 2, styles: headerStyle },
      { content: 'Distinction', rowSpan: 2, styles: headerStyle },
      { content: 'First class', colSpan: 2, styles: headerStyle },
      { content: 'Second class', colSpan: 2, styles: headerStyle },
      { content: 'Fail', rowSpan: 2, styles: headerStyle },
      { content: '% of pass', rowSpan: 2, styles: headerStyle }
    ],
    [
      // Skip Distinction (handled by rowSpan)
      { content: 'WOA', styles: headerStyle },
      { content: 'WA', styles: headerStyle },
      { content: 'WOA', styles: headerStyle },
      { content: 'WA', styles: headerStyle },
      // Skip Fail (handled by rowSpan)
      // Skip % of pass (handled by rowSpan)
      // Skip Distinction (handled by rowSpan)
      { content: 'WOA', styles: headerStyle },
      { content: 'WA', styles: headerStyle },
      { content: 'WOA', styles: headerStyle },
      { content: 'WA', styles: headerStyle }
      // Skip Fail (handled by rowSpan)
      // Skip % of pass (handled by rowSpan)
    ]
  ];

  // Classification data row
  const classificationData = [
    [
      // Current semester data
      analysis.singleFileClassification.distinction.toString(),
      analysis.singleFileClassification.firstClassWOA.toString(),
      analysis.singleFileClassification.firstClassWA.toString(),
      analysis.singleFileClassification.secondClassWOA.toString(),
      analysis.singleFileClassification.secondClassWA.toString(),
      analysis.singleFileClassification.fail.toString(),
      analysis.singleFileClassification.passPercentage.toFixed(1),
      // Cumulative data
      analysis.multipleFileClassification.distinction.toString(),
      analysis.multipleFileClassification.firstClassWOA.toString(),
      analysis.multipleFileClassification.firstClassWA.toString(),
      analysis.multipleFileClassification.secondClassWOA.toString(),
      analysis.multipleFileClassification.secondClassWA.toString(),
      analysis.multipleFileClassification.fail.toString(),
      analysis.multipleFileClassification.passPercentage.toFixed(1)
    ]
  ];

  // Add the classification table
  doc.autoTable({
    startY: yPos,
    head: classificationHeaders,
    body: classificationData,
    theme: 'grid',
    styles: { fontSize: 8, cellPadding: 2, halign: 'center' },
    columnStyles: {
      0: { cellWidth: 15 },
      1: { cellWidth: 15 },
      2: { cellWidth: 15 },
      3: { cellWidth: 15 },
      4: { cellWidth: 15 },
      5: { cellWidth: 15 },
      6: { cellWidth: 15 },
      7: { cellWidth: 15 },
      8: { cellWidth: 15 },
      9: { cellWidth: 15 },
      10: { cellWidth: 15 },
      11: { cellWidth: 15 },
      12: { cellWidth: 15 },
      13: { cellWidth: 15 }
    },
    margin: { left: 10 }
  });

  yPos = (doc as any).lastAutoTable.finalY + 10;

  // Check if we need to add a new page for Rank Analysis
  if (yPos > 230) {
    doc.addPage();
    yPos = 20;
  }

  // Rank Analysis
  doc.setTextColor(46, 49, 146);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.text("Rank Analysis", 14, yPos);
  yPos += 5;

  // Prepare current semester rank data
  let currentSemesterStudentData: { id: string; sgpa: number }[] = [];
  
  // Get unique students from current semester
  const currentSemesterStudentIds = [...new Set(currentSemesterRecords.map(record => record.REGNO))];
  
  // Calculate SGPA for current semester students
  currentSemesterStudentIds.forEach(studentId => {
    const sgpa = calculateSGPA(currentSemesterRecords, studentId);
    currentSemesterStudentData.push({ id: studentId, sgpa });
  });
  
  // Sort by SGPA in descending order
  currentSemesterStudentData.sort((a, b) => b.sgpa - a.sgpa);
  
  // Get cumulative data (all semesters)
  let cumulativeStudentData: { id: string; cgpa: number }[] = [];
  
  if (calculationMode === 'cgpa' && analysis.cgpaAnalysis && analysis.cgpaAnalysis.studentCGPAs) {
    // Use CGPA data for multi-semester analysis
    cumulativeStudentData = [...analysis.cgpaAnalysis.studentCGPAs];
  } else {
    // Use SGPA data for single semester
    cumulativeStudentData = currentSemesterStudentData.map(student => ({
      id: student.id,
      cgpa: student.sgpa
    }));
  }
  
  // Sort by CGPA in descending order
  cumulativeStudentData.sort((a, b) => b.cgpa - a.cgpa);
  
  // Limit to top 3 for each
  const topCurrentSemesterStudents = currentSemesterStudentData.slice(0, 3);
  const topCumulativeStudents = cumulativeStudentData.slice(0, 3);

  // Rank Analysis Table
  const rankHeaders = [
    [
      { content: 'Rank in this semester', colSpan: 3, styles: headerStyle },
      { content: 'Rank up to this semester', colSpan: 3, styles: headerStyle }
    ],
    ['S.No', 'Name of the student', 'SGPA', 'S.No', 'Name of the student', 'CGPA']
  ];

  // Prepare rank data
  const rankData = [];
  const maxRankRows = Math.max(topCurrentSemesterStudents.length, topCumulativeStudents.length);
  
  for (let i = 0; i < maxRankRows; i++) {
    const sgpaData = topCurrentSemesterStudents[i] || { id: "", sgpa: 0 };
    const cgpaData = topCumulativeStudents[i] || { id: "", cgpa: 0 };
    
    rankData.push([
      (i + 1).toString(),
      sgpaData.id,
      sgpaData.sgpa.toFixed(2),
      (i + 1).toString(),
      cgpaData.id,
      cgpaData.cgpa.toFixed(2)
    ]);
  }

  // Add rank analysis table
  doc.autoTable({
    startY: yPos,
    head: rankHeaders,
    body: rankData,
    theme: 'grid',
    styles: { fontSize: 9, cellPadding: 2 },
    headStyles: { fillColor: [220, 220, 220], textColor: [0, 0, 0], fontStyle: 'bold' },
    columnStyles: {
      0: { cellWidth: 15 },
      1: { cellWidth: 40 },
      2: { cellWidth: 15 },
      3: { cellWidth: 15 },
      4: { cellWidth: 40 },
      5: { cellWidth: 15 }
    },
    margin: { left: 14 }
  });

  yPos = (doc as any).lastAutoTable.finalY + 10;

  // Check if we need to add a new page for Category Analysis
  if (yPos > 230) {
    doc.addPage();
    yPos = 20;
  }

  // Category Analysis
  doc.setTextColor(46, 49, 146);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.text("Category Analysis", 14, yPos);
  yPos += 5;

  // Category Analysis Table
  const categoryHeaders = [["Category", "Grade Point"]];
  const categoryData = [
    ["1. Distinction", ">= 8.5 and no history of arrears"],
    ["2. First class", ">= 6.5"],
    ["3. Second class", "< 6.5"]
  ];

  doc.autoTable({
    startY: yPos,
    head: categoryHeaders,
    body: categoryData,
    theme: 'grid',
    styles: { fontSize: 10, cellPadding: 3 },
    headStyles: { fillColor: [220, 220, 220], textColor: [0, 0, 0], fontStyle: 'bold' },
    columnStyles: {
      0: { cellWidth: 50 },
      1: { cellWidth: 90 }
    },
    margin: { left: 14 }
  });

  yPos = (doc as any).lastAutoTable.finalY + 10;

  // Check if we need to add a new page for Individual Student Performance
  if (yPos > 200) {
    doc.addPage();
    yPos = 20;
  }

  // Individual Student Performance
  doc.setTextColor(46, 49, 146);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.text("Individual Student Performance", 14, yPos);
  yPos += 5;

  // Get appropriate student data based on mode
  let studentPerformanceData = [];
  
  if (calculationMode === 'sgpa' && analysis.studentSgpaDetails) {
    // For SGPA mode, use the SGPA data
    studentPerformanceData = [...analysis.studentSgpaDetails]
      .sort((a, b) => b.sgpa - a.sgpa)
      .map(student => ({
        id: student.id,
        gpValue: student.sgpa,
        hasArrears: student.hasArrears
      }));
  } else if (calculationMode === 'cgpa' && analysis.cgpaAnalysis) {
    // For CGPA mode, use the CGPA data
    studentPerformanceData = [...analysis.cgpaAnalysis.studentCGPAs]
      .sort((a, b) => b.cgpa - a.cgpa)
      .map(student => {
        // Check if student has arrears in any semester
        const hasArrears = records.some(record => 
          record.REGNO === student.id && record.GR === 'U'
        );
        
        return {
          id: student.id,
          gpValue: student.cgpa,
          hasArrears
        };
      });
  }

  // Prepare student performance data
  const studentHeaders = [
    ["S.No", "Register Number", calculationMode === 'sgpa' ? "SGPA" : "CGPA", "Status"]
  ];
  
  const studentData = studentPerformanceData.map((student, index) => {
    // Determine status based on GP value and arrears
    let status = "";
    
    if (student.hasArrears) {
      if (student.gpValue >= 6.5) {
        status = "First Class With Arrear";
      } else if (student.gpValue >= 5.0) {
        status = "Second Class with Arrears";
      } else {
        status = "Has Arrears";
      }
    } else {
      if (student.gpValue >= 8.5) {
        status = "Distinction";
      } else if (student.gpValue >= 6.5) {
        status = "First Class";
      } else {
        status = "Second Class";
      }
    }
    
    return [
      (index + 1).toString(),
      student.id,
      student.gpValue.toFixed(2),
      status
    ];
  });

  // Add student performance table
  doc.autoTable({
    startY: yPos,
    head: studentHeaders,
    body: studentData,
    theme: 'grid',
    styles: { fontSize: 8, cellPadding: 2 },
    headStyles: { fillColor: [220, 220, 220], textColor: [0, 0, 0], fontStyle: 'bold' },
    columnStyles: {
      0: { cellWidth: 15 },
      1: { cellWidth: 50 },
      2: { cellWidth: 25 },
      3: { cellWidth: 50 }
    },
    margin: { left: 14 }
  });

  yPos = (doc as any).lastAutoTable.finalY + 20;

  // Add signature section
  const signatureY = yPos + 10;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(0);

  const signatureWidth = 40;
  const startX = 20;
  const spacing = (170 - (4 * signatureWidth)) / 3;
  
  doc.text("CLASS ADVISOR", startX + (signatureWidth/2) - 10, signatureY);
  doc.text("HOD/CSE", startX + signatureWidth + spacing + (signatureWidth/2) - 10, signatureY);
  doc.text("DEAN ACADEMICS", startX + (2*signatureWidth) + (2*spacing) + (signatureWidth/2) - 15, signatureY);
  doc.text("PRINCIPAL", startX + (3*signatureWidth) + (3*spacing) + (signatureWidth/2) - 10, signatureY);
};

// Function to add the college header with logo
const addHeaderWithLogo = async (doc: JsPDF, logoPath: string): Promise<void> => {
  try {
    // Add title logo (if available)
    if (logoPath) {
      const response = await fetch(logoPath);
      const blob = await response.blob();
      const base64Logo = await blobToBase64(blob);
      
      // Add the image
      if (base64Logo) {
        doc.addImage(base64Logo, 'PNG', 14, 10, 15, 15);
      }
    }
    
    // Add header title
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("K.S. RANGASAMY COLLEGE OF TECHNOLOGY, TIRUCHENGODE - 637 215", 55, 15);
    doc.setFontSize(10);
    doc.text("(An Autonomous Institute Affiliated to Anna University, Chennai)", 65, 20);
    
    // Add "RESULT ANALYSIS" text on the right
    doc.setFontSize(12);
    doc.text("RESULT ANALYSIS", 175, 15, { align: 'right' });
    
    // Add a line under the header
    doc.setDrawColor(0);
    doc.setLineWidth(0.5);
    doc.line(14, 25, 196, 25);
  } catch (error) {
    console.error("Error adding header with logo:", error);
    // Continue without the logo if there's an error
  }
};

// Helper function to convert a blob to base64
const blobToBase64 = (blob: Blob): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
};
