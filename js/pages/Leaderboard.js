import { fetchLeaderboard } from '../content.js';
import { localize } from '../util.js';

import Spinner from '../components/Spinner.js';

export default {
    components: {
        Spinner,
    },

    data: () => ({
        leaderboard: [],
        packCompletion: [],
        loading: true,
        selected: 0,
        err: [],
    }),

    template: `
        <main v-if="loading">
            <Spinner></Spinner>
        </main>

        <main v-else class="page-leaderboard-container">
            <div class="page-leaderboard">


                <div class="leaderboard-switch">
                    <button
                        class="active"
                        @click="$router.push('/leaderboard')">
                        Player Leaderboard
                    </button>
                
                    <button
                        @click="$router.push('/qualityboard')">
                        Creator Leaderboard
                    </button>
                </div>

                <div class="error-container">
                    <p class="error" v-if="err.length > 0">
                        Leaderboard may be incorrect, as the following levels could not be loaded: {{ err.join(', ') }}
                    </p>
                </div>

                <div class="board-container">
                    <table class="board">
                        <tr v-for="(ientry, i) in leaderboard" :key="i">
                            <td class="rank">
                                <p class="type-label-lg">#{{ i + 1 }}</p>
                            </td>
                            <td class="total">
                                <!-- UPDATED TOTAL -->
                                <p class="type-label-lg">
                                    {{ localize(getTotalWithPacks(ientry)) }}
                                </p>
                            </td>
                            <td class="user" :class="{ 'active': selected == i }">
                                <button @click="selected = i">
                                    <span class="type-label-lg">{{ ientry.user }}</span>
                                </button>
                            </td>
                        </tr>
                    </table>
                </div>

                <div class="player-container">
                    <div class="player">

                        <h1>#{{ selected + 1 }} {{ entry.user }}</h1>

                        <!-- UPDATED TOTAL -->
                        <h3>{{ localize(totalWithPacks) }}</h3>

                        <!-- VERIFIED -->
                        <h2 v-if="entry.verified.length > 0">
                            Verified ({{ entry.verified.length }})
                        </h2>
                        <table class="table">
                            <tr v-for="score in entry.verified" :key="score.rank">
                                <td class="rank"><p>#{{ score.rank }}</p></td>
                                <td class="level">
                                    <a class="type-label-lg" target="_blank" :href="score.link">
                                        {{ score.level }}
                                    </a>
                                </td>
                                <td class="score">
                                    <p>+{{ localize(score.score) }}</p>
                                </td>
                            </tr>
                        </table>

                        <!-- TOP 150 -->
                        <h2 v-if="top150.length > 0">
                            Completions ({{ top150.length }})
                        </h2>
                        <table class="table">
                            <tr v-for="score in top150" :key="score.rank">
                                <td class="rank"><p>#{{ score.rank }}</p></td>
                                <td class="level">
                                    <a class="type-label-lg" target="_blank" :href="score.link">
                                        {{ score.level }}
                                    </a>
                                </td>
                                <td class="score">
                                    <p>+{{ localize(score.score) }}</p>
                                </td>
                            </tr>
                        </table>

                        <!-- Legacy -->
                        <h2 v-if="above150.length > 0">
                            Legacy Completions ({{ above150.length }})
                        </h2>
                        <table class="table">
                            <tr v-for="score in above150" :key="score.rank">
                                <td class="rank"><p>Legacy</p></td>
                                <td class="level">
                                    <a class="type-label-lg" target="_blank" :href="score.link">
                                        {{ score.level }}
                                    </a>
                                </td>
                                <td class="score">
                                    <p>+{{ localize(score.score) }}</p>
                                </td>
                            </tr>
                        </table>

                        <!-- PROGRESSED -->
                        <h2 v-if="entry.progressed.length > 0">
                            Progressed ({{ entry.progressed.length }})
                        </h2>
                        <table class="table">
                            <tr v-for="score in entry.progressed" :key="score.rank">
                                <td class="rank"><p>#{{ score.rank }}</p></td>
                                <td class="level">
                                    <a class="type-label-lg" target="_blank" :href="score.link">
                                        {{ score.percent }}% {{ score.level }}
                                    </a>
                                </td>
                                <td class="score">
                                    <p>+{{ localize(score.score) }}</p>
                                </td>
                            </tr>
                        </table>
                        
                        <!-- PACK COMPLETION -->
                        <h2 v-if="playerPacks.length > 0">
                            Pack Completion ({{ playerPacks.length }})
                        </h2>
                        <table class="table">
                            <tr v-for="(score, i) in playerPacks" :key="i">
                                <td class="level">
                                    <p class="type-label-lg">{{ score.level }}</p>
                                </td>
                                <td class="score">
                                    <p>+{{ localize(score.score) }}</p>
                                </td>
                            </tr>
                        </table>

                    </div>
                </div>
            </div>
        </main>
    `,

    computed: {
        entry() {
            return this.leaderboard[this.selected] || {
                completed: [],
                verified: [],
                progressed: [],
                user: '',
                total: 0
            };
        },

        top150() {
            return (this.entry.completed || []).filter(score => score.rank <= 150);
        },

        above150() {
            return (this.entry.completed || []).filter(score => score.rank > 150);
        },

        playerLevelKeys() {
            const completed = this.entry.completed || [];
            const verified = this.entry.verified || [];
        
            return new Set([
                ...completed.map(l => l.level?.toLowerCase().trim()),
                ...verified.map(l => l.level?.toLowerCase().trim())
            ].filter(Boolean));
        },

        playerPacks() {
            if (!Array.isArray(this.packCompletion)) return [];
        
            return this.packCompletion
                .filter(pack =>
                    Array.isArray(pack.levels) &&
                    pack.levels.every(level =>
                        this.playerLevelKeys.has(
                            level.toLowerCase().trim()
                        )
                    )
                )
                .map(pack => ({
                    level: pack.name,
                    score: pack.points
                }));
        },

        // TOTAL WITH PACK BONUS
        totalWithPacks() {
            const base = this.entry.total || 0;

            const bonus = this.playerPacks.reduce(
                (sum, pack) => sum + pack.score,
                0
            );

            return base + bonus;
        }
    },

    async mounted() {
    const [leaderboard, err] = await fetchLeaderboard();

    const excludedUsers = [];

    const filteredLeaderboard = leaderboard
        .filter(entry => !excludedUsers.includes(entry.user))

    this.leaderboard = filteredLeaderboard;

    try {
        const res = await fetch("/data/_completionpacks.json");
        this.packCompletion = await res.json();
    } catch (e) {
        console.error("Failed to load packs", e);
    }

    this.leaderboard.sort((a, b) => {
        return this.getTotalWithPacks(b) - this.getTotalWithPacks(a);
    });

    this.selected = 0;
    this.err = err;
    this.loading = false;
    },

    methods: {
        localize,

        getTotalWithPacks(entry) {
            const completed = entry.completed || [];
            const verified = entry.verified || [];

            const playerKeys = new Set([
                ...completed.map(l => l.level?.toLowerCase().trim()),
                ...verified.map(l => l.level?.toLowerCase().trim())
            ].filter(Boolean));

            let bonus = 0;

            for (const pack of this.packCompletion) {
                if (
                    Array.isArray(pack.levels) &&
                    pack.levels.every(level =>
                        playerKeys.has(level.toLowerCase().trim())
                    )
                ) {
                    bonus += pack.points;
                }
            }

            return (entry.total || 0) + bonus;
        }
    },
};
