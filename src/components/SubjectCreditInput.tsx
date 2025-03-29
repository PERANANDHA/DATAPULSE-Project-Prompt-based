
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Loader } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { useToast } from '@/hooks/use-toast';

interface SubjectCredit {
  subjectCode: string;
  creditValue: number;
  subjectName?: string; // Added subject name field
}

interface SubjectCreditInputProps {
  uploadedSubjects: string[];
  onCreditAssigned: (credits: SubjectCredit[]) => void;
  isProcessing: boolean;
}

const SubjectCreditInput: React.FC<SubjectCreditInputProps> = ({ 
  uploadedSubjects, 
  onCreditAssigned,
  isProcessing
}) => {
  const [subjectCredits, setSubjectCredits] = useState<SubjectCredit[]>([]);
  const [isValid, setIsValid] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    // Initialize with default credit value of 3 and empty subject name
    if (uploadedSubjects.length > 0) {
      const initialCredits = uploadedSubjects.map((subject) => ({
        subjectCode: subject,
        creditValue: 3,
        subjectName: ''
      }));
      setSubjectCredits(initialCredits);
      validateInputs(initialCredits);
    } else {
      setSubjectCredits([]);
      setIsValid(false);
    }
  }, [uploadedSubjects]);

  const handleCreditChange = (subjectCode: string, value: string) => {
    const numValue = parseInt(value, 10);
    
    if (isNaN(numValue) || numValue < 1 || numValue > 10) {
      return; // Don't update if invalid
    }
    
    const updatedCredits = subjectCredits.map((credit) => 
      credit.subjectCode === subjectCode 
        ? { ...credit, creditValue: numValue } 
        : credit
    );
    
    setSubjectCredits(updatedCredits);
    validateInputs(updatedCredits);
  };

  const handleSubjectNameChange = (subjectCode: string, name: string) => {
    const updatedCredits = subjectCredits.map((credit) => 
      credit.subjectCode === subjectCode 
        ? { ...credit, subjectName: name } 
        : credit
    );
    
    setSubjectCredits(updatedCredits);
    validateInputs(updatedCredits);
  };

  const validateInputs = (credits: SubjectCredit[]) => {
    // Check if all credits are assigned with valid values
    const allValid = credits.length > 0 && 
      credits.every(credit => 
        credit.creditValue >= 1 && 
        credit.creditValue <= 10
      );
    
    setIsValid(allValid);
  };

  const handleSubmit = () => {
    if (!isValid) {
      toast({
        variant: "destructive",
        title: "Invalid credit values",
        description: "Please ensure all subjects have valid credit values (1-10).",
      });
      return;
    }
    
    onCreditAssigned(subjectCredits);
    
    toast({
      title: "Credit values assigned",
      description: "Subject credits have been successfully assigned.",
    });
  };

  if (uploadedSubjects.length === 0) {
    return (
      <Card className="col-span-1 lg:col-span-2 shadow-md overflow-hidden">
        <CardHeader className="pb-2">
          <CardTitle>Subject Credits</CardTitle>
          <CardDescription>
            Please upload an Excel file first to assign subject credits.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card className="col-span-1 lg:col-span-2 shadow-md">
      <CardHeader className="pb-2">
        <CardTitle>Assign Subject Credits and Names</CardTitle>
        <CardDescription>
          Specify credit values (1-10) and names for each subject code found in the uploaded file(s).
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border overflow-hidden mt-2">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Subject Code</TableHead>
                <TableHead>Credit Value</TableHead>
                <TableHead>Subject Name</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {subjectCredits.map((subject) => (
                <TableRow key={subject.subjectCode}>
                  <TableCell className="font-medium">{subject.subjectCode}</TableCell>
                  <TableCell>
                    <Input
                      type="number"
                      min={1}
                      max={10}
                      value={subject.creditValue}
                      onChange={(e) => handleCreditChange(subject.subjectCode, e.target.value)}
                      className="w-20 mx-auto text-center"
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      type="text"
                      placeholder="Enter subject name"
                      value={subject.subjectName}
                      onChange={(e) => handleSubjectNameChange(subject.subjectCode, e.target.value)}
                      className="w-full mx-auto"
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        <div className="mt-4 flex justify-end">
          <Button 
            onClick={handleSubmit} 
            disabled={!isValid || isProcessing}
            className="w-full sm:w-auto"
          >
            {isProcessing ? (
              <>
                <Loader className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              'Assign Credits & Process Data'
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default SubjectCreditInput;
