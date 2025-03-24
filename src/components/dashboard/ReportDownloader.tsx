
import React, { useState } from 'react';
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

interface ReportDownloaderProps {
  analysis: ResultAnalysis | null;
  studentRecords: StudentRecord[];
}

const ReportDownloader: React.FC<ReportDownloaderProps> = ({ analysis, studentRecords }) => {
  const [isDownloading, setIsDownloading] = useState(false);
  const { toast } = useToast();

  const handleDownloadReport = async (format: 'csv' | 'excel' | 'word' | 'pdf') => {
    if (!analysis || !studentRecords.length) {
      toast({
        variant: "destructive",
        title: "No data available",
        description: "Please upload and analyze data before downloading a report.",
      });
      return;
    }
    
    setIsDownloading(true);
    
    try {
      if (format === 'csv') {
        downloadCSVReport(analysis, studentRecords);
      } else if (format === 'excel') {
        downloadExcelReport(analysis, studentRecords);
      } else if (format === 'word') {
        downloadWordReport(analysis, studentRecords);
      } else if (format === 'pdf') {
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

  return (
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
  );
};

export default ReportDownloader;
