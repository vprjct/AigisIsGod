// 中央カウンター初期化
const counts = {};
for(const cat in listData){
  listData[cat].forEach(name=> counts[name]=0);
}

// 中央一覧描画
for(const cat in listData){
  const container=document.getElementById(cat);
  listData[cat].forEach(name=>{
    const div=document.createElement("div");
    div.className="item";
    div.style.backgroundImage = `url('../icon/awaikingCounter/${name}.png')`;
    const lbl=document.createElement("div");
    lbl.className="label";
    if(name==="ヴァンパイアハンター") lbl.classList.add("vampire-hunter");
    lbl.id=name;
    lbl.textContent=name;
    const controls=document.createElement("div");
    controls.className="controls";
    const btnUp=document.createElement("button");
    btnUp.textContent="+";
    btnUp.onclick=()=>{ counts[name]++; updateButtons(name); }
    const btnDown=document.createElement("button");
    btnDown.textContent="-";
    btnDown.onclick=()=>{ if(counts[name]>0) counts[name]--; updateButtons(name); }
    const cnt=document.createElement("div");
    cnt.className="count";
    cnt.textContent=0;
    controls.appendChild(btnUp);
    controls.appendChild(cnt);
    controls.appendChild(btnDown);
    div.appendChild(lbl);
    div.appendChild(controls);
    container.appendChild(div);
  });
}

// 更新ボタン状態
function updateButtons(name){
  const div=document.getElementById(name).parentNode.querySelector(".controls");
  const count=counts[name];
  div.querySelectorAll("button")[1].disabled=count===0;
  div.querySelector(".count").textContent=count;
}

// リセット
function resetAll(){
  for(const name in counts) counts[name]=0;
  for(const name in counts) updateButtons(name);
}

// サイドバー生成＋フィルタ
const quickContainer=document.querySelector(".quick-access");
const input=document.getElementById("quick-filter");
const sortTypes=document.getElementById("sort-types");
const headLinks=document.getElementById("head-links");
const buttonsContainer=document.getElementById("quick-buttons");

let classList = ["近接", "遠距離", "遠近距離"];

// 五十音の行を定義
const gojuon = {
  "あ": ["あ","い","う","え","お"],
  "か": ["か","き","く","け","こ"],
  "さ": ["さ","し","す","せ","そ"],
  "た": ["た","ち","つ","て","と"],
  "な": ["な","に","ぬ","ね","の"],
  "は": ["は","ひ","ふ","へ","ほ"],
  "ま": ["ま","み","む","め","も"],
  "や": ["や","ゆ","よ"],
  "ら": ["ら","り","る","れ","ろ"],
  "わ": ["わ","を","ん"]
};
// 濁点・半濁点を除去する関数
function removeDakuten(char) {
  return char.normalize("NFD").replace(/[\u3099\u309A]/g, ""); // 濁点・半濁点を削除
}

// 五十音行ごとにマッピング
const kanaMap = {};
for (const row in gojuon) {
  kanaMap[row] = [];
}

// ソートしてから五十音マップに入れる
let allButtons = [];
for (const cat in quickData) {
    allButtons = allButtons.concat(quickData[cat]);
}
allButtons.sort((a, b) => a.kana.localeCompare(b.kana, "ja"));
for (const btn of allButtons) {
  const firstChar = removeDakuten(btn.kana[0]);
  
  for (const row in gojuon) {
    if (gojuon[row].includes(firstChar)) {
      kanaMap[row].push(btn);
      break;
    }
  }
}

let currentFilter = ""; // 現在のフィルタ値を保持
let sortType = true;    // true: クラス別, false: 五十音

document.addEventListener("DOMContentLoaded", () => {
    const tabs = document.querySelectorAll("#sortTabs a");
    const filterInput = document.querySelector("#quick-filter"); // もし検索入力があるなら

    // デフォルトで active は無し
    tabs.forEach(t => t.classList.remove("active"));

    // ページ読み込み直後に「クラス別」を active に
    const defaultTab = Array.from(tabs).find(t => t.textContent === "クラス別");
    if (defaultTab) defaultTab.classList.add("active");

    // フィルタ入力
    if(filterInput){
        filterInput.addEventListener("input", e => {
            currentFilter = e.target.value;
            renderQuickButtons(currentFilter);
        });
    }

    // タブクリック処理
    tabs.forEach(tab => {
        tab.addEventListener("click", e => {
            e.preventDefault();

            // active 切り替え
            tabs.forEach(t => t.classList.remove("active"));
            tab.classList.add("active");

            // sortType 更新
            const selectedType = tab.textContent;
            sortType = (selectedType === "クラス別");

            // ヘッダリンク・ボタン描画
            createHeaderLinks();
            console.log(currentFilter);
            renderQuickButtons(currentFilter);

            // タブ切り替え時はヘッダリンクトップにスクロール
            headLinks.scrollTop = 0;
        });
    });

    // 初期描画
    createHeaderLinks();
    renderQuickButtons(currentFilter);
});

// ヘッダリンク生成
function createHeaderLinks() {
    headLinks.textContent = "";
    const headLinkList = sortType ? ["近接", "遠距離", "遠近距離"] : Object.keys(kanaMap);
    headLinkList.forEach((cat, index) => {
        const a = document.createElement("a");
        a.href = `#cat-${cat}`;
        a.textContent = cat;
        headLinks.appendChild(a);
        if (index < headLinkList.length - 1) {
            headLinks.appendChild(document.createTextNode(" / "));
        }
    });
}

// ボタン描画
function renderQuickButtons(filter="") {
    buttonsContainer.innerHTML = "";

    const headLinkList = sortType ? classList : Object.keys(kanaMap);
    headLinkList.forEach(cat => {
        const h = document.createElement("h3");
        h.id = `cat-${cat}`;
        h.textContent = cat;
        buttonsContainer.appendChild(h);

        const btnList = sortType ? quickData[cat] : kanaMap[cat];
        btnList.forEach(btn => {
            if (!filter || btn.name.includes(filter)) {
                const b = document.createElement("button");
                b.className = "quick-btn";
                b.textContent = btn.name;
                b.style.backgroundImage = `url('../icon/${btn.name}.png')`;
                b.onclick = () => quickAdd(btn.add);
                buttonsContainer.appendChild(b);
            }
        });
    });

    if (!filter) {
        buttonsContainer.scrollTop = 0;
    }
}

const tabbutton = document.querySelector('.quick-tab');
const quickaccess = document.querySelector('.quick-access');

let moved = false;

tabbutton.addEventListener('click', () => {
  quickaccess.classList.toggle('fixed');
  tabbutton.classList.toggle('active'); 
});



// サイドバーから中央カウンター更新
function quickAdd(updates){
  for(const key in updates){
    if(counts.hasOwnProperty(key)){
      counts[key]=Math.max(0, counts[key]+updates[key]);
      updateButtons(key);
    }
  }
}

// 初回📌固定
const lists = document.querySelector('.quick-access');
lists.classList.toggle('fixed');