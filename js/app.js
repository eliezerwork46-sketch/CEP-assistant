/**
 * APP.JS
 * Controlador Principal da Aplicação Vue.js 3
 * Orquestra Persistência, Gestão de Documentos/Rodadas, Visor Multiformato, Motor de Regras e Interface Edge-to-Edge
 */

const { createApp, ref, reactive, computed, onMounted, nextTick } = Vue;

const DOC_TYPES_CATALOG = [
  { value: 'Folha_de_Rosto', label: 'Folha de Rosto', label_es: 'Hoja de Rostro' },
  { value: 'TCLE', label: 'TCLE (Consentimento)', label_es: 'TCLE (Consentimiento)' },
  { value: 'TCLE_dos_Pais', label: 'TCLE dos Pais / Responsáveis', label_es: 'TCLE de Padres / Tutores' },
  { value: 'TALE', label: 'TALE (Assentimento Menores)', label_es: 'TALE (Asentimiento Menores)' },
  { value: 'Projeto_Detalhado', label: 'Resumo / Projeto Detalhado', label_es: 'Resumen / Proyecto Detallado' },
  { value: 'Cronograma', label: 'Cronograma de Execução', label_es: 'Cronograma de Ejecución' },
  { value: 'Termo_de_Anuencia', label: 'Termo de Anuência Institucional', label_es: 'Autorización Institucional (Anuencia)' },
  { value: 'TCUD', label: 'TCUD (Banco de Dados / Prontuários)', label_es: 'TCUD (Base de Datos / Historias)' },
  { value: 'Instrumento_Coleta', label: 'Instrumento de Coleta / Questionário', label_es: 'Instrumento de Recolección / Cuestionario' },
  { value: 'Orcamento', label: 'Orçamento Financeiro', label_es: 'Presupuesto Financiero' },
  { value: 'Carta_Resposta', label: 'Carta Resposta de Pendências', label_es: 'Carta de Respuesta de Pendencias' },
  { value: 'Outro', label: 'Outro (especificar)', label_es: 'Otro (especificar)' }
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

    // Configurações Institucionais do CEP (Configura-se uma única vez e fica salvo)
    const config = reactive({
      nomeCep: 'Comitê de Ética em Pesquisa - CEP UCDB',
      instituicao: 'Universidade Católica Dom Bosco',
      endereco: 'Av. Tamandaré, 6000, Jardim Seminário - CEP: 79117-900 - Campo Grande - MS',
      telefone: '(67) 3312-3478',
      email: 'cep@ucdb.br',
      horario: '13h às 17h',
      site: 'https://site.ucdb.br/institucional/1/comites/2522/cep/2523/',
      meetingRule: 'last_thursday',
      cutoffDays: 20
    });

    // Aba ativa dentro do Modal de Configurações ('instituicao' | 'pendencias')
    const configTab = ref('instituicao');

    // Formulário para criar Nova Categoria e Nova Pendência nas Configurações
    const newCategoryName = ref('');
    const newPendenciaForm = reactive({
      categoryId: 'geral',
      title: '',
      normativa: '',
      template: ''
    });

    // Memória Dinâmica de Relatores (aprendidos conforme digitados)
    const savedRelatores = ref([]);

    // Categorias e Pendências
    const availableCategories = ref(JSON.parse(JSON.stringify(DEFAULT_PENDENCIAS_CATEGORIES)));
    const activeCategoryTab = ref('geral');
    const selectedPendencias = ref([]); // Array de { id, title, template, normativa, observacaoRelator, categoryId, targetDocType }
    const pendenciaSearchQuery = ref('');

    // Tabela Histórica e Ordenação FIFO (Mais antiga 1ª submissão primeiro)
    const projectsList = ref([]);
    const searchFilter = ref('');
    const statusFilter = ref('todos'); // 'todos' | 'em_analise' | 'em_pauta' | 'aprovado'
    const sortField = ref('data_primeira_submissao');
    const sortAsc = ref(true);

    // Navegação Principal da Tela Inicial ('historico' | 'dashboard')
    const mainScreenView = ref('historico');
    const dashboardPeriod = ref('ciclo'); // 'ciclo' | 'mes' | 'trimestre' | 'semestre' | 'ano'

    // Modal de Deliberação Colegiada para projetos em pauta
    const showDeliberationModal = ref(false);
    const projectToDeliberate = ref(null);

    // Modal e Dados do Caderno / Relatório Colegiado em PDF
    const showReportModal = ref(false);
    const reportData = ref(null);
    const reportTargetMonth = ref(new Date().toISOString().substring(0, 7)); // 'YYYY-MM'
    const isGeneratingReport = ref(false);

    // Projeto Ativo na Mesa de Trabalho
    const activeProject = reactive({
      id: '',
      caae: '',
      instituicao: '',
      pesquisador: '',
      titulo: '',
      relator: '',
      status: 'em_analise', // 'em_analise' | 'em_pauta' | 'aprovado'
      data_aprovacao: null,
      enquadramentoTipo: 'geral',
      enquadramentoCustom: '',
      enquadramento: {
        geral: true,
        menores: false,
        bancoDados: false,
        indigena: false
      }
    });

    // Controle de Rodadas / Pastas de Versão (Histórico por Data)
    const targetRoundFolder = ref(new Date().toISOString().split('T')[0]);
    const loadedFromRound = ref('');
    const projectRoundsHistory = ref([]); // Lista de subpastas de datas existentes no projeto

    // Form do Modal de Novo Projeto
    const showNewProjectModal = ref(false);
    const newProjectForm = reactive({
      instituicao: '',
      pesquisador: '',
      titulo: '',
      caae: '',
      relator: '',
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

    // Documentos da Rodada Atual e Modal de Gestão de Documentos
    const activeDocuments = ref([]); // Array de { file: File, originalFileName: string, targetType: string, customName: string, extension: string, originRound: string, replacedAt: string|null }
    const selectedDocumentIndex = ref(0);
    const showDocumentsModal = ref(false);
    const showConfigModal = ref(false);
    const replacingDocIndex = ref(-1);

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

    // Resizable Splitter (Largura do Painel Esquerdo em %)
    const leftPaneWidth = ref(54);
    const isDraggingSplitter = ref(false);

    // Aba Resumo e Logs
    const officialGeneratedLog = ref('');
    const editableLogText = ref('');
    const hasManualEdits = ref(false);

    const todayDateString = computed(() => {
      return new Date().toISOString().split('T')[0];
    });

    // --- NAVEGAÇÃO E INTEGRAÇÃO COM HISTORY API (BOTÃO VOLTAR DO NAVEGADOR) ---
    const pushNavState = (stateObj) => {
      try {
        const cur = history.state;
        if (cur && cur.name === stateObj.name && cur.type === stateObj.type) {
          return;
        }
        history.pushState(stateObj, '');
      } catch (e) {
        console.warn('History pushState:', e);
      }
    };

    const closeReportModal = () => {
      if (history.state && history.state.name === 'report') {
        history.back();
      } else {
        showReportModal.value = false;
      }
    };

    const closeNewProjectModal = () => {
      if (history.state && history.state.name === 'newProject') {
        history.back();
      } else {
        showNewProjectModal.value = false;
      }
    };

    const closeConfigModal = () => {
      if (history.state && history.state.name === 'config') {
        history.back();
      } else {
        showConfigModal.value = false;
      }
    };

    const closeDocumentsModal = () => {
      if (history.state && history.state.name === 'documents') {
        history.back();
      } else {
        showDocumentsModal.value = false;
      }
    };

    const closeDeliberationModal = () => {
      if (history.state && history.state.name === 'deliberation') {
        history.back();
      } else {
        showDeliberationModal.value = false;
      }
    };

    const returnToHistoryView = () => {
      if (history.state && history.state.name === 'workspace') {
        history.back();
      } else {
        currentView.value = 'history';
      }
    };

    // Datas Calculadas pelo Motor para Exibição Rápida
    const calculatedDatesInfo = computed(() => {
      const now = new Date();
      const meeting = CEP_RULES_ENGINE.getNextMeetingDate(now);
      const prevMeeting = CEP_RULES_ENGINE.getPreviousMeetingDate(now);
      const cutoffDate = CEP_RULES_ENGINE.calculateSubmissionDeadline(meeting, config.cutoffDays || 20);
      const collection = CEP_RULES_ENGINE.calculateCollectionStartDate(meeting);
      const deadline = CEP_RULES_ENGINE.calculateDiligenceDeadline(now, 10);
      const diffTime = meeting.getTime() - now.getTime();
      const diffDays = Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));

      return {
        reuniao: CEP_RULES_ENGINE.formatDateBR(meeting),
        proximaReuniao: CEP_RULES_ENGINE.formatDateBR(meeting),
        reuniaoAnterior: CEP_RULES_ENGINE.formatDateBR(prevMeeting),
        dataLimiteEnvio: CEP_RULES_ENGINE.formatDateBR(cutoffDate),
        diasAteReuniao: diffDays,
        coleta: CEP_RULES_ENGINE.formatDateBR(collection),
        prazo: CEP_RULES_ENGINE.formatDateBR(deadline)
      };
    });

    // --- TEMA CLARO / ESCURO ---
    const applyTheme = (dark) => {
      isDarkMode.value = dark;
      if (dark) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
      localStorage.setItem('cep_theme', dark ? 'dark' : 'light');
    };

    const toggleDarkMode = () => {
      applyTheme(!isDarkMode.value);
    };

    // --- FUNÇÃO DE INTERNACIONALIZAÇÃO (i18n) ---
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
      const cleanDate = dateStr.split('_')[0];
      const formatted = CEP_RULES_ENGINE.formatDateBR(cleanDate);
      return dateStr.includes('_') ? `${formatted} (${dateStr.split('_')[1]})` : formatted;
    };

    const getDocTypeLabel = (typeVal, customName = '') => {
      if (typeVal === 'Outro' && customName) return customName;
      const found = DOC_TYPES_CATALOG.find(d => d.value === typeVal);
      if (!found) return typeVal || 'Documento';
      return currentLang.value === 'es' ? found.label_es : found.label;
    };

    // --- VÍNCULO ENTRE PENDÊNCIAS E TIPOS DE DOCUMENTOS ---
    const inferDocTypeFromPendencia = (pend, catId) => {
      if (catId === 'folha_rosto' || (pend.id && pend.id.startsWith('P-FR'))) return 'Folha_de_Rosto';
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
      if (pend.id === 'P-GEN-03') return 'Instrumento_Coleta';
      if (catId === 'riscos_beneficios') {
        const currentDoc = activeDocuments.value[selectedDocumentIndex.value];
        if (currentDoc && ['TCLE', 'Projeto_Detalhado', 'TALE', 'TCLE_dos_Pais'].includes(currentDoc.targetType)) {
          return currentDoc.targetType;
        }
        return 'TCLE';
      }
      // Se estiver na aba geral ou outra e houver um documento aberto no visor, vincula ao tipo dele por padrão
      const currentDoc = activeDocuments.value[selectedDocumentIndex.value];
      if (currentDoc && currentDoc.targetType) {
        return currentDoc.targetType;
      }
      return 'Geral';
    };

    const getPendenciasForDocType = (docType) => {
      if (!docType) return [];
      return selectedPendencias.value.filter(sp => {
        const linkedType = sp.targetDocType || inferDocTypeFromPendencia(sp, sp.categoryId);
        return linkedType === docType;
      });
    };

    const getPendenciasForDocument = (doc) => {
      if (!doc) return [];
      return getPendenciasForDocType(doc.targetType);
    };

    const activeDocumentItem = computed(() => {
      return activeDocuments.value[selectedDocumentIndex.value] || null;
    });

    const activeDocumentPendencias = computed(() => {
      if (!activeDocumentItem.value) return [];
      return getPendenciasForDocument(activeDocumentItem.value);
    });

    // --- ORDENAÇÃO E FILTRO DA TABELA HISTÓRICA ---
    const countAllProjects = computed(() => projectsList.value.length);
    const countEmAnaliseProjects = computed(() => projectsList.value.filter(p => (p.status || 'em_analise') === 'em_analise').length);
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

    // --- PAINEL DE GESTÃO E INDICADORES DO CEP (DASHBOARD) ---
    const dashboardMetrics = computed(() => {
      const all = projectsList.value || [];
      const now = new Date();
      let start = null;
      let end = null;
      let periodLabel = '';

      if (dashboardPeriod.value === 'ciclo') {
        start = CEP_RULES_ENGINE.getPreviousMeetingDate(now);
        end = CEP_RULES_ENGINE.getNextMeetingDate(now);
        periodLabel = `Ciclo da Reunião (${CEP_RULES_ENGINE.formatDateBR(start)} a ${CEP_RULES_ENGINE.formatDateBR(end)})`;
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

      const parseDate = (dStr) => {
        if (!dStr) return null;
        const [y, m, d] = dStr.split('_')[0].split('-');
        return new Date(parseInt(y, 10), parseInt(m, 10) - 1, parseInt(d, 10));
      };

      const inPeriodProjects = all.filter(p => {
        if (!start || !end) return true;
        const dSub = parseDate(p.data_primeira_submissao || p.data_ultima_modificacao);
        if (!dSub) return false;
        return dSub >= start && dSub <= end;
      });

      const totalNovos = inPeriodProjects.length;
      const countAnalise = all.filter(p => (p.status || 'em_analise') === 'em_analise').length;
      const countPauta = all.filter(p => p.status === 'em_pauta').length;
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
        { label: 'Projeto Detalhado (Metodologia/Riscos)', count: Math.max(0, Math.round(countAnalise * 0.35)), pct: countAnalise > 0 ? 35 : 0 },
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
      if (sortField.value === field) {
        sortAsc.value = !sortAsc.value;
      } else {
        sortField.value = field;
        sortAsc.value = true;
      }
    };

    // --- GESTÃO DA PASTA DE TRABALHO LOCAL ---
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
      if (!Array.isArray(customCats) || customCats.length === 0) {
        return JSON.parse(JSON.stringify(defaultCats));
      }
      const merged = JSON.parse(JSON.stringify(defaultCats));
      const mergedMap = new Map(merged.map(c => [c.id, c]));

      customCats.forEach(cCat => {
        if (!cCat || !cCat.id) return;
        if (mergedMap.has(cCat.id)) {
          const targetCat = mergedMap.get(cCat.id);
          const existingIds = new Set((targetCat.pendencias || []).map(p => p.id));
          if (Array.isArray(cCat.pendencias)) {
            cCat.pendencias.forEach(p => {
              if (p && p.id && !existingIds.has(p.id)) {
                targetCat.pendencias.push(p);
                existingIds.add(p.id);
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
      const registry = await CEP_STORAGE.readJSONFile('registro_cep.json', { projetos: [], relatores: [] });
      projectsList.value = registry.projetos || [];
      savedRelatores.value = registry.relatores || [];

      const savedConfig = await CEP_STORAGE.readJSONFile('config_cep.json', null);
      if (savedConfig) {
        if (savedConfig.config) Object.assign(config, savedConfig.config);
        else Object.assign(config, savedConfig);

        if (savedConfig.customCategories && Array.isArray(savedConfig.customCategories)) {
          availableCategories.value = mergeCategoriesWithDefaults(savedConfig.customCategories, DEFAULT_PENDENCIAS_CATEGORIES);
        }
      }
    };

    const saveInstitutionConfig = async () => {
      const payload = {
        config: { ...config },
        customCategories: availableCategories.value
      };
      localStorage.setItem('cep_saved_config', JSON.stringify(payload));
      if (folderConnected.value) {
        await CEP_STORAGE.writeJSONFile('config_cep.json', payload);
      }
      closeConfigModal();
      updateLogPreview();
    };

    const openConfigModal = (initialTab = 'instituicao') => {
      pushNavState({ type: 'modal', name: 'config' });
      configTab.value = initialTab;
      showConfigModal.value = true;
    };

    // --- CRIAR NOVA CATEGORIA E NOVA PENDÊNCIA NAS CONFIGURAÇÕES ---
    const createNewCategory = () => {
      const name = newCategoryName.value.trim();
      if (!name) {
        alert('Digite o nome da nova categoria.');
        return;
      }
      const id = 'cat_' + name.toLowerCase().replace(/[^a-z0-9]/g, '_') + '_' + Date.now().toString().slice(-4);
      availableCategories.value.push({
        id,
        name: name,
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

      const newId = 'P-CUST-' + Date.now().toString().slice(-5);
      cat.pendencias.push({
        id: newId,
        title: newPendenciaForm.title.trim(),
        title_es: newPendenciaForm.title.trim(),
        normativa: newPendenciaForm.normativa.trim() || 'Normativa Institucional do CEP',
        template: newPendenciaForm.template.trim()
      });

      newPendenciaForm.title = '';
      newPendenciaForm.normativa = '';
      newPendenciaForm.template = '';
      alert(`Nova pendência adicionada na categoria "${cat.name}"!`);
    };

    const onEnquadramentoChange = (target) => {
      if (!target) return;
      const t = target.enquadramentoTipo;
      if (!target.enquadramento) {
        target.enquadramento = {};
      }
      target.enquadramento.geral = (t === 'geral');
      target.enquadramento.menores = (t === 'menores');
      target.enquadramento.bancoDados = (t === 'bancoDados');
      target.enquadramento.indigena = (t === 'indigena');
      if (t !== 'outro') {
        target.enquadramentoCustom = '';
      }
      updateLogPreview();
    };

    // --- FLUXO DE NOVO PROJETO E CLASSIFICAÇÃO DE ARQUIVOS ---
    const openNewProjectModal = () => {
      newProjectForm.instituicao = config.instituicao || '';
      newProjectForm.pesquisador = '';
      newProjectForm.titulo = '';
      newProjectForm.caae = '';
      newProjectForm.relator = savedRelatores.value[0] || '';
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
      if (folderFileInput.value) {
        folderFileInput.value.click();
      }
    };

    const triggerMultiFilePicker = () => {
      if (multiFileInput.value) {
        multiFileInput.value.click();
      }
    };

    const guessDocumentType = (filename) => {
      const name = filename.toLowerCase();
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

    const classifyFileList = (files, roundTag = null) => {
      const activeRound = roundTag || targetRoundFolder.value || todayDateString.value;
      return files.map(file => {
        const guessedType = guessDocumentType(file.name);
        const dotIdx = file.name.lastIndexOf('.');
        const extension = dotIdx !== -1 ? file.name.substring(dotIdx) : '';
        const item = {
          file,
          handle: file.handle || null,
          cachedBuffer: null,
          originalFileName: file.name,
          targetType: guessedType,
          customName: guessedType === 'Outro' ? file.name.replace(/\.[^/.]+$/, '') : '',
          extension,
          originRound: activeRound,
          isNewUpload: true,
          replacedAt: null
        };
        // Pré-carrega buffer em background para proteger contra modificações de cache no disco
        if (typeof file.arrayBuffer === 'function') {
          file.arrayBuffer().then(buf => {
            item.cachedBuffer = buf;
          }).catch(() => {});
        }
        return item;
      });
    };

    const onFilesSelectedFromDisk = (e) => {
      const files = Array.from(e.target.files).filter(f => !f.name.startsWith('.') && f.name !== 'log.txt' && f.name !== 'mlog.txt' && f.name !== 'estado_avaliacao.json');
      if (!files || files.length === 0) return;

      const classified = classifyFileList(files);
      if (showNewProjectModal.value) {
        newProjectFiles.value = [...newProjectFiles.value, ...classified];
      } else {
        // Se anexou arquivos já dentro da mesa de trabalho
        const wasEmpty = activeDocuments.value.length === 0;
        activeDocuments.value = [...activeDocuments.value, ...classified];
        if (wasEmpty && activeDocuments.value.length > 0) {
          selectedDocumentIndex.value = 0;
          loadSelectedDocument();
        } else {
          // Seleciona o primeiro dos novos arquivos adicionados
          selectedDocumentIndex.value = activeDocuments.value.length - classified.length;
          loadSelectedDocument();
        }
        // Abre o modal de documentos para que o usuário possa revisar/editar o tipo dos arquivos recém-enviados
        pushNavState({ type: 'modal', name: 'documents' });
        showDocumentsModal.value = true;
      }
      e.target.value = '';
    };

    // --- GESTÃO COMPLETA DE DOCUMENTOS NO ESPAÇO DE TRABALHO (SUBSTITUIR, EXCLUIR, EDITAR TIPO, NOVA RODADA) ---
    const openDocumentsManagerModal = () => {
      pushNavState({ type: 'modal', name: 'documents' });
      showDocumentsModal.value = true;
    };

    const triggerReplaceDocument = (idx) => {
      replacingDocIndex.value = idx;
      if (replaceFileInput.value) {
        replaceFileInput.value.click();
      }
    };

    const onReplaceFileSelected = (e) => {
      const files = Array.from(e.target.files);
      if (!files || files.length === 0 || replacingDocIndex.value < 0) return;

      const newFile = files[0];
      const targetDoc = activeDocuments.value[replacingDocIndex.value];
      if (targetDoc) {
        const dotIdx = newFile.name.lastIndexOf('.');
        const extension = dotIdx !== -1 ? newFile.name.substring(dotIdx) : '';

        // Se o projeto veio de uma pasta de data antiga e ainda estava apontando para ela,
        // avança automaticamente a pasta alvo para hoje (ou nova rodada) para preservar a pasta antiga intacta!
        ensureNewRoundOnModification();

        targetDoc.file = newFile;
        targetDoc.handle = null;
        targetDoc.cachedBuffer = null;
        if (typeof newFile.arrayBuffer === 'function') {
          newFile.arrayBuffer().then(buf => {
            targetDoc.cachedBuffer = buf;
          }).catch(() => {});
        }
        targetDoc.originalFileName = newFile.name;
        targetDoc.extension = extension;
        targetDoc.replacedAt = todayDateString.value;
        targetDoc.originRound = targetRoundFolder.value;
        targetDoc.isNewUpload = true;

        if (selectedDocumentIndex.value === replacingDocIndex.value) {
          loadSelectedDocument();
        }
      }

      replacingDocIndex.value = -1;
      e.target.value = '';
    };

    const removeActiveDocument = (idx) => {
      const doc = activeDocuments.value[idx];
      if (!doc) return;

      const label = getDocTypeLabel(doc.targetType, doc.customName);
      const confirmMsg = currentLang.value === 'es'
        ? `¿Desea quitar el archivo "${doc.file.name}" (${label}) de la entrega actual?\n\nNota: Si pertenecía a una fecha anterior, el archivo histórico permanecerá intacto en su carpeta antigua.`
        : `Deseja remover o arquivo "${doc.file.name}" (${label}) da rodada atual?\n\nNota: Se ele pertencia a uma submissão anterior, o arquivo histórico continuará intacto na pasta da data antiga.`;

      if (!confirm(confirmMsg)) return;

      ensureNewRoundOnModification();

      activeDocuments.value.splice(idx, 1);
      if (selectedDocumentIndex.value >= activeDocuments.value.length) {
        selectedDocumentIndex.value = Math.max(0, activeDocuments.value.length - 1);
      }
      loadSelectedDocument();
    };

    const viewDocumentFromModal = (idx) => {
      selectedDocumentIndex.value = idx;
      showDocumentsModal.value = false;
      loadSelectedDocument();
    };

    /**
     * Garante que, se o projeto foi carregado de uma data passada, a pasta de salvamento alvo
     * passe a ser a data de hoje (preservando a pasta antiga intacta).
     */
    const ensureNewRoundOnModification = () => {
      const today = todayDateString.value;
      if (loadedFromRound.value && loadedFromRound.value !== today && targetRoundFolder.value === loadedFromRound.value) {
        targetRoundFolder.value = today;
      }
    };

    /**
     * Cria explicitamente uma nova subpasta de rodada (ex: quando o pesquisador entrega novos arquivos
     * no mesmo dia ou o relator deseja forçar uma nova pasta de versão preservando a anterior intacta).
     */
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
      }
    };

    /**
     * Carrega uma rodada histórica específica do projeto para consulta ou edição
     */
    const switchToHistoricalRound = async (roundName) => {
      if (!activeProject.id || !folderConnected.value) return;
      const roundData = await CEP_STORAGE.loadProjectRound(activeProject.id, roundName);
      if (!roundData) {
        alert('Não foi possível carregar os arquivos da pasta ' + roundName);
        return;
      }
      populateWorkspaceFromRoundData(roundData, roundName);
    };

    const removeNewProjectFile = (idx) => {
      newProjectFiles.value.splice(idx, 1);
    };

    const finalizeNewProjectCreation = () => {
      if (!newProjectForm.titulo.trim() || !newProjectForm.pesquisador.trim()) {
        alert('Por favor, preencha o Nome do Pesquisador e o Título da Pesquisa.');
        return;
      }

      activeProject.id = '';
      activeProject.instituicao = newProjectForm.instituicao.trim() || config.instituicao || 'Instituição';
      activeProject.pesquisador = newProjectForm.pesquisador.trim();
      activeProject.titulo = newProjectForm.titulo.trim();
      activeProject.caae = newProjectForm.caae.trim();
      activeProject.relator = newProjectForm.relator.trim();
      activeProject.enquadramentoTipo = newProjectForm.enquadramentoTipo || 'geral';
      activeProject.enquadramentoCustom = newProjectForm.enquadramentoCustom || '';
      Object.assign(activeProject.enquadramento, newProjectForm.enquadramento);

      targetRoundFolder.value = todayDateString.value;
      loadedFromRound.value = '';
      projectRoundsHistory.value = [];

      activeDocuments.value = [...newProjectFiles.value];
      if (history.state && history.state.name === 'newProject') {
        history.replaceState({ type: 'view', name: 'workspace', projectId: activeProject.id }, '');
      } else {
        pushNavState({ type: 'view', name: 'workspace', projectId: activeProject.id });
      }
      showNewProjectModal.value = false;
      currentView.value = 'workspace';
      selectedDocumentIndex.value = 0;
      selectedPendencias.value = [];
      hasManualEdits.value = false;

      nextTick(() => {
        if (viewerContainer.value) {
          CEP_VIEWER.init(viewerContainer.value);
          loadSelectedDocument();
        }
        updateLogPreview();
      });
    };

    const populateWorkspaceFromRoundData = (roundData, roundDate) => {
      loadedFromRound.value = roundDate;
      // Se a rodada carregada for de uma data anterior a hoje, já prepara o destino padrão para hoje (nova pasta),
      // mantendo a pasta antiga intacta quando o usuário salvar novas alterações!
      const today = todayDateString.value;
      if (roundDate !== today && !roundDate.startsWith(today)) {
        targetRoundFolder.value = today;
      } else {
        targetRoundFolder.value = roundDate;
      }

      const metaList = (roundData.stateData && Array.isArray(roundData.stateData.arquivosMetadados))
        ? roundData.stateData.arquivosMetadados
        : [];

      const validTypes = DOC_TYPES_CATALOG.map(d => d.value);

      activeDocuments.value = roundData.files.map(f => {
        const dotIdx = f.name.lastIndexOf('.');
        const ext = dotIdx !== -1 ? f.name.substring(dotIdx) : '';
        const meta = metaList.find(m => m.savedFileName === f.name);

        if (meta) {
          return {
            file: f,
            handle: f.handle || null,
            cachedBuffer: null,
            originalFileName: meta.originalFileName || f.name,
            targetType: meta.targetType || 'Outro',
            customName: meta.customName || '',
            extension: meta.extension || ext,
            originRound: meta.originRound || roundDate,
            isNewUpload: false,
            replacedAt: meta.replacedAt || null
          };
        }

        // Fallback para arquivos salvos antes do arquivosMetadados
        const prefix = f.name.split('.')[0] || 'Outro';
        const basePrefix = prefix.replace(/_\d+$/, '');
        const isKnownType = validTypes.includes(basePrefix);

        return {
          file: f,
          handle: f.handle || null,
          cachedBuffer: null,
          originalFileName: f.name,
          targetType: isKnownType ? basePrefix : 'Outro',
          customName: isKnownType ? '' : basePrefix,
          extension: ext,
          originRound: roundDate,
          isNewUpload: false,
          replacedAt: null
        };
      });

      if (roundData.stateData) {
        selectedPendencias.value = (roundData.stateData.pendenciasSelecionadas || []).map(sp => ({
          ...sp,
          targetDocType: sp.targetDocType || inferDocTypeFromPendencia(sp, sp.categoryId)
        }));
        if (roundData.stateData.enquadramentoTipo) {
          activeProject.enquadramentoTipo = roundData.stateData.enquadramentoTipo;
          activeProject.enquadramentoCustom = roundData.stateData.enquadramentoCustom || '';
        } else if (roundData.stateData.enquadramento) {
          const eq = roundData.stateData.enquadramento;
          if (eq.menores) activeProject.enquadramentoTipo = 'menores';
          else if (eq.bancoDados) activeProject.enquadramentoTipo = 'bancoDados';
          else if (eq.indigena) activeProject.enquadramentoTipo = 'indigena';
          else if (eq.geral) activeProject.enquadramentoTipo = 'geral';
          else activeProject.enquadramentoTipo = 'nenhum';
          activeProject.enquadramentoCustom = '';
        }
        if (roundData.stateData.enquadramento) {
          Object.assign(activeProject.enquadramento, roundData.stateData.enquadramento);
        }
      }

      if (roundData.mlogText) {
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
      activeProject.id = proj.id;
      activeProject.titulo = proj.titulo;
      activeProject.pesquisador = proj.pesquisador;
      activeProject.instituicao = proj.instituicao;
      activeProject.caae = proj.caae || '';
      activeProject.relator = proj.relator || '';
      activeProject.status = proj.status || 'em_analise';
      activeProject.data_aprovacao = proj.data_aprovacao || null;
      selectedPendencias.value = [];
      hasManualEdits.value = false;
      activeDocuments.value = [];
      projectRoundsHistory.value = [];

      if (folderConnected.value) {
        const diskRounds = await CEP_STORAGE.listProjectRounds(proj.id);
        const regRounds = (proj.rondas || []).map(r => r.data);
        projectRoundsHistory.value = Array.from(new Set([...regRounds, ...diskRounds])).sort();

        if (projectRoundsHistory.value.length > 0) {
          const lastRoundDate = projectRoundsHistory.value[projectRoundsHistory.value.length - 1];
          const roundData = await CEP_STORAGE.loadProjectRound(proj.id, lastRoundDate);
          if (roundData) {
            currentView.value = 'workspace';
            populateWorkspaceFromRoundData(roundData, lastRoundDate);
            return;
          }
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

    // --- AÇÕES DO MODAL DE DELIBERAÇÃO COLEGIADA ---
    const deliberateAprovar = async () => {
      if (!projectToDeliberate.value) return;
      const proj = projectToDeliberate.value;
      const today = todayDateString.value;
      await CEP_STORAGE.updateProjectStatus(proj.id, 'aprovado', { data_aprovacao: today });
      await loadWorkspaceData();
      closeDeliberationModal();
      alert(`✓ O protocolo "${proj.titulo}" foi APROVADO na reunião e arquivado com sucesso no histórico.`);
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

    // --- GERAÇÃO DO CADERNO / RELATÓRIO COLEGIADO EM PDF ---
    const openMonthlyReportModal = async (targetMonth = null) => {
      try {
        isGeneratingReport.value = true;
        const monthToUse = targetMonth || reportTargetMonth.value || todayDateString.value.substring(0, 7);
        reportTargetMonth.value = monthToUse;
        const data = await CEP_STORAGE.getMonthlyReportData(new Date(), monthToUse, projectsList.value);
        reportData.value = data;
        pushNavState({ type: 'modal', name: 'report' });
        showReportModal.value = true;
      } catch (err) {
        console.error('Erro ao gerar dados do relatório colegiado:', err);
        alert('Ocorreu um erro ao gerar o relatório mensal da reunião.');
      } finally {
        isGeneratingReport.value = false;
      }
    };

    const changeReportMonth = async (month) => {
      reportTargetMonth.value = month;
      await openMonthlyReportModal(month);
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
            <p style="font-size: 12.5px; color: var(--text-secondary); line-height: 1.5;">Clique em <strong>"Gerenciar / Subir Documentos"</strong> ou <strong>"+ Subir Arquivos"</strong> na barra superior do visor para adicionar ou substituir os arquivos entregues pelo pesquisador.</p>
          </div>
        `;
      }
    };

    const onDocumentChange = () => {
      loadSelectedDocument();
    };

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

    // --- SELETOR DE PENDÊNCIAS E MOTOR DE REGRAS ---
    const currentCategoryPendencias = computed(() => {
      const cat = availableCategories.value.find(c => c.id === activeCategoryTab.value);
      if (!cat) return [];
      if (!pendenciaSearchQuery.value.trim()) return cat.pendencias;

      const q = pendenciaSearchQuery.value.toLowerCase().trim();
      return cat.pendencias.filter(p =>
        (p.title && p.title.toLowerCase().includes(q)) ||
        (p.template && p.template.toLowerCase().includes(q)) ||
        (p.normativa && p.normativa.toLowerCase().includes(q))
      );
    });

    const isPendenciaSelected = (pendId) => {
      return selectedPendencias.value.some(p => p.id === pendId);
    };

    const getSelectedPendencia = (pendId) => {
      return selectedPendencias.value.find(p => p.id === pendId);
    };

    const getPendenciasCountByCategory = (catId) => {
      const cat = availableCategories.value.find(c => c.id === catId);
      if (!cat) return 0;
      const ids = cat.pendencias.map(p => p.id);
      return selectedPendencias.value.filter(sp => ids.includes(sp.id)).length;
    };

    const togglePendencia = (pend) => {
      const idx = selectedPendencias.value.findIndex(p => p.id === pend.id);
      if (idx >= 0) {
        selectedPendencias.value.splice(idx, 1);
      } else {
        const inferredDocType = inferDocTypeFromPendencia(pend, activeCategoryTab.value);
        selectedPendencias.value.push({
          id: pend.id,
          title: pend.title,
          template: pend.template,
          normativa: pend.normativa,
          observacaoRelator: '',
          categoryId: activeCategoryTab.value,
          targetDocType: inferredDocType
        });
      }
      updateLogPreview();
    };

    const addCustomPendenciaToCurrentCategory = () => {
      const text = prompt('Descreva a pendência ou exigência específica a ser incluída no parecer:');
      if (!text || !text.trim()) return;

      const customId = 'CUSTOM-' + Date.now();
      const newPend = {
        id: customId,
        title: text.substring(0, 65) + (text.length > 65 ? '...' : ''),
        template: text.trim(),
        normativa: 'Exigência Específica do Relator / Colegiado',
        observacaoRelator: ''
      };

      const cat = availableCategories.value.find(c => c.id === activeCategoryTab.value);
      if (cat) {
        cat.pendencias.push(newPend);
      }
      togglePendencia(newPend);
    };

    const updateLogPreview = () => {
      const generated = CEP_RULES_ENGINE.generateOfficialLogText({
        projeto: activeProject,
        config: config,
        pendenciasSelecionadas: selectedPendencias.value,
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
      if (editableLogText.value.trim() !== officialGeneratedLog.value.trim()) {
        hasManualEdits.value = true;
      } else {
        hasManualEdits.value = false;
      }
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
    const saveCurrentProject = async () => {
      if (!activeProject.titulo || !activeProject.pesquisador) {
        alert('Por favor, preencha o Nome do Pesquisador e o Título da Pesquisa no cabeçalho.');
        return;
      }

      // Se a pasta ainda não estiver conectada, solicita conectá-la agora
      if (!folderConnected.value) {
        const confirmConnect = confirm('Para salvar a estrutura de pastas (Instituição.Pesquisador.Pesquisa/Data) e os logs no seu computador, selecione sua pasta base de trabalho do CEP.');
        if (!confirmConnect) return;
        try {
          const handle = await CEP_STORAGE.selectDirectory();
          folderConnected.value = true;
          folderName.value = handle.name;
        } catch (err) {
          return;
        }
      }

      // Validação de Pauta e Relator se não houver pendências
      let targetStatus = 'em_analise';
      if (selectedPendencias.value.length === 0) {
        const confirmSend = confirm(t('sendToPautaPrompt'));
        if (confirmSend) {
          if (!activeProject.relator || !activeProject.relator.trim()) {
            alert(t('relatorRequiredPrompt'));
            const relatorInput = document.querySelector('input[list="relatores-list"]');
            if (relatorInput) relatorInput.focus();
            return;
          }
          targetStatus = 'em_pauta';
        } else {
          targetStatus = 'em_analise';
        }
      } else {
        targetStatus = 'em_analise';
      }
      activeProject.status = targetStatus;

      isSaving.value = true;
      try {
        const result = await CEP_STORAGE.saveProjectRound({
          id: activeProject.id || null,
          instituicao: activeProject.instituicao || config.instituicao || 'Instituicao',
          pesquisador: activeProject.pesquisador,
          titulo: activeProject.titulo,
          caae: activeProject.caae,
          relator: activeProject.relator,
          enquadramento: activeProject.enquadramento,
          enquadramentoTipo: activeProject.enquadramentoTipo,
          enquadramentoCustom: activeProject.enquadramentoCustom,
          status: targetStatus,
          data_aprovacao: activeProject.data_aprovacao || null,
          pendencias_count: selectedPendencias.value.length,
          targetRoundFolder: targetRoundFolder.value || todayDateString.value,
          arquivosClassificados: activeDocuments.value,
          pendenciasSelecionadas: selectedPendencias.value,
          logText: officialGeneratedLog.value,
          mlogText: editableLogText.value,
          hasModifications: hasManualEdits.value
        });

        activeProject.id = result.projectFolderId;
        loadedFromRound.value = result.todayFolder;
        if (!projectRoundsHistory.value.includes(result.todayFolder)) {
          projectRoundsHistory.value.push(result.todayFolder);
          projectRoundsHistory.value.sort();
        }

        await loadWorkspaceData();
        const msgLogs = hasManualEdits.value ? 'log.txt (original) e mlog.txt (modificado)' : 'log.txt (oficial)';
        const msgPauta = targetStatus === 'em_pauta' ? '\n\n📋 STATUS: ENVIADO PARA A PAUTA DA REUNIÃO COLEGIADA!' : '';
        alert(`✅ Projeto e documentos salvos com sucesso!${msgPauta}\n\nPasta da Rodada Atual:\n${result.projectFolderId}/${result.todayFolder}/\n\nArquivos gravados nesta pasta:\n- ${activeDocuments.value.length} documento(s) padronizado(s)\n- ${msgLogs}`);
      } catch (err) {
        console.error('Erro ao salvar projeto:', err);
        alert('Erro ao gravar na pasta: ' + err.message);
      } finally {
        isSaving.value = false;
      }
    };

    // --- RESIZABLE SPLITTER (HORIZONTAL) ---
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

      // Atalho Ctrl+F foca no buscador interno do documento quando no workspace
      window.addEventListener('keydown', (e) => {
        if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'f' && currentView.value === 'workspace') {
          if (viewerSearchInput.value) {
            e.preventDefault();
            viewerSearchInput.value.focus();
            viewerSearchInput.value.select();
          }
        }
        // Tecla Escape fecha o modal ativo respeitando o histórico
        if (e.key === 'Escape') {
          if (showReportModal.value) {
            closeReportModal();
          } else if (showDocumentsModal.value) {
            closeDocumentsModal();
          } else if (showConfigModal.value) {
            closeConfigModal();
          } else if (showNewProjectModal.value) {
            closeNewProjectModal();
          } else if (showDeliberationModal.value) {
            closeDeliberationModal();
          }
        }
      });

      let isExitingApp = false;

      // Inicializa o estado raiz do histórico do navegador
      try {
        history.replaceState({ type: 'base' }, '');
        history.pushState({ type: 'root', view: currentView.value }, '');
      } catch (e) {}

      // Ativa a barreira de histórico com ativação de usuário (gesto real) assim que clicar ou digitar na página
      const armHistoryBarrier = () => {
        try {
          if (!history.state || history.state.type !== 'root') {
            history.pushState({ type: 'root', view: currentView.value }, '');
          }
        } catch (e) {}
      };
      window.addEventListener('pointerdown', armHistoryBarrier, { once: true });
      window.addEventListener('keydown', armHistoryBarrier, { once: true });

      // Intercepta o botão Voltar (Back) do navegador para modais, telas e saída da aplicação
      window.addEventListener('popstate', (e) => {
        if (isExitingApp) return;

        // 1. Se algum modal estiver visível, fecha apenas o modal aberto sem sair da aplicação
        if (showReportModal.value) {
          showReportModal.value = false;
          return;
        }
        if (showDocumentsModal.value) {
          showDocumentsModal.value = false;
          return;
        }
        if (showConfigModal.value) {
          showConfigModal.value = false;
          return;
        }
        if (showNewProjectModal.value) {
          showNewProjectModal.value = false;
          return;
        }
        if (showDeliberationModal.value) {
          showDeliberationModal.value = false;
          return;
        }

        // 2. Se estiver na Mesa de Trabalho, retorna para o Histórico de Protocolos
        if (currentView.value === 'workspace') {
          currentView.value = 'history';
          return;
        }

        // 3. Se estiver na tela principal/inicial e pressionar Voltar:
        // Exibe confirmação para evitar fechar a aplicação acidentalmente
        const confirmMsg = currentLang.value === 'es'
          ? '¿Deseas salir del CEP Assistant?'
          : 'Deseja realmente sair do CEP Assistant?';
        
        if (confirm(confirmMsg)) {
          isExitingApp = true;
          history.back();
        } else {
          // Mantém o usuário dentro da aplicação restaurando o estado root
          history.pushState({ type: 'root', view: 'history' }, '');
        }
      });

      // Alerta o navegador ao tentar fechar a aba ou janela caso haja trabalho em andamento
      window.addEventListener('beforeunload', (e) => {
        if (isExitingApp) return;
        if (folderConnected.value || currentView.value === 'workspace' || projectsList.value.length > 0) {
          e.preventDefault();
          e.returnValue = '';
        }
      });

      // Tenta reconectar pasta memorizada
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
      folderConnected,
      folderName,
      currentView,
      returnToHistoryView,
      config,
      configTab,
      newCategoryName,
      newPendenciaForm,
      savedRelatores,
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
      countEmPautaProjects,
      countAprovadoProjects,
      dashboardMetrics,
      showDeliberationModal,
      projectToDeliberate,
      deliberateAprovar,
      deliberateVoltarPendencia,
      deliberateApenasInspecionar,
      closeDeliberationModal,
      showReportModal,
      reportData,
      reportTargetMonth,
      isGeneratingReport,
      openMonthlyReportModal,
      changeReportMonth,
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
      getDocTypeLabel,
      getPendenciasForDocType,
      getPendenciasForDocument,
      sortProjects,
      chooseDirectory,
      openConfigModal,
      saveInstitutionConfig,
      createNewCategory,
      createNewStandardPendencia,
      openNewProjectModal,
      onEnquadramentoChange,
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
