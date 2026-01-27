from PIL import Image, ImageDraw, ImageFilter
import sys

# 画像を読み込む
img = Image.open('public/images/20260102-8.jpg')
width, height = img.size

# 元のタグの位置を特定して塗りつぶす
# タグの大まかな位置（画像を見て推定）
tag_positions = [
    # 左端の女性（ASDグレー）
    (150, 280, 280, 330),
    # ふくよかな女性（障害者手帳、統合失調症）
    (350, 280, 500, 330),
    # 車椅子の男性（身体障がい）
    (400, 500, 550, 550),
    # 右端の男性（LGBTQ）
    (580, 200, 680, 250),
]

# 画像を編集
draw = ImageDraw.Draw(img)

# 各タグ位置を背景色で塗りつぶす（ぼかし効果を使用）
for x1, y1, x2, y2 in tag_positions:
    # タグ領域を切り取り
    region = img.crop((x1, y1, x2, y2))
    # ガウシアンぼかしを強く適用
    blurred = region.filter(ImageFilter.GaussianBlur(radius=30))
    # 元の画像に貼り付け
    img.paste(blurred, (x1, y1))

# 保存
img.save('public/images/hero-image-clean.jpg', quality=95)
print('元のタグを削除した画像を保存しました: public/images/hero-image-clean.jpg')
