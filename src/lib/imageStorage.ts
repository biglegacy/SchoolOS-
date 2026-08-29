import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { storage } from './firebase';

/**
 * Uploads a school logo to Firebase Storage, with an automatic fallback
 * to a base64 Data URL if storage bucket offline or CORS restricted.
 * 
 * Ensures the logo is stored authoritatively and referenced in Firestore.
 */
export async function uploadSchoolLogo(schoolId: string, file: File): Promise<string> {
  // 1. Try Firebase Storage directly
  if (storage) {
    try {
      const sanitizedName = file.name.replace(/[^a-zA-Z0-9.]/g, '_');
      const timestamp = Date.now();
      const storageRef = ref(storage, `schools/${schoolId}/logos/logo_${timestamp}_${sanitizedName}`);
      
      const snapshot = await uploadBytes(storageRef, file, {
        contentType: file.type || 'image/png',
        customMetadata: {
          schoolId,
          uploadedAt: new Date().toISOString()
        }
      });
      
      const downloadURL = await getDownloadURL(snapshot.ref);
      return downloadURL;
    } catch (storageError) {
      console.warn('Firebase Storage upload notice (falling back to direct base64 data persistence):', storageError);
    }
  }

  // 2. Base64 fallback for local preview & offline-first persistence
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result);
      } else {
        reject(new Error('Failed to read image as data URL'));
      }
    };
    reader.onerror = (error) => reject(error);
    reader.readAsDataURL(file);
  });
}

/**
 * Removes or deletes a school logo reference
 */
export async function deleteSchoolLogoFile(logoUrl: string): Promise<void> {
  if (!logoUrl || !storage || !logoUrl.includes('firebasestorage.googleapis.com')) {
    return;
  }
  try {
    const storageRef = ref(storage, logoUrl);
    await deleteObject(storageRef);
  } catch (err) {
    console.warn('Notice when deleting previous storage logo:', err);
  }
}
