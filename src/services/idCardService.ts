import { supabase } from '../lib/supabase';
import { StudentQRCode, IDCardTemplate, Student } from '../types';
import { Database } from '../lib/database.types';

type StudentQRCodeRow = Database['public']['Tables']['student_qr_codes']['Row'];
type StudentQRCodeInsert = Database['public']['Tables']['student_qr_codes']['Insert'];

export class IDCardService {
  // Initialize storage buckets with proper error handling
  static async initializeStorage(): Promise<void> {
    try {
      // Check if buckets exist first
      const { data: buckets } = await supabase.storage.listBuckets();
      const existingBuckets = buckets?.map(b => b.name) || [];

      // Create QR codes bucket if it doesn't exist
      if (!existingBuckets.includes('qr-codes')) {
        const { error: qrBucketError } = await supabase.storage.createBucket('qr-codes', {
          public: true,
          allowedMimeTypes: ['image/png', 'image/jpeg'],
          fileSizeLimit: 1024 * 1024 // 1MB
        });

        if (qrBucketError) {
          console.warn('Failed to create qr-codes bucket:', qrBucketError.message);
        }
      }

      // Create ID cards bucket if it doesn't exist
      if (!existingBuckets.includes('id-cards')) {
        const { error: cardsBucketError } = await supabase.storage.createBucket('id-cards', {
          public: true,
          allowedMimeTypes: ['image/png', 'image/jpeg', 'application/pdf'],
          fileSizeLimit: 5 * 1024 * 1024 // 5MB
        });

        if (cardsBucketError) {
          console.warn('Failed to create id-cards bucket:', cardsBucketError.message);
        }
      }

      // Set up bucket policies for public access
      await this.setupBucketPolicies();
    } catch (error) {
      console.warn('Storage initialization error:', error);
    }
  }

  // Setup bucket policies for public access
  private static async setupBucketPolicies(): Promise<void> {
    try {
      // Note: In a real Supabase project, you would set up RLS policies
      // For demo purposes, we'll rely on the public bucket setting
      console.log('Storage buckets initialized with public access');
    } catch (error) {
      console.warn('Failed to setup bucket policies:', error);
    }
  }

  // Fallback method to create buckets during operation
  private static async ensureBucketExists(bucketName: string): Promise<void> {
    try {
      // Try to get bucket info
      const { data, error } = await supabase.storage.getBucket(bucketName);
      
      if (error && error.message.includes('not found')) {
        // Bucket doesn't exist, create it
        const bucketConfig = bucketName === 'qr-codes' ? {
          public: true,
          allowedMimeTypes: ['image/png', 'image/jpeg'],
          fileSizeLimit: 1024 * 1024
        } : {
          public: true,
          allowedMimeTypes: ['image/png', 'image/jpeg', 'application/pdf'],
          fileSizeLimit: 5 * 1024 * 1024
        };

        const { error: createError } = await supabase.storage.createBucket(bucketName, bucketConfig);
        if (createError) {
          console.warn(`Failed to create ${bucketName} bucket:`, createError.message);
        }
      }
    } catch (error) {
      console.warn(`Error ensuring ${bucketName} bucket exists:`, error);
    }
  }

  // Enhanced QR code image generation with bucket creation
  static async generateQRCodeImage(qrCode: string): Promise<string> {
    try {
      // Ensure bucket exists
      await this.ensureBucketExists('qr-codes');

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

  // Enhanced ID card image generation with bucket creation
  static async generateIDCardImage(template: IDCardTemplate): Promise<string> {
    try {
      // Ensure bucket exists
      await this.ensureBucketExists('id-cards');

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

      // Convert canvas to blob
      const blob = await new Promise<Blob>((resolve) => {
        canvas.toBlob((blob) => resolve(blob!), 'image/png', 0.9);
      });

      // Upload to storage with retry logic
      const fileName = `id-card-${template.studentId}-${Date.now()}.png`;
      let uploadAttempts = 0;
      const maxAttempts = 3;

      while (uploadAttempts < maxAttempts) {
        try {
          const { data: uploadData, error: uploadError } = await supabase.storage
            .from('id-cards')
            .upload(fileName, blob, {
              contentType: 'image/png',
              upsert: true
            });

          if (uploadError) {
            throw uploadError;
          }

          // Get public URL
          const { data: urlData } = supabase.storage
            .from('id-cards')
            .getPublicUrl(fileName);

          return urlData.publicUrl;
        } catch (error) {
          uploadAttempts++;
          if (uploadAttempts >= maxAttempts) {
            throw new Error(`Failed to upload ID card after ${maxAttempts} attempts: ${error}`);
          }
          // Wait before retry
          await new Promise(resolve => setTimeout(resolve, 1000 * uploadAttempts));
        }
      }

      throw new Error('Failed to upload ID card');
    } catch (error) {
      console.error('ID card generation error:', error);
      throw error;
    }
  }
        public: true,
        allowedMimeTypes: ['image/png', 'image/jpeg'],
        fileSizeLimit: 1024 * 1024 // 1MB
      });

      if (qrBucketError && !qrBucketError.message.includes('already exists')) {
        console.warn('Failed to create qr-codes bucket:', qrBucketError.message);
      }

      // Create ID cards bucket
      const { error: cardsBucketError } = await supabase.storage.createBucket('id-cards', {
        public: true,
        allowedMimeTypes: ['image/png', 'image/jpeg', 'application/pdf'],
        fileSizeLimit: 5 * 1024 * 1024 // 5MB
      });

      if (cardsBucketError && !cardsBucketError.message.includes('already exists')) {
        console.warn('Failed to create id-cards bucket:', cardsBucketError.message);
      }
    } catch (error) {
      console.warn('Storage initialization error:', error);
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

  // Generate QR code image using external API
  static async generateQRCodeImage(qrCode: string): Promise<string> {
    try {
      // Initialize storage if needed
      await this.initializeStorage();

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
      studentId: student.studentId,
      qrCode: qrCode.qrCode,
      qrCodeUrl: qrCode.qrCodeUrl || ''
    };

    // Generate ID card image
    const cardUrl = await this.generateIDCardImage(template);
    template.cardUrl = cardUrl;

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

  // Generate ID card image using HTML Canvas
  static async generateIDCardImage(template: IDCardTemplate): Promise<string> {
    try {
      await this.initializeStorage();

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

      // Convert canvas to blob
      const blob = await new Promise<Blob>((resolve) => {
        canvas.toBlob((blob) => resolve(blob!), 'image/png', 0.9);
      });

      // Upload to storage
      const fileName = `id-card-${template.studentId}-${Date.now()}.png`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('id-cards')
        .upload(fileName, blob, {
          contentType: 'image/png',
          upsert: true
        });

      if (uploadError) {
        throw new Error(`Failed to upload ID card: ${uploadError.message}`);
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('id-cards')
        .getPublicUrl(fileName);

      return urlData.publicUrl;
    } catch (error) {
      console.error('ID card generation error:', error);
      throw error;
    }
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