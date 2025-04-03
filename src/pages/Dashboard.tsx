
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Upload, BarChart4, Loader, FileSpreadsheet, Calculator } from 'lucide-react';
import { 
  analyzeResults, 
  type StudentRecord,
  type ResultAnalysis
} from '@/utils/excelProcessor';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import SubjectCreditInput from '@/components/SubjectCreditInput';
import ProfileButton from "@/components/ui/ProfileButton";
import FileUploader from '@/components/dashboard/FileUploader';
import ResultsDisplay from '@/components/dashboard/ResultsDisplay';

interface SubjectCredit {
  subjectCode: string;
  creditValue: number;
  subjectName?: string;
  facultyName?: string;
}

interface ProfileInfo {
  name: string;
  email: string;
  role: string;
  department: string;
  college: string;
}

type CalculationMode = 'sgpa' | 'cgpa';

const Dashboard = () => {
  const [activeTab, setActiveTab] = useState('mode');
  const [calculationMode, setCalculationMode] = useState<CalculationMode | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [resultsAvailable, setResultsAvailable] = useState(false);
  const [studentRecords, setStudentRecords] = useState<StudentRecord[]>([]);
  const [resultAnalysis, setResultAnalysis] = useState<ResultAnalysis | null>(null);
  const [uniqueSubjects, setUniqueSubjects] = useState<string[]>([]);
  const [currentSemesterCredits, setCurrentSemesterCredits] = useState<SubjectCredit[]>([]);
  const [cumulativeSemesterCredits, setCumulativeSemesterCredits] = useState<SubjectCredit[]>([]);
  const [currentSemesterCreditsAssigned, setCurrentSemesterCreditsAssigned] = useState(false);
  const [cumulativeSemesterCreditsAssigned, setCumulativeSemesterCreditsAssigned] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();
  
  const profileInfo: ProfileInfo = {
    name: "Dr. S. Rajasekaran",
    email: "rajasekaran.s@ksrct.ac.in",
    role: "Associate Professor",
    department: "Computer Science and Engineering",
    college: "K. S. Rangasamy College of Technology"
  };

  const handleSelectMode = (mode: CalculationMode) => {
    setCalculationMode(mode);
    setActiveTab('upload');
    toast({
      title: `${mode.toUpperCase()} Calculation Mode Selected`,
      description: mode === 'sgpa' 
        ? "You can upload a single Excel file for SGPA calculation." 
        : "You can upload multiple Excel files (up to 10) for CGPA calculation.",
    });
  };

  const handleRecordsUploaded = (records: StudentRecord[], subjects: string[]) => {
    setStudentRecords(records);
    setUniqueSubjects(subjects);
    setResultsAvailable(false);
    setResultAnalysis(null);
    setCurrentSemesterCredits([]);
    setCumulativeSemesterCredits([]);
    setCurrentSemesterCreditsAssigned(false);
    setCumulativeSemesterCreditsAssigned(false);
    setIsUploading(false);
  };

  const handleCurrentSemesterCreditAssigned = (credits: SubjectCredit[]) => {
    setCurrentSemesterCredits(credits);
    setCurrentSemesterCreditsAssigned(true);
    
    // Only proceed to analysis if both current and cumulative credits are assigned
    if (cumulativeSemesterCreditsAssigned) {
      analyzeData(credits, cumulativeSemesterCredits);
    } else {
      toast({
        title: "Current semester credits assigned",
        description: "Please also assign credits for cumulative data up to this semester",
      });
    }
  };
  
  const handleCumulativeSemesterCreditAssigned = (credits: SubjectCredit[]) => {
    setCumulativeSemesterCredits(credits);
    setCumulativeSemesterCreditsAssigned(true);
    
    // Only proceed to analysis if both current and cumulative credits are assigned
    if (currentSemesterCreditsAssigned) {
      analyzeData(currentSemesterCredits, credits);
    } else {
      toast({
        title: "Cumulative semester credits assigned",
        description: "Please also assign credits for the current semester",
      });
    }
  };

  const analyzeData = async (currentCredits: SubjectCredit[], cumulativeCredits: SubjectCredit[]) => {
    if (!studentRecords.length) {
      toast({
        variant: "destructive",
        title: "No data to analyze",
        description: "Please upload an Excel file first.",
      });
      return;
    }
    
    setIsAnalyzing(true);
    
    try {
      // Process with current semester credits for current semester analysis
      const currentSubjectCodes = currentCredits.map(credit => credit.subjectCode);
      
      const recordsWithCredits = studentRecords.map(record => {
        const creditInfo = currentCredits.find(c => c.subjectCode === record.SCODE);
        
        if (creditInfo) {
          return {
            ...record,
            creditValue: creditInfo.creditValue,
            subjectName: creditInfo.subjectName,
            facultyName: creditInfo.facultyName
          };
        }
        
        return {
          ...record,
          creditValue: 3
        };
      });
      
      const analysis = analyzeResults(recordsWithCredits, currentSubjectCodes);
      
      // Store both credit sets in the analysis for later use in reports
      const analysisWithBothCredits = {
        ...analysis,
        currentSemesterCredits: currentCredits,
        cumulativeSemesterCredits: cumulativeCredits
      };
      
      setResultAnalysis(analysisWithBothCredits);
      
      setIsAnalyzing(false);
      setResultsAvailable(true);
      setActiveTab('results');
      
      toast({
        title: "Analysis complete!",
        description: `Your ${calculationMode?.toUpperCase()} results are now available for review.`
      });
      
    } catch (error) {
      console.error("Analysis error:", error);
      toast({
        variant: "destructive",
        title: "Analysis failed",
        description: error instanceof Error ? error.message : "There was a problem analyzing your data. Please try again.",
      });
      setIsAnalyzing(false);
    }
  };

  const handleLogout = () => {
    toast({
      title: "Logging out",
      description: "You have been successfully logged out.",
    });
    
    setTimeout(() => {
      navigate('/login');
    }, 1000);
  };

  const handleResetCalculation = () => {
    setCalculationMode(null);
    setActiveTab('mode');
    setStudentRecords([]);
    setUniqueSubjects([]);
    setResultsAvailable(false);
    setResultAnalysis(null);
    setCurrentSemesterCredits([]);
    setCumulativeSemesterCredits([]);
    setCurrentSemesterCreditsAssigned(false);
    setCumulativeSemesterCreditsAssigned(false);
  };

  return (
    <div className="min-h-screen login-pattern">
      <header className="bg-white/90 backdrop-blur-sm shadow-sm border-b">
        <div className="container mx-auto px-4 py-3 flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <img 
              src="/lovable-uploads/c8d5fc43-569a-4b7e-9366-09b681f0e06f.png" 
              alt="College Logo" 
              className="h-10"
            />
          </div>
          <div className="flex items-center space-x-2">
            <ProfileButton />
          </div>
        </div>
      </header>

      <main className="flex-grow py-6 px-4 sm:p-6 lg:p-8">
        <div className="container-centered">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-2xl font-semibold mb-1">Class Advisor Dashboard</h2>
                <p className="text-muted-foreground">
                  {calculationMode 
                    ? `${calculationMode.toUpperCase()} Calculation and Analysis` 
                    : "Select calculation mode to begin"}
                </p>
              </div>
              <TabsList>
                {calculationMode && (
                  <>
                    <TabsTrigger value="mode" onClick={handleResetCalculation} className="flex items-center gap-1">
                      <Calculator className="h-4 w-4" />
                      <span className="hidden sm:inline">Select Mode</span>
                    </TabsTrigger>
                    <TabsTrigger value="upload" className="flex items-center gap-1">
                      <Upload className="h-4 w-4" />
                      <span className="hidden sm:inline">Upload</span>
                    </TabsTrigger>
                    <TabsTrigger value="results" disabled={!resultsAvailable} className="flex items-center gap-1">
                      <BarChart4 className="h-4 w-4" />
                      <span className="hidden sm:inline">Results</span>
                    </TabsTrigger>
                  </>
                )}
              </TabsList>
            </div>

            <TabsContent value="mode" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="hover:shadow-lg transition-shadow duration-300">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <FileSpreadsheet className="h-5 w-5" />
                      Calculate SGPA
                    </CardTitle>
                    <CardDescription>
                      Upload a single Excel sheet to calculate Semester Grade Point Average (SGPA)
                      for a specific semester.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button 
                      onClick={() => handleSelectMode('sgpa')}
                      className="w-full"
                    >
                      <Calculator className="h-4 w-4 mr-2" />
                      Select SGPA Mode
                    </Button>
                  </CardContent>
                </Card>

                <Card className="hover:shadow-lg transition-shadow duration-300">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <FileSpreadsheet className="h-5 w-5" />
                      Calculate CGPA
                    </CardTitle>
                    <CardDescription>
                      Upload multiple Excel sheets (up to 10) to calculate Cumulative Grade Point Average (CGPA)
                      across multiple semesters.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button 
                      onClick={() => handleSelectMode('cgpa')}
                      className="w-full"
                    >
                      <Calculator className="h-4 w-4 mr-2" />
                      Select CGPA Mode
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="upload" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <FileUploader 
                  onRecordsUploaded={handleRecordsUploaded}
                  isUploading={isUploading}
                  setIsUploading={setIsUploading}
                  calculationMode={calculationMode}
                />

                <div className="lg:col-span-3 flex flex-col gap-6">
                  <SubjectCreditInput 
                    onCreditAssigned={handleCurrentSemesterCreditAssigned}
                    uploadedSubjects={uniqueSubjects}
                    isProcessing={isAnalyzing}
                    type="current"
                  />
                  
                  <SubjectCreditInput 
                    onCreditAssigned={handleCumulativeSemesterCreditAssigned}
                    uploadedSubjects={uniqueSubjects}
                    isProcessing={isAnalyzing}
                    type="cumulative"
                  />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="results" className="space-y-6">
              <ResultsDisplay 
                analysis={resultAnalysis} 
                studentRecords={studentRecords.filter(record => 
                  currentSemesterCredits.some(credit => credit.subjectCode === record.SCODE) ||
                  cumulativeSemesterCredits.some(credit => credit.subjectCode === record.SCODE)
                )}
                calculationMode={calculationMode} 
              />
            </TabsContent>
          </Tabs>
        </div>
      </main>

      <Dialog open={profileOpen} onOpenChange={setProfileOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Profile Information</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="flex flex-col space-y-1">
              <h3 className="text-sm font-medium text-muted-foreground">Name</h3>
              <p className="text-lg">{profileInfo.name}</p>
            </div>
            <div className="flex flex-col space-y-1">
              <h3 className="text-sm font-medium text-muted-foreground">Email</h3>
              <p className="text-lg">{profileInfo.email}</p>
            </div>
            <div className="flex flex-col space-y-1">
              <h3 className="text-sm font-medium text-muted-foreground">Role</h3>
              <p className="text-lg">{profileInfo.role}</p>
            </div>
            <div className="flex flex-col space-y-1">
              <h3 className="text-sm font-medium text-muted-foreground">Department</h3>
              <p className="text-lg">{profileInfo.department}</p>
            </div>
            <div className="flex flex-col space-y-1">
              <h3 className="text-sm font-medium text-muted-foreground">College</h3>
              <p className="text-lg">{profileInfo.college}</p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Dashboard;
