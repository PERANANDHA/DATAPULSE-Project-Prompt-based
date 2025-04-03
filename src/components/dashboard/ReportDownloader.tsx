
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download, FileText, FilePdf, FileSpreadsheetIcon } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { generateAnalysisWordDocument } from '@/utils/excel/analyzer';
import { saveAs } from 'file-saver';
import { Packer } from 'docx';

interface ReportDownloaderProps {
  analysis: any;
  studentRecords: any[];
  calculationMode: 'sgpa' | 'cgpa' | null;
}

const ReportDownloader: React.FC<ReportDownloaderProps> = ({
  analysis,
  studentRecords,
  calculationMode
}) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const { toast } = useToast();
  const [reportType, setReportType] = useState('word');

  // Find current semester subjects from the analysis
  const currentSemesterCodes = analysis?.currentSemesterSubjectPerformance
    ? analysis.currentSemesterSubjectPerformance.map((subject: any) => subject.subjectCode)
    : [];

  const handleDownloadReport = async () => {
    if (!analysis) {
      toast({
        variant: "destructive",
        title: "No data available",
        description: "Please complete the analysis first before downloading reports."
      });
      return;
    }

    setIsGenerating(true);

    try {
      let blob: Blob | null = null;
      let filename = '';

      if (reportType === 'word') {
        const doc = generateAnalysisWordDocument(analysis, studentRecords, currentSemesterCodes);
        blob = await Packer.toBlob(doc);
        filename = `${calculationMode?.toUpperCase() || 'Result'}_Analysis_Report.docx`;
      }

      if (blob) {
        saveAs(blob, filename);
        toast({
          title: "Report generated successfully",
          description: `Your ${reportType.toUpperCase()} report has been downloaded.`
        });
      }

    } catch (error) {
      console.error("Report generation error:", error);
      toast({
        variant: "destructive",
        title: "Report generation failed",
        description: "There was a problem generating your report. Please try again."
      });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Card className="w-full mx-auto" style={{ maxWidth: '700px' }}>
      <CardHeader>
        <CardTitle className="text-center text-lg">Download Analysis Reports</CardTitle>
        <CardDescription className="text-center">
          Download detailed reports of the analysis in different formats
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="word" value={reportType} onValueChange={setReportType} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="word" className="flex items-center justify-center">
              <FileText className="mr-2 h-4 w-4" />
              Word
            </TabsTrigger>
            <TabsTrigger value="pdf" className="flex items-center justify-center" disabled>
              <FilePdf className="mr-2 h-4 w-4" />
              PDF
            </TabsTrigger>
            <TabsTrigger value="excel" className="flex items-center justify-center" disabled>
              <FileSpreadsheetIcon className="mr-2 h-4 w-4" />
              Excel
            </TabsTrigger>
          </TabsList>

          <TabsContent value="word" className="mt-4">
            <div className="text-sm text-muted-foreground mb-4">
              Download a comprehensive Word document with detailed analysis including:
              <ul className="list-disc pl-5 mt-2 space-y-1">
                <li>End Semester Result Analysis (current semester data)</li>
                <li>Performance Summary (current semester data)</li>
                <li>Individual Student Performance (current semester data)</li>
                <li>Classification (cumulative data)</li>
                <li>Rank Analysis (cumulative data)</li>
              </ul>
            </div>
            <Button 
              className="w-full" 
              onClick={handleDownloadReport}
              disabled={isGenerating}
            >
              {isGenerating ? (
                <>Generating Document...</>
              ) : (
                <>
                  <Download className="mr-2 h-4 w-4" />
                  Download Word Report
                </>
              )}
            </Button>
          </TabsContent>

          <TabsContent value="pdf" className="mt-4">
            <div className="text-sm text-muted-foreground mb-4">
              PDF export coming soon. You can download the Word document and save as PDF for now.
            </div>
          </TabsContent>

          <TabsContent value="excel" className="mt-4">
            <div className="text-sm text-muted-foreground mb-4">
              Excel export coming soon with raw data and pivot tables for further analysis.
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default ReportDownloader;
