# 🎯 法拍雷達專案：外部資源與數據戰略地圖

這份文件詳細記錄了專案目前整合的所有外部數據來源、技術工具與雲端基礎設施，並根據其在法拍領域的用途進行分類。

---

## 🏛️ 1. 核心法律與房價數據 (Core Data)

### 🏠 不動產實價登錄 (Real Estate Market)
*   **來源**：[台北市政府開放資料平台](https://data.taipei/dataset/detail?id=13733)
*   **用途**：提供最新的房屋買賣成交真實價格，作為法拍投標的基礎估價參考。
*   **整合現況**：已透過 `syncRealEstate.ts` 每日自動同步至 Firebase。

### ⚖️ 司法院判決與拍賣數據 (Judicial Data)
*   **來源**：[司法院裁判書 API (1140822版)](https://opendata.judicial.gov.tw/) | [法院拍賣公告系統](https://aomp109.judicial.gov.tw/judbp/wkw/WHD1A02.htm)
*   **用途**：
    1.  **裁判分析**：產權糾紛與法律風險評估。
    2.  **法拍公告即時抓取**：獲取最新的第一手法院拍賣資訊（包含案號、拍次、底價）。
*   **整合現況**：已建立 `syncJudgments.ts` (裁判書) 與 `syncAuctions.ts` (法拍公告) 自動抓取與備份機制。

### 🏗️ 政府電子採購網 (Government Procurement)
*   **來源**：[PCC API (OpenFun)](https://pcc-api.openfun.app/) | [閱覽器](https://ronnywang.github.io/pcc-viewer/index.html)
*   **用途**：
    1.  **修繕行情查核**：參考政府標案決標金額，估算房屋翻新成本。
    2.  **區域發展預測**：偵測周邊公共建設投入，判斷潛在增值幅度。
*   **整合現況**：潛在擴充資源，可用於「專業版」成本評估功能。

---

## ☁️ 2. 雲端基礎設施 (Infrastructure)

### 🗄️ Firebase (Google Cloud Partition)
*   **用途**：存放 App 正在使用的「即時」高頻資料（如：當前法拍物件清單、使用者帳號、最新成交價）。
*   **限制**：存儲空間精簡，主要供手機 App 讀取。

### 💾 Google Drive 2TB (Big Data Warehouse)
*   **用途**：您的「大數據冷倉庫」。
    1.  **原始數據備份**：永久保存政府原始 JSON 資料（防止政府端更動或移除）。
    2.  **執行日誌記錄**：追蹤每日自動化腳本的執行成效。
    3.  **大型 PDF 備份**：存放法拍公告原本、照片。
*   **整合現況**：已成功串接 OAuth2 授權（`token.json`），實現無限空間備份。

---

## 🤖 3. AI 與影像生成 (AI Assets)

### 🔮 Google Gemini Pro / Flash 1.5
*   **用途**：
    1.  **裁判書解密**：將法官寫的複雜法律術語轉化為白話文風險指標。
    2.  **物件總結**：自動總結該物件的利弊得失。
*   **整合現況**：已整合於 `src/lib/gemini.ts`。

### 🎨 Image Generation
*   **用途**：當缺乏實景照片時，生成物件預覽圖、風格示意圖或塔羅占卜 UI 輔助影像。
*   **整合現況**：專案開發中。

---

## 🛠️ 4. 技術整合工具 (Developer Tools)

*   **系統架構**：React Native (Expo) - 前後端分離、跨平台開發。
*   **地圖模組**：`Leaflet` / `React-Leaflet` - 提供法拍物件的視覺化地圖定位。
*   **自動化流**：`GitHub Actions` - 每日凌晨自動啟動資料抓取、同步、雲端備份。

---

## 📈 未來擴充潛力
- **內政部地籍資料 API**：更精準的土地分區與持分比例分析。
- **地址轉座標 (Geocoding) API**：目前前端暫用 `expo-location` 進行動態解析，未來建議整合 Google Maps Geocoding API 以提升精準度與穩定性。
- **電力/自來水異常查詢**：輔助判斷該物件是否為空屋、斷水斷電現況。

---
最後更新時間：2026-02-22
