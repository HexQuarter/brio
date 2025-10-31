import { useTranslation } from "react-i18next"
import { AppsGrid } from "@/components/AppsGrid";
import { ComingSoon } from "@/components/ComingSoon";

export const AppsPage = () => {
    const { t } = useTranslation()

    return (
        <div className='flex flex-col justify-between h-screen pb-20'>
            <div className='flex flex-col gap-10 items-center'>
                <h1 className='text-3xl'>
                    <span className='font-normal'>{t('welcome.title')}</span>
                    <span className='ml-4 font-semibold'>Brio</span>
                </h1>
                <p className=''>{t('welcome.whattodo')}</p>
                <AppsGrid />
                <div className="w-full absolute bottom-0 mb-5 p-5">
                    <ComingSoon />
                </div>
            </div>
        </div>
    )
}