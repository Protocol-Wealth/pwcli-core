"""Dependency-aware construction smoke test for the pinned Python SDK."""

from __future__ import annotations

import tempfile
from pathlib import Path
from typing import Any

from pwcli_claude_adapter import AdapterConfig, build_sdk_options


async def noop_hook(*_args: Any) -> dict[str, Any]:
    return {}


with tempfile.TemporaryDirectory(prefix="pwcli-sdk-smoke-") as directory:
    options = build_sdk_options(
        AdapterConfig(cwd=Path.cwd()),
        noop_hook,
        noop_hook,
        {"ANTHROPIC_API_KEY": "synthetic-not-used"},
        directory,
    )
    assert options.permission_mode == "dontAsk"
    assert options.setting_sources == []
    assert options.env["CLAUDE_CONFIG_DIR"] == directory
    assert options.env["CLAUDE_CODE_DISABLE_AUTO_MEMORY"] == "1"
