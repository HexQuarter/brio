import { createOrg } from '@/lib/yourvoice/api';
import OrgRegistrationForm from '@/components/yourvoice/OrgRegistrationForm';

import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { retrieveRawInitData } from "@telegram-apps/sdk-react";

export function YourVoiceCreateOrgPage() {
  const navigate = useNavigate();

  const tgData = retrieveRawInitData() as string

  const handleCreateOrg = async (data: any) => {
    data.tgInitData = tgData
    const res = await createOrg(data)
    if (res.status != 201) {
      const { error } = await res.json()
      throw new Error(error)
    }

    const org = await res.json()

    await new Promise(r => setTimeout(r, 1000));
    toast.success(`Organization "${org.name}" created successfully!`);

    await new Promise(r => setTimeout(r, 500));
    navigate(`/app/yourvoice?org=${org.id}`)
  }

  return (
    <div className=''>
      <OrgRegistrationForm onSubmit={handleCreateOrg} />
    </div>
  );
}
