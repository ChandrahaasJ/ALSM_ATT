from __future__ import annotations

import logging
from typing import Any

from falkordb import FalkorDB

from services.config import Config

logger = logging.getLogger(__name__)


class FalkorDBClient:
    """Process-wide FalkorDB connection singleton."""

    _instance: FalkorDBClient | None = None
    _connection: FalkorDB | None = None

    def __new__(cls) -> FalkorDBClient:
        if cls._instance is None:
            cls._instance = super().__new__(cls)
        return cls._instance

    @property
    def connection(self) -> FalkorDB:
        if type(self)._connection is None:
            type(self)._connection = self._connect()
        return type(self)._connection

    @classmethod
    def get(cls) -> FalkorDB:
        """Return the shared FalkorDB client, creating it on first use."""
        return cls().connection

    @classmethod
    def reset(cls) -> None:
        """Drop the cached client (useful in tests)."""
        cls._instance = None
        cls._connection = None

    @staticmethod
    def _connect() -> FalkorDB:
        common_kwargs: dict[str, Any] = {
            "socket_timeout": Config.falkordb_socket_timeout,
            "socket_connect_timeout": Config.falkordb_connect_timeout,
            "health_check_interval": Config.falkordb_health_check_interval,
            "max_connections": Config.falkordb_max_connections,
            "socket_keepalive": True,
        }

        if Config.falkordb_url:
            # Never log the full URL — it may embed credentials.
            logger.info("Connecting to FalkorDB via FALKORDB_URL")
            return FalkorDB.from_url(Config.falkordb_url, **common_kwargs)

        kwargs: dict[str, Any] = {
            "host": Config.falkordb_host,
            "port": Config.falkordb_port,
            **common_kwargs,
        }
        if Config.falkordb_username:
            kwargs["username"] = Config.falkordb_username
        if Config.falkordb_password:
            kwargs["password"] = Config.falkordb_password
        if Config.falkordb_tls:
            kwargs["ssl"] = True
            if Config.falkordb_ca_cert:
                kwargs["ssl_ca_certs"] = Config.falkordb_ca_cert
        logger.info(
            "Connecting to FalkorDB at %s:%s (tls=%s)",
            Config.falkordb_host,
            Config.falkordb_port,
            Config.falkordb_tls,
        )
        return FalkorDB(**kwargs)
