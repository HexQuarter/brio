import { emitEvent, isTMA, mockTelegramEnv } from '@telegram-apps/sdk-react';

// It is important, to mock the environment only for development purposes. When building the
// application, import.meta.env.DEV will become false, and the code inside will be tree-shaken,
// so you will not see it in your final bundle.
if (import.meta.env.DEV) {
  if (!await isTMA('complete')) {
    // const themeParams = {
    //   accent_text_color: '#FF942C',
    //   bg_color: '#FFFFFF',
    //   button_color: '#FF942C',
    //   button_text_color: '#ffffff',
    //   destructive_text_color: '#ec3942',
    //   header_bg_color: '#17212b',
    //   hint_color: '#708499',
    //   // link_color: '#6ab3f3',
    //   // secondary_bg_color: '#232e3c',
    //   section_bg_color: '#F4F4F4',
    //   // section_header_text_color: '#6ab3f3',
    //   // subtitle_text_color: '#708499',
    //   text_color: '#000000',
    // } as const;
    // const noInsets = { left: 0, top: 0, bottom: 0, right: 0 } as const;

    mockTelegramEnv({
      onEvent(e) {
        // Here you can write your own handlers for all known Telegram Mini Apps methods:
        // https://docs.telegram-mini-apps.com/platform/methods
        // if (e[0] === 'web_app_request_theme') {
        //   return emitEvent('theme_changed', { theme_params: {}});
        // }
        if (e[0] === 'web_app_request_viewport') {
          return emitEvent('viewport_changed', {
            height: window.innerHeight,
            width: window.innerWidth,
            is_expanded: true,
            is_state_stable: true,
          });
        }
        if (e[0] === 'web_app_data_send') {
          return emitEvent('web_app_data_send', e[1])
          console.log('SENDING', e)
        }
        // if (e[0] === 'web_app_request_content_safe_area') {
        //   return emitEvent('content_safe_area_changed', noInsets);
        // }
        // if (e[0] === 'web_app_request_safe_area') {
        //   return emitEvent('safe_area_changed', noInsets);
        // }
      },
      launchParams: new URLSearchParams([
        // Discover more launch parameters:
        // https://docs.telegram-mini-apps.com/platform/launch-parameters#parameters-list
        ['tgWebAppThemeParams', JSON.stringify({})],
        // Your init data goes here. Learn more about it here:
        // https://docs.telegram-mini-apps.com/platform/init-data#parameters-list
        //
        // Note that to make sure, you are using a valid init data, you must pass it exactly as it
        // is sent from the Telegram application. The reason is in case you will sort its keys
        // (auth_date, hash, user, etc.) or values your own way, init data validation will more
        // likely to fail on your server side. So, to make sure you are working with a valid init
        // data, it is better to take a real one from your application and paste it here. It should
        // look something like this (a correctly encoded URL search params):
        // ```
        // user=%7B%22id%22%3A279058397%2C%22first_name%22%3A%22Vladislav%22%2C%22last_name%22...
        // ```
        // But in case you don't really need a valid init data, use this one:
        ['tgWebAppData', new URLSearchParams([
          ['auth_date', (new Date().getTime() / 1000 | 0).toString()],
          ['hash', 'some-hash'],
          ['signature', 'some-signature'],
          ['user', JSON.stringify({ id: 1, first_name: 'Vladislav', username: 'vlad' })],
          ['start_param', 'offer=lno1pqpsrp4qpgqppyszm9h2m63a0qqsg3y6efwfx3suue7p2e8zu8tnyf06vlwnhxt6vqvq8legkjuzyz64yc7ghdll37w6dtpgl2uezt9t03s9h80yug387axvqypfrxqjyxvct68jch7gkafw0d3n2cdk2lg25urnhq7p6tu50xm2yasq9n95hn7vdyeufz7kkphp8s244rwx5khqt033pwt80zcj82znnya87tz8dsj6z8sz823myj72zcssxy47eqncdfcu0w34lntc58s64pfre9dt834t76kex9juct8meftx&invoiceRequest=00205bb8a72369bbc39cfa04f8da1097ebfc062fb99142e9726252afbe6469a7c4a108030186a00a00109202d96eadea3d780104449aca5c93461ce67c1564e2e1d73225fa67dd3b997a601803ff28b4b8220b55263c8bb7ff8f9da6ac28fab9912cab7c605b9de4e2227f74cc0102919812219985e8f2c5fc8b752e7b633561b657d0aa7073b83c1d2f9479b6a276002ccb4bcfcc6933c48bd6b06e13c155a8dc6a5ae05be310b96778b123a853993a7f2c476c25a11e023aa3b24bca16210312bec82786a71c7ba35fcd78a1e1aa8523c95ab3c6abf6ad93165cc2cfbca56650206fe28c0ab6f1b372c1a6a246ae63f74f931e8365e15a089c68d619000000000052030186a054030200005821037a6fbbfe93e0e5a915fed79ebbf0bac1c6e81f4300f2e600d35caade99b96269f040d9e7e6f3b8946e69e8c1b7759800f5922eadd54f7aaed087b720cd47e116ebd9a5e55ea297f0e4b1fd0c79be81ea7c9aa7b905f67c49c47b5ef569428ecf3824']
        ]).toString()],
        ['tgWebAppVersion', '8.4'],
        ['tgWebAppPlatform', 'tdesktop'],
      ]),
    });

    console.info(
      '⚠️ As long as the current environment was not considered as the Telegram-based one, it was mocked. Take a note, that you should not do it in production and current behavior is only specific to the development process. Environment mocking is also applied only in development mode. So, after building the application, you will not see this behavior and related warning, leading to crashing the application outside Telegram.',
    );
  }
}
