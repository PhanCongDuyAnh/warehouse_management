// ==========================================
// VALIDATION METHODS — Mở rộng với IoT fields
// ==========================================
function getValidatorMethods() {
    return {
        // ── Helpers ──
        _isValidPhone(v) {
            return /^(\+84|84|0)(3[2-9]|5[6-9]|7[0-9]|8[0-9]|9[0-9])[0-9]{7}$/.test(v.replace(/[\s\-\.]/g, ''));
        },
        _isValidTimeRange(v) {
            return /^([01]\d|2[0-3]):[0-5]\d\s*-\s*([01]\d|2[0-3]):[0-5]\d$/.test(v.trim());
        },
        _isValidSKU(v) {
            return /^[A-Za-z0-9\-_\.]{2,30}$/.test(v.trim());
        },

        // ── Order validators ──
        validateOrderField(field) {
            const v = this.newOrder;
            if (field === 'customer') {
                if (!v.customer.trim()) this.orderErr.customer = 'Vui lòng nhập tên khách hàng.';
                else if (v.customer.trim().length < 2) this.orderErr.customer = 'Tên khách hàng phải có ít nhất 2 ký tự.';
                else this.orderErr.customer = '';
            }
            if (field === 'phone') {
                if (!v.phone.trim()) this.orderErr.phone = 'Vui lòng nhập số điện thoại.';
                else if (!this._isValidPhone(v.phone)) this.orderErr.phone = 'Số điện thoại không hợp lệ (VD: 0901234567).';
                else this.orderErr.phone = '';
            }
            if (field === 'address') {
                if (!v.address.trim()) this.orderErr.address = 'Vui lòng nhập địa chỉ giao hàng.';
                else if (v.address.trim().length < 10) this.orderErr.address = 'Địa chỉ quá ngắn, vui lòng nhập đầy đủ.';
                else this.orderErr.address = '';
            }
            if (field === 'sku') {
                if (!v.sku) this.orderErr.sku = 'Vui lòng chọn sản phẩm.';
                else this.orderErr.sku = '';
            }
            if (field === 'qty') {
                const q = parseInt(v.qty);
                if (isNaN(q) || q <= 0) this.orderErr.qty = 'Số lượng phải lớn hơn 0.';
                else this.orderErr.qty = '';
            }
        },
        resetOrderErrors() { this.orderErr = { customer: '', phone: '', address: '', sku: '', qty: '' }; },

        // ── Product validators (mở rộng với IoT fields) ──
        validateProdField(field) {
            const v = this.newProd;
            const today = new Date().toISOString().split('T')[0];
            if (field === 'id') {
                if (!v.id.trim()) this.prodErr.id = 'Mã SKU không được để trống.';
                else if (!this._isValidSKU(v.id)) this.prodErr.id = 'SKU chỉ gồm chữ, số, dấu gạch ngang/dưới (2-30 ký tự).';
                else this.prodErr.id = '';
            }
            if (field === 'name') {
                if (!v.name.trim()) this.prodErr.name = 'Tên sản phẩm không được để trống.';
                else if (v.name.trim().length < 2) this.prodErr.name = 'Tên sản phẩm phải có ít nhất 2 ký tự.';
                else this.prodErr.name = '';
            }
            if (field === 'stock') {
                const qty = parseInt(v.stock);
                if (isNaN(qty) || v.stock === '' || v.stock === null) this.prodErr.stock = 'Số lượng không được để trống.';
                else if (qty < 0) this.prodErr.stock = 'Số lượng không được âm.';
                else if (qty === 0) this.prodErr.stock = 'Số lượng phải lớn hơn 0.';
                else if (!Number.isInteger(qty)) this.prodErr.stock = 'Số lượng phải là số nguyên.';
                else this.prodErr.stock = '';
            }
            if (field === 'importDate') {
                if (!v.importDate) this.prodErr.importDate = 'Vui lòng chọn ngày nhập kho.';
                else this.prodErr.importDate = '';
            }
            if (field === 'expiryDate') {
                if (v.expiryDate && v.expiryDate <= today) this.prodErr.expiryDate = 'Hạn sử dụng phải sau ngày hôm nay.';
                else if (v.expiryDate && v.importDate && v.expiryDate < v.importDate) this.prodErr.expiryDate = 'Hạn sử dụng phải sau ngày nhập kho.';
                else this.prodErr.expiryDate = '';
            }
            if (field === 'area') {
                const a = parseInt(v.area);
                if (a < 0 || a > 100) this.prodErr.area = 'Diện tích phải từ 0% đến 100%.';
                else if (this.totalWarehouseUsed() > 100) this.prodErr.area = 'Kho đã đầy! Không thể nhập thêm lô hàng này.';
                else this.prodErr.area = '';
            }
            // IoT/Quality fields
            if (field === 'quality') {
                const q = parseFloat(v.quality);
                if (isNaN(q) || q < 0 || q > 100) this.prodErr.quality = 'Chất lượng phải từ 0 đến 100%.';
                else this.prodErr.quality = '';
            }
            if (field === 'temperature') {
                const mn = parseFloat(v.minTemp);
                const mx = parseFloat(v.maxTemp);
                if (!isNaN(mn) && !isNaN(mx) && mn >= mx) {
                    this.prodErr.temperature = 'Nhiệt độ tối thiểu phải nhỏ hơn tối đa.';
                } else this.prodErr.temperature = '';
            }
            if (field === 'buyPrice') {
                const bp = parseFloat(v.buyPrice);
                if (isNaN(bp) || bp < 0) this.prodErr.buyPrice = 'Giá mua phải là số không âm.';
                else this.prodErr.buyPrice = '';
            }
            if (field === 'baseSellPrice') {
                const sp = parseFloat(v.baseSellPrice);
                const bp = parseFloat(v.buyPrice);
                if (isNaN(sp) || sp < 0) this.prodErr.baseSellPrice = 'Giá bán phải là số không âm.';
                else if (!isNaN(bp) && bp > 0 && sp < bp) this.prodErr.baseSellPrice = 'Giá bán nên lớn hơn giá mua.';
                else this.prodErr.baseSellPrice = '';
            }
            if (field === 'decayRate') {
                const dr = parseFloat(v.decayRate);
                if (isNaN(dr) || dr < 0 || dr > 100) this.prodErr.decayRate = 'Tốc độ suy giảm phải từ 0 đến 100%/ngày.';
                else this.prodErr.decayRate = '';
            }
        },
        resetProdErrors() {
            this.prodErr = { id: '', name: '', stock: '', importDate: '', expiryDate: '', area: '', quality: '', temperature: '', buyPrice: '', baseSellPrice: '', decayRate: '' };
        },

        // ── Export validators ──
        validateExField(field) {
            const v = this.newEx;
            if (field === 'orderId') {
                if (!v.orderId.trim()) this.exErr.orderId = 'Mã đơn hàng không được để trống.';
                else this.exErr.orderId = '';
            }
            if (field === 'staff') {
                if (!v.staff.trim()) this.exErr.staff = 'Vui lòng nhập tên người phụ trách.';
                else if (v.staff.trim().length < 2) this.exErr.staff = 'Tên phải có ít nhất 2 ký tự.';
                else this.exErr.staff = '';
            }
            if (field === 'exportDate') {
                if (!v.exportDate) this.exErr.exportDate = 'Vui lòng chọn ngày xuất kho.';
                else this.exErr.exportDate = '';
            }
            if (field === 'customerName') {
                if (!v.customerName.trim()) this.exErr.customerName = 'Vui lòng nhập tên khách hàng.';
                else if (v.customerName.trim().length < 2) this.exErr.customerName = 'Tên phải có ít nhất 2 ký tự.';
                else this.exErr.customerName = '';
            }
            if (field === 'qty') {
                const q = parseInt(v.qty);
                if (!v.qty && v.qty !== 0) this.exErr.qty = 'Số lượng không được để trống.';
                else if (isNaN(q) || q <= 0) this.exErr.qty = 'Số lượng phải lớn hơn 0.';
                else this.exErr.qty = '';
            }
        },
        resetExErrors() { this.exErr = { orderId: '', staff: '', exportDate: '', customerName: '', qty: '' }; },

        // ── Employee validators ──
        validateEmpField(field) {
            const v = this.newEmp;
            if (field === 'name') {
                if (!v.name.trim()) this.empErr.name = 'Họ và tên không được để trống.';
                else if (v.name.trim().length < 2) this.empErr.name = 'Họ tên phải có ít nhất 2 ký tự.';
                else if (/\d/.test(v.name)) this.empErr.name = 'Họ tên không được chứa số.';
                else this.empErr.name = '';
            }
            if (field === 'workTime') {
                if (v.workTime && !this._isValidTimeRange(v.workTime)) this.empErr.workTime = 'Định dạng không hợp lệ. Ví dụ: 08:00 - 17:00';
                else this.empErr.workTime = '';
            }
        },
        resetEmpErrors() { this.empErr = { name: '', workTime: '' }; },

        // ── Shipping validators (mở rộng) ──
        validateShipField(field) {
            const v = this.newShip;
            if (field === 'trackId') {
                if (!v.trackId.trim()) this.shipErr.trackId = 'Mã vận đơn không được để trống.';
                else if (this.shippingList.some(s => s.trackId.toLowerCase() === v.trackId.trim().toLowerCase()))
                    this.shipErr.trackId = 'Mã vận đơn này đã tồn tại trong hệ thống.';
                else this.shipErr.trackId = '';
            }
            if (field === 'orderId') {
                if (!v.orderId.trim()) this.shipErr.orderId = 'Mã đơn hàng không được để trống.';
                else this.shipErr.orderId = '';
            }
            if (field === 'exportStaff') {
                if (!v.exportStaff.trim()) this.shipErr.exportStaff = 'Vui lòng nhập tên người phụ trách xuất kho.';
                else this.shipErr.exportStaff = '';
            }
            if (field === 'shipStaff') {
                if (!v.shipStaff.trim()) this.shipErr.shipStaff = 'Vui lòng nhập tên người phụ trách vận chuyển.';
                else this.shipErr.shipStaff = '';
            }
            if (field === 'driverName') {
                if (!v.driverName.trim()) this.shipErr.driverName = 'Vui lòng nhập tên tài xế.';
                else this.shipErr.driverName = '';
            }
            if (field === 'destination') {
                if (!v.destination.trim()) this.shipErr.destination = 'Vui lòng nhập địa chỉ đích.';
                else if (v.destination.trim().length < 5) this.shipErr.destination = 'Địa chỉ quá ngắn.';
                else this.shipErr.destination = '';
            }
        },
        resetShipErrors() { this.shipErr = { trackId: '', orderId: '', exportStaff: '', shipStaff: '', driverName: '', destination: '' }; },

        // ── Full-form validation before submit ──
        _validateAllOrder() {
            ['customer', 'phone', 'address', 'sku', 'qty'].forEach(f => this.validateOrderField(f));
            return !Object.values(this.orderErr).some(e => e);
        },
        _validateAllProd() {
            ['id', 'name', 'stock', 'importDate', 'expiryDate', 'area', 'quality', 'temperature', 'buyPrice', 'baseSellPrice', 'decayRate'].forEach(f => this.validateProdField(f));
            return !Object.values(this.prodErr).some(e => e);
        },
        _validateAllEx() {
            ['orderId', 'staff', 'exportDate', 'customerName', 'qty'].forEach(f => this.validateExField(f));
            return !Object.values(this.exErr).some(e => e);
        },
        _validateAllEmp() {
            ['name', 'workTime'].forEach(f => this.validateEmpField(f));
            return !Object.values(this.empErr).some(e => e);
        },
        _validateAllShip() {
            ['trackId', 'orderId', 'exportStaff', 'shipStaff', 'driverName', 'destination'].forEach(f => this.validateShipField(f));
            return !Object.values(this.shipErr).some(e => e);
        },
    };
}
