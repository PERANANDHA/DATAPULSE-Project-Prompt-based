
import { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, BorderStyle, WidthType, AlignmentType, HeadingLevel, ImageRun } from 'docx';
import { ResultAnalysis, StudentRecord, gradePointMap } from '../types';
import { calculateSGPA, calculateCGPA } from '../gradeUtils';

interface WordReportOptions {
  logoImagePath?: string;
  department?: string;
  departmentFullName?: string;
  calculationMode: 'sgpa' | 'cgpa';
}

export const downloadWordReport = async (
  analysis: ResultAnalysis, 
  records: StudentRecord[],
  options: WordReportOptions
): Promise<void> => {
  const doc = await createWordDocument(analysis, records, options);
  
  // Save the document
  const blob = await Packer.toBlob(doc);
  const url = URL.createObjectURL(blob);
  
  // Create download link
  const link = document.createElement('a');
  link.href = url;
  link.download = options.calculationMode === 'sgpa' 
    ? 'sgpa-analysis-report.docx' 
    : 'cgpa-analysis-report.docx';
  
  // Trigger download
  document.body.appendChild(link);
  link.click();
  
  // Clean up
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

const createWordDocument = async (
  analysis: ResultAnalysis, 
  records: StudentRecord[],
  options: WordReportOptions
): Promise<Document> => {
  // Destructure options with defaults
  const { 
    logoImagePath = "/lovable-uploads/e199a42b-b04e-4918-8bb4-48f3583e7928.png", // Updated to use the new logo
    department = "CSE",
    departmentFullName = "Computer Science and Engineering",
    calculationMode
  } = options;
  
  // Create sections for the document
  const sections = [];
  
  // Get the current and cumulative semester subject codes from the analysis
  const currentSemesterSubjects = analysis.currentSemesterSubjectCodes || [];
  const cumulativeSemesterSubjects = analysis.cumulativeSemesterSubjectCodes || [];
  
  // Filter records for current and cumulative semesters
  const currentSemesterRecords = records.filter(record => 
    currentSemesterSubjects.includes(record.SCODE)
  );
  
  const cumulativeSemesterRecords = records.filter(record => 
    cumulativeSemesterSubjects.includes(record.SCODE)
  );
  
  // Process header image
  let headerImage;
  
  try {
    if (logoImagePath) {
      const response = await fetch(logoImagePath);
      const blob = await response.blob();
      const arrayBuffer = await blob.arrayBuffer();
      
      headerImage = new ImageRun({
        data: arrayBuffer,
        transformation: {
          width: 70,  // Slightly increased for better visibility
          height: 70,
        },
        type: 'png',
      });
    }
  } catch (error) {
    console.error("Error loading logo image:", error);
    // Continue without the image if there's an error
  }
  
  // Create the header table with exact sizing - fixed width to 6.4 inches (6144 twips)
  const headerTable = new Table({
    width: {
      size: 100,
      type: WidthType.PERCENTAGE,
    },
    borders: {
      top: { style: BorderStyle.SINGLE, size: 1 },
      bottom: { style: BorderStyle.SINGLE, size: 1 },
      left: { style: BorderStyle.SINGLE, size: 1 },
      right: { style: BorderStyle.SINGLE, size: 1 },
    },
    // Improved column widths for better proportions
    columnWidths: [1200, 6400, 2300],
    rows: [
      new TableRow({
        children: [
          new TableCell({
            width: {
              size: 12,
              type: WidthType.PERCENTAGE,
            },
            children: headerImage 
              ? [new Paragraph({ 
                  alignment: AlignmentType.CENTER,
                  children: [headerImage] 
                })]
              : [new Paragraph("Logo")],
            verticalAlign: AlignmentType.CENTER,
            margins: {
              top: 100,
              bottom: 100,
              left: 150,
              right: 150
            },
          }),
          new TableCell({
            width: {
              size: 66,
              type: WidthType.PERCENTAGE,
            },
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [
                  new TextRun({
                    text: "K.S. RANGASAMY COLLEGE OF TECHNOLOGY, TIRUCHENGODE - 637 215 (An Autonomous Institute Affiliated to Anna University, Chennai)",
                    bold: true,
                    size: 24, // Increased size for better visibility
                  }),
                ],
              }),
            ],
            verticalAlign: AlignmentType.CENTER,
            margins: {
              top: 100,
              bottom: 100,
              left: 150, 
              right: 150
            },
          }),
          new TableCell({
            width: {
              size: 22,
              type: WidthType.PERCENTAGE,
            },
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [
                  new TextRun({
                    text: "RESULT ANALYSIS",
                    bold: true,
                    size: 22, // Increased size for better visibility
                  }),
                ],
              }),
            ],
            verticalAlign: AlignmentType.CENTER,
            margins: {
              top: 100,
              bottom: 100,
              left: 150,
              right: 150
            },
          }),
        ],
      }),
    ],
  });
  
  sections.push(headerTable);
  
  // Add space after header
  sections.push(
    new Paragraph({
      spacing: {
        after: 200,
      },
    })
  );
  
  // College Information Section
  sections.push(
    new Paragraph({
      children: [
        new TextRun({
          text: "College Information",
          bold: true,
          size: 28,
          color: "2E3192",
        }),
      ],
      spacing: {
        after: 100,
      },
    }),
  );
  
  // Determine current semester data for CGPA mode
  let semesterLabel = '';
  let fileCount = 0;
  let calculationModeDisplay = calculationMode === 'sgpa' ? "SGPA (Semester Grade Point Average)" : "CGPA (Cumulative Grade Point Average)";
  
  if (analysis.fileCount) {
    fileCount = analysis.fileCount;
  }
  
  if (calculationMode === 'cgpa' && analysis.fileCount && analysis.fileCount > 1) {
    // Use the current semester file determined by the analyzer (highest semester)
    const currentSemFile = analysis.currentSemesterFile || '';
    
    if (currentSemFile && currentSemesterRecords.length > 0) {
      semesterLabel = currentSemesterRecords[0].SEM || '';
    }
  }
  
  // College Information Table
  const collegeInfoTableRows = [
    createTableRow(["College Name", "K. S. Rangasamy College of Technology"]),
    createTableRow(["Department", departmentFullName]),
    createTableRow(["Total Students", analysis.totalStudents.toString()]),
  ];
  
  // Add file count for CGPA mode
  if (calculationMode === 'cgpa' && fileCount > 0) {
    collegeInfoTableRows.push(
      createTableRow(["Files Processed", fileCount.toString()])
    );
  }
  
  // Add calculation mode
  collegeInfoTableRows.push(
    createTableRow(["Calculation Mode", calculationModeDisplay])
  );
  
  const collegeInfoTable = new Table({
    width: {
      size: 100,
      type: WidthType.PERCENTAGE,
    },
    borders: {
      top: { style: BorderStyle.SINGLE, size: 1 },
      bottom: { style: BorderStyle.SINGLE, size: 1 },
      left: { style: BorderStyle.SINGLE, size: 1 },
      right: { style: BorderStyle.SINGLE, size: 1 },
      insideHorizontal: { style: BorderStyle.SINGLE, size: 1 },
      insideVertical: { style: BorderStyle.SINGLE, size: 1 },
    },
    columnWidths: [3000, 6500], // Adjusted for better spacing and fixed width
    rows: collegeInfoTableRows,
  });
  
  sections.push(collegeInfoTable);
  
  // Add space 
  sections.push(
    new Paragraph({
      spacing: {
        after: 200,
      },
    })
  );
  
  // Performance Summary Section - USE CURRENT SEMESTER DATA
  sections.push(
    new Paragraph({
      children: [
        new TextRun({
          text: "Performance Summary",
          bold: true,
          size: 28,
          color: "2E3192",
        }),
      ],
      spacing: {
        after: 100,
      },
    }),
  );
  
  // Calculate performance metrics using current semester data
  const currentStudentIds = [...new Set(currentSemesterRecords.map(record => record.REGNO))];
  let currentAvgGPA = 0;
  let currentHighestGPA = 0;
  let currentLowestGPA = 0;
  let currentPassPercentage = 0;
  
  if (currentStudentIds.length > 0) {
    // Calculate SGPA for each student in current semester
    const currentStudentGPAs: number[] = [];
    currentStudentIds.forEach(id => {
      const sgpa = calculateSGPA(currentSemesterRecords, id);
      currentStudentGPAs.push(sgpa);
    });
    
    // Calculate average, highest, and lowest SGPAs
    currentAvgGPA = currentStudentGPAs.reduce((sum, gpa) => sum + gpa, 0) / currentStudentGPAs.length;
    currentHighestGPA = Math.max(...currentStudentGPAs);
    currentLowestGPA = Math.min(...currentStudentGPAs);
    
    // Calculate pass percentage
    const totalGrades = currentSemesterRecords.length;
    const passGrades = currentSemesterRecords.filter(record => record.GR !== 'U').length;
    currentPassPercentage = totalGrades > 0 ? (passGrades / totalGrades) * 100 : 0;
  }
  
  // Performance Text paragraphs with current semester values
  const performanceParagraphs = [
    new Paragraph({
      children: [
        new TextRun({ text: "Average SGPA: ", bold: false, size: 28 }),
        new TextRun({ text: currentAvgGPA.toFixed(2), size: 28 }),
      ],
    }),
    new Paragraph({
      children: [
        new TextRun({ text: "Highest SGPA: ", bold: false, size: 28 }),
        new TextRun({ text: currentHighestGPA.toFixed(2), size: 28 }),
      ],
    }),
    new Paragraph({
      children: [
        new TextRun({ text: "Lowest SGPA: ", bold: false, size: 28 }),
        new TextRun({ text: currentLowestGPA.toFixed(2), size: 28 }),
      ],
    }),
    new Paragraph({
      children: [
        new TextRun({ text: "Pass Percentage: ", bold: false, size: 28 }),
        new TextRun({ text: currentPassPercentage.toFixed(2) + "%", size: 28 }),
      ],
    }),
  ];
  
  // Add performance paragraphs
  sections.push(...performanceParagraphs);
  
  // File Analysis section for CGPA mode
  if (calculationMode === 'cgpa' && analysis.fileWiseAnalysis) {
    sections.push(
      new Paragraph({
        spacing: {
          before: 200,
          after: 100,
        },
        children: [
          new TextRun({
            text: "File Analysis",
            bold: true,
            size: 28,
            color: "2E3192",
          }),
        ],
      }),
    );
    
    // Create file analysis table
    const fileAnalysisTableRows = [
      new TableRow({
        tableHeader: true,
        children: [
          createHeaderCell("File Name"),
          createHeaderCell("Students"),
          createHeaderCell("Average SGPA"),
          createHeaderCell("Semester"),
          createHeaderCell("Note"),
        ],
      }),
    ];
    
    // Process each file
    if (analysis.filesProcessed && analysis.fileWiseAnalysis) {
      analysis.filesProcessed.forEach(fileName => {
        const fileAnalysis = analysis.fileWiseAnalysis![fileName];
        if (fileAnalysis) {
          const isCurrentSemester = fileName === analysis.currentSemesterFile;
          fileAnalysisTableRows.push(
            new TableRow({
              children: [
                createTableCell(fileName),
                createTableCell(fileAnalysis.students.toString()),
                createTableCell(fileAnalysis.averageSGPA.toFixed(2)),
                createTableCell(fileAnalysis.semesterName || ""),
                createTableCell(isCurrentSemester ? "Current Semester" : "Previous Semester"),
              ],
            })
          );
        }
      });
    }
    
    const fileAnalysisTable = new Table({
      width: {
        size: 100,
        type: WidthType.PERCENTAGE,
      },
      borders: {
        top: { style: BorderStyle.SINGLE, size: 1 },
        bottom: { style: BorderStyle.SINGLE, size: 1 },
        left: { style: BorderStyle.SINGLE, size: 1 },
        right: { style: BorderStyle.SINGLE, size: 1 },
        insideHorizontal: { style: BorderStyle.SINGLE, size: 1 },
        insideVertical: { style: BorderStyle.SINGLE, size: 1 },
      },
      columnWidths: [2400, 1300, 1300, 1300, 1800], // Adjusted for consistent width totaling 6.4 inches
      rows: fileAnalysisTableRows,
    });
    
    sections.push(fileAnalysisTable);
  }
  
  // End Semester Result Analysis Section - USE CURRENT SEMESTER DATA
  if (currentSemesterRecords.length > 0) {
    const uniqueSubjects = [...new Set(currentSemesterRecords.map(record => record.SCODE))];
    
    sections.push(
      new Paragraph({
        spacing: {
          before: 200,
          after: 100,
        },
        children: [
          new TextRun({
            text: "End Semester Result Analysis",
            bold: true,
            size: 28,
            color: "2E3192",
          }),
        ],
      }),
    );
    
    // Subject Analysis Table - Make it wider with increased width for subject and faculty name columns
    // Ensuring better alignment and consistent sizing
    const subjectRows = [
      new TableRow({
        tableHeader: true,
        children: [
          createHeaderCell("S.No", { alignment: 'CENTER', rightIndent: -0.06 }),
          createHeaderCell("Subject Code", { alignment: 'CENTER', rightIndent: -0.06 }),
          createHeaderCell("Subject Name", { alignment: 'CENTER', rightIndent: -0.06 }),
          createHeaderCell("Faculty Name", { alignment: 'CENTER', rightIndent: -0.06 }),
          createHeaderCell("Dept", { alignment: 'CENTER', rightIndent: -0.06 }),
          createHeaderCell("App", { alignment: 'CENTER', rightIndent: -0.06 }),
          createHeaderCell("Ab", { alignment: 'CENTER', rightIndent: -0.06 }),
          createHeaderCell("Fail", { alignment: 'CENTER', rightIndent: -0.06 }),
          createHeaderCell("WH", { alignment: 'CENTER', rightIndent: -0.06 }),
          createHeaderCell("Passed", { alignment: 'CENTER', rightIndent: -0.06 }),
          createHeaderCell("% of pass", { alignment: 'CENTER', rightIndent: -0.06 }),
          createHeaderCell("Highest Grade", { alignment: 'CENTER', rightIndent: -0.06 }),
          createHeaderCell("No. of students", { alignment: 'CENTER', rightIndent: -0.06 }),
        ],
      }),
    ];
    
    // Adding actual subject data with faculty names from current semester
    uniqueSubjects.forEach((subject, index) => {
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
      
      // Find a record with subject name and faculty name
      const recordWithInfo = subjectRecords.find(record => record.subjectName || record.facultyName);
      
      // Get subject name and faculty name
      let subjectName = "";
      let facultyName = "";
      
      if (recordWithInfo) {
        subjectName = recordWithInfo.subjectName || "";
        facultyName = recordWithInfo.facultyName || "";
      }
      
      subjectRows.push(
        new TableRow({
          children: [
            createTableCell((index + 1).toString(), false, { alignment: 'CENTER', rightIndent: -0.06 }),
            createTableCell(subject, false, { alignment: 'CENTER', rightIndent: -0.06 }),
            createTableCell(subjectName, false, { alignment: 'CENTER', rightIndent: -0.06 }),
            createTableCell(facultyName, false, { alignment: 'CENTER', rightIndent: -0.06 }),
            createTableCell(department, false, { alignment: 'CENTER', rightIndent: -0.06 }),
            createTableCell(totalStudents.toString(), false, { alignment: 'CENTER', rightIndent: -0.06 }),
            createTableCell("0", false, { alignment: 'CENTER', rightIndent: -0.06 }),
            createTableCell(failedStudents.toString(), false, { alignment: 'CENTER', rightIndent: -0.06 }),
            createTableCell("0", false, { alignment: 'CENTER', rightIndent: -0.06 }),
            createTableCell(passedStudents.toString(), false, { alignment: 'CENTER', rightIndent: -0.06 }),
            createTableCell(passPercentage.toFixed(1), false, { alignment: 'CENTER', rightIndent: -0.06 }),
            createTableCell(highestGrade, false, { alignment: 'CENTER', rightIndent: -0.06 }),
            createTableCell(studentsWithHighestGrade.toString(), false, { alignment: 'CENTER', rightIndent: -0.06 }),
          ],
        })
      );
    });
    
    // Improved table styling for better alignment and consistent appearance
    const subjectAnalysisTable = new Table({
      width: {
        size: 145, // Increased to 145% for better visibility while maintaining proportions
        type: WidthType.PERCENTAGE,
      },
      borders: {
        top: { style: BorderStyle.SINGLE, size: 1 },
        bottom: { style: BorderStyle.SINGLE, size: 1 },
        left: { style: BorderStyle.SINGLE, size: 1 },
        right: { style: BorderStyle.SINGLE, size: 1 },
        insideHorizontal: { style: BorderStyle.SINGLE, size: 1 },
        insideVertical: { style: BorderStyle.SINGLE, size: 1 },
      },
      // More precise column widths for better alignment
      columnWidths: [400, 800, 1500, 1500, 400, 350, 350, 400, 350, 450, 450, 450, 600],
      rows: subjectRows,
    });
    
    sections.push(subjectAnalysisTable);
  }
  
  // Classification Section - USE CUMULATIVE SEMESTER DATA
  sections.push(
    new Paragraph({
      spacing: {
        before: 200,
        after: 100,
      },
      children: [
        new TextRun({
          text: "Classification",
          bold: true,
          size: 28,
          color: "2E3192",
        }),
      ],
    }),
  );
  
  // Calculate classification data using cumulative semester records
  const cumulativeStudentIds = [...new Set(cumulativeSemesterRecords.map(record => record.REGNO))];
  
  // Initialize classification data structure
  const classificationData = {
    currentSemester: {
      distinction: 0,
      firstClassWOA: 0,
      firstClassWA: 0,
      secondClassWOA: 0,
      secondClassWA: 0,
      fail: 0,
      passPercentage: 0
    },
    cumulativeSemester: {
      distinction: 0,
      firstClassWOA: 0,
      firstClassWA: 0,
      secondClassWOA: 0,
      secondClassWA: 0,
      fail: 0,
      passPercentage: 0
    }
  };
  
  // Calculate current semester classification
  if (currentStudentIds.length > 0) {
    currentStudentIds.forEach(id => {
      const sgpa = calculateSGPA(currentSemesterRecords, id);
      const hasArrear = currentSemesterRecords.some(record => record.REGNO === id && record.GR === 'U');
      
      if (hasArrear) {
        // Students with arrears
        if (sgpa >= 6.5) {
          classificationData.currentSemester.firstClassWA++;
        } else if (sgpa >= 5.0) {
          classificationData.currentSemester.secondClassWA++;
        } else {
          classificationData.currentSemester.fail++;
        }
      } else {
        // Students without arrears
        if (sgpa >= 8.5) {
          classificationData.currentSemester.distinction++;
        } else if (sgpa >= 6.5) {
          classificationData.currentSemester.firstClassWOA++;
        } else {
          classificationData.currentSemester.secondClassWOA++;
        }
      }
    });
    
    // Calculate pass percentage
    const totalGrades = currentSemesterRecords.length;
    const passGrades = currentSemesterRecords.filter(record => record.GR !== 'U').length;
    const failGrades = currentSemesterRecords.filter(record => record.GR === 'U').length;
    
    classificationData.currentSemester.passPercentage = totalGrades > 0 ? 
      (passGrades / totalGrades) * 100 : 0;
    
    // Set fail count
    classificationData.currentSemester.fail = failGrades;
  }
  
  // Calculate cumulative semester classification
  if (cumulativeStudentIds.length > 0) {
    cumulativeStudentIds.forEach(id => {
      const sgpa = calculateSGPA(cumulativeSemesterRecords, id);
      const hasArrear = cumulativeSemesterRecords.some(record => record.REGNO === id && record.GR === 'U');
      
      if (hasArrear) {
        // Students with arrears
        if (sgpa >= 6.5) {
          classificationData.cumulativeSemester.firstClassWA++;
        } else if (sgpa >= 5.0) {
          classificationData.cumulativeSemester.secondClassWA++;
        } else {
          classificationData.cumulativeSemester.fail++;
        }
      } else {
        // Students without arrears
        if (sgpa >= 8.5) {
          classificationData.cumulativeSemester.distinction++;
        } else if (sgpa >= 6.5) {
          classificationData.cumulativeSemester.firstClassWOA++;
        } else {
          classificationData.cumulativeSemester.secondClassWOA++;
        }
      }
    });
    
    // Calculate pass percentage
    const totalGrades = cumulativeSemesterRecords.length;
    const passGrades = cumulativeSemesterRecords.filter(record => record.GR !== 'U').length;
    const failGrades = cumulativeSemesterRecords.filter(record => record.GR === 'U').length;
    
    classificationData.cumulativeSemester.passPercentage = totalGrades > 0 ? 
      (passGrades / totalGrades) * 100 : 0;
    
    // Set fail count
    classificationData.cumulativeSemester.fail = failGrades;
  }
  
  // Classification Table - Improved alignment and consistent appearance
  const classificationTable = new Table({
    width: {
      size: 108.7,
      type: WidthType.PERCENTAGE,
    },
    borders: {
      top: { style: BorderStyle.SINGLE, size: 1 },
      bottom: { style: BorderStyle.SINGLE, size: 1 },
      left: { style: BorderStyle.SINGLE, size: 1 },
      right: { style: BorderStyle.SINGLE, size: 1 },
      insideHorizontal: { style: BorderStyle.SINGLE, size: 1 },
      insideVertical: { style: BorderStyle.SINGLE, size: 1 },
    },
    // More precise column widths for better alignment
    columnWidths: [460, 460, 460, 460, 460, 300, 400, 460, 460, 460, 460, 460, 300, 400],
    rows: [
      // First row: Current semester | Upto this semester
      new TableRow({
        children: [
          createTableCell("Current semester", true, { 
            colspan: 7, 
            alignment: 'CENTER',
            bold: true
          }),
          createTableCell("Upto this semester", true, { 
            colspan: 7, 
            alignment: 'CENTER',
            bold: true
          }),
        ],
      }),
      // Second row: Headers with spans
      new TableRow({
        children: [
          createTableCell("Distinction", true, { 
            rowspan: 2, 
            alignment: 'CENTER',
            bold: true,
            verticalMerge: 'restart' 
          }),
          createTableCell("First class", true, { 
            colspan: 2, 
            alignment: 'CENTER',
            bold: true
          }),
          createTableCell("Second class", true, { 
            colspan: 2, 
            alignment: 'CENTER',
            bold: true
          }),
          createTableCell("Fail", true, { 
            rowspan: 2, 
            alignment: 'CENTER',
            bold: true,
            verticalMerge: 'restart' 
          }),
          createTableCell("% of pass", true, { 
            rowspan: 2, 
            alignment: 'CENTER',
            bold: true,
            verticalMerge: 'restart' 
          }),
          createTableCell("Distinction", true, { 
            rowspan: 2, 
            alignment: 'CENTER',
            bold: true,
            verticalMerge: 'restart' 
          }),
          createTableCell("First class", true, { 
            colspan: 2, 
            alignment: 'CENTER',
            bold: true
          }),
          createTableCell("Second class", true, { 
            colspan: 2, 
            alignment: 'CENTER',
            bold: true
          }),
          createTableCell("Fail", true, { 
            rowspan: 2, 
            alignment: 'CENTER',
            bold: true,
            verticalMerge: 'restart' 
          }),
          createTableCell("% of pass", true, { 
            rowspan: 2, 
            alignment: 'CENTER',
            bold: true,
            verticalMerge: 'restart' 
          }),
        ],
      }),
      // Third row: WOA/WA headers
      new TableRow({
        children: [
          // Skip Distinction cell (handled by rowspan above)
          createTableCell("WOA", true, { 
            alignment: 'CENTER',
            bold: true
          }),
          createTableCell("WA", true, { 
            alignment: 'CENTER',
            bold: true
          }),
          createTableCell("WOA", true, { 
            alignment: 'CENTER',
            bold: true
          }),
          createTableCell("WA", true, { 
            alignment: 'CENTER',
            bold: true
          }),
          // Skip Fail cell (handled by rowspan above)
          // Skip % of pass cell (handled by rowspan above)
          // Skip Distinction cell (handled by rowspan above)
          createTableCell("WOA", true, { 
            alignment: 'CENTER',
            bold: true
          }),
          createTableCell("WA", true, { 
            alignment: 'CENTER',
            bold: true
          }),
          createTableCell("WOA", true, { 
            alignment: 'CENTER',
            bold: true
          }),
          createTableCell("WA", true, { 
            alignment: 'CENTER',
            bold: true
          }),
          // Skip Fail cell (handled by rowspan above)
          // Skip % of pass cell (handled by rowspan above)
        ],
      }),
      // Fourth row: Data values using calculated classification data
      new TableRow({
        children: [
          // Current semester data
          createTableCell(classificationData.currentSemester.distinction.toString(), false, { 
            alignment: 'CENTER' 
          }),
          createTableCell(classificationData.currentSemester.firstClassWOA.toString(), false, { 
            alignment: 'CENTER' 
          }),
          createTableCell(classificationData.currentSemester.firstClassWA.toString(), false, { 
            alignment: 'CENTER' 
          }),
          createTableCell(classificationData.currentSemester.secondClassWOA.toString(), false, { 
            alignment: 'CENTER' 
          }),
          createTableCell(classificationData.currentSemester.secondClassWA.toString(), false, { 
            alignment: 'CENTER' 
          }),
          createTableCell(classificationData.currentSemester.fail.toString(), false, { 
            alignment: 'CENTER' 
          }),
          createTableCell(classificationData.currentSemester.passPercentage.toFixed(1), false, { 
            alignment: 'CENTER' 
          }),
          // Cumulative data (up to this semester)
          createTableCell(classificationData.cumulativeSemester.distinction.toString(), false, { 
            alignment: 'CENTER' 
          }),
          createTableCell(classificationData.cumulativeSemester.firstClassWOA.toString(), false, { 
            alignment: 'CENTER' 
          }),
          createTableCell(classificationData.cumulativeSemester.firstClassWA.toString(), false, { 
            alignment: 'CENTER' 
          }),
          createTableCell(classificationData.cumulativeSemester.secondClassWOA.toString(), false, { 
            alignment: 'CENTER' 
          }),
          createTableCell(classificationData.cumulativeSemester.secondClassWA.toString(), false, { 
            alignment: 'CENTER' 
          }),
          createTableCell(classificationData.cumulativeSemester.fail.toString(), false, { 
            alignment: 'CENTER' 
          }),
          createTableCell(classificationData.cumulativeSemester.passPercentage.toFixed(1), false, { 
            alignment: 'CENTER' 
          }),
        ],
      }),
    ],
  });
  
  sections.push(classificationTable);
  
  // Rank Analysis Section - USE CUMULATIVE SEMESTER DATA
  sections.push(
    new Paragraph({
      spacing: {
        before: 200,
        after: 100,
      },
      children: [
        new TextRun({
          text: "Rank Analysis",
          bold: true,
          size: 28,
          color: "2E3192",
        }),
      ],
    }),
  );
  
  // Calculate student data for current and cumulative semesters
  const currentSemesterStudentData: { id: string; sgpa: number }[] = [];
  const cumulativeSemesterStudentData: { id: string; sgpa: number }[] = [];
  
  // Calculate SGPA for each student in current semester
  currentStudentIds.forEach(id => {
    const sgpa = calculateSGPA(currentSemesterRecords, id);
    if (sgpa > 0) {
      currentSemesterStudentData.push({ id, sgpa });
    }
  });
  
  // Calculate SGPA for each student in cumulative semester
  cumulativeStudentIds.forEach(id => {
    const sgpa = calculateSGPA(cumulativeSemesterRecords, id);
    if (sgpa > 0) {
      cumulativeSemesterStudentData.push({ id, sgpa });
    }
  });
  
  // Sort by SGPA in descending order
  currentSemesterStudentData.sort((a, b) => b.sgpa - a.sgpa);
  cumulativeSemesterStudentData.sort((a, b) => b.sgpa - a.sgpa);
  
  // Get top 3 students for each category
  const topCurrentStudents = currentSemesterStudentData.slice(0, 3);
  const topCumulativeStudents = cumulativeSemesterStudentData.slice(0, 3);
  
  // Create table headers for Rank Analysis
  const rankRows = [
    new TableRow({
      children: [
        createTableCell("Rank in this semester", true, { colspan: 3, alignment: 'CENTER' }),
        createTableCell("Rank up to this semester", true, { colspan: 3, alignment: 'CENTER' }),
      ],
    }),
    new TableRow({
      children: [
        createHeaderCell("RANK"),
        createHeaderCell("Name of the student"),
        createHeaderCell("SGPA"),
        createHeaderCell("RANK"),
        createHeaderCell("Name of the student"),
        createHeaderCell("CGPA"),
      ],
    }),
  ];
  
  // Add data rows for top 3 ranks - always display 3 rows
  for (let i = 0; i < 3; i++) {
    const rank = i + 1;
    
    // Get student data if available
    const currentStudent = i < topCurrentStudents.length ? 
      topCurrentStudents[i] : { id: "-", sgpa: 0 };
      
    const cumulativeStudent = i < topCumulativeStudents.length ? 
      topCumulativeStudents[i] : { id: "-", sgpa: 0 };
    
    // Create a row with actual data or placeholders
    rankRows.push(
      new TableRow({
        children: [
          createTableCell(rank.toString()),
          createTableCell(currentStudent.id),
          createTableCell(currentStudent.sgpa > 0 ? currentStudent.sgpa.toFixed(2) : "-"),
          createTableCell(rank.toString()),
          createTableCell(cumulativeStudent.id),
          createTableCell(cumulativeStudent.sgpa > 0 ? cumulativeStudent.sgpa.toFixed(2) : "-"),
        ],
      })
    );
  }
  
  // Create and add rank table to sections
  const rankTable = new Table({
    width: {
      size: 100,
      type: WidthType.PERCENTAGE,
    },
    borders: {
      top: { style: BorderStyle.SINGLE, size: 1 },
      bottom: { style: BorderStyle.SINGLE, size: 1 },
      left: { style: BorderStyle.SINGLE, size: 1 },
      right: { style: BorderStyle.SINGLE, size: 1 },
      insideHorizontal: { style: BorderStyle.SINGLE, size: 1 },
      insideVertical: { style: BorderStyle.SINGLE, size: 1 },
    },
    columnWidths: [800, 2000, 1000, 800, 2000, 1000],
    rows: rankRows,
  });
  
  sections.push(rankTable);
  
  // Individual Student Performance Section - USE CURRENT SEMESTER DATA
  sections.push(
    new Paragraph({
      spacing: {
        before: 200,
        after: 100,
      },
      children: [
        new TextRun({
          text: "Individual Student Performance",
          bold: true,
          size: 28,
          color: "2E3192",
        }),
      ],
    }),
  );
  
  // Process student performance data from current semester
  const studentPerformanceData = currentSemesterStudentData.map(student => {
    // Check if student has arrears
    const hasArrears = currentSemesterRecords.some(record => 
      record.REGNO === student.id && record.GR === 'U'
    );
    
    return {
      id: student.id,
      gpValue: student.sgpa,
      hasArrears
    };
  }).sort((a, b) => b.gpValue - a.gpValue);  // Sort by GPA
  
  // Build the student performance table rows
  const studentRows = [
    new TableRow({
      children: [
        createHeaderCell("S.No"),
        createHeaderCell("Register Number"),
        createHeaderCell("SGPA"),
        createHeaderCell("Status"),
      ],
    }),
  ];
  
  // Add student rows
  studentPerformanceData.forEach((student, index) => {
    // Determine status based on GP value and arrears
    let status = "";
    
    if (student.hasArrears) {
      // Students with arrears
      if (student.gpValue >= 6.5) {
        status = "First Class With Arrear";
      } else if (student.gpValue >= 5.0) {
        status = "Second Class with Arrears";
      } else {
        status = "Has Arrears";
      }
    } else {
      // Students without arrears
      if (student.gpValue >= 8.5) {
        status = "Distinction";
      } else if (student.gpValue >= 6.5) {
        status = "First Class";
      } else {
        status = "Second Class";
      }
    }
    
    studentRows.push(
      new TableRow({
        children: [
          createTableCell((index + 1).toString()),
          createTableCell(student.id),
          createTableCell(student.gpValue.toFixed(2)),
          createTableCell(status),
        ],
      })
    );
  });
  
  const studentTable = new Table({
    width: {
      size: 100,
      type: WidthType.PERCENTAGE,
    },
    borders: {
      top: { style: BorderStyle.SINGLE, size: 1 },
      bottom: { style: BorderStyle.SINGLE, size: 1 },
      left: { style: BorderStyle.SINGLE, size: 1 },
      right: { style: BorderStyle.SINGLE, size: 1 },
      insideHorizontal: { style: BorderStyle.SINGLE, size: 1 },
      insideVertical: { style: BorderStyle.SINGLE, size: 1 },
    },
    columnWidths: [1000, 2800, 1400, 3400],
    rows: studentRows,
  });
  
  sections.push(studentTable);
  
  // Signature section
  sections.push(
    new Paragraph({
      children: [new TextRun("")],
      spacing: {
        before: 500,
      },
    }),
    new Table({
      width: {
        size: 100,
        type: WidthType.PERCENTAGE,
      },
      borders: {
        top: { style: BorderStyle.NONE },
        bottom: { style: BorderStyle.NONE },
        left: { style: BorderStyle.NONE },
        right: { style: BorderStyle.NONE },
        insideHorizontal: { style: BorderStyle.NONE },
        insideVertical: { style: BorderStyle.NONE },
      },
      columnWidths: [2000, 2000, 2000, 2000],
      rows: [
        new TableRow({
          children: [
            new TableCell({
              borders: {
                top: { style: BorderStyle.NONE },
                bottom: { style: BorderStyle.NONE },
                left: { style: BorderStyle.NONE },
                right: { style: BorderStyle.NONE },
              },
              children: [
                new Paragraph({
                  text: "CLASS ADVISOR",
                  alignment: AlignmentType.CENTER,
                }),
              ],
              width: {
                size: 25,
                type: WidthType.PERCENTAGE,
              },
            }),
            new TableCell({
              borders: {
                top: { style: BorderStyle.NONE },
                bottom: { style: BorderStyle.NONE },
                left: { style: BorderStyle.NONE },
                right: { style: BorderStyle.NONE },
              },
              children: [
                new Paragraph({
                  text: "HOD/CSE",
                  alignment: AlignmentType.CENTER,
                }),
              ],
              width: {
                size: 25,
                type: WidthType.PERCENTAGE,
              },
            }),
            new TableCell({
              borders: {
                top: { style: BorderStyle.NONE },
                bottom: { style: BorderStyle.NONE },
                left: { style: BorderStyle.NONE },
                right: { style: BorderStyle.NONE },
              },
              children: [
                new Paragraph({
                  text: "DEAN ACADEMICS",
                  alignment: AlignmentType.CENTER,
                }),
              ],
              width: {
                size: 25,
                type: WidthType.PERCENTAGE,
              },
            }),
            new TableCell({
              borders: {
                top: { style: BorderStyle.NONE },
                bottom: { style: BorderStyle.NONE },
                left: { style: BorderStyle.NONE },
                right: { style: BorderStyle.NONE },
              },
              children: [
                new Paragraph({
                  text: "PRINCIPAL",
                  alignment: AlignmentType.CENTER,
                }),
              ],
              width: {
                size: 25,
                type: WidthType.PERCENTAGE,
              },
            }),
          ],
        }),
      ],
    })
  );
  
  return new Document({
    sections: [
      {
        properties: {},
        children: sections,
      },
    ],
  });
};

// Enhanced helper function for creating table cells with better alignment and text control
function createTableCell(
  text: string, 
  isHeader = false,
  options: {
    colspan?: number;
    rowspan?: number;
    alignment?: keyof typeof AlignmentType;
    rightIndent?: number;
    bold?: boolean;
    verticalMerge?: 'restart' | 'continue';
  } = {}
): TableCell {
  const { colspan, rowspan, alignment = 'CENTER', rightIndent, bold = isHeader, verticalMerge } = options;
  
  return new TableCell({
    children: [
      new Paragraph({
        alignment: alignment ? AlignmentType[alignment] : AlignmentType.CENTER,
        indent: rightIndent !== undefined ? { right: rightIndent } : undefined,
        children: [
          new TextRun({
            text,
            bold: bold,
            size: 20,
          }),
        ],
      }),
    ],
    columnSpan: colspan,
    rowSpan: rowspan,
    margins: {
      top: 80,
      bottom: 80,
      left: 100,
      right: 100
    },
    verticalAlign: AlignmentType.CENTER,
    verticalMerge: verticalMerge,
  });
}

function createHeaderCell(
  text: string,
  options: {
    colspan?: number;
    rowspan?: number;
    alignment?: keyof typeof AlignmentType;
    rightIndent?: number;
  } = {}
): TableCell {
  return createTableCell(text, true, {
    ...options,
    alignment: options.alignment || 'CENTER',
  });
}

// Original helper function for simple table rows
const createTableRow = (cells: string[], isHeader = false): TableRow => {
  return new TableRow({
    children: cells.map(text => 
      new TableCell({
        borders: {
          top: { style: BorderStyle.SINGLE, size: 1 },
          bottom: { style: BorderStyle.SINGLE, size: 1 },
          left: { style: BorderStyle.SINGLE, size: 1 },
          right: { style: BorderStyle.SINGLE, size: 1 },
        },
        children: [
          new Paragraph({
            alignment: AlignmentType.CENTER,
            indent: { right: -0.06 },
            children: [
              new TextRun({
                text,
                bold: isHeader,
                size: 20,
              }),
            ],
          }),
        ],
        margins: {
          top: 80,
          bottom: 80,
          left: 100,
          right: 100
        },
        verticalAlign: AlignmentType.CENTER,
      })
    ),
  });
};
