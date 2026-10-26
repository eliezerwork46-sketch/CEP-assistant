/**
 * VIEWER.JS
 * Motor de Renderização Multiformato de Alta Fidelidade
 * Suporta: PDF (.pdf), Word (.docx, .doc) e Imagens (.jpg, .jpeg, .png, .webp, .gif, .bmp)
 * Busca textual integrada (Ctrl+F) com navegação entre ocorrências, sensível a maiúsculas e acentos/til (~).
 */

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

    // Camada de texto selecionável e pesquisável sobre o PDF
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

        // Row-level shading if present
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

          // 1. Shading / Background Color
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

            // Text contrast adjustment for dark fills
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

          // 2. Horizontal alignment
          let align = null;
          if (tcPr) {
            const jc = Array.from(tcPr.children).find(el => el.localName === 'jc');
            if (jc) {
              align = jc.getAttribute('w:val') || jc.getAttribute('val');
            }
          }
          if (!align) {
            const p = Array.from(xmlCell.children).find(el => el.localName === 'p');
            if (p) {
              const pPr = Array.from(p.children).find(el => el.localName === 'pPr');
              if (pPr) {
                const jc = Array.from(pPr.children).find(el => el.localName === 'jc');
                if (jc) {
                  align = jc.getAttribute('w:val') || jc.getAttribute('val');
                }
              }
            }
          }
          if (align) {
            if (align === 'center') htmlCell.style.textAlign = 'center';
            else if (align === 'right') htmlCell.style.textAlign = 'right';
            else if (align === 'both') htmlCell.style.textAlign = 'justify';
          }

          // 3. Vertical alignment
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

  async renderDOC(file) {
    try {
      const name = file.name.toLowerCase();
      if (name.endsWith('.txt')) {
        const text = await file.text();
        const escaped = text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
        this.renderVirtualDocSheet(`<div style="white-space: pre-wrap; font-family: monospace; font-size: 13px;">${escaped}</div>`);
        return;
      }

      const buffer = await file.arrayBuffer();
      const bytes = new Uint8Array(buffer);
      let extracted = '';
      for (let i = 0; i < bytes.length; i++) {
        const code = bytes[i];
        if ((code >= 32 && code <= 126) || code === 10 || code === 13 || (code >= 160 && code <= 255)) {
          extracted += String.fromCharCode(code);
        } else if (extracted.length > 0 && extracted[extracted.length - 1] !== ' ') {
          extracted += ' ';
        }
      }
      const cleanText = extracted.replace(/\s{4,}/g, '\n\n').trim();
      const escaped = cleanText.substring(0, 500000).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
      this.renderVirtualDocSheet(`
        <div style="border-bottom: 1px solid #ccc; padding-bottom: 8px; margin-bottom: 16px; font-family: Tahoma, sans-serif; font-size: 12px; color: #555;">
          <strong>Documento:</strong> ${file.name}
        </div>
        <div style="white-space: pre-wrap; font-family: 'Times New Roman', serif; font-size: 14px; line-height: 1.6;">${escaped}</div>
      `);
    } catch (err) {
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
    this.containerEl.innerHTML = `
      <div style="padding: 32px; background: #ffffff; border: 2px solid #000000; text-align: center; max-width: 480px; margin: 40px auto;">
        <p style="font-weight: bold; font-size: 14px; margin-bottom: 8px;">📄 ${file ? file.name : 'Documento'}</p>
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
