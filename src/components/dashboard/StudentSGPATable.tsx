
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ResultAnalysis } from '@/utils/excelProcessor';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';

interface StudentSGPATableProps {
  analysis: ResultAnalysis;
  calculationMode: 'sgpa' | 'cgpa' | null;
  useCumulativeData?: boolean; // New prop to determine which dataset to use
}

const StudentSGPATable: React.FC<StudentSGPATableProps> = ({ 
  analysis, 
  calculationMode,
  useCumulativeData = false // Default to current semester data
}) => {
  const isCgpaMode = calculationMode === 'cgpa';
  
  // Use cumulative data when explicitly asked or in CGPA mode
  // For rank analysis and classification, we always use cumulative data (UPTO THIS SEMESTER)
  const shouldUseCumulativeData = useCumulativeData || isCgpaMode;
  
  // Determine which students data to use based on the requirements
  let topStudentsData = [];
  
  if (shouldUseCumulativeData && analysis.cgpaAnalysis?.toppersList) {
    // For "Subject Credits FOR UPTO THIS SEMESTER" or CGPA mode
    topStudentsData = analysis.cgpaAnalysis.toppersList.slice(0, 3).map((student, index) => ({
      rank: index + 1,
      id: student.id,
      value: student.cgpa
    }));
  } else {
    // For "Subject Credits for CURRENT SEMESTER" in SGPA mode
    // Get SGPA data from current semester
    const currentSemesterStudents = [...(analysis.studentSgpaDetails || [])];
    currentSemesterStudents.sort((a, b) => b.sgpa - a.sgpa);
    
    topStudentsData = currentSemesterStudents.slice(0, 3).map((student, index) => ({
      rank: index + 1,
      id: student.id,
      value: student.sgpa
    }));
  }

  return (
    <Card className="w-full mx-auto" style={{ maxWidth: '700px' }}>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg text-center">
          {shouldUseCumulativeData 
            ? 'Student CGPA Rank Analysis'
            : 'Student SGPA Rank Analysis'}
        </CardTitle>
        <CardDescription className="text-center">
          {shouldUseCumulativeData 
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
                <TableHead className="text-center">
                  {shouldUseCumulativeData ? 'CGPA' : 'SGPA'}
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {topStudentsData.map((student) => (
                <TableRow key={student.id} className={student.rank <= 3 ? "bg-muted/30" : ""}>
                  <TableCell className="text-center">
                    <Badge variant={student.rank === 1 ? "default" : (student.rank === 2 ? "secondary" : "outline")} 
                           className={student.rank === 1 ? "bg-amber-500" : 
                                     (student.rank === 2 ? "bg-slate-400" : "bg-amber-700/30")}>
                      {student.rank}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-center">{student.id}</TableCell>
                  <TableCell className="text-center font-medium">{student.value.toFixed(2)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};

export default StudentSGPATable;
