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
  
  // Create the header table
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
    columnWidths: [1500, 5500, 2500], // Explicit column widths for header table
    rows: [
      new TableRow({
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
              top: 100,
              bottom: 100,
              left: 150,
              right: 150
            },
          }),
          new TableCell({
            width: {
              size: 60,
              type: WidthType.PERCENTAGE,
            },
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [
                  new TextRun({
                    text: "K.S. RANGASAMY COLLEGE OF TECHNOLOGY, TIRUCHENGODE - 637 215",
                    bold: true,
                  }),
                ],
              }),
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [
                  new TextRun({
                    text: "(An Autonomous Institute Affiliated to Anna University, Chennai)",
                    bold: false,
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
              size: 25,
              type: WidthType.PERCENTAGE,
            },
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [
                  new TextRun({
                    text: "RESULT ANALYSIS",
                    bold: true,
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
    columnWidths: [3500, 6000], // Adjusted for better spacing
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
  
  // Performance Text paragraphs 
  const performanceParagraphs = [];
  
  if (calculationMode === 'sgpa') {
    // For SGPA mode
    performanceParagraphs.push(
      new Paragraph({
        children: [
          new TextRun({ text: "Average SGPA: ", bold: true }),
          new TextRun(analysis.averageCGPA.toFixed(2)),
        ],
      }),
      new Paragraph({
        children: [
          new TextRun({ text: "Highest SGPA: ", bold: true }),
          new TextRun(analysis.highestSGPA.toFixed(2)),
        ],
      }),
      new Paragraph({
        children: [
          new TextRun({ text: "Lowest SGPA: ", bold: true }),
          new TextRun(analysis.lowestSGPA.toFixed(2)),
        ],
      }),
      new Paragraph({
        children: [
          new TextRun({ text: "Pass Percentage: ", bold: true }),
          new TextRun(analysis.singleFileClassification.passPercentage.toFixed(2) + "%"),
        ],
      }),
    );
  } else {
    // For CGPA mode
    if (analysis.cgpaAnalysis) {
      performanceParagraphs.push(
        new Paragraph({
          children: [
            new TextRun({ text: "Average CGPA: ", bold: true }),
            new TextRun(analysis.cgpaAnalysis.averageCGPA.toFixed(2)),
          ],
        }),
        new Paragraph({
          children: [
            new TextRun({ text: "Highest CGPA: ", bold: true }),
            new TextRun(analysis.cgpaAnalysis.highestCGPA.toFixed(2)),
          ],
        }),
        new Paragraph({
          children: [
            new TextRun({ text: "Lowest CGPA: ", bold: true }),
            new TextRun(analysis.cgpaAnalysis.lowestCGPA.toFixed(2)),
          ],
        }),
        new Paragraph({
          children: [
            new TextRun({ text: "Pass Percentage: ", bold: true }),
            new TextRun(analysis.multipleFileClassification.passPercentage.toFixed(2) + "%"),
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
      columnWidths: [3000, 1500, 1500, 1500, 2000], // Added explicit column widths for better spacing
      rows: fileAnalysisTableRows,
    });
    
    sections.push(fileAnalysisTable);
  }
  
  // End Semester Result Analysis Section
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
    
    // Subject Analysis Table
    const subjectRows = [
      new TableRow({
        tableHeader: true,
        children: [
          createHeaderCell("S.No"),
          createHeaderCell("Subject Code"),
          createHeaderCell("Subject Name"),
          createHeaderCell("Faculty Name"),
          createHeaderCell("Dept"),
          createHeaderCell("App"),
          createHeaderCell("Ab"),
          createHeaderCell("Fail"),
          createHeaderCell("WH"),
          createHeaderCell("Passed"),
          createHeaderCell("% of pass"),
          createHeaderCell("Highest Grade"),
          createHeaderCell("No. of students"),
        ],
      }),
    ];
    
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
      
      // Generate subject name as "Subject X"
      const subjectName = `Subject ${index + 1}`;
      
      subjectRows.push(
        new TableRow({
          children: [
            createTableCell((index + 1).toString()),
            createTableCell(subject),
            createTableCell(subjectName),
            createTableCell(""), // Faculty name (empty)
            createTableCell(department),
            createTableCell(totalStudents.toString()),
            createTableCell("Nil"), // Absent
            createTableCell(failedStudents === 0 ? "Nil" : failedStudents.toString()),
            createTableCell("0"), // WH (withheld)
            createTableCell(passedStudents.toString()),
            createTableCell(passPercentage.toFixed(1)),
            createTableCell(highestGrade),
            createTableCell(studentsWithHighestGrade.toString()),
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
      // Fine-tuned column widths to prevent text wrapping - precise measurements
      columnWidths: [400, 1000, 1800, 1600, 600, 400, 400, 400, 400, 600, 700, 700, 900],
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
  
  // Classification Table
  const singleFileClassification = analysis.singleFileClassification;
  const multipleFileClassification = analysis.multipleFileClassification;
  
  const classificationTable = new Table({
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
    // Fine-tuned column widths for classification table to prevent text wrapping
    columnWidths: [700, 550, 550, 550, 550, 450, 600, 700, 550, 550, 550, 550, 450, 600],
    rows: [
      new TableRow({
        children: [
          createTableCell("Current semester", true, { colspan: 7, alignment: 'CENTER' }),
          createTableCell("Upto this semester", true, { colspan: 7, alignment: 'CENTER' }),
        ],
      }),
      new TableRow({
        children: [
          createTableCell("Distinction", true, { rowspan: 2, alignment: 'CENTER' }),
          createTableCell("First class", true, { colspan: 2, alignment: 'CENTER' }),
          createTableCell("Second class", true, { colspan: 2, alignment: 'CENTER' }),
          createTableCell("Fail", true, { rowspan: 2, alignment: 'CENTER' }),
          createTableCell("% of pass", true, { rowspan: 2, alignment: 'CENTER' }),
          createTableCell("Distinction", true, { rowspan: 2, alignment: 'CENTER' }),
          createTableCell("First class", true, { colspan: 2, alignment: 'CENTER' }),
          createTableCell("Second class", true, { colspan: 2, alignment: 'CENTER' }),
          createTableCell("Fail", true, { rowspan: 2, alignment: 'CENTER' }),
          createTableCell("% of pass", true, { rowspan: 2, alignment: 'CENTER' }),
        ],
      }),
      new TableRow({
        children: [
          createTableCell("WOA", true, { alignment: 'CENTER' }),
          createTableCell("WA", true, { alignment: 'CENTER' }),
          createTableCell("WOA", true, { alignment: 'CENTER' }),
          createTableCell("WA", true, { alignment: 'CENTER' }),
          createTableCell("WOA", true, { alignment: 'CENTER' }),
          createTableCell("WA", true, { alignment: 'CENTER' }),
          createTableCell("WOA", true, { alignment: 'CENTER' }),
          createTableCell("WA", true, { alignment: 'CENTER' }),
        ],
      }),
      new TableRow({
        children: [
          createTableCell(singleFileClassification.distinction.toString(), false, { alignment: 'CENTER' }),
          createTableCell(singleFileClassification.firstClassWOA.toString(), false, { alignment: 'CENTER' }),
          createTableCell(singleFileClassification.firstClassWA.toString(), false, { alignment: 'CENTER' }),
          createTableCell(singleFileClassification.secondClassWOA.toString(), false, { alignment: 'CENTER' }),
          createTableCell(singleFileClassification.secondClassWA.toString(), false, { alignment: 'CENTER' }),
          createTableCell(singleFileClassification.fail.toString(), false, { alignment: 'CENTER' }),
          createTableCell(singleFileClassification.passPercentage.toFixed(1), false, { alignment: 'CENTER' }),
          createTableCell(multipleFileClassification.distinction.toString(), false, { alignment: 'CENTER' }),
          createTableCell(multipleFileClassification.firstClassWOA.toString(), false, { alignment: 'CENTER' }),
          createTableCell(multipleFileClassification.firstClassWA.toString(), false, { alignment: 'CENTER' }),
          createTableCell(multipleFileClassification.secondClassWOA.toString(), false, { alignment: 'CENTER' }),
          createTableCell(multipleFileClassification.secondClassWA.toString(), false, { alignment: 'CENTER' }),
          createTableCell(multipleFileClassification.fail.toString(), false, { alignment: 'CENTER' }),
          createTableCell(multipleFileClassification.passPercentage.toFixed(1), false, { alignment: 'CENTER' }),
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
    columnWidths: [900, 2200, 1100, 900, 2200, 1100],
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
    columnWidths: [3500, 6000],
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
  
  // Individual Student Performance Section - ADDED FOR BOTH SGPA AND CGPA MODE
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
    columnWidths: [1100, 3300, 1600, 3500],
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

// Helper functions for creating table cells with different options
function createTableCell(
  text: string, 
  isHeader = false,
  options: {
    colspan?: number;
    rowspan?: number;
    alignment?: keyof typeof AlignmentType;
  } = {}
): TableCell {
  const { colspan, rowspan, alignment = 'CENTER' } = options;
  
  return new TableCell({
    children: [
      new Paragraph({
        alignment: alignment ? AlignmentType[alignment] : AlignmentType.CENTER,
        children: [
          new TextRun({
            text,
            bold: isHeader,
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
  });
}

function createHeaderCell(
  text: string,
  options: {
    colspan?: number;
    rowspan?: number;
    alignment?: keyof typeof AlignmentType;
  } = {}
): TableCell {
  return createTableCell(text, true, {
    ...options,
    alignment: options.alignment || 'CENTER',
  });
}

// Original helper function for simple table rows (kept for backward compatibility)
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
