/**
 * ====================================================================
 * DASHBOARD KANBAN PRO - MÉTRICAS E GRÁFICOS
 * ====================================================================
 * Processa as tarefas salvas no LocalStorage para gerar os indicadores (KPIs)
 * e o gráfico de distribuição por categorias com gradientes premium.
 */

const STORAGE_KEY_TAREFAS = 'kanban_tarefas_v1';

// Paleta de gradientes modernos para as barras do gráfico
const GRADIENTES_GRAFICO = [
  'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)', // Indigo / Roxo
  'linear-gradient(135deg, #059669 0%, #10b981 100%)', // Esmeralda
  'linear-gradient(135deg, #d97706 0%, #f59e0b 100%)', // Âmbar
  'linear-gradient(135deg, #0284c7 0%, #06b6d4 100%)', // Ciano
  'linear-gradient(135deg, #db2777 0%, #f43f5e 100%)', // Rosa
  'linear-gradient(135deg, #7c3aed 0%, #a855f7 100%)', // Violeta
  'linear-gradient(135deg, #475569 0%, #64748b 100%)'  // Slate
];

document.addEventListener('DOMContentLoaded', () => {
  const tarefas = carregarTarefas();
  calcularIndicadores(tarefas);
  renderizarGraficoCategorias(tarefas);
});

/**
 * Lê as tarefas armazenadas no LocalStorage
 * @returns {Array} Lista de tarefas
 */
function carregarTarefas() {
  const dados = localStorage.getItem(STORAGE_KEY_TAREFAS);
  return dados ? JSON.parse(dados) : [];
}

/**
 * Calcula e atualiza os 4 indicadores do topo
 * @param {Array} tarefas 
 */
function calcularIndicadores(tarefas) {
  // 1. Tarefas Pendentes (coluna 'todo')
  const totalPendentes = tarefas.filter(t => t.status === 'todo').length;

  // 2. Tarefas em Execução (todas as colunas ativas que não são 'todo' nem 'done')
  const totalExecucao = tarefas.filter(t => t.status !== 'todo' && t.status !== 'done').length;

  // 3. Tarefas Concluídas (coluna 'done')
  const totalConcluidas = tarefas.filter(t => t.status === 'done').length;

  // 4. Concluídas Fora do Prazo (status 'done' que possuem justificativa registrada ou prazo estourado)
  const totalAtrasadas = tarefas.filter(t => {
    if (t.status !== 'done') return false;
    if (t.notaAtraso) return true;
    if (t.concluidaEm && t.prazo) {
      return new Date(t.concluidaEm).getTime() > new Date(t.prazo).getTime();
    }
    return false;
  }).length;

  // Atualização dos números na tela
  document.getElementById('kpi-pendentes').textContent = totalPendentes;
  document.getElementById('kpi-execucao').textContent = totalExecucao;
  document.getElementById('kpi-concluidas').textContent = totalConcluidas;
  document.getElementById('kpi-atrasadas').textContent = totalAtrasadas;
}

/**
 * Gera o gráfico de barras com a quantidade e percentual por categoria
 * @param {Array} tarefas 
 */
function renderizarGraficoCategorias(tarefas) {
  const container = document.getElementById('chart-container');
  container.innerHTML = '';

  if (tarefas.length === 0) {
    container.innerHTML = `
      <div class="empty-chart-message">
        Nenhuma tarefa cadastrada no momento. Crie tarefas no 
        <a href="index.html" style="color: var(--primary-color); font-weight: 700; text-decoration: none;">Quadro</a> 
        para acompanhar o desempenho em tempo real.
      </div>
    `;
    return;
  }

  // Agrupamento por categoria
  const contagemCategorias = {};
  tarefas.forEach(t => {
    const cat = (t.categoria && t.categoria.trim()) ? t.categoria.trim() : 'Geral';
    contagemCategorias[cat] = (contagemCategorias[cat] || 0) + 1;
  });

  const totalTarefas = tarefas.length;
  const listaCategorias = Object.entries(contagemCategorias);

  // Ordena da categoria com mais tarefas para a que tem menos
  listaCategorias.sort((a, b) => b[1] - a[1]);

  listaCategorias.forEach(([categoria, qtd], index) => {
    const percentual = Math.round((qtd / totalTarefas) * 100);
    const gradiente = GRADIENTES_GRAFICO[index % GRADIENTES_GRAFICO.length];

    const barItem = document.createElement('div');
    barItem.classList.add('chart-bar-item');

    barItem.innerHTML = `
      <div class="chart-bar-info">
        <span>🏷️ ${escaparHtml(categoria)}</span>
        <span>${qtd} tarefa${qtd > 1 ? 's' : ''} (${percentual}%)</span>
      </div>
      <div class="chart-bar-track">
        <div class="chart-bar-fill" style="width: ${percentual}%; background: ${gradiente};">
          ${qtd}
        </div>
      </div>
    `;

    container.appendChild(barItem);
  });
}

/**
 * Utilitário para evitar injeção de HTML no DOM
 */
function escaparHtml(texto) {
  if (!texto) return '';
  const div = document.createElement('div');
  div.textContent = texto;
  return div.innerHTML;
}
