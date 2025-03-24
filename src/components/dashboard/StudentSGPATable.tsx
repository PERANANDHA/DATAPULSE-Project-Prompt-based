
import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { ResultAnalysis } from '@/utils/excelProcessor';

interface StudentSGPATableProps {
  analysis: ResultAnalysis;
}

const StudentSGPATable: React.FC<StudentSGPATableProps> = ({ analysis }) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Student-wise SGPA Analysis</CardTitle>
        <CardDescription>SGPA calculation for each student</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[600px] border-collapse">
            <thead>
              <tr className="border-b">
                <th className="py-2 px-4 text-left">Registration Number</th>
                <th className="py-2 px-4 text-left">SGPA</th>
                <th className="py-2 px-4 text-left">Status</th>
              </tr>
            </thead>
            <tbody>
              {analysis.studentSgpaDetails?.map((student, index) => (
                <tr 
                  key={index} 
                  className={`border-b ${
                    student.hasArrears ? "bg-red-50" : 
                    Number(student.sgpa) < 6.5 ? "bg-amber-50" : 
                    "hover:bg-gray-50"
                  }`}
                >
                  <td className="py-2 px-4">{student.id}</td>
                  <td className="py-2 px-4 font-medium">{student.sgpa.toFixed(2)}</td>
                  <td className="py-2 px-4">
                    {student.hasArrears ? (
                      <span className="text-red-500 text-sm">Has Arrears</span>
                    ) : Number(student.sgpa) < 6.5 ? (
                      <span className="text-amber-500 text-sm">SGPA below 6.5</span>
                    ) : (
                      <span className="text-green-500 text-sm">Good Standing</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
};

export default StudentSGPATable;
