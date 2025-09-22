import React, { useState } from 'react';
import { Carousel, CarouselApi, CarouselContent, CarouselItem } from './ui/carousel';

const data = [
    {
        description: 'No KYC, No personal information, you are in charge of your own BTC',
        title: 'Bitcoin Marketplace',
        background: 'conic-gradient(from 0.25turn at 50% 50%, rgb(229, 90, 35), rgb(255, 148, 44))'
    },
    {
        description: 'Have fun with games and betting between friends. Place friendly bets with instant micro-payments - nearly fee-less',
        title: 'Who’s right',
        background: '#FFD964'
    },
    {
        description: 'Join/Create community savings pools with friends and family. Collect, track and distribute funds with complete transparency. Even borrow against your BTC!',
        title: 'Saving Circles',
        background: 'radial-gradient(#BE3FF4, #C0A0E7)'
    }
]

export const ComingSoon: React.FC = () => {
    const [api, setApi] = React.useState<CarouselApi>()
    const [current, setCurrent] = React.useState(0)

    React.useEffect(() => {
        if (!api) {
            return
        }
    
        setCurrent(api.selectedScrollSnap() + 1)
    
        api.on("select", () => {
            setCurrent(api.selectedScrollSnap() + 1)
        })
    }, [api])

    return (
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <p>Upcoming features</p>
            <Carousel setApi={setApi}>
                <CarouselContent>
                    {data.map((item, index) => (
                        <CarouselItem key={item.title} style={{ 
                            background: item.background,
                            borderTopLeftRadius: 40, 
                            borderTopRightRadius: 0, 
                            borderBottomRightRadius: 40, 
                            borderBottomLeftRadius: 0,
                            color: 'white',
                            minHeight: 170,
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'space-between',
                            padding: 0
                        }}>
                            <p style={{ padding: '20px' }}>{item.description}</p>
                            <p style={{
                                background: '#444444',
                                borderBottomRightRadius: 40,
                                margin: 0,
                                height: '40px',
                                lineHeight: '40px',
                                padding: '0 12px',
                                fontWeight: 600,
                            }}>{item.title}</p>
                        </CarouselItem>
                    ))}
                </CarouselContent>
            </Carousel>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, justifyContent: 'center' }}>
                {data.map((item, index) => (
                    <div 
                        key={index} 
                        style={{ width: 10, height: 10, background: current === index + 1? '#000000' : '#FF942C', borderRadius: 20 }}
                    ></div>
                ))}
            </div>
        </div>
    )
};