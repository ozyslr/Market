import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '../lib/firebase';

async function resizeImage(file: File, maxSize = 400): Promise<Blob> {
  return new Promise((resolve) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const scale = Math.min(maxSize / img.width, maxSize / img.height, 1);
      canvas.width = img.width * scale;
      canvas.height = img.height * scale;
      canvas.getContext('2d')!.drawImage(img, 0, 0, canvas.width, canvas.height);
      URL.revokeObjectURL(url);
      canvas.toBlob((blob) => resolve(blob!), 'image/jpeg', 0.85);
    };
    img.src = url;
  });
}

export async function uploadProfilePhoto(userId: string, file: File): Promise<string> {
  const resized = await resizeImage(file, 400);
  const storageRef = ref(storage, `profilePhotos/${userId}`);
  await uploadBytes(storageRef, resized, { contentType: 'image/jpeg' });
  return getDownloadURL(storageRef);
}

export async function uploadCategoryImage(categoryId: string, file: File): Promise<string> {
  const resized = await resizeImage(file, 800);
  const storageRef = ref(storage, `categoryImages/${categoryId}`);
  await uploadBytes(storageRef, resized, { contentType: 'image/jpeg' });
  return getDownloadURL(storageRef);
}

export async function uploadDealImage(dealId: string, file: File): Promise<string> {
  const resized = await resizeImage(file, 800);
  const storageRef = ref(storage, `dealImages/${dealId}`);
  await uploadBytes(storageRef, resized, { contentType: 'image/jpeg' });
  return getDownloadURL(storageRef);
}
