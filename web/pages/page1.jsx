import { useEffect, useRef } from 'react';
import Head from 'next/head';
import Script from 'next/script';
import { ONES } from '@ones-open/sdk';

const commands = [
  'ONES.getLocale()',
  'ONES.getTimezone()',
  'ONES.getTeamInfo()',
  'ONES.getAppToken()',
  `ONES.fetch('/project/issues?teamID=8Fs32wob', {\n  method: 'GET',\n})`,
  `ONES.UI.toast({\n  type: 'info',\n})`,
  `ONES.UI.modal({\n  type: 'info',\n})`,
];

const Page1 = () => {
  const textareaRefs = useRef([]);

  useEffect(() => {
    if (typeof window !== 'undefined' && !window.ONES && ONES) {
      window.ONES = ONES;
    }
  }, []);

  const runCommand = (index) => {
    const textarea = textareaRefs.current[index];
    if (!textarea) return;
    const expression = textarea.value;
    try {
      const fn = new Function(`return function() { return ${expression} }`);
      Promise.resolve()
        .then(() => fn()())
        .then((value) => {
          // eslint-disable-next-line no-console
          console.log('test', 'invoke', value);
        })
        .catch((error) => {
          // eslint-disable-next-line no-console
          console.log('test', 'error', error);
        });
    } catch (error) {
      // eslint-disable-next-line no-console
      console.log('test', 'error', error);
    }
  };

  return (
    <>
      <Head>
        <title>Malvin Test</title>
      </Head>
      <Script src="https://unpkg.com/@ones-open/sdk@latest/dist/index.iife.js" strategy="afterInteractive" />
      <div className="page">
        <div id="test">Malvin test</div>
        {commands.map((text, index) => (
          <section key={index}>
            <textarea
              defaultValue={text}
              ref={(el) => {
                textareaRefs.current[index] = el;
              }}
            />
            <button type="button" onClick={() => runCommand(index)}>
              执行
            </button>
          </section>
        ))}
      </div>
      <style jsx>{`
        .page {
          padding: 16px;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        #test {
          color: red;
        }

        section {
          display: flex;
          align-items: center;
        }

        textarea {
          width: 520px;
          min-height: 70px;
        }

        button {
          width: 50px;
          height: 25px;
          margin-left: 10px;
        }
      `}</style>
    </>
  );
};

export default Page1;
