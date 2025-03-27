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
    logoImagePath = "",
    department = "CSE",
    departmentFullName = "Computer Science and Engineering",
    calculationMode
  } = options;
  
  // Create sections for the document
  const sections = [];
  
  // Title section
  let headerImage;
  
  try {
    if (logoImagePath) {
      const response = await fetch(logoImagePath);
      const blob = await response.blob();
      const arrayBuffer = await blob.arrayBuffer();
      
      headerImage = new ImageRun({
        data: arrayBuffer,
        transformation: {
          width: 100,
          height: 100,
        },
        type: 'png',
      });
    }
  } catch (error) {
    console.error("Error loading logo image:", error);
    // Continue without the image if there's an error
  }
  
  // Title
  const titleSection = [];
  
  // Add logo if available
  if (headerImage) {
    titleSection.push(
      new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [headerImage],
      })
    );
  }
  
  // Title paragraphs
  titleSection.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      heading: HeadingLevel.TITLE,
      children: [
        new TextRun({
          text: "K.S.RANGASAMY COLLEGE OF TECHNOLOGY",
          bold: true,
          size: 28,
        }),
      ],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      heading: HeadingLevel.HEADING_1,
      children: [
        new TextRun({
          text: "(Autonomous)",
          bold: true,
          size: 24,
        }),
      ],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      heading: HeadingLevel.HEADING_2,
      children: [
        new TextRun({
          text: `DEPARTMENT OF ${departmentFullName.toUpperCase()}`,
          bold: true,
          size: 24,
        }),
      ],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      heading: HeadingLevel.HEADING_2,
      children: [
        new TextRun({
          text: calculationMode === 'sgpa' 
            ? "END SEMESTER RESULT ANALYSIS" 
            : "CUMULATIVE GRADE POINT AVERAGE ANALYSIS",
          bold: true,
          size: 24,
        }),
      ],
      spacing: {
        after: 400,
      },
    })
  );
  
  // Add all title paragraphs to sections
  sections.push(...titleSection);
  
  // Determine current semester data for CGPA mode
  let currentSemesterRecords = records;
  let semesterLabel = '';
  
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
  sections.push(
    new Paragraph({
      heading: HeadingLevel.HEADING_2,
      children: [
        new TextRun({
          text: "COLLEGE INFORMATION",
          bold: true,
          size: 16,
        }),
      ],
      spacing: {
        before: 200,
        after: 200,
      },
    }),
    new Table({
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
        createTableRow(["College Name", "K. S. Rangasamy College of Technology"]),
        createTableRow(["Department", departmentFullName]),
        createTableRow(["Batch", "2023-2027"]),
        createTableRow(["Year/Semester", semesterLabel || "II/III"]),
        createTableRow(["Section", "A&B"]),
      ],
    })
  );
  
  // Summary Table
  const summaryRows = [
    createTableRow(["Total Students", analysis.totalStudents.toString()]),
  ];
  
  if (calculationMode === 'sgpa') {
    // For SGPA mode, show SGPA metrics
    summaryRows.push(
      createTableRow(["Average SGPA", analysis.averageCGPA.toFixed(2)]),
      createTableRow(["Highest SGPA", analysis.highestSGPA.toFixed(2)]),
      createTableRow(["Lowest SGPA", analysis.lowestSGPA.toFixed(2)])
    );
  } else {
    // For CGPA mode, show CGPA metrics
    if (analysis.cgpaAnalysis) {
      summaryRows.push(
        createTableRow(["Average CGPA", analysis.cgpaAnalysis.averageCGPA.toFixed(2)]),
        createTableRow(["Highest CGPA", analysis.cgpaAnalysis.highestCGPA.toFixed(2)]),
        createTableRow(["Lowest CGPA", analysis.cgpaAnalysis.lowestCGPA.toFixed(2)])
      );
      
      // Add current semester SGPA info if available
      if (analysis.currentSemesterFile && analysis.fileWiseAnalysis && 
          analysis.fileWiseAnalysis[analysis.currentSemesterFile]) {
        
        const currentSemAnalysis = analysis.fileWiseAnalysis[analysis.currentSemesterFile];
        
        summaryRows.push(
          createTableRow([`Current Semester (${semesterLabel}) Average SGPA`, 
            currentSemAnalysis.averageSGPA.toFixed(2)])
        );
      }
    }
  }
  
  sections.push(
    new Paragraph({
      heading: HeadingLevel.HEADING_2,
      children: [
        new TextRun({
          text: calculationMode === 'sgpa' ? "PERFORMANCE SUMMARY" : "CGPA PERFORMANCE SUMMARY",
          bold: true,
          size: 16,
        }),
      ],
      spacing: {
        before: 200,
        after: 200,
      },
    }),
    new Table({
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
      rows: summaryRows,
    })
  );
  
  // End Semester Result Analysis Table (Subject-wise Performance)
  if (calculationMode === 'sgpa' || (calculationMode === 'cgpa' && currentSemesterRecords.length > 0)) {
    const uniqueSubjects = [...new Set(currentSemesterRecords.map(record => record.SCODE))];
    
    const subjectRows = [
      createTableRow([
        "S.No",
        "Subject Code",
        "Subject Name",
        "Faculty Name",
        "Dept",
        "App",
        "Absent",
        "Fail",
        "WH",
        "Passed",
        "% of pass",
        "Highest Grade",
        "No. of students"
      ], true),
    ];
    
    uniqueSubjects.forEach((subject, index) => {
      const subjectRecords = currentSemesterRecords.filter(record => record.SCODE === subject);
      const totalStudents = subjectRecords.length;
      const passedStudents = subjectRecords.filter(record => record.GR !== 'U').length;
      const failedStudents = totalStudents - passedStudents;
      const passPercentage = (passedStudents / totalStudents) * 100;
      
      // Find the highest grade
      const grades = subjectRecords.map(record => record.GR);
      const highestGrade = grades.sort((a, b) => (gradePointMap[b] || 0) - (gradePointMap[a] || 0))[0];
      
      // Count students with highest grade
      const studentsWithHighestGrade = subjectRecords.filter(record => record.GR === highestGrade).length;
      
      // Generate subject name as "Subject 1", "Subject 2", etc.
      const subjectName = `Subject ${index + 1}`;
      
      subjectRows.push(
        createTableRow([
          (index + 1).toString(),
          subject,
          subjectName, // Subject name 
          "", // Faculty name (empty)
          department, // Department 
          totalStudents.toString(),
          "Nil", // Absent
          failedStudents === 0 ? "Nil" : failedStudents.toString(), 
          "1", // WH
          passedStudents.toString(),
          passPercentage.toFixed(1),
          highestGrade,
          studentsWithHighestGrade.toString()
        ])
      );
    });
    
    sections.push(
      new Paragraph({
        heading: HeadingLevel.HEADING_2,
        children: [
          new TextRun({
            text: calculationMode === 'sgpa' 
              ? "END SEMESTER RESULT ANALYSIS" 
              : `CURRENT SEMESTER (${semesterLabel}) RESULT ANALYSIS`,
            bold: true,
            size: 16,
          }),
        ],
        spacing: {
          before: 200,
          after: 200,
        },
      }),
      new Table({
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
        rows: subjectRows,
      })
    );
  }
  
  // Top Performers Table
  let topPerformersTitle;
  let topPerformersRows;
  
  if (calculationMode === 'sgpa') {
    topPerformersTitle = "TOP PERFORMERS";
    topPerformersRows = [
      createTableRow(["S.No", "Registration Number", "SGPA"], true),
      ...analysis.topPerformers.slice(0, 10).map((student, index) => 
        createTableRow([(index + 1).toString(), student.id, student.sgpa.toFixed(2)])
      )
    ];
  } else {
    // For CGPA, use the CGPA toppers list if available
    topPerformersTitle = "TOP PERFORMERS BASED ON CGPA";
    if (analysis.cgpaAnalysis && analysis.cgpaAnalysis.toppersList) {
      topPerformersRows = [
        createTableRow(["S.No", "Registration Number", "CGPA"], true),
        ...analysis.cgpaAnalysis.toppersList.slice(0, 10).map((student, index) => 
          createTableRow([(index + 1).toString(), student.id, student.cgpa.toFixed(2)])
        )
      ];
    } else {
      topPerformersRows = [createTableRow(["No data available"])];
    }
  }
  
  sections.push(
    new Paragraph({
      heading: HeadingLevel.HEADING_2,
      children: [
        new TextRun({
          text: topPerformersTitle,
          bold: true,
          size: 16,
        }),
      ],
      spacing: {
        before: 200,
        after: 200,
      },
    }),
    new Table({
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
      rows: topPerformersRows,
    })
  );
  
  // Classification section
  const classificationData = calculationMode === 'sgpa' 
    ? analysis.singleFileClassification 
    : analysis.multipleFileClassification;
  
  // Classification Table for the current semester
  sections.push(
    new Paragraph({
      heading: HeadingLevel.HEADING_2,
      children: [
        new TextRun({
          text: calculationMode === 'sgpa' 
            ? "CLASSIFICATION" 
            : "CLASSIFICATION BASED ON CGPA",
          bold: true,
          size: 16,
        }),
      ],
      spacing: {
        before: 200,
        after: 200,
      },
    }),
    new Table({
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
        createTableRow([
          calculationMode === 'sgpa' ? "Current semester" : "Overall Classification",
          "", 
          "", 
          "", 
          "", 
          "", 
          "", 
          "", 
          "", 
          "", 
          "", 
          "", 
          "", 
          ""
        ], true),
        createTableRow([
          "Distinction", 
          classificationData.distinction.toString(), 
          "First class", 
          "WOA", 
          classificationData.firstClassWOA.toString(), 
          "WA", 
          classificationData.firstClassWA.toString(), 
          "Second class", 
          "WOA", 
          classificationData.secondClassWOA.toString(), 
          "WA", 
          classificationData.secondClassWA.toString(), 
          "Fail", 
          classificationData.fail.toString(),
          "% of pass",
          classificationData.passPercentage.toFixed(1)
        ]),
      ],
    })
  );
  
  // Signature section
  sections.push(
    new Paragraph({
      children: [new TextRun("")],
      spacing: {
        before: 1000,
      },
    }),
    new Paragraph({
      text: "Class Advisor",
      alignment: AlignmentType.LEFT,
    }),
    new Paragraph({
      text: "HOD",
      alignment: AlignmentType.RIGHT,
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

// Helper to create table rows
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
      })
    ),
  });
};
