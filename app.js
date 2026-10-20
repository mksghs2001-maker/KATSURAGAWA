import {lands,newGame,owned,officersAt,canAttack,act,nextSeason,validSave} from './game.js';
let state=newGame();const $=id=>document.getElementById(id),NS='http://www.w3.org/2000/svg';
const notice=t=>$('notice').textContent=t;
function render(){
 $('date').textContent=`${state.year}年　${['春','夏','秋','冬'][state.season]}`;
 $('power').textContent=`都市 ${owned(state).length} / ${lands.length}　命令 ${state.ap} / 3`;
 $('map').replaceChildren();
 for(let i=0;i<lands.length;i++)for(const j of lands[i][4])if(j>i){const l=document.createElementNS(NS,'line');for(const [k,v] of Object.entries({x1:lands[i][2],y1:lands[i][3],x2:lands[j][2],y2:lands[j][3],class:'road'}))l.setAttribute(k,v);$('map').append(l);}
 state.provinces.forEach((p,i)=>{
 const g=document.createElementNS(NS,'g');g.setAttribute('class',`city ${p.owner==='劉備'?'player':''} ${state.selected===i?'selected':''}`);g.setAttribute('tabindex','0');g.setAttribute('role','button');g.setAttribute('aria-label',`${p.name} ${p.owner} 兵${p.troops}`);g.setAttribute('aria-pressed',String(state.selected===i));
 const rect=document.createElementNS(NS,'rect');for(const [k,v]of Object.entries({x:lands[i][2]-36,y:lands[i][3]-22,width:72,height:54,rx:3}))rect.setAttribute(k,v);g.append(rect);
 for(const [label,dy,cl]of [[p.name,0,'city-name'],[p.owner,20,'city-owner']]){const t=document.createElementNS(NS,'text');t.setAttribute('x',lands[i][2]);t.setAttribute('y',lands[i][3]+dy);t.setAttribute('class',cl);t.textContent=label;g.append(t);}
 const select=()=>{state.selected=i;render();};g.onclick=select;g.onkeydown=e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();select();}};$('map').append(g);
 });
 const p=state.provinces[state.selected];$('province').textContent=p.name;$('clan').textContent=p.owner+' 勢力';$('ownership').textContent=p.owner==='劉備'?'自勢力':'他勢力';
 $('stats').replaceChildren();for(const [label,key]of [['金','gold'],['兵糧','rice'],['兵力','troops'],['農業','farm'],['士気','morale']]){const div=document.createElement('div');const dt=document.createElement('dt'),dd=document.createElement('dd');dt.textContent=label;dd.textContent=p[key];div.append(dt,dd);$('stats').append(div);}
 $('officers').replaceChildren();for(const o of officersAt(state,state.selected)){const row=document.createElement('p');row.textContent=`${o.name}　武 ${o.war}　知 ${o.int}　政 ${o.pol}`;$('officers').append(row);}if(!$('officers').childElementCount)$('officers').textContent='在城武将なし';
 $('ap').textContent=`残 ${state.ap} 回`;$('tax').textContent=`現在 ${state.tax}％`;
 document.querySelectorAll('[data-action]').forEach(b=>b.disabled=p.owner!=='劉備'||!state.ap||!!state.ended);$('attack').disabled=!state.ap||!!state.ended;$('next').disabled=!!state.ended;
 $('log').replaceChildren();for(const t of state.log.slice(0,20)){const li=document.createElement('li');li.textContent=t;$('log').append(li);}
 if(state.ended)notice(state.ended==='victory'?'天下統一！ 新たな太平の世が始まります。':'勢力が滅亡しました。「初めから」で再挑戦できます。');
}
function modal(title,text){$('dialog-content').replaceChildren();const h=document.createElement('h2'),p=document.createElement('p');h.textContent=title;p.textContent=text;$('dialog-content').append(h,p);if(!$('dialog').open)$('dialog').showModal();}
function execute(action,target){const error=act(state,action,target);notice(error||state.log[0]);render();}
function targets(action,title,info,indices){modal(title,info);if(!indices.length){const p=document.createElement('p');p.textContent='対象となる都市がありません。';$('dialog-content').append(p);}for(const i of indices){const b=document.createElement('button');b.className='target';b.textContent=`${state.provinces[i].name} ／ ${state.provinces[i].owner} ／ 兵${state.provinces[i].troops}`;b.onclick=()=>{$('dialog').close();execute(action,i);};$('dialog-content').append(b);}}
for(const b of document.querySelectorAll('[data-action]'))b.onclick=()=>{if(b.dataset.action==='move')targets('move','武将の赴任','選択都市の一覧で最後に表示される武将を移動します。命令1回。',lands.map((_,i)=>i).filter(i=>i!==state.selected&&state.provinces[i].owner==='劉備'));else execute(b.dataset.action);};
$('attack').onclick=()=>targets('attack','出陣の評議','最も兵の多い隣接自都市から、武力が最大の武将が出陣します。兵40・兵糧50が必要。勝敗は兵力・武力・士気・乱数で決定。勝利時は指揮官が占領地へ赴任します。',lands.map((_,i)=>i).filter(i=>canAttack(state,i)));
$('next').onclick=()=>{nextSeason(state);notice('税収・兵糧消費・敵勢力の行動が発生しました。');render();};
$('save').onclick=()=>{try{localStorage.setItem('kanmei-save-v2',JSON.stringify(state));notice('このブラウザに記録しました。');}catch{notice('保存できません。ブラウザの保存設定をご確認ください。');}};
$('load').onclick=()=>{try{const saved=JSON.parse(localStorage.getItem('kanmei-save-v2'));if(!validSave(saved))throw Error();state=saved;render();notice('記録を読み込みました。');}catch{notice('有効な三国志の記録がありません。');}};
$('reset').onclick=()=>{modal('新たな歴史','現在の進行を破棄し、194年の徐州から再開します。保存記録は残ります。');const b=document.createElement('button');b.textContent='初めから始める';b.onclick=()=>{state=newGame();$('dialog').close();notice('徐州から、天下への第一歩。');render();};$('dialog-content').append(b);};
$('help').onclick=()=>modal('乱世を治めるには','あなたは194年の劉備。十二都市の統一が目標です。地図で都市を選択し、毎季3回の命令を実行します。農業開発は政治能力が高い在城武将ほど効果が増えます。登用は金40で在野武将を1人迎えます。出陣では武力と士気が重要。敵都市を占領すると指揮官も移動します。赴任で武将を再配置しましょう。毎季税収が入り、秋には農業に応じて収穫。兵糧不足では兵が減り、敵は手薄な都市に侵攻します。保存は同じブラウザ・同じ接続先でのみ利用できます。地図・能力・歴史展開は独自の簡略モデルです。外交と戦術マップは今後の拡張対象です。');
$('close').onclick=()=>$('dialog').close();render();
