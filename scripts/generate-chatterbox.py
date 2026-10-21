import os
os.environ.setdefault('TQDM_DISABLE','1')
import hashlib,json,subprocess,urllib.request,time
from pathlib import Path
import torch,soundfile as sf
from chatterbox.mtl_tts import ChatterboxMultilingualTTS

root=Path(__file__).resolve().parents[1]
out=root/'public/voices/chatterbox'
out.mkdir(parents=True,exist_ok=True)
phrases=list(json.loads((root/'lib/chatterbox-clips.json').read_text()))
reference=root/'.migration'/'it_m1.flac'
reference.parent.mkdir(parents=True,exist_ok=True)
if not reference.exists():
    urllib.request.urlretrieve('https://storage.googleapis.com/chatterbox-demo-samples/mtl_prompts/it_m1.flac',reference)
from chatterbox.models.tokenizers.tokenizer import ChineseCangjieConverter
ChineseCangjieConverter._init_segmenter=lambda self: None
torch.set_num_threads(6)
print('Loading Chatterbox Multilingual on CPU',flush=True)
model=ChatterboxMultilingualTTS.from_pretrained(device='cpu')
manifest=json.loads((root/'lib/chatterbox-clips.json').read_text())
for i,text in enumerate(phrases):
    name=hashlib.sha256((text+'\nchatterbox-it-consistent-v2').encode()).hexdigest()[:16]+'.mp3'
    target=out/name
    started=time.time()
    if not target.exists():
        torch.manual_seed(17)
        wav=model.generate(text,language_id='it',audio_prompt_path=str(reference),exaggeration=.6,cfg_weight=.35,temperature=.75)
        temporary=root/'.migration'/'chatterbox-current.wav'
        sf.write(temporary,wav.squeeze().numpy(),model.sr)
        subprocess.run(['ffmpeg','-y','-hide_banner','-loglevel','error','-i',str(temporary),'-af','loudnorm=I=-18:TP=-1.5:LRA=7','-codec:a','libmp3lame','-q:a','3',str(target)],check=True)
    manifest[text]='/voices/chatterbox/'+name
    (root/'lib/chatterbox-clips.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+'\n')
    print(f'Clip {i+1}/{len(phrases)} ready; {time.time()-started:.1f}s; {target.stat().st_size} bytes',flush=True)
print('ALL CLIPS READY',flush=True)
