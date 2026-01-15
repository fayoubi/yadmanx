#!/bin/bash

# YadmanX Complete API Collection Test Script
# Tests all endpoints and reports results

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

PASSED=0
FAILED=0
ISSUES=()

echo "╔══════════════════════════════════════════════════════════════════════╗"
echo "║         YadmanX Complete API Collection Test Report                 ║"
echo "╚══════════════════════════════════════════════════════════════════════╝"
echo ""

# Test function
test_endpoint() {
    local name="$1"
    local method="$2"
    local url="$3"
    local data="$4"
    local headers="$5"
    local expected_code="$6"

    echo -n "Testing: $name... "

    if [ -z "$data" ]; then
        response=$(curl -s -w "\n%{http_code}" -X "$method" "$url" $headers)
    else
        response=$(curl -s -w "\n%{http_code}" -X "$method" "$url" \
            -H "Content-Type: application/json" \
            $headers \
            -d "$data")
    fi

    http_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | sed '$d')

    if [ "$http_code" = "$expected_code" ]; then
        echo -e "${GREEN}✓ PASS${NC} (HTTP $http_code)"
        ((PASSED++))
        return 0
    else
        echo -e "${RED}✗ FAIL${NC} (Expected $expected_code, got $http_code)"
        ISSUES+=("$name: Expected HTTP $expected_code, got $http_code")
        echo "  Response: $(echo $body | head -c 100)"
        ((FAILED++))
        return 1
    fi
}

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  AGENT SERVICE (Port 3003)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Health Check
test_endpoint "Health Check" "GET" "http://localhost:3003/api/v1/health" "" "" "200"

# Register Agent
REGISTER_DATA='{
  "first_name": "TestBot",
  "last_name": "Runner",
  "email": "testbot@yadmanx.test",
  "country_code": "+212",
  "phone_number": "777777777",
  "license_number": "BOT777",
  "agency_name": "Bot Agency"
}'

register_response=$(curl -s -X POST "http://localhost:3003/api/v1/auth/register" \
    -H "Content-Type: application/json" \
    -d "$REGISTER_DATA")

if echo "$register_response" | grep -q "success"; then
    echo -e "Testing: Register Agent... ${GREEN}✓ PASS${NC}"
    ((PASSED++))
    OTP_CODE=$(echo "$register_response" | grep -o '"code":"[^"]*"' | cut -d'"' -f4)
    PHONE_NUMBER="777777777"
else
    echo -e "Testing: Register Agent... ${RED}✗ FAIL${NC}"
    ((FAILED++))
    ISSUES+=("Register Agent: Failed to extract OTP code")
fi

# Verify OTP (with correct field name: "code" not "otp")
VERIFY_DATA="{
  \"phone_number\": \"$PHONE_NUMBER\",
  \"code\": \"$OTP_CODE\"
}"

verify_response=$(curl -s -X POST "http://localhost:3003/api/v1/auth/verify-otp" \
    -H "Content-Type: application/json" \
    -d "$VERIFY_DATA")

if echo "$verify_response" | grep -q "token"; then
    echo -e "Testing: Verify OTP... ${GREEN}✓ PASS${NC}"
    ((PASSED++))
    TOKEN=$(echo "$verify_response" | grep -o '"token":"[^"]*"' | cut -d'"' -f4)
    AGENT_ID=$(echo "$verify_response" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
else
    echo -e "Testing: Verify OTP... ${RED}✗ FAIL${NC}"
    ((FAILED++))
    ISSUES+=("Verify OTP: Failed to get token")
    echo "  Response: $verify_response"
fi

# Get Profile
test_endpoint "Get My Profile" "GET" "http://localhost:3003/api/v1/agents/me" "" "-H 'Authorization: Bearer $TOKEN'" "200"

# Admin Sync
test_endpoint "Admin Sync All Agents" "POST" "http://localhost:3003/api/v1/admin/sync-all-agents" "" "-H 'Authorization: Bearer $TOKEN'" "200"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  ENROLLMENT SERVICE (Port 3002)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Health Check
test_endpoint "Health Check" "GET" "http://localhost:3002/api/v1/health" "" "" "200"

# Initialize Enrollment
INIT_DATA='{
  "personalInfo": {
    "subscriber": {
      "firstName": "Bot",
      "lastName": "Test",
      "idNumber": "BOT12345",
      "email": "bot@test.com"
    },
    "insuredSameAsSubscriber": true
  }
}'

init_response=$(curl -s -X POST "http://localhost:3002/api/v1/enrollments/initialize" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $TOKEN" \
    -d "$INIT_DATA")

if echo "$init_response" | grep -q "enrollment"; then
    echo -e "Testing: Initialize Enrollment... ${GREEN}✓ PASS${NC}"
    ((PASSED++))
    ENROLLMENT_ID=$(echo "$init_response" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
else
    echo -e "Testing: Initialize Enrollment... ${RED}✗ FAIL${NC}"
    ((FAILED++))
    ISSUES+=("Initialize Enrollment: Failed")
    echo "  Response: $(echo $init_response | head -c 200)"
fi

# List Enrollments
test_endpoint "List Enrollments" "GET" "http://localhost:3002/api/v1/enrollments" "" "-H 'Authorization: Bearer $TOKEN'" "200"

# Get Enrollment by ID
if [ -n "$ENROLLMENT_ID" ]; then
    test_endpoint "Get Enrollment By ID" "GET" "http://localhost:3002/api/v1/enrollments/$ENROLLMENT_ID" "" "-H 'Authorization: Bearer $TOKEN'" "200"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  PRICING SERVICE (Port 3001)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Health Check
test_endpoint "Health Check" "GET" "http://localhost:3001/api/v1/health" "" "" "200"

# Get Products
test_endpoint "Get Available Products" "GET" "http://localhost:3001/api/v1/products" "" "" "200"

# Calculate Quote
QUOTE_DATA='{
  "productType": "HEALTH_INDIVIDUAL",
  "subscriber": {
    "dateOfBirth": "1990-01-01",
    "gender": "male"
  },
  "insured": {
    "dateOfBirth": "1990-01-01",
    "gender": "male"
  },
  "options": {
    "plan": "STANDARD",
    "contribution": {
      "amount": 500,
      "frequency": "monthly"
    }
  }
}'

quote_response=$(curl -s -X POST "http://localhost:3001/api/v1/quotes/calculate" \
    -H "Content-Type: application/json" \
    -d "$QUOTE_DATA")

if echo "$quote_response" | grep -q "quoteId"; then
    echo -e "Testing: Calculate Quote... ${GREEN}✓ PASS${NC}"
    ((PASSED++))
    QUOTE_ID=$(echo "$quote_response" | grep -o '"quoteId":"[^"]*"' | cut -d'"' -f4)
else
    echo -e "Testing: Calculate Quote... ${RED}✗ FAIL${NC}"
    ((FAILED++))
    ISSUES+=("Calculate Quote: Failed")
fi

# Validate Contribution
CONTRIB_DATA='{
  "amount": 500,
  "frequency": "monthly"
}'
test_endpoint "Validate Contribution" "POST" "http://localhost:3001/api/v1/contributions/validate" "$CONTRIB_DATA" "" "200"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  LLM QUOTE SERVICE (Port 3004)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Health Check
test_endpoint "Health Check" "GET" "http://localhost:3004/api/v1/health" "" "" "200"

# Create Conversation
CONV_DATA='{
  "userId": "test-bot-777",
  "metadata": {
    "agentId": "'"$AGENT_ID"'",
    "source": "api-test"
  }
}'

conv_response=$(curl -s -X POST "http://localhost:3004/api/v1/conversations" \
    -H "Content-Type: application/json" \
    -d "$CONV_DATA")

if echo "$conv_response" | grep -q "sessionId"; then
    echo -e "Testing: Create Conversation... ${GREEN}✓ PASS${NC}"
    ((PASSED++))
    SESSION_ID=$(echo "$conv_response" | grep -o '"sessionId":"[^"]*"' | cut -d'"' -f4)
else
    echo -e "Testing: Create Conversation... ${RED}✗ FAIL${NC}"
    ((FAILED++))
    ISSUES+=("Create Conversation: Failed")
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  TEST SUMMARY"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo -e "  ${GREEN}Passed:${NC} $PASSED"
echo -e "  ${RED}Failed:${NC} $FAILED"
echo -e "  ${BLUE}Total:${NC} $((PASSED + FAILED))"
echo ""

if [ $FAILED -gt 0 ]; then
    echo -e "${YELLOW}Issues Found:${NC}"
    for issue in "${ISSUES[@]}"; do
        echo "  - $issue"
    done
    echo ""
fi

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}✓ All tests passed!${NC}"
    exit 0
else
    echo -e "${RED}✗ Some tests failed. See issues above.${NC}"
    exit 1
fi
