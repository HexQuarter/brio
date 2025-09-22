import { Title, LargeTitle, Button } from '@telegram-apps/telegram-ui';
import type { FC } from 'react';

import { Page } from '@/components/Page.tsx';
import { ComingSoon } from '@/components/ComingSoon';

import { useTranslation } from 'react-i18next';

export const IndexPage: FC = () => {
  const { t } = useTranslation();


  return (
    <Page back={false}>
      <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', height: '90vh' }}>
        <div style={{ alignItems: 'center', display: 'flex', flexDirection: 'column', gap: 30 }}>
          <LargeTitle>{t('welcome.title')}</LargeTitle>
          <Title>{t('welcome.description')}</Title>
          <div>
            <Button size="l" style={{ marginTop: 20, marginBottom: 20 }}>{t('welcome.button')}</Button>
          </div>
        </div>
        <ComingSoon />
      </div>
    </Page>
  );
};
