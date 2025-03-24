
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

interface SubjectAnalysisProps {
  analysis: ResultAnalysis;
}

const SubjectAnalysis: React.FC<SubjectAnalysisProps> = ({ analysis }) => {
  const uniqueSubjects = Object.keys(analysis.subjectGradeDistribution);
  const [activeSubjectTab, setActiveSubjectTab] = useState<string>(uniqueSubjects[0] || '');

  return (
    <>
      <Card>
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
            <TabsList className="flex flex-wrap mb-4">
              {uniqueSubjects.map(subject => (
                <TabsTrigger key={subject} value={subject}>
                  {subject}
                </TabsTrigger>
              ))}
            </TabsList>
            
            {uniqueSubjects.map(subject => (
              <TabsContent key={subject} value={subject}>
                <div className="h-[250px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={analysis.subjectGradeDistribution[subject]}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <RechartsTooltip />
                      <Bar dataKey="count" name="Count">
                        {analysis.subjectGradeDistribution[subject].map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.fill} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
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
              <BarChart data={analysis.subjectPerformance}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="subject" />
                <YAxis />
                <RechartsTooltip formatter={(value: number) => `${value.toFixed(2)}%`} />
                <Legend />
                <Bar dataKey="pass" stackId="a" fill="#22c55e" name="Pass %" />
                <Bar dataKey="fail" stackId="a" fill="#ef4444" name="Fail %" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </>
  );
};

export default SubjectAnalysis;
