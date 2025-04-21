import { Table, TableRow, WidthType, BorderStyle } from 'docx';
import { createTableCell } from './tableBuilders';
// Responsible for classification table building logic
export const buildClassificationTable = (analysis: any) => {
  // Classification Section - Modified to match exactly the provided image with proper spacing
  
  // Classification Table - Improved alignment and consistent appearance
  const classificationTable = new Table({
    width: {
      size: 108.7,
      type: WidthType.PERCENTAGE,
    },
    borders: {
      top: { style: BorderStyle.SINGLE, size: 1 },
      bottom: { style: BorderStyle.SINGLE, size: 1 },
      left: { style: BorderStyle.SINGLE, size: 1 },
      right: { style: BorderStyle.SINGLE, size: 1 },
      insideHorizontal: { style: BorderStyle.SINGLE, size: 1 },
      insideVertical: { style: BorderStyle.SINGLE, size: 1 },
    },
    // More precise column widths for better alignment
    columnWidths: [460, 460, 460, 460, 460, 300, 400, 460, 460, 460, 460, 460, 300, 400],
    rows: [
      // First row: Current semester | Upto this semester
      new TableRow({
        children: [
          createTableCell("Current semester", true, { 
            colspan: 7, 
            alignment: 'CENTER',
            bold: true
          }),
          createTableCell("Upto this semester", true, { 
            colspan: 7, 
            alignment: 'CENTER',
            bold: true
          }),
        ],
      }),
      // Second row: Headers with spans
      new TableRow({
        children: [
          createTableCell("Distinction", true, { 
            rowspan: 2, 
            alignment: 'CENTER',
            bold: true,
            verticalMerge: 'restart' 
          }),
          createTableCell("First class", true, { 
            colspan: 2, 
            alignment: 'CENTER',
            bold: true
          }),
          createTableCell("Second class", true, { 
            colspan: 2, 
            alignment: 'CENTER',
            bold: true
          }),
          createTableCell("Fail", true, { 
            rowspan: 2, 
            alignment: 'CENTER',
            bold: true,
            verticalMerge: 'restart' 
          }),
          createTableCell("% of pass", true, { 
            rowspan: 2, 
            alignment: 'CENTER',
            bold: true,
            verticalMerge: 'restart' 
          }),
          createTableCell("Distinction", true, { 
            rowspan: 2, 
            alignment: 'CENTER',
            bold: true,
            verticalMerge: 'restart' 
          }),
          createTableCell("First class", true, { 
            colspan: 2, 
            alignment: 'CENTER',
            bold: true
          }),
          createTableCell("Second class", true, { 
            colspan: 2, 
            alignment: 'CENTER',
            bold: true
          }),
          createTableCell("Fail", true, { 
            rowspan: 2, 
            alignment: 'CENTER',
            bold: true,
            verticalMerge: 'restart' 
          }),
          createTableCell("% of pass", true, { 
            rowspan: 2, 
            alignment: 'CENTER',
            bold: true,
            verticalMerge: 'restart' 
          }),
        ],
      }),
      // Third row: WOA/WA headers
      new TableRow({
        children: [
          // Skip Distinction cell (handled by rowspan above)
          createTableCell("WOA", true, { 
            alignment: 'CENTER',
            bold: true
          }),
          createTableCell("WA", true, { 
            alignment: 'CENTER',
            bold: true
          }),
          createTableCell("WOA", true, { 
            alignment: 'CENTER',
            bold: true
          }),
          createTableCell("WA", true, { 
            alignment: 'CENTER',
            bold: true
          }),
          // Skip Fail cell (handled by rowspan above)
          // Skip % of pass cell (handled by rowspan above)
          // Skip Distinction cell (handled by rowspan above)
          createTableCell("WOA", true, { 
            alignment: 'CENTER',
            bold: true
          }),
          createTableCell("WA", true, { 
            alignment: 'CENTER',
            bold: true
          }),
          createTableCell("WOA", true, { 
            alignment: 'CENTER',
            bold: true
          }),
          createTableCell("WA", true, { 
            alignment: 'CENTER',
            bold: true
          }),
          // Skip Fail cell (handled by rowspan above)
          // Skip % of pass cell (handled by rowspan above)
        ],
      }),
      // Fourth row: Data values
      new TableRow({
        children: [
          // Current semester data
          createTableCell(analysis.singleFileClassification.distinction.toString(), false, { 
            alignment: 'CENTER' 
          }),
          createTableCell(analysis.singleFileClassification.firstClassWOA.toString(), false, { 
            alignment: 'CENTER' 
          }),
          createTableCell(analysis.singleFileClassification.firstClassWA.toString(), false, { 
            alignment: 'CENTER' 
          }),
          createTableCell(analysis.singleFileClassification.secondClassWOA.toString(), false, { 
            alignment: 'CENTER' 
          }),
          createTableCell(analysis.singleFileClassification.secondClassWA.toString(), false, { 
            alignment: 'CENTER' 
          }),
          createTableCell(analysis.singleFileClassification.fail.toString(), false, { 
            alignment: 'CENTER' 
          }),
          createTableCell(analysis.singleFileClassification.passPercentage.toFixed(1), false, { 
            alignment: 'CENTER' 
          }),
          // Cumulative data (up to this semester)
          createTableCell(analysis.multipleFileClassification.distinction.toString(), false, { 
            alignment: 'CENTER' 
          }),
          createTableCell(analysis.multipleFileClassification.firstClassWOA.toString(), false, { 
            alignment: 'CENTER' 
          }),
          createTableCell(analysis.multipleFileClassification.firstClassWA.toString(), false, { 
            alignment: 'CENTER' 
          }),
          createTableCell(analysis.multipleFileClassification.secondClassWOA.toString(), false, { 
            alignment: 'CENTER' 
          }),
          createTableCell(analysis.multipleFileClassification.secondClassWA.toString(), false, { 
            alignment: 'CENTER' 
          }),
          createTableCell(analysis.multipleFileClassification.fail.toString(), false, { 
            alignment: 'CENTER' 
          }),
          createTableCell(analysis.multipleFileClassification.passPercentage.toFixed(1), false, { 
            alignment: 'CENTER' 
          }),
        ],
      }),
    ],
  });
  
  return classificationTable;
};
