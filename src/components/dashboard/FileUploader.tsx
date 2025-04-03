
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Meter, FileText, Check } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import SubjectCreditInput from "@/components/SubjectCreditInput";
import { processExcelFile, processForWordReport } from "@/utils/excelProcessor";
import { StudentData, SubjectCredit } from "@/utils/excel/types";

const FileUploader = ({ onResultsProcessed }: { onResultsProcessed: (data: StudentData[], processedWordData: any) => void }) => {
  const [file, setFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [subjects, setSubjects] = useState<string[]>([]);
  const [currentSemesterCredits, setCurrentSemesterCredits] = useState<SubjectCredit[]>([]);
  const [cumulativeCredits, setCumulativeCredits] = useState<SubjectCredit[]>([]);
  const [currentSemesterProcessed, setCurrentSemesterProcessed] = useState(false);
  const [cumulativeProcessed, setCumulativeProcessed] = useState(false);
  const [progressPercentage, setProgressPercentage] = useState(0);
  
  const { toast } = useToast();

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;
    
    setIsLoading(true);
    try {
      setFile(selectedFile);
      const extractedSubjects = await processExcelFile(selectedFile, [], true);
      setSubjects(extractedSubjects);
      setCurrentSemesterCredits(extractedSubjects.map(subject => ({ subject, credits: 3 })));
      setCumulativeCredits(extractedSubjects.map(subject => ({ subject, credits: 3 })));
      setCurrentSemesterProcessed(false);
      setCumulativeProcessed(false);
      setProgressPercentage(0);
      toast({
        title: "File uploaded successfully",
        description: `Found ${extractedSubjects.length} subjects in the file.`,
      });
    } catch (error) {
      console.error("Error processing file:", error);
      toast({
        title: "Error processing file",
        description: "Please check file format and try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCurrentSemesterProcess = async () => {
    if (!file || currentSemesterCredits.length === 0) return;
    
    setIsLoading(true);
    try {
      setCurrentSemesterProcessed(true);
      setProgressPercentage(50);
      toast({
        title: "Current semester subjects processed",
        description: "Now please assign credits for cumulative analysis",
      });
    } catch (error) {
      console.error("Error processing data:", error);
      toast({
        title: "Error processing data",
        description: "Something went wrong. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCumulativeProcess = async () => {
    if (!file || cumulativeCredits.length === 0) return;
    
    setIsLoading(true);
    try {
      // Process the results with both current semester and cumulative credits
      const results = await processExcelFile(file, currentSemesterCredits);
      const wordReportData = processForWordReport(results, currentSemesterCredits, cumulativeCredits);
      
      setCumulativeProcessed(true);
      setProgressPercentage(100);
      onResultsProcessed(results, wordReportData);
      
      toast({
        title: "Analysis complete",
        description: "Results are ready to view.",
      });
    } catch (error) {
      console.error("Error processing data:", error);
      toast({
        title: "Error processing data",
        description: "Something went wrong. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Upload Result File</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4">
            <input
              type="file"
              onChange={handleFileUpload}
              accept=".xlsx,.xls"
              className="hidden"
              id="file-upload"
            />
            <label htmlFor="file-upload">
              <Button 
                variant="outline" 
                className="w-full flex items-center justify-center gap-2" 
                disabled={isLoading}
                asChild
              >
                <span>
                  <FileText size={16} />
                  {file ? file.name : "Choose Excel File"}
                </span>
              </Button>
            </label>
          </div>
        </CardContent>
      </Card>

      {subjects.length > 0 && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Assign Subject Details for CURRENT SEMESTER</CardTitle>
            </CardHeader>
            <CardContent>
              <SubjectCreditInput 
                subjects={subjects} 
                credits={currentSemesterCredits} 
                setCredits={setCurrentSemesterCredits} 
              />
              <div className="mt-6">
                <Button 
                  onClick={handleCurrentSemesterProcess}
                  disabled={isLoading || currentSemesterProcessed}
                  className="w-full flex items-center justify-center gap-2"
                >
                  {currentSemesterProcessed ? <Check size={16} /> : null}
                  Assign Details & Process Data
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className={currentSemesterProcessed ? "" : "opacity-50 pointer-events-none"}>
            <CardHeader>
              <CardTitle>Assign Subject Details FOR UPTO THIS SEMESTER</CardTitle>
            </CardHeader>
            <CardContent>
              <SubjectCreditInput 
                subjects={subjects} 
                credits={cumulativeCredits} 
                setCredits={setCumulativeCredits} 
              />
              <div className="mt-6">
                <Button 
                  onClick={handleCumulativeProcess}
                  disabled={isLoading || !currentSemesterProcessed || cumulativeProcessed}
                  className="w-full flex items-center justify-center gap-2"
                >
                  {cumulativeProcessed ? <Check size={16} /> : null}
                  Assign Details & Process Data
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Meter size={18} />
                Processing Progress
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Progress value={progressPercentage} className="h-2 mb-2" />
              <div className="text-sm text-center">
                {progressPercentage === 0 && "Waiting for subject details..."}
                {progressPercentage === 50 && "Current semester processed. Waiting for cumulative data..."}
                {progressPercentage === 100 && "Analysis complete! View results below."}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default FileUploader;
