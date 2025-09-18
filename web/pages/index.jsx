import Head from 'next/head';

const IndexPage = () => (
  <>
    <Head>
      <title>AppV2</title>
    </Head>
    <main style={{ padding: '24px' }}>
      <h1>AppV2 页面列表</h1>
      <ul>
        <li>
          <a href="/static/page1.html">Page 1</a>
        </li>
        <li>
          <a href="/static/page2.html">Page 2</a>
        </li>
      </ul>
    </main>
  </>
);

export default IndexPage;
