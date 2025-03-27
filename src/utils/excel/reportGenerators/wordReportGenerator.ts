
import { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, BorderStyle, WidthType, AlignmentType, HeadingLevel, ImageRun } from 'docx';
import { saveAs } from 'file-saver';
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
  try {
    const doc = await createWordDocument(analysis, records, options);
    
    // Save the document using file-saver
    const buffer = await Packer.toBuffer(doc);
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });
    saveAs(blob, options.calculationMode === 'sgpa' 
      ? 'sgpa-analysis-report.docx' 
      : 'cgpa-analysis-report.docx');
  } catch (error) {
    console.error("Error generating Word document:", error);
    throw error;
  }
};

const createWordDocument = async (
  analysis: ResultAnalysis, 
  records: StudentRecord[],
  options: WordReportOptions
): Promise<Document> => {
  // Destructure options with defaults
  const { 
    logoImagePath = "/lovable-uploads/e199a42b-b04e-4918-8bb4-48f3583e7928.png", 
    department = "CSE",
    departmentFullName = "Computer Science and Engineering",
    calculationMode
  } = options;
  
  // Create document with explicit sections array
  const doc = new Document({
    sections: [],
  });
  
  // Build all sections in an array first
  const sectionsContent = [];
  
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
                    text: "K.S. RANGASAMY COLLEGE OF TECHNOLOGY, TIRUCHENGODE - 637 215",
                    bold: true,
                    size: 24, 
                  }),
                ],
              }),
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [
                  new TextRun({
                    text: "(An Autonomous Institute Affiliated to Anna University, Chennai)",
                    bold: false,
                    size: 22, 
                  }),
                ],
              }),
            ],
            verticalAlign: AlignmentType.CENTER,
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
                    text: "RESULT",
                    bold: true,
                    size: 22, 
                  }),
                ],
              }),
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [
                  new TextRun({
                    text: "ANALYSIS",
                    bold: true,
                    size: 22, 
                  }),
                ],
              }),
            ],
            verticalAlign: AlignmentType.CENTER,
          }),
        ],
      }),
    ],
  });
  
  sectionsContent.push(headerTable);
  
  // Add space after header
  sectionsContent.push(
    new Paragraph({
      spacing: {
        after: 200,
      },
    })
  );
  
  // College Information Section
  sectionsContent.push(
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
    })
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
    rows: [
      new TableRow({
        children: [
          new TableCell({ 
            children: [new Paragraph("College Name")]
          }),
          new TableCell({ 
            children: [new Paragraph("K. S. Rangasamy College of Technology")]
          }),
        ],
      }),
      new TableRow({
        children: [
          new TableCell({ 
            children: [new Paragraph("Department")]
          }),
          new TableCell({ 
            children: [new Paragraph(departmentFullName)]
          }),
        ],
      }),
      new TableRow({
        children: [
          new TableCell({ 
            children: [new Paragraph("Total Students")]
          }),
          new TableCell({ 
            children: [new Paragraph(analysis.totalStudents.toString())]
          }),
        ],
      }),
      new TableRow({
        children: [
          new TableCell({ 
            children: [new Paragraph("Calculation Mode")]
          }),
          new TableCell({ 
            children: [new Paragraph(calculationModeDisplay)]
          }),
        ],
      }),
    ],
  });
  
  sectionsContent.push(collegeInfoTable);
  
  // Add space 
  sectionsContent.push(
    new Paragraph({
      spacing: {
        after: 200,
      },
    })
  );
  
  // Performance Summary Section
  sectionsContent.push(
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
    })
  );
  
  // Performance Text paragraphs
  if (calculationMode === 'sgpa') {
    // For SGPA mode
    sectionsContent.push(
      new Paragraph({
        children: [
          new TextRun({ 
            text: "Average SGPA: ", 
            bold: true,
            size: 24,
          }),
          new TextRun({
            text: analysis.averageCGPA.toFixed(2),
            size: 24,
          }),
        ],
      }),
      new Paragraph({
        children: [
          new TextRun({ 
            text: "Highest SGPA: ", 
            bold: true,
            size: 24,
          }),
          new TextRun({
            text: analysis.highestSGPA.toFixed(2),
            size: 24,
          }),
        ],
      }),
      new Paragraph({
        children: [
          new TextRun({ 
            text: "Lowest SGPA: ", 
            bold: true,
            size: 24,
          }),
          new TextRun({
            text: analysis.lowestSGPA.toFixed(2),
            size: 24,
          }),
        ],
      }),
      new Paragraph({
        children: [
          new TextRun({ 
            text: "Pass Percentage: ", 
            bold: true,
            size: 24,
          }),
          new TextRun({
            text: analysis.singleFileClassification.passPercentage.toFixed(2) + "%",
            size: 24,
          }),
        ],
      })
    );
  } else {
    // For CGPA mode
    if (analysis.cgpaAnalysis) {
      sectionsContent.push(
        new Paragraph({
          children: [
            new TextRun({ 
              text: "Average CGPA: ", 
              bold: true,
              size: 24,
            }),
            new TextRun({
              text: analysis.cgpaAnalysis.averageCGPA.toFixed(2),
              size: 24,
            }),
          ],
        }),
        new Paragraph({
          children: [
            new TextRun({ 
              text: "Highest CGPA: ", 
              bold: true,
              size: 24,
            }),
            new TextRun({
              text: analysis.cgpaAnalysis.highestCGPA.toFixed(2),
              size: 24,
            }),
          ],
        }),
        new Paragraph({
          children: [
            new TextRun({ 
              text: "Lowest CGPA: ", 
              bold: true,
              size: 24,
            }),
            new TextRun({
              text: analysis.cgpaAnalysis.lowestCGPA.toFixed(2),
              size: 24,
            }),
          ],
        }),
        new Paragraph({
          children: [
            new TextRun({ 
              text: "Pass Percentage: ", 
              bold: true,
              size: 24,
            }),
            new TextRun({
              text: analysis.multipleFileClassification.passPercentage.toFixed(2) + "%",
              size: 24,
            }),
          ],
        })
      );
    }
  }
  
  // Classification Section
  sectionsContent.push(
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
    })
  );
  
  // Classification Table
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
    rows: [
      new TableRow({
        children: [
          new TableCell({ 
            children: [new Paragraph("Current semester")],
            columnSpan: 3,
          }),
          new TableCell({ 
            children: [new Paragraph("Upto this semester")],
            columnSpan: 3,
          }),
        ],
      }),
      new TableRow({
        children: [
          new TableCell({ 
            children: [new Paragraph("Distinction")]
          }),
          new TableCell({ 
            children: [new Paragraph("First class")]
          }),
          new TableCell({ 
            children: [new Paragraph("Second class")]
          }),
          new TableCell({ 
            children: [new Paragraph("Distinction")]
          }),
          new TableCell({ 
            children: [new Paragraph("First class")]
          }),
          new TableCell({ 
            children: [new Paragraph("Second class")]
          }),
        ],
      }),
      new TableRow({
        children: [
          new TableCell({ 
            children: [new Paragraph(analysis.singleFileClassification.distinction.toString())]
          }),
          new TableCell({ 
            children: [new Paragraph(analysis.singleFileClassification.firstClassWOA.toString())]
          }),
          new TableCell({ 
            children: [new Paragraph(analysis.singleFileClassification.secondClassWOA.toString())]
          }),
          new TableCell({ 
            children: [new Paragraph(analysis.multipleFileClassification.distinction.toString())]
          }),
          new TableCell({ 
            children: [new Paragraph(analysis.multipleFileClassification.firstClassWOA.toString())]
          }),
          new TableCell({ 
            children: [new Paragraph(analysis.multipleFileClassification.secondClassWOA.toString())]
          }),
        ],
      }),
    ],
  });
  
  sectionsContent.push(classificationTable);
  
  // Rank Analysis Section
  sectionsContent.push(
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
    })
  );
  
  // Rank Analysis Table - Only display top 3 students
  const topPerformersBySGPA = analysis.topPerformers.slice(0, 3);
  let topPerformersByCGPA: { id: string; cgpa: number }[] = [];
  
  if (analysis.cgpaAnalysis && analysis.cgpaAnalysis.toppersList) {
    topPerformersByCGPA = analysis.cgpaAnalysis.toppersList.slice(0, 3);
  }
  
  const rankTableRows = [];
  
  // Header row
  rankTableRows.push(
    new TableRow({
      children: [
        new TableCell({ 
          children: [new Paragraph("Rank in this semester")],
          columnSpan: 3,
        }),
        new TableCell({ 
          children: [new Paragraph("Rank up to this semester")],
          columnSpan: 3,
        }),
      ],
    })
  );
  
  // Column header row
  rankTableRows.push(
    new TableRow({
      children: [
        new TableCell({ children: [new Paragraph("S.No")] }),
        new TableCell({ children: [new Paragraph("Name of the student")] }),
        new TableCell({ children: [new Paragraph("SGPA")] }),
        new TableCell({ children: [new Paragraph("S.No")] }),
        new TableCell({ children: [new Paragraph("Name of the student")] }),
        new TableCell({ children: [new Paragraph("CGPA")] }),
      ],
    })
  );
  
  // Add data rows - match the number of rows to display (limit to 3)
  const maxRankRows = Math.max(topPerformersBySGPA.length, topPerformersByCGPA.length);
  for (let i = 0; i < maxRankRows; i++) {
    const sgpaData = topPerformersBySGPA[i] || { id: "", sgpa: 0 };
    const cgpaData = topPerformersByCGPA[i] || { id: "", cgpa: 0 };
    
    rankTableRows.push(
      new TableRow({
        children: [
          new TableCell({ children: [new Paragraph((i + 1).toString())] }),
          new TableCell({ children: [new Paragraph(sgpaData.id)] }),
          new TableCell({ children: [new Paragraph(sgpaData.sgpa.toFixed(1))] }),
          new TableCell({ children: [new Paragraph((i + 1).toString())] }),
          new TableCell({ children: [new Paragraph(cgpaData.id)] }),
          new TableCell({ children: [new Paragraph(cgpaData.cgpa.toFixed(1))] }),
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
    rows: rankTableRows,
  });
  
  sectionsContent.push(rankTable);

  // Add all generated content to document
  doc.addSection({
    children: sectionsContent,
  });

  return doc;
};
