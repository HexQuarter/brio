import { Page } from "@/components/Page";
import { Button } from "@/components/ui/button";

import { useTranslation } from "react-i18next";
import { Link, useNavigate } from "react-router-dom";

export function OnBoardingPage() {
    const { t } = useTranslation();
    const navigate = useNavigate();

    return (
        <div>
            <Page back={true}>
                <div className='flex flex-col'>
                    <div className='flex flex-col gap-20'>
                        <div className="flex flex-col gap-10">
                            <h2 className='text-4xl'>{t('walletSetup.title')}</h2>
                            <p>{t('walletSetup.description')}</p>
                        </div>
                        <div className="flex gap-5 justify-center">
                            <Button className="w-40" onClick={() => navigate('/onboarding/create-wallet')}>{t('walletSetup.createButton')}</Button>
                            <Button variant="secondary" className="w-40" onClick={() => navigate('/onboarding/restore-wallet')}>{t('walletSetup.restoreButton')}</Button>
                        </div>
                        <div className="flex justify-center align-center text-ring">
                            <Link to='/wallet?visit'>{t('walletSetup.skipButton')}</Link>
                        </div>
                    </div>
                </div>
            </Page>
        </div>
        
    );
}
