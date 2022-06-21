var __assign=function(){return(__assign=Object.assign||function(t){for(var e,n=1,o=arguments.length;n<o;n++)for(var a in e=arguments[n])Object.prototype.hasOwnProperty.call(e,a)&&(t[a]=e[a]);return t}).apply(this,arguments)};function __rest(t,e){var n={};for(a in t)Object.prototype.hasOwnProperty.call(t,a)&&e.indexOf(a)<0&&(n[a]=t[a]);if(null!=t&&"function"==typeof Object.getOwnPropertySymbols)for(var o=0,a=Object.getOwnPropertySymbols(t);o<a.length;o++)e.indexOf(a[o])<0&&Object.prototype.propertyIsEnumerable.call(t,a[o])&&(n[a[o]]=t[a[o]]);return n}function __awaiter(t,i,c,u){return new(c=c||Promise)(function(n,e){function o(t){try{r(u.next(t))}catch(t){e(t)}}function a(t){try{r(u.throw(t))}catch(t){e(t)}}function r(t){var e;t.done?n(t.value):((e=t.value)instanceof c?e:new c(function(t){t(e)})).then(o,a)}r((u=u.apply(t,i||[])).next())})}function __generator(o,a){var r,i,c,u={label:0,sent:function(){if(1&c[0])throw c[1];return c[1]},trys:[],ops:[]},t={next:e(0),throw:e(1),return:e(2)};return"function"==typeof Symbol&&(t[Symbol.iterator]=function(){return this}),t;function e(n){return function(t){var e=[n,t];if(r)throw new TypeError("Generator is already executing.");for(;u;)try{if(r=1,i&&(c=2&e[0]?i.return:e[0]?i.throw||((c=i.return)&&c.call(i),0):i.next)&&!(c=c.call(i,e[1])).done)return c;switch(i=0,(e=c?[2&e[0],c.value]:e)[0]){case 0:case 1:c=e;break;case 4:return u.label++,{value:e[1],done:!1};case 5:u.label++,i=e[1],e=[0];continue;case 7:e=u.ops.pop(),u.trys.pop();continue;default:if(!(c=0<(c=u.trys).length&&c[c.length-1])&&(6===e[0]||2===e[0])){u=0;continue}if(3===e[0]&&(!c||e[1]>c[0]&&e[1]<c[3])){u.label=e[1];break}if(6===e[0]&&u.label<c[1]){u.label=c[1],c=e;break}if(c&&u.label<c[2]){u.label=c[2],u.ops.push(e);break}c[2]&&u.ops.pop(),u.trys.pop();continue}e=a.call(o,u)}catch(t){e=[6,t],i=0}finally{r=c=0}if(5&e[0])throw e[1];return{value:e[0]?e[1]:void 0,done:!0}}}}var doraSDKApiURL="https://ap-open-z0.qiniuapi.com/dora-sdk/api",Store=function(){function t(){this.cache={token:null}}return t.prototype.get=function(t){return this.cache[t]},t.prototype.set=function(t,e){this.cache[t]=e},t}(),store=new Store;function post(t,e){var n=e.debug,e=__rest(e,["debug"]),n=n?{request:e||{},debug:n}:{request:e||{}};return fetch(doraSDKApiURL+t,{headers:{Authorization:store.get("token"),"Content-Type":"application/json"},body:JSON.stringify(n),method:"POST"}).then(function(t){return t.json()})}var ConnectStatus,Status,IDCardDetector=function(){function t(){}return t.run=function(t,e){t=t._track.getCurrentFrameDataURL();return post("/ocr-idcard",__assign({image:t.replace("data:image/png;base64,","")},e))},t}(),defaultQuery={voice_type:1,voice_encode:1,voice_sample:16e3,needvad:1,need_partial:1,maxsil:10,need_words:0,model_type:0,voice_id:void 0,force_final:0,vad_sil_thres:.5},TranslateWebSocket=(!function(t){t[t.CLOSED=0]="CLOSED",t[t.PROCESSING=1]="PROCESSING",t[t.OPENED=2]="OPENED"}(ConnectStatus=ConnectStatus||{}),function(){function t(t,e){this.status=ConnectStatus.CLOSED;var n=t.query,n=void 0===n?defaultQuery:n,t=t.baseUrl,t=void 0===t?"wss://wz-rt-asr.service-z0.qiniuapp.com/asr":t,n=Object.entries(__assign(__assign(__assign({},defaultQuery),n),{e:Math.floor(Date.now()/1e3)})).filter(function(t){return void 0!==t[1]&&null!==t[1]}).map(function(t){var e=t[0],t=t[1];return"".concat(e,"=").concat(t)}).join("&"),t=t+"?"+encodeURI(n);this.listeners=[],this.initWebSocket(t,e)}return t.prototype.initWebSocket=function(a,r){return __awaiter(this,void 0,void 0,function(){var e,n,o=this;return __generator(this,function(t){switch(t.label){case 0:return this.status=ConnectStatus.PROCESSING,store.cache.signCallback?[4,store.cache.signCallback(a)]:[3,2];case 1:return n=t.sent(),[3,3];case 2:n=null,t.label=3;case 3:return e=n,this.ws=new WebSocket(a+"&token=".concat(e)),this.on("open",function(){console.info("roomlog websocket open"),o.status=ConnectStatus.OPENED,r&&r()}),this.on("close",function(){console.info("roomlog websocket close"),o.status=ConnectStatus.CLOSED}),[2]}})})},t.prototype.on=function(t,e){var n;this.listeners.push({event:t,callback:e}),null!==(n=this.ws)&&void 0!==n&&n.addEventListener(t,e)},t.prototype.send=function(t){var e;this.status===ConnectStatus.OPENED&&null!==(e=this.ws)&&void 0!==e&&e.send(t)},t.prototype.sendEOS=function(){this.ws&&this.status===ConnectStatus.OPENED&&this.send("EOS")},t.prototype.close=function(){var t;this.ws&&this.status===ConnectStatus.OPENED&&(this.status=ConnectStatus.CLOSED,null!==(t=this.ws)&&void 0!==t&&t.close())},t.prototype.destroy=function(){var o=this;this.listeners.map(function(t){var e,n=t.event,t=t.callback;null!==(e=o.ws)&&void 0!==e&&e.removeEventListener(n,t)})},t}()),defaultAudioToTextParams=(!function(t){t[t.AVAILABLE=0]="AVAILABLE",t[t.DESTROY=1]="DESTROY",t[t.ERROR=2]="ERROR",t[t.DETECTING=3]="DETECTING"}(Status=Status||{}),{voice_type:1,voice_encode:1,voice_sample:16e3,needvad:1,need_partial:1,maxsil:10,need_words:0,model_type:0,voice_id:void 0,force_final:0,vad_sil_thres:.5}),AudioToTextAnalyzer=function(){function r(){this.status=Status.AVAILABLE,this.isRecording=!1,this.startTime=Date.now(),this.leftDataList=[],this.rightDataList=[]}return r.prototype.startConnectWebSocket=function(e,t){var n=this,o=t.params,a=t.callback,t=t.audioBuffer,t=__assign(__assign(__assign({},defaultAudioToTextParams),{voice_sample:t.sampleRate}),o);e.ws=new TranslateWebSocket({query:t},function(){var t;e.isRecording=!0,e.status=Status.DETECTING,null!==(t=e.ws)&&void 0!==t&&t.on("message",function(t){var t=JSON.parse(t.data);null!=a&&a.onAudioToText&&a.onAudioToText(t),1===t.ended&&(n.timeoutWebSocketCloseJob&&clearTimeout(n.timeoutWebSocketCloseJob),null!==(t=e.ws)&&void 0!==t&&t.close())}),null!=a&&a.onStatusChange&&a.onStatusChange(e.status,"正在实时转化"),null!==(t=e.ws)&&void 0!==t&&t.on("error",function(){e.isRecording=!1,e.status=Status.ERROR,null!=a&&a.onStatusChange&&a.onStatusChange(e.status,"连接异常断线")}),null!==(t=e.ws)&&void 0!==t&&t.on("close",function(){e.isRecording=!1,e.status=Status.DESTROY,null!=a&&a.onStatusChange&&a.onStatusChange(e.status,"已经销毁不可用")})}),e.ws.on("open",function(){var t;console.log("on open"),e.isRecording=!0,e.status=Status.DETECTING,null!==(t=e.ws)&&void 0!==t&&t.on("message",function(t){null!=a&&a.onAudioToText&&a.onAudioToText(JSON.parse(t.data))}),null!=a&&a.onStatusChange&&a.onStatusChange(e.status,"正在实时转化")})},r.prototype.sendMessageToWebSocket=function(t,e){var n,e=e.audioBuffer;t.leftDataList.push(e.getChannelData(0).slice(0)),200<=Date.now()-t.startTime&&(e=this.mergeArray(t.leftDataList),e=Int16Array.from(e.map(function(t){return 0<t?32767*t:32768*t})).buffer,null!==(n=t.ws)&&void 0!==n&&n.send(e),t.startTime=Date.now(),t.leftDataList=[],t.rightDataList=[])},r.prototype.mergeArray=function(t){for(var e=t.length*t[0].length,n=new Float32Array(e),o=0,a=0;a<t.length;a++)n.set(t[a],o),o+=t[a].length;return n},r.prototype.interleaveLeftAndRight=function(t,e){for(var n=t.length+e.length,o=new Float32Array(n),a=0;a<t.length;a++){var r=2*a;o[r]=t[a],o[1+r]=e[a]}return o},r.startAudioToText=function(t,n,o){function e(t){var e;a.ws||a.startConnectWebSocket(a,{params:n,callback:o,audioBuffer:t}),(null===(e=a.ws)||void 0===e?void 0:e.status)===ConnectStatus.OPENED&&a.sendMessageToWebSocket(a,{audioBuffer:t})}var t=t._track,a=new r;a.startTime=Date.now();return t.on("audioBuffer",e),a.audioBufferHandler=e,a.audioTrack=t,a},r.prototype.getStatus=function(){return this.status},r.prototype.stopAudioToText=function(){var t;this.audioTrack&&this.audioBufferHandler&&this.audioTrack.off("audioBuffer",this.audioBufferHandler),null!==(t=this.ws)&&void 0!==t&&t.sendEOS(),this.timeoutJob()},r.prototype.timeoutJob=function(t){var e=this;this.timeoutWebSocketCloseJob=setTimeout(function(){var t;null!==(t=e.ws)&&void 0!==t&&t.close()},t||500)},r}();function compress(i,c){return new Promise(function(a){var r=new Image;r.src=i,r.onload=function(){var t,e,n=c.maxWidth,o=c.maxHeight;r.width*r.height>=n*o?(t=document.createElement("canvas"),n=Math.max(r.width/n,r.height/o),o=r.width/n,n=r.height/n,t.setAttribute("width",o+""),t.setAttribute("height",n+""),null!==(e=t.getContext("2d"))&&void 0!==e&&e.drawImage(r,0,0,o,n),e=t.toDataURL("image/png"),a(e)):a(i)}})}function dataURLToFile(t,e){for(var t=t.split(","),n=t[0].match(/:(.*?);/)[1],o=atob(t[1]),a=o.length,r=new Uint8Array(a);a--;)r[a]=o.charCodeAt(a);return new File([r],e,{type:n})}function blobToBase64(n){return new Promise(function(t){var e=new FileReader;e.readAsDataURL(n),e.onload=function(){t(e.result)}})}var image=Object.freeze({__proto__:null,compress:compress,dataURLToFile:dataURLToFile,blobToBase64:blobToBase64});function init(t,e){store.set("token",t),store.set("signCallback",e)}var Speaker,AudioEncoding,ActionType,VideoType,version="1.1.1";function textToSpeak(t){return post("/voice-tts",__assign({speaker:Speaker.Kefu1,audio_encoding:AudioEncoding.Wav,sample_rate:16e3,volume:50,speed:0},t))}function faceDetector(t,e){t=t._track.getCurrentFrameDataURL();return post("/face-detect",__assign({image_b64:t.replace("data:image/png;base64,","")},e))}function faceComparer(t,n,o){var a=t._track;return __awaiter(this,void 0,void 0,function(){var e;return __generator(this,function(t){return e=a.getCurrentFrameDataURL(),[2,post("/face-compare",__assign({data_uri_a:e,data_uri_b:n},o))]})})}function blobToDataURI(t){return new Promise(function(e,n){var o=new FileReader;o.onload=function(t){e(t.target.result+"")},o.onerror=function(t){n("Failed to read file!\n\n"+o.error)},o.readAsDataURL(t)})}!function(t){t.Male1="male1",t.Male2="male2",t.Female3="female3",t.Male4="male4",t.Female5="female5",t.Female6="female6",t.Kefu1="kefu1",t.Girl1="girl1"}(Speaker=Speaker||{}),function(t){t.Wav="wav",t.Pcm="pcm",t.Mp3="mp3"}(AudioEncoding=AudioEncoding||{}),function(t){t.Nod="nod",t.Shake="shake",t.Blink="blink",t.Mouth="mouth"}(ActionType=ActionType||{}),function(t){t[t.Mp4=1]="Mp4",t[t.H264=2]="H264"}(VideoType=VideoType||{});var FaceActionLiveDetector=function(){function r(){}return r.start=function(t,e,n){var o,a=new r,t=t.createMediaRecorder();(o={})[VideoType.Mp4]="video/mp4",o[VideoType.H264]="video/webm;codecs=h264";return t.constructor.recorderTimeslice=200,t.setMimeType(o[a.video_type]),a.recorder=t,a.recorder.start({videoTrack:e}),a.params=n,a},r.prototype.commit=function(){return __awaiter(this,void 0,void 0,function(){var e,n;return __generator(this,function(t){switch(t.label){case 0:return[4,blobToDataURI(this.recorder.stop())];case 1:return n=t.sent(),e="base64,",e=n.indexOf(e)+e.length,n=n.slice(e),[2,post("/face-actlive",__assign({video_b64:n},this.params))]}})})},r}(),FaceFlashLiveDetector=function(){function a(){}return a.start=function(t,e){var e=e||15,n=new a,o=t._track;return n.frameRate=e,n.videoData=[],n.timer=setInterval(function(){var t=o.getCurrentFrameDataURL().replace("data:image/png;base64,","");n.videoData.push({image:t})},1e3/e),n},a.prototype.commit=function(){return __awaiter(this,void 0,void 0,function(){return __generator(this,function(t){return clearInterval(this.timer),[2,post("/face-flashlive",{video_data:this.videoData})]})})},a}(),commonjsGlobal="undefined"!=typeof globalThis?globalThis:"undefined"!=typeof window?window:"undefined"!=typeof global?global:"undefined"!=typeof self?self:{},conversion={exports:{}},imageConversion=(!function(){function a(t){if(o[t])return o[t].exports;var e=o[t]={i:t,l:!1,exports:{}};return n[t].call(e.exports,e,e.exports,a),e.l=!0,e.exports}var n,o;conversion.exports=(n=[function(o,t,e){var h;function p(e){return["image/png","image/jpeg","image/gif"].some(t=>t===e)}e.r(t),e.d(t,"canvastoDataURL",function(){return v}),e.d(t,"canvastoFile",function(){return r}),e.d(t,"dataURLtoFile",function(){return g}),e.d(t,"dataURLtoImage",function(){return m}),e.d(t,"downloadFile",function(){return i}),e.d(t,"filetoDataURL",function(){return y}),e.d(t,"imagetoCanvas",function(){return b}),e.d(t,"urltoBlob",function(){return s}),e.d(t,"urltoImage",function(){return l}),e.d(t,"compress",function(){return d}),e.d(t,"compressAccurately",function(){return f}),e.d(t,"EImageType",function(){return h}),(e=h=h||{}).PNG="image/png",e.JPEG="image/jpeg",e.GIF="image/gif";var a=function(t,i,c,u){return new(c=c||Promise)(function(n,e){function o(t){try{r(u.next(t))}catch(t){e(t)}}function a(t){try{r(u.throw(t))}catch(t){e(t)}}function r(t){var e;t.done?n(t.value):((e=t.value)instanceof c?e:new c(function(t){t(e)})).then(o,a)}r((u=u.apply(t,i||[])).next())})};function v(t,e=.92,n=h.JPEG){return a(this,void 0,void 0,function*(){return p(n)||(n=h.JPEG),t.toDataURL(n,e)})}function r(t,n=.92,o=h.JPEG){return new Promise(e=>t.toBlob(t=>e(t),o,n))}var c=function(t,i,c,u){return new(c=c||Promise)(function(n,e){function o(t){try{r(u.next(t))}catch(t){e(t)}}function a(t){try{r(u.throw(t))}catch(t){e(t)}}function r(t){var e;t.done?n(t.value):((e=t.value)instanceof c?e:new c(function(t){t(e)})).then(o,a)}r((u=u.apply(t,i||[])).next())})};function g(r,i){return c(this,void 0,void 0,function*(){const t=r.split(",");let e=t[0].match(/:(.*?);/)[1];const n=atob(t[1]);let o=n.length;const a=new Uint8Array(o);for(;o--;)a[o]=n.charCodeAt(o);return p(i)&&(e=i),new Blob([a],{type:e})})}function m(o){return new Promise((t,e)=>{const n=new Image;n.onload=()=>t(n),n.onerror=()=>e(new Error("dataURLtoImage(): dataURL is illegal")),n.src=o})}function i(t,e){const n=document.createElement("a"),o=(n.href=window.URL.createObjectURL(t),n.download=e||Date.now().toString(36),document.body.appendChild(n),document.createEvent("MouseEvents"));o.initEvent("click",!1,!1),n.dispatchEvent(o),document.body.removeChild(n)}function y(n){return new Promise(e=>{const t=new FileReader;t.onloadend=t=>e(t.target.result),t.readAsDataURL(n)})}var u=function(t,i,c,u){return new(c=c||Promise)(function(n,e){function o(t){try{r(u.next(t))}catch(t){e(t)}}function a(t){try{r(u.throw(t))}catch(t){e(t)}}function r(t){var e;t.done?n(t.value):((e=t.value)instanceof c?e:new c(function(t){t(e)})).then(o,a)}r((u=u.apply(t,i||[])).next())})};function b(r,i={}){return u(this,void 0,void 0,function*(){const e=Object.assign({},i),t=document.createElement("canvas"),n=t.getContext("2d");let o,a;for(const r in e)Object.prototype.hasOwnProperty.call(e,r)&&(e[r]=Number(e[r]));if(e.scale){const i=0<e.scale&&e.scale<10?e.scale:1;a=r.width*i,o=r.height*i}else a=e.width||e.height*r.width/r.height||r.width,o=e.height||e.width*r.height/r.width||r.height;switch([5,6,7,8].some(t=>t===e.orientation)?(t.height=a,t.width=o):(t.height=o,t.width=a),e.orientation){case 3:n.rotate(180*Math.PI/180),n.drawImage(r,-t.width,-t.height,t.width,t.height);break;case 6:n.rotate(90*Math.PI/180),n.drawImage(r,0,-t.width,t.height,t.width);break;case 8:n.rotate(270*Math.PI/180),n.drawImage(r,-t.height,0,t.height,t.width);break;case 2:n.translate(t.width,0),n.scale(-1,1),n.drawImage(r,0,0,t.width,t.height);break;case 4:n.translate(t.width,0),n.scale(-1,1),n.rotate(180*Math.PI/180),n.drawImage(r,-t.width,-t.height,t.width,t.height);break;case 5:n.translate(t.width,0),n.scale(-1,1),n.rotate(90*Math.PI/180),n.drawImage(r,0,-t.width,t.height,t.width);break;case 7:n.translate(t.width,0),n.scale(-1,1),n.rotate(270*Math.PI/180),n.drawImage(r,-t.height,0,t.height,t.width);break;default:n.drawImage(r,0,0,t.width,t.height)}return t})}function s(t){return fetch(t).then(t=>t.blob())}function l(o){return new Promise((t,e)=>{const n=new Image;n.onload=()=>t(n),n.onerror=()=>e(new Error("urltoImage(): Image failed to load, please check the image URL")),n.src=o})}var n=function(t,i,c,u){return new(c=c||Promise)(function(n,e){function o(t){try{r(u.next(t))}catch(t){e(t)}}function a(t){try{r(u.throw(t))}catch(t){e(t)}}function r(t){var e;t.done?n(t.value):((e=t.value)instanceof c?e:new c(function(t){t(e)})).then(o,a)}r((u=u.apply(t,i||[])).next())})};function d(a,r={}){return n(this,void 0,void 0,function*(){if(!(a instanceof Blob))throw new Error("compress(): First arg must be a Blob object or a File object.");if((r="object"!=typeof r?Object.assign({quality:r}):r).quality=Number(r.quality),Number.isNaN(r.quality))return a;const t=yield y(a);let e=t.split(",")[0].match(/:(.*?);/)[1],n=h.JPEG;p(r.type)&&(n=r.type,e=r.type);var o=yield g(yield v(yield b(yield m(t),Object.assign({},r)),r.quality,n),e);return o.size>a.size?a:o})}function f(d,f={}){return n(this,void 0,void 0,function*(){if(!(d instanceof Blob))throw new Error("compressAccurately(): First arg must be a Blob object or a File object.");if((f="object"!=typeof f?Object.assign({size:f}):f).size=Number(f.size),Number.isNaN(f.size))return d;if(1024*f.size>d.size)return d;f.accuracy=Number(f.accuracy),(!f.accuracy||f.accuracy<.8||.99<f.accuracy)&&(f.accuracy=.95);const e=f.size*(2-f.accuracy)*1024,n=1024*f.size,o=f.size*f.accuracy*1024,t=yield y(d);let a=t.split(",")[0].match(/:(.*?);/)[1],r=h.JPEG;p(f.type)&&(r=f.type,a=f.type);var l=yield b(yield m(t),Object.assign({},f));let i,c=.5;const u=[null,null];for(let t=1;t<=7;t++){const f=.75*(i=yield v(l,c,r)).length;if(7===t){(e<f||o>f)&&(i=[i,...u].filter(t=>t).sort((t,e)=>Math.abs(.75*t.length-n)-Math.abs(.75*e.length-n))[0]);break}if(e<f)u[1]=i,c-=Math.pow(.5,t+1);else{if(!(o>f))break;u[0]=i,c+=Math.pow(.5,t+1)}}var s=yield g(i,a);return s.size>d.size?d:s})}}],o={},a.m=n,a.c=o,a.d=function(t,e,n){a.o(t,e)||Object.defineProperty(t,e,{enumerable:!0,get:n})},a.r=function(t){"undefined"!=typeof Symbol&&Symbol.toStringTag&&Object.defineProperty(t,Symbol.toStringTag,{value:"Module"}),Object.defineProperty(t,"__esModule",{value:!0})},a.t=function(e,t){if(1&t&&(e=a(e)),8&t)return e;if(4&t&&"object"==typeof e&&e&&e.__esModule)return e;var n=Object.create(null);if(a.r(n),Object.defineProperty(n,"default",{enumerable:!0,value:e}),2&t&&"string"!=typeof e)for(var o in e)a.d(n,o,function(t){return e[t]}.bind(null,o));return n},a.n=function(t){var e=t&&t.__esModule?function(){return t.default}:function(){return t};return a.d(e,"a",e),e},a.o=function(t,e){return Object.prototype.hasOwnProperty.call(t,e)},a.p="",a(a.s=0))}(),conversion.exports),QNAuthoritativeFaceComparer=function(){function t(){}return t.run=function(t,e){t=dataURLToFile(t._track.getCurrentFrameDataURL(),"photo");return imageConversion.compressAccurately(t,24).then(function(t){return blobToBase64(t)}).then(function(t){return post("/face-hdphotoauth",__assign({photo_b64:t.split(",")[1]},e))})},t}(),QNAuthorityActionFaceComparer=function(){function t(){}return t.start=function(t,e,n,o){var a=new this;return a.faceActionLiveDetector=FaceActionLiveDetector.start(t,e,n),a.authoritativeFaceParams=o,a.videoTrack=e,a},t.prototype.commit=function(){return Promise.all([this.faceActionLiveDetector.commit(),QNAuthoritativeFaceComparer.run(this.videoTrack,this.authoritativeFaceParams)]).then(function(t){return{faceActionResult:t[0],authoritativeFaceResult:t[1]}})},t}(),QNOCRDetector=function(){function t(){}return t.run=function(t){return post("/general-ocr",{"data.uri":"data:application/octet-stream;base64,"+t._track.getCurrentFrameDataURL().split(",")[1]})},t}();export{ActionType,AudioEncoding,AudioToTextAnalyzer,FaceActionLiveDetector,FaceFlashLiveDetector,IDCardDetector,image as ImageUtils,QNAuthoritativeFaceComparer,QNAuthorityActionFaceComparer,QNOCRDetector,Speaker,Status,VideoType,defaultAudioToTextParams,faceComparer,faceDetector,init,textToSpeak,version};