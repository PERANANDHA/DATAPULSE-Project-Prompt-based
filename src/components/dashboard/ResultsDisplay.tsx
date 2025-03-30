
import React, { useRef, memo } from 'react';
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

// Memoize the components to prevent unnecessary re-renders
const MemoizedAnalysisOverview = memo(AnalysisOverview);
const MemoizedSubjectAnalysis = memo(SubjectAnalysis);
const MemoizedStudentPerformance = memo(StudentPerformance);
const MemoizedStudentSGPATable = memo(StudentSGPATable);
const MemoizedReportDownloader = memo(ReportDownloader);

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

  // For CGPA mode, determine if we're showing the current semester subjects
  const showSubjectAnalysis = calculationMode === 'sgpa' || 
    (calculationMode === 'cgpa' && analysis.currentSemesterFile);

  // If in CGPA mode with multiple files, get the semester name for display
  let semesterLabel = 'Semester';
  if (calculationMode === 'cgpa' && analysis.currentSemesterFile && analysis.fileWiseAnalysis) {
    const currentFileAnalysis = analysis.fileWiseAnalysis[analysis.currentSemesterFile];
    if (currentFileAnalysis && currentFileAnalysis.semesterName) {
      semesterLabel = `Semester ${currentFileAnalysis.semesterName}`;
    }
  }

  return (
    <motion.div 
      id="dashboard-content"
      ref={dashboardRef}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-6 bg-white/90 backdrop-blur-sm p-6 rounded-lg shadow-lg flex flex-col items-center border border-blue-100/30"
    >
      <div className="mb-4 text-center w-full">
        <h2 className="text-xl font-semibold bg-gradient-to-r from-[#0EA5E9] to-[#F97316] bg-clip-text text-transparent">
          {calculationMode === 'sgpa' ? 'SGPA Analysis Results' : 'CGPA Analysis Results'}
        </h2>
        <p className="text-muted-foreground">
          {calculationMode === 'sgpa' 
            ? 'Semester Grade Point Average analysis for the uploaded semester data'
            : `Cumulative Grade Point Average analysis across multiple semesters (Current: ${semesterLabel})`}
        </p>
      </div>
      
      <div className="w-full flex justify-center">
        <MemoizedAnalysisOverview analysis={analysis} calculationMode={calculationMode} />
      </div>
      
      {/* Show subject analysis in SGPA mode or for the current semester in CGPA mode */}
      {showSubjectAnalysis && (
        <div className="w-full flex justify-center">
          <MemoizedSubjectAnalysis 
            analysis={analysis} 
            title={calculationMode === 'cgpa' ? `Current ${semesterLabel} Subject Performance` : undefined}
          />
        </div>
      )}
      
      <div className="w-full flex justify-center">
        <MemoizedStudentPerformance analysis={analysis} calculationMode={calculationMode} />
      </div>
      
      <div className="w-full flex justify-center">
        <MemoizedStudentSGPATable analysis={analysis} calculationMode={calculationMode} />
      </div>
      
      <div className="w-full flex justify-center">
        <MemoizedReportDownloader analysis={analysis} studentRecords={studentRecords} calculationMode={calculationMode} />
      </div>

      {/* Decorative elements for the dashboard */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-blue-100 rounded-full mix-blend-multiply filter blur-3xl opacity-10"></div>
      <div className="absolute bottom-40 left-20 w-72 h-72 bg-orange-100 rounded-full mix-blend-multiply filter blur-3xl opacity-10"></div>
    </motion.div>
  );
};

export default ResultsDisplay;
