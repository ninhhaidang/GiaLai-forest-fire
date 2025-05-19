# GiaLai-forest-fire
Ứng dụng Viễn thám, GIS và Học máy để Xây dựng Bản đồ Dự đoán Nguy cơ Cháy rừng tại tỉnh Gia Lai, Việt Nam

## Giới thiệu
Dự án này sử dụng dữ liệu viễn thám, hệ thống thông tin địa lý (GIS) và các kỹ thuật học máy để dự đoán nguy cơ cháy rừng tại tỉnh Gia Lai, Việt Nam. Phương pháp kết hợp các dữ liệu từ vệ tinh (Sentinel-2, MODIS), dữ liệu khí tượng, và mô hình số độ cao để xây dựng mô hình dự báo nguy cơ cháy có độ chính xác cao.

## Cấu trúc thư mục
```
GiaLai-forest-fire/
├── GiaLai-forest-fire.js    # Mã nguồn Google Earth Engine
├── feature_importance_analysis.py  # Script phân tích độ quan trọng đặc trưng
├── data/                    # Thư mục chứa dữ liệu đầu vào/đầu ra (cần tạo)
└── README.md                # Tài liệu hướng dẫn
```

## Các mô hình sử dụng
Dự án sử dụng và so sánh hai mô hình học máy:
- Random Forest
- Gradient Tree Boosting

## Đặc trưng đầu vào
Dự án sử dụng nhiều loại đặc trưng:
1. Chỉ số thực vật (NDVI, NDWI, LSWI, EVI, SAVI, NBR, NDMI)
2. Dữ liệu khí tượng (Nhiệt độ, Lượng mưa, Gió)
3. Dữ liệu địa hình (Độ cao, Độ dốc, Hướng dốc)
4. Các chỉ số trạng thái (VCI, TCI)

## Hướng dẫn sử dụng
### Google Earth Engine
1. Tạo tài khoản Google Earth Engine
2. Sao chép mã từ file `GiaLai-forest-fire.js` vào Code Editor
3. Chỉnh sửa tham số địa lý và thời gian theo nhu cầu
4. Chạy mã để tạo bản đồ dự báo nguy cơ cháy rừng

### Phân tích đặc trưng
1. Cài đặt các thư viện Python cần thiết
```bash
pip install numpy pandas matplotlib seaborn scikit-learn
```
2. Đặt dữ liệu xuất từ GEE vào thư mục `data/`
3. Chạy file phân tích:
```bash
python feature_importance_analysis.py
```

## Kết quả
Kết quả bao gồm:
- Bản đồ dự báo nguy cơ cháy rừng 5 cấp độ
- Phân tích mức độ quan trọng của các đặc trưng
- Các chỉ số đánh giá mô hình
- Các đồ thị và báo cáo phân tích

## Nguồn dữ liệu
- Landsat, Sentinel-2: Dữ liệu ảnh vệ tinh đa phổ
- MODIS: Dữ liệu nhiệt độ bề mặt và phát hiện điểm cháy
- SRTM: Mô hình số độ cao
- CHIRPS: Dữ liệu lượng mưa
- ERA5-Land: Dữ liệu khí tượng

## Tác giả
- Ninh Hải Đăng
- Lê Đức Lương
