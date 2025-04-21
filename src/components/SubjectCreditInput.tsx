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
  facultyName?: string; // Added faculty name field
  isArrear?: boolean; // Flag to identify if the subject is marked for current semester
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
  const {
    toast
  } = useToast();
  useEffect(() => {
    // Initialize with default credit value of 3, empty subject name, and empty faculty name
    if (uploadedSubjects.length > 0) {
      const initialCredits = uploadedSubjects.map(subject => ({
        subjectCode: subject,
        creditValue: 3,
        subjectName: '',
        facultyName: '',
        // Initialize with empty faculty name
        isArrear: false // Initialize with not current semester
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
    const updatedCredits = subjectCredits.map(credit => credit.subjectCode === subjectCode ? {
      ...credit,
      creditValue: numValue
    } : credit);
    setSubjectCredits(updatedCredits);
    validateInputs(updatedCredits);
  };
  const handleSubjectNameChange = (subjectCode: string, name: string) => {
    const updatedCredits = subjectCredits.map(credit => credit.subjectCode === subjectCode ? {
      ...credit,
      subjectName: name
    } : credit);
    setSubjectCredits(updatedCredits);
    validateInputs(updatedCredits);
  };
  const handleFacultyNameChange = (subjectCode: string, name: string) => {
    const updatedCredits = subjectCredits.map(credit => credit.subjectCode === subjectCode ? {
      ...credit,
      facultyName: name
    } : credit);
    setSubjectCredits(updatedCredits);
    validateInputs(updatedCredits);
  };
  const handleToggleArrear = (subjectCode: string) => {
    const updatedCredits = subjectCredits.map(credit => credit.subjectCode === subjectCode ? {
      ...credit,
      isArrear: !credit.isArrear
    } : credit);
    setSubjectCredits(updatedCredits);
    validateInputs(updatedCredits);
    const subject = updatedCredits.find(credit => credit.subjectCode === subjectCode);
    if (subject) {
      toast({
        title: subject.isArrear ? "Subject marked as Current Semester" : "Subject unmarked as Current Semester",
        description: `Subject ${subjectCode} has been ${subject.isArrear ? "marked" : "unmarked"} as current semester.`
      });
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
  };
  const validateInputs = (credits: SubjectCredit[]) => {
    // Check if all credits are assigned with valid values
    const allValid = credits.length > 0 && credits.every(credit => credit.creditValue >= 1 && credit.creditValue <= 10);

    // Log which subjects are marked as current semester
    const currentSemesterSubjects = credits.filter(credit => credit.isArrear);
    console.log(`${currentSemesterSubjects.length} subjects marked as current semester: ${currentSemesterSubjects.map(s => s.subjectCode).join(', ')}`);
    setIsValid(allValid);
  };
  const handleSubmit = () => {
    if (!isValid) {
      toast({
        variant: "destructive",
        title: "Invalid credit values",
        description: "Please ensure all subjects have valid credit values (1-10)."
      });
      return;
    }
    onCreditAssigned(subjectCredits);
    toast({
      title: "Credit values assigned",
      description: "Subject credits have been successfully assigned."
    });
  };
  if (uploadedSubjects.length === 0) {
    return <Card className="col-span-1 lg:col-span-2 shadow-md overflow-hidden">
      <CardHeader className="pb-2">
        <CardTitle>Subject Credits</CardTitle>
        <CardDescription>
          Please upload an Excel file first to assign subject credits.
        </CardDescription>
      </CardHeader>
    </Card>;
  }
  return <Card className="col-span-1 lg:col-span-2 shadow-md">
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
            {subjectCredits.map(subject => <TableRow key={subject.subjectCode} className={subject.isArrear ? "bg-blue-50 dark:bg-blue-900/20" : ""}>
              <TableCell className="font-medium">
                {subject.subjectCode}
                {subject.isArrear && <Badge variant="secondary" className="ml-2">Current Semester</Badge>}
              </TableCell>
              <TableCell>
                <Input type="number" min={1} max={10} value={subject.creditValue} onChange={e => handleCreditChange(subject.subjectCode, e.target.value)} className="w-20 mx-auto text-center" />
              </TableCell>
              <TableCell>
                <Input type="text" placeholder="Enter subject name" value={subject.subjectName} onChange={e => handleSubjectNameChange(subject.subjectCode, e.target.value)} className="w-full mx-auto" />
              </TableCell>
              <TableCell>
                <Input type="text" placeholder="Enter faculty name" value={subject.facultyName} onChange={e => handleFacultyNameChange(subject.subjectCode, e.target.value)} className="w-full mx-auto" />
              </TableCell>
              <TableCell>
                <div className="flex space-x-1">
                  <Button variant={subject.isArrear ? "secondary" : "outline"} size="sm" onClick={() => handleToggleArrear(subject.subjectCode)} className="Current Semester bg-zinc-300 hover:bg-zinc-200 text-lime-600">
                    <AlertTriangle className="h-3 w-3 mr-1" />
                    Current Semester
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => handleRemoveSubject(subject.subjectCode)} className="text-destructive hover:text-destructive/90 hover:bg-destructive/10">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>)}
          </TableBody>
        </Table>
      </div>
      <div className="mt-4 flex justify-end">
        <Button onClick={handleSubmit} disabled={!isValid || isProcessing} className="w-full sm:w-auto">
          {isProcessing ? <>
            <Loader className="mr-2 h-4 w-4 animate-spin" />
            Processing...
          </> : 'Assign Details & Process Data'}
        </Button>
      </div>
    </CardContent>
  </Card>;
};
export default SubjectCreditInput;