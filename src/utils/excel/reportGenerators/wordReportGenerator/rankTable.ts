import { Table, TableRow } from 'docx';
import { createTableCell, createHeaderCell } from './tableBuilders';
// Build rank table logic here
export const buildRankTable = (analysis: any, calculationMode: string) => {
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
    columnWidths: [800, 3000, 1000, 800, 3000, 1000],
    rows: rankRows,
  });

  return rankTable;
};
