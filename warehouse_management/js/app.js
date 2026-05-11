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
        orderFilter: 'Tất cả', inventoryFilter: 'Tất cả', alertFilter: 'Tất cả',
        inboundSearch: '', outboundSearch: '', shippingSearch: '',
        smartInvTab: 'all',
        smartInvSearch: '',
        showDiscountModal: false,
        discountTarget: null,
        fefoSuggestion: null,
        showShipDetail: false,
        selectedShipItem: null,
        focusedVehicleId: null,
        showHandlingModal: false,
        selectedAlert: null,

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
            totalFuelConsumed: 0,
            fuelCost: 0,
            iotAlertCount: 0,
            scenario: 'normal',
            weatherFactor: 1.0,
            trafficFactor: 1.0,
            activeStorm: false,
            activeTraffic: false,
        },
        tabTitles: { home: 'Trang Chủ', inventory: 'Command Center', inbound: 'Lịch Sử Nhập', outbound: 'Lịch Sử Xuất', shipping: 'Vận Chuyển', logistics: 'Logistics & GPS', iot: 'IoT Monitor', alerts: 'Cảnh Báo', employees: 'Nhân Sự', reports: 'Tài Chính & Thống Kê' },
        tabIcons: { home: 'fas fa-home', inventory: 'fas fa-shield-halved', inbound: 'fas fa-arrow-down', outbound: 'fas fa-arrow-up', shipping: 'fas fa-truck-fast', logistics: 'fas fa-map-location-dot', iot: 'fas fa-microchip', alerts: 'fas fa-exclamation-triangle', employees: 'fas fa-users', reports: 'fas fa-chart-line' },
        
        // Logistics Constants
        HUB_DATA: HUB_DATA,
        VEHICLE_CONFIGS: VEHICLE_CONFIGS,

        // ── Dữ liệu tải từ localStorage ──
        categories: loadCategories(),
        orders: db.orders,
        inventoryList: db.inventoryList,
        inboundList: db.inboundList,
        outboundList: db.outboundList,
        shippingList: db.shippingList,
        alerts: (db.alerts || []).map(a => ({ ...a, id: a.id || ('ALRT-' + Math.random().toString(36).substr(2, 9)) })),
        employeeList: db.employeeList,
        snapshots: loadSnapshots(),
        iotData: loadIotData(),

        // Form tạm
        newOrder: { customer: '', product: '', priority: 'Thường', phone: '', address: '', sku: '', qty: 1, hub: 'Long Biên' },
        newProd: { 
            id: '', name: '', category: 'Thực phẩm', stock: 0, pos: '', 
            expiryDate: '', importDate: new Date().toISOString().split('T')[0], 
            area: 0, hub: 'Long Biên', quality: 100, minTemp: 2, maxTemp: 8, 
            buyPrice: 0, baseSellPrice: 0, warehouseZone: 'B', decayRate: 0.1 
        },

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
        newShip: { 
            trackId: '', orderId: '', type: 'Thường', originHub: 'Long Biên', 
            vehicleType: 'Xe Van', destination: '', status: 'Khởi tạo', 
            exportStaff: '', exportRole: 'Nhân viên xuất kho', shipStaff: '', 
            driverName: '', estimatedArrival: '', itemClass: 'Hàng thường' 
        },
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
            this.$watch('currentTab', (val) => { 
                this.$nextTick(() => {
                    this.initCharts(val);
                    if (val === 'logistics') {
                        this.initLogisticsMap();
                        // Special fix for Leaflet size in hidden containers
                        setTimeout(() => this.initLogisticsMap(), 300);
                    }
                }); 
            });
            this.initCharts('home');
            this.$watch('isLoggedIn', (val) => {
                if (val) { document.body.classList.add('sim-active'); }
                else { document.body.classList.remove('sim-active'); this.simStop(); }
            });
            if (this.isLoggedIn) document.body.classList.add('sim-active');
        },
    };

    // ── Alert System Methods ──
    const alertMethods = {
        filteredAlerts() {
            if (this.alertFilter === 'Tất cả') return this.alerts;
            return this.alerts.filter(a => a.level === this.alertFilter);
        }
    };

    // ── Smart Inventory Methods ──
    const smartInvMethods = {
        daysUntilExpiry(dateStr) {
            if (!dateStr) return Infinity;
            const diff = new Date(dateStr) - new Date(this.simVirtualTime || new Date());
            return Math.ceil(diff / (1000 * 60 * 60 * 24));
        },
        qualityColorClass(q) {
            if (q >= 80) return 'quality-bar-green';
            if (q >= 50) return 'quality-bar-yellow';
            return 'quality-bar-red';
        },
        zoneBadgeClass(zone) {
            if (zone === 'Frozen') return 'zone-badge-frozen';
            if (zone === 'Chilled') return 'zone-badge-chilled';
            return 'zone-badge-ambient';
        },
        zoneIcon(zone) {
            if (zone === 'Frozen') return 'fas fa-icicles';
            if (zone === 'Chilled') return 'fas fa-snowflake';
            return 'fas fa-box-open';
        },
        expiryBadgeClass(dateStr) {
            const d = this.daysUntilExpiry(dateStr);
            if (d <= 7) return 'expiry-badge-critical';
            if (d <= 14) return 'expiry-badge-warning';
            if (d <= 30) return 'expiry-badge-caution';
            return 'expiry-badge-ok';
        },
        expiryLabel(dateStr) {
            if (!dateStr) return 'Không HSD';
            const d = this.daysUntilExpiry(dateStr);
            if (d < 0) return '⛔ Đã hết hạn';
            if (d === 0) return '🔴 Hết hạn HÔM NAY';
            if (d <= 7) return `🔴 Còn ${d} ngày`;
            if (d <= 14) return `🟠 Còn ${d} ngày`;
            if (d <= 30) return `🟡 Còn ${d} ngày`;
            return `✅ Còn ${d} ngày`;
        },
        filteredSmartInventory() {
            let list = [...this.inventoryList];
            if (this.smartInvTab !== 'all') list = list.filter(p => p.storageZone === this.smartInvTab);
            if (this.smartInvSearch.trim()) {
                const q = this.smartInvSearch.toLowerCase();
                list = list.filter(p => p.name.toLowerCase().includes(q) || p.id.toLowerCase().includes(q));
            }
            // FEFO sort: earliest expiry first (items without expiry go last)
            list.sort((a, b) => {
                if (!a.expiryDate && !b.expiryDate) return 0;
                if (!a.expiryDate) return 1;
                if (!b.expiryDate) return -1;
                return new Date(a.expiryDate) - new Date(b.expiryDate);
            });
            return list;
        },
        fefoQueue() {
            return this.inventoryList
                .filter(p => p.expiryDate)
                .sort((a, b) => new Date(a.expiryDate) - new Date(b.expiryDate))
                .slice(0, 8);
        },
        aiDiscountSuggestions() {
            return this.inventoryList.filter(p => {
                const days = this.daysUntilExpiry(p.expiryDate);
                return (p.expiryDate && days <= 30 && days >= 0) || p.quality < 60;
            }).map(p => {
                const days = this.daysUntilExpiry(p.expiryDate);
                let pct = 0;
                if (p.quality < 40) pct = 30;
                else if (p.quality < 60) pct = 20;
                else if (days <= 7) pct = 25;
                else if (days <= 14) pct = 15;
                else if (days <= 30) pct = 10;
                return { ...p, suggestedDiscount: pct };
            });
        },
        zoneSummary(zone) {
            const items = this.inventoryList.filter(p => p.storageZone === zone);
            const expiringSoon = items.filter(p => p.expiryDate && this.daysUntilExpiry(p.expiryDate) <= 30).length;
            const avgQuality = items.length ? Math.round(items.reduce((s, p) => s + (p.quality || 0), 0) / items.length) : 0;
            const totalStock = items.reduce((s, p) => s + (p.stock || 0), 0);
            return { count: items.length, expiringSoon, avgQuality, totalStock };
        },
        applyAiDiscount(sku, pct) {
            const item = this.inventoryList.find(p => p.id === sku);
            if (item) {
                item.currentSellPrice = Math.round(item.baseSellPrice * (1 - pct / 100));
                this.showToast(`✅ Đã áp dụng giảm ${pct}% cho ${item.name}`, 'success');
            }
            this.showDiscountModal = false;
            this.discountTarget = null;
        },
        openDiscountModal(item, pct) {
            this.discountTarget = { ...item, suggestedDiscount: pct };
            this.showDiscountModal = true;
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
        getUiMethods(),
        getLogisticsMethods(),
        getFinanceMethods(),
        getAlertMethods(),
        getExcelMethods(),
        getMaintenanceMethods(),
        getI18nMethods(),
        getIotMethods(),
        alertMethods,
        smartInvMethods,
        getPdfMethods(),
        {
            locateVehicle(s) {
                if (s.status === 'Đã giao') {
                    this.toast(`Vận đơn ${s.trackId} đã hoàn thành giao hàng.`, 'info');
                    return;
                }
                this.currentTab = 'logistics';
                this.$nextTick(() => {
                    this.focusVehicle(s);
                    this.toast(`Đã định vị thành công phương tiện ${s.trackId}`, 'success', 'GPS Tracking');
                });
            }
        }
    );
}
