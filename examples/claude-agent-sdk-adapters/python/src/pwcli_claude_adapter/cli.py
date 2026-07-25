"""One-shot read-only CLI for the governed Python reference adapter."""

from __future__ import annotations

import argparse
import asyncio
import json
from pathlib import Path

from .adapter import (
    AdapterFailed,
    PolicyDenied,
    load_control_plane_config,
    run_read_only_review,
)

PACKAGED_FIXTURES = Path(__file__).resolve().parent / "fixtures"
SOURCE_FIXTURES = Path(__file__).resolve().parents[3] / "fixtures"
DEFAULT_FIXTURES = PACKAGED_FIXTURES if PACKAGED_FIXTURES.is_dir() else SOURCE_FIXTURES


async def _run(args: argparse.Namespace) -> int:
    try:
        result, receipt = await run_read_only_review(
            args.prompt,
            load_control_plane_config(
                Path(args.contracts_dir),
                Path(args.cwd),
                max_turns=args.max_turns,
            ),
        )
    except (PolicyDenied, AdapterFailed) as error:
        print(
            json.dumps(
                {
                    "status": error.receipt.get("status") if error.receipt else "denied",
                    "errorCode": str(error),
                    "receipt": error.receipt,
                },
                indent=2,
            )
        )
        return 2
    print(result)
    print(json.dumps({"receipt": receipt}, indent=2))
    return 0


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Run a governed read-only repository review."
    )
    parser.add_argument("prompt")
    parser.add_argument("--cwd", default=".")
    parser.add_argument(
        "--contracts-dir",
        default=str(DEFAULT_FIXTURES),
    )
    parser.add_argument("--max-turns", type=int, default=8)
    raise SystemExit(asyncio.run(_run(parser.parse_args())))


if __name__ == "__main__":
    main()
