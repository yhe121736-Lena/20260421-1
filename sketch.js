/**
 * 六章：增添色彩 - 星際主題版本
 * 結合重點：HSB模式、blendMode(SCREEN)、lerpColor、色彩陣列
 */

let stars = []; // 儲存背景星點的陣列
let nebulaColors = []; // 儲存星雲色票的陣列
let planets = []; // 儲存隕石星球的陣列
let mic, fft; // 音訊輸入與分析
let audioStarted = false; // 確保音訊環境已啟動
let isDancing = false; // 切換跳動模式的開關

function setup() {
  createCanvas(windowWidth, windowHeight);
  
  // 1. 設定色彩模式為 HSB (色相0-360, 飽和0-100, 亮度0-100, 透明度0-1)
  colorMode(HSB, 360, 100, 100, 1);
  
  // 2. 初始化星際色票陣列 (使用講義提到的陣列管理)
  // 挑選深空藍、星雲紫、極光綠、超新星橘
  nebulaColors = [
    color(220, 80, 100), // 藍
    color(280, 70, 100), // 紫
    color(160, 80, 100), // 綠
    color(20, 90, 100)   // 橘
  ];
  
  // 3. 預先產生背景靜態星星
  for (let i = 0; i < 300; i++) {
    stars.push({
      x: random(width),
      y: random(height),
      size: random(0.5, 3),
      opacity: random(0.1, 0.8)
    });
  }
  
  background(240, 50, 10); // 深色宇宙背景

  // 4. 初始化音訊物件
  mic = new p5.AudioIn();
  fft = new p5.FFT();
  fft.setInput(mic);

  // 5. 初始化星球隕石
  for (let i = 0; i < 12; i++) {
    planets.push(new Planet());
  }
}

function draw() {
  // 4. 留下痕跡：利用帶有透明度的背景刷新，產生殘影流動感
  // 講義技巧：background 的第四個參數控制消失速度
  background(240, 50, 5, 0.08); 

  // 取得音訊分析數據
  let vol = mic.getLevel(); // 振幅 (0~1)
  fft.analyze();
  let bass = fft.getEnergy("bass"); // 低音能量 (0~255)
  
  // 繪製背景靜態星星
  noStroke();
  for (let s of stars) {
    // 星星會隨音量閃爍，增加空間律動感
    let twinkle = isDancing ? vol * 2 : 0;
    fill(0, 0, 100, constrain(s.opacity + twinkle, 0, 1));
    ellipse(s.x, s.y, s.size);
  }

  // 繪製並更新星球隕石
  // 使用倒序迴圈，這樣在刪除或新增陣列元素時才不會出錯
  for (let i = planets.length - 1; i >= 0; i--) {
    let p = planets[i];
    p.update(vol, bass, planets); // 傳入 planets 陣列進行碰撞偵測
    p.display(bass); // 簡化 display 參數

    // 如果星球被標記為死亡（碰撞發生），則進行分裂
    if (p.isDead) {
      if (p.needsSplit && p.level < 2) { // 只有因碰撞死亡且等級足夠才分裂
        // 產生兩個較小的碎片
        planets.push(new Planet(p.x, p.y, p.baseSize * 0.6, p.level + 1));
        planets.push(new Planet(p.x, p.y, p.baseSize * 0.6, p.level + 1));
      }
      planets.splice(i, 1); // 移除原本的星球
    }
  }

  // 自動生成新隕石：每隔一段時間且數量不足時產生
  if (frameCount % 60 === 0 && planets.length < 30) {
    planets.push(new Planet());
  }

  // 5. 圖層疊合模式：使用 SCREEN 讓交疊處產生強光發光效果
  // 適合用在星雲、光劍、或是發光的星體
  blendMode(SCREEN);

  // 6. 互動星雲生成
  if (mouseIsPressed || (mouseX !== 0 && mouseY !== 0)) {
    for (let i = 0; i < 3; i++) {
      drawNebula(mouseX, mouseY);
    }
  }
  
  // 回歸一般疊合模式，以免影響其他繪製
  blendMode(BLEND);
  
  // 7. 繪製互動中心點 (星核)
  // 利用 frameCount 讓色相隨時間週期性變化
  let coreHue = (frameCount * 2) % 360;
  fill(coreHue, 50, 100);
  // 加上一點點發光陰影 (瀏覽器渲染功能)
  drawingContext.shadowBlur = 15;
  drawingContext.shadowColor = color(coreHue, 50, 100);
  ellipse(mouseX, mouseY, 15, 15);
  drawingContext.shadowBlur = 0;
}

// 自定義函式：繪製星雲粒子
function drawNebula(x, y) {
  let offsetX = random(-60, 60);
  let offsetY = random(-60, 60);
  
  // 講義重點：lerpColor 漸層
  // 根據滑鼠在螢幕的位置，混合兩組不同的宇宙色彩
  let lerpAmt = map(mouseX, 0, width, 0, 1);
  let c1 = nebulaColors[0]; // 藍
  let c2 = nebulaColors[1]; // 紫
  let mixedColor = lerpColor(c1, c2, lerpAmt);
  
  // 根據滑鼠垂直位置控制亮度 (講義：HSB 應用)
  let b = map(mouseY, 0, height, 100, 40);
  
  noStroke();
  fill(hue(mixedColor), saturation(mixedColor), b, 0.15);
  
  // 繪製擴散的圓點
  ellipse(x + offsetX, y + offsetY, random(20, 100));
}

// 視窗大小改變時自動調整
function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}

// 點擊畫面以啟動音訊 (瀏覽器安全性限制)
function mousePressed() {
  if (!audioStarted) {
    userStartAudio();
    mic.start(); // 在使用者點擊後才正式啟動麥克風
    audioStarted = true;
  }
  // 切換模式：按一下開始，再按一下取消
  isDancing = !isDancing;
}

// 星球隕石類別
class Planet {
  constructor(x, y, size, level) {
    this.x = x || random(width);
    this.y = y || random(height);
    this.vx = random(-2, 2);
    this.vy = random(-2, 2);
    this.baseSize = size || random(40, 60);
    this.level = level || 0; // 0 是初始大小，1 是分裂一次，以此類推
    this.hue = random(nebulaColors).levels; // 取得隨機色票
    this.colorH = random(360);
    this.currentSize = this.baseSize; // 儲存當前大小供碰撞計算
    this.isDead = false; // 標記是否在碰撞後消失
    this.life = 1.0; // 生命值 1.0 -> 0 (控制透明度)
    this.needsSplit = false; // 是否需要分裂
  }

  update(vol, bass, others) {
    if (isDancing) {
      // 跳動模式：大小隨音量大幅跳動
      let targetSize = this.baseSize + vol * 1000;
      // 使用 lerp 讓大小縮放更平滑且有彈性
      this.currentSize = lerp(this.currentSize, targetSize, 0.2);
      
      // 變快：低音會大幅帶動星球移動
      let speedMult = map(bass, 0, 255, 2, 8);
      this.x += this.vx * speedMult;
      this.y += this.vy * speedMult;
    } else {
      // 尚未點擊時，維持基本大小與緩慢漂浮
      this.currentSize = this.baseSize;
      this.x += this.vx;
      this.y += this.vy;
    }

    // 生命值自然流逝：在跳動模式下消失得稍快一點
    this.life -= isDancing ? 0.005 : 0.002;
    if (this.life <= 0) {
      this.isDead = true;
      this.needsSplit = false; // 自然老死的隕石不分裂
    }

    // 碰到邊緣反彈
    if (this.x < 0 || this.x > width) this.vx *= -1;
    if (this.y < 0 || this.y > height) this.vy *= -1;

    // 偵測與其他星球的碰撞
    for (let other of others) {
      if (other !== this && !other.isDead) {
        let d = dist(this.x, this.y, other.x, other.y);
        let minDist = (this.currentSize + other.currentSize) / 2;

        if (d < minDist) {
          // 發生碰撞！
          // 1. 計算碰撞角度
          let angle = atan2(other.y - this.y, other.x - this.x);
          
          if (this.level < 2) {
            // 如果還沒到最小等級，標記為死亡以便在 draw 迴圈中分裂
            this.isDead = true;
            this.needsSplit = true;
          } else {
            // 已經是最小碎片了，維持物理反彈
            let overlap = minDist - d;
            this.x -= cos(angle) * overlap * 0.5;
            this.y -= sin(angle) * overlap * 0.5;
            this.vx *= -1;
            this.vy *= -1;
          }
        }
      }
    }
  }

  display(bass) {
    push();
    // 色相處理：如果是跳動模式，色相會隨移動與低音快速變幻
    let h = this.colorH;
    if (isDancing) {
      h = (this.colorH + map(bass, 0, 255, 0, 150) + frameCount * 2) % 360;
    }
    
    noStroke();
    // 發光效果
    if (isDancing) {
      // 跳動模式下的額外能量環
      fill(h, 70, 90, this.life * 0.2);
      ellipse(this.x, this.y, this.currentSize * 1.3);
    }

    drawingContext.shadowBlur = map(bass, 0, 255, 10, 40) * this.life;
    drawingContext.shadowColor = color(h, 80, 100, this.life * 0.5);
    
    fill(h, 70, 90, this.life * 0.8);
    ellipse(this.x, this.y, this.currentSize);
    
    // 畫出隕石的小坑洞感
    fill(h, 80, 40, 0.4);
    ellipse(this.x - this.currentSize*0.2, this.y - this.currentSize*0.1, this.currentSize*0.3);
    pop();
  }
}