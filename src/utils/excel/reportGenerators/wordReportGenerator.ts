
import { Document, Packer, Paragraph, TextRun, HeadingLevel, Table, TableRow, TableCell, BorderStyle, WidthType, AlignmentType } from 'docx';
import { ResultAnalysis, StudentRecord, gradePointMap } from '../types';

// Define the interface for customizations in the Word document
interface WordReportOptions {
  logoImagePath?: string;
  department?: string;
  departmentFullName?: string;
}

/**
 * Generate and download a Word document report from the analysis data
 */
export const downloadWordReport = (
  analysis: ResultAnalysis, 
  records: StudentRecord[],
  options: WordReportOptions = {}
): void => {
  try {
    // Default options
    const department = options.department || 'CSE';
    const departmentFullName = options.departmentFullName || 'Computer Science and Engineering';
    
    // Create a new Document
    const doc = new Document({
      sections: [{
        properties: {},
        children: [
          // Header with College name and logo
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [
              new TextRun({
                text: "K. S. Rangasamy College of Technology",
                bold: true,
                size: 36,
                color: "2563eb"
              })
            ]
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [
              new TextRun({
                text: departmentFullName,
                bold: true,
                size: 28,
                color: "1d4ed8"
              })
            ]
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [
              new TextRun({
                text: "END SEMESTER RESULT ANALYSIS",
                bold: true,
                size: 32,
                color: "2563eb"
              })
            ],
            spacing: {
              after: 400
            }
          }),
          
          // College Information Table
          new Paragraph({
            heading: HeadingLevel.HEADING_2,
            children: [
              new TextRun({
                text: "College Information",
                bold: true,
                size: 28
              })
            ],
            spacing: {
              after: 200
            }
          }),
          createInfoTable([
            ["College Name", "K. S. Rangasamy College of Technology"],
            ["Department", departmentFullName],
            ["Academic Year", "2023-2024"],
            ["Semester", "III"]
          ]),
          
          // Performance Summary
          new Paragraph({
            heading: HeadingLevel.HEADING_2,
            children: [
              new TextRun({
                text: "Performance Summary",
                bold: true, 
                size: 28
              })
            ],
            spacing: {
              before: 400,
              after: 200
            }
          }),
          createInfoTable([
            ["Total Students", analysis.totalStudents.toString()],
            ["Average SGPA", analysis.averageCGPA.toFixed(2)],
            ["Highest SGPA", analysis.highestSGPA.toFixed(2)],
            ["Lowest SGPA", analysis.lowestSGPA.toFixed(2)],
            ...(analysis.cgpaAnalysis ? [
              ["Average CGPA", analysis.cgpaAnalysis.averageCGPA.toFixed(2)],
              ["Highest CGPA", analysis.cgpaAnalysis.highestCGPA.toFixed(2)],
              ["Lowest CGPA", analysis.cgpaAnalysis.lowestCGPA.toFixed(2)]
            ] : [])
          ]),
          
          // Subject Performance
          new Paragraph({
            heading: HeadingLevel.HEADING_2,
            children: [
              new TextRun({
                text: "End Semester Result Analysis",
                bold: true,
                size: 28
              })
            ],
            spacing: {
              before: 400,
              after: 200
            }
          }),
          createSubjectTable(records, department),
          
          // Grade Distribution
          new Paragraph({
            heading: HeadingLevel.HEADING_2,
            children: [
              new TextRun({
                text: "Grade Distribution",
                bold: true,
                size: 28
              })
            ],
            spacing: {
              before: 400,
              after: 200
            }
          }),
          createGradeDistributionTable(analysis),
          
          // Top Performers
          new Paragraph({
            heading: HeadingLevel.HEADING_2,
            children: [
              new TextRun({
                text: "Top Performers",
                bold: true,
                size: 28
              })
            ],
            spacing: {
              before: 400,
              after: 200
            }
          }),
          createTopPerformersTable(analysis.topPerformers),
          
          // CGPA Rankings if available
          ...(analysis.cgpaAnalysis && analysis.cgpaAnalysis.studentCGPAs ? [
            new Paragraph({
              heading: HeadingLevel.HEADING_2,
              children: [
                new TextRun({
                  text: "CGPA Rankings",
                  bold: true,
                  size: 28
                })
              ],
              spacing: {
                before: 400,
                after: 200
              }
            }),
            createCGPARankingsTable(analysis.cgpaAnalysis.studentCGPAs)
          ] : []),
          
          // Signature section
          new Paragraph({
            heading: HeadingLevel.HEADING_2,
            children: [
              new TextRun({
                text: "Signatures",
                bold: true,
                size: 28
              })
            ],
            spacing: {
              before: 600,
              after: 200
            }
          }),
          createSignatureTable()
        ]
      }]
    });
    
    // Generate the document
    Packer.toBlob(doc).then(blob => {
      // Create a download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'result-analysis-report.docx';
      
      // Trigger download
      document.body.appendChild(link);
      link.click();
      
      // Clean up
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    });
    
  } catch (error) {
    console.error('Error generating Word report:', error);
    throw error;
  }
};

// Helper function to create a simple information table
function createInfoTable(rows: string[][]): Table {
  return new Table({
    width: {
      size: 100,
      type: WidthType.PERCENTAGE
    },
    borders: {
      top: { style: BorderStyle.SINGLE, size: 1, color: "cbd5e1" },
      bottom: { style: BorderStyle.SINGLE, size: 1, color: "cbd5e1" },
      left: { style: BorderStyle.SINGLE, size: 1, color: "cbd5e1" },
      right: { style: BorderStyle.SINGLE, size: 1, color: "cbd5e1" },
      insideHorizontal: { style: BorderStyle.SINGLE, size: 1, color: "cbd5e1" },
      insideVertical: { style: BorderStyle.SINGLE, size: 1, color: "cbd5e1" }
    },
    rows: rows.map(row => new TableRow({
      children: [
        new TableCell({
          width: {
            size: 30,
            type: WidthType.PERCENTAGE
          },
          children: [new Paragraph({
            children: [new TextRun({ text: row[0], bold: true })]
          })]
        }),
        new TableCell({
          width: {
            size: 70,
            type: WidthType.PERCENTAGE
          },
          children: [new Paragraph({
            children: [new TextRun({ text: row[1] })]
          })]
        })
      ]
    }))
  });
}

// Helper function to create subject performance table
function createSubjectTable(records: StudentRecord[], department: string): Table {
  // Get unique subjects
  const uniqueSubjects = [...new Set(records.map(record => record.SCODE))];
  
  // Create header row
  const headerRow = new TableRow({
    tableHeader: true,
    children: [
      "S.No", "Subject Code", "Subject Name", "Faculty Name", "Dept", 
      "App", "Absent", "Fail", "WH", "Passed", "% of pass"
    ].map(header => 
      new TableCell({
        shading: {
          fill: "e0e7ff"
        },
        children: [
          new Paragraph({
            children: [
              new TextRun({
                text: header,
                bold: true,
                color: "1e40af"
              })
            ]
          })
        ]
      })
    )
  });
  
  // Create data rows
  const dataRows = uniqueSubjects.map((subject, index) => {
    const subjectRecords = records.filter(record => record.SCODE === subject);
    const totalStudents = subjectRecords.length;
    const passedStudents = subjectRecords.filter(record => record.GR !== 'U').length;
    const failedStudents = totalStudents - passedStudents;
    const passPercentage = (passedStudents / totalStudents) * 100;
    
    return new TableRow({
      children: [
        new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: (index + 1).toString() })] })] }),
        new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: subject })] })] }),
        new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: `Subject ${index + 1}` })] })] }),
        new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "" })] })] }),
        new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: department })] })] }),
        new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: totalStudents.toString() })] })] }),
        new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Nil" })] })] }),
        new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: failedStudents ? failedStudents.toString() : "Nil" })] })] }),
        new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "1" })] })] }),
        new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: passedStudents.toString() })] })] }),
        new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: passPercentage.toFixed(1) })] })] })
      ]
    });
  });
  
  // Create the table
  return new Table({
    width: {
      size: 100,
      type: WidthType.PERCENTAGE
    },
    borders: {
      top: { style: BorderStyle.SINGLE, size: 1, color: "cbd5e1" },
      bottom: { style: BorderStyle.SINGLE, size: 1, color: "cbd5e1" },
      left: { style: BorderStyle.SINGLE, size: 1, color: "cbd5e1" },
      right: { style: BorderStyle.SINGLE, size: 1, color: "cbd5e1" },
      insideHorizontal: { style: BorderStyle.SINGLE, size: 1, color: "cbd5e1" },
      insideVertical: { style: BorderStyle.SINGLE, size: 1, color: "cbd5e1" }
    },
    rows: [headerRow, ...dataRows]
  });
}

// Helper function to create grade distribution table
function createGradeDistributionTable(analysis: ResultAnalysis): Table {
  // Create header row
  const headerRow = new TableRow({
    tableHeader: true,
    children: [
      "Grade", "Count", "Percentage"
    ].map(header => 
      new TableCell({
        shading: {
          fill: "e0e7ff"
        },
        children: [
          new Paragraph({
            children: [
              new TextRun({
                text: header,
                bold: true,
                color: "1e40af"
              })
            ]
          })
        ]
      })
    )
  });
  
  // Create data rows
  const dataRows = analysis.gradeDistribution.map(grade => {
    const percentage = analysis.totalGrades > 0 
      ? ((grade.count / analysis.totalGrades) * 100).toFixed(1) 
      : "0.0";
    
    return new TableRow({
      children: [
        new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: grade.name })] })] }),
        new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: grade.count.toString() })] })] }),
        new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: `${percentage}%` })] })] })
      ]
    });
  });
  
  // Create the table
  return new Table({
    width: {
      size: 100,
      type: WidthType.PERCENTAGE
    },
    borders: {
      top: { style: BorderStyle.SINGLE, size: 1, color: "cbd5e1" },
      bottom: { style: BorderStyle.SINGLE, size: 1, color: "cbd5e1" },
      left: { style: BorderStyle.SINGLE, size: 1, color: "cbd5e1" },
      right: { style: BorderStyle.SINGLE, size: 1, color: "cbd5e1" },
      insideHorizontal: { style: BorderStyle.SINGLE, size: 1, color: "cbd5e1" },
      insideVertical: { style: BorderStyle.SINGLE, size: 1, color: "cbd5e1" }
    },
    rows: [headerRow, ...dataRows]
  });
}

// Helper function to create top performers table
function createTopPerformersTable(topPerformers: { id: string; sgpa: number; grade: string }[]): Table {
  // Create header row
  const headerRow = new TableRow({
    tableHeader: true,
    children: [
      "S.No", "Registration Number", "SGPA"
    ].map(header => 
      new TableCell({
        shading: {
          fill: "e0e7ff"
        },
        children: [
          new Paragraph({
            children: [
              new TextRun({
                text: header,
                bold: true,
                color: "1e40af"
              })
            ]
          })
        ]
      })
    )
  });
  
  // Create data rows
  const dataRows = topPerformers.map((student, index) => {
    return new TableRow({
      children: [
        new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: (index + 1).toString() })] })] }),
        new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: student.id })] })] }),
        new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: student.sgpa.toFixed(2) })] })] })
      ]
    });
  });
  
  // Create the table
  return new Table({
    width: {
      size: 100,
      type: WidthType.PERCENTAGE
    },
    borders: {
      top: { style: BorderStyle.SINGLE, size: 1, color: "cbd5e1" },
      bottom: { style: BorderStyle.SINGLE, size: 1, color: "cbd5e1" },
      left: { style: BorderStyle.SINGLE, size: 1, color: "cbd5e1" },
      right: { style: BorderStyle.SINGLE, size: 1, color: "cbd5e1" },
      insideHorizontal: { style: BorderStyle.SINGLE, size: 1, color: "cbd5e1" },
      insideVertical: { style: BorderStyle.SINGLE, size: 1, color: "cbd5e1" }
    },
    rows: [headerRow, ...dataRows]
  });
}

// Helper function to create CGPA rankings table
function createCGPARankingsTable(studentCGPAs: { id: string; cgpa: number }[]): Table {
  // Sort students by CGPA in descending order and take top 10
  const topStudents = [...studentCGPAs]
    .sort((a, b) => b.cgpa - a.cgpa)
    .slice(0, 10);
  
  // Create header row
  const headerRow = new TableRow({
    tableHeader: true,
    children: [
      "S.No", "Registration Number", "CGPA"
    ].map(header => 
      new TableCell({
        shading: {
          fill: "e0e7ff"
        },
        children: [
          new Paragraph({
            children: [
              new TextRun({
                text: header,
                bold: true,
                color: "1e40af"
              })
            ]
          })
        ]
      })
    )
  });
  
  // Create data rows
  const dataRows = topStudents.map((student, index) => {
    return new TableRow({
      children: [
        new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: (index + 1).toString() })] })] }),
        new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: student.id })] })] }),
        new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: student.cgpa.toFixed(2) })] })] })
      ]
    });
  });
  
  // Create the table
  return new Table({
    width: {
      size: 100,
      type: WidthType.PERCENTAGE
    },
    borders: {
      top: { style: BorderStyle.SINGLE, size: 1, color: "cbd5e1" },
      bottom: { style: BorderStyle.SINGLE, size: 1, color: "cbd5e1" },
      left: { style: BorderStyle.SINGLE, size: 1, color: "cbd5e1" },
      right: { style: BorderStyle.SINGLE, size: 1, color: "cbd5e1" },
      insideHorizontal: { style: BorderStyle.SINGLE, size: 1, color: "cbd5e1" },
      insideVertical: { style: BorderStyle.SINGLE, size: 1, color: "cbd5e1" }
    },
    rows: [headerRow, ...dataRows]
  });
}

// Helper function to create signature table
function createSignatureTable(): Table {
  return new Table({
    width: {
      size: 100,
      type: WidthType.PERCENTAGE
    },
    borders: {
      top: { style: BorderStyle.NONE },
      bottom: { style: BorderStyle.NONE },
      left: { style: BorderStyle.NONE },
      right: { style: BorderStyle.NONE },
      insideHorizontal: { style: BorderStyle.NONE },
      insideVertical: { style: BorderStyle.NONE }
    },
    rows: [
      new TableRow({
        children: [
          new TableCell({
            width: { size: 25, type: WidthType.PERCENTAGE },
            borders: { top: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.NONE }, left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE } },
            children: [
              new Paragraph({ 
                alignment: AlignmentType.CENTER,
                spacing: { before: 600 },
                children: [new TextRun({ text: "Faculty" })] 
              })
            ]
          }),
          new TableCell({
            width: { size: 25, type: WidthType.PERCENTAGE },
            borders: { top: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.NONE }, left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE } },
            children: [
              new Paragraph({ 
                alignment: AlignmentType.CENTER,
                spacing: { before: 600 },
                children: [new TextRun({ text: "Class Advisor" })] 
              })
            ]
          }),
          new TableCell({
            width: { size: 25, type: WidthType.PERCENTAGE },
            borders: { top: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.NONE }, left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE } },
            children: [
              new Paragraph({ 
                alignment: AlignmentType.CENTER,
                spacing: { before: 600 },
                children: [new TextRun({ text: "HoD" })] 
              })
            ]
          }),
          new TableCell({
            width: { size: 25, type: WidthType.PERCENTAGE },
            borders: { top: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.NONE }, left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE } },
            children: [
              new Paragraph({ 
                alignment: AlignmentType.CENTER,
                spacing: { before: 600 },
                children: [new TextRun({ text: "Principal" })] 
              })
            ]
          })
        ]
      })
    ]
  });
}
