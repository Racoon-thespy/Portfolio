"use strict";(()=>{var J=Object.defineProperty;var Q=(a,t,e)=>t in a?J(a,t,{enumerable:!0,configurable:!0,writable:!0,value:e}):a[t]=e;var p=(a,t,e)=>Q(a,typeof t!="symbol"?t+"":t,e);var y=class extends Error{constructor(e,o){super(e);p(this,"userMessage",e);p(this,"status",o)}},Z=2e4,A=class{constructor(t){p(this,"baseUrl",t)}async ask(t){let e=new AbortController,o=setTimeout(()=>e.abort(),Z),r;try{r=await fetch(`${this.baseUrl.replace(/\/$/,"")}/chat`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({messages:t}),signal:e.signal})}catch{throw new y("I couldn't reach the assistant. Please try again in a moment.")}finally{clearTimeout(o)}if(r.status===429)throw new y("That was a lot of questions at once. Give it a few seconds.",429);if(!r.ok)throw new y("The assistant is unavailable right now. Please try again later.",r.status);let i=(await r.json().catch(()=>null))?.reply;if(typeof i!="string"||i.length===0)throw new y("I got an empty answer. Could you ask again?");return i}};function W(a,t=40,e=3){let o=a.replace(/\s+/g," ").trim();if(!o)return[];let r=o.match(/[^.!?]+[.!?]+["')\]]*|[^.!?]+$/g)??[o],n=[];for(let i of r){let l=i.trim();if(!l)continue;let d=n.length-1;d>=0&&(n[d]?.length??0)<t?n[d]+=` ${l}`:n.push(l)}for(;n.length>e;){let i=n.pop()??"";n[n.length-1]+=` ${i}`}return n}function B(a,t=16e3){let e=a.length*2,o=new ArrayBuffer(44+e),r=new DataView(o),n=(i,l)=>{for(let d=0;d<l.length;d++)r.setUint8(i+d,l.charCodeAt(d))};n(0,"RIFF"),r.setUint32(4,36+e,!0),n(8,"WAVE"),n(12,"fmt "),r.setUint32(16,16,!0),r.setUint16(20,1,!0),r.setUint16(22,1,!0),r.setUint32(24,t,!0),r.setUint32(28,t*2,!0),r.setUint16(32,2,!0),r.setUint16(34,16,!0),n(36,"data"),r.setUint32(40,e,!0);for(let i=0;i<a.length;i++){let l=Math.max(-1,Math.min(1,a[i]??0));r.setInt16(44+i*2,l<0?l*32768:l*32767,!0)}return o}async function O(a){let t=new AudioContext;try{let e=await t.decodeAudioData(await a.arrayBuffer()),o=Math.max(1,Math.ceil(e.duration*16e3)),r=new OfflineAudioContext(1,o,16e3),n=r.createBufferSource();n.buffer=e,n.connect(r.destination),n.start();let i=await r.startRendering();return B(i.getChannelData(0))}finally{t.close()}}var M=class{constructor(t){p(this,"baseUrl",t);p(this,"supported",typeof Audio<"u");p(this,"audio",this.supported?new Audio:null);p(this,"controller",null);p(this,"generation",0);p(this,"abortPlayback",null)}prime(){if(!this.audio||this.audio.src)return;let t=URL.createObjectURL(new Blob([B(new Float32Array(160))],{type:"audio/wav"}));this.audio.src=t,this.audio.play().catch(()=>{})}speak(t,e){this.cancel();let o=W(t);if(!this.audio||o.length===0)return e.onEnd();let r=++this.generation,n=new AbortController;this.controller=n;let i=o.map(l=>this.fetchClip(l,n.signal));this.playAll(i,r,e)}cancel(){this.generation++,this.controller?.abort(),this.controller=null,this.abortPlayback?.(),this.audio?.pause()}async fetchClip(t,e){try{let o=await fetch(`${this.baseUrl.replace(/\/$/,"")}/speak`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({text:t}),signal:e});return o.ok?URL.createObjectURL(await o.blob()):null}catch{return null}}async playAll(t,e,o){let r=!1;for(let n of t){let i=await n;if(!i)continue;if(e!==this.generation){URL.revokeObjectURL(i);continue}let l=await this.play(i,()=>{r||(r=!0,o.onStart())});if(URL.revokeObjectURL(i),!l&&e!==this.generation)break}e===this.generation&&o.onEnd()}play(t,e){let o=this.audio;return o?new Promise(r=>{let n=i=>{o.onended=null,o.onerror=null,this.abortPlayback=null,r(i)};this.abortPlayback=()=>n(!1),o.onended=()=>n(!0),o.onerror=()=>n(!1),o.src=t,o.play().then(e,()=>n(!1))}):Promise.resolve(!1)}};var ee={speechThreshold:.02,silenceMs:1200,maxMs:15e3,noSpeechMs:7e3},L=class{constructor(t=ee){p(this,"config",t);p(this,"startedAt",null);p(this,"lastSpeechAt",0);p(this,"heard",!1)}get heardSpeech(){return this.heard}feed(t,e){this.startedAt??(this.startedAt=e),t>=this.config.speechThreshold&&(this.heard=!0,this.lastSpeechAt=e);let o=e-this.startedAt;return o>=this.config.maxMs||this.heard&&e-this.lastSpeechAt>=this.config.silenceMs||!this.heard&&o>=this.config.noSpeechMs?"stop":"listening"}};var te=50;function ne(a){let t=a?.name;return t==="NotAllowedError"||t==="SecurityError"?"Microphone access is blocked. Allow it in your browser, or type instead.":t==="NotFoundError"?"I can't find a microphone. You can type your question instead.":"I couldn't start the microphone. Please try again, or type your question."}var C=class{constructor(t){p(this,"baseUrl",t);p(this,"current",null)}get supported(){return typeof MediaRecorder<"u"&&typeof AudioContext<"u"&&typeof navigator.mediaDevices?.getUserMedia=="function"}start(t){this.cancel();let e={cancelled:!1,finish:null};this.current=e,this.record(e,t)}stop(){this.current?.finish?.()}cancel(){this.current&&(this.current.cancelled=!0,this.current.finish?.(),this.current=null)}async record(t,e){let o;try{o=await navigator.mediaDevices.getUserMedia({audio:{echoCancellation:!0,noiseSuppression:!0}})}catch(u){t.cancelled||e.onError(ne(u)),e.onEnd();return}let r=[],n=new MediaRecorder(o);n.ondataavailable=u=>{u.data.size>0&&r.push(u.data)};let i=new Promise(u=>{n.onstop=()=>u()}),l=new AudioContext,d=l.createAnalyser();d.fftSize=1024,l.createMediaStreamSource(o).connect(d);let E=new Float32Array(d.fftSize),b=new L,T=()=>{n.state!=="inactive"&&n.stop()};t.finish=T,t.cancelled&&T();let U=setInterval(()=>{d.getFloatTimeDomainData(E);let u=0;for(let g of E)u+=g*g;let f=Math.sqrt(u/E.length);b.feed(f,performance.now())==="stop"&&T()},te);t.cancelled?i.then(void 0,()=>{}):n.start(),n.state==="recording"&&await i,clearInterval(U);for(let u of o.getTracks())u.stop();if(l.close(),t.cancelled)return e.onEnd();if(!b.heardSpeech||r.length===0)return e.onError("I didn't hear anything. Tap the mic and try again."),e.onEnd();e.onProcessing();let x=performance.now();try{let u=await O(new Blob(r,{type:n.mimeType}));if(t.cancelled)return e.onEnd();let f=await fetch(`${this.baseUrl.replace(/\/$/,"")}/transcribe`,{method:"POST",headers:{"Content-Type":"audio/wav"},body:u});if(t.cancelled)return e.onEnd();if(f.status===429)return e.onError("That was a lot at once. Give it a few seconds."),e.onEnd();if(!f.ok)throw new Error(`transcribe ${f.status}`);let{text:g}=await f.json();if(console.debug(`voice-agent: transcribed in ${Math.round(performance.now()-x)} ms`),t.cancelled)return e.onEnd();typeof g=="string"&&g.trim()?e.onFinal(g.trim()):e.onError("I couldn't make that out. Try again, or type your question.")}catch{t.cancelled||e.onError("Transcription failed. Please try again, or type your question.")}e.onEnd()}};function D(a,t){let e=t.trim().slice(0,300),o=[...a,{role:"user",content:e}].slice(-6);for(;o.length>1&&o[0]?.role==="assistant";)o.shift();return o}var N=`
:host { all: initial; }
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

.root {
	--bg: var(--va-bg, #050506);
	--panel: var(--va-panel, #0c0c0f);
	--ink: var(--va-ink, #f4f4f1);
	--muted: var(--va-muted, #8b8b93);
	--muted-2: var(--va-muted-2, #5c5c63);
	--radius: var(--va-radius, 6px);
	--line: var(--va-line, rgba(255, 255, 255, 0.1));
	--line-strong: var(--va-line-strong, rgba(255, 255, 255, 0.2));
	--accent: var(--va-accent, #e5342b);
	--accent-2: var(--va-accent-2, #f5473a);
	--font-mono: var(--va-font-mono, 'Space Mono', ui-monospace, monospace);
	/* The send button's soft red: every control's hover, pressed and attention state uses these. */
	--tint: color-mix(in srgb, var(--accent) 18%, transparent);
	--tint-line: color-mix(in srgb, var(--accent) 40%, transparent);
	--tint-hover: color-mix(in srgb, var(--accent) 30%, transparent);
	--tint-line-hover: color-mix(in srgb, var(--accent) 60%, transparent);
	--bottom: var(--va-bottom, 92px); /* the default clears the portfolio's 72px fixed scrubber */
	position: fixed;
	right: var(--va-right, 20px);
	bottom: var(--bottom);
	z-index: var(--va-z-index, 45);
	font-family: var(--va-font, 'Inter', system-ui, sans-serif);
	font-size: var(--va-font-size, 15px);
	line-height: 1.5;
	color: var(--ink);
}
.mono {
	font-family: var(--font-mono);
	letter-spacing: 0.12em;
	text-transform: uppercase;
	font-size: 12px;
}

button { font: inherit; color: inherit; background: none; border: 0; cursor: pointer; }
button:focus-visible, input:focus-visible, a:focus-visible {
	outline: 2px solid var(--accent-2);
	outline-offset: 2px;
}

/* Launcher */
.launcher {
	display: flex;
	align-items: center;
	gap: 8px;
	margin-left: auto;
	padding: 9px 16px 9px 12px;
	background: var(--bg);
	border: 1px solid var(--line-strong);
	border-radius: 999px;
	transition: border-color 0.2s ease, color 0.2s ease;
}
.launcher:hover {
	border-color: var(--tint-line);
	color: var(--ink);
	background: linear-gradient(var(--tint), var(--tint)), var(--bg);
}
.dot {
	width: 6px;
	height: 6px;
	border-radius: 50%;
	background: var(--accent);
	animation: pulse 2.4s ease-in-out infinite;
}
.root[data-open='true'] .launcher { display: none; }

/* Panel */
.panel {
	display: none;
	flex-direction: column;
	width: min(var(--va-width, 380px), calc(100vw - 32px));
	height: min(var(--va-height, 520px), calc(100vh - var(--bottom) - 58px));
	background: var(--panel);
	border-radius: var(--radius);
	overflow: hidden;
}
.root[data-open='true'] .panel { display: flex; }


.head {
	display: flex;
	align-items: center;
	gap: 8px;
	padding: 14px 18px 12px;
}
.head .title { flex: 1; color: var(--accent); }
.rec { display: none; align-items: center; gap: 6px; color: var(--accent-2); }
.root[data-state='listening'] .rec { display: inline-flex; }
.root[data-state='listening'] .rec .dot { animation: pulse 1s ease-in-out infinite; }
.status { color: var(--muted-2); }
.icon-btn { padding: 6px; border-radius: 4px; color: var(--muted); }
.icon-btn:hover { color: var(--ink); }
.voice-toggle {
	width: 30px;
	height: 30px;
	padding: 0;
	display: grid;
	place-items: center;
	border: 1px solid var(--line);
	border-radius: 50%;
	transition: border-color 0.2s ease, background 0.2s ease, color 0.2s ease;
}
.voice-toggle:hover { border-color: var(--line-strong); }
.voice-toggle[aria-pressed='true'] { color: var(--accent-2); background: var(--tint); border-color: var(--tint-line); }

.log {
	flex: 1;
	overflow-y: auto;
	padding: 18px;
	display: flex;
	flex-direction: column;
	gap: 14px;
	overscroll-behavior: contain;
}
/* Flat, left-ruled transcript lines with a mono speaker label, like the
   site's reel cards, instead of generic chat bubbles. */
.msg {
	max-width: 92%;
	padding: 0 0 0 12px;
	border-left: 1px solid var(--line-strong);
	color: var(--muted);
	white-space: pre-wrap;
	overflow-wrap: anywhere;
}
.msg::before {
	display: block;
	margin-bottom: 2px;
	font-family: var(--font-mono);
	font-size: 12px;
	letter-spacing: 0.12em;
	text-transform: uppercase;
	color: var(--muted-2);
}
.msg.user { align-self: flex-end; color: var(--ink); }
.msg.user::before { content: 'You'; color: var(--accent); }
.msg.bot { align-self: flex-start; }
.msg.bot::before { content: 'A.P.S.'; }
.msg.error { align-self: flex-start; color: var(--accent-2); }
.msg.error::before { content: 'Error'; color: var(--accent); }
.msg.pending { color: var(--muted-2); }
.msg.pending::before { content: none; }
.hint { color: var(--muted-2); font-size: 12px; }

.pills { display: flex; flex-wrap: wrap; gap: 8px; padding: 0 18px 14px; }
.pills[hidden] { display: none; }
.pill {
	padding: 3px 8px;
	font-family: var(--font-mono);
	font-size: 12px;
	letter-spacing: 0.06em;
	color: var(--muted);
	border: 1px solid var(--line);
	border-radius: var(--radius);
	transition: border-color 0.2s ease, color 0.2s ease;
}
.pill:hover { border-color: var(--tint-line); background: var(--tint); color: var(--ink); }
.pill:disabled { opacity: 0.5; cursor: default; }

.foot { padding: 14px 18px; display: flex; flex-direction: column; gap: 8px; }
.form { display: flex; gap: 8px; align-items: center; }
.form input {
	flex: 1;
	min-width: 0;
	padding: 9px 12px;
	font: inherit;
	color: var(--ink);
	background: var(--bg);
	border: 1px solid var(--line);
	border-radius: var(--radius);
	transition: border-color 0.2s ease;
}
/* The shared keyboard ring is bright red; the message box gets the soft tint instead.
   It is still clearly visible: the border goes from faint white to a medium red. */
.form input:focus-visible { outline: none; }
.form input:focus { border-color: var(--tint-line); }
.form input::placeholder { color: var(--muted); }
.form input:disabled { opacity: 0.6; }
.mic, .send {
	flex: none;
	width: 38px;
	height: 38px;
	display: grid;
	place-items: center;
	border: 1px solid var(--line);
	border-radius: var(--radius);
	transition: border-color 0.2s ease, color 0.2s ease;
}
.mic:hover { border-color: var(--tint-line); background: var(--tint); }
.mic[aria-pressed='true'] { background: var(--tint-hover); border-color: var(--tint-line-hover); animation: none; }
/* Draws the eye to the mic until it is first used. */
.mic[data-nudge='true'] {
	color: var(--ink);
	border-color: var(--tint-line);
	animation: micPulse 1.8s ease-out infinite;
}
.send { background: var(--tint); color: var(--accent-2); border-color: var(--tint-line); }
.send:hover { background: var(--tint-hover); border-color: var(--tint-line-hover); }
.send:disabled { opacity: 0.5; cursor: default; }

svg { width: 18px; height: 18px; fill: none; stroke: currentColor; stroke-width: 2; stroke-linecap: round; stroke-linejoin: round; }

@keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }
@keyframes micPulse {
	0% { box-shadow: 0 0 0 0 color-mix(in srgb, var(--accent) 35%, transparent); }
	70% { box-shadow: 0 0 0 12px transparent; }
	100% { box-shadow: 0 0 0 0 transparent; }
}
@media (prefers-reduced-motion: reduce) {
	.dot, .root[data-state='listening'] .rec .dot { animation: none; }
	.mic[data-nudge='true'] { animation: none; } /* keeps the accent colour, drops the motion */
}
@media (max-width: 480px) {
	.root { right: var(--va-inset-mobile, 16px); left: var(--va-inset-mobile, 16px); }
	.panel { width: 100%; }
}
`,oe='<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="9" y="2" width="6" height="11" rx="3"/><path d="M5 10v1a7 7 0 0 0 14 0v-1"/><line x1="12" y1="18" x2="12" y2="22"/></svg>',re='<svg viewBox="0 0 24 24" aria-hidden="true"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>',ie='<svg viewBox="0 0 24 24" aria-hidden="true"><polygon points="3 9 7 9 12 5 12 19 7 15 3 15"/><path d="M16 9a4 4 0 0 1 0 6"/></svg>',ae='<svg viewBox="0 0 24 24" aria-hidden="true"><line x1="6" y1="6" x2="18" y2="18"/><line x1="18" y1="6" x2="6" y2="18"/></svg>',z=`
<div class="root" data-open="false" data-state="idle">
	<button class="launcher mono" type="button" aria-label="Open the voice assistant">
		<span class="dot" aria-hidden="true"></span>Ask about Aditya
	</button>
	<section class="panel" role="dialog" aria-label="Voice assistant">
		<div class="head">
			<span class="title mono">Ask ADI</span>
			<span class="rec mono"><span class="dot" aria-hidden="true"></span>Rec</span>
			<span class="status mono" aria-live="polite"></span>
			<button class="icon-btn voice-toggle" type="button" aria-pressed="true" aria-label="Spoken replies">${ie}</button>
			<button class="icon-btn close" type="button" aria-label="Close the assistant">${ae}</button>
		</div>
		<div class="log" role="log" aria-live="polite"></div>
		<div class="pills" role="group" aria-label="Suggested questions"></div>
		<div class="foot">
			<form class="form">
				<input type="text" maxlength="300" placeholder="Type, or tap the mic to talk" aria-label="Your question" autocomplete="off" />
				<button class="mic" type="button" aria-pressed="false" aria-label="Speak your question">${oe}</button>
				<button class="send" type="submit" aria-label="Send">${re}</button>
			</form>
		</div>
	</section>
</div>
`;var _=[{label:"What does Aditya do?",question:"What does Aditya do?"},{label:"His experience",question:"Tell me about Aditya's work experience."},{label:"Best projects",question:"What are Aditya's best projects?"},{label:"Voice agents",question:"Has Aditya built voice agents?"},{label:"Roles he wants",question:"What kind of roles is Aditya looking for?"},{label:"Beyond code",question:"What does Aditya do outside of work?"}],I=a=>a.trim().toLowerCase().replace(/\s+/g," ");function F(a){let t=I(a);return _.find(e=>I(e.question)===t||I(e.label)===t)}var se="Hi, I'm an AI assistant for Aditya's portfolio. Ask me about his work, skills or how to reach him.",le={idle:"",listening:"Listening",transcribing:"Transcribing",thinking:"Thinking",speaking:"Speaking"};function j({api:a,transcriber:t,speaker:e}){let o=document.createElement("div");o.id="aditya-voice-agent";let r=o.attachShadow({mode:"open"});r.innerHTML=`<style>${N}</style>${z}`,document.body.append(o);let n=s=>{let c=r.querySelector(s);if(!c)throw new Error(`voice-agent: missing ${s}`);return c},i=n(".root"),l=n(".log"),d=n(".form input"),E=n(".form"),b=n(".mic"),T=n(".send"),U=n(".status"),x=n(".voice-toggle"),u=n(".pills"),f=new Map,g=[],m="idle",w=e.supported;function h(s){m=s,i.dataset.state=s,U.textContent=le[s];let c=s==="thinking"||s==="transcribing";d.disabled=c,T.disabled=c,b.setAttribute("aria-pressed",String(s==="listening"))}function k(s,c){let v=document.createElement("div");return v.className=`msg ${s}`,v.textContent=c,l.append(v),l.scrollTop=l.scrollHeight,v}function G(s){let c=F(s);c&&(f.get(c)?.remove(),f.delete(c),f.size===0&&(u.hidden=!0))}function R(){e.cancel(),t.cancel()}async function H(s){let c=s.trim();if(!c||m==="thinking")return;R(),d.value="",G(c),k("user",c);let v=k("pending","...");h("thinking");let Y=performance.now();try{let S=D(g,c),q=await a.ask(S);g.push({role:"user",content:S[S.length-1]?.content??c}),g.push({role:"assistant",content:q}),v.className="msg bot",v.textContent=q,console.debug(`voice-agent: reply in ${Math.round(performance.now()-Y)} ms`),h("idle"),w&&e.speak(q,{onStart:()=>h("speaking"),onEnd:()=>{m==="speaking"&&h("idle")}})}catch(S){v.className="msg error",v.textContent=S instanceof y?S.userMessage:"Something went wrong. Please try again.",h("idle")}l.scrollTop=l.scrollHeight}function K(){e.cancel(),h("listening"),d.value="",t.start({onProcessing:()=>h("transcribing"),onFinal:s=>{H(s)},onError:s=>{k("error",s)},onEnd:()=>{(m==="listening"||m==="transcribing")&&h("idle")}})}function X(){e.prime(),i.dataset.open="true",d.focus()}function $(){R(),i.dataset.open="false",m!=="thinking"&&h("idle")}k("bot",se),t.supported?k("pending","Tap the mic and speak. Your recording is sent to Cloudflare Workers AI to be transcribed."):(b.hidden=!0,k("pending","Voice input isn't available in this browser, so please type your question.")),e.supported||(x.hidden=!0),x.setAttribute("aria-pressed",String(w));for(let s of _){let c=document.createElement("button");c.type="button",c.className="pill",c.textContent=s.label,c.addEventListener("click",()=>{e.prime(),H(s.question)}),f.set(s,c),u.append(c)}t.supported&&(b.dataset.nudge="true"),n(".launcher").addEventListener("click",X),n(".close").addEventListener("click",$),x.addEventListener("click",()=>{w=!w,x.setAttribute("aria-pressed",String(w)),w||(e.cancel(),m==="speaking"&&h("idle"))}),b.addEventListener("click",()=>{delete b.dataset.nudge,e.prime(),m==="listening"?t.stop():(m==="idle"||m==="speaking")&&K()}),E.addEventListener("submit",s=>{s.preventDefault(),e.prime(),H(d.value)}),r.addEventListener("keydown",s=>{s.key==="Escape"&&$()}),window.addEventListener("pagehide",R)}var P=document.currentScript?.dataset.api;function V(){if(!P){console.error('voice-agent: add data-api="https://your-worker.example" to the script tag.');return}j({api:new A(P),transcriber:new C(P),speaker:new M(P)})}document.readyState==="loading"?document.addEventListener("DOMContentLoaded",V):V();})();
