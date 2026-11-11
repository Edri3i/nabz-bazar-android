"""Generates the six widget page layouts (RemoteViews XML) so they share one header and one style.
Usage: python -I gen_widget_layouts.py <res/layout dir>"""
import sys, os
OUT = sys.argv[1]
A = 'xmlns:android="http://schemas.android.com/apk/res/android"'

def tv(id_, size, color="w_ink", bold=False, extra="", text=""):
    return (f'<TextView android:id="@+id/{id_}" android:layout_width="wrap_content" android:layout_height="wrap_content" '
            f'android:textSize="{size}sp" android:textColor="@color/{color}"{" android:textStyle=\"bold\"" if bold else ""} '
            f'android:includeFontPadding="false"{'' if 'maxLines' in extra else ' android:maxLines="1"'} android:ellipsize="end" {extra} android:text="{text}" />')

def header(title_id):
    return f'''<LinearLayout android:id="@+id/hdr" android:layout_width="match_parent" android:layout_height="wrap_content" android:orientation="horizontal" android:gravity="center_vertical" android:paddingLeft="30dp">
      <ImageView android:layout_width="18dp" android:layout_height="18dp" android:background="@drawable/w_logo_bg" android:padding="3dp" android:src="@drawable/w_pulse" />
      {tv(title_id, 12, "w_ink2", True, 'android:layout_marginStart="6dp"')}
      <FrameLayout android:layout_width="0dp" android:layout_height="1dp" android:layout_weight="1" />
      {tv(title_id + "_t", 10.5, "w_ink3")}
    </LinearLayout>'''

def page(name, body):
    xml = f'''<?xml version="1.0" encoding="utf-8"?>
<LinearLayout {A} android:id="@+id/w_page" android:layout_width="match_parent" android:layout_height="match_parent"
    android:orientation="vertical" android:background="@drawable/w_card" android:paddingLeft="16dp" android:paddingRight="16dp"
    android:paddingTop="13dp" android:paddingBottom="12dp" android:layoutDirection="rtl">
    {body}
</LinearLayout>
'''
    open(os.path.join(OUT, f"w_{name}.xml"), "w", encoding="utf-8").write(xml)

def big(id_, unit_id):
    return f'''<LinearLayout android:layout_width="wrap_content" android:layout_height="wrap_content" android:orientation="horizontal" android:gravity="bottom" android:layout_marginTop="6dp">
      {tv(id_, 29, "w_ink", True)}
      {tv(unit_id, 11.5, "w_ink2", True, 'android:layout_marginStart="5dp" android:layout_marginBottom="3dp"')}
    </LinearLayout>'''

def chip(i):
    return f'''<LinearLayout android:id="@+id/ex{i}" android:layout_width="0dp" android:layout_height="wrap_content" android:layout_weight="1" android:orientation="vertical" android:gravity="center"
        android:background="@drawable/w_chip" android:paddingTop="5dp" android:paddingBottom="6dp" {'android:layout_marginStart="6dp"' if i > 1 else ''}>
      {tv(f"exn{i}", 10, "w_ink2", True)}
      {tv(f"exp{i}", 13, "w_ink", True, 'android:layout_marginTop="2dp"')}
      {tv(f"exb{i}", 8.5, "w_up", True, 'android:layout_marginTop="1dp"')}
    </LinearLayout>'''

def kv(i, extra=""):
    return f'''<LinearLayout android:layout_width="match_parent" android:layout_height="wrap_content" android:orientation="horizontal"{'' if 'marginTop' in extra else ' android:layout_marginTop="5dp"'} {extra}>
      {tv(f"k{i}", 11.5, "w_ink2")}
      <FrameLayout android:layout_width="0dp" android:layout_height="1dp" android:layout_weight="1" />
      {tv(f"v{i}", 12.5, "w_ink", True)}
    </LinearLayout>'''

def pill(id_, extra=""):
    return tv(id_, 10.5, "w_up", True, f'android:background="@drawable/w_pill_up" android:paddingLeft="7dp" android:paddingRight="7dp" android:paddingTop="2dp" android:paddingBottom="2dp" {extra}')

# 1 tether
page("usdt", header("ht") + big("big", "unit") + tv("sub", 11, "w_ink2", extra='android:layout_marginTop="3dp"') +
     f'<LinearLayout android:layout_width="match_parent" android:layout_height="wrap_content" android:orientation="horizontal" android:layout_marginTop="9dp">{chip(1)}{chip(2)}{chip(3)}</LinearLayout>')
# 2 dollar, gold, coin
page("usd", header("ht") + f'''<LinearLayout android:layout_width="match_parent" android:layout_height="wrap_content" android:orientation="horizontal">
    <LinearLayout android:layout_width="0dp" android:layout_height="wrap_content" android:layout_weight="1" android:orientation="vertical">{big("big", "unit")}
      <LinearLayout android:layout_width="wrap_content" android:layout_height="wrap_content" android:orientation="horizontal" android:layout_marginTop="4dp" android:gravity="center_vertical">{tv("sub", 11, "w_ink2")}{pill("chg", 'android:layout_marginStart="6dp"')}</LinearLayout></LinearLayout>
    <LinearLayout android:layout_width="128dp" android:layout_height="wrap_content" android:orientation="vertical" android:layout_marginTop="4dp">{kv(1)}{kv(2)}{kv(3)}</LinearLayout></LinearLayout>
  <ImageView android:id="@+id/spark" android:layout_width="match_parent" android:layout_height="0dp" android:layout_weight="1" android:layout_marginTop="6dp" android:scaleType="fitXY" />''')
# 3 smart money
page("smart", header("ht") + tv("head", 18, "w_ink", True, 'android:maxLines="2" android:layout_marginTop="6dp" android:lineSpacingMultiplier="1.15"') +
     '<ImageView android:id="@+id/meter" android:layout_width="match_parent" android:layout_height="9dp" android:layout_marginTop="9dp" android:scaleType="fitXY" />' +
     f'<LinearLayout android:layout_width="match_parent" android:layout_height="wrap_content" android:orientation="horizontal" android:layout_marginTop="9dp">{pill("p1")}{pill("p2", "android:layout_marginStart=\"5dp\"")}{pill("p3", "android:layout_marginStart=\"5dp\"")}</LinearLayout>')
# 4 crypto + fear & greed
page("crypto", header("ht") + f'''<LinearLayout android:layout_width="match_parent" android:layout_height="match_parent" android:orientation="horizontal">
    <LinearLayout android:layout_width="0dp" android:layout_height="wrap_content" android:layout_weight="1" android:orientation="vertical">{big("big", "unit")}
      <LinearLayout android:layout_width="wrap_content" android:layout_height="wrap_content" android:orientation="horizontal" android:layout_marginTop="3dp" android:gravity="center_vertical">{tv("sub", 11, "w_ink2")}{pill("chg", 'android:layout_marginStart="6dp"')}</LinearLayout>
      {kv(1, 'android:layout_marginTop="8dp"')}{kv(2)}</LinearLayout>
    <LinearLayout android:layout_width="118dp" android:layout_height="wrap_content" android:orientation="vertical" android:gravity="center_horizontal" android:layout_marginStart="10dp" android:layout_marginTop="4dp">
      <ImageView android:id="@+id/gauge" android:layout_width="112dp" android:layout_height="66dp" android:scaleType="fitCenter" />
      {tv("glab", 11, "w_ink2", True, 'android:layout_marginTop="2dp"')}</LinearLayout></LinearLayout>''')
# 5 next news
page("news", header("ht") + tv("title", 16.5, "w_ink", True, 'android:maxLines="2" android:layout_marginTop="7dp"') + tv("sub", 11, "w_ink2", extra='android:layout_marginTop="3dp"') +
     '<LinearLayout android:layout_width="match_parent" android:layout_height="wrap_content" android:orientation="horizontal" android:layout_marginTop="9dp">' +
     "".join(f'''<LinearLayout android:id="@+id/cb{i}" android:layout_width="0dp" android:layout_height="wrap_content" android:layout_weight="1" android:orientation="vertical" android:gravity="center" android:background="@drawable/w_chip" android:paddingTop="4dp" android:paddingBottom="5dp" {'android:layout_marginStart="5dp"' if i > 1 else ''}>
        {tv(f"cv{i}", 15, "w_ink", True)}{tv(f"cl{i}", 9.5, "w_ink2")}</LinearLayout>''' for i in range(1, 6)) + '</LinearLayout>')
# 6 RSI scanner
page("rsi", header("ht") + f'''<LinearLayout android:layout_width="match_parent" android:layout_height="wrap_content" android:orientation="horizontal">
    <LinearLayout android:layout_width="0dp" android:layout_height="wrap_content" android:layout_weight="1" android:orientation="vertical">{big("big", "unit")}{tv("sub", 11, "w_ink2", extra='android:layout_marginTop="3dp"')}</LinearLayout>
    <LinearLayout android:layout_width="120dp" android:layout_height="wrap_content" android:orientation="vertical" android:layout_marginTop="4dp">{kv(1)}{kv(2)}{kv(3)}</LinearLayout></LinearLayout>
  <LinearLayout android:layout_width="match_parent" android:layout_height="wrap_content" android:orientation="horizontal" android:layout_marginTop="10dp">{pill("p1")}{pill("p2", "android:layout_marginStart=\"5dp\"")}</LinearLayout>''')
print("ok")
