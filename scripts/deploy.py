"""Deploy MoveMark to Bradbury testnet and seed demo data.

Reads the deployer private key from the workspace .env (GENLAYER_PRIVATE_KEY).
Usage:
    python scripts/deploy.py            # deploy + seed
    python scripts/deploy.py --no-seed  # deploy only
"""
import os
import sys
import json
import re

from genlayer_py import create_client, create_account
from genlayer_py.chains import testnet_bradbury

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
WORKSPACE = os.path.dirname(ROOT)
CONTRACT_PATH = os.path.join(ROOT, "contracts", "contract.py")


def load_key() -> str:
    # Prefer environment, then workspace .env, then project .env.
    key = os.environ.get("GENLAYER_PRIVATE_KEY")
    if key:
        return key.strip().strip('"')
    for env_path in (os.path.join(WORKSPACE, ".env"), os.path.join(ROOT, ".env")):
        if os.path.exists(env_path):
            with open(env_path, "r", encoding="utf-8") as fh:
                for line in fh:
                    m = re.match(r'\s*GENLAYER_PRIVATE_KEY\s*=\s*"?([^"\r\n]+)"?', line)
                    if m:
                        return m.group(1).strip()
    raise SystemExit("GENLAYER_PRIVATE_KEY not found in env or .env")


def main():
    seed = "--no-seed" not in sys.argv
    key = load_key()
    account = create_account(account_private_key=key)
    client = create_client(chain=testnet_bradbury, account=account)
    print("Deployer:", account.address)

    with open(CONTRACT_PATH, "r", encoding="utf-8") as fh:
        code = fh.read()

    print("Deploying MoveMark ...")
    tx_hash = client.deploy_contract(code=code, args=[])
    print("Deploy tx:", tx_hash)
    receipt = client.wait_for_transaction_receipt(
        transaction_hash=tx_hash, status="ACCEPTED", retries=80, interval=5000
    )
    address = receipt.get("data", {}).get("contract_address") or receipt.get("contract_address")
    if not address:
        address = _find_address(receipt)
    print("Contract address:", address)

    out = {"contract": address, "deployTx": tx_hash, "network": "testnet-bradbury"}
    with open(os.path.join(ROOT, "deployment.json"), "w", encoding="utf-8") as fh:
        json.dump(out, fh, indent=2)
    print("Wrote deployment.json")

    if seed and address:
        seed_demo(client, account, address)


def _find_address(receipt):
    # Walk nested dict for a contract_address key.
    stack = [receipt]
    while stack:
        cur = stack.pop()
        if isinstance(cur, dict):
            for k, v in cur.items():
                if k in ("contract_address", "contractAddress") and isinstance(v, str):
                    return v
                stack.append(v)
        elif isinstance(cur, list):
            stack.extend(cur)
    return None


def _write(client, address, method, args):
    print("  write:", method)
    tx = client.write_contract(address=address, function_name=method, args=args)
    client.wait_for_transaction_receipt(transaction_hash=tx, status="ACCEPTED", retries=80, interval=5000)
    return tx


def seed_demo(client, account, address):
    """Seed the mandatory demo: the Apartment Table Deposit Dispute."""
    print("Seeding the Apartment Table Deposit Dispute demo ...")
    _write(client, address, "create_condition_case", [
        "case_apartment_table",
        "Apartment Table Deposit Dispute",
        "apartment",
        "Landlord Property Co",
        "Tenant Riley Quinn",
        "12 month lease",
        1000,
        "Normal residential wear expected; deposit deductions only for new damage beyond ordinary use.",
    ])
    # Entry: the kitchen wood table had a pre-existing edge scratch at move-in.
    _write(client, address, "create_entry_snapshot", [
        "entry_kitchen_table",
        "case_apartment_table",
        "kitchen",
        "wood dining table",
        "Surface scratch along the left edge, noted at move-in.",
        "cosmetic",
        "scratch",
        "high",
    ])
    # Exit: a new dark water stain across the center of the table top.
    _write(client, address, "create_exit_snapshot", [
        "exit_kitchen_table",
        "case_apartment_table",
        "kitchen",
        "wood dining table",
        "Dark water stain across the center of the table top at move-out.",
        "moderate",
        "stain",
        "high",
    ])
    # The deposit-deduction claim for the new stain.
    _write(client, address, "submit_claim", [
        "claim_table_stain",
        "case_apartment_table",
        "new_damage",
        "Landlord Property Co",
        "Tenant Riley Quinn",
        400,
        "Water stain on the dining table top appeared during the tenancy; requesting a deduction to refinish the surface.",
        "repair_cost",
    ])
    print("Seed complete. Claim 'claim_table_stain' is ready to evaluate from the UI.")


if __name__ == "__main__":
    main()
