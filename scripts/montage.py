import os, glob
from PIL import Image, ImageDraw, ImageFont
root = os.path.abspath('.')
files = glob.glob('assets/images/shops/*.jpg') + glob.glob('assets/images/banners/*.jpg') + glob.glob('assets/images/avatars/*.jpg')
files = [f for f in files if not os.path.basename(f).startswith('_')]
size = 240; cols = 5; rows = (len(files)+cols-1)//cols
sheet = Image.new('RGB',(cols*size, rows*(size+26)),'#eeeae3'); d=ImageDraw.Draw(sheet)
font = ImageFont.truetype('arial.ttf',14)
for i,f in enumerate(files):
    im=Image.open(f); im.thumbnail((size-8,size-8))
    x=(i%cols)*size; y=(i//cols)*(size+26)
    sheet.paste(im,(x+(size-im.width)//2,y+(size-im.height)//2))
    d.text((x+6,y+size+4), os.path.basename(f), fill='#111', font=font)
sheet.save('scripts/other-contact-sheet.jpg',quality=82)
print(len(files), 'images')
