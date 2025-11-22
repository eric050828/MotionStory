"""
Share Card Generator (T275)
分享卡片生成器 - 5 種模板
"""

from typing import Optional, Dict
from datetime import datetime
from io import BytesIO
import asyncio


class ShareCardTemplate:
    """分享卡片模板枚舉"""
    MINIMAL = "minimal"           # 極簡風格
    ACHIEVEMENT = "achievement"   # 成就慶祝
    WORKOUT = "workout"          # 運動記錄
    STREAK = "streak"            # 連續天數
    ANNUAL = "annual"            # 年度回顧


class ShareCardGenerator:
    """分享卡片生成器"""

    # 模板配置
    TEMPLATES = {
        ShareCardTemplate.MINIMAL: {
            "width": 800,
            "height": 600,
            "bg_color": "#FFFFFF",
            "text_color": "#333333",
            "accent_color": "#4CAF50"
        },
        ShareCardTemplate.ACHIEVEMENT: {
            "width": 800,
            "height": 800,
            "bg_color": "#1A1A2E",
            "text_color": "#FFFFFF",
            "accent_color": "#FFD700"
        },
        ShareCardTemplate.WORKOUT: {
            "width": 800,
            "height": 600,
            "bg_color": "#F5F5F5",
            "text_color": "#212121",
            "accent_color": "#2196F3"
        },
        ShareCardTemplate.STREAK: {
            "width": 800,
            "height": 600,
            "bg_color": "#FF6B35",
            "text_color": "#FFFFFF",
            "accent_color": "#FFEB3B"
        },
        ShareCardTemplate.ANNUAL: {
            "width": 800,
            "height": 1200,
            "bg_color": "#0D1B2A",
            "text_color": "#FFFFFF",
            "accent_color": "#00D9FF"
        }
    }

    def __init__(self, r2_client=None):
        """
        初始化分享卡片生成器

        Args:
            r2_client: Cloudflare R2 客戶端
        """
        self.r2_client = r2_client

    async def generate_card(
        self,
        template: str,
        data: Dict,
        user_name: str,
        avatar_url: Optional[str] = None
    ) -> BytesIO:
        """
        生成分享卡片

        Args:
            template: 模板類型
            data: 卡片資料
            user_name: 使用者名稱
            avatar_url: 使用者頭像 URL

        Returns:
            BytesIO: 圖片二進位資料
        """
        template_config = self.TEMPLATES.get(template, self.TEMPLATES[ShareCardTemplate.MINIMAL])

        # 使用 Pillow 生成圖片
        try:
            from PIL import Image, ImageDraw, ImageFont

            # 建立畫布
            width = template_config["width"]
            height = template_config["height"]
            bg_color = template_config["bg_color"]

            img = Image.new("RGB", (width, height), bg_color)
            draw = ImageDraw.Draw(img)

            # 載入字體（使用系統預設字體或下載的字體）
            try:
                font_large = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", 48)
                font_medium = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf", 32)
                font_small = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf", 24)
            except:
                font_large = ImageFont.load_default()
                font_medium = ImageFont.load_default()
                font_small = ImageFont.load_default()

            text_color = template_config["text_color"]
            accent_color = template_config["accent_color"]

            # 根據模板類型繪製內容
            if template == ShareCardTemplate.MINIMAL:
                await self._draw_minimal_template(draw, data, user_name, width, height, font_large, font_medium, text_color, accent_color)
            elif template == ShareCardTemplate.ACHIEVEMENT:
                await self._draw_achievement_template(draw, data, user_name, width, height, font_large, font_medium, font_small, text_color, accent_color)
            elif template == ShareCardTemplate.WORKOUT:
                await self._draw_workout_template(draw, data, user_name, width, height, font_large, font_medium, font_small, text_color, accent_color)
            elif template == ShareCardTemplate.STREAK:
                await self._draw_streak_template(draw, data, user_name, width, height, font_large, font_medium, text_color, accent_color)
            elif template == ShareCardTemplate.ANNUAL:
                await self._draw_annual_template(draw, data, user_name, width, height, font_large, font_medium, font_small, text_color, accent_color)

            # 添加 MotionStory Logo/浮水印
            draw.text((width - 150, height - 30), "MotionStory", fill=text_color, font=font_small)

            # 轉換為 BytesIO
            buffer = BytesIO()
            img.save(buffer, format="PNG", optimize=True)
            buffer.seek(0)

            return buffer

        except ImportError:
            # Pillow 未安裝時的 fallback
            print("Pillow not installed, returning placeholder")
            return BytesIO(b"")

    async def _draw_minimal_template(self, draw, data, user_name, width, height, font_large, font_medium, text_color, accent_color):
        """繪製極簡模板"""
        title = data.get("title", "運動成就")
        value = data.get("value", "")
        subtitle = data.get("subtitle", "")

        # 標題
        draw.text((50, 100), title, fill=accent_color, font=font_large)

        # 數值
        draw.text((50, 200), str(value), fill=text_color, font=font_large)

        # 副標題
        draw.text((50, 300), subtitle, fill=text_color, font=font_medium)

        # 使用者名稱
        draw.text((50, height - 80), f"by {user_name}", fill=text_color, font=font_medium)

    async def _draw_achievement_template(self, draw, data, user_name, width, height, font_large, font_medium, font_small, text_color, accent_color):
        """繪製成就慶祝模板"""
        title = data.get("title", "成就解鎖")
        achievement_name = data.get("achievement_name", "")
        description = data.get("description", "")
        achieved_at = data.get("achieved_at", "")

        # 慶祝標題
        draw.text((width // 2 - 100, 50), "🎉", font=font_large)
        draw.text((width // 2 - 100, 120), title, fill=accent_color, font=font_large)

        # 成就名稱
        draw.text((50, 250), achievement_name, fill=text_color, font=font_large)

        # 描述
        draw.text((50, 350), description, fill=text_color, font=font_medium)

        # 達成時間
        if achieved_at:
            draw.text((50, height - 120), f"達成於 {achieved_at}", fill=text_color, font=font_small)

        # 使用者
        draw.text((50, height - 60), user_name, fill=text_color, font=font_medium)

    async def _draw_workout_template(self, draw, data, user_name, width, height, font_large, font_medium, font_small, text_color, accent_color):
        """繪製運動記錄模板"""
        workout_type = data.get("workout_type", "運動")
        distance = data.get("distance_km", 0)
        duration = data.get("duration_minutes", 0)
        calories = data.get("calories", 0)
        date = data.get("date", "")

        # 運動類型圖示
        type_icons = {
            "running": "🏃",
            "cycling": "🚴",
            "swimming": "🏊",
            "yoga": "🧘",
            "gym": "💪",
            "hiking": "🥾"
        }
        icon = type_icons.get(workout_type, "🏃")

        draw.text((50, 50), f"{icon} {workout_type.upper()}", fill=accent_color, font=font_large)

        # 統計數據
        y_pos = 150
        if distance:
            draw.text((50, y_pos), f"距離: {distance:.2f} km", fill=text_color, font=font_medium)
            y_pos += 60

        draw.text((50, y_pos), f"時長: {duration} 分鐘", fill=text_color, font=font_medium)
        y_pos += 60

        if calories:
            draw.text((50, y_pos), f"消耗: {calories} 卡路里", fill=text_color, font=font_medium)

        # 日期和使用者
        draw.text((50, height - 80), f"{date} | {user_name}", fill=text_color, font=font_small)

    async def _draw_streak_template(self, draw, data, user_name, width, height, font_large, font_medium, text_color, accent_color):
        """繪製連續天數模板"""
        streak_days = data.get("streak_days", 0)

        # 大數字
        draw.text((width // 2 - 80, 150), str(streak_days), fill=accent_color, font=font_large)

        # 標籤
        draw.text((width // 2 - 60, 250), "天連續運動", fill=text_color, font=font_medium)

        # 鼓勵語
        if streak_days >= 100:
            message = "太棒了！持續努力！"
        elif streak_days >= 30:
            message = "一個月連續！繼續加油！"
        elif streak_days >= 7:
            message = "一週達成！養成習慣中！"
        else:
            message = "每天進步一點點！"

        draw.text((50, 350), message, fill=text_color, font=font_medium)

        # 使用者
        draw.text((50, height - 60), user_name, fill=text_color, font=font_medium)

    async def _draw_annual_template(self, draw, data, user_name, width, height, font_large, font_medium, font_small, text_color, accent_color):
        """繪製年度回顧模板"""
        year = data.get("year", datetime.now().year)
        total_workouts = data.get("total_workouts", 0)
        total_distance = data.get("total_distance_km", 0)
        total_duration = data.get("total_duration_hours", 0)
        total_calories = data.get("total_calories", 0)
        favorite_type = data.get("favorite_workout_type", "")

        # 標題
        draw.text((width // 2 - 120, 50), f"{year} 年度回顧", fill=accent_color, font=font_large)

        # 統計數據
        y_pos = 180
        stats = [
            (f"🏋️ 總運動次數: {total_workouts} 次", y_pos),
            (f"📏 總距離: {total_distance:.1f} 公里", y_pos + 80),
            (f"⏱️ 總時長: {total_duration:.1f} 小時", y_pos + 160),
            (f"🔥 總消耗: {total_calories:,} 卡路里", y_pos + 240),
        ]

        for text, y in stats:
            draw.text((50, y), text, fill=text_color, font=font_medium)

        if favorite_type:
            draw.text((50, y_pos + 340), f"❤️ 最愛運動: {favorite_type}", fill=accent_color, font=font_medium)

        # 使用者
        draw.text((50, height - 60), f"{user_name} 的運動年度回顧", fill=text_color, font=font_small)

    async def upload_to_r2(
        self,
        image_buffer: BytesIO,
        key: str,
        bucket: str = "motionstory-share-cards"
    ) -> Optional[str]:
        """
        上傳圖片到 Cloudflare R2

        Args:
            image_buffer: 圖片二進位資料
            key: 儲存路徑
            bucket: R2 bucket 名稱

        Returns:
            str: 圖片 URL，或 None（上傳失敗）
        """
        if not self.r2_client:
            print("R2 client not configured")
            return None

        try:
            self.r2_client.upload_fileobj(
                image_buffer,
                bucket,
                key,
                ExtraArgs={"ContentType": "image/png"}
            )

            # 返回公開 URL
            return f"https://r2.motionstory.app/{key}"

        except Exception as e:
            print(f"Failed to upload to R2: {e}")
            return None


# 單例實例
share_card_generator = ShareCardGenerator()


# 便捷函數
async def generate_share_card(
    template: str,
    data: Dict,
    user_name: str,
    avatar_url: Optional[str] = None
) -> BytesIO:
    """生成分享卡片的便捷函數"""
    return await share_card_generator.generate_card(template, data, user_name, avatar_url)
