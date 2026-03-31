const crypto = require('crypto');
const http = require('http');

const BASE = 'http://localhost:3003';

function genToken() {
  const h = Buffer.from(JSON.stringify({alg:'HS256',typ:'JWT'})).toString('base64url');
  const p = Buffer.from(JSON.stringify({
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
  const s = crypto.createHmac('sha256','change-me-in-production-use-256-bit-key').update(h+'.'+p).digest('base64url');
  return h+'.'+p+'.'+s;
}

function request(method, path, body) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE);
    const data = body ? JSON.stringify(body) : null;
    const req = http.request({
      hostname: url.hostname,
      port: url.port,
      path: url.pathname,
      method,
      headers: {
        'Authorization': 'Bearer ' + TOKEN,
        'Content-Type': 'application/json',
        ...(data ? {'Content-Length': Buffer.byteLength(data)} : {}),
      }
    }, (res) => {
      let body = '';
      res.on('data', c => body += c);
      res.on('end', () => {
        try { resolve(JSON.parse(body)); } catch { resolve(body); }
      });
    });
    req.on('error', reject);
    if (data) req.write(data);
    req.end();
  });
}

const TOKEN = genToken();

async function main() {
  console.log('=== Seeding HR Database ===\n');

  // Departments
  console.log('--- Departments ---');
  const depts = [
    {code:'ENG', name:'Engineering', description:'Software Engineering Department'},
    {code:'HR', name:'Human Resources', description:'People & Culture'},
    {code:'FIN', name:'Finance', description:'Finance & Accounting Department'},
    {code:'SALES', name:'Sales', description:'Sales & Business Development'},
    {code:'OPS', name:'Operations', description:'Operations & Logistics'},
  ];
  const deptIds = {};
  for (const d of depts) {
    const r = await request('POST', '/api/v1/hr/departments', d);
    deptIds[d.code] = r.id;
    console.log(`  ${d.name}: ${r.id || JSON.stringify(r)}`);
  }

  // Positions
  console.log('\n--- Positions ---');
  const positions = [
    {code:'SE', title:'Software Engineer', departmentId:deptIds.ENG, minSalary:70000, maxSalary:120000, currency:'USD'},
    {code:'SSE', title:'Senior Software Engineer', departmentId:deptIds.ENG, minSalary:100000, maxSalary:160000, currency:'USD'},
    {code:'EM', title:'Engineering Manager', departmentId:deptIds.ENG, minSalary:130000, maxSalary:200000, currency:'USD'},
    {code:'HRM', title:'HR Manager', departmentId:deptIds.HR, minSalary:80000, maxSalary:130000, currency:'USD'},
    {code:'HRS', title:'HR Specialist', departmentId:deptIds.HR, minSalary:50000, maxSalary:80000, currency:'USD'},
    {code:'ACC', title:'Accountant', departmentId:deptIds.FIN, minSalary:60000, maxSalary:100000, currency:'USD'},
    {code:'SM', title:'Sales Manager', departmentId:deptIds.SALES, minSalary:75000, maxSalary:130000, currency:'USD'},
    {code:'SR', title:'Sales Representative', departmentId:deptIds.SALES, minSalary:45000, maxSalary:80000, currency:'USD'},
    {code:'OM', title:'Operations Manager', departmentId:deptIds.OPS, minSalary:70000, maxSalary:120000, currency:'USD'},
  ];
  const posIds = {};
  for (const p of positions) {
    const r = await request('POST', '/api/v1/hr/positions', p);
    posIds[p.code] = r.id;
    console.log(`  ${p.title}: ${r.id || JSON.stringify(r)}`);
  }

  // Employees
  console.log('\n--- Employees ---');
  const employees = [
    {firstName:'Alice', lastName:'Johnson', email:'alice.johnson@erp.com', phone:'+1-555-0101', dateOfBirth:'1990-03-15', hireDate:'2022-01-10', departmentId:deptIds.ENG, positionId:posIds.EM, baseSalary:150000, currency:'USD'},
    {firstName:'Bob', lastName:'Smith', email:'bob.smith@erp.com', phone:'+1-555-0102', dateOfBirth:'1992-07-22', hireDate:'2023-03-01', departmentId:deptIds.ENG, positionId:posIds.SSE, baseSalary:120000, currency:'USD'},
    {firstName:'Carol', lastName:'Williams', email:'carol.williams@erp.com', phone:'+1-555-0103', dateOfBirth:'1995-11-08', hireDate:'2024-01-15', departmentId:deptIds.ENG, positionId:posIds.SE, baseSalary:85000, currency:'USD'},
    {firstName:'Diana', lastName:'Brown', email:'diana.brown@erp.com', phone:'+1-555-0104', dateOfBirth:'1988-05-20', hireDate:'2021-06-01', departmentId:deptIds.HR, positionId:posIds.HRM, baseSalary:110000, currency:'USD'},
    {firstName:'Edward', lastName:'Davis', email:'edward.davis@erp.com', dateOfBirth:'1993-09-12', hireDate:'2023-09-01', departmentId:deptIds.HR, positionId:posIds.HRS, baseSalary:62000, currency:'USD'},
    {firstName:'Frank', lastName:'Miller', email:'frank.miller@erp.com', phone:'+1-555-0106', dateOfBirth:'1991-01-30', hireDate:'2022-04-15', departmentId:deptIds.FIN, positionId:posIds.ACC, baseSalary:85000, currency:'USD'},
    {firstName:'Grace', lastName:'Wilson', email:'grace.wilson@erp.com', phone:'+1-555-0107', dateOfBirth:'1987-12-05', hireDate:'2020-11-01', departmentId:deptIds.SALES, positionId:posIds.SM, baseSalary:105000, currency:'USD'},
    {firstName:'Henry', lastName:'Taylor', email:'henry.taylor@erp.com', dateOfBirth:'1994-06-18', hireDate:'2024-02-01', departmentId:deptIds.SALES, positionId:posIds.SR, baseSalary:55000, currency:'USD'},
    {firstName:'Iris', lastName:'Anderson', email:'iris.anderson@erp.com', phone:'+1-555-0109', dateOfBirth:'1989-08-25', hireDate:'2021-03-15', departmentId:deptIds.OPS, positionId:posIds.OM, baseSalary:95000, currency:'USD'},
    {firstName:'Jack', lastName:'Thomas', email:'jack.thomas@erp.com', dateOfBirth:'1996-04-10', hireDate:'2024-06-01', departmentId:deptIds.ENG, positionId:posIds.SE, baseSalary:80000, currency:'USD'},
  ];
  const empIds = [];
  for (const e of employees) {
    const r = await request('POST', '/api/v1/hr/employees', e);
    empIds.push(r.id);
    console.log(`  ${e.firstName} ${e.lastName}: ${r.id || JSON.stringify(r)}`);
  }

  // Set managers (Alice manages Bob, Carol, Jack; Diana manages Edward; Grace manages Henry)
  if (empIds[0] && empIds[1]) {
    await request('POST', `/api/v1/hr/employees/${empIds[1]}/transfer`, {departmentId:deptIds.ENG, positionId:posIds.SSE, managerId:empIds[0]});
    await request('POST', `/api/v1/hr/employees/${empIds[2]}/transfer`, {departmentId:deptIds.ENG, positionId:posIds.SE, managerId:empIds[0]});
    await request('POST', `/api/v1/hr/employees/${empIds[9]}/transfer`, {departmentId:deptIds.ENG, positionId:posIds.SE, managerId:empIds[0]});
    await request('POST', `/api/v1/hr/employees/${empIds[4]}/transfer`, {departmentId:deptIds.HR, positionId:posIds.HRS, managerId:empIds[3]});
    await request('POST', `/api/v1/hr/employees/${empIds[7]}/transfer`, {departmentId:deptIds.SALES, positionId:posIds.SR, managerId:empIds[6]});
    console.log('  Managers set');
  }

  // Leave requests
  console.log('\n--- Leave Requests ---');
  const leaves = [
    {employeeId:empIds[1], leaveType:'ANNUAL', startDate:'2025-12-20', endDate:'2025-12-31', totalDays:8, reason:'Holiday vacation'},
    {employeeId:empIds[2], leaveType:'SICK', startDate:'2025-11-10', endDate:'2025-11-12', totalDays:3, reason:'Flu'},
    {employeeId:empIds[3], leaveType:'ANNUAL', startDate:'2026-01-05', endDate:'2026-01-09', totalDays:5, reason:'Family visit'},
    {employeeId:empIds[7], leaveType:'ANNUAL', startDate:'2026-03-20', endDate:'2026-03-25', totalDays:4, reason:'Personal travel'},
    {employeeId:empIds[5], leaveType:'ANNUAL', startDate:'2026-04-14', endDate:'2026-04-18', totalDays:5, reason:'Spring break'},
    {employeeId:empIds[8], leaveType:'SICK', startDate:'2026-02-03', endDate:'2026-02-04', totalDays:2, reason:'Dental surgery'},
  ];
  const leaveIds = [];
  for (const l of leaves) {
    const r = await request('POST', '/api/v1/hr/leave/request', l);
    leaveIds.push(r.id);
    console.log(`  ${l.leaveType} (${l.totalDays}d): ${r.id || JSON.stringify(r)}`);
  }

  // Approve some leaves
  if (leaveIds[0]) {
    await request('POST', `/api/v1/hr/leave/requests/${leaveIds[0]}/approve`);
    console.log('  Approved Bob annual leave');
  }
  if (leaveIds[2]) {
    await request('POST', `/api/v1/hr/leave/requests/${leaveIds[2]}/approve`);
    console.log('  Approved Diana annual leave');
  }

  // Verify
  console.log('\n=== Verification ===');
  const deptsAll = await request('GET', '/api/v1/hr/departments');
  console.log(`Departments: ${Array.isArray(deptsAll) ? deptsAll.length : 'ERR'}`);
  const empsAll = await request('GET', '/api/v1/hr/employees');
  console.log(`Employees: ${Array.isArray(empsAll) ? empsAll.length : 'ERR'}`);
  const leavesAll = await request('GET', '/api/v1/hr/leave/requests');
  console.log(`Leave Requests: ${Array.isArray(leavesAll) ? leavesAll.length : 'ERR'}`);

  console.log('\n=== Seed Complete ===');
}

main().catch(e => { console.error(e); process.exit(1); });
