import { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, BorderStyle, WidthType, AlignmentType, HeadingLevel, ImageRun } from 'docx';
import { ResultAnalysis, StudentRecord, gradePointMap } from '../types';
import { calculateSGPA, calculateCGPA, getCurrentSemesterSGPAData } from '../gradeUtils';
import { createHeaderTable } from './header';
import { buildClassificationTable } from './classificationTable';
import { buildRankTable } from './rankTable';
import { createTableRow, createTableCell, createHeaderCell } from './tableBuilders';

interface WordReportOptions {
  logoImagePath?: string;
  department?: string;
  departmentFullName?: string;
  calculationMode: 'sgpa' | 'cgpa';
}

export const downloadWordReport = async (
  analysis: any, 
  records: any[],
  options: any
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
  const headerTable = createHeaderTable(headerImage);
  
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
    // Use the current semester file determined by the analyzer (highest semester)
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
  
  // MODIFIED: Performance Text paragraphs with correct values for SGPA/CGPA mode
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
    // For CGPA mode - MODIFIED to use correct CGPA values
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
  
  // Add a note about arrear subjects if any were excluded
  const arrearSubjects = records.filter(r => r.isArrear);
  if (arrearSubjects.length > 0) {
    const uniqueArrearSubjectCodes = [...new Set(arrearSubjects.map(r => r.SCODE))];
    
    sections.push(
      new Paragraph({
        spacing: {
          before: 100,
          after: 100,
        },
        children: [
          new TextRun({
            text: "Note: ",
            bold: true,
            size: 24,
          }),
          new TextRun({
            text: `The following subjects were marked as Arrear and excluded from SGPA/CGPA calculations: ${uniqueArrearSubjectCodes.join(', ')}`,
            size: 24,
          }),
        ],
      }),
    );
  }
    
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
  
  // End Semester Result Analysis Section - Using actual subject data with faculty names
  // Made table much wider to match exact PDF layout
  if (calculationMode === 'sgpa' || (calculationMode === 'cgpa' && currentSemesterRecords.length > 0)) {
    // For current semester table, filter out arrear subjects
    const nonArrearCurrentSemesterRecords = currentSemesterRecords.filter(record => !record.isArrear);
    console.log(`Excluded ${currentSemesterRecords.length - nonArrearCurrentSemesterRecords.length} arrear subjects from End Semester Analysis`);
    
    // Use non-arrear subjects for analysis in SGPA mode and current semester in CGPA mode
    const uniqueSubjects = [...new Set(nonArrearCurrentSemesterRecords.map(record => record.SCODE))];
    
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
    
    // Adding actual subject data with faculty names
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
  
  // Classification Table - Improved alignment and consistent appearance
  const classificationTable = buildClassificationTable(analysis);
  
  sections.push(classificationTable);
  
  // Rank Analysis Section - FIXED to properly display top three students with correct SGPA data
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
  
  // FIXED: Get current semester student data with SGPA for the "Rank in This Semester" table
  // Get data directly from studentSgpaDetails which has been fixed in analyzer.ts
  let topCurrentSemesterStudents = [];
  let topCumulativeStudents = [];
  
  // For current semester, always use SGPA data
  if (analysis.studentSgpaDetails && analysis.studentSgpaDetails.length > 0) {
    // Use the pre-calculated SGPA data which is now correctly calculated in analyzer.ts
    const sortedStudentsByCurrentSGPA = [...analysis.studentSgpaDetails].sort((a, b) => b.sgpa - a.sgpa);
    topCurrentSemesterStudents = sortedStudentsByCurrentSGPA.slice(0, 3).map((student, index) => ({
      rank: index + 1,
      id: student.id,
      value: student.sgpa
    }));
    
    console.log("Top current semester students for Rank table:", topCurrentSemesterStudents);
  }
  
  // For cumulative data, use CGPA data if available (CGPA mode only)
  if (calculationMode === 'cgpa' && analysis.cgpaAnalysis && analysis.cgpaAnalysis.toppersList) {
    topCumulativeStudents = analysis.cgpaAnalysis.toppersList.slice(0, 3).map((student, index) => ({
      rank: index + 1,
      id: student.id,
      value: student.cgpa
    }));
    
    console.log("Top cumulative students for Rank table:", topCumulativeStudents);
  } else {
    // In SGPA mode, just use the same data for both tables
    topCumulativeStudents = topCurrentSemesterStudents;
  }
  
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
        createHeaderCell(calculationMode === 'cgpa' ? "CGPA" : "SGPA"),
      ],
    }),
  ];
  
  // Add data rows for top 3 ranks
  for (let i = 0; i < 3; i++) {
    const rank = i + 1;
    
    // Current semester student data (ensure we have data)
    const semesterStudent = topCurrentSemesterStudents[i] || { id: "", value: 0 };
    
    // Cumulative student data (ensure we have data)
    const cumulativeStudent = topCumulativeStudents[i] || { id: "", value: 0 };
    
    rankRows.push(
      new TableRow({
        children: [
          createTableCell(rank.toString()),
          createTableCell(semesterStudent.id),
          createTableCell(semesterStudent.value.toFixed(2)),
          createTableCell(rank.toString()),
          createTableCell(cumulativeStudent.id),
          createTableCell(cumulativeStudent.value.toFixed(2)),
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
  
  return new Document({
    sections: [{
      children: sections,
    }],
  });
};
