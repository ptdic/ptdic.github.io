import { useEffect, useState } from "react";
import { get, set } from "idb-keyval";
import { XzReadableStream } from "xzwasm";



function Word(props: { word: string, data: string, hide: boolean }) {
  const [hide, HIDE] = useState(props.hide);
  useEffect(() => HIDE(props.hide), [props.hide]);
  return <>
    <div>
      <button onClick={() => HIDE(!hide)}><code style={{ color: "green", fontWeight: "bold", fontSize: "large" }}>{props.word}</code></button>
    </div>
    <div hidden={hide} dangerouslySetInnerHTML={{ __html: props.data }} />
  </>
}

function mkregexp(text: string) { try { return new RegExp(`^${text}$`) } catch { return undefined } }
function makenorm(text: string) { return text.normalize("NFD").replace(/[\u0300-\u036f]/g, "") }
function makecase(text: string) { return text.toLowerCase() }
function mkorigin(text: string) { return text }
function updatedb() { return fetch('data.json.xz').then(v => new Response(new XzReadableStream(v.body!)).text()).then(v => set('data', v)) }
function datatime(time?: number) { if (time === undefined) return `LOADING`; const date = new Date(time * 1000); return `${date.getFullYear()}.${date.getMonth()}` }

export default function App() {
  const [data, DATA] = useState<any>();
  const [text, TEXT] = useState('');
  const [norm, NORM] = useState(true);
  const [caso, CASO] = useState(false);
  const [hide, HIDE] = useState(false);
  const [maxn, MAXN] = useState(256);
  const [flag, FLAG] = useState(true);
  useEffect(() => { get('data').then(v => DATA(JSON.parse(v))).catch(() => { if (flag) updatedb().then(() => FLAG(!flag)); }) }, [flag]);
  const f = norm ? makenorm : mkorigin;
  const g = caso ? mkorigin : makecase;
  const regexp = mkregexp(f(g(text)));
  const selected = data === undefined ? undefined : Object.keys(data.data).filter(v => regexp?.test(f(g(v))));
  return <>
    <h1 style={{ textAlign: "center" }}>PT-DIC</h1>
    <div style={{ display: "flex", fontSize: "large", marginLeft: "6.25%", marginRight: "6.25%" }}>
      <code>^</code>
      <input value={text} onChange={ev => TEXT(ev.target.value)} type="text" style={{ flexGrow: 1 }} />
      <code>$</code>
    </div>
    <div style={{ marginLeft: "6.25%", marginRight: "6.25%", fontSize: "small", textAlign: "center" }}>
      <label style={{ border: "dotted" }}>
        <input checked={norm} onChange={ev => NORM(ev.target.checked)} type="checkbox" />
        <span>NORM</span>
      </label>
      <span>&emsp;</span>
      <label style={{ border: "dotted" }}>
        <input checked={caso} onChange={ev => CASO(ev.target.checked)} type="checkbox" />
        <span>CASE</span>
      </label>
      <span>&emsp;</span>
      <label style={{ border: "dotted" }}>
        <input checked={hide} onChange={ev => HIDE(ev.target.checked)} type="checkbox" />
        <span>HIDE</span>
      </label>
    </div>
    <div style={{ marginLeft: "6.25%", marginRight: "6.25%", fontSize: "small", textAlign: "center" }}>
      <select value={maxn} onChange={ev => MAXN(parseInt(ev.target.value))}>
        <option value={0x00000001}>MAX: 16^0 (TIDY)</option>
        <option value={0x00000010}>MAX: 16^1 (TIDY)</option>
        <option value={0x00000100}>MAX: 16^2 (GOOD)</option>
        <option value={0x00001000}>MAX: 16^3 (GOOD)</option>
        <option value={0x00010000}>MAX: 16^4 (SLOW)</option>
        <option value={0x00100000}>MAX: 16^5 (SLOW)</option>
      </select>
      <span>&emsp;</span>
      <button onClick={() => updatedb().then(() => FLAG(!flag))} disabled={data === undefined}>{datatime(data?.time)}</button>
    </div>
    {
      selected === undefined ?
        <code>WAITING DB ...</code>
        : regexp === undefined ?
          <code style={{ color: "red" }}>INVALID REGEXP</code>
          : selected.length > maxn ?
            <code style={{ color: "red" }}>{`LEN = [${selected.length}] > [${maxn}] = MAX`}</code>
            :
            <ul>
              {selected.map((v, i) => <li key={i}><Word word={v} data={data.data[v]} hide={hide} /></li>)}
            </ul>
    }
  </>;
}
