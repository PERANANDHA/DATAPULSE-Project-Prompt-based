
import * as XLSX from 'xlsx';
import JsPDF from 'jspdf';
import 'jspdf-autotable';

// Export everything from the new module files
export * from './excel/types';
export * from './excel/gradeUtils';
export * from './excel/fileParser';
export * from './excel/analyzer';
export * from './excel/reportGenerators/csvReportGenerator';
export * from './excel/reportGenerators/excelReportGenerator';
export * from './excel/reportGenerators/wordReportGenerator';

// This file now serves as a facade that re-exports everything from the refactored modules
