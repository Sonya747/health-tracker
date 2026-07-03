# -*- coding: utf-8 -*-
"""生成《健康记录 App 使用说明书》PDF（面向普通用户，非技术文档）。

用法：
    python3 -m pip install reportlab
    python3 scripts/build_user_guide.py
    # 产物 user-guide.pdf 生成在当前目录，需要手动移动/覆盖到 docs/健康记录App使用说明书.pdf

依赖 macOS 系统自带的 STHeiti 中文字体（用于内嵌中文），如需在其他系统运行，
请把脚本里的字体路径换成一款可用的中文 TrueType 字体（.ttf/.ttc，需支持 TrueType outline，
不支持基于 CFF/PostScript 轮廓的字体如 Hiragino Sans GB）。
"""

from reportlab.lib.pagesizes import A4
from reportlab.lib.units import mm
from reportlab.lib import colors
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.enums import TA_LEFT, TA_CENTER
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle,
    HRFlowable, PageBreak, KeepTogether, ListFlowable, ListItem,
)
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont

# ---------- 字体（复用系统中文字体，保证内嵌后中文正常显示） ----------
pdfmetrics.registerFont(TTFont("CJK", "/System/Library/Fonts/STHeiti Light.ttc", subfontIndex=0))
pdfmetrics.registerFont(TTFont("CJK-Bold", "/System/Library/Fonts/STHeiti Medium.ttc", subfontIndex=0))
# 让 Paragraph 里的 <b> 标签能正确映射到中文粗体字体
pdfmetrics.registerFontFamily("CJK", normal="CJK", bold="CJK-Bold", italic="CJK", boldItalic="CJK-Bold")

# ---------- 配色（与 App 主题一致） ----------
PRIMARY = colors.HexColor("#4A90D9")
PRIMARY_SOFT = colors.HexColor("#E8F1FB")
TEXT = colors.HexColor("#1F2933")
TEXT_SECONDARY = colors.HexColor("#6B7684")
TEXT_TERTIARY = colors.HexColor("#9AA4B0")
BORDER = colors.HexColor("#E4E9EF")
BG = colors.HexColor("#F3F6FA")
DANGER = colors.HexColor("#D9534F")

PAGE_W, PAGE_H = A4
MARGIN = 20 * mm

OUT_PATH = "user-guide.pdf"

# ---------- 样式 ----------
S = {}
S["CoverTitle"] = ParagraphStyle("CoverTitle", fontName="CJK-Bold", fontSize=26, leading=34,
                                  textColor=PRIMARY, alignment=TA_CENTER, spaceAfter=6)
S["CoverSubtitle"] = ParagraphStyle("CoverSubtitle", fontName="CJK", fontSize=12.5, leading=20,
                                     textColor=TEXT_SECONDARY, alignment=TA_CENTER, spaceAfter=2)
S["CoverIntro"] = ParagraphStyle("CoverIntro", fontName="CJK", fontSize=11, leading=18,
                                  textColor=TEXT, alignment=TA_CENTER, spaceBefore=18,
                                  leftIndent=20, rightIndent=20, wordWrap="CJK")
S["H1"] = ParagraphStyle("H1", fontName="CJK-Bold", fontSize=17, leading=24,
                          textColor=PRIMARY, spaceBefore=22, spaceAfter=10)
S["H2"] = ParagraphStyle("H2", fontName="CJK-Bold", fontSize=13, leading=19,
                          textColor=TEXT, spaceBefore=14, spaceAfter=6)
S["H3"] = ParagraphStyle("H3", fontName="CJK-Bold", fontSize=11.3, leading=17,
                          textColor=PRIMARY, spaceBefore=10, spaceAfter=4)
S["Body"] = ParagraphStyle("Body", fontName="CJK", fontSize=10.3, leading=16.5,
                            textColor=TEXT, spaceAfter=6, alignment=TA_LEFT, wordWrap="CJK")
S["Bullet"] = ParagraphStyle("Bullet", parent=S["Body"], leftIndent=12, bulletIndent=0, spaceAfter=4, wordWrap="CJK")
S["CalloutTitle"] = ParagraphStyle("CalloutTitle", fontName="CJK-Bold", fontSize=11.5,
                                    leading=17, textColor=PRIMARY, spaceAfter=4, wordWrap="CJK")
S["CalloutBody"] = ParagraphStyle("CalloutBody", fontName="CJK", fontSize=10, leading=15.5,
                                   textColor=TEXT, spaceAfter=2, wordWrap="CJK")
S["FAQQ"] = ParagraphStyle("FAQQ", fontName="CJK-Bold", fontSize=10.6, leading=16,
                            textColor=PRIMARY, spaceBefore=10, spaceAfter=3, wordWrap="CJK")
S["FAQA"] = ParagraphStyle("FAQA", fontName="CJK", fontSize=10.2, leading=16,
                            textColor=TEXT, leftIndent=10, spaceAfter=2, wordWrap="CJK")
S["FootNote"] = ParagraphStyle("FootNote", fontName="CJK", fontSize=9, leading=13,
                                textColor=TEXT_TERTIARY, alignment=TA_CENTER)


def bullets(items, style_key="Bullet"):
    return ListFlowable(
        [ListItem(Paragraph(t, S[style_key]), leftIndent=14, value="•") for t in items],
        bulletType="bullet", start="•", leftIndent=8,
    )


def callout(title, lines, bg=PRIMARY_SOFT, border=PRIMARY):
    content = [Paragraph(title, S["CalloutTitle"])]
    for line in lines:
        content.append(Paragraph(line, S["CalloutBody"]))
    t = Table([[content]], colWidths=[PAGE_W - 2 * MARGIN])
    t.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), bg),
        ("BOX", (0, 0), (-1, -1), 0.75, border),
        ("LEFTPADDING", (0, 0), (-1, -1), 14),
        ("RIGHTPADDING", (0, 0), (-1, -1), 14),
        ("TOPPADDING", (0, 0), (-1, -1), 10),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 10),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
    ]))
    return t


def hr():
    return HRFlowable(width="100%", thickness=0.6, color=BORDER, spaceBefore=4, spaceAfter=12)


story = []

# ============ 封面 ============
story.append(Spacer(1, 60))
story.append(Paragraph("健康记录 App", S["CoverTitle"]))
story.append(Paragraph("使用说明书", S["CoverTitle"]))
story.append(Spacer(1, 10))
story.append(Paragraph("安卓个人健康记录工具 · 版本 0.1.0", S["CoverSubtitle"]))
story.append(Paragraph("更新日期：2026 年 7 月 3 日", S["CoverSubtitle"]))
story.append(Spacer(1, 4))
story.append(HRFlowable(width=120, thickness=1.4, color=PRIMARY, spaceBefore=16, spaceAfter=16, hAlign="CENTER"))
story.append(Paragraph(
    "一款只在你手机上运行、不需要联网也不需要账号的私人健康记录本。"
    "帮你用几秒钟记下排便、排尿、睡眠、情绪状态和焦虑发作，"
    "并随时回看这些身体信号背后的规律。",
    S["CoverIntro"],
))
story.append(Spacer(1, 40))
story.append(callout(
    "在你开始之前，请放心：",
    [
        "· 所有记录只保存在这台手机里，不会被上传到任何服务器；",
        "· 不用注册、不用登录，打开就能用；",
        "· 默认不联网，也没有接入广告或统计工具；",
        "· 只有你主动点击“导出”，数据才会离开手机。",
    ],
))
story.append(PageBreak())

# ============ 目录（简化版，用小标题罗列） ============
story.append(Paragraph("目录", S["H1"]))
toc_items = [
    "一、写在前面：我们的隐私承诺",
    "二、三步快速上手",
    "三、功能详解",
    "　3.1 今日页 —— 你的每日记录本",
    "　3.2 统计页 —— 回看你的规律",
    "　3.3 设置页",
    "四、常见问题",
    "五、写在最后",
]
for item in toc_items:
    story.append(Paragraph(item, S["Body"]))
story.append(PageBreak())

# ============ 一、隐私承诺 ============
story.append(Paragraph("一、写在前面：我们的隐私承诺", S["H1"]))
story.append(Paragraph(
    "排便、睡眠、情绪这些信息比较私密，我们非常重视这一点，所以在你开始使用前，先把几条承诺写清楚：",
    S["Body"],
))
story.append(bullets([
    "你的所有记录只保存在这台手机上，我们没有服务器会收到你的数据；",
    "App 不需要注册、不需要登录，打开即用；",
    "App 默认不联网，也不接入任何广告或第三方统计工具；",
    "只有你主动点击“导出”，数据才会离开手机——导出到哪里、发给谁，完全由你决定；",
    "卸载 App 或清除应用数据会永久删除所有记录，建议定期导出备份（见 3.3 节）。",
]))
story.append(hr())

# ============ 二、快速上手 ============
story.append(Paragraph("二、三步快速上手", S["H1"]))
story.append(Paragraph("如果你现在就想试试看，跳过说明书直接这样操作就够了：", S["Body"]))
story.append(bullets([
    "<b>第一步</b>：打开 App，会直接看到“今日”页面，默认显示今天。",
    "<b>第二步</b>：想记一次排便，点一下“开始计时”，上完厕所再点一下“结束”就自动记好了；排尿直接点“＋”加一次。",
    "<b>第三步</b>：想看这周或这个月的规律，点底部“统计”标签就行。",
], style_key="Bullet"))
story.append(Paragraph("剩下的功能，可以在用得到的时候再慢慢往下看。", S["Body"]))
story.append(hr())

# ============ 三、功能详解 ============
story.append(Paragraph("三、功能详解", S["H1"]))

# 3.1 今日页
story.append(Paragraph("3.1 今日页 —— 你的每日记录本", S["H2"]))
story.append(Paragraph(
    "打开 App 默认停在“今日”。页面顶部可以：点左右箭头切换到前一天/后一天；"
    "点中间的日期打开日历，跳到任意一天补记录；不在今天时会出现“回到今天”按钮，一点就回来。",
    S["Body"],
))

story.append(Paragraph("3.1.1 排便记录", S["H3"]))
story.append(Paragraph(
    "每一次排便都单独记一条，包含时间、用时、大便状态和备注，当天记了几次页面上就显示几次。"
    "App 提供两种记录方式，可以在“设置”里切换。",
    S["Body"],
))
story.append(Paragraph("<b>计时模式（默认方式）</b> —— 适合顺手记录、不想手动填时间的情况：", S["Body"]))
story.append(bullets([
    "进厕所前点一下“▶ 开始计时”；",
    "结束后点一下“结束”，App 会自动算出这次用了多久，并生成一条记录；",
    "如果这次时间比较长（默认超过 8 分钟，可在设置里改成 5/10/15 分钟），手机会震动并弹出提醒，"
    "友情提示你注意如厕时间不要过长；",
    "结束后可以顺手勾选大便状态（比如“顺畅”“偏硬”“偏稀”，也可以自己添加新的说法），方便之后回看规律；",
    "记错点了“开始”，随时可以点“放弃本次计时”取消，不会留下记录。",
]))
story.append(Paragraph("<b>快速模式</b> —— 适合直接手动填写、不需要 App 计时的情况：", S["Body"]))
story.append(bullets([
    "点“＋”直接打开小表单，填上时间、用时、大便状态、备注，保存即可；",
    "点“－”可以删除最近的一条记录（会先跟你确认）。",
]))
story.append(Paragraph("不管用哪种方式，你都可以：", S["Body"]))
story.append(bullets([
    "点右上角“＋ 补录”，给之前忘记记的日子补一条；",
    "直接点当天次数上的数字，手动改成想要的次数（改多会补空白记录、改少会删掉最近的记录，都会先确认）；",
    "点某一条记录进去编辑或删除。",
]))

story.append(Paragraph("3.1.2 排尿记录", S["H3"]))
story.append(Paragraph(
    "比较简单：点“＋”加一次，点“－”减一次，次数最少是 0。也可以直接点数字手动输入、清零，或写点备注。",
    S["Body"],
))

story.append(Paragraph("3.1.3 睡眠记录", S["H3"]))
story.append(Paragraph("可以用两种方式填时长：", S["Body"]))
story.append(bullets([
    "选“开始时间”和“结束时间”，App 自动算出睡了多久（哪怕跨过午夜，比如 23:00 睡到第二天 7:00，也能算对）；",
    "或者不填起止时间，直接选一个时长（提供 4-9 小时快捷选项，也可以自己微调）。",
]))
story.append(Paragraph("除了时长，还可以记录：", S["Body"]))
story.append(bullets([
    "睡眠质量（1-5 分，从“很差”到“很好”）；",
    "夜里醒了几次、醒着的时间一共多久；",
    "深睡比例（如果你的手环/手表有这个数据，可以手动填进来）；",
    "睡眠相关标签，比如“早醒”“熬夜”“再次入睡困难”“多梦”“夜间惊醒”“失眠”“夜尿”，也支持自己添加新标签；",
    "一段文字备注。",
]))
story.append(Paragraph("每天记一条，可以随时编辑或删除。", S["Body"]))

story.append(Paragraph("3.1.4 个人状态", S["H3"]))
story.append(Paragraph("用来记录当天的整体感受：", S["Body"]))
story.append(bullets([
    "选一个或多个状态标签（比如“精力充沛”“疲惫”“烦躁”“头痛”，也可以自定义）；",
    "打个 1-5 分；",
    "写点文字说明。",
]))
story.append(Paragraph("标签、评分、备注三者填一项就能保存，不用每次都填满。", S["Body"]))

story.append(Paragraph("3.1.5 焦虑发作", S["H3"]))
story.append(Paragraph("如果一天里发作了不止一次，可以逐条记录，每条包括：", S["Body"]))
story.append(bullets([
    "发生的时间；",
    "持续了多久；",
    "强度（1-5 分，从“轻微”到“强烈”）；",
    "可能的诱因（比如“工作压力”“睡眠不足”“咖啡因”，也可以自定义）；",
    "备注。",
]))
story.append(Paragraph("每条记录都能单独编辑或删除，方便之后跟自己或医生一起回顾发作规律。", S["Body"]))

story.append(Paragraph("3.1.6 今日备注", S["H3"]))
story.append(Paragraph(
    "如果当天有什么想额外补充的（比如生病了、出门旅行、吃了什么特别的东西），可以写在这里，作为当天的整体说明。",
    S["Body"],
))

# 3.2 统计页
story.append(Paragraph("3.2 统计页 —— 回看你的规律", S["H2"]))
story.append(Paragraph("点底部“统计”标签，可以按日、周、月三种颗粒度查看：", S["Body"]))
story.append(bullets([
    "<b>日视图</b>：当天所有记录的完整明细；",
    "<b>周视图</b>（周一到周日）：每天的排便/排尿次数、睡眠时长柱状图，以及焦虑发作次数、总时长、"
    "常见诱因，还有状态评分的平均值；",
    "<b>月视图</b>：整月的汇总数据，加上一个小日历标出哪几天有记录，点进去能看当天详情。",
]))
story.append(Paragraph(
    "如果某段时间完全没有记录，页面会明确告诉你“这段时间还没有记录”，不会让你误以为是加载出错了。",
    S["Body"],
))

# 3.3 设置页
story.append(Paragraph("3.3 设置页", S["H2"]))
story.append(bullets([
    "<b>记录偏好</b>：切换排便的记录方式（计时/快速），调整计时提醒的时间阈值；",
    "<b>数据导出</b>：把所有记录导出成 JSON 或 CSV 文件，导出后会弹出手机自带的分享面板，"
    "你可以选择保存到文件、发到邮箱、传到网盘，由你决定文件去哪。CSV 文件可以直接用 Excel、"
    "WPS 或 Numbers 打开查看；",
    "<b>隐私说明</b>：详细解释数据存在哪里、会不会被上传，方便随时确认。",
]))
story.append(PageBreak())

# ============ 四、常见问题 ============
story.append(Paragraph("四、常见问题", S["H1"]))

faq = [
    ("我把手机换了，数据能带过去吗？",
     "目前数据只存在手机本地，换手机前请先在“设置 → 数据导出”里导出一份 JSON 备份保存好。"
     "后续版本会考虑加入数据导入功能。"),
    ("忘记结束计时了怎么办？",
     "不用担心，回到“今日”页随时可以点“结束”；如果这次时长明显不对，保存后可以再点进那条记录手动修改。"),
    ("为什么没收到计时提醒通知？",
     "请检查手机是否给了 App 通知权限（第一次开始计时时手机会弹窗询问）。就算没开通知权限，"
     "如厕超时时 App 也会在前台震动并把按钮变红提醒你，不会完全没有提示。"),
    ("记录删错了能找回来吗？",
     "所有删除操作都会先弹窗确认，避免误删；但一旦确认删除就无法恢复，请谨慎操作。"),
    ("这个 App 会不会偷偷联网上传数据？",
     "不会。App 默认不联网，也没有接入任何广告或统计工具，你的数据只会在你主动点“导出”时才会离开手机。"),
    ("以后会不会支持苹果手机或者小程序？",
     "App 底层架构已经为后续扩展做好了准备，团队会根据实际需要评估是否推出 iOS 版和小程序版。"),
]
for q, a in faq:
    block = [Paragraph("Q：" + q, S["FAQQ"]), Paragraph("A：" + a, S["FAQA"])]
    story.append(KeepTogether(block))

story.append(hr())

# ============ 五、写在最后 ============
story.append(Paragraph("五、写在最后", S["H1"]))
story.append(Paragraph(
    "这款 App 的目标很简单：让你能在几秒钟内完成记录，然后腾出时间去过生活，而不是被“记录”这件事本身拖累。"
    "希望它能帮你更了解自己的身体和情绪状态。",
    S["Body"],
))
story.append(Spacer(1, 30))
story.append(Paragraph("版本信息：v0.1.0 · 更新日期 2026-07-03", S["FootNote"]))


# ---------- 页眉页脚 ----------
def draw_footer(c, doc_):
    c.saveState()
    c.setStrokeColor(BORDER)
    c.setLineWidth(0.5)
    c.line(MARGIN, 16 * mm, PAGE_W - MARGIN, 16 * mm)
    c.setFont("CJK", 8)
    c.setFillColor(TEXT_TERTIARY)
    c.drawString(MARGIN, 11 * mm, "健康记录 App 使用说明书")
    c.drawRightString(PAGE_W - MARGIN, 11 * mm, f"第 {doc_.page} 页")
    c.restoreState()


def on_first_page(c, doc_):
    draw_footer(c, doc_)


def on_later_pages(c, doc_):
    draw_footer(c, doc_)


doc = SimpleDocTemplate(
    OUT_PATH, pagesize=A4,
    leftMargin=MARGIN, rightMargin=MARGIN, topMargin=18 * mm, bottomMargin=22 * mm,
    title="健康记录 App 使用说明书", author="health-tracker",
)
doc.build(story, onFirstPage=on_first_page, onLaterPages=on_later_pages)
print("PDF generated:", OUT_PATH)
