
import { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, BorderStyle, WidthType, AlignmentType, HeadingLevel, ImageRun, Header, Footer, PageNumber, IImageOptions, ITableBordersOptions } from 'docx';
import { ResultAnalysis, StudentRecord, gradePointMap } from '../types';
import { calculateSGPA, calculateCGPA, hasArrears, getSubjectsWithArrears, getCurrentSemesterStudentRanks } from '../gradeUtils';

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
  const { logoImagePath, department, departmentFullName, calculationMode } = options;

  const document = new Document({
    sections: [
      {
        headers: {
          default: new Header({
            children: [
              new Paragraph({
                children: [
                  logoImagePath ? new ImageRun({
                    data: await fileToBuffer(logoImagePath),
                    transformation: {
                      width: 100,
                      height: 50,
                    },
                    altText: {
                      name: "CollegeLogo", // Added the required 'name' property
                      title: "College Logo",
                      description: "College Logo Image",
                    },
                    type: "png",
                  }) : null,
                  new TextRun({
                    text: departmentFullName || 'College Name',
                    size: 24,
                    break: 1,
                  }),
                ],
                alignment: AlignmentType.CENTER,
              }),
            ],
          }),
        },
        footers: {
          default: new Footer({
            children: [
              new Paragraph({
                children: [
                  new TextRun({
                    text: 'Page ',
                    size: 10,
                  }),
                  new TextRun({
                    children: [PageNumber.CURRENT],
                    size: 10,
                  }),
                  new TextRun({
                    text: ' of ',
                    size: 10,
                  }),
                  new TextRun({
                    children: [PageNumber.TOTAL_PAGES],
                    size: 10,
                  }),
                ],
                alignment: AlignmentType.CENTER,
              }),
            ],
          }),
        },
        children: [
          new Paragraph({
            text: 'End Semester Result Analysis',
            heading: HeadingLevel.TITLE,
            alignment: AlignmentType.CENTER,
          }),
          new Paragraph({
            text: `Department: ${department || 'N/A'}`,
            heading: HeadingLevel.HEADING_2,
            alignment: AlignmentType.CENTER,
          }),
          new Paragraph({ text: '', }), // Empty paragraph for spacing
          createCollegeInformationTable(departmentFullName),
          new Paragraph({ text: '', }), // Empty paragraph for spacing
          createAnalysisSummary(analysis, calculationMode),
          new Paragraph({ text: '', }), // Empty paragraph for spacing
          ...createRankingTables(analysis, records, options),
          new Paragraph({ text: '', }), // Empty paragraph for spacing
          createGradeDistributionChart(analysis),
          new Paragraph({ text: '', }), // Empty paragraph for spacing
          createSubjectPerformanceTable(analysis),
          new Paragraph({ text: '', }), // Empty paragraph for spacing
          createPassFailRatioChart(analysis),
          new Paragraph({ text: '', }), // Empty paragraph for spacing
          createTopPerformerTable(analysis),
          new Paragraph({ text: '', }), // Empty paragraph for spacing
          createNeedsImprovementTable(analysis),
        ],
      },
    ],
  });

  return document;
};

const fileToBuffer = async (url: string): Promise<Buffer> => {
  const response = await fetch(url);
  const arrayBuffer = await response.arrayBuffer();
  return Buffer.from(arrayBuffer);
};

const createCollegeInformationTable = (departmentFullName?: string): Table => {
  const rows = [
    new TableRow({
      children: [
        new TableCell({
          children: [new Paragraph({ 
            children: [
              new TextRun({
                text: 'College Name',
                bold: true,
              }),
            ],
          })],
          borders: getTableBorders(),
        }),
        new TableCell({
          children: [new Paragraph({ text: departmentFullName || 'N/A' })],
          borders: getTableBorders(),
        }),
      ],
    }),
    new TableRow({
      children: [
        new TableCell({
          children: [new Paragraph({
            children: [
              new TextRun({
                text: 'Accreditation',
                bold: true,
              }),
            ],
          })],
          borders: getTableBorders(),
        }),
        new TableCell({
          children: [new Paragraph({ text: 'NBA', })],
          borders: getTableBorders(),
        }),
      ],
    }),
  ];

  return new Table({
    rows: rows,
    width: {
      size: 100,
      type: WidthType.PERCENTAGE,
    },
  });
};

const createAnalysisSummary = (analysis: ResultAnalysis, calculationMode: 'sgpa' | 'cgpa'): Table => {
  const rows = [
    new TableRow({
      children: [
        new TableCell({
          children: [new Paragraph({
            children: [
              new TextRun({
                text: 'Total Students',
                bold: true,
              }),
            ],
          })],
          borders: getTableBorders(),
        }),
        new TableCell({
          children: [new Paragraph({ text: analysis.totalStudents.toString() })],
          borders: getTableBorders(),
        }),
      ],
    }),
    new TableRow({
      children: [
        new TableCell({
          children: [new Paragraph({
            children: [
              new TextRun({
                text: `Average ${calculationMode.toUpperCase()}`,
                bold: true,
              }),
            ],
          })],
          borders: getTableBorders(),
        }),
        new TableCell({
          children: [new Paragraph({ text: analysis.averageCGPA.toString() })],
          borders: getTableBorders(),
        }),
      ],
    }),
    new TableRow({
      children: [
        new TableCell({
          children: [new Paragraph({
            children: [
              new TextRun({
                text: 'Highest SGPA',
                bold: true,
              }),
            ],
          })],
          borders: getTableBorders(),
        }),
        new TableCell({
          children: [new Paragraph({ text: analysis.highestSGPA.toString() })],
          borders: getTableBorders(),
        }),
      ],
    }),
    new TableRow({
      children: [
        new TableCell({
          children: [new Paragraph({
            children: [
              new TextRun({
                text: 'Lowest SGPA',
                bold: true,
              }),
            ],
          })],
          borders: getTableBorders(),
        }),
        new TableCell({
          children: [new Paragraph({ text: analysis.lowestSGPA.toString() })],
          borders: getTableBorders(),
        }),
      ],
    }),
  ];

  return new Table({
    rows: rows,
    width: {
      size: 100,
      type: WidthType.PERCENTAGE,
    },
  });
};

const createRankingTables = (analysis: ResultAnalysis, records: StudentRecord[], options: WordReportOptions): Table[] => {
  const tables: Table[] = [];
  
  if (options.calculationMode === 'cgpa' && analysis.cgpaAnalysis) {
    const cgpaRankData = analysis.cgpaAnalysis.studentCGPAs
      .sort((a, b) => b.cgpa - a.cgpa)
      .slice(0, 10)
      .map((student, index) => {
        const rankNumber = index + 1;
        return [rankNumber.toString(), student.id, student.cgpa.toString()];
      });
    
    tables.push(createRankTable('Rank up to this semester', ['Rank', 'Register Number', 'CGPA'], cgpaRankData));
    
    if (analysis.currentSemesterFile) {
      const currentSemesterRecords = records.filter(
        record => record.fileSource === analysis.currentSemesterFile
      );
      
      const currentSemesterRanks = getCurrentSemesterStudentRanks(currentSemesterRecords);
      
      const sgpaRankData = currentSemesterRanks
        .slice(0, 10)
        .map((student, index) => {
          const rankNumber = index + 1;
          return [rankNumber.toString(), student.id, student.sgpa.toString()];
        });
      
      tables.push(createRankTable('Rank in this semester', ['Rank', 'Register Number', 'SGPA'], sgpaRankData));
    }
    
  } else {
    const sgpaRankData = analysis.studentSgpaDetails
      ?.sort((a, b) => b.sgpa - a.sgpa)
      .slice(0, 10)
      .map((student, index) => {
        const rankNumber = index + 1;
        return [rankNumber.toString(), student.id, student.sgpa.toString()];
      }) || [];
      
    tables.push(createRankTable('Rank Analysis', ['Rank', 'Register Number', 'SGPA'], sgpaRankData));
  }
  
  return tables;
};

const createRankTable = (title: string, headers: string[], data: string[][]): Table => {
  const headerRow = new TableRow({
    children: headers.map(header => new TableCell({
      children: [new Paragraph({
        children: [
          new TextRun({
            text: header,
            bold: true,
          }),
        ],
      })],
      borders: getTableBorders(),
    })),
  });

  const dataRows = data.map(row => new TableRow({
    children: row.map(cell => new TableCell({
      children: [new Paragraph({ text: cell })],
      borders: getTableBorders(),
    })),
  }));

  return new Table({
    rows: [headerRow, ...dataRows],
    width: {
      size: 100,
      type: WidthType.PERCENTAGE,
    },
  });
};

const createGradeDistributionChart = (analysis: ResultAnalysis): Paragraph => {
  return new Paragraph({
    children: [
      new TextRun({
        text: 'Grade Distribution Chart - Placeholder',
        italics: true,
      }),
    ],
  });
};

const createSubjectPerformanceTable = (analysis: ResultAnalysis): Table => {
  const headers = ['Subject Code', 'Pass Percentage', 'Fail Percentage'];

  const headerRow = new TableRow({
    children: headers.map(header => new TableCell({
      children: [new Paragraph({
        children: [
          new TextRun({
            text: header,
            bold: true,
          }),
        ],
      })],
      borders: getTableBorders(),
    })),
  });

  const dataRows = analysis.subjectPerformance.map(subject => new TableRow({
    children: [
      new TableCell({
        children: [new Paragraph({ text: subject.subject })],
        borders: getTableBorders(),
      }),
      new TableCell({
        children: [new Paragraph({ text: subject.pass.toString() })],
        borders: getTableBorders(),
      }),
      new TableCell({
        children: [new Paragraph({ text: subject.fail.toString() })],
        borders: getTableBorders(),
      }),
    ],
  }));

  return new Table({
    rows: [headerRow, ...dataRows],
    width: {
      size: 100,
      type: WidthType.PERCENTAGE,
    },
  });
};

const createPassFailRatioChart = (analysis: ResultAnalysis): Paragraph => {
  return new Paragraph({
    children: [
      new TextRun({
        text: 'Pass/Fail Ratio Chart - Placeholder',
        italics: true,
      }),
    ],
  });
};

const createTopPerformerTable = (analysis: ResultAnalysis): Table => {
  const headers = ['Rank', 'Register Number', 'SGPA', 'Best Grade'];

  const headerRow = new TableRow({
    children: headers.map(header => new TableCell({
      children: [new Paragraph({
        children: [
          new TextRun({
            text: header,
            bold: true,
          }),
        ],
      })],
      borders: getTableBorders(),
    })),
  });

  const dataRows = analysis.topPerformers.map((student, index) => new TableRow({
    children: [
      new TableCell({
        children: [new Paragraph({ text: (index + 1).toString() })],
        borders: getTableBorders(),
      }),
      new TableCell({
        children: [new Paragraph({ text: student.id })],
        borders: getTableBorders(),
      }),
      new TableCell({
        children: [new Paragraph({ text: student.sgpa.toString() })],
        borders: getTableBorders(),
      }),
      new TableCell({
        children: [new Paragraph({ text: student.grade })],
        borders: getTableBorders(),
      }),
    ],
  }));

  return new Table({
    rows: [headerRow, ...dataRows],
    width: {
      size: 100,
      type: WidthType.PERCENTAGE,
    },
  });
};

const createNeedsImprovementTable = (analysis: ResultAnalysis): Table => {
  const headers = ['Register Number', 'SGPA', 'Arrears'];

  const headerRow = new TableRow({
    children: headers.map(header => new TableCell({
      children: [new Paragraph({
        children: [
          new TextRun({
            text: header,
            bold: true,
          }),
        ],
      })],
      borders: getTableBorders(),
    })),
  });

  const dataRows = analysis.needsImprovement.map(student => new TableRow({
    children: [
      new TableCell({
        children: [new Paragraph({ text: student.id })],
        borders: getTableBorders(),
      }),
      new TableCell({
        children: [new Paragraph({ text: student.sgpa.toString() })],
        borders: getTableBorders(),
      }),
      new TableCell({
        children: [new Paragraph({ text: student.subjects })],
        borders: getTableBorders(),
      }),
    ],
  }));

  return new Table({
    rows: [headerRow, ...dataRows],
    width: {
      size: 100,
      type: WidthType.PERCENTAGE,
    },
  });
};

const getTableBorders = (): ITableBordersOptions => {
  return {
    top: {
      style: BorderStyle.SINGLE,
      size: 1,
      color: "000000",
    },
    bottom: {
      style: BorderStyle.SINGLE,
      size: 1,
      color: "000000",
    },
    left: {
      style: BorderStyle.SINGLE,
      size: 1,
      color: "000000",
    },
    right: {
      style: BorderStyle.SINGLE,
      size: 1,
      color: "000000",
    },
  };
};
