// オーブ順序は UI・ロジック共通
const ORB_NAMES = ["戦", "聖", "射", "騎", "軽", "魔", "重"];
const ORB_QUESTS = {
  "戦": [2,1,1,0,0,0,0],
  "聖": [0,2,0,1,0,0,1],
  "射": [0,1,2,0,0,0,1],
  "騎": [0,0,0,2,1,1,0],
  "軽": [1,0,0,0,2,1,0],
  "魔": [1,0,1,0,0,2,0],
  "重": [0,0,0,1,1,0,2],
};
const ORB_QUEST_UI_ORDER = ["軽","聖","魔","重","戦","騎","射"];


const ORB_DEFAULT_START = Array(ORB_NAMES.length).fill(0);
const ORB_DEFAULT_GOAL  = Array(ORB_NAMES.length).fill(100);