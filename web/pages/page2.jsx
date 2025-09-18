import dynamic from 'next/dynamic';

const Page2 = dynamic(() => import('../components/Page2Client'), {
  ssr: false,
  loading: () => null,
});

export default Page2;
