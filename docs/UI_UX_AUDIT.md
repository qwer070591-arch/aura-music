# AURA MUSIC — Phase 4A UI/UX Audit

審查日期：2026-10-18。檢查目前六個路由與共用元件；基線以 Vite 正式 Build preview、Chrome／Playwright 在 320、375、390、430、768、1024、1440px，以及 390×568 短螢幕量測。基線資料與截圖存於 `output/playwright/phase4a-audit-baseline.*`。

## 發現與優先級

| 優先級 | 位置與重現方式 | 影響 | 建議修正 | 狀態 |
| --- | --- | --- | --- | --- |
| P1 | `index.html` 載入 Google Fonts；封鎖外網時每次進頁出現 `ERR_NETWORK_ACCESS_DENIED` | 字型呈現依網路而變，Console 持續報錯 | 移除外部請求，使用含繁中備援的系統字型組合 | 已修復 |
| P1 | 搜尋頁／音樂庫搜尋框以 Tab 聚焦；`.search-field input` 將外框設為 `0`，容器只改細邊框顏色 | 鍵盤焦點不夠明顯 | 在容器加清楚的 `:focus-within` 外框 | 已修復 |
| P1 | 音樂庫篩選 pill 為 32px 高；390×568 時播放模式按鈕為 36px 高 | 手機觸控目標偏小 | 維持視覺比例，擴至至少 44px 操作高度 | 已修復 |
| P1 | 歌單列表的合法長名稱（40 字元內）在 390px 單行省略，截圖只見前半段 | 無法辨識完整歌單名稱 | 允許名稱在卡片中自然換行 | 已修復 |
| P2 | Now Playing 的 `.time-row` 次要時間為 `#777383`／`#09090D`，對比約 4.33:1 | 12px 時間字低於一般文字 4.5:1 目標 | 稍微提亮時間字，不改紫黑基調 | 已修復，約 4.97:1 |
| P2 | 歌單拖曳排序只以邊框色標示放置目標，完成排序無狀態訊息 | 視覺及螢幕閱讀器回饋不足 | 增加非色彩目標標記與排序結果狀態通知 | 已修復 |
| P2 | Now Playing 展開音樂授權資訊後，授權與官方曲目連結的點擊高度約 15px | 手機上難以準確點按 | 擴大連結操作高度 | 已修復，均至少 44px |

P0：0；P1：4；P2：3；P3：0。前六項先於第一輪修正建立；授權連結項目在詳細互動檢查時補入。

## 基線中未發現問題的項目

- 指定寬度未出現整頁水平溢出；有 Mini Player 的頁面，最後歌曲可捲至播放器上方。
- Mini Player 與底部導覽在量測尺寸中未重疊；`env(safe-area-inset-bottom)` 已用於兩者定位與內容留白。
- 路由採 lazy import。Audio Service 僅建立單一 `HTMLAudioElement`，事件監聽器由同一服務註冊並可清理。
- 首頁未請求八首音檔：首次僅載入目前 Envision 的 metadata。封面使用本地自製 SVG，歌曲列的視窗外封面採 lazy loading。

## 驗證結果

- `npm.cmd run build` 通過；`npm.cmd run test` 23/23 通過。
- `output/playwright/phase4a-audit-after.json`：六頁在 320、375、390、430、768、1024、1440px 與 390×568 無整頁水平溢出；最後一首與最後一個歌單可捲至 Mini Player 上方；沒有 Google Fonts 請求或 Console 錯誤。
- `phase4a-browser-check.mjs`：搜尋焦點 2px 外框、篩選／短螢幕播放控制項／授權連結至少 44px、長歌單名稱完整換行、排序狀態通知、短螢幕可捲動、reduced motion 停止唱片動畫。首頁首次僅請求 Envision metadata，未同時下載八首音檔。
- `phase4a-states-check.mjs`：原生播放被拒、重試、緩衝提示與回復、單一 Audio；手機觸控在排序畫面的非把手區仍可正常捲動；390×400 視窗下搜尋欄和 Dialog 輸入框可聚焦、可使用。
- `phase4a-perf-check.mjs`：真實播放 1.25 秒期間，首頁內容 DOM mutation 0、localStorage 寫入 0、Audio 實例 1；資源清單只有初始 Envision metadata 與使用者選播的 Mesmerizing Galaxy，沒有下載其餘六首。
- 既有 `phase3b-browser-check.mjs`：首頁、音樂庫、搜尋、Now Playing、八首真實音檔、Seek Bar／圓環／Mini Player、收藏與多尺寸 RWD 通過；`phase3c1-browser-check.mjs`：歌單 CRUD、Dialog 鍵盤焦點／Esc／觸控、加入／移除與持久化通過；`phase3c2-browser-check.mjs`：滑鼠／觸控排序、佇列、跨頁與底部捲動通過；`phase3c2-ended-check.mjs`：真實音檔播畢下 Repeat Off／All／One 通過。
- 螢幕閱讀器的實際語音輸出、實體 iOS／Android 字型與軟鍵盤行為未在本機 Chrome 模擬環境中確認；這些需要實機驗收。
- 快速切換歌曲時，Chrome 的網路記錄有舊音訊請求 `ERR_ABORTED`；這是換源取消下載，八首音檔仍逐一成功播放，Console 無應用程式錯誤。

## 效能與實作觀察

- 本地 SVG 封面按路由使用；歌曲列表視窗外圖片設 `loading="lazy"`。沒有發現需合併或重新生成封面的證據。
- 最近播放、收藏、歌單的 localStorage 寫入都在狀態變更動作中，`timeupdate` 不寫入儲存空間。
- 頁面採 Vue Router lazy import；Audio Service 的一個 Audio 實例與事件監聽器由既有單元及瀏覽器回歸確認。未修改播放器架構。
