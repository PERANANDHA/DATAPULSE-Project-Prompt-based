
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Plus, Minus, AlertTriangle } from 'lucide-react';

interface SubjectCredit {
  subjectCode: string;
  creditValue: number;
}

interface SubjectCreditInputProps {
  onCreditAssigned: (credits: SubjectCredit[]) => void;
  uploadedSubjects: string[];
  isProcessing: boolean;
}

const SubjectCreditInput: React.FC<SubjectCreditInputProps> = ({ 
  onCreditAssigned, 
  uploadedSubjects, 
  isProcessing 
}) => {
  const [subjectCredits, setSubjectCredits] = useState<SubjectCredit[]>([]);
  const [errors, setErrors] = useState<{[key: string]: string}>({});
  const { toast } = useToast();

  // Initialize with existing subjects from the uploaded file
  useEffect(() => {
    if (uploadedSubjects.length > 0 && subjectCredits.length === 0) {
      const initialCredits = uploadedSubjects.map(code => ({
        subjectCode: code,
        creditValue: 3 // Default credit value
      }));
      
      setSubjectCredits(initialCredits);
    }
  }, [uploadedSubjects]);

  const handleSubjectCodeChange = (index: number, value: string) => {
    const updatedCredits = [...subjectCredits];
    updatedCredits[index].subjectCode = value;
    setSubjectCredits(updatedCredits);
    
    // Validate if subject code exists in uploaded file
    if (value && !uploadedSubjects.includes(value)) {
      setErrors(prev => ({
        ...prev,
        [`subject-${index}`]: "Subject code not found in uploaded file"
      }));
    } else {
      setErrors(prev => {
        const newErrors = {...prev};
        delete newErrors[`subject-${index}`];
        return newErrors;
      });
    }
  };

  const handleCreditValueChange = (index: number, value: string) => {
    const creditValue = parseFloat(value);
    const updatedCredits = [...subjectCredits];
    updatedCredits[index].creditValue = isNaN(creditValue) ? 0 : creditValue;
    setSubjectCredits(updatedCredits);
    
    // Validate credit value
    if (isNaN(creditValue) || creditValue <= 0) {
      setErrors(prev => ({
        ...prev,
        [`credit-${index}`]: "Credit must be a positive number"
      }));
    } else {
      setErrors(prev => {
        const newErrors = {...prev};
        delete newErrors[`credit-${index}`];
        return newErrors;
      });
    }
  };

  const addSubjectCredit = () => {
    setSubjectCredits([...subjectCredits, { subjectCode: '', creditValue: 3 }]);
  };

  const removeSubjectCredit = (index: number) => {
    const updatedCredits = [...subjectCredits];
    updatedCredits.splice(index, 1);
    setSubjectCredits(updatedCredits);
    
    // Remove any errors for this index
    setErrors(prev => {
      const newErrors = {...prev};
      delete newErrors[`subject-${index}`];
      delete newErrors[`credit-${index}`];
      return newErrors;
    });
  };

  const handleSubmit = () => {
    // Validate all entries
    let newErrors: {[key: string]: string} = {};
    let hasError = false;
    
    subjectCredits.forEach((item, index) => {
      if (!item.subjectCode) {
        newErrors[`subject-${index}`] = "Subject code is required";
        hasError = true;
      } else if (!uploadedSubjects.includes(item.subjectCode)) {
        newErrors[`subject-${index}`] = "Subject code not found in uploaded file";
        hasError = true;
      }
      
      if (item.creditValue <= 0) {
        newErrors[`credit-${index}`] = "Credit must be a positive number";
        hasError = true;
      }
    });
    
    setErrors(newErrors);
    
    if (hasError) {
      toast({
        variant: "destructive",
        title: "Validation Error",
        description: "Please fix the errors in the form before proceeding.",
      });
      return;
    }
    
    // Check for duplicate subject codes
    const uniqueCodes = new Set();
    for (const item of subjectCredits) {
      if (uniqueCodes.has(item.subjectCode)) {
        toast({
          variant: "destructive",
          title: "Duplicate Subject Codes",
          description: "Each subject code should only appear once.",
        });
        return;
      }
      uniqueCodes.add(item.subjectCode);
    }
    
    // Validate that all uploaded subjects have credit values assigned
    const assignedSubjects = new Set(subjectCredits.map(item => item.subjectCode));
    const missingSubjects = uploadedSubjects.filter(code => !assignedSubjects.has(code));
    
    if (missingSubjects.length > 0) {
      toast({
        // Fix: Changed "warning" to "default" as only "default" and "destructive" are allowed
        variant: "default",
        title: "Missing Subject Credits",
        description: `The following subjects don't have credits assigned: ${missingSubjects.join(', ')}`,
      });
      return;
    }
    
    onCreditAssigned(subjectCredits);
    
    toast({
      title: "Credits Assigned Successfully",
      description: "Subject credits have been assigned for SGPA calculation.",
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Assign Credits to Subjects</CardTitle>
        <CardDescription>
          Enter the credit value for each subject in the uploaded file for accurate SGPA calculation
        </CardDescription>
      </CardHeader>
      <CardContent>
        {uploadedSubjects.length === 0 ? (
          <div className="flex items-center justify-center p-4 border border-dashed rounded-md">
            <AlertTriangle className="h-5 w-5 text-amber-500 mr-2" />
            <p className="text-sm text-muted-foreground">
              Upload a file first to see subjects
            </p>
          </div>
        ) : (
          <>
            <div className="space-y-4">
              {subjectCredits.map((item, index) => (
                <div key={index} className="flex items-start gap-2">
                  <div className="flex-1">
                    <Input
                      placeholder="Subject Code"
                      value={item.subjectCode}
                      onChange={(e) => handleSubjectCodeChange(index, e.target.value)}
                      list="subject-list"
                      className={errors[`subject-${index}`] ? "border-red-500" : ""}
                    />
                    {errors[`subject-${index}`] && (
                      <p className="text-xs text-red-500 mt-1">{errors[`subject-${index}`]}</p>
                    )}
                  </div>
                  <div className="flex-1">
                    <Input
                      type="number"
                      placeholder="Credit Value"
                      value={item.creditValue === 0 ? "" : item.creditValue}
                      onChange={(e) => handleCreditValueChange(index, e.target.value)}
                      min="0.5"
                      step="0.5"
                      className={errors[`credit-${index}`] ? "border-red-500" : ""}
                    />
                    {errors[`credit-${index}`] && (
                      <p className="text-xs text-red-500 mt-1">{errors[`credit-${index}`]}</p>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeSubjectCredit(index)}
                    disabled={subjectCredits.length <= 1}
                    className="flex-shrink-0"
                  >
                    <Minus className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              
              <div className="flex justify-between">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={addSubjectCredit}
                  className="flex items-center"
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Add Subject
                </Button>
                
                <Button onClick={handleSubmit} disabled={isProcessing}>
                  Assign Credits
                </Button>
              </div>
            </div>
            
            <datalist id="subject-list">
              {uploadedSubjects.map(code => (
                <option key={code} value={code} />
              ))}
            </datalist>
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default SubjectCreditInput;
