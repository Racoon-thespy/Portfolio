"use strict";(()=>{var J=Object.defineProperty;var Q=(s,t,e)=>t in s?J(s,t,{enumerable:!0,configurable:!0,writable:!0,value:e}):s[t]=e;var p=(s,t,e)=>Q(s,typeof t!="symbol"?t+"":t,e);var y=class extends Error{constructor(e,o){super(e);p(this,"userMessage",e);p(this,"status",o)}},Z=2e4,A=class{constructor(t){p(this,"baseUrl",t)}async ask(t){let e=new AbortController,o=setTimeout(()=>e.abort(),Z),r;try{r=await fetch(`${this.baseUrl.replace(/\/$/,"")}/chat`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({messages:t}),signal:e.signal})}catch{throw new y("I couldn't reach the assistant. Please try again in a moment.")}finally{clearTimeout(o)}if(r.status===429)throw new y("That was a lot of questions at once. Give it a few seconds.",429);if(!r.ok)throw new y("The assistant is unavailable right now. Please try again later.",r.status);let i=(await r.json().catch(()=>null))?.reply;if(typeof i!="string"||i.length===0)throw new y("I got an empty answer. Could you ask again?");return i}};function W(s,t=40,e=3){let o=s.replace(/\s+/g," ").trim();if(!o)return[];let r=o.match(/[^.!?]+[.!?]+["')\]]*|[^.!?]+$/g)??[o],n=[];for(let i of r){let c=i.trim();if(!c)continue;let d=n.length-1;d>=0&&(n[d]?.length??0)<t?n[d]+=` ${c}`:n.push(c)}for(;n.length>e;){let i=n.pop()??"";n[n.length-1]+=` ${i}`}return n}function I(s,t=16e3){let e=s.length*2,o=new ArrayBuffer(44+e),r=new DataView(o),n=(i,c)=>{for(let d=0;d<c.length;d++)r.setUint8(i+d,c.charCodeAt(d))};n(0,"RIFF"),r.setUint32(4,36+e,!0),n(8,"WAVE"),n(12,"fmt "),r.setUint32(16,16,!0),r.setUint16(20,1,!0),r.setUint16(22,1,!0),r.setUint32(24,t,!0),r.setUint32(28,t*2,!0),r.setUint16(32,2,!0),r.setUint16(34,16,!0),n(36,"data"),r.setUint32(40,e,!0);for(let i=0;i<s.length;i++){let c=Math.max(-1,Math.min(1,s[i]??0));r.setInt16(44+i*2,c<0?c*32768:c*32767,!0)}return o}async function O(s){let t=new AudioContext;try{let e=await t.decodeAudioData(await s.arrayBuffer()),o=Math.max(1,Math.ceil(e.duration*16e3)),r=new OfflineAudioContext(1,o,16e3),n=r.createBufferSource();n.buffer=e,n.connect(r.destination),n.start();let i=await r.startRendering();return I(i.getChannelData(0))}finally{t.close()}}var M=class{constructor(t){p(this,"baseUrl",t);p(this,"supported",typeof Audio<"u");p(this,"audio",this.supported?new Audio:null);p(this,"controller",null);p(this,"generation",0);p(this,"abortPlayback",null)}prime(){if(!this.audio||this.audio.src)return;let t=URL.createObjectURL(new Blob([I(new Float32Array(160))],{type:"audio/wav"}));this.audio.src=t,this.audio.play().catch(()=>{})}speak(t,e){this.cancel();let o=W(t);if(!this.audio||o.length===0)return e.onEnd();let r=++this.generation,n=new AbortController;this.controller=n;let i=o.map(c=>this.fetchClip(c,n.signal));this.playAll(i,r,e)}cancel(){this.generation++,this.controller?.abort(),this.controller=null,this.abortPlayback?.(),this.audio?.pause()}async fetchClip(t,e){try{let o=await fetch(`${this.baseUrl.replace(/\/$/,"")}/speak`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({text:t}),signal:e});return o.ok?URL.createObjectURL(await o.blob()):null}catch{return null}}async playAll(t,e,o){let r=!1;for(let n of t){let i=await n;if(!i)continue;if(e!==this.generation){URL.revokeObjectURL(i);continue}let c=await this.play(i,()=>{r||(r=!0,o.onStart())});if(URL.revokeObjectURL(i),!c&&e!==this.generation)break}e===this.generation&&o.onEnd()}play(t,e){let o=this.audio;return o?new Promise(r=>{let n=i=>{o.onended=null,o.onerror=null,this.abortPlayback=null,r(i)};this.abortPlayback=()=>n(!1),o.onended=()=>n(!0),o.onerror=()=>n(!1),o.src=t,o.play().then(e,()=>n(!1))}):Promise.resolve(!1)}};var ee={speechThreshold:.02,silenceMs:1200,maxMs:15e3,noSpeechMs:7e3},L=class{constructor(t=ee){p(this,"config",t);p(this,"startedAt",null);p(this,"lastSpeechAt",0);p(this,"heard",!1)}get heardSpeech(){return this.heard}feed(t,e){this.startedAt??(this.startedAt=e),t>=this.config.speechThreshold&&(this.heard=!0,this.lastSpeechAt=e);let o=e-this.startedAt;return o>=this.config.maxMs||this.heard&&e-this.lastSpeechAt>=this.config.silenceMs||!this.heard&&o>=this.config.noSpeechMs?"stop":"listening"}};var te=50;function ne(s){let t=s?.name;return t==="NotAllowedError"||t==="SecurityError"?"Microphone access is blocked. Allow it in your browser, or type instead.":t==="NotFoundError"?"I can't find a microphone. You can type your question instead.":"I couldn't start the microphone. Please try again, or type your question."}var C=class{constructor(t){p(this,"baseUrl",t);p(this,"current",null)}get supported(){return typeof MediaRecorder<"u"&&typeof AudioContext<"u"&&typeof navigator.mediaDevices?.getUserMedia=="function"}start(t){this.cancel();let e={cancelled:!1,finish:null};this.current=e,this.record(e,t)}stop(){this.current?.finish?.()}cancel(){this.current&&(this.current.cancelled=!0,this.current.finish?.(),this.current=null)}async record(t,e){let o;try{o=await navigator.mediaDevices.getUserMedia({audio:{echoCancellation:!0,noiseSuppression:!0}})}catch(u){t.cancelled||e.onError(ne(u)),e.onEnd();return}let r=[],n=new MediaRecorder(o);n.ondataavailable=u=>{u.data.size>0&&r.push(u.data)};let i=new Promise(u=>{n.onstop=()=>u()}),c=new AudioContext,d=c.createAnalyser();d.fftSize=1024,c.createMediaStreamSource(o).connect(d);let E=new Float32Array(d.fftSize),v=new L,T=()=>{n.state!=="inactive"&&n.stop()};t.finish=T,t.cancelled&&T();let P=setInterval(()=>{d.getFloatTimeDomainData(E);let u=0;for(let f of E)u+=f*f;let g=Math.sqrt(u/E.length);v.feed(g,performance.now())==="stop"&&T()},te);t.cancelled?i.then(void 0,()=>{}):n.start(),n.state==="recording"&&await i,clearInterval(P);for(let u of o.getTracks())u.stop();if(c.close(),t.cancelled)return e.onEnd();if(!v.heardSpeech||r.length===0)return e.onError("I didn't hear anything. Tap the mic and try again."),e.onEnd();e.onProcessing();let x=performance.now();try{let u=await O(new Blob(r,{type:n.mimeType}));if(t.cancelled)return e.onEnd();let g=await fetch(`${this.baseUrl.replace(/\/$/,"")}/transcribe`,{method:"POST",headers:{"Content-Type":"audio/wav"},body:u});if(t.cancelled)return e.onEnd();if(g.status===429)return e.onError("That was a lot at once. Give it a few seconds."),e.onEnd();if(!g.ok)throw new Error(`transcribe ${g.status}`);let{text:f}=await g.json();if(console.debug(`voice-agent: transcribed in ${Math.round(performance.now()-x)} ms`),t.cancelled)return e.onEnd();typeof f=="string"&&f.trim()?e.onFinal(f.trim()):e.onError("I couldn't make that out. Try again, or type your question.")}catch{t.cancelled||e.onError("Transcription failed. Please try again, or type your question.")}e.onEnd()}};function D(s,t){let e=t.trim().slice(0,300),o=[...s,{role:"user",content:e}].slice(-6);for(;o.length>1&&o[0]?.role==="assistant";)o.shift();return o}var N=`
:host { all: initial; }
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

.root {
	--bg: #050506;
	--panel: #0c0c0f;
	--ink: #f4f4f1;
	--muted: #8b8b93;
	--line: rgba(255, 255, 255, 0.1);
	--line-strong: rgba(255, 255, 255, 0.2);
	--accent: #e5342b;
	--accent-2: #f5473a;
	position: fixed;
	right: 20px;
	bottom: 92px; /* clears the portfolio's 72px fixed scrubber */
	z-index: 45;
	font-family: 'Inter', system-ui, sans-serif;
	font-size: 14px;
	line-height: 1.5;
	color: var(--ink);
}
.mono {
	font-family: 'Space Mono', ui-monospace, monospace;
	letter-spacing: 0.12em;
	text-transform: uppercase;
	font-size: 11px;
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
	gap: 10px;
	margin-left: auto;
	padding: 10px 16px 10px 12px;
	background: var(--panel);
	border: 1px solid var(--line-strong);
	border-radius: 999px;
	box-shadow: 0 8px 30px rgba(0, 0, 0, 0.5);
	transition: border-color 0.2s;
}
.launcher:hover { border-color: var(--accent); }
.dot {
	width: 8px;
	height: 8px;
	border-radius: 50%;
	background: var(--accent);
	box-shadow: 0 0 8px var(--accent);
}
.root[data-open='true'] .launcher { display: none; }

/* Panel */
.panel {
	display: none;
	flex-direction: column;
	width: min(380px, calc(100vw - 32px));
	height: min(520px, calc(100vh - 150px));
	background: var(--panel);
	border: 1px solid var(--line-strong);
	border-radius: 8px;
	box-shadow: 0 16px 50px rgba(0, 0, 0, 0.6);
	overflow: hidden;
}
.root[data-open='true'] .panel { display: flex; }

.head {
	display: flex;
	align-items: center;
	gap: 8px;
	padding: 12px 14px;
	border-bottom: 1px solid var(--line);
}
.head .title { flex: 1; }
.rec { display: none; align-items: center; gap: 6px; color: var(--accent-2); }
.root[data-state='listening'] .rec { display: inline-flex; }
.root[data-state='listening'] .rec .dot { animation: pulse 1s ease-in-out infinite; }
.status { color: var(--muted); }
.icon-btn { padding: 6px; border-radius: 4px; color: var(--muted); }
.icon-btn:hover { color: var(--ink); }
.icon-btn[aria-pressed='true'] { color: var(--accent-2); }

.log {
	flex: 1;
	overflow-y: auto;
	padding: 14px;
	display: flex;
	flex-direction: column;
	gap: 10px;
	overscroll-behavior: contain;
}
.msg {
	max-width: 88%;
	padding: 8px 12px;
	border-radius: 6px;
	border: 1px solid var(--line);
	white-space: pre-wrap;
	overflow-wrap: anywhere;
}
.msg.user { align-self: flex-end; background: rgba(229, 52, 43, 0.12); border-color: rgba(229, 52, 43, 0.35); }
.msg.bot { align-self: flex-start; background: rgba(255, 255, 255, 0.04); }
.msg.error { align-self: flex-start; color: var(--accent-2); border-color: rgba(229, 52, 43, 0.35); }
.msg.pending { color: var(--muted); }
.hint { color: var(--muted); font-size: 12px; }

.pills { display: flex; flex-wrap: wrap; gap: 8px; padding: 0 14px 12px; }
.pills[hidden] { display: none; }
.pill {
	padding: 6px 12px;
	font-size: 12px;
	color: var(--ink);
	border: 1px solid var(--line-strong);
	border-radius: 999px;
	transition: border-color 0.2s, background 0.2s;
}
.pill:hover { border-color: var(--accent); background: rgba(229, 52, 43, 0.08); }
.pill:disabled { opacity: 0.5; cursor: default; }

.foot { border-top: 1px solid var(--line); padding: 10px 12px; display: flex; flex-direction: column; gap: 8px; }
.form { display: flex; gap: 8px; align-items: center; }
.form input {
	flex: 1;
	min-width: 0;
	padding: 9px 12px;
	font: inherit;
	color: var(--ink);
	background: var(--bg);
	border: 1px solid var(--line-strong);
	border-radius: 6px;
}
.form input::placeholder { color: var(--muted); }
.form input:disabled { opacity: 0.6; }
.mic, .send {
	flex: none;
	width: 38px;
	height: 38px;
	display: grid;
	place-items: center;
	border: 1px solid var(--line-strong);
	border-radius: 6px;
}
.mic:hover, .send:hover { border-color: var(--accent); }
.mic[aria-pressed='true'] { background: var(--accent); border-color: var(--accent); animation: none; }
/* Draws the eye to the mic until it is first used. */
.mic[data-nudge='true'] {
	color: var(--accent-2);
	border-color: var(--accent);
	animation: micPulse 1.8s ease-out infinite;
}
.send { background: var(--ink); color: var(--bg); border-color: var(--ink); }
.send:disabled { opacity: 0.5; cursor: default; }
.links { display: flex; justify-content: space-between; align-items: center; }
.links a { color: var(--muted); text-decoration: underline; text-underline-offset: 3px; }
.links a:hover { color: var(--ink); }

svg { width: 18px; height: 18px; fill: none; stroke: currentColor; stroke-width: 2; stroke-linecap: round; stroke-linejoin: round; }

@keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }
@keyframes micPulse {
	0% { box-shadow: 0 0 0 0 rgba(229, 52, 43, 0.55); }
	70% { box-shadow: 0 0 0 12px rgba(229, 52, 43, 0); }
	100% { box-shadow: 0 0 0 0 rgba(229, 52, 43, 0); }
}
@media (prefers-reduced-motion: reduce) {
	.root[data-state='listening'] .rec .dot { animation: none; }
	.mic[data-nudge='true'] { animation: none; } /* keeps the accent colour, drops the motion */
}
@media (max-width: 480px) {
	.root { right: 16px; left: 16px; }
	.panel { width: 100%; }
}
`,oe='<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="9" y="2" width="6" height="11" rx="3"/><path d="M5 10v1a7 7 0 0 0 14 0v-1"/><line x1="12" y1="18" x2="12" y2="22"/></svg>',re='<svg viewBox="0 0 24 24" aria-hidden="true"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>',ie='<svg viewBox="0 0 24 24" aria-hidden="true"><polygon points="3 9 7 9 12 5 12 19 7 15 3 15"/><path d="M16 9a4 4 0 0 1 0 6"/></svg>',ae='<svg viewBox="0 0 24 24" aria-hidden="true"><line x1="6" y1="6" x2="18" y2="18"/><line x1="18" y1="6" x2="6" y2="18"/></svg>',j=`
<div class="root" data-open="false" data-state="idle">
	<button class="launcher mono" type="button" aria-label="Open the voice assistant">
		<span class="dot" aria-hidden="true"></span>Ask about Aditya
	</button>
	<section class="panel" role="dialog" aria-label="Voice assistant">
		<div class="head">
			<span class="title mono">AI assistant</span>
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
			<div class="links">
				<span class="hint">AI-generated. May make mistakes.</span>
				<a class="contact" href="#contact">Contact Aditya</a>
			</div>
		</div>
	</section>
</div>
`;var $=[{label:"What does Aditya do?",question:"What does Aditya do?"},{label:"His experience",question:"Tell me about Aditya's work experience."},{label:"Best projects",question:"What are Aditya's best projects?"},{label:"Voice agents",question:"Has Aditya built voice agents?"},{label:"Roles he wants",question:"What kind of roles is Aditya looking for?"},{label:"Beyond code",question:"What does Aditya do outside of work?"}],_=s=>s.trim().toLowerCase().replace(/\s+/g," ");function F(s){let t=_(s);return $.find(e=>_(e.question)===t||_(e.label)===t)}var se="Hi, I'm an AI assistant for Aditya's portfolio. Ask me about his work, skills or how to reach him.",le={idle:"",listening:"Listening",transcribing:"Transcribing",thinking:"Thinking",speaking:"Speaking"};function V({api:s,transcriber:t,speaker:e}){let o=document.createElement("div");o.id="aditya-voice-agent";let r=o.attachShadow({mode:"open"});r.innerHTML=`<style>${N}</style>${j}`,document.body.append(o);let n=a=>{let l=r.querySelector(a);if(!l)throw new Error(`voice-agent: missing ${a}`);return l},i=n(".root"),c=n(".log"),d=n(".form input"),E=n(".form"),v=n(".mic"),T=n(".send"),P=n(".status"),x=n(".voice-toggle"),u=n(".pills"),g=new Map,f=[],h="idle",w=e.supported;function m(a){h=a,i.dataset.state=a,P.textContent=le[a];let l=a==="thinking"||a==="transcribing";d.disabled=l,T.disabled=l,v.setAttribute("aria-pressed",String(a==="listening"))}function k(a,l){let b=document.createElement("div");return b.className=`msg ${a}`,b.textContent=l,c.append(b),c.scrollTop=c.scrollHeight,b}function G(a){let l=F(a);l&&(g.get(l)?.remove(),g.delete(l),g.size===0&&(u.hidden=!0))}function R(){e.cancel(),t.cancel()}async function H(a){let l=a.trim();if(!l||h==="thinking")return;R(),d.value="",G(l),k("user",l);let b=k("pending","...");m("thinking");let Y=performance.now();try{let S=D(f,l),B=await s.ask(S);f.push({role:"user",content:S[S.length-1]?.content??l}),f.push({role:"assistant",content:B}),b.className="msg bot",b.textContent=B,console.debug(`voice-agent: reply in ${Math.round(performance.now()-Y)} ms`),m("idle"),w&&e.speak(B,{onStart:()=>m("speaking"),onEnd:()=>{h==="speaking"&&m("idle")}})}catch(S){b.className="msg error",b.textContent=S instanceof y?S.userMessage:"Something went wrong. Please try again.",m("idle")}c.scrollTop=c.scrollHeight}function K(){e.cancel(),m("listening"),d.value="",t.start({onProcessing:()=>m("transcribing"),onFinal:a=>{H(a)},onError:a=>{k("error",a)},onEnd:()=>{(h==="listening"||h==="transcribing")&&m("idle")}})}function X(){e.prime(),i.dataset.open="true",d.focus()}function q(){R(),i.dataset.open="false",h!=="thinking"&&m("idle")}k("bot",se),t.supported?k("pending","Tap the mic and speak. Your recording is sent to Cloudflare Workers AI to be transcribed."):(v.hidden=!0,k("pending","Voice input isn't available in this browser, so please type your question.")),e.supported||(x.hidden=!0),x.setAttribute("aria-pressed",String(w));for(let a of $){let l=document.createElement("button");l.type="button",l.className="pill",l.textContent=a.label,l.addEventListener("click",()=>{e.prime(),H(a.question)}),g.set(a,l),u.append(l)}t.supported&&(v.dataset.nudge="true"),n(".launcher").addEventListener("click",X),n(".close").addEventListener("click",q),n(".contact").addEventListener("click",a=>{let l=document.querySelector('a[href="#contact"]');l&&(a.preventDefault(),l.click()),q()}),x.addEventListener("click",()=>{w=!w,x.setAttribute("aria-pressed",String(w)),w||(e.cancel(),h==="speaking"&&m("idle"))}),v.addEventListener("click",()=>{delete v.dataset.nudge,e.prime(),h==="listening"?t.stop():(h==="idle"||h==="speaking")&&K()}),E.addEventListener("submit",a=>{a.preventDefault(),e.prime(),H(d.value)}),r.addEventListener("keydown",a=>{a.key==="Escape"&&q()}),window.addEventListener("pagehide",R)}var U=document.currentScript?.dataset.api;function z(){if(!U){console.error('voice-agent: add data-api="https://your-worker.example" to the script tag.');return}V({api:new A(U),transcriber:new C(U),speaker:new M(U)})}document.readyState==="loading"?document.addEventListener("DOMContentLoaded",z):z();})();
