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
let maxVitoriasConsecutivas = parseInt(localStorage.getItem('maxVitoriasConsecutivas')) || 5;

// Variável de controle para o primeiro acesso
let primeiraInicializacaoConcluida = localStorage.getItem('primeiraInicializacaoConcluida') === 'true';

// O histórico de partidas não será persistido entre recarregamentos
let historicoPartidas = [];
let historicoEstados = [];
const MAX_UNDO_HISTORY = 30;

// Funções para Desfazer Ação
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
        jogadoresTravados: JSON.parse(JSON.stringify(jogadoresTravados)), // Salva o estado de travados
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
    jogadoresTravados = estado.jogadoresTravados; // Restaura o estado de travados
    historicoPartidas = estado.historicoPartidas;
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


// Função para carregar as configurações iniciais
function carregarDadosIniciais() {
    pontosVitoria = parseInt(localStorage.getItem('pontosVitoria')) || 12;
    tipoDesempate = localStorage.getItem('tipoDesempate') || 'adicional';
    estrelasPorTime = parseInt(localStorage.getItem('estrelasPorTime')) || 1;
    jogadoresPorTime = parseInt(localStorage.getItem('jogadoresPorTime')) || 4;
    maxVitoriasConsecutivas = parseInt(localStorage.getItem('maxVitoriasConsecutivas')) || 5;

    // Carregar jogadoresStats e jogadoresTravados do localStorage
    const savedJogadoresStats = localStorage.getItem('jogadoresStats');
    if (savedJogadoresStats) {
        jogadoresStats = JSON.parse(savedJogadoresStats);
    } else {
        jogadoresStats = {}; // Garante que seja um objeto vazio se não houver dados salvos
    }

    const savedJogadoresTravados = localStorage.getItem('jogadoresTravados');
    if (savedJogadoresTravados) {
        jogadoresTravados = JSON.parse(savedJogadoresTravados);
    } else {
        jogadoresTravados = {}; // Garante que seja um objeto vazio se não houver dados salvos
    }
    
    // Carregar estrelasRegistradas
    const savedEstrelasRegistradas = localStorage.getItem('estrelasRegistradas');
    if (savedEstrelasRegistradas) {
        estrelasRegistradas = JSON.parse(savedEstrelasRegistradas);
    } else {
        estrelasRegistradas = []; // Garante que seja um array vazio se não houver dados salvos
    }

    // Carregar filas se existirem (para que não se percam ao recarregar a página)
    const savedFilaGeral = localStorage.getItem('filaGeral');
    if (savedFilaGeral) {
        filaGeral = JSON.parse(savedFilaGeral);
    } else {
        filaGeral = []; // Garante que seja um array vazio se não houver dados salvos
    }
    const savedFilaEstrela = localStorage.getItem('filaEstrela');
    if (savedFilaEstrela) {
        filaEstrela = JSON.parse(savedFilaEstrela);
    } else {
        filaEstrela = []; // Garante que seja um array vazio se não houver dados salvos
    }
}

function salvarConfiguracoes() {
    const novosPontosVitoria = parseInt(document.getElementById('pontosPartida').value);
    const novoTipoDesempate = document.getElementById('tipoDesempate').value;
    const novasEstrelasPorTime = parseInt(document.getElementById('estrelasPorTime').value); // Mínimo de estrelas
    const novosJogadoresPorTime = parseInt(document.getElementById('jogadoresPorTime').value);
    const novoMaxVitoriasConsecutivas = parseInt(document.getElementById('maxVitoriasConsecutivas').value);

    // Salvar as configurações antigas para comparar se jogadoresPorTime ou estrelasPorTime mudaram
    const oldJogadoresPorTime = jogadoresPorTime;
    const oldEstrelasPorTime = estrelasPorTime;


    if (novosPontosVitoria > 0 && novasEstrelasPorTime >= 0 && novosJogadoresPorTime >= 2 && novosJogadoresPorTime <= 6 && novoMaxVitoriasConsecutivas >= 1 && novoMaxVitoriasConsecutivas <= 7) {
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

        // NOVO: Verificar se a quantidade de jogadores/estrelas por time mudou e recompor
        if (oldJogadoresPorTime !== jogadoresPorTime || oldEstrelasPorTime !== estrelasPorTime) {
            recomporTimesAposConfiguracao();
        } else {
            // Se apenas outras configs mudaram (ex: pontosVitoria), só atualiza a tela
            atualizarTela();
        }
    } else {
        alert("Por favor, insira valores válidos para as configurações:\n- Pontos para vencer: maior que 0\n- Mín. estrelas por time: maior ou igual a 0\n- Jogadores por time: entre 2 e 6\n- Máx. vitórias consecutivas: entre 1 e 7.");
    }
}

// NOVO: Função para recompor os times imediatamente após a mudança de configuração
function recomporTimesAposConfiguracao() {
    salvarEstadoAtual(); // Salva o estado atual antes de recompor

    let todosJogadoresEmCampo = [...timeA, ...timeB];
    let estrelasEmCampo = todosJogadoresEmCampo.filter(j => estrelasRegistradas.includes(j));
    let geraisEmCampo = todosJogadoresEmCampo.filter(j => !estrelasRegistradas.includes(j));

    // Resetar times para reconstruir
    timeA = [];
    timeB = [];

    const jogadoresNecessariosPorTime = jogadoresPorTime;
    const estrelasNecessariasPorTime = estrelasPorTime;

    // ----- Recompor Time A -----
    // Priorizar estrelas existentes
    let estrelasParaTimeA = estrelasEmCampo.splice(0, estrelasNecessariasPorTime);
    timeA.push(...estrelasParaTimeA);

    // Priorizar gerais existentes
    let geraisParaTimeA = geraisEmCampo.splice(0, jogadoresNecessariosPorTime - timeA.length);
    timeA.push(...geraisParaTimeA);

    // Adicionar da fila geral/estrela se necessário (para Time A)
    while (timeA.length < jogadoresNecessariosPorTime) {
        if (timeA.filter(j => estrelasRegistradas.includes(j)).length < estrelasNecessariasPorTime) {
            // Tenta pegar estrela da fila Estrela
            const estrelaDisponivel = filaEstrela.find(j => !jogadoresTravados[j]);
            if (estrelaDisponivel) {
                timeA.push(estrelaDisponivel);
                filaEstrela = filaEstrela.filter(j => j !== estrelaDisponivel);
            } else {
                // Se não há estrelas disponíveis na fila, tenta da fila geral se permitido pelas regras
                const geralDisponivel = filaGeral.find(j => !jogadoresTravados[j]);
                if (geralDisponivel) {
                     timeA.push(geralDisponivel);
                     filaGeral = filaGeral.filter(j => j !== geralDisponivel);
                } else {
                    break; // Não há jogadores disponíveis
                }
            }
        } else {
            // Tenta pegar geral da fila Geral
            const geralDisponivel = filaGeral.find(j => !jogadoresTravados[j]);
            if (geralDisponivel) {
                timeA.push(geralDisponivel);
                filaGeral = filaGeral.filter(j => j !== geralDisponivel);
            } else {
                 // Tenta pegar estrela da fila estrela, se for para preencher vaga geral
                const estrelaDisponivel = filaEstrela.find(j => !jogadoresTravados[j]);
                if (estrelaDisponivel) {
                    timeA.push(estrelaDisponivel);
                    filaEstrela = filaEstrela.filter(j => j !== estrelaDisponivel);
                } else {
                    break; // Não há jogadores disponíveis
                }
            }
        }
    }


    // ----- Recompor Time B ----- (Lógica similar para Time B)
    // Priorizar estrelas e gerais que sobraram do campo
    let estrelasParaTimeB = estrelasEmCampo.splice(0, estrelasNecessariasPorTime); // Estrelas que sobraram de estrelasEmCampo
    timeB.push(...estrelasParaTimeB);

    let geraisParaTimeB = geraisEmCampo.splice(0, jogadoresNecessariosPorTime - timeB.length); // Gerais que sobraram de geraisEmCampo
    timeB.push(...geraisParaTimeB);
    
    while (timeB.length < jogadoresNecessariosPorTime) {
        if (timeB.filter(j => estrelasRegistradas.includes(j)).length < estrelasNecessariasPorTime) {
            const estrelaDisponivel = filaEstrela.find(j => !jogadoresTravados[j]);
            if (estrelaDisponivel) {
                timeB.push(estrelaDisponivel);
                filaEstrela = filaEstrela.filter(j => j !== estrelaDisponivel);
            } else {
                const geralDisponivel = filaGeral.find(j => !jogadoresTravados[j]);
                if (geralDisponivel) {
                     timeB.push(geralDisponivel);
                     filaGeral = filaGeral.filter(j => j !== geralDisponivel);
                } else {
                    break;
                }
            }
        } else {
            const geralDisponivel = filaGeral.find(j => !jogadoresTravados[j]);
            if (geralDisponivel) {
                timeB.push(geralDisponivel);
                filaGeral = filaGeral.filter(j => j !== geralDisponivel);
            } else {
                 const estrelaDisponivel = filaEstrela.find(j => !jogadoresTravados[j]);
                if (estrelaDisponivel) {
                    timeB.push(estrelaDisponivel);
                    filaEstrela = filaEstrela.filter(j => j !== estrelaDisponivel);
                } else {
                    break;
                }
            }
        }
    }

    // Jogadores que sobraram dos "em campo" originais e não foram realocados para timeA/B voltam para as filas
    // IMPORTANTE: estrelasEmCampo e geraisEmCampo agora contêm os jogadores que não foram realocados.
    const jogadoresSobrandoDoCampo = [...estrelasEmCampo, ...geraisEmCampo];
    jogadoresSobrandoDoCampo.forEach(j => {
        if (estrelasRegistradas.includes(j)) {
            filaEstrela.push(j);
        } else {
            filaGeral.push(j);
        }
        // Garante que jogadores que voltam para a fila ficam destravados por padrão se não têm estado
        if (jogadoresTravados[j] === undefined) {
            jogadoresTravados[j] = false; 
        }
    });

    // Garante que jogadores em campo estão destravados
    timeA.forEach(j => jogadoresTravados[j] = false);
    timeB.forEach(j => jogadoresTravados[j] = false);

    // Salvar todos os estados atualizados
    localStorage.setItem('jogadoresStats', JSON.stringify(jogadoresStats));
    localStorage.setItem('jogadoresTravados', JSON.stringify(jogadoresTravados));
    localStorage.setItem('filaGeral', JSON.stringify(filaGeral));
    localStorage.setItem('filaEstrela', JSON.stringify(filaEstrela));
    localStorage.setItem('estrelasRegistradas', JSON.stringify(estrelasRegistradas));

    atualizarTela();
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

function iniciarNovoJogo() {
    salvarEstadoAtual();
    timeA = [];
    timeB = [];
    vitoriasA = 0;
    vitoriasB = 0;
    placarA = 0;
    placarB = 0;
    // Não resetar jogadoresStats e jogadoresTravados aqui,
    // eles serão carregados do localStorage em carregarDadosIniciais()
    // e modificados dinamicamente.

    // --- Lógica para o primeiro acesso vs. acessos subsequentes ---
    if (!primeiraInicializacaoConcluida) {
        // Primeira inicialização: Filas e times começam vazios
        // Popula as filas padrão SOMENTE SE elas estiverem realmente vazias
        // Isso evita adicionar nomes duplicados se o usuário já adicionou manualmente
        if (filaGeral.length === 0 && filaEstrela.length === 0) {
            filaGeral = ["Anderson", "Danilo", "Edinho", "Fernando", "Iba", "Julio Cesar", "Kauan", "Lucas", "Marciano", "Mateus Henrique", "Matheus Lael", "Matheus Matos", "Matheus Venturim", "Odair", "Pâmela","Rafael", "Wendel"];
            filaEstrela = ["Daniele", "Guilherme Basso", "Guilherme Ramires", "Lucélia", "Paty", "Taynara"];
            estrelasRegistradas = [...filaEstrela];
        }
        
        // Exibe o alerta APENAS uma vez na primeira carga
        if (localStorage.getItem('primeiraInicializacaoAlertExibido') !== 'true') {
            alert("Bem-vindo! Para começar, adicione os jogadores manualmente nas 'Fila Geral' e/ou 'Fila com Estrela' e, em seguida, preencha os times A e B em quadra para iniciar a primeira partida.");
            localStorage.setItem('primeiraInicializacaoAlertExibido', 'true');
        }
        
        // Inicializa todos os jogadores conhecidos com o estado de travado como FALSE (destravado) por padrão
        // para permitir seleção manual.
        const allKnownPlayers = new Set([...filaGeral, ...filaEstrela, ...Object.keys(jogadoresStats)]);
        allKnownPlayers.forEach(nome => {
            if (!jogadoresStats[nome]) {
                jogadoresStats[nome] = { pontos: 0, vitorias: 0, derrotas: 0 };
            }
            // Define como destravado se não tiver estado, mas não força se já existe
            if (jogadoresTravados[nome] === undefined) {
                jogadoresTravados[nome] = false; 
            }
        });
        // Salvar o estado inicial de jogadoresStats e jogadoresTravados
        localStorage.setItem('jogadoresStats', JSON.stringify(jogadoresStats));
        localStorage.setItem('jogadoresTravados', JSON.stringify(jogadoresTravados));

        atualizarTela(); // Apenas atualiza a tela para mostrar filas e selects
        return; // Sai da função, a formação automática será feita pela `preencherTimesManualmente`
    }

    // --- Se não for a primeira inicialização (ou já foi preenchido manualmente), continua com a lógica automática ---

    // Garante que estrelasRegistradas reflita as estrelas que já estão em jogadoresStats
    estrelasRegistradas = Object.keys(jogadoresStats).filter(nome => estrelasRegistradas.includes(nome) || filaEstrela.includes(nome));
    
    // As filas devem ser carregadas do localStorage ou conter jogadores já adicionados.
    // Nao repopular com jogadores padrão aqui se já houver jogadores.

    const todosJogadoresAtuais = new Set([...filaGeral, ...filaEstrela, ...Object.keys(jogadoresStats)]);
    todosJogadoresAtuais.forEach(nome => {
        if (!jogadoresStats[nome]) {
            jogadoresStats[nome] = { pontos: 0, vitorias: 0, derrotas: 0 };
        }
        // Se o jogador não está em jogadoresTravados, assume destravado por padrão
        if (jogadoresTravados[nome] === undefined) {
             jogadoresTravados[nome] = false; // Assume destravado por padrão
        }
    });

    const jogadoresGeraisParaAlocar = filaGeral.filter(j => !jogadoresTravados[j]);
    const jogadoresEstrelaParaAlocar = filaEstrela.filter(j => !jogadoresTravados[j]);

    const estrelasParaAlocar = Math.max(0, estrelasPorTime);    
    const jogadoresGeraisPorTime = jogadoresPorTime - estrelasParaAlocar;

    if (jogadoresGeraisPorTime < 0) {
        alert(`Configuração inválida: O número de jogadores por time (${jogadoresPorTime}) é menor que o mínimo de estrelas por time (${estrelasParaAlocar}). Ajuste nas configurações.`);
        atualizarTela();
        return;
    }

    if (jogadoresEstrelaParaAlocar.length < (estrelasParaAlocar * 2) || jogadoresGeraisParaAlocar.length < (jogadoresGeraisPorTime * 2)) {
        alert(`É necessário ter pelo menos ${estrelasParaAlocar * 2} jogadores estrela e ${jogadoresGeraisPorTime * 2} jogadores na fila geral disponíveis para iniciar um jogo com ${jogadoresPorTime} jogadores por time (sendo ${estrelasParaAlocar} estrelas no mínimo).`);
        atualizarTela();
        return;
    }

    for (let i = 0; i < estrelasParaAlocar; i++) {
        timeA.push(jogadoresEstrelaParaAlocar.shift());
        timeB.push(jogadoresEstrelaParaAlocar.shift());
    }

    for (let i = 0; i < jogadoresGeraisPorTime; i++) {
        timeA.push(jogadoresGeraisParaAlocar.shift());
        timeB.push(jogadoresGeraisParaAlocar.shift());
    }

    // Atualiza as filas filtrando os jogadores que foram para os times
    filaGeral = filaGeral.filter(j => !timeA.includes(j) && !timeB.includes(j));
    filaEstrela = filaEstrela.filter(j => !timeA.includes(j) && !timeB.includes(j));
    
    // Garante que jogadores em campo estão destravados
    timeA.forEach(j => jogadoresTravados[j] = false);
    timeB.forEach(j => jogadoresTravados[j] = false);
    
    // NOVO: Salva jogadoresTravados após formação automática dos times.
    localStorage.setItem('jogadoresTravados', JSON.stringify(jogadoresTravados));
    localStorage.setItem('filaGeral', JSON.stringify(filaGeral));
    localStorage.setItem('filaEstrela', JSON.stringify(filaEstrela));


    atualizarTela();
}

// NOVO: Função para preencher os times manualmente na primeira inicialização
function preencherTimesManualmente() {
    salvarEstadoAtual(); // Salva o estado antes de preencher
    timeA = [];
    timeB = [];
    const selectsA = document.querySelectorAll('#selectsTimeA select');
    const selectsB = document.querySelectorAll('#selectsTimeB select');

    let jogadoresSelecionados = new Set();
    let erros = [];

    // Processar Time A
    selectsA.forEach((select, index) => {
        const nomeJogador = select.value;
        if (nomeJogador && nomeJogador !== '-1') {
            if (jogadoresSelecionados.has(nomeJogador)) {
                erros.push(`O jogador "${nomeJogador}" foi selecionado mais de uma vez para o Time A.`);
            } else {
                timeA.push(nomeJogador);
                jogadoresSelecionados.add(nomeJogador);
            }
        } else {
            erros.push(`Por favor, selecione um jogador para a posição ${index + 1} do Time A.`);
        }
    });

    // Processar Time B
    selectsB.forEach((select, index) => {
        const nomeJogador = select.value;
        if (nomeJogador && nomeJogador !== '-1') {
            if (jogadoresSelecionados.has(nomeJogador)) {
                erros.push(`O jogador "${nomeJogador}" já foi selecionado para outro time ou posição.`);
            } else {
                timeB.push(nomeJogador);
                jogadoresSelecionados.add(nomeJogador);
            }
        } else {
            erros.push(`Por favor, selecione um jogador para a posição ${index + 1} do Time B.`);
        }
    });

    if (erros.length > 0) {
        alert("Erros ao preencher os times:\n" + erros.join('\n'));
        restaurarEstado(historicoEstados.pop()); // Desfaz o salvamento do estado
        atualizarTela();
        return;
    }

    // Validação de mínimo de estrelas
    const estrelasTimeA = timeA.filter(j => estrelasRegistradas.includes(j)).length;
    const estrelasTimeB = timeB.filter(j => estrelasRegistradas.includes(j)).length;

    if (estrelasTimeA < estrelasPorTime || estrelasTimeB < estrelasPorTime) {
        alert(`Cada time deve ter no mínimo ${estrelasPorTime} estrela(s). Time A tem ${estrelasTimeA}, Time B tem ${estrelasTimeB}.`);
        restaurarEstado(historicoEstados.pop()); // Desfaz o salvamento do estado
        atualizarTela();
        return;
    }


    // Remover jogadores selecionados das filas
    filaGeral = filaGeral.filter(j => !jogadoresSelecionados.has(j));
    filaEstrela = filaEstrela.filter(j => !jogadoresSelecionados.has(j));

    // Marcar primeiraInicializacaoConcluida como true após o preenchimento manual bem-sucedido
    primeiraInicializacaoConcluida = true;
    localStorage.setItem('primeiraInicializacaoConcluida', 'true');
    localStorage.removeItem('primeiraInicializacaoAlertExibido'); // Remove o alerta de primeira inicialização

    // Apenas garante que os jogadores em campo estão destravados.
    // Os demais (nas filas) manterão seu estado de travamento conforme foi configurado manualmente.
    const allKnownPlayers = new Set([...timeA, ...timeB, ...filaGeral, ...filaEstrela, ...Object.keys(jogadoresStats)]);
    allKnownPlayers.forEach(nome => {
        if (!jogadoresStats[nome]) {
             jogadoresStats[nome] = { pontos: 0, vitorias: 0, derrotas: 0 };
        }
        if (timeA.includes(nome) || timeB.includes(nome)) {
            jogadoresTravados[nome] = false; // Destrava quem está em campo
        } 
        // Se o jogador não foi para o campo, e não tem estado definido, define como destravado (false) por padrão.
        else if (jogadoresTravados[nome] === undefined) {
            jogadoresTravados[nome] = false; // Default: destravado
        }
    });

    localStorage.setItem('jogadoresTravados', JSON.stringify(jogadoresTravados));
    localStorage.setItem('jogadoresStats', JSON.stringify(jogadoresStats)); // Salva stats
    localStorage.setItem('filaGeral', JSON.stringify(filaGeral)); // Salva filas
    localStorage.setItem('filaEstrela', JSON.stringify(filaEstrela));
    localStorage.setItem('estrelasRegistradas', JSON.stringify(estrelasRegistradas));


    alert("Times preenchidos com sucesso! A partida pode começar.");
    atualizarTela();
}

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
        alert("Este jogador está travado e não pode entrar em quadra. Destrave-o na fila primeiro.");
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

    // O jogador que saiu volta para a fila correspondente
    if (estrelasRegistradas.includes(jogadorParaSair)) {
        filaEstrela.push(jogadorParaSair);
    } else {
        filaGeral.push(jogadorParaSair);
    }
    
    // Garante que o jogador que entra na quadra está destravado.
    jogadoresTravados[jogadorParaEntrar] = false; 
    
    // O jogador que sai deve manter seu estado de travamento que tinha antes.
    if (jogadoresTravados[jogadorParaSair] === undefined) {
        jogadoresTravados[jogadorParaSair] = false; // Default: destravado
    }

    localStorage.setItem('jogadoresTravados', JSON.stringify(jogadoresTravados)); // Salva o estado atual

    atualizarTela();
}

function verificarVitoriaPartida() {
    const minPontos = pontosVitoria;

    // REGRA 1: Verificação para "Sai os Dois" (tem a maior prioridade e é muito específica)
    if (tipoDesempate === 'saiOsDois' && placarA === (minPontos - 1) && placarB === (minPontos - 1)) {
        return 'ambosSaem';
    }

    // Define se o jogo está na "zona de desempate"
    const emDesempate = placarA >= minPontos - 1 && placarB >= minPontos - 1;

    if (emDesempate) {
        // --- MODO DESEMPATE ATIVO ---
        // Se entrou aqui, SÓ as regras de desempate valem.

        if (tipoDesempate === 'diferenca') {
            if (placarA >= minPontos && placarA >= placarB + 2) return 'A';
            if (placarB >= minPontos && placarB >= placarA + 2) return 'B';
        }    
        else if (tipoDesempate === 'adicional') {
            const pontoVitoriaAdicional = minPontos + 2;
            if (placarA === pontoVitoriaAdicional) return 'A';
            if (placarB === pontoVitoriaAdicional) return 'B';
        }
        // Se a regra é 'saiOsDois' mas o placar já passou de minPontos-1 (e não terminou no empate exato),
        // ela se comporta como uma regra de diferença de 2.
        else if (tipoDesempate === 'saiOsDois') {
            if (placarA >= minPontos && placarA >= placarB + 2) return 'A';
            if (placarB >= minPontos && placarB >= placarA + 2) return 'B';
        }

    } else {
        // --- MODO DE VITÓRIA PADRÃO ---
        // Só entra aqui se o jogo NÃO está em desempate.
        // O primeiro a atingir 'minPontos' vence.
        if (placarA >= minPontos) return 'A';
        if (placarB >= minPontos) return 'B';
    }

    // Se nenhuma condição de vitória foi atendida, o jogo continua.
    return null;
}

function marcarPonto(time, jogador) {
    salvarEstadoAtual();
    if (!jogadoresStats[jogador]) {
        jogadoresStats[jogador] = { pontos: 0, vitorias: 0, derrotas: 0 };
    }
    jogadoresStats[jogador].pontos++;

    if (time === 'A') placarA++;
    else placarB++;

    // Marcar primeiraInicializacaoConcluida se for a primeira vez que um ponto é marcado
    if (!primeiraInicializacaoConcluida && (placarA > 0 || placarB > 0)) {
        primeiraInicializacaoConcluida = true;
        localStorage.setItem('primeiraInicializacaoConcluida', 'true');
        localStorage.removeItem('primeiraInicializacaoAlertExibido'); 
    }

    const vencedor = verificarVitoriaPartida();
    if (vencedor) {
        registrarVitoria(vencedor);
    }
    // Salva jogadoresStats após cada ponto para persistência imediata
    localStorage.setItem('jogadoresStats', JSON.stringify(jogadoresStats)); 
    atualizarTela();

    // NOVO: Salvar o estado do jogo no Firestore após cada ponto
    salvarEstadoDoJogoNoFirestore(); 
}

function registrarVitoria(vencedor) {
    salvarEstadoAtual();
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

    // NOVO: Adiciona o registro no histórico de partidas ANTES de redefinir timeA/timeB
    historicoPartidas.unshift({
        timeA: [...timeA], // Clona arrays para o histórico
        timeB: [...timeB], // Clona arrays para o histórico
        placarFinalA: placarA,
        placarFinalB: placarB,
        vencedor: vencedor === 'ambosSaem' ? 'Empate/Ambos Saíram' : `Time ${vencedor}`,
        data: new Date().toLocaleString('pt-BR')
    });
    // NOVO: Salva o histórico de partidas no localStorage
    // localStorage.setItem('historicoPartidas', JSON.stringify(historicoPartidas)); // Se quiser persistir o histórico

    // Marcar primeiraInicializacaoConcluida como true após a primeira vitória
    if (!primeiraInicializacaoConcluida) {
        primeiraInicializacaoConcluida = true;
        localStorage.setItem('primeiraInicializacaoConcluida', 'true');
        localStorage.removeItem('primeiraInicializacaoAlertExibido'); 
    }


    let jogadoresParaFila = [];
    if (vencedor === 'ambosSaem' || vitoriasA >= maxVitoriasConsecutivas || vitoriasB >= maxVitoriasConsecutivas) {
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
    // Ao adicionar jogadores de volta às filas, garanta que seu estado existente seja mantido.
    // Se o jogador não tem um estado definido ainda, ele será destravado por padrão (false).
    jogadoresParaFila.forEach(j => {
        if (jogadoresTravados[j] === undefined) {
             jogadoresTravados[j] = false; // Se nunca foi definido, assume destravado ao ir para a fila
        }
        if (estrelasRegistradas.includes(j)) {
            filaEstrela.push(j);
        } else {
            filaGeral.push(j);
        }
    });

    const filaGeralDisponivel = filaGeral.filter(j => !jogadoresTravados[j]);
    const filaEstrelaDisponivel = filaEstrela.filter(j => !jogadoresTravados[j]);
    
    const estrelasParaAlocar = Math.max(0, estrelasPorTime);
    const jogadoresGeraisPorTimeCalc = jogadoresPorTime - estrelasParaAlocar;

    if (jogadoresGeraisPorTimeCalc < 0 && (timeA.length === 0 || timeB.length === 0)) {
        alert(`Configuração inválida para formar novo(s) time(s): O número de jogadores por time (${jogadoresPorTime}) é menor que o mínimo de estrelas por time (${estrelasParaAlocar}). Ajuste nas configurações.`);
        placarA = 0;
        placarB = 0;
        atualizarTela();
        return;
    }
    
    if (timeA.length === 0 && timeB.length === 0) {
        if (filaEstrelaDisponivel.length >= (estrelasParaAlocar * 2) && filaGeralDisponivel.length >= (jogadoresGeraisPorTimeCalc * 2)) {
            for (let i = 0; i < estrelasParaAlocar; i++) {
                timeA.push(filaEstrelaDisponivel.shift());
                timeB.push(filaEstrelaDisponivel.shift());
            }
            for (let i = 0; i < jogadoresGeraisPorTimeCalc; i++) {
                timeA.push(filaGeralDisponivel.shift());
                timeB.push(filaGeralDisponivel.shift());
            }
            // Destravar os jogadores que entraram em campo
            timeA.forEach(j => jogadoresTravados[j] = false);
            timeB.forEach(j => jogadoresTravados[j] = false);
        } else {
            // Se for primeiraInicializacaoConcluida, avisa que não pode formar
            if (primeiraInicializacaoConcluida) {
                alert("Não há jogadores suficientes disponíveis nas filas para formar novos times com o mínimo de estrelas configurado. Adicione mais jogadores ou destrave-os.");
            }
        }
    } else if (timeB.length === 0) { // Time B saiu, formar novo Time B
        if (filaEstrelaDisponivel.length >= estrelasParaAlocar && filaGeralDisponivel.length >= jogadoresGeraisPorTimeCalc) {
            for (let i = 0; i < estrelasParaAlocar; i++) {
                timeB.push(filaEstrelaDisponivel.shift());
            }
            for (let i = 0; i < jogadoresGeraisPorTimeCalc; i++) {
                timeB.push(filaGeralDisponivel.shift());
            }
            timeB.forEach(j => jogadoresTravados[j] = false); // Destravar novos jogadores do Time B
        } else {
            alert("Não há jogadores suficientes disponíveis nas filas para formar o Time B com o mínimo de estrelas configurado.");
        }
    } else if (timeA.length === 0) { // Time A saiu, formar novo Time A
        if (filaEstrelaDisponivel.length >= estrelasParaAlocar && filaGeralDisponivel.length >= jogadoresGeraisPorTimeCalc) {
            for (let i = 0; i < estrelasParaAlocar; i++) {
                timeA.push(filaEstrelaDisponivel.shift());
            }
            for (let i = 0; i < jogadoresGeraisPorTimeCalc; i++) {
                timeA.push(filaGeralDisponivel.shift());
            }
            timeA.forEach(j => jogadoresTravados[j] = false); // Destravar novos jogadores do Time A
        } else {
            alert("Não há jogadores suficientes disponíveis nas filas para formar o Time A com o mínimo de estrelas configurado.");
        }
    }

    filaGeral = filaGeral.filter(j => !timeA.includes(j) && !timeB.includes(j));
    filaEstrela = filaEstrela.filter(j => !timeA.includes(j) && !timeB.includes(j));

    placarA = 0;
    placarB = 0;

    // NOVO: Salvamento explícito e final de TODOS os estados relevantes após uma vitória.
    // Isso garante que os dados atualizados sejam persistidos antes da próxima atualização de tela ou recarga.
    // Garante que o estado de travados de TODOS os jogadores conhecidos seja salvo.
    const allKnownPlayersAfterVictory = new Set([...timeA, ...timeB, ...filaGeral, ...filaEstrela, ...Object.keys(jogadoresStats)]);
    allKnownPlayersAfterVictory.forEach(nome => {
        if (!jogadoresStats[nome]) {
             jogadoresStats[nome] = { pontos: 0, vitorias: 0, derrotas: 0 };
        }
        // Se o jogador está em campo, ele DEVE estar destravado.
        if (timeA.includes(nome) || timeB.includes(nome)) {
            jogadoresTravados[nome] = false;
        } 
        // Se o jogador NÃO está em campo (ou seja, está nas filas)
        // E ele não tem um estado 'jogadoresTravados' definido (é um jogador novo ou resetado sem estado)
        // Então o travamos por padrão.
        else if (jogadoresTravados[nome] === undefined) {
            jogadoresTravados[nome] = false; // Mantenha como destravado por padrão se não tem estado e não está em campo
        }
        // Se já tinha um estado (true/false) e não está em campo, mantém esse estado.
    });

    localStorage.setItem('jogadoresStats', JSON.stringify(jogadoresStats));
    localStorage.setItem('jogadoresTravados', JSON.stringify(jogadoresTravados)); // Salva o estado atualizado
    localStorage.setItem('filaGeral', JSON.stringify(filaGeral));
    localStorage.setItem('filaEstrela', JSON.stringify(filaEstrela));
    localStorage.setItem('estrelasRegistradas', JSON.stringify(estrelasRegistradas));

    atualizarTela();
}


function resetarPlacar() {
    salvarEstadoAtual();
    placarA = 0;
    placarB = 0;
    vitoriasA = 0;
    vitoriasB = 0;
    atualizarTela();
}

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
        if (filaAlvo.includes(nome) || timeA.includes(nome) || timeB.includes(nome)) {
            alert(`O jogador "${nome}" já existe na lista ou em campo.`);
            return;
        }

        if (posicao === 'inicio') {
            filaAlvo.unshift(nome);
        } else {
            filaAlvo.push(nome);
        }

        if (tipoFila === 'estrela' && !estrelasRegistradas.includes(nome)) {
            estrelasRegistradas.push(nome);
            localStorage.setItem('estrelasRegistradas', JSON.stringify(estrelasRegistradas));
        }

        if (!jogadoresStats[nome]) {
            jogadoresStats[nome] = { pontos: 0, vitorias: 0, derrotas: 0 };
        }
        jogadoresTravados[nome] = false; // Jogadores adicionados manualmente sempre começam destravados
        localStorage.setItem('jogadoresStats', JSON.stringify(jogadoresStats)); // Salva stats
        localStorage.setItem('jogadoresTravados', JSON.stringify(jogadoresTravados)); // Salva travados
        localStorage.setItem('filaGeral', JSON.stringify(filaGeral)); // Salva filas
        localStorage.setItem('filaEstrela', JSON.stringify(filaEstrela));


        nomeInput.value = "";
        atualizarTela();
    }
}

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
    delete jogadoresTravados[nomeRemovido]; // Remove do controle de travados
    delete jogadoresStats[nomeRemovido]; // Opcional: remover stats ao remover da fila
    
    // Remover também de estrelasRegistradas se for o caso
    const estrelaIndex = estrelasRegistradas.indexOf(nomeRemovido);
    if (estrelaIndex > -1) {
        estrelasRegistradas.splice(estrelaIndex, 1);
        localStorage.setItem('estrelasRegistradas', JSON.stringify(estrelasRegistradas));
    }

    localStorage.setItem('jogadoresTravados', JSON.stringify(jogadoresTravados));
    localStorage.setItem('jogadoresStats', JSON.stringify(jogadoresStats));
    localStorage.setItem('filaGeral', JSON.stringify(filaGeral));
    localStorage.setItem('filaEstrela', JSON.stringify(filaEstrela));
    atualizarTela();
}


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

    // Atualiza estrelasRegistradas
    const estrelaIndex = estrelasRegistradas.indexOf(nomeAntigo);
    if (estrelaIndex > -1) {
        estrelasRegistradas[estrelaIndex] = novoNome;
        localStorage.setItem('estrelasRegistradas', JSON.stringify(estrelasRegistradas));
    }
    // Se o jogador foi para estrela mas nao estava registrado, adiciona
    if (tipoFila === 'estrela' && !estrelasRegistradas.includes(novoNome)) {
        estrelasRegistradas.push(novoNome);
        localStorage.setItem('estrelasRegistradas', JSON.stringify(estrelasRegistradas));
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
        jogadoresTravados[novoNome] = false; // Default: destravado para novo nome se não tinha histórico
    }

    timeA = timeA.map(j => j === nomeAntigo ? novoNome : j);
    timeB = timeB.map(j => j === nomeAntigo ? novoNome : j);

    localStorage.setItem('jogadoresStats', JSON.stringify(jogadoresStats));
    localStorage.setItem('jogadoresTravados', JSON.stringify(jogadoresTravados));
    localStorage.setItem('filaGeral', JSON.stringify(filaGeral));
    localStorage.setItem('filaEstrela', JSON.stringify(filaEstrela));
    atualizarTela();
}

function embaralharFila(tipoFila) {
    salvarEstadoAtual();
    if (tipoFila === 'geral') {
        shuffleArray(filaGeral);
        localStorage.setItem('filaGeral', JSON.stringify(filaGeral));
    } else if (tipoFila === 'estrela') {
        shuffleArray(filaEstrela);
        localStorage.setItem('filaEstrela', JSON.stringify(filaEstrela));
    }
    atualizarTela();
}

function atualizarRanking() {
    const todosJogadores = new Set([...Object.keys(jogadoresStats), ...filaGeral, ...filaEstrela, ...timeA, ...timeB]);
    const rankingArray = Array.from(todosJogadores)
        .map(nome => {
            if (!jogadoresStats[nome]) {
                jogadoresStats[nome] = { pontos: 0, vitorias: 0, derrotas: 0 };
            }
            // Calculate the new score
            const score = (jogadoresStats[nome].vitorias * 3) + jogadoresStats[nome].pontos;
            return { nome: nome, stats: jogadoresStats[nome], score: score }; // Return an object for clarity
        })
        .filter(entry => entry.stats.pontos > 0 || entry.stats.vitorias > 0 || entry.stats.derrotas > 0)
        .sort((a, b) => {
            // Sort by Score (descending)
            if (b.score !== a.score) {
                return b.score - a.score;
            }
            // If scores are equal, sort by Victories (descending)
            if (b.stats.vitorias !== a.stats.vitorias) {
                return b.stats.vitorias - a.stats.vitorias;
            }
            // If victories are also equal, sort by Points (descending)
            if (b.stats.pontos !== a.stats.pontos) {
                return b.stats.pontos - a.stats.pontos;
            }
            // If points are also equal, sort by Losses (ascending - fewer losses is better)
            return a.stats.derrotas - b.stats.derrotas;
        });

    const rankingHTML = rankingArray.map((entry, index) => {
        const nome = entry.nome;
        const stats = entry.stats;
        const score = entry.score; // Use the calculated score

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

// NOVA FUNÇÃO: Atualiza a seção de Destaques
const getDestaque = (arr, type) => {
    if (arr.length === 0) return { nomes: ['N/A'], valor: 'N/A' }; // Retorna um array de nomes

    let valorDestaque;
    if (type === 'derrotas') { // Para derrotas, queremos o valor MÍNIMO
        valorDestaque = Infinity; // Começa com um valor alto para encontrar o mínimo
        arr.forEach(player => {
            if (player.stats.derrotas < valorDestaque) {
                valorDestaque = player.stats.derrotas;
            }
        });
    } else { // Para score, pontos e vitórias, queremos o valor MÁXIMO
        valorDestaque = -Infinity; // Começa com um valor baixo para encontrar o máximo
        arr.forEach(player => {
            if (type === 'score' && player.score > valorDestaque) {
                valorDestaque = player.score;
            } else if (type === 'pontos' && player.stats.pontos > valorDestaque) {
                valorDestaque = player.stats.pontos;
            } else if (type === 'vitorias' && player.stats.vitorias > valorDestaque) {
                valorDestaque = player.stats.vitorias;
            }
        });
    }

    // Agora, colete TODOS os jogadores que têm esse valor de destaque
    const destaquesEncontrados = arr.filter(player => {
        if (type === 'score') return player.score === valorDestaque;
        if (type === 'pontos') return player.stats.pontos === valorDestaque;
        if (type === 'vitorias') return player.stats.vitorias === valorDestaque;
        if (type === 'derrotas') return player.stats.derrotas === valorDestaque;
        return false;
    });

    // Mapeia para pegar apenas os nomes
    const nomesDestaque = destaquesEncontrados.map(player => player.nome);

    // Retorna um objeto com o array de nomes e o valor
    return { nomes: nomesDestaque.length > 0 ? nomesDestaque : ['N/A'], valor: valorDestaque !== -Infinity && valorDestaque !== Infinity ? valorDestaque : 'N/A' };
};

function atualizarDestaques() {
    const todosJogadoresArray = Object.keys(jogadoresStats).map(nome => {
        return {
            nome: nome,
            stats: jogadoresStats[nome],
            score: (jogadoresStats[nome].vitorias * 3) + jogadoresStats[nome].pontos,
            isEstrela: estrelasRegistradas.includes(nome)
        };
    }).filter(player => player.stats.pontos > 0 || player.stats.vitorias > 0 || player.stats.derrotas > 0); // Apenas jogadores que já jogaram

    const jogadoresGerais = todosJogadoresArray.filter(player => !player.isEstrela);
    const jogadoresEstrela = todosJogadoresArray.filter(player => player.isEstrela);

    // Destaques Fila Geral
    const geralMelhorScore = getDestaque(jogadoresGerais, 'score');
    const geralMaisPontos = getDestaque(jogadoresGerais, 'pontos');
    const geralMaisVitorias = getDestaque(jogadoresGerais, 'vitorias');
    const geralMenosDerrotas = getDestaque(jogadoresGerais, 'derrotas');

    // Use .join(', ') para listar múltiplos nomes, se houver
    document.getElementById('destaqueGeralScore').innerText = `${geralMelhorScore.nomes.join(', ')} (${geralMelhorScore.valor})`;
    document.getElementById('destaqueGeralPontos').innerText = `${geralMaisPontos.nomes.join(', ')} (${geralMaisPontos.valor})`;
    document.getElementById('destaqueGeralVitorias').innerText = `${geralMaisVitorias.nomes.join(', ')} (${geralMaisVitorias.valor})`;
    document.getElementById('destaqueGeralDerrotas').innerText = `${geralMenosDerrotas.nomes.join(', ')} (${geralMenosDerrotas.valor})`;

    // Destaques Fila Estrela
    const estrelaMelhorScore = getDestaque(jogadoresEstrela, 'score');
    const estrelaMaisPontos = getDestaque(jogadoresEstrela, 'pontos');
    const estrelaMaisVitorias = getDestaque(jogadoresEstrela, 'vitorias');
    const estrelaMenosDerrotas = getDestaque(jogadoresEstrela, 'derrotas');

    // Use .join(', ') para listar múltiplos nomes, se houver
    document.getElementById('destaqueEstrelaScore').innerText = `${estrelaMelhorScore.nomes.join(', ')} (${estrelaMelhorScore.valor})`;
    document.getElementById('destaqueEstrelaPontos').innerText = `${estrelaMaisPontos.nomes.join(', ')} (${estrelaMaisPontos.valor})`;
    document.getElementById('destaqueEstrelaVitorias').innerText = `${estrelaMaisVitorias.nomes.join(', ')} (${estrelaMaisVitorias.valor})`;
    document.getElementById('destaqueEstrelaDerrotas').innerText = `${estrelaMenosDerrotas.nomes.join(', ')} (${estrelaMenosDerrotas.valor})`;
}


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

// NOVO: Persiste o estado de travado/destravado no localStorage
function toggleLock(nomeJogador) {
    salvarEstadoAtual();
    jogadoresTravados[nomeJogador] = !jogadoresTravados[nomeJogador];
    localStorage.setItem('jogadoresTravados', JSON.stringify(jogadoresTravados)); // Salva após a alteração
    atualizarTela(); // Recarrega a tela para refletir a mudança visualmente
}

function atualizarTela() {
    // Esconde/mostra a seção de seleção inicial de times
    const selecaoInicialTimesEl = document.getElementById('selecaoInicialTimes');
    const quadraButtons = document.querySelectorAll('.quadra .botoes button'); // Botões de 'Time A Venceu', etc.
    const placarSection = document.querySelector('.placar');
    const timeSections = document.querySelectorAll('.times .time');
    const pontoAvulsoButtons = document.querySelectorAll('.quadra .flex.justify-center.gap-6 button'); // Botões de +1/-1

    // Condição para mostrar a seleção manual dos times: Times vazios E primeira inicialização não concluída
    if (timeA.length === 0 && timeB.length === 0 && !primeiraInicializacaoConcluida) {
        selecaoInicialTimesEl.classList.remove('hidden');
        quadraButtons.forEach(btn => btn.classList.add('hidden')); // Esconde botões de vitória/reset
        placarSection.classList.add('hidden'); // Esconde placar
        timeSections.forEach(sec => sec.classList.add('hidden')); // Esconde Time A/B vazio
        pontoAvulsoButtons.forEach(btn => btn.classList.add('hidden')); // Esconde botões de ponto avulso

        // Preencher os selects para seleção manual
        const selectsTimeA = document.getElementById('selectsTimeA');
        const selectsTimeB = document.getElementById('selectsTimeB');
        
        // Função auxiliar para criar as opções do select
        const createPlayerOptions = (excludePlayers = []) => {
            let optionsHTML = '<option value="-1">Selecione um jogador</option>';
            optionsHTML += '<optgroup label="Fila Geral">';
            // Filtra jogadores da fila geral que não estão excluídos e não estão travados (para seleção manual)
            filaGeral.filter(f => !excludePlayers.includes(f) && !jogadoresTravados[f]).forEach(p => { 
                optionsHTML += `<option value="${p}">${p}</option>`;
            });
            optionsHTML += '</optgroup>';
            optionsHTML += '<optgroup label="Fila Estrela">';
            // Filtra jogadores da fila estrela que não estão excluídos e não estão travados
            filaEstrela.filter(f => !excludePlayers.includes(f) && !jogadoresTravados[f]).forEach(p => { 
                optionsHTML += `<option value="${p}">${p} ⭐</option>`;
            });
            optionsHTML += '</optgroup>';
            return optionsHTML;
        };

        // Renderiza os selects para o Time A
        selectsTimeA.innerHTML = '';
        for (let i = 0; i < jogadoresPorTime; i++) {
            const selectDiv = document.createElement('div');
            selectDiv.className = 'flex items-center gap-2';
            selectDiv.innerHTML = `
                <label class="font-medium text-gray-700 w-8">P${i+1}:</label>
                <select id="selectTimeA${i}" class="flex-1 p-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500">
                    ${createPlayerOptions()}
                </select>
            `;
            selectsTimeA.appendChild(selectDiv);
        }

        // Renderiza os selects para o Time B
        selectsTimeB.innerHTML = '';
        for (let i = 0; i < jogadoresPorTime; i++) {
            const selectDiv = document.createElement('div');
            selectDiv.className = 'flex items-center gap-2';
            selectDiv.innerHTML = `
                <label class="font-medium text-gray-700 w-8">P${i+1}:</label>
                <select id="selectTimeB${i}" class="flex-1 p-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500">
                    ${createPlayerOptions()}
                </select>
            `;
            selectsTimeB.appendChild(selectDiv);
        }
        
        // Adiciona um listener para atualizar as opções dos outros selects ao selecionar um jogador
        const updateSelectOptions = () => {
            const currentSelections = [];
            document.querySelectorAll('#selectsTimeA select, #selectsTimeB select').forEach(s => {
                if (s.value !== '-1') currentSelections.push(s.value);
            });

            document.querySelectorAll('#selectsTimeA select, #selectsTimeB select').forEach(s => {
                const selectedValue = s.value; // Salva o valor selecionado
                const optionsHTML = createPlayerOptions(currentSelections.filter(p => p !== selectedValue));
                s.innerHTML = optionsHTML;
                s.value = selectedValue; // Restaura o valor selecionado
            });
        };

        // Adiciona listeners para atualizar as opções sempre que uma seleção é feita
        document.querySelectorAll('#selectsTimeA select, #selectsTimeB select').forEach(s => {
            s.addEventListener('change', updateSelectOptions);
        });
        updateSelectOptions(); // Chama uma vez para configurar o estado inicial
        
    } else {
        // Se já está no modo automático ou times não estão vazios
        selecaoInicialTimesEl.classList.add('hidden');
        quadraButtons.forEach(btn => btn.classList.remove('hidden')); // Mostra botões de vitória/reset
        placarSection.classList.remove('hidden'); // Mostra placar
        timeSections.forEach(sec => sec.classList.remove('hidden')); // Mostra Time A/B
        pontoAvulsoButtons.forEach(btn => btn.classList.remove('hidden')); // Mostra botões de ponto avulso

        // Seu código existente para renderizar Time A e Time B (jogadores em quadra)
        document.getElementById("timeA").innerHTML = timeA.map((j, i) => `
            <li class="flex items-center p-2 bg-white rounded-md shadow-sm border border-gray-200">
                <div class="flex items-center w-full">
                    <button class="ponto px-3 py-1 bg-green-500 text-white font-bold rounded-md hover:bg-green-600 transition-colors mr-2 text-lg" onclick="marcarPonto('A', '${j.replace(/'/g, "\\'")}')" title="Marcar ponto">+</button>
                    <div class="flex-1 relative">
                        <span class="jogador-nome text-gray-700 font-medium">${j} ${estrelasRegistradas.includes(j) ? '⭐' : ''}</span>
                        <select onchange="if(this.value != -1) trocarJogador('A', ${i}, this.options[this.selectedIndex].dataset.fila, this.value);" class="absolute inset-0 opacity-0 cursor-pointer w-full h-full">
                            <option value="-1">Trocar com...</option>
                            <optgroup label="Fila Geral">
                                ${filaGeral.filter(f => !jogadoresTravados[f]).map((f, idx) => `<option value="${filaGeral.indexOf(f)}" data-fila="geral">${f}</option>`).join("")}
                            </optgroup>
                            <optgroup label="Fila Estrela">
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
                            <optgroup label="Fila Geral">
                                ${filaGeral.filter(f => !jogadoresTravados[f]).map((f, idx) => `<option value="${filaGeral.indexOf(f)}" data-fila="geral">${f}</option>`).join("")}
                            </optgroup>
                            <optgroup label="Fila Estrela">
                                ${filaEstrela.filter(f => !jogadoresTravados[f]).map((f, idx) => `<option value="${filaEstrela.indexOf(f)}" data-fila="estrela">${f} ⭐</option>`).join("")}
                            </optgroup>
                        </select>
                    </div>
                    <span class="ml-auto text-gray-400 text-sm">▼</span>
                </div>
            </li>`).join("");
    }

    document.getElementById("filaGeral").innerHTML = filaGeral.map((j, i) => `
        <li class="flex items-center p-3 bg-white rounded-lg shadow-sm border border-gray-200 ${jogadoresTravados[j] ? 'locked bg-gray-50' : ''}">
            <span class="drag-handle text-gray-400 mr-2 ${jogadoresTravados[j] ? 'cursor-not-allowed opacity-50' : 'cursor-grab'}">☰</span>
            <span class="w-8 text-center text-gray-600">${i + 1}.</span>
            <input type="text" value="${j.replace(/"/g, "&quot;")}" onchange="editarParticipante('geral', ${i}, this.value)" class="flex-1 p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 mr-2 ${jogadoresTravados[j] ? 'bg-gray-200' : ''}"/>
            <span class="lock-icon text-lg ${jogadoresTravados[j] ? 'text-red-500' : 'text-green-500'}" onclick="toggleLock('${j.replace(/'/g, "\\'")}')">
                ${jogadoresTravados[j] ? '<i class="fas fa-lock"></i>' : '<i class="fas fa-lock-open"></i>'}
            </span>
            
        </li>
    `).join("");
	//<button onclick="removerParticipante('geral', ${i})" class="ml-2 px-3 py-1 bg-red-500 text-white font-semibold rounded-md hover:bg-red-600 transition-colors">X</button>

    document.getElementById("filaEstrela").innerHTML = filaEstrela.map((j, i) => `
        <li class="flex items-center p-3 bg-white rounded-lg shadow-sm border border-gray-200 ${jogadoresTravados[j] ? 'locked bg-gray-50' : ''}">
            <span class="drag-handle text-gray-400 mr-2 ${jogadoresTravados[j] ? 'cursor-not-allowed opacity-50' : 'cursor-grab'}">☰</span>
            <span class="w-8 text-center text-gray-600">${i + 1}.</span>
            <input type="text" value="${j.replace(/"/g, "&quot;")}" onchange="editarParticipante('estrela', ${i}, this.value)" class="flex-1 p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 mr-2 ${jogadoresTravados[j] ? 'bg-gray-200' : ''}"/>
            <span class="lock-icon text-lg ${jogadoresTravados[j] ? 'text-red-500' : 'text-green-500'}" onclick="toggleLock('${j.replace(/'/g, "\\'")}')">
                ${jogadoresTravados[j] ? '<i class="fas fa-lock"></i>' : '<i class="fas fa-lock-open"></i>'}
            </span>
            
        </li>
    `).join("");
	//<button onclick="removerParticipante('estrela', ${i})" class="ml-2 px-3 py-1 bg-red-500 text-white font-semibold rounded-md hover:bg-red-600 transition-colors">X</button>
	
    document.getElementById("vitoriasA").innerText = vitoriasA;
    document.getElementById("vitoriasB").innerText = vitoriasB;
    document.getElementById("placarA").innerText = placarA;
    document.getElementById("placarB").innerText = placarB;

    const undoButton = document.getElementById('undoButton');
    if (undoButton) {
        undoButton.disabled = historicoEstados.length === 0;
    }

    atualizarRanking();
    atualizarDestaques(); // Chamada para a nova função
    atualizarStatusPartida();
    setupSortableLists();
}

function setupSortableLists() {
    const setupSortable = (ulElement, filaArray) => {
        if (ulElement.sortableInstance) {
            ulElement.sortableInstance.destroy();
        }
        ulElement.sortableInstance = new Sortable(ulElement, {
            animation: 150,
            handle: '.drag-handle',
            // Removendo o filtro de classe 'locked' para permitir arrastar o item
            // independentemente do estado do cadeado. A lógica de "não pode entrar em campo"
            // continua nos dropdowns e na função trocarJogador.
            // filter: '.locked', // <--- Removido / Comentado
            onMove: function (evt) {
                // Se a intenção é APENAS impedir arrastar para fora da fila,
                // mas permitir reordenar dentro da fila:
                // `evt.related` é o elemento para o qual `evt.dragged` está sendo movido.
                // Se `evt.to` (lista destino) não é o `ulElement` atual, impede.
                if (evt.to !== ulElement) {
                    return !evt.dragged.classList.contains('locked'); // Só pode arrastar para fora da fila se NÃO estiver travado
                }
                return true; // Sempre permite reordenar dentro da mesma fila
            },
            onEnd: function (evt) {
                salvarEstadoAtual();
                const [movedItem] = filaArray.splice(evt.oldIndex, 1);
                filaArray.splice(evt.newIndex, 0, movedItem);
                atualizarTela();
            }
        });
    };
    setupSortable(document.getElementById('filaGeral'), filaGeral);
    setupSortable(document.getElementById('filaEstrela'), filaEstrela);
}

function adicionarPontoAvulso(time) {
    salvarEstadoAtual();
    if (time === 'A') placarA++;
    else if (time === 'B') placarB++;

    const vencedor = verificarVitoriaPartida();
    if (vencedor) {
        registrarVitoria(vencedor);
    }
    // Salva jogadoresStats após cada ponto para persistência imediata
    localStorage.setItem('jogadoresStats', JSON.stringify(jogadoresStats)); 
    atualizarTela();

    // NOVO: Salvar o estado do jogo no Firestore após cada ponto
    salvarEstadoDoJogoNoFirestore(); 
}

function removerPontoAvulso(time) {
    salvarEstadoAtual();
    if (time === 'A' && placarA > 0) placarA--;
    else if (time === 'B' && placarB > 0) placarB--;
    atualizarTela();
}

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
            li.className = backgroundClass + ' p-4 rounded-lg shadow-md mb-3';
            listaHistorico.appendChild(li);
        });
    }
    document.getElementById('modalHistorico').classList.remove('hidden');
}

function fecharHistorico() {
    document.getElementById('modalHistorico').classList.add('hidden');
}

// NOVO: Função para redefinir todos os dados
function redefinirTudo() {
    if (confirm("ATENÇÃO: Tem certeza que deseja redefinir TUDO? Isso apagará todas as estatísticas, histórico de partidas e configurações salvas.")) {
        localStorage.clear(); // Limpa todo o localStorage do seu domínio
        // Reinicializa a variável de controle para a primeira inicialização
        primeiraInicializacaoConcluida = false;
        localStorage.setItem('primeiraInicializacaoConcluida', 'false');
        localStorage.removeItem('primeiraInicializacaoAlertExibido'); // Para reexibir o alerta de primeira vez

        // Recarrega a página para aplicar a redefinição
        location.reload(); 
    }
}

// NOVO: Função auxiliar para salvar o placar atual e o estado das filas no Firestore
function salvarEstadoDoJogoNoFirestore() {
    // Acessa as variáveis globais do Firebase inicializadas no index.html
    if (!window.db) { 
        console.warn("Firestore não inicializado. Não foi possível salvar o estado do jogo.");
        return;
    }

    const placarDocRef = window.doc(window.db, 'statusJogo', 'placarAtual'); // Documento único para placar atual
    const filasDocRef = window.doc(window.db, 'statusJogo', 'filasAtuais'); // Documento único para filas
    const statsDocRef = window.doc(window.db, 'statusJogo', 'statsJogadores'); // Documento único para stats globais

    // Salvar Placar Atual
    window.setDoc(placarDocRef, {
        timeA: placarA,
        timeB: placarB,
        vitoriasA: vitoriasA, // Inclua as vitórias consecutivas também
        vitoriasB: vitoriasB,
        ultimoJogadorMarcou: null, // Pode ser adicionado aqui se quiser rastrear o último jogador
        timestamp: window.serverTimestamp() // Firestore cria um timestamp no servidor
    })
    .then(() => { console.log("Placar atualizado no Firestore!"); })
    .catch(error => { console.error("Erro ao atualizar placar no Firestore:", error); });

    // Salvar Filas Atuais
    window.setDoc(filasDocRef, {
        filaGeral: filaGeral,
        filaEstrela: filaEstrela,
        jogadoresTravados: jogadoresTravados, // Também é importante para a visualização
        estrelasRegistradas: estrelasRegistradas, // Para saber quem é estrela
        timestamp: window.serverTimestamp()
    })
    .then(() => { console.log("Filas atualizadas no Firestore!"); })
    .catch(error => { console.error("Erro ao atualizar filas no Firestore:", error); });

    // Salvar Jogadores Stats Globais (para o ranking e destaques no visualizador)
    window.setDoc(statsDocRef, {
        jogadoresStats: jogadoresStats,
        timestamp: window.serverTimestamp()
    })
    .then(() => { console.log("Estatísticas de jogadores atualizadas no Firestore!"); })
    .catch(error => { console.error("Erro ao atualizar estatísticas no Firestore:", error); });
}


// --- Inicialização da Aplicação ---
carregarDadosIniciais(); // Carrega dados persistidos (stats, travados, filas)

// Popula as filas padrão APENAS SE FOR O PRIMEIRO ACESSO E AS FILAS ESTIVEREM VAZIAS
// E inicializa os jogadores como destravados para a seleção manual
if (!primeiraInicializacaoConcluida && filaGeral.length === 0 && filaEstrela.length === 0) {
    filaGeral = ["Anderson", "Danilo", "Edinho", "Fernando", "Iba", "Julio Cesar", "Kauan", "Lucas", "Marciano", "Mateus Henrique", "Matheus Lael", "Matheus Matos", "Matheus Venturim", "Odair", "Pâmela","Rafael", "Wendel"];
    filaEstrela = ["Daniele", "Guilherme Basso", "Guilherme Ramires", "Lucélia", "Paty", "Taynara"];
    estrelasRegistradas = [...filaEstrela];

    // Salva as filas e estrelas iniciais
    localStorage.setItem('filaGeral', JSON.stringify(filaGeral));
    localStorage.setItem('filaEstrela', JSON.stringify(filaEstrela));
    localStorage.setItem('estrelasRegistradas', JSON.stringify(estrelasRegistradas));

    // Inicializa todos os jogadores como destravados na primeira carga, para que possam ser selecionados
    [...filaGeral, ...filaEstrela].forEach(nome => {
        if (!jogadoresStats[nome]) {
            jogadoresStats[nome] = { pontos: 0, vitorias: 0, derrotas: 0 };
        }
        jogadoresTravados[nome] = false; // Define explicitamente como destravado
    });
    localStorage.setItem('jogadoresStats', JSON.stringify(jogadoresStats));
    localStorage.setItem('jogadoresTravados', JSON.stringify(jogadoresTravados));
} else {
    // Se não é a primeira inicialização OU as filas não estavam vazias (já foram preenchidas/carregadas)
    // Garante que o estado de travado de jogadores em campo seja false
    // E de jogadores nas filas que não foram para campo seja o estado salvo ou false por padrão.
    const allKnownPlayers = new Set([...timeA, ...timeB, ...filaGeral, ...filaEstrela, ...Object.keys(jogadoresStats)]);
    allKnownPlayers.forEach(nome => {
        if (!jogadoresStats[nome]) {
            jogadoresStats[nome] = { pontos: 0, vitorias: 0, derrotas: 0 };
        }
        if (timeA.includes(nome) || timeB.includes(nome)) {
            jogadoresTravados[nome] = false; // Destravado se estiver em campo
        } else if (jogadoresTravados[nome] === undefined) {
            // Se o jogador não está em campo e seu estado não foi definido (jogadores novos ou dados corrompidos),
            // ele é definido como destravado por padrão.
            jogadoresTravados[nome] = false; 
        }
        // Se já tinha um estado (true/false) e não está em campo, mantém esse estado.
    });
    localStorage.setItem('jogadoresTravados', JSON.stringify(jogadoresTravados));
    localStorage.setItem('jogadoresStats', JSON.stringify(jogadoresStats));
    localStorage.setItem('filaGeral', JSON.stringify(filaGeral));
    localStorage.setItem('filaEstrela', JSON.stringify(filaEstrela));
    localStorage.setItem('estrelasRegistradas', JSON.stringify(estrelasRegistradas)); // Garante que estrelas tb sejam salvas
}


iniciarNovoJogo(); // Esta chamada agora gerencia o comportamento de "primeira vez"
historicoEstados = []; // Limpa o histórico ao carregar a página pela primeira vez
atualizarTela();    

window.onclick = function(event) {
    if (event.target === document.getElementById('modalConfig')) {
        fecharConfiguracoes();
    }
    if (event.target === document.getElementById('modalHistorico')) {
        fecharHistorico();
    }
}

// NOVO: Desativar "pull-to-refresh"
document.addEventListener('DOMContentLoaded', () => {
    let lastTouchY = 0; // Para registrar a posição Y do último toque
    let isPulling = false; // Sinaliza se o usuário está puxando para baixo

    document.body.addEventListener('touchstart', (e) => {
        // Registra a posição Y do toque inicial
        lastTouchY = e.touches[0].clientY;
        // Assume que não está puxando inicialmente
        isPulling = false;
    }, { passive: false }); // Use passive: false para poder chamar preventDefault

    document.body.addEventListener('touchmove', (e) => {
        const currentTouchY = e.touches[0].clientY;
        const deltaY = currentTouchY - lastTouchY;

        // Se o scroll está no topo da página (scrollTop é 0)
        // E o usuário está puxando para baixo (deltaY > 0)
        // E ainda não foi identificado como um "pull-to-refresh"
        if (document.documentElement.scrollTop === 0 && deltaY > 0 && !isPulling) {
            isPulling = true; // Marca que está tentando puxar
            e.preventDefault(); // Impede o comportamento padrão (pull-to-refresh)
        } else if (isPulling) {
            // Se já estamos no modo de puxar, continue impedindo o default
            e.preventDefault();
        }
        
        lastTouchY = currentTouchY; // Atualiza a última posição do toque
    }, { passive: false }); // Use passive: false para poder chamar preventDefault

    document.body.addEventListener('touchend', () => {
        isPulling = false; // Reseta o estado quando o toque termina
    });
});