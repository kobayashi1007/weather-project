//https://opendata.cwa.gov.tw/api/v1/rest/datastore/F-C0032-001?Authorization=CWA-283E4C54-42C0-43C8-AC47-AA0CE750AD13
const apiKey = "CWA-283E4C54-42C0-43C8-AC47-AA0CE750AD13";
const endpoint = "https://opendata.cwa.gov.tw/api/v1/rest/datastore/F-C0032-001";

// 建立快取物件
const cache = {};
// 設定快取有效時間 (毫秒) → 一小時
const CACHE_TTL = 60 * 60 * 1000;

async function getWeather() {
  const cityInput = document.getElementById("cityInput").value.trim();
  
  // 如果輸入為空，顯示提示
  if (!cityInput) {
    const errorModal = new bootstrap.Modal(document.getElementById('errorModal'));
    errorModal.show();
    document.getElementById("locationName").textContent = "城市名稱";
    return;
  }
  
  // 完整的城市名稱映射（支援簡體、簡稱等）
  const cityMap = {
    // 直轄市
    "台北市": "臺北市", "台北": "臺北市", "taipei": "臺北市", "Taipei": "臺北市",
    "新北市": "新北市", "新北": "新北市", "newtaipei": "新北市", "NewTaipei": "新北市",
    "台中市": "臺中市", "台中": "臺中市", "taichung": "臺中市", "Taichung": "臺中市",
    "台南市": "臺南市", "台南": "臺南市", "tainan": "臺南市", "Tainan": "臺南市",
    "高雄市": "高雄市", "高雄": "高雄市", "kaohsiung": "高雄市", "Kaohsiung": "高雄市",
    "桃園市": "桃園市", "桃園": "桃園市", "taoyuan": "桃園市", "Taoyuan": "桃園市",
    // 縣市
    "新竹市": "新竹市", "新竹": "新竹市", "hsinchu": "新竹市", "Hsinchu": "新竹市",
    "新竹縣": "新竹縣",
    "苗栗縣": "苗栗縣", "苗栗": "苗栗縣", "苗栗市": "苗栗縣",
    "彰化縣": "彰化縣", "彰化": "彰化縣", "彰化市": "彰化縣",
    "南投縣": "南投縣", "南投": "南投縣",
    "雲林縣": "雲林縣", "雲林": "雲林縣", "雲林市": "雲林縣",
    "嘉義市": "嘉義市", "嘉義": "嘉義市",
    "嘉義縣": "嘉義縣",
    "屏東縣": "屏東縣", "屏東": "屏東縣",
    "台東縣": "臺東縣", "台東": "臺東縣", "taitung": "臺東縣", "Taitung": "臺東縣",
    "花蓮縣": "花蓮縣", "花蓮": "花蓮縣", "hualien": "花蓮縣", "Hualien": "花蓮縣",
    "宜蘭縣": "宜蘭縣", "宜蘭": "宜蘭縣", "yilan": "宜蘭縣", "Yilan": "宜蘭縣",
    "基隆市": "基隆市", "基隆": "基隆市", "keelung": "基隆市", "Keelung": "基隆市",
    "澎湖縣": "澎湖縣", "澎湖": "澎湖縣", "penghu": "澎湖縣", "Penghu": "澎湖縣",
    "金門縣": "金門縣", "金門": "金門縣", "kinmen": "金門縣", "Kinmen": "金門縣",
    "連江縣": "連江縣", "連江": "連江縣", "lienchiang": "連江縣", "Lienchiang": "連江縣",
  };
  const city = cityMap[cityInput] || cityInput;
  const url = `${endpoint}?Authorization=${apiKey}&locationName=${city}`;

  const container = document.getElementById("forecastCards");
  const loadingSpinner = document.getElementById("loadingSpinner");
  const weatherResult = document.getElementById("weatherResult");
  
  // 顯示載入動畫
  container.innerHTML = "";
  loadingSpinner.style.display = "block";
  weatherResult.style.display = "none";
  
  try {
    const now = Date.now();
    // 檢查快取是否存在且未過期
    if (cache[city] && (now - cache[city].timestamp < CACHE_TTL)) {
      console.log("使用快取資料");
      loadingSpinner.style.display = "none";
      weatherResult.style.display = "block";
      document.getElementById("locationName").textContent = city;
      markCityOnMap(city);
      // 清除錯誤訊息
      document.getElementById("errorMessageArea").innerHTML = "";
      renderWeather(cache[city].data, container);
      return;
    }
    const response = await fetch(url);              // 等待 API 回應
    const data = await response.json();             // 等待 JSON 解析
    console.log(data);
    container.innerHTML = "";

    if (!data.records || !data.records.location || data.records.location.length === 0) {
      // 隱藏載入動畫
      loadingSpinner.style.display = "none";
      weatherResult.style.display = "block";
      // 顯示錯誤彈窗
      const errorModal = new bootstrap.Modal(document.getElementById('errorModal'));
      errorModal.show();
      // 清空輸入欄
      document.getElementById("cityInput").value = "";
      // 恢復標題為「城市名稱」
      document.getElementById("locationName").textContent = "城市名稱";
      // 顯示錯誤訊息在搜尋欄下方
      const errorArea = document.getElementById("errorMessageArea");
      errorArea.innerHTML = `<div class="error-message-container"><p class="error-message">⚠️ 查無資料，請確認城市名稱</p></div>`;
      container.innerHTML = "";
      return;
    }
    // 更新標題為正確的城市名稱
    document.getElementById("locationName").textContent = city;
    markCityOnMap(city);
    // 更新快取
    cache[city] = { data, timestamp: now };
    // 隱藏載入動畫，顯示結果
    loadingSpinner.style.display = "none";
    weatherResult.style.display = "block";
    // 清除錯誤訊息
    document.getElementById("errorMessageArea").innerHTML = "";
    // 首次查詢也要直接渲染
    renderWeather(data, container);
  } catch (err) {
    // 隱藏載入動畫
    loadingSpinner.style.display = "none";
    weatherResult.style.display = "block";
    // 顯示錯誤彈窗
    const errorModal = new bootstrap.Modal(document.getElementById('errorModal'));
    errorModal.show();
    // 清空輸入欄
    document.getElementById("cityInput").value = "";
    // 恢復標題為「城市名稱」
    document.getElementById("locationName").textContent = "城市名稱";
    // 顯示錯誤訊息在搜尋欄下方
    const errorArea = document.getElementById("errorMessageArea");
    errorArea.innerHTML = `<div class="error-message-container"><p class="error-message">⚠️ 查詢失敗，請稍後再試</p></div>`;
    document.getElementById("forecastCards").innerHTML = "";
    console.error(err);
  }
}

// 把 renderWeather 抽到外面，讓快取與首次查詢都能共用
function renderWeather(data, container) { 
    const location = data.records.location[0];
    const times = location.weatherElement[0].time; 
    // 每次渲染前先清空
    container.innerHTML = "";
    
    // 使用 documentFragment 優化 DOM 操作
    const fragment = document.createDocumentFragment();
    const row = document.createElement('div');
    row.className = 'row';
    
    // 顯示所有時段
    times.forEach((t, index) => {
      const weatherDesc = location.weatherElement[0].time[index].parameter.parameterName;
      const pop = location.weatherElement[1].time[index].parameter.parameterName;
      const minTemp = location.weatherElement[2].time[index].parameter.parameterName;
      const ci = location.weatherElement[3].time[index].parameter.parameterName;
      const maxTemp = location.weatherElement[4].time[index].parameter.parameterName;
      const startTime = new Date(t.startTime).toLocaleString("zh-TW", { 
        month: "short", 
        day: "numeric", 
        hour: "2-digit", 
        minute: "2-digit" 
      });
      
      // 創建卡片元素
      const col = document.createElement('div');
      col.className = 'col-md-3 col-sm-6 mb-3';
      
      const cardHTML = `
        <div class="flip-card-container" onclick="flipCard(this)">
          <div class="flip-card-inner">
            <div class="flip-card-front card p-2 text-center shadow-sm">
              <h6 class="card-time">${startTime}</h6>
              <div class="card-icon">${getIcon(weatherDesc)}</div>
              <p class="card-temp">${minTemp}°C ~ ${maxTemp}°C</p>
              <small class="card-desc">${weatherDesc}</small>
              <div class="card-hint">點擊查看詳情</div>
            </div>
            <div class="flip-card-back card p-2 text-center shadow-sm">
              <div class="card-back-content">
                <div>
                  <h6 class="card-back-title">詳細資訊</h6>
                  <div class="card-back-icon">${getIcon(weatherDesc)}</div>
                  <div class="card-back-info">
                    <div><strong>體感溫度：</strong>${ci}°C</div>
                  </div>
                  <div class="card-back-info">
                    <div><strong>降雨機率：</strong>${pop}%</div>
                  </div>
                  <div class="card-back-info">
                    <div><strong>溫度：</strong>${minTemp}°C ~ ${maxTemp}°C</div>
                  </div>
                  <div class="card-back-info">
                    <div><strong>天氣：</strong>${weatherDesc}</div>
                  </div>
                </div>
                <div class="card-back-hint">點擊返回</div>
              </div>
            </div>
          </div>
        </div>
      `;
      
      col.innerHTML = cardHTML;
      row.appendChild(col);
    });
    
    fragment.appendChild(row);
    container.appendChild(fragment);
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

// 從地圖選擇城市
function selectCityFromMap(cityName) {
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
  
  // 只標記選中的城市（單一標記）
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

// 處理 Enter 鍵查詢
function handleEnterKey(event) {
  if (event.key === 'Enter' || event.keyCode === 13) {
    event.preventDefault();
    getWeather();
  }
}

