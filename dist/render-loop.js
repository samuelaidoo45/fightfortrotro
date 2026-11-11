// One animation chain, suspended while hidden or while graphics are unavailable.
export function createRenderLoop({doc,win,requestFrame,cancelFrame,now,step,onSuspend=()=>{},onResume=()=>{},onError=()=>{}}){
  let frame=null,last=0,enabled=false,pageHidden=false,blocked=false;
  const allowed=()=>enabled&&!doc.hidden&&!pageHidden&&!blocked;
  function schedule(){if(allowed()&&frame===null)frame=requestFrame(tick);}
  function tick(time){frame=null;if(!allowed())return;const dt=Math.max(0,Math.min(.05,(time-last)/1000));last=time;try{step(dt);}catch(error){blocked=true;onSuspend();onError(error);}finally{schedule();}}
  function suspend(){if(frame!==null)cancelFrame(frame);frame=null;onSuspend();}
  function resume(){if(!allowed()||frame!==null)return;last=now();try{onResume();schedule();}catch(error){blocked=true;onSuspend();onError(error);}}
  const visibility=()=>doc.hidden?suspend():resume();
  const hide=()=>{pageHidden=true;suspend();};
  const show=()=>{pageHidden=false;resume();};
  doc.addEventListener('visibilitychange',visibility);doc.addEventListener('freeze',hide);doc.addEventListener('resume',show);win.addEventListener('pagehide',hide);win.addEventListener('pageshow',show);
  return{start(){enabled=true;resume();},setBlocked(value){blocked=value;value?suspend():resume();},dispose(){enabled=false;suspend();doc.removeEventListener('visibilitychange',visibility);doc.removeEventListener('freeze',hide);doc.removeEventListener('resume',show);win.removeEventListener('pagehide',hide);win.removeEventListener('pageshow',show);}};
}
