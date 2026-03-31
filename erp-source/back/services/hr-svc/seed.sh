#!/bin/bash
set -e

BASE="http://localhost:3003/api/v1/hr"
AUTH_URL="http://localhost:3015/api/v1/auth/login"

echo "Generating JWT token..."
TOKEN=$(node -e "
const crypto = require('crypto');
const header = Buffer.from(JSON.stringify({alg:'HS256',typ:'JWT'})).toString('base64url');
const payload = Buffer.from(JSON.stringify({
  sub:'27d1d336-e129-44cf-832e-64e0383f11cf',
  tenantId:'550e8400-e29b-41d4-a716-446655440000',
  tenant_id:'550e8400-e29b-41d4-a716-446655440000',
  email:'admin@erp.com',
  roles:['Super Admin'],
  iss:'erp-core',
  iat:Math.floor(Date.now()/1000),
  exp:Math.floor(Date.now()/1000)+86400,
  jti:crypto.randomUUID()
})).toString('base64url');
const sig = crypto.createHmac('sha256','change-me-in-production-use-256-bit-key').update(header+'.'+payload).digest('base64url');
console.log(header+'.'+payload+'.'+sig);
")

echo "Got token: ${TOKEN:0:20}..."

H1="Authorization: Bearer $TOKEN"
H2="Content-Type: application/json"

echo ""
echo "=== Creating Departments ==="
ENG_ID=$(curl -s -X POST "$BASE/departments" -H "$H1" -H "$H2" \
  -d '{"code":"ENG","name":"Engineering","description":"Software Engineering Department"}' \
  | python3 -c "import sys,json; print(json.load(sys.stdin)['id'])")
echo "Engineering: $ENG_ID"

HR_ID=$(curl -s -X POST "$BASE/departments" -H "$H1" -H "$H2" \
  -d '{"code":"HR","name":"Human Resources","description":"People & Culture"}' \
  | python3 -c "import sys,json; print(json.load(sys.stdin)['id'])")
echo "Human Resources: $HR_ID"

FIN_ID=$(curl -s -X POST "$BASE/departments" -H "$H1" -H "$H2" \
  -d '{"code":"FIN","name":"Finance","description":"Finance & Accounting"}' \
  | python3 -c "import sys,json; print(json.load(sys.stdin)['id'])")
echo "Finance: $FIN_ID"

SALES_ID=$(curl -s -X POST "$BASE/departments" -H "$H1" -H "$H2" \
  -d '{"code":"SALES","name":"Sales","description":"Sales & Business Development"}' \
  | python3 -c "import sys,json; print(json.load(sys.stdin)['id'])")
echo "Sales: $SALES_ID"

OPS_ID=$(curl -s -X POST "$BASE/departments" -H "$H1" -H "$H2" \
  -d '{"code":"OPS","name":"Operations","description":"Operations & Logistics"}' \
  | python3 -c "import sys,json; print(json.load(sys.stdin)['id'])")
echo "Operations: $OPS_ID"

echo ""
echo "=== Creating Positions ==="
SE_ID=$(curl -s -X POST "$BASE/positions" -H "$H1" -H "$H2" \
  -d "{\"code\":\"SE\",\"title\":\"Software Engineer\",\"departmentId\":\"$ENG_ID\",\"minSalary\":70000,\"maxSalary\":120000,\"currency\":\"USD\"}" \
  | python3 -c "import sys,json; print(json.load(sys.stdin)['id'])")
echo "Software Engineer: $SE_ID"

SSE_ID=$(curl -s -X POST "$BASE/positions" -H "$H1" -H "$H2" \
  -d "{\"code\":\"SSE\",\"title\":\"Senior Software Engineer\",\"departmentId\":\"$ENG_ID\",\"minSalary\":100000,\"maxSalary\":160000,\"currency\":\"USD\"}" \
  | python3 -c "import sys,json; print(json.load(sys.stdin)['id'])")
echo "Senior Software Engineer: $SSE_ID"

EM_ID=$(curl -s -X POST "$BASE/positions" -H "$H1" -H "$H2" \
  -d "{\"code\":\"EM\",\"title\":\"Engineering Manager\",\"departmentId\":\"$ENG_ID\",\"minSalary\":130000,\"maxSalary\":200000,\"currency\":\"USD\"}" \
  | python3 -c "import sys,json; print(json.load(sys.stdin)['id'])")
echo "Engineering Manager: $EM_ID"

HRM_ID=$(curl -s -X POST "$BASE/positions" -H "$H1" -H "$H2" \
  -d "{\"code\":\"HRM\",\"title\":\"HR Manager\",\"departmentId\":\"$HR_ID\",\"minSalary\":80000,\"maxSalary\":130000,\"currency\":\"USD\"}" \
  | python3 -c "import sys,json; print(json.load(sys.stdin)['id'])")
echo "HR Manager: $HRM_ID"

HRS_ID=$(curl -s -X POST "$BASE/positions" -H "$H1" -H "$H2" \
  -d "{\"code\":\"HRS\",\"title\":\"HR Specialist\",\"departmentId\":\"$HR_ID\",\"minSalary\":50000,\"maxSalary\":80000,\"currency\":\"USD\"}" \
  | python3 -c "import sys,json; print(json.load(sys.stdin)['id'])")
echo "HR Specialist: $HRS_ID"

ACC_ID=$(curl -s -X POST "$BASE/positions" -H "$H1" -H "$H2" \
  -d "{\"code\":\"ACC\",\"title\":\"Accountant\",\"departmentId\":\"$FIN_ID\",\"minSalary\":60000,\"maxSalary\":100000,\"currency\":\"USD\"}" \
  | python3 -c "import sys,json; print(json.load(sys.stdin)['id'])")
echo "Accountant: $ACC_ID"

SM_ID=$(curl -s -X POST "$BASE/positions" -H "$H1" -H "$H2" \
  -d "{\"code\":\"SM\",\"title\":\"Sales Manager\",\"departmentId\":\"$SALES_ID\",\"minSalary\":75000,\"maxSalary\":130000,\"currency\":\"USD\"}" \
  | python3 -c "import sys,json; print(json.load(sys.stdin)['id'])")
echo "Sales Manager: $SM_ID"

SR_ID=$(curl -s -X POST "$BASE/positions" -H "$H1" -H "$H2" \
  -d "{\"code\":\"SR\",\"title\":\"Sales Representative\",\"departmentId\":\"$SALES_ID\",\"minSalary\":45000,\"maxSalary\":80000,\"currency\":\"USD\"}" \
  | python3 -c "import sys,json; print(json.load(sys.stdin)['id'])")
echo "Sales Representative: $SR_ID"

echo ""
echo "=== Creating Employees ==="
# Engineering
EMP1=$(curl -s -X POST "$BASE/employees" -H "$H1" -H "$H2" \
  -d "{\"firstName\":\"Alice\",\"lastName\":\"Johnson\",\"email\":\"alice.johnson@erp.com\",\"phone\":\"+1-555-0101\",\"dateOfBirth\":\"1990-03-15\",\"hireDate\":\"2022-01-10\",\"departmentId\":\"$ENG_ID\",\"positionId\":\"$EM_ID\",\"baseSalary\":150000,\"currency\":\"USD\"}" \
  | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('id',d))")
echo "Alice Johnson (Eng Manager): $EMP1"

EMP2=$(curl -s -X POST "$BASE/employees" -H "$H1" -H "$H2" \
  -d "{\"firstName\":\"Bob\",\"lastName\":\"Smith\",\"email\":\"bob.smith@erp.com\",\"phone\":\"+1-555-0102\",\"dateOfBirth\":\"1992-07-22\",\"hireDate\":\"2023-03-01\",\"departmentId\":\"$ENG_ID\",\"positionId\":\"$SSE_ID\",\"managerId\":\"$EMP1\",\"baseSalary\":120000,\"currency\":\"USD\"}" \
  | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('id',d))")
echo "Bob Smith (Sr Eng): $EMP2"

EMP3=$(curl -s -X POST "$BASE/employees" -H "$H1" -H "$H2" \
  -d "{\"firstName\":\"Carol\",\"lastName\":\"Williams\",\"email\":\"carol.williams@erp.com\",\"phone\":\"+1-555-0103\",\"dateOfBirth\":\"1995-11-08\",\"hireDate\":\"2024-01-15\",\"departmentId\":\"$ENG_ID\",\"positionId\":\"$SE_ID\",\"managerId\":\"$EMP1\",\"baseSalary\":85000,\"currency\":\"USD\"}" \
  | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('id',d))")
echo "Carol Williams (Eng): $EMP3"

# HR
EMP4=$(curl -s -X POST "$BASE/employees" -H "$H1" -H "$H2" \
  -d "{\"firstName\":\"Diana\",\"lastName\":\"Brown\",\"email\":\"diana.brown@erp.com\",\"phone\":\"+1-555-0104\",\"dateOfBirth\":\"1988-05-20\",\"hireDate\":\"2021-06-01\",\"departmentId\":\"$HR_ID\",\"positionId\":\"$HRM_ID\",\"baseSalary\":110000,\"currency\":\"USD\"}" \
  | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('id',d))")
echo "Diana Brown (HR Manager): $EMP4"

EMP5=$(curl -s -X POST "$BASE/employees" -H "$H1" -H "$H2" \
  -d "{\"firstName\":\"Edward\",\"lastName\":\"Davis\",\"email\":\"edward.davis@erp.com\",\"dateOfBirth\":\"1993-09-12\",\"hireDate\":\"2023-09-01\",\"departmentId\":\"$HR_ID\",\"positionId\":\"$HRS_ID\",\"managerId\":\"$EMP4\",\"baseSalary\":62000,\"currency\":\"USD\"}" \
  | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('id',d))")
echo "Edward Davis (HR Specialist): $EMP5"

# Finance
EMP6=$(curl -s -X POST "$BASE/employees" -H "$H1" -H "$H2" \
  -d "{\"firstName\":\"Frank\",\"lastName\":\"Miller\",\"email\":\"frank.miller@erp.com\",\"phone\":\"+1-555-0106\",\"dateOfBirth\":\"1991-01-30\",\"hireDate\":\"2022-04-15\",\"departmentId\":\"$FIN_ID\",\"positionId\":\"$ACC_ID\",\"baseSalary\":85000,\"currency\":\"USD\"}" \
  | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('id',d))")
echo "Frank Miller (Accountant): $EMP6"

# Sales
EMP7=$(curl -s -X POST "$BASE/employees" -H "$H1" -H "$H2" \
  -d "{\"firstName\":\"Grace\",\"lastName\":\"Wilson\",\"email\":\"grace.wilson@erp.com\",\"phone\":\"+1-555-0107\",\"dateOfBirth\":\"1987-12-05\",\"hireDate\":\"2020-11-01\",\"departmentId\":\"$SALES_ID\",\"positionId\":\"$SM_ID\",\"baseSalary\":105000,\"currency\":\"USD\"}" \
  | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('id',d))")
echo "Grace Wilson (Sales Manager): $EMP7"

EMP8=$(curl -s -X POST "$BASE/employees" -H "$H1" -H "$H2" \
  -d "{\"firstName\":\"Henry\",\"lastName\":\"Taylor\",\"email\":\"henry.taylor@erp.com\",\"dateOfBirth\":\"1994-06-18\",\"hireDate\":\"2024-02-01\",\"departmentId\":\"$SALES_ID\",\"positionId\":\"$SR_ID\",\"managerId\":\"$EMP7\",\"baseSalary\":55000,\"currency\":\"USD\"}" \
  | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('id',d))")
echo "Henry Taylor (Sales Rep): $EMP8"

echo ""
echo "=== Creating Leave Requests ==="
# Bob's annual leave - approved
curl -s -X POST "$BASE/leave/request" -H "$H1" -H "$H2" \
  -d "{\"employeeId\":\"$EMP2\",\"leaveType\":\"ANNUAL\",\"startDate\":\"2025-12-20\",\"endDate\":\"2025-12-31\",\"totalDays\":8,\"reason\":\"Holiday vacation\"}" \
  | python3 -c "import sys,json; d=json.load(sys.stdin); print('Bob Annual:', d.get('id',d))"

# Carol's sick leave
curl -s -X POST "$BASE/leave/request" -H "$H1" -H "$H2" \
  -d "{\"employeeId\":\"$EMP3\",\"leaveType\":\"SICK\",\"startDate\":\"2025-11-10\",\"endDate\":\"2025-11-12\",\"totalDays\":3,\"reason\":\"Flu\"}" \
  | python3 -c "import sys,json; d=json.load(sys.stdin); print('Carol Sick:', d.get('id',d))"

# Diana's annual leave
curl -s -X POST "$BASE/leave/request" -H "$H1" -H "$H2" \
  -d "{\"employeeId\":\"$EMP4\",\"leaveType\":\"ANNUAL\",\"startDate\":\"2026-01-05\",\"endDate\":\"2026-01-09\",\"totalDays\":5,\"reason\":\"Family visit\"}" \
  | python3 -c "import sys,json; d=json.load(sys.stdin); print('Diana Annual:', d.get('id',d))"

# Henry annual leave
curl -s -X POST "$BASE/leave/request" -H "$H1" -H "$H2" \
  -d "{\"employeeId\":\"$EMP8\",\"leaveType\":\"ANNUAL\",\"startDate\":\"2026-03-20\",\"endDate\":\"2026-03-25\",\"totalDays\":4,\"reason\":\"Personal travel\"}" \
  | python3 -c "import sys,json; d=json.load(sys.stdin); print('Henry Annual:', d.get('id',d))"

echo ""
echo "=== Verifying Data ==="
echo "Departments:"
curl -s "$BASE/departments" -H "$H1" | python3 -c "import sys,json; data=json.load(sys.stdin); print(f'  Count: {len(data)}')"
echo "Employees:"
curl -s "$BASE/employees" -H "$H1" | python3 -c "import sys,json; data=json.load(sys.stdin); print(f'  Count: {len(data)}')"
echo "Leave Requests:"
curl -s "$BASE/leave/requests" -H "$H1" | python3 -c "import sys,json; data=json.load(sys.stdin); print(f'  Count: {len(data)}')"

echo ""
echo "=== Seed Complete ==="
