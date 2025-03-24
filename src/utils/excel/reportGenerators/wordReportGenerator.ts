
import { ResultAnalysis, StudentRecord, gradePointMap } from '../types';

// Generate Word report with improved formatting and alignment
export const generateWordReport = (analysis: ResultAnalysis, records: StudentRecord[]): string => {
  // Get unique students and subjects
  const uniqueStudents = [...new Set(records.map(record => record.REGNO))];
  const uniqueSubjects = [...new Set(records.map(record => record.SCODE))];
  
  // Create subject-wise analysis data
  const subjectAnalysisRows = uniqueSubjects.map((subject, index) => {
    const subjectRecords = records.filter(record => record.SCODE === subject);
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
    
    return `
      <tr>
        <td style="width: 5%;">${index + 1}</td>
        <td style="width: 12%;">${subject}</td>
        <td style="width: 20%;">${subjectName}</td>
        <td style="width: 20%;"></td>
        <td style="width: 8%;">CSE</td>
        <td style="width: 5%;">${totalStudents}</td>
        <td style="width: 5%;">Nil</td>
        <td style="width: 5%;">${failedStudents || "Nil"}</td>
        <td style="width: 5%;">1</td>
        <td style="width: 5%;">${passedStudents}</td>
        <td style="width: 7%;">${passPercentage.toFixed(1)}</td>
        <td style="width: 8%;">${highestGrade}</td>
        <td style="width: 8%;">${studentsWithHighestGrade}</td>
      </tr>
    `;
  }).join('');
  
  // File wise analysis content
  let fileWiseContent = '';
  if (analysis.fileWiseAnalysis && Object.keys(analysis.fileWiseAnalysis).length > 0) {
    const fileRows = Object.entries(analysis.fileWiseAnalysis).map(([fileName, data]) => `
      <tr>
        <td>${fileName}</td>
        <td>${data.students}</td>
        <td>${data.averageSGPA.toFixed(2)}</td>
        <td>${data.semesterName || "N/A"}</td>
      </tr>
    `).join('');
    
    fileWiseContent = `
      <h3 style="margin-top: 20px; margin-bottom: 10px;">File Analysis</h3>
      <table border="1" cellpadding="5" cellspacing="0" style="width: 100%; border-collapse: collapse;">
        <tr style="background-color: #f2f2f2;">
          <th>File Name</th>
          <th>Students</th>
          <th>Average SGPA</th>
          <th>Semester</th>
        </tr>
        ${fileRows}
      </table>
    `;
  }
  
  // CGPA analysis content if available
  let cgpaContent = '';
  if (analysis.cgpaAnalysis) {
    const cgpaTopStudents = analysis.cgpaAnalysis.studentCGPAs
      .sort((a, b) => b.cgpa - a.cgpa)
      .slice(0, 5)
      .map((student, index) => `
        <tr>
          <td>${index + 1}</td>
          <td>${student.id}</td>
          <td>${student.cgpa.toFixed(2)}</td>
        </tr>
      `).join('');
    
    cgpaContent = `
      <h3 style="margin-top: 20px; margin-bottom: 10px;">CGPA Analysis</h3>
      <p>Average CGPA: ${analysis.cgpaAnalysis.averageCGPA.toFixed(2)}</p>
      <p>Highest CGPA: ${analysis.cgpaAnalysis.highestCGPA.toFixed(2)}</p>
      <p>Lowest CGPA: ${analysis.cgpaAnalysis.lowestCGPA.toFixed(2)}</p>
      
      <h4 style="margin-top: 15px; margin-bottom: 10px;">Top Performers (CGPA)</h4>
      <table border="1" cellpadding="5" cellspacing="0" style="width: 100%; border-collapse: collapse;">
        <tr style="background-color: #f2f2f2;">
          <th>Rank</th>
          <th>Registration Number</th>
          <th>CGPA</th>
        </tr>
        ${cgpaTopStudents}
      </table>
    `;
  }
  
  // Complete HTML content for the Word document
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Result Analysis Report</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          line-height: 1.6;
          margin: 20px;
          padding: 0;
        }
        h1, h2, h3, h4 {
          color: #333;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 20px;
        }
        th, td {
          border: 1px solid #ddd;
          padding: 8px;
          text-align: left;
        }
        th {
          background-color: #f2f2f2;
          font-weight: bold;
        }
        .header {
          text-align: center;
          margin-bottom: 30px;
        }
        .section {
          margin-bottom: 30px;
        }
        .footer {
          margin-top: 50px;
          text-align: center;
          font-size: 0.9em;
          color: #666;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>K. S. Rangasamy College of Technology</h1>
        <h2>Department of Computer Science and Engineering</h2>
        <h3>End Semester Result Analysis</h3>
      </div>
      
      <div class="section">
        <h3>College Information</h3>
        <table>
          <tr>
            <th>Field</th>
            <th>Value</th>
          </tr>
          <tr>
            <td>College Name</td>
            <td>K. S. Rangasamy College of Technology</td>
          </tr>
          <tr>
            <td>Department</td>
            <td>Computer Science and Engineering</td>
          </tr>
          <tr>
            <td>Batch</td>
            <td>2023-2027</td>
          </tr>
          <tr>
            <td>Year/Semester</td>
            <td>II/III</td>
          </tr>
          <tr>
            <td>Section</td>
            <td>A&B</td>
          </tr>
        </table>
      </div>
      
      <div class="section">
        <h3>Performance Summary</h3>
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
          </tr>
        </table>
      </div>
      
      ${fileWiseContent}
      
      ${cgpaContent}
      
      <div class="section">
        <h3>End Semester Result Analysis</h3>
        <table border="1" cellpadding="5" cellspacing="0" style="width: 100%; table-layout: fixed; border-collapse: collapse;">
          <tr style="background-color: #f2f2f2;">
            <th style="width: 5%;">S.No</th>
            <th style="width: 12%;">Subject Code</th>
            <th style="width: 20%;">Subject Name</th>
            <th style="width: 20%;">Faculty Name</th>
            <th style="width: 8%;">Dept</th>
            <th style="width: 5%;">App</th>
            <th style="width: 5%;">Absent</th>
            <th style="width: 5%;">Fail</th>
            <th style="width: 5%;">WH</th>
            <th style="width: 5%;">Passed</th>
            <th style="width: 7%;">% of pass</th>
            <th style="width: 8%;">Highest Grade</th>
            <th style="width: 8%;">No. of students</th>
          </tr>
          ${subjectAnalysisRows}
        </table>
      </div>
      
      <div class="section">
        <h3>Grade Distribution</h3>
        <table>
          <tr>
            <th>Grade</th>
            <th>Count</th>
            <th>Percentage</th>
          </tr>
          ${analysis.gradeDistribution.map(grade => `
            <tr>
              <td>${grade.name}</td>
              <td>${grade.count}</td>
              <td>${analysis.totalGrades > 0 ? ((grade.count / analysis.totalGrades) * 100).toFixed(2) + "%" : "0%"}</td>
            </tr>
          `).join('')}
        </table>
      </div>
      
      <div class="section">
        <h3>Top Performers</h3>
        <table>
          <tr>
            <th>Rank</th>
            <th>Registration Number</th>
            <th>SGPA</th>
          </tr>
          ${analysis.topPerformers.map((student, index) => `
            <tr>
              <td>${index + 1}</td>
              <td>${student.id}</td>
              <td>${student.sgpa.toFixed(2)}</td>
            </tr>
          `).join('')}
        </table>
      </div>
      
      <div class="section">
        <h3>Students Needing Improvement</h3>
        <table>
          <tr>
            <th>Registration Number</th>
            <th>SGPA</th>
            <th>Subjects with Arrears</th>
          </tr>
          ${analysis.needsImprovement.map(student => `
            <tr>
              <td>${student.id}</td>
              <td>${student.sgpa.toFixed(2)}</td>
              <td>${student.subjects || 'None'}</td>
            </tr>
          `).join('')}
        </table>
      </div>
      
      <div class="footer">
        <p>Generated on ${new Date().toLocaleDateString()} by Result Analysis Tool</p>
      </div>
    </body>
    </html>
  `;
};
