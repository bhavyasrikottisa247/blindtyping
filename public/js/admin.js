/**
 * Admin Console Module for BCAlgorix 2k26
 * Paragraph editing, leaderboard reveal toggle, and student scorecard management
 */

const AdminConsole = {
    settings: null,
    studentList: [],

    async init() {
        // Tab switching
        const tabBtns = document.querySelectorAll('.admin-tab-btn');
        tabBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const targetTab = btn.getAttribute('data-admin-tab');
                tabBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');

                document.querySelectorAll('.admin-tab-content').forEach(c => c.classList.remove('active'));

                if (targetTab === 'paragraphs') {
                    document.getElementById('tabParagraphs').classList.add('active');
                } else if (targetTab === 'leaderboardControl') {
                    document.getElementById('tabLeaderboardControl').classList.add('active');
                } else if (targetTab === 'studentReports') {
                    document.getElementById('tabStudentReports').classList.add('active');
                }
            });
        });

        // Form Submit handler for Paragraph updates
        const form = document.getElementById('formAdminParagraphs');
        if (form) {
            form.addEventListener('submit', async (e) => {
                e.preventDefault();
                await this.saveParagraphs();
            });
        }

        // Realtime Char Count Update listeners
        ['adminLevel1Text', 'adminLevel2Text', 'adminLevel3Text'].forEach((id, idx) => {
            const el = document.getElementById(id);
            if (el) {
                el.addEventListener('input', () => {
                    document.getElementById(`countL${idx + 1}`).textContent = `${el.value.length} chars`;
                });
            }
        });

        await this.loadAdminData();
    },

    async loadAdminData() {
        const token = Auth.getToken();
        try {
            // Fetch Settings
            const resS = await fetch('/api/admin/settings', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const dataS = await resS.json();
            if (resS.ok && dataS.settings) {
                this.settings = dataS.settings;
                this.populateSettingsForm();
                this.updateLeaderboardToggleUI();
            }

            // Fetch Student Leaderboard Report
            const resR = await fetch('/api/admin/students', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const dataR = await resR.json();
            if (resR.ok && dataR.leaderboard) {
                this.studentList = dataR.leaderboard;
                document.getElementById('adminTotalStudents').textContent = dataR.totalStudents || 0;
                this.renderStudentTable(this.studentList);
            }
        } catch (err) {
            console.error('Error loading admin console data:', err);
            app.showToast('Error loading admin settings.', 'error');
        }
    },

    populateSettingsForm() {
        if (!this.settings) return;
        const l1 = document.getElementById('adminLevel1Text');
        const l2 = document.getElementById('adminLevel2Text');
        const l3 = document.getElementById('adminLevel3Text');

        if (l1) { l1.value = this.settings.level1Text || ''; document.getElementById('countL1').textContent = `${l1.value.length} chars`; }
        if (l2) { l2.value = this.settings.level2Text || ''; document.getElementById('countL2').textContent = `${l2.value.length} chars`; }
        if (l3) { l3.value = this.settings.level3Text || ''; document.getElementById('countL3').textContent = `${l3.value.length} chars`; }
    },

    updateLeaderboardToggleUI() {
        if (!this.settings) return;
        const isRevealed = !!this.settings.leaderboardRevealed;
        const dot = document.getElementById('lbStatusDot');
        const text = document.getElementById('lbStatusText');
        const btn = document.getElementById('btnToggleLeaderboard');

        if (isRevealed) {
            if (dot) dot.className = 'status-dot active';
            if (text) text.textContent = 'Leaderboard Revealed (Public to Students)';
            if (btn) btn.innerHTML = '<i class="fa-solid fa-eye-slash"></i> Hide Leaderboard from Students';
        } else {
            if (dot) dot.className = 'status-dot';
            if (text) text.textContent = 'Leaderboard Hidden (Locked for Students)';
            if (btn) btn.innerHTML = '<i class="fa-solid fa-eye"></i> Reveal Leaderboard to Students';
        }
    },

    async saveParagraphs() {
        const token = Auth.getToken();
        const level1Text = document.getElementById('adminLevel1Text').value;
        const level2Text = document.getElementById('adminLevel2Text').value;
        const level3Text = document.getElementById('adminLevel3Text').value;

        try {
            const res = await fetch('/api/admin/settings', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ level1Text, level2Text, level3Text })
            });
            const data = await res.json();
            if (res.ok) {
                this.settings = data.settings;
                app.showToast('Competition paragraphs updated successfully!', 'success');
            } else {
                app.showToast(data.error || 'Failed to update paragraphs.', 'error');
            }
        } catch (err) {
            app.showToast('Network error saving paragraphs.', 'error');
        }
    },

    async toggleLeaderboard() {
        const token = Auth.getToken();
        const nextState = !this.settings.leaderboardRevealed;

        try {
            const res = await fetch('/api/admin/settings', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ leaderboardRevealed: nextState })
            });
            const data = await res.json();
            if (res.ok) {
                this.settings = data.settings;
                this.updateLeaderboardToggleUI();
                app.showToast(nextState ? 'Leaderboard is now REVEALED to all students!' : 'Leaderboard is now HIDDEN from students.', 'success');
            }
        } catch (err) {
            app.showToast('Error toggling leaderboard visibility.', 'error');
        }
    },

    filterTable() {
        const query = (document.getElementById('adminSearchInput').value || '').toLowerCase().trim();
        const secFilter = document.getElementById('adminSecFilter').value;

        const filtered = this.studentList.filter(s => {
            const matchSec = (secFilter === 'ALL' || s.section === secFilter);
            const matchQuery = !query || s.suc.toLowerCase().includes(query) || s.fullName.toLowerCase().includes(query);
            return matchSec && matchQuery;
        });

        this.renderStudentTable(filtered);
    },

    renderStudentTable(list) {
        const tbody = document.getElementById('adminStudentTableBody');
        if (!tbody) return;
        tbody.innerHTML = '';

        if (!list || list.length === 0) {
            tbody.innerHTML = `<tr><td colspan="11" style="text-align:center; padding:2rem; color:var(--silver-muted);">No student records found.</td></tr>`;
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
                <td><strong>${s.suc}</strong></td>
                <td>${s.fullName}</td>
                <td><span class="user-section-badge">Sec ${s.section}</span></td>
                <td>${s.level1Wpm ? `${s.level1Wpm} / ${s.level1Acc}%` : '-'}</td>
                <td>${s.level2Wpm ? `${s.level2Wpm} / ${s.level2Acc}%` : '-'}</td>
                <td>${s.level3Wpm ? `${s.level3Wpm} / ${s.level3Acc}%` : '-'}</td>
                <td><strong>${s.totalWpm}</strong></td>
                <td>${s.avgAccuracy}%</td>
                <td>${formatTime(s.totalTimeSeconds)}</td>
                <td><strong style="color:var(--gold-accent);">${s.overallScore}</strong></td>
            `;
            tbody.appendChild(tr);
        });
    }
};

window.admin = AdminConsole;
