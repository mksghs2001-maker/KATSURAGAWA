// Original, compact Three Kingdoms strategy rules. Coordinates are schematic.
export const lands=[
 ['成都','劉璋',150,300,[1,2]],['漢中','張魯',220,215,[0,2,3]],['長安','李傕',310,180,[0,1,3,4]],['洛陽','李傕',415,170,[1,2,4,6]],['許昌','曹操',500,215,[2,3,5,6,7]],['鄴','袁紹',515,90,[4,6]],['濮陽','呂布',600,165,[3,4,5,7]],['徐州','劉備',675,245,[4,6,8,10]],['寿春','袁術',570,300,[7,9,10]],['襄陽','劉表',400,330,[8,10,11]],['建業','孫策',660,375,[7,8,9,11]],['長沙','劉表',455,425,[9,10]]
];
const roster=[['劉備',7,76,78,85],['関羽',7,97,78,72],['張飛',7,98,35,30],['曹操',4,86,94,96],['荀彧',4,35,96,98],['孫策',10,94,77,73],['周瑜',10,85,97,88],['袁紹',5,73,71,78],['呂布',6,100,30,20],['劉表',9,42,70,83],['劉璋',0,35,45,62],['張魯',1,46,66,70],['李傕',2,75,32,23],['趙雲',null,96,78,75],['魯粛',null,56,92,95],['徐庶',null,64,94,83],['太史慈',null,95,65,59]];
export function newGame(){return {version:2,year:194,season:0,ap:3,selected:7,ended:null,tax:40,log:['興平元年。徐州の劉備として、人材を集め乱世を治めよ。'],officers:roster.map(([name,city,war,int,pol])=>({name,city,war,int,pol})),provinces:lands.map((l,i)=>({name:l[0],owner:l[1],gold:i===7?220:150,rice:i===7?300:200,troops:i===7?120:70+i%4*15,farm:50,morale:70}))};}
export const owned=s=>s.provinces.filter(p=>p.owner==='劉備');
export const officersAt=(s,i)=>s.officers.filter(o=>o.city===i);
export const canAttack=(s,i)=>!!s.provinces[i]&&s.provinces[i].owner!=='劉備'&&lands[i][4].some(n=>s.provinces[n].owner==='劉備');
const log=(s,t)=>{s.log.unshift(t);s.log=s.log.slice(0,40);};
export function act(s,type,target,random=Math.random){
 if(s.ended)return 'この歴史は終結しました。';
 if(s.ap<=0)return '命令を使い切りました。次の季節へ進めてください。';
 const p=s.provinces[s.selected];let message;
 if(type==='attack'){
  if(!Number.isInteger(target)||!canAttack(s,target))return '自勢力に隣接する敵都市を選んでください。';
  const source=lands[target][4].filter(i=>s.provinces[i].owner==='劉備').sort((a,b)=>s.provinces[b].troops-s.provinces[a].troops)[0];
  const a=s.provinces[source],b=s.provinces[target];
  if(a.troops<40||a.rice<50)return '出陣元に兵40・兵糧50が必要です。';
  const general=officersAt(s,source).sort((a,b)=>b.war-a.war)[0];
  if(!general)return '出陣元に武将が必要です。';
  const defender=Math.max(40,...officersAt(s,target).map(o=>o.war));
  a.rice-=50;
  const power=a.troops*(.65+general.war/100)*a.morale/70*(.85+random()*.3);
  if(power>b.troops*(.65+defender/100)){
   const sent=Math.floor(a.troops*.6);a.troops-=sent;b.troops=Math.max(10,Math.floor(sent*.75));b.owner='劉備';b.morale=55;
   for(const o of officersAt(s,target))o.city=null;
   general.city=target;message=`${general.name}が${a.name}から進軍。${b.name}を攻略！ 兵${b.troops}で駐屯。`;
  }else{a.troops=Math.max(5,Math.floor(a.troops*.6));b.troops=Math.max(5,Math.floor(b.troops*.85));message=`${general.name}の${b.name}攻めは敗退。残兵${a.troops}。`;}
 }else{
  if(p.owner!=='劉備')return '自勢力の都市を選択してください。';
  const talent=Math.max(40,...officersAt(s,s.selected).map(o=>o.pol));
  if(type==='farm'){if(p.gold<30)return '金30が必要です。';p.gold-=30;const gain=10+Math.floor(talent/10);p.farm+=gain;message=`${p.name}で農地を開発。農業＋${gain}。`;}
  else if(type==='recruit'){if(p.gold<40||p.rice<20)return '金40・兵糧20が必要です。';p.gold-=40;p.rice-=20;p.troops+=30;message=`${p.name}で兵30を徴募。`;}
  else if(type==='train'){if(p.gold<20)return '金20が必要です。';if(p.morale>=100)return '士気は最大です。';p.gold-=20;p.morale=Math.min(100,p.morale+15);message=`${p.name}で調練。士気を高めた。`;}
  else if(type==='search'){if(p.gold<40)return '金40が必要です。';const o=s.officers.find(o=>o.city===null);if(!o)return '登用できる在野武将はいません。';p.gold-=40;o.city=s.selected;message=`${p.name}に${o.name}を登用！ 武力${o.war}・知力${o.int}・政治${o.pol}。`;}
  else if(type==='move'){if(!Number.isInteger(target)||!s.provinces[target]||target===s.selected||s.provinces[target].owner!=='劉備')return '別の自都市を選んでください。';const o=officersAt(s,s.selected).at(-1);if(!o)return '移動できる武将がいません。';o.city=target;message=`${o.name}が${p.name}から${s.provinces[target].name}へ赴任。`;}
  else if(type==='buy'){if(p.gold<40)return '金40が必要です。';p.gold-=40;p.rice+=60;message=`${p.name}で兵糧60を購入。`;}
  else if(type==='give'){if(p.rice<30)return '兵糧30が必要です。';p.rice-=30;p.morale=Math.min(100,p.morale+20);message=`${p.name}で施し。士気を回復。`;}
  else if(type==='tax'){s.tax=s.tax===40?60:40;message=`税率を${s.tax}％に変更。重税中は毎季士気が10低下。`;}
  else return '不明な命令です。';
 }
 s.ap--;log(s,message);if(owned(s).length===lands.length){s.ended='victory';log(s,'天下統一。漢土に再び太平が訪れた。');}return null;
}
export function nextSeason(s,random=Math.random){
 if(s.ended)return;s.season=(s.season+1)%4;if(!s.season)s.year++;s.ap=3;
 for(const p of s.provinces){p.gold+=Math.floor((25+p.farm/4)*(p.owner==='劉備'?s.tax/40:1));p.rice+=(s.season===2?p.farm*2:20)-Math.ceil(p.troops/8);if(p.owner==='劉備'&&s.tax===60)p.morale=Math.max(20,p.morale-10);if(p.rice<0){p.rice=0;p.troops=Math.max(5,p.troops-20);}}
 log(s,`${s.year}年・${['春','夏','秋','冬'][s.season]}。税収を受領${s.season===2?'、秋の収穫。':'。'}`);
 // Only cities hostile at the start act; newly captured cities cannot attack again this turn.
 const enemies=s.provinces.map((p,i)=>i).filter(i=>s.provinces[i].owner!=='劉備');
 for(const i of enemies){const p=s.provinces[i];p.troops+=8;const t=lands[i][4].find(n=>s.provinces[n].owner==='劉備'&&s.provinces[n].troops<p.troops*.65);if(t!==undefined&&random()<.3){const b=s.provinces[t];b.owner=p.owner;b.troops=Math.floor(p.troops/2);p.troops=Math.ceil(p.troops/2);for(const o of officersAt(s,t))o.city=null;log(s,`${p.owner}軍が${b.name}を攻略。都市を失った！`);}}
 if(!owned(s).length){s.ended='defeat';log(s,'劉備勢力は滅亡した。新たな歴史で再起を期そう。');}
}
export function validSave(s){
 const n=x=>Number.isSafeInteger(x)&&x>=0&&x<=100000000;
 return !!s&&s.version===2&&n(s.year)&&s.year>=194&&Number.isInteger(s.season)&&s.season>=0&&s.season<4&&Number.isInteger(s.ap)&&s.ap>=0&&s.ap<=3&&Number.isInteger(s.selected)&&s.selected>=0&&s.selected<lands.length&&[40,60].includes(s.tax)&&[null,'victory','defeat'].includes(s.ended)&&Array.isArray(s.log)&&s.log.length<=40&&s.log.every(x=>typeof x==='string'&&x.length<500)&&Array.isArray(s.provinces)&&s.provinces.length===lands.length&&s.provinces.every((p,i)=>p&&p.name===lands[i][0]&&['劉備',...lands.map(l=>l[1])].includes(p.owner)&&['gold','rice','troops','farm','morale'].every(k=>n(p[k]))&&p.morale<=100)&&Array.isArray(s.officers)&&s.officers.length===roster.length&&s.officers.every((o,i)=>o&&o.name===roster[i][0]&&(o.city===null||Number.isInteger(o.city)&&o.city>=0&&o.city<lands.length)&&['war','int','pol'].every((k,j)=>o[k]===roster[i][j+2]));
}
