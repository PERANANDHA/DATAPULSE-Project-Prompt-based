
import React, { useState, useEffect } from 'react';
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader, Building, FileSpreadsheet } from 'lucide-react';
import { getUniqueDepartmentCodes } from '@/utils/excelProcessor';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useIsMobile } from '@/hooks/use-mobile';

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
  const isMobile = useIsMobile();

  useEffect(() => {
    if (studentRecords && studentRecords.length > 0) {
      // Get unique department codes
      const codes = getUniqueDepartmentCodes(studentRecords);
      setDepartmentCodes(codes);
      
      // Calculate stats for each department
      const stats: {[deptCode: string]: {count: number}} = {};
      codes.forEach(code => {
        // Make sure we're filtering correctly by CNo field
        const recordsForDept = studentRecords.filter(record => record.CNo === code);
        // Get unique students by registration number
        const uniqueStudents = [...new Set(recordsForDept.map(record => record.REGNO))].length;
        stats[code] = { count: uniqueStudents };
      });
      
      setDepartmentStats(stats);
      
      // Reset input if needed
      if (selectedDepartment && !codes.includes(selectedDepartment)) {
        setInputCode("");
        setSelectedDepartment("");
        onDepartmentSelected("");
      }
    } else {
      // Clear everything if no records
      setDepartmentCodes([]);
      setDepartmentStats({});
    }
  }, [studentRecords, selectedDepartment, setSelectedDepartment, onDepartmentSelected]);

  const handleDepartmentSelect = (deptCode: string) => {
    setSelectedDepartment(deptCode);
    setInputCode(deptCode);
    onDepartmentSelected(deptCode);
  };

  const handleSubmit = () => {
    if (inputCode) {
      if (departmentCodes.includes(inputCode)) {
        onDepartmentSelected(inputCode);
      } else {
        // Allow custom codes too
        onDepartmentSelected(inputCode);
      }
    }
  };

  const handleClearSelection = () => {
    setSelectedDepartment("");
    setInputCode("");
    onDepartmentSelected("");
  };

  return (
    <Card className="overflow-hidden h-full">
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
            <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
              <Input
                id="departmentCode"
                value={inputCode}
                onChange={(e) => setInputCode(e.target.value)}
                placeholder="Enter department code (e.g., CS)"
                disabled={isProcessing}
                className="w-full"
              />
              <Button 
                onClick={handleSubmit}
                disabled={isProcessing || !inputCode}
                className={isMobile ? "w-full" : ""}
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
            <div className="mt-2 flex flex-wrap items-center gap-2">
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
              <div className="border rounded-md overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Department Code</TableHead>
                      <TableHead>Student Count</TableHead>
                      <TableHead className="w-[100px]"></TableHead>
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
                            className="whitespace-nowrap w-full"
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
                  <Badge key={code} variant="outline" className="mb-1">
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
