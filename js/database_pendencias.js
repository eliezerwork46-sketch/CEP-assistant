/**
 * DATABASE_PENDENCIAS.JS
 * Catálogo completo de pendências padronizadas do CEP
 * Extraído 100% fielmente do histórico e padrões do CEP UCDB e normativas oficiais:
 * Resolução CNS nº 466/2012, Resolução CNS nº 510/2016, Resolução CNS nº 580/2018,
 * Norma Operacional CNS nº 001/2013, Carta Circular 166/2018 (Relato de Caso),
 * Ofício Circular nº 02/2021/CONEP (Ambiente Virtual), Lei Federal nº 14.874/2024 (INAEP).
 */

const DEFAULT_PENDENCIAS_CATEGORIES = [
  {
    id: 'geral',
    name: 'Geral e Documental',
    name_es: 'General y Documental',
    icon: 'folder',
    pendencias: [
      {
        id: 'P-GEN-01',
        title: 'Documentos exclusivamente em PDF e sem caracteres especiais',
        title_es: 'Documentos exclusivamente en PDF y sin caracteres especiales',
        normativa: 'Norma Operacional CNS nº 001/2013, Item 3.2 e Anexo II',
        template: `Nomenclatura dos Arquivos e Formato: Fique atento ao nome definido para os arquivos carregados. Todos os documentos devem ser submetidos obrigatoriamente em formato PDF (ler as instruções em Norma Operacional CNS nº 001/2013) e conter nomes legíveis do que se tratam, utilizando apenas letras, números e o caractere underscore ("_") para separar as palavras (ex: Termo_Consentimento.pdf). Arquivos com espaços ou caracteres especiais podem apresentar erro de processamento na Plataforma Brasil.`
      },
      {
        id: 'P-GEN-02',
        title: 'Arquivo corrompido ou com erro de abertura',
        title_es: 'Archivo dañado o con error al abrir',
        normativa: 'Norma Operacional CNS nº 001/2013',
        template: `Erro em Arquivo Anexado: O arquivo correspondente ao documento [DOCUMENTO] apresenta erro, corrupção de dados ou páginas não legíveis e não pôde ser aberto pelo comitê. Por gentileza, realize a substituição do arquivo na Plataforma Brasil, submetendo uma versão íntegra, nítida e legível.`
      },
      {
        id: 'P-GEN-03',
        title: 'Instrumentos de coleta (questionário/roteiro) anexados separadamente em "Outros"',
        title_es: 'Instrumentos de recolección (cuestionarios/guiones) adjuntados por separado en "Otros"',
        normativa: 'Resolução CNS nº 466/2012 e Resolução CNS nº 510/2016',
        template: `Instrumento de Coleta de Dados: O questionário, roteiro de entrevista, escala ou ficha de avaliação a ser aplicado aos participantes não foi localizado de forma individualizada. Para que seja possível realizar a devida apreciação ética dos riscos e benefícios do estudo, solicita-se que o pesquisador:
- Inclua o instrumento de coleta na íntegra como apêndice/anexo no arquivo do Projeto Detalhado;
- Efetue a postagem do mesmo instrumento como um arquivo separado (avulso) na seção de inclusão de arquivos da Plataforma Brasil, utilizando a categoria "Outros" (Opção 9) no campo "Tipo de Documento", conforme orienta o manual do sistema.`
      },
      {
        id: 'P-GEN-04',
        title: 'Documentos em língua estrangeira desacompanhados de versão em português',
        title_es: 'Documentos en idioma extranjero sin versión en portugués',
        normativa: 'Norma Operacional CNS nº 001/2013, Item 3.2',
        template: `Documentos em Língua Estrangeira: Identificamos que seu projeto inclui documentos em língua estrangeira. É obrigatório que os documentos originais em língua estrangeira sejam acompanhados de suas respectivas versões traduzidas para o português, identificadas no nome do arquivo com "PT" no final e "EN/ES" nos originais. Esta exigência está prevista na Norma Operacional CNS nº 001 de 2013, item 3.2.`
      },
      {
        id: 'P-GEN-05',
        title: 'Retirar enquadramento incorreto em Área Temática Especial',
        title_es: 'Retirar clasificación errónea en Área Temática Especial',
        normativa: 'Resolução CNS nº 466/2012, Item IX.4 e Carta Circular nº 172/2017',
        template: `Área Temática Especial Inadequada: A fim de evitar que o presente protocolo de pesquisa e futuras emendas ou notificações sejam automaticamente encaminhadas à INAEP/CONEP gerando atrasos na tramitação, solicita-se retirar a indicação de Área Temática Especial no cadastro do protocolo na Plataforma Brasil, uma vez que o estudo não se enquadra nas definições de alta complexidade previstas na Resolução CNS nº 466 de 2012 (Item IX.4) e na Carta Circular nº 172/2017.`
      },
      {
        id: 'P-GEN-06',
        title: 'Dispensa de carta-resposta na fase de validação documental inicial',
        title_es: 'Dispensa de carta de respuesta en fase de validación inicial',
        normativa: 'Procedimentos Operacionais do Sistema CEP/CONEP',
        template: `Observação Operacional: Na validação documental inicial, não é necessária carta-resposta; as correções e substituições de arquivos devem ser feitas diretamente nos campos e abas correspondentes na Plataforma Brasil. A carta-resposta com justificativas ponto a ponto só é exigida após a emissão de Parecer Consubstanciado após a reunião do Colegiado.`
      },
      {
        id: 'P-GEN-07',
        title: 'Instruções formais para submissão de Emenda ao projeto de pesquisa',
        title_es: 'Instrucciones formales para presentación de Enmienda al proyecto',
        normativa: 'Manual do Pesquisador Plataforma Brasil e Resolução CNS nº 466/2012',
        template: `Orientações para Submissão de Emenda:
Para a tramitação e análise de emendas ao protocolo de pesquisa na Plataforma Brasil, é obrigatório submeter:
1. Carta Justificativa: arquivo em formato editável que apresente de forma clara a justificativa para cada alteração pretendida, acompanhada do quadro comparativo com a lista dos documentos modificados;
2. Projeto de Pesquisa Atualizado: nova versão integral do projeto (ex: Projeto_V2_Data.pdf), contendo todas as alterações devidamente destacadas no texto com marcação em amarelo;
3. TCLE/TALE Atualizado: caso as mudanças afetem procedimentos, riscos ou métodos que envolvam os participantes, novo documento de consentimento/assentimento deve ser encaminhado com as modificações igualmente realçadas em amarelo.`
      },
      {
        id: 'P-GEN-08',
        title: 'Documentos pendentes não anexados (Lista personalizável)',
        title_es: 'Documentos pendientes no adjuntados (Lista personalizable)',
        normativa: 'Norma Operacional CNS nº 001/2013, Item 3.2',
        template: `Documentos Pendentes Não Anexados:
Identificou-se a ausência de documentos obrigatórios para a continuidade da tramitação ética deste protocolo. Solicita-se providenciar a submissão dos seguintes arquivos na aba correspondente da Plataforma Brasil:
- [LISTAR DOCUMENTOS FALTANTES EX: FOLHA DE ROSTO ASSINADA / TERMO DE ANUÊNCIA / TCUD / INSTRUMENTO DE COLETA].`
      },
      {
        id: 'P-GEN-09',
        title: 'Falta de identificação clara dos signatários nas assinaturas (nome e cargo)',
        title_es: 'Falta de identificación clara de los firmantes en firmas (nombre y cargo)',
        normativa: 'Norma Operacional CNS nº 001/2013, Item 3.3.a',
        template: `Identificação dos Signatários nas Assinaturas:
Constata-se no documento [DOCUMENTO] a ausência de identificação clara e completa dos signatários. Todas as assinaturas devem vir acompanhadas de nome completo legível, cargo ou função institucional, preferencialmente acompanhadas de carimbo funcional ou assinatura digital certificada (GOV.BR / ICP-Brasil).`
      },
      {
        id: 'P-GEN-10',
        title: 'Submissão de termos institucionais desmembrados em arquivos individuais',
        title_es: 'Presentación de términos institucionales separados en archivos individuales',
        normativa: 'Norma Operacional CNS nº 001/2013, Item 3.2',
        template: `Submissão de Documentos em Arquivos Separados:
Solicita-se a submissão dos seguintes documentos institucionais em arquivos individuais e desmembrados na Plataforma Brasil:
- Termo de Compromisso para Utilização de Informações de Banco de Dados (TCUD);
- Declaração de Compromisso do Pesquisador Responsável;
- Termo de Justificativa de Ausência/Dispensa do TCLE;
- Solicitação de Dispensa de Aplicação do TCLE (se aplicável), todos devidamente assinados pelas respectivas partes.`
      },
      {
        id: 'P-GEN-11',
        title: 'Retorno do protocolo à CONEP por inconsistência de proponente ou recusa operacional à INAEP',
        title_es: 'Devolución de protocolo a CONEP por inconsistencia o rechazo operativo a INAEP',
        normativa: 'Norma Operacional CNS nº 001/2013 e Lei nº 14.874/2024',
        template: `Retorno do Protocolo à INAEP/CONEP:
Opção A (Inconsistência Institucional): Solicitamos o retorno deste protocolo à CONEP/INAEP em razão de inconsistência na tramitação administrativa: não foi indicada formalmente uma Instituição Proponente no sistema Plataforma Brasil, embora a análise comprove o vínculo do pesquisador responsável com instituição que possui Comitê de Ética próprio (ex: UEMS).

Opção B (Recusa Operacional por Sobrecarga de Pauta):
À Instância Nacional de Ética em Pesquisa (INAEP),
Informamos que, devido ao elevado fluxo de protocolos em análise e à sobrecarga da nossa pauta de avaliações colegiadas, o CEP/UCDB não dispõe de condições operacionais para assumir a relatoria do presente projeto no momento. Desta forma, solicitamos a redistribuição do processo a outro comitê credenciado.`
      }
    ]
  },
  {
    id: 'folha_rosto',
    name: 'Folha de Rosto e Instituição Proponente',
    name_es: 'Hoja de Rostro e Institución Proponente',
    icon: 'clipboard-document-check',
    pendencias: [
      {
        id: 'P-FR-01',
        title: 'Ausência da Folha de Rosto no protocolo',
        title_es: 'Ausencia de Hoja de Rostro en el protocolo',
        normativa: 'Norma Operacional CNS nº 001/2013, Item 3.3.a',
        template: `Folha de Rosto: Identificamos a ausência da Folha de Rosto no seu projeto de pesquisa. Informamos que este documento é obrigatório para a submissão, conforme a Norma Operacional CNS nº 001 de 2013. Por favor, acesse a Plataforma Brasil, imprima a Folha de Rosto gerada pelo sistema, preencha todos os campos, colete as assinaturas necessárias e anexe o documento digitalizado na seção correspondente.`
      },
      {
        id: 'P-FR-02',
        title: 'Preenchimento incompleto de campos e CNPJ da Instituição Proponente',
        title_es: 'Llenado incompleto de campos y CNPJ de la Institución',
        normativa: 'Norma Operacional CNS nº 001/2013, Item 3.3.a',
        template: `Folha de Rosto (Preenchimento Completo): A Norma Operacional CNS nº 001 de 2013 estabelece que todos os campos da Folha de Rosto devem ser preenchidos. Favor providenciar o correto preenchimento do CNPJ da instituição proponente, bem como o nome completo e cargo de todos os responsáveis nos respectivos campos.`
      },
      {
        id: 'P-FR-03',
        title: 'Falta de datas e assinaturas obrigatórias (Pesquisador e Representante Legal)',
        title_es: 'Falta de fechas y firmas obligatorias (Investigador y Representante)',
        normativa: 'Norma Operacional CNS nº 001/2013, Item 3.3.a',
        template: `Folha de Rosto (Assinaturas Faltantes): A Folha de Rosto anexada ao seu projeto não possui a data e/ou as assinaturas obrigatórias do(a) Pesquisador(a) Principal e do(a) Responsável Legal pela Instituição Proponente. A Folha de Rosto deve ser datada e assinada por todos os responsáveis, com identificação clara dos signatários (nome completo e função), preferencialmente com carimbo funcional ou assinatura digital autenticada via GOV.BR/SEI. Por favor, providencie o documento devidamente assinado e o anexe novamente.`
      },
      {
        id: 'P-FR-04',
        title: 'Vincular Instituição Proponente na Plataforma Brasil (Correção de "Sem Proponente")',
        title_es: 'Vincular Institución Proponente (Corrección de "Sin proponente")',
        normativa: 'Norma Operacional CNS nº 001/2013, Item 3.3.a',
        template: `Instituição Proponente e Folha de Rosto:
Na Folha de Rosto gerada pela Plataforma Brasil, o campo "INSTITUIÇÃO PROPONENTE" encontra-se preenchido como "Sem proponente" ou "Não se aplica". Sendo a pesquisa vinculada institucionalmente, a Instituição Proponente deve ser devidamente identificada.
Para realizar a correção, siga as etapas abaixo:
1. Acesse a Plataforma Brasil e, no menu principal, clique em "Alterar meus dados";
2. Vincule-se à sua instituição de origem ou confirme o vínculo cadastrado;
3. Retorne à edição do projeto e, na Etapa 1, desmarque a opção "Sem proponente" e selecione a instituição proponente vinculada;
4. Após a alteração, gere uma nova Folha de Rosto atualizada, solicite a assinatura do dirigente institucional competente e anexe o documento à plataforma.`
      },
      {
        id: 'P-FR-05',
        title: 'Conflito de interesse institucional: pesquisador assinou por si mesmo como instituição',
        title_es: 'Conflicto de intereses: investigador firmó por sí mismo como institución',
        normativa: 'Resolução CNS nº 466/2012 e Norma Operacional CNS nº 001/2013',
        template: `Folha de Rosto (Conflito de Interesses Institucional): Na Folha de Rosto anexada ao seu projeto verificamos que o(a) Pesquisador(a) Responsável e o(a) Responsável pela Instituição Proponente são a mesma pessoa. Conforme a Norma Operacional CNS nº 001 de 2013 e a Resolução CNS nº 466/2012, é necessário que outro responsável institucional, desprovido de conflitos de interesse (direção superior, pró-reitoria ou chefia imediata), assine a Folha de Rosto no campo institucional com seu carimbo ou identificação funcional. Por favor, providencie uma nova via e anexe o documento corrigido.`
      },
      {
        id: 'P-FR-06',
        title: 'Ajuste de Patrocínio vs. Financiamento Próprio (Bolsas de Estudo / Recursos)',
        title_es: 'Ajuste de Patrocinio vs. Financiación Propia (Becas / Recursos)',
        normativa: 'Norma Operacional CNS nº 001/2013, Item 3.3.e',
        template: `Folha de Rosto e Financiamento: Notamos que a Folha de Rosto indica a presença de um patrocinador financeiro, porém sem as devidas assinaturas. Esclarecemos que:
Opção 1: Caso o recurso seja exclusivamente uma bolsa de estudos ou autofinanciamento pelo próprio pesquisador, não há repasse direto de recursos da agência para a execução do projeto em si, não se caracterizando patrocínio institucional. Por favor, edite a informação na Plataforma Brasil (Etapa 3 - Apoio Financeiro), indicando a modalidade como "Financiamento Próprio", gere nova Folha de Rosto atualizada e a anexe.
Opção 2: Caso haja patrocínio financeiro direto para o custeio do projeto por empresa ou órgão de fomento externo, é obrigatório providenciar a assinatura do representante legal da instituição patrocinadora na Folha de Rosto ou anexar o Termo de Outorga oficial comprobatório.`
      },
      {
        id: 'P-FR-07',
        title: 'Trâmite de assinatura da Folha de Rosto pela Pró-Reitoria de Pesquisa (UCDB)',
        title_es: 'Trámite de firma de la Hoja de Rostro por Prorrectoría de Investigación (UCDB)',
        normativa: 'Norma Operacional CNS nº 001/2013 e Procedimentos Institucionais CEP UCDB',
        template: `Assinatura Institucional na Folha de Rosto (UCDB):
A Folha de Rosto gerada na Plataforma Brasil deve indicar a Instituição Proponente (CNPJ 03.226.149/0015-87 - UCDB).
Para obter a assinatura do Representante Legal da Instituição, siga o procedimento institucional:
1. Preencha, assine e date a Folha de Rosto;
2. Obtenha a assinatura do Coordenador do Programa de Pós-Graduação (PPG) no Formulário de Anuência;
3. Encaminhe a Folha de Rosto juntamente com a Anuência do PPG para o e-mail: cep@ucdb.br;
4. A Assessoria do CEP colherá a assinatura do Pró-Reitor de Pesquisa e Pós-Graduação (prazo institucional de 7 dias úteis) e devolverá o documento assinado por e-mail para que o pesquisador possa submetê-lo na Plataforma Brasil.`
      },
      {
        id: 'P-FR-08',
        title: 'Incompatibilidade de dados entre a Folha de Rosto e os arquivos do projeto',
        title_es: 'Incompatibilidad de datos entre la Hoja de Rostro y archivos del proyecto',
        normativa: 'Norma Operacional CNS nº 001/2013, Item 3.3.a',
        template: `Incompatibilidade entre a Folha de Rosto e o Projeto:
A Folha de Rosto anexada ao protocolo apresenta divergências em relação aos demais documentos submetidos (tais como título da pesquisa, instituição proponente ou área temática).
Solicita-se a revisão rigorosa de todos os arquivos do projeto para garantir conformidade e exatidão das informações, gerando uma nova Folha de Rosto devidamente corrigida e assinada.`
      }
    ]
  },
  {
    id: 'projeto_detalhado',
    name: 'Projeto Detalhado e Metodologia',
    name_es: 'Proyecto Detallado y Metodología',
    icon: 'document-text',
    pendencias: [
      {
        id: 'P-PRJ-01',
        title: 'Ausência do Projeto Detalhado completo',
        title_es: 'Ausencia del Proyecto Detallado completo',
        normativa: 'Resolução CNS nº 466/2012 e Norma Operacional CNS nº 001/2013, Item 3.4',
        template: `Projeto Detalhado: O Projeto submetido carece do envio do Projeto de Pesquisa na íntegra. É obrigatória a apresentação do documento completo contendo: capa, contracapa, resumo, introdução com embasamento teórico-científico suficiente, justificativa, objetivos claros, metodologia pormenorizada (com coleta e análise de dados, critérios de inclusão e exclusão), cronograma detalhado, orçamento financeiro discriminado, referências bibliográficas atualizadas e apêndices (Resolução CNS nº 466/2012 e Norma Operacional CNS nº 001/2013).`
      },
      {
        id: 'P-PRJ-02',
        title: 'Indício de pesquisa já iniciada / Uso de verbos no tempo passado',
        title_es: 'Indicio de investigación ya iniciada / Uso de verbos en tiempo pasado',
        normativa: 'Resoluções CNS nº 466/2012 e 510/2016; Norma Operacional CNS nº 001/2013',
        template: `Indício de Pesquisa Já Iniciada e Adequação dos Tempos Verbais:
Constatou-se que o Projeto Detalhado e os campos de Resumo e Metodologia da Plataforma Brasil estão redigidos no tempo verbal passado (ex: "a pesquisa teve como objetivo", "participaram do estudo", "os dados revelaram"), indicando que a coleta ou procedimentos empíricos foram iniciados antes da manifestação ética do Comitê.
Esclarecemos que, em estrita consonância com as diretrizes das Resoluções CNS nº 466/2012 e nº 510/2016 e da Norma Operacional CNS nº 001/2013, nenhuma atividade envolvendo seres humanos (inclusive o recrutamento ou aplicação prévia de termos) pode ocorrer antes da emissão do Parecer Consubstanciado de Aprovação. O Sistema CEP/CONEP não avalia nem aprova projetos retroativamente.
Solicita-se ao pesquisador esclarecer a situação e revisar integralmente a redação de todos os arquivos para o tempo verbal futuro, indicando que as etapas serão executadas somente após a aprovação ética formal.`
      },
      {
        id: 'P-PRJ-03',
        title: 'Critérios de inclusão, exclusão e processo de recrutamento incompletos',
        title_es: 'Criterios de inclusión, exclusión y proceso de reclutamiento incompletos',
        normativa: 'Norma Operacional CNS nº 001/2013, Item 3.4.1.11 e Resolução CNS 466/2012',
        template: `Critérios de Inclusão e Recrutamento: Considerando a Norma Operacional CNS nº 001 de 2013, item 3.4.1.11 e o item III.3.a da Resolução CNS nº 466/2012, solicita-se incluir no Projeto Detalhado e nas Informações Básicas da Plataforma Brasil a descrição exata da população de estudo:
1. Critérios objetivos de inclusão e critérios claros de exclusão metodológica;
2. Justificativa da amostra e quantitativo preciso de participantes;
3. Descrição detalhada do processo de recrutamento: informar minuciosamente como, onde e por quem os participantes serão abordados e convidados, garantindo que não haja qualquer constrangimento, pressão hierárquica ou perda de autonomia na adesão voluntária.`
      },
      {
        id: 'P-PRJ-04',
        title: 'Anonimização de fichas de coleta de dados (LGPD)',
        title_es: 'Anonimización de fichas de recolección de datos (LGPD)',
        normativa: 'Resolução CNS nº 466/2012, Item IV.3.e e Lei Geral de Proteção de Dados (LGPD)',
        template: `Instrumento de Coleta de Dados e Sigilo (LGPD): Ao analisar o instrumento de coleta de dados apresentado, identificou-se a presença de campo para identificação nominal do participante. Solicita-se a adequação do instrumento e da descrição metodológica para garantir o sigilo e a privacidade, conforme preconiza o item IV.3.e da Resolução CNS nº 466/2012 e a Lei Geral de Proteção de Dados (Lei nº 13.709/2018 - LGPD).
O pesquisador deve:
1. Remover o campo "Nome" da ficha de coleta de dados que será anexada à Plataforma e utilizada para a tabulação dos dados;
2. Adotar o sistema de codificação (pseudonimização): substituir a identificação nominal por códigos alfanuméricos (ex: P01, P02) no instrumento;
3. Esclarecer no projeto que a lista de correspondência (chave Código versus Nome) será mantida em arquivo protegido separado, sob posse exclusiva do pesquisador responsável, apenas para eventuais necessidades clínicas ou de auditoria, não fazendo parte do banco de dados analítico.`
      },
      {
        id: 'P-PRJ-05',
        title: 'Retificar menção equivocada a outro Comitê de Ética',
        title_es: 'Rectificar mención equivocada a otro Comité de Ética',
        normativa: 'Norma Operacional CNS nº 001/2013',
        template: `Identificação do Comitê de Ética Responsável: Constata-se que o corpo do projeto e/ou documentos anexos fazem menção equivocada a outro Comitê de Ética. Solicita-se que o pesquisador revise e retifique todo o texto dos arquivos para que conste única e exclusivamente o [NOME_OFICIAL_CEP] como o colegiado responsável pela revisão e acompanhamento ético deste protocolo de pesquisa.`
      },
      {
        id: 'P-PRJ-06',
        title: 'Projeto em fase de rascunho / Documentos em edição',
        title_es: 'Proyecto en borrador / Documentos en edición',
        normativa: 'Norma Operacional CNS nº 001/2013, Item 3.4',
        template: `Documentos em Fase de Edição: O Projeto submetido apresenta marcas de revisão pendentes, páginas em branco ou trechos incompletos em fase de rascunho. É estritamente necessário que todos os documentos estejam finalizados, revisados e na sua versão original definitiva. Por favor, revise e anexe a versão final e limpa ao sistema.`
      },
      {
        id: 'P-PRJ-07',
        title: 'Embasamento teórico e adequação metodológica insuficientes',
        title_es: 'Fundamentación teórica y adecuación metodológica insuficientes',
        normativa: 'Resolução CNS nº 466/2012, Itens III.1.a e III.2.a',
        template: `Embasamento Teórico e Adequação Metodológica: O projeto apresenta introdução e descrição metodológica excessivamente sucintas, não fornecendo os subsídios necessários para a correta avaliação do balanço entre riscos e benefícios. A Resolução CNS nº 466/2012, nos itens III.1.a e III.2.a, estabelece que a pesquisa envolvendo seres humanos deve ter fundamentação científico-tecnológica respaldada em literatura científica atualizada e metodologias validadas. A escassez de detalhes sobre as variáveis e procedimentos impede o Comitê de verificar a validade ética da proposta. Solicita-se a ampliação do referencial teórico na Introdução e o detalhamento pormenorizado das etapas de coleta e análise estatística dos dados.`
      },
      {
        id: 'P-PRJ-08',
        title: 'Critérios de inclusão, justificativa do campo e indicação de participantes',
        title_es: 'Criterios de inclusión, justificación del campo e indicación de participantes',
        normativa: 'Norma Operacional CNS nº 001/2013, Item 3.4.1.11',
        template: `Critérios de Inclusão e Seleção de Participantes:
Considerando a Norma Operacional CNS nº 001 de 2013, item 3.4.1.11, e a metodologia adotada no estudo, solicita-se:
1. Incluir detalhadamente, tanto no Projeto Detalhado quanto no campo "Critérios de Inclusão" das Informações Básicas do Projeto na Plataforma Brasil, os critérios de elegibilidade dos participantes;
2. Justificar a escolha da população/grupo amostral selecionado;
3. Explicar como foi selecionado o campo de pesquisa, quem fará a abordagem/indicação dos participantes e como o(a) pesquisador(a) definirá a amostra final.`
      },
      {
        id: 'P-PRJ-09',
        title: 'Interrupção imediata de coleta de dados iniciada antes da aprovação ética',
        title_es: 'Interrupción inmediata de recolección de datos iniciada antes de aprobación ética',
        normativa: 'Resoluções CNS nº 466/2012 e nº 510/2016',
        template: `Início da Coleta de Dados Antes da Aprovação Ética:
Constatou-se que a pesquisa foi iniciada e que houve coleta de dados e/ou assinaturas de participantes antes da emissão do parecer favorável por este CEP, o que contraria formalmente as Resoluções CNS nº 466/2012 e nº 510/2016, as quais estabelecem que nenhuma atividade envolvendo seres humanos pode ocorrer antes da aprovação ética final.
Diante disso, solicita-se:
1. A interrupção imediata de qualquer atividade de coleta de dados em andamento;
2. A submissão, pela Plataforma Brasil, do Termo de Compromisso do Pesquisador Responsável devidamente assinado, declarando a interrupção da coleta e comprometendo-se formalmente a não reiniciar as atividades antes da aprovação do colegiado, nem repetir esta conduta em futuras submissões.`
      },
      {
        id: 'P-PRJ-10',
        title: 'Justificativa ética para inclusão de populações vulneráveis',
        title_es: 'Justificación ética para inclusión de poblaciones vulnerables',
        normativa: 'Resolução CNS nº 510/2016, Art. 12',
        template: `Justificativa para Populações Vulneráveis:
A Resolução CNS nº 510/2016, Art. 12, determina que em pesquisas envolvendo crianças, adolescentes e pessoas com capacidade de decisão diminuída (ou em situação de vulnerabilidade específica), deverá haver justificativa clara e consistente no protocolo para a escolha desse grupo amostral. Solicita-se incluir no Projeto Detalhado a justificativa da escolha desses sujeitos, demonstrando a necessidade de sua participação e as salvaguardas éticas adotadas.`
      },
      {
        id: 'P-PRJ-11',
        title: 'Metodologia de Ciências Humanas com menção exclusiva à Resolução 466/2012',
        title_es: 'Metodología de Ciencias Humanas con mención exclusiva a Resolución 466/2012',
        normativa: 'Resolução CNS nº 510/2016',
        template: `Enquadramento em Ciências Humanas e Sociais (Resolução CNS nº 510/2016):
Identificou-se que os documentos do protocolo fazem referências exclusivas à Resolução CNS nº 466/2012. Sendo a metodologia do presente projeto voltada à área de Ciências Humanas e Sociais (CHS), solicita-se adequar o texto do Projeto Detalhado, TCLE e demais documentos anexos para fundamentar-se integralmente na Resolução CNS nº 510/2016, respeitando suas diretrizes conceituais, terminológicas e procedimentais específicas.`
      }
    ]
  },
  {
    id: 'cronograma',
    name: 'Cronograma de Execução',
    name_es: 'Cronograma de Ejecución',
    icon: 'calendar',
    pendencias: [
      {
        id: 'P-CRON-01',
        title: 'Ajustar início da coleta para 30 dias após a reunião colegiada',
        title_es: 'Ajustar inicio de recolección para 30 días después de la reunión',
        normativa: 'Resolução CNS nº 466/2012, Item III.2.r e Norma Operacional CNS nº 001/2013, Item 3.3.f',
        template: `Cronograma de Execução (Início Posterior à Reunião): A data de início da coleta de dados/entrevistas não pode se sobrepor ao período de permanência e avaliação do Projeto no CEP. 
Dentro do cronograma, tanto no Projeto Detalhado quanto no arquivo avulso de Cronograma e nas Informações Básicas do Projeto na Plataforma Brasil (Etapa 5 - Cronograma de Execução), precisa ser ajustada a data (no formato estrito DD/MM/AAAA) do início da coleta de dados para no mínimo 30 dias após a data da próxima reunião colegiada ([DATA_REUNIAO_CALCULADA]), ou seja, prevendo o início a partir de [DATA_COLETA_CALCULADA]. 
Caso o CEP libere o Parecer Consubstanciado de Aprovação antes desta data, a Coleta de dados poderá ser iniciada imediatamente. 
*Atenção: Os documentos Projeto, Cronograma avulso e Informações Básicas da Plataforma Brasil devem estar estritamente alinhados, com as mesmas etapas e datas idênticas.*`
      },
      {
        id: 'P-CRON-02',
        title: 'Padronização obrigatória de todas as datas no formato DD/MM/AAAA',
        title_es: 'Estandarización obligatoria de fechas en formato DD/MM/AAAA',
        normativa: 'Norma Operacional CNS nº 001/2013, Item 3.3.f',
        template: `Padronização de Formato de Datas: O cronograma de execução da pesquisa (tanto no corpo do projeto base quanto no documento anexado separadamente e nos campos do sistema) não apresenta as datas no formato exigido. Solicita-se a adequação de todos os documentos para o formato estrito de dia/mês/ano (DD/MM/AAAA), ressaltando que na Plataforma Brasil só são aceitas datas futuras ao dia do preenchimento.`
      },
      {
        id: 'P-CRON-03',
        title: 'Arquivo do cronograma anexado separadamente contém o projeto inteiro',
        title_es: 'Archivo del cronograma adjunto por separado contiene el proyecto entero',
        normativa: 'Norma Operacional CNS nº 001/2013',
        template: `Arquivo de Cronograma Avulso: O arquivo anexado sob a categoria 'Cronograma' contém indevidamente a cópia integral do projeto de pesquisa. Solicitamos limpar o documento, mantendo exclusivamente a tabela do cronograma de execução detalhado com todas as suas etapas e períodos padronizados em DD/MM/AAAA.`
      },
      {
        id: 'P-CRON-04',
        title: 'Ajuste de cronograma para 60 dias após reunião (resposta a pendência intempestiva)',
        title_es: 'Ajuste de cronograma a 60 días tras reunión (respuesta a pendiente fuera de plazo)',
        normativa: 'Norma Operacional CNS nº 001/2013 e Procedimentos CEP UCDB',
        template: `Ajuste de Cronograma (Resposta Intempestiva):
Considerando que a resposta a esta pendência foi submetida após o prazo regulamentar de 20 dias que antecedem a reunião ordinária do Colegiado, o projeto deverá ser apreciado na reunião subsequente.
Solicita-se ajustar o cronograma de execução prevendo o início da coleta de dados para 60 dias após a data da próxima reunião colegiada. Esse ajuste deve ser realizado de forma idêntica tanto no documento do Projeto Detalhado quanto na Etapa 5 (Cronograma) das Informações Básicas do Projeto na Plataforma Brasil.`
      },
      {
        id: 'P-CRON-05',
        title: 'Início da coleta sobrepondo-se à tramitação ética / Inserir cronograma no corpo do projeto',
        title_es: 'Inicio de recolección sobreponiéndose al trámite ético / Insertar en cuerpo del proyecto',
        normativa: 'Norma Operacional CNS nº 001/2013, Item 3.3.f',
        template: `Cronograma de Execução e Tramitação Ética:
A data de início da coleta de dados/entrevistas proposta no cronograma sobrepõe-se ao período necessário para tramitação, análise e deliberação do CEP. Ressalta-se que a coleta de dados com seres humanos somente poderá ser iniciada após a aprovação ética final deste comitê (ou após a autorização do CEP, caso liberada anteriormente).
Solicita-se:
1. Incluir a tabela de cronograma completa no corpo do arquivo do Projeto Detalhado (conforme item 3.3.f da Norma Operacional CNS nº 001/2013);
2. Ajustar a data da coleta de dados para uma data posterior à apreciação ética (sugerindo-se ao menos 30 a 45 dias após a próxima reunião do CEP);
3. Garantir alinhamento rigoroso entre as datas do Projeto Detalhado e a Etapa 5 da Plataforma Brasil no formato DD/MM/AAAA.`
      }
    ]
  },
  {
    id: 'riscos_beneficios',
    name: 'Riscos e Benefícios (Regra Copia e Cola)',
    name_es: 'Riesgos y Beneficios (Regla Copiar y Pegar)',
    icon: 'shield-exclamation',
    pendencias: [
      {
        id: 'P-RB-01',
        title: 'Excluir expressão "risco mínimo", "baixo" ou alegação de inexistência de riscos',
        title_es: 'Excluir expresión "riesgo mínimo", "bajo" o inexistencia de riesgos',
        normativa: 'Resolução CNS nº 466/2012, Item V e Resolução CNS nº 510/2016, Art. 2º, Inciso XXV',
        template: `Riscos e Benefícios (Expressão "Risco Mínimo" Proibida): Identificou-se que na redação dos riscos no TCLE, no Projeto Detalhado e na Plataforma Brasil, os documentos utilizam expressões como "riscos mínimos", "baixo risco" ou declaram que "não há riscos". 
O Sistema CEP/CONEP/INAEP considera que toda pesquisa envolvendo seres humanos acarreta riscos em diferentes graus e dimensões (física, psíquica, moral, intelectual, social, cultural ou de confidencialidade) e não adota a classificação de gradação de riscos nos documentos apresentados aos participantes. Ao subestimar os riscos, o pesquisador compromete a autonomia do participante na tomada de decisão informada.
Solicita-se:
1) Retirar a palavra "mínimos", "baixos" ou similares de todos os arquivos;
2) Reinsira explicitamente a palavra "riscos" e descreva objetivamente quais são os desconfortos e potenciais danos reais inerentes ao estudo (ex: cansaço, desconforto emocional ao responder a perguntas sensíveis, quebra acidental de sigilo);
3) Apresentar as providências, cautelas e plano concreto de mitigação a serem empregados pela equipe;
4) Garantir que este texto corrigido seja estritamente idêntico (copiar e colar) no corpo do Projeto, no TCLE e nas Informações Básicas da Plataforma Brasil.`
      },
      {
        id: 'P-RB-02',
        title: 'Obrigatoriedade de capítulo específico de Aspectos Éticos e Assistência a Danos',
        title_es: 'Capítulo específico de Aspectos Éticos y Asistencia ante Daños',
        normativa: 'Resolução CNS nº 510/2016, Art. 2º, XXV e Resolução CNS 466/2012, Cap. V',
        template: `Capítulo Específico de Aspectos Éticos e Medidas de Assistência: Conforme preconiza a Resolução CNS nº 510/2016 (Art. 2º, Inciso XXV) e a Resolução CNS nº 466/2012 (Capítulo V), é obrigatório incluir no corpo do Projeto Detalhado uma seção/capítulo específico sobre Aspectos Éticos contemplando Riscos e Benefícios. Além de nomear as possibilidades de dano, o documento deve prever conduta técnica clara e garantir expressamente a assistência imediata, integral e gratuita sob responsabilidade dos pesquisadores caso ocorram intercorrências ou agravos decorrentes da pesquisa.`
      },
      {
        id: 'P-RB-03',
        title: 'Desalinhamento documental: textos de riscos e benefícios não estão idênticos',
        title_es: 'Desalineación documental: textos de riesgos y beneficios no están idénticos',
        normativa: 'Norma Operacional CNS nº 001/2013 e Resolução CNS nº 466/2012',
        template: `Alinhamento Documental Rigoroso (Copia e Cola): Constatou-se divergência na descrição dos riscos, das mitigações e dos benefícios entre os documentos apresentados. É exigência do Comitê que o conteúdo relativo a Riscos e Benefícios seja RIGOROSAMENTE O MESMO (copiar e colar) em todas as instâncias: 1) Dentro do Projeto Detalhado (capítulo Aspectos Éticos); 2) No Termo de Consentimento Livre e Esclarecido (TCLE) e TALE; e 3) No formulário online da Plataforma Brasil (Etapa 4 - Informações Básicas do Projeto).`
      },
      {
        id: 'P-RB-04',
        title: 'Remoção de benefício acadêmico exclusivo do pesquisador (TCC, mestrado, publicações)',
        title_es: 'Eliminación de beneficio académico exclusivo del investigador',
        normativa: 'Resolução CNS nº 466/2012, Item III.1.p',
        template: `Adequação dos Benefícios da Pesquisa: Foi listado como benefício da pesquisa a 'obtenção de título acadêmico' (TCC, dissertação de mestrado ou tese) ou a 'publicação de artigos'. Do ponto de vista bioético, o ganho acadêmico é um benefício exclusivo do pesquisador, e não do estudo para com a sociedade ou os participantes. Conforme o item III.1, alínea "p" da Resolução CNS nº 466/2012, solicita-se remover o ganho acadêmico do rol de benefícios e descrever exclusivamente as contribuições sociais, científicas, clínicas ou institucionais esperadas da pesquisa.`
      },
      {
        id: 'P-RB-05',
        title: 'Declaração indevida de "Não há riscos" ou riscos inexistentes',
        title_es: 'Declaración indebida de "No hay riesgos" o riesgos inexistentes',
        normativa: 'Resolução CNS nº 510/2016, Art. 2º, XXV e Resolução CNS nº 466/2012',
        template: `Declaração de Inexistência de Riscos:
Constatou-se nos documentos a declaração de que "não há riscos para a pesquisa em questão" ou afirmação equivalente. O Sistema CEP/CONEP estabelece expressamente que toda pesquisa envolvendo seres humanos acarreta riscos, ainda que predominantemente psicológicos, morais, intelectuais, sociais ou de quebra de confidencialidade (Resolução CNS nº 510/2016, Art. 2º, XXV).
Subestimar ou omitir os riscos impede que o participante exerça sua autonomia de forma livre e informada.
Solicita-se a reformulação integral do tópico de Riscos, descrevendo:
1. A possibilidade objetiva de danos às dimensões do participante decorrentes das atividades do estudo;
2. As providências, cautelas e medidas de acolhimento que serão adotadas para minimizar esses riscos;
3. O direito inalienável do participante de recusar responder a qualquer questão ou abandonar o estudo a qualquer momento sem prejuízo;
4. Alinhamento idêntico deste texto no Projeto Detalhado, TCLE e Plataforma Brasil.`
      },
      {
        id: 'P-RB-06',
        title: 'Providências e cautelas para mitigar riscos na pesquisa',
        title_es: 'Medidas y precauciones para mitigar riesgos en la investigación',
        normativa: 'Resolução CNS nº 466/2012, Itens III.1.b e IV.3.b',
        template: `Providências e Cautelas de Mitigação de Riscos:
Conforme estabelece a Resolução CNS nº 466/2012 (itens III.1.b e IV.3.b), é obrigatório que os documentos da pesquisa explicitem de forma clara quais são as providências, cautelas e procedimentos práticos que o pesquisador adotará para evitar, reduzir ou remediar qualquer desconforto, dano ou situação imprevista decorrente da participação na pesquisa.
Solicita-se detalhar expressamente essas providências no Projeto Detalhado, no TCLE e na Plataforma Brasil.`
      },
      {
        id: 'P-RB-07',
        title: 'Riscos e benefícios específicos de pesquisas com banco de dados e prontuários (LGPD)',
        title_es: 'Riesgos y beneficios específicos en base de datos y expedientes (LGPD)',
        normativa: 'Resolução CNS nº 466/2012 e Lei nº 13.709/2018 (LGPD)',
        template: `Riscos em Pesquisa com Banco de Dados e Prontuários (LGPD):
Em pesquisas que utilizam prontuários, registros institucionais ou bancos de dados secundários, não é admitido classificar genericamente a pesquisa como isenta de risco ou de "risco mínimo". Os riscos primários residem no acesso indevido, vazamento acidental de informações, quebra de sigilo ou reidentificação de dados pessoais sensíveis.
Solicita-se:
1. Descrever no capítulo de Riscos os riscos de confidencialidade e privacidade associados ao manuseio da base de dados;
2. Especificar as medidas de proteção técnica e administrativa adotadas (criptografia, controle de acessos, anonimização, armazenamento seguro), em conformidade com a LGPD (Lei nº 13.709/2018);
3. Replicar esse mesmo conteúdo no Projeto Detalhado e no campo correspondente da Plataforma Brasil.`
      }
    ]
  },
  {
    id: 'tcle',
    name: 'TCLE (Termo de Consentimento Livre e Esclarecido)',
    name_es: 'TCLE (Consentimiento Libre e Informado)',
    icon: 'document-check',
    pendencias: [
      {
        id: 'P-TCLE-01',
        title: 'Dados completos do CEP local e descrição oficial da INAEP (Lei 14.874/2024)',
        title_es: 'Datos completos del CEP local y descripción de la INAEP',
        normativa: 'Resoluções CNS nº 466/2012 e 510/2016; Lei Federal nº 14.874/2024',
        template: `Contatos do CEP e Órgão Nacional no TCLE: Conforme orientam as resoluções vigentes (Res. CNS nº 466/2012, item IV.5.d e Res. CNS nº 510/2016, Art. 17, inciso VIII) e a Lei Federal nº 14.874/2024, é obrigatório que o TCLE contenha os meios completos de contato do pesquisador e do Comitê de Ética local, juntamente com a explicação formal sobre o papel do CEP e da Instância Nacional de Ética em Pesquisa (INAEP). 
Solicita-se inserir no TCLE o texto padronizado abaixo:
"A pesquisa aqui proposta foi aprovada pelo [NOME_OFICIAL_CEP], situado na [ENDERECO_CEP], telefone [TELEFONE_CEP], e-mail institucional: [EMAIL_CEP], com atendimento ao público de [HORARIO_CEP]. 
O CEP é um colegiado interdisciplinar e independente, de relevância pública, com caráter consultivo, deliberativo e educativo, responsável por avaliar e acompanhar os aspectos éticos das pesquisas envolvendo seres humanos para assegurar a proteção e dignidade dos voluntários.
Caso deseje, você também poderá buscar esclarecimentos, apresentar dúvidas, reclamações ou denúncias junto à Instância Nacional de Ética em Pesquisa (INAEP), órgão colegiado de âmbito nacional instituído pela Lei nº 14.874/2024, sediado no Edifício PO700 - Ministério da Saúde, SRTV 701, Via W 5 Norte, Lote D, 5º andar, Asa Norte, Brasília/DF - CEP: 70719-040, Telefone: (61) 3315-5878 / 5877, E-mail: inaep@saude.gov.br."`
      },
      {
        id: 'P-TCLE-02',
        title: 'Garantia expressa de ressarcimento e direito legal à indenização por danos',
        title_es: 'Garantía expresa de resarcimiento y derecho legal a indemnización',
        normativa: 'Resolução CNS nº 466/2012, Itens IV.3.g e IV.3.h; Resolução CNS 510/2016, Art. 17, V',
        template: `Ressarcimento e Indenização no TCLE: O texto do Termo de Consentimento Livre e Esclarecido (TCLE) deve afirmar de forma explícita, clara e afirmativa (sem condicionalidades ou restrições):
1. O direito do participante ao ressarcimento integral de eventuais despesas decorrentes de sua participação na pesquisa, tais como custos de transporte e alimentação (Resolução CNS nº 466/2012, item IV.3.g). O termo utilizado deve ser textualmente "ressarcimento", sendo vedado o termo "compensação financeira";
2. A garantia de assistência médica/psicológica gratuita e imediata por danos decorrentes do estudo, bem como o direito expresso de buscar indenização diante de eventuais danos materiais ou imateriais, diretos ou indiretos (Resolução CNS nº 466/2012, item IV.3.h e Resolução CNS nº 510/2016, Art. 17).`
      },
      {
        id: 'P-TCLE-03',
        title: 'Opções de escolha excludentes para gravação de voz e/ou imagem',
        title_es: 'Opciones de elección excluyentes para grabación de voz e imagen',
        normativa: 'Resolução CNS nº 510/2016, Art. 3º, Inciso VII',
        template: `Autorização para Gravação de Imagem e Voz: Observando-se que a metodologia prevê a realização de entrevistas gravadas (áudio ou vídeo), o pesquisador deve explicitar de forma clara no projeto e no TCLE a finalidade da captação. Em consonância com a Resolução CNS nº 510/2016, Art. 3º, Inciso VII, o TCLE (ou termo avulso de cessão) deve ser adequado para incluir opções de múltipla escolha excludentes ao final do documento antes da assinatura:
( ) Sim, autorizo a gravação e divulgação da minha imagem e/ou voz.
( ) Não autorizo a gravação nem a divulgação da minha imagem e/ou voz.
( ) Autorizo a gravação apenas para fins de registro e análise interna da pesquisa, mas não autorizo a divulgação.`
      },
      {
        id: 'P-TCLE-04',
        title: 'Formatação do TCLE: Paginação "Página X de Y" e campo para rúbricas em todas as laudas',
        title_es: 'Formato del TCLE: Paginación "Página X de Y" y rúbricas en todas las laudas',
        normativa: 'Resolução CNS nº 466/2012, Item IV.5.d',
        template: `Formatação do TCLE (Paginação e Rúbricas): Solicita-se a adequação da formatação do documento do TCLE para incluir obrigatoriamente:
1. Paginação: inserir a numeração das páginas no formato estrito "Página X de Y" em todas as laudas;
2. Rúbricas: inserir campo específico para a rúbrica do participante de pesquisa (ou seu responsável legal) e do pesquisador responsável em todas as laudas do documento, reservando o campo para as assinaturas completas exclusivamente para a última página (Resolução CNS nº 466/2012, item IV.5.d).`
      },
      {
        id: 'P-TCLE-05',
        title: 'Garantia de recebimento de "via original" assinada (evitar o termo "cópia")',
        title_es: 'Garantía de recepción de "vía original" firmada (evitar término "copia")',
        normativa: 'Resolução CNS nº 466/2012, Item IV.5.d',
        template: `Via do Participante no TCLE: O texto do TCLE deve assegurar claramente que o participante da pesquisa receberá uma via original do documento, devidamente assinada e rubricada por ele e pelo pesquisador. Solicita-se evitar a utilização da palavra "cópia", adotando a redação recomendada: "Este documento é elaborado em duas vias originais de igual teor. Uma via original ficará com você (participante) e a outra com o pesquisador responsável."`
      },
      {
        id: 'P-TCLE-06',
        title: 'TCLE submetido já assinado ou preenchido (exigência de envio em branco)',
        title_es: 'TCLE enviado ya firmado o llenado (exigencia de envío en blanco)',
        normativa: 'Norma Operacional CNS nº 001/2013',
        template: `TCLE Limpo / Em Branco: O Termo de Consentimento Livre e Esclarecido (TCLE) anexado encontra-se preenchido e/ou assinado previamente. Solicita-se a submissão de via limpa, sem assinaturas e sem preenchimento prévio, contendo apenas os campos destinados ao preenchimento pelos participantes e pesquisadores no momento da aplicação do estudo, que só poderá ocorrer após a emissão do Parecer de Aprovação Ética.`
      },
      {
        id: 'P-TCLE-07',
        title: 'Garantia de não prejuízo do atendimento de saúde no SUS',
        title_es: 'Garantía de no perjuicio en la atención de salud en el SUS',
        normativa: 'Resolução CNS nº 580/2018, Art. 4º, Parágrafo Único',
        template: `Garantia de Atendimento no SUS: Em conformidade com a Resolução CNS nº 580 de 2018, Art. 4º, Parágrafo único, deve ser incluída cláusula expressa no TCLE garantindo que o atendimento de saúde do usuário na rede pública (SUS) não será de forma alguma prejudicado, independentemente de sua decisão de participar, recusar ou retirar seu consentimento da pesquisa.`
      },
      {
        id: 'P-TCLE-08',
        title: 'Critérios éticos para pesquisas em ambiente virtual (Google Forms/Online)',
        title_es: 'Criterios éticos para investigaciones virtuales (Google Forms/Online)',
        normativa: 'Ofício Circular nº 2/2021/CONEP/SECNS/MS',
        template: `Coleta em Ambiente Virtual (Ofício Circular nº 2/2021/CONEP): Em pesquisas com coleta online, o registro do consentimento eletrônico deve atender aos seguintes preceitos:
1. Instruir expressamente o participante a salvar ou fazer o download de uma cópia eletrônica do documento antes de responder;
2. Informar de maneira clara que a concordância formal se dará mediante a seleção obrigatória do botão "Li e concordo em participar da pesquisa";
3. Garantir o direito de não responder a perguntas específicas com as quais não se sinta confortável, sem qualquer prejuízo à sua participação;
4. Descrever os riscos inerentes ao ambiente virtual e à internet (limitações de segurança e confidencialidade) e as medidas adotadas para mitigá-los, observando a Lei Geral de Proteção de Dados (LGPD);
5. Disponibilizar canal de comunicação direta por e-mail ou telefone para envio de confirmação ao voluntário.`
      },
      {
        id: 'P-TCLE-09',
        title: 'Improcedência de solicitação de dispensa de TCLE (pesquisa com contato direto)',
        title_es: 'Improcedencia de solicitud de exención de TCLE (contacto directo con participantes)',
        normativa: 'Resolução CNS nº 466/2012, Item IV e Item IV.8',
        template: `Improcedência de Dispensa de TCLE (Contato Direto com Participantes):
Nas Informações Básicas do Projeto geradas pela Plataforma Brasil, verificou-se que o pesquisador assinalou "SIM" para a pergunta "Propõe dispensa do TCLE?".
Entretanto, o protocolo envolve intervenção, coleta presencial ou contato direto com participantes, o que torna a obtenção do consentimento plenamente viável e eticamente indispensável.
Dessa forma, solicita-se:
1. Alterar a resposta da pergunta "Propõe dispensa do TCLE?" para "NÃO" na Etapa correspondente da Plataforma Brasil;
2. Elaborar e anexar o documento do TCLE (e TALE, caso haja menores de 18 anos) atendendo integralmente ao item IV da Resolução CNS nº 466/2012;
3. Adequar o Projeto Detalhado, removendo o pedido de dispensa e descrevendo o procedimento de obtenção e registro do consentimento.`
      },
      {
        id: 'P-TCLE-10',
        title: 'Justificativa para dispensa de TCLE e TALE em prontuários e dados secundários de menores',
        title_es: 'Justificación para exención de TCLE y TALE en expedientes y datos secundarios de menores',
        normativa: 'Resolução CNS nº 466/2012, Item IV.8',
        template: `Dispensa de TCLE/TALE em Pesquisa com Prontuários:
Tratando-se de estudo documental retrospectivo com análise de prontuários eletrônicos de crianças/adolescentes sem contato direto com os pacientes ou seus responsáveis:
1. Deve ser anexada a Justificativa formal de Dispensa de TCLE e TALE (utilizando preferencialmente o modelo disponível no site do CEP UCDB);
2. Nas Informações Básicas do Projeto na Plataforma Brasil, confirmar a opção "SIM" para a pergunta "Propõe dispensa do TCLE?", fundamentando no campo de justificativa a impossibilidade prática de obtenção do consentimento individual dos sujeitos e o compromisso ético de preservação do sigilo.`
      },
      {
        id: 'P-TCLE-11',
        title: 'Dados completos de contato dos pesquisadores responsáveis no TCLE',
        title_es: 'Datos completos de contacto de los investigadores responsables en el TCLE',
        normativa: 'Resolução CNS nº 510/2016, Art. 17, Inciso VIII e Resolução CNS nº 466/2012',
        template: `Dados de Contato dos Pesquisadores no TCLE:
Conforme determina a Resolução CNS nº 510/2016, Art. 17, inciso VIII, e a Resolução CNS nº 466/2012, é obrigatório constar no texto do TCLE o endereço profissional completo, e-mail institucional e número de telefone direto do(a) Pesquisador(a) Principal e orientador(a), possibilitando que o participante de pesquisa entre em contato a qualquer momento em caso de dúvidas sobre o estudo.`
      }
    ]
  },
  {
    id: 'tale_menores',
    name: 'TALE e Populações Vulneráveis',
    name_es: 'TALE y Poblaciones Vulnerables',
    icon: 'user-group',
    pendencias: [
      {
        id: 'P-TALE-01',
        title: 'Obrigatoriedade do TALE para crianças (>7 anos) e adolescentes (<18 anos)',
        title_es: 'Obligatoriedad de TALE para niños (>7 años) y adolescentes (<18 años)',
        normativa: 'Resoluções CNS nº 466/2012 e 510/2016',
        template: `Termo de Assentimento Livre e Esclarecido (TALE): Em pesquisas que envolvem menores de 18 anos ou pessoas legalmente incapazes, é obrigatória a apresentação do TALE. Este documento deve ser elaborado em formato de convite, com linguagem simples, lúdica, clara e estritamente adequada ao nível de compreensão e faixa etária da criança ou adolescente, permitindo que manifeste sua anuência autônoma em participar. Ressaltamos que o TALE não deve ser uma reprodução técnica do TCLE de adultos, sendo recomendável o uso de recursos visuais e ilustrações.`
      },
      {
        id: 'P-TALE-02',
        title: 'Obrigatoriedade do TCLE para Pais ou Responsáveis Legais em arquivo separado',
        title_es: 'Obligatoriedad de TCLE para Padres o Tutores en archivo separado',
        normativa: 'Resoluções CNS nº 466/2012 e 510/2016',
        template: `TCLE dos Pais / Responsáveis Legais: Além do Termo de Assentimento (TALE) para o menor, é obrigatória a apresentação do Termo de Consentimento Livre e Esclarecido (TCLE) específico dirigido aos pais ou responsáveis legais da criança/adolescente. O documento deve ser anexado como um arquivo separado na Plataforma Brasil, devendo dirigir-se expressamente aos responsáveis quanto à autorização da participação de seus filhos.`
      },
      {
        id: 'P-TALE-03',
        title: 'Inserção de riscos e desconfortos em linguagem infantil no TALE',
        title_es: 'Inserción de riesgos y molestias en lenguaje infantil en TALE',
        normativa: 'Resolução CNS nº 466/2012 e Resolução CNS nº 510/2016',
        template: `Riscos Adequados no TALE: É obrigatória a inserção dos riscos da pesquisa também no Termo de Assentimento. O documento deve explicar à criança ou adolescente, em linguagem acessível e acolhedora, o que pode causar desconforto (ex: ficar com vergonha de responder, sentir cansaço) e orientar expressamente o que ela deve fazer caso isso ocorra (ex: avisar ao pesquisador que deseja parar a atividade imediatamente).`
      },
      {
        id: 'P-IND-02',
        title: 'Enquadramento obrigatório na Área Temática Especial de Populações Indígenas (INAEP)',
        title_es: 'Clasificación obligatoria en Área Temática Especial de Poblaciones Indígenas (INAEP)',
        normativa: 'Resolução CNS nº 304/2000, Resolução CNS nº 466/2012, Item IX.4 e Lei 14.874/2024',
        template: `Área Temática Especial - Populações Indígenas:
O projeto de pesquisa envolve participantes de comunidades indígenas. Conforme a Resolução CNS nº 304/2000 e a Resolução CNS nº 466/2012 (Item IX.4), o protocolo deve obrigatoriamente ser cadastrado na Plataforma Brasil como pertencente à Área Temática Especial "Populações Indígenas", uma vez que após a aprovação pelo CEP local deverá ser encaminhado para apreciação e homologação pela Instância Nacional de Ética em Pesquisa (INAEP/CONEP).`
      },
      {
        id: 'P-IND-03',
        title: 'Compromisso com Portaria FUNAI nº 177/2006 (Uso de Imagem e Som Indígena)',
        title_es: 'Compromiso con Resolución FUNAI nº 177/2006 (Uso de Imagen y Sonido Indígena)',
        normativa: 'Portaria FUNAI nº 177/PRES/2006, Art. 3º e 6º e Resolução CNS nº 304/2000',
        template: `Uso de Imagem e Som de Populações Indígenas (Portaria FUNAI nº 177/2006):
Em conformidade com os artigos 3º e 6º da Portaria FUNAI nº 177/PRES/2006 e com a Resolução CNS nº 304/2000, é obrigatório adequar o protocolo e o termo de consentimento para explicitar aos participantes indígenas como será realizado o registro e uso de sua imagem e som (áudio/vídeo), bem como a reprodução de manifestações culturais e artísticas, garantindo proteção contra exploração desautorizada e preservação da dignidade comunitária.`
      },
      {
        id: 'P-IND-04',
        title: 'Declaração de não patenteamento e vedação de uso comercial de conhecimento tradicional',
        title_es: 'Declaración de no patentamiento y prohibición de uso comercial de saberes tradicionales',
        normativa: 'Resolução CNS nº 304/2000, Art. 19 (item 2.5.4) e Lei Federal nº 13.123/2015',
        template: `Declaração de Não Patenteamento e Vedação Comercial:
Solicita-se apresentar declaração formal de compromisso do(a) pesquisador(a) responsável assegurando que os conhecimentos tradicionais eventualmente catalogados ou obtidos junto à comunidade indígena não serão objeto de patenteamento nem utilizados para fins comerciais ou de exploração econômica direta, sendo garantida a repartição de benefícios e conformidade rigorosa com a Resolução CNS nº 304/2000 (Art. 19, item 2.5.4) e a Lei Federal nº 13.123/2015.`
      }
    ]
  },
  {
    id: 'anuencia_tcud',
    name: 'TCUD, Anuências e Dados Secundários',
    name_es: 'TCUD, Autorizaciones y Datos Secundarios',
    icon: 'building-library',
    pendencias: [
      {
        id: 'P-TCUD-01',
        title: 'Ausência do TCUD para pesquisas em banco de dados / prontuários',
        title_es: 'Ausencia de TCUD para investigaciones con bases de datos / historias clínicas',
        normativa: 'Resolução CNS nº 466/2012, Item IV.3.e e Norma Operacional CNS nº 001/2013',
        template: `Termo de Compromisso de Utilização de Dados (TCUD): Sendo a pesquisa baseada em dados secundários, retrospectivos ou consulta a prontuários e registros hospitalares/institucionais, é obrigatória a apresentação do Termo de Compromisso de Utilização de Dados (TCUD). O documento deve ser anexado à Plataforma Brasil firmado por todos os membros da equipe de pesquisa, comprometendo-se com o sigilo, a privacidade e o manuseio restrito das informações para os fins exclusivos deste estudo.`
      },
      {
        id: 'P-TCUD-02',
        title: 'TCUD incompleto: falta RG de membros, especificação de variáveis e período de eventos',
        title_es: 'TCUD incompleto: falta documento de miembros, variables y período',
        normativa: 'Boas Práticas do Sistema CEP/CONEP e LGPD',
        template: `Detalhamento Obrigatório no TCUD: O Termo de Compromisso de Utilização de Dados (TCUD) deve ser adequado para contemplar obrigatoriamente:
1. O nome completo e o número de documento de identificação (RG ou CPF) de todos os pesquisadores e colaboradores vinculados ao protocolo;
2. A descrição clara das variáveis clínicas ou administrativas a serem extraídas;
3. O período exato relativo à ocorrência dos eventos investigados (exemplo: "dados relativos aos atendimentos clínicos registrados no período de janeiro de 2020 a dezembro de 2024").`
      },
      {
        id: 'P-TCUD-03',
        title: 'Assinatura do gestor institucional da base de dados / fiel depositário no TCUD',
        title_es: 'Firma del gestor institucional de la base de datos en TCUD',
        normativa: 'Resolução CNS nº 466/2012',
        template: `Assinatura do Fiel Depositário no TCUD: No caso de acesso a bancos de dados e prontuários institucionais, o TCUD deve garantir a guarda e a autorização formal de acesso. Solicita-se que o termo contenha assinaturas distintas: a do pesquisador responsável e a do responsável legal pelo setor ou banco de dados da instituição coparticipante (fiel depositário das informações), devidamente assinada e carimbada.`
      },
      {
        id: 'P-ANU-01',
        title: 'Falta de Termo de Anuência Institucional do local da pesquisa com carimbo',
        title_es: 'Falta de Autorización Institucional del lugar de investigación con sello',
        normativa: 'Resolução CNS nº 466/2012 e Carta Circular nº 0212/2010 CONEP',
        template: `Termo de Anuência Institucional (Carta de Anuência): O projeto indica a realização de etapas da pesquisa em instituição externa (hospital, posto de saúde, escola, universidade, empresa ou secretaria municipal/estadual). É obrigatória a apresentação do Termo de Anuência Institucional em papel timbrado da instituição coparticipante, devidamente datado, assinado e carimbado pelo seu gestor ou responsável administrativo legal, expressando a concordância e a autorização formal para o desenvolvimento da pesquisa e infraestrutura em suas dependências.`
      },
      {
        id: 'P-IND-01',
        title: 'Pesquisa com Populações Indígenas: FUNAI, Lideranças e Portaria 177/2006',
        title_es: 'Investigación con Poblaciones Indígenas: FUNAI y Líderes',
        normativa: 'Resolução CNS nº 304/2000, Resolução CNS nº 510/2016 e Portaria FUNAI nº 177/2006',
        template: `Pesquisa com Populações Indígenas: Conforme previsto nas normativas éticas nacionais (Resoluções CNS nº 304/2000 e nº 510/2016 e Instrução Normativa FUNAI nº 001/1995), toda pesquisa envolvendo comunidades indígenas exige:
1. Autorização formal da Presidência da FUNAI para realização do estudo em terra demarcada (ou declaração fundamentada do pesquisador caso a abordagem ocorra fora de terras demarcadas);
2. Termo de Anuência assinado pelas lideranças legítimas (cacique ou conselho) das comunidades envolvidas;
3. Declaração de compromisso do pesquisador de não patentear nem utilizar para fins comerciais o conhecimento tradicional catalogado (Lei nº 13.123/2015);
4. Observância à Portaria FUNAI nº 177/PRES/2006 e Nota Técnica nº 16/2020-SESAI/MS quanto à proteção dos direitos de imagem e som dos povos indígenas.`
      },
      {
        id: 'P-RC-01',
        title: 'Relato de Caso Clínico Concluído: Carta Circular 166/2018-CONEP',
        title_es: 'Reporte de Caso Clínico Concluido: Carta Circular 166/2018',
        normativa: 'Carta Circular nº 166/2018-CONEP/SECNS/MS',
        template: `Relato de Caso Clínico Já Concluído: Tratando-se de publicação de dados de rotina clínica retrospectiva sobre conduta já finalizada, o protocolo deve atender integralmente às diretrizes da Carta Circular nº 166/2018-CONEP:
1. Submeter o artigo/manuscrito com verbos no passado, sem qualquer dado identificador do paciente (sem nomes, iniciais, número de prontuário, datas exatas de internação ou nomes de equipes médicas);
2. Anexar o TCLE específico para Relato de Caso devidamente assinado pelo paciente ou responsável legal (ou justificativa fundamentada de impossibilidade em caso de óbito ou perda total de contato);
3. Anexar Termo de Anuência da instituição onde o paciente foi atendido assinado pela direção clínica;
4. Aplicar tarjas pretas sobre olhos e traços identificadores em fotografias clínicas ou exames radiológicos para assegurar anonimato estrito.`
      },
      {
        id: 'P-ANU-02',
        title: 'Especificação do local da pesquisa e anuência de ONGs ou instituições públicas',
        title_es: 'Especificación del lugar de investigación y anuencia de ONGs o instituciones públicas',
        normativa: 'Resolução CNS nº 466/2012 e Norma Operacional CNS nº 001/2013',
        template: `Local da Pesquisa e Anuência Institucional:
Solicita-se esclarecer e alinhar, no Projeto Detalhado, no TCLE e nas Informações Básicas da Plataforma Brasil, qual o local exato onde ocorrerão as etapas da pesquisa. Caso o estudo seja desenvolvido em dependências de ONGs, escolas, serviços de saúde ou instituições públicas/privadas externas, é obrigatório anexar o Termo de Anuência Institucional devidamente datado e assinado pelo dirigente da instituição, com indicação de cargo e carimbo ou certificação digital.`
      },
      {
        id: 'P-ANU-03',
        title: 'Termo de Anuência de Instituição Coparticipante',
        title_es: 'Término de Anuencia de Institución Copartícipe',
        normativa: 'Carta Circular nº 0212/2010 CONEP/CNS e Norma Operacional CNS nº 001/2013',
        template: `Instituição Coparticipante e Termo de Anuência:
O protocolo indica a existência de instituição(ões) coparticipante(s) no estudo. Conforme as diretrizes da Carta Circular nº 0212/2010 CONEP/CNS e da Norma Operacional CNS nº 001/2013, é indispensável anexar na Plataforma Brasil o Termo de Anuência devidamente assinado pelo dirigente responsável de cada instituição coparticipante vinculada, manifestando ciência e concordância institucional.`
      },
      {
        id: 'P-ANU-04',
        title: 'Termo de Compromisso do Pesquisador Responsável',
        title_es: 'Término de Compromiso del Investigador Responsable',
        normativa: 'Resolução CNS nº 466/2012, Cap. XI.2 e Norma Operacional CNS nº 001/2013',
        template: `Termo de Compromisso do Pesquisador Responsável:
Solicita-se a inclusão, na seção de arquivos da Plataforma Brasil, do Termo de Compromisso do Pesquisador Responsável devidamente datado e assinado, no qual conste expressamente o compromisso de cumprimento integral da Resolução CNS nº 466/2012 (e/ou 510/2016), a garantia de preservação do sigilo dos dados, a obrigatoriedade de envio dos relatórios semestrais parciais e final ao CEP e a utilização das informações estritamente para os fins deste protocolo, conforme estabelece o capítulo XI.2 da referida Resolução e a Norma Operacional nº 001/2013.`
      }
    ]
  }
,
  {
    id: 'ambiente_virtual',
    name: 'Pesquisas em Ambiente Virtual (Ofício Circular nº 02/2021)',
    name_es: 'Investigación en Ambiente Virtual (Oficio Circular nº 02/2021)',
    icon: 'globe-alt',
    pendencias: [
      {
        id: 'P-VIRT-01',
        title: 'Esclarecimento prévio sobre como se dará o registro do consentimento online',
        title_es: 'Aclaración previa sobre cómo se registrará el consentimiento online',
        normativa: 'Ofício Circular nº 02/2021/CONEP/SECNS/MS',
        template: `Registro do Consentimento em Ambiente Virtual:
Durante o processo de obtenção do consentimento em ambiente virtual, o pesquisador deverá esclarecer ao participante, de forma clara, objetiva e transparente, como se dará o registro de sua anuência (ex: clique em botão afirmativo "Aceito participar", envio de confirmação ou aceite eletrônico), antes de liberar o acesso às questões da pesquisa.`
      },
      {
        id: 'P-VIRT-02',
        title: 'Formatação idêntica do consentimento eletrônico ao que será exibido aos participantes',
        title_es: 'Formato idéntico del consentimiento electrónico al que se mostrará en pantalla',
        normativa: 'Ofício Circular nº 02/2021/CONEP/SECNS/MS',
        template: `Formatação do Consentimento Documental em Ambiente Virtual:
Solicita-se que, para os registros de consentimento (TCLE) e assentimento (TALE) eletrônicos, o documento anexado na Plataforma Brasil seja apresentado preferencialmente na mesma formatação, disposição textual e diagramação visual que será utilizada na plataforma/tela de visualização dos participantes, garantindo fidelidade e clareza na apreciação ética.`
      },
      {
        id: 'P-VIRT-03',
        title: 'Orientação e mecanismo para salvar/baixar cópia do termo eletrônico',
        title_es: 'Orientación y mecanismo para guardar/descargar copia del documento electrónico',
        normativa: 'Ofício Circular nº 02/2021/CONEP/SECNS/MS e Carta Circular nº 1/2021-CONEP',
        template: `Guarda de Cópia do Consentimento Eletrônico pelo Participante:
Quando a coleta de dados ocorrer em ambiente virtual, solicita-se incluir no texto inicial do consentimento informação clara que enfatize a importância de o participante guardar em seus arquivos pessoais uma cópia do documento eletrônico. O formulário deve disponibilizar mecanismo prático para download direto (ex: link para baixar em PDF) ou a opção para envio automático da cópia do termo por e-mail ao participante.`
      },
      {
        id: 'P-VIRT-04',
        title: 'Garantia expressa do direito de não responder a perguntas específicas',
        title_es: 'Garantía expresa del derecho de no responder a preguntas específicas',
        normativa: 'Ofício Circular nº 02/2021/CONEP/SECNS/MS',
        template: `Direito de Não Responder a Perguntas Específicas:
Solicita-se incluir no registro do consentimento livre e esclarecido a garantia expressa de que o participante tem o direito de não responder a qualquer pergunta específica que lhe cause incômodo, constrangimento ou dúvida. Caso haja perguntas configuradas como de resposta obrigatória no questionário online, deve haver a opção de recusa (ex: "Prefiro não responder").`
      },
      {
        id: 'P-VIRT-05',
        title: 'Apresentação prévia do TCLE/TALE no convite individual',
        title_es: 'Presentación previa del TCLE/TALE en la invitación individual',
        normativa: 'Ofício Circular nº 02/2021/CONEP/SECNS/MS',
        template: `Apresentação do TCLE no Convite Individual:
No texto do convite individual (e-mail, mensagem ou postagem) direcionado ao candidato a participante de pesquisa, solicita-se explicitar com clareza que, antes de iniciar o preenchimento de qualquer formulário ou responder a perguntas em ambiente não presencial, o Termo de Consentimento Livre e Esclarecido (ou Termo de Assentimento) será apresentado na íntegra para sua leitura atenta e livre manifestação de anuência.`
      },
      {
        id: 'P-VIRT-06',
        title: 'Garantia expressa de retirada da pesquisa a qualquer momento sem penalização',
        title_es: 'Garantía expresa de retiro de la investigación en cualquier momento sin penalización',
        normativa: 'Resolução CNS nº 510/2016 e Ofício Circular nº 02/2021/CONEP/SECNS/MS',
        template: `Liberdade de Retirada da Pesquisa Virtual:
Solicita-se incluir no TCLE em ambiente virtual a garantia explícita de que o participante goza de plena liberdade para retirar seu consentimento e abandonar o preenchimento do formulário a qualquer momento e em qualquer fase da pesquisa, bastando fechar a página ou aplicativo, sem que isso resulte em qualquer prejuízo, dano ou penalização.`
      },
      {
        id: 'P-VIRT-07',
        title: 'Canal e instruções para revogação do consentimento com envio de ciência pelo pesquisador',
        title_es: 'Canal e instrucciones para revocar consentimiento con envío de constancia',
        normativa: 'Ofício Circular nº 02/2021/CONEP/SECNS/MS e Carta Circular nº 1/2021-CONEP',
        template: `Instruções para Revogação dos Dados e Resposta de Ciência:
Solicita-se que o formulário virtual e o TCLE apresentem link ou instruções objetivas de contato (e-mail específico), informando ser possível, a qualquer momento e sem custos ou ônus, a retirada do consentimento de utilização dos dados do participante. Deve constar expressamente o compromisso de que o pesquisador responsável enviará uma resposta formal de ciência ao participante confirmando a exclusão dos dados requeridos.`
      },
      {
        id: 'P-VIRT-08',
        title: 'Informação sobre o teor e tópicos abordados no instrumento antes de responder',
        title_es: 'Información sobre temática y contenido del instrumento antes de responder',
        normativa: 'Ofício Circular nº 02/2021/CONEP/SECNS/MS',
        template: `Informação Prévia sobre o Teor do Questionário Virtual:
Solicita-se assegurar que o participante de pesquisa seja informado, ainda no termo de consentimento e antes de iniciar o questionário, sobre o teor geral e os principais tópicos abordados no instrumento de coleta, permitindo uma tomada de decisão verdadeiramente informada e consciente.`
      },
      {
        id: 'P-VIRT-09',
        title: 'Esclarecimento de consentimento tácito mediante envio das respostas',
        title_es: 'Aclaración de consentimiento tácito mediante el envío de las respuestas',
        normativa: 'Ofício Circular nº 02/2021/CONEP/SECNS/MS',
        template: `Consentimento Manifestado ao Enviar o Formulário:
Quando aplicável à metodologia virtual adotada, solicita-se informar no início da página que o consentimento foi previamente disponibilizado para leitura e que, ao prosseguir e enviar o formulário preenchido, a anuência do participante estará formalizada para os fins da pesquisa.`
      },
      {
        id: 'P-VIRT-10',
        title: 'Aviso prévio sobre impossibilidade de exclusão de dados em questionários 100% anônimos',
        title_es: 'Aviso previo sobre imposibilidad de exclusión de datos en cuestionarios 100% anónimos',
        normativa: 'Ofício Circular nº 02/2021/CONEP/SECNS/MS e LGPD',
        template: `Impossibilidade de Exclusão em Dados Anônimos:
Caso o desenho metodológico utilize questionário estritamente anônimo no qual, após a submissão das respostas, seja tecnicamente impossível identificar ou segregar as informações individuais do participante para posterior exclusão, essa condição deve ser expressamente esclarecida no termo de consentimento inicial, para que o participante tenha plena ciência antes de anuir.`
      }
    ]
  }
];

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { DEFAULT_PENDENCIAS_CATEGORIES };
}
