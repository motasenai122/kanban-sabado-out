/**
 * ====================================================================
 * KANBAN PRO - GESTÃO DE TAREFAS, COLUNAS E CATEGORIAS
 * ====================================================================
 * Sistema didático utilizando HTML5 Drag and Drop, animações e
 * persistência local via LocalStorage.
 */

// Chaves utilizadas no LocalStorage
const STORAGE_KEY_TAREFAS = 'kanban_tarefas_v1';
const STORAGE_KEY_COLUNAS = 'kanban_colunas_v1';

// Colunas padrão fixas exigidas pela regra de negócio
const COLUNAS_PADRAO = [
  { id: 'todo', titulo: 'A Fazer', fixa: true },
  { id: 'doing', titulo: 'Em Execução', fixa: true },
  { id: 'done', titulo: 'Finalizado', fixa: true }
];

// Estado da Aplicação
let colunas = carregarColunas();
let tarefas = carregarTarefas();

// Referências do DOM
const columnsContainer = document.getElementById('kanban-columns-container');

// Modais e Formulários
const modalTarefa = document.getElementById('modal-tarefa');
const formTarefa = document.getElementById('form-tarefa');
const btnNovaTarefa = document.getElementById('btn-nova-tarefa');
const btnCancelarTarefa = document.getElementById('btn-cancelar-tarefa');

const modalColuna = document.getElementById('modal-coluna');
const formColuna = document.getElementById('form-coluna');
const btnNovaColuna = document.getElementById('btn-nova-coluna');
const btnCancelarColuna = document.getElementById('btn-cancelar-coluna');

const modalJustificativa = document.getElementById('modal-justificativa');
const formJustificativa = document.getElementById('form-justificativa');
const btnCancelarJustificativa = document.getElementById('btn-cancelar-justificativa');

// Controle do item sendo arrastado
let idTarefaArrastada = null;

// ====================================================================
// INICIALIZAÇÃO
// ====================================================================

document.addEventListener('DOMContentLoaded', () => {
  renderizarQuadroCompleto();
  configurarEventosGerais();
});

function configurarEventosGerais() {
  // Modal de Tarefa
  btnNovaTarefa.addEventListener('click', () => abrirModalTarefa());
  btnCancelarTarefa.addEventListener('click', () => fecharModal(modalTarefa));
  formTarefa.addEventListener('submit', (e) => {
    e.preventDefault();
    salvarTarefa();
  });

  // Modal de Coluna
  btnNovaColuna.addEventListener('click', () => abrirModalColuna());
  btnCancelarColuna.addEventListener('click', () => fecharModal(modalColuna));
  formColuna.addEventListener('submit', (e) => {
    e.preventDefault();
    salvarNovaColuna();
  });

  // Modal de Justificativa
  btnCancelarJustificativa.addEventListener('click', () => fecharModal(modalJustificativa));
  formJustificativa.addEventListener('submit', (e) => {
    e.preventDefault();
    confirmarFinalizacaoVencida();
  });
}

// ====================================================================
// PERSISTÊNCIA (LocalStorage)
// ====================================================================

function carregarColunas() {
  const dados = localStorage.getItem(STORAGE_KEY_COLUNAS);
  if (!dados) {
    localStorage.setItem(STORAGE_KEY_COLUNAS, JSON.stringify(COLUNAS_PADRAO));
    return [...COLUNAS_PADRAO];
  }
  return JSON.parse(dados);
}

function persistirColunas() {
  localStorage.setItem(STORAGE_KEY_COLUNAS, JSON.stringify(colunas));
}

function carregarTarefas() {
  const dados = localStorage.getItem(STORAGE_KEY_TAREFAS);
  return dados ? JSON.parse(dados) : [];
}

function persistirTarefas() {
  localStorage.setItem(STORAGE_KEY_TAREFAS, JSON.stringify(tarefas));
}

// ====================================================================
// PALETA DE CATEGORIAS PREMIUM
// ====================================================================

/**
 * Retorna cores suaves e ícone temático conforme a categoria
 */
function obterEstiloCategoria(nomeCategoria) {
  const cat = (nomeCategoria || 'Geral').toLowerCase().trim();

  if (cat.includes('trabalho') || cat.includes('work')) {
    return { bg: '#e0e7ff', text: '#3730a3', border: '#c7d2fe', icone: '💼' };
  }
  if (cat.includes('estudo') || cat.includes('learn')) {
    return { bg: '#ede9fe', text: '#5b21b6', border: '#ddd6fe', icone: '📚' };
  }
  if (cat.includes('urgente') || cat.includes('crítico')) {
    return { bg: '#fee2e2', text: '#991b1b', border: '#fecaca', icone: '🔥' };
  }
  if (cat.includes('pessoal') || cat.includes('life')) {
    return { bg: '#ecfdf5', text: '#065f46', border: '#a7f3d0', icone: '🌱' };
  }
  if (cat.includes('design') || cat.includes('ui')) {
    return { bg: '#fdf2f8', text: '#9d174d', border: '#fbcfe8', icone: '🎨' };
  }
  if (cat.includes('projeto')) {
    return { bg: '#f0fdf4', text: '#15803d', border: '#bbf7d0', icone: '🚀' };
  }

  return { bg: '#f1f5f9', text: '#334155', border: '#cbd5e1', icone: '🏷️' };
}

// ====================================================================
// GERENCIAMENTO DE COLUNAS
// ====================================================================

function abrirModalColuna() {
  formColuna.reset();
  modalColuna.classList.add('active');
}

/**
 * Insere a nova coluna sempre antes da coluna fixa 'Finalizado'
 */
function salvarNovaColuna() {
  const tituloInput = document.getElementById('coluna-titulo').value.trim();
  if (!tituloInput) return;

  const novaColuna = {
    id: 'col_' + Date.now(),
    titulo: tituloInput,
    fixa: false
  };

  const indexDone = colunas.findIndex(c => c.id === 'done');
  if (indexDone !== -1) {
    colunas.splice(indexDone, 0, novaColuna);
  } else {
    colunas.push(novaColuna);
  }

  persistirColunas();
  renderizarQuadroCompleto();
  fecharModal(modalColuna);
}

function excluirColuna(idColuna) {
  const coluna = colunas.find(c => c.id === idColuna);
  if (!coluna || coluna.fixa) {
    alert('As colunas padrão não podem ser removidas.');
    return;
  }

  const tarefasNaColuna = tarefas.filter(t => t.status === idColuna);
  if (tarefasNaColuna.length > 0) {
    alert('Não é possível excluir uma coluna com tarefas. Mova ou exclua as tarefas antes.');
    return;
  }

  if (confirm(`Deseja realmente remover a coluna "${coluna.titulo}"?`)) {
    colunas = colunas.filter(c => c.id !== idColuna);
    persistirColunas();
    renderizarQuadroCompleto();
  }
}

// ====================================================================
// RENDERIZAÇÃO DO QUADRO E DRAG AND DROP
// ====================================================================

function renderizarQuadroCompleto() {
  columnsContainer.innerHTML = '';

  colunas.forEach(coluna => {
    const tarefasDaColuna = tarefas.filter(t => t.status === coluna.id);

    const colElement = document.createElement('section');
    colElement.classList.add('kanban-column');
    colElement.dataset.status = coluna.id;

    const btnExcluirColHtml = !coluna.fixa
      ? `<button class="btn-delete-col" title="Excluir Coluna" onclick="excluirColuna('${coluna.id}')">✕</button>`
      : '';

    colElement.innerHTML = `
      <div class="column-header">
        <div class="column-header-title">
          <h2>${escaparHtml(coluna.titulo)}</h2>
          ${btnExcluirColHtml}
        </div>
        <span class="task-count" id="count-${coluna.id}">${tarefasDaColuna.length}</span>
      </div>
      <div class="column-body" id="list-${coluna.id}"></div>
    `;

    columnsContainer.appendChild(colElement);

    const listBody = colElement.querySelector('.column-body');
    tarefasDaColuna.forEach(tarefa => {
      const card = criarElementoCard(tarefa);
      listBody.appendChild(card);
    });

    configurarDropZone(listBody, coluna.id);
  });
}

function criarElementoCard(tarefa) {
  const card = document.createElement('div');
  card.classList.add('task-card');
  card.dataset.id = tarefa.id;

  const vencida = estaVencida(tarefa);
  const isFinalizada = tarefa.status === 'done';

  // RESTRIÇÃO 1: Tarefas concluídas não podem ser arrastadas nem modificadas
  if (isFinalizada) {
    card.classList.add('concluida');
    card.setAttribute('draggable', 'false');
  } else {
    card.setAttribute('draggable', 'true');
    if (vencida) {
      card.classList.add('vencida');
    }
  }

  // Estilização da Categoria
  const estiloCat = obterEstiloCategoria(tarefa.categoria);
  const categoriaHtml = `
    <span class="badge-categoria" style="background-color: ${estiloCat.bg}; color: ${estiloCat.text}; border-color: ${estiloCat.border};">
      ${estiloCat.icone} ${escaparHtml(tarefa.categoria || 'Geral')}
    </span>
  `;

  let alertaHtml = '';
  if (isFinalizada) {
    alertaHtml = `<span class="badge-concluida">✓ Concluída</span>`;
  } else if (vencida) {
    alertaHtml = `<span class="badge-alerta">⚠️ Vencida</span>`;
  }

  let notaHtml = '';
  if (isFinalizada && tarefa.notaAtraso) {
    notaHtml = `
      <div class="nota-atraso">
        <strong>Justificativa de Atraso:</strong> ${escaparHtml(tarefa.notaAtraso)}
      </div>
    `;
  }

  let acoesHtml = '';
  if (!isFinalizada) {
    acoesHtml = `
      <button class="btn-icon" title="Editar Tarefa" onclick="editarTarefa('${tarefa.id}')">✏️</button>
      <button class="btn-icon" title="Excluir Tarefa" onclick="excluirTarefa('${tarefa.id}')">🗑️</button>
      <button class="btn-icon" title="Finalizar Agora" onclick="tentarMoverParaStatus('${tarefa.id}', 'done')">✔️</button>
    `;
  } else {
    acoesHtml = `
      <button class="btn-icon" title="Excluir Histórico" onclick="excluirTarefa('${tarefa.id}')">🗑️</button>
    `;
  }

  card.innerHTML = `
    <div class="task-badges">
      ${categoriaHtml}
      ${alertaHtml}
    </div>
    <h4 class="task-card-title">${escaparHtml(tarefa.titulo)}</h4>
    ${tarefa.descricao ? `<p class="task-card-desc">${escaparHtml(tarefa.descricao)}</p>` : ''}
    <div class="task-card-footer">
      <span class="task-date">📅 ${formatarData(tarefa.prazo)}</span>
      <div class="task-actions">
        ${acoesHtml}
      </div>
    </div>
    ${notaHtml}
  `;

  if (!isFinalizada) {
    card.addEventListener('dragstart', handleDragStart);
    card.addEventListener('dragend', handleDragEnd);
  }

  return card;
}

function configurarDropZone(colunaBody, statusDestino) {
  colunaBody.addEventListener('dragover', (e) => {
    e.preventDefault();
    colunaBody.classList.add('drag-over');
  });

  colunaBody.addEventListener('dragleave', () => {
    colunaBody.classList.remove('drag-over');
  });

  colunaBody.addEventListener('drop', (e) => {
    e.preventDefault();
    colunaBody.classList.remove('drag-over');

    if (idTarefaArrastada) {
      tentarMoverParaStatus(idTarefaArrastada, statusDestino);
    }
  });
}

function handleDragStart(e) {
  idTarefaArrastada = this.dataset.id;
  this.classList.add('dragging');
  e.dataTransfer.effectAllowed = 'move';
}

function handleDragEnd() {
  this.classList.remove('dragging');
  idTarefaArrastada = null;
}

// ====================================================================
// TRANSIÇÃO DE STATUS E REGRAS DE PRAZO
// ====================================================================

function tentarMoverParaStatus(id, novoStatus) {
  const tarefa = tarefas.find(t => t.id === id);
  if (!tarefa) return;

  // RESTRIÇÃO 1: Tarefas concluídas não podem mudar de status
  if (tarefa.status === 'done') {
    alert('Esta tarefa já foi concluída e não pode ter seu status alterado.');
    return;
  }

  if (tarefa.status === novoStatus) return;

  if (novoStatus === 'done') {
    const vencida = estaVencida(tarefa);

    // RESTRIÇÃO 2: Tarefas vencidas exigem nota obrigatória para finalizar
    if (vencida) {
      abrirModalJustificativa(tarefa.id);
      return;
    }

    // Finalização no prazo
    tarefa.status = 'done';
    tarefa.concluidaEm = new Date().toISOString();
  } else {
    tarefa.status = novoStatus;
  }

  persistirTarefas();
  renderizarQuadroCompleto();
}

function abrirModalJustificativa(idTarefa) {
  document.getElementById('justificativa-tarefa-id').value = idTarefa;
  document.getElementById('texto-justificativa').value = '';
  modalJustificativa.classList.add('active');
}

function confirmarFinalizacaoVencida() {
  const id = document.getElementById('justificativa-tarefa-id').value;
  const texto = document.getElementById('texto-justificativa').value.trim();

  if (!texto) {
    alert('A nota de justificativa é obrigatória para finalizar tarefas vencidas!');
    return;
  }

  const tarefa = tarefas.find(t => t.id === id);
  if (tarefa) {
    tarefa.status = 'done';
    tarefa.concluidaEm = new Date().toISOString();
    tarefa.notaAtraso = texto;

    persistirTarefas();
    renderizarQuadroCompleto();
    fecharModal(modalJustificativa);
  }
}

// ====================================================================
// CRUD DE TAREFAS
// ====================================================================

function abrirModalTarefa(tarefaParaEditar = null) {
  const tituloModal = document.getElementById('modal-titulo');

  if (tarefaParaEditar) {
    tituloModal.textContent = 'Editar Tarefa';
    document.getElementById('tarefa-id').value = tarefaParaEditar.id;
    document.getElementById('tarefa-nome').value = tarefaParaEditar.titulo;
    document.getElementById('tarefa-categoria').value = tarefaParaEditar.categoria || '';
    document.getElementById('tarefa-descricao').value = tarefaParaEditar.descricao || '';
    document.getElementById('tarefa-prazo').value = tarefaParaEditar.prazo;
  } else {
    tituloModal.textContent = 'Nova Tarefa';
    formTarefa.reset();
    document.getElementById('tarefa-id').value = '';

    const dataPadrao = new Date(Date.now() + 3 * 60 * 60 * 1000);
    dataPadrao.setMinutes(dataPadrao.getMinutes() - dataPadrao.getTimezoneOffset());
    document.getElementById('tarefa-prazo').value = dataPadrao.toISOString().slice(0, 16);
  }

  modalTarefa.classList.add('active');
}

function fecharModal(modalElement) {
  modalElement.classList.remove('active');
}

function salvarTarefa() {
  const id = document.getElementById('tarefa-id').value;
  const titulo = document.getElementById('tarefa-nome').value.trim();
  const categoria = document.getElementById('tarefa-categoria').value.trim() || 'Geral';
  const descricao = document.getElementById('tarefa-descricao').value.trim();
  const prazo = document.getElementById('tarefa-prazo').value;

  if (!titulo || !prazo) {
    alert('Por favor, preencha o título e o prazo.');
    return;
  }

  if (id) {
    const tarefa = tarefas.find(t => t.id === id);
    if (tarefa) {
      tarefa.titulo = titulo;
      tarefa.categoria = categoria;
      tarefa.descricao = descricao;
      tarefa.prazo = prazo;
    }
  } else {
    const novaTarefa = {
      id: Date.now().toString(),
      titulo,
      categoria,
      descricao,
      prazo,
      status: 'todo',
      criadaEm: new Date().toISOString()
    };
    tarefas.push(novaTarefa);
  }

  persistirTarefas();
  renderizarQuadroCompleto();
  fecharModal(modalTarefa);
}

function editarTarefa(id) {
  const tarefa = tarefas.find(t => t.id === id);
  if (!tarefa) return;

  if (tarefa.status === 'done') {
    alert('Tarefas finalizadas não podem ser editadas.');
    return;
  }

  abrirModalTarefa(tarefa);
}

function excluirTarefa(id) {
  if (confirm('Deseja realmente excluir esta tarefa?')) {
    tarefas = tarefas.filter(t => t.id !== id);
    persistirTarefas();
    renderizarQuadroCompleto();
  }
}

// ====================================================================
// FUNÇÕES UTILITÁRIAS
// ====================================================================

function estaVencida(tarefa) {
  if (!tarefa.prazo) return false;
  return new Date().getTime() > new Date(tarefa.prazo).getTime();
}

function formatarData(dataIso) {
  if (!dataIso) return '';
  const data = new Date(dataIso);
  return data.toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

function escaparHtml(texto) {
  if (!texto) return '';
  const div = document.createElement('div');
  div.textContent = texto;
  return div.innerHTML;
}
