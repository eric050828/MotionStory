"""
Cloudflare R2 Storage Integration
S3-compatible API for file storage
"""

import boto3
from botocore.client import Config
from botocore.exceptions import ClientError
from typing import BinaryIO, Optional
from .config import settings


class R2Storage:
    """Cloudflare R2 儲存管理器"""

    def __init__(self):
        self.client = boto3.client(
            's3',
            endpoint_url=f'https://{settings.R2_ACCOUNT_ID}.r2.cloudflarestorage.com',
            aws_access_key_id=settings.R2_ACCESS_KEY,
            aws_secret_access_key=settings.R2_SECRET_KEY,
            config=Config(signature_version='s3v4'),
        )
        self.bucket_name = settings.R2_BUCKET_NAME

    async def upload_file(
        self,
        file_obj: BinaryIO,
        object_key: str,
        content_type: str = 'application/octet-stream',
        metadata: Optional[dict] = None
    ) -> str:
        """
        上傳檔案至 R2

        Args:
            file_obj: 檔案物件
            object_key: R2 object key (e.g., "share-cards/user123/image.png")
            content_type: MIME type
            metadata: Optional metadata

        Returns:
            str: Public URL of uploaded file
        """
        try:
            extra_args = {
                'ContentType': content_type,
            }
            if metadata:
                extra_args['Metadata'] = metadata

            self.client.upload_fileobj(
                file_obj,
                self.bucket_name,
                object_key,
                ExtraArgs=extra_args
            )

            # Return public URL (requires bucket to be public)
            public_url = f"https://r2.motionstory.com/{object_key}"
            return public_url

        except ClientError as e:
            raise RuntimeError(f"R2 upload failed: {e}")

    async def delete_file(self, object_key: str) -> bool:
        """
        刪除 R2 檔案

        Args:
            object_key: R2 object key

        Returns:
            bool: Success status
        """
        try:
            self.client.delete_object(
                Bucket=self.bucket_name,
                Key=object_key
            )
            return True
        except ClientError as e:
            print(f"R2 delete failed: {e}")
            return False


# Global R2 client instance
r2_storage = R2Storage()
