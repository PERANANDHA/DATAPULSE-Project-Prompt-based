
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Upload, BarChart4, Loader } from 'lucide-react';
import { 
  analyzeResults, 
  type StudentRecord,
  type ResultAnalysis
} from '@/utils/excelProcessor';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import SubjectCreditInput from '@/components/SubjectCreditInput';
import ProfileButton from "@/components/ui/ProfileButton";
import FileUploader from '@/components/dashboard/FileUploader';
import ResultsDisplay from '@/components/dashboard/ResultsDisplay';

interface SubjectCredit {
  subjectCode: string;
  creditValue: number;
}

interface ProfileInfo {
  name: string;
  email: string;
  role: string;
  department: string;
  college: string;
}

const Dashboard = () => {
  const [activeTab, setActiveTab] = useState('upload');
  const [isUploading, setIsUploading] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [resultsAvailable, setResultsAvailable] = useState(false);
  const [studentRecords, setStudentRecords] = useState<StudentRecord[]>([]);
  const [resultAnalysis, setResultAnalysis] = useState<ResultAnalysis | null>(null);
  const [uniqueSubjects, setUniqueSubjects] = useState<string[]>([]);
  const [subjectCredits, setSubjectCredits] = useState<SubjectCredit[]>([]);
  const [creditsAssigned, setCreditsAssigned] = useState(false);
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

  const handleRecordsUploaded = (records: StudentRecord[], subjects: string[]) => {
    setStudentRecords(records);
    setUniqueSubjects(subjects);
    setResultsAvailable(false);
    setResultAnalysis(null);
    setSubjectCredits([]);
    setCreditsAssigned(false);
    setIsUploading(false);
  };

  const handleCreditAssigned = (credits: SubjectCredit[]) => {
    setSubjectCredits(credits);
    setCreditsAssigned(true);
    
    analyzeData(credits);
  };

  const analyzeData = async (credits: SubjectCredit[]) => {
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
      const recordsWithCredits = studentRecords.map(record => {
        const creditInfo = credits.find(c => c.subjectCode === record.SCODE);
        return {
          ...record,
          creditValue: creditInfo ? creditInfo.creditValue : 3
        };
      });
      
      // Analyze all records without department filtering
      const analysis = analyzeResults(recordsWithCredits);
      setResultAnalysis(analysis);
      
      setIsAnalyzing(false);
      setResultsAvailable(true);
      setActiveTab('results');
      
      toast({
        title: "Analysis complete!",
        description: "Your results are now available for review."
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
                <p className="text-muted-foreground">Upload and analyze student results</p>
              </div>
              <TabsList>
                <TabsTrigger value="upload" className="flex items-center gap-1">
                  <Upload className="h-4 w-4" />
                  <span className="hidden sm:inline">Upload</span>
                </TabsTrigger>
                <TabsTrigger value="results" disabled={!resultsAvailable} className="flex items-center gap-1">
                  <BarChart4 className="h-4 w-4" />
                  <span className="hidden sm:inline">Results</span>
                </TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="upload" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <FileUploader 
                  onRecordsUploaded={handleRecordsUploaded}
                  isUploading={isUploading}
                  setIsUploading={setIsUploading}
                />

                <SubjectCreditInput 
                  onCreditAssigned={handleCreditAssigned}
                  uploadedSubjects={uniqueSubjects}
                  isProcessing={isAnalyzing}
                />
              </div>
            </TabsContent>

            <TabsContent value="results" className="space-y-6">
              <ResultsDisplay 
                analysis={resultAnalysis} 
                studentRecords={studentRecords} 
              />
            </TabsContent>
          </Tabs>
        </div>
      </main>

      <Dialog open={profileOpen} onOpenChange={setProfileOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Profile Information</DialogTitle>
            <DialogDescription>
              Your account details and information
            </DialogDescription>
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
