// Native fullscreen/orientation requests must start from a user's button press.
// Keep viewport state authoritative; unsupported phones get physical-rotation guidance.
export function createScreenControls({doc,screen,viewport,onChange=()=>{},onMessage=()=>{}}){
  let busy=false;
  const fullscreen=()=>!!(doc.fullscreenElement||doc.webkitFullscreenElement);
  const orientation=()=>viewport().width>viewport().height?'landscape':'portrait';
  const sync=()=>onChange({fullscreen:fullscreen(),orientation:orientation(),busy});
  const unlock=()=>{try{screen?.orientation?.unlock?.();}catch{}};
  async function enter(){
    if(fullscreen())return true;
    const root=doc.documentElement,request=root.requestFullscreen||root.webkitRequestFullscreen;
    if(!request)return false;
    await request.call(root,{navigationUI:'hide'});return true;
  }
  async function toggleFullscreen(){
    if(busy)return false;busy=true;sync();
    try{
      if(fullscreen()){
        const exit=doc.exitFullscreen||doc.webkitExitFullscreen;
        if(!exit)throw new Error('Unavailable');
        unlock();await exit.call(doc);return true;
      }
      if(await enter())return true;
      onMessage('Fullscreen is unavailable in this browser. You can still play in either orientation.');return false;
    }catch{onMessage('Could not change fullscreen. Try your browser’s fullscreen option.');return false;}
    finally{busy=false;sync();}
  }
  async function rotate(){
    if(busy)return false;busy=true;sync();
    const target=orientation()==='portrait'?'landscape':'portrait';
    const manual=()=>onMessage(`Turn your phone ${target==='landscape'?'sideways':'upright'} for ${target}. Enable auto-rotate if the screen does not turn.`);
    try{
      if(typeof screen?.orientation?.lock!=='function'){manual();return false;}
      // Most mobile browsers require fullscreen before allowing an orientation lock.
      await enter();await screen.orientation.lock(target);return true;
    }catch{manual();return false;}
    finally{busy=false;sync();}
  }
  function changed(){if(!fullscreen())unlock();sync();}
  doc.addEventListener('fullscreenchange',changed);doc.addEventListener('webkitfullscreenchange',changed);
  screen?.orientation?.addEventListener?.('change',sync);
  sync();return{toggleFullscreen,rotate,sync};
}
