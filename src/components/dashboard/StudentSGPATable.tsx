
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
    <Card className="overflow-hidden">
      <CardHeader>
        <CardTitle>Student-wise SGPA Analysis</CardTitle>
        <CardDescription>SGPA calculation for each student</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto border rounded-md">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-16 text-center">Rank</TableHead>
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
                
                // Determine status based on SGPA and arrears
                const getStatusText = () => {
                  if (student.hasArrears) {
                    return <span className="text-red-500 text-sm font-medium">Has Arrears</span>;
                  } else if (student.sgpa >= 8.5) {
                    return <span className="text-green-600 text-sm font-medium">Distinction</span>;
                  } else if (student.sgpa >= 6.5) {
                    return <span className="text-blue-500 text-sm font-medium">First Class</span>;
                  } else {
                    return <span className="text-amber-500 text-sm font-medium">Second Class</span>;
                  }
                };
                
                // Apply different background colors based on status
                const getRowClass = () => {
                  if (student.hasArrears) {
                    return "bg-red-50";
                  } else if (student.sgpa >= 8.5) {
                    return "bg-green-50";
                  } else if (student.sgpa >= 6.5) {
                    return "bg-blue-50";
                  } else {
                    return "bg-amber-50";
                  }
                };
                
                return (
                  <TableRow 
                    key={index} 
                    className={getRowClass()}
                  >
                    <TableCell className="text-center font-medium">{index + 1}</TableCell>
                    <TableCell>{student.id}</TableCell>
                    <TableCell className="text-center font-semibold">{student.sgpa.toFixed(2)}</TableCell>
                    {analysis.cgpaAnalysis && (
                      <TableCell className="text-center font-semibold">
                        {cgpa !== undefined ? cgpa.toFixed(2) : "-"}
                      </TableCell>
                    )}
                    <TableCell>
                      {getStatusText()}
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
