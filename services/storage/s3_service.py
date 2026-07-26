from __future__ import annotations

import hashlib
import logging
import mimetypes
import os

import boto3
from botocore.exceptions import ClientError

from services.config import Config

logger = logging.getLogger(__name__)


def sha256_of(local_path: str) -> str:
    """Return the hex SHA-256 digest of a local file's raw bytes."""
    digest = hashlib.sha256()
    with open(local_path, "rb") as file_obj:
        for chunk in iter(lambda: file_obj.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def parse_s3_uri(s3_uri: str) -> tuple[str, str]:
    """Split ``s3://bucket/key`` into ``(bucket, key)``."""
    if not s3_uri.startswith("s3://"):
        raise ValueError(f"Expected s3:// URI, got: {s3_uri!r}")
    without_scheme = s3_uri[len("s3://") :]
    bucket, _, key = without_scheme.partition("/")
    if not bucket or not key:
        raise ValueError(f"Invalid s3 URI: {s3_uri!r}")
    return bucket, key


class ScreenshotStore:
    """Content-addressed screenshot upload/presign against AWS S3."""

    def __init__(self) -> None:
        if not Config.s3_bucket:
            raise ValueError("S3_BUCKET is not configured")
        if not Config.aws_region:
            raise ValueError("AWS_REGION is not configured")

        self.bucket = Config.s3_bucket
        self.prefix = Config.s3_prefix
        self.region = Config.aws_region
        self.presign_ttl_seconds = Config.s3_presign_ttl_seconds
        self._client = boto3.client("s3", region_name=self.region)

    def _object_key(self, digest: str, ext: str) -> str:
        normalized_ext = ext if ext.startswith(".") else f".{ext}" if ext else ""
        if self.prefix:
            return f"{self.prefix}/{digest}{normalized_ext}"
        return f"{digest}{normalized_ext}"

    def _exists(self, key: str) -> bool:
        try:
            self._client.head_object(Bucket=self.bucket, Key=key)
            return True
        except ClientError as exc:
            error_code = exc.response.get("Error", {}).get("Code", "")
            if error_code in ("404", "NoSuchKey", "NotFound"):
                return False
            raise

    def upload(self, local_path: str, *, content_type: str | None = None) -> str:
        """
        Upload ``local_path`` under a content-addressed key.

        Returns a durable ``s3://bucket/key`` URI. Skips the PUT when the object
        already exists (same bytes → same key).
        """
        if not os.path.isfile(local_path):
            raise FileNotFoundError(local_path)

        digest = sha256_of(local_path)
        ext = os.path.splitext(local_path)[1].lower() or ".bin"
        key = self._object_key(digest, ext)
        url = f"s3://{self.bucket}/{key}"

        if self._exists(key):
            logger.info("S3 object already present, skipping upload: %s", key)
            return url

        resolved_content_type = content_type or mimetypes.guess_type(local_path)[0] or "application/octet-stream"
        with open(local_path, "rb") as file_obj:
            self._client.put_object(
                Bucket=self.bucket,
                Key=key,
                Body=file_obj,
                ContentType=resolved_content_type,
            )
        logger.info("Uploaded screenshot to %s", url)
        return url

    def presign(self, s3_uri: str, ttl: int | None = None) -> str:
        """Return a temporary HTTPS GET URL for a stored ``s3://`` URI."""
        bucket, key = parse_s3_uri(s3_uri)
        expires = ttl if ttl is not None else self.presign_ttl_seconds
        return self._client.generate_presigned_url(
            ClientMethod="get_object",
            Params={"Bucket": bucket, "Key": key},
            ExpiresIn=expires,
        )
