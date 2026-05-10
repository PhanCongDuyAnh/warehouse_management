// ==========================================
// CRUD METHODS — Thêm, Sửa, Xóa dữ liệu
// ==========================================
function getCrudMethods() {
    return {
        // ── THÊM ĐƠN HÀNG ──
        addNewOrder() {
            if (!this._validateAllOrder()) {
                this.toast('Vui lòng kiểm tra lại các trường bắt buộc.', 'error', 'Dữ liệu không hợp lệ');
                return;
            }
            const orderId = 'ORD-' + Math.floor(Math.random() * 9000 + 1000);
            const lotId = this.fefoSuggestion ? this.fefoSuggestion.batchId : 'N/A';
            
            this.orders.unshift({ 
                ...this.newOrder, 
                id: orderId, 
                status: 'Chờ xử lý',
                lotId: lotId,
                selectedLot: this.fefoSuggestion ? { ...this.fefoSuggestion } : null
            });

            this.persist();
            this.showAddOrder = false;
            this.newOrder = { customer: '', product: '', priority: 'Thường', phone: '', address: '', sku: '', qty: 1 };
            this.fefoSuggestion = null;
            this.resetOrderErrors();
            this.currentTab = 'orders';
            this.toast('Đã tạo đơn hàng mới thành công!', 'success');
        },

        // ── NHẬP KHO ──
        addNewProduct() {
            if (!this._validateAllProd()) {
                this.toast('Vui lòng kiểm tra lại các trường bắt buộc.', 'error', 'Dữ liệu không hợp lệ');
                return;
            }
            const sku = this.newProd.id.trim().toUpperCase();
            const existing = this.inventoryList.find(p => p.id.toLowerCase() === sku.toLowerCase());
            if (existing) {
                this.skuDuplicateTarget = {
                    sku: existing.id,
                    existingName: existing.name,
                    qty: parseInt(this.newProd.stock) || 0
                };
                this.showSkuDuplicateConfirm = true;
                return;
            }
            this._doAddProduct();
        },

        confirmSkuUpdate() {
            const existing = this.inventoryList.find(p => p.id.toLowerCase() === this.skuDuplicateTarget.sku.toLowerCase());
            if (existing) {
                existing.stock += this.skuDuplicateTarget.qty;
                existing.status = existing.stock === 0 ? 'Hết hàng' : existing.stock <= 50 ? 'Sắp hết hàng' : 'Còn hàng';
                this.inboundList.unshift({
                    id: 'NK-' + Math.floor(Math.random() * 10000),
                    name: existing.name,
                    qty: this.skuDuplicateTarget.qty,
                    date: this.newProd.importDate || new Date().toLocaleDateString('vi-VN'),
                    pos: this.newProd.pos || existing.pos,
                    area: parseInt(this.newProd.area) || 0,
                    staff: this.currentUser?.name || 'AI Assistant'
                });
                this.persist();
            }
            this.showSkuDuplicateConfirm = false;
            this.showAddProduct = false;
            this._resetNewProd();
            this.resetProdErrors();
            this.currentTab = 'inventory';
            this.toast(`Đã cập nhật số lượng cho SKU <b>${this.skuDuplicateTarget.sku}</b>!`, 'success', 'Cập nhật SKU');
            this.skuDuplicateTarget = { sku: '', existingName: '', qty: 0 };
        },

        cancelSkuUpdate() {
            this.showSkuDuplicateConfirm = false;
            this.toast('Đã hủy. Vui lòng đổi mã SKU hoặc chọn SKU khác.', 'warning', 'Lưu ý');
        },

        _doAddProduct() {
            const qty = parseInt(this.newProd.stock) || 0;
            const sku = this.newProd.id.trim().toUpperCase();
            const buyP = parseFloat(this.newProd.buyPrice) || 0;
            const sellP = parseFloat(this.newProd.baseSellPrice) || 0;

            const newItem = {
                id: sku,
                name: this.newProd.name,
                category: this.newProd.category,
                stock: qty,
                status: qty === 0 ? 'Hết hàng' : qty <= 50 ? 'Sắp hết hàng' : 'Còn hàng',
                pos: this.newProd.pos || 'Chưa xếp',
                expiryDate: this.newProd.expiryDate || '',
                importDate: this.newProd.importDate || new Date().toISOString().split('T')[0],
                area: parseInt(this.newProd.area) || 0,
                // Extended fields
                quality: parseFloat(this.newProd.quality) || 100,
                minTemp: parseFloat(this.newProd.minTemp) || 15,
                maxTemp: parseFloat(this.newProd.maxTemp) || 30,
                buyPrice: buyP,
                baseSellPrice: sellP,
                currentSellPrice: sellP,
                entryDate: this.newProd.importDate || new Date().toISOString().split('T')[0],
                warehouseZone: this.newProd.warehouseZone || 'B',
                decayRate: parseFloat(this.newProd.decayRate) || 0.05,
            };

            this.inventoryList.unshift(newItem);
            this.inboundList.unshift({
                id: 'NK-' + Math.floor(Math.random() * 10000),
                name: this.newProd.name,
                qty,
                date: this.newProd.importDate || new Date().toLocaleDateString('vi-VN'),
                pos: this.newProd.pos || 'Chưa xếp',
                area: parseInt(this.newProd.area) || 0,
                staff: this.currentUser?.name || 'AI Assistant'
            });
            this.persist();
            this.showAddProduct = false;
            this._resetNewProd();
            this.resetProdErrors();
            this.currentTab = 'inventory';
            this.toast('Đã nhập kho sản phẩm thành công!', 'success');
        },

        _resetNewProd() {
            this.newProd = {
                id: '', name: '', category: 'Thực phẩm', stock: 0, pos: '',
                expiryDate: '', importDate: new Date().toISOString().split('T')[0], area: 0,
                quality: 100, minTemp: 2, maxTemp: 8, buyPrice: 0, baseSellPrice: 0,
                warehouseZone: 'B', decayRate: 0.1
            };
        },

        updateInventory(sku, name, quantity, position = 'Chưa xếp', category = 'Chưa phân loại', expiryDate = '', importDate = '', area = 0) {
            const qty = parseInt(quantity);
            const existing = this.inventoryList.find(p =>
                p.name.toLowerCase() === name.toLowerCase() ||
                p.id.toLowerCase() === sku.toLowerCase()
            );
            if (existing) {
                existing.stock += qty;
                existing.status = existing.stock <= 50 ? 'Sắp hết hàng' : (existing.stock === 0 ? 'Hết hàng' : 'Còn hàng');
            } else {
                this.inventoryList.unshift(migrateInventoryItem({
                    id: sku, name, category, stock: qty,
                    status: qty <= 50 ? 'Sắp hết hàng' : 'Còn hàng',
                    pos: position, expiryDate, importDate, area
                }));
            }
            this.inboundList.unshift({
                id: 'NK-' + Math.floor(Math.random() * 10000),
                name, qty,
                date: importDate || new Date().toLocaleDateString('vi-VN'),
                pos: position, area,
                staff: this.currentUser?.name || 'AI Assistant'
            });
            this.persist();
        },

        // ── XUẤT KHO ──
        addNewExport() {
            if (!this._validateAllEx()) {
                this.toast('Vui lòng kiểm tra lại các trường bắt buộc.', 'error', 'Dữ liệu không hợp lệ');
                return;
            }
            this.outboundList.unshift({
                id: 'XK-' + Math.floor(Math.random() * 10000),
                orderId: this.newEx.orderId,
                type: this.newEx.type,
                date: this.newEx.exportDate || new Date().toLocaleDateString('vi-VN'),
                staff: this.newEx.staff,
                customerName: this.newEx.customerName,
                qty: this.newEx.qty,
                shipType: this.newEx.shipType
            });
            this.persist();
            this.showExportModal = false;
            this.newEx = { orderId: '', type: 'Bán lẻ', staff: '', exportDate: new Date().toISOString().split('T')[0], customerName: '', qty: '', shipType: 'Thường' };
            this.resetExErrors();
            this.currentTab = 'outbound';
            this.toast('Đã tạo phiếu xuất kho thành công!', 'success');
        },

        // ── NHÂN SỰ ──
        addNewEmployee() {
            if (!this._validateAllEmp()) {
                this.toast('Vui lòng kiểm tra lại các trường bắt buộc.', 'error', 'Dữ liệu không hợp lệ');
                return;
            }
            const dupName = this.employeeList.find(e => e.name.trim().toLowerCase() === this.newEmp.name.trim().toLowerCase());
            if (dupName) {
                this.empErr.name = 'Nhân viên với tên này đã tồn tại trong hệ thống.';
                this.toast('Tên nhân viên đã tồn tại!', 'warning', 'Trùng dữ liệu');
                return;
            }
            this.employeeList.push({ id: Date.now(), ...this.newEmp, status: this.newEmp.empStatus || 'Đang làm' });
            this.persist();
            this.showAddEmployee = false;
            this.newEmp = { name: '', position: this.positions[0] || 'Đóng gói', workTime: '08:00 - 17:00', empStatus: 'Đang làm' };
            this.resetEmpErrors();
            this.toast('Đã thêm nhân viên mới thành công!', 'success');
        },

        removeEmployee(id) {
            this.employeeList = this.employeeList.filter(e => e.id !== id);
            this.persist();
            this.toast('Đã xóa nhân viên khỏi hệ thống.', 'error', 'Đã xóa', 3000);
        },

        // ── VẬN CHUYỂN ──
        addNewShipping() {
            if (!this._validateAllShip()) {
                this.toast('Vui lòng kiểm tra lại các trường bắt buộc.', 'error', 'Dữ liệu không hợp lệ');
                return;
            }
            // Tự tính ETA nếu chưa có
            if (!this.newShip.estimatedArrival) {
                const vehicleCfg = VEHICLE_CONFIGS[this.newShip.vehicleType] || VEHICLE_CONFIGS['Xe tải 1.5T'];
                const etaHours = this.newShip.type === 'Hỏa tốc' ? 24 : this.newShip.type === 'Giao nhanh' ? 48 : 72;
                const eta = new Date(this.simVirtualTime.getTime() + etaHours * 3600000);
                this.newShip.estimatedArrival = eta.toISOString().slice(0, 16);
            }
            this.shippingList.unshift({
                ...this.newShip,
                fuelConsumed: 0,
                distance: 0,
                shippingStatus: 'Khởi tạo',
                location: this.newShip.originHub || 'Kho tổng HN',
            });
            this.persist();
            this.showAddShipping = false;
            this._resetNewShip();
            this.resetShipErrors();
            this.currentTab = 'shipping';
            this.toast('Đã tạo vận đơn mới thành công!', 'success');
        },

        _resetNewShip() {
            this.newShip = {
                trackId: '', orderId: '', location: 'Kho tổng', type: 'Thường', status: 'Khởi tạo',
                exportStaff: '', exportRole: 'Nhân viên xuất kho', shipStaff: '',
                originHub: 'Kho tổng HN', destination: '', vehicleType: 'Xe tải 1.5T',
                driverName: '', estimatedArrival: ''
            };
        },

        // ── CẢNH BÁO ──
        addNewAlert() {
            if (!this.newAlrt.name.trim()) {
                this.toast('Vui lòng nhập tên sản phẩm cảnh báo.', 'error', 'Thiếu thông tin');
                return;
            }
            if (this.newAlrt.name.trim().length < 2) {
                this.toast('Tên sản phẩm phải có ít nhất 2 ký tự.', 'error', 'Dữ liệu không hợp lệ');
                return;
            }
            const qty = parseInt(this.newAlrt.qty);
            if (isNaN(qty) || qty < 0) {
                this.toast('Số lượng tồn kho không được âm.', 'error', 'Dữ liệu không hợp lệ');
                return;
            }
            if (!this.newAlrt.alertDate) {
                this.toast('Vui lòng chọn ngày cảnh báo.', 'error', 'Thiếu thông tin');
                return;
            }
            this.alerts.unshift({ ...this.newAlrt, qty });
            this.persist();
            this.showAddAlert = false;
            this.newAlrt = { name: '', type: 'Sắp hết hàng', level: 'Trung bình', qty: 0, alertDate: new Date().toISOString().split('T')[0], handling: 'Đặt hàng bổ sung', note: '' };
            this.toast('Đã thêm cảnh báo tồn kho!', 'warning');
        },

        // ── XÓA ──
        confirmDelete(listName, id, label) {
            this.deleteTarget = { list: listName, id, label };
            this.showDeleteConfirm = true;
        },

        executeDelete() {
            const { list, id, label } = this.deleteTarget;
            if (list === 'orders') this.orders = this.orders.filter(o => o.id !== id);
            else if (list === 'inventoryList') this.inventoryList = this.inventoryList.filter(p => p.id !== id);
            else if (list === 'inboundList') this.inboundList = this.inboundList.filter(i => i.id !== id);
            else if (list === 'outboundList') this.outboundList = this.outboundList.filter(o => o.id !== id);
            else if (list === 'shippingList') this.shippingList = this.shippingList.filter(s => s.trackId !== id);
            else if (list === 'alerts') this.alerts = this.alerts.filter(a => a.name !== id);
            else if (list === 'employeeList') this.employeeList = this.employeeList.filter(e => e.id !== id);
            this.persist();
            this.showDeleteConfirm = false;
            this.toast(`Đã xóa: ${label}`, 'error', 'Đã xóa', 3000);
            this.deleteTarget = { list: '', id: '', label: '' };
        },

        // ── KHÔI PHỤC DỮ LIỆU MẪU ──
        resetData() {
            resetDB();
            const fresh = JSON.parse(JSON.stringify(DB_DEFAULTS));
            this.orders = fresh.orders;
            this.inventoryList = fresh.inventoryList;
            this.inboundList = fresh.inboundList;
            this.outboundList = fresh.outboundList;
            this.shippingList = fresh.shippingList;
            this.alerts = fresh.alerts;
            this.employeeList = fresh.employeeList;
            this.categories = ['Thực phẩm', 'Điện tử', 'Gia dụng', 'Hóa chất', 'Dược phẩm'];
            saveCategories(this.categories);
            this.positions = [...DEFAULT_POSITIONS];
            savePositions(this.positions);
            this.iotData = generateInitialIotData();
            saveIotData(this.iotData);
            this.showResetConfirm = false;
            this.chatMessages.push({ sender: 'ai', text: '🔄 Đã khôi phục về dữ liệu mẫu ban đầu.' });
            this.toast('Đã khôi phục toàn bộ dữ liệu mẫu!', 'info', 'Khôi phục', 4000);
        },

        // ── SNAPSHOT SYSTEM ──
        createSnapshot(label) {
            const snapLabel = label || ('Manual — ' + this.simClockDisplay());
            if (!this.snapshots) this.snapshots = [];
            if (this.snapshots.length >= 10) {
                // Xóa snapshot cũ nhất (không phải auto nếu còn chỗ)
                this.snapshots.pop();
            }
            const snap = {
                id: 'snap-' + Date.now(),
                label: snapLabel,
                time: this.simVirtualTime.toISOString(),
                simTickCount: this.simTickCount,
                isManual: true,
                data: JSON.parse(JSON.stringify({
                    inventoryList: this.inventoryList,
                    shippingList: this.shippingList,
                    orders: this.orders,
                    alerts: this.alerts,
                    simState: this.simState
                }))
            };
            this.snapshots.unshift(snap);
            saveSnapshots(this.snapshots);
            this.showSnapshotModal = false;
            this.newSnapshotLabel = '';
            this.toast(`Snapshot "<b>${snapLabel}</b>" đã được lưu!`, 'success', 'Snapshot');
        },

        restoreSnapshot(id) {
            const snap = this.snapshots.find(s => s.id === id);
            if (!snap) { this.toast('Không tìm thấy snapshot!', 'error'); return; }
            const confirmed = window.confirm(`Khôi phục snapshot "${snap.label}"?\nTất cả dữ liệu hiện tại sẽ bị thay thế.`);
            if (!confirmed) return;
            this.orders = JSON.parse(JSON.stringify(snap.data.orders));
            this.inventoryList = JSON.parse(JSON.stringify(snap.data.inventoryList));
            this.shippingList = JSON.parse(JSON.stringify(snap.data.shippingList));
            this.alerts = JSON.parse(JSON.stringify(snap.data.alerts));
            this.simState = JSON.parse(JSON.stringify(snap.data.simState));
            this.simTickCount = snap.simTickCount || 0;
            this.simVirtualTime = new Date(snap.time);
            this.persist();
            this.toast(`Đã khôi phục snapshot "<b>${snap.label}</b>"`, 'info', 'Restore thành công');
        },

        deleteSnapshot(id) {
            this.snapshots = this.snapshots.filter(s => s.id !== id);
            saveSnapshots(this.snapshots);
            this.toast('Đã xóa snapshot.', 'error', 'Đã xóa', 2000);
        },

        exportSnapshotJson(id) {
            const snap = this.snapshots.find(s => s.id === id);
            if (!snap) return;
            const blob = new Blob([JSON.stringify(snap, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `snapshot_${snap.label.replace(/[^a-zA-Z0-9]/g, '_')}.json`;
            a.click();
            URL.revokeObjectURL(url);
            this.toast('Đã xuất snapshot JSON!', 'success');
        },

        // ── DIALOG DANH MỤC MỚI ──
        openNewCategoryDialog() {
            this.newCategoryName = '';
            this.showNewCategoryDialog = true;
            this.$nextTick(() => {
                if (this.$refs.newCatInput) this.$refs.newCatInput.focus();
            });
        },
        confirmNewCategory() {
            const name = this.newCategoryName.trim();
            if (!name) return;
            if (!this.categories.includes(name)) {
                this.categories.push(name);
                saveCategories(this.categories);
            }
            this.newProd.category = name;
            this.showNewCategoryDialog = false;
            this.newCategoryName = '';
        },
        cancelNewCategory() {
            this.newProd.category = this.categories[0] || 'Thực phẩm';
            this.showNewCategoryDialog = false;
            this.newCategoryName = '';
        },

        // ── DIALOG VỊ TRÍ NHÂN VIÊN MỚI ──
        openNewPositionDialog() {
            this.newPositionName = '';
            this.showNewPositionDialog = true;
            this.$nextTick(() => {
                if (this.$refs.newPosInput) this.$refs.newPosInput.focus();
            });
        },
        confirmNewPosition() {
            const name = this.newPositionName.trim();
            if (!name) return;
            if (!this.positions.includes(name)) {
                this.positions.push(name);
                savePositions(this.positions);
            }
            this.newEmp.position = name;
            this.showNewPositionDialog = false;
            this.newPositionName = '';
        },
        cancelNewPosition() {
            this.newEmp.position = this.positions[0] || 'Quản lý kho';
            this.showNewPositionDialog = false;
            this.newPositionName = '';
        },

        onOrderSkuChange() {
            const sku = this.newOrder.sku;
            if (!sku) {
                this.fefoSuggestion = null;
                return;
            }

            // Tìm tất cả các lô của SKU này
            const lots = this.inventoryList.filter(p => p.id === sku && p.stock > 0);
            
            if (lots.length === 0) {
                this.fefoSuggestion = null;
                return;
            }

            // Sắp xếp theo HSD (FEFO)
            lots.sort((a, b) => {
                if (!a.expiryDate && !b.expiryDate) return 0;
                if (!a.expiryDate) return 1;
                if (!b.expiryDate) return -1;
                return new Date(a.expiryDate) - new Date(b.expiryDate);
            });

            this.fefoSuggestion = lots[0];
            
            // Tự động điền tên sản phẩm nếu có
            const prod = this.inventoryList.find(p => p.id === sku);
            if (prod) this.newOrder.product = prod.name;
        },
    };
}
