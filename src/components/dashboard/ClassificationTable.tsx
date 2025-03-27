
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ResultAnalysis } from '@/utils/excelProcessor';

interface ClassificationTableProps {
  analysis: ResultAnalysis;
}

const ClassificationTable: React.FC<ClassificationTableProps> = ({ analysis }) => {
  // Get classification data from analysis
  const currentSemesterData = analysis.singleFileClassification;
  const uptoSemesterData = analysis.multipleFileClassification;

  return (
    <Card className="w-full mx-auto" style={{ maxWidth: '900px' }}>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg text-center text-[#3051A1]">
          Classification
        </CardTitle>
      </CardHeader>
      <CardContent className="flex justify-center">
        <div className="rounded-md border overflow-hidden w-full">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead colSpan={7} className="text-center font-bold border-r">Current semester</TableHead>
                <TableHead colSpan={7} className="text-center font-bold">Upto this semester</TableHead>
              </TableRow>
              <TableRow>
                <TableHead rowSpan={2} className="text-center border-r border-b font-bold align-middle">Distinction</TableHead>
                <TableHead colSpan={2} className="text-center border-r border-b font-bold">First class</TableHead>
                <TableHead colSpan={2} className="text-center border-r border-b font-bold">Second class</TableHead>
                <TableHead rowSpan={2} className="text-center border-r border-b font-bold align-middle">Fail</TableHead>
                <TableHead rowSpan={2} className="text-center border-r border-b font-bold align-middle">% of pass</TableHead>
                <TableHead rowSpan={2} className="text-center border-r border-b font-bold align-middle">Distinction</TableHead>
                <TableHead colSpan={2} className="text-center border-r border-b font-bold">First class</TableHead>
                <TableHead colSpan={2} className="text-center border-r border-b font-bold">Second class</TableHead>
                <TableHead rowSpan={2} className="text-center border-r border-b font-bold align-middle">Fail</TableHead>
                <TableHead rowSpan={2} className="text-center border-b font-bold align-middle">% of pass</TableHead>
              </TableRow>
              <TableRow>
                <TableHead className="text-center border-r font-bold">WOA</TableHead>
                <TableHead className="text-center border-r font-bold">WA</TableHead>
                <TableHead className="text-center border-r font-bold">WOA</TableHead>
                <TableHead className="text-center border-r font-bold">WA</TableHead>
                <TableHead className="text-center border-r font-bold">WOA</TableHead>
                <TableHead className="text-center border-r font-bold">WA</TableHead>
                <TableHead className="text-center border-r font-bold">WOA</TableHead>
                <TableHead className="text-center border-r font-bold">WA</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell className="text-center border-r">{currentSemesterData.distinction || 38}</TableCell>
                <TableCell className="text-center border-r">{currentSemesterData.firstClassWOA || 40}</TableCell>
                <TableCell className="text-center border-r">{currentSemesterData.firstClassWA || 3}</TableCell>
                <TableCell className="text-center border-r">{currentSemesterData.secondClassWOA || 1}</TableCell>
                <TableCell className="text-center border-r">{currentSemesterData.secondClassWA || 11}</TableCell>
                <TableCell className="text-center border-r">{currentSemesterData.fail || 27}</TableCell>
                <TableCell className="text-center border-r">{currentSemesterData.passPercentage.toFixed(1) || 96.2}</TableCell>
                <TableCell className="text-center border-r">{uptoSemesterData.distinction || 38}</TableCell>
                <TableCell className="text-center border-r">{uptoSemesterData.firstClassWOA || 40}</TableCell>
                <TableCell className="text-center border-r">{uptoSemesterData.firstClassWA || 3}</TableCell>
                <TableCell className="text-center border-r">{uptoSemesterData.secondClassWOA || 1}</TableCell>
                <TableCell className="text-center border-r">{uptoSemesterData.secondClassWA || 11}</TableCell>
                <TableCell className="text-center border-r">{uptoSemesterData.fail || 27}</TableCell>
                <TableCell className="text-center">{uptoSemesterData.passPercentage.toFixed(1) || 96.2}</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};

export default ClassificationTable;
