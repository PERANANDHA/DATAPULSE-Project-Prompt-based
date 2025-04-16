
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ResultAnalysis } from '@/utils/excelProcessor';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

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
  
  // For CGPA mode, we need to handle rank tables differently
  let topStudentsData = [];
  let tableTitle = "";
  let tableDescription = "";
  
  if (isCgpaMode) {
    if (useCumulativeData && analysis.cgpaAnalysis?.toppersList) {
      // This is the "Rank up to this semester" table in CGPA mode - use CGPA data
      // Include data from all semesters but exclude arrear subjects (already handled in the data)
      topStudentsData = analysis.cgpaAnalysis.toppersList.slice(0, 3).map((student, index) => ({
        rank: index + 1,
        id: student.id,
        value: student.cgpa,
        isCGPA: true,
        arrearSubjects: (analysis.cgpaAnalysis?.studentCGPAs.find(s => s.id === student.id)?.arrearSubjects || '')
      }));
      tableTitle = 'Student CGPA Rank Analysis';
      tableDescription = 'Top 3 students by Cumulative Grade Point Average';
    } else {
      // This is the "Rank in this semester" table in CGPA mode - use SGPA data from current semester only
      // Check if we have studentSgpaDetails (should have current semester SGPA)
      if (analysis.studentSgpaDetails && analysis.studentSgpaDetails.length > 0) {
        // Filter out students with arrear data (already handled during processing)
        const currentSemesterStudents = [...analysis.studentSgpaDetails];
        currentSemesterStudents.sort((a, b) => b.sgpa - a.sgpa);
        
        topStudentsData = currentSemesterStudents.slice(0, 3).map((student, index) => ({
          rank: index + 1,
          id: student.id,
          value: student.sgpa,
          isCGPA: false,
          arrearSubjects: student.arrearSubjects || ''
        }));
        tableTitle = 'Student SGPA Rank Analysis';
        tableDescription = 'Top 3 students by Semester Grade Point Average (Current Semester)';
      } else {
        console.warn("No SGPA details found for current semester in CGPA mode");
        topStudentsData = [];
        tableTitle = 'Student SGPA Rank Analysis';
        tableDescription = 'Top 3 students by Semester Grade Point Average (Current Semester)';
      }
    }
  } else {
    // Simple SGPA mode - use SGPA data
    const currentSemesterStudents = [...(analysis.studentSgpaDetails || [])];
    currentSemesterStudents.sort((a, b) => b.sgpa - a.sgpa);
    
    topStudentsData = currentSemesterStudents.slice(0, 3).map((student, index) => ({
      rank: index + 1,
      id: student.id,
      value: student.sgpa,
      isCGPA: false,
      arrearSubjects: student.arrearSubjects || ''
    }));
    tableTitle = 'Student SGPA Rank Analysis';
    tableDescription = 'Top 3 students by Semester Grade Point Average';
  }

  // Debug logging for troubleshooting
  console.log(`StudentSGPATable - Mode: ${calculationMode}, useCumulativeData: ${useCumulativeData}`);
  console.log("Top students data:", topStudentsData);

  return (
    <Card className="w-full mx-auto" style={{ maxWidth: '700px' }}>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg text-center">
          {tableTitle}
        </CardTitle>
        <CardDescription className="text-center">
          {tableDescription}
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
                  {useCumulativeData ? 'CGPA' : 'SGPA'}
                </TableHead>
                <TableHead className="text-center">Arrear Subjects</TableHead>
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
                  <TableCell className="text-center">
                    {student.arrearSubjects ? (
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Badge variant="outline" className="bg-red-100 hover:bg-red-200 cursor-help">
                              Has Arrears
                            </Badge>
                          </TooltipTrigger>
                          <TooltipContent className="max-w-xs">
                            <p className="font-mono text-xs">{student.arrearSubjects}</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    ) : (
                      <Badge variant="outline" className="bg-green-100">None</Badge>
                    )}
                  </TableCell>
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
