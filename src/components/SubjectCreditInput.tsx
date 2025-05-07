
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Loader, Trash2, AlertTriangle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { useToast } from '@/hooks/use-toast';

interface SubjectCredit {
  subjectCode: string;
  creditValue: number;
  subjectName?: string;
  facultyName?: string;
  isArrear?: boolean;
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

  // Initialize or reset subject credits when uploaded subjects change
  useEffect(() => {
    if (uploadedSubjects.length > 0) {
      const initialCredits = uploadedSubjects.map(subject => ({
        subjectCode: subject,
        creditValue: 3,
        subjectName: '',
        facultyName: '',
        isArrear: false
      }));
      setSubjectCredits(initialCredits);
      validateInputs(initialCredits);
      
      console.log("Initialized subject credits:", initialCredits);
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
    
    const updatedCredits = subjectCredits.map(credit => 
      credit.subjectCode === subjectCode ? {
        ...credit,
        creditValue: numValue
      } : credit
    );
    
    setSubjectCredits(updatedCredits);
    validateInputs(updatedCredits);
    console.log(`Credit value updated for ${subjectCode}: ${numValue}`);
  };

  const handleSubjectNameChange = (subjectCode: string, name: string) => {
    const updatedCredits = subjectCredits.map(credit => 
      credit.subjectCode === subjectCode ? {
        ...credit,
        subjectName: name
      } : credit
    );
    
    setSubjectCredits(updatedCredits);
    validateInputs(updatedCredits);
    console.log(`Subject name updated for ${subjectCode}: ${name}`);
  };

  const handleFacultyNameChange = (subjectCode: string, name: string) => {
    const updatedCredits = subjectCredits.map(credit => 
      credit.subjectCode === subjectCode ? {
        ...credit,
        facultyName: name
      } : credit
    );
    
    setSubjectCredits(updatedCredits);
    validateInputs(updatedCredits);
    console.log(`Faculty name updated for ${subjectCode}: ${name}`);
  };

  const handleToggleArrear = (subjectCode: string) => {
    const updatedCredits = subjectCredits.map(credit => 
      credit.subjectCode === subjectCode ? {
        ...credit,
        isArrear: !credit.isArrear
      } : credit
    );
    
    setSubjectCredits(updatedCredits);
    validateInputs(updatedCredits);
    
    const subject = updatedCredits.find(credit => credit.subjectCode === subjectCode);
    if (subject) {
      toast({
        title: subject.isArrear ? "Subject added to Current Semester" : "Subject removed from Current Semester",
        description: `Subject ${subjectCode} has been ${subject.isArrear ? "added to" : "removed from"} current semester subjects.`
      });
      console.log(`Subject ${subjectCode} is now ${subject.isArrear ? 'marked' : 'unmarked'} as current semester`);
    }
  };

  const handleRemoveSubject = (subjectCode: string) => {
    const updatedCredits = subjectCredits.filter(credit => credit.subjectCode !== subjectCode);
    setSubjectCredits(updatedCredits);
    validateInputs(updatedCredits);
    
    toast({
      title: "Subject removed",
      description: `Subject ${subjectCode} has been removed from the list.`
    });
    console.log(`Subject ${subjectCode} removed from the list`);
  };

  const validateInputs = (credits: SubjectCredit[]) => {
    // Check if all credits are assigned with valid values
    const allValid = credits.length > 0 && credits.every(credit => 
      credit.creditValue >= 1 && credit.creditValue <= 10
    );

    // Log validation status
    console.log(`Input validation: ${allValid ? 'VALID' : 'INVALID'}`);
    
    // Log which subjects are marked as current semester
    const currentSemesterSubjects = credits.filter(credit => credit.isArrear);
    if (currentSemesterSubjects.length > 0) {
      console.log(`${currentSemesterSubjects.length} subjects marked as current semester: ${currentSemesterSubjects.map(s => s.subjectCode).join(', ')}`);
    }
    
    setIsValid(allValid);
    return allValid;
  };

  const handleSubmit = () => {
    if (!validateInputs(subjectCredits)) {
      toast({
        variant: "destructive",
        title: "Invalid credit values",
        description: "Please ensure all subjects have valid credit values (1-10)."
      });
      return;
    }
    
    // Create a deep copy of the credits to ensure we're passing a fresh object
    const creditsToSubmit = JSON.parse(JSON.stringify(subjectCredits));
    
    // Log the data being submitted
    console.log("Submitting subject credits:", creditsToSubmit);
    console.log("Subject names included:", creditsToSubmit.map((c: SubjectCredit) => c.subjectName).join(', '));
    console.log("Faculty names included:", creditsToSubmit.map((c: SubjectCredit) => c.facultyName).join(', '));
    
    onCreditAssigned(creditsToSubmit);
    
    toast({
      title: "Credit values assigned",
      description: "Subject credits have been successfully assigned."
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
                <TableHead className="w-[150px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {subjectCredits.map(subject => (
                <TableRow key={subject.subjectCode} className={subject.isArrear ? "bg-blue-50 dark:bg-blue-900/20" : ""}>
                  <TableCell className="font-medium">
                    {subject.subjectCode}
                    {subject.isArrear && <Badge variant="secondary" className="ml-2 bg-green-600">CS</Badge>}
                  </TableCell>
                  <TableCell>
                    <Input 
                      type="number" 
                      min={1} 
                      max={10} 
                      value={subject.creditValue} 
                      onChange={e => handleCreditChange(subject.subjectCode, e.target.value)} 
                      className="w-20 mx-auto text-center" 
                    />
                  </TableCell>
                  <TableCell>
                    <Input 
                      type="text" 
                      placeholder="Enter subject name" 
                      value={subject.subjectName || ''} 
                      onChange={e => handleSubjectNameChange(subject.subjectCode, e.target.value)} 
                      className="w-full mx-auto" 
                    />
                  </TableCell>
                  <TableCell>
                    <Input 
                      type="text" 
                      placeholder="Enter faculty name" 
                      value={subject.facultyName || ''} 
                      onChange={e => handleFacultyNameChange(subject.subjectCode, e.target.value)} 
                      className="w-full mx-auto" 
                    />
                  </TableCell>
                  <TableCell>
                    <div className="flex space-x-1">
                      <Button 
                        variant={subject.isArrear ? "secondary" : "outline"} 
                        size="sm" 
                        onClick={() => handleToggleArrear(subject.subjectCode)} 
                        className={subject.isArrear ? "bg-green-600 hover:bg-green-700 text-white" : "bg-zinc-300 hover:bg-zinc-200 text-green-600"}
                      >
                        <AlertTriangle className="h-3 w-3 mr-1" />
                        {subject.isArrear ? "Current Semester ✓" : "Mark as Current"}
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => handleRemoveSubject(subject.subjectCode)} 
                        className="text-destructive hover:text-destructive/90 hover:bg-destructive/10"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
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
            ) : 'Assign Details & Process Data'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default SubjectCreditInput;
