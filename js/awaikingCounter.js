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
    console.log(cat);
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
const buttonsContainer=document.getElementById("quick-buttons");

function renderQuickButtons(filter=""){
  buttonsContainer.innerHTML="";
  for(const cat in quickData){
    const h=document.createElement("h3");
    h.textContent=cat;
    buttonsContainer.appendChild(h);
    quickData[cat].forEach(btn=>{
      if(btn.name.includes(filter)){
        const b=document.createElement("button");
        b.className="quick-btn";
        b.textContent=btn.name;
        b.onclick=()=>quickAdd(btn.add);
        buttonsContainer.appendChild(b);
      }
    });
  }
}

input.addEventListener("input", e=>renderQuickButtons(e.target.value));

// サイドバーから中央カウンター更新
function quickAdd(updates){
  for(const key in updates){
    if(counts.hasOwnProperty(key)){
      counts[key]=Math.max(0, counts[key]+updates[key]);
      updateButtons(key);
    }
  }
}

const tabbutton = document.querySelector('.quick-tab');
const lists = document.querySelector('.quick-access');

let moved = false;

tabbutton.addEventListener('click', () => {
  lists.classList.toggle('fixed');
  tabbutton.classList.toggle('active'); 
});

// 初回描画
renderQuickButtons();