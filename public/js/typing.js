/**
 * Core Typing Engine for BCAlgorix 2k26
 * Handles In-Place Typing, Level Rules (Backspace blocking, Level 3 Masking), Timer, and Metrics
 */

const TypingEngine = {
    level: 1,
    targetText: '',
    typedChars: [],
    currentIndex: 0,
    startTime: null,
    timerInterval: null,
    elapsedSeconds: 0,
    isStarted: false,
    isFinished: false,
    rules: {
        backspace: true,
        masked: false
    },

    viewportEl: null,
    hiddenInputEl: null,

    init(level, targetText, rules) {
        this.level = level;
        this.targetText = targetText;
        this.typedChars = new Array(targetText.length).fill(null);
        this.currentIndex = 0;
        this.startTime = null;
        this.elapsedSeconds = 0;
        this.isStarted = false;
        this.isFinished = false;
        this.rules = rules || { backspace: true, masked: false };

        if (this.timerInterval) clearInterval(this.timerInterval);

        this.viewportEl = document.getElementById('paragraphViewport');
        this.hiddenInputEl = document.getElementById('hiddenTypingInput');

        this.renderViewport();
        this.resetMetricsDisplay();
        this.bindEvents();
    },

    renderViewport() {
        if (!this.viewportEl) return;
        this.viewportEl.innerHTML = '';

        const fragment = document.createDocumentFragment();

        for (let i = 0; i < this.targetText.length; i++) {
            const span = document.createElement('span');
            const targetChar = this.targetText[i];

            if (i < this.currentIndex) {
                const typed = this.typedChars[i];
                const isCorrect = (typed === targetChar);

                if (this.rules.masked) {
                    // Level 3: Mask typed character as '*'
                    span.textContent = '*';
                } else {
                    // Level 1 & 2: Show typed character or original
                    span.textContent = typed !== null ? typed : targetChar;
                }

                if (isCorrect) {
                    span.className = 'char-correct';
                } else {
                    span.className = 'char-incorrect';
                }
            } else if (i === this.currentIndex) {
                span.textContent = targetChar;
                span.className = 'char-current';
            } else {
                span.textContent = targetChar;
                span.className = 'char-pending';
            }

            fragment.appendChild(span);
        }

        this.viewportEl.appendChild(fragment);

        // Auto-scroll viewport to keep cursor in view
        const currentSpan = this.viewportEl.querySelector('.char-current');
        if (currentSpan) {
            currentSpan.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
    },

    bindEvents() {
        if (!this.viewportEl || !this.hiddenInputEl) return;

        // Focus receiver when viewport is clicked
        const focusInput = () => {
            if (!this.isFinished) {
                this.hiddenInputEl.focus();
                this.viewportEl.classList.add('focused');
            }
        };

        this.viewportEl.addEventListener('click', focusInput);

        // Keydown Event Handler for Typing & Controls
        this.hiddenInputEl.onkeydown = (e) => {
            if (this.isFinished) return;

            // Block Backspace, Delete, Ctrl+Backspace in Level 2 and Level 3
            if (!this.rules.backspace) {
                if (e.key === 'Backspace' || e.key === 'Delete' || (e.ctrlKey && e.key === 'Backspace')) {
                    e.preventDefault();
                    return false;
                }
            }

            // Level 1 Backspace Handling
            if (e.key === 'Backspace' && this.rules.backspace) {
                e.preventDefault();
                if (this.currentIndex > 0) {
                    this.currentIndex--;
                    this.typedChars[this.currentIndex] = null;
                    this.renderViewport();
                    this.updateMetrics();
                }
                return;
            }

            // Prevent scroll key actions
            if (e.key === 'Tab' || e.key === 'Alt' || e.key === 'Control' || e.key === 'Shift') {
                return;
            }
            if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Home', 'End', 'PageUp', 'PageDown'].includes(e.key)) {
                e.preventDefault();
                return;
            }

            // Handle Printable Keystrokes (Length 1 string or Enter)
            let typedKey = e.key;
            if (typedKey === 'Enter') typedKey = '\n';

            if (typedKey.length === 1 || typedKey === '\n') {
                e.preventDefault();

                // Start timer on first keystroke
                if (!this.isStarted) {
                    this.startTimer();
                }

                if (this.currentIndex < this.targetText.length) {
                    this.typedChars[this.currentIndex] = typedKey;
                    this.currentIndex++;
                    this.renderViewport();
                    this.updateMetrics();

                    // Check completion
                    if (this.currentIndex >= this.targetText.length) {
                        this.finishTest();
                    }
                }
            }
        };
    },

    startTimer() {
        this.isStarted = true;
        this.startTime = Date.now();
        document.getElementById('typingInstruction').style.display = 'none';

        this.timerInterval = setInterval(() => {
            this.elapsedSeconds = Math.floor((Date.now() - this.startTime) / 1000);
            this.updateMetrics();
        }, 1000);
    },

    updateMetrics() {
        const totalChars = this.currentIndex;
        let correctChars = 0;

        for (let i = 0; i < totalChars; i++) {
            if (this.typedChars[i] === this.targetText[i]) {
                correctChars++;
            }
        }

        const incorrectChars = totalChars - correctChars;
        const accuracy = totalChars > 0 ? (correctChars / totalChars) * 100 : 100;
        const timeInMinutes = this.elapsedSeconds / 60;
        const wpm = timeInMinutes > 0 ? Math.round((totalChars / 5) / timeInMinutes) : 0;
        const progress = Math.min(100, Math.round((totalChars / this.targetText.length) * 100));

        // Format time mm:ss
        const mins = String(Math.floor(this.elapsedSeconds / 60)).padStart(2, '0');
        const secs = String(this.elapsedSeconds % 60).padStart(2, '0');

        document.getElementById('liveTime').textContent = `${mins}:${secs}`;
        document.getElementById('liveWpm').textContent = wpm;
        document.getElementById('liveAccuracy').textContent = `${accuracy.toFixed(1)}%`;
        document.getElementById('liveProgress').textContent = `${progress}%`;
    },

    resetMetricsDisplay() {
        document.getElementById('liveTime').textContent = '00:00';
        document.getElementById('liveWpm').textContent = '0';
        document.getElementById('liveAccuracy').textContent = '100%';
        document.getElementById('liveProgress').textContent = '0%';
        document.getElementById('typingInstruction').style.display = 'flex';
    },

    async finishTest() {
        this.isFinished = true;
        if (this.timerInterval) clearInterval(this.timerInterval);

        const totalTime = Math.max(1, this.elapsedSeconds);
        const totalChars = this.currentIndex;
        let correctChars = 0;

        for (let i = 0; i < totalChars; i++) {
            if (this.typedChars[i] === this.targetText[i]) {
                correctChars++;
            }
        }
        const incorrectChars = totalChars - correctChars;
        const accuracy = totalChars > 0 ? parseFloat(((correctChars / totalChars) * 100).toFixed(2)) : 100;
        const wpm = Math.round((totalChars / 5) / (totalTime / 60));

        // Word count calculations
        const targetWords = this.targetText.trim().split(/\s+/);
        const typedTextStr = this.typedChars.slice(0, totalChars).join('');
        const typedWords = typedTextStr.trim().length > 0 ? typedTextStr.trim().split(/\s+/) : [];

        let correctWords = 0;
        const totalWords = typedWords.length;

        typedWords.forEach((word, idx) => {
            if (idx < targetWords.length && word === targetWords[idx]) {
                correctWords++;
            }
        });
        const incorrectWords = Math.max(0, totalWords - correctWords);

        const resultPayload = {
            level: this.level,
            wpm,
            accuracy,
            totalWords,
            correctWords,
            incorrectWords,
            totalChars,
            correctChars,
            incorrectChars,
            timeTakenSeconds: totalTime
        };

        // Submit result to server
        try {
            const token = Auth.getToken();
            const res = await fetch('/api/challenge/submit', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(resultPayload)
            });

            const data = await res.json();
            if (!res.ok) {
                app.showToast(data.error || 'Failed to record level score.', 'error');
                return;
            }

            // Display Results Modal
            app.showResultsModal(this.level, resultPayload, data.attempt ? data.attempt.score : 0);
        } catch (err) {
            console.error('Submission error:', err);
            app.showToast('Network error while saving score.', 'error');
        }
    }
};
