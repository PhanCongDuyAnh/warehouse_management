// ══════════════════════════════════════
// KhoBot — Rule-based AI engine nội bộ
// Đọc trực tiếp dữ liệu Alpine state
// ══════════════════════════════════════
function getChatbotMethods() {
    return {
        handleSuggestion(q) { this.userInput = q; this.sendMessage(); },

        sendMessage() {
            const q = this.userInput.trim();
            if (!q || this.isTyping) return;
            this.chatMessages.push({ sender: 'user', text: q });
            this.userInput = '';
            this.showSuggestions = false;
            this.isTyping = true;
            this.scrollToBottom();
            const delay = 400 + Math.random() * 500;
            setTimeout(() => {
                const reply = this.khoAI(q);
                this.isTyping = false;
                this.chatMessages.push({ sender: 'ai', text: reply });
                this.scrollToBottom();
            }, delay);
        },

        khoAI(q) {
            const t = q.toLowerCase().trim();
            const has = (...kws) => kws.some(k => t.includes(k));

            // ── Chào hỏi ──
            if (has('xin chào', 'hello', 'hi', 'chào', 'hey'))
                return '👋 Chào bạn! Tôi là KhoBot, trợ lý AI nội bộ. Hỏi gì về kho cũng được nhé!';

            if (has('bạn là ai', 'mày là ai', 'ai vậy', 'giới thiệu'))
                return '🤖 Tôi là <b>KhoBot</b> — AI nội bộ của hệ thống Kho Thông Minh Pro 4.0.<br>Tôi chạy hoàn toàn trong trình duyệt, <b>không cần kết nối internet hay bên thứ 3</b>.<br>Tôi đọc trực tiếp dữ liệu kho của bạn để trả lời!';

            if (has('cảm ơn', 'thanks', 'thank'))
                return '😊 Không có gì! Tôi luôn sẵn sàng hỗ trợ bạn quản lý kho.';

            if (has('hướng dẫn', 'giúp tôi', 'trợ giúp', 'help', 'dùng như thế nào'))
                return '📖 <b>Tôi có thể trả lời về:</b><br>• "Tổng quan kho" — xem toàn cảnh<br>• "Hàng nào sắp hết?" — cảnh báo tồn<br>• "Tìm [tên sản phẩm]" — tra cứu SKU<br>• "Đơn hàng" — tình trạng đơn<br>• "Nhân sự" — nhân viên đang làm<br>• "Cảnh báo" — danh sách cảnh báo<br>• "Vận chuyển" — vận đơn hiện tại<br>• "Nhập kho" / "Xuất kho" — lịch sử';

            // ── Tổng quan ──
            if (has('tổng quan', 'tổng hợp', 'hôm nay', 'overview', 'báo cáo nhanh', 'tình trạng')) {
                const inv = this.inventoryList.length;
                const low = this.inventoryList.filter(p => p.status === 'Sắp hết hàng').length;
                const empty = this.inventoryList.filter(p => p.status === 'Hết hàng').length;
                const ordWait = this.orders.filter(o => o.status === 'Chờ xử lý').length;
                const ordShip = this.orders.filter(o => o.status === 'Đang giao').length;
                const ordDone = this.orders.filter(o => o.status === 'Đã nhận').length;
                const empOn = this.employeeList.filter(e => e.status === 'Đang làm').length;
                const alrt = this.alerts.length;
                let out = `📊 <b>TỔNG QUAN KHO</b><br><br>`;
                out += `📦 <b>Tồn kho:</b> ${inv} mã hàng`;
                if (low > 0) out += ` · <span style="color:#f59e0b">⚠️ ${low} sắp hết</span>`;
                if (empty > 0) out += ` · <span style="color:#ef4444">🔴 ${empty} hết hàng</span>`;
                out += `<br>🛒 <b>Đơn hàng:</b> ${ordWait} chờ · ${ordShip} đang giao · ${ordDone} hoàn thành<br>`;
                out += `👥 <b>Nhân sự:</b> ${empOn}/${this.employeeList.length} đang làm việc<br>`;
                out += `🚨 <b>Cảnh báo:</b> ${alrt} cảnh báo cần xử lý`;
                if (alrt === 0) out += ' ✅';
                return out;
            }

            // ── Tồn kho / sắp hết ──
            if (has('sắp hết', 'hết hàng', 'tồn kho thấp', 'cạn hàng', 'low stock')) {
                const low = this.inventoryList.filter(p => p.stock <= 50 || p.status === 'Sắp hết hàng' || p.status === 'Hết hàng');
                if (low.length === 0) return '✅ Tuyệt vời! Hiện không có sản phẩm nào sắp hết hàng.';
                let out = `🚨 <b>${low.length} mặt hàng cần chú ý:</b><br><br>`;
                low.slice(0, 8).forEach(p => {
                    const badge = p.stock === 0 ? '🔴 HẾT' : p.stock <= 20 ? '🟠 RẤT ÍT' : '🟡 SẮP HẾT';
                    out += `${badge} <b>${p.name}</b> (${p.id}) — còn <b>${p.stock}</b> đơn vị · ${p.pos || '?'}<br>`;
                });
                if (low.length > 8) out += `<br>…và ${low.length - 8} mặt hàng khác.`;
                out += `<br><br>💡 Gợi ý: Đặt hàng bổ sung ngay cho các mặt hàng có tồn kho = 0!`;
                return out;
            }

            // ── Tìm kiếm sản phẩm ──
            if (has('tìm', 'tra cứu', 'search', 'kiểm tra', 'hàng', 'sản phẩm', 'sku')) {
                const keywords = ['tìm', 'tra cứu', 'search', 'kiểm tra', 'hàng', 'sản phẩm', 'sku', 'xem', 'cho tôi biết'];
                let searchTerm = t;
                keywords.forEach(k => { searchTerm = searchTerm.replace(k, '').trim(); });
                if (searchTerm.length < 2) {
                    const total = this.inventoryList.length;
                    const ok = this.inventoryList.filter(p => p.status === 'Còn hàng').length;
                    return `📦 <b>Danh sách tồn kho:</b> ${total} mã hàng<br>✅ Còn hàng: ${ok}<br>⚠️ Sắp hết: ${this.inventoryList.filter(p => p.status === 'Sắp hết hàng').length}<br>🔴 Hết hàng: ${this.inventoryList.filter(p => p.status === 'Hết hàng').length}<br><br>💡 Nhập thêm từ khóa để tìm sản phẩm cụ thể, ví dụ: "tìm xúc xích"`;
                }
                const found = this.inventoryList.filter(p =>
                    p.name.toLowerCase().includes(searchTerm) ||
                    p.id.toLowerCase().includes(searchTerm) ||
                    (p.category || '').toLowerCase().includes(searchTerm)
                );
                if (found.length === 0) return `🔍 Không tìm thấy sản phẩm nào khớp với "<b>${searchTerm}</b>".<br>Thử từ khóa khác hoặc kiểm tra lại tên/SKU.`;
                let out = `🔍 Tìm thấy <b>${found.length}</b> kết quả cho "<b>${searchTerm}</b>":<br><br>`;
                found.slice(0, 6).forEach(p => {
                    const icon = p.stock === 0 ? '🔴' : p.stock <= 50 ? '🟡' : '🟢';
                    out += `${icon} <b>${p.name}</b><br>&nbsp;&nbsp;&nbsp;SKU: ${p.id} · Tồn: <b>${p.stock}</b> · Vị trí: ${p.pos || 'Chưa xếp'}<br>`;
                    if (p.expiryDate) out += `&nbsp;&nbsp;&nbsp;HSD: ${p.expiryDate}<br>`;
                });
                if (found.length > 6) out += `<br>…và ${found.length - 6} kết quả khác.`;
                return out;
            }

            // ── Đơn hàng ──
            if (has('đơn hàng', 'order', 'đơn', 'bao nhiêu đơn')) {
                const all = this.orders;
                const wait = all.filter(o => o.status === 'Chờ xử lý');
                const pack = all.filter(o => o.status === 'Đang đóng gói');
                const ship = all.filter(o => o.status === 'Đang giao');
                const done = all.filter(o => o.status === 'Đã nhận');
                let out = `🛒 <b>TÌNH TRẠNG ĐƠN HÀNG</b><br><br>`;
                out += `📋 Tổng cộng: <b>${all.length}</b> đơn<br>`;
                out += `⏳ Chờ xử lý: <b>${wait.length}</b><br>`;
                out += `📦 Đang đóng gói: <b>${pack.length}</b><br>`;
                out += `🚚 Đang giao: <b>${ship.length}</b><br>`;
                out += `✅ Đã nhận: <b>${done.length}</b>`;
                if (wait.length > 0) {
                    out += `<br><br>⚡ <b>Cần xử lý ngay:</b><br>`;
                    wait.slice(0, 3).forEach(o => {
                        const badge = o.priority === 'Hỏa tốc' ? ' 🔴' : o.priority === 'Ưu tiên cao' ? ' 🟠' : '';
                        out += `• ${o.id} — ${o.customer}${badge}<br>`;
                    });
                }
                return out;
            }

            // ── Nhân sự ──
            if (has('nhân viên', 'nhân sự', 'staff', 'employee', 'đang làm', 'người làm')) {
                const all = this.employeeList;
                const on = all.filter(e => e.status === 'Đang làm');
                const off = all.filter(e => e.status !== 'Đang làm');
                let out = `👥 <b>NHÂN SỰ KHO</b><br><br>`;
                out += `✅ Đang làm: <b>${on.length}</b> người<br>`;
                out += `💤 Vắng/Nghỉ: <b>${off.length}</b> người<br><br>`;
                if (on.length > 0) {
                    out += `<b>Đang có mặt tại kho:</b><br>`;
                    on.slice(0, 5).forEach(e => { out += `• ${e.name} — <span style="color:#6366f1">${e.position}</span> · ${e.workTime || ''}<br>`; });
                    if (on.length > 5) out += `…và ${on.length - 5} người khác.`;
                } else {
                    out += '⚠️ Hiện không có nhân viên nào đang làm.';
                }
                return out;
            }

            // ── Cảnh báo ──
            if (has('cảnh báo', 'alert', 'khẩn cấp', 'nguy hiểm')) {
                const alrt = this.alerts;
                if (alrt.length === 0) return '✅ <b>Không có cảnh báo nào!</b> Kho đang hoạt động ổn định.';
                let out = `🚨 <b>${alrt.length} CẢNH BÁO ĐANG HOẠT ĐỘNG</b><br><br>`;
                const urgent = alrt.filter(a => a.level === 'Khẩn cấp' || a.level === 'Cao');
                if (urgent.length > 0) out += `🔴 <b>Khẩn cấp/Cao:</b> ${urgent.length}<br>`;
                alrt.slice(0, 6).forEach(a => {
                    const ic = a.level === 'Khẩn cấp' ? '🔴' : a.level === 'Cao' ? '🟠' : a.level === 'Trung bình' ? '🟡' : '🟢';
                    out += `${ic} <b>${a.name}</b> — ${a.type} · Còn: ${a.qty} đv<br>`;
                });
                if (alrt.length > 6) out += `<br>…và ${alrt.length - 6} cảnh báo khác.`;
                return out;
            }

            // ── Vận chuyển ──
            if (has('vận chuyển', 'vận đơn', 'ship', 'giao hàng', 'tracking', 'track')) {
                const ships = this.shippingList;
                if (ships.length === 0) return '📭 Chưa có vận đơn nào trong hệ thống.';
                const active = ships.filter(s => s.status !== 'Đã giao');
                let out = `🚚 <b>VẬN CHUYỂN</b><br><br>`;
                out += `Tổng vận đơn: <b>${ships.length}</b> · Đang vận chuyển: <b>${active.length}</b><br><br>`;
                ships.slice(0, 5).forEach(s => {
                    out += `📦 <b>${s.trackId}</b> (${s.orderId})<br>&nbsp;&nbsp;&nbsp;${s.type} · ${s.status} · ${s.location || ''}<br>`;
                });
                if (ships.length > 5) out += `<br>…và ${ships.length - 5} vận đơn khác.`;
                return out;
            }

            // ── Nhập kho ──
            if (has('nhập kho', 'phiếu nhập', 'inbound', 'lịch sử nhập')) {
                const list = this.inboundList;
                if (list.length === 0) return '📭 Chưa có phiếu nhập kho nào.';
                let out = `📥 <b>LỊCH SỬ NHẬP KHO</b> (${list.length} phiếu)<br><br>`;
                list.slice(0, 5).forEach(item => {
                    out += `• <b>${item.id}</b> — ${item.name} · SL: <b>${item.qty}</b> · ${item.date || ''}<br>`;
                });
                if (list.length > 5) out += `<br>…và ${list.length - 5} phiếu khác.`;
                return out;
            }

            // ── Xuất kho ──
            if (has('xuất kho', 'phiếu xuất', 'outbound', 'lịch sử xuất')) {
                const list = this.outboundList;
                if (list.length === 0) return '📭 Chưa có phiếu xuất kho nào.';
                let out = `📤 <b>LỊCH SỬ XUẤT KHO</b> (${list.length} phiếu)<br><br>`;
                list.slice(0, 5).forEach(item => {
                    out += `• <b>${item.id}</b> — Đơn: ${item.orderId} · ${item.type || ''} · ${item.date || ''}<br>`;
                });
                if (list.length > 5) out += `<br>…và ${list.length - 5} phiếu khác.`;
                return out;
            }

            // ── Thống kê nhanh ──
            if (has('thống kê', 'báo cáo', 'kpi', 'doanh thu', 'lợi nhuận', 'số liệu')) {
                return `📊 <b>XEM THỐNG KÊ CHI TIẾT</b><br><br>Bạn có thể vào tab <b>"Thống Kê"</b> để xem:<br>• Biểu đồ doanh thu & lợi nhuận<br>• Dự báo tồn kho với vùng tin cậy<br>• 3 kịch bản dự báo (lạc quan/cơ sở/bi quan)<br>• KPI theo Ngày/Tuần/Tháng/Quý/Năm<br><br>💡 Hoặc hỏi tôi các thông tin cụ thể!`;
            }

            // ── Hết hạn sử dụng ──
            if (has('hạn sử dụng', 'hết hạn', 'expiry', 'hsd')) {
                const today = new Date();
                const soon = this.inventoryList.filter(p => {
                    if (!p.expiryDate) return false;
                    const d = new Date(p.expiryDate);
                    const diff = (d - today) / (1000 * 60 * 60 * 24);
                    return diff <= 30 && diff >= 0;
                });
                const expired = this.inventoryList.filter(p => {
                    if (!p.expiryDate) return false;
                    return new Date(p.expiryDate) < today;
                });
                let out = `📅 <b>HẠN SỬ DỤNG</b><br><br>`;
                if (expired.length > 0) {
                    out += `🔴 <b>Đã hết hạn (${expired.length}):</b><br>`;
                    expired.slice(0, 4).forEach(p => { out += `• ${p.name} — HSD: ${p.expiryDate}<br>`; });
                }
                if (soon.length > 0) {
                    out += `<br>🟡 <b>Sắp hết hạn trong 30 ngày (${soon.length}):</b><br>`;
                    soon.slice(0, 4).forEach(p => { out += `• ${p.name} — HSD: ${p.expiryDate}<br>`; });
                }
                if (expired.length === 0 && soon.length === 0) out += '✅ Không có sản phẩm nào sắp hoặc đã hết hạn trong vòng 30 ngày.';
                return out;
            }

            // ── Số lượng / đếm ──
            if (has('bao nhiêu', 'có mấy', 'tổng số', 'count', 'số lượng')) {
                if (has('sản phẩm', 'hàng', 'mã', 'sku')) return `📦 Hiện kho có <b>${this.inventoryList.length}</b> mã hàng đang được quản lý.`;
                if (has('đơn')) return `🛒 Tổng cộng <b>${this.orders.length}</b> đơn hàng trong hệ thống.`;
                if (has('nhân viên', 'người')) return `👥 Tổng cộng <b>${this.employeeList.length}</b> nhân viên · ${this.employeeList.filter(e => e.status === 'Đang làm').length} đang làm.`;
                if (has('cảnh báo')) return `🚨 Hiện có <b>${this.alerts.length}</b> cảnh báo trong hệ thống.`;
                return `📊 <b>Số liệu tổng hợp:</b><br>• Mã hàng: ${this.inventoryList.length}<br>• Đơn hàng: ${this.orders.length}<br>• Nhân viên: ${this.employeeList.length}<br>• Cảnh báo: ${this.alerts.length}<br>• Vận đơn: ${this.shippingList.length}`;
            }

            // ── Câu hỏi không nhận diện được ──
            return `🤔 Tôi chưa hiểu câu hỏi "<b>${q.length > 50 ? q.substring(0, 50) + '...' : q}</b>".<br><br>Thử hỏi theo gợi ý bên dưới, hoặc dùng từ khóa như:<br><i>tồn kho · đơn hàng · nhân sự · cảnh báo · tìm [tên hàng] · vận chuyển · hạn sử dụng</i>`;
        },

        scrollToBottom() {
            this.$nextTick(() => {
                const el = this.$refs.chatHistory;
                if (el) el.scrollTop = el.scrollHeight;
            });
        },
    };
}
