#!/usr/bin/env bash
set -euo pipefail

# Export all assets + basic on-chain metadata for a given policy to CSV.
# Requires: curl, jq, xxd (for hex->utf8 decode). Blockfrost mainnet key.

usage() {
  echo "Usage: $0 --policy <POLICY_ID> [--outdir </path>] [--bf-key <KEY>]"
  echo "Defaults: --outdir /home/lilyserver/docker/cm/data , --bf-key \$BF_KEY"
  exit 1
}

POLICY=""
OUTDIR="/home/lilyserver/docker/cm/data"
BF_KEY="${BF_KEY:-}"
while [[ $# -gt 0 ]]; do
  case "$1" in
    --policy) POLICY="$2"; shift 2 ;;
    --outdir) OUTDIR="$2"; shift 2 ;;
    --bf-key) BF_KEY="$2"; shift 2 ;;
    -h|--help) usage ;;
    *) echo "Unknown arg: $1"; usage ;;
  esac
done

[[ -z "${POLICY}" ]] && { echo "ERROR: --policy is required"; usage; }
[[ -z "${BF_KEY}" ]] && { echo "ERROR: Blockfrost key missing. Pass --bf-key or set BF_KEY env var."; exit 2; }

for cmd in curl jq xxd; do
  command -v "$cmd" >/dev/null 2>&1 || { echo "ERROR: '$cmd' not found. Please install it."; exit 3; }
done

BF="https://cardano-mainnet.blockfrost.io/api/v0"
AUTH=(-H "project_id: ${BF_KEY}")
HDR=(-H "Accept: application/json" -H "Content-Type: application/json")

mkdir -p "${OUTDIR}"
CSV="${OUTDIR}/assets_${POLICY}.csv"
TMP_DIR="$(mktemp -d)"
trap 'rm -rf "$TMP_DIR"' EXIT

# CSV helpers
csv_escape() { sed 's/"/""/g'; }
emit_csv_line() {
  # Print each arg as a CSV-quoted field
  local first=1
  for field in "$@"; do
    [[ $first -eq 1 ]] && first=0 || printf ","
    printf "\"%s\"" "$(printf "%s" "$field" | csv_escape)"
  done
  printf "\n"
}

# Header
emit_csv_line \
  unit policy_id asset_name_hex asset_name_text fingerprint quantity initial_mint_tx_hash \
  metadata_name metadata_image metadata_description raw_onchain_metadata > "$CSV"

echo "Exporting assets under policy: $POLICY"
PAGE=1
TOTAL=0

while :; do
  RESP="$(curl -sS "${BF}/assets/policy/${POLICY}?count=100&page=${PAGE}" "${AUTH[@]}" "${HDR[@]}")"
  COUNT="$(printf %s "$RESP" | jq 'length')"
  [[ "$COUNT" -eq 0 ]] && break

  # For each unit, fetch details
  while IFS= read -r UNIT; do
    INFO="$(curl -sS "${BF}/assets/${UNIT}" "${AUTH[@]}" "${HDR[@]}")"

    policy_id="$(printf %s "$INFO" | jq -r '.policy_id // ""')"
    asset_name_hex="$(printf %s "$INFO" | jq -r '.asset_name // ""')"

    if [[ -n "$asset_name_hex" ]]; then
      # hex -> utf8 (safe fallback to empty if conversion fails)
      if asset_name_text="$(printf %s "$asset_name_hex" | xxd -r -p 2>/dev/null | tr -d '\n' || true)"; then
        : # ok
      else
        asset_name_text=""
      fi
    else
      asset_name_text=""
    fi

    fingerprint="$(printf %s "$INFO" | jq -r '.fingerprint // ""')"
    quantity="$(printf %s "$INFO" | jq -r '.quantity // ""')"
    initial_mint_tx_hash="$(printf %s "$INFO" | jq -r '.initial_mint_tx_hash // ""')"

    metadata_name="$(printf %s "$INFO" | jq -r '.onchain_metadata.name // ""')"
    metadata_image="$(printf %s "$INFO" | jq -r '.onchain_metadata.image // ""')"
    metadata_description="$(
      printf %s "$INFO" | jq -r '
        (.onchain_metadata.description // "") as $d
        | ( if ($d|type)=="array" then ($d|join(" | ")) else ($d|tostring) end )
      '
    )"
    raw_onchain_metadata="$(printf %s "$INFO" | jq -c '.onchain_metadata // {}')"

    emit_csv_line \
      "$UNIT" "$policy_id" "$asset_name_hex" "$asset_name_text" "$fingerprint" "$quantity" "$initial_mint_tx_hash" \
      "$metadata_name" "$metadata_image" "$metadata_description" "$raw_onchain_metadata" >> "$CSV"

    TOTAL=$((TOTAL+1))
    # gentle throttle to avoid rate limiting
    sleep 0.15
  done < <(printf %s "$RESP" | jq -r '.[].asset')

  PAGE=$((PAGE+1))
done

echo "Done. Wrote ${TOTAL} rows to: ${CSV}"
