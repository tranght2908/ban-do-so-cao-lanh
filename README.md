# Bản đồ số Cao Lãnh – Prototype

Prototype **Công cụ số quản lý đô thị, nông sản và hạ tầng kỹ thuật trên nền bản đồ số** của phường Cao Lãnh, tỉnh Đồng Tháp.

**Xem trực tiếp:** https://tranght2908.github.io/ban-do-so-cao-lanh/

## Phạm vi

Ba nhóm lớp dữ liệu chuyên đề được đưa lên nền bản đồ số dùng chung của tỉnh:

| Nhóm lớp | Đối tượng |
|---|---|
| Đô thị | Tuyến đường, tuyến hẻm, tuyến phố văn minh đô thị, điểm tập kết rác, bãi đỗ xe, biển quảng cáo, vị trí vi phạm trật tự đô thị |
| Nông sản | Vùng trồng; cơ sở sản xuất, sơ chế, chế biến; sản phẩm OCOP và sản phẩm đặc trưng; điểm giới thiệu và bán sản phẩm |
| Hạ tầng kỹ thuật | Chiếu sáng công cộng, tuyến thoát nước – cống, hố ga, cây xanh đô thị, trạm cấp nước, công trình công cộng, camera giám sát tuyến đường |

Các chức năng chính theo vai trò:

| Vai trò | Màn hình |
|---|---|
| Lãnh đạo UBND phường | Bảng điều khiển thống kê, bản đồ, kết quả – xếp hạng, so sánh giữa các kỳ, báo cáo |
| Lãnh đạo bộ phận | Phê duyệt / trả lại dữ liệu, cấu hình bộ tiêu chí và kỳ đánh giá, duyệt phiếu chấm điểm |
| Công chức chuyên môn | Bản đồ tác nghiệp (bật/tắt lớp, nền đường phố – vệ tinh, đo khoảng cách – diện tích, tìm theo bán kính và khu vực, ghim tọa độ và nhập tọa độ thủ công, camera giám sát tuyến đường với vùng quan sát); thêm/sửa/xóa đối tượng bằng cách bấm, vẽ hoặc nhập danh sách tọa độ; nhập liệu hàng loạt CSV/GeoJSON có kiểm tra từng dòng; chấm điểm trên máy tính và điện thoại thực địa; tài sản hạ tầng theo vòng đời, sự cố và phân tích không gian |
| Quản trị hệ thống | Tài khoản, ma trận phân quyền theo nhóm lớp × hành vi, nhật ký thao tác, kết nối nền bản đồ |
| Người dân | Lớp thông tin công khai: vùng trồng, cơ sở, sản phẩm OCOP, điểm bán, chỉ đường – không cần đăng nhập |

## Tọa độ và camera trên bản đồ tác nghiệp

- **Ghim tọa độ kiểu bản đồ số:** bấm chuột phải lên bản đồ (hoặc nút 📌) để thả ghim; bảng thông tin hiện tọa độ WGS-84, độ–phút–giây, quy đổi VN-2000 (múi 3°, KTT 105°00′ – gần đúng để minh họa), kiểm tra ranh giới phường, 3 đối tượng gần nhất và các lệnh: thêm đối tượng tại đây, tìm quanh bán kính, sao chép tọa độ. Kéo ghim thì tọa độ cập nhật ngay.
- **Nút 🔢 Tọa độ:** dán tọa độ thập phân, độ–phút–giây hoặc liên kết bản đồ dạng `@10.4672,105.6303` để đi tới và ghim.
- **Nhập tọa độ thủ công khi thêm đối tượng:** chọn *Nhập tọa độ thủ công* thay cho vẽ trên bản đồ; đối tượng dạng điểm nhập vĩ độ/kinh độ (hoặc dán chuỗi tọa độ), đối tượng dạng đường/vùng nhập danh sách đỉnh, mỗi dòng một tọa độ; hệ thống kiểm tra từng đỉnh có thuộc ranh giới phường hay không.
- **Camera giám sát tuyến đường:** lớp dữ liệu riêng trong nhóm Hạ tầng kỹ thuật, có mã thiết bị, loại camera, độ phân giải, đường truyền, thời gian lưu trữ, tình trạng kết nối. Bản đồ vẽ **vùng quan sát hình quạt** theo hướng, góc mở và tầm quan sát (nét liền: trực tuyến, nét đứt đỏ: mất kết nối) để rà soát điểm mù. Chọn camera để xem khung luồng mô phỏng, chụp ảnh vào hồ sơ, hiệu chỉnh hướng – góc – tầm, hoặc mở **Tường camera** xem nhiều luồng cùng lúc. Luồng video là mô phỏng; khi triển khai sẽ nhúng RTSP/HLS từ hệ thống camera của phường.

## Kỹ thuật

- HTML, CSS, JavaScript thuần; bản đồ dùng [Leaflet](https://leafletjs.com). Không cần build, không có máy chủ.
- Nền bản đồ trong bản trình diễn dùng OpenStreetMap và ảnh vệ tinh Esri để mô phỏng nền bản đồ số dùng chung của tỉnh. Ranh giới phường và các tuyến đường trong `geo.js` lấy từ OpenStreetMap (ODbL), đã rút gọn đỉnh; các đối tượng khác gắn lên đó là dữ liệu mẫu.
- Toàn bộ đối tượng, tọa độ, số liệu là **dữ liệu mẫu minh họa** sinh cố định trong `data.js`.
- Thao tác trong lúc xem (thêm đối tượng, phê duyệt, chấm điểm, sự cố…) lưu ở `localStorage` của trình duyệt. Muốn quay về dữ liệu ban đầu: **Quản trị & phân quyền → Kết nối & danh mục → Đặt lại dữ liệu mẫu**.
- Chạy trên máy: mở `index.html` bằng trình duyệt (cần kết nối mạng để tải nền bản đồ).
