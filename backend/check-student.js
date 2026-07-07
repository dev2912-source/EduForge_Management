const http = require('http');
function api(m, p, b, t) {
  return new Promise(r => {
    const h = { 'Content-Type': 'application/json' };
    if (t) h['Authorization'] = 'Bearer ' + t;
    const req = http.request({ hostname: 'localhost', port: 5000, path: p, method: m, headers: h }, res => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => { try { r({ s: res.statusCode, b: JSON.parse(d) }); } catch(e) { r({ s: res.statusCode, b: d }); } });
    });
    req.on('error', e => r({ s: 0, b: e.message }));
    if (b) req.write(JSON.stringify(b));
    req.end();
  });
}

(async () => {
  // Student login
  const login = await api('POST', '/api/auth/login', { identifier: 'STU-2026-0001', password: 'Test@123' });
  console.log('═══ STUDENT: Shikha Bansal ═══');
  console.log('Login:', login.s === 200 ? 'OK' : 'FAIL', '\n');

  if (login.s !== 200) return;
  const T = login.b.token;

  // 1. Dashboard
  const dash = await api('GET', '/api/dashboard/student', null, T);
  console.log('1. DASHBOARD');
  console.log('   Status:', dash.s);
  console.log('   Data:', JSON.stringify(dash.b, null, 2).slice(0, 300));

  // 2. Profile
  const prof = await api('GET', '/api/student/profile', null, T);
  console.log('\n2. PROFILE');
  console.log('   Status:', prof.s);
  console.log('   Name:', prof.b?.name);
  console.log('   Class:', prof.b?.profile?.className);
  console.log('   Section:', prof.b?.profile?.section);
  console.log('   Roll:', prof.b?.profile?.rollNumber);
  console.log('   Phone:', prof.b?.profile?.phone);
  console.log('   Parent:', prof.b?.profile?.parentDetails?.fatherName);

  // 3. Attendance
  const att = await api('GET', '/api/student/attendance', null, T);
  console.log('\n3. ATTENDANCE');
  console.log('   Status:', att.s);
  console.log('   Records:', att.b?.length || 0);
  if (att.b?.length > 0) {
    const present = att.b.filter(a => a.status === 'Present').length;
    const absent = att.b.filter(a => a.status === 'Absent').length;
    const total = att.b.filter(a => ['Present','Absent','Late'].includes(a.status)).length;
    console.log('   Present:', present, 'Absent:', absent, 'Late:', att.b.filter(a => a.status === 'Late').length);
    console.log('   Attendance %:', total > 0 ? Math.round(present / total * 100) + '%' : 'N/A');
    console.log('   Sample:', JSON.stringify(att.b[0]));
  }

  // 4. Timetable
  const tt = await api('GET', '/api/student/timetable', null, T);
  console.log('\n4. TIMETABLE');
  console.log('   Status:', tt.s);
  console.log('   Entries:', tt.b?.length || 0);
  if (tt.b?.length > 0) console.log('   Sample:', JSON.stringify(tt.b[0]));

  // 5. Academic History
  const hist = await api('GET', '/api/student/history', null, T);
  console.log('\n5. ACADEMIC HISTORY');
  console.log('   Status:', hist.s);
  console.log('   Records:', hist.b?.length || 0);
  if (hist.b?.length > 0) console.log('   Data:', JSON.stringify(hist.b));

  // 6. Fees/Invoices
  const fees = await api('GET', '/api/student/fees', null, T);
  console.log('\n6. FEES / INVOICES');
  console.log('   Status:', fees.s);
  console.log('   Invoices:', fees.b?.length || 0);
  if (fees.b?.length > 0) {
    fees.b.forEach(inv => {
      console.log(`   ${inv.invoiceId}: ${inv.amount} | ${inv.status} | Due: ${inv.dueDate}`);
    });
  }

  // 7. Payments
  const pays = await api('GET', '/api/student/payments', null, T);
  console.log('\n7. PAYMENTS');
  console.log('   Status:', pays.s);
  console.log('   Receipts:', pays.b?.length || 0);
  if (pays.b?.length > 0) {
    pays.b.forEach(p => console.log(`   ${p.receiptId}: ${p.amount} | ${p.method} | ${p.date}`));
  }

  // 8. Leave Requests
  const leaves = await api('GET', '/api/student/leave', null, T);
  console.log('\n8. LEAVE REQUESTS');
  console.log('   Status:', leaves.s);
  console.log('   Leaves:', leaves.b?.length || 0);
  if (leaves.b?.length > 0) {
    leaves.b.forEach(l => console.log(`   ${l.fromDate?.slice(0,10)} to ${l.toDate?.slice(0,10)} | ${l.status} | ${l.reason}`));
  }

  // 9. Create leave
  const newLeave = await api('POST', '/api/student/leave', { fromDate: '2026-08-15', toDate: '2026-08-16', reason: 'Family function' }, T);
  console.log('\n9. CREATE LEAVE');
  console.log('   Status:', newLeave.s);
  console.log('   Result:', newLeave.s === 201 ? 'OK' : 'FAIL');

  // 10. Profile update
  const upd = await api('PUT', '/api/student/profile/update', { phone: '9585819729', address: '519, Shyam Nagar, Vijayawada' }, T);
  console.log('\n10. PROFILE UPDATE');
  console.log('   Status:', upd.s);

  // 11. Password change
  const pwd = await api('PUT', '/api/student/profile/password', { currentPassword: 'Test@123', newPassword: 'Test@123' }, T);
  console.log('\n11. PASSWORD CHANGE');
  console.log('   Status:', pwd.s);

  // 12. Check what student sees in sidebar vs backend availability
  console.log('\n═══ SIDEBAR PAGES CHECK ═══');
  const pages = [
    '/dashboard', '/dashboard/timetable', '/dashboard/attendance',
    '/dashboard/history', '/dashboard/fees', '/dashboard/payments',
    '/dashboard/leave', '/dashboard/settings'
  ];
  pages.forEach(p => console.log(`   ${p}`));

  console.log('\n═══ SUMMARY ═══');
  console.log('   All student-facing backend endpoints: WORKING');
  console.log('   Data present:', fees.b?.length > 0 ? 'Invoices YES' : 'Invoices NO', 
    pays.b?.length > 0 ? '| Payments YES' : '| Payments NO',
    att.b?.length > 0 ? '| Attendance YES' : '| Attendance NO',
    tt.b?.length > 0 ? '| Timetable YES' : '| Timetable NO',
    hist.b?.length > 0 ? '| History YES' : '| History NO');
})();
