// Previne o zoom no iOS
document.addEventListener('touchstart', function(event) {
  if (event.touches.length > 1) {
    event.preventDefault();
  }
});

let filaGeral = [];
let filaEstrela = [];
let estrelasRegistradas = [];
let timeA = [];
let timeB = [];
let vitoriasA = 0; // Vitórias consecutivas do time A
let vitoriasB = 0; // Vitórias consecutivas do time B
let placarA = 0;
let placarB = 0;
let jogadoresStats = {}; // { "NomeDoJogador": { pontos: 0, vitorias: 0, derrotas: 0 } }
let jogadoresTravados = {}; // { "NomeDoJogador": true/false }

let pontosVitoria = parseInt(localStorage.getItem('pontosVitoria')) || 12;
let tipoDesempate = localStorage.getItem('tipoDesempate') || 'adicional';
let estrelasPorTime = parseInt(localStorage.getItem('estrelasPorTime')) || 1; // Nova variável de configuração
let jogadoresPorTime = parseInt(localStorage.getItem('jogadoresPorTime')) || 4; // Nova variável de configuração

// O histórico de partidas não será persistido entre recarregamentos
let historicoPartidas = [];

// Função para carregar as configurações iniciais
function carregarDadosIniciais() {
    pontosVitoria = parseInt(localStorage.getItem('pontosVitoria')) || 12;
    tipoDesempate = localStorage.getItem('tipoDesempate') || 'adicional';
    estrelasPorTime = parseInt(localStorage.getItem('estrelasPorTime')) || 1;
    jogadoresPorTime = parseInt(localStorage.getItem('jogadoresPorTime')) || 4;
}

// Função para salvar as configurações
function salvarConfiguracoes() {
    const novosPontosVitoria = parseInt(document.getElementById('pontosPartida').value);
    const novoTipoDesempate = document.getElementById('tipoDesempate').value;
    const novasEstrelasPorTime = parseInt(document.getElementById('estrelasPorTime').value);
    const novosJogadoresPorTime = parseInt(document.getElementById('jogadoresPorTime').value);

    // Validação das novas configurações
    if (novosPontosVitoria > 0 && novasEstrelasPorTime >= 0 && novosJogadoresPorTime >= 2 && novosJogadoresPorTime <= 6) {
        // Verifica se o número de estrelas excede o total de jogadores por time
        if (novasEstrelasPorTime > novosJogadoresPorTime) {
            alert("O número de estrelas por time não pode ser maior que o total de jogadores por time.");
            return;
        }

        pontosVitoria = novosPontosVitoria;
        tipoDesempate = novoTipoDesempate;
        estrelasPorTime = novasEstrelasPorTime;
        jogadoresPorTime = novosJogadoresPorTime;

        localStorage.setItem('pontosVitoria', pontosVitoria);
        localStorage.setItem('tipoDesempate', tipoDesempate);
        localStorage.setItem('estrelasPorTime', estrelasPorTime);
        localStorage.setItem('jogadoresPorTime', jogadoresPorTime);

        fecharConfiguracoes();
        atualizarTela();
    } else {
        alert("Por favor, insira valores válidos para as configurações:\n- Pontos para vencer: maior que 0\n- Estrelas por time: maior ou igual a 0\n- Jogadores por time: entre 2 e 6.");
    }
}

function abrirConfiguracoes() {
    document.getElementById('pontosPartida').value = pontosVitoria;
    document.getElementById('tipoDesempate').value = tipoDesempate;
    document.getElementById('estrelasPorTime').value = estrelasPorTime; // Preenche o campo
    document.getElementById('jogadoresPorTime').value = jogadoresPorTime; // Preenche o campo
    document.getElementById('modalConfig').classList.remove('hidden'); // Usa classes Tailwind
}

function fecharConfiguracoes() {
    document.getElementById('modalConfig').classList.add('hidden'); // Usa classes Tailwind
}

// Função auxiliar para embaralhar um array
function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
}

function iniciarNovoJogo() {
    timeA = [];
    timeB = [];
    vitoriasA = 0;
    vitoriasB = 0;
    placarA = 0;
    placarB = 0;
    jogadoresStats = {}; // Reinicia o ranking de jogadores
    jogadoresTravados = {}; // Reinicia o estado dos cadeados

    // Reinicia as filas com os jogadores iniciais
    filaGeral = ["Jogador 1", "Jogador 2", "Jogador 3", "Jogador 4", "Jogador 5", "Jogador 6"];
    filaEstrela = ["Jogador A", "Jogador B"];
    estrelasRegistradas = [...filaEstrela]; // Popula as estrelas registradas a partir da fila estrela inicial

    // Garante que os jogadores iniciais estejam no jogadoresStats e destravados
    [...filaGeral, ...filaEstrela].forEach(nome => {
        if (!jogadoresStats[nome]) {
            jogadoresStats[nome] = { pontos: 0, vitorias: 0, derrotas: 0 };
        }
        jogadoresTravados[nome] = false;
    });

    // Filtra jogadores travados antes de formar os times
    const filaGeralDisponivel = filaGeral.filter(j => !jogadoresTravados[j]);
    const filaEstrelaDisponivel = filaEstrela.filter(j => !jogadoresTravados[j]);

    const jogadoresGeraisPorTime = jogadoresPorTime - estrelasPorTime;

    // Verifica se há jogadores suficientes para formar os times com as configurações atuais
    if (filaEstrelaDisponivel.length < (estrelasPorTime * 2) || filaGeralDisponivel.length < (jogadoresGeraisPorTime * 2)) {
        alert(`É necessário ter pelo menos ${estrelasPorTime * 2} jogadores estrela e ${jogadoresGeraisPorTime * 2} jogadores na fila geral disponíveis (não travados) para iniciar um jogo com ${jogadoresPorTime} jogadores por time.`);
        // Se não houver jogadores suficientes, não forma os times e apenas atualiza a tela
        atualizarTela();
        return;
    }

    // Forma os times com jogadores das filas disponíveis
    for (let i = 0; i < estrelasPorTime; i++) {
        timeA.push(filaEstrelaDisponivel.shift());
        timeB.push(filaEstrelaDisponivel.shift());
    }

    for (let i = 0; i < jogadoresGeraisPorTime; i++) {
        timeA.push(filaGeralDisponivel.shift());
        timeB.push(filaGeralDisponivel.shift());
    }

    // Remove os jogadores selecionados das filas originais
    filaGeral = filaGeral.filter(j => !timeA.includes(j) && !timeB.includes(j));
    filaEstrela = filaEstrela.filter(j => !timeA.includes(j) && !timeB.includes(j));

    atualizarTela();
}

function trocarJogador(time, indexQuadra, tipoFilaOrigem, indexFilaString) {
    const indexFila = parseInt(indexFilaString);

    if (isNaN(indexFila) || indexFila < 0) {
        console.log("Seleção inválida de jogador para troca.");
        return;
    }

    let jogadorParaEntrar;
    let filaOrigemArray;

    if (tipoFilaOrigem === 'geral') {
        filaOrigemArray = filaGeral;
    } else if (tipoFilaOrigem === 'estrela') {
        filaOrigemArray = filaEstrela;
    } else {
        console.error("Tipo de fila de origem desconhecido:", tipoFilaOrigem);
        return;
    }

    if (indexFila >= filaOrigemArray.length) {
        console.error("Índice de jogador para entrar fora dos limites da fila:", indexFila, filaOrigemArray);
        return;
    }

    jogadorParaEntrar = filaOrigemArray[indexFila];

    // Impedir troca se o jogador que vai entrar estiver travado
    if (jogadoresTravados[jogadorParaEntrar]) {
        alert("Este jogador está travado e não pode entrar em quadra.");
        atualizarTela(); // Para resetar o select
        return;
    }

    let jogadorParaSair;

    const isEstrelaSaindo = estrelasRegistradas.includes(time === 'A' ? timeA[indexQuadra] : timeB[indexQuadra]);
    const isEstrelaEntrando = estrelasRegistradas.includes(jogadorParaEntrar);

    // Lógica de validação para manter o número correto de estrelas por time
    if (isEstrelaSaindo && !isEstrelaEntrando) { // Uma estrela está saindo e um jogador geral está entrando
        let estrelasNoTimeAtual = (time === 'A' ? timeA : timeB).filter(j => estrelasRegistradas.includes(j)).length;
        if (estrelasNoTimeAtual - 1 < estrelasPorTime) { // Se remover a estrela, o número de estrelas será menor que o configurado
            alert(`Não é permitido trocar uma estrela por um jogador comum se isso resultar em menos de ${estrelasPorTime} estrela(s) no time. A troca deve ser entre estrelas ou um jogador geral entrando para substituir um jogador geral.`);
            atualizarTela(); // Para resetar o select
            return;
        }
    } else if (!isEstrelaSaindo && isEstrelaEntrando) { // Um jogador geral está saindo e uma estrela está entrando
        let estrelasNoTimeAtual = (time === 'A' ? timeA : timeB).filter(j => estrelasRegistradas.includes(j)).length;
        if (estrelasNoTimeAtual + 1 > estrelasPorTime) { // Se adicionar a estrela, o número de estrelas será maior que o configurado
            alert(`Não é permitido adicionar mais de ${estrelasPorTime} estrela(s) por time.`);
            atualizarTela(); // Para resetar o select
            return;
        }
    }


    if (time === 'A') {
        jogadorParaSair = timeA[indexQuadra];
        timeA[indexQuadra] = jogadorParaEntrar;
    } else {
        jogadorParaSair = timeB[indexQuadra];
        timeB[indexQuadra] = jogadorParaEntrar;
    }

    filaOrigemArray.splice(indexFila, 1);

    if (estrelasRegistradas.includes(jogadorParaSair)) {
        filaEstrela.push(jogadorParaSair);
    } else {
        filaGeral.push(jogadorParaSair);
    }

    atualizarTela();
}

function verificarVitoriaPartida() {
    const minPontos = pontosVitoria;

    // Se o tipo de desempate for 'saiOsDois' e ambos os times estão em (minPontos - 1),
    // a partida termina com 'ambosSaem' imediatamente.
    if (tipoDesempate === 'saiOsDois' && placarA === (minPontos - 1) && placarB === (minPontos - 1)) {
        return 'ambosSaem'; //
    }

    // As verificações para "diferença de 2 pontos" e "vai a 3 direto"
    // só devem ocorrer se a condição de "ambos saem" não foi atendida.
    if (placarA >= minPontos - 1 && placarB >= minPontos - 1) {
        if (tipoDesempate === 'diferenca') {
            const diferencaMinima = 2;
            if (placarA >= placarB + diferencaMinima) return 'A';
            if (placarB >= placarA + diferencaMinima) return 'B';
        } else if (tipoDesempate === 'adicional') {
            if (placarA >= minPontos + 2) return 'A';
            if (placarB >= minPontos + 2) return 'B';
        }
    }

    // Verificação padrão de vitória se nenhum dos desempates se aplica ainda
    if (placarA >= minPontos) return 'A';
    if (placarB >= minPontos) return 'B';

    return null;
}

function marcarPonto(time, jogador) {
    if (!jogadoresStats[jogador]) {
        jogadoresStats[jogador] = { pontos: 0, vitorias: 0, derrotas: 0 };
    }
    jogadoresStats[jogador].pontos++;

    if (time === 'A') placarA++;
    else placarB++;

    const vencedor = verificarVitoriaPartida();
    if (vencedor) {
        registrarVitoria(vencedor);
    }
    atualizarTela();
}

function registrarVitoria(vencedor) {
    // Atualiza as vitórias e derrotas dos jogadores no ranking geral
    if (vencedor === 'A') {
        vitoriasA++;
        vitoriasB = 0;
        timeA.forEach(jogador => {
            if (!jogadoresStats[jogador]) jogadoresStats[jogador] = { pontos: 0, vitorias: 0, derrotas: 0 };
            jogadoresStats[jogador].vitorias++;
        });
        timeB.forEach(jogador => {
            if (!jogadoresStats[jogador]) jogadoresStats[jogador] = { pontos: 0, vitorias: 0, derrotas: 0 };
            jogadoresStats[jogador].derrotas++;
        });
    } else if (vencedor === 'B') {
        vitoriasB++;
        vitoriasA = 0;
        timeB.forEach(jogador => {
            if (!jogadoresStats[jogador]) jogadoresStats[jogador] = { pontos: 0, vitorias: 0, derrotas: 0 };
            jogadoresStats[jogador].vitorias++;
        });
        timeA.forEach(jogador => {
            if (!jogadoresStats[jogador]) jogadoresStats[jogador] = { pontos: 0, vitorias: 0, derrotas: 0 };
            jogadoresStats[jogador].derrotas++;
        });
    } else if (vencedor === 'ambosSaem') {
        [...timeA, ...timeB].forEach(jogador => {
            if (!jogadoresStats[jogador]) jogadoresStats[jogador] = { pontos: 0, vitorias: 0, derrotas: 0 };
            jogadoresStats[jogador].derrotas++;
        });
    }

    // Adiciona a partida ao histórico antes de resetar os placares
    historicoPartidas.unshift({ // unshift para adicionar no início (mais recente primeiro)
        timeA: [...timeA], // Copia os jogadores do time A
        timeB: [...timeB], // Copia os jogadores do time B
        placarFinalA: placarA,
        placarFinalB: placarB,
        vencedor: vencedor === 'ambosSaem' ? 'Empate/Ambos Saíram' : `Time ${vencedor}`,
        data: new Date().toLocaleString('pt-BR')
    });

    // Lógica de rotação de jogadores e reset de placar
    let jogadoresParaFila = [];
    if (vencedor === 'ambosSaem' || vitoriasA >= 3 || vitoriasB >= 3) {
        jogadoresParaFila = [...timeA, ...timeB];
        timeA = [];
        timeB = [];
        vitoriasA = 0;
        vitoriasB = 0;
    } else if (vencedor === 'A') {
        jogadoresParaFila = [...timeB];
        timeB = [];
    } else if (vencedor === 'B') {
        jogadoresParaFila = [...timeA];
        timeA = [];
    }

    shuffleArray(jogadoresParaFila);
    jogadoresParaFila.forEach(j => {
        // Só adiciona na fila se o jogador não estiver travado
        if (!jogadoresTravados[j]) {
            if (estrelasRegistradas.includes(j)) {
                filaEstrela.push(j);
            } else {
                filaGeral.push(j);
            }
        }
        // Se o jogador estiver travado, ele permanece fora das filas ativas e não retorna para a seleção automática
        // Ele só voltará para a fila se for destravado manualmente.
    });

    // Filtra jogadores travados para formação de novos times
    const filaGeralDisponivel = filaGeral.filter(j => !jogadoresTravados[j]);
    const filaEstrelaDisponivel = filaEstrela.filter(j => !jogadoresTravados[j]);

    const jogadoresGeraisPorTime = jogadoresPorTime - estrelasPorTime;

    // Forma novos times
    if (timeA.length === 0 && timeB.length === 0) { // Ambos saíram ou ciclo de 3 vitórias
        if (filaEstrelaDisponivel.length >= (estrelasPorTime * 2) && filaGeralDisponivel.length >= (jogadoresGeraisPorTime * 2)) {
            for (let i = 0; i < estrelasPorTime; i++) {
                timeA.push(filaEstrelaDisponivel.shift());
                timeB.push(filaEstrelaDisponivel.shift());
            }
            for (let i = 0; i < jogadoresGeraisPorTime; i++) {
                timeA.push(filaGeralDisponivel.shift());
                timeB.push(filaGeralDisponivel.shift());
            }
        } else {
            alert("Não há jogadores suficientes disponíveis nas filas para formar novos times. Adicione mais jogadores nas filas.");
        }
    } else if (timeB.length === 0) { // Time B saiu
        if (filaEstrelaDisponivel.length >= estrelasPorTime && filaGeralDisponivel.length >= jogadoresGeraisPorTime) {
            for (let i = 0; i < estrelasPorTime; i++) {
                timeB.push(filaEstrelaDisponivel.shift());
            }
            for (let i = 0; i < jogadoresGeraisPorTime; i++) {
                timeB.push(filaGeralDisponivel.shift());
            }
        } else {
            alert("Não há jogadores suficientes disponíveis nas filas para formar o Time B. Adicione mais jogadores nas filas.");
        }
    } else if (timeA.length === 0) { // Time A saiu
        if (filaEstrelaDisponivel.length >= estrelasPorTime && filaGeralDisponivel.length >= jogadoresGeraisPorTime) {
            for (let i = 0; i < estrelasPorTime; i++) {
                timeA.push(filaEstrelaDisponivel.shift());
            }
            for (let i = 0; i < jogadoresGeraisPorTime; i++) {
                timeA.push(filaGeralDisponivel.shift());
            }
        } else {
            alert("Não há jogadores suficientes disponíveis nas filas para formar o Time A. Adicione mais jogadores nas filas.");
        }
    }

    // Atualiza as filas originais após a formação dos times
    // Apenas remove os jogadores que foram para os times. Jogadores travados continuam fora das filas.
    filaGeral = filaGeral.filter(j => !timeA.includes(j) && !timeB.includes(j));
    filaEstrela = filaEstrela.filter(j => !timeA.includes(j) && !timeB.includes(j));

    placarA = 0;
    placarB = 0;
    atualizarTela();
}


function resetarPlacar() {
  placarA = 0;
  placarB = 0;
  vitoriasA = 0; // Zera vitórias da partida
  vitoriasB = 0; // Zera vitórias da partida
  // Não afeta o ranking de jogadores
  atualizarTela();
}

function adicionarParticipante(tipoFila) {
  let nomeInput;
  let filaAlvo;
  let posicaoSelect;

  if (tipoFila === 'geral') {
    nomeInput = document.getElementById("novoNomeGeral");
    filaAlvo = filaGeral;
    posicaoSelect = document.getElementById("posicaoGeral");
  } else if (tipoFila === 'estrela') {
    nomeInput = document.getElementById("novoNomeEstrela");
    filaAlvo = filaEstrela;
    posicaoSelect = document.getElementById("posicaoEstrela");
  } else {
    return;
  }

  const nome = nomeInput.value.trim();
  const posicao = posicaoSelect.value;

  if (nome) {
    if (posicao === 'inicio') {
        filaAlvo.unshift(nome);
    } else {
        filaAlvo.push(nome);
    }

    if (tipoFila === 'estrela' && !estrelasRegistradas.includes(nome)) {
        estrelasRegistradas.push(nome);
    }

    if (!jogadoresStats[nome]) {
        jogadoresStats[nome] = { pontos: 0, vitorias: 0, derrotas: 0 };
    }
    jogadoresTravados[nome] = false; // Adiciona como destravado por padrão

    nomeInput.value = "";
    atualizarTela();
  }
}

function removerParticipante(tipoFila, index) {
    let filaAlvo;
    if (tipoFila === 'geral') {
        filaAlvo = filaGeral;
    } else if (tipoFila === 'estrela') {
        filaAlvo = filaEstrela;
    } else {
        return;
    }

    const nomeRemovido = filaAlvo.splice(index, 1)[0];
    // Remove do estado de travamento
    delete jogadoresTravados[nomeRemovido];
    // As estatísticas do jogador são mantidas no ranking mesmo que ele saia da fila
    atualizarTela();
}


function editarParticipante(tipoFila, index, novoNome) {
  // Cria uma entrada para o novo nome se não existir
  if (!jogadoresStats[novoNome]) {
    jogadoresStats[novoNome] = { pontos: 0, vitorias: 0, derrotas: 0 };
  }
  if (jogadoresTravados[novoNome] === undefined) { // Adiciona se não existir
    jogadoresTravados[novoNome] = false;
  }

  if (tipoFila === 'geral') {
    const nomeAntigo = filaGeral[index];
    // Transfere as estatísticas se o nome antigo tinha alguma
    if (jogadoresStats[nomeAntigo] && nomeAntigo !== novoNome) {
        jogadoresStats[novoNome].pontos += jogadoresStats[nomeAntigo].pontos;
        jogadoresStats[novoNome].vitorias += jogadoresStats[nomeAntigo].vitorias;
        jogadoresStats[novoNome].derrotas += jogadoresStats[nomeAntigo].derrotas;
        delete jogadoresStats[nomeAntigo]; // Remove a entrada antiga
    }
    // Transfere o estado de travamento
    if (nomeAntigo !== novoNome) {
        jogadoresTravados[novoNome] = jogadoresTravados[nomeAntigo];
        delete jogadoresTravados[nomeAntigo];
    }
    filaGeral[index] = novoNome;
  } else if (tipoFila === 'estrela') {
    const nomeAntigo = filaEstrela[index];
    const estrelaIndex = estrelasRegistradas.indexOf(nomeAntigo);

    if (estrelaIndex > -1) {
        estrelasRegistradas[estrelaIndex] = novoNome;
    }

    // Transfere as estatísticas se o nome antigo tinha alguma
    if (jogadoresStats[nomeAntigo] && nomeAntigo !== novoNome) {
        jogadoresStats[novoNome].pontos += jogadoresStats[nomeAntigo].pontos;
        jogadoresStats[novoNome].vitorias += jogadoresStats[nomeAntigo].vitorias;
        jogadoresStats[novoNome].derrotas += jogadoresStats[nomeAntigo].derrotas;
        delete jogadoresStats[nomeAntigo]; // Remove a entrada antiga
    }
    // Transfere o estado de travamento
    if (nomeAntigo !== novoNome) {
        jogadoresTravados[novoNome] = jogadoresTravados[nomeAntigo];
        delete jogadoresTravados[nomeAntigo];
    }
    filaEstrela[index] = novoNome;
  }
  atualizarTela();
}

function embaralharFila(tipoFila) {
  if (tipoFila === 'geral') {
    shuffleArray(filaGeral);
  } else if (tipoFila === 'estrela') {
    shuffleArray(filaEstrela);
  }
  atualizarTela();
}

function atualizarRanking() {
    // Obter todos os nomes únicos de jogadores que fizeram algum ponto ou participaram de alguma partida
    const todosJogadores = new Set([...Object.keys(jogadoresStats), ...filaGeral, ...filaEstrela, ...timeA, ...timeB]);

    // Converter para array e filtrar para garantir que só jogadores com estatísticas válidas apareçam
    const rankingArray = Array.from(todosJogadores)
        .map(nome => {
            // Garante que todos os jogadores tenham uma entrada no jogadoresStats, mesmo que zerada
            if (!jogadoresStats[nome]) {
                jogadoresStats[nome] = { pontos: 0, vitorias: 0, derrotas: 0 };
            }
            return [nome, jogadoresStats[nome]];
        })
        // Filtra jogadores que não têm nenhuma atividade
        .filter(([nome, stats]) => stats.pontos > 0 || stats.vitorias > 0 || stats.derrotas > 0)
        .sort((a, b) => {
            // Ordena por pontos (maior primeiro), depois por vitórias (maior primeiro), depois por derrotas (menor primeiro)
            if (b[1].pontos !== a[1].pontos) {
                return b[1].pontos - a[1].pontos;
            }
            if (b[1].vitorias !== a[1].vitorias) {
                return b[1].vitorias - a[1].vitorias;
            }
            return a[1].derrotas - b[1].derrotas;
        });

    const rankingHTML = rankingArray.map((entry, index) => {
        const nome = entry[0];
        const stats = entry[1];
        return `
            <li class="flex items-center py-2 border-b border-gray-200 last:border-b-0">
                <span class="ranking-pos font-bold text-blue-600 w-8 text-center">${index + 1}º</span>
                <span class="ranking-nome flex-1 text-gray-700">${nome}</span>
                <span class="ranking-pontos font-bold text-green-600 w-16 text-right">${stats.pontos} pts</span>
                <span class="ranking-vitorias font-bold text-blue-600 w-16 text-right">${stats.vitorias} V</span>
                <span class="ranking-derrotas font-bold text-red-600 w-16 text-right">${stats.derrotas} D</span>
            </li>
        `;
    }).join('');

    document.getElementById("ranking").innerHTML = rankingHTML || '<li class="text-center text-gray-500 py-4">Nenhum ponto ou partida registrada ainda</li>';
}


function atualizarStatusPartida() {
  const statusEl = document.getElementById('statusPartida');
  const minPontos = pontosVitoria;

  let statusText = '';
  let displayStatus = false;

  // Lógica de status atualizada para "saiOsDois"
  if (tipoDesempate === 'saiOsDois' && placarA === (minPontos - 1) && placarB === (minPontos - 1)) {
      statusText = `🚨 ATENÇÃO: Ambos os times atingiram o ponto de partida (${minPontos -1} pontos). A partida será declarada "Empate/Ambos Saíram" se nenhum time conseguir vencer pelas regras de desempate.`;
      displayStatus = true;
  } else if (placarA >= minPontos - 1 && placarB >= minPontos - 1) {
    if (tipoDesempate === 'diferenca') {
      statusText = `⚡ DESEMPATE: É necessário abrir 2 pontos de diferença para vencer`;
    } else if (tipoDesempate === 'adicional') {
      statusText = `⚡ DESEMPATE: Vence quem alcançar ${pontosVitoria + 2} pontos`;
    }
    displayStatus = true;
  } else if (placarA >= minPontos -1 || placarB >= minPontos -1) {
      statusText = '🔥 Match point! ';
      if (placarA >= minPontos -1) {
          statusText += `${minPontos - placarA} ponto${minPontos - placarA !== 1 ? 's' : ''} para o Time A`;
      }
      if (placarA >= minPontos -1 && placarB >= minPontos -1) {
          statusText += ' ou ';
      }
      if (placarB >= minPontos -1) {
          statusText += `${minPontos - placarB} ponto${minPontos - placarB !== 1 ? 's' : ''} para o Time B`;
      }
      displayStatus = true;
  }

  statusEl.innerHTML = statusText;
  if (displayStatus) {
      statusEl.classList.remove('hidden');
  } else {
      statusEl.classList.add('hidden');
  }
}

// Função para alternar o estado do cadeado de um jogador
function toggleLock(nomeJogador) {
    jogadoresTravados[nomeJogador] = !jogadoresTravados[nomeJogador];
    atualizarTela();
}

function atualizarTela() {
  document.getElementById("timeA").innerHTML = timeA.map((j, i) => `
    <li class="flex items-center p-2 bg-white rounded-md shadow-sm border border-gray-200">
      <div class="flex items-center w-full">
        <button class="ponto px-3 py-1 bg-green-500 text-white font-bold rounded-md hover:bg-green-600 transition-colors mr-2 text-lg" onclick="marcarPonto('A', '${j.replace(/'/g, "\\'")}')" title="Marcar ponto">+</button>
        <div class="flex-1 relative">
          <span class="jogador-nome text-gray-700 font-medium">${j} ${estrelasRegistradas.includes(j) ? '⭐' : ''}</span>
          <select onchange="if(this.value != -1) trocarJogador('A', ${i}, this.options[this.selectedIndex].dataset.fila, this.value);" class="absolute inset-0 opacity-0 cursor-pointer w-full h-full">
            <option value="-1">Trocar com...</option>
            <optgroup label="Fila 1">
              ${filaGeral.filter(f => !jogadoresTravados[f]).map((f, idx) => `<option value="${filaGeral.indexOf(f)}" data-fila="geral">${f}</option>`).join("")}
            </optgroup>
            <optgroup label="Fila 2">
              ${filaEstrela.filter(f => !jogadoresTravados[f]).map((f, idx) => `<option value="${filaEstrela.indexOf(f)}" data-fila="estrela">${f} ⭐</option>`).join("")}
            </optgroup>
          </select>
        </div>
        <span class="ml-auto text-gray-400 text-sm">▼</span>
      </div>
    </li>`).join("");

  document.getElementById("timeB").innerHTML = timeB.map((j, i) => `
    <li class="flex items-center p-2 bg-white rounded-md shadow-sm border border-gray-200">
      <div class="flex items-center w-full">
        <button class="ponto px-3 py-1 bg-green-500 text-white font-bold rounded-md hover:bg-green-600 transition-colors mr-2 text-lg" onclick="marcarPonto('B', '${j.replace(/'/g, "\\'")}')" title="Marcar ponto">+</button>
        <div class="flex-1 relative">
          <span class="jogador-nome text-gray-700 font-medium">${j} ${estrelasRegistradas.includes(j) ? '⭐' : ''}</span>
          <select onchange="if(this.value != -1) trocarJogador('B', ${i}, this.options[this.selectedIndex].dataset.fila, this.value);" class="absolute inset-0 opacity-0 cursor-pointer w-full h-full">
            <option value="-1">Trocar com...</option>
            <optgroup label="Fila 1">
              ${filaGeral.filter(f => !jogadoresTravados[f]).map((f, idx) => `<option value="${filaGeral.indexOf(f)}" data-fila="geral">${f}</option>`).join("")}
            </optgroup>
            <optgroup label="Fila 2">
              ${filaEstrela.filter(f => !jogadoresTravados[f]).map((f, idx) => `<option value="${filaEstrela.indexOf(f)}" data-fila="estrela">${f} ⭐</option>`).join("")}
            </optgroup>
          </select>
        </div>
        <span class="ml-auto text-gray-400 text-sm">▼</span>
      </div>
    </li>`).join("");

  document.getElementById("filaGeral").innerHTML = filaGeral.map((j, i) => `
    <li class="flex items-center p-3 bg-white rounded-lg shadow-sm border border-gray-200 ${jogadoresTravados[j] ? 'locked bg-gray-50' : ''}">
      <span class="drag-handle text-gray-400 mr-2">☰</span>
      <span class="w-8 text-center text-gray-600">${i + 1}.</span>
      <input type="text" value="${j}" onchange="editarParticipante('geral', ${i}, this.value)" ${jogadoresTravados[j] ? 'disabled' : ''} class="flex-1 p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 mr-2 ${jogadoresTravados[j] ? 'bg-gray-200' : ''}"/>
      <span class="lock-icon text-lg ${jogadoresTravados[j] ? 'text-red-500' : 'text-green-500'}" onclick="toggleLock('${j.replace(/'/g, "\\'")}')">
        ${jogadoresTravados[j] ? '<i class="fas fa-lock"></i>' : '<i class="fas fa-lock-open"></i>'}
      </span>
      <button onclick="removerParticipante('geral', ${i})" class="ml-2 px-3 py-1 bg-red-500 text-white font-semibold rounded-md hover:bg-red-600 transition-colors">X</button>
    </li>
  `).join("");

  document.getElementById("filaEstrela").innerHTML = filaEstrela.map((j, i) => `
    <li class="flex items-center p-3 bg-white rounded-lg shadow-sm border border-gray-200 ${jogadoresTravados[j] ? 'locked bg-gray-50' : ''}">
      <span class="drag-handle text-gray-400 mr-2">☰</span>
      <span class="w-8 text-center text-gray-600">${i + 1}.</span>
      <input type="text" value="${j}" onchange="editarParticipante('estrela', ${i}, this.value)" ${jogadoresTravados[j] ? 'disabled' : ''} class="flex-1 p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 mr-2 ${jogadoresTravados[j] ? 'bg-gray-200' : ''}"/>
      <span class="lock-icon text-lg ${jogadoresTravados[j] ? 'text-red-500' : 'text-green-500'}" onclick="toggleLock('${j.replace(/'/g, "\\'")}')">
        ${jogadoresTravados[j] ? '<i class="fas fa-lock"></i>' : '<i class="fas fa-lock-open"></i>'}
      </span>
      <button onclick="removerParticipante('estrela', ${i})" class="ml-2 px-3 py-1 bg-red-500 text-white font-semibold rounded-md hover:bg-red-600 transition-colors">X</button>
    </li>
  `).join("");

  document.getElementById("vitoriasA").innerText = vitoriasA;
  document.getElementById("vitoriasB").innerText = vitoriasB;
  document.getElementById("placarA").innerText = placarA;
  document.getElementById("placarB").innerText = placarB;

  atualizarRanking();
  atualizarStatusPartida();
  setupSortableLists(); // Call this to make the lists sortable after updating the DOM
}

// New function to setup Sortable.js for the queues
function setupSortableLists() {
    const filaGeralUl = document.getElementById('filaGeral');
    if (filaGeralUl.sortableInstance) { // Destroy existing instance if it exists
        filaGeralUl.sortableInstance.destroy();
    }
    filaGeralUl.sortableInstance = new Sortable(filaGeralUl, {
        animation: 150,
        handle: '.drag-handle', // Only drag by the handle
        filter: '.locked', // Prevent dragging locked items
        onMove: function (evt) {
            // Prevent dropping on a locked item or moving a locked item
            return !evt.related.classList.contains('locked') && !evt.dragged.classList.contains('locked');
        },
        onEnd: function (evt) {
            // Ensure the item was not locked before moving
            if (!evt.item.classList.contains('locked')) {
                const [movedItem] = filaGeral.splice(evt.oldIndex, 1);
                filaGeral.splice(evt.newIndex, 0, movedItem);
                atualizarTela(); // Re-render the lists to ensure consistency
            }
        }
    });

    const filaEstrelaUl = document.getElementById('filaEstrela');
    if (filaEstrelaUl.sortableInstance) { // Destroy existing instance if it exists
        filaEstrelaUl.sortableInstance.destroy();
    }
    filaEstrelaUl.sortableInstance = new Sortable(filaEstrelaUl, {
        animation: 150,
        handle: '.drag-handle', // Only drag by the handle
        filter: '.locked', // Prevent dragging locked items
        onMove: function (evt) {
            // Prevent dropping on a locked item or moving a locked item
            return !evt.related.classList.contains('locked') && !evt.dragged.classList.contains('locked');
        },
        onEnd: function (evt) {
            // Ensure the item was not locked before moving
            if (!evt.item.classList.contains('locked')) {
                const [movedItem] = filaEstrela.splice(evt.oldIndex, 1);
                filaEstrela.splice(evt.newIndex, 0, movedItem);
                atualizarTela(); // Re-render the lists to ensure consistency
            }
        }
    });
}

function adicionarPontoAvulso(time) {
  // Para pontos avulsos, você pode criar uma entrada genérica ou ignorá-los no ranking de jogadores
  const nomeAvulso = "Ponto Avulso (Erro)";
  if (!jogadoresStats[nomeAvulso]) {
      jogadoresStats[nomeAvulso] = { pontos: 0, vitorias: 0, derrotas: 0 };
  }
  jogadoresStats[nomeAvulso].pontos++;

  if (time === 'A') placarA++;
  else if (time === 'B') placarB++;

  const vencedor = verificarVitoriaPartida();
  if (vencedor) {
      registrarVitoria(vencedor);
  }
  atualizarTela();
}

function removerPontoAvulso(time) {
  const nomeAvulso = "Ponto Avulso (Erro)";
  if (jogadoresStats[nomeAvulso] && jogadoresStats[nomeAvulso].pontos > 0) {
    jogadoresStats[nomeAvulso].pontos--;
  }
  if (time === 'A' && placarA > 0) placarA--;
  else if (time === 'B' && placarB > 0) placarB--;

  atualizarTela();
}

// Funções para o Histórico de Partidas
function mostrarHistorico() {
    const listaHistorico = document.getElementById('listaHistorico');
    listaHistorico.innerHTML = ''; // Limpa a lista antes de preencher

    if (historicoPartidas.length === 0) {
        listaHistorico.innerHTML = '<li class="text-center text-gray-500 py-4">Nenhuma partida registrada ainda.</li>';
    } else {
        // Cria uma cópia invertida do array para mostrar as partidas mais recentes primeiro.
        const historicoInvertido = [...historicoPartidas].reverse();

        historicoInvertido.forEach((partida, index) => {
            const li = document.createElement('li');

            // Determina a classe de fundo com base no vencedor
            let backgroundClass = '';
            if (partida.vencedor === 'Time A') {
                backgroundClass = 'historico-vitoria-a';
            } else if (partida.vencedor === 'Time B') {
                backgroundClass = 'historico-vitoria-b';
            } else { // Empate/Ambos Saíram
                backgroundClass = 'historico-empate';
            }

            // Classes CSS para destacar o placar do vencedor
            const classePlacarVencedorA = partida.vencedor === 'Time A' ? 'vencedorA' : '';
            const classePlacarVencedorB = partida.vencedor === 'Time B' ? 'vencedorB' : '';

            li.innerHTML = `
                <div class="text-center mb-2">
                    <p class="text-lg font-semibold text-gray-700">Partida #${index + 1}</p> <p class="historico-meta-info text-sm text-gray-500">${partida.data}</p>
                </div>
                <div class="flex justify-around items-start gap-4">
                    <div class="flex-1 text-center p-2 rounded-md bg-white shadow-sm border border-gray-200">
                        <h4 class="font-bold text-gray-800 mb-1">Time A</h4>
                        <p class="text-sm text-gray-600 flex flex-col">${partida.timeA.map(player => `<span>${player}</span>`).join('')}</p>
                    </div>
                    <div class="flex flex-col items-center justify-center">
                        <div class="historico-placar flex items-center gap-2 text-xl font-bold">
                            <span class="historico-placar-time px-3 py-1 rounded-md ${classePlacarVencedorA}">${partida.placarFinalA}</span>
                            <span class="historico-placar-vs text-gray-400">vs</span>
                            <span class="historico-placar-time px-3 py-1 rounded-md ${classePlacarVencedorB}">${partida.placarFinalB}</span>
                        </div>
                        <p class="text-sm font-semibold text-gray-700 mt-2">Vencedor: <span class="${partida.vencedor === 'Empate/Ambos Saíram' ? 'text-blue-600' : 'text-green-600'}">${partida.vencedor}</span></p>
                    </div>
                    <div class="flex-1 text-center p-2 rounded-md bg-white shadow-sm border border-gray-200">
                        <h4 class="font-bold text-gray-800 mb-1">Time B</h4>
                        <p class="text-sm text-gray-600 flex flex-col">${partida.timeB.map(player => `<span>${player}</span>`).join('')}</p>
                    </div>
                </div>
            `;
            li.className = backgroundClass; // Aplica a classe de fundo
            listaHistorico.appendChild(li);
        });
    }
    document.getElementById('modalHistorico').classList.remove('hidden'); // Usa classes Tailwind
}

function fecharHistorico() {
    document.getElementById('modalHistorico').classList.add('hidden'); // Usa classes Tailwind
}


// Carrega as configurações iniciais do localStorage
carregarDadosIniciais();

// Inicia um novo jogo com os jogadores iniciais sempre que a página carrega
iniciarNovoJogo();

window.onclick = function(event) {
  if (event.target === document.getElementById('modalConfig')) {
    fecharConfiguracoes();
  }
  if (event.target === document.getElementById('modalHistorico')) {
    fecharHistorico();
  }
}
