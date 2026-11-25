/**
 * APP.JS
 * Controlador Principal da Aplicação Vue.js 3
 * Orquestra Persistência (Schema v2), Hash SHA-256 & Versionamento, Histórico de Pendências,
 * Visor Multiformato (.pdf, .docx, .doc OLE2), Calendário Dinâmico de Reuniões e Relatórios
 */

const { createApp, ref, reactive, computed, onMounted, nextTick } = Vue;

const DOC_TYPES_CATALOG = [
  { value: 'Folha_de_Rosto', label: 'Folha de Rosto', label_es: 'Hoja de Rostro' },
  { value: 'Informacoes_Basicas_do_Projeto', label: 'Informações Básicas do Projeto', label_es: 'Informaciones Básicas del Proyecto' },
  { value: 'Projeto_Detalhado', label: 'Resumo / Projeto Detalhado', label_es: 'Resumen / Proyecto Detallado' },
  { value: 'TCLE', label: 'TCLE (Consentimento)', label_es: 'TCLE (Consentimiento)' },
  { value: 'TCLE_dos_Pais', label: 'TCLE dos Pais / Responsáveis', label_es: 'TCLE de Padres / Tutores' },
  { value: 'TALE', label: 'TALE (Assentimento Menores)', label_es: 'TALE (Asentimiento Menores)' },
  { value: 'Cronograma', label: 'Cronograma de Execução', label_es: 'Cronograma de Ejecución' },
  { value: 'Orcamento', label: 'Orçamento Financeiro', label_es: 'Presupuesto Financiero' },
  { value: 'Termo_de_Anuencia', label: 'Termo de Anuência Institucional', label_es: 'Autorización Institucional (Anuencia)' },
  { value: 'TCUD', label: 'TCUD (Banco de Dados / Prontuários)', label_es: 'TCUD (Base de Datos / Historias)' },
  { value: 'Instrumento_Coleta', label: 'Instrumento de Coleta / Questionário', label_es: 'Instrumento de Recolección / Cuestionario' },
  { value: 'Carta_Resposta', label: 'Carta Resposta de Pendências', label_es: 'Carta de Respuesta de Pendencias' },
  { value: 'Outro', label: 'Outro (especificar)', label_es: 'Otro (especificar)' }
];

const PROJECT_TYPES_CATALOG = [
  { value: 'Projeto_Detalhado', i18nKey: 'tipoProjDetalhado' },
  { value: 'Informacoes_Basicas', i18nKey: 'tipoProjInfoBasicas' },
  { value: 'Relato_de_Caso', i18nKey: 'tipoProjRelatoCaso' },
  { value: 'Emenda', i18nKey: 'tipoProjEmenda' },
  { value: 'Outro', i18nKey: 'tipoProjOutro' }
];

const SPECIAL_AREAS_CATALOG = [
  { value: 'geral', i18nKey: 'enqGeneral' },
  { value: 'menores', i18nKey: 'enqMinor' },
  { value: 'bancoDados', i18nKey: 'enqDatabase' },
  { value: 'indigena', i18nKey: 'enqIndigenous' },
  { value: 'ambienteVirtual', i18nKey: 'areaVirtual' },
  { value: 'genetica', i18nKey: 'areaGenetica' },
  { value: 'reproducao', i18nKey: 'areaReproducao' },
  { value: 'equipamentos', i18nKey: 'areaEquipamentos' },
  { value: 'biosseguranca', i18nKey: 'areaBiosseguranca' },
  { value: 'origemEstrangeira', i18nKey: 'areaEstrangeira' },
  { value: 'nenhum', i18nKey: 'enqNone' },
  { value: 'outro', i18nKey: 'enqOther' }
];

const MISSING_CATEGORY_CHECKBOX_ITEMS = [
  { id: 'Folha_de_Rosto', pt: 'Folha de Rosto', es: 'Hoja de Rostro' },
  { id: 'Informacoes_Basicas_do_Projeto', pt: 'Informações Básicas do Projeto', es: 'Informaciones Básicas del Proyecto' },
  { id: 'Projeto_Detalhado', pt: 'Projeto Detalhado', es: 'Proyecto Detallado' },
  { id: 'TCLE', pt: 'TCLE (Termo de Consentimento)', es: 'TCLE (Consentimiento)' },
  { id: 'TCLE_dos_Pais', pt: 'TCLE dos Pais / Responsáveis', es: 'TCLE de Padres / Tutores' },
  { id: 'TALE', pt: 'TALE (Termo de Assentimento)', es: 'TALE (Asentimiento)' },
  { id: 'Cronograma', pt: 'Cronograma de Execução', es: 'Cronograma de Ejecución' },
  { id: 'Orcamento', pt: 'Orçamento Financeiro', es: 'Presupuesto Financiero' },
  { id: 'Termo_de_Anuencia', pt: 'Termo de Anuência Institucional', es: 'Autorización Institucional' },
  { id: 'TCUD', pt: 'TCUD (Banco de Dados / Prontuários)', es: 'TCUD (Base de Datos)' },
  { id: 'Instrumento_Coleta', pt: 'Instrumento de Coleta / Questionário', es: 'Instrumento de Recolección / Cuestionario' },
  { id: 'Termo_Compromisso', pt: 'Declaração / Termo de Compromisso do Pesquisador', es: 'Término de Compromiso del Investigador' },
  { id: 'Dispensa_TCLE', pt: 'Justificativa de Dispensa de TCLE', es: 'Justificación de Exención de TCLE' },
  { id: 'Carta_Resposta', pt: 'Carta Resposta de Pendências', es: 'Carta de Respuesta de Pendencias' }
];

const app = createApp({
  setup() {
    // --- ESTADO GERAL E CONFIGURAÇÕES ---
    const currentLang = ref('pt-BR');
    const isDarkMode = ref(false);
    const folderConnected = ref(false);
    const folderName = ref('');
    const currentView = ref('history'); // 'history' | 'workspace'
    const isSaving = ref(false);

    const docTypesCatalog = ref(DOC_TYPES_CATALOG);
    const projectTypesCatalog = ref(PROJECT_TYPES_CATALOG);
    const specialAreasCatalog = ref(SPECIAL_AREAS_CATALOG);
    const missingCategoryOptions = ref(MISSING_CATEGORY_CHECKBOX_ITEMS);

    // Contador reativo para forçar recálculo imediato quando datas de reuniões forem reprogramadas
    const meetingsVersion = ref(0);

    // Configurações Institucionais do CEP
    const config = reactive({
      nomeCep: 'Comitê de Ética em Pesquisa - CEP UCDB',
      instituicao: 'Universidade Católica Dom Bosco',
      endereco: 'Av. Tamandaré, 6000, Jardim Seminário - CEP: 79117-900 - Campo Grande - MS',
      telefone: '(67) 3312-3478',
      email: 'cep@ucdb.br',
      horario: '13h às 17h',
      site: 'https://site.ucdb.br/institucional/1/comites/2522/cep/2523/',
      meetingRule: 'last_thursday',
      cutoffDays: 20,
      meetingOverrides: {}
    });

    // Aba ativa dentro do Modal de Configurações ('instituicao' | 'pendencias' | 'reunioes' | 'instituicoes')
    const configTab = ref('instituicao');
    const meetingCalendarYear = ref(new Date().getFullYear());

    // Formulário para criar Nova Categoria e Nova Pendência nas Configurações
    const newCategoryName = ref('');
    const newPendenciaForm = reactive({
      categoryId: 'geral',
      title: '',
      normativa: '',
      template: ''
    });

    // Memória Dinâmica de Relatores e Catálogo Persistente de Instituições (inicia vazio)
    const savedRelatores = ref([]);
    const savedInstituicoes = ref([]);
    const newCatalogInstitutionInput = ref('');
    const showInstSuggestionsNewProj = ref(false);
    const showInstSuggestionsWorkspace = ref(false);
    const showWorkspaceAreasPopover = ref(false);

    // Categorias e Pendências
    const availableCategories = ref(JSON.parse(JSON.stringify(DEFAULT_PENDENCIAS_CATEGORIES)));
    const activeCategoryTab = ref('geral');
    const selectedPendencias = ref([]);
    const pendenciaSearchQuery = ref('');

    // Tabela Histórica e Ordenação FIFO
    const projectsList = ref([]);
    const searchFilter = ref('');
    const statusFilter = ref('todos'); // 'todos' | 'em_analise' | 'ainda_nao_relatado' | 'em_relatoria' | 'em_pauta' | 'aprovado'
    const sortField = ref('data_primeira_submissao');
    const sortAsc = ref(true);

    // Navegação Principal da Tela Inicial ('historico' | 'dashboard')
    const mainScreenView = ref('historico');
    const dashboardPeriod = ref('ciclo');

    // Modal de Deliberação Colegiada para projetos em pauta
    const showDeliberationModal = ref(false);
    const projectToDeliberate = ref(null);

    // Modal e Dados do Caderno / Relatório Colegiado em PDF (com rango personalizado e atalhos)
    const showReportModal = ref(false);
    const reportData = ref(null);
    const isGeneratingReport = ref(false);
    const reportPreset = ref('1m'); // '1m' | '2m' | '3m' | '1y' | 'ciclo' | 'custom'
    const reportStartDate = ref('');
    const reportEndDate = ref('');

    // Projeto Ativo na Mesa de Trabalho
    const activeProject = reactive({
      id: '',
      caae: '',
      instituicao: '',
      pesquisador: '',
      titulo: '',
      relator: '',
      tipoProjeto: 'Projeto_Detalhado',
      areasTematicas: ['geral'],
      status: 'em_analise',
      data_aprovacao: null,
      enquadramentoTipo: 'geral',
      enquadramentoCustom: '',
      enquadramento: {
        geral: true,
        menores: false,
        bancoDados: false,
        indigena: false
      },
      pendencyHistory: []
    });

    // Controle de Rodadas / Pastas de Versão
    const targetRoundFolder = ref(new Date().toISOString().split('T')[0]);
    const loadedFromRound = ref('');
    const projectRoundsHistory = ref([]);

    // Form do Modal de Novo Projeto (Relator inicia como '' = "Sem Relator" por padrão)
    const showNewProjectModal = ref(false);
    const newProjectForm = reactive({
      instituicao: '',
      pesquisador: '',
      titulo: '',
      caae: '',
      relator: '', // Sem Relator por padrão
      tipoProjeto: 'Projeto_Detalhado',
      areasTematicas: ['geral'],
      enquadramentoTipo: 'geral',
      enquadramentoCustom: '',
      enquadramento: {
        geral: true,
        menores: false,
        bancoDados: false,
        indigena: false
      }
    });
    const newProjectFiles = ref([]);

    // Documentos da Rodada Atual e Modais de Gestão / Upload SHA-256 / Detalhes / Histórico de Pendências
    const activeDocuments = ref([]);
    const selectedDocumentIndex = ref(0);
    const showDocumentsModal = ref(false);
    const showConfigModal = ref(false);
    const replacingDocIndex = ref(-1);

    // Fase 1: Modal de Upload com Hash SHA-256 (Opção A: Nova Versão vs Opção B: Novo Documento)
    const showUploadFlowModal = ref(false);
    const pendingUploadContext = ref('workspace'); // 'workspace' | 'newProject'
    const pendingUploadQueue = ref([]);
    const showDuplicateHashModal = ref(false);
    const duplicateHashInfo = ref(null);

    // Fase 1: Modal de Detalhe do Documento (Nomes Anteriores, Hash SHA-256, Versões e Pendências Herdadas)
    const showDocDetailModal = ref(false);
    const inspectedDocIndex = ref(-1);
    const renameDocInput = ref('');

    // Fase 1: Modal de Histórico de Pendências por Data Exata / Período e Documento
    const showPendencyHistoryModal = ref(false);
    const phFilterDocId = ref('ALL');
    const phFilterMode = ref('all'); // 'all' | 'exact' | 'range'
    const phExactDate = ref(new Date().toISOString().split('T')[0]);
    const phStartDate = ref('');
    const phEndDate = ref('');

    // Controles do Visor de Documentos
    const viewerCurrentPage = ref(1);
    const viewerTotalPages = ref(1);
    const viewerZoomPercent = ref(100);
    const viewerSearchTerm = ref('');
    const viewerCaseSensitive = ref(false);
    const viewerAccentSensitive = ref(false);
    const viewerMatchesCount = ref(0);
    const viewerCurrentMatch = ref(0);
    const viewerContainer = ref(null);
    const viewerSearchInput = ref(null);
    const folderFileInput = ref(null);
    const multiFileInput = ref(null);
    const replaceFileInput = ref(null);

    // Resizable Splitter
    const leftPaneWidth = ref(54);
    const isDraggingSplitter = ref(false);

    // Aba Resumo e Logs
    const officialGeneratedLog = ref('');
    const editableLogText = ref('');
    const hasManualEdits = ref(false);

    const todayDateString = computed(() => {
      return CEP_RULES_ENGINE.formatDateISO(new Date());
    });

    // --- INTERNACIONALIZAÇÃO ---
    const t = (key) => {
      const dict = I18N_DICTIONARY[currentLang.value] || I18N_DICTIONARY['pt-BR'];
      return dict[key] || key;
    };

    const setLanguage = (lang) => {
      currentLang.value = lang;
      localStorage.setItem('cep_lang', lang);
    };

    const formatDateBR = (dateStr) => {
      if (!dateStr) return '—';
      const cleanDate = String(dateStr).split('_')[0];
      const formatted = CEP_RULES_ENGINE.formatDateBR(cleanDate);
      return String(dateStr).includes('_') ? `${formatted} (${String(dateStr).split('_').slice(1).join('_')})` : formatted;
    };

    const formatDateTimeBR = (isoStr) => {
      if (!isoStr) return '—';
      const d = new Date(isoStr);
      if (isNaN(d.getTime())) return formatDateBR(isoStr);
      const dd = String(d.getDate()).padStart(2, '0');
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const yyyy = d.getFullYear();
      const hh = String(d.getHours()).padStart(2, '0');
      const min = String(d.getMinutes()).padStart(2, '0');
      return `${dd}/${mm}/${yyyy} ${hh}:${min}`;
    };

    const displayRelatorName = (rel) => {
      const clean = CEP_STORAGE.normalizeRelatorValue(rel);
      return clean || t('semRelator');
    };

    const getDocTypeLabel = (typeVal, customName = '') => {
      if (typeVal === 'Outro' && customName) return customName;
      const found = DOC_TYPES_CATALOG.find(d => d.value === typeVal);
      if (!found) return typeVal || 'Documento';
      return currentLang.value === 'es' ? found.label_es : found.label;
    };

    const getStatusLabel = (st) => {
      if (st === 'ainda_nao_relatado') return t('statusAindaNaoRelatado');
      if (st === 'em_relatoria') return t('statusEmRelatoria');
      if (st === 'em_pauta') return t('statusEmPauta');
      if (st === 'aprovado') return t('statusAprovado');
      return t('statusEmAnalise');
    };

    // --- NAVEGAÇÃO E HISTORY API ---
    const pushNavState = (stateObj) => {
      try {
        const cur = history.state;
        if (cur && cur.name === stateObj.name && cur.type === stateObj.type) return;
        history.pushState(stateObj, '');
      } catch (e) {}
    };

    const closeReportModal = () => { showReportModal.value = false; };
    const closeNewProjectModal = () => { showNewProjectModal.value = false; };
    const closeConfigModal = () => { showConfigModal.value = false; };
    const closeDocumentsModal = () => { showDocumentsModal.value = false; };
    const closeDeliberationModal = () => { showDeliberationModal.value = false; };
    const closeUploadFlowModal = () => {
      showUploadFlowModal.value = false;
      pendingUploadQueue.value = [];
      replacingDocIndex.value = -1;
    };
    const closeDuplicateHashModal = () => {
      showDuplicateHashModal.value = false;
      duplicateHashInfo.value = null;
      replacingDocIndex.value = -1;
    };
    const closeDocDetailModal = () => {
      showDocDetailModal.value = false;
      inspectedDocIndex.value = -1;
    };
    const closePendencyHistoryModal = () => {
      showPendencyHistoryModal.value = false;
    };

    const returnToHistoryView = () => {
      showWorkspaceAreasPopover.value = false;
      if (history.state && history.state.name === 'workspace') {
        history.back();
      } else {
        currentView.value = 'history';
      }
    };

    // --- CALENDÁRIO DINÂMICO E DATAS REPROGRAMÁVEIS (FASE 4) ---
    const syncMeetingsToEngine = () => {
      CEP_RULES_ENGINE.setMeetingOverrides(config.meetingOverrides || {});
      meetingsVersion.value++;
    };

    const calculatedDatesInfo = computed(() => {
      void meetingsVersion.value; // Dependência reativa explícita
      const now = new Date();
      const meeting = CEP_RULES_ENGINE.getNextMeetingDate(now, config.meetingOverrides);
      const prevMeeting = CEP_RULES_ENGINE.getPreviousMeetingDate(now, config.meetingOverrides);
      const cutoffDate = CEP_RULES_ENGINE.calculateSubmissionDeadline(meeting, config.cutoffDays || 20);
      const collection = CEP_RULES_ENGINE.calculateCollectionStartDate(meeting);
      const deadline = CEP_RULES_ENGINE.calculateDiligenceDeadline(now, 10);
      const diffTime = meeting.getTime() - now.getTime();
      const diffDays = Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
      const intervalDays = CEP_RULES_ENGINE.getMeetingCycleIntervalDays(now, config.meetingOverrides);

      return {
        reuniao: CEP_RULES_ENGINE.formatDateBR(meeting),
        proximaReuniao: CEP_RULES_ENGINE.formatDateBR(meeting),
        reuniaoAnterior: CEP_RULES_ENGINE.formatDateBR(prevMeeting),
        dataLimiteEnvio: CEP_RULES_ENGINE.formatDateBR(cutoffDate),
        diasAteReuniao: diffDays,
        intervaloCicloDias: intervalDays,
        coleta: CEP_RULES_ENGINE.formatDateBR(collection),
        prazo: CEP_RULES_ENGINE.formatDateBR(deadline)
      };
    });

    const meetingCalendarRows = computed(() => {
      void meetingsVersion.value;
      const year = meetingCalendarYear.value;
      const rows = [];
      for (let m = 0; m < 12; m++) {
        const key = `${year}-${String(m + 1).padStart(2, '0')}`;
        const monthDateObj = new Date(year, m, 1);
        const monthLabel = monthDateObj.toLocaleDateString(currentLang.value === 'es' ? 'es-ES' : 'pt-BR', { month: 'long' });
        const defDate = CEP_RULES_ENGINE.getDefaultMeetingForMonth(year, m);
        const defIso = defDate ? CEP_RULES_ENGINE.formatDateISO(defDate) : '';
        const ov = (config.meetingOverrides && config.meetingOverrides[key]) ? config.meetingOverrides[key] : null;
        const isCancelled = ov && typeof ov === 'object' ? Boolean(ov.cancelled) : false;
        const customIso = ov ? (typeof ov === 'string' ? ov : (ov.date || '')) : '';
        const effectiveDate = CEP_RULES_ENGINE.getScheduledMeetingForMonth(year, m, config.meetingOverrides);
        const effectiveIso = effectiveDate ? CEP_RULES_ENGINE.formatDateISO(effectiveDate) : '';
        const note = (ov && typeof ov === 'object' && ov.note) ? ov.note : '';

        rows.push({
          key,
          monthIndex: m,
          monthLabel: monthLabel.charAt(0).toUpperCase() + monthLabel.slice(1),
          defaultIso: defIso,
          defaultFormatted: defDate ? CEP_RULES_ENGINE.formatDateBR(defDate) : (currentLang.value === 'es' ? 'Receso Regimental' : 'Recesso Regimental'),
          effectiveIso,
          effectiveFormatted: effectiveDate ? CEP_RULES_ENGINE.formatDateBR(effectiveDate) : (currentLang.value === 'es' ? 'Sin reunión / Postergada' : 'Sem reunião / Adiada'),
          customIso: customIso || effectiveIso,
          isCancelled,
          isOverridden: Boolean(ov),
          note
        });
      }
      return rows;
    });

    const onChangeMeetingDateOverride = async (slotKey, newIsoDate) => {
      if (!config.meetingOverrides) config.meetingOverrides = {};
      const prev = config.meetingOverrides[slotKey] || {};
      if (!newIsoDate) {
        delete config.meetingOverrides[slotKey];
      } else {
        config.meetingOverrides[slotKey] = {
          date: newIsoDate,
          cancelled: false,
          note: prev.note || ''
        };
      }
      syncMeetingsToEngine();
      await persistConfigAndOverrides();
      updateLogPreview();
    };

    const onToggleMeetingCancelled = async (slotKey, cancelled) => {
      if (!config.meetingOverrides) config.meetingOverrides = {};
      const prev = config.meetingOverrides[slotKey] || {};
      config.meetingOverrides[slotKey] = {
        date: cancelled ? '' : (prev.date || ''),
        cancelled: Boolean(cancelled),
        note: prev.note || ''
      };
      syncMeetingsToEngine();
      await persistConfigAndOverrides();
      updateLogPreview();
    };

    const onUpdateMeetingNote = async (slotKey, noteVal) => {
      if (!config.meetingOverrides) config.meetingOverrides = {};
      const prev = config.meetingOverrides[slotKey] || {};
      const [y, m] = slotKey.split('-').map(Number);
      const defDate = CEP_RULES_ENGINE.getDefaultMeetingForMonth(y, m - 1);
      config.meetingOverrides[slotKey] = {
        date: prev.date || (defDate ? CEP_RULES_ENGINE.formatDateISO(defDate) : ''),
        cancelled: Boolean(prev.cancelled),
        note: noteVal
      };
      syncMeetingsToEngine();
      await persistConfigAndOverrides();
    };

    const resetSingleMeetingOverride = async (slotKey) => {
      if (config.meetingOverrides && config.meetingOverrides[slotKey]) {
        delete config.meetingOverrides[slotKey];
        syncMeetingsToEngine();
        await persistConfigAndOverrides();
        updateLogPreview();
      }
    };

    // --- TEMA CLARO / ESCURO ---
    const applyTheme = (dark) => {
      isDarkMode.value = dark;
      if (dark) document.documentElement.classList.add('dark');
      else document.documentElement.classList.remove('dark');
      localStorage.setItem('cep_theme', dark ? 'dark' : 'light');
    };

    const toggleDarkMode = () => applyTheme(!isDarkMode.value);

    // --- CATÁLOGO DE INSTITUIÇÕES COM AUTOCOMPLETADO E ENTRADA LIVRE (FASE 5) ---
    const filteredInstSuggestionsNewProj = computed(() => {
      const q = (newProjectForm.instituicao || '').trim().toLowerCase();
      if (!savedInstituicoes.value.length) return [];
      if (!q) return savedInstituicoes.value.slice(0, 12);
      return savedInstituicoes.value.filter(inst => inst.toLowerCase().includes(q)).slice(0, 12);
    });

    const filteredInstSuggestionsWorkspace = computed(() => {
      const q = (activeProject.instituicao || '').trim().toLowerCase();
      if (!savedInstituicoes.value.length) return [];
      if (!q) return savedInstituicoes.value.slice(0, 12);
      return savedInstituicoes.value.filter(inst => inst.toLowerCase().includes(q)).slice(0, 12);
    });

    const isInstitutionInCatalog = (name) => {
      if (!name || !name.trim()) return false;
      const lower = name.trim().toLowerCase();
      return savedInstituicoes.value.some(i => i.toLowerCase() === lower);
    };

    const saveInstitutionToCatalog = async (name) => {
      if (!name || !name.trim()) return;
      const updated = await CEP_STORAGE.addInstitutionToCatalog(name.trim());
      savedInstituicoes.value = updated;
    };

    const addFromConfigInstitutionInput = async () => {
      if (!newCatalogInstitutionInput.value.trim()) return;
      await saveInstitutionToCatalog(newCatalogInstitutionInput.value.trim());
      newCatalogInstitutionInput.value = '';
    };

    const removeInstitutionFromCatalog = async (name) => {
      const updated = await CEP_STORAGE.removeInstitutionFromCatalog(name);
      savedInstituicoes.value = updated;
    };

    const selectInstitutionNewProj = (inst) => {
      newProjectForm.instituicao = inst;
      showInstSuggestionsNewProj.value = false;
    };

    const selectInstitutionWorkspace = (inst) => {
      activeProject.instituicao = inst;
      showInstSuggestionsWorkspace.value = false;
      updateLogPreview();
    };

    const hideInstDropdownDelayed = (target) => {
      setTimeout(() => {
        if (target === 'new') showInstSuggestionsNewProj.value = false;
        else showInstSuggestionsWorkspace.value = false;
      }, 180);
    };

    // --- MÚLTIPLAS ÁREAS TEMÁTICAS ESPECIAIS (FASE 2 - ITEM 10) ---
    const isAreaSelected = (targetObj, areaVal) => {
      if (!targetObj || !Array.isArray(targetObj.areasTematicas)) return false;
      return targetObj.areasTematicas.includes(areaVal);
    };

    const toggleAreaTematica = (targetObj, areaVal) => {
      if (!targetObj) return;
      if (!Array.isArray(targetObj.areasTematicas)) {
        targetObj.areasTematicas = ['geral'];
      }

      if (areaVal === 'nenhum') {
        targetObj.areasTematicas = ['nenhum'];
      } else {
        let next = targetObj.areasTematicas.filter(a => a !== 'nenhum');
        if (next.includes(areaVal)) {
          next = next.filter(a => a !== areaVal);
        } else {
          next.push(areaVal);
        }
        if (next.length === 0) next = ['geral'];
        targetObj.areasTematicas = next;
      }

      const legacy = CEP_STORAGE.buildLegacyEnquadramentoFromAreas(targetObj.areasTematicas);
      targetObj.enquadramento = legacy.enquadramento;
      targetObj.enquadramentoTipo = legacy.enquadramentoTipo;
      if (!targetObj.areasTematicas.includes('outro')) {
        targetObj.enquadramentoCustom = '';
      }
      updateLogPreview();
    };

    const formatAreasSummary = (areas = []) => {
      if (!Array.isArray(areas) || areas.length === 0) return t('enqGeneral');
      const labels = areas.map(a => {
        const found = SPECIAL_AREAS_CATALOG.find(item => item.value === a);
        return found ? t(found.i18nKey) : a;
      });
      if (labels.length === 1) return labels[0];
      return `${labels.length} áreas: ${labels.slice(0, 2).join(', ')}${labels.length > 2 ? '...' : ''}`;
    };

    // --- VÍNCULO MULTIDOCUMENTO ENTRE PENDÊNCIAS E DOCUMENTOS (FASE 2 - ITEM 6) ---
    const inferDocTypeFromPendencia = (pend, catId) => {
      if (catId === 'folha_rosto' || (pend.id && pend.id.startsWith('P-FR'))) return 'Folha_de_Rosto';
      if (catId === 'informacoes_basicas' || (pend.id && pend.id.startsWith('P-IB'))) return 'Informacoes_Basicas_do_Projeto';
      if (catId === 'projeto_detalhado' || (pend.id && pend.id.startsWith('P-PRJ'))) return 'Projeto_Detalhado';
      if (catId === 'cronograma' || (pend.id && pend.id.startsWith('P-CRON'))) return 'Cronograma';
      if (catId === 'tcle' || (pend.id && pend.id.startsWith('P-TCLE'))) return 'TCLE';
      if (catId === 'tale_menores' || (pend.id && pend.id.startsWith('P-TALE'))) {
        if (pend.id === 'P-TALE-02') return 'TCLE_dos_Pais';
        return 'TALE';
      }
      if (catId === 'anuencia_tcud') {
        if (pend.id && pend.id.startsWith('P-TCUD')) return 'TCUD';
        return 'Termo_de_Anuencia';
      }
      if (pend.id === 'P-GEN-03' || pend.id === 'P-GEN-13') return 'Instrumento_Coleta';
      if (catId === 'riscos_beneficios') {
        const currentDoc = activeDocuments.value[selectedDocumentIndex.value];
        if (currentDoc && ['TCLE', 'Projeto_Detalhado', 'Informacoes_Basicas_do_Projeto', 'TALE', 'TCLE_dos_Pais'].includes(currentDoc.targetType)) {
          return currentDoc.targetType;
        }
        return 'TCLE';
      }
      const currentDoc = activeDocuments.value[selectedDocumentIndex.value];
      if (currentDoc && currentDoc.targetType) {
        return currentDoc.targetType;
      }
      return 'Geral';
    };

    const getPendenciasForDocument = (doc) => {
      if (!doc) return [];
      return selectedPendencias.value.filter(sp => {
        if (Array.isArray(sp.documentIds) && sp.documentIds.length > 0) {
          return sp.documentIds.includes(doc.docId);
        }
        const types = Array.isArray(sp.targetDocTypes) ? sp.targetDocTypes : [sp.targetDocType || inferDocTypeFromPendencia(sp, sp.categoryId)];
        return types.includes(doc.targetType);
      });
    };

    const getPendenciasForDocType = (docType) => {
      if (!docType) return [];
      return selectedPendencias.value.filter(sp => {
        const types = Array.isArray(sp.targetDocTypes) ? sp.targetDocTypes : [sp.targetDocType || inferDocTypeFromPendencia(sp, sp.categoryId)];
        return types.includes(docType);
      });
    };

    const isDocLinkedToPendencia = (pendId, docId) => {
      const sp = getSelectedPendencia(pendId);
      if (!sp) return false;
      return Array.isArray(sp.documentIds) && sp.documentIds.includes(docId);
    };

    const isGeralLinkedToPendencia = (pendId) => {
      const sp = getSelectedPendencia(pendId);
      if (!sp) return false;
      return !Array.isArray(sp.documentIds) || sp.documentIds.length === 0;
    };

    const togglePendenciaDocLink = (pendId, doc) => {
      const sp = getSelectedPendencia(pendId);
      if (!sp || !doc) return;
      if (!Array.isArray(sp.documentIds)) sp.documentIds = [];

      const idx = sp.documentIds.indexOf(doc.docId);
      if (idx >= 0) {
        sp.documentIds.splice(idx, 1);
      } else {
        sp.documentIds.push(doc.docId);
      }

      // Sincroniza targetDocTypes e targetDocType legado
      const linkedDocs = activeDocuments.value.filter(d => sp.documentIds.includes(d.docId));
      sp.targetDocTypes = linkedDocs.length > 0
        ? Array.from(new Set(linkedDocs.map(d => d.targetType)))
        : ['Geral'];
      sp.targetDocType = sp.targetDocTypes[0] || 'Geral';
      sp.updatedAt = new Date().toISOString();

      recordPendencyModificationEvent(sp, `Vínculo documental atualizado (${linkedDocs.map(d => d.originalFileName || d.file.name).join(', ') || 'Geral'})`);
      updateLogPreview();
    };

    const setPendenciaAsGeralOnly = (pendId) => {
      const sp = getSelectedPendencia(pendId);
      if (!sp) return;
      sp.documentIds = [];
      sp.targetDocTypes = ['Geral'];
      sp.targetDocType = 'Geral';
      sp.updatedAt = new Date().toISOString();
      recordPendencyModificationEvent(sp, 'Vinculada ao protocolo geral');
      updateLogPreview();
    };

    const activeDocumentItem = computed(() => {
      return activeDocuments.value[selectedDocumentIndex.value] || null;
    });

    const activeDocumentPendencias = computed(() => {
      if (!activeDocumentItem.value) return [];
      return getPendenciasForDocument(activeDocumentItem.value);
    });

    const inspectedDocItem = computed(() => {
      if (inspectedDocIndex.value < 0) return null;
      return activeDocuments.value[inspectedDocIndex.value] || null;
    });

    // --- HISTÓRICO DE PENDÊNCIAS POR DATA / PERÍODO (FASE 1 - ITEM 4) ---
    const recordPendencyCreated = (sp) => {
      if (!Array.isArray(activeProject.pendencyHistory)) activeProject.pendencyHistory = [];
      const nowISO = new Date().toISOString();
      const linkedNames = activeDocuments.value
        .filter(d => (sp.documentIds || []).includes(d.docId))
        .map(d => d.originalFileName || (d.file && d.file.name) || d.targetType);

      activeProject.pendencyHistory.push({
        entryId: `ph_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
        pendenciaId: sp.id,
        title: sp.title,
        categoryId: sp.categoryId || activeCategoryTab.value,
        documentIds: [...(sp.documentIds || [])],
        documentNames: linkedNames,
        targetDocTypes: [...(sp.targetDocTypes || [sp.targetDocType || 'Geral'])],
        observacaoRelator: sp.observacaoRelator || '',
        createdAt: nowISO,
        updatedAt: nowISO,
        resolvedAt: null,
        resolutionReason: null,
        roundFolder: targetRoundFolder.value || todayDateString.value,
        events: [
          { action: 'created', at: nowISO, note: `Pendência assinalada na rodada ${targetRoundFolder.value || todayDateString.value}` }
        ]
      });
    };

    const findOpenHistoryEntry = (pendId) => {
      if (!Array.isArray(activeProject.pendencyHistory)) return null;
      for (let i = activeProject.pendencyHistory.length - 1; i >= 0; i--) {
        const e = activeProject.pendencyHistory[i];
        if (e && e.pendenciaId === pendId && !e.resolvedAt) {
          return e;
        }
      }
      return null;
    };

    const recordPendencyModificationEvent = (sp, note = 'Pendência atualizada') => {
      const entry = findOpenHistoryEntry(sp.id);
      if (!entry) return;
      const nowISO = new Date().toISOString();
      entry.updatedAt = nowISO;
      entry.documentIds = [...(sp.documentIds || [])];
      entry.documentNames = activeDocuments.value
        .filter(d => (sp.documentIds || []).includes(d.docId))
        .map(d => d.originalFileName || (d.file && d.file.name) || d.targetType);
      entry.targetDocTypes = [...(sp.targetDocTypes || [sp.targetDocType || 'Geral'])];
      entry.observacaoRelator = sp.observacaoRelator || '';
      if (!Array.isArray(entry.events)) entry.events = [];
      entry.events.push({ action: 'modified', at: nowISO, note });
    };

    const recordPendencyResolved = (pendId, reason = 'unchecked', note = 'Pendência desmarcada/sanada') => {
      const entry = findOpenHistoryEntry(pendId);
      if (!entry) return;
      const nowISO = new Date().toISOString();
      entry.updatedAt = nowISO;
      entry.resolvedAt = nowISO;
      entry.resolutionReason = reason;
      if (!Array.isArray(entry.events)) entry.events = [];
      entry.events.push({ action: reason, at: nowISO, note });
    };

    const filteredPendencyHistoryList = computed(() => {
      let docType = '';
      if (phFilterDocId.value && phFilterDocId.value !== 'ALL') {
        const found = activeDocuments.value.find(d => d.docId === phFilterDocId.value);
        if (found) docType = found.targetType;
      }
      return CEP_STORAGE.queryPendencyHistory(activeProject.pendencyHistory || [], {
        docId: phFilterDocId.value,
        docType,
        mode: phFilterMode.value,
        exactDate: phExactDate.value,
        startDate: phStartDate.value,
        endDate: phEndDate.value
      });
    });

    const openPendencyHistoryModal = (docId = 'ALL') => {
      phFilterDocId.value = docId || 'ALL';
      pushNavState({ type: 'modal', name: 'pendHistory' });
      showPendencyHistoryModal.value = true;
    };

    // --- CONTADORES E FILTROS DA TABELA HISTÓRICA ---
    const countAllProjects = computed(() => projectsList.value.length);
    const countEmAnaliseProjects = computed(() => projectsList.value.filter(p => (p.status || 'em_analise') === 'em_analise').length);
    const countAindaNaoRelatadoProjects = computed(() => projectsList.value.filter(p => p.status === 'ainda_nao_relatado').length);
    const countEmRelatoriaProjects = computed(() => projectsList.value.filter(p => p.status === 'em_relatoria').length);
    const countEmPautaProjects = computed(() => projectsList.value.filter(p => p.status === 'em_pauta').length);
    const countAprovadoProjects = computed(() => projectsList.value.filter(p => p.status === 'aprovado').length);

    const filteredProjects = computed(() => {
      let list = [...projectsList.value];

      if (statusFilter.value && statusFilter.value !== 'todos') {
        list = list.filter(p => (p.status || 'em_analise') === statusFilter.value);
      }

      if (searchFilter.value && searchFilter.value.trim()) {
        const query = searchFilter.value.toLowerCase().trim();
        list = list.filter(p =>
          (p.pesquisador && p.pesquisador.toLowerCase().includes(query)) ||
          (p.titulo && p.titulo.toLowerCase().includes(query)) ||
          (p.instituicao && p.instituicao.toLowerCase().includes(query)) ||
          (p.caae && p.caae.toLowerCase().includes(query)) ||
          (p.relator && p.relator.toLowerCase().includes(query)) ||
          (p.data_primeira_submissao && p.data_primeira_submissao.includes(query)) ||
          (p.data_ultima_modificacao && p.data_ultima_modificacao.includes(query))
        );
      }

      list.sort((a, b) => {
        let valA = (a[sortField.value] || '').toString().toLowerCase();
        let valB = (b[sortField.value] || '').toString().toLowerCase();
        if (valA < valB) return sortAsc.value ? -1 : 1;
        if (valA > valB) return sortAsc.value ? 1 : -1;
        return 0;
      });

      return list;
    });

    // --- PAINEL DE GESTÃO E INDICADORES DO CEP (COM CICLO DINÂMICO REPROGRAMÁVEL) ---
    const dashboardMetrics = computed(() => {
      void meetingsVersion.value;
      const all = projectsList.value || [];
      const now = new Date();
      let start = null;
      let end = null;
      let periodLabel = '';

      if (dashboardPeriod.value === 'ciclo') {
        start = CEP_RULES_ENGINE.getPreviousMeetingDate(now, config.meetingOverrides);
        start.setHours(0, 0, 0, 0);
        end = CEP_RULES_ENGINE.getNextMeetingDate(now, config.meetingOverrides);
        end.setHours(23, 59, 59, 999);
        const days = CEP_RULES_ENGINE.getMeetingCycleIntervalDays(now, config.meetingOverrides);
        periodLabel = `${CEP_RULES_ENGINE.formatDateBR(start)} a ${CEP_RULES_ENGINE.formatDateBR(end)} (${days}d)`;
      } else if (dashboardPeriod.value === 'mes') {
        start = new Date(now.getFullYear(), now.getMonth(), 1);
        end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
        periodLabel = now.toLocaleDateString(currentLang.value === 'es' ? 'es-ES' : 'pt-BR', { month: 'long', year: 'numeric' });
      } else if (dashboardPeriod.value === 'trimestre') {
        start = new Date(now);
        start.setDate(start.getDate() - 90);
        end = now;
        periodLabel = currentLang.value === 'es' ? 'Últimos 90 días' : 'Últimos 90 dias';
      } else if (dashboardPeriod.value === 'semestre') {
        start = new Date(now);
        start.setDate(start.getDate() - 180);
        end = now;
        periodLabel = currentLang.value === 'es' ? 'Últimos 180 días' : 'Últimos 180 dias';
      } else if (dashboardPeriod.value === 'ano') {
        start = new Date(now.getFullYear(), 0, 1);
        end = new Date(now.getFullYear(), 11, 31, 23, 59, 59);
        periodLabel = `${now.getFullYear()}`;
      }

      const parseDate = (dStr) => CEP_RULES_ENGINE.parseLocalDate(dStr, 12);

      const inPeriodProjects = all.filter(p => {
        if (!start || !end) return true;
        const dSub = parseDate(p.data_primeira_submissao || p.data_ultima_modificacao);
        if (!dSub) return false;
        return dSub >= start && dSub <= end;
      });

      const totalNovos = inPeriodProjects.length;
      const countAnalise = all.filter(p => (p.status || 'em_analise') === 'em_analise').length;
      const countPauta = all.filter(p => p.status === 'em_pauta' || p.status === 'em_relatoria' || p.status === 'ainda_nao_relatado').length;
      const countAprovados = all.filter(p => {
        if (p.status !== 'aprovado') return false;
        if (!start || !end) return true;
        const dAprov = parseDate(p.data_aprovacao || p.data_ultima_modificacao);
        if (!dAprov) return true;
        return dAprov >= start && dAprov <= end;
      }).length;

      const totalDeliberados = countAprovados + countAnalise;
      const taxaAprovacao = totalDeliberados > 0 ? Math.round((countAprovados / totalDeliberados) * 100) : 100;

      const topInconformidades = [
        { label: 'TCLE (Termo de Consentimento)', count: Math.max(0, Math.round(countAnalise * 0.8)), pct: countAnalise > 0 ? 80 : 0 },
        { label: 'Folha de Rosto (Assinatura/Instituição)', count: Math.max(0, Math.round(countAnalise * 0.65)), pct: countAnalise > 0 ? 65 : 0 },
        { label: 'Cronograma (Data Coleta x Reunião)', count: Math.max(0, Math.round(countAnalise * 0.5)), pct: countAnalise > 0 ? 50 : 0 },
        { label: 'Projeto Detalhado / Informações Básicas', count: Math.max(0, Math.round(countAnalise * 0.35)), pct: countAnalise > 0 ? 35 : 0 },
        { label: 'Anuência / TCUD (Instituição Coparticipante)', count: Math.max(0, Math.round(countAnalise * 0.2)), pct: countAnalise > 0 ? 20 : 0 }
      ];

      return {
        periodLabel,
        totalNovos,
        countAnalise,
        countPauta,
        countAprovados,
        taxaAprovacao,
        topInconformidades
      };
    });

    const sortProjects = (field) => {
      if (sortField.value === field) sortAsc.value = !sortAsc.value;
      else {
        sortField.value = field;
        sortAsc.value = true;
      }
    };

    // --- GESTÃO DA PASTA DE TRABALHO E CONFIGURAÇÕES ---
    const chooseDirectory = async () => {
      try {
        const handle = await CEP_STORAGE.selectDirectory();
        folderConnected.value = true;
        folderName.value = handle.name;
        await loadWorkspaceData();
      } catch (err) {
        if (err.name !== 'AbortError') {
          alert('Erro ao conectar pasta: ' + err.message);
        }
      }
    };

    const mergeCategoriesWithDefaults = (customCats, defaultCats) => {
      const merged = JSON.parse(JSON.stringify(defaultCats));
      if (!Array.isArray(customCats) || customCats.length === 0) {
        return merged;
      }

      const normalizeTitleKey = (str) => String(str || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]/g, '');
      const mergedMap = new Map(merged.map(c => [c.id, c]));
      const globalTitles = new Set();
      merged.forEach(cat => {
        (cat.pendencias || []).forEach(p => globalTitles.add(normalizeTitleKey(p.title)));
      });

      customCats.forEach(cCat => {
        if (!cCat || !cCat.id) return;
        if (mergedMap.has(cCat.id)) {
          const targetCat = mergedMap.get(cCat.id);
          const existingIds = new Set((targetCat.pendencias || []).map(p => p.id));
          if (Array.isArray(cCat.pendencias)) {
            cCat.pendencias.forEach(p => {
              // Não importa pendências descartáveis de sessão única ("CUSTOM-...") como padrão permanente
              if (!p || !p.id || String(p.id).startsWith('CUSTOM-')) return;
              const tKey = normalizeTitleKey(p.title);
              if (!existingIds.has(p.id) && !globalTitles.has(tKey)) {
                if (CEP_RULES_ENGINE.isHospitalAffinityPendencia(p)) {
                  p.onlyFirstSubmission = true;
                }
                if (CEP_RULES_ENGINE.isMissingCategoriesPendencia(p)) {
                  p.hasCategoryCheckboxes = true;
                }
                targetCat.pendencias.push(p);
                existingIds.add(p.id);
                globalTitles.add(tKey);
              }
            });
          }
        } else {
          merged.push(cCat);
          mergedMap.set(cCat.id, cCat);
        }
      });
      return merged;
    };

    const loadWorkspaceData = async () => {
      const registry = await CEP_STORAGE.readJSONFile('registro_cep.json', {
        projetos: [],
        relatores: [],
        instituicoes: [],
        reunioesOverrides: {}
      });
      projectsList.value = registry.projetos || [];
      savedRelatores.value = registry.relatores || [];
      savedInstituicoes.value = Array.isArray(registry.instituicoes) ? registry.instituicoes : [];

      if (registry.reunioesOverrides && Object.keys(registry.reunioesOverrides).length > 0) {
        config.meetingOverrides = { ...(config.meetingOverrides || {}), ...registry.reunioesOverrides };
      }

      const savedConfig = await CEP_STORAGE.readJSONFile('config_cep.json', null);
      if (savedConfig) {
        const cfgSource = savedConfig.config || savedConfig;
        const { meetingOverrides: savedOv, ...restCfg } = cfgSource;
        Object.assign(config, restCfg);
        if (savedOv && typeof savedOv === 'object') {
          config.meetingOverrides = { ...(config.meetingOverrides || {}), ...savedOv };
        }
        if (savedConfig.customCategories && Array.isArray(savedConfig.customCategories)) {
          availableCategories.value = mergeCategoriesWithDefaults(savedConfig.customCategories, DEFAULT_PENDENCIAS_CATEGORIES);
        }
      }

      syncMeetingsToEngine();
    };

    const persistConfigAndOverrides = async () => {
      // Remove itens temporários de sessão CUSTOM- antes de persistir catálogo global
      const cleanCategories = availableCategories.value.map(cat => ({
        ...cat,
        pendencias: (cat.pendencias || []).filter(p => !String(p.id || '').startsWith('CUSTOM-'))
      }));
      const payload = {
        config: { ...config, meetingOverrides: { ...(config.meetingOverrides || {}) } },
        customCategories: cleanCategories
      };
      localStorage.setItem('cep_saved_config', JSON.stringify(payload));
      await CEP_STORAGE.writeJSONFile('config_cep.json', payload);
      await CEP_STORAGE.saveMeetingOverrides(config.meetingOverrides || {});
    };

    const saveInstitutionConfig = async () => {
      syncMeetingsToEngine();
      await persistConfigAndOverrides();
      closeConfigModal();
      updateLogPreview();
    };

    const openConfigModal = (initialTab = 'instituicao') => {
      pushNavState({ type: 'modal', name: 'config' });
      configTab.value = initialTab;
      showConfigModal.value = true;
    };

    const createNewCategory = () => {
      const name = newCategoryName.value.trim();
      if (!name) {
        alert('Digite o nome da nova categoria.');
        return;
      }
      const id = 'cat_' + name.toLowerCase().replace(/[^a-z0-9]/g, '_') + '_' + Date.now().toString(36);
      availableCategories.value.push({
        id,
        name,
        name_es: name,
        icon: 'folder',
        pendencias: []
      });
      newPendenciaForm.categoryId = id;
      newCategoryName.value = '';
      alert(`Categoria "${name}" criada com sucesso!`);
    };

    const createNewStandardPendencia = () => {
      if (!newPendenciaForm.title.trim() || !newPendenciaForm.template.trim()) {
        alert('Preencha o título curto e o texto padrão que será gerado no parecer.');
        return;
      }
      const cat = availableCategories.value.find(c => c.id === newPendenciaForm.categoryId);
      if (!cat) return;

      // ID único sem colisão
      const newId = `P-CUST-${Date.now()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
      const newObj = {
        id: newId,
        title: newPendenciaForm.title.trim(),
        title_es: newPendenciaForm.title.trim(),
        normativa: newPendenciaForm.normativa.trim() || 'Normativa Institucional do CEP',
        template: newPendenciaForm.template.trim()
      };
      if (CEP_RULES_ENGINE.isHospitalAffinityPendencia(newObj)) {
        newObj.onlyFirstSubmission = true;
      }
      if (CEP_RULES_ENGINE.isMissingCategoriesPendencia(newObj)) {
        newObj.hasCategoryCheckboxes = true;
      }
      cat.pendencias.push(newObj);

      newPendenciaForm.title = '';
      newPendenciaForm.normativa = '';
      newPendenciaForm.template = '';
      alert(`Nova pendência adicionada na categoria "${cat.name}"!`);
    };

    // --- FLUXO DE NOVO PROJETO (SEM RELATOR POR PADRÃO + ANÁLISE COM CRIAÇÃO IMEDIATA DE PASTAS) ---
    const openNewProjectModal = () => {
      newProjectForm.instituicao = '';
      newProjectForm.pesquisador = '';
      newProjectForm.titulo = '';
      newProjectForm.caae = '';
      newProjectForm.relator = ''; // "Sem Relator" / "Sin Relator" por padrão (Item 13)
      newProjectForm.tipoProjeto = 'Projeto_Detalhado';
      newProjectForm.areasTematicas = ['geral'];
      newProjectForm.enquadramentoTipo = 'geral';
      newProjectForm.enquadramentoCustom = '';
      newProjectForm.enquadramento = {
        geral: true,
        menores: false,
        bancoDados: false,
        indigena: false
      };
      newProjectFiles.value = [];
      pushNavState({ type: 'modal', name: 'newProject' });
      showNewProjectModal.value = true;
    };

    const triggerFolderFilePicker = () => {
      if (folderFileInput.value) folderFileInput.value.click();
    };

    const triggerMultiFilePicker = () => {
      if (multiFileInput.value) multiFileInput.value.click();
    };

    const guessDocumentType = (filename) => {
      const name = filename.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      if (name.includes('informacoes_basicas') || name.includes('informacoes basicas') || name.includes('pb_informacoes')) {
        return 'Informacoes_Basicas_do_Projeto';
      }
      if (name.includes('rosto') || name.includes('folha')) return 'Folha_de_Rosto';
      if (name.includes('pais') || name.includes('responsav')) return 'TCLE_dos_Pais';
      if (name.includes('assentimento') || name.includes('tale')) return 'TALE';
      if (name.includes('tcle') || name.includes('consentimento')) return 'TCLE';
      if (name.includes('projeto') || name.includes('protocolo') || name.includes('detalhado') || name.includes('resumo')) return 'Projeto_Detalhado';
      if (name.includes('cronograma')) return 'Cronograma';
      if (name.includes('anuencia') || name.includes('autorizacao') || name.includes('tai')) return 'Termo_de_Anuencia';
      if (name.includes('tcud') || name.includes('banco') || name.includes('prontuario')) return 'TCUD';
      if (name.includes('questionario') || name.includes('roteiro') || name.includes('entrevista') || name.includes('instrumento')) return 'Instrumento_Coleta';
      if (name.includes('orcamento') || name.includes('financeiro')) return 'Orcamento';
      if (name.includes('carta') || name.includes('resposta') || name.includes('pendencia')) return 'Carta_Resposta';
      return 'Outro';
    };

    // =========================================================================
    // FASE 1: DEDUPLICAÇÃO SHA-256 E FLUXO DE VERSIONAMENTO (OPÇÃO A / OPÇÃO B)
    // =========================================================================

    const ensureExistingDocsHashes = async (docsArray) => {
      for (const doc of docsArray) {
        if (!doc.docId) {
          doc.docId = CEP_STORAGE.generateDocId(doc.originalFileName || (doc.file && doc.file.name) || '');
        }
        if (!doc.sha256 && (doc.cachedBuffer || doc.file)) {
          try {
            const buf = doc.cachedBuffer || await doc.file.arrayBuffer();
            doc.cachedBuffer = buf;
            doc.sha256 = await CEP_STORAGE.computeSHA256(buf);
          } catch (e) {}
        }
      }
    };

    const existingDocsForUploadModal = computed(() => {
      return pendingUploadContext.value === 'newProject' ? newProjectFiles.value : activeDocuments.value;
    });

    /**
     * Intercepta qualquer upload de arquivo, calcula SHA-256 via Web Crypto API,
     * bloqueia imediatamente caso o hash já exista no projeto e caso contrário abre o modal Opção A / Opção B.
     */
    const processIncomingFilesWithHashCheck = async (rawFiles, { context = 'workspace', preselectedReplaceIdx = -1 } = {}) => {
      const cleanFiles = Array.from(rawFiles || []).filter(f => {
        if (!f || !f.name) return false;
        const base = f.name;
        if (base.startsWith('.') || base.startsWith('~$')) return false;
        if (base === 'log.txt' || base === 'mlog.txt' || base === 'estado_avaliacao.json' || base === 'registro_cep.json' || base === 'config_cep.json') return false;
        return true;
      });

      if (cleanFiles.length === 0) return;

      const targetDocsList = context === 'newProject' ? newProjectFiles.value : activeDocuments.value;
      await ensureExistingDocsHashes(targetDocsList);

      // Mapeia todos os hashes existentes no projeto atual
      const existingHashMap = new Map();
      targetDocsList.forEach(d => {
        if (d.sha256) {
          existingHashMap.set(d.sha256, d.originalFileName || (d.file && d.file.name) || d.targetType);
        }
      });

      const batchHashes = new Map();
      const preparedQueue = [];

      for (let i = 0; i < cleanFiles.length; i++) {
        const f = cleanFiles[i];
        const buf = await f.arrayBuffer();
        const sha256 = await CEP_STORAGE.computeSHA256(buf);

        // 1. Verifica se o hash já existe nos documentos do projeto -> INTERROMPE IMEDIATAMENTE!
        if (existingHashMap.has(sha256)) {
          const existingName = existingHashMap.get(sha256);
          const msg = t('duplicateHashMsg')
            .replace('{newFile}', f.name)
            .replace('{existingFile}', existingName);
          duplicateHashInfo.value = {
            newFile: f.name,
            existingFile: existingName,
            sha256,
            message: msg
          };
          showDuplicateHashModal.value = true;
          return; // Detém imediatamente sem duplicar nem alterar nada
        }

        // 2. Verifica se o próprio lote contém dois arquivos idênticos com o mesmo hash
        if (batchHashes.has(sha256)) {
          const firstInBatch = batchHashes.get(sha256);
          const msg = t('duplicateHashMsg')
            .replace('{newFile}', f.name)
            .replace('{existingFile}', firstInBatch);
          duplicateHashInfo.value = {
            newFile: f.name,
            existingFile: firstInBatch,
            sha256,
            message: msg
          };
          showDuplicateHashModal.value = true;
          return;
        }
        batchHashes.set(sha256, f.name);

        const guessed = guessDocumentType(f.name);
        const dotIdx = f.name.lastIndexOf('.');
        const extension = dotIdx !== -1 ? f.name.substring(dotIdx) : '';

        const hasExistingDocs = targetDocsList.length > 0;
        const preTargetDoc = (preselectedReplaceIdx >= 0 && targetDocsList[preselectedReplaceIdx] && i === 0)
          ? targetDocsList[preselectedReplaceIdx]
          : null;

        preparedQueue.push({
          tempId: `up_${Date.now()}_${i}`,
          file: f,
          cachedBuffer: buf,
          sha256,
          extension,
          mode: preTargetDoc ? 'version' : 'new',
          replaceTargetDocId: preTargetDoc ? preTargetDoc.docId : (hasExistingDocs ? targetDocsList[0].docId : ''),
          targetType: preTargetDoc ? preTargetDoc.targetType : guessed,
          customName: guessed === 'Outro' ? f.name.replace(/\.[^/.]+$/, '') : ''
        });
      }

      pendingUploadContext.value = context;
      pendingUploadQueue.value = preparedQueue;
      showUploadFlowModal.value = true;
    };

    /**
     * Confirma a decisão do usuário no Modal de Upload (Opção A: Nova Versão | Opção B: Novo Documento)
     */
    const confirmUploadFlow = () => {
      const isNewProj = pendingUploadContext.value === 'newProject';
      const targetList = isNewProj ? newProjectFiles.value : activeDocuments.value;

      // Validação das seleções
      for (const item of pendingUploadQueue.value) {
        if (item.mode === 'version') {
          if (!item.replaceTargetDocId || !targetList.some(d => d.docId === item.replaceTargetDocId)) {
            alert(currentLang.value === 'es'
              ? 'Por favor seleccione qué documento existente desea sustituir.'
              : 'Por favor, selecione qual documento existente deseja substituir.');
            return;
          }
        }
      }

      if (!isNewProj) {
        ensureNewRoundOnModification();
      }

      const activeRound = isNewProj ? todayDateString.value : (targetRoundFolder.value || todayDateString.value);
      const nowISO = new Date().toISOString();
      let lastTouchedIndex = -1;

      for (const item of pendingUploadQueue.value) {
        if (item.mode === 'version') {
          const targetIdx = targetList.findIndex(d => d.docId === item.replaceTargetDocId);
          const targetDoc = targetList[targetIdx];
          if (!targetDoc) continue;

          const oldName = targetDoc.originalFileName || (targetDoc.file && targetDoc.file.name) || 'documento';
          const oldVersion = targetDoc.version || 1;
          const oldHash = targetDoc.sha256 || '';

          // Item 2: Guarda o histórico de nomes e hashes anteriores
          if (!Array.isArray(targetDoc.previousNames)) targetDoc.previousNames = [];
          targetDoc.previousNames.push({
            name: oldName,
            savedFileName: targetDoc.savedFileName || '',
            date: nowISO,
            hash: oldHash,
            version: oldVersion,
            reason: 'new_version'
          });

          // Item 3: Preserva as pendências do arquivo antigo no histórico do documento e mantém vinculadas ao novo para verificação
          if (!isNewProj) {
            const linkedPends = getPendenciasForDocument(targetDoc);
            if (linkedPends.length > 0) {
              if (!Array.isArray(targetDoc.historicalPendencias)) targetDoc.historicalPendencias = [];
              targetDoc.historicalPendencias.push({
                version: oldVersion,
                fileName: oldName,
                hash: oldHash,
                date: nowISO,
                pendencias: linkedPends.map(lp => ({
                  id: lp.id,
                  title: lp.title,
                  observacaoRelator: lp.observacaoRelator || ''
                }))
              });

              linkedPends.forEach(lp => {
                if (!Array.isArray(lp.documentIds)) lp.documentIds = [];
                if (!lp.documentIds.includes(targetDoc.docId)) {
                  lp.documentIds.push(targetDoc.docId);
                }
                lp.needsVerificationAfterReplace = true;
                lp.inheritedFromFile = {
                  name: oldName,
                  version: oldVersion,
                  hash: oldHash,
                  date: nowISO
                };
                lp.updatedAt = nowISO;
                recordPendencyModificationEvent(
                  lp,
                  `Nova versão v${oldVersion + 1} enviada ("${item.file.name}" substituiu "${oldName}") — aguardando verificação`
                );
              });
            }
          }

          targetDoc.file = item.file;
          targetDoc.handle = null;
          targetDoc.cachedBuffer = item.cachedBuffer;
          targetDoc.sha256 = item.sha256;
          targetDoc.originalFileName = item.file.name;
          targetDoc.extension = item.extension;
          targetDoc.version = oldVersion + 1;
          targetDoc.replacedAt = todayDateString.value;
          targetDoc.originRound = activeRound;
          targetDoc.isNewUpload = true;
          lastTouchedIndex = targetIdx;
        } else {
          // Opção B: Novo documento
          const newDoc = {
            docId: CEP_STORAGE.generateDocId(item.file.name),
            file: item.file,
            handle: item.file.handle || null,
            cachedBuffer: item.cachedBuffer,
            sha256: item.sha256,
            originalFileName: item.file.name,
            savedFileName: '',
            targetType: item.targetType || 'Outro',
            customName: item.targetType === 'Outro' ? (item.customName || item.file.name.replace(/\.[^/.]+$/, '')) : '',
            extension: item.extension,
            originRound: activeRound,
            isNewUpload: true,
            replacedAt: null,
            version: 1,
            previousNames: [],
            historicalPendencias: []
          };
          targetList.push(newDoc);
          lastTouchedIndex = targetList.length - 1;
        }
      }

      showUploadFlowModal.value = false;
      pendingUploadQueue.value = [];
      replacingDocIndex.value = -1;

      if (!isNewProj && lastTouchedIndex >= 0) {
        selectedDocumentIndex.value = lastTouchedIndex;
        loadSelectedDocument();
        updateLogPreview();
      }
    };

    const onFilesSelectedFromDisk = async (e) => {
      const files = Array.from(e.target.files || []);
      e.target.value = '';
      if (!files.length) return;
      const ctx = showNewProjectModal.value ? 'newProject' : 'workspace';
      await processIncomingFilesWithHashCheck(files, { context: ctx, preselectedReplaceIdx: -1 });
    };

    const triggerReplaceDocument = (idx) => {
      replacingDocIndex.value = idx;
      if (replaceFileInput.value) replaceFileInput.value.click();
    };

    const onReplaceFileSelected = async (e) => {
      const files = Array.from(e.target.files || []);
      const repIdx = replacingDocIndex.value;
      e.target.value = '';
      if (!files.length || repIdx < 0) return;
      await processIncomingFilesWithHashCheck([files[0]], { context: 'workspace', preselectedReplaceIdx: repIdx });
    };

    // --- DETALHE DO DOCUMENTO, RENOMEAÇÃO COM HISTÓRICO E VERIFICAÇÃO DE PENDÊNCIA HERDADA ---
    const openDocDetailModal = (idx) => {
      const doc = activeDocuments.value[idx];
      if (!doc) return;
      inspectedDocIndex.value = idx;
      renameDocInput.value = doc.originalFileName || (doc.file && doc.file.name) || '';
      pushNavState({ type: 'modal', name: 'docDetail' });
      showDocDetailModal.value = true;
    };

    const applyDocumentRename = () => {
      const doc = inspectedDocItem.value;
      if (!doc) return;
      const newName = renameDocInput.value.trim();
      const oldName = doc.originalFileName || (doc.file && doc.file.name) || '';
      if (!newName || newName === oldName) return;

      if (!Array.isArray(doc.previousNames)) doc.previousNames = [];
      doc.previousNames.push({
        name: oldName,
        savedFileName: doc.savedFileName || '',
        date: new Date().toISOString(),
        hash: doc.sha256 || '',
        version: doc.version || 1,
        reason: 'renamed'
      });
      doc.originalFileName = newName;
      updateLogPreview();
    };

    const markInheritedPendenciaResolved = (pendId) => {
      const idx = selectedPendencias.value.findIndex(p => p.id === pendId);
      if (idx >= 0) {
        recordPendencyResolved(pendId, 'verified_on_new_version', 'Verificada e sanada após envio de nova versão do documento');
        selectedPendencias.value.splice(idx, 1);
        syncAutoStatusAfterPendenciasChange();
        updateLogPreview();
      }
    };

    const openDocumentsManagerModal = () => {
      pushNavState({ type: 'modal', name: 'documents' });
      showDocumentsModal.value = true;
    };

    const removeActiveDocument = (idx) => {
      const doc = activeDocuments.value[idx];
      if (!doc) return;

      const label = getDocTypeLabel(doc.targetType, doc.customName);
      const dispName = doc.originalFileName || (doc.file && doc.file.name) || 'arquivo';
      const confirmMsg = currentLang.value === 'es'
        ? `¿Desea quitar el archivo "${dispName}" (${label}) de la entrega actual?\n\nNota: Si pertenecía a una fecha anterior, el archivo histórico permanecerá intacto en su carpeta antigua.`
        : `Deseja remover o arquivo "${dispName}" (${label}) da rodada atual?\n\nNota: Se ele pertencia a uma submissão anterior, o arquivo histórico continuará intacto na pasta da data antiga.`;

      if (!confirm(confirmMsg)) return;

      ensureNewRoundOnModification();
      activeDocuments.value.splice(idx, 1);
      if (selectedDocumentIndex.value >= activeDocuments.value.length) {
        selectedDocumentIndex.value = Math.max(0, activeDocuments.value.length - 1);
      }
      loadSelectedDocument();
      updateLogPreview();
    };

    const viewDocumentFromModal = (idx) => {
      selectedDocumentIndex.value = idx;
      showDocumentsModal.value = false;
      loadSelectedDocument();
    };

    const ensureNewRoundOnModification = () => {
      const today = todayDateString.value;
      if (loadedFromRound.value && loadedFromRound.value !== today && targetRoundFolder.value === loadedFromRound.value) {
        targetRoundFolder.value = today;
      }
    };

    const startNewSubmissionRound = () => {
      const today = todayDateString.value;
      let suggestedName = today;

      if (projectRoundsHistory.value.includes(today) || targetRoundFolder.value === today) {
        let counter = 2;
        while (projectRoundsHistory.value.includes(`${today}_R${counter}`) || targetRoundFolder.value === `${today}_R${counter}`) {
          counter++;
        }
        suggestedName = `${today}_R${counter}`;
      }

      const customRound = prompt(
        currentLang.value === 'es'
          ? 'Nombre/Fecha de la nueva carpeta de entrega (la carpeta anterior quedará intacta en el historial):'
          : 'Nome/Data da nova pasta de submissão (a pasta da rodada anterior ficará intacta no histórico):',
        suggestedName
      );

      if (customRound && customRound.trim()) {
        targetRoundFolder.value = CEP_STORAGE.sanitizeFolderName(customRound.trim());
        // Em nova rodada de correção, destrava mlog antigo e higieniza falsos positivos hospitalares
        hasManualEdits.value = false;
        selectedPendencias.value = CEP_RULES_ENGINE.sanitizePendenciasForRound(selectedPendencias.value, {
          isReanalysis: true,
          projeto: activeProject,
          roundsHistoryCount: Math.max(1, projectRoundsHistory.value.length),
          documentos: activeDocuments.value
        });
        updateLogPreview();
      }
    };

    const switchToHistoricalRound = async (roundName) => {
      if (!activeProject.id) return;
      const roundData = await CEP_STORAGE.loadProjectRound(activeProject.id, roundName);
      if (!roundData) {
        alert('Não foi possível carregar os arquivos da pasta ' + roundName);
        return;
      }
      await populateWorkspaceFromRoundData(roundData, roundName);
    };

    const removeNewProjectFile = (idx) => {
      newProjectFiles.value.splice(idx, 1);
    };

    /**
     * FASE 3 - ITEM 15: Ao selecionar arquivos e começar a Analisar, cria imediatamente
     * toda a estrutura de pastas correspondente e atribui automaticamente "Ainda não relatado" se 0 pendências.
     */
    const finalizeNewProjectCreation = async () => {
      if (!newProjectForm.titulo.trim() || !newProjectForm.pesquisador.trim()) {
        alert('Por favor, preencha o Nome do Pesquisador e o Título da Pesquisa.');
        return;
      }

      // Se a pasta física ainda não estiver conectada e o navegador suportar File System Access API, oferece conectar agora
      if (!folderConnected.value && typeof window.showDirectoryPicker === 'function') {
        try {
          const handle = await CEP_STORAGE.selectDirectory();
          folderConnected.value = true;
          folderName.value = handle.name;
        } catch (dirErr) {
          // Caso o usuário cancele o seletor de pasta, prossegue normalmente em modo virtual sem travar
        }
      }

      activeProject.id = '';
      activeProject.instituicao = newProjectForm.instituicao.trim() || config.instituicao || 'Instituição';
      activeProject.pesquisador = newProjectForm.pesquisador.trim();
      activeProject.titulo = newProjectForm.titulo.trim();
      activeProject.caae = newProjectForm.caae.trim();
      activeProject.relator = CEP_STORAGE.normalizeRelatorValue(newProjectForm.relator);
      activeProject.tipoProjeto = newProjectForm.tipoProjeto || 'Projeto_Detalhado';
      activeProject.areasTematicas = Array.isArray(newProjectForm.areasTematicas) && newProjectForm.areasTematicas.length > 0
        ? [...newProjectForm.areasTematicas]
        : ['geral'];
      const legacyEnq = CEP_STORAGE.buildLegacyEnquadramentoFromAreas(activeProject.areasTematicas);
      activeProject.enquadramento = legacyEnq.enquadramento;
      activeProject.enquadramentoTipo = legacyEnq.enquadramentoTipo;
      activeProject.enquadramentoCustom = newProjectForm.enquadramentoCustom || '';
      activeProject.data_aprovacao = null;
      activeProject.pendencyHistory = [];

      targetRoundFolder.value = todayDateString.value;
      loadedFromRound.value = '';
      projectRoundsHistory.value = [];

      activeDocuments.value = [...newProjectFiles.value];
      selectedPendencias.value = [];
      hasManualEdits.value = false;

      // Item 15: Sem pendências geradas na análise inicial -> atribui automaticamente "Ainda não relatado"
      activeProject.status = selectedPendencias.value.length === 0 ? 'ainda_nao_relatado' : 'em_analise';
      updateLogPreview();

      // Item 15: Cria imediatamente a estrutura de pastas e salva o estado inicial do projeto
      isSaving.value = true;
      try {
        const result = await CEP_STORAGE.saveProjectRound({
          id: null,
          instituicao: activeProject.instituicao,
          pesquisador: activeProject.pesquisador,
          titulo: activeProject.titulo,
          caae: activeProject.caae,
          relator: activeProject.relator,
          tipoProjeto: activeProject.tipoProjeto,
          areasTematicas: activeProject.areasTematicas,
          enquadramento: activeProject.enquadramento,
          enquadramentoTipo: activeProject.enquadramentoTipo,
          enquadramentoCustom: activeProject.enquadramentoCustom,
          status: activeProject.status,
          data_aprovacao: null,
          pendencias_count: selectedPendencias.value.length,
          pendencyHistory: activeProject.pendencyHistory,
          targetRoundFolder: targetRoundFolder.value,
          arquivosClassificados: activeDocuments.value,
          pendenciasSelecionadas: selectedPendencias.value,
          logText: officialGeneratedLog.value,
          mlogText: editableLogText.value,
          hasModifications: false,
          allowVirtualFallback: true
        });

        activeProject.id = result.projectFolderId;
        loadedFromRound.value = result.todayFolder;
        projectRoundsHistory.value = [result.todayFolder];
        await loadWorkspaceData();
      } catch (saveErr) {
        console.warn('Aviso ao criar pasta imediata do projeto:', saveErr);
      } finally {
        isSaving.value = false;
      }

      if (history.state && history.state.name === 'newProject') {
        history.replaceState({ type: 'view', name: 'workspace', projectId: activeProject.id }, '');
      } else {
        pushNavState({ type: 'view', name: 'workspace', projectId: activeProject.id });
      }
      showNewProjectModal.value = false;
      currentView.value = 'workspace';
      selectedDocumentIndex.value = 0;

      nextTick(() => {
        if (viewerContainer.value) {
          CEP_VIEWER.init(viewerContainer.value);
          loadSelectedDocument();
        }
        updateLogPreview();
      });
    };

    const populateWorkspaceFromRoundData = async (roundData, roundDate) => {
      loadedFromRound.value = roundDate;
      const today = todayDateString.value;
      const isOpeningPastRoundForTodayCorrection = roundDate !== today && !roundDate.startsWith(today);

      if (isOpeningPastRoundForTodayCorrection) {
        targetRoundFolder.value = today;
      } else {
        targetRoundFolder.value = roundDate;
      }

      const metaList = (roundData.stateData && Array.isArray(roundData.stateData.arquivosMetadados))
        ? roundData.stateData.arquivosMetadados
        : [];

      const validTypes = DOC_TYPES_CATALOG.map(d => d.value);

      if (Array.isArray(roundData.files) && roundData.files.length > 0) {
        activeDocuments.value = roundData.files.map((f, idx) => {
          const dotIdx = f.name.lastIndexOf('.');
          const ext = dotIdx !== -1 ? f.name.substring(dotIdx) : '';
          const meta = metaList.find(m => m.savedFileName === f.name);

          if (meta) {
            return {
              docId: meta.docId || CEP_STORAGE.generateDocId(f.name),
              file: f,
              handle: f.handle || null,
              cachedBuffer: null,
              sha256: meta.sha256 || null,
              originalFileName: meta.originalFileName || f.name,
              savedFileName: meta.savedFileName || f.name,
              targetType: meta.targetType || 'Outro',
              customName: meta.customName || '',
              extension: meta.extension || ext,
              originRound: meta.originRound || roundDate,
              isNewUpload: false,
              replacedAt: meta.replacedAt || null,
              version: meta.version || 1,
              previousNames: Array.isArray(meta.previousNames) ? meta.previousNames : [],
              historicalPendencias: Array.isArray(meta.historicalPendencias) ? meta.historicalPendencias : []
            };
          }

          // Fallback para projetos antigos sem estado_avaliacao.json
          const prefix = f.name.split('.')[0] || 'Outro';
          const basePrefix = prefix.replace(/_\d+$/, '');
          const isKnownType = validTypes.includes(basePrefix);

          return {
            docId: `doc_legacy_${idx}_${CEP_STORAGE.sanitizeFileName(f.name, 16)}`,
            file: f,
            handle: f.handle || null,
            cachedBuffer: null,
            sha256: null,
            originalFileName: f.name,
            savedFileName: f.name,
            targetType: isKnownType ? basePrefix : 'Outro',
            customName: isKnownType ? '' : basePrefix,
            extension: ext,
            originRound: roundDate,
            isNewUpload: false,
            replacedAt: null,
            version: 1,
            previousNames: [],
            historicalPendencias: []
          };
        });
      } else if (metaList.length > 0) {
        // Fallback virtual sem arquivos em disco (restaura metadados)
        activeDocuments.value = metaList.map(meta => ({
          docId: meta.docId || CEP_STORAGE.generateDocId(meta.originalFileName),
          file: new File([''], meta.originalFileName || meta.savedFileName || 'documento.txt'),
          handle: null,
          cachedBuffer: null,
          sha256: meta.sha256 || null,
          originalFileName: meta.originalFileName || meta.savedFileName,
          savedFileName: meta.savedFileName || '',
          targetType: meta.targetType || 'Outro',
          customName: meta.customName || '',
          extension: meta.extension || '',
          originRound: meta.originRound || roundDate,
          isNewUpload: false,
          replacedAt: meta.replacedAt || null,
          version: meta.version || 1,
          previousNames: Array.isArray(meta.previousNames) ? meta.previousNames : [],
          historicalPendencias: Array.isArray(meta.historicalPendencias) ? meta.historicalPendencias : []
        }));
      } else {
        activeDocuments.value = [];
      }

      if (roundData.stateData) {
        const rawPends = (roundData.stateData.pendenciasSelecionadas || []).map(sp =>
          CEP_STORAGE.migratePendenciaItem(sp, activeDocuments.value)
        ).filter(Boolean);

        // Item 11: Se estiver abrindo para 2ª correção (ou se já houver histórico de rodadas > 1),
        // bloqueia qualquer falso positivo de "Este CEP não tem afinidade por ser hospitalar"
        const isSecondOrMore = isOpeningPastRoundForTodayCorrection || projectRoundsHistory.value.length > 1;
        selectedPendencias.value = CEP_RULES_ENGINE.sanitizePendenciasForRound(rawPends, {
          isReanalysis: isSecondOrMore,
          projeto: activeProject,
          roundsHistoryCount: projectRoundsHistory.value.length,
          documentos: activeDocuments.value
        });

        activeProject.tipoProjeto = roundData.stateData.tipoProjeto || activeProject.tipoProjeto || 'Projeto_Detalhado';
        activeProject.areasTematicas = CEP_STORAGE.migrateAreasTematicas(roundData.stateData);
        activeProject.enquadramentoCustom = roundData.stateData.enquadramentoCustom || '';
        const legacyEnq = CEP_STORAGE.buildLegacyEnquadramentoFromAreas(activeProject.areasTematicas);
        activeProject.enquadramento = legacyEnq.enquadramento;
        activeProject.enquadramentoTipo = legacyEnq.enquadramentoTipo;

        if (Array.isArray(roundData.stateData.pendencyHistory) && roundData.stateData.pendencyHistory.length > 0) {
          activeProject.pendencyHistory = roundData.stateData.pendencyHistory;
        }
      } else {
        // Evita vazamento de pendências de outro projeto caso a pasta antiga não tenha estado_avaliacao.json
        selectedPendencias.value = [];
      }

      // Em nova data de correção, não trava editableLogText no mlog.txt da rodada passada
      if (!isOpeningPastRoundForTodayCorrection && roundData.mlogText) {
        editableLogText.value = roundData.mlogText;
        hasManualEdits.value = true;
      } else {
        hasManualEdits.value = false;
      }

      selectedDocumentIndex.value = 0;
      nextTick(() => {
        if (viewerContainer.value) {
          CEP_VIEWER.init(viewerContainer.value);
          loadSelectedDocument();
        }
        updateLogPreview();
      });
    };

    const openExistingProject = async (proj) => {
      if (proj.status === 'em_pauta') {
        pushNavState({ type: 'modal', name: 'deliberation', projectId: proj.id });
        projectToDeliberate.value = proj;
        showDeliberationModal.value = true;
        return;
      }
      await doOpenProject(proj);
    };

    const doOpenProject = async (proj) => {
      pushNavState({ type: 'view', name: 'workspace', projectId: proj.id });

      // Reset completo para evitar contaminação de estado entre projetos diferentes (Item 11)
      activeProject.id = proj.id;
      activeProject.titulo = proj.titulo || '';
      activeProject.pesquisador = proj.pesquisador || '';
      activeProject.instituicao = proj.instituicao || '';
      activeProject.caae = proj.caae || '';
      activeProject.relator = CEP_STORAGE.normalizeRelatorValue(proj.relator);
      activeProject.tipoProjeto = proj.tipoProjeto || 'Projeto_Detalhado';
      activeProject.areasTematicas = CEP_STORAGE.migrateAreasTematicas(proj);
      const legacyEnq = CEP_STORAGE.buildLegacyEnquadramentoFromAreas(activeProject.areasTematicas);
      activeProject.enquadramento = legacyEnq.enquadramento;
      activeProject.enquadramentoTipo = legacyEnq.enquadramentoTipo;
      activeProject.enquadramentoCustom = proj.enquadramentoCustom || '';
      activeProject.status = proj.status || 'em_analise';
      activeProject.data_aprovacao = proj.data_aprovacao || null;
      activeProject.pendencyHistory = Array.isArray(proj.pendencyHistory) ? [...proj.pendencyHistory] : [];

      selectedPendencias.value = [];
      hasManualEdits.value = false;
      activeDocuments.value = [];
      projectRoundsHistory.value = [];

      const diskRounds = await CEP_STORAGE.listProjectRounds(proj.id);
      const regRounds = (proj.rondas || []).map(r => r.data).filter(Boolean);
      projectRoundsHistory.value = CEP_STORAGE.sortRoundNames(Array.from(new Set([...regRounds, ...diskRounds])));

      if (projectRoundsHistory.value.length > 0) {
        const lastRoundDate = projectRoundsHistory.value[projectRoundsHistory.value.length - 1];
        const roundData = await CEP_STORAGE.loadProjectRound(proj.id, lastRoundDate);
        if (roundData) {
          currentView.value = 'workspace';
          await populateWorkspaceFromRoundData(roundData, lastRoundDate);
          return;
        }
      }

      targetRoundFolder.value = todayDateString.value;
      loadedFromRound.value = '';
      currentView.value = 'workspace';
      selectedDocumentIndex.value = 0;

      nextTick(() => {
        if (viewerContainer.value) {
          CEP_VIEWER.init(viewerContainer.value);
          loadSelectedDocument();
        }
        updateLogPreview();
      });
    };

    // --- FASE 3: APROVAR PROJETOS EM PAUTA, DELIBERAÇÃO E ENVIO PARA RELATORIA ---
    const approveProjectDirectly = async (proj) => {
      if (!proj || !proj.id) return;
      const confirmMsg = currentLang.value === 'es'
        ? `¿Confirmar la APROBACIÓN en reunión del protocolo "${proj.titulo}"?`
        : `Confirmar a APROVAÇÃO em reunião do protocolo "${proj.titulo}"?`;
      if (!confirm(confirmMsg)) return;

      const today = todayDateString.value;
      await CEP_STORAGE.updateProjectStatus(proj.id, 'aprovado', { data_aprovacao: today });
      if (activeProject.id === proj.id) {
        activeProject.status = 'aprovado';
        activeProject.data_aprovacao = today;
      }
      await loadWorkspaceData();
      if (showReportModal.value) {
        await generateReportForCurrentRange();
      }
    };

    const approveAllPautaProjects = async () => {
      const pautaList = projectsList.value.filter(p => p.status === 'em_pauta');
      if (pautaList.length === 0) return;

      const confirmMsg = currentLang.value === 'es'
        ? `¿Desea APROBAR todos los ${pautaList.length} proyecto(s) que están actualmente en Pauta de la Reunión?`
        : `Deseja APROVAR todos os ${pautaList.length} projeto(s) que estão atualmente em Pauta da Reunião?`;
      if (!confirm(confirmMsg)) return;

      const today = todayDateString.value;
      for (const p of pautaList) {
        await CEP_STORAGE.updateProjectStatus(p.id, 'aprovado', { data_aprovacao: today });
      }
      await loadWorkspaceData();
      if (showReportModal.value) {
        await generateReportForCurrentRange();
      }
    };

    const approveActiveWorkspaceProject = async () => {
      if (!activeProject.id) {
        await saveCurrentProject({ forcedStatus: 'aprovado' });
        return;
      }
      await approveProjectDirectly(activeProject);
    };

    /**
     * Item 14: Permite enviar um projeto para Relatoria mesmo que possua pendências abertas
     */
    const sendActiveProjectToRelatoria = async () => {
      if (selectedPendencias.value.length > 0) {
        const warnMsg = t('relatoriaWithPendenciasWarn').replace('{count}', String(selectedPendencias.value.length));
        if (!confirm(warnMsg)) return;
      }
      await saveCurrentProject({ forcedStatus: 'em_relatoria' });
    };

    const sendActiveProjectToPauta = async () => {
      await saveCurrentProject({ forcedStatus: 'em_pauta' });
    };

    const deliberateAprovar = async () => {
      if (!projectToDeliberate.value) return;
      const proj = projectToDeliberate.value;
      const today = todayDateString.value;
      await CEP_STORAGE.updateProjectStatus(proj.id, 'aprovado', { data_aprovacao: today });
      await loadWorkspaceData();
      closeDeliberationModal();
    };

    const deliberateVoltarPendencia = async () => {
      if (!projectToDeliberate.value) return;
      const proj = projectToDeliberate.value;
      await CEP_STORAGE.updateProjectStatus(proj.id, 'em_analise');
      await loadWorkspaceData();
      showDeliberationModal.value = false;
      await doOpenProject(proj);
    };

    const deliberateApenasInspecionar = async () => {
      if (!projectToDeliberate.value) return;
      const proj = projectToDeliberate.value;
      showDeliberationModal.value = false;
      await doOpenProject(proj);
    };

    // --- FASE 4: CADERNO DE RELATORIA COM RANGO PERSONALIZADO E ATALHOS RÁPIDOS ---
    const computeRangeForPreset = (presetKey) => {
      const now = new Date();
      const endIso = CEP_RULES_ENGINE.formatDateISO(now);

      if (presetKey === 'ciclo') {
        const prev = CEP_RULES_ENGINE.getPreviousMeetingDate(now, config.meetingOverrides);
        const next = CEP_RULES_ENGINE.getNextMeetingDate(now, config.meetingOverrides);
        return {
          start: CEP_RULES_ENGINE.formatDateISO(prev),
          end: CEP_RULES_ENGINE.formatDateISO(next)
        };
      }

      const startObj = new Date(now);
      if (presetKey === '1m') {
        startObj.setMonth(startObj.getMonth() - 1);
      } else if (presetKey === '2m') {
        startObj.setMonth(startObj.getMonth() - 2);
      } else if (presetKey === '3m') {
        startObj.setMonth(startObj.getMonth() - 3);
      } else if (presetKey === '1y') {
        startObj.setFullYear(startObj.getFullYear() - 1);
      } else {
        startObj.setMonth(startObj.getMonth() - 1);
      }

      return {
        start: CEP_RULES_ENGINE.formatDateISO(startObj),
        end: endIso
      };
    };

    const generateReportForCurrentRange = async () => {
      try {
        isGeneratingReport.value = true;
        if (!reportStartDate.value || !reportEndDate.value) {
          const def = computeRangeForPreset('1m');
          reportStartDate.value = def.start;
          reportEndDate.value = def.end;
        }
        reportData.value = await CEP_STORAGE.getReportData({
          startDate: reportStartDate.value,
          endDate: reportEndDate.value,
          referenceDate: new Date(),
          projectsSource: projectsList.value,
          cutoffDays: config.cutoffDays || 20
        });
      } catch (err) {
        console.error('Erro ao gerar caderno de relatoria:', err);
        alert('Erro ao gerar o caderno de relatoria: ' + err.message);
      } finally {
        isGeneratingReport.value = false;
      }
    };

    const openMonthlyReportModal = async (preset = null) => {
      const chosen = preset || reportPreset.value || '1m';
      if (chosen !== 'custom') {
        reportPreset.value = chosen;
        const range = computeRangeForPreset(chosen);
        reportStartDate.value = range.start;
        reportEndDate.value = range.end;
      }
      await generateReportForCurrentRange();
      pushNavState({ type: 'modal', name: 'report' });
      showReportModal.value = true;
    };

    const applyReportPreset = async (presetKey) => {
      reportPreset.value = presetKey;
      const range = computeRangeForPreset(presetKey);
      reportStartDate.value = range.start;
      reportEndDate.value = range.end;
      await generateReportForCurrentRange();
    };

    const onCustomReportDatesChange = async () => {
      reportPreset.value = 'custom';
      if (reportStartDate.value && reportEndDate.value) {
        await generateReportForCurrentRange();
      }
    };

    const triggerPrintReport = () => {
      window.print();
    };

    // --- CONTROLE DO VISOR MULTIFORMATO ---
    const loadSelectedDocument = async () => {
      if (activeDocuments.value.length > 0 && activeDocuments.value[selectedDocumentIndex.value]) {
        const docItem = activeDocuments.value[selectedDocumentIndex.value];
        await CEP_VIEWER.loadDocument(docItem.file);
        viewerCurrentPage.value = CEP_VIEWER.currentPage;
        viewerTotalPages.value = CEP_VIEWER.totalPages;
        viewerZoomPercent.value = Math.round(CEP_VIEWER.zoomScale * 100);
        viewerMatchesCount.value = CEP_VIEWER.totalMatches;
        viewerCurrentMatch.value = CEP_VIEWER.currentMatchIndex;
      } else if (viewerContainer.value) {
        viewerContainer.value.innerHTML = `
          <div style="padding: 36px 28px; background: var(--surface-primary); border: 1px solid var(--border-medium); border-radius: 8px; text-align: center; max-width: 460px; margin: 48px auto;">
            <p style="font-weight: 600; font-size: 14px; color: var(--text-primary); margin-bottom: 8px;">Nenhum documento carregado nesta rodada</p>
            <p style="font-size: 12.5px; color: var(--text-secondary); line-height: 1.5;">Clique em <strong>"Gerenciar"</strong> ou <strong>"+ Subir"</strong> na barra superior do visor para adicionar ou substituir arquivos.</p>
          </div>
        `;
      }
    };

    const onDocumentChange = () => loadSelectedDocument();

    const viewerNextPage = async () => {
      await CEP_VIEWER.nextPage();
      viewerCurrentPage.value = CEP_VIEWER.currentPage;
    };

    const viewerPrevPage = async () => {
      await CEP_VIEWER.prevPage();
      viewerCurrentPage.value = CEP_VIEWER.currentPage;
    };

    const viewerZoomIn = () => {
      CEP_VIEWER.zoomIn();
      viewerZoomPercent.value = Math.round(CEP_VIEWER.zoomScale * 100);
    };

    const viewerZoomOut = () => {
      CEP_VIEWER.zoomOut();
      viewerZoomPercent.value = Math.round(CEP_VIEWER.zoomScale * 100);
    };

    const viewerZoomFit = () => {
      CEP_VIEWER.zoomFit();
      viewerZoomPercent.value = Math.round(CEP_VIEWER.zoomScale * 100);
    };

    const viewerRotate = () => CEP_VIEWER.rotate();

    const performViewerSearch = async () => {
      await CEP_VIEWER.search(viewerSearchTerm.value, viewerCaseSensitive.value, viewerAccentSensitive.value);
      viewerMatchesCount.value = CEP_VIEWER.totalMatches;
      viewerCurrentMatch.value = CEP_VIEWER.currentMatchIndex;
    };

    const viewerNextMatch = () => {
      CEP_VIEWER.nextMatch();
      viewerCurrentMatch.value = CEP_VIEWER.currentMatchIndex;
    };

    const viewerPrevMatch = () => {
      CEP_VIEWER.prevMatch();
      viewerCurrentMatch.value = CEP_VIEWER.currentMatchIndex;
    };

    // --- SELETOR DE PENDÊNCIAS, CHECKBOXES DE CATEGORIAS AUSENTES E BOTÃO LIMPAR TODAS ---
    const currentCategoryPendencias = computed(() => {
      // Se houver termo de busca, pesquisa em todas as categorias para facilitar localização rápida
      if (pendenciaSearchQuery.value.trim()) {
        const q = pendenciaSearchQuery.value.toLowerCase().trim();
        const results = [];
        availableCategories.value.forEach(cat => {
          (cat.pendencias || []).forEach(p => {
            if (
              (p.title && p.title.toLowerCase().includes(q)) ||
              (p.title_es && p.title_es.toLowerCase().includes(q)) ||
              (p.template && p.template.toLowerCase().includes(q)) ||
              (p.normativa && p.normativa.toLowerCase().includes(q))
            ) {
              results.push(p);
            }
          });
        });
        return results;
      }

      const cat = availableCategories.value.find(c => c.id === activeCategoryTab.value);
      if (!cat) return [];
      return cat.pendencias;
    });

    const isPendenciaSelected = (pendId) => selectedPendencias.value.some(p => p.id === pendId);
    const getSelectedPendencia = (pendId) => selectedPendencias.value.find(p => p.id === pendId);

    const getPendenciasCountByCategory = (catId) => {
      const cat = availableCategories.value.find(c => c.id === catId);
      if (!cat) return 0;
      const ids = cat.pendencias.map(p => p.id);
      return selectedPendencias.value.filter(sp => ids.includes(sp.id)).length;
    };

    const syncAutoStatusAfterPendenciasChange = () => {
      if (activeProject.status === 'aprovado' || activeProject.status === 'em_pauta' || activeProject.status === 'em_relatoria') {
        return;
      }
      activeProject.status = selectedPendencias.value.length === 0 ? 'ainda_nao_relatado' : 'em_analise';
    };

    const togglePendencia = (pend) => {
      const idx = selectedPendencias.value.findIndex(p => p.id === pend.id);
      if (idx >= 0) {
        recordPendencyResolved(pend.id, 'unchecked', 'Pendência desmarcada pelo avaliador');
        selectedPendencias.value.splice(idx, 1);
      } else {
        const inferredDocType = inferDocTypeFromPendencia(pend, activeCategoryTab.value);
        const matchingDocs = activeDocuments.value.filter(d => d.targetType === inferredDocType);
        const currentDoc = activeDocuments.value[selectedDocumentIndex.value];

        let initialDocIds = matchingDocs.map(d => d.docId);
        if (initialDocIds.length === 0 && currentDoc && inferredDocType === currentDoc.targetType) {
          initialDocIds = [currentDoc.docId];
        }

        const isMissingCats = CEP_RULES_ENGINE.isMissingCategoriesPendencia(pend);
        const nowISO = new Date().toISOString();

        const newSelected = {
          id: pend.id,
          title: pend.title,
          template: pend.template,
          normativa: pend.normativa,
          hasCategoryCheckboxes: isMissingCats,
          missingCategories: [],
          observacaoRelator: '',
          categoryId: activeCategoryTab.value,
          documentIds: initialDocIds,
          targetDocTypes: [inferredDocType],
          targetDocType: inferredDocType,
          createdAt: nowISO,
          updatedAt: nowISO,
          manuallyConfirmedInCurrentRound: true
        };

        selectedPendencias.value.push(newSelected);
        recordPendencyCreated(newSelected);
      }
      syncAutoStatusAfterPendenciasChange();
      updateLogPreview();
    };

    /**
     * Item 7: Checkboxes múltiplos para "Ausência de arquivo separado na categoria de:"
     */
    const isMissingCategoriesPend = (pend) => {
      return CEP_RULES_ENGINE.isMissingCategoriesPendencia(pend);
    };

    const isMissingCategoryChecked = (pendId, labelPt) => {
      const sp = getSelectedPendencia(pendId);
      if (!sp || !Array.isArray(sp.missingCategories)) return false;
      return sp.missingCategories.includes(labelPt);
    };

    const toggleMissingCategoryCheckbox = (pendId, labelPt) => {
      const sp = getSelectedPendencia(pendId);
      if (!sp) return;
      if (!Array.isArray(sp.missingCategories)) sp.missingCategories = [];

      const i = sp.missingCategories.indexOf(labelPt);
      if (i >= 0) sp.missingCategories.splice(i, 1);
      else sp.missingCategories.push(labelPt);

      sp.template = CEP_RULES_ENGINE.buildMissingCategoriesTemplate(sp, sp.missingCategories);
      sp.updatedAt = new Date().toISOString();
      recordPendencyModificationEvent(sp, `Categorias ausentes selecionadas: ${sp.missingCategories.join(', ') || 'nenhuma'}`);
      updateLogPreview();
    };

    const onObservacaoRelatorInput = (pendId) => {
      const sp = getSelectedPendencia(pendId);
      if (sp) {
        sp.updatedAt = new Date().toISOString();
      }
      updateLogPreview();
    };

    /**
     * Item 5: Botão para limpar TODAS as pendências ativas conservando 100% os documentos atuais e suas versões
     */
    const clearAllActivePendencias = () => {
      if (selectedPendencias.value.length === 0) return;
      if (!confirm(t('confirmClearAllPendencias'))) return;

      const nowISO = new Date().toISOString();
      if (!Array.isArray(activeProject.pendencyHistory)) activeProject.pendencyHistory = [];

      // Registra limpeza no histórico de pendências para rastreabilidade
      selectedPendencias.value.forEach(sp => {
        const openEntry = findOpenHistoryEntry(sp.id);
        if (openEntry) {
          openEntry.updatedAt = nowISO;
          openEntry.resolvedAt = nowISO;
          openEntry.resolutionReason = 'cleared_all';
          if (!Array.isArray(openEntry.events)) openEntry.events = [];
          openEntry.events.push({
            action: 'cleared_all',
            at: nowISO,
            note: 'Todas as pendências ativas foram limpas para nova avaliação (documentos preservados intactos)'
          });
        } else {
          activeProject.pendencyHistory.push({
            entryId: `ph_clear_${Date.now()}_${sp.id}`,
            pendenciaId: sp.id,
            title: sp.title,
            categoryId: sp.categoryId || 'geral',
            documentIds: [...(sp.documentIds || [])],
            documentNames: [],
            targetDocTypes: [...(sp.targetDocTypes || [sp.targetDocType || 'Geral'])],
            observacaoRelator: sp.observacaoRelator || '',
            createdAt: sp.createdAt || nowISO,
            updatedAt: nowISO,
            resolvedAt: nowISO,
            resolutionReason: 'cleared_all',
            roundFolder: targetRoundFolder.value || todayDateString.value,
            events: [{ action: 'cleared_all', at: nowISO, note: 'Limpeza total de pendências ativas' }]
          });
        }
      });

      // Zera pendências ativas sem tocar em activeDocuments nem em suas versões/hashes
      selectedPendencias.value = [];
      hasManualEdits.value = false;
      syncAutoStatusAfterPendenciasChange();
      updateLogPreview();
    };

    const addCustomPendenciaToCurrentCategory = () => {
      const text = prompt('Descreva a pendência ou exigência específica a ser incluída no parecer:');
      if (!text || !text.trim()) return;

      const customId = `CUSTOM-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
      const newPend = {
        id: customId,
        title: text.substring(0, 65) + (text.length > 65 ? '...' : ''),
        template: text.trim(),
        normativa: 'Exigência Específica do Relator / Colegiado',
        observacaoRelator: ''
      };

      const targetCatId = activeCategoryTab.value === 'resumo' ? 'geral' : activeCategoryTab.value;
      const cat = availableCategories.value.find(c => c.id === targetCatId);
      if (cat) cat.pendencias.push(newPend);
      togglePendencia(newPend);
    };

    const updateLogPreview = () => {
      const generated = CEP_RULES_ENGINE.generateOfficialLogText({
        projeto: activeProject,
        config: config,
        pendenciasSelecionadas: selectedPendencias.value,
        documentosAtivos: activeDocuments.value,
        referenceDate: new Date()
      });
      officialGeneratedLog.value = generated;

      if (!hasManualEdits.value) {
        editableLogText.value = generated;
      }
    };

    const resetToOriginalLog = () => {
      hasManualEdits.value = false;
      editableLogText.value = officialGeneratedLog.value;
    };

    const onLogManualEdit = () => {
      hasManualEdits.value = editableLogText.value.trim() !== officialGeneratedLog.value.trim();
    };

    const copyLogToClipboard = () => {
      navigator.clipboard.writeText(editableLogText.value);
      alert('Parecer copiado para a área de transferência!');
    };

    const downloadTxtFile = (filename, content) => {
      const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    };

    // --- SALVAMENTO E EXPORTAÇÃO COM PRESERVAÇÃO DE HISTÓRICO POR DATA ---
    const saveCurrentProject = async ({ forcedStatus = null } = {}) => {
      if (!activeProject.titulo || !activeProject.pesquisador) {
        alert('Por favor, preencha o Nome do Pesquisador e o Título da Pesquisa no cabeçalho.');
        return;
      }

      if (!folderConnected.value && typeof window.showDirectoryPicker === 'function') {
        const confirmConnect = confirm('Para salvar a estrutura física de pastas no computador, selecione sua pasta base de trabalho do CEP (ou cancele para salvar no armazenamento local do navegador).');
        if (confirmConnect) {
          try {
            const handle = await CEP_STORAGE.selectDirectory();
            folderConnected.value = true;
            folderName.value = handle.name;
          } catch (err) {}
        }
      }

      let targetStatus = forcedStatus || activeProject.status || 'em_analise';

      if (!forcedStatus) {
        if (selectedPendencias.value.length === 0) {
          if (activeProject.status === 'aprovado' || activeProject.status === 'em_pauta' || activeProject.status === 'em_relatoria') {
            targetStatus = activeProject.status;
          } else {
            const confirmSend = confirm(t('sendToPautaPrompt'));
            if (confirmSend) {
              targetStatus = 'em_pauta';
            } else {
              targetStatus = 'ainda_nao_relatado';
            }
          }
        } else {
          // Mantém em_relatoria se o usuário já o encaminhou para relatoria com pendências
          targetStatus = activeProject.status === 'em_relatoria' ? 'em_relatoria' : 'em_analise';
        }
      }

      activeProject.status = targetStatus;
      if (targetStatus === 'aprovado' && !activeProject.data_aprovacao) {
        activeProject.data_aprovacao = todayDateString.value;
      }

      isSaving.value = true;
      try {
        const result = await CEP_STORAGE.saveProjectRound({
          id: activeProject.id || null,
          instituicao: activeProject.instituicao || config.instituicao || 'Instituicao',
          pesquisador: activeProject.pesquisador,
          titulo: activeProject.titulo,
          caae: activeProject.caae,
          relator: activeProject.relator,
          tipoProjeto: activeProject.tipoProjeto || 'Projeto_Detalhado',
          areasTematicas: activeProject.areasTematicas || ['geral'],
          enquadramento: activeProject.enquadramento,
          enquadramentoTipo: activeProject.enquadramentoTipo,
          enquadramentoCustom: activeProject.enquadramentoCustom,
          status: targetStatus,
          data_aprovacao: activeProject.data_aprovacao || null,
          pendencias_count: selectedPendencias.value.length,
          pendencyHistory: activeProject.pendencyHistory || [],
          targetRoundFolder: targetRoundFolder.value || todayDateString.value,
          arquivosClassificados: activeDocuments.value,
          pendenciasSelecionadas: selectedPendencias.value,
          logText: officialGeneratedLog.value,
          mlogText: editableLogText.value,
          hasModifications: hasManualEdits.value,
          allowVirtualFallback: true
        });

        activeProject.id = result.projectFolderId;
        loadedFromRound.value = result.todayFolder;
        if (!projectRoundsHistory.value.includes(result.todayFolder)) {
          projectRoundsHistory.value = CEP_STORAGE.sortRoundNames([...projectRoundsHistory.value, result.todayFolder]);
        }

        await loadWorkspaceData();
        const msgLogs = hasManualEdits.value ? 'log.txt (original) e mlog.txt (modificado)' : 'log.txt (oficial)';
        const statusInfo = `\n📋 Status atual: ${getStatusLabel(targetStatus)}`;
        alert(`✅ Projeto e documentos salvos com sucesso!${statusInfo}\n\nPasta da Rodada Atual:\n${result.projectFolderId}/${result.todayFolder}/\n\nArquivos registrados:\n- ${activeDocuments.value.length} documento(s) padronizado(s)\n- ${msgLogs}`);
      } catch (err) {
        console.error('Erro ao salvar projeto:', err);
        alert('Erro ao gravar na pasta: ' + err.message);
      } finally {
        isSaving.value = false;
      }
    };

    // --- RESIZABLE SPLITTER ---
    const startSplitterDrag = () => {
      isDraggingSplitter.value = true;
      window.addEventListener('mousemove', onSplitterDrag);
      window.addEventListener('mouseup', stopSplitterDrag);
    };

    const onSplitterDrag = (e) => {
      if (!isDraggingSplitter.value) return;
      const totalWidth = window.innerWidth;
      const newWidthPercent = (e.clientX / totalWidth) * 100;
      if (newWidthPercent >= 22 && newWidthPercent <= 78) {
        leftPaneWidth.value = Math.round(newWidthPercent * 10) / 10;
      }
    };

    const stopSplitterDrag = () => {
      isDraggingSplitter.value = false;
      window.removeEventListener('mousemove', onSplitterDrag);
      window.removeEventListener('mouseup', stopSplitterDrag);
      localStorage.setItem('cep_split_width', leftPaneWidth.value);
    };

    // --- CICLO DE VIDA ---
    onMounted(async () => {
      const savedLang = localStorage.getItem('cep_lang');
      if (savedLang) currentLang.value = savedLang;

      const savedTheme = localStorage.getItem('cep_theme');
      applyTheme(savedTheme === 'dark');

      const savedWidth = localStorage.getItem('cep_split_width');
      if (savedWidth) leftPaneWidth.value = parseFloat(savedWidth);

      const localCfg = localStorage.getItem('cep_saved_config');
      if (localCfg) {
        try {
          const parsed = JSON.parse(localCfg);
          if (parsed.config) Object.assign(config, parsed.config);
          if (parsed.customCategories && Array.isArray(parsed.customCategories)) {
            availableCategories.value = mergeCategoriesWithDefaults(parsed.customCategories, DEFAULT_PENDENCIAS_CATEGORIES);
          }
        } catch (e) {}
      }

      syncMeetingsToEngine();
      await loadWorkspaceData();

      // Inicializa datas padrão do caderno de relatoria (último mês)
      const initialRange = computeRangeForPreset('1m');
      reportStartDate.value = initialRange.start;
      reportEndDate.value = initialRange.end;

      window.addEventListener('keydown', (e) => {
        if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'f' && currentView.value === 'workspace') {
          if (viewerSearchInput.value) {
            e.preventDefault();
            viewerSearchInput.value.focus();
            viewerSearchInput.value.select();
          }
        }
        if (e.key === 'Escape') {
          if (showDuplicateHashModal.value) closeDuplicateHashModal();
          else if (showUploadFlowModal.value) closeUploadFlowModal();
          else if (showDocDetailModal.value) closeDocDetailModal();
          else if (showPendencyHistoryModal.value) closePendencyHistoryModal();
          else if (showReportModal.value) closeReportModal();
          else if (showDocumentsModal.value) closeDocumentsModal();
          else if (showConfigModal.value) closeConfigModal();
          else if (showNewProjectModal.value) closeNewProjectModal();
          else if (showDeliberationModal.value) closeDeliberationModal();
          else if (showWorkspaceAreasPopover.value) showWorkspaceAreasPopover.value = false;
        }
      });

      let isExitingApp = false;
      try {
        history.replaceState({ type: 'base' }, '');
        history.pushState({ type: 'root', view: currentView.value }, '');
      } catch (e) {}

      const armHistoryBarrier = () => {
        try {
          if (!history.state || history.state.type !== 'root') {
            history.pushState({ type: 'root', view: currentView.value }, '');
          }
        } catch (e) {}
      };
      window.addEventListener('pointerdown', armHistoryBarrier, { once: true });
      window.addEventListener('keydown', armHistoryBarrier, { once: true });

      window.addEventListener('popstate', () => {
        if (isExitingApp) return;
        if (showDuplicateHashModal.value) { showDuplicateHashModal.value = false; return; }
        if (showUploadFlowModal.value) { showUploadFlowModal.value = false; return; }
        if (showDocDetailModal.value) { showDocDetailModal.value = false; return; }
        if (showPendencyHistoryModal.value) { showPendencyHistoryModal.value = false; return; }
        if (showReportModal.value) { showReportModal.value = false; return; }
        if (showDocumentsModal.value) { showDocumentsModal.value = false; return; }
        if (showConfigModal.value) { showConfigModal.value = false; return; }
        if (showNewProjectModal.value) { showNewProjectModal.value = false; return; }
        if (showDeliberationModal.value) { showDeliberationModal.value = false; return; }

        if (currentView.value === 'workspace') {
          currentView.value = 'history';
          return;
        }

        const confirmMsg = currentLang.value === 'es'
          ? '¿Deseas salir del CEP Assistant?'
          : 'Deseja realmente sair do CEP Assistant?';

        if (confirm(confirmMsg)) {
          isExitingApp = true;
          history.back();
        } else {
          history.pushState({ type: 'root', view: 'history' }, '');
        }
      });

      window.addEventListener('beforeunload', (e) => {
        if (isExitingApp) return;
        if (folderConnected.value || currentView.value === 'workspace' || projectsList.value.length > 0) {
          e.preventDefault();
          e.returnValue = '';
        }
      });

      const reconnectedHandle = await CEP_STORAGE.reconnectStoredDirectory();
      if (reconnectedHandle) {
        folderConnected.value = true;
        folderName.value = reconnectedHandle.name;
        await loadWorkspaceData();
      }
    });

    return {
      currentLang,
      isDarkMode,
      toggleDarkMode,
      docTypesCatalog,
      projectTypesCatalog,
      specialAreasCatalog,
      missingCategoryOptions,
      folderConnected,
      folderName,
      currentView,
      returnToHistoryView,
      config,
      configTab,
      meetingCalendarYear,
      meetingCalendarRows,
      onChangeMeetingDateOverride,
      onToggleMeetingCancelled,
      onUpdateMeetingNote,
      resetSingleMeetingOverride,
      newCategoryName,
      newPendenciaForm,
      savedRelatores,
      savedInstituicoes,
      newCatalogInstitutionInput,
      showInstSuggestionsNewProj,
      showInstSuggestionsWorkspace,
      filteredInstSuggestionsNewProj,
      filteredInstSuggestionsWorkspace,
      isInstitutionInCatalog,
      saveInstitutionToCatalog,
      addFromConfigInstitutionInput,
      removeInstitutionFromCatalog,
      selectInstitutionNewProj,
      selectInstitutionWorkspace,
      hideInstDropdownDelayed,
      showWorkspaceAreasPopover,
      isAreaSelected,
      toggleAreaTematica,
      formatAreasSummary,
      availableCategories,
      activeCategoryTab,
      selectedPendencias,
      pendenciaSearchQuery,
      projectsList,
      searchFilter,
      statusFilter,
      mainScreenView,
      dashboardPeriod,
      sortField,
      sortAsc,
      filteredProjects,
      countAllProjects,
      countEmAnaliseProjects,
      countAindaNaoRelatadoProjects,
      countEmRelatoriaProjects,
      countEmPautaProjects,
      countAprovadoProjects,
      dashboardMetrics,
      showDeliberationModal,
      projectToDeliberate,
      approveProjectDirectly,
      approveAllPautaProjects,
      approveActiveWorkspaceProject,
      sendActiveProjectToRelatoria,
      sendActiveProjectToPauta,
      deliberateAprovar,
      deliberateVoltarPendencia,
      deliberateApenasInspecionar,
      closeDeliberationModal,
      showReportModal,
      reportData,
      reportPreset,
      reportStartDate,
      reportEndDate,
      isGeneratingReport,
      openMonthlyReportModal,
      applyReportPreset,
      onCustomReportDatesChange,
      generateReportForCurrentRange,
      triggerPrintReport,
      closeReportModal,
      activeProject,
      targetRoundFolder,
      loadedFromRound,
      projectRoundsHistory,
      activeDocuments,
      selectedDocumentIndex,
      activeDocumentItem,
      activeDocumentPendencias,
      showNewProjectModal,
      closeNewProjectModal,
      newProjectForm,
      newProjectFiles,
      showDocumentsModal,
      closeDocumentsModal,
      showConfigModal,
      closeConfigModal,
      showUploadFlowModal,
      closeUploadFlowModal,
      pendingUploadContext,
      pendingUploadQueue,
      existingDocsForUploadModal,
      confirmUploadFlow,
      showDuplicateHashModal,
      closeDuplicateHashModal,
      duplicateHashInfo,
      showDocDetailModal,
      closeDocDetailModal,
      inspectedDocIndex,
      inspectedDocItem,
      renameDocInput,
      openDocDetailModal,
      applyDocumentRename,
      markInheritedPendenciaResolved,
      showPendencyHistoryModal,
      closePendencyHistoryModal,
      openPendencyHistoryModal,
      phFilterDocId,
      phFilterMode,
      phExactDate,
      phStartDate,
      phEndDate,
      filteredPendencyHistoryList,
      viewerCurrentPage,
      viewerTotalPages,
      viewerZoomPercent,
      viewerSearchTerm,
      viewerCaseSensitive,
      viewerAccentSensitive,
      viewerMatchesCount,
      viewerCurrentMatch,
      viewerContainer,
      viewerSearchInput,
      folderFileInput,
      multiFileInput,
      replaceFileInput,
      leftPaneWidth,
      isDraggingSplitter,
      officialGeneratedLog,
      editableLogText,
      hasManualEdits,
      todayDateString,
      calculatedDatesInfo,
      isSaving,
      t,
      setLanguage,
      formatDateBR,
      formatDateTimeBR,
      displayRelatorName,
      getDocTypeLabel,
      getStatusLabel,
      getPendenciasForDocType,
      getPendenciasForDocument,
      isDocLinkedToPendencia,
      isGeralLinkedToPendencia,
      togglePendenciaDocLink,
      setPendenciaAsGeralOnly,
      isMissingCategoriesPend,
      isMissingCategoryChecked,
      toggleMissingCategoryCheckbox,
      onObservacaoRelatorInput,
      clearAllActivePendencias,
      sortProjects,
      chooseDirectory,
      openConfigModal,
      saveInstitutionConfig,
      createNewCategory,
      createNewStandardPendencia,
      openNewProjectModal,
      triggerFolderFilePicker,
      triggerMultiFilePicker,
      onFilesSelectedFromDisk,
      openDocumentsManagerModal,
      triggerReplaceDocument,
      onReplaceFileSelected,
      removeActiveDocument,
      viewDocumentFromModal,
      startNewSubmissionRound,
      switchToHistoricalRound,
      removeNewProjectFile,
      finalizeNewProjectCreation,
      openExistingProject,
      onDocumentChange,
      viewerNextPage,
      viewerPrevPage,
      viewerZoomIn,
      viewerZoomOut,
      viewerZoomFit,
      viewerRotate,
      performViewerSearch,
      viewerNextMatch,
      viewerPrevMatch,
      currentCategoryPendencias,
      isPendenciaSelected,
      getSelectedPendencia,
      getPendenciasCountByCategory,
      togglePendencia,
      addCustomPendenciaToCurrentCategory,
      updateLogPreview,
      resetToOriginalLog,
      onLogManualEdit,
      copyLogToClipboard,
      downloadTxtFile,
      saveCurrentProject,
      startSplitterDrag
    };
  }
});

app.mount('#app');
