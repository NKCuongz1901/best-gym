import { Font } from '@react-pdf/renderer';

let registered = false;

export function registerPackageReceiptFonts() {
  if (registered) return;

  Font.register({
    family: 'NotoSans',
    fonts: [
      {
        src: 'https://cdn.jsdelivr.net/gh/googlefonts/noto-fonts@main/hinted/ttf/NotoSans/NotoSans-Regular.ttf',
        fontWeight: 400,
      },
      {
        src: 'https://cdn.jsdelivr.net/gh/googlefonts/noto-fonts@main/hinted/ttf/NotoSans/NotoSans-Bold.ttf',
        fontWeight: 700,
      },
    ],
  });

  registered = true;
}
