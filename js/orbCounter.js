// =====================
// ヒューリスティック（A* 用）
// =====================
function heuristic(state, goal) {
  let maxNeed = 0;
  for (let i = 0; i < state.length; i++) {
    const diff = goal[i] - state[i];
    if (diff > 0) {
      maxNeed = Math.max(maxNeed, Math.ceil(diff / 2));
    }
  }
  return maxNeed;
}

// =====================
// 自動切り替え
// =====================
function solveOrbAuto(start, goal) {
  const maxGoal = Math.max(...goal);

  // 小さいときだけ A*
  if (maxGoal <= 30) {
    return solveOrb(start, goal);
  }

  // 大きいときは近似（貪欲＋後処理）
  return solveOrbGreedyOptimized(start, goal);
}

// =====================
// A* 探索（厳密解）
// =====================
function solveOrb(start, goal) {
  const clamp = s => s.map((v,i)=>Math.min(v, goal[i]));
  const startState = clamp(start);

  const open = [{
    state: startState,
    real: [...start],
    counts: Object.fromEntries(
      Object.keys(ORB_QUESTS).map(k => [k, 0])
    ),
    g: 0,
    f: heuristic(startState, goal)
  }];

  const visited = new Map();
  visited.set(startState.join(","), 0);

  while (open.length) {
    open.sort((a,b)=>a.f - b.f);
    const current = open.shift();
    const { state, real, counts, g } = current;

    if (state.every((v,i)=>v >= goal[i])) {
      return {
        counts,
        final: real,
        method: "optimal"
      };
    }

    for (const [name, add] of Object.entries(ORB_QUESTS)) {
      const nextReal = real.map((v,i)=>v + add[i]);
      const nextState = clamp(nextReal);
      const key = nextState.join(",");
      const nextG = g + 1;

      if (visited.has(key) && visited.get(key) <= nextG) continue;
      visited.set(key, nextG);

      const nextCounts = { ...counts };
      nextCounts[name]++;

      open.push({
        state: nextState,
        real: nextReal,
        counts: nextCounts,
        g: nextG,
        f: nextG + heuristic(nextState, goal)
      });
    }
  }
  return null;
}

// =====================
// 貪欲法（近似解）
// =====================
function solveOrbGreedy(start, goal) {
  const counts = Object.fromEntries(
    Object.keys(ORB_QUESTS).map(k => [k, 0])
  );

  let real = [...start];

  const need = () => goal.map((g,i)=>Math.max(0, g - real[i]));
  const needSum = () => need().reduce((a,b)=>a+b,0);

  // =====================
  // フェーズ1：効率貪欲
  // =====================
  while (true) {
    let bestQuest = null;
    let bestScore = 0;

    const n = need();

    for (const [name, add] of Object.entries(ORB_QUESTS)) {
      let score = 0;
      for (let i = 0; i < 7; i++) {
        score += Math.min(n[i], add[i]);
      }
      if (score > bestScore) {
        bestScore = score;
        bestQuest = name;
      }
    }

    if (bestScore <= 0) break;

    const add = ORB_QUESTS[bestQuest];
    for (let i = 0; i < 7; i++) real[i] += add[i];
    counts[bestQuest]++;
  }

  // =====================
  // フェーズ2：強制充填（重要）
  // =====================
  while (needSum() > 0) {
    const n = need();

    // 一番不足している軸
    let idx = 0;
    for (let i = 1; i < 7; i++) {
      if (n[i] > n[idx]) idx = i;
    }

    // その軸を含むクエストを選ぶ
    let chosen = null;
    for (const [name, add] of Object.entries(ORB_QUESTS)) {
      if (add[idx] > 0) {
        chosen = name;
        break;
      }
    }

    const add = ORB_QUESTS[chosen];
    for (let i = 0; i < 7; i++) real[i] += add[i];
    counts[chosen]++;
  }

  const total = Object.values(counts).reduce((a,b)=>a+b,0);
  const ORB_PER_QUEST = 4;
  const lowerBound = Math.ceil(goal.reduce((a,b)=>a+b,0) / ORB_PER_QUEST);

  return {
    counts,
    final: real,
    method: "greedy",
    total,
    lowerBound,
    approxGap: total - lowerBound
  };
}


// =====================
// 後処理用ユーティリティ
// =====================
function dot(a, b) {
  let s = 0;
  for (let i = 0; i < a.length; i++) s += a[i] * b[i];
  return s;
}

// =====================
// 余剰削減・不足補正（探索なし）
// =====================
function postOptimize(result, goal, maxIter = 30) {
  let { counts, final } = result;

  for (let iter = 0; iter < maxIter; iter++) {
    const surplus = final.map((v,i)=>Math.max(0, v - goal[i]));
    const lack    = final.map((v,i)=>Math.max(0, goal[i] - v));

    let best = { gain: 0 };

    for (const [rName, rAdd] of Object.entries(ORB_QUESTS)) {
      if (counts[rName] <= 0) continue;
      const removeScore = dot(rAdd, surplus);
      if (removeScore === 0) continue;

      for (const [a1Name, a1Add] of Object.entries(ORB_QUESTS)) {
        for (const [a2Name, a2Add] of Object.entries(ORB_QUESTS)) {
          const addScore =
            dot(a1Add, lack) + dot(a2Add, lack);

          const gain = addScore - removeScore;
          if (gain > best.gain) {
            best = { gain, rName, a1Name, a2Name };
          }
        }
      }
    }

    if (best.gain <= 0) break;

    const r = ORB_QUESTS[best.rName];
    const a1 = ORB_QUESTS[best.a1Name];
    const a2 = ORB_QUESTS[best.a2Name];

    for (let i = 0; i < 7; i++) {
      final[i] += a1[i] + a2[i] - r[i];
    }

    counts[best.rName]--;
    counts[best.a1Name]++;
    counts[best.a2Name]++;
  }

  result.total =
    Object.values(result.counts).reduce((a,b)=>a+b,0);
  result.approxGap = result.total - result.lowerBound;

  return result;
}


// =====================
// 貪欲＋後処理 統合
// =====================
function solveOrbGreedyOptimized(start, goal) {
  let result = solveOrbGreedy(start, goal);

  // ★ まず不要クエストを削る（超重要）
  result = removeRedundant(result, goal);

  // 余力があれば微調整
  result = postOptimize(result, goal);

  result.total =
    Object.values(result.counts).reduce((a,b)=>a+b,0);
  result.approxGap = result.total - result.lowerBound;

  return result;
}


// =====================
// UI 計算処理
// =====================
function calculateOrb() {
  showLoading(true);

  setTimeout(() => {
    const start = ORB_NAMES.map((_,i)=>
      Number(document.getElementById(`c${i}`).value)
    );
    const goal = ORB_NAMES.map((_,i)=>
      Number(document.getElementById(`g${i}`).value)
    );

    const result = solveOrbAuto(start, goal);
    const area = document.getElementById("orb-result");

    if (!result) {
      area.innerHTML = "<p>到達不可能です</p>";
      showLoading(false);
      return;
    }

    let total = 0;
    for (const k of ORB_QUEST_UI_ORDER) {
        total += result.counts[k];
    }
    let sta = 45 * total;
    let html = `
        <h2 class="result-title">
        必要クエスト回数
        <span class="result-sub">（合計 ${total}回 / スタミナ ${sta}）</span>
        </h2>
        <ul>
    `;
    for (const k of ORB_QUEST_UI_ORDER) {
        const v = result.counts[k];
        if (v > 0) {
            html += `<li>覚醒の宝珠【${k}】：${v}回</li>`;
            total += v;
        }
    }
    html += `</ul>`;

    if (result.method === "greedy") {
      html += `
        <p class="orb-note">
          ※ 近似解です。
          理論下限 ${result.lowerBound} 回に対して
          <b>＋${result.approxGap} 回</b>
        </p>
      `;
    }

    html += "<h2>最終所持オーブ</h2><table><tr>";
    ORB_NAMES.forEach(n => html += `<th>${n}</th>`);
    html += "</tr><tr>";

    result.final.forEach((v,i)=>{
      const diff = v - goal[i];
      let cls = "", label = "";
      if (diff > 0) { cls = "orb-plus"; label = `(+${diff})`; }
      else if (diff < 0) { cls = "orb-minus"; label = `(${diff})`; }
      html += `<td class="${cls}">${v} ${label}</td>`;
    });

    html += "</tr></table>";
    area.innerHTML = html;

    showLoading(false);
    area.scrollIntoView({ behavior: "smooth" });
  }, 0);
}

// =====================
// 初期化・UI
// =====================
function setDefaultValues() {
  ORB_NAMES.forEach((_, i) => {
    document.getElementById(`c${i}`).value = ORB_DEFAULT_START[i];
    document.getElementById(`g${i}`).value = ORB_DEFAULT_GOAL[i];
  });
}

window.addEventListener("DOMContentLoaded", () => {
  setDefaultValues();
});

function showLoading(show) {
  document.getElementById("loading").style.display =
    show ? "flex" : "none";
}

function removeRedundant(result, goal) {
  let changed = true;

  while (changed) {
    changed = false;

    for (const [name, add] of Object.entries(ORB_QUESTS)) {
      if (result.counts[name] <= 0) continue;

      // 1回削除してもゴールを満たすか？
      let ok = true;
      for (let i = 0; i < 7; i++) {
        if (result.final[i] - add[i] < goal[i]) {
          ok = false;
          break;
        }
      }

      if (ok) {
        // 削除確定
        result.counts[name]--;
        for (let i = 0; i < 7; i++) {
          result.final[i] -= add[i];
        }
        changed = true;
      }
    }
  }

  return result;
}
