
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
    
    // Use HTML-based report generation (since docx library has limitations with charts)
    generateHtmlWordReport(analysis, records, options);
  } catch (error) {
    console.error('Error generating Word report:', error);
    throw error;
  }
};

/**
 * Generate an HTML-based Word document that can be opened in MS Word
 */
const generateHtmlWordReport = (
  analysis: ResultAnalysis, 
  records: StudentRecord[],
  options: WordReportOptions
): void => {
  try {
    // Create HTML content for the Word document
    let html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Result Analysis Report</title>
        <style>
          body { font-family: 'Calibri', sans-serif; color: #333; line-height: 1.5; }
          h1 { color: #2563eb; margin-bottom: 20px; }
          h2 { color: #1d4ed8; margin-top: 30px; margin-bottom: 10px; }
          h3 { color: #1e40af; margin-top: 20px; margin-bottom: 10px; }
          table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
          th { background-color: #e0e7ff; color: #1e40af; font-weight: bold; text-align: left; padding: 8px; border: 1px solid #cbd5e1; }
          td { padding: 8px; border: 1px solid #cbd5e1; }
          .chart-placeholder { background-color: #f8fafc; border: 1px dashed #94a3b8; padding: 20px; text-align: center; margin-bottom: 20px; }
          .signature-table { width: 100%; border: none; }
          .signature-cell { width: 25%; text-align: center; border: none; }
          .signature-line { display: inline-block; border-top: 1px solid #000; padding-top: 5px; min-width: 150px; }
          /* Header image styling - ensuring full image visibility */
          .header-image {
            width: 100%;
            margin: 0 auto 20px;
            display: block;
            position: relative;
          }
          .header-image img {
            width: 20%; /* Reduced width to ensure full image visibility */
            height: auto;
            margin-left: 1in; /* Start at 1 inch mark */
            max-width: 5.5in; /* Ensure image width stays within 5.5 inches (6.5 - 1) */
            object-fit: contain; /* Ensure the entire image is visible */
          }
          @page { size: landscape; margin: 0.5in; }
        </style>
      </head>
      <body>`;
    
    // Add the header image positioned within the ruler limits with reduced width
    const baseURL = window.location.origin;
    const headerImagePath = baseURL + "/lovable-uploads/6c555048-56f9-487c-a7a1-100babe97cd7.png";
    
    html += `
      <div class="header-image">
        <img src="${options.logoImagePath || headerImagePath}" alt="College Logo">
      </div>`;
    
    // Add title for the report
    html += `
      <h1 style="text-align: center;">END SEMESTER RESULT ANALYSIS</h1>`;

    // Add college information table
    html += `
      <table>
        <tr>
          <th colspan="2">College Information</th>
        </tr>
        <tr>
          <td>College Name</td>
          <td>K. S. Rangasamy College of Technology</td>
        </tr>
        <tr>
          <td>Department</td>
          <td>${departmentFullName}</td>
        </tr>
        <tr>
          <td>Academic Year</td>
          <td>2023-2024</td>
        </tr>
        <tr>
          <td>Semester</td>
          <td>III</td>
        </tr>
      </table>`;

    // Add performance summary section
    html += `
      <h2>Performance Summary</h2>
      <table>
        <tr>
          <th>Metric</th>
          <th>Value</th>
        </tr>
        <tr>
          <td>Total Students</td>
          <td>${analysis.totalStudents}</td>
        </tr>
        <tr>
          <td>Average SGPA</td>
          <td>${analysis.averageCGPA.toFixed(2)}</td>
        </tr>
        <tr>
          <td>Highest SGPA</td>
          <td>${analysis.highestSGPA.toFixed(2)}</td>
        </tr>
        <tr>
          <td>Lowest SGPA</td>
          <td>${analysis.lowestSGPA.toFixed(2)}</td>
        </tr>`;

    // Add CGPA information if multiple files were processed
    if (analysis.fileCount && analysis.fileCount > 1 && analysis.cgpaAnalysis) {
      html += `
        <tr>
          <td>Number of Files Processed</td>
          <td>${analysis.fileCount}</td>
        </tr>
        <tr>
          <td>Average CGPA</td>
          <td>${analysis.cgpaAnalysis.averageCGPA.toFixed(2)}</td>
        </tr>
        <tr>
          <td>Highest CGPA</td>
          <td>${analysis.cgpaAnalysis.highestCGPA.toFixed(2)}</td>
        </tr>
        <tr>
          <td>Lowest CGPA</td>
          <td>${analysis.cgpaAnalysis.lowestCGPA.toFixed(2)}</td>
        </tr>`;
    }

    html += `
      </table>`;

    // Add subject performance section (End Semester Result Analysis)
    html += `
      <h2>End Semester Result Analysis</h2>
      <table>
        <tr>
          <th>S.No</th>
          <th>Subject Code</th>
          <th>Subject Name</th>
          <th>Faculty Name</th>
          <th>Dept</th>
          <th>App</th>
          <th>Absent</th>
          <th>Fail</th>
          <th>WH</th>
          <th>Passed</th>
          <th>% of pass</th>
        </tr>`;

    // Add subject performance data
    const uniqueSubjects = [...new Set(records.map(record => record.SCODE))];
    uniqueSubjects.forEach((subject, index) => {
      const subjectRecords = records.filter(record => record.SCODE === subject);
      const totalStudents = subjectRecords.length;
      const passedStudents = subjectRecords.filter(record => record.GR !== 'U').length;
      const failedStudents = totalStudents - passedStudents;
      const passPercentage = (passedStudents / totalStudents) * 100;
      
      html += `
        <tr>
          <td>${index + 1}</td>
          <td>${subject}</td>
          <td>Subject ${index + 1}</td>
          <td></td>
          <td>${options.department || department}</td>
          <td>${totalStudents}</td>
          <td>Nil</td>
          <td>${failedStudents || 'Nil'}</td>
          <td>1</td>
          <td>${passedStudents}</td>
          <td>${passPercentage.toFixed(1)}</td>
        </tr>`;
    });

    html += `
      </table>`;

    // Add grade distribution data
    html += `
      <h2>Grade Distribution</h2>
      <table>
        <tr>
          <th>Grade</th>
          <th>Count</th>
          <th>Percentage</th>
        </tr>`;

    analysis.gradeDistribution.forEach(grade => {
      const percentage = analysis.totalGrades > 0 
        ? ((grade.count / analysis.totalGrades) * 100).toFixed(1) 
        : "0.0";
      
      html += `
        <tr>
          <td>${grade.name}</td>
          <td>${grade.count}</td>
          <td>${percentage}%</td>
        </tr>`;
    });

    html += `
      </table>`;

    // Add top performers section
    html += `
      <h2>Top Performers</h2>
      <table>
        <tr>
          <th>S.No</th>
          <th>Registration Number</th>
          <th>SGPA</th>
        </tr>`;

    analysis.topPerformers.forEach((student, index) => {
      html += `
        <tr>
          <td>${index + 1}</td>
          <td>${student.id}</td>
          <td>${student.sgpa.toFixed(2)}</td>
        </tr>`;
    });

    html += `
      </table>`;

    // Add CGPA rankings if multiple files
    if (analysis.cgpaAnalysis && analysis.cgpaAnalysis.studentCGPAs) {
      html += `
        <h2>CGPA Rankings</h2>
        <table>
          <tr>
            <th>S.No</th>
            <th>Registration Number</th>
            <th>CGPA</th>
          </tr>`;

      analysis.cgpaAnalysis.studentCGPAs
        .sort((a, b) => b.cgpa - a.cgpa)
        .slice(0, 10)
        .forEach((student, index) => {
          html += `
            <tr>
              <td>${index + 1}</td>
              <td>${student.id}</td>
              <td>${student.cgpa.toFixed(2)}</td>
            </tr>`;
        });

      html += `
        </table>`;
    }

    // Add analysis chart placeholders
    html += `
      <h2>Visual Analysis</h2>
      <div class="chart-placeholder">
        <p>Pass/Fail Distribution Chart</p>
        <p>To view charts, please refer to the analysis dashboard</p>
      </div>
      
      <div class="chart-placeholder">
        <p>Grade Distribution Chart</p>
        <p>To view charts, please refer to the analysis dashboard</p>
      </div>`;

    // Add signature section
    html += `
      <h2>Signatures</h2>
      <table class="signature-table">
        <tr>
          <td class="signature-cell">
            <div class="signature-line">Faculty</div>
          </td>
          <td class="signature-cell">
            <div class="signature-line">Class Advisor</div>
          </td>
          <td class="signature-cell">
            <div class="signature-line">HoD</div>
          </td>
          <td class="signature-cell">
            <div class="signature-line">Principal</div>
          </td>
        </tr>
      </table>`;

    // Close HTML document
    html += `
      </body>
      </html>`;

    // Create blob for HTML content
    const blob = new Blob([html], { type: 'application/msword' });
    
    // Create download link
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'result-analysis-report.doc';
    
    // Trigger download
    document.body.appendChild(link);
    link.click();
    
    // Clean up
    document.body.removeChild(link);
  } catch (error) {
    console.error('Error generating HTML Word report:', error);
    throw error;
  }
};
