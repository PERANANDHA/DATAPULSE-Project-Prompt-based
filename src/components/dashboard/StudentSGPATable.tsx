
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
  
  // Hard-coded sample data as requested by the user
  const topThreeStudents = [
    { rank: 1, id: '10422086', sgpa: 9.78 },
    { rank: 2, id: '10421033', sgpa: 9.67 },
    { rank: 3, id: '10422078', sgpa: 9.67 }
  ];

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
              {topThreeStudents.map((student) => (
                <TableRow key={student.id} className={student.rank <= 3 ? "bg-muted/30" : ""}>
                  <TableCell className="text-center">
                    <Badge variant={student.rank === 1 ? "default" : (student.rank === 2 ? "secondary" : "outline")} 
                           className={student.rank === 1 ? "bg-amber-500" : 
                                     (student.rank === 2 ? "bg-slate-400" : "bg-amber-700/30")}>
                      {student.rank}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-center">{student.id}</TableCell>
                  <TableCell className="text-center font-medium">{student.sgpa.toFixed(2)}</TableCell>
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
