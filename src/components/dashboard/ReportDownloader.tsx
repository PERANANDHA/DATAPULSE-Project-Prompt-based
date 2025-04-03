
import React from "react";
import { Button } from "@/components/ui/button";
import { FileText } from "lucide-react";
import { generateWordDocReport } from "@/utils/excelProcessor";
import { generateExcelReport } from "@/utils/excel/reportGenerators/excelReportGenerator";
import { generatePdfReport } from "@/utils/excel/reportGenerators/pdfReportGenerator";
import { generateCsvReport } from "@/utils/excel/reportGenerators/csvReportGenerator";
import { StudentData } from "@/utils/excel/types";
import { useToast } from "@/hooks/use-toast";

interface ReportDownloaderProps {
  results: StudentData[];
  wordReportData: any;
}

const ReportDownloader = ({ results, wordReportData }: ReportDownloaderProps) => {
  const { toast } = useToast();

  const handleDownloadReport = async (type: string) => {
    if (!results.length) {
      toast({
        variant: "destructive",
        title: "No data available",
        description: "Please upload and process a file first",
      });
      return;
    }

    try {
      let success = false;

      switch (type) {
        case "word":
          success = await generateWordDocReport(wordReportData);
          break;
        case "excel":
          success = await generateExcelReport(results);
          break;
        case "pdf":
          success = await generatePdfReport(results);
          break;
        case "csv":
          success = await generateCsvReport(results);
          break;
        default:
          break;
      }

      if (success) {
        toast({
          title: "Report downloaded successfully",
          description: `Your ${type.toUpperCase()} report has been downloaded.`,
        });
      } else {
        throw new Error("Failed to generate report");
      }
    } catch (error) {
      console.error(`Error generating ${type} report:`, error);
      toast({
        variant: "destructive",
        title: `Failed to download ${type.toUpperCase()} report`,
        description: "An error occurred while generating the report",
      });
    }
  };

  return (
    <div className="grid grid-cols-2 gap-2">
      <Button
        variant="outline"
        className="flex items-center justify-center gap-2"
        onClick={() => handleDownloadReport("word")}
      >
        <FileText size={16} />
        Word
      </Button>
      <Button
        variant="outline"
        className="flex items-center justify-center gap-2"
        onClick={() => handleDownloadReport("excel")}
      >
        <FileText size={16} />
        Excel
      </Button>
      <Button
        variant="outline"
        className="flex items-center justify-center gap-2"
        onClick={() => handleDownloadReport("pdf")}
      >
        <FileText size={16} />
        PDF
      </Button>
      <Button
        variant="outline"
        className="flex items-center justify-center gap-2"
        onClick={() => handleDownloadReport("csv")}
      >
        <FileText size={16} />
        CSV
      </Button>
    </div>
  );
};

export default ReportDownloader;
