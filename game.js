// Original rules inspired by historical strategy games; no original game data/formulae.
export const PLAYER='劉備';
export const lands=[['許昌','曹操',310,195,[1,3,5]],['濮陽','呂布',465,120,[0,2,5]],['徐州',PLAYER,650,245,[1,3,4,5]],['寿春','袁術',470,335,[0,2,4,5]],['建業','孫策',655,420,[2,3]],['小沛',PLAYER,500,235,[0,1,2,3]]];
export const sectors={farm:'農業',commerce:'商業',flood:'治水',tech:'技術'};
export const skillNames={talent:'人材',diplomacy:'外交',farm:'農政',fire:'火計',confuse:'撹乱',cavalry:'騎兵',archer:'弓兵'};
const roster=[
 ['劉備',2,PLAYER,81,75,77,84,['talent','diplomacy']],['関羽',2,PLAYER,93,96,76,70,['cavalry']],['張飛',2,PLAYER,86,98,36,31,[]],['趙雲',5,PLAYER,91,95,78,74,['cavalry']],['孫乾',5,PLAYER,48,38,79,86,['talent','diplomacy']],
 ['曹操',0,'曹操',95,84,93,94,['talent','diplomacy','fire']],['夏侯惇',0,'曹操',87,91,64,60,['cavalry']],['荀彧',0,'曹操',43,27,96,97,['talent','confuse']],
 ['呂布',1,'呂布',90,100,31,22,['cavalry']],['陳宮',1,'呂布',72,48,94,83,['fire','confuse']],['張遼',1,'呂布',93,92,79,70,['cavalry']],
 ['袁術',3,'袁術',61,62,64,65,['diplomacy']],['紀霊',3,'袁術',82,88,52,42,[]],['楊弘',3,'袁術',41,25,76,80,['confuse']],
 ['孫策',4,'孫策',92,94,76,72,['cavalry']],['周瑜',4,'孫策',94,78,96,87,['fire','confuse','diplomacy']],['黄蓋',4,'孫策',79,83,68,65,['fire']],
 ['徐庶',null,null,78,64,94,82,['talent','confuse']],['魯粛',null,null,72,53,91,94,['farm','diplomacy']],['太史慈',null,null,86,95,64,59,['archer']]
];
export function newGame(){return {version:3,year:194,month:1,selected:2,ended:null,log:['架空の194年。劉備は徐州・小沛から中原六城の統一を目指す。'],report:[],alliances:{},intel:{},battle:null,officers:roster.map(([name,city,faction,lead,war,int,pol,skills],id)=>({id,name,city,faction,lead,war,int,pol,skills:[...skills],loyalty:85,acted:false,prisoner:false})),provinces:lands.map(([name,owner],i)=>({name,owner,gold:i===2?420:260,rice:450,troops:i===2?200:i===5?100:130,farm:55,commerce:50,flood:50,tech:30,people:75,morale:75,training:55,tax:40,projects:Object.fromEntries(Object.keys(sectors).map(k=>[k,{officer:null,budget:0}]))}))};}
export const owned=s=>s.provinces.filter(p=>p.owner===PLAYER);
export const officersAt=(s,i)=>s.officers.filter(o=>o.city===i&&!o.prisoner&&o.faction===s.provinces[i]?.owner);
export const readyOfficers=(s,i)=>officersAt(s,i).filter(o=>o.faction===PLAYER&&!o.acted);
export const stamp=s=>s.year*12+s.month;
export const allied=(s,faction)=>(s.alliances[faction]||0)>stamp(s);
export const canAttack=(s,i,from=s.selected)=>!!s.provinces[i]&&s.provinces[from]?.owner===PLAYER&&s.provinces[i].owner!==PLAYER&&lands[from][4].includes(i)&&!allied(s,s.provinces[i].owner);
export const marketRate=s=>2+(s.month%4); // rice per gold, displayed before trading
const clamp=(v,lo=0,hi=100)=>Math.max(lo,Math.min(hi,v));
const record=(s,t)=>{s.log.unshift(t);s.log=s.log.slice(0,60);};
const integer=(x,lo,hi)=>Number.isSafeInteger(x)&&x>=lo&&x<=hi;
function clearAssignments(s,id){for(const p of s.provinces)for(const a of Object.values(p.projects))if(a.officer===id)a.officer=null;}
export function configureProject(s,city,sector,officer,budget){
 if(s.ended||s.battle)return '月末や合戦の処理を終えてから変更してください。';
 const p=s.provinces[city];if(!p||p.owner!==PLAYER||!Object.hasOwn(sectors,sector)||!integer(budget,0,80))return '担当・予算の指定が不正です。';
 if(officer!==null&&!officersAt(s,city).some(o=>o.id===officer))return 'その都市の武将を選んでください。';
 if(officer!==null&&Object.entries(p.projects).some(([k,a])=>k!==sector&&a.officer===officer))return '同じ武将は複数の内政を兼任できません。';
 p.projects[sector]={officer,budget};return null;
}
export function act(s,type,args={},random=Math.random){
 if(s.ended)return 'この歴史は終結しました。';if(s.battle)return '先に合戦を終えてください。';
 const p=s.provinces[s.selected],o=s.officers[args.officer];
 if(p.owner!==PLAYER)return '自勢力の都市を選択してください。';
 if(!o||o.city!==s.selected||o.faction!==PLAYER||o.prisoner||o.acted)return '未行動の在城武将を選んでください。';
 const spend=(gold,rice=0)=>p.gold>=gold&&p.rice>=rice;
 let message;
 if(type==='recruit'){
  if(!spend(45,30))return '金45・兵糧30が必要です。';p.gold-=45;p.rice-=30;p.troops+=40;p.people=clamp(p.people-5);message=`${o.name}が${p.name}で兵40を徴募。民心－5。`;
 }else if(type==='train'){
  if(!spend(20))return '金20が必要です。';p.gold-=20;p.training=clamp(p.training+8+Math.floor(o.lead/12));p.morale=clamp(p.morale+8);message=`${o.name}の調練。訓練${p.training}、士気${p.morale}。`;
 }else if(type==='give'){
  if(!spend(0,40))return '兵糧40が必要です。';p.rice-=40;p.people=clamp(p.people+10+Math.floor(o.pol/15));message=`${o.name}が施しを実施。${p.name}の民心${p.people}。`;
 }else if(type==='buy'||type==='sell'){
  const rate=marketRate(s);if(type==='buy'){if(!spend(30))return '金30が必要です。';p.gold-=30;p.rice+=30*rate;}else{if(p.rice<30*rate)return `兵糧${30*rate}が必要です。`;p.rice-=30*rate;p.gold+=30;}message=`${o.name}が米を${type==='buy'?'購入':'売却'}。金30 ⇄ 兵糧${30*rate}。`;
 }else if(type==='tax'){
  p.tax=p.tax===40?60:40;message=`${p.name}の税率を${p.tax}％へ。重税は毎月民心－8。`;
 }else if(type==='hire'){
  if(o.name!==PLAYER&&!o.skills.includes('talent'))return '君主または人材特技の武将が必要です。';
  const target=s.officers[args.target];if(!target||(target.faction!==null&&!target.prisoner)||target.prisoner&&target.city!==s.selected)return '在野武将か、この都市の捕虜を選んでください。';
  if(!spend(50))return '金50が必要です。';p.gold-=50;
  if(random()<clamp(.5+o.pol/250-(target.prisoner?.18:0),.15,.95)){target.faction=PLAYER;target.city=s.selected;target.prisoner=false;target.loyalty=70;target.acted=true;message=`${o.name}の説得により${target.name}が加入。今月は行動済み。`;}else message=`${o.name}の登用は断られた。金50を使用。`;
 }else if(type==='reward'){
  const target=s.officers[args.target];if(!target||target.faction!==PLAYER||target.prisoner||target.city!==s.selected)return '在城する味方武将を選んでください。';if(!spend(30))return '金30が必要です。';p.gold-=30;target.loyalty=clamp(target.loyalty+15);message=`${target.name}に褒美。忠誠${target.loyalty}。`;
 }else if(type==='move'||type==='transport'){
  const destination=s.provinces[args.target];if(!destination||args.target===s.selected||destination.owner!==PLAYER||!lands[s.selected][4].includes(args.target))return '街道で隣接する自都市を選んでください。';
  if(type==='transport'){
   const {gold=0,rice=0,troops=0}=args;if(![gold,rice,troops].every(v=>integer(v,0,1000000))||gold+rice+troops===0)return '輸送量を正しく指定してください。';if(p.gold<gold||p.rice<rice||p.troops<troops)return '輸送する資源が足りません。';
   for(const k of ['gold','rice','troops']){const v=args[k]||0;p[k]-=v;destination[k]+=v;}message=`${o.name}が${destination.name}へ輸送。金${gold}・糧${rice}・兵${troops}。`;
  }else{clearAssignments(s,o.id);o.city=args.target;message=`${o.name}が${destination.name}へ赴任。今月の行動は消費。`;}
 }else if(type==='spy'||type==='alliance'){
  const target=s.provinces[args.target];if(!target||target.owner===PLAYER)return '敵都市を選んでください。';if(!spend(type==='spy'?25:60))return '必要な金が足りません。';
  if(type==='spy'){p.gold-=25;s.intel[args.target]=stamp(s)+3;message=`${o.name}が${target.name}を偵察。3か月間、兵力と在城武将を確認可能。`;}
  else{if(o.name!==PLAYER&&!o.skills.includes('diplomacy'))return '君主または外交特技の武将が必要です。';if(allied(s,target.owner))return '既に同盟中です。';p.gold-=60;if(random()<.45+o.pol/250){s.alliances[target.owner]=stamp(s)+3;message=`${target.owner}と3か月の不可侵同盟を締結。`;}else message=`${target.owner}との交渉は不成立。金60を使用。`;}
 }else if(type==='sabotage'){
  if(!o.skills.includes('fire')&&!o.skills.includes('confuse'))return '火計または撹乱特技が必要です。';const target=s.provinces[args.target];if(!target||!lands[s.selected][4].includes(args.target)||target.owner===PLAYER||allied(s,target.owner))return '同盟していない隣接敵都市を選んでください。';if(!spend(35))return '金35が必要です。';p.gold-=35;if(random()<.4+o.int/250){target.rice=Math.max(0,target.rice-70);target.morale=clamp(target.morale-10);message=`${o.name}の工作成功。${target.name}の糧－70、士気－10。`;}else message=`${o.name}の工作は失敗。`;
 }else if(type==='release'){
  const target=s.officers[args.target];if(!target?.prisoner||target.city!==s.selected)return 'この都市の捕虜を選んでください。';target.prisoner=false;target.faction=null;target.city=null;target.acted=true;p.people=clamp(p.people+5);message=`${target.name}を解放。民心＋5。`;
 }else return '不明な命令です。';
 o.acted=true;record(s,message);return null;
}
function checkEnding(s){if(!owned(s).length){s.ended='defeat';record(s,'劉備勢力は滅亡。新たな歴史で再起を。');}else if(owned(s).length===lands.length){s.ended='victory';record(s,'中原六城統一！ 民を養い、乱世に太平をもたらした。');}}
function changeCity(s,id,faction){const p=s.provinces[id];p.owner=faction;for(const o of s.officers.filter(o=>o.city===id)){clearAssignments(s,o.id);if(o.prisoner){o.prisoner=false;o.faction=null;o.city=null;}else if(o.faction!==faction){if(faction===PLAYER){o.prisoner=true;o.acted=true;}else{o.faction=null;o.city=null;}}}for(const a of Object.values(p.projects))a.officer=null;p.people=45;}
export function nextMonth(s,random=Math.random){
 if(s.ended)return 'この歴史は終結しました。';if(s.battle)return '合戦中は月を進められません。';
 s.report=[];
 for(let i=0;i<s.provinces.length;i++){
  const p=s.provinces[i];
  for(const [k,a] of Object.entries(p.projects)){
   const o=s.officers[a.officer];if(a.officer===null||!o||o.city!==i||o.faction!==p.owner||o.prisoner){a.officer=null;continue;}
   if(!a.budget)continue;const cost=Math.min(a.budget,p.gold);p.gold-=cost;const gain=Math.floor(cost*(o.pol/100+(k==='farm'&&o.skills.includes('farm')?.25:0))/5);const before=p[k];p[k]=clamp(p[k]+gain,0,200);if(p.owner===PLAYER)s.report.push(`${p.name}・${sectors[k]}：${o.name}、支出${cost}、成果＋${p[k]-before}${cost<a.budget?'（資金不足）':''}`);
  }
  const income=Math.floor((18+p.commerce/3)*p.tax/40);p.gold+=income;
  const harvest=s.month===9?p.farm*3:35;p.rice+=harvest;const upkeep=Math.ceil(p.troops/12);p.rice-=upkeep;
  if(p.tax===60)p.people=clamp(p.people-8);
  if(p.rice<0){p.rice=0;const loss=Math.min(p.troops,25);p.troops-=loss;p.morale=clamp(p.morale-12);if(p.owner===PLAYER)s.report.push(`${p.name}：兵糧不足で兵${loss}を失った。`);}
  if(p.people<30&&random()<.35){p.gold=Math.floor(p.gold*.75);p.troops=Math.floor(p.troops*.85);if(p.owner===PLAYER)s.report.push(`${p.name}：民心低下で反乱。金・兵力が減少。`);}
  if(s.month%3===0&&random()<.12){const loss=Math.floor((200-p.flood)/5);p.rice=Math.max(0,p.rice-loss);if(p.owner===PLAYER)s.report.push(`${p.name}：水害で兵糧${loss}を喪失。治水で軽減可能。`);}
  if(p.owner===PLAYER)s.report.push(`${p.name}：税収${income}、補給${harvest}、兵糧消費${upkeep}。`);
  else{const n=Math.min(12,Math.floor(p.gold/5),Math.floor(p.rice/3));p.gold-=n*5;p.rice-=n*3;p.troops+=n;p.training=clamp(p.training+3);}
 }
 s.month++;if(s.month>12){s.month=1;s.year++;}for(const o of s.officers)o.acted=false;
 for(const o of s.officers)if(o.faction===PLAYER&&!o.prisoner&&o.name!==PLAYER){o.loyalty=clamp(o.loyalty-1);if(o.loyalty<35&&random()<.2){clearAssignments(s,o.id);o.faction=null;o.city=null;s.report.push(`${o.name}が忠誠低下により下野。`);}}
 record(s,`${s.year}年${s.month}月。月次報告を確認してください。`);for(const f of Object.keys(s.alliances))if(!allied(s,f))delete s.alliances[f];
 // At most one invasion per month; player chooses how to defend in the same tactical system.
 for(let i=0;i<s.provinces.length;i++){
  const p=s.provinces[i];if(p.owner===PLAYER||allied(s,p.owner)||p.rice<60||p.troops<90)continue;
  const target=lands[i][4].find(j=>s.provinces[j].owner===PLAYER&&s.provinces[j].troops<p.troops*.85);
  const general=officersAt(s,i).sort((a,b)=>b.lead-a.lead)[0];
  if(target!==undefined&&general&&random()<.25){const count=Math.floor(p.troops*.65);p.troops-=count;p.rice-=60;createBattle(s,i,target,general.id,null,count,'infantry',true);record(s,`${p.owner}が${s.provinces[target].name}へ侵攻！ 迎撃か籠城を選んでください。`);break;}
 }
 checkEnding(s);return null;
}
export const HEX_W=9,HEX_H=7;
export const hexDistance=(a,b)=>Math.max(Math.abs(a.q-b.q),Math.abs(a.r-b.r),Math.abs(a.q+a.r-b.q-b.r));
const neighbors=t=>[[1,0],[-1,0],[0,1],[0,-1],[1,-1],[-1,1]].map(([q,r])=>({q:t.q+q,r:t.r+r})).filter(t=>t.q>=0&&t.q<HEX_W&&t.r>=0&&t.r<HEX_H);
export function terrain(q,r){if((q===4&&r!==3&&r!==4))return 'river';if((q===2&&r===2)||(q===6&&r===4)||(q===3&&r===5))return 'mountain';if((q+r)%5===0)return 'forest';return 'plain';}
export function startBattle(s,args){
 if(s.ended||s.battle)return '現在は出陣できません。';const source=s.selected,p=s.provinces[source],{target,leader,deputy=null,troops,type='infantry'}=args;
 if(!integer(target,0,lands.length-1)||!canAttack(s,target))return '同盟していない隣接敵都市を選んでください。';
 const o=s.officers[leader],d=deputy===null?null:s.officers[deputy];
 if(!readyOfficers(s,source).some(x=>x.id===leader)||deputy!==null&&(!readyOfficers(s,source).some(x=>x.id===deputy)||leader===deputy))return '未行動の主将・別の副将を選んでください。';
 if(!integer(troops,30,p.troops)||p.rice<60)return '兵30以上と兵糧60が必要です。';if(!['infantry','cavalry','archer'].includes(type))return '兵科が不正です。';if(type==='cavalry'&&p.gold<40)return '騎兵の装備に金40が必要です。';if(type==='archer'&&p.tech<40)return '弓兵の編成には技術40が必要です。';
 p.troops-=troops;p.rice-=60;if(type==='cavalry')p.gold-=40;o.acted=true;if(d)d.acted=true;createBattle(s,source,target,leader,deputy,troops,type,false);record(s,`${o.name}が${s.provinces[target].name}へ兵${troops}で出陣。`);return null;
}
function createBattle(s,source,target,leader,deputy,troops,type,defending){
 const a=s.provinces[source],d=s.provinces[target];const guard=officersAt(s,target).sort((a,b)=>b.lead-a.lead)[0];
 const unit=(id,team,q,r,count,l,sub,kind,morale,training)=>({id,team,q,r,troops:count,leader:l,deputy:sub,type:kind,morale,training,acted:false,confused:0});
 const count=d.troops;d.troops=0;
 s.battle={source,target,defending,choice:defending,stage:'field',day:1,supply:60,gate:100,weather:'晴',fires:[],units:[unit(0,defending?'enemy':'player',1,3,troops,leader,deputy,type,a.morale,a.training),unit(1,defending?'player':'enemy',7,3,count,guard?.id??null,null,'infantry',d.morale,d.training)]};
}
export function chooseDefense(s,siege){if(!s.battle?.choice)return '迎撃方針は既に決定しています。';s.battle.choice=false;if(siege){s.battle.stage='siege';s.battle.units[0].q=3;s.battle.units[1].q=7;}return null;}
export function battleSkills(s,u){return [...new Set([u.leader,u.deputy].filter(x=>x!==null).flatMap(id=>s.officers[id].skills))];}
export function reachable(s,id){
 const b=s.battle,u=b?.units.find(x=>x.id===id);if(!u||u.acted||u.confused||b.choice)return [];
 const limit=u.type==='cavalry'?3:2,seen=new Map([[`${u.q},${u.r}`,0]]),queue=[{q:u.q,r:u.r,cost:0}],result=[];
 while(queue.length){const t=queue.shift();for(const n of neighbors(t)){const k=`${n.q},${n.r}`,land=terrain(n.q,n.r);if(land==='mountain'||b.units.some(x=>x.troops>0&&x.q===n.q&&x.r===n.r))continue;if(b.stage==='siege'&&b.gate>0&&n.q>=6&&u.id===0)continue;const cost=t.cost+(land==='river'?2:1);if(cost>limit||seen.has(k)&&seen.get(k)<=cost)continue;seen.set(k,cost);queue.push({...n,cost});result.push(n);}}
 return result;
}
function power(s,u){const o=s.officers[u.leader],skills=battleSkills(s,u);return (.6+(o?.lead??50)/100)*(0.65+u.training/150)*(0.65+u.morale/150)*(skills.includes(u.type==='cavalry'?'cavalry':'archer')&&u.type!=='infantry'?1.15:1);}
function finishBattle(s,win){
 const b=s.battle,player=b.units.find(u=>u.team==='player'),enemy=b.units.find(u=>u.team==='enemy');
 const attacker=b.units[0],defender=b.units[1];
 const attackerWins=b.defending?!win:win;
 if(attackerWins){
  changeCity(s,b.target,s.provinces[b.source].owner);s.provinces[b.target].troops=attacker.troops;s.provinces[b.target].morale=attacker.morale;
  for(const id of [attacker.leader,attacker.deputy])if(id!==null){clearAssignments(s,id);s.officers[id].city=b.target;}
  s.provinces[b.target].rice+=b.supply;
 }else{
  s.provinces[b.target].troops=defender.troops;s.provinces[b.source].troops+=attacker.troops;s.provinces[b.source].rice+=b.supply;
 }
 // Defeated player defenders escape into a remaining city, without duplicating soldiers.
 if(b.defending&&!win){const escape=s.provinces.findIndex(p=>p.owner===PLAYER);if(escape>=0)s.provinces[escape].troops+=player.troops;}
 record(s,`${s.provinces[b.target].name}の戦い：${win?'劉備軍勝利':'劉備軍敗北'}。味方残兵${player.troops}・敵残兵${enemy.troops}。`);s.battle=null;checkEnding(s);
}
function outcome(s){const b=s.battle;if(!b)return;if(b.units.find(u=>u.team==='player').troops<=0)finishBattle(s,false);else if(b.units.find(u=>u.team==='enemy').troops<=0)finishBattle(s,true);}
function strike(s,u,v,random){const cover=terrain(v.q,v.r)==='forest'?.8:1;const damage=Math.max(5,Math.floor((u.troops*.18+5)*power(s,u)/power(s,v)*cover*(.9+random()*.2)));v.troops=Math.max(0,v.troops-damage);v.morale=clamp(v.morale-5);record(s,`${u.team==='player'?'味方':'敵'}の攻撃。兵${damage}の損害。`);}
export function battleAction(s,type,args={},random=Math.random){
 const b=s.battle;if(!b||b.choice)return '迎撃か籠城を選択してください。';const u=b.units.find(u=>u.team==='player'),v=b.units.find(u=>u.team==='enemy');
 if(type==='retreat'){finishBattle(s,false);return null;}
 if(u.acted||u.confused)return 'この部隊は行動済み、または混乱中です。日を進めてください。';
 const distance=hexDistance(u,v),skills=battleSkills(s,u),intel=Math.max(...[u.leader,u.deputy].map(id=>s.officers[id]?.int??40));
 if(type==='move'){
  if(!reachable(s,u.id).some(t=>t.q===args.q&&t.r===args.r))return '移動可能なマスを選んでください。';u.q=args.q;u.r=args.r;
 }else if(type==='attack'){
  if(distance>(u.type==='archer'?3:1))return '敵が射程外です。歩兵・騎兵1、弓兵3マス。';if(b.stage==='siege'&&b.gate>0&&u.id===0&&v.q>=6&&u.type!=='archer')return '城門が進路を阻んでいます。先に城門を破壊してください。';strike(s,u,v,random);
 }else if(type==='fire'){
  if(!skills.includes('fire'))return '火計特技が必要です。';if(distance>3)return '火計の射程は3マスです。';if(b.weather==='雨')return '雨のため火計は使えません。';
  if(random()<.35+intel/200){const loss=Math.min(v.troops,Math.floor(15+intel/5));v.troops-=loss;b.fires=[{q:v.q,r:v.r,ttl:2}];record(s,`火計成功。敵兵${loss}を焼き払った。`);}else record(s,'火計は失敗した。');
 }else if(type==='confuse'){
  if(!skills.includes('confuse'))return '撹乱特技が必要です。';if(distance>3)return '撹乱の射程は3マスです。';if(random()<.3+intel/200){v.confused=2;record(s,'撹乱成功。敵の次の行動を封じた。');}else record(s,'撹乱は失敗した。');
 }else if(type==='duel'){
  if(distance>1)return '一騎討ちは隣接時のみです。';const a=s.officers[u.leader]?.war??40,d=s.officers[v.leader]?.war??40;if(random()<.3){record(s,'敵将は一騎討ちを断った。');}else{const loser=a*(.85+random()*.3)>=d?v:u;loser.troops=Math.max(0,loser.troops-25);loser.morale=clamp(loser.morale-20);record(s,`一騎討ち。${loser===v?'味方':'敵'}の武将が勝利！ 敗軍は兵25・士気20を失った。`);}
 }else if(type==='gate'){
  if(b.stage!=='siege'||u.id!==0||u.q<4)return '攻城側が城門付近（列4以東）に進む必要があります。';const loss=20+Math.floor((s.officers[u.leader]?.lead??50)/5);b.gate=Math.max(0,b.gate-loss);record(s,`城門を攻撃。耐久${b.gate}。`);
 }else if(type==='repair'){
  if(b.stage!=='siege'||u.id!==1)return '籠城側のみ城門を修復できます。';b.gate=clamp(b.gate+20);record(s,'城門を20修復。');
 }else if(type!=='wait')return '不明な戦闘命令です。';
 u.acted=true;outcome(s);return null;
}
export function endBattleDay(s,random=Math.random){
 const b=s.battle;if(!b||b.choice)return '迎撃か籠城を選んでください。';
 const enemy=b.units.find(u=>u.team==='enemy'),player=b.units.find(u=>u.team==='player');
 if(enemy.troops>0&&!enemy.confused){
  if(b.stage==='siege'&&enemy.id===0&&enemy.q>=4&&b.gate>0){b.gate=Math.max(0,b.gate-35);record(s,`敵が城門を攻撃。耐久${b.gate}。`);}
  else if(hexDistance(enemy,player)<=1)strike(s,enemy,player,random);
  else{const options=reachable({...s,battle:{...b,choice:false,units:b.units.map(u=>({...u,acted:false}))}},enemy.id);options.sort((a,c)=>hexDistance(a,player)-hexDistance(c,player));const destination=options.find(t=>!(b.stage==='siege'&&enemy.id===1&&b.gate>0&&t.q<6));if(destination){enemy.q=destination.q;enemy.r=destination.r;}}
 }
 outcome(s);if(!s.battle)return null;
 b.day++;b.supply=Math.max(0,b.supply-2);b.weather=random()<.22?'雨':'晴';
 for(const u of b.units){u.acted=false;u.confused=Math.max(0,u.confused-1);for(const f of b.fires)if(f.q===u.q&&f.r===u.r&&b.weather!=='雨')u.troops=Math.max(0,u.troops-8);}
 b.fires=b.weather==='雨'?[]:b.fires.map(f=>({...f,ttl:f.ttl-1})).filter(f=>f.ttl>0);outcome(s);if(!s.battle)return null;
 if(b.stage==='field'&&b.units[1].troops<b.units[0].troops*.55&&b.units[1].team==='enemy'){
  b.stage='siege';b.units[0].q=3;b.units[0].r=3;b.units[1].q=7;b.units[1].r=3;record(s,'敵が城へ退却。攻城戦に移行。城門を破り、本陣を倒せ。');
 }
 if(b.supply===0||b.day>30){record(s,'攻撃軍は補給・日数の限界で撤退。');finishBattle(s,b.defending);}
 return null;
}
export function validSave(s){
 try{
  const num=x=>integer(x,0,10000000),idx=x=>integer(x,0,lands.length-1),oid=x=>integer(x,0,roster.length-1),factions=[PLAYER,'曹操','呂布','袁術','孫策'];
  if(!s||s.version!==3||!integer(s.year,194,9999)||!integer(s.month,1,12)||!idx(s.selected)||![null,'victory','defeat'].includes(s.ended)||!Array.isArray(s.log)||s.log.length>60||!s.log.every(x=>typeof x==='string'&&x.length<500)||!Array.isArray(s.report)||s.report.length>100||!s.report.every(x=>typeof x==='string'&&x.length<500))return false;
  for(const key of ['alliances','intel'])if(!s[key]||typeof s[key]!=='object'||Array.isArray(s[key])||!Object.entries(s[key]).every(([k,v])=>(key==='alliances'?factions.filter(f=>f!==PLAYER).includes(k):idx(Number(k)))&&num(v)))return false;
  if(!Array.isArray(s.provinces)||s.provinces.length!==lands.length||!s.provinces.every((p,i)=>p&&p.name===lands[i][0]&&factions.includes(p.owner)&&['gold','rice','troops'].every(k=>num(p[k]))&&['farm','commerce','flood','tech'].every(k=>integer(p[k],0,200))&&['people','morale','training'].every(k=>integer(p[k],0,100))&&[40,60].includes(p.tax)&&p.projects&&Object.keys(p.projects).length===4&&Object.keys(sectors).every(k=>p.projects[k]&&(p.projects[k].officer===null||oid(p.projects[k].officer))&&integer(p.projects[k].budget,0,80))))return false;
  if(!Array.isArray(s.officers)||s.officers.length!==roster.length||!s.officers.every((o,i)=>o&&o.id===i&&o.name===roster[i][0]&&(o.city===null||idx(o.city))&&(o.faction===null||factions.includes(o.faction))&&['lead','war','int','pol'].every((k,j)=>o[k]===roster[i][j+3])&&JSON.stringify(o.skills)===JSON.stringify(roster[i][7])&&integer(o.loyalty,0,100)&&typeof o.acted==='boolean'&&typeof o.prisoner==='boolean'&&(o.prisoner?o.city!==null&&s.provinces[o.city].owner===PLAYER&&o.faction!==PLAYER:o.faction===null?o.city===null:o.city!==null&&s.provinces[o.city].owner===o.faction)))return false;
  for(let i=0;i<s.provinces.length;i++){const assigned=[];for(const a of Object.values(s.provinces[i].projects))if(a.officer!==null){if(assigned.includes(a.officer)||!officersAt(s,i).some(o=>o.id===a.officer))return false;assigned.push(a.officer);}}
  if(s.battle!==null){const b=s.battle;if(s.ended||!b||!idx(b.source)||!idx(b.target)||!lands[b.source][4].includes(b.target)||typeof b.defending!=='boolean'||typeof b.choice!=='boolean'||!['field','siege'].includes(b.stage)||!integer(b.day,1,30)||!integer(b.supply,0,60)||!integer(b.gate,0,100)||!['晴','雨'].includes(b.weather)||!Array.isArray(b.fires)||b.fires.length>1||!b.fires.every(f=>integer(f.q,0,8)&&integer(f.r,0,6)&&integer(f.ttl,1,2))||!Array.isArray(b.units)||b.units.length!==2)return false;
   if(s.provinces[b.target].troops!==0||s.provinces[b.source].owner===s.provinces[b.target].owner||(!b.defending&&s.provinces[b.source].owner!==PLAYER)||b.defending!==(s.provinces[b.target].owner===PLAYER))return false;
   const ids=[];for(let i=0;i<2;i++){const u=b.units[i];if(u.id!==i||u.team!==(b.defending?i===0?'enemy':'player':i===0?'player':'enemy')||!integer(u.q,0,8)||!integer(u.r,0,6)||!num(u.troops)||!['infantry','cavalry','archer'].includes(u.type)||!integer(u.morale,0,100)||!integer(u.training,0,100)||typeof u.acted!=='boolean'||!integer(u.confused,0,2))return false;for(const id of [u.leader,u.deputy])if(id!==null){if(!oid(id)||ids.includes(id)||s.officers[id].city!==(i===0?b.source:b.target)||s.officers[id].prisoner)return false;ids.push(id);}}
   if(b.units[0].q===b.units[1].q&&b.units[0].r===b.units[1].r)return false;
  }
  return true;
 }catch{return false;}
}
