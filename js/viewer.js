/**
 * VIEWER.JS
 * Motor de Renderização Multiformato de Alta Fidelidade
 * Suporta: PDF (.pdf), Word Moderno (.docx), Word Legado Binário (.doc OLE2 Word 97-2003 / Word 95 / RTF) e Imagens
 * Busca textual integrada (Ctrl+F) com navegação entre ocorrências, sensível a maiúsculas e acentos/til (~).
 */

const CP1252_EXTENDED_MAP = {
  0x80: 0x20AC, 0x82: 0x201A, 0x83: 0x0192, 0x84: 0x201E, 0x85: 0x2026,
  0x86: 0x2020, 0x87: 0x2021, 0x88: 0x02C6, 0x89: 0x2030, 0x8A: 0x0160,
  0x8B: 0x2039, 0x8C: 0x0152, 0x8E: 0x017D, 0x91: 0x2018, 0x92: 0x2019,
  0x93: 0x201C, 0x94: 0x201D, 0x95: 0x2022, 0x96: 0x2013, 0x97: 0x2014,
  0x98: 0x02DC, 0x99: 0x2122, 0x9A: 0x0161, 0x9B: 0x203A, 0x9C: 0x0153,
  0x9E: 0x017E, 0x9F: 0x0178
};

const CEP_VIEWER = {
  currentFile: null,
  fileType: null,
  pdfDoc: null,
  currentPage: 1,
  totalPages: 1,
  zoomScale: 1.0,
  rotation: 0,
  containerEl: null,
  searchTerm: '',
  caseSensitive: false,
  accentSensitive: false,
  currentMatchIndex: 0,
  totalMatches: 0,
  matchElements: [],

  init(containerElement) {
    this.containerEl = containerElement;
  },

  detectType(file) {
    if (!file || !file.name) return 'unknown';
    const name = file.name.toLowerCase();
    if (name.endsWith('.pdf')) return 'pdf';
    if (name.endsWith('.docx')) return 'docx';
    if (name.endsWith('.doc') || name.endsWith('.rtf') || name.endsWith('.txt')) return 'doc';
    if (name.endsWith('.jpg') || name.endsWith('.jpeg') || name.endsWith('.png') || name.endsWith('.webp') || name.endsWith('.gif') || name.endsWith('.bmp')) return 'image';
    return 'unknown';
  },

  /**
   * Detecta assinatura binária real do arquivo (OLE2 D0 CF 11 E0, ZIP/OOXML 50 4B 03 04, PDF, RTF, HTML)
   */
  detectBinarySignature(bytes) {
    if (!bytes || bytes.length < 4) return 'unknown';
    // Assinatura OLE2 Compound Binary File: D0 CF 11 E0 A1 B1 1A E1 (.doc Word 97-2003)
    if (
      bytes.length >= 8 &&
      bytes[0] === 0xD0 && bytes[1] === 0xCF && bytes[2] === 0x11 && bytes[3] === 0xE0 &&
      bytes[4] === 0xA1 && bytes[5] === 0xB1 && bytes[6] === 0x1A && bytes[7] === 0xE1
    ) {
      return 'ole2';
    }
    // Assinatura PKZIP / OOXML (.docx)
    if (bytes[0] === 0x50 && bytes[1] === 0x4B && bytes[2] === 0x03 && bytes[3] === 0x04) {
      return 'zip';
    }
    // Assinatura PDF (%PDF)
    if (bytes[0] === 0x25 && bytes[1] === 0x50 && bytes[2] === 0x44 && bytes[3] === 0x46) {
      return 'pdf';
    }
    // Assinatura RTF ({\rtf)
    if (bytes[0] === 0x7B && bytes[1] === 0x5C && bytes[2] === 0x72 && bytes[3] === 0x74 && bytes[4] === 0x66) {
      return 'rtf';
    }
    // Verifica HTML / XML salvo com extensão .doc
    let headAscii = '';
    const checkLen = Math.min(bytes.length, 256);
    for (let i = 0; i < checkLen; i++) {
      if (bytes[i] !== 0) headAscii += String.fromCharCode(bytes[i]);
    }
    const trimmedHead = headAscii.trim().toLowerCase();
    if (
      trimmedHead.startsWith('<!doctype html') ||
      trimmedHead.startsWith('<html') ||
      trimmedHead.startsWith('<?xml') ||
      trimmedHead.startsWith('<w:worddocument') ||
      trimmedHead.startsWith('mime-version:')
    ) {
      return 'html_doc';
    }
    return 'plain';
  },

  async loadDocument(file) {
    this.currentFile = file;
    this.fileType = this.detectType(file);
    this.currentPage = 1;
    this.totalPages = 1;
    this.zoomScale = 1.0;
    this.rotation = 0;
    this.totalMatches = 0;
    this.currentMatchIndex = 0;
    this.matchElements = [];

    if (!this.containerEl) return;
    this.containerEl.innerHTML = '';

    // Inspeção preventiva de assinatura mágica para arquivos Word (.doc vs .docx renomeados)
    if (file && (this.fileType === 'doc' || this.fileType === 'docx' || this.fileType === 'unknown')) {
      try {
        const headerSlice = await file.slice(0, 512).arrayBuffer();
        const sig = this.detectBinarySignature(new Uint8Array(headerSlice));
        if (sig === 'ole2' || sig === 'rtf' || sig === 'html_doc') {
          this.fileType = 'doc';
        } else if (sig === 'zip' && this.fileType === 'doc') {
          this.fileType = 'docx';
        } else if (sig === 'pdf') {
          this.fileType = 'pdf';
        }
      } catch (e) {}
    }

    switch (this.fileType) {
      case 'pdf':
        await this.renderPDF(file);
        break;
      case 'docx':
        await this.renderDOCX(file);
        break;
      case 'doc':
        await this.renderDOC(file);
        break;
      case 'image':
        await this.renderImage(file);
        break;
      default:
        this.renderUnsupported(file);
        break;
    }
  },

  async renderPDF(file) {
    if (typeof pdfjsLib === 'undefined') {
      this.containerEl.innerHTML = `
        <div style="padding: 24px; background: #fff; border: 2px solid #000; text-align: center;">
          <strong>Carregando motor PDF.js...</strong>
        </div>
      `;
      return;
    }

    try {
      const arrayBuffer = await file.arrayBuffer();
      const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
      this.pdfDoc = await loadingTask.promise;
      this.totalPages = this.pdfDoc.numPages;
      await this.renderPDFPage(this.currentPage);
    } catch (err) {
      console.error('Erro ao renderizar PDF:', err);
      this.containerEl.innerHTML = `
        <div style="padding: 24px; background: #fff; border: 2px solid #800000; color: #800000; text-align: center;">
          <strong>Erro ao abrir o arquivo PDF:</strong><br>${err.message || 'Arquivo corrompido ou inválido.'}
        </div>
      `;
    }
  },

  async renderPDFPage(pageNum) {
    if (!this.pdfDoc || !this.containerEl) return;
    this.containerEl.innerHTML = '';
    this.matchElements = [];
    this.totalMatches = 0;

    const page = await this.pdfDoc.getPage(pageNum);
    const scale = this.zoomScale * 1.35;
    const viewport = page.getViewport({ scale: scale, rotation: this.rotation });

    const pageWrapper = document.createElement('div');
    pageWrapper.style.position = 'relative';
    pageWrapper.style.display = 'inline-block';
    pageWrapper.style.backgroundColor = '#ffffff';
    pageWrapper.style.boxShadow = '4px 4px 0px rgba(0,0,0,0.5)';
    pageWrapper.style.border = '1px solid #000000';
    pageWrapper.style.margin = '0 auto';

    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    canvas.height = viewport.height;
    canvas.width = viewport.width;
    canvas.style.display = 'block';

    pageWrapper.appendChild(canvas);
    this.containerEl.appendChild(pageWrapper);

    await page.render({
      canvasContext: context,
      viewport: viewport
    }).promise;

    const textContent = await page.getTextContent();
    const textLayerDiv = document.createElement('div');
    textLayerDiv.style.position = 'absolute';
    textLayerDiv.style.top = '0';
    textLayerDiv.style.left = '0';
    textLayerDiv.style.width = `${viewport.width}px`;
    textLayerDiv.style.height = `${viewport.height}px`;
    textLayerDiv.style.overflow = 'hidden';
    textLayerDiv.style.lineHeight = '1.0';
    textLayerDiv.style.userSelect = 'text';

    for (const item of textContent.items) {
      if (!item.str) continue;
      const tx = pdfjsLib.Util.transform(viewport.transform, item.transform);
      const fontHeight = Math.sqrt((tx[2] * tx[2]) + (tx[3] * tx[3]));
      const span = document.createElement('span');
      span.textContent = item.str;
      span.style.position = 'absolute';
      span.style.left = `${tx[4]}px`;
      span.style.top = `${tx[5] - fontHeight}px`;
      span.style.fontSize = `${fontHeight}px`;
      span.style.fontFamily = 'sans-serif';
      span.style.color = 'transparent';
      span.style.whiteSpace = 'pre';
      textLayerDiv.appendChild(span);
    }

    pageWrapper.appendChild(textLayerDiv);

    if (this.searchTerm && this.searchTerm.trim()) {
      this.highlightInPDFTextLayer(textLayerDiv);
    }
  },

  highlightInPDFTextLayer(textLayerDiv) {
    const query = this.normalizeString(this.searchTerm.trim());
    if (!query) return;

    const spans = textLayerDiv.querySelectorAll('span');
    this.matchElements = [];

    spans.forEach(span => {
      const normalizedSpan = this.normalizeString(span.textContent);
      if (normalizedSpan.includes(query)) {
        span.style.backgroundColor = 'rgba(255, 255, 0, 0.55)';
        span.style.outline = '1px solid #b45309';
        span.style.borderRadius = '2px';
        this.matchElements.push(span);
      }
    });

    this.totalMatches = this.matchElements.length;
    if (this.totalMatches > 0) {
      this.currentMatchIndex = 1;
      this.focusMatch(0);
    } else {
      this.currentMatchIndex = 0;
    }
  },

  async renderDOCX(file) {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const sig = this.detectBinarySignature(new Uint8Array(arrayBuffer));
      if (sig === 'ole2' || sig === 'rtf' || sig === 'html_doc') {
        this.fileType = 'doc';
        await this.renderDOC(file, arrayBuffer);
        return;
      }

      if (typeof mammoth !== 'undefined') {
        const result = await mammoth.convertToHtml({ arrayBuffer: arrayBuffer });
        await this.renderVirtualDocSheet(result.value, arrayBuffer);
      } else {
        this.renderUnsupported(file);
      }
    } catch (err) {
      console.error('Erro ao renderizar DOCX:', err);
      this.containerEl.innerHTML = `
        <div style="padding: 24px; background: #fff; border: 2px solid #800000; color: #800000;">
          <strong>Erro ao processar arquivo DOCX:</strong> ${err.message}
        </div>
      `;
    }
  },

  async renderVirtualDocSheet(htmlContent, arrayBuffer = null) {
    const sheet = document.createElement('div');
    sheet.className = 'docx-page-sheet';
    this.applySheetZoom(sheet);
    sheet.innerHTML = htmlContent;

    const tables = sheet.querySelectorAll('table');
    tables.forEach(t => {
      t.style.width = '100%';
      t.style.borderCollapse = 'collapse';
      t.style.margin = '14px 0';
    });
    const cells = sheet.querySelectorAll('th, td');
    cells.forEach(c => {
      c.style.border = '1px solid #333333';
      c.style.padding = '6px 8px';
    });

    if (arrayBuffer && (typeof JSZip !== 'undefined' || (typeof window !== 'undefined' && window.JSZip))) {
      try {
        await this.applyDocxStyles(sheet, arrayBuffer);
      } catch (err) {
        console.warn('Aviso: Não foi possível aplicar estilos estendidos do DOCX:', err);
      }
    }

    this.containerEl.innerHTML = '';
    this.containerEl.appendChild(sheet);

    if (this.searchTerm && this.searchTerm.trim()) {
      this.highlightHTMLText(sheet);
    }
  },

  async applyDocxStyles(sheet, arrayBuffer) {
    const ZipLib = typeof JSZip !== 'undefined' ? JSZip : (typeof window !== 'undefined' ? window.JSZip : null);
    if (!ZipLib || !arrayBuffer) return;

    const zip = await ZipLib.loadAsync(arrayBuffer);
    const docFile = zip.file('word/document.xml');
    if (!docFile) return;

    const docXmlStr = await docFile.async('text');
    const parser = new DOMParser();
    const docXml = parser.parseFromString(docXmlStr, 'application/xml');
    if (!docXml) return;

    const xmlTables = docXml.getElementsByTagNameNS('*', 'tbl');
    const htmlTables = sheet.querySelectorAll('table');

    const isContinuingVMerge = (cell) => {
      const tcPr = Array.from(cell.children).find(el => el.localName === 'tcPr');
      if (!tcPr) return false;
      const vMerge = Array.from(tcPr.children).find(el => el.localName === 'vMerge');
      return vMerge && (!vMerge.getAttribute('w:val') || vMerge.getAttribute('w:val') === 'continue');
    };

    for (let t = 0; t < htmlTables.length && t < xmlTables.length; t++) {
      const htmlTable = htmlTables[t];
      const xmlTable = xmlTables[t];

      const xmlRows = Array.from(xmlTable.children).filter(el => el.localName === 'tr');
      const htmlRows = Array.from(htmlTable.rows || htmlTable.querySelectorAll('tr'));

      for (let r = 0; r < htmlRows.length && r < xmlRows.length; r++) {
        const htmlRow = htmlRows[r];
        const xmlRow = xmlRows[r];

        let rowShdHex = null;
        const trPr = Array.from(xmlRow.children).find(el => el.localName === 'trPr');
        if (trPr) {
          const rowShd = Array.from(trPr.children).find(el => el.localName === 'shd');
          if (rowShd) {
            const fill = rowShd.getAttribute('w:fill') || rowShd.getAttribute('fill');
            if (fill && fill !== 'auto' && fill !== 'none' && fill.toUpperCase() !== 'FFFFFF') {
              rowShdHex = fill.startsWith('#') ? fill : ('#' + fill);
            }
          }
        }

        const xmlCells = Array.from(xmlRow.children).filter(el => el.localName === 'tc' && !isContinuingVMerge(el));
        const htmlCells = Array.from(htmlRow.children).filter(el => el.tagName === 'TH' || el.tagName === 'TD');

        for (let c = 0; c < htmlCells.length && c < xmlCells.length; c++) {
          const htmlCell = htmlCells[c];
          const xmlCell = xmlCells[c];

          let fillHex = rowShdHex;
          const tcPr = Array.from(xmlCell.children).find(el => el.localName === 'tcPr');
          if (tcPr) {
            const shd = Array.from(tcPr.children).find(el => el.localName === 'shd');
            if (shd) {
              const fill = shd.getAttribute('w:fill') || shd.getAttribute('fill');
              if (fill && fill !== 'auto' && fill !== 'none' && fill.toUpperCase() !== 'FFFFFF') {
                fillHex = fill.startsWith('#') ? fill : ('#' + fill);
              }
            }
          }

          if (fillHex) {
            htmlCell.style.setProperty('background-color', fillHex, 'important');
            const hexClean = fillHex.replace('#', '');
            if (hexClean.length === 6) {
              const rVal = parseInt(hexClean.substring(0, 2), 16);
              const gVal = parseInt(hexClean.substring(2, 4), 16);
              const bVal = parseInt(hexClean.substring(4, 6), 16);
              const brightness = (rVal * 299 + gVal * 587 + bVal * 114) / 1000;
              if (brightness < 135) {
                htmlCell.style.setProperty('color', '#FFFFFF', 'important');
                htmlCell.querySelectorAll('*').forEach(child => {
                  child.style.setProperty('color', '#FFFFFF', 'important');
                });
              }
            }
          }

          let align = null;
          if (tcPr) {
            const jc = Array.from(tcPr.children).find(el => el.localName === 'jc');
            if (jc) align = jc.getAttribute('w:val') || jc.getAttribute('val');
          }
          if (!align) {
            const p = Array.from(xmlCell.children).find(el => el.localName === 'p');
            if (p) {
              const pPr = Array.from(p.children).find(el => el.localName === 'pPr');
              if (pPr) {
                const jc = Array.from(pPr.children).find(el => el.localName === 'jc');
                if (jc) align = jc.getAttribute('w:val') || jc.getAttribute('val');
              }
            }
          }
          if (align) {
            if (align === 'center') htmlCell.style.textAlign = 'center';
            else if (align === 'right') htmlCell.style.textAlign = 'right';
            else if (align === 'both') htmlCell.style.textAlign = 'justify';
          }

          if (tcPr) {
            const vAlign = Array.from(tcPr.children).find(el => el.localName === 'vAlign');
            if (vAlign) {
              const vVal = vAlign.getAttribute('w:val') || vAlign.getAttribute('val');
              if (vVal === 'center') htmlCell.style.verticalAlign = 'middle';
              else if (vVal === 'bottom') htmlCell.style.verticalAlign = 'bottom';
              else if (vVal === 'top') htmlCell.style.verticalAlign = 'top';
            }
          }
        }
      }
    }
  },

  // =========================================================================
  // LEITOR NATIVO DE ARQUIVOS .DOC ANTIGOS (OLE2 WORD 97-2003, WORD 95, RTF E HTML)
  // =========================================================================

  decodeCP1252(bytes, start = 0, length = bytes.length) {
    let out = '';
    const end = Math.min(bytes.length, start + length);
    for (let i = start; i < end; i++) {
      const b = bytes[i];
      if (b >= 0x80 && b <= 0x9F) {
        const mapped = CP1252_EXTENDED_MAP[b];
        if (mapped) out += String.fromCharCode(mapped);
      } else {
        out += String.fromCharCode(b);
      }
    }
    return out;
  },

  decodeUTF16LE(bytes, start = 0, byteLength = bytes.length) {
    let out = '';
    const end = Math.min(bytes.length - 1, start + byteLength);
    for (let i = start; i < end; i += 2) {
      const code = bytes[i] | (bytes[i + 1] << 8);
      out += String.fromCharCode(code);
    }
    return out;
  },

  /**
   * Limpa códigos internos de controle do Microsoft Word (.doc) preservando parágrafos, acentos e tabelas
   */
  cleanWordExtractedText(rawText) {
    if (!rawText) return { text: '', hasComplexFormatting: false };

    let hasComplexFormatting = false;
    if (/[\x01\x08\x13\x14\x15]/.test(rawText)) {
      hasComplexFormatting = true;
    }

    let s = rawText;

    // Trata campos do Word: \x13 INSTRUÇÃO \x14 VALOR_VISÍVEL \x15 -> mantém apenas VALOR_VISÍVEL
    // (Suporta campos simples e aninhados em até 3 níveis)
    for (let pass = 0; pass < 3; pass++) {
      s = s.replace(/\x13[^\x13\x14\x15]*\x14([^\x13\x15]*)\x15/g, '$1');
      s = s.replace(/\x13[^\x13\x15]*\x15/g, '');
    }
    s = s.replace(/[\x13\x14\x15]/g, '');

    // Marcadores de tabela do Word: \r\x07 ou \x07\x07 = fim de linha; \x07 = separador de célula
    s = s.replace(/\r\x07/g, '\n');
    s = s.replace(/\x07\x07/g, '\n');
    s = s.replace(/\x07/g, '  |  ');

    // Hífens especiais e espaços não separáveis do Word
    s = s.replace(/\x1E/g, '-');
    s = s.replace(/\x1F/g, '');
    s = s.replace(/\xA0/g, ' ');

    // Quebras de linha, parágrafo (\r = 0x0D), quebra suave (\x0B) e quebra de página (\x0C)
    s = s.replace(/\r\n/g, '\n');
    s = s.replace(/[\r\x0B\x0C]/g, '\n');

    // Remove caracteres de controle binários restantes e caracteres substitutos privados (exceto \n e \t)
    s = s.replace(/[\x00-\x08\x0E-\x1F\x7F\uF000-\uF8FF\uFFFD]/g, '');

    // Normaliza excesso de quebras de linha e espaços
    s = s.replace(/[ \t]+\n/g, '\n');
    s = s.replace(/\n{4,}/g, '\n\n\n');

    return {
      text: s.trim(),
      hasComplexFormatting
    };
  },

  /**
   * Parser completo de contêiner OLE2 Compound Binary (MS-CFB) + Word 97-2003 FIB & Piece Table (MS-DOC)
   */
  extractOLE2WordDocument(arrayBuffer) {
    const bytes = new Uint8Array(arrayBuffer);
    const view = new DataView(arrayBuffer);

    const sectorShift = view.getUint16(30, true);
    const miniSectorShift = view.getUint16(32, true);
    const sectorSize = 1 << sectorShift;
    const miniSectorSize = 1 << miniSectorShift;

    if (sectorSize < 512 || sectorSize > 65536) {
      throw new Error('Setor OLE2 inválido.');
    }

    const numFatSectors = view.getUint32(44, true);
    const firstDirSector = view.getUint32(48, true);
    const miniStreamCutoff = view.getUint32(56, true) || 4096;
    const firstMiniFatSector = view.getUint32(60, true);
    const numMiniFatSectors = view.getUint32(64, true);
    const firstDifatSector = view.getUint32(68, true);
    const numDifatSectors = view.getUint32(72, true);

    const maxSectors = Math.floor((bytes.length - 512) / sectorSize);
    const sectorOffset = (secId) => 512 + secId * sectorSize;

    // 1. Coleta lista de setores da FAT a partir do DIFAT no cabeçalho (109 entradas) + cadeia DIFAT
    const fatSectorIds = [];
    for (let i = 0; i < 109 && fatSectorIds.length < numFatSectors; i++) {
      const sid = view.getUint32(76 + i * 4, true);
      if (sid < 0xFFFFFFFC) fatSectorIds.push(sid);
    }

    let difatSec = firstDifatSector;
    const entriesPerDifat = (sectorSize >>> 2) - 1;
    let difatGuard = 0;
    while (difatSec < 0xFFFFFFFC && difatGuard < numDifatSectors && fatSectorIds.length < numFatSectors) {
      difatGuard++;
      const base = sectorOffset(difatSec);
      if (base + sectorSize > bytes.length) break;
      for (let i = 0; i < entriesPerDifat && fatSectorIds.length < numFatSectors; i++) {
        const sid = view.getUint32(base + i * 4, true);
        if (sid < 0xFFFFFFFC) fatSectorIds.push(sid);
      }
      difatSec = view.getUint32(base + entriesPerDifat * 4, true);
    }

    // 2. Monta tabela FAT unificada
    const intsPerSector = sectorSize >>> 2;
    const fat = new Uint32Array(fatSectorIds.length * intsPerSector);
    for (let i = 0; i < fatSectorIds.length; i++) {
      const base = sectorOffset(fatSectorIds[i]);
      if (base + sectorSize > bytes.length) continue;
      for (let j = 0; j < intsPerSector; j++) {
        fat[i * intsPerSector + j] = view.getUint32(base + j * 4, true);
      }
    }

    const readSectorChain = (startSec, exactSize = null) => {
      const chunks = [];
      let total = 0;
      let sec = startSec;
      const visited = new Set();
      while (sec < 0xFFFFFFFC && sec <= maxSectors && !visited.has(sec)) {
        visited.add(sec);
        const off = sectorOffset(sec);
        if (off >= bytes.length) break;
        const sliceEnd = Math.min(bytes.length, off + sectorSize);
        chunks.push(bytes.subarray(off, sliceEnd));
        total += (sliceEnd - off);
        if (exactSize !== null && total >= exactSize) break;
        sec = sec < fat.length ? fat[sec] : 0xFFFFFFFE;
      }
      const outLen = exactSize !== null ? Math.min(total, exactSize) : total;
      const result = new Uint8Array(outLen);
      let pos = 0;
      for (const ch of chunks) {
        const toCopy = Math.min(ch.length, outLen - pos);
        if (toCopy <= 0) break;
        result.set(ch.subarray(0, toCopy), pos);
        pos += toCopy;
      }
      return result;
    };

    // 3. Lê entradas de Diretório (128 bytes cada)
    const dirStream = readSectorChain(firstDirSector);
    const dirView = new DataView(dirStream.buffer, dirStream.byteOffset, dirStream.byteLength);
    const entries = new Map();
    let rootEntry = null;

    for (let off = 0; off + 128 <= dirStream.length; off += 128) {
      const objType = dirStream[off + 66];
      if (objType === 0) continue; // Entrada vazia
      const nameByteLen = dirView.getUint16(off + 64, true);
      if (nameByteLen < 2 || nameByteLen > 64) continue;
      const name = this.decodeUTF16LE(dirStream, off, nameByteLen - 2);
      const startSec = dirView.getUint32(off + 116, true);
      const streamSize = dirView.getUint32(off + 120, true);
      const entryObj = { name, objType, startSec, streamSize };
      if (objType === 5 && !rootEntry) rootEntry = entryObj;
      entries.set(name, entryObj);
    }

    // Suporte a MiniStream (para streams menores que 4096 bytes como 1Table pequenas)
    let miniStream = null;
    let miniFat = null;
    if (rootEntry && rootEntry.startSec < 0xFFFFFFFC && firstMiniFatSector < 0xFFFFFFFC && numMiniFatSectors > 0) {
      miniStream = readSectorChain(rootEntry.startSec, rootEntry.streamSize || null);
      const miniFatBytes = readSectorChain(firstMiniFatSector);
      const mfView = new DataView(miniFatBytes.buffer, miniFatBytes.byteOffset, miniFatBytes.byteLength);
      miniFat = new Uint32Array(miniFatBytes.byteLength >>> 2);
      for (let i = 0; i < miniFat.length; i++) {
        miniFat[i] = mfView.getUint32(i * 4, true);
      }
    }

    const readEntryStream = (entry) => {
      if (!entry || entry.streamSize === 0) return new Uint8Array(0);
      if (entry.streamSize < miniStreamCutoff && miniStream && miniFat) {
        const out = new Uint8Array(entry.streamSize);
        let pos = 0;
        let msec = entry.startSec;
        const visited = new Set();
        while (msec < 0xFFFFFFFC && !visited.has(msec) && pos < entry.streamSize) {
          visited.add(msec);
          const mOff = msec * miniSectorSize;
          if (mOff >= miniStream.length) break;
          const copyLen = Math.min(miniSectorSize, miniStream.length - mOff, entry.streamSize - pos);
          out.set(miniStream.subarray(mOff, mOff + copyLen), pos);
          pos += copyLen;
          msec = msec < miniFat.length ? miniFat[msec] : 0xFFFFFFFE;
        }
        return out;
      }
      return readSectorChain(entry.startSec, entry.streamSize);
    };

    const wordEntry = entries.get('WordDocument');
    if (!wordEntry) {
      return this.extractFallbackPrintableFromStreams(entries, readEntryStream);
    }

    const wordStream = readEntryStream(wordEntry);
    if (wordStream.length < 64) {
      throw new Error('Stream WordDocument incompleto.');
    }

    const wordView = new DataView(wordStream.buffer, wordStream.byteOffset, wordStream.byteLength);
    const nFib = wordView.getUint16(2, true);
    const flags = wordView.getUint16(10, true);
    const isEncrypted = (flags & 0x0100) !== 0;

    if (isEncrypted) {
      return {
        text: '',
        isEncrypted: true,
        hasComplexFormatting: true
      };
    }

    // 4A. Word 97-2003 (nFib >= 0x00C0): Extração exata via Piece Table (Clx -> Pcdt -> PlcPcd)
    const tableStreamName = (flags & 0x0200) !== 0 ? '1Table' : '0Table';
    const tableEntry = entries.get(tableStreamName) || entries.get('1Table') || entries.get('0Table');

    if (nFib >= 0x00B5 && tableEntry && wordStream.length >= 160) {
      try {
        const csw = wordView.getUint16(32, true);
        const cslwOffset = 34 + csw * 2;
        const cslw = wordView.getUint16(cslwOffset, true);
        const rgLwOffset = cslwOffset + 2;

        const ccpText = wordView.getInt32(rgLwOffset + 12, true);
        const ccpFtn = wordView.getInt32(rgLwOffset + 16, true);
        const ccpHdd = wordView.getInt32(rgLwOffset + 20, true);
        const totalDesiredChars = Math.max(0, ccpText) + Math.max(0, ccpFtn) + Math.max(0, ccpHdd);

        const cbRgFcLcbOffset = rgLwOffset + cslw * 4;
        const cbRgFcLcb = wordView.getUint16(cbRgFcLcbOffset, true);
        const rgFcLcbOffset = cbRgFcLcbOffset + 2;

        if (cbRgFcLcb > 33 && rgFcLcbOffset + 34 * 8 <= wordStream.length) {
          const fcClx = wordView.getUint32(rgFcLcbOffset + 33 * 8, true);
          const lcbClx = wordView.getUint32(rgFcLcbOffset + 33 * 8 + 4, true);
          const tableStream = readEntryStream(tableEntry);

          if (lcbClx > 0 && fcClx + lcbClx <= tableStream.length) {
            const clx = tableStream.subarray(fcClx, fcClx + lcbClx);
            const clxView = new DataView(clx.buffer, clx.byteOffset, clx.byteLength);

            let pos = 0;
            while (pos < clx.length && clx[pos] === 0x01) {
              const cbGrpprl = clxView.getUint16(pos + 1, true);
              pos += 3 + cbGrpprl;
            }

            if (pos < clx.length && clx[pos] === 0x02) {
              const lcbPcdt = clxView.getUint32(pos + 1, true);
              const plcStart = pos + 5;
              const pieceCount = Math.floor((lcbPcdt - 4) / 12);

              if (pieceCount > 0 && plcStart + lcbPcdt <= clx.length) {
                let rawCombined = '';
                for (let i = 0; i < pieceCount; i++) {
                  const cpStart = clxView.getInt32(plcStart + i * 4, true);
                  const cpEnd = clxView.getInt32(plcStart + (i + 1) * 4, true);
                  const charCount = cpEnd - cpStart;
                  if (charCount <= 0) continue;

                  const pcdOffset = plcStart + (pieceCount + 1) * 4 + i * 8;
                  const fcRaw = clxView.getUint32(pcdOffset + 2, true);
                  const isCompressed = (fcRaw & 0x40000000) !== 0;

                  if (isCompressed) {
                    const byteOffset = (fcRaw & 0x3FFFFFFF) >>> 1;
                    rawCombined += this.decodeCP1252(wordStream, byteOffset, charCount);
                  } else {
                    const byteOffset = (fcRaw & 0x3FFFFFFF);
                    rawCombined += this.decodeUTF16LE(wordStream, byteOffset, charCount * 2);
                  }
                }

                // Restringe ao texto principal + notas/cabeçalhos para evitar metadados internos finais
                const mainSlice = ccpText > 0
                  ? rawCombined.substring(0, totalDesiredChars > 0 ? totalDesiredChars : ccpText)
                  : rawCombined;

                const cleaned = this.cleanWordExtractedText(mainSlice);
                if (cleaned.text.length > 0) {
                  return {
                    text: cleaned.text,
                    isEncrypted: false,
                    hasComplexFormatting: cleaned.hasComplexFormatting || (flags & 0x0004) !== 0
                  };
                }
              }
            }
          }
        }
      } catch (pieceErr) {
        console.warn('Fallback na leitura PieceTable do .doc:', pieceErr);
      }
    }

    // 4B. Word 6.0 / Word 95 ou fallback direto por fcMin..fcMac no WordDocument stream
    const fcMin = wordView.getUint32(24, true);
    const fcMac = wordView.getUint32(28, true);
    if (fcMin > 0 && fcMac > fcMin && fcMac <= wordStream.length) {
      // Verifica se o intervalo está em UTF-16LE (muitos bytes nulos intercalados) ou CP1252
      let zeroOdd = 0;
      const sampleLen = Math.min(200, fcMac - fcMin);
      for (let i = 1; i < sampleLen; i += 2) {
        if (wordStream[fcMin + i] === 0) zeroOdd++;
      }
      const rawStr = (sampleLen >= 20 && zeroOdd > sampleLen * 0.35)
        ? this.decodeUTF16LE(wordStream, fcMin, fcMac - fcMin)
        : this.decodeCP1252(wordStream, fcMin, fcMac - fcMin);
      const cleaned = this.cleanWordExtractedText(rawStr);
      if (cleaned.text.length > 0) {
        return {
          text: cleaned.text,
          isEncrypted: false,
          hasComplexFormatting: true
        };
      }
    }

    // 4C. Fallback heurístico limpo sobre o WordDocument stream
    return this.extractCleanSegmentsFromBinary(wordStream);
  },

  extractFallbackPrintableFromStreams(entries, readEntryStream) {
    let combined = [];
    for (const [name, entry] of entries.entries()) {
      if (entry.objType !== 2) continue;
      if (name.includes('SummaryInformation') || name.includes('CompObj') || name.includes('Data')) continue;
      const streamBytes = readEntryStream(entry);
      const res = this.extractCleanSegmentsFromBinary(streamBytes);
      if (res.text) combined.push(res.text);
    }
    return {
      text: combined.join('\n\n').trim(),
      isEncrypted: false,
      hasComplexFormatting: true
    };
  },

  /**
   * Extrai apenas blocos reais de texto humano (UTF-16LE e CP1252), descartando rigorosamente lixo binário
   */
  extractCleanSegmentsFromBinary(bytes) {
    const blocks = [];

    // 1. Varre sequências UTF-16LE legíveis (mínimo 8 caracteres consecutivos válidos)
    let u16Buf = '';
    for (let i = 0; i + 1 < bytes.length; i += 2) {
      const code = bytes[i] | (bytes[i + 1] << 8);
      if (
        code === 9 || code === 10 || code === 13 ||
        (code >= 32 && code <= 126) ||
        (code >= 160 && code <= 0x024F) ||
        (code >= 0x2010 && code <= 0x2027)
      ) {
        u16Buf += String.fromCharCode(code);
      } else {
        if (u16Buf.trim().length >= 12 && /[a-zA-ZÀ-ÿ]{3,}/.test(u16Buf)) {
          blocks.push(u16Buf.trim());
        }
        u16Buf = '';
      }
    }
    if (u16Buf.trim().length >= 12 && /[a-zA-ZÀ-ÿ]{3,}/.test(u16Buf)) {
      blocks.push(u16Buf.trim());
    }

    // 2. Se não encontrou blocos UTF-16LE significativos, varre sequências CP1252 com filtro de entropia humana
    if (blocks.join(' ').length < 60) {
      let ansiBuf = '';
      for (let i = 0; i < bytes.length; i++) {
        const b = bytes[i];
        if (b === 9 || b === 10 || b === 13 || (b >= 32 && b <= 126) || (b >= 192 && b <= 255)) {
          ansiBuf += String.fromCharCode(b);
        } else {
          const trimmed = ansiBuf.trim();
          if (trimmed.length >= 14 && /[a-zA-ZÀ-ÿ]{4,}/.test(trimmed)) {
            const lettersSpaces = (trimmed.match(/[a-zA-ZÀ-ÿ0-9\s.,;:!?()/-]/g) || []).length;
            if (lettersSpaces / trimmed.length >= 0.82) {
              blocks.push(trimmed);
            }
          }
          ansiBuf = '';
        }
      }
      const trimmedEnd = ansiBuf.trim();
      if (trimmedEnd.length >= 14 && /[a-zA-ZÀ-ÿ]{4,}/.test(trimmedEnd)) {
        blocks.push(trimmedEnd);
      }
    }

    const cleaned = this.cleanWordExtractedText(blocks.join('\n\n'));
    return {
      text: cleaned.text,
      isEncrypted: false,
      hasComplexFormatting: true
    };
  },

  /**
   * Extrai texto limpo de arquivos RTF (frequentemente salvos com extensão .doc)
   */
  extractRTFText(bytes) {
    const raw = this.decodeCP1252(bytes, 0, bytes.length);
    const skipDestinations = new Set([
      'fonttbl', 'colortbl', 'stylesheet', 'info', 'pict', 'object',
      'header', 'footer', 'footnote', 'xmlnstbl', 'listtable', 'listoverridetable', 'rsidtbl', 'generator'
    ]);

    let out = '';
    let i = 0;
    const len = raw.length;
    const stack = [];
    let ignoreDepth = -1;
    let ucSkip = 1;

    while (i < len) {
      const ch = raw[i];
      if (ch === '{') {
        stack.push(ucSkip);
        // Verifica destino {\*\...}
        if (raw.substring(i + 1, i + 4) === '\\*\\' && ignoreDepth === -1) {
          ignoreDepth = stack.length;
        }
        i++;
      } else if (ch === '}') {
        if (ignoreDepth === stack.length) {
          ignoreDepth = -1;
        }
        ucSkip = stack.pop() || 1;
        i++;
      } else if (ch === '\\') {
        i++;
        if (i >= len) break;
        const next = raw[i];
        if (next === '\\' || next === '{' || next === '}') {
          if (ignoreDepth === -1) out += next;
          i++;
        } else if (next === '\'') {
          // Escape hexadecimal CP1252 \'xx
          const hex = raw.substring(i + 1, i + 3);
          const code = parseInt(hex, 16);
          if (!isNaN(code) && ignoreDepth === -1) {
            const mapped = CP1252_EXTENDED_MAP[code] || code;
            out += String.fromCharCode(mapped);
          }
          i += 3;
        } else if (next === '\n' || next === '\r') {
          if (ignoreDepth === -1) out += '\n';
          i++;
        } else if (next === '~') {
          if (ignoreDepth === -1) out += ' ';
          i++;
        } else if (next === '-') {
          i++;
        } else {
          // Palavra de controle \wordN
          const m = raw.substring(i).match(/^([a-zA-Z]+)(-?\d+)? ?/);
          if (m) {
            const word = m[1].toLowerCase();
            const param = m[2] !== undefined ? parseInt(m[2], 10) : null;
            i += m[0].length;

            if (skipDestinations.has(word) && ignoreDepth === -1) {
              ignoreDepth = stack.length;
            } else if (ignoreDepth === -1) {
              if (word === 'par' || word === 'line' || word === 'row') {
                out += '\n';
              } else if (word === 'tab' || word === 'cell') {
                out += '  ';
              } else if (word === 'uc' && param !== null) {
                ucSkip = Math.max(0, param);
              } else if (word === 'u' && param !== null) {
                const codePoint = param < 0 ? param + 65536 : param;
                out += String.fromCharCode(codePoint);
                // Pula caracteres substitutos ANSI após \uN
                let skipped = 0;
                while (skipped < ucSkip && i < len) {
                  if (raw.substring(i, i + 2) === "\\'") {
                    i += 4;
                  } else {
                    i++;
                  }
                  skipped++;
                }
              }
            }
          } else {
            i++;
          }
        }
      } else if (ch === '\r' || ch === '\n') {
        i++;
      } else {
        if (ignoreDepth === -1) out += ch;
        i++;
      }
    }

    return this.cleanWordExtractedText(out).text;
  },

  escapeHTML(str) {
    return String(str || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  },

  formatPlainParagraphsToHTML(cleanText) {
    const paragraphs = String(cleanText || '').split(/\n{2,}/);
    return paragraphs
      .map(p => {
        const trimmed = p.trim();
        if (!trimmed) return '';
        const escaped = this.escapeHTML(trimmed).replace(/\n/g, '<br>');
        return `<p style="margin: 0 0 12px 0; text-align: justify;">${escaped}</p>`;
      })
      .filter(Boolean)
      .join('');
  },

  async renderDOC(file, preloadedBuffer = null) {
    try {
      const name = (file && file.name ? file.name : '').toLowerCase();
      if (name.endsWith('.txt')) {
        const text = await file.text();
        const escaped = this.escapeHTML(text);
        await this.renderVirtualDocSheet(`<div style="white-space: pre-wrap; font-family: monospace; font-size: 13px;">${escaped}</div>`);
        return;
      }

      const buffer = preloadedBuffer || await file.arrayBuffer();
      const bytes = new Uint8Array(buffer);
      const sig = this.detectBinarySignature(bytes);

      // Se for na verdade um arquivo .docx (ZIP) salvo com extensão .doc, usa Mammoth
      if (sig === 'zip') {
        this.fileType = 'docx';
        await this.renderDOCX(file);
        return;
      }

      // 1. Documento RTF salvo como .doc ou .rtf
      if (sig === 'rtf') {
        const rtfText = this.extractRTFText(bytes);
        await this.renderVirtualDocSheet(`
          <div style="background: #EFF6FF; border: 1px solid #BFDBFE; border-radius: 5px; padding: 8px 12px; margin-bottom: 18px; font-family: Inter, sans-serif; font-size: 12px; color: #1E3A8A;">
            <strong>📄 ${this.escapeHTML(file.name)}</strong> — Formato Rich Text (.rtf/.doc) convertido com extração limpa.
          </div>
          <div style="font-family: 'Times New Roman', serif; font-size: 14px; line-height: 1.65;">
            ${this.formatPlainParagraphsToHTML(rtfText)}
          </div>
        `);
        return;
      }

      // 2. Documento HTML / Word XML salvo como .doc
      if (sig === 'html_doc') {
        const decoder = new TextDecoder('utf-8', { fatal: false });
        const rawHtml = decoder.decode(bytes);
        const parser = new DOMParser();
        const parsedDoc = parser.parseFromString(rawHtml, 'text/html');
        parsedDoc.querySelectorAll('script, style, meta, link, xml, title').forEach(el => el.remove());
        const safeBodyText = parsedDoc.body ? parsedDoc.body.innerText : rawHtml;
        await this.renderVirtualDocSheet(`
          <div style="background: #EFF6FF; border: 1px solid #BFDBFE; border-radius: 5px; padding: 8px 12px; margin-bottom: 18px; font-family: Inter, sans-serif; font-size: 12px; color: #1E3A8A;">
            <strong>📄 ${this.escapeHTML(file.name)}</strong> — Documento Word Web/XML (.doc) extraído.
          </div>
          <div style="font-family: 'Times New Roman', serif; font-size: 14px; line-height: 1.65;">
            ${this.formatPlainParagraphsToHTML(safeBodyText)}
          </div>
        `);
        return;
      }

      // 3. Documento Binário OLE2 Word 97-2003 (Assinatura D0 CF 11 E0)
      if (sig === 'ole2') {
        const result = this.extractOLE2WordDocument(buffer);

        if (result.isEncrypted) {
          await this.renderVirtualDocSheet(`
            <div style="background: #FEF2F2; border: 1px solid #FCA5A5; border-radius: 6px; padding: 16px; font-family: Inter, sans-serif; font-size: 13px; color: #991B1B;">
              <strong>🔒 Arquivo .doc protegido por senha ou criptografia proprietária:</strong><br>
              O arquivo <strong>${this.escapeHTML(file.name)}</strong> utiliza criptografia binária do Word 97-2003 e não pode ser lido sem desbloqueio. Solicite ao pesquisador o envio em formato <strong>PDF</strong> conforme a Norma Operacional CNS nº 001/2013.
            </div>
          `);
          return;
        }

        const complexWarningBanner = result.hasComplexFormatting
          ? `<div style="margin-top: 6px; padding-top: 6px; border-top: 1px dashed #FCD34D; color: #92400E; font-size: 11.5px;">
               ⚠️ <strong>Nota sobre formato proprietário:</strong> Este arquivo contém estruturas binárias complexas do Word 97-2003 (campos, tabelas ou objetos embutidos). O texto foi extraído e higienizado sem códigos binários; para inspeção visual idêntica ao layout original, recomenda-se a submissão em PDF (Norma Operacional CNS nº 001/2013).
             </div>`
          : '';

        const bodyHtml = result.text
          ? this.formatPlainParagraphsToHTML(result.text.substring(0, 600000))
          : `<p style="color: #6B7280; font-style: italic;">Não foi localizado texto legível no fluxo principal deste arquivo binário .doc (o documento pode conter apenas imagens digitalizadas embutidas).</p>`;

        await this.renderVirtualDocSheet(`
          <div style="background: #FEF9EE; border: 1px solid #FCD34D; border-left: 4px solid #D97706; border-radius: 5px; padding: 10px 14px; margin-bottom: 20px; font-family: Inter, sans-serif; font-size: 12px; color: #78350F; line-height: 1.45;">
            <div><strong>📄 ${this.escapeHTML(file.name)}</strong> — Documento Word 97-2003 (<code>.doc</code> binário OLE2)</div>
            ${complexWarningBanner}
          </div>
          <div style="font-family: 'Times New Roman', serif; font-size: 14px; line-height: 1.65;">
            ${bodyHtml}
          </div>
        `);
        return;
      }

      // 4. Fallback texto simples / codificação legada limpa
      const cleanRes = this.extractCleanSegmentsFromBinary(bytes);
      await this.renderVirtualDocSheet(`
        <div style="border-bottom: 1px solid #ccc; padding-bottom: 8px; margin-bottom: 16px; font-family: Inter, sans-serif; font-size: 12px; color: #555;">
          <strong>Documento:</strong> ${this.escapeHTML(file.name)}
        </div>
        <div style="font-family: 'Times New Roman', serif; font-size: 14px; line-height: 1.65;">
          ${this.formatPlainParagraphsToHTML(cleanRes.text)}
        </div>
      `);
    } catch (err) {
      console.error('Erro ao processar arquivo .doc:', err);
      this.renderUnsupported(file);
    }
  },

  async renderImage(file) {
    const url = URL.createObjectURL(file);
    const wrapper = document.createElement('div');
    wrapper.style.display = 'flex';
    wrapper.style.alignItems = 'center';
    wrapper.style.justifyContent = 'center';
    wrapper.style.minHeight = '100%';
    wrapper.style.padding = '16px';

    const img = document.createElement('img');
    img.src = url;
    img.style.maxWidth = '100%';
    img.style.boxShadow = '4px 4px 0px rgba(0,0,0,0.5)';
    img.style.border = '1px solid #000';
    img.style.backgroundColor = '#fff';
    img.style.transition = 'transform 0.15s ease';
    img.style.transform = `scale(${this.zoomScale}) rotate(${this.rotation}deg)`;

    wrapper.appendChild(img);
    this.containerEl.innerHTML = '';
    this.containerEl.appendChild(wrapper);
  },

  renderUnsupported(file) {
    const safeName = file && file.name ? this.escapeHTML(file.name) : 'Documento';
    this.containerEl.innerHTML = `
      <div style="padding: 32px; background: #ffffff; border: 2px solid #000000; text-align: center; max-width: 480px; margin: 40px auto;">
        <p style="font-weight: bold; font-size: 14px; margin-bottom: 8px;">📄 ${safeName}</p>
        <p style="font-size: 12px; color: #444;">Formato de arquivo pronto para arquivamento e renomeação padronizada.</p>
      </div>
    `;
  },

  normalizeString(str) {
    if (!str) return '';
    let res = str;
    if (!this.caseSensitive) {
      res = res.toLowerCase();
    }
    if (!this.accentSensitive) {
      res = res.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    }
    return res;
  },

  highlightHTMLText(rootElement) {
    this.matchElements = [];
    this.totalMatches = 0;
    const rawTerm = this.searchTerm.trim();
    if (!rawTerm) return;

    const normalizedQuery = this.normalizeString(rawTerm);
    if (!normalizedQuery) return;

    const textNodes = [];
    const walk = (node) => {
      if (node.nodeType === 3) {
        if (node.nodeValue && node.nodeValue.trim()) {
          textNodes.push(node);
        }
      } else if (node.nodeType === 1 && !['SCRIPT', 'STYLE', 'MARK'].includes(node.nodeName)) {
        for (let i = 0; i < node.childNodes.length; i++) {
          walk(node.childNodes[i]);
        }
      }
    };
    walk(rootElement);

    textNodes.forEach(node => {
      const originalText = node.nodeValue;
      const normText = this.normalizeString(originalText);
      const idx = normText.indexOf(normalizedQuery);
      if (idx !== -1) {
        const frag = document.createDocumentFragment();
        let lastIdx = 0;
        let searchPos = idx;

        while (searchPos !== -1) {
          if (searchPos > lastIdx) {
            frag.appendChild(document.createTextNode(originalText.substring(lastIdx, searchPos)));
          }
          const mark = document.createElement('mark');
          mark.textContent = originalText.substring(searchPos, searchPos + rawTerm.length);
          frag.appendChild(mark);
          this.matchElements.push(mark);

          lastIdx = searchPos + rawTerm.length;
          searchPos = normText.indexOf(normalizedQuery, lastIdx);
        }

        if (lastIdx < originalText.length) {
          frag.appendChild(document.createTextNode(originalText.substring(lastIdx)));
        }

        node.parentNode.replaceChild(frag, node);
      }
    });

    this.totalMatches = this.matchElements.length;
    if (this.totalMatches > 0) {
      this.currentMatchIndex = 1;
      this.focusMatch(0);
    } else {
      this.currentMatchIndex = 0;
    }
  },

  focusMatch(index) {
    if (!this.matchElements || this.matchElements.length === 0) return;
    this.matchElements.forEach(el => {
      el.style.outline = '1px solid #b45309';
      el.style.backgroundColor = '#ffff00';
    });
    const target = this.matchElements[index];
    if (target) {
      target.style.outline = '2px solid #000080';
      target.style.backgroundColor = '#ff9900';
      target.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  },

  nextMatch() {
    if (this.totalMatches <= 0) return;
    this.currentMatchIndex = (this.currentMatchIndex % this.totalMatches) + 1;
    this.focusMatch(this.currentMatchIndex - 1);
  },

  prevMatch() {
    if (this.totalMatches <= 0) return;
    this.currentMatchIndex = this.currentMatchIndex <= 1 ? this.totalMatches : this.currentMatchIndex - 1;
    this.focusMatch(this.currentMatchIndex - 1);
  },

  async nextPage() {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
      if (this.fileType === 'pdf') await this.renderPDFPage(this.currentPage);
    }
  },

  async prevPage() {
    if (this.currentPage > 1) {
      this.currentPage--;
      if (this.fileType === 'pdf') await this.renderPDFPage(this.currentPage);
    }
  },

  zoomIn() {
    this.zoomScale = Math.min(+(this.zoomScale + 0.15).toFixed(2), 3.0);
    this.applyZoom();
  },

  zoomOut() {
    this.zoomScale = Math.max(+(this.zoomScale - 0.15).toFixed(2), 0.4);
    this.applyZoom();
  },

  zoomFit() {
    this.zoomScale = 1.0;
    this.rotation = 0;
    this.applyZoom();
  },

  rotate() {
    this.rotation = (this.rotation + 90) % 360;
    if (this.fileType === 'pdf') {
      this.renderPDFPage(this.currentPage);
    } else if (this.fileType === 'image') {
      this.applyZoom();
    }
  },

  applyZoom() {
    if (this.fileType === 'pdf') {
      this.renderPDFPage(this.currentPage);
    } else if (this.fileType === 'image') {
      const img = this.containerEl.querySelector('img');
      if (img) {
        img.style.transform = `scale(${this.zoomScale}) rotate(${this.rotation}deg)`;
      }
    } else {
      const sheet = this.containerEl.querySelector('.docx-page-sheet');
      if (sheet) {
        this.applySheetZoom(sheet);
      }
    }
  },

  applySheetZoom(sheet) {
    if (!sheet) return;
    if ('zoom' in sheet.style) {
      sheet.style.zoom = this.zoomScale;
      sheet.style.transform = 'none';
    } else {
      sheet.style.transform = `scale(${this.zoomScale})`;
      sheet.style.transformOrigin = 'top center';
    }
  },

  async search(term, caseSens = false, accentSens = false) {
    this.searchTerm = term;
    this.caseSensitive = caseSens;
    this.accentSensitive = accentSens;
    if (this.currentFile) {
      if (this.fileType === 'pdf') {
        await this.renderPDFPage(this.currentPage);
      } else {
        await this.loadDocument(this.currentFile);
      }
    }
  }
};

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { CEP_VIEWER };
}
