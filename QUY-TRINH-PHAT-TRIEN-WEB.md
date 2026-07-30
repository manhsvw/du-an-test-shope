
# Quy trình phát triển web (dùng lại cho các dự án sau)

Tài liệu này đúc kết từ quá trình làm dự án Shoppe clone — dùng làm khung tham khảo khi bắt đầu dự án web mới, không chỉ riêng dự án này.

## 1. Làm rõ yêu cầu trước khi code

- Xác định rõ **phạm vi**: cái gì cần làm, cái gì KHÔNG làm (tránh việc thừa, tránh thiếu).
- Nếu có nhiều hướng công nghệ/kiến trúc khả thi và ảnh hưởng lớn đến cả dự án → **hỏi trước khi làm**, đừng tự chọn rồi phát hiện sai hướng giữa chừng.
- Với dự án nhỏ / chạy local để test: ưu tiên công nghệ **nhẹ, ít phụ thuộc ngoài** (ví dụ dùng module có sẵn trong Node thay vì cài thêm driver cần biên dịch — tránh rủi ro cài đặt lỗi trên Windows).

## 2. Cấu trúc frontend

- HTML: đặt tên class theo một quy ước nhất quán (BEM: `block__element--modifier`), giữ nguyên trong suốt dự án.
- CSS: tách theo lớp rõ ràng và load đúng thứ tự cascade, ví dụ:
  1. biến `:root` + reset
  2. hệ lưới (grid)
  3. style từng component
  4. responsive/media query (load sau cùng để override đúng)
- JS thuần (không build tool) cho dự án nhỏ: chia theo từng chức năng độc lập (mỗi tính năng 1 hàm/IIFE riêng), không dồn hết vào 1 khối.
- Lưu ý về encoding: nếu file được sửa bằng nhiều công cụ/session khác nhau, có thể lẫn kiểu Unicode khác nhau cho cùng 1 ký tự tiếng Việt → công cụ sửa theo chuỗi chính xác có thể "tìm không thấy" dù mắt nhìn thấy đúng chữ. Cách né: neo theo phần ASCII xung quanh, hoặc sửa theo số dòng bằng script nếu cần độ chính xác cao.

## 3. Backend (khi dự án cần dữ liệu thật)

- Ưu tiên bộ công nghệ ít phụ thuộc, dễ chạy local, không cần cài phần mềm ngoài:
  - Node.js + Express + SQLite (dùng module có sẵn `node:sqlite`, không cần driver ngoài)
- Mật khẩu: luôn **hash**, không bao giờ lưu plaintext (dùng `crypto.scrypt` có sẵn nếu muốn tránh thêm thư viện).
- Đăng nhập dùng session/cookie; tách route theo nhóm chức năng (`auth`, dữ liệu nghiệp vụ...).
- Tổ chức thư mục `server/` tách biệt: kết nối DB, xác thực, route — mỗi phần 1 file, dễ bảo trì.
- File dữ liệu (`.db`) và `node_modules/` luôn cho vào `.gitignore`.

## 4. Kiểm thử trước khi báo "xong"

- Luôn chạy thử trên trình duyệt thật, không chỉ tin code "nhìn có vẻ đúng".
- Test **luồng chính** (golden path) và **trường hợp lỗi** (email trùng, sai mật khẩu, giỏ hàng rỗng, dữ liệu thiếu...).
- Với tính năng cần lưu trữ: test qua chu trình đăng xuất → đăng nhập lại để xác nhận dữ liệu thực sự được lưu bền vững, không chỉ tồn tại tạm trong bộ nhớ.
- Nếu cần dùng từ nhiều thiết bị (LAN, mobile...): test thật trên thiết bị đó trước khi coi là hoàn thành.

## 5. Quản lý code / Git

- Commit theo từng cụm việc hoàn chỉnh, message mô tả **tại sao** thay đổi, không chỉ liệt kê đã sửa gì.
- Không push khi chưa chắc chắn — đặc biệt nếu có tên miền/production đang chạy dựa trên nhánh đó.
- Trước khi push: kiểm tra xem đích đến (GitHub Pages, hosting...) có **hỗ trợ được** loại code sắp đẩy lên hay không (xem mục 7).

## 6. Tài liệu hoá dự án

- Luôn có 1 file mô tả kiến trúc tổng quan (`CLAUDE.md` hoặc `README.md`): mục đích dự án, cách chạy, cấu trúc thư mục, quy ước đặt tên.
- Ghi chú riêng các "gotcha" đặc thù (vd encoding, quirk của thư viện...) ngay khi phát hiện ra, để không phải dò lại từ đầu ở lần sau.
- Cập nhật tài liệu này ngay khi kiến trúc thay đổi (thêm backend, đổi công nghệ...) — tài liệu cũ sai còn nguy hiểm hơn không có tài liệu.

## 7. Triển khai (deploy) — phân biệt 2 loại hosting

| Loại web | Ví dụ dịch vụ | Lưu ý |
|---|---|---|
| Web tĩnh (chỉ HTML/CSS/JS chạy trên trình duyệt) | GitHub Pages, Netlify, Vercel (static) | Miễn phí, dễ gắn tên miền riêng |
| Web có backend (Node.js/database/API) | Render, Railway, Fly.io, VPS riêng... | GitHub Pages **không chạy được** dù có tên miền riêng — cần dịch vụ chạy được server thật |

Luôn xác định trước dự án thuộc loại nào để không mất thời gian setup sai chỗ.

---

# Roadmap mở rộng dự án Shoppe (dự kiến sau này)

Trạng thái hiện tại: frontend tĩnh (10 sản phẩm mẫu hardcode trong HTML) + backend đăng ký/đăng nhập/giỏ hàng lưu SQLite, chạy local.

## Ưu tiên gần (giá trị cao, công sức vừa phải)
- [ ] Đưa sản phẩm vào database thay vì hardcode trong HTML (bảng `products`, API `GET /api/products`)
- [ ] Trang/khu vực quản trị đơn giản để thêm/sửa/xóa sản phẩm
- [ ] Cho phép chỉnh số lượng (qty) sản phẩm trong giỏ hàng thay vì chỉ thêm/xóa
- [ ] Trang chi tiết sản phẩm riêng (hiện tại link sản phẩm chưa dẫn đi đâu)

## Trung hạn
- [ ] Đặt hàng thật (tạo đơn từ giỏ hàng, lưu bảng `orders`)
- [ ] Trang "Đơn mua" hiển thị lịch sử đơn hàng (menu này đã có sẵn trong navbar nhưng chưa có chức năng)
- [ ] Quản lý địa chỉ giao hàng (mục "Địa chỉ của tôi" đã có sẵn trong navbar)
- [ ] Tìm kiếm sản phẩm thật (hiện ô tìm kiếm chỉ là UI, chưa nối dữ liệu)
- [ ] Danh mục sản phẩm lọc thật theo dữ liệu (hiện chỉ đổi trạng thái active, chưa lọc)

## Dài hạn / khi cần triển khai thật (không chỉ test local)
- [ ] Đổi session secret sang biến môi trường, không hardcode trong code
- [ ] Cân nhắc chuyển session in-memory sang lưu bền (vd SQLite session store) để không mất phiên đăng nhập khi restart server
- [ ] HTTPS khi deploy thật
- [ ] Xác thực email khi đăng ký (hiện chỉ cần email + mật khẩu, không kiểm tra email có thật)
- [ ] Upload ảnh sản phẩm thật thay vì ảnh tĩnh trong `asset/img/`
- [ ] Đánh giá/review sản phẩm
- [ ] Chọn dịch vụ hosting hỗ trợ Node.js (Render/Railway/Fly.io...) nếu muốn công khai web có backend qua tên miền riêng
