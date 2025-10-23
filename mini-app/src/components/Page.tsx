import { useNavigate } from 'react-router-dom';
import { closeMiniApp, hideBackButton, onBackButtonClick, showBackButton } from '@telegram-apps/sdk-react';
import { type PropsWithChildren, useEffect } from 'react';
import { Button } from './ui/button';

export function Page({ children, back = true }: PropsWithChildren<{
  /**
   * True if it is allowed to go back from this page.
   */
  back?: boolean
}>) {
  const navigate = useNavigate();

  useEffect(() => {
    if (back) {
      if (showBackButton.isSupported() && showBackButton.isAvailable()) {
        showBackButton();
        return onBackButtonClick(() => {
          if (window.history.state && window.history.state.idx > 0) {
            navigate(-1);
          } else {
            closeMiniApp()
          }
        });
      }
      return
    }
    
    hideBackButton();
  }, [back]);

  return <>
    {back && (<Button variant="link" onClick={() => {
      if (window.history.state && window.history.state.idx > 0) {
        navigate(-1);
      }
    }}>Back</Button>)}
    {children}
  </>;
}