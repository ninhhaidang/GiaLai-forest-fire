# GiaLai-forest-fire

![Status](https://img.shields.io/badge/status-Đã%20hoàn%20thành-brightgreen)
![Google Earth Engine](https://img.shields.io/badge/Google%20Earth%20Engine-brightgreen?logo=google&logoColor=white)
![Python](https://img.shields.io/badge/Python-3.8%2B-blue?logo=python&logoColor=white)
![License](https://img.shields.io/badge/Giấy%20phép-MIT-green)

## Giới thiệu

Dự án **GiaLai-forest-fire** tập trung vào việc giải quyết thách thức dự báo nguy cơ cháy rừng tại tỉnh Gia Lai, một trong những khu vực có diện tích rừng lớn và đa dạng sinh học cao tại Việt Nam, thường xuyên đối mặt với nguy cơ cháy rừng, đặc biệt trong mùa khô. Bằng cách tận dụng sức mạnh của dữ liệu viễn thám đa nguồn, Hệ thống Thông tin Địa lý (GIS), và các thuật toán học máy tiên tiến, dự án này nhằm mục tiêu xây dựng một hệ thống cảnh báo sớm, cung cấp bản đồ dự báo nguy cơ cháy rừng chi tiết và đáng tin cậy.

Mục tiêu chính là phát triển một mô hình có khả năng phân loại nguy cơ cháy rừng thành 5 cấp độ, từ đó hỗ trợ công tác phòng chống, giảm thiểu thiệt hại về người và tài sản, và bảo vệ tài nguyên rừng quý giá.

## Đặc điểm nổi bật

- **Tích hợp đa nguồn dữ liệu**: Kết hợp thông minh dữ liệu ảnh vệ tinh (Sentinel-2, MODIS), các chỉ số thực vật, dữ liệu khí tượng (nhiệt độ, lượng mưa, gió), và thông tin địa hình (độ cao, độ dốc, hướng dốc).
- **Phương pháp luận tiên tiến**: Áp dụng quy trình tiền xử lý dữ liệu chuẩn hóa, bao gồm hiệu chỉnh khí quyển, che phủ mây, và đồng bộ hóa độ phân giải không gian.
- **Học máy đa mô hình**: So sánh và đánh giá hiệu suất của hai thuật toán học máy mạnh mẽ và phổ biến trong các bài toán phân loại: Random Forest và Gradient Tree Boosting.
- **Phân tích đặc trưng chuyên sâu**: Xác định và lượng hóa mức độ ảnh hưởng của từng yếu tố (đặc trưng) đến nguy cơ cháy rừng, cung cấp hiểu biết sâu sắc về các yếu tố rủi ro.
- **Kết quả trực quan và dễ hiểu**: Tạo ra bản đồ nguy cơ cháy rừng 5 cấp độ trực quan, dễ dàng giải thích và sử dụng cho các đối tượng khác nhau.
- **Mã nguồn mở và có khả năng tái sử dụng**: Cung cấp mã nguồn chi tiết trong Google Earth Engine (JavaScript) và Python, cho phép mở rộng và điều chỉnh cho các khu vực địa lý khác hoặc các bài toán tương tự.

## Cấu trúc dự án

```
GiaLai-forest-fire/
├── GiaLai-forest-fire.js       # Mã nguồn Google Earth Engine:
│                               # - Tiền xử lý ảnh vệ tinh (Sentinel-2, MODIS)
│                               # - Tính toán các chỉ số (NDVI, NDWI, LST, v.v.)
│                               # - Thu thập mẫu huấn luyện và kiểm thử
│                               # - Huấn luyện mô hình Random Forest & Gradient Boosting
│                               # - Tạo bản đồ nguy cơ cháy 5 cấp độ
│                               # - Xuất dữ liệu và kết quả
├── feature_importance_analysis.py  # Mã nguồn Python:
│                               # - Đọc dữ liệu huấn luyện đã xuất từ GEE
│                               # - Đánh giá chi tiết mô hình (Accuracy, Precision, Recall, F1, Kappa)
│                               # - Phân tích và trực quan hóa độ quan trọng của đặc trưng
│                               # - Tạo ma trận nhầm lẫn và các biểu đồ so sánh
│                               # - Xuất báo cáo tổng hợp
├── data/                       # Thư mục chứa dữ liệu (cần tạo thủ công)
│   ├── gee-exported/           # Chứa các tệp CSV xuất từ GEE:
│   │   └── GiaLai_Training_Data_For_Feature_Importance.csv (dữ liệu huấn luyện)
│   │   └── GiaLai_Feature_Names.csv (tên các đặc trưng)
│   │   └── GiaLai_Model_Evaluation_Metrics.csv (các chỉ số đánh giá từ GEE)
│   │   └── Các tệp ảnh GeoTIFF (nếu có, ví dụ: bản đồ nguy cơ)
│   └── results/                # Chứa kết quả từ script Python:
│       └── GiaLai_RF_Feature_Importance.csv
│       └── GiaLai_GTB_Feature_Importance.csv
│       └── GiaLai_RF_Feature_Importance.png
│       └── GiaLai_GTB_Feature_Importance.png
│       └── GiaLai_RF_Confusion_Matrix.png
│       └── GiaLai_GTB_Confusion_Matrix.png
│       └── GiaLai_Feature_Importance_Comparison.png
│       └── GiaLai_Model_Comparison_Report.txt (báo cáo tổng hợp)
├── .gitignore                  # Các tệp và thư mục được Git bỏ qua
└── README.md                   # Tài liệu hướng dẫn chi tiết này
```

## Đặc trưng đầu vào chi tiết

Dự án sử dụng 15 đặc trưng đầu vào được tính toán từ các nguồn dữ liệu viễn thám và GIS:

| Nhóm Đặc Trưng    | Tên Đặc Trưng | Ký hiệu | Nguồn Gốc / Sản Phẩm GEE                                 | Mô tả Ngắn gọn                                           |
|-------------------|----------------|---------|----------------------------------------------------------|----------------------------------------------------------|
| **Chỉ số thực vật** | NDVI           | NDVI    | Sentinel-2 (B8, B4)                                      | Chỉ số khác biệt thực vật chuẩn hóa                       |
|                   | NDWI           | NDWI    | Sentinel-2 (B3, B8)                                      | Chỉ số khác biệt nước chuẩn hóa (độ ẩm thực vật)         |
|                   | LSWI           | LSWI    | Sentinel-2 (B8, B11)                                     | Chỉ số nước bề mặt đất                                   |
|                   | EVI            | EVI     | Sentinel-2 (B2, B4, B8)                                  | Chỉ số thực vật tăng cường, giảm thiểu ảnh hưởng khí quyển |
|                   | SAVI           | SAVI    | Sentinel-2 (B4, B8)                                      | Chỉ số thực vật điều chỉnh theo đất                       |
|                   | NBR            | NBR     | Sentinel-2 (B8, B12)                                     | Chỉ số cháy chuẩn hóa, nhạy cảm với vùng cháy            |
|                   | NDMI           | NDMI    | Sentinel-2 (B11, B8)                                     | Chỉ số độ ẩm chuẩn hóa (độ ẩm tán lá)                     |
| **Dữ liệu nhiệt**  | Nhiệt độ (LST) | Temp    | MODIS/061/MOD11A2 (LST_Day_1km)                          | Nhiệt độ bề mặt đất ban ngày, chuyển đổi sang °C          |
| **Chỉ số điều kiện**| VCI            | VCI     | Tính từ NDVI (Sentinel-2)                                | Chỉ số điều kiện thực vật, phản ánh stress do hạn hán     |
|                   | TCI            | TCI     | Tính từ LST (MODIS)                                      | Chỉ số điều kiện nhiệt độ, phản ánh stress nhiệt          |
| **Địa hình**       | Độ cao         | DEM     | USGS/SRTMGL1_003                                         | Mô hình số độ cao                                        |
|                   | Độ dốc         | Slope   | Tính từ DEM (SRTM)                                       | Độ dốc bề mặt địa hình, ảnh hưởng tốc độ lan truyền lửa  |
|                   | Hướng dốc      | Aspect  | Tính từ DEM (SRTM)                                       | Hướng của bề mặt dốc, ảnh hưởng đến lượng bức xạ mặt trời |
| **Khí tượng**      | Lượng mưa      | Precip  | UCSB-CHG/CHIRPS/DAILY                                    | Lượng mưa tích lũy trung bình                             |
|                   | Tốc độ gió     | WindSp  | ECMWF/ERA5_LAND/DAILY_AGGR (u_component, v_component)    | Tốc độ gió bề mặt trung bình                              |
| **Nhãn**           | Nhãn Cháy      | FireLbl | MODIS/061/MOD14A1 (FireMask, giá trị > 6 được coi là cháy)| Dữ liệu điểm cháy lịch sử (ground truth)                 |

## Phương pháp luận và Mô hình học máy

### 1. Quy trình xử lý dữ liệu trong Google Earth Engine

Quy trình xử lý dữ liệu được thực hiện hoàn toàn trên nền tảng Google Earth Engine (GEE) để tận dụng khả năng tính toán song song và truy cập vào kho dữ liệu viễn thám khổng lồ:

1.  **Thu thập dữ liệu**:
    *   Ảnh Sentinel-2 SR (Surface Reflectance) được lọc theo vùng nghiên cứu (ROI - tỉnh Gia Lai) và khoảng thời gian (mùa khô, ví dụ từ tháng 12 đến tháng 4 năm sau).
    *   Dữ liệu MODIS LST (MOD11A2) và MODIS Active Fire (MOD14A1).
    *   Dữ liệu DEM từ SRTM.
    *   Dữ liệu mưa từ CHIRPS Daily.
    *   Dữ liệu gió từ ERA5 Land Daily Aggregations.

2.  **Tiền xử lý ảnh Sentinel-2**:
    *   Lọc ảnh có độ che phủ mây thấp (<10%).
    *   Áp dụng mặt nạ mây sử dụng kênh `MSK_CLDPRB` (xác suất mây < 30% được giữ lại).
    *   Tạo ảnh tổng hợp (composite) theo phương pháp `median()` để giảm thiểu ảnh hưởng của mây còn sót lại và các yếu tố nhiễu khác.
    *   Cắt (clip) ảnh theo ranh giới tỉnh Gia Lai.

3.  **Tính toán các đặc trưng**:
    *   Tính toán 7 chỉ số thực vật (NDVI, NDWI, LSWI, EVI, SAVI, NBR, NDMI) từ ảnh Sentinel-2 đã xử lý.
    *   Xử lý dữ liệu MODIS LST: chuyển đổi sang độ C, tính giá trị trung bình, chiếu lại (reproject) về độ phân giải 1km.
    *   Tính toán VCI và TCI dựa trên giá trị min/max lịch sử của NDVI và LST trong vùng nghiên cứu.
    *   Xử lý dữ liệu địa hình: tính toán độ dốc (slope) và hướng dốc (aspect) từ DEM.
    *   Xử lý dữ liệu khí tượng: tính lượng mưa trung bình và tốc độ gió trung bình.

4.  **Chuẩn bị dữ liệu nhãn (Ground Truth)**:
    *   Dữ liệu điểm cháy từ MODIS (MOD14A1) được xử lý: lấy giá trị `FireMask` tối đa trong khoảng thời gian, các điểm có `FireMask > 6` (độ tin cậy cao) được coi là điểm cháy (nhãn 1), còn lại là không cháy (nhãn 0).
    *   Chiếu lại ảnh nhãn về độ phân giải 500m.

5.  **Lấy mẫu huấn luyện và kiểm thử**:
    *   Kết hợp tất cả các lớp đặc trưng và lớp nhãn thành một ảnh đa kênh (multi-band image).
    *   Sử dụng phương pháp `stratifiedSample` để lấy mẫu phân tầng, đảm bảo sự cân bằng giữa các lớp cháy và không cháy (ví dụ: 1000 điểm mẫu). Độ phân giải lấy mẫu được chọn là 500m.
    *   Chia tập mẫu thành 70% cho huấn luyện (training) và 30% cho kiểm thử (testing) một cách ngẫu nhiên (`randomColumn`).

### 2. Huấn luyện và Đánh giá Mô hình

Dự án triển khai và so sánh hai mô hình học máy:

*   **Random Forest (RF)**:
    *   **Lý do chọn**: RF là một thuật toán học máy mạnh mẽ, hiệu quả với dữ liệu nhiều chiều, ít bị overfitting, và có khả năng xử lý tốt cả dữ liệu dạng số và dạng category. Nó cũng cung cấp cơ chế đánh giá độ quan trọng của đặc trưng một cách tự nhiên.
    *   **Cấu hình**: `numberOfTrees: 100`, `minLeafPopulation: 5`, `bagFraction: 0.7`, `seed: 42`.
    *   Được huấn luyện ở hai chế độ: `CLASSIFICATION` (để đánh giá ma trận lỗi) và `PROBABILITY` (để tạo bản đồ xác suất nguy cơ).

*   **Gradient Tree Boosting (GTB)**:
    *   **Lý do chọn**: GTB là một thuật toán boosting hiệu quả khác, thường cho độ chính xác cao bằng cách xây dựng tuần tự các cây quyết định yếu và cải thiện dần các lỗi của mô hình trước đó.
    *   **Cấu hình**: `numberOfTrees: 100`, `shrinkage: 0.05` (learning rate), `samplingRate: 0.7`, `maxNodes: 10` (giới hạn độ phức tạp của cây), `seed: 42`.
    *   Tương tự RF, được huấn luyện ở cả hai chế độ `CLASSIFICATION` và `PROBABILITY`.

### 3. Tạo bản đồ nguy cơ và xuất kết quả

1.  **Chuẩn bị dữ liệu dự đoán**: Các lớp đặc trưng được lấy mẫu lại (resample bằng `bilinear`) và chiếu lại (reproject) về độ phân giải mục tiêu (30m, tương ứng Sentinel-2) để đảm bảo tính nhất quán không gian.
2.  **Tạo bản đồ xác suất**: Áp dụng các mô hình đã huấn luyện (chế độ `PROBABILITY`) lên chồng ảnh đặc trưng để tạo ra bản đồ xác suất nguy cơ cháy cho từng mô hình (RF Probability, GTB Probability).
3.  **Phân loại thành 5 cấp độ nguy cơ**:
    Dựa trên bản đồ xác suất, một biểu thức điều kiện được áp dụng để phân loại nguy cơ thành 5 cấp độ:
    *   Cấp 1 (Rất thấp): Xác suất <= 0.2
    *   Cấp 2 (Thấp): 0.2 < Xác suất <= 0.4
    *   Cấp 3 (Trung bình): 0.4 < Xác suất <= 0.6
    *   Cấp 4 (Cao): 0.6 < Xác suất <= 0.8
    *   Cấp 5 (Rất cao/Nguy hiểm): Xác suất > 0.8
4.  **Xuất dữ liệu**:
    *   Các bản đồ nguy cơ 5 cấp (RF và GTB) được xuất sang Google Drive dưới dạng ảnh GeoTIFF.
    *   Dữ liệu huấn luyện (`trainingData` chứa các đặc trưng và nhãn của các điểm mẫu) được xuất dưới dạng CSV để phân tích độ quan trọng của đặc trưng trong Python.
    *   Tên các đặc trưng và các chỉ số đánh giá mô hình từ GEE cũng được xuất ra CSV.
    *   Các lớp dữ liệu trung gian (NDVI, LST, DEM, v.v.) cũng được xuất để kiểm tra và trực quan hóa.

## Hướng dẫn sử dụng

### Yêu cầu hệ thống

-   **Tài khoản Google Earth Engine**: Cần có tài khoản đã được phê duyệt để truy cập và chạy mã trên GEE.
-   **Python**: Phiên bản 3.8 trở lên.
-   **Thư viện Python**:
    ```bash
    pip install numpy pandas matplotlib seaborn scikit-learn
    ```

### 1. Thực thi trên Google Earth Engine

1.  **Truy cập GEE Code Editor**: Mở trình duyệt và truy cập [Google Earth Engine Code Editor](https://code.earthengine.google.com/).
2.  **Tạo Script mới**: Sao chép toàn bộ nội dung của tệp `GiaLai-forest-fire.js` và dán vào một script mới trong Code Editor.
3.  **Cấu hình (Tùy chọn)**:
    *   Kiểm tra và điều chỉnh biến `gia_lai` (FeatureCollection trỏ đến ranh giới tỉnh Gia Lai - cần đảm bảo asset này tồn tại trong tài khoản của bạn hoặc thay thế bằng asset công khai/của riêng bạn).
    *   Điều chỉnh `startDate` và `endDate` nếu muốn phân tích cho một khoảng thời gian khác.
4.  **Chạy Script**: Nhấn nút "Run". Quá trình xử lý sẽ diễn ra trên máy chủ của GEE.
5.  **Theo dõi kết quả**:
    *   Các lớp bản đồ (NDVI, bản đồ nguy cơ RF/GTB, v.v.) sẽ được thêm vào giao diện bản đồ của GEE (hầu hết ban đầu được ẩn, bạn có thể bật/tắt trong tab "Layers").
    *   Các giá trị (kích thước tập mẫu, ma trận lỗi, độ chính xác, Kappa) sẽ được in ra trong tab "Console".
    *   Các tác vụ xuất dữ liệu (ảnh GeoTIFF, bảng CSV) sẽ xuất hiện trong tab "Tasks". Bạn cần nhấn nút "Run" bên cạnh mỗi tác vụ để thực sự khởi chạy quá trình xuất về Google Drive của bạn (thường vào thư mục có tên `GEE_Export_GiaLai_Fire`).

### 2. Phân tích độ quan trọng của đặc trưng (Python)

1.  **Chuẩn bị dữ liệu**:
    *   Sau khi các tác vụ xuất từ GEE hoàn tất, tải các tệp CSV cần thiết từ Google Drive về máy tính của bạn.
    *   Đặt các tệp `GiaLai_Training_Data_For_Feature_Importance.csv` và `GiaLai_Feature_Names.csv` vào thư mục `data/gee-exported/` (hoặc cập nhật đường dẫn trong script Python).
2.  **Chạy Script Python**:
    Mở terminal hoặc command prompt, di chuyển đến thư mục gốc của dự án và chạy:
    ```bash
    python feature_importance_analysis.py
    ```
3.  **Xem kết quả**:
    *   Các thông tin về quá trình huấn luyện, đánh giá mô hình (cross-validation, accuracy, precision, recall, F1) sẽ được in ra console.
    *   Các tệp kết quả sẽ được lưu vào thư mục `data/results/` (hoặc thư mục `output_dir` đã cấu hình trong script):
        *   `GiaLai_RF_Feature_Importance.csv` & `GiaLai_GTB_Feature_Importance.csv`: Bảng độ quan trọng của đặc trưng.
        *   Các tệp `.png`: Biểu đồ độ quan trọng, ma trận nhầm lẫn, so sánh đặc trưng.
        *   `GiaLai_Model_Comparison_Report.txt`: Báo cáo văn bản tổng hợp các kết quả phân tích.

## Kết quả và Đầu ra Dự kiến

Dự án cung cấp một bộ kết quả toàn diện, bao gồm:

1.  **Bản đồ nguy cơ cháy rừng 5 cấp độ (GeoTIFF và hiển thị trên GEE)**:
    *   Cấp 1: Rất thấp (Xanh lá) - Khu vực an toàn, ít khả năng cháy.
    *   Cấp 2: Thấp (Vàng) - Nguy cơ thấp, cần theo dõi.
    *   Cấp 3: Trung bình (Cam) - Nguy cơ hiện hữu, cần chú ý.
    *   Cấp 4: Cao (Đỏ) - Nguy cơ cao, cần chuẩn bị các biện pháp phòng ngừa.
    *   Cấp 5: Rất cao/Nguy hiểm (Đỏ sẫm) - Nguy cơ cực kỳ cao, ưu tiên giám sát và sẵn sàng ứng phó.
    *   *Ví dụ trực quan về bản đồ có thể được tìm thấy trong thư mục `data/results/example_maps/` (nếu bạn cung cấp).*

2.  **Phân tích chi tiết độ quan trọng của đặc trưng (Bảng CSV và Biểu đồ PNG)**:
    *   Xác định các yếu tố có ảnh hưởng lớn nhất đến nguy cơ cháy (ví dụ: LST, NDVI, độ ẩm, độ dốc).
    *   So sánh sự khác biệt về độ quan trọng của đặc trưng giữa mô hình RF và GTB.

3.  **Đánh giá hiệu suất mô hình (Bảng CSV và Báo cáo TXT)**:
    *   Ma trận nhầm lẫn chi tiết cho từng mô hình.
    *   Các chỉ số: Độ chính xác tổng thể (Overall Accuracy), Hệ số Kappa, Độ chính xác dương tính (Precision), Độ nhạy (Recall), Điểm F1 (F1-score).
    *   Kết quả kiểm định chéo (cross-validation) 5-fold để đánh giá tính ổn định của mô hình.

4.  **Báo cáo tổng hợp (Tệp .txt)**:
    *   Tóm tắt thông tin dữ liệu (số lượng mẫu, phân phối nhãn).
    *   So sánh chi tiết hiệu suất giữa hai mô hình RF và GTB.
    *   Liệt kê top 10 đặc trưng quan trọng nhất cho mỗi mô hình.
    *   Nhận xét về các trường hợp dự đoán sai (false positives, false negatives).
    *   Kết luận về mô hình phù hợp hơn và các khuyến nghị (nếu có).

## Nguồn dữ liệu chi tiết

| Dữ liệu                 | Sản phẩm Google Earth Engine ID                               | Độ phân giải không gian | Tần suất thời gian | Ghi chú                                       |
|--------------------------|---------------------------------------------------------------|---------------------------|--------------------|-----------------------------------------------|
| Ảnh đa phổ             | `COPERNICUS/S2_SR` (Sentinel-2 MSI, Level-2A)                 | 10m, 20m, 60m             | 5 ngày             | Sử dụng các kênh Blue, Green, Red, NIR, SWIR1, SWIR2 |
| Nhiệt độ bề mặt đất  | `MODIS/061/MOD11A2` (Terra Land Surface Temperature)          | 1km                       | 8 ngày             | Kênh `LST_Day_1km`                             |
| Điểm cháy chủ động     | `MODIS/061/MOD14A1` (Terra Thermal Anomalies/Fire)            | 1km                       | Hàng ngày          | Kênh `FireMask`                               |
| Mô hình số độ cao      | `USGS/SRTMGL1_003` (SRTM Version 3.0 Global 1 arc-second)     | 30m                       | Tĩnh               |                                               |
| Lượng mưa               | `UCSB-CHG/CHIRPS/DAILY` (Climate Hazards Group InfraRed Precipitation with Station data) | ~5.5km                    | Hàng ngày          |                                               |
| Dữ liệu gió              | `ECMWF/ERA5_LAND/DAILY_AGGR` (ERA5-Land Daily Aggregated)     | ~9km                      | Hàng ngày          | Thành phần U và V của gió ở độ cao 10m          |

## Ứng dụng thực tiễn và Tiềm năng mở rộng

-   **Quản lý và bảo vệ rừng**: Cung cấp thông tin đầu vào quan trọng cho các cơ quan kiểm lâm và quản lý rừng trong việc xác định các "điểm nóng" cháy rừng, từ đó ưu tiên nguồn lực tuần tra, giám sát và xây dựng các biện pháp phòng cháy chữa cháy hiệu quả hơn.
-   **Hệ thống cảnh báo sớm**: Có thể tích hợp vào các hệ thống cảnh báo sớm cháy rừng, giúp cộng đồng địa phương và các đơn vị liên quan chủ động hơn trong công tác chuẩn bị và ứng phó khi có nguy cơ cao.
-   **Quy hoạch sử dụng đất và phát triển bền vững**: Hỗ trợ các nhà hoạch định chính sách trong việc đưa ra quyết định quy hoạch sử dụng đất, phát triển cơ sở hạ tầng và các hoạt động kinh tế - xã hội một cách bền vững, giảm thiểu rủi ro cháy rừng.
-   **Nghiên cứu khoa học và giáo dục**: Là một tài liệu tham khảo hữu ích, một bộ dữ liệu và mã nguồn mở cho các nhà nghiên cứu, sinh viên trong lĩnh vực viễn thám, GIS, khoa học dữ liệu và quản lý thiên tai.
-   **Tiềm năng mở rộng**:
    *   Áp dụng mô hình cho các tỉnh thành khác hoặc quy mô vùng lớn hơn.
    *   Bổ sung thêm các đặc trưng mới (ví dụ: loại hình sử dụng đất, mật độ dân số, khoảng cách đến đường giao thông, dữ liệu sét).
    *   Thử nghiệm các thuật toán học máy khác (ví dụ: Support Vector Machines, Neural Networks, XGBoost).
    *   Phát triển giao diện người dùng web (web application) để người dùng cuối dễ dàng tương tác và xem kết quả.
    *   Hướng tới dự báo theo thời gian thực hoặc cận thời gian thực.

## Đóng góp

Chúng tôi hoan nghênh mọi sự đóng góp để cải thiện dự án này! Nếu bạn có ý tưởng, muốn báo lỗi hoặc đóng góp mã nguồn, vui lòng:

1.  **Fork a repository**: Tạo một bản sao (fork) của repository này về tài khoản GitHub của bạn.
2.  **Tạo một nhánh mới (New Branch)**: `git checkout -b feature/TenFeatureMoi` hoặc `bugfix/MoTaLoi`.
3.  **Thực hiện thay đổi và commit**: `git commit -am 'Thêm tính năng X'` hoặc `git commit -am 'Sửa lỗi Y'`.
4.  **Đẩy nhánh lên GitHub (Push to the branch)**: `git push origin feature/TenFeatureMoi`.
5.  **Tạo Pull Request**: Mở một Pull Request từ nhánh của bạn sang nhánh `main` của repository gốc.

Vui lòng đảm bảo mã nguồn của bạn tuân thủ các quy ước và có comment rõ ràng.

## Giấy phép

Dự án này được cấp phép theo Giấy phép MIT. Xem chi tiết tại tệp `LICENSE` (nếu có, hoặc bạn có thể thêm một tệp LICENSE.md với nội dung giấy phép MIT).

## Liên hệ

Ninh Hải Đăng - [ninhhaidang.fet@gmail.com](mailto:ninhhaidang.fet@gmail.com)

Link dự án: [https://github.com/ninhhaidang/GiaLai-forest-fire](https://github.com/ninhhaidang/GiaLai-forest-fire)

---

**Từ khóa**: Viễn thám, GIS, Học máy, Dự báo cháy rừng, Google Earth Engine, Random Forest, Gradient Tree Boosting, Python, JavaScript, Sentinel-2, MODIS, SRTM, CHIRPS, ERA5-Land, Phân tích đặc trưng, Bản đồ nguy cơ cháy rừng, Quản lý thiên tai, Gia Lai, Việt Nam. 