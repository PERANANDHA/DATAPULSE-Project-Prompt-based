
import { ResultAnalysis, StudentRecord } from '../types';

// Function to download Word document (docx)
export const downloadWordReport = (analysis: ResultAnalysis, records: StudentRecord[]): void => {
  try {
    // Create HTML content for Word document
    let htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Result Analysis Report</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; }
          h1 { text-align: center; color: #0056b3; font-size: 20px; margin-bottom: 20px; }
          h2 { color: #0056b3; font-size: 16px; margin-top: 25px; margin-bottom: 10px; }
          table { border-collapse: collapse; width: 100%; margin-top: 15px; margin-bottom: 15px; }
          th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
          th { background-color: #f2f2f2; font-weight: bold; }
          .chart-container { margin-top: 30px; }
          .summary { margin-top: 20px; margin-bottom: 20px; }
          .summary p { margin: 5px 0; line-height: 1.5; }
          .section { margin-bottom: 25px; }
          .header { display: flex; justify-content: space-between; margin-bottom: 30px; }
          .header-left { text-align: left; }
          .header-right { text-align: right; }
          .footer { margin-top: 30px; text-align: center; font-size: 12px; color: #666; }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="header-left">
            <h1>K. S. Rangasamy College of Technology</h1>
            <p>Department of Computer Science and Engineering</p>
          </div>
          <div class="header-right">
            <p>Generated: ${new Date().toLocaleDateString()}</p>
          </div>
        </div>
        
        <h1>End Semester Result Analysis</h1>
        
        <div class="section summary">
          <h2>Summary Overview</h2>
          <table>
            <tr>
              <th style="width: 50%;">Metric</th>
              <th style="width: 50%;">Value</th>
            </tr>
            <tr>
              <td>Total Students</td>
              <td>${analysis.totalStudents}</td>
            </tr>
            <tr>
              <td>Average CGPA</td>
              <td>${analysis.averageCGPA.toFixed(2)}</td>
            </tr>
            <tr>
              <td>Highest SGPA</td>
              <td>${analysis.highestSGPA.toFixed(2)}</td>
            </tr>
            <tr>
              <td>Lowest SGPA</td>
              <td>${analysis.lowestSGPA.toFixed(2)}</td>
            </tr>
            <tr>
              <td>Pass Percentage</td>
              <td>${analysis.passFailData[0].value.toFixed(2)}%</td>
            </tr>
          </table>
        </div>
        
        <div class="section">
          <h2>Student Performance Analysis</h2>
          <table>
            <tr>
              <th>Registration Number</th>
              <th>SGPA</th>
              <th>Status</th>
            </tr>`;
    
    // Add student data rows
    analysis.studentSgpaDetails?.forEach(student => {
      const status = student.hasArrears ? 'Has Arrears' : (student.sgpa < 6.5 ? 'SGPA below 6.5' : 'Good Standing');
      htmlContent += `
        <tr>
          <td>${student.id}</td>
          <td>${student.sgpa.toFixed(2)}</td>
          <td>${status}</td>
        </tr>`;
    });
    
    // Close table and continue
    htmlContent += `
          </table>
        </div>
        
        <div class="section">
          <h2>Top Performers</h2>
          <table>
            <tr>
              <th>Registration Number</th>
              <th>SGPA</th>
              <th>Grade</th>
            </tr>`;
    
    // Add top performers
    analysis.topPerformers.forEach(student => {
      htmlContent += `
        <tr>
          <td>${student.id}</td>
          <td>${student.sgpa.toFixed(2)}</td>
          <td>${student.grade}</td>
        </tr>`;
    });
    
    // Close table and continue
    htmlContent += `
          </table>
        </div>
        
        <div class="section">
          <h2>Subject-wise Performance</h2>
          <table>
            <tr>
              <th>Subject Code</th>
              <th>Pass %</th>
              <th>Average Grade</th>
            </tr>`;
    
    // Add subject data using the subjectPerformance array
    if (analysis.subjectPerformance) {
      analysis.subjectPerformance.forEach(subject => {
        // Get the average grade display from grade distribution if available
        const subjectCode = subject.subject;
        const avgGradeDisplay = getAverageGradeDisplay(analysis, subjectCode);
        
        htmlContent += `
          <tr>
            <td>${subjectCode}</td>
            <td>${subject.pass.toFixed(2)}%</td>
            <td>${avgGradeDisplay}</td>
          </tr>`;
      });
    }
    
    // Close table and HTML
    htmlContent += `
          </table>
        </div>
        
        <div class="footer">
          <p>This report was automatically generated by Result Analysis System</p>
        </div>
      </body>
      </html>`;
    
    // Create a Blob with the HTML content
    const blob = new Blob([htmlContent], { type: 'application/msword' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'result-analysis-report.doc';
    
    // Trigger download
    document.body.appendChild(link);
    link.click();
    
    // Clean up
    document.body.removeChild(link);
    URL.revokeObjectURL(link.href);
    
  } catch (error) {
    console.error('Error generating Word report:', error);
  }
};

// Helper function to get a display string for the average grade of a subject
function getAverageGradeDisplay(analysis: ResultAnalysis, subjectCode: string): string {
  // Check if we have grade distribution data for this subject
  if (analysis.subjectGradeDistribution && analysis.subjectGradeDistribution[subjectCode]) {
    const grades = analysis.subjectGradeDistribution[subjectCode];
    if (grades.length === 0) return 'N/A';
    
    // Find the most common grade
    let maxCount = 0;
    let commonGrade = '';
    
    grades.forEach(grade => {
      if (grade.count > maxCount) {
        maxCount = grade.count;
        commonGrade = grade.name;
      }
    });
    
    return commonGrade || 'N/A';
  }
  
  return 'N/A';
}
