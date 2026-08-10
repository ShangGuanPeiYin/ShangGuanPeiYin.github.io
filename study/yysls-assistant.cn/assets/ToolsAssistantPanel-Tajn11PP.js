import{A as ot,T as Vt,r as Lt,i as Bt,e as jt}from"./ToolsAssistantScorePanel-cYaCpR-o.js";import{P as Ot}from"./PanelSectionHeader-COcd7Rtc.js";import{b as qt,c as Ht}from"./yysls-CiJXjblI.js";import{db as Ut,d4 as Yt,bp as Ft,cZ as Xt,az as Wt,cq as Zt,aM as _e,bj as z,dc as He,bo as Gt,c9 as Qt,cw as L,cb as et,c8 as ht,ar as v,a0 as Jt,a2 as b,$ as G,a3 as S,aj as _t,b4 as es,V as lt,cI as rt,dC as ts,dx as ss,t as ns,dA as as,cd as os,dz as Pe,ds as bt,dt as ls,c3 as Re,ae as rs,b_ as it,bN as ut,d1 as is,c2 as xt,bh as us,c5 as $e,ce as h,ax as k,au as f,d0 as O,aH as D,d9 as M,B as he,dB as j,aC as re,av as Je,d as Q,cy as ee,c0 as wt,aw as ie,x as St,du as cs,dv as ds,dk as fs,ct as ps,k as vs}from"./index-C5SFDSbW.js";import{c as gs,N as ms,a as ys}from"./Image-CzQ30uK_.js";import{u as hs}from"./use-merged-state-1MM3A4rf.js";import{N as kt}from"./Empty-B5JVI8hS.js";import{g as ct}from"./cos-image-VQ2MEOAL.js";import{S as _s}from"./Scrollbar-BH17x6AD.js";import{N as dt}from"./Checkbox-D7YQjhtu.js";import{N as bs}from"./Popover-7YqDDnCH.js";import{a as ft}from"./Select-DnQp2sHv.js";import"./AccentBarTitle-md_7b3A1.js";import"./http-DJbRq2ZU.js";import"./use-locale-BVZFgn6J.js";import"./get-BUWcA4DX.js";import"./Suffix-CHlQT4I2.js";import"./FocusDetector-_108vLsZ.js";import"./happens-in-CM8LO42l.js";function xs(e){return Ut(Yt(e).toLowerCase())}var pt=gs(function(e,a,r){return a=a.toLowerCase(),e+(r?xs(a):a)});const Tt=Wt("n-carousel-methods");function ws(e){Zt(Tt,e)}function tt(e="unknown",a="component"){const r=Ft(Tt);return r||Xt(e,`\`${a}\` must be placed inside \`n-carousel\`.`),r}function Ss(){return z("svg",{xmlns:"http://www.w3.org/2000/svg",viewBox:"0 0 16 16"},z("g",{fill:"none"},z("path",{d:"M10.26 3.2a.75.75 0 0 1 .04 1.06L6.773 8l3.527 3.74a.75.75 0 1 1-1.1 1.02l-4-4.25a.75.75 0 0 1 0-1.02l4-4.25a.75.75 0 0 1 1.06-.04z",fill:"currentColor"})))}function ks(){return z("svg",{xmlns:"http://www.w3.org/2000/svg",viewBox:"0 0 16 16"},z("g",{fill:"none"},z("path",{d:"M5.74 3.2a.75.75 0 0 0-.04 1.06L9.227 8L5.7 11.74a.75.75 0 1 0 1.1 1.02l4-4.25a.75.75 0 0 0 0-1.02l-4-4.25a.75.75 0 0 0-1.06-.04z",fill:"currentColor"})))}const Ts=_e({name:"CarouselArrow",setup(e){const{mergedClsPrefixRef:a}=He(e),{isVertical:r,isPrevDisabled:u,isNextDisabled:m,prev:I,next:K}=tt();return{mergedClsPrefix:a,isVertical:r,isPrevDisabled:u,isNextDisabled:m,prev:I,next:K}},render(){const{mergedClsPrefix:e}=this;return z("div",{class:`${e}-carousel__arrow-group`},z("div",{class:[`${e}-carousel__arrow`,this.isPrevDisabled()&&`${e}-carousel__arrow--disabled`],role:"button",onClick:this.prev},Ss()),z("div",{class:[`${e}-carousel__arrow`,this.isNextDisabled()&&`${e}-carousel__arrow--disabled`],role:"button",onClick:this.next},ks()))}}),Cs={total:{type:Number,default:0},currentIndex:{type:Number,default:0},dotType:{type:String,default:"dot"},trigger:{type:String,default:"click"},keyboard:Boolean},Is=_e({name:"CarouselDots",props:Cs,setup(e){const{mergedClsPrefixRef:a}=He(e),r=L([]),u=tt();function m(d,i){switch(d.key){case"Enter":case" ":d.preventDefault(),u.to(i);return}e.keyboard&&$(d)}function I(d){e.trigger==="hover"&&u.to(d)}function K(d){e.trigger==="click"&&u.to(d)}function $(d){var i;if(d.shiftKey||d.altKey||d.ctrlKey||d.metaKey)return;const T=(i=document.activeElement)===null||i===void 0?void 0:i.nodeName.toLowerCase();if(T==="input"||T==="textarea")return;const{code:x}=d,w=x==="PageUp"||x==="ArrowUp",P=x==="PageDown"||x==="ArrowDown",A=x==="PageUp"||x==="ArrowRight",E=x==="PageDown"||x==="ArrowLeft",X=u.isVertical(),J=X?w:A,W=X?P:E;!J&&!W||(d.preventDefault(),J&&!u.isNextDisabled()?(u.next(),C(u.currentIndexRef.value)):W&&!u.isPrevDisabled()&&(u.prev(),C(u.currentIndexRef.value)))}function C(d){var i;(i=r.value[d])===null||i===void 0||i.focus()}return Qt(()=>r.value.length=0),{mergedClsPrefix:a,dotEls:r,handleKeydown:m,handleMouseenter:I,handleClick:K}},render(){const{mergedClsPrefix:e,dotEls:a}=this;return z("div",{class:[`${e}-carousel__dots`,`${e}-carousel__dots--${this.dotType}`],role:"tablist"},Gt(this.total,r=>{const u=r===this.currentIndex;return z("div",{"aria-selected":u,ref:m=>a.push(m),role:"button",tabindex:"0",class:[`${e}-carousel__dot`,u&&`${e}-carousel__dot--active`],key:r,onClick:()=>{this.handleClick(r)},onMouseenter:()=>{this.handleMouseenter(r)},onKeydown:m=>{this.handleKeydown(m,r)}})}))}}),qe="CarouselItem";function Rs(e){var a;return((a=e.type)===null||a===void 0?void 0:a.name)===qe}const $s=_e({name:qe,setup(e){const{mergedClsPrefixRef:a}=He(e),r=tt(pt(qe),`n-${pt(qe)}`),u=L(),m=v(()=>{const{value:i}=u;return i?r.getSlideIndex(i):-1}),I=v(()=>r.isPrev(m.value)),K=v(()=>r.isNext(m.value)),$=v(()=>r.isActive(m.value)),C=v(()=>r.getSlideStyle(m.value));et(()=>{r.addSlide(u.value)}),ht(()=>{r.removeSlide(u.value)});function d(i){const{value:T}=m;T!==void 0&&(r==null||r.onCarouselItemClick(T,i))}return{mergedClsPrefix:a,selfElRef:u,isPrev:I,isNext:K,isActive:$,index:m,style:C,handleClick:d}},render(){var e;const{$slots:a,mergedClsPrefix:r,isPrev:u,isNext:m,isActive:I,index:K,style:$}=this,C=[`${r}-carousel__slide`,{[`${r}-carousel__slide--current`]:I,[`${r}-carousel__slide--prev`]:u,[`${r}-carousel__slide--next`]:m}];return z("div",{ref:"selfElRef",class:C,role:"option",tabindex:"-1","data-index":K,"aria-hidden":!I,style:$,onClickCapture:this.handleClick},(e=a.default)===null||e===void 0?void 0:e.call(a,{isPrev:u,isNext:m,isActive:I,index:K}))}}),Ps=Jt("carousel",`
 position: relative;
 width: 100%;
 height: 100%;
 touch-action: pan-y;
 overflow: hidden;
`,[b("slides",`
 display: flex;
 width: 100%;
 height: 100%;
 transition-timing-function: var(--n-bezier);
 transition-property: transform;
 `,[b("slide",`
 flex-shrink: 0;
 position: relative;
 width: 100%;
 height: 100%;
 outline: none;
 overflow: hidden;
 `,[G("> img",`
 display: block;
 `)])]),b("dots",`
 position: absolute;
 display: flex;
 flex-wrap: nowrap;
 `,[S("dot",[b("dot",`
 height: var(--n-dot-size);
 width: var(--n-dot-size);
 background-color: var(--n-dot-color);
 border-radius: 50%;
 cursor: pointer;
 transition:
 box-shadow .3s var(--n-bezier),
 background-color .3s var(--n-bezier);
 outline: none;
 `,[G("&:focus",`
 background-color: var(--n-dot-color-focus);
 `),S("active",`
 background-color: var(--n-dot-color-active);
 `)])]),S("line",[b("dot",`
 border-radius: 9999px;
 width: var(--n-dot-line-width);
 height: 4px;
 background-color: var(--n-dot-color);
 cursor: pointer;
 transition:
 width .3s var(--n-bezier),
 box-shadow .3s var(--n-bezier),
 background-color .3s var(--n-bezier);
 outline: none;
 `,[G("&:focus",`
 background-color: var(--n-dot-color-focus);
 `),S("active",`
 width: var(--n-dot-line-width-active);
 background-color: var(--n-dot-color-active);
 `)])])]),b("arrow",`
 transition: background-color .3s var(--n-bezier);
 cursor: pointer;
 height: 28px;
 width: 28px;
 display: flex;
 align-items: center;
 justify-content: center;
 background-color: rgba(255, 255, 255, .2);
 color: var(--n-arrow-color);
 border-radius: 8px;
 user-select: none;
 -webkit-user-select: none;
 font-size: 18px;
 `,[G("svg",`
 height: 1em;
 width: 1em;
 `),G("&:hover",`
 background-color: rgba(255, 255, 255, .3);
 `)]),S("vertical",`
 touch-action: pan-x;
 `,[b("slides",`
 flex-direction: column;
 `),S("fade",[b("slide",`
 top: 50%;
 left: unset;
 transform: translateY(-50%);
 `)]),S("card",[b("slide",`
 top: 50%;
 left: unset;
 transform: translateY(-50%) translateZ(-400px);
 `,[S("current",`
 transform: translateY(-50%) translateZ(0);
 `),S("prev",`
 transform: translateY(-100%) translateZ(-200px);
 `),S("next",`
 transform: translateY(0%) translateZ(-200px);
 `)])])]),S("usercontrol",[b("slides",[G(">",[G("div",`
 position: absolute;
 top: 50%;
 left: 50%;
 width: 100%;
 height: 100%;
 transform: translate(-50%, -50%);
 `)])])]),S("left",[b("dots",`
 transform: translateY(-50%);
 top: 50%;
 left: 12px;
 flex-direction: column;
 `,[S("line",[b("dot",`
 width: 4px;
 height: var(--n-dot-line-width);
 margin: 4px 0;
 transition:
 height .3s var(--n-bezier),
 box-shadow .3s var(--n-bezier),
 background-color .3s var(--n-bezier);
 outline: none;
 `,[S("active",`
 height: var(--n-dot-line-width-active);
 `)])])]),b("dot",`
 margin: 4px 0;
 `)]),b("arrow-group",`
 position: absolute;
 display: flex;
 flex-wrap: nowrap;
 `),S("vertical",[b("arrow",`
 transform: rotate(90deg);
 `)]),S("show-arrow",[S("bottom",[b("dots",`
 transform: translateX(0);
 bottom: 18px;
 left: 18px;
 `)]),S("top",[b("dots",`
 transform: translateX(0);
 top: 18px;
 left: 18px;
 `)]),S("left",[b("dots",`
 transform: translateX(0);
 top: 18px;
 left: 18px;
 `)]),S("right",[b("dots",`
 transform: translateX(0);
 top: 18px;
 right: 18px;
 `)])]),S("left",[b("arrow-group",`
 bottom: 12px;
 left: 12px;
 flex-direction: column;
 `,[G("> *:first-child",`
 margin-bottom: 12px;
 `)])]),S("right",[b("dots",`
 transform: translateY(-50%);
 top: 50%;
 right: 12px;
 flex-direction: column;
 `,[S("line",[b("dot",`
 width: 4px;
 height: var(--n-dot-line-width);
 margin: 4px 0;
 transition:
 height .3s var(--n-bezier),
 box-shadow .3s var(--n-bezier),
 background-color .3s var(--n-bezier);
 outline: none;
 `,[S("active",`
 height: var(--n-dot-line-width-active);
 `)])])]),b("dot",`
 margin: 4px 0;
 `),b("arrow-group",`
 bottom: 12px;
 right: 12px;
 flex-direction: column;
 `,[G("> *:first-child",`
 margin-bottom: 12px;
 `)])]),S("top",[b("dots",`
 transform: translateX(-50%);
 top: 12px;
 left: 50%;
 `,[S("line",[b("dot",`
 margin: 0 4px;
 `)])]),b("dot",`
 margin: 0 4px;
 `),b("arrow-group",`
 top: 12px;
 right: 12px;
 `,[G("> *:first-child",`
 margin-right: 12px;
 `)])]),S("bottom",[b("dots",`
 transform: translateX(-50%);
 bottom: 12px;
 left: 50%;
 `,[S("line",[b("dot",`
 margin: 0 4px;
 `)])]),b("dot",`
 margin: 0 4px;
 `),b("arrow-group",`
 bottom: 12px;
 right: 12px;
 `,[G("> *:first-child",`
 margin-right: 12px;
 `)])]),S("fade",[b("slide",`
 position: absolute;
 opacity: 0;
 transition-property: opacity;
 pointer-events: none;
 `,[S("current",`
 opacity: 1;
 pointer-events: auto;
 `)])]),S("card",[b("slides",`
 perspective: 1000px;
 `),b("slide",`
 position: absolute;
 left: 50%;
 opacity: 0;
 transform: translateX(-50%) translateZ(-400px);
 transition-property: opacity, transform;
 `,[S("current",`
 opacity: 1;
 transform: translateX(-50%) translateZ(0);
 z-index: 1;
 `),S("prev",`
 opacity: 0.4;
 transform: translateX(-100%) translateZ(-200px);
 `),S("next",`
 opacity: 0.4;
 transform: translateX(0%) translateZ(-200px);
 `)])])]);function Ns(e){const{length:a}=e;return a>1&&(e.push(vt(e[0],0,"append")),e.unshift(vt(e[a-1],a-1,"prepend"))),e}function vt(e,a,r){return _t(e,{key:`carousel-item-duplicate-${a}-${r}`})}function gt(e,a,r){return a===1?0:r?e===0?a-3:e===a-1?0:e-1:e}function Ge(e,a){return a?e+1:e}function zs(e,a,r){return e<0?null:e===0?r?a-1:null:e-1}function Ks(e,a,r){return e>a-1?null:e===a-1?r?0:null:e+1}function As(e,a){return a&&e>3?e-2:e}function mt(e){return window.TouchEvent&&e instanceof window.TouchEvent}function yt(e,a){let{offsetWidth:r,offsetHeight:u}=e;if(a){const m=getComputedStyle(e);r=r-Number.parseFloat(m.getPropertyValue("padding-left"))-Number.parseFloat(m.getPropertyValue("padding-right")),u=u-Number.parseFloat(m.getPropertyValue("padding-top"))-Number.parseFloat(m.getPropertyValue("padding-bottom"))}return{width:r,height:u}}function Oe(e,a,r){return e<a?a:e>r?r:e}function Ms(e){if(e===void 0)return 0;if(typeof e=="number")return e;const a=/^((\d+)?\.?\d+?)(ms|s)?$/,r=e.match(a);if(r){const[,u,,m="ms"]=r;return Number(u)*(m==="ms"?1:1e3)}return 0}const Es=["transitionDuration","transitionTimingFunction"],Ds=Object.assign(Object.assign({},bt.props),{defaultIndex:{type:Number,default:0},currentIndex:Number,showArrow:Boolean,dotType:{type:String,default:"dot"},dotPlacement:{type:String,default:"bottom"},slidesPerView:{type:[Number,String],default:1},spaceBetween:{type:Number,default:0},centeredSlides:Boolean,direction:{type:String,default:"horizontal"},autoplay:Boolean,interval:{type:Number,default:5e3},loop:{type:Boolean,default:!0},effect:{type:String,default:"slide"},showDots:{type:Boolean,default:!0},trigger:{type:String,default:"click"},transitionStyle:{type:Object,default:()=>({transitionDuration:"300ms"})},transitionProps:Object,draggable:Boolean,prevSlideStyle:[Object,String],nextSlideStyle:[Object,String],touchable:{type:Boolean,default:!0},mousewheel:Boolean,keyboard:Boolean,"onUpdate:currentIndex":Function,onUpdateCurrentIndex:Function});let Qe=!1;const Vs=_e({name:"Carousel",props:Ds,slots:Object,setup(e){const{mergedClsPrefixRef:a,inlineThemeDisabled:r}=He(e),u=L(null),m=L(null),I=L([]),K={value:[]},$=v(()=>e.direction==="vertical"),C=v(()=>$.value?"height":"width"),d=v(()=>$.value?"bottom":"right"),i=v(()=>e.effect==="slide"),T=v(()=>e.loop&&e.slidesPerView===1&&i.value),x=v(()=>e.effect==="custom"),w=v(()=>!i.value||e.centeredSlides?1:e.slidesPerView),P=v(()=>x.value?1:e.slidesPerView),A=v(()=>w.value==="auto"||e.slidesPerView==="auto"&&e.centeredSlides),E=L({width:0,height:0}),X=L(0),J=v(()=>{const{value:s}=I;if(!s.length)return[];X.value;const{value:o}=A;if(o)return s.map(N=>yt(N));const{value:c}=P,{value:y}=E,{value:_}=C;let g=y[_];if(c!=="auto"){const{spaceBetween:N}=e,F=g-(c-1)*N,je=1/Math.max(1,c);g=F*je}const R=Object.assign(Object.assign({},y),{[_]:g});return s.map(()=>R)}),W=v(()=>{const{value:s}=J;if(!s.length)return[];const{centeredSlides:o,spaceBetween:c}=e,{value:y}=C,{[y]:_}=E.value;let g=0;return s.map(({[y]:R})=>{let N=g;return o&&(N+=(R-_)/2),g+=R+c,N})}),Ne=L(!1),be=v(()=>{const{transitionStyle:s}=e;return s?ut(s,Es):{}}),ue=v(()=>x.value?0:Ms(be.value.transitionDuration)),ze=v(()=>{const{value:s}=I;if(!s.length)return[];const o=!(A.value||P.value===1),c=R=>{if(o){const{value:N}=C;return{[N]:`${J.value[R][N]}px`}}};if(x.value)return s.map((R,N)=>c(N));const{effect:y,spaceBetween:_}=e,{value:g}=d;return s.reduce((R,N,F)=>{const je=Object.assign(Object.assign({},c(F)),{[`margin-${g}`]:`${_}px`});return R.push(je),Ne.value&&(y==="fade"||y==="card")&&Object.assign(je,be.value),R},[])}),B=v(()=>{const{value:s}=w,{length:o}=I.value;if(s!=="auto")return Math.max(o-s,0)+1;{const{value:c}=J,{length:y}=c;if(!y)return o;const{value:_}=W,{value:g}=C,R=E.value[g];let N=c[c.length-1][g],F=y;for(;F>1&&N<R;)F--,N+=_[F]-_[F-1];return Oe(F+1,1,y)}}),xe=v(()=>As(B.value,T.value)),Ke=Ge(e.defaultIndex,T.value),te=L(gt(Ke,B.value,T.value)),q=hs(is(e,"currentIndex"),te),H=v(()=>Ge(q.value,T.value));function ne(s){var o,c;s=Oe(s,0,B.value-1);const y=gt(s,B.value,T.value),{value:_}=q;y!==q.value&&(te.value=y,(o=e["onUpdate:currentIndex"])===null||o===void 0||o.call(e,y,_),(c=e.onUpdateCurrentIndex)===null||c===void 0||c.call(e,y,_))}function we(s=H.value){return zs(s,B.value,e.loop)}function Se(s=H.value){return Ks(s,B.value,e.loop)}function Ue(s){const o=l(s);return o!==null&&we()===o&&B.value>1}function Ye(s){const o=l(s);return o!==null&&Se()===o&&B.value>1}function Ae(s){return H.value===l(s)}function Fe(s){return q.value===s}function Me(){return we()===null}function Ee(){return Se()===null}let ae=0;function oe(s){const o=Oe(Ge(s,T.value),0,B.value);(s!==q.value||o!==H.value)&&ne(o)}function pe(){const s=we();s!==null&&(ae=-1,ne(s))}function ce(){const s=Se();s!==null&&(ae=1,ne(s))}let U=!1;function Xe(){(!U||!T.value)&&pe()}function We(){(!U||!T.value)&&ce()}let se=0;const ke=L({});function ve(s,o=0){ke.value=Object.assign({},be.value,{transform:$.value?`translateY(${-s}px)`:`translateX(${-s}px)`,transitionDuration:`${o}ms`})}function de(s=0){i.value?Te(H.value,s):se!==0&&(!U&&s>0&&(U=!0),ve(se=0,s))}function Te(s,o){const c=Ce(s);c!==se&&o>0&&(U=!0),se=Ce(H.value),ve(c,o)}function Ce(s){let o;return s>=B.value-1?o=De():o=W.value[s]||0,o}function De(){if(w.value==="auto"){const{value:s}=C,{[s]:o}=E.value,{value:c}=W,y=c[c.length-1];let _;if(y===void 0)_=o;else{const{value:g}=J;_=y+g[g.length-1][s]}return _-o}else{const{value:s}=W;return s[B.value-1]||0}}const fe={currentIndexRef:q,to:oe,prev:Xe,next:We,isVertical:()=>$.value,isHorizontal:()=>!$.value,isPrev:Ue,isNext:Ye,isActive:Ae,isPrevDisabled:Me,isNextDisabled:Ee,getSlideIndex:l,getSlideStyle:p,addSlide:n,removeSlide:t,onCarouselItemClick:Ct};ws(fe);function n(s){s&&I.value.push(s)}function t(s){if(!s)return;const o=l(s);o!==-1&&I.value.splice(o,1)}function l(s){return typeof s=="number"?s:s?I.value.indexOf(s):-1}function p(s){const o=l(s);if(o!==-1){const c=[ze.value[o]],y=fe.isPrev(o),_=fe.isNext(o);return y&&c.push(e.prevSlideStyle||""),_&&c.push(e.nextSlideStyle||""),xt(c)}}let V=0,Y=0,Z=0,Ie=0,le=!1,Ze=!1;function Ct(s,o){let c=!U&&!le&&!Ze;e.effect==="card"&&c&&!Ae(s)&&(oe(s),c=!1),c||(o.preventDefault(),o.stopPropagation())}let Ve=null;function Le(){Ve&&(clearInterval(Ve),Ve=null)}function ge(){Le(),!e.autoplay||xe.value<2||(Ve=window.setInterval(ce,e.interval))}function st(s){var o;if(Qe||!(!((o=m.value)===null||o===void 0)&&o.contains(us(s))))return;Qe=!0,le=!0,Ze=!1,Ie=Date.now(),Le(),s.type!=="touchstart"&&!s.target.isContentEditable&&s.preventDefault();const c=mt(s)?s.touches[0]:s;$.value?Y=c.clientY:V=c.clientX,e.touchable&&($e("touchmove",document,Be),$e("touchend",document,me),$e("touchcancel",document,me)),e.draggable&&($e("mousemove",document,Be),$e("mouseup",document,me))}function Be(s){const{value:o}=$,{value:c}=C,y=mt(s)?s.touches[0]:s,_=o?y.clientY-Y:y.clientX-V,g=E.value[c];Z=Oe(_,-g,g),s.cancelable&&s.preventDefault(),i.value&&ve(se-Z,0)}function me(){const{value:s}=H;let o=s;if(!U&&Z!==0&&i.value){const c=se-Z,y=[...W.value.slice(0,B.value-1),De()];let _=null;for(let g=0;g<y.length;g++){const R=Math.abs(y[g]-c);if(_!==null&&_<R)break;_=R,o=g}}if(o===s){const c=Date.now()-Ie,{value:y}=C,_=E.value[y];Z>_/2||Z/c>.4?pe():(Z<-_/2||Z/c<-.4)&&ce()}o!==null&&o!==s?(Ze=!0,ne(o),it(()=>{(!T.value||te.value!==q.value)&&de(ue.value)})):de(ue.value),nt(),ge()}function nt(){le&&(Qe=!1),le=!1,V=0,Y=0,Z=0,Ie=0,Re("touchmove",document,Be),Re("touchend",document,me),Re("touchcancel",document,me),Re("mousemove",document,Be),Re("mouseup",document,me)}function It(){if(i.value&&U){const{value:s}=H;Te(s,0)}else ge();i.value&&(ke.value.transitionDuration="0ms"),U=!1}function Rt(s){if(s.preventDefault(),U)return;let{deltaX:o,deltaY:c}=s;s.shiftKey&&!o&&(o=c);const y=-1,_=1,g=(o||c)>0?_:y;let R=0,N=0;$.value?N=g:R=g;const F=10;(N*c>=F||R*o>=F)&&(g===_&&!Ee()?ce():g===y&&!Me()&&pe())}function $t(){E.value=yt(u.value,!0),ge()}function Pt(){A.value&&X.value++}function Nt(){e.autoplay&&Le()}function zt(){e.autoplay&&ge()}et(()=>{as(ge),requestAnimationFrame(()=>Ne.value=!0)}),ht(()=>{nt(),Le()}),os(()=>{const{value:s}=I,{value:o}=K,c=new Map,y=g=>c.has(g)?c.get(g):-1;let _=!1;for(let g=0;g<s.length;g++){const R=o.findIndex(N=>N.el===s[g]);R!==g&&(_=!0),c.set(s[g],R)}_&&s.sort((g,R)=>y(g)-y(R))}),Pe(H,(s,o)=>{if(s===o){ae=0;return}if(ge(),i.value){if(T.value){const{value:c}=B;ae===-1&&o===1&&s===c-2?s=0:ae===1&&o===c-2&&s===1&&(s=c-1)}Te(s,ue.value)}else de();ae=0},{immediate:!0}),Pe([T,w],()=>void it(()=>{ne(H.value)})),Pe(W,()=>{i.value&&de()},{deep:!0}),Pe(i,s=>{s?de():(U=!1,ve(se=0))});const Kt=v(()=>({onTouchstartPassive:e.touchable?st:void 0,onMousedown:e.draggable?st:void 0,onWheel:e.mousewheel?Rt:void 0})),At=v(()=>Object.assign(Object.assign({},ut(fe,["to","prev","next","isPrevDisabled","isNextDisabled"])),{total:xe.value,currentIndex:q.value})),Mt=v(()=>({total:xe.value,currentIndex:q.value,to:fe.to})),Et={getCurrentIndex:()=>q.value,to:oe,prev:pe,next:ce},Dt=bt("Carousel","-carousel",Ps,rs,e,a),at=v(()=>{const{common:{cubicBezierEaseInOut:s},self:{dotSize:o,dotColor:c,dotColorActive:y,dotColorFocus:_,dotLineWidth:g,dotLineWidthActive:R,arrowColor:N}}=Dt.value;return{"--n-bezier":s,"--n-dot-color":c,"--n-dot-color-focus":_,"--n-dot-color-active":y,"--n-dot-size":o,"--n-dot-line-width":g,"--n-dot-line-width-active":R,"--n-arrow-color":N}}),ye=r?ls("carousel",void 0,at,e):void 0;return Object.assign(Object.assign({mergedClsPrefix:a,selfElRef:u,slidesElRef:m,slideVNodes:K,duplicatedable:T,userWantsControl:x,autoSlideSize:A,realIndex:H,slideStyles:ze,translateStyle:ke,slidesControlListeners:Kt,handleTransitionEnd:It,handleResize:$t,handleSlideResize:Pt,handleMouseenter:Nt,handleMouseleave:zt,isActive:Fe,arrowSlotProps:At,dotSlotProps:Mt},Et),{cssVars:r?void 0:at,themeClass:ye==null?void 0:ye.themeClass,onRender:ye==null?void 0:ye.onRender})},render(){var e;const{mergedClsPrefix:a,showArrow:r,userWantsControl:u,slideStyles:m,dotType:I,dotPlacement:K,slidesControlListeners:$,transitionProps:C={},arrowSlotProps:d,dotSlotProps:i,$slots:{default:T,dots:x,arrow:w}}=this,P=T&&es(T())||[];let A=Ls(P);return A.length||(A=P.map(E=>z($s,null,{default:()=>_t(E)}))),this.duplicatedable&&(A=Ns(A)),this.slideVNodes.value=A,this.autoSlideSize&&(A=A.map(E=>z(lt,{onResize:this.handleSlideResize},{default:()=>E}))),(e=this.onRender)===null||e===void 0||e.call(this),z("div",Object.assign({ref:"selfElRef",class:[this.themeClass,`${a}-carousel`,this.direction==="vertical"&&`${a}-carousel--vertical`,this.showArrow&&`${a}-carousel--show-arrow`,`${a}-carousel--${K}`,`${a}-carousel--${this.direction}`,`${a}-carousel--${this.effect}`,u&&`${a}-carousel--usercontrol`],style:this.cssVars},$,{onMouseenter:this.handleMouseenter,onMouseleave:this.handleMouseleave}),z(lt,{onResize:this.handleResize},{default:()=>z("div",{ref:"slidesElRef",class:`${a}-carousel__slides`,role:"listbox",style:this.translateStyle,onTransitionend:this.handleTransitionEnd},u?A.map((E,X)=>z("div",{style:m[X],key:X},ts(z(ns,Object.assign({},C),{default:()=>E}),[[ss,this.isActive(X)]]))):A)}),this.showDots&&i.total>1&&rt(x,i,()=>[z(Is,{key:I+K,total:i.total,currentIndex:i.currentIndex,dotType:I,trigger:this.trigger,keyboard:this.keyboard})]),r&&rt(w,d,()=>[z(Ts,null)]))}});function Ls(e){return e.reduce((a,r)=>(Rs(r)&&a.push(r),a),[])}const Bs={class:"tools-assistant-recruit-panel"},js={class:"tools-assistant-recruit-panel__content","aria-label":"相关服务"},Os={key:0,class:"tools-assistant-recruit-panel__state"},qs={key:1,class:"tools-assistant-recruit-panel__state tools-assistant-recruit-panel__state--error"},Hs={key:3,class:"tools-assistant-recruit-panel__list"},Us={class:"tools-assistant-recruit-panel__type-badges"},Ys={key:0,class:"tools-assistant-recruit-panel__type-badge tools-assistant-recruit-panel__type-badge--default"},Fs={class:"tools-assistant-recruit-panel__contact"},Xs=["innerHTML"],Ws={key:2,class:"tools-assistant-recruit-panel__remark"},Zs=_e({__name:"ToolsAssistantRecruitPanel",setup(e){const a=L(!1),r=L(""),u=L([]),m=L([]),I=v(()=>new Map(m.value.map(i=>[i.value,i.label])));function K(i){return I.value.get(i)??String(i)}function $(i){return i===1||i===2||i===3?`tools-assistant-recruit-panel__type-badge--${i}`:"tools-assistant-recruit-panel__type-badge--default"}function C(i){const T=i==null?void 0:i.trim();if(!T)return[];const x=T.replace(/^\[\s*'/,'["').replace(/'\s*\]$/,'"]').replace(/'\s*,\s*'/g,'","');try{const w=JSON.parse(x);return Array.isArray(w)?w.filter(P=>typeof P=="string").map(P=>P.trim()).filter(P=>/^https?:\/\/\S+$/i.test(P)):[]}catch{return[]}}async function d(){a.value=!0,r.value="";try{const[i,T]=await Promise.all([qt(),Ht()]);u.value=i,m.value=T}catch(i){r.value=i instanceof Error?i.message:"加载失败"}finally{a.value=!1}}return et(()=>{d()}),(i,T)=>(h(),k("aside",Bs,[T[1]||(T[1]=f("section",{class:"tools-assistant-recruit-panel__intro"},[f("h4",null,"写在前面"),f("p",null,"1.如果现有工具不能满足少侠的需求，可以联系以下相关博主获取对应服务。"),f("p",null,"2.以下内容皆为相关博主提供，本网站仅负责信息的展示与发布，不对内容的真实性、准确性、完整性、合法性或有效性作任何形式的明示或暗示的保证。")],-1)),f("section",js,[a.value?(h(),k("div",Os,"加载中...")):r.value?(h(),k("div",qs,[f("p",null,O(r.value),1),D(M(he),{secondary:"",onClick:d},{default:j(()=>[...T[0]||(T[0]=[re("重试",-1)])]),_:1})])):u.value.length?(h(),k("div",Hs,[(h(!0),k(Q,null,ee(u.value,x=>{var w;return h(),k("article",{key:x.id,class:"tools-assistant-recruit-panel__item"},[f("div",Us,[(h(!0),k(Q,null,ee(x.types,P=>(h(),k("span",{key:P,class:wt(["tools-assistant-recruit-panel__type-badge",$(P)])},O(K(P)),3))),128)),(w=x.types)!=null&&w.length?ie("",!0):(h(),k("span",Ys," - "))]),f("h5",null,O(x.title),1),f("div",Fs,O(x.contact||"-"),1),C(x.remark).length?(h(),Je(M(ys),{key:0},{default:j(()=>[D(M(Vs),{class:"tools-assistant-recruit-panel__image-carousel","show-arrow":""},{default:j(()=>[(h(!0),k(Q,null,ee(C(x.remark),P=>(h(),k("div",{key:P,class:"tools-assistant-recruit-panel__image-slide"},[D(M(ms),{src:P,"object-fit":"cover","preview-object-fit":"contain",class:"tools-assistant-recruit-panel__image"},null,8,["src"])]))),128))]),_:2},1024)]),_:2},1024)):ie("",!0),x.content?(h(),k("div",{key:1,class:"tools-assistant-recruit-panel__rich-content",innerHTML:x.content},null,8,Xs)):ie("",!0),x.remark&&!C(x.remark).length?(h(),k("div",Ws," 备注："+O(x.remark),1)):ie("",!0)])}),128))])):(h(),Je(M(kt),{key:2,description:"暂无招募信息"}))])]))}}),Gs=St(Zs,[["__scopeId","data-v-95dff147"]]),Qs={class:"tools-assistant-panel"},Js={key:0,class:"tools-assistant-panel__empty-state"},en={key:1,class:"tools-assistant-panel__layout"},tn={class:"tools-assistant-panel__left-column"},sn={class:"tools-assistant-panel__card-section"},nn={class:"tools-assistant-panel__section-head"},an={class:"mr20px"},on={class:"tools-assistant-panel__card-list"},ln=["onClick"],rn=["src","alt"],un={key:0,class:"tools-assistant-panel__editor-section"},cn={class:"tools-assistant-panel__section-head tools-assistant-panel__section-head--editor"},dn={class:"w100% flex justify-between"},fn={class:"tools-assistant-panel__score-summary"},pn={class:"tools-assistant-panel__score-summary-text"},vn={class:"tools-assistant-panel__score-tooltip"},gn={class:"tools-assistant-panel__score-tooltip-row"},mn={class:"tools-assistant-panel__score-tooltip-values"},yn={class:"tools-assistant-panel__score-tooltip-row"},hn={class:"tools-assistant-panel__score-tooltip-value"},_n={class:"tools-assistant-panel__score-tooltip-section"},bn={class:"tools-assistant-panel__score-tooltip-row"},xn={class:"tools-assistant-panel__score-tooltip-value"},wn={key:0,class:"tools-assistant-panel__score-tooltip-section tools-assistant-panel__score-tooltip-section--transfer"},Sn={class:"tools-assistant-panel__score-tooltip-value"},kn={key:1,class:"tools-assistant-panel__score-summary-text"},Tn={class:"tools-assistant-panel__editor-main"},Cn={class:"tools-assistant-panel__row tools-assistant-panel__row--first"},In={class:"tools-assistant-panel__label"},Rn={class:"tools-assistant-panel__secondary-field"},$n={class:"w100% flex mt20px justify-between"},Pn={class:"flex"},Nn={class:"tools-assistant-panel__usage-title"},zn={class:"tools-assistant-panel__usage-items"},Kn={key:0,class:"tools-assistant-panel__usage-note"},An={class:"tools-assistant-panel__usage-modal-footer"},Mn=_e({__name:"ToolsAssistantPanel",setup(e){const a={T0:4,T1:3,T2:2,T3:1},r=[{title:"写在前面（叠甲）",items:["1. 本功能仅供参考，最终评分结果需根据自身实际需要调整。","2. 本功能更适合有一定养成基础的玩家使用，萌新玩家优先穿齐一身金装！","3. 本功能旨在帮助玩家更高效地评估和选择装备。","4. 装备评分基于PVE输出相关和有效词条计算，仅针对PVE玩法。","5. 如果对本功能有好的建议，欢迎加入交流群反馈讨论。 "]},{title:"快速上手",items:["1. 先选择装备部位，再切换金装 / 紫装品质。","2. 选定首词条后，系统会立即开始计算装备潜力。","3. 继续补齐 4 个副词条；如果需要模拟转律，可勾选其中 1 个副词条的“转律”。","4. 左上角会实时显示当前最高档潜力，右侧会展示对应的详细评分结果。","5. 如果需要同步到装备仓库，可点击“保存装备”写入装备仓库。"]},{title:"装备潜力",items:["首词条选中后，未选择的副词条会按“未来可补任意合法词条”参与预测。","装备潜力会一并考虑一次副词条转律，因此未选满词条时也可能提前看到更高档位。","顶部只展示当前全局最高档；如果多个分类同档并列，会合并为“n种分支-对应评价”。","问号悬浮中会显示玩法体系、适用流派，以及达到该结果所需的转律建议。"],note:"词条未选满时属于预测结果，仅供参考。"},{title:"转律规则",items:["每件装备仅允许 1 个副词条参与转律，首词条不参与转律。","如果手动勾选了某个副词条的“转律”，系统只计算这一个词条的转律结果。","如果没有勾选“转律”，系统会按当前已选副词条自动模拟一次可行转律。"]},{title:"结果怎么看",items:["防具、饰品会分为“转律前 / 转律后”两类结果。","武器只展示“主武器 / 副武器”结果","右侧每张结果卡会展示玩法体系、评价、位置、适用流派，以及需要时的转律建议。","如果当前处于词条预测阶段，右侧需要转律的位置会显示“调律未完成”。"]},{title:"评分含义",items:Object.entries(ot).map(([n,t])=>`${n}：${t}`),note:"以上评分均为主观评分，需根据自身实际需要调整。"},{title:"评分逻辑（仅供参考）",items:["小外流刚需 12小外 8敏 和 5神力，三率合格的情况下，大本属 > 小本属 > 小外属","根据先琢的改动，双切均增加了精准率和会心率的需求","鸣金兄弟：鸣金兄弟当前版本不需要会心和精准率，词条几乎全定制，很难做，8势更重要"]}],u=cs(),m=ds(),I=fs(),K=L(!1),$=L(!1),C=L(""),d=ps(Ke()),i=v(()=>K.value?0:1),T=v(()=>i.value===0?"紫装":"金装"),x=v(()=>{const n=u.equipmentList.filter(l=>l.type==="weapon"),t=u.equipmentList.filter(l=>l.type!=="weapon");return[...n,...t].map(l=>({key:l.key,name:l.name,type:l.type,cardSrc:q(l.key)}))}),w=v(()=>u.getEquipmentListItem(C.value)),P=v(()=>{var n;return(((n=w.value)==null?void 0:n.firstTuningKeys)??[]).map(t=>({label:u.getKeyName(t,t),value:t}))}),A=v(()=>({equipmentKey:C.value,quality:i.value,firstTuningKey:d.firstTuningKey,secondaryTuningKeys:[...d.secondaryTuningKeys],transferMarkedSecondaryIndex:d.transferMarkedSecondaryIndex})),E=v(()=>jt(A.value,w.value)),X=v(()=>{var n;return((n=w.value)==null?void 0:n.type)==="weapon"}),J=v(()=>Bt(A.value)),W=v(()=>E.value.baseResult.hits),Ne=v(()=>E.value.scoreResult),be=v(()=>"暂无潜力"),ue=v(()=>de(W.value)),ze=v(()=>ve(ue.value)),B=v(()=>!!d.firstTuningKey&&d.secondaryTuningKeys.every(n=>!!n)),xe=v(()=>w.value?(i.value===1?w.value.initialAttrs.golden:w.value.initialAttrs.purple).map(t=>({key:t.key,label:u.getKeyName(t.key,t.key),value:u.stringifyAttrValue(t)})):[]);Pe(x,n=>{if(!n.length){C.value="",te();return}n.some(t=>t.key===C.value)||(C.value=n[0].key,te())},{immediate:!0});function Ke(){return{firstTuningKey:null,secondaryTuningKeys:Array.from({length:4},()=>null),transferMarkedSecondaryIndex:null}}function te(){Object.assign(d,Ke())}function q(n){return n?ct(`equipment/cards/${n}.png`):""}function H(){const n=i.value===0?"purple":"golden";return ct(`equipment/cards/${n}.png`)}function ne(){return{backgroundImage:`url(${H()})`}}function we(n){n!==C.value&&(C.value=n,te())}function Se(n){d.firstTuningKey=n??null}function Ue(n,t){d.secondaryTuningKeys[n]=t??null,!d.secondaryTuningKeys[n]&&d.transferMarkedSecondaryIndex===n&&(d.transferMarkedSecondaryIndex=null)}function Ye(n){return Lt(w.value,d.secondaryTuningKeys,n).map(t=>({label:u.getKeyName(t,t),value:t}))}function Ae(n){return d.transferMarkedSecondaryIndex===n}function Fe(n){return d.secondaryTuningKeys[n]?d.transferMarkedSecondaryIndex!==null&&d.transferMarkedSecondaryIndex!==n:!0}function Me(n,t){d.transferMarkedSecondaryIndex=t?n:null}function Ee(){te()}function ae(){te()}function oe(n){return n?u.getKeyName(n,n):"未选择"}function pe(n){return n.length?n.map(t=>U(t)).join(" / "):"无适用流派"}function ce(n){return[n.branchKey,n.subBranchKey,n.weaponRoleKey??""].join("|")}function U(n){const t=u.getMartialMeta(n);return t!=null&&t.buildKey?`${u.getBuildName(t.buildKey)}-${u.getMartialName(n)}`:u.getBuildName(n)}function Xe(n){return[n.branchLabel,n.subBranchLabel,n.weaponRoleLabel].filter(t=>!!t)}function We(n){return n.some(t=>t.requiresTransfer)?J.value?Array.from(new Set(n.filter(t=>t.requiresTransfer).map(t=>se(t)))):["调律未完成"]:[]}function se(n){var l;if(!((l=n.transferSuggestions)!=null&&l.length))return typeof n.transferSourceIndex!="number"?"需要转律后命中":`副词条${n.transferSourceIndex+1}，${oe(n.transferFromKey??null)} -> ${oe(n.transferToKey??null)}`;const t=new Map;return n.transferSuggestions.forEach(p=>{const V=`${p.sourceIndex}|${p.fromKey}`,Y=t.get(V);if(!Y){t.set(V,{sourceIndex:p.sourceIndex,fromKey:p.fromKey,toKeys:[p.toKey]});return}Y.toKeys.includes(p.toKey)||Y.toKeys.push(p.toKey)}),Array.from(t.values()).map(p=>`副词条${p.sourceIndex+1}，${oe(p.fromKey)} -> ${p.toKeys.map(V=>oe(V)).join(" / ")}`).join("；")}function ke(n){if(!n.length)return[];const t=Math.max(...n.map(l=>a[l.tier]));return n.filter(l=>a[l.tier]===t)}function ve(n){const t=n[0];return t?n.length===1?t.scoreLabel:`${n.length}种分支-${t.scoreLabel}`:""}function de(n){const t=new Map;return ke(n).forEach(l=>{const p=ce(l);t.set(p,[...t.get(p)??[],l])}),Array.from(t.entries()).flatMap(([l,p])=>{const Y=p.filter(le=>!le.requiresTransfer)[0]??p[0];if(!Y)return[];const Z=Array.from(new Set(p.flatMap(le=>le.buildKeys))),Ie=We(p);return{key:l,tier:Y.tier,scoreLabel:ot[Y.tier],playstyleItems:Xe(Y),applicableLabel:pe(Z),transferLabels:Ie}})}function Te(n){const t=u.getTuningMeta(n),l=(t==null?void 0:t.baseValue)??(t==null?void 0:t.maxValue)??null;return l===null?null:{key:n,value:Number(l)}}function Ce(n){return n.filter(t=>!!t).map(t=>Te(t)).filter(t=>!!t)}function De(n){if(d.transferMarkedSecondaryIndex===null)return null;const l=d.secondaryTuningKeys.map((p,V)=>({key:p,index:V})).filter(p=>!!p.key).findIndex(p=>p.index===d.transferMarkedSecondaryIndex);return l>=0&&l<n.length?l:null}function fe(){var p;if(!u.ready){I.warning("装备元数据仍在加载");return}if(!m.activeRole){I.warning("请先选择角色");return}if(!w.value){I.warning("请选择装备");return}if(!B.value){I.warning("请先选满首词条和全部副词条");return}const n=d.firstTuningKey?Ce([d.firstTuningKey]):[],t=Ce(d.secondaryTuningKeys),l=i.value===1?w.value.initialAttrs.golden:w.value.initialAttrs.purple;m.upsertEquipmentItem({groups:(p=m.activeBuild)!=null&&p.key?[m.activeBuild.key]:[],buildIds:[],roleId:m.activeRole.roleId,planIds:[],equipmentKey:w.value.key,equipmentName:w.value.name,quality:i.value,attr:l.map(V=>({...V})),firstTuning:n,secondaryTuning:t,isChengyin:!1,transferMarkedSecondaryIndex:De(t),pitch:[],type:w.value.type,tuningTimes:null}),I.success(`已保存 ${w.value.name} 到装备仓库`)}return(n,t)=>(h(),k("section",Qs,[D(Ot,{eyebrow:"Assistant",title:"调律助手",class:"tools-assistant-panel__header"},{actions:j(()=>[D(M(he),{tertiary:"",round:"",class:"w90px h30px text-14px font700",onClick:t[0]||(t[0]=l=>$.value=!0)},{default:j(()=>[...t[5]||(t[5]=[re("使用说明",-1)])]),_:1})]),_:1}),x.value.length?(h(),k("div",en,[f("div",tn,[f("section",sn,[f("div",nn,[t[7]||(t[7]=f("div",null,[f("h4",null,"选择装备类型")],-1)),f("div",an,[t[6]||(t[6]=f("span",{class:"mr10px"},"是否紫装",-1)),D(M(dt),{checked:K.value,"onUpdate:checked":t[1]||(t[1]=l=>K.value=l)},null,8,["checked"])])]),f("div",on,[(h(!0),k(Q,null,ee(x.value,l=>(h(),k("div",{key:l.key,class:wt(["tools-assistant-panel__card",{"tools-assistant-panel__card--active":l.key===C.value}]),onClick:p=>we(l.key)},[f("div",{class:"tools-assistant-panel__card-frame",style:xt(ne())},[f("img",{src:l.cardSrc,alt:l.name,class:"tools-assistant-panel__card-image",decoding:"async",loading:"lazy",fetchpriority:"low"},null,8,rn)],4)],10,ln))),128))])]),w.value?(h(),k("section",un,[f("div",cn,[f("div",dn,[f("h4",null,O(w.value.name),1),f("div",fn,[ue.value.length?(h(),k(Q,{key:0},[f("span",pn,"装备潜力："+O(ze.value),1),D(M(bs),{trigger:"hover",raw:"",placement:"bottom-end","show-arrow":!1},{trigger:j(()=>[...t[8]||(t[8]=[f("span",{class:"tools-assistant-panel__score-help"},"?",-1)])]),default:j(()=>[f("div",vn,[(h(!0),k(Q,null,ee(ue.value,l=>(h(),k("div",{key:`tooltip-${l.key}`,class:"tools-assistant-panel__score-tooltip-item"},[f("div",gn,[t[9]||(t[9]=f("span",{class:"tools-assistant-panel__score-tooltip-label"},"玩法体系：",-1)),f("div",mn,[(h(!0),k(Q,null,ee(l.playstyleItems,p=>(h(),k("span",{key:`${l.key}-${p}`,class:"tools-assistant-panel__score-tooltip-tag"},O(p),1))),128))])]),f("div",yn,[t[10]||(t[10]=f("span",{class:"tools-assistant-panel__score-tooltip-label"},"评价：",-1)),f("span",hn,O(l.scoreLabel),1)]),f("div",_n,[f("div",bn,[t[11]||(t[11]=f("span",{class:"tools-assistant-panel__score-tooltip-label"},"适用流派：",-1)),f("span",xn,O(l.applicableLabel),1)])]),l.transferLabels.length?(h(),k("div",wn,[t[13]||(t[13]=f("div",{class:"tools-assistant-panel__score-tooltip-subtitle"},"转律建议",-1)),(h(!0),k(Q,null,ee(l.transferLabels,p=>(h(),k("div",{key:p,class:"tools-assistant-panel__score-tooltip-row"},[t[12]||(t[12]=f("span",{class:"tools-assistant-panel__score-tooltip-label"},"内容：",-1)),f("span",Sn,O(p),1)]))),128))])):ie("",!0)]))),128)),t[14]||(t[14]=f("p",{class:"tools-assistant-panel__score-tooltip-note"}," 以上评分均为主观评分，需根据自身实际需要调整 ",-1))])]),_:1})],64)):(h(),k("span",kn,"装备潜力："+O(be.value),1))])])]),f("div",Tn,[f("div",Cn,[t[15]||(t[15]=f("label",{class:"tools-assistant-panel__label"},"首词条",-1)),D(M(ft),{value:d.firstTuningKey,options:P.value,clearable:"",filterable:"",placeholder:"请选择首词条","onUpdate:value":t[2]||(t[2]=l=>Se(l))},null,8,["value","options"])]),(h(!0),k(Q,null,ee(d.secondaryTuningKeys,(l,p)=>(h(),k("div",{key:`${C.value}-${p}`,class:"tools-assistant-panel__row"},[f("label",In,"副词条"+O(p+1),1),f("div",Rn,[D(M(ft),{class:"flex-shrink-1 mr6px",value:l,options:Ye(p),clearable:"",filterable:"",placeholder:`请选择副词条${p+1}`,"onUpdate:value":V=>Ue(p,V)},null,8,["value","options","placeholder","onUpdate:value"]),D(M(dt),{class:"tools-assistant-panel__transfer-check",checked:Ae(p),disabled:Fe(p),"onUpdate:checked":V=>Me(p,V)},{default:j(()=>[...t[16]||(t[16]=[re(" 转律 ",-1)])]),_:1},8,["checked","disabled","onUpdate:checked"])])]))),128)),f("div",$n,[f("div",Pn,[D(M(he),{class:"mr20px",secondary:"",onClick:Ee},{default:j(()=>[...t[17]||(t[17]=[re("重置",-1)])]),_:1}),D(M(he),{tertiary:"",type:"warning",onClick:ae},{default:j(()=>[...t[18]||(t[18]=[re("下一件",-1)])]),_:1})]),D(M(he),{type:"warning",disabled:!B.value,onClick:fe},{default:j(()=>[...t[19]||(t[19]=[re("保存到装备仓库",-1)])]),_:1},8,["disabled"])])])])):ie("",!0)]),w.value?(h(),Je(Vt,{key:0,"equipment-name":w.value.name,"preview-src":q(w.value.key),"frame-style":ne(),"quality-label":T.value,"base-attrs":xe.value,"score-result":Ne.value,"is-weapon-equipment":X.value,"is-prediction":!J.value},null,8,["equipment-name","preview-src","frame-style","quality-label","base-attrs","score-result","is-weapon-equipment","is-prediction"])):ie("",!0),D(Gs)])):(h(),k("div",Js,[D(M(kt),{description:M(u).ready?"当前没有可用装备元数据":"装备元数据加载中"},null,8,["description"])])),D(M(vs),{show:$.value,"onUpdate:show":t[4]||(t[4]=l=>$.value=l),preset:"card",class:"tools-assistant-panel__usage-modal",bordered:!1},{header:j(()=>[...t[20]||(t[20]=[re("使用说明",-1)])]),footer:j(()=>[f("div",An,[D(M(he),{type:"warning",onClick:t[3]||(t[3]=l=>$.value=!1)},{default:j(()=>[...t[21]||(t[21]=[re("确认",-1)])]),_:1})])]),default:j(()=>[D(M(_s),{style:{"max-height":"640px"},class:"tools-assistant-panel__usage-modal-body"},{default:j(()=>[(h(),k(Q,null,ee(r,l=>f("section",{key:l.title,class:"tools-assistant-panel__usage-section mt20px"},[f("h5",Nn,O(l.title),1),f("div",zn,[(h(!0),k(Q,null,ee(l.items,p=>(h(),k("p",{key:`${l.title}-${p}`,class:"tools-assistant-panel__usage-item"},O(p),1))),128))]),l.note?(h(),k("p",Kn,O(l.note),1)):ie("",!0)])),64))]),_:1})]),_:1},8,["show"])]))}}),ta=St(Mn,[["__scopeId","data-v-74aa4c94"]]);export{ta as default};
