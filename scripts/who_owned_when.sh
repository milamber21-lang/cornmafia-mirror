#!/usr/bin/env bash
set -euo pipefail

# Requirements: curl, jq, date
# Env: BF_KEY (Blockfrost mainnet key, starts with "mainnet")

if [[ -z "${BF_KEY:-}" ]]; then
  echo "ERROR: Please export BF_KEY=your_blockfrost_mainnet_key" >&2
  exit 1
fi

usage() {
  echo "Usage: $0 --in /path/input.csv --out /path/output.csv"
  echo "Input CSV header: policy_id,asset_unit_hex,timestamp_utc"
  echo " - policy_id: 56-char hex policy"
  echo " - asset_unit_hex: 56 + (<=64) hex (policy || asset_name_hex)"
  echo " - timestamp_utc: ISO8601 (e.g. 2024-06-01T12:00:00Z) or UNIX seconds"
}

IN=""
OUT=""
while [[ $# -gt 0 ]]; do
  case "$1" in
    --in)  IN="$2"; shift 2;;
    --out) OUT="$2"; shift 2;;
    -h|--help) usage; exit 0;;
    *) echo "Unknown arg: $1"; usage; exit 1;;
  esac
done

[[ -f "$IN" ]] || { echo "ERROR: input not found: $IN" >&2; exit 1; }
[[ -n "${OUT}" ]] || { echo "ERROR: --out required" >&2; exit 1; }

API="https://cardano-mainnet.blockfrost.io/api/v0"
HDR=(-H "project_id: $BF_KEY" -H "Accept: application/json")

echo "policy_id,asset_unit_hex,timestamp_utc,unix_time,tx_hash,address,stake_address,status" > "$OUT"

# Convert a UTC timestamp (ISO8601 or UNIX) -> UNIX seconds
to_unix() {
  local t="$1"
  # If it's already UNIX seconds, just return it
  if [[ "$t" =~ ^[0-9]+$ ]]; then
    echo "$t"
    return 0
  fi

  # Normalize common natural-language variants
  local norm="$t"
  norm="${norm//,}"                # drop commas
  norm="${norm// at / }"           # handle " at "
  norm="${norm// AT / }"           # just in case
  norm="${norm//At / }"

  # Let GNU date parse it in UTC
  date -u -d "$norm" +%s 2>/dev/null || { echo ""; return 1; }
}

# Find the last tx at or before cutoff time for the asset
find_tx_before() {
  local asset="$1" cutoff="$2"
  local page=1 last_tx=""
  while :; do
    local url="$API/assets/$asset/transactions?order=asc&count=100&page=$page"
    local js
    js=$(curl -sS "${HDR[@]}" "$url") || return 1

    # empty array => break
    if [[ "$(jq 'length' <<<"$js")" == "0" ]]; then
      break
    fi

    # iterate ascending; keep last with block_time <= cutoff
    local n i
    n=$(jq 'length' <<<"$js")
    for ((i=0; i<n; i++)); do
      local bt tx
      bt=$(jq -r ".[$i].block_time" <<<"$js")
      tx=$(jq -r ".[$i].tx_hash" <<<"$js")
      if [[ "$bt" -le "$cutoff" ]]; then
        last_tx="$tx"
      else
        # We've passed the cutoff; return what we have
        if [[ -n "$last_tx" ]]; then
          echo "$last_tx"
        fi
        return 0
      fi
    done

    # If last page might still be before cutoff, continue
    ((page++))
    # Guard on very deep paging (unlikely but safe)
    if (( page > 200 )); then break; fi
  done

  [[ -n "$last_tx" ]] && echo "$last_tx"
  return 0
}

# From a tx hash, get the output address that *receives* the asset (unit) with positive qty
tx_owner_address() {
  local tx="$1" unit="$2"
  local utxos js
  js=$(curl -sS "${HDR[@]}" "$API/txs/$tx/utxos") || return 1
  # Search outputs for the one containing the asset with qty > 0
  jq -r --arg U "$unit" '
    .outputs[] as $o
    | ($o.amount[] | select(.unit==$U and (.quantity|tonumber)>0)) as $hit
    | $o.address
  ' <<<"$js" | head -n1
}

# Get stake key from address
stake_from_address() {
  local addr="$1"
  local js
  js=$(curl -sS "${HDR[@]}" "$API/addresses/$addr") || return 1
  jq -r '.stake_address // empty' <<<"$js"
}

# read CSV (skip header)
tail -n +2 "$IN" | while IFS=, read -r POLICY ASSET TS; do
  POLICY="${POLICY//\"/}"
  ASSET="${ASSET//\"/}"
  TS="${TS//\"/}"

  # Skip empty lines
  [[ -z "$POLICY$ASSET$TS" ]] && continue

  # Parse time
  UNIX="$(to_unix "$TS" || true)"
  if [[ -z "$UNIX" ]]; then
    echo "$POLICY,$ASSET,$TS,,,, ,invalid_time" >> "$OUT"
    continue
  fi

  # Find tx <= time
  TX="$(find_tx_before "$ASSET" "$UNIX" || true)"
  if [[ -z "$TX" ]]; then
    # If no tx before cutoff, either not minted yet or minted after that time
    echo "$POLICY,$ASSET,$TS,$UNIX,,, ,no_tx_before_time" >> "$OUT"
    continue
  fi

  # Find receiving address for that tx
  OWNER_ADDR="$(tx_owner_address "$TX" "$ASSET" || true)"
  if [[ -z "$OWNER_ADDR" ]]; then
    echo "$POLICY,$ASSET,$TS,$UNIX,$TX,,,could_not_determine_owner_output" >> "$OUT"
    continue
  fi

  # Stake key
  STAKE="$(stake_from_address "$OWNER_ADDR" || true)"
  if [[ -z "$STAKE" ]]; then
    # Could be enterprise address (no stake key) or script
    STATUS="no_stake_key_or_script"
  else
    STATUS="ok"
  fi

  echo "$POLICY,$ASSET,$TS,$UNIX,$TX,$OWNER_ADDR,$STAKE,$STATUS" >> "$OUT"
done

echo "Done. Wrote: $OUT"
