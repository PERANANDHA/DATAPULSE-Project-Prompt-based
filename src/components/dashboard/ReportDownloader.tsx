
import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { Download, Loader, File, FileText, FileSpreadsheetIcon } from 'lucide-react';
import { ResultAnalysis, StudentRecord, downloadCSVReport, downloadExcelReport, downloadWordReport, downloadPdfReport } from '@/utils/excelProcessor';
import { useToast } from '@/hooks/use-toast';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';

interface ReportDownloaderProps {
  analysis: ResultAnalysis | null;
  studentRecords: StudentRecord[];
  calculationMode: 'sgpa' | 'cgpa' | null;
}

const ReportDownloader: React.FC<ReportDownloaderProps> = ({ analysis, studentRecords, calculationMode }) => {
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadingFormat, setDownloadingFormat] = useState<string | null>(null);
  const [departmentCode, setDepartmentCode] = useState('CSE');
  const [departmentFullName, setDepartmentFullName] = useState('Computer Science and Engineering');
  const [isDepartmentDialogOpen, setIsDepartmentDialogOpen] = useState(false);
  const [selectedFormat, setSelectedFormat] = useState<'csv' | 'excel' | 'word' | 'pdf' | null>(null);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const dropdownRef = useRef<HTMLButtonElement>(null);
  const { toast } = useToast();
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Clear any lingering progress intervals when component unmounts
  React.useEffect(() => {
    return () => {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
    };
  }, []);

  const handleDownloadReport = async (format: 'csv' | 'excel' | 'word' | 'pdf') => {
    if (!analysis || !studentRecords.length) {
      toast({
        variant: "destructive",
        title: "No data available",
        description: "Please upload and analyze data before downloading a report.",
      });
      return;
    }
    
    // Prevent multiple simultaneous downloads
    if (isDownloading) {
      return;
    }
    
    if (format === 'word') {
      setSelectedFormat('word');
      setIsDepartmentDialogOpen(true);
      return;
    }
    
    setIsDownloading(true);
    setDownloadingFormat(format);
    setDownloadProgress(0);
    setSelectedFormat(format);
    
    const progressInterval = startProgressSimulation();
    progressIntervalRef.current = progressInterval;
    
    try {
      if (format === 'csv') {
        await downloadCSVReport(analysis, studentRecords);
        finishDownload(progressInterval, format);
      } else if (format === 'excel') {
        await downloadExcelReport(analysis, studentRecords);
        finishDownload(progressInterval, format);
      } else if (format === 'pdf') {
        await downloadPdfReport('dashboard-content');
        finishDownload(progressInterval, format);
      }
    } catch (error) {
      console.error("Download error:", error);
      handleDownloadError(progressInterval, error);
    }
  };

  const startProgressSimulation = () => {
    return setInterval(() => {
      setDownloadProgress(prev => {
        if (prev >= 90) {
          return 90;
        }
        return prev + Math.random() * 10;
      });
    }, 150);
  };

  const finishDownload = (progressInterval: NodeJS.Timeout, format: string) => {
    clearInterval(progressInterval);
    progressIntervalRef.current = null;
    setDownloadProgress(100);
    
    setTimeout(() => {
      toast({
        title: "Report downloaded",
        description: `Your analysis report has been downloaded as ${format.toUpperCase()}.`,
      });
      setIsDownloading(false);
      setDownloadingFormat(null);
      setDownloadProgress(0);
      setSelectedFormat(null);
    }, 500);
  };

  const handleDownloadError = (progressInterval: NodeJS.Timeout, error: any) => {
    clearInterval(progressInterval);
    progressIntervalRef.current = null;
    console.error("Download error:", error);
    toast({
      variant: "destructive",
      title: "Download failed",
      description: "There was a problem generating your report. Please try again.",
    });
    setIsDownloading(false);
    setDownloadingFormat(null);
    setDownloadProgress(0);
    setSelectedFormat(null);
  };

  const handleConfirmDepartment = async () => {
    setIsDepartmentDialogOpen(false);
    setIsDownloading(true);
    setDownloadingFormat('word');
    setDownloadProgress(0);
    
    const progressInterval = startProgressSimulation();
    progressIntervalRef.current = progressInterval;
    
    try {
      if (selectedFormat === 'word' && analysis) {
        // Get a fresh reference to the logo image
        const headerImagePath = "/lovable-uploads/e199a42b-b04e-4918-8bb4-48f3583e7928.png";
        
        await downloadWordReport(analysis, studentRecords, {
          logoImagePath: headerImagePath,
          department: departmentCode,
          departmentFullName: departmentFullName,
          calculationMode: calculationMode || 'sgpa'
        });
        
        finishDownload(progressInterval, 'word');
      }
    } catch (error) {
      console.error("Word download error:", error);
      handleDownloadError(progressInterval, error);
    }
  };

  // Disable the download button completely when downloading
  const isButtonDisabled = isDownloading;
  
  // Show format-specific loading text
  const getDownloadingText = () => {
    if (!downloadingFormat) return "Downloading...";
    return `Downloading ${downloadingFormat.toUpperCase()}...`;
  };

  return (
    <>
      <div className="flex flex-col gap-2">
        {isDownloading && (
          <div className="w-full mb-2">
            <div className="flex justify-between text-sm mb-1">
              <span>Generating report</span>
              <span>{Math.round(downloadProgress)}%</span>
            </div>
            <Progress value={downloadProgress} className="h-2" />
          </div>
        )}
        <div className="flex justify-end">
          <DropdownMenu>
            <DropdownMenuTrigger asChild disabled={isButtonDisabled} ref={dropdownRef}>
              <Button disabled={isButtonDisabled}>
                {isDownloading ? (
                  <>
                    <Loader className="h-4 w-4 mr-2 animate-spin" />
                    {getDownloadingText()}
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
              <DropdownMenuItem 
                onClick={() => handleDownloadReport('pdf')}
                disabled={isDownloading}
              >
                <File className="h-4 w-4 mr-2" />
                <span>Download as PDF</span>
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => handleDownloadReport('word')}
                disabled={isDownloading}
              >
                <FileText className="h-4 w-4 mr-2" />
                <span>Download as Word</span>
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => handleDownloadReport('excel')}
                disabled={isDownloading}
              >
                <FileSpreadsheetIcon className="h-4 w-4 mr-2" />
                <span>Download as Excel</span>
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => handleDownloadReport('csv')}
                disabled={isDownloading}
              >
                <Download className="h-4 w-4 mr-2" />
                <span>Download as CSV</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      
      <Dialog 
        open={isDepartmentDialogOpen} 
        onOpenChange={(open) => {
          // Only allow closing if we're not currently downloading
          if (!isDownloading) {
            setIsDepartmentDialogOpen(open);
          }
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Department Information</DialogTitle>
            <DialogDescription>
              Enter department details for the report
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <div>
              <label htmlFor="department-full-name" className="text-sm font-medium mb-2 block">
                Enter Department Full Name
              </label>
              <Input
                id="department-full-name"
                value={departmentFullName}
                onChange={(e) => setDepartmentFullName(e.target.value)}
                placeholder="e.g. Computer Science and Engineering"
                className="mb-2"
                disabled={isDownloading}
              />
              <p className="text-sm text-muted-foreground">
                This will be used in the College Information table.
              </p>
            </div>
            
            <div>
              <label htmlFor="department-code" className="text-sm font-medium mb-2 block">
                Enter Department Code (short form)
              </label>
              <Input
                id="department-code"
                value={departmentCode}
                onChange={(e) => setDepartmentCode(e.target.value)}
                placeholder="e.g. CSE"
                className="mb-2"
                maxLength={5}
                disabled={isDownloading}
              />
              <p className="text-sm text-muted-foreground">
                This will be used in the End Semester Result Analysis table.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setIsDepartmentDialogOpen(false)}
              disabled={isDownloading}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleConfirmDepartment}
              disabled={isDownloading}
            >
              {isDownloading ? (
                <>
                  <Loader className="h-4 w-4 mr-2 animate-spin" />
                  Downloading...
                </>
              ) : (
                "Continue"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default ReportDownloader;
