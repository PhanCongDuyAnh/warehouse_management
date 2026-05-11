// ==========================================
// AUTH METHODS — Đăng nhập, phân quyền
// ==========================================
function getAuthMethods() {
    return {
        doLogin() {
            this.loginError = '';
            if (!this.loginForm.username || !this.loginForm.password) {
                this.loginError = 'Vui lòng nhập tên đăng nhập và mật khẩu.';
                return;
            }
            this.loginLoading = true;
            setTimeout(() => {
                const user = USERS_DB.find(u =>
                    u.username === this.loginForm.username.trim() &&
                    u.password === this.loginForm.password
                );
                this.loginLoading = false;
                if (user) {
                    this.currentUser = user;
                    setSession(user);
                    this.isLoggedIn = true;
                    this.currentTab = 'home';
                    this.loginForm = { username: '', password: '' };
                    this.$nextTick(() => this.initCharts('home'));
                    this.toast(`Chào mừng, <b>${user.name}</b>! Vai trò: ${user.roleLabel}`, 'success', 'Đăng nhập thành công');
                } else {
                    this.loginError = 'Tên đăng nhập hoặc mật khẩu không đúng.';
                }
            }, 600);
        },

        doLogout() {
            clearSession();
            this.isLoggedIn = false;
            this.currentUser = null;
            this.currentTab = 'home';
            this.loginForm = { username: '', password: '' };
            this.loginError = '';
            this.toast('Đã đăng xuất thành công!', 'info', 'Hẹn gặp lại');
        },

        confirmLogout() {
            if (confirm('Bạn có chắc chắn muốn đăng xuất khỏi hệ thống không?')) {
                this.doLogout();
            }
        },

        // ── PERMISSION CHECK ──
        can(permission) {
            if (!this.currentUser) return false;
            return this.currentUser.permissions?.includes(permission) ?? false;
        },

        // ── ALLOWED TABS based on role ──
        allowedTabs() {
            const role = this.currentUser?.role || 'warehouse';
            const tabs = ROLE_TABS[role] || ROLE_TABS['warehouse'];
            const translated = {};
            Object.keys(tabs).forEach(key => {
                translated[key] = this.t(key);
            });
            return translated;
        },
    };
}
