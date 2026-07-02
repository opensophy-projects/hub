import{r as i,j as n}from"./vendor-react.DgFKySyv.js";import{LineShadowText as s}from"./line-shadow-text.Dxf631yv.js";const a=`
@keyframes line-shadow {
  0%   { background-position: 0 0; }
  100% { background-position: 100% -100%; }
}
`,l=({text:o="LineShadow",shadowColor:r="#a855f7",className:d="text-6xl font-bold"})=>(i.useEffect(()=>{const t="line-shadow-keyframes";if(document.getElementById(t))return;const e=document.createElement("style");return e.id=t,e.textContent=a,document.head.appendChild(e),()=>{e.remove()}},[]),n.jsx("div",{style:{padding:"3rem 2rem",textAlign:"center"},children:n.jsx(s,{shadowColor:r,className:d,children:o})}));export{l as default};
