(function(){const e=document.createElement("link").relList;if(e&&e.supports&&e.supports("modulepreload"))return;for(const i of document.querySelectorAll('link[rel="modulepreload"]'))s(i);new MutationObserver(i=>{for(const r of i)if(r.type==="childList")for(const o of r.addedNodes)o.tagName==="LINK"&&o.rel==="modulepreload"&&s(o)}).observe(document,{childList:!0,subtree:!0});function t(i){const r={};return i.integrity&&(r.integrity=i.integrity),i.referrerPolicy&&(r.referrerPolicy=i.referrerPolicy),i.crossOrigin==="use-credentials"?r.credentials="include":i.crossOrigin==="anonymous"?r.credentials="omit":r.credentials="same-origin",r}function s(i){if(i.ep)return;i.ep=!0;const r=t(i);fetch(i.href,r)}})();var il={};/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const Mc={NODE_ADMIN:!1,SDK_VERSION:"${JSCORE_VERSION}"};/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const R=function(n,e){if(!n)throw os(e)},os=function(n){return new Error("Firebase Database ("+Mc.SDK_VERSION+") INTERNAL ASSERT FAILED: "+n)};/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const Dc=function(n){const e=[];let t=0;for(let s=0;s<n.length;s++){let i=n.charCodeAt(s);i<128?e[t++]=i:i<2048?(e[t++]=i>>6|192,e[t++]=i&63|128):(i&64512)===55296&&s+1<n.length&&(n.charCodeAt(s+1)&64512)===56320?(i=65536+((i&1023)<<10)+(n.charCodeAt(++s)&1023),e[t++]=i>>18|240,e[t++]=i>>12&63|128,e[t++]=i>>6&63|128,e[t++]=i&63|128):(e[t++]=i>>12|224,e[t++]=i>>6&63|128,e[t++]=i&63|128)}return e},Vh=function(n){const e=[];let t=0,s=0;for(;t<n.length;){const i=n[t++];if(i<128)e[s++]=String.fromCharCode(i);else if(i>191&&i<224){const r=n[t++];e[s++]=String.fromCharCode((i&31)<<6|r&63)}else if(i>239&&i<365){const r=n[t++],o=n[t++],a=n[t++],c=((i&7)<<18|(r&63)<<12|(o&63)<<6|a&63)-65536;e[s++]=String.fromCharCode(55296+(c>>10)),e[s++]=String.fromCharCode(56320+(c&1023))}else{const r=n[t++],o=n[t++];e[s++]=String.fromCharCode((i&15)<<12|(r&63)<<6|o&63)}}return e.join("")},$o={byteToCharMap_:null,charToByteMap_:null,byteToCharMapWebSafe_:null,charToByteMapWebSafe_:null,ENCODED_VALS_BASE:"ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789",get ENCODED_VALS(){return this.ENCODED_VALS_BASE+"+/="},get ENCODED_VALS_WEBSAFE(){return this.ENCODED_VALS_BASE+"-_."},HAS_NATIVE_SUPPORT:typeof atob=="function",encodeByteArray(n,e){if(!Array.isArray(n))throw Error("encodeByteArray takes an array as a parameter");this.init_();const t=e?this.byteToCharMapWebSafe_:this.byteToCharMap_,s=[];for(let i=0;i<n.length;i+=3){const r=n[i],o=i+1<n.length,a=o?n[i+1]:0,c=i+2<n.length,d=c?n[i+2]:0,h=r>>2,f=(r&3)<<4|a>>4;let _=(a&15)<<2|d>>6,p=d&63;c||(p=64,o||(_=64)),s.push(t[h],t[f],t[_],t[p])}return s.join("")},encodeString(n,e){return this.HAS_NATIVE_SUPPORT&&!e?btoa(n):this.encodeByteArray(Dc(n),e)},decodeString(n,e){return this.HAS_NATIVE_SUPPORT&&!e?atob(n):Vh(this.decodeStringToByteArray(n,e))},decodeStringToByteArray(n,e){this.init_();const t=e?this.charToByteMapWebSafe_:this.charToByteMap_,s=[];for(let i=0;i<n.length;){const r=t[n.charAt(i++)],a=i<n.length?t[n.charAt(i)]:0;++i;const d=i<n.length?t[n.charAt(i)]:64;++i;const f=i<n.length?t[n.charAt(i)]:64;if(++i,r==null||a==null||d==null||f==null)throw new qh;const _=r<<2|a>>4;if(s.push(_),d!==64){const p=a<<4&240|d>>2;if(s.push(p),f!==64){const I=d<<6&192|f;s.push(I)}}}return s},init_(){if(!this.byteToCharMap_){this.byteToCharMap_={},this.charToByteMap_={},this.byteToCharMapWebSafe_={},this.charToByteMapWebSafe_={};for(let n=0;n<this.ENCODED_VALS.length;n++)this.byteToCharMap_[n]=this.ENCODED_VALS.charAt(n),this.charToByteMap_[this.byteToCharMap_[n]]=n,this.byteToCharMapWebSafe_[n]=this.ENCODED_VALS_WEBSAFE.charAt(n),this.charToByteMapWebSafe_[this.byteToCharMapWebSafe_[n]]=n,n>=this.ENCODED_VALS_BASE.length&&(this.charToByteMap_[this.ENCODED_VALS_WEBSAFE.charAt(n)]=n,this.charToByteMapWebSafe_[this.ENCODED_VALS.charAt(n)]=n)}}};class qh extends Error{constructor(){super(...arguments),this.name="DecodeBase64StringError"}}const Lc=function(n){const e=Dc(n);return $o.encodeByteArray(e,!0)},Oi=function(n){return Lc(n).replace(/\./g,"")},Mi=function(n){try{return $o.decodeString(n,!0)}catch(e){console.error("base64Decode failed: ",e)}return null};/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function zh(n){return Fc(void 0,n)}function Fc(n,e){if(!(e instanceof Object))return e;switch(e.constructor){case Date:const t=e;return new Date(t.getTime());case Object:n===void 0&&(n={});break;case Array:n=[];break;default:return e}for(const t in e)!e.hasOwnProperty(t)||!Gh(t)||(n[t]=Fc(n[t],e[t]));return n}function Gh(n){return n!=="__proto__"}/**
 * @license
 * Copyright 2022 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function Yh(){if(typeof self<"u")return self;if(typeof window<"u")return window;if(typeof global<"u")return global;throw new Error("Unable to locate global object.")}/**
 * @license
 * Copyright 2022 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const Kh=()=>Yh().__FIREBASE_DEFAULTS__,Qh=()=>{if(typeof process>"u"||typeof il>"u")return;const n=il.__FIREBASE_DEFAULTS__;if(n)return JSON.parse(n)},Jh=()=>{if(typeof document>"u")return;let n;try{n=document.cookie.match(/__FIREBASE_DEFAULTS__=([^;]+)/)}catch{return}const e=n&&Mi(n[1]);return e&&JSON.parse(e)},Uo=()=>{try{return Kh()||Qh()||Jh()}catch(n){console.info(`Unable to get __FIREBASE_DEFAULTS__ due to: ${n}`);return}},$c=n=>{var e,t;return(t=(e=Uo())===null||e===void 0?void 0:e.emulatorHosts)===null||t===void 0?void 0:t[n]},Xh=n=>{const e=$c(n);if(!e)return;const t=e.lastIndexOf(":");if(t<=0||t+1===e.length)throw new Error(`Invalid host ${e} with no separate hostname and port!`);const s=parseInt(e.substring(t+1),10);return e[0]==="["?[e.substring(1,t-1),s]:[e.substring(0,t),s]},Uc=()=>{var n;return(n=Uo())===null||n===void 0?void 0:n.config},Wc=n=>{var e;return(e=Uo())===null||e===void 0?void 0:e[`_${n}`]};/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class mt{constructor(){this.reject=()=>{},this.resolve=()=>{},this.promise=new Promise((e,t)=>{this.resolve=e,this.reject=t})}wrapCallback(e){return(t,s)=>{t?this.reject(t):this.resolve(s),typeof e=="function"&&(this.promise.catch(()=>{}),e.length===1?e(t):e(t,s))}}}/**
 * @license
 * Copyright 2021 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function Zh(n,e){if(n.uid)throw new Error('The "uid" field is no longer supported by mockUserToken. Please use "sub" instead for Firebase Auth User ID.');const t={alg:"none",type:"JWT"},s=e||"demo-project",i=n.iat||0,r=n.sub||n.user_id;if(!r)throw new Error("mockUserToken must contain 'sub' or 'user_id' field!");const o=Object.assign({iss:`https://securetoken.google.com/${s}`,aud:s,iat:i,exp:i+3600,auth_time:i,sub:r,user_id:r,firebase:{sign_in_provider:"custom",identities:{}}},n);return[Oi(JSON.stringify(t)),Oi(JSON.stringify(o)),""].join(".")}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function Ve(){return typeof navigator<"u"&&typeof navigator.userAgent=="string"?navigator.userAgent:""}function Wo(){return typeof window<"u"&&!!(window.cordova||window.phonegap||window.PhoneGap)&&/ios|iphone|ipod|ipad|android|blackberry|iemobile/i.test(Ve())}function ef(){return typeof navigator<"u"&&navigator.userAgent==="Cloudflare-Workers"}function tf(){const n=typeof chrome=="object"?chrome.runtime:typeof browser=="object"?browser.runtime:void 0;return typeof n=="object"&&n.id!==void 0}function Bc(){return typeof navigator=="object"&&navigator.product==="ReactNative"}function nf(){const n=Ve();return n.indexOf("MSIE ")>=0||n.indexOf("Trident/")>=0}function sf(){return Mc.NODE_ADMIN===!0}function rf(){try{return typeof indexedDB=="object"}catch{return!1}}function of(){return new Promise((n,e)=>{try{let t=!0;const s="validate-browser-context-for-indexeddb-analytics-module",i=self.indexedDB.open(s);i.onsuccess=()=>{i.result.close(),t||self.indexedDB.deleteDatabase(s),n(!0)},i.onupgradeneeded=()=>{t=!1},i.onerror=()=>{var r;e(((r=i.error)===null||r===void 0?void 0:r.message)||"")}}catch(t){e(t)}})}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const af="FirebaseError";class an extends Error{constructor(e,t,s){super(t),this.code=e,this.customData=s,this.name=af,Object.setPrototypeOf(this,an.prototype),Error.captureStackTrace&&Error.captureStackTrace(this,ei.prototype.create)}}class ei{constructor(e,t,s){this.service=e,this.serviceName=t,this.errors=s}create(e,...t){const s=t[0]||{},i=`${this.service}/${e}`,r=this.errors[e],o=r?lf(r,s):"Error",a=`${this.serviceName}: ${o} (${i}).`;return new an(i,a,s)}}function lf(n,e){return n.replace(cf,(t,s)=>{const i=e[s];return i!=null?String(i):`<${s}?>`})}const cf=/\{\$([^}]+)}/g;/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function $s(n){return JSON.parse(n)}function Ae(n){return JSON.stringify(n)}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const Hc=function(n){let e={},t={},s={},i="";try{const r=n.split(".");e=$s(Mi(r[0])||""),t=$s(Mi(r[1])||""),i=r[2],s=t.d||{},delete t.d}catch{}return{header:e,claims:t,data:s,signature:i}},df=function(n){const e=Hc(n),t=e.claims;return!!t&&typeof t=="object"&&t.hasOwnProperty("iat")},uf=function(n){const e=Hc(n).claims;return typeof e=="object"&&e.admin===!0};/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function bt(n,e){return Object.prototype.hasOwnProperty.call(n,e)}function Yn(n,e){if(Object.prototype.hasOwnProperty.call(n,e))return n[e]}function Di(n){for(const e in n)if(Object.prototype.hasOwnProperty.call(n,e))return!1;return!0}function Li(n,e,t){const s={};for(const i in n)Object.prototype.hasOwnProperty.call(n,i)&&(s[i]=e.call(t,n[i],i,n));return s}function Fi(n,e){if(n===e)return!0;const t=Object.keys(n),s=Object.keys(e);for(const i of t){if(!s.includes(i))return!1;const r=n[i],o=e[i];if(rl(r)&&rl(o)){if(!Fi(r,o))return!1}else if(r!==o)return!1}for(const i of s)if(!t.includes(i))return!1;return!0}function rl(n){return n!==null&&typeof n=="object"}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function as(n){const e=[];for(const[t,s]of Object.entries(n))Array.isArray(s)?s.forEach(i=>{e.push(encodeURIComponent(t)+"="+encodeURIComponent(i))}):e.push(encodeURIComponent(t)+"="+encodeURIComponent(s));return e.length?"&"+e.join("&"):""}function Es(n){const e={};return n.replace(/^\?/,"").split("&").forEach(s=>{if(s){const[i,r]=s.split("=");e[decodeURIComponent(i)]=decodeURIComponent(r)}}),e}function Cs(n){const e=n.indexOf("?");if(!e)return"";const t=n.indexOf("#",e);return n.substring(e,t>0?t:void 0)}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class hf{constructor(){this.chain_=[],this.buf_=[],this.W_=[],this.pad_=[],this.inbuf_=0,this.total_=0,this.blockSize=512/8,this.pad_[0]=128;for(let e=1;e<this.blockSize;++e)this.pad_[e]=0;this.reset()}reset(){this.chain_[0]=1732584193,this.chain_[1]=4023233417,this.chain_[2]=2562383102,this.chain_[3]=271733878,this.chain_[4]=3285377520,this.inbuf_=0,this.total_=0}compress_(e,t){t||(t=0);const s=this.W_;if(typeof e=="string")for(let f=0;f<16;f++)s[f]=e.charCodeAt(t)<<24|e.charCodeAt(t+1)<<16|e.charCodeAt(t+2)<<8|e.charCodeAt(t+3),t+=4;else for(let f=0;f<16;f++)s[f]=e[t]<<24|e[t+1]<<16|e[t+2]<<8|e[t+3],t+=4;for(let f=16;f<80;f++){const _=s[f-3]^s[f-8]^s[f-14]^s[f-16];s[f]=(_<<1|_>>>31)&4294967295}let i=this.chain_[0],r=this.chain_[1],o=this.chain_[2],a=this.chain_[3],c=this.chain_[4],d,h;for(let f=0;f<80;f++){f<40?f<20?(d=a^r&(o^a),h=1518500249):(d=r^o^a,h=1859775393):f<60?(d=r&o|a&(r|o),h=2400959708):(d=r^o^a,h=3395469782);const _=(i<<5|i>>>27)+d+c+h+s[f]&4294967295;c=a,a=o,o=(r<<30|r>>>2)&4294967295,r=i,i=_}this.chain_[0]=this.chain_[0]+i&4294967295,this.chain_[1]=this.chain_[1]+r&4294967295,this.chain_[2]=this.chain_[2]+o&4294967295,this.chain_[3]=this.chain_[3]+a&4294967295,this.chain_[4]=this.chain_[4]+c&4294967295}update(e,t){if(e==null)return;t===void 0&&(t=e.length);const s=t-this.blockSize;let i=0;const r=this.buf_;let o=this.inbuf_;for(;i<t;){if(o===0)for(;i<=s;)this.compress_(e,i),i+=this.blockSize;if(typeof e=="string"){for(;i<t;)if(r[o]=e.charCodeAt(i),++o,++i,o===this.blockSize){this.compress_(r),o=0;break}}else for(;i<t;)if(r[o]=e[i],++o,++i,o===this.blockSize){this.compress_(r),o=0;break}}this.inbuf_=o,this.total_+=t}digest(){const e=[];let t=this.total_*8;this.inbuf_<56?this.update(this.pad_,56-this.inbuf_):this.update(this.pad_,this.blockSize-(this.inbuf_-56));for(let i=this.blockSize-1;i>=56;i--)this.buf_[i]=t&255,t/=256;this.compress_(this.buf_);let s=0;for(let i=0;i<5;i++)for(let r=24;r>=0;r-=8)e[s]=this.chain_[i]>>r&255,++s;return e}}function ff(n,e){const t=new pf(n,e);return t.subscribe.bind(t)}class pf{constructor(e,t){this.observers=[],this.unsubscribes=[],this.observerCount=0,this.task=Promise.resolve(),this.finalized=!1,this.onNoObservers=t,this.task.then(()=>{e(this)}).catch(s=>{this.error(s)})}next(e){this.forEachObserver(t=>{t.next(e)})}error(e){this.forEachObserver(t=>{t.error(e)}),this.close(e)}complete(){this.forEachObserver(e=>{e.complete()}),this.close()}subscribe(e,t,s){let i;if(e===void 0&&t===void 0&&s===void 0)throw new Error("Missing Observer.");mf(e,["next","error","complete"])?i=e:i={next:e,error:t,complete:s},i.next===void 0&&(i.next=Or),i.error===void 0&&(i.error=Or),i.complete===void 0&&(i.complete=Or);const r=this.unsubscribeOne.bind(this,this.observers.length);return this.finalized&&this.task.then(()=>{try{this.finalError?i.error(this.finalError):i.complete()}catch{}}),this.observers.push(i),r}unsubscribeOne(e){this.observers===void 0||this.observers[e]===void 0||(delete this.observers[e],this.observerCount-=1,this.observerCount===0&&this.onNoObservers!==void 0&&this.onNoObservers(this))}forEachObserver(e){if(!this.finalized)for(let t=0;t<this.observers.length;t++)this.sendOne(t,e)}sendOne(e,t){this.task.then(()=>{if(this.observers!==void 0&&this.observers[e]!==void 0)try{t(this.observers[e])}catch(s){typeof console<"u"&&console.error&&console.error(s)}})}close(e){this.finalized||(this.finalized=!0,e!==void 0&&(this.finalError=e),this.task.then(()=>{this.observers=void 0,this.onNoObservers=void 0}))}}function mf(n,e){if(typeof n!="object"||n===null)return!1;for(const t of e)if(t in n&&typeof n[t]=="function")return!0;return!1}function Or(){}function Kn(n,e){return`${n} failed: ${e} argument `}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const gf=function(n){const e=[];let t=0;for(let s=0;s<n.length;s++){let i=n.charCodeAt(s);if(i>=55296&&i<=56319){const r=i-55296;s++,R(s<n.length,"Surrogate pair missing trail surrogate.");const o=n.charCodeAt(s)-56320;i=65536+(r<<10)+o}i<128?e[t++]=i:i<2048?(e[t++]=i>>6|192,e[t++]=i&63|128):i<65536?(e[t++]=i>>12|224,e[t++]=i>>6&63|128,e[t++]=i&63|128):(e[t++]=i>>18|240,e[t++]=i>>12&63|128,e[t++]=i>>6&63|128,e[t++]=i&63|128)}return e},ar=function(n){let e=0;for(let t=0;t<n.length;t++){const s=n.charCodeAt(t);s<128?e++:s<2048?e+=2:s>=55296&&s<=56319?(e+=4,t++):e+=3}return e};/**
 * @license
 * Copyright 2021 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function xe(n){return n&&n._delegate?n._delegate:n}class vn{constructor(e,t,s){this.name=e,this.instanceFactory=t,this.type=s,this.multipleInstances=!1,this.serviceProps={},this.instantiationMode="LAZY",this.onInstanceCreated=null}setInstantiationMode(e){return this.instantiationMode=e,this}setMultipleInstances(e){return this.multipleInstances=e,this}setServiceProps(e){return this.serviceProps=e,this}setInstanceCreatedCallback(e){return this.onInstanceCreated=e,this}}/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const fn="[DEFAULT]";/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class _f{constructor(e,t){this.name=e,this.container=t,this.component=null,this.instances=new Map,this.instancesDeferred=new Map,this.instancesOptions=new Map,this.onInitCallbacks=new Map}get(e){const t=this.normalizeInstanceIdentifier(e);if(!this.instancesDeferred.has(t)){const s=new mt;if(this.instancesDeferred.set(t,s),this.isInitialized(t)||this.shouldAutoInitialize())try{const i=this.getOrInitializeService({instanceIdentifier:t});i&&s.resolve(i)}catch{}}return this.instancesDeferred.get(t).promise}getImmediate(e){var t;const s=this.normalizeInstanceIdentifier(e==null?void 0:e.identifier),i=(t=e==null?void 0:e.optional)!==null&&t!==void 0?t:!1;if(this.isInitialized(s)||this.shouldAutoInitialize())try{return this.getOrInitializeService({instanceIdentifier:s})}catch(r){if(i)return null;throw r}else{if(i)return null;throw Error(`Service ${this.name} is not available`)}}getComponent(){return this.component}setComponent(e){if(e.name!==this.name)throw Error(`Mismatching Component ${e.name} for Provider ${this.name}.`);if(this.component)throw Error(`Component for ${this.name} has already been provided`);if(this.component=e,!!this.shouldAutoInitialize()){if(vf(e))try{this.getOrInitializeService({instanceIdentifier:fn})}catch{}for(const[t,s]of this.instancesDeferred.entries()){const i=this.normalizeInstanceIdentifier(t);try{const r=this.getOrInitializeService({instanceIdentifier:i});s.resolve(r)}catch{}}}}clearInstance(e=fn){this.instancesDeferred.delete(e),this.instancesOptions.delete(e),this.instances.delete(e)}async delete(){const e=Array.from(this.instances.values());await Promise.all([...e.filter(t=>"INTERNAL"in t).map(t=>t.INTERNAL.delete()),...e.filter(t=>"_delete"in t).map(t=>t._delete())])}isComponentSet(){return this.component!=null}isInitialized(e=fn){return this.instances.has(e)}getOptions(e=fn){return this.instancesOptions.get(e)||{}}initialize(e={}){const{options:t={}}=e,s=this.normalizeInstanceIdentifier(e.instanceIdentifier);if(this.isInitialized(s))throw Error(`${this.name}(${s}) has already been initialized`);if(!this.isComponentSet())throw Error(`Component ${this.name} has not been registered yet`);const i=this.getOrInitializeService({instanceIdentifier:s,options:t});for(const[r,o]of this.instancesDeferred.entries()){const a=this.normalizeInstanceIdentifier(r);s===a&&o.resolve(i)}return i}onInit(e,t){var s;const i=this.normalizeInstanceIdentifier(t),r=(s=this.onInitCallbacks.get(i))!==null&&s!==void 0?s:new Set;r.add(e),this.onInitCallbacks.set(i,r);const o=this.instances.get(i);return o&&e(o,i),()=>{r.delete(e)}}invokeOnInitCallbacks(e,t){const s=this.onInitCallbacks.get(t);if(s)for(const i of s)try{i(e,t)}catch{}}getOrInitializeService({instanceIdentifier:e,options:t={}}){let s=this.instances.get(e);if(!s&&this.component&&(s=this.component.instanceFactory(this.container,{instanceIdentifier:yf(e),options:t}),this.instances.set(e,s),this.instancesOptions.set(e,t),this.invokeOnInitCallbacks(s,e),this.component.onInstanceCreated))try{this.component.onInstanceCreated(this.container,e,s)}catch{}return s||null}normalizeInstanceIdentifier(e=fn){return this.component?this.component.multipleInstances?e:fn:e}shouldAutoInitialize(){return!!this.component&&this.component.instantiationMode!=="EXPLICIT"}}function yf(n){return n===fn?void 0:n}function vf(n){return n.instantiationMode==="EAGER"}/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class bf{constructor(e){this.name=e,this.providers=new Map}addComponent(e){const t=this.getProvider(e.name);if(t.isComponentSet())throw new Error(`Component ${e.name} has already been registered with ${this.name}`);t.setComponent(e)}addOrOverwriteComponent(e){this.getProvider(e.name).isComponentSet()&&this.providers.delete(e.name),this.addComponent(e)}getProvider(e){if(this.providers.has(e))return this.providers.get(e);const t=new _f(e,this);return this.providers.set(e,t),t}getProviders(){return Array.from(this.providers.values())}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */var ve;(function(n){n[n.DEBUG=0]="DEBUG",n[n.VERBOSE=1]="VERBOSE",n[n.INFO=2]="INFO",n[n.WARN=3]="WARN",n[n.ERROR=4]="ERROR",n[n.SILENT=5]="SILENT"})(ve||(ve={}));const wf={debug:ve.DEBUG,verbose:ve.VERBOSE,info:ve.INFO,warn:ve.WARN,error:ve.ERROR,silent:ve.SILENT},Ef=ve.INFO,Cf={[ve.DEBUG]:"log",[ve.VERBOSE]:"log",[ve.INFO]:"info",[ve.WARN]:"warn",[ve.ERROR]:"error"},If=(n,e,...t)=>{if(e<n.logLevel)return;const s=new Date().toISOString(),i=Cf[e];if(i)console[i](`[${s}]  ${n.name}:`,...t);else throw new Error(`Attempted to log a message with an invalid logType (value: ${e})`)};class Bo{constructor(e){this.name=e,this._logLevel=Ef,this._logHandler=If,this._userLogHandler=null}get logLevel(){return this._logLevel}set logLevel(e){if(!(e in ve))throw new TypeError(`Invalid value "${e}" assigned to \`logLevel\``);this._logLevel=e}setLogLevel(e){this._logLevel=typeof e=="string"?wf[e]:e}get logHandler(){return this._logHandler}set logHandler(e){if(typeof e!="function")throw new TypeError("Value assigned to `logHandler` must be a function");this._logHandler=e}get userLogHandler(){return this._userLogHandler}set userLogHandler(e){this._userLogHandler=e}debug(...e){this._userLogHandler&&this._userLogHandler(this,ve.DEBUG,...e),this._logHandler(this,ve.DEBUG,...e)}log(...e){this._userLogHandler&&this._userLogHandler(this,ve.VERBOSE,...e),this._logHandler(this,ve.VERBOSE,...e)}info(...e){this._userLogHandler&&this._userLogHandler(this,ve.INFO,...e),this._logHandler(this,ve.INFO,...e)}warn(...e){this._userLogHandler&&this._userLogHandler(this,ve.WARN,...e),this._logHandler(this,ve.WARN,...e)}error(...e){this._userLogHandler&&this._userLogHandler(this,ve.ERROR,...e),this._logHandler(this,ve.ERROR,...e)}}const Sf=(n,e)=>e.some(t=>n instanceof t);let ol,al;function Tf(){return ol||(ol=[IDBDatabase,IDBObjectStore,IDBIndex,IDBCursor,IDBTransaction])}function kf(){return al||(al=[IDBCursor.prototype.advance,IDBCursor.prototype.continue,IDBCursor.prototype.continuePrimaryKey])}const jc=new WeakMap,eo=new WeakMap,Vc=new WeakMap,Mr=new WeakMap,Ho=new WeakMap;function xf(n){const e=new Promise((t,s)=>{const i=()=>{n.removeEventListener("success",r),n.removeEventListener("error",o)},r=()=>{t(Kt(n.result)),i()},o=()=>{s(n.error),i()};n.addEventListener("success",r),n.addEventListener("error",o)});return e.then(t=>{t instanceof IDBCursor&&jc.set(t,n)}).catch(()=>{}),Ho.set(e,n),e}function Af(n){if(eo.has(n))return;const e=new Promise((t,s)=>{const i=()=>{n.removeEventListener("complete",r),n.removeEventListener("error",o),n.removeEventListener("abort",o)},r=()=>{t(),i()},o=()=>{s(n.error||new DOMException("AbortError","AbortError")),i()};n.addEventListener("complete",r),n.addEventListener("error",o),n.addEventListener("abort",o)});eo.set(n,e)}let to={get(n,e,t){if(n instanceof IDBTransaction){if(e==="done")return eo.get(n);if(e==="objectStoreNames")return n.objectStoreNames||Vc.get(n);if(e==="store")return t.objectStoreNames[1]?void 0:t.objectStore(t.objectStoreNames[0])}return Kt(n[e])},set(n,e,t){return n[e]=t,!0},has(n,e){return n instanceof IDBTransaction&&(e==="done"||e==="store")?!0:e in n}};function Rf(n){to=n(to)}function Pf(n){return n===IDBDatabase.prototype.transaction&&!("objectStoreNames"in IDBTransaction.prototype)?function(e,...t){const s=n.call(Dr(this),e,...t);return Vc.set(s,e.sort?e.sort():[e]),Kt(s)}:kf().includes(n)?function(...e){return n.apply(Dr(this),e),Kt(jc.get(this))}:function(...e){return Kt(n.apply(Dr(this),e))}}function Nf(n){return typeof n=="function"?Pf(n):(n instanceof IDBTransaction&&Af(n),Sf(n,Tf())?new Proxy(n,to):n)}function Kt(n){if(n instanceof IDBRequest)return xf(n);if(Mr.has(n))return Mr.get(n);const e=Nf(n);return e!==n&&(Mr.set(n,e),Ho.set(e,n)),e}const Dr=n=>Ho.get(n);function Of(n,e,{blocked:t,upgrade:s,blocking:i,terminated:r}={}){const o=indexedDB.open(n,e),a=Kt(o);return s&&o.addEventListener("upgradeneeded",c=>{s(Kt(o.result),c.oldVersion,c.newVersion,Kt(o.transaction),c)}),t&&o.addEventListener("blocked",c=>t(c.oldVersion,c.newVersion,c)),a.then(c=>{r&&c.addEventListener("close",()=>r()),i&&c.addEventListener("versionchange",d=>i(d.oldVersion,d.newVersion,d))}).catch(()=>{}),a}const Mf=["get","getKey","getAll","getAllKeys","count"],Df=["put","add","delete","clear"],Lr=new Map;function ll(n,e){if(!(n instanceof IDBDatabase&&!(e in n)&&typeof e=="string"))return;if(Lr.get(e))return Lr.get(e);const t=e.replace(/FromIndex$/,""),s=e!==t,i=Df.includes(t);if(!(t in(s?IDBIndex:IDBObjectStore).prototype)||!(i||Mf.includes(t)))return;const r=async function(o,...a){const c=this.transaction(o,i?"readwrite":"readonly");let d=c.store;return s&&(d=d.index(a.shift())),(await Promise.all([d[t](...a),i&&c.done]))[0]};return Lr.set(e,r),r}Rf(n=>({...n,get:(e,t,s)=>ll(e,t)||n.get(e,t,s),has:(e,t)=>!!ll(e,t)||n.has(e,t)}));/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Lf{constructor(e){this.container=e}getPlatformInfoString(){return this.container.getProviders().map(t=>{if(Ff(t)){const s=t.getImmediate();return`${s.library}/${s.version}`}else return null}).filter(t=>t).join(" ")}}function Ff(n){const e=n.getComponent();return(e==null?void 0:e.type)==="VERSION"}const no="@firebase/app",cl="0.10.13";/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const Mt=new Bo("@firebase/app"),$f="@firebase/app-compat",Uf="@firebase/analytics-compat",Wf="@firebase/analytics",Bf="@firebase/app-check-compat",Hf="@firebase/app-check",jf="@firebase/auth",Vf="@firebase/auth-compat",qf="@firebase/database",zf="@firebase/data-connect",Gf="@firebase/database-compat",Yf="@firebase/functions",Kf="@firebase/functions-compat",Qf="@firebase/installations",Jf="@firebase/installations-compat",Xf="@firebase/messaging",Zf="@firebase/messaging-compat",ep="@firebase/performance",tp="@firebase/performance-compat",np="@firebase/remote-config",sp="@firebase/remote-config-compat",ip="@firebase/storage",rp="@firebase/storage-compat",op="@firebase/firestore",ap="@firebase/vertexai-preview",lp="@firebase/firestore-compat",cp="firebase",dp="10.14.1";/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const so="[DEFAULT]",up={[no]:"fire-core",[$f]:"fire-core-compat",[Wf]:"fire-analytics",[Uf]:"fire-analytics-compat",[Hf]:"fire-app-check",[Bf]:"fire-app-check-compat",[jf]:"fire-auth",[Vf]:"fire-auth-compat",[qf]:"fire-rtdb",[zf]:"fire-data-connect",[Gf]:"fire-rtdb-compat",[Yf]:"fire-fn",[Kf]:"fire-fn-compat",[Qf]:"fire-iid",[Jf]:"fire-iid-compat",[Xf]:"fire-fcm",[Zf]:"fire-fcm-compat",[ep]:"fire-perf",[tp]:"fire-perf-compat",[np]:"fire-rc",[sp]:"fire-rc-compat",[ip]:"fire-gcs",[rp]:"fire-gcs-compat",[op]:"fire-fst",[lp]:"fire-fst-compat",[ap]:"fire-vertex","fire-js":"fire-js",[cp]:"fire-js-all"};/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const $i=new Map,hp=new Map,io=new Map;function dl(n,e){try{n.container.addComponent(e)}catch(t){Mt.debug(`Component ${e.name} failed to register with FirebaseApp ${n.name}`,t)}}function Qn(n){const e=n.name;if(io.has(e))return Mt.debug(`There were multiple attempts to register component ${e}.`),!1;io.set(e,n);for(const t of $i.values())dl(t,n);for(const t of hp.values())dl(t,n);return!0}function jo(n,e){const t=n.container.getProvider("heartbeat").getImmediate({optional:!0});return t&&t.triggerHeartbeat(),n.container.getProvider(e)}function gt(n){return n.settings!==void 0}/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const fp={"no-app":"No Firebase App '{$appName}' has been created - call initializeApp() first","bad-app-name":"Illegal App name: '{$appName}'","duplicate-app":"Firebase App named '{$appName}' already exists with different options or config","app-deleted":"Firebase App named '{$appName}' already deleted","server-app-deleted":"Firebase Server App has been deleted","no-options":"Need to provide options, when not being deployed to hosting via source.","invalid-app-argument":"firebase.{$appName}() takes either no argument or a Firebase App instance.","invalid-log-argument":"First argument to `onLog` must be null or a function.","idb-open":"Error thrown when opening IndexedDB. Original error: {$originalErrorMessage}.","idb-get":"Error thrown when reading from IndexedDB. Original error: {$originalErrorMessage}.","idb-set":"Error thrown when writing to IndexedDB. Original error: {$originalErrorMessage}.","idb-delete":"Error thrown when deleting from IndexedDB. Original error: {$originalErrorMessage}.","finalization-registry-not-supported":"FirebaseServerApp deleteOnDeref field defined but the JS runtime does not support FinalizationRegistry.","invalid-server-app-environment":"FirebaseServerApp is not for use in browser environments."},Qt=new ei("app","Firebase",fp);/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class pp{constructor(e,t,s){this._isDeleted=!1,this._options=Object.assign({},e),this._config=Object.assign({},t),this._name=t.name,this._automaticDataCollectionEnabled=t.automaticDataCollectionEnabled,this._container=s,this.container.addComponent(new vn("app",()=>this,"PUBLIC"))}get automaticDataCollectionEnabled(){return this.checkDestroyed(),this._automaticDataCollectionEnabled}set automaticDataCollectionEnabled(e){this.checkDestroyed(),this._automaticDataCollectionEnabled=e}get name(){return this.checkDestroyed(),this._name}get options(){return this.checkDestroyed(),this._options}get config(){return this.checkDestroyed(),this._config}get container(){return this._container}get isDeleted(){return this._isDeleted}set isDeleted(e){this._isDeleted=e}checkDestroyed(){if(this.isDeleted)throw Qt.create("app-deleted",{appName:this._name})}}/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const ls=dp;function qc(n,e={}){let t=n;typeof e!="object"&&(e={name:e});const s=Object.assign({name:so,automaticDataCollectionEnabled:!1},e),i=s.name;if(typeof i!="string"||!i)throw Qt.create("bad-app-name",{appName:String(i)});if(t||(t=Uc()),!t)throw Qt.create("no-options");const r=$i.get(i);if(r){if(Fi(t,r.options)&&Fi(s,r.config))return r;throw Qt.create("duplicate-app",{appName:i})}const o=new bf(i);for(const c of io.values())o.addComponent(c);const a=new pp(t,s,o);return $i.set(i,a),a}function zc(n=so){const e=$i.get(n);if(!e&&n===so&&Uc())return qc();if(!e)throw Qt.create("no-app",{appName:n});return e}function Jt(n,e,t){var s;let i=(s=up[n])!==null&&s!==void 0?s:n;t&&(i+=`-${t}`);const r=i.match(/\s|\//),o=e.match(/\s|\//);if(r||o){const a=[`Unable to register library "${i}" with version "${e}":`];r&&a.push(`library name "${i}" contains illegal characters (whitespace or "/")`),r&&o&&a.push("and"),o&&a.push(`version name "${e}" contains illegal characters (whitespace or "/")`),Mt.warn(a.join(" "));return}Qn(new vn(`${i}-version`,()=>({library:i,version:e}),"VERSION"))}/**
 * @license
 * Copyright 2021 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const mp="firebase-heartbeat-database",gp=1,Us="firebase-heartbeat-store";let Fr=null;function Gc(){return Fr||(Fr=Of(mp,gp,{upgrade:(n,e)=>{switch(e){case 0:try{n.createObjectStore(Us)}catch(t){console.warn(t)}}}}).catch(n=>{throw Qt.create("idb-open",{originalErrorMessage:n.message})})),Fr}async function _p(n){try{const t=(await Gc()).transaction(Us),s=await t.objectStore(Us).get(Yc(n));return await t.done,s}catch(e){if(e instanceof an)Mt.warn(e.message);else{const t=Qt.create("idb-get",{originalErrorMessage:e==null?void 0:e.message});Mt.warn(t.message)}}}async function ul(n,e){try{const s=(await Gc()).transaction(Us,"readwrite");await s.objectStore(Us).put(e,Yc(n)),await s.done}catch(t){if(t instanceof an)Mt.warn(t.message);else{const s=Qt.create("idb-set",{originalErrorMessage:t==null?void 0:t.message});Mt.warn(s.message)}}}function Yc(n){return`${n.name}!${n.options.appId}`}/**
 * @license
 * Copyright 2021 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const yp=1024,vp=30*24*60*60*1e3;class bp{constructor(e){this.container=e,this._heartbeatsCache=null;const t=this.container.getProvider("app").getImmediate();this._storage=new Ep(t),this._heartbeatsCachePromise=this._storage.read().then(s=>(this._heartbeatsCache=s,s))}async triggerHeartbeat(){var e,t;try{const i=this.container.getProvider("platform-logger").getImmediate().getPlatformInfoString(),r=hl();return((e=this._heartbeatsCache)===null||e===void 0?void 0:e.heartbeats)==null&&(this._heartbeatsCache=await this._heartbeatsCachePromise,((t=this._heartbeatsCache)===null||t===void 0?void 0:t.heartbeats)==null)||this._heartbeatsCache.lastSentHeartbeatDate===r||this._heartbeatsCache.heartbeats.some(o=>o.date===r)?void 0:(this._heartbeatsCache.heartbeats.push({date:r,agent:i}),this._heartbeatsCache.heartbeats=this._heartbeatsCache.heartbeats.filter(o=>{const a=new Date(o.date).valueOf();return Date.now()-a<=vp}),this._storage.overwrite(this._heartbeatsCache))}catch(s){Mt.warn(s)}}async getHeartbeatsHeader(){var e;try{if(this._heartbeatsCache===null&&await this._heartbeatsCachePromise,((e=this._heartbeatsCache)===null||e===void 0?void 0:e.heartbeats)==null||this._heartbeatsCache.heartbeats.length===0)return"";const t=hl(),{heartbeatsToSend:s,unsentEntries:i}=wp(this._heartbeatsCache.heartbeats),r=Oi(JSON.stringify({version:2,heartbeats:s}));return this._heartbeatsCache.lastSentHeartbeatDate=t,i.length>0?(this._heartbeatsCache.heartbeats=i,await this._storage.overwrite(this._heartbeatsCache)):(this._heartbeatsCache.heartbeats=[],this._storage.overwrite(this._heartbeatsCache)),r}catch(t){return Mt.warn(t),""}}}function hl(){return new Date().toISOString().substring(0,10)}function wp(n,e=yp){const t=[];let s=n.slice();for(const i of n){const r=t.find(o=>o.agent===i.agent);if(r){if(r.dates.push(i.date),fl(t)>e){r.dates.pop();break}}else if(t.push({agent:i.agent,dates:[i.date]}),fl(t)>e){t.pop();break}s=s.slice(1)}return{heartbeatsToSend:t,unsentEntries:s}}class Ep{constructor(e){this.app=e,this._canUseIndexedDBPromise=this.runIndexedDBEnvironmentCheck()}async runIndexedDBEnvironmentCheck(){return rf()?of().then(()=>!0).catch(()=>!1):!1}async read(){if(await this._canUseIndexedDBPromise){const t=await _p(this.app);return t!=null&&t.heartbeats?t:{heartbeats:[]}}else return{heartbeats:[]}}async overwrite(e){var t;if(await this._canUseIndexedDBPromise){const i=await this.read();return ul(this.app,{lastSentHeartbeatDate:(t=e.lastSentHeartbeatDate)!==null&&t!==void 0?t:i.lastSentHeartbeatDate,heartbeats:e.heartbeats})}else return}async add(e){var t;if(await this._canUseIndexedDBPromise){const i=await this.read();return ul(this.app,{lastSentHeartbeatDate:(t=e.lastSentHeartbeatDate)!==null&&t!==void 0?t:i.lastSentHeartbeatDate,heartbeats:[...i.heartbeats,...e.heartbeats]})}else return}}function fl(n){return Oi(JSON.stringify({version:2,heartbeats:n})).length}/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function Cp(n){Qn(new vn("platform-logger",e=>new Lf(e),"PRIVATE")),Qn(new vn("heartbeat",e=>new bp(e),"PRIVATE")),Jt(no,cl,n),Jt(no,cl,"esm2017"),Jt("fire-js","")}Cp("");function Vo(n,e){var t={};for(var s in n)Object.prototype.hasOwnProperty.call(n,s)&&e.indexOf(s)<0&&(t[s]=n[s]);if(n!=null&&typeof Object.getOwnPropertySymbols=="function")for(var i=0,s=Object.getOwnPropertySymbols(n);i<s.length;i++)e.indexOf(s[i])<0&&Object.prototype.propertyIsEnumerable.call(n,s[i])&&(t[s[i]]=n[s[i]]);return t}function Kc(){return{"dependent-sdk-initialized-before-auth":"Another Firebase SDK was initialized and is trying to use Auth before Auth is initialized. Please be sure to call `initializeAuth` or `getAuth` before starting any other Firebase SDK."}}const Ip=Kc,Qc=new ei("auth","Firebase",Kc());/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const Ui=new Bo("@firebase/auth");function Sp(n,...e){Ui.logLevel<=ve.WARN&&Ui.warn(`Auth (${ls}): ${n}`,...e)}function xi(n,...e){Ui.logLevel<=ve.ERROR&&Ui.error(`Auth (${ls}): ${n}`,...e)}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function ut(n,...e){throw qo(n,...e)}function _t(n,...e){return qo(n,...e)}function Jc(n,e,t){const s=Object.assign(Object.assign({},Ip()),{[e]:t});return new ei("auth","Firebase",s).create(e,{appName:n.name})}function Pt(n){return Jc(n,"operation-not-supported-in-this-environment","Operations that alter the current user are not supported in conjunction with FirebaseServerApp")}function qo(n,...e){if(typeof n!="string"){const t=e[0],s=[...e.slice(1)];return s[0]&&(s[0].appName=n.name),n._errorFactory.create(t,...s)}return Qc.create(n,...e)}function K(n,e,...t){if(!n)throw qo(e,...t)}function kt(n){const e="INTERNAL ASSERTION FAILED: "+n;throw xi(e),new Error(e)}function Dt(n,e){n||kt(e)}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function ro(){var n;return typeof self<"u"&&((n=self.location)===null||n===void 0?void 0:n.href)||""}function Tp(){return pl()==="http:"||pl()==="https:"}function pl(){var n;return typeof self<"u"&&((n=self.location)===null||n===void 0?void 0:n.protocol)||null}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function kp(){return typeof navigator<"u"&&navigator&&"onLine"in navigator&&typeof navigator.onLine=="boolean"&&(Tp()||tf()||"connection"in navigator)?navigator.onLine:!0}function xp(){if(typeof navigator>"u")return null;const n=navigator;return n.languages&&n.languages[0]||n.language||null}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class ti{constructor(e,t){this.shortDelay=e,this.longDelay=t,Dt(t>e,"Short delay should be less than long delay!"),this.isMobile=Wo()||Bc()}get(){return kp()?this.isMobile?this.longDelay:this.shortDelay:Math.min(5e3,this.shortDelay)}}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function zo(n,e){Dt(n.emulator,"Emulator should always be set here");const{url:t}=n.emulator;return e?`${t}${e.startsWith("/")?e.slice(1):e}`:t}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Xc{static initialize(e,t,s){this.fetchImpl=e,t&&(this.headersImpl=t),s&&(this.responseImpl=s)}static fetch(){if(this.fetchImpl)return this.fetchImpl;if(typeof self<"u"&&"fetch"in self)return self.fetch;if(typeof globalThis<"u"&&globalThis.fetch)return globalThis.fetch;if(typeof fetch<"u")return fetch;kt("Could not find fetch implementation, make sure you call FetchProvider.initialize() with an appropriate polyfill")}static headers(){if(this.headersImpl)return this.headersImpl;if(typeof self<"u"&&"Headers"in self)return self.Headers;if(typeof globalThis<"u"&&globalThis.Headers)return globalThis.Headers;if(typeof Headers<"u")return Headers;kt("Could not find Headers implementation, make sure you call FetchProvider.initialize() with an appropriate polyfill")}static response(){if(this.responseImpl)return this.responseImpl;if(typeof self<"u"&&"Response"in self)return self.Response;if(typeof globalThis<"u"&&globalThis.Response)return globalThis.Response;if(typeof Response<"u")return Response;kt("Could not find Response implementation, make sure you call FetchProvider.initialize() with an appropriate polyfill")}}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const Ap={CREDENTIAL_MISMATCH:"custom-token-mismatch",MISSING_CUSTOM_TOKEN:"internal-error",INVALID_IDENTIFIER:"invalid-email",MISSING_CONTINUE_URI:"internal-error",INVALID_PASSWORD:"wrong-password",MISSING_PASSWORD:"missing-password",INVALID_LOGIN_CREDENTIALS:"invalid-credential",EMAIL_EXISTS:"email-already-in-use",PASSWORD_LOGIN_DISABLED:"operation-not-allowed",INVALID_IDP_RESPONSE:"invalid-credential",INVALID_PENDING_TOKEN:"invalid-credential",FEDERATED_USER_ID_ALREADY_LINKED:"credential-already-in-use",MISSING_REQ_TYPE:"internal-error",EMAIL_NOT_FOUND:"user-not-found",RESET_PASSWORD_EXCEED_LIMIT:"too-many-requests",EXPIRED_OOB_CODE:"expired-action-code",INVALID_OOB_CODE:"invalid-action-code",MISSING_OOB_CODE:"internal-error",CREDENTIAL_TOO_OLD_LOGIN_AGAIN:"requires-recent-login",INVALID_ID_TOKEN:"invalid-user-token",TOKEN_EXPIRED:"user-token-expired",USER_NOT_FOUND:"user-token-expired",TOO_MANY_ATTEMPTS_TRY_LATER:"too-many-requests",PASSWORD_DOES_NOT_MEET_REQUIREMENTS:"password-does-not-meet-requirements",INVALID_CODE:"invalid-verification-code",INVALID_SESSION_INFO:"invalid-verification-id",INVALID_TEMPORARY_PROOF:"invalid-credential",MISSING_SESSION_INFO:"missing-verification-id",SESSION_EXPIRED:"code-expired",MISSING_ANDROID_PACKAGE_NAME:"missing-android-pkg-name",UNAUTHORIZED_DOMAIN:"unauthorized-continue-uri",INVALID_OAUTH_CLIENT_ID:"invalid-oauth-client-id",ADMIN_ONLY_OPERATION:"admin-restricted-operation",INVALID_MFA_PENDING_CREDENTIAL:"invalid-multi-factor-session",MFA_ENROLLMENT_NOT_FOUND:"multi-factor-info-not-found",MISSING_MFA_ENROLLMENT_ID:"missing-multi-factor-info",MISSING_MFA_PENDING_CREDENTIAL:"missing-multi-factor-session",SECOND_FACTOR_EXISTS:"second-factor-already-in-use",SECOND_FACTOR_LIMIT_EXCEEDED:"maximum-second-factor-count-exceeded",BLOCKING_FUNCTION_ERROR_RESPONSE:"internal-error",RECAPTCHA_NOT_ENABLED:"recaptcha-not-enabled",MISSING_RECAPTCHA_TOKEN:"missing-recaptcha-token",INVALID_RECAPTCHA_TOKEN:"invalid-recaptcha-token",INVALID_RECAPTCHA_ACTION:"invalid-recaptcha-action",MISSING_CLIENT_TYPE:"missing-client-type",MISSING_RECAPTCHA_VERSION:"missing-recaptcha-version",INVALID_RECAPTCHA_VERSION:"invalid-recaptcha-version",INVALID_REQ_TYPE:"invalid-req-type"};/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const Rp=new ti(3e4,6e4);function ln(n,e){return n.tenantId&&!e.tenantId?Object.assign(Object.assign({},e),{tenantId:n.tenantId}):e}async function $t(n,e,t,s,i={}){return Zc(n,i,async()=>{let r={},o={};s&&(e==="GET"?o=s:r={body:JSON.stringify(s)});const a=as(Object.assign({key:n.config.apiKey},o)).slice(1),c=await n._getAdditionalHeaders();c["Content-Type"]="application/json",n.languageCode&&(c["X-Firebase-Locale"]=n.languageCode);const d=Object.assign({method:e,headers:c},r);return ef()||(d.referrerPolicy="no-referrer"),Xc.fetch()(ed(n,n.config.apiHost,t,a),d)})}async function Zc(n,e,t){n._canInitEmulator=!1;const s=Object.assign(Object.assign({},Ap),e);try{const i=new Np(n),r=await Promise.race([t(),i.promise]);i.clearNetworkTimeout();const o=await r.json();if("needConfirmation"in o)throw bi(n,"account-exists-with-different-credential",o);if(r.ok&&!("errorMessage"in o))return o;{const a=r.ok?o.errorMessage:o.error.message,[c,d]=a.split(" : ");if(c==="FEDERATED_USER_ID_ALREADY_LINKED")throw bi(n,"credential-already-in-use",o);if(c==="EMAIL_EXISTS")throw bi(n,"email-already-in-use",o);if(c==="USER_DISABLED")throw bi(n,"user-disabled",o);const h=s[c]||c.toLowerCase().replace(/[_\s]+/g,"-");if(d)throw Jc(n,h,d);ut(n,h)}}catch(i){if(i instanceof an)throw i;ut(n,"network-request-failed",{message:String(i)})}}async function ni(n,e,t,s,i={}){const r=await $t(n,e,t,s,i);return"mfaPendingCredential"in r&&ut(n,"multi-factor-auth-required",{_serverResponse:r}),r}function ed(n,e,t,s){const i=`${e}${t}?${s}`;return n.config.emulator?zo(n.config,i):`${n.config.apiScheme}://${i}`}function Pp(n){switch(n){case"ENFORCE":return"ENFORCE";case"AUDIT":return"AUDIT";case"OFF":return"OFF";default:return"ENFORCEMENT_STATE_UNSPECIFIED"}}class Np{constructor(e){this.auth=e,this.timer=null,this.promise=new Promise((t,s)=>{this.timer=setTimeout(()=>s(_t(this.auth,"network-request-failed")),Rp.get())})}clearNetworkTimeout(){clearTimeout(this.timer)}}function bi(n,e,t){const s={appName:n.name};t.email&&(s.email=t.email),t.phoneNumber&&(s.phoneNumber=t.phoneNumber);const i=_t(n,e,s);return i.customData._tokenResponse=t,i}function ml(n){return n!==void 0&&n.enterprise!==void 0}class Op{constructor(e){if(this.siteKey="",this.recaptchaEnforcementState=[],e.recaptchaKey===void 0)throw new Error("recaptchaKey undefined");this.siteKey=e.recaptchaKey.split("/")[3],this.recaptchaEnforcementState=e.recaptchaEnforcementState}getProviderEnforcementState(e){if(!this.recaptchaEnforcementState||this.recaptchaEnforcementState.length===0)return null;for(const t of this.recaptchaEnforcementState)if(t.provider&&t.provider===e)return Pp(t.enforcementState);return null}isProviderEnabled(e){return this.getProviderEnforcementState(e)==="ENFORCE"||this.getProviderEnforcementState(e)==="AUDIT"}}async function Mp(n,e){return $t(n,"GET","/v2/recaptchaConfig",ln(n,e))}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */async function Dp(n,e){return $t(n,"POST","/v1/accounts:delete",e)}async function td(n,e){return $t(n,"POST","/v1/accounts:lookup",e)}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function xs(n){if(n)try{const e=new Date(Number(n));if(!isNaN(e.getTime()))return e.toUTCString()}catch{}}async function Lp(n,e=!1){const t=xe(n),s=await t.getIdToken(e),i=Go(s);K(i&&i.exp&&i.auth_time&&i.iat,t.auth,"internal-error");const r=typeof i.firebase=="object"?i.firebase:void 0,o=r==null?void 0:r.sign_in_provider;return{claims:i,token:s,authTime:xs($r(i.auth_time)),issuedAtTime:xs($r(i.iat)),expirationTime:xs($r(i.exp)),signInProvider:o||null,signInSecondFactor:(r==null?void 0:r.sign_in_second_factor)||null}}function $r(n){return Number(n)*1e3}function Go(n){const[e,t,s]=n.split(".");if(e===void 0||t===void 0||s===void 0)return xi("JWT malformed, contained fewer than 3 sections"),null;try{const i=Mi(t);return i?JSON.parse(i):(xi("Failed to decode base64 JWT payload"),null)}catch(i){return xi("Caught error parsing JWT payload as JSON",i==null?void 0:i.toString()),null}}function gl(n){const e=Go(n);return K(e,"internal-error"),K(typeof e.exp<"u","internal-error"),K(typeof e.iat<"u","internal-error"),Number(e.exp)-Number(e.iat)}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */async function Jn(n,e,t=!1){if(t)return e;try{return await e}catch(s){throw s instanceof an&&Fp(s)&&n.auth.currentUser===n&&await n.auth.signOut(),s}}function Fp({code:n}){return n==="auth/user-disabled"||n==="auth/user-token-expired"}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class $p{constructor(e){this.user=e,this.isRunning=!1,this.timerId=null,this.errorBackoff=3e4}_start(){this.isRunning||(this.isRunning=!0,this.schedule())}_stop(){this.isRunning&&(this.isRunning=!1,this.timerId!==null&&clearTimeout(this.timerId))}getInterval(e){var t;if(e){const s=this.errorBackoff;return this.errorBackoff=Math.min(this.errorBackoff*2,96e4),s}else{this.errorBackoff=3e4;const i=((t=this.user.stsTokenManager.expirationTime)!==null&&t!==void 0?t:0)-Date.now()-3e5;return Math.max(0,i)}}schedule(e=!1){if(!this.isRunning)return;const t=this.getInterval(e);this.timerId=setTimeout(async()=>{await this.iteration()},t)}async iteration(){try{await this.user.getIdToken(!0)}catch(e){(e==null?void 0:e.code)==="auth/network-request-failed"&&this.schedule(!0);return}this.schedule()}}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class oo{constructor(e,t){this.createdAt=e,this.lastLoginAt=t,this._initializeTime()}_initializeTime(){this.lastSignInTime=xs(this.lastLoginAt),this.creationTime=xs(this.createdAt)}_copy(e){this.createdAt=e.createdAt,this.lastLoginAt=e.lastLoginAt,this._initializeTime()}toJSON(){return{createdAt:this.createdAt,lastLoginAt:this.lastLoginAt}}}/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */async function Wi(n){var e;const t=n.auth,s=await n.getIdToken(),i=await Jn(n,td(t,{idToken:s}));K(i==null?void 0:i.users.length,t,"internal-error");const r=i.users[0];n._notifyReloadListener(r);const o=!((e=r.providerUserInfo)===null||e===void 0)&&e.length?nd(r.providerUserInfo):[],a=Wp(n.providerData,o),c=n.isAnonymous,d=!(n.email&&r.passwordHash)&&!(a!=null&&a.length),h=c?d:!1,f={uid:r.localId,displayName:r.displayName||null,photoURL:r.photoUrl||null,email:r.email||null,emailVerified:r.emailVerified||!1,phoneNumber:r.phoneNumber||null,tenantId:r.tenantId||null,providerData:a,metadata:new oo(r.createdAt,r.lastLoginAt),isAnonymous:h};Object.assign(n,f)}async function Up(n){const e=xe(n);await Wi(e),await e.auth._persistUserIfCurrent(e),e.auth._notifyListenersIfCurrent(e)}function Wp(n,e){return[...n.filter(s=>!e.some(i=>i.providerId===s.providerId)),...e]}function nd(n){return n.map(e=>{var{providerId:t}=e,s=Vo(e,["providerId"]);return{providerId:t,uid:s.rawId||"",displayName:s.displayName||null,email:s.email||null,phoneNumber:s.phoneNumber||null,photoURL:s.photoUrl||null}})}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */async function Bp(n,e){const t=await Zc(n,{},async()=>{const s=as({grant_type:"refresh_token",refresh_token:e}).slice(1),{tokenApiHost:i,apiKey:r}=n.config,o=ed(n,i,"/v1/token",`key=${r}`),a=await n._getAdditionalHeaders();return a["Content-Type"]="application/x-www-form-urlencoded",Xc.fetch()(o,{method:"POST",headers:a,body:s})});return{accessToken:t.access_token,expiresIn:t.expires_in,refreshToken:t.refresh_token}}async function Hp(n,e){return $t(n,"POST","/v2/accounts:revokeToken",ln(n,e))}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Hn{constructor(){this.refreshToken=null,this.accessToken=null,this.expirationTime=null}get isExpired(){return!this.expirationTime||Date.now()>this.expirationTime-3e4}updateFromServerResponse(e){K(e.idToken,"internal-error"),K(typeof e.idToken<"u","internal-error"),K(typeof e.refreshToken<"u","internal-error");const t="expiresIn"in e&&typeof e.expiresIn<"u"?Number(e.expiresIn):gl(e.idToken);this.updateTokensAndExpiration(e.idToken,e.refreshToken,t)}updateFromIdToken(e){K(e.length!==0,"internal-error");const t=gl(e);this.updateTokensAndExpiration(e,null,t)}async getToken(e,t=!1){return!t&&this.accessToken&&!this.isExpired?this.accessToken:(K(this.refreshToken,e,"user-token-expired"),this.refreshToken?(await this.refresh(e,this.refreshToken),this.accessToken):null)}clearRefreshToken(){this.refreshToken=null}async refresh(e,t){const{accessToken:s,refreshToken:i,expiresIn:r}=await Bp(e,t);this.updateTokensAndExpiration(s,i,Number(r))}updateTokensAndExpiration(e,t,s){this.refreshToken=t||null,this.accessToken=e||null,this.expirationTime=Date.now()+s*1e3}static fromJSON(e,t){const{refreshToken:s,accessToken:i,expirationTime:r}=t,o=new Hn;return s&&(K(typeof s=="string","internal-error",{appName:e}),o.refreshToken=s),i&&(K(typeof i=="string","internal-error",{appName:e}),o.accessToken=i),r&&(K(typeof r=="number","internal-error",{appName:e}),o.expirationTime=r),o}toJSON(){return{refreshToken:this.refreshToken,accessToken:this.accessToken,expirationTime:this.expirationTime}}_assign(e){this.accessToken=e.accessToken,this.refreshToken=e.refreshToken,this.expirationTime=e.expirationTime}_clone(){return Object.assign(new Hn,this.toJSON())}_performRefresh(){return kt("not implemented")}}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function Wt(n,e){K(typeof n=="string"||typeof n>"u","internal-error",{appName:e})}class xt{constructor(e){var{uid:t,auth:s,stsTokenManager:i}=e,r=Vo(e,["uid","auth","stsTokenManager"]);this.providerId="firebase",this.proactiveRefresh=new $p(this),this.reloadUserInfo=null,this.reloadListener=null,this.uid=t,this.auth=s,this.stsTokenManager=i,this.accessToken=i.accessToken,this.displayName=r.displayName||null,this.email=r.email||null,this.emailVerified=r.emailVerified||!1,this.phoneNumber=r.phoneNumber||null,this.photoURL=r.photoURL||null,this.isAnonymous=r.isAnonymous||!1,this.tenantId=r.tenantId||null,this.providerData=r.providerData?[...r.providerData]:[],this.metadata=new oo(r.createdAt||void 0,r.lastLoginAt||void 0)}async getIdToken(e){const t=await Jn(this,this.stsTokenManager.getToken(this.auth,e));return K(t,this.auth,"internal-error"),this.accessToken!==t&&(this.accessToken=t,await this.auth._persistUserIfCurrent(this),this.auth._notifyListenersIfCurrent(this)),t}getIdTokenResult(e){return Lp(this,e)}reload(){return Up(this)}_assign(e){this!==e&&(K(this.uid===e.uid,this.auth,"internal-error"),this.displayName=e.displayName,this.photoURL=e.photoURL,this.email=e.email,this.emailVerified=e.emailVerified,this.phoneNumber=e.phoneNumber,this.isAnonymous=e.isAnonymous,this.tenantId=e.tenantId,this.providerData=e.providerData.map(t=>Object.assign({},t)),this.metadata._copy(e.metadata),this.stsTokenManager._assign(e.stsTokenManager))}_clone(e){const t=new xt(Object.assign(Object.assign({},this),{auth:e,stsTokenManager:this.stsTokenManager._clone()}));return t.metadata._copy(this.metadata),t}_onReload(e){K(!this.reloadListener,this.auth,"internal-error"),this.reloadListener=e,this.reloadUserInfo&&(this._notifyReloadListener(this.reloadUserInfo),this.reloadUserInfo=null)}_notifyReloadListener(e){this.reloadListener?this.reloadListener(e):this.reloadUserInfo=e}_startProactiveRefresh(){this.proactiveRefresh._start()}_stopProactiveRefresh(){this.proactiveRefresh._stop()}async _updateTokensIfNecessary(e,t=!1){let s=!1;e.idToken&&e.idToken!==this.stsTokenManager.accessToken&&(this.stsTokenManager.updateFromServerResponse(e),s=!0),t&&await Wi(this),await this.auth._persistUserIfCurrent(this),s&&this.auth._notifyListenersIfCurrent(this)}async delete(){if(gt(this.auth.app))return Promise.reject(Pt(this.auth));const e=await this.getIdToken();return await Jn(this,Dp(this.auth,{idToken:e})),this.stsTokenManager.clearRefreshToken(),this.auth.signOut()}toJSON(){return Object.assign(Object.assign({uid:this.uid,email:this.email||void 0,emailVerified:this.emailVerified,displayName:this.displayName||void 0,isAnonymous:this.isAnonymous,photoURL:this.photoURL||void 0,phoneNumber:this.phoneNumber||void 0,tenantId:this.tenantId||void 0,providerData:this.providerData.map(e=>Object.assign({},e)),stsTokenManager:this.stsTokenManager.toJSON(),_redirectEventId:this._redirectEventId},this.metadata.toJSON()),{apiKey:this.auth.config.apiKey,appName:this.auth.name})}get refreshToken(){return this.stsTokenManager.refreshToken||""}static _fromJSON(e,t){var s,i,r,o,a,c,d,h;const f=(s=t.displayName)!==null&&s!==void 0?s:void 0,_=(i=t.email)!==null&&i!==void 0?i:void 0,p=(r=t.phoneNumber)!==null&&r!==void 0?r:void 0,I=(o=t.photoURL)!==null&&o!==void 0?o:void 0,S=(a=t.tenantId)!==null&&a!==void 0?a:void 0,x=(c=t._redirectEventId)!==null&&c!==void 0?c:void 0,q=(d=t.createdAt)!==null&&d!==void 0?d:void 0,Q=(h=t.lastLoginAt)!==null&&h!==void 0?h:void 0,{uid:F,emailVerified:U,isAnonymous:D,providerData:M,stsTokenManager:C}=t;K(F&&C,e,"internal-error");const T=Hn.fromJSON(this.name,C);K(typeof F=="string",e,"internal-error"),Wt(f,e.name),Wt(_,e.name),K(typeof U=="boolean",e,"internal-error"),K(typeof D=="boolean",e,"internal-error"),Wt(p,e.name),Wt(I,e.name),Wt(S,e.name),Wt(x,e.name),Wt(q,e.name),Wt(Q,e.name);const P=new xt({uid:F,auth:e,email:_,emailVerified:U,displayName:f,isAnonymous:D,photoURL:I,phoneNumber:p,tenantId:S,stsTokenManager:T,createdAt:q,lastLoginAt:Q});return M&&Array.isArray(M)&&(P.providerData=M.map(k=>Object.assign({},k))),x&&(P._redirectEventId=x),P}static async _fromIdTokenResponse(e,t,s=!1){const i=new Hn;i.updateFromServerResponse(t);const r=new xt({uid:t.localId,auth:e,stsTokenManager:i,isAnonymous:s});return await Wi(r),r}static async _fromGetAccountInfoResponse(e,t,s){const i=t.users[0];K(i.localId!==void 0,"internal-error");const r=i.providerUserInfo!==void 0?nd(i.providerUserInfo):[],o=!(i.email&&i.passwordHash)&&!(r!=null&&r.length),a=new Hn;a.updateFromIdToken(s);const c=new xt({uid:i.localId,auth:e,stsTokenManager:a,isAnonymous:o}),d={uid:i.localId,displayName:i.displayName||null,photoURL:i.photoUrl||null,email:i.email||null,emailVerified:i.emailVerified||!1,phoneNumber:i.phoneNumber||null,tenantId:i.tenantId||null,providerData:r,metadata:new oo(i.createdAt,i.lastLoginAt),isAnonymous:!(i.email&&i.passwordHash)&&!(r!=null&&r.length)};return Object.assign(c,d),c}}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const _l=new Map;function At(n){Dt(n instanceof Function,"Expected a class definition");let e=_l.get(n);return e?(Dt(e instanceof n,"Instance stored in cache mismatched with class"),e):(e=new n,_l.set(n,e),e)}/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class sd{constructor(){this.type="NONE",this.storage={}}async _isAvailable(){return!0}async _set(e,t){this.storage[e]=t}async _get(e){const t=this.storage[e];return t===void 0?null:t}async _remove(e){delete this.storage[e]}_addListener(e,t){}_removeListener(e,t){}}sd.type="NONE";const yl=sd;/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function Ai(n,e,t){return`firebase:${n}:${e}:${t}`}class jn{constructor(e,t,s){this.persistence=e,this.auth=t,this.userKey=s;const{config:i,name:r}=this.auth;this.fullUserKey=Ai(this.userKey,i.apiKey,r),this.fullPersistenceKey=Ai("persistence",i.apiKey,r),this.boundEventHandler=t._onStorageEvent.bind(t),this.persistence._addListener(this.fullUserKey,this.boundEventHandler)}setCurrentUser(e){return this.persistence._set(this.fullUserKey,e.toJSON())}async getCurrentUser(){const e=await this.persistence._get(this.fullUserKey);return e?xt._fromJSON(this.auth,e):null}removeCurrentUser(){return this.persistence._remove(this.fullUserKey)}savePersistenceForRedirect(){return this.persistence._set(this.fullPersistenceKey,this.persistence.type)}async setPersistence(e){if(this.persistence===e)return;const t=await this.getCurrentUser();if(await this.removeCurrentUser(),this.persistence=e,t)return this.setCurrentUser(t)}delete(){this.persistence._removeListener(this.fullUserKey,this.boundEventHandler)}static async create(e,t,s="authUser"){if(!t.length)return new jn(At(yl),e,s);const i=(await Promise.all(t.map(async d=>{if(await d._isAvailable())return d}))).filter(d=>d);let r=i[0]||At(yl);const o=Ai(s,e.config.apiKey,e.name);let a=null;for(const d of t)try{const h=await d._get(o);if(h){const f=xt._fromJSON(e,h);d!==r&&(a=f),r=d;break}}catch{}const c=i.filter(d=>d._shouldAllowMigration);return!r._shouldAllowMigration||!c.length?new jn(r,e,s):(r=c[0],a&&await r._set(o,a.toJSON()),await Promise.all(t.map(async d=>{if(d!==r)try{await d._remove(o)}catch{}})),new jn(r,e,s))}}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function vl(n){const e=n.toLowerCase();if(e.includes("opera/")||e.includes("opr/")||e.includes("opios/"))return"Opera";if(ad(e))return"IEMobile";if(e.includes("msie")||e.includes("trident/"))return"IE";if(e.includes("edge/"))return"Edge";if(id(e))return"Firefox";if(e.includes("silk/"))return"Silk";if(cd(e))return"Blackberry";if(dd(e))return"Webos";if(rd(e))return"Safari";if((e.includes("chrome/")||od(e))&&!e.includes("edge/"))return"Chrome";if(ld(e))return"Android";{const t=/([a-zA-Z\d\.]+)\/[a-zA-Z\d\.]*$/,s=n.match(t);if((s==null?void 0:s.length)===2)return s[1]}return"Other"}function id(n=Ve()){return/firefox\//i.test(n)}function rd(n=Ve()){const e=n.toLowerCase();return e.includes("safari/")&&!e.includes("chrome/")&&!e.includes("crios/")&&!e.includes("android")}function od(n=Ve()){return/crios\//i.test(n)}function ad(n=Ve()){return/iemobile/i.test(n)}function ld(n=Ve()){return/android/i.test(n)}function cd(n=Ve()){return/blackberry/i.test(n)}function dd(n=Ve()){return/webos/i.test(n)}function Yo(n=Ve()){return/iphone|ipad|ipod/i.test(n)||/macintosh/i.test(n)&&/mobile/i.test(n)}function jp(n=Ve()){var e;return Yo(n)&&!!(!((e=window.navigator)===null||e===void 0)&&e.standalone)}function Vp(){return nf()&&document.documentMode===10}function ud(n=Ve()){return Yo(n)||ld(n)||dd(n)||cd(n)||/windows phone/i.test(n)||ad(n)}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function hd(n,e=[]){let t;switch(n){case"Browser":t=vl(Ve());break;case"Worker":t=`${vl(Ve())}-${n}`;break;default:t=n}const s=e.length?e.join(","):"FirebaseCore-web";return`${t}/JsCore/${ls}/${s}`}/**
 * @license
 * Copyright 2022 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class qp{constructor(e){this.auth=e,this.queue=[]}pushCallback(e,t){const s=r=>new Promise((o,a)=>{try{const c=e(r);o(c)}catch(c){a(c)}});s.onAbort=t,this.queue.push(s);const i=this.queue.length-1;return()=>{this.queue[i]=()=>Promise.resolve()}}async runMiddleware(e){if(this.auth.currentUser===e)return;const t=[];try{for(const s of this.queue)await s(e),s.onAbort&&t.push(s.onAbort)}catch(s){t.reverse();for(const i of t)try{i()}catch{}throw this.auth._errorFactory.create("login-blocked",{originalMessage:s==null?void 0:s.message})}}}/**
 * @license
 * Copyright 2023 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */async function zp(n,e={}){return $t(n,"GET","/v2/passwordPolicy",ln(n,e))}/**
 * @license
 * Copyright 2023 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const Gp=6;class Yp{constructor(e){var t,s,i,r;const o=e.customStrengthOptions;this.customStrengthOptions={},this.customStrengthOptions.minPasswordLength=(t=o.minPasswordLength)!==null&&t!==void 0?t:Gp,o.maxPasswordLength&&(this.customStrengthOptions.maxPasswordLength=o.maxPasswordLength),o.containsLowercaseCharacter!==void 0&&(this.customStrengthOptions.containsLowercaseLetter=o.containsLowercaseCharacter),o.containsUppercaseCharacter!==void 0&&(this.customStrengthOptions.containsUppercaseLetter=o.containsUppercaseCharacter),o.containsNumericCharacter!==void 0&&(this.customStrengthOptions.containsNumericCharacter=o.containsNumericCharacter),o.containsNonAlphanumericCharacter!==void 0&&(this.customStrengthOptions.containsNonAlphanumericCharacter=o.containsNonAlphanumericCharacter),this.enforcementState=e.enforcementState,this.enforcementState==="ENFORCEMENT_STATE_UNSPECIFIED"&&(this.enforcementState="OFF"),this.allowedNonAlphanumericCharacters=(i=(s=e.allowedNonAlphanumericCharacters)===null||s===void 0?void 0:s.join(""))!==null&&i!==void 0?i:"",this.forceUpgradeOnSignin=(r=e.forceUpgradeOnSignin)!==null&&r!==void 0?r:!1,this.schemaVersion=e.schemaVersion}validatePassword(e){var t,s,i,r,o,a;const c={isValid:!0,passwordPolicy:this};return this.validatePasswordLengthOptions(e,c),this.validatePasswordCharacterOptions(e,c),c.isValid&&(c.isValid=(t=c.meetsMinPasswordLength)!==null&&t!==void 0?t:!0),c.isValid&&(c.isValid=(s=c.meetsMaxPasswordLength)!==null&&s!==void 0?s:!0),c.isValid&&(c.isValid=(i=c.containsLowercaseLetter)!==null&&i!==void 0?i:!0),c.isValid&&(c.isValid=(r=c.containsUppercaseLetter)!==null&&r!==void 0?r:!0),c.isValid&&(c.isValid=(o=c.containsNumericCharacter)!==null&&o!==void 0?o:!0),c.isValid&&(c.isValid=(a=c.containsNonAlphanumericCharacter)!==null&&a!==void 0?a:!0),c}validatePasswordLengthOptions(e,t){const s=this.customStrengthOptions.minPasswordLength,i=this.customStrengthOptions.maxPasswordLength;s&&(t.meetsMinPasswordLength=e.length>=s),i&&(t.meetsMaxPasswordLength=e.length<=i)}validatePasswordCharacterOptions(e,t){this.updatePasswordCharacterOptionsStatuses(t,!1,!1,!1,!1);let s;for(let i=0;i<e.length;i++)s=e.charAt(i),this.updatePasswordCharacterOptionsStatuses(t,s>="a"&&s<="z",s>="A"&&s<="Z",s>="0"&&s<="9",this.allowedNonAlphanumericCharacters.includes(s))}updatePasswordCharacterOptionsStatuses(e,t,s,i,r){this.customStrengthOptions.containsLowercaseLetter&&(e.containsLowercaseLetter||(e.containsLowercaseLetter=t)),this.customStrengthOptions.containsUppercaseLetter&&(e.containsUppercaseLetter||(e.containsUppercaseLetter=s)),this.customStrengthOptions.containsNumericCharacter&&(e.containsNumericCharacter||(e.containsNumericCharacter=i)),this.customStrengthOptions.containsNonAlphanumericCharacter&&(e.containsNonAlphanumericCharacter||(e.containsNonAlphanumericCharacter=r))}}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Kp{constructor(e,t,s,i){this.app=e,this.heartbeatServiceProvider=t,this.appCheckServiceProvider=s,this.config=i,this.currentUser=null,this.emulatorConfig=null,this.operations=Promise.resolve(),this.authStateSubscription=new bl(this),this.idTokenSubscription=new bl(this),this.beforeStateQueue=new qp(this),this.redirectUser=null,this.isProactiveRefreshEnabled=!1,this.EXPECTED_PASSWORD_POLICY_SCHEMA_VERSION=1,this._canInitEmulator=!0,this._isInitialized=!1,this._deleted=!1,this._initializationPromise=null,this._popupRedirectResolver=null,this._errorFactory=Qc,this._agentRecaptchaConfig=null,this._tenantRecaptchaConfigs={},this._projectPasswordPolicy=null,this._tenantPasswordPolicies={},this.lastNotifiedUid=void 0,this.languageCode=null,this.tenantId=null,this.settings={appVerificationDisabledForTesting:!1},this.frameworks=[],this.name=e.name,this.clientVersion=i.sdkClientVersion}_initializeWithPersistence(e,t){return t&&(this._popupRedirectResolver=At(t)),this._initializationPromise=this.queue(async()=>{var s,i;if(!this._deleted&&(this.persistenceManager=await jn.create(this,e),!this._deleted)){if(!((s=this._popupRedirectResolver)===null||s===void 0)&&s._shouldInitProactively)try{await this._popupRedirectResolver._initialize(this)}catch{}await this.initializeCurrentUser(t),this.lastNotifiedUid=((i=this.currentUser)===null||i===void 0?void 0:i.uid)||null,!this._deleted&&(this._isInitialized=!0)}}),this._initializationPromise}async _onStorageEvent(){if(this._deleted)return;const e=await this.assertedPersistence.getCurrentUser();if(!(!this.currentUser&&!e)){if(this.currentUser&&e&&this.currentUser.uid===e.uid){this._currentUser._assign(e),await this.currentUser.getIdToken();return}await this._updateCurrentUser(e,!0)}}async initializeCurrentUserFromIdToken(e){try{const t=await td(this,{idToken:e}),s=await xt._fromGetAccountInfoResponse(this,t,e);await this.directlySetCurrentUser(s)}catch(t){console.warn("FirebaseServerApp could not login user with provided authIdToken: ",t),await this.directlySetCurrentUser(null)}}async initializeCurrentUser(e){var t;if(gt(this.app)){const o=this.app.settings.authIdToken;return o?new Promise(a=>{setTimeout(()=>this.initializeCurrentUserFromIdToken(o).then(a,a))}):this.directlySetCurrentUser(null)}const s=await this.assertedPersistence.getCurrentUser();let i=s,r=!1;if(e&&this.config.authDomain){await this.getOrInitRedirectPersistenceManager();const o=(t=this.redirectUser)===null||t===void 0?void 0:t._redirectEventId,a=i==null?void 0:i._redirectEventId,c=await this.tryRedirectSignIn(e);(!o||o===a)&&(c!=null&&c.user)&&(i=c.user,r=!0)}if(!i)return this.directlySetCurrentUser(null);if(!i._redirectEventId){if(r)try{await this.beforeStateQueue.runMiddleware(i)}catch(o){i=s,this._popupRedirectResolver._overrideRedirectResult(this,()=>Promise.reject(o))}return i?this.reloadAndSetCurrentUserOrClear(i):this.directlySetCurrentUser(null)}return K(this._popupRedirectResolver,this,"argument-error"),await this.getOrInitRedirectPersistenceManager(),this.redirectUser&&this.redirectUser._redirectEventId===i._redirectEventId?this.directlySetCurrentUser(i):this.reloadAndSetCurrentUserOrClear(i)}async tryRedirectSignIn(e){let t=null;try{t=await this._popupRedirectResolver._completeRedirectFn(this,e,!0)}catch{await this._setRedirectUser(null)}return t}async reloadAndSetCurrentUserOrClear(e){try{await Wi(e)}catch(t){if((t==null?void 0:t.code)!=="auth/network-request-failed")return this.directlySetCurrentUser(null)}return this.directlySetCurrentUser(e)}useDeviceLanguage(){this.languageCode=xp()}async _delete(){this._deleted=!0}async updateCurrentUser(e){if(gt(this.app))return Promise.reject(Pt(this));const t=e?xe(e):null;return t&&K(t.auth.config.apiKey===this.config.apiKey,this,"invalid-user-token"),this._updateCurrentUser(t&&t._clone(this))}async _updateCurrentUser(e,t=!1){if(!this._deleted)return e&&K(this.tenantId===e.tenantId,this,"tenant-id-mismatch"),t||await this.beforeStateQueue.runMiddleware(e),this.queue(async()=>{await this.directlySetCurrentUser(e),this.notifyAuthListeners()})}async signOut(){return gt(this.app)?Promise.reject(Pt(this)):(await this.beforeStateQueue.runMiddleware(null),(this.redirectPersistenceManager||this._popupRedirectResolver)&&await this._setRedirectUser(null),this._updateCurrentUser(null,!0))}setPersistence(e){return gt(this.app)?Promise.reject(Pt(this)):this.queue(async()=>{await this.assertedPersistence.setPersistence(At(e))})}_getRecaptchaConfig(){return this.tenantId==null?this._agentRecaptchaConfig:this._tenantRecaptchaConfigs[this.tenantId]}async validatePassword(e){this._getPasswordPolicyInternal()||await this._updatePasswordPolicy();const t=this._getPasswordPolicyInternal();return t.schemaVersion!==this.EXPECTED_PASSWORD_POLICY_SCHEMA_VERSION?Promise.reject(this._errorFactory.create("unsupported-password-policy-schema-version",{})):t.validatePassword(e)}_getPasswordPolicyInternal(){return this.tenantId===null?this._projectPasswordPolicy:this._tenantPasswordPolicies[this.tenantId]}async _updatePasswordPolicy(){const e=await zp(this),t=new Yp(e);this.tenantId===null?this._projectPasswordPolicy=t:this._tenantPasswordPolicies[this.tenantId]=t}_getPersistence(){return this.assertedPersistence.persistence.type}_updateErrorMap(e){this._errorFactory=new ei("auth","Firebase",e())}onAuthStateChanged(e,t,s){return this.registerStateListener(this.authStateSubscription,e,t,s)}beforeAuthStateChanged(e,t){return this.beforeStateQueue.pushCallback(e,t)}onIdTokenChanged(e,t,s){return this.registerStateListener(this.idTokenSubscription,e,t,s)}authStateReady(){return new Promise((e,t)=>{if(this.currentUser)e();else{const s=this.onAuthStateChanged(()=>{s(),e()},t)}})}async revokeAccessToken(e){if(this.currentUser){const t=await this.currentUser.getIdToken(),s={providerId:"apple.com",tokenType:"ACCESS_TOKEN",token:e,idToken:t};this.tenantId!=null&&(s.tenantId=this.tenantId),await Hp(this,s)}}toJSON(){var e;return{apiKey:this.config.apiKey,authDomain:this.config.authDomain,appName:this.name,currentUser:(e=this._currentUser)===null||e===void 0?void 0:e.toJSON()}}async _setRedirectUser(e,t){const s=await this.getOrInitRedirectPersistenceManager(t);return e===null?s.removeCurrentUser():s.setCurrentUser(e)}async getOrInitRedirectPersistenceManager(e){if(!this.redirectPersistenceManager){const t=e&&At(e)||this._popupRedirectResolver;K(t,this,"argument-error"),this.redirectPersistenceManager=await jn.create(this,[At(t._redirectPersistence)],"redirectUser"),this.redirectUser=await this.redirectPersistenceManager.getCurrentUser()}return this.redirectPersistenceManager}async _redirectUserForId(e){var t,s;return this._isInitialized&&await this.queue(async()=>{}),((t=this._currentUser)===null||t===void 0?void 0:t._redirectEventId)===e?this._currentUser:((s=this.redirectUser)===null||s===void 0?void 0:s._redirectEventId)===e?this.redirectUser:null}async _persistUserIfCurrent(e){if(e===this.currentUser)return this.queue(async()=>this.directlySetCurrentUser(e))}_notifyListenersIfCurrent(e){e===this.currentUser&&this.notifyAuthListeners()}_key(){return`${this.config.authDomain}:${this.config.apiKey}:${this.name}`}_startProactiveRefresh(){this.isProactiveRefreshEnabled=!0,this.currentUser&&this._currentUser._startProactiveRefresh()}_stopProactiveRefresh(){this.isProactiveRefreshEnabled=!1,this.currentUser&&this._currentUser._stopProactiveRefresh()}get _currentUser(){return this.currentUser}notifyAuthListeners(){var e,t;if(!this._isInitialized)return;this.idTokenSubscription.next(this.currentUser);const s=(t=(e=this.currentUser)===null||e===void 0?void 0:e.uid)!==null&&t!==void 0?t:null;this.lastNotifiedUid!==s&&(this.lastNotifiedUid=s,this.authStateSubscription.next(this.currentUser))}registerStateListener(e,t,s,i){if(this._deleted)return()=>{};const r=typeof t=="function"?t:t.next.bind(t);let o=!1;const a=this._isInitialized?Promise.resolve():this._initializationPromise;if(K(a,this,"internal-error"),a.then(()=>{o||r(this.currentUser)}),typeof t=="function"){const c=e.addObserver(t,s,i);return()=>{o=!0,c()}}else{const c=e.addObserver(t);return()=>{o=!0,c()}}}async directlySetCurrentUser(e){this.currentUser&&this.currentUser!==e&&this._currentUser._stopProactiveRefresh(),e&&this.isProactiveRefreshEnabled&&e._startProactiveRefresh(),this.currentUser=e,e?await this.assertedPersistence.setCurrentUser(e):await this.assertedPersistence.removeCurrentUser()}queue(e){return this.operations=this.operations.then(e,e),this.operations}get assertedPersistence(){return K(this.persistenceManager,this,"internal-error"),this.persistenceManager}_logFramework(e){!e||this.frameworks.includes(e)||(this.frameworks.push(e),this.frameworks.sort(),this.clientVersion=hd(this.config.clientPlatform,this._getFrameworks()))}_getFrameworks(){return this.frameworks}async _getAdditionalHeaders(){var e;const t={"X-Client-Version":this.clientVersion};this.app.options.appId&&(t["X-Firebase-gmpid"]=this.app.options.appId);const s=await((e=this.heartbeatServiceProvider.getImmediate({optional:!0}))===null||e===void 0?void 0:e.getHeartbeatsHeader());s&&(t["X-Firebase-Client"]=s);const i=await this._getAppCheckToken();return i&&(t["X-Firebase-AppCheck"]=i),t}async _getAppCheckToken(){var e;const t=await((e=this.appCheckServiceProvider.getImmediate({optional:!0}))===null||e===void 0?void 0:e.getToken());return t!=null&&t.error&&Sp(`Error while retrieving App Check token: ${t.error}`),t==null?void 0:t.token}}function xn(n){return xe(n)}class bl{constructor(e){this.auth=e,this.observer=null,this.addObserver=ff(t=>this.observer=t)}get next(){return K(this.observer,this.auth,"internal-error"),this.observer.next.bind(this.observer)}}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */let lr={async loadJS(){throw new Error("Unable to load external scripts")},recaptchaV2Script:"",recaptchaEnterpriseScript:"",gapiScript:""};function Qp(n){lr=n}function fd(n){return lr.loadJS(n)}function Jp(){return lr.recaptchaEnterpriseScript}function Xp(){return lr.gapiScript}function Zp(n){return`__${n}${Math.floor(Math.random()*1e6)}`}const em="recaptcha-enterprise",tm="NO_RECAPTCHA";class nm{constructor(e){this.type=em,this.auth=xn(e)}async verify(e="verify",t=!1){async function s(r){if(!t){if(r.tenantId==null&&r._agentRecaptchaConfig!=null)return r._agentRecaptchaConfig.siteKey;if(r.tenantId!=null&&r._tenantRecaptchaConfigs[r.tenantId]!==void 0)return r._tenantRecaptchaConfigs[r.tenantId].siteKey}return new Promise(async(o,a)=>{Mp(r,{clientType:"CLIENT_TYPE_WEB",version:"RECAPTCHA_ENTERPRISE"}).then(c=>{if(c.recaptchaKey===void 0)a(new Error("recaptcha Enterprise site key undefined"));else{const d=new Op(c);return r.tenantId==null?r._agentRecaptchaConfig=d:r._tenantRecaptchaConfigs[r.tenantId]=d,o(d.siteKey)}}).catch(c=>{a(c)})})}function i(r,o,a){const c=window.grecaptcha;ml(c)?c.enterprise.ready(()=>{c.enterprise.execute(r,{action:e}).then(d=>{o(d)}).catch(()=>{o(tm)})}):a(Error("No reCAPTCHA enterprise script loaded."))}return new Promise((r,o)=>{s(this.auth).then(a=>{if(!t&&ml(window.grecaptcha))i(a,r,o);else{if(typeof window>"u"){o(new Error("RecaptchaVerifier is only supported in browser"));return}let c=Jp();c.length!==0&&(c+=a),fd(c).then(()=>{i(a,r,o)}).catch(d=>{o(d)})}}).catch(a=>{o(a)})})}}async function wl(n,e,t,s=!1){const i=new nm(n);let r;try{r=await i.verify(t)}catch{r=await i.verify(t,!0)}const o=Object.assign({},e);return s?Object.assign(o,{captchaResp:r}):Object.assign(o,{captchaResponse:r}),Object.assign(o,{clientType:"CLIENT_TYPE_WEB"}),Object.assign(o,{recaptchaVersion:"RECAPTCHA_ENTERPRISE"}),o}async function ao(n,e,t,s){var i;if(!((i=n._getRecaptchaConfig())===null||i===void 0)&&i.isProviderEnabled("EMAIL_PASSWORD_PROVIDER")){const r=await wl(n,e,t,t==="getOobCode");return s(n,r)}else return s(n,e).catch(async r=>{if(r.code==="auth/missing-recaptcha-token"){console.log(`${t} is protected by reCAPTCHA Enterprise for this project. Automatically triggering the reCAPTCHA flow and restarting the flow.`);const o=await wl(n,e,t,t==="getOobCode");return s(n,o)}else return Promise.reject(r)})}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function sm(n,e){const t=jo(n,"auth");if(t.isInitialized()){const i=t.getImmediate(),r=t.getOptions();if(Fi(r,e??{}))return i;ut(i,"already-initialized")}return t.initialize({options:e})}function im(n,e){const t=(e==null?void 0:e.persistence)||[],s=(Array.isArray(t)?t:[t]).map(At);e!=null&&e.errorMap&&n._updateErrorMap(e.errorMap),n._initializeWithPersistence(s,e==null?void 0:e.popupRedirectResolver)}function rm(n,e,t){const s=xn(n);K(s._canInitEmulator,s,"emulator-config-failed"),K(/^https?:\/\//.test(e),s,"invalid-emulator-scheme");const i=!1,r=pd(e),{host:o,port:a}=om(e),c=a===null?"":`:${a}`;s.config.emulator={url:`${r}//${o}${c}/`},s.settings.appVerificationDisabledForTesting=!0,s.emulatorConfig=Object.freeze({host:o,port:a,protocol:r.replace(":",""),options:Object.freeze({disableWarnings:i})}),am()}function pd(n){const e=n.indexOf(":");return e<0?"":n.substr(0,e+1)}function om(n){const e=pd(n),t=/(\/\/)?([^?#/]+)/.exec(n.substr(e.length));if(!t)return{host:"",port:null};const s=t[2].split("@").pop()||"",i=/^(\[[^\]]+\])(:|$)/.exec(s);if(i){const r=i[1];return{host:r,port:El(s.substr(r.length+1))}}else{const[r,o]=s.split(":");return{host:r,port:El(o)}}}function El(n){if(!n)return null;const e=Number(n);return isNaN(e)?null:e}function am(){function n(){const e=document.createElement("p"),t=e.style;e.innerText="Running in emulator mode. Do not use with production credentials.",t.position="fixed",t.width="100%",t.backgroundColor="#ffffff",t.border=".1em solid #000000",t.color="#b50000",t.bottom="0px",t.left="0px",t.margin="0px",t.zIndex="10000",t.textAlign="center",e.classList.add("firebase-emulator-warning"),document.body.appendChild(e)}typeof console<"u"&&typeof console.info=="function"&&console.info("WARNING: You are using the Auth Emulator, which is intended for local testing only.  Do not use with production credentials."),typeof window<"u"&&typeof document<"u"&&(document.readyState==="loading"?window.addEventListener("DOMContentLoaded",n):n())}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Ko{constructor(e,t){this.providerId=e,this.signInMethod=t}toJSON(){return kt("not implemented")}_getIdTokenResponse(e){return kt("not implemented")}_linkToIdToken(e,t){return kt("not implemented")}_getReauthenticationResolver(e){return kt("not implemented")}}async function lm(n,e){return $t(n,"POST","/v1/accounts:update",e)}async function cm(n,e){return $t(n,"POST","/v1/accounts:signUp",e)}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */async function dm(n,e){return ni(n,"POST","/v1/accounts:signInWithPassword",ln(n,e))}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */async function um(n,e){return ni(n,"POST","/v1/accounts:signInWithEmailLink",ln(n,e))}async function hm(n,e){return ni(n,"POST","/v1/accounts:signInWithEmailLink",ln(n,e))}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Ws extends Ko{constructor(e,t,s,i=null){super("password",s),this._email=e,this._password=t,this._tenantId=i}static _fromEmailAndPassword(e,t){return new Ws(e,t,"password")}static _fromEmailAndCode(e,t,s=null){return new Ws(e,t,"emailLink",s)}toJSON(){return{email:this._email,password:this._password,signInMethod:this.signInMethod,tenantId:this._tenantId}}static fromJSON(e){const t=typeof e=="string"?JSON.parse(e):e;if(t!=null&&t.email&&(t!=null&&t.password)){if(t.signInMethod==="password")return this._fromEmailAndPassword(t.email,t.password);if(t.signInMethod==="emailLink")return this._fromEmailAndCode(t.email,t.password,t.tenantId)}return null}async _getIdTokenResponse(e){switch(this.signInMethod){case"password":const t={returnSecureToken:!0,email:this._email,password:this._password,clientType:"CLIENT_TYPE_WEB"};return ao(e,t,"signInWithPassword",dm);case"emailLink":return um(e,{email:this._email,oobCode:this._password});default:ut(e,"internal-error")}}async _linkToIdToken(e,t){switch(this.signInMethod){case"password":const s={idToken:t,returnSecureToken:!0,email:this._email,password:this._password,clientType:"CLIENT_TYPE_WEB"};return ao(e,s,"signUpPassword",cm);case"emailLink":return hm(e,{idToken:t,email:this._email,oobCode:this._password});default:ut(e,"internal-error")}}_getReauthenticationResolver(e){return this._getIdTokenResponse(e)}}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */async function Vn(n,e){return ni(n,"POST","/v1/accounts:signInWithIdp",ln(n,e))}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const fm="http://localhost";class bn extends Ko{constructor(){super(...arguments),this.pendingToken=null}static _fromParams(e){const t=new bn(e.providerId,e.signInMethod);return e.idToken||e.accessToken?(e.idToken&&(t.idToken=e.idToken),e.accessToken&&(t.accessToken=e.accessToken),e.nonce&&!e.pendingToken&&(t.nonce=e.nonce),e.pendingToken&&(t.pendingToken=e.pendingToken)):e.oauthToken&&e.oauthTokenSecret?(t.accessToken=e.oauthToken,t.secret=e.oauthTokenSecret):ut("argument-error"),t}toJSON(){return{idToken:this.idToken,accessToken:this.accessToken,secret:this.secret,nonce:this.nonce,pendingToken:this.pendingToken,providerId:this.providerId,signInMethod:this.signInMethod}}static fromJSON(e){const t=typeof e=="string"?JSON.parse(e):e,{providerId:s,signInMethod:i}=t,r=Vo(t,["providerId","signInMethod"]);if(!s||!i)return null;const o=new bn(s,i);return o.idToken=r.idToken||void 0,o.accessToken=r.accessToken||void 0,o.secret=r.secret,o.nonce=r.nonce,o.pendingToken=r.pendingToken||null,o}_getIdTokenResponse(e){const t=this.buildRequest();return Vn(e,t)}_linkToIdToken(e,t){const s=this.buildRequest();return s.idToken=t,Vn(e,s)}_getReauthenticationResolver(e){const t=this.buildRequest();return t.autoCreate=!1,Vn(e,t)}buildRequest(){const e={requestUri:fm,returnSecureToken:!0};if(this.pendingToken)e.pendingToken=this.pendingToken;else{const t={};this.idToken&&(t.id_token=this.idToken),this.accessToken&&(t.access_token=this.accessToken),this.secret&&(t.oauth_token_secret=this.secret),t.providerId=this.providerId,this.nonce&&!this.pendingToken&&(t.nonce=this.nonce),e.postBody=as(t)}return e}}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function pm(n){switch(n){case"recoverEmail":return"RECOVER_EMAIL";case"resetPassword":return"PASSWORD_RESET";case"signIn":return"EMAIL_SIGNIN";case"verifyEmail":return"VERIFY_EMAIL";case"verifyAndChangeEmail":return"VERIFY_AND_CHANGE_EMAIL";case"revertSecondFactorAddition":return"REVERT_SECOND_FACTOR_ADDITION";default:return null}}function mm(n){const e=Es(Cs(n)).link,t=e?Es(Cs(e)).deep_link_id:null,s=Es(Cs(n)).deep_link_id;return(s?Es(Cs(s)).link:null)||s||t||e||n}class Qo{constructor(e){var t,s,i,r,o,a;const c=Es(Cs(e)),d=(t=c.apiKey)!==null&&t!==void 0?t:null,h=(s=c.oobCode)!==null&&s!==void 0?s:null,f=pm((i=c.mode)!==null&&i!==void 0?i:null);K(d&&h&&f,"argument-error"),this.apiKey=d,this.operation=f,this.code=h,this.continueUrl=(r=c.continueUrl)!==null&&r!==void 0?r:null,this.languageCode=(o=c.languageCode)!==null&&o!==void 0?o:null,this.tenantId=(a=c.tenantId)!==null&&a!==void 0?a:null}static parseLink(e){const t=mm(e);try{return new Qo(t)}catch{return null}}}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class An{constructor(){this.providerId=An.PROVIDER_ID}static credential(e,t){return Ws._fromEmailAndPassword(e,t)}static credentialWithLink(e,t){const s=Qo.parseLink(t);return K(s,"argument-error"),Ws._fromEmailAndCode(e,s.code,s.tenantId)}}An.PROVIDER_ID="password";An.EMAIL_PASSWORD_SIGN_IN_METHOD="password";An.EMAIL_LINK_SIGN_IN_METHOD="emailLink";/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class md{constructor(e){this.providerId=e,this.defaultLanguageCode=null,this.customParameters={}}setDefaultLanguage(e){this.defaultLanguageCode=e}setCustomParameters(e){return this.customParameters=e,this}getCustomParameters(){return this.customParameters}}/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class si extends md{constructor(){super(...arguments),this.scopes=[]}addScope(e){return this.scopes.includes(e)||this.scopes.push(e),this}getScopes(){return[...this.scopes]}}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Ht extends si{constructor(){super("facebook.com")}static credential(e){return bn._fromParams({providerId:Ht.PROVIDER_ID,signInMethod:Ht.FACEBOOK_SIGN_IN_METHOD,accessToken:e})}static credentialFromResult(e){return Ht.credentialFromTaggedObject(e)}static credentialFromError(e){return Ht.credentialFromTaggedObject(e.customData||{})}static credentialFromTaggedObject({_tokenResponse:e}){if(!e||!("oauthAccessToken"in e)||!e.oauthAccessToken)return null;try{return Ht.credential(e.oauthAccessToken)}catch{return null}}}Ht.FACEBOOK_SIGN_IN_METHOD="facebook.com";Ht.PROVIDER_ID="facebook.com";/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class jt extends si{constructor(){super("google.com"),this.addScope("profile")}static credential(e,t){return bn._fromParams({providerId:jt.PROVIDER_ID,signInMethod:jt.GOOGLE_SIGN_IN_METHOD,idToken:e,accessToken:t})}static credentialFromResult(e){return jt.credentialFromTaggedObject(e)}static credentialFromError(e){return jt.credentialFromTaggedObject(e.customData||{})}static credentialFromTaggedObject({_tokenResponse:e}){if(!e)return null;const{oauthIdToken:t,oauthAccessToken:s}=e;if(!t&&!s)return null;try{return jt.credential(t,s)}catch{return null}}}jt.GOOGLE_SIGN_IN_METHOD="google.com";jt.PROVIDER_ID="google.com";/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Vt extends si{constructor(){super("github.com")}static credential(e){return bn._fromParams({providerId:Vt.PROVIDER_ID,signInMethod:Vt.GITHUB_SIGN_IN_METHOD,accessToken:e})}static credentialFromResult(e){return Vt.credentialFromTaggedObject(e)}static credentialFromError(e){return Vt.credentialFromTaggedObject(e.customData||{})}static credentialFromTaggedObject({_tokenResponse:e}){if(!e||!("oauthAccessToken"in e)||!e.oauthAccessToken)return null;try{return Vt.credential(e.oauthAccessToken)}catch{return null}}}Vt.GITHUB_SIGN_IN_METHOD="github.com";Vt.PROVIDER_ID="github.com";/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class qt extends si{constructor(){super("twitter.com")}static credential(e,t){return bn._fromParams({providerId:qt.PROVIDER_ID,signInMethod:qt.TWITTER_SIGN_IN_METHOD,oauthToken:e,oauthTokenSecret:t})}static credentialFromResult(e){return qt.credentialFromTaggedObject(e)}static credentialFromError(e){return qt.credentialFromTaggedObject(e.customData||{})}static credentialFromTaggedObject({_tokenResponse:e}){if(!e)return null;const{oauthAccessToken:t,oauthTokenSecret:s}=e;if(!t||!s)return null;try{return qt.credential(t,s)}catch{return null}}}qt.TWITTER_SIGN_IN_METHOD="twitter.com";qt.PROVIDER_ID="twitter.com";/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */async function gm(n,e){return ni(n,"POST","/v1/accounts:signUp",ln(n,e))}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class wn{constructor(e){this.user=e.user,this.providerId=e.providerId,this._tokenResponse=e._tokenResponse,this.operationType=e.operationType}static async _fromIdTokenResponse(e,t,s,i=!1){const r=await xt._fromIdTokenResponse(e,s,i),o=Cl(s);return new wn({user:r,providerId:o,_tokenResponse:s,operationType:t})}static async _forOperation(e,t,s){await e._updateTokensIfNecessary(s,!0);const i=Cl(s);return new wn({user:e,providerId:i,_tokenResponse:s,operationType:t})}}function Cl(n){return n.providerId?n.providerId:"phoneNumber"in n?"phone":null}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Bi extends an{constructor(e,t,s,i){var r;super(t.code,t.message),this.operationType=s,this.user=i,Object.setPrototypeOf(this,Bi.prototype),this.customData={appName:e.name,tenantId:(r=e.tenantId)!==null&&r!==void 0?r:void 0,_serverResponse:t.customData._serverResponse,operationType:s}}static _fromErrorAndOperation(e,t,s,i){return new Bi(e,t,s,i)}}function gd(n,e,t,s){return(e==="reauthenticate"?t._getReauthenticationResolver(n):t._getIdTokenResponse(n)).catch(r=>{throw r.code==="auth/multi-factor-auth-required"?Bi._fromErrorAndOperation(n,r,e,s):r})}async function _m(n,e,t=!1){const s=await Jn(n,e._linkToIdToken(n.auth,await n.getIdToken()),t);return wn._forOperation(n,"link",s)}/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */async function _d(n,e,t=!1){const{auth:s}=n;if(gt(s.app))return Promise.reject(Pt(s));const i="reauthenticate";try{const r=await Jn(n,gd(s,i,e,n),t);K(r.idToken,s,"internal-error");const o=Go(r.idToken);K(o,s,"internal-error");const{sub:a}=o;return K(n.uid===a,s,"user-mismatch"),wn._forOperation(n,i,r)}catch(r){throw(r==null?void 0:r.code)==="auth/user-not-found"&&ut(s,"user-mismatch"),r}}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */async function yd(n,e,t=!1){if(gt(n.app))return Promise.reject(Pt(n));const s="signIn",i=await gd(n,s,e),r=await wn._fromIdTokenResponse(n,s,i);return t||await n._updateCurrentUser(r.user),r}async function ym(n,e){return yd(xn(n),e)}async function vm(n,e){return _d(xe(n),e)}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */async function vd(n){const e=xn(n);e._getPasswordPolicyInternal()&&await e._updatePasswordPolicy()}async function bm(n,e,t){if(gt(n.app))return Promise.reject(Pt(n));const s=xn(n),o=await ao(s,{returnSecureToken:!0,email:e,password:t,clientType:"CLIENT_TYPE_WEB"},"signUpPassword",gm).catch(c=>{throw c.code==="auth/password-does-not-meet-requirements"&&vd(n),c}),a=await wn._fromIdTokenResponse(s,"signIn",o);return await s._updateCurrentUser(a.user),a}function wm(n,e,t){return gt(n.app)?Promise.reject(Pt(n)):ym(xe(n),An.credential(e,t)).catch(async s=>{throw s.code==="auth/password-does-not-meet-requirements"&&vd(n),s})}function Em(n,e){return Cm(xe(n),null,e)}async function Cm(n,e,t){const{auth:s}=n,r={idToken:await n.getIdToken(),returnSecureToken:!0};t&&(r.password=t);const o=await Jn(n,lm(s,r));await n._updateTokensIfNecessary(o,!0)}function Im(n,e,t,s){return xe(n).onIdTokenChanged(e,t,s)}function Sm(n,e,t){return xe(n).beforeAuthStateChanged(e,t)}function Tm(n,e,t,s){return xe(n).onAuthStateChanged(e,t,s)}function km(n){return xe(n).signOut()}async function xm(n){return xe(n).delete()}const Hi="__sak";/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class bd{constructor(e,t){this.storageRetriever=e,this.type=t}_isAvailable(){try{return this.storage?(this.storage.setItem(Hi,"1"),this.storage.removeItem(Hi),Promise.resolve(!0)):Promise.resolve(!1)}catch{return Promise.resolve(!1)}}_set(e,t){return this.storage.setItem(e,JSON.stringify(t)),Promise.resolve()}_get(e){const t=this.storage.getItem(e);return Promise.resolve(t?JSON.parse(t):null)}_remove(e){return this.storage.removeItem(e),Promise.resolve()}get storage(){return this.storageRetriever()}}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const Am=1e3,Rm=10;class wd extends bd{constructor(){super(()=>window.localStorage,"LOCAL"),this.boundEventHandler=(e,t)=>this.onStorageEvent(e,t),this.listeners={},this.localCache={},this.pollTimer=null,this.fallbackToPolling=ud(),this._shouldAllowMigration=!0}forAllChangedKeys(e){for(const t of Object.keys(this.listeners)){const s=this.storage.getItem(t),i=this.localCache[t];s!==i&&e(t,i,s)}}onStorageEvent(e,t=!1){if(!e.key){this.forAllChangedKeys((o,a,c)=>{this.notifyListeners(o,c)});return}const s=e.key;t?this.detachListener():this.stopPolling();const i=()=>{const o=this.storage.getItem(s);!t&&this.localCache[s]===o||this.notifyListeners(s,o)},r=this.storage.getItem(s);Vp()&&r!==e.newValue&&e.newValue!==e.oldValue?setTimeout(i,Rm):i()}notifyListeners(e,t){this.localCache[e]=t;const s=this.listeners[e];if(s)for(const i of Array.from(s))i(t&&JSON.parse(t))}startPolling(){this.stopPolling(),this.pollTimer=setInterval(()=>{this.forAllChangedKeys((e,t,s)=>{this.onStorageEvent(new StorageEvent("storage",{key:e,oldValue:t,newValue:s}),!0)})},Am)}stopPolling(){this.pollTimer&&(clearInterval(this.pollTimer),this.pollTimer=null)}attachListener(){window.addEventListener("storage",this.boundEventHandler)}detachListener(){window.removeEventListener("storage",this.boundEventHandler)}_addListener(e,t){Object.keys(this.listeners).length===0&&(this.fallbackToPolling?this.startPolling():this.attachListener()),this.listeners[e]||(this.listeners[e]=new Set,this.localCache[e]=this.storage.getItem(e)),this.listeners[e].add(t)}_removeListener(e,t){this.listeners[e]&&(this.listeners[e].delete(t),this.listeners[e].size===0&&delete this.listeners[e]),Object.keys(this.listeners).length===0&&(this.detachListener(),this.stopPolling())}async _set(e,t){await super._set(e,t),this.localCache[e]=JSON.stringify(t)}async _get(e){const t=await super._get(e);return this.localCache[e]=JSON.stringify(t),t}async _remove(e){await super._remove(e),delete this.localCache[e]}}wd.type="LOCAL";const Pm=wd;/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Ed extends bd{constructor(){super(()=>window.sessionStorage,"SESSION")}_addListener(e,t){}_removeListener(e,t){}}Ed.type="SESSION";const Cd=Ed;/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function Nm(n){return Promise.all(n.map(async e=>{try{return{fulfilled:!0,value:await e}}catch(t){return{fulfilled:!1,reason:t}}}))}/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class cr{constructor(e){this.eventTarget=e,this.handlersMap={},this.boundEventHandler=this.handleEvent.bind(this)}static _getInstance(e){const t=this.receivers.find(i=>i.isListeningto(e));if(t)return t;const s=new cr(e);return this.receivers.push(s),s}isListeningto(e){return this.eventTarget===e}async handleEvent(e){const t=e,{eventId:s,eventType:i,data:r}=t.data,o=this.handlersMap[i];if(!(o!=null&&o.size))return;t.ports[0].postMessage({status:"ack",eventId:s,eventType:i});const a=Array.from(o).map(async d=>d(t.origin,r)),c=await Nm(a);t.ports[0].postMessage({status:"done",eventId:s,eventType:i,response:c})}_subscribe(e,t){Object.keys(this.handlersMap).length===0&&this.eventTarget.addEventListener("message",this.boundEventHandler),this.handlersMap[e]||(this.handlersMap[e]=new Set),this.handlersMap[e].add(t)}_unsubscribe(e,t){this.handlersMap[e]&&t&&this.handlersMap[e].delete(t),(!t||this.handlersMap[e].size===0)&&delete this.handlersMap[e],Object.keys(this.handlersMap).length===0&&this.eventTarget.removeEventListener("message",this.boundEventHandler)}}cr.receivers=[];/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function Jo(n="",e=10){let t="";for(let s=0;s<e;s++)t+=Math.floor(Math.random()*10);return n+t}/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Om{constructor(e){this.target=e,this.handlers=new Set}removeMessageHandler(e){e.messageChannel&&(e.messageChannel.port1.removeEventListener("message",e.onMessage),e.messageChannel.port1.close()),this.handlers.delete(e)}async _send(e,t,s=50){const i=typeof MessageChannel<"u"?new MessageChannel:null;if(!i)throw new Error("connection_unavailable");let r,o;return new Promise((a,c)=>{const d=Jo("",20);i.port1.start();const h=setTimeout(()=>{c(new Error("unsupported_event"))},s);o={messageChannel:i,onMessage(f){const _=f;if(_.data.eventId===d)switch(_.data.status){case"ack":clearTimeout(h),r=setTimeout(()=>{c(new Error("timeout"))},3e3);break;case"done":clearTimeout(r),a(_.data.response);break;default:clearTimeout(h),clearTimeout(r),c(new Error("invalid_response"));break}}},this.handlers.add(o),i.port1.addEventListener("message",o.onMessage),this.target.postMessage({eventType:e,eventId:d,data:t},[i.port2])}).finally(()=>{o&&this.removeMessageHandler(o)})}}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function yt(){return window}function Mm(n){yt().location.href=n}/**
 * @license
 * Copyright 2020 Google LLC.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function Id(){return typeof yt().WorkerGlobalScope<"u"&&typeof yt().importScripts=="function"}async function Dm(){if(!(navigator!=null&&navigator.serviceWorker))return null;try{return(await navigator.serviceWorker.ready).active}catch{return null}}function Lm(){var n;return((n=navigator==null?void 0:navigator.serviceWorker)===null||n===void 0?void 0:n.controller)||null}function Fm(){return Id()?self:null}/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const Sd="firebaseLocalStorageDb",$m=1,ji="firebaseLocalStorage",Td="fbase_key";class ii{constructor(e){this.request=e}toPromise(){return new Promise((e,t)=>{this.request.addEventListener("success",()=>{e(this.request.result)}),this.request.addEventListener("error",()=>{t(this.request.error)})})}}function dr(n,e){return n.transaction([ji],e?"readwrite":"readonly").objectStore(ji)}function Um(){const n=indexedDB.deleteDatabase(Sd);return new ii(n).toPromise()}function lo(){const n=indexedDB.open(Sd,$m);return new Promise((e,t)=>{n.addEventListener("error",()=>{t(n.error)}),n.addEventListener("upgradeneeded",()=>{const s=n.result;try{s.createObjectStore(ji,{keyPath:Td})}catch(i){t(i)}}),n.addEventListener("success",async()=>{const s=n.result;s.objectStoreNames.contains(ji)?e(s):(s.close(),await Um(),e(await lo()))})})}async function Il(n,e,t){const s=dr(n,!0).put({[Td]:e,value:t});return new ii(s).toPromise()}async function Wm(n,e){const t=dr(n,!1).get(e),s=await new ii(t).toPromise();return s===void 0?null:s.value}function Sl(n,e){const t=dr(n,!0).delete(e);return new ii(t).toPromise()}const Bm=800,Hm=3;class kd{constructor(){this.type="LOCAL",this._shouldAllowMigration=!0,this.listeners={},this.localCache={},this.pollTimer=null,this.pendingWrites=0,this.receiver=null,this.sender=null,this.serviceWorkerReceiverAvailable=!1,this.activeServiceWorker=null,this._workerInitializationPromise=this.initializeServiceWorkerMessaging().then(()=>{},()=>{})}async _openDb(){return this.db?this.db:(this.db=await lo(),this.db)}async _withRetries(e){let t=0;for(;;)try{const s=await this._openDb();return await e(s)}catch(s){if(t++>Hm)throw s;this.db&&(this.db.close(),this.db=void 0)}}async initializeServiceWorkerMessaging(){return Id()?this.initializeReceiver():this.initializeSender()}async initializeReceiver(){this.receiver=cr._getInstance(Fm()),this.receiver._subscribe("keyChanged",async(e,t)=>({keyProcessed:(await this._poll()).includes(t.key)})),this.receiver._subscribe("ping",async(e,t)=>["keyChanged"])}async initializeSender(){var e,t;if(this.activeServiceWorker=await Dm(),!this.activeServiceWorker)return;this.sender=new Om(this.activeServiceWorker);const s=await this.sender._send("ping",{},800);s&&!((e=s[0])===null||e===void 0)&&e.fulfilled&&!((t=s[0])===null||t===void 0)&&t.value.includes("keyChanged")&&(this.serviceWorkerReceiverAvailable=!0)}async notifyServiceWorker(e){if(!(!this.sender||!this.activeServiceWorker||Lm()!==this.activeServiceWorker))try{await this.sender._send("keyChanged",{key:e},this.serviceWorkerReceiverAvailable?800:50)}catch{}}async _isAvailable(){try{if(!indexedDB)return!1;const e=await lo();return await Il(e,Hi,"1"),await Sl(e,Hi),!0}catch{}return!1}async _withPendingWrite(e){this.pendingWrites++;try{await e()}finally{this.pendingWrites--}}async _set(e,t){return this._withPendingWrite(async()=>(await this._withRetries(s=>Il(s,e,t)),this.localCache[e]=t,this.notifyServiceWorker(e)))}async _get(e){const t=await this._withRetries(s=>Wm(s,e));return this.localCache[e]=t,t}async _remove(e){return this._withPendingWrite(async()=>(await this._withRetries(t=>Sl(t,e)),delete this.localCache[e],this.notifyServiceWorker(e)))}async _poll(){const e=await this._withRetries(i=>{const r=dr(i,!1).getAll();return new ii(r).toPromise()});if(!e)return[];if(this.pendingWrites!==0)return[];const t=[],s=new Set;if(e.length!==0)for(const{fbase_key:i,value:r}of e)s.add(i),JSON.stringify(this.localCache[i])!==JSON.stringify(r)&&(this.notifyListeners(i,r),t.push(i));for(const i of Object.keys(this.localCache))this.localCache[i]&&!s.has(i)&&(this.notifyListeners(i,null),t.push(i));return t}notifyListeners(e,t){this.localCache[e]=t;const s=this.listeners[e];if(s)for(const i of Array.from(s))i(t)}startPolling(){this.stopPolling(),this.pollTimer=setInterval(async()=>this._poll(),Bm)}stopPolling(){this.pollTimer&&(clearInterval(this.pollTimer),this.pollTimer=null)}_addListener(e,t){Object.keys(this.listeners).length===0&&this.startPolling(),this.listeners[e]||(this.listeners[e]=new Set,this._get(e)),this.listeners[e].add(t)}_removeListener(e,t){this.listeners[e]&&(this.listeners[e].delete(t),this.listeners[e].size===0&&delete this.listeners[e]),Object.keys(this.listeners).length===0&&this.stopPolling()}}kd.type="LOCAL";const jm=kd;new ti(3e4,6e4);/**
 * @license
 * Copyright 2021 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function Vm(n,e){return e?At(e):(K(n._popupRedirectResolver,n,"argument-error"),n._popupRedirectResolver)}/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Xo extends Ko{constructor(e){super("custom","custom"),this.params=e}_getIdTokenResponse(e){return Vn(e,this._buildIdpRequest())}_linkToIdToken(e,t){return Vn(e,this._buildIdpRequest(t))}_getReauthenticationResolver(e){return Vn(e,this._buildIdpRequest())}_buildIdpRequest(e){const t={requestUri:this.params.requestUri,sessionId:this.params.sessionId,postBody:this.params.postBody,tenantId:this.params.tenantId,pendingToken:this.params.pendingToken,returnSecureToken:!0,returnIdpCredential:!0};return e&&(t.idToken=e),t}}function qm(n){return yd(n.auth,new Xo(n),n.bypassAuthState)}function zm(n){const{auth:e,user:t}=n;return K(t,e,"internal-error"),_d(t,new Xo(n),n.bypassAuthState)}async function Gm(n){const{auth:e,user:t}=n;return K(t,e,"internal-error"),_m(t,new Xo(n),n.bypassAuthState)}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class xd{constructor(e,t,s,i,r=!1){this.auth=e,this.resolver=s,this.user=i,this.bypassAuthState=r,this.pendingPromise=null,this.eventManager=null,this.filter=Array.isArray(t)?t:[t]}execute(){return new Promise(async(e,t)=>{this.pendingPromise={resolve:e,reject:t};try{this.eventManager=await this.resolver._initialize(this.auth),await this.onExecution(),this.eventManager.registerConsumer(this)}catch(s){this.reject(s)}})}async onAuthEvent(e){const{urlResponse:t,sessionId:s,postBody:i,tenantId:r,error:o,type:a}=e;if(o){this.reject(o);return}const c={auth:this.auth,requestUri:t,sessionId:s,tenantId:r||void 0,postBody:i||void 0,user:this.user,bypassAuthState:this.bypassAuthState};try{this.resolve(await this.getIdpTask(a)(c))}catch(d){this.reject(d)}}onError(e){this.reject(e)}getIdpTask(e){switch(e){case"signInViaPopup":case"signInViaRedirect":return qm;case"linkViaPopup":case"linkViaRedirect":return Gm;case"reauthViaPopup":case"reauthViaRedirect":return zm;default:ut(this.auth,"internal-error")}}resolve(e){Dt(this.pendingPromise,"Pending promise was never set"),this.pendingPromise.resolve(e),this.unregisterAndCleanUp()}reject(e){Dt(this.pendingPromise,"Pending promise was never set"),this.pendingPromise.reject(e),this.unregisterAndCleanUp()}unregisterAndCleanUp(){this.eventManager&&this.eventManager.unregisterConsumer(this),this.pendingPromise=null,this.cleanUp()}}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const Ym=new ti(2e3,1e4);class Un extends xd{constructor(e,t,s,i,r){super(e,t,i,r),this.provider=s,this.authWindow=null,this.pollId=null,Un.currentPopupAction&&Un.currentPopupAction.cancel(),Un.currentPopupAction=this}async executeNotNull(){const e=await this.execute();return K(e,this.auth,"internal-error"),e}async onExecution(){Dt(this.filter.length===1,"Popup operations only handle one event");const e=Jo();this.authWindow=await this.resolver._openPopup(this.auth,this.provider,this.filter[0],e),this.authWindow.associatedEvent=e,this.resolver._originValidation(this.auth).catch(t=>{this.reject(t)}),this.resolver._isIframeWebStorageSupported(this.auth,t=>{t||this.reject(_t(this.auth,"web-storage-unsupported"))}),this.pollUserCancellation()}get eventId(){var e;return((e=this.authWindow)===null||e===void 0?void 0:e.associatedEvent)||null}cancel(){this.reject(_t(this.auth,"cancelled-popup-request"))}cleanUp(){this.authWindow&&this.authWindow.close(),this.pollId&&window.clearTimeout(this.pollId),this.authWindow=null,this.pollId=null,Un.currentPopupAction=null}pollUserCancellation(){const e=()=>{var t,s;if(!((s=(t=this.authWindow)===null||t===void 0?void 0:t.window)===null||s===void 0)&&s.closed){this.pollId=window.setTimeout(()=>{this.pollId=null,this.reject(_t(this.auth,"popup-closed-by-user"))},8e3);return}this.pollId=window.setTimeout(e,Ym.get())};e()}}Un.currentPopupAction=null;/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const Km="pendingRedirect",Ri=new Map;class Qm extends xd{constructor(e,t,s=!1){super(e,["signInViaRedirect","linkViaRedirect","reauthViaRedirect","unknown"],t,void 0,s),this.eventId=null}async execute(){let e=Ri.get(this.auth._key());if(!e){try{const s=await Jm(this.resolver,this.auth)?await super.execute():null;e=()=>Promise.resolve(s)}catch(t){e=()=>Promise.reject(t)}Ri.set(this.auth._key(),e)}return this.bypassAuthState||Ri.set(this.auth._key(),()=>Promise.resolve(null)),e()}async onAuthEvent(e){if(e.type==="signInViaRedirect")return super.onAuthEvent(e);if(e.type==="unknown"){this.resolve(null);return}if(e.eventId){const t=await this.auth._redirectUserForId(e.eventId);if(t)return this.user=t,super.onAuthEvent(e);this.resolve(null)}}async onExecution(){}cleanUp(){}}async function Jm(n,e){const t=eg(e),s=Zm(n);if(!await s._isAvailable())return!1;const i=await s._get(t)==="true";return await s._remove(t),i}function Xm(n,e){Ri.set(n._key(),e)}function Zm(n){return At(n._redirectPersistence)}function eg(n){return Ai(Km,n.config.apiKey,n.name)}async function tg(n,e,t=!1){if(gt(n.app))return Promise.reject(Pt(n));const s=xn(n),i=Vm(s,e),o=await new Qm(s,i,t).execute();return o&&!t&&(delete o.user._redirectEventId,await s._persistUserIfCurrent(o.user),await s._setRedirectUser(null,e)),o}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const ng=10*60*1e3;class sg{constructor(e){this.auth=e,this.cachedEventUids=new Set,this.consumers=new Set,this.queuedRedirectEvent=null,this.hasHandledPotentialRedirect=!1,this.lastProcessedEventTime=Date.now()}registerConsumer(e){this.consumers.add(e),this.queuedRedirectEvent&&this.isEventForConsumer(this.queuedRedirectEvent,e)&&(this.sendToConsumer(this.queuedRedirectEvent,e),this.saveEventToCache(this.queuedRedirectEvent),this.queuedRedirectEvent=null)}unregisterConsumer(e){this.consumers.delete(e)}onEvent(e){if(this.hasEventBeenHandled(e))return!1;let t=!1;return this.consumers.forEach(s=>{this.isEventForConsumer(e,s)&&(t=!0,this.sendToConsumer(e,s),this.saveEventToCache(e))}),this.hasHandledPotentialRedirect||!ig(e)||(this.hasHandledPotentialRedirect=!0,t||(this.queuedRedirectEvent=e,t=!0)),t}sendToConsumer(e,t){var s;if(e.error&&!Ad(e)){const i=((s=e.error.code)===null||s===void 0?void 0:s.split("auth/")[1])||"internal-error";t.onError(_t(this.auth,i))}else t.onAuthEvent(e)}isEventForConsumer(e,t){const s=t.eventId===null||!!e.eventId&&e.eventId===t.eventId;return t.filter.includes(e.type)&&s}hasEventBeenHandled(e){return Date.now()-this.lastProcessedEventTime>=ng&&this.cachedEventUids.clear(),this.cachedEventUids.has(Tl(e))}saveEventToCache(e){this.cachedEventUids.add(Tl(e)),this.lastProcessedEventTime=Date.now()}}function Tl(n){return[n.type,n.eventId,n.sessionId,n.tenantId].filter(e=>e).join("-")}function Ad({type:n,error:e}){return n==="unknown"&&(e==null?void 0:e.code)==="auth/no-auth-event"}function ig(n){switch(n.type){case"signInViaRedirect":case"linkViaRedirect":case"reauthViaRedirect":return!0;case"unknown":return Ad(n);default:return!1}}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */async function rg(n,e={}){return $t(n,"GET","/v1/projects",e)}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const og=/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/,ag=/^https?/;async function lg(n){if(n.config.emulator)return;const{authorizedDomains:e}=await rg(n);for(const t of e)try{if(cg(t))return}catch{}ut(n,"unauthorized-domain")}function cg(n){const e=ro(),{protocol:t,hostname:s}=new URL(e);if(n.startsWith("chrome-extension://")){const o=new URL(n);return o.hostname===""&&s===""?t==="chrome-extension:"&&n.replace("chrome-extension://","")===e.replace("chrome-extension://",""):t==="chrome-extension:"&&o.hostname===s}if(!ag.test(t))return!1;if(og.test(n))return s===n;const i=n.replace(/\./g,"\\.");return new RegExp("^(.+\\."+i+"|"+i+")$","i").test(s)}/**
 * @license
 * Copyright 2020 Google LLC.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const dg=new ti(3e4,6e4);function kl(){const n=yt().___jsl;if(n!=null&&n.H){for(const e of Object.keys(n.H))if(n.H[e].r=n.H[e].r||[],n.H[e].L=n.H[e].L||[],n.H[e].r=[...n.H[e].L],n.CP)for(let t=0;t<n.CP.length;t++)n.CP[t]=null}}function ug(n){return new Promise((e,t)=>{var s,i,r;function o(){kl(),gapi.load("gapi.iframes",{callback:()=>{e(gapi.iframes.getContext())},ontimeout:()=>{kl(),t(_t(n,"network-request-failed"))},timeout:dg.get()})}if(!((i=(s=yt().gapi)===null||s===void 0?void 0:s.iframes)===null||i===void 0)&&i.Iframe)e(gapi.iframes.getContext());else if(!((r=yt().gapi)===null||r===void 0)&&r.load)o();else{const a=Zp("iframefcb");return yt()[a]=()=>{gapi.load?o():t(_t(n,"network-request-failed"))},fd(`${Xp()}?onload=${a}`).catch(c=>t(c))}}).catch(e=>{throw Pi=null,e})}let Pi=null;function hg(n){return Pi=Pi||ug(n),Pi}/**
 * @license
 * Copyright 2020 Google LLC.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const fg=new ti(5e3,15e3),pg="__/auth/iframe",mg="emulator/auth/iframe",gg={style:{position:"absolute",top:"-100px",width:"1px",height:"1px"},"aria-hidden":"true",tabindex:"-1"},_g=new Map([["identitytoolkit.googleapis.com","p"],["staging-identitytoolkit.sandbox.googleapis.com","s"],["test-identitytoolkit.sandbox.googleapis.com","t"]]);function yg(n){const e=n.config;K(e.authDomain,n,"auth-domain-config-required");const t=e.emulator?zo(e,mg):`https://${n.config.authDomain}/${pg}`,s={apiKey:e.apiKey,appName:n.name,v:ls},i=_g.get(n.config.apiHost);i&&(s.eid=i);const r=n._getFrameworks();return r.length&&(s.fw=r.join(",")),`${t}?${as(s).slice(1)}`}async function vg(n){const e=await hg(n),t=yt().gapi;return K(t,n,"internal-error"),e.open({where:document.body,url:yg(n),messageHandlersFilter:t.iframes.CROSS_ORIGIN_IFRAMES_FILTER,attributes:gg,dontclear:!0},s=>new Promise(async(i,r)=>{await s.restyle({setHideOnLeave:!1});const o=_t(n,"network-request-failed"),a=yt().setTimeout(()=>{r(o)},fg.get());function c(){yt().clearTimeout(a),i(s)}s.ping(c).then(c,()=>{r(o)})}))}/**
 * @license
 * Copyright 2020 Google LLC.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const bg={location:"yes",resizable:"yes",statusbar:"yes",toolbar:"no"},wg=500,Eg=600,Cg="_blank",Ig="http://localhost";class xl{constructor(e){this.window=e,this.associatedEvent=null}close(){if(this.window)try{this.window.close()}catch{}}}function Sg(n,e,t,s=wg,i=Eg){const r=Math.max((window.screen.availHeight-i)/2,0).toString(),o=Math.max((window.screen.availWidth-s)/2,0).toString();let a="";const c=Object.assign(Object.assign({},bg),{width:s.toString(),height:i.toString(),top:r,left:o}),d=Ve().toLowerCase();t&&(a=od(d)?Cg:t),id(d)&&(e=e||Ig,c.scrollbars="yes");const h=Object.entries(c).reduce((_,[p,I])=>`${_}${p}=${I},`,"");if(jp(d)&&a!=="_self")return Tg(e||"",a),new xl(null);const f=window.open(e||"",a,h);K(f,n,"popup-blocked");try{f.focus()}catch{}return new xl(f)}function Tg(n,e){const t=document.createElement("a");t.href=n,t.target=e;const s=document.createEvent("MouseEvent");s.initMouseEvent("click",!0,!0,window,1,0,0,0,0,!1,!1,!1,!1,1,null),t.dispatchEvent(s)}/**
 * @license
 * Copyright 2021 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const kg="__/auth/handler",xg="emulator/auth/handler",Ag=encodeURIComponent("fac");async function Al(n,e,t,s,i,r){K(n.config.authDomain,n,"auth-domain-config-required"),K(n.config.apiKey,n,"invalid-api-key");const o={apiKey:n.config.apiKey,appName:n.name,authType:t,redirectUrl:s,v:ls,eventId:i};if(e instanceof md){e.setDefaultLanguage(n.languageCode),o.providerId=e.providerId||"",Di(e.getCustomParameters())||(o.customParameters=JSON.stringify(e.getCustomParameters()));for(const[h,f]of Object.entries({}))o[h]=f}if(e instanceof si){const h=e.getScopes().filter(f=>f!=="");h.length>0&&(o.scopes=h.join(","))}n.tenantId&&(o.tid=n.tenantId);const a=o;for(const h of Object.keys(a))a[h]===void 0&&delete a[h];const c=await n._getAppCheckToken(),d=c?`#${Ag}=${encodeURIComponent(c)}`:"";return`${Rg(n)}?${as(a).slice(1)}${d}`}function Rg({config:n}){return n.emulator?zo(n,xg):`https://${n.authDomain}/${kg}`}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const Ur="webStorageSupport";class Pg{constructor(){this.eventManagers={},this.iframes={},this.originValidationPromises={},this._redirectPersistence=Cd,this._completeRedirectFn=tg,this._overrideRedirectResult=Xm}async _openPopup(e,t,s,i){var r;Dt((r=this.eventManagers[e._key()])===null||r===void 0?void 0:r.manager,"_initialize() not called before _openPopup()");const o=await Al(e,t,s,ro(),i);return Sg(e,o,Jo())}async _openRedirect(e,t,s,i){await this._originValidation(e);const r=await Al(e,t,s,ro(),i);return Mm(r),new Promise(()=>{})}_initialize(e){const t=e._key();if(this.eventManagers[t]){const{manager:i,promise:r}=this.eventManagers[t];return i?Promise.resolve(i):(Dt(r,"If manager is not set, promise should be"),r)}const s=this.initAndGetManager(e);return this.eventManagers[t]={promise:s},s.catch(()=>{delete this.eventManagers[t]}),s}async initAndGetManager(e){const t=await vg(e),s=new sg(e);return t.register("authEvent",i=>(K(i==null?void 0:i.authEvent,e,"invalid-auth-event"),{status:s.onEvent(i.authEvent)?"ACK":"ERROR"}),gapi.iframes.CROSS_ORIGIN_IFRAMES_FILTER),this.eventManagers[e._key()]={manager:s},this.iframes[e._key()]=t,s}_isIframeWebStorageSupported(e,t){this.iframes[e._key()].send(Ur,{type:Ur},i=>{var r;const o=(r=i==null?void 0:i[0])===null||r===void 0?void 0:r[Ur];o!==void 0&&t(!!o),ut(e,"internal-error")},gapi.iframes.CROSS_ORIGIN_IFRAMES_FILTER)}_originValidation(e){const t=e._key();return this.originValidationPromises[t]||(this.originValidationPromises[t]=lg(e)),this.originValidationPromises[t]}get _shouldInitProactively(){return ud()||rd()||Yo()}}const Ng=Pg;var Rl="@firebase/auth",Pl="1.7.9";/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Og{constructor(e){this.auth=e,this.internalListeners=new Map}getUid(){var e;return this.assertAuthConfigured(),((e=this.auth.currentUser)===null||e===void 0?void 0:e.uid)||null}async getToken(e){return this.assertAuthConfigured(),await this.auth._initializationPromise,this.auth.currentUser?{accessToken:await this.auth.currentUser.getIdToken(e)}:null}addAuthTokenListener(e){if(this.assertAuthConfigured(),this.internalListeners.has(e))return;const t=this.auth.onIdTokenChanged(s=>{e((s==null?void 0:s.stsTokenManager.accessToken)||null)});this.internalListeners.set(e,t),this.updateProactiveRefresh()}removeAuthTokenListener(e){this.assertAuthConfigured();const t=this.internalListeners.get(e);t&&(this.internalListeners.delete(e),t(),this.updateProactiveRefresh())}assertAuthConfigured(){K(this.auth._initializationPromise,"dependent-sdk-initialized-before-auth")}updateProactiveRefresh(){this.internalListeners.size>0?this.auth._startProactiveRefresh():this.auth._stopProactiveRefresh()}}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function Mg(n){switch(n){case"Node":return"node";case"ReactNative":return"rn";case"Worker":return"webworker";case"Cordova":return"cordova";case"WebExtension":return"web-extension";default:return}}function Dg(n){Qn(new vn("auth",(e,{options:t})=>{const s=e.getProvider("app").getImmediate(),i=e.getProvider("heartbeat"),r=e.getProvider("app-check-internal"),{apiKey:o,authDomain:a}=s.options;K(o&&!o.includes(":"),"invalid-api-key",{appName:s.name});const c={apiKey:o,authDomain:a,clientPlatform:n,apiHost:"identitytoolkit.googleapis.com",tokenApiHost:"securetoken.googleapis.com",apiScheme:"https",sdkClientVersion:hd(n)},d=new Kp(s,i,r,c);return im(d,t),d},"PUBLIC").setInstantiationMode("EXPLICIT").setInstanceCreatedCallback((e,t,s)=>{e.getProvider("auth-internal").initialize()})),Qn(new vn("auth-internal",e=>{const t=xn(e.getProvider("auth").getImmediate());return(s=>new Og(s))(t)},"PRIVATE").setInstantiationMode("EXPLICIT")),Jt(Rl,Pl,Mg(n)),Jt(Rl,Pl,"esm2017")}/**
 * @license
 * Copyright 2021 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const Lg=5*60,Fg=Wc("authIdTokenMaxAge")||Lg;let Nl=null;const $g=n=>async e=>{const t=e&&await e.getIdTokenResult(),s=t&&(new Date().getTime()-Date.parse(t.issuedAtTime))/1e3;if(s&&s>Fg)return;const i=t==null?void 0:t.token;Nl!==i&&(Nl=i,await fetch(n,{method:i?"POST":"DELETE",headers:i?{Authorization:`Bearer ${i}`}:{}}))};function Ug(n=zc()){const e=jo(n,"auth");if(e.isInitialized())return e.getImmediate();const t=sm(n,{popupRedirectResolver:Ng,persistence:[jm,Pm,Cd]}),s=Wc("authTokenSyncURL");if(s&&typeof isSecureContext=="boolean"&&isSecureContext){const r=new URL(s,location.origin);if(location.origin===r.origin){const o=$g(r.toString());Sm(t,o,()=>o(t.currentUser)),Im(t,a=>o(a))}}const i=$c("auth");return i&&rm(t,`http://${i}`),t}function Wg(){var n,e;return(e=(n=document.getElementsByTagName("head"))===null||n===void 0?void 0:n[0])!==null&&e!==void 0?e:document}Qp({loadJS(n){return new Promise((e,t)=>{const s=document.createElement("script");s.setAttribute("src",n),s.onload=e,s.onerror=i=>{const r=_t("internal-error");r.customData=i,t(r)},s.type="text/javascript",s.charset="UTF-8",Wg().appendChild(s)})},gapiScript:"https://apis.google.com/js/api.js",recaptchaV2Script:"https://www.google.com/recaptcha/api.js",recaptchaEnterpriseScript:"https://www.google.com/recaptcha/enterprise.js?render="});Dg("Browser");var Bg="firebase",Hg="10.14.1";/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */Jt(Bg,Hg,"app");var Ol={};const Ml="@firebase/database",Dl="1.0.8";/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */let Rd="";function jg(n){Rd=n}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Vg{constructor(e){this.domStorage_=e,this.prefix_="firebase:"}set(e,t){t==null?this.domStorage_.removeItem(this.prefixedName_(e)):this.domStorage_.setItem(this.prefixedName_(e),Ae(t))}get(e){const t=this.domStorage_.getItem(this.prefixedName_(e));return t==null?null:$s(t)}remove(e){this.domStorage_.removeItem(this.prefixedName_(e))}prefixedName_(e){return this.prefix_+e}toString(){return this.domStorage_.toString()}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class qg{constructor(){this.cache_={},this.isInMemoryStorage=!0}set(e,t){t==null?delete this.cache_[e]:this.cache_[e]=t}get(e){return bt(this.cache_,e)?this.cache_[e]:null}remove(e){delete this.cache_[e]}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const Pd=function(n){try{if(typeof window<"u"&&typeof window[n]<"u"){const e=window[n];return e.setItem("firebase:sentinel","cache"),e.removeItem("firebase:sentinel"),new Vg(e)}}catch{}return new qg},mn=Pd("localStorage"),zg=Pd("sessionStorage");/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const qn=new Bo("@firebase/database"),Gg=function(){let n=1;return function(){return n++}}(),Nd=function(n){const e=gf(n),t=new hf;t.update(e);const s=t.digest();return $o.encodeByteArray(s)},ri=function(...n){let e="";for(let t=0;t<n.length;t++){const s=n[t];Array.isArray(s)||s&&typeof s=="object"&&typeof s.length=="number"?e+=ri.apply(null,s):typeof s=="object"?e+=Ae(s):e+=s,e+=" "}return e};let As=null,Ll=!0;const Yg=function(n,e){R(!0,"Can't turn on custom loggers persistently."),qn.logLevel=ve.VERBOSE,As=qn.log.bind(qn)},Ne=function(...n){if(Ll===!0&&(Ll=!1,As===null&&zg.get("logging_enabled")===!0&&Yg()),As){const e=ri.apply(null,n);As(e)}},oi=function(n){return function(...e){Ne(n,...e)}},co=function(...n){const e="FIREBASE INTERNAL ERROR: "+ri(...n);qn.error(e)},Lt=function(...n){const e=`FIREBASE FATAL ERROR: ${ri(...n)}`;throw qn.error(e),new Error(e)},je=function(...n){const e="FIREBASE WARNING: "+ri(...n);qn.warn(e)},Kg=function(){typeof window<"u"&&window.location&&window.location.protocol&&window.location.protocol.indexOf("https:")!==-1&&je("Insecure Firebase access from a secure page. Please use https in calls to new Firebase().")},ur=function(n){return typeof n=="number"&&(n!==n||n===Number.POSITIVE_INFINITY||n===Number.NEGATIVE_INFINITY)},Qg=function(n){if(document.readyState==="complete")n();else{let e=!1;const t=function(){if(!document.body){setTimeout(t,Math.floor(10));return}e||(e=!0,n())};document.addEventListener?(document.addEventListener("DOMContentLoaded",t,!1),window.addEventListener("load",t,!1)):document.attachEvent&&(document.attachEvent("onreadystatechange",()=>{document.readyState==="complete"&&t()}),window.attachEvent("onload",t))}},En="[MIN_NAME]",en="[MAX_NAME]",Rn=function(n,e){if(n===e)return 0;if(n===En||e===en)return-1;if(e===En||n===en)return 1;{const t=Fl(n),s=Fl(e);return t!==null?s!==null?t-s===0?n.length-e.length:t-s:-1:s!==null?1:n<e?-1:1}},Jg=function(n,e){return n===e?0:n<e?-1:1},ms=function(n,e){if(e&&n in e)return e[n];throw new Error("Missing required key ("+n+") in object: "+Ae(e))},Zo=function(n){if(typeof n!="object"||n===null)return Ae(n);const e=[];for(const s in n)e.push(s);e.sort();let t="{";for(let s=0;s<e.length;s++)s!==0&&(t+=","),t+=Ae(e[s]),t+=":",t+=Zo(n[e[s]]);return t+="}",t},Od=function(n,e){const t=n.length;if(t<=e)return[n];const s=[];for(let i=0;i<t;i+=e)i+e>t?s.push(n.substring(i,t)):s.push(n.substring(i,i+e));return s};function Me(n,e){for(const t in n)n.hasOwnProperty(t)&&e(t,n[t])}const Md=function(n){R(!ur(n),"Invalid JSON number");const e=11,t=52,s=(1<<e-1)-1;let i,r,o,a,c;n===0?(r=0,o=0,i=1/n===-1/0?1:0):(i=n<0,n=Math.abs(n),n>=Math.pow(2,1-s)?(a=Math.min(Math.floor(Math.log(n)/Math.LN2),s),r=a+s,o=Math.round(n*Math.pow(2,t-a)-Math.pow(2,t))):(r=0,o=Math.round(n/Math.pow(2,1-s-t))));const d=[];for(c=t;c;c-=1)d.push(o%2?1:0),o=Math.floor(o/2);for(c=e;c;c-=1)d.push(r%2?1:0),r=Math.floor(r/2);d.push(i?1:0),d.reverse();const h=d.join("");let f="";for(c=0;c<64;c+=8){let _=parseInt(h.substr(c,8),2).toString(16);_.length===1&&(_="0"+_),f=f+_}return f.toLowerCase()},Xg=function(){return!!(typeof window=="object"&&window.chrome&&window.chrome.extension&&!/^chrome/.test(window.location.href))},Zg=function(){return typeof Windows=="object"&&typeof Windows.UI=="object"};function e_(n,e){let t="Unknown Error";n==="too_big"?t="The data requested exceeds the maximum size that can be accessed with a single request.":n==="permission_denied"?t="Client doesn't have permission to access the desired data.":n==="unavailable"&&(t="The service is unavailable");const s=new Error(n+" at "+e._path.toString()+": "+t);return s.code=n.toUpperCase(),s}const t_=new RegExp("^-?(0*)\\d{1,10}$"),n_=-2147483648,s_=2147483647,Fl=function(n){if(t_.test(n)){const e=Number(n);if(e>=n_&&e<=s_)return e}return null},cs=function(n){try{n()}catch(e){setTimeout(()=>{const t=e.stack||"";throw je("Exception was thrown by user callback.",t),e},Math.floor(0))}},i_=function(){return(typeof window=="object"&&window.navigator&&window.navigator.userAgent||"").search(/googlebot|google webmaster tools|bingbot|yahoo! slurp|baiduspider|yandexbot|duckduckbot/i)>=0},Rs=function(n,e){const t=setTimeout(n,e);return typeof t=="number"&&typeof Deno<"u"&&Deno.unrefTimer?Deno.unrefTimer(t):typeof t=="object"&&t.unref&&t.unref(),t};/**
 * @license
 * Copyright 2021 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class r_{constructor(e,t){this.appName_=e,this.appCheckProvider=t,this.appCheck=t==null?void 0:t.getImmediate({optional:!0}),this.appCheck||t==null||t.get().then(s=>this.appCheck=s)}getToken(e){return this.appCheck?this.appCheck.getToken(e):new Promise((t,s)=>{setTimeout(()=>{this.appCheck?this.getToken(e).then(t,s):t(null)},0)})}addTokenChangeListener(e){var t;(t=this.appCheckProvider)===null||t===void 0||t.get().then(s=>s.addTokenListener(e))}notifyForInvalidToken(){je(`Provided AppCheck credentials for the app named "${this.appName_}" are invalid. This usually indicates your app was not initialized correctly.`)}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class o_{constructor(e,t,s){this.appName_=e,this.firebaseOptions_=t,this.authProvider_=s,this.auth_=null,this.auth_=s.getImmediate({optional:!0}),this.auth_||s.onInit(i=>this.auth_=i)}getToken(e){return this.auth_?this.auth_.getToken(e).catch(t=>t&&t.code==="auth/token-not-initialized"?(Ne("Got auth/token-not-initialized error.  Treating as null token."),null):Promise.reject(t)):new Promise((t,s)=>{setTimeout(()=>{this.auth_?this.getToken(e).then(t,s):t(null)},0)})}addTokenChangeListener(e){this.auth_?this.auth_.addAuthTokenListener(e):this.authProvider_.get().then(t=>t.addAuthTokenListener(e))}removeTokenChangeListener(e){this.authProvider_.get().then(t=>t.removeAuthTokenListener(e))}notifyForInvalidToken(){let e='Provided authentication credentials for the app named "'+this.appName_+'" are invalid. This usually indicates your app was not initialized correctly. ';"credential"in this.firebaseOptions_?e+='Make sure the "credential" property provided to initializeApp() is authorized to access the specified "databaseURL" and is from the correct project.':"serviceAccount"in this.firebaseOptions_?e+='Make sure the "serviceAccount" property provided to initializeApp() is authorized to access the specified "databaseURL" and is from the correct project.':e+='Make sure the "apiKey" and "databaseURL" properties provided to initializeApp() match the values provided for your app at https://console.firebase.google.com/.',je(e)}}class Ni{constructor(e){this.accessToken=e}getToken(e){return Promise.resolve({accessToken:this.accessToken})}addTokenChangeListener(e){e(this.accessToken)}removeTokenChangeListener(e){}notifyForInvalidToken(){}}Ni.OWNER="owner";/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const ea="5",Dd="v",Ld="s",Fd="r",$d="f",Ud=/(console\.firebase|firebase-console-\w+\.corp|firebase\.corp)\.google\.com/,Wd="ls",Bd="p",uo="ac",Hd="websocket",jd="long_polling";/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Vd{constructor(e,t,s,i,r=!1,o="",a=!1,c=!1){this.secure=t,this.namespace=s,this.webSocketOnly=i,this.nodeAdmin=r,this.persistenceKey=o,this.includeNamespaceInQueryParams=a,this.isUsingEmulator=c,this._host=e.toLowerCase(),this._domain=this._host.substr(this._host.indexOf(".")+1),this.internalHost=mn.get("host:"+e)||this._host}isCacheableHost(){return this.internalHost.substr(0,2)==="s-"}isCustomHost(){return this._domain!=="firebaseio.com"&&this._domain!=="firebaseio-demo.com"}get host(){return this._host}set host(e){e!==this.internalHost&&(this.internalHost=e,this.isCacheableHost()&&mn.set("host:"+this._host,this.internalHost))}toString(){let e=this.toURLString();return this.persistenceKey&&(e+="<"+this.persistenceKey+">"),e}toURLString(){const e=this.secure?"https://":"http://",t=this.includeNamespaceInQueryParams?`?ns=${this.namespace}`:"";return`${e}${this.host}/${t}`}}function a_(n){return n.host!==n.internalHost||n.isCustomHost()||n.includeNamespaceInQueryParams}function qd(n,e,t){R(typeof e=="string","typeof type must == string"),R(typeof t=="object","typeof params must == object");let s;if(e===Hd)s=(n.secure?"wss://":"ws://")+n.internalHost+"/.ws?";else if(e===jd)s=(n.secure?"https://":"http://")+n.internalHost+"/.lp?";else throw new Error("Unknown connection type: "+e);a_(n)&&(t.ns=n.namespace);const i=[];return Me(t,(r,o)=>{i.push(r+"="+o)}),s+i.join("&")}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class l_{constructor(){this.counters_={}}incrementCounter(e,t=1){bt(this.counters_,e)||(this.counters_[e]=0),this.counters_[e]+=t}get(){return zh(this.counters_)}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const Wr={},Br={};function ta(n){const e=n.toString();return Wr[e]||(Wr[e]=new l_),Wr[e]}function c_(n,e){const t=n.toString();return Br[t]||(Br[t]=e()),Br[t]}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class d_{constructor(e){this.onMessage_=e,this.pendingResponses=[],this.currentResponseNum=0,this.closeAfterResponse=-1,this.onClose=null}closeAfter(e,t){this.closeAfterResponse=e,this.onClose=t,this.closeAfterResponse<this.currentResponseNum&&(this.onClose(),this.onClose=null)}handleResponse(e,t){for(this.pendingResponses[e]=t;this.pendingResponses[this.currentResponseNum];){const s=this.pendingResponses[this.currentResponseNum];delete this.pendingResponses[this.currentResponseNum];for(let i=0;i<s.length;++i)s[i]&&cs(()=>{this.onMessage_(s[i])});if(this.currentResponseNum===this.closeAfterResponse){this.onClose&&(this.onClose(),this.onClose=null);break}this.currentResponseNum++}}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const $l="start",u_="close",h_="pLPCommand",f_="pRTLPCB",zd="id",Gd="pw",Yd="ser",p_="cb",m_="seg",g_="ts",__="d",y_="dframe",Kd=1870,Qd=30,v_=Kd-Qd,b_=25e3,w_=3e4;class Wn{constructor(e,t,s,i,r,o,a){this.connId=e,this.repoInfo=t,this.applicationId=s,this.appCheckToken=i,this.authToken=r,this.transportSessionId=o,this.lastSessionId=a,this.bytesSent=0,this.bytesReceived=0,this.everConnected_=!1,this.log_=oi(e),this.stats_=ta(t),this.urlFn=c=>(this.appCheckToken&&(c[uo]=this.appCheckToken),qd(t,jd,c))}open(e,t){this.curSegmentNum=0,this.onDisconnect_=t,this.myPacketOrderer=new d_(e),this.isClosed_=!1,this.connectTimeoutTimer_=setTimeout(()=>{this.log_("Timed out trying to connect."),this.onClosed_(),this.connectTimeoutTimer_=null},Math.floor(w_)),Qg(()=>{if(this.isClosed_)return;this.scriptTagHolder=new na((...r)=>{const[o,a,c,d,h]=r;if(this.incrementIncomingBytes_(r),!!this.scriptTagHolder)if(this.connectTimeoutTimer_&&(clearTimeout(this.connectTimeoutTimer_),this.connectTimeoutTimer_=null),this.everConnected_=!0,o===$l)this.id=a,this.password=c;else if(o===u_)a?(this.scriptTagHolder.sendNewPolls=!1,this.myPacketOrderer.closeAfter(a,()=>{this.onClosed_()})):this.onClosed_();else throw new Error("Unrecognized command received: "+o)},(...r)=>{const[o,a]=r;this.incrementIncomingBytes_(r),this.myPacketOrderer.handleResponse(o,a)},()=>{this.onClosed_()},this.urlFn);const s={};s[$l]="t",s[Yd]=Math.floor(Math.random()*1e8),this.scriptTagHolder.uniqueCallbackIdentifier&&(s[p_]=this.scriptTagHolder.uniqueCallbackIdentifier),s[Dd]=ea,this.transportSessionId&&(s[Ld]=this.transportSessionId),this.lastSessionId&&(s[Wd]=this.lastSessionId),this.applicationId&&(s[Bd]=this.applicationId),this.appCheckToken&&(s[uo]=this.appCheckToken),typeof location<"u"&&location.hostname&&Ud.test(location.hostname)&&(s[Fd]=$d);const i=this.urlFn(s);this.log_("Connecting via long-poll to "+i),this.scriptTagHolder.addTag(i,()=>{})})}start(){this.scriptTagHolder.startLongPoll(this.id,this.password),this.addDisconnectPingFrame(this.id,this.password)}static forceAllow(){Wn.forceAllow_=!0}static forceDisallow(){Wn.forceDisallow_=!0}static isAvailable(){return Wn.forceAllow_?!0:!Wn.forceDisallow_&&typeof document<"u"&&document.createElement!=null&&!Xg()&&!Zg()}markConnectionHealthy(){}shutdown_(){this.isClosed_=!0,this.scriptTagHolder&&(this.scriptTagHolder.close(),this.scriptTagHolder=null),this.myDisconnFrame&&(document.body.removeChild(this.myDisconnFrame),this.myDisconnFrame=null),this.connectTimeoutTimer_&&(clearTimeout(this.connectTimeoutTimer_),this.connectTimeoutTimer_=null)}onClosed_(){this.isClosed_||(this.log_("Longpoll is closing itself"),this.shutdown_(),this.onDisconnect_&&(this.onDisconnect_(this.everConnected_),this.onDisconnect_=null))}close(){this.isClosed_||(this.log_("Longpoll is being closed."),this.shutdown_())}send(e){const t=Ae(e);this.bytesSent+=t.length,this.stats_.incrementCounter("bytes_sent",t.length);const s=Lc(t),i=Od(s,v_);for(let r=0;r<i.length;r++)this.scriptTagHolder.enqueueSegment(this.curSegmentNum,i.length,i[r]),this.curSegmentNum++}addDisconnectPingFrame(e,t){this.myDisconnFrame=document.createElement("iframe");const s={};s[y_]="t",s[zd]=e,s[Gd]=t,this.myDisconnFrame.src=this.urlFn(s),this.myDisconnFrame.style.display="none",document.body.appendChild(this.myDisconnFrame)}incrementIncomingBytes_(e){const t=Ae(e).length;this.bytesReceived+=t,this.stats_.incrementCounter("bytes_received",t)}}class na{constructor(e,t,s,i){this.onDisconnect=s,this.urlFn=i,this.outstandingRequests=new Set,this.pendingSegs=[],this.currentSerial=Math.floor(Math.random()*1e8),this.sendNewPolls=!0;{this.uniqueCallbackIdentifier=Gg(),window[h_+this.uniqueCallbackIdentifier]=e,window[f_+this.uniqueCallbackIdentifier]=t,this.myIFrame=na.createIFrame_();let r="";this.myIFrame.src&&this.myIFrame.src.substr(0,11)==="javascript:"&&(r='<script>document.domain="'+document.domain+'";<\/script>');const o="<html><body>"+r+"</body></html>";try{this.myIFrame.doc.open(),this.myIFrame.doc.write(o),this.myIFrame.doc.close()}catch(a){Ne("frame writing exception"),a.stack&&Ne(a.stack),Ne(a)}}}static createIFrame_(){const e=document.createElement("iframe");if(e.style.display="none",document.body){document.body.appendChild(e);try{e.contentWindow.document||Ne("No IE domain setting required")}catch{const s=document.domain;e.src="javascript:void((function(){document.open();document.domain='"+s+"';document.close();})())"}}else throw"Document body has not initialized. Wait to initialize Firebase until after the document is ready.";return e.contentDocument?e.doc=e.contentDocument:e.contentWindow?e.doc=e.contentWindow.document:e.document&&(e.doc=e.document),e}close(){this.alive=!1,this.myIFrame&&(this.myIFrame.doc.body.textContent="",setTimeout(()=>{this.myIFrame!==null&&(document.body.removeChild(this.myIFrame),this.myIFrame=null)},Math.floor(0)));const e=this.onDisconnect;e&&(this.onDisconnect=null,e())}startLongPoll(e,t){for(this.myID=e,this.myPW=t,this.alive=!0;this.newRequest_(););}newRequest_(){if(this.alive&&this.sendNewPolls&&this.outstandingRequests.size<(this.pendingSegs.length>0?2:1)){this.currentSerial++;const e={};e[zd]=this.myID,e[Gd]=this.myPW,e[Yd]=this.currentSerial;let t=this.urlFn(e),s="",i=0;for(;this.pendingSegs.length>0&&this.pendingSegs[0].d.length+Qd+s.length<=Kd;){const o=this.pendingSegs.shift();s=s+"&"+m_+i+"="+o.seg+"&"+g_+i+"="+o.ts+"&"+__+i+"="+o.d,i++}return t=t+s,this.addLongPollTag_(t,this.currentSerial),!0}else return!1}enqueueSegment(e,t,s){this.pendingSegs.push({seg:e,ts:t,d:s}),this.alive&&this.newRequest_()}addLongPollTag_(e,t){this.outstandingRequests.add(t);const s=()=>{this.outstandingRequests.delete(t),this.newRequest_()},i=setTimeout(s,Math.floor(b_)),r=()=>{clearTimeout(i),s()};this.addTag(e,r)}addTag(e,t){setTimeout(()=>{try{if(!this.sendNewPolls)return;const s=this.myIFrame.doc.createElement("script");s.type="text/javascript",s.async=!0,s.src=e,s.onload=s.onreadystatechange=function(){const i=s.readyState;(!i||i==="loaded"||i==="complete")&&(s.onload=s.onreadystatechange=null,s.parentNode&&s.parentNode.removeChild(s),t())},s.onerror=()=>{Ne("Long-poll script failed to load: "+e),this.sendNewPolls=!1,this.close()},this.myIFrame.doc.body.appendChild(s)}catch{}},Math.floor(1))}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const E_=16384,C_=45e3;let Vi=null;typeof MozWebSocket<"u"?Vi=MozWebSocket:typeof WebSocket<"u"&&(Vi=WebSocket);class at{constructor(e,t,s,i,r,o,a){this.connId=e,this.applicationId=s,this.appCheckToken=i,this.authToken=r,this.keepaliveTimer=null,this.frames=null,this.totalFrames=0,this.bytesSent=0,this.bytesReceived=0,this.log_=oi(this.connId),this.stats_=ta(t),this.connURL=at.connectionURL_(t,o,a,i,s),this.nodeAdmin=t.nodeAdmin}static connectionURL_(e,t,s,i,r){const o={};return o[Dd]=ea,typeof location<"u"&&location.hostname&&Ud.test(location.hostname)&&(o[Fd]=$d),t&&(o[Ld]=t),s&&(o[Wd]=s),i&&(o[uo]=i),r&&(o[Bd]=r),qd(e,Hd,o)}open(e,t){this.onDisconnect=t,this.onMessage=e,this.log_("Websocket connecting to "+this.connURL),this.everConnected_=!1,mn.set("previous_websocket_failure",!0);try{let s;sf(),this.mySock=new Vi(this.connURL,[],s)}catch(s){this.log_("Error instantiating WebSocket.");const i=s.message||s.data;i&&this.log_(i),this.onClosed_();return}this.mySock.onopen=()=>{this.log_("Websocket connected."),this.everConnected_=!0},this.mySock.onclose=()=>{this.log_("Websocket connection was disconnected."),this.mySock=null,this.onClosed_()},this.mySock.onmessage=s=>{this.handleIncomingFrame(s)},this.mySock.onerror=s=>{this.log_("WebSocket error.  Closing connection.");const i=s.message||s.data;i&&this.log_(i),this.onClosed_()}}start(){}static forceDisallow(){at.forceDisallow_=!0}static isAvailable(){let e=!1;if(typeof navigator<"u"&&navigator.userAgent){const t=/Android ([0-9]{0,}\.[0-9]{0,})/,s=navigator.userAgent.match(t);s&&s.length>1&&parseFloat(s[1])<4.4&&(e=!0)}return!e&&Vi!==null&&!at.forceDisallow_}static previouslyFailed(){return mn.isInMemoryStorage||mn.get("previous_websocket_failure")===!0}markConnectionHealthy(){mn.remove("previous_websocket_failure")}appendFrame_(e){if(this.frames.push(e),this.frames.length===this.totalFrames){const t=this.frames.join("");this.frames=null;const s=$s(t);this.onMessage(s)}}handleNewFrameCount_(e){this.totalFrames=e,this.frames=[]}extractFrameCount_(e){if(R(this.frames===null,"We already have a frame buffer"),e.length<=6){const t=Number(e);if(!isNaN(t))return this.handleNewFrameCount_(t),null}return this.handleNewFrameCount_(1),e}handleIncomingFrame(e){if(this.mySock===null)return;const t=e.data;if(this.bytesReceived+=t.length,this.stats_.incrementCounter("bytes_received",t.length),this.resetKeepAlive(),this.frames!==null)this.appendFrame_(t);else{const s=this.extractFrameCount_(t);s!==null&&this.appendFrame_(s)}}send(e){this.resetKeepAlive();const t=Ae(e);this.bytesSent+=t.length,this.stats_.incrementCounter("bytes_sent",t.length);const s=Od(t,E_);s.length>1&&this.sendString_(String(s.length));for(let i=0;i<s.length;i++)this.sendString_(s[i])}shutdown_(){this.isClosed_=!0,this.keepaliveTimer&&(clearInterval(this.keepaliveTimer),this.keepaliveTimer=null),this.mySock&&(this.mySock.close(),this.mySock=null)}onClosed_(){this.isClosed_||(this.log_("WebSocket is closing itself"),this.shutdown_(),this.onDisconnect&&(this.onDisconnect(this.everConnected_),this.onDisconnect=null))}close(){this.isClosed_||(this.log_("WebSocket is being closed"),this.shutdown_())}resetKeepAlive(){clearInterval(this.keepaliveTimer),this.keepaliveTimer=setInterval(()=>{this.mySock&&this.sendString_("0"),this.resetKeepAlive()},Math.floor(C_))}sendString_(e){try{this.mySock.send(e)}catch(t){this.log_("Exception thrown from WebSocket.send():",t.message||t.data,"Closing connection."),setTimeout(this.onClosed_.bind(this),0)}}}at.responsesRequiredToBeHealthy=2;at.healthyTimeout=3e4;/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Bs{constructor(e){this.initTransports_(e)}static get ALL_TRANSPORTS(){return[Wn,at]}static get IS_TRANSPORT_INITIALIZED(){return this.globalTransportInitialized_}initTransports_(e){const t=at&&at.isAvailable();let s=t&&!at.previouslyFailed();if(e.webSocketOnly&&(t||je("wss:// URL used, but browser isn't known to support websockets.  Trying anyway."),s=!0),s)this.transports_=[at];else{const i=this.transports_=[];for(const r of Bs.ALL_TRANSPORTS)r&&r.isAvailable()&&i.push(r);Bs.globalTransportInitialized_=!0}}initialTransport(){if(this.transports_.length>0)return this.transports_[0];throw new Error("No transports available")}upgradeTransport(){return this.transports_.length>1?this.transports_[1]:null}}Bs.globalTransportInitialized_=!1;/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const I_=6e4,S_=5e3,T_=10*1024,k_=100*1024,Hr="t",Ul="d",x_="s",Wl="r",A_="e",Bl="o",Hl="a",jl="n",Vl="p",R_="h";class P_{constructor(e,t,s,i,r,o,a,c,d,h){this.id=e,this.repoInfo_=t,this.applicationId_=s,this.appCheckToken_=i,this.authToken_=r,this.onMessage_=o,this.onReady_=a,this.onDisconnect_=c,this.onKill_=d,this.lastSessionId=h,this.connectionCount=0,this.pendingDataMessages=[],this.state_=0,this.log_=oi("c:"+this.id+":"),this.transportManager_=new Bs(t),this.log_("Connection created"),this.start_()}start_(){const e=this.transportManager_.initialTransport();this.conn_=new e(this.nextTransportId_(),this.repoInfo_,this.applicationId_,this.appCheckToken_,this.authToken_,null,this.lastSessionId),this.primaryResponsesRequired_=e.responsesRequiredToBeHealthy||0;const t=this.connReceiver_(this.conn_),s=this.disconnReceiver_(this.conn_);this.tx_=this.conn_,this.rx_=this.conn_,this.secondaryConn_=null,this.isHealthy_=!1,setTimeout(()=>{this.conn_&&this.conn_.open(t,s)},Math.floor(0));const i=e.healthyTimeout||0;i>0&&(this.healthyTimeout_=Rs(()=>{this.healthyTimeout_=null,this.isHealthy_||(this.conn_&&this.conn_.bytesReceived>k_?(this.log_("Connection exceeded healthy timeout but has received "+this.conn_.bytesReceived+" bytes.  Marking connection healthy."),this.isHealthy_=!0,this.conn_.markConnectionHealthy()):this.conn_&&this.conn_.bytesSent>T_?this.log_("Connection exceeded healthy timeout but has sent "+this.conn_.bytesSent+" bytes.  Leaving connection alive."):(this.log_("Closing unhealthy connection after timeout."),this.close()))},Math.floor(i)))}nextTransportId_(){return"c:"+this.id+":"+this.connectionCount++}disconnReceiver_(e){return t=>{e===this.conn_?this.onConnectionLost_(t):e===this.secondaryConn_?(this.log_("Secondary connection lost."),this.onSecondaryConnectionLost_()):this.log_("closing an old connection")}}connReceiver_(e){return t=>{this.state_!==2&&(e===this.rx_?this.onPrimaryMessageReceived_(t):e===this.secondaryConn_?this.onSecondaryMessageReceived_(t):this.log_("message on old connection"))}}sendRequest(e){const t={t:"d",d:e};this.sendData_(t)}tryCleanupConnection(){this.tx_===this.secondaryConn_&&this.rx_===this.secondaryConn_&&(this.log_("cleaning up and promoting a connection: "+this.secondaryConn_.connId),this.conn_=this.secondaryConn_,this.secondaryConn_=null)}onSecondaryControl_(e){if(Hr in e){const t=e[Hr];t===Hl?this.upgradeIfSecondaryHealthy_():t===Wl?(this.log_("Got a reset on secondary, closing it"),this.secondaryConn_.close(),(this.tx_===this.secondaryConn_||this.rx_===this.secondaryConn_)&&this.close()):t===Bl&&(this.log_("got pong on secondary."),this.secondaryResponsesRequired_--,this.upgradeIfSecondaryHealthy_())}}onSecondaryMessageReceived_(e){const t=ms("t",e),s=ms("d",e);if(t==="c")this.onSecondaryControl_(s);else if(t==="d")this.pendingDataMessages.push(s);else throw new Error("Unknown protocol layer: "+t)}upgradeIfSecondaryHealthy_(){this.secondaryResponsesRequired_<=0?(this.log_("Secondary connection is healthy."),this.isHealthy_=!0,this.secondaryConn_.markConnectionHealthy(),this.proceedWithUpgrade_()):(this.log_("sending ping on secondary."),this.secondaryConn_.send({t:"c",d:{t:Vl,d:{}}}))}proceedWithUpgrade_(){this.secondaryConn_.start(),this.log_("sending client ack on secondary"),this.secondaryConn_.send({t:"c",d:{t:Hl,d:{}}}),this.log_("Ending transmission on primary"),this.conn_.send({t:"c",d:{t:jl,d:{}}}),this.tx_=this.secondaryConn_,this.tryCleanupConnection()}onPrimaryMessageReceived_(e){const t=ms("t",e),s=ms("d",e);t==="c"?this.onControl_(s):t==="d"&&this.onDataMessage_(s)}onDataMessage_(e){this.onPrimaryResponse_(),this.onMessage_(e)}onPrimaryResponse_(){this.isHealthy_||(this.primaryResponsesRequired_--,this.primaryResponsesRequired_<=0&&(this.log_("Primary connection is healthy."),this.isHealthy_=!0,this.conn_.markConnectionHealthy()))}onControl_(e){const t=ms(Hr,e);if(Ul in e){const s=e[Ul];if(t===R_){const i=Object.assign({},s);this.repoInfo_.isUsingEmulator&&(i.h=this.repoInfo_.host),this.onHandshake_(i)}else if(t===jl){this.log_("recvd end transmission on primary"),this.rx_=this.secondaryConn_;for(let i=0;i<this.pendingDataMessages.length;++i)this.onDataMessage_(this.pendingDataMessages[i]);this.pendingDataMessages=[],this.tryCleanupConnection()}else t===x_?this.onConnectionShutdown_(s):t===Wl?this.onReset_(s):t===A_?co("Server Error: "+s):t===Bl?(this.log_("got pong on primary."),this.onPrimaryResponse_(),this.sendPingOnPrimaryIfNecessary_()):co("Unknown control packet command: "+t)}}onHandshake_(e){const t=e.ts,s=e.v,i=e.h;this.sessionId=e.s,this.repoInfo_.host=i,this.state_===0&&(this.conn_.start(),this.onConnectionEstablished_(this.conn_,t),ea!==s&&je("Protocol version mismatch detected"),this.tryStartUpgrade_())}tryStartUpgrade_(){const e=this.transportManager_.upgradeTransport();e&&this.startUpgrade_(e)}startUpgrade_(e){this.secondaryConn_=new e(this.nextTransportId_(),this.repoInfo_,this.applicationId_,this.appCheckToken_,this.authToken_,this.sessionId),this.secondaryResponsesRequired_=e.responsesRequiredToBeHealthy||0;const t=this.connReceiver_(this.secondaryConn_),s=this.disconnReceiver_(this.secondaryConn_);this.secondaryConn_.open(t,s),Rs(()=>{this.secondaryConn_&&(this.log_("Timed out trying to upgrade."),this.secondaryConn_.close())},Math.floor(I_))}onReset_(e){this.log_("Reset packet received.  New host: "+e),this.repoInfo_.host=e,this.state_===1?this.close():(this.closeConnections_(),this.start_())}onConnectionEstablished_(e,t){this.log_("Realtime connection established."),this.conn_=e,this.state_=1,this.onReady_&&(this.onReady_(t,this.sessionId),this.onReady_=null),this.primaryResponsesRequired_===0?(this.log_("Primary connection is healthy."),this.isHealthy_=!0):Rs(()=>{this.sendPingOnPrimaryIfNecessary_()},Math.floor(S_))}sendPingOnPrimaryIfNecessary_(){!this.isHealthy_&&this.state_===1&&(this.log_("sending ping on primary."),this.sendData_({t:"c",d:{t:Vl,d:{}}}))}onSecondaryConnectionLost_(){const e=this.secondaryConn_;this.secondaryConn_=null,(this.tx_===e||this.rx_===e)&&this.close()}onConnectionLost_(e){this.conn_=null,!e&&this.state_===0?(this.log_("Realtime connection failed."),this.repoInfo_.isCacheableHost()&&(mn.remove("host:"+this.repoInfo_.host),this.repoInfo_.internalHost=this.repoInfo_.host)):this.state_===1&&this.log_("Realtime connection lost."),this.close()}onConnectionShutdown_(e){this.log_("Connection shutdown command received. Shutting down..."),this.onKill_&&(this.onKill_(e),this.onKill_=null),this.onDisconnect_=null,this.close()}sendData_(e){if(this.state_!==1)throw"Connection is not connected";this.tx_.send(e)}close(){this.state_!==2&&(this.log_("Closing realtime connection."),this.state_=2,this.closeConnections_(),this.onDisconnect_&&(this.onDisconnect_(),this.onDisconnect_=null))}closeConnections_(){this.log_("Shutting down all connections"),this.conn_&&(this.conn_.close(),this.conn_=null),this.secondaryConn_&&(this.secondaryConn_.close(),this.secondaryConn_=null),this.healthyTimeout_&&(clearTimeout(this.healthyTimeout_),this.healthyTimeout_=null)}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Jd{put(e,t,s,i){}merge(e,t,s,i){}refreshAuthToken(e){}refreshAppCheckToken(e){}onDisconnectPut(e,t,s){}onDisconnectMerge(e,t,s){}onDisconnectCancel(e,t){}reportStats(e){}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Xd{constructor(e){this.allowedEvents_=e,this.listeners_={},R(Array.isArray(e)&&e.length>0,"Requires a non-empty array")}trigger(e,...t){if(Array.isArray(this.listeners_[e])){const s=[...this.listeners_[e]];for(let i=0;i<s.length;i++)s[i].callback.apply(s[i].context,t)}}on(e,t,s){this.validateEventType_(e),this.listeners_[e]=this.listeners_[e]||[],this.listeners_[e].push({callback:t,context:s});const i=this.getInitialEvent(e);i&&t.apply(s,i)}off(e,t,s){this.validateEventType_(e);const i=this.listeners_[e]||[];for(let r=0;r<i.length;r++)if(i[r].callback===t&&(!s||s===i[r].context)){i.splice(r,1);return}}validateEventType_(e){R(this.allowedEvents_.find(t=>t===e),"Unknown event: "+e)}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class qi extends Xd{constructor(){super(["online"]),this.online_=!0,typeof window<"u"&&typeof window.addEventListener<"u"&&!Wo()&&(window.addEventListener("online",()=>{this.online_||(this.online_=!0,this.trigger("online",!0))},!1),window.addEventListener("offline",()=>{this.online_&&(this.online_=!1,this.trigger("online",!1))},!1))}static getInstance(){return new qi}getInitialEvent(e){return R(e==="online","Unknown event type: "+e),[this.online_]}currentlyOnline(){return this.online_}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const ql=32,zl=768;class _e{constructor(e,t){if(t===void 0){this.pieces_=e.split("/");let s=0;for(let i=0;i<this.pieces_.length;i++)this.pieces_[i].length>0&&(this.pieces_[s]=this.pieces_[i],s++);this.pieces_.length=s,this.pieceNum_=0}else this.pieces_=e,this.pieceNum_=t}toString(){let e="";for(let t=this.pieceNum_;t<this.pieces_.length;t++)this.pieces_[t]!==""&&(e+="/"+this.pieces_[t]);return e||"/"}}function me(){return new _e("")}function te(n){return n.pieceNum_>=n.pieces_.length?null:n.pieces_[n.pieceNum_]}function tn(n){return n.pieces_.length-n.pieceNum_}function we(n){let e=n.pieceNum_;return e<n.pieces_.length&&e++,new _e(n.pieces_,e)}function sa(n){return n.pieceNum_<n.pieces_.length?n.pieces_[n.pieces_.length-1]:null}function N_(n){let e="";for(let t=n.pieceNum_;t<n.pieces_.length;t++)n.pieces_[t]!==""&&(e+="/"+encodeURIComponent(String(n.pieces_[t])));return e||"/"}function Hs(n,e=0){return n.pieces_.slice(n.pieceNum_+e)}function Zd(n){if(n.pieceNum_>=n.pieces_.length)return null;const e=[];for(let t=n.pieceNum_;t<n.pieces_.length-1;t++)e.push(n.pieces_[t]);return new _e(e,0)}function Te(n,e){const t=[];for(let s=n.pieceNum_;s<n.pieces_.length;s++)t.push(n.pieces_[s]);if(e instanceof _e)for(let s=e.pieceNum_;s<e.pieces_.length;s++)t.push(e.pieces_[s]);else{const s=e.split("/");for(let i=0;i<s.length;i++)s[i].length>0&&t.push(s[i])}return new _e(t,0)}function ne(n){return n.pieceNum_>=n.pieces_.length}function He(n,e){const t=te(n),s=te(e);if(t===null)return e;if(t===s)return He(we(n),we(e));throw new Error("INTERNAL ERROR: innerPath ("+e+") is not within outerPath ("+n+")")}function O_(n,e){const t=Hs(n,0),s=Hs(e,0);for(let i=0;i<t.length&&i<s.length;i++){const r=Rn(t[i],s[i]);if(r!==0)return r}return t.length===s.length?0:t.length<s.length?-1:1}function ia(n,e){if(tn(n)!==tn(e))return!1;for(let t=n.pieceNum_,s=e.pieceNum_;t<=n.pieces_.length;t++,s++)if(n.pieces_[t]!==e.pieces_[s])return!1;return!0}function tt(n,e){let t=n.pieceNum_,s=e.pieceNum_;if(tn(n)>tn(e))return!1;for(;t<n.pieces_.length;){if(n.pieces_[t]!==e.pieces_[s])return!1;++t,++s}return!0}class M_{constructor(e,t){this.errorPrefix_=t,this.parts_=Hs(e,0),this.byteLength_=Math.max(1,this.parts_.length);for(let s=0;s<this.parts_.length;s++)this.byteLength_+=ar(this.parts_[s]);eu(this)}}function D_(n,e){n.parts_.length>0&&(n.byteLength_+=1),n.parts_.push(e),n.byteLength_+=ar(e),eu(n)}function L_(n){const e=n.parts_.pop();n.byteLength_-=ar(e),n.parts_.length>0&&(n.byteLength_-=1)}function eu(n){if(n.byteLength_>zl)throw new Error(n.errorPrefix_+"has a key path longer than "+zl+" bytes ("+n.byteLength_+").");if(n.parts_.length>ql)throw new Error(n.errorPrefix_+"path specified exceeds the maximum depth that can be written ("+ql+") or object contains a cycle "+pn(n))}function pn(n){return n.parts_.length===0?"":"in property '"+n.parts_.join(".")+"'"}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class ra extends Xd{constructor(){super(["visible"]);let e,t;typeof document<"u"&&typeof document.addEventListener<"u"&&(typeof document.hidden<"u"?(t="visibilitychange",e="hidden"):typeof document.mozHidden<"u"?(t="mozvisibilitychange",e="mozHidden"):typeof document.msHidden<"u"?(t="msvisibilitychange",e="msHidden"):typeof document.webkitHidden<"u"&&(t="webkitvisibilitychange",e="webkitHidden")),this.visible_=!0,t&&document.addEventListener(t,()=>{const s=!document[e];s!==this.visible_&&(this.visible_=s,this.trigger("visible",s))},!1)}static getInstance(){return new ra}getInitialEvent(e){return R(e==="visible","Unknown event type: "+e),[this.visible_]}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const gs=1e3,F_=60*5*1e3,Gl=30*1e3,$_=1.3,U_=3e4,W_="server_kill",Yl=3;class Nt extends Jd{constructor(e,t,s,i,r,o,a,c){if(super(),this.repoInfo_=e,this.applicationId_=t,this.onDataUpdate_=s,this.onConnectStatus_=i,this.onServerInfoUpdate_=r,this.authTokenProvider_=o,this.appCheckTokenProvider_=a,this.authOverride_=c,this.id=Nt.nextPersistentConnectionId_++,this.log_=oi("p:"+this.id+":"),this.interruptReasons_={},this.listens=new Map,this.outstandingPuts_=[],this.outstandingGets_=[],this.outstandingPutCount_=0,this.outstandingGetCount_=0,this.onDisconnectRequestQueue_=[],this.connected_=!1,this.reconnectDelay_=gs,this.maxReconnectDelay_=F_,this.securityDebugCallback_=null,this.lastSessionId=null,this.establishConnectionTimer_=null,this.visible_=!1,this.requestCBHash_={},this.requestNumber_=0,this.realtime_=null,this.authToken_=null,this.appCheckToken_=null,this.forceTokenRefresh_=!1,this.invalidAuthTokenCount_=0,this.invalidAppCheckTokenCount_=0,this.firstConnection_=!0,this.lastConnectionAttemptTime_=null,this.lastConnectionEstablishedTime_=null,c)throw new Error("Auth override specified in options, but not supported on non Node.js platforms");ra.getInstance().on("visible",this.onVisible_,this),e.host.indexOf("fblocal")===-1&&qi.getInstance().on("online",this.onOnline_,this)}sendRequest(e,t,s){const i=++this.requestNumber_,r={r:i,a:e,b:t};this.log_(Ae(r)),R(this.connected_,"sendRequest call when we're not connected not allowed."),this.realtime_.sendRequest(r),s&&(this.requestCBHash_[i]=s)}get(e){this.initConnection_();const t=new mt,i={action:"g",request:{p:e._path.toString(),q:e._queryObject},onComplete:o=>{const a=o.d;o.s==="ok"?t.resolve(a):t.reject(a)}};this.outstandingGets_.push(i),this.outstandingGetCount_++;const r=this.outstandingGets_.length-1;return this.connected_&&this.sendGet_(r),t.promise}listen(e,t,s,i){this.initConnection_();const r=e._queryIdentifier,o=e._path.toString();this.log_("Listen called for "+o+" "+r),this.listens.has(o)||this.listens.set(o,new Map),R(e._queryParams.isDefault()||!e._queryParams.loadsAllData(),"listen() called for non-default but complete query"),R(!this.listens.get(o).has(r),"listen() called twice for same path/queryId.");const a={onComplete:i,hashFn:t,query:e,tag:s};this.listens.get(o).set(r,a),this.connected_&&this.sendListen_(a)}sendGet_(e){const t=this.outstandingGets_[e];this.sendRequest("g",t.request,s=>{delete this.outstandingGets_[e],this.outstandingGetCount_--,this.outstandingGetCount_===0&&(this.outstandingGets_=[]),t.onComplete&&t.onComplete(s)})}sendListen_(e){const t=e.query,s=t._path.toString(),i=t._queryIdentifier;this.log_("Listen on "+s+" for "+i);const r={p:s},o="q";e.tag&&(r.q=t._queryObject,r.t=e.tag),r.h=e.hashFn(),this.sendRequest(o,r,a=>{const c=a.d,d=a.s;Nt.warnOnListenWarnings_(c,t),(this.listens.get(s)&&this.listens.get(s).get(i))===e&&(this.log_("listen response",a),d!=="ok"&&this.removeListen_(s,i),e.onComplete&&e.onComplete(d,c))})}static warnOnListenWarnings_(e,t){if(e&&typeof e=="object"&&bt(e,"w")){const s=Yn(e,"w");if(Array.isArray(s)&&~s.indexOf("no_index")){const i='".indexOn": "'+t._queryParams.getIndex().toString()+'"',r=t._path.toString();je(`Using an unspecified index. Your data will be downloaded and filtered on the client. Consider adding ${i} at ${r} to your security rules for better performance.`)}}}refreshAuthToken(e){this.authToken_=e,this.log_("Auth token refreshed"),this.authToken_?this.tryAuth():this.connected_&&this.sendRequest("unauth",{},()=>{}),this.reduceReconnectDelayIfAdminCredential_(e)}reduceReconnectDelayIfAdminCredential_(e){(e&&e.length===40||uf(e))&&(this.log_("Admin auth credential detected.  Reducing max reconnect time."),this.maxReconnectDelay_=Gl)}refreshAppCheckToken(e){this.appCheckToken_=e,this.log_("App check token refreshed"),this.appCheckToken_?this.tryAppCheck():this.connected_&&this.sendRequest("unappeck",{},()=>{})}tryAuth(){if(this.connected_&&this.authToken_){const e=this.authToken_,t=df(e)?"auth":"gauth",s={cred:e};this.authOverride_===null?s.noauth=!0:typeof this.authOverride_=="object"&&(s.authvar=this.authOverride_),this.sendRequest(t,s,i=>{const r=i.s,o=i.d||"error";this.authToken_===e&&(r==="ok"?this.invalidAuthTokenCount_=0:this.onAuthRevoked_(r,o))})}}tryAppCheck(){this.connected_&&this.appCheckToken_&&this.sendRequest("appcheck",{token:this.appCheckToken_},e=>{const t=e.s,s=e.d||"error";t==="ok"?this.invalidAppCheckTokenCount_=0:this.onAppCheckRevoked_(t,s)})}unlisten(e,t){const s=e._path.toString(),i=e._queryIdentifier;this.log_("Unlisten called for "+s+" "+i),R(e._queryParams.isDefault()||!e._queryParams.loadsAllData(),"unlisten() called for non-default but complete query"),this.removeListen_(s,i)&&this.connected_&&this.sendUnlisten_(s,i,e._queryObject,t)}sendUnlisten_(e,t,s,i){this.log_("Unlisten on "+e+" for "+t);const r={p:e},o="n";i&&(r.q=s,r.t=i),this.sendRequest(o,r)}onDisconnectPut(e,t,s){this.initConnection_(),this.connected_?this.sendOnDisconnect_("o",e,t,s):this.onDisconnectRequestQueue_.push({pathString:e,action:"o",data:t,onComplete:s})}onDisconnectMerge(e,t,s){this.initConnection_(),this.connected_?this.sendOnDisconnect_("om",e,t,s):this.onDisconnectRequestQueue_.push({pathString:e,action:"om",data:t,onComplete:s})}onDisconnectCancel(e,t){this.initConnection_(),this.connected_?this.sendOnDisconnect_("oc",e,null,t):this.onDisconnectRequestQueue_.push({pathString:e,action:"oc",data:null,onComplete:t})}sendOnDisconnect_(e,t,s,i){const r={p:t,d:s};this.log_("onDisconnect "+e,r),this.sendRequest(e,r,o=>{i&&setTimeout(()=>{i(o.s,o.d)},Math.floor(0))})}put(e,t,s,i){this.putInternal("p",e,t,s,i)}merge(e,t,s,i){this.putInternal("m",e,t,s,i)}putInternal(e,t,s,i,r){this.initConnection_();const o={p:t,d:s};r!==void 0&&(o.h=r),this.outstandingPuts_.push({action:e,request:o,onComplete:i}),this.outstandingPutCount_++;const a=this.outstandingPuts_.length-1;this.connected_?this.sendPut_(a):this.log_("Buffering put: "+t)}sendPut_(e){const t=this.outstandingPuts_[e].action,s=this.outstandingPuts_[e].request,i=this.outstandingPuts_[e].onComplete;this.outstandingPuts_[e].queued=this.connected_,this.sendRequest(t,s,r=>{this.log_(t+" response",r),delete this.outstandingPuts_[e],this.outstandingPutCount_--,this.outstandingPutCount_===0&&(this.outstandingPuts_=[]),i&&i(r.s,r.d)})}reportStats(e){if(this.connected_){const t={c:e};this.log_("reportStats",t),this.sendRequest("s",t,s=>{if(s.s!=="ok"){const r=s.d;this.log_("reportStats","Error sending stats: "+r)}})}}onDataMessage_(e){if("r"in e){this.log_("from server: "+Ae(e));const t=e.r,s=this.requestCBHash_[t];s&&(delete this.requestCBHash_[t],s(e.b))}else{if("error"in e)throw"A server-side error has occurred: "+e.error;"a"in e&&this.onDataPush_(e.a,e.b)}}onDataPush_(e,t){this.log_("handleServerMessage",e,t),e==="d"?this.onDataUpdate_(t.p,t.d,!1,t.t):e==="m"?this.onDataUpdate_(t.p,t.d,!0,t.t):e==="c"?this.onListenRevoked_(t.p,t.q):e==="ac"?this.onAuthRevoked_(t.s,t.d):e==="apc"?this.onAppCheckRevoked_(t.s,t.d):e==="sd"?this.onSecurityDebugPacket_(t):co("Unrecognized action received from server: "+Ae(e)+`
Are you using the latest client?`)}onReady_(e,t){this.log_("connection ready"),this.connected_=!0,this.lastConnectionEstablishedTime_=new Date().getTime(),this.handleTimestamp_(e),this.lastSessionId=t,this.firstConnection_&&this.sendConnectStats_(),this.restoreState_(),this.firstConnection_=!1,this.onConnectStatus_(!0)}scheduleConnect_(e){R(!this.realtime_,"Scheduling a connect when we're already connected/ing?"),this.establishConnectionTimer_&&clearTimeout(this.establishConnectionTimer_),this.establishConnectionTimer_=setTimeout(()=>{this.establishConnectionTimer_=null,this.establishConnection_()},Math.floor(e))}initConnection_(){!this.realtime_&&this.firstConnection_&&this.scheduleConnect_(0)}onVisible_(e){e&&!this.visible_&&this.reconnectDelay_===this.maxReconnectDelay_&&(this.log_("Window became visible.  Reducing delay."),this.reconnectDelay_=gs,this.realtime_||this.scheduleConnect_(0)),this.visible_=e}onOnline_(e){e?(this.log_("Browser went online."),this.reconnectDelay_=gs,this.realtime_||this.scheduleConnect_(0)):(this.log_("Browser went offline.  Killing connection."),this.realtime_&&this.realtime_.close())}onRealtimeDisconnect_(){if(this.log_("data client disconnected"),this.connected_=!1,this.realtime_=null,this.cancelSentTransactions_(),this.requestCBHash_={},this.shouldReconnect_()){this.visible_?this.lastConnectionEstablishedTime_&&(new Date().getTime()-this.lastConnectionEstablishedTime_>U_&&(this.reconnectDelay_=gs),this.lastConnectionEstablishedTime_=null):(this.log_("Window isn't visible.  Delaying reconnect."),this.reconnectDelay_=this.maxReconnectDelay_,this.lastConnectionAttemptTime_=new Date().getTime());const e=new Date().getTime()-this.lastConnectionAttemptTime_;let t=Math.max(0,this.reconnectDelay_-e);t=Math.random()*t,this.log_("Trying to reconnect in "+t+"ms"),this.scheduleConnect_(t),this.reconnectDelay_=Math.min(this.maxReconnectDelay_,this.reconnectDelay_*$_)}this.onConnectStatus_(!1)}async establishConnection_(){if(this.shouldReconnect_()){this.log_("Making a connection attempt"),this.lastConnectionAttemptTime_=new Date().getTime(),this.lastConnectionEstablishedTime_=null;const e=this.onDataMessage_.bind(this),t=this.onReady_.bind(this),s=this.onRealtimeDisconnect_.bind(this),i=this.id+":"+Nt.nextConnectionId_++,r=this.lastSessionId;let o=!1,a=null;const c=function(){a?a.close():(o=!0,s())},d=function(f){R(a,"sendRequest call when we're not connected not allowed."),a.sendRequest(f)};this.realtime_={close:c,sendRequest:d};const h=this.forceTokenRefresh_;this.forceTokenRefresh_=!1;try{const[f,_]=await Promise.all([this.authTokenProvider_.getToken(h),this.appCheckTokenProvider_.getToken(h)]);o?Ne("getToken() completed but was canceled"):(Ne("getToken() completed. Creating connection."),this.authToken_=f&&f.accessToken,this.appCheckToken_=_&&_.token,a=new P_(i,this.repoInfo_,this.applicationId_,this.appCheckToken_,this.authToken_,e,t,s,p=>{je(p+" ("+this.repoInfo_.toString()+")"),this.interrupt(W_)},r))}catch(f){this.log_("Failed to get token: "+f),o||(this.repoInfo_.nodeAdmin&&je(f),c())}}}interrupt(e){Ne("Interrupting connection for reason: "+e),this.interruptReasons_[e]=!0,this.realtime_?this.realtime_.close():(this.establishConnectionTimer_&&(clearTimeout(this.establishConnectionTimer_),this.establishConnectionTimer_=null),this.connected_&&this.onRealtimeDisconnect_())}resume(e){Ne("Resuming connection for reason: "+e),delete this.interruptReasons_[e],Di(this.interruptReasons_)&&(this.reconnectDelay_=gs,this.realtime_||this.scheduleConnect_(0))}handleTimestamp_(e){const t=e-new Date().getTime();this.onServerInfoUpdate_({serverTimeOffset:t})}cancelSentTransactions_(){for(let e=0;e<this.outstandingPuts_.length;e++){const t=this.outstandingPuts_[e];t&&"h"in t.request&&t.queued&&(t.onComplete&&t.onComplete("disconnect"),delete this.outstandingPuts_[e],this.outstandingPutCount_--)}this.outstandingPutCount_===0&&(this.outstandingPuts_=[])}onListenRevoked_(e,t){let s;t?s=t.map(r=>Zo(r)).join("$"):s="default";const i=this.removeListen_(e,s);i&&i.onComplete&&i.onComplete("permission_denied")}removeListen_(e,t){const s=new _e(e).toString();let i;if(this.listens.has(s)){const r=this.listens.get(s);i=r.get(t),r.delete(t),r.size===0&&this.listens.delete(s)}else i=void 0;return i}onAuthRevoked_(e,t){Ne("Auth token revoked: "+e+"/"+t),this.authToken_=null,this.forceTokenRefresh_=!0,this.realtime_.close(),(e==="invalid_token"||e==="permission_denied")&&(this.invalidAuthTokenCount_++,this.invalidAuthTokenCount_>=Yl&&(this.reconnectDelay_=Gl,this.authTokenProvider_.notifyForInvalidToken()))}onAppCheckRevoked_(e,t){Ne("App check token revoked: "+e+"/"+t),this.appCheckToken_=null,this.forceTokenRefresh_=!0,(e==="invalid_token"||e==="permission_denied")&&(this.invalidAppCheckTokenCount_++,this.invalidAppCheckTokenCount_>=Yl&&this.appCheckTokenProvider_.notifyForInvalidToken())}onSecurityDebugPacket_(e){this.securityDebugCallback_?this.securityDebugCallback_(e):"msg"in e&&console.log("FIREBASE: "+e.msg.replace(`
`,`
FIREBASE: `))}restoreState_(){this.tryAuth(),this.tryAppCheck();for(const e of this.listens.values())for(const t of e.values())this.sendListen_(t);for(let e=0;e<this.outstandingPuts_.length;e++)this.outstandingPuts_[e]&&this.sendPut_(e);for(;this.onDisconnectRequestQueue_.length;){const e=this.onDisconnectRequestQueue_.shift();this.sendOnDisconnect_(e.action,e.pathString,e.data,e.onComplete)}for(let e=0;e<this.outstandingGets_.length;e++)this.outstandingGets_[e]&&this.sendGet_(e)}sendConnectStats_(){const e={};let t="js";e["sdk."+t+"."+Rd.replace(/\./g,"-")]=1,Wo()?e["framework.cordova"]=1:Bc()&&(e["framework.reactnative"]=1),this.reportStats(e)}shouldReconnect_(){const e=qi.getInstance().currentlyOnline();return Di(this.interruptReasons_)&&e}}Nt.nextPersistentConnectionId_=0;Nt.nextConnectionId_=0;/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class oe{constructor(e,t){this.name=e,this.node=t}static Wrap(e,t){return new oe(e,t)}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class hr{getCompare(){return this.compare.bind(this)}indexedValueChanged(e,t){const s=new oe(En,e),i=new oe(En,t);return this.compare(s,i)!==0}minPost(){return oe.MIN}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */let wi;class tu extends hr{static get __EMPTY_NODE(){return wi}static set __EMPTY_NODE(e){wi=e}compare(e,t){return Rn(e.name,t.name)}isDefinedOn(e){throw os("KeyIndex.isDefinedOn not expected to be called.")}indexedValueChanged(e,t){return!1}minPost(){return oe.MIN}maxPost(){return new oe(en,wi)}makePost(e,t){return R(typeof e=="string","KeyIndex indexValue must always be a string."),new oe(e,wi)}toString(){return".key"}}const yn=new tu;/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Ei{constructor(e,t,s,i,r=null){this.isReverse_=i,this.resultGenerator_=r,this.nodeStack_=[];let o=1;for(;!e.isEmpty();)if(e=e,o=t?s(e.key,t):1,i&&(o*=-1),o<0)this.isReverse_?e=e.left:e=e.right;else if(o===0){this.nodeStack_.push(e);break}else this.nodeStack_.push(e),this.isReverse_?e=e.right:e=e.left}getNext(){if(this.nodeStack_.length===0)return null;let e=this.nodeStack_.pop(),t;if(this.resultGenerator_?t=this.resultGenerator_(e.key,e.value):t={key:e.key,value:e.value},this.isReverse_)for(e=e.left;!e.isEmpty();)this.nodeStack_.push(e),e=e.right;else for(e=e.right;!e.isEmpty();)this.nodeStack_.push(e),e=e.left;return t}hasNext(){return this.nodeStack_.length>0}peek(){if(this.nodeStack_.length===0)return null;const e=this.nodeStack_[this.nodeStack_.length-1];return this.resultGenerator_?this.resultGenerator_(e.key,e.value):{key:e.key,value:e.value}}}class Pe{constructor(e,t,s,i,r){this.key=e,this.value=t,this.color=s??Pe.RED,this.left=i??Ge.EMPTY_NODE,this.right=r??Ge.EMPTY_NODE}copy(e,t,s,i,r){return new Pe(e??this.key,t??this.value,s??this.color,i??this.left,r??this.right)}count(){return this.left.count()+1+this.right.count()}isEmpty(){return!1}inorderTraversal(e){return this.left.inorderTraversal(e)||!!e(this.key,this.value)||this.right.inorderTraversal(e)}reverseTraversal(e){return this.right.reverseTraversal(e)||e(this.key,this.value)||this.left.reverseTraversal(e)}min_(){return this.left.isEmpty()?this:this.left.min_()}minKey(){return this.min_().key}maxKey(){return this.right.isEmpty()?this.key:this.right.maxKey()}insert(e,t,s){let i=this;const r=s(e,i.key);return r<0?i=i.copy(null,null,null,i.left.insert(e,t,s),null):r===0?i=i.copy(null,t,null,null,null):i=i.copy(null,null,null,null,i.right.insert(e,t,s)),i.fixUp_()}removeMin_(){if(this.left.isEmpty())return Ge.EMPTY_NODE;let e=this;return!e.left.isRed_()&&!e.left.left.isRed_()&&(e=e.moveRedLeft_()),e=e.copy(null,null,null,e.left.removeMin_(),null),e.fixUp_()}remove(e,t){let s,i;if(s=this,t(e,s.key)<0)!s.left.isEmpty()&&!s.left.isRed_()&&!s.left.left.isRed_()&&(s=s.moveRedLeft_()),s=s.copy(null,null,null,s.left.remove(e,t),null);else{if(s.left.isRed_()&&(s=s.rotateRight_()),!s.right.isEmpty()&&!s.right.isRed_()&&!s.right.left.isRed_()&&(s=s.moveRedRight_()),t(e,s.key)===0){if(s.right.isEmpty())return Ge.EMPTY_NODE;i=s.right.min_(),s=s.copy(i.key,i.value,null,null,s.right.removeMin_())}s=s.copy(null,null,null,null,s.right.remove(e,t))}return s.fixUp_()}isRed_(){return this.color}fixUp_(){let e=this;return e.right.isRed_()&&!e.left.isRed_()&&(e=e.rotateLeft_()),e.left.isRed_()&&e.left.left.isRed_()&&(e=e.rotateRight_()),e.left.isRed_()&&e.right.isRed_()&&(e=e.colorFlip_()),e}moveRedLeft_(){let e=this.colorFlip_();return e.right.left.isRed_()&&(e=e.copy(null,null,null,null,e.right.rotateRight_()),e=e.rotateLeft_(),e=e.colorFlip_()),e}moveRedRight_(){let e=this.colorFlip_();return e.left.left.isRed_()&&(e=e.rotateRight_(),e=e.colorFlip_()),e}rotateLeft_(){const e=this.copy(null,null,Pe.RED,null,this.right.left);return this.right.copy(null,null,this.color,e,null)}rotateRight_(){const e=this.copy(null,null,Pe.RED,this.left.right,null);return this.left.copy(null,null,this.color,null,e)}colorFlip_(){const e=this.left.copy(null,null,!this.left.color,null,null),t=this.right.copy(null,null,!this.right.color,null,null);return this.copy(null,null,!this.color,e,t)}checkMaxDepth_(){const e=this.check_();return Math.pow(2,e)<=this.count()+1}check_(){if(this.isRed_()&&this.left.isRed_())throw new Error("Red node has red child("+this.key+","+this.value+")");if(this.right.isRed_())throw new Error("Right child of ("+this.key+","+this.value+") is red");const e=this.left.check_();if(e!==this.right.check_())throw new Error("Black depths differ");return e+(this.isRed_()?0:1)}}Pe.RED=!0;Pe.BLACK=!1;class B_{copy(e,t,s,i,r){return this}insert(e,t,s){return new Pe(e,t,null)}remove(e,t){return this}count(){return 0}isEmpty(){return!0}inorderTraversal(e){return!1}reverseTraversal(e){return!1}minKey(){return null}maxKey(){return null}check_(){return 0}isRed_(){return!1}}class Ge{constructor(e,t=Ge.EMPTY_NODE){this.comparator_=e,this.root_=t}insert(e,t){return new Ge(this.comparator_,this.root_.insert(e,t,this.comparator_).copy(null,null,Pe.BLACK,null,null))}remove(e){return new Ge(this.comparator_,this.root_.remove(e,this.comparator_).copy(null,null,Pe.BLACK,null,null))}get(e){let t,s=this.root_;for(;!s.isEmpty();){if(t=this.comparator_(e,s.key),t===0)return s.value;t<0?s=s.left:t>0&&(s=s.right)}return null}getPredecessorKey(e){let t,s=this.root_,i=null;for(;!s.isEmpty();)if(t=this.comparator_(e,s.key),t===0){if(s.left.isEmpty())return i?i.key:null;for(s=s.left;!s.right.isEmpty();)s=s.right;return s.key}else t<0?s=s.left:t>0&&(i=s,s=s.right);throw new Error("Attempted to find predecessor key for a nonexistent key.  What gives?")}isEmpty(){return this.root_.isEmpty()}count(){return this.root_.count()}minKey(){return this.root_.minKey()}maxKey(){return this.root_.maxKey()}inorderTraversal(e){return this.root_.inorderTraversal(e)}reverseTraversal(e){return this.root_.reverseTraversal(e)}getIterator(e){return new Ei(this.root_,null,this.comparator_,!1,e)}getIteratorFrom(e,t){return new Ei(this.root_,e,this.comparator_,!1,t)}getReverseIteratorFrom(e,t){return new Ei(this.root_,e,this.comparator_,!0,t)}getReverseIterator(e){return new Ei(this.root_,null,this.comparator_,!0,e)}}Ge.EMPTY_NODE=new B_;/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function H_(n,e){return Rn(n.name,e.name)}function oa(n,e){return Rn(n,e)}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */let ho;function j_(n){ho=n}const nu=function(n){return typeof n=="number"?"number:"+Md(n):"string:"+n},su=function(n){if(n.isLeafNode()){const e=n.val();R(typeof e=="string"||typeof e=="number"||typeof e=="object"&&bt(e,".sv"),"Priority must be a string or number.")}else R(n===ho||n.isEmpty(),"priority of unexpected type.");R(n===ho||n.getPriority().isEmpty(),"Priority nodes can't have a priority of their own.")};/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */let Kl;class Re{constructor(e,t=Re.__childrenNodeConstructor.EMPTY_NODE){this.value_=e,this.priorityNode_=t,this.lazyHash_=null,R(this.value_!==void 0&&this.value_!==null,"LeafNode shouldn't be created with null/undefined value."),su(this.priorityNode_)}static set __childrenNodeConstructor(e){Kl=e}static get __childrenNodeConstructor(){return Kl}isLeafNode(){return!0}getPriority(){return this.priorityNode_}updatePriority(e){return new Re(this.value_,e)}getImmediateChild(e){return e===".priority"?this.priorityNode_:Re.__childrenNodeConstructor.EMPTY_NODE}getChild(e){return ne(e)?this:te(e)===".priority"?this.priorityNode_:Re.__childrenNodeConstructor.EMPTY_NODE}hasChild(){return!1}getPredecessorChildName(e,t){return null}updateImmediateChild(e,t){return e===".priority"?this.updatePriority(t):t.isEmpty()&&e!==".priority"?this:Re.__childrenNodeConstructor.EMPTY_NODE.updateImmediateChild(e,t).updatePriority(this.priorityNode_)}updateChild(e,t){const s=te(e);return s===null?t:t.isEmpty()&&s!==".priority"?this:(R(s!==".priority"||tn(e)===1,".priority must be the last token in a path"),this.updateImmediateChild(s,Re.__childrenNodeConstructor.EMPTY_NODE.updateChild(we(e),t)))}isEmpty(){return!1}numChildren(){return 0}forEachChild(e,t){return!1}val(e){return e&&!this.getPriority().isEmpty()?{".value":this.getValue(),".priority":this.getPriority().val()}:this.getValue()}hash(){if(this.lazyHash_===null){let e="";this.priorityNode_.isEmpty()||(e+="priority:"+nu(this.priorityNode_.val())+":");const t=typeof this.value_;e+=t+":",t==="number"?e+=Md(this.value_):e+=this.value_,this.lazyHash_=Nd(e)}return this.lazyHash_}getValue(){return this.value_}compareTo(e){return e===Re.__childrenNodeConstructor.EMPTY_NODE?1:e instanceof Re.__childrenNodeConstructor?-1:(R(e.isLeafNode(),"Unknown node type"),this.compareToLeafNode_(e))}compareToLeafNode_(e){const t=typeof e.value_,s=typeof this.value_,i=Re.VALUE_TYPE_ORDER.indexOf(t),r=Re.VALUE_TYPE_ORDER.indexOf(s);return R(i>=0,"Unknown leaf type: "+t),R(r>=0,"Unknown leaf type: "+s),i===r?s==="object"?0:this.value_<e.value_?-1:this.value_===e.value_?0:1:r-i}withIndex(){return this}isIndexed(){return!0}equals(e){if(e===this)return!0;if(e.isLeafNode()){const t=e;return this.value_===t.value_&&this.priorityNode_.equals(t.priorityNode_)}else return!1}}Re.VALUE_TYPE_ORDER=["object","boolean","number","string"];/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */let iu,ru;function V_(n){iu=n}function q_(n){ru=n}class z_ extends hr{compare(e,t){const s=e.node.getPriority(),i=t.node.getPriority(),r=s.compareTo(i);return r===0?Rn(e.name,t.name):r}isDefinedOn(e){return!e.getPriority().isEmpty()}indexedValueChanged(e,t){return!e.getPriority().equals(t.getPriority())}minPost(){return oe.MIN}maxPost(){return new oe(en,new Re("[PRIORITY-POST]",ru))}makePost(e,t){const s=iu(e);return new oe(t,new Re("[PRIORITY-POST]",s))}toString(){return".priority"}}const Se=new z_;/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const G_=Math.log(2);class Y_{constructor(e){const t=r=>parseInt(Math.log(r)/G_,10),s=r=>parseInt(Array(r+1).join("1"),2);this.count=t(e+1),this.current_=this.count-1;const i=s(this.count);this.bits_=e+1&i}nextBitIsOne(){const e=!(this.bits_&1<<this.current_);return this.current_--,e}}const zi=function(n,e,t,s){n.sort(e);const i=function(c,d){const h=d-c;let f,_;if(h===0)return null;if(h===1)return f=n[c],_=t?t(f):f,new Pe(_,f.node,Pe.BLACK,null,null);{const p=parseInt(h/2,10)+c,I=i(c,p),S=i(p+1,d);return f=n[p],_=t?t(f):f,new Pe(_,f.node,Pe.BLACK,I,S)}},r=function(c){let d=null,h=null,f=n.length;const _=function(I,S){const x=f-I,q=f;f-=I;const Q=i(x+1,q),F=n[x],U=t?t(F):F;p(new Pe(U,F.node,S,null,Q))},p=function(I){d?(d.left=I,d=I):(h=I,d=I)};for(let I=0;I<c.count;++I){const S=c.nextBitIsOne(),x=Math.pow(2,c.count-(I+1));S?_(x,Pe.BLACK):(_(x,Pe.BLACK),_(x,Pe.RED))}return h},o=new Y_(n.length),a=r(o);return new Ge(s||e,a)};/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */let jr;const Fn={};class Rt{constructor(e,t){this.indexes_=e,this.indexSet_=t}static get Default(){return R(Fn&&Se,"ChildrenNode.ts has not been loaded"),jr=jr||new Rt({".priority":Fn},{".priority":Se}),jr}get(e){const t=Yn(this.indexes_,e);if(!t)throw new Error("No index defined for "+e);return t instanceof Ge?t:null}hasIndex(e){return bt(this.indexSet_,e.toString())}addIndex(e,t){R(e!==yn,"KeyIndex always exists and isn't meant to be added to the IndexMap.");const s=[];let i=!1;const r=t.getIterator(oe.Wrap);let o=r.getNext();for(;o;)i=i||e.isDefinedOn(o.node),s.push(o),o=r.getNext();let a;i?a=zi(s,e.getCompare()):a=Fn;const c=e.toString(),d=Object.assign({},this.indexSet_);d[c]=e;const h=Object.assign({},this.indexes_);return h[c]=a,new Rt(h,d)}addToIndexes(e,t){const s=Li(this.indexes_,(i,r)=>{const o=Yn(this.indexSet_,r);if(R(o,"Missing index implementation for "+r),i===Fn)if(o.isDefinedOn(e.node)){const a=[],c=t.getIterator(oe.Wrap);let d=c.getNext();for(;d;)d.name!==e.name&&a.push(d),d=c.getNext();return a.push(e),zi(a,o.getCompare())}else return Fn;else{const a=t.get(e.name);let c=i;return a&&(c=c.remove(new oe(e.name,a))),c.insert(e,e.node)}});return new Rt(s,this.indexSet_)}removeFromIndexes(e,t){const s=Li(this.indexes_,i=>{if(i===Fn)return i;{const r=t.get(e.name);return r?i.remove(new oe(e.name,r)):i}});return new Rt(s,this.indexSet_)}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */let _s;class G{constructor(e,t,s){this.children_=e,this.priorityNode_=t,this.indexMap_=s,this.lazyHash_=null,this.priorityNode_&&su(this.priorityNode_),this.children_.isEmpty()&&R(!this.priorityNode_||this.priorityNode_.isEmpty(),"An empty node cannot have a priority")}static get EMPTY_NODE(){return _s||(_s=new G(new Ge(oa),null,Rt.Default))}isLeafNode(){return!1}getPriority(){return this.priorityNode_||_s}updatePriority(e){return this.children_.isEmpty()?this:new G(this.children_,e,this.indexMap_)}getImmediateChild(e){if(e===".priority")return this.getPriority();{const t=this.children_.get(e);return t===null?_s:t}}getChild(e){const t=te(e);return t===null?this:this.getImmediateChild(t).getChild(we(e))}hasChild(e){return this.children_.get(e)!==null}updateImmediateChild(e,t){if(R(t,"We should always be passing snapshot nodes"),e===".priority")return this.updatePriority(t);{const s=new oe(e,t);let i,r;t.isEmpty()?(i=this.children_.remove(e),r=this.indexMap_.removeFromIndexes(s,this.children_)):(i=this.children_.insert(e,t),r=this.indexMap_.addToIndexes(s,this.children_));const o=i.isEmpty()?_s:this.priorityNode_;return new G(i,o,r)}}updateChild(e,t){const s=te(e);if(s===null)return t;{R(te(e)!==".priority"||tn(e)===1,".priority must be the last token in a path");const i=this.getImmediateChild(s).updateChild(we(e),t);return this.updateImmediateChild(s,i)}}isEmpty(){return this.children_.isEmpty()}numChildren(){return this.children_.count()}val(e){if(this.isEmpty())return null;const t={};let s=0,i=0,r=!0;if(this.forEachChild(Se,(o,a)=>{t[o]=a.val(e),s++,r&&G.INTEGER_REGEXP_.test(o)?i=Math.max(i,Number(o)):r=!1}),!e&&r&&i<2*s){const o=[];for(const a in t)o[a]=t[a];return o}else return e&&!this.getPriority().isEmpty()&&(t[".priority"]=this.getPriority().val()),t}hash(){if(this.lazyHash_===null){let e="";this.getPriority().isEmpty()||(e+="priority:"+nu(this.getPriority().val())+":"),this.forEachChild(Se,(t,s)=>{const i=s.hash();i!==""&&(e+=":"+t+":"+i)}),this.lazyHash_=e===""?"":Nd(e)}return this.lazyHash_}getPredecessorChildName(e,t,s){const i=this.resolveIndex_(s);if(i){const r=i.getPredecessorKey(new oe(e,t));return r?r.name:null}else return this.children_.getPredecessorKey(e)}getFirstChildName(e){const t=this.resolveIndex_(e);if(t){const s=t.minKey();return s&&s.name}else return this.children_.minKey()}getFirstChild(e){const t=this.getFirstChildName(e);return t?new oe(t,this.children_.get(t)):null}getLastChildName(e){const t=this.resolveIndex_(e);if(t){const s=t.maxKey();return s&&s.name}else return this.children_.maxKey()}getLastChild(e){const t=this.getLastChildName(e);return t?new oe(t,this.children_.get(t)):null}forEachChild(e,t){const s=this.resolveIndex_(e);return s?s.inorderTraversal(i=>t(i.name,i.node)):this.children_.inorderTraversal(t)}getIterator(e){return this.getIteratorFrom(e.minPost(),e)}getIteratorFrom(e,t){const s=this.resolveIndex_(t);if(s)return s.getIteratorFrom(e,i=>i);{const i=this.children_.getIteratorFrom(e.name,oe.Wrap);let r=i.peek();for(;r!=null&&t.compare(r,e)<0;)i.getNext(),r=i.peek();return i}}getReverseIterator(e){return this.getReverseIteratorFrom(e.maxPost(),e)}getReverseIteratorFrom(e,t){const s=this.resolveIndex_(t);if(s)return s.getReverseIteratorFrom(e,i=>i);{const i=this.children_.getReverseIteratorFrom(e.name,oe.Wrap);let r=i.peek();for(;r!=null&&t.compare(r,e)>0;)i.getNext(),r=i.peek();return i}}compareTo(e){return this.isEmpty()?e.isEmpty()?0:-1:e.isLeafNode()||e.isEmpty()?1:e===ai?-1:0}withIndex(e){if(e===yn||this.indexMap_.hasIndex(e))return this;{const t=this.indexMap_.addIndex(e,this.children_);return new G(this.children_,this.priorityNode_,t)}}isIndexed(e){return e===yn||this.indexMap_.hasIndex(e)}equals(e){if(e===this)return!0;if(e.isLeafNode())return!1;{const t=e;if(this.getPriority().equals(t.getPriority()))if(this.children_.count()===t.children_.count()){const s=this.getIterator(Se),i=t.getIterator(Se);let r=s.getNext(),o=i.getNext();for(;r&&o;){if(r.name!==o.name||!r.node.equals(o.node))return!1;r=s.getNext(),o=i.getNext()}return r===null&&o===null}else return!1;else return!1}}resolveIndex_(e){return e===yn?null:this.indexMap_.get(e.toString())}}G.INTEGER_REGEXP_=/^(0|[1-9]\d*)$/;class K_ extends G{constructor(){super(new Ge(oa),G.EMPTY_NODE,Rt.Default)}compareTo(e){return e===this?0:1}equals(e){return e===this}getPriority(){return this}getImmediateChild(e){return G.EMPTY_NODE}isEmpty(){return!1}}const ai=new K_;Object.defineProperties(oe,{MIN:{value:new oe(En,G.EMPTY_NODE)},MAX:{value:new oe(en,ai)}});tu.__EMPTY_NODE=G.EMPTY_NODE;Re.__childrenNodeConstructor=G;j_(ai);q_(ai);/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const Q_=!0;function ke(n,e=null){if(n===null)return G.EMPTY_NODE;if(typeof n=="object"&&".priority"in n&&(e=n[".priority"]),R(e===null||typeof e=="string"||typeof e=="number"||typeof e=="object"&&".sv"in e,"Invalid priority type found: "+typeof e),typeof n=="object"&&".value"in n&&n[".value"]!==null&&(n=n[".value"]),typeof n!="object"||".sv"in n){const t=n;return new Re(t,ke(e))}if(!(n instanceof Array)&&Q_){const t=[];let s=!1;if(Me(n,(o,a)=>{if(o.substring(0,1)!=="."){const c=ke(a);c.isEmpty()||(s=s||!c.getPriority().isEmpty(),t.push(new oe(o,c)))}}),t.length===0)return G.EMPTY_NODE;const r=zi(t,H_,o=>o.name,oa);if(s){const o=zi(t,Se.getCompare());return new G(r,ke(e),new Rt({".priority":o},{".priority":Se}))}else return new G(r,ke(e),Rt.Default)}else{let t=G.EMPTY_NODE;return Me(n,(s,i)=>{if(bt(n,s)&&s.substring(0,1)!=="."){const r=ke(i);(r.isLeafNode()||!r.isEmpty())&&(t=t.updateImmediateChild(s,r))}}),t.updatePriority(ke(e))}}V_(ke);/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class aa extends hr{constructor(e){super(),this.indexPath_=e,R(!ne(e)&&te(e)!==".priority","Can't create PathIndex with empty path or .priority key")}extractChild(e){return e.getChild(this.indexPath_)}isDefinedOn(e){return!e.getChild(this.indexPath_).isEmpty()}compare(e,t){const s=this.extractChild(e.node),i=this.extractChild(t.node),r=s.compareTo(i);return r===0?Rn(e.name,t.name):r}makePost(e,t){const s=ke(e),i=G.EMPTY_NODE.updateChild(this.indexPath_,s);return new oe(t,i)}maxPost(){const e=G.EMPTY_NODE.updateChild(this.indexPath_,ai);return new oe(en,e)}toString(){return Hs(this.indexPath_,0).join("/")}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class J_ extends hr{compare(e,t){const s=e.node.compareTo(t.node);return s===0?Rn(e.name,t.name):s}isDefinedOn(e){return!0}indexedValueChanged(e,t){return!e.equals(t)}minPost(){return oe.MIN}maxPost(){return oe.MAX}makePost(e,t){const s=ke(e);return new oe(t,s)}toString(){return".value"}}const ou=new J_;/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function au(n){return{type:"value",snapshotNode:n}}function Xn(n,e){return{type:"child_added",snapshotNode:e,childName:n}}function js(n,e){return{type:"child_removed",snapshotNode:e,childName:n}}function Vs(n,e,t){return{type:"child_changed",snapshotNode:e,childName:n,oldSnap:t}}function X_(n,e){return{type:"child_moved",snapshotNode:e,childName:n}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class la{constructor(e){this.index_=e}updateChild(e,t,s,i,r,o){R(e.isIndexed(this.index_),"A node must be indexed if only a child is updated");const a=e.getImmediateChild(t);return a.getChild(i).equals(s.getChild(i))&&a.isEmpty()===s.isEmpty()||(o!=null&&(s.isEmpty()?e.hasChild(t)?o.trackChildChange(js(t,a)):R(e.isLeafNode(),"A child remove without an old child only makes sense on a leaf node"):a.isEmpty()?o.trackChildChange(Xn(t,s)):o.trackChildChange(Vs(t,s,a))),e.isLeafNode()&&s.isEmpty())?e:e.updateImmediateChild(t,s).withIndex(this.index_)}updateFullNode(e,t,s){return s!=null&&(e.isLeafNode()||e.forEachChild(Se,(i,r)=>{t.hasChild(i)||s.trackChildChange(js(i,r))}),t.isLeafNode()||t.forEachChild(Se,(i,r)=>{if(e.hasChild(i)){const o=e.getImmediateChild(i);o.equals(r)||s.trackChildChange(Vs(i,r,o))}else s.trackChildChange(Xn(i,r))})),t.withIndex(this.index_)}updatePriority(e,t){return e.isEmpty()?G.EMPTY_NODE:e.updatePriority(t)}filtersNodes(){return!1}getIndexedFilter(){return this}getIndex(){return this.index_}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class qs{constructor(e){this.indexedFilter_=new la(e.getIndex()),this.index_=e.getIndex(),this.startPost_=qs.getStartPost_(e),this.endPost_=qs.getEndPost_(e),this.startIsInclusive_=!e.startAfterSet_,this.endIsInclusive_=!e.endBeforeSet_}getStartPost(){return this.startPost_}getEndPost(){return this.endPost_}matches(e){const t=this.startIsInclusive_?this.index_.compare(this.getStartPost(),e)<=0:this.index_.compare(this.getStartPost(),e)<0,s=this.endIsInclusive_?this.index_.compare(e,this.getEndPost())<=0:this.index_.compare(e,this.getEndPost())<0;return t&&s}updateChild(e,t,s,i,r,o){return this.matches(new oe(t,s))||(s=G.EMPTY_NODE),this.indexedFilter_.updateChild(e,t,s,i,r,o)}updateFullNode(e,t,s){t.isLeafNode()&&(t=G.EMPTY_NODE);let i=t.withIndex(this.index_);i=i.updatePriority(G.EMPTY_NODE);const r=this;return t.forEachChild(Se,(o,a)=>{r.matches(new oe(o,a))||(i=i.updateImmediateChild(o,G.EMPTY_NODE))}),this.indexedFilter_.updateFullNode(e,i,s)}updatePriority(e,t){return e}filtersNodes(){return!0}getIndexedFilter(){return this.indexedFilter_}getIndex(){return this.index_}static getStartPost_(e){if(e.hasStart()){const t=e.getIndexStartName();return e.getIndex().makePost(e.getIndexStartValue(),t)}else return e.getIndex().minPost()}static getEndPost_(e){if(e.hasEnd()){const t=e.getIndexEndName();return e.getIndex().makePost(e.getIndexEndValue(),t)}else return e.getIndex().maxPost()}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Z_{constructor(e){this.withinDirectionalStart=t=>this.reverse_?this.withinEndPost(t):this.withinStartPost(t),this.withinDirectionalEnd=t=>this.reverse_?this.withinStartPost(t):this.withinEndPost(t),this.withinStartPost=t=>{const s=this.index_.compare(this.rangedFilter_.getStartPost(),t);return this.startIsInclusive_?s<=0:s<0},this.withinEndPost=t=>{const s=this.index_.compare(t,this.rangedFilter_.getEndPost());return this.endIsInclusive_?s<=0:s<0},this.rangedFilter_=new qs(e),this.index_=e.getIndex(),this.limit_=e.getLimit(),this.reverse_=!e.isViewFromLeft(),this.startIsInclusive_=!e.startAfterSet_,this.endIsInclusive_=!e.endBeforeSet_}updateChild(e,t,s,i,r,o){return this.rangedFilter_.matches(new oe(t,s))||(s=G.EMPTY_NODE),e.getImmediateChild(t).equals(s)?e:e.numChildren()<this.limit_?this.rangedFilter_.getIndexedFilter().updateChild(e,t,s,i,r,o):this.fullLimitUpdateChild_(e,t,s,r,o)}updateFullNode(e,t,s){let i;if(t.isLeafNode()||t.isEmpty())i=G.EMPTY_NODE.withIndex(this.index_);else if(this.limit_*2<t.numChildren()&&t.isIndexed(this.index_)){i=G.EMPTY_NODE.withIndex(this.index_);let r;this.reverse_?r=t.getReverseIteratorFrom(this.rangedFilter_.getEndPost(),this.index_):r=t.getIteratorFrom(this.rangedFilter_.getStartPost(),this.index_);let o=0;for(;r.hasNext()&&o<this.limit_;){const a=r.getNext();if(this.withinDirectionalStart(a))if(this.withinDirectionalEnd(a))i=i.updateImmediateChild(a.name,a.node),o++;else break;else continue}}else{i=t.withIndex(this.index_),i=i.updatePriority(G.EMPTY_NODE);let r;this.reverse_?r=i.getReverseIterator(this.index_):r=i.getIterator(this.index_);let o=0;for(;r.hasNext();){const a=r.getNext();o<this.limit_&&this.withinDirectionalStart(a)&&this.withinDirectionalEnd(a)?o++:i=i.updateImmediateChild(a.name,G.EMPTY_NODE)}}return this.rangedFilter_.getIndexedFilter().updateFullNode(e,i,s)}updatePriority(e,t){return e}filtersNodes(){return!0}getIndexedFilter(){return this.rangedFilter_.getIndexedFilter()}getIndex(){return this.index_}fullLimitUpdateChild_(e,t,s,i,r){let o;if(this.reverse_){const f=this.index_.getCompare();o=(_,p)=>f(p,_)}else o=this.index_.getCompare();const a=e;R(a.numChildren()===this.limit_,"");const c=new oe(t,s),d=this.reverse_?a.getFirstChild(this.index_):a.getLastChild(this.index_),h=this.rangedFilter_.matches(c);if(a.hasChild(t)){const f=a.getImmediateChild(t);let _=i.getChildAfterChild(this.index_,d,this.reverse_);for(;_!=null&&(_.name===t||a.hasChild(_.name));)_=i.getChildAfterChild(this.index_,_,this.reverse_);const p=_==null?1:o(_,c);if(h&&!s.isEmpty()&&p>=0)return r!=null&&r.trackChildChange(Vs(t,s,f)),a.updateImmediateChild(t,s);{r!=null&&r.trackChildChange(js(t,f));const S=a.updateImmediateChild(t,G.EMPTY_NODE);return _!=null&&this.rangedFilter_.matches(_)?(r!=null&&r.trackChildChange(Xn(_.name,_.node)),S.updateImmediateChild(_.name,_.node)):S}}else return s.isEmpty()?e:h&&o(d,c)>=0?(r!=null&&(r.trackChildChange(js(d.name,d.node)),r.trackChildChange(Xn(t,s))),a.updateImmediateChild(t,s).updateImmediateChild(d.name,G.EMPTY_NODE)):e}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class ca{constructor(){this.limitSet_=!1,this.startSet_=!1,this.startNameSet_=!1,this.startAfterSet_=!1,this.endSet_=!1,this.endNameSet_=!1,this.endBeforeSet_=!1,this.limit_=0,this.viewFrom_="",this.indexStartValue_=null,this.indexStartName_="",this.indexEndValue_=null,this.indexEndName_="",this.index_=Se}hasStart(){return this.startSet_}isViewFromLeft(){return this.viewFrom_===""?this.startSet_:this.viewFrom_==="l"}getIndexStartValue(){return R(this.startSet_,"Only valid if start has been set"),this.indexStartValue_}getIndexStartName(){return R(this.startSet_,"Only valid if start has been set"),this.startNameSet_?this.indexStartName_:En}hasEnd(){return this.endSet_}getIndexEndValue(){return R(this.endSet_,"Only valid if end has been set"),this.indexEndValue_}getIndexEndName(){return R(this.endSet_,"Only valid if end has been set"),this.endNameSet_?this.indexEndName_:en}hasLimit(){return this.limitSet_}hasAnchoredLimit(){return this.limitSet_&&this.viewFrom_!==""}getLimit(){return R(this.limitSet_,"Only valid if limit has been set"),this.limit_}getIndex(){return this.index_}loadsAllData(){return!(this.startSet_||this.endSet_||this.limitSet_)}isDefault(){return this.loadsAllData()&&this.index_===Se}copy(){const e=new ca;return e.limitSet_=this.limitSet_,e.limit_=this.limit_,e.startSet_=this.startSet_,e.startAfterSet_=this.startAfterSet_,e.indexStartValue_=this.indexStartValue_,e.startNameSet_=this.startNameSet_,e.indexStartName_=this.indexStartName_,e.endSet_=this.endSet_,e.endBeforeSet_=this.endBeforeSet_,e.indexEndValue_=this.indexEndValue_,e.endNameSet_=this.endNameSet_,e.indexEndName_=this.indexEndName_,e.index_=this.index_,e.viewFrom_=this.viewFrom_,e}}function ey(n){return n.loadsAllData()?new la(n.getIndex()):n.hasLimit()?new Z_(n):new qs(n)}function ty(n,e){const t=n.copy();return t.limitSet_=!0,t.limit_=e,t.viewFrom_="r",t}function ny(n,e){const t=n.copy();return t.index_=e,t}function Ql(n){const e={};if(n.isDefault())return e;let t;if(n.index_===Se?t="$priority":n.index_===ou?t="$value":n.index_===yn?t="$key":(R(n.index_ instanceof aa,"Unrecognized index type!"),t=n.index_.toString()),e.orderBy=Ae(t),n.startSet_){const s=n.startAfterSet_?"startAfter":"startAt";e[s]=Ae(n.indexStartValue_),n.startNameSet_&&(e[s]+=","+Ae(n.indexStartName_))}if(n.endSet_){const s=n.endBeforeSet_?"endBefore":"endAt";e[s]=Ae(n.indexEndValue_),n.endNameSet_&&(e[s]+=","+Ae(n.indexEndName_))}return n.limitSet_&&(n.isViewFromLeft()?e.limitToFirst=n.limit_:e.limitToLast=n.limit_),e}function Jl(n){const e={};if(n.startSet_&&(e.sp=n.indexStartValue_,n.startNameSet_&&(e.sn=n.indexStartName_),e.sin=!n.startAfterSet_),n.endSet_&&(e.ep=n.indexEndValue_,n.endNameSet_&&(e.en=n.indexEndName_),e.ein=!n.endBeforeSet_),n.limitSet_){e.l=n.limit_;let t=n.viewFrom_;t===""&&(n.isViewFromLeft()?t="l":t="r"),e.vf=t}return n.index_!==Se&&(e.i=n.index_.toString()),e}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Gi extends Jd{constructor(e,t,s,i){super(),this.repoInfo_=e,this.onDataUpdate_=t,this.authTokenProvider_=s,this.appCheckTokenProvider_=i,this.log_=oi("p:rest:"),this.listens_={}}reportStats(e){throw new Error("Method not implemented.")}static getListenId_(e,t){return t!==void 0?"tag$"+t:(R(e._queryParams.isDefault(),"should have a tag if it's not a default query."),e._path.toString())}listen(e,t,s,i){const r=e._path.toString();this.log_("Listen called for "+r+" "+e._queryIdentifier);const o=Gi.getListenId_(e,s),a={};this.listens_[o]=a;const c=Ql(e._queryParams);this.restRequest_(r+".json",c,(d,h)=>{let f=h;if(d===404&&(f=null,d=null),d===null&&this.onDataUpdate_(r,f,!1,s),Yn(this.listens_,o)===a){let _;d?d===401?_="permission_denied":_="rest_error:"+d:_="ok",i(_,null)}})}unlisten(e,t){const s=Gi.getListenId_(e,t);delete this.listens_[s]}get(e){const t=Ql(e._queryParams),s=e._path.toString(),i=new mt;return this.restRequest_(s+".json",t,(r,o)=>{let a=o;r===404&&(a=null,r=null),r===null?(this.onDataUpdate_(s,a,!1,null),i.resolve(a)):i.reject(new Error(a))}),i.promise}refreshAuthToken(e){}restRequest_(e,t={},s){return t.format="export",Promise.all([this.authTokenProvider_.getToken(!1),this.appCheckTokenProvider_.getToken(!1)]).then(([i,r])=>{i&&i.accessToken&&(t.auth=i.accessToken),r&&r.token&&(t.ac=r.token);const o=(this.repoInfo_.secure?"https://":"http://")+this.repoInfo_.host+e+"?ns="+this.repoInfo_.namespace+as(t);this.log_("Sending REST request for "+o);const a=new XMLHttpRequest;a.onreadystatechange=()=>{if(s&&a.readyState===4){this.log_("REST Response for "+o+" received. status:",a.status,"response:",a.responseText);let c=null;if(a.status>=200&&a.status<300){try{c=$s(a.responseText)}catch{je("Failed to parse JSON response for "+o+": "+a.responseText)}s(null,c)}else a.status!==401&&a.status!==404&&je("Got unsuccessful REST response for "+o+" Status: "+a.status),s(a.status);s=null}},a.open("GET",o,!0),a.send()})}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class sy{constructor(){this.rootNode_=G.EMPTY_NODE}getNode(e){return this.rootNode_.getChild(e)}updateSnapshot(e,t){this.rootNode_=this.rootNode_.updateChild(e,t)}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function Yi(){return{value:null,children:new Map}}function ds(n,e,t){if(ne(e))n.value=t,n.children.clear();else if(n.value!==null)n.value=n.value.updateChild(e,t);else{const s=te(e);n.children.has(s)||n.children.set(s,Yi());const i=n.children.get(s);e=we(e),ds(i,e,t)}}function fo(n,e){if(ne(e))return n.value=null,n.children.clear(),!0;if(n.value!==null){if(n.value.isLeafNode())return!1;{const t=n.value;return n.value=null,t.forEachChild(Se,(s,i)=>{ds(n,new _e(s),i)}),fo(n,e)}}else if(n.children.size>0){const t=te(e);return e=we(e),n.children.has(t)&&fo(n.children.get(t),e)&&n.children.delete(t),n.children.size===0}else return!0}function po(n,e,t){n.value!==null?t(e,n.value):iy(n,(s,i)=>{const r=new _e(e.toString()+"/"+s);po(i,r,t)})}function iy(n,e){n.children.forEach((t,s)=>{e(s,t)})}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class ry{constructor(e){this.collection_=e,this.last_=null}get(){const e=this.collection_.get(),t=Object.assign({},e);return this.last_&&Me(this.last_,(s,i)=>{t[s]=t[s]-i}),this.last_=e,t}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const Xl=10*1e3,oy=30*1e3,ay=5*60*1e3;class ly{constructor(e,t){this.server_=t,this.statsToReport_={},this.statsListener_=new ry(e);const s=Xl+(oy-Xl)*Math.random();Rs(this.reportStats_.bind(this),Math.floor(s))}reportStats_(){const e=this.statsListener_.get(),t={};let s=!1;Me(e,(i,r)=>{r>0&&bt(this.statsToReport_,i)&&(t[i]=r,s=!0)}),s&&this.server_.reportStats(t),Rs(this.reportStats_.bind(this),Math.floor(Math.random()*2*ay))}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */var lt;(function(n){n[n.OVERWRITE=0]="OVERWRITE",n[n.MERGE=1]="MERGE",n[n.ACK_USER_WRITE=2]="ACK_USER_WRITE",n[n.LISTEN_COMPLETE=3]="LISTEN_COMPLETE"})(lt||(lt={}));function da(){return{fromUser:!0,fromServer:!1,queryId:null,tagged:!1}}function ua(){return{fromUser:!1,fromServer:!0,queryId:null,tagged:!1}}function ha(n){return{fromUser:!1,fromServer:!0,queryId:n,tagged:!0}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Ki{constructor(e,t,s){this.path=e,this.affectedTree=t,this.revert=s,this.type=lt.ACK_USER_WRITE,this.source=da()}operationForChild(e){if(ne(this.path)){if(this.affectedTree.value!=null)return R(this.affectedTree.children.isEmpty(),"affectedTree should not have overlapping affected paths."),this;{const t=this.affectedTree.subtree(new _e(e));return new Ki(me(),t,this.revert)}}else return R(te(this.path)===e,"operationForChild called for unrelated child."),new Ki(we(this.path),this.affectedTree,this.revert)}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class zs{constructor(e,t){this.source=e,this.path=t,this.type=lt.LISTEN_COMPLETE}operationForChild(e){return ne(this.path)?new zs(this.source,me()):new zs(this.source,we(this.path))}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Cn{constructor(e,t,s){this.source=e,this.path=t,this.snap=s,this.type=lt.OVERWRITE}operationForChild(e){return ne(this.path)?new Cn(this.source,me(),this.snap.getImmediateChild(e)):new Cn(this.source,we(this.path),this.snap)}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Zn{constructor(e,t,s){this.source=e,this.path=t,this.children=s,this.type=lt.MERGE}operationForChild(e){if(ne(this.path)){const t=this.children.subtree(new _e(e));return t.isEmpty()?null:t.value?new Cn(this.source,me(),t.value):new Zn(this.source,me(),t)}else return R(te(this.path)===e,"Can't get a merge for a child not on the path of the operation"),new Zn(this.source,we(this.path),this.children)}toString(){return"Operation("+this.path+": "+this.source.toString()+" merge: "+this.children.toString()+")"}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class nn{constructor(e,t,s){this.node_=e,this.fullyInitialized_=t,this.filtered_=s}isFullyInitialized(){return this.fullyInitialized_}isFiltered(){return this.filtered_}isCompleteForPath(e){if(ne(e))return this.isFullyInitialized()&&!this.filtered_;const t=te(e);return this.isCompleteForChild(t)}isCompleteForChild(e){return this.isFullyInitialized()&&!this.filtered_||this.node_.hasChild(e)}getNode(){return this.node_}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class cy{constructor(e){this.query_=e,this.index_=this.query_._queryParams.getIndex()}}function dy(n,e,t,s){const i=[],r=[];return e.forEach(o=>{o.type==="child_changed"&&n.index_.indexedValueChanged(o.oldSnap,o.snapshotNode)&&r.push(X_(o.childName,o.snapshotNode))}),ys(n,i,"child_removed",e,s,t),ys(n,i,"child_added",e,s,t),ys(n,i,"child_moved",r,s,t),ys(n,i,"child_changed",e,s,t),ys(n,i,"value",e,s,t),i}function ys(n,e,t,s,i,r){const o=s.filter(a=>a.type===t);o.sort((a,c)=>hy(n,a,c)),o.forEach(a=>{const c=uy(n,a,r);i.forEach(d=>{d.respondsTo(a.type)&&e.push(d.createEvent(c,n.query_))})})}function uy(n,e,t){return e.type==="value"||e.type==="child_removed"||(e.prevName=t.getPredecessorChildName(e.childName,e.snapshotNode,n.index_)),e}function hy(n,e,t){if(e.childName==null||t.childName==null)throw os("Should only compare child_ events.");const s=new oe(e.childName,e.snapshotNode),i=new oe(t.childName,t.snapshotNode);return n.index_.compare(s,i)}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function fr(n,e){return{eventCache:n,serverCache:e}}function Ps(n,e,t,s){return fr(new nn(e,t,s),n.serverCache)}function lu(n,e,t,s){return fr(n.eventCache,new nn(e,t,s))}function Qi(n){return n.eventCache.isFullyInitialized()?n.eventCache.getNode():null}function In(n){return n.serverCache.isFullyInitialized()?n.serverCache.getNode():null}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */let Vr;const fy=()=>(Vr||(Vr=new Ge(Jg)),Vr);class Ee{constructor(e,t=fy()){this.value=e,this.children=t}static fromObject(e){let t=new Ee(null);return Me(e,(s,i)=>{t=t.set(new _e(s),i)}),t}isEmpty(){return this.value===null&&this.children.isEmpty()}findRootMostMatchingPathAndValue(e,t){if(this.value!=null&&t(this.value))return{path:me(),value:this.value};if(ne(e))return null;{const s=te(e),i=this.children.get(s);if(i!==null){const r=i.findRootMostMatchingPathAndValue(we(e),t);return r!=null?{path:Te(new _e(s),r.path),value:r.value}:null}else return null}}findRootMostValueAndPath(e){return this.findRootMostMatchingPathAndValue(e,()=>!0)}subtree(e){if(ne(e))return this;{const t=te(e),s=this.children.get(t);return s!==null?s.subtree(we(e)):new Ee(null)}}set(e,t){if(ne(e))return new Ee(t,this.children);{const s=te(e),r=(this.children.get(s)||new Ee(null)).set(we(e),t),o=this.children.insert(s,r);return new Ee(this.value,o)}}remove(e){if(ne(e))return this.children.isEmpty()?new Ee(null):new Ee(null,this.children);{const t=te(e),s=this.children.get(t);if(s){const i=s.remove(we(e));let r;return i.isEmpty()?r=this.children.remove(t):r=this.children.insert(t,i),this.value===null&&r.isEmpty()?new Ee(null):new Ee(this.value,r)}else return this}}get(e){if(ne(e))return this.value;{const t=te(e),s=this.children.get(t);return s?s.get(we(e)):null}}setTree(e,t){if(ne(e))return t;{const s=te(e),r=(this.children.get(s)||new Ee(null)).setTree(we(e),t);let o;return r.isEmpty()?o=this.children.remove(s):o=this.children.insert(s,r),new Ee(this.value,o)}}fold(e){return this.fold_(me(),e)}fold_(e,t){const s={};return this.children.inorderTraversal((i,r)=>{s[i]=r.fold_(Te(e,i),t)}),t(e,this.value,s)}findOnPath(e,t){return this.findOnPath_(e,me(),t)}findOnPath_(e,t,s){const i=this.value?s(t,this.value):!1;if(i)return i;if(ne(e))return null;{const r=te(e),o=this.children.get(r);return o?o.findOnPath_(we(e),Te(t,r),s):null}}foreachOnPath(e,t){return this.foreachOnPath_(e,me(),t)}foreachOnPath_(e,t,s){if(ne(e))return this;{this.value&&s(t,this.value);const i=te(e),r=this.children.get(i);return r?r.foreachOnPath_(we(e),Te(t,i),s):new Ee(null)}}foreach(e){this.foreach_(me(),e)}foreach_(e,t){this.children.inorderTraversal((s,i)=>{i.foreach_(Te(e,s),t)}),this.value&&t(e,this.value)}foreachChild(e){this.children.inorderTraversal((t,s)=>{s.value&&e(t,s.value)})}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class ct{constructor(e){this.writeTree_=e}static empty(){return new ct(new Ee(null))}}function Ns(n,e,t){if(ne(e))return new ct(new Ee(t));{const s=n.writeTree_.findRootMostValueAndPath(e);if(s!=null){const i=s.path;let r=s.value;const o=He(i,e);return r=r.updateChild(o,t),new ct(n.writeTree_.set(i,r))}else{const i=new Ee(t),r=n.writeTree_.setTree(e,i);return new ct(r)}}}function mo(n,e,t){let s=n;return Me(t,(i,r)=>{s=Ns(s,Te(e,i),r)}),s}function Zl(n,e){if(ne(e))return ct.empty();{const t=n.writeTree_.setTree(e,new Ee(null));return new ct(t)}}function go(n,e){return Pn(n,e)!=null}function Pn(n,e){const t=n.writeTree_.findRootMostValueAndPath(e);return t!=null?n.writeTree_.get(t.path).getChild(He(t.path,e)):null}function ec(n){const e=[],t=n.writeTree_.value;return t!=null?t.isLeafNode()||t.forEachChild(Se,(s,i)=>{e.push(new oe(s,i))}):n.writeTree_.children.inorderTraversal((s,i)=>{i.value!=null&&e.push(new oe(s,i.value))}),e}function Xt(n,e){if(ne(e))return n;{const t=Pn(n,e);return t!=null?new ct(new Ee(t)):new ct(n.writeTree_.subtree(e))}}function _o(n){return n.writeTree_.isEmpty()}function es(n,e){return cu(me(),n.writeTree_,e)}function cu(n,e,t){if(e.value!=null)return t.updateChild(n,e.value);{let s=null;return e.children.inorderTraversal((i,r)=>{i===".priority"?(R(r.value!==null,"Priority writes must always be leaf nodes"),s=r.value):t=cu(Te(n,i),r,t)}),!t.getChild(n).isEmpty()&&s!==null&&(t=t.updateChild(Te(n,".priority"),s)),t}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function pr(n,e){return fu(e,n)}function py(n,e,t,s,i){R(s>n.lastWriteId,"Stacking an older write on top of newer ones"),i===void 0&&(i=!0),n.allWrites.push({path:e,snap:t,writeId:s,visible:i}),i&&(n.visibleWrites=Ns(n.visibleWrites,e,t)),n.lastWriteId=s}function my(n,e,t,s){R(s>n.lastWriteId,"Stacking an older merge on top of newer ones"),n.allWrites.push({path:e,children:t,writeId:s,visible:!0}),n.visibleWrites=mo(n.visibleWrites,e,t),n.lastWriteId=s}function gy(n,e){for(let t=0;t<n.allWrites.length;t++){const s=n.allWrites[t];if(s.writeId===e)return s}return null}function _y(n,e){const t=n.allWrites.findIndex(a=>a.writeId===e);R(t>=0,"removeWrite called with nonexistent writeId.");const s=n.allWrites[t];n.allWrites.splice(t,1);let i=s.visible,r=!1,o=n.allWrites.length-1;for(;i&&o>=0;){const a=n.allWrites[o];a.visible&&(o>=t&&yy(a,s.path)?i=!1:tt(s.path,a.path)&&(r=!0)),o--}if(i){if(r)return vy(n),!0;if(s.snap)n.visibleWrites=Zl(n.visibleWrites,s.path);else{const a=s.children;Me(a,c=>{n.visibleWrites=Zl(n.visibleWrites,Te(s.path,c))})}return!0}else return!1}function yy(n,e){if(n.snap)return tt(n.path,e);for(const t in n.children)if(n.children.hasOwnProperty(t)&&tt(Te(n.path,t),e))return!0;return!1}function vy(n){n.visibleWrites=du(n.allWrites,by,me()),n.allWrites.length>0?n.lastWriteId=n.allWrites[n.allWrites.length-1].writeId:n.lastWriteId=-1}function by(n){return n.visible}function du(n,e,t){let s=ct.empty();for(let i=0;i<n.length;++i){const r=n[i];if(e(r)){const o=r.path;let a;if(r.snap)tt(t,o)?(a=He(t,o),s=Ns(s,a,r.snap)):tt(o,t)&&(a=He(o,t),s=Ns(s,me(),r.snap.getChild(a)));else if(r.children){if(tt(t,o))a=He(t,o),s=mo(s,a,r.children);else if(tt(o,t))if(a=He(o,t),ne(a))s=mo(s,me(),r.children);else{const c=Yn(r.children,te(a));if(c){const d=c.getChild(we(a));s=Ns(s,me(),d)}}}else throw os("WriteRecord should have .snap or .children")}}return s}function uu(n,e,t,s,i){if(!s&&!i){const r=Pn(n.visibleWrites,e);if(r!=null)return r;{const o=Xt(n.visibleWrites,e);if(_o(o))return t;if(t==null&&!go(o,me()))return null;{const a=t||G.EMPTY_NODE;return es(o,a)}}}else{const r=Xt(n.visibleWrites,e);if(!i&&_o(r))return t;if(!i&&t==null&&!go(r,me()))return null;{const o=function(d){return(d.visible||i)&&(!s||!~s.indexOf(d.writeId))&&(tt(d.path,e)||tt(e,d.path))},a=du(n.allWrites,o,e),c=t||G.EMPTY_NODE;return es(a,c)}}}function wy(n,e,t){let s=G.EMPTY_NODE;const i=Pn(n.visibleWrites,e);if(i)return i.isLeafNode()||i.forEachChild(Se,(r,o)=>{s=s.updateImmediateChild(r,o)}),s;if(t){const r=Xt(n.visibleWrites,e);return t.forEachChild(Se,(o,a)=>{const c=es(Xt(r,new _e(o)),a);s=s.updateImmediateChild(o,c)}),ec(r).forEach(o=>{s=s.updateImmediateChild(o.name,o.node)}),s}else{const r=Xt(n.visibleWrites,e);return ec(r).forEach(o=>{s=s.updateImmediateChild(o.name,o.node)}),s}}function Ey(n,e,t,s,i){R(s||i,"Either existingEventSnap or existingServerSnap must exist");const r=Te(e,t);if(go(n.visibleWrites,r))return null;{const o=Xt(n.visibleWrites,r);return _o(o)?i.getChild(t):es(o,i.getChild(t))}}function Cy(n,e,t,s){const i=Te(e,t),r=Pn(n.visibleWrites,i);if(r!=null)return r;if(s.isCompleteForChild(t)){const o=Xt(n.visibleWrites,i);return es(o,s.getNode().getImmediateChild(t))}else return null}function Iy(n,e){return Pn(n.visibleWrites,e)}function Sy(n,e,t,s,i,r,o){let a;const c=Xt(n.visibleWrites,e),d=Pn(c,me());if(d!=null)a=d;else if(t!=null)a=es(c,t);else return[];if(a=a.withIndex(o),!a.isEmpty()&&!a.isLeafNode()){const h=[],f=o.getCompare(),_=r?a.getReverseIteratorFrom(s,o):a.getIteratorFrom(s,o);let p=_.getNext();for(;p&&h.length<i;)f(p,s)!==0&&h.push(p),p=_.getNext();return h}else return[]}function Ty(){return{visibleWrites:ct.empty(),allWrites:[],lastWriteId:-1}}function Ji(n,e,t,s){return uu(n.writeTree,n.treePath,e,t,s)}function fa(n,e){return wy(n.writeTree,n.treePath,e)}function tc(n,e,t,s){return Ey(n.writeTree,n.treePath,e,t,s)}function Xi(n,e){return Iy(n.writeTree,Te(n.treePath,e))}function ky(n,e,t,s,i,r){return Sy(n.writeTree,n.treePath,e,t,s,i,r)}function pa(n,e,t){return Cy(n.writeTree,n.treePath,e,t)}function hu(n,e){return fu(Te(n.treePath,e),n.writeTree)}function fu(n,e){return{treePath:n,writeTree:e}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class xy{constructor(){this.changeMap=new Map}trackChildChange(e){const t=e.type,s=e.childName;R(t==="child_added"||t==="child_changed"||t==="child_removed","Only child changes supported for tracking"),R(s!==".priority","Only non-priority child changes can be tracked.");const i=this.changeMap.get(s);if(i){const r=i.type;if(t==="child_added"&&r==="child_removed")this.changeMap.set(s,Vs(s,e.snapshotNode,i.snapshotNode));else if(t==="child_removed"&&r==="child_added")this.changeMap.delete(s);else if(t==="child_removed"&&r==="child_changed")this.changeMap.set(s,js(s,i.oldSnap));else if(t==="child_changed"&&r==="child_added")this.changeMap.set(s,Xn(s,e.snapshotNode));else if(t==="child_changed"&&r==="child_changed")this.changeMap.set(s,Vs(s,e.snapshotNode,i.oldSnap));else throw os("Illegal combination of changes: "+e+" occurred after "+i)}else this.changeMap.set(s,e)}getChanges(){return Array.from(this.changeMap.values())}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Ay{getCompleteChild(e){return null}getChildAfterChild(e,t,s){return null}}const pu=new Ay;class ma{constructor(e,t,s=null){this.writes_=e,this.viewCache_=t,this.optCompleteServerCache_=s}getCompleteChild(e){const t=this.viewCache_.eventCache;if(t.isCompleteForChild(e))return t.getNode().getImmediateChild(e);{const s=this.optCompleteServerCache_!=null?new nn(this.optCompleteServerCache_,!0,!1):this.viewCache_.serverCache;return pa(this.writes_,e,s)}}getChildAfterChild(e,t,s){const i=this.optCompleteServerCache_!=null?this.optCompleteServerCache_:In(this.viewCache_),r=ky(this.writes_,i,t,1,s,e);return r.length===0?null:r[0]}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function Ry(n){return{filter:n}}function Py(n,e){R(e.eventCache.getNode().isIndexed(n.filter.getIndex()),"Event snap not indexed"),R(e.serverCache.getNode().isIndexed(n.filter.getIndex()),"Server snap not indexed")}function Ny(n,e,t,s,i){const r=new xy;let o,a;if(t.type===lt.OVERWRITE){const d=t;d.source.fromUser?o=yo(n,e,d.path,d.snap,s,i,r):(R(d.source.fromServer,"Unknown source."),a=d.source.tagged||e.serverCache.isFiltered()&&!ne(d.path),o=Zi(n,e,d.path,d.snap,s,i,a,r))}else if(t.type===lt.MERGE){const d=t;d.source.fromUser?o=My(n,e,d.path,d.children,s,i,r):(R(d.source.fromServer,"Unknown source."),a=d.source.tagged||e.serverCache.isFiltered(),o=vo(n,e,d.path,d.children,s,i,a,r))}else if(t.type===lt.ACK_USER_WRITE){const d=t;d.revert?o=Fy(n,e,d.path,s,i,r):o=Dy(n,e,d.path,d.affectedTree,s,i,r)}else if(t.type===lt.LISTEN_COMPLETE)o=Ly(n,e,t.path,s,r);else throw os("Unknown operation type: "+t.type);const c=r.getChanges();return Oy(e,o,c),{viewCache:o,changes:c}}function Oy(n,e,t){const s=e.eventCache;if(s.isFullyInitialized()){const i=s.getNode().isLeafNode()||s.getNode().isEmpty(),r=Qi(n);(t.length>0||!n.eventCache.isFullyInitialized()||i&&!s.getNode().equals(r)||!s.getNode().getPriority().equals(r.getPriority()))&&t.push(au(Qi(e)))}}function mu(n,e,t,s,i,r){const o=e.eventCache;if(Xi(s,t)!=null)return e;{let a,c;if(ne(t))if(R(e.serverCache.isFullyInitialized(),"If change path is empty, we must have complete server data"),e.serverCache.isFiltered()){const d=In(e),h=d instanceof G?d:G.EMPTY_NODE,f=fa(s,h);a=n.filter.updateFullNode(e.eventCache.getNode(),f,r)}else{const d=Ji(s,In(e));a=n.filter.updateFullNode(e.eventCache.getNode(),d,r)}else{const d=te(t);if(d===".priority"){R(tn(t)===1,"Can't have a priority with additional path components");const h=o.getNode();c=e.serverCache.getNode();const f=tc(s,t,h,c);f!=null?a=n.filter.updatePriority(h,f):a=o.getNode()}else{const h=we(t);let f;if(o.isCompleteForChild(d)){c=e.serverCache.getNode();const _=tc(s,t,o.getNode(),c);_!=null?f=o.getNode().getImmediateChild(d).updateChild(h,_):f=o.getNode().getImmediateChild(d)}else f=pa(s,d,e.serverCache);f!=null?a=n.filter.updateChild(o.getNode(),d,f,h,i,r):a=o.getNode()}}return Ps(e,a,o.isFullyInitialized()||ne(t),n.filter.filtersNodes())}}function Zi(n,e,t,s,i,r,o,a){const c=e.serverCache;let d;const h=o?n.filter:n.filter.getIndexedFilter();if(ne(t))d=h.updateFullNode(c.getNode(),s,null);else if(h.filtersNodes()&&!c.isFiltered()){const p=c.getNode().updateChild(t,s);d=h.updateFullNode(c.getNode(),p,null)}else{const p=te(t);if(!c.isCompleteForPath(t)&&tn(t)>1)return e;const I=we(t),x=c.getNode().getImmediateChild(p).updateChild(I,s);p===".priority"?d=h.updatePriority(c.getNode(),x):d=h.updateChild(c.getNode(),p,x,I,pu,null)}const f=lu(e,d,c.isFullyInitialized()||ne(t),h.filtersNodes()),_=new ma(i,f,r);return mu(n,f,t,i,_,a)}function yo(n,e,t,s,i,r,o){const a=e.eventCache;let c,d;const h=new ma(i,e,r);if(ne(t))d=n.filter.updateFullNode(e.eventCache.getNode(),s,o),c=Ps(e,d,!0,n.filter.filtersNodes());else{const f=te(t);if(f===".priority")d=n.filter.updatePriority(e.eventCache.getNode(),s),c=Ps(e,d,a.isFullyInitialized(),a.isFiltered());else{const _=we(t),p=a.getNode().getImmediateChild(f);let I;if(ne(_))I=s;else{const S=h.getCompleteChild(f);S!=null?sa(_)===".priority"&&S.getChild(Zd(_)).isEmpty()?I=S:I=S.updateChild(_,s):I=G.EMPTY_NODE}if(p.equals(I))c=e;else{const S=n.filter.updateChild(a.getNode(),f,I,_,h,o);c=Ps(e,S,a.isFullyInitialized(),n.filter.filtersNodes())}}}return c}function nc(n,e){return n.eventCache.isCompleteForChild(e)}function My(n,e,t,s,i,r,o){let a=e;return s.foreach((c,d)=>{const h=Te(t,c);nc(e,te(h))&&(a=yo(n,a,h,d,i,r,o))}),s.foreach((c,d)=>{const h=Te(t,c);nc(e,te(h))||(a=yo(n,a,h,d,i,r,o))}),a}function sc(n,e,t){return t.foreach((s,i)=>{e=e.updateChild(s,i)}),e}function vo(n,e,t,s,i,r,o,a){if(e.serverCache.getNode().isEmpty()&&!e.serverCache.isFullyInitialized())return e;let c=e,d;ne(t)?d=s:d=new Ee(null).setTree(t,s);const h=e.serverCache.getNode();return d.children.inorderTraversal((f,_)=>{if(h.hasChild(f)){const p=e.serverCache.getNode().getImmediateChild(f),I=sc(n,p,_);c=Zi(n,c,new _e(f),I,i,r,o,a)}}),d.children.inorderTraversal((f,_)=>{const p=!e.serverCache.isCompleteForChild(f)&&_.value===null;if(!h.hasChild(f)&&!p){const I=e.serverCache.getNode().getImmediateChild(f),S=sc(n,I,_);c=Zi(n,c,new _e(f),S,i,r,o,a)}}),c}function Dy(n,e,t,s,i,r,o){if(Xi(i,t)!=null)return e;const a=e.serverCache.isFiltered(),c=e.serverCache;if(s.value!=null){if(ne(t)&&c.isFullyInitialized()||c.isCompleteForPath(t))return Zi(n,e,t,c.getNode().getChild(t),i,r,a,o);if(ne(t)){let d=new Ee(null);return c.getNode().forEachChild(yn,(h,f)=>{d=d.set(new _e(h),f)}),vo(n,e,t,d,i,r,a,o)}else return e}else{let d=new Ee(null);return s.foreach((h,f)=>{const _=Te(t,h);c.isCompleteForPath(_)&&(d=d.set(h,c.getNode().getChild(_)))}),vo(n,e,t,d,i,r,a,o)}}function Ly(n,e,t,s,i){const r=e.serverCache,o=lu(e,r.getNode(),r.isFullyInitialized()||ne(t),r.isFiltered());return mu(n,o,t,s,pu,i)}function Fy(n,e,t,s,i,r){let o;if(Xi(s,t)!=null)return e;{const a=new ma(s,e,i),c=e.eventCache.getNode();let d;if(ne(t)||te(t)===".priority"){let h;if(e.serverCache.isFullyInitialized())h=Ji(s,In(e));else{const f=e.serverCache.getNode();R(f instanceof G,"serverChildren would be complete if leaf node"),h=fa(s,f)}h=h,d=n.filter.updateFullNode(c,h,r)}else{const h=te(t);let f=pa(s,h,e.serverCache);f==null&&e.serverCache.isCompleteForChild(h)&&(f=c.getImmediateChild(h)),f!=null?d=n.filter.updateChild(c,h,f,we(t),a,r):e.eventCache.getNode().hasChild(h)?d=n.filter.updateChild(c,h,G.EMPTY_NODE,we(t),a,r):d=c,d.isEmpty()&&e.serverCache.isFullyInitialized()&&(o=Ji(s,In(e)),o.isLeafNode()&&(d=n.filter.updateFullNode(d,o,r)))}return o=e.serverCache.isFullyInitialized()||Xi(s,me())!=null,Ps(e,d,o,n.filter.filtersNodes())}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class $y{constructor(e,t){this.query_=e,this.eventRegistrations_=[];const s=this.query_._queryParams,i=new la(s.getIndex()),r=ey(s);this.processor_=Ry(r);const o=t.serverCache,a=t.eventCache,c=i.updateFullNode(G.EMPTY_NODE,o.getNode(),null),d=r.updateFullNode(G.EMPTY_NODE,a.getNode(),null),h=new nn(c,o.isFullyInitialized(),i.filtersNodes()),f=new nn(d,a.isFullyInitialized(),r.filtersNodes());this.viewCache_=fr(f,h),this.eventGenerator_=new cy(this.query_)}get query(){return this.query_}}function Uy(n){return n.viewCache_.serverCache.getNode()}function Wy(n){return Qi(n.viewCache_)}function By(n,e){const t=In(n.viewCache_);return t&&(n.query._queryParams.loadsAllData()||!ne(e)&&!t.getImmediateChild(te(e)).isEmpty())?t.getChild(e):null}function ic(n){return n.eventRegistrations_.length===0}function Hy(n,e){n.eventRegistrations_.push(e)}function rc(n,e,t){const s=[];if(t){R(e==null,"A cancel should cancel all event registrations.");const i=n.query._path;n.eventRegistrations_.forEach(r=>{const o=r.createCancelEvent(t,i);o&&s.push(o)})}if(e){let i=[];for(let r=0;r<n.eventRegistrations_.length;++r){const o=n.eventRegistrations_[r];if(!o.matches(e))i.push(o);else if(e.hasAnyCallback()){i=i.concat(n.eventRegistrations_.slice(r+1));break}}n.eventRegistrations_=i}else n.eventRegistrations_=[];return s}function oc(n,e,t,s){e.type===lt.MERGE&&e.source.queryId!==null&&(R(In(n.viewCache_),"We should always have a full cache before handling merges"),R(Qi(n.viewCache_),"Missing event cache, even though we have a server cache"));const i=n.viewCache_,r=Ny(n.processor_,i,e,t,s);return Py(n.processor_,r.viewCache),R(r.viewCache.serverCache.isFullyInitialized()||!i.serverCache.isFullyInitialized(),"Once a server snap is complete, it should never go back"),n.viewCache_=r.viewCache,gu(n,r.changes,r.viewCache.eventCache.getNode(),null)}function jy(n,e){const t=n.viewCache_.eventCache,s=[];return t.getNode().isLeafNode()||t.getNode().forEachChild(Se,(r,o)=>{s.push(Xn(r,o))}),t.isFullyInitialized()&&s.push(au(t.getNode())),gu(n,s,t.getNode(),e)}function gu(n,e,t,s){const i=s?[s]:n.eventRegistrations_;return dy(n.eventGenerator_,e,t,i)}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */let er;class _u{constructor(){this.views=new Map}}function Vy(n){R(!er,"__referenceConstructor has already been defined"),er=n}function qy(){return R(er,"Reference.ts has not been loaded"),er}function zy(n){return n.views.size===0}function ga(n,e,t,s){const i=e.source.queryId;if(i!==null){const r=n.views.get(i);return R(r!=null,"SyncTree gave us an op for an invalid query."),oc(r,e,t,s)}else{let r=[];for(const o of n.views.values())r=r.concat(oc(o,e,t,s));return r}}function yu(n,e,t,s,i){const r=e._queryIdentifier,o=n.views.get(r);if(!o){let a=Ji(t,i?s:null),c=!1;a?c=!0:s instanceof G?(a=fa(t,s),c=!1):(a=G.EMPTY_NODE,c=!1);const d=fr(new nn(a,c,!1),new nn(s,i,!1));return new $y(e,d)}return o}function Gy(n,e,t,s,i,r){const o=yu(n,e,s,i,r);return n.views.has(e._queryIdentifier)||n.views.set(e._queryIdentifier,o),Hy(o,t),jy(o,t)}function Yy(n,e,t,s){const i=e._queryIdentifier,r=[];let o=[];const a=sn(n);if(i==="default")for(const[c,d]of n.views.entries())o=o.concat(rc(d,t,s)),ic(d)&&(n.views.delete(c),d.query._queryParams.loadsAllData()||r.push(d.query));else{const c=n.views.get(i);c&&(o=o.concat(rc(c,t,s)),ic(c)&&(n.views.delete(i),c.query._queryParams.loadsAllData()||r.push(c.query)))}return a&&!sn(n)&&r.push(new(qy())(e._repo,e._path)),{removed:r,events:o}}function vu(n){const e=[];for(const t of n.views.values())t.query._queryParams.loadsAllData()||e.push(t);return e}function Zt(n,e){let t=null;for(const s of n.views.values())t=t||By(s,e);return t}function bu(n,e){if(e._queryParams.loadsAllData())return mr(n);{const s=e._queryIdentifier;return n.views.get(s)}}function wu(n,e){return bu(n,e)!=null}function sn(n){return mr(n)!=null}function mr(n){for(const e of n.views.values())if(e.query._queryParams.loadsAllData())return e;return null}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */let tr;function Ky(n){R(!tr,"__referenceConstructor has already been defined"),tr=n}function Qy(){return R(tr,"Reference.ts has not been loaded"),tr}let Jy=1;class ac{constructor(e){this.listenProvider_=e,this.syncPointTree_=new Ee(null),this.pendingWriteTree_=Ty(),this.tagToQueryMap=new Map,this.queryToTagMap=new Map}}function Eu(n,e,t,s,i){return py(n.pendingWriteTree_,e,t,s,i),i?us(n,new Cn(da(),e,t)):[]}function Xy(n,e,t,s){my(n.pendingWriteTree_,e,t,s);const i=Ee.fromObject(t);return us(n,new Zn(da(),e,i))}function zt(n,e,t=!1){const s=gy(n.pendingWriteTree_,e);if(_y(n.pendingWriteTree_,e)){let r=new Ee(null);return s.snap!=null?r=r.set(me(),!0):Me(s.children,o=>{r=r.set(new _e(o),!0)}),us(n,new Ki(s.path,r,t))}else return[]}function li(n,e,t){return us(n,new Cn(ua(),e,t))}function Zy(n,e,t){const s=Ee.fromObject(t);return us(n,new Zn(ua(),e,s))}function ev(n,e){return us(n,new zs(ua(),e))}function tv(n,e,t){const s=ya(n,t);if(s){const i=va(s),r=i.path,o=i.queryId,a=He(r,e),c=new zs(ha(o),a);return ba(n,r,c)}else return[]}function nr(n,e,t,s,i=!1){const r=e._path,o=n.syncPointTree_.get(r);let a=[];if(o&&(e._queryIdentifier==="default"||wu(o,e))){const c=Yy(o,e,t,s);zy(o)&&(n.syncPointTree_=n.syncPointTree_.remove(r));const d=c.removed;if(a=c.events,!i){const h=d.findIndex(_=>_._queryParams.loadsAllData())!==-1,f=n.syncPointTree_.findOnPath(r,(_,p)=>sn(p));if(h&&!f){const _=n.syncPointTree_.subtree(r);if(!_.isEmpty()){const p=iv(_);for(let I=0;I<p.length;++I){const S=p[I],x=S.query,q=Tu(n,S);n.listenProvider_.startListening(Os(x),Gs(n,x),q.hashFn,q.onComplete)}}}!f&&d.length>0&&!s&&(h?n.listenProvider_.stopListening(Os(e),null):d.forEach(_=>{const p=n.queryToTagMap.get(gr(_));n.listenProvider_.stopListening(Os(_),p)}))}rv(n,d)}return a}function Cu(n,e,t,s){const i=ya(n,s);if(i!=null){const r=va(i),o=r.path,a=r.queryId,c=He(o,e),d=new Cn(ha(a),c,t);return ba(n,o,d)}else return[]}function nv(n,e,t,s){const i=ya(n,s);if(i){const r=va(i),o=r.path,a=r.queryId,c=He(o,e),d=Ee.fromObject(t),h=new Zn(ha(a),c,d);return ba(n,o,h)}else return[]}function bo(n,e,t,s=!1){const i=e._path;let r=null,o=!1;n.syncPointTree_.foreachOnPath(i,(_,p)=>{const I=He(_,i);r=r||Zt(p,I),o=o||sn(p)});let a=n.syncPointTree_.get(i);a?(o=o||sn(a),r=r||Zt(a,me())):(a=new _u,n.syncPointTree_=n.syncPointTree_.set(i,a));let c;r!=null?c=!0:(c=!1,r=G.EMPTY_NODE,n.syncPointTree_.subtree(i).foreachChild((p,I)=>{const S=Zt(I,me());S&&(r=r.updateImmediateChild(p,S))}));const d=wu(a,e);if(!d&&!e._queryParams.loadsAllData()){const _=gr(e);R(!n.queryToTagMap.has(_),"View does not exist, but we have a tag");const p=ov();n.queryToTagMap.set(_,p),n.tagToQueryMap.set(p,_)}const h=pr(n.pendingWriteTree_,i);let f=Gy(a,e,t,h,r,c);if(!d&&!o&&!s){const _=bu(a,e);f=f.concat(av(n,e,_))}return f}function _a(n,e,t){const i=n.pendingWriteTree_,r=n.syncPointTree_.findOnPath(e,(o,a)=>{const c=He(o,e),d=Zt(a,c);if(d)return d});return uu(i,e,r,t,!0)}function sv(n,e){const t=e._path;let s=null;n.syncPointTree_.foreachOnPath(t,(d,h)=>{const f=He(d,t);s=s||Zt(h,f)});let i=n.syncPointTree_.get(t);i?s=s||Zt(i,me()):(i=new _u,n.syncPointTree_=n.syncPointTree_.set(t,i));const r=s!=null,o=r?new nn(s,!0,!1):null,a=pr(n.pendingWriteTree_,e._path),c=yu(i,e,a,r?o.getNode():G.EMPTY_NODE,r);return Wy(c)}function us(n,e){return Iu(e,n.syncPointTree_,null,pr(n.pendingWriteTree_,me()))}function Iu(n,e,t,s){if(ne(n.path))return Su(n,e,t,s);{const i=e.get(me());t==null&&i!=null&&(t=Zt(i,me()));let r=[];const o=te(n.path),a=n.operationForChild(o),c=e.children.get(o);if(c&&a){const d=t?t.getImmediateChild(o):null,h=hu(s,o);r=r.concat(Iu(a,c,d,h))}return i&&(r=r.concat(ga(i,n,s,t))),r}}function Su(n,e,t,s){const i=e.get(me());t==null&&i!=null&&(t=Zt(i,me()));let r=[];return e.children.inorderTraversal((o,a)=>{const c=t?t.getImmediateChild(o):null,d=hu(s,o),h=n.operationForChild(o);h&&(r=r.concat(Su(h,a,c,d)))}),i&&(r=r.concat(ga(i,n,s,t))),r}function Tu(n,e){const t=e.query,s=Gs(n,t);return{hashFn:()=>(Uy(e)||G.EMPTY_NODE).hash(),onComplete:i=>{if(i==="ok")return s?tv(n,t._path,s):ev(n,t._path);{const r=e_(i,t);return nr(n,t,null,r)}}}}function Gs(n,e){const t=gr(e);return n.queryToTagMap.get(t)}function gr(n){return n._path.toString()+"$"+n._queryIdentifier}function ya(n,e){return n.tagToQueryMap.get(e)}function va(n){const e=n.indexOf("$");return R(e!==-1&&e<n.length-1,"Bad queryKey."),{queryId:n.substr(e+1),path:new _e(n.substr(0,e))}}function ba(n,e,t){const s=n.syncPointTree_.get(e);R(s,"Missing sync point for query tag that we're tracking");const i=pr(n.pendingWriteTree_,e);return ga(s,t,i,null)}function iv(n){return n.fold((e,t,s)=>{if(t&&sn(t))return[mr(t)];{let i=[];return t&&(i=vu(t)),Me(s,(r,o)=>{i=i.concat(o)}),i}})}function Os(n){return n._queryParams.loadsAllData()&&!n._queryParams.isDefault()?new(Qy())(n._repo,n._path):n}function rv(n,e){for(let t=0;t<e.length;++t){const s=e[t];if(!s._queryParams.loadsAllData()){const i=gr(s),r=n.queryToTagMap.get(i);n.queryToTagMap.delete(i),n.tagToQueryMap.delete(r)}}}function ov(){return Jy++}function av(n,e,t){const s=e._path,i=Gs(n,e),r=Tu(n,t),o=n.listenProvider_.startListening(Os(e),i,r.hashFn,r.onComplete),a=n.syncPointTree_.subtree(s);if(i)R(!sn(a.value),"If we're adding a query, it shouldn't be shadowed");else{const c=a.fold((d,h,f)=>{if(!ne(d)&&h&&sn(h))return[mr(h).query];{let _=[];return h&&(_=_.concat(vu(h).map(p=>p.query))),Me(f,(p,I)=>{_=_.concat(I)}),_}});for(let d=0;d<c.length;++d){const h=c[d];n.listenProvider_.stopListening(Os(h),Gs(n,h))}}return o}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class wa{constructor(e){this.node_=e}getImmediateChild(e){const t=this.node_.getImmediateChild(e);return new wa(t)}node(){return this.node_}}class Ea{constructor(e,t){this.syncTree_=e,this.path_=t}getImmediateChild(e){const t=Te(this.path_,e);return new Ea(this.syncTree_,t)}node(){return _a(this.syncTree_,this.path_)}}const lv=function(n){return n=n||{},n.timestamp=n.timestamp||new Date().getTime(),n},lc=function(n,e,t){if(!n||typeof n!="object")return n;if(R(".sv"in n,"Unexpected leaf node or priority contents"),typeof n[".sv"]=="string")return cv(n[".sv"],e,t);if(typeof n[".sv"]=="object")return dv(n[".sv"],e);R(!1,"Unexpected server value: "+JSON.stringify(n,null,2))},cv=function(n,e,t){switch(n){case"timestamp":return t.timestamp;default:R(!1,"Unexpected server value: "+n)}},dv=function(n,e,t){n.hasOwnProperty("increment")||R(!1,"Unexpected server value: "+JSON.stringify(n,null,2));const s=n.increment;typeof s!="number"&&R(!1,"Unexpected increment value: "+s);const i=e.node();if(R(i!==null&&typeof i<"u","Expected ChildrenNode.EMPTY_NODE for nulls"),!i.isLeafNode())return s;const o=i.getValue();return typeof o!="number"?s:o+s},ku=function(n,e,t,s){return Ca(e,new Ea(t,n),s)},xu=function(n,e,t){return Ca(n,new wa(e),t)};function Ca(n,e,t){const s=n.getPriority().val(),i=lc(s,e.getImmediateChild(".priority"),t);let r;if(n.isLeafNode()){const o=n,a=lc(o.getValue(),e,t);return a!==o.getValue()||i!==o.getPriority().val()?new Re(a,ke(i)):n}else{const o=n;return r=o,i!==o.getPriority().val()&&(r=r.updatePriority(new Re(i))),o.forEachChild(Se,(a,c)=>{const d=Ca(c,e.getImmediateChild(a),t);d!==c&&(r=r.updateImmediateChild(a,d))}),r}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Ia{constructor(e="",t=null,s={children:{},childCount:0}){this.name=e,this.parent=t,this.node=s}}function Sa(n,e){let t=e instanceof _e?e:new _e(e),s=n,i=te(t);for(;i!==null;){const r=Yn(s.node.children,i)||{children:{},childCount:0};s=new Ia(i,s,r),t=we(t),i=te(t)}return s}function hs(n){return n.node.value}function Au(n,e){n.node.value=e,wo(n)}function Ru(n){return n.node.childCount>0}function uv(n){return hs(n)===void 0&&!Ru(n)}function _r(n,e){Me(n.node.children,(t,s)=>{e(new Ia(t,n,s))})}function Pu(n,e,t,s){t&&e(n),_r(n,i=>{Pu(i,e,!0)})}function hv(n,e,t){let s=n.parent;for(;s!==null;){if(e(s))return!0;s=s.parent}return!1}function ci(n){return new _e(n.parent===null?n.name:ci(n.parent)+"/"+n.name)}function wo(n){n.parent!==null&&fv(n.parent,n.name,n)}function fv(n,e,t){const s=uv(t),i=bt(n.node.children,e);s&&i?(delete n.node.children[e],n.node.childCount--,wo(n)):!s&&!i&&(n.node.children[e]=t.node,n.node.childCount++,wo(n))}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const pv=/[\[\].#$\/\u0000-\u001F\u007F]/,mv=/[\[\].#$\u0000-\u001F\u007F]/,qr=10*1024*1024,Ta=function(n){return typeof n=="string"&&n.length!==0&&!pv.test(n)},Nu=function(n){return typeof n=="string"&&n.length!==0&&!mv.test(n)},gv=function(n){return n&&(n=n.replace(/^\/*\.info(\/|$)/,"/")),Nu(n)},sr=function(n){return n===null||typeof n=="string"||typeof n=="number"&&!ur(n)||n&&typeof n=="object"&&bt(n,".sv")},ir=function(n,e,t,s){s&&e===void 0||yr(Kn(n,"value"),e,t)},yr=function(n,e,t){const s=t instanceof _e?new M_(t,n):t;if(e===void 0)throw new Error(n+"contains undefined "+pn(s));if(typeof e=="function")throw new Error(n+"contains a function "+pn(s)+" with contents = "+e.toString());if(ur(e))throw new Error(n+"contains "+e.toString()+" "+pn(s));if(typeof e=="string"&&e.length>qr/3&&ar(e)>qr)throw new Error(n+"contains a string greater than "+qr+" utf8 bytes "+pn(s)+" ('"+e.substring(0,50)+"...')");if(e&&typeof e=="object"){let i=!1,r=!1;if(Me(e,(o,a)=>{if(o===".value")i=!0;else if(o!==".priority"&&o!==".sv"&&(r=!0,!Ta(o)))throw new Error(n+" contains an invalid key ("+o+") "+pn(s)+`.  Keys must be non-empty strings and can't contain ".", "#", "$", "/", "[", or "]"`);D_(s,o),yr(n,a,s),L_(s)}),i&&r)throw new Error(n+' contains ".value" child '+pn(s)+" in addition to actual children.")}},_v=function(n,e){let t,s;for(t=0;t<e.length;t++){s=e[t];const r=Hs(s);for(let o=0;o<r.length;o++)if(!(r[o]===".priority"&&o===r.length-1)){if(!Ta(r[o]))throw new Error(n+"contains an invalid key ("+r[o]+") in path "+s.toString()+`. Keys must be non-empty strings and can't contain ".", "#", "$", "/", "[", or "]"`)}}e.sort(O_);let i=null;for(t=0;t<e.length;t++){if(s=e[t],i!==null&&tt(i,s))throw new Error(n+"contains a path "+i.toString()+" that is ancestor of another path "+s.toString());i=s}},Ou=function(n,e,t,s){const i=Kn(n,"values");if(!(e&&typeof e=="object")||Array.isArray(e))throw new Error(i+" must be an object containing the children to replace.");const r=[];Me(e,(o,a)=>{const c=new _e(o);if(yr(i,a,Te(t,c)),sa(c)===".priority"&&!sr(a))throw new Error(i+"contains an invalid value for '"+c.toString()+"', which must be a valid Firebase priority (a string, finite number, server value, or null).");r.push(c)}),_v(i,r)},yv=function(n,e,t){if(ur(e))throw new Error(Kn(n,"priority")+"is "+e.toString()+", but must be a valid Firebase priority (a string, finite number, server value, or null).");if(!sr(e))throw new Error(Kn(n,"priority")+"must be a valid Firebase priority (a string, finite number, server value, or null).")},ka=function(n,e,t,s){if(!Nu(t))throw new Error(Kn(n,e)+'was an invalid path = "'+t+`". Paths must be non-empty strings and can't contain ".", "#", "$", "[", or "]"`)},vv=function(n,e,t,s){t&&(t=t.replace(/^\/*\.info(\/|$)/,"/")),ka(n,e,t)},gn=function(n,e){if(te(e)===".info")throw new Error(n+" failed = Can't modify data under /.info/")},bv=function(n,e){const t=e.path.toString();if(typeof e.repoInfo.host!="string"||e.repoInfo.host.length===0||!Ta(e.repoInfo.namespace)&&e.repoInfo.host.split(":")[0]!=="localhost"||t.length!==0&&!gv(t))throw new Error(Kn(n,"url")+`must be a valid firebase URL and the path can't contain ".", "#", "$", "[", or "]".`)};/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class wv{constructor(){this.eventLists_=[],this.recursionDepth_=0}}function vr(n,e){let t=null;for(let s=0;s<e.length;s++){const i=e[s],r=i.getPath();t!==null&&!ia(r,t.path)&&(n.eventLists_.push(t),t=null),t===null&&(t={events:[],path:r}),t.events.push(i)}t&&n.eventLists_.push(t)}function Mu(n,e,t){vr(n,t),Du(n,s=>ia(s,e))}function st(n,e,t){vr(n,t),Du(n,s=>tt(s,e)||tt(e,s))}function Du(n,e){n.recursionDepth_++;let t=!0;for(let s=0;s<n.eventLists_.length;s++){const i=n.eventLists_[s];if(i){const r=i.path;e(r)?(Ev(n.eventLists_[s]),n.eventLists_[s]=null):t=!1}}t&&(n.eventLists_=[]),n.recursionDepth_--}function Ev(n){for(let e=0;e<n.events.length;e++){const t=n.events[e];if(t!==null){n.events[e]=null;const s=t.getEventRunner();As&&Ne("event: "+t.toString()),cs(s)}}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const Cv="repo_interrupt",Iv=25;class Sv{constructor(e,t,s,i){this.repoInfo_=e,this.forceRestClient_=t,this.authTokenProvider_=s,this.appCheckProvider_=i,this.dataUpdateCount=0,this.statsListener_=null,this.eventQueue_=new wv,this.nextWriteId_=1,this.interceptServerDataCallback_=null,this.onDisconnect_=Yi(),this.transactionQueueTree_=new Ia,this.persistentConnection_=null,this.key=this.repoInfo_.toURLString()}toString(){return(this.repoInfo_.secure?"https://":"http://")+this.repoInfo_.host}}function Tv(n,e,t){if(n.stats_=ta(n.repoInfo_),n.forceRestClient_||i_())n.server_=new Gi(n.repoInfo_,(s,i,r,o)=>{cc(n,s,i,r,o)},n.authTokenProvider_,n.appCheckProvider_),setTimeout(()=>dc(n,!0),0);else{if(typeof t<"u"&&t!==null){if(typeof t!="object")throw new Error("Only objects are supported for option databaseAuthVariableOverride");try{Ae(t)}catch(s){throw new Error("Invalid authOverride provided: "+s)}}n.persistentConnection_=new Nt(n.repoInfo_,e,(s,i,r,o)=>{cc(n,s,i,r,o)},s=>{dc(n,s)},s=>{kv(n,s)},n.authTokenProvider_,n.appCheckProvider_,t),n.server_=n.persistentConnection_}n.authTokenProvider_.addTokenChangeListener(s=>{n.server_.refreshAuthToken(s)}),n.appCheckProvider_.addTokenChangeListener(s=>{n.server_.refreshAppCheckToken(s.token)}),n.statsReporter_=c_(n.repoInfo_,()=>new ly(n.stats_,n.server_)),n.infoData_=new sy,n.infoSyncTree_=new ac({startListening:(s,i,r,o)=>{let a=[];const c=n.infoData_.getNode(s._path);return c.isEmpty()||(a=li(n.infoSyncTree_,s._path,c),setTimeout(()=>{o("ok")},0)),a},stopListening:()=>{}}),xa(n,"connected",!1),n.serverSyncTree_=new ac({startListening:(s,i,r,o)=>(n.server_.listen(s,r,i,(a,c)=>{const d=o(a,c);st(n.eventQueue_,s._path,d)}),[]),stopListening:(s,i)=>{n.server_.unlisten(s,i)}})}function Lu(n){const t=n.infoData_.getNode(new _e(".info/serverTimeOffset")).val()||0;return new Date().getTime()+t}function br(n){return lv({timestamp:Lu(n)})}function cc(n,e,t,s,i){n.dataUpdateCount++;const r=new _e(e);t=n.interceptServerDataCallback_?n.interceptServerDataCallback_(e,t):t;let o=[];if(i)if(s){const c=Li(t,d=>ke(d));o=nv(n.serverSyncTree_,r,c,i)}else{const c=ke(t);o=Cu(n.serverSyncTree_,r,c,i)}else if(s){const c=Li(t,d=>ke(d));o=Zy(n.serverSyncTree_,r,c)}else{const c=ke(t);o=li(n.serverSyncTree_,r,c)}let a=r;o.length>0&&(a=ts(n,r)),st(n.eventQueue_,a,o)}function dc(n,e){xa(n,"connected",e),e===!1&&Pv(n)}function kv(n,e){Me(e,(t,s)=>{xa(n,t,s)})}function xa(n,e,t){const s=new _e("/.info/"+e),i=ke(t);n.infoData_.updateSnapshot(s,i);const r=li(n.infoSyncTree_,s,i);st(n.eventQueue_,s,r)}function Aa(n){return n.nextWriteId_++}function xv(n,e,t){const s=sv(n.serverSyncTree_,e);return s!=null?Promise.resolve(s):n.server_.get(e).then(i=>{const r=ke(i).withIndex(e._queryParams.getIndex());bo(n.serverSyncTree_,e,t,!0);let o;if(e._queryParams.loadsAllData())o=li(n.serverSyncTree_,e._path,r);else{const a=Gs(n.serverSyncTree_,e);o=Cu(n.serverSyncTree_,e._path,r,a)}return st(n.eventQueue_,e._path,o),nr(n.serverSyncTree_,e,t,null,!0),r},i=>(di(n,"get for query "+Ae(e)+" failed: "+i),Promise.reject(new Error(i))))}function Av(n,e,t,s,i){di(n,"set",{path:e.toString(),value:t,priority:s});const r=br(n),o=ke(t,s),a=_a(n.serverSyncTree_,e),c=xu(o,a,r),d=Aa(n),h=Eu(n.serverSyncTree_,e,c,d,!0);vr(n.eventQueue_,h),n.server_.put(e.toString(),o.val(!0),(_,p)=>{const I=_==="ok";I||je("set at "+e+" failed: "+_);const S=zt(n.serverSyncTree_,d,!I);st(n.eventQueue_,e,S),rn(n,i,_,p)});const f=Pa(n,e);ts(n,f),st(n.eventQueue_,f,[])}function Rv(n,e,t,s){di(n,"update",{path:e.toString(),value:t});let i=!0;const r=br(n),o={};if(Me(t,(a,c)=>{i=!1,o[a]=ku(Te(e,a),ke(c),n.serverSyncTree_,r)}),i)Ne("update() called with empty data.  Don't do anything."),rn(n,s,"ok",void 0);else{const a=Aa(n),c=Xy(n.serverSyncTree_,e,o,a);vr(n.eventQueue_,c),n.server_.merge(e.toString(),t,(d,h)=>{const f=d==="ok";f||je("update at "+e+" failed: "+d);const _=zt(n.serverSyncTree_,a,!f),p=_.length>0?ts(n,e):e;st(n.eventQueue_,p,_),rn(n,s,d,h)}),Me(t,d=>{const h=Pa(n,Te(e,d));ts(n,h)}),st(n.eventQueue_,e,[])}}function Pv(n){di(n,"onDisconnectEvents");const e=br(n),t=Yi();po(n.onDisconnect_,me(),(i,r)=>{const o=ku(i,r,n.serverSyncTree_,e);ds(t,i,o)});let s=[];po(t,me(),(i,r)=>{s=s.concat(li(n.serverSyncTree_,i,r));const o=Pa(n,i);ts(n,o)}),n.onDisconnect_=Yi(),st(n.eventQueue_,me(),s)}function Nv(n,e,t){n.server_.onDisconnectCancel(e.toString(),(s,i)=>{s==="ok"&&fo(n.onDisconnect_,e),rn(n,t,s,i)})}function uc(n,e,t,s){const i=ke(t);n.server_.onDisconnectPut(e.toString(),i.val(!0),(r,o)=>{r==="ok"&&ds(n.onDisconnect_,e,i),rn(n,s,r,o)})}function Ov(n,e,t,s,i){const r=ke(t,s);n.server_.onDisconnectPut(e.toString(),r.val(!0),(o,a)=>{o==="ok"&&ds(n.onDisconnect_,e,r),rn(n,i,o,a)})}function Mv(n,e,t,s){if(Di(t)){Ne("onDisconnect().update() called with empty data.  Don't do anything."),rn(n,s,"ok",void 0);return}n.server_.onDisconnectMerge(e.toString(),t,(i,r)=>{i==="ok"&&Me(t,(o,a)=>{const c=ke(a);ds(n.onDisconnect_,Te(e,o),c)}),rn(n,s,i,r)})}function Dv(n,e,t){let s;te(e._path)===".info"?s=bo(n.infoSyncTree_,e,t):s=bo(n.serverSyncTree_,e,t),Mu(n.eventQueue_,e._path,s)}function hc(n,e,t){let s;te(e._path)===".info"?s=nr(n.infoSyncTree_,e,t):s=nr(n.serverSyncTree_,e,t),Mu(n.eventQueue_,e._path,s)}function Lv(n){n.persistentConnection_&&n.persistentConnection_.interrupt(Cv)}function di(n,...e){let t="";n.persistentConnection_&&(t=n.persistentConnection_.id+":"),Ne(t,...e)}function rn(n,e,t,s){e&&cs(()=>{if(t==="ok")e(null);else{const i=(t||"error").toUpperCase();let r=i;s&&(r+=": "+s);const o=new Error(r);o.code=i,e(o)}})}function Fu(n,e,t){return _a(n.serverSyncTree_,e,t)||G.EMPTY_NODE}function Ra(n,e=n.transactionQueueTree_){if(e||wr(n,e),hs(e)){const t=Uu(n,e);R(t.length>0,"Sending zero length transaction queue"),t.every(i=>i.status===0)&&Fv(n,ci(e),t)}else Ru(e)&&_r(e,t=>{Ra(n,t)})}function Fv(n,e,t){const s=t.map(d=>d.currentWriteId),i=Fu(n,e,s);let r=i;const o=i.hash();for(let d=0;d<t.length;d++){const h=t[d];R(h.status===0,"tryToSendTransactionQueue_: items in queue should all be run."),h.status=1,h.retryCount++;const f=He(e,h.path);r=r.updateChild(f,h.currentOutputSnapshotRaw)}const a=r.val(!0),c=e;n.server_.put(c.toString(),a,d=>{di(n,"transaction put response",{path:c.toString(),status:d});let h=[];if(d==="ok"){const f=[];for(let _=0;_<t.length;_++)t[_].status=2,h=h.concat(zt(n.serverSyncTree_,t[_].currentWriteId)),t[_].onComplete&&f.push(()=>t[_].onComplete(null,!0,t[_].currentOutputSnapshotResolved)),t[_].unwatcher();wr(n,Sa(n.transactionQueueTree_,e)),Ra(n,n.transactionQueueTree_),st(n.eventQueue_,e,h);for(let _=0;_<f.length;_++)cs(f[_])}else{if(d==="datastale")for(let f=0;f<t.length;f++)t[f].status===3?t[f].status=4:t[f].status=0;else{je("transaction at "+c.toString()+" failed: "+d);for(let f=0;f<t.length;f++)t[f].status=4,t[f].abortReason=d}ts(n,e)}},o)}function ts(n,e){const t=$u(n,e),s=ci(t),i=Uu(n,t);return $v(n,i,s),s}function $v(n,e,t){if(e.length===0)return;const s=[];let i=[];const o=e.filter(a=>a.status===0).map(a=>a.currentWriteId);for(let a=0;a<e.length;a++){const c=e[a],d=He(t,c.path);let h=!1,f;if(R(d!==null,"rerunTransactionsUnderNode_: relativePath should not be null."),c.status===4)h=!0,f=c.abortReason,i=i.concat(zt(n.serverSyncTree_,c.currentWriteId,!0));else if(c.status===0)if(c.retryCount>=Iv)h=!0,f="maxretry",i=i.concat(zt(n.serverSyncTree_,c.currentWriteId,!0));else{const _=Fu(n,c.path,o);c.currentInputSnapshot=_;const p=e[a].update(_.val());if(p!==void 0){yr("transaction failed: Data returned ",p,c.path);let I=ke(p);typeof p=="object"&&p!=null&&bt(p,".priority")||(I=I.updatePriority(_.getPriority()));const x=c.currentWriteId,q=br(n),Q=xu(I,_,q);c.currentOutputSnapshotRaw=I,c.currentOutputSnapshotResolved=Q,c.currentWriteId=Aa(n),o.splice(o.indexOf(x),1),i=i.concat(Eu(n.serverSyncTree_,c.path,Q,c.currentWriteId,c.applyLocally)),i=i.concat(zt(n.serverSyncTree_,x,!0))}else h=!0,f="nodata",i=i.concat(zt(n.serverSyncTree_,c.currentWriteId,!0))}st(n.eventQueue_,t,i),i=[],h&&(e[a].status=2,function(_){setTimeout(_,Math.floor(0))}(e[a].unwatcher),e[a].onComplete&&(f==="nodata"?s.push(()=>e[a].onComplete(null,!1,e[a].currentInputSnapshot)):s.push(()=>e[a].onComplete(new Error(f),!1,null))))}wr(n,n.transactionQueueTree_);for(let a=0;a<s.length;a++)cs(s[a]);Ra(n,n.transactionQueueTree_)}function $u(n,e){let t,s=n.transactionQueueTree_;for(t=te(e);t!==null&&hs(s)===void 0;)s=Sa(s,t),e=we(e),t=te(e);return s}function Uu(n,e){const t=[];return Wu(n,e,t),t.sort((s,i)=>s.order-i.order),t}function Wu(n,e,t){const s=hs(e);if(s)for(let i=0;i<s.length;i++)t.push(s[i]);_r(e,i=>{Wu(n,i,t)})}function wr(n,e){const t=hs(e);if(t){let s=0;for(let i=0;i<t.length;i++)t[i].status!==2&&(t[s]=t[i],s++);t.length=s,Au(e,t.length>0?t:void 0)}_r(e,s=>{wr(n,s)})}function Pa(n,e){const t=ci($u(n,e)),s=Sa(n.transactionQueueTree_,e);return hv(s,i=>{zr(n,i)}),zr(n,s),Pu(s,i=>{zr(n,i)}),t}function zr(n,e){const t=hs(e);if(t){const s=[];let i=[],r=-1;for(let o=0;o<t.length;o++)t[o].status===3||(t[o].status===1?(R(r===o-1,"All SENT items should be at beginning of queue."),r=o,t[o].status=3,t[o].abortReason="set"):(R(t[o].status===0,"Unexpected transaction status in abort"),t[o].unwatcher(),i=i.concat(zt(n.serverSyncTree_,t[o].currentWriteId,!0)),t[o].onComplete&&s.push(t[o].onComplete.bind(null,new Error("set"),!1,null))));r===-1?Au(e,void 0):t.length=r+1,st(n.eventQueue_,ci(e),i);for(let o=0;o<s.length;o++)cs(s[o])}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function Uv(n){let e="";const t=n.split("/");for(let s=0;s<t.length;s++)if(t[s].length>0){let i=t[s];try{i=decodeURIComponent(i.replace(/\+/g," "))}catch{}e+="/"+i}return e}function Wv(n){const e={};n.charAt(0)==="?"&&(n=n.substring(1));for(const t of n.split("&")){if(t.length===0)continue;const s=t.split("=");s.length===2?e[decodeURIComponent(s[0])]=decodeURIComponent(s[1]):je(`Invalid query segment '${t}' in query '${n}'`)}return e}const fc=function(n,e){const t=Bv(n),s=t.namespace;t.domain==="firebase.com"&&Lt(t.host+" is no longer supported. Please use <YOUR FIREBASE>.firebaseio.com instead"),(!s||s==="undefined")&&t.domain!=="localhost"&&Lt("Cannot parse Firebase url. Please use https://<YOUR FIREBASE>.firebaseio.com"),t.secure||Kg();const i=t.scheme==="ws"||t.scheme==="wss";return{repoInfo:new Vd(t.host,t.secure,s,i,e,"",s!==t.subdomain),path:new _e(t.pathString)}},Bv=function(n){let e="",t="",s="",i="",r="",o=!0,a="https",c=443;if(typeof n=="string"){let d=n.indexOf("//");d>=0&&(a=n.substring(0,d-1),n=n.substring(d+2));let h=n.indexOf("/");h===-1&&(h=n.length);let f=n.indexOf("?");f===-1&&(f=n.length),e=n.substring(0,Math.min(h,f)),h<f&&(i=Uv(n.substring(h,f)));const _=Wv(n.substring(Math.min(n.length,f)));d=e.indexOf(":"),d>=0?(o=a==="https"||a==="wss",c=parseInt(e.substring(d+1),10)):d=e.length;const p=e.slice(0,d);if(p.toLowerCase()==="localhost")t="localhost";else if(p.split(".").length<=2)t=p;else{const I=e.indexOf(".");s=e.substring(0,I).toLowerCase(),t=e.substring(I+1),r=s}"ns"in _&&(r=_.ns)}return{host:e,port:c,domain:t,subdomain:s,secure:o,scheme:a,pathString:i,namespace:r}};/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const pc="-0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ_abcdefghijklmnopqrstuvwxyz",Hv=function(){let n=0;const e=[];return function(t){const s=t===n;n=t;let i;const r=new Array(8);for(i=7;i>=0;i--)r[i]=pc.charAt(t%64),t=Math.floor(t/64);R(t===0,"Cannot push at time == 0");let o=r.join("");if(s){for(i=11;i>=0&&e[i]===63;i--)e[i]=0;e[i]++}else for(i=0;i<12;i++)e[i]=Math.floor(Math.random()*64);for(i=0;i<12;i++)o+=pc.charAt(e[i]);return R(o.length===20,"nextPushId: Length should be 20."),o}}();/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Bu{constructor(e,t,s,i){this.eventType=e,this.eventRegistration=t,this.snapshot=s,this.prevName=i}getPath(){const e=this.snapshot.ref;return this.eventType==="value"?e._path:e.parent._path}getEventType(){return this.eventType}getEventRunner(){return this.eventRegistration.getEventRunner(this)}toString(){return this.getPath().toString()+":"+this.eventType+":"+Ae(this.snapshot.exportVal())}}class Hu{constructor(e,t,s){this.eventRegistration=e,this.error=t,this.path=s}getPath(){return this.path}getEventType(){return"cancel"}getEventRunner(){return this.eventRegistration.getEventRunner(this)}toString(){return this.path.toString()+":cancel"}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class ju{constructor(e,t){this.snapshotCallback=e,this.cancelCallback=t}onValue(e,t){this.snapshotCallback.call(null,e,t)}onCancel(e){return R(this.hasCancelCallback,"Raising a cancel event on a listener with no cancel callback"),this.cancelCallback.call(null,e)}get hasCancelCallback(){return!!this.cancelCallback}matches(e){return this.snapshotCallback===e.snapshotCallback||this.snapshotCallback.userCallback!==void 0&&this.snapshotCallback.userCallback===e.snapshotCallback.userCallback&&this.snapshotCallback.context===e.snapshotCallback.context}}/**
 * @license
 * Copyright 2021 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class jv{constructor(e,t){this._repo=e,this._path=t}cancel(){const e=new mt;return Nv(this._repo,this._path,e.wrapCallback(()=>{})),e.promise}remove(){gn("OnDisconnect.remove",this._path);const e=new mt;return uc(this._repo,this._path,null,e.wrapCallback(()=>{})),e.promise}set(e){gn("OnDisconnect.set",this._path),ir("OnDisconnect.set",e,this._path,!1);const t=new mt;return uc(this._repo,this._path,e,t.wrapCallback(()=>{})),t.promise}setWithPriority(e,t){gn("OnDisconnect.setWithPriority",this._path),ir("OnDisconnect.setWithPriority",e,this._path,!1),yv("OnDisconnect.setWithPriority",t);const s=new mt;return Ov(this._repo,this._path,e,t,s.wrapCallback(()=>{})),s.promise}update(e){gn("OnDisconnect.update",this._path),Ou("OnDisconnect.update",e,this._path);const t=new mt;return Mv(this._repo,this._path,e,t.wrapCallback(()=>{})),t.promise}}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class ui{constructor(e,t,s,i){this._repo=e,this._path=t,this._queryParams=s,this._orderByCalled=i}get key(){return ne(this._path)?null:sa(this._path)}get ref(){return new wt(this._repo,this._path)}get _queryIdentifier(){const e=Jl(this._queryParams),t=Zo(e);return t==="{}"?"default":t}get _queryObject(){return Jl(this._queryParams)}isEqual(e){if(e=xe(e),!(e instanceof ui))return!1;const t=this._repo===e._repo,s=ia(this._path,e._path),i=this._queryIdentifier===e._queryIdentifier;return t&&s&&i}toJSON(){return this.toString()}toString(){return this._repo.toString()+N_(this._path)}}function Vv(n,e){if(n._orderByCalled===!0)throw new Error(e+": You can't combine multiple orderBy calls.")}function qv(n){let e=null,t=null;if(n.hasStart()&&(e=n.getIndexStartValue()),n.hasEnd()&&(t=n.getIndexEndValue()),n.getIndex()===yn){const s="Query: When ordering by key, you may only pass one argument to startAt(), endAt(), or equalTo().",i="Query: When ordering by key, the argument passed to startAt(), startAfter(), endAt(), endBefore(), or equalTo() must be a string.";if(n.hasStart()){if(n.getIndexStartName()!==En)throw new Error(s);if(typeof e!="string")throw new Error(i)}if(n.hasEnd()){if(n.getIndexEndName()!==en)throw new Error(s);if(typeof t!="string")throw new Error(i)}}else if(n.getIndex()===Se){if(e!=null&&!sr(e)||t!=null&&!sr(t))throw new Error("Query: When ordering by priority, the first argument passed to startAt(), startAfter() endAt(), endBefore(), or equalTo() must be a valid priority value (null, a number, or a string).")}else if(R(n.getIndex()instanceof aa||n.getIndex()===ou,"unknown index type."),e!=null&&typeof e=="object"||t!=null&&typeof t=="object")throw new Error("Query: First argument passed to startAt(), startAfter(), endAt(), endBefore(), or equalTo() cannot be an object.")}class wt extends ui{constructor(e,t){super(e,t,new ca,!1)}get parent(){const e=Zd(this._path);return e===null?null:new wt(this._repo,e)}get root(){let e=this;for(;e.parent!==null;)e=e.parent;return e}}class ns{constructor(e,t,s){this._node=e,this.ref=t,this._index=s}get priority(){return this._node.getPriority().val()}get key(){return this.ref.key}get size(){return this._node.numChildren()}child(e){const t=new _e(e),s=ss(this.ref,e);return new ns(this._node.getChild(t),s,Se)}exists(){return!this._node.isEmpty()}exportVal(){return this._node.val(!0)}forEach(e){return this._node.isLeafNode()?!1:!!this._node.forEachChild(this._index,(s,i)=>e(new ns(i,ss(this.ref,s),Se)))}hasChild(e){const t=new _e(e);return!this._node.getChild(t).isEmpty()}hasChildren(){return this._node.isLeafNode()?!1:!this._node.isEmpty()}toJSON(){return this.exportVal()}val(){return this._node.val()}}function H(n,e){return n=xe(n),n._checkNotDeleted("ref"),e!==void 0?ss(n._root,e):n._root}function ss(n,e){return n=xe(n),te(n._path)===null?vv("child","path",e):ka("child","path",e),new wt(n._repo,Te(n._path,e))}function rr(n){return n=xe(n),new jv(n._repo,n._path)}function zn(n,e){n=xe(n),gn("push",n._path),ir("push",e,n._path,!0);const t=Lu(n._repo),s=Hv(t),i=ss(n,s),r=ss(n,s);let o;return e!=null?o=it(r,e).then(()=>r):o=Promise.resolve(r),i.then=o.then.bind(o),i.catch=o.then.bind(o,void 0),i}function Sn(n){return gn("remove",n._path),it(n,null)}function it(n,e){n=xe(n),gn("set",n._path),ir("set",e,n._path,!1);const t=new mt;return Av(n._repo,n._path,e,null,t.wrapCallback(()=>{})),t.promise}function Oe(n,e){Ou("update",e,n._path);const t=new mt;return Rv(n._repo,n._path,e,t.wrapCallback(()=>{})),t.promise}function hi(n){n=xe(n);const e=new ju(()=>{}),t=new Er(e);return xv(n._repo,n,t).then(s=>new ns(s,new wt(n._repo,n._path),n._queryParams.getIndex()))}class Er{constructor(e){this.callbackContext=e}respondsTo(e){return e==="value"}createEvent(e,t){const s=t._queryParams.getIndex();return new Bu("value",this,new ns(e.snapshotNode,new wt(t._repo,t._path),s))}getEventRunner(e){return e.getEventType()==="cancel"?()=>this.callbackContext.onCancel(e.error):()=>this.callbackContext.onValue(e.snapshot,null)}createCancelEvent(e,t){return this.callbackContext.hasCancelCallback?new Hu(this,e,t):null}matches(e){return e instanceof Er?!e.callbackContext||!this.callbackContext?!0:e.callbackContext.matches(this.callbackContext):!1}hasAnyCallback(){return this.callbackContext!==null}}class Na{constructor(e,t){this.eventType=e,this.callbackContext=t}respondsTo(e){let t=e==="children_added"?"child_added":e;return t=t==="children_removed"?"child_removed":t,this.eventType===t}createCancelEvent(e,t){return this.callbackContext.hasCancelCallback?new Hu(this,e,t):null}createEvent(e,t){R(e.childName!=null,"Child events should have a childName.");const s=ss(new wt(t._repo,t._path),e.childName),i=t._queryParams.getIndex();return new Bu(e.type,this,new ns(e.snapshotNode,s,i),e.prevName)}getEventRunner(e){return e.getEventType()==="cancel"?()=>this.callbackContext.onCancel(e.error):()=>this.callbackContext.onValue(e.snapshot,e.prevName)}matches(e){return e instanceof Na?this.eventType===e.eventType&&(!this.callbackContext||!e.callbackContext||this.callbackContext.matches(e.callbackContext)):!1}hasAnyCallback(){return!!this.callbackContext}}function Cr(n,e,t,s,i){let r;if(typeof s=="object"&&(r=void 0,i=s),typeof s=="function"&&(r=s),i&&i.onlyOnce){const c=t,d=(h,f)=>{hc(n._repo,n,a),c(h,f)};d.userCallback=t.userCallback,d.context=t.context,t=d}const o=new ju(t,r||void 0),a=e==="value"?new Er(o):new Na(e,o);return Dv(n._repo,n,a),()=>hc(n._repo,n,a)}function Ot(n,e,t,s){return Cr(n,"value",e,t,s)}function Ms(n,e,t,s){return Cr(n,"child_added",e,t,s)}function zv(n,e,t,s){return Cr(n,"child_changed",e,t,s)}function Gv(n,e,t,s){return Cr(n,"child_removed",e,t,s)}class Vu{}class Yv extends Vu{constructor(e){super(),this._limit=e,this.type="limitToLast"}_apply(e){if(e._queryParams.hasLimit())throw new Error("limitToLast: Limit was already set (by another call to limitToFirst or limitToLast).");return new ui(e._repo,e._path,ty(e._queryParams,this._limit),e._orderByCalled)}}function Ys(n){if(typeof n!="number"||Math.floor(n)!==n||n<=0)throw new Error("limitToLast: First argument must be a positive integer.");return new Yv(n)}class Kv extends Vu{constructor(e){super(),this._path=e,this.type="orderByChild"}_apply(e){Vv(e,"orderByChild");const t=new _e(this._path);if(ne(t))throw new Error("orderByChild: cannot pass in empty path. Use orderByValue() instead.");const s=new aa(t),i=ny(e._queryParams,s);return qv(i),new ui(e._repo,e._path,i,!0)}}function Ks(n){return ka("orderByChild","path",n),new Kv(n)}function Qs(n,...e){let t=xe(n);for(const s of e)t=s._apply(t);return t}Vy(wt);Ky(wt);/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const Qv="FIREBASE_DATABASE_EMULATOR_HOST",Eo={};let Jv=!1;function Xv(n,e,t,s){n.repoInfo_=new Vd(`${e}:${t}`,!1,n.repoInfo_.namespace,n.repoInfo_.webSocketOnly,n.repoInfo_.nodeAdmin,n.repoInfo_.persistenceKey,n.repoInfo_.includeNamespaceInQueryParams,!0),s&&(n.authTokenProvider_=s)}function Zv(n,e,t,s,i){let r=s||n.options.databaseURL;r===void 0&&(n.options.projectId||Lt("Can't determine Firebase Database URL. Be sure to include  a Project ID when calling firebase.initializeApp()."),Ne("Using default host for project ",n.options.projectId),r=`${n.options.projectId}-default-rtdb.firebaseio.com`);let o=fc(r,i),a=o.repoInfo,c;typeof process<"u"&&Ol&&(c=Ol[Qv]),c?(r=`http://${c}?ns=${a.namespace}`,o=fc(r,i),a=o.repoInfo):o.repoInfo.secure;const d=new o_(n.name,n.options,e);bv("Invalid Firebase Database URL",o),ne(o.path)||Lt("Database URL must point to the root of a Firebase Database (not including a child path).");const h=tb(a,n,d,new r_(n.name,t));return new nb(h,n)}function eb(n,e){const t=Eo[e];(!t||t[n.key]!==n)&&Lt(`Database ${e}(${n.repoInfo_}) has already been deleted.`),Lv(n),delete t[n.key]}function tb(n,e,t,s){let i=Eo[e.name];i||(i={},Eo[e.name]=i);let r=i[n.toURLString()];return r&&Lt("Database initialized multiple times. Please make sure the format of the database URL matches with each database() call."),r=new Sv(n,Jv,t,s),i[n.toURLString()]=r,r}class nb{constructor(e,t){this._repoInternal=e,this.app=t,this.type="database",this._instanceStarted=!1}get _repo(){return this._instanceStarted||(Tv(this._repoInternal,this.app.options.appId,this.app.options.databaseAuthVariableOverride),this._instanceStarted=!0),this._repoInternal}get _root(){return this._rootInternal||(this._rootInternal=new wt(this._repo,me())),this._rootInternal}_delete(){return this._rootInternal!==null&&(eb(this._repo,this.app.name),this._repoInternal=null,this._rootInternal=null),Promise.resolve()}_checkNotDeleted(e){this._rootInternal===null&&Lt("Cannot call "+e+" on a deleted database.")}}function sb(n=zc(),e){const t=jo(n,"database").getImmediate({identifier:e});if(!t._instanceStarted){const s=Xh("database");s&&ib(t,...s)}return t}function ib(n,e,t,s={}){n=xe(n),n._checkNotDeleted("useEmulator"),n._instanceStarted&&Lt("Cannot call useEmulator() after instance has already been initialized.");const i=n._repoInternal;let r;if(i.repoInfo_.nodeAdmin)s.mockUserToken&&Lt('mockUserToken is not supported by the Admin SDK. For client access with mock users, please use the "firebase" package instead of "firebase-admin".'),r=new Ni(Ni.OWNER);else if(s.mockUserToken){const o=typeof s.mockUserToken=="string"?s.mockUserToken:Zh(s.mockUserToken,n.app.options.projectId);r=new Ni(o)}Xv(i,e,t,r)}/**
 * @license
 * Copyright 2021 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function rb(n){jg(ls),Qn(new vn("database",(e,{instanceIdentifier:t})=>{const s=e.getProvider("app").getImmediate(),i=e.getProvider("auth-internal"),r=e.getProvider("app-check-internal");return Zv(s,i,r,t)},"PUBLIC").setMultipleInstances(!0)),Jt(Ml,Dl,n),Jt(Ml,Dl,"esm2017")}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const ob={".sv":"timestamp"};function Xe(){return ob}Nt.prototype.simpleListen=function(n,e){this.sendRequest("q",{p:n},e)};Nt.prototype.echo=function(n,e){this.sendRequest("echo",{d:n},e)};rb();const qu={apiKey:"AIzaSyAXWr1bW5FljYLu7levh_P6w0rrbdhVToE",authDomain:"playlist-lobby.firebaseapp.com",databaseURL:"https://playlist-lobby-default-rtdb.europe-west1.firebasedatabase.app",projectId:"playlist-lobby",appId:"1:98113831672:web:caae55b5c34ba63688310d"},ab=!qu.apiKey.startsWith("PASTE"),zu=ab,lb=qu,Gu=qc(lb,"hotel"),fs=Ug(Gu),j=sb(Gu);class Yu{constructor(e,t,s,i,r,o,a,c,d){switch(this.direction=t,this.headDirection=s,this.isHeadOnly=a,this.isBodyOnly=c,this.scale=d,this.isDownsampled=!1,this.isLarge=!1,this.isSmall=!1,this.rectWidth=64,this.rectHeight=110,d){case"l":this.isLarge=!0,this.rectWidth=128,this.rectHeight=220;break;case"s":this.isSmall=!0,this.rectWidth=32,this.rectHeight=55;break;case"d":this.isDownsampled=!0;break}switch(this.figure=cb(e),this.frame=o,this.drawAction={body:"std"},this.handItem=-1,this.drawOrder="std",this.gesture=r,r){case"spk":this.drawAction.speak="spk";break;case"eyb":this.drawAction.eye="eyb";break;case"":this.drawAction.gesture="std";break;default:this.drawAction.gesture=r;break}this.action=i;for(let h of this.action){const f=h.split("=");switch(f[0]){case"wlk":this.drawAction.wlk="wlk";break;case"sit":this.drawAction.sit="sit";break;case"lay":this.drawAction.body="lay",this.drawAction.eye="lay";const _=this.rectWidth;switch(this.rectWidth=this.rectHeight,this.rectHeight=_,this.gesture){case"spk":this.drawAction.speak="lsp";break;case"eyb":this.drawAction.eye="ley";break;case"std":this.drawAction.gesture="lay";break;default:this.drawAction.gesture="l"+this.gesture.substr(0,2);break}break;case"wav":this.drawAction.handLeft="wav";break;case"crr":case"drk":this.drawAction.handRight=f[0],this.drawAction.itemRight=f[0],this.handItem=Number(f[1]);break;case"swm":this.drawAction.swm="swm",this.gesture==="spk"&&(this.drawAction.speak="sws");break;case"":this.drawAction.body="std";break;default:this.drawAction.body=f[0];break}}this.drawAction.sit==="sit"&&(this.direction>=2&&this.direction<=4?(this.drawOrder="sit",this.drawAction.handRight==="drk"&&this.direction>=2&&this.direction<=3?this.drawOrder+=".rh-up":this.drawAction.handLeft&&this.direction===4&&(this.drawOrder+=".lh-up")):this.drawAction.body==="lay"?this.drawOrder="lay":this.drawAction.handRight==="drk"&&this.direction>=0&&this.direction<=3?this.drawOrder="rh-up":this.drawAction.handLeft&&this.direction>=4&&this.direction<=6&&(this.drawOrder="lh-up"))}}const cb=n=>{const e={},t=[];for(let s of n.split(".")){const i=s.split("-"),r={type:i[0],id:i[1],colors:[i[2]]};i[3]!=null&&r.colors.push(i[3]),e[r.type]=r}for(let s in e)t.push(e[s]);return t},Ku=(n,e,t)=>{const s=n.frames[t];if(s==null)return null;const{x:i,y:r,w:o,h:a}=s.frame,c=document.createElement("canvas");c.width=o,c.height=a;const d=c.getContext("2d");return d!=null?(c.width=o,c.height=a,d.drawImage(e,i,r,o,a,0,0,o,a),c):null};class db{constructor(e,t,s,i,r,o,a,c){this.resDirection=o,s==="hd"&&i&&(r=1),s==="ey"&&t==="std"&&r===1&&o===3&&(t="sml"),s==="fa"&&t==="std"&&r===2&&(o===2||o===4)&&(this.resDirection=1),s==="he"&&t==="std"&&r===1&&o===2&&(this.resDirection=0),s==="he"&&t==="std"&&r===8&&(this.resDirection=o%2===0?1:this.resDirection),s==="he"&&t==="std"&&(r===2131||r===2132)&&o>=2&&o<=6&&(this.resDirection=1),s==="ha"&&t==="std"&&r===2518&&(this.resDirection=o%2===0?2:1),s==="ha"&&t==="std"&&r===2519&&(this.resDirection=o%2===0?2:3),s==="ha"&&t==="std"&&r===2588&&(this.resDirection=7),s==="ha"&&t==="std"&&r===2589&&(this.resDirection=3),this.lib=e,this.isFlip=!1,this.action=t,this.resAction=t,this.type=s,this.resType=s,this.isSmall=i,this.partId=r,this.direction=o,this.frame=a,this.resFrame=a,this.color=c,this.resourceName=this.getResourceName(),this.promise=null,this.resource=null}getResourceName(){let e=this.isSmall?"sh":"h";return e+="_",e+=this.resAction,e+="_",e+=this.resType,e+="_",e+=this.partId,e+="_",e+=this.resDirection,e+="_",e+=this.resFrame,e}extractFromAtlas(e,t){const s=Ku(e,t,this.lib+"_"+this.getResourceName()+".png");return s!=null&&(this.resource=s,this.promise=Promise.resolve(s)),this.promise}downloadAsync(e){if(this.promise==null){let t=new Image;this.promise=new Promise((s,i)=>{t.onload=()=>{this.resource=t,s(t)},t.onerror=()=>{i("Could not load image: "+t.src)}}),t.crossOrigin="anonymous",t.src=e+this.lib+"/"+this.lib+"_"+this.getResourceName()+".png"}return this.promise}}class ub{constructor(e){this.ready=!1,this.offsets={},this.chunks={},this.figuremap={},this.figuredata={},this.partsets={},this.draworder={},this.animation={},this.resourcesUrl=e}initialize(){const e=this.loadFiles();return Promise.all(e).then(()=>{this.ready=!0})}loadFiles(){return[this.fetchJsonAsync(this.resourcesUrl+"map.json").then(e=>{this.figuremap=e}),this.fetchJsonAsync(this.resourcesUrl+"figuredata.json").then(e=>{this.figuredata=e}),this.fetchJsonAsync(this.resourcesUrl+"partsets.json").then(e=>{this.partsets=e}),this.fetchJsonAsync(this.resourcesUrl+"draworder.json").then(e=>{this.draworder=e}),this.fetchJsonAsync(this.resourcesUrl+"animation.json").then(e=>{this.animation=e})]}fetchJsonAsync(e){return new Promise((t,s)=>{fetch(e,{method:"GET",mode:"cors",cache:"default"}).then(r=>r.json()).then(r=>t(r)).catch(r=>s(r))})}downloadAtlasAsync(e){let t=new Image,s=new Promise((i,r)=>{t.onload=()=>{i(t)},t.onerror=()=>{r("Could not load image: "+t.src)}});return t.crossOrigin="anonymous",t.src=this.resourcesUrl+e+"/atlas.png",s}fetchOffsetAsync(e){const t=this.fetchJsonAsync(this.resourcesUrl+e+"/offset.json").then(i=>{this.offsets[e].data=i}),s=this.downloadAtlasAsync(e).then(i=>{this.offsets[e].atlas=i});return Promise.all([t,s])}getTypeColorId(e,t){const s=new Yu(e,0,0,["std"],"std",0,!1,!1,"d");let i=0;for(let r of s.figure)if(r.type===t){const o=this.getPartColor(r);for(let a in o){const c=o[a];for(let d of c)if(d.color!=null)return i=parseInt(d.color,16),i}}return i}getChatColor(e){return this.getTypeColorId(e,"ch")}generateGeneric(e,t){const s={};s.rect=this.getActivePartSet(e.isHeadOnly?"head":"figure"),s.head=this.getActivePartSet("head"),s.eye=this.getActivePartSet("eye"),s.gesture=this.getActivePartSet("gesture"),s.speak=this.getActivePartSet("speak"),s.walk=this.getActivePartSet("walk"),s.sit=this.getActivePartSet("sit"),s.itemRight=this.getActivePartSet("itemRight"),s.handRight=this.getActivePartSet("handRight"),s.handLeft=this.getActivePartSet("handLeft"),s.swim=this.getActivePartSet("swim");let i=this.getDrawOrder(e.drawOrder,e.direction);i==null&&(i=this.getDrawOrder("std",e.direction));const r={};for(let c of e.figure){const d=this.getPartColor(c);for(let h in d)r[h]==null&&(r[h]=[]),r[h]=d[h].concat(r[h])}e.handItem>0&&(r.ri=[{index:0,id:e.handItem}]);const o=[],a=[];for(let c of i){const d=r[c];if(d!=null)for(let h of d){const f=this.getPartUniqueName(c,h.id);if(f!=null){if(r.hidden.includes(c)||s.head.includes(c)&&e.isBodyOnly||!s.rect.includes(c)||t&&(s.gesture.includes(c)||s.eye.includes(c)))continue;let _=e.direction,p=null;if(s.rect.includes(c)&&(p=e.drawAction.body),s.head.includes(c)&&(_=e.headDirection),s.speak.includes(c)&&e.drawAction.speak&&(p=e.drawAction.speak),s.gesture.includes(c)&&e.drawAction.gesture&&(p=e.drawAction.gesture),s.eye.includes(c)&&(h.colorable=!1,e.drawAction.eye&&(p=e.drawAction.eye)),s.walk.includes(c)&&e.drawAction.wlk&&(p=e.drawAction.wlk),s.sit.includes(c)&&e.drawAction.sit&&(p=e.drawAction.sit),s.handRight.includes(c)&&e.drawAction.handRight&&(p=e.drawAction.handRight),s.itemRight.includes(c)&&e.drawAction.itemRight&&(p=e.drawAction.itemRight),s.handLeft.includes(c)&&e.drawAction.handLeft&&(p=e.drawAction.handLeft),s.swim.includes(c)&&e.drawAction.swm&&(p=e.drawAction.swm),p==null)continue;this.offsets[f]==null&&(this.offsets[f]={promise:this.fetchOffsetAsync(f),data:{},atlas:{}}),a.push(this.offsets[f].promise);const I=h.colorable?h.color:null,S=this.getPartResource(f,p,c,e.isSmall,h.id,_,e.frame,I);o.push(S)}}}return new Promise((c,d)=>{Promise.all(a).then(()=>{let h=document.createElement("canvas"),f=h.getContext("2d");h.width=e.rectWidth,h.height=e.rectHeight;const _=[];for(let p of o)if(this.offsets[p.lib].data!=null&&this.offsets[p.lib].data[p.getResourceName()]!=null&&!this.offsets[p.lib].data[p.getResourceName()].flipped){const I=this.offsets[p.lib].data.atlas,S=this.offsets[p.lib].atlas;_.push(p.extractFromAtlas(I,S))}else{let I=this.partsets.partSet[p.type]["flipped-set-type"];if(I!==""&&(p.resType=I),p.action==="std"&&(this.offsets[p.lib].data==null||this.offsets[p.lib].data[p.getResourceName()]==null||this.offsets[p.lib].data[p.getResourceName()].flipped)&&(p.resAction="spk"),(this.offsets[p.lib].data==null||this.offsets[p.lib].data[p.getResourceName()]==null||this.offsets[p.lib].data[p.getResourceName()].flipped)&&(p.isFlip=!0,p.resAction=p.action,p.resDirection=6-p.direction),(this.offsets[p.lib].data==null||this.offsets[p.lib].data[p.getResourceName()]==null||this.offsets[p.lib].data[p.getResourceName()].flipped)&&(p.resFrame=p.frame+1,p.isFlip=!1),(this.offsets[p.lib].data==null||this.offsets[p.lib].data[p.getResourceName()]==null||this.offsets[p.lib].data[p.getResourceName()].flipped)&&(p.isFlip=!1,p.resFrame=p.frame,p.resAction=p.action,p.direction===7&&(p.resDirection=3),p.direction===3&&(p.resDirection=7)),(this.offsets[p.lib].data==null||this.offsets[p.lib].data[p.getResourceName()]==null||this.offsets[p.lib].data[p.getResourceName()].flipped)&&(p.resFrame=p.frame+1,p.isFlip=!1),(this.offsets[p.lib].data==null||this.offsets[p.lib].data[p.getResourceName()]==null||this.offsets[p.lib].data[p.getResourceName()].flipped)&&(p.resAction=p.action,p.resType=I,p.resDirection=p.direction),p.action==="std"&&(this.offsets[p.lib].data==null||this.offsets[p.lib].data[p.getResourceName()]==null||this.offsets[p.lib].data[p.getResourceName()].flipped)&&(p.resAction="spk",p.resType=p.type),this.offsets[p.lib].data!=null&&this.offsets[p.lib].data[p.getResourceName()]!=null&&!this.offsets[p.lib].data[p.getResourceName()].flipped){const S=this.offsets[p.lib].data.atlas,x=this.offsets[p.lib].atlas;_.push(p.extractFromAtlas(S,x))}}Promise.all(_).catch(p=>{d("Error downloading chunks")}).then(()=>{for(let p of o)if(this.offsets[p.lib].data!=null&&this.offsets[p.lib].data[p.getResourceName()]!=null&&p.resource!=null){let I=-this.offsets[p.lib].data[p.getResourceName()].x,S=e.rectHeight/2-this.offsets[p.lib].data[p.getResourceName()].y+e.rectHeight/2.5,x=p.resource;p.color!=null&&(x=this.tintSprite(x,p.color,t?170:255)),p.isFlip&&(I=-(I+x.width-e.rectWidth+1),x=this.flipImage(x)),f!=null&&f.drawImage(x,I,S)}e.isDownsampled&&(h=this.downsampleImage(h)),c(h)})})})}getActivePartSet(e){const t=this.partsets.activePartSet[e].activePart;return t==null||t.length===0?null:t}getDrawOrder(e,t){const s=this.draworder[e][t];return s==null||s.length===0?null:s}getPartPalette(e){let t=this.figuredata.settype[e];if(t!=null){const s=t.paletteid;return this.figuredata.palette[s]}return null}getPartPaletteCount(e,t){const s=this.getPartSet(e);if(s!=null){const i=s[t];if(i!=null){const r=i.part,o=Math.max.apply(Math,r.map(a=>a.colorindex));return Math.max(1,o)}}return 1}getPartSet(e){let t=this.figuredata.settype[e];return t!=null?t.set:null}getPartColor(e){const t={};let s=this.figuredata.settype[e.type];if(s!=null){if(s.set[e.id]!=null&&s.set[e.id].part!=null)for(let i of s.set[e.id].part){const r=i;let o={index:r.index,id:r.id,colorable:r.colorable};r.colorable&&(o.color=this.getColorByPaletteId(s.paletteid,e.colors[r.colorindex-1])),t[r.type]==null?t[r.type]=[o]:t[r.type].push(o)}if(t.hidden=[],s.set[e.id]!=null&&Array.isArray(s.set[e.id].hidden))for(let i of s.set[e.id].hidden)t.hidden.push(i)}return t}getColorByPaletteId(e,t){return this.figuredata.palette[e]!=null&&this.figuredata.palette[e][t]!=null&&this.figuredata.palette[e][t].color!=null?this.figuredata.palette[e][t].color:null}getPartUniqueName(e,t){let s=this.figuremap[e][t];return s==null&&e==="hrb"&&(s=this.figuremap.hr[t]),s==null&&(s=this.figuremap[e][1]),s==null&&(s=this.figuremap[e][0]),s}getPartResource(e,t,s,i,r,o,a,c){let d=this.getFrameNumber(s,t,a),h=new db(e,t,s,i,r,o,d,c),f=h.getResourceName();return this.chunks[f]!=null&&this.chunks[f].resource!=null?(h.resource=this.chunks[f].resource,h.promise=this.chunks[f].promise):this.chunks[f]=h,h}getFrameNumber(e,t,s){const i={wav:"Wave",wlk:"Move",spk:"Talk"};if(i[t]!=null&&this.animation[i[t]].part[e]!=null){const r=this.animation[i[t]].part[e].length;if(this.animation[i[t]].part[e][s%r]!=null)return this.animation[i[t]].part[e][s%r].number}return 0}tintSprite(e,t,s){let i=document.createElement("canvas"),r=i.getContext("2d");if(r==null)return null;let o=this.hex2rgb(t),a=e.width,c=e.height;i.width=a,i.height=c,r.drawImage(e,0,0);let d=r.getImageData(0,0,a,c);for(let h=0;h<c;h++){let f=h*a*4;for(let _=0;_<a;_++)f++,f++,f++,d.data[f++]!==0&&(d.data[f-1]=s,d.data[f-2]=Math.round(o.b*d.data[f-2]/255),d.data[f-3]=Math.round(o.g*d.data[f-3]/255),d.data[f-4]=Math.round(o.r*d.data[f-4]/255))}return r.putImageData(d,0,0),i}hex2rgb(e){const t=/^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(e);return t?{r:parseInt(t[1],16),g:parseInt(t[2],16),b:parseInt(t[3],16)}:null}flipImage(e){let t=document.createElement("canvas"),s=t.getContext("2d");if(s==null)return null;let i=e.width,r=e.height;return t.width=i,t.height=r,s.save(),s.scale(-1,1),s.drawImage(e,0,0,i*-1,r),s.restore(),t}downsampleImage(e){let t=document.createElement("canvas"),s=t.getContext("2d");if(s==null)return null;let i=e.width,r=e.height;return t.width=i,t.height=r,s.save(),s.scale(.5,.5),s.drawImage(e,0,0),s.restore(),t}}const Co="https://images.bobba.io/gordon/PRODUCTION-202006192205-424220153/",Tn=new ub(Co),Oa=Tn.initialize(),Io=new Map,Gr=new Map;function Qu(n){return[n.figure,n.dir,n.headDir??n.dir,(n.actions??["std"]).join("+"),n.gesture??"std",n.frame??0,n.headOnly?1:0].join("|")}function hb(n){return Io.get(Qu(n))}function Ft(n){const e=Qu(n),t=Io.get(e);if(t)return Promise.resolve(t);const s=Gr.get(e);if(s)return s;const i=Oa.then(()=>{const r=new Yu(n.figure,n.dir&7,(n.headDir??n.dir)&7,n.actions??["std"],n.gesture??"std",n.frame??0,!!n.headOnly,!1,"n");return Tn.generateGeneric(r,!1)}).then(r=>(Io.set(e,r),r)).catch(r=>(console.warn("avatar render failed",n.figure,r),null)).finally(()=>Gr.delete(e));return Gr.set(e,i),i}const Gt=[{id:"hd",label:"Face & skin",headOnly:!0,required:!0},{id:"hr",label:"Hair",headOnly:!0,required:!1},{id:"ha",label:"Hats",headOnly:!0,required:!1},{id:"he",label:"Head items",headOnly:!0,required:!1},{id:"ea",label:"Glasses",headOnly:!0,required:!1},{id:"fa",label:"Face items",headOnly:!0,required:!1},{id:"ch",label:"Shirts",headOnly:!1,required:!0},{id:"cc",label:"Jackets",headOnly:!1,required:!1},{id:"cp",label:"Prints",headOnly:!1,required:!1},{id:"ca",label:"Chest items",headOnly:!1,required:!1},{id:"lg",label:"Trousers",headOnly:!1,required:!0},{id:"sh",label:"Shoes",headOnly:!1,required:!0},{id:"wa",label:"Belts",headOnly:!1,required:!1}],Ds={M:"hr-115-42.hd-190-1.ch-215-62.lg-285-91.sh-290-62",F:"hr-515-33.hd-600-1.ch-635-70.lg-716-66-62.sh-735-68"},fb={hd:20,hr:40,ha:60,he:45,ea:45,fa:40,ch:50,cc:70,cp:40,ca:55,lg:45,sh:35,wa:50};function pb(n){let e=0;for(let t=0;t<n.length;t++)e=e*31+n.charCodeAt(t)>>>0;return e}function mc(n,e){return`${n}_${e}`}let nt=null;const Ju={};async function mb(){if(await Oa,nt)return;const n=Tn.figuredata;nt={};const e=new Set(Object.values(Ds).flatMap(t=>Object.entries(Ls(t)).map(([s,i])=>mc(s,i.id))));for(const t of Gt){const s=n.settype[t.id];if(!s){nt[t.id]=[];continue}const i=[];for(const[o,a]of Object.entries(s.set)){if(!a.selectable||a.club>0)continue;const c=Math.max(0,...a.part.map(_=>_.colorindex||0)),d=mc(t.id,o),h=!!a.preselectable||e.has(d),f=h?0:Math.max(1,Math.round((fb[t.id]+pb(t.id+o)%6*10)/25));i.push({type:t.id,id:o,gender:a.gender,colors:c,price:f,key:d,basePrice:f,starter:h,shopOn:!h})}i.sort((o,a)=>o.price-a.price||Number(o.id)-Number(a.id)),nt[t.id]=i;const r=n.palette[s.paletteid]??{};Ju[t.id]=Object.entries(r).filter(([,o])=>o.club===0&&o.selectable).sort((o,a)=>o[1].index-a[1].index).map(([o,a])=>({id:o,hex:a.color}))}}function gb(n){for(const e of Object.values(nt??{}))for(const t of e){if(t.starter)continue;const s=n[t.key];t.price=s?s.price:t.basePrice,t.shopOn=s?s.on:!0}}function _b(){return nt??{}}function yb(n,e){return((nt==null?void 0:nt[n])??[]).filter(t=>t.gender==="U"||t.gender===e)}function Ma(n){return Ju[n]??[]}function Xu(n,e){var t;return(t=nt==null?void 0:nt[n])==null?void 0:t.find(s=>s.id===e)}function So(n,e){return n.price===0||!!e[n.key]}function Ls(n){const e={};for(const t of n.split(".")){const[s,i,...r]=t.split("-");s&&i&&(e[s]={id:i,colors:r})}return e}function Is(n){return Gt.filter(e=>n[e.id]).map(e=>[e.id,n[e.id].id,...n[e.id].colors].join("-")).join(".")}function gc(n,e){var i;const t=Ma(n.type),s=[];for(let r=0;r<n.colors;r++){const o=e==null?void 0:e.colors[r];s.push(o&&t.some(a=>a.id===o)?o:((i=t[Math.min(r*3,t.length-1)])==null?void 0:i.id)??"1")}return s}function vb(n,e){const t=[];for(const[s,i]of Object.entries(n)){if(!i)continue;const r=Xu(s,i.id);r&&!So(r,e)&&t.push(r)}return t}const Je=n=>"./"+n.replace(/^\/+/,""),vt={syringe:{id:"syringe",name:"Syringe",examine:"A clean syringe. Click it to draw blood from yourself: 2 drops of blood, once a day.",icon:Je("items/syringe.svg"),useSelf:"syringe"},cd:{id:"cd",name:"CD",examine:"A scratched CD with a handwritten label. Use it on the CD player in the lobby so everyone can hear it. It comes back when it's done.",icon:Je("items/cd.svg"),useOnObject:"cdplayer"},knife:{id:"knife",name:"Knife",examine:"A small, sharp knife. Use it on another player: you can stab each person once a day, and every stab draws a drop of blood.",icon:Je("items/knife.svg"),useOnPlayer:"stab"}},Da=28,Zu=()=>Array.from({length:Da},()=>null);function bb(n){const e=Zu();if(!n||typeof n!="object")return e;for(const[t,s]of Object.entries(n)){const i=Number(t);s&&i>=0&&i<Da&&vt[s.item]&&(e[i]={item:s.item,qty:s.qty??1,...s.inPlayer?{inPlayer:!0}:{}})}return e}const vs=(n,e)=>n.findIndex(t=>(t==null?void 0:t.item)===e&&!t.inPlayer),wb=(n,e)=>n.findIndex(t=>(t==null?void 0:t.item)===e),kn=Je("items/blood.svg"),To=5,ko="access_music",Eb=4,Cb=8,Fs=2,eh=864e5,th=["knife","cd","syringe"];let nh=0;zu&&Ot(H(j,".info/serverTimeOffset"),n=>{nh=Number(n.val())||0});const dt=()=>Date.now()+nh,on=()=>{const n=dt();return n-n%eh},xo=()=>on()+eh-dt(),_c=(n,e)=>(n.stabs[e]??0)<on(),Ib=n=>Object.values(n.stabs).filter(e=>e>=on()).length,sh=n=>n.syringeDay<on();async function ih(n,e){const t=Zu(),s={};th.forEach((r,o)=>{t[o]={item:r,qty:1},s[o]={item:r,qty:1}});const i={uid:n,name:e,gender:"M",figure:"",blood:To,owned:{},wardrobe:{},inventory:t,stabs:{},syringeDay:0,isAdmin:!1};return await it(H(j,`users/${n}`),{name:e,gender:i.gender,figure:i.figure,blood:i.blood,inventory:s,createdAt:Xe()}),i}async function Sb(n,e=!1){const t=await hi(H(j,`users/${n}`));if(!t.exists())return null;const s=t.val(),i={uid:n,name:s.name,gender:s.gender==="F"?"F":"M",figure:s.figure??"",blood:s.blood??0,owned:s.owned??{},wardrobe:s.wardrobe??{},inventory:bb(s.inventory),stabs:s.stabs??{},syringeDay:s.syringeDay??0,isAdmin:e},r={};s.blood===void 0&&(i.blood=To,r.blood=To),s.createdAt===void 0&&(r.createdAt=Xe());for(const o of th){if(wb(i.inventory,o)>=0)continue;const a=i.inventory.findIndex(c=>c===null);a<0||(i.inventory[a]={item:o,qty:1},r[`inventory/${a}`]={item:o,qty:1})}return Object.keys(r).length&&await Oe(H(j,`users/${n}`),r),i}async function Ao(n,e,t){await Oe(H(j,`users/${n.uid}`),{figure:e,gender:t}),await Oe(H(j,`profiles/${n.uid}`),{name:n.name,figure:e}).catch(()=>{}),n.figure=e,n.gender=t}async function La(n,e,t){if(t>n.blood)throw new Error("Not enough drops of blood");const s={blood:n.blood-t};for(const i of e)s[`owned/${i}`]=!0;await Oe(H(j,`users/${n.uid}`),s),n.blood-=t;for(const i of e)n.owned[i]=!0}async function Tb(n,e,t){if(t>n.blood)throw new Error("Not enough drops of blood");const s=n.inventory.findIndex(i=>i===null);if(s<0)throw new Error("Your inventory is full");await Oe(H(j,`users/${n.uid}`),{blood:n.blood-t,[`inventory/${s}`]:{item:e,qty:1}}),n.blood-=t,n.inventory[s]={item:e,qty:1}}async function kb(n,e){const t=on();await Oe(H(j,`users/${n.uid}`),{blood:n.blood+1,lastStabTarget:e,[`stabs/${e}`]:t}),n.blood+=1,n.stabs[e]=t}async function xb(n){const e=on();await Oe(H(j,`users/${n.uid}`),{blood:n.blood+Fs,syringeDay:e}),n.blood+=Fs,n.syringeDay=e}async function Ab(n,e,t){await it(H(j,`users/${n.uid}/wardrobe/${e}`),t),n.wardrobe[e]=t}async function Rb(n,e){await it(H(j,`users/${n.uid}/wardrobe/${e}`),null),delete n.wardrobe[e]}const Pb=["register","login","logout","buy","stab","syringe","cd","emote","friend","outfit","look","admin"];function We(n,e,t){zn(H(j,"logs"),{uid:n.uid,name:n.name,type:e,detail:t.slice(0,160),ts:Xe()}).catch(()=>{})}const Nb=/^[A-Za-z0-9_.-]{3,16}$/,Fa=n=>`${n.toLowerCase()}@users.bobba.invalid`,rh="admin",Ob=Fa(rh),Mb=n=>!!n&&n.email===Ob,Db=new Set([rh,"administrator","moderator","staff","6ixplanet"]);function $a(n){const e=(n==null?void 0:n.code)??"";return{"auth/invalid-credential":"Wrong username or password.","auth/wrong-password":"Wrong username or password.","auth/user-not-found":"Wrong username or password.","auth/email-already-in-use":"That username is taken.","auth/weak-password":"Password must be at least 6 characters.","auth/invalid-email":"Usernames can only use letters, numbers, . _ -","auth/too-many-requests":"Too many attempts, try again in a moment.","auth/network-request-failed":"Can't reach Firebase. Check your connection / config."}[e]??(n==null?void 0:n.message)??"Something went wrong."}const Ro={registering:!1};async function Lb(n,e){if(!Nb.test(n))throw new Error("Username must be 3-16 characters: letters, numbers, . _ -");if(Db.has(n.toLowerCase()))throw new Error("That username is reserved.");Ro.registering=!0;try{const t=await bm(fs,Fa(n),e);try{const s=await ih(t.user.uid,n);return We(s,"register","created the account"),s}catch(s){throw await xm(t.user).catch(()=>{}),s}}finally{Ro.registering=!1}}async function Fb(n,e){await wm(fs,Fa(n.trim()),e)}async function $b(n,e){const t=fs.currentUser;if(!t||!t.email)throw new Error("You're not signed in.");if(e.length<6)throw new Error("Password must be at least 6 characters.");await vm(t,An.credential(t.email,n)),await Em(t,e)}function Po(){return km(fs)}function l(n,e={},...t){const s=document.createElement(n);for(const[i,r]of Object.entries(e))r==null||r===!1||(i==="class"?s.className=String(r):i==="style"&&typeof r=="object"?Object.assign(s.style,r):i.startsWith("on")&&typeof r=="function"?s.addEventListener(i.slice(2).toLowerCase(),r):i in s?s[i]=r:s.setAttribute(i,String(r)));for(const i of t)i==null||i===!1||s.append(typeof i=="string"?document.createTextNode(i):i);return s}function Ir(n){const e=n.getContext("2d");if(!e)return n;const{width:t,height:s}=n,i=e.getImageData(0,0,t,s).data;let r=t,o=s,a=-1,c=-1;for(let h=0;h<s;h++)for(let f=0;f<t;f++)i[(h*t+f)*4+3]>8&&(f<r&&(r=f),f>a&&(a=f),h<o&&(o=h),h>c&&(c=h));if(a<0)return n;const d=document.createElement("canvas");return d.width=a-r+1,d.height=c-o+1,d.getContext("2d").drawImage(n,r,o,d.width,d.height,0,0,d.width,d.height),d}function de(n,e="ok"){const t=l("div",{class:`toast ${e}`},n);document.body.append(t),setTimeout(()=>t.classList.add("show"),10),setTimeout(()=>{t.classList.remove("show"),setTimeout(()=>t.remove(),300)},2800)}function oh(n=new Date){return`${n.getHours()%12||12}:${String(n.getMinutes()).padStart(2,"0")} ${n.getHours()<12?"AM":"PM"}`}let yc=!1;function Ub(){yc||(yc=!0,setInterval(()=>{document.querySelectorAll(".sb-time").forEach(n=>n.textContent=oh()),document.querySelectorAll(".lock-clock .t").forEach(n=>n.textContent=ah())},1e4))}function ah(n=new Date){return`${n.getHours()}:${String(n.getMinutes()).padStart(2,"0")}`}const vc=n=>{const e=document.createElement("span");return e.innerHTML=n,e.firstElementChild};function lh(){Ub();const n=l("span",{class:"sb-bars"},...[3,4.5,6,7.5,9].map(s=>l("i",{style:{height:s+"px"}}))),e=vc('<svg width="13" height="10" viewBox="0 0 13 10"><path d="M6.5 2.2c1.9 0 3.6.7 4.9 1.9l1-1C10.8 1.6 8.8.8 6.5.8S2.2 1.6.6 3.1l1 1C2.9 2.9 4.6 2.2 6.5 2.2zm0 2.6c1.2 0 2.2.4 3 1.2l1-1C9.4 4 8 3.4 6.5 3.4S3.6 4 2.5 5l1 1c.8-.8 1.8-1.2 3-1.2zm0 2.6c-.5 0-.9.2-1.2.5L6.5 9.2l1.2-1.3c-.3-.3-.7-.5-1.2-.5z" fill="#fff"/></svg>'),t=vc('<svg width="23" height="11" viewBox="0 0 23 11"><rect x=".6" y=".6" width="19" height="9.8" rx="1.6" fill="none" stroke="#fff" stroke-width="1.2"/><rect x="2" y="2" width="16.2" height="7" rx=".6" fill="#fff"/><rect x="20.4" y="3.4" width="1.8" height="4.2" rx=".6" fill="#fff"/></svg>');return l("div",{class:"sb-status","aria-hidden":"true"},l("span",{},n,"6IX",e),l("span",{class:"sb-time"},oh()),l("span",{},"100% ",t))}function Wb(n){return l("header",{class:"navbar"},l("div",{class:"barside"},n.back?l("button",{class:"barbtn back",onclick:n.back.onBack},n.back.label):null),l("div",{class:"title"},n.title),l("div",{class:"barside right"},...n.right??[]))}const Yr=18;function ch(n,e,t,s=!1){const i=e.profile;let r=i.gender,o=Ls(i.figure||Ds[r]),a=t==="shop"?"ch":"hr",c=0,d=2,h=!1,f=0,_=0,p=!1;I();function I(){const m=Ls(Ds[r]);for(const N of Gt)N.required&&!o[N.id]&&(o[N.id]=m[N.id])}const S=l("canvas",{class:"preview-canvas",width:64,height:110}),x=l("div",{class:"preview-name"},i.name),q=l("div",{class:"tabs"}),Q=l("div",{class:"colors"}),F=l("div",{class:"grid"}),U=l("div",{class:"pager"}),D=l("div",{class:"editor-footer"}),M=l("div",{class:"gender"}),C=l("button",{class:"btn small",onclick:()=>{h=!h,f=0,C.classList.toggle("on",h),P()}},"Wave"),T=m=>{d=(d+m+8)%8,P()};n.append(l("div",{class:"editor"},l("div",{class:"editor-left panel"},l("h2",{},t==="shop"?"Clothing shop":s?"Create your character":"Your character"),l("div",{class:"preview-box"},S,x),l("div",{class:"row center"},l("button",{class:"btn small",onclick:()=>T(-1)},"⟲"),C,l("button",{class:"btn small",onclick:()=>T(1)},"⟳")),M,D),l("div",{class:"editor-right panel"},q,Q,F,U)));function P(){const m=++_;Ft({figure:Is(o),dir:d,headDir:d,actions:h?["wav"]:["std"],frame:f}).then(N=>{if(p||m!==_||!N)return;const ae=S.getContext("2d");ae.clearRect(0,0,S.width,S.height),ae.drawImage(N,0,0)})}const k=window.setInterval(()=>{h&&(f=(f+1)%2,P())},350);function W(){q.replaceChildren(...Gt.map(m=>l("button",{class:"tab"+(m.id===a?" on":""),onclick:()=>{a=m.id,c=0,ce()}},m.label)))}function $(){Q.replaceChildren();const m=o[a],N=m&&Xu(a,m.id);if(!m||!N||N.colors===0)return;const ae=Ma(a);for(let B=0;B<N.colors;B++)Q.append(l("div",{class:"swatch-row"},N.colors>1?l("span",{class:"swatch-label"},`Color ${B+1}`):null,...ae.map(pe=>l("button",{class:"swatch"+(m.colors[B]===pe.id?" on":""),style:{background:"#"+pe.hex},title:"#"+pe.hex,onclick:()=>{m.colors[B]=pe.id,P(),$(),ue()}}))))}function J(){const m=yb(a,r);return t==="shop"?m.filter(N=>!So(N,i.owned)&&N.shopOn):m.filter(N=>So(N,i.owned))}function ue(){const m=Gt.find(Ce=>Ce.id===a),N=J(),ae=Math.max(1,Math.ceil(N.length/Yr));c>=ae&&(c=ae-1);const B=N.slice(c*Yr,(c+1)*Yr),pe=o[a];F.replaceChildren(),t==="customize"&&!m.required&&F.append(l("button",{class:"cell none"+(pe?"":" on"),onclick:()=>{delete o[a],P(),ce()}},"None"));for(const Ce of B){const Ye=l("div",{class:"thumb"}),Fe=l("button",{class:"cell"+((pe==null?void 0:pe.id)===Ce.id?" on":""),title:`${m.label} #${Ce.id}`,onclick:()=>{o[a]={id:Ce.id,colors:gc(Ce,pe)},P(),ce()}},Ye,t==="shop"?l("span",{class:"price"},`🩸 ${Ce.price}`):null);F.append(Fe);const Ke={...o,[a]:{id:Ce.id,colors:gc(Ce,pe)}};Ft({figure:Is(Ke),dir:2,headDir:2,headOnly:m.headOnly}).then(rt=>{if(p||!rt||!Ye.isConnected)return;const Qe=Ir(rt);Qe.className="thumb-canvas",Ye.replaceChildren(Qe)})}N.length===0&&F.append(l("p",{class:"muted"},t==="shop"?"You own everything in this category 🎉":"Nothing here yet — visit the shop!")),U.replaceChildren(ae>1?l("div",{class:"row center"},l("button",{class:"btn small",disabled:c===0,onclick:()=>{c--,ue()}},"‹"),l("span",{class:"muted"},`${c+1} / ${ae}`),l("button",{class:"btn small",disabled:c>=ae-1,onclick:()=>{c++,ue()}},"›")):"")}function Z(){M.replaceChildren(),t==="customize"&&M.append(l("div",{class:"row center"},...["M","F"].map(m=>l("button",{class:"btn small"+(r===m?" on":""),onclick:()=>{r!==m&&(r=m,o=Ls(Ds[m]),c=0,P(),ce())}},m==="M"?"Boy":"Girl"))))}function be(){if(D.replaceChildren(),t==="customize"){D.append(l("button",{class:"btn primary",onclick:async()=>{try{await Ao(i,Is(o),r),e.refreshHeader(),We(i,"look",s?"created their character":"changed their look"),s?e.navigate("home"):de("Look saved!")}catch(B){de(B.message,"err")}}},s?"Enter the hotel →":"Save look"));return}const m=vb(o,i.owned),N=m.reduce((B,pe)=>B+pe.price,0),ae=N<=i.blood;D.append(l("div",{class:"basket"},m.length===0?l("p",{class:"muted"},"Try items on, then buy the ones you like."):l("ul",{},...m.map(B=>l("li",{},`${Gt.find(pe=>pe.id===B.type).label} #${B.id} — 🩸 ${B.price}`)))),l("button",{class:"btn primary",disabled:m.length===0||!ae,onclick:async()=>{try{await La(i,m.map(B=>B.key),N),await Ao(i,Is(o),r),We(i,"buy",`bought ${m.map(B=>B.key).join(", ")} for ${N}`),e.refreshHeader(),de(`Bought ${m.length} item${m.length>1?"s":""} and put them on!`),ce()}catch(B){de(B.message,"err")}}},m.length===0?"Buy & wear":ae?`Buy & wear — 🩸 ${N}`:`Need 🩸 ${N-i.blood} more`))}function ce(){W(),$(),ue(),Z(),be()}return ce(),P(),()=>{p=!0,window.clearInterval(k)}}const Bb={rooms:!1},dh={standin:{id:"standin",title:"Stand-in track",artist:"swap me in src/cdplayer.ts",url:Je("music/cd-standin.mp3")}},Hb="standin",Ua=H(j,"rooms/lobby/cdplayer");function jb(n,e){return Ot(Ua,t=>n(t.exists()?t.val():null),e)}const Bn=n=>dt()>=n.endsAt;function Vb(n){return new Promise(e=>{const t=new Audio,s=i=>{t.removeAttribute("src"),t.load(),e(i)};t.preload="metadata",t.addEventListener("loadedmetadata",()=>s(Number.isFinite(t.duration)?Math.round(t.duration*1e3):6e4),{once:!0}),t.addEventListener("error",()=>s(6e4),{once:!0}),setTimeout(()=>s(6e4),6e3),t.src=n.url})}async function qb(n,e,t=Hb){const s=dh[t],i=await Vb(s),r={by:n.uid,byName:n.name,track:s.id,title:s.title,startedAt:Xe(),endsAt:Math.round(dt()+i)};await it(Ua,r);const o=n.inventory[e];return o&&(await Oe(H(j,`users/${n.uid}/inventory/${e}`),{inPlayer:!0}),o.inPlayer=!0),{...r,startedAt:dt()}}const bc=()=>Sn(Ua);async function zb(n){const e=n.inventory.findIndex(t=>(t==null?void 0:t.item)==="cd"&&t.inPlayer);return e<0?!1:(await Oe(H(j,`users/${n.uid}/inventory/${e}`),{inPlayer:null}),delete n.inventory[e].inPlayer,!0)}async function Gb(n,e){return!n.inventory.some(s=>(s==null?void 0:s.item)==="cd"&&s.inPlayer)||e&&e.by===n.uid&&!Bn(e)?!1:zb(n).catch(()=>!1)}const No="bobba.cdVolume";function Yb(){try{const n=Number(localStorage.getItem(No));return Number.isFinite(n)&&localStorage.getItem(No)!==null?Math.max(0,Math.min(1,n)):.5}catch{return .5}}class Kb{constructor(e){this.onChange=e,this.audio=new Audio,this.volume=Yb(),this.muted=!1,this.blocked=!1,this.key=null,this.state=null,this.audio.preload="auto",this.apply()}apply(){this.audio.volume=this.muted?0:this.volume}setVolume(e){this.volume=Math.max(0,Math.min(1,Math.round(e*100)/100)),this.volume>0&&(this.muted=!1),this.apply();try{localStorage.setItem(No,String(this.volume))}catch{}this.onChange()}toggleMute(){this.muted=!this.muted,this.apply(),this.onChange()}get playing(){return!!this.state&&!this.audio.paused&&!this.audio.ended}get position(){return this.state?Math.max(0,(dt()-this.state.startedAt)/1e3):0}sync(e){if(this.state=e&&!Bn(e)?e:null,!this.state){this.stop();return}const t=dh[this.state.track];if(!t)return this.stop();const s=`${this.state.by}:${this.state.startedAt}`;s!==this.key&&(this.key=s,this.audio.src=t.url,this.audio.addEventListener("loadedmetadata",()=>this.seekAndPlay(),{once:!0}),this.audio.load()),this.onChange()}seekAndPlay(){if(!this.state)return;const e=this.audio.duration,t=this.position;if(!(Number.isFinite(e)&&t>=e)){try{this.audio.currentTime=t}catch{}this.tryPlay()}}tryPlay(){this.audio.play().then(()=>{this.blocked=!1,this.onChange()},()=>{this.blocked=!0,this.onChange()})}stop(){this.state=null,this.key=null,this.audio.pause(),this.audio.removeAttribute("src"),this.audio.load(),this.onChange()}}const Yt=[{id:"sample",title:"Hotel jingle (placeholder)",artist:"swap me in src/music.ts",url:Je("music/sample.mp3")}];class Qb{constructor(){this.audio=new Audio,this.current=null,this.listeners=new Set,this.audio.preload="none",this.audio.volume=.6;for(const e of["play","pause","timeupdate","loadedmetadata","ended","error","volumechange"])this.audio.addEventListener(e,()=>{e==="ended"&&this.next(),this.emit()})}subscribe(e){return this.listeners.add(e),()=>this.listeners.delete(e)}emit(){this.listeners.forEach(e=>e())}get playing(){return!this.audio.paused}get failed(){return!!this.audio.error}play(e){var t;((t=this.current)==null?void 0:t.id)!==e.id&&(this.current=e,this.audio.src=e.url),this.audio.play().catch(()=>this.emit()),this.emit()}toggle(){if(!this.current)return this.play(Yt[0]);this.audio.paused?this.audio.play().catch(()=>this.emit()):this.audio.pause()}next(){if(!this.current)return;const e=Yt.findIndex(t=>t.id===this.current.id);this.play(Yt[(e+1)%Yt.length])}seek(e){Number.isFinite(this.audio.duration)&&(this.audio.currentTime=e*this.audio.duration)}setVolume(e){this.audio.volume=Math.max(0,Math.min(1,e))}stop(){this.audio.pause(),this.audio.removeAttribute("src"),this.audio.load(),this.current=null,this.emit()}}const Ue=new Qb;function or(n){if(!Number.isFinite(n))return"0:00";const e=Math.floor(n);return`${Math.floor(e/60)}:${String(e%60).padStart(2,"0")}`}const is=[{id:"wave",name:"Wave",icon:"👋",desc:"Say hi.",price:0,actions:["wav"],ms:2200},{id:"smile",name:"Smile",icon:"🙂",desc:"A friendly grin.",price:0,gesture:"sml",ms:3500},{id:"sad",name:"Sad",icon:"😢",desc:"Bit of a downer.",price:0,gesture:"sad",fx:["💧"],ms:3500},{id:"jump",name:"Jump",icon:"🦘",desc:"Hop on the spot.",price:0,motion:"hop",ms:1300},{id:"angry",name:"Angry",icon:"😠",desc:"Steam comes out of your ears.",price:1,gesture:"agr",fx:["💢"],ms:3500},{id:"surprised",name:"Surprised",icon:"😮",desc:"Didn't see that coming.",price:1,motion:"hop",fx:["❗","❓"],ms:1800},{id:"sleep",name:"Sleep",icon:"😴",desc:"Eyes shut, zzz.",price:1,gesture:"eyb",fx:["💤"],ms:5e3},{id:"laugh",name:"Laugh",icon:"😂",desc:"Crack up.",price:2,gesture:"sml",motion:"bounce",fx:["😂"],ms:3500},{id:"love",name:"Love",icon:"😍",desc:"Hearts everywhere.",price:2,gesture:"sml",fx:["❤️","💕"],ms:4e3},{id:"cheer",name:"Cheer",icon:"🎉",desc:"Hands up, confetti.",price:2,actions:["wav"],motion:"hop",fx:["🎉","✨"],ms:3e3},{id:"spin",name:"Spin",icon:"🌀",desc:"Round and round.",price:2,motion:"spin",ms:2200},{id:"dance",name:"Dance",icon:"🕺",desc:"Bust a move.",price:3,motion:"dance",fx:["🎵","🎶"],ms:6e3}],Ss=Object.fromEntries(is.map(n=>[n.id,n])),uh=n=>`emote_${n}`;let Wa={};function Jb(n){Wa=n}function Gn(n){var e;return n.price===0?0:((e=Wa[n.id])==null?void 0:e.price)??n.price}function Xb(n){var e;return n.price!==0&&Gn(n)>0&&(((e=Wa[n.id])==null?void 0:e.on)??!0)}function Js(n,e){const t=Ss[e];return!!t&&(Gn(t)===0||!!n.owned[uh(e)])}const wc=[2,3,4,5,6,7,0,1],It={crate:{id:"crate",label:"Crate",icon:"📦",w:1,h:1,height:26,color:"#9c6b3a",placeable:!0},table:{id:"table",label:"Table",icon:"🪵",w:2,h:2,height:22,color:"#7b5a36",placeable:!0},sofa:{id:"sofa",label:"Sofa",icon:"🛋️",w:2,h:1,height:26,color:"#8a3e3e",placeable:!0},plant:{id:"plant",label:"Plant",icon:"🪴",w:1,h:1,height:44,color:"#3d7a45",placeable:!0},lamp:{id:"lamp",label:"Lamp",icon:"💡",w:1,h:1,height:62,color:"#c9b25a",placeable:!0},shelf:{id:"shelf",label:"Shelf",icon:"📚",w:1,h:1,height:74,color:"#6a4a2c",placeable:!0},arcade:{id:"arcade",label:"Arcade machine",icon:"🕹️",w:1,h:1,height:78,color:"#26327a",placeable:!1},cdplayer:{id:"cdplayer",label:"CD player",icon:"💿",w:1,h:1,height:38,color:"#2d3140",placeable:!1}},Zb=new Set(["arcade","cdplayer"]),ew={floorA:"#a99a6a",floorB:"#b5a678",wall:"#b9c9cf",rug:!0,rugColor:"#c9544f"},Xs="lobby";function Ec(){const n=[["sofa",9,1],["plant",1,9],["table",5,5],["arcade",3,0],["arcade",5,0],["cdplayer",7,0]];return{id:Xs,name:"Main Lobby",ownerUid:null,ownerName:null,access:"open",w:12,h:12,theme:{...ew},rug:{x0:3,y0:3,w:6,h:6},furni:n.map(([e,t,s],i)=>({id:`lobby${i}`,kind:e,x:t,y:s}))}}const tw=(n,e)=>Sn(H(j,`roomsMeta/${n}/furni/${e}`)),Oo=new Map;async function Cc(n){const e=Oo.get(n);if(e)return e;const t=await hi(H(j,`profiles/${n}`));if(!t.exists())return null;const s={uid:n,name:t.val().name,figure:t.val().figure};return Oo.set(n,s),s}async function nw(n){Oo.delete(n.uid),await it(H(j,`profiles/${n.uid}`),{name:n.name,figure:n.figure});const e=H(j,`usernames/${n.name.toLowerCase()}`);(await hi(e)).exists()||await it(e,n.uid).catch(()=>{})}function sw(n,e=""){const t=H(j,`presence/${n.uid}`);rr(t).remove(),it(t,{name:n.name,room:e,since:Xe()})}function Ic(n,e){Oe(H(j,`presence/${n.uid}`),{room:e}).catch(()=>{})}function iw(n){const e=H(j,`presence/${n.uid}`);rr(e).cancel(),Sn(e).catch(()=>{})}class rw{constructor(){this.me=null,this.friends=new Map,this.requests=new Map,this.presence=new Map,this.invites=[],this.dms=new Map,this.unread=new Map,this.openChat=new Set,this.listeners=new Set,this.inviteListeners=new Set,this.dmListeners=new Set,this.unsubs=[],this.dmUnsubs=new Map,this.sessionStart=0,this.isOnline=e=>this.presence.has(e),this.friendUids=()=>new Set(this.friends.keys()),this.roomOf=e=>{var t;return((t=this.presence.get(e))==null?void 0:t.room)??""}}subscribe(e){return this.listeners.add(e),()=>this.listeners.delete(e)}onInvite(e){return this.inviteListeners.add(e),()=>this.inviteListeners.delete(e)}onDm(e){return this.dmListeners.add(e),()=>this.dmListeners.delete(e)}emit(){this.listeners.forEach(e=>e())}get totalUnread(){let e=0;return this.unread.forEach(t=>e+=t),e}start(e){this.stop(),this.me=e,this.sessionStart=dt(),this.unsubs.push(Ot(H(j,`friends/${e.uid}`),async t=>{const s=Object.keys(t.val()??{}),i=new Map;await Promise.all(s.map(async r=>{const o=await Cc(r);o&&i.set(r,o)})),this.friends=i;for(const r of i.keys())this.dmUnsubs.has(r)||this.watchDm(r);for(const[r,o]of this.dmUnsubs)i.has(r)||(o(),this.dmUnsubs.delete(r),this.dms.delete(r),this.unread.delete(r));this.emit()}),Ot(H(j,`friendRequests/${e.uid}`),async t=>{const s=Object.keys(t.val()??{}),i=new Map;await Promise.all(s.map(async r=>{const o=await Cc(r);o&&i.set(r,o)})),this.requests=i,this.emit()}),Ot(H(j,"presence"),t=>{const s=new Map;for(const[i,r]of Object.entries(t.val()??{}))s.set(i,{name:r.name,room:r.room??""});this.presence=s,this.emit()}),Ms(H(j,`invites/${e.uid}`),t=>{const s=t.val();if(!s)return;const i={id:t.key,room:s.room,roomName:s.roomName,from:s.from,fromName:s.fromName,ts:s.ts};this.invites.push(i),this.emit(),typeof i.ts=="number"&&i.ts>=this.sessionStart-2e3&&this.inviteListeners.forEach(r=>r(i))}))}stop(){this.unsubs.forEach(e=>e()),this.unsubs=[],this.dmUnsubs.forEach(e=>e()),this.dmUnsubs.clear(),this.friends.clear(),this.requests.clear(),this.presence.clear(),this.invites=[],this.dms.clear(),this.unread.clear(),this.openChat.clear(),this.me=null}watchDm(e){const t=this.me,s=Ms(Qs(H(j,`dms/${t.uid}/${e}`),Ks("ts"),Ys(50)),i=>{const r=i.val();if(!r)return;const o=this.dms.get(e)??[];if(o.some(d=>d.id===i.key))return;const a={id:i.key,from:r.from,text:r.text,ts:typeof r.ts=="number"?r.ts:dt()};o.push(a),this.dms.set(e,o);const c=a.ts>=this.sessionStart-2e3;c&&a.from!==t.uid&&!this.openChat.has(e)&&this.unread.set(e,(this.unread.get(e)??0)+1),this.emit(),c&&this.dmListeners.forEach(d=>d(e,a))},()=>{});this.dmUnsubs.set(e,s)}markRead(e){this.unread.delete(e)&&this.emit()}async sendRequest(e){const t=this.me,s=e.trim();if(!s)throw new Error("Type a username first.");const i=await hi(H(j,`usernames/${s.toLowerCase()}`));if(!i.exists())throw new Error(`Nobody is called "${s}".`);const r=i.val();if(r===t.uid)throw new Error("That's you!");if(this.friends.has(r))throw new Error("You're already friends.");return this.requests.has(r)?(await this.accept(r),`You and ${s} are now friends.`):(await it(H(j,`friendRequests/${r}/${t.uid}`),{ts:Xe()}),`Friend request sent to ${s}.`)}async accept(e){const t=this.me,s=dt();await Oe(H(j),{[`friends/${t.uid}/${e}`]:{since:s},[`friends/${e}/${t.uid}`]:{since:s},[`friendRequests/${t.uid}/${e}`]:null})}decline(e){return Sn(H(j,`friendRequests/${this.me.uid}/${e}`))}async removeFriend(e){const t=this.me;await Oe(H(j),{[`friends/${t.uid}/${e}`]:null,[`friends/${e}/${t.uid}`]:null})}async sendDm(e,t){const s=this.me,i=zn(H(j,`dms/${s.uid}/${e}`)).key,r={from:s.uid,text:t.slice(0,200),ts:Xe()};await Oe(H(j),{[`dms/${s.uid}/${e}/${i}`]:r,[`dms/${e}/${s.uid}/${i}`]:r})}async inviteToRoom(e,t,s){const i=this.me,r=zn(H(j,`invites/${e}`)).key;await Oe(H(j),{[`roomInvites/${t}/${e}`]:!0,[`invites/${e}/${r}`]:{room:t,roomName:s,from:i.uid,fromName:i.name,ts:Xe()}})}async dismissInvite(e){this.invites=this.invites.filter(t=>t.id!==e),this.emit(),await Sn(H(j,`invites/${this.me.uid}/${e}`)).catch(()=>{})}roomCounts(){const e=new Map;return this.presence.forEach(t=>t.room&&e.set(t.room,(e.get(t.room)??0)+1)),e}}const re=new rw,$n=20,ht=18,ow={id:"snake",title:"Snake",icon:"🐍",blurb:"Eat, grow, don't bite yourself. Arrow keys or WASD.",mount(n){const e=l("canvas",{class:"arcade-canvas",width:$n*ht,height:$n*ht}),t=l("div",{class:"arcade-score"},"Score: 0"),s=l("div",{class:"hint"},"Press any arrow key to start");n.append(e,t,s);const i=e.getContext("2d");let r=[],o={x:1,y:0},a=null,c={x:10,y:10},d=0,h=!1,f=!1,_=0,p=0;function I(){r=[{x:5,y:10},{x:4,y:10},{x:3,y:10}],o={x:1,y:0},a=null,d=0,f=!1,S(),t.textContent=`Score: 0   Best: ${_}`}function S(){do c={x:Math.floor(Math.random()*$n),y:Math.floor(Math.random()*$n)};while(r.some(U=>U.x===c.x&&U.y===c.y))}function x(){a&&(o=a,a=null);const U={x:r[0].x+o.x,y:r[0].y+o.y};if(U.x<0||U.y<0||U.x>=$n||U.y>=$n||r.some(D=>D.x===U.x&&D.y===U.y)){f=!0,h=!1,_=Math.max(_,d),t.textContent=`Score: ${d}   Best: ${_}`,s.textContent="Game over. Press any arrow key to play again.",q();return}r.unshift(U),U.x===c.x&&U.y===c.y?(d++,t.textContent=`Score: ${d}   Best: ${_}`,S()):r.pop(),q()}function q(){i.fillStyle="#0b1a24",i.fillRect(0,0,e.width,e.height),i.fillStyle="#d32121",i.fillRect(c.x*ht+3,c.y*ht+3,ht-6,ht-6),r.forEach((U,D)=>{i.fillStyle=f?"#777":D===0?"#7be37b":"#3fae5a",i.fillRect(U.x*ht+1,U.y*ht+1,ht-2,ht-2)})}const Q={ArrowUp:{x:0,y:-1},w:{x:0,y:-1},W:{x:0,y:-1},ArrowDown:{x:0,y:1},s:{x:0,y:1},S:{x:0,y:1},ArrowLeft:{x:-1,y:0},a:{x:-1,y:0},A:{x:-1,y:0},ArrowRight:{x:1,y:0},d:{x:1,y:0},D:{x:1,y:0}},F=U=>{const D=Q[U.key];if(!D)return;U.preventDefault(),h||((f||r.length===0)&&I(),h=!0,s.textContent="",clearInterval(p),p=window.setInterval(x,110));const M=a??o;(D.x!==-M.x||D.y!==-M.y)&&(a=D)};return window.addEventListener("keydown",F),I(),q(),()=>{clearInterval(p),window.removeEventListener("keydown",F)}}},Sc=(n,e,t,s)=>({id:n,title:e,icon:t,blurb:s,comingSoon:!0,mount:()=>()=>{}}),aw=[ow,Sc("blood-catch","Blood Catch","🩸","Catch the falling drops."),Sc("lobby-pong","Lobby Pong","🏓","Two players, one ball.")];let Kr=null;function lw(){if(Kr)return;let n=null;const e=l("div",{class:"arcade-body"}),t=l("div",{class:"arcade-title"},"🕹️ Arcade"),s=l("button",{class:"btn small hidden",onclick:()=>c()},"← Games"),i=l("button",{class:"btn small",onclick:()=>h()},"Close"),r=l("div",{class:"arcade-screen"},l("div",{class:"arcade-head"},t,l("div",{class:"row"},s,i)),e),o=l("div",{class:"arcade-overlay",onmousedown:_=>{_.target===o&&h()}},r);Kr=o,document.body.append(o);function a(){n==null||n(),n=null,e.replaceChildren()}function c(){a(),t.textContent="🕹️ Arcade",s.classList.add("hidden"),e.append(l("div",{class:"arcade-list"},...aw.map(_=>l("button",{class:"arcade-card"+(_.comingSoon?" soon":""),disabled:!!_.comingSoon,onclick:()=>d(_)},l("div",{class:"arcade-icon"},_.icon),l("div",{class:"arcade-name"},_.title),l("div",{class:"hint"},_.comingSoon?"Coming soon":_.blurb)))))}function d(_){a(),t.textContent=`${_.icon} ${_.title}`,s.classList.remove("hidden"),n=_.mount(e,{close:h})}function h(){a(),window.removeEventListener("keydown",f),o.remove(),Kr=null}const f=_=>{_.key==="Escape"&&h()};window.addEventListener("keydown",f),o.addEventListener("arcade-close",h),c()}let Ts=null;function Ci(){Ts==null||Ts.remove(),Ts=null}function hh(n,e,t){Ci();const s=l("div",{class:"ctx-menu"},l("div",{class:"ctx-head"},"Choose Option"),...t.map(r=>l("div",{class:"ctx-opt",onclick:()=>{Ci(),r.action()}},l("span",{class:r.danger?"ctx-danger":""},r.label),r.target?l("span",{class:"ctx-target"}," "+r.target):null)),l("div",{class:"ctx-opt",onclick:Ci},l("span",{class:"ctx-danger"},"Cancel")));document.body.append(s);const i=s.getBoundingClientRect();s.style.left=Math.min(n,window.innerWidth-i.width-4)+"px",s.style.top=Math.min(e,window.innerHeight-i.height-4)+"px",Ts=s,setTimeout(()=>{const r=o=>{o instanceof KeyboardEvent&&o.key!=="Escape"||o instanceof MouseEvent&&s.contains(o.target)||(Ci(),window.removeEventListener("mousedown",r),window.removeEventListener("keydown",r),window.removeEventListener("blur",r))};window.addEventListener("mousedown",r),window.addEventListener("keydown",r),window.addEventListener("blur",r)},0)}function cw(n){const e=Math.max(1,Math.ceil(n/6e4));return e>=60?`${Math.floor(e/60)}h ${e%60}m`:`${e}m`}function dw(n,e,t){const s=e.profile;let i="inventory",r=null,o=null,a=null;const c=l("div",{class:"osrs-tabs"}),d=l("div",{class:"osrs-body"}),h=l("aside",{class:"osrs-panel"},c,d);n.append(h);function f(){const F=(U,D,M)=>l("button",{class:"osrs-tab"+(i===U?" on":""),title:M,onclick:()=>{i=U,x()}},D);c.replaceChildren(F("inventory","🎒","Inventory"),F("emotes","😀","Emotes"),F("music","♪","Music"),...t.roomTab?[F("room",t.roomTab.icon,t.roomTab.title)]:[])}function _(){const F=l("div",{class:"emote-grid"},...is.map(U=>{const D=Js(s,U.id);return l("button",{class:"emote-cell"+(D?"":" locked"),title:D?`${U.name}: ${U.desc}  (/${U.id})`:`${U.name}: locked. Buy it in the shop for ${U.price} drops.`,onclick:()=>t.onEmote(U.id)},l("span",{class:"emote-icon"},U.icon),l("span",{class:"emote-name"},U.name),D?null:l("span",{class:"emote-lock"},"🔒"))}));d.replaceChildren(l("div",{class:"osrs-title"},"Emotes"),F,l("div",{class:"inv-foot"},l("div",{class:"hint"},"Click one to perform it, or type /name in chat (like /dance). Walking cancels it."),is.some(U=>!Js(s,U.id))?l("button",{class:"btn small",onclick:()=>e.navigate("shop")},"Get more in the shop"):null))}function p(){const F=r!==null?s.inventory[r]:null;return F?vt[F.item].useOnObject?"Now click the CD player in the lobby.":"Now click a player to use it on them.":"Knife: click it, then a player. CD: click it, then the CD player. Syringe: just click it."}function I(){o==null||o(),o=null;const F=l("div",{class:"inv-grid"});for(let M=0;M<Da;M++){const C=s.inventory[M],T=C?vt[C.item]:null,P=!!(C!=null&&C.inPlayer),k=l("div",{class:"inv-slot"+(r===M?" selected":"")+(T?" filled":"")+(P?" loaned":""),title:T?P?`${T.name} (in the player)`:T.name:"",onclick:()=>{if(T){if(P)return t.say(`Your ${T.name} is in the player. It'll be back when it's done.`,"warn");if(T.useSelf)return t.onUseSelf(T.useSelf);q(r===M?null:M)}},oncontextmenu:W=>{W.preventDefault(),T&&hh(W.clientX,W.clientY,[...P?[]:T.useSelf?[{label:"Draw blood",target:T.name,action:()=>t.onUseSelf(T.useSelf)}]:[{label:r===M?"Cancel use":"Use",target:T.name,action:()=>q(r===M?null:M)}],{label:"Examine",target:T.name,action:()=>t.say(P?`${T.examine} (It's in the player right now.)`:T.examine)}])}},T?l("img",{src:T.icon,alt:T.name,draggable:!1}):null,C&&C.qty>1?l("span",{class:"qty"},String(C.qty)):null);F.append(k)}const U=sh(s),D=Ib(s);d.replaceChildren(l("div",{class:"osrs-title"},"Inventory"),F,l("div",{class:"inv-foot"},l("div",{class:"blood-line"},l("img",{src:kn,alt:"",class:"blood-ico"}),` ${s.blood} drop${s.blood===1?"":"s"} of blood`),l("div",{class:"stab-status ready"},D===0?"Stab each person once a day":`Stabbed today: ${D}. Each person once a day`),l("div",{class:"stab-status "+(U?"ready":"used")},U?"Syringe: ready (2 drops)":`Syringe used. Again in ${cw(xo())}`),l("div",{class:"hint"},p())))}function S(){if(o==null||o(),o=null,!s.owned[ko]){d.replaceChildren(l("div",{class:"osrs-title"},"Music"),l("div",{class:"music-locked"},l("p",{},"🔒 You don't have a jukebox pass."),l("p",{class:"hint"},"Buy music access in the shop to stream tracks while you hang out."),l("button",{class:"btn small",onclick:()=>e.navigate("shop")},"Open shop")));return}const F=l("div",{class:"track-list"}),U=l("div",{class:"now"}),D=l("button",{class:"btn small",onclick:()=>Ue.toggle()}),M=l("input",{type:"range",min:0,max:1e3,value:0,class:"seek",oninput:()=>Ue.seek(Number(M.value)/1e3)}),C=l("span",{class:"time"}),T=l("input",{type:"range",min:0,max:100,value:Math.round(Ue.audio.volume*100),class:"vol",oninput:()=>Ue.setVolume(Number(T.value)/100)}),P=()=>{const k=Ue.audio;F.replaceChildren(...Yt.map(W=>{var $,J;return l("div",{class:"track"+((($=Ue.current)==null?void 0:$.id)===W.id?" on":""),onclick:()=>Ue.play(W)},l("span",{class:"track-ico"},((J=Ue.current)==null?void 0:J.id)===W.id&&Ue.playing?"▶":"♪"),l("div",{},l("div",{class:"track-title"},W.title),l("div",{class:"hint"},W.artist)))})),U.textContent=Ue.failed?"Couldn't load that track.":Ue.current?`${Ue.playing?"Now playing":"Paused"}: ${Ue.current.title}`:"Pick a track to start streaming.",D.textContent=Ue.playing?"⏸ Pause":"▶ Play",document.activeElement!==M&&Number.isFinite(k.duration)&&k.duration>0&&(M.value=String(Math.round(k.currentTime/k.duration*1e3))),C.textContent=`${or(k.currentTime)} / ${or(k.duration)}`};o=Ue.subscribe(P),P(),d.replaceChildren(l("div",{class:"osrs-title"},"Music"),F,U,l("div",{class:"row center"},D),M,C,l("label",{class:"hint"},"Volume ",T))}function x(){o==null||o(),o=null,a==null||a(),a=null,f(),i==="inventory"?I():i==="emotes"?_():i==="room"&&t.roomTab?(d.replaceChildren(),a=t.roomTab.mount(d)):S()}function q(F){r=F,t.onSelect(F),i==="inventory"&&I()}x();const Q=window.setInterval(()=>{i==="inventory"&&I()},6e4);return{setSelected(F){r=F,i==="inventory"&&I()},refresh:x,dispose(){window.clearInterval(Q),o==null||o(),a==null||a(),h.remove()}}}const Bt=64,ft=32,bs=120,ws=480,uw=6500,Tc=100,Qr=700,kc=750,Mo=[[0,-1,0],[1,-1,1],[1,0,2],[1,1,3],[0,1,4],[-1,1,5],[-1,0,6],[-1,-1,7]],St=(n,e)=>({x:(n-e)*(Bt/2),y:(n+e)*(ft/2)}),xc=(n,e)=>Math.max(Math.abs(n.x-e.x),Math.abs(n.y-e.y));function Ii(n,e){var i;const t=Math.sign(e.x-n.x),s=Math.sign(e.y-n.y);return((i=Mo.find(r=>r[0]===t&&r[1]===s))==null?void 0:i[2])??2}function et(n,e){const t=parseInt(n.slice(1),16),s=i=>Math.max(0,Math.min(255,Math.round(i*e)));return`rgb(${s(t>>16)},${s(t>>8&255)},${s(t&255)})`}function Ba(n){const e=new Image;return e.src=n,e}const hw=Ba(vt.knife.icon),fw=Ba(kn),pw=Ba(vt.syringe.icon),Si=94;function mw(n,e,t){const s=e.profile,i=new Map,r=[];let o=!1,a=!1,c=Ec();const d=new Set;let h=null,f=null,_=[],p=[],I=null,S=null,x=null,q=!1,Q=null;const F=[],U=[],D=[],M=[],C=[],T=[],P=()=>c.ownerUid===s.uid,k=l("canvas",{class:"room-canvas"}),W=l("div",{class:"chat-log"}),$=l("div",{class:"online"}),J=l("div",{class:"room-title"},"Main Lobby"),ue=l("div",{class:"action-hint hidden"}),Z=l("input",{class:"chat-input",type:"text",maxLength:Tc,placeholder:"Click to chat — try /dance, or click the floor to walk",autocomplete:"off"}),be=l("div",{class:"stage"},k,$,W,ue,J),ce=l("div",{class:"side-host"});n.append(l("div",{class:"room"},l("div",{class:"room-main"},be,ce),l("form",{class:"chat-bar",onsubmit:u=>{u.preventDefault(),Mh()}},Z,l("button",{class:"btn primary",type:"submit"},"Send"))));const m=k.getContext("2d");function N(u,g="game"){var y;for(W.append(l("div",{class:`line sys ${g}`},u));W.children.length>60;)(y=W.firstElementChild)==null||y.remove();W.scrollTop=W.scrollHeight}const ae=dw(ce,e,{say:N,onSelect:u=>{S=u,x=null,Ce()},onEmote:u=>Ga(u),onUseSelf:u=>{u==="syringe"&&Rh()},roomTab:void 0}),B=new Set,pe=()=>S!==null&&s.inventory[S]?vt[s.inventory[S].item]:null;function Ce(){const u=pe();let g="";u!=null&&u.useOnObject?g=I&&I.kind===u.useOnObject?`Use ${u.name} → ${It[I.kind].label}`:`Use ${u.name} →`:u?g=f&&f.uid!==s.uid?`Use ${u.name} → ${f.name}`:`Use ${u.name} →`:f?g=f.name:I&&I.kind&&(g=It[I.kind].label),ue.textContent=g,ue.classList.toggle("hidden",!g),k.style.cursor=u||Q?"crosshair":"pointer"}function Ye(){d.clear();for(const u of c.furni){const g=It[u.kind];for(let y=0;y<g.w;y++)for(let v=0;v<g.h;v++)d.add(`${u.x+y},${u.y+v}`)}}const Fe=(u,g)=>u>=0&&g>=0&&u<c.w&&g<c.h&&!d.has(`${u},${g}`);function Ke(u,g){if(!Fe(g.x,g.y)||u.x===g.x&&u.y===g.y)return[];const y=w=>w.y*c.w+w.x,v=new Map([[y(u),null]]),E=[u];for(let w=0;w<E.length;w++){const O=E[w];if(O.x===g.x&&O.y===g.y)break;for(const[L,z]of Mo){const X=O.x+L,Y=O.y+z;!Fe(X,Y)||v.has(Y*c.w+X)||L!==0&&z!==0&&(!Fe(O.x+L,O.y)||!Fe(O.x,O.y+z))||(v.set(Y*c.w+X,O),E.push({x:X,y:Y}))}}if(!v.has(y(g)))return[];const A=[];for(let w=g;w&&!(w.x===u.x&&w.y===u.y);w=v.get(y(w))??null)A.unshift(w);return A}let rt={x:0,y:0},Qe=document.createElement("canvas");function $e(){const u=c.w,g=c.h,y=c.theme,v=-g*(Bt/2)-8,E=u*(Bt/2)+8,A=-bs-8,w=(u+g)*(ft/2)+20,O=document.createElement("canvas");O.width=E-v,O.height=w-A;const L=O.getContext("2d");L.translate(-v,-A);const z=(he,ie,fe)=>{L.beginPath(),he.forEach((ee,ge)=>ge?L.lineTo(ee.x,ee.y):L.moveTo(ee.x,ee.y)),L.closePath(),L.fillStyle=ie,L.fill(),fe&&(L.strokeStyle=fe,L.lineWidth=1,L.stroke())},X=St(0,0),Y=St(0,g),V=St(u,0);z([X,V,{x:V.x,y:V.y-bs},{x:X.x,y:X.y-bs}],et(y.wall,1),et(y.wall,.8)),z([X,Y,{x:Y.x,y:Y.y-bs},{x:X.x,y:X.y-bs}],et(y.wall,.88),et(y.wall,.8)),z([X,V,{x:V.x,y:V.y-10},{x:X.x,y:X.y-10}],et(y.wall,.72)),z([X,Y,{x:Y.x,y:Y.y-10},{x:X.x,y:X.y-10}],et(y.wall,.64));const se=St(u,g);z([Y,se,{x:se.x,y:se.y+8},{x:Y.x,y:Y.y+8}],et(y.floorA,.6)),z([V,se,{x:se.x,y:se.y+8},{x:V.x,y:V.y+8}],et(y.floorA,.45));for(let he=0;he<g;he++)for(let ie=0;ie<u;ie++){const fe=St(ie,he),ee=c.rug,ge=!!ee&&ie>=ee.x0&&ie<ee.x0+ee.w&&he>=ee.y0&&he<ee.y0+ee.h,Be=ge&&!!ee&&(ie===ee.x0||ie===ee.x0+ee.w-1||he===ee.y0||he===ee.y0+ee.h-1),hn=ge?et(y.rugColor,Be?.88:1):(ie+he)%2?y.floorA:y.floorB;z([{x:fe.x,y:fe.y},{x:fe.x+Bt/2,y:fe.y+ft/2},{x:fe.x,y:fe.y+ft},{x:fe.x-Bt/2,y:fe.y+ft/2}],hn,"rgba(0,0,0,0.12)")}return rt={x:-v,y:-A},O}function fi(u){c=u,Ye(),Qe=$e(),Ie(),J.textContent=c.ownerName?`${c.name} · by ${c.ownerName}`:c.name,B.forEach(g=>g())}let b=1,le=0,ye=0;function Ie(){const u=window.devicePixelRatio||1,g=be.clientWidth,y=be.clientHeight;k.width=Math.floor(g*u),k.height=Math.floor(y*u),k.style.width=g+"px",k.style.height=y+"px";const v=Math.min(g/Qe.width,y/(Qe.height+70));b=v>=1?Math.floor(v*2)/2:v,b=Math.max(.4,Math.min(b,2)),le=Math.round((g-Qe.width*b)/2+rt.x*b),ye=Math.round((y-Qe.height*b)/2+rt.y*b+24)}const Ze=new ResizeObserver(Ie);Ze.observe(be);const Ut=u=>({x:le+u.x*b,y:ye+u.y*b});function Nn(u,g){const y=(u-le)/b/(Bt/2),v=(g-ye)/b/(ft/2),E=Math.floor((y+v)/2),A=Math.floor((v-y)/2);return E>=0&&A>=0&&E<c.w&&A<c.h?{x:E,y:A}:null}function On(u,g,y){let v=null;for(const E of u)g>=E.x0&&g<=E.x1&&y>=E.y0&&y<=E.y1&&(!v||E.depth>v.depth)&&(v=E);return v}const De=(u,g)=>{const y=On(_,u,g);return y?i.get(y.id)??null:null},Mn=u=>{const g=k.getBoundingClientRect();return{x:u.clientX-g.left,y:u.clientY-g.top}},wh=u=>c.furni.find(g=>{const y=It[g.kind];return u.x>=g.x&&u.x<g.x+y.w&&u.y>=g.y&&u.y<g.y+y.h});k.addEventListener("mousemove",u=>{const g=Mn(u);h=Nn(g.x,g.y);const y=De(g.x,g.y),v=y?null:On(p,g.x,g.y);(y!==f||(v==null?void 0:v.id)!==(I==null?void 0:I.id))&&(f=y,I=v,Ce())}),k.addEventListener("mouseleave",()=>{h=null,f=null,I=null,Ce()}),k.addEventListener("click",u=>{const g=Mn(u),y=De(g.x,g.y),v=Nn(g.x,g.y),E=pe();if((E==null?void 0:E.useOnPlayer)==="stab"){y&&y.uid!==s.uid?Tr(y.uid):y?N("You can't stab yourself.","warn"):(cn(),v&&(x=null,ps(v)));return}const A=On(p,g.x,g.y);if(E!=null&&E.useOnObject){A&&!y&&A.kind===E.useOnObject?Xa(A.id):(cn(),A&&!y?N("Nothing interesting happens.","warn"):v&&Fe(v.x,v.y)&&(x=null,ps(v)));return}if(A&&!y){A.kind==="cdplayer"?Ja():Ya(A.id);return}v&&Fe(v.x,v.y)&&(x=null,ps(v))}),k.addEventListener("contextmenu",u=>{u.preventDefault();const g=Mn(u),y=De(g.x,g.y),v=Nn(g.x,g.y),E=pe(),A=vs(s.inventory,"knife")>=0,w=[];y&&y.uid!==s.uid&&((E==null?void 0:E.useOnPlayer)==="stab"&&w.push({label:`Use ${E.name} →`,target:y.name,action:()=>Tr(y.uid)}),A&&(E==null?void 0:E.useOnPlayer)!=="stab"&&w.push({label:"Stab",target:y.name,danger:!0,action:()=>Tr(y.uid)}),w.push({label:"Examine",target:y.name,action:()=>N(`${y.name}: a fellow hotel guest.`)}),re.friends.has(y.uid)?w.push({label:"Message",target:y.name,action:()=>window.dispatchEvent(new CustomEvent("open-chat",{detail:y.uid}))}):w.push({label:"Add friend",target:y.name,action:()=>re.sendRequest(y.name).then(z=>N(z),z=>N(z.message,"warn"))}));const O=On(p,g.x,g.y);(O==null?void 0:O.kind)==="arcade"&&w.push({label:"Play",target:"Arcade machine",action:()=>Ya(O.id)}),(O==null?void 0:O.kind)==="cdplayer"&&((E==null?void 0:E.useOnObject)==="cdplayer"&&w.push({label:`Use ${E.name} →`,target:"CD player",action:()=>Xa(O.id)}),w.push({label:"Volume",target:"CD player",action:()=>Ja()}),w.push({label:"Examine",target:"CD player",action:()=>N(qe&&!Bn(qe)?`The CD player is playing "${qe.title}", put in by ${qe.byName}.`:"A chunky CD player. It's empty. Use a CD on it.")}));const L=v?wh(v):void 0;L&&P()&&L.kind!=="arcade"&&w.push({label:"Pick up",target:It[L.kind].label,action:()=>void tw(c.id,L.id).catch(()=>{})}),v&&Fe(v.x,v.y)&&w.push({label:"Walk here",action:()=>{x=null,ps(v)}}),hh(u.clientX,u.clientY,w)});function cn(){S=null,ae.setSelected(null),Ce()}const Ha=u=>{u.key==="Escape"&&(S!==null&&cn(),_i())};window.addEventListener("keydown",Ha);function ja(u,g){var v;const y={x:g.x??1,y:g.y??1};return{uid:u,name:g.name??"?",figure:g.figure??s.figure,dir:g.dir??2,from:y,to:y,stepStart:0,path:[],dest:y,lastEmoteTs:((v=g.emote)==null?void 0:v.ts)??0}}const pi=(u,g)=>g-u.stepStart<ws&&(u.from.x!==u.to.x||u.from.y!==u.to.y);function Et(u){return u.path.length||performance.now()-u.stepStart<ws?u.to:u.from}function Va(u,g){const y=Et(u);u.dest=g,u.path=Ke(y,g),u.path.length&&(u.emote=void 0)}const Dn=()=>i.get(s.uid);function ps(u){const g=Dn();g&&(Va(g,u),g.path.length!==0&&Oe(H(j,`rooms/${t}/players/${s.uid}`),{x:u.x,y:u.y,dir:Ii(Et(g),g.path[0])}).catch(console.warn))}function Eh(u,g){if(!(g-u.stepStart<ws)&&(u.from=u.to,u.path.length)){const y=u.path.shift();u.dir=Ii(u.from,y),u.to=y,u.stepStart=g}}function qa(u,g){const y=pi(u,g)?(g-u.stepStart)/ws:1;return{x:u.from.x+(u.to.x-u.from.x)*y,y:u.from.y+(u.to.y-u.from.y)*y}}const Ct=(u,g)=>{const y=qa(u,g),v=St(y.x,y.y);return Ut({x:v.x,y:v.y+ft/2})};function za(u,g){u.emote={def:g,start:performance.now(),lastFx:0}}function Ga(u){const g=Ss[u],y=Dn();if(!(!g||!y)){if(!Js(s,u))return N(`You haven't unlocked ${g.name}. You can buy it in the shop.`,"warn");y.path=[],za(y,g),Oe(H(j,`rooms/${t}/players/${s.uid}`),{emote:{id:u,ts:Xe()}}).catch(()=>N("Your emote didn't go through.","warn")),We(s,"emote",`/${u}`)}}function Tr(u){const g=i.get(u);if(!(!g||u===s.uid)){if(vs(s.inventory,"knife")<0)return N("You need a knife for that.","warn");if(!_c(s,u)){const y=Math.max(1,Math.ceil(xo()/6e4));return N(`You've already stabbed ${g.name} today. You can stab them again in ${y>=60?`${Math.floor(y/60)}h ${y%60}m`:`${y}m`}.`,"warn")}x={type:"stab",uid:u,since:performance.now(),lastTry:0},cn(),xc(Et(Dn()),Et(g))>1&&N(`You walk towards ${g.name}…`)}}function Ya(u){x={type:"arcade",fid:u,since:performance.now(),lastTry:0}}function Ka(u,g,y,v){const E=Et(u);if(xc(E,g)<=1)return"arrived";if(y-v.lastTry<450)return"walking";v.lastTry=y;let A=null,w=1/0;for(const[O,L]of Mo){const z={x:g.x+O,y:g.y+L};if(!Fe(z.x,z.y))continue;const X=z.x===E.x&&z.y===E.y?0:Ke(E,z).length||1/0;X<w&&(A=z,w=X)}return!A||w===1/0?"unreachable":(ps(A),"walking")}function Ch(u){const g=Dn();if(!x||!g||q)return;if(u-x.since>2e4)return x=null,N("You lose track of what you were doing.","warn");if(g.path.length||pi(g,u))return;if(x.type==="stab"){const A=i.get(x.uid);if(!A)return x=null,N("They've left the room.","warn");const w=Ka(g,Et(A),u,x);if(w==="unreachable")return x=null,N("You can't reach them.","warn");if(w==="arrived"){const O=x.uid;x=null,Ah(O)}return}const y=x,v=c.furni.find(A=>A.id===y.fid);if(!v){x=null;return}const E=Ka(g,{x:v.x,y:v.y},u,y);if(E==="unreachable")return x=null,N("You can't get to it.","warn");E==="arrived"&&(x=null,g.dir=Ii(Et(g),{x:v.x,y:v.y}),Oe(H(j,`rooms/${t}/players/${s.uid}`),{dir:g.dir}).catch(()=>{}),y.type==="cd"?Sh():lw())}let qe=null,kr=!1,xr=!1,Ln=null,dn=null;const un=[];let Qa=0;const mi=()=>!!qe&&!Bn(qe),ze={title:l("div",{class:"cd-title"}),status:l("div",{class:"hint"}),fill:l("div",{class:"cd-fill"}),time:l("span",{class:"hint"}),vol:l("span",{class:"cd-vol"}),mute:l("button",{class:"btn small",title:"Mute",onclick:()=>ot.toggleMute()}),eject:l("button",{class:"btn small danger",onclick:()=>void Th()},"⏏ Take my CD back")};function gi(){if(!dn)return;const u=qe&&!Bn(qe)?qe:null;ze.title.textContent=u?`♪ ${u.title}`:"Nothing playing",ze.status.textContent=u?`Put in by ${u.byName}`:"Use a CD from your inventory on the player.";const g=u?u.endsAt-u.startedAt:0,y=u?Math.min(g,dt()-u.startedAt):0;ze.fill.style.width=g?`${Math.max(0,Math.min(100,y/g*100))}%`:"0%",ze.time.textContent=u?`${or(y/1e3)} / ${or(g/1e3)}`:"",ze.vol.textContent=ot.muted?"muted":`${Math.round(ot.volume*100)}%`,ze.mute.textContent=ot.muted||ot.volume===0?"🔇":"🔊",ze.eject.classList.toggle("hidden",!(u&&u.by===s.uid))}function Ih(){gi(),ot.blocked&&!Ln&&(N("Click anywhere to hear the CD player (your browser holds back sound until you interact with the page).","warn"),Ln=()=>{Ln=null,ot.tryPlay()},window.addEventListener("pointerdown",Ln,{once:!0}))}const ot=new Kb(Ih);function _i(){dn&&(window.clearInterval(dn.timer),dn.el.remove(),dn=null)}function Ja(){if(dn)return _i();const u=y=>ot.setVolume(ot.volume+y),g=l("div",{class:"cd-popup"},l("div",{class:"cd-head"},l("strong",{},"💿 CD player"),l("button",{class:"btn small",onclick:_i},"✕")),ze.title,ze.status,l("div",{class:"cd-bar"},ze.fill),ze.time,l("div",{class:"cd-row"},l("span",{class:"hint"},"Volume"),l("button",{class:"btn small",title:"Quieter",onclick:()=>u(-.1)},"−"),ze.vol,l("button",{class:"btn small",title:"Louder",onclick:()=>u(.1)},"+"),ze.mute),l("div",{class:"hint"},"Volume is just for you. Other players keep their own."),ze.eject);be.append(g),dn={el:g,timer:window.setInterval(gi,500)},gi()}function Xa(u){if(vs(s.inventory,"cd")<0)return cn(),N("Your CD is already in the player.","warn");if(mi())return cn(),N(`The CD player is busy playing ${qe.byName}'s CD.`,"warn");x={type:"cd",fid:u,since:performance.now(),lastTry:0},cn(),N("You walk over to the CD player…")}async function Sh(){if(!kr){kr=!0;try{const u=vs(s.inventory,"cd");if(u<0)return;if(mi())return N(`The CD player is busy playing ${qe.byName}'s CD.`,"warn");await qb(s,u),ae.refresh(),We(s,"cd","put a CD in the CD player"),N("You slide the CD into the player. Music starts up. ♪ It will pop back into your inventory when it's finished.")}catch{N("The CD player spits your CD back out. Someone else got there first.","warn")}finally{kr=!1}}}async function Th(){try{await bc(),We(s,"cd","ejected their CD"),N("You press eject.")}catch{N("The eject button doesn't respond.","warn")}}function kh(u){qe=u,ot.sync(u),gi(),Gb(s,u).then(g=>{g&&(ae.refresh(),N("Your CD pops out of the player and back into your inventory."))})}function xh(){qe&&Bn(qe)&&!xr&&(xr=!0,bc().catch(()=>{}).finally(()=>setTimeout(()=>{xr=!1},3e3)))}async function Ah(u){const g=Dn(),y=i.get(u);if(!(!g||!y||q)){q=!0;try{if(!_c(s,u))return N(`You've already stabbed ${y.name} today.`,"warn");g.dir=Ii(Et(g),Et(y)),g.emote=void 0,Oe(H(j,`rooms/${t}/players/${s.uid}`),{dir:g.dir}).catch(console.warn);try{await zn(H(j,`rooms/${t}/events`),{type:"stab",from:s.uid,to:u,ts:Xe()})}catch{return N("Your stab missed. They may have just left.","warn")}try{await kb(s,u),e.refreshHeader(),ae.refresh(),We(s,"stab",`stabbed ${y.name} (+1)`),N(`You stab ${y.name}. It does them no harm, and a drop of blood trickles into your pouch. (+1)`)}catch{N("The drop of blood slips through your fingers… (the hotel refused it)","warn")}}finally{q=!1}}}let Ar=!1;async function Rh(){if(!Ar){if(vs(s.inventory,"syringe")<0)return N("You don't have a syringe.","warn");if(!sh(s)){const u=Math.max(1,Math.ceil(xo()/6e4));return N(`You've already drawn your blood today. Your arm needs ${u>=60?`${Math.floor(u/60)}h ${u%60}m`:`${u}m`} to recover.`,"warn")}Ar=!0;try{const u=Dn();u&&(u.path=[],u.emote=void 0);try{await zn(H(j,`rooms/${t}/events`),{type:"syringe",from:s.uid,to:s.uid,ts:Xe()})}catch{}try{await xb(s),e.refreshHeader(),ae.refresh(),We(s,"syringe",`drew blood with the syringe (+${Fs})`),N(`You slide the needle in and draw some blood. It fills the barrel nicely. (+${Fs})`)}catch{N("The needle slips and the blood goes to waste… (the hotel refused it)","warn")}}finally{Ar=!1}}}function Ph(){const u=[];for(let g=1;g<Math.min(c.h,5);g++)for(let y=1;y<Math.min(c.w,5);y++)Fe(y,g)&&u.push({x:y,y:g});return u[Math.floor(Math.random()*u.length)]??{x:0,y:0}}const Rr=H(j,`rooms/${t}/players`),yi=H(j,`rooms/${t}/players/${s.uid}`),Za=H(j,`rooms/${t}/chat`),Nh=H(j,`rooms/${t}/events`),el=dt();function tl(u){o||(de(u,"err"),e.navigate("room",{roomId:Xs}))}function Pr(){$.replaceChildren(l("strong",{},`In room (${i.size})`),...[...i.values()].map(u=>l("div",{class:u.uid===s.uid?"me":""},u.name)))}function Oh(){if(a||o)return;a=!0;const u=Ph();i.set(s.uid,ja(s.uid,{name:s.name,figure:s.figure,x:u.x,y:u.y,dir:2})),rr(yi).remove(),it(yi,{name:s.name,figure:s.figure,x:u.x,y:u.y,dir:2,ts:Xe()}).catch(()=>tl("You can't be in that room.")),Ic(s,t);const g=()=>tl("You don't have access to that room.");r.push(Ms(Rr,y=>{if(y.key===s.uid)return;const v=y.val();i.set(y.key,ja(y.key,v)),Ft({figure:v.figure,dir:2}),Pr()},g),zv(Rr,y=>{if(y.key===s.uid)return;const v=y.val(),E=i.get(y.key);if(!E)return;E.name=v.name,E.figure=v.figure,(v.x!==E.dest.x||v.y!==E.dest.y)&&Va(E,{x:v.x,y:v.y});const A=v.emote;if(A&&typeof A.ts=="number"&&A.ts!==E.lastEmoteTs){E.lastEmoteTs=A.ts;const w=Ss[A.id];w&&(E.path=[],za(E,w))}}),Gv(Rr,y=>{i.delete(y.key),(f==null?void 0:f.uid)===y.key&&(f=null,Ce()),Pr()}),Ms(Qs(Za,Ks("ts"),Ys(40)),y=>{var w;const v=y.val();if(!v)return;for(W.append(l("div",{class:"line"},l("b",{class:v.uid===s.uid?"me":""},v.name+": "),v.text));W.children.length>60;)(w=W.firstElementChild)==null||w.remove();W.scrollTop=W.scrollHeight;const E=i.get(v.uid),A=typeof v.ts=="number"?v.ts>el-15e3:!0;E&&A&&(E.bubble={text:v.text,until:performance.now()+uw})},()=>{}),Ms(Qs(Nh,Ks("ts"),Ys(10)),y=>{var E;const v=y.val();if(!(!v||typeof v.ts!="number"||v.ts<el-3e3)){if(v.type==="syringe"){U.push({uid:v.from,start:performance.now(),burst:!1});return}v.type==="stab"&&(F.push({from:v.from,to:v.to,start:performance.now(),impact:!1,dropped:!1}),v.to===s.uid&&v.from!==s.uid&&N(`${((E=i.get(v.from))==null?void 0:E.name)??"Someone"} stabs you with a knife. It doesn't hurt a bit.`))}},()=>{})),r.push(jb(kh)),Pr()}function Mh(){const u=Z.value.trim().slice(0,Tc);if(u){if(Z.value="",u.startsWith("/")){const g=u.slice(1).toLowerCase();return Ss[g]?Ga(g):N(`Unknown command. Emotes: ${Object.keys(Ss).map(y=>"/"+y).join(" ")}`,"warn")}zn(Za,{uid:s.uid,name:s.name,text:u,ts:Xe()}).catch(console.warn)}}function Dh(u,g){var Y;const y=pi(u,g),v=!!u.bubble&&u.bubble.until>g;u.emote&&u.emote.def.ms>0&&g-u.emote.start>u.emote.def.ms&&(u.emote=void 0);const E=y?void 0:u.emote,A=E?g-E.start:0;let w=u.dir,O=0;(E==null?void 0:E.def.motion)==="spin"&&(w=wc[Math.floor(A/140)%8]),(E==null?void 0:E.def.motion)==="dance"&&(w=wc[Math.floor(A/420)%8],O=-Math.abs(Math.sin(A/120))*6),(E==null?void 0:E.def.motion)==="bounce"&&(O=-Math.abs(Math.sin(A/110))*7),(E==null?void 0:E.def.motion)==="hop"&&(O=-Math.abs(Math.sin(A/E.def.ms*Math.PI*2))*16);const L=y?["wlk"]:(E==null?void 0:E.def.actions)??["std"],z=v?"spk":(E==null?void 0:E.def.gesture)??"std",X=y?Math.floor((g-u.stepStart)/(ws/4))%4:v?Math.floor(g/140)%2:(Y=E==null?void 0:E.def.actions)!=null&&Y.includes("wav")?Math.floor(g/250)%2:0;return{opts:{figure:u.figure,dir:w,headDir:w,actions:L,gesture:z,frame:X},yOff:O}}function Lh(u,g){const y=It[u.kind],v=(V,se,he)=>{const ie=Ut(St(V,se));return{x:ie.x,y:ie.y-he*b}},E=v(u.x,u.y,y.height),A=v(u.x+y.w,u.y,y.height),w=v(u.x+y.w,u.y+y.h,y.height),O=v(u.x,u.y+y.h,y.height),L=V=>({x:V.x,y:V.y+y.height*b}),z=(V,se)=>{m.beginPath(),V.forEach((he,ie)=>ie?m.lineTo(he.x,he.y):m.moveTo(he.x,he.y)),m.closePath(),m.fillStyle=se,m.fill()};if(z([O,w,L(w),L(O)],et(y.color,.7)),z([A,w,L(w),L(A)],et(y.color,.55)),z([E,A,w,O],et(y.color,1.05)),u.kind==="arcade"){const V=(ee,ge)=>({x:O.x+(w.x-O.x)*ee,y:O.y+(w.y-O.y)*ee+y.height*b*ge}),se=(ee,ge,Be,hn,vi)=>z([V(ee,ge),V(Be,ge),V(Be,hn),V(ee,hn)],vi);se(.06,.03,.94,.13,`hsl(${g/12%360},90%,60%)`),se(.14,.18,.86,.52,"#06101a");const he=.55+.25*Math.sin(g/130)+.1*Math.sin(g/47);se(.2,.22,.8,.48,`rgba(60,255,150,${he.toFixed(2)})`),se(.2,.56,.8,.64,"#1b2150"),m.fillStyle="#e23b3b";const ie=V(.34,.6);m.beginPath(),m.arc(ie.x,ie.y,3*b,0,Math.PI*2),m.fill(),m.fillStyle="#3b7de2";const fe=V(.64,.6);m.beginPath(),m.arc(fe.x,fe.y,3*b,0,Math.PI*2),m.fill()}else if(u.kind==="lamp"){const V={x:(E.x+w.x)/2,y:(E.y+w.y)/2},se=m.createRadialGradient(V.x,V.y,2,V.x,V.y,34*b);se.addColorStop(0,"rgba(255,240,170,0.55)"),se.addColorStop(1,"rgba(255,240,170,0)"),m.fillStyle=se,m.fillRect(V.x-40*b,V.y-40*b,80*b,80*b)}else if(u.kind==="cdplayer"){const V=mi(),se={x:(E.x+w.x)/2,y:(E.y+w.y)/2},he=17*b,ie=8.5*b;if(m.fillStyle="#1a1d27",m.beginPath(),m.ellipse(se.x,se.y,he*1.08,ie*1.08,0,0,Math.PI*2),m.fill(),m.fillStyle=V?"#cfd8ee":"#8d97ab",m.beginPath(),m.ellipse(se.x,se.y,he,ie,0,0,Math.PI*2),m.fill(),V){const ge=g/260%(Math.PI*2);m.lineWidth=2*b,m.strokeStyle="rgba(255,255,255,0.9)",m.beginPath(),m.ellipse(se.x,se.y,he*.8,ie*.8,0,ge,ge+1),m.stroke(),m.strokeStyle="rgba(124,92,255,0.8)",m.beginPath(),m.ellipse(se.x,se.y,he*.55,ie*.55,0,ge+3.1,ge+4),m.stroke()}m.fillStyle="#10131b",m.beginPath(),m.ellipse(se.x,se.y,he*.2,ie*.2,0,0,Math.PI*2),m.fill();const fe=(ge,Be)=>({x:O.x+(w.x-O.x)*ge,y:O.y+(w.y-O.y)*ge+y.height*b*Be});m.fillStyle="#0e1118";for(const ge of[.28,.72]){const Be=fe(ge,.5);m.beginPath(),m.ellipse(Be.x,Be.y,5*b,6.5*b,0,0,Math.PI*2),m.fill()}const ee=fe(.5,.22);m.fillStyle=V?Math.floor(g/400)%2?"#52e07a":"#2f9c4b":"#5a2a2a",m.beginPath(),m.arc(ee.x,ee.y,2.2*b,0,Math.PI*2),m.fill()}const X=[E.x,A.x,w.x,O.x],Y=[E.y,A.y,w.y,O.y,L(w).y,L(O).y,L(A).y];return{id:"",x0:Math.min(...X),x1:Math.max(...X),y0:Math.min(...Y),y1:Math.max(...Y),depth:u.x+y.w+u.y+y.h-1}}function Fh(u,g,y,v,E){const A=`${Math.round(12*Math.max(1,b))}px Verdana, sans-serif`;m.font=A;const w=190*Math.max(1,b),O=u.split(" "),L=[];let z="";for(const ee of O){const ge=z?z+" "+ee:ee;m.measureText(ge).width>w&&z?(L.push(z),z=ee):z=ge}z&&L.push(z),m.font=`bold ${A}`;const X=m.measureText(g+": ").width;m.font=A;const Y=15*Math.max(1,b),V=Math.max(...L.map(ee=>m.measureText(ee).width))+18,se=Math.max(V,X+18),he=L.length*Y+Y+8,ie=y-se/2,fe=v-he-8;m.save(),m.globalAlpha=E,m.fillStyle="#fff",m.strokeStyle="rgba(0,0,0,0.35)",m.lineWidth=1,m.beginPath(),m.roundRect(ie,fe,se,he,8),m.fill(),m.stroke(),m.beginPath(),m.moveTo(y-5,fe+he),m.lineTo(y,fe+he+7),m.lineTo(y+5,fe+he),m.fill(),m.fillStyle="#111",m.textBaseline="top",m.font=`bold ${A}`,m.fillText(g,ie+9,fe+5),m.font=A,L.forEach((ee,ge)=>m.fillText(ee,ie+9,fe+5+Y*(ge+1))),m.restore()}function $h(u,g){const y=document.createElement("canvas");y.width=u.width,y.height=u.height;const v=y.getContext("2d");return v.drawImage(u,0,0),v.globalCompositeOperation="source-atop",v.fillStyle=`rgba(190,20,20,${g})`,v.fillRect(0,0,y.width,y.height),y}const Uh=u=>u<.3?u/.3:u<.5?1:Math.max(0,1-(u-.5)/.4),Wh=u=>u<.3?0:u<.9?Math.max(0,.65-(u-.3)*1):0;function Bh(u){const g=v=>{const E=Ct(v,u);return{x:E.x,y:E.y-46*b}};for(const v of F){const E=i.get(v.from),A=i.get(v.to);if(!E||!A)continue;const w=(u-v.start)/Qr,O=g(E),L=g(A);if(w>=.12&&w<.5){const z=Math.min(1,(w-.12)/.3),X=O.x+(L.x-O.x)*(.4+.6*z),Y=O.y+(L.y-O.y)*(.4+.6*z);m.save(),m.translate(X,Y),m.rotate(Math.atan2(L.y-O.y,L.x-O.x)+Math.PI*.25),m.imageSmoothingEnabled=!1;const V=26*Math.max(1,b);m.drawImage(hw,-V/2,-V/2,V,V),m.restore()}if(w>=.3&&w<1.15){const z=Math.min(1,(w-.3)/.5)*14*b,X=L.x,Y=L.y-34*b-z,V=11*Math.max(1,b);m.save(),m.globalAlpha=w>.95?Math.max(0,(1.15-w)/.2):1,m.beginPath(),m.arc(X,Y,V,0,Math.PI*2),m.fillStyle="#2f67a8",m.fill(),m.lineWidth=2,m.strokeStyle="#0b2a52",m.stroke(),m.fillStyle="#fff",m.font=`bold ${Math.round(13*Math.max(1,b))}px Verdana, sans-serif`,m.textAlign="center",m.textBaseline="middle",m.fillText("0",X,Y+1),m.restore()}}for(const v of U){const E=i.get(v.uid);if(!E)continue;const A=(u-v.start)/900;if(A>.85)continue;const w=g(E),O=A<.4?A/.4:1;m.save(),m.translate(w.x-(22-8*O)*b,w.y+(-6+6*O)*b),m.rotate(Math.PI*.25),m.imageSmoothingEnabled=!1;const L=28*Math.max(1,b);m.drawImage(pw,-L/2,-L/2,L,L),m.restore()}for(const v of D){const E=i.get(v.from),A=i.get(v.to);if(!E||!A)continue;const w=Math.min(1,(u-v.start)/kc),O=g(A),L={x:Ct(E,u).x,y:Ct(E,u).y-60*b},z={x:(O.x+L.x)/2,y:Math.min(O.y,L.y)-50*b},X=(1-w)*(1-w)*O.x+2*(1-w)*w*z.x+w*w*L.x,Y=(1-w)*(1-w)*O.y+2*(1-w)*w*z.y+w*w*L.y;m.imageSmoothingEnabled=!1;const V=18*Math.max(1,b)*(1-.35*w);m.drawImage(fw,X-V/2,Y-V/2,V,V)}for(const v of M){const E=u-v.born,A=v.x+v.vx*E,w=v.y+v.vy*E+.0014*E*E;m.globalAlpha=Math.max(0,1-E/v.life),m.fillStyle="#b01616";const O=3*Math.max(1,b);m.fillRect(A,w,O,O)}m.globalAlpha=1;const y=c.furni.find(v=>v.kind==="cdplayer");if(y&&un.length){const v=It.cdplayer,E=Ut(St(y.x+.5,y.y+.5));m.textAlign="center",m.textBaseline="middle",m.lineWidth=3,m.strokeStyle="rgba(0,0,0,0.65)";for(const A of un){const w=u-A.born,O=w/A.life,L=E.x+(A.ox+Math.sin(w/240+A.phase)*9)*b,z=E.y-(v.height+8)*b-w*.045*b;m.globalAlpha=O<.15?O/.15:Math.max(0,1-(O-.55)/.45),m.font=`bold ${Math.round((18+6*Math.sin(A.phase))*Math.max(1,b))}px "Segoe UI Symbol", "Apple Symbols", sans-serif`,m.strokeText(A.glyph,L,z),m.fillStyle=A.color,m.fillText(A.glyph,L,z)}m.globalAlpha=1}m.textAlign="center",m.textBaseline="middle",m.font=`${Math.round(20*Math.max(1,b))}px "Segoe UI Emoji", "Apple Color Emoji", sans-serif`;for(const v of T){const E=i.get(v.uid);if(!E)continue;const A=u-v.born,w=Ct(E,u);m.globalAlpha=Math.max(0,1-A/v.life),m.fillText(v.glyph,w.x+v.ox*b,w.y-(Si+6)*b-A*.035*b)}m.globalAlpha=1;for(const v of C){const E=u-v.born;m.globalAlpha=Math.max(0,1-E/1100),m.font=`bold ${Math.round(16*Math.max(1,b))}px Verdana, sans-serif`,m.textAlign="center",m.textBaseline="middle",m.lineWidth=3,m.strokeStyle="#000",m.strokeText(v.text,v.x,v.y-E*.04),m.fillStyle=v.color,m.fillText(v.text,v.x,v.y-E*.04)}m.globalAlpha=1,m.textAlign="start"}function Hh(u){for(let g=F.length-1;g>=0;g--){const y=F[g],v=(u-y.start)/Qr,E=i.get(y.to);if(!y.impact&&v>=.3&&(y.impact=!0,E)){const A=Ct(E,u);for(let w=0;w<9;w++){const O=-Math.PI/2+(Math.random()-.5)*2.2,L=.05+Math.random()*.09;M.push({x:A.x,y:A.y-46*b,vx:Math.cos(O)*L,vy:Math.sin(O)*L,born:u,life:650+Math.random()*250})}}!y.dropped&&v>=.5&&(y.dropped=!0,D.push({from:y.from,to:y.to,start:u})),v>1.3&&F.splice(g,1)}for(let g=D.length-1;g>=0;g--){const y=D[g];if(u-y.start>=kc){const v=i.get(y.from);if(v&&y.from===s.uid){const E=Ct(v,u);C.push({text:"+1",x:E.x,y:E.y-70*b,born:u,color:"#ff5252"})}D.splice(g,1)}}if(mi()&&u-Qa>360){Qa=u;const g=["♪","♫","♬","♩"],y=["#ffd54a","#ff7fbf","#7fe3ff","#9dff8a"];un.push({born:u,life:2200,glyph:g[Math.floor(Math.random()*4)],ox:(Math.random()-.5)*22,phase:Math.random()*6,color:y[Math.floor(Math.random()*4)]})}for(let g=un.length-1;g>=0;g--)u-un[g].born>un[g].life&&un.splice(g,1);for(let g=U.length-1;g>=0;g--){const y=U[g],v=(u-y.start)/900,E=i.get(y.uid);if(!y.burst&&v>=.45&&(y.burst=!0,E)){const A=Ct(E,u);for(let w=0;w<7;w++){const O=-Math.PI/2+(Math.random()-.5)*1.6,L=.04+Math.random()*.06;M.push({x:A.x-8*b,y:A.y-44*b,vx:Math.cos(O)*L,vy:Math.sin(O)*L,born:u,life:600+Math.random()*250})}y.uid===s.uid&&C.push({text:`+${Fs}`,x:A.x,y:A.y-70*b,born:u,color:"#ff5252"})}(v>1.2||!E)&&U.splice(g,1)}for(const g of i.values()){const y=g.emote;y!=null&&y.def.fx&&u-y.lastFx>420&&!pi(g,u)&&(y.lastFx=u,T.push({uid:g.uid,glyph:y.def.fx[Math.floor(Math.random()*y.def.fx.length)],born:u,life:1500,ox:(Math.random()-.5)*30}))}for(let g=T.length-1;g>=0;g--)u-T[g].born>T[g].life&&T.splice(g,1);for(let g=M.length-1;g>=0;g--)u-M[g].born>M[g].life&&M.splice(g,1);for(let g=C.length-1;g>=0;g--)u-C[g].born>1100&&C.splice(g,1)}let Nr=0;function nl(){if(o)return;Nr=requestAnimationFrame(nl);const u=performance.now(),g=window.devicePixelRatio||1;if(m.setTransform(g,0,0,g,0,0),m.imageSmoothingEnabled=b<1,m.clearRect(0,0,k.width,k.height),m.drawImage(Qe,le-rt.x*b,ye-rt.y*b,Qe.width*b,Qe.height*b),!a)return;for(const w of i.values())Eh(w,u);if(Ch(u),xh(),Hh(u),h){const w=Ut(St(h.x,h.y));m.beginPath(),m.moveTo(w.x,w.y),m.lineTo(w.x+Bt/2*b,w.y+ft/2*b),m.lineTo(w.x,w.y+ft*b),m.lineTo(w.x-Bt/2*b,w.y+ft/2*b),m.closePath(),m.strokeStyle="rgba(255,255,255,0.9)",m.lineWidth=2,m.stroke()}const y=[],v=[],E=[],A=[];for(const w of c.furni)y.push({depth:w.x+It[w.kind].w+w.y+It[w.kind].h-1,draw:()=>{const O=Lh(w,u);O&&Zb.has(w.kind)&&E.push({...O,id:w.id,kind:w.kind})}});for(const w of i.values()){const O=qa(w,u),{opts:L,yOff:z}=Dh(w,u);let X=hb(L);X?w.last=X:(Ft(L),X=w.last);const Y=Ct(w,u);let V={x:0,y:0},se=0;for(const ie of F){const fe=(u-ie.start)/Qr;if(!(fe>1)){if(ie.from===w.uid){const ee=i.get(ie.to);if(ee){const ge=Ct(ee,u),Be=ge.x-Y.x,hn=ge.y-Y.y,vi=Math.hypot(Be,hn)||1,sl=Uh(fe)*16*b;V={x:Be/vi*sl,y:hn/vi*sl}}}ie.to===w.uid&&(se=Math.max(se,Wh(fe)))}}const he=z*b;if(v.push({id:w.uid,x0:Y.x-22*b,x1:Y.x+22*b,y0:Y.y-Si*b,y1:Y.y+8*b,depth:O.x+O.y}),y.push({depth:O.x+O.y+.5,draw:()=>{var ee;if(m.fillStyle="rgba(0,0,0,0.18)",m.beginPath(),m.ellipse(Y.x+V.x,Y.y+V.y,16*b,7*b,0,0,Math.PI*2),m.fill(),X){const ge=Y.x+V.x-32*b,Be=Y.y+V.y+he-Si*b;m.drawImage(X,ge,Be,X.width*b,X.height*b),se>.02&&m.drawImage($h(X,se),ge,Be,X.width*b,X.height*b)}const ie=(f==null?void 0:f.uid)===w.uid&&w.uid!==s.uid&&((ee=pe())==null?void 0:ee.useOnPlayer)==="stab";m.font=`${Math.round(10*Math.max(1,b))}px Verdana, sans-serif`;const fe=m.measureText(w.name).width+10;m.fillStyle=ie?"rgba(150,20,20,0.85)":"rgba(0,0,0,0.55)",m.beginPath(),m.roundRect(Y.x-fe/2,Y.y+7*b,fe,14*Math.max(1,b),5),m.fill(),m.fillStyle=w.uid===s.uid?"#ffe27a":"#fff",m.textBaseline="top",m.textAlign="center",m.fillText(w.name,Y.x,Y.y+9*b),m.textAlign="start"}}),w.bubble&&w.bubble.until>u){const ie=w.bubble.until-u,fe=w.bubble;A.push(()=>Fh(fe.text,w.name,Y.x,Y.y-(Si+4)*b,ie<800?ie/800:1))}}_=v,y.sort((w,O)=>w.depth-O.depth).forEach(w=>w.draw()),p=E,Bh(u),A.forEach(w=>w())}async function jh(){{fi(Ec()),Oh();return}}return fi(c),Nr=requestAnimationFrame(nl),jh(),()=>{o=!0,cancelAnimationFrame(Nr),Ze.disconnect(),window.removeEventListener("keydown",Ha),r.forEach(u=>u()),_i(),ot.stop(),Ln&&window.removeEventListener("pointerdown",Ln),ae.dispose(),a&&(rr(yi).cancel(),Sn(yi)),Ic(s,"")}}const pt={clothing:{},emotes:{},items:{},music:{}},gw=5,Do=new Set,fh=()=>pt.music.pass??{on:!0,price:Eb},Lo=n=>pt.items[n]??{on:!1,price:gw};function _w(n){pt.clothing=(n==null?void 0:n.clothing)??{},pt.emotes=(n==null?void 0:n.emotes)??{},pt.items=(n==null?void 0:n.items)??{},pt.music=(n==null?void 0:n.music)??{},gb(pt.clothing),Jb(pt.emotes),Do.forEach(e=>e())}function yw(){let n;const e=new Promise(s=>n=s),t=Ot(H(j,"config/shop"),s=>{_w(s.exists()?s.val():null),n()},()=>n());return{ready:e,stop:t}}function vw(n){return Do.add(n),()=>Do.delete(n)}function Tt(n,e,t){return it(H(j,`config/shop/${n}/${e}`),{on:!!t.on,price:Math.max(0,Math.min(999,Math.round(t.price)))})}function Jr(n,e){return Sn(H(j,`config/shop/${n}/${e}`))}const ph=n=>l("span",{},l("img",{src:kn,class:"blood-ico",alt:""}),` ${n}`);function bw(n,e){let t="clothing",s=null;const i=l("div",{class:"shop-tabs"}),r=l("div",{class:"shop-content"});n.append(l("div",{class:"shop"},i,r));function o(c){t=c,s==null||s(),s=null,r.replaceChildren(),i.replaceChildren(...[["clothing","Clothing"],["emotes","Emotes"],["items","Items"],["music","Music"]].map(([h,f])=>l("button",{class:"tab big"+(t===h?" on":""),onclick:()=>o(h)},f)));const d=()=>o(t);s=t==="clothing"?ch(r,e,"shop"):t==="emotes"?ww(r,e,d):t==="items"?Ew(r,e,d):Cw(r,e,d)}o("clothing");const a=vw(()=>{t!=="clothing"&&o(t)});return()=>{a(),s==null||s()}}function ww(n,e,t){const s=e.profile,i=is.filter(o=>Gn(o)===0),r=is.filter(o=>o.price>0&&Gn(o)>0&&(Xb(o)||Js(s,o.id)));return n.append(l("div",{class:"panel"},l("h2",{},"Emotes"),l("p",{class:"muted"},`You already have: ${i.map(o=>`${o.icon} ${o.name}`).join("  ")}. Unlocked emotes show up in the Emotes tab in the lobby, or type /name in chat.`),r.length===0?l("p",{class:"muted"},"Nothing on sale right now. Check back soon."):null,l("div",{class:"emote-shop"},...r.map(o=>{const a=Js(s,o.id),c=Gn(o),d=s.blood>=c;return l("div",{class:"emote-card"+(a?" owned":"")},l("div",{class:"emote-card-icon"},o.icon),l("div",{class:"emote-card-name"},o.name),l("div",{class:"hint"},o.desc),a?l("div",{class:"ok-text"},"✔ Owned"):l("button",{class:"btn small primary",disabled:!d,title:d?"":`You need ${c-s.blood} more drops`,onclick:async()=>{try{await La(s,[uh(o.id)],c),e.refreshHeader(),We(s,"buy",`bought the ${o.name} emote for ${c}`),de(`${o.name} unlocked! Try /${o.id} in the lobby.`),t()}catch(h){de(h.message,"err")}}},ph(c)))})))),()=>{}}function Ew(n,e,t){const s=e.profile,i=Object.values(vt).filter(o=>Lo(o.id).on),r=o=>s.inventory.filter(a=>(a==null?void 0:a.item)===o).length;return n.append(l("div",{class:"panel"},l("h2",{},"Items"),i.length===0?l("p",{class:"muted"},"No items on sale right now. Check back soon."):l("p",{class:"muted"},"Bought items go straight into your inventory."),l("div",{class:"emote-shop"},...i.map(o=>{const a=Lo(o.id).price,c=s.blood>=a;return l("div",{class:"emote-card"},l("img",{src:o.icon,alt:o.name,style:{width:"48px",height:"48px",imageRendering:"pixelated"}}),l("div",{class:"emote-card-name"},o.name),l("div",{class:"hint"},o.examine),r(o.id)?l("div",{class:"hint"},`You have ${r(o.id)}`):null,l("button",{class:"btn small primary",disabled:!c,title:c?"":`You need ${a-s.blood} more drops`,onclick:async()=>{try{await Tb(s,o.id,a),e.refreshHeader(),We(s,"buy",`bought a ${o.name} for ${a}`),de(`${o.name} added to your inventory.`),t()}catch(d){de(d.message,"err")}}},ph(a)))})))),()=>{}}function Cw(n,e,t){const s=e.profile,i=fh(),r=!!s.owned[ko],o=s.blood>=i.price;return n.append(l("div",{class:"panel music-card"},l("h2",{},"Jukebox pass"),l("p",{},`Stream music while you're in 6ixPlanet. Includes ${Yt.length} track${Yt.length===1?"":"s"} for now; more get added over time.`),l("ul",{class:"muted"},...Yt.map(a=>l("li",{},`♪ ${a.title}`))),r?l("div",{},l("p",{class:"ok-text"},"✔ You own this."),l("button",{class:"btn primary",onclick:()=>e.navigate("room")},"Go listen (Music tab in the lobby)")):i.on?l("div",{},l("button",{class:"btn primary",disabled:!o,onclick:async()=>{try{await La(s,[ko],i.price),e.refreshHeader(),We(s,"buy",`bought the jukebox pass for ${i.price}`),de("Jukebox pass unlocked! Open the Music tab in the lobby."),t()}catch(a){de(a.message,"err")}}},l("img",{src:kn,class:"blood-ico",alt:""}),` Buy for ${i.price} drops`),o?null:l("p",{class:"muted"},`You have ${s.blood}. Stab people in the lobby to earn drops.`)):l("p",{class:"muted"},"The jukebox pass isn't on sale right now."))),()=>{}}function Iw(n,e){const t=e.profile;let s=!1;function i(c,d){Ft({figure:d,dir:2,headDir:2}).then(h=>{s||!h||c.getContext("2d").drawImage(h,0,0)})}function r(c){const d=l("canvas",{class:"wardrobe-canvas",width:64,height:110});return i(d,c),d}const o=l("div",{class:"panel wardrobe"});n.append(o);function a(){const c=Array.from({length:Cb},(d,h)=>{const f=t.wardrobe[h];return l("div",{class:"slot"+(f?"":" empty")},l("div",{class:"slot-title"},`Slot ${h+1}`),f?r(f.figure):l("div",{class:"slot-empty"},"empty"),l("div",{class:"row center"},l("button",{class:"btn small",onclick:async()=>{try{await Ab(t,h,{figure:t.figure,gender:t.gender}),We(t,"outfit",`saved an outfit to slot ${h+1}`),de(`Saved current look to slot ${h+1}`),a()}catch(_){de(_.message,"err")}}},f?"Overwrite":"Save here"),f?l("button",{class:"btn small primary",onclick:async()=>{try{await Ao(t,f.figure,f.gender),We(t,"outfit",`wore the outfit in slot ${h+1}`),e.refreshHeader(),de("Outfit on!"),a()}catch(_){de(_.message,"err")}}},"Wear"):null,f?l("button",{class:"btn small danger",onclick:async()=>{try{await Rb(t,h),a()}catch(_){de(_.message,"err")}}},"✕"):null))});o.replaceChildren(l("h2",{},"Wardrobe"),l("div",{class:"wardrobe-current"},r(t.figure),l("div",{},l("strong",{},"Wearing now"),l("p",{class:"muted"},"Save the look you're wearing into a slot, then swap between outfits any time. New clothes are in the shop."),l("button",{class:"btn",onclick:()=>e.navigate("shop")},"Open shop"))),l("div",{class:"slots"},...c))}return a(),()=>{s=!0}}function Ac(n){const e=l("div",{class:"head"});return Ft({figure:n,dir:2,headDir:2,headOnly:!0}).then(t=>{if(!t||!e.isConnected)return;const s=Ir(t);s.className="head-canvas",e.replaceChildren(s)}),e}const Sw=n=>new Date(n).toLocaleTimeString([],{hour:"2-digit",minute:"2-digit"});function Tw(n,e){const t=e.profile;let s=!1;const i=new Map,r=l("span",{class:"badge hidden"}),o=l("button",{class:"btn friends-toggle",onclick:()=>{s=!s,p()}},"👥 Friends ",r),a=l("div",{class:"friends-panel hidden"}),c=l("div",{class:"chat-windows"}),d=l("div",{class:"invite-popups"}),h=l("div",{class:"messenger"},c,l("div",{class:"friends-col"},a,o));n.append(h,d);const f=l("input",{type:"text",placeholder:"Add friend by username",maxLength:16,class:"mini-input"});async function _(){const C=f.value;f.value="";try{de(await re.sendRequest(C))}catch(T){de(T.message||"Couldn't send that request.","err")}}function p(){a.classList.toggle("hidden",!s);const C=[...re.friends.values()].sort(($,J)=>Number(re.isOnline(J.uid))-Number(re.isOnline($.uid))||$.name.localeCompare(J.name)),T=C.filter($=>re.isOnline($.uid)).length;o.firstChild.textContent=`👥 Friends (${T}/${C.length}) `;const P=re.totalUnread;if(r.textContent=String(P),r.classList.toggle("hidden",P===0),!s)return;const k=[...re.requests.values()].map($=>l("div",{class:"frow"},Ac($.figure),l("span",{class:"fname"},$.name),l("button",{class:"btn small primary",title:"Accept",onclick:()=>re.accept($.uid).then(()=>de(`You and ${$.name} are friends now.`),()=>de("Couldn't accept that.","err"))},"✓"),l("button",{class:"btn small",title:"Decline",onclick:()=>void re.decline($.uid)},"✕"))),W=[].map($=>l("div",{class:"frow"},l("span",{class:"fname"},`${$.fromName} invited you to "${$.roomName}"`),l("button",{class:"btn small primary",onclick:()=>{re.dismissInvite($.id),e.navigate("room",{roomId:$.room})}},"Join"),l("button",{class:"btn small",onclick:()=>void re.dismissInvite($.id)},"✕")));a.firstChild||a.append(l("div",{class:"fp-head"},l("strong",{},"Friends"),l("button",{class:"btn small",onclick:()=>{s=!1,p()}},"–")),l("form",{class:"row fp-add",onsubmit:$=>{$.preventDefault(),_()}},f,l("button",{class:"btn small",type:"submit"},"Add")),I),I.replaceChildren(...W.length?[l("div",{class:"fp-sec"},l("div",{class:"fp-label"},"Room invites"),...W)]:[],...k.length?[l("div",{class:"fp-sec"},l("div",{class:"fp-label"},`Requests (${k.length})`),...k)]:[],l("div",{class:"fp-list"},...C.length===0?[l("div",{class:"hint pad"},"No friends yet. Add someone by username, or right-click a player in a room.")]:C.map($=>S($))))}const I=l("div",{class:"fp-dyn"});function S(C){const T=re.isOnline(C.uid),P=re.roomOf(C.uid),k=re.unread.get(C.uid)??0;return l("div",{class:"frow"},Ac(C.figure),l("span",{class:"dot "+(T?"on":"")}),l("span",{class:"fname",title:T?P?"In a room":"Online":"Offline",onclick:()=>x(C.uid)},C.name),k?l("span",{class:"badge"},String(k)):null,l("button",{class:"btn small",title:"Message",onclick:()=>x(C.uid)},"💬"),P&&(P===Xs||Bb.rooms)?l("button",{class:"btn small",title:P===Xs?"Go to the lobby":"Follow into their room",onclick:()=>e.navigate("room",{roomId:P})},"➜"):null,l("button",{class:"btn small",title:"Remove friend",onclick:()=>{confirm(`Remove ${C.name} from your friends?`)&&re.removeFriend(C.uid).then(()=>q(C.uid))}},"✕"))}function x(C){const T=re.friends.get(C);if(!T)return;re.openChat.add(C),re.markRead(C),s=!1,p();const P=i.get(C);if(P){P.el.classList.remove("min"),P.render();return}const k=l("div",{class:"cw-log"}),W=l("input",{type:"text",maxLength:200,placeholder:`Message ${T.name}…`,class:"cw-input",autocomplete:"off"}),$=l("span",{class:"dot"}),J=l("div",{class:"cw-head",onclick:()=>ue.classList.toggle("min")},$,l("strong",{},T.name),l("button",{class:"btn small",onclick:be=>{be.stopPropagation(),q(C)}},"✕")),ue=l("div",{class:"chat-window"},J,k,l("form",{class:"cw-form",onsubmit:be=>{be.preventDefault();const ce=W.value.trim();ce&&(W.value="",re.sendDm(C,ce).catch(()=>de("That message didn't go through.","err")))}},W)),Z=()=>{$.className="dot "+(re.isOnline(C)?"on":"");const be=re.dms.get(C)??[];k.replaceChildren(...be.length===0?[l("div",{class:"hint pad"},"Say hi!")]:be.map(ce=>l("div",{class:"cw-msg"+(ce.from===t.uid?" mine":"")},l("div",{class:"cw-bubble"},ce.text),l("div",{class:"cw-time"},Sw(ce.ts))))),k.scrollTop=k.scrollHeight};i.set(C,{el:ue,log:k,render:Z}),c.append(ue),Z(),W.focus()}function q(C){const T=i.get(C);T&&(T.el.remove(),i.delete(C)),re.openChat.delete(C)}const Q=C=>x(C.detail);window.addEventListener("open-chat",Q);const F=()=>{s=!s,p()};window.addEventListener("toggle-friends",F);const U=re.subscribe(()=>{p();for(const[C,T]of i)re.friends.has(C)?(re.markRead(C),T.render()):q(C)}),D=re.onDm((C,T)=>{if(T.from===t.uid||i.has(C))return;const P=re.friends.get(C);if(!P)return;const k=l("div",{class:"toast ok show msg-toast",onclick:()=>{x(C),k.remove()}},`💬 ${P.name}: ${T.text.slice(0,60)}`);document.body.append(k),setTimeout(()=>k.remove(),5e3)}),M=re.onInvite(C=>{});return p(),()=>{U(),D(),M(),window.removeEventListener("open-chat",Q),window.removeEventListener("toggle-friends",F),h.remove(),d.remove()}}const kw=(()=>{const n=new Uint32Array(256);for(let e=0;e<256;e++){let t=e;for(let s=0;s<8;s++)t=t&1?3988292384^t>>>1:t>>>1;n[e]=t>>>0}return n})();function xw(n){let e=4294967295;for(let t=0;t<n.length;t++)e=kw[(e^n[t])&255]^e>>>8;return(e^4294967295)>>>0}const _n=n=>new TextEncoder().encode(n);function mh(n){const e=[],t=[];let s=0;const i=new Date,r=i.getHours()<<11|i.getMinutes()<<5|i.getSeconds()>>1,o=i.getFullYear()-1980<<9|i.getMonth()+1<<5|i.getDate();for(const d of n){const h=_n(d.path),f=xw(d.data),_=new DataView(new ArrayBuffer(30));_.setUint32(0,67324752,!0),_.setUint16(4,20,!0),_.setUint16(6,2048,!0),_.setUint16(8,0,!0),_.setUint16(10,r,!0),_.setUint16(12,o,!0),_.setUint32(14,f,!0),_.setUint32(18,d.data.length,!0),_.setUint32(22,d.data.length,!0),_.setUint16(26,h.length,!0),_.setUint16(28,0,!0),e.push(new Uint8Array(_.buffer),h,d.data);const p=new DataView(new ArrayBuffer(46));p.setUint32(0,33639248,!0),p.setUint16(4,20,!0),p.setUint16(6,20,!0),p.setUint16(8,2048,!0),p.setUint16(10,0,!0),p.setUint16(12,r,!0),p.setUint16(14,o,!0),p.setUint32(16,f,!0),p.setUint32(20,d.data.length,!0),p.setUint32(24,d.data.length,!0),p.setUint16(28,h.length,!0),p.setUint32(42,s,!0),t.push(new Uint8Array(p.buffer),h),s+=30+h.length+d.data.length}const a=t.reduce((d,h)=>d+h.length,0),c=new DataView(new ArrayBuffer(22));return c.setUint32(0,101010256,!0),c.setUint16(8,n.length,!0),c.setUint16(10,n.length,!0),c.setUint32(12,a,!0),c.setUint32(16,s,!0),new Blob([...e,...t,new Uint8Array(c.buffer)],{type:"application/zip"})}function Xr(n,e){const t=URL.createObjectURL(n),s=document.createElement("a");s.href=t,s.download=e,document.body.append(s),s.click(),s.remove(),setTimeout(()=>URL.revokeObjectURL(t),1e4)}function gh(n){var i,r,o;const e=Tn.figuredata,t=(o=(r=(i=e==null?void 0:e.settype)==null?void 0:i[n.type])==null?void 0:r.set)==null?void 0:o[n.id];if(!t)return null;const s=(t.part??[]).map(a=>{var c,d;return{type:a.type,id:a.id,index:a.index,colorable:!!a.colorable,colorindex:a.colorindex??0,lib:((d=(c=Tn.figuremap)==null?void 0:c[a.type])==null?void 0:d[a.id])??null}});return{...n,gender:t.gender,club:t.club??0,selectable:!!t.selectable,colorable:!!t.colorable,colors:Math.max(0,...s.map(a=>a.colorindex)),hidden:Array.isArray(t.hidden)?t.hidden:[],parts:s}}function Rc(n){var t,s,i;const e=((i=(s=(t=Tn.figuredata)==null?void 0:t.settype)==null?void 0:s[n])==null?void 0:i.set)??{};return Object.keys(e).map(r=>gh({type:n,id:r})).filter(r=>!!r).sort((r,o)=>Number(r.id)-Number(o.id))}function _h(n){const e=Ls(Ds[n.gender==="F"?"F":"M"]),t=Ma(n.type);return e[n.type]={id:n.id,colors:Array.from({length:n.colors},(s,i)=>{var r;return((r=t[Math.min(i*3,t.length-1)])==null?void 0:r.id)??"1"})},Is(e)}const Fo=n=>new Promise((e,t)=>n.toBlob(s=>s?s.arrayBuffer().then(i=>e(new Uint8Array(i))):t(new Error("PNG encoding failed")),"image/png")),yh=n=>new Promise((e,t)=>{const s=URL.createObjectURL(n),i=new Image;i.onload=()=>{URL.revokeObjectURL(s),e(i)},i.onerror=()=>{URL.revokeObjectURL(s),t(new Error("couldn't decode an atlas"))},i.src=s}),Aw=`6ixPlanet clothing template pack
================================

Made by the admin panel (Clothes & Items). Use it as a starting point for designing your own clothes.

items/<slot>_<id>/        one folder per exported clothing item
  item.json               what the item is: slot, gender, which sprite layers it uses and whether they're tinted
  preview_dir0..7.png     the item worn on a default character, standing, from all 8 directions (direction 2 = facing the viewer's right)
  frames/                 (if you ticked "include frames") every sprite frame of the item as its own transparent PNG
libs/<library>/           the sprite sheets those items come from
  atlas.png               all frames packed into one image
  offset.json             for every frame: where its anchor is (x, y) so it lines up on the body, plus the atlas position data
figuredata-selected.json  the avatar-data entries for the selected items (same format the game reads)

How the sprites work
--------------------
* A frame is named  h_<action>_<layer>_<id>_<direction>_<frame>   (sh_ = small size).
  action: std (standing), wlk (walking), sit, wav (waving)...   direction: 0-7   frame: animation frame.
* Layers flagged  "colorable": true  in item.json are drawn in grey/white and then TINTED with the player's chosen colour
  (multiplied). So paint colourable layers in greyscale shading, and non-colourable layers in full colour.
* Directions 4-6 are usually mirrored from 2-0 by the game, so only some directions exist as files.
* Keep every frame the same size and position (the offsets in offset.json depend on it), and keep the file names.

Previews are rendered with the item's default colours on the default boy/girl look, only so you can see the item in context.
`;async function Rw(n,e,t){var _,p,I;const s=[],i=n.map(gh).filter(S=>!!S),r=new Map,o=[...new Set(i.flatMap(S=>S.parts.map(x=>x.lib).filter(x=>!!x)))],a=o.length+i.length*8+(e.frames?i.length:0);let c=0;const d=S=>t(++c,a,S);for(const S of o){const[x,q]=await Promise.all([fetch(`${Co}${S}/atlas.png`),fetch(`${Co}${S}/offset.json`)]);if(!x.ok||!q.ok){d(`skipped ${S} (not available)`);continue}const Q=await x.blob(),F=await q.text();r.set(S,{atlasBytes:new Uint8Array(await Q.arrayBuffer()),atlasImg:e.frames?await yh(Q):void 0,offset:JSON.parse(F)}),s.push({path:`libs/${S}/atlas.png`,data:r.get(S).atlasBytes},{path:`libs/${S}/offset.json`,data:_n(F)}),d(`sprite sheet ${S}`)}for(const S of i){const x=`items/${S.type}_${S.id}`;s.push({path:`${x}/item.json`,data:_n(JSON.stringify(S,null,2))});const q=_h(S);for(let Q=0;Q<8;Q++){const F=await Ft({figure:q,dir:Q,headDir:Q});F&&s.push({path:`${x}/preview_dir${Q}.png`,data:await Fo(F)}),d(`${S.type}-${S.id} preview ${Q+1}/8`)}if(e.frames){for(const Q of S.parts){const F=Q.lib&&r.get(Q.lib);if(!F||!F.atlasImg||!((p=(_=F.offset)==null?void 0:_.atlas)!=null&&p.frames))continue;const U=`_${Q.type}_${Q.id}_`;for(const D of Object.keys(F.offset.atlas.frames)){if(!D.includes(U))continue;const M=Ku(F.offset.atlas,F.atlasImg,D);M&&s.push({path:`${x}/frames/${D.replace(`${Q.lib}_`,"")}`,data:await Fo(M)})}}d(`${S.type}-${S.id} frames`)}}const h=Tn.figuredata,f={};for(const S of i)f[I=S.type]??(f[I]={paletteid:h.settype[S.type].paletteid,set:{}}),f[S.type].set[S.id]=h.settype[S.type].set[S.id];return s.push({path:"figuredata-selected.json",data:_n(JSON.stringify({settype:f},null,2))},{path:"README.txt",data:_n(Aw)}),mh(s)}async function Pw(n){const e=[];for(const t of n){const s=await fetch(t.url);if(!s.ok)continue;const i=await s.text();e.push({path:`items/${t.name}.svg`,data:_n(i)});const r=new Blob([i],{type:"image/svg+xml"}),o=await yh(r),a=document.createElement("canvas");a.width=a.height=256;const c=a.getContext("2d");c.imageSmoothingEnabled=!1,c.drawImage(o,0,0,256,256),e.push({path:`items/${t.name}_256.png`,data:await Fo(a)})}return e.push({path:"README.txt",data:_n(`Item icons as SVG (editable, 16x16 pixel grid) and as 256px PNG previews.
`)}),mh(e)}const Nw=[["accounts","Accounts"],["chat","Chat"],["private","Private messages"],["actions","Actions"],["clothes","Clothes & Items"],["settings","Settings"]],Ti=n=>new Date(n).toLocaleString([],{month:"short",day:"numeric",hour:"2-digit",minute:"2-digit",second:"2-digit"}),Zr=n=>n?new Date(n).toLocaleDateString([],{year:"numeric",month:"short",day:"numeric"}):"?";async function ki(){const e=(await hi(H(j,"users"))).val()??{};return Object.entries(e).map(([t,s])=>({uid:t,name:s.name??"?",figure:s.figure??"",gender:s.gender??"M",blood:s.blood??0,owned:s.owned??{},inventory:s.inventory??{},wardrobe:s.wardrobe??{},stabs:s.stabs??{},syringeDay:s.syringeDay??0,createdAt:s.createdAt??0}))}function Pc(n){const e=l("div",{class:"head"});return n&&Ft({figure:n,dir:2,headDir:2,headOnly:!0}).then(t=>{if(!t||!e.isConnected)return;const s=Ir(t);s.className="head-canvas",e.replaceChildren(s)}),e}function Ow(n,e){let t="accounts",s=null,i=[];const r=()=>new Map(i.map(D=>[D.uid,D.name])),o=l("div",{class:"admin-tabs tabs"}),a=l("div",{class:"admin-body"});n.append(l("div",{class:"admin"},l("div",{class:"privnote"},"Admin. Players are told on the sign-in screen that staff can see chat, private messages and activity. Treat what you see here as private."),o,a));function c(D){s==null||s(),s=null,t=D,a.replaceChildren(),o.replaceChildren(...Nw.map(([C,T])=>l("button",{class:"tab"+(C===t?" on":""),onclick:()=>c(C)},T)));const M={accounts:d,chat:h,private:f,actions:_,clothes:p,settings:U}[t];Promise.resolve(M(a)).then(C=>{t===D?s=C??null:C==null||C()})}async function d(D){D.append(l("div",{class:"loading",style:{color:"#555"}},"Loading accounts…")),i=await ki();let M=null,C="";const T=l("div",{class:"adminstat"}),P=l("div",{class:"scroll-box"}),k=l("div",{}),W=l("input",{class:"mini-input",placeholder:"Search by username…",oninput:()=>{C=W.value.trim().toLowerCase(),J()}}),$=l("button",{class:"btn small",onclick:async()=>{i=await ki(),J(),de("Refreshed")}},"Refresh");function J(){const Z=i.filter(m=>m.name.toLowerCase().includes(C)).sort((m,N)=>N.createdAt-m.createdAt),be=i.filter(m=>re.isOnline(m.uid)).length;T.replaceChildren(l("div",{class:"panel"},l("b",{},String(i.length)),"accounts"),l("div",{class:"panel"},l("b",{},String(be)),"online now"),l("div",{class:"panel"},l("b",{},String(i.reduce((m,N)=>m+N.blood,0))),"drops in circulation")),P.replaceChildren(l("table",{class:"atable"},l("thead",{},l("tr",{},...["","Username","Online","Drops","Items owned","Stabs today","Joined","ID"].map(m=>l("th",{},m)))),l("tbody",{},...Z.map(m=>l("tr",{style:{cursor:"pointer",background:m.uid===M?"#e4edfb":""},onclick:()=>{M=m.uid,J()}},l("td",{},Pc(m.figure)),l("td",{},l("b",{},m.name)),l("td",{},l("span",{class:"dot "+(re.isOnline(m.uid)?"on":"")})),l("td",{class:"num"},String(m.blood)),l("td",{class:"num"},String(Object.keys(m.owned).length)),l("td",{class:"num"},String(Object.values(m.stabs).filter(N=>N>=on()).length)),l("td",{},Zr(m.createdAt)),l("td",{class:"hint"},m.uid.slice(0,8)))))));const ce=i.find(m=>m.uid===M);k.replaceChildren(...ce?[ue(ce)]:[])}function ue(Z){const be=r(),ce=Object.entries(Z.inventory).map(([N,ae])=>{var B;return`${((B=vt[ae.item])==null?void 0:B.name)??ae.item}${ae.inPlayer?" (in the CD player)":""} (slot ${Number(N)+1})`}),m=Object.entries(Z.stabs).map(([N,ae])=>`${be.get(N)??N.slice(0,6)} (${Zr(ae)})`);return l("div",{class:"panel",style:{marginTop:"10px"}},l("h2",{},Z.name),l("div",{class:"row"},Pc(Z.figure),l("div",{},l("div",{},`Gender ${Z.gender} · joined ${Zr(Z.createdAt)} · ${Z.blood} drops`),l("div",{class:"hint"},`uid ${Z.uid}`))),l("p",{},l("b",{},"Inventory: "),ce.join(", ")||"empty"),l("p",{},l("b",{},"Owned: "),Object.keys(Z.owned).join(", ")||"nothing bought yet"),l("p",{},l("b",{},"Wardrobe: "),`${Object.keys(Z.wardrobe).length} saved outfits`),l("p",{},l("b",{},"Syringe: "),Z.syringeDay>=on()?"used today":"not used today"),l("p",{},l("b",{},"Has stabbed: "),m.join(", ")||"nobody"))}return D.replaceChildren(l("div",{class:"admin-bar"},W,$),T,P,k),J(),re.subscribe(()=>{t==="accounts"&&J()})}async function h(D){i.length||(i=await ki());let M="",C=[];const T=l("div",{class:"scroll-box"}),P=l("input",{class:"mini-input",placeholder:"Filter by name or text…",oninput:()=>{M=P.value.trim().toLowerCase(),k()}});function k(){const $=C.filter(J=>!M||J.name.toLowerCase().includes(M)||J.text.toLowerCase().includes(M));T.replaceChildren(l("table",{class:"atable"},l("thead",{},l("tr",{},...["Time","User","Message"].map(J=>l("th",{},J)))),l("tbody",{},...$.map(J=>l("tr",{},l("td",{class:"hint"},Ti(J.ts)),l("td",{},l("b",{},J.name)),l("td",{},J.text)))))),T.scrollTop=T.scrollHeight}return D.append(l("div",{class:"admin-bar"},P,l("span",{class:"hint"},"Lobby chat, last 300 messages, live")),T),Ot(Qs(H(j,"rooms/lobby/chat"),Ks("ts"),Ys(300)),$=>{C=[],$.forEach(J=>{const ue=J.val();C.push({ts:ue.ts??0,uid:ue.uid,name:ue.name??"?",text:ue.text??""})}),k()},()=>de("Couldn't read the chat","err"))}async function f(D){i.length||(i=await ki());let M=[],C=null,T="";const P=l("div",{class:"scroll-box"}),k=l("div",{class:"scroll-box",style:{padding:"10px",background:"#dbe2ef"}}),W=l("input",{class:"mini-input",placeholder:"Filter by name…",oninput:()=>{T=W.value.trim().toLowerCase(),Z()}}),$=()=>r();function J(ce){const m=new Map;for(const[N,ae]of Object.entries(ce??{}))for(const[B,pe]of Object.entries(ae??{})){const Ce=[N,B].sort().join("|"),Ye=m.get(Ce)??{key:Ce,a:[N,B].sort()[0],b:[N,B].sort()[1],msgs:new Map};for(const[Fe,Ke]of Object.entries(pe??{}))Ye.msgs.set(Fe,{id:Fe,from:Ke.from,text:Ke.text,ts:typeof Ke.ts=="number"?Ke.ts:0});m.set(Ce,Ye)}M=[...m.values()].sort((N,ae)=>ue(ae)-ue(N))}const ue=ce=>Math.max(0,...[...ce.msgs.values()].map(m=>m.ts));function Z(){const ce=$(),m=B=>`${ce.get(B.a)??B.a.slice(0,6)} ↔ ${ce.get(B.b)??B.b.slice(0,6)}`,N=M.filter(B=>!T||m(B).toLowerCase().includes(T));P.replaceChildren(...N.length?N.map(B=>{const pe=[...B.msgs.values()].sort((Ce,Ye)=>Ye.ts-Ce.ts)[0];return l("div",{class:"convo-item"+(B.key===C?" on":""),onclick:()=>{C=B.key,Z()}},l("div",{class:"who"},m(B)),l("div",{class:"hint"},`${B.msgs.size} message${B.msgs.size===1?"":"s"} · last ${pe?Ti(pe.ts):"?"}`))}):[l("div",{class:"hint pad"},"No private messages yet.")]);const ae=M.find(B=>B.key===C);if(!ae){k.replaceChildren(l("div",{class:"hint pad"},"Pick a conversation."));return}k.replaceChildren(...[...ae.msgs.values()].sort((B,pe)=>B.ts-pe.ts).map(B=>l("div",{class:"cw-msg"+(B.from===ae.b?" mine":"")},l("div",{class:"hint"},`${ce.get(B.from)??B.from.slice(0,6)}`),l("div",{class:"cw-bubble"},B.text),l("div",{class:"cw-time"},Ti(B.ts))))),k.style.display="flex",k.style.flexDirection="column",k.style.gap="6px",k.scrollTop=k.scrollHeight}return D.append(l("div",{class:"admin-bar"},W,l("span",{class:"hint"},"Every private conversation between players, live")),l("div",{class:"convo-list"},P,k)),Ot(H(j,"dms"),ce=>{J(ce.val()),Z()},()=>de("Couldn't read private messages","err"))}async function _(D){let M=[],C="",T="";const P=l("div",{class:"scroll-box"}),k=l("select",{onchange:()=>{C=k.value,$()}},l("option",{value:""},"All actions"),...Pb.map(ue=>l("option",{value:ue},ue))),W=l("input",{class:"mini-input",placeholder:"Filter by name or detail…",oninput:()=>{T=W.value.trim().toLowerCase(),$()}});function $(){const ue=M.filter(Z=>(!C||Z.type===C)&&(!T||Z.name.toLowerCase().includes(T)||Z.detail.toLowerCase().includes(T))).reverse();P.replaceChildren(l("table",{class:"atable"},l("thead",{},l("tr",{},...["Time","User","Action","Detail"].map(Z=>l("th",{},Z)))),l("tbody",{},...ue.map(Z=>l("tr",{},l("td",{class:"hint"},Ti(Z.ts)),l("td",{},l("b",{},Z.name)),l("td",{},l("span",{class:"pill "+Z.type},Z.type)),l("td",{},Z.detail))))))}return D.append(l("div",{class:"admin-bar"},k,W,l("span",{class:"hint"},"Last 500 actions, newest first, live")),P),Ot(Qs(H(j,"logs"),Ks("ts"),Ys(500)),ue=>{M=[],ue.forEach(Z=>{const be=Z.val();M.push({ts:be.ts??0,name:be.name??"?",type:be.type??"?",detail:be.detail??""})}),$()},()=>de("Couldn't read the action log","err"))}function p(D){let M="clothing",C=null;const T=l("div",{class:"tabs"}),P=l("div",{});D.append(T,P);const k=W=>{C==null||C(),M=W,T.replaceChildren(...[["clothing","Clothing"],["emotes","Emotes"],["items","Items & music"]].map(([$,J])=>l("button",{class:"tab"+($===M?" on":""),onclick:()=>k($)},J))),P.replaceChildren(),C=(M==="clothing"?q:M==="emotes"?Q:F)(P)};return k("clothing"),()=>C==null?void 0:C()}const I=(D,M,C=!1)=>{const T=l("input",{type:"number",min:0,max:999,value:String(D),disabled:C,onchange:()=>M(Math.max(0,Math.min(999,Number(T.value)||0)))});return T},S=D=>We(e.profile,"admin",D),x=()=>de("Couldn't save (are you still signed in as admin?)","err");function q(D){let M="hr",C="",T="",P="",k=0;const W=24,$=new Set;let J=!1;const ue=(b,le)=>{var ye;return(ye=_b()[b])==null?void 0:ye.find(Ie=>Ie.id===le)},Z=l("select",{onchange:()=>{M=Z.value,k=0,$e()}},...Gt.map(b=>l("option",{value:b.id},`${b.label} (${b.id})`))),be=l("select",{onchange:()=>{C=be.value,k=0,$e()}},l("option",{value:""},"Any gender"),l("option",{value:"M"},"Boys"),l("option",{value:"F"},"Girls"),l("option",{value:"U"},"Unisex")),ce=l("select",{onchange:()=>{T=ce.value,k=0,$e()}},...[["","All items"],["shop","In the shop"],["noshop","Not in the shop"],["free","Free (everyone owns)"],["club","Club only"]].map(([b,le])=>l("option",{value:b},le))),m=l("input",{class:"mini-input",placeholder:"Find by id…",oninput:()=>{P=m.value.trim(),k=0,$e()}}),N=l("div",{class:"admin-bar"}),ae=l("div",{class:"apanel-grid"}),B=l("div",{class:"row center",style:{margin:"10px 0"}}),pe=l("div",{class:"hint"});function Ce(b){if(b.club>0||!b.selectable)return"club";const le=ue(b.type,b.id);return le?le.starter||le.price===0?"free":le.shopOn?"shop":"noshop":"club"}function Ye(){return Rc(M).filter(b=>(!C||b.gender===C)&&(!T||Ce(b)===T)&&(!P||b.id.includes(P)))}async function Fe(){if(!$.size)return de("Tick some items first.","err");if($.size>40)return de("Pick 40 items or fewer per pack.","err");const b=[...$].map(le=>({type:le.split(":")[0],id:le.split(":")[1]}));try{const le=await Rw(b,{frames:J},(ye,Ie,Ze)=>{pe.textContent=`Packing ${ye}/${Ie}: ${Ze}`});Xr(le,"6ixplanet-clothing-templates.zip"),pe.textContent=`Done. ${b.length} item${b.length===1?"":"s"} exported.`,S(`exported ${b.length} clothing templates`)}catch(le){pe.textContent="",de(`Export failed: ${le.message}`,"err")}}async function Ke(b,le){const ye=[...$].map(Ie=>({type:Ie.split(":")[0],id:Ie.split(":")[1]})).filter(Ie=>{const Ze=ue(Ie.type,Ie.id);return Ze&&!Ze.starter});if(!ye.length)return de("None of the ticked items can be sold (club or starter items can't).","err");try{await Promise.all(ye.map(Ie=>{const Ze=`${Ie.type}_${Ie.id}`;return b==="reset"?Jr("clothing",Ze):Tt("clothing",Ze,{on:b==="on",price:le})})),S(`${b==="reset"?"reset":b==="on"?`put in the shop at ${le}`:"removed from the shop"}: ${ye.length} clothing items`),de(`Updated ${ye.length} item${ye.length===1?"":"s"}`),$e()}catch{x()}}const rt=l("input",{type:"number",min:0,max:999,value:"2",style:{width:"56px",padding:"4px",borderRadius:"5px",border:"1px solid #9ea5b0",textAlign:"center"}});function Qe(b){const le=`${b.type}:${b.id}`,ye=ue(b.type,b.id),Ie=Ce(b),Ze=Gt.find(De=>De.id===b.type),Ut=l("div",{class:"thumb"});Ft({figure:_h(b),dir:2,headDir:2,headOnly:Ze.headOnly}).then(De=>{if(!De||!Ut.isConnected)return;const Mn=Ir(De);Mn.className="thumb-canvas",Ut.replaceChildren(Mn)});const Nn=!!ye&&!ye.starter&&Ie!=="club",On=!!pt.clothing[`${b.type}_${b.id}`];return l("div",{class:"acard"+($.has(le)?" sel":"")},l("span",{class:"tag "+(Ie==="free"?"free":Ie==="club"?"club":Ie==="noshop"?"off":"")},Ie==="free"?ye!=null&&ye.starter?"starter":"free":Ie==="club"?"club":Ie==="shop"?"in shop":"not sold"),Ut,l("div",{},l("b",{},`${b.type}-${b.id}`)),l("div",{class:"nm"},`${b.gender==="U"?"unisex":b.gender==="F"?"girls":"boys"}${b.colors?` · ${b.colors} colour${b.colors>1?"s":""}`:""}`),l("label",{},l("input",{type:"checkbox",checked:$.has(le),onchange:De=>{De.target.checked?$.add(le):$.delete(le),$e()}}),"select"),Nn?l("div",{class:"row center",style:{gap:"4px"}},l("label",{},l("input",{type:"checkbox",checked:ye.shopOn,onchange:async De=>{try{await Tt("clothing",`${b.type}_${b.id}`,{on:De.target.checked,price:ye.price}),S(`${De.target.checked?"put":"removed"} ${b.type}-${b.id} ${De.target.checked?"in":"from"} the shop`),$e()}catch{x()}}}),"shop"),I(ye.price,async De=>{try{await Tt("clothing",`${b.type}_${b.id}`,{on:ye.shopOn,price:De}),S(`set ${b.type}-${b.id} to ${De} drops`),$e()}catch{x()}}),l("img",{src:kn,class:"blood-ico",alt:"drops"})):l("div",{class:"hint"},Ie==="club"?"club item: can't be sold":"starter: free for all"),Nn&&On?l("button",{class:"btn small",onclick:async()=>{try{await Jr("clothing",`${b.type}_${b.id}`),$e()}catch{x()}}},"Reset"):null)}function $e(){const b=Ye(),le=Math.max(1,Math.ceil(b.length/W));k>=le&&(k=le-1);const ye=b.slice(k*W,(k+1)*W);N.replaceChildren(Z,be,ce,m,l("span",{class:"hint"},`${b.length} items · ${$.size} selected`)),ae.replaceChildren(...ye.map(Qe)),B.replaceChildren(l("button",{class:"btn small",disabled:k===0,onclick:()=>{k--,$e()}},"‹"),l("span",{class:"hint"},`${k+1} / ${le}`),l("button",{class:"btn small",disabled:k>=le-1,onclick:()=>{k++,$e()}},"›"))}const fi=l("div",{class:"panel",style:{marginBottom:"10px",display:"grid",gap:"8px"}},l("div",{class:"row"},l("b",{},"Selected items:"),l("button",{class:"btn small",onclick:()=>{Ye().slice(k*W,(k+1)*W).forEach(b=>$.add(`${b.type}:${b.id}`)),$e()}},"Select this page"),l("button",{class:"btn small",onclick:()=>{$.clear(),$e()}},"Clear"),l("span",{class:"hint"},"Shop:"),l("button",{class:"btn small primary",onclick:()=>void Ke("on",Math.max(0,Math.min(999,Number(rt.value)||0)))},"Put in shop at"),rt,l("button",{class:"btn small",onclick:()=>void Ke("off",0)},"Remove from shop"),l("button",{class:"btn small",onclick:()=>void Ke("reset",0)},"Reset to default")),l("div",{class:"row"},l("b",{},"Templates:"),l("label",{class:"hint"},l("input",{type:"checkbox",onchange:b=>{J=b.target.checked}})," include every frame as its own PNG (much bigger)"),l("button",{class:"btn small primary",onclick:()=>void Fe()},"Export selected as template pack (.zip)"),l("button",{class:"btn small",onclick:()=>{const b=JSON.stringify(Rc(M).map(({parts:le,...ye})=>({...ye,parts:le})),null,2);Xr(new Blob([b],{type:"application/json"}),`clothing-${M}.json`)}},"Download this slot's data (.json)")),pe);return D.append(fi,N,ae,B),$e(),re.subscribe(()=>{})}function Q(D){const M=is.map(T=>{const P=T.price===0,k=pt.emotes[T.id],W=k?k.on:!0,$=Gn(T);return l("tr",{},l("td",{style:{fontSize:"22px"}},T.icon),l("td",{},l("b",{},T.name)),l("td",{class:"hint"},T.desc),...P?[l("td",{colspan:"3",class:"hint"},"Always free for everyone")]:[l("td",{class:"num"},String(T.price)),l("td",{},l("label",{},l("input",{type:"checkbox",checked:W,onchange:async J=>{try{await Tt("emotes",T.id,{on:J.target.checked,price:$}),S(`${J.target.checked?"put":"removed"} the ${T.name} emote ${J.target.checked?"in":"from"} the shop`)}catch{x()}}})," on sale")),l("td",{},I($,async J=>{try{await Tt("emotes",T.id,{on:W,price:J}),S(`set the ${T.name} emote to ${J} drops${J===0?" (free for everyone)":""}`)}catch{x()}}),k?l("button",{class:"btn small",style:{marginLeft:"6px"},onclick:async()=>{try{await Jr("emotes",T.id),C()}catch{x()}}},"Reset"):null)])}),C=()=>{D.replaceChildren(),Q(D)};return D.append(l("p",{class:"hint"},"A price of 0 makes an emote free for everyone. Changes apply to players straight away."),l("div",{class:"scroll-box"},l("table",{class:"atable"},l("thead",{},l("tr",{},...["","Emote","What it does","Default","Shop","Price (drops)"].map(T=>l("th",{},T)))),l("tbody",{},...M)))),()=>{}}function F(D){const M=Object.values(vt).map(P=>{const k=Lo(P.id);return l("tr",{},l("td",{},l("img",{src:P.icon,alt:"",style:{width:"32px",height:"32px",imageRendering:"pixelated"}})),l("td",{},l("b",{},P.name)),l("td",{class:"hint"},P.examine),l("td",{},l("label",{},l("input",{type:"checkbox",checked:k.on,onchange:async W=>{try{await Tt("items",P.id,{on:W.target.checked,price:k.price}),S(`${W.target.checked?"put":"removed"} the ${P.name} ${W.target.checked?"in":"from"} the shop`)}catch{x()}}})," sold in shop")),l("td",{},I(k.price,async W=>{try{await Tt("items",P.id,{on:k.on,price:W}),S(`set the ${P.name} to ${W} drops`)}catch{x()}})))}),C=fh(),T=l("tr",{},l("td",{style:{fontSize:"22px"}},"♪"),l("td",{},l("b",{},"Jukebox pass")),l("td",{class:"hint"},"Unlocks the Music tab in the lobby"),l("td",{},l("label",{},l("input",{type:"checkbox",checked:C.on,onchange:async P=>{try{await Tt("music","pass",{on:P.target.checked,price:C.price}),S(`${P.target.checked?"put":"removed"} the jukebox pass ${P.target.checked?"in":"from"} the shop`)}catch{x()}}})," sold in shop")),l("td",{},I(C.price,async P=>{try{await Tt("music","pass",{on:C.on,price:P}),S(`set the jukebox pass to ${P} drops`)}catch{x()}})));return D.append(l("p",{class:"hint"},"Everyone starts with a knife, a CD and a syringe. Turn an item on to sell extra copies; it goes into the buyer's inventory."),l("div",{class:"scroll-box"},l("table",{class:"atable"},l("thead",{},l("tr",{},...["","Item","What it does","Shop","Price (drops)"].map(P=>l("th",{},P)))),l("tbody",{},...M,T))),l("div",{class:"row",style:{marginTop:"10px"}},l("button",{class:"btn small primary",onclick:async()=>{try{const P=await Pw([...Object.values(vt).map(k=>({name:k.id,url:k.icon})),{name:"blood",url:kn}]);Xr(P,"6ixplanet-item-icons.zip"),S("exported the item icons")}catch(P){de(`Export failed: ${P.message}`,"err")}}},"Export item icons as templates (.zip)"))),()=>{}}function U(D){const M=l("input",{type:"password",placeholder:"current password",autocomplete:"current-password"}),C=l("input",{type:"password",placeholder:"new password (6+ characters)",autocomplete:"new-password"}),T=l("input",{type:"password",placeholder:"new password again",autocomplete:"new-password"}),P=l("div",{class:"form-error"});return D.append(l("div",{class:"panel",style:{maxWidth:"480px"}},l("h2",{},"Admin password"),l("p",{class:"muted"},"Anyone who knows this password can read every private message. If it's still the one you started with, change it before inviting people."),l("div",{class:"group"},l("label",{class:"cellrow"},M),l("label",{class:"cellrow"},C),l("label",{class:"cellrow"},T)),P,l("button",{class:"btn primary",onclick:async()=>{if(P.textContent="",C.value!==T.value){P.textContent="The new passwords don't match.";return}try{await $b(M.value,C.value),M.value=C.value=T.value="",S("changed the admin password"),de("Password changed.")}catch(k){P.textContent=k.code==="auth/invalid-credential"?"Current password is wrong.":k.message}}},"Change password"))),()=>{}}return c("accounts"),()=>s==null?void 0:s()}const Sr="6ixPlanet",Mw="Staff can see chat, private messages and activity on 6ixPlanet.",Dw={home:Sr,room:"Lobby",rooms:"Rooms",customize:"Character",wardrobe:"Wardrobe",shop:"Shop",admin:"Admin"},rs=document.getElementById("app");let Le=null,ks=null;function Zs(){Le==null||Le(),Le=null,ks==null||ks(),ks=null,rs.replaceChildren()}function Lw(){Zs(),rs.append(l("div",{class:"center-screen"},l("div",{class:"panel auth"},l("h1",{},"Almost there"),l("p",{},"6ixPlanet needs a Firebase project. Add your config to ",l("code",{},"src/firebaseConfig.ts"),":"),l("ol",{},l("li",{},"Firebase console → create a project → add a Web app, copy its config"),l("li",{},"Build → Authentication → enable the Email/Password provider (usernames are mapped onto it; no real emails are used)"),l("li",{},"Build → Realtime Database → create a database"),l("li",{},"Publish database.rules.json as its rules")),l("p",{class:"muted"},"Or run the local emulators: ",l("code",{},"npm run emulators")," + ",l("code",{},"npm run dev:emu")))))}function vh(n){Zs(),rs.append(l("div",{class:"center-screen"},l("div",{class:"loading"},n)))}function Nc(){Zs(),Ue.stop();let n=!1;const e=l("div",{class:"form-error"}),t=l("input",{type:"text",placeholder:"required",autocomplete:"username",maxLength:16,required:!0,autocapitalize:"none",spellcheck:!1}),s=l("input",{type:"password",placeholder:"required",autocomplete:"current-password",required:!0}),i=l("button",{class:"btn primary",type:"submit"},"Log in"),r=l("button",{class:"link",type:"button"},"No account? Register");function o(){i.textContent=n?"Create account":"Log in",r.textContent=n?"Have an account? Log in":"No account? Register",s.placeholder=n?"6+ characters":"required",s.autocomplete=n?"new-password":"current-password",e.textContent=""}r.addEventListener("click",()=>{n=!n,o()});const a=l("form",{class:"auth-form",onsubmit:async d=>{d.preventDefault(),e.textContent="",i.disabled=!0;try{n?(await Lb(t.value.trim(),s.value),bh(fs.currentUser)):await Fb(t.value,s.value)}catch(h){e.textContent=$a(h),i.disabled=!1}}},l("div",{class:"group"},l("label",{class:"cellrow"},l("span",{class:"lbl"},"Username"),t),l("label",{class:"cellrow"},l("span",{class:"lbl"},"Password"),s)),e,i,r),c=new Date;rs.append(l("div",{class:"shell"},lh(),l("div",{class:"lock"},l("div",{class:"lock-clock"},l("div",{class:"t"},ah(c)),l("div",{class:"d"},c.toLocaleDateString([],{weekday:"long",month:"long",day:"numeric"}))),l("div",{class:"auth"},l("div",{class:"logo"},Sr),l("p",{class:"tagline"},"Sign in to hang out in the lobby."),a,l("p",{class:"notice"},Mw),null))))}async function Fw(n){vh("Loading your character…");const e=Mb(n);let t,s=()=>{};try{const p=yw();s=p.stop,await Promise.all([Oa,mb()]),await p.ready,t=await Sb(n.uid,e),t||(t=await ih(n.uid,(n.email??"").split("@")[0].slice(0,16).padEnd(3,"_")),t.isAdmin=e)}catch(p){s(),Zs(),rs.append(l("div",{class:"center-screen"},l("div",{class:"panel auth"},l("h1",{},"Couldn't load"),l("p",{},$a(p)),l("div",{class:"row"},l("button",{class:"btn",onclick:()=>location.reload()},"Retry"),l("button",{class:"btn",onclick:()=>Po()},"Log out")))));return}const i=t;Zs();const r=l("div",{style:{flex:"1",minHeight:"0",display:"flex",flexDirection:"column"}}),o=l("div",{class:"shell","data-view":"home"},lh(),r);rs.append(o);const a=async()=>{We(i,"logout","logged out"),Le==null||Le(),Le=null,await new Promise(p=>setTimeout(p,300)),iw(i),await new Promise(p=>setTimeout(p,150)),await Po()},c={profile:i,navigate:(p,I)=>_(p,I),refreshHeader(){document.querySelectorAll(".coins").forEach(p=>{p.replaceChildren(l("img",{src:kn,class:"blood-ico",alt:"drops of blood"}),` ${i.blood}`),p.title="Drops of blood"})}};nw(i).catch(p=>console.warn("couldn't publish profile",p)),re.start(i),sw(i),We(i,"login","opened 6ixPlanet");const d=Tw(o,c);let h=null;ks=()=>{d(),s(),h==null||h(),re.stop()};function f(){const p=[{id:"room",label:"Lobby",icon:Je("ios6/icon-door.png"),view:"room"},{id:"customize",label:"Character",icon:Je("ios6/character.svg"),view:"customize"},{id:"wardrobe",label:"Wardrobe",icon:Je("ios6/wardrobe.svg"),view:"wardrobe"},{id:"shop",label:"Shop",icon:Je("ios6/icon-store.png"),view:"shop"},{id:"friends",label:"Friends",icon:Je("ios6/icon-chat.png"),run:()=>window.dispatchEvent(new CustomEvent("toggle-friends")),badge:!0},...i.isAdmin?[{id:"admin",label:"Admin",icon:Je("ios6/icon-admin.png"),view:"admin"}]:[],{id:"logout",label:"Log out",icon:Je("ios6/icon-logout.svg"),run:()=>void a()}],I=l("div",{class:"springboard app-open"}),S=l("div",{class:"sb-grid",role:"list"});for(const q of p){const Q=l("span",{class:"sb-icon",style:{backgroundImage:`url("${q.icon}")`}}),F=q.badge?l("span",{class:"sb-badge hidden","data-friends-badge":"1"}):null;F&&Q.append(F);const U=l("button",{class:"sb-app",role:"listitem",onclick:()=>{if(q.run)return q.run();const D=Q.getBoundingClientRect();I.style.setProperty("--ox",D.left+D.width/2+"px"),I.style.setProperty("--oy",D.top+D.height/2-64+"px"),I.classList.add("out"),setTimeout(()=>_(q.view),280)}},Q,l("span",{class:"sb-label"},q.label));S.append(U)}const x=()=>{const q=re.totalUnread;document.querySelectorAll("[data-friends-badge]").forEach(Q=>{Q.textContent=String(q),Q.classList.toggle("hidden",q===0)})};return h==null||h(),h=re.subscribe(x),x(),I.append(S,l("div",{class:"sb-footer"},`${Sr} is open source (GPL-3.0): `,l("a",{href:"https://github.com/playlistlobby/playlistlobby.github.io/tree/main/hotel-src",target:"_blank",rel:"noopener"},"source")),l("div",{class:"sb-dock","aria-hidden":"true"},l("div",{class:"sb-shelf"}))),I}function _(p,I={}){if(Le==null||Le(),Le=null,r.replaceChildren(),o.dataset.view=p,p==="home"){r.append(f());return}const S=!!I.onboarding,x=Wb({title:Dw[p],back:S?void 0:{label:"Home",onBack:()=>_("home")},right:[l("span",{class:"barbtn blood-pill"},l("span",{class:"coins"}))]}),q=l("main",{class:"app-open"});r.append(x,q),c.refreshHeader(),p==="room"?Le=mw(q,c,Xs):p==="customize"?Le=ch(q,c,"customize",S):p==="shop"?Le=bw(q,c):p==="admin"&&i.isAdmin?Le=Ow(q,c):p==="wardrobe"?Le=Iw(q,c):_("home")}i.figure?_("home"):_("customize",{onboarding:!0})}document.title=Sr;zu?(vh("Connecting…"),Tm(fs,n=>{Ro.registering||bh(n)})):Lw();let Oc;function bh(n){if(((n==null?void 0:n.uid)??null)!==Oc){if(Oc=(n==null?void 0:n.uid)??null,n&&(n.isAnonymous||!n.email))return Po(),Nc();n?Fw(n).catch(e=>de($a(e),"err")):Nc()}}
