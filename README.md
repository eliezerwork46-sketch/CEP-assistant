# CEP Assistant - Sistema de Triagem e Notificação Ética

Aplicação web estática para auxílio na triagem documental, conformidade ética e emissão de pendências para Comitês de Ética em Pesquisa (CEP/CONEP/INAEP).

## 🚀 Funcionalidades Principais

- **Visualizador e Inspetor de Documentos:** Suporte a arquivos `.docx` e `.pdf` diretamente no navegador.
- **Catálogo de 78 Pendências Padronizadas:** Cobrindo resoluções CNS 466/2012, 510/2016, 580/2018, Norma Operacional 001/2013, Ofício Circular 02/2021 (Ambiente Virtual) e Lei Federal 14.874/2024.
- **Geração Automática de Pastas e Pareceres:** Criação de estrutura de arquivos (`log.txt`, `mlog.txt`, pasta do projeto) com um clique via File System Access API.
- **Painel de Gestão & Indicadores:** Métricas de aprovação, prazos, deliberações e caderno da reunião colegiada em PDF.
- **100% Client-Side:** Não requer backend nem banco de dados na nuvem; os dados permanecem na máquina do usuário.

## 🛠️ Tecnologias

- **Vue.js 3** (Composition API)
- **Mammoth.js** (.docx to HTML)
- **PDF.js** (Visualização de PDFs com busca interna)
- **File System Access API** (Conexão nativa e segura com pastas do sistema)
