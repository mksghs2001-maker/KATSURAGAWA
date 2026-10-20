import {PLAYER,lands,sectors,skillNames,newGame,owned,officersAt,readyOfficers,stamp,allied,canAttack,marketRate,configureProject,act,nextMonth,startBattle,chooseDefense,HEX_W,HEX_H,terrain,reachable,battleAction,endBattleDay,validSave} from './game.js';
let state=newGame(),tab='domestic',executor=null;
const $=id=>document.getElementById(id),NS='http://www.w3.org/2000/svg',SAVE='kanmei-save-v3';
const el=(tag,text,cls)=>{const n=document.createElement(tag);if(text!==undefined)n.textContent=text;if(cls)n.className=cls;return n;};
function button(text,fn,disabled=false){const b=el('button',text);b.type='button';b.onclick=fn;b.disabled=disabled;return b;}
const notice=t=>$('notice').textContent=t;
function svg(tag,attrs={},text){const n=document.createElementNS(NS,tag);for(const [k,v]of Object.entries(attrs))n.setAttribute(k,v);if(text!==undefined)n.textContent=text;return n;}
const ownCity=()=>state.provinces[state.selected].owner===PLAYER;
function select(label,choices,value){const wrap=el('label',label,'field'),input=el('select');input.setAttribute('aria-label',label);for(const [v,t]of choices){const o=el('option',t);o.value=String(v);input.append(o);}if(value!==undefined)input.value=String(value);wrap.append(input);return [wrap,input];}
function number(label,value,min,max){const wrap=el('label',label,'field'),input=el('input');input.type='number';input.setAttribute('aria-label',label);input.value=value;input.min=min;input.max=max;input.step=1;wrap.append(input);return [wrap,input];}
function group(title,description){const n=el('section',undefined,'command-group');n.append(el('h3',title),el('p',description,'hint'));$('command-content').append(n);return n;}
function form(parent,fields,text,submit,disabled=!ownCity()||!!state.battle||!!state.ended){const f=el('form',undefined,'command-form');f.append(...fields,button(text,()=>{}));f.lastChild.type='submit';f.lastChild.disabled=disabled;f.onsubmit=e=>{e.preventDefault();submit();};parent.append(f);}
function run(type,args={}){const error=act(state,type,{officer:executor,...args});notice(error||state.log[0]);render();}
function modal(title,paragraphs){$('dialog-content').replaceChildren(el('h2',title),...paragraphs.map(t=>el('p',t)));if(!$('dialog').open)$('dialog').showModal();}
function enemyChoices(){return state.provinces.flatMap((p,i)=>p.owner!==PLAYER?[[i,`${p.name}（${p.owner}）${allied(state,p.owner)?'・同盟中':''}`]]:[]);}
function alliedChoices(){return lands[state.selected][4].filter(i=>state.provinces[i].owner===PLAYER).map(i=>[i,state.provinces[i].name]);}
function candidates(){return state.officers.filter(o=>o.faction===null||o.prisoner&&o.city===state.selected).map(o=>[o.id,`${o.name}（${o.prisoner?'捕虜':'在野'}）統${o.lead} 武${o.war} 知${o.int} 政${o.pol}`]);}
function map(){
 $('map').replaceChildren();for(let i=0;i<lands.length;i++)for(const j of lands[i][4])if(j>i)$('map').append(svg('line',{x1:lands[i][2],y1:lands[i][3],x2:lands[j][2],y2:lands[j][3],class:'road'}));
 state.provinces.forEach((p,i)=>{const x=lands[i][2],y=lands[i][3],g=svg('g',{class:`city ${p.owner===PLAYER?'player':''} ${state.selected===i?'selected':''}`,tabindex:0,role:'button','aria-label':`${p.name} ${p.owner}`,'aria-pressed':state.selected===i});
 g.append(svg('rect',{x:x-35,y:y-28,width:70,height:82,class:'city-hit'}),svg('rect',{x:x-13,y:y-13,width:26,height:25,rx:1}),svg('path',{d:`M${x-18},${y-10} l18,-14 l18,14 Z`,class:'castle-roof'}),svg('path',{d:`M${x-4},${y+12} v-10 h8 v10`,class:'castle-gate'}),svg('text',{x,y:y+34,class:'city-name'},p.name),svg('text',{x,y:y+49,class:'city-owner'},p.owner));
 const choose=()=>{state.selected=i;executor=null;render();};g.onclick=choose;g.onkeydown=e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();choose();}};$('map').append(g);
 });
}
function render(){
 $('date').textContent=`${state.year}年 ${state.month}月`;$('power').textContent=`都市 ${owned(state).length} / 6　未行動 ${state.officers.filter(o=>o.faction===PLAYER&&!o.prisoner&&!o.acted).length}人`;
 map();const p=state.provinces[state.selected],visible=ownCity()||(state.intel[state.selected]||0)>stamp(state);
 $('province').textContent=p.name;$('clan').textContent=p.owner+' 勢力';$('ownership').textContent=ownCity()?'自勢力':allied(state,p.owner)?`同盟 あと${state.alliances[p.owner]-stamp(state)}か月`:visible?'偵察済み':'他勢力・詳細不明';
 $('stats').replaceChildren();for(const [label,key]of [['金','gold'],['兵糧','rice'],['兵力','troops'],['民心','people'],['士気','morale'],['訓練','training'],['農業','farm'],['商業','commerce'],['治水','flood'],['技術','tech']]){const n=el('div');n.append(el('dt',label),el('dd',visible?p[key]:'？'));$('stats').append(n);}
 $('officers').replaceChildren();if(visible)for(const o of officersAt(state,state.selected)){const card=el('div',undefined,'officer-card'),face=el('span',undefined,'portrait '+(o.name==='関羽'?'portrait-1':o.name==='張飛'?'portrait-2':'portrait-0'));face.setAttribute('aria-hidden','true');card.append(face,el('strong',o.name),el('small',`統${o.lead} 武${o.war} 知${o.int} 政${o.pol}`),el('small',o.faction===PLAYER?(o.acted?'行動済み':'未行動'):'他勢力'));$('officers').append(card);}
 if(!$('officers').childElementCount)$('officers').textContent=visible?'在城武将なし':'偵察で詳細を確認できます';
 const ready=readyOfficers(state,state.selected);if(!ready.some(o=>o.id===executor))executor=ready[0]?.id??null;
 $('executor').replaceChildren();for(const o of ready){const n=el('option',o.name);n.value=o.id;$('executor').append(n);}if(!ready.length){const n=el('option','未行動の武将なし');n.value='';$('executor').append(n);}$('executor').value=executor===null?'':String(executor);$('executor').disabled=!ready.length||!!state.battle||!!state.ended;
 const chosen=state.officers[executor];$('executor-info').textContent=chosen?`特技：${chosen.skills.map(k=>skillNames[k]).join('・')||'なし'} ／ 忠誠${chosen.loyalty}`:'武将は月1回行動。内政担当は単発命令と兼任できます。';
 $('advisor-line').textContent=state.ended?(state.ended==='victory'?'中原六城統一。乱世に太平が訪れました。':'勢力滅亡。「初めから」で再挑戦できます。'):state.log[0];
 $('log').replaceChildren(...state.log.slice(0,25).map(t=>el('li',t)));$('next').disabled=!!state.ended||!!state.battle;
 $('strategy').hidden=!!state.battle;
 document.querySelector('.command-panel').hidden=!!state.battle;
 renderCommands();renderBattle();
 document.querySelectorAll('[data-tab]').forEach(b=>{b.classList.toggle('tab-active',b.dataset.tab===tab);b.setAttribute('aria-pressed',String(b.dataset.tab===tab));});
}
function renderCommands(){
 const root=$('command-content');root.replaceChildren();const p=state.provinces[state.selected],blocked=!ownCity()||executor===null||!!state.battle||!!state.ended;
 if(tab==='domestic'){
  const g=group('内政担当と月予算','担当の変更は命令を消費しません。各武将は1分野のみ担当。月末に予算を支出し、成果が出ます。資金不足時は農業→商業→治水→技術の順で支出。');
  for(const [key,name]of Object.entries(sectors)){
   const a=p.projects[key],[lw,who]=select(name+' 担当',[['','担当なし'],...officersAt(state,state.selected).map(o=>[o.id,`${o.name} 政治${o.pol}`])],a.officer??''),[bw,budget]=number('月予算（金0〜80）',a.budget,0,80);
   const note=el('small',`現在：${a.officer===null?'なし':state.officers[a.officer].name} ／ 金${a.budget}`,'project-status');
   form(g,[lw,bw,note],'担当を設定',()=>{const error=configureProject(state,state.selected,key,who.value===''?null:Number(who.value),Number(budget.value));notice(error||`${name}の担当・予算を設定しました。`);render();});
  }
  const h=group('民政と米取引',`現在の税率${p.tax}％。重税60％は毎月民心－8。今月の相場：金30 ⇄ 兵糧${30*marketRate(state)}。すべて命令1回。`);
  for(const [name,type]of [['施し（糧40）','give'],['米購入（金30）','buy'],['米売却','sell'],['税率40％／60％切替','tax']])h.append(button(name,()=>run(type),blocked));
 }else if(tab==='personnel'){
  const g=group('武将一覧','統率は部隊戦、武力は一騎討ち、知力は計略、政治は内政・交渉に作用。肖像は三種類の仮画像を共用しています。');
  const table=el('table'),head=el('tr');for(const h of ['武将','所在','統','武','知','政','忠誠','状態・特技'])head.append(el('th',h));const thead=el('thead');thead.append(head);table.append(thead);const body=el('tbody');
  for(const o of state.officers.filter(o=>o.faction===PLAYER||o.prisoner&&o.city===state.selected)){const tr=el('tr');for(const t of [o.name,o.city===null?'在野':state.provinces[o.city].name,o.lead,o.war,o.int,o.pol,o.loyalty,`${o.prisoner?'捕虜':o.acted?'行動済み':'未行動'} ${o.skills.map(k=>skillNames[k]).join('・')}`])tr.append(el('td',t));body.append(tr);}table.append(body);const scroll=el('div',undefined,'table-scroll');scroll.append(table);g.append(scroll);
  const h=group('登用と忠誠','登用には君主または人材特技が必要（金50）。登用した武将は今月行動済み。失敗しても費用と命令を消費します。');
  const [tw,target]=select('登用する武将',candidates());form(h,[tw],'登用する',()=>run('hire',{target:Number(target.value)}),blocked||!candidates().length);
  const [rw,reward]=select('褒美の対象',officersAt(state,state.selected).map(o=>[o.id,`${o.name} 忠誠${o.loyalty}`]));form(h,[rw],'褒美（金30／忠誠＋15）',()=>run('reward',{target:Number(reward.value)}),blocked);
  const [mw,move]=select('赴任先',alliedChoices());form(h,[mw],'実行武将を赴任させる',()=>run('move',{target:Number(move.value)}),blocked||!alliedChoices().length);
  const prisoners=state.officers.filter(o=>o.prisoner&&o.city===state.selected).map(o=>[o.id,o.name]),[pw,prisoner]=select('解放する捕虜',prisoners);form(h,[pw],'解放（民心＋5）',()=>run('release',{target:Number(prisoner.value)}),blocked||!prisoners.length);
 }else if(tab==='military'){
  const g=group('兵の育成','徴兵は金45・兵糧30で兵40。民心が5下がります。調練は金20で訓練と士気を上げます。');g.append(button('徴兵',()=>run('recruit'),blocked),button('調練',()=>run('train'),blocked));
  const h=group('部隊編成と出陣','主将と副将を組み合わせて1部隊を編成。出陣は兵糧60。兵は都市から差し引かれ、残兵のみが帰還・駐屯します。副将も今月の命令を消費。');
  const targets=enemyChoices().filter(([i])=>canAttack(state,i)),[tw,target]=select('攻撃する都市',targets),[lw,leader]=select('主将',readyOfficers(state,state.selected).map(o=>[o.id,`${o.name} 統率${o.lead}`]),executor),[dw,deputy]=select('副将',[['','なし'],...readyOfficers(state,state.selected).map(o=>[o.id,`${o.name} 知力${o.int}`])]),[nw,troops]=number('出陣兵数',Math.min(100,p.troops),30,p.troops),[kw,kind]=select('兵科',[['infantry','歩兵：標準'],['cavalry','騎兵：移動3／装備金40'],['archer','弓兵：射程3／技術40必要']]);
  form(h,[tw,lw,dw,nw,kw],'出陣する',()=>{const error=startBattle(state,{target:Number(target.value),leader:Number(leader.value),deputy:deputy.value===''?null:Number(deputy.value),troops:Number(troops.value),type:kind.value});notice(error||'戦場へ出陣しました。');render();if(!error)$('battle-panel').scrollIntoView({behavior:'smooth',block:'start'});},blocked||!targets.length);
  const k=group('街道輸送','隣接する自都市へ資源と兵を輸送。実行武将は出発都市に残り、命令1回を消費します。');const [sw,supply]=select('輸送先',alliedChoices()),[gw,gold]=number('金',0,0,p.gold),[fw,rice]=number('兵糧',0,0,p.rice),[uw,men]=number('兵',0,0,p.troops);form(k,[sw,gw,fw,uw],'輸送する',()=>run('transport',{target:Number(supply.value),gold:Number(gold.value),rice:Number(rice.value),troops:Number(men.value)}),blocked||!alliedChoices().length);
 }else if(tab==='diplomacy'){
  const g=group('外交・偵察・工作','同盟は3か月の相互不可侵。交渉には君主か外交特技が必要。偵察は3か月、敵の都市情報と武将を公開します。工作は隣接敵都市のみ。');
  const [tw,target]=select('対象都市',enemyChoices());g.append(tw);for(const [text,type]of [['同盟交渉（金60）','alliance'],['偵察（金25）','spy'],['兵糧工作（金35）','sabotage']])g.append(button(text,()=>run(type,{target:Number(target.value)}),blocked||!enemyChoices().length));
  for(const [f,end]of Object.entries(state.alliances))if(end>stamp(state))g.append(el('p',`${f}：あと${end-stamp(state)}か月の不可侵同盟。`));
 }else{
  const g=group('前月の収支と出来事','「翌月へ」で月次内政・収支・忠誠・敵の増兵と侵攻を処理します。収穫は9月末。侵攻された場合は迎撃か籠城を選びます。');const list=el('ul');for(const t of state.report)list.append(el('li',t));if(!state.report.length)list.append(el('li','まだ月次報告はありません。内政担当を設定して翌月へ進めてください。'));g.append(list);
 }
}
function hexCenter(q,r){return {x:48+q*65+r*32.5,y:43+r*55};}
function renderBattle(){
 const b=state.battle;$('battle-panel').hidden=!b;if(!b)return;
 $('battle-title').textContent=`${state.provinces[b.target].name} ${b.defending?'防衛戦':'攻略戦'} ／ ${b.stage==='field'?'野戦':'攻城戦'}`;
 $('battle-meta').textContent=`${b.day}日目・${b.weather} ／ 攻撃軍兵糧${b.supply} ／ 城門${b.gate}`;
 $('defense-choice').replaceChildren();if(b.choice)$('defense-choice').append(button('野戦で迎撃',()=>{chooseDefense(state,false);render();}),button('城に籠もる',()=>{chooseDefense(state,true);render();}));
 $('battle-hint').textContent=b.choice?'防衛方針を選んでください。':'青が味方、赤が敵。緑のマスを選択して移動。部隊の命令は1日1回。「日を進める」で敵が行動します。山は通行不可、川は移動費2。';
 const player=b.units.find(u=>u.team==='player'),possible=reachable(state,player.id),root=$('battle-map');root.replaceChildren();
 for(let r=0;r<HEX_H;r++)for(let q=0;q<HEX_W;q++){
  const {x,y}=hexCenter(q,r),land=terrain(q,r),move=possible.some(t=>t.q===q&&t.r===r),cell=svg('g',{class:`hex ${land} ${move?'reachable':''}`,role:'button',tabindex:move?0:-1,'aria-label':`マス ${q},${r} ${land}${move?' 移動可能':''}`});
  const points=Array.from({length:6},(_,i)=>{const a=(i*60-30)*Math.PI/180;return `${x+36*Math.cos(a)},${y+36*Math.sin(a)}`;}).join(' ');cell.append(svg('polygon',{points}));
  const symbol=land==='mountain'?'▲':land==='forest'?'♣':land==='river'?'≈':'';if(symbol)cell.append(svg('text',{x,y:y+5,class:'terrain-symbol'},symbol));
  if(b.stage==='siege'&&q===6)cell.append(svg('text',{x,y:y+5,class:'wall-symbol'},r===3?'門':'▥'));
  const moveTo=()=>{if(!move)return;const error=battleAction(state,'move',{q,r});notice(error||'部隊を移動しました。');render();};cell.onclick=moveTo;cell.onkeydown=e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();moveTo();}};root.append(cell);
 }
 for(const f of b.fires){const {x,y}=hexCenter(f.q,f.r);root.append(svg('text',{x:x+18,y:y-12,class:'fire-marker'},'炎'));}
 for(const u of b.units){const {x,y}=hexCenter(u.q,u.r),g=svg('g',{class:`battle-unit ${u.team}`});g.append(svg('circle',{cx:x,cy:y-3,r:21}),svg('text',{x,y:y-7},u.team==='player'?'劉':'敵'),svg('text',{x,y:y+9,class:'unit-count'},u.troops),svg('text',{x,y:y+35,class:'unit-label'},state.officers[u.leader]?.name??'守備隊'));root.append(g);}
 $('battle-actions').replaceChildren();const blocked=b.choice||player.acted||!!player.confused;for(const [text,type]of [['通常攻撃','attack'],['火計','fire'],['撹乱','confuse'],['一騎討ち','duel'],['城門攻撃','gate'],['城門修復','repair'],['待機','wait']])$('battle-actions').append(button(text,()=>{const error=battleAction(state,type);notice(error||state.log[0]);render();},blocked));
 $('battle-actions').append(button('日を進める（敵が行動）',()=>{const error=endBattleDay(state);notice(error||state.log[0]);render();},b.choice),button('撤退する',()=>{modal('撤退の確認',['攻撃中は残兵が出陣元へ帰還します。防衛中の撤退は都市を失い、残兵のみ別の自都市に逃れます。']);const confirm=button('撤退を確定',()=>{$('dialog').close();battleAction(state,'retreat');notice(state.log[0]);render();});$('dialog-content').append(confirm);},b.choice));
 $('battle-detail').textContent=`味方：${state.officers[player.leader]?.name??'守備隊'}${player.deputy!==null?' ／ 副将 '+state.officers[player.deputy].name:''}　兵${player.troops}・士気${player.morale}・訓練${player.training}　${player.confused?'混乱中':player.acted?'本日行動済み':'未行動'}。攻撃軍は30日以内に決着が必要。`;
}
$('executor').onchange=()=>{executor=$('executor').value===''?null:Number($('executor').value);render();};
for(const b of document.querySelectorAll('[data-tab]'))b.onclick=()=>{tab=b.dataset.tab;render();};
$('next').onclick=()=>{const error=nextMonth(state);tab='report';notice(error||'月を進めました。月次報告を確認してください。');render();if(state.battle)$('battle-panel').scrollIntoView({behavior:'smooth'});};
$('save').onclick=()=>{try{if(!validSave(state))throw Error();localStorage.setItem(SAVE,JSON.stringify(state));notice('記録しました。合戦中の状態も保存されます。');}catch{notice('記録できません。保存領域またはゲーム状態を確認してください。');}};
$('load').onclick=()=>{try{const s=JSON.parse(localStorage.getItem(SAVE));if(!validSave(s))throw Error();state=s;executor=null;render();notice('記録を読み込みました。');}catch{notice('有効な六城版の記録がありません。旧版とは互換性がありません。');}};
$('reset').onclick=()=>{modal('新たな歴史',['現在の進行を破棄して194年1月から再開します。保存済みの記録は残ります。']);$('dialog-content').append(button('初めから始める',()=>{state=newGame();executor=null;$('dialog').close();notice('中原六城の統一を目指しましょう。');render();}));};
$('help').onclick=()=>{modal('取扱説明書',['1. 地図で自都市を選び、内政の担当武将と月予算を設定。これは命令を消費しません。','2. 命令を実行する武将を選び、人事・軍備・外交を実行。各武将は月1回行動します。','3. 翌月へ進むと収支・内政と敵の行動を処理。月次報告で結果を確認します。','4. 出陣時は主将・副将・兵数・兵科を指定。戦場では緑のマスで移動し、射程内で攻撃。「日を進める」で敵が行動します。','目標は六城統一。全都市を失うと敗北。「記録する」は手動保存。旧版の記録とは別です。']);const a=el('a','詳しい取扱説明書を開く ↗');a.href='./manual.html';a.target='_blank';a.rel='noopener';$('dialog-content').append(a);};
$('close').onclick=()=>$('dialog').close();render();
