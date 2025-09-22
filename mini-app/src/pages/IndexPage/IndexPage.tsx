import { Title, LargeTitle, Button } from '@telegram-apps/telegram-ui';
import type { FC } from 'react';

import { Page } from '@/components/Page.tsx';
import { ComingSoon } from '@/components/ComingSoon';

export const IndexPage: FC = () => {
  return (
    <Page back={false}>
      <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', height: '90vh' }}>
        <div style={{ alignItems: 'center', display: 'flex', flexDirection: 'column', gap: 30 }}>
          <LargeTitle>Welcome to Brio</LargeTitle>
          <Title>
            Now you can send and receive Bitcoin
            securely to anyone in the telegram
            community - just using their telegram handle 
            or number
          </Title>
          <div>
            <Button size="l" style={{ marginTop: 20, marginBottom: 20 }}>Get Started</Button>
          </div>
        </div>
        <ComingSoon />
      </div>
    </Page>
  );
};
