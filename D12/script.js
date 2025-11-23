// 等待 DOM 完全載入後再執行
document.addEventListener('DOMContentLoaded', function() {
  const $ = id => document.getElementById(id);
  const dogName = $('dogName');
  const birth = $('birth');
  const calc = $('calc');
  const result = $('result');
  const dogAgeEl = $('dogAge');
  const humanAgeEl = $('humanAge');
  const breakdown = $('breakdown');
  const debug = $('debug');
  const todayBtn = $('todayBtn');
  
  const STORAGE_KEY = 'dogAgeCalculator';
  
  function daysBetween(a, b) {
    const msPerDay = 1000 * 60 * 60 * 24;
    return (b - a) / msPerDay;
  }
  
  function calcAgesFromDate(dob) {
    const now = new Date();
    const dobDate = new Date(dob.getFullYear(), dob.getMonth(), dob.getDate());
    const days = daysBetween(dobDate, now);
    const dogYears = days / 365.25;
    
    let human = 0;
    const first = Math.min(dogYears, 1);
    const second = Math.min(Math.max(dogYears - 1, 0), 1);
    const after = Math.max(dogYears - 2, 0);
    human = first * 15 + second * 9 + after * 5;
    
    return { dogYears, human, first, second, after, days };
  }
  
  function formatYears(years) {
    const y = Math.floor(years);
    const rem = years - y;
    const months = Math.floor(rem * 12);
    return `${years.toFixed(2)} 歲<br><small style="font-size:14px;font-weight:400;color:#64748b;">（約 ${y} 歲 ${months} 個月）</small>`;
  }
  
  function saveToStorage(dogNameValue, dobString, resultData) {
    const data = {
      dogName: dogNameValue,
      birthDate: dobString,
      calculatedAt: new Date().toISOString(),
      result: resultData
    };
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (e) {
      console.log('無法儲存資料:', e);
    }
  }
  
  function loadFromStorage() {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      return data ? JSON.parse(data) : null;
    } catch (e) {
      console.log('無法讀取資料:', e);
      return null;
    }
  }
  
  function showResult(dogNameValue, dobString) {
    if (!dobString) return alert('請選擇出生日期');
    const dob = new Date(dobString);
    if (isNaN(dob)) return alert('無效日期');
    
    // 檢查日期是否為未來日期
    const today = new Date();
    // today.setHours(0, 0, 0, 0);
    today.setHours(23, 59, 59, 999); // 今天 23:59:59
    if (dob > today) {
      return alert('出生日期不能是未來的日期喔！🐾');
    }
    
    const name = dogNameValue.trim() || '狗狗';
    const { dogYears, human, first, second, after, days } = calcAgesFromDate(dob);
    
    result.style.display = 'block';
    dogAgeEl.innerHTML = formatYears(dogYears);
    humanAgeEl.innerHTML = `${human.toFixed(1)} 歲`;
    
    breakdown.innerHTML = `
      <strong>📝 ${name} 的計算明細：</strong><br>
      • 第1年貢獻：${(first * 15).toFixed(2)} 人年<br>
      • 第2年貢獻：${(second * 9).toFixed(2)} 人年<br>
      • 後續年份：${(after * 5).toFixed(2)} 人年<br>
      <strong>總計：${human.toFixed(2)} 人年</strong>
    `;
    
    debug.textContent = `狗狗名字: ${name}
出生日期: ${dob.toLocaleDateString('zh-TW')}
今天: ${new Date().toLocaleDateString('zh-TW')}
天數差: ${Math.round(days)} 天
狗狗年數: ${dogYears.toFixed(4)} 年

計算拆解:
  第1年(已占): ${first.toFixed(4)} 年 => ${(first*15).toFixed(2)} 人年
  第2年(已占): ${second.toFixed(4)} 年 => ${(second*9).toFixed(2)} 人年
  第3年以後: ${after.toFixed(4)} 年 => ${(after*5).toFixed(2)} 人年

總人類等效年齡: ${human.toFixed(4)} 歲`;
    
    saveToStorage(name, dobString, { dogYears, human, first, second, after, days });
  }
  
  function restoreLastCalculation() {
    const saved = loadFromStorage();
    if (saved && saved.birthDate) {
      if (saved.dogName) dogName.value = saved.dogName;
      birth.value = saved.birthDate;
      showResult(saved.dogName || '', saved.birthDate);
    }
  }
  
  // 設定日期選擇器最大值為今天（使用本地時區）
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  const todayString = `${year}-${month}-${day}`;
  birth.setAttribute('max', todayString);
  
  // 綁定事件監聽器
  calc.addEventListener('click', () => showResult(dogName.value, birth.value));
  
  birth.addEventListener('keydown', (e) => { 
    if (e.key === 'Enter') showResult(dogName.value, birth.value); 
  });
  
  dogName.addEventListener('keydown', (e) => { 
    if (e.key === 'Enter') showResult(dogName.value, birth.value); 
  });
  
  todayBtn.addEventListener('click', () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    birth.value = `${year}-${month}-${day}`;
  });
  
  // 恢復上次的計算結果
  restoreLastCalculation();
});