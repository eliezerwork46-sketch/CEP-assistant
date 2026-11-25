/**
 * RULES_ENGINE.JS
 * Motor de Regras, Calendário Dinâmico Reprogramável, Validação de Rodadas e Geração de Parecer do CEP
 */

const CEP_RULES_ENGINE = {
  // Mapa reativo/configurável de alterações pontuais de datas de reunião: { 'YYYY-MM': { date: 'YYYY-MM-DD', cancelled: false, note: '' } }
  meetingOverrides: {},

  setMeetingOverrides(overridesMap = {}) {
    if (overridesMap && typeof overridesMap === 'object' && !Array.isArray(overridesMap)) {
      this.meetingOverrides = { ...overridesMap };
    } else {
      this.meetingOverrides = {};
    }
  },

  /**
   * Converte string 'YYYY-MM-DD' para Date local (14:00) sem deslocamento de fuso horário UTC
   */
  parseLocalDate(dateInput, hour = 14) {
    if (!dateInput) return null;
    if (dateInput instanceof Date) {
      return isNaN(dateInput.getTime()) ? null : new Date(dateInput.getTime());
    }
    const raw = String(dateInput).split('_')[0].trim();
    const matchYMD = raw.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (matchYMD) {
      const y = parseInt(matchYMD[1], 10);
      const m = parseInt(matchYMD[2], 10) - 1;
      const d = parseInt(matchYMD[3], 10);
      return new Date(y, m, d, hour, 0, 0, 0);
    }
    const parsed = new Date(raw);
    return isNaN(parsed.getTime()) ? null : parsed;
  },

  /**
   * Formata Date ou string ISO/'YYYY-MM-DD' em DD/MM/AAAA (imune a erro de fuso horário UTC)
   */
  formatDateBR(date) {
    if (!date) return '';
    if (typeof date === 'string') {
      const clean = date.split('_')[0].trim();
      const m = clean.match(/^(\d{4})-(\d{2})-(\d{2})/);
      if (m) {
        return `${m[3]}/${m[2]}/${m[1]}`;
      }
    }
    const d = date instanceof Date ? date : new Date(date);
    if (isNaN(d.getTime())) return String(date);
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  },

  formatDateISO(date) {
    const d = this.parseLocalDate(date, 12);
    if (!d) return '';
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  },

  /**
   * Retorna a última quinta-feira padrão de um determinado mês e ano
   */
  getLastThursdayOfMonth(year, monthIndex) {
    const lastDay = new Date(year, monthIndex + 1, 0);
    const dayOfWeek = lastDay.getDay();
    const diff = (dayOfWeek >= 4) ? (dayOfWeek - 4) : (dayOfWeek + 3);
    const lastThursday = new Date(year, monthIndex, lastDay.getDate() - diff);
    lastThursday.setHours(14, 0, 0, 0);
    return lastThursday;
  },

  /**
   * Retorna a data padrão regimental do mês (sem overrides). Em julho (monthIndex === 6) há recesso por padrão.
   */
  getDefaultMeetingForMonth(year, monthIndex) {
    if (monthIndex === 6) return null;
    return this.getLastThursdayOfMonth(year, monthIndex);
  },

  /**
   * Retorna a reunião efetiva de um slot mensal considerando reprogramações pontuais (overrides)
   */
  getScheduledMeetingForMonth(year, monthIndex, overridesOpt = null) {
    const overrides = overridesOpt || this.meetingOverrides || {};
    const key = `${year}-${String(monthIndex + 1).padStart(2, '0')}`;
    const ov = overrides[key];

    if (ov) {
      if (typeof ov === 'string' && ov.trim()) {
        return this.parseLocalDate(ov.trim(), 14);
      }
      if (typeof ov === 'object') {
        if (ov.cancelled) return null;
        if (ov.date && String(ov.date).trim()) {
          return this.parseLocalDate(String(ov.date).trim(), 14);
        }
      }
    }

    return this.getDefaultMeetingForMonth(year, monthIndex);
  },

  /**
   * Constrói a linha cronológica ordenada de reuniões reais entre startYear e endYear
   * Adapta-se automaticamente caso uma reunião seja postergada em 50, 60 ou mais dias (inclusive mudando de mês).
   */
  getMeetingsTimeline(startYear, endYear, overridesOpt = null) {
    const overrides = overridesOpt || this.meetingOverrides || {};
    const list = [];
    const seenDates = new Set();

    for (let y = startYear; y <= endYear; y++) {
      for (let m = 0; m < 12; m++) {
        const key = `${y}-${String(m + 1).padStart(2, '0')}`;
        const defaultDate = this.getDefaultMeetingForMonth(y, m);
        const effectiveDate = this.getScheduledMeetingForMonth(y, m, overrides);
        if (effectiveDate) {
          const iso = this.formatDateISO(effectiveDate);
          if (!seenDates.has(iso)) {
            seenDates.add(iso);
            list.push({
              slotKey: key,
              date: effectiveDate,
              isoDate: iso,
              defaultDate,
              isOverridden: Boolean(overrides[key] && (typeof overrides[key] === 'string' || overrides[key].date)),
              note: (overrides[key] && typeof overrides[key] === 'object' && overrides[key].note) ? overrides[key].note : ''
            });
          }
        }
      }
    }

    list.sort((a, b) => a.date.getTime() - b.date.getTime());
    return list;
  },

  /**
   * Retorna a próxima reunião real do Colegiado (>= referenceDate), respeitando reprogramações pontuais.
   */
  getNextMeetingDate(referenceDate = new Date(), overridesOpt = null) {
    const ref = this.parseLocalDate(referenceDate, 12) || new Date();
    const refYear = ref.getFullYear();
    const timeline = this.getMeetingsTimeline(refYear - 1, refYear + 3, overridesOpt);

    for (const item of timeline) {
      const endOfDay = new Date(item.date);
      endOfDay.setHours(23, 59, 59, 999);
      if (ref <= endOfDay) {
        return new Date(item.date.getTime());
      }
    }

    // Fallback caso todos os meses tivessem sido cancelados manualmente
    return this.getLastThursdayOfMonth(refYear + 1, 0);
  },

  /**
   * Retorna a reunião do Colegiado imediatamente anterior à data de referência, respeitando reprogramações.
   */
  getPreviousMeetingDate(referenceDate = new Date(), overridesOpt = null) {
    const ref = this.parseLocalDate(referenceDate, 12) || new Date();
    const refYear = ref.getFullYear();
    const timeline = this.getMeetingsTimeline(refYear - 3, refYear + 1, overridesOpt);

    let lastPast = null;
    for (const item of timeline) {
      const endOfDay = new Date(item.date);
      endOfDay.setHours(23, 59, 59, 999);
      if (ref > endOfDay) {
        lastPast = item.date;
      } else {
        break;
      }
    }

    if (lastPast) {
      return new Date(lastPast.getTime());
    }
    return this.getLastThursdayOfMonth(refYear - 1, 10);
  },

  /**
   * Calcula o intervalo dinâmico real em dias entre a reunião anterior e a próxima reunião (ex: 30, 50, 60+ dias)
   */
  getMeetingCycleIntervalDays(referenceDate = new Date(), overridesOpt = null) {
    const prev = this.getPreviousMeetingDate(referenceDate, overridesOpt);
    const next = this.getNextMeetingDate(referenceDate, overridesOpt);
    const diffMs = next.getTime() - prev.getTime();
    return Math.max(1, Math.round(diffMs / (1000 * 60 * 60 * 24)));
  },

  /**
   * Data de corte regimental (cutoffDays antes da reunião) para novas submissões, respeitando datas reprogramadas.
   */
  getSubmissionCutoffMeetingDate(referenceDate = new Date(), cutoffDays = 20, overridesOpt = null) {
    const ref = this.parseLocalDate(referenceDate, 12) || new Date();
    const refYear = ref.getFullYear();
    const timeline = this.getMeetingsTimeline(refYear - 1, refYear + 3, overridesOpt);

    for (const item of timeline) {
      const cutoffDate = new Date(item.date);
      cutoffDate.setDate(cutoffDate.getDate() - cutoffDays);
      cutoffDate.setHours(23, 59, 59, 999);
      if (ref <= cutoffDate) {
        return new Date(item.date.getTime());
      }
    }

    return this.getNextMeetingDate(ref, overridesOpt);
  },

  calculateNextMeetingDate(referenceDate = new Date(), overridesOpt = null) {
    return this.getNextMeetingDate(referenceDate, overridesOpt);
  },

  calculateCollectionStartDate(meetingDate) {
    const colDate = new Date(meetingDate);
    colDate.setDate(colDate.getDate() + 30);
    return colDate;
  },

  calculateSubmissionDeadline(meetingDate, cutoffDays = 20) {
    if (!meetingDate) return null;
    const deadline = new Date(meetingDate);
    deadline.setDate(deadline.getDate() - cutoffDays);
    return deadline;
  },

  calculateDiligenceDeadline(referenceDate = new Date(), days = 10) {
    const deadline = new Date(referenceDate);
    deadline.setDate(deadline.getDate() + days);
    return deadline;
  },

  // =========================================================================
  // REGRAS ESPECIAIS DE PENDÊNCIAS E PROTEÇÃO CONTRA FALSO POSITIVO NA 2ª CORREÇÃO
  // =========================================================================

  /**
   * Identifica se uma pendência é a de recusa por "afinidade hospitalar" (restrita exclusivamente à 1ª submissão)
   */
  isHospitalAffinityPendencia(pend) {
    if (!pend) return false;
    if (pend.id === 'P-GEN-14' || pend.onlyFirstSubmission === true) return true;
    const txt = `${pend.title || ''} ${pend.title_es || ''} ${pend.template || ''}`.toLowerCase();
    return (txt.includes('afinidade') && txt.includes('hospitalar')) ||
           txt.includes('não tem afinidade por ser hospitalar') ||
           txt.includes('nao tem afinidade por ser hospitalar');
  },

  /**
   * Identifica se uma pendência é do tipo "Ausência de arquivo separado na categoria de:" com checkboxes
   */
  isMissingCategoriesPendencia(pend) {
    if (!pend) return false;
    if (pend.hasCategoryCheckboxes || pend.id === 'P-GEN-12' || pend.id === 'P-GEN-08') return true;
    const t = (pend.title || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    return t.includes('ausencia de arquivo separado na categoria');
  },

  /**
   * Gera o texto final da pendência "Ausência de arquivo separado na categoria de:" conforme os checkboxes marcados
   */
  buildMissingCategoriesTemplate(pend, selectedLabels = []) {
    const cleanLabels = Array.isArray(selectedLabels) ? selectedLabels.filter(Boolean) : [];
    const joined = cleanLabels.length > 0
      ? cleanLabels.join(', ')
      : '[SELECIONE AS CATEGORIAS FALTANTES]';

    if (pend && pend.id === 'P-GEN-08') {
      const bullets = cleanLabels.length > 0
        ? cleanLabels.map(l => `- ${l};`).join('\n')
        : '- [SELECIONE OS DOCUMENTOS FALTANTES NOS CHECKBOXES ACIMA].';
      return `Documentos Pendentes Não Anexados:\nIdentificou-se a ausência de documentos obrigatórios para a continuidade da tramitação ética deste protocolo. Solicita-se providenciar a submissão dos seguintes arquivos na aba correspondente da Plataforma Brasil:\n${bullets}`;
    }

    return `Ausência de arquivo separado na categoria de: ${joined}. Solicita-se que cada um dos documentos indicados seja submetido em arquivo individualizado e separado na respectiva categoria da Plataforma Brasil, em conformidade com a Norma Operacional CNS nº 001/2013 (Item 3.2).`;
  },

  /**
   * Determina de forma estrita se o projeto encontra-se em 2ª correção (ou posterior).
   * Na 2ª+ correção o CEP já aceitou a jurisdição do protocolo na 1ª rodada; portanto, regras de recusa inicial
   * como "Este CEP não tem afinidade por ser hospitalar" JAMAIS devem disparar ou reaparecer como falso positivo.
   */
  isSecondOrSubsequentCorrection({ projeto = null, roundsHistoryCount = 0, documentos = [] } = {}) {
    if (roundsHistoryCount >= 1) return true;
    if (projeto && Array.isArray(projeto.rondas) && projeto.rondas.length >= 1) return true;
    if (Array.isArray(documentos)) {
      const hasReplacedOrVersioned = documentos.some(d =>
        (d && d.version && d.version > 1) ||
        (d && d.replacedAt) ||
        (d && Array.isArray(d.previousNames) && d.previousNames.length > 0) ||
        (d && d.targetType === 'Carta_Resposta')
      );
      if (hasReplacedOrVersioned) return true;
    }
    return false;
  },

  /**
   * Filtra falsos positivos de afinidade hospitalar ao realizar 2ª correção (ou reanálise) de um projeto.
   * Evita que menções a "hospital" em Carta Resposta, Termo de Anuência, TCUD ou estado herdado disparem
   * erroneamente "Este CEP não tem afinidade por ser hospitalar" a partir da 2ª rodada.
   */
  sanitizePendenciasForRound(pendencias = [], context = {}) {
    if (!Array.isArray(pendencias)) return [];
    const isReanalysis = Boolean(context.isReanalysis) || this.isSecondOrSubsequentCorrection(context);
    if (!isReanalysis) return pendencias;

    return pendencias.filter(sp => {
      if (this.isHospitalAffinityPendencia(sp) && !sp.manuallyConfirmedInCurrentRound) {
        return false;
      }
      return true;
    });
  },

  /**
   * Monta o texto oficial do log.txt a partir das pendências assinaladas (com suporte multidocumento)
   */
  generateOfficialLogText({
    projeto,
    config,
    pendenciasSelecionadas,
    documentosAtivos = [],
    referenceDate = new Date()
  }) {
    const meetingDate = this.calculateNextMeetingDate(referenceDate);
    const collectionDate = this.calculateCollectionStartDate(meetingDate);
    const deadlineDate = this.calculateDiligenceDeadline(referenceDate, 10);

    const meetingDateStr = this.formatDateBR(meetingDate);
    const collectionDateStr = this.formatDateBR(collectionDate);
    const deadlineDateStr = this.formatDateBR(deadlineDate);

    const resolveDocDescription = (item) => {
      if (!item) return 'submetido';
      const names = [];
      if (Array.isArray(item.documentIds) && item.documentIds.length > 0 && Array.isArray(documentosAtivos)) {
        item.documentIds.forEach(dId => {
          const found = documentosAtivos.find(d => d.docId === dId);
          if (found) {
            const name = found.originalFileName || (found.file && found.file.name) || found.targetType;
            names.push(name);
          }
        });
      }
      if (names.length > 0) {
        return names.join(', ');
      }
      if (Array.isArray(item.targetDocTypes) && item.targetDocTypes.length > 0) {
        const valid = item.targetDocTypes.filter(t => t && t !== 'Geral');
        if (valid.length > 0) return valid.map(t => t.replace(/_/g, ' ')).join(', ');
      }
      if (item.targetDocType && item.targetDocType !== 'Geral') {
        return item.targetDocType.replace(/_/g, ' ');
      }
      return 'submetido';
    };

    const replaceTags = (text, item) => {
      if (!text) return '';
      const docDesc = resolveDocDescription(item);
      return text
        .replace(/\[DATA_REUNIAO_CALCULADA\]/g, meetingDateStr)
        .replace(/\[DATA_COLETA_CALCULADA\]/g, collectionDateStr)
        .replace(/\[DATA_LIMITE_DILIGENCIA\]/g, deadlineDateStr)
        .replace(/\[NOME_OFICIAL_CEP\]/g, config.nomeCep || 'Comitê de Ética em Pesquisa')
        .replace(/\[INSTITUICAO_CEP\]/g, config.instituicao || 'Instituição')
        .replace(/\[ENDERECO_CEP\]/g, config.endereco || '')
        .replace(/\[TELEFONE_CEP\]/g, config.telefone || '')
        .replace(/\[EMAIL_CEP\]/g, config.email || '')
        .replace(/\[HORARIO_CEP\]/g, config.horario || '13h às 17h')
        .replace(/\[SITE_CEP\]/g, config.site || '')
        .replace(/\[DOCUMENTO\]/g, docDesc);
    };

    let log = '';

    log += `Prezado(a) Pesquisador(a), após a análise documental, o ${config.nomeCep || 'Comitê de Ética em Pesquisa (CEP)'} solicita as seguintes adequações:\n\n`;

    if (pendenciasSelecionadas && pendenciasSelecionadas.length > 0) {
      pendenciasSelecionadas.forEach((item, index) => {
        const itemNumber = index + 1;
        let effectiveTemplate = item.template || '';
        if (this.isMissingCategoriesPendencia(item) && Array.isArray(item.missingCategories) && item.missingCategories.length > 0) {
          effectiveTemplate = this.buildMissingCategoriesTemplate(item, item.missingCategories);
        }
        log += `${itemNumber}. ${replaceTags(effectiveTemplate, item)}\n`;
        if (Array.isArray(item.documentIds) && item.documentIds.length > 1) {
          log += `   -> Documentos vinculados: ${resolveDocDescription(item)}\n`;
        }
        if (item.observacaoRelator && item.observacaoRelator.trim()) {
          log += `   -> Observação do Relator: ${item.observacaoRelator.trim()}\n`;
        }
        log += '\n';
      });
    } else {
      log += `Nenhuma inconformidade documental foi identificada nesta etapa de checagem inicial.\n\n`;
    }

    log += `"PRAZO DE RESPOSTA:\n`;
    log += `Solicitamos que as devidas correções sejam submetidas na Plataforma Brasil no prazo máximo de 10 dias, ou seja, até ao dia ${deadlineDateStr}. O não cumprimento deste prazo poderá implicar a devolução ou o arquivamento do protocolo."\n\n`;

    log += `Atenciosamente, Assessoria ${config.nomeCep || 'Comitê de Ética em Pesquisa'}\n`;
    if (config.telefone || config.horario || config.email) {
      const partes = [];
      if (config.telefone) partes.push(`Fone: ${config.telefone}`);
      if (config.horario) partes.push(`Horário: ${config.horario}`);
      if (config.email) partes.push(`E-mail: ${config.email}`);
      log += `${partes.join(' | ')}\n`;
    }
    if (config.site) {
      log += `Site: ${config.site}\n`;
    }

    return log;
  }
};

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { CEP_RULES_ENGINE };
}
