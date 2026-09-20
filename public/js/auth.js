/**
 * Authentication Module for BCAlgorix 2k26
 * Handles SUC validation, registration, student login, and admin login
 */

const Auth = {
    getToken() {
        return localStorage.getItem('bcalgorix_token');
    },

    getUser() {
        const u = localStorage.getItem('bcalgorix_user');
        return u ? JSON.parse(u) : null;
    },

    setSession(token, user) {
        localStorage.setItem('bcalgorix_token', token);
        localStorage.setItem('bcalgorix_user', JSON.stringify(user));
    },

    clearSession() {
        localStorage.removeItem('bcalgorix_token');
        localStorage.removeItem('bcalgorix_user');
    },

    init() {
        // Auth tab navigation
        const tabBtns = document.querySelectorAll('.auth-tab-btn');
        tabBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const targetTab = btn.getAttribute('data-tab');
                tabBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');

                document.querySelectorAll('.auth-form').forEach(form => {
                    form.classList.remove('active');
                });

                if (targetTab === 'studentLogin') {
                    document.getElementById('formStudentLogin').classList.add('active');
                } else if (targetTab === 'studentRegister') {
                    document.getElementById('formStudentRegister').classList.add('active');
                } else if (targetTab === 'adminLogin') {
                    document.getElementById('formAdminLogin').classList.add('active');
                }
            });
        });

        // 1. Student Login Form Submit
        const formLogin = document.getElementById('formStudentLogin');
        if (formLogin) {
            formLogin.addEventListener('submit', async (e) => {
                e.preventDefault();
                const sucInput = document.getElementById('loginSuc').value.trim();
                const password = document.getElementById('loginPassword').value;

                // Pre-pend 260300 if user typed only last 4 digits
                let fullSuc = sucInput;
                if (/^\d{4}$/.test(sucInput)) {
                    fullSuc = '260300' + sucInput;
                }

                try {
                    const res = await fetch('/api/auth/login', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ suc: fullSuc, password })
                    });
                    const data = await res.json();

                    if (!res.ok) {
                        app.showToast(data.error || 'Login failed', 'error');
                        return;
                    }

                    Auth.setSession(data.token, data.user);
                    app.showToast('Login successful! Welcome to BCAlgorix 2k26.', 'success');
                    app.initApp();
                } catch (err) {
                    app.showToast('Network error during login.', 'error');
                }
            });
        }

        // 2. Student Register Form Submit
        const formRegister = document.getElementById('formStudentRegister');
        if (formRegister) {
            formRegister.addEventListener('submit', async (e) => {
                e.preventDefault();
                const fullName = document.getElementById('regFullName').value.trim();
                let suc = document.getElementById('regSuc').value.trim();
                const section = document.getElementById('regSection').value;
                const password = document.getElementById('regPassword').value;
                const confirmPassword = document.getElementById('regConfirmPassword').value;

                // Format check for SUC
                if (/^\d{4}$/.test(suc)) {
                    suc = '260300' + suc;
                }

                const sucRegex = /^260300\d{4}$/;
                if (!sucRegex.test(suc)) {
                    app.showToast('SUC Number must be 10 digits and start with "260300" (e.g. 2603001234).', 'error');
                    return;
                }

                if (!['A', 'B'].includes(section)) {
                    app.showToast('Please select Section A or Section B.', 'error');
                    return;
                }

                if (password !== confirmPassword) {
                    app.showToast('Password and Confirm Password do not match!', 'error');
                    return;
                }

                try {
                    const res = await fetch('/api/auth/register', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            suc,
                            fullName,
                            section,
                            password,
                            confirmPassword
                        })
                    });
                    const data = await res.json();

                    if (!res.ok) {
                        app.showToast(data.error || 'Registration failed', 'error');
                        return;
                    }

                    Auth.setSession(data.token, data.user);
                    app.showToast('Registration successful! Redirecting to dashboard...', 'success');
                    app.initApp();
                } catch (err) {
                    app.showToast('Network error during registration.', 'error');
                }
            });
        }

        // 3. Admin Login Form Submit
        const formAdmin = document.getElementById('formAdminLogin');
        if (formAdmin) {
            formAdmin.addEventListener('submit', async (e) => {
                e.preventDefault();
                const username = document.getElementById('adminUsername').value.trim();
                const password = document.getElementById('adminPassword').value;

                try {
                    const res = await fetch('/api/auth/admin-login', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ username, password })
                    });
                    const data = await res.json();

                    if (!res.ok) {
                        app.showToast(data.error || 'Admin login failed', 'error');
                        return;
                    }

                    Auth.setSession(data.token, data.user);
                    app.showToast('Welcome, Administrator!', 'success');
                    app.initApp();
                } catch (err) {
                    app.showToast('Network error during admin login.', 'error');
                }
            });
        }
    }
};
