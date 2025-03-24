
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
          h1 { text-align: left; margin-left: 0; font-size: 18px; }
          table { border-collapse: collapse; width: 100%; margin-top: 20px; }
          th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
          th { background-color: #f2f2f2; }
          .chart-container { margin-top: 30px; }
          .summary { margin-top: 30px; }
        </style>
      </head>
      <body>
        <h1>End Semester Result Analysis</h1>
        
        <div class="summary">
          <p><strong>Total Students:</strong> ${analysis.totalStudents}</p>
          <p><strong>Average CGPA:</strong> ${analysis.averageCGPA.toFixed(2)}</p>
          <p><strong>Highest SGPA:</strong> ${analysis.highestSGPA.toFixed(2)}</p>
          <p><strong>Lowest SGPA:</strong> ${analysis.lowestSGPA.toFixed(2)}</p>
          <p><strong>Pass Percentage:</strong> ${analysis.passFailData[0].value.toFixed(2)}%</p>
        </div>
        
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
    
    // Close table and HTML
    htmlContent += `
        </table>
        
        <div class="summary">
          <h2>Top Performers</h2>
          <ul>`;
    
    // Add top performers
    analysis.topPerformers.forEach(student => {
      htmlContent += `<li>${student.id}: ${student.sgpa.toFixed(2)} (${student.grade})</li>`;
    });
    
    htmlContent += `
          </ul>
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
