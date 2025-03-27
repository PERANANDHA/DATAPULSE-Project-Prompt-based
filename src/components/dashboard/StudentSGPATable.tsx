
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ResultAnalysis } from '@/utils/excelProcessor';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Search } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface StudentSGPATableProps {
  analysis: ResultAnalysis;
  calculationMode: 'sgpa' | 'cgpa' | null;
}

// Define interfaces for student data
interface SgpaStudentData {
  id: string;
  sgpa: number;
  hasArrears: boolean;
}

interface CgpaStudentData {
  id: string;
  cgpa: number;
  hasArrears: boolean;
}

const StudentSGPATable: React.FC<StudentSGPATableProps> = ({ analysis, calculationMode }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const isCgpaMode = calculationMode === 'cgpa';
  
  // Get the appropriate student data based on calculation mode
  const studentData = isCgpaMode && analysis.cgpaAnalysis?.studentCGPAs 
    ? analysis.cgpaAnalysis.studentCGPAs.map(student => ({
        id: student.id,
        cgpa: student.cgpa,
        // We don't have arrears info for CGPA directly, so omit it
        hasArrears: false
      }))
    : analysis.studentSgpaDetails || [];
  
  const filteredStudents = studentData.filter(student => 
    student.id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <Card className="w-full mx-auto" style={{ maxWidth: '700px' }}>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg text-center">
          {isCgpaMode ? 'Student CGPA Details' : 'Student SGPA Details'}
        </CardTitle>
        <CardDescription className="text-center">
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
      <CardContent className="flex justify-center">
        <div className="rounded-md border overflow-hidden" style={{ minWidth: '650px', width: '100%' }}>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[50px] text-center">S.No</TableHead>
                <TableHead className="text-center">Registration Number</TableHead>
                <TableHead className="text-center">{isCgpaMode ? 'CGPA' : 'SGPA'}</TableHead>
                {!isCgpaMode && <TableHead className="text-center">Status</TableHead>}
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
                    <TableCell className="font-medium text-center">{index + 1}</TableCell>
                    <TableCell className="text-center">{student.id}</TableCell>
                    <TableCell className="text-center font-medium">
                      {isCgpaMode ? 
                        ('cgpa' in student ? student.cgpa.toFixed(2) : 0) : 
                        ('sgpa' in student ? student.sgpa.toFixed(2) : 0)}
                    </TableCell>
                    {!isCgpaMode && (
                      <TableCell className="text-center">
                        {student.hasArrears ? (
                          <Badge variant="outline" className="bg-red-50 border-red-200 text-red-700">
                            Has Arrears
                          </Badge>
                        ) : ('sgpa' in student && student.sgpa < 6.5) ? (
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
