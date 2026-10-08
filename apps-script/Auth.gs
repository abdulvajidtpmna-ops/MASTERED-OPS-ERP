/**
 * MLC ERP - Authentication & Authorization Module
 */

var ROLES = {
  MAIN_ADMIN: 'MAIN_ADMIN',
  OPS_ADMIN: 'OPS_ADMIN',
  OPS_EXEC: 'OPS_EXEC',
  OFFICE_ADMIN: 'OFFICE_ADMIN',
  PLACEMENT_ADMIN: 'PLACEMENT_ADMIN',
  HR: 'HR',
  DEPT_HEAD: 'DEPT_HEAD',
  STAFF: 'STAFF',
  TRAINER: 'TRAINER',
  STUDENT: 'STUDENT'
};

/**
 * Handle Login for all 3 user categories
 */
function handleLogin(payload) {
  var loginType = payload.login_type || 'STAFF'; // STAFF | TRAINER | STUDENT
  var identifier = String(payload.identifier || '').trim();
  var secret = String(payload.secret || '').trim();

  if (!identifier || !secret) {
    return { ok: false, error: 'Identifier and password/ID are required', code: 'INVALID_CREDENTIALS' };
  }

  var users = getTableData('Users');
  var user = null;

  if (loginType === 'STUDENT') {
    // Student: mobile (10 digits) + admission number as password
    var cleanMobile = identifier.replace(/\D/g, '').slice(-10);
    var cleanAdmissionNo = secret.toUpperCase().trim();
    for (var i = 0; i < users.length; i++) {
      var u = users[i];
      if (u.role === 'STUDENT' && (String(u.mobile).replace(/\D/g, '').slice(-10) === cleanMobile || String(u.username).toUpperCase() === cleanAdmissionNo)) {
        user = u;
        break;
      }
    }
  } else if (loginType === 'TRAINER') {
    // Trainer: email + trainer ID
    for (var j = 0; j < users.length; j++) {
      var ut = users[j];
      if (ut.role === 'TRAINER' && String(ut.email).toLowerCase() === identifier.toLowerCase()) {
        user = ut;
        break;
      }
    }
  } else {
    // Staff / Admins / HR / Dept Head
    for (var k = 0; k < users.length; k++) {
      var us = users[k];
      if (us.role !== 'STUDENT' && String(us.email).toLowerCase() === identifier.toLowerCase()) {
        user = us;
        break;
      }
    }
  }

  if (!user) {
    return { ok: false, error: 'User not found or incorrect credentials', code: 'AUTH_FAILED' };
  }

  var now = new Date().getTime();

  // Check 5-attempt / 15-minute lock
  if (user.locked_until) {
    var lockTime = new Date(user.locked_until).getTime();
    if (lockTime > now) {
      var minutesLeft = Math.ceil((lockTime - now) / (60 * 1000));
      return {
        ok: false,
        error: 'Account locked due to 5 consecutive failed attempts. Try again in ' + minutesLeft + ' minutes.',
        code: 'ACCOUNT_LOCKED'
      };
    }
  }

  // Verify hash
  var calculatedHash = hashSecret(user.salt || '', secret);
  if (calculatedHash !== user.password_hash) {
    var failedCount = (Number(user.failed_attempts) || 0) + 1;
    var updates = { failed_attempts: failedCount };
    if (failedCount >= 5) {
      updates.locked_until = new Date(now + 15 * 60 * 1000).toISOString();
      updates.failed_attempts = 0;
    }
    updateRecord('Users', user.id, updates, 'SYSTEM');
    return { ok: false, error: 'Invalid credentials. Failed attempts: ' + failedCount + '/5', code: 'INVALID_CREDENTIALS' };
  }

  // Password correct: reset failed attempts
  updateRecord('Users', user.id, { failed_attempts: 0, locked_until: '', last_login_at: new Date().toISOString() }, user.id);

  // Generate Session Token (12h expiry)
  var token = generateSecureToken();
  var expiresAt = new Date(now + 12 * 60 * 60 * 1000).toISOString();

  insertRecord('Sessions_Auth', {
    user_id: user.id,
    token: token,
    role: user.role,
    expires_at: expiresAt,
    is_active: true
  }, user.id);

  logAudit('LOGIN', 'Users', user.id, { loginType: loginType }, user);

  // Fetch contextual role metadata
  var profile = {
    id: user.id,
    full_name: user.full_name,
    email: user.email,
    mobile: user.mobile,
    role: user.role,
    department: user.department || '',
    student_id: user.student_id || '',
    trainer_id: user.trainer_id || '',
    staff_id: user.staff_id || ''
  };

  return {
    ok: true,
    data: {
      token: token,
      expires_at: expiresAt,
      user: profile
    }
  };
}

/**
 * Handle Logout
 */
function handleLogout(token, user) {
  if (!token) return { ok: true };
  var sessions = getTableData('Sessions_Auth');
  for (var i = 0; i < sessions.length; i++) {
    if (sessions[i].token === token) {
      updateRecord('Sessions_Auth', sessions[i].id, { is_active: false }, user ? user.id : 'SYSTEM');
    }
  }
  if (user) {
    logAudit('LOGOUT', 'Users', user.id, {}, user);
  }
  return { ok: true };
}

/**
 * Validate token and return authenticated user
 */
function requireAuth(token) {
  if (!token) {
    throw new Error('Authentication token is required (UNAUTHORIZED)');
  }

  var sessions = getTableData('Sessions_Auth');
  var matchedSession = null;
  var now = new Date().getTime();

  for (var i = 0; i < sessions.length; i++) {
    var s = sessions[i];
    if (s.token === token && (s.is_active === true || s.is_active === 'TRUE' || s.is_active === 1)) {
      var exp = new Date(s.expires_at).getTime();
      if (exp > now) {
        matchedSession = s;
        break;
      }
    }
  }

  if (!matchedSession) {
    throw new Error('Invalid or expired session token (SESSION_EXPIRED)');
  }

  var users = getTableData('Users');
  var user = null;
  for (var j = 0; j < users.length; j++) {
    if (users[j].id === matchedSession.user_id) {
      user = users[j];
      break;
    }
  }

  if (!user) {
    throw new Error('User associated with session not found');
  }

  return user;
}

/**
 * Enforce role permissions
 */
function requireRole(user, allowedRoles) {
  if (!user || !user.role) {
    throw new Error('Access denied: No role specified (FORBIDDEN)');
  }
  if (user.role === 'MAIN_ADMIN') {
    return true; // MAIN_ADMIN has global access
  }
  if (allowedRoles.indexOf(user.role) === -1) {
    throw new Error('Access denied: Role ' + user.role + ' is not permitted for this action (FORBIDDEN)');
  }
  return true;
}
