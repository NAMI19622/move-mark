"""Seed the Apartment Table Deposit Dispute demo onto the deployed contract."""
import os, re, json
from genlayer_py import create_client, create_account
from genlayer_py.chains import testnet_bradbury

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
WORKSPACE = os.path.dirname(ROOT)


def load_key():
    key = os.environ.get("GENLAYER_PRIVATE_KEY")
    if key:
        return key.strip().strip('"')
    with open(os.path.join(WORKSPACE, ".env"), "r", encoding="utf-8") as fh:
        for line in fh:
            m = re.match(r'\s*GENLAYER_PRIVATE_KEY\s*=\s*"?([^"\r\n]+)"?', line)
            if m:
                return m.group(1).strip()


with open(os.path.join(ROOT, "deployment.json")) as fh:
    ADDRESS = json.load(fh)["contract"]

acct = create_account(account_private_key=load_key())
client = create_client(chain=testnet_bradbury, account=acct)


def w(method, args):
    print("write:", method)
    tx = client.write_contract(address=ADDRESS, function_name=method, args=args)
    client.wait_for_transaction_receipt(transaction_hash=tx, status="ACCEPTED", retries=90, interval=5000)
    print("  accepted:", tx)


def has(view, arg):
    try:
        client.read_contract(address=ADDRESS, function_name=view, args=[arg])
        return True
    except Exception:
        return False


if not has("get_case", "case_apartment_table"):
    w("create_condition_case", [
        "case_apartment_table",
        "Apartment Table Deposit Dispute",
        "apartment",
        "Landlord Property Co",
        "Tenant Riley Quinn",
        "12 month lease",
        1000,
        "Normal residential wear expected; deposit deductions only for new damage beyond ordinary use.",
    ])

if not has("get_case", "case_apartment_table") or True:
    # Snapshots and claim are idempotent by id; create_* rejects duplicates, so
    # guard each independently.
    try:
        client.read_contract(address=ADDRESS, function_name="get_claim", args=["claim_table_stain"])
        seeded = True
    except Exception:
        seeded = False
    if not seeded:
        w("create_entry_snapshot", [
            "entry_kitchen_table",
            "case_apartment_table",
            "kitchen",
            "wood dining table",
            "Surface scratch along the left edge, noted at move-in.",
            "cosmetic",
            "scratch",
            "high",
        ])
        w("create_exit_snapshot", [
            "exit_kitchen_table",
            "case_apartment_table",
            "kitchen",
            "wood dining table",
            "Dark water stain across the center of the table top at move-out.",
            "moderate",
            "stain",
            "high",
        ])
        w("submit_claim", [
            "claim_table_stain",
            "case_apartment_table",
            "new_damage",
            "Landlord Property Co",
            "Tenant Riley Quinn",
            400,
            "Water stain on the dining table top appeared during the tenancy; requesting a deduction to refinish the surface.",
            "repair_cost",
        ])

print("Seed complete.")
print(json.dumps(client.read_contract(address=ADDRESS, function_name="get_summary", args=[]), default=str))
