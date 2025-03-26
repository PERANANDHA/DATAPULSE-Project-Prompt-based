
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ResultAnalysis } from '@/utils/excelProcessor';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Search } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface StudentSGPATableProps {
  analysis: ResultAnalysis;
  calculationMode: 'sgpa' | 'cgpa' | null;
}

const StudentSGPATable: React.FC<StudentSGPATableProps> = ({ analysis, calculationMode }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const isCgpaMode = calculationMode === 'cgpa';
  
  // Get the appropriate student data based on calculation mode
  const studentData = isCgpaMode && analysis.cgpaAnalysis?.studentCGPAs 
    ? analysis.cgpaAnalysis.studentCGPAs.map(student => ({
        id: student.id,
        gpa: student.cgpa,
        // We don't have arrears info for CGPA directly, so omit it
        hasArrears: false
      }))
    : analysis.studentSgpaDetails || [];
  
  const filteredStudents = studentData.filter(student => 
    student.id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg">
          {isCgpaMode ? 'Student CGPA Details' : 'Student SGPA Details'}
        </CardTitle>
        <CardDescription>
          {isCgpaMode 
            ? 'Cumulative Grade Point Average for all students across semesters'
            : 'Semester Grade Point Average for all students'}
        </CardDescription>
        <div className="relative mt-2">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by registration number..."
            className="pl-8"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[50px]">S.No</TableHead>
                <TableHead>Registration Number</TableHead>
                <TableHead className="text-right">{isCgpaMode ? 'CGPA' : 'SGPA'}</TableHead>
                {!isCgpaMode && <TableHead className="text-right">Status</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredStudents.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={isCgpaMode ? 3 : 4} className="h-24 text-center">
                    No results found.
                  </TableCell>
                </TableRow>
              ) : (
                filteredStudents.map((student, index) => (
                  <TableRow key={student.id}>
                    <TableCell className="font-medium">{index + 1}</TableCell>
                    <TableCell>{student.id}</TableCell>
                    <TableCell className="text-right font-medium">{student.gpa.toFixed(2)}</TableCell>
                    {!isCgpaMode && (
                      <TableCell className="text-right">
                        {student.hasArrears ? (
                          <Badge variant="outline" className="bg-red-50 border-red-200 text-red-700">
                            Has Arrears
                          </Badge>
                        ) : student.gpa < 6.5 ? (
                          <Badge variant="outline" className="bg-amber-50 border-amber-200 text-amber-700">
                            Below 6.5
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="bg-green-50 border-green-200 text-green-700">
                            Good Standing
                          </Badge>
                        )}
                      </TableCell>
                    )}
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};

export default StudentSGPATable;
