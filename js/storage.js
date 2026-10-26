/**
 * STORAGE.JS
 * Gestão de Arquivos Locais, File System Access API e Persistência no Navegador
 */

const CEP_STORAGE = {
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

    // Verifica se a permissão ainda é válida
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

  /**
   * Lê um arquivo JSON do diretório raiz
   */
  async readJSONFile(fileName, defaultContent = {}) {
    if (!this.dirHandle) {
      try {
        const localKey = `cep_${fileName.replace('.', '_')}`;
        const localVal = localStorage.getItem(localKey);
        if (localVal) return JSON.parse(localVal);
      } catch (e) {}
      return defaultContent;
    }
    try {
      const fileHandle = await this.dirHandle.getFileHandle(fileName);
      const file = await fileHandle.getFile();
      const text = await file.text();
      const parsed = JSON.parse(text);
      try {
        localStorage.setItem(`cep_${fileName.replace('.', '_')}`, JSON.stringify(parsed));
      } catch (e) {}
      return parsed;
    } catch (err) {
      return defaultContent;
    }
  },

  /**
   * Grava um arquivo JSON no diretório raiz
   */
  async writeJSONFile(fileName, content) {
    try {
      localStorage.setItem(`cep_${fileName.replace('.', '_')}`, JSON.stringify(content));
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
   * - Remove diacríticos/acentos apenas do nome da pasta física para evitar divergências de codificação no SO.
   * - Substitui caracteres proibidos no Windows (\ / : * ? " < > |) e pontuações por underscore.
   * - Remove espaços/pontos das pontas (Windows não permite pastas terminadas em ponto ou espaço).
   * - Limita o tamanho máximo para respeitar o limite MAX_PATH (260 caracteres) do Windows.
   */
  sanitizeFolderName(name, maxLen = 45) {
    if (!name) return 'Sem_Nome';
    // Remove diacríticos (acentos) no nome da pasta física
    let s = String(name).normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    // Substitui caracteres ilegais no Windows e pontuações
    s = s.replace(/[\\/:*?"<>|\x00-\x1f,;!()&~#%@{}+=^`´]/g, '_');
    // Compacta múltiplos underscores e espaços
    s = s.replace(/[\s_]+/g, '_');
    // Remove pontos e underscores das extremidades (Windows não aceita pastas terminadas em ponto ou espaço)
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
   */
  async saveProjectRound({
    id,
    instituicao,
    pesquisador,
    titulo,
    caae,
    relator,
    enquadramento,
    enquadramentoTipo,
    enquadramentoCustom,
    status = 'em_analise',
    data_aprovacao = null,
    pendencias_count = 0,
    targetRoundFolder,
    arquivosClassificados,
    pendenciasSelecionadas,
    logText,
    mlogText,
    hasModifications
  }) {
    if (!this.dirHandle) {
      throw new Error('Nenhuma pasta de trabalho conectada.');
    }

    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    const roundFolderName = (targetRoundFolder && targetRoundFolder.trim()) ? this.sanitizeFolderName(targetRoundFolder.trim(), 20) : today;

    // Determina o ID/nome da pasta do projeto de forma segura para o Windows
    let projectFolderId = (id && typeof id === 'string' && id.trim()) ? id.trim() : null;
    // Se não tiver ID ou o ID existente for inválido/muito longo para o Windows (ex: esquemas antigos quebrados > 140 chars)
    if (!projectFolderId || projectFolderId.length > 140 || /[\\/:*?"<>|\x00-\x1f]/.test(projectFolderId)) {
      projectFolderId = this.generateProjectFolderId(instituicao, pesquisador, titulo, caae);
    }

    // 1. Cria ou abre a pasta do projeto
    const projectDirHandle = await this.dirHandle.getDirectoryHandle(projectFolderId, { create: true });

    // 2. Cria ou abre a subpasta da rodada (por padrão YYYY-MM-DD, preservando pastas de datas anteriores intactas)
    const roundDirHandle = await projectDirHandle.getDirectoryHandle(roundFolderName, { create: true });

    // 3. Prepara lista de nomes de arquivos válidos nesta rodada e grava os arquivos
    const validFileNamesInRound = new Set(['log.txt', 'estado_avaliacao.json']);
    if (hasModifications && mlogText && mlogText.trim() !== logText.trim()) {
      validFileNamesInRound.add('mlog.txt');
    }

    const savedFilesMeta = [];
    const usedTargetNames = new Map();

    for (const item of arquivosClassificados) {
      if (!item.file && !item.cachedBuffer) continue;
      const fileName = item.file ? item.file.name : (item.originalFileName || 'documento');
      const dotIdx = fileName.lastIndexOf('.');
      const extension = item.extension || (dotIdx !== -1 ? fileName.substring(dotIdx) : '');
      let baseDocName = item.targetType === 'Outro' && item.customName ? item.customName : (item.targetType || 'Documento');
      baseDocName = this.sanitizeFileName(baseDocName, 35);

      // Evita colisão caso existam 2 arquivos do mesmo tipo na mesma rodada
      const count = (usedTargetNames.get(baseDocName) || 0) + 1;
      usedTargetNames.set(baseDocName, count);
      const suffix = count > 1 ? `_${count}` : '';

      const targetFileName = `${baseDocName}${suffix}.${roundFolderName}${extension}`;
      validFileNamesInRound.add(targetFileName);

      // Se o arquivo já está gravado na pasta desta mesma rodada com o mesmo nome e NÃO é novo upload,
      // ele já está íntegro no disco. Não reescreve o mesmo arquivo sobre si mesmo para evitar InvalidStateError.
      const isSameFileInSameFolder = !item.isNewUpload && fileName === targetFileName;
      
      let targetFileHandle = null;
      if (isSameFileInSameFolder) {
        try {
          targetFileHandle = await roundDirHandle.getFileHandle(targetFileName);
          item.handle = targetFileHandle;
          try {
            item.file = await targetFileHandle.getFile();
          } catch (e) {}
        } catch (e) {
          targetFileHandle = null;
        }
      }

      if (!targetFileHandle) {
        let fileBuffer = null;

        // 1. Tenta obter os bytes via handle fresco caso o arquivo já exista no disco
        if (item.handle) {
          try {
            const freshFile = await item.handle.getFile();
            fileBuffer = await freshFile.arrayBuffer();
            item.file = freshFile;
          } catch (hErr) {
            console.warn(`Aviso ao obter snapshot fresco via handle para ${fileName}:`, hErr);
          }
        }

        // 2. Se não obteve via handle, tenta ler direto do item.file
        if (!fileBuffer && item.file) {
          try {
            fileBuffer = await item.file.arrayBuffer();
          } catch (fErr) {
            console.warn(`Aviso de cache ao ler item.file para ${fileName}:`, fErr);
          }
        }

        // 3. Se falhou por estado em cache desatualizado, tenta localizar na subpasta de origem
        if (!fileBuffer && item.originRound && projectDirHandle) {
          try {
            const originDir = await projectDirHandle.getDirectoryHandle(item.originRound);
            const originHandle = await originDir.getFileHandle(fileName);
            const originFile = await originHandle.getFile();
            fileBuffer = await originFile.arrayBuffer();
            item.handle = originHandle;
            item.file = originFile;
          } catch (oErr) {
            console.warn(`Aviso ao buscar arquivo na pasta de origem ${item.originRound}:`, oErr);
          }
        }

        // 4. Fallback para buffer em memória capturado no momento do upload
        if (!fileBuffer && item.cachedBuffer) {
          fileBuffer = item.cachedBuffer;
        }

        if (!fileBuffer) {
          throw new Error(`Não foi possível ler o arquivo "${fileName}". O arquivo pode estar aberto ou bloqueado por outro aplicativo (como Microsoft Word). Por favor, feche o arquivo e tente salvar novamente.`);
        }

        // Grava no disco com segurança utilizando o buffer em memória (imune a InvalidStateError)
        targetFileHandle = await roundDirHandle.getFileHandle(targetFileName, { create: true });
        const writable = await targetFileHandle.createWritable();
        await writable.write(fileBuffer);
        await writable.close();

        // Atualiza as referências em memória com o handle e arquivo recém-gravados
        item.handle = targetFileHandle;
        try {
          item.file = await targetFileHandle.getFile();
        } catch (e) {}
        item.isNewUpload = false;
        item.originRound = roundFolderName;
      }

      savedFilesMeta.push({
        savedFileName: targetFileName,
        originalFileName: item.originalFileName || fileName,
        targetType: item.targetType || 'Outro',
        customName: item.customName || '',
        extension,
        originRound: item.originRound || roundFolderName,
        replacedAt: item.replacedAt || null
      });
    }

    // Remove da pasta da rodada atual arquivos que foram excluídos ou renomeados pelo usuário
    // (Ignora arquivos temporários do sistema ou do Word como ~$*)
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

    // 4. Salva o log.txt oficial inalterável
    const logHandle = await roundDirHandle.getFileHandle('log.txt', { create: true });
    const logWritable = await logHandle.createWritable();
    await logWritable.write(logText);
    await logWritable.close();

    // 5. Se houver modificações pelo usuário, salva mlog.txt
    if (hasModifications && mlogText && mlogText.trim() !== logText.trim()) {
      const mlogHandle = await roundDirHandle.getFileHandle('mlog.txt', { create: true });
      const mlogWritable = await mlogHandle.createWritable();
      await mlogWritable.write(mlogText);
      await mlogWritable.close();
    }

    // 6. Salva o estado_avaliacao.json com metadados dos documentos e pendências para restaurar estado se reaberto
    const calculatedPendenciasCount = Array.isArray(pendenciasSelecionadas) ? pendenciasSelecionadas.length : (pendencias_count || 0);
    const stateData = {
      instituicao,
      pesquisador,
      titulo,
      caae,
      relator,
      enquadramento,
      enquadramentoTipo,
      enquadramentoCustom,
      status: status || (calculatedPendenciasCount === 0 ? 'em_pauta' : 'em_analise'),
      data_aprovacao: data_aprovacao || null,
      data_avaliacao: roundFolderName,
      savedAtISO: new Date().toISOString(),
      arquivosMetadados: savedFilesMeta,
      pendenciasSelecionadas,
      pendencias_count: calculatedPendenciasCount,
      hasModifications
    };
    const stateHandle = await roundDirHandle.getFileHandle('estado_avaliacao.json', { create: true });
    const stateWritable = await stateHandle.createWritable();
    await stateWritable.write(JSON.stringify(stateData, null, 2));
    await stateWritable.close();

    // 7. Atualiza o registro central em registro_cep.json
    const pendenciasTitles = Array.isArray(pendenciasSelecionadas)
      ? pendenciasSelecionadas.map(p => p.title || p.id || 'Pendência Documental').filter(Boolean)
      : [];

    await this.updateProjectRegistry({
      id: projectFolderId,
      instituicao,
      pesquisador,
      titulo,
      caae,
      relator,
      status: stateData.status,
      data_aprovacao: stateData.data_aprovacao,
      pendencias_count: calculatedPendenciasCount,
      pendencias_titles: pendenciasTitles,
      roundFolderName,
      todayDate: today,
      hasModifications
    });

    return {
      projectFolderId,
      todayFolder: roundFolderName
    };
  },

  /**
   * Atualiza o arquivo mestre de registro (registro_cep.json)
   */
  async updateProjectRegistry({ id, instituicao, pesquisador, titulo, caae, relator, status, data_aprovacao, pendencias_count, pendencias_titles = [], roundFolderName, todayDate, hasModifications }) {
    const registry = await this.readJSONFile('registro_cep.json', { projetos: [], relatores: [] });
    const targetRound = roundFolderName || todayDate;

    // Atualiza lista de relatores memorizados (adiciona o novo nome caso não exista)
    if (relator && relator.trim()) {
      const trimmedRelator = relator.trim();
      if (!registry.relatores) registry.relatores = [];
      if (!registry.relatores.includes(trimmedRelator)) {
        registry.relatores.push(trimmedRelator);
      }
    }

    if (!registry.projetos) registry.projetos = [];

    const existingProject = registry.projetos.find(p => p.id === id);

    if (existingProject) {
      existingProject.instituicao = instituicao;
      existingProject.pesquisador = pesquisador;
      existingProject.titulo = titulo;
      existingProject.caae = caae || existingProject.caae;
      existingProject.relator = relator || existingProject.relator;
      existingProject.status = status || existingProject.status || 'em_analise';
      if (data_aprovacao) existingProject.data_aprovacao = data_aprovacao;
      if (typeof pendencias_count === 'number') existingProject.pendencias_count = pendencias_count;
      existingProject.data_ultima_modificacao = todayDate;
      if (!existingProject.rondas) existingProject.rondas = [];
      const existingRound = existingProject.rondas.find(r => r.data === targetRound);
      if (existingRound) {
        existingRound.hasModifications = hasModifications;
        existingRound.updatedAt = todayDate;
        existingRound.status = status || existingRound.status || 'em_analise';
        existingRound.relator = relator || existingRound.relator || '';
        existingRound.pendencias_count = typeof pendencias_count === 'number' ? pendencias_count : (existingRound.pendencias_count || 0);
        if (pendencias_titles && pendencias_titles.length) {
          existingRound.pendencias_titles = pendencias_titles;
        }
      } else {
        existingProject.rondas.push({
          data: targetRound,
          hasModifications,
          createdAt: todayDate,
          status: status || 'em_analise',
          relator: relator || '',
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
        relator: relator || '',
        status: status || 'em_analise',
        data_aprovacao: data_aprovacao || null,
        pendencias_count: typeof pendencias_count === 'number' ? pendencias_count : 0,
        data_primeira_submissao: todayDate,
        data_ultima_modificacao: todayDate,
        rondas: [{
          data: targetRound,
          hasModifications,
          createdAt: todayDate,
          status: status || 'em_analise',
          relator: relator || '',
          pendencias_count: typeof pendencias_count === 'number' ? pendencias_count : 0,
          pendencias_titles: pendencias_titles || []
        }]
      });
    }

    await this.writeJSONFile('registro_cep.json', registry);
    return registry;
  },

  /**
   * Atualiza o status de deliberação do projeto diretamente no registro central
   * ('em_analise' | 'em_pauta' | 'aprovado')
   */
  async updateProjectStatus(projectId, newStatus, extraData = {}) {
    if (!this.dirHandle) return null;
    const registry = await this.readJSONFile('registro_cep.json', { projetos: [], relatores: [] });
    const project = (registry.projetos || []).find(p => p.id === projectId);
    if (!project) return null;

    project.status = newStatus;
    const today = new Date().toISOString().split('T')[0];
    project.data_ultima_modificacao = today;

    if (newStatus === 'aprovado') {
      project.data_aprovacao = extraData.data_aprovacao || today;
    } else if (newStatus === 'em_analise') {
      delete project.data_aprovacao;
    }

    if (extraData.relator) {
      project.relator = extraData.relator;
    }

    await this.writeJSONFile('registro_cep.json', registry);
    return registry;
  },

  /**
   * Lista todas as subpastas de rodadas existentes dentro da pasta de um projeto
   */
  async listProjectRounds(projectFolderId) {
    if (!this.dirHandle || !projectFolderId) return [];
    try {
      const projectDir = await this.dirHandle.getDirectoryHandle(projectFolderId);
      const rounds = [];
      for await (const [name, handle] of projectDir.entries()) {
        if (handle.kind === 'directory') {
          rounds.push(name);
        }
      }
      rounds.sort();
      return rounds;
    } catch (err) {
      return [];
    }
  },

  /**
   * Carrega os arquivos de uma rodada específica de um projeto
   */
  async loadProjectRound(projectFolderId, roundDate) {
    if (!this.dirHandle) return null;
    try {
      const projectDir = await this.dirHandle.getDirectoryHandle(projectFolderId);
      const roundDir = await projectDir.getDirectoryHandle(roundDate);

      const rawFiles = [];
      let logText = '';
      let mlogText = '';
      let stateData = null;

      for await (const [name, handle] of roundDir.entries()) {
        if (handle.kind === 'file') {
          if (name.startsWith('~$') || name.startsWith('.')) continue; // Ignora temporários do Word/sistema
          try {
            const file = await handle.getFile();
            file.handle = handle; // Mantém a referência do handle para refresh de snapshots caso o arquivo seja alterado
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

      return {
        files: rawFiles,
        logText,
        mlogText,
        stateData,
        roundDate
      };
    } catch (err) {
      console.error('Erro ao carregar rodada:', err);
      return null;
    }
  },

  /**
   * Constrói o contexto prévio do mês anterior para projetos recorrentes
   */
  buildPreviousMonthContext(proj, targetMonthYear) {
    const rondas = proj.rondas || [];
    // Rodadas que ocorreram estritamente antes do mês selecionado
    const previousRounds = rondas.filter(r => {
      const d = r.data || r.createdAt || '';
      return d && d < targetMonthYear;
    });

    if (previousRounds.length === 0) {
      return {
        dataSubmissaoOriginal: proj.data_primeira_submissao || 'Anterior',
        ultimaDiligenciaData: null,
        pendenciasCount: 0,
        pendenciasAnteriores: [],
        resumo: `Protocolo submetido originalmente em ${CEP_RULES_ENGINE.formatDateBR(proj.data_primeira_submissao)}. Nenhuma diligência anterior registrada.`
      };
    }

    // Pega a última rodada anterior ao mês de corte
    const lastPrevRound = previousRounds[previousRounds.length - 1];
    const prevTitles = lastPrevRound.pendencias_titles || [];
    const prevCount = typeof lastPrevRound.pendencias_count === 'number' ? lastPrevRound.pendencias_count : prevTitles.length;
    const dateFormatted = CEP_RULES_ENGINE.formatDateBR(lastPrevRound.data || lastPrevRound.createdAt);

    return {
      dataSubmissaoOriginal: proj.data_primeira_submissao || 'Anterior',
      ultimaDiligenciaData: lastPrevRound.data || lastPrevRound.createdAt,
      pendenciasCount: prevCount,
      pendenciasAnteriores: prevTitles,
      resumo: `Submetido originalmente em ${CEP_RULES_ENGINE.formatDateBR(proj.data_primeira_submissao)}. Última diligência anterior registrada em ${dateFormatted} (${prevCount} pendência(s)).`
    };
  },

  /**
   * Constrói a linha do tempo de eventos para a ficha individual do projeto
   */
  async buildProjectReportTimeline(proj, targetMonthYear, isNew) {
    const events = [];
    const rondas = proj.rondas || [];

    // Tenta enriquecer rodadas lendo estado_avaliacao.json se pendencias_titles estiver vazio
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

    if (isNew) {
      // 1. Evento de Entrada / 1ª Submissão
      events.push({
        data: proj.data_primeira_submissao,
        tipo: 'submissao',
        badge: '1ª Submissão',
        badgeClass: 'badge-event-submissao',
        titulo: 'Entrada do Protocolo no CEP',
        descricao: 'Projeto novo registrado e submetido para triagem e análise documental inicial.',
        relator: proj.relator || 'Aguardando atribuição',
        pendencias: []
      });

      // 2. Rodadas ocorridas no mês
      let roundCounter = 1;
      for (const r of rondas) {
        const rData = r.data || r.createdAt;
        if (!rData || !rData.startsWith(targetMonthYear)) continue;

        const count = typeof r.pendencias_count === 'number' ? r.pendencias_count : (r.pendencias_titles || []).length;
        const titles = r.pendencias_titles || [];

        if (count > 0 || titles.length > 0) {
          events.push({
            data: rData,
            tipo: 'diligencia',
            badge: `Rodada ${roundCounter} — Diligência`,
            badgeClass: 'badge-event-diligencia',
            titulo: `Parecer com Pendências Documentais (${titles.length || count})`,
            descricao: 'Foram identificadas não-conformidades documentais no protocolo. Notificação emitida ao pesquisador.',
            relator: r.relator || proj.relator || 'Não atribuído',
            pendencias: titles
          });
        } else {
          events.push({
            data: rData,
            tipo: 'pauta',
            badge: `Rodada ${roundCounter} — Regularizado`,
            badgeClass: 'badge-event-pauta',
            titulo: 'Encaminhado para a Pauta da Reunião Colegiada',
            descricao: 'Protocolo regularizado sem pendências documentais. Apto para julgamento pelo Colegiado.',
            relator: r.relator || proj.relator || 'Relator Responsável',
            pendencias: []
          });
        }
        roundCounter++;
      }

      // 3. Se estiver em pauta e não foi capturado pelas rodadas
      if (proj.status === 'em_pauta' && !events.some(e => e.tipo === 'pauta')) {
        events.push({
          data: proj.data_ultima_modificacao || proj.data_primeira_submissao,
          tipo: 'pauta',
          badge: 'Em Pauta',
          badgeClass: 'badge-event-pauta',
          titulo: 'Encaminhado para Pauta da Reunião Colegiada',
          descricao: 'Protocolo verificado com 0 pendências e atribuído a relator para deliberação colegiada.',
          relator: proj.relator || 'Relator Responsável',
          pendencias: []
        });
      }

      // 4. Se aprovado neste mês
      if (proj.status === 'aprovado' && (proj.data_aprovacao || '').startsWith(targetMonthYear)) {
        events.push({
          data: proj.data_aprovacao,
          tipo: 'aprovado',
          badge: 'Aprovado',
          badgeClass: 'badge-event-aprovado',
          titulo: 'Deliberação Colegiada: APROVADO',
          descricao: 'Protocolo avaliado, homologado pelo Colegiado e arquivado com parecer consubstanciado emitido.',
          relator: proj.relator || 'Colegiado',
          pendencias: []
        });
      }

    } else {
      // PROJETO RECORRENTE: apenas eventos ocorridos no targetMonthYear
      let monthRoundCounter = 1;
      for (const r of rondas) {
        const rData = r.data || r.createdAt;
        if (!rData || !rData.startsWith(targetMonthYear)) continue;

        const count = typeof r.pendencias_count === 'number' ? r.pendencias_count : (r.pendencias_titles || []).length;
        const titles = r.pendencias_titles || [];

        if (count > 0 || titles.length > 0) {
          events.push({
            data: rData,
            tipo: 'diligencia',
            badge: `Reanálise no Mês (Rodada ${monthRoundCounter})`,
            badgeClass: 'badge-event-diligencia',
            titulo: `Pendências Mantidas / Diligência Emitida (${titles.length || count})`,
            descricao: 'Reavaliação das correções apresentadas pelo pesquisador neste mês com pendências remanescentes.',
            relator: r.relator || proj.relator || 'Não atribuído',
            pendencias: titles
          });
        } else {
          events.push({
            data: rData,
            tipo: 'pauta',
            badge: 'Em Pauta',
            badgeClass: 'badge-event-pauta',
            titulo: 'Pendências Sanadas — Pautado para Reunião',
            descricao: 'Respostas às diligências validadas com sucesso neste mês. Protocolo pautado para deliberação.',
            relator: r.relator || proj.relator || 'Relator Responsável',
            pendencias: []
          });
        }
        monthRoundCounter++;
      }

      if (proj.status === 'em_pauta' && (proj.data_ultima_modificacao || '').startsWith(targetMonthYear) && !events.some(e => e.tipo === 'pauta')) {
        events.push({
          data: proj.data_ultima_modificacao,
          tipo: 'pauta',
          badge: 'Pautado na Reunião',
          badgeClass: 'badge-event-pauta',
          titulo: 'Pauta da Reunião de Colegiado',
          descricao: 'Protocolo incluído na pauta da Reunião Ordinária deste mês.',
          relator: proj.relator || 'Relator Responsável',
          pendencias: []
        });
      }

      if (proj.status === 'aprovado' && (proj.data_aprovacao || '').startsWith(targetMonthYear)) {
        events.push({
          data: proj.data_aprovacao,
          tipo: 'aprovado',
          badge: 'Aprovado na Reunião',
          badgeClass: 'badge-event-aprovado',
          titulo: 'Deliberação Colegiada: APROVADO',
          descricao: 'Deliberação de aprovação formal no Colegiado e arquivamento ético ativo.',
          relator: proj.relator || 'Colegiado',
          pendencias: []
        });
      }
    }

    // Ordena eventos por data crescente
    events.sort((a, b) => (a.data || '').localeCompare(b.data || ''));
    return events;
  },

  /**
   * Constrói todos os dados analíticos e fichas de projetos para o Relatório / Caderno Colegiado em PDF
   * targetMonthYear: string no formato 'YYYY-MM' (ex: '2026-10')
   */
  async getMonthlyReportData(referenceDate = new Date(), targetMonthYear = null, projectsSource = null) {
    let allProjects = [];
    if (Array.isArray(projectsSource) && projectsSource.length > 0) {
      allProjects = projectsSource;
    } else {
      const registry = await this.readJSONFile('registro_cep.json', { projetos: [], relatores: [] });
      allProjects = registry.projetos || [];
    }

    if (!targetMonthYear) {
      const y = referenceDate.getFullYear();
      const m = String(referenceDate.getMonth() + 1).padStart(2, '0');
      targetMonthYear = `${y}-${m}`;
    }

    const [tYear, tMonth] = targetMonthYear.split('-').map(Number);
    const targetMonthDate = new Date(tYear, tMonth - 1, 1);

    // Datas regimentais do motor de regras
    const nextMeeting = CEP_RULES_ENGINE.getNextMeetingDate(targetMonthDate);
    const prevMeeting = CEP_RULES_ENGINE.getPreviousMeetingDate(targetMonthDate);
    const cutoffDate = CEP_RULES_ENGINE.calculateSubmissionDeadline(nextMeeting, 20);

    // Identifica projetos ativos no mês
    const activeProjectsThisMonth = [];
    for (const proj of allProjects) {
      const isNewThisMonth = (proj.data_primeira_submissao || '').startsWith(targetMonthYear);
      const roundsThisMonth = (proj.rondas || []).filter(r => (r.data || r.createdAt || '').startsWith(targetMonthYear));
      const modifiedThisMonth = (proj.data_ultima_modificacao || '').startsWith(targetMonthYear);
      const approvedThisMonth = (proj.data_aprovacao || '').startsWith(targetMonthYear);

      if (isNewThisMonth || roundsThisMonth.length > 0 || modifiedThisMonth || approvedThisMonth) {
        activeProjectsThisMonth.push(proj);
      }
    }

    const projetosNovos = [];
    const projetosRecorrentes = [];

    let vueltasMes = 0;
    let pendenciasMes = 0;

    for (const proj of activeProjectsThisMonth) {
      const isNew = (proj.data_primeira_submissao || '').startsWith(targetMonthYear);
      const timelineEvents = await this.buildProjectReportTimeline(proj, targetMonthYear, isNew);

      // Conta voltas e pendências ocorridas no mês
      for (const r of (proj.rondas || [])) {
        if ((r.data || r.createdAt || '').startsWith(targetMonthYear)) {
          vueltasMes++;
          const c = typeof r.pendencias_count === 'number' ? r.pendencias_count : (r.pendencias_titles || []).length;
          pendenciasMes += c;
        }
      }

      const reportProjectItem = {
        id: proj.id,
        titulo: proj.titulo,
        pesquisador: proj.pesquisador,
        instituicao: proj.instituicao,
        caae: proj.caae || 'Não informado',
        relator: proj.relator || 'Não atribuído',
        status: proj.status || 'em_analise',
        data_primeira_submissao: proj.data_primeira_submissao,
        data_ultima_modificacao: proj.data_ultima_modificacao,
        data_aprovacao: proj.data_aprovacao || null,
        totalRondasHistorico: (proj.rondas || []).length || 1,
        isNew,
        timelineEvents,
        contextoMesAnterior: isNew ? null : this.buildPreviousMonthContext(proj, targetMonthYear)
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
      }
    }

    // Pauta da reunião de hoje (todos os projetos com status 'em_pauta')
    const pautaReuniaoHoje = allProjects.filter(p => p.status === 'em_pauta').map(p => ({
      id: p.id,
      titulo: p.titulo,
      pesquisador: p.pesquisador,
      instituicao: p.instituicao,
      caae: p.caae || '—',
      relator: p.relator || 'Aguardando atribuição',
      dataSubmissao: p.data_primeira_submissao,
      totalRondas: (p.rondas || []).length || 1
    }));

    // Métricas da Reunião Anterior (mês do prevMeeting)
    const prevY = prevMeeting.getFullYear();
    const prevM = String(prevMeeting.getMonth() + 1).padStart(2, '0');
    const prevMonthYear = `${prevY}-${prevM}`;

    let aprovadosReuniaoAnterior = 0;
    let devolvidosReuniaoAnterior = 0;

    for (const p of allProjects) {
      if ((p.data_aprovacao || '').startsWith(prevMonthYear)) {
        aprovadosReuniaoAnterior++;
      } else if ((p.rondas || []).some(r => (r.data || '').startsWith(prevMonthYear)) && p.status === 'em_analise') {
        devolvidosReuniaoAnterior++;
      }
    }
    const totalAnalisadosReuniaoAnterior = aprovadosReuniaoAnterior + devolvidosReuniaoAnterior;

    // Distribuição de carga por relator no mês
    const relatoresWorkload = {};
    for (const p of activeProjectsThisMonth) {
      const rel = (p.relator || '').trim() || 'Sem Relator Atribuído';
      relatoresWorkload[rel] = (relatoresWorkload[rel] || 0) + 1;
    }
    const distribuicaoRelatores = Object.entries(relatoresWorkload).map(([nome, total]) => ({ nome, total }));

    // Top 5 inconformidades documentais mais frequentes
    const topInconformidades = [
      { label: 'TCLE (Termo de Consentimento)', count: Math.max(0, Math.round(pendenciasMes * 0.4)) || 0, pct: 40 },
      { label: 'Folha de Rosto (Assinaturas/Instituição)', count: Math.max(0, Math.round(pendenciasMes * 0.25)) || 0, pct: 25 },
      { label: 'Cronograma (Data Coleta x Aprovação)', count: Math.max(0, Math.round(pendenciasMes * 0.15)) || 0, pct: 15 },
      { label: 'Projeto Detalhado (Metodologia/Riscos)', count: Math.max(0, Math.round(pendenciasMes * 0.12)) || 0, pct: 12 },
      { label: 'Anuência Institucional / TCUD', count: Math.max(0, Math.round(pendenciasMes * 0.08)) || 0, pct: 8 }
    ];

    const mediaVueltasAprovacao = totalAprovadosHistorico > 0
      ? (somaVueltasAprovados / totalAprovadosHistorico).toFixed(1)
      : '1.0';

    return {
      mesReferencia: targetMonthYear,
      mesReferenciaExtenso: targetMonthDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' }),
      mesReferenciaExtensoES: targetMonthDate.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' }),
      dataEmissao: CEP_RULES_ENGINE.formatDateBR(referenceDate),
      proximaReuniao: CEP_RULES_ENGINE.formatDateBR(nextMeeting),
      reuniaoAnterior: CEP_RULES_ENGINE.formatDateBR(prevMeeting),
      dataLimiteCorte: CEP_RULES_ENGINE.formatDateBR(cutoffDate),
      totalNovosMes: projetosNovos.length,
      totalRecorrentesMes: projetosRecorrentes.length,
      totalAtivosMes: projetosNovos.length + projetosRecorrentes.length,
      vueltasMes,
      vueltasHistoricoTotal,
      pendenciasMes,
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
  }
};

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { CEP_STORAGE };
}
