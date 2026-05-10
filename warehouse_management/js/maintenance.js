// ==========================================
// MAINTENANCE — Backup, Restore & Snapshot System
// ==========================================
function getMaintenanceMethods() {
    return {
        // 1. BACKUP & RESTORE (File Based)
        downloadBackup() {
            try {
                const data = {
                    version: '1.4',
                    timestamp: new Date().toISOString(),
                    db: loadDB(),
                    iot: loadIotData(),
                    snapshots: loadSnapshots(),
                    categories: loadCategories(),
                    positions: loadPositions()
                };

                const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `ProWarehouse_Backup_${new Date().toISOString().slice(0, 10)}.trito`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);

                this.toast('Đã tải xuống bản sao lưu toàn bộ dữ liệu (.trito)', 'success');
            } catch (error) {
                this.toast('Lỗi khi tạo bản sao lưu: ' + error.message, 'error');
            }
        },

        triggerRestore() {
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = '.json,.trito';
            input.onchange = (e) => {
                const file = e.target.files[0];
                if (!file) return;
                
                const reader = new FileReader();
                reader.onload = (event) => {
                    try {
                        const data = JSON.parse(event.target.result);
                        if (!data.db || !data.version) throw new Error('Định dạng tệp không hợp lệ.');
                        
                        // Restore process
                        saveDB(data.db);
                        if (data.iot) saveIotData(data.iot);
                        if (data.snapshots) saveSnapshots(data.snapshots);
                        if (data.categories) saveCategories(data.categories);
                        if (data.positions) savePositions(data.positions);

                        this.toast('Khôi phục dữ liệu thành công! Trang sẽ tải lại sau 2 giây.', 'success');
                        setTimeout(() => window.location.reload(), 2000);
                    } catch (err) {
                        this.toast('Lỗi khi khôi phục: ' + err.message, 'error');
                    }
                };
                reader.readAsText(file);
            };
            input.click();
        },

        // 2. SNAPSHOT SYSTEM (Internal)
        createManualSnapshot() {
            const name = prompt('Nhập tên snapshot:', 'Snapshot ' + new Date().toLocaleString());
            if (!name) return;

            const snap = {
                id: 'snap-' + Date.now(),
                label: 'Manual: ' + name,
                time: new Date().toISOString(),
                simTickCount: this.simTickCount || 0,
                data: JSON.parse(JSON.stringify({
                    inventoryList: this.inventoryList,
                    shippingList: this.shippingList,
                    orders: this.orders,
                    alerts: this.alerts,
                    simState: this.simState
                }))
            };

            this.snapshots.unshift(snap);
            if (this.snapshots.length > 20) this.snapshots.pop();
            saveSnapshots(this.snapshots);
            this.toast('Đã chụp trạng thái hệ thống thành công!', 'success');
        },

        rollbackToSnapshot(snap) {
            if (!confirm(`Bạn có chắc muốn rollback về trạng thái "${snap.label}"? Dữ liệu hiện tại sẽ bị thay thế.`)) return;

            const d = snap.data;
            this.inventoryList = JSON.parse(JSON.stringify(d.inventoryList));
            this.shippingList = JSON.parse(JSON.stringify(d.shippingList));
            this.orders = JSON.parse(JSON.stringify(d.orders));
            this.alerts = JSON.parse(JSON.stringify(d.alerts));
            this.simState = JSON.parse(JSON.stringify(d.simState));
            this.simTickCount = snap.simTickCount || 0;
            
            this.persist();
            this.toast('Đã rollback về snapshot: ' + snap.label, 'warning');
            setTimeout(() => window.location.reload(), 1000);
        },

        deleteSnapshot(id) {
            this.snapshots = this.snapshots.filter(s => s.id !== id);
            saveSnapshots(this.snapshots);
            this.toast('Đã xóa snapshot.', 'info');
        }
    };
}
