
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Loader, Trash2 } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { useToast } from '@/hooks/use-toast';

interface SubjectCredit {
  subjectCode: string;
  creditValue: number;
  subjectName: string; // Changed from optional to required
  facultyName: string; // Changed from optional to required
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
    // Initialize with default credit value of 3, empty subject name, and empty faculty name
    if (uploadedSubjects.length > 0) {
      const initialCredits = uploadedSubjects.map((subject) => ({
        subjectCode: subject,
        creditValue: 3,
        subjectName: '', // Initialize with empty string
        facultyName: '' // Initialize with empty string
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

  const handleFacultyNameChange = (subjectCode: string, name: string) => {
    const updatedCredits = subjectCredits.map((credit) => 
      credit.subjectCode === subjectCode 
        ? { ...credit, facultyName: name } 
        : credit
    );
    
    setSubjectCredits(updatedCredits);
    validateInputs(updatedCredits);
  };

  const handleRemoveSubject = (subjectCode: string) => {
    const updatedCredits = subjectCredits.filter(credit => credit.subjectCode !== subjectCode);
    setSubjectCredits(updatedCredits);
    validateInputs(updatedCredits);
    
    toast({
      title: "Subject removed",
      description: `Subject ${subjectCode} has been removed from the list.`,
    });
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
        <CardTitle>Assign Subject Details</CardTitle>
        <CardDescription>
          Specify credit values (1-10), subject names and faculty names for each subject code found in the uploaded file(s).
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
                <TableHead>Faculty Name</TableHead>
                <TableHead className="w-20">Actions</TableHead>
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
                  <TableCell>
                    <Input
                      type="text"
                      placeholder="Enter faculty name"
                      value={subject.facultyName}
                      onChange={(e) => handleFacultyNameChange(subject.subjectCode, e.target.value)}
                      className="w-full mx-auto"
                    />
                  </TableCell>
                  <TableCell>
                    <Button 
                      variant="ghost" 
                      size="icon"
                      onClick={() => handleRemoveSubject(subject.subjectCode)}
                      className="text-destructive hover:text-destructive/90 hover:bg-destructive/10"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
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
              'Assign Details & Process Data'
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default SubjectCreditInput;
