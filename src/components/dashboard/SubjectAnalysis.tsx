
import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ResultAnalysis } from '@/utils/excelProcessor';
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  Cell, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip as RechartsTooltip,
  Legend 
} from 'recharts';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";

interface SubjectAnalysisProps {
  analysis: ResultAnalysis;
}

const SubjectAnalysis: React.FC<SubjectAnalysisProps> = ({ analysis }) => {
  const uniqueSubjects = Object.keys(analysis.subjectGradeDistribution);
  const [activeSubjectTab, setActiveSubjectTab] = useState<string>(uniqueSubjects[0] || '');

  return (
    <>
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Subject-wise Grade Distribution</CardTitle>
          <CardDescription>Grade breakdown for each subject</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs 
            value={activeSubjectTab} 
            onValueChange={setActiveSubjectTab}
            className="space-y-4"
          >
            <TabsList className="flex flex-wrap mb-4 h-auto">
              {uniqueSubjects.map(subject => (
                <TabsTrigger key={subject} value={subject}>
                  {subject}
                </TabsTrigger>
              ))}
            </TabsList>
            
            {uniqueSubjects.map(subject => (
              <TabsContent key={subject} value={subject}>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart 
                      data={analysis.subjectGradeDistribution[subject]}
                      margin={{ top: 20, right: 30, left: 20, bottom: 30 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <RechartsTooltip 
                        formatter={(value: any) => [`Count: ${value}`, 'Students']}
                        labelFormatter={(label) => `Grade: ${label}`}
                      />
                      <Legend layout="horizontal" verticalAlign="top" align="center" />
                      <Bar dataKey="count" name="Number of Students">
                        {analysis.subjectGradeDistribution[subject].map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.fill} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                <div className="mt-6 border rounded-md overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Grade</TableHead>
                        <TableHead>Number of Students</TableHead>
                        <TableHead>Percentage</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {analysis.subjectGradeDistribution[subject].map((grade, index) => {
                        const totalStudents = analysis.subjectGradeDistribution[subject].reduce(
                          (sum, g) => sum + g.count, 0
                        );
                        const percentage = totalStudents > 0 
                          ? ((grade.count / totalStudents) * 100).toFixed(1) 
                          : "0.0";
                          
                        return (
                          <TableRow key={index}>
                            <TableCell className="font-medium">{grade.name}</TableCell>
                            <TableCell>{grade.count}</TableCell>
                            <TableCell>{percentage}%</TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              </TabsContent>
            ))}
          </Tabs>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Subject-wise Performance</CardTitle>
          <CardDescription>Pass/fail rate across different subjects</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart 
                data={analysis.subjectPerformance}
                margin={{ top: 20, right: 30, left: 20, bottom: 50 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="subject" 
                  angle={-45} 
                  textAnchor="end" 
                  height={70} 
                  interval={0}
                />
                <YAxis domain={[0, 100]} />
                <RechartsTooltip 
                  formatter={(value: number) => [`${value.toFixed(1)}%`, 'Percentage']}
                  labelFormatter={(label) => `Subject: ${label}`}
                />
                <Legend layout="horizontal" verticalAlign="top" align="center" />
                <Bar dataKey="pass" stackId="a" fill="#22c55e" name="Pass %" />
                <Bar dataKey="fail" stackId="a" fill="#ef4444" name="Fail %" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="mt-6 border rounded-md overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Subject Code</TableHead>
                  <TableHead>Pass %</TableHead>
                  <TableHead>Fail %</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {analysis.subjectPerformance.map((subject, index) => (
                  <TableRow key={index}>
                    <TableCell className="font-medium">{subject.subject}</TableCell>
                    <TableCell>{subject.pass.toFixed(1)}%</TableCell>
                    <TableCell>{subject.fail.toFixed(1)}%</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </>
  );
};

export default SubjectAnalysis;
