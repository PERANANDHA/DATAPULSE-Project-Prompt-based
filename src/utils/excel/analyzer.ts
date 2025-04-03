import { Packer, Document, Paragraph, TextRun, TableRow, TableCell, Table, WidthType, BorderStyle, AlignmentType } from 'docx';
import { SubjectCredit, StudentData, StudentPerformance } from './types';
import { convertGradeToScore, getGradeDistribution, calculateSGPA, getPerformanceCategory } from './gradeUtils';

// Keep existing code for processing results
export function processResults(
  data: any[][],
  subjectColumns: number[],
  subjectCredits: SubjectCredit[] = []
): StudentData[] {
  const headerRow = data[0];
  const results: StudentData[] = [];

  // Process each row (student)
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    if (!row || !row.length) continue;

    const studentId = row[0]?.toString() || '';
    const studentName = row[1]?.toString() || '';
    
    const subjects: { [key: string]: string } = {};
    
    // Extract grades for each subject
    subjectColumns.forEach((colIndex, idx) => {
      const subjectName = headerRow[colIndex]?.toString() || `Subject ${idx + 1}`;
      const grade = row[colIndex]?.toString() || '';
      subjects[subjectName] = grade;
    });

    results.push({
      id: studentId,
      name: studentName,
      subjects
    });
  }
  
  return results;
}

export async function generateWordReport(
  currentSemesterData: StudentData[],
  currentSemesterCredits: SubjectCredit[],
  cumulativeData: StudentData[],
  cumulativeCredits: SubjectCredit[]
): Promise<Blob> {
  // Create sections with appropriate data
  
  // Title and header
  const title = new Paragraph({
    alignment: AlignmentType.CENTER,
    children: [
      new TextRun({
        text: "END SEMESTER EXAMINATION RESULT ANALYSIS",
        bold: true,
        size: 28,
      }),
    ],
  });
  
  // Current semester data for "End Semester Result Analysis", "Performance Summary" and "Individual Student Performance"
  const endSemesterAnalysisTable = createEndSemesterAnalysisTable(currentSemesterData, currentSemesterCredits);
  const performanceSummaryTable = createPerformanceSummaryTable(currentSemesterData, currentSemesterCredits);
  const individualPerformanceTable = createIndividualPerformanceTable(currentSemesterData, currentSemesterCredits);
  
  // Cumulative data for "Classification" and "Rank Analysis"
  const classificationTable = createClassificationTable(cumulativeData, cumulativeCredits);
  const rankAnalysisTable = createRankAnalysisTable(cumulativeData, cumulativeCredits);
  
  // Combine all sections into a document
  const doc = new Document({
    sections: [
      {
        properties: {},
        children: [
          title,
          new Paragraph({ text: "" }),
          new Paragraph({ 
            children: [new TextRun({ text: "End Semester Result Analysis", bold: true, size: 24 })],
            spacing: { after: 300 }
          }),
          endSemesterAnalysisTable,
          new Paragraph({ text: "" }),
          new Paragraph({ 
            children: [new TextRun({ text: "Performance Summary", bold: true, size: 24 })],
            spacing: { after: 300 }
          }),
          performanceSummaryTable,
          new Paragraph({ text: "" }),
          new Paragraph({ 
            children: [new TextRun({ text: "Individual Student Performance", bold: true, size: 24 })],
            spacing: { after: 300 }
          }),
          individualPerformanceTable,
          new Paragraph({ text: "" }),
          new Paragraph({ 
            children: [new TextRun({ text: "Classification", bold: true, size: 24 })],
            spacing: { after: 300 }
          }),
          classificationTable,
          new Paragraph({ text: "" }),
          new Paragraph({ 
            children: [new TextRun({ text: "Rank Analysis", bold: true, size: 24 })],
            spacing: { after: 300 }
          }),
          rankAnalysisTable,
        ],
      },
    ],
  });

  // Generate and return the document as a blob
  return Packer.toBlob(doc);
}

// Helper functions for creating tables
function createEndSemesterAnalysisTable(data: StudentData[], credits: SubjectCredit[]): Table {
  // ... keep existing code or implement based on current semester data
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    // ... implementation details
  });
}

function createPerformanceSummaryTable(data: StudentData[], credits: SubjectCredit[]): Table {
  // ... keep existing code or implement based on current semester data
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    // ... implementation details
  });
}

function createIndividualPerformanceTable(data: StudentData[], credits: SubjectCredit[]): Table {
  // ... keep existing code or implement based on current semester data
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    // ... implementation details
  });
}

function createClassificationTable(data: StudentData[], credits: SubjectCredit[]): Table {
  // ... implement based on cumulative data
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    // ... implementation details
  });
}

function createRankAnalysisTable(data: StudentData[], credits: SubjectCredit[]): Table {
  // ... implement based on cumulative data
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    // ... implementation details
  });
}
