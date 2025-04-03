
import { 
  Document, Paragraph, Table, TableRow, TableCell, 
  HeadingLevel, TabStopPosition, TabStopType, AlignmentType,
  TextRun, BorderStyle, WidthType, TableLayoutType,
  ShadingType, ITableOptions
} from 'docx';

// Add the currentSemesterCodes parameter
export const generateWordReport = (analysis: any, studentRecords: any[], currentSemesterCodes: string[]) => {
  const document = new Document({
    sections: [{
      properties: {},
      children: [
        createHeader(),
        createSummaryTable(analysis),
        
        // Use only current semester subjects for these sections
        createEndSemesterAnalysis(analysis, currentSemesterCodes),
        createPerformanceSummary(analysis, currentSemesterCodes),
        createIndividualStudentPerformance(analysis, currentSemesterCodes),
        
        // Use all subjects (cumulative) for these sections
        createClassification(analysis),
        createRankAnalysis(analysis)
      ]
    }]
  });
  
  return document;
};

const createHeader = () => {
  return new Paragraph({
    text: "END SEMESTER EXAMINATION RESULTS ANALYSIS",
    heading: HeadingLevel.HEADING_1,
    alignment: AlignmentType.CENTER,
    spacing: {
      after: 200
    }
  });
};

const createSummaryTable = (analysis: any) => {
  return new Table({
    width: {
      size: 100,
      type: WidthType.PERCENTAGE
    },
    rows: [
      new TableRow({
        children: [
          new TableCell({ 
            children: [new Paragraph("Total Students")],
            width: {
              size: 50,
              type: WidthType.PERCENTAGE
            }
          }),
          new TableCell({ 
            children: [new Paragraph(analysis.uniqueStudentCount.toString())],
            width: {
              size: 50,
              type: WidthType.PERCENTAGE
            }
          })
        ]
      }),
      new TableRow({
        children: [
          new TableCell({ children: [new Paragraph("Average GPA")] }),
          new TableCell({ children: [new Paragraph(analysis.averageGpa.toFixed(2))] })
        ]
      }),
      new TableRow({
        children: [
          new TableCell({ children: [new Paragraph("Pass Percentage")] }),
          new TableCell({ 
            children: [
              new Paragraph(
                `${((analysis.studentSgpaDetails.filter((s: any) => !s.hasArrears).length / 
                  (analysis.uniqueStudentCount || 1)) * 100).toFixed(2)}%`
              )
            ] 
          })
        ]
      })
    ]
  });
};

// Modified to use only current semester subjects
const createEndSemesterAnalysis = (analysis: any, currentSemesterCodes: string[]) => {
  // Use the current semester subject performance
  const subjectPerformance = analysis.currentSemesterSubjectPerformance || [];

  const rows = [
    new TableRow({
      tableHeader: true,
      children: [
        new TableCell({ children: [new Paragraph("Subject Code")] }),
        new TableCell({ children: [new Paragraph("Total Students")] }),
        new TableCell({ children: [new Paragraph("Passed")] }),
        new TableCell({ children: [new Paragraph("Failed")] }),
        new TableCell({ children: [new Paragraph("Pass %")] })
      ]
    }),
    ...subjectPerformance.map((subject: any) => 
      new TableRow({
        children: [
          new TableCell({ children: [new Paragraph(subject.subjectCode)] }),
          new TableCell({ children: [new Paragraph(subject.studentCount.toString())] }),
          new TableCell({ children: [new Paragraph(subject.passedCount.toString())] }),
          new TableCell({ children: [new Paragraph(subject.failedCount.toString())] }),
          new TableCell({ children: [new Paragraph(subject.passPercentage.toFixed(2) + '%')] })
        ]
      })
    )
  ];

  return [
    new Paragraph({
      text: "END SEMESTER RESULT ANALYSIS",
      heading: HeadingLevel.HEADING_2,
      spacing: {
        before: 400,
        after: 200
      }
    }),
    new Table({
      width: {
        size: 100,
        type: WidthType.PERCENTAGE
      },
      rows
    })
  ];
};

// Modified to use only current semester subjects
const createPerformanceSummary = (analysis: any, currentSemesterCodes: string[]) => {
  // Use current semester subject performance
  const subjectPerformance = analysis.currentSemesterSubjectPerformance || [];
  
  const rows = [
    new TableRow({
      tableHeader: true,
      children: [
        new TableCell({ children: [new Paragraph("Subject Code")] }),
        new TableCell({ children: [new Paragraph("Average Grade Points")] }),
        new TableCell({ children: [new Paragraph("Performance")] })
      ]
    }),
    ...subjectPerformance.map((subject: any) => {
      const performance = getPerformanceLabel(subject.averageGrade);
      return new TableRow({
        children: [
          new TableCell({ children: [new Paragraph(subject.subjectCode)] }),
          new TableCell({ children: [new Paragraph(subject.averageGrade.toFixed(2))] }),
          new TableCell({ children: [new Paragraph(performance)] })
        ]
      });
    })
  ];

  return [
    new Paragraph({
      text: "PERFORMANCE SUMMARY",
      heading: HeadingLevel.HEADING_2,
      spacing: {
        before: 400,
        after: 200
      }
    }),
    new Table({
      width: {
        size: 100,
        type: WidthType.PERCENTAGE
      },
      rows
    })
  ];
};

// Modified to use only current semester subjects
const createIndividualStudentPerformance = (analysis: any, currentSemesterCodes: string[]) => {
  // Use current semester student GPAs
  const studentGpas = analysis.currentSemesterStudentGpas || [];
  
  const sortedGpas = [...studentGpas].sort((a, b) => b.sgpa - a.sgpa);
  
  const rows = [
    new TableRow({
      tableHeader: true,
      children: [
        new TableCell({ children: [new Paragraph("Rank")] }),
        new TableCell({ children: [new Paragraph("Registration No.")] }),
        new TableCell({ children: [new Paragraph("GPA")] }),
        new TableCell({ children: [new Paragraph("Status")] })
      ]
    }),
    ...sortedGpas.slice(0, 10).map((student, index) => 
      new TableRow({
        children: [
          new TableCell({ children: [new Paragraph((index + 1).toString())] }),
          new TableCell({ children: [new Paragraph(student.id)] }),
          new TableCell({ children: [new Paragraph(student.sgpa.toFixed(2))] }),
          new TableCell({ 
            children: [
              new Paragraph(
                student.hasArrears 
                  ? "Has Arrears" 
                  : student.sgpa < 6.0 
                    ? "Below 6.0" 
                    : "Good Standing"
              )
            ] 
          })
        ]
      })
    )
  ];

  return [
    new Paragraph({
      text: "INDIVIDUAL STUDENT PERFORMANCE",
      heading: HeadingLevel.HEADING_2,
      spacing: {
        before: 400,
        after: 200
      }
    }),
    new Table({
      width: {
        size: 100,
        type: WidthType.PERCENTAGE
      },
      rows
    })
  ];
};

// Use all subjects (cumulative data)
const createClassification = (analysis: any) => {
  const { performanceCategories } = analysis;
  
  const rows = [
    new TableRow({
      tableHeader: true,
      children: [
        new TableCell({ children: [new Paragraph("Performance Category")] }),
        new TableCell({ children: [new Paragraph("Number of Students")] }),
        new TableCell({ children: [new Paragraph("Percentage")] })
      ]
    }),
    ...Object.entries(performanceCategories).map(([category, count]: [string, any]) => 
      new TableRow({
        children: [
          new TableCell({ children: [new Paragraph(formatCategoryName(category))] }),
          new TableCell({ children: [new Paragraph(count.toString())] }),
          new TableCell({ 
            children: [
              new Paragraph(
                ((count / (analysis.uniqueStudentCount || 1)) * 100).toFixed(2) + '%'
              )
            ] 
          })
        ]
      })
    )
  ];

  return [
    new Paragraph({
      text: "CLASSIFICATION",
      heading: HeadingLevel.HEADING_2,
      spacing: {
        before: 400,
        after: 200
      }
    }),
    new Table({
      width: {
        size: 100,
        type: WidthType.PERCENTAGE
      },
      rows
    })
  ];
};

// Use all subjects (cumulative data)
const createRankAnalysis = (analysis: any) => {
  const studentGpas = [...analysis.studentSgpaDetails].sort((a, b) => b.sgpa - a.sgpa);
  
  const topTenAverage = studentGpas.slice(0, 10).reduce((sum, student) => sum + student.sgpa, 0) / 10;
  const bottomTenAverage = studentGpas.slice(-10).reduce((sum, student) => sum + student.sgpa, 0) / 10;
  
  return [
    new Paragraph({
      text: "RANK ANALYSIS",
      heading: HeadingLevel.HEADING_2,
      spacing: {
        before: 400,
        after: 200
      }
    }),
    new Table({
      width: {
        size: 100,
        type: WidthType.PERCENTAGE
      },
      rows: [
        new TableRow({
          children: [
            new TableCell({ children: [new Paragraph("Topper")] }),
            new TableCell({ 
              children: [
                new Paragraph(
                  studentGpas.length > 0 
                    ? `${studentGpas[0].id} (${studentGpas[0].sgpa.toFixed(2)})` 
                    : "N/A"
                )
              ] 
            })
          ]
        }),
        new TableRow({
          children: [
            new TableCell({ children: [new Paragraph("Top 10 Average")] }),
            new TableCell({ children: [new Paragraph(topTenAverage.toFixed(2))] })
          ]
        }),
        new TableRow({
          children: [
            new TableCell({ children: [new Paragraph("Bottom 10 Average")] }),
            new TableCell({ children: [new Paragraph(bottomTenAverage.toFixed(2))] })
          ]
        }),
        new TableRow({
          children: [
            new TableCell({ children: [new Paragraph("Class Average")] }),
            new TableCell({ children: [new Paragraph(analysis.averageGpa.toFixed(2))] })
          ]
        })
      ]
    })
  ];
};

const getPerformanceLabel = (score: number) => {
  if (score >= 9.5) return "Outstanding";
  if (score >= 9.0) return "Excellent";
  if (score >= 8.0) return "Very Good";
  if (score >= 7.0) return "Good";
  if (score >= 6.0) return "Average";
  if (score >= 5.0) return "Satisfactory";
  return "Poor";
};

const formatCategoryName = (category: string) => {
  const formatted = category
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, str => str.toUpperCase());
  
  return formatted;
};
