
import React, { useRef } from 'react';
import { motion } from 'framer-motion';
import { Loader } from 'lucide-react';
import { ResultAnalysis, StudentRecord } from '@/utils/excelProcessor';
import AnalysisOverview from './AnalysisOverview';
import SubjectAnalysis from './SubjectAnalysis';
import StudentPerformance from './StudentPerformance';
import StudentSGPATable from './StudentSGPATable';
import ReportDownloader from './ReportDownloader';

interface ResultsDisplayProps {
  analysis: ResultAnalysis | null;
  studentRecords: StudentRecord[];
  calculationMode: 'sgpa' | 'cgpa' | null;
}

const ResultsDisplay: React.FC<ResultsDisplayProps> = ({ 
  analysis, 
  studentRecords,
  calculationMode
}) => {
  const dashboardRef = useRef<HTMLDivElement>(null);

  if (!analysis) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <Loader className="h-12 w-12 text-primary animate-spin mb-4" />
        <p className="text-muted-foreground">No data available. Please upload Excel file(s).</p>
      </div>
    );
  }

  return (
    <motion.div 
      id="dashboard-content"
      ref={dashboardRef}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-6 bg-white p-6 rounded-lg shadow-md"
    >
      <div className="mb-4">
        <h2 className="text-xl font-semibold">
          {calculationMode === 'sgpa' ? 'SGPA Analysis Results' : 'CGPA Analysis Results'}
        </h2>
        <p className="text-muted-foreground">
          {calculationMode === 'sgpa' 
            ? 'Semester Grade Point Average analysis for the uploaded semester data'
            : 'Cumulative Grade Point Average analysis across multiple semesters'}
        </p>
      </div>
      
      <AnalysisOverview analysis={analysis} calculationMode={calculationMode} />
      <SubjectAnalysis analysis={analysis} />
      <StudentPerformance analysis={analysis} />
      <StudentSGPATable analysis={analysis} calculationMode={calculationMode} />
      <ReportDownloader analysis={analysis} studentRecords={studentRecords} calculationMode={calculationMode} />
    </motion.div>
  );
};

export default ResultsDisplay;
