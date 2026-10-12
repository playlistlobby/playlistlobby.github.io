(function(){const e=document.createElement("link").relList;if(e&&e.supports&&e.supports("modulepreload"))return;for(const s of document.querySelectorAll('link[rel="modulepreload"]'))i(s);new MutationObserver(s=>{for(const r of s)if(r.type==="childList")for(const o of r.addedNodes)o.tagName==="LINK"&&o.rel==="modulepreload"&&i(o)}).observe(document,{childList:!0,subtree:!0});function t(s){const r={};return s.integrity&&(r.integrity=s.integrity),s.referrerPolicy&&(r.referrerPolicy=s.referrerPolicy),s.crossOrigin==="use-credentials"?r.credentials="include":s.crossOrigin==="anonymous"?r.credentials="omit":r.credentials="same-origin",r}function i(s){if(s.ep)return;s.ep=!0;const r=t(s);fetch(s.href,r)}})();var ja={};/**
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
 */const _c={NODE_ADMIN:!1,SDK_VERSION:"${JSCORE_VERSION}"};/**
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
 */const C=function(n,e){if(!n)throw Ln(e)},Ln=function(n){return new Error("Firebase Database ("+_c.SDK_VERSION+") INTERNAL ASSERT FAILED: "+n)};/**
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
 */const yc=function(n){const e=[];let t=0;for(let i=0;i<n.length;i++){let s=n.charCodeAt(i);s<128?e[t++]=s:s<2048?(e[t++]=s>>6|192,e[t++]=s&63|128):(s&64512)===55296&&i+1<n.length&&(n.charCodeAt(i+1)&64512)===56320?(s=65536+((s&1023)<<10)+(n.charCodeAt(++i)&1023),e[t++]=s>>18|240,e[t++]=s>>12&63|128,e[t++]=s>>6&63|128,e[t++]=s&63|128):(e[t++]=s>>12|224,e[t++]=s>>6&63|128,e[t++]=s&63|128)}return e},yh=function(n){const e=[];let t=0,i=0;for(;t<n.length;){const s=n[t++];if(s<128)e[i++]=String.fromCharCode(s);else if(s>191&&s<224){const r=n[t++];e[i++]=String.fromCharCode((s&31)<<6|r&63)}else if(s>239&&s<365){const r=n[t++],o=n[t++],a=n[t++],l=((s&7)<<18|(r&63)<<12|(o&63)<<6|a&63)-65536;e[i++]=String.fromCharCode(55296+(l>>10)),e[i++]=String.fromCharCode(56320+(l&1023))}else{const r=n[t++],o=n[t++];e[i++]=String.fromCharCode((s&15)<<12|(r&63)<<6|o&63)}}return e.join("")},Eo={byteToCharMap_:null,charToByteMap_:null,byteToCharMapWebSafe_:null,charToByteMapWebSafe_:null,ENCODED_VALS_BASE:"ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789",get ENCODED_VALS(){return this.ENCODED_VALS_BASE+"+/="},get ENCODED_VALS_WEBSAFE(){return this.ENCODED_VALS_BASE+"-_."},HAS_NATIVE_SUPPORT:typeof atob=="function",encodeByteArray(n,e){if(!Array.isArray(n))throw Error("encodeByteArray takes an array as a parameter");this.init_();const t=e?this.byteToCharMapWebSafe_:this.byteToCharMap_,i=[];for(let s=0;s<n.length;s+=3){const r=n[s],o=s+1<n.length,a=o?n[s+1]:0,l=s+2<n.length,c=l?n[s+2]:0,f=r>>2,u=(r&3)<<4|a>>4;let _=(a&15)<<2|c>>6,m=c&63;l||(m=64,o||(_=64)),i.push(t[f],t[u],t[_],t[m])}return i.join("")},encodeString(n,e){return this.HAS_NATIVE_SUPPORT&&!e?btoa(n):this.encodeByteArray(yc(n),e)},decodeString(n,e){return this.HAS_NATIVE_SUPPORT&&!e?atob(n):yh(this.decodeStringToByteArray(n,e))},decodeStringToByteArray(n,e){this.init_();const t=e?this.charToByteMapWebSafe_:this.charToByteMap_,i=[];for(let s=0;s<n.length;){const r=t[n.charAt(s++)],a=s<n.length?t[n.charAt(s)]:0;++s;const c=s<n.length?t[n.charAt(s)]:64;++s;const u=s<n.length?t[n.charAt(s)]:64;if(++s,r==null||a==null||c==null||u==null)throw new vh;const _=r<<2|a>>4;if(i.push(_),c!==64){const m=a<<4&240|c>>2;if(i.push(m),u!==64){const w=c<<6&192|u;i.push(w)}}}return i},init_(){if(!this.byteToCharMap_){this.byteToCharMap_={},this.charToByteMap_={},this.byteToCharMapWebSafe_={},this.charToByteMapWebSafe_={};for(let n=0;n<this.ENCODED_VALS.length;n++)this.byteToCharMap_[n]=this.ENCODED_VALS.charAt(n),this.charToByteMap_[this.byteToCharMap_[n]]=n,this.byteToCharMapWebSafe_[n]=this.ENCODED_VALS_WEBSAFE.charAt(n),this.charToByteMapWebSafe_[this.byteToCharMapWebSafe_[n]]=n,n>=this.ENCODED_VALS_BASE.length&&(this.charToByteMap_[this.ENCODED_VALS_WEBSAFE.charAt(n)]=n,this.charToByteMapWebSafe_[this.ENCODED_VALS.charAt(n)]=n)}}};class vh extends Error{constructor(){super(...arguments),this.name="DecodeBase64StringError"}}const vc=function(n){const e=yc(n);return Eo.encodeByteArray(e,!0)},ms=function(n){return vc(n).replace(/\./g,"")},gs=function(n){try{return Eo.decodeString(n,!0)}catch(e){console.error("base64Decode failed: ",e)}return null};/**
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
 */function wh(n){return wc(void 0,n)}function wc(n,e){if(!(e instanceof Object))return e;switch(e.constructor){case Date:const t=e;return new Date(t.getTime());case Object:n===void 0&&(n={});break;case Array:n=[];break;default:return e}for(const t in e)!e.hasOwnProperty(t)||!bh(t)||(n[t]=wc(n[t],e[t]));return n}function bh(n){return n!=="__proto__"}/**
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
 */function Eh(){if(typeof self<"u")return self;if(typeof window<"u")return window;if(typeof global<"u")return global;throw new Error("Unable to locate global object.")}/**
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
 */const Ch=()=>Eh().__FIREBASE_DEFAULTS__,Ih=()=>{if(typeof process>"u"||typeof ja>"u")return;const n=ja.__FIREBASE_DEFAULTS__;if(n)return JSON.parse(n)},Sh=()=>{if(typeof document>"u")return;let n;try{n=document.cookie.match(/__FIREBASE_DEFAULTS__=([^;]+)/)}catch{return}const e=n&&gs(n[1]);return e&&JSON.parse(e)},Co=()=>{try{return Ch()||Ih()||Sh()}catch(n){console.info(`Unable to get __FIREBASE_DEFAULTS__ due to: ${n}`);return}},bc=n=>{var e,t;return(t=(e=Co())===null||e===void 0?void 0:e.emulatorHosts)===null||t===void 0?void 0:t[n]},Th=n=>{const e=bc(n);if(!e)return;const t=e.lastIndexOf(":");if(t<=0||t+1===e.length)throw new Error(`Invalid host ${e} with no separate hostname and port!`);const i=parseInt(e.substring(t+1),10);return e[0]==="["?[e.substring(1,t-1),i]:[e.substring(0,t),i]},Ec=()=>{var n;return(n=Co())===null||n===void 0?void 0:n.config},Cc=n=>{var e;return(e=Co())===null||e===void 0?void 0:e[`_${n}`]};/**
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
 */class rt{constructor(){this.reject=()=>{},this.resolve=()=>{},this.promise=new Promise((e,t)=>{this.resolve=e,this.reject=t})}wrapCallback(e){return(t,i)=>{t?this.reject(t):this.resolve(i),typeof e=="function"&&(this.promise.catch(()=>{}),e.length===1?e(t):e(t,i))}}}/**
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
 */function kh(n,e){if(n.uid)throw new Error('The "uid" field is no longer supported by mockUserToken. Please use "sub" instead for Firebase Auth User ID.');const t={alg:"none",type:"JWT"},i=e||"demo-project",s=n.iat||0,r=n.sub||n.user_id;if(!r)throw new Error("mockUserToken must contain 'sub' or 'user_id' field!");const o=Object.assign({iss:`https://securetoken.google.com/${i}`,aud:i,iat:s,exp:s+3600,auth_time:s,sub:r,user_id:r,firebase:{sign_in_provider:"custom",identities:{}}},n);return[ms(JSON.stringify(t)),ms(JSON.stringify(o)),""].join(".")}/**
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
 */function Oe(){return typeof navigator<"u"&&typeof navigator.userAgent=="string"?navigator.userAgent:""}function Io(){return typeof window<"u"&&!!(window.cordova||window.phonegap||window.PhoneGap)&&/ios|iphone|ipod|ipad|android|blackberry|iemobile/i.test(Oe())}function Rh(){return typeof navigator<"u"&&navigator.userAgent==="Cloudflare-Workers"}function Ah(){const n=typeof chrome=="object"?chrome.runtime:typeof browser=="object"?browser.runtime:void 0;return typeof n=="object"&&n.id!==void 0}function Ic(){return typeof navigator=="object"&&navigator.product==="ReactNative"}function xh(){const n=Oe();return n.indexOf("MSIE ")>=0||n.indexOf("Trident/")>=0}function Ph(){return _c.NODE_ADMIN===!0}function Nh(){try{return typeof indexedDB=="object"}catch{return!1}}function Oh(){return new Promise((n,e)=>{try{let t=!0;const i="validate-browser-context-for-indexeddb-analytics-module",s=self.indexedDB.open(i);s.onsuccess=()=>{s.result.close(),t||self.indexedDB.deleteDatabase(i),n(!0)},s.onupgradeneeded=()=>{t=!1},s.onerror=()=>{var r;e(((r=s.error)===null||r===void 0?void 0:r.message)||"")}}catch(t){e(t)}})}/**
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
 */const Dh="FirebaseError";class Bt extends Error{constructor(e,t,i){super(t),this.code=e,this.customData=i,this.name=Dh,Object.setPrototypeOf(this,Bt.prototype),Error.captureStackTrace&&Error.captureStackTrace(this,Ri.prototype.create)}}class Ri{constructor(e,t,i){this.service=e,this.serviceName=t,this.errors=i}create(e,...t){const i=t[0]||{},s=`${this.service}/${e}`,r=this.errors[e],o=r?Mh(r,i):"Error",a=`${this.serviceName}: ${o} (${s}).`;return new Bt(s,a,i)}}function Mh(n,e){return n.replace(Lh,(t,i)=>{const s=e[i];return s!=null?String(s):`<${i}?>`})}const Lh=/\{\$([^}]+)}/g;/**
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
 */function hi(n){return JSON.parse(n)}function ye(n){return JSON.stringify(n)}/**
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
 */const Sc=function(n){let e={},t={},i={},s="";try{const r=n.split(".");e=hi(gs(r[0])||""),t=hi(gs(r[1])||""),s=r[2],i=t.d||{},delete t.d}catch{}return{header:e,claims:t,data:i,signature:s}},Fh=function(n){const e=Sc(n),t=e.claims;return!!t&&typeof t=="object"&&t.hasOwnProperty("iat")},Uh=function(n){const e=Sc(n).claims;return typeof e=="object"&&e.admin===!0};/**
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
 */function dt(n,e){return Object.prototype.hasOwnProperty.call(n,e)}function In(n,e){if(Object.prototype.hasOwnProperty.call(n,e))return n[e]}function _s(n){for(const e in n)if(Object.prototype.hasOwnProperty.call(n,e))return!1;return!0}function ys(n,e,t){const i={};for(const s in n)Object.prototype.hasOwnProperty.call(n,s)&&(i[s]=e.call(t,n[s],s,n));return i}function vs(n,e){if(n===e)return!0;const t=Object.keys(n),i=Object.keys(e);for(const s of t){if(!i.includes(s))return!1;const r=n[s],o=e[s];if(qa(r)&&qa(o)){if(!vs(r,o))return!1}else if(r!==o)return!1}for(const s of i)if(!t.includes(s))return!1;return!0}function qa(n){return n!==null&&typeof n=="object"}/**
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
 */function Fn(n){const e=[];for(const[t,i]of Object.entries(n))Array.isArray(i)?i.forEach(s=>{e.push(encodeURIComponent(t)+"="+encodeURIComponent(s))}):e.push(encodeURIComponent(t)+"="+encodeURIComponent(i));return e.length?"&"+e.join("&"):""}function ei(n){const e={};return n.replace(/^\?/,"").split("&").forEach(i=>{if(i){const[s,r]=i.split("=");e[decodeURIComponent(s)]=decodeURIComponent(r)}}),e}function ti(n){const e=n.indexOf("?");if(!e)return"";const t=n.indexOf("#",e);return n.substring(e,t>0?t:void 0)}/**
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
 */class $h{constructor(){this.chain_=[],this.buf_=[],this.W_=[],this.pad_=[],this.inbuf_=0,this.total_=0,this.blockSize=512/8,this.pad_[0]=128;for(let e=1;e<this.blockSize;++e)this.pad_[e]=0;this.reset()}reset(){this.chain_[0]=1732584193,this.chain_[1]=4023233417,this.chain_[2]=2562383102,this.chain_[3]=271733878,this.chain_[4]=3285377520,this.inbuf_=0,this.total_=0}compress_(e,t){t||(t=0);const i=this.W_;if(typeof e=="string")for(let u=0;u<16;u++)i[u]=e.charCodeAt(t)<<24|e.charCodeAt(t+1)<<16|e.charCodeAt(t+2)<<8|e.charCodeAt(t+3),t+=4;else for(let u=0;u<16;u++)i[u]=e[t]<<24|e[t+1]<<16|e[t+2]<<8|e[t+3],t+=4;for(let u=16;u<80;u++){const _=i[u-3]^i[u-8]^i[u-14]^i[u-16];i[u]=(_<<1|_>>>31)&4294967295}let s=this.chain_[0],r=this.chain_[1],o=this.chain_[2],a=this.chain_[3],l=this.chain_[4],c,f;for(let u=0;u<80;u++){u<40?u<20?(c=a^r&(o^a),f=1518500249):(c=r^o^a,f=1859775393):u<60?(c=r&o|a&(r|o),f=2400959708):(c=r^o^a,f=3395469782);const _=(s<<5|s>>>27)+c+l+f+i[u]&4294967295;l=a,a=o,o=(r<<30|r>>>2)&4294967295,r=s,s=_}this.chain_[0]=this.chain_[0]+s&4294967295,this.chain_[1]=this.chain_[1]+r&4294967295,this.chain_[2]=this.chain_[2]+o&4294967295,this.chain_[3]=this.chain_[3]+a&4294967295,this.chain_[4]=this.chain_[4]+l&4294967295}update(e,t){if(e==null)return;t===void 0&&(t=e.length);const i=t-this.blockSize;let s=0;const r=this.buf_;let o=this.inbuf_;for(;s<t;){if(o===0)for(;s<=i;)this.compress_(e,s),s+=this.blockSize;if(typeof e=="string"){for(;s<t;)if(r[o]=e.charCodeAt(s),++o,++s,o===this.blockSize){this.compress_(r),o=0;break}}else for(;s<t;)if(r[o]=e[s],++o,++s,o===this.blockSize){this.compress_(r),o=0;break}}this.inbuf_=o,this.total_+=t}digest(){const e=[];let t=this.total_*8;this.inbuf_<56?this.update(this.pad_,56-this.inbuf_):this.update(this.pad_,this.blockSize-(this.inbuf_-56));for(let s=this.blockSize-1;s>=56;s--)this.buf_[s]=t&255,t/=256;this.compress_(this.buf_);let i=0;for(let s=0;s<5;s++)for(let r=24;r>=0;r-=8)e[i]=this.chain_[s]>>r&255,++i;return e}}function Wh(n,e){const t=new Bh(n,e);return t.subscribe.bind(t)}class Bh{constructor(e,t){this.observers=[],this.unsubscribes=[],this.observerCount=0,this.task=Promise.resolve(),this.finalized=!1,this.onNoObservers=t,this.task.then(()=>{e(this)}).catch(i=>{this.error(i)})}next(e){this.forEachObserver(t=>{t.next(e)})}error(e){this.forEachObserver(t=>{t.error(e)}),this.close(e)}complete(){this.forEachObserver(e=>{e.complete()}),this.close()}subscribe(e,t,i){let s;if(e===void 0&&t===void 0&&i===void 0)throw new Error("Missing Observer.");Hh(e,["next","error","complete"])?s=e:s={next:e,error:t,complete:i},s.next===void 0&&(s.next=_r),s.error===void 0&&(s.error=_r),s.complete===void 0&&(s.complete=_r);const r=this.unsubscribeOne.bind(this,this.observers.length);return this.finalized&&this.task.then(()=>{try{this.finalError?s.error(this.finalError):s.complete()}catch{}}),this.observers.push(s),r}unsubscribeOne(e){this.observers===void 0||this.observers[e]===void 0||(delete this.observers[e],this.observerCount-=1,this.observerCount===0&&this.onNoObservers!==void 0&&this.onNoObservers(this))}forEachObserver(e){if(!this.finalized)for(let t=0;t<this.observers.length;t++)this.sendOne(t,e)}sendOne(e,t){this.task.then(()=>{if(this.observers!==void 0&&this.observers[e]!==void 0)try{t(this.observers[e])}catch(i){typeof console<"u"&&console.error&&console.error(i)}})}close(e){this.finalized||(this.finalized=!0,e!==void 0&&(this.finalError=e),this.task.then(()=>{this.observers=void 0,this.onNoObservers=void 0}))}}function Hh(n,e){if(typeof n!="object"||n===null)return!1;for(const t of e)if(t in n&&typeof n[t]=="function")return!0;return!1}function _r(){}function Sn(n,e){return`${n} failed: ${e} argument `}/**
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
 */const Vh=function(n){const e=[];let t=0;for(let i=0;i<n.length;i++){let s=n.charCodeAt(i);if(s>=55296&&s<=56319){const r=s-55296;i++,C(i<n.length,"Surrogate pair missing trail surrogate.");const o=n.charCodeAt(i)-56320;s=65536+(r<<10)+o}s<128?e[t++]=s:s<2048?(e[t++]=s>>6|192,e[t++]=s&63|128):s<65536?(e[t++]=s>>12|224,e[t++]=s>>6&63|128,e[t++]=s&63|128):(e[t++]=s>>18|240,e[t++]=s>>12&63|128,e[t++]=s>>6&63|128,e[t++]=s&63|128)}return e},js=function(n){let e=0;for(let t=0;t<n.length;t++){const i=n.charCodeAt(t);i<128?e++:i<2048?e+=2:i>=55296&&i<=56319?(e+=4,t++):e+=3}return e};/**
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
 */function ve(n){return n&&n._delegate?n._delegate:n}class sn{constructor(e,t,i){this.name=e,this.instanceFactory=t,this.type=i,this.multipleInstances=!1,this.serviceProps={},this.instantiationMode="LAZY",this.onInstanceCreated=null}setInstantiationMode(e){return this.instantiationMode=e,this}setMultipleInstances(e){return this.multipleInstances=e,this}setServiceProps(e){return this.serviceProps=e,this}setInstanceCreatedCallback(e){return this.onInstanceCreated=e,this}}/**
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
 */const Jt="[DEFAULT]";/**
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
 */class jh{constructor(e,t){this.name=e,this.container=t,this.component=null,this.instances=new Map,this.instancesDeferred=new Map,this.instancesOptions=new Map,this.onInitCallbacks=new Map}get(e){const t=this.normalizeInstanceIdentifier(e);if(!this.instancesDeferred.has(t)){const i=new rt;if(this.instancesDeferred.set(t,i),this.isInitialized(t)||this.shouldAutoInitialize())try{const s=this.getOrInitializeService({instanceIdentifier:t});s&&i.resolve(s)}catch{}}return this.instancesDeferred.get(t).promise}getImmediate(e){var t;const i=this.normalizeInstanceIdentifier(e==null?void 0:e.identifier),s=(t=e==null?void 0:e.optional)!==null&&t!==void 0?t:!1;if(this.isInitialized(i)||this.shouldAutoInitialize())try{return this.getOrInitializeService({instanceIdentifier:i})}catch(r){if(s)return null;throw r}else{if(s)return null;throw Error(`Service ${this.name} is not available`)}}getComponent(){return this.component}setComponent(e){if(e.name!==this.name)throw Error(`Mismatching Component ${e.name} for Provider ${this.name}.`);if(this.component)throw Error(`Component for ${this.name} has already been provided`);if(this.component=e,!!this.shouldAutoInitialize()){if(Gh(e))try{this.getOrInitializeService({instanceIdentifier:Jt})}catch{}for(const[t,i]of this.instancesDeferred.entries()){const s=this.normalizeInstanceIdentifier(t);try{const r=this.getOrInitializeService({instanceIdentifier:s});i.resolve(r)}catch{}}}}clearInstance(e=Jt){this.instancesDeferred.delete(e),this.instancesOptions.delete(e),this.instances.delete(e)}async delete(){const e=Array.from(this.instances.values());await Promise.all([...e.filter(t=>"INTERNAL"in t).map(t=>t.INTERNAL.delete()),...e.filter(t=>"_delete"in t).map(t=>t._delete())])}isComponentSet(){return this.component!=null}isInitialized(e=Jt){return this.instances.has(e)}getOptions(e=Jt){return this.instancesOptions.get(e)||{}}initialize(e={}){const{options:t={}}=e,i=this.normalizeInstanceIdentifier(e.instanceIdentifier);if(this.isInitialized(i))throw Error(`${this.name}(${i}) has already been initialized`);if(!this.isComponentSet())throw Error(`Component ${this.name} has not been registered yet`);const s=this.getOrInitializeService({instanceIdentifier:i,options:t});for(const[r,o]of this.instancesDeferred.entries()){const a=this.normalizeInstanceIdentifier(r);i===a&&o.resolve(s)}return s}onInit(e,t){var i;const s=this.normalizeInstanceIdentifier(t),r=(i=this.onInitCallbacks.get(s))!==null&&i!==void 0?i:new Set;r.add(e),this.onInitCallbacks.set(s,r);const o=this.instances.get(s);return o&&e(o,s),()=>{r.delete(e)}}invokeOnInitCallbacks(e,t){const i=this.onInitCallbacks.get(t);if(i)for(const s of i)try{s(e,t)}catch{}}getOrInitializeService({instanceIdentifier:e,options:t={}}){let i=this.instances.get(e);if(!i&&this.component&&(i=this.component.instanceFactory(this.container,{instanceIdentifier:qh(e),options:t}),this.instances.set(e,i),this.instancesOptions.set(e,t),this.invokeOnInitCallbacks(i,e),this.component.onInstanceCreated))try{this.component.onInstanceCreated(this.container,e,i)}catch{}return i||null}normalizeInstanceIdentifier(e=Jt){return this.component?this.component.multipleInstances?e:Jt:e}shouldAutoInitialize(){return!!this.component&&this.component.instantiationMode!=="EXPLICIT"}}function qh(n){return n===Jt?void 0:n}function Gh(n){return n.instantiationMode==="EAGER"}/**
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
 */class zh{constructor(e){this.name=e,this.providers=new Map}addComponent(e){const t=this.getProvider(e.name);if(t.isComponentSet())throw new Error(`Component ${e.name} has already been registered with ${this.name}`);t.setComponent(e)}addOrOverwriteComponent(e){this.getProvider(e.name).isComponentSet()&&this.providers.delete(e.name),this.addComponent(e)}getProvider(e){if(this.providers.has(e))return this.providers.get(e);const t=new jh(e,this);return this.providers.set(e,t),t}getProviders(){return Array.from(this.providers.values())}}/**
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
 */var ce;(function(n){n[n.DEBUG=0]="DEBUG",n[n.VERBOSE=1]="VERBOSE",n[n.INFO=2]="INFO",n[n.WARN=3]="WARN",n[n.ERROR=4]="ERROR",n[n.SILENT=5]="SILENT"})(ce||(ce={}));const Kh={debug:ce.DEBUG,verbose:ce.VERBOSE,info:ce.INFO,warn:ce.WARN,error:ce.ERROR,silent:ce.SILENT},Yh=ce.INFO,Qh={[ce.DEBUG]:"log",[ce.VERBOSE]:"log",[ce.INFO]:"info",[ce.WARN]:"warn",[ce.ERROR]:"error"},Jh=(n,e,...t)=>{if(e<n.logLevel)return;const i=new Date().toISOString(),s=Qh[e];if(s)console[s](`[${i}]  ${n.name}:`,...t);else throw new Error(`Attempted to log a message with an invalid logType (value: ${e})`)};class So{constructor(e){this.name=e,this._logLevel=Yh,this._logHandler=Jh,this._userLogHandler=null}get logLevel(){return this._logLevel}set logLevel(e){if(!(e in ce))throw new TypeError(`Invalid value "${e}" assigned to \`logLevel\``);this._logLevel=e}setLogLevel(e){this._logLevel=typeof e=="string"?Kh[e]:e}get logHandler(){return this._logHandler}set logHandler(e){if(typeof e!="function")throw new TypeError("Value assigned to `logHandler` must be a function");this._logHandler=e}get userLogHandler(){return this._userLogHandler}set userLogHandler(e){this._userLogHandler=e}debug(...e){this._userLogHandler&&this._userLogHandler(this,ce.DEBUG,...e),this._logHandler(this,ce.DEBUG,...e)}log(...e){this._userLogHandler&&this._userLogHandler(this,ce.VERBOSE,...e),this._logHandler(this,ce.VERBOSE,...e)}info(...e){this._userLogHandler&&this._userLogHandler(this,ce.INFO,...e),this._logHandler(this,ce.INFO,...e)}warn(...e){this._userLogHandler&&this._userLogHandler(this,ce.WARN,...e),this._logHandler(this,ce.WARN,...e)}error(...e){this._userLogHandler&&this._userLogHandler(this,ce.ERROR,...e),this._logHandler(this,ce.ERROR,...e)}}const Xh=(n,e)=>e.some(t=>n instanceof t);let Ga,za;function Zh(){return Ga||(Ga=[IDBDatabase,IDBObjectStore,IDBIndex,IDBCursor,IDBTransaction])}function ef(){return za||(za=[IDBCursor.prototype.advance,IDBCursor.prototype.continue,IDBCursor.prototype.continuePrimaryKey])}const Tc=new WeakMap,Fr=new WeakMap,kc=new WeakMap,yr=new WeakMap,To=new WeakMap;function tf(n){const e=new Promise((t,i)=>{const s=()=>{n.removeEventListener("success",r),n.removeEventListener("error",o)},r=()=>{t(Pt(n.result)),s()},o=()=>{i(n.error),s()};n.addEventListener("success",r),n.addEventListener("error",o)});return e.then(t=>{t instanceof IDBCursor&&Tc.set(t,n)}).catch(()=>{}),To.set(e,n),e}function nf(n){if(Fr.has(n))return;const e=new Promise((t,i)=>{const s=()=>{n.removeEventListener("complete",r),n.removeEventListener("error",o),n.removeEventListener("abort",o)},r=()=>{t(),s()},o=()=>{i(n.error||new DOMException("AbortError","AbortError")),s()};n.addEventListener("complete",r),n.addEventListener("error",o),n.addEventListener("abort",o)});Fr.set(n,e)}let Ur={get(n,e,t){if(n instanceof IDBTransaction){if(e==="done")return Fr.get(n);if(e==="objectStoreNames")return n.objectStoreNames||kc.get(n);if(e==="store")return t.objectStoreNames[1]?void 0:t.objectStore(t.objectStoreNames[0])}return Pt(n[e])},set(n,e,t){return n[e]=t,!0},has(n,e){return n instanceof IDBTransaction&&(e==="done"||e==="store")?!0:e in n}};function sf(n){Ur=n(Ur)}function rf(n){return n===IDBDatabase.prototype.transaction&&!("objectStoreNames"in IDBTransaction.prototype)?function(e,...t){const i=n.call(vr(this),e,...t);return kc.set(i,e.sort?e.sort():[e]),Pt(i)}:ef().includes(n)?function(...e){return n.apply(vr(this),e),Pt(Tc.get(this))}:function(...e){return Pt(n.apply(vr(this),e))}}function of(n){return typeof n=="function"?rf(n):(n instanceof IDBTransaction&&nf(n),Xh(n,Zh())?new Proxy(n,Ur):n)}function Pt(n){if(n instanceof IDBRequest)return tf(n);if(yr.has(n))return yr.get(n);const e=of(n);return e!==n&&(yr.set(n,e),To.set(e,n)),e}const vr=n=>To.get(n);function af(n,e,{blocked:t,upgrade:i,blocking:s,terminated:r}={}){const o=indexedDB.open(n,e),a=Pt(o);return i&&o.addEventListener("upgradeneeded",l=>{i(Pt(o.result),l.oldVersion,l.newVersion,Pt(o.transaction),l)}),t&&o.addEventListener("blocked",l=>t(l.oldVersion,l.newVersion,l)),a.then(l=>{r&&l.addEventListener("close",()=>r()),s&&l.addEventListener("versionchange",c=>s(c.oldVersion,c.newVersion,c))}).catch(()=>{}),a}const lf=["get","getKey","getAll","getAllKeys","count"],cf=["put","add","delete","clear"],wr=new Map;function Ka(n,e){if(!(n instanceof IDBDatabase&&!(e in n)&&typeof e=="string"))return;if(wr.get(e))return wr.get(e);const t=e.replace(/FromIndex$/,""),i=e!==t,s=cf.includes(t);if(!(t in(i?IDBIndex:IDBObjectStore).prototype)||!(s||lf.includes(t)))return;const r=async function(o,...a){const l=this.transaction(o,s?"readwrite":"readonly");let c=l.store;return i&&(c=c.index(a.shift())),(await Promise.all([c[t](...a),s&&l.done]))[0]};return wr.set(e,r),r}sf(n=>({...n,get:(e,t,i)=>Ka(e,t)||n.get(e,t,i),has:(e,t)=>!!Ka(e,t)||n.has(e,t)}));/**
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
 */class df{constructor(e){this.container=e}getPlatformInfoString(){return this.container.getProviders().map(t=>{if(uf(t)){const i=t.getImmediate();return`${i.library}/${i.version}`}else return null}).filter(t=>t).join(" ")}}function uf(n){const e=n.getComponent();return(e==null?void 0:e.type)==="VERSION"}const $r="@firebase/app",Ya="0.10.13";/**
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
 */const wt=new So("@firebase/app"),hf="@firebase/app-compat",ff="@firebase/analytics-compat",pf="@firebase/analytics",mf="@firebase/app-check-compat",gf="@firebase/app-check",_f="@firebase/auth",yf="@firebase/auth-compat",vf="@firebase/database",wf="@firebase/data-connect",bf="@firebase/database-compat",Ef="@firebase/functions",Cf="@firebase/functions-compat",If="@firebase/installations",Sf="@firebase/installations-compat",Tf="@firebase/messaging",kf="@firebase/messaging-compat",Rf="@firebase/performance",Af="@firebase/performance-compat",xf="@firebase/remote-config",Pf="@firebase/remote-config-compat",Nf="@firebase/storage",Of="@firebase/storage-compat",Df="@firebase/firestore",Mf="@firebase/vertexai-preview",Lf="@firebase/firestore-compat",Ff="firebase",Uf="10.14.1";/**
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
 */const Wr="[DEFAULT]",$f={[$r]:"fire-core",[hf]:"fire-core-compat",[pf]:"fire-analytics",[ff]:"fire-analytics-compat",[gf]:"fire-app-check",[mf]:"fire-app-check-compat",[_f]:"fire-auth",[yf]:"fire-auth-compat",[vf]:"fire-rtdb",[wf]:"fire-data-connect",[bf]:"fire-rtdb-compat",[Ef]:"fire-fn",[Cf]:"fire-fn-compat",[If]:"fire-iid",[Sf]:"fire-iid-compat",[Tf]:"fire-fcm",[kf]:"fire-fcm-compat",[Rf]:"fire-perf",[Af]:"fire-perf-compat",[xf]:"fire-rc",[Pf]:"fire-rc-compat",[Nf]:"fire-gcs",[Of]:"fire-gcs-compat",[Df]:"fire-fst",[Lf]:"fire-fst-compat",[Mf]:"fire-vertex","fire-js":"fire-js",[Ff]:"fire-js-all"};/**
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
 */const ws=new Map,Wf=new Map,Br=new Map;function Qa(n,e){try{n.container.addComponent(e)}catch(t){wt.debug(`Component ${e.name} failed to register with FirebaseApp ${n.name}`,t)}}function Tn(n){const e=n.name;if(Br.has(e))return wt.debug(`There were multiple attempts to register component ${e}.`),!1;Br.set(e,n);for(const t of ws.values())Qa(t,n);for(const t of Wf.values())Qa(t,n);return!0}function ko(n,e){const t=n.container.getProvider("heartbeat").getImmediate({optional:!0});return t&&t.triggerHeartbeat(),n.container.getProvider(e)}function ot(n){return n.settings!==void 0}/**
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
 */const Bf={"no-app":"No Firebase App '{$appName}' has been created - call initializeApp() first","bad-app-name":"Illegal App name: '{$appName}'","duplicate-app":"Firebase App named '{$appName}' already exists with different options or config","app-deleted":"Firebase App named '{$appName}' already deleted","server-app-deleted":"Firebase Server App has been deleted","no-options":"Need to provide options, when not being deployed to hosting via source.","invalid-app-argument":"firebase.{$appName}() takes either no argument or a Firebase App instance.","invalid-log-argument":"First argument to `onLog` must be null or a function.","idb-open":"Error thrown when opening IndexedDB. Original error: {$originalErrorMessage}.","idb-get":"Error thrown when reading from IndexedDB. Original error: {$originalErrorMessage}.","idb-set":"Error thrown when writing to IndexedDB. Original error: {$originalErrorMessage}.","idb-delete":"Error thrown when deleting from IndexedDB. Original error: {$originalErrorMessage}.","finalization-registry-not-supported":"FirebaseServerApp deleteOnDeref field defined but the JS runtime does not support FinalizationRegistry.","invalid-server-app-environment":"FirebaseServerApp is not for use in browser environments."},Nt=new Ri("app","Firebase",Bf);/**
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
 */class Hf{constructor(e,t,i){this._isDeleted=!1,this._options=Object.assign({},e),this._config=Object.assign({},t),this._name=t.name,this._automaticDataCollectionEnabled=t.automaticDataCollectionEnabled,this._container=i,this.container.addComponent(new sn("app",()=>this,"PUBLIC"))}get automaticDataCollectionEnabled(){return this.checkDestroyed(),this._automaticDataCollectionEnabled}set automaticDataCollectionEnabled(e){this.checkDestroyed(),this._automaticDataCollectionEnabled=e}get name(){return this.checkDestroyed(),this._name}get options(){return this.checkDestroyed(),this._options}get config(){return this.checkDestroyed(),this._config}get container(){return this._container}get isDeleted(){return this._isDeleted}set isDeleted(e){this._isDeleted=e}checkDestroyed(){if(this.isDeleted)throw Nt.create("app-deleted",{appName:this._name})}}/**
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
 */const Un=Uf;function Rc(n,e={}){let t=n;typeof e!="object"&&(e={name:e});const i=Object.assign({name:Wr,automaticDataCollectionEnabled:!1},e),s=i.name;if(typeof s!="string"||!s)throw Nt.create("bad-app-name",{appName:String(s)});if(t||(t=Ec()),!t)throw Nt.create("no-options");const r=ws.get(s);if(r){if(vs(t,r.options)&&vs(i,r.config))return r;throw Nt.create("duplicate-app",{appName:s})}const o=new zh(s);for(const l of Br.values())o.addComponent(l);const a=new Hf(t,i,o);return ws.set(s,a),a}function Ac(n=Wr){const e=ws.get(n);if(!e&&n===Wr&&Ec())return Rc();if(!e)throw Nt.create("no-app",{appName:n});return e}function Ot(n,e,t){var i;let s=(i=$f[n])!==null&&i!==void 0?i:n;t&&(s+=`-${t}`);const r=s.match(/\s|\//),o=e.match(/\s|\//);if(r||o){const a=[`Unable to register library "${s}" with version "${e}":`];r&&a.push(`library name "${s}" contains illegal characters (whitespace or "/")`),r&&o&&a.push("and"),o&&a.push(`version name "${e}" contains illegal characters (whitespace or "/")`),wt.warn(a.join(" "));return}Tn(new sn(`${s}-version`,()=>({library:s,version:e}),"VERSION"))}/**
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
 */const Vf="firebase-heartbeat-database",jf=1,fi="firebase-heartbeat-store";let br=null;function xc(){return br||(br=af(Vf,jf,{upgrade:(n,e)=>{switch(e){case 0:try{n.createObjectStore(fi)}catch(t){console.warn(t)}}}}).catch(n=>{throw Nt.create("idb-open",{originalErrorMessage:n.message})})),br}async function qf(n){try{const t=(await xc()).transaction(fi),i=await t.objectStore(fi).get(Pc(n));return await t.done,i}catch(e){if(e instanceof Bt)wt.warn(e.message);else{const t=Nt.create("idb-get",{originalErrorMessage:e==null?void 0:e.message});wt.warn(t.message)}}}async function Ja(n,e){try{const i=(await xc()).transaction(fi,"readwrite");await i.objectStore(fi).put(e,Pc(n)),await i.done}catch(t){if(t instanceof Bt)wt.warn(t.message);else{const i=Nt.create("idb-set",{originalErrorMessage:t==null?void 0:t.message});wt.warn(i.message)}}}function Pc(n){return`${n.name}!${n.options.appId}`}/**
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
 */const Gf=1024,zf=30*24*60*60*1e3;class Kf{constructor(e){this.container=e,this._heartbeatsCache=null;const t=this.container.getProvider("app").getImmediate();this._storage=new Qf(t),this._heartbeatsCachePromise=this._storage.read().then(i=>(this._heartbeatsCache=i,i))}async triggerHeartbeat(){var e,t;try{const s=this.container.getProvider("platform-logger").getImmediate().getPlatformInfoString(),r=Xa();return((e=this._heartbeatsCache)===null||e===void 0?void 0:e.heartbeats)==null&&(this._heartbeatsCache=await this._heartbeatsCachePromise,((t=this._heartbeatsCache)===null||t===void 0?void 0:t.heartbeats)==null)||this._heartbeatsCache.lastSentHeartbeatDate===r||this._heartbeatsCache.heartbeats.some(o=>o.date===r)?void 0:(this._heartbeatsCache.heartbeats.push({date:r,agent:s}),this._heartbeatsCache.heartbeats=this._heartbeatsCache.heartbeats.filter(o=>{const a=new Date(o.date).valueOf();return Date.now()-a<=zf}),this._storage.overwrite(this._heartbeatsCache))}catch(i){wt.warn(i)}}async getHeartbeatsHeader(){var e;try{if(this._heartbeatsCache===null&&await this._heartbeatsCachePromise,((e=this._heartbeatsCache)===null||e===void 0?void 0:e.heartbeats)==null||this._heartbeatsCache.heartbeats.length===0)return"";const t=Xa(),{heartbeatsToSend:i,unsentEntries:s}=Yf(this._heartbeatsCache.heartbeats),r=ms(JSON.stringify({version:2,heartbeats:i}));return this._heartbeatsCache.lastSentHeartbeatDate=t,s.length>0?(this._heartbeatsCache.heartbeats=s,await this._storage.overwrite(this._heartbeatsCache)):(this._heartbeatsCache.heartbeats=[],this._storage.overwrite(this._heartbeatsCache)),r}catch(t){return wt.warn(t),""}}}function Xa(){return new Date().toISOString().substring(0,10)}function Yf(n,e=Gf){const t=[];let i=n.slice();for(const s of n){const r=t.find(o=>o.agent===s.agent);if(r){if(r.dates.push(s.date),Za(t)>e){r.dates.pop();break}}else if(t.push({agent:s.agent,dates:[s.date]}),Za(t)>e){t.pop();break}i=i.slice(1)}return{heartbeatsToSend:t,unsentEntries:i}}class Qf{constructor(e){this.app=e,this._canUseIndexedDBPromise=this.runIndexedDBEnvironmentCheck()}async runIndexedDBEnvironmentCheck(){return Nh()?Oh().then(()=>!0).catch(()=>!1):!1}async read(){if(await this._canUseIndexedDBPromise){const t=await qf(this.app);return t!=null&&t.heartbeats?t:{heartbeats:[]}}else return{heartbeats:[]}}async overwrite(e){var t;if(await this._canUseIndexedDBPromise){const s=await this.read();return Ja(this.app,{lastSentHeartbeatDate:(t=e.lastSentHeartbeatDate)!==null&&t!==void 0?t:s.lastSentHeartbeatDate,heartbeats:e.heartbeats})}else return}async add(e){var t;if(await this._canUseIndexedDBPromise){const s=await this.read();return Ja(this.app,{lastSentHeartbeatDate:(t=e.lastSentHeartbeatDate)!==null&&t!==void 0?t:s.lastSentHeartbeatDate,heartbeats:[...s.heartbeats,...e.heartbeats]})}else return}}function Za(n){return ms(JSON.stringify({version:2,heartbeats:n})).length}/**
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
 */function Jf(n){Tn(new sn("platform-logger",e=>new df(e),"PRIVATE")),Tn(new sn("heartbeat",e=>new Kf(e),"PRIVATE")),Ot($r,Ya,n),Ot($r,Ya,"esm2017"),Ot("fire-js","")}Jf("");function Ro(n,e){var t={};for(var i in n)Object.prototype.hasOwnProperty.call(n,i)&&e.indexOf(i)<0&&(t[i]=n[i]);if(n!=null&&typeof Object.getOwnPropertySymbols=="function")for(var s=0,i=Object.getOwnPropertySymbols(n);s<i.length;s++)e.indexOf(i[s])<0&&Object.prototype.propertyIsEnumerable.call(n,i[s])&&(t[i[s]]=n[i[s]]);return t}function Nc(){return{"dependent-sdk-initialized-before-auth":"Another Firebase SDK was initialized and is trying to use Auth before Auth is initialized. Please be sure to call `initializeAuth` or `getAuth` before starting any other Firebase SDK."}}const Xf=Nc,Oc=new Ri("auth","Firebase",Nc());/**
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
 */const bs=new So("@firebase/auth");function Zf(n,...e){bs.logLevel<=ce.WARN&&bs.warn(`Auth (${Un}): ${n}`,...e)}function ls(n,...e){bs.logLevel<=ce.ERROR&&bs.error(`Auth (${Un}): ${n}`,...e)}/**
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
 */function et(n,...e){throw Ao(n,...e)}function lt(n,...e){return Ao(n,...e)}function Dc(n,e,t){const i=Object.assign(Object.assign({},Xf()),{[e]:t});return new Ri("auth","Firebase",i).create(e,{appName:n.name})}function yt(n){return Dc(n,"operation-not-supported-in-this-environment","Operations that alter the current user are not supported in conjunction with FirebaseServerApp")}function Ao(n,...e){if(typeof n!="string"){const t=e[0],i=[...e.slice(1)];return i[0]&&(i[0].appName=n.name),n._errorFactory.create(t,...i)}return Oc.create(n,...e)}function B(n,e,...t){if(!n)throw Ao(e,...t)}function ft(n){const e="INTERNAL ASSERTION FAILED: "+n;throw ls(e),new Error(e)}function bt(n,e){n||ft(e)}/**
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
 */function Hr(){var n;return typeof self<"u"&&((n=self.location)===null||n===void 0?void 0:n.href)||""}function ep(){return el()==="http:"||el()==="https:"}function el(){var n;return typeof self<"u"&&((n=self.location)===null||n===void 0?void 0:n.protocol)||null}/**
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
 */function tp(){return typeof navigator<"u"&&navigator&&"onLine"in navigator&&typeof navigator.onLine=="boolean"&&(ep()||Ah()||"connection"in navigator)?navigator.onLine:!0}function np(){if(typeof navigator>"u")return null;const n=navigator;return n.languages&&n.languages[0]||n.language||null}/**
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
 */class Ai{constructor(e,t){this.shortDelay=e,this.longDelay=t,bt(t>e,"Short delay should be less than long delay!"),this.isMobile=Io()||Ic()}get(){return tp()?this.isMobile?this.longDelay:this.shortDelay:Math.min(5e3,this.shortDelay)}}/**
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
 */function xo(n,e){bt(n.emulator,"Emulator should always be set here");const{url:t}=n.emulator;return e?`${t}${e.startsWith("/")?e.slice(1):e}`:t}/**
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
 */class Mc{static initialize(e,t,i){this.fetchImpl=e,t&&(this.headersImpl=t),i&&(this.responseImpl=i)}static fetch(){if(this.fetchImpl)return this.fetchImpl;if(typeof self<"u"&&"fetch"in self)return self.fetch;if(typeof globalThis<"u"&&globalThis.fetch)return globalThis.fetch;if(typeof fetch<"u")return fetch;ft("Could not find fetch implementation, make sure you call FetchProvider.initialize() with an appropriate polyfill")}static headers(){if(this.headersImpl)return this.headersImpl;if(typeof self<"u"&&"Headers"in self)return self.Headers;if(typeof globalThis<"u"&&globalThis.Headers)return globalThis.Headers;if(typeof Headers<"u")return Headers;ft("Could not find Headers implementation, make sure you call FetchProvider.initialize() with an appropriate polyfill")}static response(){if(this.responseImpl)return this.responseImpl;if(typeof self<"u"&&"Response"in self)return self.Response;if(typeof globalThis<"u"&&globalThis.Response)return globalThis.Response;if(typeof Response<"u")return Response;ft("Could not find Response implementation, make sure you call FetchProvider.initialize() with an appropriate polyfill")}}/**
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
 */const ip={CREDENTIAL_MISMATCH:"custom-token-mismatch",MISSING_CUSTOM_TOKEN:"internal-error",INVALID_IDENTIFIER:"invalid-email",MISSING_CONTINUE_URI:"internal-error",INVALID_PASSWORD:"wrong-password",MISSING_PASSWORD:"missing-password",INVALID_LOGIN_CREDENTIALS:"invalid-credential",EMAIL_EXISTS:"email-already-in-use",PASSWORD_LOGIN_DISABLED:"operation-not-allowed",INVALID_IDP_RESPONSE:"invalid-credential",INVALID_PENDING_TOKEN:"invalid-credential",FEDERATED_USER_ID_ALREADY_LINKED:"credential-already-in-use",MISSING_REQ_TYPE:"internal-error",EMAIL_NOT_FOUND:"user-not-found",RESET_PASSWORD_EXCEED_LIMIT:"too-many-requests",EXPIRED_OOB_CODE:"expired-action-code",INVALID_OOB_CODE:"invalid-action-code",MISSING_OOB_CODE:"internal-error",CREDENTIAL_TOO_OLD_LOGIN_AGAIN:"requires-recent-login",INVALID_ID_TOKEN:"invalid-user-token",TOKEN_EXPIRED:"user-token-expired",USER_NOT_FOUND:"user-token-expired",TOO_MANY_ATTEMPTS_TRY_LATER:"too-many-requests",PASSWORD_DOES_NOT_MEET_REQUIREMENTS:"password-does-not-meet-requirements",INVALID_CODE:"invalid-verification-code",INVALID_SESSION_INFO:"invalid-verification-id",INVALID_TEMPORARY_PROOF:"invalid-credential",MISSING_SESSION_INFO:"missing-verification-id",SESSION_EXPIRED:"code-expired",MISSING_ANDROID_PACKAGE_NAME:"missing-android-pkg-name",UNAUTHORIZED_DOMAIN:"unauthorized-continue-uri",INVALID_OAUTH_CLIENT_ID:"invalid-oauth-client-id",ADMIN_ONLY_OPERATION:"admin-restricted-operation",INVALID_MFA_PENDING_CREDENTIAL:"invalid-multi-factor-session",MFA_ENROLLMENT_NOT_FOUND:"multi-factor-info-not-found",MISSING_MFA_ENROLLMENT_ID:"missing-multi-factor-info",MISSING_MFA_PENDING_CREDENTIAL:"missing-multi-factor-session",SECOND_FACTOR_EXISTS:"second-factor-already-in-use",SECOND_FACTOR_LIMIT_EXCEEDED:"maximum-second-factor-count-exceeded",BLOCKING_FUNCTION_ERROR_RESPONSE:"internal-error",RECAPTCHA_NOT_ENABLED:"recaptcha-not-enabled",MISSING_RECAPTCHA_TOKEN:"missing-recaptcha-token",INVALID_RECAPTCHA_TOKEN:"invalid-recaptcha-token",INVALID_RECAPTCHA_ACTION:"invalid-recaptcha-action",MISSING_CLIENT_TYPE:"missing-client-type",MISSING_RECAPTCHA_VERSION:"missing-recaptcha-version",INVALID_RECAPTCHA_VERSION:"invalid-recaptcha-version",INVALID_REQ_TYPE:"invalid-req-type"};/**
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
 */const sp=new Ai(3e4,6e4);function Ht(n,e){return n.tenantId&&!e.tenantId?Object.assign(Object.assign({},e),{tenantId:n.tenantId}):e}async function Vt(n,e,t,i,s={}){return Lc(n,s,async()=>{let r={},o={};i&&(e==="GET"?o=i:r={body:JSON.stringify(i)});const a=Fn(Object.assign({key:n.config.apiKey},o)).slice(1),l=await n._getAdditionalHeaders();l["Content-Type"]="application/json",n.languageCode&&(l["X-Firebase-Locale"]=n.languageCode);const c=Object.assign({method:e,headers:l},r);return Rh()||(c.referrerPolicy="no-referrer"),Mc.fetch()(Fc(n,n.config.apiHost,t,a),c)})}async function Lc(n,e,t){n._canInitEmulator=!1;const i=Object.assign(Object.assign({},ip),e);try{const s=new op(n),r=await Promise.race([t(),s.promise]);s.clearNetworkTimeout();const o=await r.json();if("needConfirmation"in o)throw es(n,"account-exists-with-different-credential",o);if(r.ok&&!("errorMessage"in o))return o;{const a=r.ok?o.errorMessage:o.error.message,[l,c]=a.split(" : ");if(l==="FEDERATED_USER_ID_ALREADY_LINKED")throw es(n,"credential-already-in-use",o);if(l==="EMAIL_EXISTS")throw es(n,"email-already-in-use",o);if(l==="USER_DISABLED")throw es(n,"user-disabled",o);const f=i[l]||l.toLowerCase().replace(/[_\s]+/g,"-");if(c)throw Dc(n,f,c);et(n,f)}}catch(s){if(s instanceof Bt)throw s;et(n,"network-request-failed",{message:String(s)})}}async function xi(n,e,t,i,s={}){const r=await Vt(n,e,t,i,s);return"mfaPendingCredential"in r&&et(n,"multi-factor-auth-required",{_serverResponse:r}),r}function Fc(n,e,t,i){const s=`${e}${t}?${i}`;return n.config.emulator?xo(n.config,s):`${n.config.apiScheme}://${s}`}function rp(n){switch(n){case"ENFORCE":return"ENFORCE";case"AUDIT":return"AUDIT";case"OFF":return"OFF";default:return"ENFORCEMENT_STATE_UNSPECIFIED"}}class op{constructor(e){this.auth=e,this.timer=null,this.promise=new Promise((t,i)=>{this.timer=setTimeout(()=>i(lt(this.auth,"network-request-failed")),sp.get())})}clearNetworkTimeout(){clearTimeout(this.timer)}}function es(n,e,t){const i={appName:n.name};t.email&&(i.email=t.email),t.phoneNumber&&(i.phoneNumber=t.phoneNumber);const s=lt(n,e,i);return s.customData._tokenResponse=t,s}function tl(n){return n!==void 0&&n.enterprise!==void 0}class ap{constructor(e){if(this.siteKey="",this.recaptchaEnforcementState=[],e.recaptchaKey===void 0)throw new Error("recaptchaKey undefined");this.siteKey=e.recaptchaKey.split("/")[3],this.recaptchaEnforcementState=e.recaptchaEnforcementState}getProviderEnforcementState(e){if(!this.recaptchaEnforcementState||this.recaptchaEnforcementState.length===0)return null;for(const t of this.recaptchaEnforcementState)if(t.provider&&t.provider===e)return rp(t.enforcementState);return null}isProviderEnabled(e){return this.getProviderEnforcementState(e)==="ENFORCE"||this.getProviderEnforcementState(e)==="AUDIT"}}async function lp(n,e){return Vt(n,"GET","/v2/recaptchaConfig",Ht(n,e))}/**
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
 */async function cp(n,e){return Vt(n,"POST","/v1/accounts:delete",e)}async function Uc(n,e){return Vt(n,"POST","/v1/accounts:lookup",e)}/**
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
 */function ri(n){if(n)try{const e=new Date(Number(n));if(!isNaN(e.getTime()))return e.toUTCString()}catch{}}async function dp(n,e=!1){const t=ve(n),i=await t.getIdToken(e),s=Po(i);B(s&&s.exp&&s.auth_time&&s.iat,t.auth,"internal-error");const r=typeof s.firebase=="object"?s.firebase:void 0,o=r==null?void 0:r.sign_in_provider;return{claims:s,token:i,authTime:ri(Er(s.auth_time)),issuedAtTime:ri(Er(s.iat)),expirationTime:ri(Er(s.exp)),signInProvider:o||null,signInSecondFactor:(r==null?void 0:r.sign_in_second_factor)||null}}function Er(n){return Number(n)*1e3}function Po(n){const[e,t,i]=n.split(".");if(e===void 0||t===void 0||i===void 0)return ls("JWT malformed, contained fewer than 3 sections"),null;try{const s=gs(t);return s?JSON.parse(s):(ls("Failed to decode base64 JWT payload"),null)}catch(s){return ls("Caught error parsing JWT payload as JSON",s==null?void 0:s.toString()),null}}function nl(n){const e=Po(n);return B(e,"internal-error"),B(typeof e.exp<"u","internal-error"),B(typeof e.iat<"u","internal-error"),Number(e.exp)-Number(e.iat)}/**
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
 */async function pi(n,e,t=!1){if(t)return e;try{return await e}catch(i){throw i instanceof Bt&&up(i)&&n.auth.currentUser===n&&await n.auth.signOut(),i}}function up({code:n}){return n==="auth/user-disabled"||n==="auth/user-token-expired"}/**
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
 */class hp{constructor(e){this.user=e,this.isRunning=!1,this.timerId=null,this.errorBackoff=3e4}_start(){this.isRunning||(this.isRunning=!0,this.schedule())}_stop(){this.isRunning&&(this.isRunning=!1,this.timerId!==null&&clearTimeout(this.timerId))}getInterval(e){var t;if(e){const i=this.errorBackoff;return this.errorBackoff=Math.min(this.errorBackoff*2,96e4),i}else{this.errorBackoff=3e4;const s=((t=this.user.stsTokenManager.expirationTime)!==null&&t!==void 0?t:0)-Date.now()-3e5;return Math.max(0,s)}}schedule(e=!1){if(!this.isRunning)return;const t=this.getInterval(e);this.timerId=setTimeout(async()=>{await this.iteration()},t)}async iteration(){try{await this.user.getIdToken(!0)}catch(e){(e==null?void 0:e.code)==="auth/network-request-failed"&&this.schedule(!0);return}this.schedule()}}/**
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
 */class Vr{constructor(e,t){this.createdAt=e,this.lastLoginAt=t,this._initializeTime()}_initializeTime(){this.lastSignInTime=ri(this.lastLoginAt),this.creationTime=ri(this.createdAt)}_copy(e){this.createdAt=e.createdAt,this.lastLoginAt=e.lastLoginAt,this._initializeTime()}toJSON(){return{createdAt:this.createdAt,lastLoginAt:this.lastLoginAt}}}/**
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
 */async function Es(n){var e;const t=n.auth,i=await n.getIdToken(),s=await pi(n,Uc(t,{idToken:i}));B(s==null?void 0:s.users.length,t,"internal-error");const r=s.users[0];n._notifyReloadListener(r);const o=!((e=r.providerUserInfo)===null||e===void 0)&&e.length?$c(r.providerUserInfo):[],a=pp(n.providerData,o),l=n.isAnonymous,c=!(n.email&&r.passwordHash)&&!(a!=null&&a.length),f=l?c:!1,u={uid:r.localId,displayName:r.displayName||null,photoURL:r.photoUrl||null,email:r.email||null,emailVerified:r.emailVerified||!1,phoneNumber:r.phoneNumber||null,tenantId:r.tenantId||null,providerData:a,metadata:new Vr(r.createdAt,r.lastLoginAt),isAnonymous:f};Object.assign(n,u)}async function fp(n){const e=ve(n);await Es(e),await e.auth._persistUserIfCurrent(e),e.auth._notifyListenersIfCurrent(e)}function pp(n,e){return[...n.filter(i=>!e.some(s=>s.providerId===i.providerId)),...e]}function $c(n){return n.map(e=>{var{providerId:t}=e,i=Ro(e,["providerId"]);return{providerId:t,uid:i.rawId||"",displayName:i.displayName||null,email:i.email||null,phoneNumber:i.phoneNumber||null,photoURL:i.photoUrl||null}})}/**
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
 */async function mp(n,e){const t=await Lc(n,{},async()=>{const i=Fn({grant_type:"refresh_token",refresh_token:e}).slice(1),{tokenApiHost:s,apiKey:r}=n.config,o=Fc(n,s,"/v1/token",`key=${r}`),a=await n._getAdditionalHeaders();return a["Content-Type"]="application/x-www-form-urlencoded",Mc.fetch()(o,{method:"POST",headers:a,body:i})});return{accessToken:t.access_token,expiresIn:t.expires_in,refreshToken:t.refresh_token}}async function gp(n,e){return Vt(n,"POST","/v2/accounts:revokeToken",Ht(n,e))}/**
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
 */class wn{constructor(){this.refreshToken=null,this.accessToken=null,this.expirationTime=null}get isExpired(){return!this.expirationTime||Date.now()>this.expirationTime-3e4}updateFromServerResponse(e){B(e.idToken,"internal-error"),B(typeof e.idToken<"u","internal-error"),B(typeof e.refreshToken<"u","internal-error");const t="expiresIn"in e&&typeof e.expiresIn<"u"?Number(e.expiresIn):nl(e.idToken);this.updateTokensAndExpiration(e.idToken,e.refreshToken,t)}updateFromIdToken(e){B(e.length!==0,"internal-error");const t=nl(e);this.updateTokensAndExpiration(e,null,t)}async getToken(e,t=!1){return!t&&this.accessToken&&!this.isExpired?this.accessToken:(B(this.refreshToken,e,"user-token-expired"),this.refreshToken?(await this.refresh(e,this.refreshToken),this.accessToken):null)}clearRefreshToken(){this.refreshToken=null}async refresh(e,t){const{accessToken:i,refreshToken:s,expiresIn:r}=await mp(e,t);this.updateTokensAndExpiration(i,s,Number(r))}updateTokensAndExpiration(e,t,i){this.refreshToken=t||null,this.accessToken=e||null,this.expirationTime=Date.now()+i*1e3}static fromJSON(e,t){const{refreshToken:i,accessToken:s,expirationTime:r}=t,o=new wn;return i&&(B(typeof i=="string","internal-error",{appName:e}),o.refreshToken=i),s&&(B(typeof s=="string","internal-error",{appName:e}),o.accessToken=s),r&&(B(typeof r=="number","internal-error",{appName:e}),o.expirationTime=r),o}toJSON(){return{refreshToken:this.refreshToken,accessToken:this.accessToken,expirationTime:this.expirationTime}}_assign(e){this.accessToken=e.accessToken,this.refreshToken=e.refreshToken,this.expirationTime=e.expirationTime}_clone(){return Object.assign(new wn,this.toJSON())}_performRefresh(){return ft("not implemented")}}/**
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
 */function It(n,e){B(typeof n=="string"||typeof n>"u","internal-error",{appName:e})}class pt{constructor(e){var{uid:t,auth:i,stsTokenManager:s}=e,r=Ro(e,["uid","auth","stsTokenManager"]);this.providerId="firebase",this.proactiveRefresh=new hp(this),this.reloadUserInfo=null,this.reloadListener=null,this.uid=t,this.auth=i,this.stsTokenManager=s,this.accessToken=s.accessToken,this.displayName=r.displayName||null,this.email=r.email||null,this.emailVerified=r.emailVerified||!1,this.phoneNumber=r.phoneNumber||null,this.photoURL=r.photoURL||null,this.isAnonymous=r.isAnonymous||!1,this.tenantId=r.tenantId||null,this.providerData=r.providerData?[...r.providerData]:[],this.metadata=new Vr(r.createdAt||void 0,r.lastLoginAt||void 0)}async getIdToken(e){const t=await pi(this,this.stsTokenManager.getToken(this.auth,e));return B(t,this.auth,"internal-error"),this.accessToken!==t&&(this.accessToken=t,await this.auth._persistUserIfCurrent(this),this.auth._notifyListenersIfCurrent(this)),t}getIdTokenResult(e){return dp(this,e)}reload(){return fp(this)}_assign(e){this!==e&&(B(this.uid===e.uid,this.auth,"internal-error"),this.displayName=e.displayName,this.photoURL=e.photoURL,this.email=e.email,this.emailVerified=e.emailVerified,this.phoneNumber=e.phoneNumber,this.isAnonymous=e.isAnonymous,this.tenantId=e.tenantId,this.providerData=e.providerData.map(t=>Object.assign({},t)),this.metadata._copy(e.metadata),this.stsTokenManager._assign(e.stsTokenManager))}_clone(e){const t=new pt(Object.assign(Object.assign({},this),{auth:e,stsTokenManager:this.stsTokenManager._clone()}));return t.metadata._copy(this.metadata),t}_onReload(e){B(!this.reloadListener,this.auth,"internal-error"),this.reloadListener=e,this.reloadUserInfo&&(this._notifyReloadListener(this.reloadUserInfo),this.reloadUserInfo=null)}_notifyReloadListener(e){this.reloadListener?this.reloadListener(e):this.reloadUserInfo=e}_startProactiveRefresh(){this.proactiveRefresh._start()}_stopProactiveRefresh(){this.proactiveRefresh._stop()}async _updateTokensIfNecessary(e,t=!1){let i=!1;e.idToken&&e.idToken!==this.stsTokenManager.accessToken&&(this.stsTokenManager.updateFromServerResponse(e),i=!0),t&&await Es(this),await this.auth._persistUserIfCurrent(this),i&&this.auth._notifyListenersIfCurrent(this)}async delete(){if(ot(this.auth.app))return Promise.reject(yt(this.auth));const e=await this.getIdToken();return await pi(this,cp(this.auth,{idToken:e})),this.stsTokenManager.clearRefreshToken(),this.auth.signOut()}toJSON(){return Object.assign(Object.assign({uid:this.uid,email:this.email||void 0,emailVerified:this.emailVerified,displayName:this.displayName||void 0,isAnonymous:this.isAnonymous,photoURL:this.photoURL||void 0,phoneNumber:this.phoneNumber||void 0,tenantId:this.tenantId||void 0,providerData:this.providerData.map(e=>Object.assign({},e)),stsTokenManager:this.stsTokenManager.toJSON(),_redirectEventId:this._redirectEventId},this.metadata.toJSON()),{apiKey:this.auth.config.apiKey,appName:this.auth.name})}get refreshToken(){return this.stsTokenManager.refreshToken||""}static _fromJSON(e,t){var i,s,r,o,a,l,c,f;const u=(i=t.displayName)!==null&&i!==void 0?i:void 0,_=(s=t.email)!==null&&s!==void 0?s:void 0,m=(r=t.phoneNumber)!==null&&r!==void 0?r:void 0,w=(o=t.photoURL)!==null&&o!==void 0?o:void 0,x=(a=t.tenantId)!==null&&a!==void 0?a:void 0,R=(l=t._redirectEventId)!==null&&l!==void 0?l:void 0,H=(c=t.createdAt)!==null&&c!==void 0?c:void 0,V=(f=t.lastLoginAt)!==null&&f!==void 0?f:void 0,{uid:j,emailVerified:N,isAnonymous:G,providerData:k,stsTokenManager:O}=t;B(j&&O,e,"internal-error");const ee=wn.fromJSON(this.name,O);B(typeof j=="string",e,"internal-error"),It(u,e.name),It(_,e.name),B(typeof N=="boolean",e,"internal-error"),B(typeof G=="boolean",e,"internal-error"),It(m,e.name),It(w,e.name),It(x,e.name),It(R,e.name),It(H,e.name),It(V,e.name);const L=new pt({uid:j,auth:e,email:_,emailVerified:N,displayName:u,isAnonymous:G,photoURL:w,phoneNumber:m,tenantId:x,stsTokenManager:ee,createdAt:H,lastLoginAt:V});return k&&Array.isArray(k)&&(L.providerData=k.map(te=>Object.assign({},te))),R&&(L._redirectEventId=R),L}static async _fromIdTokenResponse(e,t,i=!1){const s=new wn;s.updateFromServerResponse(t);const r=new pt({uid:t.localId,auth:e,stsTokenManager:s,isAnonymous:i});return await Es(r),r}static async _fromGetAccountInfoResponse(e,t,i){const s=t.users[0];B(s.localId!==void 0,"internal-error");const r=s.providerUserInfo!==void 0?$c(s.providerUserInfo):[],o=!(s.email&&s.passwordHash)&&!(r!=null&&r.length),a=new wn;a.updateFromIdToken(i);const l=new pt({uid:s.localId,auth:e,stsTokenManager:a,isAnonymous:o}),c={uid:s.localId,displayName:s.displayName||null,photoURL:s.photoUrl||null,email:s.email||null,emailVerified:s.emailVerified||!1,phoneNumber:s.phoneNumber||null,tenantId:s.tenantId||null,providerData:r,metadata:new Vr(s.createdAt,s.lastLoginAt),isAnonymous:!(s.email&&s.passwordHash)&&!(r!=null&&r.length)};return Object.assign(l,c),l}}/**
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
 */const il=new Map;function mt(n){bt(n instanceof Function,"Expected a class definition");let e=il.get(n);return e?(bt(e instanceof n,"Instance stored in cache mismatched with class"),e):(e=new n,il.set(n,e),e)}/**
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
 */class Wc{constructor(){this.type="NONE",this.storage={}}async _isAvailable(){return!0}async _set(e,t){this.storage[e]=t}async _get(e){const t=this.storage[e];return t===void 0?null:t}async _remove(e){delete this.storage[e]}_addListener(e,t){}_removeListener(e,t){}}Wc.type="NONE";const sl=Wc;/**
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
 */function cs(n,e,t){return`firebase:${n}:${e}:${t}`}class bn{constructor(e,t,i){this.persistence=e,this.auth=t,this.userKey=i;const{config:s,name:r}=this.auth;this.fullUserKey=cs(this.userKey,s.apiKey,r),this.fullPersistenceKey=cs("persistence",s.apiKey,r),this.boundEventHandler=t._onStorageEvent.bind(t),this.persistence._addListener(this.fullUserKey,this.boundEventHandler)}setCurrentUser(e){return this.persistence._set(this.fullUserKey,e.toJSON())}async getCurrentUser(){const e=await this.persistence._get(this.fullUserKey);return e?pt._fromJSON(this.auth,e):null}removeCurrentUser(){return this.persistence._remove(this.fullUserKey)}savePersistenceForRedirect(){return this.persistence._set(this.fullPersistenceKey,this.persistence.type)}async setPersistence(e){if(this.persistence===e)return;const t=await this.getCurrentUser();if(await this.removeCurrentUser(),this.persistence=e,t)return this.setCurrentUser(t)}delete(){this.persistence._removeListener(this.fullUserKey,this.boundEventHandler)}static async create(e,t,i="authUser"){if(!t.length)return new bn(mt(sl),e,i);const s=(await Promise.all(t.map(async c=>{if(await c._isAvailable())return c}))).filter(c=>c);let r=s[0]||mt(sl);const o=cs(i,e.config.apiKey,e.name);let a=null;for(const c of t)try{const f=await c._get(o);if(f){const u=pt._fromJSON(e,f);c!==r&&(a=u),r=c;break}}catch{}const l=s.filter(c=>c._shouldAllowMigration);return!r._shouldAllowMigration||!l.length?new bn(r,e,i):(r=l[0],a&&await r._set(o,a.toJSON()),await Promise.all(t.map(async c=>{if(c!==r)try{await c._remove(o)}catch{}})),new bn(r,e,i))}}/**
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
 */function rl(n){const e=n.toLowerCase();if(e.includes("opera/")||e.includes("opr/")||e.includes("opios/"))return"Opera";if(jc(e))return"IEMobile";if(e.includes("msie")||e.includes("trident/"))return"IE";if(e.includes("edge/"))return"Edge";if(Bc(e))return"Firefox";if(e.includes("silk/"))return"Silk";if(Gc(e))return"Blackberry";if(zc(e))return"Webos";if(Hc(e))return"Safari";if((e.includes("chrome/")||Vc(e))&&!e.includes("edge/"))return"Chrome";if(qc(e))return"Android";{const t=/([a-zA-Z\d\.]+)\/[a-zA-Z\d\.]*$/,i=n.match(t);if((i==null?void 0:i.length)===2)return i[1]}return"Other"}function Bc(n=Oe()){return/firefox\//i.test(n)}function Hc(n=Oe()){const e=n.toLowerCase();return e.includes("safari/")&&!e.includes("chrome/")&&!e.includes("crios/")&&!e.includes("android")}function Vc(n=Oe()){return/crios\//i.test(n)}function jc(n=Oe()){return/iemobile/i.test(n)}function qc(n=Oe()){return/android/i.test(n)}function Gc(n=Oe()){return/blackberry/i.test(n)}function zc(n=Oe()){return/webos/i.test(n)}function No(n=Oe()){return/iphone|ipad|ipod/i.test(n)||/macintosh/i.test(n)&&/mobile/i.test(n)}function _p(n=Oe()){var e;return No(n)&&!!(!((e=window.navigator)===null||e===void 0)&&e.standalone)}function yp(){return xh()&&document.documentMode===10}function Kc(n=Oe()){return No(n)||qc(n)||zc(n)||Gc(n)||/windows phone/i.test(n)||jc(n)}/**
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
 */function Yc(n,e=[]){let t;switch(n){case"Browser":t=rl(Oe());break;case"Worker":t=`${rl(Oe())}-${n}`;break;default:t=n}const i=e.length?e.join(","):"FirebaseCore-web";return`${t}/JsCore/${Un}/${i}`}/**
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
 */class vp{constructor(e){this.auth=e,this.queue=[]}pushCallback(e,t){const i=r=>new Promise((o,a)=>{try{const l=e(r);o(l)}catch(l){a(l)}});i.onAbort=t,this.queue.push(i);const s=this.queue.length-1;return()=>{this.queue[s]=()=>Promise.resolve()}}async runMiddleware(e){if(this.auth.currentUser===e)return;const t=[];try{for(const i of this.queue)await i(e),i.onAbort&&t.push(i.onAbort)}catch(i){t.reverse();for(const s of t)try{s()}catch{}throw this.auth._errorFactory.create("login-blocked",{originalMessage:i==null?void 0:i.message})}}}/**
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
 */async function wp(n,e={}){return Vt(n,"GET","/v2/passwordPolicy",Ht(n,e))}/**
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
 */const bp=6;class Ep{constructor(e){var t,i,s,r;const o=e.customStrengthOptions;this.customStrengthOptions={},this.customStrengthOptions.minPasswordLength=(t=o.minPasswordLength)!==null&&t!==void 0?t:bp,o.maxPasswordLength&&(this.customStrengthOptions.maxPasswordLength=o.maxPasswordLength),o.containsLowercaseCharacter!==void 0&&(this.customStrengthOptions.containsLowercaseLetter=o.containsLowercaseCharacter),o.containsUppercaseCharacter!==void 0&&(this.customStrengthOptions.containsUppercaseLetter=o.containsUppercaseCharacter),o.containsNumericCharacter!==void 0&&(this.customStrengthOptions.containsNumericCharacter=o.containsNumericCharacter),o.containsNonAlphanumericCharacter!==void 0&&(this.customStrengthOptions.containsNonAlphanumericCharacter=o.containsNonAlphanumericCharacter),this.enforcementState=e.enforcementState,this.enforcementState==="ENFORCEMENT_STATE_UNSPECIFIED"&&(this.enforcementState="OFF"),this.allowedNonAlphanumericCharacters=(s=(i=e.allowedNonAlphanumericCharacters)===null||i===void 0?void 0:i.join(""))!==null&&s!==void 0?s:"",this.forceUpgradeOnSignin=(r=e.forceUpgradeOnSignin)!==null&&r!==void 0?r:!1,this.schemaVersion=e.schemaVersion}validatePassword(e){var t,i,s,r,o,a;const l={isValid:!0,passwordPolicy:this};return this.validatePasswordLengthOptions(e,l),this.validatePasswordCharacterOptions(e,l),l.isValid&&(l.isValid=(t=l.meetsMinPasswordLength)!==null&&t!==void 0?t:!0),l.isValid&&(l.isValid=(i=l.meetsMaxPasswordLength)!==null&&i!==void 0?i:!0),l.isValid&&(l.isValid=(s=l.containsLowercaseLetter)!==null&&s!==void 0?s:!0),l.isValid&&(l.isValid=(r=l.containsUppercaseLetter)!==null&&r!==void 0?r:!0),l.isValid&&(l.isValid=(o=l.containsNumericCharacter)!==null&&o!==void 0?o:!0),l.isValid&&(l.isValid=(a=l.containsNonAlphanumericCharacter)!==null&&a!==void 0?a:!0),l}validatePasswordLengthOptions(e,t){const i=this.customStrengthOptions.minPasswordLength,s=this.customStrengthOptions.maxPasswordLength;i&&(t.meetsMinPasswordLength=e.length>=i),s&&(t.meetsMaxPasswordLength=e.length<=s)}validatePasswordCharacterOptions(e,t){this.updatePasswordCharacterOptionsStatuses(t,!1,!1,!1,!1);let i;for(let s=0;s<e.length;s++)i=e.charAt(s),this.updatePasswordCharacterOptionsStatuses(t,i>="a"&&i<="z",i>="A"&&i<="Z",i>="0"&&i<="9",this.allowedNonAlphanumericCharacters.includes(i))}updatePasswordCharacterOptionsStatuses(e,t,i,s,r){this.customStrengthOptions.containsLowercaseLetter&&(e.containsLowercaseLetter||(e.containsLowercaseLetter=t)),this.customStrengthOptions.containsUppercaseLetter&&(e.containsUppercaseLetter||(e.containsUppercaseLetter=i)),this.customStrengthOptions.containsNumericCharacter&&(e.containsNumericCharacter||(e.containsNumericCharacter=s)),this.customStrengthOptions.containsNonAlphanumericCharacter&&(e.containsNonAlphanumericCharacter||(e.containsNonAlphanumericCharacter=r))}}/**
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
 */class Cp{constructor(e,t,i,s){this.app=e,this.heartbeatServiceProvider=t,this.appCheckServiceProvider=i,this.config=s,this.currentUser=null,this.emulatorConfig=null,this.operations=Promise.resolve(),this.authStateSubscription=new ol(this),this.idTokenSubscription=new ol(this),this.beforeStateQueue=new vp(this),this.redirectUser=null,this.isProactiveRefreshEnabled=!1,this.EXPECTED_PASSWORD_POLICY_SCHEMA_VERSION=1,this._canInitEmulator=!0,this._isInitialized=!1,this._deleted=!1,this._initializationPromise=null,this._popupRedirectResolver=null,this._errorFactory=Oc,this._agentRecaptchaConfig=null,this._tenantRecaptchaConfigs={},this._projectPasswordPolicy=null,this._tenantPasswordPolicies={},this.lastNotifiedUid=void 0,this.languageCode=null,this.tenantId=null,this.settings={appVerificationDisabledForTesting:!1},this.frameworks=[],this.name=e.name,this.clientVersion=s.sdkClientVersion}_initializeWithPersistence(e,t){return t&&(this._popupRedirectResolver=mt(t)),this._initializationPromise=this.queue(async()=>{var i,s;if(!this._deleted&&(this.persistenceManager=await bn.create(this,e),!this._deleted)){if(!((i=this._popupRedirectResolver)===null||i===void 0)&&i._shouldInitProactively)try{await this._popupRedirectResolver._initialize(this)}catch{}await this.initializeCurrentUser(t),this.lastNotifiedUid=((s=this.currentUser)===null||s===void 0?void 0:s.uid)||null,!this._deleted&&(this._isInitialized=!0)}}),this._initializationPromise}async _onStorageEvent(){if(this._deleted)return;const e=await this.assertedPersistence.getCurrentUser();if(!(!this.currentUser&&!e)){if(this.currentUser&&e&&this.currentUser.uid===e.uid){this._currentUser._assign(e),await this.currentUser.getIdToken();return}await this._updateCurrentUser(e,!0)}}async initializeCurrentUserFromIdToken(e){try{const t=await Uc(this,{idToken:e}),i=await pt._fromGetAccountInfoResponse(this,t,e);await this.directlySetCurrentUser(i)}catch(t){console.warn("FirebaseServerApp could not login user with provided authIdToken: ",t),await this.directlySetCurrentUser(null)}}async initializeCurrentUser(e){var t;if(ot(this.app)){const o=this.app.settings.authIdToken;return o?new Promise(a=>{setTimeout(()=>this.initializeCurrentUserFromIdToken(o).then(a,a))}):this.directlySetCurrentUser(null)}const i=await this.assertedPersistence.getCurrentUser();let s=i,r=!1;if(e&&this.config.authDomain){await this.getOrInitRedirectPersistenceManager();const o=(t=this.redirectUser)===null||t===void 0?void 0:t._redirectEventId,a=s==null?void 0:s._redirectEventId,l=await this.tryRedirectSignIn(e);(!o||o===a)&&(l!=null&&l.user)&&(s=l.user,r=!0)}if(!s)return this.directlySetCurrentUser(null);if(!s._redirectEventId){if(r)try{await this.beforeStateQueue.runMiddleware(s)}catch(o){s=i,this._popupRedirectResolver._overrideRedirectResult(this,()=>Promise.reject(o))}return s?this.reloadAndSetCurrentUserOrClear(s):this.directlySetCurrentUser(null)}return B(this._popupRedirectResolver,this,"argument-error"),await this.getOrInitRedirectPersistenceManager(),this.redirectUser&&this.redirectUser._redirectEventId===s._redirectEventId?this.directlySetCurrentUser(s):this.reloadAndSetCurrentUserOrClear(s)}async tryRedirectSignIn(e){let t=null;try{t=await this._popupRedirectResolver._completeRedirectFn(this,e,!0)}catch{await this._setRedirectUser(null)}return t}async reloadAndSetCurrentUserOrClear(e){try{await Es(e)}catch(t){if((t==null?void 0:t.code)!=="auth/network-request-failed")return this.directlySetCurrentUser(null)}return this.directlySetCurrentUser(e)}useDeviceLanguage(){this.languageCode=np()}async _delete(){this._deleted=!0}async updateCurrentUser(e){if(ot(this.app))return Promise.reject(yt(this));const t=e?ve(e):null;return t&&B(t.auth.config.apiKey===this.config.apiKey,this,"invalid-user-token"),this._updateCurrentUser(t&&t._clone(this))}async _updateCurrentUser(e,t=!1){if(!this._deleted)return e&&B(this.tenantId===e.tenantId,this,"tenant-id-mismatch"),t||await this.beforeStateQueue.runMiddleware(e),this.queue(async()=>{await this.directlySetCurrentUser(e),this.notifyAuthListeners()})}async signOut(){return ot(this.app)?Promise.reject(yt(this)):(await this.beforeStateQueue.runMiddleware(null),(this.redirectPersistenceManager||this._popupRedirectResolver)&&await this._setRedirectUser(null),this._updateCurrentUser(null,!0))}setPersistence(e){return ot(this.app)?Promise.reject(yt(this)):this.queue(async()=>{await this.assertedPersistence.setPersistence(mt(e))})}_getRecaptchaConfig(){return this.tenantId==null?this._agentRecaptchaConfig:this._tenantRecaptchaConfigs[this.tenantId]}async validatePassword(e){this._getPasswordPolicyInternal()||await this._updatePasswordPolicy();const t=this._getPasswordPolicyInternal();return t.schemaVersion!==this.EXPECTED_PASSWORD_POLICY_SCHEMA_VERSION?Promise.reject(this._errorFactory.create("unsupported-password-policy-schema-version",{})):t.validatePassword(e)}_getPasswordPolicyInternal(){return this.tenantId===null?this._projectPasswordPolicy:this._tenantPasswordPolicies[this.tenantId]}async _updatePasswordPolicy(){const e=await wp(this),t=new Ep(e);this.tenantId===null?this._projectPasswordPolicy=t:this._tenantPasswordPolicies[this.tenantId]=t}_getPersistence(){return this.assertedPersistence.persistence.type}_updateErrorMap(e){this._errorFactory=new Ri("auth","Firebase",e())}onAuthStateChanged(e,t,i){return this.registerStateListener(this.authStateSubscription,e,t,i)}beforeAuthStateChanged(e,t){return this.beforeStateQueue.pushCallback(e,t)}onIdTokenChanged(e,t,i){return this.registerStateListener(this.idTokenSubscription,e,t,i)}authStateReady(){return new Promise((e,t)=>{if(this.currentUser)e();else{const i=this.onAuthStateChanged(()=>{i(),e()},t)}})}async revokeAccessToken(e){if(this.currentUser){const t=await this.currentUser.getIdToken(),i={providerId:"apple.com",tokenType:"ACCESS_TOKEN",token:e,idToken:t};this.tenantId!=null&&(i.tenantId=this.tenantId),await gp(this,i)}}toJSON(){var e;return{apiKey:this.config.apiKey,authDomain:this.config.authDomain,appName:this.name,currentUser:(e=this._currentUser)===null||e===void 0?void 0:e.toJSON()}}async _setRedirectUser(e,t){const i=await this.getOrInitRedirectPersistenceManager(t);return e===null?i.removeCurrentUser():i.setCurrentUser(e)}async getOrInitRedirectPersistenceManager(e){if(!this.redirectPersistenceManager){const t=e&&mt(e)||this._popupRedirectResolver;B(t,this,"argument-error"),this.redirectPersistenceManager=await bn.create(this,[mt(t._redirectPersistence)],"redirectUser"),this.redirectUser=await this.redirectPersistenceManager.getCurrentUser()}return this.redirectPersistenceManager}async _redirectUserForId(e){var t,i;return this._isInitialized&&await this.queue(async()=>{}),((t=this._currentUser)===null||t===void 0?void 0:t._redirectEventId)===e?this._currentUser:((i=this.redirectUser)===null||i===void 0?void 0:i._redirectEventId)===e?this.redirectUser:null}async _persistUserIfCurrent(e){if(e===this.currentUser)return this.queue(async()=>this.directlySetCurrentUser(e))}_notifyListenersIfCurrent(e){e===this.currentUser&&this.notifyAuthListeners()}_key(){return`${this.config.authDomain}:${this.config.apiKey}:${this.name}`}_startProactiveRefresh(){this.isProactiveRefreshEnabled=!0,this.currentUser&&this._currentUser._startProactiveRefresh()}_stopProactiveRefresh(){this.isProactiveRefreshEnabled=!1,this.currentUser&&this._currentUser._stopProactiveRefresh()}get _currentUser(){return this.currentUser}notifyAuthListeners(){var e,t;if(!this._isInitialized)return;this.idTokenSubscription.next(this.currentUser);const i=(t=(e=this.currentUser)===null||e===void 0?void 0:e.uid)!==null&&t!==void 0?t:null;this.lastNotifiedUid!==i&&(this.lastNotifiedUid=i,this.authStateSubscription.next(this.currentUser))}registerStateListener(e,t,i,s){if(this._deleted)return()=>{};const r=typeof t=="function"?t:t.next.bind(t);let o=!1;const a=this._isInitialized?Promise.resolve():this._initializationPromise;if(B(a,this,"internal-error"),a.then(()=>{o||r(this.currentUser)}),typeof t=="function"){const l=e.addObserver(t,i,s);return()=>{o=!0,l()}}else{const l=e.addObserver(t);return()=>{o=!0,l()}}}async directlySetCurrentUser(e){this.currentUser&&this.currentUser!==e&&this._currentUser._stopProactiveRefresh(),e&&this.isProactiveRefreshEnabled&&e._startProactiveRefresh(),this.currentUser=e,e?await this.assertedPersistence.setCurrentUser(e):await this.assertedPersistence.removeCurrentUser()}queue(e){return this.operations=this.operations.then(e,e),this.operations}get assertedPersistence(){return B(this.persistenceManager,this,"internal-error"),this.persistenceManager}_logFramework(e){!e||this.frameworks.includes(e)||(this.frameworks.push(e),this.frameworks.sort(),this.clientVersion=Yc(this.config.clientPlatform,this._getFrameworks()))}_getFrameworks(){return this.frameworks}async _getAdditionalHeaders(){var e;const t={"X-Client-Version":this.clientVersion};this.app.options.appId&&(t["X-Firebase-gmpid"]=this.app.options.appId);const i=await((e=this.heartbeatServiceProvider.getImmediate({optional:!0}))===null||e===void 0?void 0:e.getHeartbeatsHeader());i&&(t["X-Firebase-Client"]=i);const s=await this._getAppCheckToken();return s&&(t["X-Firebase-AppCheck"]=s),t}async _getAppCheckToken(){var e;const t=await((e=this.appCheckServiceProvider.getImmediate({optional:!0}))===null||e===void 0?void 0:e.getToken());return t!=null&&t.error&&Zf(`Error while retrieving App Check token: ${t.error}`),t==null?void 0:t.token}}function dn(n){return ve(n)}class ol{constructor(e){this.auth=e,this.observer=null,this.addObserver=Wh(t=>this.observer=t)}get next(){return B(this.observer,this.auth,"internal-error"),this.observer.next.bind(this.observer)}}/**
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
 */let qs={async loadJS(){throw new Error("Unable to load external scripts")},recaptchaV2Script:"",recaptchaEnterpriseScript:"",gapiScript:""};function Ip(n){qs=n}function Qc(n){return qs.loadJS(n)}function Sp(){return qs.recaptchaEnterpriseScript}function Tp(){return qs.gapiScript}function kp(n){return`__${n}${Math.floor(Math.random()*1e6)}`}const Rp="recaptcha-enterprise",Ap="NO_RECAPTCHA";class xp{constructor(e){this.type=Rp,this.auth=dn(e)}async verify(e="verify",t=!1){async function i(r){if(!t){if(r.tenantId==null&&r._agentRecaptchaConfig!=null)return r._agentRecaptchaConfig.siteKey;if(r.tenantId!=null&&r._tenantRecaptchaConfigs[r.tenantId]!==void 0)return r._tenantRecaptchaConfigs[r.tenantId].siteKey}return new Promise(async(o,a)=>{lp(r,{clientType:"CLIENT_TYPE_WEB",version:"RECAPTCHA_ENTERPRISE"}).then(l=>{if(l.recaptchaKey===void 0)a(new Error("recaptcha Enterprise site key undefined"));else{const c=new ap(l);return r.tenantId==null?r._agentRecaptchaConfig=c:r._tenantRecaptchaConfigs[r.tenantId]=c,o(c.siteKey)}}).catch(l=>{a(l)})})}function s(r,o,a){const l=window.grecaptcha;tl(l)?l.enterprise.ready(()=>{l.enterprise.execute(r,{action:e}).then(c=>{o(c)}).catch(()=>{o(Ap)})}):a(Error("No reCAPTCHA enterprise script loaded."))}return new Promise((r,o)=>{i(this.auth).then(a=>{if(!t&&tl(window.grecaptcha))s(a,r,o);else{if(typeof window>"u"){o(new Error("RecaptchaVerifier is only supported in browser"));return}let l=Sp();l.length!==0&&(l+=a),Qc(l).then(()=>{s(a,r,o)}).catch(c=>{o(c)})}}).catch(a=>{o(a)})})}}async function al(n,e,t,i=!1){const s=new xp(n);let r;try{r=await s.verify(t)}catch{r=await s.verify(t,!0)}const o=Object.assign({},e);return i?Object.assign(o,{captchaResp:r}):Object.assign(o,{captchaResponse:r}),Object.assign(o,{clientType:"CLIENT_TYPE_WEB"}),Object.assign(o,{recaptchaVersion:"RECAPTCHA_ENTERPRISE"}),o}async function jr(n,e,t,i){var s;if(!((s=n._getRecaptchaConfig())===null||s===void 0)&&s.isProviderEnabled("EMAIL_PASSWORD_PROVIDER")){const r=await al(n,e,t,t==="getOobCode");return i(n,r)}else return i(n,e).catch(async r=>{if(r.code==="auth/missing-recaptcha-token"){console.log(`${t} is protected by reCAPTCHA Enterprise for this project. Automatically triggering the reCAPTCHA flow and restarting the flow.`);const o=await al(n,e,t,t==="getOobCode");return i(n,o)}else return Promise.reject(r)})}/**
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
 */function Pp(n,e){const t=ko(n,"auth");if(t.isInitialized()){const s=t.getImmediate(),r=t.getOptions();if(vs(r,e??{}))return s;et(s,"already-initialized")}return t.initialize({options:e})}function Np(n,e){const t=(e==null?void 0:e.persistence)||[],i=(Array.isArray(t)?t:[t]).map(mt);e!=null&&e.errorMap&&n._updateErrorMap(e.errorMap),n._initializeWithPersistence(i,e==null?void 0:e.popupRedirectResolver)}function Op(n,e,t){const i=dn(n);B(i._canInitEmulator,i,"emulator-config-failed"),B(/^https?:\/\//.test(e),i,"invalid-emulator-scheme");const s=!1,r=Jc(e),{host:o,port:a}=Dp(e),l=a===null?"":`:${a}`;i.config.emulator={url:`${r}//${o}${l}/`},i.settings.appVerificationDisabledForTesting=!0,i.emulatorConfig=Object.freeze({host:o,port:a,protocol:r.replace(":",""),options:Object.freeze({disableWarnings:s})}),Mp()}function Jc(n){const e=n.indexOf(":");return e<0?"":n.substr(0,e+1)}function Dp(n){const e=Jc(n),t=/(\/\/)?([^?#/]+)/.exec(n.substr(e.length));if(!t)return{host:"",port:null};const i=t[2].split("@").pop()||"",s=/^(\[[^\]]+\])(:|$)/.exec(i);if(s){const r=s[1];return{host:r,port:ll(i.substr(r.length+1))}}else{const[r,o]=i.split(":");return{host:r,port:ll(o)}}}function ll(n){if(!n)return null;const e=Number(n);return isNaN(e)?null:e}function Mp(){function n(){const e=document.createElement("p"),t=e.style;e.innerText="Running in emulator mode. Do not use with production credentials.",t.position="fixed",t.width="100%",t.backgroundColor="#ffffff",t.border=".1em solid #000000",t.color="#b50000",t.bottom="0px",t.left="0px",t.margin="0px",t.zIndex="10000",t.textAlign="center",e.classList.add("firebase-emulator-warning"),document.body.appendChild(e)}typeof console<"u"&&typeof console.info=="function"&&console.info("WARNING: You are using the Auth Emulator, which is intended for local testing only.  Do not use with production credentials."),typeof window<"u"&&typeof document<"u"&&(document.readyState==="loading"?window.addEventListener("DOMContentLoaded",n):n())}/**
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
 */class Oo{constructor(e,t){this.providerId=e,this.signInMethod=t}toJSON(){return ft("not implemented")}_getIdTokenResponse(e){return ft("not implemented")}_linkToIdToken(e,t){return ft("not implemented")}_getReauthenticationResolver(e){return ft("not implemented")}}async function Lp(n,e){return Vt(n,"POST","/v1/accounts:signUp",e)}/**
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
 */async function Fp(n,e){return xi(n,"POST","/v1/accounts:signInWithPassword",Ht(n,e))}/**
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
 */async function Up(n,e){return xi(n,"POST","/v1/accounts:signInWithEmailLink",Ht(n,e))}async function $p(n,e){return xi(n,"POST","/v1/accounts:signInWithEmailLink",Ht(n,e))}/**
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
 */class mi extends Oo{constructor(e,t,i,s=null){super("password",i),this._email=e,this._password=t,this._tenantId=s}static _fromEmailAndPassword(e,t){return new mi(e,t,"password")}static _fromEmailAndCode(e,t,i=null){return new mi(e,t,"emailLink",i)}toJSON(){return{email:this._email,password:this._password,signInMethod:this.signInMethod,tenantId:this._tenantId}}static fromJSON(e){const t=typeof e=="string"?JSON.parse(e):e;if(t!=null&&t.email&&(t!=null&&t.password)){if(t.signInMethod==="password")return this._fromEmailAndPassword(t.email,t.password);if(t.signInMethod==="emailLink")return this._fromEmailAndCode(t.email,t.password,t.tenantId)}return null}async _getIdTokenResponse(e){switch(this.signInMethod){case"password":const t={returnSecureToken:!0,email:this._email,password:this._password,clientType:"CLIENT_TYPE_WEB"};return jr(e,t,"signInWithPassword",Fp);case"emailLink":return Up(e,{email:this._email,oobCode:this._password});default:et(e,"internal-error")}}async _linkToIdToken(e,t){switch(this.signInMethod){case"password":const i={idToken:t,returnSecureToken:!0,email:this._email,password:this._password,clientType:"CLIENT_TYPE_WEB"};return jr(e,i,"signUpPassword",Lp);case"emailLink":return $p(e,{idToken:t,email:this._email,oobCode:this._password});default:et(e,"internal-error")}}_getReauthenticationResolver(e){return this._getIdTokenResponse(e)}}/**
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
 */async function En(n,e){return xi(n,"POST","/v1/accounts:signInWithIdp",Ht(n,e))}/**
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
 */const Wp="http://localhost";class rn extends Oo{constructor(){super(...arguments),this.pendingToken=null}static _fromParams(e){const t=new rn(e.providerId,e.signInMethod);return e.idToken||e.accessToken?(e.idToken&&(t.idToken=e.idToken),e.accessToken&&(t.accessToken=e.accessToken),e.nonce&&!e.pendingToken&&(t.nonce=e.nonce),e.pendingToken&&(t.pendingToken=e.pendingToken)):e.oauthToken&&e.oauthTokenSecret?(t.accessToken=e.oauthToken,t.secret=e.oauthTokenSecret):et("argument-error"),t}toJSON(){return{idToken:this.idToken,accessToken:this.accessToken,secret:this.secret,nonce:this.nonce,pendingToken:this.pendingToken,providerId:this.providerId,signInMethod:this.signInMethod}}static fromJSON(e){const t=typeof e=="string"?JSON.parse(e):e,{providerId:i,signInMethod:s}=t,r=Ro(t,["providerId","signInMethod"]);if(!i||!s)return null;const o=new rn(i,s);return o.idToken=r.idToken||void 0,o.accessToken=r.accessToken||void 0,o.secret=r.secret,o.nonce=r.nonce,o.pendingToken=r.pendingToken||null,o}_getIdTokenResponse(e){const t=this.buildRequest();return En(e,t)}_linkToIdToken(e,t){const i=this.buildRequest();return i.idToken=t,En(e,i)}_getReauthenticationResolver(e){const t=this.buildRequest();return t.autoCreate=!1,En(e,t)}buildRequest(){const e={requestUri:Wp,returnSecureToken:!0};if(this.pendingToken)e.pendingToken=this.pendingToken;else{const t={};this.idToken&&(t.id_token=this.idToken),this.accessToken&&(t.access_token=this.accessToken),this.secret&&(t.oauth_token_secret=this.secret),t.providerId=this.providerId,this.nonce&&!this.pendingToken&&(t.nonce=this.nonce),e.postBody=Fn(t)}return e}}/**
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
 */function Bp(n){switch(n){case"recoverEmail":return"RECOVER_EMAIL";case"resetPassword":return"PASSWORD_RESET";case"signIn":return"EMAIL_SIGNIN";case"verifyEmail":return"VERIFY_EMAIL";case"verifyAndChangeEmail":return"VERIFY_AND_CHANGE_EMAIL";case"revertSecondFactorAddition":return"REVERT_SECOND_FACTOR_ADDITION";default:return null}}function Hp(n){const e=ei(ti(n)).link,t=e?ei(ti(e)).deep_link_id:null,i=ei(ti(n)).deep_link_id;return(i?ei(ti(i)).link:null)||i||t||e||n}class Do{constructor(e){var t,i,s,r,o,a;const l=ei(ti(e)),c=(t=l.apiKey)!==null&&t!==void 0?t:null,f=(i=l.oobCode)!==null&&i!==void 0?i:null,u=Bp((s=l.mode)!==null&&s!==void 0?s:null);B(c&&f&&u,"argument-error"),this.apiKey=c,this.operation=u,this.code=f,this.continueUrl=(r=l.continueUrl)!==null&&r!==void 0?r:null,this.languageCode=(o=l.languageCode)!==null&&o!==void 0?o:null,this.tenantId=(a=l.tenantId)!==null&&a!==void 0?a:null}static parseLink(e){const t=Hp(e);try{return new Do(t)}catch{return null}}}/**
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
 */class $n{constructor(){this.providerId=$n.PROVIDER_ID}static credential(e,t){return mi._fromEmailAndPassword(e,t)}static credentialWithLink(e,t){const i=Do.parseLink(t);return B(i,"argument-error"),mi._fromEmailAndCode(e,i.code,i.tenantId)}}$n.PROVIDER_ID="password";$n.EMAIL_PASSWORD_SIGN_IN_METHOD="password";$n.EMAIL_LINK_SIGN_IN_METHOD="emailLink";/**
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
 */class Xc{constructor(e){this.providerId=e,this.defaultLanguageCode=null,this.customParameters={}}setDefaultLanguage(e){this.defaultLanguageCode=e}setCustomParameters(e){return this.customParameters=e,this}getCustomParameters(){return this.customParameters}}/**
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
 */class Pi extends Xc{constructor(){super(...arguments),this.scopes=[]}addScope(e){return this.scopes.includes(e)||this.scopes.push(e),this}getScopes(){return[...this.scopes]}}/**
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
 */class St extends Pi{constructor(){super("facebook.com")}static credential(e){return rn._fromParams({providerId:St.PROVIDER_ID,signInMethod:St.FACEBOOK_SIGN_IN_METHOD,accessToken:e})}static credentialFromResult(e){return St.credentialFromTaggedObject(e)}static credentialFromError(e){return St.credentialFromTaggedObject(e.customData||{})}static credentialFromTaggedObject({_tokenResponse:e}){if(!e||!("oauthAccessToken"in e)||!e.oauthAccessToken)return null;try{return St.credential(e.oauthAccessToken)}catch{return null}}}St.FACEBOOK_SIGN_IN_METHOD="facebook.com";St.PROVIDER_ID="facebook.com";/**
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
 */class Tt extends Pi{constructor(){super("google.com"),this.addScope("profile")}static credential(e,t){return rn._fromParams({providerId:Tt.PROVIDER_ID,signInMethod:Tt.GOOGLE_SIGN_IN_METHOD,idToken:e,accessToken:t})}static credentialFromResult(e){return Tt.credentialFromTaggedObject(e)}static credentialFromError(e){return Tt.credentialFromTaggedObject(e.customData||{})}static credentialFromTaggedObject({_tokenResponse:e}){if(!e)return null;const{oauthIdToken:t,oauthAccessToken:i}=e;if(!t&&!i)return null;try{return Tt.credential(t,i)}catch{return null}}}Tt.GOOGLE_SIGN_IN_METHOD="google.com";Tt.PROVIDER_ID="google.com";/**
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
 */class kt extends Pi{constructor(){super("github.com")}static credential(e){return rn._fromParams({providerId:kt.PROVIDER_ID,signInMethod:kt.GITHUB_SIGN_IN_METHOD,accessToken:e})}static credentialFromResult(e){return kt.credentialFromTaggedObject(e)}static credentialFromError(e){return kt.credentialFromTaggedObject(e.customData||{})}static credentialFromTaggedObject({_tokenResponse:e}){if(!e||!("oauthAccessToken"in e)||!e.oauthAccessToken)return null;try{return kt.credential(e.oauthAccessToken)}catch{return null}}}kt.GITHUB_SIGN_IN_METHOD="github.com";kt.PROVIDER_ID="github.com";/**
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
 */class Rt extends Pi{constructor(){super("twitter.com")}static credential(e,t){return rn._fromParams({providerId:Rt.PROVIDER_ID,signInMethod:Rt.TWITTER_SIGN_IN_METHOD,oauthToken:e,oauthTokenSecret:t})}static credentialFromResult(e){return Rt.credentialFromTaggedObject(e)}static credentialFromError(e){return Rt.credentialFromTaggedObject(e.customData||{})}static credentialFromTaggedObject({_tokenResponse:e}){if(!e)return null;const{oauthAccessToken:t,oauthTokenSecret:i}=e;if(!t||!i)return null;try{return Rt.credential(t,i)}catch{return null}}}Rt.TWITTER_SIGN_IN_METHOD="twitter.com";Rt.PROVIDER_ID="twitter.com";/**
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
 */async function Vp(n,e){return xi(n,"POST","/v1/accounts:signUp",Ht(n,e))}/**
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
 */class on{constructor(e){this.user=e.user,this.providerId=e.providerId,this._tokenResponse=e._tokenResponse,this.operationType=e.operationType}static async _fromIdTokenResponse(e,t,i,s=!1){const r=await pt._fromIdTokenResponse(e,i,s),o=cl(i);return new on({user:r,providerId:o,_tokenResponse:i,operationType:t})}static async _forOperation(e,t,i){await e._updateTokensIfNecessary(i,!0);const s=cl(i);return new on({user:e,providerId:s,_tokenResponse:i,operationType:t})}}function cl(n){return n.providerId?n.providerId:"phoneNumber"in n?"phone":null}/**
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
 */class Cs extends Bt{constructor(e,t,i,s){var r;super(t.code,t.message),this.operationType=i,this.user=s,Object.setPrototypeOf(this,Cs.prototype),this.customData={appName:e.name,tenantId:(r=e.tenantId)!==null&&r!==void 0?r:void 0,_serverResponse:t.customData._serverResponse,operationType:i}}static _fromErrorAndOperation(e,t,i,s){return new Cs(e,t,i,s)}}function Zc(n,e,t,i){return(e==="reauthenticate"?t._getReauthenticationResolver(n):t._getIdTokenResponse(n)).catch(r=>{throw r.code==="auth/multi-factor-auth-required"?Cs._fromErrorAndOperation(n,r,e,i):r})}async function jp(n,e,t=!1){const i=await pi(n,e._linkToIdToken(n.auth,await n.getIdToken()),t);return on._forOperation(n,"link",i)}/**
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
 */async function qp(n,e,t=!1){const{auth:i}=n;if(ot(i.app))return Promise.reject(yt(i));const s="reauthenticate";try{const r=await pi(n,Zc(i,s,e,n),t);B(r.idToken,i,"internal-error");const o=Po(r.idToken);B(o,i,"internal-error");const{sub:a}=o;return B(n.uid===a,i,"user-mismatch"),on._forOperation(n,s,r)}catch(r){throw(r==null?void 0:r.code)==="auth/user-not-found"&&et(i,"user-mismatch"),r}}/**
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
 */async function ed(n,e,t=!1){if(ot(n.app))return Promise.reject(yt(n));const i="signIn",s=await Zc(n,i,e),r=await on._fromIdTokenResponse(n,i,s);return t||await n._updateCurrentUser(r.user),r}async function Gp(n,e){return ed(dn(n),e)}/**
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
 */async function td(n){const e=dn(n);e._getPasswordPolicyInternal()&&await e._updatePasswordPolicy()}async function zp(n,e,t){if(ot(n.app))return Promise.reject(yt(n));const i=dn(n),o=await jr(i,{returnSecureToken:!0,email:e,password:t,clientType:"CLIENT_TYPE_WEB"},"signUpPassword",Vp).catch(l=>{throw l.code==="auth/password-does-not-meet-requirements"&&td(n),l}),a=await on._fromIdTokenResponse(i,"signIn",o);return await i._updateCurrentUser(a.user),a}function Kp(n,e,t){return ot(n.app)?Promise.reject(yt(n)):Gp(ve(n),$n.credential(e,t)).catch(async i=>{throw i.code==="auth/password-does-not-meet-requirements"&&td(n),i})}function Yp(n,e,t,i){return ve(n).onIdTokenChanged(e,t,i)}function Qp(n,e,t){return ve(n).beforeAuthStateChanged(e,t)}function Jp(n,e,t,i){return ve(n).onAuthStateChanged(e,t,i)}function Xp(n){return ve(n).signOut()}async function Zp(n){return ve(n).delete()}const Is="__sak";/**
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
 */class nd{constructor(e,t){this.storageRetriever=e,this.type=t}_isAvailable(){try{return this.storage?(this.storage.setItem(Is,"1"),this.storage.removeItem(Is),Promise.resolve(!0)):Promise.resolve(!1)}catch{return Promise.resolve(!1)}}_set(e,t){return this.storage.setItem(e,JSON.stringify(t)),Promise.resolve()}_get(e){const t=this.storage.getItem(e);return Promise.resolve(t?JSON.parse(t):null)}_remove(e){return this.storage.removeItem(e),Promise.resolve()}get storage(){return this.storageRetriever()}}/**
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
 */const em=1e3,tm=10;class id extends nd{constructor(){super(()=>window.localStorage,"LOCAL"),this.boundEventHandler=(e,t)=>this.onStorageEvent(e,t),this.listeners={},this.localCache={},this.pollTimer=null,this.fallbackToPolling=Kc(),this._shouldAllowMigration=!0}forAllChangedKeys(e){for(const t of Object.keys(this.listeners)){const i=this.storage.getItem(t),s=this.localCache[t];i!==s&&e(t,s,i)}}onStorageEvent(e,t=!1){if(!e.key){this.forAllChangedKeys((o,a,l)=>{this.notifyListeners(o,l)});return}const i=e.key;t?this.detachListener():this.stopPolling();const s=()=>{const o=this.storage.getItem(i);!t&&this.localCache[i]===o||this.notifyListeners(i,o)},r=this.storage.getItem(i);yp()&&r!==e.newValue&&e.newValue!==e.oldValue?setTimeout(s,tm):s()}notifyListeners(e,t){this.localCache[e]=t;const i=this.listeners[e];if(i)for(const s of Array.from(i))s(t&&JSON.parse(t))}startPolling(){this.stopPolling(),this.pollTimer=setInterval(()=>{this.forAllChangedKeys((e,t,i)=>{this.onStorageEvent(new StorageEvent("storage",{key:e,oldValue:t,newValue:i}),!0)})},em)}stopPolling(){this.pollTimer&&(clearInterval(this.pollTimer),this.pollTimer=null)}attachListener(){window.addEventListener("storage",this.boundEventHandler)}detachListener(){window.removeEventListener("storage",this.boundEventHandler)}_addListener(e,t){Object.keys(this.listeners).length===0&&(this.fallbackToPolling?this.startPolling():this.attachListener()),this.listeners[e]||(this.listeners[e]=new Set,this.localCache[e]=this.storage.getItem(e)),this.listeners[e].add(t)}_removeListener(e,t){this.listeners[e]&&(this.listeners[e].delete(t),this.listeners[e].size===0&&delete this.listeners[e]),Object.keys(this.listeners).length===0&&(this.detachListener(),this.stopPolling())}async _set(e,t){await super._set(e,t),this.localCache[e]=JSON.stringify(t)}async _get(e){const t=await super._get(e);return this.localCache[e]=JSON.stringify(t),t}async _remove(e){await super._remove(e),delete this.localCache[e]}}id.type="LOCAL";const nm=id;/**
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
 */class sd extends nd{constructor(){super(()=>window.sessionStorage,"SESSION")}_addListener(e,t){}_removeListener(e,t){}}sd.type="SESSION";const rd=sd;/**
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
 */function im(n){return Promise.all(n.map(async e=>{try{return{fulfilled:!0,value:await e}}catch(t){return{fulfilled:!1,reason:t}}}))}/**
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
 */class Gs{constructor(e){this.eventTarget=e,this.handlersMap={},this.boundEventHandler=this.handleEvent.bind(this)}static _getInstance(e){const t=this.receivers.find(s=>s.isListeningto(e));if(t)return t;const i=new Gs(e);return this.receivers.push(i),i}isListeningto(e){return this.eventTarget===e}async handleEvent(e){const t=e,{eventId:i,eventType:s,data:r}=t.data,o=this.handlersMap[s];if(!(o!=null&&o.size))return;t.ports[0].postMessage({status:"ack",eventId:i,eventType:s});const a=Array.from(o).map(async c=>c(t.origin,r)),l=await im(a);t.ports[0].postMessage({status:"done",eventId:i,eventType:s,response:l})}_subscribe(e,t){Object.keys(this.handlersMap).length===0&&this.eventTarget.addEventListener("message",this.boundEventHandler),this.handlersMap[e]||(this.handlersMap[e]=new Set),this.handlersMap[e].add(t)}_unsubscribe(e,t){this.handlersMap[e]&&t&&this.handlersMap[e].delete(t),(!t||this.handlersMap[e].size===0)&&delete this.handlersMap[e],Object.keys(this.handlersMap).length===0&&this.eventTarget.removeEventListener("message",this.boundEventHandler)}}Gs.receivers=[];/**
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
 */function Mo(n="",e=10){let t="";for(let i=0;i<e;i++)t+=Math.floor(Math.random()*10);return n+t}/**
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
 */class sm{constructor(e){this.target=e,this.handlers=new Set}removeMessageHandler(e){e.messageChannel&&(e.messageChannel.port1.removeEventListener("message",e.onMessage),e.messageChannel.port1.close()),this.handlers.delete(e)}async _send(e,t,i=50){const s=typeof MessageChannel<"u"?new MessageChannel:null;if(!s)throw new Error("connection_unavailable");let r,o;return new Promise((a,l)=>{const c=Mo("",20);s.port1.start();const f=setTimeout(()=>{l(new Error("unsupported_event"))},i);o={messageChannel:s,onMessage(u){const _=u;if(_.data.eventId===c)switch(_.data.status){case"ack":clearTimeout(f),r=setTimeout(()=>{l(new Error("timeout"))},3e3);break;case"done":clearTimeout(r),a(_.data.response);break;default:clearTimeout(f),clearTimeout(r),l(new Error("invalid_response"));break}}},this.handlers.add(o),s.port1.addEventListener("message",o.onMessage),this.target.postMessage({eventType:e,eventId:c,data:t},[s.port2])}).finally(()=>{o&&this.removeMessageHandler(o)})}}/**
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
 */function ct(){return window}function rm(n){ct().location.href=n}/**
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
 */function od(){return typeof ct().WorkerGlobalScope<"u"&&typeof ct().importScripts=="function"}async function om(){if(!(navigator!=null&&navigator.serviceWorker))return null;try{return(await navigator.serviceWorker.ready).active}catch{return null}}function am(){var n;return((n=navigator==null?void 0:navigator.serviceWorker)===null||n===void 0?void 0:n.controller)||null}function lm(){return od()?self:null}/**
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
 */const ad="firebaseLocalStorageDb",cm=1,Ss="firebaseLocalStorage",ld="fbase_key";class Ni{constructor(e){this.request=e}toPromise(){return new Promise((e,t)=>{this.request.addEventListener("success",()=>{e(this.request.result)}),this.request.addEventListener("error",()=>{t(this.request.error)})})}}function zs(n,e){return n.transaction([Ss],e?"readwrite":"readonly").objectStore(Ss)}function dm(){const n=indexedDB.deleteDatabase(ad);return new Ni(n).toPromise()}function qr(){const n=indexedDB.open(ad,cm);return new Promise((e,t)=>{n.addEventListener("error",()=>{t(n.error)}),n.addEventListener("upgradeneeded",()=>{const i=n.result;try{i.createObjectStore(Ss,{keyPath:ld})}catch(s){t(s)}}),n.addEventListener("success",async()=>{const i=n.result;i.objectStoreNames.contains(Ss)?e(i):(i.close(),await dm(),e(await qr()))})})}async function dl(n,e,t){const i=zs(n,!0).put({[ld]:e,value:t});return new Ni(i).toPromise()}async function um(n,e){const t=zs(n,!1).get(e),i=await new Ni(t).toPromise();return i===void 0?null:i.value}function ul(n,e){const t=zs(n,!0).delete(e);return new Ni(t).toPromise()}const hm=800,fm=3;class cd{constructor(){this.type="LOCAL",this._shouldAllowMigration=!0,this.listeners={},this.localCache={},this.pollTimer=null,this.pendingWrites=0,this.receiver=null,this.sender=null,this.serviceWorkerReceiverAvailable=!1,this.activeServiceWorker=null,this._workerInitializationPromise=this.initializeServiceWorkerMessaging().then(()=>{},()=>{})}async _openDb(){return this.db?this.db:(this.db=await qr(),this.db)}async _withRetries(e){let t=0;for(;;)try{const i=await this._openDb();return await e(i)}catch(i){if(t++>fm)throw i;this.db&&(this.db.close(),this.db=void 0)}}async initializeServiceWorkerMessaging(){return od()?this.initializeReceiver():this.initializeSender()}async initializeReceiver(){this.receiver=Gs._getInstance(lm()),this.receiver._subscribe("keyChanged",async(e,t)=>({keyProcessed:(await this._poll()).includes(t.key)})),this.receiver._subscribe("ping",async(e,t)=>["keyChanged"])}async initializeSender(){var e,t;if(this.activeServiceWorker=await om(),!this.activeServiceWorker)return;this.sender=new sm(this.activeServiceWorker);const i=await this.sender._send("ping",{},800);i&&!((e=i[0])===null||e===void 0)&&e.fulfilled&&!((t=i[0])===null||t===void 0)&&t.value.includes("keyChanged")&&(this.serviceWorkerReceiverAvailable=!0)}async notifyServiceWorker(e){if(!(!this.sender||!this.activeServiceWorker||am()!==this.activeServiceWorker))try{await this.sender._send("keyChanged",{key:e},this.serviceWorkerReceiverAvailable?800:50)}catch{}}async _isAvailable(){try{if(!indexedDB)return!1;const e=await qr();return await dl(e,Is,"1"),await ul(e,Is),!0}catch{}return!1}async _withPendingWrite(e){this.pendingWrites++;try{await e()}finally{this.pendingWrites--}}async _set(e,t){return this._withPendingWrite(async()=>(await this._withRetries(i=>dl(i,e,t)),this.localCache[e]=t,this.notifyServiceWorker(e)))}async _get(e){const t=await this._withRetries(i=>um(i,e));return this.localCache[e]=t,t}async _remove(e){return this._withPendingWrite(async()=>(await this._withRetries(t=>ul(t,e)),delete this.localCache[e],this.notifyServiceWorker(e)))}async _poll(){const e=await this._withRetries(s=>{const r=zs(s,!1).getAll();return new Ni(r).toPromise()});if(!e)return[];if(this.pendingWrites!==0)return[];const t=[],i=new Set;if(e.length!==0)for(const{fbase_key:s,value:r}of e)i.add(s),JSON.stringify(this.localCache[s])!==JSON.stringify(r)&&(this.notifyListeners(s,r),t.push(s));for(const s of Object.keys(this.localCache))this.localCache[s]&&!i.has(s)&&(this.notifyListeners(s,null),t.push(s));return t}notifyListeners(e,t){this.localCache[e]=t;const i=this.listeners[e];if(i)for(const s of Array.from(i))s(t)}startPolling(){this.stopPolling(),this.pollTimer=setInterval(async()=>this._poll(),hm)}stopPolling(){this.pollTimer&&(clearInterval(this.pollTimer),this.pollTimer=null)}_addListener(e,t){Object.keys(this.listeners).length===0&&this.startPolling(),this.listeners[e]||(this.listeners[e]=new Set,this._get(e)),this.listeners[e].add(t)}_removeListener(e,t){this.listeners[e]&&(this.listeners[e].delete(t),this.listeners[e].size===0&&delete this.listeners[e]),Object.keys(this.listeners).length===0&&this.stopPolling()}}cd.type="LOCAL";const pm=cd;new Ai(3e4,6e4);/**
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
 */function mm(n,e){return e?mt(e):(B(n._popupRedirectResolver,n,"argument-error"),n._popupRedirectResolver)}/**
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
 */class Lo extends Oo{constructor(e){super("custom","custom"),this.params=e}_getIdTokenResponse(e){return En(e,this._buildIdpRequest())}_linkToIdToken(e,t){return En(e,this._buildIdpRequest(t))}_getReauthenticationResolver(e){return En(e,this._buildIdpRequest())}_buildIdpRequest(e){const t={requestUri:this.params.requestUri,sessionId:this.params.sessionId,postBody:this.params.postBody,tenantId:this.params.tenantId,pendingToken:this.params.pendingToken,returnSecureToken:!0,returnIdpCredential:!0};return e&&(t.idToken=e),t}}function gm(n){return ed(n.auth,new Lo(n),n.bypassAuthState)}function _m(n){const{auth:e,user:t}=n;return B(t,e,"internal-error"),qp(t,new Lo(n),n.bypassAuthState)}async function ym(n){const{auth:e,user:t}=n;return B(t,e,"internal-error"),jp(t,new Lo(n),n.bypassAuthState)}/**
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
 */class dd{constructor(e,t,i,s,r=!1){this.auth=e,this.resolver=i,this.user=s,this.bypassAuthState=r,this.pendingPromise=null,this.eventManager=null,this.filter=Array.isArray(t)?t:[t]}execute(){return new Promise(async(e,t)=>{this.pendingPromise={resolve:e,reject:t};try{this.eventManager=await this.resolver._initialize(this.auth),await this.onExecution(),this.eventManager.registerConsumer(this)}catch(i){this.reject(i)}})}async onAuthEvent(e){const{urlResponse:t,sessionId:i,postBody:s,tenantId:r,error:o,type:a}=e;if(o){this.reject(o);return}const l={auth:this.auth,requestUri:t,sessionId:i,tenantId:r||void 0,postBody:s||void 0,user:this.user,bypassAuthState:this.bypassAuthState};try{this.resolve(await this.getIdpTask(a)(l))}catch(c){this.reject(c)}}onError(e){this.reject(e)}getIdpTask(e){switch(e){case"signInViaPopup":case"signInViaRedirect":return gm;case"linkViaPopup":case"linkViaRedirect":return ym;case"reauthViaPopup":case"reauthViaRedirect":return _m;default:et(this.auth,"internal-error")}}resolve(e){bt(this.pendingPromise,"Pending promise was never set"),this.pendingPromise.resolve(e),this.unregisterAndCleanUp()}reject(e){bt(this.pendingPromise,"Pending promise was never set"),this.pendingPromise.reject(e),this.unregisterAndCleanUp()}unregisterAndCleanUp(){this.eventManager&&this.eventManager.unregisterConsumer(this),this.pendingPromise=null,this.cleanUp()}}/**
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
 */const vm=new Ai(2e3,1e4);class gn extends dd{constructor(e,t,i,s,r){super(e,t,s,r),this.provider=i,this.authWindow=null,this.pollId=null,gn.currentPopupAction&&gn.currentPopupAction.cancel(),gn.currentPopupAction=this}async executeNotNull(){const e=await this.execute();return B(e,this.auth,"internal-error"),e}async onExecution(){bt(this.filter.length===1,"Popup operations only handle one event");const e=Mo();this.authWindow=await this.resolver._openPopup(this.auth,this.provider,this.filter[0],e),this.authWindow.associatedEvent=e,this.resolver._originValidation(this.auth).catch(t=>{this.reject(t)}),this.resolver._isIframeWebStorageSupported(this.auth,t=>{t||this.reject(lt(this.auth,"web-storage-unsupported"))}),this.pollUserCancellation()}get eventId(){var e;return((e=this.authWindow)===null||e===void 0?void 0:e.associatedEvent)||null}cancel(){this.reject(lt(this.auth,"cancelled-popup-request"))}cleanUp(){this.authWindow&&this.authWindow.close(),this.pollId&&window.clearTimeout(this.pollId),this.authWindow=null,this.pollId=null,gn.currentPopupAction=null}pollUserCancellation(){const e=()=>{var t,i;if(!((i=(t=this.authWindow)===null||t===void 0?void 0:t.window)===null||i===void 0)&&i.closed){this.pollId=window.setTimeout(()=>{this.pollId=null,this.reject(lt(this.auth,"popup-closed-by-user"))},8e3);return}this.pollId=window.setTimeout(e,vm.get())};e()}}gn.currentPopupAction=null;/**
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
 */const wm="pendingRedirect",ds=new Map;class bm extends dd{constructor(e,t,i=!1){super(e,["signInViaRedirect","linkViaRedirect","reauthViaRedirect","unknown"],t,void 0,i),this.eventId=null}async execute(){let e=ds.get(this.auth._key());if(!e){try{const i=await Em(this.resolver,this.auth)?await super.execute():null;e=()=>Promise.resolve(i)}catch(t){e=()=>Promise.reject(t)}ds.set(this.auth._key(),e)}return this.bypassAuthState||ds.set(this.auth._key(),()=>Promise.resolve(null)),e()}async onAuthEvent(e){if(e.type==="signInViaRedirect")return super.onAuthEvent(e);if(e.type==="unknown"){this.resolve(null);return}if(e.eventId){const t=await this.auth._redirectUserForId(e.eventId);if(t)return this.user=t,super.onAuthEvent(e);this.resolve(null)}}async onExecution(){}cleanUp(){}}async function Em(n,e){const t=Sm(e),i=Im(n);if(!await i._isAvailable())return!1;const s=await i._get(t)==="true";return await i._remove(t),s}function Cm(n,e){ds.set(n._key(),e)}function Im(n){return mt(n._redirectPersistence)}function Sm(n){return cs(wm,n.config.apiKey,n.name)}async function Tm(n,e,t=!1){if(ot(n.app))return Promise.reject(yt(n));const i=dn(n),s=mm(i,e),o=await new bm(i,s,t).execute();return o&&!t&&(delete o.user._redirectEventId,await i._persistUserIfCurrent(o.user),await i._setRedirectUser(null,e)),o}/**
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
 */const km=10*60*1e3;class Rm{constructor(e){this.auth=e,this.cachedEventUids=new Set,this.consumers=new Set,this.queuedRedirectEvent=null,this.hasHandledPotentialRedirect=!1,this.lastProcessedEventTime=Date.now()}registerConsumer(e){this.consumers.add(e),this.queuedRedirectEvent&&this.isEventForConsumer(this.queuedRedirectEvent,e)&&(this.sendToConsumer(this.queuedRedirectEvent,e),this.saveEventToCache(this.queuedRedirectEvent),this.queuedRedirectEvent=null)}unregisterConsumer(e){this.consumers.delete(e)}onEvent(e){if(this.hasEventBeenHandled(e))return!1;let t=!1;return this.consumers.forEach(i=>{this.isEventForConsumer(e,i)&&(t=!0,this.sendToConsumer(e,i),this.saveEventToCache(e))}),this.hasHandledPotentialRedirect||!Am(e)||(this.hasHandledPotentialRedirect=!0,t||(this.queuedRedirectEvent=e,t=!0)),t}sendToConsumer(e,t){var i;if(e.error&&!ud(e)){const s=((i=e.error.code)===null||i===void 0?void 0:i.split("auth/")[1])||"internal-error";t.onError(lt(this.auth,s))}else t.onAuthEvent(e)}isEventForConsumer(e,t){const i=t.eventId===null||!!e.eventId&&e.eventId===t.eventId;return t.filter.includes(e.type)&&i}hasEventBeenHandled(e){return Date.now()-this.lastProcessedEventTime>=km&&this.cachedEventUids.clear(),this.cachedEventUids.has(hl(e))}saveEventToCache(e){this.cachedEventUids.add(hl(e)),this.lastProcessedEventTime=Date.now()}}function hl(n){return[n.type,n.eventId,n.sessionId,n.tenantId].filter(e=>e).join("-")}function ud({type:n,error:e}){return n==="unknown"&&(e==null?void 0:e.code)==="auth/no-auth-event"}function Am(n){switch(n.type){case"signInViaRedirect":case"linkViaRedirect":case"reauthViaRedirect":return!0;case"unknown":return ud(n);default:return!1}}/**
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
 */async function xm(n,e={}){return Vt(n,"GET","/v1/projects",e)}/**
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
 */const Pm=/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/,Nm=/^https?/;async function Om(n){if(n.config.emulator)return;const{authorizedDomains:e}=await xm(n);for(const t of e)try{if(Dm(t))return}catch{}et(n,"unauthorized-domain")}function Dm(n){const e=Hr(),{protocol:t,hostname:i}=new URL(e);if(n.startsWith("chrome-extension://")){const o=new URL(n);return o.hostname===""&&i===""?t==="chrome-extension:"&&n.replace("chrome-extension://","")===e.replace("chrome-extension://",""):t==="chrome-extension:"&&o.hostname===i}if(!Nm.test(t))return!1;if(Pm.test(n))return i===n;const s=n.replace(/\./g,"\\.");return new RegExp("^(.+\\."+s+"|"+s+")$","i").test(i)}/**
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
 */const Mm=new Ai(3e4,6e4);function fl(){const n=ct().___jsl;if(n!=null&&n.H){for(const e of Object.keys(n.H))if(n.H[e].r=n.H[e].r||[],n.H[e].L=n.H[e].L||[],n.H[e].r=[...n.H[e].L],n.CP)for(let t=0;t<n.CP.length;t++)n.CP[t]=null}}function Lm(n){return new Promise((e,t)=>{var i,s,r;function o(){fl(),gapi.load("gapi.iframes",{callback:()=>{e(gapi.iframes.getContext())},ontimeout:()=>{fl(),t(lt(n,"network-request-failed"))},timeout:Mm.get()})}if(!((s=(i=ct().gapi)===null||i===void 0?void 0:i.iframes)===null||s===void 0)&&s.Iframe)e(gapi.iframes.getContext());else if(!((r=ct().gapi)===null||r===void 0)&&r.load)o();else{const a=kp("iframefcb");return ct()[a]=()=>{gapi.load?o():t(lt(n,"network-request-failed"))},Qc(`${Tp()}?onload=${a}`).catch(l=>t(l))}}).catch(e=>{throw us=null,e})}let us=null;function Fm(n){return us=us||Lm(n),us}/**
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
 */const Um=new Ai(5e3,15e3),$m="__/auth/iframe",Wm="emulator/auth/iframe",Bm={style:{position:"absolute",top:"-100px",width:"1px",height:"1px"},"aria-hidden":"true",tabindex:"-1"},Hm=new Map([["identitytoolkit.googleapis.com","p"],["staging-identitytoolkit.sandbox.googleapis.com","s"],["test-identitytoolkit.sandbox.googleapis.com","t"]]);function Vm(n){const e=n.config;B(e.authDomain,n,"auth-domain-config-required");const t=e.emulator?xo(e,Wm):`https://${n.config.authDomain}/${$m}`,i={apiKey:e.apiKey,appName:n.name,v:Un},s=Hm.get(n.config.apiHost);s&&(i.eid=s);const r=n._getFrameworks();return r.length&&(i.fw=r.join(",")),`${t}?${Fn(i).slice(1)}`}async function jm(n){const e=await Fm(n),t=ct().gapi;return B(t,n,"internal-error"),e.open({where:document.body,url:Vm(n),messageHandlersFilter:t.iframes.CROSS_ORIGIN_IFRAMES_FILTER,attributes:Bm,dontclear:!0},i=>new Promise(async(s,r)=>{await i.restyle({setHideOnLeave:!1});const o=lt(n,"network-request-failed"),a=ct().setTimeout(()=>{r(o)},Um.get());function l(){ct().clearTimeout(a),s(i)}i.ping(l).then(l,()=>{r(o)})}))}/**
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
 */const qm={location:"yes",resizable:"yes",statusbar:"yes",toolbar:"no"},Gm=500,zm=600,Km="_blank",Ym="http://localhost";class pl{constructor(e){this.window=e,this.associatedEvent=null}close(){if(this.window)try{this.window.close()}catch{}}}function Qm(n,e,t,i=Gm,s=zm){const r=Math.max((window.screen.availHeight-s)/2,0).toString(),o=Math.max((window.screen.availWidth-i)/2,0).toString();let a="";const l=Object.assign(Object.assign({},qm),{width:i.toString(),height:s.toString(),top:r,left:o}),c=Oe().toLowerCase();t&&(a=Vc(c)?Km:t),Bc(c)&&(e=e||Ym,l.scrollbars="yes");const f=Object.entries(l).reduce((_,[m,w])=>`${_}${m}=${w},`,"");if(_p(c)&&a!=="_self")return Jm(e||"",a),new pl(null);const u=window.open(e||"",a,f);B(u,n,"popup-blocked");try{u.focus()}catch{}return new pl(u)}function Jm(n,e){const t=document.createElement("a");t.href=n,t.target=e;const i=document.createEvent("MouseEvent");i.initMouseEvent("click",!0,!0,window,1,0,0,0,0,!1,!1,!1,!1,1,null),t.dispatchEvent(i)}/**
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
 */const Xm="__/auth/handler",Zm="emulator/auth/handler",eg=encodeURIComponent("fac");async function ml(n,e,t,i,s,r){B(n.config.authDomain,n,"auth-domain-config-required"),B(n.config.apiKey,n,"invalid-api-key");const o={apiKey:n.config.apiKey,appName:n.name,authType:t,redirectUrl:i,v:Un,eventId:s};if(e instanceof Xc){e.setDefaultLanguage(n.languageCode),o.providerId=e.providerId||"",_s(e.getCustomParameters())||(o.customParameters=JSON.stringify(e.getCustomParameters()));for(const[f,u]of Object.entries({}))o[f]=u}if(e instanceof Pi){const f=e.getScopes().filter(u=>u!=="");f.length>0&&(o.scopes=f.join(","))}n.tenantId&&(o.tid=n.tenantId);const a=o;for(const f of Object.keys(a))a[f]===void 0&&delete a[f];const l=await n._getAppCheckToken(),c=l?`#${eg}=${encodeURIComponent(l)}`:"";return`${tg(n)}?${Fn(a).slice(1)}${c}`}function tg({config:n}){return n.emulator?xo(n,Zm):`https://${n.authDomain}/${Xm}`}/**
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
 */const Cr="webStorageSupport";class ng{constructor(){this.eventManagers={},this.iframes={},this.originValidationPromises={},this._redirectPersistence=rd,this._completeRedirectFn=Tm,this._overrideRedirectResult=Cm}async _openPopup(e,t,i,s){var r;bt((r=this.eventManagers[e._key()])===null||r===void 0?void 0:r.manager,"_initialize() not called before _openPopup()");const o=await ml(e,t,i,Hr(),s);return Qm(e,o,Mo())}async _openRedirect(e,t,i,s){await this._originValidation(e);const r=await ml(e,t,i,Hr(),s);return rm(r),new Promise(()=>{})}_initialize(e){const t=e._key();if(this.eventManagers[t]){const{manager:s,promise:r}=this.eventManagers[t];return s?Promise.resolve(s):(bt(r,"If manager is not set, promise should be"),r)}const i=this.initAndGetManager(e);return this.eventManagers[t]={promise:i},i.catch(()=>{delete this.eventManagers[t]}),i}async initAndGetManager(e){const t=await jm(e),i=new Rm(e);return t.register("authEvent",s=>(B(s==null?void 0:s.authEvent,e,"invalid-auth-event"),{status:i.onEvent(s.authEvent)?"ACK":"ERROR"}),gapi.iframes.CROSS_ORIGIN_IFRAMES_FILTER),this.eventManagers[e._key()]={manager:i},this.iframes[e._key()]=t,i}_isIframeWebStorageSupported(e,t){this.iframes[e._key()].send(Cr,{type:Cr},s=>{var r;const o=(r=s==null?void 0:s[0])===null||r===void 0?void 0:r[Cr];o!==void 0&&t(!!o),et(e,"internal-error")},gapi.iframes.CROSS_ORIGIN_IFRAMES_FILTER)}_originValidation(e){const t=e._key();return this.originValidationPromises[t]||(this.originValidationPromises[t]=Om(e)),this.originValidationPromises[t]}get _shouldInitProactively(){return Kc()||Hc()||No()}}const ig=ng;var gl="@firebase/auth",_l="1.7.9";/**
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
 */class sg{constructor(e){this.auth=e,this.internalListeners=new Map}getUid(){var e;return this.assertAuthConfigured(),((e=this.auth.currentUser)===null||e===void 0?void 0:e.uid)||null}async getToken(e){return this.assertAuthConfigured(),await this.auth._initializationPromise,this.auth.currentUser?{accessToken:await this.auth.currentUser.getIdToken(e)}:null}addAuthTokenListener(e){if(this.assertAuthConfigured(),this.internalListeners.has(e))return;const t=this.auth.onIdTokenChanged(i=>{e((i==null?void 0:i.stsTokenManager.accessToken)||null)});this.internalListeners.set(e,t),this.updateProactiveRefresh()}removeAuthTokenListener(e){this.assertAuthConfigured();const t=this.internalListeners.get(e);t&&(this.internalListeners.delete(e),t(),this.updateProactiveRefresh())}assertAuthConfigured(){B(this.auth._initializationPromise,"dependent-sdk-initialized-before-auth")}updateProactiveRefresh(){this.internalListeners.size>0?this.auth._startProactiveRefresh():this.auth._stopProactiveRefresh()}}/**
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
 */function rg(n){switch(n){case"Node":return"node";case"ReactNative":return"rn";case"Worker":return"webworker";case"Cordova":return"cordova";case"WebExtension":return"web-extension";default:return}}function og(n){Tn(new sn("auth",(e,{options:t})=>{const i=e.getProvider("app").getImmediate(),s=e.getProvider("heartbeat"),r=e.getProvider("app-check-internal"),{apiKey:o,authDomain:a}=i.options;B(o&&!o.includes(":"),"invalid-api-key",{appName:i.name});const l={apiKey:o,authDomain:a,clientPlatform:n,apiHost:"identitytoolkit.googleapis.com",tokenApiHost:"securetoken.googleapis.com",apiScheme:"https",sdkClientVersion:Yc(n)},c=new Cp(i,s,r,l);return Np(c,t),c},"PUBLIC").setInstantiationMode("EXPLICIT").setInstanceCreatedCallback((e,t,i)=>{e.getProvider("auth-internal").initialize()})),Tn(new sn("auth-internal",e=>{const t=dn(e.getProvider("auth").getImmediate());return(i=>new sg(i))(t)},"PRIVATE").setInstantiationMode("EXPLICIT")),Ot(gl,_l,rg(n)),Ot(gl,_l,"esm2017")}/**
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
 */const ag=5*60,lg=Cc("authIdTokenMaxAge")||ag;let yl=null;const cg=n=>async e=>{const t=e&&await e.getIdTokenResult(),i=t&&(new Date().getTime()-Date.parse(t.issuedAtTime))/1e3;if(i&&i>lg)return;const s=t==null?void 0:t.token;yl!==s&&(yl=s,await fetch(n,{method:s?"POST":"DELETE",headers:s?{Authorization:`Bearer ${s}`}:{}}))};function dg(n=Ac()){const e=ko(n,"auth");if(e.isInitialized())return e.getImmediate();const t=Pp(n,{popupRedirectResolver:ig,persistence:[pm,nm,rd]}),i=Cc("authTokenSyncURL");if(i&&typeof isSecureContext=="boolean"&&isSecureContext){const r=new URL(i,location.origin);if(location.origin===r.origin){const o=cg(r.toString());Qp(t,o,()=>o(t.currentUser)),Yp(t,a=>o(a))}}const s=bc("auth");return s&&Op(t,`http://${s}`),t}function ug(){var n,e;return(e=(n=document.getElementsByTagName("head"))===null||n===void 0?void 0:n[0])!==null&&e!==void 0?e:document}Ip({loadJS(n){return new Promise((e,t)=>{const i=document.createElement("script");i.setAttribute("src",n),i.onload=e,i.onerror=s=>{const r=lt("internal-error");r.customData=s,t(r)},i.type="text/javascript",i.charset="UTF-8",ug().appendChild(i)})},gapiScript:"https://apis.google.com/js/api.js",recaptchaV2Script:"https://www.google.com/recaptcha/api.js",recaptchaEnterpriseScript:"https://www.google.com/recaptcha/enterprise.js?render="});og("Browser");var hg="firebase",fg="10.14.1";/**
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
 */Ot(hg,fg,"app");var vl={};const wl="@firebase/database",bl="1.0.8";/**
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
 */let hd="";function pg(n){hd=n}/**
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
 */class mg{constructor(e){this.domStorage_=e,this.prefix_="firebase:"}set(e,t){t==null?this.domStorage_.removeItem(this.prefixedName_(e)):this.domStorage_.setItem(this.prefixedName_(e),ye(t))}get(e){const t=this.domStorage_.getItem(this.prefixedName_(e));return t==null?null:hi(t)}remove(e){this.domStorage_.removeItem(this.prefixedName_(e))}prefixedName_(e){return this.prefix_+e}toString(){return this.domStorage_.toString()}}/**
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
 */class gg{constructor(){this.cache_={},this.isInMemoryStorage=!0}set(e,t){t==null?delete this.cache_[e]:this.cache_[e]=t}get(e){return dt(this.cache_,e)?this.cache_[e]:null}remove(e){delete this.cache_[e]}}/**
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
 */const fd=function(n){try{if(typeof window<"u"&&typeof window[n]<"u"){const e=window[n];return e.setItem("firebase:sentinel","cache"),e.removeItem("firebase:sentinel"),new mg(e)}}catch{}return new gg},Zt=fd("localStorage"),_g=fd("sessionStorage");/**
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
 */const Cn=new So("@firebase/database"),yg=function(){let n=1;return function(){return n++}}(),pd=function(n){const e=Vh(n),t=new $h;t.update(e);const i=t.digest();return Eo.encodeByteArray(i)},Oi=function(...n){let e="";for(let t=0;t<n.length;t++){const i=n[t];Array.isArray(i)||i&&typeof i=="object"&&typeof i.length=="number"?e+=Oi.apply(null,i):typeof i=="object"?e+=ye(i):e+=i,e+=" "}return e};let oi=null,El=!0;const vg=function(n,e){C(!0,"Can't turn on custom loggers persistently."),Cn.logLevel=ce.VERBOSE,oi=Cn.log.bind(Cn)},Ce=function(...n){if(El===!0&&(El=!1,oi===null&&_g.get("logging_enabled")===!0&&vg()),oi){const e=Oi.apply(null,n);oi(e)}},Di=function(n){return function(...e){Ce(n,...e)}},Gr=function(...n){const e="FIREBASE INTERNAL ERROR: "+Oi(...n);Cn.error(e)},Et=function(...n){const e=`FIREBASE FATAL ERROR: ${Oi(...n)}`;throw Cn.error(e),new Error(e)},Ne=function(...n){const e="FIREBASE WARNING: "+Oi(...n);Cn.warn(e)},wg=function(){typeof window<"u"&&window.location&&window.location.protocol&&window.location.protocol.indexOf("https:")!==-1&&Ne("Insecure Firebase access from a secure page. Please use https in calls to new Firebase().")},Ks=function(n){return typeof n=="number"&&(n!==n||n===Number.POSITIVE_INFINITY||n===Number.NEGATIVE_INFINITY)},bg=function(n){if(document.readyState==="complete")n();else{let e=!1;const t=function(){if(!document.body){setTimeout(t,Math.floor(10));return}e||(e=!0,n())};document.addEventListener?(document.addEventListener("DOMContentLoaded",t,!1),window.addEventListener("load",t,!1)):document.attachEvent&&(document.attachEvent("onreadystatechange",()=>{document.readyState==="complete"&&t()}),window.attachEvent("onload",t))}},an="[MIN_NAME]",Lt="[MAX_NAME]",un=function(n,e){if(n===e)return 0;if(n===an||e===Lt)return-1;if(e===an||n===Lt)return 1;{const t=Cl(n),i=Cl(e);return t!==null?i!==null?t-i===0?n.length-e.length:t-i:-1:i!==null?1:n<e?-1:1}},Eg=function(n,e){return n===e?0:n<e?-1:1},Kn=function(n,e){if(e&&n in e)return e[n];throw new Error("Missing required key ("+n+") in object: "+ye(e))},Fo=function(n){if(typeof n!="object"||n===null)return ye(n);const e=[];for(const i in n)e.push(i);e.sort();let t="{";for(let i=0;i<e.length;i++)i!==0&&(t+=","),t+=ye(e[i]),t+=":",t+=Fo(n[e[i]]);return t+="}",t},md=function(n,e){const t=n.length;if(t<=e)return[n];const i=[];for(let s=0;s<t;s+=e)s+e>t?i.push(n.substring(s,t)):i.push(n.substring(s,s+e));return i};function Ie(n,e){for(const t in n)n.hasOwnProperty(t)&&e(t,n[t])}const gd=function(n){C(!Ks(n),"Invalid JSON number");const e=11,t=52,i=(1<<e-1)-1;let s,r,o,a,l;n===0?(r=0,o=0,s=1/n===-1/0?1:0):(s=n<0,n=Math.abs(n),n>=Math.pow(2,1-i)?(a=Math.min(Math.floor(Math.log(n)/Math.LN2),i),r=a+i,o=Math.round(n*Math.pow(2,t-a)-Math.pow(2,t))):(r=0,o=Math.round(n/Math.pow(2,1-i-t))));const c=[];for(l=t;l;l-=1)c.push(o%2?1:0),o=Math.floor(o/2);for(l=e;l;l-=1)c.push(r%2?1:0),r=Math.floor(r/2);c.push(s?1:0),c.reverse();const f=c.join("");let u="";for(l=0;l<64;l+=8){let _=parseInt(f.substr(l,8),2).toString(16);_.length===1&&(_="0"+_),u=u+_}return u.toLowerCase()},Cg=function(){return!!(typeof window=="object"&&window.chrome&&window.chrome.extension&&!/^chrome/.test(window.location.href))},Ig=function(){return typeof Windows=="object"&&typeof Windows.UI=="object"};function Sg(n,e){let t="Unknown Error";n==="too_big"?t="The data requested exceeds the maximum size that can be accessed with a single request.":n==="permission_denied"?t="Client doesn't have permission to access the desired data.":n==="unavailable"&&(t="The service is unavailable");const i=new Error(n+" at "+e._path.toString()+": "+t);return i.code=n.toUpperCase(),i}const Tg=new RegExp("^-?(0*)\\d{1,10}$"),kg=-2147483648,Rg=2147483647,Cl=function(n){if(Tg.test(n)){const e=Number(n);if(e>=kg&&e<=Rg)return e}return null},Wn=function(n){try{n()}catch(e){setTimeout(()=>{const t=e.stack||"";throw Ne("Exception was thrown by user callback.",t),e},Math.floor(0))}},Ag=function(){return(typeof window=="object"&&window.navigator&&window.navigator.userAgent||"").search(/googlebot|google webmaster tools|bingbot|yahoo! slurp|baiduspider|yandexbot|duckduckbot/i)>=0},ai=function(n,e){const t=setTimeout(n,e);return typeof t=="number"&&typeof Deno<"u"&&Deno.unrefTimer?Deno.unrefTimer(t):typeof t=="object"&&t.unref&&t.unref(),t};/**
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
 */class xg{constructor(e,t){this.appName_=e,this.appCheckProvider=t,this.appCheck=t==null?void 0:t.getImmediate({optional:!0}),this.appCheck||t==null||t.get().then(i=>this.appCheck=i)}getToken(e){return this.appCheck?this.appCheck.getToken(e):new Promise((t,i)=>{setTimeout(()=>{this.appCheck?this.getToken(e).then(t,i):t(null)},0)})}addTokenChangeListener(e){var t;(t=this.appCheckProvider)===null||t===void 0||t.get().then(i=>i.addTokenListener(e))}notifyForInvalidToken(){Ne(`Provided AppCheck credentials for the app named "${this.appName_}" are invalid. This usually indicates your app was not initialized correctly.`)}}/**
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
 */class Pg{constructor(e,t,i){this.appName_=e,this.firebaseOptions_=t,this.authProvider_=i,this.auth_=null,this.auth_=i.getImmediate({optional:!0}),this.auth_||i.onInit(s=>this.auth_=s)}getToken(e){return this.auth_?this.auth_.getToken(e).catch(t=>t&&t.code==="auth/token-not-initialized"?(Ce("Got auth/token-not-initialized error.  Treating as null token."),null):Promise.reject(t)):new Promise((t,i)=>{setTimeout(()=>{this.auth_?this.getToken(e).then(t,i):t(null)},0)})}addTokenChangeListener(e){this.auth_?this.auth_.addAuthTokenListener(e):this.authProvider_.get().then(t=>t.addAuthTokenListener(e))}removeTokenChangeListener(e){this.authProvider_.get().then(t=>t.removeAuthTokenListener(e))}notifyForInvalidToken(){let e='Provided authentication credentials for the app named "'+this.appName_+'" are invalid. This usually indicates your app was not initialized correctly. ';"credential"in this.firebaseOptions_?e+='Make sure the "credential" property provided to initializeApp() is authorized to access the specified "databaseURL" and is from the correct project.':"serviceAccount"in this.firebaseOptions_?e+='Make sure the "serviceAccount" property provided to initializeApp() is authorized to access the specified "databaseURL" and is from the correct project.':e+='Make sure the "apiKey" and "databaseURL" properties provided to initializeApp() match the values provided for your app at https://console.firebase.google.com/.',Ne(e)}}class hs{constructor(e){this.accessToken=e}getToken(e){return Promise.resolve({accessToken:this.accessToken})}addTokenChangeListener(e){e(this.accessToken)}removeTokenChangeListener(e){}notifyForInvalidToken(){}}hs.OWNER="owner";/**
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
 */const Uo="5",_d="v",yd="s",vd="r",wd="f",bd=/(console\.firebase|firebase-console-\w+\.corp|firebase\.corp)\.google\.com/,Ed="ls",Cd="p",zr="ac",Id="websocket",Sd="long_polling";/**
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
 */class Td{constructor(e,t,i,s,r=!1,o="",a=!1,l=!1){this.secure=t,this.namespace=i,this.webSocketOnly=s,this.nodeAdmin=r,this.persistenceKey=o,this.includeNamespaceInQueryParams=a,this.isUsingEmulator=l,this._host=e.toLowerCase(),this._domain=this._host.substr(this._host.indexOf(".")+1),this.internalHost=Zt.get("host:"+e)||this._host}isCacheableHost(){return this.internalHost.substr(0,2)==="s-"}isCustomHost(){return this._domain!=="firebaseio.com"&&this._domain!=="firebaseio-demo.com"}get host(){return this._host}set host(e){e!==this.internalHost&&(this.internalHost=e,this.isCacheableHost()&&Zt.set("host:"+this._host,this.internalHost))}toString(){let e=this.toURLString();return this.persistenceKey&&(e+="<"+this.persistenceKey+">"),e}toURLString(){const e=this.secure?"https://":"http://",t=this.includeNamespaceInQueryParams?`?ns=${this.namespace}`:"";return`${e}${this.host}/${t}`}}function Ng(n){return n.host!==n.internalHost||n.isCustomHost()||n.includeNamespaceInQueryParams}function kd(n,e,t){C(typeof e=="string","typeof type must == string"),C(typeof t=="object","typeof params must == object");let i;if(e===Id)i=(n.secure?"wss://":"ws://")+n.internalHost+"/.ws?";else if(e===Sd)i=(n.secure?"https://":"http://")+n.internalHost+"/.lp?";else throw new Error("Unknown connection type: "+e);Ng(n)&&(t.ns=n.namespace);const s=[];return Ie(t,(r,o)=>{s.push(r+"="+o)}),i+s.join("&")}/**
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
 */class Og{constructor(){this.counters_={}}incrementCounter(e,t=1){dt(this.counters_,e)||(this.counters_[e]=0),this.counters_[e]+=t}get(){return wh(this.counters_)}}/**
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
 */const Ir={},Sr={};function $o(n){const e=n.toString();return Ir[e]||(Ir[e]=new Og),Ir[e]}function Dg(n,e){const t=n.toString();return Sr[t]||(Sr[t]=e()),Sr[t]}/**
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
 */class Mg{constructor(e){this.onMessage_=e,this.pendingResponses=[],this.currentResponseNum=0,this.closeAfterResponse=-1,this.onClose=null}closeAfter(e,t){this.closeAfterResponse=e,this.onClose=t,this.closeAfterResponse<this.currentResponseNum&&(this.onClose(),this.onClose=null)}handleResponse(e,t){for(this.pendingResponses[e]=t;this.pendingResponses[this.currentResponseNum];){const i=this.pendingResponses[this.currentResponseNum];delete this.pendingResponses[this.currentResponseNum];for(let s=0;s<i.length;++s)i[s]&&Wn(()=>{this.onMessage_(i[s])});if(this.currentResponseNum===this.closeAfterResponse){this.onClose&&(this.onClose(),this.onClose=null);break}this.currentResponseNum++}}}/**
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
 */const Il="start",Lg="close",Fg="pLPCommand",Ug="pRTLPCB",Rd="id",Ad="pw",xd="ser",$g="cb",Wg="seg",Bg="ts",Hg="d",Vg="dframe",Pd=1870,Nd=30,jg=Pd-Nd,qg=25e3,Gg=3e4;class _n{constructor(e,t,i,s,r,o,a){this.connId=e,this.repoInfo=t,this.applicationId=i,this.appCheckToken=s,this.authToken=r,this.transportSessionId=o,this.lastSessionId=a,this.bytesSent=0,this.bytesReceived=0,this.everConnected_=!1,this.log_=Di(e),this.stats_=$o(t),this.urlFn=l=>(this.appCheckToken&&(l[zr]=this.appCheckToken),kd(t,Sd,l))}open(e,t){this.curSegmentNum=0,this.onDisconnect_=t,this.myPacketOrderer=new Mg(e),this.isClosed_=!1,this.connectTimeoutTimer_=setTimeout(()=>{this.log_("Timed out trying to connect."),this.onClosed_(),this.connectTimeoutTimer_=null},Math.floor(Gg)),bg(()=>{if(this.isClosed_)return;this.scriptTagHolder=new Wo((...r)=>{const[o,a,l,c,f]=r;if(this.incrementIncomingBytes_(r),!!this.scriptTagHolder)if(this.connectTimeoutTimer_&&(clearTimeout(this.connectTimeoutTimer_),this.connectTimeoutTimer_=null),this.everConnected_=!0,o===Il)this.id=a,this.password=l;else if(o===Lg)a?(this.scriptTagHolder.sendNewPolls=!1,this.myPacketOrderer.closeAfter(a,()=>{this.onClosed_()})):this.onClosed_();else throw new Error("Unrecognized command received: "+o)},(...r)=>{const[o,a]=r;this.incrementIncomingBytes_(r),this.myPacketOrderer.handleResponse(o,a)},()=>{this.onClosed_()},this.urlFn);const i={};i[Il]="t",i[xd]=Math.floor(Math.random()*1e8),this.scriptTagHolder.uniqueCallbackIdentifier&&(i[$g]=this.scriptTagHolder.uniqueCallbackIdentifier),i[_d]=Uo,this.transportSessionId&&(i[yd]=this.transportSessionId),this.lastSessionId&&(i[Ed]=this.lastSessionId),this.applicationId&&(i[Cd]=this.applicationId),this.appCheckToken&&(i[zr]=this.appCheckToken),typeof location<"u"&&location.hostname&&bd.test(location.hostname)&&(i[vd]=wd);const s=this.urlFn(i);this.log_("Connecting via long-poll to "+s),this.scriptTagHolder.addTag(s,()=>{})})}start(){this.scriptTagHolder.startLongPoll(this.id,this.password),this.addDisconnectPingFrame(this.id,this.password)}static forceAllow(){_n.forceAllow_=!0}static forceDisallow(){_n.forceDisallow_=!0}static isAvailable(){return _n.forceAllow_?!0:!_n.forceDisallow_&&typeof document<"u"&&document.createElement!=null&&!Cg()&&!Ig()}markConnectionHealthy(){}shutdown_(){this.isClosed_=!0,this.scriptTagHolder&&(this.scriptTagHolder.close(),this.scriptTagHolder=null),this.myDisconnFrame&&(document.body.removeChild(this.myDisconnFrame),this.myDisconnFrame=null),this.connectTimeoutTimer_&&(clearTimeout(this.connectTimeoutTimer_),this.connectTimeoutTimer_=null)}onClosed_(){this.isClosed_||(this.log_("Longpoll is closing itself"),this.shutdown_(),this.onDisconnect_&&(this.onDisconnect_(this.everConnected_),this.onDisconnect_=null))}close(){this.isClosed_||(this.log_("Longpoll is being closed."),this.shutdown_())}send(e){const t=ye(e);this.bytesSent+=t.length,this.stats_.incrementCounter("bytes_sent",t.length);const i=vc(t),s=md(i,jg);for(let r=0;r<s.length;r++)this.scriptTagHolder.enqueueSegment(this.curSegmentNum,s.length,s[r]),this.curSegmentNum++}addDisconnectPingFrame(e,t){this.myDisconnFrame=document.createElement("iframe");const i={};i[Vg]="t",i[Rd]=e,i[Ad]=t,this.myDisconnFrame.src=this.urlFn(i),this.myDisconnFrame.style.display="none",document.body.appendChild(this.myDisconnFrame)}incrementIncomingBytes_(e){const t=ye(e).length;this.bytesReceived+=t,this.stats_.incrementCounter("bytes_received",t)}}class Wo{constructor(e,t,i,s){this.onDisconnect=i,this.urlFn=s,this.outstandingRequests=new Set,this.pendingSegs=[],this.currentSerial=Math.floor(Math.random()*1e8),this.sendNewPolls=!0;{this.uniqueCallbackIdentifier=yg(),window[Fg+this.uniqueCallbackIdentifier]=e,window[Ug+this.uniqueCallbackIdentifier]=t,this.myIFrame=Wo.createIFrame_();let r="";this.myIFrame.src&&this.myIFrame.src.substr(0,11)==="javascript:"&&(r='<script>document.domain="'+document.domain+'";<\/script>');const o="<html><body>"+r+"</body></html>";try{this.myIFrame.doc.open(),this.myIFrame.doc.write(o),this.myIFrame.doc.close()}catch(a){Ce("frame writing exception"),a.stack&&Ce(a.stack),Ce(a)}}}static createIFrame_(){const e=document.createElement("iframe");if(e.style.display="none",document.body){document.body.appendChild(e);try{e.contentWindow.document||Ce("No IE domain setting required")}catch{const i=document.domain;e.src="javascript:void((function(){document.open();document.domain='"+i+"';document.close();})())"}}else throw"Document body has not initialized. Wait to initialize Firebase until after the document is ready.";return e.contentDocument?e.doc=e.contentDocument:e.contentWindow?e.doc=e.contentWindow.document:e.document&&(e.doc=e.document),e}close(){this.alive=!1,this.myIFrame&&(this.myIFrame.doc.body.textContent="",setTimeout(()=>{this.myIFrame!==null&&(document.body.removeChild(this.myIFrame),this.myIFrame=null)},Math.floor(0)));const e=this.onDisconnect;e&&(this.onDisconnect=null,e())}startLongPoll(e,t){for(this.myID=e,this.myPW=t,this.alive=!0;this.newRequest_(););}newRequest_(){if(this.alive&&this.sendNewPolls&&this.outstandingRequests.size<(this.pendingSegs.length>0?2:1)){this.currentSerial++;const e={};e[Rd]=this.myID,e[Ad]=this.myPW,e[xd]=this.currentSerial;let t=this.urlFn(e),i="",s=0;for(;this.pendingSegs.length>0&&this.pendingSegs[0].d.length+Nd+i.length<=Pd;){const o=this.pendingSegs.shift();i=i+"&"+Wg+s+"="+o.seg+"&"+Bg+s+"="+o.ts+"&"+Hg+s+"="+o.d,s++}return t=t+i,this.addLongPollTag_(t,this.currentSerial),!0}else return!1}enqueueSegment(e,t,i){this.pendingSegs.push({seg:e,ts:t,d:i}),this.alive&&this.newRequest_()}addLongPollTag_(e,t){this.outstandingRequests.add(t);const i=()=>{this.outstandingRequests.delete(t),this.newRequest_()},s=setTimeout(i,Math.floor(qg)),r=()=>{clearTimeout(s),i()};this.addTag(e,r)}addTag(e,t){setTimeout(()=>{try{if(!this.sendNewPolls)return;const i=this.myIFrame.doc.createElement("script");i.type="text/javascript",i.async=!0,i.src=e,i.onload=i.onreadystatechange=function(){const s=i.readyState;(!s||s==="loaded"||s==="complete")&&(i.onload=i.onreadystatechange=null,i.parentNode&&i.parentNode.removeChild(i),t())},i.onerror=()=>{Ce("Long-poll script failed to load: "+e),this.sendNewPolls=!1,this.close()},this.myIFrame.doc.body.appendChild(i)}catch{}},Math.floor(1))}}/**
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
 */const zg=16384,Kg=45e3;let Ts=null;typeof MozWebSocket<"u"?Ts=MozWebSocket:typeof WebSocket<"u"&&(Ts=WebSocket);class Qe{constructor(e,t,i,s,r,o,a){this.connId=e,this.applicationId=i,this.appCheckToken=s,this.authToken=r,this.keepaliveTimer=null,this.frames=null,this.totalFrames=0,this.bytesSent=0,this.bytesReceived=0,this.log_=Di(this.connId),this.stats_=$o(t),this.connURL=Qe.connectionURL_(t,o,a,s,i),this.nodeAdmin=t.nodeAdmin}static connectionURL_(e,t,i,s,r){const o={};return o[_d]=Uo,typeof location<"u"&&location.hostname&&bd.test(location.hostname)&&(o[vd]=wd),t&&(o[yd]=t),i&&(o[Ed]=i),s&&(o[zr]=s),r&&(o[Cd]=r),kd(e,Id,o)}open(e,t){this.onDisconnect=t,this.onMessage=e,this.log_("Websocket connecting to "+this.connURL),this.everConnected_=!1,Zt.set("previous_websocket_failure",!0);try{let i;Ph(),this.mySock=new Ts(this.connURL,[],i)}catch(i){this.log_("Error instantiating WebSocket.");const s=i.message||i.data;s&&this.log_(s),this.onClosed_();return}this.mySock.onopen=()=>{this.log_("Websocket connected."),this.everConnected_=!0},this.mySock.onclose=()=>{this.log_("Websocket connection was disconnected."),this.mySock=null,this.onClosed_()},this.mySock.onmessage=i=>{this.handleIncomingFrame(i)},this.mySock.onerror=i=>{this.log_("WebSocket error.  Closing connection.");const s=i.message||i.data;s&&this.log_(s),this.onClosed_()}}start(){}static forceDisallow(){Qe.forceDisallow_=!0}static isAvailable(){let e=!1;if(typeof navigator<"u"&&navigator.userAgent){const t=/Android ([0-9]{0,}\.[0-9]{0,})/,i=navigator.userAgent.match(t);i&&i.length>1&&parseFloat(i[1])<4.4&&(e=!0)}return!e&&Ts!==null&&!Qe.forceDisallow_}static previouslyFailed(){return Zt.isInMemoryStorage||Zt.get("previous_websocket_failure")===!0}markConnectionHealthy(){Zt.remove("previous_websocket_failure")}appendFrame_(e){if(this.frames.push(e),this.frames.length===this.totalFrames){const t=this.frames.join("");this.frames=null;const i=hi(t);this.onMessage(i)}}handleNewFrameCount_(e){this.totalFrames=e,this.frames=[]}extractFrameCount_(e){if(C(this.frames===null,"We already have a frame buffer"),e.length<=6){const t=Number(e);if(!isNaN(t))return this.handleNewFrameCount_(t),null}return this.handleNewFrameCount_(1),e}handleIncomingFrame(e){if(this.mySock===null)return;const t=e.data;if(this.bytesReceived+=t.length,this.stats_.incrementCounter("bytes_received",t.length),this.resetKeepAlive(),this.frames!==null)this.appendFrame_(t);else{const i=this.extractFrameCount_(t);i!==null&&this.appendFrame_(i)}}send(e){this.resetKeepAlive();const t=ye(e);this.bytesSent+=t.length,this.stats_.incrementCounter("bytes_sent",t.length);const i=md(t,zg);i.length>1&&this.sendString_(String(i.length));for(let s=0;s<i.length;s++)this.sendString_(i[s])}shutdown_(){this.isClosed_=!0,this.keepaliveTimer&&(clearInterval(this.keepaliveTimer),this.keepaliveTimer=null),this.mySock&&(this.mySock.close(),this.mySock=null)}onClosed_(){this.isClosed_||(this.log_("WebSocket is closing itself"),this.shutdown_(),this.onDisconnect&&(this.onDisconnect(this.everConnected_),this.onDisconnect=null))}close(){this.isClosed_||(this.log_("WebSocket is being closed"),this.shutdown_())}resetKeepAlive(){clearInterval(this.keepaliveTimer),this.keepaliveTimer=setInterval(()=>{this.mySock&&this.sendString_("0"),this.resetKeepAlive()},Math.floor(Kg))}sendString_(e){try{this.mySock.send(e)}catch(t){this.log_("Exception thrown from WebSocket.send():",t.message||t.data,"Closing connection."),setTimeout(this.onClosed_.bind(this),0)}}}Qe.responsesRequiredToBeHealthy=2;Qe.healthyTimeout=3e4;/**
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
 */class gi{constructor(e){this.initTransports_(e)}static get ALL_TRANSPORTS(){return[_n,Qe]}static get IS_TRANSPORT_INITIALIZED(){return this.globalTransportInitialized_}initTransports_(e){const t=Qe&&Qe.isAvailable();let i=t&&!Qe.previouslyFailed();if(e.webSocketOnly&&(t||Ne("wss:// URL used, but browser isn't known to support websockets.  Trying anyway."),i=!0),i)this.transports_=[Qe];else{const s=this.transports_=[];for(const r of gi.ALL_TRANSPORTS)r&&r.isAvailable()&&s.push(r);gi.globalTransportInitialized_=!0}}initialTransport(){if(this.transports_.length>0)return this.transports_[0];throw new Error("No transports available")}upgradeTransport(){return this.transports_.length>1?this.transports_[1]:null}}gi.globalTransportInitialized_=!1;/**
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
 */const Yg=6e4,Qg=5e3,Jg=10*1024,Xg=100*1024,Tr="t",Sl="d",Zg="s",Tl="r",e_="e",kl="o",Rl="a",Al="n",xl="p",t_="h";class n_{constructor(e,t,i,s,r,o,a,l,c,f){this.id=e,this.repoInfo_=t,this.applicationId_=i,this.appCheckToken_=s,this.authToken_=r,this.onMessage_=o,this.onReady_=a,this.onDisconnect_=l,this.onKill_=c,this.lastSessionId=f,this.connectionCount=0,this.pendingDataMessages=[],this.state_=0,this.log_=Di("c:"+this.id+":"),this.transportManager_=new gi(t),this.log_("Connection created"),this.start_()}start_(){const e=this.transportManager_.initialTransport();this.conn_=new e(this.nextTransportId_(),this.repoInfo_,this.applicationId_,this.appCheckToken_,this.authToken_,null,this.lastSessionId),this.primaryResponsesRequired_=e.responsesRequiredToBeHealthy||0;const t=this.connReceiver_(this.conn_),i=this.disconnReceiver_(this.conn_);this.tx_=this.conn_,this.rx_=this.conn_,this.secondaryConn_=null,this.isHealthy_=!1,setTimeout(()=>{this.conn_&&this.conn_.open(t,i)},Math.floor(0));const s=e.healthyTimeout||0;s>0&&(this.healthyTimeout_=ai(()=>{this.healthyTimeout_=null,this.isHealthy_||(this.conn_&&this.conn_.bytesReceived>Xg?(this.log_("Connection exceeded healthy timeout but has received "+this.conn_.bytesReceived+" bytes.  Marking connection healthy."),this.isHealthy_=!0,this.conn_.markConnectionHealthy()):this.conn_&&this.conn_.bytesSent>Jg?this.log_("Connection exceeded healthy timeout but has sent "+this.conn_.bytesSent+" bytes.  Leaving connection alive."):(this.log_("Closing unhealthy connection after timeout."),this.close()))},Math.floor(s)))}nextTransportId_(){return"c:"+this.id+":"+this.connectionCount++}disconnReceiver_(e){return t=>{e===this.conn_?this.onConnectionLost_(t):e===this.secondaryConn_?(this.log_("Secondary connection lost."),this.onSecondaryConnectionLost_()):this.log_("closing an old connection")}}connReceiver_(e){return t=>{this.state_!==2&&(e===this.rx_?this.onPrimaryMessageReceived_(t):e===this.secondaryConn_?this.onSecondaryMessageReceived_(t):this.log_("message on old connection"))}}sendRequest(e){const t={t:"d",d:e};this.sendData_(t)}tryCleanupConnection(){this.tx_===this.secondaryConn_&&this.rx_===this.secondaryConn_&&(this.log_("cleaning up and promoting a connection: "+this.secondaryConn_.connId),this.conn_=this.secondaryConn_,this.secondaryConn_=null)}onSecondaryControl_(e){if(Tr in e){const t=e[Tr];t===Rl?this.upgradeIfSecondaryHealthy_():t===Tl?(this.log_("Got a reset on secondary, closing it"),this.secondaryConn_.close(),(this.tx_===this.secondaryConn_||this.rx_===this.secondaryConn_)&&this.close()):t===kl&&(this.log_("got pong on secondary."),this.secondaryResponsesRequired_--,this.upgradeIfSecondaryHealthy_())}}onSecondaryMessageReceived_(e){const t=Kn("t",e),i=Kn("d",e);if(t==="c")this.onSecondaryControl_(i);else if(t==="d")this.pendingDataMessages.push(i);else throw new Error("Unknown protocol layer: "+t)}upgradeIfSecondaryHealthy_(){this.secondaryResponsesRequired_<=0?(this.log_("Secondary connection is healthy."),this.isHealthy_=!0,this.secondaryConn_.markConnectionHealthy(),this.proceedWithUpgrade_()):(this.log_("sending ping on secondary."),this.secondaryConn_.send({t:"c",d:{t:xl,d:{}}}))}proceedWithUpgrade_(){this.secondaryConn_.start(),this.log_("sending client ack on secondary"),this.secondaryConn_.send({t:"c",d:{t:Rl,d:{}}}),this.log_("Ending transmission on primary"),this.conn_.send({t:"c",d:{t:Al,d:{}}}),this.tx_=this.secondaryConn_,this.tryCleanupConnection()}onPrimaryMessageReceived_(e){const t=Kn("t",e),i=Kn("d",e);t==="c"?this.onControl_(i):t==="d"&&this.onDataMessage_(i)}onDataMessage_(e){this.onPrimaryResponse_(),this.onMessage_(e)}onPrimaryResponse_(){this.isHealthy_||(this.primaryResponsesRequired_--,this.primaryResponsesRequired_<=0&&(this.log_("Primary connection is healthy."),this.isHealthy_=!0,this.conn_.markConnectionHealthy()))}onControl_(e){const t=Kn(Tr,e);if(Sl in e){const i=e[Sl];if(t===t_){const s=Object.assign({},i);this.repoInfo_.isUsingEmulator&&(s.h=this.repoInfo_.host),this.onHandshake_(s)}else if(t===Al){this.log_("recvd end transmission on primary"),this.rx_=this.secondaryConn_;for(let s=0;s<this.pendingDataMessages.length;++s)this.onDataMessage_(this.pendingDataMessages[s]);this.pendingDataMessages=[],this.tryCleanupConnection()}else t===Zg?this.onConnectionShutdown_(i):t===Tl?this.onReset_(i):t===e_?Gr("Server Error: "+i):t===kl?(this.log_("got pong on primary."),this.onPrimaryResponse_(),this.sendPingOnPrimaryIfNecessary_()):Gr("Unknown control packet command: "+t)}}onHandshake_(e){const t=e.ts,i=e.v,s=e.h;this.sessionId=e.s,this.repoInfo_.host=s,this.state_===0&&(this.conn_.start(),this.onConnectionEstablished_(this.conn_,t),Uo!==i&&Ne("Protocol version mismatch detected"),this.tryStartUpgrade_())}tryStartUpgrade_(){const e=this.transportManager_.upgradeTransport();e&&this.startUpgrade_(e)}startUpgrade_(e){this.secondaryConn_=new e(this.nextTransportId_(),this.repoInfo_,this.applicationId_,this.appCheckToken_,this.authToken_,this.sessionId),this.secondaryResponsesRequired_=e.responsesRequiredToBeHealthy||0;const t=this.connReceiver_(this.secondaryConn_),i=this.disconnReceiver_(this.secondaryConn_);this.secondaryConn_.open(t,i),ai(()=>{this.secondaryConn_&&(this.log_("Timed out trying to upgrade."),this.secondaryConn_.close())},Math.floor(Yg))}onReset_(e){this.log_("Reset packet received.  New host: "+e),this.repoInfo_.host=e,this.state_===1?this.close():(this.closeConnections_(),this.start_())}onConnectionEstablished_(e,t){this.log_("Realtime connection established."),this.conn_=e,this.state_=1,this.onReady_&&(this.onReady_(t,this.sessionId),this.onReady_=null),this.primaryResponsesRequired_===0?(this.log_("Primary connection is healthy."),this.isHealthy_=!0):ai(()=>{this.sendPingOnPrimaryIfNecessary_()},Math.floor(Qg))}sendPingOnPrimaryIfNecessary_(){!this.isHealthy_&&this.state_===1&&(this.log_("sending ping on primary."),this.sendData_({t:"c",d:{t:xl,d:{}}}))}onSecondaryConnectionLost_(){const e=this.secondaryConn_;this.secondaryConn_=null,(this.tx_===e||this.rx_===e)&&this.close()}onConnectionLost_(e){this.conn_=null,!e&&this.state_===0?(this.log_("Realtime connection failed."),this.repoInfo_.isCacheableHost()&&(Zt.remove("host:"+this.repoInfo_.host),this.repoInfo_.internalHost=this.repoInfo_.host)):this.state_===1&&this.log_("Realtime connection lost."),this.close()}onConnectionShutdown_(e){this.log_("Connection shutdown command received. Shutting down..."),this.onKill_&&(this.onKill_(e),this.onKill_=null),this.onDisconnect_=null,this.close()}sendData_(e){if(this.state_!==1)throw"Connection is not connected";this.tx_.send(e)}close(){this.state_!==2&&(this.log_("Closing realtime connection."),this.state_=2,this.closeConnections_(),this.onDisconnect_&&(this.onDisconnect_(),this.onDisconnect_=null))}closeConnections_(){this.log_("Shutting down all connections"),this.conn_&&(this.conn_.close(),this.conn_=null),this.secondaryConn_&&(this.secondaryConn_.close(),this.secondaryConn_=null),this.healthyTimeout_&&(clearTimeout(this.healthyTimeout_),this.healthyTimeout_=null)}}/**
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
 */class Od{put(e,t,i,s){}merge(e,t,i,s){}refreshAuthToken(e){}refreshAppCheckToken(e){}onDisconnectPut(e,t,i){}onDisconnectMerge(e,t,i){}onDisconnectCancel(e,t){}reportStats(e){}}/**
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
 */class Dd{constructor(e){this.allowedEvents_=e,this.listeners_={},C(Array.isArray(e)&&e.length>0,"Requires a non-empty array")}trigger(e,...t){if(Array.isArray(this.listeners_[e])){const i=[...this.listeners_[e]];for(let s=0;s<i.length;s++)i[s].callback.apply(i[s].context,t)}}on(e,t,i){this.validateEventType_(e),this.listeners_[e]=this.listeners_[e]||[],this.listeners_[e].push({callback:t,context:i});const s=this.getInitialEvent(e);s&&t.apply(i,s)}off(e,t,i){this.validateEventType_(e);const s=this.listeners_[e]||[];for(let r=0;r<s.length;r++)if(s[r].callback===t&&(!i||i===s[r].context)){s.splice(r,1);return}}validateEventType_(e){C(this.allowedEvents_.find(t=>t===e),"Unknown event: "+e)}}/**
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
 */class ks extends Dd{constructor(){super(["online"]),this.online_=!0,typeof window<"u"&&typeof window.addEventListener<"u"&&!Io()&&(window.addEventListener("online",()=>{this.online_||(this.online_=!0,this.trigger("online",!0))},!1),window.addEventListener("offline",()=>{this.online_&&(this.online_=!1,this.trigger("online",!1))},!1))}static getInstance(){return new ks}getInitialEvent(e){return C(e==="online","Unknown event type: "+e),[this.online_]}currentlyOnline(){return this.online_}}/**
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
 */const Pl=32,Nl=768;class le{constructor(e,t){if(t===void 0){this.pieces_=e.split("/");let i=0;for(let s=0;s<this.pieces_.length;s++)this.pieces_[s].length>0&&(this.pieces_[i]=this.pieces_[s],i++);this.pieces_.length=i,this.pieceNum_=0}else this.pieces_=e,this.pieceNum_=t}toString(){let e="";for(let t=this.pieceNum_;t<this.pieces_.length;t++)this.pieces_[t]!==""&&(e+="/"+this.pieces_[t]);return e||"/"}}function re(){return new le("")}function Y(n){return n.pieceNum_>=n.pieces_.length?null:n.pieces_[n.pieceNum_]}function Ft(n){return n.pieces_.length-n.pieceNum_}function ue(n){let e=n.pieceNum_;return e<n.pieces_.length&&e++,new le(n.pieces_,e)}function Bo(n){return n.pieceNum_<n.pieces_.length?n.pieces_[n.pieces_.length-1]:null}function i_(n){let e="";for(let t=n.pieceNum_;t<n.pieces_.length;t++)n.pieces_[t]!==""&&(e+="/"+encodeURIComponent(String(n.pieces_[t])));return e||"/"}function _i(n,e=0){return n.pieces_.slice(n.pieceNum_+e)}function Md(n){if(n.pieceNum_>=n.pieces_.length)return null;const e=[];for(let t=n.pieceNum_;t<n.pieces_.length-1;t++)e.push(n.pieces_[t]);return new le(e,0)}function ge(n,e){const t=[];for(let i=n.pieceNum_;i<n.pieces_.length;i++)t.push(n.pieces_[i]);if(e instanceof le)for(let i=e.pieceNum_;i<e.pieces_.length;i++)t.push(e.pieces_[i]);else{const i=e.split("/");for(let s=0;s<i.length;s++)i[s].length>0&&t.push(i[s])}return new le(t,0)}function Q(n){return n.pieceNum_>=n.pieces_.length}function Pe(n,e){const t=Y(n),i=Y(e);if(t===null)return e;if(t===i)return Pe(ue(n),ue(e));throw new Error("INTERNAL ERROR: innerPath ("+e+") is not within outerPath ("+n+")")}function s_(n,e){const t=_i(n,0),i=_i(e,0);for(let s=0;s<t.length&&s<i.length;s++){const r=un(t[s],i[s]);if(r!==0)return r}return t.length===i.length?0:t.length<i.length?-1:1}function Ho(n,e){if(Ft(n)!==Ft(e))return!1;for(let t=n.pieceNum_,i=e.pieceNum_;t<=n.pieces_.length;t++,i++)if(n.pieces_[t]!==e.pieces_[i])return!1;return!0}function Ve(n,e){let t=n.pieceNum_,i=e.pieceNum_;if(Ft(n)>Ft(e))return!1;for(;t<n.pieces_.length;){if(n.pieces_[t]!==e.pieces_[i])return!1;++t,++i}return!0}class r_{constructor(e,t){this.errorPrefix_=t,this.parts_=_i(e,0),this.byteLength_=Math.max(1,this.parts_.length);for(let i=0;i<this.parts_.length;i++)this.byteLength_+=js(this.parts_[i]);Ld(this)}}function o_(n,e){n.parts_.length>0&&(n.byteLength_+=1),n.parts_.push(e),n.byteLength_+=js(e),Ld(n)}function a_(n){const e=n.parts_.pop();n.byteLength_-=js(e),n.parts_.length>0&&(n.byteLength_-=1)}function Ld(n){if(n.byteLength_>Nl)throw new Error(n.errorPrefix_+"has a key path longer than "+Nl+" bytes ("+n.byteLength_+").");if(n.parts_.length>Pl)throw new Error(n.errorPrefix_+"path specified exceeds the maximum depth that can be written ("+Pl+") or object contains a cycle "+Xt(n))}function Xt(n){return n.parts_.length===0?"":"in property '"+n.parts_.join(".")+"'"}/**
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
 */class Vo extends Dd{constructor(){super(["visible"]);let e,t;typeof document<"u"&&typeof document.addEventListener<"u"&&(typeof document.hidden<"u"?(t="visibilitychange",e="hidden"):typeof document.mozHidden<"u"?(t="mozvisibilitychange",e="mozHidden"):typeof document.msHidden<"u"?(t="msvisibilitychange",e="msHidden"):typeof document.webkitHidden<"u"&&(t="webkitvisibilitychange",e="webkitHidden")),this.visible_=!0,t&&document.addEventListener(t,()=>{const i=!document[e];i!==this.visible_&&(this.visible_=i,this.trigger("visible",i))},!1)}static getInstance(){return new Vo}getInitialEvent(e){return C(e==="visible","Unknown event type: "+e),[this.visible_]}}/**
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
 */const Yn=1e3,l_=60*5*1e3,Ol=30*1e3,c_=1.3,d_=3e4,u_="server_kill",Dl=3;class vt extends Od{constructor(e,t,i,s,r,o,a,l){if(super(),this.repoInfo_=e,this.applicationId_=t,this.onDataUpdate_=i,this.onConnectStatus_=s,this.onServerInfoUpdate_=r,this.authTokenProvider_=o,this.appCheckTokenProvider_=a,this.authOverride_=l,this.id=vt.nextPersistentConnectionId_++,this.log_=Di("p:"+this.id+":"),this.interruptReasons_={},this.listens=new Map,this.outstandingPuts_=[],this.outstandingGets_=[],this.outstandingPutCount_=0,this.outstandingGetCount_=0,this.onDisconnectRequestQueue_=[],this.connected_=!1,this.reconnectDelay_=Yn,this.maxReconnectDelay_=l_,this.securityDebugCallback_=null,this.lastSessionId=null,this.establishConnectionTimer_=null,this.visible_=!1,this.requestCBHash_={},this.requestNumber_=0,this.realtime_=null,this.authToken_=null,this.appCheckToken_=null,this.forceTokenRefresh_=!1,this.invalidAuthTokenCount_=0,this.invalidAppCheckTokenCount_=0,this.firstConnection_=!0,this.lastConnectionAttemptTime_=null,this.lastConnectionEstablishedTime_=null,l)throw new Error("Auth override specified in options, but not supported on non Node.js platforms");Vo.getInstance().on("visible",this.onVisible_,this),e.host.indexOf("fblocal")===-1&&ks.getInstance().on("online",this.onOnline_,this)}sendRequest(e,t,i){const s=++this.requestNumber_,r={r:s,a:e,b:t};this.log_(ye(r)),C(this.connected_,"sendRequest call when we're not connected not allowed."),this.realtime_.sendRequest(r),i&&(this.requestCBHash_[s]=i)}get(e){this.initConnection_();const t=new rt,s={action:"g",request:{p:e._path.toString(),q:e._queryObject},onComplete:o=>{const a=o.d;o.s==="ok"?t.resolve(a):t.reject(a)}};this.outstandingGets_.push(s),this.outstandingGetCount_++;const r=this.outstandingGets_.length-1;return this.connected_&&this.sendGet_(r),t.promise}listen(e,t,i,s){this.initConnection_();const r=e._queryIdentifier,o=e._path.toString();this.log_("Listen called for "+o+" "+r),this.listens.has(o)||this.listens.set(o,new Map),C(e._queryParams.isDefault()||!e._queryParams.loadsAllData(),"listen() called for non-default but complete query"),C(!this.listens.get(o).has(r),"listen() called twice for same path/queryId.");const a={onComplete:s,hashFn:t,query:e,tag:i};this.listens.get(o).set(r,a),this.connected_&&this.sendListen_(a)}sendGet_(e){const t=this.outstandingGets_[e];this.sendRequest("g",t.request,i=>{delete this.outstandingGets_[e],this.outstandingGetCount_--,this.outstandingGetCount_===0&&(this.outstandingGets_=[]),t.onComplete&&t.onComplete(i)})}sendListen_(e){const t=e.query,i=t._path.toString(),s=t._queryIdentifier;this.log_("Listen on "+i+" for "+s);const r={p:i},o="q";e.tag&&(r.q=t._queryObject,r.t=e.tag),r.h=e.hashFn(),this.sendRequest(o,r,a=>{const l=a.d,c=a.s;vt.warnOnListenWarnings_(l,t),(this.listens.get(i)&&this.listens.get(i).get(s))===e&&(this.log_("listen response",a),c!=="ok"&&this.removeListen_(i,s),e.onComplete&&e.onComplete(c,l))})}static warnOnListenWarnings_(e,t){if(e&&typeof e=="object"&&dt(e,"w")){const i=In(e,"w");if(Array.isArray(i)&&~i.indexOf("no_index")){const s='".indexOn": "'+t._queryParams.getIndex().toString()+'"',r=t._path.toString();Ne(`Using an unspecified index. Your data will be downloaded and filtered on the client. Consider adding ${s} at ${r} to your security rules for better performance.`)}}}refreshAuthToken(e){this.authToken_=e,this.log_("Auth token refreshed"),this.authToken_?this.tryAuth():this.connected_&&this.sendRequest("unauth",{},()=>{}),this.reduceReconnectDelayIfAdminCredential_(e)}reduceReconnectDelayIfAdminCredential_(e){(e&&e.length===40||Uh(e))&&(this.log_("Admin auth credential detected.  Reducing max reconnect time."),this.maxReconnectDelay_=Ol)}refreshAppCheckToken(e){this.appCheckToken_=e,this.log_("App check token refreshed"),this.appCheckToken_?this.tryAppCheck():this.connected_&&this.sendRequest("unappeck",{},()=>{})}tryAuth(){if(this.connected_&&this.authToken_){const e=this.authToken_,t=Fh(e)?"auth":"gauth",i={cred:e};this.authOverride_===null?i.noauth=!0:typeof this.authOverride_=="object"&&(i.authvar=this.authOverride_),this.sendRequest(t,i,s=>{const r=s.s,o=s.d||"error";this.authToken_===e&&(r==="ok"?this.invalidAuthTokenCount_=0:this.onAuthRevoked_(r,o))})}}tryAppCheck(){this.connected_&&this.appCheckToken_&&this.sendRequest("appcheck",{token:this.appCheckToken_},e=>{const t=e.s,i=e.d||"error";t==="ok"?this.invalidAppCheckTokenCount_=0:this.onAppCheckRevoked_(t,i)})}unlisten(e,t){const i=e._path.toString(),s=e._queryIdentifier;this.log_("Unlisten called for "+i+" "+s),C(e._queryParams.isDefault()||!e._queryParams.loadsAllData(),"unlisten() called for non-default but complete query"),this.removeListen_(i,s)&&this.connected_&&this.sendUnlisten_(i,s,e._queryObject,t)}sendUnlisten_(e,t,i,s){this.log_("Unlisten on "+e+" for "+t);const r={p:e},o="n";s&&(r.q=i,r.t=s),this.sendRequest(o,r)}onDisconnectPut(e,t,i){this.initConnection_(),this.connected_?this.sendOnDisconnect_("o",e,t,i):this.onDisconnectRequestQueue_.push({pathString:e,action:"o",data:t,onComplete:i})}onDisconnectMerge(e,t,i){this.initConnection_(),this.connected_?this.sendOnDisconnect_("om",e,t,i):this.onDisconnectRequestQueue_.push({pathString:e,action:"om",data:t,onComplete:i})}onDisconnectCancel(e,t){this.initConnection_(),this.connected_?this.sendOnDisconnect_("oc",e,null,t):this.onDisconnectRequestQueue_.push({pathString:e,action:"oc",data:null,onComplete:t})}sendOnDisconnect_(e,t,i,s){const r={p:t,d:i};this.log_("onDisconnect "+e,r),this.sendRequest(e,r,o=>{s&&setTimeout(()=>{s(o.s,o.d)},Math.floor(0))})}put(e,t,i,s){this.putInternal("p",e,t,i,s)}merge(e,t,i,s){this.putInternal("m",e,t,i,s)}putInternal(e,t,i,s,r){this.initConnection_();const o={p:t,d:i};r!==void 0&&(o.h=r),this.outstandingPuts_.push({action:e,request:o,onComplete:s}),this.outstandingPutCount_++;const a=this.outstandingPuts_.length-1;this.connected_?this.sendPut_(a):this.log_("Buffering put: "+t)}sendPut_(e){const t=this.outstandingPuts_[e].action,i=this.outstandingPuts_[e].request,s=this.outstandingPuts_[e].onComplete;this.outstandingPuts_[e].queued=this.connected_,this.sendRequest(t,i,r=>{this.log_(t+" response",r),delete this.outstandingPuts_[e],this.outstandingPutCount_--,this.outstandingPutCount_===0&&(this.outstandingPuts_=[]),s&&s(r.s,r.d)})}reportStats(e){if(this.connected_){const t={c:e};this.log_("reportStats",t),this.sendRequest("s",t,i=>{if(i.s!=="ok"){const r=i.d;this.log_("reportStats","Error sending stats: "+r)}})}}onDataMessage_(e){if("r"in e){this.log_("from server: "+ye(e));const t=e.r,i=this.requestCBHash_[t];i&&(delete this.requestCBHash_[t],i(e.b))}else{if("error"in e)throw"A server-side error has occurred: "+e.error;"a"in e&&this.onDataPush_(e.a,e.b)}}onDataPush_(e,t){this.log_("handleServerMessage",e,t),e==="d"?this.onDataUpdate_(t.p,t.d,!1,t.t):e==="m"?this.onDataUpdate_(t.p,t.d,!0,t.t):e==="c"?this.onListenRevoked_(t.p,t.q):e==="ac"?this.onAuthRevoked_(t.s,t.d):e==="apc"?this.onAppCheckRevoked_(t.s,t.d):e==="sd"?this.onSecurityDebugPacket_(t):Gr("Unrecognized action received from server: "+ye(e)+`
Are you using the latest client?`)}onReady_(e,t){this.log_("connection ready"),this.connected_=!0,this.lastConnectionEstablishedTime_=new Date().getTime(),this.handleTimestamp_(e),this.lastSessionId=t,this.firstConnection_&&this.sendConnectStats_(),this.restoreState_(),this.firstConnection_=!1,this.onConnectStatus_(!0)}scheduleConnect_(e){C(!this.realtime_,"Scheduling a connect when we're already connected/ing?"),this.establishConnectionTimer_&&clearTimeout(this.establishConnectionTimer_),this.establishConnectionTimer_=setTimeout(()=>{this.establishConnectionTimer_=null,this.establishConnection_()},Math.floor(e))}initConnection_(){!this.realtime_&&this.firstConnection_&&this.scheduleConnect_(0)}onVisible_(e){e&&!this.visible_&&this.reconnectDelay_===this.maxReconnectDelay_&&(this.log_("Window became visible.  Reducing delay."),this.reconnectDelay_=Yn,this.realtime_||this.scheduleConnect_(0)),this.visible_=e}onOnline_(e){e?(this.log_("Browser went online."),this.reconnectDelay_=Yn,this.realtime_||this.scheduleConnect_(0)):(this.log_("Browser went offline.  Killing connection."),this.realtime_&&this.realtime_.close())}onRealtimeDisconnect_(){if(this.log_("data client disconnected"),this.connected_=!1,this.realtime_=null,this.cancelSentTransactions_(),this.requestCBHash_={},this.shouldReconnect_()){this.visible_?this.lastConnectionEstablishedTime_&&(new Date().getTime()-this.lastConnectionEstablishedTime_>d_&&(this.reconnectDelay_=Yn),this.lastConnectionEstablishedTime_=null):(this.log_("Window isn't visible.  Delaying reconnect."),this.reconnectDelay_=this.maxReconnectDelay_,this.lastConnectionAttemptTime_=new Date().getTime());const e=new Date().getTime()-this.lastConnectionAttemptTime_;let t=Math.max(0,this.reconnectDelay_-e);t=Math.random()*t,this.log_("Trying to reconnect in "+t+"ms"),this.scheduleConnect_(t),this.reconnectDelay_=Math.min(this.maxReconnectDelay_,this.reconnectDelay_*c_)}this.onConnectStatus_(!1)}async establishConnection_(){if(this.shouldReconnect_()){this.log_("Making a connection attempt"),this.lastConnectionAttemptTime_=new Date().getTime(),this.lastConnectionEstablishedTime_=null;const e=this.onDataMessage_.bind(this),t=this.onReady_.bind(this),i=this.onRealtimeDisconnect_.bind(this),s=this.id+":"+vt.nextConnectionId_++,r=this.lastSessionId;let o=!1,a=null;const l=function(){a?a.close():(o=!0,i())},c=function(u){C(a,"sendRequest call when we're not connected not allowed."),a.sendRequest(u)};this.realtime_={close:l,sendRequest:c};const f=this.forceTokenRefresh_;this.forceTokenRefresh_=!1;try{const[u,_]=await Promise.all([this.authTokenProvider_.getToken(f),this.appCheckTokenProvider_.getToken(f)]);o?Ce("getToken() completed but was canceled"):(Ce("getToken() completed. Creating connection."),this.authToken_=u&&u.accessToken,this.appCheckToken_=_&&_.token,a=new n_(s,this.repoInfo_,this.applicationId_,this.appCheckToken_,this.authToken_,e,t,i,m=>{Ne(m+" ("+this.repoInfo_.toString()+")"),this.interrupt(u_)},r))}catch(u){this.log_("Failed to get token: "+u),o||(this.repoInfo_.nodeAdmin&&Ne(u),l())}}}interrupt(e){Ce("Interrupting connection for reason: "+e),this.interruptReasons_[e]=!0,this.realtime_?this.realtime_.close():(this.establishConnectionTimer_&&(clearTimeout(this.establishConnectionTimer_),this.establishConnectionTimer_=null),this.connected_&&this.onRealtimeDisconnect_())}resume(e){Ce("Resuming connection for reason: "+e),delete this.interruptReasons_[e],_s(this.interruptReasons_)&&(this.reconnectDelay_=Yn,this.realtime_||this.scheduleConnect_(0))}handleTimestamp_(e){const t=e-new Date().getTime();this.onServerInfoUpdate_({serverTimeOffset:t})}cancelSentTransactions_(){for(let e=0;e<this.outstandingPuts_.length;e++){const t=this.outstandingPuts_[e];t&&"h"in t.request&&t.queued&&(t.onComplete&&t.onComplete("disconnect"),delete this.outstandingPuts_[e],this.outstandingPutCount_--)}this.outstandingPutCount_===0&&(this.outstandingPuts_=[])}onListenRevoked_(e,t){let i;t?i=t.map(r=>Fo(r)).join("$"):i="default";const s=this.removeListen_(e,i);s&&s.onComplete&&s.onComplete("permission_denied")}removeListen_(e,t){const i=new le(e).toString();let s;if(this.listens.has(i)){const r=this.listens.get(i);s=r.get(t),r.delete(t),r.size===0&&this.listens.delete(i)}else s=void 0;return s}onAuthRevoked_(e,t){Ce("Auth token revoked: "+e+"/"+t),this.authToken_=null,this.forceTokenRefresh_=!0,this.realtime_.close(),(e==="invalid_token"||e==="permission_denied")&&(this.invalidAuthTokenCount_++,this.invalidAuthTokenCount_>=Dl&&(this.reconnectDelay_=Ol,this.authTokenProvider_.notifyForInvalidToken()))}onAppCheckRevoked_(e,t){Ce("App check token revoked: "+e+"/"+t),this.appCheckToken_=null,this.forceTokenRefresh_=!0,(e==="invalid_token"||e==="permission_denied")&&(this.invalidAppCheckTokenCount_++,this.invalidAppCheckTokenCount_>=Dl&&this.appCheckTokenProvider_.notifyForInvalidToken())}onSecurityDebugPacket_(e){this.securityDebugCallback_?this.securityDebugCallback_(e):"msg"in e&&console.log("FIREBASE: "+e.msg.replace(`
`,`
FIREBASE: `))}restoreState_(){this.tryAuth(),this.tryAppCheck();for(const e of this.listens.values())for(const t of e.values())this.sendListen_(t);for(let e=0;e<this.outstandingPuts_.length;e++)this.outstandingPuts_[e]&&this.sendPut_(e);for(;this.onDisconnectRequestQueue_.length;){const e=this.onDisconnectRequestQueue_.shift();this.sendOnDisconnect_(e.action,e.pathString,e.data,e.onComplete)}for(let e=0;e<this.outstandingGets_.length;e++)this.outstandingGets_[e]&&this.sendGet_(e)}sendConnectStats_(){const e={};let t="js";e["sdk."+t+"."+hd.replace(/\./g,"-")]=1,Io()?e["framework.cordova"]=1:Ic()&&(e["framework.reactnative"]=1),this.reportStats(e)}shouldReconnect_(){const e=ks.getInstance().currentlyOnline();return _s(this.interruptReasons_)&&e}}vt.nextPersistentConnectionId_=0;vt.nextConnectionId_=0;/**
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
 */class Z{constructor(e,t){this.name=e,this.node=t}static Wrap(e,t){return new Z(e,t)}}/**
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
 */class Ys{getCompare(){return this.compare.bind(this)}indexedValueChanged(e,t){const i=new Z(an,e),s=new Z(an,t);return this.compare(i,s)!==0}minPost(){return Z.MIN}}/**
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
 */let ts;class Fd extends Ys{static get __EMPTY_NODE(){return ts}static set __EMPTY_NODE(e){ts=e}compare(e,t){return un(e.name,t.name)}isDefinedOn(e){throw Ln("KeyIndex.isDefinedOn not expected to be called.")}indexedValueChanged(e,t){return!1}minPost(){return Z.MIN}maxPost(){return new Z(Lt,ts)}makePost(e,t){return C(typeof e=="string","KeyIndex indexValue must always be a string."),new Z(e,ts)}toString(){return".key"}}const tn=new Fd;/**
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
 */class ns{constructor(e,t,i,s,r=null){this.isReverse_=s,this.resultGenerator_=r,this.nodeStack_=[];let o=1;for(;!e.isEmpty();)if(e=e,o=t?i(e.key,t):1,s&&(o*=-1),o<0)this.isReverse_?e=e.left:e=e.right;else if(o===0){this.nodeStack_.push(e);break}else this.nodeStack_.push(e),this.isReverse_?e=e.right:e=e.left}getNext(){if(this.nodeStack_.length===0)return null;let e=this.nodeStack_.pop(),t;if(this.resultGenerator_?t=this.resultGenerator_(e.key,e.value):t={key:e.key,value:e.value},this.isReverse_)for(e=e.left;!e.isEmpty();)this.nodeStack_.push(e),e=e.right;else for(e=e.right;!e.isEmpty();)this.nodeStack_.push(e),e=e.left;return t}hasNext(){return this.nodeStack_.length>0}peek(){if(this.nodeStack_.length===0)return null;const e=this.nodeStack_[this.nodeStack_.length-1];return this.resultGenerator_?this.resultGenerator_(e.key,e.value):{key:e.key,value:e.value}}}class Ee{constructor(e,t,i,s,r){this.key=e,this.value=t,this.color=i??Ee.RED,this.left=s??Fe.EMPTY_NODE,this.right=r??Fe.EMPTY_NODE}copy(e,t,i,s,r){return new Ee(e??this.key,t??this.value,i??this.color,s??this.left,r??this.right)}count(){return this.left.count()+1+this.right.count()}isEmpty(){return!1}inorderTraversal(e){return this.left.inorderTraversal(e)||!!e(this.key,this.value)||this.right.inorderTraversal(e)}reverseTraversal(e){return this.right.reverseTraversal(e)||e(this.key,this.value)||this.left.reverseTraversal(e)}min_(){return this.left.isEmpty()?this:this.left.min_()}minKey(){return this.min_().key}maxKey(){return this.right.isEmpty()?this.key:this.right.maxKey()}insert(e,t,i){let s=this;const r=i(e,s.key);return r<0?s=s.copy(null,null,null,s.left.insert(e,t,i),null):r===0?s=s.copy(null,t,null,null,null):s=s.copy(null,null,null,null,s.right.insert(e,t,i)),s.fixUp_()}removeMin_(){if(this.left.isEmpty())return Fe.EMPTY_NODE;let e=this;return!e.left.isRed_()&&!e.left.left.isRed_()&&(e=e.moveRedLeft_()),e=e.copy(null,null,null,e.left.removeMin_(),null),e.fixUp_()}remove(e,t){let i,s;if(i=this,t(e,i.key)<0)!i.left.isEmpty()&&!i.left.isRed_()&&!i.left.left.isRed_()&&(i=i.moveRedLeft_()),i=i.copy(null,null,null,i.left.remove(e,t),null);else{if(i.left.isRed_()&&(i=i.rotateRight_()),!i.right.isEmpty()&&!i.right.isRed_()&&!i.right.left.isRed_()&&(i=i.moveRedRight_()),t(e,i.key)===0){if(i.right.isEmpty())return Fe.EMPTY_NODE;s=i.right.min_(),i=i.copy(s.key,s.value,null,null,i.right.removeMin_())}i=i.copy(null,null,null,null,i.right.remove(e,t))}return i.fixUp_()}isRed_(){return this.color}fixUp_(){let e=this;return e.right.isRed_()&&!e.left.isRed_()&&(e=e.rotateLeft_()),e.left.isRed_()&&e.left.left.isRed_()&&(e=e.rotateRight_()),e.left.isRed_()&&e.right.isRed_()&&(e=e.colorFlip_()),e}moveRedLeft_(){let e=this.colorFlip_();return e.right.left.isRed_()&&(e=e.copy(null,null,null,null,e.right.rotateRight_()),e=e.rotateLeft_(),e=e.colorFlip_()),e}moveRedRight_(){let e=this.colorFlip_();return e.left.left.isRed_()&&(e=e.rotateRight_(),e=e.colorFlip_()),e}rotateLeft_(){const e=this.copy(null,null,Ee.RED,null,this.right.left);return this.right.copy(null,null,this.color,e,null)}rotateRight_(){const e=this.copy(null,null,Ee.RED,this.left.right,null);return this.left.copy(null,null,this.color,null,e)}colorFlip_(){const e=this.left.copy(null,null,!this.left.color,null,null),t=this.right.copy(null,null,!this.right.color,null,null);return this.copy(null,null,!this.color,e,t)}checkMaxDepth_(){const e=this.check_();return Math.pow(2,e)<=this.count()+1}check_(){if(this.isRed_()&&this.left.isRed_())throw new Error("Red node has red child("+this.key+","+this.value+")");if(this.right.isRed_())throw new Error("Right child of ("+this.key+","+this.value+") is red");const e=this.left.check_();if(e!==this.right.check_())throw new Error("Black depths differ");return e+(this.isRed_()?0:1)}}Ee.RED=!0;Ee.BLACK=!1;class h_{copy(e,t,i,s,r){return this}insert(e,t,i){return new Ee(e,t,null)}remove(e,t){return this}count(){return 0}isEmpty(){return!0}inorderTraversal(e){return!1}reverseTraversal(e){return!1}minKey(){return null}maxKey(){return null}check_(){return 0}isRed_(){return!1}}class Fe{constructor(e,t=Fe.EMPTY_NODE){this.comparator_=e,this.root_=t}insert(e,t){return new Fe(this.comparator_,this.root_.insert(e,t,this.comparator_).copy(null,null,Ee.BLACK,null,null))}remove(e){return new Fe(this.comparator_,this.root_.remove(e,this.comparator_).copy(null,null,Ee.BLACK,null,null))}get(e){let t,i=this.root_;for(;!i.isEmpty();){if(t=this.comparator_(e,i.key),t===0)return i.value;t<0?i=i.left:t>0&&(i=i.right)}return null}getPredecessorKey(e){let t,i=this.root_,s=null;for(;!i.isEmpty();)if(t=this.comparator_(e,i.key),t===0){if(i.left.isEmpty())return s?s.key:null;for(i=i.left;!i.right.isEmpty();)i=i.right;return i.key}else t<0?i=i.left:t>0&&(s=i,i=i.right);throw new Error("Attempted to find predecessor key for a nonexistent key.  What gives?")}isEmpty(){return this.root_.isEmpty()}count(){return this.root_.count()}minKey(){return this.root_.minKey()}maxKey(){return this.root_.maxKey()}inorderTraversal(e){return this.root_.inorderTraversal(e)}reverseTraversal(e){return this.root_.reverseTraversal(e)}getIterator(e){return new ns(this.root_,null,this.comparator_,!1,e)}getIteratorFrom(e,t){return new ns(this.root_,e,this.comparator_,!1,t)}getReverseIteratorFrom(e,t){return new ns(this.root_,e,this.comparator_,!0,t)}getReverseIterator(e){return new ns(this.root_,null,this.comparator_,!0,e)}}Fe.EMPTY_NODE=new h_;/**
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
 */function f_(n,e){return un(n.name,e.name)}function jo(n,e){return un(n,e)}/**
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
 */let Kr;function p_(n){Kr=n}const Ud=function(n){return typeof n=="number"?"number:"+gd(n):"string:"+n},$d=function(n){if(n.isLeafNode()){const e=n.val();C(typeof e=="string"||typeof e=="number"||typeof e=="object"&&dt(e,".sv"),"Priority must be a string or number.")}else C(n===Kr||n.isEmpty(),"priority of unexpected type.");C(n===Kr||n.getPriority().isEmpty(),"Priority nodes can't have a priority of their own.")};/**
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
 */let Ml;class be{constructor(e,t=be.__childrenNodeConstructor.EMPTY_NODE){this.value_=e,this.priorityNode_=t,this.lazyHash_=null,C(this.value_!==void 0&&this.value_!==null,"LeafNode shouldn't be created with null/undefined value."),$d(this.priorityNode_)}static set __childrenNodeConstructor(e){Ml=e}static get __childrenNodeConstructor(){return Ml}isLeafNode(){return!0}getPriority(){return this.priorityNode_}updatePriority(e){return new be(this.value_,e)}getImmediateChild(e){return e===".priority"?this.priorityNode_:be.__childrenNodeConstructor.EMPTY_NODE}getChild(e){return Q(e)?this:Y(e)===".priority"?this.priorityNode_:be.__childrenNodeConstructor.EMPTY_NODE}hasChild(){return!1}getPredecessorChildName(e,t){return null}updateImmediateChild(e,t){return e===".priority"?this.updatePriority(t):t.isEmpty()&&e!==".priority"?this:be.__childrenNodeConstructor.EMPTY_NODE.updateImmediateChild(e,t).updatePriority(this.priorityNode_)}updateChild(e,t){const i=Y(e);return i===null?t:t.isEmpty()&&i!==".priority"?this:(C(i!==".priority"||Ft(e)===1,".priority must be the last token in a path"),this.updateImmediateChild(i,be.__childrenNodeConstructor.EMPTY_NODE.updateChild(ue(e),t)))}isEmpty(){return!1}numChildren(){return 0}forEachChild(e,t){return!1}val(e){return e&&!this.getPriority().isEmpty()?{".value":this.getValue(),".priority":this.getPriority().val()}:this.getValue()}hash(){if(this.lazyHash_===null){let e="";this.priorityNode_.isEmpty()||(e+="priority:"+Ud(this.priorityNode_.val())+":");const t=typeof this.value_;e+=t+":",t==="number"?e+=gd(this.value_):e+=this.value_,this.lazyHash_=pd(e)}return this.lazyHash_}getValue(){return this.value_}compareTo(e){return e===be.__childrenNodeConstructor.EMPTY_NODE?1:e instanceof be.__childrenNodeConstructor?-1:(C(e.isLeafNode(),"Unknown node type"),this.compareToLeafNode_(e))}compareToLeafNode_(e){const t=typeof e.value_,i=typeof this.value_,s=be.VALUE_TYPE_ORDER.indexOf(t),r=be.VALUE_TYPE_ORDER.indexOf(i);return C(s>=0,"Unknown leaf type: "+t),C(r>=0,"Unknown leaf type: "+i),s===r?i==="object"?0:this.value_<e.value_?-1:this.value_===e.value_?0:1:r-s}withIndex(){return this}isIndexed(){return!0}equals(e){if(e===this)return!0;if(e.isLeafNode()){const t=e;return this.value_===t.value_&&this.priorityNode_.equals(t.priorityNode_)}else return!1}}be.VALUE_TYPE_ORDER=["object","boolean","number","string"];/**
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
 */let Wd,Bd;function m_(n){Wd=n}function g_(n){Bd=n}class __ extends Ys{compare(e,t){const i=e.node.getPriority(),s=t.node.getPriority(),r=i.compareTo(s);return r===0?un(e.name,t.name):r}isDefinedOn(e){return!e.getPriority().isEmpty()}indexedValueChanged(e,t){return!e.getPriority().equals(t.getPriority())}minPost(){return Z.MIN}maxPost(){return new Z(Lt,new be("[PRIORITY-POST]",Bd))}makePost(e,t){const i=Wd(e);return new Z(t,new be("[PRIORITY-POST]",i))}toString(){return".priority"}}const pe=new __;/**
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
 */const y_=Math.log(2);class v_{constructor(e){const t=r=>parseInt(Math.log(r)/y_,10),i=r=>parseInt(Array(r+1).join("1"),2);this.count=t(e+1),this.current_=this.count-1;const s=i(this.count);this.bits_=e+1&s}nextBitIsOne(){const e=!(this.bits_&1<<this.current_);return this.current_--,e}}const Rs=function(n,e,t,i){n.sort(e);const s=function(l,c){const f=c-l;let u,_;if(f===0)return null;if(f===1)return u=n[l],_=t?t(u):u,new Ee(_,u.node,Ee.BLACK,null,null);{const m=parseInt(f/2,10)+l,w=s(l,m),x=s(m+1,c);return u=n[m],_=t?t(u):u,new Ee(_,u.node,Ee.BLACK,w,x)}},r=function(l){let c=null,f=null,u=n.length;const _=function(w,x){const R=u-w,H=u;u-=w;const V=s(R+1,H),j=n[R],N=t?t(j):j;m(new Ee(N,j.node,x,null,V))},m=function(w){c?(c.left=w,c=w):(f=w,c=w)};for(let w=0;w<l.count;++w){const x=l.nextBitIsOne(),R=Math.pow(2,l.count-(w+1));x?_(R,Ee.BLACK):(_(R,Ee.BLACK),_(R,Ee.RED))}return f},o=new v_(n.length),a=r(o);return new Fe(i||e,a)};/**
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
 */let kr;const pn={};class gt{constructor(e,t){this.indexes_=e,this.indexSet_=t}static get Default(){return C(pn&&pe,"ChildrenNode.ts has not been loaded"),kr=kr||new gt({".priority":pn},{".priority":pe}),kr}get(e){const t=In(this.indexes_,e);if(!t)throw new Error("No index defined for "+e);return t instanceof Fe?t:null}hasIndex(e){return dt(this.indexSet_,e.toString())}addIndex(e,t){C(e!==tn,"KeyIndex always exists and isn't meant to be added to the IndexMap.");const i=[];let s=!1;const r=t.getIterator(Z.Wrap);let o=r.getNext();for(;o;)s=s||e.isDefinedOn(o.node),i.push(o),o=r.getNext();let a;s?a=Rs(i,e.getCompare()):a=pn;const l=e.toString(),c=Object.assign({},this.indexSet_);c[l]=e;const f=Object.assign({},this.indexes_);return f[l]=a,new gt(f,c)}addToIndexes(e,t){const i=ys(this.indexes_,(s,r)=>{const o=In(this.indexSet_,r);if(C(o,"Missing index implementation for "+r),s===pn)if(o.isDefinedOn(e.node)){const a=[],l=t.getIterator(Z.Wrap);let c=l.getNext();for(;c;)c.name!==e.name&&a.push(c),c=l.getNext();return a.push(e),Rs(a,o.getCompare())}else return pn;else{const a=t.get(e.name);let l=s;return a&&(l=l.remove(new Z(e.name,a))),l.insert(e,e.node)}});return new gt(i,this.indexSet_)}removeFromIndexes(e,t){const i=ys(this.indexes_,s=>{if(s===pn)return s;{const r=t.get(e.name);return r?s.remove(new Z(e.name,r)):s}});return new gt(i,this.indexSet_)}}/**
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
 */let Qn;class F{constructor(e,t,i){this.children_=e,this.priorityNode_=t,this.indexMap_=i,this.lazyHash_=null,this.priorityNode_&&$d(this.priorityNode_),this.children_.isEmpty()&&C(!this.priorityNode_||this.priorityNode_.isEmpty(),"An empty node cannot have a priority")}static get EMPTY_NODE(){return Qn||(Qn=new F(new Fe(jo),null,gt.Default))}isLeafNode(){return!1}getPriority(){return this.priorityNode_||Qn}updatePriority(e){return this.children_.isEmpty()?this:new F(this.children_,e,this.indexMap_)}getImmediateChild(e){if(e===".priority")return this.getPriority();{const t=this.children_.get(e);return t===null?Qn:t}}getChild(e){const t=Y(e);return t===null?this:this.getImmediateChild(t).getChild(ue(e))}hasChild(e){return this.children_.get(e)!==null}updateImmediateChild(e,t){if(C(t,"We should always be passing snapshot nodes"),e===".priority")return this.updatePriority(t);{const i=new Z(e,t);let s,r;t.isEmpty()?(s=this.children_.remove(e),r=this.indexMap_.removeFromIndexes(i,this.children_)):(s=this.children_.insert(e,t),r=this.indexMap_.addToIndexes(i,this.children_));const o=s.isEmpty()?Qn:this.priorityNode_;return new F(s,o,r)}}updateChild(e,t){const i=Y(e);if(i===null)return t;{C(Y(e)!==".priority"||Ft(e)===1,".priority must be the last token in a path");const s=this.getImmediateChild(i).updateChild(ue(e),t);return this.updateImmediateChild(i,s)}}isEmpty(){return this.children_.isEmpty()}numChildren(){return this.children_.count()}val(e){if(this.isEmpty())return null;const t={};let i=0,s=0,r=!0;if(this.forEachChild(pe,(o,a)=>{t[o]=a.val(e),i++,r&&F.INTEGER_REGEXP_.test(o)?s=Math.max(s,Number(o)):r=!1}),!e&&r&&s<2*i){const o=[];for(const a in t)o[a]=t[a];return o}else return e&&!this.getPriority().isEmpty()&&(t[".priority"]=this.getPriority().val()),t}hash(){if(this.lazyHash_===null){let e="";this.getPriority().isEmpty()||(e+="priority:"+Ud(this.getPriority().val())+":"),this.forEachChild(pe,(t,i)=>{const s=i.hash();s!==""&&(e+=":"+t+":"+s)}),this.lazyHash_=e===""?"":pd(e)}return this.lazyHash_}getPredecessorChildName(e,t,i){const s=this.resolveIndex_(i);if(s){const r=s.getPredecessorKey(new Z(e,t));return r?r.name:null}else return this.children_.getPredecessorKey(e)}getFirstChildName(e){const t=this.resolveIndex_(e);if(t){const i=t.minKey();return i&&i.name}else return this.children_.minKey()}getFirstChild(e){const t=this.getFirstChildName(e);return t?new Z(t,this.children_.get(t)):null}getLastChildName(e){const t=this.resolveIndex_(e);if(t){const i=t.maxKey();return i&&i.name}else return this.children_.maxKey()}getLastChild(e){const t=this.getLastChildName(e);return t?new Z(t,this.children_.get(t)):null}forEachChild(e,t){const i=this.resolveIndex_(e);return i?i.inorderTraversal(s=>t(s.name,s.node)):this.children_.inorderTraversal(t)}getIterator(e){return this.getIteratorFrom(e.minPost(),e)}getIteratorFrom(e,t){const i=this.resolveIndex_(t);if(i)return i.getIteratorFrom(e,s=>s);{const s=this.children_.getIteratorFrom(e.name,Z.Wrap);let r=s.peek();for(;r!=null&&t.compare(r,e)<0;)s.getNext(),r=s.peek();return s}}getReverseIterator(e){return this.getReverseIteratorFrom(e.maxPost(),e)}getReverseIteratorFrom(e,t){const i=this.resolveIndex_(t);if(i)return i.getReverseIteratorFrom(e,s=>s);{const s=this.children_.getReverseIteratorFrom(e.name,Z.Wrap);let r=s.peek();for(;r!=null&&t.compare(r,e)>0;)s.getNext(),r=s.peek();return s}}compareTo(e){return this.isEmpty()?e.isEmpty()?0:-1:e.isLeafNode()||e.isEmpty()?1:e===Mi?-1:0}withIndex(e){if(e===tn||this.indexMap_.hasIndex(e))return this;{const t=this.indexMap_.addIndex(e,this.children_);return new F(this.children_,this.priorityNode_,t)}}isIndexed(e){return e===tn||this.indexMap_.hasIndex(e)}equals(e){if(e===this)return!0;if(e.isLeafNode())return!1;{const t=e;if(this.getPriority().equals(t.getPriority()))if(this.children_.count()===t.children_.count()){const i=this.getIterator(pe),s=t.getIterator(pe);let r=i.getNext(),o=s.getNext();for(;r&&o;){if(r.name!==o.name||!r.node.equals(o.node))return!1;r=i.getNext(),o=s.getNext()}return r===null&&o===null}else return!1;else return!1}}resolveIndex_(e){return e===tn?null:this.indexMap_.get(e.toString())}}F.INTEGER_REGEXP_=/^(0|[1-9]\d*)$/;class w_ extends F{constructor(){super(new Fe(jo),F.EMPTY_NODE,gt.Default)}compareTo(e){return e===this?0:1}equals(e){return e===this}getPriority(){return this}getImmediateChild(e){return F.EMPTY_NODE}isEmpty(){return!1}}const Mi=new w_;Object.defineProperties(Z,{MIN:{value:new Z(an,F.EMPTY_NODE)},MAX:{value:new Z(Lt,Mi)}});Fd.__EMPTY_NODE=F.EMPTY_NODE;be.__childrenNodeConstructor=F;p_(Mi);g_(Mi);/**
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
 */const b_=!0;function _e(n,e=null){if(n===null)return F.EMPTY_NODE;if(typeof n=="object"&&".priority"in n&&(e=n[".priority"]),C(e===null||typeof e=="string"||typeof e=="number"||typeof e=="object"&&".sv"in e,"Invalid priority type found: "+typeof e),typeof n=="object"&&".value"in n&&n[".value"]!==null&&(n=n[".value"]),typeof n!="object"||".sv"in n){const t=n;return new be(t,_e(e))}if(!(n instanceof Array)&&b_){const t=[];let i=!1;if(Ie(n,(o,a)=>{if(o.substring(0,1)!=="."){const l=_e(a);l.isEmpty()||(i=i||!l.getPriority().isEmpty(),t.push(new Z(o,l)))}}),t.length===0)return F.EMPTY_NODE;const r=Rs(t,f_,o=>o.name,jo);if(i){const o=Rs(t,pe.getCompare());return new F(r,_e(e),new gt({".priority":o},{".priority":pe}))}else return new F(r,_e(e),gt.Default)}else{let t=F.EMPTY_NODE;return Ie(n,(i,s)=>{if(dt(n,i)&&i.substring(0,1)!=="."){const r=_e(s);(r.isLeafNode()||!r.isEmpty())&&(t=t.updateImmediateChild(i,r))}}),t.updatePriority(_e(e))}}m_(_e);/**
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
 */class qo extends Ys{constructor(e){super(),this.indexPath_=e,C(!Q(e)&&Y(e)!==".priority","Can't create PathIndex with empty path or .priority key")}extractChild(e){return e.getChild(this.indexPath_)}isDefinedOn(e){return!e.getChild(this.indexPath_).isEmpty()}compare(e,t){const i=this.extractChild(e.node),s=this.extractChild(t.node),r=i.compareTo(s);return r===0?un(e.name,t.name):r}makePost(e,t){const i=_e(e),s=F.EMPTY_NODE.updateChild(this.indexPath_,i);return new Z(t,s)}maxPost(){const e=F.EMPTY_NODE.updateChild(this.indexPath_,Mi);return new Z(Lt,e)}toString(){return _i(this.indexPath_,0).join("/")}}/**
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
 */class E_ extends Ys{compare(e,t){const i=e.node.compareTo(t.node);return i===0?un(e.name,t.name):i}isDefinedOn(e){return!0}indexedValueChanged(e,t){return!e.equals(t)}minPost(){return Z.MIN}maxPost(){return Z.MAX}makePost(e,t){const i=_e(e);return new Z(t,i)}toString(){return".value"}}const Hd=new E_;/**
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
 */function Vd(n){return{type:"value",snapshotNode:n}}function kn(n,e){return{type:"child_added",snapshotNode:e,childName:n}}function yi(n,e){return{type:"child_removed",snapshotNode:e,childName:n}}function vi(n,e,t){return{type:"child_changed",snapshotNode:e,childName:n,oldSnap:t}}function C_(n,e){return{type:"child_moved",snapshotNode:e,childName:n}}/**
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
 */class Go{constructor(e){this.index_=e}updateChild(e,t,i,s,r,o){C(e.isIndexed(this.index_),"A node must be indexed if only a child is updated");const a=e.getImmediateChild(t);return a.getChild(s).equals(i.getChild(s))&&a.isEmpty()===i.isEmpty()||(o!=null&&(i.isEmpty()?e.hasChild(t)?o.trackChildChange(yi(t,a)):C(e.isLeafNode(),"A child remove without an old child only makes sense on a leaf node"):a.isEmpty()?o.trackChildChange(kn(t,i)):o.trackChildChange(vi(t,i,a))),e.isLeafNode()&&i.isEmpty())?e:e.updateImmediateChild(t,i).withIndex(this.index_)}updateFullNode(e,t,i){return i!=null&&(e.isLeafNode()||e.forEachChild(pe,(s,r)=>{t.hasChild(s)||i.trackChildChange(yi(s,r))}),t.isLeafNode()||t.forEachChild(pe,(s,r)=>{if(e.hasChild(s)){const o=e.getImmediateChild(s);o.equals(r)||i.trackChildChange(vi(s,r,o))}else i.trackChildChange(kn(s,r))})),t.withIndex(this.index_)}updatePriority(e,t){return e.isEmpty()?F.EMPTY_NODE:e.updatePriority(t)}filtersNodes(){return!1}getIndexedFilter(){return this}getIndex(){return this.index_}}/**
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
 */class wi{constructor(e){this.indexedFilter_=new Go(e.getIndex()),this.index_=e.getIndex(),this.startPost_=wi.getStartPost_(e),this.endPost_=wi.getEndPost_(e),this.startIsInclusive_=!e.startAfterSet_,this.endIsInclusive_=!e.endBeforeSet_}getStartPost(){return this.startPost_}getEndPost(){return this.endPost_}matches(e){const t=this.startIsInclusive_?this.index_.compare(this.getStartPost(),e)<=0:this.index_.compare(this.getStartPost(),e)<0,i=this.endIsInclusive_?this.index_.compare(e,this.getEndPost())<=0:this.index_.compare(e,this.getEndPost())<0;return t&&i}updateChild(e,t,i,s,r,o){return this.matches(new Z(t,i))||(i=F.EMPTY_NODE),this.indexedFilter_.updateChild(e,t,i,s,r,o)}updateFullNode(e,t,i){t.isLeafNode()&&(t=F.EMPTY_NODE);let s=t.withIndex(this.index_);s=s.updatePriority(F.EMPTY_NODE);const r=this;return t.forEachChild(pe,(o,a)=>{r.matches(new Z(o,a))||(s=s.updateImmediateChild(o,F.EMPTY_NODE))}),this.indexedFilter_.updateFullNode(e,s,i)}updatePriority(e,t){return e}filtersNodes(){return!0}getIndexedFilter(){return this.indexedFilter_}getIndex(){return this.index_}static getStartPost_(e){if(e.hasStart()){const t=e.getIndexStartName();return e.getIndex().makePost(e.getIndexStartValue(),t)}else return e.getIndex().minPost()}static getEndPost_(e){if(e.hasEnd()){const t=e.getIndexEndName();return e.getIndex().makePost(e.getIndexEndValue(),t)}else return e.getIndex().maxPost()}}/**
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
 */class I_{constructor(e){this.withinDirectionalStart=t=>this.reverse_?this.withinEndPost(t):this.withinStartPost(t),this.withinDirectionalEnd=t=>this.reverse_?this.withinStartPost(t):this.withinEndPost(t),this.withinStartPost=t=>{const i=this.index_.compare(this.rangedFilter_.getStartPost(),t);return this.startIsInclusive_?i<=0:i<0},this.withinEndPost=t=>{const i=this.index_.compare(t,this.rangedFilter_.getEndPost());return this.endIsInclusive_?i<=0:i<0},this.rangedFilter_=new wi(e),this.index_=e.getIndex(),this.limit_=e.getLimit(),this.reverse_=!e.isViewFromLeft(),this.startIsInclusive_=!e.startAfterSet_,this.endIsInclusive_=!e.endBeforeSet_}updateChild(e,t,i,s,r,o){return this.rangedFilter_.matches(new Z(t,i))||(i=F.EMPTY_NODE),e.getImmediateChild(t).equals(i)?e:e.numChildren()<this.limit_?this.rangedFilter_.getIndexedFilter().updateChild(e,t,i,s,r,o):this.fullLimitUpdateChild_(e,t,i,r,o)}updateFullNode(e,t,i){let s;if(t.isLeafNode()||t.isEmpty())s=F.EMPTY_NODE.withIndex(this.index_);else if(this.limit_*2<t.numChildren()&&t.isIndexed(this.index_)){s=F.EMPTY_NODE.withIndex(this.index_);let r;this.reverse_?r=t.getReverseIteratorFrom(this.rangedFilter_.getEndPost(),this.index_):r=t.getIteratorFrom(this.rangedFilter_.getStartPost(),this.index_);let o=0;for(;r.hasNext()&&o<this.limit_;){const a=r.getNext();if(this.withinDirectionalStart(a))if(this.withinDirectionalEnd(a))s=s.updateImmediateChild(a.name,a.node),o++;else break;else continue}}else{s=t.withIndex(this.index_),s=s.updatePriority(F.EMPTY_NODE);let r;this.reverse_?r=s.getReverseIterator(this.index_):r=s.getIterator(this.index_);let o=0;for(;r.hasNext();){const a=r.getNext();o<this.limit_&&this.withinDirectionalStart(a)&&this.withinDirectionalEnd(a)?o++:s=s.updateImmediateChild(a.name,F.EMPTY_NODE)}}return this.rangedFilter_.getIndexedFilter().updateFullNode(e,s,i)}updatePriority(e,t){return e}filtersNodes(){return!0}getIndexedFilter(){return this.rangedFilter_.getIndexedFilter()}getIndex(){return this.index_}fullLimitUpdateChild_(e,t,i,s,r){let o;if(this.reverse_){const u=this.index_.getCompare();o=(_,m)=>u(m,_)}else o=this.index_.getCompare();const a=e;C(a.numChildren()===this.limit_,"");const l=new Z(t,i),c=this.reverse_?a.getFirstChild(this.index_):a.getLastChild(this.index_),f=this.rangedFilter_.matches(l);if(a.hasChild(t)){const u=a.getImmediateChild(t);let _=s.getChildAfterChild(this.index_,c,this.reverse_);for(;_!=null&&(_.name===t||a.hasChild(_.name));)_=s.getChildAfterChild(this.index_,_,this.reverse_);const m=_==null?1:o(_,l);if(f&&!i.isEmpty()&&m>=0)return r!=null&&r.trackChildChange(vi(t,i,u)),a.updateImmediateChild(t,i);{r!=null&&r.trackChildChange(yi(t,u));const x=a.updateImmediateChild(t,F.EMPTY_NODE);return _!=null&&this.rangedFilter_.matches(_)?(r!=null&&r.trackChildChange(kn(_.name,_.node)),x.updateImmediateChild(_.name,_.node)):x}}else return i.isEmpty()?e:f&&o(c,l)>=0?(r!=null&&(r.trackChildChange(yi(c.name,c.node)),r.trackChildChange(kn(t,i))),a.updateImmediateChild(t,i).updateImmediateChild(c.name,F.EMPTY_NODE)):e}}/**
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
 */class zo{constructor(){this.limitSet_=!1,this.startSet_=!1,this.startNameSet_=!1,this.startAfterSet_=!1,this.endSet_=!1,this.endNameSet_=!1,this.endBeforeSet_=!1,this.limit_=0,this.viewFrom_="",this.indexStartValue_=null,this.indexStartName_="",this.indexEndValue_=null,this.indexEndName_="",this.index_=pe}hasStart(){return this.startSet_}isViewFromLeft(){return this.viewFrom_===""?this.startSet_:this.viewFrom_==="l"}getIndexStartValue(){return C(this.startSet_,"Only valid if start has been set"),this.indexStartValue_}getIndexStartName(){return C(this.startSet_,"Only valid if start has been set"),this.startNameSet_?this.indexStartName_:an}hasEnd(){return this.endSet_}getIndexEndValue(){return C(this.endSet_,"Only valid if end has been set"),this.indexEndValue_}getIndexEndName(){return C(this.endSet_,"Only valid if end has been set"),this.endNameSet_?this.indexEndName_:Lt}hasLimit(){return this.limitSet_}hasAnchoredLimit(){return this.limitSet_&&this.viewFrom_!==""}getLimit(){return C(this.limitSet_,"Only valid if limit has been set"),this.limit_}getIndex(){return this.index_}loadsAllData(){return!(this.startSet_||this.endSet_||this.limitSet_)}isDefault(){return this.loadsAllData()&&this.index_===pe}copy(){const e=new zo;return e.limitSet_=this.limitSet_,e.limit_=this.limit_,e.startSet_=this.startSet_,e.startAfterSet_=this.startAfterSet_,e.indexStartValue_=this.indexStartValue_,e.startNameSet_=this.startNameSet_,e.indexStartName_=this.indexStartName_,e.endSet_=this.endSet_,e.endBeforeSet_=this.endBeforeSet_,e.indexEndValue_=this.indexEndValue_,e.endNameSet_=this.endNameSet_,e.indexEndName_=this.indexEndName_,e.index_=this.index_,e.viewFrom_=this.viewFrom_,e}}function S_(n){return n.loadsAllData()?new Go(n.getIndex()):n.hasLimit()?new I_(n):new wi(n)}function T_(n,e){const t=n.copy();return t.limitSet_=!0,t.limit_=e,t.viewFrom_="r",t}function k_(n,e){const t=n.copy();return t.index_=e,t}function Ll(n){const e={};if(n.isDefault())return e;let t;if(n.index_===pe?t="$priority":n.index_===Hd?t="$value":n.index_===tn?t="$key":(C(n.index_ instanceof qo,"Unrecognized index type!"),t=n.index_.toString()),e.orderBy=ye(t),n.startSet_){const i=n.startAfterSet_?"startAfter":"startAt";e[i]=ye(n.indexStartValue_),n.startNameSet_&&(e[i]+=","+ye(n.indexStartName_))}if(n.endSet_){const i=n.endBeforeSet_?"endBefore":"endAt";e[i]=ye(n.indexEndValue_),n.endNameSet_&&(e[i]+=","+ye(n.indexEndName_))}return n.limitSet_&&(n.isViewFromLeft()?e.limitToFirst=n.limit_:e.limitToLast=n.limit_),e}function Fl(n){const e={};if(n.startSet_&&(e.sp=n.indexStartValue_,n.startNameSet_&&(e.sn=n.indexStartName_),e.sin=!n.startAfterSet_),n.endSet_&&(e.ep=n.indexEndValue_,n.endNameSet_&&(e.en=n.indexEndName_),e.ein=!n.endBeforeSet_),n.limitSet_){e.l=n.limit_;let t=n.viewFrom_;t===""&&(n.isViewFromLeft()?t="l":t="r"),e.vf=t}return n.index_!==pe&&(e.i=n.index_.toString()),e}/**
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
 */class As extends Od{constructor(e,t,i,s){super(),this.repoInfo_=e,this.onDataUpdate_=t,this.authTokenProvider_=i,this.appCheckTokenProvider_=s,this.log_=Di("p:rest:"),this.listens_={}}reportStats(e){throw new Error("Method not implemented.")}static getListenId_(e,t){return t!==void 0?"tag$"+t:(C(e._queryParams.isDefault(),"should have a tag if it's not a default query."),e._path.toString())}listen(e,t,i,s){const r=e._path.toString();this.log_("Listen called for "+r+" "+e._queryIdentifier);const o=As.getListenId_(e,i),a={};this.listens_[o]=a;const l=Ll(e._queryParams);this.restRequest_(r+".json",l,(c,f)=>{let u=f;if(c===404&&(u=null,c=null),c===null&&this.onDataUpdate_(r,u,!1,i),In(this.listens_,o)===a){let _;c?c===401?_="permission_denied":_="rest_error:"+c:_="ok",s(_,null)}})}unlisten(e,t){const i=As.getListenId_(e,t);delete this.listens_[i]}get(e){const t=Ll(e._queryParams),i=e._path.toString(),s=new rt;return this.restRequest_(i+".json",t,(r,o)=>{let a=o;r===404&&(a=null,r=null),r===null?(this.onDataUpdate_(i,a,!1,null),s.resolve(a)):s.reject(new Error(a))}),s.promise}refreshAuthToken(e){}restRequest_(e,t={},i){return t.format="export",Promise.all([this.authTokenProvider_.getToken(!1),this.appCheckTokenProvider_.getToken(!1)]).then(([s,r])=>{s&&s.accessToken&&(t.auth=s.accessToken),r&&r.token&&(t.ac=r.token);const o=(this.repoInfo_.secure?"https://":"http://")+this.repoInfo_.host+e+"?ns="+this.repoInfo_.namespace+Fn(t);this.log_("Sending REST request for "+o);const a=new XMLHttpRequest;a.onreadystatechange=()=>{if(i&&a.readyState===4){this.log_("REST Response for "+o+" received. status:",a.status,"response:",a.responseText);let l=null;if(a.status>=200&&a.status<300){try{l=hi(a.responseText)}catch{Ne("Failed to parse JSON response for "+o+": "+a.responseText)}i(null,l)}else a.status!==401&&a.status!==404&&Ne("Got unsuccessful REST response for "+o+" Status: "+a.status),i(a.status);i=null}},a.open("GET",o,!0),a.send()})}}/**
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
 */class R_{constructor(){this.rootNode_=F.EMPTY_NODE}getNode(e){return this.rootNode_.getChild(e)}updateSnapshot(e,t){this.rootNode_=this.rootNode_.updateChild(e,t)}}/**
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
 */function xs(){return{value:null,children:new Map}}function Bn(n,e,t){if(Q(e))n.value=t,n.children.clear();else if(n.value!==null)n.value=n.value.updateChild(e,t);else{const i=Y(e);n.children.has(i)||n.children.set(i,xs());const s=n.children.get(i);e=ue(e),Bn(s,e,t)}}function Yr(n,e){if(Q(e))return n.value=null,n.children.clear(),!0;if(n.value!==null){if(n.value.isLeafNode())return!1;{const t=n.value;return n.value=null,t.forEachChild(pe,(i,s)=>{Bn(n,new le(i),s)}),Yr(n,e)}}else if(n.children.size>0){const t=Y(e);return e=ue(e),n.children.has(t)&&Yr(n.children.get(t),e)&&n.children.delete(t),n.children.size===0}else return!0}function Qr(n,e,t){n.value!==null?t(e,n.value):A_(n,(i,s)=>{const r=new le(e.toString()+"/"+i);Qr(s,r,t)})}function A_(n,e){n.children.forEach((t,i)=>{e(i,t)})}/**
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
 */class x_{constructor(e){this.collection_=e,this.last_=null}get(){const e=this.collection_.get(),t=Object.assign({},e);return this.last_&&Ie(this.last_,(i,s)=>{t[i]=t[i]-s}),this.last_=e,t}}/**
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
 */const Ul=10*1e3,P_=30*1e3,N_=5*60*1e3;class O_{constructor(e,t){this.server_=t,this.statsToReport_={},this.statsListener_=new x_(e);const i=Ul+(P_-Ul)*Math.random();ai(this.reportStats_.bind(this),Math.floor(i))}reportStats_(){const e=this.statsListener_.get(),t={};let i=!1;Ie(e,(s,r)=>{r>0&&dt(this.statsToReport_,s)&&(t[s]=r,i=!0)}),i&&this.server_.reportStats(t),ai(this.reportStats_.bind(this),Math.floor(Math.random()*2*N_))}}/**
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
 */var Je;(function(n){n[n.OVERWRITE=0]="OVERWRITE",n[n.MERGE=1]="MERGE",n[n.ACK_USER_WRITE=2]="ACK_USER_WRITE",n[n.LISTEN_COMPLETE=3]="LISTEN_COMPLETE"})(Je||(Je={}));function Ko(){return{fromUser:!0,fromServer:!1,queryId:null,tagged:!1}}function Yo(){return{fromUser:!1,fromServer:!0,queryId:null,tagged:!1}}function Qo(n){return{fromUser:!1,fromServer:!0,queryId:n,tagged:!0}}/**
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
 */class Ps{constructor(e,t,i){this.path=e,this.affectedTree=t,this.revert=i,this.type=Je.ACK_USER_WRITE,this.source=Ko()}operationForChild(e){if(Q(this.path)){if(this.affectedTree.value!=null)return C(this.affectedTree.children.isEmpty(),"affectedTree should not have overlapping affected paths."),this;{const t=this.affectedTree.subtree(new le(e));return new Ps(re(),t,this.revert)}}else return C(Y(this.path)===e,"operationForChild called for unrelated child."),new Ps(ue(this.path),this.affectedTree,this.revert)}}/**
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
 */class bi{constructor(e,t){this.source=e,this.path=t,this.type=Je.LISTEN_COMPLETE}operationForChild(e){return Q(this.path)?new bi(this.source,re()):new bi(this.source,ue(this.path))}}/**
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
 */class ln{constructor(e,t,i){this.source=e,this.path=t,this.snap=i,this.type=Je.OVERWRITE}operationForChild(e){return Q(this.path)?new ln(this.source,re(),this.snap.getImmediateChild(e)):new ln(this.source,ue(this.path),this.snap)}}/**
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
 */class Rn{constructor(e,t,i){this.source=e,this.path=t,this.children=i,this.type=Je.MERGE}operationForChild(e){if(Q(this.path)){const t=this.children.subtree(new le(e));return t.isEmpty()?null:t.value?new ln(this.source,re(),t.value):new Rn(this.source,re(),t)}else return C(Y(this.path)===e,"Can't get a merge for a child not on the path of the operation"),new Rn(this.source,ue(this.path),this.children)}toString(){return"Operation("+this.path+": "+this.source.toString()+" merge: "+this.children.toString()+")"}}/**
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
 */class Ut{constructor(e,t,i){this.node_=e,this.fullyInitialized_=t,this.filtered_=i}isFullyInitialized(){return this.fullyInitialized_}isFiltered(){return this.filtered_}isCompleteForPath(e){if(Q(e))return this.isFullyInitialized()&&!this.filtered_;const t=Y(e);return this.isCompleteForChild(t)}isCompleteForChild(e){return this.isFullyInitialized()&&!this.filtered_||this.node_.hasChild(e)}getNode(){return this.node_}}/**
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
 */class D_{constructor(e){this.query_=e,this.index_=this.query_._queryParams.getIndex()}}function M_(n,e,t,i){const s=[],r=[];return e.forEach(o=>{o.type==="child_changed"&&n.index_.indexedValueChanged(o.oldSnap,o.snapshotNode)&&r.push(C_(o.childName,o.snapshotNode))}),Jn(n,s,"child_removed",e,i,t),Jn(n,s,"child_added",e,i,t),Jn(n,s,"child_moved",r,i,t),Jn(n,s,"child_changed",e,i,t),Jn(n,s,"value",e,i,t),s}function Jn(n,e,t,i,s,r){const o=i.filter(a=>a.type===t);o.sort((a,l)=>F_(n,a,l)),o.forEach(a=>{const l=L_(n,a,r);s.forEach(c=>{c.respondsTo(a.type)&&e.push(c.createEvent(l,n.query_))})})}function L_(n,e,t){return e.type==="value"||e.type==="child_removed"||(e.prevName=t.getPredecessorChildName(e.childName,e.snapshotNode,n.index_)),e}function F_(n,e,t){if(e.childName==null||t.childName==null)throw Ln("Should only compare child_ events.");const i=new Z(e.childName,e.snapshotNode),s=new Z(t.childName,t.snapshotNode);return n.index_.compare(i,s)}/**
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
 */function Qs(n,e){return{eventCache:n,serverCache:e}}function li(n,e,t,i){return Qs(new Ut(e,t,i),n.serverCache)}function jd(n,e,t,i){return Qs(n.eventCache,new Ut(e,t,i))}function Ns(n){return n.eventCache.isFullyInitialized()?n.eventCache.getNode():null}function cn(n){return n.serverCache.isFullyInitialized()?n.serverCache.getNode():null}/**
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
 */let Rr;const U_=()=>(Rr||(Rr=new Fe(Eg)),Rr);class he{constructor(e,t=U_()){this.value=e,this.children=t}static fromObject(e){let t=new he(null);return Ie(e,(i,s)=>{t=t.set(new le(i),s)}),t}isEmpty(){return this.value===null&&this.children.isEmpty()}findRootMostMatchingPathAndValue(e,t){if(this.value!=null&&t(this.value))return{path:re(),value:this.value};if(Q(e))return null;{const i=Y(e),s=this.children.get(i);if(s!==null){const r=s.findRootMostMatchingPathAndValue(ue(e),t);return r!=null?{path:ge(new le(i),r.path),value:r.value}:null}else return null}}findRootMostValueAndPath(e){return this.findRootMostMatchingPathAndValue(e,()=>!0)}subtree(e){if(Q(e))return this;{const t=Y(e),i=this.children.get(t);return i!==null?i.subtree(ue(e)):new he(null)}}set(e,t){if(Q(e))return new he(t,this.children);{const i=Y(e),r=(this.children.get(i)||new he(null)).set(ue(e),t),o=this.children.insert(i,r);return new he(this.value,o)}}remove(e){if(Q(e))return this.children.isEmpty()?new he(null):new he(null,this.children);{const t=Y(e),i=this.children.get(t);if(i){const s=i.remove(ue(e));let r;return s.isEmpty()?r=this.children.remove(t):r=this.children.insert(t,s),this.value===null&&r.isEmpty()?new he(null):new he(this.value,r)}else return this}}get(e){if(Q(e))return this.value;{const t=Y(e),i=this.children.get(t);return i?i.get(ue(e)):null}}setTree(e,t){if(Q(e))return t;{const i=Y(e),r=(this.children.get(i)||new he(null)).setTree(ue(e),t);let o;return r.isEmpty()?o=this.children.remove(i):o=this.children.insert(i,r),new he(this.value,o)}}fold(e){return this.fold_(re(),e)}fold_(e,t){const i={};return this.children.inorderTraversal((s,r)=>{i[s]=r.fold_(ge(e,s),t)}),t(e,this.value,i)}findOnPath(e,t){return this.findOnPath_(e,re(),t)}findOnPath_(e,t,i){const s=this.value?i(t,this.value):!1;if(s)return s;if(Q(e))return null;{const r=Y(e),o=this.children.get(r);return o?o.findOnPath_(ue(e),ge(t,r),i):null}}foreachOnPath(e,t){return this.foreachOnPath_(e,re(),t)}foreachOnPath_(e,t,i){if(Q(e))return this;{this.value&&i(t,this.value);const s=Y(e),r=this.children.get(s);return r?r.foreachOnPath_(ue(e),ge(t,s),i):new he(null)}}foreach(e){this.foreach_(re(),e)}foreach_(e,t){this.children.inorderTraversal((i,s)=>{s.foreach_(ge(e,i),t)}),this.value&&t(e,this.value)}foreachChild(e){this.children.inorderTraversal((t,i)=>{i.value&&e(t,i.value)})}}/**
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
 */class Xe{constructor(e){this.writeTree_=e}static empty(){return new Xe(new he(null))}}function ci(n,e,t){if(Q(e))return new Xe(new he(t));{const i=n.writeTree_.findRootMostValueAndPath(e);if(i!=null){const s=i.path;let r=i.value;const o=Pe(s,e);return r=r.updateChild(o,t),new Xe(n.writeTree_.set(s,r))}else{const s=new he(t),r=n.writeTree_.setTree(e,s);return new Xe(r)}}}function Jr(n,e,t){let i=n;return Ie(t,(s,r)=>{i=ci(i,ge(e,s),r)}),i}function $l(n,e){if(Q(e))return Xe.empty();{const t=n.writeTree_.setTree(e,new he(null));return new Xe(t)}}function Xr(n,e){return hn(n,e)!=null}function hn(n,e){const t=n.writeTree_.findRootMostValueAndPath(e);return t!=null?n.writeTree_.get(t.path).getChild(Pe(t.path,e)):null}function Wl(n){const e=[],t=n.writeTree_.value;return t!=null?t.isLeafNode()||t.forEachChild(pe,(i,s)=>{e.push(new Z(i,s))}):n.writeTree_.children.inorderTraversal((i,s)=>{s.value!=null&&e.push(new Z(i,s.value))}),e}function Dt(n,e){if(Q(e))return n;{const t=hn(n,e);return t!=null?new Xe(new he(t)):new Xe(n.writeTree_.subtree(e))}}function Zr(n){return n.writeTree_.isEmpty()}function An(n,e){return qd(re(),n.writeTree_,e)}function qd(n,e,t){if(e.value!=null)return t.updateChild(n,e.value);{let i=null;return e.children.inorderTraversal((s,r)=>{s===".priority"?(C(r.value!==null,"Priority writes must always be leaf nodes"),i=r.value):t=qd(ge(n,s),r,t)}),!t.getChild(n).isEmpty()&&i!==null&&(t=t.updateChild(ge(n,".priority"),i)),t}}/**
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
 */function Js(n,e){return Yd(e,n)}function $_(n,e,t,i,s){C(i>n.lastWriteId,"Stacking an older write on top of newer ones"),s===void 0&&(s=!0),n.allWrites.push({path:e,snap:t,writeId:i,visible:s}),s&&(n.visibleWrites=ci(n.visibleWrites,e,t)),n.lastWriteId=i}function W_(n,e,t,i){C(i>n.lastWriteId,"Stacking an older merge on top of newer ones"),n.allWrites.push({path:e,children:t,writeId:i,visible:!0}),n.visibleWrites=Jr(n.visibleWrites,e,t),n.lastWriteId=i}function B_(n,e){for(let t=0;t<n.allWrites.length;t++){const i=n.allWrites[t];if(i.writeId===e)return i}return null}function H_(n,e){const t=n.allWrites.findIndex(a=>a.writeId===e);C(t>=0,"removeWrite called with nonexistent writeId.");const i=n.allWrites[t];n.allWrites.splice(t,1);let s=i.visible,r=!1,o=n.allWrites.length-1;for(;s&&o>=0;){const a=n.allWrites[o];a.visible&&(o>=t&&V_(a,i.path)?s=!1:Ve(i.path,a.path)&&(r=!0)),o--}if(s){if(r)return j_(n),!0;if(i.snap)n.visibleWrites=$l(n.visibleWrites,i.path);else{const a=i.children;Ie(a,l=>{n.visibleWrites=$l(n.visibleWrites,ge(i.path,l))})}return!0}else return!1}function V_(n,e){if(n.snap)return Ve(n.path,e);for(const t in n.children)if(n.children.hasOwnProperty(t)&&Ve(ge(n.path,t),e))return!0;return!1}function j_(n){n.visibleWrites=Gd(n.allWrites,q_,re()),n.allWrites.length>0?n.lastWriteId=n.allWrites[n.allWrites.length-1].writeId:n.lastWriteId=-1}function q_(n){return n.visible}function Gd(n,e,t){let i=Xe.empty();for(let s=0;s<n.length;++s){const r=n[s];if(e(r)){const o=r.path;let a;if(r.snap)Ve(t,o)?(a=Pe(t,o),i=ci(i,a,r.snap)):Ve(o,t)&&(a=Pe(o,t),i=ci(i,re(),r.snap.getChild(a)));else if(r.children){if(Ve(t,o))a=Pe(t,o),i=Jr(i,a,r.children);else if(Ve(o,t))if(a=Pe(o,t),Q(a))i=Jr(i,re(),r.children);else{const l=In(r.children,Y(a));if(l){const c=l.getChild(ue(a));i=ci(i,re(),c)}}}else throw Ln("WriteRecord should have .snap or .children")}}return i}function zd(n,e,t,i,s){if(!i&&!s){const r=hn(n.visibleWrites,e);if(r!=null)return r;{const o=Dt(n.visibleWrites,e);if(Zr(o))return t;if(t==null&&!Xr(o,re()))return null;{const a=t||F.EMPTY_NODE;return An(o,a)}}}else{const r=Dt(n.visibleWrites,e);if(!s&&Zr(r))return t;if(!s&&t==null&&!Xr(r,re()))return null;{const o=function(c){return(c.visible||s)&&(!i||!~i.indexOf(c.writeId))&&(Ve(c.path,e)||Ve(e,c.path))},a=Gd(n.allWrites,o,e),l=t||F.EMPTY_NODE;return An(a,l)}}}function G_(n,e,t){let i=F.EMPTY_NODE;const s=hn(n.visibleWrites,e);if(s)return s.isLeafNode()||s.forEachChild(pe,(r,o)=>{i=i.updateImmediateChild(r,o)}),i;if(t){const r=Dt(n.visibleWrites,e);return t.forEachChild(pe,(o,a)=>{const l=An(Dt(r,new le(o)),a);i=i.updateImmediateChild(o,l)}),Wl(r).forEach(o=>{i=i.updateImmediateChild(o.name,o.node)}),i}else{const r=Dt(n.visibleWrites,e);return Wl(r).forEach(o=>{i=i.updateImmediateChild(o.name,o.node)}),i}}function z_(n,e,t,i,s){C(i||s,"Either existingEventSnap or existingServerSnap must exist");const r=ge(e,t);if(Xr(n.visibleWrites,r))return null;{const o=Dt(n.visibleWrites,r);return Zr(o)?s.getChild(t):An(o,s.getChild(t))}}function K_(n,e,t,i){const s=ge(e,t),r=hn(n.visibleWrites,s);if(r!=null)return r;if(i.isCompleteForChild(t)){const o=Dt(n.visibleWrites,s);return An(o,i.getNode().getImmediateChild(t))}else return null}function Y_(n,e){return hn(n.visibleWrites,e)}function Q_(n,e,t,i,s,r,o){let a;const l=Dt(n.visibleWrites,e),c=hn(l,re());if(c!=null)a=c;else if(t!=null)a=An(l,t);else return[];if(a=a.withIndex(o),!a.isEmpty()&&!a.isLeafNode()){const f=[],u=o.getCompare(),_=r?a.getReverseIteratorFrom(i,o):a.getIteratorFrom(i,o);let m=_.getNext();for(;m&&f.length<s;)u(m,i)!==0&&f.push(m),m=_.getNext();return f}else return[]}function J_(){return{visibleWrites:Xe.empty(),allWrites:[],lastWriteId:-1}}function Os(n,e,t,i){return zd(n.writeTree,n.treePath,e,t,i)}function Jo(n,e){return G_(n.writeTree,n.treePath,e)}function Bl(n,e,t,i){return z_(n.writeTree,n.treePath,e,t,i)}function Ds(n,e){return Y_(n.writeTree,ge(n.treePath,e))}function X_(n,e,t,i,s,r){return Q_(n.writeTree,n.treePath,e,t,i,s,r)}function Xo(n,e,t){return K_(n.writeTree,n.treePath,e,t)}function Kd(n,e){return Yd(ge(n.treePath,e),n.writeTree)}function Yd(n,e){return{treePath:n,writeTree:e}}/**
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
 */class Z_{constructor(){this.changeMap=new Map}trackChildChange(e){const t=e.type,i=e.childName;C(t==="child_added"||t==="child_changed"||t==="child_removed","Only child changes supported for tracking"),C(i!==".priority","Only non-priority child changes can be tracked.");const s=this.changeMap.get(i);if(s){const r=s.type;if(t==="child_added"&&r==="child_removed")this.changeMap.set(i,vi(i,e.snapshotNode,s.snapshotNode));else if(t==="child_removed"&&r==="child_added")this.changeMap.delete(i);else if(t==="child_removed"&&r==="child_changed")this.changeMap.set(i,yi(i,s.oldSnap));else if(t==="child_changed"&&r==="child_added")this.changeMap.set(i,kn(i,e.snapshotNode));else if(t==="child_changed"&&r==="child_changed")this.changeMap.set(i,vi(i,e.snapshotNode,s.oldSnap));else throw Ln("Illegal combination of changes: "+e+" occurred after "+s)}else this.changeMap.set(i,e)}getChanges(){return Array.from(this.changeMap.values())}}/**
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
 */class ey{getCompleteChild(e){return null}getChildAfterChild(e,t,i){return null}}const Qd=new ey;class Zo{constructor(e,t,i=null){this.writes_=e,this.viewCache_=t,this.optCompleteServerCache_=i}getCompleteChild(e){const t=this.viewCache_.eventCache;if(t.isCompleteForChild(e))return t.getNode().getImmediateChild(e);{const i=this.optCompleteServerCache_!=null?new Ut(this.optCompleteServerCache_,!0,!1):this.viewCache_.serverCache;return Xo(this.writes_,e,i)}}getChildAfterChild(e,t,i){const s=this.optCompleteServerCache_!=null?this.optCompleteServerCache_:cn(this.viewCache_),r=X_(this.writes_,s,t,1,i,e);return r.length===0?null:r[0]}}/**
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
 */function ty(n){return{filter:n}}function ny(n,e){C(e.eventCache.getNode().isIndexed(n.filter.getIndex()),"Event snap not indexed"),C(e.serverCache.getNode().isIndexed(n.filter.getIndex()),"Server snap not indexed")}function iy(n,e,t,i,s){const r=new Z_;let o,a;if(t.type===Je.OVERWRITE){const c=t;c.source.fromUser?o=eo(n,e,c.path,c.snap,i,s,r):(C(c.source.fromServer,"Unknown source."),a=c.source.tagged||e.serverCache.isFiltered()&&!Q(c.path),o=Ms(n,e,c.path,c.snap,i,s,a,r))}else if(t.type===Je.MERGE){const c=t;c.source.fromUser?o=ry(n,e,c.path,c.children,i,s,r):(C(c.source.fromServer,"Unknown source."),a=c.source.tagged||e.serverCache.isFiltered(),o=to(n,e,c.path,c.children,i,s,a,r))}else if(t.type===Je.ACK_USER_WRITE){const c=t;c.revert?o=ly(n,e,c.path,i,s,r):o=oy(n,e,c.path,c.affectedTree,i,s,r)}else if(t.type===Je.LISTEN_COMPLETE)o=ay(n,e,t.path,i,r);else throw Ln("Unknown operation type: "+t.type);const l=r.getChanges();return sy(e,o,l),{viewCache:o,changes:l}}function sy(n,e,t){const i=e.eventCache;if(i.isFullyInitialized()){const s=i.getNode().isLeafNode()||i.getNode().isEmpty(),r=Ns(n);(t.length>0||!n.eventCache.isFullyInitialized()||s&&!i.getNode().equals(r)||!i.getNode().getPriority().equals(r.getPriority()))&&t.push(Vd(Ns(e)))}}function Jd(n,e,t,i,s,r){const o=e.eventCache;if(Ds(i,t)!=null)return e;{let a,l;if(Q(t))if(C(e.serverCache.isFullyInitialized(),"If change path is empty, we must have complete server data"),e.serverCache.isFiltered()){const c=cn(e),f=c instanceof F?c:F.EMPTY_NODE,u=Jo(i,f);a=n.filter.updateFullNode(e.eventCache.getNode(),u,r)}else{const c=Os(i,cn(e));a=n.filter.updateFullNode(e.eventCache.getNode(),c,r)}else{const c=Y(t);if(c===".priority"){C(Ft(t)===1,"Can't have a priority with additional path components");const f=o.getNode();l=e.serverCache.getNode();const u=Bl(i,t,f,l);u!=null?a=n.filter.updatePriority(f,u):a=o.getNode()}else{const f=ue(t);let u;if(o.isCompleteForChild(c)){l=e.serverCache.getNode();const _=Bl(i,t,o.getNode(),l);_!=null?u=o.getNode().getImmediateChild(c).updateChild(f,_):u=o.getNode().getImmediateChild(c)}else u=Xo(i,c,e.serverCache);u!=null?a=n.filter.updateChild(o.getNode(),c,u,f,s,r):a=o.getNode()}}return li(e,a,o.isFullyInitialized()||Q(t),n.filter.filtersNodes())}}function Ms(n,e,t,i,s,r,o,a){const l=e.serverCache;let c;const f=o?n.filter:n.filter.getIndexedFilter();if(Q(t))c=f.updateFullNode(l.getNode(),i,null);else if(f.filtersNodes()&&!l.isFiltered()){const m=l.getNode().updateChild(t,i);c=f.updateFullNode(l.getNode(),m,null)}else{const m=Y(t);if(!l.isCompleteForPath(t)&&Ft(t)>1)return e;const w=ue(t),R=l.getNode().getImmediateChild(m).updateChild(w,i);m===".priority"?c=f.updatePriority(l.getNode(),R):c=f.updateChild(l.getNode(),m,R,w,Qd,null)}const u=jd(e,c,l.isFullyInitialized()||Q(t),f.filtersNodes()),_=new Zo(s,u,r);return Jd(n,u,t,s,_,a)}function eo(n,e,t,i,s,r,o){const a=e.eventCache;let l,c;const f=new Zo(s,e,r);if(Q(t))c=n.filter.updateFullNode(e.eventCache.getNode(),i,o),l=li(e,c,!0,n.filter.filtersNodes());else{const u=Y(t);if(u===".priority")c=n.filter.updatePriority(e.eventCache.getNode(),i),l=li(e,c,a.isFullyInitialized(),a.isFiltered());else{const _=ue(t),m=a.getNode().getImmediateChild(u);let w;if(Q(_))w=i;else{const x=f.getCompleteChild(u);x!=null?Bo(_)===".priority"&&x.getChild(Md(_)).isEmpty()?w=x:w=x.updateChild(_,i):w=F.EMPTY_NODE}if(m.equals(w))l=e;else{const x=n.filter.updateChild(a.getNode(),u,w,_,f,o);l=li(e,x,a.isFullyInitialized(),n.filter.filtersNodes())}}}return l}function Hl(n,e){return n.eventCache.isCompleteForChild(e)}function ry(n,e,t,i,s,r,o){let a=e;return i.foreach((l,c)=>{const f=ge(t,l);Hl(e,Y(f))&&(a=eo(n,a,f,c,s,r,o))}),i.foreach((l,c)=>{const f=ge(t,l);Hl(e,Y(f))||(a=eo(n,a,f,c,s,r,o))}),a}function Vl(n,e,t){return t.foreach((i,s)=>{e=e.updateChild(i,s)}),e}function to(n,e,t,i,s,r,o,a){if(e.serverCache.getNode().isEmpty()&&!e.serverCache.isFullyInitialized())return e;let l=e,c;Q(t)?c=i:c=new he(null).setTree(t,i);const f=e.serverCache.getNode();return c.children.inorderTraversal((u,_)=>{if(f.hasChild(u)){const m=e.serverCache.getNode().getImmediateChild(u),w=Vl(n,m,_);l=Ms(n,l,new le(u),w,s,r,o,a)}}),c.children.inorderTraversal((u,_)=>{const m=!e.serverCache.isCompleteForChild(u)&&_.value===null;if(!f.hasChild(u)&&!m){const w=e.serverCache.getNode().getImmediateChild(u),x=Vl(n,w,_);l=Ms(n,l,new le(u),x,s,r,o,a)}}),l}function oy(n,e,t,i,s,r,o){if(Ds(s,t)!=null)return e;const a=e.serverCache.isFiltered(),l=e.serverCache;if(i.value!=null){if(Q(t)&&l.isFullyInitialized()||l.isCompleteForPath(t))return Ms(n,e,t,l.getNode().getChild(t),s,r,a,o);if(Q(t)){let c=new he(null);return l.getNode().forEachChild(tn,(f,u)=>{c=c.set(new le(f),u)}),to(n,e,t,c,s,r,a,o)}else return e}else{let c=new he(null);return i.foreach((f,u)=>{const _=ge(t,f);l.isCompleteForPath(_)&&(c=c.set(f,l.getNode().getChild(_)))}),to(n,e,t,c,s,r,a,o)}}function ay(n,e,t,i,s){const r=e.serverCache,o=jd(e,r.getNode(),r.isFullyInitialized()||Q(t),r.isFiltered());return Jd(n,o,t,i,Qd,s)}function ly(n,e,t,i,s,r){let o;if(Ds(i,t)!=null)return e;{const a=new Zo(i,e,s),l=e.eventCache.getNode();let c;if(Q(t)||Y(t)===".priority"){let f;if(e.serverCache.isFullyInitialized())f=Os(i,cn(e));else{const u=e.serverCache.getNode();C(u instanceof F,"serverChildren would be complete if leaf node"),f=Jo(i,u)}f=f,c=n.filter.updateFullNode(l,f,r)}else{const f=Y(t);let u=Xo(i,f,e.serverCache);u==null&&e.serverCache.isCompleteForChild(f)&&(u=l.getImmediateChild(f)),u!=null?c=n.filter.updateChild(l,f,u,ue(t),a,r):e.eventCache.getNode().hasChild(f)?c=n.filter.updateChild(l,f,F.EMPTY_NODE,ue(t),a,r):c=l,c.isEmpty()&&e.serverCache.isFullyInitialized()&&(o=Os(i,cn(e)),o.isLeafNode()&&(c=n.filter.updateFullNode(c,o,r)))}return o=e.serverCache.isFullyInitialized()||Ds(i,re())!=null,li(e,c,o,n.filter.filtersNodes())}}/**
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
 */class cy{constructor(e,t){this.query_=e,this.eventRegistrations_=[];const i=this.query_._queryParams,s=new Go(i.getIndex()),r=S_(i);this.processor_=ty(r);const o=t.serverCache,a=t.eventCache,l=s.updateFullNode(F.EMPTY_NODE,o.getNode(),null),c=r.updateFullNode(F.EMPTY_NODE,a.getNode(),null),f=new Ut(l,o.isFullyInitialized(),s.filtersNodes()),u=new Ut(c,a.isFullyInitialized(),r.filtersNodes());this.viewCache_=Qs(u,f),this.eventGenerator_=new D_(this.query_)}get query(){return this.query_}}function dy(n){return n.viewCache_.serverCache.getNode()}function uy(n){return Ns(n.viewCache_)}function hy(n,e){const t=cn(n.viewCache_);return t&&(n.query._queryParams.loadsAllData()||!Q(e)&&!t.getImmediateChild(Y(e)).isEmpty())?t.getChild(e):null}function jl(n){return n.eventRegistrations_.length===0}function fy(n,e){n.eventRegistrations_.push(e)}function ql(n,e,t){const i=[];if(t){C(e==null,"A cancel should cancel all event registrations.");const s=n.query._path;n.eventRegistrations_.forEach(r=>{const o=r.createCancelEvent(t,s);o&&i.push(o)})}if(e){let s=[];for(let r=0;r<n.eventRegistrations_.length;++r){const o=n.eventRegistrations_[r];if(!o.matches(e))s.push(o);else if(e.hasAnyCallback()){s=s.concat(n.eventRegistrations_.slice(r+1));break}}n.eventRegistrations_=s}else n.eventRegistrations_=[];return i}function Gl(n,e,t,i){e.type===Je.MERGE&&e.source.queryId!==null&&(C(cn(n.viewCache_),"We should always have a full cache before handling merges"),C(Ns(n.viewCache_),"Missing event cache, even though we have a server cache"));const s=n.viewCache_,r=iy(n.processor_,s,e,t,i);return ny(n.processor_,r.viewCache),C(r.viewCache.serverCache.isFullyInitialized()||!s.serverCache.isFullyInitialized(),"Once a server snap is complete, it should never go back"),n.viewCache_=r.viewCache,Xd(n,r.changes,r.viewCache.eventCache.getNode(),null)}function py(n,e){const t=n.viewCache_.eventCache,i=[];return t.getNode().isLeafNode()||t.getNode().forEachChild(pe,(r,o)=>{i.push(kn(r,o))}),t.isFullyInitialized()&&i.push(Vd(t.getNode())),Xd(n,i,t.getNode(),e)}function Xd(n,e,t,i){const s=i?[i]:n.eventRegistrations_;return M_(n.eventGenerator_,e,t,s)}/**
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
 */let Ls;class Zd{constructor(){this.views=new Map}}function my(n){C(!Ls,"__referenceConstructor has already been defined"),Ls=n}function gy(){return C(Ls,"Reference.ts has not been loaded"),Ls}function _y(n){return n.views.size===0}function ea(n,e,t,i){const s=e.source.queryId;if(s!==null){const r=n.views.get(s);return C(r!=null,"SyncTree gave us an op for an invalid query."),Gl(r,e,t,i)}else{let r=[];for(const o of n.views.values())r=r.concat(Gl(o,e,t,i));return r}}function eu(n,e,t,i,s){const r=e._queryIdentifier,o=n.views.get(r);if(!o){let a=Os(t,s?i:null),l=!1;a?l=!0:i instanceof F?(a=Jo(t,i),l=!1):(a=F.EMPTY_NODE,l=!1);const c=Qs(new Ut(a,l,!1),new Ut(i,s,!1));return new cy(e,c)}return o}function yy(n,e,t,i,s,r){const o=eu(n,e,i,s,r);return n.views.has(e._queryIdentifier)||n.views.set(e._queryIdentifier,o),fy(o,t),py(o,t)}function vy(n,e,t,i){const s=e._queryIdentifier,r=[];let o=[];const a=$t(n);if(s==="default")for(const[l,c]of n.views.entries())o=o.concat(ql(c,t,i)),jl(c)&&(n.views.delete(l),c.query._queryParams.loadsAllData()||r.push(c.query));else{const l=n.views.get(s);l&&(o=o.concat(ql(l,t,i)),jl(l)&&(n.views.delete(s),l.query._queryParams.loadsAllData()||r.push(l.query)))}return a&&!$t(n)&&r.push(new(gy())(e._repo,e._path)),{removed:r,events:o}}function tu(n){const e=[];for(const t of n.views.values())t.query._queryParams.loadsAllData()||e.push(t);return e}function Mt(n,e){let t=null;for(const i of n.views.values())t=t||hy(i,e);return t}function nu(n,e){if(e._queryParams.loadsAllData())return Xs(n);{const i=e._queryIdentifier;return n.views.get(i)}}function iu(n,e){return nu(n,e)!=null}function $t(n){return Xs(n)!=null}function Xs(n){for(const e of n.views.values())if(e.query._queryParams.loadsAllData())return e;return null}/**
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
 */let Fs;function wy(n){C(!Fs,"__referenceConstructor has already been defined"),Fs=n}function by(){return C(Fs,"Reference.ts has not been loaded"),Fs}let Ey=1;class zl{constructor(e){this.listenProvider_=e,this.syncPointTree_=new he(null),this.pendingWriteTree_=J_(),this.tagToQueryMap=new Map,this.queryToTagMap=new Map}}function su(n,e,t,i,s){return $_(n.pendingWriteTree_,e,t,i,s),s?Hn(n,new ln(Ko(),e,t)):[]}function Cy(n,e,t,i){W_(n.pendingWriteTree_,e,t,i);const s=he.fromObject(t);return Hn(n,new Rn(Ko(),e,s))}function At(n,e,t=!1){const i=B_(n.pendingWriteTree_,e);if(H_(n.pendingWriteTree_,e)){let r=new he(null);return i.snap!=null?r=r.set(re(),!0):Ie(i.children,o=>{r=r.set(new le(o),!0)}),Hn(n,new Ps(i.path,r,t))}else return[]}function Li(n,e,t){return Hn(n,new ln(Yo(),e,t))}function Iy(n,e,t){const i=he.fromObject(t);return Hn(n,new Rn(Yo(),e,i))}function Sy(n,e){return Hn(n,new bi(Yo(),e))}function Ty(n,e,t){const i=na(n,t);if(i){const s=ia(i),r=s.path,o=s.queryId,a=Pe(r,e),l=new bi(Qo(o),a);return sa(n,r,l)}else return[]}function Us(n,e,t,i,s=!1){const r=e._path,o=n.syncPointTree_.get(r);let a=[];if(o&&(e._queryIdentifier==="default"||iu(o,e))){const l=vy(o,e,t,i);_y(o)&&(n.syncPointTree_=n.syncPointTree_.remove(r));const c=l.removed;if(a=l.events,!s){const f=c.findIndex(_=>_._queryParams.loadsAllData())!==-1,u=n.syncPointTree_.findOnPath(r,(_,m)=>$t(m));if(f&&!u){const _=n.syncPointTree_.subtree(r);if(!_.isEmpty()){const m=Ay(_);for(let w=0;w<m.length;++w){const x=m[w],R=x.query,H=lu(n,x);n.listenProvider_.startListening(di(R),Ei(n,R),H.hashFn,H.onComplete)}}}!u&&c.length>0&&!i&&(f?n.listenProvider_.stopListening(di(e),null):c.forEach(_=>{const m=n.queryToTagMap.get(Zs(_));n.listenProvider_.stopListening(di(_),m)}))}xy(n,c)}return a}function ru(n,e,t,i){const s=na(n,i);if(s!=null){const r=ia(s),o=r.path,a=r.queryId,l=Pe(o,e),c=new ln(Qo(a),l,t);return sa(n,o,c)}else return[]}function ky(n,e,t,i){const s=na(n,i);if(s){const r=ia(s),o=r.path,a=r.queryId,l=Pe(o,e),c=he.fromObject(t),f=new Rn(Qo(a),l,c);return sa(n,o,f)}else return[]}function no(n,e,t,i=!1){const s=e._path;let r=null,o=!1;n.syncPointTree_.foreachOnPath(s,(_,m)=>{const w=Pe(_,s);r=r||Mt(m,w),o=o||$t(m)});let a=n.syncPointTree_.get(s);a?(o=o||$t(a),r=r||Mt(a,re())):(a=new Zd,n.syncPointTree_=n.syncPointTree_.set(s,a));let l;r!=null?l=!0:(l=!1,r=F.EMPTY_NODE,n.syncPointTree_.subtree(s).foreachChild((m,w)=>{const x=Mt(w,re());x&&(r=r.updateImmediateChild(m,x))}));const c=iu(a,e);if(!c&&!e._queryParams.loadsAllData()){const _=Zs(e);C(!n.queryToTagMap.has(_),"View does not exist, but we have a tag");const m=Py();n.queryToTagMap.set(_,m),n.tagToQueryMap.set(m,_)}const f=Js(n.pendingWriteTree_,s);let u=yy(a,e,t,f,r,l);if(!c&&!o&&!i){const _=nu(a,e);u=u.concat(Ny(n,e,_))}return u}function ta(n,e,t){const s=n.pendingWriteTree_,r=n.syncPointTree_.findOnPath(e,(o,a)=>{const l=Pe(o,e),c=Mt(a,l);if(c)return c});return zd(s,e,r,t,!0)}function Ry(n,e){const t=e._path;let i=null;n.syncPointTree_.foreachOnPath(t,(c,f)=>{const u=Pe(c,t);i=i||Mt(f,u)});let s=n.syncPointTree_.get(t);s?i=i||Mt(s,re()):(s=new Zd,n.syncPointTree_=n.syncPointTree_.set(t,s));const r=i!=null,o=r?new Ut(i,!0,!1):null,a=Js(n.pendingWriteTree_,e._path),l=eu(s,e,a,r?o.getNode():F.EMPTY_NODE,r);return uy(l)}function Hn(n,e){return ou(e,n.syncPointTree_,null,Js(n.pendingWriteTree_,re()))}function ou(n,e,t,i){if(Q(n.path))return au(n,e,t,i);{const s=e.get(re());t==null&&s!=null&&(t=Mt(s,re()));let r=[];const o=Y(n.path),a=n.operationForChild(o),l=e.children.get(o);if(l&&a){const c=t?t.getImmediateChild(o):null,f=Kd(i,o);r=r.concat(ou(a,l,c,f))}return s&&(r=r.concat(ea(s,n,i,t))),r}}function au(n,e,t,i){const s=e.get(re());t==null&&s!=null&&(t=Mt(s,re()));let r=[];return e.children.inorderTraversal((o,a)=>{const l=t?t.getImmediateChild(o):null,c=Kd(i,o),f=n.operationForChild(o);f&&(r=r.concat(au(f,a,l,c)))}),s&&(r=r.concat(ea(s,n,i,t))),r}function lu(n,e){const t=e.query,i=Ei(n,t);return{hashFn:()=>(dy(e)||F.EMPTY_NODE).hash(),onComplete:s=>{if(s==="ok")return i?Ty(n,t._path,i):Sy(n,t._path);{const r=Sg(s,t);return Us(n,t,null,r)}}}}function Ei(n,e){const t=Zs(e);return n.queryToTagMap.get(t)}function Zs(n){return n._path.toString()+"$"+n._queryIdentifier}function na(n,e){return n.tagToQueryMap.get(e)}function ia(n){const e=n.indexOf("$");return C(e!==-1&&e<n.length-1,"Bad queryKey."),{queryId:n.substr(e+1),path:new le(n.substr(0,e))}}function sa(n,e,t){const i=n.syncPointTree_.get(e);C(i,"Missing sync point for query tag that we're tracking");const s=Js(n.pendingWriteTree_,e);return ea(i,t,s,null)}function Ay(n){return n.fold((e,t,i)=>{if(t&&$t(t))return[Xs(t)];{let s=[];return t&&(s=tu(t)),Ie(i,(r,o)=>{s=s.concat(o)}),s}})}function di(n){return n._queryParams.loadsAllData()&&!n._queryParams.isDefault()?new(by())(n._repo,n._path):n}function xy(n,e){for(let t=0;t<e.length;++t){const i=e[t];if(!i._queryParams.loadsAllData()){const s=Zs(i),r=n.queryToTagMap.get(s);n.queryToTagMap.delete(s),n.tagToQueryMap.delete(r)}}}function Py(){return Ey++}function Ny(n,e,t){const i=e._path,s=Ei(n,e),r=lu(n,t),o=n.listenProvider_.startListening(di(e),s,r.hashFn,r.onComplete),a=n.syncPointTree_.subtree(i);if(s)C(!$t(a.value),"If we're adding a query, it shouldn't be shadowed");else{const l=a.fold((c,f,u)=>{if(!Q(c)&&f&&$t(f))return[Xs(f).query];{let _=[];return f&&(_=_.concat(tu(f).map(m=>m.query))),Ie(u,(m,w)=>{_=_.concat(w)}),_}});for(let c=0;c<l.length;++c){const f=l[c];n.listenProvider_.stopListening(di(f),Ei(n,f))}}return o}/**
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
 */class ra{constructor(e){this.node_=e}getImmediateChild(e){const t=this.node_.getImmediateChild(e);return new ra(t)}node(){return this.node_}}class oa{constructor(e,t){this.syncTree_=e,this.path_=t}getImmediateChild(e){const t=ge(this.path_,e);return new oa(this.syncTree_,t)}node(){return ta(this.syncTree_,this.path_)}}const Oy=function(n){return n=n||{},n.timestamp=n.timestamp||new Date().getTime(),n},Kl=function(n,e,t){if(!n||typeof n!="object")return n;if(C(".sv"in n,"Unexpected leaf node or priority contents"),typeof n[".sv"]=="string")return Dy(n[".sv"],e,t);if(typeof n[".sv"]=="object")return My(n[".sv"],e);C(!1,"Unexpected server value: "+JSON.stringify(n,null,2))},Dy=function(n,e,t){switch(n){case"timestamp":return t.timestamp;default:C(!1,"Unexpected server value: "+n)}},My=function(n,e,t){n.hasOwnProperty("increment")||C(!1,"Unexpected server value: "+JSON.stringify(n,null,2));const i=n.increment;typeof i!="number"&&C(!1,"Unexpected increment value: "+i);const s=e.node();if(C(s!==null&&typeof s<"u","Expected ChildrenNode.EMPTY_NODE for nulls"),!s.isLeafNode())return i;const o=s.getValue();return typeof o!="number"?i:o+i},cu=function(n,e,t,i){return aa(e,new oa(t,n),i)},du=function(n,e,t){return aa(n,new ra(e),t)};function aa(n,e,t){const i=n.getPriority().val(),s=Kl(i,e.getImmediateChild(".priority"),t);let r;if(n.isLeafNode()){const o=n,a=Kl(o.getValue(),e,t);return a!==o.getValue()||s!==o.getPriority().val()?new be(a,_e(s)):n}else{const o=n;return r=o,s!==o.getPriority().val()&&(r=r.updatePriority(new be(s))),o.forEachChild(pe,(a,l)=>{const c=aa(l,e.getImmediateChild(a),t);c!==l&&(r=r.updateImmediateChild(a,c))}),r}}/**
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
 */class la{constructor(e="",t=null,i={children:{},childCount:0}){this.name=e,this.parent=t,this.node=i}}function ca(n,e){let t=e instanceof le?e:new le(e),i=n,s=Y(t);for(;s!==null;){const r=In(i.node.children,s)||{children:{},childCount:0};i=new la(s,i,r),t=ue(t),s=Y(t)}return i}function Vn(n){return n.node.value}function uu(n,e){n.node.value=e,io(n)}function hu(n){return n.node.childCount>0}function Ly(n){return Vn(n)===void 0&&!hu(n)}function er(n,e){Ie(n.node.children,(t,i)=>{e(new la(t,n,i))})}function fu(n,e,t,i){t&&e(n),er(n,s=>{fu(s,e,!0)})}function Fy(n,e,t){let i=n.parent;for(;i!==null;){if(e(i))return!0;i=i.parent}return!1}function Fi(n){return new le(n.parent===null?n.name:Fi(n.parent)+"/"+n.name)}function io(n){n.parent!==null&&Uy(n.parent,n.name,n)}function Uy(n,e,t){const i=Ly(t),s=dt(n.node.children,e);i&&s?(delete n.node.children[e],n.node.childCount--,io(n)):!i&&!s&&(n.node.children[e]=t.node,n.node.childCount++,io(n))}/**
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
 */const $y=/[\[\].#$\/\u0000-\u001F\u007F]/,Wy=/[\[\].#$\u0000-\u001F\u007F]/,Ar=10*1024*1024,da=function(n){return typeof n=="string"&&n.length!==0&&!$y.test(n)},pu=function(n){return typeof n=="string"&&n.length!==0&&!Wy.test(n)},By=function(n){return n&&(n=n.replace(/^\/*\.info(\/|$)/,"/")),pu(n)},$s=function(n){return n===null||typeof n=="string"||typeof n=="number"&&!Ks(n)||n&&typeof n=="object"&&dt(n,".sv")},Ws=function(n,e,t,i){i&&e===void 0||tr(Sn(n,"value"),e,t)},tr=function(n,e,t){const i=t instanceof le?new r_(t,n):t;if(e===void 0)throw new Error(n+"contains undefined "+Xt(i));if(typeof e=="function")throw new Error(n+"contains a function "+Xt(i)+" with contents = "+e.toString());if(Ks(e))throw new Error(n+"contains "+e.toString()+" "+Xt(i));if(typeof e=="string"&&e.length>Ar/3&&js(e)>Ar)throw new Error(n+"contains a string greater than "+Ar+" utf8 bytes "+Xt(i)+" ('"+e.substring(0,50)+"...')");if(e&&typeof e=="object"){let s=!1,r=!1;if(Ie(e,(o,a)=>{if(o===".value")s=!0;else if(o!==".priority"&&o!==".sv"&&(r=!0,!da(o)))throw new Error(n+" contains an invalid key ("+o+") "+Xt(i)+`.  Keys must be non-empty strings and can't contain ".", "#", "$", "/", "[", or "]"`);o_(i,o),tr(n,a,i),a_(i)}),s&&r)throw new Error(n+' contains ".value" child '+Xt(i)+" in addition to actual children.")}},Hy=function(n,e){let t,i;for(t=0;t<e.length;t++){i=e[t];const r=_i(i);for(let o=0;o<r.length;o++)if(!(r[o]===".priority"&&o===r.length-1)){if(!da(r[o]))throw new Error(n+"contains an invalid key ("+r[o]+") in path "+i.toString()+`. Keys must be non-empty strings and can't contain ".", "#", "$", "/", "[", or "]"`)}}e.sort(s_);let s=null;for(t=0;t<e.length;t++){if(i=e[t],s!==null&&Ve(s,i))throw new Error(n+"contains a path "+s.toString()+" that is ancestor of another path "+i.toString());s=i}},mu=function(n,e,t,i){const s=Sn(n,"values");if(!(e&&typeof e=="object")||Array.isArray(e))throw new Error(s+" must be an object containing the children to replace.");const r=[];Ie(e,(o,a)=>{const l=new le(o);if(tr(s,a,ge(t,l)),Bo(l)===".priority"&&!$s(a))throw new Error(s+"contains an invalid value for '"+l.toString()+"', which must be a valid Firebase priority (a string, finite number, server value, or null).");r.push(l)}),Hy(s,r)},Vy=function(n,e,t){if(Ks(e))throw new Error(Sn(n,"priority")+"is "+e.toString()+", but must be a valid Firebase priority (a string, finite number, server value, or null).");if(!$s(e))throw new Error(Sn(n,"priority")+"must be a valid Firebase priority (a string, finite number, server value, or null).")},ua=function(n,e,t,i){if(!pu(t))throw new Error(Sn(n,e)+'was an invalid path = "'+t+`". Paths must be non-empty strings and can't contain ".", "#", "$", "[", or "]"`)},jy=function(n,e,t,i){t&&(t=t.replace(/^\/*\.info(\/|$)/,"/")),ua(n,e,t)},en=function(n,e){if(Y(e)===".info")throw new Error(n+" failed = Can't modify data under /.info/")},qy=function(n,e){const t=e.path.toString();if(typeof e.repoInfo.host!="string"||e.repoInfo.host.length===0||!da(e.repoInfo.namespace)&&e.repoInfo.host.split(":")[0]!=="localhost"||t.length!==0&&!By(t))throw new Error(Sn(n,"url")+`must be a valid firebase URL and the path can't contain ".", "#", "$", "[", or "]".`)};/**
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
 */class Gy{constructor(){this.eventLists_=[],this.recursionDepth_=0}}function nr(n,e){let t=null;for(let i=0;i<e.length;i++){const s=e[i],r=s.getPath();t!==null&&!Ho(r,t.path)&&(n.eventLists_.push(t),t=null),t===null&&(t={events:[],path:r}),t.events.push(s)}t&&n.eventLists_.push(t)}function gu(n,e,t){nr(n,t),_u(n,i=>Ho(i,e))}function je(n,e,t){nr(n,t),_u(n,i=>Ve(i,e)||Ve(e,i))}function _u(n,e){n.recursionDepth_++;let t=!0;for(let i=0;i<n.eventLists_.length;i++){const s=n.eventLists_[i];if(s){const r=s.path;e(r)?(zy(n.eventLists_[i]),n.eventLists_[i]=null):t=!1}}t&&(n.eventLists_=[]),n.recursionDepth_--}function zy(n){for(let e=0;e<n.events.length;e++){const t=n.events[e];if(t!==null){n.events[e]=null;const i=t.getEventRunner();oi&&Ce("event: "+t.toString()),Wn(i)}}}/**
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
 */const Ky="repo_interrupt",Yy=25;class Qy{constructor(e,t,i,s){this.repoInfo_=e,this.forceRestClient_=t,this.authTokenProvider_=i,this.appCheckProvider_=s,this.dataUpdateCount=0,this.statsListener_=null,this.eventQueue_=new Gy,this.nextWriteId_=1,this.interceptServerDataCallback_=null,this.onDisconnect_=xs(),this.transactionQueueTree_=new la,this.persistentConnection_=null,this.key=this.repoInfo_.toURLString()}toString(){return(this.repoInfo_.secure?"https://":"http://")+this.repoInfo_.host}}function Jy(n,e,t){if(n.stats_=$o(n.repoInfo_),n.forceRestClient_||Ag())n.server_=new As(n.repoInfo_,(i,s,r,o)=>{Yl(n,i,s,r,o)},n.authTokenProvider_,n.appCheckProvider_),setTimeout(()=>Ql(n,!0),0);else{if(typeof t<"u"&&t!==null){if(typeof t!="object")throw new Error("Only objects are supported for option databaseAuthVariableOverride");try{ye(t)}catch(i){throw new Error("Invalid authOverride provided: "+i)}}n.persistentConnection_=new vt(n.repoInfo_,e,(i,s,r,o)=>{Yl(n,i,s,r,o)},i=>{Ql(n,i)},i=>{Xy(n,i)},n.authTokenProvider_,n.appCheckProvider_,t),n.server_=n.persistentConnection_}n.authTokenProvider_.addTokenChangeListener(i=>{n.server_.refreshAuthToken(i)}),n.appCheckProvider_.addTokenChangeListener(i=>{n.server_.refreshAppCheckToken(i.token)}),n.statsReporter_=Dg(n.repoInfo_,()=>new O_(n.stats_,n.server_)),n.infoData_=new R_,n.infoSyncTree_=new zl({startListening:(i,s,r,o)=>{let a=[];const l=n.infoData_.getNode(i._path);return l.isEmpty()||(a=Li(n.infoSyncTree_,i._path,l),setTimeout(()=>{o("ok")},0)),a},stopListening:()=>{}}),ha(n,"connected",!1),n.serverSyncTree_=new zl({startListening:(i,s,r,o)=>(n.server_.listen(i,r,s,(a,l)=>{const c=o(a,l);je(n.eventQueue_,i._path,c)}),[]),stopListening:(i,s)=>{n.server_.unlisten(i,s)}})}function yu(n){const t=n.infoData_.getNode(new le(".info/serverTimeOffset")).val()||0;return new Date().getTime()+t}function ir(n){return Oy({timestamp:yu(n)})}function Yl(n,e,t,i,s){n.dataUpdateCount++;const r=new le(e);t=n.interceptServerDataCallback_?n.interceptServerDataCallback_(e,t):t;let o=[];if(s)if(i){const l=ys(t,c=>_e(c));o=ky(n.serverSyncTree_,r,l,s)}else{const l=_e(t);o=ru(n.serverSyncTree_,r,l,s)}else if(i){const l=ys(t,c=>_e(c));o=Iy(n.serverSyncTree_,r,l)}else{const l=_e(t);o=Li(n.serverSyncTree_,r,l)}let a=r;o.length>0&&(a=xn(n,r)),je(n.eventQueue_,a,o)}function Ql(n,e){ha(n,"connected",e),e===!1&&nv(n)}function Xy(n,e){Ie(e,(t,i)=>{ha(n,t,i)})}function ha(n,e,t){const i=new le("/.info/"+e),s=_e(t);n.infoData_.updateSnapshot(i,s);const r=Li(n.infoSyncTree_,i,s);je(n.eventQueue_,i,r)}function fa(n){return n.nextWriteId_++}function Zy(n,e,t){const i=Ry(n.serverSyncTree_,e);return i!=null?Promise.resolve(i):n.server_.get(e).then(s=>{const r=_e(s).withIndex(e._queryParams.getIndex());no(n.serverSyncTree_,e,t,!0);let o;if(e._queryParams.loadsAllData())o=Li(n.serverSyncTree_,e._path,r);else{const a=Ei(n.serverSyncTree_,e);o=ru(n.serverSyncTree_,e._path,r,a)}return je(n.eventQueue_,e._path,o),Us(n.serverSyncTree_,e,t,null,!0),r},s=>(Ui(n,"get for query "+ye(e)+" failed: "+s),Promise.reject(new Error(s))))}function ev(n,e,t,i,s){Ui(n,"set",{path:e.toString(),value:t,priority:i});const r=ir(n),o=_e(t,i),a=ta(n.serverSyncTree_,e),l=du(o,a,r),c=fa(n),f=su(n.serverSyncTree_,e,l,c,!0);nr(n.eventQueue_,f),n.server_.put(e.toString(),o.val(!0),(_,m)=>{const w=_==="ok";w||Ne("set at "+e+" failed: "+_);const x=At(n.serverSyncTree_,c,!w);je(n.eventQueue_,e,x),Wt(n,s,_,m)});const u=ma(n,e);xn(n,u),je(n.eventQueue_,u,[])}function tv(n,e,t,i){Ui(n,"update",{path:e.toString(),value:t});let s=!0;const r=ir(n),o={};if(Ie(t,(a,l)=>{s=!1,o[a]=cu(ge(e,a),_e(l),n.serverSyncTree_,r)}),s)Ce("update() called with empty data.  Don't do anything."),Wt(n,i,"ok",void 0);else{const a=fa(n),l=Cy(n.serverSyncTree_,e,o,a);nr(n.eventQueue_,l),n.server_.merge(e.toString(),t,(c,f)=>{const u=c==="ok";u||Ne("update at "+e+" failed: "+c);const _=At(n.serverSyncTree_,a,!u),m=_.length>0?xn(n,e):e;je(n.eventQueue_,m,_),Wt(n,i,c,f)}),Ie(t,c=>{const f=ma(n,ge(e,c));xn(n,f)}),je(n.eventQueue_,e,[])}}function nv(n){Ui(n,"onDisconnectEvents");const e=ir(n),t=xs();Qr(n.onDisconnect_,re(),(s,r)=>{const o=cu(s,r,n.serverSyncTree_,e);Bn(t,s,o)});let i=[];Qr(t,re(),(s,r)=>{i=i.concat(Li(n.serverSyncTree_,s,r));const o=ma(n,s);xn(n,o)}),n.onDisconnect_=xs(),je(n.eventQueue_,re(),i)}function iv(n,e,t){n.server_.onDisconnectCancel(e.toString(),(i,s)=>{i==="ok"&&Yr(n.onDisconnect_,e),Wt(n,t,i,s)})}function Jl(n,e,t,i){const s=_e(t);n.server_.onDisconnectPut(e.toString(),s.val(!0),(r,o)=>{r==="ok"&&Bn(n.onDisconnect_,e,s),Wt(n,i,r,o)})}function sv(n,e,t,i,s){const r=_e(t,i);n.server_.onDisconnectPut(e.toString(),r.val(!0),(o,a)=>{o==="ok"&&Bn(n.onDisconnect_,e,r),Wt(n,s,o,a)})}function rv(n,e,t,i){if(_s(t)){Ce("onDisconnect().update() called with empty data.  Don't do anything."),Wt(n,i,"ok",void 0);return}n.server_.onDisconnectMerge(e.toString(),t,(s,r)=>{s==="ok"&&Ie(t,(o,a)=>{const l=_e(a);Bn(n.onDisconnect_,ge(e,o),l)}),Wt(n,i,s,r)})}function ov(n,e,t){let i;Y(e._path)===".info"?i=no(n.infoSyncTree_,e,t):i=no(n.serverSyncTree_,e,t),gu(n.eventQueue_,e._path,i)}function Xl(n,e,t){let i;Y(e._path)===".info"?i=Us(n.infoSyncTree_,e,t):i=Us(n.serverSyncTree_,e,t),gu(n.eventQueue_,e._path,i)}function av(n){n.persistentConnection_&&n.persistentConnection_.interrupt(Ky)}function Ui(n,...e){let t="";n.persistentConnection_&&(t=n.persistentConnection_.id+":"),Ce(t,...e)}function Wt(n,e,t,i){e&&Wn(()=>{if(t==="ok")e(null);else{const s=(t||"error").toUpperCase();let r=s;i&&(r+=": "+i);const o=new Error(r);o.code=s,e(o)}})}function vu(n,e,t){return ta(n.serverSyncTree_,e,t)||F.EMPTY_NODE}function pa(n,e=n.transactionQueueTree_){if(e||sr(n,e),Vn(e)){const t=bu(n,e);C(t.length>0,"Sending zero length transaction queue"),t.every(s=>s.status===0)&&lv(n,Fi(e),t)}else hu(e)&&er(e,t=>{pa(n,t)})}function lv(n,e,t){const i=t.map(c=>c.currentWriteId),s=vu(n,e,i);let r=s;const o=s.hash();for(let c=0;c<t.length;c++){const f=t[c];C(f.status===0,"tryToSendTransactionQueue_: items in queue should all be run."),f.status=1,f.retryCount++;const u=Pe(e,f.path);r=r.updateChild(u,f.currentOutputSnapshotRaw)}const a=r.val(!0),l=e;n.server_.put(l.toString(),a,c=>{Ui(n,"transaction put response",{path:l.toString(),status:c});let f=[];if(c==="ok"){const u=[];for(let _=0;_<t.length;_++)t[_].status=2,f=f.concat(At(n.serverSyncTree_,t[_].currentWriteId)),t[_].onComplete&&u.push(()=>t[_].onComplete(null,!0,t[_].currentOutputSnapshotResolved)),t[_].unwatcher();sr(n,ca(n.transactionQueueTree_,e)),pa(n,n.transactionQueueTree_),je(n.eventQueue_,e,f);for(let _=0;_<u.length;_++)Wn(u[_])}else{if(c==="datastale")for(let u=0;u<t.length;u++)t[u].status===3?t[u].status=4:t[u].status=0;else{Ne("transaction at "+l.toString()+" failed: "+c);for(let u=0;u<t.length;u++)t[u].status=4,t[u].abortReason=c}xn(n,e)}},o)}function xn(n,e){const t=wu(n,e),i=Fi(t),s=bu(n,t);return cv(n,s,i),i}function cv(n,e,t){if(e.length===0)return;const i=[];let s=[];const o=e.filter(a=>a.status===0).map(a=>a.currentWriteId);for(let a=0;a<e.length;a++){const l=e[a],c=Pe(t,l.path);let f=!1,u;if(C(c!==null,"rerunTransactionsUnderNode_: relativePath should not be null."),l.status===4)f=!0,u=l.abortReason,s=s.concat(At(n.serverSyncTree_,l.currentWriteId,!0));else if(l.status===0)if(l.retryCount>=Yy)f=!0,u="maxretry",s=s.concat(At(n.serverSyncTree_,l.currentWriteId,!0));else{const _=vu(n,l.path,o);l.currentInputSnapshot=_;const m=e[a].update(_.val());if(m!==void 0){tr("transaction failed: Data returned ",m,l.path);let w=_e(m);typeof m=="object"&&m!=null&&dt(m,".priority")||(w=w.updatePriority(_.getPriority()));const R=l.currentWriteId,H=ir(n),V=du(w,_,H);l.currentOutputSnapshotRaw=w,l.currentOutputSnapshotResolved=V,l.currentWriteId=fa(n),o.splice(o.indexOf(R),1),s=s.concat(su(n.serverSyncTree_,l.path,V,l.currentWriteId,l.applyLocally)),s=s.concat(At(n.serverSyncTree_,R,!0))}else f=!0,u="nodata",s=s.concat(At(n.serverSyncTree_,l.currentWriteId,!0))}je(n.eventQueue_,t,s),s=[],f&&(e[a].status=2,function(_){setTimeout(_,Math.floor(0))}(e[a].unwatcher),e[a].onComplete&&(u==="nodata"?i.push(()=>e[a].onComplete(null,!1,e[a].currentInputSnapshot)):i.push(()=>e[a].onComplete(new Error(u),!1,null))))}sr(n,n.transactionQueueTree_);for(let a=0;a<i.length;a++)Wn(i[a]);pa(n,n.transactionQueueTree_)}function wu(n,e){let t,i=n.transactionQueueTree_;for(t=Y(e);t!==null&&Vn(i)===void 0;)i=ca(i,t),e=ue(e),t=Y(e);return i}function bu(n,e){const t=[];return Eu(n,e,t),t.sort((i,s)=>i.order-s.order),t}function Eu(n,e,t){const i=Vn(e);if(i)for(let s=0;s<i.length;s++)t.push(i[s]);er(e,s=>{Eu(n,s,t)})}function sr(n,e){const t=Vn(e);if(t){let i=0;for(let s=0;s<t.length;s++)t[s].status!==2&&(t[i]=t[s],i++);t.length=i,uu(e,t.length>0?t:void 0)}er(e,i=>{sr(n,i)})}function ma(n,e){const t=Fi(wu(n,e)),i=ca(n.transactionQueueTree_,e);return Fy(i,s=>{xr(n,s)}),xr(n,i),fu(i,s=>{xr(n,s)}),t}function xr(n,e){const t=Vn(e);if(t){const i=[];let s=[],r=-1;for(let o=0;o<t.length;o++)t[o].status===3||(t[o].status===1?(C(r===o-1,"All SENT items should be at beginning of queue."),r=o,t[o].status=3,t[o].abortReason="set"):(C(t[o].status===0,"Unexpected transaction status in abort"),t[o].unwatcher(),s=s.concat(At(n.serverSyncTree_,t[o].currentWriteId,!0)),t[o].onComplete&&i.push(t[o].onComplete.bind(null,new Error("set"),!1,null))));r===-1?uu(e,void 0):t.length=r+1,je(n.eventQueue_,Fi(e),s);for(let o=0;o<i.length;o++)Wn(i[o])}}/**
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
 */function dv(n){let e="";const t=n.split("/");for(let i=0;i<t.length;i++)if(t[i].length>0){let s=t[i];try{s=decodeURIComponent(s.replace(/\+/g," "))}catch{}e+="/"+s}return e}function uv(n){const e={};n.charAt(0)==="?"&&(n=n.substring(1));for(const t of n.split("&")){if(t.length===0)continue;const i=t.split("=");i.length===2?e[decodeURIComponent(i[0])]=decodeURIComponent(i[1]):Ne(`Invalid query segment '${t}' in query '${n}'`)}return e}const Zl=function(n,e){const t=hv(n),i=t.namespace;t.domain==="firebase.com"&&Et(t.host+" is no longer supported. Please use <YOUR FIREBASE>.firebaseio.com instead"),(!i||i==="undefined")&&t.domain!=="localhost"&&Et("Cannot parse Firebase url. Please use https://<YOUR FIREBASE>.firebaseio.com"),t.secure||wg();const s=t.scheme==="ws"||t.scheme==="wss";return{repoInfo:new Td(t.host,t.secure,i,s,e,"",i!==t.subdomain),path:new le(t.pathString)}},hv=function(n){let e="",t="",i="",s="",r="",o=!0,a="https",l=443;if(typeof n=="string"){let c=n.indexOf("//");c>=0&&(a=n.substring(0,c-1),n=n.substring(c+2));let f=n.indexOf("/");f===-1&&(f=n.length);let u=n.indexOf("?");u===-1&&(u=n.length),e=n.substring(0,Math.min(f,u)),f<u&&(s=dv(n.substring(f,u)));const _=uv(n.substring(Math.min(n.length,u)));c=e.indexOf(":"),c>=0?(o=a==="https"||a==="wss",l=parseInt(e.substring(c+1),10)):c=e.length;const m=e.slice(0,c);if(m.toLowerCase()==="localhost")t="localhost";else if(m.split(".").length<=2)t=m;else{const w=e.indexOf(".");i=e.substring(0,w).toLowerCase(),t=e.substring(w+1),r=i}"ns"in _&&(r=_.ns)}return{host:e,port:l,domain:t,subdomain:i,secure:o,scheme:a,pathString:s,namespace:r}};/**
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
 */const ec="-0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ_abcdefghijklmnopqrstuvwxyz",fv=function(){let n=0;const e=[];return function(t){const i=t===n;n=t;let s;const r=new Array(8);for(s=7;s>=0;s--)r[s]=ec.charAt(t%64),t=Math.floor(t/64);C(t===0,"Cannot push at time == 0");let o=r.join("");if(i){for(s=11;s>=0&&e[s]===63;s--)e[s]=0;e[s]++}else for(s=0;s<12;s++)e[s]=Math.floor(Math.random()*64);for(s=0;s<12;s++)o+=ec.charAt(e[s]);return C(o.length===20,"nextPushId: Length should be 20."),o}}();/**
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
 */class Cu{constructor(e,t,i,s){this.eventType=e,this.eventRegistration=t,this.snapshot=i,this.prevName=s}getPath(){const e=this.snapshot.ref;return this.eventType==="value"?e._path:e.parent._path}getEventType(){return this.eventType}getEventRunner(){return this.eventRegistration.getEventRunner(this)}toString(){return this.getPath().toString()+":"+this.eventType+":"+ye(this.snapshot.exportVal())}}class Iu{constructor(e,t,i){this.eventRegistration=e,this.error=t,this.path=i}getPath(){return this.path}getEventType(){return"cancel"}getEventRunner(){return this.eventRegistration.getEventRunner(this)}toString(){return this.path.toString()+":cancel"}}/**
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
 */class Su{constructor(e,t){this.snapshotCallback=e,this.cancelCallback=t}onValue(e,t){this.snapshotCallback.call(null,e,t)}onCancel(e){return C(this.hasCancelCallback,"Raising a cancel event on a listener with no cancel callback"),this.cancelCallback.call(null,e)}get hasCancelCallback(){return!!this.cancelCallback}matches(e){return this.snapshotCallback===e.snapshotCallback||this.snapshotCallback.userCallback!==void 0&&this.snapshotCallback.userCallback===e.snapshotCallback.userCallback&&this.snapshotCallback.context===e.snapshotCallback.context}}/**
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
 */class pv{constructor(e,t){this._repo=e,this._path=t}cancel(){const e=new rt;return iv(this._repo,this._path,e.wrapCallback(()=>{})),e.promise}remove(){en("OnDisconnect.remove",this._path);const e=new rt;return Jl(this._repo,this._path,null,e.wrapCallback(()=>{})),e.promise}set(e){en("OnDisconnect.set",this._path),Ws("OnDisconnect.set",e,this._path,!1);const t=new rt;return Jl(this._repo,this._path,e,t.wrapCallback(()=>{})),t.promise}setWithPriority(e,t){en("OnDisconnect.setWithPriority",this._path),Ws("OnDisconnect.setWithPriority",e,this._path,!1),Vy("OnDisconnect.setWithPriority",t);const i=new rt;return sv(this._repo,this._path,e,t,i.wrapCallback(()=>{})),i.promise}update(e){en("OnDisconnect.update",this._path),mu("OnDisconnect.update",e,this._path);const t=new rt;return rv(this._repo,this._path,e,t.wrapCallback(()=>{})),t.promise}}/**
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
 */class $i{constructor(e,t,i,s){this._repo=e,this._path=t,this._queryParams=i,this._orderByCalled=s}get key(){return Q(this._path)?null:Bo(this._path)}get ref(){return new ut(this._repo,this._path)}get _queryIdentifier(){const e=Fl(this._queryParams),t=Fo(e);return t==="{}"?"default":t}get _queryObject(){return Fl(this._queryParams)}isEqual(e){if(e=ve(e),!(e instanceof $i))return!1;const t=this._repo===e._repo,i=Ho(this._path,e._path),s=this._queryIdentifier===e._queryIdentifier;return t&&i&&s}toJSON(){return this.toString()}toString(){return this._repo.toString()+i_(this._path)}}function mv(n,e){if(n._orderByCalled===!0)throw new Error(e+": You can't combine multiple orderBy calls.")}function gv(n){let e=null,t=null;if(n.hasStart()&&(e=n.getIndexStartValue()),n.hasEnd()&&(t=n.getIndexEndValue()),n.getIndex()===tn){const i="Query: When ordering by key, you may only pass one argument to startAt(), endAt(), or equalTo().",s="Query: When ordering by key, the argument passed to startAt(), startAfter(), endAt(), endBefore(), or equalTo() must be a string.";if(n.hasStart()){if(n.getIndexStartName()!==an)throw new Error(i);if(typeof e!="string")throw new Error(s)}if(n.hasEnd()){if(n.getIndexEndName()!==Lt)throw new Error(i);if(typeof t!="string")throw new Error(s)}}else if(n.getIndex()===pe){if(e!=null&&!$s(e)||t!=null&&!$s(t))throw new Error("Query: When ordering by priority, the first argument passed to startAt(), startAfter() endAt(), endBefore(), or equalTo() must be a valid priority value (null, a number, or a string).")}else if(C(n.getIndex()instanceof qo||n.getIndex()===Hd,"unknown index type."),e!=null&&typeof e=="object"||t!=null&&typeof t=="object")throw new Error("Query: First argument passed to startAt(), startAfter(), endAt(), endBefore(), or equalTo() cannot be an object.")}class ut extends $i{constructor(e,t){super(e,t,new zo,!1)}get parent(){const e=Md(this._path);return e===null?null:new ut(this._repo,e)}get root(){let e=this;for(;e.parent!==null;)e=e.parent;return e}}class Pn{constructor(e,t,i){this._node=e,this.ref=t,this._index=i}get priority(){return this._node.getPriority().val()}get key(){return this.ref.key}get size(){return this._node.numChildren()}child(e){const t=new le(e),i=Nn(this.ref,e);return new Pn(this._node.getChild(t),i,pe)}exists(){return!this._node.isEmpty()}exportVal(){return this._node.val(!0)}forEach(e){return this._node.isLeafNode()?!1:!!this._node.forEachChild(this._index,(i,s)=>e(new Pn(s,Nn(this.ref,i),pe)))}hasChild(e){const t=new le(e);return!this._node.getChild(t).isEmpty()}hasChildren(){return this._node.isLeafNode()?!1:!this._node.isEmpty()}toJSON(){return this.exportVal()}val(){return this._node.val()}}function $(n,e){return n=ve(n),n._checkNotDeleted("ref"),e!==void 0?Nn(n._root,e):n._root}function Nn(n,e){return n=ve(n),Y(n._path)===null?jy("child","path",e):ua("child","path",e),new ut(n._repo,ge(n._path,e))}function Bs(n){return n=ve(n),new pv(n._repo,n._path)}function Ci(n,e){n=ve(n),en("push",n._path),Ws("push",e,n._path,!0);const t=yu(n._repo),i=fv(t),s=Nn(n,i),r=Nn(n,i);let o;return e!=null?o=We(r,e).then(()=>r):o=Promise.resolve(r),s.then=o.then.bind(o),s.catch=o.then.bind(o,void 0),s}function On(n){return en("remove",n._path),We(n,null)}function We(n,e){n=ve(n),en("set",n._path),Ws("set",e,n._path,!1);const t=new rt;return ev(n._repo,n._path,e,null,t.wrapCallback(()=>{})),t.promise}function Te(n,e){mu("update",e,n._path);const t=new rt;return tv(n._repo,n._path,e,t.wrapCallback(()=>{})),t.promise}function jn(n){n=ve(n);const e=new Su(()=>{}),t=new rr(e);return Zy(n._repo,n,t).then(i=>new Pn(i,new ut(n._repo,n._path),n._queryParams.getIndex()))}class rr{constructor(e){this.callbackContext=e}respondsTo(e){return e==="value"}createEvent(e,t){const i=t._queryParams.getIndex();return new Cu("value",this,new Pn(e.snapshotNode,new ut(t._repo,t._path),i))}getEventRunner(e){return e.getEventType()==="cancel"?()=>this.callbackContext.onCancel(e.error):()=>this.callbackContext.onValue(e.snapshot,null)}createCancelEvent(e,t){return this.callbackContext.hasCancelCallback?new Iu(this,e,t):null}matches(e){return e instanceof rr?!e.callbackContext||!this.callbackContext?!0:e.callbackContext.matches(this.callbackContext):!1}hasAnyCallback(){return this.callbackContext!==null}}class ga{constructor(e,t){this.eventType=e,this.callbackContext=t}respondsTo(e){let t=e==="children_added"?"child_added":e;return t=t==="children_removed"?"child_removed":t,this.eventType===t}createCancelEvent(e,t){return this.callbackContext.hasCancelCallback?new Iu(this,e,t):null}createEvent(e,t){C(e.childName!=null,"Child events should have a childName.");const i=Nn(new ut(t._repo,t._path),e.childName),s=t._queryParams.getIndex();return new Cu(e.type,this,new Pn(e.snapshotNode,i,s),e.prevName)}getEventRunner(e){return e.getEventType()==="cancel"?()=>this.callbackContext.onCancel(e.error):()=>this.callbackContext.onValue(e.snapshot,e.prevName)}matches(e){return e instanceof ga?this.eventType===e.eventType&&(!this.callbackContext||!e.callbackContext||this.callbackContext.matches(e.callbackContext)):!1}hasAnyCallback(){return!!this.callbackContext}}function or(n,e,t,i,s){let r;if(typeof i=="object"&&(r=void 0,s=i),typeof i=="function"&&(r=i),s&&s.onlyOnce){const l=t,c=(f,u)=>{Xl(n._repo,n,a),l(f,u)};c.userCallback=t.userCallback,c.context=t.context,t=c}const o=new Su(t,r||void 0),a=e==="value"?new rr(o):new ga(e,o);return ov(n._repo,n,a),()=>Xl(n._repo,n,a)}function nn(n,e,t,i){return or(n,"value",e,t,i)}function ui(n,e,t,i){return or(n,"child_added",e,t,i)}function _v(n,e,t,i){return or(n,"child_changed",e,t,i)}function yv(n,e,t,i){return or(n,"child_removed",e,t,i)}class Tu{}class vv extends Tu{constructor(e){super(),this._limit=e,this.type="limitToLast"}_apply(e){if(e._queryParams.hasLimit())throw new Error("limitToLast: Limit was already set (by another call to limitToFirst or limitToLast).");return new $i(e._repo,e._path,T_(e._queryParams,this._limit),e._orderByCalled)}}function so(n){if(typeof n!="number"||Math.floor(n)!==n||n<=0)throw new Error("limitToLast: First argument must be a positive integer.");return new vv(n)}class wv extends Tu{constructor(e){super(),this._path=e,this.type="orderByChild"}_apply(e){mv(e,"orderByChild");const t=new le(this._path);if(Q(t))throw new Error("orderByChild: cannot pass in empty path. Use orderByValue() instead.");const i=new qo(t),s=k_(e._queryParams,i);return gv(s),new $i(e._repo,e._path,s,!0)}}function ro(n){return ua("orderByChild","path",n),new wv(n)}function oo(n,...e){let t=ve(n);for(const i of e)t=i._apply(t);return t}my(ut);wy(ut);/**
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
 */const bv="FIREBASE_DATABASE_EMULATOR_HOST",ao={};let Ev=!1;function Cv(n,e,t,i){n.repoInfo_=new Td(`${e}:${t}`,!1,n.repoInfo_.namespace,n.repoInfo_.webSocketOnly,n.repoInfo_.nodeAdmin,n.repoInfo_.persistenceKey,n.repoInfo_.includeNamespaceInQueryParams,!0),i&&(n.authTokenProvider_=i)}function Iv(n,e,t,i,s){let r=i||n.options.databaseURL;r===void 0&&(n.options.projectId||Et("Can't determine Firebase Database URL. Be sure to include  a Project ID when calling firebase.initializeApp()."),Ce("Using default host for project ",n.options.projectId),r=`${n.options.projectId}-default-rtdb.firebaseio.com`);let o=Zl(r,s),a=o.repoInfo,l;typeof process<"u"&&vl&&(l=vl[bv]),l?(r=`http://${l}?ns=${a.namespace}`,o=Zl(r,s),a=o.repoInfo):o.repoInfo.secure;const c=new Pg(n.name,n.options,e);qy("Invalid Firebase Database URL",o),Q(o.path)||Et("Database URL must point to the root of a Firebase Database (not including a child path).");const f=Tv(a,n,c,new xg(n.name,t));return new kv(f,n)}function Sv(n,e){const t=ao[e];(!t||t[n.key]!==n)&&Et(`Database ${e}(${n.repoInfo_}) has already been deleted.`),av(n),delete t[n.key]}function Tv(n,e,t,i){let s=ao[e.name];s||(s={},ao[e.name]=s);let r=s[n.toURLString()];return r&&Et("Database initialized multiple times. Please make sure the format of the database URL matches with each database() call."),r=new Qy(n,Ev,t,i),s[n.toURLString()]=r,r}class kv{constructor(e,t){this._repoInternal=e,this.app=t,this.type="database",this._instanceStarted=!1}get _repo(){return this._instanceStarted||(Jy(this._repoInternal,this.app.options.appId,this.app.options.databaseAuthVariableOverride),this._instanceStarted=!0),this._repoInternal}get _root(){return this._rootInternal||(this._rootInternal=new ut(this._repo,re())),this._rootInternal}_delete(){return this._rootInternal!==null&&(Sv(this._repo,this.app.name),this._repoInternal=null,this._rootInternal=null),Promise.resolve()}_checkNotDeleted(e){this._rootInternal===null&&Et("Cannot call "+e+" on a deleted database.")}}function Rv(n=Ac(),e){const t=ko(n,"database").getImmediate({identifier:e});if(!t._instanceStarted){const i=Th("database");i&&Av(t,...i)}return t}function Av(n,e,t,i={}){n=ve(n),n._checkNotDeleted("useEmulator"),n._instanceStarted&&Et("Cannot call useEmulator() after instance has already been initialized.");const s=n._repoInternal;let r;if(s.repoInfo_.nodeAdmin)i.mockUserToken&&Et('mockUserToken is not supported by the Admin SDK. For client access with mock users, please use the "firebase" package instead of "firebase-admin".'),r=new hs(hs.OWNER);else if(i.mockUserToken){const o=typeof i.mockUserToken=="string"?i.mockUserToken:kh(i.mockUserToken,n.app.options.projectId);r=new hs(o)}Cv(s,e,t,r)}/**
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
 */function xv(n){pg(Un),Tn(new sn("database",(e,{instanceIdentifier:t})=>{const i=e.getProvider("app").getImmediate(),s=e.getProvider("auth-internal"),r=e.getProvider("app-check-internal");return Iv(i,s,r,t)},"PUBLIC").setMultipleInstances(!0)),Ot(wl,bl,n),Ot(wl,bl,"esm2017")}/**
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
 */const Pv={".sv":"timestamp"};function _t(){return Pv}vt.prototype.simpleListen=function(n,e){this.sendRequest("q",{p:n},e)};vt.prototype.echo=function(n,e){this.sendRequest("echo",{d:n},e)};xv();const ku={apiKey:"AIzaSyAXWr1bW5FljYLu7levh_P6w0rrbdhVToE",authDomain:"playlist-lobby.firebaseapp.com",databaseURL:"https://playlist-lobby-default-rtdb.europe-west1.firebasedatabase.app",projectId:"playlist-lobby",appId:"1:98113831672:web:caae55b5c34ba63688310d"},Nv=!ku.apiKey.startsWith("PASTE"),Ru=Nv,Ov=ku,Au=Rc(Ov,"hotel"),Wi=dg(Au),W=Rv(Au);class xu{constructor(e,t,i,s,r,o,a,l,c){switch(this.direction=t,this.headDirection=i,this.isHeadOnly=a,this.isBodyOnly=l,this.scale=c,this.isDownsampled=!1,this.isLarge=!1,this.isSmall=!1,this.rectWidth=64,this.rectHeight=110,c){case"l":this.isLarge=!0,this.rectWidth=128,this.rectHeight=220;break;case"s":this.isSmall=!0,this.rectWidth=32,this.rectHeight=55;break;case"d":this.isDownsampled=!0;break}switch(this.figure=Dv(e),this.frame=o,this.drawAction={body:"std"},this.handItem=-1,this.drawOrder="std",this.gesture=r,r){case"spk":this.drawAction.speak="spk";break;case"eyb":this.drawAction.eye="eyb";break;case"":this.drawAction.gesture="std";break;default:this.drawAction.gesture=r;break}this.action=s;for(let f of this.action){const u=f.split("=");switch(u[0]){case"wlk":this.drawAction.wlk="wlk";break;case"sit":this.drawAction.sit="sit";break;case"lay":this.drawAction.body="lay",this.drawAction.eye="lay";const _=this.rectWidth;switch(this.rectWidth=this.rectHeight,this.rectHeight=_,this.gesture){case"spk":this.drawAction.speak="lsp";break;case"eyb":this.drawAction.eye="ley";break;case"std":this.drawAction.gesture="lay";break;default:this.drawAction.gesture="l"+this.gesture.substr(0,2);break}break;case"wav":this.drawAction.handLeft="wav";break;case"crr":case"drk":this.drawAction.handRight=u[0],this.drawAction.itemRight=u[0],this.handItem=Number(u[1]);break;case"swm":this.drawAction.swm="swm",this.gesture==="spk"&&(this.drawAction.speak="sws");break;case"":this.drawAction.body="std";break;default:this.drawAction.body=u[0];break}}this.drawAction.sit==="sit"&&(this.direction>=2&&this.direction<=4?(this.drawOrder="sit",this.drawAction.handRight==="drk"&&this.direction>=2&&this.direction<=3?this.drawOrder+=".rh-up":this.drawAction.handLeft&&this.direction===4&&(this.drawOrder+=".lh-up")):this.drawAction.body==="lay"?this.drawOrder="lay":this.drawAction.handRight==="drk"&&this.direction>=0&&this.direction<=3?this.drawOrder="rh-up":this.drawAction.handLeft&&this.direction>=4&&this.direction<=6&&(this.drawOrder="lh-up"))}}const Dv=n=>{const e={},t=[];for(let i of n.split(".")){const s=i.split("-"),r={type:s[0],id:s[1],colors:[s[2]]};s[3]!=null&&r.colors.push(s[3]),e[r.type]=r}for(let i in e)t.push(e[i]);return t},Mv=(n,e,t)=>{const i=n.frames[t];if(i==null)return null;const{x:s,y:r,w:o,h:a}=i.frame,l=document.createElement("canvas");l.width=o,l.height=a;const c=l.getContext("2d");return c!=null?(l.width=o,l.height=a,c.drawImage(e,s,r,o,a,0,0,o,a),l):null};class Lv{constructor(e,t,i,s,r,o,a,l){this.resDirection=o,i==="hd"&&s&&(r=1),i==="ey"&&t==="std"&&r===1&&o===3&&(t="sml"),i==="fa"&&t==="std"&&r===2&&(o===2||o===4)&&(this.resDirection=1),i==="he"&&t==="std"&&r===1&&o===2&&(this.resDirection=0),i==="he"&&t==="std"&&r===8&&(this.resDirection=o%2===0?1:this.resDirection),i==="he"&&t==="std"&&(r===2131||r===2132)&&o>=2&&o<=6&&(this.resDirection=1),i==="ha"&&t==="std"&&r===2518&&(this.resDirection=o%2===0?2:1),i==="ha"&&t==="std"&&r===2519&&(this.resDirection=o%2===0?2:3),i==="ha"&&t==="std"&&r===2588&&(this.resDirection=7),i==="ha"&&t==="std"&&r===2589&&(this.resDirection=3),this.lib=e,this.isFlip=!1,this.action=t,this.resAction=t,this.type=i,this.resType=i,this.isSmall=s,this.partId=r,this.direction=o,this.frame=a,this.resFrame=a,this.color=l,this.resourceName=this.getResourceName(),this.promise=null,this.resource=null}getResourceName(){let e=this.isSmall?"sh":"h";return e+="_",e+=this.resAction,e+="_",e+=this.resType,e+="_",e+=this.partId,e+="_",e+=this.resDirection,e+="_",e+=this.resFrame,e}extractFromAtlas(e,t){const i=Mv(e,t,this.lib+"_"+this.getResourceName()+".png");return i!=null&&(this.resource=i,this.promise=Promise.resolve(i)),this.promise}downloadAsync(e){if(this.promise==null){let t=new Image;this.promise=new Promise((i,s)=>{t.onload=()=>{this.resource=t,i(t)},t.onerror=()=>{s("Could not load image: "+t.src)}}),t.crossOrigin="anonymous",t.src=e+this.lib+"/"+this.lib+"_"+this.getResourceName()+".png"}return this.promise}}class Fv{constructor(e){this.ready=!1,this.offsets={},this.chunks={},this.figuremap={},this.figuredata={},this.partsets={},this.draworder={},this.animation={},this.resourcesUrl=e}initialize(){const e=this.loadFiles();return Promise.all(e).then(()=>{this.ready=!0})}loadFiles(){return[this.fetchJsonAsync(this.resourcesUrl+"map.json").then(e=>{this.figuremap=e}),this.fetchJsonAsync(this.resourcesUrl+"figuredata.json").then(e=>{this.figuredata=e}),this.fetchJsonAsync(this.resourcesUrl+"partsets.json").then(e=>{this.partsets=e}),this.fetchJsonAsync(this.resourcesUrl+"draworder.json").then(e=>{this.draworder=e}),this.fetchJsonAsync(this.resourcesUrl+"animation.json").then(e=>{this.animation=e})]}fetchJsonAsync(e){return new Promise((t,i)=>{fetch(e,{method:"GET",mode:"cors",cache:"default"}).then(r=>r.json()).then(r=>t(r)).catch(r=>i(r))})}downloadAtlasAsync(e){let t=new Image,i=new Promise((s,r)=>{t.onload=()=>{s(t)},t.onerror=()=>{r("Could not load image: "+t.src)}});return t.crossOrigin="anonymous",t.src=this.resourcesUrl+e+"/atlas.png",i}fetchOffsetAsync(e){const t=this.fetchJsonAsync(this.resourcesUrl+e+"/offset.json").then(s=>{this.offsets[e].data=s}),i=this.downloadAtlasAsync(e).then(s=>{this.offsets[e].atlas=s});return Promise.all([t,i])}getTypeColorId(e,t){const i=new xu(e,0,0,["std"],"std",0,!1,!1,"d");let s=0;for(let r of i.figure)if(r.type===t){const o=this.getPartColor(r);for(let a in o){const l=o[a];for(let c of l)if(c.color!=null)return s=parseInt(c.color,16),s}}return s}getChatColor(e){return this.getTypeColorId(e,"ch")}generateGeneric(e,t){const i={};i.rect=this.getActivePartSet(e.isHeadOnly?"head":"figure"),i.head=this.getActivePartSet("head"),i.eye=this.getActivePartSet("eye"),i.gesture=this.getActivePartSet("gesture"),i.speak=this.getActivePartSet("speak"),i.walk=this.getActivePartSet("walk"),i.sit=this.getActivePartSet("sit"),i.itemRight=this.getActivePartSet("itemRight"),i.handRight=this.getActivePartSet("handRight"),i.handLeft=this.getActivePartSet("handLeft"),i.swim=this.getActivePartSet("swim");let s=this.getDrawOrder(e.drawOrder,e.direction);s==null&&(s=this.getDrawOrder("std",e.direction));const r={};for(let l of e.figure){const c=this.getPartColor(l);for(let f in c)r[f]==null&&(r[f]=[]),r[f]=c[f].concat(r[f])}e.handItem>0&&(r.ri=[{index:0,id:e.handItem}]);const o=[],a=[];for(let l of s){const c=r[l];if(c!=null)for(let f of c){const u=this.getPartUniqueName(l,f.id);if(u!=null){if(r.hidden.includes(l)||i.head.includes(l)&&e.isBodyOnly||!i.rect.includes(l)||t&&(i.gesture.includes(l)||i.eye.includes(l)))continue;let _=e.direction,m=null;if(i.rect.includes(l)&&(m=e.drawAction.body),i.head.includes(l)&&(_=e.headDirection),i.speak.includes(l)&&e.drawAction.speak&&(m=e.drawAction.speak),i.gesture.includes(l)&&e.drawAction.gesture&&(m=e.drawAction.gesture),i.eye.includes(l)&&(f.colorable=!1,e.drawAction.eye&&(m=e.drawAction.eye)),i.walk.includes(l)&&e.drawAction.wlk&&(m=e.drawAction.wlk),i.sit.includes(l)&&e.drawAction.sit&&(m=e.drawAction.sit),i.handRight.includes(l)&&e.drawAction.handRight&&(m=e.drawAction.handRight),i.itemRight.includes(l)&&e.drawAction.itemRight&&(m=e.drawAction.itemRight),i.handLeft.includes(l)&&e.drawAction.handLeft&&(m=e.drawAction.handLeft),i.swim.includes(l)&&e.drawAction.swm&&(m=e.drawAction.swm),m==null)continue;this.offsets[u]==null&&(this.offsets[u]={promise:this.fetchOffsetAsync(u),data:{},atlas:{}}),a.push(this.offsets[u].promise);const w=f.colorable?f.color:null,x=this.getPartResource(u,m,l,e.isSmall,f.id,_,e.frame,w);o.push(x)}}}return new Promise((l,c)=>{Promise.all(a).then(()=>{let f=document.createElement("canvas"),u=f.getContext("2d");f.width=e.rectWidth,f.height=e.rectHeight;const _=[];for(let m of o)if(this.offsets[m.lib].data!=null&&this.offsets[m.lib].data[m.getResourceName()]!=null&&!this.offsets[m.lib].data[m.getResourceName()].flipped){const w=this.offsets[m.lib].data.atlas,x=this.offsets[m.lib].atlas;_.push(m.extractFromAtlas(w,x))}else{let w=this.partsets.partSet[m.type]["flipped-set-type"];if(w!==""&&(m.resType=w),m.action==="std"&&(this.offsets[m.lib].data==null||this.offsets[m.lib].data[m.getResourceName()]==null||this.offsets[m.lib].data[m.getResourceName()].flipped)&&(m.resAction="spk"),(this.offsets[m.lib].data==null||this.offsets[m.lib].data[m.getResourceName()]==null||this.offsets[m.lib].data[m.getResourceName()].flipped)&&(m.isFlip=!0,m.resAction=m.action,m.resDirection=6-m.direction),(this.offsets[m.lib].data==null||this.offsets[m.lib].data[m.getResourceName()]==null||this.offsets[m.lib].data[m.getResourceName()].flipped)&&(m.resFrame=m.frame+1,m.isFlip=!1),(this.offsets[m.lib].data==null||this.offsets[m.lib].data[m.getResourceName()]==null||this.offsets[m.lib].data[m.getResourceName()].flipped)&&(m.isFlip=!1,m.resFrame=m.frame,m.resAction=m.action,m.direction===7&&(m.resDirection=3),m.direction===3&&(m.resDirection=7)),(this.offsets[m.lib].data==null||this.offsets[m.lib].data[m.getResourceName()]==null||this.offsets[m.lib].data[m.getResourceName()].flipped)&&(m.resFrame=m.frame+1,m.isFlip=!1),(this.offsets[m.lib].data==null||this.offsets[m.lib].data[m.getResourceName()]==null||this.offsets[m.lib].data[m.getResourceName()].flipped)&&(m.resAction=m.action,m.resType=w,m.resDirection=m.direction),m.action==="std"&&(this.offsets[m.lib].data==null||this.offsets[m.lib].data[m.getResourceName()]==null||this.offsets[m.lib].data[m.getResourceName()].flipped)&&(m.resAction="spk",m.resType=m.type),this.offsets[m.lib].data!=null&&this.offsets[m.lib].data[m.getResourceName()]!=null&&!this.offsets[m.lib].data[m.getResourceName()].flipped){const x=this.offsets[m.lib].data.atlas,R=this.offsets[m.lib].atlas;_.push(m.extractFromAtlas(x,R))}}Promise.all(_).catch(m=>{c("Error downloading chunks")}).then(()=>{for(let m of o)if(this.offsets[m.lib].data!=null&&this.offsets[m.lib].data[m.getResourceName()]!=null&&m.resource!=null){let w=-this.offsets[m.lib].data[m.getResourceName()].x,x=e.rectHeight/2-this.offsets[m.lib].data[m.getResourceName()].y+e.rectHeight/2.5,R=m.resource;m.color!=null&&(R=this.tintSprite(R,m.color,t?170:255)),m.isFlip&&(w=-(w+R.width-e.rectWidth+1),R=this.flipImage(R)),u!=null&&u.drawImage(R,w,x)}e.isDownsampled&&(f=this.downsampleImage(f)),l(f)})})})}getActivePartSet(e){const t=this.partsets.activePartSet[e].activePart;return t==null||t.length===0?null:t}getDrawOrder(e,t){const i=this.draworder[e][t];return i==null||i.length===0?null:i}getPartPalette(e){let t=this.figuredata.settype[e];if(t!=null){const i=t.paletteid;return this.figuredata.palette[i]}return null}getPartPaletteCount(e,t){const i=this.getPartSet(e);if(i!=null){const s=i[t];if(s!=null){const r=s.part,o=Math.max.apply(Math,r.map(a=>a.colorindex));return Math.max(1,o)}}return 1}getPartSet(e){let t=this.figuredata.settype[e];return t!=null?t.set:null}getPartColor(e){const t={};let i=this.figuredata.settype[e.type];if(i!=null){if(i.set[e.id]!=null&&i.set[e.id].part!=null)for(let s of i.set[e.id].part){const r=s;let o={index:r.index,id:r.id,colorable:r.colorable};r.colorable&&(o.color=this.getColorByPaletteId(i.paletteid,e.colors[r.colorindex-1])),t[r.type]==null?t[r.type]=[o]:t[r.type].push(o)}if(t.hidden=[],i.set[e.id]!=null&&Array.isArray(i.set[e.id].hidden))for(let s of i.set[e.id].hidden)t.hidden.push(s)}return t}getColorByPaletteId(e,t){return this.figuredata.palette[e]!=null&&this.figuredata.palette[e][t]!=null&&this.figuredata.palette[e][t].color!=null?this.figuredata.palette[e][t].color:null}getPartUniqueName(e,t){let i=this.figuremap[e][t];return i==null&&e==="hrb"&&(i=this.figuremap.hr[t]),i==null&&(i=this.figuremap[e][1]),i==null&&(i=this.figuremap[e][0]),i}getPartResource(e,t,i,s,r,o,a,l){let c=this.getFrameNumber(i,t,a),f=new Lv(e,t,i,s,r,o,c,l),u=f.getResourceName();return this.chunks[u]!=null&&this.chunks[u].resource!=null?(f.resource=this.chunks[u].resource,f.promise=this.chunks[u].promise):this.chunks[u]=f,f}getFrameNumber(e,t,i){const s={wav:"Wave",wlk:"Move",spk:"Talk"};if(s[t]!=null&&this.animation[s[t]].part[e]!=null){const r=this.animation[s[t]].part[e].length;if(this.animation[s[t]].part[e][i%r]!=null)return this.animation[s[t]].part[e][i%r].number}return 0}tintSprite(e,t,i){let s=document.createElement("canvas"),r=s.getContext("2d");if(r==null)return null;let o=this.hex2rgb(t),a=e.width,l=e.height;s.width=a,s.height=l,r.drawImage(e,0,0);let c=r.getImageData(0,0,a,l);for(let f=0;f<l;f++){let u=f*a*4;for(let _=0;_<a;_++)u++,u++,u++,c.data[u++]!==0&&(c.data[u-1]=i,c.data[u-2]=Math.round(o.b*c.data[u-2]/255),c.data[u-3]=Math.round(o.g*c.data[u-3]/255),c.data[u-4]=Math.round(o.r*c.data[u-4]/255))}return r.putImageData(c,0,0),s}hex2rgb(e){const t=/^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(e);return t?{r:parseInt(t[1],16),g:parseInt(t[2],16),b:parseInt(t[3],16)}:null}flipImage(e){let t=document.createElement("canvas"),i=t.getContext("2d");if(i==null)return null;let s=e.width,r=e.height;return t.width=s,t.height=r,i.save(),i.scale(-1,1),i.drawImage(e,0,0,s*-1,r),i.restore(),t}downsampleImage(e){let t=document.createElement("canvas"),i=t.getContext("2d");if(i==null)return null;let s=e.width,r=e.height;return t.width=s,t.height=r,i.save(),i.scale(.5,.5),i.drawImage(e,0,0),i.restore(),t}}const Uv="https://images.bobba.io/gordon/PRODUCTION-202006192205-424220153/",_a=new Fv(Uv),ya=_a.initialize(),lo=new Map,Pr=new Map;function Pu(n){return[n.figure,n.dir,n.headDir??n.dir,(n.actions??["std"]).join("+"),n.gesture??"std",n.frame??0,n.headOnly?1:0].join("|")}function $v(n){return lo.get(Pu(n))}function Dn(n){const e=Pu(n),t=lo.get(e);if(t)return Promise.resolve(t);const i=Pr.get(e);if(i)return i;const s=ya.then(()=>{const r=new xu(n.figure,n.dir&7,(n.headDir??n.dir)&7,n.actions??["std"],n.gesture??"std",n.frame??0,!!n.headOnly,!1,"n");return _a.generateGeneric(r,!1)}).then(r=>(lo.set(e,r),r)).catch(r=>(console.warn("avatar render failed",n.figure,r),null)).finally(()=>Pr.delete(e));return Pr.set(e,s),s}const yn=[{id:"hd",label:"Face & skin",headOnly:!0,required:!0},{id:"hr",label:"Hair",headOnly:!0,required:!1},{id:"ha",label:"Hats",headOnly:!0,required:!1},{id:"he",label:"Head items",headOnly:!0,required:!1},{id:"ea",label:"Glasses",headOnly:!0,required:!1},{id:"fa",label:"Face items",headOnly:!0,required:!1},{id:"ch",label:"Shirts",headOnly:!1,required:!0},{id:"cc",label:"Jackets",headOnly:!1,required:!1},{id:"cp",label:"Prints",headOnly:!1,required:!1},{id:"ca",label:"Chest items",headOnly:!1,required:!1},{id:"lg",label:"Trousers",headOnly:!1,required:!0},{id:"sh",label:"Shoes",headOnly:!1,required:!0},{id:"wa",label:"Belts",headOnly:!1,required:!1}],fs={M:"hr-115-42.hd-190-1.ch-215-62.lg-285-91.sh-290-62",F:"hr-515-33.hd-600-1.ch-635-70.lg-716-66-62.sh-735-68"},Wv={hd:20,hr:40,ha:60,he:45,ea:45,fa:40,ch:50,cc:70,cp:40,ca:55,lg:45,sh:35,wa:50};function Bv(n){let e=0;for(let t=0;t<n.length;t++)e=e*31+n.charCodeAt(t)>>>0;return e}function tc(n,e){return`${n}_${e}`}let at=null;const Nu={};async function Hv(){if(await ya,at)return;const n=_a.figuredata;at={};const e=new Set(Object.values(fs).flatMap(t=>Object.entries(ps(t)).map(([i,s])=>tc(i,s.id))));for(const t of yn){const i=n.settype[t.id];if(!i){at[t.id]=[];continue}const s=[];for(const[o,a]of Object.entries(i.set)){if(!a.selectable||a.club>0)continue;const l=Math.max(0,...a.part.map(_=>_.colorindex||0)),c=tc(t.id,o),u=!!a.preselectable||e.has(c)?0:Math.max(1,Math.round((Wv[t.id]+Bv(t.id+o)%6*10)/25));s.push({type:t.id,id:o,gender:a.gender,colors:l,price:u,key:c})}s.sort((o,a)=>o.price-a.price||Number(o.id)-Number(a.id)),at[t.id]=s;const r=n.palette[i.paletteid]??{};Nu[t.id]=Object.entries(r).filter(([,o])=>o.club===0&&o.selectable).sort((o,a)=>o[1].index-a[1].index).map(([o,a])=>({id:o,hex:a.color}))}}function Vv(n,e){return((at==null?void 0:at[n])??[]).filter(t=>t.gender==="U"||t.gender===e)}function Ou(n){return Nu[n]??[]}function Du(n,e){var t;return(t=at==null?void 0:at[n])==null?void 0:t.find(i=>i.id===e)}function co(n,e){return n.price===0||!!e[n.key]}function ps(n){const e={};for(const t of n.split(".")){const[i,s,...r]=t.split("-");i&&s&&(e[i]={id:s,colors:r})}return e}function is(n){return yn.filter(e=>n[e.id]).map(e=>[e.id,n[e.id].id,...n[e.id].colors].join("-")).join(".")}function nc(n,e){var s;const t=Ou(n.type),i=[];for(let r=0;r<n.colors;r++){const o=e==null?void 0:e.colors[r];i.push(o&&t.some(a=>a.id===o)?o:((s=t[Math.min(r*3,t.length-1)])==null?void 0:s.id)??"1")}return i}function jv(n,e){const t=[];for(const[i,s]of Object.entries(n)){if(!s)continue;const r=Du(i,s.id);r&&!co(r,e)&&t.push(r)}return t}const Ii=n=>"./"+n.replace(/^\/+/,""),Si={cd:{id:"cd",name:"CD",examine:"A scratched CD with a handwritten label. Use it on the CD player in the lobby so everyone can hear it. It comes back when it's done.",icon:Ii("items/cd.svg"),useOnObject:"cdplayer"},knife:{id:"knife",name:"Knife",examine:"A small, sharp knife. Use it on another player: one stab a day draws a drop of blood.",icon:Ii("items/knife.svg"),useOnPlayer:"stab"}},va=28,Mu=()=>Array.from({length:va},()=>null);function qv(n){const e=Mu();if(!n||typeof n!="object")return e;for(const[t,i]of Object.entries(n)){const s=Number(t);i&&s>=0&&s<va&&Si[i.item]&&(e[s]={item:i.item,qty:i.qty??1,...i.inPlayer?{inPlayer:!0}:{}})}return e}const ss=(n,e)=>n.findIndex(t=>(t==null?void 0:t.item)===e&&!t.inPlayer),Gv=(n,e)=>n.findIndex(t=>(t==null?void 0:t.item)===e),Bi=Ii("items/blood.svg"),uo=5,ho="access_music",Nr=4,zv=8,Lu=864e5;let Fu=0;Ru&&nn($(W,".info/serverTimeOffset"),n=>{Fu=Number(n.val())||0});const Ze=()=>Date.now()+Fu,wa=()=>{const n=Ze();return n-n%Lu},Uu=()=>wa()+Lu-Ze(),fo=n=>n.lastStabDay<wa();async function $u(n,e){const t=Mu();t[0]={item:"knife",qty:1},t[1]={item:"cd",qty:1};const i={uid:n,name:e,gender:"M",figure:"",blood:uo,owned:{},wardrobe:{},inventory:t,lastStabDay:0};return await We($(W,`users/${n}`),{name:e,gender:i.gender,figure:i.figure,blood:i.blood,inventory:{0:{item:"knife",qty:1},1:{item:"cd",qty:1}}}),i}async function Kv(n){const e=await jn($(W,`users/${n}`));if(!e.exists())return null;const t=e.val(),i={uid:n,name:t.name,gender:t.gender==="F"?"F":"M",figure:t.figure??"",blood:t.blood??0,owned:t.owned??{},wardrobe:t.wardrobe??{},inventory:qv(t.inventory),lastStabDay:t.lastStabDay??0},s={};if(t.blood===void 0&&(i.blood=uo,s.blood=uo),t.inventory===void 0&&(i.inventory[0]={item:"knife",qty:1},s["inventory/0"]={item:"knife",qty:1}),Gv(i.inventory,"cd")<0){const r=i.inventory.findIndex(o=>o===null);r>=0&&(i.inventory[r]={item:"cd",qty:1},s[`inventory/${r}`]={item:"cd",qty:1})}return Object.keys(s).length&&await Te($(W,`users/${n}`),s),i}async function po(n,e,t){await Te($(W,`users/${n.uid}`),{figure:e,gender:t}),await Te($(W,`profiles/${n.uid}`),{name:n.name,figure:e}).catch(()=>{}),n.figure=e,n.gender=t}async function ba(n,e,t){if(t>n.blood)throw new Error("Not enough drops of blood");const i={blood:n.blood-t};for(const s of e)i[`owned/${s}`]=!0;await Te($(W,`users/${n.uid}`),i),n.blood-=t;for(const s of e)n.owned[s]=!0}async function Yv(n){const e=wa();await Te($(W,`users/${n.uid}`),{blood:n.blood+1,lastStabDay:e}),n.blood+=1,n.lastStabDay=e}async function Qv(n,e,t){await We($(W,`users/${n.uid}/wardrobe/${e}`),t),n.wardrobe[e]=t}async function Jv(n,e){await We($(W,`users/${n.uid}/wardrobe/${e}`),null),delete n.wardrobe[e]}const Xv=/^[A-Za-z0-9_.-]{3,16}$/,Wu=n=>`${n.toLowerCase()}@users.bobba.invalid`;function Ea(n){const e=(n==null?void 0:n.code)??"";return{"auth/invalid-credential":"Wrong username or password.","auth/wrong-password":"Wrong username or password.","auth/user-not-found":"Wrong username or password.","auth/email-already-in-use":"That username is taken.","auth/weak-password":"Password must be at least 6 characters.","auth/invalid-email":"Usernames can only use letters, numbers, . _ -","auth/too-many-requests":"Too many attempts, try again in a moment.","auth/network-request-failed":"Can't reach Firebase. Check your connection / config."}[e]??(n==null?void 0:n.message)??"Something went wrong."}const mo={registering:!1};async function Zv(n,e){if(!Xv.test(n))throw new Error("Username must be 3-16 characters: letters, numbers, . _ -");mo.registering=!0;try{const t=await zp(Wi,Wu(n),e);try{return await $u(t.user.uid,n)}catch(i){throw await Zp(t.user).catch(()=>{}),i}}finally{mo.registering=!1}}async function ew(n,e){await Kp(Wi,Wu(n.trim()),e)}function go(){return Xp(Wi)}function d(n,e={},...t){const i=document.createElement(n);for(const[s,r]of Object.entries(e))r==null||r===!1||(s==="class"?i.className=String(r):s==="style"&&typeof r=="object"?Object.assign(i.style,r):s.startsWith("on")&&typeof r=="function"?i.addEventListener(s.slice(2).toLowerCase(),r):s in i?i[s]=r:i.setAttribute(s,String(r)));for(const s of t)s==null||s===!1||i.append(typeof s=="string"?document.createTextNode(s):s);return i}function Bu(n){const e=n.getContext("2d");if(!e)return n;const{width:t,height:i}=n,s=e.getImageData(0,0,t,i).data;let r=t,o=i,a=-1,l=-1;for(let f=0;f<i;f++)for(let u=0;u<t;u++)s[(f*t+u)*4+3]>8&&(u<r&&(r=u),u>a&&(a=u),f<o&&(o=f),f>l&&(l=f));if(a<0)return n;const c=document.createElement("canvas");return c.width=a-r+1,c.height=l-o+1,c.getContext("2d").drawImage(n,r,o,c.width,c.height,0,0,c.width,c.height),c}function de(n,e="ok"){const t=d("div",{class:`toast ${e}`},n);document.body.append(t),setTimeout(()=>t.classList.add("show"),10),setTimeout(()=>{t.classList.remove("show"),setTimeout(()=>t.remove(),300)},2800)}const Or=18;function Hu(n,e,t,i=!1){const s=e.profile;let r=s.gender,o=ps(s.figure||fs[r]),a=t==="shop"?"ch":"hr",l=0,c=2,f=!1,u=0,_=0,m=!1;w();function w(){const A=ps(fs[r]);for(const oe of yn)oe.required&&!o[oe.id]&&(o[oe.id]=A[oe.id])}const x=d("canvas",{class:"preview-canvas",width:64,height:110}),R=d("div",{class:"preview-name"},s.name),H=d("div",{class:"tabs"}),V=d("div",{class:"colors"}),j=d("div",{class:"grid"}),N=d("div",{class:"pager"}),G=d("div",{class:"editor-footer"}),k=d("div",{class:"gender"}),O=d("button",{class:"btn small",onclick:()=>{f=!f,u=0,O.classList.toggle("on",f),L()}},"Wave"),ee=A=>{c=(c+A+8)%8,L()};n.append(d("div",{class:"editor"},d("div",{class:"editor-left panel"},d("h2",{},t==="shop"?"Clothing shop":i?"Create your character":"Your character"),d("div",{class:"preview-box"},x,R),d("div",{class:"row center"},d("button",{class:"btn small",onclick:()=>ee(-1)},"⟲"),O,d("button",{class:"btn small",onclick:()=>ee(1)},"⟳")),k,G),d("div",{class:"editor-right panel"},H,V,j,N)));function L(){const A=++_;Dn({figure:is(o),dir:c,headDir:c,actions:f?["wav"]:["std"],frame:u}).then(oe=>{if(m||A!==_||!oe)return;const we=x.getContext("2d");we.clearRect(0,0,x.width,x.height),we.drawImage(oe,0,0)})}const te=window.setInterval(()=>{f&&(u=(u+1)%2,L())},350);function ne(){H.replaceChildren(...yn.map(A=>d("button",{class:"tab"+(A.id===a?" on":""),onclick:()=>{a=A.id,l=0,y()}},A.label)))}function Ue(){V.replaceChildren();const A=o[a],oe=A&&Du(a,A.id);if(!A||!oe||oe.colors===0)return;const we=Ou(a);for(let fe=0;fe<oe.colors;fe++)V.append(d("div",{class:"swatch-row"},oe.colors>1?d("span",{class:"swatch-label"},`Color ${fe+1}`):null,...we.map(me=>d("button",{class:"swatch"+(A.colors[fe]===me.id?" on":""),style:{background:"#"+me.hex},title:"#"+me.hex,onclick:()=>{A.colors[fe]=me.id,L(),Ue(),qe()}}))))}function Be(){const A=Vv(a,r);return t==="shop"?A.filter(oe=>!co(oe,s.owned)):A.filter(oe=>co(oe,s.owned))}function qe(){const A=yn.find(ze=>ze.id===a),oe=Be(),we=Math.max(1,Math.ceil(oe.length/Or));l>=we&&(l=we-1);const fe=oe.slice(l*Or,(l+1)*Or),me=o[a];j.replaceChildren(),t==="customize"&&!A.required&&j.append(d("button",{class:"cell none"+(me?"":" on"),onclick:()=>{delete o[a],L(),y()}},"None"));for(const ze of fe){const Re=d("div",{class:"thumb"}),Hi=d("button",{class:"cell"+((me==null?void 0:me.id)===ze.id?" on":""),title:`${A.label} #${ze.id}`,onclick:()=>{o[a]={id:ze.id,colors:nc(ze,me)},L(),y()}},Re,t==="shop"?d("span",{class:"price"},`🩸 ${ze.price}`):null);j.append(Hi);const jt={...o,[a]:{id:ze.id,colors:nc(ze,me)}};Dn({figure:is(jt),dir:2,headDir:2,headOnly:A.headOnly}).then(Ke=>{if(m||!Ke||!Re.isConnected)return;const Vi=Bu(Ke);Vi.className="thumb-canvas",Re.replaceChildren(Vi)})}oe.length===0&&j.append(d("p",{class:"muted"},t==="shop"?"You own everything in this category 🎉":"Nothing here yet — visit the shop!")),N.replaceChildren(we>1?d("div",{class:"row center"},d("button",{class:"btn small",disabled:l===0,onclick:()=>{l--,qe()}},"‹"),d("span",{class:"muted"},`${l+1} / ${we}`),d("button",{class:"btn small",disabled:l>=we-1,onclick:()=>{l++,qe()}},"›")):"")}function De(){k.replaceChildren(),t==="customize"&&k.append(d("div",{class:"row center"},...["M","F"].map(A=>d("button",{class:"btn small"+(r===A?" on":""),onclick:()=>{r!==A&&(r=A,o=ps(fs[A]),l=0,L(),y())}},A==="M"?"Boy":"Girl"))))}function Ge(){if(G.replaceChildren(),t==="customize"){G.append(d("button",{class:"btn primary",onclick:async()=>{try{await po(s,is(o),r),e.refreshHeader(),i?e.navigate("room"):de("Look saved!")}catch(fe){de(fe.message,"err")}}},i?"Enter the hotel →":"Save look"));return}const A=jv(o,s.owned),oe=A.reduce((fe,me)=>fe+me.price,0),we=oe<=s.blood;G.append(d("div",{class:"basket"},A.length===0?d("p",{class:"muted"},"Try items on, then buy the ones you like."):d("ul",{},...A.map(fe=>d("li",{},`${yn.find(me=>me.id===fe.type).label} #${fe.id} — 🩸 ${fe.price}`)))),d("button",{class:"btn primary",disabled:A.length===0||!we,onclick:async()=>{try{await ba(s,A.map(fe=>fe.key),oe),await po(s,is(o),r),e.refreshHeader(),de(`Bought ${A.length} item${A.length>1?"s":""} and put them on!`),y()}catch(fe){de(fe.message,"err")}}},A.length===0?"Buy & wear":we?`Buy & wear — 🩸 ${oe}`:`Need 🩸 ${oe-s.blood} more`))}function y(){ne(),Ue(),qe(),De(),Ge()}return y(),L(),()=>{m=!0,window.clearInterval(te)}}const Vu={standin:{id:"standin",title:"Stand-in track",artist:"swap me in src/cdplayer.ts",url:Ii("music/cd-standin.mp3")}},tw="standin",Ca=$(W,"rooms/lobby/cdplayer");function nw(n,e){return nn(Ca,t=>n(t.exists()?t.val():null),e)}const vn=n=>Ze()>=n.endsAt;function iw(n){return new Promise(e=>{const t=new Audio,i=s=>{t.removeAttribute("src"),t.load(),e(s)};t.preload="metadata",t.addEventListener("loadedmetadata",()=>i(Number.isFinite(t.duration)?Math.round(t.duration*1e3):6e4),{once:!0}),t.addEventListener("error",()=>i(6e4),{once:!0}),setTimeout(()=>i(6e4),6e3),t.src=n.url})}async function sw(n,e,t=tw){const i=Vu[t],s=await iw(i),r={by:n.uid,byName:n.name,track:i.id,title:i.title,startedAt:_t(),endsAt:Math.round(Ze()+s)};await We(Ca,r);const o=n.inventory[e];return o&&(await Te($(W,`users/${n.uid}/inventory/${e}`),{inPlayer:!0}),o.inPlayer=!0),{...r,startedAt:Ze()}}const ic=()=>On(Ca);async function rw(n){const e=n.inventory.findIndex(t=>(t==null?void 0:t.item)==="cd"&&t.inPlayer);return e<0?!1:(await Te($(W,`users/${n.uid}/inventory/${e}`),{inPlayer:null}),delete n.inventory[e].inPlayer,!0)}async function ow(n,e){return!n.inventory.some(i=>(i==null?void 0:i.item)==="cd"&&i.inPlayer)||e&&e.by===n.uid&&!vn(e)?!1:rw(n).catch(()=>!1)}const _o="bobba.cdVolume";function aw(){try{const n=Number(localStorage.getItem(_o));return Number.isFinite(n)&&localStorage.getItem(_o)!==null?Math.max(0,Math.min(1,n)):.5}catch{return .5}}class lw{constructor(e){this.onChange=e,this.audio=new Audio,this.volume=aw(),this.muted=!1,this.blocked=!1,this.key=null,this.state=null,this.audio.preload="auto",this.apply()}apply(){this.audio.volume=this.muted?0:this.volume}setVolume(e){this.volume=Math.max(0,Math.min(1,Math.round(e*100)/100)),this.volume>0&&(this.muted=!1),this.apply();try{localStorage.setItem(_o,String(this.volume))}catch{}this.onChange()}toggleMute(){this.muted=!this.muted,this.apply(),this.onChange()}get playing(){return!!this.state&&!this.audio.paused&&!this.audio.ended}get position(){return this.state?Math.max(0,(Ze()-this.state.startedAt)/1e3):0}sync(e){if(this.state=e&&!vn(e)?e:null,!this.state){this.stop();return}const t=Vu[this.state.track];if(!t)return this.stop();const i=`${this.state.by}:${this.state.startedAt}`;i!==this.key&&(this.key=i,this.audio.src=t.url,this.audio.addEventListener("loadedmetadata",()=>this.seekAndPlay(),{once:!0}),this.audio.load()),this.onChange()}seekAndPlay(){if(!this.state)return;const e=this.audio.duration,t=this.position;if(!(Number.isFinite(e)&&t>=e)){try{this.audio.currentTime=t}catch{}this.tryPlay()}}tryPlay(){this.audio.play().then(()=>{this.blocked=!1,this.onChange()},()=>{this.blocked=!0,this.onChange()})}stop(){this.state=null,this.key=null,this.audio.pause(),this.audio.removeAttribute("src"),this.audio.load(),this.onChange()}}const xt=[{id:"sample",title:"Hotel jingle (placeholder)",artist:"swap me in src/music.ts",url:Ii("music/sample.mp3")}];class cw{constructor(){this.audio=new Audio,this.current=null,this.listeners=new Set,this.audio.preload="none",this.audio.volume=.6;for(const e of["play","pause","timeupdate","loadedmetadata","ended","error","volumechange"])this.audio.addEventListener(e,()=>{e==="ended"&&this.next(),this.emit()})}subscribe(e){return this.listeners.add(e),()=>this.listeners.delete(e)}emit(){this.listeners.forEach(e=>e())}get playing(){return!this.audio.paused}get failed(){return!!this.audio.error}play(e){var t;((t=this.current)==null?void 0:t.id)!==e.id&&(this.current=e,this.audio.src=e.url),this.audio.play().catch(()=>this.emit()),this.emit()}toggle(){if(!this.current)return this.play(xt[0]);this.audio.paused?this.audio.play().catch(()=>this.emit()):this.audio.pause()}next(){if(!this.current)return;const e=xt.findIndex(t=>t.id===this.current.id);this.play(xt[(e+1)%xt.length])}seek(e){Number.isFinite(this.audio.duration)&&(this.audio.currentTime=e*this.audio.duration)}setVolume(e){this.audio.volume=Math.max(0,Math.min(1,e))}stop(){this.audio.pause(),this.audio.removeAttribute("src"),this.audio.load(),this.current=null,this.emit()}}const ke=new cw;function Hs(n){if(!Number.isFinite(n))return"0:00";const e=Math.floor(n);return`${Math.floor(e/60)}:${String(e%60).padStart(2,"0")}`}const Ti=[{id:"wave",name:"Wave",icon:"👋",desc:"Say hi.",price:0,actions:["wav"],ms:2200},{id:"smile",name:"Smile",icon:"🙂",desc:"A friendly grin.",price:0,gesture:"sml",ms:3500},{id:"sad",name:"Sad",icon:"😢",desc:"Bit of a downer.",price:0,gesture:"sad",fx:["💧"],ms:3500},{id:"jump",name:"Jump",icon:"🦘",desc:"Hop on the spot.",price:0,motion:"hop",ms:1300},{id:"angry",name:"Angry",icon:"😠",desc:"Steam comes out of your ears.",price:1,gesture:"agr",fx:["💢"],ms:3500},{id:"surprised",name:"Surprised",icon:"😮",desc:"Didn't see that coming.",price:1,motion:"hop",fx:["❗","❓"],ms:1800},{id:"sleep",name:"Sleep",icon:"😴",desc:"Eyes shut, zzz.",price:1,gesture:"eyb",fx:["💤"],ms:5e3},{id:"laugh",name:"Laugh",icon:"😂",desc:"Crack up.",price:2,gesture:"sml",motion:"bounce",fx:["😂"],ms:3500},{id:"love",name:"Love",icon:"😍",desc:"Hearts everywhere.",price:2,gesture:"sml",fx:["❤️","💕"],ms:4e3},{id:"cheer",name:"Cheer",icon:"🎉",desc:"Hands up, confetti.",price:2,actions:["wav"],motion:"hop",fx:["🎉","✨"],ms:3e3},{id:"spin",name:"Spin",icon:"🌀",desc:"Round and round.",price:2,motion:"spin",ms:2200},{id:"dance",name:"Dance",icon:"🕺",desc:"Bust a move.",price:3,motion:"dance",fx:["🎵","🎶"],ms:6e3}],ni=Object.fromEntries(Ti.map(n=>[n.id,n])),ju=n=>`emote_${n}`;function Vs(n,e){const t=ni[e];return!!t&&(t.price===0||!!n.owned[ju(e)])}const sc=[2,3,4,5,6,7,0,1],xe={crate:{id:"crate",label:"Crate",icon:"📦",w:1,h:1,height:26,color:"#9c6b3a",placeable:!0},table:{id:"table",label:"Table",icon:"🪵",w:2,h:2,height:22,color:"#7b5a36",placeable:!0},sofa:{id:"sofa",label:"Sofa",icon:"🛋️",w:2,h:1,height:26,color:"#8a3e3e",placeable:!0},plant:{id:"plant",label:"Plant",icon:"🪴",w:1,h:1,height:44,color:"#3d7a45",placeable:!0},lamp:{id:"lamp",label:"Lamp",icon:"💡",w:1,h:1,height:62,color:"#c9b25a",placeable:!0},shelf:{id:"shelf",label:"Shelf",icon:"📚",w:1,h:1,height:74,color:"#6a4a2c",placeable:!0},arcade:{id:"arcade",label:"Arcade machine",icon:"🕹️",w:1,h:1,height:78,color:"#26327a",placeable:!1},cdplayer:{id:"cdplayer",label:"CD player",icon:"💿",w:1,h:1,height:38,color:"#2d3140",placeable:!1}},dw=new Set(["arcade","cdplayer"]),Ia={floorA:"#a99a6a",floorB:"#b5a678",wall:"#b9c9cf",rug:!0,rugColor:"#c9544f"},uw=[{name:"Sand",a:"#a99a6a",b:"#b5a678"},{name:"Oak",a:"#a2713f",b:"#b0814d"},{name:"Slate",a:"#5d6b78",b:"#6a7886"},{name:"Checker",a:"#2b2b2b",b:"#d8d8d8"},{name:"Moss",a:"#5f7d4a",b:"#6c8b56"},{name:"Rose",a:"#b86a7c",b:"#c47b8c"},{name:"Ocean",a:"#3f7fa6",b:"#4a8db5"},{name:"Cream",a:"#d9ccaa",b:"#e3d8ba"}],hw=["#b9c9cf","#e8d8b0","#c9a6b8","#9fc1a0","#8aa6d6","#d9a38a","#7c7f8c","#f0f0f0"],fw=["#c9544f","#4f7bc9","#4fa86a","#c9a24f","#8a4fc9","#333333"],pw=[{label:"Small 8×8",w:8,h:8},{label:"Medium 10×10",w:10,h:10},{label:"Large 12×12",w:12,h:12},{label:"Wide 14×9",w:14,h:9},{label:"Deep 9×14",w:9,h:14}],yo=40,ht="lobby",qu=n=>`u_${n}`;function rc(){const n=[["sofa",9,1],["plant",1,9],["table",5,5],["arcade",3,0],["arcade",5,0],["cdplayer",7,0]];return{id:ht,name:"Main Lobby",ownerUid:null,ownerName:null,access:"open",w:12,h:12,theme:{...Ia},rug:{x0:3,y0:3,w:6,h:6},furni:n.map(([e,t,i],s)=>({id:`lobby${s}`,kind:e,x:t,y:i}))}}function oc(n,e){const t={...Ia,...e.theme??{}},i=Object.entries(e.furni??{}).filter(([,r])=>xe[r.kind]).map(([r,o])=>({id:r,kind:o.kind,x:o.x,y:o.y})),s=t.rug?{x0:Math.max(0,Math.floor((e.w-4)/2)),y0:Math.max(0,Math.floor((e.h-4)/2)),w:4,h:4}:null;return{id:n,name:e.name,ownerUid:e.owner,ownerName:e.ownerName,access:e.access,w:e.w,h:e.h,theme:t,rug:s,furni:i}}const ar=n=>$(W,`roomsMeta/${n}`);async function mw(n){const e=await jn(ar(n));return e.exists()?e.val():null}function gw(n,e,t){return nn(ar(n),i=>e(i.exists()?i.val():null),t)}function _w(n){return nn($(W,"roomsMeta"),e=>n(e.val()??{}))}async function yw(n){const e=qu(n.uid),t={owner:n.uid,ownerName:n.name,name:`${n.name}'s room`.slice(0,28),access:"friends",w:10,h:10,theme:{...Ia}};return await We(ar(e),t),e}const Qt=(n,e)=>Te(ar(n),e);async function vw(n,e,t,i){const s=Ci($(W,`roomsMeta/${n}/furni`));await We(s,{kind:e,x:t,y:i})}const vo=(n,e)=>On($(W,`roomsMeta/${n}/furni/${e}`));async function ww(n,e,t){return n.owner===e||n.access==="open"||n.access==="friends"&&t.has(n.owner)?!0:(await jn($(W,`roomInvites/u_${n.owner}/${e}`))).exists()}const wo=new Map;async function ac(n){const e=wo.get(n);if(e)return e;const t=await jn($(W,`profiles/${n}`));if(!t.exists())return null;const i={uid:n,name:t.val().name,figure:t.val().figure};return wo.set(n,i),i}async function bw(n){wo.delete(n.uid),await We($(W,`profiles/${n.uid}`),{name:n.name,figure:n.figure});const e=$(W,`usernames/${n.name.toLowerCase()}`);(await jn(e)).exists()||await We(e,n.uid).catch(()=>{})}function Ew(n,e=""){const t=$(W,`presence/${n.uid}`);Bs(t).remove(),We(t,{name:n.name,room:e,since:_t()})}function lc(n,e){Te($(W,`presence/${n.uid}`),{room:e}).catch(()=>{})}function Cw(n){const e=$(W,`presence/${n.uid}`);Bs(e).cancel(),On(e).catch(()=>{})}class Iw{constructor(){this.me=null,this.friends=new Map,this.requests=new Map,this.presence=new Map,this.invites=[],this.dms=new Map,this.unread=new Map,this.openChat=new Set,this.listeners=new Set,this.inviteListeners=new Set,this.dmListeners=new Set,this.unsubs=[],this.dmUnsubs=new Map,this.sessionStart=0,this.isOnline=e=>this.presence.has(e),this.friendUids=()=>new Set(this.friends.keys()),this.roomOf=e=>{var t;return((t=this.presence.get(e))==null?void 0:t.room)??""}}subscribe(e){return this.listeners.add(e),()=>this.listeners.delete(e)}onInvite(e){return this.inviteListeners.add(e),()=>this.inviteListeners.delete(e)}onDm(e){return this.dmListeners.add(e),()=>this.dmListeners.delete(e)}emit(){this.listeners.forEach(e=>e())}get totalUnread(){let e=0;return this.unread.forEach(t=>e+=t),e}start(e){this.stop(),this.me=e,this.sessionStart=Ze(),this.unsubs.push(nn($(W,`friends/${e.uid}`),async t=>{const i=Object.keys(t.val()??{}),s=new Map;await Promise.all(i.map(async r=>{const o=await ac(r);o&&s.set(r,o)})),this.friends=s;for(const r of s.keys())this.dmUnsubs.has(r)||this.watchDm(r);for(const[r,o]of this.dmUnsubs)s.has(r)||(o(),this.dmUnsubs.delete(r),this.dms.delete(r),this.unread.delete(r));this.emit()}),nn($(W,`friendRequests/${e.uid}`),async t=>{const i=Object.keys(t.val()??{}),s=new Map;await Promise.all(i.map(async r=>{const o=await ac(r);o&&s.set(r,o)})),this.requests=s,this.emit()}),nn($(W,"presence"),t=>{const i=new Map;for(const[s,r]of Object.entries(t.val()??{}))i.set(s,{name:r.name,room:r.room??""});this.presence=i,this.emit()}),ui($(W,`invites/${e.uid}`),t=>{const i=t.val();if(!i)return;const s={id:t.key,room:i.room,roomName:i.roomName,from:i.from,fromName:i.fromName,ts:i.ts};this.invites.push(s),this.emit(),typeof s.ts=="number"&&s.ts>=this.sessionStart-2e3&&this.inviteListeners.forEach(r=>r(s))}))}stop(){this.unsubs.forEach(e=>e()),this.unsubs=[],this.dmUnsubs.forEach(e=>e()),this.dmUnsubs.clear(),this.friends.clear(),this.requests.clear(),this.presence.clear(),this.invites=[],this.dms.clear(),this.unread.clear(),this.openChat.clear(),this.me=null}watchDm(e){const t=this.me,i=ui(oo($(W,`dms/${t.uid}/${e}`),ro("ts"),so(50)),s=>{const r=s.val();if(!r)return;const o=this.dms.get(e)??[];if(o.some(c=>c.id===s.key))return;const a={id:s.key,from:r.from,text:r.text,ts:typeof r.ts=="number"?r.ts:Ze()};o.push(a),this.dms.set(e,o);const l=a.ts>=this.sessionStart-2e3;l&&a.from!==t.uid&&!this.openChat.has(e)&&this.unread.set(e,(this.unread.get(e)??0)+1),this.emit(),l&&this.dmListeners.forEach(c=>c(e,a))},()=>{});this.dmUnsubs.set(e,i)}markRead(e){this.unread.delete(e)&&this.emit()}async sendRequest(e){const t=this.me,i=e.trim();if(!i)throw new Error("Type a username first.");const s=await jn($(W,`usernames/${i.toLowerCase()}`));if(!s.exists())throw new Error(`Nobody is called "${i}".`);const r=s.val();if(r===t.uid)throw new Error("That's you!");if(this.friends.has(r))throw new Error("You're already friends.");return this.requests.has(r)?(await this.accept(r),`You and ${i} are now friends.`):(await We($(W,`friendRequests/${r}/${t.uid}`),{ts:_t()}),`Friend request sent to ${i}.`)}async accept(e){const t=this.me,i=Ze();await Te($(W),{[`friends/${t.uid}/${e}`]:{since:i},[`friends/${e}/${t.uid}`]:{since:i},[`friendRequests/${t.uid}/${e}`]:null})}decline(e){return On($(W,`friendRequests/${this.me.uid}/${e}`))}async removeFriend(e){const t=this.me;await Te($(W),{[`friends/${t.uid}/${e}`]:null,[`friends/${e}/${t.uid}`]:null})}async sendDm(e,t){const i=this.me,s=Ci($(W,`dms/${i.uid}/${e}`)).key,r={from:i.uid,text:t.slice(0,200),ts:_t()};await Te($(W),{[`dms/${i.uid}/${e}/${s}`]:r,[`dms/${e}/${i.uid}/${s}`]:r})}async inviteToRoom(e,t,i){const s=this.me,r=Ci($(W,`invites/${e}`)).key;await Te($(W),{[`roomInvites/${t}/${e}`]:!0,[`invites/${e}/${r}`]:{room:t,roomName:i,from:s.uid,fromName:s.name,ts:_t()}})}async dismissInvite(e){this.invites=this.invites.filter(t=>t.id!==e),this.emit(),await On($(W,`invites/${this.me.uid}/${e}`)).catch(()=>{})}roomCounts(){const e=new Map;return this.presence.forEach(t=>t.room&&e.set(t.room,(e.get(t.room)??0)+1)),e}}const q=new Iw,mn=20,nt=18,Sw={id:"snake",title:"Snake",icon:"🐍",blurb:"Eat, grow, don't bite yourself. Arrow keys or WASD.",mount(n){const e=d("canvas",{class:"arcade-canvas",width:mn*nt,height:mn*nt}),t=d("div",{class:"arcade-score"},"Score: 0"),i=d("div",{class:"hint"},"Press any arrow key to start");n.append(e,t,i);const s=e.getContext("2d");let r=[],o={x:1,y:0},a=null,l={x:10,y:10},c=0,f=!1,u=!1,_=0,m=0;function w(){r=[{x:5,y:10},{x:4,y:10},{x:3,y:10}],o={x:1,y:0},a=null,c=0,u=!1,x(),t.textContent=`Score: 0   Best: ${_}`}function x(){do l={x:Math.floor(Math.random()*mn),y:Math.floor(Math.random()*mn)};while(r.some(N=>N.x===l.x&&N.y===l.y))}function R(){a&&(o=a,a=null);const N={x:r[0].x+o.x,y:r[0].y+o.y};if(N.x<0||N.y<0||N.x>=mn||N.y>=mn||r.some(G=>G.x===N.x&&G.y===N.y)){u=!0,f=!1,_=Math.max(_,c),t.textContent=`Score: ${c}   Best: ${_}`,i.textContent="Game over. Press any arrow key to play again.",H();return}r.unshift(N),N.x===l.x&&N.y===l.y?(c++,t.textContent=`Score: ${c}   Best: ${_}`,x()):r.pop(),H()}function H(){s.fillStyle="#0b1a24",s.fillRect(0,0,e.width,e.height),s.fillStyle="#d32121",s.fillRect(l.x*nt+3,l.y*nt+3,nt-6,nt-6),r.forEach((N,G)=>{s.fillStyle=u?"#777":G===0?"#7be37b":"#3fae5a",s.fillRect(N.x*nt+1,N.y*nt+1,nt-2,nt-2)})}const V={ArrowUp:{x:0,y:-1},w:{x:0,y:-1},W:{x:0,y:-1},ArrowDown:{x:0,y:1},s:{x:0,y:1},S:{x:0,y:1},ArrowLeft:{x:-1,y:0},a:{x:-1,y:0},A:{x:-1,y:0},ArrowRight:{x:1,y:0},d:{x:1,y:0},D:{x:1,y:0}},j=N=>{const G=V[N.key];if(!G)return;N.preventDefault(),f||((u||r.length===0)&&w(),f=!0,i.textContent="",clearInterval(m),m=window.setInterval(R,110));const k=a??o;(G.x!==-k.x||G.y!==-k.y)&&(a=G)};return window.addEventListener("keydown",j),w(),H(),()=>{clearInterval(m),window.removeEventListener("keydown",j)}}},cc=(n,e,t,i)=>({id:n,title:e,icon:t,blurb:i,comingSoon:!0,mount:()=>()=>{}}),Tw=[Sw,cc("blood-catch","Blood Catch","🩸","Catch the falling drops."),cc("lobby-pong","Lobby Pong","🏓","Two players, one ball.")];let Dr=null;function kw(){if(Dr)return;let n=null;const e=d("div",{class:"arcade-body"}),t=d("div",{class:"arcade-title"},"🕹️ Arcade"),i=d("button",{class:"btn small hidden",onclick:()=>l()},"← Games"),s=d("button",{class:"btn small",onclick:()=>f()},"Close"),r=d("div",{class:"arcade-screen"},d("div",{class:"arcade-head"},t,d("div",{class:"row"},i,s)),e),o=d("div",{class:"arcade-overlay",onmousedown:_=>{_.target===o&&f()}},r);Dr=o,document.body.append(o);function a(){n==null||n(),n=null,e.replaceChildren()}function l(){a(),t.textContent="🕹️ Arcade",i.classList.add("hidden"),e.append(d("div",{class:"arcade-list"},...Tw.map(_=>d("button",{class:"arcade-card"+(_.comingSoon?" soon":""),disabled:!!_.comingSoon,onclick:()=>c(_)},d("div",{class:"arcade-icon"},_.icon),d("div",{class:"arcade-name"},_.title),d("div",{class:"hint"},_.comingSoon?"Coming soon":_.blurb)))))}function c(_){a(),t.textContent=`${_.icon} ${_.title}`,i.classList.remove("hidden"),n=_.mount(e,{close:f})}function f(){a(),window.removeEventListener("keydown",u),o.remove(),Dr=null}const u=_=>{_.key==="Escape"&&f()};window.addEventListener("keydown",u),o.addEventListener("arcade-close",f),l()}let ii=null;function rs(){ii==null||ii.remove(),ii=null}function Gu(n,e,t){rs();const i=d("div",{class:"ctx-menu"},d("div",{class:"ctx-head"},"Choose Option"),...t.map(r=>d("div",{class:"ctx-opt",onclick:()=>{rs(),r.action()}},d("span",{class:r.danger?"ctx-danger":""},r.label),r.target?d("span",{class:"ctx-target"}," "+r.target):null)),d("div",{class:"ctx-opt",onclick:rs},d("span",{class:"ctx-danger"},"Cancel")));document.body.append(i);const s=i.getBoundingClientRect();i.style.left=Math.min(n,window.innerWidth-s.width-4)+"px",i.style.top=Math.min(e,window.innerHeight-s.height-4)+"px",ii=i,setTimeout(()=>{const r=o=>{o instanceof KeyboardEvent&&o.key!=="Escape"||o instanceof MouseEvent&&i.contains(o.target)||(rs(),window.removeEventListener("mousedown",r),window.removeEventListener("keydown",r),window.removeEventListener("blur",r))};window.addEventListener("mousedown",r),window.addEventListener("keydown",r),window.addEventListener("blur",r)},0)}function Rw(n){const e=Math.max(1,Math.ceil(n/6e4));return e>=60?`${Math.floor(e/60)}h ${e%60}m`:`${e}m`}function Aw(n,e,t){const i=e.profile;let s="inventory",r=null,o=null,a=null;const l=d("div",{class:"osrs-tabs"}),c=d("div",{class:"osrs-body"}),f=d("aside",{class:"osrs-panel"},l,c);n.append(f);function u(){const j=(N,G,k)=>d("button",{class:"osrs-tab"+(s===N?" on":""),title:k,onclick:()=>{s=N,R()}},G);l.replaceChildren(j("inventory","🎒","Inventory"),j("emotes","😀","Emotes"),j("music","♪","Music"),...t.roomTab?[j("room",t.roomTab.icon,t.roomTab.title)]:[])}function _(){const j=d("div",{class:"emote-grid"},...Ti.map(N=>{const G=Vs(i,N.id);return d("button",{class:"emote-cell"+(G?"":" locked"),title:G?`${N.name}: ${N.desc}  (/${N.id})`:`${N.name}: locked. Buy it in the shop for ${N.price} drops.`,onclick:()=>t.onEmote(N.id)},d("span",{class:"emote-icon"},N.icon),d("span",{class:"emote-name"},N.name),G?null:d("span",{class:"emote-lock"},"🔒"))}));c.replaceChildren(d("div",{class:"osrs-title"},"Emotes"),j,d("div",{class:"inv-foot"},d("div",{class:"hint"},"Click one to perform it, or type /name in chat (like /dance). Walking cancels it."),Ti.some(N=>!Vs(i,N.id))?d("button",{class:"btn small",onclick:()=>e.navigate("shop")},"Get more in the shop"):null))}function m(){const j=r!==null?i.inventory[r]:null;return j?Si[j.item].useOnObject?"Now click the CD player in the lobby.":"Now click a player to use it on them.":"Click an item, then click what to use it on: the knife on a player, the CD on the CD player."}function w(){o==null||o(),o=null;const j=d("div",{class:"inv-grid"});for(let G=0;G<va;G++){const k=i.inventory[G],O=k?Si[k.item]:null,ee=!!(k!=null&&k.inPlayer),L=d("div",{class:"inv-slot"+(r===G?" selected":"")+(O?" filled":"")+(ee?" loaned":""),title:O?ee?`${O.name} (in the player)`:O.name:"",onclick:()=>{if(O){if(ee)return t.say(`Your ${O.name} is in the player. It'll be back when it's done.`,"warn");H(r===G?null:G)}},oncontextmenu:te=>{te.preventDefault(),O&&Gu(te.clientX,te.clientY,[...ee?[]:[{label:r===G?"Cancel use":"Use",target:O.name,action:()=>H(r===G?null:G)}],{label:"Examine",target:O.name,action:()=>t.say(ee?`${O.examine} (It's in the player right now.)`:O.examine)}])}},O?d("img",{src:O.icon,alt:O.name,draggable:!1}):null,k&&k.qty>1?d("span",{class:"qty"},String(k.qty)):null);j.append(L)}const N=fo(i);c.replaceChildren(d("div",{class:"osrs-title"},"Inventory"),j,d("div",{class:"inv-foot"},d("div",{class:"blood-line"},d("img",{src:Bi,alt:"",class:"blood-ico"}),` ${i.blood} drop${i.blood===1?"":"s"} of blood`),d("div",{class:"stab-status "+(N?"ready":"used")},N?"Daily stab: ready":`Daily stab used. Again in ${Rw(Uu())}`),d("div",{class:"hint"},m())))}function x(){if(o==null||o(),o=null,!i.owned[ho]){c.replaceChildren(d("div",{class:"osrs-title"},"Music"),d("div",{class:"music-locked"},d("p",{},"🔒 You don't have a jukebox pass."),d("p",{class:"hint"},"Buy music access in the shop to stream tracks while you hang out."),d("button",{class:"btn small",onclick:()=>e.navigate("shop")},"Open shop")));return}const j=d("div",{class:"track-list"}),N=d("div",{class:"now"}),G=d("button",{class:"btn small",onclick:()=>ke.toggle()}),k=d("input",{type:"range",min:0,max:1e3,value:0,class:"seek",oninput:()=>ke.seek(Number(k.value)/1e3)}),O=d("span",{class:"time"}),ee=d("input",{type:"range",min:0,max:100,value:Math.round(ke.audio.volume*100),class:"vol",oninput:()=>ke.setVolume(Number(ee.value)/100)}),L=()=>{const te=ke.audio;j.replaceChildren(...xt.map(ne=>{var Ue,Be;return d("div",{class:"track"+(((Ue=ke.current)==null?void 0:Ue.id)===ne.id?" on":""),onclick:()=>ke.play(ne)},d("span",{class:"track-ico"},((Be=ke.current)==null?void 0:Be.id)===ne.id&&ke.playing?"▶":"♪"),d("div",{},d("div",{class:"track-title"},ne.title),d("div",{class:"hint"},ne.artist)))})),N.textContent=ke.failed?"Couldn't load that track.":ke.current?`${ke.playing?"Now playing":"Paused"}: ${ke.current.title}`:"Pick a track to start streaming.",G.textContent=ke.playing?"⏸ Pause":"▶ Play",document.activeElement!==k&&Number.isFinite(te.duration)&&te.duration>0&&(k.value=String(Math.round(te.currentTime/te.duration*1e3))),O.textContent=`${Hs(te.currentTime)} / ${Hs(te.duration)}`};o=ke.subscribe(L),L(),c.replaceChildren(d("div",{class:"osrs-title"},"Music"),j,N,d("div",{class:"row center"},G),k,O,d("label",{class:"hint"},"Volume ",ee))}function R(){o==null||o(),o=null,a==null||a(),a=null,u(),s==="inventory"?w():s==="emotes"?_():s==="room"&&t.roomTab?(c.replaceChildren(),a=t.roomTab.mount(c)):x()}function H(j){r=j,t.onSelect(j),s==="inventory"&&w()}R();const V=window.setInterval(()=>{s==="inventory"&&w()},6e4);return{setSelected(j){r=j,s==="inventory"&&w()},refresh:R,dispose(){window.clearInterval(V),o==null||o(),a==null||a(),f.remove()}}}const dc={open:"Open to all",friends:"Friends only",invite:"Invite only"};function xw(n,e,t){const i=new Set,s=d("div",{class:"roompanel"});n.append(s);const r=(u,_)=>u.then(()=>_&&de(_),()=>de("The hotel refused that change.","err"));function o(){const u=t.getDef();if(!t.isOwner()){s.replaceChildren(d("div",{class:"osrs-title"},"Room"),d("div",{class:"inv-foot"},d("div",{},u.name),d("div",{class:"hint"},`Owned by ${u.ownerName??"the hotel"}`),d("div",{class:"hint"},dc[u.access])));return}const _=d("input",{type:"text",value:u.name,maxLength:28,class:"mini-input"}),m=t.getTool();s.replaceChildren(d("div",{class:"osrs-title"},"My room"),d("div",{class:"rp-sec"},d("div",{class:"rp-label"},"Name"),d("div",{class:"row"},_,d("button",{class:"btn small",onclick:()=>{const w=_.value.trim();if(w.length<3)return de("Room names need 3+ characters.","err");r(Qt(u.id,{name:w}),"Renamed.")}},"Save"))),d("div",{class:"rp-sec"},d("div",{class:"rp-label"},"Who can come in"),d("div",{class:"rp-chips"},...["open","friends","invite"].map(w=>d("button",{class:"chip"+(u.access===w?" on":""),onclick:()=>void r(Qt(u.id,{access:w}))},dc[w])))),d("div",{class:"rp-sec"},d("div",{class:"rp-label"},"Size"),d("div",{class:"rp-chips"},...pw.map(w=>d("button",{class:"chip"+(u.w===w.w&&u.h===w.h?" on":""),onclick:()=>{const x={w:w.w,h:w.h};for(const R of u.furni){const H=xe[R.kind];(R.x+H.w>w.w||R.y+H.h>w.h)&&(x[`furni/${R.id}`]=null)}r(Qt(u.id,x))}},w.label)))),d("div",{class:"rp-sec"},d("div",{class:"rp-label"},"Floor"),d("div",{class:"rp-chips"},...uw.map(w=>d("button",{class:"chip swatch2"+(u.theme.floorA===w.a&&u.theme.floorB===w.b?" on":""),title:w.name,style:{background:`linear-gradient(135deg, ${w.a} 50%, ${w.b} 50%)`},onclick:()=>void r(Qt(u.id,{"theme/floorA":w.a,"theme/floorB":w.b}))}))),d("div",{class:"rp-label"},"Walls"),d("div",{class:"rp-chips"},...hw.map(w=>d("button",{class:"chip swatch2"+(u.theme.wall===w?" on":""),style:{background:w},onclick:()=>void r(Qt(u.id,{"theme/wall":w}))}))),d("div",{class:"rp-label"},"Rug"),d("div",{class:"rp-chips"},d("button",{class:"chip"+(u.theme.rug?" on":""),onclick:()=>void r(Qt(u.id,{"theme/rug":!u.theme.rug}))},u.theme.rug?"On":"Off"),...fw.map(w=>d("button",{class:"chip swatch2"+(u.theme.rugColor===w?" on":""),style:{background:w},onclick:()=>void r(Qt(u.id,{"theme/rug":!0,"theme/rugColor":w}))})))),d("div",{class:"rp-sec"},d("div",{class:"rp-label"},`Furniture (${u.furni.length}/${yo})`),d("div",{class:"rp-chips"},...Object.values(xe).filter(w=>w.placeable).map(w=>d("button",{class:"chip"+(m===w.id?" on":""),title:`${w.label} (${w.w}×${w.h})`,onclick:()=>{t.setTool(m===w.id?null:w.id),o()}},`${w.icon} ${w.label}`)),d("button",{class:"chip"+(m==="pickup"?" on":""),onclick:()=>{t.setTool(m==="pickup"?null:"pickup"),o()}},"🧹 Pick up")),d("div",{class:"hint"},m?"Click in the room to use the tool. Esc to stop.":"Pick a piece, then click a tile in the room."),u.furni.length?d("button",{class:"btn small",onclick:()=>{if(confirm("Remove all furniture from this room?"))for(const w of u.furni)vo(u.id,w.id)}},"Clear room"):null),a=d("div",{},l()))}let a=null;function l(){const u=t.getDef(),_=[...q.friends.values()].sort((m,w)=>Number(q.isOnline(w.uid))-Number(q.isOnline(m.uid))||m.name.localeCompare(w.name));return d("div",{class:"rp-sec"},d("div",{class:"rp-label"},"Invite friends"),_.length===0?d("div",{class:"hint"},"Add friends in the Friends panel first."):d("div",{class:"invite-list"},..._.map(m=>d("div",{class:"invite-row"},d("span",{class:"dot "+(q.isOnline(m.uid)?"on":"")}),d("span",{class:"invite-name"},m.name),d("button",{class:"btn small",disabled:i.has(m.uid),onclick:()=>{i.add(m.uid),q.inviteToRoom(m.uid,u.id,u.name).then(()=>de(`Invited ${m.name}.`),()=>{i.delete(m.uid),de("Couldn't send that invite.","err")}).finally(o)}},i.has(m.uid)?"Invited ✓":"Invite")))))}o();const c=t.onDefChange(o),f=q.subscribe(()=>{t.isOwner()&&a&&a.replaceChildren(l())});return()=>{c(),f(),s.remove()}}const st=64,$e=32,Xn=120,Zn=480,Pw=6500,uc=100,Mr=700,hc=750,bo=[[0,-1,0],[1,-1,1],[1,0,2],[1,1,3],[0,1,4],[-1,1,5],[-1,0,6],[-1,-1,7]],it=(n,e)=>({x:(n-e)*(st/2),y:(n+e)*($e/2)}),fc=(n,e)=>Math.max(Math.abs(n.x-e.x),Math.abs(n.y-e.y));function os(n,e){var s;const t=Math.sign(e.x-n.x),i=Math.sign(e.y-n.y);return((s=bo.find(r=>r[0]===t&&r[1]===i))==null?void 0:s[2])??2}function He(n,e){const t=parseInt(n.slice(1),16),i=s=>Math.max(0,Math.min(255,Math.round(s*e)));return`rgb(${i(t>>16)},${i(t>>8&255)},${i(t&255)})`}function zu(n){const e=new Image;return e.src=n,e}const Nw=zu(Si.knife.icon),Ow=zu(Bi),as=94;function Dw(n,e,t){const i=e.profile,s=new Map,r=[];let o=!1,a=!1,l=rc();const c=new Set;let f=null,u=null,_=[],m=[],w=null,x=null,R=null,H=!1,V=null;const j=[],N=[],G=[],k=[],O=[],ee=()=>l.ownerUid===i.uid,L=d("canvas",{class:"room-canvas"}),te=d("div",{class:"chat-log"}),ne=d("div",{class:"online"}),Ue=d("div",{class:"room-title"},t===ht?"Main Lobby":"Loading room…"),Be=d("div",{class:"action-hint hidden"}),qe=d("input",{class:"chat-input",type:"text",maxLength:uc,placeholder:"Click to chat — try /dance, or click the floor to walk",autocomplete:"off"}),De=d("div",{class:"stage"},L,ne,te,Be,Ue),Ge=d("div",{class:"side-host"});n.append(d("div",{class:"room"},d("div",{class:"room-main"},De,Ge),d("form",{class:"chat-bar",onsubmit:h=>{h.preventDefault(),ah()}},qe,d("button",{class:"btn primary",type:"submit"},"Send"))));const y=L.getContext("2d");function A(h,p="game"){var g;for(te.append(d("div",{class:`line sys ${p}`},h));te.children.length>60;)(g=te.firstElementChild)==null||g.remove();te.scrollTop=te.scrollHeight}const oe=Aw(Ge,e,{say:A,onSelect:h=>{x=h,R=null,me()},onEmote:h=>Oa(h),roomTab:t===ht?void 0:{icon:"🏠",title:"Room",mount:h=>xw(h,e,{getDef:()=>l,isOwner:ee,getTool:()=>V,setTool:p=>{V=p,me()},onDefChange:p=>(we.add(p),()=>we.delete(p))})}}),we=new Set,fe=()=>x!==null&&i.inventory[x]?Si[i.inventory[x].item]:null;function me(){var g;const h=fe();let p="";V&&ee()?p=V==="pickup"?"Pick up furniture: click it":`Place ${((g=xe[V])==null?void 0:g.label)??V}: click a tile`:h!=null&&h.useOnObject?p=w&&w.kind===h.useOnObject?`Use ${h.name} → ${xe[w.kind].label}`:`Use ${h.name} →`:h?p=u&&u.uid!==i.uid?`Use ${h.name} → ${u.name}`:`Use ${h.name} →`:u?p=u.name:w&&w.kind&&(p=xe[w.kind].label),Be.textContent=p,Be.classList.toggle("hidden",!p),L.style.cursor=h||V?"crosshair":"pointer"}function ze(){c.clear();for(const h of l.furni){const p=xe[h.kind];for(let g=0;g<p.w;g++)for(let v=0;v<p.h;v++)c.add(`${h.x+g},${h.y+v}`)}}const Re=(h,p)=>h>=0&&p>=0&&h<l.w&&p<l.h&&!c.has(`${h},${p}`);function Hi(h,p){if(!Re(p.x,p.y)||h.x===p.x&&h.y===p.y)return[];const g=b=>b.y*l.w+b.x,v=new Map([[g(h),null]]),E=[h];for(let b=0;b<E.length;b++){const T=E[b];if(T.x===p.x&&T.y===p.y)break;for(const[P,M]of bo){const z=T.x+P,U=T.y+M;!Re(z,U)||v.has(U*l.w+z)||P!==0&&M!==0&&(!Re(T.x+P,T.y)||!Re(T.x,T.y+M))||(v.set(U*l.w+z,T),E.push({x:z,y:U}))}}if(!v.has(g(p)))return[];const I=[];for(let b=p;b&&!(b.x===h.x&&b.y===h.y);b=v.get(g(b))??null)I.unshift(b);return I}let jt={x:0,y:0},Ke=document.createElement("canvas");function Vi(){const h=l.w,p=l.h,g=l.theme,v=-p*(st/2)-8,E=h*(st/2)+8,I=-Xn-8,b=(h+p)*($e/2)+20,T=document.createElement("canvas");T.width=E-v,T.height=b-I;const P=T.getContext("2d");P.translate(-v,-I);const M=(ie,X,se)=>{P.beginPath(),ie.forEach((K,ae)=>ae?P.lineTo(K.x,K.y):P.moveTo(K.x,K.y)),P.closePath(),P.fillStyle=X,P.fill(),se&&(P.strokeStyle=se,P.lineWidth=1,P.stroke())},z=it(0,0),U=it(0,p),D=it(h,0);M([z,D,{x:D.x,y:D.y-Xn},{x:z.x,y:z.y-Xn}],He(g.wall,1),He(g.wall,.8)),M([z,U,{x:U.x,y:U.y-Xn},{x:z.x,y:z.y-Xn}],He(g.wall,.88),He(g.wall,.8)),M([z,D,{x:D.x,y:D.y-10},{x:z.x,y:z.y-10}],He(g.wall,.72)),M([z,U,{x:U.x,y:U.y-10},{x:z.x,y:z.y-10}],He(g.wall,.64));const J=it(h,p);M([U,J,{x:J.x,y:J.y+8},{x:U.x,y:U.y+8}],He(g.floorA,.6)),M([D,J,{x:J.x,y:J.y+8},{x:D.x,y:D.y+8}],He(g.floorA,.45));for(let ie=0;ie<p;ie++)for(let X=0;X<h;X++){const se=it(X,ie),K=l.rug,ae=!!K&&X>=K.x0&&X<K.x0+K.w&&ie>=K.y0&&ie<K.y0+K.h,Ae=ae&&!!K&&(X===K.x0||X===K.x0+K.w-1||ie===K.y0||ie===K.y0+K.h-1),Yt=ae?He(g.rugColor,Ae?.88:1):(X+ie)%2?g.floorA:g.floorB;M([{x:se.x,y:se.y},{x:se.x+st/2,y:se.y+$e/2},{x:se.x,y:se.y+$e},{x:se.x-st/2,y:se.y+$e/2}],Yt,"rgba(0,0,0,0.12)")}return jt={x:-v,y:-I},T}function ji(h){l=h,ze(),Ke=Vi(),Sa(),Ue.textContent=l.ownerName?`${l.name} · by ${l.ownerName}`:l.name,we.forEach(p=>p())}let S=1,qi=0,Gi=0;function Sa(){const h=window.devicePixelRatio||1,p=De.clientWidth,g=De.clientHeight;L.width=Math.floor(p*h),L.height=Math.floor(g*h),L.style.width=p+"px",L.style.height=g+"px";const v=Math.min(p/Ke.width,g/(Ke.height+70));S=v>=1?Math.floor(v*2)/2:v,S=Math.max(.4,Math.min(S,2)),qi=Math.round((p-Ke.width*S)/2+jt.x*S),Gi=Math.round((g-Ke.height*S)/2+jt.y*S+24)}const Ta=new ResizeObserver(Sa);Ta.observe(De);const qn=h=>({x:qi+h.x*S,y:Gi+h.y*S});function lr(h,p){const g=(h-qi)/S/(st/2),v=(p-Gi)/S/($e/2),E=Math.floor((g+v)/2),I=Math.floor((v-g)/2);return E>=0&&I>=0&&E<l.w&&I<l.h?{x:E,y:I}:null}function zi(h,p,g){let v=null;for(const E of h)p>=E.x0&&p<=E.x1&&g>=E.y0&&g<=E.y1&&(!v||E.depth>v.depth)&&(v=E);return v}const cr=(h,p)=>{const g=zi(_,h,p);return g?s.get(g.id)??null:null},dr=h=>{const p=L.getBoundingClientRect();return{x:h.clientX-p.left,y:h.clientY-p.top}},ka=h=>l.furni.find(p=>{const g=xe[p.kind];return h.x>=p.x&&h.x<p.x+g.w&&h.y>=p.y&&h.y<p.y+g.h});L.addEventListener("mousemove",h=>{const p=dr(h);f=lr(p.x,p.y);const g=cr(p.x,p.y),v=g?null:zi(m,p.x,p.y);(g!==u||(v==null?void 0:v.id)!==(w==null?void 0:w.id))&&(u=g,w=v,me())}),L.addEventListener("mouseleave",()=>{f=null,u=null,w=null,me()}),L.addEventListener("click",h=>{const p=dr(h),g=cr(p.x,p.y),v=lr(p.x,p.y);if(V&&ee()){if(!v)return;if(V==="pickup"){const b=ka(v);b&&vo(l.id,b.id).catch(()=>de("Couldn't pick that up","err"))}else Qu(V,v);return}const E=fe();if((E==null?void 0:E.useOnPlayer)==="stab"){g&&g.uid!==i.uid?ur(g.uid):g?A("You can't stab yourself.","warn"):(qt(),v&&(R=null,zn(v)));return}const I=zi(m,p.x,p.y);if(E!=null&&E.useOnObject){I&&!g&&I.kind===E.useOnObject?Ua(I.id):(qt(),I&&!g?A("Nothing interesting happens.","warn"):v&&Re(v.x,v.y)&&(R=null,zn(v)));return}if(I&&!g){I.kind==="cdplayer"?Fa():Da(I.id);return}v&&Re(v.x,v.y)&&(R=null,zn(v))}),L.addEventListener("contextmenu",h=>{h.preventDefault();const p=dr(h),g=cr(p.x,p.y),v=lr(p.x,p.y),E=fe(),I=ss(i.inventory,"knife")>=0,b=[];g&&g.uid!==i.uid&&((E==null?void 0:E.useOnPlayer)==="stab"&&b.push({label:`Use ${E.name} →`,target:g.name,action:()=>ur(g.uid)}),I&&(E==null?void 0:E.useOnPlayer)!=="stab"&&b.push({label:"Stab",target:g.name,danger:!0,action:()=>ur(g.uid)}),b.push({label:"Examine",target:g.name,action:()=>A(`${g.name}: a fellow hotel guest.`)}),q.friends.has(g.uid)?b.push({label:"Message",target:g.name,action:()=>window.dispatchEvent(new CustomEvent("open-chat",{detail:g.uid}))}):b.push({label:"Add friend",target:g.name,action:()=>q.sendRequest(g.name).then(M=>A(M),M=>A(M.message,"warn"))}));const T=zi(m,p.x,p.y);(T==null?void 0:T.kind)==="arcade"&&b.push({label:"Play",target:"Arcade machine",action:()=>Da(T.id)}),(T==null?void 0:T.kind)==="cdplayer"&&((E==null?void 0:E.useOnObject)==="cdplayer"&&b.push({label:`Use ${E.name} →`,target:"CD player",action:()=>Ua(T.id)}),b.push({label:"Volume",target:"CD player",action:()=>Fa()}),b.push({label:"Examine",target:"CD player",action:()=>A(Me&&!vn(Me)?`The CD player is playing "${Me.title}", put in by ${Me.byName}.`:"A chunky CD player. It's empty. Use a CD on it.")}));const P=v?ka(v):void 0;P&&ee()&&P.kind!=="arcade"&&b.push({label:"Pick up",target:xe[P.kind].label,action:()=>void vo(l.id,P.id).catch(()=>{})}),v&&Re(v.x,v.y)&&b.push({label:"Walk here",action:()=>{R=null,zn(v)}}),Gu(h.clientX,h.clientY,b)});function qt(){x=null,oe.setSelected(null),me()}const Ra=h=>{h.key==="Escape"&&(x!==null&&qt(),Ji(),V&&(V=null,me(),we.forEach(p=>p())))};window.addEventListener("keydown",Ra);function Qu(h,p){const g=xe[h];if(!(!g||!g.placeable)){if(l.furni.length>=yo)return A(`That's the limit: ${yo} pieces per room.`,"warn");for(let v=0;v<g.w;v++)for(let E=0;E<g.h;E++){const I=p.x+v,b=p.y+E;if(!Re(I,b))return A("There's no room for that there.","warn");for(const T of s.values()){const P=tt(T);if(P.x===I&&P.y===b)return A("Someone is standing there.","warn")}}vw(l.id,h,p.x,p.y).catch(()=>A("Couldn't place that.","warn"))}}function Aa(h,p){var v;const g={x:p.x??1,y:p.y??1};return{uid:h,name:p.name??"?",figure:p.figure??i.figure,dir:p.dir??2,from:g,to:g,stepStart:0,path:[],dest:g,lastEmoteTs:((v=p.emote)==null?void 0:v.ts)??0}}const Ki=(h,p)=>p-h.stepStart<Zn&&(h.from.x!==h.to.x||h.from.y!==h.to.y);function tt(h){return h.path.length||performance.now()-h.stepStart<Zn?h.to:h.from}function xa(h,p){const g=tt(h);h.dest=p,h.path=Hi(g,p),h.path.length&&(h.emote=void 0)}const Gn=()=>s.get(i.uid);function zn(h){const p=Gn();p&&(xa(p,h),p.path.length!==0&&Te($(W,`rooms/${t}/players/${i.uid}`),{x:h.x,y:h.y,dir:os(tt(p),p.path[0])}).catch(console.warn))}function Ju(h,p){if(!(p-h.stepStart<Zn)&&(h.from=h.to,h.path.length)){const g=h.path.shift();h.dir=os(h.from,g),h.to=g,h.stepStart=p}}function Pa(h,p){const g=Ki(h,p)?(p-h.stepStart)/Zn:1;return{x:h.from.x+(h.to.x-h.from.x)*g,y:h.from.y+(h.to.y-h.from.y)*g}}const Ct=(h,p)=>{const g=Pa(h,p),v=it(g.x,g.y);return qn({x:v.x,y:v.y+$e/2})};function Na(h,p){h.emote={def:p,start:performance.now(),lastFx:0}}function Oa(h){const p=ni[h],g=Gn();if(!(!p||!g)){if(!Vs(i,h))return A(`You haven't unlocked ${p.name}. You can buy it in the shop.`,"warn");g.path=[],Na(g,p),Te($(W,`rooms/${t}/players/${i.uid}`),{emote:{id:h,ts:_t()}}).catch(()=>A("Your emote didn't go through.","warn"))}}function ur(h){const p=s.get(h);if(!(!p||h===i.uid)){if(ss(i.inventory,"knife")<0)return A("You need a knife for that.","warn");if(!fo(i)){const g=Math.max(1,Math.ceil(Uu()/6e4));return A(`You've already drawn blood today. Your knife will thirst again in ${g>=60?`${Math.floor(g/60)}h ${g%60}m`:`${g}m`}.`,"warn")}R={type:"stab",uid:h,since:performance.now(),lastTry:0},qt(),fc(tt(Gn()),tt(p))>1&&A(`You walk towards ${p.name}…`)}}function Da(h){R={type:"arcade",fid:h,since:performance.now(),lastTry:0}}function Ma(h,p,g,v){const E=tt(h);if(fc(E,p)<=1)return"arrived";if(g-v.lastTry<450)return"walking";v.lastTry=g;let I=null,b=1/0;for(const[T,P]of bo){const M={x:p.x+T,y:p.y+P};if(!Re(M.x,M.y))continue;const z=M.x===E.x&&M.y===E.y?0:Hi(E,M).length||1/0;z<b&&(I=M,b=z)}return!I||b===1/0?"unreachable":(zn(I),"walking")}function Xu(h){const p=Gn();if(!R||!p||H)return;if(h-R.since>2e4)return R=null,A("You lose track of what you were doing.","warn");if(p.path.length||Ki(p,h))return;if(R.type==="stab"){const I=s.get(R.uid);if(!I)return R=null,A("They've left the room.","warn");const b=Ma(p,tt(I),h,R);if(b==="unreachable")return R=null,A("You can't reach them.","warn");if(b==="arrived"){const T=R.uid;R=null,sh(T)}return}const g=R,v=l.furni.find(I=>I.id===g.fid);if(!v){R=null;return}const E=Ma(p,{x:v.x,y:v.y},h,g);if(E==="unreachable")return R=null,A("You can't get to it.","warn");E==="arrived"&&(R=null,p.dir=os(tt(p),{x:v.x,y:v.y}),Te($(W,`rooms/${t}/players/${i.uid}`),{dir:p.dir}).catch(()=>{}),g.type==="cd"?eh():kw())}let Me=null,hr=!1,fr=!1,fn=null,Gt=null;const zt=[];let La=0;const Yi=()=>!!Me&&!vn(Me),Le={title:d("div",{class:"cd-title"}),status:d("div",{class:"hint"}),fill:d("div",{class:"cd-fill"}),time:d("span",{class:"hint"}),vol:d("span",{class:"cd-vol"}),mute:d("button",{class:"btn small",title:"Mute",onclick:()=>Ye.toggleMute()}),eject:d("button",{class:"btn small danger",onclick:()=>void th()},"⏏ Take my CD back")};function Qi(){if(!Gt)return;const h=Me&&!vn(Me)?Me:null;Le.title.textContent=h?`♪ ${h.title}`:"Nothing playing",Le.status.textContent=h?`Put in by ${h.byName}`:"Use a CD from your inventory on the player.";const p=h?h.endsAt-h.startedAt:0,g=h?Math.min(p,Ze()-h.startedAt):0;Le.fill.style.width=p?`${Math.max(0,Math.min(100,g/p*100))}%`:"0%",Le.time.textContent=h?`${Hs(g/1e3)} / ${Hs(p/1e3)}`:"",Le.vol.textContent=Ye.muted?"muted":`${Math.round(Ye.volume*100)}%`,Le.mute.textContent=Ye.muted||Ye.volume===0?"🔇":"🔊",Le.eject.classList.toggle("hidden",!(h&&h.by===i.uid))}function Zu(){Qi(),Ye.blocked&&!fn&&(A("Click anywhere to hear the CD player (your browser holds back sound until you interact with the page).","warn"),fn=()=>{fn=null,Ye.tryPlay()},window.addEventListener("pointerdown",fn,{once:!0}))}const Ye=new lw(Zu);function Ji(){Gt&&(window.clearInterval(Gt.timer),Gt.el.remove(),Gt=null)}function Fa(){if(Gt)return Ji();const h=g=>Ye.setVolume(Ye.volume+g),p=d("div",{class:"cd-popup"},d("div",{class:"cd-head"},d("strong",{},"💿 CD player"),d("button",{class:"btn small",onclick:Ji},"✕")),Le.title,Le.status,d("div",{class:"cd-bar"},Le.fill),Le.time,d("div",{class:"cd-row"},d("span",{class:"hint"},"Volume"),d("button",{class:"btn small",title:"Quieter",onclick:()=>h(-.1)},"−"),Le.vol,d("button",{class:"btn small",title:"Louder",onclick:()=>h(.1)},"+"),Le.mute),d("div",{class:"hint"},"Volume is just for you. Other players keep their own."),Le.eject);De.append(p),Gt={el:p,timer:window.setInterval(Qi,500)},Qi()}function Ua(h){if(ss(i.inventory,"cd")<0)return qt(),A("Your CD is already in the player.","warn");if(Yi())return qt(),A(`The CD player is busy playing ${Me.byName}'s CD.`,"warn");R={type:"cd",fid:h,since:performance.now(),lastTry:0},qt(),A("You walk over to the CD player…")}async function eh(){if(!hr){hr=!0;try{const h=ss(i.inventory,"cd");if(h<0)return;if(Yi())return A(`The CD player is busy playing ${Me.byName}'s CD.`,"warn");await sw(i,h),oe.refresh(),A("You slide the CD into the player. Music starts up. ♪ It will pop back into your inventory when it's finished.")}catch{A("The CD player spits your CD back out. Someone else got there first.","warn")}finally{hr=!1}}}async function th(){try{await ic(),A("You press eject.")}catch{A("The eject button doesn't respond.","warn")}}function nh(h){Me=h,Ye.sync(h),Qi(),ow(i,h).then(p=>{p&&(oe.refresh(),A("Your CD pops out of the player and back into your inventory."))})}function ih(){Me&&vn(Me)&&!fr&&(fr=!0,ic().catch(()=>{}).finally(()=>setTimeout(()=>{fr=!1},3e3)))}async function sh(h){const p=Gn(),g=s.get(h);if(!(!p||!g||H)){H=!0;try{if(!fo(i))return A("You've already drawn blood today.","warn");p.dir=os(tt(p),tt(g)),p.emote=void 0,Te($(W,`rooms/${t}/players/${i.uid}`),{dir:p.dir}).catch(console.warn);try{await Ci($(W,`rooms/${t}/events`),{type:"stab",from:i.uid,to:h,ts:_t()})}catch{return A("Your stab missed. They may have just left.","warn")}try{await Yv(i),e.refreshHeader(),oe.refresh(),A(`You stab ${g.name}. It does them no harm, and a drop of blood trickles into your pouch. (+1)`)}catch{A("The drop of blood slips through your fingers… (the hotel refused it)","warn")}}finally{H=!1}}}function rh(){const h=[];for(let p=1;p<Math.min(l.h,5);p++)for(let g=1;g<Math.min(l.w,5);g++)Re(g,p)&&h.push({x:g,y:p});return h[Math.floor(Math.random()*h.length)]??{x:0,y:0}}const pr=$(W,`rooms/${t}/players`),Xi=$(W,`rooms/${t}/players/${i.uid}`),$a=$(W,`rooms/${t}/chat`),oh=$(W,`rooms/${t}/events`),Wa=Ze();function Kt(h){o||(de(h,"err"),e.navigate("room",{roomId:ht}))}function mr(){ne.replaceChildren(d("strong",{},`In room (${s.size})`),...[...s.values()].map(h=>d("div",{class:h.uid===i.uid?"me":""},h.name)))}function Ba(){if(a||o)return;a=!0;const h=rh();s.set(i.uid,Aa(i.uid,{name:i.name,figure:i.figure,x:h.x,y:h.y,dir:2})),Bs(Xi).remove(),We(Xi,{name:i.name,figure:i.figure,x:h.x,y:h.y,dir:2,ts:_t()}).catch(()=>Kt("You can't be in that room.")),lc(i,t);const p=()=>Kt("You don't have access to that room.");r.push(ui(pr,g=>{if(g.key===i.uid)return;const v=g.val();s.set(g.key,Aa(g.key,v)),Dn({figure:v.figure,dir:2}),mr()},p),_v(pr,g=>{if(g.key===i.uid)return;const v=g.val(),E=s.get(g.key);if(!E)return;E.name=v.name,E.figure=v.figure,(v.x!==E.dest.x||v.y!==E.dest.y)&&xa(E,{x:v.x,y:v.y});const I=v.emote;if(I&&typeof I.ts=="number"&&I.ts!==E.lastEmoteTs){E.lastEmoteTs=I.ts;const b=ni[I.id];b&&(E.path=[],Na(E,b))}}),yv(pr,g=>{s.delete(g.key),(u==null?void 0:u.uid)===g.key&&(u=null,me()),mr()}),ui(oo($a,ro("ts"),so(40)),g=>{var b;const v=g.val();if(!v)return;for(te.append(d("div",{class:"line"},d("b",{class:v.uid===i.uid?"me":""},v.name+": "),v.text));te.children.length>60;)(b=te.firstElementChild)==null||b.remove();te.scrollTop=te.scrollHeight;const E=s.get(v.uid),I=typeof v.ts=="number"?v.ts>Wa-15e3:!0;E&&I&&(E.bubble={text:v.text,until:performance.now()+Pw})},()=>{}),ui(oo(oh,ro("ts"),so(10)),g=>{var E;const v=g.val();!v||v.type!=="stab"||typeof v.ts!="number"||v.ts<Wa-3e3||(j.push({from:v.from,to:v.to,start:performance.now(),impact:!1,dropped:!1}),v.to===i.uid&&v.from!==i.uid&&A(`${((E=s.get(v.from))==null?void 0:E.name)??"Someone"} stabs you with a knife. It doesn't hurt a bit.`))},()=>{})),t===ht&&r.push(nw(nh)),mr()}function ah(){const h=qe.value.trim().slice(0,uc);if(h){if(qe.value="",h.startsWith("/")){const p=h.slice(1).toLowerCase();return ni[p]?Oa(p):A(`Unknown command. Emotes: ${Object.keys(ni).map(g=>"/"+g).join(" ")}`,"warn")}Ci($a,{uid:i.uid,name:i.name,text:h,ts:_t()}).catch(console.warn)}}function lh(h,p){var U;const g=Ki(h,p),v=!!h.bubble&&h.bubble.until>p;h.emote&&h.emote.def.ms>0&&p-h.emote.start>h.emote.def.ms&&(h.emote=void 0);const E=g?void 0:h.emote,I=E?p-E.start:0;let b=h.dir,T=0;(E==null?void 0:E.def.motion)==="spin"&&(b=sc[Math.floor(I/140)%8]),(E==null?void 0:E.def.motion)==="dance"&&(b=sc[Math.floor(I/420)%8],T=-Math.abs(Math.sin(I/120))*6),(E==null?void 0:E.def.motion)==="bounce"&&(T=-Math.abs(Math.sin(I/110))*7),(E==null?void 0:E.def.motion)==="hop"&&(T=-Math.abs(Math.sin(I/E.def.ms*Math.PI*2))*16);const P=g?["wlk"]:(E==null?void 0:E.def.actions)??["std"],M=v?"spk":(E==null?void 0:E.def.gesture)??"std",z=g?Math.floor((p-h.stepStart)/(Zn/4))%4:v?Math.floor(p/140)%2:(U=E==null?void 0:E.def.actions)!=null&&U.includes("wav")?Math.floor(p/250)%2:0;return{opts:{figure:h.figure,dir:b,headDir:b,actions:P,gesture:M,frame:z},yOff:T}}function ch(h,p){const g=xe[h.kind],v=(D,J,ie)=>{const X=qn(it(D,J));return{x:X.x,y:X.y-ie*S}},E=v(h.x,h.y,g.height),I=v(h.x+g.w,h.y,g.height),b=v(h.x+g.w,h.y+g.h,g.height),T=v(h.x,h.y+g.h,g.height),P=D=>({x:D.x,y:D.y+g.height*S}),M=(D,J)=>{y.beginPath(),D.forEach((ie,X)=>X?y.lineTo(ie.x,ie.y):y.moveTo(ie.x,ie.y)),y.closePath(),y.fillStyle=J,y.fill()};if(M([T,b,P(b),P(T)],He(g.color,.7)),M([I,b,P(b),P(I)],He(g.color,.55)),M([E,I,b,T],He(g.color,1.05)),h.kind==="arcade"){const D=(K,ae)=>({x:T.x+(b.x-T.x)*K,y:T.y+(b.y-T.y)*K+g.height*S*ae}),J=(K,ae,Ae,Yt,Zi)=>M([D(K,ae),D(Ae,ae),D(Ae,Yt),D(K,Yt)],Zi);J(.06,.03,.94,.13,`hsl(${p/12%360},90%,60%)`),J(.14,.18,.86,.52,"#06101a");const ie=.55+.25*Math.sin(p/130)+.1*Math.sin(p/47);J(.2,.22,.8,.48,`rgba(60,255,150,${ie.toFixed(2)})`),J(.2,.56,.8,.64,"#1b2150"),y.fillStyle="#e23b3b";const X=D(.34,.6);y.beginPath(),y.arc(X.x,X.y,3*S,0,Math.PI*2),y.fill(),y.fillStyle="#3b7de2";const se=D(.64,.6);y.beginPath(),y.arc(se.x,se.y,3*S,0,Math.PI*2),y.fill()}else if(h.kind==="lamp"){const D={x:(E.x+b.x)/2,y:(E.y+b.y)/2},J=y.createRadialGradient(D.x,D.y,2,D.x,D.y,34*S);J.addColorStop(0,"rgba(255,240,170,0.55)"),J.addColorStop(1,"rgba(255,240,170,0)"),y.fillStyle=J,y.fillRect(D.x-40*S,D.y-40*S,80*S,80*S)}else if(h.kind==="cdplayer"){const D=Yi(),J={x:(E.x+b.x)/2,y:(E.y+b.y)/2},ie=17*S,X=8.5*S;if(y.fillStyle="#1a1d27",y.beginPath(),y.ellipse(J.x,J.y,ie*1.08,X*1.08,0,0,Math.PI*2),y.fill(),y.fillStyle=D?"#cfd8ee":"#8d97ab",y.beginPath(),y.ellipse(J.x,J.y,ie,X,0,0,Math.PI*2),y.fill(),D){const ae=p/260%(Math.PI*2);y.lineWidth=2*S,y.strokeStyle="rgba(255,255,255,0.9)",y.beginPath(),y.ellipse(J.x,J.y,ie*.8,X*.8,0,ae,ae+1),y.stroke(),y.strokeStyle="rgba(124,92,255,0.8)",y.beginPath(),y.ellipse(J.x,J.y,ie*.55,X*.55,0,ae+3.1,ae+4),y.stroke()}y.fillStyle="#10131b",y.beginPath(),y.ellipse(J.x,J.y,ie*.2,X*.2,0,0,Math.PI*2),y.fill();const se=(ae,Ae)=>({x:T.x+(b.x-T.x)*ae,y:T.y+(b.y-T.y)*ae+g.height*S*Ae});y.fillStyle="#0e1118";for(const ae of[.28,.72]){const Ae=se(ae,.5);y.beginPath(),y.ellipse(Ae.x,Ae.y,5*S,6.5*S,0,0,Math.PI*2),y.fill()}const K=se(.5,.22);y.fillStyle=D?Math.floor(p/400)%2?"#52e07a":"#2f9c4b":"#5a2a2a",y.beginPath(),y.arc(K.x,K.y,2.2*S,0,Math.PI*2),y.fill()}const z=[E.x,I.x,b.x,T.x],U=[E.y,I.y,b.y,T.y,P(b).y,P(T).y,P(I).y];return{id:"",x0:Math.min(...z),x1:Math.max(...z),y0:Math.min(...U),y1:Math.max(...U),depth:h.x+g.w+h.y+g.h-1}}function dh(h,p,g,v,E){const I=`${Math.round(12*Math.max(1,S))}px Verdana, sans-serif`;y.font=I;const b=190*Math.max(1,S),T=h.split(" "),P=[];let M="";for(const K of T){const ae=M?M+" "+K:K;y.measureText(ae).width>b&&M?(P.push(M),M=K):M=ae}M&&P.push(M),y.font=`bold ${I}`;const z=y.measureText(p+": ").width;y.font=I;const U=15*Math.max(1,S),D=Math.max(...P.map(K=>y.measureText(K).width))+18,J=Math.max(D,z+18),ie=P.length*U+U+8,X=g-J/2,se=v-ie-8;y.save(),y.globalAlpha=E,y.fillStyle="#fff",y.strokeStyle="rgba(0,0,0,0.35)",y.lineWidth=1,y.beginPath(),y.roundRect(X,se,J,ie,8),y.fill(),y.stroke(),y.beginPath(),y.moveTo(g-5,se+ie),y.lineTo(g,se+ie+7),y.lineTo(g+5,se+ie),y.fill(),y.fillStyle="#111",y.textBaseline="top",y.font=`bold ${I}`,y.fillText(p,X+9,se+5),y.font=I,P.forEach((K,ae)=>y.fillText(K,X+9,se+5+U*(ae+1))),y.restore()}function uh(h,p){const g=document.createElement("canvas");g.width=h.width,g.height=h.height;const v=g.getContext("2d");return v.drawImage(h,0,0),v.globalCompositeOperation="source-atop",v.fillStyle=`rgba(190,20,20,${p})`,v.fillRect(0,0,g.width,g.height),g}const hh=h=>h<.3?h/.3:h<.5?1:Math.max(0,1-(h-.5)/.4),fh=h=>h<.3?0:h<.9?Math.max(0,.65-(h-.3)*1):0;function ph(h){const p=v=>{const E=Ct(v,h);return{x:E.x,y:E.y-46*S}};for(const v of j){const E=s.get(v.from),I=s.get(v.to);if(!E||!I)continue;const b=(h-v.start)/Mr,T=p(E),P=p(I);if(b>=.12&&b<.5){const M=Math.min(1,(b-.12)/.3),z=T.x+(P.x-T.x)*(.4+.6*M),U=T.y+(P.y-T.y)*(.4+.6*M);y.save(),y.translate(z,U),y.rotate(Math.atan2(P.y-T.y,P.x-T.x)+Math.PI*.25),y.imageSmoothingEnabled=!1;const D=26*Math.max(1,S);y.drawImage(Nw,-D/2,-D/2,D,D),y.restore()}if(b>=.3&&b<1.15){const M=Math.min(1,(b-.3)/.5)*14*S,z=P.x,U=P.y-34*S-M,D=11*Math.max(1,S);y.save(),y.globalAlpha=b>.95?Math.max(0,(1.15-b)/.2):1,y.beginPath(),y.arc(z,U,D,0,Math.PI*2),y.fillStyle="#2f67a8",y.fill(),y.lineWidth=2,y.strokeStyle="#0b2a52",y.stroke(),y.fillStyle="#fff",y.font=`bold ${Math.round(13*Math.max(1,S))}px Verdana, sans-serif`,y.textAlign="center",y.textBaseline="middle",y.fillText("0",z,U+1),y.restore()}}for(const v of N){const E=s.get(v.from),I=s.get(v.to);if(!E||!I)continue;const b=Math.min(1,(h-v.start)/hc),T=p(I),P={x:Ct(E,h).x,y:Ct(E,h).y-60*S},M={x:(T.x+P.x)/2,y:Math.min(T.y,P.y)-50*S},z=(1-b)*(1-b)*T.x+2*(1-b)*b*M.x+b*b*P.x,U=(1-b)*(1-b)*T.y+2*(1-b)*b*M.y+b*b*P.y;y.imageSmoothingEnabled=!1;const D=18*Math.max(1,S)*(1-.35*b);y.drawImage(Ow,z-D/2,U-D/2,D,D)}for(const v of G){const E=h-v.born,I=v.x+v.vx*E,b=v.y+v.vy*E+.0014*E*E;y.globalAlpha=Math.max(0,1-E/v.life),y.fillStyle="#b01616";const T=3*Math.max(1,S);y.fillRect(I,b,T,T)}y.globalAlpha=1;const g=l.furni.find(v=>v.kind==="cdplayer");if(g&&zt.length){const v=xe.cdplayer,E=qn(it(g.x+.5,g.y+.5));y.textAlign="center",y.textBaseline="middle",y.lineWidth=3,y.strokeStyle="rgba(0,0,0,0.65)";for(const I of zt){const b=h-I.born,T=b/I.life,P=E.x+(I.ox+Math.sin(b/240+I.phase)*9)*S,M=E.y-(v.height+8)*S-b*.045*S;y.globalAlpha=T<.15?T/.15:Math.max(0,1-(T-.55)/.45),y.font=`bold ${Math.round((18+6*Math.sin(I.phase))*Math.max(1,S))}px "Segoe UI Symbol", "Apple Symbols", sans-serif`,y.strokeText(I.glyph,P,M),y.fillStyle=I.color,y.fillText(I.glyph,P,M)}y.globalAlpha=1}y.textAlign="center",y.textBaseline="middle",y.font=`${Math.round(20*Math.max(1,S))}px "Segoe UI Emoji", "Apple Color Emoji", sans-serif`;for(const v of O){const E=s.get(v.uid);if(!E)continue;const I=h-v.born,b=Ct(E,h);y.globalAlpha=Math.max(0,1-I/v.life),y.fillText(v.glyph,b.x+v.ox*S,b.y-(as+6)*S-I*.035*S)}y.globalAlpha=1;for(const v of k){const E=h-v.born;y.globalAlpha=Math.max(0,1-E/1100),y.font=`bold ${Math.round(16*Math.max(1,S))}px Verdana, sans-serif`,y.textAlign="center",y.textBaseline="middle",y.lineWidth=3,y.strokeStyle="#000",y.strokeText(v.text,v.x,v.y-E*.04),y.fillStyle=v.color,y.fillText(v.text,v.x,v.y-E*.04)}y.globalAlpha=1,y.textAlign="start"}function mh(h){for(let p=j.length-1;p>=0;p--){const g=j[p],v=(h-g.start)/Mr,E=s.get(g.to);if(!g.impact&&v>=.3&&(g.impact=!0,E)){const I=Ct(E,h);for(let b=0;b<9;b++){const T=-Math.PI/2+(Math.random()-.5)*2.2,P=.05+Math.random()*.09;G.push({x:I.x,y:I.y-46*S,vx:Math.cos(T)*P,vy:Math.sin(T)*P,born:h,life:650+Math.random()*250})}}!g.dropped&&v>=.5&&(g.dropped=!0,N.push({from:g.from,to:g.to,start:h})),v>1.3&&j.splice(p,1)}for(let p=N.length-1;p>=0;p--){const g=N[p];if(h-g.start>=hc){const v=s.get(g.from);if(v&&g.from===i.uid){const E=Ct(v,h);k.push({text:"+1",x:E.x,y:E.y-70*S,born:h,color:"#ff5252"})}N.splice(p,1)}}if(Yi()&&h-La>360){La=h;const p=["♪","♫","♬","♩"],g=["#ffd54a","#ff7fbf","#7fe3ff","#9dff8a"];zt.push({born:h,life:2200,glyph:p[Math.floor(Math.random()*4)],ox:(Math.random()-.5)*22,phase:Math.random()*6,color:g[Math.floor(Math.random()*4)]})}for(let p=zt.length-1;p>=0;p--)h-zt[p].born>zt[p].life&&zt.splice(p,1);for(const p of s.values()){const g=p.emote;g!=null&&g.def.fx&&h-g.lastFx>420&&!Ki(p,h)&&(g.lastFx=h,O.push({uid:p.uid,glyph:g.def.fx[Math.floor(Math.random()*g.def.fx.length)],born:h,life:1500,ox:(Math.random()-.5)*30}))}for(let p=O.length-1;p>=0;p--)h-O[p].born>O[p].life&&O.splice(p,1);for(let p=G.length-1;p>=0;p--)h-G[p].born>G[p].life&&G.splice(p,1);for(let p=k.length-1;p>=0;p--)h-k[p].born>1100&&k.splice(p,1)}function gh(){if(!V||V==="pickup"||!f||!ee())return;const h=xe[V];if(h)for(let p=0;p<h.w;p++)for(let g=0;g<h.h;g++){const v=f.x+p,E=f.y+g,I=Re(v,E),b=qn(it(v,E));y.beginPath(),y.moveTo(b.x,b.y),y.lineTo(b.x+st/2*S,b.y+$e/2*S),y.lineTo(b.x,b.y+$e*S),y.lineTo(b.x-st/2*S,b.y+$e/2*S),y.closePath(),y.fillStyle=I?"rgba(80,220,120,0.45)":"rgba(230,70,70,0.45)",y.fill()}}let gr=0;function Ha(){if(o)return;gr=requestAnimationFrame(Ha);const h=performance.now(),p=window.devicePixelRatio||1;if(y.setTransform(p,0,0,p,0,0),y.imageSmoothingEnabled=S<1,y.clearRect(0,0,L.width,L.height),y.drawImage(Ke,qi-jt.x*S,Gi-jt.y*S,Ke.width*S,Ke.height*S),!a)return;for(const b of s.values())Ju(b,h);if(Xu(h),ih(),mh(h),f&&!(V&&V!=="pickup")){const b=qn(it(f.x,f.y));y.beginPath(),y.moveTo(b.x,b.y),y.lineTo(b.x+st/2*S,b.y+$e/2*S),y.lineTo(b.x,b.y+$e*S),y.lineTo(b.x-st/2*S,b.y+$e/2*S),y.closePath(),y.strokeStyle=V==="pickup"?"rgba(255,170,60,0.95)":"rgba(255,255,255,0.9)",y.lineWidth=2,y.stroke()}gh();const g=[],v=[],E=[],I=[];for(const b of l.furni)g.push({depth:b.x+xe[b.kind].w+b.y+xe[b.kind].h-1,draw:()=>{const T=ch(b,h);T&&dw.has(b.kind)&&E.push({...T,id:b.id,kind:b.kind})}});for(const b of s.values()){const T=Pa(b,h),{opts:P,yOff:M}=lh(b,h);let z=$v(P);z?b.last=z:(Dn(P),z=b.last);const U=Ct(b,h);let D={x:0,y:0},J=0;for(const X of j){const se=(h-X.start)/Mr;if(!(se>1)){if(X.from===b.uid){const K=s.get(X.to);if(K){const ae=Ct(K,h),Ae=ae.x-U.x,Yt=ae.y-U.y,Zi=Math.hypot(Ae,Yt)||1,Va=hh(se)*16*S;D={x:Ae/Zi*Va,y:Yt/Zi*Va}}}X.to===b.uid&&(J=Math.max(J,fh(se)))}}const ie=M*S;if(v.push({id:b.uid,x0:U.x-22*S,x1:U.x+22*S,y0:U.y-as*S,y1:U.y+8*S,depth:T.x+T.y}),g.push({depth:T.x+T.y+.5,draw:()=>{var K;if(y.fillStyle="rgba(0,0,0,0.18)",y.beginPath(),y.ellipse(U.x+D.x,U.y+D.y,16*S,7*S,0,0,Math.PI*2),y.fill(),z){const ae=U.x+D.x-32*S,Ae=U.y+D.y+ie-as*S;y.drawImage(z,ae,Ae,z.width*S,z.height*S),J>.02&&y.drawImage(uh(z,J),ae,Ae,z.width*S,z.height*S)}const X=(u==null?void 0:u.uid)===b.uid&&b.uid!==i.uid&&((K=fe())==null?void 0:K.useOnPlayer)==="stab";y.font=`${Math.round(10*Math.max(1,S))}px Verdana, sans-serif`;const se=y.measureText(b.name).width+10;y.fillStyle=X?"rgba(150,20,20,0.85)":"rgba(0,0,0,0.55)",y.beginPath(),y.roundRect(U.x-se/2,U.y+7*S,se,14*Math.max(1,S),5),y.fill(),y.fillStyle=b.uid===i.uid?"#ffe27a":"#fff",y.textBaseline="top",y.textAlign="center",y.fillText(b.name,U.x,U.y+9*S),y.textAlign="start"}}),b.bubble&&b.bubble.until>h){const X=b.bubble.until-h,se=b.bubble;I.push(()=>dh(se.text,b.name,U.x,U.y-(as+4)*S,X<800?X/800:1))}}_=v,g.sort((b,T)=>b.depth-T.depth).forEach(b=>b.draw()),m=E,ph(h),I.forEach(b=>b())}async function _h(){if(t===ht){ji(rc()),Ba();return}try{const h=await mw(t);if(o)return;if(!h)return Kt("That room doesn't exist.");if(!await ww(h,i.uid,q.friendUids()))return Kt(`${h.ownerName}'s room is ${h.access==="invite"?"invite only":"friends only"}.`);if(o)return;ji(oc(t,h)),Ba(),r.push(gw(t,p=>{if(!p)return Kt("This room was deleted.");ji(oc(t,p))},()=>Kt("You can't be in that room any more.")))}catch{Kt("Couldn't open that room.")}}return ji(l),gr=requestAnimationFrame(Ha),_h(),()=>{o=!0,cancelAnimationFrame(gr),Ta.disconnect(),window.removeEventListener("keydown",Ra),r.forEach(h=>h()),Ji(),Ye.stop(),fn&&window.removeEventListener("pointerdown",fn),oe.dispose(),a&&(Bs(Xi).cancel(),On(Xi)),lc(i,"")}}function Mw(n,e){let t="clothing",i=null;const s=d("div",{class:"shop-tabs"}),r=d("div",{class:"shop-content"});n.append(d("div",{class:"shop"},s,r));function o(a){t=a,i==null||i(),i=null,r.replaceChildren(),s.replaceChildren(...[["clothing","Clothing"],["emotes","Emotes"],["music","Music access"]].map(([l,c])=>d("button",{class:"tab big"+(t===l?" on":""),onclick:()=>o(l)},c))),i=t==="clothing"?Hu(r,e,"shop"):t==="emotes"?Lw(r,e,()=>o("emotes")):Fw(r,e,()=>o("music"))}return o("clothing"),()=>i==null?void 0:i()}function Lw(n,e,t){const i=e.profile,s=Ti.filter(o=>o.price===0),r=Ti.filter(o=>o.price>0);return n.append(d("div",{class:"panel"},d("h2",{},"Emotes"),d("p",{class:"muted"},`You already have: ${s.map(o=>`${o.icon} ${o.name}`).join("  ")}. Unlocked emotes show up in the Emotes tab in the lobby, or type /name in chat.`),d("div",{class:"emote-shop"},...r.map(o=>{const a=Vs(i,o.id),l=i.blood>=o.price;return d("div",{class:"emote-card"+(a?" owned":"")},d("div",{class:"emote-card-icon"},o.icon),d("div",{class:"emote-card-name"},o.name),d("div",{class:"hint"},o.desc),a?d("div",{class:"ok-text"},"✔ Owned"):d("button",{class:"btn small primary",disabled:!l,title:l?"":`You need ${o.price-i.blood} more drops`,onclick:async()=>{try{await ba(i,[ju(o.id)],o.price),e.refreshHeader(),de(`${o.name} unlocked! Try /${o.id} in a room.`),t()}catch(c){de(c.message,"err")}}},d("img",{src:Bi,class:"blood-ico",alt:""}),` ${o.price}`))})))),()=>{}}function Fw(n,e,t){const i=e.profile,s=!!i.owned[ho],r=i.blood>=Nr;return n.append(d("div",{class:"panel music-card"},d("h2",{},"Jukebox pass"),d("p",{},`Stream music while you're in the hotel. Includes ${xt.length} track${xt.length===1?"":"s"} for now; more get added over time.`),d("ul",{class:"muted"},...xt.map(o=>d("li",{},`♪ ${o.title}`))),s?d("div",{},d("p",{class:"ok-text"},"✔ You own this."),d("button",{class:"btn primary",onclick:()=>e.navigate("room")},"Go listen (Music tab in the lobby)")):d("div",{},d("button",{class:"btn primary",disabled:!r,onclick:async()=>{try{await ba(i,[ho],Nr),e.refreshHeader(),de("Jukebox pass unlocked! Open the Music tab in the lobby."),t()}catch(o){de(o.message,"err")}}},d("img",{src:Bi,class:"blood-ico",alt:""}),` Buy for ${Nr} drops`),r?null:d("p",{class:"muted"},`You have ${i.blood}. Stab a player in the lobby to earn a drop each day.`)))),()=>{}}function Uw(n,e){const t=e.profile;let i=!1;function s(l,c){Dn({figure:c,dir:2,headDir:2}).then(f=>{i||!f||l.getContext("2d").drawImage(f,0,0)})}function r(l){const c=d("canvas",{class:"wardrobe-canvas",width:64,height:110});return s(c,l),c}const o=d("div",{class:"panel wardrobe"});n.append(o);function a(){const l=Array.from({length:zv},(c,f)=>{const u=t.wardrobe[f];return d("div",{class:"slot"+(u?"":" empty")},d("div",{class:"slot-title"},`Slot ${f+1}`),u?r(u.figure):d("div",{class:"slot-empty"},"empty"),d("div",{class:"row center"},d("button",{class:"btn small",onclick:async()=>{try{await Qv(t,f,{figure:t.figure,gender:t.gender}),de(`Saved current look to slot ${f+1}`),a()}catch(_){de(_.message,"err")}}},u?"Overwrite":"Save here"),u?d("button",{class:"btn small primary",onclick:async()=>{try{await po(t,u.figure,u.gender),e.refreshHeader(),de("Outfit on!"),a()}catch(_){de(_.message,"err")}}},"Wear"):null,u?d("button",{class:"btn small danger",onclick:async()=>{try{await Jv(t,f),a()}catch(_){de(_.message,"err")}}},"✕"):null))});o.replaceChildren(d("h2",{},"Wardrobe"),d("div",{class:"wardrobe-current"},r(t.figure),d("div",{},d("strong",{},"Wearing now"),d("p",{class:"muted"},"Save the look you're wearing into a slot, then swap between outfits any time. New clothes are in the shop."),d("button",{class:"btn",onclick:()=>e.navigate("shop")},"Open shop"))),d("div",{class:"slots"},...l))}return a(),()=>{i=!0}}const Lr={open:"🌐 Open",friends:"👥 Friends",invite:"🔒 Invite only"};function $w(n,e){const t=e.profile;let i={};const s=d("div",{class:"panel navigator"});n.append(s);const r=f=>e.navigate("room",{roomId:f});function o(f,u,_,m,w){const x=q.roomCounts().get(f)??0;return d("div",{class:"room-card"},d("div",{class:"rc-main"},d("div",{class:"rc-name"},u),d("div",{class:"hint"},`${_} · ${m}`)),d("div",{class:"rc-count",title:"Players inside"},`👤 ${x}`),w??null,d("button",{class:"btn small primary",onclick:()=>r(f)},"Enter"))}function a(){const f=qu(t.uid),u=i[f],_=q.friendUids(),m=q.roomCounts(),w=Object.entries(i).filter(([H])=>H!==f),x=w.filter(([,H])=>_.has(H.owner)&&H.access!=="invite"),R=w.filter(([,H])=>H.access==="open"&&!_.has(H.owner)).sort((H,V)=>(m.get(V[0])??0)-(m.get(H[0])??0));s.replaceChildren(d("h2",{},"Rooms"),d("div",{class:"nav-sec"},d("div",{class:"fp-label"},"Public"),o(ht,"Main Lobby","The hotel","🌐 Open · arcade inside")),d("div",{class:"nav-sec"},d("div",{class:"fp-label"},"My room"),u?o(f,u.name,`${u.w}×${u.h}`,Lr[u.access],d("span",{class:"hint"},"Edit it from the 🏠 tab inside")):d("div",{class:"room-card"},d("div",{class:"rc-main"},d("div",{class:"rc-name"},"You don't have a room yet"),d("div",{class:"hint"},"Make one, then decorate it and invite friends.")),d("button",{class:"btn primary",onclick:async()=>{try{r(await yw(t)),de("Room created! Open the 🏠 tab to decorate it.")}catch{de("Couldn't create your room.","err")}}},"Create my room"))),...x.length?[d("div",{class:"nav-sec"},d("div",{class:"fp-label"},"Friends' rooms"),...x.map(([H,V])=>o(H,V.name,`by ${V.ownerName}`,Lr[V.access])))]:[],d("div",{class:"nav-sec"},d("div",{class:"fp-label"},"Open rooms"),...R.length?R.map(([H,V])=>o(H,V.name,`by ${V.ownerName}`,Lr[V.access])):[d("div",{class:"hint pad"},"No other open rooms right now.")]))}const l=_w(f=>{i=f,a()}),c=q.subscribe(a);return a(),()=>{l(),c()}}function pc(n){const e=d("div",{class:"head"});return Dn({figure:n,dir:2,headDir:2,headOnly:!0}).then(t=>{if(!t||!e.isConnected)return;const i=Bu(t);i.className="head-canvas",e.replaceChildren(i)}),e}const Ww=n=>new Date(n).toLocaleTimeString([],{hour:"2-digit",minute:"2-digit"});function Bw(n,e){const t=e.profile;let i=!1;const s=new Map,r=d("span",{class:"badge hidden"}),o=d("button",{class:"btn friends-toggle",onclick:()=>{i=!i,m()}},"👥 Friends ",r),a=d("div",{class:"friends-panel hidden"}),l=d("div",{class:"chat-windows"}),c=d("div",{class:"invite-popups"}),f=d("div",{class:"messenger"},l,d("div",{class:"friends-col"},a,o));n.append(f,c);const u=d("input",{type:"text",placeholder:"Add friend by username",maxLength:16,class:"mini-input"});async function _(){const k=u.value;u.value="";try{de(await q.sendRequest(k))}catch(O){de(O.message||"Couldn't send that request.","err")}}function m(){a.classList.toggle("hidden",!i);const k=[...q.friends.values()].sort((ne,Ue)=>Number(q.isOnline(Ue.uid))-Number(q.isOnline(ne.uid))||ne.name.localeCompare(Ue.name)),O=k.filter(ne=>q.isOnline(ne.uid)).length;o.firstChild.textContent=`👥 Friends (${O}/${k.length}) `;const ee=q.totalUnread;if(r.textContent=String(ee),r.classList.toggle("hidden",ee===0),!i)return;const L=[...q.requests.values()].map(ne=>d("div",{class:"frow"},pc(ne.figure),d("span",{class:"fname"},ne.name),d("button",{class:"btn small primary",title:"Accept",onclick:()=>q.accept(ne.uid).then(()=>de(`You and ${ne.name} are friends now.`),()=>de("Couldn't accept that.","err"))},"✓"),d("button",{class:"btn small",title:"Decline",onclick:()=>void q.decline(ne.uid)},"✕"))),te=q.invites.map(ne=>d("div",{class:"frow"},d("span",{class:"fname"},`${ne.fromName} invited you to "${ne.roomName}"`),d("button",{class:"btn small primary",onclick:()=>{q.dismissInvite(ne.id),e.navigate("room",{roomId:ne.room})}},"Join"),d("button",{class:"btn small",onclick:()=>void q.dismissInvite(ne.id)},"✕")));a.firstChild||a.append(d("div",{class:"fp-head"},d("strong",{},"Friends"),d("button",{class:"btn small",onclick:()=>{i=!1,m()}},"–")),d("form",{class:"row fp-add",onsubmit:ne=>{ne.preventDefault(),_()}},u,d("button",{class:"btn small",type:"submit"},"Add")),w),w.replaceChildren(...te.length?[d("div",{class:"fp-sec"},d("div",{class:"fp-label"},"Room invites"),...te)]:[],...L.length?[d("div",{class:"fp-sec"},d("div",{class:"fp-label"},`Requests (${L.length})`),...L)]:[],d("div",{class:"fp-list"},...k.length===0?[d("div",{class:"hint pad"},"No friends yet. Add someone by username, or right-click a player in a room.")]:k.map(ne=>x(ne))))}const w=d("div",{class:"fp-dyn"});function x(k){const O=q.isOnline(k.uid),ee=q.roomOf(k.uid),L=q.unread.get(k.uid)??0;return d("div",{class:"frow"},pc(k.figure),d("span",{class:"dot "+(O?"on":"")}),d("span",{class:"fname",title:O?ee?"In a room":"Online":"Offline",onclick:()=>R(k.uid)},k.name),L?d("span",{class:"badge"},String(L)):null,d("button",{class:"btn small",title:"Message",onclick:()=>R(k.uid)},"💬"),ee?d("button",{class:"btn small",title:ee===ht?"Go to the lobby":"Follow into their room",onclick:()=>e.navigate("room",{roomId:ee})},"➜"):null,d("button",{class:"btn small",title:"Remove friend",onclick:()=>{confirm(`Remove ${k.name} from your friends?`)&&q.removeFriend(k.uid).then(()=>H(k.uid))}},"✕"))}function R(k){const O=q.friends.get(k);if(!O)return;q.openChat.add(k),q.markRead(k),i=!1,m();const ee=s.get(k);if(ee){ee.el.classList.remove("min"),ee.render();return}const L=d("div",{class:"cw-log"}),te=d("input",{type:"text",maxLength:200,placeholder:`Message ${O.name}…`,class:"cw-input",autocomplete:"off"}),ne=d("span",{class:"dot"}),Ue=d("div",{class:"cw-head",onclick:()=>Be.classList.toggle("min")},ne,d("strong",{},O.name),d("button",{class:"btn small",onclick:De=>{De.stopPropagation(),H(k)}},"✕")),Be=d("div",{class:"chat-window"},Ue,L,d("form",{class:"cw-form",onsubmit:De=>{De.preventDefault();const Ge=te.value.trim();Ge&&(te.value="",q.sendDm(k,Ge).catch(()=>de("That message didn't go through.","err")))}},te)),qe=()=>{ne.className="dot "+(q.isOnline(k)?"on":"");const De=q.dms.get(k)??[];L.replaceChildren(...De.length===0?[d("div",{class:"hint pad"},"Say hi!")]:De.map(Ge=>d("div",{class:"cw-msg"+(Ge.from===t.uid?" mine":"")},d("div",{class:"cw-bubble"},Ge.text),d("div",{class:"cw-time"},Ww(Ge.ts))))),L.scrollTop=L.scrollHeight};s.set(k,{el:Be,log:L,render:qe}),l.append(Be),qe(),te.focus()}function H(k){const O=s.get(k);O&&(O.el.remove(),s.delete(k)),q.openChat.delete(k)}const V=k=>R(k.detail);window.addEventListener("open-chat",V);const j=q.subscribe(()=>{m();for(const[k,O]of s)q.friends.has(k)?(q.markRead(k),O.render()):H(k)}),N=q.onDm((k,O)=>{if(O.from===t.uid||s.has(k))return;const ee=q.friends.get(k);if(!ee)return;const L=d("div",{class:"toast ok show msg-toast",onclick:()=>{R(k),L.remove()}},`💬 ${ee.name}: ${O.text.slice(0,60)}`);document.body.append(L),setTimeout(()=>L.remove(),5e3)}),G=q.onInvite(k=>{const O=d("div",{class:"invite-card"},d("div",{},d("strong",{},k.fromName)," invited you to ",d("strong",{},`"${k.roomName}"`)),d("div",{class:"row"},d("button",{class:"btn small primary",onclick:()=>{q.dismissInvite(k.id),O.remove(),e.navigate("room",{roomId:k.room})}},"Join"),d("button",{class:"btn small",onclick:()=>{q.dismissInvite(k.id),O.remove()}},"Later")));c.append(O),setTimeout(()=>O.remove(),2e4)});return m(),()=>{j(),N(),G(),window.removeEventListener("open-chat",V),f.remove(),c.remove()}}const Mn=document.getElementById("app");let Se=null,si=null;function ki(){Se==null||Se(),Se=null,si==null||si(),si=null,Mn.replaceChildren()}function Hw(){ki(),Mn.append(d("div",{class:"center-screen"},d("div",{class:"panel auth"},d("h1",{},"Almost there"),d("p",{},"This demo needs a Firebase project. Add your config to ",d("code",{},"src/firebaseConfig.ts"),":"),d("ol",{},d("li",{},"Firebase console → create a project → add a Web app, copy its config"),d("li",{},"Build → Authentication → enable the Email/Password provider (usernames are mapped onto it; no real emails are used)"),d("li",{},"Build → Realtime Database → create a database"),d("li",{},"Paste database.rules.json into the database Rules tab and publish")),d("p",{class:"muted"},"Or run the local emulators: ",d("code",{},"npm run emulators")," + ",d("code",{},"npm run dev:emu")))))}function Ku(n){ki(),Mn.append(d("div",{class:"center-screen"},d("div",{class:"loading"},n)))}function mc(){ki(),ke.stop();let n=!1;const e=d("div",{class:"form-error"}),t=d("input",{type:"text",placeholder:"Username",autocomplete:"username",maxLength:16,required:!0}),i=d("input",{type:"password",placeholder:"Password",autocomplete:"current-password",required:!0}),s=d("button",{class:"btn primary",type:"submit"},"Log in"),r=d("button",{class:"link",type:"button"},"No account? Register");function o(){s.textContent=n?"Create account":"Log in",r.textContent=n?"Have an account? Log in":"No account? Register",i.placeholder=n?"Password (6+ characters)":"Password",i.autocomplete=n?"new-password":"current-password",e.textContent=""}r.addEventListener("click",()=>{n=!n,o()});const a=d("form",{class:"auth-form",onsubmit:async l=>{l.preventDefault(),e.textContent="",s.disabled=!0;try{n?(await Zv(t.value.trim(),i.value),Yu(Wi.currentUser)):await ew(t.value,i.value)}catch(c){e.textContent=Ea(c),s.disabled=!1}}},d("label",{},t),d("label",{},i),e,s,r);Mn.append(d("div",{class:"center-screen"},d("div",{class:"panel auth"},d("div",{class:"logo"},"Bobba Hotel"),d("p",{class:"muted"},"Log in, build your character, and hang out in the lobby."),a,null)))}async function Vw(n){Ku("Loading your character…");let e;try{await Promise.all([ya,Hv()]),e=await Kv(n.uid),e||(e=await $u(n.uid,(n.email??"").split("@")[0].slice(0,16).padEnd(3,"_")))}catch(w){ki(),Mn.append(d("div",{class:"center-screen"},d("div",{class:"panel auth"},d("h1",{},"Couldn't load"),d("p",{},Ea(w)),d("button",{class:"btn",onclick:()=>location.reload()},"Retry"),d("button",{class:"btn",onclick:()=>go()},"Log out"))));return}const t=e;ki();const i=d("span",{class:"coins"}),s=d("nav",{}),r=d("main",{}),o=async()=>{Se==null||Se(),Se=null,await new Promise(w=>setTimeout(w,300)),Cw(t),await new Promise(w=>setTimeout(w,150)),await go()},a=d("header",{},d("div",{class:"logo small"},"Bobba Hotel"),s,d("div",{class:"me"},d("span",{class:"who"},t.name),i,d("button",{class:"btn small",onclick:()=>void o()},"Log out"))),l=d("div",{class:"shell"},a,r);Mn.append(l);const c={profile:t,navigate:(w,x)=>m(w,x),refreshHeader(){i.replaceChildren(d("img",{src:Bi,class:"blood-ico",alt:"drops of blood"}),` ${t.blood}`),i.title="Drops of blood"}};bw(t).catch(w=>console.warn("couldn't publish profile",w)),q.start(t),Ew(t);const f=Bw(l,c);si=()=>{f(),q.stop()};let u="room";const _=[["room","Lobby"],["rooms","Rooms"],["customize","Character"],["wardrobe","Wardrobe"],["shop","Shop"]];function m(w,x={}){Se==null||Se(),Se=null,r.replaceChildren(),u=w,s.replaceChildren(..._.map(([R,H])=>d("button",{class:"navbtn"+(R===u?" on":""),disabled:!!x.onboarding,onclick:()=>m(R)},H))),c.refreshHeader(),w==="room"?Se=Dw(r,c,x.roomId??ht):w==="rooms"?Se=$w(r,c):w==="customize"?Se=Hu(r,c,"customize",!!x.onboarding):w==="shop"?Se=Mw(r,c):Se=Uw(r,c)}t.figure?m("room"):m("customize",{onboarding:!0})}Ru?(Ku("Connecting…"),Jp(Wi,n=>{mo.registering||Yu(n)})):Hw();let gc;function Yu(n){if(((n==null?void 0:n.uid)??null)!==gc){if(gc=(n==null?void 0:n.uid)??null,n&&(n.isAnonymous||!n.email))return go(),mc();n?Vw(n).catch(e=>de(Ea(e),"err")):mc()}}
