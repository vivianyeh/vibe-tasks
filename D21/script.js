// 設定 API 和 CSV URL
const API_URL = "https://acwaweather-backend.zeabur.app/api/weather"; // 填入您的天氣 API URL
const CSV_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vQ9T6doWCKUKmRSIetIF56v4SwClJ26EmpYYoj4yFfEyLFy67rf8wFoQeIDaBN1ikw0Us_iEIQJxbTo/pub?gid=0&single=true&output=csv";
let dessertsData = [];
let currentWeather = null;
let userLocation = "新北市";

// 城市與縣市對應表（用於地理定位）
const cityMapping = {
    "Taipei": "臺北市",
    "New Taipei": "新北市",
    "Taoyuan": "桃園市",
    "Taichung": "臺中市",
    "Tainan": "臺南市",
    "Kaohsiung": "高雄市",
    "Keelung": "基隆市",
    "Hsinchu": "新竹市",
    "Chiayi": "嘉義市"
};

// 初始化
document.addEventListener('DOMContentLoaded', async () => {
    setupEventListeners();
    await getUserLocation();
    await loadCSVData();
    await fetchWeather();
});

function setupEventListeners() {
    document.getElementById('drawButton').addEventListener('click', drawDessert);
    document.getElementById('closeButton').addEventListener('click', closePopup);
    document.getElementById('resultOverlay').addEventListener('click', (e) => {
        if (e.target.id === 'resultOverlay') {
            closePopup();
        }
    });
    document.getElementById('locationSelect').addEventListener('change', fetchWeather);
}

function closePopup() {
    document.getElementById('resultOverlay').classList.add('hidden');
}

// 取得使用者地理位置
async function getUserLocation() {
    return new Promise((resolve) => {
        if (!navigator.geolocation) {
            console.log("瀏覽器不支援地理定位，使用預設城市：新北市");
            resolve("新北市");
            return;
        }

        navigator.geolocation.getCurrentPosition(
            async (position) => {
                try {
                    const { latitude, longitude } = position.coords;
                    console.log("取得位置:", latitude, longitude);

                    const response = await fetch(
                        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&accept-language=zh-TW`
                    );
                    const data = await response.json();

                    const city = data.address.city || data.address.county || data.address.state;
                    console.log("偵測到城市:", city);

                    let detectedCity = "新北市";
                    for (const [key, value] of Object.entries(cityMapping)) {
                        if (city && city.includes(key)) {
                            detectedCity = value;
                            break;
                        }
                    }

                    const locationSelect = document.getElementById('locationSelect');
                    const options = Array.from(locationSelect.options).map(opt => opt.value);

                    if (options.includes(detectedCity)) {
                        userLocation = detectedCity;
                        locationSelect.value = detectedCity;
                        console.log("使用偵測到的城市:", detectedCity);
                    } else if (options.includes(city)) {
                        userLocation = city;
                        locationSelect.value = city;
                        console.log("使用偵測到的城市:", city);
                    } else {
                        console.log("偵測到的城市不在選單中，使用預設城市：新北市");
                    }

                    resolve(userLocation);
                } catch (error) {
                    console.error("反向地理編碼失敗:", error);
                    console.log("使用預設城市：新北市");
                    resolve("新北市");
                }
            },
            (error) => {
                console.log("無法取得地理位置:", error.message);
                console.log("使用預設城市：新北市");
                resolve("新北市");
            },
            {
                enableHighAccuracy: true,
                timeout: 5000,
                maximumAge: 0
            }
        );
    });
}

// 載入 CSV 資料
async function loadCSVData() {
    if (!CSV_URL) {
        console.log("未設定 CSV_URL，無法載入甜點資料");
        return;
    }

    try {
        const response = await fetch(CSV_URL);
        const csvText = await response.text();
        dessertsData = parseCSV(csvText);
        console.log(`自動載入 ${dessertsData.length} 筆甜點資料`);
    } catch (error) {
        console.error('自動載入 CSV 失敗:', error);
    }
}

// 解析 CSV
function parseCSV(csvText) {
    const lines = csvText.split('\n').filter(line => line.trim());
    const data = [];

    for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',').map(v => v.trim());
        if (values.length >= 6) {
            data.push({
                weather: values[0],
                tempRange: values[1],
                timeRange: values[2],
                name: values[3],
                reason: values[4],
                healthLevel: parseInt(values[5]) || 1
            });
        }
    }

    return data;
}

// 從 API 載入天氣資訊
async function fetchWeather() {
    try {
        const location = document.getElementById('locationSelect').value || userLocation;
        console.log("Fetching weather for:", location);

        if (!API_URL) {
            console.log("未設定 API_URL，使用模擬天氣資料");
            await new Promise(resolve => setTimeout(resolve, 1500));
            const mockData = getMockWeatherData(location);
            renderWeather(mockData);
            document.getElementById('loading').style.display = 'none';
            document.getElementById('mainContent').style.display = 'block';
            return;
        }

        const delayPromise = new Promise(resolve => setTimeout(resolve, 1500));
        const fetchPromise = fetch(`${API_URL}/${encodeURIComponent(location)}`)
            .then(res => res.json());

        const [_, json] = await Promise.all([delayPromise, fetchPromise]);

        if (json.success) {
            renderWeather(json.data);
            document.getElementById('loading').style.display = 'none';
            document.getElementById('mainContent').style.display = 'block';
        } else {
            throw new Error("API Error");
        }
    } catch (e) {
        console.error(e);
        alert("天氣資料讀取失敗，使用模擬資料");
        const location = document.getElementById('locationSelect').value || userLocation;
        const mockData = getMockWeatherData(location);
        renderWeather(mockData);
        document.getElementById('loading').style.display = 'none';
        document.getElementById('mainContent').style.display = 'block';
    }
}

function getMockWeatherData(city) {
    return {
        city: city,
        forecasts: [
            {
                startTime: "2025-01-0 06:00:00",
                endTime: "2025-01-01 18:00:00",
                weather: "晴時多雲",
                rain: "0%",
                minTemp: "19°C",
                maxTemp: "25°C"
            }
        ]
    };
}

function renderWeather(weatherData) {
    currentWeather = getCurrentWeatherInfo(weatherData);
    displayWeather(currentWeather);
}

function getCurrentWeatherInfo(weatherData) {
    const now = new Date();
    const currentHour = now.getHours();

    let currentForecast = null;
    for (const forecast of weatherData.forecasts) {
        const startTime = new Date(forecast.startTime);
        const endTime = new Date(forecast.endTime);
        if (now >= startTime && now < endTime) {
            currentForecast = forecast;
            break;
        }
    }

    if (!currentForecast) {
        currentForecast = weatherData.forecasts[0];
    }

    let weather = currentForecast.weather;
    const types = ["多雲", "晴", "陰", "雨", "雷"];

    // 檢查是否以其中一種天氣開頭
    let match = types.find(t => weather.startsWith(t));

    let newWeather = match ? match : types[Math.floor(Math.random() * types.length)];


    let timeRange;
    if (currentHour >= 5 && currentHour < 11) {
        timeRange = '早晨';
    } else if (currentHour >= 11 && currentHour < 14) {
        timeRange = '中午';
    } else if (currentHour >= 14 && currentHour < 18) {
        timeRange = '下午';
    } else if (currentHour >= 18 && currentHour < 23) {
        timeRange = '晚上';
    } else {
        timeRange = '深夜';
    }
    let avgTemp = Math.round((parseInt(currentForecast.maxTemp) + parseInt(currentForecast.minTemp)) / 2);

    let tempRange;
    if (avgTemp >= 28) {
        tempRange = '>=28';
    } else if (avgTemp >= 20) {
        tempRange = '20~28';
    } else {
        tempRange = '<=20';
    }

    return {
        city: weatherData.city,
        weather: newWeather,
        tempRange: tempRange,
        timeRange: timeRange,
        displayweather: weather,
        avgTemp: avgTemp,
        rain: currentForecast.rain
    };
}

function displayWeather(weather) {
    const weatherIcon = getWeatherIcon(weather.weather);
    const html = ` 
                <div class="hero-temp-container">
                    <div class="hero-icon">${weatherIcon}</div>
                    <div class="hero-temp">${weather.avgTemp}°</div>
                </div>
                <div class="weather-info-item">
                    <div class="weather-info-value"> ${weather.displayweather}</div>
                </div>
            `;
    document.getElementById('weatherInfo').innerHTML = html;

    // 更新時間顯示
    updateTimeDisplay();
}

function updateTimeDisplay() {
    const now = new Date();
    const month = now.getMonth() + 1;
    const date = now.getDate();
    const dayIndex = now.getDay();
    const days = ["週日", "週一", "週二", "週三", "週四", "週五", "週六"];
    document.getElementById('updateTime').textContent = `${month}月${date}日 ${days[dayIndex]}`;
}

function getWeatherIcon(weather) {
    if (!weather) return "🌤️";
    if (weather.includes("晴")) return "☀️";
    if (weather.includes("多雲")) return "⛅";
    if (weather.includes("陰")) return "☁️";
    if (weather.includes("雨")) return "🌧️";
    if (weather.includes("雷")) return "⛈️";
    return "🌤️";
}

function drawDessert() {
    if (dessertsData.length === 0) {
        alert('請先載入 CSV 資料');
        return;
    }

    if (!currentWeather) {
        alert('天氣資訊尚未載入');
        return;
    }

    const shouldEat = Math.random() > 0.75;

    if (!shouldEat) {
        showNoDessertResult();
        return;
    }

    const matchingDesserts = dessertsData.filter(d =>
        d.weather === currentWeather.weather &&
        d.tempRange === currentWeather.tempRange &&
        d.timeRange === currentWeather.timeRange
    );

    if (matchingDesserts.length === 0) {
        showNoDessertResult('找不到適合的甜點');
        return;
    }

    const selectedDessert = weightedRandomSelect(matchingDesserts);
    showDessertResult(selectedDessert);
}

function weightedRandomSelect(desserts) {
    const weights = desserts.map(d => d.healthLevel);
    const totalWeight = weights.reduce((sum, w) => sum + w, 0);
    let random = Math.random() * totalWeight;

    for (let i = 0; i < desserts.length; i++) {
        random -= weights[i];
        if (random <= 0) {
            return desserts[i];
        }
    }

    return desserts[desserts.length - 1];
}

function showNoDessertResult(message = '現在不適合吃甜點喔！') {
    document.getElementById('resultIcon').textContent = '🚫';
    document.getElementById('cardTitle').textContent = message;
    document.getElementById('healthLevel').innerHTML = '';
    document.getElementById('reason').textContent = '讓身體休息一下，晚點再來抽吧！';
    document.getElementById('resultOverlay').classList.remove('hidden');
}

function showDessertResult(dessert) {
    document.getElementById('resultIcon').textContent = '🍩';
    document.getElementById('cardTitle').textContent = dessert.name;

    const hearts = '❤️'.repeat(dessert.healthLevel);
    document.getElementById('healthLevel').innerHTML = `<span class="health-label">HP</span>${hearts}`;

    document.getElementById('reason').textContent = dessert.reason;
    document.getElementById('resultOverlay').classList.remove('hidden');
}