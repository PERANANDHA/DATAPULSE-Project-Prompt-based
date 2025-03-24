
import React, { useState, useEffect } from 'react';
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader, Building, FileSpreadsheet } from 'lucide-react';
import { getUniqueDepartmentCodes } from '@/utils/excelProcessor';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

interface DepartmentCodeInputProps {
  studentRecords: any[];
  selectedDepartment: string;
  setSelectedDepartment: (code: string) => void;
  onDepartmentSelected: (code: string) => void;
  isProcessing: boolean;
}

const DepartmentCodeInput: React.FC<DepartmentCodeInputProps> = ({
  studentRecords,
  selectedDepartment,
  setSelectedDepartment,
  onDepartmentSelected,
  isProcessing
}) => {
  const [departmentCodes, setDepartmentCodes] = useState<string[]>([]);
  const [departmentStats, setDepartmentStats] = useState<{[deptCode: string]: {count: number}}>({}); 
  const [inputCode, setInputCode] = useState<string>("");

  useEffect(() => {
    if (studentRecords.length > 0) {
      const codes = getUniqueDepartmentCodes(studentRecords);
      setDepartmentCodes(codes);
      
      // Calculate stats for each department
      const stats: {[deptCode: string]: {count: number}} = {};
      codes.forEach(code => {
        const recordsForDept = studentRecords.filter(record => record.CNo === code);
        const uniqueStudents = [...new Set(recordsForDept.map(record => record.REGNO))].length;
        stats[code] = { count: uniqueStudents };
      });
      
      setDepartmentStats(stats);
    }
  }, [studentRecords]);

  const handleDepartmentSelect = (deptCode: string) => {
    setSelectedDepartment(deptCode);
    setInputCode(deptCode);
  };

  const handleSubmit = () => {
    if (inputCode && departmentCodes.includes(inputCode)) {
      onDepartmentSelected(inputCode);
    } else if (inputCode) {
      onDepartmentSelected(inputCode); // Allow custom codes too
    }
  };

  const handleClearSelection = () => {
    setSelectedDepartment("");
    setInputCode("");
    onDepartmentSelected("");
  };

  return (
    <Card className="overflow-hidden">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Building className="h-5 w-5" />
          Department Code Selection
        </CardTitle>
        <CardDescription>
          Select or enter the department code for analysis. Only data from the selected department will be analyzed.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex flex-col space-y-2.5">
            <Label htmlFor="departmentCode">Department Code</Label>
            <div className="flex space-x-2">
              <Input
                id="departmentCode"
                value={inputCode}
                onChange={(e) => setInputCode(e.target.value)}
                placeholder="Enter department code (e.g., CS)"
                disabled={isProcessing}
              />
              <Button 
                onClick={handleSubmit}
                disabled={isProcessing || !inputCode}
              >
                {isProcessing ? (
                  <>
                    <Loader className="h-4 w-4 mr-2 animate-spin" />
                    Processing
                  </>
                ) : (
                  "Apply"
                )}
              </Button>
            </div>
          </div>

          {selectedDepartment && (
            <div className="mt-2 flex items-center space-x-2">
              <p className="text-sm text-muted-foreground">Selected: </p>
              <Badge variant="outline" className="px-2 py-1">
                {selectedDepartment}
              </Badge>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={handleClearSelection}
                disabled={isProcessing}
              >
                Clear
              </Button>
            </div>
          )}

          {departmentCodes.length > 0 && (
            <div className="mt-4">
              <h4 className="text-sm font-medium mb-2">Available Department Codes</h4>
              <div className="border rounded-md overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Department Code</TableHead>
                      <TableHead>Student Count</TableHead>
                      <TableHead></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {departmentCodes.map((code) => (
                      <TableRow key={code}>
                        <TableCell className="font-medium">{code}</TableCell>
                        <TableCell>{departmentStats[code]?.count || 0}</TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDepartmentSelect(code)}
                            disabled={isProcessing || selectedDepartment === code}
                          >
                            {selectedDepartment === code ? "Selected" : "Select"}
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}

          {departmentCodes.length > 1 && !selectedDepartment && (
            <div className="mt-2 p-3 bg-amber-50 border border-amber-200 rounded-md">
              <p className="text-sm text-amber-800">
                <span className="font-medium">Multiple department codes detected!</span> Please select a specific department code for focused analysis or leave blank to analyze all records.
              </p>
            </div>
          )}

          {departmentCodes.length > 1 && (
            <div className="mt-4">
              <h4 className="text-sm font-medium mb-2">Department Comparison</h4>
              <p className="text-sm text-muted-foreground mb-2">
                When you analyze the results, a comparison between departments will be generated automatically.
              </p>
              <div className="flex flex-wrap gap-2">
                {departmentCodes.map((code) => (
                  <Badge key={code} variant="outline">
                    <FileSpreadsheet className="h-3 w-3 mr-1" />
                    {code} ({departmentStats[code]?.count || 0} students)
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default DepartmentCodeInput;
