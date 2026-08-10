import{aM as xe,b_ as hn,bj as v,cz as lt,cb as Ge,cw as A,dq as it,cC as nn,dz as Re,c8 as On,cx as ze,bp as Rn,di as tn,f as at,t as Fn,a0 as $,a2 as E,a3 as U,$ as ne,a4 as Oe,a$ as Tn,cN as He,g as st,S as ct,cH as dt,dc as qe,dp as vn,ds as we,dt as Ye,ar as D,d1 as J,bt as ut,aO as ft,aA as q,bf as Me,cq as dn,aP as ht,an as vt,af as j,N as gt,ad as se,al as pn,az as bt,v as pt,d as mt,dA as yt,bu as Ct,dC as wt,dx as xt,ai as mn,df as kt,bD as St,bh as Pt,bP as Ot,cT as Rt}from"./index-C5SFDSbW.js";import{d as Ft,c as Tt,e as gn,i as zt,N as Mt,B as It,a as _t,V as Bt,u as un,f as $t}from"./Popover-7YqDDnCH.js";import{a as At}from"./Suffix-CHlQT4I2.js";import{V as Et,F as Nt}from"./FocusDetector-_108vLsZ.js";import{N as Lt}from"./Empty-B5JVI8hS.js";import{h as Ee}from"./happens-in-CM8LO42l.js";import{u as yn}from"./use-merged-state-1MM3A4rf.js";import{u as Kt}from"./use-locale-BVZFgn6J.js";const pe="v-hidden",Dt=Tt("[v-hidden]",{display:"none!important"}),Cn=xe({name:"Overflow",props:{getCounter:Function,getTail:Function,updateCounter:Function,onUpdateCount:Function,onUpdateOverflow:Function},setup(e,{slots:t}){const n=A(null),r=A(null);function a(l){const{value:i}=n,{getCounter:g,getTail:p}=e;let C;if(g!==void 0?C=g():C=r.value,!i||!C)return;C.hasAttribute(pe)&&C.removeAttribute(pe);const{children:f}=i;if(l.showAllItemsBeforeCalculate)for(const O of f)O.hasAttribute(pe)&&O.removeAttribute(pe);const M=i.offsetWidth,z=[],u=t.tail?p==null?void 0:p():null;let m=u?u.offsetWidth:0,F=!1;const P=i.children.length-(t.tail?1:0);for(let O=0;O<P-1;++O){if(O<0)continue;const b=f[O];if(F){b.hasAttribute(pe)||b.setAttribute(pe,"");continue}else b.hasAttribute(pe)&&b.removeAttribute(pe);const y=b.offsetWidth;if(m+=y,z[O]=y,m>M){const{updateCounter:R}=e;for(let N=O;N>=0;--N){const L=P-1-N;R!==void 0?R(L):C.textContent=`${L}`;const W=C.offsetWidth;if(m-=z[N],m+W<=M||N===0){F=!0,O=N-1,u&&(O===-1?(u.style.maxWidth=`${M-W}px`,u.style.boxSizing="border-box"):u.style.maxWidth="");const{onUpdateCount:K}=e;K&&K(L);break}}}}const{onUpdateOverflow:k}=e;F?k!==void 0&&k(!0):(k!==void 0&&k(!1),C.setAttribute(pe,""))}const s=it();return Dt.mount({id:"vueuc/overflow",head:!0,anchorMetaName:Ft,ssr:s}),Ge(()=>a({showAllItemsBeforeCalculate:!1})),{selfRef:n,counterRef:r,sync:a}},render(){const{$slots:e}=this;return hn(()=>this.sync({showAllItemsBeforeCalculate:!1})),v("div",{class:"v-overflow",ref:"selfRef"},[lt(e,"default"),e.counter?e.counter():v("span",{style:{display:"inline-block"},ref:"counterRef"}),e.tail?e.tail():null])}});function zn(e,t){t&&(Ge(()=>{const{value:n}=e;n&&nn.registerHandler(n,t)}),Re(e,(n,r)=>{r&&nn.unregisterHandler(r)},{deep:!1}),On(()=>{const{value:n}=e;n&&nn.unregisterHandler(n)}))}function wn(e){switch(typeof e){case"string":return e||void 0;case"number":return String(e);default:return}}function on(e){const t=e.filter(n=>n!==void 0);if(t.length!==0)return t.length===1?t[0]:n=>{e.forEach(r=>{r&&r(n)})}}const jt=xe({name:"Checkmark",render(){return v("svg",{xmlns:"http://www.w3.org/2000/svg",viewBox:"0 0 16 16"},v("g",{fill:"none"},v("path",{d:"M14.046 3.486a.75.75 0 0 1-.032 1.06l-7.93 7.474a.85.85 0 0 1-1.188-.022l-2.68-2.72a.75.75 0 1 1 1.068-1.053l2.234 2.267l7.468-7.038a.75.75 0 0 1 1.06.032z",fill:"currentColor"})))}});function xn(e){return Array.isArray(e)?e:[e]}const fn={STOP:"STOP"};function Mn(e,t){const n=t(e);e.children!==void 0&&n!==fn.STOP&&e.children.forEach(r=>Mn(r,t))}function Wt(e,t={}){const{preserveGroup:n=!1}=t,r=[],a=n?l=>{l.isLeaf||(r.push(l.key),s(l.children))}:l=>{l.isLeaf||(l.isGroup||r.push(l.key),s(l.children))};function s(l){l.forEach(a)}return s(e),r}function Ht(e,t){const{isLeaf:n}=e;return n!==void 0?n:!t(e)}function Vt(e){return e.children}function Ut(e){return e.key}function Gt(){return!1}function qt(e,t){const{isLeaf:n}=e;return!(n===!1&&!Array.isArray(t(e)))}function Yt(e){return e.disabled===!0}function Zt(e,t){return e.isLeaf===!1&&!Array.isArray(t(e))}function rn(e){var t;return e==null?[]:Array.isArray(e)?e:(t=e.checkedKeys)!==null&&t!==void 0?t:[]}function ln(e){var t;return e==null||Array.isArray(e)?[]:(t=e.indeterminateKeys)!==null&&t!==void 0?t:[]}function Jt(e,t){const n=new Set(e);return t.forEach(r=>{n.has(r)||n.add(r)}),Array.from(n)}function Qt(e,t){const n=new Set(e);return t.forEach(r=>{n.has(r)&&n.delete(r)}),Array.from(n)}function Xt(e){return(e==null?void 0:e.type)==="group"}function eo(e){const t=new Map;return e.forEach((n,r)=>{t.set(n.key,r)}),n=>{var r;return(r=t.get(n))!==null&&r!==void 0?r:null}}class no extends Error{constructor(){super(),this.message="SubtreeNotLoadedError: checking a subtree whose required nodes are not fully loaded."}}function to(e,t,n,r){return Ve(t.concat(e),n,r,!1)}function oo(e,t){const n=new Set;return e.forEach(r=>{const a=t.treeNodeMap.get(r);if(a!==void 0){let s=a.parent;for(;s!==null&&!(s.disabled||n.has(s.key));)n.add(s.key),s=s.parent}}),n}function ro(e,t,n,r){const a=Ve(t,n,r,!1),s=Ve(e,n,r,!0),l=oo(e,n),i=[];return a.forEach(g=>{(s.has(g)||l.has(g))&&i.push(g)}),i.forEach(g=>a.delete(g)),a}function an(e,t){const{checkedKeys:n,keysToCheck:r,keysToUncheck:a,indeterminateKeys:s,cascade:l,leafOnly:i,checkStrategy:g,allowNotLoaded:p}=e;if(!l)return r!==void 0?{checkedKeys:Jt(n,r),indeterminateKeys:Array.from(s)}:a!==void 0?{checkedKeys:Qt(n,a),indeterminateKeys:Array.from(s)}:{checkedKeys:Array.from(n),indeterminateKeys:Array.from(s)};const{levelTreeNodeMap:C}=t;let f;a!==void 0?f=ro(a,n,t,p):r!==void 0?f=to(r,n,t,p):f=Ve(n,t,p,!1);const M=g==="parent",z=g==="child"||i,u=f,m=new Set,F=Math.max.apply(null,Array.from(C.keys()));for(let P=F;P>=0;P-=1){const k=P===0,O=C.get(P);for(const b of O){if(b.isLeaf)continue;const{key:y,shallowLoaded:R}=b;if(z&&R&&b.children.forEach(K=>{!K.disabled&&!K.isLeaf&&K.shallowLoaded&&u.has(K.key)&&u.delete(K.key)}),b.disabled||!R)continue;let N=!0,L=!1,W=!0;for(const K of b.children){const Y=K.key;if(!K.disabled){if(W&&(W=!1),u.has(Y))L=!0;else if(m.has(Y)){L=!0,N=!1;break}else if(N=!1,L)break}}N&&!W?(M&&b.children.forEach(K=>{!K.disabled&&u.has(K.key)&&u.delete(K.key)}),u.add(y)):L&&m.add(y),k&&z&&u.has(y)&&u.delete(y)}}return{checkedKeys:Array.from(u),indeterminateKeys:Array.from(m)}}function Ve(e,t,n,r){const{treeNodeMap:a,getChildren:s}=t,l=new Set,i=new Set(e);return e.forEach(g=>{const p=a.get(g);p!==void 0&&Mn(p,C=>{if(C.disabled)return fn.STOP;const{key:f}=C;if(!l.has(f)&&(l.add(f),i.add(f),Zt(C.rawNode,s))){if(r)return fn.STOP;if(!n)throw new no}})}),i}function lo(e,{includeGroup:t=!1,includeSelf:n=!0},r){var a;const s=r.treeNodeMap;let l=e==null?null:(a=s.get(e))!==null&&a!==void 0?a:null;const i={keyPath:[],treeNodePath:[],treeNode:l};if(l!=null&&l.ignored)return i.treeNode=null,i;for(;l;)!l.ignored&&(t||!l.isGroup)&&i.treeNodePath.push(l),l=l.parent;return i.treeNodePath.reverse(),n||i.treeNodePath.pop(),i.keyPath=i.treeNodePath.map(g=>g.key),i}function io(e){if(e.length===0)return null;const t=e[0];return t.isGroup||t.ignored||t.disabled?t.getNext():t}function ao(e,t){const n=e.siblings,r=n.length,{index:a}=e;return t?n[(a+1)%r]:a===n.length-1?null:n[a+1]}function kn(e,t,{loop:n=!1,includeDisabled:r=!1}={}){const a=t==="prev"?so:ao,s={reverse:t==="prev"};let l=!1,i=null;function g(p){if(p!==null){if(p===e){if(!l)l=!0;else if(!e.disabled&&!e.isGroup){i=e;return}}else if((!p.disabled||r)&&!p.ignored&&!p.isGroup){i=p;return}if(p.isGroup){const C=bn(p,s);C!==null?i=C:g(a(p,n))}else{const C=a(p,!1);if(C!==null)g(C);else{const f=co(p);f!=null&&f.isGroup?g(a(f,n)):n&&g(a(p,!0))}}}}return g(e),i}function so(e,t){const n=e.siblings,r=n.length,{index:a}=e;return t?n[(a-1+r)%r]:a===0?null:n[a-1]}function co(e){return e.parent}function bn(e,t={}){const{reverse:n=!1}=t,{children:r}=e;if(r){const{length:a}=r,s=n?a-1:0,l=n?-1:a,i=n?-1:1;for(let g=s;g!==l;g+=i){const p=r[g];if(!p.disabled&&!p.ignored)if(p.isGroup){const C=bn(p,t);if(C!==null)return C}else return p}}return null}const uo={getChild(){return this.ignored?null:bn(this)},getParent(){const{parent:e}=this;return e!=null&&e.isGroup?e.getParent():e},getNext(e={}){return kn(this,"next",e)},getPrev(e={}){return kn(this,"prev",e)}};function fo(e,t){const n=t?new Set(t):void 0,r=[];function a(s){s.forEach(l=>{r.push(l),!(l.isLeaf||!l.children||l.ignored)&&(l.isGroup||n===void 0||n.has(l.key))&&a(l.children)})}return a(e),r}function ho(e,t){const n=e.key;for(;t;){if(t.key===n)return!0;t=t.parent}return!1}function In(e,t,n,r,a,s=null,l=0){const i=[];return e.forEach((g,p)=>{var C;const f=Object.create(r);if(f.rawNode=g,f.siblings=i,f.level=l,f.index=p,f.isFirstChild=p===0,f.isLastChild=p+1===e.length,f.parent=s,!f.ignored){const M=a(g);Array.isArray(M)&&(f.children=In(M,t,n,r,a,f,l+1))}i.push(f),t.set(f.key,f),n.has(l)||n.set(l,[]),(C=n.get(l))===null||C===void 0||C.push(f)}),i}function vo(e,t={}){var n;const r=new Map,a=new Map,{getDisabled:s=Yt,getIgnored:l=Gt,getIsGroup:i=Xt,getKey:g=Ut}=t,p=(n=t.getChildren)!==null&&n!==void 0?n:Vt,C=t.ignoreEmptyChildren?b=>{const y=p(b);return Array.isArray(y)?y.length?y:null:y}:p,f=Object.assign({get key(){return g(this.rawNode)},get disabled(){return s(this.rawNode)},get isGroup(){return i(this.rawNode)},get isLeaf(){return Ht(this.rawNode,C)},get shallowLoaded(){return qt(this.rawNode,C)},get ignored(){return l(this.rawNode)},contains(b){return ho(this,b)}},uo),M=In(e,r,a,f,C);function z(b){if(b==null)return null;const y=r.get(b);return y&&!y.isGroup&&!y.ignored?y:null}function u(b){if(b==null)return null;const y=r.get(b);return y&&!y.ignored?y:null}function m(b,y){const R=u(b);return R?R.getPrev(y):null}function F(b,y){const R=u(b);return R?R.getNext(y):null}function P(b){const y=u(b);return y?y.getParent():null}function k(b){const y=u(b);return y?y.getChild():null}const O={treeNodes:M,treeNodeMap:r,levelTreeNodeMap:a,maxLevel:Math.max(...a.keys()),getChildren:C,getFlattenedNodes(b){return fo(M,b)},getNode:z,getPrev:m,getNext:F,getParent:P,getChild:k,getFirstAvailableNode(){return io(M)},getPath(b,y={}){return lo(b,y,O)},getCheckedKeys(b,y={}){const{cascade:R=!0,leafOnly:N=!1,checkStrategy:L="all",allowNotLoaded:W=!1}=y;return an({checkedKeys:rn(b),indeterminateKeys:ln(b),cascade:R,leafOnly:N,checkStrategy:L,allowNotLoaded:W},O)},check(b,y,R={}){const{cascade:N=!0,leafOnly:L=!1,checkStrategy:W="all",allowNotLoaded:K=!1}=R;return an({checkedKeys:rn(y),indeterminateKeys:ln(y),keysToCheck:b==null?[]:xn(b),cascade:N,leafOnly:L,checkStrategy:W,allowNotLoaded:K},O)},uncheck(b,y,R={}){const{cascade:N=!0,leafOnly:L=!1,checkStrategy:W="all",allowNotLoaded:K=!1}=R;return an({checkedKeys:rn(y),indeterminateKeys:ln(y),keysToUncheck:b==null?[]:xn(b),cascade:N,leafOnly:L,checkStrategy:W,allowNotLoaded:K},O)},getNonLeafKeys(b={}){return Wt(M,b)}};return O}const Sn=xe({name:"NBaseSelectGroupHeader",props:{clsPrefix:{type:String,required:!0},tmNode:{type:Object,required:!0}},setup(){const{renderLabelRef:e,renderOptionRef:t,labelFieldRef:n,nodePropsRef:r}=Rn(gn);return{labelField:n,nodeProps:r,renderLabel:e,renderOption:t}},render(){const{clsPrefix:e,renderLabel:t,renderOption:n,nodeProps:r,tmNode:{rawNode:a}}=this,s=r==null?void 0:r(a),l=t?t(a,!1):ze(a[this.labelField],a,!1),i=v("div",Object.assign({},s,{class:[`${e}-base-select-group-header`,s==null?void 0:s.class]}),l);return a.render?a.render({node:i,option:a}):n?n({node:i,option:a,selected:!1}):i}});function go(e,t){return v(Fn,{name:"fade-in-scale-up-transition"},{default:()=>e?v(at,{clsPrefix:t,class:`${t}-base-select-option__check`},{default:()=>v(jt)}):null})}const Pn=xe({name:"NBaseSelectOption",props:{clsPrefix:{type:String,required:!0},tmNode:{type:Object,required:!0}},setup(e){const{valueRef:t,pendingTmNodeRef:n,multipleRef:r,valueSetRef:a,renderLabelRef:s,renderOptionRef:l,labelFieldRef:i,valueFieldRef:g,showCheckmarkRef:p,nodePropsRef:C,handleOptionClick:f,handleOptionMouseEnter:M}=Rn(gn),z=tn(()=>{const{value:P}=n;return P?e.tmNode.key===P.key:!1});function u(P){const{tmNode:k}=e;k.disabled||f(P,k)}function m(P){const{tmNode:k}=e;k.disabled||M(P,k)}function F(P){const{tmNode:k}=e,{value:O}=z;k.disabled||O||M(P,k)}return{multiple:r,isGrouped:tn(()=>{const{tmNode:P}=e,{parent:k}=P;return k&&k.rawNode.type==="group"}),showCheckmark:p,nodeProps:C,isPending:z,isSelected:tn(()=>{const{value:P}=t,{value:k}=r;if(P===null)return!1;const O=e.tmNode.rawNode[g.value];if(k){const{value:b}=a;return b.has(O)}else return P===O}),labelField:i,renderLabel:s,renderOption:l,handleMouseMove:F,handleMouseEnter:m,handleClick:u}},render(){const{clsPrefix:e,tmNode:{rawNode:t},isSelected:n,isPending:r,isGrouped:a,showCheckmark:s,nodeProps:l,renderOption:i,renderLabel:g,handleClick:p,handleMouseEnter:C,handleMouseMove:f}=this,M=go(n,e),z=g?[g(t,n),s&&M]:[ze(t[this.labelField],t,n),s&&M],u=l==null?void 0:l(t),m=v("div",Object.assign({},u,{class:[`${e}-base-select-option`,t.class,u==null?void 0:u.class,{[`${e}-base-select-option--disabled`]:t.disabled,[`${e}-base-select-option--selected`]:n,[`${e}-base-select-option--grouped`]:a,[`${e}-base-select-option--pending`]:r,[`${e}-base-select-option--show-checkmark`]:s}],style:[(u==null?void 0:u.style)||"",t.style||""],onClick:on([p,u==null?void 0:u.onClick]),onMouseenter:on([C,u==null?void 0:u.onMouseenter]),onMousemove:on([f,u==null?void 0:u.onMousemove])}),v("div",{class:`${e}-base-select-option__content`},z));return t.render?t.render({node:m,option:t,selected:n}):i?i({node:m,option:t,selected:n}):m}}),bo=$("base-select-menu",`
 line-height: 1.5;
 outline: none;
 z-index: 0;
 position: relative;
 border-radius: var(--n-border-radius);
 transition:
 background-color .3s var(--n-bezier),
 box-shadow .3s var(--n-bezier);
 background-color: var(--n-color);
`,[$("scrollbar",`
 max-height: var(--n-height);
 `),$("virtual-list",`
 max-height: var(--n-height);
 `),$("base-select-option",`
 min-height: var(--n-option-height);
 font-size: var(--n-option-font-size);
 display: flex;
 align-items: center;
 `,[E("content",`
 z-index: 1;
 white-space: nowrap;
 text-overflow: ellipsis;
 overflow: hidden;
 `)]),$("base-select-group-header",`
 min-height: var(--n-option-height);
 font-size: .93em;
 display: flex;
 align-items: center;
 `),$("base-select-menu-option-wrapper",`
 position: relative;
 width: 100%;
 `),E("loading, empty",`
 display: flex;
 padding: 12px 32px;
 flex: 1;
 justify-content: center;
 `),E("loading",`
 color: var(--n-loading-color);
 font-size: var(--n-loading-size);
 `),E("header",`
 padding: 8px var(--n-option-padding-left);
 font-size: var(--n-option-font-size);
 transition: 
 color .3s var(--n-bezier),
 border-color .3s var(--n-bezier);
 border-bottom: 1px solid var(--n-action-divider-color);
 color: var(--n-action-text-color);
 `),E("action",`
 padding: 8px var(--n-option-padding-left);
 font-size: var(--n-option-font-size);
 transition: 
 color .3s var(--n-bezier),
 border-color .3s var(--n-bezier);
 border-top: 1px solid var(--n-action-divider-color);
 color: var(--n-action-text-color);
 `),$("base-select-group-header",`
 position: relative;
 cursor: default;
 padding: var(--n-option-padding);
 color: var(--n-group-header-text-color);
 `),$("base-select-option",`
 cursor: pointer;
 position: relative;
 padding: var(--n-option-padding);
 transition:
 color .3s var(--n-bezier),
 opacity .3s var(--n-bezier);
 box-sizing: border-box;
 color: var(--n-option-text-color);
 opacity: 1;
 `,[U("show-checkmark",`
 padding-right: calc(var(--n-option-padding-right) + 20px);
 `),ne("&::before",`
 content: "";
 position: absolute;
 left: 4px;
 right: 4px;
 top: 0;
 bottom: 0;
 border-radius: var(--n-border-radius);
 transition: background-color .3s var(--n-bezier);
 `),ne("&:active",`
 color: var(--n-option-text-color-pressed);
 `),U("grouped",`
 padding-left: calc(var(--n-option-padding-left) * 1.5);
 `),U("pending",[ne("&::before",`
 background-color: var(--n-option-color-pending);
 `)]),U("selected",`
 color: var(--n-option-text-color-active);
 `,[ne("&::before",`
 background-color: var(--n-option-color-active);
 `),U("pending",[ne("&::before",`
 background-color: var(--n-option-color-active-pending);
 `)])]),U("disabled",`
 cursor: not-allowed;
 `,[Oe("selected",`
 color: var(--n-option-text-color-disabled);
 `),U("selected",`
 opacity: var(--n-option-opacity-disabled);
 `)]),E("check",`
 font-size: 16px;
 position: absolute;
 right: calc(var(--n-option-padding-right) - 4px);
 top: calc(50% - 7px);
 color: var(--n-option-check-color);
 transition: color .3s var(--n-bezier);
 `,[Tn({enterScale:"0.5"})])])]),po=xe({name:"InternalSelectMenu",props:Object.assign(Object.assign({},we.props),{clsPrefix:{type:String,required:!0},scrollable:{type:Boolean,default:!0},treeMate:{type:Object,required:!0},multiple:Boolean,size:{type:String,default:"medium"},value:{type:[String,Number,Array],default:null},autoPending:Boolean,virtualScroll:{type:Boolean,default:!0},show:{type:Boolean,default:!0},labelField:{type:String,default:"label"},valueField:{type:String,default:"value"},loading:Boolean,focusable:Boolean,renderLabel:Function,renderOption:Function,nodeProps:Function,showCheckmark:{type:Boolean,default:!0},onMousedown:Function,onScroll:Function,onFocus:Function,onBlur:Function,onKeyup:Function,onKeydown:Function,onTabOut:Function,onMouseenter:Function,onMouseleave:Function,onResize:Function,resetMenuOnOptionsChange:{type:Boolean,default:!0},inlineThemeDisabled:Boolean,scrollbarProps:Object,onToggle:Function}),setup(e){const{mergedClsPrefixRef:t,mergedRtlRef:n,mergedComponentPropsRef:r}=qe(e),a=vn("InternalSelectMenu",n,t),s=we("InternalSelectMenu","-internal-select-menu",bo,ut,e,J(e,"clsPrefix")),l=A(null),i=A(null),g=A(null),p=D(()=>e.treeMate.getFlattenedNodes()),C=D(()=>eo(p.value)),f=A(null);function M(){const{treeMate:d}=e;let w=null;const{value:V}=e;V===null?w=d.getFirstAvailableNode():(e.multiple?w=d.getNode((V||[])[(V||[]).length-1]):w=d.getNode(V),(!w||w.disabled)&&(w=d.getFirstAvailableNode())),oe(w||null)}function z(){const{value:d}=f;d&&!e.treeMate.getNode(d.key)&&(f.value=null)}let u;Re(()=>e.show,d=>{d?u=Re(()=>e.treeMate,()=>{e.resetMenuOnOptionsChange?(e.autoPending?M():z(),hn(le)):z()},{immediate:!0}):u==null||u()},{immediate:!0}),On(()=>{u==null||u()});const m=D(()=>ft(s.value.self[q("optionHeight",e.size)])),F=D(()=>Me(s.value.self[q("padding",e.size)])),P=D(()=>e.multiple&&Array.isArray(e.value)?new Set(e.value):new Set),k=D(()=>{const d=p.value;return d&&d.length===0}),O=D(()=>{var d,w;return(w=(d=r==null?void 0:r.value)===null||d===void 0?void 0:d.Select)===null||w===void 0?void 0:w.renderEmpty});function b(d){const{onToggle:w}=e;w&&w(d)}function y(d){const{onScroll:w}=e;w&&w(d)}function R(d){var w;(w=g.value)===null||w===void 0||w.sync(),y(d)}function N(){var d;(d=g.value)===null||d===void 0||d.sync()}function L(){const{value:d}=f;return d||null}function W(d,w){w.disabled||oe(w,!1)}function K(d,w){w.disabled||b(w)}function Y(d){var w;Ee(d,"action")||(w=e.onKeyup)===null||w===void 0||w.call(e,d)}function Q(d){var w;Ee(d,"action")||(w=e.onKeydown)===null||w===void 0||w.call(e,d)}function H(d){var w;(w=e.onMousedown)===null||w===void 0||w.call(e,d),!e.focusable&&d.preventDefault()}function he(){const{value:d}=f;d&&oe(d.getNext({loop:!0}),!0)}function me(){const{value:d}=f;d&&oe(d.getPrev({loop:!0}),!0)}function oe(d,w=!1){f.value=d,w&&le()}function le(){var d,w;const V=f.value;if(!V)return;const re=C.value(V.key);re!==null&&(e.virtualScroll?(d=i.value)===null||d===void 0||d.scrollTo({index:re}):(w=g.value)===null||w===void 0||w.scrollTo({index:re,elSize:m.value}))}function ke(d){var w,V;!((w=l.value)===null||w===void 0)&&w.contains(d.target)&&((V=e.onFocus)===null||V===void 0||V.call(e,d))}function ce(d){var w,V;!((w=l.value)===null||w===void 0)&&w.contains(d.relatedTarget)||(V=e.onBlur)===null||V===void 0||V.call(e,d)}dn(gn,{handleOptionMouseEnter:W,handleOptionClick:K,valueSetRef:P,pendingTmNodeRef:f,nodePropsRef:J(e,"nodeProps"),showCheckmarkRef:J(e,"showCheckmark"),multipleRef:J(e,"multiple"),valueRef:J(e,"value"),renderLabelRef:J(e,"renderLabel"),renderOptionRef:J(e,"renderOption"),labelFieldRef:J(e,"labelField"),valueFieldRef:J(e,"valueField")}),dn(zt,l),Ge(()=>{const{value:d}=g;d&&d.sync()});const ve=D(()=>{const{size:d}=e,{common:{cubicBezierEaseInOut:w},self:{height:V,borderRadius:re,color:be,groupHeaderTextColor:ie,actionDividerColor:ee,optionTextColorPressed:ye,optionTextColor:de,optionTextColorDisabled:ue,optionTextColorActive:Ie,optionOpacityDisabled:_e,optionCheckColor:Se,actionTextColor:Pe,optionColorPending:Be,optionColorActive:$e,loadingColor:Ae,loadingSize:Fe,optionColorActivePending:Te,[q("optionFontSize",d)]:ae,[q("optionHeight",d)]:c,[q("optionPadding",d)]:x}}=s.value;return{"--n-height":V,"--n-action-divider-color":ee,"--n-action-text-color":Pe,"--n-bezier":w,"--n-border-radius":re,"--n-color":be,"--n-option-font-size":ae,"--n-group-header-text-color":ie,"--n-option-check-color":Se,"--n-option-color-pending":Be,"--n-option-color-active":$e,"--n-option-color-active-pending":Te,"--n-option-height":c,"--n-option-opacity-disabled":_e,"--n-option-text-color":de,"--n-option-text-color-active":Ie,"--n-option-text-color-disabled":ue,"--n-option-text-color-pressed":ye,"--n-option-padding":x,"--n-option-padding-left":Me(x,"left"),"--n-option-padding-right":Me(x,"right"),"--n-loading-color":Ae,"--n-loading-size":Fe}}),{inlineThemeDisabled:X}=e,te=X?Ye("internal-select-menu",D(()=>e.size[0]),ve,e):void 0,ge={selfRef:l,next:he,prev:me,getPendingTmNode:L};return zn(l,e.onResize),Object.assign({mergedTheme:s,mergedClsPrefix:t,rtlEnabled:a,virtualListRef:i,scrollbarRef:g,itemSize:m,padding:F,flattenedNodes:p,empty:k,mergedRenderEmpty:O,virtualListContainer(){const{value:d}=i;return d==null?void 0:d.listElRef},virtualListContent(){const{value:d}=i;return d==null?void 0:d.itemsElRef},doScroll:y,handleFocusin:ke,handleFocusout:ce,handleKeyUp:Y,handleKeyDown:Q,handleMouseDown:H,handleVirtualListResize:N,handleVirtualListScroll:R,cssVars:X?void 0:ve,themeClass:te==null?void 0:te.themeClass,onRender:te==null?void 0:te.onRender},ge)},render(){const{$slots:e,virtualScroll:t,clsPrefix:n,mergedTheme:r,themeClass:a,onRender:s}=this;return s==null||s(),v("div",{ref:"selfRef",tabindex:this.focusable?0:-1,class:[`${n}-base-select-menu`,`${n}-base-select-menu--${this.size}-size`,this.rtlEnabled&&`${n}-base-select-menu--rtl`,a,this.multiple&&`${n}-base-select-menu--multiple`],style:this.cssVars,onFocusin:this.handleFocusin,onFocusout:this.handleFocusout,onKeyup:this.handleKeyUp,onKeydown:this.handleKeyDown,onMousedown:this.handleMouseDown,onMouseenter:this.onMouseenter,onMouseleave:this.onMouseleave},He(e.header,l=>l&&v("div",{class:`${n}-base-select-menu__header`,"data-header":!0,key:"header"},l)),this.loading?v("div",{class:`${n}-base-select-menu__loading`},v(st,{clsPrefix:n,strokeWidth:20})):this.empty?v("div",{class:`${n}-base-select-menu__empty`,"data-empty":!0},dt(e.empty,()=>{var l;return[((l=this.mergedRenderEmpty)===null||l===void 0?void 0:l.call(this))||v(Lt,{theme:r.peers.Empty,themeOverrides:r.peerOverrides.Empty,size:this.size})]})):v(ct,Object.assign({ref:"scrollbarRef",theme:r.peers.Scrollbar,themeOverrides:r.peerOverrides.Scrollbar,scrollable:this.scrollable,container:t?this.virtualListContainer:void 0,content:t?this.virtualListContent:void 0,onScroll:t?void 0:this.doScroll},this.scrollbarProps),{default:()=>t?v(Et,{ref:"virtualListRef",class:`${n}-virtual-list`,items:this.flattenedNodes,itemSize:this.itemSize,showScrollbar:!1,paddingTop:this.padding.top,paddingBottom:this.padding.bottom,onResize:this.handleVirtualListResize,onScroll:this.handleVirtualListScroll,itemResizable:!0},{default:({item:l})=>l.isGroup?v(Sn,{key:l.key,clsPrefix:n,tmNode:l}):l.ignored?null:v(Pn,{clsPrefix:n,key:l.key,tmNode:l})}):v("div",{class:`${n}-base-select-menu-option-wrapper`,style:{paddingTop:this.padding.top,paddingBottom:this.padding.bottom}},this.flattenedNodes.map(l=>l.isGroup?v(Sn,{key:l.key,clsPrefix:n,tmNode:l}):v(Pn,{clsPrefix:n,key:l.key,tmNode:l})))}),He(e.action,l=>l&&[v("div",{class:`${n}-base-select-menu__action`,"data-action":!0,key:"action"},l),v(Nt,{onFocus:this.onTabOut,key:"focus-detector"})]))}});function mo(e){const{textColor2:t,primaryColorHover:n,primaryColorPressed:r,primaryColor:a,infoColor:s,successColor:l,warningColor:i,errorColor:g,baseColor:p,borderColor:C,opacityDisabled:f,tagColor:M,closeIconColor:z,closeIconColorHover:u,closeIconColorPressed:m,borderRadiusSmall:F,fontSizeMini:P,fontSizeTiny:k,fontSizeSmall:O,fontSizeMedium:b,heightMini:y,heightTiny:R,heightSmall:N,heightMedium:L,closeColorHover:W,closeColorPressed:K,buttonColor2Hover:Y,buttonColor2Pressed:Q,fontWeightStrong:H}=e;return Object.assign(Object.assign({},vt),{closeBorderRadius:F,heightTiny:y,heightSmall:R,heightMedium:N,heightLarge:L,borderRadius:F,opacityDisabled:f,fontSizeTiny:P,fontSizeSmall:k,fontSizeMedium:O,fontSizeLarge:b,fontWeightStrong:H,textColorCheckable:t,textColorHoverCheckable:t,textColorPressedCheckable:t,textColorChecked:p,colorCheckable:"#0000",colorHoverCheckable:Y,colorPressedCheckable:Q,colorChecked:a,colorCheckedHover:n,colorCheckedPressed:r,border:`1px solid ${C}`,textColor:t,color:M,colorBordered:"rgb(250, 250, 252)",closeIconColor:z,closeIconColorHover:u,closeIconColorPressed:m,closeColorHover:W,closeColorPressed:K,borderPrimary:`1px solid ${j(a,{alpha:.3})}`,textColorPrimary:a,colorPrimary:j(a,{alpha:.12}),colorBorderedPrimary:j(a,{alpha:.1}),closeIconColorPrimary:a,closeIconColorHoverPrimary:a,closeIconColorPressedPrimary:a,closeColorHoverPrimary:j(a,{alpha:.12}),closeColorPressedPrimary:j(a,{alpha:.18}),borderInfo:`1px solid ${j(s,{alpha:.3})}`,textColorInfo:s,colorInfo:j(s,{alpha:.12}),colorBorderedInfo:j(s,{alpha:.1}),closeIconColorInfo:s,closeIconColorHoverInfo:s,closeIconColorPressedInfo:s,closeColorHoverInfo:j(s,{alpha:.12}),closeColorPressedInfo:j(s,{alpha:.18}),borderSuccess:`1px solid ${j(l,{alpha:.3})}`,textColorSuccess:l,colorSuccess:j(l,{alpha:.12}),colorBorderedSuccess:j(l,{alpha:.1}),closeIconColorSuccess:l,closeIconColorHoverSuccess:l,closeIconColorPressedSuccess:l,closeColorHoverSuccess:j(l,{alpha:.12}),closeColorPressedSuccess:j(l,{alpha:.18}),borderWarning:`1px solid ${j(i,{alpha:.35})}`,textColorWarning:i,colorWarning:j(i,{alpha:.15}),colorBorderedWarning:j(i,{alpha:.12}),closeIconColorWarning:i,closeIconColorHoverWarning:i,closeIconColorPressedWarning:i,closeColorHoverWarning:j(i,{alpha:.12}),closeColorPressedWarning:j(i,{alpha:.18}),borderError:`1px solid ${j(g,{alpha:.23})}`,textColorError:g,colorError:j(g,{alpha:.1}),colorBorderedError:j(g,{alpha:.08}),closeIconColorError:g,closeIconColorHoverError:g,closeIconColorPressedError:g,closeColorHoverError:j(g,{alpha:.12}),closeColorPressedError:j(g,{alpha:.18})})}const yo={common:ht,self:mo},Co={color:Object,type:{type:String,default:"default"},round:Boolean,size:String,closable:Boolean,disabled:{type:Boolean,default:void 0}},wo=$("tag",`
 --n-close-margin: var(--n-close-margin-top) var(--n-close-margin-right) var(--n-close-margin-bottom) var(--n-close-margin-left);
 white-space: nowrap;
 position: relative;
 box-sizing: border-box;
 cursor: default;
 display: inline-flex;
 align-items: center;
 flex-wrap: nowrap;
 padding: var(--n-padding);
 border-radius: var(--n-border-radius);
 color: var(--n-text-color);
 background-color: var(--n-color);
 transition: 
 border-color .3s var(--n-bezier),
 background-color .3s var(--n-bezier),
 color .3s var(--n-bezier),
 box-shadow .3s var(--n-bezier),
 opacity .3s var(--n-bezier);
 line-height: 1;
 height: var(--n-height);
 font-size: var(--n-font-size);
`,[U("strong",`
 font-weight: var(--n-font-weight-strong);
 `),E("border",`
 pointer-events: none;
 position: absolute;
 left: 0;
 right: 0;
 top: 0;
 bottom: 0;
 border-radius: inherit;
 border: var(--n-border);
 transition: border-color .3s var(--n-bezier);
 `),E("icon",`
 display: flex;
 margin: 0 4px 0 0;
 color: var(--n-text-color);
 transition: color .3s var(--n-bezier);
 font-size: var(--n-avatar-size-override);
 `),E("avatar",`
 display: flex;
 margin: 0 6px 0 0;
 `),E("close",`
 margin: var(--n-close-margin);
 transition:
 background-color .3s var(--n-bezier),
 color .3s var(--n-bezier);
 `),U("round",`
 padding: 0 calc(var(--n-height) / 3);
 border-radius: calc(var(--n-height) / 2);
 `,[E("icon",`
 margin: 0 4px 0 calc((var(--n-height) - 8px) / -2);
 `),E("avatar",`
 margin: 0 6px 0 calc((var(--n-height) - 8px) / -2);
 `),U("closable",`
 padding: 0 calc(var(--n-height) / 4) 0 calc(var(--n-height) / 3);
 `)]),U("icon, avatar",[U("round",`
 padding: 0 calc(var(--n-height) / 3) 0 calc(var(--n-height) / 2);
 `)]),U("disabled",`
 cursor: not-allowed !important;
 opacity: var(--n-opacity-disabled);
 `),U("checkable",`
 cursor: pointer;
 box-shadow: none;
 color: var(--n-text-color-checkable);
 background-color: var(--n-color-checkable);
 `,[Oe("disabled",[ne("&:hover","background-color: var(--n-color-hover-checkable);",[Oe("checked","color: var(--n-text-color-hover-checkable);")]),ne("&:active","background-color: var(--n-color-pressed-checkable);",[Oe("checked","color: var(--n-text-color-pressed-checkable);")])]),U("checked",`
 color: var(--n-text-color-checked);
 background-color: var(--n-color-checked);
 `,[Oe("disabled",[ne("&:hover","background-color: var(--n-color-checked-hover);"),ne("&:active","background-color: var(--n-color-checked-pressed);")])])])]),xo=Object.assign(Object.assign(Object.assign({},we.props),Co),{bordered:{type:Boolean,default:void 0},checked:Boolean,checkable:Boolean,strong:Boolean,triggerClickOnClose:Boolean,onClose:[Array,Function],onMouseenter:Function,onMouseleave:Function,"onUpdate:checked":Function,onUpdateChecked:Function,internalCloseFocusable:{type:Boolean,default:!0},internalCloseIsButtonTag:{type:Boolean,default:!0},onCheckedChange:Function}),ko=bt("n-tag"),sn=xe({name:"Tag",props:xo,slots:Object,setup(e){const t=A(null),{mergedBorderedRef:n,mergedClsPrefixRef:r,inlineThemeDisabled:a,mergedRtlRef:s,mergedComponentPropsRef:l}=qe(e),i=D(()=>{var m,F;return e.size||((F=(m=l==null?void 0:l.value)===null||m===void 0?void 0:m.Tag)===null||F===void 0?void 0:F.size)||"medium"}),g=we("Tag","-tag",wo,yo,e,r);dn(ko,{roundRef:J(e,"round")});function p(){if(!e.disabled&&e.checkable){const{checked:m,onCheckedChange:F,onUpdateChecked:P,"onUpdate:checked":k}=e;P&&P(!m),k&&k(!m),F&&F(!m)}}function C(m){if(e.triggerClickOnClose||m.stopPropagation(),!e.disabled){const{onClose:F}=e;F&&se(F,m)}}const f={setTextContent(m){const{value:F}=t;F&&(F.textContent=m)}},M=vn("Tag",s,r),z=D(()=>{const{type:m,color:{color:F,textColor:P}={}}=e,k=i.value,{common:{cubicBezierEaseInOut:O},self:{padding:b,closeMargin:y,borderRadius:R,opacityDisabled:N,textColorCheckable:L,textColorHoverCheckable:W,textColorPressedCheckable:K,textColorChecked:Y,colorCheckable:Q,colorHoverCheckable:H,colorPressedCheckable:he,colorChecked:me,colorCheckedHover:oe,colorCheckedPressed:le,closeBorderRadius:ke,fontWeightStrong:ce,[q("colorBordered",m)]:ve,[q("closeSize",k)]:X,[q("closeIconSize",k)]:te,[q("fontSize",k)]:ge,[q("height",k)]:d,[q("color",m)]:w,[q("textColor",m)]:V,[q("border",m)]:re,[q("closeIconColor",m)]:be,[q("closeIconColorHover",m)]:ie,[q("closeIconColorPressed",m)]:ee,[q("closeColorHover",m)]:ye,[q("closeColorPressed",m)]:de}}=g.value,ue=Me(y);return{"--n-font-weight-strong":ce,"--n-avatar-size-override":`calc(${d} - 8px)`,"--n-bezier":O,"--n-border-radius":R,"--n-border":re,"--n-close-icon-size":te,"--n-close-color-pressed":de,"--n-close-color-hover":ye,"--n-close-border-radius":ke,"--n-close-icon-color":be,"--n-close-icon-color-hover":ie,"--n-close-icon-color-pressed":ee,"--n-close-icon-color-disabled":be,"--n-close-margin-top":ue.top,"--n-close-margin-right":ue.right,"--n-close-margin-bottom":ue.bottom,"--n-close-margin-left":ue.left,"--n-close-size":X,"--n-color":F||(n.value?ve:w),"--n-color-checkable":Q,"--n-color-checked":me,"--n-color-checked-hover":oe,"--n-color-checked-pressed":le,"--n-color-hover-checkable":H,"--n-color-pressed-checkable":he,"--n-font-size":ge,"--n-height":d,"--n-opacity-disabled":N,"--n-padding":b,"--n-text-color":P||V,"--n-text-color-checkable":L,"--n-text-color-checked":Y,"--n-text-color-hover-checkable":W,"--n-text-color-pressed-checkable":K}}),u=a?Ye("tag",D(()=>{let m="";const{type:F,color:{color:P,textColor:k}={}}=e;return m+=F[0],m+=i.value[0],P&&(m+=`a${pn(P)}`),k&&(m+=`b${pn(k)}`),n.value&&(m+="c"),m}),z,e):void 0;return Object.assign(Object.assign({},f),{rtlEnabled:M,mergedClsPrefix:r,contentRef:t,mergedBordered:n,handleClick:p,handleCloseClick:C,cssVars:a?void 0:z,themeClass:u==null?void 0:u.themeClass,onRender:u==null?void 0:u.onRender})},render(){var e,t;const{mergedClsPrefix:n,rtlEnabled:r,closable:a,color:{borderColor:s}={},round:l,onRender:i,$slots:g}=this;i==null||i();const p=He(g.avatar,f=>f&&v("div",{class:`${n}-tag__avatar`},f)),C=He(g.icon,f=>f&&v("div",{class:`${n}-tag__icon`},f));return v("div",{class:[`${n}-tag`,this.themeClass,{[`${n}-tag--rtl`]:r,[`${n}-tag--strong`]:this.strong,[`${n}-tag--disabled`]:this.disabled,[`${n}-tag--checkable`]:this.checkable,[`${n}-tag--checked`]:this.checkable&&this.checked,[`${n}-tag--round`]:l,[`${n}-tag--avatar`]:p,[`${n}-tag--icon`]:C,[`${n}-tag--closable`]:a}],style:this.cssVars,onClick:this.handleClick,onMouseenter:this.onMouseenter,onMouseleave:this.onMouseleave},C||p,v("span",{class:`${n}-tag__content`,ref:"contentRef"},(t=(e=this.$slots).default)===null||t===void 0?void 0:t.call(e)),!this.checkable&&a?v(gt,{clsPrefix:n,class:`${n}-tag__close`,disabled:this.disabled,onClick:this.handleCloseClick,focusable:this.internalCloseFocusable,round:l,isButtonTag:this.internalCloseIsButtonTag,absolute:!0}):null,!this.checkable&&this.mergedBordered?v("div",{class:`${n}-tag__border`,style:{borderColor:s}}):null)}}),So=ne([$("base-selection",`
 --n-padding-single: var(--n-padding-single-top) var(--n-padding-single-right) var(--n-padding-single-bottom) var(--n-padding-single-left);
 --n-padding-multiple: var(--n-padding-multiple-top) var(--n-padding-multiple-right) var(--n-padding-multiple-bottom) var(--n-padding-multiple-left);
 position: relative;
 z-index: auto;
 box-shadow: none;
 width: 100%;
 max-width: 100%;
 display: inline-block;
 vertical-align: bottom;
 border-radius: var(--n-border-radius);
 min-height: var(--n-height);
 line-height: 1.5;
 font-size: var(--n-font-size);
 `,[$("base-loading",`
 color: var(--n-loading-color);
 `),$("base-selection-tags","min-height: var(--n-height);"),E("border, state-border",`
 position: absolute;
 left: 0;
 right: 0;
 top: 0;
 bottom: 0;
 pointer-events: none;
 border: var(--n-border);
 border-radius: inherit;
 transition:
 box-shadow .3s var(--n-bezier),
 border-color .3s var(--n-bezier);
 `),E("state-border",`
 z-index: 1;
 border-color: #0000;
 `),$("base-suffix",`
 cursor: pointer;
 position: absolute;
 top: 50%;
 transform: translateY(-50%);
 right: 10px;
 `,[E("arrow",`
 font-size: var(--n-arrow-size);
 color: var(--n-arrow-color);
 transition: color .3s var(--n-bezier);
 `)]),$("base-selection-overlay",`
 display: flex;
 align-items: center;
 white-space: nowrap;
 pointer-events: none;
 position: absolute;
 top: 0;
 right: 0;
 bottom: 0;
 left: 0;
 padding: var(--n-padding-single);
 transition: color .3s var(--n-bezier);
 `,[E("wrapper",`
 flex-basis: 0;
 flex-grow: 1;
 overflow: hidden;
 text-overflow: ellipsis;
 `)]),$("base-selection-placeholder",`
 color: var(--n-placeholder-color);
 `,[E("inner",`
 max-width: 100%;
 overflow: hidden;
 `)]),$("base-selection-tags",`
 cursor: pointer;
 outline: none;
 box-sizing: border-box;
 position: relative;
 z-index: auto;
 display: flex;
 padding: var(--n-padding-multiple);
 flex-wrap: wrap;
 align-items: center;
 width: 100%;
 vertical-align: bottom;
 background-color: var(--n-color);
 border-radius: inherit;
 transition:
 color .3s var(--n-bezier),
 box-shadow .3s var(--n-bezier),
 background-color .3s var(--n-bezier);
 `),$("base-selection-label",`
 height: var(--n-height);
 display: inline-flex;
 width: 100%;
 vertical-align: bottom;
 cursor: pointer;
 outline: none;
 z-index: auto;
 box-sizing: border-box;
 position: relative;
 transition:
 color .3s var(--n-bezier),
 box-shadow .3s var(--n-bezier),
 background-color .3s var(--n-bezier);
 border-radius: inherit;
 background-color: var(--n-color);
 align-items: center;
 `,[$("base-selection-input",`
 font-size: inherit;
 line-height: inherit;
 outline: none;
 cursor: pointer;
 box-sizing: border-box;
 border:none;
 width: 100%;
 padding: var(--n-padding-single);
 background-color: #0000;
 color: var(--n-text-color);
 transition: color .3s var(--n-bezier);
 caret-color: var(--n-caret-color);
 `,[E("content",`
 text-overflow: ellipsis;
 overflow: hidden;
 white-space: nowrap; 
 `)]),E("render-label",`
 color: var(--n-text-color);
 `)]),Oe("disabled",[ne("&:hover",[E("state-border",`
 box-shadow: var(--n-box-shadow-hover);
 border: var(--n-border-hover);
 `)]),U("focus",[E("state-border",`
 box-shadow: var(--n-box-shadow-focus);
 border: var(--n-border-focus);
 `)]),U("active",[E("state-border",`
 box-shadow: var(--n-box-shadow-active);
 border: var(--n-border-active);
 `),$("base-selection-label","background-color: var(--n-color-active);"),$("base-selection-tags","background-color: var(--n-color-active);")])]),U("disabled","cursor: not-allowed;",[E("arrow",`
 color: var(--n-arrow-color-disabled);
 `),$("base-selection-label",`
 cursor: not-allowed;
 background-color: var(--n-color-disabled);
 `,[$("base-selection-input",`
 cursor: not-allowed;
 color: var(--n-text-color-disabled);
 `),E("render-label",`
 color: var(--n-text-color-disabled);
 `)]),$("base-selection-tags",`
 cursor: not-allowed;
 background-color: var(--n-color-disabled);
 `),$("base-selection-placeholder",`
 cursor: not-allowed;
 color: var(--n-placeholder-color-disabled);
 `)]),$("base-selection-input-tag",`
 height: calc(var(--n-height) - 6px);
 line-height: calc(var(--n-height) - 6px);
 outline: none;
 display: none;
 position: relative;
 margin-bottom: 3px;
 max-width: 100%;
 vertical-align: bottom;
 `,[E("input",`
 font-size: inherit;
 font-family: inherit;
 min-width: 1px;
 padding: 0;
 background-color: #0000;
 outline: none;
 border: none;
 max-width: 100%;
 overflow: hidden;
 width: 1em;
 line-height: inherit;
 cursor: pointer;
 color: var(--n-text-color);
 caret-color: var(--n-caret-color);
 `),E("mirror",`
 position: absolute;
 left: 0;
 top: 0;
 white-space: pre;
 visibility: hidden;
 user-select: none;
 -webkit-user-select: none;
 opacity: 0;
 `)]),["warning","error"].map(e=>U(`${e}-status`,[E("state-border",`border: var(--n-border-${e});`),Oe("disabled",[ne("&:hover",[E("state-border",`
 box-shadow: var(--n-box-shadow-hover-${e});
 border: var(--n-border-hover-${e});
 `)]),U("active",[E("state-border",`
 box-shadow: var(--n-box-shadow-active-${e});
 border: var(--n-border-active-${e});
 `),$("base-selection-label",`background-color: var(--n-color-active-${e});`),$("base-selection-tags",`background-color: var(--n-color-active-${e});`)]),U("focus",[E("state-border",`
 box-shadow: var(--n-box-shadow-focus-${e});
 border: var(--n-border-focus-${e});
 `)])])]))]),$("base-selection-popover",`
 margin-bottom: -3px;
 display: flex;
 flex-wrap: wrap;
 margin-right: -8px;
 `),$("base-selection-tag-wrapper",`
 max-width: 100%;
 display: inline-flex;
 padding: 0 7px 3px 0;
 `,[ne("&:last-child","padding-right: 0;"),$("tag",`
 font-size: 14px;
 max-width: 100%;
 `,[E("content",`
 line-height: 1.25;
 text-overflow: ellipsis;
 overflow: hidden;
 `)])])]),Po=xe({name:"InternalSelection",props:Object.assign(Object.assign({},we.props),{clsPrefix:{type:String,required:!0},bordered:{type:Boolean,default:void 0},active:Boolean,pattern:{type:String,default:""},placeholder:String,selectedOption:{type:Object,default:null},selectedOptions:{type:Array,default:null},labelField:{type:String,default:"label"},valueField:{type:String,default:"value"},multiple:Boolean,filterable:Boolean,clearable:Boolean,disabled:Boolean,size:{type:String,default:"medium"},loading:Boolean,autofocus:Boolean,showArrow:{type:Boolean,default:!0},inputProps:Object,focused:Boolean,renderTag:Function,onKeydown:Function,onClick:Function,onBlur:Function,onFocus:Function,onDeleteOption:Function,maxTagCount:[String,Number],ellipsisTagPopoverProps:Object,onClear:Function,onPatternInput:Function,onPatternFocus:Function,onPatternBlur:Function,renderLabel:Function,status:String,inlineThemeDisabled:Boolean,ignoreComposition:{type:Boolean,default:!0},onResize:Function}),setup(e){const{mergedClsPrefixRef:t,mergedRtlRef:n}=qe(e),r=vn("InternalSelection",n,t),a=A(null),s=A(null),l=A(null),i=A(null),g=A(null),p=A(null),C=A(null),f=A(null),M=A(null),z=A(null),u=A(!1),m=A(!1),F=A(!1),P=we("InternalSelection","-internal-selection",So,Ct,e,J(e,"clsPrefix")),k=D(()=>e.clearable&&!e.disabled&&(F.value||e.active)),O=D(()=>e.selectedOption?e.renderTag?e.renderTag({option:e.selectedOption,handleClose:()=>{}}):e.renderLabel?e.renderLabel(e.selectedOption,!0):ze(e.selectedOption[e.labelField],e.selectedOption,!0):e.placeholder),b=D(()=>{const c=e.selectedOption;if(c)return c[e.labelField]}),y=D(()=>e.multiple?!!(Array.isArray(e.selectedOptions)&&e.selectedOptions.length):e.selectedOption!==null);function R(){var c;const{value:x}=a;if(x){const{value:G}=s;G&&(G.style.width=`${x.offsetWidth}px`,e.maxTagCount!=="responsive"&&((c=M.value)===null||c===void 0||c.sync({showAllItemsBeforeCalculate:!1})))}}function N(){const{value:c}=z;c&&(c.style.display="none")}function L(){const{value:c}=z;c&&(c.style.display="inline-block")}Re(J(e,"active"),c=>{c||N()}),Re(J(e,"pattern"),()=>{e.multiple&&hn(R)});function W(c){const{onFocus:x}=e;x&&x(c)}function K(c){const{onBlur:x}=e;x&&x(c)}function Y(c){const{onDeleteOption:x}=e;x&&x(c)}function Q(c){const{onClear:x}=e;x&&x(c)}function H(c){const{onPatternInput:x}=e;x&&x(c)}function he(c){var x;(!c.relatedTarget||!(!((x=l.value)===null||x===void 0)&&x.contains(c.relatedTarget)))&&W(c)}function me(c){var x;!((x=l.value)===null||x===void 0)&&x.contains(c.relatedTarget)||K(c)}function oe(c){Q(c)}function le(){F.value=!0}function ke(){F.value=!1}function ce(c){!e.active||!e.filterable||c.target!==s.value&&c.preventDefault()}function ve(c){Y(c)}const X=A(!1);function te(c){if(c.key==="Backspace"&&!X.value&&!e.pattern.length){const{selectedOptions:x}=e;x!=null&&x.length&&ve(x[x.length-1])}}let ge=null;function d(c){const{value:x}=a;if(x){const G=c.target.value;x.textContent=G,R()}e.ignoreComposition&&X.value?ge=c:H(c)}function w(){X.value=!0}function V(){X.value=!1,e.ignoreComposition&&H(ge),ge=null}function re(c){var x;m.value=!0,(x=e.onPatternFocus)===null||x===void 0||x.call(e,c)}function be(c){var x;m.value=!1,(x=e.onPatternBlur)===null||x===void 0||x.call(e,c)}function ie(){var c,x;if(e.filterable)m.value=!1,(c=p.value)===null||c===void 0||c.blur(),(x=s.value)===null||x===void 0||x.blur();else if(e.multiple){const{value:G}=i;G==null||G.blur()}else{const{value:G}=g;G==null||G.blur()}}function ee(){var c,x,G;e.filterable?(m.value=!1,(c=p.value)===null||c===void 0||c.focus()):e.multiple?(x=i.value)===null||x===void 0||x.focus():(G=g.value)===null||G===void 0||G.focus()}function ye(){const{value:c}=s;c&&(L(),c.focus())}function de(){const{value:c}=s;c&&c.blur()}function ue(c){const{value:x}=C;x&&x.setTextContent(`+${c}`)}function Ie(){const{value:c}=f;return c}function _e(){return s.value}let Se=null;function Pe(){Se!==null&&window.clearTimeout(Se)}function Be(){e.active||(Pe(),Se=window.setTimeout(()=>{y.value&&(u.value=!0)},100))}function $e(){Pe()}function Ae(c){c||(Pe(),u.value=!1)}Re(y,c=>{c||(u.value=!1)}),Ge(()=>{yt(()=>{const c=p.value;c&&(e.disabled?c.removeAttribute("tabindex"):c.tabIndex=m.value?-1:0)})}),zn(l,e.onResize);const{inlineThemeDisabled:Fe}=e,Te=D(()=>{const{size:c}=e,{common:{cubicBezierEaseInOut:x},self:{fontWeight:G,borderRadius:Ze,color:Je,placeholderColor:Qe,textColor:Ne,paddingSingle:Le,paddingMultiple:Ke,caretColor:Xe,colorDisabled:en,textColorDisabled:De,placeholderColorDisabled:Ce,colorActive:o,boxShadowFocus:h,boxShadowActive:S,boxShadowHover:_,border:T,borderFocus:I,borderHover:B,borderActive:Z,arrowColor:fe,arrowColorDisabled:Bn,loadingColor:$n,colorActiveWarning:An,boxShadowFocusWarning:En,boxShadowActiveWarning:Nn,boxShadowHoverWarning:Ln,borderWarning:Kn,borderFocusWarning:Dn,borderHoverWarning:jn,borderActiveWarning:Wn,colorActiveError:Hn,boxShadowFocusError:Vn,boxShadowActiveError:Un,boxShadowHoverError:Gn,borderError:qn,borderFocusError:Yn,borderHoverError:Zn,borderActiveError:Jn,clearColor:Qn,clearColorHover:Xn,clearColorPressed:et,clearSize:nt,arrowSize:tt,[q("height",c)]:ot,[q("fontSize",c)]:rt}}=P.value,je=Me(Le),We=Me(Ke);return{"--n-bezier":x,"--n-border":T,"--n-border-active":Z,"--n-border-focus":I,"--n-border-hover":B,"--n-border-radius":Ze,"--n-box-shadow-active":S,"--n-box-shadow-focus":h,"--n-box-shadow-hover":_,"--n-caret-color":Xe,"--n-color":Je,"--n-color-active":o,"--n-color-disabled":en,"--n-font-size":rt,"--n-height":ot,"--n-padding-single-top":je.top,"--n-padding-multiple-top":We.top,"--n-padding-single-right":je.right,"--n-padding-multiple-right":We.right,"--n-padding-single-left":je.left,"--n-padding-multiple-left":We.left,"--n-padding-single-bottom":je.bottom,"--n-padding-multiple-bottom":We.bottom,"--n-placeholder-color":Qe,"--n-placeholder-color-disabled":Ce,"--n-text-color":Ne,"--n-text-color-disabled":De,"--n-arrow-color":fe,"--n-arrow-color-disabled":Bn,"--n-loading-color":$n,"--n-color-active-warning":An,"--n-box-shadow-focus-warning":En,"--n-box-shadow-active-warning":Nn,"--n-box-shadow-hover-warning":Ln,"--n-border-warning":Kn,"--n-border-focus-warning":Dn,"--n-border-hover-warning":jn,"--n-border-active-warning":Wn,"--n-color-active-error":Hn,"--n-box-shadow-focus-error":Vn,"--n-box-shadow-active-error":Un,"--n-box-shadow-hover-error":Gn,"--n-border-error":qn,"--n-border-focus-error":Yn,"--n-border-hover-error":Zn,"--n-border-active-error":Jn,"--n-clear-size":nt,"--n-clear-color":Qn,"--n-clear-color-hover":Xn,"--n-clear-color-pressed":et,"--n-arrow-size":tt,"--n-font-weight":G}}),ae=Fe?Ye("internal-selection",D(()=>e.size[0]),Te,e):void 0;return{mergedTheme:P,mergedClearable:k,mergedClsPrefix:t,rtlEnabled:r,patternInputFocused:m,filterablePlaceholder:O,label:b,selected:y,showTagsPanel:u,isComposing:X,counterRef:C,counterWrapperRef:f,patternInputMirrorRef:a,patternInputRef:s,selfRef:l,multipleElRef:i,singleElRef:g,patternInputWrapperRef:p,overflowRef:M,inputTagElRef:z,handleMouseDown:ce,handleFocusin:he,handleClear:oe,handleMouseEnter:le,handleMouseLeave:ke,handleDeleteOption:ve,handlePatternKeyDown:te,handlePatternInputInput:d,handlePatternInputBlur:be,handlePatternInputFocus:re,handleMouseEnterCounter:Be,handleMouseLeaveCounter:$e,handleFocusout:me,handleCompositionEnd:V,handleCompositionStart:w,onPopoverUpdateShow:Ae,focus:ee,focusInput:ye,blur:ie,blurInput:de,updateCounter:ue,getCounter:Ie,getTail:_e,renderLabel:e.renderLabel,cssVars:Fe?void 0:Te,themeClass:ae==null?void 0:ae.themeClass,onRender:ae==null?void 0:ae.onRender}},render(){const{status:e,multiple:t,size:n,disabled:r,filterable:a,maxTagCount:s,bordered:l,clsPrefix:i,ellipsisTagPopoverProps:g,onRender:p,renderTag:C,renderLabel:f}=this;p==null||p();const M=s==="responsive",z=typeof s=="number",u=M||z,m=v(pt,null,{default:()=>v(At,{clsPrefix:i,loading:this.loading,showArrow:this.showArrow,showClear:this.mergedClearable&&this.selected,onClear:this.handleClear},{default:()=>{var P,k;return(k=(P=this.$slots).arrow)===null||k===void 0?void 0:k.call(P)}})});let F;if(t){const{labelField:P}=this,k=H=>v("div",{class:`${i}-base-selection-tag-wrapper`,key:H.value},C?C({option:H,handleClose:()=>{this.handleDeleteOption(H)}}):v(sn,{size:n,closable:!H.disabled,disabled:r,onClose:()=>{this.handleDeleteOption(H)},internalCloseIsButtonTag:!1,internalCloseFocusable:!1},{default:()=>f?f(H,!0):ze(H[P],H,!0)})),O=()=>(z?this.selectedOptions.slice(0,s):this.selectedOptions).map(k),b=a?v("div",{class:`${i}-base-selection-input-tag`,ref:"inputTagElRef",key:"__input-tag__"},v("input",Object.assign({},this.inputProps,{ref:"patternInputRef",tabindex:-1,disabled:r,value:this.pattern,autofocus:this.autofocus,class:`${i}-base-selection-input-tag__input`,onBlur:this.handlePatternInputBlur,onFocus:this.handlePatternInputFocus,onKeydown:this.handlePatternKeyDown,onInput:this.handlePatternInputInput,onCompositionstart:this.handleCompositionStart,onCompositionend:this.handleCompositionEnd})),v("span",{ref:"patternInputMirrorRef",class:`${i}-base-selection-input-tag__mirror`},this.pattern)):null,y=M?()=>v("div",{class:`${i}-base-selection-tag-wrapper`,ref:"counterWrapperRef"},v(sn,{size:n,ref:"counterRef",onMouseenter:this.handleMouseEnterCounter,onMouseleave:this.handleMouseLeaveCounter,disabled:r})):void 0;let R;if(z){const H=this.selectedOptions.length-s;H>0&&(R=v("div",{class:`${i}-base-selection-tag-wrapper`,key:"__counter__"},v(sn,{size:n,ref:"counterRef",onMouseenter:this.handleMouseEnterCounter,disabled:r},{default:()=>`+${H}`})))}const N=M?a?v(Cn,{ref:"overflowRef",updateCounter:this.updateCounter,getCounter:this.getCounter,getTail:this.getTail,style:{width:"100%",display:"flex",overflow:"hidden"}},{default:O,counter:y,tail:()=>b}):v(Cn,{ref:"overflowRef",updateCounter:this.updateCounter,getCounter:this.getCounter,style:{width:"100%",display:"flex",overflow:"hidden"}},{default:O,counter:y}):z&&R?O().concat(R):O(),L=u?()=>v("div",{class:`${i}-base-selection-popover`},M?O():this.selectedOptions.map(k)):void 0,W=u?Object.assign({show:this.showTagsPanel,trigger:"hover",overlap:!0,placement:"top",width:"trigger",onUpdateShow:this.onPopoverUpdateShow,theme:this.mergedTheme.peers.Popover,themeOverrides:this.mergedTheme.peerOverrides.Popover},g):null,Y=(this.selected?!1:this.active?!this.pattern&&!this.isComposing:!0)?v("div",{class:`${i}-base-selection-placeholder ${i}-base-selection-overlay`},v("div",{class:`${i}-base-selection-placeholder__inner`},this.placeholder)):null,Q=a?v("div",{ref:"patternInputWrapperRef",class:`${i}-base-selection-tags`},N,M?null:b,m):v("div",{ref:"multipleElRef",class:`${i}-base-selection-tags`,tabindex:r?void 0:0},N,m);F=v(mt,null,u?v(Mt,Object.assign({},W,{scrollable:!0,style:"max-height: calc(var(--v-target-height) * 6.6);"}),{trigger:()=>Q,default:L}):Q,Y)}else if(a){const P=this.pattern||this.isComposing,k=this.active?!P:!this.selected,O=this.active?!1:this.selected;F=v("div",{ref:"patternInputWrapperRef",class:`${i}-base-selection-label`,title:this.patternInputFocused?void 0:wn(this.label)},v("input",Object.assign({},this.inputProps,{ref:"patternInputRef",class:`${i}-base-selection-input`,value:this.active?this.pattern:"",placeholder:"",readonly:r,disabled:r,tabindex:-1,autofocus:this.autofocus,onFocus:this.handlePatternInputFocus,onBlur:this.handlePatternInputBlur,onInput:this.handlePatternInputInput,onCompositionstart:this.handleCompositionStart,onCompositionend:this.handleCompositionEnd})),O?v("div",{class:`${i}-base-selection-label__render-label ${i}-base-selection-overlay`,key:"input"},v("div",{class:`${i}-base-selection-overlay__wrapper`},C?C({option:this.selectedOption,handleClose:()=>{}}):f?f(this.selectedOption,!0):ze(this.label,this.selectedOption,!0))):null,k?v("div",{class:`${i}-base-selection-placeholder ${i}-base-selection-overlay`,key:"placeholder"},v("div",{class:`${i}-base-selection-overlay__wrapper`},this.filterablePlaceholder)):null,m)}else F=v("div",{ref:"singleElRef",class:`${i}-base-selection-label`,tabindex:this.disabled?void 0:0},this.label!==void 0?v("div",{class:`${i}-base-selection-input`,title:wn(this.label),key:"input"},v("div",{class:`${i}-base-selection-input__content`},C?C({option:this.selectedOption,handleClose:()=>{}}):f?f(this.selectedOption,!0):ze(this.label,this.selectedOption,!0))):v("div",{class:`${i}-base-selection-placeholder ${i}-base-selection-overlay`,key:"placeholder"},v("div",{class:`${i}-base-selection-placeholder__inner`},this.placeholder)),m);return v("div",{ref:"selfRef",class:[`${i}-base-selection`,this.rtlEnabled&&`${i}-base-selection--rtl`,this.themeClass,e&&`${i}-base-selection--${e}-status`,{[`${i}-base-selection--active`]:this.active,[`${i}-base-selection--selected`]:this.selected||this.active&&this.pattern,[`${i}-base-selection--disabled`]:this.disabled,[`${i}-base-selection--multiple`]:this.multiple,[`${i}-base-selection--focus`]:this.focused}],style:this.cssVars,onClick:this.onClick,onMouseenter:this.handleMouseEnter,onMouseleave:this.handleMouseLeave,onKeydown:this.onKeydown,onFocusin:this.handleFocusin,onFocusout:this.handleFocusout,onMousedown:this.handleMouseDown},F,l?v("div",{class:`${i}-base-selection__border`}):null,l?v("div",{class:`${i}-base-selection__state-border`}):null)}});function Ue(e){return e.type==="group"}function _n(e){return e.type==="ignored"}function cn(e,t){try{return!!(1+t.toString().toLowerCase().indexOf(e.trim().toLowerCase()))}catch{return!1}}function Oo(e,t){return{getIsGroup:Ue,getIgnored:_n,getKey(r){return Ue(r)?r.name||r.key||"key-required":r[e]},getChildren(r){return r[t]}}}function Ro(e,t,n,r){if(!t)return e;function a(s){if(!Array.isArray(s))return[];const l=[];for(const i of s)if(Ue(i)){const g=a(i[r]);g.length&&l.push(Object.assign({},i,{[r]:g}))}else{if(_n(i))continue;t(n,i)&&l.push(i)}return l}return a(e)}function Fo(e,t,n){const r=new Map;return e.forEach(a=>{Ue(a)?a[n].forEach(s=>{r.set(s[t],s)}):r.set(a[t],a)}),r}const To=ne([$("select",`
 z-index: auto;
 outline: none;
 width: 100%;
 position: relative;
 font-weight: var(--n-font-weight);
 `),$("select-menu",`
 margin: 4px 0;
 box-shadow: var(--n-menu-box-shadow);
 `,[Tn({originalTransition:"background-color .3s var(--n-bezier), box-shadow .3s var(--n-bezier)"})])]),zo=Object.assign(Object.assign({},we.props),{to:un.propTo,bordered:{type:Boolean,default:void 0},clearable:Boolean,clearCreatedOptionsOnClear:{type:Boolean,default:!0},clearFilterAfterSelect:{type:Boolean,default:!0},options:{type:Array,default:()=>[]},defaultValue:{type:[String,Number,Array],default:null},keyboard:{type:Boolean,default:!0},value:[String,Number,Array],placeholder:String,menuProps:Object,multiple:Boolean,size:String,menuSize:{type:String},filterable:Boolean,disabled:{type:Boolean,default:void 0},remote:Boolean,loading:Boolean,filter:Function,placement:{type:String,default:"bottom-start"},widthMode:{type:String,default:"trigger"},tag:Boolean,onCreate:Function,fallbackOption:{type:[Function,Boolean],default:void 0},show:{type:Boolean,default:void 0},showArrow:{type:Boolean,default:!0},maxTagCount:[Number,String],ellipsisTagPopoverProps:Object,consistentMenuWidth:{type:Boolean,default:!0},virtualScroll:{type:Boolean,default:!0},labelField:{type:String,default:"label"},valueField:{type:String,default:"value"},childrenField:{type:String,default:"children"},renderLabel:Function,renderOption:Function,renderTag:Function,"onUpdate:value":[Function,Array],inputProps:Object,nodeProps:Function,ignoreComposition:{type:Boolean,default:!0},showOnFocus:Boolean,onUpdateValue:[Function,Array],onBlur:[Function,Array],onClear:[Function,Array],onFocus:[Function,Array],onScroll:[Function,Array],onSearch:[Function,Array],onUpdateShow:[Function,Array],"onUpdate:show":[Function,Array],displayDirective:{type:String,default:"show"},resetMenuOnOptionsChange:{type:Boolean,default:!0},status:String,showCheckmark:{type:Boolean,default:!0},scrollbarProps:Object,onChange:[Function,Array],items:Array}),Lo=xe({name:"Select",props:zo,slots:Object,setup(e){const{mergedClsPrefixRef:t,mergedBorderedRef:n,namespaceRef:r,inlineThemeDisabled:a,mergedComponentPropsRef:s}=qe(e),l=we("Select","-select",To,Rt,e,t),i=A(e.defaultValue),g=J(e,"value"),p=yn(g,i),C=A(!1),f=A(""),M=$t(e,["items","options"]),z=A([]),u=A([]),m=D(()=>u.value.concat(z.value).concat(M.value)),F=D(()=>{const{filter:o}=e;if(o)return o;const{labelField:h,valueField:S}=e;return(_,T)=>{if(!T)return!1;const I=T[h];if(typeof I=="string")return cn(_,I);const B=T[S];return typeof B=="string"?cn(_,B):typeof B=="number"?cn(_,String(B)):!1}}),P=D(()=>{if(e.remote)return M.value;{const{value:o}=m,{value:h}=f;return!h.length||!e.filterable?o:Ro(o,F.value,h,e.childrenField)}}),k=D(()=>{const{valueField:o,childrenField:h}=e,S=Oo(o,h);return vo(P.value,S)}),O=D(()=>Fo(m.value,e.valueField,e.childrenField)),b=A(!1),y=yn(J(e,"show"),b),R=A(null),N=A(null),L=A(null),{localeRef:W}=Kt("Select"),K=D(()=>{var o;return(o=e.placeholder)!==null&&o!==void 0?o:W.value.placeholder}),Y=[],Q=A(new Map),H=D(()=>{const{fallbackOption:o}=e;if(o===void 0){const{labelField:h,valueField:S}=e;return _=>({[h]:String(_),[S]:_})}return o===!1?!1:h=>Object.assign(o(h),{value:h})});function he(o){const h=e.remote,{value:S}=Q,{value:_}=O,{value:T}=H,I=[];return o.forEach(B=>{if(_.has(B))I.push(_.get(B));else if(h&&S.has(B))I.push(S.get(B));else if(T){const Z=T(B);Z&&I.push(Z)}}),I}const me=D(()=>{if(e.multiple){const{value:o}=p;return Array.isArray(o)?he(o):[]}return null}),oe=D(()=>{const{value:o}=p;return!e.multiple&&!Array.isArray(o)?o===null?null:he([o])[0]||null:null}),le=kt(e,{mergedSize:o=>{var h,S;const{size:_}=e;if(_)return _;const{mergedSize:T}=o||{};if(T!=null&&T.value)return T.value;const I=(S=(h=s==null?void 0:s.value)===null||h===void 0?void 0:h.Select)===null||S===void 0?void 0:S.size;return I||"medium"}}),{mergedSizeRef:ke,mergedDisabledRef:ce,mergedStatusRef:ve}=le;function X(o,h){const{onChange:S,"onUpdate:value":_,onUpdateValue:T}=e,{nTriggerFormChange:I,nTriggerFormInput:B}=le;S&&se(S,o,h),T&&se(T,o,h),_&&se(_,o,h),i.value=o,I(),B()}function te(o){const{onBlur:h}=e,{nTriggerFormBlur:S}=le;h&&se(h,o),S()}function ge(){const{onClear:o}=e;o&&se(o)}function d(o){const{onFocus:h,showOnFocus:S}=e,{nTriggerFormFocus:_}=le;h&&se(h,o),_(),S&&ie()}function w(o){const{onSearch:h}=e;h&&se(h,o)}function V(o){const{onScroll:h}=e;h&&se(h,o)}function re(){var o;const{remote:h,multiple:S}=e;if(h){const{value:_}=Q;if(S){const{valueField:T}=e;(o=me.value)===null||o===void 0||o.forEach(I=>{_.set(I[T],I)})}else{const T=oe.value;T&&_.set(T[e.valueField],T)}}}function be(o){const{onUpdateShow:h,"onUpdate:show":S}=e;h&&se(h,o),S&&se(S,o),b.value=o}function ie(){ce.value||(be(!0),b.value=!0,e.filterable&&Ke())}function ee(){be(!1)}function ye(){f.value="",u.value=Y}const de=A(!1);function ue(){e.filterable&&(de.value=!0)}function Ie(){e.filterable&&(de.value=!1,y.value||ye())}function _e(){ce.value||(y.value?e.filterable?Ke():ee():ie())}function Se(o){var h,S;!((S=(h=L.value)===null||h===void 0?void 0:h.selfRef)===null||S===void 0)&&S.contains(o.relatedTarget)||(C.value=!1,te(o),ee())}function Pe(o){d(o),C.value=!0}function Be(){C.value=!0}function $e(o){var h;!((h=R.value)===null||h===void 0)&&h.$el.contains(o.relatedTarget)||(C.value=!1,te(o),ee())}function Ae(){var o;(o=R.value)===null||o===void 0||o.focus(),ee()}function Fe(o){var h;y.value&&(!((h=R.value)===null||h===void 0)&&h.$el.contains(Pt(o))||ee())}function Te(o){if(!Array.isArray(o))return[];if(H.value)return Array.from(o);{const{remote:h}=e,{value:S}=O;if(h){const{value:_}=Q;return o.filter(T=>S.has(T)||_.has(T))}else return o.filter(_=>S.has(_))}}function ae(o){c(o.rawNode)}function c(o){if(ce.value)return;const{tag:h,remote:S,clearFilterAfterSelect:_,valueField:T}=e;if(h&&!S){const{value:I}=u,B=I[0]||null;if(B){const Z=z.value;Z.length?Z.push(B):z.value=[B],u.value=Y}}if(S&&Q.value.set(o[T],o),e.multiple){const I=Te(p.value),B=I.findIndex(Z=>Z===o[T]);if(~B){if(I.splice(B,1),h&&!S){const Z=x(o[T]);~Z&&(z.value.splice(Z,1),_&&(f.value=""))}}else I.push(o[T]),_&&(f.value="");X(I,he(I))}else{if(h&&!S){const I=x(o[T]);~I?z.value=[z.value[I]]:z.value=Y}Le(),ee(),X(o[T],o)}}function x(o){return z.value.findIndex(S=>S[e.valueField]===o)}function G(o){y.value||ie();const{value:h}=o.target;f.value=h;const{tag:S,remote:_}=e;if(w(h),S&&!_){if(!h){u.value=Y;return}const{onCreate:T}=e,I=T?T(h):{[e.labelField]:h,[e.valueField]:h},{valueField:B,labelField:Z}=e;M.value.some(fe=>fe[B]===I[B]||fe[Z]===I[Z])||z.value.some(fe=>fe[B]===I[B]||fe[Z]===I[Z])?u.value=Y:u.value=[I]}}function Ze(o){o.stopPropagation();const{multiple:h,tag:S,remote:_,clearCreatedOptionsOnClear:T}=e;!h&&e.filterable&&ee(),S&&!_&&T&&(z.value=Y),ge(),h?X([],[]):X(null,null)}function Je(o){!Ee(o,"action")&&!Ee(o,"empty")&&!Ee(o,"header")&&o.preventDefault()}function Qe(o){V(o)}function Ne(o){var h,S,_,T,I;if(!e.keyboard){o.preventDefault();return}switch(o.key){case" ":if(e.filterable)break;o.preventDefault();case"Enter":if(!(!((h=R.value)===null||h===void 0)&&h.isComposing)){if(y.value){const B=(S=L.value)===null||S===void 0?void 0:S.getPendingTmNode();B?ae(B):e.filterable||(ee(),Le())}else if(ie(),e.tag&&de.value){const B=u.value[0];if(B){const Z=B[e.valueField],{value:fe}=p;e.multiple&&Array.isArray(fe)&&fe.includes(Z)||c(B)}}}o.preventDefault();break;case"ArrowUp":if(o.preventDefault(),e.loading)return;y.value&&((_=L.value)===null||_===void 0||_.prev());break;case"ArrowDown":if(o.preventDefault(),e.loading)return;y.value?(T=L.value)===null||T===void 0||T.next():ie();break;case"Escape":y.value&&(Ot(o),ee()),(I=R.value)===null||I===void 0||I.focus();break}}function Le(){var o;(o=R.value)===null||o===void 0||o.focus()}function Ke(){var o;(o=R.value)===null||o===void 0||o.focusInput()}function Xe(){var o;y.value&&((o=N.value)===null||o===void 0||o.syncPosition())}re(),Re(J(e,"options"),re);const en={focus:()=>{var o;(o=R.value)===null||o===void 0||o.focus()},focusInput:()=>{var o;(o=R.value)===null||o===void 0||o.focusInput()},blur:()=>{var o;(o=R.value)===null||o===void 0||o.blur()},blurInput:()=>{var o;(o=R.value)===null||o===void 0||o.blurInput()}},De=D(()=>{const{self:{menuBoxShadow:o}}=l.value;return{"--n-menu-box-shadow":o}}),Ce=a?Ye("select",void 0,De,e):void 0;return Object.assign(Object.assign({},en),{mergedStatus:ve,mergedClsPrefix:t,mergedBordered:n,namespace:r,treeMate:k,isMounted:St(),triggerRef:R,menuRef:L,pattern:f,uncontrolledShow:b,mergedShow:y,adjustedTo:un(e),uncontrolledValue:i,mergedValue:p,followerRef:N,localizedPlaceholder:K,selectedOption:oe,selectedOptions:me,mergedSize:ke,mergedDisabled:ce,focused:C,activeWithoutMenuOpen:de,inlineThemeDisabled:a,onTriggerInputFocus:ue,onTriggerInputBlur:Ie,handleTriggerOrMenuResize:Xe,handleMenuFocus:Be,handleMenuBlur:$e,handleMenuTabOut:Ae,handleTriggerClick:_e,handleToggle:ae,handleDeleteOption:c,handlePatternInput:G,handleClear:Ze,handleTriggerBlur:Se,handleTriggerFocus:Pe,handleKeydown:Ne,handleMenuAfterLeave:ye,handleMenuClickOutside:Fe,handleMenuScroll:Qe,handleMenuKeydown:Ne,handleMenuMousedown:Je,mergedTheme:l,cssVars:a?void 0:De,themeClass:Ce==null?void 0:Ce.themeClass,onRender:Ce==null?void 0:Ce.onRender})},render(){return v("div",{class:`${this.mergedClsPrefix}-select`},v(It,null,{default:()=>[v(_t,null,{default:()=>v(Po,{ref:"triggerRef",inlineThemeDisabled:this.inlineThemeDisabled,status:this.mergedStatus,inputProps:this.inputProps,clsPrefix:this.mergedClsPrefix,showArrow:this.showArrow,maxTagCount:this.maxTagCount,ellipsisTagPopoverProps:this.ellipsisTagPopoverProps,bordered:this.mergedBordered,active:this.activeWithoutMenuOpen||this.mergedShow,pattern:this.pattern,placeholder:this.localizedPlaceholder,selectedOption:this.selectedOption,selectedOptions:this.selectedOptions,multiple:this.multiple,renderTag:this.renderTag,renderLabel:this.renderLabel,filterable:this.filterable,clearable:this.clearable,disabled:this.mergedDisabled,size:this.mergedSize,theme:this.mergedTheme.peers.InternalSelection,labelField:this.labelField,valueField:this.valueField,themeOverrides:this.mergedTheme.peerOverrides.InternalSelection,loading:this.loading,focused:this.focused,onClick:this.handleTriggerClick,onDeleteOption:this.handleDeleteOption,onPatternInput:this.handlePatternInput,onClear:this.handleClear,onBlur:this.handleTriggerBlur,onFocus:this.handleTriggerFocus,onKeydown:this.handleKeydown,onPatternBlur:this.onTriggerInputBlur,onPatternFocus:this.onTriggerInputFocus,onResize:this.handleTriggerOrMenuResize,ignoreComposition:this.ignoreComposition},{arrow:()=>{var e,t;return[(t=(e=this.$slots).arrow)===null||t===void 0?void 0:t.call(e)]}})}),v(Bt,{ref:"followerRef",show:this.mergedShow,to:this.adjustedTo,teleportDisabled:this.adjustedTo===un.tdkey,containerClass:this.namespace,width:this.consistentMenuWidth?"target":void 0,minWidth:"target",placement:this.placement},{default:()=>v(Fn,{name:"fade-in-scale-up-transition",appear:this.isMounted,onAfterLeave:this.handleMenuAfterLeave},{default:()=>{var e,t,n;return this.mergedShow||this.displayDirective==="show"?((e=this.onRender)===null||e===void 0||e.call(this),wt(v(po,Object.assign({},this.menuProps,{ref:"menuRef",onResize:this.handleTriggerOrMenuResize,inlineThemeDisabled:this.inlineThemeDisabled,virtualScroll:this.consistentMenuWidth&&this.virtualScroll,class:[`${this.mergedClsPrefix}-select-menu`,this.themeClass,(t=this.menuProps)===null||t===void 0?void 0:t.class],clsPrefix:this.mergedClsPrefix,focusable:!0,labelField:this.labelField,valueField:this.valueField,autoPending:!0,nodeProps:this.nodeProps,theme:this.mergedTheme.peers.InternalSelectMenu,themeOverrides:this.mergedTheme.peerOverrides.InternalSelectMenu,treeMate:this.treeMate,multiple:this.multiple,size:this.menuSize,renderOption:this.renderOption,renderLabel:this.renderLabel,value:this.mergedValue,style:[(n=this.menuProps)===null||n===void 0?void 0:n.style,this.cssVars],onToggle:this.handleToggle,onScroll:this.handleMenuScroll,onFocus:this.handleMenuFocus,onBlur:this.handleMenuBlur,onKeydown:this.handleMenuKeydown,onTabOut:this.handleMenuTabOut,onMousedown:this.handleMenuMousedown,show:this.mergedShow,showCheckmark:this.showCheckmark,resetMenuOnOptionsChange:this.resetMenuOnOptionsChange,scrollbarProps:this.scrollbarProps}),{empty:()=>{var r,a;return[(a=(r=this.$slots).empty)===null||a===void 0?void 0:a.call(r)]},header:()=>{var r,a;return[(a=(r=this.$slots).header)===null||a===void 0?void 0:a.call(r)]},action:()=>{var r,a;return[(a=(r=this.$slots).action)===null||a===void 0?void 0:a.call(r)]}}),this.displayDirective==="show"?[[xt,this.mergedShow],[mn,this.handleMenuClickOutside,void 0,{capture:!0}]]:[[mn,this.handleMenuClickOutside,void 0,{capture:!0}]])):null}})})]}))}});export{po as N,Lo as a,vo as b,Oo as c,wn as g,on as m};
