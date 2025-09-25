import { supabase } from '../lib/supabase';
import { StudentQRCode, IDCardTemplate, Student } from '../types';
import { Database } from '../lib/database.types';

type StudentQRCodeRow = Database['public']['Tables']['student_qr_codes']['Row'];
type StudentQRCodeInsert = Database['public']['Tables']['student_qr_codes']['Insert'];

export class IDCardService {
  // QR code image generation
  static async generateQRCodeImage(qrCode: string): Promise<string> {
    try {
      // Generate QR code using external API
      const qrApiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&format=png&data=${encodeURIComponent(qrCode)}`;
      
      const response = await fetch(qrApiUrl);
      if (!response.ok) {
        throw new Error('Failed to generate QR code image');
      }

      const blob = await response.blob();
      
      // Upload to Supabase Storage
      const fileName = `${qrCode}.png`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('qr-codes')
        .upload(fileName, blob, {
          contentType: 'image/png',
          upsert: true
        });

      if (uploadError) {
        console.warn('Failed to upload QR code to storage:', uploadError.message);
        return qrApiUrl; // Return direct API URL as fallback
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('qr-codes')
        .getPublicUrl(fileName);

      return urlData.publicUrl;
    } catch (error) {
      console.error('QR code generation error:', error);
      // Fallback to direct API URL
      return `https://api.qrserver.com/v1/create-qr-code/?size=300x300&format=png&data=${encodeURIComponent(qrCode)}`;
    }
  }

  // ID card image generation
  static async generateIDCardImage(template: IDCardTemplate): Promise<string> {
    try {
      // Create canvas for ID card
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Failed to get canvas context');

      // Set card dimensions (standard ID card size: 3.375" x 2.125" at 300 DPI)
      canvas.width = 1012; // 3.375 * 300
      canvas.height = 638;  // 2.125 * 300

      // Card background
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Card border
      ctx.strokeStyle = '#e5e7eb';
      ctx.lineWidth = 4;
      ctx.strokeRect(0, 0, canvas.width, canvas.height);

      // Header background
      ctx.fillStyle = '#3b82f6';
      ctx.fillRect(0, 0, canvas.width, 120);

      // Header text
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 36px Arial, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('StarTrak Academy', canvas.width / 2, 50);
      ctx.font = '24px Arial, sans-serif';
      ctx.fillText('Student ID Card', canvas.width / 2, 85);

      // Student name
      ctx.fillStyle = '#1f2937';
      ctx.font = 'bold 48px Arial, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(template.studentName, canvas.width / 2, 200);

      // Student ID
      ctx.font = '32px Arial, sans-serif';
      ctx.fillStyle = '#6b7280';
      ctx.fillText(`ID: ${template.studentId}`, canvas.width / 2, 250);

      // QR Code section
      if (template.qrCodeUrl) {
        try {
          const qrImage = new Image();
          qrImage.crossOrigin = 'anonymous';
          
          await new Promise((resolve, reject) => {
            qrImage.onload = resolve;
            qrImage.onerror = reject;
            qrImage.src = template.qrCodeUrl;
          });

          // Draw QR code
          const qrSize = 200;
          const qrX = (canvas.width - qrSize) / 2;
          const qrY = 300;
          
          ctx.drawImage(qrImage, qrX, qrY, qrSize, qrSize);
          
          // QR code label
          ctx.font = '20px Arial, sans-serif';
          ctx.fillStyle = '#6b7280';
          ctx.textAlign = 'center';
          ctx.fillText('Scan for Attendance', canvas.width / 2, 530);
        } catch (error) {
          console.warn('Failed to load QR code image:', error);
          // Draw placeholder
          ctx.fillStyle = '#f3f4f6';
          ctx.fillRect((canvas.width - 200) / 2, 300, 200, 200);
          ctx.fillStyle = '#9ca3af';
          ctx.font = '24px Arial, sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText('QR Code', canvas.width / 2, 410);
        }
      }

      // Footer
      ctx.font = '18px Arial, sans-serif';
      ctx.fillStyle = '#9ca3af';
      ctx.textAlign = 'center';
      ctx.fillText('Keep this card with you at all times', canvas.width / 2, 580);

      // Convert canvas to data URL (base64)
      const dataUrl = canvas.toDataURL('image/png', 0.9);
      
      // Try to upload to storage, but fallback to data URL if it fails
      try {
        const blob = await new Promise<Blob>((resolve) => {
          canvas.toBlob((blob) => resolve(blob!), 'image/png', 0.9);
        });

        const fileName = `id-card-${template.studentId}-${Date.now()}.png`;
        
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('id-cards')
          .upload(fileName, blob, {
            contentType: 'image/png',
            upsert: true
          });

        if (!uploadError) {
          // Get public URL if upload succeeded
          const { data: urlData } = supabase.storage
            .from('id-cards')
            .getPublicUrl(fileName);
          
          return urlData.publicUrl;
        }
      } catch (storageError) {
        console.warn('Storage upload failed, using data URL fallback:', storageError);
      }
      
      // Return data URL as fallback
      return dataUrl;
    } catch (error) {
      console.error('ID card generation error:', error);
      throw error;
    }
  }

  // Generate QR code for student
  static async generateStudentQRCode(studentId: string): Promise<StudentQRCode> {
    // Deactivate existing QR codes for this student
    await supabase
      .from('student_qr_codes')
      .update({ is_active: false })
      .eq('student_id', studentId);

    // Generate new QR code
    const qrCode = `STU_${studentId.slice(0, 8)}_${Date.now()}`;
    
    const qrCodeInsert: StudentQRCodeInsert = {
      student_id: studentId,
      qr_code: qrCode,
      is_active: true
    };

    const { data, error } = await supabase
      .from('student_qr_codes')
      .insert(qrCodeInsert)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create QR code: ${error.message}`);
    }

    // Generate QR code image
    const qrCodeUrl = await this.generateQRCodeImage(qrCode);
    
    // Update with QR code URL
    const { data: updatedData, error: updateError } = await supabase
      .from('student_qr_codes')
      .update({ qr_code_url: qrCodeUrl })
      .eq('id', data.id)
      .select()
      .single();

    if (updateError) {
      throw new Error(`Failed to update QR code URL: ${updateError.message}`);
    }

    return this.mapQRCodeFromDB(updatedData);
  }

  // Get active QR code for student
  static async getStudentQRCode(studentId: string): Promise<StudentQRCode | null> {
    const { data, error } = await supabase
      .from('student_qr_codes')
      .select('*')
      .eq('student_id', studentId)
      .eq('is_active', true)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw new Error(`Failed to fetch QR code: ${error.message}`);
    }

    return this.mapQRCodeFromDB(data);
  }

  // Generate ID card for single student
  static async generateIDCard(student: Student): Promise<IDCardTemplate> {
    // Get or create QR code for student
    let qrCode = await this.getStudentQRCode(student.id);
    if (!qrCode) {
      qrCode = await this.generateStudentQRCode(student.id);
    }

    const template: IDCardTemplate = {
      studentId: student.id,
      studentName: student.name,
      studentIdNumber: student.studentId,
      qrCode: qrCode.qrCode,
      qrCodeUrl: qrCode.qrCodeUrl || ''
    };

    // Generate ID card image
    const cardUrl = await this.generateIDCardImage(template);
    template.cardUrl = cardUrl;

    // Store in ID management system
    try {
      const { IDManagementService } = await import('./idManagementService');
      await IDManagementService.createGeneratedID(
        student.id,
        'student_card',
        `CARD_${student.studentId}_${Date.now()}`,
        {
          card_url: cardUrl,
          qr_code_url: qrCode.qrCodeUrl,
          student_name: student.name,
          student_id: student.studentId
        }
      );
    } catch (error) {
      console.warn('Failed to store ID in management system:', error);
    }
    return template;
  }

  // Batch generate ID cards for multiple students
  static async batchGenerateIDCards(students: Student[]): Promise<IDCardTemplate[]> {
    const templates: IDCardTemplate[] = [];
    
    for (const student of students) {
      try {
        const template = await this.generateIDCard(student);
        templates.push(template);
      } catch (error) {
        console.error(`Failed to generate ID card for ${student.name}:`, error);
        // Continue with other students
      }
    }

    return templates;
  }

  // Get all QR codes for students
  static async getAllStudentQRCodes(): Promise<StudentQRCode[]> {
    const { data, error } = await supabase
      .from('student_qr_codes')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch QR codes: ${error.message}`);
    }

    return data.map(this.mapQRCodeFromDB);
  }

  // Delete QR code and associated files
  static async deleteStudentQRCode(qrCodeId: string): Promise<void> {
    const { data: qrCode, error: fetchError } = await supabase
      .from('student_qr_codes')
      .select('*')
      .eq('id', qrCodeId)
      .single();

    if (fetchError) {
      throw new Error(`Failed to fetch QR code: ${fetchError.message}`);
    }

    // Delete from storage
    if (qrCode.qr_code) {
      await supabase.storage
        .from('qr-codes')
        .remove([`${qrCode.qr_code}.png`]);
    }

    // Delete from database
    const { error: deleteError } = await supabase
      .from('student_qr_codes')
      .delete()
      .eq('id', qrCodeId);

    if (deleteError) {
      throw new Error(`Failed to delete QR code: ${deleteError.message}`);
    }
  }

  private static mapQRCodeFromDB(qrCode: StudentQRCodeRow): StudentQRCode {
    return {
      id: qrCode.id,
      studentId: qrCode.student_id,
      qrCode: qrCode.qr_code,
      qrCodeUrl: qrCode.qr_code_url || undefined,
      isActive: qrCode.is_active || false,
      createdAt: qrCode.created_at || '',
      updatedAt: qrCode.updated_at || ''
    };
  }
}