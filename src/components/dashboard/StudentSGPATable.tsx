
import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { ResultAnalysis } from '@/utils/excelProcessor';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";

interface StudentSGPATableProps {
  analysis: ResultAnalysis;
}

const StudentSGPATable: React.FC<StudentSGPATableProps> = ({ analysis }) => {
  // Sort students by SGPA descending
  const sortedStudents = [...(analysis.studentSgpaDetails || [])].sort((a, b) => b.sgpa - a.sgpa);
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Student-wise SGPA Analysis</CardTitle>
        <CardDescription>SGPA calculation for each student</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto border rounded-md">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-16">Rank</TableHead>
                <TableHead>Registration Number</TableHead>
                <TableHead className="w-24 text-center">SGPA</TableHead>
                {analysis.cgpaAnalysis && (
                  <TableHead className="w-24 text-center">CGPA</TableHead>
                )}
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedStudents.map((student, index) => {
                // Find CGPA if available
                let cgpa = undefined;
                if (analysis.cgpaAnalysis?.studentCGPAs) {
                  const cgpaInfo = analysis.cgpaAnalysis.studentCGPAs.find(s => s.id === student.id);
                  cgpa = cgpaInfo?.cgpa;
                }
                
                return (
                  <TableRow 
                    key={index} 
                    className={
                      student.hasArrears ? "bg-red-50" : 
                      student.sgpa < 6.5 ? "bg-amber-50" : 
                      index < 3 ? "bg-green-50" :
                      ""
                    }
                  >
                    <TableCell className="text-center font-medium">{index + 1}</TableCell>
                    <TableCell>{student.id}</TableCell>
                    <TableCell className="text-center font-medium">{student.sgpa.toFixed(2)}</TableCell>
                    {analysis.cgpaAnalysis && (
                      <TableCell className="text-center font-medium">
                        {cgpa !== undefined ? cgpa.toFixed(2) : "-"}
                      </TableCell>
                    )}
                    <TableCell>
                      {student.hasArrears ? (
                        <span className="text-red-500 text-sm font-medium">Has Arrears</span>
                      ) : student.sgpa < 6.5 ? (
                        <span className="text-amber-500 text-sm font-medium">SGPA below 6.5</span>
                      ) : index < 3 ? (
                        <span className="text-green-500 text-sm font-medium">Top Performer</span>
                      ) : (
                        <span className="text-green-500 text-sm">Good Standing</span>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};

export default StudentSGPATable;
