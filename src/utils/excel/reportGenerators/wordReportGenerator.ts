import { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, BorderStyle, WidthType, AlignmentType, HeadingLevel, ImageRun } from 'docx';
import { ResultAnalysis, StudentRecord, gradePointMap } from '../types';
import { calculateSGPA } from '../gradeUtils';

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
    columnWidths: [1200, 6400, 2300], // Increased middle column width to accommodate longer text
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
  let currentSemesterRecords = records;
  let semesterLabel = '';
  let fileCount = 0;
  let calculationModeDisplay = calculationMode === 'sgpa' ? "SGPA (Semester Grade Point Average)" : "CGPA (Cumulative Grade Point Average)";
  
  if (analysis.fileCount) {
    fileCount = analysis.fileCount;
  }
  
  if (calculationMode === 'cgpa' && analysis.fileCount && analysis.fileCount > 1) {
    // Use the current semester file determined by the analyzer
    const currentSemFile = analysis.currentSemesterFile || '';
    
    if (currentSemFile) {
      currentSemesterRecords = records.filter(record => record.fileSource === currentSemFile);
      
      // Get semester number from the current semester file
      if (currentSemesterRecords.length > 0) {
        semesterLabel = currentSemesterRecords[0].SEM || '';
      }
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
  
  // Performance Summary Section
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
  
  // Performance Text paragraphs - UPDATED WITH LARGER SIZE TO MATCH HEADERS BUT NOT BOLD
  const performanceParagraphs = [];
  
  if (calculationMode === 'sgpa') {
    // For SGPA mode
    performanceParagraphs.push(
      new Paragraph({
        children: [
          new TextRun({ text: "Average SGPA: ", bold: false, size: 28 }),
          new TextRun({ text: analysis.averageCGPA.toFixed(2), size: 28 }),
        ],
      }),
      new Paragraph({
        children: [
          new TextRun({ text: "Highest SGPA: ", bold: false, size: 28 }),
          new TextRun({ text: analysis.highestSGPA.toFixed(2), size: 28 }),
        ],
      }),
      new Paragraph({
        children: [
          new TextRun({ text: "Lowest SGPA: ", bold: false, size: 28 }),
          new TextRun({ text: analysis.lowestSGPA.toFixed(2), size: 28 }),
        ],
      }),
      new Paragraph({
        children: [
          new TextRun({ text: "Pass Percentage: ", bold: false, size: 28 }),
          new TextRun({ text: analysis.singleFileClassification.passPercentage.toFixed(2) + "%", size: 28 }),
        ],
      }),
    );
  } else {
    // For CGPA mode
    if (analysis.cgpaAnalysis) {
      performanceParagraphs.push(
        new Paragraph({
          children: [
            new TextRun({ text: "Average CGPA: ", bold: false, size: 28 }),
            new TextRun({ text: analysis.cgpaAnalysis.averageCGPA.toFixed(2), size: 28 }),
          ],
        }),
        new Paragraph({
          children: [
            new TextRun({ text: "Highest CGPA: ", bold: false, size: 28 }),
            new TextRun({ text: analysis.cgpaAnalysis.highestCGPA.toFixed(2), size: 28 }),
          ],
        }),
        new Paragraph({
          children: [
            new TextRun({ text: "Lowest CGPA: ", bold: false, size: 28 }),
            new TextRun({ text: analysis.cgpaAnalysis.lowestCGPA.toFixed(2), size: 28 }),
          ],
        }),
        new Paragraph({
          children: [
            new TextRun({ text: "Pass Percentage: ", bold: false, size: 28 }),
            new TextRun({ text: analysis.multipleFileClassification.passPercentage.toFixed(2) + "%", size: 28 }),
          ],
        }),
      );
    }
  }
  
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
  
  // End Semester Result Analysis Section - UPDATED TO USE ACTUAL DATA WITH ORIGINAL TABLE SIZING
  if (calculationMode === 'sgpa' || (calculationMode === 'cgpa' && currentSemesterRecords.length > 0)) {
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
    
    // Subject Analysis Table - Using actual data with original column widths
    const subjectRows = [
      new TableRow({
        tableHeader: true,
        children: [
          createHeaderCell("S.No", { alignment: 'CENTER' }),
          createHeaderCell("Subject Code", { alignment: 'CENTER' }),
          createHeaderCell("Subject Name", { alignment: 'CENTER' }),
          createHeaderCell("Faculty Name", { alignment: 'CENTER' }),
          createHeaderCell("Dept", { alignment: 'CENTER' }),
          createHeaderCell("App", { alignment: 'CENTER' }),
          createHeaderCell("Ab", { alignment: 'CENTER' }),
          createHeaderCell("Fail", { alignment: 'CENTER' }),
          createHeaderCell("WH", { alignment: 'CENTER' }),
          createHeaderCell("Passed", { alignment: 'CENTER' }),
          createHeaderCell("% of pass", { alignment: 'CENTER' }),
          createHeaderCell("Highest Grade", { alignment: 'CENTER' }),
          createHeaderCell("No. of students", { alignment: 'CENTER' }),
        ],
      }),
    ];
    
    // Adding actual data for each subject
    uniqueSubjects.forEach((subject, index) => {
      const subjectRecords = currentSemesterRecords.filter(record => record.SCODE === subject);
      const totalStudents = subjectRecords.length;
      const passedStudents = subjectRecords.filter(record => record.GR !== 'U').length;
      const failedStudents = subjectRecords.filter(record => record.GR === 'U').length;
      const passPercentage = totalStudents > 0 ? (passedStudents / totalStudents) * 100 : 0;
      
      // Find the highest grade
      const validGrades = subjectRecords.map(record => record.GR).filter(grade => grade in gradePointMap);
      const highestGrade = validGrades.length > 0 
        ? validGrades.sort((a, b) => (gradePointMap[b] || 0) - (gradePointMap[a] || 0))[0] 
        : '-';
      
      // Count students with highest grade
      const studentsWithHighestGrade = subjectRecords.filter(record => record.GR === highestGrade).length;
      
      subjectRows.push(
        new TableRow({
          children: [
            createTableCell((index + 1).toString(), false, { alignment: 'CENTER' }),
            createTableCell(subject, false, { alignment: 'CENTER' }),
            createTableCell(subject, false, { alignment: 'CENTER' }),
            createTableCell("", false, { alignment: 'CENTER' }),
            createTableCell(department, false, { alignment: 'CENTER' }),
            createTableCell(totalStudents.toString(), false, { alignment: 'CENTER' }), 
            createTableCell("0", false, { alignment: 'CENTER' }), 
            createTableCell(failedStudents.toString(), false, { alignment: 'CENTER' }),
            createTableCell("0", false, { alignment: 'CENTER' }), 
            createTableCell(passedStudents.toString(), false, { alignment: 'CENTER' }), 
            createTableCell(passPercentage.toFixed(1), false, { alignment: 'CENTER' }), 
            createTableCell(highestGrade, false, { alignment: 'CENTER' }), 
            createTableCell(studentsWithHighestGrade.toString(), false, { alignment: 'CENTER' }), 
          ],
        })
      );
    });
    
    const subjectAnalysisTable = new Table({
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
      // Restored original column widths while keeping calculated values
      columnWidths: [400, 800, 800, 800, 400, 350, 350, 400, 350, 450, 450, 450, 600],
      rows: subjectRows,
    });
    
    sections.push(subjectAnalysisTable);
  }
  
  // Classification Section
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
  
  // Classification Table - USING ACTUAL DATA
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
    // Adjusted column widths to improve alignment
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
      // Fourth row: Data values - USING ACTUAL DATA
      new TableRow({
        children: [
          // Current semester data
          createTableCell(analysis.singleFileClassification.distinction.toString(), false, { 
            alignment: 'CENTER' 
          }),
          createTableCell(analysis.singleFileClassification.firstClassWOA.toString(), false, { 
            alignment: 'CENTER' 
          }),
          createTableCell(analysis.singleFileClassification.firstClassWA.toString(), false, { 
            alignment: 'CENTER' 
          }),
          createTableCell(analysis.singleFileClassification.secondClassWOA.toString(), false, { 
            alignment: 'CENTER' 
          }),
          createTableCell(analysis.singleFileClassification.secondClassWA.toString(), false, { 
            alignment: 'CENTER' 
          }),
          createTableCell(analysis.singleFileClassification.fail.toString(), false, { 
            alignment: 'CENTER' 
          }),
          createTableCell(analysis.singleFileClassification.passPercentage.toFixed(1), false, { 
            alignment: 'CENTER' 
          }),
          // Cumulative data (up to this semester)
          createTableCell(analysis.multipleFileClassification.distinction.toString(), false, { 
            alignment: 'CENTER' 
          }),
          createTableCell(analysis.multipleFileClassification.firstClassWOA.toString(), false, { 
            alignment: 'CENTER' 
          }),
          createTableCell(analysis.multipleFileClassification.firstClassWA.toString(), false, { 
            alignment: 'CENTER' 
          }),
          createTableCell(analysis.multipleFileClassification.secondClassWOA.toString(), false, { 
            alignment: 'CENTER' 
          }),
          createTableCell(analysis.multipleFileClassification.secondClassWA.toString(), false, { 
            alignment: 'CENTER' 
          }),
          createTableCell(analysis.multipleFileClassification.fail.toString(), false, { 
            alignment: 'CENTER' 
          }),
          createTableCell(analysis.multipleFileClassification.passPercentage.toFixed(1), false, { 
            alignment: 'CENTER' 
          }),
        ],
      }),
    ],
  });
  
  sections.push(classificationTable);
  
  // Rank Analysis Section
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
  
  // Rank Analysis Table - Using actual data for top performers
  // For current semester, only use data from current semester file
  // For "up to this semester", use data from all files
  
  let currentSemesterStudents: { id: string; sgpa: number }[] = [];
  let cumulativeStudents: { id: string; cgpa: number }[] = [];
  
  // Determine current semester files and records
  if (calculationMode === 'cgpa' && analysis.fileCount && analysis.fileCount > 1 && analysis.currentSemesterFile) {
    // For CGPA mode with multiple files
    const currentSemesterRecords = records.filter(record => 
      record.fileSource === analysis.currentSemesterFile
    );
    
    // Calculate SGPA for each student in current semester only
    const studentIds = [...new Set(currentSemesterRecords.map(record => record.REGNO))];
    currentSemesterStudents = studentIds.map(id => ({
      id,
      sgpa: calculateSGPA(currentSemesterRecords, id)
    }));
  } else {
    // For SGPA mode or single file
    currentSemesterStudents = analysis.studentSgpaDetails 
      ? analysis.studentSgpaDetails.map(student => ({
          id: student.id,
          sgpa: student.sgpa
        }))
      : [];
  }
  
  // For cumulative data, use either CGPA data or SGPA data depending on mode
  if (calculationMode === 'cgpa' && analysis.cgpaAnalysis && analysis.cgpaAnalysis.studentCGPAs) {
    cumulativeStudents = analysis.cgpaAnalysis.studentCGPAs;
  } else {
    // For SGPA mode, cumulative is the same as current semester
    cumulativeStudents = currentSemesterStudents.map(student => ({
      id: student.id,
      cgpa: student.sgpa
    }));
  }
  
  // Sort both arrays by grades (descending)
  currentSemesterStudents.sort((a, b) => b.sgpa - a.sgpa);
  cumulativeStudents.sort((a, b) => b.cgpa - a.cgpa);
  
  // Take top 3 from each for the table
  const topCurrentSemester = currentSemesterStudents.slice(0, 3);
  const topCumulative = cumulativeStudents.slice(0, 3);
  
  const rankRows = [
    new TableRow({
      children: [
        createTableCell("Rank in this semester", true, { colspan: 3, alignment: 'CENTER' }),
        createTableCell("Rank up to this semester", true, { colspan: 3, alignment: 'CENTER' }),
      ],
    }),
    new TableRow({
      children: [
        createHeaderCell("S.No"),
        createHeaderCell("Name of the student"),
        createHeaderCell("SGPA"),
        createHeaderCell("S.No"),
        createHeaderCell("Name of the student"),
        createHeaderCell("CGPA"),
      ],
    }),
  ];
  
  // Add data rows using actual calculated top performers
  const maxRankRows = Math.max(topCurrentSemester.length, topCumulative.length, 3); // Ensure at least 3 rows
  for (let i = 0; i < maxRankRows; i++) {
    const currentData = topCurrentSemester[i] || { id: "-", sgpa: 0 };
    const cumulativeData = topCumulative[i] || { id: "-", cgpa: 0 };
    
    rankRows.push(
      new TableRow({
        children: [
          createTableCell((i + 1).toString()),
          createTableCell(currentData.id),
          createTableCell(currentData.sgpa.toFixed(2)),
          createTableCell((i + 1).toString()),
          createTableCell(cumulativeData.id),
          createTableCell(cumulativeData.cgpa.toFixed(2)),
        ],
      })
    );
  }
  
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
    // Updated column widths to fit within 6.4 inches
    columnWidths: [800, 2000, 1000, 800, 2000, 1000],
    rows: rankRows,
  });
  
  sections.push(rankTable);
  
  // Category Analysis Section
  sections.push(
    new Paragraph({
      spacing: {
        before: 200,
        after: 100,
      },
      children: [
        new TextRun({
          text: "Category Analysis",
          bold: true,
          size: 28,
          color: "2E3192",
        }),
      ],
    }),
  );
  
  // Category Analysis Table
  const categoryTable = new Table({
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
    // Updated column widths to fit within 6.4 inches
    columnWidths: [3000, 5600],
    rows: [
      new TableRow({
        children: [
          createHeaderCell("Category"),
          createHeaderCell("Grade Point"),
        ],
      }),
      new TableRow({
        children: [
          createTableCell("1. Distinction"),
          createTableCell(">= 8.5 and no history of arrears"),
        ],
      }),
      new TableRow({
        children: [
          createTableCell("2. First class"),
          createTableCell(">= 6.5"),
        ],
      }),
      new TableRow({
        children: [
          createTableCell("3. Second class"),
          createTableCell("< 6.5"),
        ],
      }),
    ],
  });
  
  sections.push(categoryTable);
  
  // Individual Student Performance Section
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
        // For CGPA mode, we need to check if the student has arrears in any semester
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
  
  // Build the table rows
  const studentRows = [
    new TableRow({
      children: [
        createHeaderCell("S.No"),
        createHeaderCell("Register Number"),
        createHeaderCell(calculationMode === 'sgpa' ? "SGPA" : "CGPA"),
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
        status = "First Class With Arrear"; // Changed from "First Class" to "First Class With Arrear"
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
    // Updated column widths to fit within 6.4 inches
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
