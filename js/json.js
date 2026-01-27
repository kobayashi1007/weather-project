//https://opendata.cwa.gov.tw/api/v1/rest/datastore/F-C0032-001?Authorization=CWA-283E4C54-42C0-43C8-AC47-AA0CE750AD13
const apiKey = "CWA-283E4C54-42C0-43C8-AC47-AA0CE750AD13";
const endpoint = "https://opendata.cwa.gov.tw/api/v1/rest/datastore/F-C0032-001";

// 建立快取物件
const cache = {};
// 設定快取有效時間 (毫秒) → 一小時
const CACHE_TTL = 60 * 60 * 1000;

async function getWeather() {
  const cityInput = document.getElementById("cityInput").value.trim();
  const cityMap = {
    "台北市": "臺北市",
    "台中市": "臺中市",
    "台南市": "臺南市",
    "新北市": "新北市",
    "高雄市": "高雄市",
    "台北" :"臺北市",
    "台東縣":"臺東縣",
    "台東":"臺東縣",  
  };
  const city = cityMap[cityInput] || cityInput;
  const url = `${endpoint}?Authorization=${apiKey}&locationName=${city}`;

  document.getElementById("locationName").textContent = city;
  markCityOnMap(city);
  const container = document.getElementById("forecastCards");
  container.innerHTML = "";
  try {
    const now = Date.now();
    // 檢查快取是否存在且未過期
    if (cache[city] && (now - cache[city].timestamp < CACHE_TTL)) {
    console.log("使用快取資料");
    renderWeather(cache[city].data, container);
    return;
    }
    const response = await fetch(url);              // 等待 API 回應
    const data = await response.json();             // 等待 JSON 解析
    console.log(data);
    container.innerHTML = "";

    if (!data.records || !data.records.location || data.records.location.length === 0) {
      container.innerHTML = `<p class="text-danger">查無資料，請確認城市名稱</p>`;
      return;
    }
    // 更新快取
    cache[city] = { data, timestamp: now };
    function renderWeather(data, container) { 
    const location = data.records.location[0];
    const times = location.weatherElement[0].time; 
    // 每次渲染前先清空
    container.innerHTML = "";
    // 顯示所有時段，不再限制只顯示3個
    times.forEach((t, index) => {
      const weatherDesc = location.weatherElement[0].time[index].parameter.parameterName;
      console.log(`第${index+1}時段天氣：${weatherDesc}`);
      const minTemp = location.weatherElement[2].time[index].parameter.parameterName;
      const maxTemp = location.weatherElement[4].time[index].parameter.parameterName;
      const startTime = new Date(t.startTime).toLocaleString("zh-TW", { 
        month: "short", 
        day: "numeric", 
        hour: "2-digit", 
        minute: "2-digit" 
      });
      const endTime = new Date(t.endTime).toLocaleString("zh-TW", { 
        month: "short", 
        day: "numeric", 
        hour: "2-digit", 
        minute: "2-digit" 
      });
      const fullStartTime = new Date(t.startTime).toLocaleString("zh-TW", { 
        year: "numeric",
        month: "long", 
        day: "numeric", 
        hour: "2-digit", 
        minute: "2-digit",
        weekday: "short"
      });
      const fullEndTime = new Date(t.endTime).toLocaleString("zh-TW", { 
        year: "numeric",
        month: "long", 
        day: "numeric", 
        hour: "2-digit", 
        minute: "2-digit",
        weekday: "short"
      });

      container.innerHTML += `
        <div class="col-md-3 col-sm-6 mb-3">
          <div class="flip-card-container" onclick="flipCard(this)">
            <div class="flip-card-inner">
              <div class="flip-card-front card p-2 text-center shadow-sm">
                <h6 style="font-size: 0.9rem; margin-bottom: 0.5rem;">${startTime}</h6>
                <div style="font-size: 1.5rem;">${getIcon(weatherDesc)}</div>
                <p style="font-size: 0.85rem; margin: 0.5rem 0;">${minTemp}°C ~ ${maxTemp}°C</p>
                <small style="font-size: 0.75rem;">${weatherDesc}</small>
                <div style="margin-top: 0.5rem; font-size: 0.7rem; opacity: 0.7;">點擊查看詳情</div>
              </div>
              <div class="flip-card-back card p-2 text-center shadow-sm">
                <div style="width: 100%; height: 100%; display: flex; flex-direction: column; justify-content: space-between; padding: 0.5rem;">
                  <div>
                    <h6 style="font-size: 0.85rem; margin-bottom: 0.4rem; font-weight: bold;">詳細資訊</h6>
                    <div style="font-size: 1.2rem; margin-bottom: 0.4rem;">${getIcon(weatherDesc)}</div>
                    <div style="font-size: 0.7rem; line-height: 1.4; margin-bottom: 0.3rem;">
                      <div><strong>開始：</strong>${fullStartTime}</div>
                    </div>
                    <div style="font-size: 0.7rem; line-height: 1.4; margin-bottom: 0.3rem;">
                      <div><strong>結束：</strong>${fullEndTime}</div>
                    </div>
                    <div style="font-size: 0.75rem; line-height: 1.4; margin-bottom: 0.3rem;">
                      <div><strong>溫度：</strong>${minTemp}°C ~ ${maxTemp}°C</div>
                    </div>
                    <div style="font-size: 0.7rem; line-height: 1.4;">
                      <div><strong>天氣：</strong>${weatherDesc}</div>
                    </div>
                  </div>
                  <div style="margin-top: auto; font-size: 0.65rem; opacity: 0.7; padding-top: 0.3rem;">點擊返回</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      `;
    });
  }
  } catch (err) {
    document.getElementById("forecastCards").innerHTML =
      `<p class="text-danger">查詢失敗，請稍後再試</p>`;
    console.error(err);
  }
}

// 根據天氣描述選擇 emoji 圖示
function getIcon(desc) {
  if (!desc || typeof desc !== "string") return "🌈";
  
  const descStr = desc.toString();
  
  // 優先判斷複雜的天氣狀況
  if (descStr.includes("雷") || descStr.includes("閃電")) return "⛈️";
  if (descStr.includes("雪")) return "❄️";
  if (descStr.includes("霧")) return "🌫️";
  if (descStr.includes("雨")) return "🌧️";
  if (descStr.includes("晴") && descStr.includes("雲")) return "⛅";
  if (descStr.includes("晴")) return "☀️";
  if (descStr.includes("雲")) return "⛅";
  if (descStr.includes("陰")) return "☁️";
  
  return "🌈";
}

// 選擇城市便捷框的函數
function selectCity(cityName) {
  document.getElementById("cityInput").value = cityName;
  getWeather();
}

// 在地圖上標記城市
function markCityOnMap(cityName) {
  // 清除所有標記
  const allMarkers = document.querySelectorAll('.city-marker');
  const allLabels = document.querySelectorAll('.city-label');
  
  allMarkers.forEach(marker => {
    marker.classList.remove('active');
    marker.setAttribute('opacity', '0');
  });
  
  allLabels.forEach(label => {
    label.classList.remove('active');
    label.setAttribute('opacity', '0');
  });
  
  // 標記選中的城市
  const marker = document.getElementById(`marker-${cityName}`);
  const label = document.getElementById(`label-${cityName}`);
  
  if (marker) {
    marker.classList.add('active');
    marker.setAttribute('opacity', '1');
  }
  
  if (label) {
    label.classList.add('active');
    label.setAttribute('opacity', '1');
  }
}

// 翻轉卡片函數
function flipCard(element) {
  element.classList.toggle('flipped');
}

// 切換地圖展開/縮起
function toggleMap() {
  const mapContainer = document.getElementById('taiwanMapContainer');
  const toggleIcon = document.getElementById('mapToggleIcon');
  
  mapContainer.classList.toggle('collapsed');
  
  // 更新按鈕圖示
  if (mapContainer.classList.contains('collapsed')) {
    toggleIcon.textContent = '🗺️';
    toggleIcon.title = '展開地圖';
  } else {
    toggleIcon.textContent = '✕';
    toggleIcon.title = '縮起地圖';
  }
}