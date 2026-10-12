(function(){const e=document.createElement("link").relList;if(e&&e.supports&&e.supports("modulepreload"))return;for(const i of document.querySelectorAll('link[rel="modulepreload"]'))s(i);new MutationObserver(i=>{for(const r of i)if(r.type==="childList")for(const o of r.addedNodes)o.tagName==="LINK"&&o.rel==="modulepreload"&&s(o)}).observe(document,{childList:!0,subtree:!0});function t(i){const r={};return i.integrity&&(r.integrity=i.integrity),i.referrerPolicy&&(r.referrerPolicy=i.referrerPolicy),i.crossOrigin==="use-credentials"?r.credentials="include":i.crossOrigin==="anonymous"?r.credentials="omit":r.credentials="same-origin",r}function s(i){if(i.ep)return;i.ep=!0;const r=t(i);fetch(i.href,r)}})();var zl={};/**
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
 */const Ad={NODE_ADMIN:!1,SDK_VERSION:"${JSCORE_VERSION}"};/**
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
 */const H=function(n,e){if(!n)throw Ss(e)},Ss=function(n){return new Error("Firebase Database ("+Ad.SDK_VERSION+") INTERNAL ASSERT FAILED: "+n)};/**
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
 */const Rd=function(n){const e=[];let t=0;for(let s=0;s<n.length;s++){let i=n.charCodeAt(s);i<128?e[t++]=i:i<2048?(e[t++]=i>>6|192,e[t++]=i&63|128):(i&64512)===55296&&s+1<n.length&&(n.charCodeAt(s+1)&64512)===56320?(i=65536+((i&1023)<<10)+(n.charCodeAt(++s)&1023),e[t++]=i>>18|240,e[t++]=i>>12&63|128,e[t++]=i>>6&63|128,e[t++]=i&63|128):(e[t++]=i>>12|224,e[t++]=i>>6&63|128,e[t++]=i&63|128)}return e},op=function(n){const e=[];let t=0,s=0;for(;t<n.length;){const i=n[t++];if(i<128)e[s++]=String.fromCharCode(i);else if(i>191&&i<224){const r=n[t++];e[s++]=String.fromCharCode((i&31)<<6|r&63)}else if(i>239&&i<365){const r=n[t++],o=n[t++],l=n[t++],c=((i&7)<<18|(r&63)<<12|(o&63)<<6|l&63)-65536;e[s++]=String.fromCharCode(55296+(c>>10)),e[s++]=String.fromCharCode(56320+(c&1023))}else{const r=n[t++],o=n[t++];e[s++]=String.fromCharCode((i&15)<<12|(r&63)<<6|o&63)}}return e.join("")},va={byteToCharMap_:null,charToByteMap_:null,byteToCharMapWebSafe_:null,charToByteMapWebSafe_:null,ENCODED_VALS_BASE:"ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789",get ENCODED_VALS(){return this.ENCODED_VALS_BASE+"+/="},get ENCODED_VALS_WEBSAFE(){return this.ENCODED_VALS_BASE+"-_."},HAS_NATIVE_SUPPORT:typeof atob=="function",encodeByteArray(n,e){if(!Array.isArray(n))throw Error("encodeByteArray takes an array as a parameter");this.init_();const t=e?this.byteToCharMapWebSafe_:this.byteToCharMap_,s=[];for(let i=0;i<n.length;i+=3){const r=n[i],o=i+1<n.length,l=o?n[i+1]:0,c=i+2<n.length,d=c?n[i+2]:0,h=r>>2,u=(r&3)<<4|l>>4;let m=(l&15)<<2|d>>6,f=d&63;c||(f=64,o||(m=64)),s.push(t[h],t[u],t[m],t[f])}return s.join("")},encodeString(n,e){return this.HAS_NATIVE_SUPPORT&&!e?btoa(n):this.encodeByteArray(Rd(n),e)},decodeString(n,e){return this.HAS_NATIVE_SUPPORT&&!e?atob(n):op(this.decodeStringToByteArray(n,e))},decodeStringToByteArray(n,e){this.init_();const t=e?this.charToByteMapWebSafe_:this.charToByteMap_,s=[];for(let i=0;i<n.length;){const r=t[n.charAt(i++)],l=i<n.length?t[n.charAt(i)]:0;++i;const d=i<n.length?t[n.charAt(i)]:64;++i;const u=i<n.length?t[n.charAt(i)]:64;if(++i,r==null||l==null||d==null||u==null)throw new ap;const m=r<<2|l>>4;if(s.push(m),d!==64){const f=l<<4&240|d>>2;if(s.push(f),u!==64){const y=d<<6&192|u;s.push(y)}}}return s},init_(){if(!this.byteToCharMap_){this.byteToCharMap_={},this.charToByteMap_={},this.byteToCharMapWebSafe_={},this.charToByteMapWebSafe_={};for(let n=0;n<this.ENCODED_VALS.length;n++)this.byteToCharMap_[n]=this.ENCODED_VALS.charAt(n),this.charToByteMap_[this.byteToCharMap_[n]]=n,this.byteToCharMapWebSafe_[n]=this.ENCODED_VALS_WEBSAFE.charAt(n),this.charToByteMapWebSafe_[this.byteToCharMapWebSafe_[n]]=n,n>=this.ENCODED_VALS_BASE.length&&(this.charToByteMap_[this.ENCODED_VALS_WEBSAFE.charAt(n)]=n,this.charToByteMapWebSafe_[this.ENCODED_VALS.charAt(n)]=n)}}};class ap extends Error{constructor(){super(...arguments),this.name="DecodeBase64StringError"}}const Pd=function(n){const e=Rd(n);return va.encodeByteArray(e,!0)},nr=function(n){return Pd(n).replace(/\./g,"")},sr=function(n){try{return va.decodeString(n,!0)}catch(e){console.error("base64Decode failed: ",e)}return null};/**
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
 */function lp(n){return Nd(void 0,n)}function Nd(n,e){if(!(e instanceof Object))return e;switch(e.constructor){case Date:const t=e;return new Date(t.getTime());case Object:n===void 0&&(n={});break;case Array:n=[];break;default:return e}for(const t in e)!e.hasOwnProperty(t)||!cp(t)||(n[t]=Nd(n[t],e[t]));return n}function cp(n){return n!=="__proto__"}/**
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
 */function dp(){if(typeof self<"u")return self;if(typeof window<"u")return window;if(typeof global<"u")return global;throw new Error("Unable to locate global object.")}/**
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
 */const up=()=>dp().__FIREBASE_DEFAULTS__,hp=()=>{if(typeof process>"u"||typeof zl>"u")return;const n=zl.__FIREBASE_DEFAULTS__;if(n)return JSON.parse(n)},fp=()=>{if(typeof document>"u")return;let n;try{n=document.cookie.match(/__FIREBASE_DEFAULTS__=([^;]+)/)}catch{return}const e=n&&sr(n[1]);return e&&JSON.parse(e)},ba=()=>{try{return up()||hp()||fp()}catch(n){console.info(`Unable to get __FIREBASE_DEFAULTS__ due to: ${n}`);return}},Od=n=>{var e,t;return(t=(e=ba())===null||e===void 0?void 0:e.emulatorHosts)===null||t===void 0?void 0:t[n]},pp=n=>{const e=Od(n);if(!e)return;const t=e.lastIndexOf(":");if(t<=0||t+1===e.length)throw new Error(`Invalid host ${e} with no separate hostname and port!`);const s=parseInt(e.substring(t+1),10);return e[0]==="["?[e.substring(1,t-1),s]:[e.substring(0,t),s]},Md=()=>{var n;return(n=ba())===null||n===void 0?void 0:n.config},Dd=n=>{var e;return(e=ba())===null||e===void 0?void 0:e[`_${n}`]};/**
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
 */class Dt{constructor(){this.reject=()=>{},this.resolve=()=>{},this.promise=new Promise((e,t)=>{this.resolve=e,this.reject=t})}wrapCallback(e){return(t,s)=>{t?this.reject(t):this.resolve(s),typeof e=="function"&&(this.promise.catch(()=>{}),e.length===1?e(t):e(t,s))}}}/**
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
 */function mp(n,e){if(n.uid)throw new Error('The "uid" field is no longer supported by mockUserToken. Please use "sub" instead for Firebase Auth User ID.');const t={alg:"none",type:"JWT"},s=e||"demo-project",i=n.iat||0,r=n.sub||n.user_id;if(!r)throw new Error("mockUserToken must contain 'sub' or 'user_id' field!");const o=Object.assign({iss:`https://securetoken.google.com/${s}`,aud:s,iat:i,exp:i+3600,auth_time:i,sub:r,user_id:r,firebase:{sign_in_provider:"custom",identities:{}}},n);return[nr(JSON.stringify(t)),nr(JSON.stringify(o)),""].join(".")}/**
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
 */function it(){return typeof navigator<"u"&&typeof navigator.userAgent=="string"?navigator.userAgent:""}function wa(){return typeof window<"u"&&!!(window.cordova||window.phonegap||window.PhoneGap)&&/ios|iphone|ipod|ipad|android|blackberry|iemobile/i.test(it())}function gp(){return typeof navigator<"u"&&navigator.userAgent==="Cloudflare-Workers"}function yp(){const n=typeof chrome=="object"?chrome.runtime:typeof browser=="object"?browser.runtime:void 0;return typeof n=="object"&&n.id!==void 0}function Ld(){return typeof navigator=="object"&&navigator.product==="ReactNative"}function _p(){const n=it();return n.indexOf("MSIE ")>=0||n.indexOf("Trident/")>=0}function vp(){return Ad.NODE_ADMIN===!0}function bp(){try{return typeof indexedDB=="object"}catch{return!1}}function wp(){return new Promise((n,e)=>{try{let t=!0;const s="validate-browser-context-for-indexeddb-analytics-module",i=self.indexedDB.open(s);i.onsuccess=()=>{i.result.close(),t||self.indexedDB.deleteDatabase(s),n(!0)},i.onupgradeneeded=()=>{t=!1},i.onerror=()=>{var r;e(((r=i.error)===null||r===void 0?void 0:r.message)||"")}}catch(t){e(t)}})}/**
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
 */const Cp="FirebaseError";class An extends Error{constructor(e,t,s){super(t),this.code=e,this.customData=s,this.name=Cp,Object.setPrototypeOf(this,An.prototype),Error.captureStackTrace&&Error.captureStackTrace(this,Ci.prototype.create)}}class Ci{constructor(e,t,s){this.service=e,this.serviceName=t,this.errors=s}create(e,...t){const s=t[0]||{},i=`${this.service}/${e}`,r=this.errors[e],o=r?Ep(r,s):"Error",l=`${this.serviceName}: ${o} (${i}).`;return new An(i,l,s)}}function Ep(n,e){return n.replace(kp,(t,s)=>{const i=e[s];return i!=null?String(i):`<${s}?>`})}const kp=/\{\$([^}]+)}/g;/**
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
 */function ri(n){return JSON.parse(n)}function je(n){return JSON.stringify(n)}/**
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
 */const $d=function(n){let e={},t={},s={},i="";try{const r=n.split(".");e=ri(sr(r[0])||""),t=ri(sr(r[1])||""),i=r[2],s=t.d||{},delete t.d}catch{}return{header:e,claims:t,data:s,signature:i}},Ip=function(n){const e=$d(n),t=e.claims;return!!t&&typeof t=="object"&&t.hasOwnProperty("iat")},Sp=function(n){const e=$d(n).claims;return typeof e=="object"&&e.admin===!0};/**
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
 */function Wt(n,e){return Object.prototype.hasOwnProperty.call(n,e)}function ps(n,e){if(Object.prototype.hasOwnProperty.call(n,e))return n[e]}function ir(n){for(const e in n)if(Object.prototype.hasOwnProperty.call(n,e))return!1;return!0}function rr(n,e,t){const s={};for(const i in n)Object.prototype.hasOwnProperty.call(n,i)&&(s[i]=e.call(t,n[i],i,n));return s}function or(n,e){if(n===e)return!0;const t=Object.keys(n),s=Object.keys(e);for(const i of t){if(!s.includes(i))return!1;const r=n[i],o=e[i];if(Gl(r)&&Gl(o)){if(!or(r,o))return!1}else if(r!==o)return!1}for(const i of s)if(!t.includes(i))return!1;return!0}function Gl(n){return n!==null&&typeof n=="object"}/**
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
 */function Ts(n){const e=[];for(const[t,s]of Object.entries(n))Array.isArray(s)?s.forEach(i=>{e.push(encodeURIComponent(t)+"="+encodeURIComponent(i))}):e.push(encodeURIComponent(t)+"="+encodeURIComponent(s));return e.length?"&"+e.join("&"):""}function js(n){const e={};return n.replace(/^\?/,"").split("&").forEach(s=>{if(s){const[i,r]=s.split("=");e[decodeURIComponent(i)]=decodeURIComponent(r)}}),e}function Vs(n){const e=n.indexOf("?");if(!e)return"";const t=n.indexOf("#",e);return n.substring(e,t>0?t:void 0)}/**
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
 */class Tp{constructor(){this.chain_=[],this.buf_=[],this.W_=[],this.pad_=[],this.inbuf_=0,this.total_=0,this.blockSize=512/8,this.pad_[0]=128;for(let e=1;e<this.blockSize;++e)this.pad_[e]=0;this.reset()}reset(){this.chain_[0]=1732584193,this.chain_[1]=4023233417,this.chain_[2]=2562383102,this.chain_[3]=271733878,this.chain_[4]=3285377520,this.inbuf_=0,this.total_=0}compress_(e,t){t||(t=0);const s=this.W_;if(typeof e=="string")for(let u=0;u<16;u++)s[u]=e.charCodeAt(t)<<24|e.charCodeAt(t+1)<<16|e.charCodeAt(t+2)<<8|e.charCodeAt(t+3),t+=4;else for(let u=0;u<16;u++)s[u]=e[t]<<24|e[t+1]<<16|e[t+2]<<8|e[t+3],t+=4;for(let u=16;u<80;u++){const m=s[u-3]^s[u-8]^s[u-14]^s[u-16];s[u]=(m<<1|m>>>31)&4294967295}let i=this.chain_[0],r=this.chain_[1],o=this.chain_[2],l=this.chain_[3],c=this.chain_[4],d,h;for(let u=0;u<80;u++){u<40?u<20?(d=l^r&(o^l),h=1518500249):(d=r^o^l,h=1859775393):u<60?(d=r&o|l&(r|o),h=2400959708):(d=r^o^l,h=3395469782);const m=(i<<5|i>>>27)+d+c+h+s[u]&4294967295;c=l,l=o,o=(r<<30|r>>>2)&4294967295,r=i,i=m}this.chain_[0]=this.chain_[0]+i&4294967295,this.chain_[1]=this.chain_[1]+r&4294967295,this.chain_[2]=this.chain_[2]+o&4294967295,this.chain_[3]=this.chain_[3]+l&4294967295,this.chain_[4]=this.chain_[4]+c&4294967295}update(e,t){if(e==null)return;t===void 0&&(t=e.length);const s=t-this.blockSize;let i=0;const r=this.buf_;let o=this.inbuf_;for(;i<t;){if(o===0)for(;i<=s;)this.compress_(e,i),i+=this.blockSize;if(typeof e=="string"){for(;i<t;)if(r[o]=e.charCodeAt(i),++o,++i,o===this.blockSize){this.compress_(r),o=0;break}}else for(;i<t;)if(r[o]=e[i],++o,++i,o===this.blockSize){this.compress_(r),o=0;break}}this.inbuf_=o,this.total_+=t}digest(){const e=[];let t=this.total_*8;this.inbuf_<56?this.update(this.pad_,56-this.inbuf_):this.update(this.pad_,this.blockSize-(this.inbuf_-56));for(let i=this.blockSize-1;i>=56;i--)this.buf_[i]=t&255,t/=256;this.compress_(this.buf_);let s=0;for(let i=0;i<5;i++)for(let r=24;r>=0;r-=8)e[s]=this.chain_[i]>>r&255,++s;return e}}function xp(n,e){const t=new Ap(n,e);return t.subscribe.bind(t)}class Ap{constructor(e,t){this.observers=[],this.unsubscribes=[],this.observerCount=0,this.task=Promise.resolve(),this.finalized=!1,this.onNoObservers=t,this.task.then(()=>{e(this)}).catch(s=>{this.error(s)})}next(e){this.forEachObserver(t=>{t.next(e)})}error(e){this.forEachObserver(t=>{t.error(e)}),this.close(e)}complete(){this.forEachObserver(e=>{e.complete()}),this.close()}subscribe(e,t,s){let i;if(e===void 0&&t===void 0&&s===void 0)throw new Error("Missing Observer.");Rp(e,["next","error","complete"])?i=e:i={next:e,error:t,complete:s},i.next===void 0&&(i.next=co),i.error===void 0&&(i.error=co),i.complete===void 0&&(i.complete=co);const r=this.unsubscribeOne.bind(this,this.observers.length);return this.finalized&&this.task.then(()=>{try{this.finalError?i.error(this.finalError):i.complete()}catch{}}),this.observers.push(i),r}unsubscribeOne(e){this.observers===void 0||this.observers[e]===void 0||(delete this.observers[e],this.observerCount-=1,this.observerCount===0&&this.onNoObservers!==void 0&&this.onNoObservers(this))}forEachObserver(e){if(!this.finalized)for(let t=0;t<this.observers.length;t++)this.sendOne(t,e)}sendOne(e,t){this.task.then(()=>{if(this.observers!==void 0&&this.observers[e]!==void 0)try{t(this.observers[e])}catch(s){typeof console<"u"&&console.error&&console.error(s)}})}close(e){this.finalized||(this.finalized=!0,e!==void 0&&(this.finalError=e),this.task.then(()=>{this.observers=void 0,this.onNoObservers=void 0}))}}function Rp(n,e){if(typeof n!="object"||n===null)return!1;for(const t of e)if(t in n&&typeof n[t]=="function")return!0;return!1}function co(){}function ms(n,e){return`${n} failed: ${e} argument `}/**
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
 */const Pp=function(n){const e=[];let t=0;for(let s=0;s<n.length;s++){let i=n.charCodeAt(s);if(i>=55296&&i<=56319){const r=i-55296;s++,H(s<n.length,"Surrogate pair missing trail surrogate.");const o=n.charCodeAt(s)-56320;i=65536+(r<<10)+o}i<128?e[t++]=i:i<2048?(e[t++]=i>>6|192,e[t++]=i&63|128):i<65536?(e[t++]=i>>12|224,e[t++]=i>>6&63|128,e[t++]=i&63|128):(e[t++]=i>>18|240,e[t++]=i>>12&63|128,e[t++]=i>>6&63|128,e[t++]=i&63|128)}return e},Or=function(n){let e=0;for(let t=0;t<n.length;t++){const s=n.charCodeAt(t);s<128?e++:s<2048?e+=2:s>=55296&&s<=56319?(e+=4,t++):e+=3}return e};/**
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
 */function $e(n){return n&&n._delegate?n._delegate:n}class Gn{constructor(e,t,s){this.name=e,this.instanceFactory=t,this.type=s,this.multipleInstances=!1,this.serviceProps={},this.instantiationMode="LAZY",this.onInstanceCreated=null}setInstantiationMode(e){return this.instantiationMode=e,this}setMultipleInstances(e){return this.multipleInstances=e,this}setServiceProps(e){return this.serviceProps=e,this}setInstanceCreatedCallback(e){return this.onInstanceCreated=e,this}}/**
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
 */const Ln="[DEFAULT]";/**
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
 */class Np{constructor(e,t){this.name=e,this.container=t,this.component=null,this.instances=new Map,this.instancesDeferred=new Map,this.instancesOptions=new Map,this.onInitCallbacks=new Map}get(e){const t=this.normalizeInstanceIdentifier(e);if(!this.instancesDeferred.has(t)){const s=new Dt;if(this.instancesDeferred.set(t,s),this.isInitialized(t)||this.shouldAutoInitialize())try{const i=this.getOrInitializeService({instanceIdentifier:t});i&&s.resolve(i)}catch{}}return this.instancesDeferred.get(t).promise}getImmediate(e){var t;const s=this.normalizeInstanceIdentifier(e==null?void 0:e.identifier),i=(t=e==null?void 0:e.optional)!==null&&t!==void 0?t:!1;if(this.isInitialized(s)||this.shouldAutoInitialize())try{return this.getOrInitializeService({instanceIdentifier:s})}catch(r){if(i)return null;throw r}else{if(i)return null;throw Error(`Service ${this.name} is not available`)}}getComponent(){return this.component}setComponent(e){if(e.name!==this.name)throw Error(`Mismatching Component ${e.name} for Provider ${this.name}.`);if(this.component)throw Error(`Component for ${this.name} has already been provided`);if(this.component=e,!!this.shouldAutoInitialize()){if(Mp(e))try{this.getOrInitializeService({instanceIdentifier:Ln})}catch{}for(const[t,s]of this.instancesDeferred.entries()){const i=this.normalizeInstanceIdentifier(t);try{const r=this.getOrInitializeService({instanceIdentifier:i});s.resolve(r)}catch{}}}}clearInstance(e=Ln){this.instancesDeferred.delete(e),this.instancesOptions.delete(e),this.instances.delete(e)}async delete(){const e=Array.from(this.instances.values());await Promise.all([...e.filter(t=>"INTERNAL"in t).map(t=>t.INTERNAL.delete()),...e.filter(t=>"_delete"in t).map(t=>t._delete())])}isComponentSet(){return this.component!=null}isInitialized(e=Ln){return this.instances.has(e)}getOptions(e=Ln){return this.instancesOptions.get(e)||{}}initialize(e={}){const{options:t={}}=e,s=this.normalizeInstanceIdentifier(e.instanceIdentifier);if(this.isInitialized(s))throw Error(`${this.name}(${s}) has already been initialized`);if(!this.isComponentSet())throw Error(`Component ${this.name} has not been registered yet`);const i=this.getOrInitializeService({instanceIdentifier:s,options:t});for(const[r,o]of this.instancesDeferred.entries()){const l=this.normalizeInstanceIdentifier(r);s===l&&o.resolve(i)}return i}onInit(e,t){var s;const i=this.normalizeInstanceIdentifier(t),r=(s=this.onInitCallbacks.get(i))!==null&&s!==void 0?s:new Set;r.add(e),this.onInitCallbacks.set(i,r);const o=this.instances.get(i);return o&&e(o,i),()=>{r.delete(e)}}invokeOnInitCallbacks(e,t){const s=this.onInitCallbacks.get(t);if(s)for(const i of s)try{i(e,t)}catch{}}getOrInitializeService({instanceIdentifier:e,options:t={}}){let s=this.instances.get(e);if(!s&&this.component&&(s=this.component.instanceFactory(this.container,{instanceIdentifier:Op(e),options:t}),this.instances.set(e,s),this.instancesOptions.set(e,t),this.invokeOnInitCallbacks(s,e),this.component.onInstanceCreated))try{this.component.onInstanceCreated(this.container,e,s)}catch{}return s||null}normalizeInstanceIdentifier(e=Ln){return this.component?this.component.multipleInstances?e:Ln:e}shouldAutoInitialize(){return!!this.component&&this.component.instantiationMode!=="EXPLICIT"}}function Op(n){return n===Ln?void 0:n}function Mp(n){return n.instantiationMode==="EAGER"}/**
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
 */class Dp{constructor(e){this.name=e,this.providers=new Map}addComponent(e){const t=this.getProvider(e.name);if(t.isComponentSet())throw new Error(`Component ${e.name} has already been registered with ${this.name}`);t.setComponent(e)}addOrOverwriteComponent(e){this.getProvider(e.name).isComponentSet()&&this.providers.delete(e.name),this.addComponent(e)}getProvider(e){if(this.providers.has(e))return this.providers.get(e);const t=new Np(e,this);return this.providers.set(e,t),t}getProviders(){return Array.from(this.providers.values())}}/**
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
 */var ke;(function(n){n[n.DEBUG=0]="DEBUG",n[n.VERBOSE=1]="VERBOSE",n[n.INFO=2]="INFO",n[n.WARN=3]="WARN",n[n.ERROR=4]="ERROR",n[n.SILENT=5]="SILENT"})(ke||(ke={}));const Lp={debug:ke.DEBUG,verbose:ke.VERBOSE,info:ke.INFO,warn:ke.WARN,error:ke.ERROR,silent:ke.SILENT},$p=ke.INFO,Fp={[ke.DEBUG]:"log",[ke.VERBOSE]:"log",[ke.INFO]:"info",[ke.WARN]:"warn",[ke.ERROR]:"error"},Up=(n,e,...t)=>{if(e<n.logLevel)return;const s=new Date().toISOString(),i=Fp[e];if(i)console[i](`[${s}]  ${n.name}:`,...t);else throw new Error(`Attempted to log a message with an invalid logType (value: ${e})`)};class Ca{constructor(e){this.name=e,this._logLevel=$p,this._logHandler=Up,this._userLogHandler=null}get logLevel(){return this._logLevel}set logLevel(e){if(!(e in ke))throw new TypeError(`Invalid value "${e}" assigned to \`logLevel\``);this._logLevel=e}setLogLevel(e){this._logLevel=typeof e=="string"?Lp[e]:e}get logHandler(){return this._logHandler}set logHandler(e){if(typeof e!="function")throw new TypeError("Value assigned to `logHandler` must be a function");this._logHandler=e}get userLogHandler(){return this._userLogHandler}set userLogHandler(e){this._userLogHandler=e}debug(...e){this._userLogHandler&&this._userLogHandler(this,ke.DEBUG,...e),this._logHandler(this,ke.DEBUG,...e)}log(...e){this._userLogHandler&&this._userLogHandler(this,ke.VERBOSE,...e),this._logHandler(this,ke.VERBOSE,...e)}info(...e){this._userLogHandler&&this._userLogHandler(this,ke.INFO,...e),this._logHandler(this,ke.INFO,...e)}warn(...e){this._userLogHandler&&this._userLogHandler(this,ke.WARN,...e),this._logHandler(this,ke.WARN,...e)}error(...e){this._userLogHandler&&this._userLogHandler(this,ke.ERROR,...e),this._logHandler(this,ke.ERROR,...e)}}const Bp=(n,e)=>e.some(t=>n instanceof t);let ql,Kl;function Wp(){return ql||(ql=[IDBDatabase,IDBObjectStore,IDBIndex,IDBCursor,IDBTransaction])}function Hp(){return Kl||(Kl=[IDBCursor.prototype.advance,IDBCursor.prototype.continue,IDBCursor.prototype.continuePrimaryKey])}const Fd=new WeakMap,No=new WeakMap,Ud=new WeakMap,uo=new WeakMap,Ea=new WeakMap;function jp(n){const e=new Promise((t,s)=>{const i=()=>{n.removeEventListener("success",r),n.removeEventListener("error",o)},r=()=>{t(yn(n.result)),i()},o=()=>{s(n.error),i()};n.addEventListener("success",r),n.addEventListener("error",o)});return e.then(t=>{t instanceof IDBCursor&&Fd.set(t,n)}).catch(()=>{}),Ea.set(e,n),e}function Vp(n){if(No.has(n))return;const e=new Promise((t,s)=>{const i=()=>{n.removeEventListener("complete",r),n.removeEventListener("error",o),n.removeEventListener("abort",o)},r=()=>{t(),i()},o=()=>{s(n.error||new DOMException("AbortError","AbortError")),i()};n.addEventListener("complete",r),n.addEventListener("error",o),n.addEventListener("abort",o)});No.set(n,e)}let Oo={get(n,e,t){if(n instanceof IDBTransaction){if(e==="done")return No.get(n);if(e==="objectStoreNames")return n.objectStoreNames||Ud.get(n);if(e==="store")return t.objectStoreNames[1]?void 0:t.objectStore(t.objectStoreNames[0])}return yn(n[e])},set(n,e,t){return n[e]=t,!0},has(n,e){return n instanceof IDBTransaction&&(e==="done"||e==="store")?!0:e in n}};function zp(n){Oo=n(Oo)}function Gp(n){return n===IDBDatabase.prototype.transaction&&!("objectStoreNames"in IDBTransaction.prototype)?function(e,...t){const s=n.call(ho(this),e,...t);return Ud.set(s,e.sort?e.sort():[e]),yn(s)}:Hp().includes(n)?function(...e){return n.apply(ho(this),e),yn(Fd.get(this))}:function(...e){return yn(n.apply(ho(this),e))}}function qp(n){return typeof n=="function"?Gp(n):(n instanceof IDBTransaction&&Vp(n),Bp(n,Wp())?new Proxy(n,Oo):n)}function yn(n){if(n instanceof IDBRequest)return jp(n);if(uo.has(n))return uo.get(n);const e=qp(n);return e!==n&&(uo.set(n,e),Ea.set(e,n)),e}const ho=n=>Ea.get(n);function Kp(n,e,{blocked:t,upgrade:s,blocking:i,terminated:r}={}){const o=indexedDB.open(n,e),l=yn(o);return s&&o.addEventListener("upgradeneeded",c=>{s(yn(o.result),c.oldVersion,c.newVersion,yn(o.transaction),c)}),t&&o.addEventListener("blocked",c=>t(c.oldVersion,c.newVersion,c)),l.then(c=>{r&&c.addEventListener("close",()=>r()),i&&c.addEventListener("versionchange",d=>i(d.oldVersion,d.newVersion,d))}).catch(()=>{}),l}const Yp=["get","getKey","getAll","getAllKeys","count"],Qp=["put","add","delete","clear"],fo=new Map;function Yl(n,e){if(!(n instanceof IDBDatabase&&!(e in n)&&typeof e=="string"))return;if(fo.get(e))return fo.get(e);const t=e.replace(/FromIndex$/,""),s=e!==t,i=Qp.includes(t);if(!(t in(s?IDBIndex:IDBObjectStore).prototype)||!(i||Yp.includes(t)))return;const r=async function(o,...l){const c=this.transaction(o,i?"readwrite":"readonly");let d=c.store;return s&&(d=d.index(l.shift())),(await Promise.all([d[t](...l),i&&c.done]))[0]};return fo.set(e,r),r}zp(n=>({...n,get:(e,t,s)=>Yl(e,t)||n.get(e,t,s),has:(e,t)=>!!Yl(e,t)||n.has(e,t)}));/**
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
 */class Jp{constructor(e){this.container=e}getPlatformInfoString(){return this.container.getProviders().map(t=>{if(Xp(t)){const s=t.getImmediate();return`${s.library}/${s.version}`}else return null}).filter(t=>t).join(" ")}}function Xp(n){const e=n.getComponent();return(e==null?void 0:e.type)==="VERSION"}const Mo="@firebase/app",Ql="0.10.13";/**
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
 */const Xt=new Ca("@firebase/app"),Zp="@firebase/app-compat",em="@firebase/analytics-compat",tm="@firebase/analytics",nm="@firebase/app-check-compat",sm="@firebase/app-check",im="@firebase/auth",rm="@firebase/auth-compat",om="@firebase/database",am="@firebase/data-connect",lm="@firebase/database-compat",cm="@firebase/functions",dm="@firebase/functions-compat",um="@firebase/installations",hm="@firebase/installations-compat",fm="@firebase/messaging",pm="@firebase/messaging-compat",mm="@firebase/performance",gm="@firebase/performance-compat",ym="@firebase/remote-config",_m="@firebase/remote-config-compat",vm="@firebase/storage",bm="@firebase/storage-compat",wm="@firebase/firestore",Cm="@firebase/vertexai-preview",Em="@firebase/firestore-compat",km="firebase",Im="10.14.1";/**
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
 */const Do="[DEFAULT]",Sm={[Mo]:"fire-core",[Zp]:"fire-core-compat",[tm]:"fire-analytics",[em]:"fire-analytics-compat",[sm]:"fire-app-check",[nm]:"fire-app-check-compat",[im]:"fire-auth",[rm]:"fire-auth-compat",[om]:"fire-rtdb",[am]:"fire-data-connect",[lm]:"fire-rtdb-compat",[cm]:"fire-fn",[dm]:"fire-fn-compat",[um]:"fire-iid",[hm]:"fire-iid-compat",[fm]:"fire-fcm",[pm]:"fire-fcm-compat",[mm]:"fire-perf",[gm]:"fire-perf-compat",[ym]:"fire-rc",[_m]:"fire-rc-compat",[vm]:"fire-gcs",[bm]:"fire-gcs-compat",[wm]:"fire-fst",[Em]:"fire-fst-compat",[Cm]:"fire-vertex","fire-js":"fire-js",[km]:"fire-js-all"};/**
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
 */const ar=new Map,Tm=new Map,Lo=new Map;function Jl(n,e){try{n.container.addComponent(e)}catch(t){Xt.debug(`Component ${e.name} failed to register with FirebaseApp ${n.name}`,t)}}function gs(n){const e=n.name;if(Lo.has(e))return Xt.debug(`There were multiple attempts to register component ${e}.`),!1;Lo.set(e,n);for(const t of ar.values())Jl(t,n);for(const t of Tm.values())Jl(t,n);return!0}function ka(n,e){const t=n.container.getProvider("heartbeat").getImmediate({optional:!0});return t&&t.triggerHeartbeat(),n.container.getProvider(e)}function Lt(n){return n.settings!==void 0}/**
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
 */const xm={"no-app":"No Firebase App '{$appName}' has been created - call initializeApp() first","bad-app-name":"Illegal App name: '{$appName}'","duplicate-app":"Firebase App named '{$appName}' already exists with different options or config","app-deleted":"Firebase App named '{$appName}' already deleted","server-app-deleted":"Firebase Server App has been deleted","no-options":"Need to provide options, when not being deployed to hosting via source.","invalid-app-argument":"firebase.{$appName}() takes either no argument or a Firebase App instance.","invalid-log-argument":"First argument to `onLog` must be null or a function.","idb-open":"Error thrown when opening IndexedDB. Original error: {$originalErrorMessage}.","idb-get":"Error thrown when reading from IndexedDB. Original error: {$originalErrorMessage}.","idb-set":"Error thrown when writing to IndexedDB. Original error: {$originalErrorMessage}.","idb-delete":"Error thrown when deleting from IndexedDB. Original error: {$originalErrorMessage}.","finalization-registry-not-supported":"FirebaseServerApp deleteOnDeref field defined but the JS runtime does not support FinalizationRegistry.","invalid-server-app-environment":"FirebaseServerApp is not for use in browser environments."},_n=new Ci("app","Firebase",xm);/**
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
 */class Am{constructor(e,t,s){this._isDeleted=!1,this._options=Object.assign({},e),this._config=Object.assign({},t),this._name=t.name,this._automaticDataCollectionEnabled=t.automaticDataCollectionEnabled,this._container=s,this.container.addComponent(new Gn("app",()=>this,"PUBLIC"))}get automaticDataCollectionEnabled(){return this.checkDestroyed(),this._automaticDataCollectionEnabled}set automaticDataCollectionEnabled(e){this.checkDestroyed(),this._automaticDataCollectionEnabled=e}get name(){return this.checkDestroyed(),this._name}get options(){return this.checkDestroyed(),this._options}get config(){return this.checkDestroyed(),this._config}get container(){return this._container}get isDeleted(){return this._isDeleted}set isDeleted(e){this._isDeleted=e}checkDestroyed(){if(this.isDeleted)throw _n.create("app-deleted",{appName:this._name})}}/**
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
 */const xs=Im;function Bd(n,e={}){let t=n;typeof e!="object"&&(e={name:e});const s=Object.assign({name:Do,automaticDataCollectionEnabled:!1},e),i=s.name;if(typeof i!="string"||!i)throw _n.create("bad-app-name",{appName:String(i)});if(t||(t=Md()),!t)throw _n.create("no-options");const r=ar.get(i);if(r){if(or(t,r.options)&&or(s,r.config))return r;throw _n.create("duplicate-app",{appName:i})}const o=new Dp(i);for(const c of Lo.values())o.addComponent(c);const l=new Am(t,s,o);return ar.set(i,l),l}function Wd(n=Do){const e=ar.get(n);if(!e&&n===Do&&Md())return Bd();if(!e)throw _n.create("no-app",{appName:n});return e}function vn(n,e,t){var s;let i=(s=Sm[n])!==null&&s!==void 0?s:n;t&&(i+=`-${t}`);const r=i.match(/\s|\//),o=e.match(/\s|\//);if(r||o){const l=[`Unable to register library "${i}" with version "${e}":`];r&&l.push(`library name "${i}" contains illegal characters (whitespace or "/")`),r&&o&&l.push("and"),o&&l.push(`version name "${e}" contains illegal characters (whitespace or "/")`),Xt.warn(l.join(" "));return}gs(new Gn(`${i}-version`,()=>({library:i,version:e}),"VERSION"))}/**
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
 */const Rm="firebase-heartbeat-database",Pm=1,oi="firebase-heartbeat-store";let po=null;function Hd(){return po||(po=Kp(Rm,Pm,{upgrade:(n,e)=>{switch(e){case 0:try{n.createObjectStore(oi)}catch(t){console.warn(t)}}}}).catch(n=>{throw _n.create("idb-open",{originalErrorMessage:n.message})})),po}async function Nm(n){try{const t=(await Hd()).transaction(oi),s=await t.objectStore(oi).get(jd(n));return await t.done,s}catch(e){if(e instanceof An)Xt.warn(e.message);else{const t=_n.create("idb-get",{originalErrorMessage:e==null?void 0:e.message});Xt.warn(t.message)}}}async function Xl(n,e){try{const s=(await Hd()).transaction(oi,"readwrite");await s.objectStore(oi).put(e,jd(n)),await s.done}catch(t){if(t instanceof An)Xt.warn(t.message);else{const s=_n.create("idb-set",{originalErrorMessage:t==null?void 0:t.message});Xt.warn(s.message)}}}function jd(n){return`${n.name}!${n.options.appId}`}/**
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
 */const Om=1024,Mm=30*24*60*60*1e3;class Dm{constructor(e){this.container=e,this._heartbeatsCache=null;const t=this.container.getProvider("app").getImmediate();this._storage=new $m(t),this._heartbeatsCachePromise=this._storage.read().then(s=>(this._heartbeatsCache=s,s))}async triggerHeartbeat(){var e,t;try{const i=this.container.getProvider("platform-logger").getImmediate().getPlatformInfoString(),r=Zl();return((e=this._heartbeatsCache)===null||e===void 0?void 0:e.heartbeats)==null&&(this._heartbeatsCache=await this._heartbeatsCachePromise,((t=this._heartbeatsCache)===null||t===void 0?void 0:t.heartbeats)==null)||this._heartbeatsCache.lastSentHeartbeatDate===r||this._heartbeatsCache.heartbeats.some(o=>o.date===r)?void 0:(this._heartbeatsCache.heartbeats.push({date:r,agent:i}),this._heartbeatsCache.heartbeats=this._heartbeatsCache.heartbeats.filter(o=>{const l=new Date(o.date).valueOf();return Date.now()-l<=Mm}),this._storage.overwrite(this._heartbeatsCache))}catch(s){Xt.warn(s)}}async getHeartbeatsHeader(){var e;try{if(this._heartbeatsCache===null&&await this._heartbeatsCachePromise,((e=this._heartbeatsCache)===null||e===void 0?void 0:e.heartbeats)==null||this._heartbeatsCache.heartbeats.length===0)return"";const t=Zl(),{heartbeatsToSend:s,unsentEntries:i}=Lm(this._heartbeatsCache.heartbeats),r=nr(JSON.stringify({version:2,heartbeats:s}));return this._heartbeatsCache.lastSentHeartbeatDate=t,i.length>0?(this._heartbeatsCache.heartbeats=i,await this._storage.overwrite(this._heartbeatsCache)):(this._heartbeatsCache.heartbeats=[],this._storage.overwrite(this._heartbeatsCache)),r}catch(t){return Xt.warn(t),""}}}function Zl(){return new Date().toISOString().substring(0,10)}function Lm(n,e=Om){const t=[];let s=n.slice();for(const i of n){const r=t.find(o=>o.agent===i.agent);if(r){if(r.dates.push(i.date),ec(t)>e){r.dates.pop();break}}else if(t.push({agent:i.agent,dates:[i.date]}),ec(t)>e){t.pop();break}s=s.slice(1)}return{heartbeatsToSend:t,unsentEntries:s}}class $m{constructor(e){this.app=e,this._canUseIndexedDBPromise=this.runIndexedDBEnvironmentCheck()}async runIndexedDBEnvironmentCheck(){return bp()?wp().then(()=>!0).catch(()=>!1):!1}async read(){if(await this._canUseIndexedDBPromise){const t=await Nm(this.app);return t!=null&&t.heartbeats?t:{heartbeats:[]}}else return{heartbeats:[]}}async overwrite(e){var t;if(await this._canUseIndexedDBPromise){const i=await this.read();return Xl(this.app,{lastSentHeartbeatDate:(t=e.lastSentHeartbeatDate)!==null&&t!==void 0?t:i.lastSentHeartbeatDate,heartbeats:e.heartbeats})}else return}async add(e){var t;if(await this._canUseIndexedDBPromise){const i=await this.read();return Xl(this.app,{lastSentHeartbeatDate:(t=e.lastSentHeartbeatDate)!==null&&t!==void 0?t:i.lastSentHeartbeatDate,heartbeats:[...i.heartbeats,...e.heartbeats]})}else return}}function ec(n){return nr(JSON.stringify({version:2,heartbeats:n})).length}/**
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
 */function Fm(n){gs(new Gn("platform-logger",e=>new Jp(e),"PRIVATE")),gs(new Gn("heartbeat",e=>new Dm(e),"PRIVATE")),vn(Mo,Ql,n),vn(Mo,Ql,"esm2017"),vn("fire-js","")}Fm("");function Ia(n,e){var t={};for(var s in n)Object.prototype.hasOwnProperty.call(n,s)&&e.indexOf(s)<0&&(t[s]=n[s]);if(n!=null&&typeof Object.getOwnPropertySymbols=="function")for(var i=0,s=Object.getOwnPropertySymbols(n);i<s.length;i++)e.indexOf(s[i])<0&&Object.prototype.propertyIsEnumerable.call(n,s[i])&&(t[s[i]]=n[s[i]]);return t}function Vd(){return{"dependent-sdk-initialized-before-auth":"Another Firebase SDK was initialized and is trying to use Auth before Auth is initialized. Please be sure to call `initializeAuth` or `getAuth` before starting any other Firebase SDK."}}const Um=Vd,zd=new Ci("auth","Firebase",Vd());/**
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
 */const lr=new Ca("@firebase/auth");function Bm(n,...e){lr.logLevel<=ke.WARN&&lr.warn(`Auth (${xs}): ${n}`,...e)}function Yi(n,...e){lr.logLevel<=ke.ERROR&&lr.error(`Auth (${xs}): ${n}`,...e)}/**
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
 */function Rt(n,...e){throw Sa(n,...e)}function Ft(n,...e){return Sa(n,...e)}function Gd(n,e,t){const s=Object.assign(Object.assign({},Um()),{[e]:t});return new Ci("auth","Firebase",s).create(e,{appName:n.name})}function Yt(n){return Gd(n,"operation-not-supported-in-this-environment","Operations that alter the current user are not supported in conjunction with FirebaseServerApp")}function Sa(n,...e){if(typeof n!="string"){const t=e[0],s=[...e.slice(1)];return s[0]&&(s[0].appName=n.name),n._errorFactory.create(t,...s)}return zd.create(n,...e)}function de(n,e,...t){if(!n)throw Sa(e,...t)}function zt(n){const e="INTERNAL ASSERTION FAILED: "+n;throw Yi(e),new Error(e)}function Zt(n,e){n||zt(e)}/**
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
 */function $o(){var n;return typeof self<"u"&&((n=self.location)===null||n===void 0?void 0:n.href)||""}function Wm(){return tc()==="http:"||tc()==="https:"}function tc(){var n;return typeof self<"u"&&((n=self.location)===null||n===void 0?void 0:n.protocol)||null}/**
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
 */function Hm(){return typeof navigator<"u"&&navigator&&"onLine"in navigator&&typeof navigator.onLine=="boolean"&&(Wm()||yp()||"connection"in navigator)?navigator.onLine:!0}function jm(){if(typeof navigator>"u")return null;const n=navigator;return n.languages&&n.languages[0]||n.language||null}/**
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
 */class Ei{constructor(e,t){this.shortDelay=e,this.longDelay=t,Zt(t>e,"Short delay should be less than long delay!"),this.isMobile=wa()||Ld()}get(){return Hm()?this.isMobile?this.longDelay:this.shortDelay:Math.min(5e3,this.shortDelay)}}/**
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
 */function Ta(n,e){Zt(n.emulator,"Emulator should always be set here");const{url:t}=n.emulator;return e?`${t}${e.startsWith("/")?e.slice(1):e}`:t}/**
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
 */class qd{static initialize(e,t,s){this.fetchImpl=e,t&&(this.headersImpl=t),s&&(this.responseImpl=s)}static fetch(){if(this.fetchImpl)return this.fetchImpl;if(typeof self<"u"&&"fetch"in self)return self.fetch;if(typeof globalThis<"u"&&globalThis.fetch)return globalThis.fetch;if(typeof fetch<"u")return fetch;zt("Could not find fetch implementation, make sure you call FetchProvider.initialize() with an appropriate polyfill")}static headers(){if(this.headersImpl)return this.headersImpl;if(typeof self<"u"&&"Headers"in self)return self.Headers;if(typeof globalThis<"u"&&globalThis.Headers)return globalThis.Headers;if(typeof Headers<"u")return Headers;zt("Could not find Headers implementation, make sure you call FetchProvider.initialize() with an appropriate polyfill")}static response(){if(this.responseImpl)return this.responseImpl;if(typeof self<"u"&&"Response"in self)return self.Response;if(typeof globalThis<"u"&&globalThis.Response)return globalThis.Response;if(typeof Response<"u")return Response;zt("Could not find Response implementation, make sure you call FetchProvider.initialize() with an appropriate polyfill")}}/**
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
 */const Vm={CREDENTIAL_MISMATCH:"custom-token-mismatch",MISSING_CUSTOM_TOKEN:"internal-error",INVALID_IDENTIFIER:"invalid-email",MISSING_CONTINUE_URI:"internal-error",INVALID_PASSWORD:"wrong-password",MISSING_PASSWORD:"missing-password",INVALID_LOGIN_CREDENTIALS:"invalid-credential",EMAIL_EXISTS:"email-already-in-use",PASSWORD_LOGIN_DISABLED:"operation-not-allowed",INVALID_IDP_RESPONSE:"invalid-credential",INVALID_PENDING_TOKEN:"invalid-credential",FEDERATED_USER_ID_ALREADY_LINKED:"credential-already-in-use",MISSING_REQ_TYPE:"internal-error",EMAIL_NOT_FOUND:"user-not-found",RESET_PASSWORD_EXCEED_LIMIT:"too-many-requests",EXPIRED_OOB_CODE:"expired-action-code",INVALID_OOB_CODE:"invalid-action-code",MISSING_OOB_CODE:"internal-error",CREDENTIAL_TOO_OLD_LOGIN_AGAIN:"requires-recent-login",INVALID_ID_TOKEN:"invalid-user-token",TOKEN_EXPIRED:"user-token-expired",USER_NOT_FOUND:"user-token-expired",TOO_MANY_ATTEMPTS_TRY_LATER:"too-many-requests",PASSWORD_DOES_NOT_MEET_REQUIREMENTS:"password-does-not-meet-requirements",INVALID_CODE:"invalid-verification-code",INVALID_SESSION_INFO:"invalid-verification-id",INVALID_TEMPORARY_PROOF:"invalid-credential",MISSING_SESSION_INFO:"missing-verification-id",SESSION_EXPIRED:"code-expired",MISSING_ANDROID_PACKAGE_NAME:"missing-android-pkg-name",UNAUTHORIZED_DOMAIN:"unauthorized-continue-uri",INVALID_OAUTH_CLIENT_ID:"invalid-oauth-client-id",ADMIN_ONLY_OPERATION:"admin-restricted-operation",INVALID_MFA_PENDING_CREDENTIAL:"invalid-multi-factor-session",MFA_ENROLLMENT_NOT_FOUND:"multi-factor-info-not-found",MISSING_MFA_ENROLLMENT_ID:"missing-multi-factor-info",MISSING_MFA_PENDING_CREDENTIAL:"missing-multi-factor-session",SECOND_FACTOR_EXISTS:"second-factor-already-in-use",SECOND_FACTOR_LIMIT_EXCEEDED:"maximum-second-factor-count-exceeded",BLOCKING_FUNCTION_ERROR_RESPONSE:"internal-error",RECAPTCHA_NOT_ENABLED:"recaptcha-not-enabled",MISSING_RECAPTCHA_TOKEN:"missing-recaptcha-token",INVALID_RECAPTCHA_TOKEN:"invalid-recaptcha-token",INVALID_RECAPTCHA_ACTION:"invalid-recaptcha-action",MISSING_CLIENT_TYPE:"missing-client-type",MISSING_RECAPTCHA_VERSION:"missing-recaptcha-version",INVALID_RECAPTCHA_VERSION:"invalid-recaptcha-version",INVALID_REQ_TYPE:"invalid-req-type"};/**
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
 */const zm=new Ei(3e4,6e4);function Rn(n,e){return n.tenantId&&!e.tenantId?Object.assign(Object.assign({},e),{tenantId:n.tenantId}):e}async function sn(n,e,t,s,i={}){return Kd(n,i,async()=>{let r={},o={};s&&(e==="GET"?o=s:r={body:JSON.stringify(s)});const l=Ts(Object.assign({key:n.config.apiKey},o)).slice(1),c=await n._getAdditionalHeaders();c["Content-Type"]="application/json",n.languageCode&&(c["X-Firebase-Locale"]=n.languageCode);const d=Object.assign({method:e,headers:c},r);return gp()||(d.referrerPolicy="no-referrer"),qd.fetch()(Yd(n,n.config.apiHost,t,l),d)})}async function Kd(n,e,t){n._canInitEmulator=!1;const s=Object.assign(Object.assign({},Vm),e);try{const i=new qm(n),r=await Promise.race([t(),i.promise]);i.clearNetworkTimeout();const o=await r.json();if("needConfirmation"in o)throw Hi(n,"account-exists-with-different-credential",o);if(r.ok&&!("errorMessage"in o))return o;{const l=r.ok?o.errorMessage:o.error.message,[c,d]=l.split(" : ");if(c==="FEDERATED_USER_ID_ALREADY_LINKED")throw Hi(n,"credential-already-in-use",o);if(c==="EMAIL_EXISTS")throw Hi(n,"email-already-in-use",o);if(c==="USER_DISABLED")throw Hi(n,"user-disabled",o);const h=s[c]||c.toLowerCase().replace(/[_\s]+/g,"-");if(d)throw Gd(n,h,d);Rt(n,h)}}catch(i){if(i instanceof An)throw i;Rt(n,"network-request-failed",{message:String(i)})}}async function ki(n,e,t,s,i={}){const r=await sn(n,e,t,s,i);return"mfaPendingCredential"in r&&Rt(n,"multi-factor-auth-required",{_serverResponse:r}),r}function Yd(n,e,t,s){const i=`${e}${t}?${s}`;return n.config.emulator?Ta(n.config,i):`${n.config.apiScheme}://${i}`}function Gm(n){switch(n){case"ENFORCE":return"ENFORCE";case"AUDIT":return"AUDIT";case"OFF":return"OFF";default:return"ENFORCEMENT_STATE_UNSPECIFIED"}}class qm{constructor(e){this.auth=e,this.timer=null,this.promise=new Promise((t,s)=>{this.timer=setTimeout(()=>s(Ft(this.auth,"network-request-failed")),zm.get())})}clearNetworkTimeout(){clearTimeout(this.timer)}}function Hi(n,e,t){const s={appName:n.name};t.email&&(s.email=t.email),t.phoneNumber&&(s.phoneNumber=t.phoneNumber);const i=Ft(n,e,s);return i.customData._tokenResponse=t,i}function nc(n){return n!==void 0&&n.enterprise!==void 0}class Km{constructor(e){if(this.siteKey="",this.recaptchaEnforcementState=[],e.recaptchaKey===void 0)throw new Error("recaptchaKey undefined");this.siteKey=e.recaptchaKey.split("/")[3],this.recaptchaEnforcementState=e.recaptchaEnforcementState}getProviderEnforcementState(e){if(!this.recaptchaEnforcementState||this.recaptchaEnforcementState.length===0)return null;for(const t of this.recaptchaEnforcementState)if(t.provider&&t.provider===e)return Gm(t.enforcementState);return null}isProviderEnabled(e){return this.getProviderEnforcementState(e)==="ENFORCE"||this.getProviderEnforcementState(e)==="AUDIT"}}async function Ym(n,e){return sn(n,"GET","/v2/recaptchaConfig",Rn(n,e))}/**
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
 */async function Qm(n,e){return sn(n,"POST","/v1/accounts:delete",e)}async function Qd(n,e){return sn(n,"POST","/v1/accounts:lookup",e)}/**
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
 */function Ys(n){if(n)try{const e=new Date(Number(n));if(!isNaN(e.getTime()))return e.toUTCString()}catch{}}async function Jm(n,e=!1){const t=$e(n),s=await t.getIdToken(e),i=xa(s);de(i&&i.exp&&i.auth_time&&i.iat,t.auth,"internal-error");const r=typeof i.firebase=="object"?i.firebase:void 0,o=r==null?void 0:r.sign_in_provider;return{claims:i,token:s,authTime:Ys(mo(i.auth_time)),issuedAtTime:Ys(mo(i.iat)),expirationTime:Ys(mo(i.exp)),signInProvider:o||null,signInSecondFactor:(r==null?void 0:r.sign_in_second_factor)||null}}function mo(n){return Number(n)*1e3}function xa(n){const[e,t,s]=n.split(".");if(e===void 0||t===void 0||s===void 0)return Yi("JWT malformed, contained fewer than 3 sections"),null;try{const i=sr(t);return i?JSON.parse(i):(Yi("Failed to decode base64 JWT payload"),null)}catch(i){return Yi("Caught error parsing JWT payload as JSON",i==null?void 0:i.toString()),null}}function sc(n){const e=xa(n);return de(e,"internal-error"),de(typeof e.exp<"u","internal-error"),de(typeof e.iat<"u","internal-error"),Number(e.exp)-Number(e.iat)}/**
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
 */async function ys(n,e,t=!1){if(t)return e;try{return await e}catch(s){throw s instanceof An&&Xm(s)&&n.auth.currentUser===n&&await n.auth.signOut(),s}}function Xm({code:n}){return n==="auth/user-disabled"||n==="auth/user-token-expired"}/**
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
 */class Zm{constructor(e){this.user=e,this.isRunning=!1,this.timerId=null,this.errorBackoff=3e4}_start(){this.isRunning||(this.isRunning=!0,this.schedule())}_stop(){this.isRunning&&(this.isRunning=!1,this.timerId!==null&&clearTimeout(this.timerId))}getInterval(e){var t;if(e){const s=this.errorBackoff;return this.errorBackoff=Math.min(this.errorBackoff*2,96e4),s}else{this.errorBackoff=3e4;const i=((t=this.user.stsTokenManager.expirationTime)!==null&&t!==void 0?t:0)-Date.now()-3e5;return Math.max(0,i)}}schedule(e=!1){if(!this.isRunning)return;const t=this.getInterval(e);this.timerId=setTimeout(async()=>{await this.iteration()},t)}async iteration(){try{await this.user.getIdToken(!0)}catch(e){(e==null?void 0:e.code)==="auth/network-request-failed"&&this.schedule(!0);return}this.schedule()}}/**
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
 */class Fo{constructor(e,t){this.createdAt=e,this.lastLoginAt=t,this._initializeTime()}_initializeTime(){this.lastSignInTime=Ys(this.lastLoginAt),this.creationTime=Ys(this.createdAt)}_copy(e){this.createdAt=e.createdAt,this.lastLoginAt=e.lastLoginAt,this._initializeTime()}toJSON(){return{createdAt:this.createdAt,lastLoginAt:this.lastLoginAt}}}/**
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
 */async function cr(n){var e;const t=n.auth,s=await n.getIdToken(),i=await ys(n,Qd(t,{idToken:s}));de(i==null?void 0:i.users.length,t,"internal-error");const r=i.users[0];n._notifyReloadListener(r);const o=!((e=r.providerUserInfo)===null||e===void 0)&&e.length?Jd(r.providerUserInfo):[],l=tg(n.providerData,o),c=n.isAnonymous,d=!(n.email&&r.passwordHash)&&!(l!=null&&l.length),h=c?d:!1,u={uid:r.localId,displayName:r.displayName||null,photoURL:r.photoUrl||null,email:r.email||null,emailVerified:r.emailVerified||!1,phoneNumber:r.phoneNumber||null,tenantId:r.tenantId||null,providerData:l,metadata:new Fo(r.createdAt,r.lastLoginAt),isAnonymous:h};Object.assign(n,u)}async function eg(n){const e=$e(n);await cr(e),await e.auth._persistUserIfCurrent(e),e.auth._notifyListenersIfCurrent(e)}function tg(n,e){return[...n.filter(s=>!e.some(i=>i.providerId===s.providerId)),...e]}function Jd(n){return n.map(e=>{var{providerId:t}=e,s=Ia(e,["providerId"]);return{providerId:t,uid:s.rawId||"",displayName:s.displayName||null,email:s.email||null,phoneNumber:s.phoneNumber||null,photoURL:s.photoUrl||null}})}/**
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
 */async function ng(n,e){const t=await Kd(n,{},async()=>{const s=Ts({grant_type:"refresh_token",refresh_token:e}).slice(1),{tokenApiHost:i,apiKey:r}=n.config,o=Yd(n,i,"/v1/token",`key=${r}`),l=await n._getAdditionalHeaders();return l["Content-Type"]="application/x-www-form-urlencoded",qd.fetch()(o,{method:"POST",headers:l,body:s})});return{accessToken:t.access_token,expiresIn:t.expires_in,refreshToken:t.refresh_token}}async function sg(n,e){return sn(n,"POST","/v2/accounts:revokeToken",Rn(n,e))}/**
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
 */class ls{constructor(){this.refreshToken=null,this.accessToken=null,this.expirationTime=null}get isExpired(){return!this.expirationTime||Date.now()>this.expirationTime-3e4}updateFromServerResponse(e){de(e.idToken,"internal-error"),de(typeof e.idToken<"u","internal-error"),de(typeof e.refreshToken<"u","internal-error");const t="expiresIn"in e&&typeof e.expiresIn<"u"?Number(e.expiresIn):sc(e.idToken);this.updateTokensAndExpiration(e.idToken,e.refreshToken,t)}updateFromIdToken(e){de(e.length!==0,"internal-error");const t=sc(e);this.updateTokensAndExpiration(e,null,t)}async getToken(e,t=!1){return!t&&this.accessToken&&!this.isExpired?this.accessToken:(de(this.refreshToken,e,"user-token-expired"),this.refreshToken?(await this.refresh(e,this.refreshToken),this.accessToken):null)}clearRefreshToken(){this.refreshToken=null}async refresh(e,t){const{accessToken:s,refreshToken:i,expiresIn:r}=await ng(e,t);this.updateTokensAndExpiration(s,i,Number(r))}updateTokensAndExpiration(e,t,s){this.refreshToken=t||null,this.accessToken=e||null,this.expirationTime=Date.now()+s*1e3}static fromJSON(e,t){const{refreshToken:s,accessToken:i,expirationTime:r}=t,o=new ls;return s&&(de(typeof s=="string","internal-error",{appName:e}),o.refreshToken=s),i&&(de(typeof i=="string","internal-error",{appName:e}),o.accessToken=i),r&&(de(typeof r=="number","internal-error",{appName:e}),o.expirationTime=r),o}toJSON(){return{refreshToken:this.refreshToken,accessToken:this.accessToken,expirationTime:this.expirationTime}}_assign(e){this.accessToken=e.accessToken,this.refreshToken=e.refreshToken,this.expirationTime=e.expirationTime}_clone(){return Object.assign(new ls,this.toJSON())}_performRefresh(){return zt("not implemented")}}/**
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
 */function ln(n,e){de(typeof n=="string"||typeof n>"u","internal-error",{appName:e})}class Gt{constructor(e){var{uid:t,auth:s,stsTokenManager:i}=e,r=Ia(e,["uid","auth","stsTokenManager"]);this.providerId="firebase",this.proactiveRefresh=new Zm(this),this.reloadUserInfo=null,this.reloadListener=null,this.uid=t,this.auth=s,this.stsTokenManager=i,this.accessToken=i.accessToken,this.displayName=r.displayName||null,this.email=r.email||null,this.emailVerified=r.emailVerified||!1,this.phoneNumber=r.phoneNumber||null,this.photoURL=r.photoURL||null,this.isAnonymous=r.isAnonymous||!1,this.tenantId=r.tenantId||null,this.providerData=r.providerData?[...r.providerData]:[],this.metadata=new Fo(r.createdAt||void 0,r.lastLoginAt||void 0)}async getIdToken(e){const t=await ys(this,this.stsTokenManager.getToken(this.auth,e));return de(t,this.auth,"internal-error"),this.accessToken!==t&&(this.accessToken=t,await this.auth._persistUserIfCurrent(this),this.auth._notifyListenersIfCurrent(this)),t}getIdTokenResult(e){return Jm(this,e)}reload(){return eg(this)}_assign(e){this!==e&&(de(this.uid===e.uid,this.auth,"internal-error"),this.displayName=e.displayName,this.photoURL=e.photoURL,this.email=e.email,this.emailVerified=e.emailVerified,this.phoneNumber=e.phoneNumber,this.isAnonymous=e.isAnonymous,this.tenantId=e.tenantId,this.providerData=e.providerData.map(t=>Object.assign({},t)),this.metadata._copy(e.metadata),this.stsTokenManager._assign(e.stsTokenManager))}_clone(e){const t=new Gt(Object.assign(Object.assign({},this),{auth:e,stsTokenManager:this.stsTokenManager._clone()}));return t.metadata._copy(this.metadata),t}_onReload(e){de(!this.reloadListener,this.auth,"internal-error"),this.reloadListener=e,this.reloadUserInfo&&(this._notifyReloadListener(this.reloadUserInfo),this.reloadUserInfo=null)}_notifyReloadListener(e){this.reloadListener?this.reloadListener(e):this.reloadUserInfo=e}_startProactiveRefresh(){this.proactiveRefresh._start()}_stopProactiveRefresh(){this.proactiveRefresh._stop()}async _updateTokensIfNecessary(e,t=!1){let s=!1;e.idToken&&e.idToken!==this.stsTokenManager.accessToken&&(this.stsTokenManager.updateFromServerResponse(e),s=!0),t&&await cr(this),await this.auth._persistUserIfCurrent(this),s&&this.auth._notifyListenersIfCurrent(this)}async delete(){if(Lt(this.auth.app))return Promise.reject(Yt(this.auth));const e=await this.getIdToken();return await ys(this,Qm(this.auth,{idToken:e})),this.stsTokenManager.clearRefreshToken(),this.auth.signOut()}toJSON(){return Object.assign(Object.assign({uid:this.uid,email:this.email||void 0,emailVerified:this.emailVerified,displayName:this.displayName||void 0,isAnonymous:this.isAnonymous,photoURL:this.photoURL||void 0,phoneNumber:this.phoneNumber||void 0,tenantId:this.tenantId||void 0,providerData:this.providerData.map(e=>Object.assign({},e)),stsTokenManager:this.stsTokenManager.toJSON(),_redirectEventId:this._redirectEventId},this.metadata.toJSON()),{apiKey:this.auth.config.apiKey,appName:this.auth.name})}get refreshToken(){return this.stsTokenManager.refreshToken||""}static _fromJSON(e,t){var s,i,r,o,l,c,d,h;const u=(s=t.displayName)!==null&&s!==void 0?s:void 0,m=(i=t.email)!==null&&i!==void 0?i:void 0,f=(r=t.phoneNumber)!==null&&r!==void 0?r:void 0,y=(o=t.photoURL)!==null&&o!==void 0?o:void 0,w=(l=t.tenantId)!==null&&l!==void 0?l:void 0,E=(c=t._redirectEventId)!==null&&c!==void 0?c:void 0,x=(d=t.createdAt)!==null&&d!==void 0?d:void 0,_=(h=t.lastLoginAt)!==null&&h!==void 0?h:void 0,{uid:U,emailVerified:M,isAnonymous:A,providerData:W,stsTokenManager:k}=t;de(U&&k,e,"internal-error");const S=ls.fromJSON(this.name,k);de(typeof U=="string",e,"internal-error"),ln(u,e.name),ln(m,e.name),de(typeof M=="boolean",e,"internal-error"),de(typeof A=="boolean",e,"internal-error"),ln(f,e.name),ln(y,e.name),ln(w,e.name),ln(E,e.name),ln(x,e.name),ln(_,e.name);const P=new Gt({uid:U,auth:e,email:m,emailVerified:M,displayName:u,isAnonymous:A,photoURL:y,phoneNumber:f,tenantId:w,stsTokenManager:S,createdAt:x,lastLoginAt:_});return W&&Array.isArray(W)&&(P.providerData=W.map(L=>Object.assign({},L))),E&&(P._redirectEventId=E),P}static async _fromIdTokenResponse(e,t,s=!1){const i=new ls;i.updateFromServerResponse(t);const r=new Gt({uid:t.localId,auth:e,stsTokenManager:i,isAnonymous:s});return await cr(r),r}static async _fromGetAccountInfoResponse(e,t,s){const i=t.users[0];de(i.localId!==void 0,"internal-error");const r=i.providerUserInfo!==void 0?Jd(i.providerUserInfo):[],o=!(i.email&&i.passwordHash)&&!(r!=null&&r.length),l=new ls;l.updateFromIdToken(s);const c=new Gt({uid:i.localId,auth:e,stsTokenManager:l,isAnonymous:o}),d={uid:i.localId,displayName:i.displayName||null,photoURL:i.photoUrl||null,email:i.email||null,emailVerified:i.emailVerified||!1,phoneNumber:i.phoneNumber||null,tenantId:i.tenantId||null,providerData:r,metadata:new Fo(i.createdAt,i.lastLoginAt),isAnonymous:!(i.email&&i.passwordHash)&&!(r!=null&&r.length)};return Object.assign(c,d),c}}/**
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
 */const ic=new Map;function qt(n){Zt(n instanceof Function,"Expected a class definition");let e=ic.get(n);return e?(Zt(e instanceof n,"Instance stored in cache mismatched with class"),e):(e=new n,ic.set(n,e),e)}/**
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
 */class Xd{constructor(){this.type="NONE",this.storage={}}async _isAvailable(){return!0}async _set(e,t){this.storage[e]=t}async _get(e){const t=this.storage[e];return t===void 0?null:t}async _remove(e){delete this.storage[e]}_addListener(e,t){}_removeListener(e,t){}}Xd.type="NONE";const rc=Xd;/**
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
 */function Qi(n,e,t){return`firebase:${n}:${e}:${t}`}class cs{constructor(e,t,s){this.persistence=e,this.auth=t,this.userKey=s;const{config:i,name:r}=this.auth;this.fullUserKey=Qi(this.userKey,i.apiKey,r),this.fullPersistenceKey=Qi("persistence",i.apiKey,r),this.boundEventHandler=t._onStorageEvent.bind(t),this.persistence._addListener(this.fullUserKey,this.boundEventHandler)}setCurrentUser(e){return this.persistence._set(this.fullUserKey,e.toJSON())}async getCurrentUser(){const e=await this.persistence._get(this.fullUserKey);return e?Gt._fromJSON(this.auth,e):null}removeCurrentUser(){return this.persistence._remove(this.fullUserKey)}savePersistenceForRedirect(){return this.persistence._set(this.fullPersistenceKey,this.persistence.type)}async setPersistence(e){if(this.persistence===e)return;const t=await this.getCurrentUser();if(await this.removeCurrentUser(),this.persistence=e,t)return this.setCurrentUser(t)}delete(){this.persistence._removeListener(this.fullUserKey,this.boundEventHandler)}static async create(e,t,s="authUser"){if(!t.length)return new cs(qt(rc),e,s);const i=(await Promise.all(t.map(async d=>{if(await d._isAvailable())return d}))).filter(d=>d);let r=i[0]||qt(rc);const o=Qi(s,e.config.apiKey,e.name);let l=null;for(const d of t)try{const h=await d._get(o);if(h){const u=Gt._fromJSON(e,h);d!==r&&(l=u),r=d;break}}catch{}const c=i.filter(d=>d._shouldAllowMigration);return!r._shouldAllowMigration||!c.length?new cs(r,e,s):(r=c[0],l&&await r._set(o,l.toJSON()),await Promise.all(t.map(async d=>{if(d!==r)try{await d._remove(o)}catch{}})),new cs(r,e,s))}}/**
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
 */function oc(n){const e=n.toLowerCase();if(e.includes("opera/")||e.includes("opr/")||e.includes("opios/"))return"Opera";if(nu(e))return"IEMobile";if(e.includes("msie")||e.includes("trident/"))return"IE";if(e.includes("edge/"))return"Edge";if(Zd(e))return"Firefox";if(e.includes("silk/"))return"Silk";if(iu(e))return"Blackberry";if(ru(e))return"Webos";if(eu(e))return"Safari";if((e.includes("chrome/")||tu(e))&&!e.includes("edge/"))return"Chrome";if(su(e))return"Android";{const t=/([a-zA-Z\d\.]+)\/[a-zA-Z\d\.]*$/,s=n.match(t);if((s==null?void 0:s.length)===2)return s[1]}return"Other"}function Zd(n=it()){return/firefox\//i.test(n)}function eu(n=it()){const e=n.toLowerCase();return e.includes("safari/")&&!e.includes("chrome/")&&!e.includes("crios/")&&!e.includes("android")}function tu(n=it()){return/crios\//i.test(n)}function nu(n=it()){return/iemobile/i.test(n)}function su(n=it()){return/android/i.test(n)}function iu(n=it()){return/blackberry/i.test(n)}function ru(n=it()){return/webos/i.test(n)}function Aa(n=it()){return/iphone|ipad|ipod/i.test(n)||/macintosh/i.test(n)&&/mobile/i.test(n)}function ig(n=it()){var e;return Aa(n)&&!!(!((e=window.navigator)===null||e===void 0)&&e.standalone)}function rg(){return _p()&&document.documentMode===10}function ou(n=it()){return Aa(n)||su(n)||ru(n)||iu(n)||/windows phone/i.test(n)||nu(n)}/**
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
 */function au(n,e=[]){let t;switch(n){case"Browser":t=oc(it());break;case"Worker":t=`${oc(it())}-${n}`;break;default:t=n}const s=e.length?e.join(","):"FirebaseCore-web";return`${t}/JsCore/${xs}/${s}`}/**
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
 */class og{constructor(e){this.auth=e,this.queue=[]}pushCallback(e,t){const s=r=>new Promise((o,l)=>{try{const c=e(r);o(c)}catch(c){l(c)}});s.onAbort=t,this.queue.push(s);const i=this.queue.length-1;return()=>{this.queue[i]=()=>Promise.resolve()}}async runMiddleware(e){if(this.auth.currentUser===e)return;const t=[];try{for(const s of this.queue)await s(e),s.onAbort&&t.push(s.onAbort)}catch(s){t.reverse();for(const i of t)try{i()}catch{}throw this.auth._errorFactory.create("login-blocked",{originalMessage:s==null?void 0:s.message})}}}/**
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
 */async function ag(n,e={}){return sn(n,"GET","/v2/passwordPolicy",Rn(n,e))}/**
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
 */const lg=6;class cg{constructor(e){var t,s,i,r;const o=e.customStrengthOptions;this.customStrengthOptions={},this.customStrengthOptions.minPasswordLength=(t=o.minPasswordLength)!==null&&t!==void 0?t:lg,o.maxPasswordLength&&(this.customStrengthOptions.maxPasswordLength=o.maxPasswordLength),o.containsLowercaseCharacter!==void 0&&(this.customStrengthOptions.containsLowercaseLetter=o.containsLowercaseCharacter),o.containsUppercaseCharacter!==void 0&&(this.customStrengthOptions.containsUppercaseLetter=o.containsUppercaseCharacter),o.containsNumericCharacter!==void 0&&(this.customStrengthOptions.containsNumericCharacter=o.containsNumericCharacter),o.containsNonAlphanumericCharacter!==void 0&&(this.customStrengthOptions.containsNonAlphanumericCharacter=o.containsNonAlphanumericCharacter),this.enforcementState=e.enforcementState,this.enforcementState==="ENFORCEMENT_STATE_UNSPECIFIED"&&(this.enforcementState="OFF"),this.allowedNonAlphanumericCharacters=(i=(s=e.allowedNonAlphanumericCharacters)===null||s===void 0?void 0:s.join(""))!==null&&i!==void 0?i:"",this.forceUpgradeOnSignin=(r=e.forceUpgradeOnSignin)!==null&&r!==void 0?r:!1,this.schemaVersion=e.schemaVersion}validatePassword(e){var t,s,i,r,o,l;const c={isValid:!0,passwordPolicy:this};return this.validatePasswordLengthOptions(e,c),this.validatePasswordCharacterOptions(e,c),c.isValid&&(c.isValid=(t=c.meetsMinPasswordLength)!==null&&t!==void 0?t:!0),c.isValid&&(c.isValid=(s=c.meetsMaxPasswordLength)!==null&&s!==void 0?s:!0),c.isValid&&(c.isValid=(i=c.containsLowercaseLetter)!==null&&i!==void 0?i:!0),c.isValid&&(c.isValid=(r=c.containsUppercaseLetter)!==null&&r!==void 0?r:!0),c.isValid&&(c.isValid=(o=c.containsNumericCharacter)!==null&&o!==void 0?o:!0),c.isValid&&(c.isValid=(l=c.containsNonAlphanumericCharacter)!==null&&l!==void 0?l:!0),c}validatePasswordLengthOptions(e,t){const s=this.customStrengthOptions.minPasswordLength,i=this.customStrengthOptions.maxPasswordLength;s&&(t.meetsMinPasswordLength=e.length>=s),i&&(t.meetsMaxPasswordLength=e.length<=i)}validatePasswordCharacterOptions(e,t){this.updatePasswordCharacterOptionsStatuses(t,!1,!1,!1,!1);let s;for(let i=0;i<e.length;i++)s=e.charAt(i),this.updatePasswordCharacterOptionsStatuses(t,s>="a"&&s<="z",s>="A"&&s<="Z",s>="0"&&s<="9",this.allowedNonAlphanumericCharacters.includes(s))}updatePasswordCharacterOptionsStatuses(e,t,s,i,r){this.customStrengthOptions.containsLowercaseLetter&&(e.containsLowercaseLetter||(e.containsLowercaseLetter=t)),this.customStrengthOptions.containsUppercaseLetter&&(e.containsUppercaseLetter||(e.containsUppercaseLetter=s)),this.customStrengthOptions.containsNumericCharacter&&(e.containsNumericCharacter||(e.containsNumericCharacter=i)),this.customStrengthOptions.containsNonAlphanumericCharacter&&(e.containsNonAlphanumericCharacter||(e.containsNonAlphanumericCharacter=r))}}/**
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
 */class dg{constructor(e,t,s,i){this.app=e,this.heartbeatServiceProvider=t,this.appCheckServiceProvider=s,this.config=i,this.currentUser=null,this.emulatorConfig=null,this.operations=Promise.resolve(),this.authStateSubscription=new ac(this),this.idTokenSubscription=new ac(this),this.beforeStateQueue=new og(this),this.redirectUser=null,this.isProactiveRefreshEnabled=!1,this.EXPECTED_PASSWORD_POLICY_SCHEMA_VERSION=1,this._canInitEmulator=!0,this._isInitialized=!1,this._deleted=!1,this._initializationPromise=null,this._popupRedirectResolver=null,this._errorFactory=zd,this._agentRecaptchaConfig=null,this._tenantRecaptchaConfigs={},this._projectPasswordPolicy=null,this._tenantPasswordPolicies={},this.lastNotifiedUid=void 0,this.languageCode=null,this.tenantId=null,this.settings={appVerificationDisabledForTesting:!1},this.frameworks=[],this.name=e.name,this.clientVersion=i.sdkClientVersion}_initializeWithPersistence(e,t){return t&&(this._popupRedirectResolver=qt(t)),this._initializationPromise=this.queue(async()=>{var s,i;if(!this._deleted&&(this.persistenceManager=await cs.create(this,e),!this._deleted)){if(!((s=this._popupRedirectResolver)===null||s===void 0)&&s._shouldInitProactively)try{await this._popupRedirectResolver._initialize(this)}catch{}await this.initializeCurrentUser(t),this.lastNotifiedUid=((i=this.currentUser)===null||i===void 0?void 0:i.uid)||null,!this._deleted&&(this._isInitialized=!0)}}),this._initializationPromise}async _onStorageEvent(){if(this._deleted)return;const e=await this.assertedPersistence.getCurrentUser();if(!(!this.currentUser&&!e)){if(this.currentUser&&e&&this.currentUser.uid===e.uid){this._currentUser._assign(e),await this.currentUser.getIdToken();return}await this._updateCurrentUser(e,!0)}}async initializeCurrentUserFromIdToken(e){try{const t=await Qd(this,{idToken:e}),s=await Gt._fromGetAccountInfoResponse(this,t,e);await this.directlySetCurrentUser(s)}catch(t){console.warn("FirebaseServerApp could not login user with provided authIdToken: ",t),await this.directlySetCurrentUser(null)}}async initializeCurrentUser(e){var t;if(Lt(this.app)){const o=this.app.settings.authIdToken;return o?new Promise(l=>{setTimeout(()=>this.initializeCurrentUserFromIdToken(o).then(l,l))}):this.directlySetCurrentUser(null)}const s=await this.assertedPersistence.getCurrentUser();let i=s,r=!1;if(e&&this.config.authDomain){await this.getOrInitRedirectPersistenceManager();const o=(t=this.redirectUser)===null||t===void 0?void 0:t._redirectEventId,l=i==null?void 0:i._redirectEventId,c=await this.tryRedirectSignIn(e);(!o||o===l)&&(c!=null&&c.user)&&(i=c.user,r=!0)}if(!i)return this.directlySetCurrentUser(null);if(!i._redirectEventId){if(r)try{await this.beforeStateQueue.runMiddleware(i)}catch(o){i=s,this._popupRedirectResolver._overrideRedirectResult(this,()=>Promise.reject(o))}return i?this.reloadAndSetCurrentUserOrClear(i):this.directlySetCurrentUser(null)}return de(this._popupRedirectResolver,this,"argument-error"),await this.getOrInitRedirectPersistenceManager(),this.redirectUser&&this.redirectUser._redirectEventId===i._redirectEventId?this.directlySetCurrentUser(i):this.reloadAndSetCurrentUserOrClear(i)}async tryRedirectSignIn(e){let t=null;try{t=await this._popupRedirectResolver._completeRedirectFn(this,e,!0)}catch{await this._setRedirectUser(null)}return t}async reloadAndSetCurrentUserOrClear(e){try{await cr(e)}catch(t){if((t==null?void 0:t.code)!=="auth/network-request-failed")return this.directlySetCurrentUser(null)}return this.directlySetCurrentUser(e)}useDeviceLanguage(){this.languageCode=jm()}async _delete(){this._deleted=!0}async updateCurrentUser(e){if(Lt(this.app))return Promise.reject(Yt(this));const t=e?$e(e):null;return t&&de(t.auth.config.apiKey===this.config.apiKey,this,"invalid-user-token"),this._updateCurrentUser(t&&t._clone(this))}async _updateCurrentUser(e,t=!1){if(!this._deleted)return e&&de(this.tenantId===e.tenantId,this,"tenant-id-mismatch"),t||await this.beforeStateQueue.runMiddleware(e),this.queue(async()=>{await this.directlySetCurrentUser(e),this.notifyAuthListeners()})}async signOut(){return Lt(this.app)?Promise.reject(Yt(this)):(await this.beforeStateQueue.runMiddleware(null),(this.redirectPersistenceManager||this._popupRedirectResolver)&&await this._setRedirectUser(null),this._updateCurrentUser(null,!0))}setPersistence(e){return Lt(this.app)?Promise.reject(Yt(this)):this.queue(async()=>{await this.assertedPersistence.setPersistence(qt(e))})}_getRecaptchaConfig(){return this.tenantId==null?this._agentRecaptchaConfig:this._tenantRecaptchaConfigs[this.tenantId]}async validatePassword(e){this._getPasswordPolicyInternal()||await this._updatePasswordPolicy();const t=this._getPasswordPolicyInternal();return t.schemaVersion!==this.EXPECTED_PASSWORD_POLICY_SCHEMA_VERSION?Promise.reject(this._errorFactory.create("unsupported-password-policy-schema-version",{})):t.validatePassword(e)}_getPasswordPolicyInternal(){return this.tenantId===null?this._projectPasswordPolicy:this._tenantPasswordPolicies[this.tenantId]}async _updatePasswordPolicy(){const e=await ag(this),t=new cg(e);this.tenantId===null?this._projectPasswordPolicy=t:this._tenantPasswordPolicies[this.tenantId]=t}_getPersistence(){return this.assertedPersistence.persistence.type}_updateErrorMap(e){this._errorFactory=new Ci("auth","Firebase",e())}onAuthStateChanged(e,t,s){return this.registerStateListener(this.authStateSubscription,e,t,s)}beforeAuthStateChanged(e,t){return this.beforeStateQueue.pushCallback(e,t)}onIdTokenChanged(e,t,s){return this.registerStateListener(this.idTokenSubscription,e,t,s)}authStateReady(){return new Promise((e,t)=>{if(this.currentUser)e();else{const s=this.onAuthStateChanged(()=>{s(),e()},t)}})}async revokeAccessToken(e){if(this.currentUser){const t=await this.currentUser.getIdToken(),s={providerId:"apple.com",tokenType:"ACCESS_TOKEN",token:e,idToken:t};this.tenantId!=null&&(s.tenantId=this.tenantId),await sg(this,s)}}toJSON(){var e;return{apiKey:this.config.apiKey,authDomain:this.config.authDomain,appName:this.name,currentUser:(e=this._currentUser)===null||e===void 0?void 0:e.toJSON()}}async _setRedirectUser(e,t){const s=await this.getOrInitRedirectPersistenceManager(t);return e===null?s.removeCurrentUser():s.setCurrentUser(e)}async getOrInitRedirectPersistenceManager(e){if(!this.redirectPersistenceManager){const t=e&&qt(e)||this._popupRedirectResolver;de(t,this,"argument-error"),this.redirectPersistenceManager=await cs.create(this,[qt(t._redirectPersistence)],"redirectUser"),this.redirectUser=await this.redirectPersistenceManager.getCurrentUser()}return this.redirectPersistenceManager}async _redirectUserForId(e){var t,s;return this._isInitialized&&await this.queue(async()=>{}),((t=this._currentUser)===null||t===void 0?void 0:t._redirectEventId)===e?this._currentUser:((s=this.redirectUser)===null||s===void 0?void 0:s._redirectEventId)===e?this.redirectUser:null}async _persistUserIfCurrent(e){if(e===this.currentUser)return this.queue(async()=>this.directlySetCurrentUser(e))}_notifyListenersIfCurrent(e){e===this.currentUser&&this.notifyAuthListeners()}_key(){return`${this.config.authDomain}:${this.config.apiKey}:${this.name}`}_startProactiveRefresh(){this.isProactiveRefreshEnabled=!0,this.currentUser&&this._currentUser._startProactiveRefresh()}_stopProactiveRefresh(){this.isProactiveRefreshEnabled=!1,this.currentUser&&this._currentUser._stopProactiveRefresh()}get _currentUser(){return this.currentUser}notifyAuthListeners(){var e,t;if(!this._isInitialized)return;this.idTokenSubscription.next(this.currentUser);const s=(t=(e=this.currentUser)===null||e===void 0?void 0:e.uid)!==null&&t!==void 0?t:null;this.lastNotifiedUid!==s&&(this.lastNotifiedUid=s,this.authStateSubscription.next(this.currentUser))}registerStateListener(e,t,s,i){if(this._deleted)return()=>{};const r=typeof t=="function"?t:t.next.bind(t);let o=!1;const l=this._isInitialized?Promise.resolve():this._initializationPromise;if(de(l,this,"internal-error"),l.then(()=>{o||r(this.currentUser)}),typeof t=="function"){const c=e.addObserver(t,s,i);return()=>{o=!0,c()}}else{const c=e.addObserver(t);return()=>{o=!0,c()}}}async directlySetCurrentUser(e){this.currentUser&&this.currentUser!==e&&this._currentUser._stopProactiveRefresh(),e&&this.isProactiveRefreshEnabled&&e._startProactiveRefresh(),this.currentUser=e,e?await this.assertedPersistence.setCurrentUser(e):await this.assertedPersistence.removeCurrentUser()}queue(e){return this.operations=this.operations.then(e,e),this.operations}get assertedPersistence(){return de(this.persistenceManager,this,"internal-error"),this.persistenceManager}_logFramework(e){!e||this.frameworks.includes(e)||(this.frameworks.push(e),this.frameworks.sort(),this.clientVersion=au(this.config.clientPlatform,this._getFrameworks()))}_getFrameworks(){return this.frameworks}async _getAdditionalHeaders(){var e;const t={"X-Client-Version":this.clientVersion};this.app.options.appId&&(t["X-Firebase-gmpid"]=this.app.options.appId);const s=await((e=this.heartbeatServiceProvider.getImmediate({optional:!0}))===null||e===void 0?void 0:e.getHeartbeatsHeader());s&&(t["X-Firebase-Client"]=s);const i=await this._getAppCheckToken();return i&&(t["X-Firebase-AppCheck"]=i),t}async _getAppCheckToken(){var e;const t=await((e=this.appCheckServiceProvider.getImmediate({optional:!0}))===null||e===void 0?void 0:e.getToken());return t!=null&&t.error&&Bm(`Error while retrieving App Check token: ${t.error}`),t==null?void 0:t.token}}function Xn(n){return $e(n)}class ac{constructor(e){this.auth=e,this.observer=null,this.addObserver=xp(t=>this.observer=t)}get next(){return de(this.observer,this.auth,"internal-error"),this.observer.next.bind(this.observer)}}/**
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
 */let Mr={async loadJS(){throw new Error("Unable to load external scripts")},recaptchaV2Script:"",recaptchaEnterpriseScript:"",gapiScript:""};function ug(n){Mr=n}function lu(n){return Mr.loadJS(n)}function hg(){return Mr.recaptchaEnterpriseScript}function fg(){return Mr.gapiScript}function pg(n){return`__${n}${Math.floor(Math.random()*1e6)}`}const mg="recaptcha-enterprise",gg="NO_RECAPTCHA";class yg{constructor(e){this.type=mg,this.auth=Xn(e)}async verify(e="verify",t=!1){async function s(r){if(!t){if(r.tenantId==null&&r._agentRecaptchaConfig!=null)return r._agentRecaptchaConfig.siteKey;if(r.tenantId!=null&&r._tenantRecaptchaConfigs[r.tenantId]!==void 0)return r._tenantRecaptchaConfigs[r.tenantId].siteKey}return new Promise(async(o,l)=>{Ym(r,{clientType:"CLIENT_TYPE_WEB",version:"RECAPTCHA_ENTERPRISE"}).then(c=>{if(c.recaptchaKey===void 0)l(new Error("recaptcha Enterprise site key undefined"));else{const d=new Km(c);return r.tenantId==null?r._agentRecaptchaConfig=d:r._tenantRecaptchaConfigs[r.tenantId]=d,o(d.siteKey)}}).catch(c=>{l(c)})})}function i(r,o,l){const c=window.grecaptcha;nc(c)?c.enterprise.ready(()=>{c.enterprise.execute(r,{action:e}).then(d=>{o(d)}).catch(()=>{o(gg)})}):l(Error("No reCAPTCHA enterprise script loaded."))}return new Promise((r,o)=>{s(this.auth).then(l=>{if(!t&&nc(window.grecaptcha))i(l,r,o);else{if(typeof window>"u"){o(new Error("RecaptchaVerifier is only supported in browser"));return}let c=hg();c.length!==0&&(c+=l),lu(c).then(()=>{i(l,r,o)}).catch(d=>{o(d)})}}).catch(l=>{o(l)})})}}async function lc(n,e,t,s=!1){const i=new yg(n);let r;try{r=await i.verify(t)}catch{r=await i.verify(t,!0)}const o=Object.assign({},e);return s?Object.assign(o,{captchaResp:r}):Object.assign(o,{captchaResponse:r}),Object.assign(o,{clientType:"CLIENT_TYPE_WEB"}),Object.assign(o,{recaptchaVersion:"RECAPTCHA_ENTERPRISE"}),o}async function Uo(n,e,t,s){var i;if(!((i=n._getRecaptchaConfig())===null||i===void 0)&&i.isProviderEnabled("EMAIL_PASSWORD_PROVIDER")){const r=await lc(n,e,t,t==="getOobCode");return s(n,r)}else return s(n,e).catch(async r=>{if(r.code==="auth/missing-recaptcha-token"){console.log(`${t} is protected by reCAPTCHA Enterprise for this project. Automatically triggering the reCAPTCHA flow and restarting the flow.`);const o=await lc(n,e,t,t==="getOobCode");return s(n,o)}else return Promise.reject(r)})}/**
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
 */function _g(n,e){const t=ka(n,"auth");if(t.isInitialized()){const i=t.getImmediate(),r=t.getOptions();if(or(r,e??{}))return i;Rt(i,"already-initialized")}return t.initialize({options:e})}function vg(n,e){const t=(e==null?void 0:e.persistence)||[],s=(Array.isArray(t)?t:[t]).map(qt);e!=null&&e.errorMap&&n._updateErrorMap(e.errorMap),n._initializeWithPersistence(s,e==null?void 0:e.popupRedirectResolver)}function bg(n,e,t){const s=Xn(n);de(s._canInitEmulator,s,"emulator-config-failed"),de(/^https?:\/\//.test(e),s,"invalid-emulator-scheme");const i=!1,r=cu(e),{host:o,port:l}=wg(e),c=l===null?"":`:${l}`;s.config.emulator={url:`${r}//${o}${c}/`},s.settings.appVerificationDisabledForTesting=!0,s.emulatorConfig=Object.freeze({host:o,port:l,protocol:r.replace(":",""),options:Object.freeze({disableWarnings:i})}),Cg()}function cu(n){const e=n.indexOf(":");return e<0?"":n.substr(0,e+1)}function wg(n){const e=cu(n),t=/(\/\/)?([^?#/]+)/.exec(n.substr(e.length));if(!t)return{host:"",port:null};const s=t[2].split("@").pop()||"",i=/^(\[[^\]]+\])(:|$)/.exec(s);if(i){const r=i[1];return{host:r,port:cc(s.substr(r.length+1))}}else{const[r,o]=s.split(":");return{host:r,port:cc(o)}}}function cc(n){if(!n)return null;const e=Number(n);return isNaN(e)?null:e}function Cg(){function n(){const e=document.createElement("p"),t=e.style;e.innerText="Running in emulator mode. Do not use with production credentials.",t.position="fixed",t.width="100%",t.backgroundColor="#ffffff",t.border=".1em solid #000000",t.color="#b50000",t.bottom="0px",t.left="0px",t.margin="0px",t.zIndex="10000",t.textAlign="center",e.classList.add("firebase-emulator-warning"),document.body.appendChild(e)}typeof console<"u"&&typeof console.info=="function"&&console.info("WARNING: You are using the Auth Emulator, which is intended for local testing only.  Do not use with production credentials."),typeof window<"u"&&typeof document<"u"&&(document.readyState==="loading"?window.addEventListener("DOMContentLoaded",n):n())}/**
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
 */class Ra{constructor(e,t){this.providerId=e,this.signInMethod=t}toJSON(){return zt("not implemented")}_getIdTokenResponse(e){return zt("not implemented")}_linkToIdToken(e,t){return zt("not implemented")}_getReauthenticationResolver(e){return zt("not implemented")}}async function Eg(n,e){return sn(n,"POST","/v1/accounts:update",e)}async function kg(n,e){return sn(n,"POST","/v1/accounts:signUp",e)}/**
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
 */async function Ig(n,e){return ki(n,"POST","/v1/accounts:signInWithPassword",Rn(n,e))}/**
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
 */async function Sg(n,e){return ki(n,"POST","/v1/accounts:signInWithEmailLink",Rn(n,e))}async function Tg(n,e){return ki(n,"POST","/v1/accounts:signInWithEmailLink",Rn(n,e))}/**
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
 */class ai extends Ra{constructor(e,t,s,i=null){super("password",s),this._email=e,this._password=t,this._tenantId=i}static _fromEmailAndPassword(e,t){return new ai(e,t,"password")}static _fromEmailAndCode(e,t,s=null){return new ai(e,t,"emailLink",s)}toJSON(){return{email:this._email,password:this._password,signInMethod:this.signInMethod,tenantId:this._tenantId}}static fromJSON(e){const t=typeof e=="string"?JSON.parse(e):e;if(t!=null&&t.email&&(t!=null&&t.password)){if(t.signInMethod==="password")return this._fromEmailAndPassword(t.email,t.password);if(t.signInMethod==="emailLink")return this._fromEmailAndCode(t.email,t.password,t.tenantId)}return null}async _getIdTokenResponse(e){switch(this.signInMethod){case"password":const t={returnSecureToken:!0,email:this._email,password:this._password,clientType:"CLIENT_TYPE_WEB"};return Uo(e,t,"signInWithPassword",Ig);case"emailLink":return Sg(e,{email:this._email,oobCode:this._password});default:Rt(e,"internal-error")}}async _linkToIdToken(e,t){switch(this.signInMethod){case"password":const s={idToken:t,returnSecureToken:!0,email:this._email,password:this._password,clientType:"CLIENT_TYPE_WEB"};return Uo(e,s,"signUpPassword",kg);case"emailLink":return Tg(e,{idToken:t,email:this._email,oobCode:this._password});default:Rt(e,"internal-error")}}_getReauthenticationResolver(e){return this._getIdTokenResponse(e)}}/**
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
 */async function ds(n,e){return ki(n,"POST","/v1/accounts:signInWithIdp",Rn(n,e))}/**
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
 */const xg="http://localhost";class qn extends Ra{constructor(){super(...arguments),this.pendingToken=null}static _fromParams(e){const t=new qn(e.providerId,e.signInMethod);return e.idToken||e.accessToken?(e.idToken&&(t.idToken=e.idToken),e.accessToken&&(t.accessToken=e.accessToken),e.nonce&&!e.pendingToken&&(t.nonce=e.nonce),e.pendingToken&&(t.pendingToken=e.pendingToken)):e.oauthToken&&e.oauthTokenSecret?(t.accessToken=e.oauthToken,t.secret=e.oauthTokenSecret):Rt("argument-error"),t}toJSON(){return{idToken:this.idToken,accessToken:this.accessToken,secret:this.secret,nonce:this.nonce,pendingToken:this.pendingToken,providerId:this.providerId,signInMethod:this.signInMethod}}static fromJSON(e){const t=typeof e=="string"?JSON.parse(e):e,{providerId:s,signInMethod:i}=t,r=Ia(t,["providerId","signInMethod"]);if(!s||!i)return null;const o=new qn(s,i);return o.idToken=r.idToken||void 0,o.accessToken=r.accessToken||void 0,o.secret=r.secret,o.nonce=r.nonce,o.pendingToken=r.pendingToken||null,o}_getIdTokenResponse(e){const t=this.buildRequest();return ds(e,t)}_linkToIdToken(e,t){const s=this.buildRequest();return s.idToken=t,ds(e,s)}_getReauthenticationResolver(e){const t=this.buildRequest();return t.autoCreate=!1,ds(e,t)}buildRequest(){const e={requestUri:xg,returnSecureToken:!0};if(this.pendingToken)e.pendingToken=this.pendingToken;else{const t={};this.idToken&&(t.id_token=this.idToken),this.accessToken&&(t.access_token=this.accessToken),this.secret&&(t.oauth_token_secret=this.secret),t.providerId=this.providerId,this.nonce&&!this.pendingToken&&(t.nonce=this.nonce),e.postBody=Ts(t)}return e}}/**
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
 */function Ag(n){switch(n){case"recoverEmail":return"RECOVER_EMAIL";case"resetPassword":return"PASSWORD_RESET";case"signIn":return"EMAIL_SIGNIN";case"verifyEmail":return"VERIFY_EMAIL";case"verifyAndChangeEmail":return"VERIFY_AND_CHANGE_EMAIL";case"revertSecondFactorAddition":return"REVERT_SECOND_FACTOR_ADDITION";default:return null}}function Rg(n){const e=js(Vs(n)).link,t=e?js(Vs(e)).deep_link_id:null,s=js(Vs(n)).deep_link_id;return(s?js(Vs(s)).link:null)||s||t||e||n}class Pa{constructor(e){var t,s,i,r,o,l;const c=js(Vs(e)),d=(t=c.apiKey)!==null&&t!==void 0?t:null,h=(s=c.oobCode)!==null&&s!==void 0?s:null,u=Ag((i=c.mode)!==null&&i!==void 0?i:null);de(d&&h&&u,"argument-error"),this.apiKey=d,this.operation=u,this.code=h,this.continueUrl=(r=c.continueUrl)!==null&&r!==void 0?r:null,this.languageCode=(o=c.languageCode)!==null&&o!==void 0?o:null,this.tenantId=(l=c.tenantId)!==null&&l!==void 0?l:null}static parseLink(e){const t=Rg(e);try{return new Pa(t)}catch{return null}}}/**
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
 */class Zn{constructor(){this.providerId=Zn.PROVIDER_ID}static credential(e,t){return ai._fromEmailAndPassword(e,t)}static credentialWithLink(e,t){const s=Pa.parseLink(t);return de(s,"argument-error"),ai._fromEmailAndCode(e,s.code,s.tenantId)}}Zn.PROVIDER_ID="password";Zn.EMAIL_PASSWORD_SIGN_IN_METHOD="password";Zn.EMAIL_LINK_SIGN_IN_METHOD="emailLink";/**
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
 */class du{constructor(e){this.providerId=e,this.defaultLanguageCode=null,this.customParameters={}}setDefaultLanguage(e){this.defaultLanguageCode=e}setCustomParameters(e){return this.customParameters=e,this}getCustomParameters(){return this.customParameters}}/**
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
 */class Ii extends du{constructor(){super(...arguments),this.scopes=[]}addScope(e){return this.scopes.includes(e)||this.scopes.push(e),this}getScopes(){return[...this.scopes]}}/**
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
 */class dn extends Ii{constructor(){super("facebook.com")}static credential(e){return qn._fromParams({providerId:dn.PROVIDER_ID,signInMethod:dn.FACEBOOK_SIGN_IN_METHOD,accessToken:e})}static credentialFromResult(e){return dn.credentialFromTaggedObject(e)}static credentialFromError(e){return dn.credentialFromTaggedObject(e.customData||{})}static credentialFromTaggedObject({_tokenResponse:e}){if(!e||!("oauthAccessToken"in e)||!e.oauthAccessToken)return null;try{return dn.credential(e.oauthAccessToken)}catch{return null}}}dn.FACEBOOK_SIGN_IN_METHOD="facebook.com";dn.PROVIDER_ID="facebook.com";/**
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
 */class un extends Ii{constructor(){super("google.com"),this.addScope("profile")}static credential(e,t){return qn._fromParams({providerId:un.PROVIDER_ID,signInMethod:un.GOOGLE_SIGN_IN_METHOD,idToken:e,accessToken:t})}static credentialFromResult(e){return un.credentialFromTaggedObject(e)}static credentialFromError(e){return un.credentialFromTaggedObject(e.customData||{})}static credentialFromTaggedObject({_tokenResponse:e}){if(!e)return null;const{oauthIdToken:t,oauthAccessToken:s}=e;if(!t&&!s)return null;try{return un.credential(t,s)}catch{return null}}}un.GOOGLE_SIGN_IN_METHOD="google.com";un.PROVIDER_ID="google.com";/**
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
 */class hn extends Ii{constructor(){super("github.com")}static credential(e){return qn._fromParams({providerId:hn.PROVIDER_ID,signInMethod:hn.GITHUB_SIGN_IN_METHOD,accessToken:e})}static credentialFromResult(e){return hn.credentialFromTaggedObject(e)}static credentialFromError(e){return hn.credentialFromTaggedObject(e.customData||{})}static credentialFromTaggedObject({_tokenResponse:e}){if(!e||!("oauthAccessToken"in e)||!e.oauthAccessToken)return null;try{return hn.credential(e.oauthAccessToken)}catch{return null}}}hn.GITHUB_SIGN_IN_METHOD="github.com";hn.PROVIDER_ID="github.com";/**
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
 */class fn extends Ii{constructor(){super("twitter.com")}static credential(e,t){return qn._fromParams({providerId:fn.PROVIDER_ID,signInMethod:fn.TWITTER_SIGN_IN_METHOD,oauthToken:e,oauthTokenSecret:t})}static credentialFromResult(e){return fn.credentialFromTaggedObject(e)}static credentialFromError(e){return fn.credentialFromTaggedObject(e.customData||{})}static credentialFromTaggedObject({_tokenResponse:e}){if(!e)return null;const{oauthAccessToken:t,oauthTokenSecret:s}=e;if(!t||!s)return null;try{return fn.credential(t,s)}catch{return null}}}fn.TWITTER_SIGN_IN_METHOD="twitter.com";fn.PROVIDER_ID="twitter.com";/**
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
 */async function Pg(n,e){return ki(n,"POST","/v1/accounts:signUp",Rn(n,e))}/**
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
 */class Kn{constructor(e){this.user=e.user,this.providerId=e.providerId,this._tokenResponse=e._tokenResponse,this.operationType=e.operationType}static async _fromIdTokenResponse(e,t,s,i=!1){const r=await Gt._fromIdTokenResponse(e,s,i),o=dc(s);return new Kn({user:r,providerId:o,_tokenResponse:s,operationType:t})}static async _forOperation(e,t,s){await e._updateTokensIfNecessary(s,!0);const i=dc(s);return new Kn({user:e,providerId:i,_tokenResponse:s,operationType:t})}}function dc(n){return n.providerId?n.providerId:"phoneNumber"in n?"phone":null}/**
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
 */class dr extends An{constructor(e,t,s,i){var r;super(t.code,t.message),this.operationType=s,this.user=i,Object.setPrototypeOf(this,dr.prototype),this.customData={appName:e.name,tenantId:(r=e.tenantId)!==null&&r!==void 0?r:void 0,_serverResponse:t.customData._serverResponse,operationType:s}}static _fromErrorAndOperation(e,t,s,i){return new dr(e,t,s,i)}}function uu(n,e,t,s){return(e==="reauthenticate"?t._getReauthenticationResolver(n):t._getIdTokenResponse(n)).catch(r=>{throw r.code==="auth/multi-factor-auth-required"?dr._fromErrorAndOperation(n,r,e,s):r})}async function Ng(n,e,t=!1){const s=await ys(n,e._linkToIdToken(n.auth,await n.getIdToken()),t);return Kn._forOperation(n,"link",s)}/**
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
 */async function hu(n,e,t=!1){const{auth:s}=n;if(Lt(s.app))return Promise.reject(Yt(s));const i="reauthenticate";try{const r=await ys(n,uu(s,i,e,n),t);de(r.idToken,s,"internal-error");const o=xa(r.idToken);de(o,s,"internal-error");const{sub:l}=o;return de(n.uid===l,s,"user-mismatch"),Kn._forOperation(n,i,r)}catch(r){throw(r==null?void 0:r.code)==="auth/user-not-found"&&Rt(s,"user-mismatch"),r}}/**
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
 */async function fu(n,e,t=!1){if(Lt(n.app))return Promise.reject(Yt(n));const s="signIn",i=await uu(n,s,e),r=await Kn._fromIdTokenResponse(n,s,i);return t||await n._updateCurrentUser(r.user),r}async function Og(n,e){return fu(Xn(n),e)}async function Mg(n,e){return hu($e(n),e)}/**
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
 */async function pu(n){const e=Xn(n);e._getPasswordPolicyInternal()&&await e._updatePasswordPolicy()}async function Dg(n,e,t){if(Lt(n.app))return Promise.reject(Yt(n));const s=Xn(n),o=await Uo(s,{returnSecureToken:!0,email:e,password:t,clientType:"CLIENT_TYPE_WEB"},"signUpPassword",Pg).catch(c=>{throw c.code==="auth/password-does-not-meet-requirements"&&pu(n),c}),l=await Kn._fromIdTokenResponse(s,"signIn",o);return await s._updateCurrentUser(l.user),l}function Lg(n,e,t){return Lt(n.app)?Promise.reject(Yt(n)):Og($e(n),Zn.credential(e,t)).catch(async s=>{throw s.code==="auth/password-does-not-meet-requirements"&&pu(n),s})}function $g(n,e){return Fg($e(n),null,e)}async function Fg(n,e,t){const{auth:s}=n,r={idToken:await n.getIdToken(),returnSecureToken:!0};t&&(r.password=t);const o=await ys(n,Eg(s,r));await n._updateTokensIfNecessary(o,!0)}function Ug(n,e,t,s){return $e(n).onIdTokenChanged(e,t,s)}function Bg(n,e,t){return $e(n).beforeAuthStateChanged(e,t)}function Wg(n,e,t,s){return $e(n).onAuthStateChanged(e,t,s)}function Hg(n){return $e(n).signOut()}async function jg(n){return $e(n).delete()}const ur="__sak";/**
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
 */class mu{constructor(e,t){this.storageRetriever=e,this.type=t}_isAvailable(){try{return this.storage?(this.storage.setItem(ur,"1"),this.storage.removeItem(ur),Promise.resolve(!0)):Promise.resolve(!1)}catch{return Promise.resolve(!1)}}_set(e,t){return this.storage.setItem(e,JSON.stringify(t)),Promise.resolve()}_get(e){const t=this.storage.getItem(e);return Promise.resolve(t?JSON.parse(t):null)}_remove(e){return this.storage.removeItem(e),Promise.resolve()}get storage(){return this.storageRetriever()}}/**
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
 */const Vg=1e3,zg=10;class gu extends mu{constructor(){super(()=>window.localStorage,"LOCAL"),this.boundEventHandler=(e,t)=>this.onStorageEvent(e,t),this.listeners={},this.localCache={},this.pollTimer=null,this.fallbackToPolling=ou(),this._shouldAllowMigration=!0}forAllChangedKeys(e){for(const t of Object.keys(this.listeners)){const s=this.storage.getItem(t),i=this.localCache[t];s!==i&&e(t,i,s)}}onStorageEvent(e,t=!1){if(!e.key){this.forAllChangedKeys((o,l,c)=>{this.notifyListeners(o,c)});return}const s=e.key;t?this.detachListener():this.stopPolling();const i=()=>{const o=this.storage.getItem(s);!t&&this.localCache[s]===o||this.notifyListeners(s,o)},r=this.storage.getItem(s);rg()&&r!==e.newValue&&e.newValue!==e.oldValue?setTimeout(i,zg):i()}notifyListeners(e,t){this.localCache[e]=t;const s=this.listeners[e];if(s)for(const i of Array.from(s))i(t&&JSON.parse(t))}startPolling(){this.stopPolling(),this.pollTimer=setInterval(()=>{this.forAllChangedKeys((e,t,s)=>{this.onStorageEvent(new StorageEvent("storage",{key:e,oldValue:t,newValue:s}),!0)})},Vg)}stopPolling(){this.pollTimer&&(clearInterval(this.pollTimer),this.pollTimer=null)}attachListener(){window.addEventListener("storage",this.boundEventHandler)}detachListener(){window.removeEventListener("storage",this.boundEventHandler)}_addListener(e,t){Object.keys(this.listeners).length===0&&(this.fallbackToPolling?this.startPolling():this.attachListener()),this.listeners[e]||(this.listeners[e]=new Set,this.localCache[e]=this.storage.getItem(e)),this.listeners[e].add(t)}_removeListener(e,t){this.listeners[e]&&(this.listeners[e].delete(t),this.listeners[e].size===0&&delete this.listeners[e]),Object.keys(this.listeners).length===0&&(this.detachListener(),this.stopPolling())}async _set(e,t){await super._set(e,t),this.localCache[e]=JSON.stringify(t)}async _get(e){const t=await super._get(e);return this.localCache[e]=JSON.stringify(t),t}async _remove(e){await super._remove(e),delete this.localCache[e]}}gu.type="LOCAL";const Gg=gu;/**
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
 */class yu extends mu{constructor(){super(()=>window.sessionStorage,"SESSION")}_addListener(e,t){}_removeListener(e,t){}}yu.type="SESSION";const _u=yu;/**
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
 */function qg(n){return Promise.all(n.map(async e=>{try{return{fulfilled:!0,value:await e}}catch(t){return{fulfilled:!1,reason:t}}}))}/**
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
 */class Dr{constructor(e){this.eventTarget=e,this.handlersMap={},this.boundEventHandler=this.handleEvent.bind(this)}static _getInstance(e){const t=this.receivers.find(i=>i.isListeningto(e));if(t)return t;const s=new Dr(e);return this.receivers.push(s),s}isListeningto(e){return this.eventTarget===e}async handleEvent(e){const t=e,{eventId:s,eventType:i,data:r}=t.data,o=this.handlersMap[i];if(!(o!=null&&o.size))return;t.ports[0].postMessage({status:"ack",eventId:s,eventType:i});const l=Array.from(o).map(async d=>d(t.origin,r)),c=await qg(l);t.ports[0].postMessage({status:"done",eventId:s,eventType:i,response:c})}_subscribe(e,t){Object.keys(this.handlersMap).length===0&&this.eventTarget.addEventListener("message",this.boundEventHandler),this.handlersMap[e]||(this.handlersMap[e]=new Set),this.handlersMap[e].add(t)}_unsubscribe(e,t){this.handlersMap[e]&&t&&this.handlersMap[e].delete(t),(!t||this.handlersMap[e].size===0)&&delete this.handlersMap[e],Object.keys(this.handlersMap).length===0&&this.eventTarget.removeEventListener("message",this.boundEventHandler)}}Dr.receivers=[];/**
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
 */function Na(n="",e=10){let t="";for(let s=0;s<e;s++)t+=Math.floor(Math.random()*10);return n+t}/**
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
 */class Kg{constructor(e){this.target=e,this.handlers=new Set}removeMessageHandler(e){e.messageChannel&&(e.messageChannel.port1.removeEventListener("message",e.onMessage),e.messageChannel.port1.close()),this.handlers.delete(e)}async _send(e,t,s=50){const i=typeof MessageChannel<"u"?new MessageChannel:null;if(!i)throw new Error("connection_unavailable");let r,o;return new Promise((l,c)=>{const d=Na("",20);i.port1.start();const h=setTimeout(()=>{c(new Error("unsupported_event"))},s);o={messageChannel:i,onMessage(u){const m=u;if(m.data.eventId===d)switch(m.data.status){case"ack":clearTimeout(h),r=setTimeout(()=>{c(new Error("timeout"))},3e3);break;case"done":clearTimeout(r),l(m.data.response);break;default:clearTimeout(h),clearTimeout(r),c(new Error("invalid_response"));break}}},this.handlers.add(o),i.port1.addEventListener("message",o.onMessage),this.target.postMessage({eventType:e,eventId:d,data:t},[i.port2])}).finally(()=>{o&&this.removeMessageHandler(o)})}}/**
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
 */function Ut(){return window}function Yg(n){Ut().location.href=n}/**
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
 */function vu(){return typeof Ut().WorkerGlobalScope<"u"&&typeof Ut().importScripts=="function"}async function Qg(){if(!(navigator!=null&&navigator.serviceWorker))return null;try{return(await navigator.serviceWorker.ready).active}catch{return null}}function Jg(){var n;return((n=navigator==null?void 0:navigator.serviceWorker)===null||n===void 0?void 0:n.controller)||null}function Xg(){return vu()?self:null}/**
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
 */const bu="firebaseLocalStorageDb",Zg=1,hr="firebaseLocalStorage",wu="fbase_key";class Si{constructor(e){this.request=e}toPromise(){return new Promise((e,t)=>{this.request.addEventListener("success",()=>{e(this.request.result)}),this.request.addEventListener("error",()=>{t(this.request.error)})})}}function Lr(n,e){return n.transaction([hr],e?"readwrite":"readonly").objectStore(hr)}function ey(){const n=indexedDB.deleteDatabase(bu);return new Si(n).toPromise()}function Bo(){const n=indexedDB.open(bu,Zg);return new Promise((e,t)=>{n.addEventListener("error",()=>{t(n.error)}),n.addEventListener("upgradeneeded",()=>{const s=n.result;try{s.createObjectStore(hr,{keyPath:wu})}catch(i){t(i)}}),n.addEventListener("success",async()=>{const s=n.result;s.objectStoreNames.contains(hr)?e(s):(s.close(),await ey(),e(await Bo()))})})}async function uc(n,e,t){const s=Lr(n,!0).put({[wu]:e,value:t});return new Si(s).toPromise()}async function ty(n,e){const t=Lr(n,!1).get(e),s=await new Si(t).toPromise();return s===void 0?null:s.value}function hc(n,e){const t=Lr(n,!0).delete(e);return new Si(t).toPromise()}const ny=800,sy=3;class Cu{constructor(){this.type="LOCAL",this._shouldAllowMigration=!0,this.listeners={},this.localCache={},this.pollTimer=null,this.pendingWrites=0,this.receiver=null,this.sender=null,this.serviceWorkerReceiverAvailable=!1,this.activeServiceWorker=null,this._workerInitializationPromise=this.initializeServiceWorkerMessaging().then(()=>{},()=>{})}async _openDb(){return this.db?this.db:(this.db=await Bo(),this.db)}async _withRetries(e){let t=0;for(;;)try{const s=await this._openDb();return await e(s)}catch(s){if(t++>sy)throw s;this.db&&(this.db.close(),this.db=void 0)}}async initializeServiceWorkerMessaging(){return vu()?this.initializeReceiver():this.initializeSender()}async initializeReceiver(){this.receiver=Dr._getInstance(Xg()),this.receiver._subscribe("keyChanged",async(e,t)=>({keyProcessed:(await this._poll()).includes(t.key)})),this.receiver._subscribe("ping",async(e,t)=>["keyChanged"])}async initializeSender(){var e,t;if(this.activeServiceWorker=await Qg(),!this.activeServiceWorker)return;this.sender=new Kg(this.activeServiceWorker);const s=await this.sender._send("ping",{},800);s&&!((e=s[0])===null||e===void 0)&&e.fulfilled&&!((t=s[0])===null||t===void 0)&&t.value.includes("keyChanged")&&(this.serviceWorkerReceiverAvailable=!0)}async notifyServiceWorker(e){if(!(!this.sender||!this.activeServiceWorker||Jg()!==this.activeServiceWorker))try{await this.sender._send("keyChanged",{key:e},this.serviceWorkerReceiverAvailable?800:50)}catch{}}async _isAvailable(){try{if(!indexedDB)return!1;const e=await Bo();return await uc(e,ur,"1"),await hc(e,ur),!0}catch{}return!1}async _withPendingWrite(e){this.pendingWrites++;try{await e()}finally{this.pendingWrites--}}async _set(e,t){return this._withPendingWrite(async()=>(await this._withRetries(s=>uc(s,e,t)),this.localCache[e]=t,this.notifyServiceWorker(e)))}async _get(e){const t=await this._withRetries(s=>ty(s,e));return this.localCache[e]=t,t}async _remove(e){return this._withPendingWrite(async()=>(await this._withRetries(t=>hc(t,e)),delete this.localCache[e],this.notifyServiceWorker(e)))}async _poll(){const e=await this._withRetries(i=>{const r=Lr(i,!1).getAll();return new Si(r).toPromise()});if(!e)return[];if(this.pendingWrites!==0)return[];const t=[],s=new Set;if(e.length!==0)for(const{fbase_key:i,value:r}of e)s.add(i),JSON.stringify(this.localCache[i])!==JSON.stringify(r)&&(this.notifyListeners(i,r),t.push(i));for(const i of Object.keys(this.localCache))this.localCache[i]&&!s.has(i)&&(this.notifyListeners(i,null),t.push(i));return t}notifyListeners(e,t){this.localCache[e]=t;const s=this.listeners[e];if(s)for(const i of Array.from(s))i(t)}startPolling(){this.stopPolling(),this.pollTimer=setInterval(async()=>this._poll(),ny)}stopPolling(){this.pollTimer&&(clearInterval(this.pollTimer),this.pollTimer=null)}_addListener(e,t){Object.keys(this.listeners).length===0&&this.startPolling(),this.listeners[e]||(this.listeners[e]=new Set,this._get(e)),this.listeners[e].add(t)}_removeListener(e,t){this.listeners[e]&&(this.listeners[e].delete(t),this.listeners[e].size===0&&delete this.listeners[e]),Object.keys(this.listeners).length===0&&this.stopPolling()}}Cu.type="LOCAL";const iy=Cu;new Ei(3e4,6e4);/**
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
 */function ry(n,e){return e?qt(e):(de(n._popupRedirectResolver,n,"argument-error"),n._popupRedirectResolver)}/**
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
 */class Oa extends Ra{constructor(e){super("custom","custom"),this.params=e}_getIdTokenResponse(e){return ds(e,this._buildIdpRequest())}_linkToIdToken(e,t){return ds(e,this._buildIdpRequest(t))}_getReauthenticationResolver(e){return ds(e,this._buildIdpRequest())}_buildIdpRequest(e){const t={requestUri:this.params.requestUri,sessionId:this.params.sessionId,postBody:this.params.postBody,tenantId:this.params.tenantId,pendingToken:this.params.pendingToken,returnSecureToken:!0,returnIdpCredential:!0};return e&&(t.idToken=e),t}}function oy(n){return fu(n.auth,new Oa(n),n.bypassAuthState)}function ay(n){const{auth:e,user:t}=n;return de(t,e,"internal-error"),hu(t,new Oa(n),n.bypassAuthState)}async function ly(n){const{auth:e,user:t}=n;return de(t,e,"internal-error"),Ng(t,new Oa(n),n.bypassAuthState)}/**
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
 */class Eu{constructor(e,t,s,i,r=!1){this.auth=e,this.resolver=s,this.user=i,this.bypassAuthState=r,this.pendingPromise=null,this.eventManager=null,this.filter=Array.isArray(t)?t:[t]}execute(){return new Promise(async(e,t)=>{this.pendingPromise={resolve:e,reject:t};try{this.eventManager=await this.resolver._initialize(this.auth),await this.onExecution(),this.eventManager.registerConsumer(this)}catch(s){this.reject(s)}})}async onAuthEvent(e){const{urlResponse:t,sessionId:s,postBody:i,tenantId:r,error:o,type:l}=e;if(o){this.reject(o);return}const c={auth:this.auth,requestUri:t,sessionId:s,tenantId:r||void 0,postBody:i||void 0,user:this.user,bypassAuthState:this.bypassAuthState};try{this.resolve(await this.getIdpTask(l)(c))}catch(d){this.reject(d)}}onError(e){this.reject(e)}getIdpTask(e){switch(e){case"signInViaPopup":case"signInViaRedirect":return oy;case"linkViaPopup":case"linkViaRedirect":return ly;case"reauthViaPopup":case"reauthViaRedirect":return ay;default:Rt(this.auth,"internal-error")}}resolve(e){Zt(this.pendingPromise,"Pending promise was never set"),this.pendingPromise.resolve(e),this.unregisterAndCleanUp()}reject(e){Zt(this.pendingPromise,"Pending promise was never set"),this.pendingPromise.reject(e),this.unregisterAndCleanUp()}unregisterAndCleanUp(){this.eventManager&&this.eventManager.unregisterConsumer(this),this.pendingPromise=null,this.cleanUp()}}/**
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
 */const cy=new Ei(2e3,1e4);class rs extends Eu{constructor(e,t,s,i,r){super(e,t,i,r),this.provider=s,this.authWindow=null,this.pollId=null,rs.currentPopupAction&&rs.currentPopupAction.cancel(),rs.currentPopupAction=this}async executeNotNull(){const e=await this.execute();return de(e,this.auth,"internal-error"),e}async onExecution(){Zt(this.filter.length===1,"Popup operations only handle one event");const e=Na();this.authWindow=await this.resolver._openPopup(this.auth,this.provider,this.filter[0],e),this.authWindow.associatedEvent=e,this.resolver._originValidation(this.auth).catch(t=>{this.reject(t)}),this.resolver._isIframeWebStorageSupported(this.auth,t=>{t||this.reject(Ft(this.auth,"web-storage-unsupported"))}),this.pollUserCancellation()}get eventId(){var e;return((e=this.authWindow)===null||e===void 0?void 0:e.associatedEvent)||null}cancel(){this.reject(Ft(this.auth,"cancelled-popup-request"))}cleanUp(){this.authWindow&&this.authWindow.close(),this.pollId&&window.clearTimeout(this.pollId),this.authWindow=null,this.pollId=null,rs.currentPopupAction=null}pollUserCancellation(){const e=()=>{var t,s;if(!((s=(t=this.authWindow)===null||t===void 0?void 0:t.window)===null||s===void 0)&&s.closed){this.pollId=window.setTimeout(()=>{this.pollId=null,this.reject(Ft(this.auth,"popup-closed-by-user"))},8e3);return}this.pollId=window.setTimeout(e,cy.get())};e()}}rs.currentPopupAction=null;/**
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
 */const dy="pendingRedirect",Ji=new Map;class uy extends Eu{constructor(e,t,s=!1){super(e,["signInViaRedirect","linkViaRedirect","reauthViaRedirect","unknown"],t,void 0,s),this.eventId=null}async execute(){let e=Ji.get(this.auth._key());if(!e){try{const s=await hy(this.resolver,this.auth)?await super.execute():null;e=()=>Promise.resolve(s)}catch(t){e=()=>Promise.reject(t)}Ji.set(this.auth._key(),e)}return this.bypassAuthState||Ji.set(this.auth._key(),()=>Promise.resolve(null)),e()}async onAuthEvent(e){if(e.type==="signInViaRedirect")return super.onAuthEvent(e);if(e.type==="unknown"){this.resolve(null);return}if(e.eventId){const t=await this.auth._redirectUserForId(e.eventId);if(t)return this.user=t,super.onAuthEvent(e);this.resolve(null)}}async onExecution(){}cleanUp(){}}async function hy(n,e){const t=my(e),s=py(n);if(!await s._isAvailable())return!1;const i=await s._get(t)==="true";return await s._remove(t),i}function fy(n,e){Ji.set(n._key(),e)}function py(n){return qt(n._redirectPersistence)}function my(n){return Qi(dy,n.config.apiKey,n.name)}async function gy(n,e,t=!1){if(Lt(n.app))return Promise.reject(Yt(n));const s=Xn(n),i=ry(s,e),o=await new uy(s,i,t).execute();return o&&!t&&(delete o.user._redirectEventId,await s._persistUserIfCurrent(o.user),await s._setRedirectUser(null,e)),o}/**
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
 */const yy=10*60*1e3;class _y{constructor(e){this.auth=e,this.cachedEventUids=new Set,this.consumers=new Set,this.queuedRedirectEvent=null,this.hasHandledPotentialRedirect=!1,this.lastProcessedEventTime=Date.now()}registerConsumer(e){this.consumers.add(e),this.queuedRedirectEvent&&this.isEventForConsumer(this.queuedRedirectEvent,e)&&(this.sendToConsumer(this.queuedRedirectEvent,e),this.saveEventToCache(this.queuedRedirectEvent),this.queuedRedirectEvent=null)}unregisterConsumer(e){this.consumers.delete(e)}onEvent(e){if(this.hasEventBeenHandled(e))return!1;let t=!1;return this.consumers.forEach(s=>{this.isEventForConsumer(e,s)&&(t=!0,this.sendToConsumer(e,s),this.saveEventToCache(e))}),this.hasHandledPotentialRedirect||!vy(e)||(this.hasHandledPotentialRedirect=!0,t||(this.queuedRedirectEvent=e,t=!0)),t}sendToConsumer(e,t){var s;if(e.error&&!ku(e)){const i=((s=e.error.code)===null||s===void 0?void 0:s.split("auth/")[1])||"internal-error";t.onError(Ft(this.auth,i))}else t.onAuthEvent(e)}isEventForConsumer(e,t){const s=t.eventId===null||!!e.eventId&&e.eventId===t.eventId;return t.filter.includes(e.type)&&s}hasEventBeenHandled(e){return Date.now()-this.lastProcessedEventTime>=yy&&this.cachedEventUids.clear(),this.cachedEventUids.has(fc(e))}saveEventToCache(e){this.cachedEventUids.add(fc(e)),this.lastProcessedEventTime=Date.now()}}function fc(n){return[n.type,n.eventId,n.sessionId,n.tenantId].filter(e=>e).join("-")}function ku({type:n,error:e}){return n==="unknown"&&(e==null?void 0:e.code)==="auth/no-auth-event"}function vy(n){switch(n.type){case"signInViaRedirect":case"linkViaRedirect":case"reauthViaRedirect":return!0;case"unknown":return ku(n);default:return!1}}/**
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
 */async function by(n,e={}){return sn(n,"GET","/v1/projects",e)}/**
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
 */const wy=/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/,Cy=/^https?/;async function Ey(n){if(n.config.emulator)return;const{authorizedDomains:e}=await by(n);for(const t of e)try{if(ky(t))return}catch{}Rt(n,"unauthorized-domain")}function ky(n){const e=$o(),{protocol:t,hostname:s}=new URL(e);if(n.startsWith("chrome-extension://")){const o=new URL(n);return o.hostname===""&&s===""?t==="chrome-extension:"&&n.replace("chrome-extension://","")===e.replace("chrome-extension://",""):t==="chrome-extension:"&&o.hostname===s}if(!Cy.test(t))return!1;if(wy.test(n))return s===n;const i=n.replace(/\./g,"\\.");return new RegExp("^(.+\\."+i+"|"+i+")$","i").test(s)}/**
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
 */const Iy=new Ei(3e4,6e4);function pc(){const n=Ut().___jsl;if(n!=null&&n.H){for(const e of Object.keys(n.H))if(n.H[e].r=n.H[e].r||[],n.H[e].L=n.H[e].L||[],n.H[e].r=[...n.H[e].L],n.CP)for(let t=0;t<n.CP.length;t++)n.CP[t]=null}}function Sy(n){return new Promise((e,t)=>{var s,i,r;function o(){pc(),gapi.load("gapi.iframes",{callback:()=>{e(gapi.iframes.getContext())},ontimeout:()=>{pc(),t(Ft(n,"network-request-failed"))},timeout:Iy.get()})}if(!((i=(s=Ut().gapi)===null||s===void 0?void 0:s.iframes)===null||i===void 0)&&i.Iframe)e(gapi.iframes.getContext());else if(!((r=Ut().gapi)===null||r===void 0)&&r.load)o();else{const l=pg("iframefcb");return Ut()[l]=()=>{gapi.load?o():t(Ft(n,"network-request-failed"))},lu(`${fg()}?onload=${l}`).catch(c=>t(c))}}).catch(e=>{throw Xi=null,e})}let Xi=null;function Ty(n){return Xi=Xi||Sy(n),Xi}/**
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
 */const xy=new Ei(5e3,15e3),Ay="__/auth/iframe",Ry="emulator/auth/iframe",Py={style:{position:"absolute",top:"-100px",width:"1px",height:"1px"},"aria-hidden":"true",tabindex:"-1"},Ny=new Map([["identitytoolkit.googleapis.com","p"],["staging-identitytoolkit.sandbox.googleapis.com","s"],["test-identitytoolkit.sandbox.googleapis.com","t"]]);function Oy(n){const e=n.config;de(e.authDomain,n,"auth-domain-config-required");const t=e.emulator?Ta(e,Ry):`https://${n.config.authDomain}/${Ay}`,s={apiKey:e.apiKey,appName:n.name,v:xs},i=Ny.get(n.config.apiHost);i&&(s.eid=i);const r=n._getFrameworks();return r.length&&(s.fw=r.join(",")),`${t}?${Ts(s).slice(1)}`}async function My(n){const e=await Ty(n),t=Ut().gapi;return de(t,n,"internal-error"),e.open({where:document.body,url:Oy(n),messageHandlersFilter:t.iframes.CROSS_ORIGIN_IFRAMES_FILTER,attributes:Py,dontclear:!0},s=>new Promise(async(i,r)=>{await s.restyle({setHideOnLeave:!1});const o=Ft(n,"network-request-failed"),l=Ut().setTimeout(()=>{r(o)},xy.get());function c(){Ut().clearTimeout(l),i(s)}s.ping(c).then(c,()=>{r(o)})}))}/**
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
 */const Dy={location:"yes",resizable:"yes",statusbar:"yes",toolbar:"no"},Ly=500,$y=600,Fy="_blank",Uy="http://localhost";class mc{constructor(e){this.window=e,this.associatedEvent=null}close(){if(this.window)try{this.window.close()}catch{}}}function By(n,e,t,s=Ly,i=$y){const r=Math.max((window.screen.availHeight-i)/2,0).toString(),o=Math.max((window.screen.availWidth-s)/2,0).toString();let l="";const c=Object.assign(Object.assign({},Dy),{width:s.toString(),height:i.toString(),top:r,left:o}),d=it().toLowerCase();t&&(l=tu(d)?Fy:t),Zd(d)&&(e=e||Uy,c.scrollbars="yes");const h=Object.entries(c).reduce((m,[f,y])=>`${m}${f}=${y},`,"");if(ig(d)&&l!=="_self")return Wy(e||"",l),new mc(null);const u=window.open(e||"",l,h);de(u,n,"popup-blocked");try{u.focus()}catch{}return new mc(u)}function Wy(n,e){const t=document.createElement("a");t.href=n,t.target=e;const s=document.createEvent("MouseEvent");s.initMouseEvent("click",!0,!0,window,1,0,0,0,0,!1,!1,!1,!1,1,null),t.dispatchEvent(s)}/**
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
 */const Hy="__/auth/handler",jy="emulator/auth/handler",Vy=encodeURIComponent("fac");async function gc(n,e,t,s,i,r){de(n.config.authDomain,n,"auth-domain-config-required"),de(n.config.apiKey,n,"invalid-api-key");const o={apiKey:n.config.apiKey,appName:n.name,authType:t,redirectUrl:s,v:xs,eventId:i};if(e instanceof du){e.setDefaultLanguage(n.languageCode),o.providerId=e.providerId||"",ir(e.getCustomParameters())||(o.customParameters=JSON.stringify(e.getCustomParameters()));for(const[h,u]of Object.entries({}))o[h]=u}if(e instanceof Ii){const h=e.getScopes().filter(u=>u!=="");h.length>0&&(o.scopes=h.join(","))}n.tenantId&&(o.tid=n.tenantId);const l=o;for(const h of Object.keys(l))l[h]===void 0&&delete l[h];const c=await n._getAppCheckToken(),d=c?`#${Vy}=${encodeURIComponent(c)}`:"";return`${zy(n)}?${Ts(l).slice(1)}${d}`}function zy({config:n}){return n.emulator?Ta(n,jy):`https://${n.authDomain}/${Hy}`}/**
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
 */const go="webStorageSupport";class Gy{constructor(){this.eventManagers={},this.iframes={},this.originValidationPromises={},this._redirectPersistence=_u,this._completeRedirectFn=gy,this._overrideRedirectResult=fy}async _openPopup(e,t,s,i){var r;Zt((r=this.eventManagers[e._key()])===null||r===void 0?void 0:r.manager,"_initialize() not called before _openPopup()");const o=await gc(e,t,s,$o(),i);return By(e,o,Na())}async _openRedirect(e,t,s,i){await this._originValidation(e);const r=await gc(e,t,s,$o(),i);return Yg(r),new Promise(()=>{})}_initialize(e){const t=e._key();if(this.eventManagers[t]){const{manager:i,promise:r}=this.eventManagers[t];return i?Promise.resolve(i):(Zt(r,"If manager is not set, promise should be"),r)}const s=this.initAndGetManager(e);return this.eventManagers[t]={promise:s},s.catch(()=>{delete this.eventManagers[t]}),s}async initAndGetManager(e){const t=await My(e),s=new _y(e);return t.register("authEvent",i=>(de(i==null?void 0:i.authEvent,e,"invalid-auth-event"),{status:s.onEvent(i.authEvent)?"ACK":"ERROR"}),gapi.iframes.CROSS_ORIGIN_IFRAMES_FILTER),this.eventManagers[e._key()]={manager:s},this.iframes[e._key()]=t,s}_isIframeWebStorageSupported(e,t){this.iframes[e._key()].send(go,{type:go},i=>{var r;const o=(r=i==null?void 0:i[0])===null||r===void 0?void 0:r[go];o!==void 0&&t(!!o),Rt(e,"internal-error")},gapi.iframes.CROSS_ORIGIN_IFRAMES_FILTER)}_originValidation(e){const t=e._key();return this.originValidationPromises[t]||(this.originValidationPromises[t]=Ey(e)),this.originValidationPromises[t]}get _shouldInitProactively(){return ou()||eu()||Aa()}}const qy=Gy;var yc="@firebase/auth",_c="1.7.9";/**
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
 */class Ky{constructor(e){this.auth=e,this.internalListeners=new Map}getUid(){var e;return this.assertAuthConfigured(),((e=this.auth.currentUser)===null||e===void 0?void 0:e.uid)||null}async getToken(e){return this.assertAuthConfigured(),await this.auth._initializationPromise,this.auth.currentUser?{accessToken:await this.auth.currentUser.getIdToken(e)}:null}addAuthTokenListener(e){if(this.assertAuthConfigured(),this.internalListeners.has(e))return;const t=this.auth.onIdTokenChanged(s=>{e((s==null?void 0:s.stsTokenManager.accessToken)||null)});this.internalListeners.set(e,t),this.updateProactiveRefresh()}removeAuthTokenListener(e){this.assertAuthConfigured();const t=this.internalListeners.get(e);t&&(this.internalListeners.delete(e),t(),this.updateProactiveRefresh())}assertAuthConfigured(){de(this.auth._initializationPromise,"dependent-sdk-initialized-before-auth")}updateProactiveRefresh(){this.internalListeners.size>0?this.auth._startProactiveRefresh():this.auth._stopProactiveRefresh()}}/**
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
 */function Yy(n){switch(n){case"Node":return"node";case"ReactNative":return"rn";case"Worker":return"webworker";case"Cordova":return"cordova";case"WebExtension":return"web-extension";default:return}}function Qy(n){gs(new Gn("auth",(e,{options:t})=>{const s=e.getProvider("app").getImmediate(),i=e.getProvider("heartbeat"),r=e.getProvider("app-check-internal"),{apiKey:o,authDomain:l}=s.options;de(o&&!o.includes(":"),"invalid-api-key",{appName:s.name});const c={apiKey:o,authDomain:l,clientPlatform:n,apiHost:"identitytoolkit.googleapis.com",tokenApiHost:"securetoken.googleapis.com",apiScheme:"https",sdkClientVersion:au(n)},d=new dg(s,i,r,c);return vg(d,t),d},"PUBLIC").setInstantiationMode("EXPLICIT").setInstanceCreatedCallback((e,t,s)=>{e.getProvider("auth-internal").initialize()})),gs(new Gn("auth-internal",e=>{const t=Xn(e.getProvider("auth").getImmediate());return(s=>new Ky(s))(t)},"PRIVATE").setInstantiationMode("EXPLICIT")),vn(yc,_c,Yy(n)),vn(yc,_c,"esm2017")}/**
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
 */const Jy=5*60,Xy=Dd("authIdTokenMaxAge")||Jy;let vc=null;const Zy=n=>async e=>{const t=e&&await e.getIdTokenResult(),s=t&&(new Date().getTime()-Date.parse(t.issuedAtTime))/1e3;if(s&&s>Xy)return;const i=t==null?void 0:t.token;vc!==i&&(vc=i,await fetch(n,{method:i?"POST":"DELETE",headers:i?{Authorization:`Bearer ${i}`}:{}}))};function e_(n=Wd()){const e=ka(n,"auth");if(e.isInitialized())return e.getImmediate();const t=_g(n,{popupRedirectResolver:qy,persistence:[iy,Gg,_u]}),s=Dd("authTokenSyncURL");if(s&&typeof isSecureContext=="boolean"&&isSecureContext){const r=new URL(s,location.origin);if(location.origin===r.origin){const o=Zy(r.toString());Bg(t,o,()=>o(t.currentUser)),Ug(t,l=>o(l))}}const i=Od("auth");return i&&bg(t,`http://${i}`),t}function t_(){var n,e;return(e=(n=document.getElementsByTagName("head"))===null||n===void 0?void 0:n[0])!==null&&e!==void 0?e:document}ug({loadJS(n){return new Promise((e,t)=>{const s=document.createElement("script");s.setAttribute("src",n),s.onload=e,s.onerror=i=>{const r=Ft("internal-error");r.customData=i,t(r)},s.type="text/javascript",s.charset="UTF-8",t_().appendChild(s)})},gapiScript:"https://apis.google.com/js/api.js",recaptchaV2Script:"https://www.google.com/recaptcha/api.js",recaptchaEnterpriseScript:"https://www.google.com/recaptcha/enterprise.js?render="});Qy("Browser");var bc={};const wc="@firebase/database",Cc="1.0.8";/**
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
 */let Iu="";function n_(n){Iu=n}/**
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
 */class s_{constructor(e){this.domStorage_=e,this.prefix_="firebase:"}set(e,t){t==null?this.domStorage_.removeItem(this.prefixedName_(e)):this.domStorage_.setItem(this.prefixedName_(e),je(t))}get(e){const t=this.domStorage_.getItem(this.prefixedName_(e));return t==null?null:ri(t)}remove(e){this.domStorage_.removeItem(this.prefixedName_(e))}prefixedName_(e){return this.prefix_+e}toString(){return this.domStorage_.toString()}}/**
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
 */class i_{constructor(){this.cache_={},this.isInMemoryStorage=!0}set(e,t){t==null?delete this.cache_[e]:this.cache_[e]=t}get(e){return Wt(this.cache_,e)?this.cache_[e]:null}remove(e){delete this.cache_[e]}}/**
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
 */const Su=function(n){try{if(typeof window<"u"&&typeof window[n]<"u"){const e=window[n];return e.setItem("firebase:sentinel","cache"),e.removeItem("firebase:sentinel"),new s_(e)}}catch{}return new i_},Fn=Su("localStorage"),r_=Su("sessionStorage");/**
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
 */const us=new Ca("@firebase/database"),o_=function(){let n=1;return function(){return n++}}(),Tu=function(n){const e=Pp(n),t=new Tp;t.update(e);const s=t.digest();return va.encodeByteArray(s)},Ti=function(...n){let e="";for(let t=0;t<n.length;t++){const s=n[t];Array.isArray(s)||s&&typeof s=="object"&&typeof s.length=="number"?e+=Ti.apply(null,s):typeof s=="object"?e+=je(s):e+=s,e+=" "}return e};let Qs=null,Ec=!0;const a_=function(n,e){H(!0,"Can't turn on custom loggers persistently."),us.logLevel=ke.VERBOSE,Qs=us.log.bind(us)},qe=function(...n){if(Ec===!0&&(Ec=!1,Qs===null&&r_.get("logging_enabled")===!0&&a_()),Qs){const e=Ti.apply(null,n);Qs(e)}},xi=function(n){return function(...e){qe(n,...e)}},Wo=function(...n){const e="FIREBASE INTERNAL ERROR: "+Ti(...n);us.error(e)},en=function(...n){const e=`FIREBASE FATAL ERROR: ${Ti(...n)}`;throw us.error(e),new Error(e)},st=function(...n){const e="FIREBASE WARNING: "+Ti(...n);us.warn(e)},l_=function(){typeof window<"u"&&window.location&&window.location.protocol&&window.location.protocol.indexOf("https:")!==-1&&st("Insecure Firebase access from a secure page. Please use https in calls to new Firebase().")},$r=function(n){return typeof n=="number"&&(n!==n||n===Number.POSITIVE_INFINITY||n===Number.NEGATIVE_INFINITY)},c_=function(n){if(document.readyState==="complete")n();else{let e=!1;const t=function(){if(!document.body){setTimeout(t,Math.floor(10));return}e||(e=!0,n())};document.addEventListener?(document.addEventListener("DOMContentLoaded",t,!1),window.addEventListener("load",t,!1)):document.attachEvent&&(document.attachEvent("onreadystatechange",()=>{document.readyState==="complete"&&t()}),window.attachEvent("onload",t))}},Yn="[MIN_NAME]",En="[MAX_NAME]",es=function(n,e){if(n===e)return 0;if(n===Yn||e===En)return-1;if(e===Yn||n===En)return 1;{const t=kc(n),s=kc(e);return t!==null?s!==null?t-s===0?n.length-e.length:t-s:-1:s!==null?1:n<e?-1:1}},d_=function(n,e){return n===e?0:n<e?-1:1},$s=function(n,e){if(e&&n in e)return e[n];throw new Error("Missing required key ("+n+") in object: "+je(e))},Ma=function(n){if(typeof n!="object"||n===null)return je(n);const e=[];for(const s in n)e.push(s);e.sort();let t="{";for(let s=0;s<e.length;s++)s!==0&&(t+=","),t+=je(e[s]),t+=":",t+=Ma(n[e[s]]);return t+="}",t},xu=function(n,e){const t=n.length;if(t<=e)return[n];const s=[];for(let i=0;i<t;i+=e)i+e>t?s.push(n.substring(i,t)):s.push(n.substring(i,i+e));return s};function Ye(n,e){for(const t in n)n.hasOwnProperty(t)&&e(t,n[t])}const Au=function(n){H(!$r(n),"Invalid JSON number");const e=11,t=52,s=(1<<e-1)-1;let i,r,o,l,c;n===0?(r=0,o=0,i=1/n===-1/0?1:0):(i=n<0,n=Math.abs(n),n>=Math.pow(2,1-s)?(l=Math.min(Math.floor(Math.log(n)/Math.LN2),s),r=l+s,o=Math.round(n*Math.pow(2,t-l)-Math.pow(2,t))):(r=0,o=Math.round(n/Math.pow(2,1-s-t))));const d=[];for(c=t;c;c-=1)d.push(o%2?1:0),o=Math.floor(o/2);for(c=e;c;c-=1)d.push(r%2?1:0),r=Math.floor(r/2);d.push(i?1:0),d.reverse();const h=d.join("");let u="";for(c=0;c<64;c+=8){let m=parseInt(h.substr(c,8),2).toString(16);m.length===1&&(m="0"+m),u=u+m}return u.toLowerCase()},u_=function(){return!!(typeof window=="object"&&window.chrome&&window.chrome.extension&&!/^chrome/.test(window.location.href))},h_=function(){return typeof Windows=="object"&&typeof Windows.UI=="object"};function f_(n,e){let t="Unknown Error";n==="too_big"?t="The data requested exceeds the maximum size that can be accessed with a single request.":n==="permission_denied"?t="Client doesn't have permission to access the desired data.":n==="unavailable"&&(t="The service is unavailable");const s=new Error(n+" at "+e._path.toString()+": "+t);return s.code=n.toUpperCase(),s}const p_=new RegExp("^-?(0*)\\d{1,10}$"),m_=-2147483648,g_=2147483647,kc=function(n){if(p_.test(n)){const e=Number(n);if(e>=m_&&e<=g_)return e}return null},As=function(n){try{n()}catch(e){setTimeout(()=>{const t=e.stack||"";throw st("Exception was thrown by user callback.",t),e},Math.floor(0))}},y_=function(){return(typeof window=="object"&&window.navigator&&window.navigator.userAgent||"").search(/googlebot|google webmaster tools|bingbot|yahoo! slurp|baiduspider|yandexbot|duckduckbot/i)>=0},Js=function(n,e){const t=setTimeout(n,e);return typeof t=="number"&&typeof Deno<"u"&&Deno.unrefTimer?Deno.unrefTimer(t):typeof t=="object"&&t.unref&&t.unref(),t};/**
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
 */class __{constructor(e,t){this.appName_=e,this.appCheckProvider=t,this.appCheck=t==null?void 0:t.getImmediate({optional:!0}),this.appCheck||t==null||t.get().then(s=>this.appCheck=s)}getToken(e){return this.appCheck?this.appCheck.getToken(e):new Promise((t,s)=>{setTimeout(()=>{this.appCheck?this.getToken(e).then(t,s):t(null)},0)})}addTokenChangeListener(e){var t;(t=this.appCheckProvider)===null||t===void 0||t.get().then(s=>s.addTokenListener(e))}notifyForInvalidToken(){st(`Provided AppCheck credentials for the app named "${this.appName_}" are invalid. This usually indicates your app was not initialized correctly.`)}}/**
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
 */class v_{constructor(e,t,s){this.appName_=e,this.firebaseOptions_=t,this.authProvider_=s,this.auth_=null,this.auth_=s.getImmediate({optional:!0}),this.auth_||s.onInit(i=>this.auth_=i)}getToken(e){return this.auth_?this.auth_.getToken(e).catch(t=>t&&t.code==="auth/token-not-initialized"?(qe("Got auth/token-not-initialized error.  Treating as null token."),null):Promise.reject(t)):new Promise((t,s)=>{setTimeout(()=>{this.auth_?this.getToken(e).then(t,s):t(null)},0)})}addTokenChangeListener(e){this.auth_?this.auth_.addAuthTokenListener(e):this.authProvider_.get().then(t=>t.addAuthTokenListener(e))}removeTokenChangeListener(e){this.authProvider_.get().then(t=>t.removeAuthTokenListener(e))}notifyForInvalidToken(){let e='Provided authentication credentials for the app named "'+this.appName_+'" are invalid. This usually indicates your app was not initialized correctly. ';"credential"in this.firebaseOptions_?e+='Make sure the "credential" property provided to initializeApp() is authorized to access the specified "databaseURL" and is from the correct project.':"serviceAccount"in this.firebaseOptions_?e+='Make sure the "serviceAccount" property provided to initializeApp() is authorized to access the specified "databaseURL" and is from the correct project.':e+='Make sure the "apiKey" and "databaseURL" properties provided to initializeApp() match the values provided for your app at https://console.firebase.google.com/.',st(e)}}class Zi{constructor(e){this.accessToken=e}getToken(e){return Promise.resolve({accessToken:this.accessToken})}addTokenChangeListener(e){e(this.accessToken)}removeTokenChangeListener(e){}notifyForInvalidToken(){}}Zi.OWNER="owner";/**
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
 */const Da="5",Ru="v",Pu="s",Nu="r",Ou="f",Mu=/(console\.firebase|firebase-console-\w+\.corp|firebase\.corp)\.google\.com/,Du="ls",Lu="p",Ho="ac",$u="websocket",Fu="long_polling";/**
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
 */class Uu{constructor(e,t,s,i,r=!1,o="",l=!1,c=!1){this.secure=t,this.namespace=s,this.webSocketOnly=i,this.nodeAdmin=r,this.persistenceKey=o,this.includeNamespaceInQueryParams=l,this.isUsingEmulator=c,this._host=e.toLowerCase(),this._domain=this._host.substr(this._host.indexOf(".")+1),this.internalHost=Fn.get("host:"+e)||this._host}isCacheableHost(){return this.internalHost.substr(0,2)==="s-"}isCustomHost(){return this._domain!=="firebaseio.com"&&this._domain!=="firebaseio-demo.com"}get host(){return this._host}set host(e){e!==this.internalHost&&(this.internalHost=e,this.isCacheableHost()&&Fn.set("host:"+this._host,this.internalHost))}toString(){let e=this.toURLString();return this.persistenceKey&&(e+="<"+this.persistenceKey+">"),e}toURLString(){const e=this.secure?"https://":"http://",t=this.includeNamespaceInQueryParams?`?ns=${this.namespace}`:"";return`${e}${this.host}/${t}`}}function b_(n){return n.host!==n.internalHost||n.isCustomHost()||n.includeNamespaceInQueryParams}function Bu(n,e,t){H(typeof e=="string","typeof type must == string"),H(typeof t=="object","typeof params must == object");let s;if(e===$u)s=(n.secure?"wss://":"ws://")+n.internalHost+"/.ws?";else if(e===Fu)s=(n.secure?"https://":"http://")+n.internalHost+"/.lp?";else throw new Error("Unknown connection type: "+e);b_(n)&&(t.ns=n.namespace);const i=[];return Ye(t,(r,o)=>{i.push(r+"="+o)}),s+i.join("&")}/**
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
 */class w_{constructor(){this.counters_={}}incrementCounter(e,t=1){Wt(this.counters_,e)||(this.counters_[e]=0),this.counters_[e]+=t}get(){return lp(this.counters_)}}/**
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
 */const yo={},_o={};function La(n){const e=n.toString();return yo[e]||(yo[e]=new w_),yo[e]}function C_(n,e){const t=n.toString();return _o[t]||(_o[t]=e()),_o[t]}/**
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
 */class E_{constructor(e){this.onMessage_=e,this.pendingResponses=[],this.currentResponseNum=0,this.closeAfterResponse=-1,this.onClose=null}closeAfter(e,t){this.closeAfterResponse=e,this.onClose=t,this.closeAfterResponse<this.currentResponseNum&&(this.onClose(),this.onClose=null)}handleResponse(e,t){for(this.pendingResponses[e]=t;this.pendingResponses[this.currentResponseNum];){const s=this.pendingResponses[this.currentResponseNum];delete this.pendingResponses[this.currentResponseNum];for(let i=0;i<s.length;++i)s[i]&&As(()=>{this.onMessage_(s[i])});if(this.currentResponseNum===this.closeAfterResponse){this.onClose&&(this.onClose(),this.onClose=null);break}this.currentResponseNum++}}}/**
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
 */const Ic="start",k_="close",I_="pLPCommand",S_="pRTLPCB",Wu="id",Hu="pw",ju="ser",T_="cb",x_="seg",A_="ts",R_="d",P_="dframe",Vu=1870,zu=30,N_=Vu-zu,O_=25e3,M_=3e4;class os{constructor(e,t,s,i,r,o,l){this.connId=e,this.repoInfo=t,this.applicationId=s,this.appCheckToken=i,this.authToken=r,this.transportSessionId=o,this.lastSessionId=l,this.bytesSent=0,this.bytesReceived=0,this.everConnected_=!1,this.log_=xi(e),this.stats_=La(t),this.urlFn=c=>(this.appCheckToken&&(c[Ho]=this.appCheckToken),Bu(t,Fu,c))}open(e,t){this.curSegmentNum=0,this.onDisconnect_=t,this.myPacketOrderer=new E_(e),this.isClosed_=!1,this.connectTimeoutTimer_=setTimeout(()=>{this.log_("Timed out trying to connect."),this.onClosed_(),this.connectTimeoutTimer_=null},Math.floor(M_)),c_(()=>{if(this.isClosed_)return;this.scriptTagHolder=new $a((...r)=>{const[o,l,c,d,h]=r;if(this.incrementIncomingBytes_(r),!!this.scriptTagHolder)if(this.connectTimeoutTimer_&&(clearTimeout(this.connectTimeoutTimer_),this.connectTimeoutTimer_=null),this.everConnected_=!0,o===Ic)this.id=l,this.password=c;else if(o===k_)l?(this.scriptTagHolder.sendNewPolls=!1,this.myPacketOrderer.closeAfter(l,()=>{this.onClosed_()})):this.onClosed_();else throw new Error("Unrecognized command received: "+o)},(...r)=>{const[o,l]=r;this.incrementIncomingBytes_(r),this.myPacketOrderer.handleResponse(o,l)},()=>{this.onClosed_()},this.urlFn);const s={};s[Ic]="t",s[ju]=Math.floor(Math.random()*1e8),this.scriptTagHolder.uniqueCallbackIdentifier&&(s[T_]=this.scriptTagHolder.uniqueCallbackIdentifier),s[Ru]=Da,this.transportSessionId&&(s[Pu]=this.transportSessionId),this.lastSessionId&&(s[Du]=this.lastSessionId),this.applicationId&&(s[Lu]=this.applicationId),this.appCheckToken&&(s[Ho]=this.appCheckToken),typeof location<"u"&&location.hostname&&Mu.test(location.hostname)&&(s[Nu]=Ou);const i=this.urlFn(s);this.log_("Connecting via long-poll to "+i),this.scriptTagHolder.addTag(i,()=>{})})}start(){this.scriptTagHolder.startLongPoll(this.id,this.password),this.addDisconnectPingFrame(this.id,this.password)}static forceAllow(){os.forceAllow_=!0}static forceDisallow(){os.forceDisallow_=!0}static isAvailable(){return os.forceAllow_?!0:!os.forceDisallow_&&typeof document<"u"&&document.createElement!=null&&!u_()&&!h_()}markConnectionHealthy(){}shutdown_(){this.isClosed_=!0,this.scriptTagHolder&&(this.scriptTagHolder.close(),this.scriptTagHolder=null),this.myDisconnFrame&&(document.body.removeChild(this.myDisconnFrame),this.myDisconnFrame=null),this.connectTimeoutTimer_&&(clearTimeout(this.connectTimeoutTimer_),this.connectTimeoutTimer_=null)}onClosed_(){this.isClosed_||(this.log_("Longpoll is closing itself"),this.shutdown_(),this.onDisconnect_&&(this.onDisconnect_(this.everConnected_),this.onDisconnect_=null))}close(){this.isClosed_||(this.log_("Longpoll is being closed."),this.shutdown_())}send(e){const t=je(e);this.bytesSent+=t.length,this.stats_.incrementCounter("bytes_sent",t.length);const s=Pd(t),i=xu(s,N_);for(let r=0;r<i.length;r++)this.scriptTagHolder.enqueueSegment(this.curSegmentNum,i.length,i[r]),this.curSegmentNum++}addDisconnectPingFrame(e,t){this.myDisconnFrame=document.createElement("iframe");const s={};s[P_]="t",s[Wu]=e,s[Hu]=t,this.myDisconnFrame.src=this.urlFn(s),this.myDisconnFrame.style.display="none",document.body.appendChild(this.myDisconnFrame)}incrementIncomingBytes_(e){const t=je(e).length;this.bytesReceived+=t,this.stats_.incrementCounter("bytes_received",t)}}class $a{constructor(e,t,s,i){this.onDisconnect=s,this.urlFn=i,this.outstandingRequests=new Set,this.pendingSegs=[],this.currentSerial=Math.floor(Math.random()*1e8),this.sendNewPolls=!0;{this.uniqueCallbackIdentifier=o_(),window[I_+this.uniqueCallbackIdentifier]=e,window[S_+this.uniqueCallbackIdentifier]=t,this.myIFrame=$a.createIFrame_();let r="";this.myIFrame.src&&this.myIFrame.src.substr(0,11)==="javascript:"&&(r='<script>document.domain="'+document.domain+'";<\/script>');const o="<html><body>"+r+"</body></html>";try{this.myIFrame.doc.open(),this.myIFrame.doc.write(o),this.myIFrame.doc.close()}catch(l){qe("frame writing exception"),l.stack&&qe(l.stack),qe(l)}}}static createIFrame_(){const e=document.createElement("iframe");if(e.style.display="none",document.body){document.body.appendChild(e);try{e.contentWindow.document||qe("No IE domain setting required")}catch{const s=document.domain;e.src="javascript:void((function(){document.open();document.domain='"+s+"';document.close();})())"}}else throw"Document body has not initialized. Wait to initialize Firebase until after the document is ready.";return e.contentDocument?e.doc=e.contentDocument:e.contentWindow?e.doc=e.contentWindow.document:e.document&&(e.doc=e.document),e}close(){this.alive=!1,this.myIFrame&&(this.myIFrame.doc.body.textContent="",setTimeout(()=>{this.myIFrame!==null&&(document.body.removeChild(this.myIFrame),this.myIFrame=null)},Math.floor(0)));const e=this.onDisconnect;e&&(this.onDisconnect=null,e())}startLongPoll(e,t){for(this.myID=e,this.myPW=t,this.alive=!0;this.newRequest_(););}newRequest_(){if(this.alive&&this.sendNewPolls&&this.outstandingRequests.size<(this.pendingSegs.length>0?2:1)){this.currentSerial++;const e={};e[Wu]=this.myID,e[Hu]=this.myPW,e[ju]=this.currentSerial;let t=this.urlFn(e),s="",i=0;for(;this.pendingSegs.length>0&&this.pendingSegs[0].d.length+zu+s.length<=Vu;){const o=this.pendingSegs.shift();s=s+"&"+x_+i+"="+o.seg+"&"+A_+i+"="+o.ts+"&"+R_+i+"="+o.d,i++}return t=t+s,this.addLongPollTag_(t,this.currentSerial),!0}else return!1}enqueueSegment(e,t,s){this.pendingSegs.push({seg:e,ts:t,d:s}),this.alive&&this.newRequest_()}addLongPollTag_(e,t){this.outstandingRequests.add(t);const s=()=>{this.outstandingRequests.delete(t),this.newRequest_()},i=setTimeout(s,Math.floor(O_)),r=()=>{clearTimeout(i),s()};this.addTag(e,r)}addTag(e,t){setTimeout(()=>{try{if(!this.sendNewPolls)return;const s=this.myIFrame.doc.createElement("script");s.type="text/javascript",s.async=!0,s.src=e,s.onload=s.onreadystatechange=function(){const i=s.readyState;(!i||i==="loaded"||i==="complete")&&(s.onload=s.onreadystatechange=null,s.parentNode&&s.parentNode.removeChild(s),t())},s.onerror=()=>{qe("Long-poll script failed to load: "+e),this.sendNewPolls=!1,this.close()},this.myIFrame.doc.body.appendChild(s)}catch{}},Math.floor(1))}}/**
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
 */const D_=16384,L_=45e3;let fr=null;typeof MozWebSocket<"u"?fr=MozWebSocket:typeof WebSocket<"u"&&(fr=WebSocket);class St{constructor(e,t,s,i,r,o,l){this.connId=e,this.applicationId=s,this.appCheckToken=i,this.authToken=r,this.keepaliveTimer=null,this.frames=null,this.totalFrames=0,this.bytesSent=0,this.bytesReceived=0,this.log_=xi(this.connId),this.stats_=La(t),this.connURL=St.connectionURL_(t,o,l,i,s),this.nodeAdmin=t.nodeAdmin}static connectionURL_(e,t,s,i,r){const o={};return o[Ru]=Da,typeof location<"u"&&location.hostname&&Mu.test(location.hostname)&&(o[Nu]=Ou),t&&(o[Pu]=t),s&&(o[Du]=s),i&&(o[Ho]=i),r&&(o[Lu]=r),Bu(e,$u,o)}open(e,t){this.onDisconnect=t,this.onMessage=e,this.log_("Websocket connecting to "+this.connURL),this.everConnected_=!1,Fn.set("previous_websocket_failure",!0);try{let s;vp(),this.mySock=new fr(this.connURL,[],s)}catch(s){this.log_("Error instantiating WebSocket.");const i=s.message||s.data;i&&this.log_(i),this.onClosed_();return}this.mySock.onopen=()=>{this.log_("Websocket connected."),this.everConnected_=!0},this.mySock.onclose=()=>{this.log_("Websocket connection was disconnected."),this.mySock=null,this.onClosed_()},this.mySock.onmessage=s=>{this.handleIncomingFrame(s)},this.mySock.onerror=s=>{this.log_("WebSocket error.  Closing connection.");const i=s.message||s.data;i&&this.log_(i),this.onClosed_()}}start(){}static forceDisallow(){St.forceDisallow_=!0}static isAvailable(){let e=!1;if(typeof navigator<"u"&&navigator.userAgent){const t=/Android ([0-9]{0,}\.[0-9]{0,})/,s=navigator.userAgent.match(t);s&&s.length>1&&parseFloat(s[1])<4.4&&(e=!0)}return!e&&fr!==null&&!St.forceDisallow_}static previouslyFailed(){return Fn.isInMemoryStorage||Fn.get("previous_websocket_failure")===!0}markConnectionHealthy(){Fn.remove("previous_websocket_failure")}appendFrame_(e){if(this.frames.push(e),this.frames.length===this.totalFrames){const t=this.frames.join("");this.frames=null;const s=ri(t);this.onMessage(s)}}handleNewFrameCount_(e){this.totalFrames=e,this.frames=[]}extractFrameCount_(e){if(H(this.frames===null,"We already have a frame buffer"),e.length<=6){const t=Number(e);if(!isNaN(t))return this.handleNewFrameCount_(t),null}return this.handleNewFrameCount_(1),e}handleIncomingFrame(e){if(this.mySock===null)return;const t=e.data;if(this.bytesReceived+=t.length,this.stats_.incrementCounter("bytes_received",t.length),this.resetKeepAlive(),this.frames!==null)this.appendFrame_(t);else{const s=this.extractFrameCount_(t);s!==null&&this.appendFrame_(s)}}send(e){this.resetKeepAlive();const t=je(e);this.bytesSent+=t.length,this.stats_.incrementCounter("bytes_sent",t.length);const s=xu(t,D_);s.length>1&&this.sendString_(String(s.length));for(let i=0;i<s.length;i++)this.sendString_(s[i])}shutdown_(){this.isClosed_=!0,this.keepaliveTimer&&(clearInterval(this.keepaliveTimer),this.keepaliveTimer=null),this.mySock&&(this.mySock.close(),this.mySock=null)}onClosed_(){this.isClosed_||(this.log_("WebSocket is closing itself"),this.shutdown_(),this.onDisconnect&&(this.onDisconnect(this.everConnected_),this.onDisconnect=null))}close(){this.isClosed_||(this.log_("WebSocket is being closed"),this.shutdown_())}resetKeepAlive(){clearInterval(this.keepaliveTimer),this.keepaliveTimer=setInterval(()=>{this.mySock&&this.sendString_("0"),this.resetKeepAlive()},Math.floor(L_))}sendString_(e){try{this.mySock.send(e)}catch(t){this.log_("Exception thrown from WebSocket.send():",t.message||t.data,"Closing connection."),setTimeout(this.onClosed_.bind(this),0)}}}St.responsesRequiredToBeHealthy=2;St.healthyTimeout=3e4;/**
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
 */class li{constructor(e){this.initTransports_(e)}static get ALL_TRANSPORTS(){return[os,St]}static get IS_TRANSPORT_INITIALIZED(){return this.globalTransportInitialized_}initTransports_(e){const t=St&&St.isAvailable();let s=t&&!St.previouslyFailed();if(e.webSocketOnly&&(t||st("wss:// URL used, but browser isn't known to support websockets.  Trying anyway."),s=!0),s)this.transports_=[St];else{const i=this.transports_=[];for(const r of li.ALL_TRANSPORTS)r&&r.isAvailable()&&i.push(r);li.globalTransportInitialized_=!0}}initialTransport(){if(this.transports_.length>0)return this.transports_[0];throw new Error("No transports available")}upgradeTransport(){return this.transports_.length>1?this.transports_[1]:null}}li.globalTransportInitialized_=!1;/**
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
 */const $_=6e4,F_=5e3,U_=10*1024,B_=100*1024,vo="t",Sc="d",W_="s",Tc="r",H_="e",xc="o",Ac="a",Rc="n",Pc="p",j_="h";class V_{constructor(e,t,s,i,r,o,l,c,d,h){this.id=e,this.repoInfo_=t,this.applicationId_=s,this.appCheckToken_=i,this.authToken_=r,this.onMessage_=o,this.onReady_=l,this.onDisconnect_=c,this.onKill_=d,this.lastSessionId=h,this.connectionCount=0,this.pendingDataMessages=[],this.state_=0,this.log_=xi("c:"+this.id+":"),this.transportManager_=new li(t),this.log_("Connection created"),this.start_()}start_(){const e=this.transportManager_.initialTransport();this.conn_=new e(this.nextTransportId_(),this.repoInfo_,this.applicationId_,this.appCheckToken_,this.authToken_,null,this.lastSessionId),this.primaryResponsesRequired_=e.responsesRequiredToBeHealthy||0;const t=this.connReceiver_(this.conn_),s=this.disconnReceiver_(this.conn_);this.tx_=this.conn_,this.rx_=this.conn_,this.secondaryConn_=null,this.isHealthy_=!1,setTimeout(()=>{this.conn_&&this.conn_.open(t,s)},Math.floor(0));const i=e.healthyTimeout||0;i>0&&(this.healthyTimeout_=Js(()=>{this.healthyTimeout_=null,this.isHealthy_||(this.conn_&&this.conn_.bytesReceived>B_?(this.log_("Connection exceeded healthy timeout but has received "+this.conn_.bytesReceived+" bytes.  Marking connection healthy."),this.isHealthy_=!0,this.conn_.markConnectionHealthy()):this.conn_&&this.conn_.bytesSent>U_?this.log_("Connection exceeded healthy timeout but has sent "+this.conn_.bytesSent+" bytes.  Leaving connection alive."):(this.log_("Closing unhealthy connection after timeout."),this.close()))},Math.floor(i)))}nextTransportId_(){return"c:"+this.id+":"+this.connectionCount++}disconnReceiver_(e){return t=>{e===this.conn_?this.onConnectionLost_(t):e===this.secondaryConn_?(this.log_("Secondary connection lost."),this.onSecondaryConnectionLost_()):this.log_("closing an old connection")}}connReceiver_(e){return t=>{this.state_!==2&&(e===this.rx_?this.onPrimaryMessageReceived_(t):e===this.secondaryConn_?this.onSecondaryMessageReceived_(t):this.log_("message on old connection"))}}sendRequest(e){const t={t:"d",d:e};this.sendData_(t)}tryCleanupConnection(){this.tx_===this.secondaryConn_&&this.rx_===this.secondaryConn_&&(this.log_("cleaning up and promoting a connection: "+this.secondaryConn_.connId),this.conn_=this.secondaryConn_,this.secondaryConn_=null)}onSecondaryControl_(e){if(vo in e){const t=e[vo];t===Ac?this.upgradeIfSecondaryHealthy_():t===Tc?(this.log_("Got a reset on secondary, closing it"),this.secondaryConn_.close(),(this.tx_===this.secondaryConn_||this.rx_===this.secondaryConn_)&&this.close()):t===xc&&(this.log_("got pong on secondary."),this.secondaryResponsesRequired_--,this.upgradeIfSecondaryHealthy_())}}onSecondaryMessageReceived_(e){const t=$s("t",e),s=$s("d",e);if(t==="c")this.onSecondaryControl_(s);else if(t==="d")this.pendingDataMessages.push(s);else throw new Error("Unknown protocol layer: "+t)}upgradeIfSecondaryHealthy_(){this.secondaryResponsesRequired_<=0?(this.log_("Secondary connection is healthy."),this.isHealthy_=!0,this.secondaryConn_.markConnectionHealthy(),this.proceedWithUpgrade_()):(this.log_("sending ping on secondary."),this.secondaryConn_.send({t:"c",d:{t:Pc,d:{}}}))}proceedWithUpgrade_(){this.secondaryConn_.start(),this.log_("sending client ack on secondary"),this.secondaryConn_.send({t:"c",d:{t:Ac,d:{}}}),this.log_("Ending transmission on primary"),this.conn_.send({t:"c",d:{t:Rc,d:{}}}),this.tx_=this.secondaryConn_,this.tryCleanupConnection()}onPrimaryMessageReceived_(e){const t=$s("t",e),s=$s("d",e);t==="c"?this.onControl_(s):t==="d"&&this.onDataMessage_(s)}onDataMessage_(e){this.onPrimaryResponse_(),this.onMessage_(e)}onPrimaryResponse_(){this.isHealthy_||(this.primaryResponsesRequired_--,this.primaryResponsesRequired_<=0&&(this.log_("Primary connection is healthy."),this.isHealthy_=!0,this.conn_.markConnectionHealthy()))}onControl_(e){const t=$s(vo,e);if(Sc in e){const s=e[Sc];if(t===j_){const i=Object.assign({},s);this.repoInfo_.isUsingEmulator&&(i.h=this.repoInfo_.host),this.onHandshake_(i)}else if(t===Rc){this.log_("recvd end transmission on primary"),this.rx_=this.secondaryConn_;for(let i=0;i<this.pendingDataMessages.length;++i)this.onDataMessage_(this.pendingDataMessages[i]);this.pendingDataMessages=[],this.tryCleanupConnection()}else t===W_?this.onConnectionShutdown_(s):t===Tc?this.onReset_(s):t===H_?Wo("Server Error: "+s):t===xc?(this.log_("got pong on primary."),this.onPrimaryResponse_(),this.sendPingOnPrimaryIfNecessary_()):Wo("Unknown control packet command: "+t)}}onHandshake_(e){const t=e.ts,s=e.v,i=e.h;this.sessionId=e.s,this.repoInfo_.host=i,this.state_===0&&(this.conn_.start(),this.onConnectionEstablished_(this.conn_,t),Da!==s&&st("Protocol version mismatch detected"),this.tryStartUpgrade_())}tryStartUpgrade_(){const e=this.transportManager_.upgradeTransport();e&&this.startUpgrade_(e)}startUpgrade_(e){this.secondaryConn_=new e(this.nextTransportId_(),this.repoInfo_,this.applicationId_,this.appCheckToken_,this.authToken_,this.sessionId),this.secondaryResponsesRequired_=e.responsesRequiredToBeHealthy||0;const t=this.connReceiver_(this.secondaryConn_),s=this.disconnReceiver_(this.secondaryConn_);this.secondaryConn_.open(t,s),Js(()=>{this.secondaryConn_&&(this.log_("Timed out trying to upgrade."),this.secondaryConn_.close())},Math.floor($_))}onReset_(e){this.log_("Reset packet received.  New host: "+e),this.repoInfo_.host=e,this.state_===1?this.close():(this.closeConnections_(),this.start_())}onConnectionEstablished_(e,t){this.log_("Realtime connection established."),this.conn_=e,this.state_=1,this.onReady_&&(this.onReady_(t,this.sessionId),this.onReady_=null),this.primaryResponsesRequired_===0?(this.log_("Primary connection is healthy."),this.isHealthy_=!0):Js(()=>{this.sendPingOnPrimaryIfNecessary_()},Math.floor(F_))}sendPingOnPrimaryIfNecessary_(){!this.isHealthy_&&this.state_===1&&(this.log_("sending ping on primary."),this.sendData_({t:"c",d:{t:Pc,d:{}}}))}onSecondaryConnectionLost_(){const e=this.secondaryConn_;this.secondaryConn_=null,(this.tx_===e||this.rx_===e)&&this.close()}onConnectionLost_(e){this.conn_=null,!e&&this.state_===0?(this.log_("Realtime connection failed."),this.repoInfo_.isCacheableHost()&&(Fn.remove("host:"+this.repoInfo_.host),this.repoInfo_.internalHost=this.repoInfo_.host)):this.state_===1&&this.log_("Realtime connection lost."),this.close()}onConnectionShutdown_(e){this.log_("Connection shutdown command received. Shutting down..."),this.onKill_&&(this.onKill_(e),this.onKill_=null),this.onDisconnect_=null,this.close()}sendData_(e){if(this.state_!==1)throw"Connection is not connected";this.tx_.send(e)}close(){this.state_!==2&&(this.log_("Closing realtime connection."),this.state_=2,this.closeConnections_(),this.onDisconnect_&&(this.onDisconnect_(),this.onDisconnect_=null))}closeConnections_(){this.log_("Shutting down all connections"),this.conn_&&(this.conn_.close(),this.conn_=null),this.secondaryConn_&&(this.secondaryConn_.close(),this.secondaryConn_=null),this.healthyTimeout_&&(clearTimeout(this.healthyTimeout_),this.healthyTimeout_=null)}}/**
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
 */class Gu{put(e,t,s,i){}merge(e,t,s,i){}refreshAuthToken(e){}refreshAppCheckToken(e){}onDisconnectPut(e,t,s){}onDisconnectMerge(e,t,s){}onDisconnectCancel(e,t){}reportStats(e){}}/**
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
 */class qu{constructor(e){this.allowedEvents_=e,this.listeners_={},H(Array.isArray(e)&&e.length>0,"Requires a non-empty array")}trigger(e,...t){if(Array.isArray(this.listeners_[e])){const s=[...this.listeners_[e]];for(let i=0;i<s.length;i++)s[i].callback.apply(s[i].context,t)}}on(e,t,s){this.validateEventType_(e),this.listeners_[e]=this.listeners_[e]||[],this.listeners_[e].push({callback:t,context:s});const i=this.getInitialEvent(e);i&&t.apply(s,i)}off(e,t,s){this.validateEventType_(e);const i=this.listeners_[e]||[];for(let r=0;r<i.length;r++)if(i[r].callback===t&&(!s||s===i[r].context)){i.splice(r,1);return}}validateEventType_(e){H(this.allowedEvents_.find(t=>t===e),"Unknown event: "+e)}}/**
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
 */class pr extends qu{constructor(){super(["online"]),this.online_=!0,typeof window<"u"&&typeof window.addEventListener<"u"&&!wa()&&(window.addEventListener("online",()=>{this.online_||(this.online_=!0,this.trigger("online",!0))},!1),window.addEventListener("offline",()=>{this.online_&&(this.online_=!1,this.trigger("online",!1))},!1))}static getInstance(){return new pr}getInitialEvent(e){return H(e==="online","Unknown event type: "+e),[this.online_]}currentlyOnline(){return this.online_}}/**
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
 */const Nc=32,Oc=768;class Ce{constructor(e,t){if(t===void 0){this.pieces_=e.split("/");let s=0;for(let i=0;i<this.pieces_.length;i++)this.pieces_[i].length>0&&(this.pieces_[s]=this.pieces_[i],s++);this.pieces_.length=s,this.pieceNum_=0}else this.pieces_=e,this.pieceNum_=t}toString(){let e="";for(let t=this.pieceNum_;t<this.pieces_.length;t++)this.pieces_[t]!==""&&(e+="/"+this.pieces_[t]);return e||"/"}}function be(){return new Ce("")}function me(n){return n.pieceNum_>=n.pieces_.length?null:n.pieces_[n.pieceNum_]}function kn(n){return n.pieces_.length-n.pieceNum_}function Ie(n){let e=n.pieceNum_;return e<n.pieces_.length&&e++,new Ce(n.pieces_,e)}function Fa(n){return n.pieceNum_<n.pieces_.length?n.pieces_[n.pieces_.length-1]:null}function z_(n){let e="";for(let t=n.pieceNum_;t<n.pieces_.length;t++)n.pieces_[t]!==""&&(e+="/"+encodeURIComponent(String(n.pieces_[t])));return e||"/"}function ci(n,e=0){return n.pieces_.slice(n.pieceNum_+e)}function Ku(n){if(n.pieceNum_>=n.pieces_.length)return null;const e=[];for(let t=n.pieceNum_;t<n.pieces_.length-1;t++)e.push(n.pieces_[t]);return new Ce(e,0)}function Oe(n,e){const t=[];for(let s=n.pieceNum_;s<n.pieces_.length;s++)t.push(n.pieces_[s]);if(e instanceof Ce)for(let s=e.pieceNum_;s<e.pieces_.length;s++)t.push(e.pieces_[s]);else{const s=e.split("/");for(let i=0;i<s.length;i++)s[i].length>0&&t.push(s[i])}return new Ce(t,0)}function ge(n){return n.pieceNum_>=n.pieces_.length}function nt(n,e){const t=me(n),s=me(e);if(t===null)return e;if(t===s)return nt(Ie(n),Ie(e));throw new Error("INTERNAL ERROR: innerPath ("+e+") is not within outerPath ("+n+")")}function G_(n,e){const t=ci(n,0),s=ci(e,0);for(let i=0;i<t.length&&i<s.length;i++){const r=es(t[i],s[i]);if(r!==0)return r}return t.length===s.length?0:t.length<s.length?-1:1}function Ua(n,e){if(kn(n)!==kn(e))return!1;for(let t=n.pieceNum_,s=e.pieceNum_;t<=n.pieces_.length;t++,s++)if(n.pieces_[t]!==e.pieces_[s])return!1;return!0}function wt(n,e){let t=n.pieceNum_,s=e.pieceNum_;if(kn(n)>kn(e))return!1;for(;t<n.pieces_.length;){if(n.pieces_[t]!==e.pieces_[s])return!1;++t,++s}return!0}class q_{constructor(e,t){this.errorPrefix_=t,this.parts_=ci(e,0),this.byteLength_=Math.max(1,this.parts_.length);for(let s=0;s<this.parts_.length;s++)this.byteLength_+=Or(this.parts_[s]);Yu(this)}}function K_(n,e){n.parts_.length>0&&(n.byteLength_+=1),n.parts_.push(e),n.byteLength_+=Or(e),Yu(n)}function Y_(n){const e=n.parts_.pop();n.byteLength_-=Or(e),n.parts_.length>0&&(n.byteLength_-=1)}function Yu(n){if(n.byteLength_>Oc)throw new Error(n.errorPrefix_+"has a key path longer than "+Oc+" bytes ("+n.byteLength_+").");if(n.parts_.length>Nc)throw new Error(n.errorPrefix_+"path specified exceeds the maximum depth that can be written ("+Nc+") or object contains a cycle "+$n(n))}function $n(n){return n.parts_.length===0?"":"in property '"+n.parts_.join(".")+"'"}/**
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
 */class Ba extends qu{constructor(){super(["visible"]);let e,t;typeof document<"u"&&typeof document.addEventListener<"u"&&(typeof document.hidden<"u"?(t="visibilitychange",e="hidden"):typeof document.mozHidden<"u"?(t="mozvisibilitychange",e="mozHidden"):typeof document.msHidden<"u"?(t="msvisibilitychange",e="msHidden"):typeof document.webkitHidden<"u"&&(t="webkitvisibilitychange",e="webkitHidden")),this.visible_=!0,t&&document.addEventListener(t,()=>{const s=!document[e];s!==this.visible_&&(this.visible_=s,this.trigger("visible",s))},!1)}static getInstance(){return new Ba}getInitialEvent(e){return H(e==="visible","Unknown event type: "+e),[this.visible_]}}/**
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
 */const Fs=1e3,Q_=60*5*1e3,Mc=30*1e3,J_=1.3,X_=3e4,Z_="server_kill",Dc=3;class Qt extends Gu{constructor(e,t,s,i,r,o,l,c){if(super(),this.repoInfo_=e,this.applicationId_=t,this.onDataUpdate_=s,this.onConnectStatus_=i,this.onServerInfoUpdate_=r,this.authTokenProvider_=o,this.appCheckTokenProvider_=l,this.authOverride_=c,this.id=Qt.nextPersistentConnectionId_++,this.log_=xi("p:"+this.id+":"),this.interruptReasons_={},this.listens=new Map,this.outstandingPuts_=[],this.outstandingGets_=[],this.outstandingPutCount_=0,this.outstandingGetCount_=0,this.onDisconnectRequestQueue_=[],this.connected_=!1,this.reconnectDelay_=Fs,this.maxReconnectDelay_=Q_,this.securityDebugCallback_=null,this.lastSessionId=null,this.establishConnectionTimer_=null,this.visible_=!1,this.requestCBHash_={},this.requestNumber_=0,this.realtime_=null,this.authToken_=null,this.appCheckToken_=null,this.forceTokenRefresh_=!1,this.invalidAuthTokenCount_=0,this.invalidAppCheckTokenCount_=0,this.firstConnection_=!0,this.lastConnectionAttemptTime_=null,this.lastConnectionEstablishedTime_=null,c)throw new Error("Auth override specified in options, but not supported on non Node.js platforms");Ba.getInstance().on("visible",this.onVisible_,this),e.host.indexOf("fblocal")===-1&&pr.getInstance().on("online",this.onOnline_,this)}sendRequest(e,t,s){const i=++this.requestNumber_,r={r:i,a:e,b:t};this.log_(je(r)),H(this.connected_,"sendRequest call when we're not connected not allowed."),this.realtime_.sendRequest(r),s&&(this.requestCBHash_[i]=s)}get(e){this.initConnection_();const t=new Dt,i={action:"g",request:{p:e._path.toString(),q:e._queryObject},onComplete:o=>{const l=o.d;o.s==="ok"?t.resolve(l):t.reject(l)}};this.outstandingGets_.push(i),this.outstandingGetCount_++;const r=this.outstandingGets_.length-1;return this.connected_&&this.sendGet_(r),t.promise}listen(e,t,s,i){this.initConnection_();const r=e._queryIdentifier,o=e._path.toString();this.log_("Listen called for "+o+" "+r),this.listens.has(o)||this.listens.set(o,new Map),H(e._queryParams.isDefault()||!e._queryParams.loadsAllData(),"listen() called for non-default but complete query"),H(!this.listens.get(o).has(r),"listen() called twice for same path/queryId.");const l={onComplete:i,hashFn:t,query:e,tag:s};this.listens.get(o).set(r,l),this.connected_&&this.sendListen_(l)}sendGet_(e){const t=this.outstandingGets_[e];this.sendRequest("g",t.request,s=>{delete this.outstandingGets_[e],this.outstandingGetCount_--,this.outstandingGetCount_===0&&(this.outstandingGets_=[]),t.onComplete&&t.onComplete(s)})}sendListen_(e){const t=e.query,s=t._path.toString(),i=t._queryIdentifier;this.log_("Listen on "+s+" for "+i);const r={p:s},o="q";e.tag&&(r.q=t._queryObject,r.t=e.tag),r.h=e.hashFn(),this.sendRequest(o,r,l=>{const c=l.d,d=l.s;Qt.warnOnListenWarnings_(c,t),(this.listens.get(s)&&this.listens.get(s).get(i))===e&&(this.log_("listen response",l),d!=="ok"&&this.removeListen_(s,i),e.onComplete&&e.onComplete(d,c))})}static warnOnListenWarnings_(e,t){if(e&&typeof e=="object"&&Wt(e,"w")){const s=ps(e,"w");if(Array.isArray(s)&&~s.indexOf("no_index")){const i='".indexOn": "'+t._queryParams.getIndex().toString()+'"',r=t._path.toString();st(`Using an unspecified index. Your data will be downloaded and filtered on the client. Consider adding ${i} at ${r} to your security rules for better performance.`)}}}refreshAuthToken(e){this.authToken_=e,this.log_("Auth token refreshed"),this.authToken_?this.tryAuth():this.connected_&&this.sendRequest("unauth",{},()=>{}),this.reduceReconnectDelayIfAdminCredential_(e)}reduceReconnectDelayIfAdminCredential_(e){(e&&e.length===40||Sp(e))&&(this.log_("Admin auth credential detected.  Reducing max reconnect time."),this.maxReconnectDelay_=Mc)}refreshAppCheckToken(e){this.appCheckToken_=e,this.log_("App check token refreshed"),this.appCheckToken_?this.tryAppCheck():this.connected_&&this.sendRequest("unappeck",{},()=>{})}tryAuth(){if(this.connected_&&this.authToken_){const e=this.authToken_,t=Ip(e)?"auth":"gauth",s={cred:e};this.authOverride_===null?s.noauth=!0:typeof this.authOverride_=="object"&&(s.authvar=this.authOverride_),this.sendRequest(t,s,i=>{const r=i.s,o=i.d||"error";this.authToken_===e&&(r==="ok"?this.invalidAuthTokenCount_=0:this.onAuthRevoked_(r,o))})}}tryAppCheck(){this.connected_&&this.appCheckToken_&&this.sendRequest("appcheck",{token:this.appCheckToken_},e=>{const t=e.s,s=e.d||"error";t==="ok"?this.invalidAppCheckTokenCount_=0:this.onAppCheckRevoked_(t,s)})}unlisten(e,t){const s=e._path.toString(),i=e._queryIdentifier;this.log_("Unlisten called for "+s+" "+i),H(e._queryParams.isDefault()||!e._queryParams.loadsAllData(),"unlisten() called for non-default but complete query"),this.removeListen_(s,i)&&this.connected_&&this.sendUnlisten_(s,i,e._queryObject,t)}sendUnlisten_(e,t,s,i){this.log_("Unlisten on "+e+" for "+t);const r={p:e},o="n";i&&(r.q=s,r.t=i),this.sendRequest(o,r)}onDisconnectPut(e,t,s){this.initConnection_(),this.connected_?this.sendOnDisconnect_("o",e,t,s):this.onDisconnectRequestQueue_.push({pathString:e,action:"o",data:t,onComplete:s})}onDisconnectMerge(e,t,s){this.initConnection_(),this.connected_?this.sendOnDisconnect_("om",e,t,s):this.onDisconnectRequestQueue_.push({pathString:e,action:"om",data:t,onComplete:s})}onDisconnectCancel(e,t){this.initConnection_(),this.connected_?this.sendOnDisconnect_("oc",e,null,t):this.onDisconnectRequestQueue_.push({pathString:e,action:"oc",data:null,onComplete:t})}sendOnDisconnect_(e,t,s,i){const r={p:t,d:s};this.log_("onDisconnect "+e,r),this.sendRequest(e,r,o=>{i&&setTimeout(()=>{i(o.s,o.d)},Math.floor(0))})}put(e,t,s,i){this.putInternal("p",e,t,s,i)}merge(e,t,s,i){this.putInternal("m",e,t,s,i)}putInternal(e,t,s,i,r){this.initConnection_();const o={p:t,d:s};r!==void 0&&(o.h=r),this.outstandingPuts_.push({action:e,request:o,onComplete:i}),this.outstandingPutCount_++;const l=this.outstandingPuts_.length-1;this.connected_?this.sendPut_(l):this.log_("Buffering put: "+t)}sendPut_(e){const t=this.outstandingPuts_[e].action,s=this.outstandingPuts_[e].request,i=this.outstandingPuts_[e].onComplete;this.outstandingPuts_[e].queued=this.connected_,this.sendRequest(t,s,r=>{this.log_(t+" response",r),delete this.outstandingPuts_[e],this.outstandingPutCount_--,this.outstandingPutCount_===0&&(this.outstandingPuts_=[]),i&&i(r.s,r.d)})}reportStats(e){if(this.connected_){const t={c:e};this.log_("reportStats",t),this.sendRequest("s",t,s=>{if(s.s!=="ok"){const r=s.d;this.log_("reportStats","Error sending stats: "+r)}})}}onDataMessage_(e){if("r"in e){this.log_("from server: "+je(e));const t=e.r,s=this.requestCBHash_[t];s&&(delete this.requestCBHash_[t],s(e.b))}else{if("error"in e)throw"A server-side error has occurred: "+e.error;"a"in e&&this.onDataPush_(e.a,e.b)}}onDataPush_(e,t){this.log_("handleServerMessage",e,t),e==="d"?this.onDataUpdate_(t.p,t.d,!1,t.t):e==="m"?this.onDataUpdate_(t.p,t.d,!0,t.t):e==="c"?this.onListenRevoked_(t.p,t.q):e==="ac"?this.onAuthRevoked_(t.s,t.d):e==="apc"?this.onAppCheckRevoked_(t.s,t.d):e==="sd"?this.onSecurityDebugPacket_(t):Wo("Unrecognized action received from server: "+je(e)+`
Are you using the latest client?`)}onReady_(e,t){this.log_("connection ready"),this.connected_=!0,this.lastConnectionEstablishedTime_=new Date().getTime(),this.handleTimestamp_(e),this.lastSessionId=t,this.firstConnection_&&this.sendConnectStats_(),this.restoreState_(),this.firstConnection_=!1,this.onConnectStatus_(!0)}scheduleConnect_(e){H(!this.realtime_,"Scheduling a connect when we're already connected/ing?"),this.establishConnectionTimer_&&clearTimeout(this.establishConnectionTimer_),this.establishConnectionTimer_=setTimeout(()=>{this.establishConnectionTimer_=null,this.establishConnection_()},Math.floor(e))}initConnection_(){!this.realtime_&&this.firstConnection_&&this.scheduleConnect_(0)}onVisible_(e){e&&!this.visible_&&this.reconnectDelay_===this.maxReconnectDelay_&&(this.log_("Window became visible.  Reducing delay."),this.reconnectDelay_=Fs,this.realtime_||this.scheduleConnect_(0)),this.visible_=e}onOnline_(e){e?(this.log_("Browser went online."),this.reconnectDelay_=Fs,this.realtime_||this.scheduleConnect_(0)):(this.log_("Browser went offline.  Killing connection."),this.realtime_&&this.realtime_.close())}onRealtimeDisconnect_(){if(this.log_("data client disconnected"),this.connected_=!1,this.realtime_=null,this.cancelSentTransactions_(),this.requestCBHash_={},this.shouldReconnect_()){this.visible_?this.lastConnectionEstablishedTime_&&(new Date().getTime()-this.lastConnectionEstablishedTime_>X_&&(this.reconnectDelay_=Fs),this.lastConnectionEstablishedTime_=null):(this.log_("Window isn't visible.  Delaying reconnect."),this.reconnectDelay_=this.maxReconnectDelay_,this.lastConnectionAttemptTime_=new Date().getTime());const e=new Date().getTime()-this.lastConnectionAttemptTime_;let t=Math.max(0,this.reconnectDelay_-e);t=Math.random()*t,this.log_("Trying to reconnect in "+t+"ms"),this.scheduleConnect_(t),this.reconnectDelay_=Math.min(this.maxReconnectDelay_,this.reconnectDelay_*J_)}this.onConnectStatus_(!1)}async establishConnection_(){if(this.shouldReconnect_()){this.log_("Making a connection attempt"),this.lastConnectionAttemptTime_=new Date().getTime(),this.lastConnectionEstablishedTime_=null;const e=this.onDataMessage_.bind(this),t=this.onReady_.bind(this),s=this.onRealtimeDisconnect_.bind(this),i=this.id+":"+Qt.nextConnectionId_++,r=this.lastSessionId;let o=!1,l=null;const c=function(){l?l.close():(o=!0,s())},d=function(u){H(l,"sendRequest call when we're not connected not allowed."),l.sendRequest(u)};this.realtime_={close:c,sendRequest:d};const h=this.forceTokenRefresh_;this.forceTokenRefresh_=!1;try{const[u,m]=await Promise.all([this.authTokenProvider_.getToken(h),this.appCheckTokenProvider_.getToken(h)]);o?qe("getToken() completed but was canceled"):(qe("getToken() completed. Creating connection."),this.authToken_=u&&u.accessToken,this.appCheckToken_=m&&m.token,l=new V_(i,this.repoInfo_,this.applicationId_,this.appCheckToken_,this.authToken_,e,t,s,f=>{st(f+" ("+this.repoInfo_.toString()+")"),this.interrupt(Z_)},r))}catch(u){this.log_("Failed to get token: "+u),o||(this.repoInfo_.nodeAdmin&&st(u),c())}}}interrupt(e){qe("Interrupting connection for reason: "+e),this.interruptReasons_[e]=!0,this.realtime_?this.realtime_.close():(this.establishConnectionTimer_&&(clearTimeout(this.establishConnectionTimer_),this.establishConnectionTimer_=null),this.connected_&&this.onRealtimeDisconnect_())}resume(e){qe("Resuming connection for reason: "+e),delete this.interruptReasons_[e],ir(this.interruptReasons_)&&(this.reconnectDelay_=Fs,this.realtime_||this.scheduleConnect_(0))}handleTimestamp_(e){const t=e-new Date().getTime();this.onServerInfoUpdate_({serverTimeOffset:t})}cancelSentTransactions_(){for(let e=0;e<this.outstandingPuts_.length;e++){const t=this.outstandingPuts_[e];t&&"h"in t.request&&t.queued&&(t.onComplete&&t.onComplete("disconnect"),delete this.outstandingPuts_[e],this.outstandingPutCount_--)}this.outstandingPutCount_===0&&(this.outstandingPuts_=[])}onListenRevoked_(e,t){let s;t?s=t.map(r=>Ma(r)).join("$"):s="default";const i=this.removeListen_(e,s);i&&i.onComplete&&i.onComplete("permission_denied")}removeListen_(e,t){const s=new Ce(e).toString();let i;if(this.listens.has(s)){const r=this.listens.get(s);i=r.get(t),r.delete(t),r.size===0&&this.listens.delete(s)}else i=void 0;return i}onAuthRevoked_(e,t){qe("Auth token revoked: "+e+"/"+t),this.authToken_=null,this.forceTokenRefresh_=!0,this.realtime_.close(),(e==="invalid_token"||e==="permission_denied")&&(this.invalidAuthTokenCount_++,this.invalidAuthTokenCount_>=Dc&&(this.reconnectDelay_=Mc,this.authTokenProvider_.notifyForInvalidToken()))}onAppCheckRevoked_(e,t){qe("App check token revoked: "+e+"/"+t),this.appCheckToken_=null,this.forceTokenRefresh_=!0,(e==="invalid_token"||e==="permission_denied")&&(this.invalidAppCheckTokenCount_++,this.invalidAppCheckTokenCount_>=Dc&&this.appCheckTokenProvider_.notifyForInvalidToken())}onSecurityDebugPacket_(e){this.securityDebugCallback_?this.securityDebugCallback_(e):"msg"in e&&console.log("FIREBASE: "+e.msg.replace(`
`,`
FIREBASE: `))}restoreState_(){this.tryAuth(),this.tryAppCheck();for(const e of this.listens.values())for(const t of e.values())this.sendListen_(t);for(let e=0;e<this.outstandingPuts_.length;e++)this.outstandingPuts_[e]&&this.sendPut_(e);for(;this.onDisconnectRequestQueue_.length;){const e=this.onDisconnectRequestQueue_.shift();this.sendOnDisconnect_(e.action,e.pathString,e.data,e.onComplete)}for(let e=0;e<this.outstandingGets_.length;e++)this.outstandingGets_[e]&&this.sendGet_(e)}sendConnectStats_(){const e={};let t="js";e["sdk."+t+"."+Iu.replace(/\./g,"-")]=1,wa()?e["framework.cordova"]=1:Ld()&&(e["framework.reactnative"]=1),this.reportStats(e)}shouldReconnect_(){const e=pr.getInstance().currentlyOnline();return ir(this.interruptReasons_)&&e}}Qt.nextPersistentConnectionId_=0;Qt.nextConnectionId_=0;/**
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
 */class ye{constructor(e,t){this.name=e,this.node=t}static Wrap(e,t){return new ye(e,t)}}/**
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
 */class Fr{getCompare(){return this.compare.bind(this)}indexedValueChanged(e,t){const s=new ye(Yn,e),i=new ye(Yn,t);return this.compare(s,i)!==0}minPost(){return ye.MIN}}/**
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
 */let ji;class Qu extends Fr{static get __EMPTY_NODE(){return ji}static set __EMPTY_NODE(e){ji=e}compare(e,t){return es(e.name,t.name)}isDefinedOn(e){throw Ss("KeyIndex.isDefinedOn not expected to be called.")}indexedValueChanged(e,t){return!1}minPost(){return ye.MIN}maxPost(){return new ye(En,ji)}makePost(e,t){return H(typeof e=="string","KeyIndex indexValue must always be a string."),new ye(e,ji)}toString(){return".key"}}const Wn=new Qu;/**
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
 */class Vi{constructor(e,t,s,i,r=null){this.isReverse_=i,this.resultGenerator_=r,this.nodeStack_=[];let o=1;for(;!e.isEmpty();)if(e=e,o=t?s(e.key,t):1,i&&(o*=-1),o<0)this.isReverse_?e=e.left:e=e.right;else if(o===0){this.nodeStack_.push(e);break}else this.nodeStack_.push(e),this.isReverse_?e=e.right:e=e.left}getNext(){if(this.nodeStack_.length===0)return null;let e=this.nodeStack_.pop(),t;if(this.resultGenerator_?t=this.resultGenerator_(e.key,e.value):t={key:e.key,value:e.value},this.isReverse_)for(e=e.left;!e.isEmpty();)this.nodeStack_.push(e),e=e.right;else for(e=e.right;!e.isEmpty();)this.nodeStack_.push(e),e=e.left;return t}hasNext(){return this.nodeStack_.length>0}peek(){if(this.nodeStack_.length===0)return null;const e=this.nodeStack_[this.nodeStack_.length-1];return this.resultGenerator_?this.resultGenerator_(e.key,e.value):{key:e.key,value:e.value}}}class Ge{constructor(e,t,s,i,r){this.key=e,this.value=t,this.color=s??Ge.RED,this.left=i??ft.EMPTY_NODE,this.right=r??ft.EMPTY_NODE}copy(e,t,s,i,r){return new Ge(e??this.key,t??this.value,s??this.color,i??this.left,r??this.right)}count(){return this.left.count()+1+this.right.count()}isEmpty(){return!1}inorderTraversal(e){return this.left.inorderTraversal(e)||!!e(this.key,this.value)||this.right.inorderTraversal(e)}reverseTraversal(e){return this.right.reverseTraversal(e)||e(this.key,this.value)||this.left.reverseTraversal(e)}min_(){return this.left.isEmpty()?this:this.left.min_()}minKey(){return this.min_().key}maxKey(){return this.right.isEmpty()?this.key:this.right.maxKey()}insert(e,t,s){let i=this;const r=s(e,i.key);return r<0?i=i.copy(null,null,null,i.left.insert(e,t,s),null):r===0?i=i.copy(null,t,null,null,null):i=i.copy(null,null,null,null,i.right.insert(e,t,s)),i.fixUp_()}removeMin_(){if(this.left.isEmpty())return ft.EMPTY_NODE;let e=this;return!e.left.isRed_()&&!e.left.left.isRed_()&&(e=e.moveRedLeft_()),e=e.copy(null,null,null,e.left.removeMin_(),null),e.fixUp_()}remove(e,t){let s,i;if(s=this,t(e,s.key)<0)!s.left.isEmpty()&&!s.left.isRed_()&&!s.left.left.isRed_()&&(s=s.moveRedLeft_()),s=s.copy(null,null,null,s.left.remove(e,t),null);else{if(s.left.isRed_()&&(s=s.rotateRight_()),!s.right.isEmpty()&&!s.right.isRed_()&&!s.right.left.isRed_()&&(s=s.moveRedRight_()),t(e,s.key)===0){if(s.right.isEmpty())return ft.EMPTY_NODE;i=s.right.min_(),s=s.copy(i.key,i.value,null,null,s.right.removeMin_())}s=s.copy(null,null,null,null,s.right.remove(e,t))}return s.fixUp_()}isRed_(){return this.color}fixUp_(){let e=this;return e.right.isRed_()&&!e.left.isRed_()&&(e=e.rotateLeft_()),e.left.isRed_()&&e.left.left.isRed_()&&(e=e.rotateRight_()),e.left.isRed_()&&e.right.isRed_()&&(e=e.colorFlip_()),e}moveRedLeft_(){let e=this.colorFlip_();return e.right.left.isRed_()&&(e=e.copy(null,null,null,null,e.right.rotateRight_()),e=e.rotateLeft_(),e=e.colorFlip_()),e}moveRedRight_(){let e=this.colorFlip_();return e.left.left.isRed_()&&(e=e.rotateRight_(),e=e.colorFlip_()),e}rotateLeft_(){const e=this.copy(null,null,Ge.RED,null,this.right.left);return this.right.copy(null,null,this.color,e,null)}rotateRight_(){const e=this.copy(null,null,Ge.RED,this.left.right,null);return this.left.copy(null,null,this.color,null,e)}colorFlip_(){const e=this.left.copy(null,null,!this.left.color,null,null),t=this.right.copy(null,null,!this.right.color,null,null);return this.copy(null,null,!this.color,e,t)}checkMaxDepth_(){const e=this.check_();return Math.pow(2,e)<=this.count()+1}check_(){if(this.isRed_()&&this.left.isRed_())throw new Error("Red node has red child("+this.key+","+this.value+")");if(this.right.isRed_())throw new Error("Right child of ("+this.key+","+this.value+") is red");const e=this.left.check_();if(e!==this.right.check_())throw new Error("Black depths differ");return e+(this.isRed_()?0:1)}}Ge.RED=!0;Ge.BLACK=!1;class ev{copy(e,t,s,i,r){return this}insert(e,t,s){return new Ge(e,t,null)}remove(e,t){return this}count(){return 0}isEmpty(){return!0}inorderTraversal(e){return!1}reverseTraversal(e){return!1}minKey(){return null}maxKey(){return null}check_(){return 0}isRed_(){return!1}}class ft{constructor(e,t=ft.EMPTY_NODE){this.comparator_=e,this.root_=t}insert(e,t){return new ft(this.comparator_,this.root_.insert(e,t,this.comparator_).copy(null,null,Ge.BLACK,null,null))}remove(e){return new ft(this.comparator_,this.root_.remove(e,this.comparator_).copy(null,null,Ge.BLACK,null,null))}get(e){let t,s=this.root_;for(;!s.isEmpty();){if(t=this.comparator_(e,s.key),t===0)return s.value;t<0?s=s.left:t>0&&(s=s.right)}return null}getPredecessorKey(e){let t,s=this.root_,i=null;for(;!s.isEmpty();)if(t=this.comparator_(e,s.key),t===0){if(s.left.isEmpty())return i?i.key:null;for(s=s.left;!s.right.isEmpty();)s=s.right;return s.key}else t<0?s=s.left:t>0&&(i=s,s=s.right);throw new Error("Attempted to find predecessor key for a nonexistent key.  What gives?")}isEmpty(){return this.root_.isEmpty()}count(){return this.root_.count()}minKey(){return this.root_.minKey()}maxKey(){return this.root_.maxKey()}inorderTraversal(e){return this.root_.inorderTraversal(e)}reverseTraversal(e){return this.root_.reverseTraversal(e)}getIterator(e){return new Vi(this.root_,null,this.comparator_,!1,e)}getIteratorFrom(e,t){return new Vi(this.root_,e,this.comparator_,!1,t)}getReverseIteratorFrom(e,t){return new Vi(this.root_,e,this.comparator_,!0,t)}getReverseIterator(e){return new Vi(this.root_,null,this.comparator_,!0,e)}}ft.EMPTY_NODE=new ev;/**
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
 */function tv(n,e){return es(n.name,e.name)}function Wa(n,e){return es(n,e)}/**
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
 */let jo;function nv(n){jo=n}const Ju=function(n){return typeof n=="number"?"number:"+Au(n):"string:"+n},Xu=function(n){if(n.isLeafNode()){const e=n.val();H(typeof e=="string"||typeof e=="number"||typeof e=="object"&&Wt(e,".sv"),"Priority must be a string or number.")}else H(n===jo||n.isEmpty(),"priority of unexpected type.");H(n===jo||n.getPriority().isEmpty(),"Priority nodes can't have a priority of their own.")};/**
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
 */let Lc;class ze{constructor(e,t=ze.__childrenNodeConstructor.EMPTY_NODE){this.value_=e,this.priorityNode_=t,this.lazyHash_=null,H(this.value_!==void 0&&this.value_!==null,"LeafNode shouldn't be created with null/undefined value."),Xu(this.priorityNode_)}static set __childrenNodeConstructor(e){Lc=e}static get __childrenNodeConstructor(){return Lc}isLeafNode(){return!0}getPriority(){return this.priorityNode_}updatePriority(e){return new ze(this.value_,e)}getImmediateChild(e){return e===".priority"?this.priorityNode_:ze.__childrenNodeConstructor.EMPTY_NODE}getChild(e){return ge(e)?this:me(e)===".priority"?this.priorityNode_:ze.__childrenNodeConstructor.EMPTY_NODE}hasChild(){return!1}getPredecessorChildName(e,t){return null}updateImmediateChild(e,t){return e===".priority"?this.updatePriority(t):t.isEmpty()&&e!==".priority"?this:ze.__childrenNodeConstructor.EMPTY_NODE.updateImmediateChild(e,t).updatePriority(this.priorityNode_)}updateChild(e,t){const s=me(e);return s===null?t:t.isEmpty()&&s!==".priority"?this:(H(s!==".priority"||kn(e)===1,".priority must be the last token in a path"),this.updateImmediateChild(s,ze.__childrenNodeConstructor.EMPTY_NODE.updateChild(Ie(e),t)))}isEmpty(){return!1}numChildren(){return 0}forEachChild(e,t){return!1}val(e){return e&&!this.getPriority().isEmpty()?{".value":this.getValue(),".priority":this.getPriority().val()}:this.getValue()}hash(){if(this.lazyHash_===null){let e="";this.priorityNode_.isEmpty()||(e+="priority:"+Ju(this.priorityNode_.val())+":");const t=typeof this.value_;e+=t+":",t==="number"?e+=Au(this.value_):e+=this.value_,this.lazyHash_=Tu(e)}return this.lazyHash_}getValue(){return this.value_}compareTo(e){return e===ze.__childrenNodeConstructor.EMPTY_NODE?1:e instanceof ze.__childrenNodeConstructor?-1:(H(e.isLeafNode(),"Unknown node type"),this.compareToLeafNode_(e))}compareToLeafNode_(e){const t=typeof e.value_,s=typeof this.value_,i=ze.VALUE_TYPE_ORDER.indexOf(t),r=ze.VALUE_TYPE_ORDER.indexOf(s);return H(i>=0,"Unknown leaf type: "+t),H(r>=0,"Unknown leaf type: "+s),i===r?s==="object"?0:this.value_<e.value_?-1:this.value_===e.value_?0:1:r-i}withIndex(){return this}isIndexed(){return!0}equals(e){if(e===this)return!0;if(e.isLeafNode()){const t=e;return this.value_===t.value_&&this.priorityNode_.equals(t.priorityNode_)}else return!1}}ze.VALUE_TYPE_ORDER=["object","boolean","number","string"];/**
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
 */let Zu,eh;function sv(n){Zu=n}function iv(n){eh=n}class rv extends Fr{compare(e,t){const s=e.node.getPriority(),i=t.node.getPriority(),r=s.compareTo(i);return r===0?es(e.name,t.name):r}isDefinedOn(e){return!e.getPriority().isEmpty()}indexedValueChanged(e,t){return!e.getPriority().equals(t.getPriority())}minPost(){return ye.MIN}maxPost(){return new ye(En,new ze("[PRIORITY-POST]",eh))}makePost(e,t){const s=Zu(e);return new ye(t,new ze("[PRIORITY-POST]",s))}toString(){return".priority"}}const Ne=new rv;/**
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
 */const ov=Math.log(2);class av{constructor(e){const t=r=>parseInt(Math.log(r)/ov,10),s=r=>parseInt(Array(r+1).join("1"),2);this.count=t(e+1),this.current_=this.count-1;const i=s(this.count);this.bits_=e+1&i}nextBitIsOne(){const e=!(this.bits_&1<<this.current_);return this.current_--,e}}const mr=function(n,e,t,s){n.sort(e);const i=function(c,d){const h=d-c;let u,m;if(h===0)return null;if(h===1)return u=n[c],m=t?t(u):u,new Ge(m,u.node,Ge.BLACK,null,null);{const f=parseInt(h/2,10)+c,y=i(c,f),w=i(f+1,d);return u=n[f],m=t?t(u):u,new Ge(m,u.node,Ge.BLACK,y,w)}},r=function(c){let d=null,h=null,u=n.length;const m=function(y,w){const E=u-y,x=u;u-=y;const _=i(E+1,x),U=n[E],M=t?t(U):U;f(new Ge(M,U.node,w,null,_))},f=function(y){d?(d.left=y,d=y):(h=y,d=y)};for(let y=0;y<c.count;++y){const w=c.nextBitIsOne(),E=Math.pow(2,c.count-(y+1));w?m(E,Ge.BLACK):(m(E,Ge.BLACK),m(E,Ge.RED))}return h},o=new av(n.length),l=r(o);return new ft(s||e,l)};/**
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
 */let bo;const ss={};class Kt{constructor(e,t){this.indexes_=e,this.indexSet_=t}static get Default(){return H(ss&&Ne,"ChildrenNode.ts has not been loaded"),bo=bo||new Kt({".priority":ss},{".priority":Ne}),bo}get(e){const t=ps(this.indexes_,e);if(!t)throw new Error("No index defined for "+e);return t instanceof ft?t:null}hasIndex(e){return Wt(this.indexSet_,e.toString())}addIndex(e,t){H(e!==Wn,"KeyIndex always exists and isn't meant to be added to the IndexMap.");const s=[];let i=!1;const r=t.getIterator(ye.Wrap);let o=r.getNext();for(;o;)i=i||e.isDefinedOn(o.node),s.push(o),o=r.getNext();let l;i?l=mr(s,e.getCompare()):l=ss;const c=e.toString(),d=Object.assign({},this.indexSet_);d[c]=e;const h=Object.assign({},this.indexes_);return h[c]=l,new Kt(h,d)}addToIndexes(e,t){const s=rr(this.indexes_,(i,r)=>{const o=ps(this.indexSet_,r);if(H(o,"Missing index implementation for "+r),i===ss)if(o.isDefinedOn(e.node)){const l=[],c=t.getIterator(ye.Wrap);let d=c.getNext();for(;d;)d.name!==e.name&&l.push(d),d=c.getNext();return l.push(e),mr(l,o.getCompare())}else return ss;else{const l=t.get(e.name);let c=i;return l&&(c=c.remove(new ye(e.name,l))),c.insert(e,e.node)}});return new Kt(s,this.indexSet_)}removeFromIndexes(e,t){const s=rr(this.indexes_,i=>{if(i===ss)return i;{const r=t.get(e.name);return r?i.remove(new ye(e.name,r)):i}});return new Kt(s,this.indexSet_)}}/**
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
 */let Us;class ce{constructor(e,t,s){this.children_=e,this.priorityNode_=t,this.indexMap_=s,this.lazyHash_=null,this.priorityNode_&&Xu(this.priorityNode_),this.children_.isEmpty()&&H(!this.priorityNode_||this.priorityNode_.isEmpty(),"An empty node cannot have a priority")}static get EMPTY_NODE(){return Us||(Us=new ce(new ft(Wa),null,Kt.Default))}isLeafNode(){return!1}getPriority(){return this.priorityNode_||Us}updatePriority(e){return this.children_.isEmpty()?this:new ce(this.children_,e,this.indexMap_)}getImmediateChild(e){if(e===".priority")return this.getPriority();{const t=this.children_.get(e);return t===null?Us:t}}getChild(e){const t=me(e);return t===null?this:this.getImmediateChild(t).getChild(Ie(e))}hasChild(e){return this.children_.get(e)!==null}updateImmediateChild(e,t){if(H(t,"We should always be passing snapshot nodes"),e===".priority")return this.updatePriority(t);{const s=new ye(e,t);let i,r;t.isEmpty()?(i=this.children_.remove(e),r=this.indexMap_.removeFromIndexes(s,this.children_)):(i=this.children_.insert(e,t),r=this.indexMap_.addToIndexes(s,this.children_));const o=i.isEmpty()?Us:this.priorityNode_;return new ce(i,o,r)}}updateChild(e,t){const s=me(e);if(s===null)return t;{H(me(e)!==".priority"||kn(e)===1,".priority must be the last token in a path");const i=this.getImmediateChild(s).updateChild(Ie(e),t);return this.updateImmediateChild(s,i)}}isEmpty(){return this.children_.isEmpty()}numChildren(){return this.children_.count()}val(e){if(this.isEmpty())return null;const t={};let s=0,i=0,r=!0;if(this.forEachChild(Ne,(o,l)=>{t[o]=l.val(e),s++,r&&ce.INTEGER_REGEXP_.test(o)?i=Math.max(i,Number(o)):r=!1}),!e&&r&&i<2*s){const o=[];for(const l in t)o[l]=t[l];return o}else return e&&!this.getPriority().isEmpty()&&(t[".priority"]=this.getPriority().val()),t}hash(){if(this.lazyHash_===null){let e="";this.getPriority().isEmpty()||(e+="priority:"+Ju(this.getPriority().val())+":"),this.forEachChild(Ne,(t,s)=>{const i=s.hash();i!==""&&(e+=":"+t+":"+i)}),this.lazyHash_=e===""?"":Tu(e)}return this.lazyHash_}getPredecessorChildName(e,t,s){const i=this.resolveIndex_(s);if(i){const r=i.getPredecessorKey(new ye(e,t));return r?r.name:null}else return this.children_.getPredecessorKey(e)}getFirstChildName(e){const t=this.resolveIndex_(e);if(t){const s=t.minKey();return s&&s.name}else return this.children_.minKey()}getFirstChild(e){const t=this.getFirstChildName(e);return t?new ye(t,this.children_.get(t)):null}getLastChildName(e){const t=this.resolveIndex_(e);if(t){const s=t.maxKey();return s&&s.name}else return this.children_.maxKey()}getLastChild(e){const t=this.getLastChildName(e);return t?new ye(t,this.children_.get(t)):null}forEachChild(e,t){const s=this.resolveIndex_(e);return s?s.inorderTraversal(i=>t(i.name,i.node)):this.children_.inorderTraversal(t)}getIterator(e){return this.getIteratorFrom(e.minPost(),e)}getIteratorFrom(e,t){const s=this.resolveIndex_(t);if(s)return s.getIteratorFrom(e,i=>i);{const i=this.children_.getIteratorFrom(e.name,ye.Wrap);let r=i.peek();for(;r!=null&&t.compare(r,e)<0;)i.getNext(),r=i.peek();return i}}getReverseIterator(e){return this.getReverseIteratorFrom(e.maxPost(),e)}getReverseIteratorFrom(e,t){const s=this.resolveIndex_(t);if(s)return s.getReverseIteratorFrom(e,i=>i);{const i=this.children_.getReverseIteratorFrom(e.name,ye.Wrap);let r=i.peek();for(;r!=null&&t.compare(r,e)>0;)i.getNext(),r=i.peek();return i}}compareTo(e){return this.isEmpty()?e.isEmpty()?0:-1:e.isLeafNode()||e.isEmpty()?1:e===Ai?-1:0}withIndex(e){if(e===Wn||this.indexMap_.hasIndex(e))return this;{const t=this.indexMap_.addIndex(e,this.children_);return new ce(this.children_,this.priorityNode_,t)}}isIndexed(e){return e===Wn||this.indexMap_.hasIndex(e)}equals(e){if(e===this)return!0;if(e.isLeafNode())return!1;{const t=e;if(this.getPriority().equals(t.getPriority()))if(this.children_.count()===t.children_.count()){const s=this.getIterator(Ne),i=t.getIterator(Ne);let r=s.getNext(),o=i.getNext();for(;r&&o;){if(r.name!==o.name||!r.node.equals(o.node))return!1;r=s.getNext(),o=i.getNext()}return r===null&&o===null}else return!1;else return!1}}resolveIndex_(e){return e===Wn?null:this.indexMap_.get(e.toString())}}ce.INTEGER_REGEXP_=/^(0|[1-9]\d*)$/;class lv extends ce{constructor(){super(new ft(Wa),ce.EMPTY_NODE,Kt.Default)}compareTo(e){return e===this?0:1}equals(e){return e===this}getPriority(){return this}getImmediateChild(e){return ce.EMPTY_NODE}isEmpty(){return!1}}const Ai=new lv;Object.defineProperties(ye,{MIN:{value:new ye(Yn,ce.EMPTY_NODE)},MAX:{value:new ye(En,Ai)}});Qu.__EMPTY_NODE=ce.EMPTY_NODE;ze.__childrenNodeConstructor=ce;nv(Ai);iv(Ai);/**
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
 */const cv=!0;function Le(n,e=null){if(n===null)return ce.EMPTY_NODE;if(typeof n=="object"&&".priority"in n&&(e=n[".priority"]),H(e===null||typeof e=="string"||typeof e=="number"||typeof e=="object"&&".sv"in e,"Invalid priority type found: "+typeof e),typeof n=="object"&&".value"in n&&n[".value"]!==null&&(n=n[".value"]),typeof n!="object"||".sv"in n){const t=n;return new ze(t,Le(e))}if(!(n instanceof Array)&&cv){const t=[];let s=!1;if(Ye(n,(o,l)=>{if(o.substring(0,1)!=="."){const c=Le(l);c.isEmpty()||(s=s||!c.getPriority().isEmpty(),t.push(new ye(o,c)))}}),t.length===0)return ce.EMPTY_NODE;const r=mr(t,tv,o=>o.name,Wa);if(s){const o=mr(t,Ne.getCompare());return new ce(r,Le(e),new Kt({".priority":o},{".priority":Ne}))}else return new ce(r,Le(e),Kt.Default)}else{let t=ce.EMPTY_NODE;return Ye(n,(s,i)=>{if(Wt(n,s)&&s.substring(0,1)!=="."){const r=Le(i);(r.isLeafNode()||!r.isEmpty())&&(t=t.updateImmediateChild(s,r))}}),t.updatePriority(Le(e))}}sv(Le);/**
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
 */class Ha extends Fr{constructor(e){super(),this.indexPath_=e,H(!ge(e)&&me(e)!==".priority","Can't create PathIndex with empty path or .priority key")}extractChild(e){return e.getChild(this.indexPath_)}isDefinedOn(e){return!e.getChild(this.indexPath_).isEmpty()}compare(e,t){const s=this.extractChild(e.node),i=this.extractChild(t.node),r=s.compareTo(i);return r===0?es(e.name,t.name):r}makePost(e,t){const s=Le(e),i=ce.EMPTY_NODE.updateChild(this.indexPath_,s);return new ye(t,i)}maxPost(){const e=ce.EMPTY_NODE.updateChild(this.indexPath_,Ai);return new ye(En,e)}toString(){return ci(this.indexPath_,0).join("/")}}/**
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
 */class dv extends Fr{compare(e,t){const s=e.node.compareTo(t.node);return s===0?es(e.name,t.name):s}isDefinedOn(e){return!0}indexedValueChanged(e,t){return!e.equals(t)}minPost(){return ye.MIN}maxPost(){return ye.MAX}makePost(e,t){const s=Le(e);return new ye(t,s)}toString(){return".value"}}const th=new dv;/**
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
 */function nh(n){return{type:"value",snapshotNode:n}}function _s(n,e){return{type:"child_added",snapshotNode:e,childName:n}}function di(n,e){return{type:"child_removed",snapshotNode:e,childName:n}}function ui(n,e,t){return{type:"child_changed",snapshotNode:e,childName:n,oldSnap:t}}function uv(n,e){return{type:"child_moved",snapshotNode:e,childName:n}}/**
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
 */class ja{constructor(e){this.index_=e}updateChild(e,t,s,i,r,o){H(e.isIndexed(this.index_),"A node must be indexed if only a child is updated");const l=e.getImmediateChild(t);return l.getChild(i).equals(s.getChild(i))&&l.isEmpty()===s.isEmpty()||(o!=null&&(s.isEmpty()?e.hasChild(t)?o.trackChildChange(di(t,l)):H(e.isLeafNode(),"A child remove without an old child only makes sense on a leaf node"):l.isEmpty()?o.trackChildChange(_s(t,s)):o.trackChildChange(ui(t,s,l))),e.isLeafNode()&&s.isEmpty())?e:e.updateImmediateChild(t,s).withIndex(this.index_)}updateFullNode(e,t,s){return s!=null&&(e.isLeafNode()||e.forEachChild(Ne,(i,r)=>{t.hasChild(i)||s.trackChildChange(di(i,r))}),t.isLeafNode()||t.forEachChild(Ne,(i,r)=>{if(e.hasChild(i)){const o=e.getImmediateChild(i);o.equals(r)||s.trackChildChange(ui(i,r,o))}else s.trackChildChange(_s(i,r))})),t.withIndex(this.index_)}updatePriority(e,t){return e.isEmpty()?ce.EMPTY_NODE:e.updatePriority(t)}filtersNodes(){return!1}getIndexedFilter(){return this}getIndex(){return this.index_}}/**
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
 */class hi{constructor(e){this.indexedFilter_=new ja(e.getIndex()),this.index_=e.getIndex(),this.startPost_=hi.getStartPost_(e),this.endPost_=hi.getEndPost_(e),this.startIsInclusive_=!e.startAfterSet_,this.endIsInclusive_=!e.endBeforeSet_}getStartPost(){return this.startPost_}getEndPost(){return this.endPost_}matches(e){const t=this.startIsInclusive_?this.index_.compare(this.getStartPost(),e)<=0:this.index_.compare(this.getStartPost(),e)<0,s=this.endIsInclusive_?this.index_.compare(e,this.getEndPost())<=0:this.index_.compare(e,this.getEndPost())<0;return t&&s}updateChild(e,t,s,i,r,o){return this.matches(new ye(t,s))||(s=ce.EMPTY_NODE),this.indexedFilter_.updateChild(e,t,s,i,r,o)}updateFullNode(e,t,s){t.isLeafNode()&&(t=ce.EMPTY_NODE);let i=t.withIndex(this.index_);i=i.updatePriority(ce.EMPTY_NODE);const r=this;return t.forEachChild(Ne,(o,l)=>{r.matches(new ye(o,l))||(i=i.updateImmediateChild(o,ce.EMPTY_NODE))}),this.indexedFilter_.updateFullNode(e,i,s)}updatePriority(e,t){return e}filtersNodes(){return!0}getIndexedFilter(){return this.indexedFilter_}getIndex(){return this.index_}static getStartPost_(e){if(e.hasStart()){const t=e.getIndexStartName();return e.getIndex().makePost(e.getIndexStartValue(),t)}else return e.getIndex().minPost()}static getEndPost_(e){if(e.hasEnd()){const t=e.getIndexEndName();return e.getIndex().makePost(e.getIndexEndValue(),t)}else return e.getIndex().maxPost()}}/**
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
 */class hv{constructor(e){this.withinDirectionalStart=t=>this.reverse_?this.withinEndPost(t):this.withinStartPost(t),this.withinDirectionalEnd=t=>this.reverse_?this.withinStartPost(t):this.withinEndPost(t),this.withinStartPost=t=>{const s=this.index_.compare(this.rangedFilter_.getStartPost(),t);return this.startIsInclusive_?s<=0:s<0},this.withinEndPost=t=>{const s=this.index_.compare(t,this.rangedFilter_.getEndPost());return this.endIsInclusive_?s<=0:s<0},this.rangedFilter_=new hi(e),this.index_=e.getIndex(),this.limit_=e.getLimit(),this.reverse_=!e.isViewFromLeft(),this.startIsInclusive_=!e.startAfterSet_,this.endIsInclusive_=!e.endBeforeSet_}updateChild(e,t,s,i,r,o){return this.rangedFilter_.matches(new ye(t,s))||(s=ce.EMPTY_NODE),e.getImmediateChild(t).equals(s)?e:e.numChildren()<this.limit_?this.rangedFilter_.getIndexedFilter().updateChild(e,t,s,i,r,o):this.fullLimitUpdateChild_(e,t,s,r,o)}updateFullNode(e,t,s){let i;if(t.isLeafNode()||t.isEmpty())i=ce.EMPTY_NODE.withIndex(this.index_);else if(this.limit_*2<t.numChildren()&&t.isIndexed(this.index_)){i=ce.EMPTY_NODE.withIndex(this.index_);let r;this.reverse_?r=t.getReverseIteratorFrom(this.rangedFilter_.getEndPost(),this.index_):r=t.getIteratorFrom(this.rangedFilter_.getStartPost(),this.index_);let o=0;for(;r.hasNext()&&o<this.limit_;){const l=r.getNext();if(this.withinDirectionalStart(l))if(this.withinDirectionalEnd(l))i=i.updateImmediateChild(l.name,l.node),o++;else break;else continue}}else{i=t.withIndex(this.index_),i=i.updatePriority(ce.EMPTY_NODE);let r;this.reverse_?r=i.getReverseIterator(this.index_):r=i.getIterator(this.index_);let o=0;for(;r.hasNext();){const l=r.getNext();o<this.limit_&&this.withinDirectionalStart(l)&&this.withinDirectionalEnd(l)?o++:i=i.updateImmediateChild(l.name,ce.EMPTY_NODE)}}return this.rangedFilter_.getIndexedFilter().updateFullNode(e,i,s)}updatePriority(e,t){return e}filtersNodes(){return!0}getIndexedFilter(){return this.rangedFilter_.getIndexedFilter()}getIndex(){return this.index_}fullLimitUpdateChild_(e,t,s,i,r){let o;if(this.reverse_){const u=this.index_.getCompare();o=(m,f)=>u(f,m)}else o=this.index_.getCompare();const l=e;H(l.numChildren()===this.limit_,"");const c=new ye(t,s),d=this.reverse_?l.getFirstChild(this.index_):l.getLastChild(this.index_),h=this.rangedFilter_.matches(c);if(l.hasChild(t)){const u=l.getImmediateChild(t);let m=i.getChildAfterChild(this.index_,d,this.reverse_);for(;m!=null&&(m.name===t||l.hasChild(m.name));)m=i.getChildAfterChild(this.index_,m,this.reverse_);const f=m==null?1:o(m,c);if(h&&!s.isEmpty()&&f>=0)return r!=null&&r.trackChildChange(ui(t,s,u)),l.updateImmediateChild(t,s);{r!=null&&r.trackChildChange(di(t,u));const w=l.updateImmediateChild(t,ce.EMPTY_NODE);return m!=null&&this.rangedFilter_.matches(m)?(r!=null&&r.trackChildChange(_s(m.name,m.node)),w.updateImmediateChild(m.name,m.node)):w}}else return s.isEmpty()?e:h&&o(d,c)>=0?(r!=null&&(r.trackChildChange(di(d.name,d.node)),r.trackChildChange(_s(t,s))),l.updateImmediateChild(t,s).updateImmediateChild(d.name,ce.EMPTY_NODE)):e}}/**
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
 */class Va{constructor(){this.limitSet_=!1,this.startSet_=!1,this.startNameSet_=!1,this.startAfterSet_=!1,this.endSet_=!1,this.endNameSet_=!1,this.endBeforeSet_=!1,this.limit_=0,this.viewFrom_="",this.indexStartValue_=null,this.indexStartName_="",this.indexEndValue_=null,this.indexEndName_="",this.index_=Ne}hasStart(){return this.startSet_}isViewFromLeft(){return this.viewFrom_===""?this.startSet_:this.viewFrom_==="l"}getIndexStartValue(){return H(this.startSet_,"Only valid if start has been set"),this.indexStartValue_}getIndexStartName(){return H(this.startSet_,"Only valid if start has been set"),this.startNameSet_?this.indexStartName_:Yn}hasEnd(){return this.endSet_}getIndexEndValue(){return H(this.endSet_,"Only valid if end has been set"),this.indexEndValue_}getIndexEndName(){return H(this.endSet_,"Only valid if end has been set"),this.endNameSet_?this.indexEndName_:En}hasLimit(){return this.limitSet_}hasAnchoredLimit(){return this.limitSet_&&this.viewFrom_!==""}getLimit(){return H(this.limitSet_,"Only valid if limit has been set"),this.limit_}getIndex(){return this.index_}loadsAllData(){return!(this.startSet_||this.endSet_||this.limitSet_)}isDefault(){return this.loadsAllData()&&this.index_===Ne}copy(){const e=new Va;return e.limitSet_=this.limitSet_,e.limit_=this.limit_,e.startSet_=this.startSet_,e.startAfterSet_=this.startAfterSet_,e.indexStartValue_=this.indexStartValue_,e.startNameSet_=this.startNameSet_,e.indexStartName_=this.indexStartName_,e.endSet_=this.endSet_,e.endBeforeSet_=this.endBeforeSet_,e.indexEndValue_=this.indexEndValue_,e.endNameSet_=this.endNameSet_,e.indexEndName_=this.indexEndName_,e.index_=this.index_,e.viewFrom_=this.viewFrom_,e}}function fv(n){return n.loadsAllData()?new ja(n.getIndex()):n.hasLimit()?new hv(n):new hi(n)}function pv(n,e){const t=n.copy();return t.limitSet_=!0,t.limit_=e,t.viewFrom_="r",t}function mv(n,e){const t=n.copy();return t.index_=e,t}function $c(n){const e={};if(n.isDefault())return e;let t;if(n.index_===Ne?t="$priority":n.index_===th?t="$value":n.index_===Wn?t="$key":(H(n.index_ instanceof Ha,"Unrecognized index type!"),t=n.index_.toString()),e.orderBy=je(t),n.startSet_){const s=n.startAfterSet_?"startAfter":"startAt";e[s]=je(n.indexStartValue_),n.startNameSet_&&(e[s]+=","+je(n.indexStartName_))}if(n.endSet_){const s=n.endBeforeSet_?"endBefore":"endAt";e[s]=je(n.indexEndValue_),n.endNameSet_&&(e[s]+=","+je(n.indexEndName_))}return n.limitSet_&&(n.isViewFromLeft()?e.limitToFirst=n.limit_:e.limitToLast=n.limit_),e}function Fc(n){const e={};if(n.startSet_&&(e.sp=n.indexStartValue_,n.startNameSet_&&(e.sn=n.indexStartName_),e.sin=!n.startAfterSet_),n.endSet_&&(e.ep=n.indexEndValue_,n.endNameSet_&&(e.en=n.indexEndName_),e.ein=!n.endBeforeSet_),n.limitSet_){e.l=n.limit_;let t=n.viewFrom_;t===""&&(n.isViewFromLeft()?t="l":t="r"),e.vf=t}return n.index_!==Ne&&(e.i=n.index_.toString()),e}/**
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
 */class gr extends Gu{constructor(e,t,s,i){super(),this.repoInfo_=e,this.onDataUpdate_=t,this.authTokenProvider_=s,this.appCheckTokenProvider_=i,this.log_=xi("p:rest:"),this.listens_={}}reportStats(e){throw new Error("Method not implemented.")}static getListenId_(e,t){return t!==void 0?"tag$"+t:(H(e._queryParams.isDefault(),"should have a tag if it's not a default query."),e._path.toString())}listen(e,t,s,i){const r=e._path.toString();this.log_("Listen called for "+r+" "+e._queryIdentifier);const o=gr.getListenId_(e,s),l={};this.listens_[o]=l;const c=$c(e._queryParams);this.restRequest_(r+".json",c,(d,h)=>{let u=h;if(d===404&&(u=null,d=null),d===null&&this.onDataUpdate_(r,u,!1,s),ps(this.listens_,o)===l){let m;d?d===401?m="permission_denied":m="rest_error:"+d:m="ok",i(m,null)}})}unlisten(e,t){const s=gr.getListenId_(e,t);delete this.listens_[s]}get(e){const t=$c(e._queryParams),s=e._path.toString(),i=new Dt;return this.restRequest_(s+".json",t,(r,o)=>{let l=o;r===404&&(l=null,r=null),r===null?(this.onDataUpdate_(s,l,!1,null),i.resolve(l)):i.reject(new Error(l))}),i.promise}refreshAuthToken(e){}restRequest_(e,t={},s){return t.format="export",Promise.all([this.authTokenProvider_.getToken(!1),this.appCheckTokenProvider_.getToken(!1)]).then(([i,r])=>{i&&i.accessToken&&(t.auth=i.accessToken),r&&r.token&&(t.ac=r.token);const o=(this.repoInfo_.secure?"https://":"http://")+this.repoInfo_.host+e+"?ns="+this.repoInfo_.namespace+Ts(t);this.log_("Sending REST request for "+o);const l=new XMLHttpRequest;l.onreadystatechange=()=>{if(s&&l.readyState===4){this.log_("REST Response for "+o+" received. status:",l.status,"response:",l.responseText);let c=null;if(l.status>=200&&l.status<300){try{c=ri(l.responseText)}catch{st("Failed to parse JSON response for "+o+": "+l.responseText)}s(null,c)}else l.status!==401&&l.status!==404&&st("Got unsuccessful REST response for "+o+" Status: "+l.status),s(l.status);s=null}},l.open("GET",o,!0),l.send()})}}/**
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
 */class gv{constructor(){this.rootNode_=ce.EMPTY_NODE}getNode(e){return this.rootNode_.getChild(e)}updateSnapshot(e,t){this.rootNode_=this.rootNode_.updateChild(e,t)}}/**
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
 */function yr(){return{value:null,children:new Map}}function Rs(n,e,t){if(ge(e))n.value=t,n.children.clear();else if(n.value!==null)n.value=n.value.updateChild(e,t);else{const s=me(e);n.children.has(s)||n.children.set(s,yr());const i=n.children.get(s);e=Ie(e),Rs(i,e,t)}}function Vo(n,e){if(ge(e))return n.value=null,n.children.clear(),!0;if(n.value!==null){if(n.value.isLeafNode())return!1;{const t=n.value;return n.value=null,t.forEachChild(Ne,(s,i)=>{Rs(n,new Ce(s),i)}),Vo(n,e)}}else if(n.children.size>0){const t=me(e);return e=Ie(e),n.children.has(t)&&Vo(n.children.get(t),e)&&n.children.delete(t),n.children.size===0}else return!0}function zo(n,e,t){n.value!==null?t(e,n.value):yv(n,(s,i)=>{const r=new Ce(e.toString()+"/"+s);zo(i,r,t)})}function yv(n,e){n.children.forEach((t,s)=>{e(s,t)})}/**
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
 */class _v{constructor(e){this.collection_=e,this.last_=null}get(){const e=this.collection_.get(),t=Object.assign({},e);return this.last_&&Ye(this.last_,(s,i)=>{t[s]=t[s]-i}),this.last_=e,t}}/**
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
 */const Uc=10*1e3,vv=30*1e3,bv=5*60*1e3;class wv{constructor(e,t){this.server_=t,this.statsToReport_={},this.statsListener_=new _v(e);const s=Uc+(vv-Uc)*Math.random();Js(this.reportStats_.bind(this),Math.floor(s))}reportStats_(){const e=this.statsListener_.get(),t={};let s=!1;Ye(e,(i,r)=>{r>0&&Wt(this.statsToReport_,i)&&(t[i]=r,s=!0)}),s&&this.server_.reportStats(t),Js(this.reportStats_.bind(this),Math.floor(Math.random()*2*bv))}}/**
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
 */var Tt;(function(n){n[n.OVERWRITE=0]="OVERWRITE",n[n.MERGE=1]="MERGE",n[n.ACK_USER_WRITE=2]="ACK_USER_WRITE",n[n.LISTEN_COMPLETE=3]="LISTEN_COMPLETE"})(Tt||(Tt={}));function za(){return{fromUser:!0,fromServer:!1,queryId:null,tagged:!1}}function Ga(){return{fromUser:!1,fromServer:!0,queryId:null,tagged:!1}}function qa(n){return{fromUser:!1,fromServer:!0,queryId:n,tagged:!0}}/**
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
 */class _r{constructor(e,t,s){this.path=e,this.affectedTree=t,this.revert=s,this.type=Tt.ACK_USER_WRITE,this.source=za()}operationForChild(e){if(ge(this.path)){if(this.affectedTree.value!=null)return H(this.affectedTree.children.isEmpty(),"affectedTree should not have overlapping affected paths."),this;{const t=this.affectedTree.subtree(new Ce(e));return new _r(be(),t,this.revert)}}else return H(me(this.path)===e,"operationForChild called for unrelated child."),new _r(Ie(this.path),this.affectedTree,this.revert)}}/**
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
 */class fi{constructor(e,t){this.source=e,this.path=t,this.type=Tt.LISTEN_COMPLETE}operationForChild(e){return ge(this.path)?new fi(this.source,be()):new fi(this.source,Ie(this.path))}}/**
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
 */class Qn{constructor(e,t,s){this.source=e,this.path=t,this.snap=s,this.type=Tt.OVERWRITE}operationForChild(e){return ge(this.path)?new Qn(this.source,be(),this.snap.getImmediateChild(e)):new Qn(this.source,Ie(this.path),this.snap)}}/**
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
 */class vs{constructor(e,t,s){this.source=e,this.path=t,this.children=s,this.type=Tt.MERGE}operationForChild(e){if(ge(this.path)){const t=this.children.subtree(new Ce(e));return t.isEmpty()?null:t.value?new Qn(this.source,be(),t.value):new vs(this.source,be(),t)}else return H(me(this.path)===e,"Can't get a merge for a child not on the path of the operation"),new vs(this.source,Ie(this.path),this.children)}toString(){return"Operation("+this.path+": "+this.source.toString()+" merge: "+this.children.toString()+")"}}/**
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
 */class In{constructor(e,t,s){this.node_=e,this.fullyInitialized_=t,this.filtered_=s}isFullyInitialized(){return this.fullyInitialized_}isFiltered(){return this.filtered_}isCompleteForPath(e){if(ge(e))return this.isFullyInitialized()&&!this.filtered_;const t=me(e);return this.isCompleteForChild(t)}isCompleteForChild(e){return this.isFullyInitialized()&&!this.filtered_||this.node_.hasChild(e)}getNode(){return this.node_}}/**
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
 */class Cv{constructor(e){this.query_=e,this.index_=this.query_._queryParams.getIndex()}}function Ev(n,e,t,s){const i=[],r=[];return e.forEach(o=>{o.type==="child_changed"&&n.index_.indexedValueChanged(o.oldSnap,o.snapshotNode)&&r.push(uv(o.childName,o.snapshotNode))}),Bs(n,i,"child_removed",e,s,t),Bs(n,i,"child_added",e,s,t),Bs(n,i,"child_moved",r,s,t),Bs(n,i,"child_changed",e,s,t),Bs(n,i,"value",e,s,t),i}function Bs(n,e,t,s,i,r){const o=s.filter(l=>l.type===t);o.sort((l,c)=>Iv(n,l,c)),o.forEach(l=>{const c=kv(n,l,r);i.forEach(d=>{d.respondsTo(l.type)&&e.push(d.createEvent(c,n.query_))})})}function kv(n,e,t){return e.type==="value"||e.type==="child_removed"||(e.prevName=t.getPredecessorChildName(e.childName,e.snapshotNode,n.index_)),e}function Iv(n,e,t){if(e.childName==null||t.childName==null)throw Ss("Should only compare child_ events.");const s=new ye(e.childName,e.snapshotNode),i=new ye(t.childName,t.snapshotNode);return n.index_.compare(s,i)}/**
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
 */function Ur(n,e){return{eventCache:n,serverCache:e}}function Xs(n,e,t,s){return Ur(new In(e,t,s),n.serverCache)}function sh(n,e,t,s){return Ur(n.eventCache,new In(e,t,s))}function vr(n){return n.eventCache.isFullyInitialized()?n.eventCache.getNode():null}function Jn(n){return n.serverCache.isFullyInitialized()?n.serverCache.getNode():null}/**
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
 */let wo;const Sv=()=>(wo||(wo=new ft(d_)),wo);class Se{constructor(e,t=Sv()){this.value=e,this.children=t}static fromObject(e){let t=new Se(null);return Ye(e,(s,i)=>{t=t.set(new Ce(s),i)}),t}isEmpty(){return this.value===null&&this.children.isEmpty()}findRootMostMatchingPathAndValue(e,t){if(this.value!=null&&t(this.value))return{path:be(),value:this.value};if(ge(e))return null;{const s=me(e),i=this.children.get(s);if(i!==null){const r=i.findRootMostMatchingPathAndValue(Ie(e),t);return r!=null?{path:Oe(new Ce(s),r.path),value:r.value}:null}else return null}}findRootMostValueAndPath(e){return this.findRootMostMatchingPathAndValue(e,()=>!0)}subtree(e){if(ge(e))return this;{const t=me(e),s=this.children.get(t);return s!==null?s.subtree(Ie(e)):new Se(null)}}set(e,t){if(ge(e))return new Se(t,this.children);{const s=me(e),r=(this.children.get(s)||new Se(null)).set(Ie(e),t),o=this.children.insert(s,r);return new Se(this.value,o)}}remove(e){if(ge(e))return this.children.isEmpty()?new Se(null):new Se(null,this.children);{const t=me(e),s=this.children.get(t);if(s){const i=s.remove(Ie(e));let r;return i.isEmpty()?r=this.children.remove(t):r=this.children.insert(t,i),this.value===null&&r.isEmpty()?new Se(null):new Se(this.value,r)}else return this}}get(e){if(ge(e))return this.value;{const t=me(e),s=this.children.get(t);return s?s.get(Ie(e)):null}}setTree(e,t){if(ge(e))return t;{const s=me(e),r=(this.children.get(s)||new Se(null)).setTree(Ie(e),t);let o;return r.isEmpty()?o=this.children.remove(s):o=this.children.insert(s,r),new Se(this.value,o)}}fold(e){return this.fold_(be(),e)}fold_(e,t){const s={};return this.children.inorderTraversal((i,r)=>{s[i]=r.fold_(Oe(e,i),t)}),t(e,this.value,s)}findOnPath(e,t){return this.findOnPath_(e,be(),t)}findOnPath_(e,t,s){const i=this.value?s(t,this.value):!1;if(i)return i;if(ge(e))return null;{const r=me(e),o=this.children.get(r);return o?o.findOnPath_(Ie(e),Oe(t,r),s):null}}foreachOnPath(e,t){return this.foreachOnPath_(e,be(),t)}foreachOnPath_(e,t,s){if(ge(e))return this;{this.value&&s(t,this.value);const i=me(e),r=this.children.get(i);return r?r.foreachOnPath_(Ie(e),Oe(t,i),s):new Se(null)}}foreach(e){this.foreach_(be(),e)}foreach_(e,t){this.children.inorderTraversal((s,i)=>{i.foreach_(Oe(e,s),t)}),this.value&&t(e,this.value)}foreachChild(e){this.children.inorderTraversal((t,s)=>{s.value&&e(t,s.value)})}}/**
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
 */class xt{constructor(e){this.writeTree_=e}static empty(){return new xt(new Se(null))}}function Zs(n,e,t){if(ge(e))return new xt(new Se(t));{const s=n.writeTree_.findRootMostValueAndPath(e);if(s!=null){const i=s.path;let r=s.value;const o=nt(i,e);return r=r.updateChild(o,t),new xt(n.writeTree_.set(i,r))}else{const i=new Se(t),r=n.writeTree_.setTree(e,i);return new xt(r)}}}function Go(n,e,t){let s=n;return Ye(t,(i,r)=>{s=Zs(s,Oe(e,i),r)}),s}function Bc(n,e){if(ge(e))return xt.empty();{const t=n.writeTree_.setTree(e,new Se(null));return new xt(t)}}function qo(n,e){return ts(n,e)!=null}function ts(n,e){const t=n.writeTree_.findRootMostValueAndPath(e);return t!=null?n.writeTree_.get(t.path).getChild(nt(t.path,e)):null}function Wc(n){const e=[],t=n.writeTree_.value;return t!=null?t.isLeafNode()||t.forEachChild(Ne,(s,i)=>{e.push(new ye(s,i))}):n.writeTree_.children.inorderTraversal((s,i)=>{i.value!=null&&e.push(new ye(s,i.value))}),e}function bn(n,e){if(ge(e))return n;{const t=ts(n,e);return t!=null?new xt(new Se(t)):new xt(n.writeTree_.subtree(e))}}function Ko(n){return n.writeTree_.isEmpty()}function bs(n,e){return ih(be(),n.writeTree_,e)}function ih(n,e,t){if(e.value!=null)return t.updateChild(n,e.value);{let s=null;return e.children.inorderTraversal((i,r)=>{i===".priority"?(H(r.value!==null,"Priority writes must always be leaf nodes"),s=r.value):t=ih(Oe(n,i),r,t)}),!t.getChild(n).isEmpty()&&s!==null&&(t=t.updateChild(Oe(n,".priority"),s)),t}}/**
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
 */function Br(n,e){return lh(e,n)}function Tv(n,e,t,s,i){H(s>n.lastWriteId,"Stacking an older write on top of newer ones"),i===void 0&&(i=!0),n.allWrites.push({path:e,snap:t,writeId:s,visible:i}),i&&(n.visibleWrites=Zs(n.visibleWrites,e,t)),n.lastWriteId=s}function xv(n,e,t,s){H(s>n.lastWriteId,"Stacking an older merge on top of newer ones"),n.allWrites.push({path:e,children:t,writeId:s,visible:!0}),n.visibleWrites=Go(n.visibleWrites,e,t),n.lastWriteId=s}function Av(n,e){for(let t=0;t<n.allWrites.length;t++){const s=n.allWrites[t];if(s.writeId===e)return s}return null}function Rv(n,e){const t=n.allWrites.findIndex(l=>l.writeId===e);H(t>=0,"removeWrite called with nonexistent writeId.");const s=n.allWrites[t];n.allWrites.splice(t,1);let i=s.visible,r=!1,o=n.allWrites.length-1;for(;i&&o>=0;){const l=n.allWrites[o];l.visible&&(o>=t&&Pv(l,s.path)?i=!1:wt(s.path,l.path)&&(r=!0)),o--}if(i){if(r)return Nv(n),!0;if(s.snap)n.visibleWrites=Bc(n.visibleWrites,s.path);else{const l=s.children;Ye(l,c=>{n.visibleWrites=Bc(n.visibleWrites,Oe(s.path,c))})}return!0}else return!1}function Pv(n,e){if(n.snap)return wt(n.path,e);for(const t in n.children)if(n.children.hasOwnProperty(t)&&wt(Oe(n.path,t),e))return!0;return!1}function Nv(n){n.visibleWrites=rh(n.allWrites,Ov,be()),n.allWrites.length>0?n.lastWriteId=n.allWrites[n.allWrites.length-1].writeId:n.lastWriteId=-1}function Ov(n){return n.visible}function rh(n,e,t){let s=xt.empty();for(let i=0;i<n.length;++i){const r=n[i];if(e(r)){const o=r.path;let l;if(r.snap)wt(t,o)?(l=nt(t,o),s=Zs(s,l,r.snap)):wt(o,t)&&(l=nt(o,t),s=Zs(s,be(),r.snap.getChild(l)));else if(r.children){if(wt(t,o))l=nt(t,o),s=Go(s,l,r.children);else if(wt(o,t))if(l=nt(o,t),ge(l))s=Go(s,be(),r.children);else{const c=ps(r.children,me(l));if(c){const d=c.getChild(Ie(l));s=Zs(s,be(),d)}}}else throw Ss("WriteRecord should have .snap or .children")}}return s}function oh(n,e,t,s,i){if(!s&&!i){const r=ts(n.visibleWrites,e);if(r!=null)return r;{const o=bn(n.visibleWrites,e);if(Ko(o))return t;if(t==null&&!qo(o,be()))return null;{const l=t||ce.EMPTY_NODE;return bs(o,l)}}}else{const r=bn(n.visibleWrites,e);if(!i&&Ko(r))return t;if(!i&&t==null&&!qo(r,be()))return null;{const o=function(d){return(d.visible||i)&&(!s||!~s.indexOf(d.writeId))&&(wt(d.path,e)||wt(e,d.path))},l=rh(n.allWrites,o,e),c=t||ce.EMPTY_NODE;return bs(l,c)}}}function Mv(n,e,t){let s=ce.EMPTY_NODE;const i=ts(n.visibleWrites,e);if(i)return i.isLeafNode()||i.forEachChild(Ne,(r,o)=>{s=s.updateImmediateChild(r,o)}),s;if(t){const r=bn(n.visibleWrites,e);return t.forEachChild(Ne,(o,l)=>{const c=bs(bn(r,new Ce(o)),l);s=s.updateImmediateChild(o,c)}),Wc(r).forEach(o=>{s=s.updateImmediateChild(o.name,o.node)}),s}else{const r=bn(n.visibleWrites,e);return Wc(r).forEach(o=>{s=s.updateImmediateChild(o.name,o.node)}),s}}function Dv(n,e,t,s,i){H(s||i,"Either existingEventSnap or existingServerSnap must exist");const r=Oe(e,t);if(qo(n.visibleWrites,r))return null;{const o=bn(n.visibleWrites,r);return Ko(o)?i.getChild(t):bs(o,i.getChild(t))}}function Lv(n,e,t,s){const i=Oe(e,t),r=ts(n.visibleWrites,i);if(r!=null)return r;if(s.isCompleteForChild(t)){const o=bn(n.visibleWrites,i);return bs(o,s.getNode().getImmediateChild(t))}else return null}function $v(n,e){return ts(n.visibleWrites,e)}function Fv(n,e,t,s,i,r,o){let l;const c=bn(n.visibleWrites,e),d=ts(c,be());if(d!=null)l=d;else if(t!=null)l=bs(c,t);else return[];if(l=l.withIndex(o),!l.isEmpty()&&!l.isLeafNode()){const h=[],u=o.getCompare(),m=r?l.getReverseIteratorFrom(s,o):l.getIteratorFrom(s,o);let f=m.getNext();for(;f&&h.length<i;)u(f,s)!==0&&h.push(f),f=m.getNext();return h}else return[]}function Uv(){return{visibleWrites:xt.empty(),allWrites:[],lastWriteId:-1}}function br(n,e,t,s){return oh(n.writeTree,n.treePath,e,t,s)}function Ka(n,e){return Mv(n.writeTree,n.treePath,e)}function Hc(n,e,t,s){return Dv(n.writeTree,n.treePath,e,t,s)}function wr(n,e){return $v(n.writeTree,Oe(n.treePath,e))}function Bv(n,e,t,s,i,r){return Fv(n.writeTree,n.treePath,e,t,s,i,r)}function Ya(n,e,t){return Lv(n.writeTree,n.treePath,e,t)}function ah(n,e){return lh(Oe(n.treePath,e),n.writeTree)}function lh(n,e){return{treePath:n,writeTree:e}}/**
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
 */class Wv{constructor(){this.changeMap=new Map}trackChildChange(e){const t=e.type,s=e.childName;H(t==="child_added"||t==="child_changed"||t==="child_removed","Only child changes supported for tracking"),H(s!==".priority","Only non-priority child changes can be tracked.");const i=this.changeMap.get(s);if(i){const r=i.type;if(t==="child_added"&&r==="child_removed")this.changeMap.set(s,ui(s,e.snapshotNode,i.snapshotNode));else if(t==="child_removed"&&r==="child_added")this.changeMap.delete(s);else if(t==="child_removed"&&r==="child_changed")this.changeMap.set(s,di(s,i.oldSnap));else if(t==="child_changed"&&r==="child_added")this.changeMap.set(s,_s(s,e.snapshotNode));else if(t==="child_changed"&&r==="child_changed")this.changeMap.set(s,ui(s,e.snapshotNode,i.oldSnap));else throw Ss("Illegal combination of changes: "+e+" occurred after "+i)}else this.changeMap.set(s,e)}getChanges(){return Array.from(this.changeMap.values())}}/**
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
 */class Hv{getCompleteChild(e){return null}getChildAfterChild(e,t,s){return null}}const ch=new Hv;class Qa{constructor(e,t,s=null){this.writes_=e,this.viewCache_=t,this.optCompleteServerCache_=s}getCompleteChild(e){const t=this.viewCache_.eventCache;if(t.isCompleteForChild(e))return t.getNode().getImmediateChild(e);{const s=this.optCompleteServerCache_!=null?new In(this.optCompleteServerCache_,!0,!1):this.viewCache_.serverCache;return Ya(this.writes_,e,s)}}getChildAfterChild(e,t,s){const i=this.optCompleteServerCache_!=null?this.optCompleteServerCache_:Jn(this.viewCache_),r=Bv(this.writes_,i,t,1,s,e);return r.length===0?null:r[0]}}/**
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
 */function jv(n){return{filter:n}}function Vv(n,e){H(e.eventCache.getNode().isIndexed(n.filter.getIndex()),"Event snap not indexed"),H(e.serverCache.getNode().isIndexed(n.filter.getIndex()),"Server snap not indexed")}function zv(n,e,t,s,i){const r=new Wv;let o,l;if(t.type===Tt.OVERWRITE){const d=t;d.source.fromUser?o=Yo(n,e,d.path,d.snap,s,i,r):(H(d.source.fromServer,"Unknown source."),l=d.source.tagged||e.serverCache.isFiltered()&&!ge(d.path),o=Cr(n,e,d.path,d.snap,s,i,l,r))}else if(t.type===Tt.MERGE){const d=t;d.source.fromUser?o=qv(n,e,d.path,d.children,s,i,r):(H(d.source.fromServer,"Unknown source."),l=d.source.tagged||e.serverCache.isFiltered(),o=Qo(n,e,d.path,d.children,s,i,l,r))}else if(t.type===Tt.ACK_USER_WRITE){const d=t;d.revert?o=Qv(n,e,d.path,s,i,r):o=Kv(n,e,d.path,d.affectedTree,s,i,r)}else if(t.type===Tt.LISTEN_COMPLETE)o=Yv(n,e,t.path,s,r);else throw Ss("Unknown operation type: "+t.type);const c=r.getChanges();return Gv(e,o,c),{viewCache:o,changes:c}}function Gv(n,e,t){const s=e.eventCache;if(s.isFullyInitialized()){const i=s.getNode().isLeafNode()||s.getNode().isEmpty(),r=vr(n);(t.length>0||!n.eventCache.isFullyInitialized()||i&&!s.getNode().equals(r)||!s.getNode().getPriority().equals(r.getPriority()))&&t.push(nh(vr(e)))}}function dh(n,e,t,s,i,r){const o=e.eventCache;if(wr(s,t)!=null)return e;{let l,c;if(ge(t))if(H(e.serverCache.isFullyInitialized(),"If change path is empty, we must have complete server data"),e.serverCache.isFiltered()){const d=Jn(e),h=d instanceof ce?d:ce.EMPTY_NODE,u=Ka(s,h);l=n.filter.updateFullNode(e.eventCache.getNode(),u,r)}else{const d=br(s,Jn(e));l=n.filter.updateFullNode(e.eventCache.getNode(),d,r)}else{const d=me(t);if(d===".priority"){H(kn(t)===1,"Can't have a priority with additional path components");const h=o.getNode();c=e.serverCache.getNode();const u=Hc(s,t,h,c);u!=null?l=n.filter.updatePriority(h,u):l=o.getNode()}else{const h=Ie(t);let u;if(o.isCompleteForChild(d)){c=e.serverCache.getNode();const m=Hc(s,t,o.getNode(),c);m!=null?u=o.getNode().getImmediateChild(d).updateChild(h,m):u=o.getNode().getImmediateChild(d)}else u=Ya(s,d,e.serverCache);u!=null?l=n.filter.updateChild(o.getNode(),d,u,h,i,r):l=o.getNode()}}return Xs(e,l,o.isFullyInitialized()||ge(t),n.filter.filtersNodes())}}function Cr(n,e,t,s,i,r,o,l){const c=e.serverCache;let d;const h=o?n.filter:n.filter.getIndexedFilter();if(ge(t))d=h.updateFullNode(c.getNode(),s,null);else if(h.filtersNodes()&&!c.isFiltered()){const f=c.getNode().updateChild(t,s);d=h.updateFullNode(c.getNode(),f,null)}else{const f=me(t);if(!c.isCompleteForPath(t)&&kn(t)>1)return e;const y=Ie(t),E=c.getNode().getImmediateChild(f).updateChild(y,s);f===".priority"?d=h.updatePriority(c.getNode(),E):d=h.updateChild(c.getNode(),f,E,y,ch,null)}const u=sh(e,d,c.isFullyInitialized()||ge(t),h.filtersNodes()),m=new Qa(i,u,r);return dh(n,u,t,i,m,l)}function Yo(n,e,t,s,i,r,o){const l=e.eventCache;let c,d;const h=new Qa(i,e,r);if(ge(t))d=n.filter.updateFullNode(e.eventCache.getNode(),s,o),c=Xs(e,d,!0,n.filter.filtersNodes());else{const u=me(t);if(u===".priority")d=n.filter.updatePriority(e.eventCache.getNode(),s),c=Xs(e,d,l.isFullyInitialized(),l.isFiltered());else{const m=Ie(t),f=l.getNode().getImmediateChild(u);let y;if(ge(m))y=s;else{const w=h.getCompleteChild(u);w!=null?Fa(m)===".priority"&&w.getChild(Ku(m)).isEmpty()?y=w:y=w.updateChild(m,s):y=ce.EMPTY_NODE}if(f.equals(y))c=e;else{const w=n.filter.updateChild(l.getNode(),u,y,m,h,o);c=Xs(e,w,l.isFullyInitialized(),n.filter.filtersNodes())}}}return c}function jc(n,e){return n.eventCache.isCompleteForChild(e)}function qv(n,e,t,s,i,r,o){let l=e;return s.foreach((c,d)=>{const h=Oe(t,c);jc(e,me(h))&&(l=Yo(n,l,h,d,i,r,o))}),s.foreach((c,d)=>{const h=Oe(t,c);jc(e,me(h))||(l=Yo(n,l,h,d,i,r,o))}),l}function Vc(n,e,t){return t.foreach((s,i)=>{e=e.updateChild(s,i)}),e}function Qo(n,e,t,s,i,r,o,l){if(e.serverCache.getNode().isEmpty()&&!e.serverCache.isFullyInitialized())return e;let c=e,d;ge(t)?d=s:d=new Se(null).setTree(t,s);const h=e.serverCache.getNode();return d.children.inorderTraversal((u,m)=>{if(h.hasChild(u)){const f=e.serverCache.getNode().getImmediateChild(u),y=Vc(n,f,m);c=Cr(n,c,new Ce(u),y,i,r,o,l)}}),d.children.inorderTraversal((u,m)=>{const f=!e.serverCache.isCompleteForChild(u)&&m.value===null;if(!h.hasChild(u)&&!f){const y=e.serverCache.getNode().getImmediateChild(u),w=Vc(n,y,m);c=Cr(n,c,new Ce(u),w,i,r,o,l)}}),c}function Kv(n,e,t,s,i,r,o){if(wr(i,t)!=null)return e;const l=e.serverCache.isFiltered(),c=e.serverCache;if(s.value!=null){if(ge(t)&&c.isFullyInitialized()||c.isCompleteForPath(t))return Cr(n,e,t,c.getNode().getChild(t),i,r,l,o);if(ge(t)){let d=new Se(null);return c.getNode().forEachChild(Wn,(h,u)=>{d=d.set(new Ce(h),u)}),Qo(n,e,t,d,i,r,l,o)}else return e}else{let d=new Se(null);return s.foreach((h,u)=>{const m=Oe(t,h);c.isCompleteForPath(m)&&(d=d.set(h,c.getNode().getChild(m)))}),Qo(n,e,t,d,i,r,l,o)}}function Yv(n,e,t,s,i){const r=e.serverCache,o=sh(e,r.getNode(),r.isFullyInitialized()||ge(t),r.isFiltered());return dh(n,o,t,s,ch,i)}function Qv(n,e,t,s,i,r){let o;if(wr(s,t)!=null)return e;{const l=new Qa(s,e,i),c=e.eventCache.getNode();let d;if(ge(t)||me(t)===".priority"){let h;if(e.serverCache.isFullyInitialized())h=br(s,Jn(e));else{const u=e.serverCache.getNode();H(u instanceof ce,"serverChildren would be complete if leaf node"),h=Ka(s,u)}h=h,d=n.filter.updateFullNode(c,h,r)}else{const h=me(t);let u=Ya(s,h,e.serverCache);u==null&&e.serverCache.isCompleteForChild(h)&&(u=c.getImmediateChild(h)),u!=null?d=n.filter.updateChild(c,h,u,Ie(t),l,r):e.eventCache.getNode().hasChild(h)?d=n.filter.updateChild(c,h,ce.EMPTY_NODE,Ie(t),l,r):d=c,d.isEmpty()&&e.serverCache.isFullyInitialized()&&(o=br(s,Jn(e)),o.isLeafNode()&&(d=n.filter.updateFullNode(d,o,r)))}return o=e.serverCache.isFullyInitialized()||wr(s,be())!=null,Xs(e,d,o,n.filter.filtersNodes())}}/**
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
 */class Jv{constructor(e,t){this.query_=e,this.eventRegistrations_=[];const s=this.query_._queryParams,i=new ja(s.getIndex()),r=fv(s);this.processor_=jv(r);const o=t.serverCache,l=t.eventCache,c=i.updateFullNode(ce.EMPTY_NODE,o.getNode(),null),d=r.updateFullNode(ce.EMPTY_NODE,l.getNode(),null),h=new In(c,o.isFullyInitialized(),i.filtersNodes()),u=new In(d,l.isFullyInitialized(),r.filtersNodes());this.viewCache_=Ur(u,h),this.eventGenerator_=new Cv(this.query_)}get query(){return this.query_}}function Xv(n){return n.viewCache_.serverCache.getNode()}function Zv(n){return vr(n.viewCache_)}function eb(n,e){const t=Jn(n.viewCache_);return t&&(n.query._queryParams.loadsAllData()||!ge(e)&&!t.getImmediateChild(me(e)).isEmpty())?t.getChild(e):null}function zc(n){return n.eventRegistrations_.length===0}function tb(n,e){n.eventRegistrations_.push(e)}function Gc(n,e,t){const s=[];if(t){H(e==null,"A cancel should cancel all event registrations.");const i=n.query._path;n.eventRegistrations_.forEach(r=>{const o=r.createCancelEvent(t,i);o&&s.push(o)})}if(e){let i=[];for(let r=0;r<n.eventRegistrations_.length;++r){const o=n.eventRegistrations_[r];if(!o.matches(e))i.push(o);else if(e.hasAnyCallback()){i=i.concat(n.eventRegistrations_.slice(r+1));break}}n.eventRegistrations_=i}else n.eventRegistrations_=[];return s}function qc(n,e,t,s){e.type===Tt.MERGE&&e.source.queryId!==null&&(H(Jn(n.viewCache_),"We should always have a full cache before handling merges"),H(vr(n.viewCache_),"Missing event cache, even though we have a server cache"));const i=n.viewCache_,r=zv(n.processor_,i,e,t,s);return Vv(n.processor_,r.viewCache),H(r.viewCache.serverCache.isFullyInitialized()||!i.serverCache.isFullyInitialized(),"Once a server snap is complete, it should never go back"),n.viewCache_=r.viewCache,uh(n,r.changes,r.viewCache.eventCache.getNode(),null)}function nb(n,e){const t=n.viewCache_.eventCache,s=[];return t.getNode().isLeafNode()||t.getNode().forEachChild(Ne,(r,o)=>{s.push(_s(r,o))}),t.isFullyInitialized()&&s.push(nh(t.getNode())),uh(n,s,t.getNode(),e)}function uh(n,e,t,s){const i=s?[s]:n.eventRegistrations_;return Ev(n.eventGenerator_,e,t,i)}/**
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
 */let Er;class hh{constructor(){this.views=new Map}}function sb(n){H(!Er,"__referenceConstructor has already been defined"),Er=n}function ib(){return H(Er,"Reference.ts has not been loaded"),Er}function rb(n){return n.views.size===0}function Ja(n,e,t,s){const i=e.source.queryId;if(i!==null){const r=n.views.get(i);return H(r!=null,"SyncTree gave us an op for an invalid query."),qc(r,e,t,s)}else{let r=[];for(const o of n.views.values())r=r.concat(qc(o,e,t,s));return r}}function fh(n,e,t,s,i){const r=e._queryIdentifier,o=n.views.get(r);if(!o){let l=br(t,i?s:null),c=!1;l?c=!0:s instanceof ce?(l=Ka(t,s),c=!1):(l=ce.EMPTY_NODE,c=!1);const d=Ur(new In(l,c,!1),new In(s,i,!1));return new Jv(e,d)}return o}function ob(n,e,t,s,i,r){const o=fh(n,e,s,i,r);return n.views.has(e._queryIdentifier)||n.views.set(e._queryIdentifier,o),tb(o,t),nb(o,t)}function ab(n,e,t,s){const i=e._queryIdentifier,r=[];let o=[];const l=Sn(n);if(i==="default")for(const[c,d]of n.views.entries())o=o.concat(Gc(d,t,s)),zc(d)&&(n.views.delete(c),d.query._queryParams.loadsAllData()||r.push(d.query));else{const c=n.views.get(i);c&&(o=o.concat(Gc(c,t,s)),zc(c)&&(n.views.delete(i),c.query._queryParams.loadsAllData()||r.push(c.query)))}return l&&!Sn(n)&&r.push(new(ib())(e._repo,e._path)),{removed:r,events:o}}function ph(n){const e=[];for(const t of n.views.values())t.query._queryParams.loadsAllData()||e.push(t);return e}function wn(n,e){let t=null;for(const s of n.views.values())t=t||eb(s,e);return t}function mh(n,e){if(e._queryParams.loadsAllData())return Wr(n);{const s=e._queryIdentifier;return n.views.get(s)}}function gh(n,e){return mh(n,e)!=null}function Sn(n){return Wr(n)!=null}function Wr(n){for(const e of n.views.values())if(e.query._queryParams.loadsAllData())return e;return null}/**
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
 */let kr;function lb(n){H(!kr,"__referenceConstructor has already been defined"),kr=n}function cb(){return H(kr,"Reference.ts has not been loaded"),kr}let db=1;class Kc{constructor(e){this.listenProvider_=e,this.syncPointTree_=new Se(null),this.pendingWriteTree_=Uv(),this.tagToQueryMap=new Map,this.queryToTagMap=new Map}}function yh(n,e,t,s,i){return Tv(n.pendingWriteTree_,e,t,s,i),i?Ps(n,new Qn(za(),e,t)):[]}function ub(n,e,t,s){xv(n.pendingWriteTree_,e,t,s);const i=Se.fromObject(t);return Ps(n,new vs(za(),e,i))}function pn(n,e,t=!1){const s=Av(n.pendingWriteTree_,e);if(Rv(n.pendingWriteTree_,e)){let r=new Se(null);return s.snap!=null?r=r.set(be(),!0):Ye(s.children,o=>{r=r.set(new Ce(o),!0)}),Ps(n,new _r(s.path,r,t))}else return[]}function Ri(n,e,t){return Ps(n,new Qn(Ga(),e,t))}function hb(n,e,t){const s=Se.fromObject(t);return Ps(n,new vs(Ga(),e,s))}function fb(n,e){return Ps(n,new fi(Ga(),e))}function pb(n,e,t){const s=Za(n,t);if(s){const i=el(s),r=i.path,o=i.queryId,l=nt(r,e),c=new fi(qa(o),l);return tl(n,r,c)}else return[]}function Ir(n,e,t,s,i=!1){const r=e._path,o=n.syncPointTree_.get(r);let l=[];if(o&&(e._queryIdentifier==="default"||gh(o,e))){const c=ab(o,e,t,s);rb(o)&&(n.syncPointTree_=n.syncPointTree_.remove(r));const d=c.removed;if(l=c.events,!i){const h=d.findIndex(m=>m._queryParams.loadsAllData())!==-1,u=n.syncPointTree_.findOnPath(r,(m,f)=>Sn(f));if(h&&!u){const m=n.syncPointTree_.subtree(r);if(!m.isEmpty()){const f=yb(m);for(let y=0;y<f.length;++y){const w=f[y],E=w.query,x=wh(n,w);n.listenProvider_.startListening(ei(E),pi(n,E),x.hashFn,x.onComplete)}}}!u&&d.length>0&&!s&&(h?n.listenProvider_.stopListening(ei(e),null):d.forEach(m=>{const f=n.queryToTagMap.get(Hr(m));n.listenProvider_.stopListening(ei(m),f)}))}_b(n,d)}return l}function _h(n,e,t,s){const i=Za(n,s);if(i!=null){const r=el(i),o=r.path,l=r.queryId,c=nt(o,e),d=new Qn(qa(l),c,t);return tl(n,o,d)}else return[]}function mb(n,e,t,s){const i=Za(n,s);if(i){const r=el(i),o=r.path,l=r.queryId,c=nt(o,e),d=Se.fromObject(t),h=new vs(qa(l),c,d);return tl(n,o,h)}else return[]}function Jo(n,e,t,s=!1){const i=e._path;let r=null,o=!1;n.syncPointTree_.foreachOnPath(i,(m,f)=>{const y=nt(m,i);r=r||wn(f,y),o=o||Sn(f)});let l=n.syncPointTree_.get(i);l?(o=o||Sn(l),r=r||wn(l,be())):(l=new hh,n.syncPointTree_=n.syncPointTree_.set(i,l));let c;r!=null?c=!0:(c=!1,r=ce.EMPTY_NODE,n.syncPointTree_.subtree(i).foreachChild((f,y)=>{const w=wn(y,be());w&&(r=r.updateImmediateChild(f,w))}));const d=gh(l,e);if(!d&&!e._queryParams.loadsAllData()){const m=Hr(e);H(!n.queryToTagMap.has(m),"View does not exist, but we have a tag");const f=vb();n.queryToTagMap.set(m,f),n.tagToQueryMap.set(f,m)}const h=Br(n.pendingWriteTree_,i);let u=ob(l,e,t,h,r,c);if(!d&&!o&&!s){const m=mh(l,e);u=u.concat(bb(n,e,m))}return u}function Xa(n,e,t){const i=n.pendingWriteTree_,r=n.syncPointTree_.findOnPath(e,(o,l)=>{const c=nt(o,e),d=wn(l,c);if(d)return d});return oh(i,e,r,t,!0)}function gb(n,e){const t=e._path;let s=null;n.syncPointTree_.foreachOnPath(t,(d,h)=>{const u=nt(d,t);s=s||wn(h,u)});let i=n.syncPointTree_.get(t);i?s=s||wn(i,be()):(i=new hh,n.syncPointTree_=n.syncPointTree_.set(t,i));const r=s!=null,o=r?new In(s,!0,!1):null,l=Br(n.pendingWriteTree_,e._path),c=fh(i,e,l,r?o.getNode():ce.EMPTY_NODE,r);return Zv(c)}function Ps(n,e){return vh(e,n.syncPointTree_,null,Br(n.pendingWriteTree_,be()))}function vh(n,e,t,s){if(ge(n.path))return bh(n,e,t,s);{const i=e.get(be());t==null&&i!=null&&(t=wn(i,be()));let r=[];const o=me(n.path),l=n.operationForChild(o),c=e.children.get(o);if(c&&l){const d=t?t.getImmediateChild(o):null,h=ah(s,o);r=r.concat(vh(l,c,d,h))}return i&&(r=r.concat(Ja(i,n,s,t))),r}}function bh(n,e,t,s){const i=e.get(be());t==null&&i!=null&&(t=wn(i,be()));let r=[];return e.children.inorderTraversal((o,l)=>{const c=t?t.getImmediateChild(o):null,d=ah(s,o),h=n.operationForChild(o);h&&(r=r.concat(bh(h,l,c,d)))}),i&&(r=r.concat(Ja(i,n,s,t))),r}function wh(n,e){const t=e.query,s=pi(n,t);return{hashFn:()=>(Xv(e)||ce.EMPTY_NODE).hash(),onComplete:i=>{if(i==="ok")return s?pb(n,t._path,s):fb(n,t._path);{const r=f_(i,t);return Ir(n,t,null,r)}}}}function pi(n,e){const t=Hr(e);return n.queryToTagMap.get(t)}function Hr(n){return n._path.toString()+"$"+n._queryIdentifier}function Za(n,e){return n.tagToQueryMap.get(e)}function el(n){const e=n.indexOf("$");return H(e!==-1&&e<n.length-1,"Bad queryKey."),{queryId:n.substr(e+1),path:new Ce(n.substr(0,e))}}function tl(n,e,t){const s=n.syncPointTree_.get(e);H(s,"Missing sync point for query tag that we're tracking");const i=Br(n.pendingWriteTree_,e);return Ja(s,t,i,null)}function yb(n){return n.fold((e,t,s)=>{if(t&&Sn(t))return[Wr(t)];{let i=[];return t&&(i=ph(t)),Ye(s,(r,o)=>{i=i.concat(o)}),i}})}function ei(n){return n._queryParams.loadsAllData()&&!n._queryParams.isDefault()?new(cb())(n._repo,n._path):n}function _b(n,e){for(let t=0;t<e.length;++t){const s=e[t];if(!s._queryParams.loadsAllData()){const i=Hr(s),r=n.queryToTagMap.get(i);n.queryToTagMap.delete(i),n.tagToQueryMap.delete(r)}}}function vb(){return db++}function bb(n,e,t){const s=e._path,i=pi(n,e),r=wh(n,t),o=n.listenProvider_.startListening(ei(e),i,r.hashFn,r.onComplete),l=n.syncPointTree_.subtree(s);if(i)H(!Sn(l.value),"If we're adding a query, it shouldn't be shadowed");else{const c=l.fold((d,h,u)=>{if(!ge(d)&&h&&Sn(h))return[Wr(h).query];{let m=[];return h&&(m=m.concat(ph(h).map(f=>f.query))),Ye(u,(f,y)=>{m=m.concat(y)}),m}});for(let d=0;d<c.length;++d){const h=c[d];n.listenProvider_.stopListening(ei(h),pi(n,h))}}return o}/**
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
 */class nl{constructor(e){this.node_=e}getImmediateChild(e){const t=this.node_.getImmediateChild(e);return new nl(t)}node(){return this.node_}}class sl{constructor(e,t){this.syncTree_=e,this.path_=t}getImmediateChild(e){const t=Oe(this.path_,e);return new sl(this.syncTree_,t)}node(){return Xa(this.syncTree_,this.path_)}}const wb=function(n){return n=n||{},n.timestamp=n.timestamp||new Date().getTime(),n},Yc=function(n,e,t){if(!n||typeof n!="object")return n;if(H(".sv"in n,"Unexpected leaf node or priority contents"),typeof n[".sv"]=="string")return Cb(n[".sv"],e,t);if(typeof n[".sv"]=="object")return Eb(n[".sv"],e);H(!1,"Unexpected server value: "+JSON.stringify(n,null,2))},Cb=function(n,e,t){switch(n){case"timestamp":return t.timestamp;default:H(!1,"Unexpected server value: "+n)}},Eb=function(n,e,t){n.hasOwnProperty("increment")||H(!1,"Unexpected server value: "+JSON.stringify(n,null,2));const s=n.increment;typeof s!="number"&&H(!1,"Unexpected increment value: "+s);const i=e.node();if(H(i!==null&&typeof i<"u","Expected ChildrenNode.EMPTY_NODE for nulls"),!i.isLeafNode())return s;const o=i.getValue();return typeof o!="number"?s:o+s},Ch=function(n,e,t,s){return il(e,new sl(t,n),s)},Eh=function(n,e,t){return il(n,new nl(e),t)};function il(n,e,t){const s=n.getPriority().val(),i=Yc(s,e.getImmediateChild(".priority"),t);let r;if(n.isLeafNode()){const o=n,l=Yc(o.getValue(),e,t);return l!==o.getValue()||i!==o.getPriority().val()?new ze(l,Le(i)):n}else{const o=n;return r=o,i!==o.getPriority().val()&&(r=r.updatePriority(new ze(i))),o.forEachChild(Ne,(l,c)=>{const d=il(c,e.getImmediateChild(l),t);d!==c&&(r=r.updateImmediateChild(l,d))}),r}}/**
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
 */class rl{constructor(e="",t=null,s={children:{},childCount:0}){this.name=e,this.parent=t,this.node=s}}function ol(n,e){let t=e instanceof Ce?e:new Ce(e),s=n,i=me(t);for(;i!==null;){const r=ps(s.node.children,i)||{children:{},childCount:0};s=new rl(i,s,r),t=Ie(t),i=me(t)}return s}function Ns(n){return n.node.value}function kh(n,e){n.node.value=e,Xo(n)}function Ih(n){return n.node.childCount>0}function kb(n){return Ns(n)===void 0&&!Ih(n)}function jr(n,e){Ye(n.node.children,(t,s)=>{e(new rl(t,n,s))})}function Sh(n,e,t,s){t&&e(n),jr(n,i=>{Sh(i,e,!0)})}function Ib(n,e,t){let s=n.parent;for(;s!==null;){if(e(s))return!0;s=s.parent}return!1}function Pi(n){return new Ce(n.parent===null?n.name:Pi(n.parent)+"/"+n.name)}function Xo(n){n.parent!==null&&Sb(n.parent,n.name,n)}function Sb(n,e,t){const s=kb(t),i=Wt(n.node.children,e);s&&i?(delete n.node.children[e],n.node.childCount--,Xo(n)):!s&&!i&&(n.node.children[e]=t.node,n.node.childCount++,Xo(n))}/**
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
 */const Tb=/[\[\].#$\/\u0000-\u001F\u007F]/,xb=/[\[\].#$\u0000-\u001F\u007F]/,Co=10*1024*1024,al=function(n){return typeof n=="string"&&n.length!==0&&!Tb.test(n)},Th=function(n){return typeof n=="string"&&n.length!==0&&!xb.test(n)},Ab=function(n){return n&&(n=n.replace(/^\/*\.info(\/|$)/,"/")),Th(n)},Sr=function(n){return n===null||typeof n=="string"||typeof n=="number"&&!$r(n)||n&&typeof n=="object"&&Wt(n,".sv")},Tr=function(n,e,t,s){s&&e===void 0||Vr(ms(n,"value"),e,t)},Vr=function(n,e,t){const s=t instanceof Ce?new q_(t,n):t;if(e===void 0)throw new Error(n+"contains undefined "+$n(s));if(typeof e=="function")throw new Error(n+"contains a function "+$n(s)+" with contents = "+e.toString());if($r(e))throw new Error(n+"contains "+e.toString()+" "+$n(s));if(typeof e=="string"&&e.length>Co/3&&Or(e)>Co)throw new Error(n+"contains a string greater than "+Co+" utf8 bytes "+$n(s)+" ('"+e.substring(0,50)+"...')");if(e&&typeof e=="object"){let i=!1,r=!1;if(Ye(e,(o,l)=>{if(o===".value")i=!0;else if(o!==".priority"&&o!==".sv"&&(r=!0,!al(o)))throw new Error(n+" contains an invalid key ("+o+") "+$n(s)+`.  Keys must be non-empty strings and can't contain ".", "#", "$", "/", "[", or "]"`);K_(s,o),Vr(n,l,s),Y_(s)}),i&&r)throw new Error(n+' contains ".value" child '+$n(s)+" in addition to actual children.")}},Rb=function(n,e){let t,s;for(t=0;t<e.length;t++){s=e[t];const r=ci(s);for(let o=0;o<r.length;o++)if(!(r[o]===".priority"&&o===r.length-1)){if(!al(r[o]))throw new Error(n+"contains an invalid key ("+r[o]+") in path "+s.toString()+`. Keys must be non-empty strings and can't contain ".", "#", "$", "/", "[", or "]"`)}}e.sort(G_);let i=null;for(t=0;t<e.length;t++){if(s=e[t],i!==null&&wt(i,s))throw new Error(n+"contains a path "+i.toString()+" that is ancestor of another path "+s.toString());i=s}},xh=function(n,e,t,s){const i=ms(n,"values");if(!(e&&typeof e=="object")||Array.isArray(e))throw new Error(i+" must be an object containing the children to replace.");const r=[];Ye(e,(o,l)=>{const c=new Ce(o);if(Vr(i,l,Oe(t,c)),Fa(c)===".priority"&&!Sr(l))throw new Error(i+"contains an invalid value for '"+c.toString()+"', which must be a valid Firebase priority (a string, finite number, server value, or null).");r.push(c)}),Rb(i,r)},Pb=function(n,e,t){if($r(e))throw new Error(ms(n,"priority")+"is "+e.toString()+", but must be a valid Firebase priority (a string, finite number, server value, or null).");if(!Sr(e))throw new Error(ms(n,"priority")+"must be a valid Firebase priority (a string, finite number, server value, or null).")},ll=function(n,e,t,s){if(!Th(t))throw new Error(ms(n,e)+'was an invalid path = "'+t+`". Paths must be non-empty strings and can't contain ".", "#", "$", "[", or "]"`)},Nb=function(n,e,t,s){t&&(t=t.replace(/^\/*\.info(\/|$)/,"/")),ll(n,e,t)},Un=function(n,e){if(me(e)===".info")throw new Error(n+" failed = Can't modify data under /.info/")},Ob=function(n,e){const t=e.path.toString();if(typeof e.repoInfo.host!="string"||e.repoInfo.host.length===0||!al(e.repoInfo.namespace)&&e.repoInfo.host.split(":")[0]!=="localhost"||t.length!==0&&!Ab(t))throw new Error(ms(n,"url")+`must be a valid firebase URL and the path can't contain ".", "#", "$", "[", or "]".`)};/**
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
 */class Mb{constructor(){this.eventLists_=[],this.recursionDepth_=0}}function zr(n,e){let t=null;for(let s=0;s<e.length;s++){const i=e[s],r=i.getPath();t!==null&&!Ua(r,t.path)&&(n.eventLists_.push(t),t=null),t===null&&(t={events:[],path:r}),t.events.push(i)}t&&n.eventLists_.push(t)}function Ah(n,e,t){zr(n,t),Rh(n,s=>Ua(s,e))}function Et(n,e,t){zr(n,t),Rh(n,s=>wt(s,e)||wt(e,s))}function Rh(n,e){n.recursionDepth_++;let t=!0;for(let s=0;s<n.eventLists_.length;s++){const i=n.eventLists_[s];if(i){const r=i.path;e(r)?(Db(n.eventLists_[s]),n.eventLists_[s]=null):t=!1}}t&&(n.eventLists_=[]),n.recursionDepth_--}function Db(n){for(let e=0;e<n.events.length;e++){const t=n.events[e];if(t!==null){n.events[e]=null;const s=t.getEventRunner();Qs&&qe("event: "+t.toString()),As(s)}}}/**
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
 */const Lb="repo_interrupt",$b=25;class Fb{constructor(e,t,s,i){this.repoInfo_=e,this.forceRestClient_=t,this.authTokenProvider_=s,this.appCheckProvider_=i,this.dataUpdateCount=0,this.statsListener_=null,this.eventQueue_=new Mb,this.nextWriteId_=1,this.interceptServerDataCallback_=null,this.onDisconnect_=yr(),this.transactionQueueTree_=new rl,this.persistentConnection_=null,this.key=this.repoInfo_.toURLString()}toString(){return(this.repoInfo_.secure?"https://":"http://")+this.repoInfo_.host}}function Ub(n,e,t){if(n.stats_=La(n.repoInfo_),n.forceRestClient_||y_())n.server_=new gr(n.repoInfo_,(s,i,r,o)=>{Qc(n,s,i,r,o)},n.authTokenProvider_,n.appCheckProvider_),setTimeout(()=>Jc(n,!0),0);else{if(typeof t<"u"&&t!==null){if(typeof t!="object")throw new Error("Only objects are supported for option databaseAuthVariableOverride");try{je(t)}catch(s){throw new Error("Invalid authOverride provided: "+s)}}n.persistentConnection_=new Qt(n.repoInfo_,e,(s,i,r,o)=>{Qc(n,s,i,r,o)},s=>{Jc(n,s)},s=>{Bb(n,s)},n.authTokenProvider_,n.appCheckProvider_,t),n.server_=n.persistentConnection_}n.authTokenProvider_.addTokenChangeListener(s=>{n.server_.refreshAuthToken(s)}),n.appCheckProvider_.addTokenChangeListener(s=>{n.server_.refreshAppCheckToken(s.token)}),n.statsReporter_=C_(n.repoInfo_,()=>new wv(n.stats_,n.server_)),n.infoData_=new gv,n.infoSyncTree_=new Kc({startListening:(s,i,r,o)=>{let l=[];const c=n.infoData_.getNode(s._path);return c.isEmpty()||(l=Ri(n.infoSyncTree_,s._path,c),setTimeout(()=>{o("ok")},0)),l},stopListening:()=>{}}),cl(n,"connected",!1),n.serverSyncTree_=new Kc({startListening:(s,i,r,o)=>(n.server_.listen(s,r,i,(l,c)=>{const d=o(l,c);Et(n.eventQueue_,s._path,d)}),[]),stopListening:(s,i)=>{n.server_.unlisten(s,i)}})}function Ph(n){const t=n.infoData_.getNode(new Ce(".info/serverTimeOffset")).val()||0;return new Date().getTime()+t}function Gr(n){return wb({timestamp:Ph(n)})}function Qc(n,e,t,s,i){n.dataUpdateCount++;const r=new Ce(e);t=n.interceptServerDataCallback_?n.interceptServerDataCallback_(e,t):t;let o=[];if(i)if(s){const c=rr(t,d=>Le(d));o=mb(n.serverSyncTree_,r,c,i)}else{const c=Le(t);o=_h(n.serverSyncTree_,r,c,i)}else if(s){const c=rr(t,d=>Le(d));o=hb(n.serverSyncTree_,r,c)}else{const c=Le(t);o=Ri(n.serverSyncTree_,r,c)}let l=r;o.length>0&&(l=ws(n,r)),Et(n.eventQueue_,l,o)}function Jc(n,e){cl(n,"connected",e),e===!1&&Vb(n)}function Bb(n,e){Ye(e,(t,s)=>{cl(n,t,s)})}function cl(n,e,t){const s=new Ce("/.info/"+e),i=Le(t);n.infoData_.updateSnapshot(s,i);const r=Ri(n.infoSyncTree_,s,i);Et(n.eventQueue_,s,r)}function dl(n){return n.nextWriteId_++}function Wb(n,e,t){const s=gb(n.serverSyncTree_,e);return s!=null?Promise.resolve(s):n.server_.get(e).then(i=>{const r=Le(i).withIndex(e._queryParams.getIndex());Jo(n.serverSyncTree_,e,t,!0);let o;if(e._queryParams.loadsAllData())o=Ri(n.serverSyncTree_,e._path,r);else{const l=pi(n.serverSyncTree_,e);o=_h(n.serverSyncTree_,e._path,r,l)}return Et(n.eventQueue_,e._path,o),Ir(n.serverSyncTree_,e,t,null,!0),r},i=>(Ni(n,"get for query "+je(e)+" failed: "+i),Promise.reject(new Error(i))))}function Hb(n,e,t,s,i){Ni(n,"set",{path:e.toString(),value:t,priority:s});const r=Gr(n),o=Le(t,s),l=Xa(n.serverSyncTree_,e),c=Eh(o,l,r),d=dl(n),h=yh(n.serverSyncTree_,e,c,d,!0);zr(n.eventQueue_,h),n.server_.put(e.toString(),o.val(!0),(m,f)=>{const y=m==="ok";y||st("set at "+e+" failed: "+m);const w=pn(n.serverSyncTree_,d,!y);Et(n.eventQueue_,e,w),Tn(n,i,m,f)});const u=hl(n,e);ws(n,u),Et(n.eventQueue_,u,[])}function jb(n,e,t,s){Ni(n,"update",{path:e.toString(),value:t});let i=!0;const r=Gr(n),o={};if(Ye(t,(l,c)=>{i=!1,o[l]=Ch(Oe(e,l),Le(c),n.serverSyncTree_,r)}),i)qe("update() called with empty data.  Don't do anything."),Tn(n,s,"ok",void 0);else{const l=dl(n),c=ub(n.serverSyncTree_,e,o,l);zr(n.eventQueue_,c),n.server_.merge(e.toString(),t,(d,h)=>{const u=d==="ok";u||st("update at "+e+" failed: "+d);const m=pn(n.serverSyncTree_,l,!u),f=m.length>0?ws(n,e):e;Et(n.eventQueue_,f,m),Tn(n,s,d,h)}),Ye(t,d=>{const h=hl(n,Oe(e,d));ws(n,h)}),Et(n.eventQueue_,e,[])}}function Vb(n){Ni(n,"onDisconnectEvents");const e=Gr(n),t=yr();zo(n.onDisconnect_,be(),(i,r)=>{const o=Ch(i,r,n.serverSyncTree_,e);Rs(t,i,o)});let s=[];zo(t,be(),(i,r)=>{s=s.concat(Ri(n.serverSyncTree_,i,r));const o=hl(n,i);ws(n,o)}),n.onDisconnect_=yr(),Et(n.eventQueue_,be(),s)}function zb(n,e,t){n.server_.onDisconnectCancel(e.toString(),(s,i)=>{s==="ok"&&Vo(n.onDisconnect_,e),Tn(n,t,s,i)})}function Xc(n,e,t,s){const i=Le(t);n.server_.onDisconnectPut(e.toString(),i.val(!0),(r,o)=>{r==="ok"&&Rs(n.onDisconnect_,e,i),Tn(n,s,r,o)})}function Gb(n,e,t,s,i){const r=Le(t,s);n.server_.onDisconnectPut(e.toString(),r.val(!0),(o,l)=>{o==="ok"&&Rs(n.onDisconnect_,e,r),Tn(n,i,o,l)})}function qb(n,e,t,s){if(ir(t)){qe("onDisconnect().update() called with empty data.  Don't do anything."),Tn(n,s,"ok",void 0);return}n.server_.onDisconnectMerge(e.toString(),t,(i,r)=>{i==="ok"&&Ye(t,(o,l)=>{const c=Le(l);Rs(n.onDisconnect_,Oe(e,o),c)}),Tn(n,s,i,r)})}function Kb(n,e,t){let s;me(e._path)===".info"?s=Jo(n.infoSyncTree_,e,t):s=Jo(n.serverSyncTree_,e,t),Ah(n.eventQueue_,e._path,s)}function Zc(n,e,t){let s;me(e._path)===".info"?s=Ir(n.infoSyncTree_,e,t):s=Ir(n.serverSyncTree_,e,t),Ah(n.eventQueue_,e._path,s)}function Yb(n){n.persistentConnection_&&n.persistentConnection_.interrupt(Lb)}function Ni(n,...e){let t="";n.persistentConnection_&&(t=n.persistentConnection_.id+":"),qe(t,...e)}function Tn(n,e,t,s){e&&As(()=>{if(t==="ok")e(null);else{const i=(t||"error").toUpperCase();let r=i;s&&(r+=": "+s);const o=new Error(r);o.code=i,e(o)}})}function Nh(n,e,t){return Xa(n.serverSyncTree_,e,t)||ce.EMPTY_NODE}function ul(n,e=n.transactionQueueTree_){if(e||qr(n,e),Ns(e)){const t=Mh(n,e);H(t.length>0,"Sending zero length transaction queue"),t.every(i=>i.status===0)&&Qb(n,Pi(e),t)}else Ih(e)&&jr(e,t=>{ul(n,t)})}function Qb(n,e,t){const s=t.map(d=>d.currentWriteId),i=Nh(n,e,s);let r=i;const o=i.hash();for(let d=0;d<t.length;d++){const h=t[d];H(h.status===0,"tryToSendTransactionQueue_: items in queue should all be run."),h.status=1,h.retryCount++;const u=nt(e,h.path);r=r.updateChild(u,h.currentOutputSnapshotRaw)}const l=r.val(!0),c=e;n.server_.put(c.toString(),l,d=>{Ni(n,"transaction put response",{path:c.toString(),status:d});let h=[];if(d==="ok"){const u=[];for(let m=0;m<t.length;m++)t[m].status=2,h=h.concat(pn(n.serverSyncTree_,t[m].currentWriteId)),t[m].onComplete&&u.push(()=>t[m].onComplete(null,!0,t[m].currentOutputSnapshotResolved)),t[m].unwatcher();qr(n,ol(n.transactionQueueTree_,e)),ul(n,n.transactionQueueTree_),Et(n.eventQueue_,e,h);for(let m=0;m<u.length;m++)As(u[m])}else{if(d==="datastale")for(let u=0;u<t.length;u++)t[u].status===3?t[u].status=4:t[u].status=0;else{st("transaction at "+c.toString()+" failed: "+d);for(let u=0;u<t.length;u++)t[u].status=4,t[u].abortReason=d}ws(n,e)}},o)}function ws(n,e){const t=Oh(n,e),s=Pi(t),i=Mh(n,t);return Jb(n,i,s),s}function Jb(n,e,t){if(e.length===0)return;const s=[];let i=[];const o=e.filter(l=>l.status===0).map(l=>l.currentWriteId);for(let l=0;l<e.length;l++){const c=e[l],d=nt(t,c.path);let h=!1,u;if(H(d!==null,"rerunTransactionsUnderNode_: relativePath should not be null."),c.status===4)h=!0,u=c.abortReason,i=i.concat(pn(n.serverSyncTree_,c.currentWriteId,!0));else if(c.status===0)if(c.retryCount>=$b)h=!0,u="maxretry",i=i.concat(pn(n.serverSyncTree_,c.currentWriteId,!0));else{const m=Nh(n,c.path,o);c.currentInputSnapshot=m;const f=e[l].update(m.val());if(f!==void 0){Vr("transaction failed: Data returned ",f,c.path);let y=Le(f);typeof f=="object"&&f!=null&&Wt(f,".priority")||(y=y.updatePriority(m.getPriority()));const E=c.currentWriteId,x=Gr(n),_=Eh(y,m,x);c.currentOutputSnapshotRaw=y,c.currentOutputSnapshotResolved=_,c.currentWriteId=dl(n),o.splice(o.indexOf(E),1),i=i.concat(yh(n.serverSyncTree_,c.path,_,c.currentWriteId,c.applyLocally)),i=i.concat(pn(n.serverSyncTree_,E,!0))}else h=!0,u="nodata",i=i.concat(pn(n.serverSyncTree_,c.currentWriteId,!0))}Et(n.eventQueue_,t,i),i=[],h&&(e[l].status=2,function(m){setTimeout(m,Math.floor(0))}(e[l].unwatcher),e[l].onComplete&&(u==="nodata"?s.push(()=>e[l].onComplete(null,!1,e[l].currentInputSnapshot)):s.push(()=>e[l].onComplete(new Error(u),!1,null))))}qr(n,n.transactionQueueTree_);for(let l=0;l<s.length;l++)As(s[l]);ul(n,n.transactionQueueTree_)}function Oh(n,e){let t,s=n.transactionQueueTree_;for(t=me(e);t!==null&&Ns(s)===void 0;)s=ol(s,t),e=Ie(e),t=me(e);return s}function Mh(n,e){const t=[];return Dh(n,e,t),t.sort((s,i)=>s.order-i.order),t}function Dh(n,e,t){const s=Ns(e);if(s)for(let i=0;i<s.length;i++)t.push(s[i]);jr(e,i=>{Dh(n,i,t)})}function qr(n,e){const t=Ns(e);if(t){let s=0;for(let i=0;i<t.length;i++)t[i].status!==2&&(t[s]=t[i],s++);t.length=s,kh(e,t.length>0?t:void 0)}jr(e,s=>{qr(n,s)})}function hl(n,e){const t=Pi(Oh(n,e)),s=ol(n.transactionQueueTree_,e);return Ib(s,i=>{Eo(n,i)}),Eo(n,s),Sh(s,i=>{Eo(n,i)}),t}function Eo(n,e){const t=Ns(e);if(t){const s=[];let i=[],r=-1;for(let o=0;o<t.length;o++)t[o].status===3||(t[o].status===1?(H(r===o-1,"All SENT items should be at beginning of queue."),r=o,t[o].status=3,t[o].abortReason="set"):(H(t[o].status===0,"Unexpected transaction status in abort"),t[o].unwatcher(),i=i.concat(pn(n.serverSyncTree_,t[o].currentWriteId,!0)),t[o].onComplete&&s.push(t[o].onComplete.bind(null,new Error("set"),!1,null))));r===-1?kh(e,void 0):t.length=r+1,Et(n.eventQueue_,Pi(e),i);for(let o=0;o<s.length;o++)As(s[o])}}/**
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
 */function Xb(n){let e="";const t=n.split("/");for(let s=0;s<t.length;s++)if(t[s].length>0){let i=t[s];try{i=decodeURIComponent(i.replace(/\+/g," "))}catch{}e+="/"+i}return e}function Zb(n){const e={};n.charAt(0)==="?"&&(n=n.substring(1));for(const t of n.split("&")){if(t.length===0)continue;const s=t.split("=");s.length===2?e[decodeURIComponent(s[0])]=decodeURIComponent(s[1]):st(`Invalid query segment '${t}' in query '${n}'`)}return e}const ed=function(n,e){const t=ew(n),s=t.namespace;t.domain==="firebase.com"&&en(t.host+" is no longer supported. Please use <YOUR FIREBASE>.firebaseio.com instead"),(!s||s==="undefined")&&t.domain!=="localhost"&&en("Cannot parse Firebase url. Please use https://<YOUR FIREBASE>.firebaseio.com"),t.secure||l_();const i=t.scheme==="ws"||t.scheme==="wss";return{repoInfo:new Uu(t.host,t.secure,s,i,e,"",s!==t.subdomain),path:new Ce(t.pathString)}},ew=function(n){let e="",t="",s="",i="",r="",o=!0,l="https",c=443;if(typeof n=="string"){let d=n.indexOf("//");d>=0&&(l=n.substring(0,d-1),n=n.substring(d+2));let h=n.indexOf("/");h===-1&&(h=n.length);let u=n.indexOf("?");u===-1&&(u=n.length),e=n.substring(0,Math.min(h,u)),h<u&&(i=Xb(n.substring(h,u)));const m=Zb(n.substring(Math.min(n.length,u)));d=e.indexOf(":"),d>=0?(o=l==="https"||l==="wss",c=parseInt(e.substring(d+1),10)):d=e.length;const f=e.slice(0,d);if(f.toLowerCase()==="localhost")t="localhost";else if(f.split(".").length<=2)t=f;else{const y=e.indexOf(".");s=e.substring(0,y).toLowerCase(),t=e.substring(y+1),r=s}"ns"in m&&(r=m.ns)}return{host:e,port:c,domain:t,subdomain:s,secure:o,scheme:l,pathString:i,namespace:r}};/**
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
 */const td="-0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ_abcdefghijklmnopqrstuvwxyz",tw=function(){let n=0;const e=[];return function(t){const s=t===n;n=t;let i;const r=new Array(8);for(i=7;i>=0;i--)r[i]=td.charAt(t%64),t=Math.floor(t/64);H(t===0,"Cannot push at time == 0");let o=r.join("");if(s){for(i=11;i>=0&&e[i]===63;i--)e[i]=0;e[i]++}else for(i=0;i<12;i++)e[i]=Math.floor(Math.random()*64);for(i=0;i<12;i++)o+=td.charAt(e[i]);return H(o.length===20,"nextPushId: Length should be 20."),o}}();/**
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
 */class Lh{constructor(e,t,s,i){this.eventType=e,this.eventRegistration=t,this.snapshot=s,this.prevName=i}getPath(){const e=this.snapshot.ref;return this.eventType==="value"?e._path:e.parent._path}getEventType(){return this.eventType}getEventRunner(){return this.eventRegistration.getEventRunner(this)}toString(){return this.getPath().toString()+":"+this.eventType+":"+je(this.snapshot.exportVal())}}class $h{constructor(e,t,s){this.eventRegistration=e,this.error=t,this.path=s}getPath(){return this.path}getEventType(){return"cancel"}getEventRunner(){return this.eventRegistration.getEventRunner(this)}toString(){return this.path.toString()+":cancel"}}/**
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
 */class Fh{constructor(e,t){this.snapshotCallback=e,this.cancelCallback=t}onValue(e,t){this.snapshotCallback.call(null,e,t)}onCancel(e){return H(this.hasCancelCallback,"Raising a cancel event on a listener with no cancel callback"),this.cancelCallback.call(null,e)}get hasCancelCallback(){return!!this.cancelCallback}matches(e){return this.snapshotCallback===e.snapshotCallback||this.snapshotCallback.userCallback!==void 0&&this.snapshotCallback.userCallback===e.snapshotCallback.userCallback&&this.snapshotCallback.context===e.snapshotCallback.context}}/**
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
 */class nw{constructor(e,t){this._repo=e,this._path=t}cancel(){const e=new Dt;return zb(this._repo,this._path,e.wrapCallback(()=>{})),e.promise}remove(){Un("OnDisconnect.remove",this._path);const e=new Dt;return Xc(this._repo,this._path,null,e.wrapCallback(()=>{})),e.promise}set(e){Un("OnDisconnect.set",this._path),Tr("OnDisconnect.set",e,this._path,!1);const t=new Dt;return Xc(this._repo,this._path,e,t.wrapCallback(()=>{})),t.promise}setWithPriority(e,t){Un("OnDisconnect.setWithPriority",this._path),Tr("OnDisconnect.setWithPriority",e,this._path,!1),Pb("OnDisconnect.setWithPriority",t);const s=new Dt;return Gb(this._repo,this._path,e,t,s.wrapCallback(()=>{})),s.promise}update(e){Un("OnDisconnect.update",this._path),xh("OnDisconnect.update",e,this._path);const t=new Dt;return qb(this._repo,this._path,e,t.wrapCallback(()=>{})),t.promise}}/**
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
 */class Oi{constructor(e,t,s,i){this._repo=e,this._path=t,this._queryParams=s,this._orderByCalled=i}get key(){return ge(this._path)?null:Fa(this._path)}get ref(){return new Ht(this._repo,this._path)}get _queryIdentifier(){const e=Fc(this._queryParams),t=Ma(e);return t==="{}"?"default":t}get _queryObject(){return Fc(this._queryParams)}isEqual(e){if(e=$e(e),!(e instanceof Oi))return!1;const t=this._repo===e._repo,s=Ua(this._path,e._path),i=this._queryIdentifier===e._queryIdentifier;return t&&s&&i}toJSON(){return this.toString()}toString(){return this._repo.toString()+z_(this._path)}}function sw(n,e){if(n._orderByCalled===!0)throw new Error(e+": You can't combine multiple orderBy calls.")}function iw(n){let e=null,t=null;if(n.hasStart()&&(e=n.getIndexStartValue()),n.hasEnd()&&(t=n.getIndexEndValue()),n.getIndex()===Wn){const s="Query: When ordering by key, you may only pass one argument to startAt(), endAt(), or equalTo().",i="Query: When ordering by key, the argument passed to startAt(), startAfter(), endAt(), endBefore(), or equalTo() must be a string.";if(n.hasStart()){if(n.getIndexStartName()!==Yn)throw new Error(s);if(typeof e!="string")throw new Error(i)}if(n.hasEnd()){if(n.getIndexEndName()!==En)throw new Error(s);if(typeof t!="string")throw new Error(i)}}else if(n.getIndex()===Ne){if(e!=null&&!Sr(e)||t!=null&&!Sr(t))throw new Error("Query: When ordering by priority, the first argument passed to startAt(), startAfter() endAt(), endBefore(), or equalTo() must be a valid priority value (null, a number, or a string).")}else if(H(n.getIndex()instanceof Ha||n.getIndex()===th,"unknown index type."),e!=null&&typeof e=="object"||t!=null&&typeof t=="object")throw new Error("Query: First argument passed to startAt(), startAfter(), endAt(), endBefore(), or equalTo() cannot be an object.")}class Ht extends Oi{constructor(e,t){super(e,t,new Va,!1)}get parent(){const e=Ku(this._path);return e===null?null:new Ht(this._repo,e)}get root(){let e=this;for(;e.parent!==null;)e=e.parent;return e}}class Cs{constructor(e,t,s){this._node=e,this.ref=t,this._index=s}get priority(){return this._node.getPriority().val()}get key(){return this.ref.key}get size(){return this._node.numChildren()}child(e){const t=new Ce(e),s=Es(this.ref,e);return new Cs(this._node.getChild(t),s,Ne)}exists(){return!this._node.isEmpty()}exportVal(){return this._node.val(!0)}forEach(e){return this._node.isLeafNode()?!1:!!this._node.forEachChild(this._index,(s,i)=>e(new Cs(i,Es(this.ref,s),Ne)))}hasChild(e){const t=new Ce(e);return!this._node.getChild(t).isEmpty()}hasChildren(){return this._node.isLeafNode()?!1:!this._node.isEmpty()}toJSON(){return this.exportVal()}val(){return this._node.val()}}function G(n,e){return n=$e(n),n._checkNotDeleted("ref"),e!==void 0?Es(n._root,e):n._root}function Es(n,e){return n=$e(n),me(n._path)===null?Nb("child","path",e):ll("child","path",e),new Ht(n._repo,Oe(n._path,e))}function mn(n){return n=$e(n),new nw(n._repo,n._path)}function Cn(n,e){n=$e(n),Un("push",n._path),Tr("push",e,n._path,!0);const t=Ph(n._repo),s=tw(t),i=Es(n,s),r=Es(n,s);let o;return e!=null?o=rt(r,e).then(()=>r):o=Promise.resolve(r),i.then=o.then.bind(o),i.catch=o.then.bind(o,void 0),i}function $t(n){return Un("remove",n._path),rt(n,null)}function rt(n,e){n=$e(n),Un("set",n._path),Tr("set",e,n._path,!1);const t=new Dt;return Hb(n._repo,n._path,e,null,t.wrapCallback(()=>{})),t.promise}function Pe(n,e){xh("update",e,n._path);const t=new Dt;return jb(n._repo,n._path,e,t.wrapCallback(()=>{})),t.promise}function tn(n){n=$e(n);const e=new Fh(()=>{}),t=new Kr(e);return Wb(n._repo,n,t).then(s=>new Cs(s,new Ht(n._repo,n._path),n._queryParams.getIndex()))}class Kr{constructor(e){this.callbackContext=e}respondsTo(e){return e==="value"}createEvent(e,t){const s=t._queryParams.getIndex();return new Lh("value",this,new Cs(e.snapshotNode,new Ht(t._repo,t._path),s))}getEventRunner(e){return e.getEventType()==="cancel"?()=>this.callbackContext.onCancel(e.error):()=>this.callbackContext.onValue(e.snapshot,null)}createCancelEvent(e,t){return this.callbackContext.hasCancelCallback?new $h(this,e,t):null}matches(e){return e instanceof Kr?!e.callbackContext||!this.callbackContext?!0:e.callbackContext.matches(this.callbackContext):!1}hasAnyCallback(){return this.callbackContext!==null}}class fl{constructor(e,t){this.eventType=e,this.callbackContext=t}respondsTo(e){let t=e==="children_added"?"child_added":e;return t=t==="children_removed"?"child_removed":t,this.eventType===t}createCancelEvent(e,t){return this.callbackContext.hasCancelCallback?new $h(this,e,t):null}createEvent(e,t){H(e.childName!=null,"Child events should have a childName.");const s=Es(new Ht(t._repo,t._path),e.childName),i=t._queryParams.getIndex();return new Lh(e.type,this,new Cs(e.snapshotNode,s,i),e.prevName)}getEventRunner(e){return e.getEventType()==="cancel"?()=>this.callbackContext.onCancel(e.error):()=>this.callbackContext.onValue(e.snapshot,e.prevName)}matches(e){return e instanceof fl?this.eventType===e.eventType&&(!this.callbackContext||!e.callbackContext||this.callbackContext.matches(e.callbackContext)):!1}hasAnyCallback(){return!!this.callbackContext}}function Yr(n,e,t,s,i){let r;if(typeof s=="object"&&(r=void 0,i=s),typeof s=="function"&&(r=s),i&&i.onlyOnce){const c=t,d=(h,u)=>{Zc(n._repo,n,l),c(h,u)};d.userCallback=t.userCallback,d.context=t.context,t=d}const o=new Fh(t,r||void 0),l=e==="value"?new Kr(o):new fl(e,o);return Kb(n._repo,n,l),()=>Zc(n._repo,n,l)}function tt(n,e,t,s){return Yr(n,"value",e,t,s)}function ti(n,e,t,s){return Yr(n,"child_added",e,t,s)}function rw(n,e,t,s){return Yr(n,"child_changed",e,t,s)}function ow(n,e,t,s){return Yr(n,"child_removed",e,t,s)}class Uh{}class aw extends Uh{constructor(e){super(),this._limit=e,this.type="limitToLast"}_apply(e){if(e._queryParams.hasLimit())throw new Error("limitToLast: Limit was already set (by another call to limitToFirst or limitToLast).");return new Oi(e._repo,e._path,pv(e._queryParams,this._limit),e._orderByCalled)}}function mi(n){if(typeof n!="number"||Math.floor(n)!==n||n<=0)throw new Error("limitToLast: First argument must be a positive integer.");return new aw(n)}class lw extends Uh{constructor(e){super(),this._path=e,this.type="orderByChild"}_apply(e){sw(e,"orderByChild");const t=new Ce(this._path);if(ge(t))throw new Error("orderByChild: cannot pass in empty path. Use orderByValue() instead.");const s=new Ha(t),i=mv(e._queryParams,s);return iw(i),new Oi(e._repo,e._path,i,!0)}}function gi(n){return ll("orderByChild","path",n),new lw(n)}function yi(n,...e){let t=$e(n);for(const s of e)t=s._apply(t);return t}sb(Ht);lb(Ht);/**
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
 */const cw="FIREBASE_DATABASE_EMULATOR_HOST",Zo={};let dw=!1;function uw(n,e,t,s){n.repoInfo_=new Uu(`${e}:${t}`,!1,n.repoInfo_.namespace,n.repoInfo_.webSocketOnly,n.repoInfo_.nodeAdmin,n.repoInfo_.persistenceKey,n.repoInfo_.includeNamespaceInQueryParams,!0),s&&(n.authTokenProvider_=s)}function hw(n,e,t,s,i){let r=s||n.options.databaseURL;r===void 0&&(n.options.projectId||en("Can't determine Firebase Database URL. Be sure to include  a Project ID when calling firebase.initializeApp()."),qe("Using default host for project ",n.options.projectId),r=`${n.options.projectId}-default-rtdb.firebaseio.com`);let o=ed(r,i),l=o.repoInfo,c;typeof process<"u"&&bc&&(c=bc[cw]),c?(r=`http://${c}?ns=${l.namespace}`,o=ed(r,i),l=o.repoInfo):o.repoInfo.secure;const d=new v_(n.name,n.options,e);Ob("Invalid Firebase Database URL",o),ge(o.path)||en("Database URL must point to the root of a Firebase Database (not including a child path).");const h=pw(l,n,d,new __(n.name,t));return new mw(h,n)}function fw(n,e){const t=Zo[e];(!t||t[n.key]!==n)&&en(`Database ${e}(${n.repoInfo_}) has already been deleted.`),Yb(n),delete t[n.key]}function pw(n,e,t,s){let i=Zo[e.name];i||(i={},Zo[e.name]=i);let r=i[n.toURLString()];return r&&en("Database initialized multiple times. Please make sure the format of the database URL matches with each database() call."),r=new Fb(n,dw,t,s),i[n.toURLString()]=r,r}class mw{constructor(e,t){this._repoInternal=e,this.app=t,this.type="database",this._instanceStarted=!1}get _repo(){return this._instanceStarted||(Ub(this._repoInternal,this.app.options.appId,this.app.options.databaseAuthVariableOverride),this._instanceStarted=!0),this._repoInternal}get _root(){return this._rootInternal||(this._rootInternal=new Ht(this._repo,be())),this._rootInternal}_delete(){return this._rootInternal!==null&&(fw(this._repo,this.app.name),this._repoInternal=null,this._rootInternal=null),Promise.resolve()}_checkNotDeleted(e){this._rootInternal===null&&en("Cannot call "+e+" on a deleted database.")}}function gw(n=Wd(),e){const t=ka(n,"database").getImmediate({identifier:e});if(!t._instanceStarted){const s=pp("database");s&&yw(t,...s)}return t}function yw(n,e,t,s={}){n=$e(n),n._checkNotDeleted("useEmulator"),n._instanceStarted&&en("Cannot call useEmulator() after instance has already been initialized.");const i=n._repoInternal;let r;if(i.repoInfo_.nodeAdmin)s.mockUserToken&&en('mockUserToken is not supported by the Admin SDK. For client access with mock users, please use the "firebase" package instead of "firebase-admin".'),r=new Zi(Zi.OWNER);else if(s.mockUserToken){const o=typeof s.mockUserToken=="string"?s.mockUserToken:mp(s.mockUserToken,n.app.options.projectId);r=new Zi(o)}uw(i,e,t,r)}/**
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
 */function _w(n){n_(xs),gs(new Gn("database",(e,{instanceIdentifier:t})=>{const s=e.getProvider("app").getImmediate(),i=e.getProvider("auth-internal"),r=e.getProvider("app-check-internal");return hw(s,i,r,t)},"PUBLIC").setMultipleInstances(!0)),vn(wc,Cc,n),vn(wc,Cc,"esm2017")}/**
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
 */const vw={".sv":"timestamp"};function dt(){return vw}Qt.prototype.simpleListen=function(n,e){this.sendRequest("q",{p:n},e)};Qt.prototype.echo=function(n,e){this.sendRequest("echo",{d:n},e)};_w();var bw="firebase",ww="10.14.1";/**
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
 */vn(bw,ww,"app");const Bh={apiKey:"AIzaSyAXWr1bW5FljYLu7levh_P6w0rrbdhVToE",authDomain:"playlist-lobby.firebaseapp.com",databaseURL:"https://playlist-lobby-default-rtdb.europe-west1.firebasedatabase.app",projectId:"playlist-lobby",appId:"1:98113831672:web:caae55b5c34ba63688310d"},Cw=!Bh.apiKey.startsWith("PASTE"),Wh=Cw,Ew=Bh,Hh=Bd(Ew,"hotel"),Os=e_(Hh),q=gw(Hh);class jh{constructor(e,t,s,i,r,o,l,c,d){switch(this.direction=t,this.headDirection=s,this.isHeadOnly=l,this.isBodyOnly=c,this.scale=d,this.isDownsampled=!1,this.isLarge=!1,this.isSmall=!1,this.rectWidth=64,this.rectHeight=110,d){case"l":this.isLarge=!0,this.rectWidth=128,this.rectHeight=220;break;case"s":this.isSmall=!0,this.rectWidth=32,this.rectHeight=55;break;case"d":this.isDownsampled=!0;break}switch(this.figure=kw(e),this.frame=o,this.drawAction={body:"std"},this.handItem=-1,this.drawOrder="std",this.gesture=r,r){case"spk":this.drawAction.speak="spk";break;case"eyb":this.drawAction.eye="eyb";break;case"":this.drawAction.gesture="std";break;default:this.drawAction.gesture=r;break}this.action=i;for(let h of this.action){const u=h.split("=");switch(u[0]){case"wlk":this.drawAction.wlk="wlk";break;case"sit":this.drawAction.sit="sit";break;case"lay":this.drawAction.body="lay",this.drawAction.eye="lay";const m=this.rectWidth;switch(this.rectWidth=this.rectHeight,this.rectHeight=m,this.gesture){case"spk":this.drawAction.speak="lsp";break;case"eyb":this.drawAction.eye="ley";break;case"std":this.drawAction.gesture="lay";break;default:this.drawAction.gesture="l"+this.gesture.substr(0,2);break}break;case"wav":this.drawAction.handLeft="wav";break;case"crr":case"drk":this.drawAction.handRight=u[0],this.drawAction.itemRight=u[0],this.handItem=Number(u[1]);break;case"swm":this.drawAction.swm="swm",this.gesture==="spk"&&(this.drawAction.speak="sws");break;case"":this.drawAction.body="std";break;default:this.drawAction.body=u[0];break}}this.drawAction.sit==="sit"&&(this.direction>=2&&this.direction<=4?(this.drawOrder="sit",this.drawAction.handRight==="drk"&&this.direction>=2&&this.direction<=3?this.drawOrder+=".rh-up":this.drawAction.handLeft&&this.direction===4&&(this.drawOrder+=".lh-up")):this.drawAction.body==="lay"?this.drawOrder="lay":this.drawAction.handRight==="drk"&&this.direction>=0&&this.direction<=3?this.drawOrder="rh-up":this.drawAction.handLeft&&this.direction>=4&&this.direction<=6&&(this.drawOrder="lh-up"))}}const kw=n=>{const e={},t=[];for(let s of n.split(".")){const i=s.split("-"),r={type:i[0],id:i[1],colors:[i[2]]};i[3]!=null&&r.colors.push(i[3]),e[r.type]=r}for(let s in e)t.push(e[s]);return t},Vh=(n,e,t)=>{const s=n.frames[t];if(s==null)return null;const{x:i,y:r,w:o,h:l}=s.frame,c=document.createElement("canvas");c.width=o,c.height=l;const d=c.getContext("2d");return d!=null?(c.width=o,c.height=l,d.drawImage(e,i,r,o,l,0,0,o,l),c):null};class Iw{constructor(e,t,s,i,r,o,l,c){this.resDirection=o,s==="hd"&&i&&(r=1),s==="ey"&&t==="std"&&r===1&&o===3&&(t="sml"),s==="fa"&&t==="std"&&r===2&&(o===2||o===4)&&(this.resDirection=1),s==="he"&&t==="std"&&r===1&&o===2&&(this.resDirection=0),s==="he"&&t==="std"&&r===8&&(this.resDirection=o%2===0?1:this.resDirection),s==="he"&&t==="std"&&(r===2131||r===2132)&&o>=2&&o<=6&&(this.resDirection=1),s==="ha"&&t==="std"&&r===2518&&(this.resDirection=o%2===0?2:1),s==="ha"&&t==="std"&&r===2519&&(this.resDirection=o%2===0?2:3),s==="ha"&&t==="std"&&r===2588&&(this.resDirection=7),s==="ha"&&t==="std"&&r===2589&&(this.resDirection=3),this.lib=e,this.isFlip=!1,this.action=t,this.resAction=t,this.type=s,this.resType=s,this.isSmall=i,this.partId=r,this.direction=o,this.frame=l,this.resFrame=l,this.color=c,this.resourceName=this.getResourceName(),this.promise=null,this.resource=null}getResourceName(){let e=this.isSmall?"sh":"h";return e+="_",e+=this.resAction,e+="_",e+=this.resType,e+="_",e+=this.partId,e+="_",e+=this.resDirection,e+="_",e+=this.resFrame,e}extractFromAtlas(e,t){const s=Vh(e,t,this.lib+"_"+this.getResourceName()+".png");return s!=null&&(this.resource=s,this.promise=Promise.resolve(s)),this.promise}downloadAsync(e){if(this.promise==null){let t=new Image;this.promise=new Promise((s,i)=>{t.onload=()=>{this.resource=t,s(t)},t.onerror=()=>{i("Could not load image: "+t.src)}}),t.crossOrigin="anonymous",t.src=e+this.lib+"/"+this.lib+"_"+this.getResourceName()+".png"}return this.promise}}class Sw{constructor(e){this.customLibs={},this.ready=!1,this.offsets={},this.chunks={},this.figuremap={},this.figuredata={},this.partsets={},this.draworder={},this.animation={},this.resourcesUrl=e}initialize(){const e=this.loadFiles();return Promise.all(e).then(()=>{this.ready=!0})}loadFiles(){return[this.fetchJsonAsync(this.resourcesUrl+"map.json").then(e=>{this.figuremap=e}),this.fetchJsonAsync(this.resourcesUrl+"figuredata.json").then(e=>{this.figuredata=e}),this.fetchJsonAsync(this.resourcesUrl+"partsets.json").then(e=>{this.partsets=e}),this.fetchJsonAsync(this.resourcesUrl+"draworder.json").then(e=>{this.draworder=e}),this.fetchJsonAsync(this.resourcesUrl+"animation.json").then(e=>{this.animation=e})]}fetchJsonAsync(e){return new Promise((t,s)=>{fetch(e,{method:"GET",mode:"cors",cache:"default"}).then(r=>r.json()).then(r=>t(r)).catch(r=>s(r))})}downloadAtlasAsync(e){let t=new Image,s=new Promise((i,r)=>{t.onload=()=>{i(t)},t.onerror=()=>{r("Could not load image: "+t.src)}});return t.crossOrigin="anonymous",t.src=this.resourcesUrl+e+"/atlas.png",s}fetchOffsetAsync(e){if(this.customLibs[e])return this.customLibs[e]().then(({data:i,atlas:r})=>{this.offsets[e].data=i,this.offsets[e].atlas=r});const t=this.fetchJsonAsync(this.resourcesUrl+e+"/offset.json").then(i=>{this.offsets[e].data=i}),s=this.downloadAtlasAsync(e).then(i=>{this.offsets[e].atlas=i});return Promise.all([t,s])}getTypeColorId(e,t){const s=new jh(e,0,0,["std"],"std",0,!1,!1,"d");let i=0;for(let r of s.figure)if(r.type===t){const o=this.getPartColor(r);for(let l in o){const c=o[l];for(let d of c)if(d.color!=null)return i=parseInt(d.color,16),i}}return i}getChatColor(e){return this.getTypeColorId(e,"ch")}generateGeneric(e,t){const s={};s.rect=this.getActivePartSet(e.isHeadOnly?"head":"figure"),s.head=this.getActivePartSet("head"),s.eye=this.getActivePartSet("eye"),s.gesture=this.getActivePartSet("gesture"),s.speak=this.getActivePartSet("speak"),s.walk=this.getActivePartSet("walk"),s.sit=this.getActivePartSet("sit"),s.itemRight=this.getActivePartSet("itemRight"),s.handRight=this.getActivePartSet("handRight"),s.handLeft=this.getActivePartSet("handLeft"),s.swim=this.getActivePartSet("swim");let i=this.getDrawOrder(e.drawOrder,e.direction);i==null&&(i=this.getDrawOrder("std",e.direction));const r={};for(let c of e.figure){const d=this.getPartColor(c);for(let h in d)r[h]==null&&(r[h]=[]),r[h]=d[h].concat(r[h])}e.handItem>0&&(r.ri=[{index:0,id:e.handItem}]);const o=[],l=[];for(let c of i){const d=r[c];if(d!=null)for(let h of d){const u=this.getPartUniqueName(c,h.id);if(u!=null){if(r.hidden.includes(c)||s.head.includes(c)&&e.isBodyOnly||!s.rect.includes(c)||t&&(s.gesture.includes(c)||s.eye.includes(c)))continue;let m=e.direction,f=null;if(s.rect.includes(c)&&(f=e.drawAction.body),s.head.includes(c)&&(m=e.headDirection),s.speak.includes(c)&&e.drawAction.speak&&(f=e.drawAction.speak),s.gesture.includes(c)&&e.drawAction.gesture&&(f=e.drawAction.gesture),s.eye.includes(c)&&(h.colorable=!1,e.drawAction.eye&&(f=e.drawAction.eye)),s.walk.includes(c)&&e.drawAction.wlk&&(f=e.drawAction.wlk),s.sit.includes(c)&&e.drawAction.sit&&(f=e.drawAction.sit),s.handRight.includes(c)&&e.drawAction.handRight&&(f=e.drawAction.handRight),s.itemRight.includes(c)&&e.drawAction.itemRight&&(f=e.drawAction.itemRight),s.handLeft.includes(c)&&e.drawAction.handLeft&&(f=e.drawAction.handLeft),s.swim.includes(c)&&e.drawAction.swm&&(f=e.drawAction.swm),f==null)continue;this.offsets[u]==null&&(this.offsets[u]={promise:this.fetchOffsetAsync(u),data:{},atlas:{}}),l.push(this.offsets[u].promise);const y=h.colorable?h.color:null,w=this.getPartResource(u,f,c,e.isSmall,h.id,m,e.frame,y);o.push(w)}}}return new Promise((c,d)=>{Promise.all(l).then(()=>{let h=document.createElement("canvas"),u=h.getContext("2d");h.width=e.rectWidth,h.height=e.rectHeight;const m=[];for(let f of o)if(this.offsets[f.lib].data!=null&&this.offsets[f.lib].data[f.getResourceName()]!=null&&!this.offsets[f.lib].data[f.getResourceName()].flipped){const y=this.offsets[f.lib].data.atlas,w=this.offsets[f.lib].atlas;m.push(f.extractFromAtlas(y,w))}else{let y=this.partsets.partSet[f.type]["flipped-set-type"];if(y!==""&&(f.resType=y),f.action==="std"&&(this.offsets[f.lib].data==null||this.offsets[f.lib].data[f.getResourceName()]==null||this.offsets[f.lib].data[f.getResourceName()].flipped)&&(f.resAction="spk"),(this.offsets[f.lib].data==null||this.offsets[f.lib].data[f.getResourceName()]==null||this.offsets[f.lib].data[f.getResourceName()].flipped)&&(f.isFlip=!0,f.resAction=f.action,f.resDirection=6-f.direction),(this.offsets[f.lib].data==null||this.offsets[f.lib].data[f.getResourceName()]==null||this.offsets[f.lib].data[f.getResourceName()].flipped)&&(f.resFrame=f.frame+1,f.isFlip=!1),(this.offsets[f.lib].data==null||this.offsets[f.lib].data[f.getResourceName()]==null||this.offsets[f.lib].data[f.getResourceName()].flipped)&&(f.isFlip=!1,f.resFrame=f.frame,f.resAction=f.action,f.direction===7&&(f.resDirection=3),f.direction===3&&(f.resDirection=7)),(this.offsets[f.lib].data==null||this.offsets[f.lib].data[f.getResourceName()]==null||this.offsets[f.lib].data[f.getResourceName()].flipped)&&(f.resFrame=f.frame+1,f.isFlip=!1),(this.offsets[f.lib].data==null||this.offsets[f.lib].data[f.getResourceName()]==null||this.offsets[f.lib].data[f.getResourceName()].flipped)&&(f.resAction=f.action,f.resType=y,f.resDirection=f.direction),f.action==="std"&&(this.offsets[f.lib].data==null||this.offsets[f.lib].data[f.getResourceName()]==null||this.offsets[f.lib].data[f.getResourceName()].flipped)&&(f.resAction="spk",f.resType=f.type),this.offsets[f.lib].data!=null&&this.offsets[f.lib].data[f.getResourceName()]!=null&&!this.offsets[f.lib].data[f.getResourceName()].flipped){const w=this.offsets[f.lib].data.atlas,E=this.offsets[f.lib].atlas;m.push(f.extractFromAtlas(w,E))}}Promise.all(m).catch(f=>{d("Error downloading chunks")}).then(()=>{for(let f of o)if(this.offsets[f.lib].data!=null&&this.offsets[f.lib].data[f.getResourceName()]!=null&&f.resource!=null){let y=-this.offsets[f.lib].data[f.getResourceName()].x,w=e.rectHeight/2-this.offsets[f.lib].data[f.getResourceName()].y+e.rectHeight/2.5,E=f.resource;f.color!=null&&(E=this.tintSprite(E,f.color,t?170:255)),f.isFlip&&(y=-(y+E.width-e.rectWidth+1),E=this.flipImage(E)),u!=null&&u.drawImage(E,y,w)}e.isDownsampled&&(h=this.downsampleImage(h)),c(h)})})})}getActivePartSet(e){const t=this.partsets.activePartSet[e].activePart;return t==null||t.length===0?null:t}getDrawOrder(e,t){const s=this.draworder[e][t];return s==null||s.length===0?null:s}getPartPalette(e){let t=this.figuredata.settype[e];if(t!=null){const s=t.paletteid;return this.figuredata.palette[s]}return null}getPartPaletteCount(e,t){const s=this.getPartSet(e);if(s!=null){const i=s[t];if(i!=null){const r=i.part,o=Math.max.apply(Math,r.map(l=>l.colorindex));return Math.max(1,o)}}return 1}getPartSet(e){let t=this.figuredata.settype[e];return t!=null?t.set:null}getPartColor(e){const t={};let s=this.figuredata.settype[e.type];if(s!=null){if(s.set[e.id]!=null&&s.set[e.id].part!=null)for(let i of s.set[e.id].part){const r=i;let o={index:r.index,id:r.id,colorable:r.colorable};r.colorable&&(o.color=this.getColorByPaletteId(s.paletteid,e.colors[r.colorindex-1])),t[r.type]==null?t[r.type]=[o]:t[r.type].push(o)}if(t.hidden=[],s.set[e.id]!=null&&Array.isArray(s.set[e.id].hidden))for(let i of s.set[e.id].hidden)t.hidden.push(i)}return t}getColorByPaletteId(e,t){return this.figuredata.palette[e]!=null&&this.figuredata.palette[e][t]!=null&&this.figuredata.palette[e][t].color!=null?this.figuredata.palette[e][t].color:null}getPartUniqueName(e,t){let s=this.figuremap[e][t];return s==null&&e==="hrb"&&(s=this.figuremap.hr[t]),s==null&&(s=this.figuremap[e][1]),s==null&&(s=this.figuremap[e][0]),s}getPartResource(e,t,s,i,r,o,l,c){let d=this.getFrameNumber(s,t,l),h=new Iw(e,t,s,i,r,o,d,c),u=h.getResourceName();return this.chunks[u]!=null&&this.chunks[u].resource!=null?(h.resource=this.chunks[u].resource,h.promise=this.chunks[u].promise):this.chunks[u]=h,h}getFrameNumber(e,t,s){const i={wav:"Wave",wlk:"Move",spk:"Talk"};if(i[t]!=null&&this.animation[i[t]].part[e]!=null){const r=this.animation[i[t]].part[e].length;if(this.animation[i[t]].part[e][s%r]!=null)return this.animation[i[t]].part[e][s%r].number}return 0}tintSprite(e,t,s){let i=document.createElement("canvas"),r=i.getContext("2d");if(r==null)return null;let o=this.hex2rgb(t),l=e.width,c=e.height;i.width=l,i.height=c,r.drawImage(e,0,0);let d=r.getImageData(0,0,l,c);for(let h=0;h<c;h++){let u=h*l*4;for(let m=0;m<l;m++)u++,u++,u++,d.data[u++]!==0&&(d.data[u-1]=s,d.data[u-2]=Math.round(o.b*d.data[u-2]/255),d.data[u-3]=Math.round(o.g*d.data[u-3]/255),d.data[u-4]=Math.round(o.r*d.data[u-4]/255))}return r.putImageData(d,0,0),i}hex2rgb(e){const t=/^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(e);return t?{r:parseInt(t[1],16),g:parseInt(t[2],16),b:parseInt(t[3],16)}:null}flipImage(e){let t=document.createElement("canvas"),s=t.getContext("2d");if(s==null)return null;let i=e.width,r=e.height;return t.width=i,t.height=r,s.save(),s.scale(-1,1),s.drawImage(e,0,0,i*-1,r),s.restore(),t}downsampleImage(e){let t=document.createElement("canvas"),s=t.getContext("2d");if(s==null)return null;let i=e.width,r=e.height;return t.width=i,t.height=r,s.save(),s.scale(.5,.5),s.drawImage(e,0,0),s.restore(),t}}const Tw="https://images.bobba.io/gordon/PRODUCTION-202006192205-424220153/",Me=new Sw(Tw),Mi=Me.initialize(),xr=new Map,er=new Map;function zh(n){return[n.figure,n.dir,n.headDir??n.dir,(n.actions??["std"]).join("+"),n.gesture??"std",n.frame??0,n.headOnly?1:0].join("|")}function xw(){xr.clear(),er.clear()}function Aw(n){return xr.get(zh(n))}function At(n){const e=zh(n),t=xr.get(e);if(t)return Promise.resolve(t);const s=er.get(e);if(s)return s;const i=Mi.then(()=>{const r=new jh(n.figure,n.dir&7,(n.headDir??n.dir)&7,n.actions??["std"],n.gesture??"std",n.frame??0,!!n.headOnly,!1,"n");return Me.generateGeneric(r,!1)}).then(r=>(xr.set(e,r),r)).catch(r=>(console.warn("avatar render failed",n.figure,r),null)).finally(()=>er.delete(e));return er.set(e,i),i}const yt=[{id:"hd",label:"Face & skin",headOnly:!0,required:!0},{id:"hr",label:"Hair",headOnly:!0,required:!1},{id:"ha",label:"Hats",headOnly:!0,required:!1},{id:"he",label:"Head items",headOnly:!0,required:!1},{id:"ea",label:"Glasses",headOnly:!0,required:!1},{id:"fa",label:"Face items",headOnly:!0,required:!1},{id:"ch",label:"Shirts",headOnly:!1,required:!0},{id:"cc",label:"Jackets",headOnly:!1,required:!1},{id:"cp",label:"Prints",headOnly:!1,required:!1},{id:"ca",label:"Chest items",headOnly:!1,required:!1},{id:"lg",label:"Trousers",headOnly:!1,required:!0},{id:"sh",label:"Shoes",headOnly:!1,required:!0},{id:"wa",label:"Belts",headOnly:!1,required:!1}],Hn={M:"hr-115-42.hd-190-1.ch-215-62.lg-285-91.sh-290-62",F:"hr-515-33.hd-600-1.ch-635-70.lg-716-66-62.sh-735-68"},Rw={hd:20,hr:40,ha:60,he:45,ea:45,fa:40,ch:50,cc:70,cp:40,ca:55,lg:45,sh:35,wa:50};function Pw(n){let e=0;for(let t=0;t<n.length;t++)e=e*31+n.charCodeAt(t)>>>0;return e}function ea(n,e){return`${n}_${e}`}let Ke=null;const Gh={};async function Nw(){if(await Mi,Ke)return;const n=Me.figuredata;Ke={};const e=new Set(Object.values(Hn).flatMap(t=>Object.entries(jn(t)).map(([s,i])=>ea(s,i.id))));for(const t of yt){const s=n.settype[t.id];if(!s){Ke[t.id]=[];continue}const i=[];for(const[o,l]of Object.entries(s.set)){if(!l.selectable||l.club>0)continue;const c=Math.max(0,...l.part.map(m=>m.colorindex||0)),d=ea(t.id,o),h=!!l.preselectable||e.has(d),u=h?0:Math.max(1,Math.round((Rw[t.id]+Pw(t.id+o)%6*10)/25));i.push({type:t.id,id:o,gender:l.gender,colors:c,price:u,key:d,basePrice:u,starter:h,shopOn:!h})}i.sort((o,l)=>o.price-l.price||Number(o.id)-Number(l.id)),Ke[t.id]=i;const r=n.palette[s.paletteid]??{};Gh[t.id]=Object.entries(r).filter(([,o])=>o.club===0&&o.selectable).sort((o,l)=>o[1].index-l[1].index).map(([o,l])=>({id:o,hex:l.color}))}}function Ow(n){if(Ke){for(const e of Object.keys(Ke))Ke[e]=Ke[e].filter(t=>!t.custom);for(const e of n)Ke[e.slot]&&Ke[e.slot].unshift({type:e.slot,id:e.id,gender:e.gender,colors:e.colors,price:0,key:ea(e.slot,e.id),basePrice:0,starter:!0,shopOn:!1,custom:!0})}}function qh(n){for(const e of Object.values(Ke??{}))for(const t of e){if(t.custom){const i=n[t.key];t.price=i?i.price:0,t.starter=t.price===0,t.shopOn=!!i&&i.on&&i.price>0;continue}if(t.starter)continue;const s=n[t.key];t.price=s?s.price:t.basePrice,t.shopOn=s?s.on:!0}}function Mw(){return Ke??{}}function Kh(n,e){return((Ke==null?void 0:Ke[n])??[]).filter(t=>t.gender==="U"||t.gender===e)}function ks(n){return Gh[n]??[]}function Yh(n,e){var t;return(t=Ke==null?void 0:Ke[n])==null?void 0:t.find(s=>s.id===e)}function ta(n,e){return n.price===0||!!e[n.key]}function jn(n){const e={};for(const t of n.split(".")){const[s,i,...r]=t.split("-");s&&i&&(e[s]={id:i,colors:r})}return e}function Bn(n){return yt.filter(e=>n[e.id]).map(e=>[e.id,n[e.id].id,...n[e.id].colors].join("-")).join(".")}function nd(n,e){var i;const t=ks(n.type),s=[];for(let r=0;r<n.colors;r++){const o=e==null?void 0:e.colors[r];s.push(o&&t.some(l=>l.id===o)?o:((i=t[Math.min(r*3,t.length-1)])==null?void 0:i.id)??"1")}return s}const Dw={hr:.95,ha:.2,ea:.2,fa:.15,he:0,cc:0,cp:0,ca:0,wa:0};function ko(n){const e=i=>i[Math.floor(Math.random()*i.length)],t={},s=jn(Hn[n]);for(const i of yt){const r=Kh(i.id,n).filter(c=>c.price===0);if(!i.required&&Math.random()>=(Dw[i.id]??0))continue;const o=r.length?e(r):void 0;if(!o){i.required&&s[i.id]&&(t[i.id]=s[i.id]);continue}const l=ks(i.id);t[i.id]={id:o.id,colors:Array.from({length:o.colors},()=>{var c;return((c=e(l))==null?void 0:c.id)??"1"})}}return Bn(t)}function Lw(n,e){const t=[];for(const[s,i]of Object.entries(n)){if(!i)continue;const r=Yh(s,i.id);r&&!ta(r,e)&&t.push(r)}return t}const Jt=n=>"./"+n.replace(/^\/+/,""),Bt={syringe:{id:"syringe",name:"Syringe",examine:"A clean syringe. Click it to draw blood from yourself: 2 drops of blood, once a day.",icon:Jt("items/syringe.svg"),useSelf:"syringe"},cd:{id:"cd",name:"CD",examine:"A scratched CD with a handwritten label. Use it on the CD player in the lobby so everyone can hear it. It comes back when it's done.",icon:Jt("items/cd.svg"),useOnObject:"cdplayer"},knife:{id:"knife",name:"Knife",examine:"A small, sharp knife. Use it on another player: you can stab each person once a day, and every stab draws a drop of blood.",icon:Jt("items/knife.svg"),useOnPlayer:"stab"}},pl=28,Qh=()=>Array.from({length:pl},()=>null);function $w(n){const e=Qh();if(!n||typeof n!="object")return e;for(const[t,s]of Object.entries(n)){const i=Number(t);s&&i>=0&&i<pl&&Bt[s.item]&&(e[i]={item:s.item,qty:s.qty??1,...s.inPlayer?{inPlayer:!0}:{}})}return e}const Ws=(n,e)=>n.findIndex(t=>(t==null?void 0:t.item)===e&&!t.inPlayer),Fw=(n,e)=>n.findIndex(t=>(t==null?void 0:t.item)===e),nn=Jt("items/blood.svg"),na=5,sa="access_music",Uw=4,Bw=8,ni=2,Jh=864e5,Xh=["knife","cd","syringe"];let Zh=0;Wh&&tt(G(q,".info/serverTimeOffset"),n=>{Zh=Number(n.val())||0});const Ct=()=>Date.now()+Zh,xn=()=>{const n=Ct();return n-n%Jh},ia=()=>xn()+Jh-Ct(),sd=(n,e)=>(n.stabs[e]??0)<xn(),Ww=n=>Object.values(n.stabs).filter(e=>e>=xn()).length,ef=n=>n.syringeDay<xn();async function tf(n,e){const t=Qh(),s={};Xh.forEach((r,o)=>{t[o]={item:r,qty:1},s[o]={item:r,qty:1}});const i={uid:n,name:e,gender:"M",figure:"",blood:na,owned:{},wardrobe:{},inventory:t,stabs:{},syringeDay:0,isAdmin:!1};return await rt(G(q,`users/${n}`),{name:e,gender:i.gender,figure:i.figure,blood:i.blood,inventory:s,createdAt:dt()}),i}async function Hw(n,e=!1){const t=await tn(G(q,`users/${n}`));if(!t.exists())return null;const s=t.val(),i={uid:n,name:s.name,gender:s.gender==="F"?"F":"M",figure:s.figure??"",blood:s.blood??0,owned:s.owned??{},wardrobe:s.wardrobe??{},inventory:$w(s.inventory),stabs:s.stabs??{},syringeDay:s.syringeDay??0,isAdmin:e},r={};s.blood===void 0&&(i.blood=na,r.blood=na),s.createdAt===void 0&&(r.createdAt=dt());for(const o of Xh){if(Fw(i.inventory,o)>=0)continue;const l=i.inventory.findIndex(c=>c===null);l<0||(i.inventory[l]={item:o,qty:1},r[`inventory/${l}`]={item:o,qty:1})}return Object.keys(r).length&&await Pe(G(q,`users/${n}`),r),i}async function Ar(n,e,t){await Pe(G(q,`users/${n.uid}`),{figure:e,gender:t}),await Pe(G(q,`profiles/${n.uid}`),{name:n.name,figure:e}).catch(()=>{}),n.figure=e,n.gender=t}async function ml(n,e,t){if(t>n.blood)throw new Error("Not enough drops of blood");const s={blood:n.blood-t};for(const i of e)s[`owned/${i}`]=!0;await Pe(G(q,`users/${n.uid}`),s),n.blood-=t;for(const i of e)n.owned[i]=!0}async function jw(n,e,t){if(t>n.blood)throw new Error("Not enough drops of blood");const s=n.inventory.findIndex(i=>i===null);if(s<0)throw new Error("Your inventory is full");await Pe(G(q,`users/${n.uid}`),{blood:n.blood-t,[`inventory/${s}`]:{item:e,qty:1}}),n.blood-=t,n.inventory[s]={item:e,qty:1}}async function Vw(n,e){const t=xn();await Pe(G(q,`users/${n.uid}`),{blood:n.blood+1,lastStabTarget:e,[`stabs/${e}`]:t}),n.blood+=1,n.stabs[e]=t}async function zw(n){const e=xn();await Pe(G(q,`users/${n.uid}`),{blood:n.blood+ni,syringeDay:e}),n.blood+=ni,n.syringeDay=e}async function Gw(n,e,t){await rt(G(q,`users/${n.uid}/wardrobe/${e}`),t),n.wardrobe[e]=t}async function qw(n,e){await rt(G(q,`users/${n.uid}/wardrobe/${e}`),null),delete n.wardrobe[e]}const Kw=["register","login","logout","buy","stab","syringe","cd","emote","friend","outfit","look","visit","room","design","admin"];function Te(n,e,t){Cn(G(q,"logs"),{uid:n.uid,name:n.name,type:e,detail:t.slice(0,160),ts:dt()}).catch(()=>{})}const Yw=/^[A-Za-z0-9_.-]{3,16}$/,gl=n=>`${n.toLowerCase()}@users.bobba.invalid`,nf="admin",Qw=gl(nf),Jw=n=>!!n&&n.email===Qw,Xw=new Set([nf,"administrator","moderator","staff","6ixplanet"]);function yl(n){const e=(n==null?void 0:n.code)??"";return{"auth/invalid-credential":"Wrong username or password.","auth/wrong-password":"Wrong username or password.","auth/user-not-found":"Wrong username or password.","auth/email-already-in-use":"That username is taken.","auth/weak-password":"Password must be at least 6 characters.","auth/invalid-email":"Usernames can only use letters, numbers, . _ -","auth/too-many-requests":"Too many attempts, try again in a moment.","auth/network-request-failed":"Can't reach Firebase. Check your connection / config."}[e]??(n==null?void 0:n.message)??"Something went wrong."}const ra={registering:!1};async function Zw(n,e){if(!Yw.test(n))throw new Error("Username must be 3-16 characters: letters, numbers, . _ -");if(Xw.has(n.toLowerCase()))throw new Error("That username is reserved.");ra.registering=!0;try{const t=await Dg(Os,gl(n),e);try{const s=await tf(t.user.uid,n);return Te(s,"register","created the account"),s}catch(s){throw await jg(t.user).catch(()=>{}),s}}finally{ra.registering=!1}}async function e0(n,e){await Lg(Os,gl(n.trim()),e)}async function t0(n,e){const t=Os.currentUser;if(!t||!t.email)throw new Error("You're not signed in.");if(e.length<6)throw new Error("Password must be at least 6 characters.");await Mg(t,Zn.credential(t.email,n)),await $g(t,e)}function oa(){return Hg(Os)}function a(n,e={},...t){const s=document.createElement(n);for(const[i,r]of Object.entries(e))r==null||r===!1||(i==="class"?s.className=String(r):i==="style"&&typeof r=="object"?Object.assign(s.style,r):i.startsWith("on")&&typeof r=="function"?s.addEventListener(i.slice(2).toLowerCase(),r):i in s?s[i]=r:s.setAttribute(i,String(r)));for(const i of t)i==null||i===!1||s.append(typeof i=="string"?document.createTextNode(i):i);return s}function Qr(n){const e=n.getContext("2d");if(!e)return n;const{width:t,height:s}=n,i=e.getImageData(0,0,t,s).data;let r=t,o=s,l=-1,c=-1;for(let h=0;h<s;h++)for(let u=0;u<t;u++)i[(h*t+u)*4+3]>8&&(u<r&&(r=u),u>l&&(l=u),h<o&&(o=h),h>c&&(c=h));if(l<0)return n;const d=document.createElement("canvas");return d.width=l-r+1,d.height=c-o+1,d.getContext("2d").drawImage(n,r,o,d.width,d.height,0,0,d.width,d.height),d}function le(n,e="ok"){const t=a("div",{class:`toast ${e}`},n);document.body.append(t),setTimeout(()=>t.classList.add("show"),10),setTimeout(()=>{t.classList.remove("show"),setTimeout(()=>t.remove(),300)},2800)}function sf(n=new Date){return`${n.getHours()%12||12}:${String(n.getMinutes()).padStart(2,"0")} ${n.getHours()<12?"AM":"PM"}`}let id=!1;function n0(){id||(id=!0,setInterval(()=>{document.querySelectorAll(".sb-time").forEach(n=>n.textContent=sf()),document.querySelectorAll(".lock-clock .t").forEach(n=>n.textContent=rf())},1e4))}function rf(n=new Date){return`${n.getHours()}:${String(n.getMinutes()).padStart(2,"0")}`}const rd=n=>{const e=document.createElement("span");return e.innerHTML=n,e.firstElementChild};function aa(){n0();const n=a("span",{class:"sb-bars"},...[3,4.5,6,7.5,9].map(s=>a("i",{style:{height:s+"px"}}))),e=rd('<svg width="13" height="10" viewBox="0 0 13 10"><path d="M6.5 2.2c1.9 0 3.6.7 4.9 1.9l1-1C10.8 1.6 8.8.8 6.5.8S2.2 1.6.6 3.1l1 1C2.9 2.9 4.6 2.2 6.5 2.2zm0 2.6c1.2 0 2.2.4 3 1.2l1-1C9.4 4 8 3.4 6.5 3.4S3.6 4 2.5 5l1 1c.8-.8 1.8-1.2 3-1.2zm0 2.6c-.5 0-.9.2-1.2.5L6.5 9.2l1.2-1.3c-.3-.3-.7-.5-1.2-.5z" fill="#fff"/></svg>'),t=rd('<svg width="23" height="11" viewBox="0 0 23 11"><rect x=".6" y=".6" width="19" height="9.8" rx="1.6" fill="none" stroke="#fff" stroke-width="1.2"/><rect x="2" y="2" width="16.2" height="7" rx=".6" fill="#fff"/><rect x="20.4" y="3.4" width="1.8" height="4.2" rx=".6" fill="#fff"/></svg>');return a("div",{class:"sb-status","aria-hidden":"true"},a("span",{},n,"6IX",e),a("span",{class:"sb-time"},sf()),a("span",{},"100% ",t))}const s0={cash:"sound_catalogue_cash",message:"sound_console_new_message",sent:"sound_console_message_sent",knock:"sound_guide_received_invitation",camera:"sound_camera_shutter",friend:"sound_respect_received"},of="6ix-sfx-muted";let Jr=!1;try{Jr=localStorage.getItem(of)==="1"}catch{}const od=new Map,Io=()=>Jr;function i0(n){Jr=n;try{localStorage.setItem(of,n?"1":"0")}catch{}}function ut(n,e=.5){if(!Jr)try{let t=od.get(n);t||(t=new Audio(Jt(`sfx/${s0[n]}.m4a`)),od.set(n,t));const s=t.paused?t:t.cloneNode();s.volume=e,s.currentTime=0,s.play().catch(()=>{})}catch{}}function r0(n){const e=[["room","Room"],["customize","Character"],["shop","Shop"],...n.isAdmin?[["admin","Admin"]]:[]],t=new Map,s=a("nav",{class:"nav-tabs","aria-label":"Sections"},...e.map(([f,y])=>{const w=a("button",{class:"nav-tab",onclick:()=>n.onNav(f)},y);return t.set(f,w),w})),i=a("span",{class:"badge hidden","data-friends-badge":"1"}),r=a("button",{class:"barbtn nav-friends",title:"Friends",onclick:()=>window.dispatchEvent(new CustomEvent("toggle-friends"))},"👥",i),o=a("span",{class:"coins",title:"Drops of blood"}),l=a("span",{class:"barbtn blood-pill"},o);let c=null;const d=()=>{c==null||c.remove(),c=null},h=a("button",{class:"barbtn nav-menu",title:"Menu","aria-label":"Menu",onclick:f=>{if(f.stopPropagation(),c)return d();c=a("div",{class:"nav-pop",role:"menu"},a("button",{class:"nav-pop-item",onclick:()=>{d(),n.onOutfits()}},"👕 Saved outfits"),a("button",{class:"nav-pop-item",onclick:w=>{i0(!Io()),w.currentTarget.textContent=Io()?"🔇 Sounds: off":"🔊 Sounds: on"}},Io()?"🔇 Sounds: off":"🔊 Sounds: on"),a("button",{class:"nav-pop-item danger",onclick:()=>{d(),n.onLogout()}},"Log out")),u.append(c);const y=w=>{c&&w.target instanceof Node&&(c.contains(w.target)||h.contains(w.target))||(d(),window.removeEventListener("pointerdown",y))};setTimeout(()=>window.addEventListener("pointerdown",y),0)}},"⚙"),u=a("div",{class:"nav-right"},l,h);return{el:a("header",{class:"navbar"},a("div",{class:"nav-left"},r,a("div",{class:"nav-logo"},a("img",{src:nn,alt:"",class:"blood-ico"}),n.appName)),s,u),setActive(f){t.forEach((y,w)=>y.classList.toggle("on",w===f)),d()},refreshBlood(f){o.replaceChildren(a("img",{src:nn,class:"blood-ico",alt:"drops of blood"}),` ${f}`)},setBadge(f){i.textContent=String(f),i.classList.toggle("hidden",f===0)}}}const So=18;function af(n,e,t){const s=e.profile;let i=s.gender,r=jn(s.figure||Hn[i]),o=t==="shop"?"ch":"hr",l=0,c=2,d=!1,h=0,u=0,m=!1;f();function f(){const K=jn(Hn[i]);for(const Q of yt)Q.required&&!r[Q.id]&&(r[Q.id]=K[Q.id])}const y=a("canvas",{class:"preview-canvas",width:64,height:110}),w=a("div",{class:"preview-name"},s.name),E=a("div",{class:"tabs"}),x=a("div",{class:"colors"}),_=a("div",{class:"grid"}),U=a("div",{class:"pager"}),M=a("div",{class:"editor-footer"}),A=a("div",{class:"gender"}),W=a("button",{class:"btn small",onclick:()=>{d=!d,h=0,W.classList.toggle("on",d),S()}},"Wave"),k=K=>{c=(c+K+8)%8,S()};n.append(a("div",{class:"editor"},a("div",{class:"editor-left panel"},a("h2",{},t==="shop"?"Clothing shop":"Your character"),a("div",{class:"preview-box"},y,w),a("div",{class:"row center"},a("button",{class:"btn small",onclick:()=>k(-1)},"⟲"),W,a("button",{class:"btn small",onclick:()=>k(1)},"⟳")),A,M),a("div",{class:"editor-right panel"},E,x,_,U)));function S(){const K=++u;At({figure:Bn(r),dir:c,headDir:c,actions:d?["wav"]:["std"],frame:h}).then(Q=>{if(m||K!==u||!Q)return;const ve=y.getContext("2d");ve.clearRect(0,0,y.width,y.height),ve.drawImage(Q,0,0)})}const P=window.setInterval(()=>{d&&(h=(h+1)%2,S())},350);function L(){E.replaceChildren(...yt.map(K=>a("button",{class:"tab"+(K.id===o?" on":""),onclick:()=>{o=K.id,l=0,Y()}},K.label)))}function X(){x.replaceChildren();const K=r[o],Q=K&&Yh(o,K.id);if(!K||!Q||Q.colors===0)return;const ve=ks(o);for(let j=0;j<Q.colors;j++)x.append(a("div",{class:"swatch-row"},Q.colors>1?a("span",{class:"swatch-label"},`Color ${j+1}`):null,...ve.map(ie=>a("button",{class:"swatch"+(K.colors[j]===ie.id?" on":""),style:{background:"#"+ie.hex},title:"#"+ie.hex,onclick:()=>{K.colors[j]=ie.id,S(),X(),B()}}))))}function O(){const K=Kh(o,i);return t==="shop"?K.filter(Q=>!ta(Q,s.owned)&&Q.shopOn):K.filter(Q=>ta(Q,s.owned))}function B(){const K=yt.find(fe=>fe.id===o),Q=O(),ve=Math.max(1,Math.ceil(Q.length/So));l>=ve&&(l=ve-1);const j=Q.slice(l*So,(l+1)*So),ie=r[o];_.replaceChildren(),t==="customize"&&!K.required&&_.append(a("button",{class:"cell none"+(ie?"":" on"),onclick:()=>{delete r[o],S(),Y()}},"None"));for(const fe of j){const v=a("div",{class:"thumb"}),ee=a("button",{class:"cell"+((ie==null?void 0:ie.id)===fe.id?" on":""),title:`${K.label} #${fe.id}`,onclick:()=>{r[o]={id:fe.id,colors:nd(fe,ie)},S(),Y()}},v,t==="shop"?a("span",{class:"price"},`🩸 ${fe.price}`):null);_.append(ee);const Be={...r,[o]:{id:fe.id,colors:nd(fe,ie)}};At({figure:Bn(Be),dir:2,headDir:2,headOnly:K.headOnly}).then(ne=>{if(m||!ne||!v.isConnected)return;const ae=Qr(ne);ae.className="thumb-canvas",v.replaceChildren(ae)})}Q.length===0&&_.append(a("p",{class:"muted"},t==="shop"?"You own everything in this category 🎉":"Nothing here yet — visit the shop!")),U.replaceChildren(ve>1?a("div",{class:"row center"},a("button",{class:"btn small",disabled:l===0,onclick:()=>{l--,B()}},"‹"),a("span",{class:"muted"},`${l+1} / ${ve}`),a("button",{class:"btn small",disabled:l>=ve-1,onclick:()=>{l++,B()}},"›")):"")}function F(){A.replaceChildren(),t==="customize"&&A.append(a("div",{class:"row center"},...["M","F"].map(K=>a("button",{class:"btn small"+(i===K?" on":""),onclick:()=>{i!==K&&(i=K,r=jn(Hn[K]),l=0,S(),Y())}},K==="M"?"Boy":"Girl"))))}function V(){if(M.replaceChildren(),t==="customize"){M.append(a("button",{class:"btn primary",onclick:async()=>{try{await Ar(s,Bn(r),i),e.refreshHeader(),e.lookChanged(),Te(s,"look","changed their look"),ut("camera",.35),le("Look saved!")}catch(j){le(j.message,"err")}}},"Save look"));return}const K=Lw(r,s.owned),Q=K.reduce((j,ie)=>j+ie.price,0),ve=Q<=s.blood;M.append(a("div",{class:"basket"},K.length===0?a("p",{class:"muted"},"Try items on, then buy the ones you like."):a("ul",{},...K.map(j=>a("li",{},`${yt.find(ie=>ie.id===j.type).label} #${j.id} — 🩸 ${j.price}`)))),a("button",{class:"btn primary",disabled:K.length===0||!ve,onclick:async()=>{try{await ml(s,K.map(j=>j.key),Q),await Ar(s,Bn(r),i),Te(s,"buy",`bought ${K.map(j=>j.key).join(", ")} for ${Q}`),e.refreshHeader(),e.lookChanged(),ut("cash",.45),le(`Bought ${K.length} item${K.length>1?"s":""} and put them on!`),Y()}catch(j){le(j.message,"err")}}},K.length===0?"Buy & wear":ve?`Buy & wear — 🩸 ${Q}`:`Need 🩸 ${Q-s.blood} more`))}function Y(){L(),X(),B(),F(),V()}return Y(),S(),()=>{m=!0,window.clearInterval(P)}}const lf={standin:{id:"standin",title:"Stand-in track",artist:"swap me in src/cdplayer.ts",url:Jt("music/cd-standin.mp3")}},o0="standin",_l=G(q,"rooms/lobby/cdplayer");function a0(n,e){return tt(_l,t=>n(t.exists()?t.val():null),e)}const as=n=>Ct()>=n.endsAt;function l0(n){return new Promise(e=>{const t=new Audio,s=i=>{t.removeAttribute("src"),t.load(),e(i)};t.preload="metadata",t.addEventListener("loadedmetadata",()=>s(Number.isFinite(t.duration)?Math.round(t.duration*1e3):6e4),{once:!0}),t.addEventListener("error",()=>s(6e4),{once:!0}),setTimeout(()=>s(6e4),6e3),t.src=n.url})}async function c0(n,e,t=o0){const s=lf[t],i=await l0(s),r={by:n.uid,byName:n.name,track:s.id,title:s.title,startedAt:dt(),endsAt:Math.round(Ct()+i)};await rt(_l,r);const o=n.inventory[e];return o&&(await Pe(G(q,`users/${n.uid}/inventory/${e}`),{inPlayer:!0}),o.inPlayer=!0),{...r,startedAt:Ct()}}const ad=()=>$t(_l);async function d0(n){const e=n.inventory.findIndex(t=>(t==null?void 0:t.item)==="cd"&&t.inPlayer);return e<0?!1:(await Pe(G(q,`users/${n.uid}/inventory/${e}`),{inPlayer:null}),delete n.inventory[e].inPlayer,!0)}async function u0(n,e){return!n.inventory.some(s=>(s==null?void 0:s.item)==="cd"&&s.inPlayer)||e&&e.by===n.uid&&!as(e)?!1:d0(n).catch(()=>!1)}const la="bobba.cdVolume";function h0(){try{const n=Number(localStorage.getItem(la));return Number.isFinite(n)&&localStorage.getItem(la)!==null?Math.max(0,Math.min(1,n)):.5}catch{return .5}}class f0{constructor(e){this.onChange=e,this.audio=new Audio,this.volume=h0(),this.muted=!1,this.blocked=!1,this.key=null,this.state=null,this.audio.preload="auto",this.apply()}apply(){this.audio.volume=this.muted?0:this.volume}setVolume(e){this.volume=Math.max(0,Math.min(1,Math.round(e*100)/100)),this.volume>0&&(this.muted=!1),this.apply();try{localStorage.setItem(la,String(this.volume))}catch{}this.onChange()}toggleMute(){this.muted=!this.muted,this.apply(),this.onChange()}get playing(){return!!this.state&&!this.audio.paused&&!this.audio.ended}get position(){return this.state?Math.max(0,(Ct()-this.state.startedAt)/1e3):0}sync(e){if(this.state=e&&!as(e)?e:null,!this.state){this.stop();return}const t=lf[this.state.track];if(!t)return this.stop();const s=`${this.state.by}:${this.state.startedAt}`;s!==this.key&&(this.key=s,this.audio.src=t.url,this.audio.addEventListener("loadedmetadata",()=>this.seekAndPlay(),{once:!0}),this.audio.load()),this.onChange()}seekAndPlay(){if(!this.state)return;const e=this.audio.duration,t=this.position;if(!(Number.isFinite(e)&&t>=e)){try{this.audio.currentTime=t}catch{}this.tryPlay()}}tryPlay(){this.audio.play().then(()=>{this.blocked=!1,this.onChange()},()=>{this.blocked=!0,this.onChange()})}stop(){this.state=null,this.key=null,this.audio.pause(),this.audio.removeAttribute("src"),this.audio.load(),this.onChange()}}const gn=[{id:"sample",title:"Hotel jingle (placeholder)",artist:"swap me in src/music.ts",url:Jt("music/sample.mp3")}];class p0{constructor(){this.audio=new Audio,this.current=null,this.listeners=new Set,this.audio.preload="none",this.audio.volume=.6;for(const e of["play","pause","timeupdate","loadedmetadata","ended","error","volumechange"])this.audio.addEventListener(e,()=>{e==="ended"&&this.next(),this.emit()})}subscribe(e){return this.listeners.add(e),()=>this.listeners.delete(e)}emit(){this.listeners.forEach(e=>e())}get playing(){return!this.audio.paused}get failed(){return!!this.audio.error}play(e){var t;((t=this.current)==null?void 0:t.id)!==e.id&&(this.current=e,this.audio.src=e.url),this.audio.play().catch(()=>this.emit()),this.emit()}toggle(){if(!this.current)return this.play(gn[0]);this.audio.paused?this.audio.play().catch(()=>this.emit()):this.audio.pause()}next(){if(!this.current)return;const e=gn.findIndex(t=>t.id===this.current.id);this.play(gn[(e+1)%gn.length])}seek(e){Number.isFinite(this.audio.duration)&&(this.audio.currentTime=e*this.audio.duration)}setVolume(e){this.audio.volume=Math.max(0,Math.min(1,e))}stop(){this.audio.pause(),this.audio.removeAttribute("src"),this.audio.load(),this.current=null,this.emit()}}const Xe=new p0;function Rr(n){if(!Number.isFinite(n))return"0:00";const e=Math.floor(n);return`${Math.floor(e/60)}:${String(e%60).padStart(2,"0")}`}const Is=[{id:"wave",name:"Wave",icon:"👋",desc:"Say hi.",price:0,actions:["wav"],ms:2200},{id:"smile",name:"Smile",icon:"🙂",desc:"A friendly grin.",price:0,gesture:"sml",ms:3500},{id:"sad",name:"Sad",icon:"😢",desc:"Bit of a downer.",price:0,gesture:"sad",fx:["💧"],ms:3500},{id:"jump",name:"Jump",icon:"🦘",desc:"Hop on the spot.",price:0,motion:"hop",ms:1300},{id:"angry",name:"Angry",icon:"😠",desc:"Steam comes out of your ears.",price:1,gesture:"agr",fx:["💢"],ms:3500},{id:"surprised",name:"Surprised",icon:"😮",desc:"Didn't see that coming.",price:1,motion:"hop",fx:["❗","❓"],ms:1800},{id:"sleep",name:"Sleep",icon:"😴",desc:"Eyes shut, zzz.",price:1,gesture:"eyb",fx:["💤"],ms:5e3},{id:"laugh",name:"Laugh",icon:"😂",desc:"Crack up.",price:2,gesture:"sml",motion:"bounce",fx:["😂"],ms:3500},{id:"love",name:"Love",icon:"😍",desc:"Hearts everywhere.",price:2,gesture:"sml",fx:["❤️","💕"],ms:4e3},{id:"cheer",name:"Cheer",icon:"🎉",desc:"Hands up, confetti.",price:2,actions:["wav"],motion:"hop",fx:["🎉","✨"],ms:3e3},{id:"spin",name:"Spin",icon:"🌀",desc:"Round and round.",price:2,motion:"spin",ms:2200},{id:"dance",name:"Dance",icon:"🕺",desc:"Bust a move.",price:3,motion:"dance",fx:["🎵","🎶"],ms:6e3}],zs=Object.fromEntries(Is.map(n=>[n.id,n])),cf=n=>`emote_${n}`;let vl={};function m0(n){vl=n}function hs(n){var e;return n.price===0?0:((e=vl[n.id])==null?void 0:e.price)??n.price}function g0(n){var e;return n.price!==0&&hs(n)>0&&(((e=vl[n.id])==null?void 0:e.on)??!0)}function _i(n,e){const t=zs[e];return!!t&&(hs(t)===0||!!n.owned[cf(e)])}const ld=[2,3,4,5,6,7,0,1],df=n=>n==="open"?"open":n==="closed"||n==="invite"?"closed":"knock",Ue={crate:{id:"crate",label:"Crate",icon:"📦",w:1,h:1,height:26,color:"#9c6b3a",placeable:!0},table:{id:"table",label:"Table",icon:"🪵",w:2,h:2,height:22,color:"#7b5a36",placeable:!0},sofa:{id:"sofa",label:"Sofa",icon:"🛋️",w:2,h:1,height:26,color:"#8a3e3e",placeable:!0},plant:{id:"plant",label:"Plant",icon:"🪴",w:1,h:1,height:44,color:"#3d7a45",placeable:!0},lamp:{id:"lamp",label:"Lamp",icon:"💡",w:1,h:1,height:62,color:"#c9b25a",placeable:!0},shelf:{id:"shelf",label:"Shelf",icon:"📚",w:1,h:1,height:74,color:"#6a4a2c",placeable:!0},arcade:{id:"arcade",label:"Arcade machine",icon:"🕹️",w:1,h:1,height:78,color:"#26327a",placeable:!1},cdplayer:{id:"cdplayer",label:"CD player",icon:"💿",w:1,h:1,height:38,color:"#2d3140",placeable:!1}},y0=new Set(["arcade","cdplayer"]),bl=1,_0=(n,e,t=bl)=>n===t&&e<=1,uf={floorA:"#a99a6a",floorB:"#b5a678",wall:"#b9c9cf",rug:!0,rugColor:"#c9544f"},v0=[{name:"Sand",a:"#a99a6a",b:"#b5a678"},{name:"Oak",a:"#a2713f",b:"#b0814d"},{name:"Slate",a:"#5d6b78",b:"#6a7886"},{name:"Checker",a:"#2b2b2b",b:"#d8d8d8"},{name:"Moss",a:"#5f7d4a",b:"#6c8b56"},{name:"Rose",a:"#b86a7c",b:"#c47b8c"},{name:"Ocean",a:"#3f7fa6",b:"#4a8db5"},{name:"Cream",a:"#d9ccaa",b:"#e3d8ba"}],b0=["#b9c9cf","#e8d8b0","#c9a6b8","#9fc1a0","#8aa6d6","#d9a38a","#7c7f8c","#f0f0f0"],w0=["#c9544f","#4f7bc9","#4fa86a","#c9a24f","#8a4fc9","#333333"],C0=[{id:"fuzzy",name:"Fuzzy"},{id:"tiles2",name:"Tiles"},{id:"tiles3",name:"Planks"},{id:"tiles5",name:"Slabs"}],E0=[{id:"brick_red",name:"Red brick"},{id:"brick_white",name:"White brick"},{id:"brick_teal",name:"Teal tiles"},{id:"chocolate",name:"Chocolate"},{id:"wood",name:"Wood"},{id:"plaid_pink",name:"Pink plaid"},{id:"plaid_brown",name:"Brown plaid"},{id:"plaid_green",name:"Green plaid"},{id:"stripes_bright",name:"Bright stripes"},{id:"stripes_blue",name:"Blue stripes"},{id:"stripes_orange",name:"Orange stripes"},{id:"zigzag_pink",name:"Pink zigzag"},{id:"zigzag_yellow",name:"Yellow zigzag"},{id:"zigzag_blue",name:"Blue zigzag"},{id:"rings_purple",name:"Purple rings"},{id:"rings_green",name:"Green rings"},{id:"rings_yellow",name:"Yellow rings"},{id:"rings_blue",name:"Blue rings"},{id:"rings_brown",name:"Brown rings"},{id:"hearts",name:"Hearts"},{id:"clouds",name:"Clouds"},{id:"groovy_green",name:"Groovy green"},{id:"groovy_blue",name:"Groovy blue"}],k0=[{label:"Small 8×8",w:8,h:8},{label:"Medium 10×10",w:10,h:10},{label:"Large 12×12",w:12,h:12},{label:"Wide 14×9",w:14,h:9},{label:"Deep 9×14",w:9,h:14}],ca=40,pt="lobby",ht=n=>`u_${n}`;function cd(){const n=[["sofa",9,1],["plant",1,9],["table",5,5],["arcade",3,0],["arcade",5,0],["cdplayer",7,0]];return{id:pt,name:"Main Lobby",ownerUid:null,ownerName:null,access:"open",w:12,h:12,theme:{...uf},rug:{x0:3,y0:3,w:6,h:6},furni:n.map(([e,t,s],i)=>({id:`lobby${i}`,kind:e,x:t,y:s})),doorX:bl}}const I0=[{id:"studio",name:"Cozy Studio",blurb:"Small and warm. Sand floor, a sofa and a reading corner.",w:8,h:8,theme:{floorA:"#a99a6a",floorB:"#b5a678",wall:"#b9c9cf",rug:!0,rugColor:"#c9544f"},furni:[["sofa",3,1],["shelf",5,0],["lamp",7,0],["plant",7,3],["crate",6,6],["plant",0,6]]},{id:"loft",name:"Wood Loft",blurb:"Roomy oak loft with a big table and shelves along the wall.",w:10,h:10,theme:{floorA:"#a2713f",floorB:"#b0814d",wall:"#e8d8b0",rug:!0,rugColor:"#4f7bc9"},furni:[["table",5,5],["sofa",2,8],["shelf",4,0],["shelf",6,0],["plant",9,0],["plant",0,9],["lamp",8,8],["crate",8,2]]},{id:"lounge",name:"Beach Lounge",blurb:"A wide ocean-blue lounge with palms and plenty of floor to dance on.",w:14,h:9,theme:{floorA:"#3f7fa6",floorB:"#4a8db5",wall:"#d9a38a",rug:!0,rugColor:"#c9a24f"},furni:[["sofa",4,1],["sofa",9,1],["plant",13,0],["plant",0,8],["table",6,5],["crate",11,6],["lamp",13,8],["plant",13,3]]}];function da(n,e){const t={...uf,...e.theme??{}},s=Object.entries(e.furni??{}).filter(([,r])=>Ue[r.kind]).map(([r,o])=>({id:r,kind:o.kind,x:o.x,y:o.y})),i=t.rug?{x0:Math.max(0,Math.floor((e.w-4)/2)),y0:Math.max(0,Math.floor((e.h-4)/2)),w:4,h:4}:null;return{id:n,name:e.name,ownerUid:e.owner,ownerName:e.ownerName,access:df(e.access),w:e.w,h:e.h,theme:t,rug:i,furni:s,doorX:bl}}function S0(n,e){const t={owner:e.uid,ownerName:e.name,name:`${e.name}'s room`.slice(0,28),access:"knock",w:n.w,h:n.h,theme:{...n.theme}},s=da(ht(e.uid),t);return s.furni=n.furni.map(([i,r,o],l)=>({id:`t${l}`,kind:i,x:r,y:o})),s}const Xr=n=>G(q,`roomsMeta/${n}`);async function hf(n){const e=await tn(Xr(n));return e.exists()?e.val():null}function T0(n,e,t){return tt(Xr(n),s=>e(s.exists()?s.val():null),t)}function x0(n){return tt(G(q,"roomsMeta"),e=>n(e.val()??{}))}async function A0(n,e){const t=ht(n.uid),s={};for(const[r,o,l]of e.furni)s[Cn(G(q,`roomsMeta/${t}/furni`)).key]={kind:r,x:o,y:l};const i={owner:n.uid,ownerName:n.name,name:`${n.name}'s room`.slice(0,28),access:"knock",w:e.w,h:e.h,theme:{...e.theme},furni:s};return await rt(Xr(t),i),t}const Nt=(n,e)=>Pe(Xr(n),e);async function R0(n,e,t,s){const i=Cn(G(q,`roomsMeta/${n}/furni`));await rt(i,{kind:e,x:t,y:s})}const ua=(n,e)=>$t(G(q,`roomsMeta/${n}/furni/${e}`));async function P0(n,e,t){return n.owner===e||n.access==="open"||t.has(n.owner)?!0:(await tn(G(q,`roomInvites/u_${n.owner}/${e}`))).exists()}const mt=64,ct=32,Dn=120,cn=86,bt=(n,e)=>({x:(n-e)*(mt/2),y:(n+e)*(ct/2)});function vt(n,e){const t=parseInt(n.slice(1),16),s=i=>Math.max(0,Math.min(255,Math.round(i*e)));return`rgb(${s(t>>16)},${s(t>>8&255)},${s(t&255)})`}const tr=new Map;function dd(n,e){const t=`${n}_${e}`;return tr.has(t)?Promise.resolve():new Promise(s=>{const i=new Image;i.onload=()=>{tr.set(t,i),s()},i.onerror=()=>{tr.set(t,null),s()},i.src=Jt(`textures/${t}.png`)})}function ff(n){return Promise.all([n.floorTex?dd("floor",n.floorTex):null,n.wallTex?dd("wall",n.wallTex):null]).then(()=>{})}const ud=(n,e)=>e?tr.get(`${n}_${e}`)??null:null;function ha(n){const e=n.w,t=n.h,s=n.theme,i=-t*(mt/2)-8,r=e*(mt/2)+8,o=-Dn-8,l=(e+t)*(ct/2)+20,c=document.createElement("canvas");c.width=r-i,c.height=l-o;const d=c.getContext("2d");d.translate(-i,-o);const h=k=>{d.beginPath(),k.forEach((S,P)=>P?d.lineTo(S.x,S.y):d.moveTo(S.x,S.y)),d.closePath()},u=(k,S,P)=>{h(k),d.fillStyle=S,d.fill(),P&&(d.strokeStyle=P,d.lineWidth=1,d.stroke())},m=k=>{const S=d.createPattern(k,"repeat");return S==null||S.setTransform(new DOMMatrix([2,0,0,2,0,0])),S},f=bt(0,0),y=bt(0,t),w=bt(e,0),E=ud("wall",s.wallTex),x=E?m(E):null,_=[f,w,{x:w.x,y:w.y-Dn},{x:f.x,y:f.y-Dn}],U=[f,y,{x:y.x,y:y.y-Dn},{x:f.x,y:f.y-Dn}];if(u(_,vt(s.wall,1),vt(s.wall,.8)),u(U,vt(s.wall,.88),vt(s.wall,.8)),x){for(const k of[1,-1])d.save(),h(k===1?_:U),d.clip(),d.transform(k,.5,0,1,f.x,f.y-Dn),d.fillStyle=x,d.fillRect(0,0,(k===1?e:t)*(mt/2),Dn),d.restore();u(U,"rgba(0,0,0,0.14)")}u([f,w,{x:w.x,y:w.y-10},{x:f.x,y:f.y-10}],vt(s.wall,.72)),u([f,y,{x:y.x,y:y.y-10},{x:f.x,y:f.y-10}],vt(s.wall,.64));const M=bt(e,t);u([y,M,{x:M.x,y:M.y+8},{x:y.x,y:y.y+8}],vt(s.floorA,.6)),u([w,M,{x:M.x,y:M.y+8},{x:w.x,y:w.y+8}],vt(s.floorA,.45));const A=ud("floor",s.floorTex),W=A?m(A):null;for(let k=0;k<t;k++)for(let S=0;S<e;S++){const P=bt(S,k),L=n.rug,X=!!L&&S>=L.x0&&S<L.x0+L.w&&k>=L.y0&&k<L.y0+L.h,O=X&&!!L&&(S===L.x0||S===L.x0+L.w-1||k===L.y0||k===L.y0+L.h-1),B=X?vt(s.rugColor,O?.88:1):(S+k)%2?s.floorA:s.floorB,F=[{x:P.x,y:P.y},{x:P.x+mt/2,y:P.y+ct/2},{x:P.x,y:P.y+ct},{x:P.x-mt/2,y:P.y+ct/2}];u(F,B,"rgba(0,0,0,0.12)"),W&&!X&&(d.save(),h(F),d.clip(),d.globalCompositeOperation="multiply",d.translate(P.x-mt/2,P.y),d.fillStyle=W,d.fillRect(0,0,mt,ct),d.restore())}return{canvas:c,origin:{x:-i,y:-o}}}function pf(n,e,t,s,i,r){const o=Ue[e],l=(y,w,E)=>{const x=i(bt(y,w));return{x:x.x,y:x.y-E*r}},c=l(t,s,o.height),d=l(t+o.w,s,o.height),h=l(t+o.w,s+o.h,o.height),u=l(t,s+o.h,o.height),m=y=>({x:y.x,y:y.y+o.height*r}),f=(y,w)=>{n.beginPath(),y.forEach((E,x)=>x?n.lineTo(E.x,E.y):n.moveTo(E.x,E.y)),n.closePath(),n.fillStyle=w,n.fill()};return f([u,h,m(h),m(u)],vt(o.color,.7)),f([d,h,m(h),m(d)],vt(o.color,.55)),f([c,d,h,u],vt(o.color,1.05)),{A:c,B:d,C:h,D:u,gd:m,fill:f}}function mf(n,e,t,s,i,r){const o=t(bt(e,0)),l=t(bt(e+1,0)),c=(w,E)=>({x:o.x+(l.x-o.x)*w,y:o.y+(l.y-o.y)*w-E*s}),d=(w,E,x,_)=>[c(w,E),c(x,E),c(x,_),c(w,_)],h=(w,E)=>{n.beginPath(),w.forEach((x,_)=>_?n.lineTo(x.x,x.y):n.moveTo(x.x,x.y)),n.closePath(),n.fillStyle=E,n.fill()};h(d(-.07,0,1.07,cn+7),"#2e1b10");const u=n.createLinearGradient(o.x,0,l.x,0);u.addColorStop(0,"#8d5c35"),u.addColorStop(1,"#6a4125"),h(d(.03,0,.97,cn),u),h(d(.14,8,.86,38),"rgba(0,0,0,0.18)"),h(d(.14,46,.86,76),"rgba(0,0,0,0.18)"),h(d(.17,11,.83,35),"rgba(255,255,255,0.07)"),h(d(.17,49,.83,73),"rgba(255,255,255,0.07)");const m=c(.82,42);n.fillStyle="#e6c14d",n.beginPath(),n.arc(m.x,m.y,3*s,0,Math.PI*2),n.fill(),n.fillStyle="rgba(255,255,255,0.7)",n.beginPath(),n.arc(m.x-s,m.y-s,1*s,0,Math.PI*2),n.fill(),r>0&&h(d(.03,0,.97,cn),`rgba(255,236,150,${(.28*r).toFixed(2)})`),h(d(-.12,cn+11,1.12,cn+27),"#16255c");const f=c(.5,cn+19);n.save(),n.font=`bold ${Math.round(9*Math.max(1,s))}px Verdana, sans-serif`,n.textAlign="center",n.textBaseline="middle",n.fillStyle=r>0?"#fff6b0":"#d6e0ff",n.fillText(i,f.x,f.y),n.restore();const y=[c(-.12,0),c(1.12,0),c(1.12,cn+27),c(-.12,cn+27)];return{x0:Math.min(...y.map(w=>w.x)),x1:Math.max(...y.map(w=>w.x)),y0:Math.min(...y.map(w=>w.y)),y1:Math.max(...y.map(w=>w.y))}}function N0(n,e){const t=ha(n),s=e/t.canvas.width,i=document.createElement("canvas"),r=window.devicePixelRatio||1;i.width=Math.round(e*r),i.height=Math.round(t.canvas.height*s*r),i.style.width=`${e}px`,i.style.height=`${Math.round(t.canvas.height*s)}px`;const o=i.getContext("2d");o.scale(r,r),o.imageSmoothingQuality="high",o.drawImage(t.canvas,0,0,e,t.canvas.height*s);const l=c=>({x:(t.origin.x+c.x)*s,y:(t.origin.y+c.y)*s});return mf(o,n.doorX,l,s,"EXIT",0),[...n.furni].sort((c,d)=>c.x+Ue[c.kind].w+c.y+Ue[c.kind].h-(d.x+Ue[d.kind].w+d.y+Ue[d.kind].h)).forEach(c=>pf(o,c.kind,c.x,c.y,l,s)),i}const fa=new Map;async function pa(n){const e=fa.get(n);if(e)return e;const t=await tn(G(q,`profiles/${n}`));if(!t.exists())return null;const s={uid:n,name:t.val().name,figure:t.val().figure};return fa.set(n,s),s}async function O0(n){fa.delete(n.uid),await rt(G(q,`profiles/${n.uid}`),{name:n.name,figure:n.figure});const e=G(q,`usernames/${n.name.toLowerCase()}`);(await tn(e)).exists()||await rt(e,n.uid).catch(()=>{})}function M0(n,e=""){const t=G(q,`presence/${n.uid}`);mn(t).remove(),rt(t,{name:n.name,room:e,since:dt()})}function hd(n,e){Pe(G(q,`presence/${n.uid}`),{room:e}).catch(()=>{})}function D0(n){const e=G(q,`presence/${n.uid}`);mn(e).cancel(),$t(e).catch(()=>{})}class L0{constructor(){this.me=null,this.friends=new Map,this.requests=new Map,this.presence=new Map,this.invites=[],this.knocks=new Map,this.dms=new Map,this.unread=new Map,this.openChat=new Set,this.listeners=new Set,this.knockListeners=new Set,this.inviteListeners=new Set,this.dmListeners=new Set,this.unsubs=[],this.dmUnsubs=new Map,this.sessionStart=0,this.isOnline=e=>this.presence.has(e),this.friendUids=()=>new Set(this.friends.keys()),this.roomOf=e=>{var t;return((t=this.presence.get(e))==null?void 0:t.room)??""}}subscribe(e){return this.listeners.add(e),()=>this.listeners.delete(e)}onInvite(e){return this.inviteListeners.add(e),()=>this.inviteListeners.delete(e)}onKnock(e){return this.knockListeners.add(e),()=>this.knockListeners.delete(e)}onDm(e){return this.dmListeners.add(e),()=>this.dmListeners.delete(e)}emit(){this.listeners.forEach(e=>e())}get totalUnread(){let e=0;return this.unread.forEach(t=>e+=t),e}get badgeCount(){return this.totalUnread+this.requests.size+this.knocks.size}start(e){this.stop(),this.me=e,this.sessionStart=Ct(),this.unsubs.push(tt(G(q,`friends/${e.uid}`),async t=>{const s=Object.keys(t.val()??{}),i=new Map;await Promise.all(s.map(async r=>{const o=await pa(r);o&&i.set(r,o)})),this.friends=i;for(const r of i.keys())this.dmUnsubs.has(r)||this.watchDm(r);for(const[r,o]of this.dmUnsubs)i.has(r)||(o(),this.dmUnsubs.delete(r),this.dms.delete(r),this.unread.delete(r));this.emit()}),tt(G(q,`friendRequests/${e.uid}`),async t=>{const s=Object.keys(t.val()??{}),i=new Map;await Promise.all(s.map(async r=>{const o=await pa(r);o&&i.set(r,o)})),this.requests=i,this.emit()}),tt(G(q,"presence"),t=>{const s=new Map;for(const[i,r]of Object.entries(t.val()??{}))s.set(i,{name:r.name,room:r.room??""});this.presence=s,this.emit()}),tt(G(q,`knocks/${e.uid}`),t=>{const s=new Map;for(const[r,o]of Object.entries(t.val()??{}))s.set(r,{uid:r,name:o.name??"?",ts:typeof o.ts=="number"?o.ts:Ct()});const i=[...s.values()].filter(r=>!this.knocks.has(r.uid));this.knocks=s,this.emit(),i.forEach(r=>this.knockListeners.forEach(o=>o(r)))},()=>{}),ti(G(q,`invites/${e.uid}`),t=>{const s=t.val();if(!s)return;const i={id:t.key,room:s.room,roomName:s.roomName,from:s.from,fromName:s.fromName,ts:s.ts};this.invites.push(i),this.emit(),typeof i.ts=="number"&&i.ts>=this.sessionStart-2e3&&this.inviteListeners.forEach(r=>r(i))}))}stop(){this.unsubs.forEach(e=>e()),this.unsubs=[],this.dmUnsubs.forEach(e=>e()),this.dmUnsubs.clear(),this.friends.clear(),this.requests.clear(),this.presence.clear(),this.invites=[],this.knocks.clear(),this.dms.clear(),this.unread.clear(),this.openChat.clear(),this.me=null}watchDm(e){const t=this.me,s=ti(yi(G(q,`dms/${t.uid}/${e}`),gi("ts"),mi(50)),i=>{const r=i.val();if(!r)return;const o=this.dms.get(e)??[];if(o.some(d=>d.id===i.key))return;const l={id:i.key,from:r.from,text:r.text,ts:typeof r.ts=="number"?r.ts:Ct()};o.push(l),this.dms.set(e,o);const c=l.ts>=this.sessionStart-2e3;c&&l.from!==t.uid&&!this.openChat.has(e)&&this.unread.set(e,(this.unread.get(e)??0)+1),this.emit(),c&&this.dmListeners.forEach(d=>d(e,l))},()=>{});this.dmUnsubs.set(e,s)}markRead(e){this.unread.delete(e)&&this.emit()}async sendRequest(e){const t=this.me,s=e.trim();if(!s)throw new Error("Type a username first.");const i=await tn(G(q,`usernames/${s.toLowerCase()}`));if(!i.exists())throw new Error(`Nobody is called "${s}".`);const r=i.val();if(r===t.uid)throw new Error("That's you!");if(this.friends.has(r))throw new Error("You're already friends.");return this.requests.has(r)?(await this.accept(r),`You and ${s} are now friends.`):(await rt(G(q,`friendRequests/${r}/${t.uid}`),{ts:dt()}),`Friend request sent to ${s}.`)}async accept(e){const t=this.me,s=Ct();await Pe(G(q),{[`friends/${t.uid}/${e}`]:{since:s},[`friends/${e}/${t.uid}`]:{since:s},[`friendRequests/${t.uid}/${e}`]:null})}decline(e){return $t(G(q,`friendRequests/${this.me.uid}/${e}`))}async removeFriend(e){const t=this.me;await Pe(G(q),{[`friends/${t.uid}/${e}`]:null,[`friends/${e}/${t.uid}`]:null})}async sendDm(e,t){const s=this.me,i=Cn(G(q,`dms/${s.uid}/${e}`)).key,r={from:s.uid,text:t.slice(0,200),ts:dt()};await Pe(G(q),{[`dms/${s.uid}/${e}/${i}`]:r,[`dms/${e}/${s.uid}/${i}`]:r})}async inviteToRoom(e,t,s){const i=this.me,r=Cn(G(q,`invites/${e}`)).key;await Pe(G(q),{[`roomInvites/${t}/${e}`]:!0,[`invites/${e}/${r}`]:{room:t,roomName:s,from:i.uid,fromName:i.name,ts:dt()}})}async uidOf(e){const t=e.trim().toLowerCase();if(!t)return null;const s=await tn(G(q,`usernames/${t}`));return s.exists()?s.val():null}async knock(e){const t=this.me,s=G(q,`knocks/${e}/${t.uid}`);await rt(s,{name:t.name,ts:dt()}),mn(s).remove()}cancelKnock(e){const t=G(q,`knocks/${e}/${this.me.uid}`);return mn(t).cancel().catch(()=>{}),$t(t).catch(()=>{})}watchKnock(e,t){const s=this.me;let i=!1,r=!1,o=0;const l=tt(G(q,`roomInvites/${ht(e)}/${s.uid}`),d=>{!d.exists()||r||(r=!0,window.clearTimeout(o),t("accepted"))},()=>{}),c=tt(G(q,`knocks/${e}/${s.uid}`),d=>{if(d.exists()){i=!0;return}!i||r||(window.clearTimeout(o),o=window.setTimeout(()=>{r||t("declined")},700))},()=>{});return()=>{window.clearTimeout(o),l(),c()}}async answerKnock(e,t){const s=this.me,i={[`knocks/${s.uid}/${e}`]:null};t&&(i[`roomInvites/${ht(s.uid)}/${e}`]=!0),await Pe(G(q),i)}armInviteCleanup(){const e=this.me;e&&mn(G(q,`roomInvites/${ht(e.uid)}`)).remove().catch(()=>{})}clearRoomInvites(){const e=this.me;return e?(mn(G(q,`roomInvites/${ht(e.uid)}`)).cancel().catch(()=>{}),$t(G(q,`roomInvites/${ht(e.uid)}`)).catch(()=>{})):Promise.resolve()}async dismissInvite(e){this.invites=this.invites.filter(t=>t.id!==e),this.emit(),await $t(G(q,`invites/${this.me.uid}/${e}`)).catch(()=>{})}roomCounts(){const e=new Map;return this.presence.forEach(t=>t.room&&e.set(t.room,(e.get(t.room)??0)+1)),e}}const Z=new L0,is=20,Ot=18,$0={id:"snake",title:"Snake",icon:"🐍",blurb:"Eat, grow, don't bite yourself. Arrow keys or WASD.",mount(n){const e=a("canvas",{class:"arcade-canvas",width:is*Ot,height:is*Ot}),t=a("div",{class:"arcade-score"},"Score: 0"),s=a("div",{class:"hint"},"Press any arrow key to start");n.append(e,t,s);const i=e.getContext("2d");let r=[],o={x:1,y:0},l=null,c={x:10,y:10},d=0,h=!1,u=!1,m=0,f=0;function y(){r=[{x:5,y:10},{x:4,y:10},{x:3,y:10}],o={x:1,y:0},l=null,d=0,u=!1,w(),t.textContent=`Score: 0   Best: ${m}`}function w(){do c={x:Math.floor(Math.random()*is),y:Math.floor(Math.random()*is)};while(r.some(M=>M.x===c.x&&M.y===c.y))}function E(){l&&(o=l,l=null);const M={x:r[0].x+o.x,y:r[0].y+o.y};if(M.x<0||M.y<0||M.x>=is||M.y>=is||r.some(A=>A.x===M.x&&A.y===M.y)){u=!0,h=!1,m=Math.max(m,d),t.textContent=`Score: ${d}   Best: ${m}`,s.textContent="Game over. Press any arrow key to play again.",x();return}r.unshift(M),M.x===c.x&&M.y===c.y?(d++,t.textContent=`Score: ${d}   Best: ${m}`,w()):r.pop(),x()}function x(){i.fillStyle="#0b1a24",i.fillRect(0,0,e.width,e.height),i.fillStyle="#d32121",i.fillRect(c.x*Ot+3,c.y*Ot+3,Ot-6,Ot-6),r.forEach((M,A)=>{i.fillStyle=u?"#777":A===0?"#7be37b":"#3fae5a",i.fillRect(M.x*Ot+1,M.y*Ot+1,Ot-2,Ot-2)})}const _={ArrowUp:{x:0,y:-1},w:{x:0,y:-1},W:{x:0,y:-1},ArrowDown:{x:0,y:1},s:{x:0,y:1},S:{x:0,y:1},ArrowLeft:{x:-1,y:0},a:{x:-1,y:0},A:{x:-1,y:0},ArrowRight:{x:1,y:0},d:{x:1,y:0},D:{x:1,y:0}},U=M=>{const A=_[M.key];if(!A)return;M.preventDefault(),h||((u||r.length===0)&&y(),h=!0,s.textContent="",clearInterval(f),f=window.setInterval(E,110));const W=l??o;(A.x!==-W.x||A.y!==-W.y)&&(l=A)};return window.addEventListener("keydown",U),y(),x(),()=>{clearInterval(f),window.removeEventListener("keydown",U)}}},fd=(n,e,t,s)=>({id:n,title:e,icon:t,blurb:s,comingSoon:!0,mount:()=>()=>{}}),F0=[$0,fd("blood-catch","Blood Catch","🩸","Catch the falling drops."),fd("lobby-pong","Lobby Pong","🏓","Two players, one ball.")];let To=null;function U0(){if(To)return;let n=null;const e=a("div",{class:"arcade-body"}),t=a("div",{class:"arcade-title"},"🕹️ Arcade"),s=a("button",{class:"btn small hidden",onclick:()=>c()},"← Games"),i=a("button",{class:"btn small",onclick:()=>h()},"Close"),r=a("div",{class:"arcade-screen"},a("div",{class:"arcade-head"},t,a("div",{class:"row"},s,i)),e),o=a("div",{class:"arcade-overlay",onmousedown:m=>{m.target===o&&h()}},r);To=o,document.body.append(o);function l(){n==null||n(),n=null,e.replaceChildren()}function c(){l(),t.textContent="🕹️ Arcade",s.classList.add("hidden"),e.append(a("div",{class:"arcade-list"},...F0.map(m=>a("button",{class:"arcade-card"+(m.comingSoon?" soon":""),disabled:!!m.comingSoon,onclick:()=>d(m)},a("div",{class:"arcade-icon"},m.icon),a("div",{class:"arcade-name"},m.title),a("div",{class:"hint"},m.comingSoon?"Coming soon":m.blurb)))))}function d(m){l(),t.textContent=`${m.icon} ${m.title}`,s.classList.remove("hidden"),n=m.mount(e,{close:h})}function h(){l(),window.removeEventListener("keydown",u),o.remove(),To=null}const u=m=>{m.key==="Escape"&&h()};window.addEventListener("keydown",u),o.addEventListener("arcade-close",h),c()}let Gs=null;function qs(){Gs==null||Gs.remove(),Gs=null}function gf(n,e,t){qs();const s=a("div",{class:"ctx-menu"},a("div",{class:"ctx-head"},"Choose Option"),...t.map(r=>a("div",{class:"ctx-opt",onclick:()=>{qs(),r.action()}},a("span",{class:r.danger?"ctx-danger":""},r.label),r.target?a("span",{class:"ctx-target"}," "+r.target):null)),a("div",{class:"ctx-opt",onclick:qs},a("span",{class:"ctx-danger"},"Cancel")));document.body.append(s);const i=s.getBoundingClientRect();s.style.left=Math.min(n,window.innerWidth-i.width-4)+"px",s.style.top=Math.min(e,window.innerHeight-i.height-4)+"px",Gs=s,setTimeout(()=>{const r=o=>{o instanceof KeyboardEvent&&o.key!=="Escape"||o instanceof MouseEvent&&s.contains(o.target)||(qs(),window.removeEventListener("pointerdown",r),window.removeEventListener("keydown",r),window.removeEventListener("blur",r))};window.addEventListener("pointerdown",r),window.addEventListener("keydown",r),window.addEventListener("blur",r)},0)}function B0(n){const e=Math.max(1,Math.ceil(n/6e4));return e>=60?`${Math.floor(e/60)}h ${e%60}m`:`${e}m`}function W0(n,e,t){const s=e.profile,i=()=>window.matchMedia("(max-width: 900px)").matches;let r="inventory",o=i(),l=null,c=null,d=null;const h=a("div",{class:"osrs-tabs"}),u=a("div",{class:"osrs-body"}),m=a("aside",{class:"osrs-panel"},h,u);n.append(m);function f(){const A=(W,k,S)=>a("button",{class:"osrs-tab"+(r===W&&!o?" on":""),title:S,onclick:()=>{i()&&r===W?o=!o:(r=W,o=!1),_()}},k);h.replaceChildren(A("inventory","🎒","Inventory"),A("emotes","😀","Emotes"),A("music","♪","Music"),...t.roomTab?[A("room",t.roomTab.icon,t.roomTab.title)]:[])}function y(){const A=a("div",{class:"emote-grid"},...Is.map(W=>{const k=_i(s,W.id);return a("button",{class:"emote-cell"+(k?"":" locked"),title:k?`${W.name}: ${W.desc}  (/${W.id})`:`${W.name}: locked. Buy it in the shop for ${W.price} drops.`,onclick:()=>t.onEmote(W.id)},a("span",{class:"emote-icon"},W.icon),a("span",{class:"emote-name"},W.name),k?null:a("span",{class:"emote-lock"},"🔒"))}));u.replaceChildren(a("div",{class:"osrs-title"},"Emotes"),A,a("div",{class:"inv-foot"},a("div",{class:"hint"},"Click one to perform it, or type /name in chat (like /dance). Walking cancels it."),Is.some(W=>!_i(s,W.id))?a("button",{class:"btn small",onclick:()=>e.navigate("shop")},"Get more in the shop"):null))}function w(){const A=l!==null?s.inventory[l]:null;return A?Bt[A.item].useOnObject?"Now click the CD player in the lobby.":"Now click a player to use it on them.":"Knife: click it, then a player. CD: click it, then the CD player. Syringe: just click it."}function E(){c==null||c(),c=null;const A=a("div",{class:"inv-grid"});for(let S=0;S<pl;S++){const P=s.inventory[S],L=P?Bt[P.item]:null,X=!!(P!=null&&P.inPlayer),O=a("div",{class:"inv-slot"+(l===S?" selected":"")+(L?" filled":"")+(X?" loaned":""),title:L?X?`${L.name} (in the player)`:L.name:"",onclick:()=>{if(L){if(X)return t.say(`Your ${L.name} is in the player. It'll be back when it's done.`,"warn");if(L.useSelf)return t.onUseSelf(L.useSelf);U(l===S?null:S)}},oncontextmenu:B=>{B.preventDefault(),L&&gf(B.clientX,B.clientY,[...X?[]:L.useSelf?[{label:"Draw blood",target:L.name,action:()=>t.onUseSelf(L.useSelf)}]:[{label:l===S?"Cancel use":"Use",target:L.name,action:()=>U(l===S?null:S)}],{label:"Examine",target:L.name,action:()=>t.say(X?`${L.examine} (It's in the player right now.)`:L.examine)}])}},L?a("img",{src:L.icon,alt:L.name,draggable:!1}):null,P&&P.qty>1?a("span",{class:"qty"},String(P.qty)):null);A.append(O)}const W=ef(s),k=Ww(s);u.replaceChildren(a("div",{class:"osrs-title"},"Inventory"),A,a("div",{class:"inv-foot"},a("div",{class:"blood-line"},a("img",{src:nn,alt:"",class:"blood-ico"}),` ${s.blood} drop${s.blood===1?"":"s"} of blood`),a("div",{class:"stab-status ready"},k===0?"Stab each person once a day":`Stabbed today: ${k}. Each person once a day`),a("div",{class:"stab-status "+(W?"ready":"used")},W?"Syringe: ready (2 drops)":`Syringe used. Again in ${B0(ia())}`),a("div",{class:"hint"},w())))}function x(){if(c==null||c(),c=null,!s.owned[sa]){u.replaceChildren(a("div",{class:"osrs-title"},"Music"),a("div",{class:"music-locked"},a("p",{},"🔒 You don't have a jukebox pass."),a("p",{class:"hint"},"Buy music access in the shop to stream tracks while you hang out."),a("button",{class:"btn small",onclick:()=>e.navigate("shop")},"Open shop")));return}const A=a("div",{class:"track-list"}),W=a("div",{class:"now"}),k=a("button",{class:"btn small",onclick:()=>Xe.toggle()}),S=a("input",{type:"range",min:0,max:1e3,value:0,class:"seek",oninput:()=>Xe.seek(Number(S.value)/1e3)}),P=a("span",{class:"time"}),L=a("input",{type:"range",min:0,max:100,value:Math.round(Xe.audio.volume*100),class:"vol",oninput:()=>Xe.setVolume(Number(L.value)/100)}),X=()=>{const O=Xe.audio;A.replaceChildren(...gn.map(B=>{var F,V;return a("div",{class:"track"+(((F=Xe.current)==null?void 0:F.id)===B.id?" on":""),onclick:()=>Xe.play(B)},a("span",{class:"track-ico"},((V=Xe.current)==null?void 0:V.id)===B.id&&Xe.playing?"▶":"♪"),a("div",{},a("div",{class:"track-title"},B.title),a("div",{class:"hint"},B.artist)))})),W.textContent=Xe.failed?"Couldn't load that track.":Xe.current?`${Xe.playing?"Now playing":"Paused"}: ${Xe.current.title}`:"Pick a track to start streaming.",k.textContent=Xe.playing?"⏸ Pause":"▶ Play",document.activeElement!==S&&Number.isFinite(O.duration)&&O.duration>0&&(S.value=String(Math.round(O.currentTime/O.duration*1e3))),P.textContent=`${Rr(O.currentTime)} / ${Rr(O.duration)}`};c=Xe.subscribe(X),X(),u.replaceChildren(a("div",{class:"osrs-title"},"Music"),A,W,a("div",{class:"row center"},k),S,P,a("label",{class:"hint"},"Volume ",L))}function _(){c==null||c(),c=null,d==null||d(),d=null,m.classList.toggle("collapsed",o),f(),r==="inventory"?E():r==="emotes"?y():r==="room"&&t.roomTab?(u.replaceChildren(),d=t.roomTab.mount(u)):x()}function U(A){l=A,t.onSelect(A),r==="inventory"&&E()}_();const M=window.setInterval(()=>{r==="inventory"&&E()},6e4);return{setSelected(A){l=A,r==="inventory"&&E()},refresh:_,dispose(){window.clearInterval(M),c==null||c(),d==null||d(),m.remove()}}}const pd={open:"Open to all",knock:"Knock to enter",closed:"Friends only"},H0={open:"Anyone can walk in.",knock:"Friends walk in. Everyone else knocks and you let them in from your friends menu.",closed:"Only friends can come in. Strangers can't knock."};function j0(n,e,t){const s=new Set,i=a("div",{class:"roompanel"});n.append(i);const r=(u,m)=>u.then(()=>m&&le(m),()=>le("The hotel refused that change.","err"));function o(){const u=t.getDef();if(!t.isOwner()){i.replaceChildren(a("div",{class:"osrs-title"},"Room"),a("div",{class:"inv-foot"},a("div",{},u.name),a("div",{class:"hint"},`Owned by ${u.ownerName??"the hotel"}`),a("div",{class:"hint"},pd[u.access])));return}const m=a("input",{type:"text",value:u.name,maxLength:28,class:"mini-input"}),f=t.getTool();i.replaceChildren(a("div",{class:"osrs-title"},"My room"),a("div",{class:"rp-sec"},a("div",{class:"rp-label"},"Name"),a("div",{class:"row"},m,a("button",{class:"btn small",onclick:()=>{const y=m.value.trim();if(y.length<3)return le("Room names need 3+ characters.","err");r(Nt(u.id,{name:y}),"Renamed.")}},"Save"))),a("div",{class:"rp-sec"},a("div",{class:"rp-label"},"Who can come in"),a("div",{class:"rp-chips"},...["open","knock","closed"].map(y=>a("button",{class:"chip"+(u.access===y?" on":""),onclick:()=>void r(Nt(u.id,{access:y}))},pd[y]))),a("div",{class:"hint"},H0[u.access])),a("div",{class:"rp-sec"},a("div",{class:"rp-label"},"Size"),a("div",{class:"rp-chips"},...k0.map(y=>a("button",{class:"chip"+(u.w===y.w&&u.h===y.h?" on":""),onclick:()=>{const w={w:y.w,h:y.h};for(const E of u.furni){const x=Ue[E.kind];(E.x+x.w>y.w||E.y+x.h>y.h)&&(w[`furni/${E.id}`]=null)}r(Nt(u.id,w))}},y.label)))),a("div",{class:"rp-sec"},a("div",{class:"rp-label"},"Floor"),a("div",{class:"rp-chips"},...v0.map(y=>a("button",{class:"chip swatch2"+(u.theme.floorA===y.a&&u.theme.floorB===y.b?" on":""),title:y.name,style:{background:`linear-gradient(135deg, ${y.a} 50%, ${y.b} 50%)`},onclick:()=>void r(Nt(u.id,{"theme/floorA":y.a,"theme/floorB":y.b}))}))),a("div",{class:"rp-label"},"Floor pattern"),a("div",{class:"rp-chips"},a("button",{class:"chip"+(u.theme.floorTex?"":" on"),onclick:()=>void r(Nt(u.id,{"theme/floorTex":null}))},"Plain"),...C0.map(y=>a("button",{class:"chip"+(u.theme.floorTex===y.id?" on":""),onclick:()=>void r(Nt(u.id,{"theme/floorTex":y.id}))},y.name))),a("div",{class:"rp-label"},"Walls"),a("div",{class:"rp-chips"},...b0.map(y=>a("button",{class:"chip swatch2"+(u.theme.wall===y?" on":""),style:{background:y},onclick:()=>void r(Nt(u.id,{"theme/wall":y,"theme/wallTex":null}))}))),a("div",{class:"rp-label"},"Wallpaper"),a("div",{class:"rp-chips"},...E0.map(y=>a("button",{class:"chip wp"+(u.theme.wallTex===y.id?" on":""),title:y.name,style:{backgroundImage:`url("${Jt(`textures/wall_${y.id}.png`)}")`},onclick:()=>void r(Nt(u.id,{"theme/wallTex":y.id}))}))),a("div",{class:"rp-label"},"Rug"),a("div",{class:"rp-chips"},a("button",{class:"chip"+(u.theme.rug?" on":""),onclick:()=>void r(Nt(u.id,{"theme/rug":!u.theme.rug}))},u.theme.rug?"On":"Off"),...w0.map(y=>a("button",{class:"chip swatch2"+(u.theme.rugColor===y?" on":""),style:{background:y},onclick:()=>void r(Nt(u.id,{"theme/rug":!0,"theme/rugColor":y}))})))),a("div",{class:"rp-sec"},a("div",{class:"rp-label"},`Furniture (${u.furni.length}/${ca})`),a("div",{class:"rp-chips"},...Object.values(Ue).filter(y=>y.placeable).map(y=>a("button",{class:"chip"+(f===y.id?" on":""),title:`${y.label} (${y.w}×${y.h})`,onclick:()=>{t.setTool(f===y.id?null:y.id),o()}},`${y.icon} ${y.label}`)),a("button",{class:"chip"+(f==="pickup"?" on":""),onclick:()=>{t.setTool(f==="pickup"?null:"pickup"),o()}},"🧹 Pick up")),a("div",{class:"hint"},f?"Click in the room to use the tool. Esc to stop.":"Pick a piece, then click a tile in the room."),u.furni.length?a("button",{class:"btn small",onclick:()=>{if(confirm("Remove all furniture from this room?"))for(const y of u.furni)ua(u.id,y.id)}},"Clear room"):null),l=a("div",{},c()))}let l=null;function c(){const u=t.getDef(),m=[...Z.friends.values()].sort((f,y)=>Number(Z.isOnline(y.uid))-Number(Z.isOnline(f.uid))||f.name.localeCompare(y.name));return a("div",{class:"rp-sec"},a("div",{class:"rp-label"},"Invite friends"),m.length===0?a("div",{class:"hint"},"Add friends in the Friends panel first."):a("div",{class:"invite-list"},...m.map(f=>a("div",{class:"invite-row"},a("span",{class:"dot "+(Z.isOnline(f.uid)?"on":"")}),a("span",{class:"invite-name"},f.name),a("button",{class:"btn small",disabled:s.has(f.uid),onclick:()=>{s.add(f.uid),Z.inviteToRoom(f.uid,u.id,u.name).then(()=>le(`Invited ${f.name}.`),()=>{s.delete(f.uid),le("Couldn't send that invite.","err")}).finally(o)}},s.has(f.uid)?"Invited ✓":"Invite")))))}o();const d=t.onDefChange(o),h=Z.subscribe(()=>{t.isOwner()&&l&&l.replaceChildren(c())});return()=>{d(),h(),i.remove()}}function Pr(n){const e=a("div",{class:"head"});return n&&At({figure:n,dir:2,headDir:2,headOnly:!0}).then(t=>{if(!t||!e.isConnected)return;const s=Qr(t);s.className="head-canvas",e.replaceChildren(s)}),e}function V0(n){const e=a("div",{class:"head"});return pa(n).then(t=>{!t||!e.isConnected||e.replaceWith(Pr(t.figure))}),e}const z0=6e4;function G0(n,e,t,s){const i=e.profile,r=ht(i.uid);let o={},l="",c=null,d=null,h=null,u=0,m=!1;const f=a("div",{class:"door-body"}),y=a("div",{class:"door-popup",role:"dialog","aria-label":"Door"},a("div",{class:"door-head"},a("strong",{},"🚪 Where to?"),a("button",{class:"btn small",onclick:()=>P()},"✕")),f);n.append(y);function w(O,B){Te(i,"visit",`went to ${B}`),P(),e.navigate("room",{roomId:O})}function E(O,B){return{owner:B.owner,roomId:O,roomName:B.name,ownerName:B.ownerName,access:df(B.access),friend:Z.friends.has(B.owner),online:Z.isOnline(B.owner),count:Z.roomCounts().get(O)??0}}function x(){return Object.entries(o).filter(([F,V])=>F.startsWith("u_")&&V.owner!==i.uid&&F!==t).map(([F,V])=>E(F,V)).filter(F=>F.friend||F.access==="open"||F.access==="knock"&&F.online).sort((F,V)=>Number(V.friend)-Number(F.friend)||Number(V.online)-Number(F.online)||V.count-F.count||F.ownerName.localeCompare(V.ownerName)).slice(0,40)}function _(O){return O.friend||O.access==="open"?a("button",{class:"btn small primary",onclick:()=>w(O.roomId,`${O.ownerName}'s room`)},"Visit"):O.access==="knock"?O.online?a("button",{class:"btn small",onclick:()=>k(O)},"Knock"):a("button",{class:"btn small",disabled:!0},"Offline"):a("button",{class:"btn small",disabled:!0},"Closed")}function U(O){const B=O.friend?"friend":O.access==="open"?"open to everyone":O.access==="knock"?"knock to enter":"closed";return a("div",{class:"door-row"},V0(O.owner),a("span",{class:"dot "+(O.online?"on":"")}),a("div",{class:"door-row-main"},a("div",{class:"door-row-name"},O.roomName),a("div",{class:"hint"},`${O.ownerName} · ${B}${O.count?` · ${O.count} inside`:""}`)),_(O))}function M(){if(m)return;if(d)return W();const O=x(),B=c&&"uid"in c?o[ht(c.uid)]:void 0,F=B&&c&&"uid"in c?E(ht(c.uid),B):null;f.replaceChildren(a("div",{class:"door-main"},t!==pt?a("button",{class:"btn primary door-big",onclick:()=>w(pt,"the public room")},"🏙 Public room"):null,t!==r?a("button",{class:"btn primary door-big",onclick:()=>w(r,"their own room")},"🏠 My room"):null),a("div",{class:"fp-label"},"Visit a player's room"),a("form",{class:"row door-search",onsubmit:async V=>{if(V.preventDefault(),l=A.value.trim(),!l)return c=null,M();const Y=await Z.uidOf(l).catch(()=>null);c=Y?{uid:Y,name:l}:{none:!0},M()}},A,a("button",{class:"btn small",type:"submit"},"Find")),...c&&"none"in c?[a("div",{class:"hint pad"},`Nobody is called "${l}".`)]:[],...c&&"uid"in c?[F?U(F):a("div",{class:"hint pad"},`${c.name} hasn't set up a room yet.`)]:[],a("div",{class:"door-list"},...O.length?O.map(U):[a("div",{class:"hint pad"},"No rooms to visit right now. Search for a friend by username above.")]))}const A=a("input",{class:"mini-input",type:"text",placeholder:"Username…",maxLength:16,autocapitalize:"none",spellcheck:!1});function W(){const O=d;O.state==="waiting"?f.replaceChildren(a("div",{class:"door-knock"},a("div",{class:"door-knock-ico"},"✊"),a("div",{},a("strong",{},`Knocking on ${O.row.ownerName}'s door…`)),a("div",{class:"hint"},"They'll see your request in their friends menu. Hang tight."),a("button",{class:"btn",onclick:()=>S()},"Cancel"))):f.replaceChildren(a("div",{class:"door-knock"},a("div",{class:"door-knock-ico"},"🚫"),a("div",{},a("strong",{},O.state==="declined"?`${O.row.ownerName} didn't let you in.`:`No answer from ${O.row.ownerName}.`)),a("button",{class:"btn",onclick:()=>S()},"Back")))}function k(O){d={row:O,state:"waiting"},M(),Z.knock(O.owner).then(()=>{m||(d==null?void 0:d.row.owner)!==O.owner||(h=Z.watchKnock(O.owner,B=>{m||(d==null?void 0:d.row.owner)!==O.owner||(h==null||h(),h=null,window.clearTimeout(u),B==="accepted"?(le(`${O.ownerName} let you in.`),w(O.roomId,`${O.ownerName}'s room (let in)`)):(d={row:O,state:"declined"},M()))}),u=window.setTimeout(()=>{m||(d==null?void 0:d.state)!=="waiting"||(h==null||h(),h=null,Z.cancelKnock(O.owner),d={row:O,state:"none"},M())},z0),ut("knock",.35))},()=>{le("Couldn't knock. They may have just closed their door.","err"),d=null,M()})}function S(){const O=d;h==null||h(),h=null,window.clearTimeout(u),O&&O.state==="waiting"&&Z.cancelKnock(O.row.owner),d=null,M()}function P(){if(m)return;const O=d;(O==null?void 0:O.state)==="waiting"&&Z.cancelKnock(O.row.owner),m=!0,h==null||h(),window.clearTimeout(u),L(),X(),y.remove(),s()}const L=x0(O=>{o=O,M()}),X=Z.subscribe(()=>{!d&&document.activeElement!==A&&M()});return M(),{close:P}}const Hs=480,q0=6500,md=100,xo=700,gd=750,ma=[[0,-1,0],[1,-1,1],[1,0,2],[1,1,3],[0,1,4],[-1,1,5],[-1,0,6],[-1,-1,7]],yd=(n,e)=>Math.max(Math.abs(n.x-e.x),Math.abs(n.y-e.y));function zi(n,e){var i;const t=Math.sign(e.x-n.x),s=Math.sign(e.y-n.y);return((i=ma.find(r=>r[0]===t&&r[1]===s))==null?void 0:i[2])??2}function wl(n){const e=new Image;return e.src=n,e}const K0=wl(Bt.knife.icon),Y0=wl(nn),Q0=wl(Bt.syringe.icon),Gi=94;function J0(n,e,t){const s=e.profile,i=new Map,r=[];let o=!1,l=!1,c=!0,d=cd();const h=new Set;let u=null,m=null,f=[],y=[],w=null,E=!1,x=null,_=null;const U=t===pt?"ROOMS":"EXIT";let M=null,A=null,W=!1,k=null;const S=[],P=[],L=[],X=[],O=[],B=[],F=()=>d.ownerUid===s.uid,V=a("canvas",{class:"room-canvas"}),Y=a("div",{class:"chat-log"}),K=a("div",{class:"online",title:"Who's in this room",onclick:()=>K.classList.toggle("open")}),Q=a("div",{class:"room-title"},t===pt?"Main Lobby":"Loading room…"),ve=a("div",{class:"action-hint hidden"}),j=a("input",{class:"chat-input",type:"text",maxLength:md,placeholder:"Say something, or try /dance. Tap the floor to walk.",autocomplete:"off"}),ie=a("div",{class:"stage"},V,K,Y,ve,Q),fe=a("div",{class:"side-host"});n.append(a("div",{class:"room"},a("div",{class:"room-main"},ie,fe),a("form",{class:"chat-bar",onsubmit:p=>{p.preventDefault(),Kf()}},j,a("button",{class:"btn primary",type:"submit"},"Send"))));const v=V.getContext("2d");function ee(p,g="game"){var b;for(Y.append(a("div",{class:`line sys ${g}`},p));Y.children.length>60;)(b=Y.firstElementChild)==null||b.remove();Y.scrollTop=Y.scrollHeight}const Be=W0(fe,e,{say:ee,onSelect:p=>{M=p,A=null,re()},onEmote:p=>Ol(p),onUseSelf:p=>{p==="syringe"&&zf()},roomTab:t===pt?void 0:{icon:"🏠",title:"Room",mount:p=>j0(p,e,{getDef:()=>d,isOwner:F,getTool:()=>k,setTool:g=>{k=g,re()},onDefChange:g=>(ne.add(g),()=>ne.delete(g))})}}),ne=new Set,ae=()=>M!==null&&s.inventory[M]?Bt[s.inventory[M].item]:null;function re(){var b;const p=ae();let g="";k&&F()?g=k==="pickup"?"Pick up furniture: click it":`Place ${((b=Ue[k])==null?void 0:b.label)??k}: click a tile`:p!=null&&p.useOnObject?g=w&&w.kind===p.useOnObject?`Use ${p.name} → ${Ue[w.kind].label}`:`Use ${p.name} →`:p?g=m&&m.uid!==s.uid?`Use ${p.name} → ${m.name}`:`Use ${p.name} →`:m?g=m.name:w&&w.kind?g=Ue[w.kind].label:E&&(g=t===pt?"Door: rooms":"Door: leave the room"),ve.textContent=g,ve.classList.toggle("hidden",!g),V.style.cursor=p||k?"crosshair":"pointer"}function De(){h.clear();for(const p of d.furni){const g=Ue[p.kind];for(let b=0;b<g.w;b++)for(let C=0;C<g.h;C++)h.add(`${p.x+b},${p.y+C}`)}}const R=(p,g)=>p>=0&&g>=0&&p<d.w&&g<d.h&&!h.has(`${p},${g}`);function N(p,g){if(!R(g.x,g.y)||p.x===g.x&&p.y===g.y)return[];const b=I=>I.y*d.w+I.x,C=new Map([[b(p),null]]),T=[p];for(let I=0;I<T.length;I++){const J=T[I];if(J.x===g.x&&J.y===g.y)break;for(const[te,ue]of ma){const _e=J.x+te,se=J.y+ue;!R(_e,se)||C.has(se*d.w+_e)||te!==0&&ue!==0&&(!R(J.x+te,J.y)||!R(J.x,J.y+ue))||(C.set(se*d.w+_e,J),T.push({x:_e,y:se}))}}if(!C.has(b(g)))return[];const $=[];for(let I=g;I&&!(I.x===p.x&&I.y===p.y);I=C.get(b(I))??null)$.unshift(I);return $}let z={x:0,y:0},oe=document.createElement("canvas");function he(p){d=p,De();const g=ha(d);oe=g.canvas,z=g.origin,Qe();const b=d;ff(d.theme).then(()=>{if(o||d!==b||!d.theme.floorTex&&!d.theme.wallTex)return;const C=ha(d);oe=C.canvas,z=C.origin}),Q.textContent=d.ownerName?`${d.name} · by ${d.ownerName}`:d.name,ne.forEach(C=>C())}let D=1,xe=0,Ae=0;function Qe(){const p=window.devicePixelRatio||1,g=ie.clientWidth,b=ie.clientHeight;V.width=Math.floor(g*p),V.height=Math.floor(b*p),V.style.width=g+"px",V.style.height=b+"px";const C=Math.min(g/oe.width,b/(oe.height+70));D=C>=1?Math.floor(C*2)/2:C,D=Math.max(.4,Math.min(D,2)),xe=Math.round((g-oe.width*D)/2+z.x*D),Ae=Math.round((b-oe.height*D)/2+z.y*D+24)}const ot=new ResizeObserver(Qe);ot.observe(ie);const we=p=>({x:xe+p.x*D,y:Ae+p.y*D});function Fe(p,g){const b=(p-xe)/D/(mt/2),C=(g-Ae)/D/(ct/2),T=Math.floor((b+C)/2),$=Math.floor((C-b)/2);return T>=0&&$>=0&&T<d.w&&$<d.h?{x:T,y:$}:null}function Ze(p,g,b){let C=null;for(const T of p)g>=T.x0&&g<=T.x1&&b>=T.y0&&b<=T.y1&&(!C||T.depth>C.depth)&&(C=T);return C}const Pt=(p,g)=>{const b=Ze(f,p,g);return b?i.get(b.id)??null:null},We=p=>{const g=V.getBoundingClientRect();return{x:p.clientX-g.left,y:p.clientY-g.top}},_t=p=>d.furni.find(g=>{const b=Ue[g.kind];return p.x>=g.x&&p.x<g.x+b.w&&p.y>=g.y&&p.y<g.y+b.h}),jt=(p,g)=>!!g&&p.x>=g.x0&&p.x<=g.x1&&p.y>=g.y0&&p.y<=g.y1;V.addEventListener("mousemove",p=>{const g=We(p);u=Fe(g.x,g.y);const b=Pt(g.x,g.y),C=b?null:Ze(y,g.x,g.y),T=!b&&!C&&jt(g,x);(b!==m||(C==null?void 0:C.id)!==(w==null?void 0:w.id)||T!==E)&&(m=b,w=C,E=T,re())}),V.addEventListener("mouseleave",()=>{u=null,m=null,w=null,E=!1,re()}),V.addEventListener("click",p=>{if(eo){eo=!1;return}const g=We(p),b=Pt(g.x,g.y),C=Fe(g.x,g.y);if(k&&F()){if(!C)return;if(k==="pickup"){const I=_t(C);I&&ua(d.id,I.id).catch(()=>le("Couldn't pick that up","err"))}else Df(k,C);return}const T=Ze(y,g.x,g.y);if(!b&&!T&&jt(g,x)){on(),Dl();return}const $=ae();if(($==null?void 0:$.useOnPlayer)==="stab"){b&&b.uid!==s.uid?to(b.uid):b?ee("You can't stab yourself.","warn"):(on(),C&&(A=null,Ms(C)));return}if($!=null&&$.useOnObject){T&&!b&&T.kind===$.useOnObject?Fl(T.id):(on(),T&&!b?ee("Nothing interesting happens.","warn"):C&&R(C.x,C.y)&&(A=null,Ms(C)));return}if(T&&!b){T.kind==="cdplayer"?$l():Ml(T.id);return}C&&R(C.x,C.y)&&(A=null,Ms(C))});function Sl(p,g,b,C){const T=Pt(p,g),$=Fe(p,g),I=ae(),J=Ws(s.inventory,"knife")>=0,te=[];T&&T.uid!==s.uid&&((I==null?void 0:I.useOnPlayer)==="stab"&&te.push({label:`Use ${I.name} →`,target:T.name,action:()=>to(T.uid)}),J&&(I==null?void 0:I.useOnPlayer)!=="stab"&&te.push({label:"Stab",target:T.name,danger:!0,action:()=>to(T.uid)}),te.push({label:"Examine",target:T.name,action:()=>ee(`${T.name}: a fellow hotel guest.`)}),Z.friends.has(T.uid)?te.push({label:"Message",target:T.name,action:()=>window.dispatchEvent(new CustomEvent("open-chat",{detail:T.uid}))}):te.push({label:"Add friend",target:T.name,action:()=>Z.sendRequest(T.name).then(se=>ee(se),se=>ee(se.message,"warn"))}));const ue=Ze(y,p,g);(ue==null?void 0:ue.kind)==="arcade"&&te.push({label:"Play",target:"Arcade machine",action:()=>Ml(ue.id)}),(ue==null?void 0:ue.kind)==="cdplayer"&&((I==null?void 0:I.useOnObject)==="cdplayer"&&te.push({label:`Use ${I.name} →`,target:"CD player",action:()=>Fl(ue.id)}),te.push({label:"Volume",target:"CD player",action:()=>$l()}),te.push({label:"Examine",target:"CD player",action:()=>ee(at&&!as(at)?`The CD player is playing "${at.title}", put in by ${at.byName}.`:"A chunky CD player. It's empty. Use a CD on it.")})),!T&&!ue&&jt({x:p,y:g},x)&&te.push({label:"Open",target:"Door",action:()=>Dl()});const _e=$?_t($):void 0;_e&&F()&&_e.kind!=="arcade"&&te.push({label:"Pick up",target:Ue[_e.kind].label,action:()=>void ua(d.id,_e.id).catch(()=>{})}),$&&R($.x,$.y)&&te.push({label:"Walk here",action:()=>{A=null,Ms($)}}),gf(b,C,te)}V.addEventListener("contextmenu",p=>{if(p.preventDefault(),performance.now()-Tl<900)return;const g=We(p);Sl(g.x,g.y,p.clientX,p.clientY)});let rn=null,eo=!1,Tl=-1e9;const $i=()=>{rn&&(window.clearTimeout(rn.timer),rn=null)};V.addEventListener("pointerdown",p=>{if(p.pointerType==="mouse")return;const g=We(p),b={x:g.x,y:g.y,cx:p.clientX,cy:p.clientY};rn={...b,timer:window.setTimeout(()=>{rn=null,eo=!0,Tl=performance.now(),Sl(b.x,b.y,b.cx,b.cy)},480)}}),V.addEventListener("pointermove",p=>{rn&&Math.hypot(p.clientX-rn.cx,p.clientY-rn.cy)>10&&$i()}),V.addEventListener("pointerup",$i),V.addEventListener("pointercancel",$i);function on(){M=null,Be.setSelected(null),re()}const xl=p=>{p.key==="Escape"&&(M!==null&&on(),Ds(),_==null||_.close(),k&&(k=null,re(),ne.forEach(g=>g())))};window.addEventListener("keydown",xl);function Df(p,g){const b=Ue[p];if(!(!b||!b.placeable)){if(d.furni.length>=ca)return ee(`That's the limit: ${ca} pieces per room.`,"warn");for(let C=0;C<b.w;C++)for(let T=0;T<b.h;T++){const $=g.x+C,I=g.y+T;if(_0($,I,d.doorX))return ee("Keep the doorway clear.","warn");if(!R($,I))return ee("There's no room for that there.","warn");for(const J of i.values()){const te=kt(J);if(te.x===$&&te.y===I)return ee("Someone is standing there.","warn")}}R0(d.id,p,g.x,g.y).catch(()=>ee("Couldn't place that.","warn"))}}function Al(p,g){var C;const b={x:g.x??1,y:g.y??1};return{uid:p,name:g.name??"?",figure:g.figure??s.figure,dir:g.dir??2,from:b,to:b,stepStart:0,path:[],dest:b,lastEmoteTs:((C=g.emote)==null?void 0:C.ts)??0}}const Fi=(p,g)=>g-p.stepStart<Hs&&(p.from.x!==p.to.x||p.from.y!==p.to.y);function kt(p){return p.path.length||performance.now()-p.stepStart<Hs?p.to:p.from}function Rl(p,g){const b=kt(p);p.dest=g,p.path=N(b,g),p.path.length&&(p.emote=void 0)}const Pn=()=>i.get(s.uid);function Ms(p){const g=Pn();g&&(Rl(g,p),g.path.length!==0&&Pe(G(q,`rooms/${t}/players/${s.uid}`),{x:p.x,y:p.y,dir:zi(kt(g),g.path[0])}).catch(console.warn))}function Lf(p,g){if(!(g-p.stepStart<Hs)&&(p.from=p.to,p.path.length)){const b=p.path.shift();p.dir=zi(p.from,b),p.to=b,p.stepStart=g}}function Pl(p,g){const b=Fi(p,g)?(g-p.stepStart)/Hs:1;return{x:p.from.x+(p.to.x-p.from.x)*b,y:p.from.y+(p.to.y-p.from.y)*b}}const Vt=(p,g)=>{const b=Pl(p,g),C=bt(b.x,b.y);return we({x:C.x,y:C.y+ct/2})};function Nl(p,g){p.emote={def:g,start:performance.now(),lastFx:0}}function Ol(p){const g=zs[p],b=Pn();if(!(!g||!b)){if(!_i(s,p))return ee(`You haven't unlocked ${g.name}. You can buy it in the shop.`,"warn");b.path=[],Nl(b,g),Pe(G(q,`rooms/${t}/players/${s.uid}`),{emote:{id:p,ts:dt()}}).catch(()=>ee("Your emote didn't go through.","warn")),Te(s,"emote",`/${p}`)}}function to(p){const g=i.get(p);if(!(!g||p===s.uid)){if(Ws(s.inventory,"knife")<0)return ee("You need a knife for that.","warn");if(!sd(s,p)){const b=Math.max(1,Math.ceil(ia()/6e4));return ee(`You've already stabbed ${g.name} today. You can stab them again in ${b>=60?`${Math.floor(b/60)}h ${b%60}m`:`${b}m`}.`,"warn")}A={type:"stab",uid:p,since:performance.now(),lastTry:0},on(),yd(kt(Pn()),kt(g))>1&&ee(`You walk towards ${g.name}…`)}}function Ml(p){A={type:"arcade",fid:p,since:performance.now(),lastTry:0}}function Dl(){_||(A={type:"door",since:performance.now(),lastTry:0})}function $f(){_||(_=G0(ie,e,t,()=>{_=null}))}function no(p,g,b,C){const T=kt(p);if(yd(T,g)<=1)return"arrived";if(b-C.lastTry<450)return"walking";C.lastTry=b;let $=null,I=1/0;for(const[J,te]of ma){const ue={x:g.x+J,y:g.y+te};if(!R(ue.x,ue.y))continue;const _e=ue.x===T.x&&ue.y===T.y?0:N(T,ue).length||1/0;_e<I&&($=ue,I=_e)}return!$||I===1/0?"unreachable":(Ms($),"walking")}function Ff(p){const g=Pn();if(!A||!g||W)return;if(p-A.since>2e4)return A=null,ee("You lose track of what you were doing.","warn");if(g.path.length||Fi(g,p))return;if(A.type==="door"){const $={x:d.doorX,y:0},I=no(g,$,p,A);if(I==="unreachable")return A=null,ee("You can't get to the door.","warn");I==="arrived"&&(A=null,g.dir=0,Pe(G(q,`rooms/${t}/players/${s.uid}`),{dir:g.dir}).catch(()=>{}),$f());return}if(A.type==="stab"){const $=i.get(A.uid);if(!$)return A=null,ee("They've left the room.","warn");const I=no(g,kt($),p,A);if(I==="unreachable")return A=null,ee("You can't reach them.","warn");if(I==="arrived"){const J=A.uid;A=null,Vf(J)}return}const b=A,C=d.furni.find($=>$.id===b.fid);if(!C){A=null;return}const T=no(g,{x:C.x,y:C.y},p,b);if(T==="unreachable")return A=null,ee("You can't get to it.","warn");T==="arrived"&&(A=null,g.dir=zi(kt(g),{x:C.x,y:C.y}),Pe(G(q,`rooms/${t}/players/${s.uid}`),{dir:g.dir}).catch(()=>{}),b.type==="cd"?Bf():U0())}let at=null,so=!1,io=!1,ns=null,Nn=null;const On=[];let Ll=0;const Ui=()=>!!at&&!as(at),lt={title:a("div",{class:"cd-title"}),status:a("div",{class:"hint"}),fill:a("div",{class:"cd-fill"}),time:a("span",{class:"hint"}),vol:a("span",{class:"cd-vol"}),mute:a("button",{class:"btn small",title:"Mute",onclick:()=>It.toggleMute()}),eject:a("button",{class:"btn small danger",onclick:()=>void Wf()},"⏏ Take my CD back")};function Bi(){if(!Nn)return;const p=at&&!as(at)?at:null;lt.title.textContent=p?`♪ ${p.title}`:"Nothing playing",lt.status.textContent=p?`Put in by ${p.byName}`:"Use a CD from your inventory on the player.";const g=p?p.endsAt-p.startedAt:0,b=p?Math.min(g,Ct()-p.startedAt):0;lt.fill.style.width=g?`${Math.max(0,Math.min(100,b/g*100))}%`:"0%",lt.time.textContent=p?`${Rr(b/1e3)} / ${Rr(g/1e3)}`:"",lt.vol.textContent=It.muted?"muted":`${Math.round(It.volume*100)}%`,lt.mute.textContent=It.muted||It.volume===0?"🔇":"🔊",lt.eject.classList.toggle("hidden",!(p&&p.by===s.uid))}function Uf(){Bi(),It.blocked&&!ns&&(ee("Click anywhere to hear the CD player (your browser holds back sound until you interact with the page).","warn"),ns=()=>{ns=null,It.tryPlay()},window.addEventListener("pointerdown",ns,{once:!0}))}const It=new f0(Uf);function Ds(){Nn&&(window.clearInterval(Nn.timer),Nn.el.remove(),Nn=null)}function $l(){if(Nn)return Ds();const p=b=>It.setVolume(It.volume+b),g=a("div",{class:"cd-popup"},a("div",{class:"cd-head"},a("strong",{},"💿 CD player"),a("button",{class:"btn small",onclick:Ds},"✕")),lt.title,lt.status,a("div",{class:"cd-bar"},lt.fill),lt.time,a("div",{class:"cd-row"},a("span",{class:"hint"},"Volume"),a("button",{class:"btn small",title:"Quieter",onclick:()=>p(-.1)},"−"),lt.vol,a("button",{class:"btn small",title:"Louder",onclick:()=>p(.1)},"+"),lt.mute),a("div",{class:"hint"},"Volume is just for you. Other players keep their own."),lt.eject);ie.append(g),Nn={el:g,timer:window.setInterval(Bi,500)},Bi()}function Fl(p){if(Ws(s.inventory,"cd")<0)return on(),ee("Your CD is already in the player.","warn");if(Ui())return on(),ee(`The CD player is busy playing ${at.byName}'s CD.`,"warn");A={type:"cd",fid:p,since:performance.now(),lastTry:0},on(),ee("You walk over to the CD player…")}async function Bf(){if(!so){so=!0;try{const p=Ws(s.inventory,"cd");if(p<0)return;if(Ui())return ee(`The CD player is busy playing ${at.byName}'s CD.`,"warn");await c0(s,p),Be.refresh(),Te(s,"cd","put a CD in the CD player"),ee("You slide the CD into the player. Music starts up. ♪ It will pop back into your inventory when it's finished.")}catch{ee("The CD player spits your CD back out. Someone else got there first.","warn")}finally{so=!1}}}async function Wf(){try{await ad(),Te(s,"cd","ejected their CD"),ee("You press eject.")}catch{ee("The eject button doesn't respond.","warn")}}function Hf(p){at=p,It.sync(p),Bi(),u0(s,p).then(g=>{g&&(Be.refresh(),ee("Your CD pops out of the player and back into your inventory."))})}function jf(){at&&as(at)&&!io&&(io=!0,ad().catch(()=>{}).finally(()=>setTimeout(()=>{io=!1},3e3)))}async function Vf(p){const g=Pn(),b=i.get(p);if(!(!g||!b||W)){W=!0;try{if(!sd(s,p))return ee(`You've already stabbed ${b.name} today.`,"warn");g.dir=zi(kt(g),kt(b)),g.emote=void 0,Pe(G(q,`rooms/${t}/players/${s.uid}`),{dir:g.dir}).catch(console.warn);try{await Cn(G(q,`rooms/${t}/events`),{type:"stab",from:s.uid,to:p,ts:dt()})}catch{return ee("Your stab missed. They may have just left.","warn")}try{await Vw(s,p),e.refreshHeader(),Be.refresh(),Te(s,"stab",`stabbed ${b.name} (+1)`),ee(`You stab ${b.name}. It does them no harm, and a drop of blood trickles into your pouch. (+1)`)}catch{ee("The drop of blood slips through your fingers… (the hotel refused it)","warn")}}finally{W=!1}}}let ro=!1;async function zf(){if(!ro){if(Ws(s.inventory,"syringe")<0)return ee("You don't have a syringe.","warn");if(!ef(s)){const p=Math.max(1,Math.ceil(ia()/6e4));return ee(`You've already drawn your blood today. Your arm needs ${p>=60?`${Math.floor(p/60)}h ${p%60}m`:`${p}m`} to recover.`,"warn")}ro=!0;try{const p=Pn();p&&(p.path=[],p.emote=void 0);try{await Cn(G(q,`rooms/${t}/events`),{type:"syringe",from:s.uid,to:s.uid,ts:dt()})}catch{}try{await zw(s),e.refreshHeader(),Be.refresh(),Te(s,"syringe",`drew blood with the syringe (+${ni})`),ee(`You slide the needle in and draw some blood. It fills the barrel nicely. (+${ni})`)}catch{ee("The needle slips and the blood goes to waste… (the hotel refused it)","warn")}}finally{ro=!1}}}function Gf(){const p={x:d.doorX,y:1},g=(T,$)=>[...i.values()].some(I=>{const J=kt(I);return J.x===T&&J.y===$}),b=[];for(let T=0;T<d.h;T++)for(let $=0;$<d.w;$++)R($,T)&&!g($,T)&&b.push({x:$,y:T});b.sort((T,$)=>Math.hypot(T.x-p.x,T.y-p.y)-Math.hypot($.x-p.x,$.y-p.y));const C=b.slice(0,4);return C[Math.floor(Math.random()*C.length)]??{x:0,y:0}}const oo=G(q,`rooms/${t}/players`),Ls=G(q,`rooms/${t}/players/${s.uid}`),Ul=G(q,`rooms/${t}/chat`),qf=G(q,`rooms/${t}/events`),Bl=Ct();function Mn(p){o||(le(p,"err"),e.navigate("room",{roomId:pt}))}function ao(){K.replaceChildren(a("strong",{},`In room (${i.size})`),...[...i.values()].map(p=>a("div",{class:p.uid===s.uid?"me":""},p.name)))}function Wl(){if(l||o)return;l=!0;const p=Gf();i.set(s.uid,Al(s.uid,{name:s.name,figure:s.figure,x:p.x,y:p.y,dir:2})),mn(Ls).remove(),rt(Ls,{name:s.name,figure:s.figure,x:p.x,y:p.y,dir:2,ts:dt()}).catch(()=>Mn("You can't be in that room.")),hd(s,t);const g=()=>Mn("You don't have access to that room.");r.push(ti(oo,b=>{if(b.key===s.uid)return;const C=b.val();i.set(b.key,Al(b.key,C)),At({figure:C.figure,dir:2}),ao()},g),rw(oo,b=>{if(b.key===s.uid)return;const C=b.val(),T=i.get(b.key);if(!T)return;T.name=C.name,T.figure=C.figure,(C.x!==T.dest.x||C.y!==T.dest.y)&&Rl(T,{x:C.x,y:C.y});const $=C.emote;if($&&typeof $.ts=="number"&&$.ts!==T.lastEmoteTs){T.lastEmoteTs=$.ts;const I=zs[$.id];I&&(T.path=[],Nl(T,I))}}),ow(oo,b=>{i.delete(b.key),(m==null?void 0:m.uid)===b.key&&(m=null,re()),ao()}),ti(yi(Ul,gi("ts"),mi(40)),b=>{var I;const C=b.val();if(!C)return;for(Y.append(a("div",{class:"line"},a("b",{class:C.uid===s.uid?"me":""},C.name+": "),C.text));Y.children.length>60;)(I=Y.firstElementChild)==null||I.remove();Y.scrollTop=Y.scrollHeight;const T=i.get(C.uid),$=typeof C.ts=="number"?C.ts>Bl-15e3:!0;T&&$&&(T.bubble={text:C.text,until:performance.now()+q0})},()=>{}),ti(yi(qf,gi("ts"),mi(10)),b=>{var T;const C=b.val();if(!(!C||typeof C.ts!="number"||C.ts<Bl-3e3)){if(C.type==="syringe"){P.push({uid:C.from,start:performance.now(),burst:!1});return}C.type==="stab"&&(S.push({from:C.from,to:C.to,start:performance.now(),impact:!1,dropped:!1}),C.to===s.uid&&C.from!==s.uid&&ee(`${((T=i.get(C.from))==null?void 0:T.name)??"Someone"} stabs you with a knife. It doesn't hurt a bit.`))}},()=>{})),t===pt&&r.push(a0(Hf)),ao()}function Kf(){const p=j.value.trim().slice(0,md);if(p){if(j.value="",p.startsWith("/")){const g=p.slice(1).toLowerCase();return zs[g]?Ol(g):ee(`Unknown command. Emotes: ${Object.keys(zs).map(b=>"/"+b).join(" ")}`,"warn")}Cn(Ul,{uid:s.uid,name:s.name,text:p,ts:dt()}).catch(console.warn)}}function Yf(p,g){var se;const b=Fi(p,g),C=!!p.bubble&&p.bubble.until>g;p.emote&&p.emote.def.ms>0&&g-p.emote.start>p.emote.def.ms&&(p.emote=void 0);const T=b?void 0:p.emote,$=T?g-T.start:0;let I=p.dir,J=0;(T==null?void 0:T.def.motion)==="spin"&&(I=ld[Math.floor($/140)%8]),(T==null?void 0:T.def.motion)==="dance"&&(I=ld[Math.floor($/420)%8],J=-Math.abs(Math.sin($/120))*6),(T==null?void 0:T.def.motion)==="bounce"&&(J=-Math.abs(Math.sin($/110))*7),(T==null?void 0:T.def.motion)==="hop"&&(J=-Math.abs(Math.sin($/T.def.ms*Math.PI*2))*16);const te=b?["wlk"]:(T==null?void 0:T.def.actions)??["std"],ue=C?"spk":(T==null?void 0:T.def.gesture)??"std",_e=b?Math.floor((g-p.stepStart)/(Hs/4))%4:C?Math.floor(g/140)%2:(se=T==null?void 0:T.def.actions)!=null&&se.includes("wav")?Math.floor(g/250)%2:0;return{opts:{figure:p.figure,dir:I,headDir:I,actions:te,gesture:ue,frame:_e},yOff:J}}function Qf(p,g){const b=Ue[p.kind],{A:C,B:T,C:$,D:I,gd:J,fill:te}=pf(v,p.kind,p.x,p.y,we,D);if(p.kind==="arcade"){const se=(Re,Ee)=>({x:I.x+($.x-I.x)*Re,y:I.y+($.y-I.y)*Re+b.height*D*Ee}),pe=(Re,Ee,Ve,an,Wi)=>te([se(Re,Ee),se(Ve,Ee),se(Ve,an),se(Re,an)],Wi);pe(.06,.03,.94,.13,`hsl(${g/12%360},90%,60%)`),pe(.14,.18,.86,.52,"#06101a");const et=.55+.25*Math.sin(g/130)+.1*Math.sin(g/47);pe(.2,.22,.8,.48,`rgba(60,255,150,${et.toFixed(2)})`),pe(.2,.56,.8,.64,"#1b2150"),v.fillStyle="#e23b3b";const Je=se(.34,.6);v.beginPath(),v.arc(Je.x,Je.y,3*D,0,Math.PI*2),v.fill(),v.fillStyle="#3b7de2";const He=se(.64,.6);v.beginPath(),v.arc(He.x,He.y,3*D,0,Math.PI*2),v.fill()}else if(p.kind==="lamp"){const se={x:(C.x+$.x)/2,y:(C.y+$.y)/2},pe=v.createRadialGradient(se.x,se.y,2,se.x,se.y,34*D);pe.addColorStop(0,"rgba(255,240,170,0.55)"),pe.addColorStop(1,"rgba(255,240,170,0)"),v.fillStyle=pe,v.fillRect(se.x-40*D,se.y-40*D,80*D,80*D)}else if(p.kind==="cdplayer"){const se=Ui(),pe={x:(C.x+$.x)/2,y:(C.y+$.y)/2},et=17*D,Je=8.5*D;if(v.fillStyle="#1a1d27",v.beginPath(),v.ellipse(pe.x,pe.y,et*1.08,Je*1.08,0,0,Math.PI*2),v.fill(),v.fillStyle=se?"#cfd8ee":"#8d97ab",v.beginPath(),v.ellipse(pe.x,pe.y,et,Je,0,0,Math.PI*2),v.fill(),se){const Ee=g/260%(Math.PI*2);v.lineWidth=2*D,v.strokeStyle="rgba(255,255,255,0.9)",v.beginPath(),v.ellipse(pe.x,pe.y,et*.8,Je*.8,0,Ee,Ee+1),v.stroke(),v.strokeStyle="rgba(124,92,255,0.8)",v.beginPath(),v.ellipse(pe.x,pe.y,et*.55,Je*.55,0,Ee+3.1,Ee+4),v.stroke()}v.fillStyle="#10131b",v.beginPath(),v.ellipse(pe.x,pe.y,et*.2,Je*.2,0,0,Math.PI*2),v.fill();const He=(Ee,Ve)=>({x:I.x+($.x-I.x)*Ee,y:I.y+($.y-I.y)*Ee+b.height*D*Ve});v.fillStyle="#0e1118";for(const Ee of[.28,.72]){const Ve=He(Ee,.5);v.beginPath(),v.ellipse(Ve.x,Ve.y,5*D,6.5*D,0,0,Math.PI*2),v.fill()}const Re=He(.5,.22);v.fillStyle=se?Math.floor(g/400)%2?"#52e07a":"#2f9c4b":"#5a2a2a",v.beginPath(),v.arc(Re.x,Re.y,2.2*D,0,Math.PI*2),v.fill()}const ue=[C.x,T.x,$.x,I.x],_e=[C.y,T.y,$.y,I.y,J($).y,J(I).y,J(T).y];return{id:"",x0:Math.min(...ue),x1:Math.max(...ue),y0:Math.min(..._e),y1:Math.max(..._e),depth:p.x+b.w+p.y+b.h-1}}function Jf(p,g,b,C,T){const $=`${Math.round(12*Math.max(1,D))}px Verdana, sans-serif`;v.font=$;const I=190*Math.max(1,D),J=p.split(" "),te=[];let ue="";for(const Ee of J){const Ve=ue?ue+" "+Ee:Ee;v.measureText(Ve).width>I&&ue?(te.push(ue),ue=Ee):ue=Ve}ue&&te.push(ue),v.font=`bold ${$}`;const _e=v.measureText(g+": ").width;v.font=$;const se=15*Math.max(1,D),pe=Math.max(...te.map(Ee=>v.measureText(Ee).width))+18,et=Math.max(pe,_e+18),Je=te.length*se+se+8,He=b-et/2,Re=C-Je-8;v.save(),v.globalAlpha=T,v.fillStyle="#fff",v.strokeStyle="rgba(0,0,0,0.35)",v.lineWidth=1,v.beginPath(),v.roundRect(He,Re,et,Je,8),v.fill(),v.stroke(),v.beginPath(),v.moveTo(b-5,Re+Je),v.lineTo(b,Re+Je+7),v.lineTo(b+5,Re+Je),v.fill(),v.fillStyle="#111",v.textBaseline="top",v.font=`bold ${$}`,v.fillText(g,He+9,Re+5),v.font=$,te.forEach((Ee,Ve)=>v.fillText(Ee,He+9,Re+5+se*(Ve+1))),v.restore()}function Xf(p,g){const b=document.createElement("canvas");b.width=p.width,b.height=p.height;const C=b.getContext("2d");return C.drawImage(p,0,0),C.globalCompositeOperation="source-atop",C.fillStyle=`rgba(190,20,20,${g})`,C.fillRect(0,0,b.width,b.height),b}const Zf=p=>p<.3?p/.3:p<.5?1:Math.max(0,1-(p-.5)/.4),ep=p=>p<.3?0:p<.9?Math.max(0,.65-(p-.3)*1):0;function tp(p){const g=C=>{const T=Vt(C,p);return{x:T.x,y:T.y-46*D}};for(const C of S){const T=i.get(C.from),$=i.get(C.to);if(!T||!$)continue;const I=(p-C.start)/xo,J=g(T),te=g($);if(I>=.12&&I<.5){const ue=Math.min(1,(I-.12)/.3),_e=J.x+(te.x-J.x)*(.4+.6*ue),se=J.y+(te.y-J.y)*(.4+.6*ue);v.save(),v.translate(_e,se),v.rotate(Math.atan2(te.y-J.y,te.x-J.x)+Math.PI*.25),v.imageSmoothingEnabled=!1;const pe=26*Math.max(1,D);v.drawImage(K0,-pe/2,-pe/2,pe,pe),v.restore()}if(I>=.3&&I<1.15){const ue=Math.min(1,(I-.3)/.5)*14*D,_e=te.x,se=te.y-34*D-ue,pe=11*Math.max(1,D);v.save(),v.globalAlpha=I>.95?Math.max(0,(1.15-I)/.2):1,v.beginPath(),v.arc(_e,se,pe,0,Math.PI*2),v.fillStyle="#2f67a8",v.fill(),v.lineWidth=2,v.strokeStyle="#0b2a52",v.stroke(),v.fillStyle="#fff",v.font=`bold ${Math.round(13*Math.max(1,D))}px Verdana, sans-serif`,v.textAlign="center",v.textBaseline="middle",v.fillText("0",_e,se+1),v.restore()}}for(const C of P){const T=i.get(C.uid);if(!T)continue;const $=(p-C.start)/900;if($>.85)continue;const I=g(T),J=$<.4?$/.4:1;v.save(),v.translate(I.x-(22-8*J)*D,I.y+(-6+6*J)*D),v.rotate(Math.PI*.25),v.imageSmoothingEnabled=!1;const te=28*Math.max(1,D);v.drawImage(Q0,-te/2,-te/2,te,te),v.restore()}for(const C of L){const T=i.get(C.from),$=i.get(C.to);if(!T||!$)continue;const I=Math.min(1,(p-C.start)/gd),J=g($),te={x:Vt(T,p).x,y:Vt(T,p).y-60*D},ue={x:(J.x+te.x)/2,y:Math.min(J.y,te.y)-50*D},_e=(1-I)*(1-I)*J.x+2*(1-I)*I*ue.x+I*I*te.x,se=(1-I)*(1-I)*J.y+2*(1-I)*I*ue.y+I*I*te.y;v.imageSmoothingEnabled=!1;const pe=18*Math.max(1,D)*(1-.35*I);v.drawImage(Y0,_e-pe/2,se-pe/2,pe,pe)}for(const C of X){const T=p-C.born,$=C.x+C.vx*T,I=C.y+C.vy*T+.0014*T*T;v.globalAlpha=Math.max(0,1-T/C.life),v.fillStyle="#b01616";const J=3*Math.max(1,D);v.fillRect($,I,J,J)}v.globalAlpha=1;const b=d.furni.find(C=>C.kind==="cdplayer");if(b&&On.length){const C=Ue.cdplayer,T=we(bt(b.x+.5,b.y+.5));v.textAlign="center",v.textBaseline="middle",v.lineWidth=3,v.strokeStyle="rgba(0,0,0,0.65)";for(const $ of On){const I=p-$.born,J=I/$.life,te=T.x+($.ox+Math.sin(I/240+$.phase)*9)*D,ue=T.y-(C.height+8)*D-I*.045*D;v.globalAlpha=J<.15?J/.15:Math.max(0,1-(J-.55)/.45),v.font=`bold ${Math.round((18+6*Math.sin($.phase))*Math.max(1,D))}px "Segoe UI Symbol", "Apple Symbols", sans-serif`,v.strokeText($.glyph,te,ue),v.fillStyle=$.color,v.fillText($.glyph,te,ue)}v.globalAlpha=1}v.textAlign="center",v.textBaseline="middle",v.font=`${Math.round(20*Math.max(1,D))}px "Segoe UI Emoji", "Apple Color Emoji", sans-serif`;for(const C of B){const T=i.get(C.uid);if(!T)continue;const $=p-C.born,I=Vt(T,p);v.globalAlpha=Math.max(0,1-$/C.life),v.fillText(C.glyph,I.x+C.ox*D,I.y-(Gi+6)*D-$*.035*D)}v.globalAlpha=1;for(const C of O){const T=p-C.born;v.globalAlpha=Math.max(0,1-T/1100),v.font=`bold ${Math.round(16*Math.max(1,D))}px Verdana, sans-serif`,v.textAlign="center",v.textBaseline="middle",v.lineWidth=3,v.strokeStyle="#000",v.strokeText(C.text,C.x,C.y-T*.04),v.fillStyle=C.color,v.fillText(C.text,C.x,C.y-T*.04)}v.globalAlpha=1,v.textAlign="start"}function np(p){for(let g=S.length-1;g>=0;g--){const b=S[g],C=(p-b.start)/xo,T=i.get(b.to);if(!b.impact&&C>=.3&&(b.impact=!0,T)){const $=Vt(T,p);for(let I=0;I<9;I++){const J=-Math.PI/2+(Math.random()-.5)*2.2,te=.05+Math.random()*.09;X.push({x:$.x,y:$.y-46*D,vx:Math.cos(J)*te,vy:Math.sin(J)*te,born:p,life:650+Math.random()*250})}}!b.dropped&&C>=.5&&(b.dropped=!0,L.push({from:b.from,to:b.to,start:p})),C>1.3&&S.splice(g,1)}for(let g=L.length-1;g>=0;g--){const b=L[g];if(p-b.start>=gd){const C=i.get(b.from);if(C&&b.from===s.uid){const T=Vt(C,p);O.push({text:"+1",x:T.x,y:T.y-70*D,born:p,color:"#ff5252"})}L.splice(g,1)}}if(Ui()&&p-Ll>360){Ll=p;const g=["♪","♫","♬","♩"],b=["#ffd54a","#ff7fbf","#7fe3ff","#9dff8a"];On.push({born:p,life:2200,glyph:g[Math.floor(Math.random()*4)],ox:(Math.random()-.5)*22,phase:Math.random()*6,color:b[Math.floor(Math.random()*4)]})}for(let g=On.length-1;g>=0;g--)p-On[g].born>On[g].life&&On.splice(g,1);for(let g=P.length-1;g>=0;g--){const b=P[g],C=(p-b.start)/900,T=i.get(b.uid);if(!b.burst&&C>=.45&&(b.burst=!0,T)){const $=Vt(T,p);for(let I=0;I<7;I++){const J=-Math.PI/2+(Math.random()-.5)*1.6,te=.04+Math.random()*.06;X.push({x:$.x-8*D,y:$.y-44*D,vx:Math.cos(J)*te,vy:Math.sin(J)*te,born:p,life:600+Math.random()*250})}b.uid===s.uid&&O.push({text:`+${ni}`,x:$.x,y:$.y-70*D,born:p,color:"#ff5252"})}(C>1.2||!T)&&P.splice(g,1)}for(const g of i.values()){const b=g.emote;b!=null&&b.def.fx&&p-b.lastFx>420&&!Fi(g,p)&&(b.lastFx=p,B.push({uid:g.uid,glyph:b.def.fx[Math.floor(Math.random()*b.def.fx.length)],born:p,life:1500,ox:(Math.random()-.5)*30}))}for(let g=B.length-1;g>=0;g--)p-B[g].born>B[g].life&&B.splice(g,1);for(let g=X.length-1;g>=0;g--)p-X[g].born>X[g].life&&X.splice(g,1);for(let g=O.length-1;g>=0;g--)p-O[g].born>1100&&O.splice(g,1)}function sp(){if(!k||k==="pickup"||!u||!F())return;const p=Ue[k];if(p)for(let g=0;g<p.w;g++)for(let b=0;b<p.h;b++){const C=u.x+g,T=u.y+b,$=R(C,T),I=we(bt(C,T));v.beginPath(),v.moveTo(I.x,I.y),v.lineTo(I.x+mt/2*D,I.y+ct/2*D),v.lineTo(I.x,I.y+ct*D),v.lineTo(I.x-mt/2*D,I.y+ct/2*D),v.closePath(),v.fillStyle=$?"rgba(80,220,120,0.45)":"rgba(230,70,70,0.45)",v.fill()}}let lo=0;function Hl(){if(o||(lo=requestAnimationFrame(Hl),!c))return;const p=performance.now(),g=window.devicePixelRatio||1;if(v.setTransform(g,0,0,g,0,0),v.imageSmoothingEnabled=D<1,v.clearRect(0,0,V.width,V.height),v.drawImage(oe,xe-z.x*D,Ae-z.y*D,oe.width*D,oe.height*D),x=mf(v,d.doorX,we,D,U,E?1:0),!l)return;for(const I of i.values())Lf(I,p);if(Ff(p),jf(),np(p),u&&!(k&&k!=="pickup")){const I=we(bt(u.x,u.y));v.beginPath(),v.moveTo(I.x,I.y),v.lineTo(I.x+mt/2*D,I.y+ct/2*D),v.lineTo(I.x,I.y+ct*D),v.lineTo(I.x-mt/2*D,I.y+ct/2*D),v.closePath(),v.strokeStyle=k==="pickup"?"rgba(255,170,60,0.95)":"rgba(255,255,255,0.9)",v.lineWidth=2,v.stroke()}sp();const b=[],C=[],T=[],$=[];for(const I of d.furni)b.push({depth:I.x+Ue[I.kind].w+I.y+Ue[I.kind].h-1,draw:()=>{const J=Qf(I,p);J&&y0.has(I.kind)&&T.push({...J,id:I.id,kind:I.kind})}});for(const I of i.values()){const J=Pl(I,p),{opts:te,yOff:ue}=Yf(I,p);let _e=Aw(te);_e?I.last=_e:(At(te),_e=I.last);const se=Vt(I,p);let pe={x:0,y:0},et=0;for(const He of S){const Re=(p-He.start)/xo;if(!(Re>1)){if(He.from===I.uid){const Ee=i.get(He.to);if(Ee){const Ve=Vt(Ee,p),an=Ve.x-se.x,Wi=Ve.y-se.y,jl=Math.hypot(an,Wi)||1,Vl=Zf(Re)*16*D;pe={x:an/jl*Vl,y:Wi/jl*Vl}}}He.to===I.uid&&(et=Math.max(et,ep(Re)))}}const Je=ue*D;if(C.push({id:I.uid,x0:se.x-22*D,x1:se.x+22*D,y0:se.y-Gi*D,y1:se.y+8*D,depth:J.x+J.y}),b.push({depth:J.x+J.y+.5,draw:()=>{var Ee;if(v.fillStyle="rgba(0,0,0,0.18)",v.beginPath(),v.ellipse(se.x+pe.x,se.y+pe.y,16*D,7*D,0,0,Math.PI*2),v.fill(),_e){const Ve=se.x+pe.x-32*D,an=se.y+pe.y+Je-Gi*D;v.drawImage(_e,Ve,an,_e.width*D,_e.height*D),et>.02&&v.drawImage(Xf(_e,et),Ve,an,_e.width*D,_e.height*D)}const He=(m==null?void 0:m.uid)===I.uid&&I.uid!==s.uid&&((Ee=ae())==null?void 0:Ee.useOnPlayer)==="stab";v.font=`${Math.round(10*Math.max(1,D))}px Verdana, sans-serif`;const Re=v.measureText(I.name).width+10;v.fillStyle=He?"rgba(150,20,20,0.85)":"rgba(0,0,0,0.55)",v.beginPath(),v.roundRect(se.x-Re/2,se.y+7*D,Re,14*Math.max(1,D),5),v.fill(),v.fillStyle=I.uid===s.uid?"#ffe27a":"#fff",v.textBaseline="top",v.textAlign="center",v.fillText(I.name,se.x,se.y+9*D),v.textAlign="start"}}),I.bubble&&I.bubble.until>p){const He=I.bubble.until-p,Re=I.bubble;$.push(()=>Jf(Re.text,I.name,se.x,se.y-(Gi+4)*D,He<800?He/800:1))}}f=C,b.sort((I,J)=>I.depth-J.depth).forEach(I=>I.draw()),y=T,tp(p),$.forEach(I=>I())}async function ip(){if(t===pt){he(cd()),Wl();return}try{const p=await hf(t);if(o)return;if(!p)return Mn("That room doesn't exist.");if(!await P0(p,s.uid,Z.friendUids()))return Mn(`${p.ownerName}'s room is closed. Knock on the door of the public room to ask.`);if(o)return;he(da(t,p)),Wl(),r.push(T0(t,g=>{if(!g)return Mn("This room was deleted.");he(da(t,g))},()=>Mn("You can't be in that room any more.")))}catch{Mn("Couldn't open that room.")}}he(d),lo=requestAnimationFrame(Hl),ip();function rp(){o=!0,cancelAnimationFrame(lo),ot.disconnect(),window.removeEventListener("keydown",xl),r.forEach(p=>p()),$i(),_==null||_.close(),Ds(),It.stop(),ns&&window.removeEventListener("pointerdown",ns),Be.dispose(),l&&(mn(Ls).cancel(),$t(Ls)),hd(s,"")}return{dispose:rp,show(){c=!0,Be.refresh(),Qe(),e.refreshHeader()},hide(){c=!1,Ds(),qs(),_==null||_.close()},figureChanged(){const p=Pn();p&&(p.figure=s.figure,At({figure:s.figure,dir:2}),Pe(Ls,{figure:s.figure}).catch(()=>{}))}}}const gt={clothing:{},emotes:{},items:{},music:{}},X0=5,ga=new Set,yf=()=>gt.music.pass??{on:!0,price:Uw},ya=n=>gt.items[n]??{on:!1,price:X0};function Z0(n){gt.clothing=(n==null?void 0:n.clothing)??{},gt.emotes=(n==null?void 0:n.emotes)??{},gt.items=(n==null?void 0:n.items)??{},gt.music=(n==null?void 0:n.music)??{},qh(gt.clothing),m0(gt.emotes),ga.forEach(e=>e())}function eC(){let n;const e=new Promise(s=>n=s),t=tt(G(q,"config/shop"),s=>{Z0(s.exists()?s.val():null),n()},()=>n());return{ready:e,stop:t}}function tC(n){return ga.add(n),()=>ga.delete(n)}function Mt(n,e,t){return rt(G(q,`config/shop/${n}/${e}`),{on:!!t.on,price:Math.max(0,Math.min(999,Math.round(t.price)))})}function si(n,e){return $t(G(q,`config/shop/${n}/${e}`))}const _f=n=>a("span",{},a("img",{src:nn,class:"blood-ico",alt:""}),` ${n}`);function nC(n,e){let t="clothing",s=null;const i=a("div",{class:"shop-tabs"}),r=a("div",{class:"shop-content"});n.append(a("div",{class:"shop"},i,r));function o(c){t=c,s==null||s(),s=null,r.replaceChildren(),i.replaceChildren(...[["clothing","Clothing"],["emotes","Emotes"],["items","Items"],["music","Music"]].map(([h,u])=>a("button",{class:"tab big"+(t===h?" on":""),onclick:()=>o(h)},u)));const d=()=>o(t);s=t==="clothing"?af(r,e,"shop"):t==="emotes"?sC(r,e,d):t==="items"?iC(r,e,d):rC(r,e,d)}o("clothing");const l=tC(()=>{t!=="clothing"&&o(t)});return()=>{l(),s==null||s()}}function sC(n,e,t){const s=e.profile,i=Is.filter(o=>hs(o)===0),r=Is.filter(o=>o.price>0&&hs(o)>0&&(g0(o)||_i(s,o.id)));return n.append(a("div",{class:"panel"},a("h2",{},"Emotes"),a("p",{class:"muted"},`You already have: ${i.map(o=>`${o.icon} ${o.name}`).join("  ")}. Unlocked emotes show up in the Emotes tab in a room, or type /name in chat.`),r.length===0?a("p",{class:"muted"},"Nothing on sale right now. Check back soon."):null,a("div",{class:"emote-shop"},...r.map(o=>{const l=_i(s,o.id),c=hs(o),d=s.blood>=c;return a("div",{class:"emote-card"+(l?" owned":"")},a("div",{class:"emote-card-icon"},o.icon),a("div",{class:"emote-card-name"},o.name),a("div",{class:"hint"},o.desc),l?a("div",{class:"ok-text"},"✔ Owned"):a("button",{class:"btn small primary",disabled:!d,title:d?"":`You need ${c-s.blood} more drops`,onclick:async()=>{try{await ml(s,[cf(o.id)],c),e.refreshHeader(),Te(s,"buy",`bought the ${o.name} emote for ${c}`),ut("cash",.45),le(`${o.name} unlocked! Try /${o.id} in a room.`),t()}catch(h){le(h.message,"err")}}},_f(c)))})))),()=>{}}function iC(n,e,t){const s=e.profile,i=Object.values(Bt).filter(o=>ya(o.id).on),r=o=>s.inventory.filter(l=>(l==null?void 0:l.item)===o).length;return n.append(a("div",{class:"panel"},a("h2",{},"Items"),i.length===0?a("p",{class:"muted"},"No items on sale right now. Check back soon."):a("p",{class:"muted"},"Bought items go straight into your inventory."),a("div",{class:"emote-shop"},...i.map(o=>{const l=ya(o.id).price,c=s.blood>=l;return a("div",{class:"emote-card"},a("img",{src:o.icon,alt:o.name,style:{width:"48px",height:"48px",imageRendering:"pixelated"}}),a("div",{class:"emote-card-name"},o.name),a("div",{class:"hint"},o.examine),r(o.id)?a("div",{class:"hint"},`You have ${r(o.id)}`):null,a("button",{class:"btn small primary",disabled:!c,title:c?"":`You need ${l-s.blood} more drops`,onclick:async()=>{try{await jw(s,o.id,l),e.refreshHeader(),Te(s,"buy",`bought a ${o.name} for ${l}`),ut("cash",.45),le(`${o.name} added to your inventory.`),t()}catch(d){le(d.message,"err")}}},_f(l)))})))),()=>{}}function rC(n,e,t){const s=e.profile,i=yf(),r=!!s.owned[sa],o=s.blood>=i.price;return n.append(a("div",{class:"panel music-card"},a("h2",{},"Jukebox pass"),a("p",{},`Stream music while you're in 6ixPlanet. Includes ${gn.length} track${gn.length===1?"":"s"} for now; more get added over time.`),a("ul",{class:"muted"},...gn.map(l=>a("li",{},`♪ ${l.title}`))),r?a("div",{},a("p",{class:"ok-text"},"✔ You own this."),a("button",{class:"btn primary",onclick:()=>e.navigate("room")},"Go listen (Music tab in any room)")):i.on?a("div",{},a("button",{class:"btn primary",disabled:!o,onclick:async()=>{try{await ml(s,[sa],i.price),e.refreshHeader(),Te(s,"buy",`bought the jukebox pass for ${i.price}`),ut("cash",.45),le("Jukebox pass unlocked! Open the Music tab in any room."),t()}catch(l){le(l.message,"err")}}},a("img",{src:nn,class:"blood-ico",alt:""}),` Buy for ${i.price} drops`),o?null:a("p",{class:"muted"},`You have ${s.blood}. Stab people in the public room to earn drops.`)):a("p",{class:"muted"},"The jukebox pass isn't on sale right now."))),()=>{}}function oC(n,e){const t=e.profile;let s=!1;function i(c,d){At({figure:d,dir:2,headDir:2}).then(h=>{s||!h||c.getContext("2d").drawImage(h,0,0)})}function r(c){const d=a("canvas",{class:"wardrobe-canvas",width:64,height:110});return i(d,c),d}const o=a("div",{class:"panel wardrobe"});n.append(o);function l(){const c=Array.from({length:Bw},(d,h)=>{const u=t.wardrobe[h];return a("div",{class:"slot"+(u?"":" empty")},a("div",{class:"slot-title"},`Slot ${h+1}`),u?r(u.figure):a("div",{class:"slot-empty"},"empty"),a("div",{class:"row center"},a("button",{class:"btn small",onclick:async()=>{try{await Gw(t,h,{figure:t.figure,gender:t.gender}),Te(t,"outfit",`saved an outfit to slot ${h+1}`),le(`Saved current look to slot ${h+1}`),l()}catch(m){le(m.message,"err")}}},u?"Overwrite":"Save here"),u?a("button",{class:"btn small primary",onclick:async()=>{try{await Ar(t,u.figure,u.gender),Te(t,"outfit",`wore the outfit in slot ${h+1}`),e.refreshHeader(),e.lookChanged(),ut("camera",.35),le("Outfit on!"),l()}catch(m){le(m.message,"err")}}},"Wear"):null,u?a("button",{class:"btn small danger",onclick:async()=>{try{await qw(t,h),l()}catch(m){le(m.message,"err")}}},"✕"):null))});o.replaceChildren(a("h2",{},"Saved outfits"),a("div",{class:"wardrobe-current"},r(t.figure),a("div",{},a("strong",{},"Wearing now"),a("p",{class:"muted"},"Save the look you're wearing into a slot, then swap between outfits any time. New clothes are in the shop."),a("button",{class:"btn",onclick:()=>e.navigate("shop")},"Open shop"))),a("div",{class:"slots"},...c))}return l(),()=>{s=!0}}const aC=n=>new Date(n).toLocaleTimeString([],{hour:"2-digit",minute:"2-digit"});function lC(n,e){const t=e.profile;let s=!1;const i=new Map,r=a("span",{class:"badge hidden"}),o=a("button",{class:"btn friends-toggle",onclick:()=>{s=!s,f()}},"👥 Friends ",r),l=a("div",{class:"friends-panel hidden"}),c=a("div",{class:"chat-windows"}),d=a("div",{class:"invite-popups"}),h=a("div",{class:"messenger"},c,a("div",{class:"friends-col"},l,o));n.append(h,d);const u=a("input",{type:"text",placeholder:"Add friend by username",maxLength:16,class:"mini-input",autocapitalize:"none",spellcheck:!1});async function m(){const S=u.value;u.value="";try{le(await Z.sendRequest(S))}catch(P){le(P.message||"Couldn't send that request.","err")}}function f(){l.classList.toggle("hidden",!s),document.body.classList.toggle("friends-open",s);const S=[...Z.friends.values()].sort((F,V)=>Number(Z.isOnline(V.uid))-Number(Z.isOnline(F.uid))||F.name.localeCompare(V.name)),P=S.filter(F=>Z.isOnline(F.uid)).length;o.firstChild.textContent=`👥 Friends (${P}/${S.length}) `;const L=Z.badgeCount;if(r.textContent=String(L),r.classList.toggle("hidden",L===0),!s)return;const X=[...Z.knocks.values()].map(F=>a("div",{class:"frow"},a("span",{class:"knock-ico"},"✊"),a("span",{class:"fname knock-name"},`${F.name} is at your door`),a("button",{class:"btn small primary",title:"Let them in",onclick:()=>Z.answerKnock(F.uid,!0).then(()=>{Te(t,"room",`let ${F.name} into their room`),le(`${F.name} can come in until you log off.`)},()=>le("Couldn't let them in.","err"))},"Let in"),a("button",{class:"btn small",title:"Send them away",onclick:()=>void Z.answerKnock(F.uid,!1)},"✕"))),O=[...Z.requests.values()].map(F=>a("div",{class:"frow"},Pr(F.figure),a("span",{class:"fname"},F.name),a("button",{class:"btn small primary",title:"Accept",onclick:()=>Z.accept(F.uid).then(()=>{ut("friend"),le(`You and ${F.name} are friends now.`)},()=>le("Couldn't accept that.","err"))},"✓"),a("button",{class:"btn small",title:"Decline",onclick:()=>void Z.decline(F.uid)},"✕"))),B=Z.invites.map(F=>a("div",{class:"frow"},a("span",{class:"fname"},`${F.fromName} invited you to "${F.roomName}"`),a("button",{class:"btn small primary",onclick:()=>{Z.dismissInvite(F.id),e.navigate("room",{roomId:F.room})}},"Join"),a("button",{class:"btn small",onclick:()=>void Z.dismissInvite(F.id)},"✕")));l.firstChild||l.append(a("div",{class:"fp-head"},a("strong",{},"Friends"),a("button",{class:"btn small",onclick:()=>{s=!1,f()}},"Close")),a("form",{class:"row fp-add",onsubmit:F=>{F.preventDefault(),m()}},u,a("button",{class:"btn small",type:"submit"},"Add")),y),y.replaceChildren(...X.length?[a("div",{class:"fp-sec fp-knocks"},a("div",{class:"fp-label"},`Room requests (${X.length})`),...X)]:[],...B.length?[a("div",{class:"fp-sec"},a("div",{class:"fp-label"},"Room invites"),...B)]:[],...O.length?[a("div",{class:"fp-sec"},a("div",{class:"fp-label"},`Friend requests (${O.length})`),...O)]:[],a("div",{class:"fp-list"},...S.length===0?[a("div",{class:"hint pad"},"No friends yet. Add someone by username, or right-click (long-press) a player in a room.")]:S.map(F=>w(F))))}const y=a("div",{class:"fp-dyn"});function w(S){const P=Z.isOnline(S.uid),L=Z.roomOf(S.uid),X=Z.unread.get(S.uid)??0,O=L===pt?"In the public room":L?"In a room":P?"Online":"Offline";return a("div",{class:"frow"},Pr(S.figure),a("span",{class:"dot "+(P?"on":"")}),a("span",{class:"fname",title:O,onclick:()=>E(S.uid)},S.name,a("span",{class:"fwhere"},O)),X?a("span",{class:"badge"},String(X)):null,a("button",{class:"btn small",title:"Message",onclick:()=>E(S.uid)},"💬"),L?a("button",{class:"btn small",title:L===pt?"Go to the public room":"Follow into their room",onclick:()=>{s=!1,f(),e.navigate("room",{roomId:L})}},"➜"):null,a("button",{class:"btn small",title:"Remove friend",onclick:()=>{confirm(`Remove ${S.name} from your friends?`)&&Z.removeFriend(S.uid).then(()=>x(S.uid))}},"✕"))}function E(S){const P=Z.friends.get(S);if(!P)return;Z.openChat.add(S),Z.markRead(S),s=!1,f();const L=i.get(S);if(L){L.el.classList.remove("min"),L.render();return}const X=a("div",{class:"cw-log"}),O=a("input",{type:"text",maxLength:200,placeholder:`Message ${P.name}…`,class:"cw-input",autocomplete:"off"}),B=a("span",{class:"dot"}),F=a("div",{class:"cw-head",onclick:()=>V.classList.toggle("min")},B,a("strong",{},P.name),a("button",{class:"btn small",onclick:K=>{K.stopPropagation(),x(S)}},"✕")),V=a("div",{class:"chat-window"},F,X,a("form",{class:"cw-form",onsubmit:K=>{K.preventDefault();const Q=O.value.trim();Q&&(O.value="",Z.sendDm(S,Q).then(()=>ut("sent",.3),()=>le("That message didn't go through.","err")))}},O)),Y=()=>{B.className="dot "+(Z.isOnline(S)?"on":"");const K=Z.dms.get(S)??[];X.replaceChildren(...K.length===0?[a("div",{class:"hint pad"},"Say hi!")]:K.map(Q=>a("div",{class:"cw-msg"+(Q.from===t.uid?" mine":"")},a("div",{class:"cw-bubble"},Q.text),a("div",{class:"cw-time"},aC(Q.ts))))),X.scrollTop=X.scrollHeight};i.set(S,{el:V,log:X,render:Y}),c.append(V),Y(),O.focus()}function x(S){const P=i.get(S);P&&(P.el.remove(),i.delete(S)),Z.openChat.delete(S)}const _=S=>E(S.detail);window.addEventListener("open-chat",_);const U=()=>{s=!s,f()};window.addEventListener("toggle-friends",U);const M=Z.subscribe(()=>{f();for(const[S,P]of i)Z.friends.has(S)?(Z.markRead(S),P.render()):x(S)}),A=Z.onDm((S,P)=>{if(P.from===t.uid||i.has(S))return;const L=Z.friends.get(S);if(!L)return;ut("message",.4);const X=a("div",{class:"toast ok show msg-toast",onclick:()=>{E(S),X.remove()}},`💬 ${L.name}: ${P.text.slice(0,60)}`);document.body.append(X),setTimeout(()=>X.remove(),5e3)}),W=Z.onInvite(S=>{ut("knock",.4);const P=a("div",{class:"invite-card"},a("div",{},a("strong",{},S.fromName)," invited you to ",a("strong",{},`"${S.roomName}"`)),a("div",{class:"row"},a("button",{class:"btn small primary",onclick:()=>{Z.dismissInvite(S.id),P.remove(),e.navigate("room",{roomId:S.room})}},"Join"),a("button",{class:"btn small",onclick:()=>{Z.dismissInvite(S.id),P.remove()}},"Later")));d.append(P),setTimeout(()=>P.remove(),2e4)}),k=Z.onKnock(S=>{ut("knock",.5);const P=a("div",{class:"invite-card knock-card"},a("div",{},"✊ ",a("strong",{},S.name)," is knocking on your door."),a("div",{class:"row"},a("button",{class:"btn small primary",onclick:()=>{P.remove(),Z.answerKnock(S.uid,!0).then(()=>{Te(t,"room",`let ${S.name} into their room`),le(`${S.name} can come in until you log off.`)},()=>le("Couldn't let them in.","err"))}},"Let in"),a("button",{class:"btn small",onclick:()=>{P.remove(),Z.answerKnock(S.uid,!1)}},"Send away"),a("button",{class:"btn small",onclick:()=>P.remove()},"Later")));d.append(P),setTimeout(()=>P.remove(),25e3)});return f(),()=>{M(),A(),W(),k(),document.body.classList.remove("friends-open"),window.removeEventListener("open-chat",_),window.removeEventListener("toggle-friends",U),h.remove(),d.remove()}}const cC=(()=>{const n=new Uint32Array(256);for(let e=0;e<256;e++){let t=e;for(let s=0;s<8;s++)t=t&1?3988292384^t>>>1:t>>>1;n[e]=t>>>0}return n})();function dC(n){let e=4294967295;for(let t=0;t<n.length;t++)e=cC[(e^n[t])&255]^e>>>8;return(e^4294967295)>>>0}const vi=n=>new TextEncoder().encode(n);function vf(n){const e=[],t=[];let s=0;const i=new Date,r=i.getHours()<<11|i.getMinutes()<<5|i.getSeconds()>>1,o=i.getFullYear()-1980<<9|i.getMonth()+1<<5|i.getDate();for(const d of n){const h=vi(d.path),u=dC(d.data),m=new DataView(new ArrayBuffer(30));m.setUint32(0,67324752,!0),m.setUint16(4,20,!0),m.setUint16(6,2048,!0),m.setUint16(8,0,!0),m.setUint16(10,r,!0),m.setUint16(12,o,!0),m.setUint32(14,u,!0),m.setUint32(18,d.data.length,!0),m.setUint32(22,d.data.length,!0),m.setUint16(26,h.length,!0),m.setUint16(28,0,!0),e.push(new Uint8Array(m.buffer),h,d.data);const f=new DataView(new ArrayBuffer(46));f.setUint32(0,33639248,!0),f.setUint16(4,20,!0),f.setUint16(6,20,!0),f.setUint16(8,2048,!0),f.setUint16(10,0,!0),f.setUint16(12,r,!0),f.setUint16(14,o,!0),f.setUint32(16,u,!0),f.setUint32(20,d.data.length,!0),f.setUint32(24,d.data.length,!0),f.setUint16(28,h.length,!0),f.setUint32(42,s,!0),t.push(new Uint8Array(f.buffer),h),s+=30+h.length+d.data.length}const l=t.reduce((d,h)=>d+h.length,0),c=new DataView(new ArrayBuffer(22));return c.setUint32(0,101010256,!0),c.setUint16(8,n.length,!0),c.setUint16(10,n.length,!0),c.setUint32(12,l,!0),c.setUint32(16,s,!0),new Blob([...e,...t,new Uint8Array(c.buffer)],{type:"application/zip"})}function bf(n,e){const t=URL.createObjectURL(n),s=document.createElement("a");s.href=t,s.download=e,document.body.append(s),s.click(),s.remove(),setTimeout(()=>URL.revokeObjectURL(t),1e4)}function wf(n){var i,r,o;const e=Me.figuredata,t=(o=(r=(i=e==null?void 0:e.settype)==null?void 0:i[n.type])==null?void 0:r.set)==null?void 0:o[n.id];if(!t)return null;const s=(t.part??[]).map(l=>{var c,d;return{type:l.type,id:l.id,index:l.index,colorable:!!l.colorable,colorindex:l.colorindex??0,lib:((d=(c=Me.figuremap)==null?void 0:c[l.type])==null?void 0:d[l.id])??null}});return{...n,gender:t.gender,club:t.club??0,selectable:!!t.selectable,colorable:!!t.colorable,colors:Math.max(0,...s.map(l=>l.colorindex)),hidden:Array.isArray(t.hidden)?t.hidden:[],parts:s}}function Cf(n){var t,s,i;const e=((i=(s=(t=Me.figuredata)==null?void 0:t.settype)==null?void 0:s[n])==null?void 0:i.set)??{};return Object.keys(e).map(r=>wf({type:n,id:r})).filter(r=>!!r).sort((r,o)=>Number(r.id)-Number(o.id))}function _a(n){const e=jn(Hn[n.gender==="F"?"F":"M"]),t=ks(n.type);return e[n.type]={id:n.id,colors:Array.from({length:n.colors},(s,i)=>{var r;return((r=t[Math.min(i*3,t.length-1)])==null?void 0:r.id)??"1"})},Bn(e)}const uC=async n=>{const e=n.toDataURL("image/png"),t=atob(e.slice(e.indexOf(",")+1)),s=new Uint8Array(t.length);for(let i=0;i<t.length;i++)s[i]=t.charCodeAt(i);return s},hC=n=>new Promise((e,t)=>{const s=URL.createObjectURL(n),i=new Image;i.onload=()=>{URL.revokeObjectURL(s),e(i)},i.onerror=()=>{URL.revokeObjectURL(s),t(new Error("couldn't decode an atlas"))},i.src=s});async function fC(n){const e=[];for(const t of n){const s=await fetch(t.url);if(!s.ok)continue;const i=await s.text();e.push({path:`items/${t.name}.svg`,data:vi(i)});const r=new Blob([i],{type:"image/svg+xml"}),o=await hC(r),l=document.createElement("canvas");l.width=l.height=256;const c=l.getContext("2d");c.imageSmoothingEnabled=!1,c.drawImage(o,0,0,256,256),e.push({path:`items/${t.name}_256.png`,data:await uC(l)})}return e.push({path:"README.txt",data:vi(`Item icons as SVG (editable, 16x16 pixel grid) and as 256px PNG previews.
`)}),vf(e)}function pC(n,e){let t="clothing",s=null;const i=a("div",{class:"tabs"}),r=a("div",{});n.append(i,r);const o=f=>Te(e.profile,"admin",f),l=()=>le("Couldn't save (are you still signed in as admin?)","err"),c=(f,y,w=!1)=>{const E=a("input",{type:"number",min:0,max:999,value:String(f),disabled:w,onchange:()=>y(Math.max(0,Math.min(999,Number(E.value)||0)))});return E};function d(f){s==null||s(),t=f,i.replaceChildren(...[["clothing","Clothing"],["emotes","Emotes"],["items","Items & music"]].map(([y,w])=>a("button",{class:"tab"+(y===t?" on":""),onclick:()=>d(y)},w))),r.replaceChildren(),s=(t==="clothing"?h:t==="emotes"?u:m)(r)}function h(f){let y="ch",w="",E="",x="",_=0;const U=24,M=new Set,A=(j,ie)=>{var fe;return(fe=Mw()[j])==null?void 0:fe.find(v=>v.id===ie)},W=a("select",{onchange:()=>{y=W.value,_=0,Q()}},...yt.map(j=>a("option",{value:j.id},j.label)));W.value=y;const k=a("select",{onchange:()=>{w=k.value,_=0,Q()}},a("option",{value:""},"Any gender"),a("option",{value:"M"},"Boys"),a("option",{value:"F"},"Girls"),a("option",{value:"U"},"Unisex")),S=a("select",{onchange:()=>{E=S.value,_=0,Q()}},...[["","All items"],["shop","In the shop"],["noshop","Not in the shop"],["free","Free (everyone owns)"],["club","Club only"]].map(([j,ie])=>a("option",{value:j},ie))),P=a("input",{class:"mini-input",placeholder:"Find by id…",oninput:()=>{x=P.value.trim(),_=0,Q()}}),L=a("div",{class:"admin-bar"}),X=a("div",{class:"apanel-grid"}),O=a("div",{class:"row center",style:{margin:"10px 0"}});function B(j){const ie=A(j.type,j.id);return ie?ie.starter||ie.price===0?"free":ie.shopOn?"shop":"noshop":"club"}const F=()=>Cf(y).filter(j=>(!w||j.gender===w)&&(!E||B(j)===E)&&(!x||j.id.includes(x)));async function V(j,ie){const fe=[...M].map(v=>({type:v.split(":")[0],id:v.split(":")[1]})).filter(v=>{const ee=A(v.type,v.id);return ee&&!ee.starter});if(!fe.length)return le("None of the ticked items can be sold (club or free items can't).","err");try{await Promise.all(fe.map(v=>{const ee=`${v.type}_${v.id}`;return j==="reset"?si("clothing",ee):Mt("clothing",ee,{on:j==="on",price:ie})})),o(`${j==="reset"?"reset":j==="on"?`put in the shop at ${ie}`:"removed from the shop"}: ${fe.length} clothing items`),le(`Updated ${fe.length} item${fe.length===1?"":"s"}`),Q()}catch{l()}}const Y=a("input",{type:"number",min:0,max:999,value:"2",style:{width:"56px",padding:"4px",borderRadius:"5px",border:"1px solid #9ea5b0",textAlign:"center"}});function K(j){const ie=`${j.type}:${j.id}`,fe=A(j.type,j.id),v=B(j),ee=yt.find(re=>re.id===j.type),Be=a("div",{class:"thumb"});At({figure:_a(j),dir:2,headDir:2,headOnly:ee.headOnly}).then(re=>{if(!re||!Be.isConnected)return;const De=Qr(re);De.className="thumb-canvas",Be.replaceChildren(De)});const ne=!!fe&&!fe.starter&&v!=="club",ae=!!gt.clothing[`${j.type}_${j.id}`];return a("div",{class:"acard"+(M.has(ie)?" sel":"")},a("span",{class:"tag "+(v==="free"?"free":v==="club"?"club":v==="noshop"?"off":"")},v==="free"?fe!=null&&fe.custom?"made here":fe!=null&&fe.starter?"starter":"free":v==="club"?"club":v==="shop"?"in shop":"not sold"),Be,a("div",{},a("b",{},`${j.type}-${j.id}`)),a("div",{class:"nm"},`${j.gender==="U"?"unisex":j.gender==="F"?"girls":"boys"}${j.colors?` · ${j.colors} colour${j.colors>1?"s":""}`:""}`),a("label",{},a("input",{type:"checkbox",checked:M.has(ie),onchange:re=>{re.target.checked?M.add(ie):M.delete(ie),Q()}}),"select"),ne?a("div",{class:"row center",style:{gap:"4px"}},a("label",{},a("input",{type:"checkbox",checked:fe.shopOn,onchange:async re=>{try{await Mt("clothing",`${j.type}_${j.id}`,{on:re.target.checked,price:fe.price}),o(`${re.target.checked?"put":"removed"} ${j.type}-${j.id} ${re.target.checked?"in":"from"} the shop`),Q()}catch{l()}}}),"shop"),c(fe.price,async re=>{try{await Mt("clothing",`${j.type}_${j.id}`,{on:fe.shopOn,price:re}),o(`set ${j.type}-${j.id} to ${re} drops`),Q()}catch{l()}}),a("img",{src:nn,class:"blood-ico",alt:"drops"})):a("div",{class:"hint"},v==="club"?"club item: can't be sold":"free for everyone"),ne&&ae?a("button",{class:"btn small",onclick:async()=>{try{await si("clothing",`${j.type}_${j.id}`),Q()}catch{l()}}},"Reset"):null)}function Q(){const j=F(),ie=Math.max(1,Math.ceil(j.length/U));_>=ie&&(_=ie-1),L.replaceChildren(W,k,S,P,a("span",{class:"hint"},`${j.length} items · ${M.size} selected`)),X.replaceChildren(...j.slice(_*U,(_+1)*U).map(K)),O.replaceChildren(a("button",{class:"btn small",disabled:_===0,onclick:()=>{_--,Q()}},"‹"),a("span",{class:"hint"},`${_+1} / ${ie}`),a("button",{class:"btn small",disabled:_>=ie-1,onclick:()=>{_++,Q()}},"›"))}const ve=a("div",{class:"panel",style:{marginBottom:"10px"}},a("div",{class:"row"},a("b",{},"Ticked items:"),a("button",{class:"btn small",onclick:()=>{F().slice(_*U,(_+1)*U).forEach(j=>M.add(`${j.type}:${j.id}`)),Q()}},"Select this page"),a("button",{class:"btn small",onclick:()=>{M.clear(),Q()}},"Clear"),a("button",{class:"btn small primary",onclick:()=>void V("on",Math.max(0,Math.min(999,Number(Y.value)||0)))},"Put in shop at"),Y,a("button",{class:"btn small",onclick:()=>void V("off",0)},"Remove from shop"),a("button",{class:"btn small",onclick:()=>void V("reset",0)},"Reset to default")),a("p",{class:"hint",style:{margin:"6px 0 0"}},"Clothes you make yourself live in the Studio tab; set their price there."));return f.append(ve,L,X,O),Q(),()=>{}}function u(f){const y=Is.map(E=>{const x=E.price===0,_=gt.emotes[E.id],U=_?_.on:!0,M=hs(E);return a("tr",{},a("td",{style:{fontSize:"22px"}},E.icon),a("td",{},a("b",{},E.name)),a("td",{class:"hint"},E.desc),...x?[a("td",{colspan:"3",class:"hint"},"Always free for everyone")]:[a("td",{class:"num"},String(E.price)),a("td",{},a("label",{},a("input",{type:"checkbox",checked:U,onchange:async A=>{try{await Mt("emotes",E.id,{on:A.target.checked,price:M}),o(`${A.target.checked?"put":"removed"} the ${E.name} emote ${A.target.checked?"in":"from"} the shop`)}catch{l()}}})," on sale")),a("td",{},c(M,async A=>{try{await Mt("emotes",E.id,{on:U,price:A}),o(`set the ${E.name} emote to ${A} drops${A===0?" (free for everyone)":""}`)}catch{l()}}),_?a("button",{class:"btn small",style:{marginLeft:"6px"},onclick:async()=>{try{await si("emotes",E.id),w()}catch{l()}}},"Reset"):null)])}),w=()=>{f.replaceChildren(),u(f)};return f.append(a("p",{class:"hint"},"A price of 0 makes an emote free for everyone. Changes apply to players straight away."),a("div",{class:"scroll-box"},a("table",{class:"atable"},a("thead",{},a("tr",{},...["","Emote","What it does","Default","Shop","Price (drops)"].map(E=>a("th",{},E)))),a("tbody",{},...y)))),()=>{}}function m(f){const y=Object.values(Bt).map(x=>{const _=ya(x.id);return a("tr",{},a("td",{},a("img",{src:x.icon,alt:"",style:{width:"32px",height:"32px",imageRendering:"pixelated"}})),a("td",{},a("b",{},x.name)),a("td",{class:"hint"},x.examine),a("td",{},a("label",{},a("input",{type:"checkbox",checked:_.on,onchange:async U=>{try{await Mt("items",x.id,{on:U.target.checked,price:_.price}),o(`${U.target.checked?"put":"removed"} the ${x.name} ${U.target.checked?"in":"from"} the shop`)}catch{l()}}})," sold in shop")),a("td",{},c(_.price,async U=>{try{await Mt("items",x.id,{on:_.on,price:U}),o(`set the ${x.name} to ${U} drops`)}catch{l()}})))}),w=yf(),E=a("tr",{},a("td",{style:{fontSize:"22px"}},"♪"),a("td",{},a("b",{},"Jukebox pass")),a("td",{class:"hint"},"Unlocks the Music tab in every room"),a("td",{},a("label",{},a("input",{type:"checkbox",checked:w.on,onchange:async x=>{try{await Mt("music","pass",{on:x.target.checked,price:w.price}),o(`${x.target.checked?"put":"removed"} the jukebox pass ${x.target.checked?"in":"from"} the shop`)}catch{l()}}})," sold in shop")),a("td",{},c(w.price,async x=>{try{await Mt("music","pass",{on:w.on,price:x}),o(`set the jukebox pass to ${x} drops`)}catch{l()}})));return f.append(a("p",{class:"hint"},"Everyone starts with a knife, a CD and a syringe. Turn an item on to sell extra copies; it goes into the buyer's inventory."),a("div",{class:"scroll-box"},a("table",{class:"atable"},a("thead",{},a("tr",{},...["","Item","What it does","Shop","Price (drops)"].map(x=>a("th",{},x)))),a("tbody",{},...y,E))),a("div",{class:"row",style:{marginTop:"10px"}},a("button",{class:"btn small",onclick:async()=>{try{const x=await fC([...Object.values(Bt).map(_=>({name:_.id,url:_.icon})),{name:"blood",url:nn}]);bf(x,"6ixplanet-item-icons.zip"),o("exported the item icons")}catch(x){le(`Export failed: ${x.message}`,"err")}}},"Download item icons (.zip)"))),()=>{}}return d("clothing"),()=>s==null?void 0:s()}const mC=90001,Ef=n=>new Map([...n].map(([e,t])=>[e,{canvas:yC(t.canvas),ox:t.ox,oy:t.oy}])),Di=n=>`custom_${n}`,gC=/^(s?h)_([a-z]+)_([a-z0-9]+)_(\d+)_(\d)_(\d+)$/;function Zr(n){const e=gC.exec(n);return e?{prefix:e[1],action:e[2],type:e[3],id:e[4],dir:Number(e[5]),frame:Number(e[6])}:null}const bi=(n,e,t,s,i)=>`h_${n}_${e}_${t}_${s}_${i}`;function Cl(n){return new Promise((e,t)=>{const s=new Image;s.onload=()=>e(s),s.onerror=()=>t(new Error("couldn't decode an image")),s.src=n})}function yC(n){const e=document.createElement("canvas");return e.width=n.width,e.height=n.height,e.getContext("2d").drawImage(n,0,0),e}async function _C(n){return await Mi,Me.offsets[n]||(Me.offsets[n]={promise:Me.fetchOffsetAsync(n),data:{},atlas:{}}),await Me.offsets[n].promise,Me.offsets[n]}const Vn=new Map,wi=new Set;let Li={};const Nr=new Set,vC=n=>(Nr.add(n),()=>Nr.delete(n));function kf(n,e){const t={atlas:{frames:{},meta:{}}};for(const[s,i]of Object.entries(e))t[s]={x:i.ox,y:i.oy},t.atlas.frames[`${n}_${s}.png`]={frame:{x:i.x,y:i.y,w:i.w,h:i.h}};return t}function If(n){delete Me.offsets[Di(n)];for(const e of Object.keys(Me.chunks))e.includes(`_${n}_`)&&delete Me.chunks[e];xw()}function El(n,e){var i,r,o,l;const t=(r=(i=Me.figuredata)==null?void 0:i.settype)==null?void 0:r[n.slot];if(!t)return;const s=Di(n.id);t.set[n.id]={gender:n.gender,club:0,colorable:n.parts.some(c=>c.colorable),selectable:!0,preselectable:!1,sellable:!1,legacy:!1,part:n.parts.map(c=>({type:c.type,id:Number(n.id),colorable:c.colorable,index:c.index,colorindex:c.colorindex})),hidden:n.hidden??[]};for(const c of n.parts)(o=Me.figuremap)[l=c.type]??(o[l]={}),Me.figuremap[c.type][n.id]=s;Me.customLibs[s]=e,Vn.set(n.id,n),If(n.id)}function Sf(n){var t,s,i,r,o,l;const e=Vn.get(n);if(e){(r=(i=(s=(t=Me.figuredata)==null?void 0:t.settype)==null?void 0:s[e.slot])==null?void 0:i.set)==null||delete r[n];for(const c of e.parts)(l=(o=Me.figuremap)==null?void 0:o[c.type])==null||delete l[n]}delete Me.customLibs[Di(n)],Vn.delete(n),If(n)}const Ao=new Map;async function Tf(n){const e=await tn(G(q,`designs/sheet/${n}`));return e.exists()?e.val():null}function xf(n){const e=`${n.id}:${n.rev}`;return()=>{let t=Ao.get(e);return t||(t=(async()=>{const s=await Tf(n.id);if(!s)throw new Error(`design ${n.id} has no sheet`);return{data:kf(Di(n.id),s.frames),atlas:await Cl(s.png)}})(),Ao.set(e,t),t.catch(()=>Ao.delete(e))),t}}function kl(n,e){var i,r;if(!e||typeof e!="object"||!e.slot||!e.parts)return null;const t=(Array.isArray(e.parts)?e.parts:Object.values(e.parts)).filter(Boolean).map(o=>({type:String(o.type),index:Number(o.index??0),colorable:!!o.colorable,colorindex:Number(o.colorindex??0)})),s=e.hidden?Array.isArray(e.hidden)?e.hidden:Object.values(e.hidden):[];return{id:n,name:String(e.name??n),slot:String(e.slot),gender:e.gender==="F"?"F":e.gender==="U"?"U":"M",base:{type:String(((i=e.base)==null?void 0:i.type)??e.slot),id:String(((r=e.base)==null?void 0:r.id)??"")},parts:t,hidden:s,published:!!e.published,rev:Number(e.rev??0),updatedAt:Number(e.updatedAt??0)}}function Af(){Ow([...Vn.values()].map(n=>({slot:n.slot,id:n.id,gender:n.gender,colors:Math.max(0,...n.parts.map(e=>e.colorindex))}))),qh(gt.clothing)}function bC(n,e){Li=n;const t=new Map;for(const[s,i]of Object.entries(n)){const r=kl(s,i);!r||!r.published&&!e||t.set(s,r)}for(const s of[...Vn.keys()])!t.has(s)&&!wi.has(s)&&Sf(s);for(const[s,i]of t){if(wi.has(s))continue;const r=Vn.get(s);if(r&&r.rev===i.rev){Vn.set(s,i);continue}El(i,xf(i))}Af(),Nr.forEach(s=>s())}function wC(n){let e;const t=new Promise(i=>e=i),s=tt(G(q,"designs/meta"),i=>{bC(i.val()??{},n),e()},()=>e());return{ready:t,stop:s}}function _d(){return Object.entries(Li).map(([n,e])=>kl(n,e)).filter(n=>!!n).sort((n,e)=>Number(e.id)-Number(n.id))}function CC(){const n=[...Object.keys(Li),...wi].map(Number).filter(e=>Number.isFinite(e));return String(Math.max(mC-1,...n)+1)}const Rf=n=>{var e;return Number(((e=Li[n])==null?void 0:e.rev)??0)};async function EC(n,e,t,s){var c,d,h,u,m,f;await Mi;const i=(u=(h=(d=(c=Me.figuredata)==null?void 0:c.settype)==null?void 0:d[n])==null?void 0:h.set)==null?void 0:u[e];if(!i)throw new Error("That item doesn't exist.");const r=[],o=new Map;for(const y of i.part){r.some(x=>x.type===y.type&&x.index===y.index)||r.push({type:y.type,index:y.index??0,colorable:!!y.colorable,colorindex:y.colorindex??0});const w=(f=(m=Me.figuremap)==null?void 0:m[y.type])==null?void 0:f[y.id];if(!w)continue;const E=await _C(w);for(const x of Object.keys(E.data)){if(x==="atlas")continue;const _=Zr(x);if(!_||_.prefix!=="h"||_.type!==y.type||_.id!==String(y.id))continue;const U=E.data[x];if(!U||U.flipped)continue;const M=Vh(E.data.atlas,E.atlas,`${w}_${x}.png`);M&&o.set(bi(_.action,y.type,t,_.dir,_.frame),{canvas:M,ox:U.x,oy:U.y,edited:!1})}}if(!o.size)throw new Error("That item has no sprite frames to start from. Try another one.");return{meta:{id:t,name:s,slot:n,gender:i.gender==="F"?"F":i.gender==="U"?"U":"M",base:{type:n,id:String(e)},parts:r,hidden:Array.isArray(i.hidden)?[...i.hidden]:[],published:!1,rev:Rf(t),updatedAt:0},frames:o,reuseStanding:!0,original:Ef(o)}}async function kC(n){const e=await Tf(n.id);if(!e)throw new Error("This design's sprite sheet is missing.");const t=await Cl(e.png),s=new Map;for(const[i,r]of Object.entries(e.frames)){const o=document.createElement("canvas");o.width=r.w,o.height=r.h,o.getContext("2d").drawImage(t,r.x,r.y,r.w,r.h,0,0,r.w,r.h),s.set(i,{canvas:o,ox:r.ox,oy:r.oy,edited:!0})}return{meta:{...n,parts:n.parts.map(i=>({...i})),hidden:[...n.hidden]},frames:s,reuseStanding:!1,original:Ef(s)}}const IC=new Set(["ls","rs","lc","rc"]);function Pf(n){if(!n.reuseStanding)return n.frames;const e=new Map(n.frames);for(const[t,s]of n.frames){if(s.edited)continue;const i=Zr(t);if(!i||i.action==="std"||!(i.action==="wlk"||(i.action==="wav"||i.action==="crr"||i.action==="drk")&&!IC.has(i.type)))continue;const o=n.frames.get(bi("std",i.type,n.meta.id,i.dir,0));o!=null&&o.edited&&e.set(t,{canvas:o.canvas,ox:s.ox,oy:s.oy,edited:!0})}return e}function Nf(n){const e=[...n.entries()].filter(([,u])=>u.canvas.width>0&&u.canvas.height>0).sort((u,m)=>m[1].canvas.height-u[1].canvas.height||m[1].canvas.width-u[1].canvas.width),t=1024;let s=0,i=0,r=0,o=1;const l=[];for(const[u,m]of e){const f=m.canvas.width,y=m.canvas.height;s+f+1>t&&(i+=r+1,s=0,r=0),l.push({name:u,f:m,x:s,y:i}),s+=f+1,r=Math.max(r,y),o=Math.max(o,s)}const c=document.createElement("canvas");c.width=o,c.height=Math.max(1,i+r);const d=c.getContext("2d"),h={};for(const u of l)d.drawImage(u.f.canvas,u.x,u.y),h[u.name]={x:u.x,y:u.y,w:u.f.canvas.width,h:u.f.canvas.height,ox:Math.round(u.f.ox),oy:Math.round(u.f.oy)};return{canvas:c,frames:h}}function SC(n){const e=Nf(Pf(n)),t=kf(Di(n.meta.id),e.frames);wi.add(n.meta.id),El({...n.meta,rev:n.meta.rev+.5},()=>Promise.resolve({data:t,atlas:e.canvas}))}function TC(n){if(!wi.delete(n))return;const e=Li[n],t=e?kl(n,e):null;t?El(t,xf(t)):Sf(n),Af(),Nr.forEach(s=>s())}const vd=88e4;async function xC(n){const e=Pf(n);if(!e.size)throw new Error("This design has no frames.");const t=Nf(e),s=t.canvas.toDataURL("image/png");if(s.length>vd)throw new Error(`The sprite sheet is too big to store (${Math.round(s.length/1024)} KB, the limit is about ${Math.round(vd/1024)} KB). Use fewer or smaller frames.`);const i={...n.meta,rev:Math.floor(Rf(n.meta.id))+1,updatedAt:Date.now()};return await Pe(G(q),{[`designs/sheet/${i.id}`]:{png:s,frames:t.frames},[`designs/meta/${i.id}`]:{name:i.name,slot:i.slot,gender:i.gender,base:i.base,parts:i.parts,...i.hidden.length?{hidden:i.hidden}:{},published:i.published,rev:i.rev,updatedAt:i.updatedAt}}),n.meta.rev=i.rev,i}async function AC(n){await Pe(G(q),{[`designs/sheet/${n}`]:null,[`designs/meta/${n}`]:null})}const bd={ch:"Body",ls:"Left sleeve",rs:"Right sleeve",lg:"Legs",sh:"Shoes",hr:"Hair",hrb:"Hair (back)",ha:"Hat",he:"Head item",ea:"Glasses",fa:"Face item",cc:"Jacket",lc:"Jacket, left sleeve",rc:"Jacket, right sleeve",cp:"Print",ca:"Chest item",wa:"Belt",hd:"Head",bd:"Body skin",fc:"Face"},RC=[{dir:2,arrow:"↘",name:"Down-right (default)"},{dir:3,arrow:"↓",name:"Front"},{dir:1,arrow:"→",name:"Right"},{dir:0,arrow:"↗",name:"Up-right"},{dir:7,arrow:"↑",name:"Back"}],Ro=["#ffffff","#e6e6e6","#cccccc","#b3b3b3","#999999","#808080","#666666","#4d4d4d","#333333","#1a1a1a","#000000"],wd=["#d93636","#e8782f","#f0c43a","#5cb83a","#2fa6a0","#3a78d8","#7a4fc9","#d54f9c","#8a5a34","#f2d2b0"];function PC(n,e,t){var De;let s="pencil",i="#808080",r=8,o=!0,l=!1,c=((De=e.meta.parts[0])==null?void 0:De.type)??"",d=2,h=!1;const u=[],m=new Map,f=a("div",{class:"seg paint-layers"}),y=a("div",{class:"seg paint-dirs"}),w=a("div",{class:"paint-tools"}),E=a("div",{class:"paint-palette"}),x=a("div",{class:"hint paint-info"}),_=a("canvas",{class:"paint-canvas"}),U=a("div",{class:"paint-wrap"},_),M=a("input",{type:"color",value:i,class:"paint-color",title:"Colour",oninput:()=>P(M.value)});n.append(a("div",{class:"painter"},a("div",{class:"paint-top"},f,y),a("div",{class:"paint-body"},a("div",{class:"paint-side"},w,a("div",{class:"row"},M,E),x),U)));const A=()=>bi("std",c,e.meta.id,d,0),W=()=>e.frames.get(A()),k=()=>{var R;return!!((R=e.meta.parts.find(N=>N.type===c))!=null&&R.colorable)};function S(){const R=new Map;for(const N of e.frames.keys()){const z=Zr(N);!z||z.action!=="std"||z.frame!==0||!e.meta.parts.some(oe=>oe.type===z.type)||(R.has(z.type)||R.set(z.type,new Set),R.get(z.type).add(z.dir))}return[...R].map(([N,z])=>({type:N,dirs:[...z]}))}function P(R){i=R,M.value=R,!u.includes(R)&&!Ro.includes(R)&&!wd.includes(R)&&(u.unshift(R),u.length=Math.min(u.length,8)),L()}function L(){const R=N=>a("button",{class:"swatch"+(N.toLowerCase()===i.toLowerCase()?" on":""),style:{background:N},title:N,onclick:()=>P(N)});E.replaceChildren(...(k()?Ro:[...Ro,...wd]).map(R),...u.map(R))}function X(){var z,oe;const R=S();R.some(he=>he.type===c)||(c=((z=R[0])==null?void 0:z.type)??"");const N=((oe=R.find(he=>he.type===c))==null?void 0:oe.dirs)??[];N.includes(d)||(d=N.includes(2)?2:N[0]??2),f.replaceChildren(...R.map(he=>a("button",{class:"tab"+(he.type===c?" on":""),onclick:()=>{c=he.type,re()}},bd[he.type]??he.type))),y.replaceChildren(...RC.filter(he=>N.includes(he.dir)).map(he=>a("button",{class:"tab"+(he.dir===d?" on":""),title:he.name,onclick:()=>{d=he.dir,re()}},`${he.arrow} ${he.name.split(" (")[0]}`)))}function O(){const R=(N,z,oe)=>a("button",{class:"btn small"+(s===N?" on":""),title:oe,onclick:()=>{s=N,O()}},z);w.replaceChildren(R("pencil","✏️","Pencil"),R("eraser","🧽","Eraser"),R("fill","🪣","Fill"),R("pick","💧","Pick a colour"),R("lighten","☀","Lighten"),R("darken","◐","Darken"),a("button",{class:"btn small",title:"Undo",onclick:ve},"↶"),a("button",{class:"btn small",title:"Redo",onclick:j},"↷"),a("button",{class:"btn small"+(o?" on":""),title:"Pixel grid",onclick:()=>{o=!o,O(),V()}},"▦"),a("button",{class:"btn small"+(l?" on":""),title:"Show the original art faintly underneath",onclick:()=>{l=!l,O(),V()}},"👻"),a("button",{class:"btn small",title:"Zoom out",onclick:()=>{r=Math.max(2,r-1),F()}},"−"),a("button",{class:"btn small",title:"Zoom in",onclick:()=>{r=Math.min(20,r+1),F()}},"+"),a("button",{class:"btn small",title:"Empty this frame",onclick:()=>{const N=W();N&&(Q(),N.canvas.getContext("2d").clearRect(0,0,N.canvas.width,N.canvas.height),Y())}},"Clear"),a("button",{class:"btn small",title:"Back to the original art for this frame",onclick:B},"Reset"))}function B(){var oe;const R=W(),N=(oe=e.original)==null?void 0:oe.get(A());if(!R||!N)return;Q();const z=R.canvas.getContext("2d");R.canvas.width=N.canvas.width,R.canvas.height=N.canvas.height,z.drawImage(N.canvas,0,0),R.ox=N.ox,R.oy=N.oy,R.edited=!1,F(),t()}function F(){const R=W();if(!R){_.width=1,_.height=1,x.textContent="Nothing to paint here.";return}_.width=R.canvas.width*r,_.height=R.canvas.height*r,_.style.width=`${_.width}px`,_.style.height=`${_.height}px`,x.textContent=`${bd[c]??c} · ${R.canvas.width}×${R.canvas.height}px${k()?" · tinted by the player's colour: paint in white/grey":" · real colours"}${R.edited?" · edited":""}`,V()}function V(){var he;const R=W();if(!R)return;const N=_.getContext("2d");N.imageSmoothingEnabled=!1,N.clearRect(0,0,_.width,_.height);const z=Math.max(4,r);for(let D=0;D*z<_.height;D++)for(let xe=0;xe*z<_.width;xe++)N.fillStyle=(xe+D)%2?"#d9dee6":"#c6ccd6",N.fillRect(xe*z,D*z,z,z);const oe=(he=e.original)==null?void 0:he.get(A());if(l&&oe&&(N.globalAlpha=.35,N.drawImage(oe.canvas,0,0,oe.canvas.width*r,oe.canvas.height*r),N.globalAlpha=1),N.drawImage(R.canvas,0,0,R.canvas.width*r,R.canvas.height*r),o&&r>=5){N.strokeStyle="rgba(0,0,0,0.12)",N.lineWidth=1,N.beginPath();for(let D=0;D<=R.canvas.width;D++)N.moveTo(D*r+.5,0),N.lineTo(D*r+.5,_.height);for(let D=0;D<=R.canvas.height;D++)N.moveTo(0,D*r+.5),N.lineTo(_.width,D*r+.5);N.stroke()}}function Y(){const R=W();R&&(R.edited=!0),F(),t()}function K(){const R=W();let N=m.get(A());return(!N||N.canvas!==R.canvas)&&(N={canvas:R.canvas,undo:[],redo:[]},m.set(A(),N)),N}function Q(){const R=W();if(!R||!R.canvas.width)return;const N=K();N.undo.push(R.canvas.getContext("2d").getImageData(0,0,R.canvas.width,R.canvas.height)),N.undo.length>40&&N.undo.shift(),N.redo.length=0}function ve(){const R=W();if(!R)return;const N=K(),z=N.undo.pop();if(!z)return;const oe=R.canvas.getContext("2d");N.redo.push(oe.getImageData(0,0,R.canvas.width,R.canvas.height)),oe.putImageData(z,0,0),Y()}function j(){const R=W();if(!R)return;const N=K(),z=N.redo.pop();if(!z)return;const oe=R.canvas.getContext("2d");N.undo.push(oe.getImageData(0,0,R.canvas.width,R.canvas.height)),oe.putImageData(z,0,0),Y()}const ie=R=>({r:parseInt(R.slice(1,3),16),g:parseInt(R.slice(3,5),16),b:parseInt(R.slice(5,7),16)});function fe(R,N,z){const oe=R.canvas.width,he=R.canvas.height,D=R.canvas.getContext("2d"),xe=D.getImageData(0,0,oe,he),Ae=xe.data,Qe=(We,_t)=>(_t*oe+We)*4,ot=Qe(N,z),we=[Ae[ot],Ae[ot+1],Ae[ot+2],Ae[ot+3]],Fe=ie(i);if(we[0]===Fe.r&&we[1]===Fe.g&&we[2]===Fe.b&&we[3]===255)return;const Ze=We=>Ae[We]===we[0]&&Ae[We+1]===we[1]&&Ae[We+2]===we[2]&&Ae[We+3]===we[3],Pt=[[N,z]];for(;Pt.length;){const[We,_t]=Pt.pop();if(We<0||_t<0||We>=oe||_t>=he)continue;const jt=Qe(We,_t);Ze(jt)&&(Ae[jt]=Fe.r,Ae[jt+1]=Fe.g,Ae[jt+2]=Fe.b,Ae[jt+3]=255,Pt.push([We+1,_t],[We-1,_t],[We,_t+1],[We,_t-1]))}D.putImageData(xe,0,0)}function v(R,N,z,oe){if(N<0||z<0||N>=R.canvas.width||z>=R.canvas.height)return;const he=R.canvas.getContext("2d");if(s==="pencil")he.fillStyle=i,he.fillRect(N,z,1,1);else if(s==="eraser")he.clearRect(N,z,1,1);else if(s==="lighten"||s==="darken"){const D=z*R.canvas.width+N;if(oe.has(D))return;oe.add(D);const xe=he.getImageData(N,z,1,1);if(xe.data[3]===0)return;const Ae=s==="lighten"?1.14:.86;for(let Qe=0;Qe<3;Qe++)xe.data[Qe]=Math.max(0,Math.min(255,Math.round(xe.data[Qe]*Ae+(s==="lighten"?6:0))));he.putImageData(xe,N,z)}}let ee=null;const Be=R=>{const N=_.getBoundingClientRect();return{x:Math.floor((R.clientX-N.left)/N.width*(_.width/r)),y:Math.floor((R.clientY-N.top)/N.height*(_.height/r))}};_.addEventListener("pointerdown",R=>{const N=W();if(!N)return;R.preventDefault();const z=Be(R);if(!(z.x<0||z.y<0||z.x>=N.canvas.width||z.y>=N.canvas.height)){if(s==="pick"){const oe=N.canvas.getContext("2d").getImageData(z.x,z.y,1,1).data;oe[3]>0&&P("#"+[oe[0],oe[1],oe[2]].map(he=>he.toString(16).padStart(2,"0")).join("")),s="pencil",O();return}if(Q(),s==="fill"){fe(N,z.x,z.y),Y();return}_.setPointerCapture(R.pointerId),ee={last:z,seen:new Set},v(N,z.x,z.y,ee.seen),V()}}),_.addEventListener("pointermove",R=>{const N=W();if(!ee||!N)return;const z=Be(R);let{x:oe,y:he}=ee.last;const D=Math.abs(z.x-oe),xe=Math.abs(z.y-he),Ae=oe<z.x?1:-1,Qe=he<z.y?1:-1;let ot=D-xe;for(let we=0;we<400&&(v(N,oe,he,ee.seen),!(oe===z.x&&he===z.y));we++){const Fe=2*ot;Fe>-xe&&(ot-=xe,oe+=Ae),Fe<D&&(ot+=D,he+=Qe)}ee.last=z,V()});const ne=()=>{ee&&(ee=null,Y())};_.addEventListener("pointerup",ne),_.addEventListener("pointercancel",ne);const ae=R=>{h||!(R.ctrlKey||R.metaKey)||R.target instanceof HTMLInputElement||(R.key.toLowerCase()==="z"&&(R.preventDefault(),R.shiftKey?j():ve()),R.key.toLowerCase()==="y"&&(R.preventDefault(),j()))};window.addEventListener("keydown",ae);function re(){X(),O(),L();const R=W();R&&(r=Math.max(3,Math.min(14,Math.floor(480/Math.max(R.canvas.width,R.canvas.height))))),F()}return re(),{refresh:re,dispose(){h=!0,window.removeEventListener("keydown",ae)}}}async function NC(n){if(typeof DecompressionStream>"u")throw new Error("This browser can't open compressed ZIP files. Use PNG files instead.");const e=new Blob([n]).stream().pipeThrough(new DecompressionStream("deflate-raw"));return new Uint8Array(await new Response(e).arrayBuffer())}async function OC(n){const e=new DataView(n),t=new Uint8Array(n);let s=-1;for(let c=n.byteLength-22;c>=Math.max(0,n.byteLength-22-65535);c--)if(e.getUint32(c,!0)===101010256){s=c;break}if(s<0)throw new Error("That doesn't look like a ZIP file.");const i=e.getUint16(s+10,!0);let r=e.getUint32(s+16,!0);const o=new TextDecoder,l=[];for(let c=0;c<i;c++){if(e.getUint32(r,!0)!==33639248)throw new Error("The ZIP file is damaged.");const d=e.getUint16(r+8,!0),h=e.getUint16(r+10,!0),u=e.getUint32(r+20,!0),m=e.getUint16(r+28,!0),f=e.getUint16(r+30,!0),y=e.getUint16(r+32,!0),w=e.getUint32(r+42,!0),E=o.decode(t.subarray(r+46,r+46+m));if(r+=46+m+f+y,E.endsWith("/")||d&1)continue;if(e.getUint32(w,!0)!==67324752)throw new Error("The ZIP file is damaged.");const x=w+30+e.getUint16(w+26,!0)+e.getUint16(w+28,!0),_=t.subarray(x,x+u);h===0?l.push({name:E,data:_.slice()}):h===8&&l.push({name:E,data:await NC(_)})}return l}const ii=(n,e)=>{const t=document.createElement("canvas");return t.width=n,t.height=e,t},MC=async n=>{const e=n.toDataURL("image/png"),t=atob(e.slice(e.indexOf(",")+1)),s=new Uint8Array(t.length);for(let i=0;i<t.length;i++)s[i]=t.charCodeAt(i);return s},DC=[{id:"stripes",name:"Stripes"},{id:"checks",name:"Checks"},{id:"dots",name:"Dots"},{id:"diagonal",name:"Diagonal"},{id:"zigzag",name:"Zigzag"}];function Cd(n,e,t){const i=ii(8,8),r=i.getContext("2d");if(r.fillStyle=e,r.fillRect(0,0,8,8),r.fillStyle=t,n==="stripes")r.fillRect(0,0,8,8/2);else if(n==="checks")r.fillRect(0,0,8/2,8/2),r.fillRect(8/2,8/2,8/2,8/2);else if(n==="dots")r.fillRect(2,2,3,3);else if(n==="diagonal")for(let o=0;o<8;o++)r.fillRect(o,o,2,1),r.fillRect(o,o+1<8?o+1:0,1,1);else for(let o=0;o<8;o++)r.fillRect(o,o<8/2?o:7-o,1,2);return i}function LC(n,e,t,s){const i=ii(e.width*t,e.height*t),r=i.getContext("2d");r.imageSmoothingEnabled=!1,r.drawImage(e,0,0,i.width,i.height);for(const o of n.frames.values()){const l=o.canvas.width,c=o.canvas.height;if(!l||!c)continue;const d=ii(l,c),h=d.getContext("2d"),u=h.createPattern(i,"repeat");u.setTransform(new DOMMatrix().translate(o.ox,o.oy)),h.fillStyle=u,h.fillRect(0,0,l,c),h.globalCompositeOperation="multiply",h.drawImage(o.canvas,0,0),h.globalCompositeOperation="destination-in",h.drawImage(o.canvas,0,0);const m=ii(l,c),f=m.getContext("2d");f.drawImage(o.canvas,0,0),f.globalAlpha=Math.max(0,Math.min(1,s)),f.drawImage(d,0,0),o.canvas=m,o.edited=!0}}const Ed=n=>n.split(/[\\/]/).pop()??n;async function $C(n){const e=await createImageBitmap(new Blob([n],{type:"image/png"})),t=ii(e.width,e.height);return t.getContext("2d").drawImage(e,0,0),e.close(),t}async function FC(n,e){const t=[];for(const r of e){const o=await r.arrayBuffer();/\.zip$/i.test(r.name)?t.push(...await OC(o)):t.push({name:r.name,data:new Uint8Array(o)})}const s=new Map;for(const r of t)if(Ed(r.name).toLowerCase()==="offset.json")try{const o=JSON.parse(new TextDecoder().decode(r.data));for(const[l,c]of Object.entries(o)){const d=/(s?h_[a-z]+_[a-z0-9]+_\d+_\d_\d+)$/.exec(l);d&&c&&typeof c.x=="number"&&typeof c.y=="number"&&s.set(d[1],{x:c.x,y:c.y})}}catch{}const i={replaced:0,added:0,sizeChanged:0,skipped:[]};for(const r of t){const o=Ed(r.name);if(!/\.png$/i.test(o))continue;const l=Zr(o.replace(/\.png$/i,""));if(!l){/^(atlas|preview|overview)/i.test(o)||i.skipped.push(`${o} (name doesn't match h_<pose>_<layer>_<id>_<dir>_<frame>.png)`);continue}if(l.prefix!=="h")continue;if(!n.meta.parts.some(m=>m.type===l.type)){i.skipped.push(`${o} (this design has no "${l.type}" layer)`);continue}let c;try{c=await $C(r.data)}catch{i.skipped.push(`${o} (not a valid PNG)`);continue}const d=bi(l.action,l.type,n.meta.id,l.dir,l.frame),h=s.get(o.replace(/\.png$/i,"")),u=n.frames.get(d);if(u)!h&&(u.canvas.width!==c.width||u.canvas.height!==c.height)&&i.sizeChanged++,n.frames.set(d,{canvas:c,ox:(h==null?void 0:h.x)??u.ox,oy:(h==null?void 0:h.y)??u.oy,edited:!0}),i.replaced++;else{const m=n.frames.get(bi("std",l.type,n.meta.id,l.dir,0))??[...n.frames.values()][0];n.frames.set(d,{canvas:c,ox:(h==null?void 0:h.x)??(m==null?void 0:m.ox)??0,oy:(h==null?void 0:h.y)??(m==null?void 0:m.oy)??0,edited:!0}),i.added++}}return i}const UC=`6ixPlanet clothing template
===========================

frames/                every sprite frame of this design as its own transparent PNG
offset.json            for each frame: where it is anchored on the character (x, y)

How the frames work
-------------------
* The file name is  h_<pose>_<layer>_<id>_<direction>_<frame>.png
    pose:      std = standing, wlk = walking, wav = waving, sit, lay, crr/drk = carrying/drinking
    layer:     ch = shirt body, ls / rs = left / right sleeve, lg = trousers, sh = shoes, hr = hair, ha = hat ...
    direction: 0-7 (2 = facing the viewer's right, 3 = facing the viewer, 7 = facing away). Directions 4-6 are mirrored
               from 2-0 by the game, so they usually have no files.
* Layers drawn in grey/white are TINTED with the colour the player picks (multiplied). Paint those in greyscale shading.
  Layers with real colours are drawn exactly as you paint them.
* Keep each frame the same canvas size and the same file name. If you must change a frame's size, add an offset.json with
  the new anchor for that frame.

Getting it back in
------------------
Admin > Studio > your design > Import: drop the PNG files (or a ZIP of them). Only the files you changed need to be included.
`;async function BC(n){const e=[],t={};for(const[s,i]of n.frames)!i.canvas.width||!i.canvas.height||(e.push({path:`frames/${s}.png`,data:await MC(i.canvas)}),t[s]={x:i.ox,y:i.oy});return e.push({path:"offset.json",data:vi(JSON.stringify(t,null,2))},{path:"README.txt",data:vi(UC)}),vf(e)}const WC=[["paint","Paint"],["import","Import"],["pattern","Pattern"],["details","Details"],["template","Template"]],kd=n=>{var e;return((e=yt.find(t=>t.id===n))==null?void 0:e.label)??n};function Id(n,e){const t=a("div",{class:"thumb"});return At({figure:n,dir:2,headDir:2,headOnly:e}).then(s=>{if(!s||!t.isConnected)return;const i=Qr(s);i.className="thumb-canvas",t.replaceChildren(i)}),t}function HC(n,e){const t=a("div",{class:"studio"});n.append(t);let s=null,i=null,r=!1,o=null,l=0,c=null;const d=w=>le((w==null?void 0:w.message)||"Something went wrong.","err");function h(){i==null||i.dispose(),i=null,c==null||c(),c=null,window.clearTimeout(l),s&&TC(s.meta.id),s=null}function u(){h(),o==null||o();const w=a("div",{class:"apanel-grid"}),E=()=>{const x=_d();w.replaceChildren(...x.length?x.map(_=>{const U=yt.find(k=>k.id===_.slot),M=gt.clothing[`${_.slot}_${_.id}`],A=wf({type:_.slot,id:_.id}),W=_.published?M?M.on&&M.price>0?`${M.price} drops`:M.price===0?"free for all":"not sold":"free for all":"draft";return a("button",{class:"acard design-card",onclick:()=>void m(_)},a("span",{class:"tag "+(_.published?"free":"off")},_.published?"live":"draft"),A?Id(_a(A),!!(U!=null&&U.headOnly)):a("div",{class:"thumb"}),a("div",{},a("b",{},_.name)),a("div",{class:"nm"},`${kd(_.slot)} · ${W}`))}):[a("p",{class:"hint"},"No designs yet. Press New design to make your first one.")])};t.replaceChildren(a("div",{class:"admin-bar"},a("button",{class:"btn primary",onclick:f},"＋ New design"),a("span",{class:"hint"},"Designs start from an existing garment, so they come with the right layers and animations.")),w),E(),o=vC(()=>{s||E()})}async function m(w){t.replaceChildren(a("div",{class:"loading",style:{color:"#555"}},"Opening…"));try{const E=await kC(w);y(E)}catch(E){d(E),u()}}function f(){h(),o==null||o();let w="ch",E="",x="",_=0;const U=24,M=a("input",{class:"mini-input",placeholder:"Name your design",maxLength:28,value:"My design"}),A=a("select",{onchange:()=>{w=A.value,_=0,B()}},...yt.filter(F=>F.id!=="hd").map(F=>a("option",{value:F.id},F.label))),W=a("select",{onchange:()=>{E=W.value,_=0,B()}},a("option",{value:""},"Any gender"),a("option",{value:"M"},"Boys"),a("option",{value:"F"},"Girls"),a("option",{value:"U"},"Unisex"));A.value=w;const k=a("input",{class:"mini-input",placeholder:"Find by id…",oninput:()=>{x=k.value.trim(),_=0,B()}}),S=a("div",{class:"apanel-grid"}),P=a("div",{class:"row center",style:{margin:"10px 0"}}),L=a("div",{class:"hint"});function X(){return Cf(w).filter(F=>(!E||F.gender===E)&&(!x||F.id.includes(x))&&F.parts.some(V=>V.lib))}async function O(F){const V=M.value.trim()||"My design";L.textContent="Getting the artwork ready…";try{y(await EC(F.type,F.id,CC(),V))}catch(Y){L.textContent="",d(Y)}}function B(){const F=X(),V=Math.max(1,Math.ceil(F.length/U));_>=V&&(_=V-1);const Y=yt.find(K=>K.id===w);S.replaceChildren(...F.slice(_*U,(_+1)*U).map(K=>a("button",{class:"acard",onclick:()=>void O(K)},Id(_a(K),Y.headOnly),a("div",{},a("b",{},`${K.type}-${K.id}`)),a("div",{class:"nm"},`${K.gender==="U"?"unisex":K.gender==="F"?"girls":"boys"}${K.colors?" · tintable":""}`)))),P.replaceChildren(a("button",{class:"btn small",disabled:_===0,onclick:()=>{_--,B()}},"‹"),a("span",{class:"hint"},`${_+1} / ${V} · ${F.length} garments`),a("button",{class:"btn small",disabled:_>=V-1,onclick:()=>{_++,B()}},"›"))}t.replaceChildren(a("div",{class:"admin-bar"},a("button",{class:"btn small",onclick:u},"‹ Designs"),a("b",{},"Pick a garment to start from")),a("div",{class:"admin-bar"},M,A,W,k),L,S,P),B()}function y(w){h(),o==null||o(),s=w;let E="paint",x=2,_=!1,U=0,M=w.meta.gender==="F"?"F":"M",A="",W=0;const k=w.meta,S=gt.clothing[`${k.slot}_${k.id}`];let P=(S==null?void 0:S.price)??0,L=S?S.on:!1;const X=Math.max(0,...k.parts.map(ne=>ne.colorindex)),O=a("canvas",{class:"design-preview",width:64,height:110}),B=a("div",{class:"colors"}),F=a("div",{class:"tabs"}),V=a("div",{class:"studio-body"}),Y=a("div",{class:"hint"}),K=()=>{var De;const ne=jn(Hn[M]),ae=ks(k.slot),re=A||((De=ae[Math.min(3,ae.length-1)])==null?void 0:De.id)||"1";return ne[k.slot]={id:k.id,colors:Array.from({length:X},()=>re)},Bn(ne)};function Q(){const ne=++W;At({figure:K(),dir:x,headDir:x,actions:_?["wlk"]:["std"],frame:U}).then(ae=>{if(r||ne!==W||!ae)return;const re=O.getContext("2d");re.clearRect(0,0,O.width,O.height),re.drawImage(ae,0,0)})}function ve(ne=!1){window.clearTimeout(l);const ae=()=>{SC(w),Q()};ne?ae():l=window.setTimeout(ae,140)}const j=window.setInterval(()=>{_&&(U=(U+1)%4,Q())},160);c=()=>window.clearInterval(j);function ie(){if(!X){B.replaceChildren(a("div",{class:"hint"},"This design isn't tinted: it shows the colours you paint."));return}const ne=ks(k.slot).slice(0,36);B.replaceChildren(a("div",{class:"swatch-row"},...ne.map(ae=>a("button",{class:"swatch"+(A===ae.id?" on":""),style:{background:"#"+ae.hex},title:"Preview colour",onclick:()=>{A=ae.id,ie(),Q()}}))))}function fe(){F.replaceChildren(...WC.map(([ne,ae])=>a("button",{class:"tab"+(ne===E?" on":""),onclick:()=>{E=ne,v(),fe()}},ae)))}function v(){if(i==null||i.dispose(),i=null,V.replaceChildren(),E==="paint")i=PC(V,w,()=>ve());else if(E==="import"){const ne=a("div",{class:"hint"}),ae=a("input",{type:"file",multiple:!0,accept:".png,.zip,.json,image/png,application/zip",onchange:()=>void De(Array.from(ae.files??[]))}),re=a("div",{class:"dropzone"},"Drop PNG files or a ZIP here, or ",a("label",{class:"link"},"choose files",ae));["dragenter","dragover"].forEach(R=>re.addEventListener(R,N=>{N.preventDefault(),re.classList.add("over")})),["dragleave","drop"].forEach(R=>re.addEventListener(R,N=>{N.preventDefault(),re.classList.remove("over")})),re.addEventListener("drop",R=>{var N;return void De(Array.from(((N=R.dataTransfer)==null?void 0:N.files)??[]))});async function De(R){if(R.length){ne.textContent="Importing…";try{const N=await FC(w,R);ne.replaceChildren(a("div",{class:N.replaced+N.added?"ok-text":"form-error"},`${N.replaced} frame${N.replaced===1?"":"s"} replaced, ${N.added} added.`),...N.sizeChanged?[a("div",{class:"hint"},`${N.sizeChanged} replaced frame${N.sizeChanged===1?" has":"s have"} a different size than the original. If it sits in the wrong place, include an offset.json with the anchors.`)]:[],...N.skipped.length?[a("div",{class:"hint"},`Skipped ${N.skipped.length}: ${N.skipped.slice(0,4).join("; ")}${N.skipped.length>4?"…":""}`)]:[]),ve(!0)}catch(N){ne.textContent="",d(N)}}}V.append(a("div",{class:"panel"},a("h2",{},"Import your art"),a("p",{class:"muted"},"Draw in Aseprite, Photoshop or anything else, then bring the PNGs back. Files must be named like the template's frames (h_std_ch_5_2_0.png: pose, layer, id, direction, frame). Only include the frames you changed."),re,ne,a("p",{class:"hint"},"Need the frame files first? The Template tab downloads them for this design.")))}else if(E==="pattern"){let ne="stripes",ae="#ffffff",re="#4a6fb5",De=2,R=100,N=null;const z=a("canvas",{class:"pattern-tile",width:64,height:64}),oe=()=>{const we=z.getContext("2d");we.imageSmoothingEnabled=!1,we.clearRect(0,0,64,64);const Fe=N??Cd(ne,ae,re),Ze=document.createElement("canvas");Ze.width=Fe.width*De,Ze.height=Fe.height*De;const Pt=Ze.getContext("2d");Pt.imageSmoothingEnabled=!1,Pt.drawImage(Fe,0,0,Ze.width,Ze.height),we.fillStyle=we.createPattern(Ze,"repeat"),we.fillRect(0,0,64,64)},he=a("select",{onchange:()=>{ne=he.value,N=null,oe()}},...DC.map(we=>a("option",{value:we.id},we.name))),D=a("input",{type:"color",value:ae,oninput:()=>{ae=D.value,N=null,oe()}}),xe=a("input",{type:"color",value:re,oninput:()=>{re=xe.value,N=null,oe()}}),Ae=a("input",{type:"range",min:1,max:4,value:String(De),oninput:()=>{De=Number(Ae.value),oe()}}),Qe=a("input",{type:"range",min:10,max:100,value:String(R),oninput:()=>{R=Number(Qe.value)}}),ot=a("input",{type:"file",accept:"image/*",onchange:async()=>{var Fe;const we=(Fe=ot.files)==null?void 0:Fe[0];if(we)try{N=await Cl(URL.createObjectURL(we)),oe()}catch(Ze){d(Ze)}}});V.append(a("div",{class:"panel"},a("h2",{},"Pattern fill"),a("p",{class:"muted"},"Lays a pattern over the whole garment (every pose), keeping its shading. Apply more than once to layer patterns, or use Reset all to start over."),a("div",{class:"row"},z,he,D,xe),a("div",{class:"row"},a("span",{class:"hint"},"Or use your own tile image:"),ot),a("label",{class:"row hint"},"Size ",Ae),a("label",{class:"row hint"},"Strength ",Qe),a("div",{class:"row"},a("button",{class:"btn primary",onclick:()=>{LC(w,N??Cd(ne,ae,re),De,R/100),ve(!0),le("Pattern applied.")}},"Apply to every frame"),a("button",{class:"btn",onclick:()=>{ee(),ve(!0),le("Back to the original art.")}},"Reset all frames")))),oe()}else if(E==="details"){const ne=a("input",{class:"mini-input",value:k.name,maxLength:28,oninput:()=>{k.name=ne.value.trim()||"Untitled"}}),ae=a("select",{onchange:()=>{k.gender=ae.value,k.gender!=="U"&&(M=k.gender),Q()}},a("option",{value:"M"},"Boys"),a("option",{value:"F"},"Girls"),a("option",{value:"U"},"Unisex"));ae.value=k.gender;const re=a("input",{type:"checkbox",checked:k.parts.some(z=>z.colorable),onchange:()=>{for(const z of k.parts)z.colorable=re.checked,z.colorindex=re.checked?1:0;ve(!0),ie()}}),De=a("input",{type:"checkbox",checked:w.reuseStanding,onchange:()=>{w.reuseStanding=De.checked,ve(!0)}}),R=a("input",{type:"number",min:0,max:999,value:String(P),onchange:()=>{P=Math.max(0,Math.min(999,Number(R.value)||0))}}),N=a("input",{type:"checkbox",checked:L,onchange:()=>{L=N.checked}});V.append(a("div",{class:"panel"},a("h2",{},"Details"),a("div",{class:"group"},a("label",{class:"cellrow"},a("span",{class:"lbl"},"Name"),ne),a("label",{class:"cellrow"},a("span",{class:"lbl"},"For"),ae),a("label",{class:"cellrow"},a("span",{class:"lbl"},"Players pick the colour"),re),a("label",{class:"cellrow"},a("span",{class:"lbl"},"Reuse standing art when walking"),De),a("label",{class:"cellrow"},a("span",{class:"lbl"},"Price (drops)"),R,a("img",{src:nn,class:"blood-ico",alt:""})),a("label",{class:"cellrow"},a("span",{class:"lbl"},"For sale in the shop"),N)),a("p",{class:"hint"},'Price 0 = free for everyone (it shows up in the character picker and the random avatar). A price above 0 needs "for sale" ticked, otherwise nobody can get it.'),a("p",{class:"hint"},`Based on ${k.base.type}-${k.base.id} · layers: ${k.parts.map(z=>z.type).join(", ")}`)))}else V.append(a("div",{class:"panel"},a("h2",{},"Template"),a("p",{class:"muted"},"Download every frame of this design as a PNG (plus offset.json and a readme) to edit in your own pixel editor. Import the changed files back with the Import tab."),a("button",{class:"btn primary",onclick:async()=>{try{bf(await BC(w),`${k.name.replace(/[^\w-]+/g,"_")||"design"}-frames.zip`),Te(e.profile,"design",`downloaded the frames of ${k.name}`)}catch(ne){d(ne)}}},"Download frames (.zip)"),a("p",{class:"hint"},"Tip: the file names carry the pose, layer, direction and frame. Directions 4-6 don't have files because the game mirrors 2-0 for them.")))}function ee(){if(w.original){for(const ne of[...w.frames.keys()])w.original.has(ne)||w.frames.delete(ne);for(const[ne,ae]of w.original){const re=document.createElement("canvas");re.width=ae.canvas.width,re.height=ae.canvas.height,re.getContext("2d").drawImage(ae.canvas,0,0),w.frames.set(ne,{canvas:re,ox:ae.ox,oy:ae.oy,edited:!1})}i==null||i.refresh()}}async function Be(ne){k.published=ne,Y.textContent="Saving…";try{const ae=await xC(w),re=`${k.slot}_${k.id}`;P>0||L?await Mt("clothing",re,{on:L,price:P}):await si("clothing",re),Te(e.profile,"design",`${ne?"published":"saved a draft of"} ${k.name} (${k.slot}-${k.id}, rev ${ae.rev})`),le(ne?"Published. Players have it now.":"Draft saved."),u()}catch(ae){Y.textContent="",d(ae)}}t.replaceChildren(a("div",{class:"admin-bar"},a("button",{class:"btn small",onclick:()=>{(!w.frames.size||confirm("Leave without saving? Unsaved changes are lost."))&&u()}},"‹ Designs"),a("b",{},k.name),a("span",{class:"hint"},`${kd(k.slot)} · design ${k.id}`)),a("div",{class:"studio-grid"},a("div",{class:"panel studio-preview"},a("div",{class:"preview-box"},O),a("div",{class:"row center"},a("button",{class:"btn small",onclick:()=>{x=(x+7)%8,Q()}},"⟲"),a("button",{class:"btn small",onclick:()=>{_=!_,U=0,Q()}},"Walk"),a("button",{class:"btn small",onclick:()=>{x=(x+1)%8,Q()}},"⟳")),a("div",{class:"row center"},...["M","F"].map(ne=>a("button",{class:"btn small",onclick:()=>{M=ne,Q()}},ne==="M"?"Boy":"Girl"))),B),a("div",{class:"studio-main"},F,V)),a("div",{class:"panel studio-save"},a("div",{class:"row"},a("button",{class:"btn primary",onclick:()=>void Be(!0)},"Publish"),a("button",{class:"btn",onclick:()=>void Be(!1)},"Save as draft"),_d().some(ne=>ne.id===k.id)?a("button",{class:"btn danger",onclick:async()=>{if(confirm(`Delete "${k.name}" for everyone? Players wearing it will lose it.`))try{await AC(k.id),await si("clothing",`${k.slot}_${k.id}`).catch(()=>{}),Te(e.profile,"design",`deleted ${k.name} (${k.slot}-${k.id})`),u()}catch(ne){d(ne)}}},"Delete"):null,Y),a("p",{class:"hint"},"Publish makes it visible to players (as free, or on sale if you set a price in Details). A draft is only visible to you."))),fe(),v(),ie(),ve(!0)}return u(),()=>{r=!0,h(),o==null||o()}}const jC=[["players","Players"],["messages","Messages"],["activity","Activity"],["shop","Shop"],["studio","Studio"],["settings","Settings"]],qi=n=>new Date(n).toLocaleString([],{month:"short",day:"numeric",hour:"2-digit",minute:"2-digit",second:"2-digit"}),Po=n=>n?new Date(n).toLocaleDateString([],{year:"numeric",month:"short",day:"numeric"}):"?";async function Ki(){const e=(await tn(G(q,"users"))).val()??{};return Object.entries(e).map(([t,s])=>({uid:t,name:s.name??"?",figure:s.figure??"",gender:s.gender??"M",blood:s.blood??0,owned:s.owned??{},inventory:s.inventory??{},wardrobe:s.wardrobe??{},stabs:s.stabs??{},syringeDay:s.syringeDay??0,createdAt:s.createdAt??0}))}const Sd=Pr;function VC(n,e){let t="players",s=null,i=[];const r=()=>new Map(i.map(E=>[E.uid,E.name])),o=E=>Te(e.profile,"admin",E),l=a("div",{class:"admin-tabs tabs"}),c=a("div",{class:"admin-body"});n.append(a("div",{class:"admin"},a("div",{class:"privnote"},"Admin. Players are told on the sign-in screen that staff can see chat, private messages and activity. Treat what you see here as private."),l,c));function d(E){s==null||s(),s=null,t=E,c.replaceChildren(),l.replaceChildren(...jC.map(([_,U])=>a("button",{class:"tab"+(_===t?" on":""),onclick:()=>d(_)},U)));const x={players:h,messages:u,activity:y,shop:_=>pC(_,e),studio:_=>HC(_,e),settings:w}[t];Promise.resolve(x(c)).then(_=>{t===E?s=_??null:_==null||_()})}async function h(E){E.append(a("div",{class:"loading",style:{color:"#555"}},"Loading players…")),i=await Ki();let x=null,_="";const U=a("div",{class:"adminstat"}),M=a("div",{class:"scroll-box"}),A=a("div",{}),W=a("input",{class:"mini-input",placeholder:"Search by username…",oninput:()=>{_=W.value.trim().toLowerCase(),S()}}),k=a("button",{class:"btn small",onclick:async()=>{i=await Ki(),S(),le("Refreshed")}},"Refresh");function S(){const L=i.filter(B=>B.name.toLowerCase().includes(_)).sort((B,F)=>F.createdAt-B.createdAt),X=i.filter(B=>Z.isOnline(B.uid)).length;U.replaceChildren(a("div",{class:"panel"},a("b",{},String(i.length)),"accounts"),a("div",{class:"panel"},a("b",{},String(X)),"online now"),a("div",{class:"panel"},a("b",{},String(i.reduce((B,F)=>B+F.blood,0))),"drops in circulation")),M.replaceChildren(a("table",{class:"atable"},a("thead",{},a("tr",{},...["","Username","Online","Drops","Items owned","Stabs today","Joined","ID"].map(B=>a("th",{},B)))),a("tbody",{},...L.map(B=>a("tr",{style:{cursor:"pointer",background:B.uid===x?"#e4edfb":""},onclick:()=>{x=B.uid,S()}},a("td",{},Sd(B.figure)),a("td",{},a("b",{},B.name)),a("td",{},a("span",{class:"dot "+(Z.isOnline(B.uid)?"on":"")})),a("td",{class:"num"},String(B.blood)),a("td",{class:"num"},String(Object.keys(B.owned).length)),a("td",{class:"num"},String(Object.values(B.stabs).filter(F=>F>=xn()).length)),a("td",{},Po(B.createdAt)),a("td",{class:"hint"},B.uid.slice(0,8)))))));const O=i.find(B=>B.uid===x);A.replaceChildren(...O?[P(O)]:[])}function P(L){const X=r(),O=Object.entries(L.inventory).map(([F,V])=>{var Y;return`${((Y=Bt[V.item])==null?void 0:Y.name)??V.item}${V.inPlayer?" (in the CD player)":""} (slot ${Number(F)+1})`}),B=Object.entries(L.stabs).map(([F,V])=>`${X.get(F)??F.slice(0,6)} (${Po(V)})`);return a("div",{class:"panel",style:{marginTop:"10px"}},a("h2",{},L.name),a("div",{class:"row"},Sd(L.figure),a("div",{},a("div",{},`Gender ${L.gender} · joined ${Po(L.createdAt)} · ${L.blood} drops`),a("div",{class:"hint"},`uid ${L.uid}`))),a("p",{},a("b",{},"Inventory: "),O.join(", ")||"empty"),a("p",{},a("b",{},"Owned: "),Object.keys(L.owned).join(", ")||"nothing bought yet"),a("p",{},a("b",{},"Wardrobe: "),`${Object.keys(L.wardrobe).length} saved outfits`),a("p",{},a("b",{},"Syringe: "),L.syringeDay>=xn()?"used today":"not used today"),a("p",{},a("b",{},"Has stabbed: "),B.join(", ")||"nobody"))}return E.replaceChildren(a("div",{class:"admin-bar"},W,k),U,M,A),S(),Z.subscribe(()=>{t==="players"&&S()})}function u(E){let x="chat",_=null,U=0;const M=a("div",{class:"tabs"}),A=a("div",{});E.append(M,A);const W=k=>{_==null||_(),_=null,x=k;const S=++U;M.replaceChildren(...[["chat","Public chat"],["private","Private messages"]].map(([P,L])=>a("button",{class:"tab"+(P===x?" on":""),onclick:()=>W(P)},L))),A.replaceChildren(),(x==="chat"?m(A):f(A)).then(P=>{S===U?_=P:P()})};return W("chat"),()=>{U++,_==null||_()}}async function m(E){i.length||(i=await Ki());let x="",_=[];const U=a("div",{class:"scroll-box"}),M=a("input",{class:"mini-input",placeholder:"Filter by name or text…",oninput:()=>{x=M.value.trim().toLowerCase(),A()}});function A(){const k=_.filter(S=>!x||S.name.toLowerCase().includes(x)||S.text.toLowerCase().includes(x));U.replaceChildren(a("table",{class:"atable"},a("thead",{},a("tr",{},...["Time","User","Message"].map(S=>a("th",{},S)))),a("tbody",{},...k.map(S=>a("tr",{},a("td",{class:"hint"},qi(S.ts)),a("td",{},a("b",{},S.name)),a("td",{},S.text)))))),U.scrollTop=U.scrollHeight}return E.append(a("div",{class:"admin-bar"},M,a("span",{class:"hint"},"Public room chat, last 300 messages, live")),U),tt(yi(G(q,"rooms/lobby/chat"),gi("ts"),mi(300)),k=>{_=[],k.forEach(S=>{const P=S.val();_.push({ts:P.ts??0,uid:P.uid,name:P.name??"?",text:P.text??""})}),A()},()=>le("Couldn't read the chat","err"))}async function f(E){i.length||(i=await Ki());let x=[],_=null,U="";const M=a("div",{class:"scroll-box"}),A=a("div",{class:"scroll-box",style:{padding:"10px",background:"#dbe2ef"}}),W=a("input",{class:"mini-input",placeholder:"Filter by name…",oninput:()=>{U=W.value.trim().toLowerCase(),L()}}),k=()=>r();function S(O){const B=new Map;for(const[F,V]of Object.entries(O??{}))for(const[Y,K]of Object.entries(V??{})){const Q=[F,Y].sort().join("|"),ve=B.get(Q)??{key:Q,a:[F,Y].sort()[0],b:[F,Y].sort()[1],msgs:new Map};for(const[j,ie]of Object.entries(K??{}))ve.msgs.set(j,{id:j,from:ie.from,text:ie.text,ts:typeof ie.ts=="number"?ie.ts:0});B.set(Q,ve)}x=[...B.values()].sort((F,V)=>P(V)-P(F))}const P=O=>Math.max(0,...[...O.msgs.values()].map(B=>B.ts));function L(){const O=k(),B=Y=>`${O.get(Y.a)??Y.a.slice(0,6)} ↔ ${O.get(Y.b)??Y.b.slice(0,6)}`,F=x.filter(Y=>!U||B(Y).toLowerCase().includes(U));M.replaceChildren(...F.length?F.map(Y=>{const K=[...Y.msgs.values()].sort((Q,ve)=>ve.ts-Q.ts)[0];return a("div",{class:"convo-item"+(Y.key===_?" on":""),onclick:()=>{_=Y.key,L()}},a("div",{class:"who"},B(Y)),a("div",{class:"hint"},`${Y.msgs.size} message${Y.msgs.size===1?"":"s"} · last ${K?qi(K.ts):"?"}`))}):[a("div",{class:"hint pad"},"No private messages yet.")]);const V=x.find(Y=>Y.key===_);if(!V){A.replaceChildren(a("div",{class:"hint pad"},"Pick a conversation."));return}A.replaceChildren(...[...V.msgs.values()].sort((Y,K)=>Y.ts-K.ts).map(Y=>a("div",{class:"cw-msg"+(Y.from===V.b?" mine":"")},a("div",{class:"hint"},`${O.get(Y.from)??Y.from.slice(0,6)}`),a("div",{class:"cw-bubble"},Y.text),a("div",{class:"cw-time"},qi(Y.ts))))),A.style.display="flex",A.style.flexDirection="column",A.style.gap="6px",A.scrollTop=A.scrollHeight}return E.append(a("div",{class:"admin-bar"},W,a("span",{class:"hint"},"Every private conversation between players, live")),a("div",{class:"convo-list"},M,A)),tt(G(q,"dms"),O=>{S(O.val()),L()},()=>le("Couldn't read private messages","err"))}async function y(E){let x=[],_="",U="";const M=a("div",{class:"scroll-box"}),A=a("select",{onchange:()=>{_=A.value,k()}},a("option",{value:""},"All actions"),...Kw.map(P=>a("option",{value:P},P))),W=a("input",{class:"mini-input",placeholder:"Filter by name or detail…",oninput:()=>{U=W.value.trim().toLowerCase(),k()}});function k(){const P=x.filter(L=>(!_||L.type===_)&&(!U||L.name.toLowerCase().includes(U)||L.detail.toLowerCase().includes(U))).reverse();M.replaceChildren(a("table",{class:"atable"},a("thead",{},a("tr",{},...["Time","User","Action","Detail"].map(L=>a("th",{},L)))),a("tbody",{},...P.map(L=>a("tr",{},a("td",{class:"hint"},qi(L.ts)),a("td",{},a("b",{},L.name)),a("td",{},a("span",{class:"pill "+L.type},L.type)),a("td",{},L.detail))))))}return E.append(a("div",{class:"admin-bar"},A,W,a("span",{class:"hint"},"Last 500 actions, newest first, live")),M),tt(yi(G(q,"logs"),gi("ts"),mi(500)),P=>{x=[],P.forEach(L=>{const X=L.val();x.push({ts:X.ts??0,name:X.name??"?",type:X.type??"?",detail:X.detail??""})}),k()},()=>le("Couldn't read the action log","err"))}function w(E){const x=a("input",{type:"password",placeholder:"current password",autocomplete:"current-password"}),_=a("input",{type:"password",placeholder:"new password (6+ characters)",autocomplete:"new-password"}),U=a("input",{type:"password",placeholder:"new password again",autocomplete:"new-password"}),M=a("div",{class:"form-error"});return E.append(a("div",{class:"panel",style:{maxWidth:"480px"}},a("h2",{},"Admin password"),a("p",{class:"muted"},"Anyone who knows this password can read every private message. If it's still the one you started with, change it before inviting people."),a("div",{class:"group"},a("label",{class:"cellrow"},x),a("label",{class:"cellrow"},_),a("label",{class:"cellrow"},U)),M,a("button",{class:"btn primary",onclick:async()=>{if(M.textContent="",_.value!==U.value){M.textContent="The new passwords don't match.";return}try{await t0(x.value,_.value),x.value=_.value=U.value="",o("changed the admin password"),le("Password changed.")}catch(A){M.textContent=A.code==="auth/invalid-credential"?"Current password is wrong.":A.message}}},"Change password"))),()=>{}}return d("players"),()=>s==null?void 0:s()}function zC(n,e,t,s){return new Promise(i=>{let r=t?"avatar":"room",o=!1;const l=a("div",{class:"onb"});n.replaceChildren(l);const c=f=>a("div",{class:"onb-steps","aria-label":`Step ${f} of 2`},a("span",{class:f===1?"on":""}),a("span",{class:f===2?"on":""}));function d(){const f=e.profile;let y=f.gender,w=ko(y),E=2,x=0;const _=a("canvas",{class:"onb-avatar",width:64,height:110}),U=a("div",{class:"seg onb-gender"}),M=a("button",{class:"btn primary onb-next"},"Next: pick your room");function A(){const k=++x;At({figure:w,dir:E,headDir:E}).then(S=>{if(o||k!==x||!S)return;const P=_.getContext("2d");P.clearRect(0,0,_.width,_.height),P.drawImage(S,0,0)})}function W(){U.replaceChildren(...["M","F"].map(k=>a("button",{class:"tab"+(y===k?" on":""),onclick:()=>{y!==k&&(y=k,w=ko(k),W(),A())}},k==="M"?"Boy":"Girl")))}M.addEventListener("click",async()=>{M.setAttribute("disabled","");try{await Ar(f,w,y),Te(f,"look","created their character"),ut("camera",.35),s?(r="room",u()):m()}catch(k){le(k.message||"Couldn't save your avatar.","err"),M.removeAttribute("disabled")}}),s||(M.textContent="Done"),l.replaceChildren(a("div",{class:"onb-card"},a("div",{class:"onb-head"},a("h1",{},"Choose your avatar"),s?c(1):null),a("p",{class:"muted onb-sub"},`Hi ${f.name}! Shuffle until you like what you see. You can change everything later in Character.`),U,a("div",{class:"onb-stage"},_),a("div",{class:"row center onb-tools"},a("button",{class:"btn small",title:"Turn left",onclick:()=>{E=(E+7)%8,A()}},"⟲"),a("button",{class:"btn onb-dice",onclick:()=>{w=ko(y),A()}},"🎲 Randomize"),a("button",{class:"btn small",title:"Turn right",onclick:()=>{E=(E+1)%8,A()}},"⟳")),M)),W(),A()}function h(){const f=e.profile;let y=null;const w=new Map,E=a("button",{class:"btn primary onb-next",disabled:!0},"Choose a room first"),x=a("div",{class:"onb-rooms"},...I0.map(_=>{const U=a("div",{class:"onb-room-preview"},a("span",{class:"muted"},"…")),M=a("button",{class:"onb-room",type:"button",onclick:()=>{y=_,w.forEach((W,k)=>W.classList.toggle("on",k===_.id)),E.removeAttribute("disabled"),E.textContent=`Move into ${_.name}`}},U,a("div",{class:"onb-room-name"},_.name),a("div",{class:"hint"},`${_.w}×${_.h} · ${_.blurb}`));w.set(_.id,M);const A=S0(_,{uid:f.uid,name:f.name});return ff(A.theme).then(()=>{o||!U.isConnected||U.replaceChildren(N0(A,300))}),M}));E.addEventListener("click",async()=>{if(y){E.setAttribute("disabled","");try{await A0(f,y),Te(f,"room",`set up their room (${y.name})`),ut("camera",.35),m()}catch(_){le(_.message||"Couldn't create your room.","err"),E.removeAttribute("disabled")}}}),l.replaceChildren(a("div",{class:"onb-card wide"},a("div",{class:"onb-head"},a("h1",{},"Choose your room"),t?c(2):null),a("p",{class:"muted onb-sub"},"This is your space. You'll start here every time you log in, and you can redecorate it later. The door on the wall takes you to the public room and to other players' rooms."),x,a("div",{class:"row center"},t?a("button",{class:"btn",onclick:()=>{r="avatar",u()}},"Back"):null,E)))}function u(){r==="avatar"?d():h()}function m(){o=!0,i()}u()})}const Il="6ixPlanet",GC="Staff can see chat, private messages and activity on 6ixPlanet.",zn=document.getElementById("app");let Ks=null;function fs(){Ks==null||Ks(),Ks=null,zn.replaceChildren()}function qC(){fs(),zn.append(a("div",{class:"center-screen"},a("div",{class:"panel auth"},a("h1",{},"Almost there"),a("p",{},"6ixPlanet needs a Firebase project. Add your config to ",a("code",{},"src/firebaseConfig.ts"),":"),a("ol",{},a("li",{},"Firebase console → create a project → add a Web app, copy its config"),a("li",{},"Build → Authentication → enable the Email/Password provider (usernames are mapped onto it; no real emails are used)"),a("li",{},"Build → Realtime Database → create a database"),a("li",{},"Publish database.rules.json as its rules")),a("p",{class:"muted"},"Or run the local emulators: ",a("code",{},"npm run emulators")," + ",a("code",{},"npm run dev:emu")))))}function Of(n){fs(),zn.append(a("div",{class:"center-screen"},a("div",{class:"loading"},n)))}function Td(){fs(),Xe.stop();let n=!1;const e=a("div",{class:"form-error"}),t=a("input",{type:"text",placeholder:"required",autocomplete:"username",maxLength:16,required:!0,autocapitalize:"none",spellcheck:!1}),s=a("input",{type:"password",placeholder:"required",autocomplete:"current-password",required:!0}),i=a("button",{class:"btn primary",type:"submit"},"Log in"),r=a("button",{class:"link",type:"button"},"No account? Register");function o(){i.textContent=n?"Create account":"Log in",r.textContent=n?"Have an account? Log in":"No account? Register",s.placeholder=n?"6+ characters":"required",s.autocomplete=n?"new-password":"current-password",e.textContent=""}r.addEventListener("click",()=>{n=!n,o()});const l=a("form",{class:"auth-form",onsubmit:async d=>{d.preventDefault(),e.textContent="",i.disabled=!0;try{n?(await Zw(t.value.trim(),s.value),Mf(Os.currentUser)):await e0(t.value,s.value)}catch(h){e.textContent=yl(h),i.disabled=!1}}},a("div",{class:"group"},a("label",{class:"cellrow"},a("span",{class:"lbl"},"Username"),t),a("label",{class:"cellrow"},a("span",{class:"lbl"},"Password"),s)),e,i,r),c=new Date;zn.append(a("div",{class:"shell"},aa(),a("div",{class:"lock"},a("div",{class:"lock-clock"},a("div",{class:"t"},rf(c)),a("div",{class:"d"},c.toLocaleDateString([],{weekday:"long",month:"long",day:"numeric"}))),a("div",{class:"auth"},a("div",{class:"logo"},Il),a("p",{class:"tagline"},"Sign in to hang out."),l,a("p",{class:"notice"},GC),null))))}async function KC(n){Of("Loading your character…");const e=Jw(n);let t,s=()=>{},i=()=>{};try{const k=eC();s=k.stop,await Promise.all([Mi,Nw()]);const S=wC(e);i=S.stop,await Promise.all([k.ready,S.ready]),t=await Hw(n.uid,e),t||(t=await tf(n.uid,(n.email??"").split("@")[0].slice(0,16).padEnd(3,"_")),t.isAdmin=e)}catch(k){s(),i(),fs(),zn.append(a("div",{class:"center-screen"},a("div",{class:"panel auth"},a("h1",{},"Couldn't load"),a("p",{},yl(k)),a("div",{class:"row"},a("button",{class:"btn",onclick:()=>location.reload()},"Retry"),a("button",{class:"btn",onclick:()=>oa()},"Log out")))));return}const r=t;let o=null,l=null,c="",d=ht(r.uid),h=null,u=null;const m={profile:r,navigate:(k,S)=>W(k,S),refreshHeader:()=>o==null?void 0:o.refreshBlood(r.blood),lookChanged:()=>l==null?void 0:l.figureChanged()};let f=null;try{f=await hf(ht(r.uid))}catch{}const y=!r.figure,w=!f;if(y||w){fs();const k=a("div",{class:"onb-host"});zn.append(a("div",{class:"shell"},aa(),k)),await zC(k,m,y,w)}fs();const E=a("div",{class:"room-host"}),x=a("main",{class:"page",hidden:!0});o=r0({appName:Il,isAdmin:r.isAdmin,onNav:k=>W(k),onOutfits:()=>W("customize",{tab:"outfits"}),onLogout:()=>void U()});const _=a("div",{class:"shell"},aa(),o.el,E,x);zn.append(_),m.refreshHeader();const U=async()=>{Te(r,"logout","logged out"),l==null||l.dispose(),l=null,await new Promise(k=>setTimeout(k,300)),D0(r),await Z.clearRoomInvites(),await new Promise(k=>setTimeout(k,150)),await oa()};O0(r).catch(k=>console.warn("couldn't publish profile",k)),Z.start(r),Z.armInviteCleanup(),M0(r);for(const k of[pt,ht(r.uid)])$t(G(q,`rooms/${k}/players/${r.uid}`)).catch(()=>{});Te(r,"login","opened 6ixPlanet");const M=lC(_,m);u=Z.subscribe(()=>o==null?void 0:o.setBadge(Z.badgeCount)),o.setBadge(Z.badgeCount),Ks=()=>{M(),s(),i(),u==null||u(),l==null||l.dispose(),l=null,h==null||h(),h=null,Z.stop()};function A(k,S){let P=null;const L=a("div",{class:"seg page-seg"}),X=a("div",{class:"char-body"});k.append(L,X);const O=B=>{P==null||P(),X.replaceChildren(),L.replaceChildren(...[["look","Look"],["outfits","Saved outfits"]].map(([F,V])=>a("button",{class:"tab"+(F===B?" on":""),onclick:()=>O(F)},V))),P=B==="look"?af(X,m,"customize"):oC(X,m)};return O(S),()=>P==null?void 0:P()}function W(k,S={}){if(k==="admin"&&!r.isAdmin&&(k="room"),k==="room"){const P=S.roomId??d;h==null||h(),h=null,x.replaceChildren(),x.hidden=!0,E.hidden=!1,l&&c===P?l.show():(l==null||l.dispose(),E.replaceChildren(),c=P,d=P,l=J0(E,m,P)),m.refreshHeader()}else l==null||l.hide(),E.hidden=!0,h==null||h(),h=null,x.replaceChildren(),x.hidden=!1,x.scrollTop=0,k==="customize"?h=A(x,S.tab??"look"):k==="shop"?h=nC(x,m):k==="admin"&&(h=VC(x,m));o==null||o.setActive(k)}W("room",{roomId:ht(r.uid)})}document.title=Il;Wh?(Of("Connecting…"),Wg(Os,n=>{ra.registering||Mf(n)})):qC();let xd;function Mf(n){if(((n==null?void 0:n.uid)??null)!==xd){if(xd=(n==null?void 0:n.uid)??null,n&&(n.isAnonymous||!n.email))return oa(),Td();n?KC(n).catch(e=>le(yl(e),"err")):Td()}}
