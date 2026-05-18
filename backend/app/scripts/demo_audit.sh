#!/usr/bin/env bash
# Demo audit: gate → for each demo_type, create session → fire one cached preset + one live AI call.
# Run from a host that can reach https://benchworksai.com.
set -u

BASE="https://benchworksai.com"
EMAIL="demo-audit-$(date +%s)@benchworksai.test"
COOKIES=$(mktemp)
RESULTS=()

cleanup() { rm -f "$COOKIES"; }
trap cleanup EXIT

DEMOS=(chatbot analytics email_sms doc_processing competitive_analysis doc_drafting marketing_engine)
VERTICAL="general_smb"

echo "## Demo audit"
echo "Email: $EMAIL"
echo "Vertical: $VERTICAL"
echo

echo "### Step 0 — gate"
gate=$(curl -sS -c "$COOKIES" -X POST "$BASE/api/leads/demo-gate" \
  -H "Content-Type: application/json" \
    -H "Origin: $BASE" \
    -H "Referer: $BASE/demos" \
  -d "{\"email\":\"$EMAIL\",\"name\":\"Audit Bot\",\"company\":\"Audit\",\"vertical_interest\":\"$VERTICAL\",\"subscribed\":false}")
echo "  $gate" | head -c 200; echo
echo

for demo in "${DEMOS[@]}"; do
  echo "### $demo"

  # Create session
  session=$(curl -sS -b "$COOKIES" -X POST "$BASE/api/demos/session" \
    -H "Content-Type: application/json" \
    -H "Origin: $BASE" \
    -H "Referer: $BASE/demos" \
    -d "{\"demo_type\":\"$demo\",\"vertical\":\"$VERTICAL\"}")

  session_id=$(echo "$session" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('session_id',''))" 2>/dev/null || echo "")
  first_preset=$(echo "$session" | python3 -c "import sys,json; d=json.load(sys.stdin); ps=d.get('preset_commands',[]); print(ps[0]['trigger_key'] if ps else '')" 2>/dev/null || echo "")

  if [ -z "$session_id" ]; then
    echo "  ❌ session create failed: $(echo "$session" | head -c 250)"
    RESULTS+=("$demo: SESSION_FAILED")
    continue
  fi
  echo "  ✅ session_id=$session_id  presets=$(echo "$session" | python3 -c "import sys,json; print(len(json.load(sys.stdin).get('preset_commands',[])))")"

  # Cached path (preset trigger)
  if [ -n "$first_preset" ]; then
    cached=$(curl -sS -b "$COOKIES" -X POST "$BASE/api/demos/interact" \
      -H "Content-Type: application/json" \
    -H "Origin: $BASE" \
    -H "Referer: $BASE/demos" \
      -d "{\"session_id\":\"$session_id\",\"input_type\":\"preset_command\",\"trigger_key\":\"$first_preset\"}")
    cached_text=$(echo "$cached" | python3 -c "import sys,json; d=json.load(sys.stdin); t=d.get('response_text',''); print(t[:80] if t else d)" 2>/dev/null || echo "PARSE_ERR")
    if echo "$cached" | grep -q '"from_cache":true'; then
      echo "  ✅ cached preset → $cached_text..."
    else
      echo "  ⚠️  cached preset returned non-cache: $(echo "$cached" | head -c 200)"
    fi
  else
    echo "  ⚠️  no presets available"
  fi

  # Live AI path
  live=$(curl -sS -b "$COOKIES" -X POST "$BASE/api/demos/interact" \
    -H "Content-Type: application/json" \
    -H "Origin: $BASE" \
    -H "Referer: $BASE/demos" \
    -d "{\"session_id\":\"$session_id\",\"input_type\":\"text\",\"user_input\":\"What is one thing AI can do for my business this week?\"}")
  # Live is streamed text/plain — preview first chunk
  live_preview=$(echo "$live" | head -c 250 | tr '\n' ' ')
  if echo "$live" | grep -qE '"error"|RATE_LIMITED|SERVICE_UNAVAILABLE'; then
    echo "  ❌ live AI: $live_preview"
    RESULTS+=("$demo: LIVE_FAILED")
  else
    echo "  ✅ live AI: ${live_preview}..."
    RESULTS+=("$demo: OK")
  fi
  echo
done

echo "## Summary"
printf '  %s\n' "${RESULTS[@]}"
