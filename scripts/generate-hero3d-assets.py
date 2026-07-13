#!/usr/bin/env python3
"""Generate deterministic dark hero textures and a no-WebGL fallback."""
from pathlib import Path
from PIL import Image, ImageDraw, ImageFilter, ImageEnhance
import math

ROOT = Path(__file__).resolve().parents[1]
BRAND = ROOT / "public/brand/verse"
TOKENS = ROOT / "public/tokens"
OUT = TOKENS / "hero"
HERO = ROOT / "public/hero"
OUT.mkdir(parents=True, exist_ok=True)
HERO.mkdir(parents=True, exist_ok=True)


def radial(size, inner, outer):
    im = Image.new("RGBA", (size, size))
    px = im.load(); c = (size - 1) / 2; maxd = c * 1.42
    for y in range(size):
        for x in range(size):
            t = min(1, math.hypot(x-c, y-c)/maxd)
            px[x,y] = tuple(round(inner[i]*(1-t)+outer[i]*t) for i in range(4))
    return im


def verse_mask(size, pad=.14):
    s=size; m=Image.new("L",(s,s)); d=ImageDraw.Draw(m)
    # Official V silhouette, normalized from the supplied clean purple mark.
    pts=[(.12,.12),(.30,.12),(.50,.70),(.70,.12),(.88,.12),(.60,.88),(.40,.88)]
    d.polygon([(int(x*s),int(y*s)) for x,y in pts],fill=255)
    return m


def glow_mark(size, color=(145,76,238,255)):
    mask=verse_mask(size)
    glow=Image.new("RGBA",(size,size));
    for radius,alpha in [(24,38),(12,72),(5,112)]:
        g=mask.filter(ImageFilter.GaussianBlur(radius)); layer=Image.new("RGBA",(size,size),color[:-1]+(alpha,)); layer.putalpha(g.point(lambda v:v*alpha//255)); glow.alpha_composite(layer)
    grad=Image.new("RGBA",(size,size)); gp=grad.load()
    for y in range(size):
        t=y/(size-1)
        col=(178-int(40*t),112-int(44*t),248-int(22*t),255)
        for x in range(size): gp[x,y]=col
    grad.putalpha(mask); glow.alpha_composite(grad)
    return glow


def make_front():
    s=1024; im=radial(s,(24,7,42,255),(3,2,9,255)); overlay=Image.new("RGBA",(s,s)); d=ImageDraw.Draw(overlay,"RGBA")
    # faceted violet surface language
    facets=[([(0,0),(440,0),(225,410)],(107,49,176,32)), ([(440,0),(1024,0),(720,360)],(151,82,224,28)), ([(0,1024),(420,560),(680,1024)],(79,31,138,36)), ([(1024,1024),(650,520),(1024,300)],(137,64,218,26))]
    for pts,c in facets:d.polygon(pts,fill=c)
    for i in range(7):
        x=120+i*132; d.line([(x,70),(x-54,390),(x+30,760),(x-10,950)],fill=(170,100,255,18),width=2)
    cracks=[[(130,720),(280,620),(350,660),(470,510)],[(740,160),(680,330),(760,430),(640,570)],[(300,180),(440,290),(405,390)]]
    for line in cracks:
        d.line(line,fill=(193,139,255,54),width=3)
        d.line(line,fill=(114,50,194,26),width=9)
    im.alpha_composite(overlay)
    mark=glow_mark(520); im.alpha_composite(mark,(252,252))
    im.convert("RGB").save(BRAND/"questpay-cube-front-verse.webp","WEBP",quality=92,method=6)


def make_token(name, body, rim, source=None):
    s=512; im=radial(s,body+(255,),tuple(max(0,c//3) for c in body)+(255,)); d=ImageDraw.Draw(im,"RGBA")
    d.ellipse((22,22,s-22,s-22),outline=rim+(210,),width=14); d.ellipse((47,47,s-47,s-47),outline=(255,255,255,25),width=4)
    if name=="verse":
        mark=glow_mark(340); im.alpha_composite(mark,(86,82))
    else:
        src=Image.open(TOKENS/source).convert("RGBA").resize((310,310),Image.Resampling.LANCZOS)
        src=ImageEnhance.Color(src).enhance(.82); src=ImageEnhance.Brightness(src).enhance(.92)
        # Soft violet-compatible halo behind recognizable official artwork.
        alpha=src.getchannel("A").filter(ImageFilter.GaussianBlur(18)); halo=Image.new("RGBA",src.size,rim+(80,)); halo.putalpha(alpha.point(lambda v:v*70//255)); im.alpha_composite(halo,(101,101)); im.alpha_composite(src,(101,101))
    im.convert("RGB").save(OUT/f"{name}-dark.webp","WEBP",quality=90,method=6)


def make_fallback():
    w,h=1200,900; im=radial(1400,(28,8,48,255),(1,1,5,255)).crop((100,250,1300,1150)); d=ImageDraw.Draw(im,"RGBA")
    # orbit rings
    for box,col,width in [((130,275,1070,690),(154,90,255,55),4),((220,215,980,750),(112,55,200,38),3)]: d.ellipse(box,outline=col,width=width)
    top=[(360,280),(625,170),(850,305),(585,425)]; left=[(360,280),(585,425),(585,680),(360,530)]; front=[(585,425),(850,305),(850,560),(585,680)]
    d.polygon(top,fill=(58,17,98,210),outline=(176,108,255,200)); d.polygon(left,fill=(30,8,52,238),outline=(148,79,232,210)); d.polygon(front,fill=(46,12,79,240),outline=(185,109,255,220))
    d.line(top+[top[0]],fill=(196,138,255,210),width=5)
    mark=glow_mark(250).resize((175,175)); im.alpha_composite(mark,(622,414))
    positions={"pol":(230,490),"usdt":(875,390),"verse":(300,245),"usdc":(880,610)}
    for name,pos in positions.items():
        coin=Image.open(OUT/f"{name}-dark.webp").convert("RGBA").resize((116,116),Image.Resampling.LANCZOS); im.alpha_composite(coin,pos)
    for x,y,r in [(190,180,3),(980,220,2),(1040,510,4),(260,700,2),(745,160,3),(100,520,2),(960,730,3)]: d.ellipse((x-r,y-r,x+r,y+r),fill=(184,126,255,150))
    im.convert("RGB").save(HERO/"questpay-hero-fallback.webp","WEBP",quality=90,method=6)

make_front()
make_token("pol",(37,16,67),(127,67,223),"pol.png")
make_token("usdt",(7,51,41),(36,157,125),"usdt.png")
make_token("verse",(40,16,61),(128,64,210))
make_token("usdc",(9,36,60),(44,117,184),"usdc.png")
make_fallback()
print("generated", BRAND/"questpay-cube-front-verse.webp", OUT, HERO/"questpay-hero-fallback.webp")
