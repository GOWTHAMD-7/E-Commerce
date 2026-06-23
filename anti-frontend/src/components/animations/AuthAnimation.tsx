import { useLottie } from 'lottie-react';
import animationData from './login_page.json';

export default function AuthAnimation() {
  const options = {
    animationData: animationData,
    loop: true,
    autoplay: true,
  };

  const { View } = useLottie(options);

  return (
    <div className="absolute inset-0 w-full h-full pointer-events-none flex items-center justify-center p-8 z-0">
      <div className="w-[450px] h-[450px] scale-[1.25] translate-x-10 translate-y-[-20px]  flex items-center justify-center">
        {View}
      </div>
    </div>
  );
}
