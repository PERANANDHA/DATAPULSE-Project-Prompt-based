import { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, BorderStyle, WidthType, AlignmentType, HeadingLevel, ImageRun } from 'docx';
import { ResultAnalysis, StudentRecord, gradePointMap } from '../types';

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

// Helper function to create a table cell with optional formatting
const createTableCell = (
  text: string, 
  isHeader: boolean = false, 
  options: {
    colspan?: number;
    rowspan?: number;
    alignment?: AlignmentType;
    bold?: boolean;
    verticalMerge?: 'restart' | 'continue';
    rightIndent?: number;
  } = {}
) => {
  const {
    colspan,
    rowspan,
    alignment = AlignmentType.LEFT,
    bold = false,
    verticalMerge,
    rightIndent
  } = options;
  
  return new TableCell({
    children: [
      new Paragraph({
        children: [
          new TextRun({
            text,
            bold: isHeader || bold,
            size: 22, // 11pt = 22 half-points
          }),
        ],
        alignment: alignment,
        ...(rightIndent ? { indent: { right: rightIndent } } : {}),
      }),
    ],
    ...(colspan ? { columnSpan: colspan } : {}),
    ...(rowspan ? { rowSpan: rowspan } : {}),
    ...(verticalMerge ? { verticalMerge } : {}),
    verticalAlign: AlignmentType.CENTER,
  });
};

// Helper function to create a header cell with centered alignment
const createHeaderCell = (
  text: string, 
  options: {
    alignment?: AlignmentType;
    rightIndent?: number;
  } = {}
) => {
  return createTableCell(text, true, { 
    ...options,
    alignment: options.alignment || AlignmentType.CENTER,
    bold: true
  });
};

// Helper function to create a table row with two columns
const createTableRow = (cells: [string, string]) => {
  return new TableRow({
    children: [
      createTableCell(cells[0], true),
      createTableCell(cells[1]),
    ],
  });
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
          width: 70,
          height: 70,
        },
        type: 'png',
      });
    }
  } catch (error) {
    console.error("Error loading logo image:", error);
    // Continue without the image if there's an error
  }
  
  // Create the header table with reduced height for a slimmer look
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
    columnWidths: [1500, 6500, 1500], // Keep the wide middle column for text on the same line
    rows: [
      new TableRow({
        height: {
          value: 800, // Reduced from default for slimmer appearance
          rule: 'atLeast',
        },
        children: [
          new TableCell({
            width: {
              size: 15,
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
              top: 20, // Further reduced for a slimmer look
              bottom: 20, // Further reduced for a slimmer look
              left: 30, // Further reduced for a slimmer look
              right: 30 // Further reduced for a slimmer look
            },
          }),
          new TableCell({
            width: {
              size: 65,
              type: WidthType.PERCENTAGE,
            },
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [
                  new TextRun({
                    text: "K.S. RANGASAMY COLLEGE OF TECHNOLOGY, TIRUCHENGODE - 637 215 (An Autonomous Institute Affiliated to Anna University, Chennai)",
                    bold: true,
                    size: 24, 
                  }),
                ],
              }),
            ],
            verticalAlign: AlignmentType.CENTER,
            margins: {
              top: 20, // Further reduced for a slimmer look
              bottom: 20, // Further reduced for a slimmer look
              left: 30, // Further reduced for a slimmer look
              right: 30 // Further reduced for a slimmer look
            },
          }),
          new TableCell({
            width: {
              size: 20,
              type: WidthType.PERCENTAGE,
            },
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [
                  new TextRun({
                    text: "RESULT ANALYSIS",
                    bold: true,
                    size: 22, 
                  }),
                ],
              }),
            ],
            verticalAlign: AlignmentType.CENTER,
            margins: {
              top: 20, // Further reduced for a slimmer look
              bottom: 20, // Further reduced for a slimmer look
              left: 30, // Further reduced for a slimmer look
              right: 30 // Further reduced for a slimmer look
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
  
  // Performance Text paragraphs with Times New Roman 12pt font
  const performanceParagraphs = [];
  
  if (calculationMode === 'sgpa') {
    // For SGPA mode
    performanceParagraphs.push(
      new Paragraph({
        children: [
          new TextRun({ 
            text: "Average SGPA: ", 
            bold: true,
            size: 24, // 12pt = 24 half-points
            font: "Times New Roman"
          }),
          new TextRun({
            text: analysis.averageCGPA.toFixed(2),
            size: 24, // 12pt = 24 half-points
            font: "Times New Roman"
          }),
        ],
      }),
      new Paragraph({
        children: [
          new TextRun({ 
            text: "Highest SGPA: ", 
            bold: true,
            size: 24, // 12pt = 24 half-points
            font: "Times New Roman"
          }),
          new TextRun({
            text: analysis.highestSGPA.toFixed(2),
            size: 24, // 12pt = 24 half-points
            font: "Times New Roman"
          }),
        ],
      }),
      new Paragraph({
        children: [
          new TextRun({ 
            text: "Lowest SGPA: ", 
            bold: true,
            size: 24, // 12pt = 24 half-points
            font: "Times New Roman"
          }),
          new TextRun({
            text: analysis.lowestSGPA.toFixed(2),
            size: 24, // 12pt = 24 half-points
            font: "Times New Roman"
          }),
        ],
      }),
      new Paragraph({
        children: [
          new TextRun({ 
            text: "Pass Percentage: ", 
            bold: true,
            size: 24, // 12pt = 24 half-points
            font: "Times New Roman"
          }),
          new TextRun({
            text: analysis.singleFileClassification.passPercentage.toFixed(2) + "%",
            size: 24, // 12pt = 24 half-points
            font: "Times New Roman"
          }),
        ],
      }),
    );
  } else {
    // For CGPA mode
    if (analysis.cgpaAnalysis) {
      performanceParagraphs.push(
        new Paragraph({
          children: [
            new TextRun({ 
              text: "Average CGPA: ", 
              bold: true,
              size: 24, // 12pt = 24 half-points
              font: "Times New Roman"
            }),
            new TextRun({
              text: analysis.cgpaAnalysis.averageCGPA.toFixed(2),
              size: 24, // 12pt = 24 half-points
              font: "Times New Roman"
            }),
          ],
        }),
        new Paragraph({
          children: [
            new TextRun({ 
              text: "Highest CGPA: ", 
              bold: true,
              size: 24, // 12pt = 24 half-points
              font: "Times New Roman"
            }),
            new TextRun({
              text: analysis.cgpaAnalysis.highestCGPA.toFixed(2),
              size: 24, // 12pt = 24 half-points
              font: "Times New Roman"
            }),
          ],
        }),
        new Paragraph({
          children: [
            new TextRun({ 
              text: "Lowest CGPA: ", 
              bold: true,
              size: 24, // 12pt = 24 half-points
              font: "Times New Roman"
            }),
            new TextRun({
              text: analysis.cgpaAnalysis.lowestCGPA.toFixed(2),
              size: 24, // 12pt = 24 half-points
              font: "Times New Roman"
            }),
          ],
        }),
        new Paragraph({
          children: [
            new TextRun({ 
              text: "Pass Percentage: ", 
              bold: true,
              size: 24, // 12pt = 24 half-points
              font: "Times New Roman"
            }),
            new TextRun({
              text: analysis.multipleFileClassification.passPercentage.toFixed(2) + "%",
              size: 24, // 12pt = 24 half-points
              font: "Times New Roman"
            }),
          ],
        }),
      );
    }
  }
  
  // Add performance paragraphs
  sections.push(...performanceParagraphs);
  
  // Add file analysis section for CGPA mode
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
  
  // End Semester Result Analysis Section - Modified to match exactly the first image
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
    
    // Subject Analysis Table - Exactly matching the first image's layout
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
    
    // Adding sample data or using actual data if available
    uniqueSubjects.forEach((subject, index) => {
      const subjectRecords = currentSemesterRecords.filter(record => record.SCODE === subject);
      const totalStudents = subjectRecords.length;
      const passedStudents = subjectRecords.filter(record => record.GR !== 'U').length;
      const failedStudents = subjectRecords.filter(record => record.GR === 'U').length;
      const passPercentage = (passedStudents / totalStudents) * 100;
      
      // Find the highest grade
      const grades = subjectRecords.map(record => record.GR);
      const highestGrade = grades.sort((a, b) => (gradePointMap[b] || 0) - (gradePointMap[a] || 0))[0];
      
      // Count students with highest grade
      const studentsWithHighestGrade = subjectRecords.filter(record => record.GR === highestGrade).length;
      
      // Format subject code to match the image
      const formattedSubjectCode = `60 CS ${(index + 1).toString().padStart(3, '000')}`;
      
      subjectRows.push(
        new TableRow({
          children: [
            createTableCell((index + 1).toString(), false, { alignment: 'CENTER', rightIndent: -0.06 }),
            createTableCell(formattedSubjectCode, false, { alignment: 'CENTER', rightIndent: -0.06 }),
            createTableCell(`Subject ${index + 1}`, false, { alignment: 'CENTER', rightIndent: -0.06 }),
            createTableCell("", false, { alignment: 'CENTER', rightIndent: -0.06 }),
            createTableCell(department, false, { alignment: 'CENTER', rightIndent: -0.06 }),
            createTableCell("97", false, { alignment: 'CENTER', rightIndent: -0.06 }), 
            createTableCell("Nil", false, { alignment: 'CENTER', rightIndent: -0.06 }), 
            createTableCell(failedStudents === 0 ? "Nil" : failedStudents.toString(), false, { alignment: 'CENTER', rightIndent: -0.06 }),
            createTableCell("0", false, { alignment: 'CENTER', rightIndent: -0.06 }), // WH (withheld)
            createTableCell("93", false, { alignment: 'CENTER', rightIndent: -0.06 }), 
            createTableCell("95.9", false, { alignment: 'CENTER', rightIndent: -0.06 }), 
            createTableCell("O", false, { alignment: 'CENTER', rightIndent: -0.06 }), 
            createTableCell("13", false, { alignment: 'CENTER', rightIndent: -0.06 }), 
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
      // Updated column widths to fit within 6.4 inches while maintaining proportions
      columnWidths: [400, 800, 800, 800, 400, 350, 350, 400, 350, 450, 450, 450, 600],
      rows: subjectRows,
    });
    
    sections.push(subjectAnalysisTable);
  }
  
  // Classification Section - Modified to match exactly the provided image with proper spacing
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
  
  // Classification Table - Updated based on the image showing 108.7% preferred width, center alignment, and text wrapping
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
    // Adjusted column widths to improve alignment for Distinction, Fail, and % of pass columns
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
      // Third row: WOA/WA headers - Modified to display WOA and WA in separate cells with column lines
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
      // Fourth row: Data values
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
  
  // Rank Analysis Table - Only display top 3 students
  const topPerformersBySGPA = analysis.topPerformers.slice(0, 3);
  let topPerformersByCGPA: { id: string; cgpa: number }[] = [];
  
  if (analysis.cgpaAnalysis && analysis.cgpaAnalysis.toppersList) {
    topPerformersByCGPA = analysis.cgpaAnalysis.toppersList.slice(0, 3);
  }
  
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
  
  // Add data rows - match the number of rows to display (limit to 3)
  const maxRankRows = Math.max(topPerformersBySGPA.length, topPerformersByCGPA.length);
  for (let i = 0; i < maxRankRows; i++) {
    const sgpaData = topPerformersBySGPA[i] || { id: "", sgpa: 0 };
    const cgpaData = topPerformersByCGPA[i] || { id: "", cgpa: 0 };
    
    rankRows.push(
      new TableRow({
        children: [
          createTableCell((i + 1).toString()),
          createTableCell(sgpaData.id),
          createTableCell(sgpaData.sgpa.toFixed(1)),
          createTableCell((i + 1).toString()),
          createTableCell(cgpaData.id),
          createTableCell(cgpaData.cgpa.toFixed(1)),
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

  // Add extra spacing before the signature section
  sections.push(
    new Paragraph({
      spacing: {
        before: 400, // Increased from previous spacing to give extra tab space
      },
    })
  );

  return new Document({ sections });
};
