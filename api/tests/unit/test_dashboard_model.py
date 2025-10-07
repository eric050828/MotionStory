"""
T029: Dashboard Model 驗證測試
測試儀表板資料模型的驗證規則
"""

import pytest
from pydantic import ValidationError

from api.src.models.dashboard import (
    DashboardCreate,
    DashboardUpdate,
    Widget,
    WidgetPosition,
    WidgetSize,
    WidgetConfig,
)


class TestWidgetPosition:
    """測試 Widget 位置模型"""

    def test_valid_position(self):
        """測試有效的 Widget 位置"""
        position = WidgetPosition(x=0, y=0)

        assert position.x == 0
        assert position.y == 0

    def test_x_range_validation(self):
        """測試 X 座標範圍驗證 (0-11)"""
        # 有效範圍
        for x in [0, 5, 11]:
            position = WidgetPosition(x=x, y=0)
            assert position.x == x

        # 無效範圍 (太小)
        with pytest.raises(ValidationError):
            WidgetPosition(x=-1, y=0)

        # 無效範圍 (太大)
        with pytest.raises(ValidationError):
            WidgetPosition(x=12, y=0)

    def test_y_range_validation(self):
        """測試 Y 座標範圍驗證 (>= 0)"""
        # 有效範圍
        for y in [0, 5, 100]:
            position = WidgetPosition(x=0, y=y)
            assert position.y == y

        # 無效範圍
        with pytest.raises(ValidationError):
            WidgetPosition(x=0, y=-1)


class TestWidgetSize:
    """測試 Widget 大小模型"""

    def test_valid_size(self):
        """測試有效的 Widget 大小"""
        size = WidgetSize(width=4, height=2)

        assert size.width == 4
        assert size.height == 2

    def test_width_range_validation(self):
        """測試寬度範圍驗證 (1-12)"""
        # 有效範圍
        for width in [1, 6, 12]:
            size = WidgetSize(width=width, height=2)
            assert size.width == width

        # 無效範圍 (太小)
        with pytest.raises(ValidationError):
            WidgetSize(width=0, height=2)

        # 無效範圍 (太大)
        with pytest.raises(ValidationError):
            WidgetSize(width=13, height=2)

    def test_height_range_validation(self):
        """測試高度範圍驗證 (1-8)"""
        # 有效範圍
        for height in [1, 4, 8]:
            size = WidgetSize(width=4, height=height)
            assert size.height == height

        # 無效範圍 (太小)
        with pytest.raises(ValidationError):
            WidgetSize(width=4, height=0)

        # 無效範圍 (太大)
        with pytest.raises(ValidationError):
            WidgetSize(width=4, height=9)


class TestWidgetConfig:
    """測試 Widget 配置模型"""

    def test_default_config(self):
        """測試 Widget 配置預設值"""
        config = WidgetConfig()

        assert config.time_range == "30d"
        assert config.workout_types is None
        assert config.show_trend is True
        assert config.color_scheme == "auto"

    def test_valid_time_ranges(self):
        """測試有效的時間範圍"""
        valid_ranges = ["7d", "30d", "90d", "1y", "all"]

        for time_range in valid_ranges:
            config = WidgetConfig(time_range=time_range)
            assert config.time_range == time_range

    def test_invalid_time_range(self):
        """測試無效的時間範圍"""
        with pytest.raises(ValidationError) as exc_info:
            WidgetConfig(time_range="6m")  # 不在支援列表中

        errors = exc_info.value.errors()
        assert any(error["loc"] == ("time_range",) for error in errors)

    def test_custom_workout_types_filter(self):
        """測試自訂運動類型篩選"""
        config = WidgetConfig(
            workout_types=["running", "cycling"]
        )

        assert config.workout_types == ["running", "cycling"]


class TestWidget:
    """測試 Widget 模型"""

    def test_valid_widget(self):
        """測試有效的 Widget"""
        widget = Widget(
            id="w1",
            type="streak_counter",
            position=WidgetPosition(x=0, y=0),
            size=WidgetSize(width=2, height=1),
        )

        assert widget.id == "w1"
        assert widget.type == "streak_counter"
        assert widget.position.x == 0
        assert widget.size.width == 2

    def test_valid_widget_types(self):
        """測試有效的 Widget 類型"""
        valid_types = [
            "streak_counter",
            "weekly_stats",
            "monthly_distance",
            "heart_rate_zone",
            "workout_calendar",
            "achievement_showcase",
            "pace_chart",
            "custom_metric",
        ]

        for widget_type in valid_types:
            widget = Widget(
                id="w1",
                type=widget_type,
                position=WidgetPosition(x=0, y=0),
                size=WidgetSize(width=2, height=1),
            )
            assert widget.type == widget_type

    def test_invalid_widget_type(self):
        """測試無效的 Widget 類型"""
        with pytest.raises(ValidationError) as exc_info:
            Widget(
                id="w1",
                type="unknown_widget",  # 不在支援列表中
                position=WidgetPosition(x=0, y=0),
                size=WidgetSize(width=2, height=1),
            )

        errors = exc_info.value.errors()
        assert any(error["loc"] == ("type",) for error in errors)

    def test_widget_with_custom_config(self):
        """測試 Widget 含自訂配置"""
        widget = Widget(
            id="w1",
            type="pace_chart",
            position=WidgetPosition(x=0, y=0),
            size=WidgetSize(width=4, height=2),
            config=WidgetConfig(
                time_range="90d",
                workout_types=["running"],
                show_trend=True,
            ),
        )

        assert widget.config.time_range == "90d"
        assert widget.config.workout_types == ["running"]
        assert widget.config.show_trend is True


class TestDashboardCreate:
    """測試 DashboardCreate 模型驗證"""

    def test_valid_dashboard_create(self):
        """測試有效的儀表板建立"""
        dashboard_data = {
            "name": "我的訓練儀表板",
            "widgets": [
                Widget(
                    id="w1",
                    type="streak_counter",
                    position=WidgetPosition(x=0, y=0),
                    size=WidgetSize(width=2, height=1),
                ),
            ],
        }

        dashboard = DashboardCreate(**dashboard_data)

        assert dashboard.name == "我的訓練儀表板"
        assert len(dashboard.widgets) == 1
        assert dashboard.is_default is False

    def test_dashboard_name_validation(self):
        """測試儀表板名稱驗證"""
        # 名稱不可為空
        with pytest.raises(ValidationError):
            DashboardCreate(name="", widgets=[])

        # 名稱最大長度 50 字元
        with pytest.raises(ValidationError):
            DashboardCreate(name="x" * 51, widgets=[])

    def test_widget_count_limit(self):
        """測試 Widget 數量限制 (最多 20 個)"""
        # 20 個 Widgets (有效)
        widgets = [
            Widget(
                id=f"w{i}",
                type="streak_counter",
                position=WidgetPosition(x=0, y=i),
                size=WidgetSize(width=2, height=1),
            )
            for i in range(20)
        ]

        dashboard = DashboardCreate(name="測試儀表板", widgets=widgets)
        assert len(dashboard.widgets) == 20

        # 21 個 Widgets (無效)
        widgets_too_many = [
            Widget(
                id=f"w{i}",
                type="streak_counter",
                position=WidgetPosition(x=0, y=i),
                size=WidgetSize(width=2, height=1),
            )
            for i in range(21)
        ]

        with pytest.raises(ValidationError) as exc_info:
            DashboardCreate(name="測試儀表板", widgets=widgets_too_many)

        errors = exc_info.value.errors()
        assert any(error["loc"] == ("widgets",) for error in errors)

    def test_empty_widgets_allowed(self):
        """測試允許空的 Widgets 列表"""
        dashboard = DashboardCreate(name="空儀表板", widgets=[])

        assert len(dashboard.widgets) == 0

    def test_is_default_flag(self):
        """測試預設儀表板標記"""
        dashboard_default = DashboardCreate(
            name="預設儀表板",
            widgets=[],
            is_default=True,
        )

        assert dashboard_default.is_default is True


class TestDashboardUpdate:
    """測試 DashboardUpdate 模型驗證"""

    def test_partial_update(self):
        """測試部分欄位更新"""
        update_data = {
            "name": "新名稱",
        }

        update = DashboardUpdate(**update_data)

        assert update.name == "新名稱"
        assert update.widgets is None
        assert update.is_default is None

    def test_update_widgets(self):
        """測試更新 Widgets 列表"""
        new_widgets = [
            Widget(
                id="w1",
                type="weekly_stats",
                position=WidgetPosition(x=0, y=0),
                size=WidgetSize(width=4, height=2),
            ),
        ]

        update = DashboardUpdate(widgets=new_widgets)

        assert len(update.widgets) == 1
        assert update.widgets[0].type == "weekly_stats"

    def test_update_widget_count_limit(self):
        """測試更新時 Widget 數量限制"""
        # 21 個 Widgets (無效)
        widgets_too_many = [
            Widget(
                id=f"w{i}",
                type="streak_counter",
                position=WidgetPosition(x=0, y=i),
                size=WidgetSize(width=2, height=1),
            )
            for i in range(21)
        ]

        with pytest.raises(ValidationError) as exc_info:
            DashboardUpdate(widgets=widgets_too_many)

        errors = exc_info.value.errors()
        assert any(error["loc"] == ("widgets",) for error in errors)

    def test_update_name_validation(self):
        """測試更新名稱時的驗證"""
        # 名稱不可為空
        with pytest.raises(ValidationError):
            DashboardUpdate(name="")

        # 名稱最大長度 50 字元
        with pytest.raises(ValidationError):
            DashboardUpdate(name="x" * 51)
