import json
import os

# Windows workaround: the gltest direct loader maps a temp file onto stdin (fd 0)
# and then tries to unlink it while it is still open, which Windows forbids
# (WinError 32). Swallow that specific error so the in-memory test VM can run.
# This does not affect contract behavior; it only tolerates a leftover temp file.
_orig_unlink = os.unlink


def _safe_unlink(path, *args, **kwargs):
    try:
        return _orig_unlink(path, *args, **kwargs)
    except PermissionError:
        return None


os.unlink = _safe_unlink

CONTRACT = os.path.join("contracts", "contract.py")


def seed_case(contract, vm, owner, case_id="case_loft", deposit=1000):
    """Create a condition case owned by `owner`."""
    vm.sender = owner
    contract.create_condition_case(
        case_id,
        "Maple Loft short-term rental",
        "apartment",
        "Owner: Dana",
        "User: Refik",
        "one week stay",
        deposit,
        "Normal residential wear is expected; deductions only for new damage beyond ordinary use.",
    )
    return case_id


def seed_entry(contract, vm, owner, case_id="case_loft"):
    """Seal a three-item entry snapshot for the case."""
    vm.sender = owner
    contract.create_entry_snapshot(
        "ent_kitchen_counter", case_id, "kitchen", "counter",
        "Scratch near the sink edge, present at move-in.",
        "cosmetic", "scratch", "high",
    )
    contract.create_entry_snapshot(
        "ent_living_rug", case_id, "living room", "rug",
        "Rug clean and intact at move-in.",
        "none", "none", "high",
    )
    contract.create_entry_snapshot(
        "ent_kitchen_fridge", case_id, "kitchen", "refrigerator",
        "Refrigerator door smooth and undamaged at move-in.",
        "none", "none", "high",
    )
    return case_id


def mock_gate(
    vm,
    gate,
    entry_ids=None,
    exit_ids=None,
    supported=None,
    unsupported=None,
    reason_codes=None,
    confidence=90,
    reason="test",
):
    """Register a deterministic LLM response for the MoveMark adjudication prompt."""
    payload = {
        "gate": gate,
        "matched_entry_evidence_ids": entry_ids or [],
        "matched_exit_evidence_ids": exit_ids or [],
        "supported_issue_ids": supported or [],
        "unsupported_issue_ids": unsupported or [],
        "reason_codes": reason_codes or [],
        "confidence": confidence,
        "reason": reason,
    }
    vm.mock_llm(r".*MoveMark.*", json.dumps(payload))
