import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from './firebase';

export async function uploadImage(file: File, folder: string): Promise<string> {
  const ext = file.name.split('.').pop() ?? 'jpg';
  const path = `${folder}/${crypto.randomUUID()}.${ext}`;
  const storageRef = ref(storage, path);
  await uploadBytes(storageRef, file);
  return getDownloadURL(storageRef);
}
