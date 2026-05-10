// ==========================================
// HELPER: localStorage wrapper
// ==========================================
const DB_KEY = 'kho_thong_minh_pro_v1';

function loadCategories() {
    try {
        const raw = localStorage.getItem(DB_KEY + '_categories');
        return raw ? JSON.parse(raw) : ['Thực phẩm', 'Điện tử', 'Gia dụng', 'Hóa chất', 'Dược phẩm'];
    } catch (e) { return ['Thực phẩm', 'Điện tử', 'Gia dụng', 'Hóa chất', 'Dược phẩm']; }
}
function saveCategories(cats) {
    try { localStorage.setItem(DB_KEY + '_categories', JSON.stringify(cats)); } catch (e) { }
}

const DEFAULT_POSITIONS = ['Quản lý kho', 'Đóng gói', 'Tài xế', 'Nhân viên bốc xếp', 'Kỹ thuật IoT'];
function loadPositions() {
    try {
        const raw = localStorage.getItem(DB_KEY + '_positions');
        return raw ? JSON.parse(raw) : [...DEFAULT_POSITIONS];
    } catch (e) { return [...DEFAULT_POSITIONS]; }
}
function savePositions(pos) {
    try { localStorage.setItem(DB_KEY + '_positions', JSON.stringify(pos)); } catch (e) { }
}

// ==========================================
// IOT DATA — Dữ liệu cảm biến thời gian thực
// ==========================================
function loadIotData() {
    try {
        const raw = localStorage.getItem(DB_KEY + '_iot');
        return raw ? JSON.parse(raw) : generateInitialIotData();
    } catch (e) { return generateInitialIotData(); }
}
function saveIotData(data) {
    try { localStorage.setItem(DB_KEY + '_iot', JSON.stringify(data)); } catch (e) { }
}

function generateInitialIotData() {
    const points = [];
    const base = new Date(2026, 4, 8, 8, 0, 0);
    for (let i = 0; i < 8; i++) {
        const t = new Date(base.getTime() + i * 3600000);
        points.push(generateIotReading(t.toISOString()));
    }
    return points;
}

function generateIotReading(timeISO) {
    return {
        time: timeISO,
        zoneA: { // Lạnh (2-8°C)
            temp: +(2 + Math.random() * 6).toFixed(1),
            humidity: +(65 + Math.random() * 15).toFixed(1),
            co2: +(400 + Math.random() * 60).toFixed(0),
            vibration: +(Math.random() * 0.05).toFixed(3)
        },
        zoneB: { // Thường (18-26°C)
            temp: +(18 + Math.random() * 8).toFixed(1),
            humidity: +(50 + Math.random() * 15).toFixed(1),
            co2: +(390 + Math.random() * 80).toFixed(0),
            vibration: +(Math.random() * 0.04).toFixed(3)
        },
        zoneC: { // Điều hòa (15-22°C)
            temp: +(15 + Math.random() * 7).toFixed(1),
            humidity: +(55 + Math.random() * 15).toFixed(1),
            co2: +(395 + Math.random() * 50).toFixed(0),
            vibration: +(Math.random() * 0.03).toFixed(3)
        },
        zoneD: { // Đông lạnh (-25 đến -15°C)
            temp: +(-25 + Math.random() * 10).toFixed(1),
            humidity: +(75 + Math.random() * 15).toFixed(1),
            co2: +(370 + Math.random() * 40).toFixed(0),
            vibration: +(Math.random() * 0.02).toFixed(3)
        }
    };
}

// ==========================================
// SIM SNAPSHOT — Persist sim state
// ==========================================
function loadSimSnapshot() {
    try {
        const raw = localStorage.getItem(DB_KEY + '_simstate');
        return raw ? JSON.parse(raw) : null;
    } catch (e) { return null; }
}
function saveSimSnapshot(state) {
    try { localStorage.setItem(DB_KEY + '_simstate', JSON.stringify(state)); } catch (e) { }
}

// ==========================================
// SNAPSHOTS — Lưu trạng thái kho
// ==========================================
function loadSnapshots() {
    try {
        const raw = localStorage.getItem(DB_KEY + '_snapshots');
        return raw ? JSON.parse(raw) : [];
    } catch (e) { return []; }
}
function saveSnapshots(snaps) {
    try { localStorage.setItem(DB_KEY + '_snapshots', JSON.stringify(snaps)); } catch (e) { }
}

// ==========================================
// MIGRATION — Backward compat với data cũ
// ==========================================
function migrateInventoryItem(item) {
    if (item.quality === undefined) item.quality = 100;
    if (item.minTemp === undefined) item.minTemp = (item.category === 'Thực phẩm') ? 2 : 15;
    if (item.maxTemp === undefined) item.maxTemp = (item.category === 'Thực phẩm') ? 8 : 30;
    if (item.buyPrice === undefined) item.buyPrice = 50000;
    if (item.baseSellPrice === undefined) item.baseSellPrice = 75000;
    if (item.currentSellPrice === undefined) item.currentSellPrice = 75000;
    if (item.entryDate === undefined) item.entryDate = item.importDate || '2026-05-01';
    if (item.expiryDate === undefined) item.expiryDate = item.expiry || '2026-12-31';
    if (item.warehouseZone === undefined) item.warehouseZone = 'B';
    if (item.decayRate === undefined) item.decayRate = (item.category === 'Thực phẩm') ? 0.3 : (item.category === 'Dược phẩm') ? 0.15 : 0.05;
    // Smart Inventory fields
    if (item.storageZone === undefined) {
        const zoneMap = { 'A': 'Chilled', 'B': 'Ambient', 'C': 'Ambient', 'D': 'Frozen' };
        item.storageZone = zoneMap[item.warehouseZone] || 'Ambient';
    }
    if (item.batchId === undefined) item.batchId = 'LOT-' + item.id + '-001';
    if (item.importedAt === undefined) item.importedAt = item.entryDate || item.importDate || '2026-05-01';
    return item;
}

function migrateShippingItem(item) {
    if (item.originHub === undefined) item.originHub = 'Kho tổng HN';
    if (item.destination === undefined) item.destination = item.location || 'TP.HCM';
    if (item.fuelConsumed === undefined) item.fuelConsumed = 0;
    if (item.distance === undefined) item.distance = 0;
    if (item.vehicleType === undefined) item.vehicleType = item.type === 'Hỏa tốc' ? 'Xe máy' : 'Xe tải 1.5T';
    if (item.estimatedArrival === undefined) {
        const d = new Date(); d.setDate(d.getDate() + 2);
        item.estimatedArrival = d.toISOString().slice(0, 16);
    }
    if (item.shippingStatus === undefined) item.shippingStatus = item.status || 'Đang vận chuyển';
    if (item.driverName === undefined) item.driverName = item.shipStaff || 'Nguyễn Văn A';
    return item;
}

// ==========================================
// DB DEFAULTS — Dữ liệu mẫu mở rộng
// ==========================================
const DB_DEFAULTS = {
    orders: [
        { id: 'ORD-8821', customer: 'Nguyễn Bích Phương', address: 'Quận 1, TP.HCM', product: 'Thịt bò Úc', status: 'Đang giao', priority: 'Hỏa tốc', phone: '0901234567', sku: 'SKU-001', qty: 20 },
        { id: 'ORD-8825', customer: 'Trần Minh Tâm', address: 'Quận 7, TP.HCM', product: 'Máy sấy Dyson', status: 'Chờ xử lý', priority: 'Thường', phone: '0912345678', sku: 'SKU-003', qty: 1 },
        { id: 'ORD-8826', customer: 'Lê Minh Hưng', address: 'Quận 3, TP.HCM', product: 'Gia vị 12 món', status: 'Đã nhận', priority: 'Ưu tiên cao', phone: '0923456789', sku: 'SKU-002', qty: 5 },
        { id: 'ORD-8830', customer: 'Phạm Thu Hà', address: 'Bình Thạnh, TP.HCM', product: 'Xúc xích Đức', status: 'Đang đóng gói', priority: 'Thường', phone: '0934567890', sku: 'SKU-001', qty: 100 },
    ],
    inventoryList: [
        { id: 'SKU-001', name: 'Xúc xích Đức', category: 'Thực phẩm', stock: 1200, status: 'Còn hàng', pos: 'A-01', expiryDate: '2026-12-30', importDate: '2026-05-01', area: 24, quality: 97, minTemp: 2, maxTemp: 8, buyPrice: 85000, baseSellPrice: 120000, currentSellPrice: 120000, entryDate: '2026-05-01', warehouseZone: 'A', decayRate: 0.3, storageZone: 'Chilled', batchId: 'LOT-SKU001-001', importedAt: '2026-05-01' },
        { id: 'SKU-002', name: 'Gia vị 12 món', category: 'Thực phẩm', stock: 320, status: 'Còn hàng', pos: 'B-05', expiryDate: '2027-03-15', importDate: '2026-04-20', area: 8, quality: 99, minTemp: 15, maxTemp: 30, buyPrice: 25000, baseSellPrice: 45000, currentSellPrice: 45000, entryDate: '2026-04-20', warehouseZone: 'B', decayRate: 0.1, storageZone: 'Ambient', batchId: 'LOT-SKU002-001', importedAt: '2026-04-20' },
        { id: 'SKU-003', name: 'Máy sấy Dyson', category: 'Điện tử', stock: 12, status: 'Còn hàng', pos: 'C-02', expiryDate: '', importDate: '2026-03-10', area: 6, quality: 100, minTemp: 10, maxTemp: 35, buyPrice: 3500000, baseSellPrice: 5200000, currentSellPrice: 5200000, entryDate: '2026-03-10', warehouseZone: 'C', decayRate: 0.01, storageZone: 'Ambient', batchId: 'LOT-SKU003-001', importedAt: '2026-03-10' },
        { id: 'SKU-004', name: 'Mì gói Hảo Hảo', category: 'Thực phẩm', stock: 45, status: 'Sắp hết hàng', pos: 'B-12', expiryDate: '2026-08-10', importDate: '2026-02-01', area: 4, quality: 88, minTemp: 15, maxTemp: 30, buyPrice: 3500, baseSellPrice: 6000, currentSellPrice: 5280, entryDate: '2026-02-01', warehouseZone: 'B', decayRate: 0.2, storageZone: 'Ambient', batchId: 'LOT-SKU004-001', importedAt: '2026-02-01' },
        { id: 'SKU-005', name: 'Vaccine cúm A', category: 'Dược phẩm', stock: 200, status: 'Còn hàng', pos: 'D-01', expiryDate: '2026-11-01', importDate: '2026-05-05', area: 2, quality: 100, minTemp: 2, maxTemp: 8, buyPrice: 180000, baseSellPrice: 280000, currentSellPrice: 280000, entryDate: '2026-05-05', warehouseZone: 'A', decayRate: 0.5, storageZone: 'Chilled', batchId: 'LOT-SKU005-001', importedAt: '2026-05-05' },
        { id: 'SKU-006', name: 'Nước tẩy rửa Vim', category: 'Hóa chất', stock: 560, status: 'Còn hàng', pos: 'C-08', expiryDate: '2028-01-01', importDate: '2026-04-15', area: 12, quality: 100, minTemp: 5, maxTemp: 40, buyPrice: 18000, baseSellPrice: 32000, currentSellPrice: 32000, entryDate: '2026-04-15', warehouseZone: 'C', decayRate: 0.02, storageZone: 'Ambient', batchId: 'LOT-SKU006-001', importedAt: '2026-04-15' },
        { id: 'SKU-007', name: 'Thịt bò Kobe đông lạnh', category: 'Thực phẩm', stock: 80, status: 'Còn hàng', pos: 'D-02', expiryDate: '2026-06-15', importDate: '2026-05-01', area: 10, quality: 95, minTemp: -25, maxTemp: -15, buyPrice: 650000, baseSellPrice: 980000, currentSellPrice: 980000, entryDate: '2026-05-01', warehouseZone: 'D', decayRate: 0.4, storageZone: 'Frozen', batchId: 'LOT-SKU007-001', importedAt: '2026-05-01' },
        { id: 'SKU-008', name: 'Tôm sú đông IQF', category: 'Thực phẩm', stock: 350, status: 'Còn hàng', pos: 'D-03', expiryDate: '2026-05-25', importDate: '2026-04-10', area: 14, quality: 72, minTemp: -20, maxTemp: -18, buyPrice: 220000, baseSellPrice: 340000, currentSellPrice: 306000, entryDate: '2026-04-10', warehouseZone: 'D', decayRate: 0.6, storageZone: 'Frozen', batchId: 'LOT-SKU008-001', importedAt: '2026-04-10' },
        { id: 'SKU-009', name: 'Kem tươi Anchor', category: 'Thực phẩm', stock: 120, status: 'Còn hàng', pos: 'D-04', expiryDate: '2026-05-18', importDate: '2026-05-03', area: 5, quality: 55, minTemp: -18, maxTemp: -16, buyPrice: 85000, baseSellPrice: 130000, currentSellPrice: 104000, entryDate: '2026-05-03', warehouseZone: 'D', decayRate: 0.8, storageZone: 'Frozen', batchId: 'LOT-SKU009-001', importedAt: '2026-05-03' },
    ],
    inboundList: [
        { id: 'NK-001', name: 'Xúc xích Đức', qty: 1200, date: '2026-05-01', pos: 'A-01', area: 24, staff: 'Nguyễn Văn An' },
        { id: 'NK-002', name: 'Mì gói Hảo Hảo', qty: 45, date: '2026-02-01', pos: 'B-12', area: 4, staff: 'Trần Thị Bình' },
        { id: 'NK-003', name: 'Vaccine cúm A', qty: 200, date: '2026-05-05', pos: 'D-01', area: 2, staff: 'Admin Pro' },
        { id: 'NK-004', name: 'Máy sấy Dyson', qty: 12, date: '2026-03-10', pos: 'C-02', area: 6, staff: 'Admin Pro' },
        { id: 'NK-005', name: 'Gia vị 12 món', qty: 320, date: '2026-04-20', pos: 'B-05', area: 8, staff: 'Trần Thị Bình' },
        { id: 'NK-006', name: 'Nước tẩy rửa Vim', qty: 560, date: '2026-04-15', pos: 'C-08', area: 12, staff: 'Nguyễn Văn An' },
    ],
    outboundList: [
        { id: 'XK-001', orderId: 'ORD-8821', type: 'Bán lẻ', date: '2026-05-06', staff: 'Lê Văn B', customerName: 'Nguyễn Bích Phương', qty: 20, shipType: 'Hỏa tốc' },
        { id: 'XK-002', orderId: 'ORD-8826', type: 'Bán lẻ', date: '2026-05-07', staff: 'Trần Thị Bình', customerName: 'Lê Minh Hưng', qty: 5, shipType: 'Thường' },
    ],
    shippingList: [
        { trackId: 'LOG-001', orderId: 'ORD-8821', location: 'Kho trung chuyển HN', type: 'Hỏa tốc', status: 'Đang đi', exportStaff: 'Nguyễn Văn An', exportRole: 'Nhân viên xuất kho', shipStaff: 'Lê Tài Xế', originHub: 'Long Biên', destination: 'Quận 1, TP.HCM', fuelConsumed: 12.5, distance: 85, vehicleType: 'Xe Van', estimatedArrival: '2026-05-09T14:00', shippingStatus: 'Đang vận chuyển', driverName: 'Lê Văn Tài' },
        { trackId: 'LOG-002', orderId: 'ORD-8825', location: 'Quận 7, TP.HCM', type: 'Thường', status: 'Đang chuẩn bị', exportStaff: 'Trần Thị Bình', exportRole: 'Nhân viên xuất kho', shipStaff: 'Nguyễn Tài Xế', originHub: 'Hoài Đức', destination: 'Quận 7, TP.HCM', fuelConsumed: 0, distance: 0, vehicleType: 'Xe tải 1.5T', estimatedArrival: '2026-05-11T10:00', shippingStatus: 'Chuẩn bị hàng', driverName: 'Nguyễn Văn Hùng' },
        { trackId: 'LOG-003', orderId: 'ORD-8830', location: 'Kho tổng HN', type: 'Thường', status: 'Đang chuẩn bị', exportStaff: 'Admin Pro', exportRole: 'Quản lý kho', shipStaff: 'Phạm Tài Xế', originHub: 'Ngọc Hồi', destination: 'Bình Thạnh, TP.HCM', fuelConsumed: 0, distance: 0, vehicleType: 'Xe tải 5T', estimatedArrival: '2026-05-12T16:00', shippingStatus: 'Khởi tạo', driverName: 'Phạm Văn Long' },
    ],
    alerts: [
        { name: 'Mì gói Hảo Hảo', type: 'Sắp hết hàng', level: 'Trung bình', qty: 45, alertDate: '2026-05-01', handling: 'Đặt hàng bổ sung', note: 'Cần nhập thêm trước cuối tuần' },
        { name: 'Sữa tắm Dove', type: 'Hết hàng', level: 'Khẩn cấp', qty: 0, alertDate: '2026-05-03', handling: 'Vận chuyển hỏa tốc', note: 'Đã nhận đơn từ 3 khách hàng đang chờ' }
    ],
    employeeList: [
        { id: 1, name: 'Nguyễn Văn An', position: 'Quản lý kho', workTime: '08:00 - 17:00', status: 'Đang làm' },
        { id: 2, name: 'Trần Thị Bình', position: 'Đóng gói', workTime: '08:00 - 17:00', status: 'Đang làm' },
        { id: 3, name: 'Lê Văn Tài', position: 'Tài xế', workTime: '07:00 - 19:00', status: 'Đang làm' },
        { id: 4, name: 'Phạm Văn Long', position: 'Tài xế', workTime: '06:00 - 18:00', status: 'Đang làm' },
        { id: 5, name: 'Võ Thị Thu', position: 'Kỹ thuật IoT', workTime: '08:00 - 17:00', status: 'Đang làm' },
    ]
};

// ==========================================
// LOAD / SAVE / RESET DB
// ==========================================
function loadDB() {
    try {
        const raw = localStorage.getItem(DB_KEY);
        if (!raw) return JSON.parse(JSON.stringify(DB_DEFAULTS));
        const data = JSON.parse(raw);
        // Migrate old data
        if (data.inventoryList) data.inventoryList = data.inventoryList.map(migrateInventoryItem);
        if (data.shippingList) data.shippingList = data.shippingList.map(migrateShippingItem);
        return data;
    } catch (e) {
        return JSON.parse(JSON.stringify(DB_DEFAULTS));
    }
}

function saveDB(data) {
    try {
        const snapshot = {
            orders: data.orders,
            inventoryList: data.inventoryList,
            inboundList: data.inboundList,
            outboundList: data.outboundList,
            shippingList: data.shippingList,
            alerts: data.alerts,
            employeeList: data.employeeList
        };
        localStorage.setItem(DB_KEY, JSON.stringify(snapshot));
    } catch (e) {
        console.warn('localStorage save failed:', e);
    }
}

function resetDB() {
    localStorage.removeItem(DB_KEY);
    localStorage.removeItem(DB_KEY + '_iot');
    localStorage.removeItem(DB_KEY + '_simstate');
}

// ==========================================
// HỆ THỐNG PHÂN QUYỀN
// ==========================================
const USERS_DB = [
    {
        id: 1,
        username: 'admin',
        password: 'admin123',
        name: 'Nguyễn Quản Trị',
        role: 'admin',
        roleLabel: 'Quản trị viên',
        icon: 'fas fa-crown',
        color: '#6366f1',
        permissions: ['create_order', 'edit_order', 'delete_order',
            'create_inbound', 'edit_inbound', 'delete_inbound',
            'create_outbound', 'edit_outbound', 'delete_outbound',
            'create_shipping', 'edit_shipping', 'delete_shipping',
            'view_inventory', 'edit_inventory', 'delete_inventory',
            'manage_employees', 'view_employees',
            'view_alerts', 'create_alert', 'delete_alert',
            'view_reports', 'manage_system', 'view_iot', 'manage_snapshots', 'view_logistics', 'view_finance']
    },
    {
        id: 2,
        username: 'warehouse',
        password: 'kho123',
        name: 'Trần Nhân Kho',
        role: 'warehouse',
        roleLabel: 'Nhân viên kho',
        icon: 'fas fa-boxes-stacked',
        color: '#10b981',
        permissions: ['create_inbound', 'edit_inbound',
            'create_outbound', 'edit_outbound',
            'view_inventory', 'edit_inventory',
            'view_alerts', 'create_alert',
            'view_employees', 'view_iot']
    },
    {
        id: 3,
        username: 'shipper',
        password: 'ship123',
        name: 'Lê Tài Xế',
        role: 'shipper',
        roleLabel: 'Nhân viên vận chuyển',
        icon: 'fas fa-truck-fast',
        color: '#3b82f6',
        permissions: ['view_inventory',
            'create_shipping', 'edit_shipping',
            'view_alerts', 'view_iot', 'view_logistics']
    }
];

// Tab visibility per role
const ROLE_TABS = {
    admin: { home: 'Trang Chủ', orders: 'Đơn Hàng', inventory: '🧠 Smart Inventory', inbound: 'Lịch Sử Nhập', outbound: 'Lịch Sử Xuất', shipping: 'Vận Chuyển', logistics: '📍 Logistics & GPS', iot: 'IoT Monitor', alerts: 'Cảnh Báo', employees: 'Nhân Sự', reports: '💰 Tài Chính & Thống Kê' },
    warehouse: { home: 'Trang Chủ', inventory: '🧠 Smart Inventory', inbound: 'Lịch Sử Nhập', outbound: 'Lịch Sử Xuất', iot: 'IoT Monitor', alerts: 'Cảnh Báo', employees: 'Nhân Sự' },
    shipper: { home: 'Trang Chủ', shipping: 'Vận Chuyển', logistics: '📍 Logistics & GPS', inventory: '🧠 Smart Inventory', iot: 'IoT Monitor', alerts: 'Cảnh Báo' }
};

function getSession() {
    try { return JSON.parse(sessionStorage.getItem('wh_session')); } catch (e) { return null; }
}
function setSession(user) {
    try { sessionStorage.setItem('wh_session', JSON.stringify(user)); } catch (e) { }
}
function clearSession() {
    try { sessionStorage.removeItem('wh_session'); } catch (e) { }
}

// ==========================================
// LOGISTICS CONFIGS
// ==========================================
const HUB_DATA = {
    'Long Biên': { name: 'Hub Long Biên (Main)', coords: [21.0401, 105.8913], color: '#6366f1', type: 'main' },
    'Hoài Đức': { name: 'Hub Hoài Đức', coords: [21.0253, 105.7042], color: '#10b981', type: 'sub' },
    'Ngọc Hồi': { name: 'Hub Ngọc Hồi', coords: [20.9324, 105.8450], color: '#f59e0b', type: 'sub' },
    'Hà Đông': { name: 'Hub Hà Đông', coords: [20.9700, 105.7750], color: '#ef4444', type: 'sub' }
};

const VEHICLE_CONFIGS = {
    'Xe Van':      { fuelPerKm: 0.08, avgSpeedKmh: 45, icon: 'fas fa-truck-ramp-box', co2PerKm: 0.15 },
    'Xe tải 1.5T': { fuelPerKm: 0.12, avgSpeedKmh: 55, icon: 'fas fa-truck',       co2PerKm: 0.28 },
    'Xe tải 2.5T đông lạnh': { fuelPerKm: 0.18, avgSpeedKmh: 48, icon: 'fas fa-snowflake', co2PerKm: 0.35 },
    'Xe tải 5T':   { fuelPerKm: 0.25, avgSpeedKmh: 42, icon: 'fas fa-truck-moving', co2PerKm: 0.55 },
};

// ==========================================
// VEHICLE CONFIGS — Cấu hình phương tiện
// ==========================================
const VEHICLE_OLD_CONFIGS = {
    'Xe máy':      { fuelPerKm: 0.04, avgSpeedKmh: 35, icon: 'fas fa-motorcycle',  co2PerKm: 0.08 },
    'Xe tải 1.5T': { fuelPerKm: 0.12, avgSpeedKmh: 55, icon: 'fas fa-truck',       co2PerKm: 0.28 },
    'Xe tải 5T':   { fuelPerKm: 0.22, avgSpeedKmh: 50, icon: 'fas fa-truck-moving', co2PerKm: 0.52 },
    'Container':   { fuelPerKm: 0.38, avgSpeedKmh: 45, icon: 'fas fa-truck-front',  co2PerKm: 0.90 },
    'Máy bay':     { fuelPerKm: 3.50, avgSpeedKmh: 800, icon: 'fas fa-plane',       co2PerKm: 8.50 },
    'Tàu hỏa':     { fuelPerKm: 0.06, avgSpeedKmh: 120, icon: 'fas fa-train',       co2PerKm: 0.04 },
};

// ==========================================
// WAREHOUSE ZONES CONFIG
// ==========================================
const ZONE_CONFIGS = {
    'A': { label: 'Zone A — Lạnh (2-8°C)', color: '#3b82f6', baseTemp: 5,   minTemp: 2,  maxTemp: 8,  icon: 'fas fa-snowflake' },
    'B': { label: 'Zone B — Thường (18-26°C)', color: '#10b981', baseTemp: 22,  minTemp: 18, maxTemp: 26, icon: 'fas fa-box' },
    'C': { label: 'Zone C — Điều hòa (15-22°C)', color: '#6366f1', baseTemp: 18,  minTemp: 15, maxTemp: 22, icon: 'fas fa-wind' },
    'D': { label: 'Zone D — Đông lạnh (-25 đến -15°C)', color: '#0ea5e9', baseTemp: -20, minTemp: -25, maxTemp: -15, icon: 'fas fa-icicles' },
};
