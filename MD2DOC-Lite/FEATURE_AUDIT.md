# MD2DOC-Lite 功能與容量盤點

建立日期：2026-05-13

## 先看結論

目前真正龐大的不是 MD2DOC 網頁功能，而是 Electron 桌面外殼。

| 項目 | 檔案數 | 容量 |
| --- | ---: | ---: |
| 純網頁/PWA 版 `dist` | 59 | 3.37 MB |
| Electron 資料夾版 `release-exe/win-unpacked` | 11,467 | 493.66 MB |
| Electron 內含 App 檔案 | 11,394 | 144.85 MB |
| Electron 語系包 `locales` | 55 | 47.18 MB |

如果目標是「小而精巧」，第一優先不是先砍功能，而是不要再用 Electron 當外殼，或重新做一個不把整個 `node_modules` 帶進去的桌面包。

## 功能容量盤點

以下容量以目前 `dist/assets` 的正式打包產物估算，代表「功能進入瀏覽器後的實際程式碼重量」。這不含 Electron/Chromium 外殼。

| 功能 | 目前用途 | 檔案數 | 容量 | 可否捨棄 | 捨棄影響 |
| --- | --- | ---: | ---: | --- | --- |
| 核心 App 主程式 | 編輯器、預覽、狀態、工具列、解析流程、範例內容 | 1 | 0.91 MB | 可瘦身，不建議全砍 | 砍掉會等於重做整個 App |
| Mermaid/圖表渲染 | 預覽 Mermaid、匯出 Mermaid 圖到 Word | 46 | 1.99 MB | 很適合砍 | 不能渲染/匯出 Mermaid 圖表 |
| DOCX 匯出 | 產生 Word `.docx` | 1 | 0.34 MB | 視需求 | 只能保留 Markdown/HTML，不再直接匯出 Word |
| React/vendor 基礎 | React 執行環境 | 1 | 0.03 MB | 不建議砍 | 除非改成純原生 JS 重寫 |
| CSS 樣式 | Tailwind 產出的本地樣式 | 1 | 0.02 MB | 可微調 | 容量很小，砍它省不了多少 |
| PWA 離線 | manifest、service worker、離線頁 | 4 | 約 0.006 MB | 可保留 | 幾乎不占容量 |
| QR Code | 連結轉 QR/內嵌圖片輔助 | 套件約 0.13 MB | 約 0.13 MB | 可砍 | 連結 QR 功能消失 |
| 多語系 i18n | 中英切換與語言偵測 | 套件約 1.48 MB 原始檔，打包後已混入主程式 | 約數十 KB 到 0.1 MB 級 | 可砍 | 只保留繁中或英文 |
| lucide 圖示 | 工具列與按鈕圖示 | 套件原始檔 34.48 MB，打包後 tree-shaking 只留用到的圖示 | 打包後很小 | 可改成文字/少量 SVG | UI 圖示減少 |
| AI Prompt Modal | 產生提示詞說明視窗 | 混入主程式 | 小 | 可砍 | 少一個提示詞輔助視窗 |
| Slash Command | `/` 快速插入區塊 | 混入主程式，原始碼約 16 KB | 小 | 可砍 | 編輯體驗變簡單 |
| 雙欄同步預覽 | 左編輯、右預覽、拖拉分割 | 混入主程式 | 小 | 可砍/簡化 | 改成單欄或切換頁籤 |
| 圖片拖放/內嵌 | 圖片進預覽與 DOCX | 混入主程式 | 小 | 可砍 | 圖片只能用文字連結或不支援 |
| 表格/TOC/Callout/Chat 區塊 | 進階出版格式 | 混入 parser 與 docx builders | 小 | 可分項砍 | 匯出格式變單純 |

## 最大瘦身選項

| 選項 | 預估成品大小 | 保留內容 | 捨棄內容 |
| --- | ---: | --- | --- |
| A. 極簡網頁版 | 約 0.8-1.5 MB | Markdown 編輯、即時預覽、匯出 `.md` | DOCX、Mermaid、Electron |
| B. 輕量 Word 版 | 約 1.2-2 MB | Markdown 編輯、預覽、匯出 DOCX | Mermaid、部分進階區塊 |
| C. 完整 PWA 版 | 約 3.37 MB | 現有網頁功能幾乎全保留 | Electron |
| D. 小型桌面版 | 需另選技術，約 5-30 MB 起 | 類似桌面 App 體驗 | 不用 Electron，改 Tauri/Neutralino 或本機瀏覽器殼 |
| E. 現有 Electron 版 | 約 493.66 MB | 現有功能 + Chromium 桌面外殼 | 體積很大 |

## 建議優先捨棄順序

1. 捨棄 Electron 外殼，先保留 PWA。省最多，從 493.66 MB 變成 3.37 MB。
2. 捨棄 Mermaid。再省約 1.99 MB，功能損失明確。
3. 視需求捨棄 DOCX 匯出。可省約 0.34 MB，但這是本工具核心價值，需慎重。
4. 捨棄多語系，只保留繁中。省小量，但讓程式更乾淨。
5. 簡化 slash command、AI Prompt、進階出版區塊。主要降低複雜度，不是大幅省容量。

## 我建議的新版本方向

建議先做 `MD2DOC-Lite` 的 B 方案：

- 保留 Markdown 編輯
- 保留即時預覽
- 保留 DOCX 匯出
- 保留基本格式：標題、段落、清單、粗體、斜體、程式碼、表格
- 先砍 Mermaid、AI Prompt、QR Code、多語系、PWA 複雜預快取、Electron

這樣可以做出一個很乾淨的輕量版，功能仍然對「Markdown 轉 Word」有價值。
