
import React, { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useNavigate } from 'react-router-dom';
import SubjectCreditInput from '@/components/SubjectCreditInput';
import DepartmentCodeInput from '@/components/DepartmentCodeInput';
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
import { 
  Upload, 
  FileSpreadsheet, 
  Download, 
  LogOut, 
  User, 
  BarChart4, 
  PieChart as PieChartIcon, 
  Loader, 
  FileText, 
  FileImage, 
  FileSpreadsheetIcon,
  File,
  Plus,
  Trash2,
  Building
} from 'lucide-react';
import { 
  parseExcelFile,
  parseMultipleExcelFiles,
  analyzeResults, 
  downloadCSVReport,
  downloadExcelReport,
  downloadWordReport,
  downloadPdfReport,
  getUniqueDepartmentCodes,
  type StudentRecord,
  type ResultAnalysis
} from '@/utils/excelProcessor';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell
} from "@/components/ui/table";

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
  const [files, setFiles] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [resultsAvailable, setResultsAvailable] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [studentRecords, setStudentRecords] = useState<StudentRecord[]>([]);
  const [resultAnalysis, setResultAnalysis] = useState<ResultAnalysis | null>(null);
  const [activeSubjectTab, setActiveSubjectTab] = useState<string | null>(null);
  const [uniqueSubjects, setUniqueSubjects] = useState<string[]>([]);
  const [subjectCredits, setSubjectCredits] = useState<SubjectCredit[]>([]);
  const [creditsAssigned, setCreditsAssigned] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [selectedDepartment, setSelectedDepartment] = useState<string>("");
  const [departmentCodes, setDepartmentCodes] = useState<string[]>([]);
  const dashboardRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const navigate = useNavigate();
  
  const profileInfo: ProfileInfo = {
    name: "Dr. S. Rajasekaran",
    email: "rajasekaran.s@ksrct.ac.in",
    role: "Associate Professor",
    department: "Computer Science and Engineering",
    college: "K. S. Rangasamy College of Technology"
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = e.target.files;
    
    if (!selectedFiles || selectedFiles.length === 0) return;
    
    if (files.length + selectedFiles.length > 10) {
      toast({
        variant: "destructive",
        title: "Too many files",
        description: "You can upload a maximum of 10 Excel files at once.",
      });
      return;
    }
    
    const newFiles = Array.from(selectedFiles).filter(file => {
      if (!file.name.endsWith('.xlsx') && !file.name.endsWith('.xls')) {
        toast({
          variant: "destructive",
          title: "Invalid file",
          description: `${file.name} is not a valid Excel file (.xlsx or .xls).`,
        });
        return false;
      }
      return true;
    });
    
    setFiles(prev => [...prev, ...newFiles]);
    
    setResultsAvailable(false);
    setStudentRecords([]);
    setResultAnalysis(null);
    setUniqueSubjects([]);
    setSubjectCredits([]);
    setCreditsAssigned(false);
    setSelectedDepartment("");
  };

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleUpload = async () => {
    if (files.length === 0) {
      toast({
        variant: "destructive",
        title: "No files selected",
        description: "Please select at least one Excel file to upload.",
      });
      return;
    }

    setIsUploading(true);
    
    try {
      let records: StudentRecord[];
      
      if (files.length === 1) {
        records = await parseExcelFile(files[0]);
      } else {
        records = await parseMultipleExcelFiles(files);
      }
      
      setStudentRecords(records);
      
      // Get unique department codes
      const deptCodes = getUniqueDepartmentCodes(records);
      setDepartmentCodes(deptCodes);
      
      // Get unique subjects (filtered by department if selected)
      const filteredRecords = selectedDepartment 
        ? records.filter(record => record.CNo === selectedDepartment)
        : records;
      
      const subjects = [...new Set(filteredRecords.map(record => record.SCODE))];
      setUniqueSubjects(subjects);
      
      toast({
        title: "Files uploaded successfully!",
        description: `Parsed ${records.length} records from ${files.length} Excel file(s).`,
      });
      
      setIsUploading(false);
      
    } catch (error) {
      console.error("Upload error:", error);
      toast({
        variant: "destructive",
        title: "Processing failed",
        description: error instanceof Error ? error.message : "There was a problem processing your files. Please try again.",
      });
      setIsUploading(false);
    }
  };

  const handleDepartmentSelected = (deptCode: string) => {
    setSelectedDepartment(deptCode);
    
    // Update unique subjects based on department selection
    if (studentRecords.length > 0) {
      const filteredRecords = deptCode 
        ? studentRecords.filter(record => record.CNo === deptCode)
        : studentRecords;
      
      const subjects = [...new Set(filteredRecords.map(record => record.SCODE))];
      setUniqueSubjects(subjects);
      
      // Reset credits if they were already assigned
      if (creditsAssigned) {
        setCreditsAssigned(false);
        setSubjectCredits([]);
      }
    }
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
      
      const analysis = analyzeResults(recordsWithCredits, selectedDepartment);
      setResultAnalysis(analysis);
      
      if (analysis.subjectGradeDistribution && Object.keys(analysis.subjectGradeDistribution).length > 0) {
        setActiveSubjectTab(Object.keys(analysis.subjectGradeDistribution)[0]);
      }
      
      setIsAnalyzing(false);
      setResultsAvailable(true);
      setActiveTab('results');
      
      toast({
        title: "Analysis complete!",
        description: selectedDepartment
          ? `Analysis complete for department ${selectedDepartment}.`
          : "Your results are now available for review.",
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

const handleDownloadReport = async (format: 'csv' | 'excel' | 'word' | 'pdf') => {
    if (!resultAnalysis || !studentRecords.length) {
      toast({
        variant: "destructive",
        title: "No data available",
        description: "Please upload and analyze data before downloading a report.",
      });
      return;
    }
    
    setIsDownloading(true);
    
    try {
      // Filter records by department if selected
      const filteredRecords = selectedDepartment
        ? studentRecords.filter(record => record.CNo === selectedDepartment) 
        : studentRecords;
        
      if (format === 'csv') {
        downloadCSVReport(resultAnalysis, filteredRecords);
      } else if (format === 'excel') {
        downloadExcelReport(resultAnalysis, filteredRecords);
      } else if (format === 'word') {
        downloadWordReport(resultAnalysis, filteredRecords);
      } else if (format === 'pdf') {
        // Call with element ID instead of analysis
        await downloadPdfReport('dashboard-content');
      }
      
      toast({
        title: "Report downloaded",
        description: `Your analysis report has been downloaded as ${format.toUpperCase()}.`,
      });
    } catch (error) {
      console.error("Download error:", error);
      toast({
        variant: "destructive",
        title: "Download failed",
        description: "There was a problem generating your report. Please try again.",
      });
    } finally {
      setIsDownloading(false);
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

  const renderDataContent = () => {
    if (!resultAnalysis) {
      return (
        <div className="flex flex-col items-center justify-center py-12">
          <Loader className="h-12 w-12 text-primary animate-spin mb-4" />
          <p className="text-muted-foreground">No data available. Please upload Excel file(s).</p>
        </div>
      );
    }
    
    const uniqueSubjects = Object.keys(resultAnalysis.subjectGradeDistribution);

    return (
      <motion.div 
        id="dashboard-content"
        ref={dashboardRef}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.5 }}
        className="space-y-6"
      >
        {resultAnalysis.departmentCode && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center">
                <Building className="h-5 w-5 mr-2" />
                Department Analysis
              </CardTitle>
              <CardDescription>Analysis for department code: {resultAnalysis.departmentCode}</CardDescription>
            </CardHeader>
            <CardContent>
              <Badge className="bg-primary">{resultAnalysis.departmentCode}</Badge>
            </CardContent>
          </Card>
        )}

        {resultAnalysis.fileCount && resultAnalysis.fileCount > 1 && resultAnalysis.filesProcessed && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Files Processed</CardTitle>
              <CardDescription>Combined analysis from {resultAnalysis.fileCount} files</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {resultAnalysis.filesProcessed.map((fileName, index) => (
                  <Badge key={index} variant="outline" className="px-2 py-1">
                    <FileSpreadsheet className="h-3 w-3 mr-1" />
                    {fileName}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
        
        {resultAnalysis.departmentComparison && departmentCodes.length > 1 && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center">
                <Building className="h-5 w-5 mr-2" />
                Department Comparison
              </CardTitle>
              <CardDescription>Performance metrics across different departments</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Department</TableHead>
                      <TableHead>Total Students</TableHead>
                      <TableHead>Average SGPA</TableHead>
                      <TableHead>Pass Rate (%)</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {Object.entries(resultAnalysis.departmentComparison).map(([deptCode, data]) => (
                      <TableRow key={deptCode} className={deptCode === resultAnalysis.departmentCode ? "bg-muted/50" : ""}>
                        <TableCell className="font-medium">
                          {deptCode}
                          {deptCode === resultAnalysis.departmentCode && (
                            <Badge className="ml-2 bg-primary">Selected</Badge>
                          )}
                        </TableCell>
                        <TableCell>{data.totalStudents}</TableCell>
                        <TableCell>{data.averageSGPA.toFixed(2)}</TableCell>
                        <TableCell>{data.passRate.toFixed(2)}%</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        )}

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
                      label={({ name, value }) => `${name}: ${value.toFixed(2)}%`}
                    >
                      {resultAnalysis.passFailData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Pie>
                    <RechartsTooltip formatter={(value: number) => `${value.toFixed(2)}%`} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Grade Distribution</CardTitle>
              <CardDescription>Count of grades across all subjects</CardDescription>
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
                  <span className="text-lg font-semibold">{resultAnalysis.averageCGPA.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Highest SGPA</span>
                  <span className="text-lg font-semibold">{resultAnalysis.highestSGPA.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Lowest SGPA</span>
                  <span className="text-lg font-semibold">{resultAnalysis.lowestSGPA.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Total Students</span>
                  <span className="text-lg font-semibold">{resultAnalysis.totalStudents}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Subject-wise Grade Distribution</CardTitle>
            <CardDescription>Grade breakdown for each subject</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs 
              value={activeSubjectTab || uniqueSubjects[0]} 
              onValueChange={setActiveSubjectTab}
              className="space-y-4"
            >
              <TabsList className="flex flex-wrap mb-4">
                {uniqueSubjects.map(subject => (
                  <TabsTrigger key={subject} value={subject}>
                    {subject}
                  </TabsTrigger>
                ))}
              </TabsList>
              
              {uniqueSubjects.map(subject => (
                <TabsContent key={subject} value={subject}>
                  <div className="h-[250px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={resultAnalysis.subjectGradeDistribution[subject]}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <RechartsTooltip />
                        <Bar dataKey="count" name="Count">
                          {resultAnalysis.subjectGradeDistribution[subject].map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.fill} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </TabsContent>
              ))}
            </Tabs>
          </CardContent>
        </Card>

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
                  <RechartsTooltip formatter={(value: number) => `${value.toFixed(2)}%`} />
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
              <CardDescription>Students with highest SGPA (Top 6)</CardDescription>
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
                      <span className="font-semibold">{student.sgpa.toFixed(2)}</span>
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
              <CardDescription>Students with SGPA below 6.5 or with arrears</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {resultAnalysis.needsImprovement.length > 0 ? (
                  resultAnalysis.needsImprovement.map((student, index) => (
                    <div key={index} className="flex justify-between items-center p-2 rounded-md hover:bg-muted/50">
                      <div>
                        <p className="font-medium">Student</p>
                        <p className="text-xs text-muted-foreground">ID: {student.id}</p>
                      </div>
                      <div className="text-right">
                        <span className="font-semibold text-destructive">{student.sgpa.toFixed(2)}</span>
                        <p className="text-xs text-muted-foreground">{student.subjects}</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-muted-foreground text-center">No students with SGPA below 6.5 or with arrears</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle>Student-wise SGPA Analysis</CardTitle>
            <CardDescription>SGPA calculation for each student</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[600px] border-collapse">
                <thead>
                  <tr className="border-b">
                    <th className="py-2 px-4 text-left">Registration Number</th>
                    <th className="py-2 px-4 text-left">SGPA</th>
                    <th className="py-2 px-4 text-left">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {resultAnalysis.studentSgpaDetails?.map((student, index) => (
                    <tr 
                      key={index} 
                      className={`border-b ${
                        student.hasArrears ? "bg-red-50" : 
                        Number(student.sgpa) < 6.5 ? "bg-amber-50" : 
                        "hover:bg-gray-50"
                      }`}
                    >
                      <td className="py-2 px-4">{student.id}</td>
                      <td className="py-2 px-4 font-medium">{student.sgpa.toFixed(2)}</td>
                      <td className="py-2 px-4">
                        {student.hasArrears ? (
                          <span className="text-red-500 text-sm">Has Arrears</span>
                        ) : Number(student.sgpa) < 6.5 ? (
                          <span className="text-amber-500 text-sm">SGPA below 6.5</span>
                        ) : (
                          <span className="text-green-500 text-sm">Good Standing</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button disabled={isDownloading}>
                {isDownloading ? (
                  <>
                    <Loader className="h-4 w-4 mr-2 animate-spin" />
                    Downloading...
                  </>
                ) : (
                  <>
                    <Download className="h-4 w-4 mr-2" />
                    Download Report
                  </>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => handleDownloadReport('pdf')}>
                <File className="h-4 w-4 mr-2" />
                <span>Download as PDF</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleDownloadReport('word')}>
                <FileText className="h-4 w-4 mr-2" />
                <span>Download as Word</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleDownloadReport('excel')}>
                <FileSpreadsheetIcon className="h-4 w-4 mr-2" />
                <span>Download as Excel</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleDownloadReport('csv')}>
                <Download className="h-4 w-4 mr-2" />
                <span>Download as CSV</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
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
              <div 
                className="h-8 w-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center cursor-pointer"
                onClick={() => setProfileOpen(true)}
              >
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
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Card className="lg:col-span-1">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <FileSpreadsheet className="h-5 w-5" />
                      Upload Excel Files
                    </CardTitle>
                    <CardDescription>
                      Upload up to 10 Excel files containing student results data for analysis.
                      Each file should contain columns: CNo (Department Code), SEM (Semester),
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
                          multiple
                        />
                        <FileSpreadsheet className="h-10 w-10 text-muted-foreground mb-4" />
                        <p className="text-sm font-medium">Drag and drop your files here or click to browse</p>
                        <p className="text-xs text-muted-foreground mt-1">Supports multiple .xlsx and .xls files (max 10)</p>
                        
                        {files.length > 0 && (
                          <div className="mt-4 p-2 bg-secondary rounded-md w-full max-w-md">
                            <div className="flex justify-between items-center mb-2">
                              <p className="text-sm font-medium">{files.length} file(s) selected</p>
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setFiles([]);
                                }}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                            <div className="max-h-40 overflow-y-auto">
                              {files.map((file, index) => (
                                <div key={index} className="flex justify-between items-center py-1">
                                  <div className="flex items-center">
                                    <FileSpreadsheet className="h-4 w-4 mr-2 text-muted-foreground" />
                                    <span className="text-xs truncate max-w-[150px]">{file.name}</span>
                                  </div>
                                  <div className="flex items-center">
                                    <span className="text-xs text-muted-foreground mr-2">
                                      {(file.size / 1024).toFixed(2)} KB
                                    </span>
                                    <Button 
                                      variant="ghost" 
                                      size="icon" 
                                      className="h-6 w-6" 
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        removeFile(index);
                                      }}
                                    >
                                      <Trash2 className="h-3 w-3" />
                                    </Button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                      
                      <Button 
                        onClick={handleUpload} 
                        disabled={files.length === 0 || isUploading || isAnalyzing}
                        className="w-full max-w-md"
                      >
                        {isUploading ? (
                          <>
                            <Loader className="h-4 w-4 mr-2 animate-spin" />
                            Uploading...
                          </>
                        ) : (
                          <>
                            <Upload className="h-4 w-4 mr-2" />
                            Upload {files.length > 1 ? 'Files' : 'File'}
                          </>
                        )}
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                <DepartmentCodeInput 
                  studentRecords={studentRecords}
                  selectedDepartment={selectedDepartment}
                  setSelectedDepartment={setSelectedDepartment}
                  onDepartmentSelected={handleDepartmentSelected}
                  isProcessing={isAnalyzing || isUploading}
                />

                <SubjectCreditInput 
                  onCreditAssigned={handleCreditAssigned}
                  uploadedSubjects={uniqueSubjects}
                  isProcessing={isAnalyzing}
                />
              </div>
            </TabsContent>

            <TabsContent value="results" className="space-y-6">
              {renderDataContent()}
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
