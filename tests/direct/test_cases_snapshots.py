from conftest import CONTRACT, seed_case, seed_entry


def test_create_case_and_read_back(direct_vm, direct_deploy, direct_alice):
    c = direct_deploy(CONTRACT)
    seed_case(c, direct_vm, direct_alice)
    case = c.get_case("case_loft")
    assert case["title"] == "Maple Loft short-term rental"
    assert case["assetType"] == "apartment"
    assert case["depositAmount"] == 1000
    assert case["entrySealed"] is False
    assert case["exitSealed"] is False


def test_duplicate_case_rejected(direct_vm, direct_deploy, direct_alice):
    c = direct_deploy(CONTRACT)
    seed_case(c, direct_vm, direct_alice)
    with direct_vm.expect_revert("already exists"):
        seed_case(c, direct_vm, direct_alice)


def test_snapshot_requires_case(direct_vm, direct_deploy, direct_alice):
    c = direct_deploy(CONTRACT)
    direct_vm.sender = direct_alice
    with direct_vm.expect_revert("case not found"):
        c.create_entry_snapshot(
            "ent_x", "missing_case", "zone", "item",
            "note", "minor", "scratch", "high",
        )


def test_only_owner_can_add_snapshot(direct_vm, direct_deploy, direct_alice, direct_bob):
    c = direct_deploy(CONTRACT)
    seed_case(c, direct_vm, direct_alice)
    direct_vm.sender = direct_bob
    with direct_vm.expect_revert("only case owner"):
        c.create_entry_snapshot(
            "ent_y", "case_loft", "zone", "item",
            "note", "minor", "scratch", "high",
        )


def test_entry_snapshots_seal_case(direct_vm, direct_deploy, direct_alice):
    c = direct_deploy(CONTRACT)
    seed_case(c, direct_vm, direct_alice)
    seed_entry(c, direct_vm, direct_alice)
    case = c.get_case("case_loft")
    assert case["entrySealed"] is True
    assert case["entryCount"] == 3
    page = c.get_snapshots_for_case("case_loft", 0, 20)
    assert page["total"] == 3
    ids = [s["id"] for s in page["items"]]
    assert "ent_kitchen_counter" in ids


def test_submit_claim_and_counts(direct_vm, direct_deploy, direct_alice):
    c = direct_deploy(CONTRACT)
    seed_case(c, direct_vm, direct_alice)
    direct_vm.sender = direct_alice
    c.submit_claim(
        "clm_1", "case_loft", "new_damage", "Owner: Dana", "User: Refik",
        200, "A new dent appeared on the fridge door.", "partial_deduction",
    )
    claim = c.get_claim("clm_1")
    assert claim["claimType"] == "new_damage"
    assert claim["claimedAmount"] == 200
    assert claim["evaluated"] is False
    assert c.get_case("case_loft")["claimCount"] == 1


def test_claim_requires_case(direct_vm, direct_deploy, direct_alice):
    c = direct_deploy(CONTRACT)
    direct_vm.sender = direct_alice
    with direct_vm.expect_revert("case not found"):
        c.submit_claim(
            "clm_x", "missing_case", "new_damage", "A", "B",
            10, "explanation", "mediation",
        )


def test_pagination_and_summary(direct_vm, direct_deploy, direct_alice):
    c = direct_deploy(CONTRACT)
    seed_case(c, direct_vm, direct_alice)
    seed_case(c, direct_vm, direct_alice, case_id="case_van", deposit=500)
    page = c.get_cases_page(0, 20)
    assert page["total"] == 2
    summary = c.get_summary()
    assert summary["cases"] == 2
    assert "CLAIM_SUPPORTED" in summary["gateValues"]
    assert "missing_item" in summary["claimTypes"]
