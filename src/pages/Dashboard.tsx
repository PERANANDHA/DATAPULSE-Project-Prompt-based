
import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import FileUploader from "@/components/dashboard/FileUploader";
import ResultsDisplay from "@/components/dashboard/ResultsDisplay";
import ReportDownloader from "@/components/dashboard/ReportDownloader";
import AnalysisOverview from "@/components/dashboard/AnalysisOverview";
import SubjectAnalysis from "@/components/dashboard/SubjectAnalysis";
import StudentPerformance from "@/components/dashboard/StudentPerformance";
import StudentSGPATable from "@/components/dashboard/StudentSGPATable";
import { StudentData } from "@/utils/excel/types";

const Dashboard = () => {
  const [results, setResults] = useState<StudentData[]>([]);
  const [wordReportData, setWordReportData] = useState<any>(null);
  const [analysisComplete, setAnalysisComplete] = useState(false);
  
  const handleResultsProcessed = (data: StudentData[], wordData: any) => {
    setResults(data);
    setWordReportData(wordData);
    setAnalysisComplete(true);
  };

  return (
    <div className="container mx-auto py-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-1 space-y-6">
          <FileUploader onResultsProcessed={handleResultsProcessed} />
          
          {analysisComplete && (
            <Card className="bg-white shadow-md">
              <CardHeader>
                <CardTitle>Download Reports</CardTitle>
              </CardHeader>
              <CardContent>
                <ReportDownloader results={results} wordReportData={wordReportData} />
              </CardContent>
            </Card>
          )}
        </div>

        <div className="md:col-span-2">
          {analysisComplete ? (
            <Tabs defaultValue="overview" className="w-full">
              <TabsList className="grid grid-cols-4 mb-4">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="subjects">Subjects</TabsTrigger>
                <TabsTrigger value="students">Students</TabsTrigger>
                <TabsTrigger value="sgpa">SGPA Table</TabsTrigger>
              </TabsList>
              
              <TabsContent value="overview" className="mt-0">
                <AnalysisOverview results={results} />
              </TabsContent>
              
              <TabsContent value="subjects" className="mt-0">
                <SubjectAnalysis results={results} />
              </TabsContent>
              
              <TabsContent value="students" className="mt-0">
                <StudentPerformance results={results} />
              </TabsContent>
              
              <TabsContent value="sgpa" className="mt-0">
                <StudentSGPATable results={results} />
              </TabsContent>
            </Tabs>
          ) : (
            <Card className="h-[500px] flex items-center justify-center bg-muted/50">
              <CardContent className="text-center">
                <p className="text-lg text-muted-foreground">
                  Please upload an Excel file and complete both steps to view analysis
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
