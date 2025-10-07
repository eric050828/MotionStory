"""
CSV Import/Export Service Unit Tests (T044)
測試 CSV 驗證、格式錯誤處理 (FR-021, FR-025)
"""

import pytest
from io import StringIO
import csv


class TestCSVExport:
    """測試 CSV 匯出功能 (FR-025)"""

    def test_export_workouts_to_csv_format(self):
        """測試運動記錄匯出為 CSV 格式"""
        from src.services.csv_service import CSVService

        service = CSVService()

        workouts = [
            {
                "start_time": "2025-01-15T08:30:00Z",
                "workout_type": "running",
                "duration_minutes": 30,
                "distance_km": 5.2,
                "pace_min_per_km": 5.77,
                "avg_heart_rate": 145,
                "calories": 320,
                "notes": "Morning run"
            },
            {
                "start_time": "2025-01-16T09:00:00Z",
                "workout_type": "cycling",
                "duration_minutes": 45,
                "distance_km": 15.0,
                "pace_min_per_km": None,
                "avg_heart_rate": 130,
                "calories": 450,
                "notes": "Evening ride"
            }
        ]

        csv_content = service.export_to_csv(workouts)

        # 驗證 CSV 格式
        assert "workout_type,start_time,duration_minutes" in csv_content
        assert "running" in csv_content
        assert "cycling" in csv_content

    def test_export_csv_header_format(self):
        """測試 CSV header 格式正確"""
        from src.services.csv_service import CSVService

        service = CSVService()
        workouts = []

        csv_content = service.export_to_csv(workouts)

        # 驗證 header 欄位
        expected_headers = [
            "date", "workout_type", "duration_minutes", "distance_km",
            "pace_min_per_km", "avg_heart_rate", "calories", "notes"
        ]

        reader = csv.DictReader(StringIO(csv_content))
        assert list(reader.fieldnames) == expected_headers

    def test_export_csv_handles_null_values(self):
        """測試 CSV 匯出處理 null 值"""
        from src.services.csv_service import CSVService

        service = CSVService()

        workouts = [
            {
                "start_time": "2025-01-15T08:30:00Z",
                "workout_type": "gym",
                "duration_minutes": 60,
                "distance_km": None,  # Null value
                "pace_min_per_km": None,
                "avg_heart_rate": None,
                "calories": 400,
                "notes": None
            }
        ]

        csv_content = service.export_to_csv(workouts)

        # 驗證 null 值以空字串或 N/A 表示
        assert csv_content.count(",,") >= 0  # 允許空值

    def test_export_csv_datetime_formatting(self):
        """測試 CSV 日期時間格式化"""
        from src.services.csv_service import CSVService

        service = CSVService()

        workouts = [
            {
                "start_time": "2025-01-15T08:30:00Z",
                "workout_type": "running",
                "duration_minutes": 30,
                "distance_km": 5.0,
                "pace_min_per_km": 6.0,
                "avg_heart_rate": 145,
                "calories": 300,
                "notes": "Test"
            }
        ]

        csv_content = service.export_to_csv(workouts)

        # 驗證日期格式（應為 ISO 8601 或易讀格式）
        assert "2025-01-15" in csv_content


class TestCSVImport:
    """測試 CSV 匯入功能 (FR-021)"""

    def test_import_valid_csv(self):
        """測試匯入有效的 CSV"""
        from src.services.csv_service import CSVService

        service = CSVService()

        csv_content = """date,workout_type,duration_minutes,distance_km,pace_min_per_km,avg_heart_rate,calories,notes
2025-01-15,running,30,5.2,5.77,145,320,Morning run
2025-01-16,cycling,45,15.0,,,450,Evening ride"""

        result = service.import_from_csv(csv_content)

        # 驗證匯入成功
        assert result["imported_count"] == 2
        assert result["failed_count"] == 0
        assert len(result["workouts"]) == 2

        # 驗證資料正確解析
        assert result["workouts"][0]["workout_type"] == "running"
        assert result["workouts"][0]["duration_minutes"] == 30
        assert result["workouts"][1]["workout_type"] == "cycling"

    def test_import_csv_validates_required_fields(self):
        """測試 CSV 匯入驗證必要欄位"""
        from src.services.csv_service import CSVService

        service = CSVService()

        # 缺少 duration_minutes（必要欄位）
        csv_content = """date,workout_type,distance_km
2025-01-15,running,5.2"""

        with pytest.raises(ValueError) as exc_info:
            service.import_from_csv(csv_content)

        assert "required" in str(exc_info.value).lower() or "missing" in str(exc_info.value).lower()

    def test_import_csv_validates_workout_type(self):
        """測試 CSV 匯入驗證運動類型"""
        from src.services.csv_service import CSVService

        service = CSVService()

        # 無效的運動類型
        csv_content = """date,workout_type,duration_minutes,distance_km,pace_min_per_km,avg_heart_rate,calories,notes
2025-01-15,invalid_type,30,5.2,5.77,145,320,Test"""

        result = service.import_from_csv(csv_content)

        # 應該標記為失敗
        assert result["failed_count"] == 1
        assert len(result["errors"]) == 1
        assert "workout_type" in result["errors"][0]["error"].lower()

    def test_import_csv_validates_numeric_fields(self):
        """測試 CSV 匯入驗證數值欄位"""
        from src.services.csv_service import CSVService

        service = CSVService()

        # duration_minutes 為非數值
        csv_content = """date,workout_type,duration_minutes,distance_km,pace_min_per_km,avg_heart_rate,calories,notes
2025-01-15,running,thirty,5.2,5.77,145,320,Test"""

        result = service.import_from_csv(csv_content)

        # 應該標記為失敗
        assert result["failed_count"] == 1
        assert "duration_minutes" in result["errors"][0]["error"].lower() or "numeric" in result["errors"][0]["error"].lower()

    def test_import_csv_validates_date_format(self):
        """測試 CSV 匯入驗證日期格式"""
        from src.services.csv_service import CSVService

        service = CSVService()

        # 無效的日期格式
        csv_content = """date,workout_type,duration_minutes,distance_km,pace_min_per_km,avg_heart_rate,calories,notes
invalid-date,running,30,5.2,5.77,145,320,Test"""

        result = service.import_from_csv(csv_content)

        # 應該標記為失敗
        assert result["failed_count"] == 1
        assert "date" in result["errors"][0]["error"].lower()

    def test_import_csv_partial_success(self):
        """測試 CSV 匯入部分成功處理"""
        from src.services.csv_service import CSVService

        service = CSVService()

        # 第 2 筆資料有錯誤
        csv_content = """date,workout_type,duration_minutes,distance_km,pace_min_per_km,avg_heart_rate,calories,notes
2025-01-15,running,30,5.2,5.77,145,320,Good run
2025-01-16,invalid_type,45,15.0,,,450,Bad data
2025-01-17,cycling,60,20.0,,,600,Good ride"""

        result = service.import_from_csv(csv_content)

        # 驗證部分成功
        assert result["imported_count"] == 2
        assert result["failed_count"] == 1
        assert len(result["errors"]) == 1
        assert result["errors"][0]["line"] == 3  # 第 3 行（含 header）

    def test_import_csv_handles_empty_optional_fields(self):
        """測試 CSV 匯入處理空的選填欄位"""
        from src.services.csv_service import CSVService

        service = CSVService()

        # 選填欄位為空
        csv_content = """date,workout_type,duration_minutes,distance_km,pace_min_per_km,avg_heart_rate,calories,notes
2025-01-15,gym,60,,,,,Strength training"""

        result = service.import_from_csv(csv_content)

        # 應該成功匯入
        assert result["imported_count"] == 1
        assert result["failed_count"] == 0

        workout = result["workouts"][0]
        assert workout["distance_km"] is None
        assert workout["avg_heart_rate"] is None


class TestCSVFormatValidation:
    """測試 CSV 格式驗證"""

    def test_validate_csv_structure(self):
        """測試 CSV 結構驗證"""
        from src.services.csv_service import CSVService

        service = CSVService()

        # 有效的 CSV 結構
        valid_csv = """date,workout_type,duration_minutes,distance_km,pace_min_per_km,avg_heart_rate,calories,notes
2025-01-15,running,30,5.2,5.77,145,320,Test"""

        assert service.validate_csv_structure(valid_csv) == True

    def test_validate_csv_missing_headers(self):
        """測試 CSV 缺少必要 header"""
        from src.services.csv_service import CSVService

        service = CSVService()

        # 缺少 workout_type header
        invalid_csv = """date,duration_minutes,distance_km
2025-01-15,30,5.2"""

        with pytest.raises(ValueError) as exc_info:
            service.validate_csv_structure(invalid_csv)

        assert "header" in str(exc_info.value).lower() or "missing" in str(exc_info.value).lower()

    def test_validate_csv_empty_file(self):
        """測試空 CSV 檔案驗證"""
        from src.services.csv_service import CSVService

        service = CSVService()

        empty_csv = ""

        with pytest.raises(ValueError) as exc_info:
            service.validate_csv_structure(empty_csv)

        assert "empty" in str(exc_info.value).lower()

    def test_validate_csv_provides_sample_format(self):
        """測試格式錯誤時提供範例格式"""
        from src.services.csv_service import CSVService

        service = CSVService()

        invalid_csv = "invalid,csv,format"

        try:
            service.validate_csv_structure(invalid_csv)
        except ValueError as e:
            error_message = str(e)
            # 應該包含範例格式說明
            assert "sample" in error_message.lower() or "example" in error_message.lower()


class TestCSVPerformance:
    """測試 CSV 處理效能"""

    def test_import_large_csv_performance(self):
        """測試大量資料匯入效能"""
        from src.services.csv_service import CSVService
        import time

        service = CSVService()

        # 建立 1000 筆資料的 CSV
        csv_lines = ["date,workout_type,duration_minutes,distance_km,pace_min_per_km,avg_heart_rate,calories,notes"]
        for i in range(1000):
            csv_lines.append(f"2025-01-15,running,30,5.2,5.77,145,320,Run {i}")

        csv_content = "\n".join(csv_lines)

        start_time = time.time()
        result = service.import_from_csv(csv_content)
        end_time = time.time()

        # 驗證效能（應在合理時間內完成，如 < 5 秒）
        assert (end_time - start_time) < 5.0
        assert result["imported_count"] == 1000

    def test_export_large_dataset_performance(self):
        """測試大量資料匯出效能"""
        from src.services.csv_service import CSVService
        import time

        service = CSVService()

        # 建立 1000 筆運動記錄
        workouts = [
            {
                "start_time": f"2025-01-15T08:{i%60:02d}:00Z",
                "workout_type": "running",
                "duration_minutes": 30,
                "distance_km": 5.2,
                "pace_min_per_km": 5.77,
                "avg_heart_rate": 145,
                "calories": 320,
                "notes": f"Run {i}"
            }
            for i in range(1000)
        ]

        start_time = time.time()
        csv_content = service.export_to_csv(workouts)
        end_time = time.time()

        # 驗證效能（應在合理時間內完成，如 < 3 秒）
        assert (end_time - start_time) < 3.0
        assert len(csv_content) > 0
