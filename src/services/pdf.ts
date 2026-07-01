/**
 * ExamPrepp — study guide PDF export.
 *
 * Renders the guide's raw markdown directly into a jsPDF document (headings,
 * bold/italic inline text, ordered/unordered lists, GFM tables via
 * jspdf-autotable, horizontal rules) instead of rasterizing the on-screen DOM.
 *
 * The previous implementation (html2pdf.js) cloned the rendered <article> into
 * a canvas via html2canvas. For a full-length guide that DOM node is 15,000-25,000px
 * tall; html2canvas's per-element style resolution over a node that size never
 * finished (the "Download PDF" button did nothing), and even where it completes,
 * mobile Safari's canvas area limit (~16.7M px²) is far smaller than the canvas a
 * guide that long requires — the exact device profile the PRD targets. Rendering
 * from the markdown source is O(content length) instead of O(DOM size) and has no
 * canvas dimension ceiling, so it works the same for a 2-topic guide or a 7-topic one.
 */
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

const INK: [number, number, number] = [17, 24, 39];
const INDIGO: [number, number, number] = [79, 70, 229];
const BORDER: [number, number, number] = [229, 231, 235];
const ROW_TINT: [number, number, number] = [249, 250, 251];

type Segment = { text: string; bold: boolean; italic: boolean };
type Token = Segment;

function stripInline(text: string): string {
  return text.replace(/\*\*(.+?)\*\*/g, '$1').replace(/\*(.+?)\*/g, '$1');
}

function parseInline(text: string): Segment[] {
  const segments: Segment[] = [];
  const re = /\*\*(.+?)\*\*|\*(.+?)\*/g;
  let last = 0;
  let match: RegExpExecArray | null;
  while ((match = re.exec(text))) {
    if (match.index > last) segments.push({ text: text.slice(last, match.index), bold: false, italic: false });
    if (match[1] !== undefined) segments.push({ text: match[1], bold: true, italic: false });
    else segments.push({ text: match[2], bold: false, italic: true });
    last = re.lastIndex;
  }
  if (last < text.length) segments.push({ text: text.slice(last), bold: false, italic: false });
  return segments.filter((s) => s.text.length > 0);
}

function tokenize(segments: Segment[]): Token[] {
  const tokens: Token[] = [];
  for (const seg of segments) {
    for (const word of seg.text.split(/\s+/).filter(Boolean)) {
      tokens.push({ text: word, bold: seg.bold, italic: seg.italic });
    }
  }
  return tokens;
}

function fontStyle(token: Token): 'bold' | 'italic' | 'normal' {
  return token.bold ? 'bold' : token.italic ? 'italic' : 'normal';
}

/** Greedily packs tokens into lines that fit `maxWidth` at `fontSize`. */
function packLines(doc: jsPDF, tokens: Token[], maxWidth: number, fontSize: number): Token[][] {
  doc.setFontSize(fontSize);
  const spaceWidth = doc.getTextWidth(' ');
  const lines: Token[][] = [];
  let current: Token[] = [];
  let width = 0;
  for (const token of tokens) {
    doc.setFont('helvetica', fontStyle(token));
    const w = doc.getTextWidth(token.text);
    const extra = current.length ? spaceWidth : 0;
    if (current.length && width + extra + w > maxWidth) {
      lines.push(current);
      current = [token];
      width = w;
    } else {
      current.push(token);
      width += extra + w;
    }
  }
  if (current.length) lines.push(current);
  return lines;
}

/** Draws pre-packed lines starting at `x`, advancing `yRef.y`, page-breaking via `ensure`. */
function drawLines(
  doc: jsPDF,
  lines: Token[][],
  x: number,
  yRef: { y: number },
  lineHeight: number,
  fontSize: number,
  ensure: (needed: number) => void,
) {
  doc.setFontSize(fontSize);
  const spaceWidth = doc.getTextWidth(' ');
  for (const line of lines) {
    ensure(lineHeight);
    let cx = x;
    for (const token of line) {
      doc.setFont('helvetica', fontStyle(token));
      doc.text(token.text, cx, yRef.y);
      cx += doc.getTextWidth(token.text) + spaceWidth;
    }
    yRef.y += lineHeight;
  }
}

const SEPARATOR_ROW = /^:?-{1,}:?$/;
const HR = /^-{3,}$|^\*{3,}$/;
const HEADING = /^(#{1,3})\s+(.*)$/;
const UNORDERED = /^[-*]\s+(.*)$/;
const ORDERED = /^(\d+)\.\s+(.*)$/;

export function downloadStudyGuidePdf(title: string, guide: string): { error: string | null } {
  try {
    const doc = new jsPDF({ unit: 'pt', format: 'a4' });
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = { top: 56, bottom: 56, left: 48, right: 48 };
    const contentWidth = pageWidth - margin.left - margin.right;
    const yRef = { y: margin.top };

    const ensure = (needed: number) => {
      if (yRef.y + needed > pageHeight - margin.bottom) {
        doc.addPage();
        yRef.y = margin.top;
      }
    };

    // Cover heading
    doc.setTextColor(...INDIGO);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.text('EXAMPREPP STUDY GUIDE', margin.left, yRef.y);
    yRef.y += 22;
    doc.setTextColor(...INK);
    doc.setFontSize(20);
    for (const line of doc.splitTextToSize(title || 'Study Guide', contentWidth) as string[]) {
      doc.text(line, margin.left, yRef.y);
      yRef.y += 24;
    }
    yRef.y += 4;
    doc.setDrawColor(...INDIGO);
    doc.setLineWidth(1.5);
    doc.line(margin.left, yRef.y, pageWidth - margin.right, yRef.y);
    yRef.y += 26;
    doc.setTextColor(...INK);

    const lines = guide.split('\n');
    let i = 0;
    let orderedCounter = 0;

    while (i < lines.length) {
      const line = lines[i].trim();

      if (!line) {
        yRef.y += 6;
        orderedCounter = 0;
        i++;
        continue;
      }

      if (HR.test(line)) {
        ensure(20);
        doc.setDrawColor(...BORDER);
        doc.setLineWidth(0.75);
        doc.line(margin.left, yRef.y, pageWidth - margin.right, yRef.y);
        yRef.y += 18;
        orderedCounter = 0;
        i++;
        continue;
      }

      const heading = HEADING.exec(line);
      if (heading) {
        orderedCounter = 0;
        const level = heading[1].length;
        const text = stripInline(heading[2]);
        const size = level === 1 ? 17 : level === 2 ? 14.5 : 12;
        doc.setFont('helvetica', 'bold');
        if (level === 3) doc.setTextColor(...INK);
        else doc.setTextColor(...INDIGO);
        for (const wrapped of doc.splitTextToSize(text, contentWidth) as string[]) {
          ensure(size + 4);
          doc.setFontSize(size);
          doc.text(wrapped, margin.left, yRef.y);
          yRef.y += size + 4;
        }
        yRef.y += 8;
        doc.setTextColor(...INK);
        i++;
        continue;
      }

      if (line.startsWith('|')) {
        const tableLines: string[] = [];
        while (i < lines.length && lines[i].trim().startsWith('|')) {
          tableLines.push(lines[i].trim());
          i++;
        }
        const rows = tableLines
          .map((row) =>
            row
              .replace(/^\|/, '')
              .replace(/\|$/, '')
              .split('|')
              .map((cell) => stripInline(cell.trim())),
          )
          .filter((cells) => !cells.every((cell) => SEPARATOR_ROW.test(cell)));
        const [head, ...body] = rows;
        if (head) {
          ensure(40);
          autoTable(doc, {
            startY: yRef.y,
            head: [head],
            body,
            margin: { top: margin.top, left: margin.left, right: margin.right, bottom: margin.bottom },
            styles: {
              font: 'helvetica',
              fontSize: 9,
              cellPadding: 5,
              textColor: INK,
              lineColor: BORDER,
              lineWidth: 0.5,
              overflow: 'linebreak',
            },
            headStyles: { fillColor: INDIGO, textColor: [255, 255, 255], fontStyle: 'bold' },
            alternateRowStyles: { fillColor: ROW_TINT },
          });
          const withAutoTable = doc as unknown as { lastAutoTable?: { finalY: number } };
          yRef.y = (withAutoTable.lastAutoTable?.finalY ?? yRef.y) + 16;
        }
        orderedCounter = 0;
        continue;
      }

      const unordered = UNORDERED.exec(line);
      const ordered = !unordered ? ORDERED.exec(line) : null;
      if (unordered || ordered) {
        const text = unordered ? unordered[1] : ordered![2];
        const marker = unordered ? '•' : `${++orderedCounter}.`;
        const indent = 16;
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10.5);
        ensure(14);
        doc.text(marker, margin.left, yRef.y);
        const packed = packLines(doc, tokenize(parseInline(text)), contentWidth - indent, 10.5);
        drawLines(doc, packed, margin.left + indent, yRef, 14, 10.5, ensure);
        yRef.y += 4;
        i++;
        continue;
      }

      // Paragraph — merge soft-wrapped source lines until a blank line or a new block starts.
      orderedCounter = 0;
      const paragraph = [line];
      i++;
      while (
        i < lines.length &&
        lines[i].trim() &&
        !HEADING.test(lines[i].trim()) &&
        !UNORDERED.test(lines[i].trim()) &&
        !ORDERED.test(lines[i].trim()) &&
        !lines[i].trim().startsWith('|') &&
        !HR.test(lines[i].trim())
      ) {
        paragraph.push(lines[i].trim());
        i++;
      }
      const packed = packLines(doc, tokenize(parseInline(paragraph.join(' '))), contentWidth, 10.5);
      drawLines(doc, packed, margin.left, yRef, 15, 10.5, ensure);
      yRef.y += 6;
    }

    const safeName = (title || 'study-guide').replace(/[^\w\s-]/g, '').trim() || 'study-guide';
    doc.save(`${safeName}.pdf`);
    return { error: null };
  } catch (err) {
    console.error('[ExamPrepp] downloadStudyGuidePdf failed:', err);
    return { error: 'Could not generate the PDF. Please try again.' };
  }
}
