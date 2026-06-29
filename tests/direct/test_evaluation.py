from conftest import CONTRACT, seed_case, seed_entry, mock_gate


def _setup(direct_vm, direct_deploy, direct_alice, deposit=1000):
    c = direct_deploy(CONTRACT)
    seed_case(c, direct_vm, direct_alice, deposit=deposit)
    seed_entry(c, direct_vm, direct_alice)
    return c


def _exit(c, vm, owner, sid, zone, item, note, severity, issue, certainty):
    vm.sender = owner
    c.create_exit_snapshot(sid, "case_loft", zone, item, note, severity, issue, certainty)


def _claim(c, vm, owner, claim_id, claim_type="new_damage", amount=200,
           explanation="A claim explanation.", outcome="partial_deduction"):
    vm.sender = owner
    c.submit_claim(claim_id, "case_loft", claim_type, "Owner: Dana", "User: Refik",
                   amount, explanation, outcome)


# Scenario 1: claimed damage was already present at entry -> PREEXISTING_ISSUE.
def test_preexisting_damage(direct_vm, direct_deploy, direct_alice):
    c = _setup(direct_vm, direct_deploy, direct_alice)
    _exit(c, direct_vm, direct_alice, "ext_counter", "kitchen", "counter",
          "Scratch near the sink edge.", "cosmetic", "scratch", "high")
    _claim(c, direct_vm, direct_alice, "clm_pre",
           explanation="The counter is scratched; charge the user.")
    # Model overreaches and says supported; the backstop catches the overlap.
    mock_gate(direct_vm, "CLAIM_SUPPORTED", exit_ids=["ext_counter"], confidence=80)
    direct_vm.sender = direct_alice
    c.evaluate_condition_claim("clm_pre")
    e = c.get_evaluation("clm_pre")
    assert e["gateResult"] == "PREEXISTING_ISSUE"
    assert "preexisting_overlap" in e["riskFlags"]
    assert e["proofHash"].startswith("0xMM")
    summary = {v["validator"]: v for v in e["validatorSummary"]}
    assert summary["preexisting_match"]["passed"] is False


# Scenario 2: a genuinely new, well documented dent -> CLAIM_SUPPORTED.
def test_new_damage_supported(direct_vm, direct_deploy, direct_alice):
    c = _setup(direct_vm, direct_deploy, direct_alice)
    _exit(c, direct_vm, direct_alice, "ext_fridge", "kitchen", "refrigerator",
          "A deep new dent on the fridge door, not present at entry.", "major", "dent", "high")
    _claim(c, direct_vm, direct_alice, "clm_new", amount=200,
           explanation="New dent on the refrigerator door.")
    mock_gate(direct_vm, "CLAIM_SUPPORTED", exit_ids=["ext_fridge"], confidence=92)
    direct_vm.sender = direct_alice
    c.evaluate_condition_claim("clm_new")
    e = c.get_evaluation("clm_new")
    assert e["gateResult"] == "CLAIM_SUPPORTED"
    assert e["recommendedDeduction"] == 200
    assert e["matchedExitIds"] == ["ext_fridge"]


# Scenario 3: change is consistent with ordinary use -> NORMAL_WEAR.
def test_normal_wear(direct_vm, direct_deploy, direct_alice):
    c = _setup(direct_vm, direct_deploy, direct_alice)
    _exit(c, direct_vm, direct_alice, "ext_rug", "living room", "rug",
          "Light, even wear on the rug consistent with a week of use.", "minor", "wear", "high")
    _claim(c, direct_vm, direct_alice, "clm_wear", amount=150,
           explanation="The rug looks used.")
    mock_gate(direct_vm, "NORMAL_WEAR", exit_ids=["ext_rug"], confidence=85)
    direct_vm.sender = direct_alice
    c.evaluate_condition_claim("clm_wear")
    e = c.get_evaluation("clm_wear")
    assert e["gateResult"] == "NORMAL_WEAR"
    assert e["recommendedDeduction"] == 0


# Scenario 4: vague, low-certainty exit evidence -> INSUFFICIENT_EVIDENCE.
def test_vague_claim_insufficient(direct_vm, direct_deploy, direct_alice):
    c = _setup(direct_vm, direct_deploy, direct_alice)
    _exit(c, direct_vm, direct_alice, "ext_vague", "bedroom", "wall",
          "Something might be off, hard to tell.", "minor", "other", "low")
    _claim(c, direct_vm, direct_alice, "clm_vague", amount=100,
           explanation="Place feels damaged somehow.")
    # Model overreaches; vague backstop downgrades to insufficient.
    mock_gate(direct_vm, "CLAIM_SUPPORTED", exit_ids=["ext_vague"], confidence=55)
    direct_vm.sender = direct_alice
    c.evaluate_condition_claim("clm_vague")
    e = c.get_evaluation("clm_vague")
    assert e["gateResult"] == "INSUFFICIENT_EVIDENCE"
    assert "vague_evidence" in e["riskFlags"]
    summary = {v["validator"]: v for v in e["validatorSummary"]}
    assert summary["evidence_sufficiency"]["passed"] is False


# Scenario 5: missing-item claim contradicted by the exit snapshot -> CLAIM_UNSUPPORTED.
def test_contradictory_missing_item(direct_vm, direct_deploy, direct_alice):
    c = _setup(direct_vm, direct_deploy, direct_alice)
    _exit(c, direct_vm, direct_alice, "ext_tv", "living room", "television",
          "Television present and working at return.", "none", "none", "high")
    _claim(c, direct_vm, direct_alice, "clm_missing", claim_type="missing_item",
           amount=400, explanation="The television is missing.")
    # Model wrongly says supported; the exit record lists the TV present.
    mock_gate(direct_vm, "CLAIM_SUPPORTED", exit_ids=["ext_tv"], confidence=70)
    direct_vm.sender = direct_alice
    c.evaluate_condition_claim("clm_missing")
    e = c.get_evaluation("clm_missing")
    assert e["gateResult"] == "CLAIM_UNSUPPORTED"
    assert "item_present_at_exit" in e["riskFlags"]
    summary = {v["validator"]: v for v in e["validatorSummary"]}
    assert summary["missing_item_consistency"]["passed"] is False


# Scenario 6: model cites evidence that does not exist -> evidence-consistency fails.
def test_invented_evidence(direct_vm, direct_deploy, direct_alice):
    c = _setup(direct_vm, direct_deploy, direct_alice)
    _exit(c, direct_vm, direct_alice, "ext_door", "entry", "door",
          "A fresh gouge on the door.", "moderate", "scratch", "high")
    _claim(c, direct_vm, direct_alice, "clm_invent", amount=120,
           explanation="Door is gouged.")
    # Model invents an evidence id that was never recorded.
    mock_gate(direct_vm, "CLAIM_SUPPORTED", exit_ids=["ext_ghost_999"], confidence=75)
    direct_vm.sender = direct_alice
    c.evaluate_condition_claim("clm_invent")
    e = c.get_evaluation("clm_invent")
    summary = {v["validator"]: v for v in e["validatorSummary"]}
    assert summary["evidence_consistency"]["passed"] is False
    assert e["matchedExitIds"] == []
    assert "invented_evidence" in e["riskFlags"]
    # Support that rested only on invented evidence is downgraded.
    assert e["gateResult"] == "INSUFFICIENT_EVIDENCE"


# Scenario 7: claimed amount dwarfs a cosmetic issue -> proportionality warns and caps.
def test_disproportionate_settlement(direct_vm, direct_deploy, direct_alice):
    c = _setup(direct_vm, direct_deploy, direct_alice, deposit=1000)
    _exit(c, direct_vm, direct_alice, "ext_smudge", "living room", "wall",
          "A small cosmetic smudge near the switch.", "cosmetic", "stain", "high")
    _claim(c, direct_vm, direct_alice, "clm_disp", amount=900,
           explanation="Wall is stained; charge most of the deposit.")
    mock_gate(direct_vm, "CLAIM_SUPPORTED", exit_ids=["ext_smudge"], confidence=78)
    direct_vm.sender = direct_alice
    c.evaluate_condition_claim("clm_disp")
    e = c.get_evaluation("clm_disp")
    summary = {v["validator"]: v for v in e["validatorSummary"]}
    assert summary["proportionality"]["passed"] is False
    assert "disproportionate_amount" in e["riskFlags"]
    assert e["recommendedDeduction"] < 900


# Scenario 8: a supported claim can be sealed into a settlement receipt.
def test_settlement_ready(direct_vm, direct_deploy, direct_alice):
    c = _setup(direct_vm, direct_deploy, direct_alice, deposit=1000)
    _exit(c, direct_vm, direct_alice, "ext_seat", "vehicle", "seat",
          "A new burn mark on the driver seat.", "major", "break", "high")
    _claim(c, direct_vm, direct_alice, "clm_settle", amount=300,
           explanation="New burn on the seat.")
    mock_gate(direct_vm, "CLAIM_SUPPORTED", exit_ids=["ext_seat"], confidence=90)
    direct_vm.sender = direct_alice
    c.evaluate_condition_claim("clm_settle")
    c.create_settlement_receipt("clm_settle")
    s = c.get_settlement_for_claim("clm_settle")
    assert s["gateResult"] == "CLAIM_SUPPORTED"
    assert s["settledDeduction"] == 300
    assert s["returnedToUser"] == 700
    assert s["depositAmount"] == 1000
    assert s["proofHash"].startswith("0xMM")
    assert s["outcomeLabel"] == "Deduction recommended"


# Insufficient evidence short-circuit when an exit snapshot is missing entirely.
def test_missing_snapshot_short_circuit(direct_vm, direct_deploy, direct_alice):
    c = direct_deploy(CONTRACT)
    seed_case(c, direct_vm, direct_alice)
    seed_entry(c, direct_vm, direct_alice)
    _claim(c, direct_vm, direct_alice, "clm_noexit",
           explanation="Claim with no exit snapshot.")
    # No mock needed; guard short-circuits before any AI call.
    direct_vm.sender = direct_alice
    c.evaluate_condition_claim("clm_noexit")
    e = c.get_evaluation("clm_noexit")
    assert e["gateResult"] == "INSUFFICIENT_EVIDENCE"
    assert "missing_snapshot" in e["reasonCodes"]


def test_double_evaluation_rejected(direct_vm, direct_deploy, direct_alice):
    c = _setup(direct_vm, direct_deploy, direct_alice)
    _exit(c, direct_vm, direct_alice, "ext_d", "kitchen", "sink",
          "New crack in the basin.", "moderate", "crack", "high")
    _claim(c, direct_vm, direct_alice, "clm_dbl", explanation="Cracked sink.")
    mock_gate(direct_vm, "CLAIM_SUPPORTED", exit_ids=["ext_d"])
    direct_vm.sender = direct_alice
    c.evaluate_condition_claim("clm_dbl")
    with direct_vm.expect_revert("already evaluated"):
        c.evaluate_condition_claim("clm_dbl")


def test_settlement_requires_evaluation(direct_vm, direct_deploy, direct_alice):
    c = _setup(direct_vm, direct_deploy, direct_alice)
    _claim(c, direct_vm, direct_alice, "clm_unevaluated", explanation="Not yet ruled.")
    direct_vm.sender = direct_alice
    with direct_vm.expect_revert("not evaluated"):
        c.create_settlement_receipt("clm_unevaluated")
