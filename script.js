document.addEventListener('DOMContentLoaded', () => {
    fetchData();
});

const fetchData = async () => {
    try {
        const response = await fetch('data.json');
        const data = await response.json();
        renderData(data);
    } catch (error) {
        console.error('Error al cargar los datos:', error);
        document.getElementById('upcoming-matches').innerHTML = `<p>Error al cargar la información. Intente recargar la página.</p>`;
    }
};

const renderData = (data) => {
    renderUpcomingMatches(data.upcomingMatches);
    renderResults(data.pastMatches);
    calculateAndRenderStandings(data.pastMatches, data.teams, data.groups);
    calculateAndRenderTopScorers(data.pastMatches);
    calculateAndRenderCleanSheets(data.pastMatches, data.teams);
    calculateAndRenderCards(data.pastMatches);
};

// Funciones para renderizar las secciones
const renderUpcomingMatches = (matches) => {
    const container = document.getElementById('upcoming-matches');
    if (matches.length === 0) {
        container.innerHTML = `<p>Aún no hay partidos próximos. ¡Manténgase atento!</p>`;
        return;
    }
    container.innerHTML = matches.map(match => `
        <div class="match-item">
            <span>${match.teamA} vs ${match.teamB}</span>
            <span>${match.date}</span>
        </div>
    `).join('');
};

const renderResults = (matches) => {
    const container = document.getElementById('recent-results');
    const recentMatches = matches.slice(-5); // Mostrar solo los últimos 5 resultados
    if (recentMatches.length === 0) {
        container.innerHTML = `<p>Aún no hay resultados de partidos.</p>`;
        return;
    }
    container.innerHTML = recentMatches.map(match => `
        <div class="match-item">
            <span>${match.teamA}</span>
            <span class="score">${match.goalsA} - ${match.goalsB}</span>
            <span>${match.teamB}</span>
        </div>
    `).join('');
};

const calculateAndRenderStandings = (matches, teams, groups) => {
    const standings = {};
    teams.forEach(team => {
        standings[team.name] = {
            points: 0,
            played: 0,
            wins: 0,
            draws: 0,
            losses: 0,
            goalsFor: 0,
            goalsAgainst: 0,
            goalDifference: 0,
            group: team.group
        };
    });

    matches.forEach(match => {
        const teamA = standings[match.teamA];
        const teamB = standings[match.teamB];

        teamA.played++;
        teamB.played++;
        teamA.goalsFor += match.goalsA;
        teamA.goalsAgainst += match.goalsB;
        teamB.goalsFor += match.goalsB;
        teamB.goalsAgainst += match.goalsA;

        if (match.goalsA > match.goalsB) {
            teamA.wins++;
            teamA.points += 3;
            teamB.losses++;
        } else if (match.goalsA < match.goalsB) {
            teamB.wins++;
            teamB.points += 3;
            teamA.losses++;
        } else {
            teamA.draws++;
            teamA.points += 1;
            teamB.draws++;
            teamB.points += 1;
        }

        teamA.goalDifference = teamA.goalsFor - teamA.goalsAgainst;
        teamB.goalDifference = teamB.goalsFor - teamB.goalsAgainst;
    });

    const container = document.getElementById('group-tables');
    container.innerHTML = '';
    
    groups.forEach(groupName => {
        const groupStandings = Object.values(standings)
            .filter(team => team.group === groupName)
            .sort((a, b) => b.points - a.points || b.goalDifference - a.goalDifference);
        
        const tableHtml = `
            <div class="app-section group-table">
                <h3>Grupo ${groupName}</h3>
                <table>
                    <thead>
                        <tr>
                            <th>Equipo</th>
                            <th>PJ</th>
                            <th>PTS</th>
                            <th>GF</th>
                            <th>GC</th>
                            <th>DG</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${groupStandings.map(team => `
                            <tr>
                                <td>${team.name}</td>
                                <td>${team.played}</td>
                                <td>${team.points}</td>
                                <td>${team.goalsFor}</td>
                                <td>${team.goalsAgainst}</td>
                                <td>${team.goalDifference}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        `;
        container.innerHTML += tableHtml;
    });
};

const calculateAndRenderTopScorers = (matches) => {
    const scorers = {};
    matches.forEach(match => {
        match.scorers.forEach(scorer => {
            if (scorers[scorer.player]) {
                scorers[scorer.player].goals += scorer.goals;
            } else {
                scorers[scorer.player] = { player: scorer.player, team: scorer.team, goals: scorer.goals };
            }
        });
    });

    const topScorers = Object.values(scorers).sort((a, b) => b.goals - a.goals).slice(0, 5); // Top 5
    const container = document.getElementById('top-scorers-list');
    if (topScorers.length === 0) {
        container.innerHTML = `<p>Aún no hay goleadores.</p>`;
        return;
    }
    container.innerHTML = topScorers.map(scorer => `
        <div class="stats-item">
            <span class="player-name">${scorer.player} (${scorer.team})</span>
            <span class="stat-value">${scorer.goals}</span>
        </div>
    `).join('');
};

const calculateAndRenderCleanSheets = (matches, teams) => {
    const goalsAgainst = {};
    teams.forEach(team => {
        goalsAgainst[team.name] = { team: team.name, goals: 0 };
    });

    matches.forEach(match => {
        if (goalsAgainst[match.teamA]) {
            goalsAgainst[match.teamA].goals += match.goalsB;
        }
        if (goalsAgainst[match.teamB]) {
            goalsAgainst[match.teamB].goals += match.goalsA;
        }
    });

    const sortedTeams = Object.values(goalsAgainst).sort((a, b) => a.goals - b.goals).slice(0, 5); // Top 5
    const container = document.getElementById('clean-sheet-list');
    if (sortedTeams.length === 0) {
        container.innerHTML = `<p>Aún no hay datos de goles recibidos.</p>`;
        return;
    }
    container.innerHTML = sortedTeams.map(team => `
        <div class="stats-item">
            <span class="player-name">${team.team}</span>
            <span class="stat-value">${team.goals}</span>
        </div>
    `).join('');
};

const calculateAndRenderCards = (matches) => {
    const cards = {};
    matches.forEach(match => {
        match.cards.forEach(card => {
            if (!cards[card.player]) {
                cards[card.player] = { player: card.player, yellow: 0, red: 0, suspended: false };
            }
            if (card.type === 'yellow') {
                cards[card.player].yellow++;
            } else if (card.type === 'red') {
                cards[card.player].red++;
            }
            if (cards[card.player].yellow >= 3) {
                cards[card.player].suspended = true;
            }
        });
    });

    const sortedCards = Object.values(cards).sort((a, b) => (b.yellow + b.red) - (a.yellow + a.red)).slice(0, 5); // Top 5
    const container = document.getElementById('cards-list');
    if (sortedCards.length === 0) {
        container.innerHTML = `<p>Aún no hay jugadores con tarjetas.</p>`;
        return;
    }
    container.innerHTML = sortedCards.map(card => `
        <div class="stats-item">
            <span class="player-name">${card.player}</span>
            <span class="stat-value">
                <span class="card-icon yellow"></span>${card.yellow} 
                <span class="card-icon red"></span>${card.red}
                ${card.suspended ? '<span class="suspended-text"> (Susp.)</span>' : ''}
            </span>
        </div>
    `).join('');
};