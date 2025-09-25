import { supabase } from '../lib/supabase';

export class QRService {
  static async generateQRCodeImage(qrCode: string): Promise<string> {
    try {
      // Generate QR code using a public API service
      const qrApiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(qrCode)}`;
      
      // Fetch the QR code image
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
        // Return the direct API URL as fallback
        return qrApiUrl;
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('qr-codes')
        .getPublicUrl(fileName);

      return urlData.publicUrl;
    } catch (error) {
      console.error('QR code generation error:', error);
      // Fallback to direct API URL
      return `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(qrCode)}`;
    }
  }

  static async updateParentQRCodeUrl(parentId: string, qrCodeUrl: string): Promise<void> {
    const { error } = await supabase
      .from('parents')
      .update({ qr_code_url: qrCodeUrl })
      .eq('id', parentId);

    if (error) {
      throw new Error(`Failed to update QR code URL: ${error.message}`);
    }
  }

  static async deleteQRCodeImage(qrCode: string): Promise<void> {
    const fileName = `${qrCode}.png`;
    const { error } = await supabase.storage
      .from('qr-codes')
      .remove([fileName]);

    if (error) {
      console.warn('Failed to delete QR code image:', error.message);
    }
  }
}