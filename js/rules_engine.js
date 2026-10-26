/**
 * RULES_ENGINE.JS
 * Motor de Regras, Cálculo de Prazos e Geração de Parecer do CEP
 */

const CEP_RULES_ENGINE = {
  /**
   * Formata objeto Date em DD/MM/AAAA
   */
  formatDateBR(date) {
    if (!date) return '';
    const d = new Date(date);
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  },

  /**
   * Retorna a última quinta-feira de um determinado mês e ano
   * (Quinta-feira = dia da semana 4 no JavaScript, domingo = 0)
   */
  getLastThursdayOfMonth(year, monthIndex) {
    // monthIndex: 0 = Janeiro, 11 = Dezembro
    // Começa no último dia do mês
    const lastDay = new Date(year, monthIndex + 1, 0);
    const dayOfWeek = lastDay.getDay();
    
    // Diferença em dias para retroceder até quinta-feira (4)
    // Se hoje for quinta (4): diff = 0
    // Se for sexta (5): diff = 1
    // Se for sábado (6): diff = 2
    // Se for domingo (0): diff = 3
    // Se for segunda (1): diff = 4
    // Se for terça (2): diff = 5
    // Se for quarta (3): diff = 6
    const diff = (dayOfWeek >= 4) ? (dayOfWeek - 4) : (dayOfWeek + 3);
    const lastThursday = new Date(year, monthIndex, lastDay.getDate() - diff);
    lastThursday.setHours(14, 0, 0, 0); // Horário padrão de reunião
    return lastThursday;
  },

  /**
   * Retorna a próxima reunião real do Colegiado (última quinta-feira que ainda não ocorreu).
   * Regra: Em julho não há reunião (recesso regimental).
   */
  getNextMeetingDate(referenceDate = new Date()) {
    let year = referenceDate.getFullYear();
    let month = referenceDate.getMonth();

    while (true) {
      // Pula Julho (mês 6 no índice 0-11)
      if (month === 6) {
        month++;
        continue;
      }

      const thursday = this.getLastThursdayOfMonth(year, month);
      const endOfDay = new Date(thursday);
      endOfDay.setHours(23, 59, 59, 999);

      // Se a data de referência for anterior ou igual ao dia da reunião, esta é a próxima reunião
      if (referenceDate <= endOfDay) {
        return thursday;
      }

      // Caso contrário, avança para o próximo mês
      month++;
      if (month > 11) {
        month = 0;
        year++;
      }
    }
  },

  /**
   * Retorna a reunião do Colegiado imediatamente anterior à data de referência.
   * Utilizada para delimitar o início do ciclo da reunião atual.
   */
  getPreviousMeetingDate(referenceDate = new Date()) {
    let year = referenceDate.getFullYear();
    let month = referenceDate.getMonth();

    // Reunião do mês corrente
    const currentMonthThursday = this.getLastThursdayOfMonth(year, month);
    const endOfDayCurrent = new Date(currentMonthThursday);
    endOfDayCurrent.setHours(23, 59, 59, 999);

    // Se hoje já for posterior à reunião deste mês (e este mês não for julho), ela foi a reunião anterior
    if (referenceDate > endOfDayCurrent && month !== 6) {
      return currentMonthThursday;
    }

    // Caso contrário, busca no mês anterior que não seja julho
    let prevMonth = month - 1;
    let prevYear = year;
    while (true) {
      if (prevMonth < 0) {
        prevMonth = 11;
        prevYear--;
      }
      if (prevMonth === 6) {
        prevMonth--;
        continue;
      }
      return this.getLastThursdayOfMonth(prevYear, prevMonth);
    }
  },

  /**
   * Data de corte regimental (20 dias antes da reunião) para novas submissões.
   */
  getSubmissionCutoffMeetingDate(referenceDate = new Date()) {
    let year = referenceDate.getFullYear();
    let month = referenceDate.getMonth();

    while (true) {
      if (month === 6) {
        month++;
        continue;
      }
      const thursday = this.getLastThursdayOfMonth(year, month);
      const cutoffDate = new Date(thursday);
      cutoffDate.setDate(cutoffDate.getDate() - 20);
      cutoffDate.setHours(23, 59, 59, 999);

      if (referenceDate <= cutoffDate) {
        return thursday;
      }

      month++;
      if (month > 11) {
        month = 0;
        year++;
      }
    }
  },

  /**
   * Calcula a próxima reunião do Colegiado para exibição e pauta
   */
  calculateNextMeetingDate(referenceDate = new Date()) {
    return this.getNextMeetingDate(referenceDate);
  },

  /**
   * Calcula a data recomendada para início da coleta de dados (Reunião + 30 dias)
   */
  calculateCollectionStartDate(meetingDate) {
    const colDate = new Date(meetingDate);
    colDate.setDate(colDate.getDate() + 30);
    return colDate;
  },

  /**
   * Calcula a data limite de envio/corte regimental para uma determinada reunião
   */
  calculateSubmissionDeadline(meetingDate, cutoffDays = 20) {
    if (!meetingDate) return null;
    const deadline = new Date(meetingDate);
    deadline.setDate(deadline.getDate() - cutoffDays);
    return deadline;
  },

  /**
   * Calcula o prazo limite de resposta de diligência (Data atual + 10 dias)
   */
  calculateDiligenceDeadline(referenceDate = new Date(), days = 10) {
    const deadline = new Date(referenceDate);
    deadline.setDate(deadline.getDate() + days);
    return deadline;
  },

  /**
   * Monta o texto oficial do log.txt a partir das pendências assinaladas
   */
  generateOfficialLogText({
    projeto,
    config,
    pendenciasSelecionadas, // Array de { id, title, template, observacaoRelator }
    referenceDate = new Date()
  }) {
    const meetingDate = this.calculateNextMeetingDate(referenceDate);
    const collectionDate = this.calculateCollectionStartDate(meetingDate);
    const deadlineDate = this.calculateDiligenceDeadline(referenceDate, 10);

    const meetingDateStr = this.formatDateBR(meetingDate);
    const collectionDateStr = this.formatDateBR(collectionDate);
    const deadlineDateStr = this.formatDateBR(deadlineDate);

    // Substituições dinâmicas de tags nos templates
    const replaceTags = (text) => {
      if (!text) return '';
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
        .replace(/\[DOCUMENTO\]/g, 'submetido');
    };

    let log = '';

    // Cabeçalho institucional oficial
    log += `Prezado(a) Pesquisador(a), após a análise documental, o ${config.nomeCep || 'Comitê de Ética em Pesquisa (CEP)'} solicita as seguintes adequações:\n\n`;

    // Lista numerada de pendências
    if (pendenciasSelecionadas && pendenciasSelecionadas.length > 0) {
      pendenciasSelecionadas.forEach((item, index) => {
        const itemNumber = index + 1;
        log += `${itemNumber}. ${replaceTags(item.template)}\n`;
        if (item.observacaoRelator && item.observacaoRelator.trim()) {
          log += `   -> Observação do Relator: ${item.observacaoRelator.trim()}\n`;
        }
        log += '\n';
      });
    } else {
      log += `Nenhuma inconformidade documental foi identificada nesta etapa de checagem inicial.\n\n`;
    }

    // Padrão de Prazo de Resposta
    log += `"PRAZO DE RESPOSTA:\n`;
    log += `Solicitamos que as devidas correções sejam submetidas na Plataforma Brasil no prazo máximo de 10 dias, ou seja, até ao dia ${deadlineDateStr}. O não cumprimento deste prazo poderá implicar a devolução ou o arquivamento do protocolo."\n\n`;

    // Fechamento institucional e contatos
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
