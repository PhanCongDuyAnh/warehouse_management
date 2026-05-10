// ==========================================
// I18N — Internationalization Dictionary
// ==========================================
const TRANSLATIONS = {
    vi: {
        // Sidebar & Tabs
        home: 'Trang Chủ',
        orders: 'Đơn Hàng',
        inventory: '🧠 Smart Inventory',
        inbound: 'Lịch Sử Nhập',
        outbound: 'Lịch Sử Xuất',
        shipping: 'Vận Chuyển',
        logistics: '📍 Logistics & GPS',
        iot: 'IoT Monitor',
        alerts: 'Cảnh Báo',
        employees: 'Nhân Sự',
        reports: '💰 Tài Chính & Thống Kê',
        
        // Stats & Headers
        total_revenue: 'Tổng doanh thu',
        net_profit: 'Lợi nhuận ròng',
        operating_cost: 'Chi phí vận hành',
        inventory_quality: 'Chất lượng kho',
        order_delivery: 'Tỷ lệ giao hàng',
        iot_alerts: 'Cảnh báo IoT',
        damaged_items: 'Hàng hư hỏng',
        
        // Actions & Buttons
        create_order: 'Tạo đơn hàng',
        add_product: 'Nhập sản phẩm',
        export_list: 'Xuất danh sách',
        advanced_excel: 'Advanced Excel',
        summary_pdf: 'Summary PDF',
        backup: 'Sao lưu',
        restore: 'Khôi phục',
        snapshot: 'Chụp trạng thái',
        search_sku: 'Tìm mã SKU...',
        search_order: 'Tìm mã đơn hàng...',
        search_staff: 'Tìm tên nhân viên...',
        
        // Table Headers
        sku: 'Mã SKU',
        product: 'Sản phẩm',
        qty: 'Số lượng',
        status: 'Trạng thái',
        zone: 'Khu vực',
        quality_pct: 'Chất lượng (%)',
        expiry: 'Hạn dùng',
        action: 'Thao tác',
        customer: 'Khách hàng',
        address: 'Địa chỉ',
        priority: 'Ưu tiên',
        carrier: 'Người vận chuyển',
        
        // Statuses
        in_stock: 'Còn hàng',
        low_stock: 'Sắp hết hàng',
        out_of_stock: 'Hết hàng',
        shipping: 'Đang đi',
        delivered: 'Đã giao',
        pending: 'Chờ xử lý',
        
        // System
        system: 'Hệ thống',
        maintenance: 'Quản trị hệ thống',
        ai_insights: 'AI Insights Engine',
        last_event: 'Sự kiện gần nhất',
        welcome: 'Chào mừng trở lại',
        logout: 'Đăng xuất',
        login: 'Đăng nhập',
        select_account: 'Chọn tài khoản demo'
    },
    en: {
        // Sidebar & Tabs
        home: 'Dashboard',
        orders: 'Orders',
        inventory: '🧠 Smart Inventory',
        inbound: 'Inbound',
        outbound: 'Outbound',
        shipping: 'Shipping',
        logistics: '📍 Logistics & GPS',
        iot: 'IoT Monitor',
        alerts: 'Alerts',
        employees: 'Staff',
        reports: '💰 Reports & Finance',
        
        // Stats & Headers
        total_revenue: 'Total Revenue',
        net_profit: 'Net Profit',
        operating_cost: 'Operating Cost',
        inventory_quality: 'Inventory Quality',
        order_delivery: 'OTD Rate',
        iot_alerts: 'IoT Alerts',
        damaged_items: 'Damaged Items',
        
        // Actions & Buttons
        create_order: 'Create Order',
        add_product: 'Add Product',
        export_list: 'Export List',
        advanced_excel: 'Advanced Excel',
        summary_pdf: 'Summary PDF',
        backup: 'Backup DB',
        restore: 'Restore DB',
        snapshot: 'Snapshot',
        search_sku: 'Search SKU...',
        search_order: 'Search Order ID...',
        search_staff: 'Search Staff Name...',
        
        // Table Headers
        sku: 'SKU Code',
        product: 'Product',
        qty: 'Quantity',
        status: 'Status',
        zone: 'Zone',
        quality_pct: 'Quality (%)',
        expiry: 'Expiry',
        action: 'Action',
        customer: 'Customer',
        address: 'Address',
        priority: 'Priority',
        carrier: 'Shipper',
        
        // Statuses
        in_stock: 'In Stock',
        low_stock: 'Low Stock',
        out_of_stock: 'Out of Stock',
        shipping: 'Shipping',
        delivered: 'Delivered',
        pending: 'Pending',
        
        // System
        system: 'System',
        maintenance: 'Maintenance',
        ai_insights: 'AI Insights Engine',
        last_event: 'Latest Event',
        welcome: 'Welcome back',
        logout: 'Logout',
        login: 'Login',
        select_account: 'Select Demo Account'
    }
};

function getI18nMethods() {
    return {
        lang: localStorage.getItem('trito_lang') || 'vi',
        
        t(key) {
            return TRANSLATIONS[this.lang][key] || key;
        },
        
        switchLang(newLang) {
            this.lang = newLang;
            localStorage.setItem('trito_lang', newLang);
            // Cập nhật tab titles
            this._updateTabTitles();
            this.toast(newLang === 'vi' ? 'Đã chuyển sang Tiếng Việt' : 'Switched to English', 'info');
        },
        
        _updateTabTitles() {
            const keys = ['home', 'orders', 'inventory', 'inbound', 'outbound', 'shipping', 'logistics', 'iot', 'alerts', 'employees', 'reports'];
            keys.forEach(k => {
                if (this.tabTitles[k]) this.tabTitles[k] = this.t(k);
            });
        },
        
        t_status(status) {
            const map = {
                'Còn hàng': 'in_stock',
                'Sắp hết hàng': 'low_stock',
                'Hết hàng': 'out_of_stock',
                'Đang đi': 'shipping',
                'Đã giao': 'delivered',
                'Chờ xử lý': 'pending'
            };
            const key = map[status];
            return key ? this.t(key) : status;
        }
    };
}
