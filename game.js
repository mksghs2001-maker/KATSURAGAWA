export const lands=[
 ['越後','上杉',6,0,[1,2]],['信濃','武田',5,1,[0,2,3,4]],['甲斐','武田',6,2,[0,1,4,5]],['美濃','斎藤',4,1,[1,4,6,7]],['尾張','織田',3,2,[1,2,3,5,7]],['三河','徳川',5,3,[2,4,8]],['近江','浅井',3,0,[3,7,9]],['伊勢','北畠',2,2,[3,4,6,8,9]],['遠江','今川',6,3,[5,7]],['山城','足利',1,1,[6,7,10,11]],['摂津','三好',0,2,[9,11]],['播磨','赤松',0,0,[9,10]]
];
export function newGame(){return {version:1,year:1560,season:0,ap:3,selected:4,ended:null,tax:40,log:['永禄三年。尾張より、天下への一歩を踏み出す。'],provinces:lands.map((l,i)=>({name:l[0],owner:l[1],gold:i===4?140:90,rice:i===4?180:130,troops:i===4?90:45+i%4*10,farm:40,morale:70} ))};}
export function owned(s){return s.provinces.filter(p=>p.owner==='織田');}
export function canAttack(s,i){return s.provinces[i].owner!=='織田'&&lands[i][4].some(n=>s.provinces[n].owner==='織田');}
export function act(s,type,target,random=Math.random){
 if(s.ended)return 'この戦は終結しています。';
 if(s.ap<=0)return '行動力がありません。「次の季節へ」を選んでください。';
 const p=s.provinces[s.selected];let msg;
 if(type==='attack'){
  if(!Number.isInteger(target)||!s.provinces[target]||!canAttack(s,target))return '織田領に隣接する敵国を選んでください。';
  const sources=lands[target][4].filter(i=>s.provinces[i].owner==='織田');
  const source=sources.sort((a,b)=>s.provinces[b].troops-s.provinces[a].troops)[0];
  const a=s.provinces[source],b=s.provinces[target];
  if(a.troops<30||a.rice<30)return '隣接する出陣元に兵30・兵糧30が必要です。';
  a.rice-=30;const win=a.troops*(0.85+random()*0.4)*(a.morale/70)>b.troops;
  if(win){const sent=Math.max(10,Math.floor(a.troops*0.55));a.troops-=sent;b.troops=Math.max(10,Math.floor(sent*0.7));b.owner='織田';b.morale=55;msg=`${a.name}から${b.name}へ出陣。勝利！ 領地を獲得した。`;}
  else{a.troops=Math.max(5,Math.floor(a.troops*0.55));b.troops=Math.max(5,Math.floor(b.troops*0.8));msg=`${b.name}攻めは敗北。兵を立て直すべし。`;}
 }else{
  if(p.owner!=='織田')return '内政は自国の領地を選択してください。';
  if(type==='sell'){if(p.rice<50)return '兵糧が50必要です。';p.rice-=50;p.gold+=35;msg=`${p.name}で兵糧50を売却。金35を得た。`;}
  else if(type==='buy'){if(p.gold<40)return '金が40必要です。';p.gold-=40;p.rice+=50;msg=`${p.name}で兵糧50を購入。`;}
  else if(type==='give'){if(p.rice<30)return '兵糧が30必要です。';p.rice-=30;p.morale=Math.min(100,p.morale+20);msg=`${p.name}の民に施し。士気が上昇。`;}
  else if(type==='tax'){s.tax=(s.tax||40)===40?60:40;msg=`税率を${s.tax}％に変更。重税は収入を増やすが、毎季士気が下がる。`;}
  else if(type==='farm'){if(p.gold<30)return '金が30必要です。';p.gold-=30;p.farm+=15;msg=`${p.name}で開墾。石高が15上昇。`;}
  else if(type==='recruit'){if(p.gold<40||p.rice<20)return '金40・兵糧20が必要です。';p.gold-=40;p.rice-=20;p.troops+=30;msg=`${p.name}で兵30を徴募。`;}
  else if(type==='train'){if(p.gold<20)return '金が20必要です。';if(p.morale>=100)return '士気は既に最大です。';p.gold-=20;p.morale=Math.min(100,p.morale+15);msg=`${p.name}で調練。士気が上昇。`;}
  else return '不明な命令です。';
 }
 s.ap--;s.log.unshift(msg);if(owned(s).length===lands.length){s.ended='victory';s.log.unshift('天下統一！ 戦乱の世に、ついに太平が訪れた。');}return null;
}
export function nextSeason(s,random=Math.random){if(s.ended)return;s.season=(s.season+1)%4;if(!s.season)s.year++;s.ap=3;
 for(const p of s.provinces){p.gold+=Math.floor((25+p.farm/4)*(p.owner==='織田'?(s.tax||40)/40:1));if(p.owner==='織田'&&s.tax===60)p.morale=Math.max(20,p.morale-10);p.rice+=s.season===2?p.farm*2:15;p.rice-=Math.ceil(p.troops/8);if(p.rice<0){p.rice=0;p.troops=Math.max(5,p.troops-15);}}
 s.log.unshift(`${s.year}年 ${['春','夏','秋','冬'][s.season]}。税収を受領${s.season===2?'、秋の収穫を迎えた':''}。`);
 const enemies=s.provinces.map((p,i)=>({p,i})).filter(({p})=>p.owner!=='織田');
 for(const {p,i}of enemies){p.troops+=8;const target=lands[i][4].find(n=>s.provinces[n].owner==='織田'&&s.provinces[n].troops<p.troops*0.7);if(target!==undefined&&random()<0.35){const t=s.provinces[target];t.owner=p.owner;t.troops=Math.floor(p.troops/2);p.troops=Math.ceil(p.troops/2);s.log.unshift(`${p.owner}軍が${t.name}に侵攻。領地を失った！`);}}
 if(!owned(s).length){s.ended='defeat';s.log.unshift('織田家は滅亡した。再起を期し、新たな歴史を刻もう。');}
 s.log=s.log.slice(0,40);
}
export function validSave(s){return !!s&&s.version===1&&Number.isInteger(s.year)&&Number.isInteger(s.season)&&s.season>=0&&s.season<4&&Number.isInteger(s.ap)&&s.ap>=0&&s.ap<=3&&Number.isInteger(s.selected)&&s.selected>=0&&s.selected<lands.length&&[null,'victory','defeat'].includes(s.ended)&&Array.isArray(s.log)&&s.log.every(x=>typeof x==='string')&&Array.isArray(s.provinces)&&s.provinces.length===lands.length&&s.provinces.every((p,i)=>p.name===lands[i][0]&&typeof p.owner==='string'&&['gold','rice','troops','farm','morale'].every(k=>Number.isFinite(p[k])&&p[k]>=0));}
