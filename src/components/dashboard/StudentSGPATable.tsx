
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ResultAnalysis } from '@/utils/excelProcessor';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';

interface StudentSGPATableProps {
  analysis: ResultAnalysis;
  calculationMode: 'sgpa' | 'cgpa' | null;
}

const StudentSGPATable: React.FC<StudentSGPATableProps> = ({ analysis, calculationMode }) => {
  const isCgpaMode = calculationMode === 'cgpa';
  
  // Get the appropriate student data based on calculation mode
  const studentData = isCgpaMode && analysis.cgpaAnalysis?.studentCGPAs 
    ? analysis.cgpaAnalysis.studentCGPAs.map(student => ({
        id: student.id,
        cgpa: student.cgpa,
        // For CGPA mode, check if student has arrears in any semester
        hasArrears: false // This will be properly handled in the table rendering
      }))
    : analysis.studentSgpaDetails || [];
  
  // Sort student data by SGPA/CGPA in descending order
  const sortedStudentData = [...studentData].sort((a, b) => {
    const valueA = isCgpaMode ? ('cgpa' in a ? a.cgpa : 0) : ('sgpa' in a ? a.sgpa : 0);
    const valueB = isCgpaMode ? ('cgpa' in b ? b.cgpa : 0) : ('sgpa' in b ? b.sgpa : 0);
    return valueB - valueA;
  });
  
  // Get only top 3 students
  const topThreeStudents = sortedStudentData.slice(0, 3);

  return (
    <Card className="w-full mx-auto" style={{ maxWidth: '700px' }}>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg text-center">
          {isCgpaMode ? 'Student CGPA Rank Analysis' : 'Student SGPA Rank Analysis'}
        </CardTitle>
        <CardDescription className="text-center">
          {isCgpaMode 
            ? 'Top 3 students by Cumulative Grade Point Average'
            : 'Top 3 students by Semester Grade Point Average'}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex justify-center">
        <div className="rounded-md border overflow-hidden" style={{ minWidth: '650px', width: '100%' }}>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-center">Rank</TableHead>
                <TableHead className="text-center">Name of the student</TableHead>
                <TableHead className="text-center">{isCgpaMode ? 'CGPA' : 'SGPA'}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {topThreeStudents.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={3} className="h-24 text-center">
                    No results found.
                  </TableCell>
                </TableRow>
              ) : (
                topThreeStudents.map((student, index) => {
                  // Calculate rank based on the sorted order
                  const rank = index + 1;
                  
                  return (
                    <TableRow key={student.id} className={rank <= 3 ? "bg-muted/30" : ""}>
                      <TableCell className="text-center">
                        <Badge variant={rank === 1 ? "default" : (rank === 2 ? "secondary" : "outline")} 
                               className={rank === 1 ? "bg-amber-500" : 
                                         (rank === 2 ? "bg-slate-400" : "bg-amber-700/30")}>
                          {rank}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">{student.id}</TableCell>
                      <TableCell className="text-center font-medium">
                        {isCgpaMode ? 
                          ('cgpa' in student ? student.cgpa.toFixed(2) : 0) : 
                          ('sgpa' in student ? student.sgpa.toFixed(2) : 0)}
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};

export default StudentSGPATable;
