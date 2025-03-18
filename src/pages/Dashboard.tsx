
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useNavigate } from 'react-router-dom';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { Upload, FileSpreadsheet, Download, LogOut, User, BarChart4, PieChart as PieChartIcon, Loader } from 'lucide-react';
import { 
  parseExcelFile, 
  analyzeResults, 
  downloadCSVReport,
  type StudentRecord,
  type ResultAnalysis
} from '@/utils/excelProcessor';

const Dashboard = () => {
  const [activeTab, setActiveTab] = useState('upload');
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [resultsAvailable, setResultsAvailable] = useState(false);
  const [studentRecords, setStudentRecords] = useState<StudentRecord[]>([]);
  const [resultAnalysis, setResultAnalysis] = useState<ResultAnalysis | null>(null);
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0] || null;
    setFile(selectedFile);
  };

  const handleUpload = async () => {
    if (!file) {
      toast({
        variant: "destructive",
        title: "No file selected",
        description: "Please select an Excel file to upload.",
      });
      return;
    }

    // Check if file is Excel
    if (!file.name.endsWith('.xlsx') && !file.name.endsWith('.xls')) {
      toast({
        variant: "destructive",
        title: "Invalid file",
        description: "Please select a valid Excel file (.xlsx or .xls).",
      });
      return;
    }

    setIsUploading(true);
    
    try {
      // Parse the Excel file
      const records = await parseExcelFile(file);
      setStudentRecords(records);
      
      toast({
        title: "File uploaded successfully!",
        description: `Parsed ${records.length} records from Excel file.`,
      });
      
      setIsUploading(false);
      setIsAnalyzing(true);
      
      // Analyze the data
      const analysis = analyzeResults(records);
      setResultAnalysis(analysis);
      
      setIsAnalyzing(false);
      setResultsAvailable(true);
      setActiveTab('results');
      
      toast({
        title: "Analysis complete!",
        description: "Your results are now available for review.",
      });
      
    } catch (error) {
      console.error("Upload/analysis error:", error);
      toast({
        variant: "destructive",
        title: "Processing failed",
        description: error instanceof Error ? error.message : "There was a problem processing your file. Please try again.",
      });
      setIsUploading(false);
      setIsAnalyzing(false);
    }
  };

  const handleDownloadReport = () => {
    if (!resultAnalysis || !studentRecords.length) {
      toast({
        variant: "destructive",
        title: "No data available",
        description: "Please upload and analyze data before downloading a report.",
      });
      return;
    }
    
    // Download CSV report
    downloadCSVReport(resultAnalysis, studentRecords);
    
    toast({
      title: "Report downloaded",
      description: "Your analysis report has been downloaded as CSV.",
    });
  };

  const handleLogout = () => {
    // In a real application, this would handle logout process
    toast({
      title: "Logging out",
      description: "You have been successfully logged out.",
    });
    
    // Redirect to login page
    setTimeout(() => {
      navigate('/login');
    }, 1000);
  };

  const renderDataContent = () => {
    if (!resultAnalysis) {
      return (
        <div className="flex flex-col items-center justify-center py-12">
          <Loader className="h-12 w-12 text-primary animate-spin mb-4" />
          <p className="text-muted-foreground">No data available. Please upload an Excel file.</p>
        </div>
      );
    }

    return (
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Pass Rate</CardTitle>
              <CardDescription>Overall course completion</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={resultAnalysis.passFailData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                      label={({ name, value }) => `${name}: ${value}%`}
                    >
                      {resultAnalysis.passFailData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Pie>
                    <RechartsTooltip formatter={(value) => `${value}%`} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Grade Distribution</CardTitle>
              <CardDescription>Count of grades across classes</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={resultAnalysis.gradeDistribution}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <RechartsTooltip />
                    <Bar dataKey="count" name="Count">
                      {resultAnalysis.gradeDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Performance Summary</CardTitle>
              <CardDescription>Key metrics at a glance</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Average CGPA</span>
                  <span className="text-lg font-semibold">{resultAnalysis.averageCGPA}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Highest SGPA</span>
                  <span className="text-lg font-semibold">{resultAnalysis.highestSGPA}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Lowest SGPA</span>
                  <span className="text-lg font-semibold">{resultAnalysis.lowestSGPA}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Total Students</span>
                  <span className="text-lg font-semibold">{resultAnalysis.totalStudents}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Subject-wise Performance</CardTitle>
              <CardDescription>Pass/fail rate across different subjects</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={resultAnalysis.subjectPerformance}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="subject" />
                    <YAxis />
                    <RechartsTooltip />
                    <Legend />
                    <Bar dataKey="pass" stackId="a" fill="#22c55e" name="Pass %" />
                    <Bar dataKey="fail" stackId="a" fill="#ef4444" name="Fail %" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <User className="h-5 w-5 mr-2" />
                  Top Performers
                </CardTitle>
                <CardDescription>Students with highest CGPA</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {resultAnalysis.topPerformers.map((student, index) => (
                    <div key={index} className="flex justify-between items-center p-2 rounded-md hover:bg-muted/50">
                      <div>
                        <p className="font-medium">Student</p>
                        <p className="text-xs text-muted-foreground">ID: {student.id}</p>
                      </div>
                      <div className="flex items-center">
                        <span className={`px-2 py-1 rounded-full text-xs mr-2 ${
                          student.grade === "O" ? "bg-primary/10 text-primary" :
                          student.grade === "A+" ? "bg-green-100 text-green-800" :
                          "bg-blue-100 text-blue-800"
                        }`}>
                          {student.grade}
                        </span>
                        <span className="font-semibold">{student.cgpa}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <User className="h-5 w-5 mr-2" />
                  Needs Improvement
                </CardTitle>
                <CardDescription>Students requiring additional support</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {resultAnalysis.needsImprovement.map((student, index) => (
                    <div key={index} className="flex justify-between items-center p-2 rounded-md hover:bg-muted/50">
                      <div>
                        <p className="font-medium">Student</p>
                        <p className="text-xs text-muted-foreground">ID: {student.id}</p>
                      </div>
                      <div>
                        <span className="font-semibold text-destructive">{student.cgpa}</span>
                        <p className="text-xs text-muted-foreground">{student.subjects}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="flex justify-end">
            <Button onClick={handleDownloadReport} className="flex items-center">
              <Download className="h-4 w-4 mr-2" />
              Download Full Report
            </Button>
          </div>
        </div>
      </motion.div>
    );
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <header className="border-b border-border">
        <div className="container-centered py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-medium">ResultAnalyzer</h1>
            <div className="flex items-center space-x-2">
              <Button variant="ghost" size="sm" onClick={handleLogout}>
                <LogOut className="h-4 w-4 mr-2" />
                Log out
              </Button>
              <div className="h-8 w-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center">
                <User className="h-4 w-4" />
              </div>
            </div>
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
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileSpreadsheet className="h-5 w-5" />
                    Upload Excel File
                  </CardTitle>
                  <CardDescription>
                    Upload your Excel file containing student results data for analysis.
                    The file should contain columns: CNo (Department Code), SEM (Semester),
                    REGNO (Registration Number), SCODE (Subject Code), and GR (Grade).
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-col items-center justify-center space-y-4">
                    <div 
                      className="border-2 border-dashed border-input rounded-lg p-8 w-full flex flex-col items-center justify-center cursor-pointer hover:border-primary/50 transition-colors"
                      onClick={() => document.getElementById('file-upload')?.click()}
                    >
                      <input
                        id="file-upload"
                        type="file"
                        accept=".xlsx,.xls"
                        className="hidden"
                        onChange={handleFileChange}
                      />
                      <FileSpreadsheet className="h-10 w-10 text-muted-foreground mb-4" />
                      <p className="text-sm font-medium">Drag and drop your file here or click to browse</p>
                      <p className="text-xs text-muted-foreground mt-1">Supports .xlsx and .xls files</p>
                      
                      {file && (
                        <div className="mt-4 p-2 bg-secondary rounded-md w-full max-w-md">
                          <p className="text-sm font-medium truncate">{file.name}</p>
                          <p className="text-xs text-muted-foreground">{(file.size / 1024).toFixed(2)} KB</p>
                        </div>
                      )}
                    </div>
                    
                    <Button 
                      onClick={handleUpload} 
                      disabled={!file || isUploading || isAnalyzing}
                      className="w-full max-w-md"
                    >
                      {isUploading ? "Uploading..." : isAnalyzing ? "Analyzing..." : "Upload & Analyze"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="results" className="space-y-6">
              {renderDataContent()}
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
