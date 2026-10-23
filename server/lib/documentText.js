// server/lib/documentText.js
// Extracts plain text from uploaded resumes and job descriptions.
const { PDFParse } = require("pdf-parse");
const mammoth = require("mammoth");

function looksLikePdf(buffer) {
  return buffer.length > 4 && buffer.subarray(0, 5).toString("latin1") === "%PDF-";
}

function looksLikeDocx(buffer) {
  // DOCX files are zip archives
  return buffer.length > 4 && buffer[0] === 0x50 && buffer[1] === 0x4b;
}

async function pdfToText(buffer) {
  const parser = new PDFParse({ data: new Uint8Array(buffer) });
  try {
    const result = await parser.getText();
    return (result && result.text) || "";
  } finally {
    await parser.destroy().catch(() => {});
  }
}

// Detects the format from the file's bytes rather than trusting the
// client-supplied name or MIME type. Returns "" when nothing can be read.
async function extractText(buffer) {
  if (!buffer || !buffer.length) return "";

  try {
    if (looksLikePdf(buffer)) return await pdfToText(buffer);
    if (looksLikeDocx(buffer)) {
      const { value } = await mammoth.extractRawText({ buffer });
      return value || "";
    }
  } catch (err) {
    console.error("Text extraction failed:", err.message);
    return "";
  }

  // Legacy binary .doc (OLE container) cannot be read reliably
  if (buffer[0] === 0xd0 && buffer[1] === 0xcf && buffer[2] === 0x11 && buffer[3] === 0xe0) {
    return "";
  }

  // Plain text
  const text = buffer.toString("utf8");
  return text.replace(/[^\x09\x0a\x0d\x20-\x7e -￿]/g, " ");
}

module.exports = { extractText, looksLikePdf, looksLikeDocx };
