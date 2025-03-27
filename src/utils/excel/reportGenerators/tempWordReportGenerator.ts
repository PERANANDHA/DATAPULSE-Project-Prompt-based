
import { saveAs } from 'file-saver';
import { ResultAnalysis, StudentRecord } from '../types';
import { Document, Packer, Paragraph, TextRun, AlignmentType, Table, TableRow, TableCell, WidthType, BorderStyle } from 'docx';

// Interface for Word report options
interface WordReportOptions {
  logoImagePath?: string;
  department?: string;
  departmentFullName?: string;
  calculationMode?: 'sgpa' | 'cgpa';
}

// Function to download Word report
export const downloadWordReport = async (
  analysis: ResultAnalysis, 
  records: StudentRecord[], 
  options: WordReportOptions = {}
): Promise<void> => {
  try {
    // Create Word document
    const doc = createWordDocument(analysis, records, options);

    // Generate blob and download
    const buffer = await Packer.toBuffer(doc);
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });
    saveAs(blob, 'result-analysis-report.docx');

  } catch (error) {
    console.error('Error generating Word report:', error);
    throw error;
  }
};

// Function to create Word document
const createWordDocument = (
  analysis: ResultAnalysis, 
  records: StudentRecord[],
  options: WordReportOptions
): Document => {
  // Create simple document
  const doc = new Document({
    sections: [{
      properties: {},
      children: [
        new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [
            new TextRun({
              text: "END SEMESTER RESULT ANALYSIS",
              bold: true,
              size: 28
            })
          ]
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [
            new TextRun({
              text: `${options.department || 'CSE'} Department - ${options.calculationMode?.toUpperCase() || 'SGPA'} Analysis`,
              bold: true,
              size: 24
            })
          ]
        }),
        
        // College Info
        new Paragraph({
          children: [
            new TextRun({
              text: "College Information",
              bold: true,
              size: 24
            })
          ]
        }),
        createSimpleTable([
          ["College Name", "K. S. Rangasamy College of Technology"],
          ["Department", options.departmentFullName || "Computer Science and Engineering"],
          ["Total Students", analysis.totalStudents.toString()],
          ["Average SGPA", analysis.averageCGPA.toFixed(2)],
          ["Highest SGPA", analysis.highestSGPA.toFixed(2)],
          ["Lowest SGPA", analysis.lowestSGPA.toFixed(2)]
        ]),
        
        // Top Performers
        new Paragraph({
          children: [
            new TextRun({
              text: "Top Performers",
              bold: true,
              size: 24
            })
          ]
        }),
        createSimpleTable(
          [["Rank", "Registration Number", "SGPA"]]
          .concat(
            analysis.topPerformers.map((student, index) => [
              (index + 1).toString(),
              student.id,
              student.sgpa.toFixed(2)
            ])
          )
        ),
        
        // Grade Distribution
        new Paragraph({
          children: [
            new TextRun({
              text: "Grade Distribution",
              bold: true,
              size: 24
            })
          ]
        }),
        createSimpleTable(
          [["Grade", "Count", "Percentage"]]
          .concat(
            analysis.gradeDistribution.map(grade => [
              grade.name,
              grade.count.toString(),
              analysis.totalGrades > 0 ? 
                ((grade.count / analysis.totalGrades) * 100).toFixed(2) + "%" : 
                "0%"
            ])
          )
        )
      ]
    }]
  });
  
  return doc;
};

// Helper function to create a simple table
const createSimpleTable = (data: string[][]): Table => {
  return new Table({
    width: {
      size: 100,
      type: WidthType.PERCENTAGE
    },
    rows: data.map((row, rowIndex) => {
      return new TableRow({
        children: row.map((cell, cellIndex) => {
          return new TableCell({
            children: [
              new Paragraph({
                alignment: cellIndex === 0 ? AlignmentType.LEFT : AlignmentType.CENTER,
                children: [
                  new TextRun({
                    text: cell,
                    bold: rowIndex === 0, // Make header row bold
                    size: 22
                  })
                ]
              })
            ],
            borders: {
              top: { style: BorderStyle.SINGLE, size: 1 },
              bottom: { style: BorderStyle.SINGLE, size: 1 },
              left: { style: BorderStyle.SINGLE, size: 1 },
              right: { style: BorderStyle.SINGLE, size: 1 }
            }
          });
        })
      });
    })
  });
};
