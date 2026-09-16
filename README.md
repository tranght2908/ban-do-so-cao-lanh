# Bản đồ số Cao Lãnh – Prototype

Prototype **Công cụ số quản lý đô thị, nông sản và hạ tầng kỹ thuật trên nền bản đồ số** của phường Cao Lãnh, tỉnh Đồng Tháp.

## Phạm vi

Ba nhóm lớp dữ liệu chuyên đề được đưa lên nền bản đồ số dùng chung của tỉnh:

| Nhóm lớp | Đối tượng |
|---|---|
| Đô thị | Tuyến đường, tuyến hẻm, tuyến phố văn minh đô thị, điểm tập kết rác, bãi đỗ xe, biển quảng cáo, vị trí vi phạm trật tự đô thị |
| Nông sản | Vùng trồng; cơ sở sản xuất, sơ chế, chế biến; sản phẩm OCOP và sản phẩm đặc trưng; điểm giới thiệu và bán sản phẩm |
| Hạ tầng kỹ thuật | Chiếu sáng công cộng, tuyến thoát nước – cống, hố ga, cây xanh đô thị, trạm cấp nước, công trình công cộng |

Các chức năng chính theo vai trò:

| Vai trò | Màn hình |
|---|---|
| Lãnh đạo UBND phường | Bảng điều khiển thống kê, bản đồ, kết quả – xếp hạng, so sánh giữa các kỳ, báo cáo |
| Lãnh đạo bộ phận | Phê duyệt / trả lại dữ liệu, cấu hình bộ tiêu chí và kỳ đánh giá, duyệt phiếu chấm điểm |
| Công chức chuyên môn | Bản đồ tác nghiệp (bật/tắt lớp, nền đường phố – vệ tinh, đo khoảng cách – diện tích, tìm theo bán kính và khu vực); thêm/sửa/xóa đối tượng bằng cách bấm hoặc vẽ trên bản đồ; nhập liệu hàng loạt CSV/GeoJSON có kiểm tra từng dòng; chấm điểm trên máy tính và điện thoại thực địa; tài sản hạ tầng theo vòng đời, sự cố và phân tích không gian |
| Quản trị hệ thống | Tài khoản, ma trận phân quyền theo nhóm lớp × hành vi, nhật ký thao tác, kết nối nền bản đồ |
| Người dân | Lớp thông tin công khai: vùng trồng, cơ sở, sản phẩm OCOP, điểm bán, chỉ đường – không cần đăng nhập |

## Kỹ thuật

- HTML, CSS, JavaScript thuần; bản đồ dùng [Leaflet](https://leafletjs.com). Không cần build, không có máy chủ.
- Nền bản đồ trong bản trình diễn dùng OpenStreetMap và ảnh vệ tinh Esri để mô phỏng nền bản đồ số dùng chung của tỉnh.
- Toàn bộ đối tượng, tọa độ, số liệu là **dữ liệu mẫu minh họa** sinh cố định trong `data.js`.
- Thao tác trong lúc xem (thêm đối tượng, phê duyệt, chấm điểm, sự cố…) lưu ở `localStorage` của trình duyệt. Muốn quay về dữ liệu ban đầu: **Quản trị & phân quyền → Kết nối & danh mục → Đặt lại dữ liệu mẫu**.
- Chạy trên máy: mở `index.html` bằng trình duyệt (cần kết nối mạng để tải nền bản đồ).
