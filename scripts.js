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
let estrelasPorTime = parseInt(localStorage.getItem('estrelasPorTime')) || 1; // Agora representa o MÍNIMO
let jogadoresPorTime = parseInt(localStorage.getItem('jogadoresPorTime')) || 4;
let maxVitoriasConsecutivas = parseInt(localStorage.getItem('maxVitoriasConsecutivas')) || 3;

// O histórico de partidas não será persistido entre recarregamentos
let historicoPartidas = [];
let historicoEstados = [];
const MAX_UNDO_HISTORY = 30;

// Funções para Desfazer Ação (mantidas)
function salvarEstadoAtual() {
    const estado = {
        filaGeral: JSON.parse(JSON.stringify(filaGeral)),
        filaEstrela: JSON.parse(JSON.stringify(filaEstrela)),
        estrelasRegistradas: JSON.parse(JSON.stringify(estrelasRegistradas)),
        timeA: JSON.parse(JSON.stringify(timeA)),
        timeB: JSON.parse(JSON.stringify(timeB)),
        vitoriasA: vitoriasA,
        vitoriasB: vitoriasB,
        placarA: placarA,
        placarB: placarB,
        jogadoresStats: JSON.parse(JSON.stringify(jogadoresStats)),
        jogadoresTravados: JSON.parse(JSON.stringify(jogadoresTravados)),
        historicoPartidas: JSON.parse(JSON.stringify(historicoPartidas)),
    };
    historicoEstados.push(estado);
    if (historicoEstados.length > MAX_UNDO_HISTORY) {
        historicoEstados.shift();
    }
}

function restaurarEstado(estado) {
    filaGeral = estado.filaGeral;
    filaEstrela = estado.filaEstrela;
    estrelasRegistradas = estado.estrelasRegistradas;
    timeA = estado.timeA;
    timeB = estado.timeB;
    vitoriasA = estado.vitoriasA;
    vitoriasB = estado.vitoriasB;
    placarA = estado.placarA;
    placarB = estado.placarB;
    jogadoresStats = estado.jogadoresStats;
    jogadoresTravados = estado.jogadoresTravados;
    historicoPartidas = estado.historicoPartidas; // Restaurar histórico também
}

function desfazerUltimaAcao() {
    if (historicoEstados.length > 0) {
        const estadoAnterior = historicoEstados.pop();
        restaurarEstado(estadoAnterior);
        atualizarTela();
    } else {
        alert("Nenhuma ação para desfazer.");
    }
}


// --- NOVAS FUNÇÕES PARA PERSISTÊNCIA E INICIALIZAÇÃO ---

// Salva o estado principal das filas e jogadores no localStorage
function saveGameState() {
    localStorage.setItem('filaGeral', JSON.stringify(filaGeral));
    localStorage.setItem('filaEstrela', JSON.stringify(filaEstrela));
    localStorage.setItem('estrelasRegistradas', JSON.stringify(estrelasRegistradas));
    localStorage.setItem('jogadoresStats', JSON.stringify(jogadoresStats));
    localStorage.setItem('jogadoresTravados', JSON.stringify(jogadoresTravados));
}

// Carrega o estado principal das filas e jogadores do localStorage
// Adicionado um parâmetro 'forceReset' para quando o botão "Zerar Dados" for usado
function loadGameState(forceReset = false) {
    const savedFilaGeral = localStorage.getItem('filaGeral');
    const savedFilaEstrela = localStorage.getItem('filaEstrela');
    const savedEstrelasRegistradas = localStorage.getItem('estrelasRegistradas');
    const savedJogadoresStats = localStorage.getItem('jogadoresStats');
    const savedJogadoresTravados = localStorage.getItem('jogadoresTravados');

    if (forceReset || !(savedFilaGeral && savedFilaEstrela && savedEstrelasRegistradas && savedJogadoresStats && savedJogadoresTravados)) {
        // Se forceReset for true OU não houver dados salvos, inicialize com dados de exemplo
        console.log("Inicializando com jogadores padrão (dados zerados ou primeira abertura).");
        inicializarFilaEPrefabs(); // Popula filas com jogadores padrão
    } else {
        // Se houver dados salvos e não for um reset forçado, carregue-os
        filaGeral = JSON.parse(savedFilaGeral);
        filaEstrela = JSON.parse(savedFilaEstrela);
        estrelasRegistradas = JSON.parse(savedEstrelasRegistradas);
        jogadoresStats = JSON.parse(savedJogadoresStats);
        jogadoresTravados = JSON.parse(savedJogadoresTravados);
        console.log("Estado dos jogadores e filas carregado do localStorage.");
    }
    
    // Garante que os times estão vazios e o placar resetado ao iniciar a sessão
    timeA = [];
    timeB = [];
    resetPlacarEContadoresDeVitoria(); 
}

// Inicializa as filas com jogadores padrão (usado na primeira abertura ou após zerar dados)
function inicializarFilaEPrefabs() {
    filaGeral = ["Alan", "Anderson", "Danilo", "Edinho", "Fernando", "Iba", "Júlio Cesar", "Kauan", "Lucas", "Marciano", "Mateus Henrique", "Matheus Lael", "Matheus Matos", "Matheus Venturim", "Odair", "Pâmela", "Rafael", "Wendel"];
    filaEstrela = ["Daniele", "Gaby", "Guilherme Basso", "Guilherme Ramires", "Lucélia", "Paty", "Taynara"];
    estrelasRegistradas = [...filaEstrela];

    // Zera as estatísticas de jogadores para um reset completo
    jogadoresStats = {}; 
    jogadoresTravados = {};

    // Inicializa estatísticas e status de travamento para esses jogadores
    [...filaGeral, ...filaEstrela].forEach(nome => {
        if (!jogadoresStats[nome]) {
            jogadoresStats[nome] = { pontos: 0, vitorias: 0, derrotas: 0 };
        }
        if (!jogadoresTravados.hasOwnProperty(nome)) {
            jogadoresTravados[nome] = false;
        }
    });
    saveGameState(); // Salva este estado inicial/zerado
}

// Reseta apenas o placar e os contadores de vitória consecutiva
function resetPlacarEContadoresDeVitoria() {
    placarA = 0;
    placarB = 0;
    vitoriasA = 0;
    vitoriasB = 0;
}

// --- NOVO: Função para zerar todos os dados do aplicativo ---
function zerarTodosOsDados() {
    if (confirm("Tem certeza que deseja zerar TODOS os dados de jogadores, filas e estatísticas? Esta ação é irreversível.")) {
        // Limpa todos os itens relevantes do localStorage
        localStorage.removeItem('filaGeral');
        localStorage.removeItem('filaEstrela');
        localStorage.removeItem('estrelasRegistradas');
        localStorage.removeItem('jogadoresStats');
        localStorage.removeItem('jogadoresTravados');
        localStorage.removeItem('pontosVitoria'); // Também reseta as configurações para o padrão
        localStorage.removeItem('tipoDesempate');
        localStorage.removeItem('estrelasPorTime');
        localStorage.removeItem('jogadoresPorTime');
        localStorage.removeItem('maxVitoriasConsecutivas');

        // Limpa o histórico de undo e o histórico de partidas (que não é persistido)
        historicoEstados = [];
        historicoPartidas = [];

        // Recarrega o estado do aplicativo como se fosse a primeira abertura
        carregarDadosIniciais(); // Carrega configurações padrão
        loadGameState(true); // Força a reinicialização dos jogadores e filas
        atualizarTela();     // Atualiza a UI para refletir o estado zerado
        fecharConfiguracoes(); // Fecha o modal de configurações
        alert("Todos os dados foram zerados com sucesso!");
    }
}


// --- FIM DAS NOVAS FUNÇÕES PARA PERSISTÊNCIA E INICIALIZAÇÃO ---


// Função para carregar as configurações (mantida, já usa localStorage)
function carregarDadosIniciais() {
    pontosVitoria = parseInt(localStorage.getItem('pontosVitoria')) || 12;
    tipoDesempate = localStorage.getItem('tipoDesempate') || 'adicional';
    estrelasPorTime = parseInt(localStorage.getItem('estrelasPorTime')) || 1;
    jogadoresPorTime = parseInt(localStorage.getItem('jogadoresPorTime')) || 4;
    maxVitoriasConsecutivas = parseInt(localStorage.getItem('maxVitoriasConsecutivas')) || 3;
}

// Função para salvar as configurações (mantida)
function salvarConfiguracoes() {
    const novosPontosVitoria = parseInt(document.getElementById('pontosPartida').value);
    const novoTipoDesempate = document.getElementById('tipoDesempate').value;
    const novasEstrelasPorTime = parseInt(document.getElementById('estrelasPorTime').value); // Mínimo de estrelas
    const novosJogadoresPorTime = parseInt(document.getElementById('jogadoresPorTime').value);
    const novoMaxVitoriasConsecutivas = parseInt(document.getElementById('maxVitoriasConsecutivas').value);

    if (novosPontosVitoria > 0 && novasEstrelasPorTime >= 0 && novosJogadoresPorTime >= 2 && novosJogadoresPorTime <= 6 && novoMaxVitoriasConsecutivas > 0) {
        if (novasEstrelasPorTime > novosJogadoresPorTime) {
            alert("O número mínimo de estrelas por time não pode ser maior que o total de jogadores por time.");
            return;
        }

        pontosVitoria = novosPontosVitoria;
        tipoDesempate = novoTipoDesempate;
        estrelasPorTime = novasEstrelasPorTime;
        jogadoresPorTime = novosJogadoresPorTime;
        maxVitoriasConsecutivas = novoMaxVitoriasConsecutivas;

        localStorage.setItem('pontosVitoria', pontosVitoria);
        localStorage.setItem('tipoDesempate', tipoDesempate);
        localStorage.setItem('estrelasPorTime', estrelasPorTime);
        localStorage.setItem('jogadoresPorTime', jogadoresPorTime);
        localStorage.setItem('maxVitoriasConsecutivas', maxVitoriasConsecutivas);

        fecharConfiguracoes();
        atualizarTela(); // Atualiza a tela após salvar configurações
    } else {
        alert("Por favor, insira valores válidos para as configurações:\n- Pontos para vencer: maior que 0\n- Mín. estrelas por time: maior ou igual a 0\n- Jogadores por time: entre 2 e 6\n- Máx. vitórias consecutivas: maior que 0.");
    }
}

function abrirConfiguracoes() {
    document.getElementById('pontosPartida').value = pontosVitoria;
    document.getElementById('tipoDesempate').value = tipoDesempate;
    document.getElementById('estrelasPorTime').value = estrelasPorTime;
    document.getElementById('jogadoresPorTime').value = jogadoresPorTime;
    document.getElementById('maxVitoriasConsecutivas').value = maxVitoriasConsecutivas;
    document.getElementById('modalConfig').classList.remove('hidden');
}

function fecharConfiguracoes() {
    document.getElementById('modalConfig').classList.add('hidden');
}

function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
}

// NOVA FUNÇÃO: Forma os times de A e B puxando da fila
function formarTimesAutomaticamente() {
    salvarEstadoAtual(); // Salva o estado antes da formação de times

    // Zera os times em quadra para a nova formação
    timeA = [];
    timeB = [];
    
    const filaGeralDisponivel = filaGeral.filter(j => !jogadoresTravados[j]);
    const filaEstrelaDisponivel = filaEstrela.filter(j => !jogadoresTravados[j]);
    
    const estrelasParaAlocar = Math.max(0, estrelasPorTime);
    const jogadoresGeraisPorTimeCalc = jogadoresPorTime - estrelasParaAlocar;

    if (jogadoresGeraisPorTimeCalc < 0) {
        alert(`Configuração inválida: O número de jogadores por time (${jogadoresPorTime}) é menor que o mínimo de estrelas por time (${estrelasParaAlocar}). Ajuste nas configurações.`);
        atualizarTela();
        return;
    }

    if (filaEstrelaDisponivel.length < (estrelasParaAlocar * 2) || filaGeralDisponivel.length < (jogadoresGeraisPorTimeCalc * 2)) {
        alert(`Não há jogadores suficientes disponíveis nas filas para formar novos times com ${jogadoresPorTime} jogadores por time (sendo ${estrelasParaAlocar} estrelas no mínimo). Adicione mais jogadores ou ajuste as configurações.`);
        atualizarTela();
        return; // Impede a formação de times incompletos
    }

    // Forma Time A
    for (let i = 0; i < estrelasParaAlocar; i++) {
        timeA.push(filaEstrelaDisponivel.shift());
    }
    for (let i = 0; i < jogadoresGeraisPorTimeCalc; i++) {
        timeA.push(filaGeralDisponivel.shift());
    }

    // Forma Time B
    for (let i = 0; i < estrelasParaAlocar; i++) {
        timeB.push(filaEstrelaDisponivel.shift());
    }
    for (let i = 0; i < jogadoresGeraisPorTimeCalc; i++) {
        timeB.push(filaGeralDisponivel.shift());
    }
    
    // Remove os jogadores alocados das filas originais
    filaGeral = filaGeral.filter(j => !timeA.includes(j) && !timeB.includes(j));
    filaEstrela = filaEstrela.filter(j => !timeA.includes(j) && !timeB.includes(j));

    resetPlacarEContadoresDeVitoria(); // Zera o placar e contadores para a nova partida
    saveGameState(); // Salva o estado das filas após a formação dos times
    atualizarTela(); // Atualiza a interface
}


// `trocarJogador` (mantida)
function trocarJogador(time, indexQuadra, tipoFilaOrigem, indexFilaString) {
    salvarEstadoAtual();
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

    if (jogadoresTravados[jogadorParaEntrar]) {
        alert("Este jogador está travado e não pode entrar em quadra.");
        atualizarTela();
        return;
    }

    let jogadorParaSair;
    const equipeAlvo = time === 'A' ? timeA : timeB;
    jogadorParaSair = equipeAlvo[indexQuadra];

    const isEstrelaSaindo = estrelasRegistradas.includes(jogadorParaSair);
    const isEstrelaEntrando = estrelasRegistradas.includes(jogadorParaEntrar);
    let estrelasNoTimeAtual = equipeAlvo.filter(j => estrelasRegistradas.includes(j)).length;

    if (isEstrelaSaindo && !isEstrelaEntrando) {
        if (estrelasNoTimeAtual - 1 < estrelasPorTime) {
            alert(`Não é permitido ter menos de ${estrelasPorTime} estrela(s) no time. Esta troca resultaria em ${estrelasNoTimeAtual - 1} estrela(s).`);
            atualizarTela();
            return;
        }
    }
    
    if (time === 'A') {
        timeA[indexQuadra] = jogadorParaEntrar;
    } else {
        timeB[indexQuadra] = jogadorParaEntrar;
    }

    filaOrigemArray.splice(indexFila, 1);

    if (estrelasRegistradas.includes(jogadorParaSair)) {
        filaEstrela.push(jogadorParaSair);
    } else {
        filaGeral.push(jogadorParaSair);
    }

    saveGameState(); // Salva estado após a troca
    atualizarTela();
}

// `verificarVitoriaPartida` (mantida)
function verificarVitoriaPartida() {
    const minPontos = pontosVitoria;

    if (tipoDesempate === 'saiOsDois' && placarA === (minPontos - 1) && placarB === (minPontos - 1)) {
        return 'ambosSaem';
    }

    const emDesempate = placarA >= minPontos - 1 && placarB >= minPontos - 1;

    if (emDesempate) {
        if (tipoDesempate === 'diferenca') {
            if (placarA >= minPontos && placarA >= placarB + 2) return 'A';
            if (placarB >= minPontos && placarB >= placarA + 2) return 'B';
        }    
        else if (tipoDesempate === 'adicional') {
            const pontoVitoriaAdicional = minPontos + 2;
            if (placarA === pontoVitoriaAdicional) return 'A';
            if (placarB === pontoVitoriaAdicional) return 'B';
        }
        else if (tipoDesempate === 'saiOsDois') {
            if (placarA >= minPontos && placarA >= placarB + 2) return 'A';
            if (placarB >= minPontos && placarB >= placarA + 2) return 'B';
        }
    } else {
        if (placarA >= minPontos) return 'A';
        if (placarB >= minPontos) return 'B';
    }
    return null;
}

// `marcarPonto` (mantida, mas com saveGameState)
function marcarPonto(time, jogador) {
    salvarEstadoAtual();
    if (!jogadoresStats[jogador]) {
        jogadoresStats[jogador] = { pontos: 0, vitorias: 0, derrotas: 0 };
    }
    jogadoresStats[jogador].pontos++;

    if (time === 'A') placarA++;
    else placarB++;

    saveGameState(); // Salva o estado após marcar ponto
    const vencedor = verificarVitoriaPartida();
    if (vencedor) {
        registrarVitoria(vencedor);
    }
    atualizarTela();
}

// `registrarVitoria` (modificada para chamar formarTimesAutomaticamente)
function registrarVitoria(vencedor) {
    salvarEstadoAtual(); // Salva o estado antes de processar a vitória

    // Atualiza estatísticas de vitórias/derrotas
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

    // Registra a partida no histórico
    historicoPartidas.unshift({
        timeA: [...timeA],
        timeB: [...timeB],
        placarFinalA: placarA,
        placarFinalB: placarB,
        vencedor: vencedor === 'ambosSaem' ? 'Empate/Ambos Saíram' : `Time ${vencedor}`,
        data: new Date().toLocaleString('pt-BR')
    });
    
    let jogadoresParaFila = [];
    let deveFormarNovosTimes = false;

    // Define quais jogadores saem de quadra e quais times precisam ser re-formados
    if (vencedor === 'ambosSaem' || vitoriasA >= maxVitoriasConsecutivas || vitoriasB >= maxVitoriasConsecutivas) {
        // Ambos os times saem ou limite de vitórias consecutivas atingido
        jogadoresParaFila = [...timeA, ...timeB];
        timeA = [];
        timeB = [];
        deveFormarNovosTimes = true; 
    } else if (vencedor === 'A') {
        // Apenas o Time B perdedor sai
        jogadoresParaFila = [...timeB];
        timeB = [];
        deveFormarNovosTimes = true; 
    } else if (vencedor === 'B') {
        // Apenas o Time A perdedor sai
        jogadoresParaFila = [...timeA];
        timeA = [];
        deveFormarNovosTimes = true; 
    }

    // Adiciona os jogadores que saíram de quadra de volta às suas respectivas filas
    shuffleArray(jogadoresParaFila); // Embaralha para que a fila tenha uma ordem aleatória
    jogadoresParaFila.forEach(j => {
        if (!jogadoresTravados[j]) { // Só adiciona se o jogador não estiver travado
            if (estrelasRegistradas.includes(j)) {
                filaEstrela.push(j);
            } else {
                filaGeral.push(j);
            }
        }
    });

    resetPlacarEContadoresDeVitoria(); // Zera o placar e contadores para a próxima partida
    saveGameState(); // Salva o estado atualizado das filas e stats

    // Se a condição exige a formação de novos times, chama a função automática
    if (deveFormarNovosTimes) {
        formarTimesAutomaticamente(); // Esta função também chama atualizarTela()
    } else {
        atualizarTela(); // Se nenhuma formação automática é necessária, apenas atualiza a tela
    }
}


// `resetarPlacar` (Mantida, agora usando resetPlacarEContadoresDeVitoria)
function resetarPlacar() {
    salvarEstadoAtual(); // Salva antes do reset para o undo
    resetPlacarEContadoresDeVitoria(); // Apenas zera placar e contadores de vitória
    atualizarTela();
}

// `adicionarParticipante` (modificada para salvar o estado)
function adicionarParticipante(tipoFila) {
    salvarEstadoAtual();
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
        jogadoresTravados[nome] = false;

        nomeInput.value = "";
        saveGameState(); // Salva o estado após adicionar participante
        atualizarTela();
    }
}

// `removerParticipante` (modificada para salvar o estado)
function removerParticipante(tipoFila, index) {
    salvarEstadoAtual();
    let filaAlvo;
    if (tipoFila === 'geral') {
        filaAlvo = filaGeral;
    } else if (tipoFila === 'estrela') {
        filaAlvo = filaEstrela;
    } else {
        return;
    }

    const nomeRemovido = filaAlvo.splice(index, 1)[0];
    delete jogadoresTravados[nomeRemovido];
    saveGameState(); // Salva o estado após remover participante
    atualizarTela();
}

// `editarParticipante` (modificada para salvar o estado)
function editarParticipante(tipoFila, index, novoNome) {
    salvarEstadoAtual();
    novoNome = novoNome.trim();
    if (!novoNome) {
        alert("O nome do participante não pode ser vazio.");
        atualizarTela();    
        return;
    }

    let nomeAntigo;
    let filaAlvo;

    if (tipoFila === 'geral') {
        filaAlvo = filaGeral;
    } else if (tipoFila === 'estrela') {
        filaAlvo = filaEstrela;
    } else {
        return;
    }

    nomeAntigo = filaAlvo[index];

    if (nomeAntigo === novoNome) {
        return;
    }

    const nomeExistente = filaGeral.includes(novoNome) ||
                            filaEstrela.includes(novoNome) ||
                            timeA.includes(novoNome) ||
                            timeB.includes(novoNome);

    if (nomeExistente && nomeAntigo !== novoNome) {
        alert(`O nome "${novoNome}" já está em uso. Por favor, escolha outro nome.`);
        atualizarTela();    
        return;
    }

    filaAlvo[index] = novoNome;

    if (tipoFila === 'estrela') {
        const estrelaIndex = estrelasRegistradas.indexOf(nomeAntigo);
        if (estrelaIndex > -1) {
            estrelasRegistradas[estrelaIndex] = novoNome;
        }
    }

    if (jogadoresStats[nomeAntigo]) {
        jogadoresStats[novoNome] = jogadoresStats[nomeAntigo];
        delete jogadoresStats[nomeAntigo];
    } else {
        jogadoresStats[novoNome] = { pontos: 0, vitorias: 0, derrotas: 0 };
    }

    if (jogadoresTravados.hasOwnProperty(nomeAntigo)) {
        jogadoresTravados[novoNome] = jogadoresTravados[nomeAntigo];
        delete jogadoresTravados[nomeAntigo];
    } else {
        jogadoresTravados[novoNome] = false;
    }

    timeA = timeA.map(j => j === nomeAntigo ? novoNome : j);
    timeB = timeB.map(j => j === nomeAntigo ? novoNome : j);

    saveGameState(); // Salva o estado após editar participante
    atualizarTela();
}

// `embaralharFila` (modificada para salvar o estado)
function embaralharFila(tipoFila) {
    salvarEstadoAtual();
    if (tipoFila === 'geral') {
        shuffleArray(filaGeral);
    } else if (tipoFila === 'estrela') {
        shuffleArray(filaEstrela);
    }
    saveGameState(); // Salva o estado após embaralhar
    atualizarTela();
}

// `atualizarRanking` (mantida)
function atualizarRanking() {
    const todosJogadores = new Set([...Object.keys(jogadoresStats), ...filaGeral, ...filaEstrela, ...timeA, ...timeB]);
    const rankingArray = Array.from(todosJogadores)
        .map(nome => {
            if (!jogadoresStats[nome]) {
                jogadoresStats[nome] = { pontos: 0, vitorias: 0, derrotas: 0 };
            }
            const score = (jogadoresStats[nome].vitorias * 5) - jogadoresStats[nome].derrotas + jogadoresStats[nome].pontos;
            return { nome: nome, stats: jogadoresStats[nome], score: score };
        })
        .filter(entry => entry.stats.pontos > 0 || entry.stats.vitorias > 0 || entry.stats.derrotas > 0)
        .sort((a, b) => {
            if (b.score !== a.score) {
                return b.score - a.score;
            }
            if (b.stats.vitorias !== a.stats.vitorias) {
                return b.stats.vitorias - a.stats.vitorias;
            }
            if (b.stats.pontos !== a.stats.pontos) {
                return b.stats.pontos - a.stats.pontos;
            }
            return a.stats.derrotas - b.stats.derrotas;
        });

    const rankingHTML = rankingArray.map((entry, index) => {
        const nome = entry.nome;
        const stats = entry.stats;
        const score = entry.score;

        return `
            <li class="flex items-center py-2 border-b border-gray-200 last:border-b-0">
                <span class="ranking-pos font-bold text-blue-600 w-8 text-center">${index + 1}º</span>
                <span class="ranking-nome flex-1 text-gray-700">${nome}</span>
                <span class="ranking-score font-bold text-purple-600 w-16 text-right">${score}</span>
                <span class="ranking-vitorias font-bold text-blue-600 w-16 text-right">${stats.vitorias} V</span>
                <span class="ranking-pontos font-bold text-green-600 w-16 text-right">${stats.pontos} pts</span>
                <span class="ranking-derrotas font-bold text-red-600 w-16 text-right">${stats.derrotas} D</span>
            </li>
        `;
    }).join('');

    document.getElementById("ranking").innerHTML = rankingHTML || '<li class="text-center text-gray-500 py-4">Nenhum ponto ou partida registrada ainda</li>';
}

// `atualizarStatusPartida` (mantida)
function atualizarStatusPartida() {
    const statusEl = document.getElementById('statusPartida');
    const minPontos = pontosVitoria;
    let statusText = '';
    let displayStatus = false;

    if (tipoDesempate === 'saiOsDois' && placarA === (minPontos - 1) && placarB === (minPontos - 1)) {
        statusText = `🚨 ATENÇÃO: Ambos os times em ${minPontos -1} pontos. Próximo ponto define se alguém vence ou ambos saem!`;
        displayStatus = true;
    } else if (placarA >= minPontos - 1 && placarB >= minPontos - 1) {    
        if (tipoDesempate === 'diferenca') {
            statusText = `⚡ DESEMPATE: É necessário abrir 2 pontos de diferença para vencer.`;
        } else if (tipoDesempate === 'adicional') {
            statusText = `⚡ DESEMPATE: Vence quem alcançar ${minPontos + 2} pontos.`;
        }
        displayStatus = true;
    } else if (placarA >= minPontos -1 ) {    
        statusText = `🔥 Match point para o Time A! (${minPontos - placarA} ponto${minPontos - placarA !== 1 ? 's' : ''} para vencer)`;
        displayStatus = true;
    } else if (placarB >= minPontos -1) {    
        statusText = `🔥 Match point para o Time B! (${minPontos - placarB} ponto${minPontos - placarB !== 1 ? 's' : ''} para vencer)`;
        displayStatus = true;
    }

    statusEl.innerHTML = statusText;
    if (displayStatus) {
        statusEl.classList.remove('hidden');
    } else {
        statusEl.classList.add('hidden');
    }
}

// `toggleLock` (modificada para salvar o estado)
function toggleLock(nomeJogador) {
    salvarEstadoAtual();
    jogadoresTravados[nomeJogador] = !jogadoresTravados[nomeJogador];
    saveGameState(); // Salva o estado após travar/destravar
    atualizarTela();
}

// `atualizarTela` (modificada para controlar o botão "Formar Times" e desabilitar botões de ponto)
function atualizarTela() {
    // ... (renderização de timeA, timeB, filaGeral, filaEstrela, etc.) ...
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
            <input type="text" value="${j.replace(/"/g, "&quot;")}" onchange="editarParticipante('geral', ${i}, this.value)" ${jogadoresTravados[j] ? 'disabled' : ''} class="flex-1 p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 mr-2 ${jogadoresTravados[j] ? 'bg-gray-200' : ''}"/>
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
            <input type="text" value="${j.replace(/"/g, "&quot;")}" onchange="editarParticipante('estrela', ${i}, this.value)" ${jogadoresTravados[j] ? 'disabled' : ''} class="flex-1 p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 mr-2 ${jogadoresTravados[j] ? 'bg-gray-200' : ''}"/>
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

    const undoButton = document.getElementById('undoButton');
    if (undoButton) {
        undoButton.disabled = historicoEstados.length === 0;
    }

    // Lógica para o novo botão "Formar Times"
    const formarTimesBtn = document.getElementById('formarTimesBtn');
    // Seleciona todos os botões de ponto e vitória/reset para habilitar/desabilitar
    const botoesPlacar = document.querySelectorAll('.quadra .flex.justify-center.gap-6 button, .quadra .botoes button'); 
    
    if (timeA.length === 0 && timeB.length === 0) {
        formarTimesBtn.classList.remove('hidden'); // Mostra o botão "Formar Times"
        botoesPlacar.forEach(btn => btn.disabled = true); // Desabilita botões de placar
    } else {
        formarTimesBtn.classList.add('hidden'); // Esconde o botão "Formar Times"
        botoesPlacar.forEach(btn => btn.disabled = false); // Habilita botões de placar
    }

    atualizarRanking();
    atualizarStatusPartida();
    setupSortableLists();
    saveGameState(); // Salva o estado principal após cada atualização de tela
}

// `setupSortableLists` (mantida)
function setupSortableLists() {
    const setupSortable = (ulElement, filaArray) => {
        if (ulElement.sortableInstance) {
            ulElement.sortableInstance.destroy();
        }
        ulElement.sortableInstance = new Sortable(ulElement, {
            animation: 150,
            handle: '.drag-handle',
            filter: '.locked',
            onMove: function (evt) {
                return !evt.related.classList.contains('locked') && !evt.dragged.classList.contains('locked');
            },
            onEnd: function (evt) {
                if (!evt.item.classList.contains('locked')) {
                    salvarEstadoAtual();
                    const [movedItem] = filaArray.splice(evt.oldIndex, 1);
                    filaArray.splice(evt.newIndex, 0, movedItem);
                    saveGameState(); // Salva o estado após a reordenação
                    atualizarTela();
                }
            }
        });
    };
    setupSortable(document.getElementById('filaGeral'), filaGeral);
    setupSortable(document.getElementById('filaEstrela'), filaEstrela);
}

// `adicionarPontoAvulso` (mantida, mas com saveGameState)
function adicionarPontoAvulso(time) {
    salvarEstadoAtual();
    if (time === 'A') placarA++;
    else if (time === 'B') placarB++;

    saveGameState(); // Salva o estado após adicionar ponto avulso
    const vencedor = verificarVitoriaPartida();
    if (vencedor) {
        registrarVitoria(vencedor);
    }
    atualizarTela();
}

// `removerPontoAvulso` (mantida, mas com saveGameState)
function removerPontoAvulso(time) {
    salvarEstadoAtual();
    if (time === 'A' && placarA > 0) placarA--;
    else if (time === 'B' && placarB > 0) placarB--;
    saveGameState(); // Salva o estado após remover ponto avulso
    atualizarTela();
}

// `mostrarHistorico` (mantida)
function mostrarHistorico() {
    const listaHistorico = document.getElementById('listaHistorico');
    listaHistorico.innerHTML = '';

    if (historicoPartidas.length === 0) {
        listaHistorico.innerHTML = '<li class="text-center text-gray-500 py-4">Nenhuma partida registrada ainda.</li>';
    } else {
        const historicoInvertido = [...historicoPartidas].reverse();    
        historicoInvertido.forEach((partida) => {    
            const numeroPartidaOriginal = historicoPartidas.length - historicoInvertido.indexOf(partida);

            const li = document.createElement('li');
            let backgroundClass = '';
            if (partida.vencedor === 'Time A') backgroundClass = 'historico-vitoria-a';
            else if (partida.vencedor === 'Time B') backgroundClass = 'historico-vitoria-b';
            else backgroundClass = 'historico-empate';

            const classePlacarVencedorA = partida.placarFinalA > partida.placarFinalB ? 'vencedorA' : '';
            const classePlacarVencedorB = partida.placarFinalB > partida.placarFinalA ? 'vencedorB' : '';

            li.innerHTML = `
                <div class="text-center mb-2">
                    <p class="text-lg font-semibold text-gray-700">Partida #${numeroPartidaOriginal}</p>
                    <p class="historico-meta-info text-sm text-gray-500">${partida.data}</p>
                </div>
                <div class="flex justify-around items-start gap-4">
                    <div class="flex-1 text-center p-2 rounded-md bg-white shadow-sm border border-gray-200">
                        <h4 class="font-bold text-gray-800 mb-1">Time A</h4>
                        <p class="text-sm text-gray-600 flex flex-col">${partida.timeA.map(player => `<span>${player}</span>`).join('')}</p>
                    </div>
                    <div class="flex flex-col items-center justify-center">
                        <div class="historico-placar flex items-center gap-2 text-xl font-bold">
                            <span class="historico-placar-time px-3 py-1 rounded-md ${classePlacarVencedorA}">${partar.placarFinalA}</span>
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
            li.className = backgroundClass + ' p-4 rounded-lg shadow-md mb-3';
            listaHistorico.appendChild(li);
        });
    }
    document.getElementById('modalHistorico').classList.remove('hidden');
}

function fecharHistorico() {
    document.getElementById('modalHistorico').classList.add('hidden');
}

// Chamadas iniciais ao carregar a página
carregarDadosIniciais(); // Carrega as configurações do jogo
loadGameState();        // Carrega o estado salvo ou inicializa filas/jogadores
atualizarTela();        // Renderiza a interface inicial

window.onclick = function(event) {
    if (event.target === document.getElementById('modalConfig')) {
        fecharConfiguracoes();
    }
    if (event.target === document.getElementById('modalHistorico')) {
        fecharHistorico();
    }
}