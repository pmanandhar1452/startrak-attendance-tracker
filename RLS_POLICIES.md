# Row Level Security (RLS) Policies

This document describes all RLS policies configured in the database for this application.

## Overview

Row Level Security (RLS) is enabled on all tables to ensure data access is properly restricted based on user roles and authentication status.

---

## Tables and Policies

### 1. **roles**
**RLS Enabled:** Yes (Forced)

| Policy Name | Operation | Roles | Policy |
|------------|-----------|-------|--------|
| Allow anon to read roles | SELECT | anon | true |
| Allow authenticated to read roles | SELECT | authenticated | true |
| Allow authenticated to create roles | INSERT | authenticated | true |
| Service role can manage roles | ALL | service_role | true |
| demo full access roles | ALL | public | auth.role() = 'authenticated' |

**Purpose:** Roles table stores user role definitions (admin, parent, instructor). All authenticated users can read and create roles. Service role has full access.

---

### 2. **user_profiles**
**RLS Enabled:** Yes (Forced)

| Policy Name | Operation | Roles | Policy |
|------------|-----------|-------|--------|
| Allow authenticated to insert their own profile | INSERT | authenticated | auth.uid() = id |
| Allow authenticated to read their own profile | SELECT | authenticated | auth.uid() = id |
| Allow authenticated to update their own profile | UPDATE | authenticated | auth.uid() = id (USING and WITH CHECK) |
| Allow profile creation during auth | INSERT | authenticated | auth.uid() = id |
| Allow public to read all user_profiles | SELECT | public | true |
| Allow reading profiles for auth | SELECT | anon, authenticated | true |
| Service role can manage user_profiles | ALL | service_role | true |
| Users can manage own profile | ALL | authenticated | auth.uid() = id |

**Purpose:** User profiles contain user information linked to auth.users. Users can manage their own profiles. Public/anon can read profiles for display purposes (e.g., showing names). Service role has full access for administrative operations.

---

### 3. **users**
**RLS Enabled:** Yes

| Policy Name | Operation | Roles | Policy |
|------------|-----------|-------|--------|
| demo full access users | ALL | public | auth.role() = 'authenticated' |

**Purpose:** Legacy users table. Authenticated users have full access.

---

### 4. **students**
**RLS Enabled:** Yes

| Policy Name | Operation | Roles | Policy |
|------------|-----------|-------|--------|
| Allow authenticated to read students | SELECT | authenticated | true |
| demo full access students | ALL | public | auth.role() = 'authenticated' |

**Purpose:** Students table stores student information. All authenticated users can read students. Authenticated users have full CRUD access.

---

### 5. **parents**
**RLS Enabled:** Yes (Forced)

| Policy Name | Operation | Roles | Policy |
|------------|-----------|-------|--------|
| Allow authenticated to read parents | SELECT | authenticated | true |
| Service role can manage parents | ALL | service_role | true |
| demo full access parents | ALL | public | auth.role() = 'authenticated' |

**Purpose:** Parents table stores parent information and QR codes. All authenticated users can read parent data. Service role has full access for user creation operations.

---

### 6. **student_parent_link**
**RLS Enabled:** Yes (Forced)

| Policy Name | Operation | Roles | Policy |
|------------|-----------|-------|--------|
| Allow authenticated to read student_parent_link | SELECT | authenticated | true |
| Allow authenticated to insert student_parent_link | INSERT | authenticated | true |
| Allow authenticated to update student_parent_link | UPDATE | authenticated | true |
| Allow authenticated to delete student_parent_link | DELETE | authenticated | true |
| Service role can manage student_parent_link | ALL | service_role | true |
| demo full access student_parent_link | ALL | public | auth.role() = 'authenticated' |

**Purpose:** Links students to their parents. Authenticated users can manage these relationships. Service role has full access.

---

### 7. **student_schedules**
**RLS Enabled:** Yes

| Policy Name | Operation | Roles | Policy |
|------------|-----------|-------|--------|
| Allow anon to read student_schedules | SELECT | anon | true |
| Allow authenticated to read student_schedules | SELECT | authenticated | true |
| Allow authenticated to manage student_schedules | ALL | authenticated | true |

**Purpose:** Stores student weekly schedules. Even anonymous users can read schedules. Authenticated users have full management access.

---

### 8. **sessions**
**RLS Enabled:** Yes

| Policy Name | Operation | Roles | Policy |
|------------|-----------|-------|--------|
| Allow authenticated to read sessions | SELECT | authenticated | true |
| demo full access sessions | ALL | public | auth.role() = 'authenticated' |

**Purpose:** Learning sessions/classes. All authenticated users can read sessions and have full CRUD access.

---

### 9. **attendance_records**
**RLS Enabled:** Yes

| Policy Name | Operation | Roles | Policy |
|------------|-----------|-------|--------|
| Allow authenticated to read attendance_records | SELECT | authenticated | true |
| demo full access attendance_records | ALL | public | auth.role() = 'authenticated' |

**Purpose:** Student attendance tracking. All authenticated users can read and manage attendance records.

---

### 10. **qr_scan_logs**
**RLS Enabled:** Yes

| Policy Name | Operation | Roles | Policy |
|------------|-----------|-------|--------|
| Allow authenticated to read qr_scan_logs | SELECT | authenticated | true |
| demo full access qr_scan_logs | ALL | public | auth.role() = 'authenticated' |

**Purpose:** Logs of QR code scans for audit trail. All authenticated users can read and manage scan logs.

---

### 11. **audit_logs**
**RLS Enabled:** Yes (Forced)

| Policy Name | Operation | Roles | Policy |
|------------|-----------|-------|--------|
| Allow authenticated to read audit_logs | SELECT | authenticated | true |
| Service role can manage audit_logs | ALL | service_role | true |
| demo full access audit_logs | ALL | public | auth.role() = 'authenticated' |

**Purpose:** System audit logs tracking all data changes. All authenticated users can read logs. Service role can manage logs programmatically.

---

## Security Notes

### Key Security Principles Applied:

1. **Authentication Required**: Most operations require authentication
2. **Service Role Access**: Service role has elevated permissions for system operations (user creation, etc.)
3. **Own Data Access**: Users can manage their own profiles using `auth.uid() = id`
4. **Public Read Access**: Some data (user profiles, schedules) are publicly readable for UX purposes
5. **RLS Enforcement**: FORCE ROW LEVEL SECURITY is enabled on critical tables

### Important Considerations:

- **"demo full access" policies**: These provide broad access to authenticated users for demo/development purposes. Consider restricting these in production based on specific role requirements.
- **Public read access**: User profiles and schedules are publicly readable. If this is too permissive for your use case, consider restricting to authenticated users only.
- **Service role**: Only used by Edge Functions and system operations. Never expose service role key to clients.

### Recommended Production Improvements:

1. Replace broad "demo full access" policies with role-based policies
2. Implement proper ownership checks for parents/students/sessions
3. Add policies to ensure parents can only see their own children's data
4. Add policies to ensure instructors can only manage their own sessions
5. Consider adding separate policies for admin operations vs regular user operations
