
import JsPDF from 'jspdf';
import 'jspdf-autotable';
import { ResultAnalysis, StudentRecord } from '../types';
import { calculateSGPA } from '../gradeUtils';
import html2canvas from 'html2canvas';

declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: any) => jsPDF;
  }
}

interface PDFReportOptions {
  logoImagePath?: string;
  department?: string;
  departmentFullName?: string;
  calculationMode: 'sgpa' | 'cgpa';
}

export const captureElementAsPdf = async (elementId: string): Promise<void> => {
  const element = document.getElementById(elementId);
  
  if (!element) {
    throw new Error(`Element with ID "${elementId}" not found`);
  }
  
  try {
    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff'
    });
    
    const pdf = new JsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });
    
    const imgData = canvas.toDataURL('image/png');
    const imgWidth = 210;
    const pageHeight = 295;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    let heightLeft = imgHeight;
    let position = 0;
    
    pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
    heightLeft -= pageHeight;
    
    while (heightLeft > 0) {
      position = heightLeft - imgHeight;
      pdf.addPage();
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
    }
    
    pdf.save('analysis-report.pdf');
    
  } catch (error) {
    console.error('Error generating PDF:', error);
    throw error;
  }
};

export const downloadPdfReport = async (
  analysis: ResultAnalysis, 
  records: StudentRecord[],
  options: PDFReportOptions
): Promise<void> => {
  const pdf = new JsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });
  
  const { 
    logoImagePath = "/lovable-uploads/e199a42b-b04e-4918-8bb4-48f3583e7928.png",
    department = "CSE",
    departmentFullName = "Computer Science and Engineering",
    calculationMode
  } = options;
  
  let currentY = 10;
  
  try {
    if (logoImagePath) {
      const response = await fetch(logoImagePath);
      const blob = await response.blob();
      const imgData = await blobToBase64(blob);
      
      pdf.addImage(imgData, 'PNG', 10, currentY, 20, 20);
    }
  } catch (error) {
    console.error("Error loading logo image:", error);
  }
  
  pdf.setFontSize(12);
  pdf.setFont('helvetica', 'bold');
  pdf.text("K.S. RANGASAMY COLLEGE OF TECHNOLOGY, TIRUCHENGODE - 637 215", 35, currentY + 10);
  pdf.text("(An Autonomous Institute Affiliated to Anna University, Chennai)", 35, currentY + 15);
  
  currentY += 25;
  
  pdf.setLineWidth(0.5);
  pdf.line(10, currentY, 200, currentY);
  currentY += 10;
  
  pdf.setFontSize(14);
  pdf.setTextColor(46, 49, 146);
  pdf.text("College Information", 10, currentY);
  currentY += 8;
  
  pdf.setTextColor(0, 0, 0);
  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'normal');
  
  const collegeInfoData = [
    ["College Name", "K. S. Rangasamy College of Technology"],
    ["Department", departmentFullName],
    ["Total Students", analysis.totalStudents.toString()],
  ];
  
  if (calculationMode === 'cgpa' && analysis.fileCount && analysis.fileCount > 0) {
    collegeInfoData.push(["Files Processed", analysis.fileCount.toString()]);
  }
  
  const calculationModeDisplay = calculationMode === 'sgpa' ? 
    "SGPA (Semester Grade Point Average)" : 
    "CGPA (Cumulative Grade Point Average)";
  
  collegeInfoData.push(["Calculation Mode", calculationModeDisplay]);
  
  pdf.autoTable({
    startY: currentY,
    head: [],
    body: collegeInfoData,
    theme: 'grid',
    styles: {
      fontSize: 10,
      cellPadding: 3,
      lineWidth: 0.1,
      lineColor: [0, 0, 0]
    },
    columnStyles: {
      0: { cellWidth: 40 },
      1: { cellWidth: 140 }
    }
  });
  
  currentY = (pdf as any).lastAutoTable.finalY + 10;
  
  pdf.setFontSize(14);
  pdf.setTextColor(46, 49, 146);
  pdf.setFont('helvetica', 'bold');
  pdf.text("Performance Summary", 10, currentY);
  currentY += 8;
  
  pdf.setTextColor(0, 0, 0);
  pdf.setFontSize(12);
  pdf.setFont('helvetica', 'normal');
  
  if (calculationMode === 'sgpa') {
    pdf.text(`Average SGPA: ${analysis.averageCGPA.toFixed(2)}`, 10, currentY);
    currentY += 6;
    pdf.text(`Highest SGPA: ${analysis.highestSGPA.toFixed(2)}`, 10, currentY);
    currentY += 6;
    pdf.text(`Lowest SGPA: ${analysis.lowestSGPA.toFixed(2)}`, 10, currentY);
    currentY += 6;
    pdf.text(`Pass Percentage: ${analysis.singleFileClassification.passPercentage.toFixed(2)}%`, 10, currentY);
    currentY += 10;
  } else {
    if (analysis.cgpaAnalysis) {
      pdf.text(`Average CGPA: ${analysis.cgpaAnalysis.averageCGPA.toFixed(2)}`, 10, currentY);
      currentY += 6;
      pdf.text(`Highest CGPA: ${analysis.cgpaAnalysis.highestCGPA.toFixed(2)}`, 10, currentY);
      currentY += 6;
      pdf.text(`Lowest CGPA: ${analysis.cgpaAnalysis.lowestCGPA.toFixed(2)}`, 10, currentY);
      currentY += 6;
      pdf.text(`Pass Percentage: ${analysis.multipleFileClassification.passPercentage.toFixed(2)}%`, 10, currentY);
      currentY += 10;
    }
  }
  
  if (calculationMode === 'cgpa' && analysis.fileWiseAnalysis) {
    pdf.setFontSize(14);
    pdf.setTextColor(46, 49, 146);
    pdf.setFont('helvetica', 'bold');
    pdf.text("File Analysis", 10, currentY);
    currentY += 8;
    
    const fileAnalysisHead = [
      ["File Name", "Students", "Average SGPA", "Semester", "Note"]
    ];
    
    const fileAnalysisBody: string[][] = [];
    
    if (analysis.filesProcessed && analysis.fileWiseAnalysis) {
      analysis.filesProcessed.forEach(fileName => {
        const fileAnalysis = analysis.fileWiseAnalysis![fileName];
        if (fileAnalysis) {
          const isCurrentSemester = fileName === analysis.currentSemesterFile;
          fileAnalysisBody.push([
            fileName,
            fileAnalysis.students.toString(),
            fileAnalysis.averageSGPA.toFixed(2),
            fileAnalysis.semesterName || "",
            isCurrentSemester ? "Current Semester" : "Previous Semester"
          ]);
        }
      });
    }
    
    pdf.autoTable({
      startY: currentY,
      head: fileAnalysisHead,
      body: fileAnalysisBody,
      theme: 'grid',
      styles: {
        fontSize: 10,
        cellPadding: 3,
        lineWidth: 0.1,
        lineColor: [0, 0, 0],
        halign: 'center',
        valign: 'middle'
      },
      headStyles: {
        fillColor: [240, 240, 240],
        textColor: [0, 0, 0],
        fontStyle: 'bold',
        halign: 'center'
      }
    });
    
    currentY = (pdf as any).lastAutoTable.finalY + 10;
  }
  
  let currentSemesterRecords = records;
  let cumulativeSemesterRecords = records;
  
  if (analysis.fileCount && analysis.fileCount > 1) {
    if (analysis.currentSemesterFile) {
      currentSemesterRecords = records.filter(record => 
        record.fileSource === analysis.currentSemesterFile
      );
    }
    
    cumulativeSemesterRecords = records;
  }
  
  if (calculationMode === 'sgpa' || (calculationMode === 'cgpa' && currentSemesterRecords.length > 0)) {
    const uniqueSubjects = [...new Set(currentSemesterRecords.map(record => record.SCODE))];
    
    pdf.addPage('landscape');
    currentY = 10;
    
    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'bold');
    pdf.text("K.S. RANGASAMY COLLEGE OF TECHNOLOGY - END SEMESTER RESULT ANALYSIS", 60, currentY);
    currentY += 10;
    
    pdf.setFontSize(14);
    pdf.setTextColor(46, 49, 146);
    pdf.setFont('helvetica', 'bold');
    pdf.text("End Semester Result Analysis", 10, currentY);
    currentY += 8;
    
    const subjectAnalysisHead = [
      ["S.No", "Subject Code", "Subject Name", "Faculty Name", "Dept", "App", "Ab", "Fail", "WH", "Passed", "% of pass", "Highest Grade", "No. of students"]
    ];
    
    const subjectAnalysisBody: string[][] = [];
    
    uniqueSubjects.forEach((subject, index) => {
      const subjectRecords = currentSemesterRecords.filter(record => record.SCODE === subject);
      const totalStudents = subjectRecords.length;
      const passedStudents = subjectRecords.filter(record => record.GR !== 'U').length;
      const failedStudents = subjectRecords.filter(record => record.GR === 'U').length;
      const passPercentage = totalStudents > 0 ? (passedStudents / totalStudents) * 100 : 0;
      
      const grades = subjectRecords.map(record => record.GR);
      const validGrades = grades.filter(grade => grade in gradePointMap);
      const highestGrade = validGrades.length > 0 
        ? validGrades.sort((a, b) => (gradePointMap[b] || 0) - (gradePointMap[a] || 0))[0] 
        : '';
      
      const studentsWithHighestGrade = highestGrade 
        ? subjectRecords.filter(record => record.GR === highestGrade).length 
        : 0;
      
      const recordWithSubjectInfo = subjectRecords.find(record => record.subjectName || record.facultyName);
      
      let subjectName = "";
      let facultyName = "";
      
      if (recordWithSubjectInfo) {
        subjectName = recordWithSubjectInfo.subjectName || "";
        facultyName = recordWithSubjectInfo.facultyName || "";
      }
      
      subjectAnalysisBody.push([
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
      ]);
    });
    
    pdf.autoTable({
      startY: currentY,
      head: subjectAnalysisHead,
      body: subjectAnalysisBody,
      theme: 'grid',
      styles: {
        fontSize: 9,
        cellPadding: 3,
        lineWidth: 0.1,
        lineColor: [0, 0, 0],
        halign: 'center',
        valign: 'middle'
      },
      headStyles: {
        fillColor: [240, 240, 240],
        textColor: [0, 0, 0],
        fontStyle: 'bold',
        halign: 'center'
      },
      columnStyles: {
        0: { cellWidth: 10 },
        1: { cellWidth: 22 },
        2: { cellWidth: 50 },
        3: { cellWidth: 50 },
        4: { cellWidth: 13 },
        5: { cellWidth: 13 },
        6: { cellWidth: 10 },
        7: { cellWidth: 13 },
        8: { cellWidth: 13 },
        9: { cellWidth: 15 },
        10: { cellWidth: 17 },
        11: { cellWidth: 17 },
        12: { cellWidth: 17 }
      },
      margin: { left: 10, right: 10 }
    });
    
    currentY = (pdf as any).lastAutoTable.finalY + 10;
  }
  
  if (currentY > 250) {
    pdf.addPage();
    currentY = 10;
  }
  
  pdf.setFontSize(14);
  pdf.setTextColor(46, 49, 146);
  pdf.setFont('helvetica', 'bold');
  pdf.text("Classification", 10, currentY);
  currentY += 8;
  
  const classificationHead = [
    [
      { content: "Current semester", colSpan: 7, styles: { halign: 'center', fontStyle: 'bold' } },
      { content: "Upto this semester", colSpan: 7, styles: { halign: 'center', fontStyle: 'bold' } }
    ],
    [
      { content: "Distinction", rowSpan: 2, styles: { valign: 'middle', halign: 'center', fontStyle: 'bold' } },
      { content: "First class", colSpan: 2, styles: { halign: 'center', fontStyle: 'bold' } },
      { content: "Second class", colSpan: 2, styles: { halign: 'center', fontStyle: 'bold' } },
      { content: "Fail", rowSpan: 2, styles: { valign: 'middle', halign: 'center', fontStyle: 'bold' } },
      { content: "% of pass", rowSpan: 2, styles: { valign: 'middle', halign: 'center', fontStyle: 'bold' } },
      { content: "Distinction", rowSpan: 2, styles: { valign: 'middle', halign: 'center', fontStyle: 'bold' } },
      { content: "First class", colSpan: 2, styles: { halign: 'center', fontStyle: 'bold' } },
      { content: "Second class", colSpan: 2, styles: { halign: 'center', fontStyle: 'bold' } },
      { content: "Fail", rowSpan: 2, styles: { valign: 'middle', halign: 'center', fontStyle: 'bold' } },
      { content: "% of pass", rowSpan: 2, styles: { valign: 'middle', halign: 'center', fontStyle: 'bold' } }
    ],
    [
      { content: "WOA", styles: { halign: 'center', fontStyle: 'bold' } },
      { content: "WA", styles: { halign: 'center', fontStyle: 'bold' } },
      { content: "WOA", styles: { halign: 'center', fontStyle: 'bold' } },
      { content: "WA", styles: { halign: 'center', fontStyle: 'bold' } },
      { content: "WOA", styles: { halign: 'center', fontStyle: 'bold' } },
      { content: "WA", styles: { halign: 'center', fontStyle: 'bold' } },
      { content: "WOA", styles: { halign: 'center', fontStyle: 'bold' } },
      { content: "WA", styles: { halign: 'center', fontStyle: 'bold' } }
    ]
  ];
  
  // Using the calculationMode from options directly instead of redeclaring it
  const classificationBody = [
    [
      analysis.singleFileClassification.distinction.toString(),
      analysis.singleFileClassification.firstClassWOA.toString(),
      analysis.singleFileClassification.firstClassWA.toString(),
      analysis.singleFileClassification.secondClassWOA.toString(),
      analysis.singleFileClassification.secondClassWA.toString(),
      analysis.singleFileClassification.fail.toString(),
      analysis.singleFileClassification.passPercentage.toFixed(1),
      analysis.multipleFileClassification.distinction.toString(),
      analysis.multipleFileClassification.firstClassWOA.toString(),
      analysis.multipleFileClassification.firstClassWA.toString(),
      analysis.multipleFileClassification.secondClassWOA.toString(),
      analysis.multipleFileClassification.secondClassWA.toString(),
      analysis.multipleFileClassification.fail.toString(),
      analysis.multipleFileClassification.passPercentage.toFixed(1)
    ]
  ];
  
  pdf.autoTable({
    startY: currentY,
    head: classificationHead,
    body: classificationBody,
    theme: 'grid',
    styles: {
      fontSize: 9,
      cellPadding: 3,
      halign: 'center',
      lineWidth: 0.1,
      lineColor: [0, 0, 0],
      valign: 'middle'
    },
    columnStyles: {
      0: { cellWidth: 14 },
      1: { cellWidth: 14 },
      2: { cellWidth: 14 },
      3: { cellWidth: 14 },
      4: { cellWidth: 14 },
      5: { cellWidth: 14 },
      6: { cellWidth: 14 },
      7: { cellWidth: 14 },
      8: { cellWidth: 14 },
      9: { cellWidth: 14 },
      10: { cellWidth: 14 },
      11: { cellWidth: 14 },
      12: { cellWidth: 14 },
      13: { cellWidth: 14 }
    },
    margin: { left: 10, right: 10 }
  });
  
  currentY = (pdf as any).lastAutoTable.finalY + 10;
  
  if (currentY > 250) {
    pdf.addPage();
    currentY = 10;
  }
  
  pdf.setFontSize(14);
  pdf.setTextColor(46, 49, 146);
  pdf.setFont('helvetica', 'bold');
  pdf.text("Rank Analysis", 10, currentY);
  currentY += 8;
  
  let currentSemesterStudentData: { id: string; sgpa: number }[] = [];
  
  const currentSemesterStudentIds = [...new Set(currentSemesterRecords.map(record => record.REGNO))];
  
  currentSemesterStudentIds.forEach(studentId => {
    const sgpa = calculateSGPA(currentSemesterRecords, studentId);
    currentSemesterStudentData.push({ id: studentId, sgpa });
  });
  
  let cumulativeStudentData: { id: string; cgpa: number }[] = [];
  
  if (calculationMode === 'cgpa' && analysis.cgpaAnalysis && analysis.cgpaAnalysis.studentCGPAs) {
    cumulativeStudentData = [...analysis.cgpaAnalysis.studentCGPAs];
  } else {
    cumulativeStudentData = currentSemesterStudentData.map(student => ({
      id: student.id,
      cgpa: student.sgpa
    }));
  }
  
  currentSemesterStudentData.sort((a, b) => b.sgpa - a.sgpa);
  cumulativeStudentData.sort((a, b) => b.cgpa - a.cgpa);
  
  const topCurrentSemesterStudents = currentSemesterStudentData.slice(0, 3);
  const topCumulativeStudents = cumulativeStudentData.slice(0, 3);
  
  const rankHead = [
    [
      { content: "Rank in this semester", colSpan: 3, styles: { halign: 'center', fontStyle: 'bold' } },
      { content: "Rank up to this semester", colSpan: 3, styles: { halign: 'center', fontStyle: 'bold' } }
    ],
    ["S.No", "Name of the student", "SGPA", "S.No", "Name of the student", "CGPA"]
  ];
  
  const rankBody: string[][] = [];
  
  const maxRankRows = Math.max(topCurrentSemesterStudents.length, topCumulativeStudents.length);
  for (let i = 0; i < maxRankRows; i++) {
    const sgpaData = topCurrentSemesterStudents[i] || { id: "", sgpa: 0 };
    const cgpaData = topCumulativeStudents[i] || { id: "", cgpa: 0 };
    
    rankBody.push([
      (i + 1).toString(),
      sgpaData.id,
      sgpaData.sgpa.toFixed(2),
      (i + 1).toString(),
      cgpaData.id,
      cgpaData.cgpa.toFixed(2)
    ]);
  }
  
  pdf.autoTable({
    startY: currentY,
    head: rankHead,
    body: rankBody,
    theme: 'grid',
    styles: {
      fontSize: 10,
      cellPadding: 3,
      lineWidth: 0.1,
      lineColor: [0, 0, 0],
      halign: 'center',
      valign: 'middle'
    },
    headStyles: {
      fillColor: [240, 240, 240],
      textColor: [0, 0, 0],
      fontStyle: 'bold',
      halign: 'center'
    },
    columnStyles: {
      0: { cellWidth: 15 },
      1: { cellWidth: 35 },
      2: { cellWidth: 15 },
      3: { cellWidth: 15 },
      4: { cellWidth: 35 },
      5: { cellWidth: 15 }
    },
    margin: { left: 10, right: 10 }
  });
  
  currentY = (pdf as any).lastAutoTable.finalY + 10;
  
  pdf.setFontSize(14);
  pdf.setTextColor(46, 49, 146);
  pdf.setFont('helvetica', 'bold');
  pdf.text("Individual Student Performance", 10, currentY);
  currentY += 8;
  
  let studentPerformanceData = [];
  
  // Using the calculationMode from options directly instead of redeclaring it
  if (calculationMode === 'sgpa' && analysis.studentSgpaDetails) {
    studentPerformanceData = [...analysis.studentSgpaDetails]
      .sort((a, b) => b.sgpa - a.sgpa)
      .map(student => ({
        id: student.id,
        gpValue: student.sgpa,
        hasArrears: student.hasArrears
      }));
  } else if (calculationMode === 'cgpa' && analysis.cgpaAnalysis) {
    studentPerformanceData = [...analysis.cgpaAnalysis.studentCGPAs]
      .sort((a, b) => b.cgpa - a.cgpa)
      .map(student => {
        const hasArrears = cumulativeSemesterRecords.some(record => 
          record.REGNO === student.id && record.GR === 'U'
        );
        
        return {
          id: student.id,
          gpValue: student.cgpa,
          hasArrears
        };
      });
  }
  
  const studentHead = [
    ["S.No", "Register Number", calculationMode === 'sgpa' ? "SGPA" : "CGPA", "Status"]
  ];
  
  const studentBody: string[][] = [];
  
  studentPerformanceData.forEach((student, index) => {
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
    
    studentBody.push([
      (index + 1).toString(),
      student.id,
      student.gpValue.toFixed(2),
      status
    ]);
  });
  
  pdf.autoTable({
    startY: currentY,
    head: studentHead,
    body: studentBody,
    theme: 'grid',
    styles: {
      fontSize: 9,
      cellPadding: 2,
      lineWidth: 0.1,
      lineColor: [0, 0, 0],
      halign: 'center',
      valign: 'middle'
    },
    headStyles: {
      fillColor: [240, 240, 240],
      textColor: [0, 0, 0],
      fontStyle: 'bold',
      halign: 'center'
    },
    columnStyles: {
      0: { cellWidth: 15 },
      1: { cellWidth: 40 },
      2: { cellWidth: 20 },
      3: { cellWidth: 40 }
    },
    margin: { left: 10, right: 10 }
  });
  
  currentY = (pdf as any).lastAutoTable.finalY + 20;
  
  pdf.setFontSize(11);
  pdf.setFont('helvetica', 'normal');
  pdf.setTextColor(0, 0, 0);
  
  pdf.text("CLASS ADVISOR", 35, currentY);
  pdf.text("HOD/CSE", 85, currentY);
  pdf.text("DEAN ACADEMICS", 135, currentY);
  pdf.text("PRINCIPAL", 185, currentY);
  
  pdf.save(calculationMode === 'sgpa' ? 'sgpa-analysis-report.pdf' : 'cgpa-analysis-report.pdf');
};

const blobToBase64 = (blob: Blob): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result);
      } else {
        reject(new Error('Failed to convert blob to base64'));
      }
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
};

const gradePointMap: { [grade: string]: number } = {
  "O": 10,
  "A+": 9,
  "A": 8,
  "B+": 7,
  "B": 6,
  "C": 5,
  "P": 4,
  "U": 0
};
