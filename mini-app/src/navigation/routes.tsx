import type { ComponentType, JSX } from 'react';

import { WelcomePage } from '@/pages/WelcomePage';
import { SetupWalletPage } from '@/pages/SetupWalletPage';
import { CreateWalletPage } from '@/pages/CreateWalletPage';
import { SecureWalletPage } from '@/pages/SecureWalletPage';
import { RestoreWalletPage } from '@/pages/RestoreWalletPage';
import { MainPage } from '@/pages/MainPage';

interface Route {
  path: string;
  Component: ComponentType;
  title?: string;
  icon?: JSX.Element;
}

export const routes: Route[] = [
  { path: '/welcome', Component: WelcomePage },
  { path: '/wallet/setup', Component: SetupWalletPage, title: 'Setup Wallet | Brio' },
  { path: '/wallet/create', Component: CreateWalletPage, title: 'Create Wallet | Brio' },
  { path: '/wallet/restore', Component: RestoreWalletPage, title: 'Restore Wallet | Brio' },
  { path: '/wallet/secure', Component: SecureWalletPage, title: 'Secure Wallet | Brio' },
  { path: '*', Component: MainPage, title: 'Brio' },
];
