import { supabase } from '../lib/supabase';
import { UserProfile, Role, Parent, CreateUserRequest } from '../types';
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

  static async getAllParents(): Promise<Parent[]> {
    // First get parents with user profiles
    const { data: parentsData, error: parentsError } = await supabase
      .from('parents')
      .select(`
        id,
        user_id,
        qr_code,
        created_at,
        user_profiles (
          id,
          full_name,
          role_id,
          created_at
        )
      `)
      .order('created_at', { ascending: false });

    if (parentsError) {
      throw new Error(`Failed to fetch parents: ${parentsError.message}`);
    }

    // Get roles separately
    const { data: rolesData, error: rolesError } = await supabase
      .from('roles')
      .select('*');

    if (rolesError) {
      throw new Error(`Failed to fetch roles: ${rolesError.message}`);
    }

    // Get student links separately
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
          subject
        )
      `);

    if (linksError) {
      throw new Error(`Failed to fetch student links: ${linksError.message}`);
    }

    return parentsData.map(parent => this.mapParentFromDB(parent, rolesData, linksData));
  }

  static async createUserWithProfile(request: CreateUserRequest): Promise<{ user: any; parent?: Parent }> {
    // For demo purposes, create a mock user ID since admin API requires service role
    const mockUserId = crypto.randomUUID();
    const authData = { user: { id: mockUserId, email: request.email } };

    // Get role ID
    const { data: roleData, error: roleError } = await supabase
      .from('roles')
      .select('id')
      .eq('role_name', request.role)
      .single();

    if (roleError) {
      throw new Error(`Failed to find role: ${roleError.message}`);
    }

    // Create user profile
    const { error: profileError } = await supabase
      .from('user_profiles')
      .insert({
        id: mockUserId,
        full_name: request.fullName,
        role_id: roleData.id
      });

    if (profileError) {
      throw new Error(`Failed to create user profile: ${profileError.message}`);
    }

    let parent: Parent | undefined;

    // If creating a parent, create parent record and link to students
    if (request.role === 'parent') {
      // Generate QR code
      const qrCode = `QR_${Math.random().toString(36).substr(2, 8).toUpperCase()}`;

      // Create parent record
      const { data: parentData, error: parentError } = await supabase
        .from('parents')
        .insert({
          user_id: mockUserId,
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
      const parentList = await this.getAllParents();
      parent = parentList.find(p => p.id === parentData.id);
    }

    return { user: authData.user, parent };
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
    // Generate new QR code
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
  }

  private static mapRoleFromDB(role: RoleRow): Role {
    return {
      id: role.id,
      roleName: role.role_name
    };
  }

  private static mapParentFromDB(parent: any, roles: any[], links: any[]): Parent {
    const role = roles.find(r => r.id === parent.user_profiles?.role_id);
    const parentLinks = links.filter(l => l.parent_id === parent.id);

    return {
      id: parent.id,
      userId: parent.user_id,
      userProfile: parent.user_profiles ? {
        id: parent.user_profiles.id,
        fullName: parent.user_profiles.full_name,
        roleId: parent.user_profiles.role_id,
        roleName: role?.role_name,
        createdAt: parent.user_profiles.created_at
      } : undefined,
      qrCode: parent.qr_code,
      linkedStudents: parentLinks.map((link: any) => ({
        id: link.students?.id || '',
        name: link.students?.name || '',
        studentId: link.students?.student_id || '',
        email: link.students?.email || '',
        level: link.students?.level || '',
        subject: link.students?.subject || '',
        schedule: {},
        enrollmentDate: '',
        status: 'active'
      })),
      createdAt: parent.created_at
    };
  }
}