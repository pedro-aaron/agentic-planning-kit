from __future__ import annotations

import contextlib
import io
import json
from pathlib import Path
import subprocess
import sys
import tempfile
import unittest
import uuid


REPOSITORY_ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(REPOSITORY_ROOT / "tools"))
import agentic_planning_v3 as control_plane  # noqa: E402


ZERO_SHA256 = "0" * 64
BASE_COMMIT = "a" * 40


def prefixed(prefix: str) -> str:
    return f"{prefix}_{uuid.uuid4()}"


class FixtureWorkspace:
    def __init__(self, root: Path):
        self.root = root
        self.repo_id = prefixed("repo")
        (self.root / ".gitignore").write_text(
            "!.agentic_planning/\n!.agentic_planning/**/\n!.agentic_planning/**\n.agentic_planning/.local/\n",
            encoding="utf-8",
            newline="\n",
        )
        self.write_json(
            ".agentic_planning/CONTRACT.json",
            {
                "artifact_type": "contract",
                "contract_version": 3,
                "writer_contract": "v3",
                "planning_map_contract": 4,
                "writer_authority": "fixture-integrator",
                "repo_id": self.repo_id,
                "legacy_mode": "read_only",
                "canonical_root": ".agentic_planning",
                "catalog_path": ".agentic_planning/catalog",
                "generated_views": {
                    "index": ".agentic_planning/README.md",
                    "workspace_map": "WORKSPACE_MAP.md",
                },
                "root_project_id": None,
                "managed_entry_points": [],
                "protected_paths": [
                    ".agentic_planning/CONTRACT.json",
                    ".agentic_planning/README.md",
                    ".agentic_planning/catalog/**",
                    ".agentic_planning/reconciliations/**",
                    "WORKSPACE_MAP.md",
                ],
            },
        )

    def write_json(self, relative_path: str, value: object) -> Path:
        path = self.root / relative_path
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_text(
            json.dumps(value, ensure_ascii=False, indent=2, sort_keys=True) + "\n",
            encoding="utf-8",
            newline="\n",
        )
        return path

    def add_entity(
        self,
        *,
        kind: str = "feature",
        slug: str = "example",
        title: str | None = None,
        scopes: list[dict[str, object]] | None = None,
        claims: list[dict[str, object]] | None = None,
        with_manifest: bool = True,
    ) -> tuple[str, str | None, str]:
        prefix = {"feature": "ftr", "analysis": "ana", "project": "prj"}[kind]
        collection = {"feature": "features", "analysis": "analyses", "project": "projects"}[kind]
        entity_id = prefixed(prefix)
        revision_id = prefixed("rev") if with_manifest else None
        base = f".agentic_planning/{collection}/{entity_id}--{slug}"
        self.write_json(
            f"{base}/descriptor.json",
            {
                "artifact_type": "entity_descriptor",
                "schema_version": 3,
                "entity_id": entity_id,
                "kind": kind,
                "slug": slug,
                "title": title or slug.replace("-", " ").title(),
                "created_at": "2026-09-01T12:00:00Z",
                "owner": "fixture-owner",
                "provenance": "native_v3",
                "initial_revision_id": revision_id,
                "source_analysis_ids": [],
            },
        )
        if revision_id:
            self.write_json(
                f"{base}/plans/{revision_id}/manifest.json",
                {
                    "artifact_type": "entity_manifest",
                    "schema_version": 3,
                    "entity_id": entity_id,
                    "revision_id": revision_id,
                    "planning_base": [
                        {"repository_id": self.repo_id, "path": ".", "commit": BASE_COMMIT}
                    ],
                    "map_inputs": [],
                    "write_scopes": scopes or [],
                    "resource_claims": claims or [],
                    "depends_on": [],
                    "integration_owner": "fixture-integrator",
                },
            )
        return entity_id, revision_id, base

    def add_run(
        self,
        entity_id: str,
        revision_id: str,
        base: str,
        *,
        step_id: str | None = None,
        run_id: str | None = None,
        attempt_id: str | None = None,
        status: str = "SUCCEEDED",
    ) -> tuple[str, str]:
        run_id = run_id or prefixed("run")
        attempt_id = attempt_id or prefixed("att")
        step_id = step_id or prefixed("stp")
        self.write_json(
            f"{base}/runs/{run_id}/{attempt_id}.json",
            {
                "artifact_type": "run_receipt",
                "schema_version": 3,
                "run_id": run_id,
                "attempt_id": attempt_id,
                "entity_id": entity_id,
                "revision_id": revision_id,
                "step_id": step_id,
                "status": status,
                "started_at": "2026-09-01T12:01:00Z",
                "finished_at": "2026-09-01T12:02:00Z",
                "validated_against": [
                    {"repository_id": self.repo_id, "commit": BASE_COMMIT}
                ],
                "artifacts": [
                    {
                        "path": f"reports/{run_id}.md",
                        "sha256": ZERO_SHA256,
                        "media_type": "text/markdown",
                    }
                ],
            },
        )
        return run_id, attempt_id

    def add_catalog_item(self, title: str, *, kind: str = "resource") -> str:
        item_id = prefixed("cat")
        self.write_json(
            f".agentic_planning/catalog/{kind}/{item_id}.json",
            {
                "artifact_type": "catalog_item",
                "schema_version": 3,
                "item_id": item_id,
                "kind": kind,
                "title": title,
                "summary": f"Catalog description for {title}",
                "status": "VERIFIED",
                "attributes": [{"key": "fixture", "value": True}],
                "relationships": [],
                "evidence": [
                    {"path": "README.md", "sha256": ZERO_SHA256, "section": "Fixture"}
                ],
            },
        )
        return item_id

    def update_contract(self, **changes: object) -> None:
        path = self.root / ".agentic_planning/CONTRACT.json"
        contract = json.loads(path.read_text(encoding="utf-8"))
        contract.update(changes)
        self.write_json(".agentic_planning/CONTRACT.json", contract)


class ControlPlaneTests(unittest.TestCase):
    def setUp(self) -> None:
        self.temp = tempfile.TemporaryDirectory()
        self.root = Path(self.temp.name)
        self.fixture = FixtureWorkspace(self.root)

    def tearDown(self) -> None:
        self.temp.cleanup()

    def run_cli(self, *arguments: str) -> tuple[int, str, str]:
        stdout = io.StringIO()
        stderr = io.StringIO()
        with contextlib.redirect_stdout(stdout), contextlib.redirect_stderr(stderr):
            result = control_plane.main([*arguments, "--root", str(self.root)])
        return result, stdout.getvalue(), stderr.getvalue()

    def test_same_slug_with_distinct_ids_is_valid(self) -> None:
        first_id, _, _ = self.fixture.add_entity(
            slug="login-social",
            scopes=[{"repository_id": self.fixture.repo_id, "kind": "tree", "path": "apps/web"}],
        )
        second_id, _, _ = self.fixture.add_entity(
            slug="login-social",
            scopes=[{"repository_id": self.fixture.repo_id, "kind": "tree", "path": "apps/api"}],
        )

        code, stdout, stderr = self.run_cli("validate")

        self.assertEqual(0, code, stderr)
        self.assertNotEqual(first_id, second_id)
        self.assertIn("OK validate", stdout)

    def test_retries_preserve_distinct_attempts_in_one_logical_run(self) -> None:
        entity_id, revision_id, base = self.fixture.add_entity()
        assert revision_id is not None
        step_id = prefixed("stp")
        run_id = prefixed("run")
        first = self.fixture.add_run(
            entity_id, revision_id, base, step_id=step_id, run_id=run_id, status="FAILED"
        )
        second = self.fixture.add_run(entity_id, revision_id, base, step_id=step_id, run_id=run_id)

        code, _, stderr = self.run_cli("validate")

        self.assertEqual(0, code, stderr)
        self.assertEqual(first[0], second[0])
        self.assertNotEqual(first[1], second[1])

    def test_duplicate_attempt_id_is_rejected(self) -> None:
        entity_id, revision_id, base = self.fixture.add_entity()
        assert revision_id is not None
        attempt_id = prefixed("att")
        self.fixture.add_run(entity_id, revision_id, base, attempt_id=attempt_id)
        self.fixture.add_run(entity_id, revision_id, base, attempt_id=attempt_id)

        code, _, stderr = self.run_cli("validate")

        self.assertEqual(1, code)
        self.assertIn("DUPLICATE_ID", stderr)

    def test_two_unapplied_deltas_for_one_item_are_rejected(self) -> None:
        entity_id, _, base = self.fixture.add_entity()
        item_id = prefixed("cat")
        candidate = {
            "artifact_type": "catalog_item",
            "schema_version": 3,
            "item_id": item_id,
            "kind": "resource",
            "title": "Contended resource",
            "summary": "Two branches proposed the same stable catalog identity",
            "status": "PLANNED",
            "attributes": [],
            "relationships": [],
            "evidence": [{"path": "README.md", "sha256": ZERO_SHA256, "section": None}],
        }
        for _ in range(2):
            delta_id = prefixed("delta")
            self.fixture.write_json(
                f"{base}/map-deltas/{delta_id}.json",
                {
                    "artifact_type": "map_delta",
                    "schema_version": 3,
                    "delta_id": delta_id,
                    "entity_id": entity_id,
                    "item_id": item_id,
                    "operation": "ADD",
                    "expected_item_hash": None,
                    "candidate": candidate,
                    "evidence": [{"path": "README.md", "sha256": ZERO_SHA256}],
                    "evidence_commit": BASE_COMMIT,
                },
            )

        code, _, stderr = self.run_cli("validate")

        self.assertEqual(1, code)
        self.assertIn("DELTA_FORK", stderr)

    def test_exclusive_resource_claims_conflict(self) -> None:
        claim = {
            "resource_id": "manifest:package-lock.json",
            "mode": "exclusive",
            "isolation_key": None,
            "reason": "single lockfile writer",
        }
        self.fixture.add_entity(
            slug="first",
            scopes=[{"repository_id": self.fixture.repo_id, "kind": "tree", "path": "apps/a"}],
            claims=[claim],
        )
        self.fixture.add_entity(
            slug="second",
            scopes=[{"repository_id": self.fixture.repo_id, "kind": "tree", "path": "apps/b"}],
            claims=[claim],
        )

        code, _, stderr = self.run_cli("claims")

        self.assertEqual(1, code)
        self.assertIn("RESOURCE_BUSY", stderr)

    def test_isolated_claims_with_different_keys_are_compatible(self) -> None:
        for slug in ("first", "second"):
            self.fixture.add_entity(
                slug=slug,
                scopes=[
                    {
                        "repository_id": self.fixture.repo_id,
                        "kind": "tree",
                        "path": f"apps/{slug}",
                    }
                ],
                claims=[
                    {
                        "resource_id": "compose:integration",
                        "mode": "isolated",
                        "isolation_key": slug,
                        "reason": "per-feature namespace",
                    }
                ],
            )

        code, _, stderr = self.run_cli("claims")

        self.assertEqual(0, code, stderr)

    def test_render_is_deterministic_idempotent_and_checkable(self) -> None:
        zeta_id, _, _ = self.fixture.add_entity(slug="zeta", title="Zeta")
        alpha_id, _, _ = self.fixture.add_entity(slug="alpha", title="Alpha")
        self.fixture.add_catalog_item("Zeta resource")
        self.fixture.add_catalog_item("Alpha resource")

        first_code, _, first_error = self.run_cli("render", "--write")
        first_index = (self.root / ".agentic_planning/README.md").read_bytes()
        first_map = (self.root / "WORKSPACE_MAP.md").read_bytes()
        second_code, _, second_error = self.run_cli("render", "--write")
        check_code, check_output, check_error = self.run_cli("render", "--check")

        self.assertEqual(0, first_code, first_error)
        self.assertEqual(0, second_code, second_error)
        self.assertEqual(0, check_code, check_error)
        self.assertEqual(first_index, (self.root / ".agentic_planning/README.md").read_bytes())
        self.assertEqual(first_map, (self.root / "WORKSPACE_MAP.md").read_bytes())
        entity_order = [title for _, title in sorted([(zeta_id, b"Zeta"), (alpha_id, b"Alpha")])]
        self.assertLess(first_index.index(entity_order[0]), first_index.index(entity_order[1]))
        self.assertLess(first_map.index(b"Alpha resource"), first_map.index(b"Zeta resource"))
        self.assertIn("generated views are current", check_output)

    def test_render_check_reports_manual_drift(self) -> None:
        self.fixture.add_entity()
        self.assertEqual(0, self.run_cli("render", "--write")[0])
        (self.root / "WORKSPACE_MAP.md").write_text("manual edit\n", encoding="utf-8")

        code, _, stderr = self.run_cli("render", "--check")

        self.assertEqual(1, code)
        self.assertIn("GENERATED_VIEW_STALE", stderr)

    def test_closed_schema_rejects_unknown_property(self) -> None:
        path = self.root / ".agentic_planning/CONTRACT.json"
        contract = json.loads(path.read_text(encoding="utf-8"))
        contract["surprise"] = True
        self.fixture.write_json(".agentic_planning/CONTRACT.json", contract)

        code, _, stderr = self.run_cli("validate")

        self.assertEqual(1, code)
        self.assertIn("additional property is not allowed", stderr)

    def test_event_compare_and_swap_conflict_is_rejected(self) -> None:
        entity_id, revision_id, base = self.fixture.add_entity()
        first_event = prefixed("evt")
        second_event = prefixed("evt")
        self.fixture.write_json(
            f"{base}/events/{first_event}.json",
            self.event(entity_id, revision_id, first_event, "2026-09-01T13:00:00Z", "PLANNED"),
        )
        invalid = self.event(entity_id, revision_id, second_event, "2026-09-01T13:01:00Z", "ACTIVE")
        invalid["parent_event_id"] = None
        invalid["expected_state"] = "PLANNED"
        self.fixture.write_json(f"{base}/events/{second_event}.json", invalid)

        code, _, stderr = self.run_cli("validate")

        self.assertEqual(1, code)
        self.assertIn("EVENT_CAS_CONFLICT", stderr)

    def test_nonterminal_event_can_preserve_state_and_analysis_can_complete(self) -> None:
        entity_id, revision_id, base = self.fixture.add_entity(kind="analysis")
        created_id = prefixed("evt")
        refined_id = prefixed("evt")
        completed_id = prefixed("evt")
        self.fixture.write_json(
            f"{base}/events/{created_id}.json",
            self.event(entity_id, revision_id, created_id, "2026-09-01T13:00:00Z", "PLANNED"),
        )
        refined = self.event(entity_id, revision_id, refined_id, "2026-09-01T13:01:00Z", "PLANNED")
        refined["event_type"] = "TRANSITIONED"
        refined["parent_event_id"] = created_id
        refined["expected_state"] = "PLANNED"
        self.fixture.write_json(f"{base}/events/{refined_id}.json", refined)
        completed = self.event(entity_id, revision_id, completed_id, "2026-09-01T13:02:00Z", "COMPLETED")
        completed["parent_event_id"] = refined_id
        completed["expected_state"] = "PLANNED"
        self.fixture.write_json(f"{base}/events/{completed_id}.json", completed)

        code, _, stderr = self.run_cli("validate")

        self.assertEqual(0, code, stderr)

    def test_reconciled_event_is_bound_to_successful_receipt(self) -> None:
        entity_id, revision_id, base = self.fixture.add_entity()
        created_id = prefixed("evt")
        reconciled_id = prefixed("evt")
        receipt_id = prefixed("rec")
        self.fixture.write_json(
            f"{base}/events/{created_id}.json",
            self.event(entity_id, revision_id, created_id, "2026-09-01T13:00:00Z", "PLANNED"),
        )
        reconciled = self.event(
            entity_id, revision_id, reconciled_id, "2026-09-01T13:01:00Z", "ACTIVE"
        )
        reconciled["event_type"] = "RECONCILED"
        reconciled["parent_event_id"] = created_id
        reconciled["expected_state"] = "PLANNED"
        reconciled["reconciliation_receipt_id"] = receipt_id
        event_path = self.fixture.write_json(f"{base}/events/{reconciled_id}.json", reconciled)
        event_relative = event_path.relative_to(self.root).as_posix()
        self.fixture.write_json(
            f".agentic_planning/reconciliations/{receipt_id}/receipt.json",
            {
                "artifact_type": "reconciliation_receipt",
                "schema_version": 3,
                "receipt_id": receipt_id,
                "status": "SUCCEEDED",
                "started_at": "2026-09-01T13:00:30Z",
                "finished_at": "2026-09-01T13:01:30Z",
                "validated_against": [
                    {"repository_id": self.fixture.repo_id, "commit": BASE_COMMIT}
                ],
                "parent_receipt_id": None,
                "generator_version": "3.0.0",
                "input_hashes": [],
                "output_hashes": [
                    {"path": event_relative, "sha256": control_plane.sha256_bytes(event_path.read_bytes())}
                ],
                "applied_delta_ids": [],
                "error_codes": [],
            },
        )

        code, _, stderr = self.run_cli("validate")

        self.assertEqual(0, code, stderr)

    def test_managed_entry_point_preserves_human_bytes_and_is_idempotent(self) -> None:
        self.fixture.add_entity()
        self.fixture.update_contract(
            managed_entry_points=["AGENTS.md"],
            protected_paths=[
                ".agentic_planning/CONTRACT.json",
                ".agentic_planning/README.md",
                ".agentic_planning/catalog/**",
                ".agentic_planning/reconciliations/**",
                "WORKSPACE_MAP.md",
                "AGENTS.md",
            ],
        )
        human = b"# Human instructions\n\nKeep this paragraph exactly.\n"
        (self.root / "AGENTS.md").write_bytes(human)

        first_code, _, first_error = self.run_cli("render", "--write")
        first = (self.root / "AGENTS.md").read_bytes()
        second_code, _, second_error = self.run_cli("render", "--write")

        self.assertEqual(0, first_code, first_error)
        self.assertEqual(0, second_code, second_error)
        self.assertTrue(first.startswith(human))
        self.assertEqual(first, (self.root / "AGENTS.md").read_bytes())
        self.assertEqual(1, first.count(control_plane.MANAGED_BEGIN.encode("utf-8")))

    def test_root_project_blueprint_is_a_deterministic_pointer(self) -> None:
        project_id, revision_id, base = self.fixture.add_entity(kind="project", slug="root-project")
        assert revision_id is not None
        source = self.root / base / "plans" / revision_id / "PROJECT_BLUEPRINT.md"
        source.write_text("# Canonical blueprint\n", encoding="utf-8", newline="\n")
        self.fixture.update_contract(
            root_project_id=project_id,
            protected_paths=[
                ".agentic_planning/CONTRACT.json",
                ".agentic_planning/README.md",
                ".agentic_planning/catalog/**",
                ".agentic_planning/reconciliations/**",
                "WORKSPACE_MAP.md",
                "PROJECT_BLUEPRINT.md",
            ],
        )

        code, _, stderr = self.run_cli("render", "--write")
        projection = (self.root / "PROJECT_BLUEPRINT.md").read_text(encoding="utf-8")

        self.assertEqual(0, code, stderr)
        self.assertIn(project_id, projection)
        self.assertIn(revision_id, projection)
        self.assertIn("Canonical source", projection)

    @staticmethod
    def event(
        entity_id: str, revision_id: str | None, event_id: str, occurred_at: str, state: str
    ) -> dict[str, object]:
        return {
            "artifact_type": "event",
            "schema_version": 3,
            "event_id": event_id,
            "entity_id": entity_id,
            "event_type": "CREATED" if state == "PLANNED" else "TRANSITIONED",
            "state": state,
            "occurred_at": occurred_at,
            "actor": "fixture-owner",
            "parent_event_id": None,
            "expected_state": None,
            "revision_id": revision_id,
            "run_id": None,
            "reconciliation_receipt_id": None,
            "reason": None,
        }

    def test_protected_command_rejects_ordinary_global_edit(self) -> None:
        self.fixture.add_entity()
        self.assertEqual(0, self.run_cli("render", "--write")[0])
        self.git("init", "-b", "main")
        self.git("config", "user.email", "fixture@example.com")
        self.git("config", "user.name", "Fixture")
        self.git("add", ".")
        self.git("commit", "-m", "baseline")
        (self.root / "WORKSPACE_MAP.md").write_text("manual\n", encoding="utf-8")

        code, _, stderr = self.run_cli("protected", "--base", "HEAD")

        self.assertEqual(1, code)
        self.assertIn("PROTECTED_PATH_CHANGED", stderr)

    def test_protected_integration_accepts_catalog_and_exact_views(self) -> None:
        entity_id, _, entity_base = self.fixture.add_entity()
        self.assertEqual(0, self.run_cli("render", "--write")[0])
        self.git("init", "-b", "main")
        self.git("config", "user.email", "fixture@example.com")
        self.git("config", "user.name", "Fixture")
        self.git("add", ".")
        self.git("commit", "-m", "baseline")
        base = self.git("rev-parse", "HEAD").stdout.strip()
        item_id = self.fixture.add_catalog_item("Integration-safe resource")
        item_path = f".agentic_planning/catalog/resource/{item_id}.json"
        candidate = json.loads((self.root / item_path).read_text(encoding="utf-8"))
        delta_id = prefixed("delta")
        self.fixture.write_json(
            f"{entity_base}/map-deltas/{delta_id}.json",
            {
                "artifact_type": "map_delta",
                "schema_version": 3,
                "delta_id": delta_id,
                "entity_id": entity_id,
                "item_id": item_id,
                "operation": "ADD",
                "expected_item_hash": None,
                "candidate": candidate,
                "evidence": [{"path": "README.md", "sha256": ZERO_SHA256}],
                "evidence_commit": BASE_COMMIT,
            },
        )
        receipt_id = prefixed("rec")
        self.fixture.write_json(
            f".agentic_planning/reconciliations/{receipt_id}/receipt.json",
            {
                "artifact_type": "reconciliation_receipt",
                "schema_version": 3,
                "receipt_id": receipt_id,
                "status": "SUCCEEDED",
                "started_at": "2026-09-01T14:00:00Z",
                "finished_at": "2026-09-01T14:01:00Z",
                "validated_against": [
                    {"repository_id": self.fixture.repo_id, "commit": BASE_COMMIT}
                ],
                "parent_receipt_id": None,
                "generator_version": "3.0.0",
                "input_hashes": [],
                "output_hashes": [],
                "applied_delta_ids": [delta_id],
                "error_codes": [],
            },
        )
        self.assertEqual(0, self.run_cli("render", "--write")[0])

        code, stdout, stderr = self.run_cli(
            "protected", "--base", base, "--integration"
        )

        self.assertEqual(0, code, stderr)
        self.assertIn("protected changes are reproducible", stdout)

    def test_protected_integration_accepts_schema_valid_receipt(self) -> None:
        self.fixture.add_entity()
        self.assertEqual(0, self.run_cli("render", "--write")[0])
        self.git("init", "-b", "main")
        self.git("config", "user.email", "fixture@example.com")
        self.git("config", "user.name", "Fixture")
        self.git("add", ".")
        self.git("commit", "-m", "baseline")
        base = self.git("rev-parse", "HEAD").stdout.strip()
        receipt_id = prefixed("rec")
        self.fixture.write_json(
            f".agentic_planning/reconciliations/{receipt_id}/receipt.json",
            {
                "artifact_type": "reconciliation_receipt",
                "schema_version": 3,
                "receipt_id": receipt_id,
                "status": "SUCCEEDED",
                "started_at": "2026-09-01T14:00:00Z",
                "finished_at": "2026-09-01T14:01:00Z",
                "validated_against": [
                    {"repository_id": self.fixture.repo_id, "commit": BASE_COMMIT}
                ],
                "parent_receipt_id": None,
                "generator_version": "3.0.0",
                "input_hashes": [],
                "output_hashes": [],
                "applied_delta_ids": [],
                "error_codes": [],
            },
        )

        code, stdout, stderr = self.run_cli("protected", "--base", base, "--integration")

        self.assertEqual(0, code, stderr)
        self.assertIn("protected changes are reproducible", stdout)

    def test_protected_command_enforces_product_write_scope(self) -> None:
        entity_id, revision_id, entity_base = self.fixture.add_entity(
            scopes=[{"repository_id": self.fixture.repo_id, "kind": "tree", "path": "apps/web"}]
        )
        assert revision_id is not None
        self.assertEqual(0, self.run_cli("render", "--write")[0])
        self.git("init", "-b", "main")
        self.git("config", "user.email", "fixture@example.com")
        self.git("config", "user.name", "Fixture")
        self.git("add", ".")
        self.git("commit", "-m", "baseline")
        base = self.git("rev-parse", "HEAD").stdout.strip()
        self.fixture.add_run(entity_id, revision_id, entity_base)
        product = self.root / "apps/web/new.py"
        product.parent.mkdir(parents=True, exist_ok=True)
        product.write_text("VALUE = 1\n", encoding="utf-8", newline="\n")

        code, stdout, stderr = self.run_cli("protected", "--base", base)

        self.assertEqual(0, code, stderr)
        self.assertIn("product scopes are valid", stdout)

    def test_protected_command_rejects_out_of_scope_product_change(self) -> None:
        entity_id, revision_id, entity_base = self.fixture.add_entity(
            scopes=[{"repository_id": self.fixture.repo_id, "kind": "tree", "path": "apps/web"}]
        )
        assert revision_id is not None
        self.assertEqual(0, self.run_cli("render", "--write")[0])
        self.git("init", "-b", "main")
        self.git("config", "user.email", "fixture@example.com")
        self.git("config", "user.name", "Fixture")
        self.git("add", ".")
        self.git("commit", "-m", "baseline")
        base = self.git("rev-parse", "HEAD").stdout.strip()
        self.fixture.add_run(entity_id, revision_id, entity_base)
        product = self.root / "apps/api/escape.py"
        product.parent.mkdir(parents=True, exist_ok=True)
        product.write_text("VALUE = 1\n", encoding="utf-8", newline="\n")

        code, _, stderr = self.run_cli("protected", "--base", base)

        self.assertEqual(1, code)
        self.assertIn("WRITE_SCOPE_VIOLATION", stderr)

    def test_protected_command_rejects_existing_entity_source_edit(self) -> None:
        _, revision_id, entity_base = self.fixture.add_entity()
        assert revision_id is not None
        self.assertEqual(0, self.run_cli("render", "--write")[0])
        self.git("init", "-b", "main")
        self.git("config", "user.email", "fixture@example.com")
        self.git("config", "user.name", "Fixture")
        self.git("add", ".")
        self.git("commit", "-m", "baseline")
        base = self.git("rev-parse", "HEAD").stdout.strip()
        manifest_path = f"{entity_base}/plans/{revision_id}/manifest.json"
        manifest = json.loads((self.root / manifest_path).read_text(encoding="utf-8"))
        manifest["integration_owner"] = "changed-owner"
        self.fixture.write_json(manifest_path, manifest)

        code, _, stderr = self.run_cli("protected", "--base", base)

        self.assertEqual(1, code)
        self.assertIn("IMMUTABLE_SOURCE_CHANGED", stderr)

    def git(self, *arguments: str) -> subprocess.CompletedProcess[str]:
        result = subprocess.run(
            ["git", *arguments],
            cwd=self.root,
            text=True,
            encoding="utf-8",
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            check=False,
        )
        if result.returncode != 0:
            self.fail(f"git {' '.join(arguments)} failed: {result.stderr}")
        return result


if __name__ == "__main__":
    unittest.main()
