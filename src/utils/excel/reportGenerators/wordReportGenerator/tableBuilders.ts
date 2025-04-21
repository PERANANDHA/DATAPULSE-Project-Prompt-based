
import { Paragraph, Table, TableRow, TableCell, TextRun, BorderStyle, WidthType } from 'docx';

// Table row and cell utilities for reuse
export const createTableRow = (data: string[]) =>
  new TableRow({
    children: data.map(cell => createTableCell(cell)),
  });

export const createTableCell = (
  text: string, 
  bold = false, 
  options: { alignment?: string; colspan?: number; rowspan?: number; rightIndent?: number; verticalMerge?: string } = {}
) =>
  new TableCell({
    children: [new Paragraph({
      children: [new TextRun({ text, bold })]
    })],
    ...(options.colspan ? { columnSpan: options.colspan } : {}),
    ...(options.rowspan ? { rowSpan: options.rowspan } : {}),
    verticalAlign: options.alignment === 'CENTER' ? 'center' : undefined,
    // add more as needed...
  });

export const createHeaderCell = (text: string, opt?: any) => createTableCell(text, true, { ...(opt || {}) });
