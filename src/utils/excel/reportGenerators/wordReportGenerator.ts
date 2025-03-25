
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
          h1 { text-align: center; color: #2F3770; font-size: 24px; margin-bottom: 30px; }
          h2 { color: #2F3770; font-size: 18px; margin-top: 30px; margin-bottom: 15px; }
          table { border-collapse: collapse; width: 100%; margin: 15px 0; page-break-inside: avoid; }
          th, td { border: 1px solid #ddd; padding: 6px 8px; text-align: left; font-size: 11pt; }
          th { background-color: #f2f2f2; font-weight: bold; text-align: center; }
          .section-title { background-color: #d9d9d9; padding: 10px; margin-top: 30px; margin-bottom: 20px; }
          .summary { margin: 20px 0; }
          .summary p { margin: 5px 0; line-height: 1.5; }
          .end-semester-table th, .end-semester-table td { 
            text-align: center; 
            padding: 6px 4px;
            font-size: 10pt;
          }
          .end-semester-table th:first-child, .end-semester-table td:first-child { text-align: center; }
          .end-semester-table th:nth-child(2), .end-semester-table td:nth-child(2), 
          .end-semester-table th:nth-child(3), .end-semester-table td:nth-child(3) { text-align: left; }
          @page { size: landscape; }
        </style>
      </head>
      <body>
        <h1>Result Analysis Report</h1>
        
        <h2>College Information</h2>
        <table>
          <tr>
            <td style="width: 30%; font-weight: bold;">College Name</td>
            <td style="width: 70%;">K. S. Rangasamy College of Technology</td>
          </tr>
          <tr>
            <td style="font-weight: bold;">Department</td>
            <td>Computer Science and Engineering</td>
          </tr>
          <tr>
            <td style="font-weight: bold;">Total Students</td>
            <td>${analysis.totalStudents}</td>
          </tr>
          <tr>
            <td style="font-weight: bold;">Files Processed</td>
            <td>${analysis.fileCount || 1}</td>
          </tr>
        </table>
        
        <h2>Performance Summary</h2>
        <div class="summary">
          <p><strong>Average SGPA:</strong> ${analysis.averageCGPA.toFixed(2)}</p>
          <p><strong>Highest SGPA:</strong> ${analysis.highestSGPA.toFixed(2)}</p>
          <p><strong>Lowest SGPA:</strong> ${analysis.lowestSGPA.toFixed(2)}</p>
          <p><strong>Pass Percentage:</strong> ${analysis.passFailData[0].value.toFixed(2)}%</p>`;
          
    // Add CGPA information if multiple files were processed
    if (analysis.cgpaAnalysis) {
      htmlContent += `
          <p><strong>Average CGPA (Multiple Semesters):</strong> ${analysis.cgpaAnalysis.averageCGPA.toFixed(2)}</p>
          <p><strong>Highest CGPA:</strong> ${analysis.cgpaAnalysis.highestCGPA.toFixed(2)}</p>
          <p><strong>Lowest CGPA:</strong> ${analysis.cgpaAnalysis.lowestCGPA.toFixed(2)}</p>`;
    }
    
    htmlContent += `
        </div>
        
        <h2>File Analysis</h2>
        <table>
          <tr>
            <th>File Name</th>
            <th>Students</th>
            <th>Average SGPA</th>
            <th>Semester</th>
          </tr>`;
    
    // Add file analysis data
    if (analysis.fileWiseAnalysis) {
      Object.entries(analysis.fileWiseAnalysis).forEach(([fileName, fileData]) => {
        htmlContent += `
          <tr>
            <td>${fileName}</td>
            <td>${fileData.students}</td>
            <td>${fileData.averageSGPA.toFixed(2)}</td>
            <td>${fileData.semesterName || ''}</td>
          </tr>`;
      });
    } else {
      // If no file analysis, show at least one row with available data
      htmlContent += `
        <tr>
          <td>${analysis.filesProcessed?.[0] || 'Results.xlsx'}</td>
          <td>${analysis.totalStudents}</td>
          <td>${analysis.averageCGPA.toFixed(2)}</td>
          <td></td>
        </tr>`;
    }
    
    // Close file analysis table
    htmlContent += `
        </table>`;
    
    // Add CGPA toppers list if available (multiple files were processed)
    if (analysis.cgpaAnalysis?.toppersList && analysis.cgpaAnalysis.toppersList.length > 0) {
      htmlContent += `
        <h2>CGPA Toppers List (Up to this Semester)</h2>
        <table>
          <tr>
            <th>Rank</th>
            <th>Register Number</th>
            <th>CGPA</th>
          </tr>`;
      
      // Add toppers data
      analysis.cgpaAnalysis.toppersList.forEach((student, index) => {
        htmlContent += `
          <tr>
            <td style="text-align: center;">${index + 1}</td>
            <td>${student.id}</td>
            <td style="text-align: center;">${student.cgpa.toFixed(2)}</td>
          </tr>`;
      });
      
      // Close CGPA toppers table
      htmlContent += `
        </table>`;
    }
    
    htmlContent += `
        <div class="section-title">
          <h2 style="margin: 0;">End Semester Result Analysis</h2>
        </div>
        
        <table class="end-semester-table">
          <tr>
            <th style="width: 5%;">S.No</th>
            <th style="width: 12%;">Subject Code</th>
            <th style="width: 12%;">Subject Name</th>
            <th style="width: 12%;">Faculty Name</th>
            <th style="width: 8%;">Dept</th>
            <th style="width: 6%;">App</th>
            <th style="width: 6%;">Ab</th>
            <th style="width: 6%;">Fail</th>
            <th style="width: 6%;">WH</th>
            <th style="width: 8%;">Passed</th>
            <th style="width: 7%;">% of pass</th>
            <th style="width: 7%;">Highest Grade</th>
            <th style="width: 7%;">No. of students</th>
          </tr>`;
    
    // Create subject-wise performance data - exactly matching your table format
    if (analysis.subjectPerformance) {
      analysis.subjectPerformance.forEach((subject, index) => {
        // Get the highest grade for this subject
        let highestGrade = 'N/A';
        let studentsWithHighestGrade = 0;
        
        if (analysis.subjectGradeDistribution && analysis.subjectGradeDistribution[subject.subject]) {
          const grades = analysis.subjectGradeDistribution[subject.subject];
          if (grades.length > 0) {
            // Sort grades by grade point (assuming 'O' is highest)
            const sortedGrades = [...grades].sort((a, b) => {
              const gradeOrder = {'O': 10, 'A+': 9, 'A': 8, 'B+': 7, 'B': 6, 'C': 5, 'P': 4, 'U': 0};
              return (gradeOrder[b.name as keyof typeof gradeOrder] || 0) - (gradeOrder[a.name as keyof typeof gradeOrder] || 0);
            });
            
            highestGrade = sortedGrades[0].name;
            studentsWithHighestGrade = sortedGrades[0].count;
          }
        }
        
        // Calculate metrics for this subject
        const subjectRecords = records.filter(r => r.SCODE === subject.subject);
        const appeared = subjectRecords.length;
        const absent = 0; // No data for this, using "Nil"
        const failed = subjectRecords.filter(r => r.GR === 'U').length;
        const withheld = 0; // No data for this
        const passed = appeared - failed;
        const passPercentage = appeared > 0 ? (passed / appeared) * 100 : 0;
        
        htmlContent += `
          <tr>
            <td>${index + 1}</td>
            <td>${subject.subject}</td>
            <td>Subject ${index + 1}</td>
            <td></td>
            <td>CSE</td>
            <td>${appeared}</td>
            <td>Nil</td>
            <td>${failed > 0 ? failed : 'Nil'}</td>
            <td>${withheld}</td>
            <td>${passed}</td>
            <td>${passPercentage.toFixed(1)}</td>
            <td>${highestGrade}</td>
            <td>${studentsWithHighestGrade}</td>
          </tr>`;
      });
    }
    
    // Close subject performance table and add individual student performance
    htmlContent += `
        </table>
        
        <h2>Individual Student Performance</h2>
        <table>
          <tr>
            <th style="width: 5%;">S.No</th>
            <th style="width: 20%;">Register Number</th>
            <th style="width: 15%;">SGPA</th>
            ${analysis.cgpaAnalysis ? '<th style="width: 15%;">CGPA</th>' : ''}
            <th>Status</th>
          </tr>`;
    
    // Add individual student performance data
    if (analysis.studentSgpaDetails) {
      analysis.studentSgpaDetails.forEach((student, index) => {
        // Find CGPA if available
        let cgpa = '';
        if (analysis.cgpaAnalysis) {
          const studentCgpa = analysis.cgpaAnalysis.studentCGPAs.find(s => s.id === student.id);
          if (studentCgpa) {
            cgpa = studentCgpa.cgpa.toFixed(2);
          }
        }
        
        // Determine status
        let status = 'Good Standing';
        if (student.hasArrears) {
          status = 'Has Arrears';
        } else if (student.sgpa < 6.5) {
          status = 'SGPA below 6.5';
        }
        
        htmlContent += `
          <tr>
            <td style="text-align: center;">${index + 1}</td>
            <td>${student.id}</td>
            <td style="text-align: center;">${student.sgpa.toFixed(2)}</td>
            ${analysis.cgpaAnalysis ? `<td style="text-align: center;">${cgpa}</td>` : ''}
            <td>${status}</td>
          </tr>`;
      });
    }
    
    // Close individual performance table
    htmlContent += `
        </table>
        
        <div style="margin-top: 40px; text-align: center; font-size: 12px; color: #666;">
          <p>Report generated by Result Analysis System - ${new Date().toLocaleDateString()}</p>
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
