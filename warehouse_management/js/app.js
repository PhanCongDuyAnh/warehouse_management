// ==========================================
// APP CHÍNH — Alpine.js Component Root
// Gộp tất cả module lại thành warehouseApp()
// Load order: db.js → simulation.js → auth.js
//             → validators.js → crud.js → charts.js
//             → chatbot.js → ui.js → app.js
// ==========================================
function warehouseApp() {
    const db = loadDB();
    const savedSession = getSession();

    // ── State ban đầu ──
    const state = {
        isLoggedIn: !!savedSession,
        currentUser: savedSession || null,
        showDemo: false,
        loginForm: { username: '', password: '' },
        loginError: '',
        loginLoading: false,
        showPassword: false,
        demoAccounts: USERS_DB.map(u => ({
            username: u.username, password: u.password, name: u.name,
            role: u.role, roleLabel: u.roleLabel, icon: u.icon, color: u.color
        })),
        currentTab: 'home',
        showChat: false,
        showAddOrder: false, showAddProduct: false, showExportModal: false,
        showAddEmployee: false, showAddShipping: false, showAddAlert: false,
        showResetConfirm: false,
        showDeleteConfirm: false,
        showSkuDuplicateConfirm: false,
        skuDuplicateTarget: { sku: '', name: '', existingName: '', qty: 0 },
        deleteTarget: { list: '', id: '', label: '' },
        orderFilter: 'Tất cả', inventoryFilter: 'Tất cả',
        inboundSearch: '', outboundSearch: '', shippingSearch: '',

        // Chatbot
        userInput: '', isTyping: false, showSuggestions: true,
        chatMessages: [
            { sender: 'ai', text: '👋 Xin chào! Tôi là <b>KhoBot</b> — trợ lý AI nội bộ của Kho Thông Minh Pro.<br><br>Tôi có thể giúp bạn:<br>• 📊 Tra cứu tồn kho, đơn hàng<br>• 🚨 Xem cảnh báo & nhân sự<br>• 🔍 Tìm kiếm sản phẩm theo tên/SKU<br>• 📋 Tóm tắt hoạt động kho<br><br>Hỏi bất cứ điều gì về kho nhé! 😊' }
        ],

        // ── Báo cáo State ──
        reportPeriod: 'Tháng',
        reportPeriods: ['Ngày', 'Tuần', 'Tháng', 'Quý', 'Năm'],
        _reportInterval: null,
        _charts: {},
        statsKpi: { revenue: '--', revenueUp: true, revenueDelta: '--', profit: '--', profitUp: true, profitDelta: '--', otd: 94, error: 0.24, warehouse: 35 },
        detailedKpis: [],

        // ── Simulation Engine State ──
        simVirtualTime: new Date(2026, 4, 8, 8, 0, 0),
        simRunning: false,
        simSpeed: '1000',
        simTickInterval: null,
        simTickCount: 0,
        simLastEvent: '<span style="color:#475569">Sẵn sàng — Nhấn Play để bắt đầu mô phỏng</span>',
        simState: {
            qualityPct: 98,
            electricCost: 0,
            logisticsCost: 0,
            damagedItems: 0,
            profit: 0,
            etaModifier: 0,
            totalRevenue: 1280000000,
            hourlyElec: 185000,
            dailyLogistics: 4200000,
            qualityDecayPerDay: 0.15,
            profitMargin: 0.22,
        },
        simEventLog: [],

        orderStatuses: ['Tất cả', 'Chờ xử lý', 'Đang đóng gói', 'Đang giao', 'Đã nhận'],
        stockStatuses: ['Tất cả', 'Còn hàng', 'Sắp hết hàng', 'Hết hàng'],
        tabTitles: { home: 'Trang Chủ', orders: 'Đơn Hàng', inventory: 'Tồn Kho', inbound: 'Lịch Sử Nhập', outbound: 'Lịch Sử Xuất', shipping: 'Vận Chuyển', alerts: 'Cảnh Báo', employees: 'Nhân Sự', reports: 'Thống Kê' },
        tabIcons: { home: 'fas fa-home', orders: 'fas fa-shopping-cart', inventory: 'fas fa-boxes-stacked', inbound: 'fas fa-arrow-down', outbound: 'fas fa-arrow-up', shipping: 'fas fa-truck-fast', alerts: 'fas fa-exclamation-triangle', employees: 'fas fa-users', reports: 'fas fa-chart-pie' },

        // ── Dữ liệu tải từ localStorage ──
        categories: loadCategories(),
        orders: db.orders,
        inventoryList: db.inventoryList,
        inboundList: db.inboundList,
        outboundList: db.outboundList,
        shippingList: db.shippingList,
        alerts: db.alerts,
        employeeList: db.employeeList,

        // Form tạm
        newOrder: { customer: '', product: '', priority: 'Thường', phone: '', address: '', sku: '', qty: 1 },
        newProd: { id: '', name: '', category: 'Thực phẩm', stock: 0, pos: '', expiryDate: '', importDate: new Date().toISOString().split('T')[0], area: 0 },

        // ── Validation Errors ──
        orderErr: { customer: '', phone: '', address: '', sku: '', qty: '' },
        prodErr: { id: '', name: '', stock: '', importDate: '', expiryDate: '', area: '' },
        exErr: { orderId: '', staff: '', exportDate: '', customerName: '', qty: '' },
        empErr: { name: '', workTime: '' },
        shipErr: { trackId: '', orderId: '', exportStaff: '', shipStaff: '' },

        showNewCategoryDialog: false,
        newCategoryName: '',
        positions: loadPositions(),
        showNewPositionDialog: false,
        newPositionName: '',
        newEx: { orderId: '', type: 'Bán lẻ', staff: '', exportDate: new Date().toISOString().split('T')[0], customerName: '', qty: '', shipType: 'Thường' },
        newEmp: { name: '', position: 'Đóng gói', workTime: '08:00 - 17:00', empStatus: 'Đang làm' },
        newShip: { trackId: '', orderId: '', location: 'Kho tổng', type: 'Thường', status: 'Khởi tạo', exportStaff: '', exportRole: 'Nhân viên xuất kho', shipStaff: '' },
        newAlrt: { name: '', type: 'Sắp hết hàng', level: 'Trung bình', qty: 0, alertDate: new Date().toISOString().split('T')[0], handling: 'Đặt hàng bổ sung', note: '' },
        handlingOptions: [
            { value: 'Tiêu hủy', icon: 'fas fa-trash-alt', color: '#dc2626' },
            { value: 'Vận chuyển hỏa tốc', icon: 'fas fa-bolt', color: '#ea580c' },
            { value: 'Vận chuyển nhanh', icon: 'fas fa-truck-fast', color: '#2563eb' },
            { value: 'Rời kho', icon: 'fas fa-door-open', color: '#16a34a' },
            { value: 'Kiểm kê lại', icon: 'fas fa-clipboard-list', color: '#7c3aed' },
            { value: 'Đặt hàng bổ sung', icon: 'fas fa-cart-plus', color: '#0891b2' },
            { value: 'Giảm giá thanh lý', icon: 'fas fa-tags', color: '#b45309' },
            { value: 'Chuyển kho', icon: 'fas fa-exchange-alt', color: '#0d9488' },
        ],

        // ── KHỞI TẠO: watch mọi thay đổi → tự động lưu ──
        init() {
            const WATCHED = ['orders', 'inventoryList', 'inboundList', 'outboundList', 'shippingList', 'alerts', 'employeeList'];
            this.$watch('categories', (val) => saveCategories(val), { deep: true });
            this.$watch('positions', (val) => savePositions(val), { deep: true });
            WATCHED.forEach(key => {
                this.$watch(key, () => saveDB(this), { deep: true });
            });
            this.$watch('currentTab', (val) => { this.$nextTick(() => this.initCharts(val)); });
            this.initCharts('home');
            this.$watch('isLoggedIn', (val) => {
                if (val) { document.body.classList.add('sim-active'); }
                else { document.body.classList.remove('sim-active'); this.simStop(); }
            });
            if (this.isLoggedIn) document.body.classList.add('sim-active');
        },
    };

    // ── Gộp tất cả modules ──
    return Object.assign(
        state,
        getSimulationMethods(),
        getAuthMethods(),
        getValidatorMethods(),
        getCrudMethods(),
        getChartMethods(),
        getChatbotMethods(),
        getUiMethods()
    );
}
