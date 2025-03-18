
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
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { Upload, FileSpreadsheet, Download, LogOut, User, BarChart4, PieChart as PieChartIcon } from 'lucide-react';

const Dashboard = () => {
  const [activeTab, setActiveTab] = useState('upload');
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [resultsAvailable, setResultsAvailable] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  // Placeholder data for demo purposes
  const gradeData = [
    { name: 'A+', count: 12, fill: '#0ea5e9' },
    { name: 'A', count: 18, fill: '#22c55e' },
    { name: 'B+', count: 22, fill: '#84cc16' },
    { name: 'B', count: 15, fill: '#eab308' },
    { name: 'C', count: 8, fill: '#f97316' },
    { name: 'F', count: 5, fill: '#ef4444' },
  ];

  const passFailData = [
    { name: 'Pass', value: 75, fill: '#22c55e' },
    { name: 'Fail', value: 25, fill: '#ef4444' },
  ];

  const subjectPerformanceData = [
    { subject: 'Mathematics', pass: 85, fail: 15 },
    { subject: 'Physics', pass: 78, fail: 22 },
    { subject: 'Chemistry', pass: 80, fail: 20 },
    { subject: 'Computer Science', pass: 92, fail: 8 },
    { subject: 'English', pass: 88, fail: 12 },
  ];

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
      // Simulate API call for file upload
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      toast({
        title: "File uploaded successfully!",
        description: "Your Excel file has been uploaded.",
      });
      
      setIsUploading(false);
      setIsAnalyzing(true);
      
      // Simulate analysis process
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      setIsAnalyzing(false);
      setResultsAvailable(true);
      setActiveTab('results');
      
      toast({
        title: "Analysis complete!",
        description: "Your results are now available for review.",
      });
      
    } catch (error) {
      console.error("Upload error:", error);
      toast({
        variant: "destructive",
        title: "Upload failed",
        description: "There was a problem uploading your file. Please try again.",
      });
      setIsUploading(false);
    }
  };

  const handleDownloadReport = () => {
    // In a real application, this would generate and download a PDF or Excel report
    toast({
      title: "Report downloading",
      description: "Your report will be downloaded shortly.",
    });
    
    // Simulate download process
    setTimeout(() => {
      toast({
        title: "Download complete",
        description: "Report has been downloaded successfully.",
      });
    }, 1500);
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
                    Upload your Excel file containing student results data for analysis
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
                              data={passFailData}
                              cx="50%"
                              cy="50%"
                              innerRadius={60}
                              outerRadius={80}
                              paddingAngle={5}
                              dataKey="value"
                            >
                              {passFailData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.fill} />
                              ))}
                            </Pie>
                            <Tooltip />
                            <Legend />
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
                          <BarChart data={gradeData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="name" />
                            <YAxis />
                            <Tooltip />
                            <Bar dataKey="count" fill="#0ea5e9" />
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
                          <span className="text-lg font-semibold">7.85</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-medium">Highest SGPA</span>
                          <span className="text-lg font-semibold">9.8</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-medium">Lowest SGPA</span>
                          <span className="text-lg font-semibold">4.2</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-medium">Total Students</span>
                          <span className="text-lg font-semibold">80</span>
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
                          <BarChart data={subjectPerformanceData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="subject" />
                            <YAxis />
                            <Tooltip />
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
                          {[
                            { id: "ST001", name: "Aditya Sharma", cgpa: "9.8", grade: "A+" },
                            { id: "ST015", name: "Priya Patel", cgpa: "9.6", grade: "A+" },
                            { id: "ST023", name: "Rahul Verma", cgpa: "9.4", grade: "A" },
                            { id: "ST042", name: "Ananya Singh", cgpa: "9.2", grade: "A" },
                            { id: "ST078", name: "Vikram Joshi", cgpa: "9.0", grade: "A" }
                          ].map((student, index) => (
                            <div key={index} className="flex justify-between items-center p-2 rounded-md hover:bg-muted/50">
                              <div>
                                <p className="font-medium">{student.name}</p>
                                <p className="text-xs text-muted-foreground">ID: {student.id}</p>
                              </div>
                              <div className="flex items-center">
                                <span className={`px-2 py-1 rounded-full text-xs mr-2 ${
                                  student.grade === "A+" ? "bg-primary/10 text-primary" :
                                  "bg-green-100 text-green-800"
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
                          {[
                            { id: "ST031", name: "Rajesh Kumar", cgpa: "4.2", subjects: "Mathematics, Physics" },
                            { id: "ST052", name: "Neha Gupta", cgpa: "4.8", subjects: "Chemistry, English" },
                            { id: "ST063", name: "Suresh Mehta", cgpa: "5.1", subjects: "Physics" },
                            { id: "ST025", name: "Meera Shah", cgpa: "5.3", subjects: "Mathematics" },
                            { id: "ST047", name: "Vivek Tiwari", cgpa: "5.5", subjects: "Computer Science" }
                          ].map((student, index) => (
                            <div key={index} className="flex justify-between items-center p-2 rounded-md hover:bg-muted/50">
                              <div>
                                <p className="font-medium">{student.name}</p>
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
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
