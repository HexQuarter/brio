import type { FC } from 'react';

import { Page } from '@/components/Page.tsx';
import { ComingSoon } from '@/components/ComingSoon';

import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';

import { useNavigate } from "react-router-dom";

export const WelcomePage: FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  return (
    <Page back={false}>
      <div className='flex flex-col justify-between h-screen pb-20'>
        <div style={{ alignItems: 'center', display: 'flex', flexDirection: 'column', gap: 30 }}>
          <h1 className='text-6xl'><span className='font-normal'>{t('welcome.title')}</span><span className='ml-4 font-semibold'>Brio</span></h1>
          <p className=''>{t('welcome.description')}</p>
          <div>
            <Button className="" onClick={() => navigate('/wallet/setup') }>{t('welcome.button')}</Button>
          </div>
        </div>
        <ComingSoon />
      </div>
    </Page>
  );
};
