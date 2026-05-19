import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { doc, updateDoc } from 'firebase/firestore';
import { storage, db } from '@/lib/firebase';

/**
 * Upload a 3D model (GLB) to Firebase Storage and update the product.
 */
export async function upload3DModel(
  file: File,
  productId: string,
): Promise<string> {
  const ext = file.name.split('.').pop() ?? 'glb';
  const path = `models/${productId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
  const storageRef = ref(storage, path);
  await uploadBytes(storageRef, file);
  const url = await getDownloadURL(storageRef);

  // Update product with model URL
  await updateDoc(doc(db, 'products', productId), { model3dUrl: url });

  return url;
}
