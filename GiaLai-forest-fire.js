// Xác định vùng quan tâm (ROI) bằng FeatureCollection.
// Đây được coi là một tài sản trong Google Earth Engine.
var gia_lai = ee.FeatureCollection("projects/ee-bonglantrungmuoi/assets/gia_lai");

// Xác định ngày bắt đầu và ngày kết thúc để lọc dữ liệu.
var startDate = "2024-12-01", endDate = "2025-04-30";

// Xác định các tham số hiển thị cho các lớp khác nhau.
// Mỗi khóa đại diện cho một lớp và giá trị của nó là một đối tượng
// chỉ định giá trị tối thiểu, tối đa và bảng màu để hiển thị.
var VIS_PARAMS = {
    ndvi: { min: 0, max: 1, palette: ['brown', 'yellow', 'green'] }, // Chỉ số thực vật NDVI
    ndwi: { min: -1, max: 1, palette: ['brown', 'white', 'blue'] }, // Chỉ số nước NDWI
    vci: { min: 0, max: 100, palette: ['red', 'yellow', 'green'] },   // Chỉ số tình trạng thực vật VCI
    tci: { min: 0, max: 100, palette: ['blue', 'white', 'red'] },    // Chỉ số tình trạng nhiệt độ TCI
    temp: { min: 15, max: 45, palette: ['blue', 'yellow', 'red'] },   // Nhiệt độ bề mặt đất
    dem: { min: 200, max: 1200, palette: ['green', 'brown', 'white'] }, // Mô hình số độ cao DEM
    slope: { min: 0, max: 60, palette: ['white', 'orange', 'red'] }, // Độ dốc
    fire: { min: 0, max: 1, palette: ['white', 'red'] },               // Mặt nạ cháy
    prediction_5levels: { // Dự đoán nguy cơ cháy với 5 cấp độ
        min: 1, max: 5,
        palette: ['#00FF00', '#FFFF00', '#FFA500', '#FF0000', '#8B0000'] // Xanh lá, Vàng, Cam, Đỏ, Đỏ sẫm
    }
};

/**
 * Xử lý ảnh vệ tinh Sentinel-2 để tính toán các chỉ số thực vật khác nhau.
 * @return {object} Một đối tượng chứa ảnh Sentinel đã xử lý và các chỉ số dẫn xuất.
 */
function processSentinel() {
    // Tải bộ sưu tập ảnh Sentinel-2 Surface Reflectance.
    var sentinel = ee.ImageCollection("COPERNICUS/S2_SR")
        .filterBounds(gia_lai) // Lọc theo vùng quan tâm.
        .filterDate(startDate, endDate) // Lọc theo khoảng thời gian đã xác định.
        // Lọc ảnh có tỷ lệ pixel mây dưới 10%.
        .filterMetadata("CLOUDY_PIXEL_PERCENTAGE", "less_than", 10)
        // Lặp qua bộ sưu tập để che phủ mây bằng cách sử dụng kênh xác suất mây của S2 (MSK_CLDPRB).
        // Các pixel có xác suất mây dưới 30 sẽ được giữ lại.
        .map(function (image) {
            return image.updateMask(image.select("MSK_CLDPRB").lt(30));
        })
        // Chọn các kênh liên quan để phân tích.
        .select(["B2", "B3", "B4", "B8", "B11", "B12"]) // Blue, Green, Red, NIR, SWIR1, SWIR2
        .median() // Tạo một ảnh tổng hợp duy nhất bằng cách lấy giá trị trung vị của tất cả các ảnh.
        .clip(gia_lai); // Cắt ảnh tổng hợp theo vùng quan tâm.

    // Trả về một đối tượng chứa ảnh Sentinel đã xử lý và các chỉ số đã tính toán.
    return {
        sentinel: sentinel, // Ảnh tổng hợp trung vị Sentinel-2 đã xử lý.
        // Tính toán Chỉ số thực vật NDVI.
        ndvi: sentinel.normalizedDifference(["B8", "B4"]).rename("NDVI"),
        // Tính toán Chỉ số nước NDWI.
        ndwi: sentinel.normalizedDifference(["B3", "B8"]).rename("NDWI"),
        // Tính toán Chỉ số nước bề mặt đất LSWI.
        lswi: sentinel.normalizedDifference(["B8", "B11"]).rename("LSWI"),
        // Tính toán Chỉ số thực vật tăng cường EVI.
        evi: sentinel.expression('2.5 * ((NIR - RED) / (NIR + 6 * RED - 7.5 * BLUE + 1))', {
            'NIR': sentinel.select('B8'), 'RED': sentinel.select('B4'), 'BLUE': sentinel.select('B2')
        }).rename('EVI'),
        // Tính toán Chỉ số thực vật điều chỉnh theo đất SAVI.
        savi: sentinel.expression('((NIR - RED) * (1.5)) / (NIR + RED + 0.5)', {
            'NIR': sentinel.select('B8'), 'RED': sentinel.select('B4')
        }).rename('SAVI'),
        // Tính toán Chỉ số cháy chuẩn hóa NBR.
        nbr: sentinel.normalizedDifference(["B8", "B12"]).rename("NBR"),
        // Tính toán Chỉ số độ ẩm chuẩn hóa NDMI.
        ndmi: sentinel.normalizedDifference(["B11", "B8"]).rename("NDMI")
    };
}

/**
 * Xử lý các nguồn dữ liệu môi trường khác nhau như nhiệt độ, DEM, lượng mưa và gió.
 * Tính toán VCI và TCI bằng cách sử dụng NDVI được cung cấp.
 * @param {ee.Image} ndvi - Ảnh NDVI, được sử dụng để tính toán VCI.
 * @return {object} Một đối tượng chứa các lớp dữ liệu môi trường đã xử lý.
 */
function processEnvironmentalData(ndvi) {
    // Tải dữ liệu Nhiệt độ bề mặt đất (LST) của MODIS.
    var tempCollection = ee.ImageCollection("MODIS/061/MOD11A2")
        .filterBounds(gia_lai) // Lọc theo ROI.
        .filterDate(startDate, endDate) // Lọc theo khoảng thời gian.
        .select("LST_Day_1km"); // Chọn kênh LST ban ngày.

    // Tính toán nhiệt độ trung bình, chuyển đổi từ Kelvin sang Celsius và cắt theo ROI.
    // Chiếu lại về một tỷ lệ nhất quán (1000m) để tương thích với các sản phẩm MODIS khác.
    var temperature = tempCollection.mean()
        .multiply(0.02).subtract(273.15) // Áp dụng hệ số tỷ lệ và độ lệch cho LST.
        .rename("Temperature")
        .clip(gia_lai)
        .reproject({ crs: 'EPSG:4326', scale: 1000 }); // Chiếu lại về WGS84 với tỷ lệ 1km.

    // Tính toán giá trị NDVI tối thiểu và tối đa trong ROI để tính toán VCI.
    var ndviStats = ndvi.reduceRegion({
        reducer: ee.Reducer.minMax(),
        geometry: gia_lai.geometry(),
        scale: 30, // Tỷ lệ của NDVI (Sentinel-2).
        maxPixels: 1e9,
        bestEffort: true // Sử dụng bestEffort để tránh giới hạn tính toán nếu hình học lớn.
    });

    // Tạo ảnh hằng số cho NDVI tối thiểu và tối đa.
    var ndviMin = ee.Image.constant(ndviStats.get("NDVI_min"));
    var ndviMax = ee.Image.constant(ndviStats.get("NDVI_max"));

    // Tính toán Chỉ số tình trạng thực vật (VCI).
    var vci = ndvi.subtract(ndviMin)
        .divide(ndviMax.subtract(ndviMin))
        .multiply(100).rename("VCI").clip(gia_lai);

    // Tính toán giá trị LST tối thiểu và tối đa từ bộ sưu tập MODIS để tính toán TCI.
    var tempStats = tempCollection.reduce(ee.Reducer.minMax()); // Giảm bộ sưu tập để có được ảnh min/max.
    // Chuyển đổi LST tối thiểu và tối đa sang Celsius.
    var lstMin = ee.Image(tempStats.select('LST_Day_1km_min')).multiply(0.02).subtract(273.15);
    var lstMax = ee.Image(tempStats.select('LST_Day_1km_max')).multiply(0.02).subtract(273.15);

    // Tính toán Chỉ số tình trạng nhiệt độ (TCI).
    // Chiếu lại về một tỷ lệ nhất quán (1000m).
    var tci = lstMax.subtract(temperature)
        .divide(lstMax.subtract(lstMin))
        .multiply(100)
        .rename("TCI")
        .clip(gia_lai)
        .reproject({ crs: 'EPSG:4326', scale: 1000 });

    // Tải dữ liệu Mô hình số độ cao (DEM) từ SRTM.
    var dem = ee.Image("USGS/SRTMGL1_003").rename("DEM").clip(gia_lai);
    // Tính toán các sản phẩm địa hình (độ dốc, hướng dốc) từ DEM.
    var terrain = ee.Terrain.products(dem);

    // Tải dữ liệu lượng mưa hàng ngày của CHIRPS.
    var precipitation = ee.ImageCollection("UCSB-CHG/CHIRPS/DAILY")
        .filterBounds(gia_lai) // Lọc theo ROI.
        .filterDate(startDate, endDate) // Lọc theo khoảng thời gian.
        .mean() // Tính toán lượng mưa trung bình trong khoảng thời gian.
        .select("precipitation")
        .clip(gia_lai);

    // Tải dữ liệu gió tổng hợp hàng ngày của ERA5 Land.
    var wind = ee.ImageCollection("ECMWF/ERA5_LAND/DAILY_AGGR")
        .filterBounds(gia_lai) // Lọc theo ROI.
        .filterDate(startDate, endDate) // Lọc theo khoảng thời gian.
        .select(["u_component_of_wind_10m", "v_component_of_wind_10m"]) // Chọn thành phần gió U và V.
        .mean() // Tính toán thành phần gió trung bình.
        .clip(gia_lai);

    // Trả về một đối tượng chứa dữ liệu môi trường đã xử lý.
    return {
        temperature: temperature,
        vci: vci,
        tci: tci,
        dem: dem,
        slope: terrain.select("slope").rename("Slope").clip(gia_lai),
        aspect: terrain.select("aspect").rename("Aspect").clip(gia_lai),
        precipitation: precipitation,
        // Tính toán tốc độ gió từ thành phần U và V.
        windSpeed: wind.expression(
            'sqrt(u*u + v*v)', {
            'u': wind.select('u_component_of_wind_10m'),
            'v': wind.select('v_component_of_wind_10m')
        }
        ).rename("WindSpeed").clip(gia_lai)
    };
}

/**
 * Huấn luyện các bộ phân loại Random Forest và Gradient Tree Boosting, đánh giá độ chính xác của chúng,
 * và tạo bản đồ xác suất nguy cơ cháy.
 * @param {object} allData - Một đối tượng chứa tất cả dữ liệu ảnh đã xử lý (chỉ số Sentinel, dữ liệu môi trường).
 * @param {ee.List} bands - Một danh sách các tên kênh sẽ được sử dụng làm yếu tố dự đoán trong các mô hình.
 * @return {object} Một đối tượng chứa kết quả mô hình, bao gồm bản đồ nguy cơ và các chỉ số độ chính xác.
 */
function trainAndEvaluateModels(allData, bands) {
    // Tải dữ liệu cháy chủ động của MODIS để tạo nhãn cháy (dữ liệu thực tế).
    // Các giá trị FireMask > 6 (cháy có độ tin cậy danh nghĩa và cao) được coi là cháy.
    // Chiếu lại về tỷ lệ thô hơn (500m) cho dữ liệu MODIS.
    var fireLabel = ee.ImageCollection("MODIS/061/MOD14A1")
        .filterBounds(gia_lai) // Lọc theo ROI.
        .filterDate(startDate, endDate) // Lọc theo khoảng thời gian.
        .select("FireMask")
        .max() // Lấy phát hiện cháy tối đa trong khoảng thời gian.
        .gt(6) // Các pixel có FireMask > 6 được gán nhãn là cháy (1), các pixel khác là không cháy (0).
        .rename("Fire_Label")
        .clip(gia_lai)
        .reproject({ crs: 'EPSG:4326', scale: 500 }); // Chiếu lại về WGS84 với tỷ lệ 500m.

    // Kết hợp tất cả các kênh dự đoán và nhãn cháy thành một ảnh đa kênh duy nhất để lấy mẫu.
    // Đảm bảo kênh lượng mưa được đổi tên nếu chưa được đổi.
    var featuresForSampling = ee.Image.cat([
        allData.ndvi, allData.ndwi, allData.lswi, allData.evi, allData.savi,
        allData.nbr, allData.ndmi, allData.temperature, allData.vci, allData.tci,
        allData.slope, allData.aspect,
        allData.precipitation.rename("Precipitation"), // Đảm bảo đặt tên nhất quán.
        allData.windSpeed, allData.dem, fireLabel
    ]).select(bands.cat(["Fire_Label"])); // Chỉ chọn các kênh được chỉ định và nhãn.

    // Thực hiện lấy mẫu phân tầng để có được các điểm huấn luyện và kiểm tra.
    // Lấy mẫu phân tầng đảm bảo sự đại diện từ cả hai lớp cháy và không cháy.
    var samples = featuresForSampling.stratifiedSample({
        numPoints: 1000, // Tổng số điểm cần lấy mẫu.
        classBand: "Fire_Label", // Kênh để phân tầng.
        region: gia_lai.geometry(), // Vùng để lấy mẫu.
        scale: 500, // Tỷ lệ lấy mẫu, phải khớp với độ phân giải thô nhất hoặc độ phân giải mục tiêu.
        seed: 42, // Seed để có thể tái tạo.
        geometries: true, // Bao gồm hình học của các điểm được lấy mẫu.
        dropNulls: true // Loại bỏ các điểm mà bất kỳ kênh nào có giá trị null.
    });
    // Bộ lọc bổ sung để đảm bảo không có giá trị null trong các kênh dự đoán.
    samples = samples.filter(ee.Filter.notNull(bands));

    // Chia mẫu thành tập huấn luyện và tập kiểm tra (70% huấn luyện, 30% kiểm tra).
    var split = 0.7;
    samples = samples.randomColumn('random', 42); // Thêm một cột ngẫu nhiên để chia.
    var training = samples.filter(ee.Filter.lt('random', split));
    var testing = samples.filter(ee.Filter.gte('random', split));

    // Xác định các tham số cho bộ phân loại Random Forest (RF).
    var rfParams = {
        numberOfTrees: 100,       // Số lượng cây trong rừng.
        minLeafPopulation: 5,     // Số lượng mẫu tối thiểu trong một nút lá.
        bagFraction: 0.7,         // Tỷ lệ đầu vào để lấy mẫu có hoàn lại cho mỗi cây.
        seed: 42                  // Seed để có thể tái tạo.
    };

    // Xác định các tham số cho bộ phân loại Gradient Tree Boosting (GTB).
    var gtbParams = {
        numberOfTrees: 100,       // Số lượng cây.
        shrinkage: 0.05,          // Tốc độ học.
        samplingRate: 0.7,        // Tỷ lệ lấy mẫu con của dữ liệu đầu vào.
        maxNodes: 10,             // Số lượng nút tối đa cho mỗi cây.
        seed: 42                  // Seed để có thể tái tạo.
    };

    // Huấn luyện các bộ phân loại RF và GTB để đánh giá độ chính xác (chế độ đầu ra: CLASSIFICATION).
    var rfClassifierForAccuracy = ee.Classifier.smileRandomForest(rfParams).train(training, "Fire_Label", bands);
    var gtbClassifierForAccuracy = ee.Classifier.smileGradientTreeBoost(gtbParams).train(training, "Fire_Label", bands);

    // Huấn luyện các bộ phân loại RF và GTB để có đầu ra xác suất (chế độ đầu ra: PROBABILITY).
    var rfClassifierForProba = ee.Classifier.smileRandomForest(rfParams).setOutputMode('PROBABILITY').train(training, "Fire_Label", bands);
    var gtbClassifierForProba = ee.Classifier.smileGradientTreeBoost(gtbParams).setOutputMode('PROBABILITY').train(training, "Fire_Label", bands);

    // Xác định phép chiếu và tỷ lệ mục tiêu cho các bản đồ phân loại cuối cùng (ví dụ: độ phân giải Sentinel-2).
    var targetProjection = allData.ndvi.projection(); // Sử dụng phép chiếu NDVI làm tham chiếu.
    var targetScale = 30; // Tỷ lệ mục tiêu tính bằng mét.

    // Chồng tất cả các kênh dự đoán để phân loại bản đồ.
    var predictorsStackForMap = ee.Image.cat([
        allData.ndvi, allData.ndwi, allData.lswi, allData.evi, allData.savi,
        allData.nbr, allData.ndmi, allData.temperature, allData.vci, allData.tci,
        allData.slope, allData.aspect,
        allData.precipitation.rename("Precipitation"), // Đảm bảo đặt tên nhất quán.
        allData.windSpeed, allData.dem
    ]).select(bands); // Chỉ chọn các kênh dự đoán.

    // Lấy mẫu lại và chiếu lại chồng các yếu tố dự đoán về độ phân giải và phép chiếu mục tiêu.
    // Điều này đảm bảo tất cả các đặc trưng đầu vào cho phân loại có cùng thuộc tính không gian.
    var inputFeaturesForMapClassification = predictorsStackForMap
        .resample('bilinear') // Lấy mẫu lại bằng phương pháp nội suy song tuyến tính.
        .reproject({          // Chiếu lại về CRS và tỷ lệ mục tiêu.
            crs: targetProjection,
            scale: targetScale
        });

    // Phân loại các đặc trưng đầu vào để có được bản đồ xác suất cháy.
    // Kênh 'classification' từ chế độ PROBABILITY chứa xác suất của lớp dương (cháy).
    var rfProbability = inputFeaturesForMapClassification.classify(rfClassifierForProba).select('classification').rename("RF_Probability").clip(gia_lai);
    var gtbProbability = inputFeaturesForMapClassification.classify(gtbClassifierForProba).select('classification').rename("GTB_Probability").clip(gia_lai);

    // Chuyển đổi bản đồ xác suất thành các cấp độ nguy cơ rời rạc (1 đến 5).
    // Xác định ngưỡng để phân loại nguy cơ.
    var rfRiskLevels = rfProbability.expression(
        "(P <= 0.2) ? 1 : (P <= 0.4) ? 2 : (P <= 0.6) ? 3 : (P <= 0.8) ? 4 : 5", { P: rfProbability }
    ).rename("RF_Risk_Levels").clip(gia_lai);

    var gtbRiskLevels = gtbProbability.expression(
        "(P <= 0.2) ? 1 : (P <= 0.4) ? 2 : (P <= 0.6) ? 3 : (P <= 0.8) ? 4 : 5", { P: gtbProbability }
    ).rename("GTB_Risk_Levels").clip(gia_lai);

    // Xuất FeatureCollection training để sử dụng sau này cho feature importance
    return {
        features: featuresForSampling, // Ảnh đa kênh được sử dụng để lấy mẫu.
        trainingData: training, // FeatureCollection để huấn luyện mô hình và tính feature importance
        inputFeaturesForClassification: inputFeaturesForMapClassification, // Chồng các yếu tố dự đoán để phân loại bản đồ.
        rfRiskLevels: rfRiskLevels,   // Bản đồ cấp độ nguy cơ của Random Forest.
        gtbRiskLevels: gtbRiskLevels,   // Bản đồ cấp độ nguy cơ của Gradient Tree Boosting.
        // Tính toán ma trận lỗi cho RF trên tập kiểm tra.
        rfAccuracyMatrix: testing.classify(rfClassifierForAccuracy).errorMatrix('Fire_Label', 'classification'),
        // Tính toán ma trận lỗi cho GTB trên tập kiểm tra.
        gtbAccuracyMatrix: testing.classify(gtbClassifierForAccuracy).errorMatrix('Fire_Label', 'classification'),
        trainingSize: training.size(), // Số lượng mẫu huấn luyện.
        testingSize: testing.size()    // Số lượng mẫu kiểm tra.
    };
}

/**
 * Tạo một bảng chú giải cho bản đồ.
 * @param {Array<string>} colors - Mảng mã màu cho các mục chú giải.
 * @param {Array<string>} labels - Mảng nhãn tương ứng với các màu.
 * @return {ui.Panel} Một bảng điều khiển UI đại diện cho chú giải.
 */
function createLegend(colors, labels) {
    // Tạo tiêu đề cho chú giải.
    var legendTitle = ui.Label({
        value: 'Mức độ nguy cơ cháy', // Tiêu đề chú giải
        style: { fontWeight: 'bold', fontSize: '16px', margin: '0 0 4px 0', padding: '0' }
    });
    // Tạo bảng điều khiển chính cho chú giải.
    var legend = ui.Panel({
        style: {
            position: 'bottom-right', // Định vị chú giải ở dưới cùng bên phải bản đồ.
            padding: '8px 15px',
            border: '1px solid black' // Thêm đường viền cho chú giải.
        }
    });
    legend.add(legendTitle); // Thêm tiêu đề vào chú giải.

    // Lặp qua các màu và nhãn để tạo các mục chú giải.
    for (var i = 0; i < colors.length; i++) {
        // Tạo một hộp màu cho mục chú giải hiện tại.
        var colorBox = ui.Label({
            style: {
                backgroundColor: colors[i], // Đặt màu nền.
                padding: '8px',
                margin: '0 0 4px 0',
                border: '1px solid grey' // Thêm đường viền cho hộp màu.
            }
        });
        // Tạo một nhãn cho mô tả của mục chú giải hiện tại.
        var description = ui.Label({
            value: labels[i],
            style: { margin: '0 0 4px 6px' } // Thêm một chút lề bên trái của văn bản.
        });
        // Tạo một bảng điều khiển để giữ hộp màu và mô tả theo chiều ngang.
        var legendEntry = ui.Panel({
            widgets: [colorBox, description],
            layout: ui.Panel.Layout.Flow('horizontal')
        });
        legend.add(legendEntry); // Thêm mục vào chú giải.
    }
    return legend; // Trả về bảng chú giải đã tạo.
}

/**
 * Xuất bản đồ nguy cơ Random Forest sang Google Drive và hiển thị các lớp khác nhau trên bản đồ.
 * In các chỉ số đánh giá mô hình ra console.
 * @param {object} allData - Một đối tượng chứa tất cả dữ liệu ảnh đã xử lý.
 * @param {object} modelResults - Một đối tượng chứa kết quả từ việc huấn luyện và đánh giá mô hình.
 * @param {ee.List} bands - Một danh sách các tên kênh sẽ được sử dụng làm yếu tố dự đoán trong các mô hình.
 * @param {object} rfParams - Các tham số cho mô hình Random Forest.
 * @param {object} gtbParams - Các tham số cho mô hình Gradient Tree Boosting.
 */
function exportAndDisplayResults(allData, modelResults, bands, rfParams, gtbParams) {
    // Nếu không có tham số mô hình, tạo mới với giá trị mặc định
    if (!rfParams) {
        rfParams = {
            numberOfTrees: 100,
            minLeafPopulation: 5,
            bagFraction: 0.7,
            seed: 42
        };
    }

    if (!gtbParams) {
        gtbParams = {
            numberOfTrees: 100,
            shrinkage: 0.05,
            samplingRate: 0.7,
            maxNodes: 10,
            seed: 42
        };
    }

    // Xuất bản đồ nguy cơ 5 cấp của Random Forest sang Google Drive.
    Export.image.toDrive({
        image: modelResults.rfRiskLevels,
        description: 'GiaLai_RF_Risk_5Levels',
        folder: 'GEE_Export_GiaLai_Fire',
        region: gia_lai.geometry(),
        scale: 30,
        crs: 'EPSG:4326',
        maxPixels: 1e13
    });

    // Xuất bản đồ nguy cơ từ mô hình GTB để so sánh
    Export.image.toDrive({
        image: modelResults.gtbRiskLevels,
        description: 'GiaLai_GTB_Risk_5Levels',
        folder: 'GEE_Export_GiaLai_Fire',
        region: gia_lai.geometry(),
        scale: 30,
        crs: 'EPSG:4326',
        maxPixels: 1e13
    });

    // Xuất dữ liệu thực tế
    Export.image.toDrive({
        image: modelResults.features.select('Fire_Label').float(),
        description: 'GiaLai_Actual_Fire',
        folder: 'GEE_Export_GiaLai_Fire',
        region: gia_lai.geometry(),
        scale: 30,
        crs: 'EPSG:4326',
        maxPixels: 1e13
    });

    // Xuất từng chỉ số riêng lẻ
    // NDVI
    Export.image.toDrive({
        image: allData.ndvi.float(),
        description: 'GiaLai_NDVI',
        folder: 'GEE_Export_GiaLai_Fire',
        region: gia_lai.geometry(),
        scale: 30,
        crs: 'EPSG:4326',
        maxPixels: 1e13
    });

    // NDWI
    Export.image.toDrive({
        image: allData.ndwi.float(),
        description: 'GiaLai_NDWI',
        folder: 'GEE_Export_GiaLai_Fire',
        region: gia_lai.geometry(),
        scale: 30,
        crs: 'EPSG:4326',
        maxPixels: 1e13
    });

    // LSWI
    Export.image.toDrive({
        image: allData.lswi.float(),
        description: 'GiaLai_LSWI',
        folder: 'GEE_Export_GiaLai_Fire',
        region: gia_lai.geometry(),
        scale: 30,
        crs: 'EPSG:4326',
        maxPixels: 1e13
    });

    // EVI
    Export.image.toDrive({
        image: allData.evi.float(),
        description: 'GiaLai_EVI',
        folder: 'GEE_Export_GiaLai_Fire',
        region: gia_lai.geometry(),
        scale: 30,
        crs: 'EPSG:4326',
        maxPixels: 1e13
    });

    // SAVI
    Export.image.toDrive({
        image: allData.savi.float(),
        description: 'GiaLai_SAVI',
        folder: 'GEE_Export_GiaLai_Fire',
        region: gia_lai.geometry(),
        scale: 30,
        crs: 'EPSG:4326',
        maxPixels: 1e13
    });

    // NBR
    Export.image.toDrive({
        image: allData.nbr.float(),
        description: 'GiaLai_NBR',
        folder: 'GEE_Export_GiaLai_Fire',
        region: gia_lai.geometry(),
        scale: 30,
        crs: 'EPSG:4326',
        maxPixels: 1e13
    });

    // NDMI
    Export.image.toDrive({
        image: allData.ndmi.float(),
        description: 'GiaLai_NDMI',
        folder: 'GEE_Export_GiaLai_Fire',
        region: gia_lai.geometry(),
        scale: 30,
        crs: 'EPSG:4326',
        maxPixels: 1e13
    });

    // Nhiệt độ
    Export.image.toDrive({
        image: allData.temperature.float(),
        description: 'GiaLai_Temperature',
        folder: 'GEE_Export_GiaLai_Fire',
        region: gia_lai.geometry(),
        scale: 1000,
        crs: 'EPSG:4326',
        maxPixels: 1e13
    });

    // VCI
    Export.image.toDrive({
        image: allData.vci.float(),
        description: 'GiaLai_VCI',
        folder: 'GEE_Export_GiaLai_Fire',
        region: gia_lai.geometry(),
        scale: 30,
        crs: 'EPSG:4326',
        maxPixels: 1e13
    });

    // TCI
    Export.image.toDrive({
        image: allData.tci.float(),
        description: 'GiaLai_TCI',
        folder: 'GEE_Export_GiaLai_Fire',
        region: gia_lai.geometry(),
        scale: 1000,
        crs: 'EPSG:4326',
        maxPixels: 1e13
    });

    // DEM
    Export.image.toDrive({
        image: allData.dem.float(),
        description: 'GiaLai_DEM',
        folder: 'GEE_Export_GiaLai_Fire',
        region: gia_lai.geometry(),
        scale: 30,
        crs: 'EPSG:4326',
        maxPixels: 1e13
    });

    // Độ dốc
    Export.image.toDrive({
        image: allData.slope.float(),
        description: 'GiaLai_Slope',
        folder: 'GEE_Export_GiaLai_Fire',
        region: gia_lai.geometry(),
        scale: 30,
        crs: 'EPSG:4326',
        maxPixels: 1e13
    });

    // Hướng dốc
    Export.image.toDrive({
        image: allData.aspect.float(),
        description: 'GiaLai_Aspect',
        folder: 'GEE_Export_GiaLai_Fire',
        region: gia_lai.geometry(),
        scale: 30,
        crs: 'EPSG:4326',
        maxPixels: 1e13
    });

    // Lượng mưa
    Export.image.toDrive({
        image: allData.precipitation.float(),
        description: 'GiaLai_Precipitation',
        folder: 'GEE_Export_GiaLai_Fire',
        region: gia_lai.geometry(),
        scale: 5000,
        crs: 'EPSG:4326',
        maxPixels: 1e13
    });

    // Tốc độ gió
    Export.image.toDrive({
        image: allData.windSpeed.float(),
        description: 'GiaLai_WindSpeed',
        folder: 'GEE_Export_GiaLai_Fire',
        region: gia_lai.geometry(),
        scale: 9000,
        crs: 'EPSG:4326',
        maxPixels: 1e13
    });

    // Xuất ảnh Sentinel-2 đã xử lý (cho Hình 3.2)
    Export.image.toDrive({
        image: allData.sentinel.select(['B4', 'B3', 'B2']),
        description: 'GiaLai_Sentinel2_RGB',
        folder: 'GEE_Export_GiaLai_Fire',
        region: gia_lai.geometry(),
        scale: 100,
        crs: 'EPSG:4326',
        maxPixels: 1e13
    });

    // Tính toán feature importance từ mô hình RF sử dụng dữ liệu đã lấy mẫu
    var rfClassifier = ee.Classifier.smileRandomForest(rfParams)
        .train(modelResults.trainingData, 'Fire_Label', bands);

    var gtbClassifier = ee.Classifier.smileGradientTreeBoost(gtbParams)
        .train(modelResults.trainingData, 'Fire_Label', bands);

    // Xuất dữ liệu huấn luyện với tất cả các đặc trưng để tính feature importance trong Python
    Export.table.toDrive({
        collection: modelResults.trainingData,
        description: 'GiaLai_Training_Data_For_Feature_Importance',
        folder: 'GEE_Export_GiaLai_Fire',
        fileFormat: 'CSV'
    });

    // Tạo FeatureCollection chứa tên các đặc trưng
    var featureNamesFC = ee.FeatureCollection(bands.map(function (band) {
        return ee.Feature(null, { 'feature_name': band });
    }));

    // Xuất tên các đặc trưng
    Export.table.toDrive({
        collection: featureNamesFC,
        description: 'GiaLai_Feature_Names',
        folder: 'GEE_Export_GiaLai_Fire',
        fileFormat: 'CSV'
    });

    // Căn giữa bản đồ theo vùng quan tâm.
    Map.centerObject(gia_lai, 9); // Mức thu phóng 9.

    // Thêm các lớp dữ liệu khác nhau vào bản đồ. Hầu hết ban đầu được tắt (false).
    Map.addLayer(allData.ndvi, VIS_PARAMS.ndvi, "NDVI", false);
    Map.addLayer(allData.ndwi, VIS_PARAMS.ndwi, "NDWI", false);
    Map.addLayer(allData.lswi, VIS_PARAMS.ndwi, "LSWI", false);
    Map.addLayer(allData.evi, VIS_PARAMS.ndvi, "EVI", false);
    Map.addLayer(allData.savi, VIS_PARAMS.ndvi, "SAVI", false);
    Map.addLayer(allData.nbr, VIS_PARAMS.ndvi, "NBR", false);
    Map.addLayer(allData.ndmi, VIS_PARAMS.ndwi, "NDMI", false);
    Map.addLayer(allData.temperature, VIS_PARAMS.temp, "Nhiệt độ (MODIS)", false);
    Map.addLayer(allData.vci, VIS_PARAMS.vci, "VCI", false);
    Map.addLayer(allData.tci, VIS_PARAMS.tci, "TCI", false);
    Map.addLayer(allData.dem, VIS_PARAMS.dem, "Địa hình DEM", false);
    Map.addLayer(allData.slope, VIS_PARAMS.slope, "Độ dốc", false);
    Map.addLayer(allData.aspect, { min: 0, max: 360, palette: ['#1f78b4', '#b2df8a', '#33a02c', '#fb9a99', '#e31a1c', '#fdbf6f', '#ff7f00', '#cab2d6', '#6a3d9a', '#ffff99', '#b15928', '#000000'] }, "Hướng dốc", false);
    Map.addLayer(allData.precipitation, { min: 0, max: 15, palette: ['white', 'blue'] }, "Lượng mưa (CHIRPS)", false);
    Map.addLayer(allData.windSpeed, { min: 0, max: 10, palette: ['white', 'cyan'] }, "Tốc độ gió (ERA5)", false);
    Map.addLayer(modelResults.features.select('Fire_Label'), VIS_PARAMS.fire, "Nhãn cháy thực tế (MODIS)", false);
    Map.addLayer(modelResults.rfRiskLevels, VIS_PARAMS.prediction_5levels, "Dự đoán cháy 5 mức (RF)");
    Map.addLayer(modelResults.gtbRiskLevels, VIS_PARAMS.prediction_5levels, "Dự đoán cháy 5 mức (GTB)");

    // Xác định màu sắc và nhãn cho chú giải nguy cơ cháy.
    var colors = VIS_PARAMS.prediction_5levels.palette;
    var labels = [
        '1: Thấp',           // Nguy cơ thấp
        '2: Trung bình', // Nguy cơ trung bình
        '3: Cao',       // Nguy cơ cao
        '4: Nguy hiểm',  // Nguy cơ nguy hiểm
        '5: Cực kỳ nguy hiểm'   // Nguy cơ cực kỳ nguy hiểm
    ];
    // Tạo và thêm chú giải vào bản đồ.
    var legend = createLegend(colors, labels);
    Map.add(legend);

    // In kết quả đánh giá mô hình ra console.
    print("Số điểm mẫu huấn luyện:", modelResults.trainingSize);
    print("Số điểm mẫu kiểm tra:", modelResults.testingSize);

    // Tính toán và in các chỉ số hiệu suất của Random Forest.
    var rfAccuracy = modelResults.rfAccuracyMatrix.accuracy();
    print("Ma trận lỗi Random Forest:", modelResults.rfAccuracyMatrix);
    print("Độ chính xác tổng thể (Overall Accuracy) RF:", rfAccuracy);

    // Tính kappa coefficient cho RF
    var rfKappa = modelResults.rfAccuracyMatrix.kappa();
    print("Kappa Coefficient RF:", rfKappa);

    // In ma trận lỗi cho mô hình GTB
    print("Ma trận lỗi Gradient Tree Boosting:", modelResults.gtbAccuracyMatrix);

    // Tính độ chính xác tổng thể cho GTB
    var gtbAccuracy = modelResults.gtbAccuracyMatrix.accuracy();
    print("Độ chính xác tổng thể (Overall Accuracy) GTB:", gtbAccuracy);

    // Tính kappa coefficient cho GTB
    var gtbKappa = modelResults.gtbAccuracyMatrix.kappa();
    print("Kappa Coefficient GTB:", gtbKappa);

    // Xuất ma trận nhầm lẫn và các chỉ số đánh giá
    Export.table.toDrive({
        collection: ee.FeatureCollection([
            ee.Feature(null, {
                rf_accuracy: ee.Number(rfAccuracy).float(),
                rf_kappa: ee.Number(rfKappa).float(),
                gtb_accuracy: ee.Number(gtbAccuracy).float(),
                gtb_kappa: ee.Number(gtbKappa).float()
            })
        ]),
        description: 'GiaLai_Model_Evaluation_Metrics',
        folder: 'GEE_Export_GiaLai_Fire',
        fileFormat: 'CSV'
    });
}

/**
 * Hàm chính để điều phối toàn bộ quy trình làm việc.
 */
function main() {
    // Xác định danh sách các kênh dự đoán sẽ được sử dụng trong các mô hình.
    // Các tên này phải khớp với các tên được gán khi tạo các kênh ảnh tương ứng.
    var bands = ee.List([
        "NDVI", "NDWI", "LSWI", "EVI", "SAVI", "NBR", "NDMI",
        "Temperature", "VCI", "TCI", "Slope", "Aspect",
        "Precipitation", "WindSpeed", "DEM"
    ]);

    // Xác định các tham số cho bộ phân loại Random Forest (RF).
    var rfParams = {
        numberOfTrees: 100,       // Số lượng cây trong rừng.
        minLeafPopulation: 5,     // Số lượng mẫu tối thiểu trong một nút lá.
        bagFraction: 0.7,         // Tỷ lệ đầu vào để lấy mẫu có hoàn lại cho mỗi cây.
        seed: 42                  // Seed để có thể tái tạo.
    };

    // Xác định các tham số cho bộ phân loại Gradient Tree Boosting (GTB).
    var gtbParams = {
        numberOfTrees: 100,       // Số lượng cây.
        shrinkage: 0.05,          // Tốc độ học.
        samplingRate: 0.7,        // Tỷ lệ lấy mẫu con của dữ liệu đầu vào.
        maxNodes: 10,             // Số lượng nút tối đa cho mỗi cây.
        seed: 42                  // Seed để có thể tái tạo.
    };

    // Bước 1: Xử lý dữ liệu Sentinel-2 để có được các chỉ số thực vật.
    var sentinelData = processSentinel();
    // Bước 2: Xử lý dữ liệu môi trường (nhiệt độ, VCI, TCI, DEM, v.v.).
    // NDVI từ dữ liệu Sentinel được truyền vào để tính toán VCI.
    var envData = processEnvironmentalData(sentinelData.ndvi);

    // Bước 3: Kết hợp tất cả dữ liệu đã xử lý thành một đối tượng duy nhất.
    // Điều này giúp dễ dàng truyền dữ liệu giữa các hàm.
    var allData = {
        sentinel: sentinelData.sentinel,
        ndvi: sentinelData.ndvi,
        ndwi: sentinelData.ndwi,
        lswi: sentinelData.lswi,
        evi: sentinelData.evi,
        savi: sentinelData.savi,
        nbr: sentinelData.nbr,
        ndmi: sentinelData.ndmi,
        temperature: envData.temperature,
        vci: envData.vci,
        tci: envData.tci,
        dem: envData.dem,
        slope: envData.slope,
        aspect: envData.aspect,
        precipitation: envData.precipitation,
        windSpeed: envData.windSpeed
    };

    // Bước 4: Huấn luyện các mô hình học máy và đánh giá hiệu suất của chúng.
    var modelResults = trainAndEvaluateModels(allData, bands);
    // Bước 5: Xuất kết quả (ví dụ: bản đồ nguy cơ) và hiển thị chúng trên bản đồ.
    // Đồng thời, in các chỉ số đánh giá.
    exportAndDisplayResults(allData, modelResults, bands, rfParams, gtbParams);
}

// Chạy hàm chính để bắt đầu xử lý.
main();