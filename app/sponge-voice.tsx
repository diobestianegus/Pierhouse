'use client';
import {sitePath} from '../lib/hosting';
import {useEffect,useRef,useState} from 'react';
import clips from '../lib/chatterbox-clips.json';
const key='pierhouse-sponge-voice';
const previewText='Sono la spugna di Pierhouse. Le scuse non lavano i piatti!';
const defaults={enabled:true,engine:'chatterbox' as const,rate:1};
type Preferences=typeof defaults;
const normalize=(text:string)=>text.toLocaleLowerCase('it').replace(/[.!?…]+/g,'').replace(/\s+/g,' ').trim();
export function chatterboxClip(text:string){return (clips as Record<string,string>)[text]||Object.entries(clips).find(([line])=>normalize(line)===normalize(text))?.[1]||null}
function readPreferences():Preferences{try{const p=JSON.parse(localStorage.getItem(key)||'{}');return {enabled:typeof p.enabled==='boolean'?p.enabled:true,engine:'chatterbox',rate:p.engine==='chatterbox'&&typeof p.rate==='number'?Math.min(1.5,Math.max(.6,p.rate)):1}}catch{return defaults}}
export function useSpongeVoice(){
 const [prefs,setPrefs]=useState(defaults),[supported,setSupported]=useState<boolean|null>(null),[error,setError]=useState(''),[playingText,setPlayingText]=useState('');
 const player=useRef<HTMLAudioElement|null>(null);
 function stop(){if(player.current){player.current.onended=null;player.current.onerror=null;player.current.onplaying=null;player.current.pause();player.current=null}setPlayingText('');if('speechSynthesis'in window)window.speechSynthesis.cancel()}
 useEffect(()=>{setSupported('Audio'in window);const initial=readPreferences();setPrefs(initial);try{localStorage.setItem(key,JSON.stringify(initial))}catch{}
 const sync=()=>{setPrefs(readPreferences());stop()},hidden=()=>{if(document.hidden)stop()};
 window.addEventListener('storage',sync);window.addEventListener(key,sync);document.addEventListener('visibilitychange',hidden);
 return()=>{stop();window.removeEventListener('storage',sync);window.removeEventListener(key,sync);document.removeEventListener('visibilitychange',hidden)};
 },[]);
 function update(change:Partial<Preferences>){const next={...prefs,...change,engine:'chatterbox' as const};setPrefs(next);stop();try{localStorage.setItem(key,JSON.stringify(next));window.dispatchEvent(new Event(key))}catch{}setError('')}
 function speak(text:string,force=false){if(!supported||(!prefs.enabled&&!force)||!text.trim())return;stop();setError('');
  const src=chatterboxClip(text);if(!src){setError('Questa frase non ha ancora un audio Chatterbox. La battuta resta leggibile.');return}
  const audio=new Audio(sitePath(src));audio.playbackRate=prefs.rate;audio.preservesPitch=true;player.current=audio;
  audio.onplaying=()=>{if(player.current===audio)setPlayingText(text)};
  audio.onended=()=>{if(player.current===audio){player.current=null;setPlayingText('')}};
  audio.onerror=()=>{if(player.current===audio){setPlayingText('');setError('Non riesco a caricare la voce Chatterbox. Controlla la connessione e riprova.')}};
  audio.play().catch(()=>{if(player.current===audio){setPlayingText('');setError('Tocca di nuovo per avviare la voce Chatterbox.')}});
 }
 return {prefs,supported,error,playingText,update,speak,stop};
}
export function SpongeVoiceControls({voice}:{voice:ReturnType<typeof useSpongeVoice>}){const {prefs,supported,error,playingText,update,speak}=voice;return <div className="sponge-voice-controls"><label><input type="checkbox" checked={prefs.enabled} disabled={!supported} onChange={e=>update({enabled:e.target.checked})}/> Voce della spugna</label><p className="muted">Chatterbox · Italiano naturale. Parla solo quando tocchi la spugna. Preferenze salvate su questo dispositivo.</p><p className="muted">Le frasi aggiunte o cambiate richiedono un nuovo audio. Puoi controllare e ascoltare ogni battuta in “Frasi della spugna”.</p><label>Velocità · {prefs.rate.toFixed(1)}×<input aria-label="Velocità della voce" type="range" min="0.6" max="1.5" step="0.1" value={prefs.rate} onChange={e=>update({rate:Number(e.target.value)})}/></label><button type="button" className="outline" disabled={!supported} onClick={()=>speak(previewText,true)}>Prova voce</button>{playingText&&<p role="status">Riproduzione Chatterbox in corso.</p>}{error&&<p role="status">{error}</p>}</div>}
