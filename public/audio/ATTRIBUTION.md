# Transition 測試音訊來源與授權

| 檔案 | 曲名 | 對應心情 | 長度 | 作者 | 授權 |
| --- | --- | --- | --- | --- | --- |
| `still-waters.m4a` | Still Waters | 沉靜感謝 Still Gratitude | 1:30 | FORWARD Synth Lab（本專案程式合成） | CC0 1.0 |
| `turning.m4a` | Turning | 誠實轉身 Honest Turning | 1:12 | FORWARD Synth Lab（本專案程式合成） | CC0 1.0 |
| `daybreak.m4a` | Daybreak | 盼望向前 Hope Forward | 1:31 | FORWARD Synth Lab（本專案程式合成） | CC0 1.0 |

- 三首皆由 `scripts/gen-audio.py` 以程式合成（numpy／scipy 產生和弦 pad、琶音與殘響，macOS `afconvert` 轉 AAC 96 kbps），不含任何第三方取樣或錄音，因此授權可完整追溯。
- 僅供開發與 UAT 測試。正式上線前需由 COMMS 確認最終曲目與授權，替換後請同步更新 `src/data/content.ts` 的 `MOODS` 與本檔案。
- 播放器不自動播放；只有使用者按下播放後才會載入音檔（`preload="none"`）。
