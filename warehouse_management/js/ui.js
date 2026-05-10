// ==========================================
// UI HELPERS — Toast, Filters, Style Helpers
// ==========================================
function getUiMethods() {
    return {
        // ── SAVE MANUALLY ──
        persist() { saveDB(this); },

        // ── TOAST NOTIFICATION ──
        toast(msg, type = 'success', title = null, duration = 3500) {
            const container = document.getElementById('toast-container');
            if (!container) return;
            const icons = { success: 'fa-check', error: 'fa-xmark', warning: 'fa-triangle-exclamation', info: 'fa-circle-info' };
            const titles = { success: 'Thành công', error: 'Lỗi', warning: 'Cảnh báo', info: 'Thông tin' };
            const el = document.createElement('div');
            el.className = `toast toast-${type}`;
            el.innerHTML = `
                <div class="toast-icon"><i class="fas ${icons[type] || 'fa-check'}"></i></div>
                <div class="toast-body">
                    <div class="toast-title">${title || titles[type] || 'Thông báo'}</div>
                    <div class="toast-msg">${msg}</div>
                </div>
                <button class="toast-close" onclick="this.closest('.toast').remove()"><i class="fas fa-xmark"></i></button>
                <div class="toast-progress" style="animation-duration:${duration}ms"></div>
            `;
            container.appendChild(el);
            setTimeout(() => {
                el.classList.add('hide');
                setTimeout(() => el.remove(), 320);
            }, duration);
        },

        // ── BỘ LỌC ──
        filteredOrders() {
            return this.orderFilter === 'Tất cả'
                ? this.orders
                : this.orders.filter(o => o.status === this.orderFilter);
        },
        filteredInventory() {
            if (this.inventoryFilter === 'Tất cả') return this.inventoryList;
            if (['Còn hàng', 'Sắp hết hàng', 'Hết hàng'].includes(this.inventoryFilter))
                return this.inventoryList.filter(p => p.status === this.inventoryFilter);
            // Zone filter
            if (['A', 'B', 'C', 'D'].includes(this.inventoryFilter))
                return this.inventoryList.filter(p => p.warehouseZone === this.inventoryFilter);
            return this.inventoryList;
        },
        filteredInbound() {
            return this.inboundList.filter(i =>
                i.name.toLowerCase().includes(this.inboundSearch.toLowerCase()) ||
                i.id.toLowerCase().includes(this.inboundSearch.toLowerCase())
            );
        },
        filteredOutbound() {
            return this.outboundList.filter(o =>
                o.id.toLowerCase().includes(this.outboundSearch.toLowerCase()) ||
                o.orderId.toLowerCase().includes(this.outboundSearch.toLowerCase())
            );
        },
        filteredShipping() {
            return this.shippingList.filter(s =>
                s.trackId.toLowerCase().includes(this.shippingSearch.toLowerCase()) ||
                s.orderId.toLowerCase().includes(this.shippingSearch.toLowerCase()) ||
                (s.driverName || '').toLowerCase().includes(this.shippingSearch.toLowerCase())
            );
        },

        // ── Tính tổng % kho đã dùng ──
        totalWarehouseUsed() {
            const existing = this.inventoryList.reduce((sum, p) => sum + (parseInt(p.area) || 0), 0);
            const adding = parseInt(this.newProd.area) || 0;
            return Math.min(existing + adding, 100);
        },

        // ── ROLE / PERMISSION ──
        can(perm) {
            return this.currentUser?.permissions?.includes(perm) || false;
        },
        allowedTabs() {
            const role = this.currentUser?.role;
            return ROLE_TABS[role] || {};
        },

        // ── ORDER status style ──
        getStatusStyle(s) {
            const map = {
                'Đang giao': 'bg-blue-100 text-blue-600',
                'Chờ xử lý': 'bg-orange-100 text-orange-600',
                'Đang đóng gói': 'bg-purple-100 text-purple-600',
                'Đã nhận': 'bg-green-100 text-green-600',
            };
            return map[s] || 'bg-slate-100 text-slate-500';
        },

        // ── STOCK status style ──
        getStockStatusStyle(s) {
            const map = {
                'Còn hàng': 'bg-green-100 text-green-700',
                'Sắp hết hàng': 'bg-amber-100 text-amber-700',
                'Hết hàng': 'bg-red-100 text-red-700',
            };
            return map[s] || 'bg-slate-100 text-slate-500';
        },

        // ── QUALITY badge style ──
        getQualityStyle(quality) {
            const q = parseFloat(quality) || 0;
            if (q >= 80) return 'quality-good';
            if (q >= 50) return 'quality-warn';
            if (q >= 20) return 'quality-bad';
            return 'quality-critical';
        },
        getQualityColor(quality) {
            const q = parseFloat(quality) || 0;
            if (q >= 80) return '#10b981';
            if (q >= 50) return '#f59e0b';
            if (q >= 20) return '#ef4444';
            return '#7f1d1d';
        },
        getQualityLabel(quality) {
            const q = parseFloat(quality) || 0;
            if (q >= 80) return 'Tốt';
            if (q >= 50) return 'TB';
            if (q >= 20) return 'Kém';
            return 'Hỏng';
        },

        // ── SHIPPING status style ──
        getShippingStatusStyle(status) {
            const map = {
                'Khởi tạo': 'bg-slate-100 text-slate-500',
                'Chuẩn bị hàng': 'bg-purple-100 text-purple-600',
                'Xuất kho': 'bg-blue-100 text-blue-600',
                'Đang vận chuyển': 'bg-indigo-100 text-indigo-600',
                'Gần tới nơi': 'bg-cyan-100 text-cyan-700',
                'Đã giao': 'bg-green-100 text-green-700',
            };
            return map[status] || 'bg-slate-100 text-slate-500';
        },

        // ── VEHICLE icon & label ──
        getVehicleIcon(vehicleType) {
            const cfg = VEHICLE_CONFIGS[vehicleType];
            return cfg ? cfg.icon : 'fas fa-truck';
        },
        getVehicleColor(vehicleType) {
            const map = {
                'Xe máy': '#f59e0b',
                'Xe tải 1.5T': '#3b82f6',
                'Xe tải 5T': '#6366f1',
                'Container': '#7c3aed',
                'Máy bay': '#0ea5e9',
                'Tàu hỏa': '#10b981',
            };
            return map[vehicleType] || '#64748b';
        },

        // ── IOT Zone status ──
        getIotStatusClass(statusClass) {
            const map = {
                'iot-normal': 'bg-emerald-100 text-emerald-700',
                'iot-warning': 'bg-amber-100 text-amber-700',
                'iot-critical': 'bg-red-100 text-red-700',
            };
            return map[statusClass] || 'bg-slate-100 text-slate-500';
        },
        getIotStatusDot(statusClass) {
            const map = {
                'iot-normal': 'bg-emerald-500',
                'iot-warning': 'bg-amber-500',
                'iot-critical': 'bg-red-500',
            };
            return map[statusClass] || 'bg-slate-400';
        },

        // ── FORMAT HELPERS ──
        fmtCurrency(n) {
            if (!n && n !== 0) return '—';
            if (Math.abs(n) >= 1e9) return (n / 1e9).toFixed(2) + 'T đ';
            if (Math.abs(n) >= 1e6) return (n / 1e6).toFixed(1) + 'M đ';
            if (Math.abs(n) >= 1e3) return (n / 1e3).toFixed(0) + 'K đ';
            return n.toLocaleString('vi-VN') + ' đ';
        },
        fmtTemp(t) {
            return (typeof t === 'number' ? t.toFixed(1) : '—') + '°C';
        },
        fmtDatetime(iso) {
            if (!iso) return '—';
            try {
                const d = new Date(iso);
                const pad = n => String(n).padStart(2, '0');
                return pad(d.getDate()) + '/' + pad(d.getMonth() + 1) + '/' + d.getFullYear() + ' ' + pad(d.getHours()) + ':' + pad(d.getMinutes());
            } catch { return iso; }
        },

        // ── ZONE config accessor ──
        getZoneCfg(zone) {
            return ZONE_CONFIGS[zone] || ZONE_CONFIGS['B'];
        },
        getZoneLabel(zone) {
            const cfg = ZONE_CONFIGS[zone];
            return cfg ? cfg.label : 'Zone ' + zone;
        },
    };
}
