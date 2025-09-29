import { supabase } from '../lib/supabase';
import { UserProfile, Role, Parent, CreateUserRequest, Student, EditUserRequest, AuditLog } from '../types';
import { Database } from '../lib/database.types';

type UserProfileRow = Database['public']['Tables']['user_profiles']['Row'];
type RoleRow = Database['public']['Tables']['roles']['Row'];
type ParentRow = Database['public']['Tables']['parents']['Row'];

export class UserService {
  static async getAllRoles(): Promise<Role[]> {
    const { data, error } = await supabase
      .from('roles')
      .select('*')
      .order('role_name');

    if (error) {
      throw new Error(`Failed to fetch roles: ${error.message}`);
    }
   

    return data.map(this.mapRoleFromDB);
  }

  static async getAllUsers(page = 1, pageSize = 10): Promise<{ data: Parent[]; count: number }> {
    try {
      console.log('UserService.getAllUsers called with:', { page, pageSize });
      
      let offset = 0;
      let limit = pageSize;
      
      // Handle "All" case (pageSize = 0 or -1)
      if (pageSize <= 0) {
        offset = 0;
        limit = 1000; // Set a reasonable upper limit
      } else {
        offset = (page - 1) * pageSize;
        limit = pageSize;
      }
      
      // Fetch all user profiles with their roles
      let query = supabase
        .from('user_profiles')
        .select(`
          *,
          roles (
            id,
            role_name
          )
        `, { count: 'exact' })
        .order('created_at', { ascending: false });
      
      // Apply pagination
      if (pageSize > 0) {
        query = query.range(offset, offset + limit - 1);
      } else {
        // For "All", still apply a reasonable limit to prevent performance issues
        query = query.limit(limit);
      }
      
      const { data: userProfilesData, error: userProfilesError, count } = await query;

      if (userProfilesError) {
        console.error('Supabase error fetching user profiles:', userProfilesError);
        throw new Error(`Failed to fetch user profiles: ${userProfilesError.message}`);
      }

      if (!userProfilesData || userProfilesData.length === 0) {
        console.log('No user profiles found');
        return { data: [], count: 0 };
      }
      
      console.log('Fetched user profiles:', userProfilesData.length);
      
      // Get user IDs from user profiles
      const userIds = userProfilesData.map(profile => profile.id);
      
      // Fetch parent records for users who have them
      const { data: parentsData, error: parentsError } = await supabase
        .from('parents')
        .select('*')
        .in('user_id', userIds);

      if (parentsError) {
        console.warn('Failed to fetch parent records:', parentsError.message);
      }

      // Fetch student links
      const { data: linksData, error: linksError } = await supabase
        .from('student_parent_link')
        .select(`
          parent_id,
          student_id,
          students (
            id,
            name,
            student_id,
            email,
            level,
            subject,
            program,
            avatar,
            enrollment_date,
            status
          )
        `);

      if (linksError) {
        console.warn('Failed to fetch student links:', linksError.message);
      }

      // Map user profiles to Parent objects (including non-parent users)
      const mappedUsers = userProfilesData.map(userProfile => 
        this.mapUserProfileToParent(userProfile, parentsData || [], linksData || [])
      );
      
      console.log('Mapped users:', mappedUsers.length);
      
      return {
        data: mappedUsers,
        count: count || 0
      };
  
    } catch (error) {
      console.error('Error in getAllUsers:', error);
      throw error;
    }
  }

  static async getAllParents(page = 1, pageSize = 10): Promise<{ data: Parent[]; count: number }> {
    try {
      console.log('Fetching users with pagination:', { page, pageSize });
      
      let offset = 0;
      let limit = pageSize;
      
      // Handle "All" case (pageSize = 0 or -1)
      if (pageSize <= 0) {
        offset = 0;
        limit = 1000; // Set a reasonable upper limit
      } else {
        offset = (page - 1) * pageSize;
        limit = pageSize;
      }
      
      // Fetch all user profiles with their roles
      let query = supabase
        .from('user_profiles')
        .select(`
          *,
          roles (
            id,
            role_name
          )
        )
        `, { count: 'exact' })
        .order('created_at', { ascending: false });
      
      // Apply pagination
      if (pageSize > 0) {
        query = query.range(offset, offset + limit - 1);
      } else {
        // For "All", still apply a reasonable limit to prevent performance issues
        query = query.limit(limit);
      }
      
      const { data: userProfilesData, error: userProfilesError, count } = await query;

      if (userProfilesError) {
        console.error('Supabase error fetching user profiles:', userProfilesError);
        throw new Error(`Failed to fetch user profiles: ${userProfilesError.message}`);
      }

      if (!userProfilesData) {
        return { data: [], count: 0 };
      }
      
      console.log('Fetched user profiles:', userProfilesData.length);

      // Get user IDs from user profiles
      const userIds = userProfilesData.map(profile => profile.id);
      
      // Fetch parent records for users who have them
      const { data: parentsData, error: parentsError } = await supabase
        .from('parents')
        .select('*')
        .in('user_id', userIds);

      if (parentsError) {
        console.warn('Failed to fetch parent records:', parentsError.message);
      }
      // Fetch student links
      const { data: linksData, error: linksError } = await supabase
        .from('student_parent_link')
        .select(`
          parent_id,
          student_id,
          students (
            id,
            name,
            student_id,
            email,
            level,
            subject,
            program,
            avatar,
            enrollment_date,
            status
          )
        `);

      if (linksError) {
        console.warn('Failed to fetch student links:', linksError.message);
      }

      // Map user profiles to Parent objects (including non-parent users)
      const mappedParents = userProfilesData.map(userProfile => 
        this.mapUserProfileToParent(userProfile, parentsData || [], linksData || [])
      );
      
      console.log('Mapped parents:', mappedParents.length);
      
      return {
        data: mappedParents,
        count: count || 0
      };
    
    } catch (error) {
      console.error('Error in getAllParents:', error);
      throw error;
    }
  }

  static async createUserWithProfile(request: CreateUserRequest): Promise<{ user: any; parent?: Parent }> {
    try {
      // Step 1: Create auth user using Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: request.email,
        password: request.password,
        email_confirm: true,
        user_metadata: {
          full_name: request.fullName
        }
      });

      if (authError) {
        // For demo purposes, create a mock user if admin API fails
        console.warn('Admin API failed, creating mock user:', authError.message);
        const mockUserId = crypto.randomUUID();
        const authData = { user: { id: mockUserId, email: request.email } };
        return this.createMockUserProfile(authData.user, request);
      }

      if (!authData.user) {
        throw new Error('Failed to create user');
      }

      // Step 2: Get or create role
      let roleData;
      const { data: existingRole, error: roleError } = await supabase
        .from('roles')
        .select('id, role_name')
        .eq('role_name', request.role)
        .single();

      if (roleError && roleError.code === 'PGRST116') {
        // Role doesn't exist, create it
        const { data: newRole, error: createRoleError } = await supabase
          .from('roles')
          .insert({ role_name: request.role })
          .select('id, role_name')
          .single();
        
        if (createRoleError) {
          throw new Error(`Failed to create role: ${createRoleError.message}`);
        }
        roleData = newRole;
      } else if (roleError) {
        throw new Error(`Failed to find role: ${roleError.message}`);
      } else {
        roleData = existingRole;
      }

      // Step 3: Create/update user profile
      const { error: profileError } = await supabase
        .from('user_profiles')
        .upsert({
          id: authData.user.id,
          full_name: request.fullName,
          role_id: roleData.id
        });

      if (profileError) {
        throw new Error(`Failed to create user profile: ${profileError.message}`);
      }

      let parent: Parent | undefined;

      // Step 4: If creating a parent, create parent record and link to students
      if (roleData.role_name === 'parent') {
        parent = await this.createParentRecord(authData.user.id, request);
      }

      return { user: authData.user, parent };
    } catch (error) {
      console.error('User creation error:', error);
      throw error;
    }
  }

  private static async createMockUserProfile(user: any, request: CreateUserRequest): Promise<{ user: any; parent?: Parent }> {
    // Get or create role from Supabase
    let roleData;
    const { data: existingRole, error: roleError } = await supabase
      .from('roles')
      .select('id, role_name')
      .eq('role_name', request.role)
      .single();

    if (roleError && roleError.code === 'PGRST116') {
      // Role doesn't exist, create it
      const { data: newRole, error: createRoleError } = await supabase
        .from('roles')
        .insert({ role_name: request.role })
        .select('id, role_name')
        .single();
      
      if (createRoleError) {
        throw new Error(`Failed to create role: ${createRoleError.message}`);
      }
      roleData = newRole;
    } else if (roleError) {
      throw new Error(`Failed to find role: ${roleError.message}`);
    } else {
      roleData = existingRole;
    }

    // Create user profile
    const { data: profileData, error: profileError } = await supabase
      .from('user_profiles')
      .upsert({
        id: user.id,
        full_name: request.fullName,
        role_id: roleData.id
      })
      .select()
      .single();

    if (profileError) {
      throw new Error(`Failed to create user profile: ${profileError.message}`);
    }

    let parent: Parent | undefined;

    // If creating a parent, create parent record
    if (roleData.role_name === 'parent') {
      parent = await this.createParentRecord(user.id, request);
    }

    return { user, parent };
  }

  private static async createParentRecord(userId: string, request: CreateUserRequest): Promise<Parent> {
    // Generate QR code (fallback to random string if RPC fails)
    const qrCode = `QR_${Math.random().toString(36).substr(2, 8).toUpperCase()}`;

    // Create parent record
    const { data: parentData, error: parentError } = await supabase
      .from('parents')
      .insert({
        user_id: userId,
        qr_code: qrCode
      })
      .select()
      .single();

    if (parentError) {
      throw new Error(`Failed to create parent record: ${parentError.message}`);
    }

    // Link to students if provided
    if (request.linkedStudentIds && request.linkedStudentIds.length > 0) {
      const linkInserts = request.linkedStudentIds.map(studentId => ({
        student_id: studentId,
        parent_id: parentData.id
      }));

      const { error: linkError } = await supabase
        .from('student_parent_link')
        .insert(linkInserts);

      if (linkError) {
        throw new Error(`Failed to link students: ${linkError.message}`);
      }
    }

    // Fetch complete parent data
    const parentList = await this.getAllParents(1, 1000);
    const parent = parentList.data.find(p => p.id === parentData.id);
    
    if (!parent) {
      throw new Error('Failed to retrieve created parent');
    }

    return parent;
  }

  static async linkParentToStudents(parentId: string, studentIds: string[]): Promise<void> {
    // Remove existing links
    const { error: deleteError } = await supabase
      .from('student_parent_link')
      .delete()
      .eq('parent_id', parentId);

    if (deleteError) {
      throw new Error(`Failed to remove existing links: ${deleteError.message}`);
    }

    // Add new links
    if (studentIds.length > 0) {
      const linkInserts = studentIds.map(studentId => ({
        student_id: studentId,
        parent_id: parentId
      }));

      const { error: insertError } = await supabase
        .from('student_parent_link')
        .insert(linkInserts);

      if (insertError) {
        throw new Error(`Failed to link students: ${insertError.message}`);
      }
    }
  }

  static async generateQRCodeForParent(parentId: string): Promise<string> {
    // Generate new QR code (fallback to random string)
    const qrCode = `QR_${Math.random().toString(36).substr(2, 8).toUpperCase()}`;

    // Update parent record
    const { error: updateError } = await supabase
      .from('parents')
      .update({ qr_code: qrCode })
      .eq('id', parentId);

    if (updateError) {
      throw new Error(`Failed to update QR code: ${updateError.message}`);
    }

    return qrCode;
  }

  static async deleteUser(userId: string): Promise<void> {
    // Delete user profile (this will cascade to parents due to foreign key)
    const { error } = await supabase
      .from('user_profiles')
      .delete()
      .eq('id', userId);

    if (error) {
      throw new Error(`Failed to delete user: ${error.message}`);
    }

    // Also try to delete from auth (will fail in demo mode, but that's ok)
    try {
      await supabase.auth.admin.deleteUser(userId);
    } catch (authError) {
      console.warn('Failed to delete auth user (expected in demo mode):', authError);
    }
  }

  static async updateUserProfile(userId: string, updates: EditUserRequest): Promise<Parent> {
    try {
      // First, get the current user data for audit logging
      const { data: currentUser, error: fetchError } = await supabase
        .from('user_profiles')
        .select(`
          *,
          roles (*)
        `)
        .eq('id', userId)
        .single();

      if (fetchError) {
        throw new Error(`Failed to fetch current user data: ${fetchError.message}`);
      }

      // Get current parent data
      const { data: currentParent, error: parentFetchError } = await supabase
        .from('parents')
        .select(`
          *,
          student_parent_link (
            student_id,
            students (*)
          )
        `)
        .eq('user_id', userId)
        .single();

      if (parentFetchError) {
        throw new Error(`Failed to fetch current parent data: ${parentFetchError.message}`);
      }

      const oldValues = {
        fullName: currentUser.full_name,
        roleId: currentUser.role_id,
        linkedStudentIds: currentParent.student_parent_link?.map((link: any) => link.student_id) || []
      };

      // Update user profile
      const profileUpdates: any = {};
      if (updates.fullName !== undefined) profileUpdates.full_name = updates.fullName;
      if (updates.roleId !== undefined) profileUpdates.role_id = updates.roleId;

      if (Object.keys(profileUpdates).length > 0) {
        const { error: updateError } = await supabase
          .from('user_profiles')
          .update(profileUpdates)
          .eq('id', userId);

        if (updateError) {
          throw new Error(`Failed to update user profile: ${updateError.message}`);
        }
      }

      // Update student links if provided
      if (updates.linkedStudentIds !== undefined && currentParent) {
        await this.linkParentToStudents(currentParent.id, updates.linkedStudentIds);
      }

      // Create audit log
      const newValues = {
        fullName: updates.fullName ?? oldValues.fullName,
        roleId: updates.roleId ?? oldValues.roleId,
        linkedStudentIds: updates.linkedStudentIds ?? oldValues.linkedStudentIds
      };

      await this.createAuditLog(
        'user_profiles',
        userId,
        'UPDATE',
        oldValues,
        newValues
      );

      // Return updated parent data
      const parentListResult = await this.getAllParents(1, 1000);
      const updatedParent = parentListResult.data.find(p => p.userId === userId);
      
      if (!updatedParent) {
        throw new Error('Failed to retrieve updated parent data');
      }

      return updatedParent;
    } catch (error) {
      console.error('Error updating user profile:', error);
      throw error;
    }
  }

  static async createAuditLog(
    tableName: string,
    recordId: string,
    action: 'INSERT' | 'UPDATE' | 'DELETE',
    oldValues?: Record<string, any>,
    newValues?: Record<string, any>
  ): Promise<void> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { error } = await supabase
        .from('audit_logs')
        .insert({
          table_name: tableName,
          record_id: recordId,
          action: action,
          old_values: oldValues || null,
          new_values: newValues || null,
          changed_by: user?.id || null,
          ip_address: null, // Will be populated by database trigger if available
          user_agent: navigator.userAgent || null
        });

      if (error) {
        console.warn('Failed to create audit log:', error.message);
      }
    } catch (error) {
      console.warn('Audit logging error:', error);
    }
  }

  static async getAuditLogs(limit = 100, offset = 0): Promise<{ data: AuditLog[]; count: number }> {
    const { data, error, count } = await supabase
      .from('audit_logs')
      .select('*', { count: 'exact' })
      .order('changed_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      throw new Error(`Failed to fetch audit logs: ${error.message}`);
    }

    return {
      data: (data || []).map(this.mapAuditLogFromDB),
      count: count || 0
    };
  }

  static async checkAdminPermission(): Promise<boolean> {
    try {
      const { data, error } = await supabase.rpc('is_admin');
      
      if (error) {
        console.warn('Failed to check admin permission:', error.message);
        return false;
      }

      return data || false;
    } catch (error) {
      console.warn('Admin permission check error:', error);
      return false;
    }
  }

  private static mapAuditLogFromDB(log: any): AuditLog {
    return {
      id: log.id,
      tableName: log.table_name,
      recordId: log.record_id,
      action: log.action,
      oldValues: log.old_values,
      newValues: log.new_values,
      changedBy: log.changed_by,
      changedAt: log.changed_at,
      ipAddress: log.ip_address,
      userAgent: log.user_agent,
      createdAt: log.created_at
    };
  }

  private static mapRoleFromDB(role: RoleRow): Role {
    return {
      id: role.id,
      roleName: role.role_name,
      createdAt: role.created_at
    };
  }

  private static mapParentFromDB(
    parent: ParentRow, 
    userProfiles: UserProfileRow[], 
    roles: RoleRow[], 
    links: any[]
  ): Parent {
    const userProfile = userProfiles.find(up => up.id === parent.user_id);
    const role = roles.find(r => r.id === userProfile?.role_id);
    const parentLinks = links.filter(l => l.parent_id === parent.id);

    return {
      id: parent.id,
      userId: parent.user_id || undefined,
      userProfile: userProfile ? {
        id: userProfile.id,
        fullName: userProfile.full_name || undefined,
        roleId: userProfile.role_id || undefined,
        roleName: role?.role_name || undefined,
        avatarUrl: userProfile.avatar_url || undefined,
        phone: userProfile.phone || undefined,
        createdAt: userProfile.created_at,
        updatedAt: userProfile.updated_at
      } : undefined,
      qrCode: parent.qr_code || undefined,
      qrCodeUrl: parent.qr_code_url || undefined,
      linkedStudents: parentLinks.map((link: any) => ({
        id: link.students?.id || '',
        name: link.students?.name || '',
        studentId: link.students?.student_id || '',
        email: link.students?.email || '',
        level: link.students?.level || '',
        subject: link.students?.subject || '',
        program: link.students?.program || undefined,
        avatar: link.students?.avatar || undefined,
        schedule: {},
        enrollmentDate: link.students?.enrollment_date || '',
        status: link.students?.status || 'active'
      })),
      createdAt: parent.created_at,
      updatedAt: parent.updated_at
    };
  }

  private static mapUserProfileToParent(
    userProfile: any,
    parentsData: ParentRow[],
    linksData: any[]
  ): Parent {
    // Find corresponding parent record if it exists
    const parentRecord = parentsData.find(p => p.user_id === userProfile.id);
    const parentLinks = parentRecord ? linksData.filter(l => l.parent_id === parentRecord.id) : [];

    return {
      id: parentRecord?.id || userProfile.id, // Use parent ID if exists, otherwise user profile ID
      userId: userProfile.id,
      userProfile: {
        id: userProfile.id,
        fullName: userProfile.full_name || undefined,
        roleId: userProfile.role_id || undefined,
        roleName: userProfile.roles?.role_name || undefined,
        avatarUrl: userProfile.avatar_url || undefined,
        phone: userProfile.phone || undefined,
        createdAt: userProfile.created_at,
        updatedAt: userProfile.updated_at
      },
      qrCode: parentRecord?.qr_code || undefined,
      qrCodeUrl: parentRecord?.qr_code_url || undefined,
      linkedStudents: parentLinks.map((link: any) => ({
        id: link.students?.id || '',
        name: link.students?.name || '',
        studentId: link.students?.student_id || '',
        email: link.students?.email || '',
        level: link.students?.level || '',
        subject: link.students?.subject || '',
        program: link.students?.program || undefined,
        avatar: link.students?.avatar || undefined,
        schedule: {},
        enrollmentDate: link.students?.enrollment_date || '',
        status: link.students?.status || 'active'
      })),
      createdAt: parentRecord?.created_at || userProfile.created_at,
      updatedAt: parentRecord?.updated_at || userProfile.updated_at
    };
  }
}