import { MainLayout } from '@/components/layout/MainLayout';
import { ProfileContent } from '@/components/ProfileContent';

export const metadata = {
  title: 'Hesabım',
};

export default function ProfilePage() {
  return (
    <MainLayout>
      <ProfileContent />
    </MainLayout>
  );
}
