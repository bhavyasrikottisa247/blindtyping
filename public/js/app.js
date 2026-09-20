/**
 * Main Application Router & Controller for BCAlgorix 2k26
 * Controls SPA Navigation, User State, Toast Notifications, and Level Flows
 */

const app = {
    currentUser: null,
    completedLevels: [],
    attemptsMap: {},

    init() {
        Auth.init();
        this.initApp();

        // Logout listener
        const btnLogout = document.getElementById('btnLogout');
        if (btnLogout) {
            btnLogout.addEventListener('click', () => this.logout());
        }
    },

    async initApp() {
        const token = Auth.getToken();

        if (!token) {
            this.showView('authView');
            this.updateHeaderUser(null);
            return;
        }

        try {
            const res = await fetch('/api/auth/me', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();

            if (!res.ok) {
                Auth.clearSession();
                this.showView('authView');
                this.updateHeaderUser(null);
                return;
            }

            this.currentUser = data.user;
            this.completedLevels = data.completedLevels || [];

            // Build map of completed level attempts
            this.attemptsMap = {};
            if (data.attempts) {
                data.attempts.forEach(a => {
                    this.attemptsMap[a.level] = a;
                });
            }

            this.updateHeaderUser(this.currentUser);

            if (this.currentUser.role === 'admin') {
                this.showView('adminView');
                AdminConsole.init();
            } else {
                this.showView('dashboardView');
                this.renderDashboard();
            }
        } catch (err) {
            console.error('Session init error:', err);
            Auth.clearSession();
            this.showView('authView');
        }
    },

    showView(viewId) {
        document.querySelectorAll('.view-section').forEach(sec => {
            sec.classList.remove('active');
        });
        const targetView = document.getElementById(viewId);
        if (targetView) {
            targetView.classList.add('active');
        }
    },

    updateHeaderUser(user) {
        const badge = document.getElementById('userBadge');
        if (!user) {
            if (badge) badge.classList.add('hidden');
            return;
        }
        if (badge) badge.classList.remove('hidden');

        const roleTag = document.getElementById('userRoleTag');
        const nameText = document.getElementById('userNameText');
        const sucTag = document.getElementById('userSucTag');
        const secBadge = document.getElementById('userSectionBadge');

        if (user.role === 'admin') {
            if (roleTag) roleTag.innerHTML = '<i class="fa-solid fa-shield-halved"></i> Admin';
            if (nameText) nameText.textContent = user.fullName;
            if (sucTag) sucTag.style.display = 'none';
            if (secBadge) secBadge.style.display = 'none';
        } else {
            if (roleTag) roleTag.innerHTML = '<i class="fa-solid fa-user-graduate"></i> Student';
            if (nameText) nameText.textContent = user.fullName;
            if (sucTag) {
                sucTag.style.display = 'inline-block';
                sucTag.textContent = `SUC: ${user.suc}`;
            }
            if (secBadge) {
                secBadge.style.display = 'inline-block';
                secBadge.textContent = `Sec ${user.section}`;
            }
        }
    },

    renderDashboard() {
        if (!this.currentUser) return;

        document.getElementById('dashStudentName').textContent = this.currentUser.fullName;

        // Calculate overall score sum
        let overallScoreSum = 0;
        Object.values(this.attemptsMap).forEach(a => {
            overallScoreSum += (a.score || 0);
        });
        document.getElementById('dashOverallScore').textContent = overallScoreSum;

        // Level 1 Card
        const tag1 = document.getElementById('tagLevel1');
        const btn1 = document.getElementById('btnStartL1');
        const prev1 = document.getElementById('previewLevel1');
        if (this.completedLevels.includes(1)) {
            tag1.textContent = 'Completed';
            tag1.style.background = 'rgba(16, 185, 129, 0.2)';
            tag1.style.color = '#34D399';
            btn1.disabled = true;
            btn1.innerHTML = '<i class="fa-solid fa-circle-check"></i> Completed';

            const a1 = this.attemptsMap[1];
            if (a1 && prev1) {
                prev1.classList.remove('hidden');
                document.getElementById('wpmL1').textContent = a1.wpm;
                document.getElementById('accL1').textContent = `${a1.accuracy}%`;
            }
        } else {
            tag1.textContent = 'Available';
            btn1.disabled = false;
            btn1.innerHTML = '<i class="fa-solid fa-play"></i> Start Level 1';
        }

        // Level 2 Card
        const card2 = document.getElementById('cardLevel2');
        const tag2 = document.getElementById('tagLevel2');
        const btn2 = document.getElementById('btnStartL2');
        const prev2 = document.getElementById('previewLevel2');

        if (this.completedLevels.includes(2)) {
            card2.classList.remove('locked');
            tag2.textContent = 'Completed';
            tag2.style.background = 'rgba(16, 185, 129, 0.2)';
            tag2.style.color = '#34D399';
            btn2.disabled = true;
            btn2.innerHTML = '<i class="fa-solid fa-circle-check"></i> Completed';

            const a2 = this.attemptsMap[2];
            if (a2 && prev2) {
                prev2.classList.remove('hidden');
                document.getElementById('wpmL2').textContent = a2.wpm;
                document.getElementById('accL2').textContent = `${a2.accuracy}%`;
            }
        } else if (this.completedLevels.includes(1)) {
            card2.classList.remove('locked');
            tag2.textContent = 'Available';
            btn2.disabled = false;
            btn2.innerHTML = '<i class="fa-solid fa-play"></i> Start Level 2';
        } else {
            card2.classList.add('locked');
            tag2.textContent = 'Locked';
            btn2.disabled = true;
            btn2.innerHTML = '<i class="fa-solid fa-lock"></i> Complete Level 1 First';
        }

        // Level 3 Card
        const card3 = document.getElementById('cardLevel3');
        const tag3 = document.getElementById('tagLevel3');
        const btn3 = document.getElementById('btnStartL3');
        const prev3 = document.getElementById('previewLevel3');

        if (this.completedLevels.includes(3)) {
            card3.classList.remove('locked');
            tag3.textContent = 'Completed';
            tag3.style.background = 'rgba(16, 185, 129, 0.2)';
            tag3.style.color = '#34D399';
            btn3.disabled = true;
            btn3.innerHTML = '<i class="fa-solid fa-circle-check"></i> Completed';

            const a3 = this.attemptsMap[3];
            if (a3 && prev3) {
                prev3.classList.remove('hidden');
                document.getElementById('wpmL3').textContent = a3.wpm;
                document.getElementById('accL3').textContent = `${a3.accuracy}%`;
            }
        } else if (this.completedLevels.includes(2)) {
            card3.classList.remove('locked');
            tag3.textContent = 'Available';
            btn3.disabled = false;
            btn3.innerHTML = '<i class="fa-solid fa-play"></i> Start Level 3';
        } else {
            card3.classList.add('locked');
            tag3.textContent = 'Locked';
            btn3.disabled = true;
            btn3.innerHTML = '<i class="fa-solid fa-lock"></i> Complete Level 2 First';
        }
    },

    async startLevel(levelNum) {
        if (this.completedLevels.includes(levelNum)) {
            this.showToast(`Level ${levelNum} has already been completed. Retries are strictly not allowed.`, 'error');
            return;
        }

        const token = Auth.getToken();
        try {
            const res = await fetch(`/api/challenge/level/${levelNum}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();

            if (!res.ok) {
                this.showToast(data.error || 'Failed to start challenge level.', 'error');
                return;
            }

            // Set up Arena UI
            const levelTitles = {
                1: 'Level 1: Simple Paragraph',
                2: 'Level 2: Complex Paragraph with Punctuations',
                3: 'Level 3: Technical Code Challenge'
            };
            const levelPills = {
                1: 'Backspace Allowed • Visible Typing',
                2: 'NO Backspace • Visible Typing',
                3: 'NO Backspace • Masked with *'
            };

            document.getElementById('arenaLevelTitle').innerHTML = `<i class="fa-solid fa-keyboard"></i> ${levelTitles[levelNum]}`;
            document.getElementById('arenaLevelSpecs').textContent = levelPills[levelNum];

            this.showView('typingView');
            TypingEngine.init(levelNum, data.text, data.rules);
        } catch (err) {
            console.error('Error starting level:', err);
            this.showToast('Error loading level paragraph.', 'error');
        }
    },

    confirmExitArena() {
        if (TypingEngine.isStarted && !TypingEngine.isFinished) {
            if (confirm('Warning: Exiting now will submit your current progress! Are you sure you want to exit?')) {
                TypingEngine.finishTest();
            }
        } else {
            this.showDashboard();
        }
    },

    showDashboard() {
        this.initApp();
    },

    showResultsModal(levelNum, stats, score) {
        document.getElementById('resLevelTitle').textContent = `Level ${levelNum} Result Summary`;
        document.getElementById('resWpm').textContent = stats.wpm;
        document.getElementById('resAccuracy').textContent = `${stats.accuracy}%`;

        const mins = String(Math.floor(stats.timeTakenSeconds / 60)).padStart(2, '0');
        const secs = String(stats.timeTakenSeconds % 60).padStart(2, '0');
        document.getElementById('resTime').textContent = `${mins}:${secs}`;

        document.getElementById('resWordsTotal').textContent = stats.totalWords;
        document.getElementById('resWordsCorrect').textContent = stats.correctWords;
        document.getElementById('resWordsIncorrect').textContent = stats.incorrectWords;

        document.getElementById('resCharsTotal').textContent = stats.totalChars;
        document.getElementById('resCharsCorrect').textContent = stats.correctChars;
        document.getElementById('resCharsIncorrect').textContent = stats.incorrectChars;

        document.getElementById('resScore').textContent = score;

        const nextBtn = document.getElementById('btnNextLevelAction');
        if (levelNum < 3) {
            nextBtn.style.display = 'inline-flex';
            nextBtn.innerHTML = `<i class="fa-solid fa-forward"></i> Proceed to Level ${levelNum + 1}`;
            nextBtn.onclick = () => {
                this.closeResultsModal();
                this.startLevel(levelNum + 1);
            };
        } else {
            nextBtn.style.display = 'none';
        }

        document.getElementById('resultsModal').classList.remove('hidden');
    },

    closeResultsModal() {
        document.getElementById('resultsModal').classList.add('hidden');
        this.showDashboard();
    },

    async showLeaderboard() {
        const token = Auth.getToken();
        try {
            const res = await fetch('/api/challenge/leaderboard', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();

            this.showView('leaderboardView');

            const lockedBox = document.getElementById('lbLockedState');
            const revealedContent = document.getElementById('lbRevealedContent');

            if (!data.revealed) {
                lockedBox.classList.remove('hidden');
                revealedContent.classList.add('hidden');
            } else {
                lockedBox.classList.add('hidden');
                revealedContent.classList.remove('hidden');
                this.renderLeaderboardTable(data.leaderboard);
                this.bindLeaderboardFilters(data.leaderboard);
            }
        } catch (err) {
            this.showToast('Error loading leaderboard.', 'error');
        }
    },

    bindLeaderboardFilters(fullList) {
        const btns = document.querySelectorAll('.lb-filter-btn');
        btns.forEach(btn => {
            btn.onclick = () => {
                btns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                const sec = btn.getAttribute('data-sec');
                const filtered = (sec === 'ALL') ? fullList : fullList.filter(s => s.section === sec);
                this.renderLeaderboardTable(filtered);
            };
        });
    },

    renderLeaderboardTable(list) {
        const tbody = document.getElementById('lbTableBody');
        if (!tbody) return;
        tbody.innerHTML = '';

        if (!list || list.length === 0) {
            tbody.innerHTML = `<tr><td colspan="9" style="text-align:center; padding:2rem; color:var(--silver-muted);">No student rankings available yet.</td></tr>`;
            return;
        }

        list.forEach((s, idx) => {
            const tr = document.createElement('tr');
            const formatTime = (secs) => {
                const m = String(Math.floor(secs / 60)).padStart(2, '0');
                const sc = String(secs % 60).padStart(2, '0');
                return `${m}:${sc}`;
            };

            tr.innerHTML = `
                <td><span class="rank-badge ${idx === 0 ? 'rank-1' : idx === 1 ? 'rank-2' : idx === 2 ? 'rank-3' : 'rank-other'}">${idx + 1}</span></td>
                <td><strong>${s.fullName}</strong></td>
                <td>${s.suc}</td>
                <td><span class="user-section-badge">Sec ${s.section}</span></td>
                <td><span class="user-role-tag" style="background:rgba(158,27,83,0.5);">${s.levelsCompleted} / 3</span></td>
                <td><strong>${s.totalWpm}</strong></td>
                <td>${s.avgAccuracy}%</td>
                <td>${formatTime(s.totalTimeSeconds)}</td>
                <td><strong style="color:var(--gold-accent); font-size:1.05rem;">${s.overallScore}</strong></td>
            `;
            tbody.appendChild(tr);
        });
    },

    showToast(message, type = 'info') {
        const container = document.getElementById('toastContainer');
        if (!container) return;

        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.innerHTML = `<i class="fa-solid ${type === 'error' ? 'fa-circle-exclamation' : 'fa-circle-check'}"></i> ${message}`;

        container.appendChild(toast);

        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transform = 'translateX(20px)';
            setTimeout(() => toast.remove(), 300);
        }, 4000);
    },

    logout() {
        Auth.clearSession();
        this.currentUser = null;
        this.completedLevels = [];
        this.attemptsMap = {};
        this.showToast('You have been logged out.', 'info');
        this.initApp();
    }
};

window.app = app;

document.addEventListener('DOMContentLoaded', () => {
    app.init();
});
