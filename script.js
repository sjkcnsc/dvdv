document.addEventListener("DOMContentLoaded", () => {
  const gridDisplay = document.querySelector(".grid");//هنا قمنا بتحديد العنصر اللي يحمل الـ class اسمه "grid"، وهو المكان اللي رح نعرض فيه شبكة لعبة 2048 (مصفوفة مربعات 4x4).
  const scoreDisplay = document.getElementById("score");
  const resultDisplay = document.getElementById("result");
  const width = 4; // عدد الأعمدة (والصفوف) في شبكة اللعبة. لعبة 2048 تقليديًا تستخدم شبكة 4×4. فبتعمل 16 بلاطه
  //المتغيرات
  let winCount = 0, lossCount = 0, score = 0, moveCount = 0;
  let squares = [], moveLog = [], gameAnalyticsLog = [];
  let lastMoveTime = Date.now();
  let dangerChart;

  function createBoard() { // لانشاء البلاطات يعني شبكه 
    for (let i = 0; i < width * width; i++) {// رح تعمل 16 بلاطه 
      const square = document.createElement("div");
      square.innerHTML = 0;//يعني المربع فارغ أو بدون قيمة
      gridDisplay.appendChild(square);
      squares.push(square);//square هو مجرد اسم متغير يمثل كل مربع أو خلية في شبكة اللعبة.
    }
    generate(); generate(); // توليد رقم (2 أو 4 عادةً)
  }

  function generate() {//هذه الدالة مسؤولة عن إضافة رقم 2 في مربع فارغ عشوائي في الشبكة
    const emptySquares = squares.filter(sq => sq.innerHTML == 0);
    if (emptySquares.length === 0) return;
    const randomSquare = emptySquares[Math.floor(Math.random() * emptySquares.length)];
    randomSquare.innerHTML = 2;
    checkForGameOver();
  }

  function getMaxTile() {//تأخذ كل الأرقام وتحسب أكبر رقم بينهم.


    return Math.max(...squares.map(sq => parseInt(sq.innerHTML)));
  }
function move(direction) {//
  moveCount++;  // عداد عدد الحركات زاد بواحد
  moveLog.push(direction);  // سجلنا اتجاه الحركة (مثل: "يمين" أو "يسار")

  const now = Date.now();  // الوقت الحالي بالميلي ثانية
  const moveTime = now - lastMoveTime;  // حساب الزمن الذي استغرقه اللاعب بين الحركة السابقة وهذه
  lastMoveTime = now;  // تحديث آخر وقت حركة لوقت الآن

  // حساب عدد البلاطات الفارغة (المربعات اللي قيمتها 0)
  const emptyCount = squares.filter(sq => sq.innerHTML == 0).length;

  // الحصول على أكبر بلاطة موجودة (باستخدام الدالة اللي شرحناها سابقاً)
  const maxTile = getMaxTile();

  // حفظ بيانات الحركة في سجل تحليلات اللعبة
  gameAnalyticsLog.push({
    direction,     // اتجاه الحركة
    score,         // النقاط الحالية
    maxTile,       // أكبر رقم على اللوحة
    moveTime,      // الوقت بين الحركة الحالية والسابقة
    emptyTiles: emptyCount,  // عدد البلاطات الفارغة
    timestamp: new Date().toISOString()  // وقت الحركة بتنسيق تاريخ ووقت
  });

  // حفظ أحدث حركة في مكان آخر (دالة خارجية) لتخزين أو عرض لاحق
  saveLatestMove(direction, score, maxTile, moveTime, emptyCount);

  // الآن نبدأ التوصيات الذكية:
  const recentMoves = moveLog.slice(-3);  // ناخذ آخر 3 حركات

  //  إذا كانت الثلاث حركات الأخيرة كلها في نفس الاتجاه
  if (recentMoves.length === 3 && recentMoves.every(m => m === recentMoves[0])) {
    showRecommendation("أنتِ تكررين نفس الاتجاه، جربي تغيير الاتجاه لتحسين النتيجة.");
  }

  //  إذا النقاط أقل من 100 وعدد الحركات أكبر من 30اعطيه توصيه
  if (score < 100 && moveCount > 30) {
    showRecommendation("النقاط ما زالت منخفضة، حاولي التركيز على دمج البلاطات الكبيرة.");
  }
}

  function showRecommendation(message) {
  // نحدد العنصر اللي رح نعرض فيه التوصية
  const box = document.getElementById("recommendationBox");

  // نغير محتوى النص داخل العنصر لإظهار التوصية مع أيقونة 📌
  box.innerText = `📌 توصية: ${message}`;

  // نظهر العنصر (لو كان مخفي)
  box.style.display = "block";

  // نحدد مؤقت لإخفاء العنصر بعد 4 ثواني (4000 ملي ثانية)
  setTimeout(() => {
    box.style.display = "none";
  }, 4000);
}


  function saveLatestMove(direction, score, maxTile, moveTime, emptyTiles) {
  // 1. إنشاء كائن يحتوي بيانات آخر حركة في اللعبة
  const latestMove = {
    Score: score,           // النقاط الحالية في اللعبة
    MaxTile: maxTile,       // أعلى رقم على البلاطات (Tiles)
    "MoveTime(ms)": moveTime, // الوقت الذي استغرقته الحركة (بالملي ثانية)
    EmptyTiles: emptyTiles  // عدد البلاطات الفارغة على اللوحة
  };
  
  // 2. إرسال بيانات الحركة إلى الخادم (السيرفر) لتحليلها
  fetch('http://127.0.0.1:5000/predict', {
    method: 'POST',                       // طريقة الإرسال POST لأنها ترسل بيانات
    headers: { 'Content-Type': 'application/json' }, // نوع البيانات المرسلة JSON
    body: JSON.stringify(latestMove)     // تحويل بيانات الحركة إلى نص JSON
  })
  .then(res => res.json())               // استقبال الرد من السيرفر وتحويله إلى JSON
  .then(data => {
    // 3. بناء على الرد (prediction) نحدد مستوى الخطر:
    // إذا كانت النتيجة 1 معناها في خطر، نحدد الخطر عالي (90)
    // وإذا كانت 0 نحدد الخطر منخفض (20)
    const riskLevel = data.prediction === 1 ? 90 : 20;

    // 4. تحديث واجهة المستخدم برسم مؤشر مستوى الخطر
    drawDangerGauge(riskLevel);

    // 5. إذا كان الخطر عالي، نعرض رسالة تحذير لفترة قصيرة (3 ثواني)
    if (data.prediction === 1) {
      const warningBox = document.getElementById("warningBox");
      warningBox.style.display = "block"; // إظهار مربع التحذير
      setTimeout(() => { warningBox.style.display = "none"; }, 3000); // إخفاؤه بعد 3 ثواني
    }
  })
  .catch(err => console.error("خطأ في الاتصال بالنموذج:", err)); // التعامل مع الأخطاء في الاتصال بالسيرفر
}

function drawDangerGauge(level) {
  // 1. الحصول على عنصر الكانفاس (canvas) ورسمه 2D
  const ctx = document.getElementById("dangerGauge").getContext("2d");

  // 2. إذا كان هناك رسم سابق موجود، نحذفه عشان ما يتراكم الرسم
  if (dangerChart) dangerChart.destroy();

  // 3. إنشاء رسم جديد باستخدام Chart.js من نوع "دونات" (دائري مع ثقب في الوسط)
  dangerChart = new Chart(ctx, {
    type: "doughnut",  // نوع الرسم دائري (دونات)
    data: {
      labels: ["الخطر"],  // التسمية (اللي تظهر بجانب الرسم)
      datasets: [{
        data: [level, 100 - level],  // البيانات: مستوى الخطر + الباقي ليكمل 100
        backgroundColor: 
          level >= 70 ? ["#e74c3c", "#ddd"] :      // إذا الخطر عالي، اللون أحمر
          level >= 40 ? ["#f1c40f", "#ddd"] :      // إذا متوسط، أصفر
                        ["#2ecc71", "#ddd"],       // إذا منخفض، أخضر
        borderWidth: 0  // بدون حدود للرسم
      }]
    },
    // هنا غالبًا تكمل باقي خصائص الرسم (زي الخيارات) 

      options: {
        circumference: 180, rotation: -90, cutout: "70%",
        plugins: { legend: { display: false }, tooltip: { enabled: false } }
      }
    });
  }

//هذه الدوال تقوم فقط بترتيب القيم وتحريكها دون دمج.
 // دالة slide: تحرك الأرقام في الصف لليسار
function slide(row) {
  // تصفي الصف من الأصفار (0 تعتبر فاضية)
  let filtered = row.filter(val => val); // تأخذ القيم اللي مش صفر
  // تضيف أصفار في آخر الصف عشان يعادل الطول الأصلي
  return filtered.concat(Array(width - filtered.length).fill(0));
  // مثال: [2, 0, 2, 4] → [2, 2, 4, 0]
}

// دالة slideReversed: تحرك الأرقام في الصف لليمين
function slideReversed(row) {
  // تصفي الصف من الأصفار
  let filtered = row.filter(val => val);
  // تضيف أصفار في بداية الصف عشان يعادل الطول الأصلي
  return Array(width - filtered.length).fill(0).concat(filtered);
  // مثال: [2, 0, 2, 4] → [0, 2, 2, 4]
}

// دالة moveLeft: تحرك كل صف في اللعبة لليسار
function moveLeft() {
  for (let i = 0; i < 16; i += width) {
    // تقرأ صف من مربعات اللعبة
    let row = squares.slice(i, i + width).map(sq => parseInt(sq.innerHTML));
    // تستخدم slide لتحريك الأرقام لليسار
    let newRow = slide(row);
    // تحدث المربعات بالقيم الجديدة
    for (let j = 0; j < width; j++) squares[i + j].innerHTML = newRow[j];
  }
}

// دالة moveRight: تحرك كل صف في اللعبة لليمين
function moveRight() {
  for (let i = 0; i < 16; i += width) {
    let row = squares.slice(i, i + width).map(sq => parseInt(sq.innerHTML));
    // تستخدم slideReversed لتحريك الأرقام لليمين
    let newRow = slideReversed(row);
    for (let j = 0; j < width; j++) squares[i + j].innerHTML = newRow[j];
  }
}

// دالة moveUp: تحرك كل عمود في اللعبة للأعلى
function moveUp() {
  for (let i = 0; i < width; i++) {
    // تقرأ عمود من مربعات اللعبة (باستخدام الحسابات i + j*width)
    let column = [0, 1, 2, 3].map(j => parseInt(squares[i + j * width].innerHTML));
    // تحرك العمود للأعلى بنفس طريقة slide (تحريك للجهة "الأولى")
    let newColumn = slide(column);
    // تحدث مربعات العمود بالقيم الجديدة
    for (let j = 0; j < 4; j++) squares[i + j * width].innerHTML = newColumn[j];
  }
}

// دالة moveDown: تحرك كل عمود في اللعبة للأسفل
function moveDown() {
  for (let i = 0; i < width; i++) {
    let column = [0, 1, 2, 3].map(j => parseInt(squares[i + j * width].innerHTML));
    // تحرك العمود للأسفل بنفس طريقة slideReversed (تحريك للجهة "الأخيرة")
    let newColumn = slideReversed(column);
    for (let j = 0; j < 4; j++) squares[i + j * width].innerHTML = newColumn[j];
  }
}


  // دمج الأرقام المتشابهة في الصفوف (أرقام متجاورة بنفس القيمة)
function combineRow() {
  for (let i = 0; i < 15; i++) {   // نمشي على كل خانات الصفوف ماعدا آخر خانة في كل صف
    // نتحقق إذا الخانة الحالية واللي بعدها بنفس القيمة
    if (squares[i].innerHTML === squares[i + 1].innerHTML) {
      let total = parseInt(squares[i].innerHTML) * 2;  // نجمع الرقمين (نضرب في 2)
      squares[i].innerHTML = total;       // نحدث الخانة الأولى بالنتيجة الجديدة (المجموع)
      squares[i + 1].innerHTML = 0;       // نصفر الخانة الثانية (تم دمجها)
      score += total;                     // نضيف النتيجة للسكور الكلي
      scoreDisplay.innerHTML = score;    // نحدث عرض السكور في الواجهة
    }
  }
}

// دمج الأرقام المتشابهة في الأعمدة (أرقام متجاورة في نفس العمود)
function combineColumn() {
  for (let i = 0; i < 12; i++) {   // نمشي على كل خانات الأعمدة ماعدا آخر صف في كل عمود
    // نتحقق إذا الخانة الحالية واللي تحتها بنفس القيمة
    if (squares[i].innerHTML === squares[i + width].innerHTML) {
      let total = parseInt(squares[i].innerHTML) * 2;  // نجمع الرقمين
      squares[i].innerHTML = total;       // نحدث الخانة الأولى بالنتيجة
      squares[i + width].innerHTML = 0;   // نصفر الخانة اللي تحتها (تم دمجها)
      score += total;                     // نضيف للنقاط الكلية
      scoreDisplay.innerHTML = score;    // نحدث عرض النقاط
    }
  }
}

 function control(e) {
  switch (e.keyCode) {
    case 37: // مفتاح السهم اليسار
      move("Left");   // تنفذ حركة التحريك لليسار (تحديث اللوحة)
      keyLeft();      // تنفذ وظائف خاصة بتحريك اليسار (دمج وتحريك وتوليد رقم جديد)
      break;
    case 38: // مفتاح السهم للأعلى
      move("Up");
      keyUp();
      break;
    case 39: // مفتاح السهم اليمين
      move("Right");
      keyRight();
      break;
    case 40: // مفتاح السهم للأسفل
      move("Down");
      keyDown();
      break;
  }
}
// تفعيل التحكم عند رفع إصبع اللاعب عن زر السهم (keyup)
document.addEventListener("keyup", control);

// عند تحريك اليسار: تحريك الأرقام لليسار، دمجها، تحريك مرة ثانية لتحديث المواقع، ثم توليد رقم جديد عشوائي في لوحة اللعبة
function keyLeft() { 
  moveLeft(); 
  combineRow(); 
  moveLeft(); 
  generate(); 
}

// نفس الفكرة لباقي الاتجاهات
function keyRight() { 
  moveRight(); 
  combineRow(); 
  moveRight(); 
  generate(); 
}

function keyUp() { 
  moveUp(); 
  combineColumn(); 
  moveUp(); 
  generate(); 
}

function keyDown() { 
  moveDown(); 
  combineColumn(); 
  moveDown(); 
  generate(); 
}

  function checkForWin() {
  // تفحص إذا كان في أي خانة (square) الرقم 2048 موجود
  if (squares.some(sq => sq.innerHTML == 2048)) {
    winCount++; // زيادة عداد الانتصارات
    
    // عرض رسالة الفوز للاعب
    resultDisplay.innerHTML = "مبروووك يا fatima 🎉 وصلتِ لـ 2048! 👑";
    
    // إيقاف استقبال ضغطات المفاتيح (توقيف التحكم في اللعبة)
    document.removeEventListener("keyup", control);
    
    // عرض إحصائيات اللعبة (مثل النقاط، الوقت، الخ)
    showStats();
    
    // عرض زر إعادة تشغيل اللعبة
    showRestartButton();
    
    // بعد 3 ثواني، تنظيف اللعبة أو إعادة تهيئتها (دالة clear)
    setTimeout(clear, 3000);
  }
}


  // دالة للتحقق من انتهاء اللعبة (خسارة) لما ما يكون فيه أي خانة فارغة
function checkForGameOver() {
  // إذا ما في أي خانة فيها صفر (يعني كلها مليانة وما في حركة ممكنة)
  if (!squares.some(sq => sq.innerHTML == 0)) {
    lossCount++; // زيادة عدد مرات الخسارة
    
    // عرض رسالة انتهاء اللعبة وخسارة اللاعب
    resultDisplay.innerHTML = "خلصت اللعبة يا fatima 😢 حاولي مرة تانية!";
    
    // تعطيل تحكم اللاعب في اللعبة (تعطيل ضغطات المفاتيح)
    document.removeEventListener("keyup", control);
    
    // عرض إحصائيات اللعبة
    showStats();
    
    // عرض زر لإعادة تشغيل اللعبة
    showRestartButton();
    
    // تنظيف اللعبة بعد 3 ثواني
    setTimeout(clear, 3000);
  }
}


  function showStats() {
  console.log("عدد الحركات:", moveCount);  // طباعة عدد الحركات اللي عملها اللاعب في وحدة التحكم (الكونسول)
  generateCSVAnalytics();                   // إنشاء ملف تحليلات (CSV) للعبة أو بيانات الحركات
  drawCharts();                             // رسم الرسوم البيانية بناءً على بيانات اللعبة (مثل أداء اللاعب)
}


  function generateCSVAnalytics() {                       // دالة تنشئ ملف CSV يحتوي على تحليلات اللعبة
  let csv = "Direction,Score,MaxTile,MoveTime(ms),EmptyTiles,Timestamp\n";  
                                                        // رأس الجدول: أسماء الأعمدة في ملف CSV

  gameAnalyticsLog.forEach(e => {                       // نكرر على كل عنصر داخل مصفوفة تحليلات اللعبة
    csv += `${e.direction},${e.score},${e.maxTile},${e.moveTime},${e.emptyTiles},${e.timestamp}\n`; 
                                                        // نضيف كل حركة كسطر جديد في ملف CSV
  });

  const link = document.createElement("a");             // ننشئ عنصر <a> جديد وهمي (رابط لتحميل الملف)
  link.href = "data:text/csv;charset=utf-8," + encodeURIComponent(csv);  
                                                        // نحدد رابط التحميل ونشفّر البيانات بصيغة CSV
  link.download = "full_game_data.csv";                 // نحدد اسم الملف عند تحميله
  document.body.appendChild(link);                      // نضيف الرابط مؤقتًا إلى الصفحة
  link.click();                                          // ننفذ نقرة وهمية على الرابط لتنزيل الملف
}


function drawCharts() {
  // 🎯 1. رسم مخطط الأعمدة لعدد مرات الضغط على كل اتجاه (يسار، يمين، فوق، تحت)
  const ctxMove = document.getElementById("moveChart").getContext("2d");
  new Chart(ctxMove, {
    type: "bar", // نوع المخطط: أعمدة
    data: {
      labels: ["Left", "Right", "Up", "Down"], // أسماء الاتجاهات
      datasets: [{
        // نحسب عدد كل اتجاه باستخدام filter
        data: ["Left", "Right", "Up", "Down"].map(d => moveLog.filter(m => m === d).length),
        backgroundColor: ["#f39c12", "#2980b9", "#27ae60", "#c0392b"] // ألوان الأعمدة
      }]
    }
  });

  // 🎯 2. رسم مخطط دائري (doughnut) يوضح عدد مرات الفوز والخسارة
  const ctxWinLoss = document.getElementById("winLossChart").getContext("2d");
  new Chart(ctxWinLoss, {
    type: "doughnut", // نوع المخطط: دونَت
    data: {
      labels: ["فوز", "خسارة"],
      datasets: [{
        data: [winCount, lossCount], // عدد مرات الفوز والخسارة
        backgroundColor: ["#2ecc71", "#e74c3c"] // أخضر للفوز وأحمر للخسارة
      }]
    }
  });

  // 🎯 3. رسم مخطط خطي لزمن الاستجابة بين كل حركة والثانية (ms)
  const moveTimes = gameAnalyticsLog.map(e => e.moveTime); // استخراج أوقات الحركات
  const ctxTime = document.getElementById("moveTimeChart").getContext("2d");
  new Chart(ctxTime, {
    type: "line", // نوع المخطط: خطي
    data: {
      labels: moveTimes.map((_, i) => `حركة ${i + 1}`), // تسميات X: حركة 1، 2، إلخ
      datasets: [{
        label: "الزمن بين الحركات (ms)",
        data: moveTimes, // القيم الفعلية
        borderColor: "#8e44ad", // لون الخط
        backgroundColor: "rgba(142, 68, 173, 0.2)", // تعبئة خفيفة تحت الخط
        tension: 0.4, // انحناء الخط
        fill: true // تعبئة المساحة تحت الخط
      }]
    }
  });

  // 🎯 4. رسم مخطط خطي لتطور أكبر بلاطة وصل لها اللاعب في كل حركة
  const maxTiles = gameAnalyticsLog.map(e => e.maxTile); // استخراج أكبر بلاطة في كل حركة
  const ctxMax = document.getElementById("maxTileChart").getContext("2d");
  new Chart(ctxMax, {
    type: "line",
    data: {
      labels: maxTiles.map((_, i) => `حركة ${i + 1}`),
      datasets: [{
        label: "أعلى بلاطة",
        data: maxTiles,
        borderColor: "#e67e22",
        backgroundColor: "rgba(230, 126, 34, 0.2)",
        tension: 0.3,
        fill: true
      }]
    }
  });
}

// للوان
  function addColours() {
    const colors = {
      0: "#afa192", 2: "#eee4da", 4: "#ede0c8", 8: "#f2b179",
      16: "#ffcea4", 32: "#e8c064", 64: "#ffab6e", 128: "#fd9982",
      256: "#ead79c", 512: "#76daff", 1024: "#beeaa5", 2048: "#d7d4f0"
    };
    squares.forEach(sq => {
      const val = parseInt(sq.innerHTML);
      sq.style.backgroundColor = colors[val] || "#ffffff";
    });
  }

  let myTimer = setInterval(addColours, 50);
  function clear() { clearInterval(myTimer); }

  createBoard();
});

// التحكم بالصوت
const bgMusic = document.getElementById("bgMusic");
const toggleSoundBtn = document.getElementById("toggleSound");
const restartBtn = document.getElementById("restartBtn");
let soundOn = false;

toggleSoundBtn.addEventListener("click", () => {
  soundOn = !soundOn;
  if (soundOn) {
    bgMusic.play();
    toggleSoundBtn.textContent = "إيقاف الصوت 🔇";
  } else {
    bgMusic.pause();
    toggleSoundBtn.textContent = "تشغيل الصوت 🔈";
  }
});
//اظهار زر اعاده تشغيل واعادة تشغيل الصفحه عند الضغط عليه 
function showRestartButton() {
  restartBtn.style.display = "inline-block";
}
restartBtn.addEventListener("click", () => {
  location.reload();
});
