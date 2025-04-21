
import { Paragraph, Table, TableRow, TableCell, BorderStyle, WidthType, AlignmentType, TextRun, ImageRun } from 'docx';

// Helper to build header with optional logo
export const createHeaderTable = (headerImage?: ImageRun) => new Table({
  width: { size: 100, type: WidthType.PERCENTAGE },
  borders: {
    top: { style: BorderStyle.SINGLE, size: 1 },
    bottom: { style: BorderStyle.SINGLE, size: 1 },
    left: { style: BorderStyle.SINGLE, size: 1 },
    right: { style: BorderStyle.SINGLE, size: 1 },
  },
  columnWidths: [1200, 6400, 2300],
  rows: [
    new TableRow({
      children: [
        new TableCell({
          width: { size: 12, type: WidthType.PERCENTAGE },
          children: headerImage
            ? [new Paragraph({ alignment: AlignmentType.CENTER, children: [headerImage] })]
            : [new Paragraph("Logo")],
          verticalAlign: AlignmentType.CENTER,
          margins: { top: 100, bottom: 100, left: 150, right: 150 }
        }),
        new TableCell({
          width: { size: 66, type: WidthType.PERCENTAGE },
          children: [
            new Paragraph({
              alignment: AlignmentType.CENTER,
              children: [
                new TextRun({
                  text: "K.S. RANGASAMY COLLEGE OF TECHNOLOGY, TIRUCHENGODE - 637 215 (An Autonomous Institute Affiliated to Anna University, Chennai)",
                  bold: true,
                  size: 24,
                }),
              ],
            }),
          ],
          verticalAlign: AlignmentType.CENTER,
          margins: { top: 100, bottom: 100, left: 150, right: 150 }
        }),
        new TableCell({
          width: { size: 22, type: WidthType.PERCENTAGE },
          children: [
            new Paragraph({
              alignment: AlignmentType.CENTER,
              children: [
                new TextRun({
                  text: "RESULT ANALYSIS",
                  bold: true,
                  size: 22,
                }),
              ],
            }),
          ],
          verticalAlign: AlignmentType.CENTER,
          margins: { top: 100, bottom: 100, left: 150, right: 150 }
        }),
      ],
    }),
  ],
});
