/**
 * STORAGE.JS
 * Gestão de Arquivos Locais, File System Access API, Versionamento SHA-256,
 * Camada de Migração Não-Destrutiva (Schema v2) e Persistência no Navegador
 */

const CEP_STORAGE = {
  SCHEMA_VERSION: 2,
  dbName: 'CEP_Assistant_DB',
  storeName: 'DirectoryHandles',
  dirHandle: null,

  /**
   * Inicializa o banco IndexedDB para armazenar o handle do diretório
   */
  async getIDB() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, 1);
      request.onupgradeneeded = (e) => {
        const db = e.target.result;
        if (!db.objectStoreNames.contains(this.storeName)) {
          db.createObjectStore(this.storeName);
        }
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  },

  /**
   * Salva a referência do diretório no IndexedDB
   */
  async saveStoredDirectoryHandle(handle) {
    try {
      const db = await this.getIDB();
      const tx = db.transaction(this.storeName, 'readwrite');
      tx.objectStore(this.storeName).put(handle, 'rootDirectory');
      return new Promise((resolve) => {
        tx.oncomplete = () => resolve(true);
      });
    } catch (err) {
      console.warn('Não foi possível armazenar o handle no IndexedDB:', err);
      return false;
    }
  },

  /**
   * Recupera a referência do diretório salva no IndexedDB
   */
  async getStoredDirectoryHandle() {
    try {
      const db = await this.getIDB();
      const tx = db.transaction(this.storeName, 'readonly');
      const req = tx.objectStore(this.storeName).get('rootDirectory');
      return new Promise((resolve) => {
        req.onsuccess = () => resolve(req.result || null);
        req.onerror = () => resolve(null);
      });
    } catch (err) {
      return null;
    }
  },

  /**
   * Solicita ao usuário a seleção da pasta de trabalho (via showDirectoryPicker)
   */
  async selectDirectory() {
    if (!window.showDirectoryPicker) {
      throw new Error('Seu navegador não suporta a File System Access API. Recomendamos o Google Chrome ou Microsoft Edge.');
    }
    const handle = await window.showDirectoryPicker({
      id: 'cep_workspace_folder',
      mode: 'readwrite'
    });
    this.dirHandle = handle;
    await this.saveStoredDirectoryHandle(handle);
    return handle;
  },

  /**
   * Tenta reconectar à pasta memorizada no navegador
   */
  async reconnectStoredDirectory() {
    const handle = await this.getStoredDirectoryHandle();
    if (!handle) return null;

    const options = { mode: 'readwrite' };
    if ((await handle.queryPermission(options)) === 'granted') {
      this.dirHandle = handle;
      return handle;
    }
    if ((await handle.requestPermission(options)) === 'granted') {
      this.dirHandle = handle;
      return handle;
    }
    return null;
  },

  // =========================================================================
  // HASH SHA-256 INFALÍVEL (Web Crypto API + Fallback FIPS 180-4 p/ file://)
  // =========================================================================

  /**
   * Calcula o hash SHA-256 hexadecimal (64 caracteres) de um File ou ArrayBuffer
   */
  async computeSHA256(fileOrBuffer) {
    let arrayBuffer;
    if (fileOrBuffer instanceof ArrayBuffer) {
      arrayBuffer = fileOrBuffer;
    } else if (ArrayBuffer.isView(fileOrBuffer)) {
      arrayBuffer = fileOrBuffer.buffer.slice(fileOrBuffer.byteOffset, fileOrBuffer.byteOffset + fileOrBuffer.byteLength);
    } else if (fileOrBuffer && typeof fileOrBuffer.arrayBuffer === 'function') {
      arrayBuffer = await fileOrBuffer.arrayBuffer();
    } else {
      throw new Error('Entrada inválida para cálculo de hash SHA-256.');
    }

    if (typeof crypto !== 'undefined' && crypto.subtle && typeof crypto.subtle.digest === 'function') {
      const digestBuf = await crypto.subtle.digest('SHA-256', arrayBuffer);
      const bytes = new Uint8Array(digestBuf);
      let hex = '';
      for (let i = 0; i < bytes.length; i++) {
        hex += bytes[i].toString(16).padStart(2, '0');
      }
      return hex;
    }

    // Fallback puro FIPS 180-4 SHA-256 caso executado localmente via protocolo file:// sem contexto seguro
    return this._sha256PureJS(new Uint8Array(arrayBuffer));
  },

  _sha256PureJS(bytes) {
    const K = [
      0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
      0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
      0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
      0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
      0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
      0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
      0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
      0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2
    ];
    let h0 = 0x6a09e667, h1 = 0xbb67ae85, h2 = 0x3c6ef372, h3 = 0xa54ff53a;
    let h4 = 0x510e527f, h5 = 0x9b05688c, h6 = 0x1f83d9ab, h7 = 0x5be0cd19;

    const bitLen = bytes.length * 8;
    const padLen = ((bytes.length + 9 + 63) & ~63);
    const padded = new Uint8Array(padLen);
    padded.set(bytes);
    padded[bytes.length] = 0x80;
    const view = new DataView(padded.buffer);
    view.setUint32(padLen - 8, Math.floor(bitLen / 0x100000000), false);
    view.setUint32(padLen - 4, bitLen >>> 0, false);

    const w = new Uint32Array(64);
    const rotr = (n, x) => (x >>> n) | (x << (32 - n));

    for (let offset = 0; offset < padLen; offset += 64) {
      for (let i = 0; i < 16; i++) {
        w[i] = view.getUint32(offset + i * 4, false);
      }
      for (let i = 16; i < 64; i++) {
        const s0 = rotr(7, w[i - 15]) ^ rotr(18, w[i - 15]) ^ (w[i - 15] >>> 3);
        const s1 = rotr(17, w[i - 2]) ^ rotr(19, w[i - 2]) ^ (w[i - 2] >>> 10);
        w[i] = (w[i - 16] + s0 + w[i - 7] + s1) >>> 0;
      }
      let a = h0, b = h1, c = h2, d = h3, e = h4, f = h5, g = h6, h = h7;
      for (let i = 0; i < 64; i++) {
        const S1 = rotr(6, e) ^ rotr(11, e) ^ rotr(25, e);
        const ch = (e & f) ^ ((~e) & g);
        const temp1 = (h + S1 + ch + K[i] + w[i]) >>> 0;
        const S0 = rotr(2, a) ^ rotr(13, a) ^ rotr(22, a);
        const maj = (a & b) ^ (a & c) ^ (b & c);
        const temp2 = (S0 + maj) >>> 0;
        h = g; g = f; f = e; e = (d + temp1) >>> 0;
        d = c; c = b; b = a; a = (temp1 + temp2) >>> 0;
      }
      h0 = (h0 + a) >>> 0; h1 = (h1 + b) >>> 0; h2 = (h2 + c) >>> 0; h3 = (h3 + d) >>> 0;
      h4 = (h4 + e) >>> 0; h5 = (h5 + f) >>> 0; h6 = (h6 + g) >>> 0; h7 = (h7 + h) >>> 0;
    }

    return [h0, h1, h2, h3, h4, h5, h6, h7]
      .map(v => v.toString(16).padStart(8, '0'))
      .join('');
  },

  generateDocId(seed = '') {
    const rand = Math.random().toString(36).substring(2, 8);
    const cleanSeed = seed ? this.sanitizeFileName(seed, 16) : 'doc';
    return `doc_${Date.now()}_${cleanSeed}_${rand}`;
  },

  // =========================================================================
  // CAMADA DE MIGRAÇÃO AUTOMÁTICA E NÃO-DESTRUTIVA (COMPATIBILIDADE 100% v1->v2)
  // =========================================================================

  /**
   * Normaliza o valor de relator (preserva nomes reais e converte placeholders "Sem Relator"/"Sin Relator" em string vazia)
   */
  normalizeRelatorValue(rel) {
    if (!rel || typeof rel !== 'string') return '';
    const trimmed = rel.trim();
    if (!trimmed) return '';
    const lower = trimmed.toLowerCase();
    if (lower === 'sem relator' || lower === 'sin relator' || lower === 'sem relator atribuído' || lower === 'não atribuído' || lower === '—') {
      return '';
    }
    return trimmed;
  },

  /**
   * Migra áreas temáticas / enquadramento legado (string única ou objeto booleano) para array areasTematicas[]
   * sem remover campos antigos para compatibilidade reversa.
   */
  migrateAreasTematicas(obj) {
    if (!obj || typeof obj !== 'object') return ['geral'];

    if (Array.isArray(obj.areasTematicas) && obj.areasTematicas.length > 0) {
      return Array.from(new Set(obj.areasTematicas.filter(Boolean)));
    }

    const areas = [];
    // Caso legado: string única em areaTematica
    if (typeof obj.areaTematica === 'string' && obj.areaTematica.trim()) {
      areas.push(obj.areaTematica.trim());
    }
    // Caso legado: objeto booleano enquadramento
    if (obj.enquadramento && typeof obj.enquadramento === 'object') {
      if (obj.enquadramento.menores) areas.push('menores');
      if (obj.enquadramento.bancoDados) areas.push('bancoDados');
      if (obj.enquadramento.indigena) areas.push('indigena');
      if (obj.enquadramento.geral && areas.length === 0) areas.push('geral');
    }
    // Caso legado: enquadramentoTipo string
    if (typeof obj.enquadramentoTipo === 'string' && obj.enquadramentoTipo.trim()) {
      const et = obj.enquadramentoTipo.trim();
      if (et === 'nenhum') {
        if (areas.length === 0) return ['nenhum'];
      } else if (!areas.includes(et)) {
        // Evita adicionar 'geral' junto com áreas específicas se veio apenas do default antigo
        if (et !== 'geral' || areas.length === 0) {
          areas.push(et);
        }
      }
    }

    return areas.length > 0 ? Array.from(new Set(areas)) : ['geral'];
  },

  /**
   * Sincroniza os campos legados (enquadramento e enquadramentoTipo) a partir de areasTematicas[]
   */
  buildLegacyEnquadramentoFromAreas(areasTematicas = []) {
    const list = Array.isArray(areasTematicas) && areasTematicas.length > 0 ? areasTematicas : ['geral'];
    const enquadramento = {
      geral: list.includes('geral'),
      menores: list.includes('menores'),
      bancoDados: list.includes('bancoDados'),
      indigena: list.includes('indigena')
    };
    const primary = list.find(a => a !== 'geral') || list[0] || 'geral';
    return {
      enquadramento,
      enquadramentoTipo: primary
    };
  },

  /**
   * Migra item de pendência selecionada (suporta documentId único legado -> documentIds[] multidocumento)
   */
  migratePendenciaItem(sp, docsMeta = [], fallbackDateISO = null) {
    if (!sp || typeof sp !== 'object') return null;
    const migrated = { ...sp };

    // Migração não-destrutiva de referência única documentId / targetDocType -> documentIds[] e targetDocTypes[]
    let docIds = [];
    if (Array.isArray(sp.documentIds)) {
      docIds = sp.documentIds.filter(Boolean);
    } else if (typeof sp.documentId === 'string' && sp.documentId.trim()) {
      docIds = [sp.documentId.trim()];
    }

    let docTypes = [];
    if (Array.isArray(sp.targetDocTypes) && sp.targetDocTypes.length > 0) {
      docTypes = sp.targetDocTypes.filter(Boolean);
    } else if (typeof sp.targetDocType === 'string' && sp.targetDocType.trim()) {
      docTypes = [sp.targetDocType.trim()];
    }

    // Se veio de versão v1 apenas com targetDocType (sem documentIds), vincula automaticamente aos docs daquele tipo
    if (docIds.length === 0 && docTypes.length > 0 && Array.isArray(docsMeta) && docsMeta.length > 0) {
      docsMeta.forEach(dm => {
        if (dm && dm.docId && docTypes.includes(dm.targetType)) {
          docIds.push(dm.docId);
        }
      });
    }

    migrated.documentIds = Array.from(new Set(docIds));
    migrated.targetDocTypes = docTypes.length > 0 ? Array.from(new Set(docTypes)) : ['Geral'];
    // Mantém propriedade legada targetDocType sincronizada
    migrated.targetDocType = migrated.targetDocTypes[0] || 'Geral';
    migrated.missingCategories = Array.isArray(sp.missingCategories) ? [...sp.missingCategories] : [];
    migrated.observacaoRelator = sp.observacaoRelator || '';
    migrated.createdAt = sp.createdAt || fallbackDateISO || new Date().toISOString();
    migrated.updatedAt = sp.updatedAt || migrated.createdAt;
    migrated.needsVerificationAfterReplace = Boolean(sp.needsVerificationAfterReplace);
    migrated.inheritedFromFile = sp.inheritedFromFile || null;

    return migrated;
  },

  /**
   * Migra registro de projeto individual em registro_cep.json sem perder dados anteriores
   */
  migrateProjectRecord(proj) {
    if (!proj || typeof proj !== 'object') return proj;
    const migrated = { ...proj };

    migrated.instituicao = proj.instituicao || '';
    migrated.pesquisador = proj.pesquisador || '';
    migrated.titulo = proj.titulo || '';
    migrated.caae = proj.caae || '';
    migrated.relator = this.normalizeRelatorValue(proj.relator);
    migrated.status = proj.status || 'em_analise';
    migrated.data_aprovacao = proj.data_aprovacao || null;
    migrated.tipoProjeto = proj.tipoProjeto || 'Projeto_Detalhado';
    migrated.areasTematicas = this.migrateAreasTematicas(proj);
    migrated.enquadramentoCustom = proj.enquadramentoCustom || '';

    const legacyEnq = this.buildLegacyEnquadramentoFromAreas(migrated.areasTematicas);
    if (!migrated.enquadramento) migrated.enquadramento = legacyEnq.enquadramento;
    if (!migrated.enquadramentoTipo) migrated.enquadramentoTipo = legacyEnq.enquadramentoTipo;

    migrated.rondas = Array.isArray(proj.rondas) ? proj.rondas.map(r => ({
      ...r,
      relator: this.normalizeRelatorValue(r.relator),
      status: r.status || 'em_analise',
      pendencias_count: typeof r.pendencias_count === 'number'
        ? r.pendencias_count
        : (Array.isArray(r.pendencias_titles) ? r.pendencias_titles.length : 0),
      pendencias_titles: Array.isArray(r.pendencias_titles) ? r.pendencias_titles : []
    })) : [];

    // Histórico de pendências (se não existir em projetos antigos, reconstrói linha base não-destrutiva das rodadas)
    if (Array.isArray(proj.pendencyHistory)) {
      migrated.pendencyHistory = proj.pendencyHistory;
    } else {
      const synthesized = [];
      migrated.rondas.forEach((r, rIdx) => {
        const rDate = (r.data || r.createdAt || migrated.data_primeira_submissao || '').split('_')[0];
        const isoStart = rDate && /^\d{4}-\d{2}-\d{2}$/.test(rDate) ? `${rDate}T12:00:00.000Z` : new Date().toISOString();
        const nextRound = migrated.rondas[rIdx + 1];
        const nextDate = nextRound ? (nextRound.data || nextRound.createdAt || '').split('_')[0] : null;
        const nextIso = nextDate && /^\d{4}-\d{2}-\d{2}$/.test(nextDate) ? `${nextDate}T11:59:59.000Z` : null;

        (r.pendencias_titles || []).forEach((pTitle, pIdx) => {
          synthesized.push({
            entryId: `legacy_${proj.id || 'proj'}_${rIdx}_${pIdx}`,
            pendenciaId: `LEGACY-${rIdx + 1}-${pIdx + 1}`,
            title: pTitle,
            categoryId: 'geral',
            documentIds: [],
            documentNames: [],
            targetDocTypes: ['Geral'],
            observacaoRelator: '',
            createdAt: isoStart,
            updatedAt: isoStart,
            resolvedAt: (nextRound && nextRound.pendencias_count === 0) ? nextIso : (migrated.status === 'aprovado' && migrated.data_aprovacao ? `${migrated.data_aprovacao}T18:00:00.000Z` : null),
            resolutionReason: (nextRound && nextRound.pendencias_count === 0) ? 'resolved_in_subsequent_round' : (migrated.status === 'aprovado' ? 'project_approved' : null),
            roundFolder: r.data || rDate,
            isLegacySynthesized: true,
            events: [{ action: 'created', at: isoStart, note: `Registrada na rodada ${r.data || rDate}` }]
          });
        });
      });
      migrated.pendencyHistory = synthesized;
    }

    return migrated;
  },

  /**
   * Migra o arquivo mestre registro_cep.json garantindo zero perda ou corrupção
   */
  migrateRegistryData(raw) {
    if (!raw || typeof raw !== 'object') {
      return {
        schemaVersion: this.SCHEMA_VERSION,
        projetos: [],
        relatores: [],
        instituicoes: [],
        reunioesOverrides: {}
      };
    }

    const migrated = { ...raw };
    migrated.schemaVersion = this.SCHEMA_VERSION;
    migrated.projetos = Array.isArray(raw.projetos)
      ? raw.projetos.map(p => this.migrateProjectRecord(p))
      : [];
    migrated.relatores = Array.isArray(raw.relatores)
      ? Array.from(new Set(raw.relatores.map(r => this.normalizeRelatorValue(r)).filter(Boolean)))
      : [];
    // Catálogo persistente de instituições: inicia vazio [] se não existir
    migrated.instituicoes = Array.isArray(raw.instituicoes)
      ? Array.from(new Set(raw.instituicoes.map(i => (typeof i === 'string' ? i.trim() : '')).filter(Boolean)))
      : [];
    migrated.reunioesOverrides = (raw.reunioesOverrides && typeof raw.reunioesOverrides === 'object' && !Array.isArray(raw.reunioesOverrides))
      ? { ...raw.reunioesOverrides }
      : {};

    return migrated;
  },

  /**
   * Migra estado_avaliacao.json de qualquer rodada antiga para o esquema v2
   */
  migrateRoundStateData(stateData, rawFiles = [], roundDate = '') {
    if (!stateData || typeof stateData !== 'object') return null;

    const migrated = { ...stateData };
    migrated.schemaVersion = this.SCHEMA_VERSION;
    migrated.relator = this.normalizeRelatorValue(stateData.relator);
    migrated.tipoProjeto = stateData.tipoProjeto || 'Projeto_Detalhado';
    migrated.areasTematicas = this.migrateAreasTematicas(stateData);
    migrated.enquadramentoCustom = stateData.enquadramentoCustom || '';

    const legacyEnq = this.buildLegacyEnquadramentoFromAreas(migrated.areasTematicas);
    if (!migrated.enquadramento) migrated.enquadramento = legacyEnq.enquadramento;
    if (!migrated.enquadramentoTipo) migrated.enquadramentoTipo = legacyEnq.enquadramentoTipo;

    const cleanDate = (roundDate || stateData.data_avaliacao || '').split('_')[0];
    const fallbackISO = stateData.savedAtISO || (cleanDate && /^\d{4}-\d{2}-\d{2}$/.test(cleanDate) ? `${cleanDate}T12:00:00.000Z` : new Date().toISOString());

    // Migra metadados de arquivos preservando nomes, datas e histórico
    const rawMeta = Array.isArray(stateData.arquivosMetadados) ? stateData.arquivosMetadados : [];
    migrated.arquivosMetadados = rawMeta.map((m, idx) => ({
      ...m,
      docId: m.docId || `doc_legacy_${idx}_${this.sanitizeFileName(m.savedFileName || m.originalFileName || 'arq', 20)}`,
      savedFileName: m.savedFileName || m.originalFileName || `documento_${idx}`,
      originalFileName: m.originalFileName || m.savedFileName || `documento_${idx}`,
      targetType: m.targetType || 'Outro',
      customName: m.customName || '',
      extension: m.extension || '',
      originRound: m.originRound || roundDate || stateData.data_avaliacao || '',
      replacedAt: m.replacedAt || null,
      sha256: m.sha256 || null,
      version: typeof m.version === 'number' && m.version >= 1 ? m.version : 1,
      previousNames: Array.isArray(m.previousNames) ? m.previousNames : [],
      historicalPendencias: Array.isArray(m.historicalPendencias) ? m.historicalPendencias : []
    }));

    migrated.pendenciasSelecionadas = Array.isArray(stateData.pendenciasSelecionadas)
      ? stateData.pendenciasSelecionadas
          .map(sp => this.migratePendenciaItem(sp, migrated.arquivosMetadados, fallbackISO))
          .filter(Boolean)
      : [];

    if (Array.isArray(stateData.pendencyHistory)) {
      migrated.pendencyHistory = stateData.pendencyHistory;
    } else {
      migrated.pendencyHistory = migrated.pendenciasSelecionadas.map((sp, idx) => ({
        entryId: `ph_migrated_${roundDate || 'r'}_${sp.id || idx}`,
        pendenciaId: sp.id,
        title: sp.title || sp.id || 'Pendência Documental',
        categoryId: sp.categoryId || 'geral',
        documentIds: [...(sp.documentIds || [])],
        documentNames: migrated.arquivosMetadados
          .filter(dm => (sp.documentIds || []).includes(dm.docId))
          .map(dm => dm.originalFileName || dm.savedFileName),
        targetDocTypes: [...(sp.targetDocTypes || [sp.targetDocType || 'Geral'])],
        observacaoRelator: sp.observacaoRelator || '',
        createdAt: sp.createdAt || fallbackISO,
        updatedAt: sp.updatedAt || fallbackISO,
        resolvedAt: null,
        resolutionReason: null,
        roundFolder: roundDate || stateData.data_avaliacao || '',
        events: [{ action: 'created', at: sp.createdAt || fallbackISO, note: 'Migrado de avaliação anterior' }]
      }));
    }

    return migrated;
  },

  /**
   * Consulta o histórico de pendências filtrando por documento e data exata ou intervalo de datas
   */
  queryPendencyHistory(pendencyHistory = [], { docId = 'ALL', docType = '', mode = 'all', exactDate = '', startDate = '', endDate = '' } = {}) {
    if (!Array.isArray(pendencyHistory) || pendencyHistory.length === 0) return [];

    return pendencyHistory.filter(entry => {
      if (!entry) return false;

      // 1. Filtro por documento específico
      if (docId && docId !== 'ALL') {
        const matchesDocId = Array.isArray(entry.documentIds) && entry.documentIds.includes(docId);
        const matchesDocType = (!entry.documentIds || entry.documentIds.length === 0) &&
          docType && Array.isArray(entry.targetDocTypes) && entry.targetDocTypes.includes(docType);
        if (!matchesDocId && !matchesDocType) return false;
      }

      // 2. Filtro temporal (Data exata ou Rango de datas)
      const createdMs = entry.createdAt ? new Date(entry.createdAt).getTime() : 0;
      const resolvedMs = entry.resolvedAt ? new Date(entry.resolvedAt).getTime() : Infinity;

      if (mode === 'exact' && exactDate) {
        const dayStart = new Date(`${exactDate}T00:00:00`).getTime();
        const dayEnd = new Date(`${exactDate}T23:59:59.999`).getTime();
        // Estava ativa em algum momento dessa data exata (ou houve evento nessa data)
        const activeOnDay = createdMs <= dayEnd && resolvedMs >= dayStart;
        const eventOnDay = Array.isArray(entry.events) && entry.events.some(ev => (ev.at || '').startsWith(exactDate));
        if (!activeOnDay && !eventOnDay) return false;
      } else if (mode === 'range' && (startDate || endDate)) {
        const rangeStart = startDate ? new Date(`${startDate}T00:00:00`).getTime() : 0;
        const rangeEnd = endDate ? new Date(`${endDate}T23:59:59.999`).getTime() : Infinity;
        const activeInRange = createdMs <= rangeEnd && resolvedMs >= rangeStart;
        if (!activeInRange) return false;
      }

      return true;
    }).sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
  },

  // =========================================================================
  // LEITURA E GRAVAÇÃO DE ARQUIVOS JSON
  // =========================================================================

  /**
   * Lê um arquivo JSON do diretório raiz (com migração automática transparente)
   */
  async readJSONFile(fileName, defaultContent = {}) {
    let result = null;

    if (this.dirHandle) {
      try {
        const fileHandle = await this.dirHandle.getFileHandle(fileName);
        const file = await fileHandle.getFile();
        const text = await file.text();
        result = JSON.parse(text);
        try {
          localStorage.setItem(`cep_${fileName.replace(/\./g, '_')}`, JSON.stringify(result));
        } catch (e) {}
      } catch (err) {
        result = null;
      }
    }

    if (result === null) {
      try {
        const localKey = `cep_${fileName.replace(/\./g, '_')}`;
        const localVal = localStorage.getItem(localKey);
        if (localVal) result = JSON.parse(localVal);
      } catch (e) {}
    }

    if (result === null) {
      result = defaultContent ? JSON.parse(JSON.stringify(defaultContent)) : defaultContent;
    }

    if (fileName === 'registro_cep.json') {
      return this.migrateRegistryData(result);
    }

    return result;
  },

  /**
   * Grava um arquivo JSON no diretório raiz (e espelha em localStorage como cache seguro)
   */
  async writeJSONFile(fileName, content) {
    try {
      localStorage.setItem(`cep_${fileName.replace(/\./g, '_')}`, JSON.stringify(content));
    } catch (e) {}
    if (!this.dirHandle) return false;
    try {
      const fileHandle = await this.dirHandle.getFileHandle(fileName, { create: true });
      const writable = await fileHandle.createWritable();
      await writable.write(JSON.stringify(content, null, 2));
      await writable.close();
      return true;
    } catch (err) {
      console.error('Erro ao escrever arquivo JSON:', err);
      return false;
    }
  },

  /**
   * Sanitiza nomes de pastas ou arquivos físicos no disco de forma robusta e compatível com Windows (NTFS/FAT32).
   */
  sanitizeFolderName(name, maxLen = 45) {
    if (!name) return 'Sem_Nome';
    let s = String(name).normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    s = s.replace(/[\\/:*?"<>|\x00-\x1f,;!()&~#%@{}+=^`´]/g, '_');
    s = s.replace(/[\s_]+/g, '_');
    s = s.replace(/^[._\s]+|[._\s]+$/g, '');
    if (s.length > maxLen) {
      s = s.substring(0, maxLen).replace(/[._\s]+$/, '');
    }
    return s || 'Sem_Nome';
  },

  sanitizeFileName(name, maxLen = 35) {
    return this.sanitizeFolderName(name, maxLen);
  },

  hashString(str) {
    let hash = 0;
    const s = String(str || '');
    for (let i = 0; i < s.length; i++) {
      const char = s.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash |= 0;
    }
    return Math.abs(hash).toString(16).substring(0, 6).toUpperCase().padStart(6, '0');
  },

  generateProjectFolderId(instituicao, pesquisador, titulo, caae = '') {
    const sInst = this.sanitizeFolderName(instituicao, 25) || 'Instituicao';
    const sPesq = this.sanitizeFolderName(pesquisador, 30) || 'Pesquisador';
    const sTit = this.sanitizeFolderName(titulo, 45) || 'Projeto';
    const hash = this.hashString(`${instituicao}|${pesquisador}|${titulo}|${caae}`);
    return `${sInst}.${sPesq}.${sTit}_${hash}`;
  },

  /**
   * Salva uma rodada de avaliação de projeto completa em subpastas:
   * [Raiz] / {projectFolderId} / {targetRoundFolder} /
   * Suporta também fallback em memória/localStorage caso nenhuma pasta física esteja conectada e allowVirtualFallback = true.
   */
  async saveProjectRound({
    id,
    instituicao,
    pesquisador,
    titulo,
    caae,
    relator,
    tipoProjeto = 'Projeto_Detalhado',
    areasTematicas = ['geral'],
    enquadramento,
    enquadramentoTipo,
    enquadramentoCustom,
    status = 'em_analise',
    data_aprovacao = null,
    pendencias_count = 0,
    pendencyHistory = [],
    targetRoundFolder,
    arquivosClassificados = [],
    pendenciasSelecionadas = [],
    logText = '',
    mlogText = '',
    hasModifications = false,
    allowVirtualFallback = false
  }) {
    if (!this.dirHandle && !allowVirtualFallback) {
      throw new Error('Nenhuma pasta de trabalho conectada.');
    }

    const today = new Date().toISOString().split('T')[0];
    const roundFolderName = (targetRoundFolder && targetRoundFolder.trim()) ? this.sanitizeFolderName(targetRoundFolder.trim(), 20) : today;

    let projectFolderId = (id && typeof id === 'string' && id.trim()) ? id.trim() : null;
    if (!projectFolderId || projectFolderId.length > 140 || /[\\/:*?"<>|\x00-\x1f]/.test(projectFolderId)) {
      projectFolderId = this.generateProjectFolderId(instituicao, pesquisador, titulo, caae);
    }

    const normalizedRelator = this.normalizeRelatorValue(relator);
    const normalizedAreas = Array.isArray(areasTematicas) && areasTematicas.length > 0
      ? Array.from(new Set(areasTematicas))
      : this.migrateAreasTematicas({ enquadramento, enquadramentoTipo });
    const legacyEnq = this.buildLegacyEnquadramentoFromAreas(normalizedAreas);

    const savedFilesMeta = [];
    const usedTargetNames = new Map();

    // Se houver diretório físico conectado, cria estrutura imediata de pastas e grava os arquivos
    if (this.dirHandle) {
      const projectDirHandle = await this.dirHandle.getDirectoryHandle(projectFolderId, { create: true });
      const roundDirHandle = await projectDirHandle.getDirectoryHandle(roundFolderName, { create: true });

      const validFileNamesInRound = new Set(['log.txt', 'estado_avaliacao.json']);
      if (hasModifications && mlogText && mlogText.trim() !== logText.trim()) {
        validFileNamesInRound.add('mlog.txt');
      }

      for (const item of arquivosClassificados) {
        if (!item.file && !item.cachedBuffer) continue;
        if (!item.docId) item.docId = this.generateDocId(item.originalFileName || (item.file && item.file.name) || '');

        const fileName = item.file ? item.file.name : (item.originalFileName || 'documento');
        const dotIdx = fileName.lastIndexOf('.');
        const extension = item.extension || (dotIdx !== -1 ? fileName.substring(dotIdx) : '');
        let baseDocName = item.targetType === 'Outro' && item.customName ? item.customName : (item.targetType || 'Documento');
        baseDocName = this.sanitizeFileName(baseDocName, 35);

        const count = (usedTargetNames.get(baseDocName) || 0) + 1;
        usedTargetNames.set(baseDocName, count);
        const suffix = count > 1 ? `_${count}` : '';

        const targetFileName = `${baseDocName}${suffix}.${roundFolderName}${extension}`;
        validFileNamesInRound.add(targetFileName);

        const isSameFileInSameFolder = !item.isNewUpload && fileName === targetFileName;

        let targetFileHandle = null;
        if (isSameFileInSameFolder) {
          try {
            targetFileHandle = await roundDirHandle.getFileHandle(targetFileName);
            item.handle = targetFileHandle;
            try {
              item.file = await targetFileHandle.getFile();
              if (!item.sha256) {
                item.sha256 = await this.computeSHA256(item.file);
              }
            } catch (e) {}
          } catch (e) {
            targetFileHandle = null;
          }
        }

        if (!targetFileHandle) {
          let fileBuffer = null;

          if (item.handle) {
            try {
              const freshFile = await item.handle.getFile();
              fileBuffer = await freshFile.arrayBuffer();
              item.file = freshFile;
            } catch (hErr) {
              console.warn(`Aviso ao obter snapshot fresco via handle para ${fileName}:`, hErr);
            }
          }

          if (!fileBuffer && item.file) {
            try {
              fileBuffer = await item.file.arrayBuffer();
            } catch (fErr) {
              console.warn(`Aviso de cache ao ler item.file para ${fileName}:`, fErr);
            }
          }

          if (!fileBuffer && item.originRound && projectDirHandle) {
            try {
              const originDir = await projectDirHandle.getDirectoryHandle(item.originRound);
              const originHandle = await originDir.getFileHandle(item.savedFileName || fileName);
              const originFile = await originHandle.getFile();
              fileBuffer = await originFile.arrayBuffer();
              item.handle = originHandle;
              item.file = originFile;
            } catch (oErr) {
              console.warn(`Aviso ao buscar arquivo na pasta de origem ${item.originRound}:`, oErr);
            }
          }

          if (!fileBuffer && item.cachedBuffer) {
            fileBuffer = item.cachedBuffer;
          }

          if (!fileBuffer) {
            throw new Error(`Não foi possível ler o arquivo "${fileName}". O arquivo pode estar aberto ou bloqueado por outro aplicativo (como Microsoft Word). Por favor, feche o arquivo e tente salvar novamente.`);
          }

          if (!item.sha256) {
            item.sha256 = await this.computeSHA256(fileBuffer);
          }

          targetFileHandle = await roundDirHandle.getFileHandle(targetFileName, { create: true });
          const writable = await targetFileHandle.createWritable();
          await writable.write(fileBuffer);
          await writable.close();

          item.handle = targetFileHandle;
          try {
            item.file = await targetFileHandle.getFile();
          } catch (e) {}
          item.isNewUpload = false;
          item.originRound = roundFolderName;
        }

        item.savedFileName = targetFileName;

        savedFilesMeta.push({
          docId: item.docId,
          savedFileName: targetFileName,
          originalFileName: item.originalFileName || fileName,
          targetType: item.targetType || 'Outro',
          customName: item.customName || '',
          extension,
          originRound: item.originRound || roundFolderName,
          replacedAt: item.replacedAt || null,
          sha256: item.sha256 || null,
          version: item.version || 1,
          previousNames: Array.isArray(item.previousNames) ? item.previousNames : [],
          historicalPendencias: Array.isArray(item.historicalPendencias) ? item.historicalPendencias : []
        });
      }

      // Remove da pasta da rodada atual arquivos que foram excluídos ou renomeados pelo usuário
      try {
        const entriesToRemove = [];
        for await (const [entryName, entryHandle] of roundDirHandle.entries()) {
          if (entryHandle.kind === 'file' && !validFileNamesInRound.has(entryName) && !entryName.startsWith('~$') && !entryName.startsWith('.')) {
            entriesToRemove.push(entryName);
          }
        }
        for (const nameToRemove of entriesToRemove) {
          await roundDirHandle.removeEntry(nameToRemove);
        }
      } catch (cleanupErr) {
        console.warn('Aviso ao limpar arquivos substituídos na pasta atual:', cleanupErr);
      }

      // Salva log.txt oficial
      const logHandle = await roundDirHandle.getFileHandle('log.txt', { create: true });
      const logWritable = await logHandle.createWritable();
      await logWritable.write(logText);
      await logWritable.close();

      // Se houver modificações pelo usuário, salva mlog.txt
      if (hasModifications && mlogText && mlogText.trim() !== logText.trim()) {
        const mlogHandle = await roundDirHandle.getFileHandle('mlog.txt', { create: true });
        const mlogWritable = await mlogHandle.createWritable();
        await mlogWritable.write(mlogText);
        await mlogWritable.close();
      }

      const calculatedPendenciasCount = Array.isArray(pendenciasSelecionadas) ? pendenciasSelecionadas.length : (pendencias_count || 0);
      const stateData = {
        schemaVersion: this.SCHEMA_VERSION,
        instituicao,
        pesquisador,
        titulo,
        caae,
        relator: normalizedRelator,
        tipoProjeto: tipoProjeto || 'Projeto_Detalhado',
        areasTematicas: normalizedAreas,
        enquadramento: enquadramento || legacyEnq.enquadramento,
        enquadramentoTipo: enquadramentoTipo || legacyEnq.enquadramentoTipo,
        enquadramentoCustom: enquadramentoCustom || '',
        status: status || (calculatedPendenciasCount === 0 ? 'ainda_nao_relatado' : 'em_analise'),
        data_aprovacao: data_aprovacao || null,
        data_avaliacao: roundFolderName,
        savedAtISO: new Date().toISOString(),
        arquivosMetadados: savedFilesMeta,
        pendenciasSelecionadas,
        pendencias_count: calculatedPendenciasCount,
        pendencyHistory: Array.isArray(pendencyHistory) ? pendencyHistory : [],
        hasModifications
      };

      const stateHandle = await roundDirHandle.getFileHandle('estado_avaliacao.json', { create: true });
      const stateWritable = await stateHandle.createWritable();
      await stateWritable.write(JSON.stringify(stateData, null, 2));
      await stateWritable.close();

      try {
        localStorage.setItem(`cep_virtual_round_${projectFolderId}_${roundFolderName}`, JSON.stringify({
          stateData,
          logText,
          mlogText: hasModifications ? mlogText : ''
        }));
      } catch (e) {}
    } else {
      // Modo Virtual (sem pasta física conectada): preserva todos os metadados, hashes e histórico no localStorage
      for (const item of arquivosClassificados) {
        if (!item.docId) item.docId = this.generateDocId(item.originalFileName || (item.file && item.file.name) || '');
        const fileName = item.file ? item.file.name : (item.originalFileName || 'documento');
        const dotIdx = fileName.lastIndexOf('.');
        const extension = item.extension || (dotIdx !== -1 ? fileName.substring(dotIdx) : '');
        let baseDocName = item.targetType === 'Outro' && item.customName ? item.customName : (item.targetType || 'Documento');
        baseDocName = this.sanitizeFileName(baseDocName, 35);

        const count = (usedTargetNames.get(baseDocName) || 0) + 1;
        usedTargetNames.set(baseDocName, count);
        const suffix = count > 1 ? `_${count}` : '';
        const targetFileName = `${baseDocName}${suffix}.${roundFolderName}${extension}`;

        if (!item.sha256 && (item.cachedBuffer || item.file)) {
          try {
            item.sha256 = await this.computeSHA256(item.cachedBuffer || item.file);
          } catch (e) {}
        }

        item.savedFileName = targetFileName;
        item.isNewUpload = false;
        item.originRound = roundFolderName;

        savedFilesMeta.push({
          docId: item.docId,
          savedFileName: targetFileName,
          originalFileName: item.originalFileName || fileName,
          targetType: item.targetType || 'Outro',
          customName: item.customName || '',
          extension,
          originRound: item.originRound || roundFolderName,
          replacedAt: item.replacedAt || null,
          sha256: item.sha256 || null,
          version: item.version || 1,
          previousNames: Array.isArray(item.previousNames) ? item.previousNames : [],
          historicalPendencias: Array.isArray(item.historicalPendencias) ? item.historicalPendencias : []
        });
      }

      const calculatedPendenciasCount = Array.isArray(pendenciasSelecionadas) ? pendenciasSelecionadas.length : (pendencias_count || 0);
      const stateData = {
        schemaVersion: this.SCHEMA_VERSION,
        instituicao,
        pesquisador,
        titulo,
        caae,
        relator: normalizedRelator,
        tipoProjeto: tipoProjeto || 'Projeto_Detalhado',
        areasTematicas: normalizedAreas,
        enquadramento: enquadramento || legacyEnq.enquadramento,
        enquadramentoTipo: enquadramentoTipo || legacyEnq.enquadramentoTipo,
        enquadramentoCustom: enquadramentoCustom || '',
        status: status || (calculatedPendenciasCount === 0 ? 'ainda_nao_relatado' : 'em_analise'),
        data_aprovacao: data_aprovacao || null,
        data_avaliacao: roundFolderName,
        savedAtISO: new Date().toISOString(),
        arquivosMetadados: savedFilesMeta,
        pendenciasSelecionadas,
        pendencias_count: calculatedPendenciasCount,
        pendencyHistory: Array.isArray(pendencyHistory) ? pendencyHistory : [],
        hasModifications
      };

      try {
        localStorage.setItem(`cep_virtual_round_${projectFolderId}_${roundFolderName}`, JSON.stringify({
          stateData,
          logText,
          mlogText: hasModifications ? mlogText : ''
        }));
      } catch (e) {}
    }

    const calculatedPendenciasCount = Array.isArray(pendenciasSelecionadas) ? pendenciasSelecionadas.length : (pendencias_count || 0);
    const finalStatus = status || (calculatedPendenciasCount === 0 ? 'ainda_nao_relatado' : 'em_analise');

    const pendenciasTitles = Array.isArray(pendenciasSelecionadas)
      ? pendenciasSelecionadas.map(p => p.title || p.id || 'Pendência Documental').filter(Boolean)
      : [];

    await this.updateProjectRegistry({
      id: projectFolderId,
      instituicao,
      pesquisador,
      titulo,
      caae,
      relator: normalizedRelator,
      tipoProjeto: tipoProjeto || 'Projeto_Detalhado',
      areasTematicas: normalizedAreas,
      enquadramentoCustom: enquadramentoCustom || '',
      status: finalStatus,
      data_aprovacao: data_aprovacao || null,
      pendencias_count: calculatedPendenciasCount,
      pendencias_titles: pendenciasTitles,
      pendencyHistory: Array.isArray(pendencyHistory) ? pendencyHistory : [],
      roundFolderName,
      todayDate: today,
      hasModifications
    });

    return {
      projectFolderId,
      todayFolder: roundFolderName,
      physicalFolderSaved: Boolean(this.dirHandle)
    };
  },

  /**
   * Atualiza o arquivo mestre de registro (registro_cep.json)
   */
  async updateProjectRegistry({
    id,
    instituicao,
    pesquisador,
    titulo,
    caae,
    relator,
    tipoProjeto = 'Projeto_Detalhado',
    areasTematicas = ['geral'],
    enquadramentoCustom = '',
    status,
    data_aprovacao,
    pendencias_count,
    pendencias_titles = [],
    pendencyHistory = null,
    roundFolderName,
    todayDate,
    hasModifications
  }) {
    const registry = await this.readJSONFile('registro_cep.json', {
      schemaVersion: this.SCHEMA_VERSION,
      projetos: [],
      relatores: [],
      instituicoes: [],
      reunioesOverrides: {}
    });
    const targetRound = roundFolderName || todayDate;
    const cleanRelator = this.normalizeRelatorValue(relator);

    // Atualiza lista de relatores memorizados apenas se for um nome real (não "Sem Relator")
    if (cleanRelator) {
      if (!registry.relatores) registry.relatores = [];
      if (!registry.relatores.includes(cleanRelator)) {
        registry.relatores.push(cleanRelator);
      }
    }

    if (!registry.projetos) registry.projetos = [];

    const existingProject = registry.projetos.find(p => p.id === id);
    const legacyEnq = this.buildLegacyEnquadramentoFromAreas(areasTematicas);

    if (existingProject) {
      existingProject.instituicao = instituicao;
      existingProject.pesquisador = pesquisador;
      existingProject.titulo = titulo;
      existingProject.caae = caae !== undefined ? caae : existingProject.caae;
      existingProject.relator = relator !== undefined ? cleanRelator : existingProject.relator;
      existingProject.tipoProjeto = tipoProjeto || existingProject.tipoProjeto || 'Projeto_Detalhado';
      existingProject.areasTematicas = Array.isArray(areasTematicas) && areasTematicas.length > 0 ? areasTematicas : (existingProject.areasTematicas || ['geral']);
      existingProject.enquadramento = legacyEnq.enquadramento;
      existingProject.enquadramentoTipo = legacyEnq.enquadramentoTipo;
      existingProject.enquadramentoCustom = enquadramentoCustom !== undefined ? enquadramentoCustom : (existingProject.enquadramentoCustom || '');
      existingProject.status = status || existingProject.status || 'em_analise';
      if (data_aprovacao) existingProject.data_aprovacao = data_aprovacao;
      if (typeof pendencias_count === 'number') existingProject.pendencias_count = pendencias_count;
      if (Array.isArray(pendencyHistory)) existingProject.pendencyHistory = pendencyHistory;
      existingProject.data_ultima_modificacao = todayDate;

      if (!existingProject.rondas) existingProject.rondas = [];
      const existingRound = existingProject.rondas.find(r => r.data === targetRound);
      if (existingRound) {
        existingRound.hasModifications = hasModifications;
        existingRound.updatedAt = todayDate;
        existingRound.status = status || existingRound.status || 'em_analise';
        existingRound.relator = relator !== undefined ? cleanRelator : (existingRound.relator || '');
        existingRound.pendencias_count = typeof pendencias_count === 'number' ? pendencias_count : (existingRound.pendencias_count || 0);
        existingRound.pendencias_titles = Array.isArray(pendencias_titles) ? pendencias_titles : (existingRound.pendencias_titles || []);
      } else {
        existingProject.rondas.push({
          data: targetRound,
          hasModifications,
          createdAt: todayDate,
          status: status || 'em_analise',
          relator: cleanRelator,
          pendencias_count: typeof pendencias_count === 'number' ? pendencias_count : 0,
          pendencias_titles: pendencias_titles || []
        });
      }
    } else {
      registry.projetos.push({
        id,
        instituicao,
        pesquisador,
        titulo,
        caae: caae || '',
        relator: cleanRelator,
        tipoProjeto: tipoProjeto || 'Projeto_Detalhado',
        areasTematicas: Array.isArray(areasTematicas) && areasTematicas.length > 0 ? areasTematicas : ['geral'],
        enquadramento: legacyEnq.enquadramento,
        enquadramentoTipo: legacyEnq.enquadramentoTipo,
        enquadramentoCustom: enquadramentoCustom || '',
        status: status || 'em_analise',
        data_aprovacao: data_aprovacao || null,
        pendencias_count: typeof pendencias_count === 'number' ? pendencias_count : 0,
        pendencyHistory: Array.isArray(pendencyHistory) ? pendencyHistory : [],
        data_primeira_submissao: todayDate,
        data_ultima_modificacao: todayDate,
        rondas: [{
          data: targetRound,
          hasModifications,
          createdAt: todayDate,
          status: status || 'em_analise',
          relator: cleanRelator,
          pendencias_count: typeof pendencias_count === 'number' ? pendencias_count : 0,
          pendencias_titles: pendencias_titles || []
        }]
      });
    }

    await this.writeJSONFile('registro_cep.json', registry);
    return registry;
  },

  /**
   * Gerencia o Catálogo Persistente de Instituições (inicia vazio)
   */
  async addInstitutionToCatalog(instName) {
    if (!instName || !instName.trim()) return [];
    const clean = instName.trim();
    const registry = await this.readJSONFile('registro_cep.json', { projetos: [], relatores: [], instituicoes: [], reunioesOverrides: {} });
    if (!Array.isArray(registry.instituicoes)) registry.instituicoes = [];
    const exists = registry.instituicoes.some(i => i.toLowerCase() === clean.toLowerCase());
    if (!exists) {
      registry.instituicoes.push(clean);
      registry.instituicoes.sort((a, b) => a.localeCompare(b));
      await this.writeJSONFile('registro_cep.json', registry);
    }
    return registry.instituicoes;
  },

  async removeInstitutionFromCatalog(instName) {
    const registry = await this.readJSONFile('registro_cep.json', { projetos: [], relatores: [], instituicoes: [], reunioesOverrides: {} });
    if (!Array.isArray(registry.instituicoes)) return [];
    registry.instituicoes = registry.instituicoes.filter(i => i !== instName);
    await this.writeJSONFile('registro_cep.json', registry);
    return registry.instituicoes;
  },

  /**
   * Persiste alterações pontuais de datas de reuniões (reunioesOverrides)
   */
  async saveMeetingOverrides(overridesMap) {
    const registry = await this.readJSONFile('registro_cep.json', { projetos: [], relatores: [], instituicoes: [], reunioesOverrides: {} });
    registry.reunioesOverrides = overridesMap && typeof overridesMap === 'object' ? { ...overridesMap } : {};
    await this.writeJSONFile('registro_cep.json', registry);
    return registry.reunioesOverrides;
  },

  /**
   * Atualiza o status de deliberação do projeto no registro central e na última rodada
   * ('em_analise' | 'ainda_nao_relatado' | 'em_relatoria' | 'em_pauta' | 'aprovado')
   */
  async updateProjectStatus(projectId, newStatus, extraData = {}) {
    const registry = await this.readJSONFile('registro_cep.json', { projetos: [], relatores: [], instituicoes: [], reunioesOverrides: {} });
    const project = (registry.projetos || []).find(p => p.id === projectId);
    if (!project) return null;

    project.status = newStatus;
    const today = new Date().toISOString().split('T')[0];
    project.data_ultima_modificacao = today;

    if (newStatus === 'aprovado') {
      project.data_aprovacao = extraData.data_aprovacao || today;
      // Registra resolução das pendências abertas no histórico por aprovação colegiada
      if (Array.isArray(project.pendencyHistory)) {
        const nowISO = new Date().toISOString();
        project.pendencyHistory.forEach(entry => {
          if (entry && !entry.resolvedAt) {
            entry.resolvedAt = nowISO;
            entry.resolutionReason = 'project_approved';
            if (!Array.isArray(entry.events)) entry.events = [];
            entry.events.push({ action: 'project_approved', at: nowISO, note: 'Aprovado em reunião colegiada' });
          }
        });
      }
    } else if (newStatus === 'em_analise') {
      delete project.data_aprovacao;
    }

    if (extraData.relator !== undefined) {
      project.relator = this.normalizeRelatorValue(extraData.relator);
    }

    // Sincroniza também a última rodada registrada
    if (Array.isArray(project.rondas) && project.rondas.length > 0) {
      const lastRound = project.rondas[project.rondas.length - 1];
      lastRound.status = newStatus;
      lastRound.updatedAt = today;
      if (extraData.relator !== undefined) {
        lastRound.relator = this.normalizeRelatorValue(extraData.relator);
      }

      // Se a pasta física estiver conectada, atualiza estado_avaliacao.json da última rodada de forma não-destrutiva
      if (this.dirHandle && lastRound.data) {
        try {
          const projectDir = await this.dirHandle.getDirectoryHandle(projectId);
          const roundDir = await projectDir.getDirectoryHandle(lastRound.data);
          const stateHandle = await roundDir.getFileHandle('estado_avaliacao.json');
          const stateFile = await stateHandle.getFile();
          const stateJson = JSON.parse(await stateFile.text());
          stateJson.status = newStatus;
          if (newStatus === 'aprovado') {
            stateJson.data_aprovacao = project.data_aprovacao;
          }
          if (extraData.relator !== undefined) {
            stateJson.relator = project.relator;
          }
          const writable = await stateHandle.createWritable();
          await writable.write(JSON.stringify(stateJson, null, 2));
          await writable.close();
        } catch (e) {
          // Ignora silenciosamente caso a rodada antiga não possua estado_avaliacao.json
        }
      }
    }

    await this.writeJSONFile('registro_cep.json', registry);
    return registry;
  },

  /**
   * Ordenação inteligente de nomes de pastas de rodadas (ex: 2026-10-01 < 2026-10-01_R2 < 2026-10-01_R10)
   */
  sortRoundNames(rounds = []) {
    return [...rounds].sort((a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' }));
  },

  /**
   * Lista todas as subpastas de rodadas existentes dentro da pasta de um projeto
   */
  async listProjectRounds(projectFolderId) {
    if (!projectFolderId) return [];
    const rounds = [];
    if (this.dirHandle) {
      try {
        const projectDir = await this.dirHandle.getDirectoryHandle(projectFolderId);
        for await (const [name, handle] of projectDir.entries()) {
          if (handle.kind === 'directory') {
            rounds.push(name);
          }
        }
      } catch (err) {}
    }
    return this.sortRoundNames(rounds);
  },

  /**
   * Carrega os arquivos e metadados migrados de uma rodada específica de um projeto
   */
  async loadProjectRound(projectFolderId, roundDate) {
    if (this.dirHandle) {
      try {
        const projectDir = await this.dirHandle.getDirectoryHandle(projectFolderId);
        const roundDir = await projectDir.getDirectoryHandle(roundDate);

        const rawFiles = [];
        let logText = '';
        let mlogText = '';
        let stateData = null;

        for await (const [name, handle] of roundDir.entries()) {
          if (handle.kind === 'file') {
            if (name.startsWith('~$') || name.startsWith('.')) continue;
            try {
              const file = await handle.getFile();
              file.handle = handle;
              if (name === 'log.txt') {
                logText = await file.text();
              } else if (name === 'mlog.txt') {
                mlogText = await file.text();
              } else if (name === 'estado_avaliacao.json') {
                try {
                  stateData = JSON.parse(await file.text());
                } catch (e) {}
              } else {
                rawFiles.push(file);
              }
            } catch (fileErr) {
              console.warn(`Aviso ao ler arquivo ${name} na rodada:`, fileErr);
            }
          }
        }

        const migratedState = this.migrateRoundStateData(stateData, rawFiles, roundDate);

        return {
          files: rawFiles,
          logText,
          mlogText,
          stateData: migratedState,
          roundDate
        };
      } catch (err) {
        console.warn('Tentando fallback virtual ao carregar rodada:', err);
      }
    }

    // Fallback virtual (localStorage) quando operando sem diretório físico conectado
    try {
      const virtualRaw = localStorage.getItem(`cep_virtual_round_${projectFolderId}_${roundDate}`);
      if (virtualRaw) {
        const parsed = JSON.parse(virtualRaw);
        return {
          files: [],
          logText: parsed.logText || '',
          mlogText: parsed.mlogText || '',
          stateData: this.migrateRoundStateData(parsed.stateData, [], roundDate),
          roundDate
        };
      }
    } catch (e) {}

    return null;
  },

  // =========================================================================
  // RELATÓRIO E CADERNO DE RELATORIA COM RANGO DE DATAS PERSONALIZADO E PRAZOS DINÂMICOS
  // =========================================================================

  _extractCleanDate(dateStr) {
    if (!dateStr || typeof dateStr !== 'string') return '';
    const part = dateStr.split('_')[0].trim();
    if (/^\d{4}-\d{2}-\d{2}/.test(part)) return part.substring(0, 10);
    if (/^\d{4}-\d{2}$/.test(part)) return `${part}-01`;
    return part;
  },

  _isDateInRange(dateStr, startStr, endStr) {
    const d = this._extractCleanDate(dateStr);
    if (!d) return false;
    if (startStr && d < startStr) return false;
    if (endStr && d > endStr) return false;
    return true;
  },

  /**
   * Constrói o contexto prévio ao início do período selecionado para projetos recorrentes
   */
  buildPreviousPeriodContext(proj, startDateStr) {
    const rondas = proj.rondas || [];
    const previousRounds = rondas.filter(r => {
      const d = this._extractCleanDate(r.data || r.createdAt || '');
      return d && d < startDateStr;
    });

    if (previousRounds.length === 0) {
      return {
        dataSubmissaoOriginal: proj.data_primeira_submissao || 'Anterior',
        ultimaDiligenciaData: null,
        pendenciasCount: 0,
        pendenciasAnteriores: [],
        resumo: `Protocolo submetido originalmente em ${CEP_RULES_ENGINE.formatDateBR(proj.data_primeira_submissao)}. Nenhuma diligência anterior ao período selecionado.`
      };
    }

    const lastPrevRound = previousRounds[previousRounds.length - 1];
    const prevTitles = lastPrevRound.pendencias_titles || [];
    const prevCount = typeof lastPrevRound.pendencias_count === 'number' ? lastPrevRound.pendencias_count : prevTitles.length;
    const dateFormatted = CEP_RULES_ENGINE.formatDateBR(lastPrevRound.data || lastPrevRound.createdAt);

    return {
      dataSubmissaoOriginal: proj.data_primeira_submissao || 'Anterior',
      ultimaDiligenciaData: lastPrevRound.data || lastPrevRound.createdAt,
      pendenciasCount: prevCount,
      pendenciasAnteriores: prevTitles,
      resumo: `Submetido originalmente em ${CEP_RULES_ENGINE.formatDateBR(proj.data_primeira_submissao)}. Última diligência anterior ao período registrada em ${dateFormatted} (${prevCount} pendência(s)).`
    };
  },

  buildPreviousMonthContext(proj, targetMonthYear) {
    return this.buildPreviousPeriodContext(proj, `${targetMonthYear}-01`);
  },

  /**
   * Constrói a linha do tempo de eventos para a ficha individual do projeto dentro do período [startDateStr, endDateStr]
   */
  async buildProjectReportTimeline(proj, startDateOrMonth, isNew, endDateOptional = null) {
    let startStr = startDateOrMonth;
    let endStr = endDateOptional;

    // Compatibilidade com chamada legada (proj, 'YYYY-MM', isNew)
    if (!endStr && typeof startDateOrMonth === 'string' && /^\d{4}-\d{2}$/.test(startDateOrMonth)) {
      const [y, m] = startDateOrMonth.split('-').map(Number);
      const lastDay = new Date(y, m, 0).getDate();
      startStr = `${startDateOrMonth}-01`;
      endStr = `${startDateOrMonth}-${String(lastDay).padStart(2, '0')}`;
    }

    const events = [];
    const rondas = proj.rondas || [];

    for (const r of rondas) {
      if ((!r.pendencias_titles || r.pendencias_titles.length === 0) && this.dirHandle) {
        try {
          const loaded = await this.loadProjectRound(proj.id, r.data);
          if (loaded && loaded.stateData) {
            r.relator = r.relator || loaded.stateData.relator;
            r.status = r.status || loaded.stateData.status;
            if (Array.isArray(loaded.stateData.pendenciasSelecionadas)) {
              r.pendencias_titles = loaded.stateData.pendenciasSelecionadas.map(p => p.title || p.id).filter(Boolean);
              r.pendencias_count = loaded.stateData.pendenciasSelecionadas.length;
            }
          }
        } catch (e) {}
      }
    }

    const relDisplay = this.normalizeRelatorValue(proj.relator) || 'Sem Relator';

    if (isNew) {
      events.push({
        data: proj.data_primeira_submissao,
        tipo: 'submissao',
        badge: '1ª Submissão',
        badgeClass: 'badge-event-submissao',
        titulo: 'Entrada do Protocolo no CEP',
        descricao: 'Projeto novo registrado e submetido para triagem e análise documental inicial.',
        relator: relDisplay,
        pendencias: []
      });

      let roundCounter = 1;
      for (const r of rondas) {
        const rData = r.data || r.createdAt;
        if (!this._isDateInRange(rData, startStr, endStr)) continue;

        const count = typeof r.pendencias_count === 'number' ? r.pendencias_count : (r.pendencias_titles || []).length;
        const titles = r.pendencias_titles || [];
        const rRel = this.normalizeRelatorValue(r.relator) || relDisplay;

        if (count > 0 || titles.length > 0) {
          events.push({
            data: rData,
            tipo: 'diligencia',
            badge: r.status === 'em_relatoria' ? `Rodada ${roundCounter} — Em Relatoria c/ Pendências` : `Rodada ${roundCounter} — Diligência`,
            badgeClass: 'badge-event-diligencia',
            titulo: `Parecer com Pendências Documentais (${titles.length || count})`,
            descricao: r.status === 'em_relatoria'
              ? 'Protocolo encaminhado para relatoria mantendo registro de pendências abertas.'
              : 'Foram identificadas não-conformidades documentais no protocolo. Notificação emitida ao pesquisador.',
            relator: rRel,
            pendencias: titles
          });
        } else if (r.status === 'ainda_nao_relatado') {
          events.push({
            data: rData,
            tipo: 'pauta',
            badge: `Rodada ${roundCounter} — Ainda não relatado`,
            badgeClass: 'badge-event-submissao',
            titulo: 'Análise Documental Concluída sem Pendências (Ainda não relatado)',
            descricao: 'Protocolo sem pendências documentais, aguardando relatoria.',
            relator: rRel,
            pendencias: []
          });
        } else {
          events.push({
            data: rData,
            tipo: 'pauta',
            badge: `Rodada ${roundCounter} — Regularizado`,
            badgeClass: 'badge-event-pauta',
            titulo: 'Encaminhado para Relatoria / Pauta da Reunião Colegiada',
            descricao: 'Protocolo regularizado sem pendências documentais. Apto para apreciação pelo Colegiado.',
            relator: rRel,
            pendencias: []
          });
        }
        roundCounter++;
      }

      if ((proj.status === 'em_pauta' || proj.status === 'em_relatoria') && !events.some(e => e.tipo === 'pauta')) {
        events.push({
          data: proj.data_ultima_modificacao || proj.data_primeira_submissao,
          tipo: 'pauta',
          badge: proj.status === 'em_relatoria' ? 'Em Relatoria' : 'Em Pauta',
          badgeClass: 'badge-event-pauta',
          titulo: proj.status === 'em_relatoria' ? 'Encaminhado para Relatoria' : 'Encaminhado para Pauta da Reunião Colegiada',
          descricao: 'Protocolo encaminhado para avaliação e deliberação colegiada.',
          relator: relDisplay,
          pendencias: []
        });
      }

      if (proj.status === 'aprovado' && this._isDateInRange(proj.data_aprovacao || proj.data_ultima_modificacao, startStr, endStr)) {
        events.push({
          data: proj.data_aprovacao || proj.data_ultima_modificacao,
          tipo: 'aprovado',
          badge: 'Aprovado',
          badgeClass: 'badge-event-aprovado',
          titulo: 'Deliberação Colegiada: APROVADO',
          descricao: 'Protocolo avaliado, homologado pelo Colegiado e arquivado com parecer consubstanciado emitido.',
          relator: relDisplay,
          pendencias: []
        });
      }
    } else {
      let periodRoundCounter = 1;
      for (const r of rondas) {
        const rData = r.data || r.createdAt;
        if (!this._isDateInRange(rData, startStr, endStr)) continue;

        const count = typeof r.pendencias_count === 'number' ? r.pendencias_count : (r.pendencias_titles || []).length;
        const titles = r.pendencias_titles || [];
        const rRel = this.normalizeRelatorValue(r.relator) || relDisplay;

        if (count > 0 || titles.length > 0) {
          events.push({
            data: rData,
            tipo: 'diligencia',
            badge: `Reanálise no Período (Rodada ${periodRoundCounter})`,
            badgeClass: 'badge-event-diligencia',
            titulo: `Pendências Mantidas / Diligência Emitida (${titles.length || count})`,
            descricao: 'Reavaliação das correções apresentadas pelo pesquisador neste período com pendências remanescentes.',
            relator: rRel,
            pendencias: titles
          });
        } else {
          events.push({
            data: rData,
            tipo: 'pauta',
            badge: r.status === 'ainda_nao_relatado' ? 'Ainda não relatado' : 'Em Pauta',
            badgeClass: 'badge-event-pauta',
            titulo: r.status === 'ainda_nao_relatado' ? 'Pendências Sanadas — Ainda não relatado' : 'Pendências Sanadas — Pautado para Reunião',
            descricao: 'Respostas às diligências validadas com sucesso neste período.',
            relator: rRel,
            pendencias: []
          });
        }
        periodRoundCounter++;
      }

      if ((proj.status === 'em_pauta' || proj.status === 'em_relatoria') && this._isDateInRange(proj.data_ultima_modificacao, startStr, endStr) && !events.some(e => e.tipo === 'pauta')) {
        events.push({
          data: proj.data_ultima_modificacao,
          tipo: 'pauta',
          badge: proj.status === 'em_relatoria' ? 'Em Relatoria' : 'Pautado na Reunião',
          badgeClass: 'badge-event-pauta',
          titulo: proj.status === 'em_relatoria' ? 'Encaminhado para Relatoria' : 'Pauta da Reunião de Colegiado',
          descricao: 'Protocolo incluído para apreciação na Reunião Ordinária.',
          relator: relDisplay,
          pendencias: []
        });
      }

      if (proj.status === 'aprovado' && this._isDateInRange(proj.data_aprovacao || proj.data_ultima_modificacao, startStr, endStr)) {
        events.push({
          data: proj.data_aprovacao || proj.data_ultima_modificacao,
          tipo: 'aprovado',
          badge: 'Aprovado na Reunião',
          badgeClass: 'badge-event-aprovado',
          titulo: 'Deliberação Colegiada: APROVADO',
          descricao: 'Deliberação de aprovação formal no Colegiado e arquivamento ético ativo.',
          relator: relDisplay,
          pendencias: []
        });
      }
    }

    events.sort((a, b) => (a.data || '').localeCompare(b.data || ''));
    return events;
  },

  /**
   * Gera os dados completos do Caderno / Relatório para qualquer intervalo [startDate, endDate]
   */
  async getReportData({
    startDate,
    endDate,
    referenceDate = new Date(),
    projectsSource = null,
    cutoffDays = 20
  } = {}) {
    let allProjects = [];
    if (Array.isArray(projectsSource)) {
      allProjects = projectsSource.map(p => this.migrateProjectRecord(p));
    } else {
      const registry = await this.readJSONFile('registro_cep.json', { projetos: [], relatores: [], instituicoes: [], reunioesOverrides: {} });
      allProjects = registry.projetos || [];
    }

    const now = referenceDate || new Date();
    const defaultEnd = now.toISOString().split('T')[0];
    const defaultStartObj = new Date(now.getFullYear(), now.getMonth(), 1);
    const defaultStart = defaultStartObj.toISOString().split('T')[0];

    let sDate = startDate || defaultStart;
    let eDate = endDate || defaultEnd;
    if (sDate > eDate) {
      const tmp = sDate;
      sDate = eDate;
      eDate = tmp;
    }

    const endRefObj = new Date(`${eDate}T14:00:00`);
    const nextMeeting = CEP_RULES_ENGINE.getNextMeetingDate(endRefObj);
    const prevMeeting = CEP_RULES_ENGINE.getPreviousMeetingDate(endRefObj);
    const prevPrevMeeting = CEP_RULES_ENGINE.getPreviousMeetingDate(new Date(prevMeeting.getTime() - 86400000 * 2));
    const cutoffDate = CEP_RULES_ENGINE.calculateSubmissionDeadline(nextMeeting, cutoffDays);
    const realCycleIntervalDays = Math.max(1, Math.round((nextMeeting.getTime() - prevMeeting.getTime()) / (1000 * 60 * 60 * 24)));

    // Identifica projetos ativos no período [sDate, eDate]
    const activeProjectsInPeriod = [];
    for (const proj of allProjects) {
      const isNewInPeriod = this._isDateInRange(proj.data_primeira_submissao, sDate, eDate);
      const roundsInPeriod = (proj.rondas || []).filter(r => this._isDateInRange(r.data || r.createdAt, sDate, eDate));
      const modifiedInPeriod = this._isDateInRange(proj.data_ultima_modificacao, sDate, eDate);
      const approvedInPeriod = this._isDateInRange(proj.data_aprovacao, sDate, eDate);

      if (isNewInPeriod || roundsInPeriod.length > 0 || modifiedInPeriod || approvedInPeriod) {
        activeProjectsInPeriod.push(proj);
      }
    }

    const projetosNovos = [];
    const projetosRecorrentes = [];

    let vueltasPeriodo = 0;
    let pendenciasPeriodo = 0;
    const issueFrequencyMap = {};

    for (const proj of activeProjectsInPeriod) {
      const isNew = this._isDateInRange(proj.data_primeira_submissao, sDate, eDate);
      const timelineEvents = await this.buildProjectReportTimeline(proj, sDate, isNew, eDate);

      for (const r of (proj.rondas || [])) {
        if (this._isDateInRange(r.data || r.createdAt, sDate, eDate)) {
          vueltasPeriodo++;
          const titles = r.pendencias_titles || [];
          const c = typeof r.pendencias_count === 'number' ? r.pendencias_count : titles.length;
          pendenciasPeriodo += c;
          titles.forEach(tTitle => {
            const k = String(tTitle || '').trim();
            if (k) issueFrequencyMap[k] = (issueFrequencyMap[k] || 0) + 1;
          });
        }
      }

      const relClean = this.normalizeRelatorValue(proj.relator) || 'Sem Relator';

      const reportProjectItem = {
        id: proj.id,
        titulo: proj.titulo,
        pesquisador: proj.pesquisador,
        instituicao: proj.instituicao,
        caae: proj.caae || 'Não informado',
        relator: relClean,
        tipoProjeto: proj.tipoProjeto || 'Projeto_Detalhado',
        areasTematicas: proj.areasTematicas || ['geral'],
        status: proj.status || 'em_analise',
        data_primeira_submissao: proj.data_primeira_submissao,
        data_ultima_modificacao: proj.data_ultima_modificacao,
        data_aprovacao: proj.data_aprovacao || null,
        totalRondasHistorico: (proj.rondas || []).length || 1,
        isNew,
        timelineEvents,
        contextoMesAnterior: isNew ? null : this.buildPreviousPeriodContext(proj, sDate)
      };

      if (isNew) {
        projetosNovos.push(reportProjectItem);
      } else {
        projetosRecorrentes.push(reportProjectItem);
      }
    }

    // Totais históricos acumulados
    let vueltasHistoricoTotal = 0;
    let pendenciasHistoricoTotal = 0;
    let somaVueltasAprovados = 0;
    let totalAprovadosHistorico = 0;
    let aprovadosNoPeriodo = 0;

    for (const p of allProjects) {
      const pRounds = (p.rondas || []).length || 1;
      vueltasHistoricoTotal += pRounds;
      for (const r of (p.rondas || [])) {
        const c = typeof r.pendencias_count === 'number' ? r.pendencias_count : (r.pendencias_titles || []).length;
        pendenciasHistoricoTotal += c;
      }
      if (p.status === 'aprovado') {
        totalAprovadosHistorico++;
        somaVueltasAprovados += pRounds;
        if (this._isDateInRange(p.data_aprovacao || p.data_ultima_modificacao, sDate, eDate)) {
          aprovadosNoPeriodo++;
        }
      }
    }

    // Pauta da reunião de hoje (projetos em_pauta)
    const pautaReuniaoHoje = allProjects.filter(p => p.status === 'em_pauta').map(p => ({
      id: p.id,
      titulo: p.titulo,
      pesquisador: p.pesquisador,
      instituicao: p.instituicao,
      caae: p.caae || '—',
      relator: this.normalizeRelatorValue(p.relator) || 'Sem Relator',
      dataSubmissao: p.data_primeira_submissao,
      totalRondas: (p.rondas || []).length || 1
    }));

    // Métricas da Reunião Anterior usando o intervalo dinâmico real (prevPrevMeeting, prevMeeting]
    const prevStartStr = prevPrevMeeting.toISOString().split('T')[0];
    const prevEndStr = prevMeeting.toISOString().split('T')[0];

    let aprovadosReuniaoAnterior = 0;
    let devolvidosReuniaoAnterior = 0;

    for (const p of allProjects) {
      if (this._isDateInRange(p.data_aprovacao, prevStartStr, prevEndStr)) {
        aprovadosReuniaoAnterior++;
      } else if ((p.rondas || []).some(r => this._isDateInRange(r.data || r.createdAt, prevStartStr, prevEndStr)) && p.status === 'em_analise') {
        devolvidosReuniaoAnterior++;
      }
    }
    const totalAnalisadosReuniaoAnterior = aprovadosReuniaoAnterior + devolvidosReuniaoAnterior;

    // Distribuição de carga por relator no período
    const relatoresWorkload = {};
    for (const p of activeProjectsInPeriod) {
      const rel = this.normalizeRelatorValue(p.relator) || 'Sem Relator';
      relatoresWorkload[rel] = (relatoresWorkload[rel] || 0) + 1;
    }
    const distribuicaoRelatores = Object.entries(relatoresWorkload).map(([nome, total]) => ({ nome, total }));

    // Top 5 inconformidades (usa frequência real quando disponível, com fallback proporcional)
    let topInconformidades = [];
    const sortedIssues = Object.entries(issueFrequencyMap).sort((a, b) => b[1] - a[1]).slice(0, 5);
    if (sortedIssues.length > 0) {
      const totalFreq = Math.max(1, Object.values(issueFrequencyMap).reduce((acc, v) => acc + v, 0));
      topInconformidades = sortedIssues.map(([label, count]) => ({
        label: label.length > 52 ? label.substring(0, 52) + '...' : label,
        count,
        pct: Math.round((count / totalFreq) * 100)
      }));
    } else {
      topInconformidades = [
        { label: 'TCLE (Termo de Consentimento)', count: Math.max(0, Math.round(pendenciasPeriodo * 0.4)) || 0, pct: pendenciasPeriodo > 0 ? 40 : 0 },
        { label: 'Folha de Rosto (Assinaturas/Instituição)', count: Math.max(0, Math.round(pendenciasPeriodo * 0.25)) || 0, pct: pendenciasPeriodo > 0 ? 25 : 0 },
        { label: 'Cronograma (Data Coleta x Aprovação)', count: Math.max(0, Math.round(pendenciasPeriodo * 0.15)) || 0, pct: pendenciasPeriodo > 0 ? 15 : 0 },
        { label: 'Projeto Detalhado (Metodologia/Riscos)', count: Math.max(0, Math.round(pendenciasPeriodo * 0.12)) || 0, pct: pendenciasPeriodo > 0 ? 12 : 0 },
        { label: 'Anuência Institucional / TCUD', count: Math.max(0, Math.round(pendenciasPeriodo * 0.08)) || 0, pct: pendenciasPeriodo > 0 ? 8 : 0 }
      ];
    }

    const mediaVueltasAprovacao = totalAprovadosHistorico > 0
      ? (somaVueltasAprovados / totalAprovadosHistorico).toFixed(1)
      : '1.0';

    const periodDisplayBR = `${CEP_RULES_ENGINE.formatDateBR(sDate)} a ${CEP_RULES_ENGINE.formatDateBR(eDate)}`;

    return {
      startDate: sDate,
      endDate: eDate,
      mesReferencia: `${sDate}..${eDate}`,
      mesReferenciaExtenso: periodDisplayBR,
      mesReferenciaExtensoES: periodDisplayBR,
      dataEmissao: CEP_RULES_ENGINE.formatDateBR(now),
      proximaReuniao: CEP_RULES_ENGINE.formatDateBR(nextMeeting),
      reuniaoAnterior: CEP_RULES_ENGINE.formatDateBR(prevMeeting),
      intervaloCicloDias: realCycleIntervalDays,
      dataLimiteCorte: CEP_RULES_ENGINE.formatDateBR(cutoffDate),
      totalNovosMes: projetosNovos.length,
      totalRecorrentesMes: projetosRecorrentes.length,
      totalAtivosMes: projetosNovos.length + projetosRecorrentes.length,
      aprovadosNoPeriodo,
      vueltasMes: vueltasPeriodo,
      vueltasHistoricoTotal,
      pendenciasMes: pendenciasPeriodo,
      pendenciasHistoricoTotal,
      aprovadosReuniaoAnterior,
      devolvidosReuniaoAnterior,
      totalAnalisadosReuniaoAnterior,
      taxaAprovacaoReuniaoAnterior: totalAnalisadosReuniaoAnterior > 0
        ? Math.round((aprovadosReuniaoAnterior / totalAnalisadosReuniaoAnterior) * 100)
        : 100,
      pautaReuniaoHoje,
      distribuicaoRelatores,
      topInconformidades,
      mediaVueltasAprovacao,
      projetosNovos,
      projetosRecorrentes,
      totalFolhas: 1 + projetosNovos.length + projetosRecorrentes.length
    };
  },

  /**
   * Wrapper retrocompatível para chamadas antigas baseadas em 'YYYY-MM'
   */
  async getMonthlyReportData(referenceDate = new Date(), targetMonthYear = null, projectsSource = null) {
    if (!targetMonthYear) {
      const y = referenceDate.getFullYear();
      const m = String(referenceDate.getMonth() + 1).padStart(2, '0');
      targetMonthYear = `${y}-${m}`;
    }
    const [tYear, tMonth] = targetMonthYear.split('-').map(Number);
    const lastDay = new Date(tYear, tMonth, 0).getDate();
    const startDate = `${targetMonthYear}-01`;
    const endDate = `${targetMonthYear}-${String(lastDay).padStart(2, '0')}`;
    return this.getReportData({ startDate, endDate, referenceDate, projectsSource });
  }
};

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { CEP_STORAGE };
}
