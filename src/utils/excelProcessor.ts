
import * as XLSX from 'xlsx';
import { processResults, generateWordReport } from './excel/analyzer';
import { SubjectCredit, StudentData } from './excel/types';

export const processExcelFile = async (file: File, subjectCredits: SubjectCredit[] = [], extractSubjectsOnly: boolean = false): Promise<any> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = async (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];

        // Extract header row to identify subject columns
        const headerRow = jsonData[0];
        
        // Filter out non-subject columns (typically first few columns are student info)
        const subjectCols: number[] = [];
        const subjectNames: string[] = [];
        
        headerRow.forEach((header, index) => {
          if (index >= 2) { // Assuming first two columns are for student info
            const subject = String(header).trim();
            if (subject && subject !== 'SGPA') {
              subjectCols.push(index);
              subjectNames.push(subject);
            }
          }
        });

        // If we only need to extract subjects, return them now
        if (extractSubjectsOnly) {
          resolve(subjectNames);
          return;
        }

        // Process results with the extracted subjects
        const processedResults = processResults(jsonData, subjectCols, subjectCredits);
        resolve(processedResults);
        
      } catch (error) {
        console.error("Excel processing error:", error);
        reject(error);
      }
    };

    reader.onerror = (error) => {
      reject(error);
    };

    reader.readAsArrayBuffer(file);
  });
};

export const processForWordReport = (studentData: StudentData[], currentSemesterCredits: SubjectCredit[], cumulativeCredits: SubjectCredit[]) => {
  // Process data for the Word report with both sets of credits
  return {
    currentSemesterData: {
      studentData: studentData,
      subjectCredits: currentSemesterCredits
    },
    cumulativeData: {
      studentData: studentData,
      subjectCredits: cumulativeCredits
    }
  };
};

export const generateWordDocReport = async (data: any, filename: string = "Result_Analysis_Report") => {
  try {
    const blob = await generateWordReport(
      data.currentSemesterData.studentData, 
      data.currentSemesterData.subjectCredits,
      data.cumulativeData.studentData,
      data.cumulativeData.subjectCredits
    );
    
    // Create a download link and trigger it
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${filename}.docx`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    return true;
  } catch (error) {
    console.error("Error generating Word report:", error);
    return false;
  }
};
