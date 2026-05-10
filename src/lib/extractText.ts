/**
 * Pulls plain text out of common file types uploaded to the portal so AI
 * grading + embedding can run on it. Each branch is defensive — extraction
 * failures throw and the caller marks the submission as `extractionFailed`
 * but still saves the file URL.
 *
 * All the heavy parsers are loaded via dynamic import so the Next.js client
 * bundle doesn't pull them in.
 */

const MAX_CHARS = 50_000;

export class ExtractionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ExtractionError";
  }
}

function clamp(text: string): string {
  if (!text) return "";
  return text.length > MAX_CHARS ? text.slice(0, MAX_CHARS) : text;
}

async function fetchBuffer(url: string): Promise<Buffer> {
  const res = await fetch(url);
  if (!res.ok) {
    throw new ExtractionError(`failed to fetch upload: ${res.status}`);
  }
  const arr = await res.arrayBuffer();
  return Buffer.from(arr);
}

async function extractPdf(buffer: Buffer): Promise<string> {
  const mod = await import("pdf-parse");
  const pdfParse = (mod as any).default ?? (mod as any);
  const data = await pdfParse(buffer);
  return data?.text ?? "";
}

async function extractDocx(buffer: Buffer): Promise<string> {
  const mammoth = await import("mammoth");
  const result = await mammoth.extractRawText({ buffer });
  return result?.value ?? "";
}

async function extractXlsx(buffer: Buffer): Promise<string> {
  const XLSX = await import("xlsx");
  const wb = XLSX.read(buffer, { type: "buffer" });
  const parts: string[] = [];
  for (const name of wb.SheetNames) {
    const sheet = wb.Sheets[name];
    parts.push(`# ${name}\n${XLSX.utils.sheet_to_csv(sheet)}`);
  }
  return parts.join("\n\n");
}

async function extractZipLike(
  buffer: Buffer,
  isPpt: boolean,
): Promise<string> {
  const { default: JSZip } = await import("jszip");
  const zip = await JSZip.loadAsync(buffer);
  const parts: string[] = [];

  if (isPpt) {
    // Pull text from each slide XML ( <a:t>...</a:t> ).
    const slideFiles = Object.keys(zip.files).filter((p) =>
      /^ppt\/slides\/slide\d+\.xml$/.test(p),
    );
    for (const path of slideFiles.sort()) {
      const xml = await zip.files[path].async("string");
      const matches = xml.match(/<a:t[^>]*>([^<]*)<\/a:t>/g) ?? [];
      const slideText = matches
        .map((m) => m.replace(/<[^>]+>/g, ""))
        .join(" ");
      if (slideText.trim()) parts.push(slideText);
    }
    if (parts.length === 0) {
      // Some legacy pptx structures — fall through to generic walk.
    } else {
      return parts.join("\n\n");
    }
  }

  // Generic zip walk: read text-like files (.txt, .md, .json, .csv, .xml, .yaml).
  const textRe = /\.(txt|md|markdown|json|csv|xml|yml|yaml|html|htm|js|ts|jsx|tsx|py|java|c|cpp|h|cs|rb|go|rs)$/i;
  const entries = Object.values(zip.files);
  for (const file of entries) {
    if (file.dir) continue;
    if (!textRe.test(file.name)) continue;
    try {
      const content = await file.async("string");
      if (content.trim()) {
        parts.push(`--- ${file.name} ---\n${content}`);
      }
    } catch {
      // skip unreadable files
    }
    if (parts.join("\n").length > MAX_CHARS) break;
  }
  return parts.join("\n\n");
}

export async function extractTextFromUpload(opts: {
  url: string;
  fileName: string;
}): Promise<string> {
  const ext = (opts.fileName.split(".").pop() ?? "").toLowerCase();
  const buffer = await fetchBuffer(opts.url);

  try {
    let raw = "";
    switch (ext) {
      case "pdf":
        raw = await extractPdf(buffer);
        break;
      case "docx":
      case "doc":
        // .doc (legacy binary) isn't well supported — try mammoth, fall back.
        raw = await extractDocx(buffer);
        break;
      case "xlsx":
      case "xls":
        raw = await extractXlsx(buffer);
        break;
      case "pptx":
      case "ppt":
        raw = await extractZipLike(buffer, true);
        break;
      case "zip":
        raw = await extractZipLike(buffer, false);
        break;
      default:
        // Unknown extension — make a best-effort UTF-8 decode.
        raw = buffer.toString("utf8");
    }
    const cleaned = clamp(raw.replace(/\r\n/g, "\n").trim());
    if (!cleaned) {
      throw new ExtractionError("no extractable text");
    }
    return cleaned;
  } catch (err: any) {
    if (err instanceof ExtractionError) throw err;
    throw new ExtractionError(err?.message ?? "extraction failed");
  }
}
