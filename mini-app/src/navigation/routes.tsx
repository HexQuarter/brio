import type { ComponentType, JSX } from 'react';

import { WelcomePage } from '@/pages/WelcomePage';
import { SetupWalletPage } from '@/pages/SetupWalletPage';
import { CreateWalletPage } from '@/pages/CreateWalletPage';
import { SecureWalletPage } from '@/pages/SecureWalletPage';

interface Route {
  path: string;
  Component: ComponentType;
  title?: string;
  icon?: JSX.Element;
}

export const routes: Route[] = [
  { path: '/welcome', Component: WelcomePage },
  { path: '/wallet/setup', Component: SetupWalletPage, title: 'Setup Wallet' },
  { path: '/wallet/create', Component: CreateWalletPage, title: 'Create Wallet' },
  { path: '/wallet/secure', Component: SecureWalletPage, title: 'Secure Wallet' }
];
