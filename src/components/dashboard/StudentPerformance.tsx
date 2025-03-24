
import React from 'react';
import { User } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { ResultAnalysis } from '@/utils/excelProcessor';

interface StudentPerformanceProps {
  analysis: ResultAnalysis;
}

const StudentPerformance: React.FC<StudentPerformanceProps> = ({ analysis }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <User className="h-5 w-5 mr-2" />
            Top Performers
          </CardTitle>
          <CardDescription>Students with highest SGPA (Top 6)</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {analysis.topPerformers.map((student, index) => (
              <div key={index} className="flex justify-between items-center p-2 rounded-md hover:bg-muted/50">
                <div>
                  <p className="font-medium">Student</p>
                  <p className="text-xs text-muted-foreground">ID: {student.id}</p>
                </div>
                <div className="flex items-center">
                  <span className={`px-2 py-1 rounded-full text-xs mr-2 ${
                    student.grade === "O" ? "bg-primary/10 text-primary" :
                    student.grade === "A+" ? "bg-green-100 text-green-800" :
                    "bg-blue-100 text-blue-800"
                  }`}>
                    {student.grade}
                  </span>
                  <span className="font-semibold">{student.sgpa.toFixed(2)}</span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <User className="h-5 w-5 mr-2" />
            Needs Improvement
          </CardTitle>
          <CardDescription>Students with SGPA below 6.5 or with arrears</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {analysis.needsImprovement.length > 0 ? (
              analysis.needsImprovement.map((student, index) => (
                <div key={index} className="flex justify-between items-center p-2 rounded-md hover:bg-muted/50">
                  <div>
                    <p className="font-medium">Student</p>
                    <p className="text-xs text-muted-foreground">ID: {student.id}</p>
                  </div>
                  <div className="text-right">
                    <span className="font-semibold text-destructive">{student.sgpa.toFixed(2)}</span>
                    <p className="text-xs text-muted-foreground">{student.subjects}</p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-muted-foreground text-center">No students with SGPA below 6.5 or with arrears</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default StudentPerformance;
