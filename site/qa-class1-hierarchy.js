/* China QA - Class 1 / Class 2 hierarchy extension
   Locked mapping:
   - Quality source column "Class 1" -> Issue Category (Class 1)
   - Quality source column "Class 2" -> Issue Classification (Class 2)
   This layer does NOT change reconciliation, factory mapping, production denominators, or ratio formulas.
*/
(function(){
'use strict';

function ready(){
  return typeof window !== 'undefined' && typeof MultiPicker !== 'undefined' &&
    typeof PICKERS !== 'undefined' && typeof STATE !== 'undefined' &&
    typeof refreshOptions === 'function' && typeof renderPage === 'function';
}
if(!ready()){
  console.error('Class 1 hierarchy extension could not initialize: dashboard core is unavailable.');
  return;
}

/* ----------------------------- translations ----------------------------- */
const HIER_I18N={
  id:{
    'Issue Category':'Kategori Isu',
    'Issue Category (Class 1)':'Kategori Isu (Class 1)',
    'Issue Classification (Class 2)':'Klasifikasi Isu (Class 2)',
    'Issue Hierarchy Overview':'Ringkasan Hierarki Isu',
    'Class 1 category → Class 2 classification':'Kategori Class 1 → klasifikasi Class 2',
    'Issue Category Breakdown (Class 1)':'Breakdown Kategori Isu (Class 1)',
    'Category → Classification Hierarchy':'Hierarki Kategori → Klasifikasi',
    'Class 1 is the higher-level Issue Category. Class 2 remains the detailed Issue Classification.':'Class 1 adalah Kategori Isu level atas. Class 2 tetap menjadi Klasifikasi Isu yang lebih detail.',
    'OA counts can overlap because one OA may contain multiple categories or classifications.':'Jumlah OA dapat overlap karena satu OA dapat memiliki beberapa kategori atau klasifikasi.',
    'Qty Share':'Porsi Qty',
    'Qty Share within Category':'Porsi Qty dalam Kategori',
    'Class 1':'Class 1',
    'Class 2':'Class 2',
    'Quality Issue Source × Issue Category':'Sumber Isu Kualitas × Kategori Isu',
    'Quality Issue Source × Issue Classification (Class 2)':'Sumber Isu Kualitas × Klasifikasi Isu (Class 2)',
    'Quality Issue Ratio by Source × Issue Category':'Rasio Isu Kualitas per Sumber × Kategori Isu',
    'Quality Issue Ratio by Source × Issue Classification (Class 2)':'Rasio Isu Kualitas per Sumber × Klasifikasi Isu (Class 2)',
    'Three source views shown vertically. Stacks show which Issue Categories drive each period.':'Tiga sumber ditampilkan vertikal. Stack menunjukkan Kategori Isu yang mendorong setiap periode.',
    'Three source views shown vertically. Stacks show which Issue Classifications drive each period.':'Tiga sumber ditampilkan vertikal. Stack menunjukkan Klasifikasi Isu yang mendorong setiap periode.',
    'Category stacks are a drill view. One OA may contain more than one Issue Category, so stacked OA counts can overlap and may not equal the grand distinct OA total.':'Stack kategori adalah tampilan drill-down. Satu OA dapat memiliki lebih dari satu Kategori Isu, sehingga jumlah OA pada stack dapat overlap dan tidak harus sama dengan total OA unik.',
    'Classification stacks are a drill view. One OA may contain more than one Issue Classification, so stacked OA counts can overlap and may not equal the grand distinct OA total.':'Stack klasifikasi adalah tampilan drill-down. Satu OA dapat memiliki lebih dari satu Klasifikasi Isu, sehingga jumlah OA pada stack dapat overlap dan tidak harus sama dengan total OA unik.',
    'Stacked ratio-contribution view: categories share each source-period denominator, so the stack totals to that source ratio.':'Tampilan kontribusi rasio bertumpuk: kategori memakai denominator source-periode yang sama, sehingga total stack sama dengan rasio source.',
    'Stacked ratio-contribution view: classifications share each source-period denominator, so the stack totals to that source ratio.':'Tampilan kontribusi rasio bertumpuk: klasifikasi memakai denominator source-periode yang sama, sehingga total stack sama dengan rasio source.',
    'Stack = category contribution to each source-period ratio using the same source denominator. This avoids overlapping lines.':'Stack = kontribusi kategori terhadap rasio setiap source-periode dengan denominator source yang sama. Ini menghindari garis yang overlap.',
    'Stack = classification contribution to each source-period ratio using the same source denominator. This avoids overlapping lines.':'Stack = kontribusi klasifikasi terhadap rasio setiap source-periode dengan denominator source yang sama. Ini menghindari garis yang overlap.',
    'Stack = Issue Category contribution to the source ratio · shared source-period denominator':'Stack = kontribusi Kategori Isu terhadap rasio source · denominator source-periode yang sama',
    'Stack = Issue Classification contribution to the source ratio · shared source-period denominator':'Stack = kontribusi Klasifikasi Isu terhadap rasio source · denominator source-periode yang sama',
    'Issue hierarchy':'Hierarki isu',
    'Class 1 = Issue Category; Class 2 = Issue Classification.':'Class 1 = Kategori Isu; Class 2 = Klasifikasi Isu.'
  },
  zh:{
    'Issue Category':'问题类别',
    'Issue Category (Class 1)':'问题类别（Class 1）',
    'Issue Classification (Class 2)':'问题分类（Class 2）',
    'Issue Hierarchy Overview':'问题层级概览',
    'Class 1 category → Class 2 classification':'Class 1 类别 → Class 2 分类',
    'Issue Category Breakdown (Class 1)':'问题类别分布（Class 1）',
    'Category → Classification Hierarchy':'类别 → 分类层级',
    'Class 1 is the higher-level Issue Category. Class 2 remains the detailed Issue Classification.':'Class 1 是上层问题类别；Class 2 仍是更详细的问题分类。',
    'OA counts can overlap because one OA may contain multiple categories or classifications.':'由于一个 OA 可能包含多个类别或分类，OA 计数可能重叠。',
    'Qty Share':'数量占比',
    'Qty Share within Category':'类别内数量占比',
    'Class 1':'Class 1',
    'Class 2':'Class 2',
    'Quality Issue Source × Issue Category':'质量问题来源 × 问题类别',
    'Quality Issue Source × Issue Classification (Class 2)':'质量问题来源 × 问题分类（Class 2）',
    'Quality Issue Ratio by Source × Issue Category':'按来源 × 问题类别的质量问题比率',
    'Quality Issue Ratio by Source × Issue Classification (Class 2)':'按来源 × 问题分类（Class 2）的质量问题比率',
    'Three source views shown vertically. Stacks show which Issue Categories drive each period.':'三个问题来源纵向展示；堆叠显示各期间由哪些问题类别驱动。',
    'Three source views shown vertically. Stacks show which Issue Classifications drive each period.':'三个问题来源纵向展示；堆叠显示各期间由哪些问题分类驱动。',
    'Category stacks are a drill view. One OA may contain more than one Issue Category, so stacked OA counts can overlap and may not equal the grand distinct OA total.':'类别堆叠用于下钻分析。一个 OA 可能包含多个问题类别，因此堆叠中的 OA 数可能重叠，不一定等于总体唯一 OA 数。',
    'Classification stacks are a drill view. One OA may contain more than one Issue Classification, so stacked OA counts can overlap and may not equal the grand distinct OA total.':'分类堆叠用于下钻分析。一个 OA 可能包含多个问题分类，因此堆叠中的 OA 数可能重叠，不一定等于总体唯一 OA 数。',
    'Stacked ratio-contribution view: categories share each source-period denominator, so the stack totals to that source ratio.':'堆叠比率贡献视图：各类别共用 source-period 分母，因此堆叠总和等于该 source 比率。',
    'Stacked ratio-contribution view: classifications share each source-period denominator, so the stack totals to that source ratio.':'堆叠比率贡献视图：各分类共用 source-period 分母，因此堆叠总和等于该 source 比率。',
    'Stack = category contribution to each source-period ratio using the same source denominator. This avoids overlapping lines.':'Stack = 各类别对 source-period 比率的贡献，共用相同 source 分母，避免重叠折线。',
    'Stack = classification contribution to each source-period ratio using the same source denominator. This avoids overlapping lines.':'Stack = 各分类对 source-period 比率的贡献，共用相同 source 分母，避免重叠折线。',
    'Stack = Issue Category contribution to the source ratio · shared source-period denominator':'Stack = 问题类别对 source 比率的贡献 · 共用 source-period 分母',
    'Stack = Issue Classification contribution to the source ratio · shared source-period denominator':'Stack = 问题分类对 source 比率的贡献 · 共用 source-period 分母',
    'Issue hierarchy':'问题层级',
    'Class 1 = Issue Category; Class 2 = Issue Classification.':'Class 1 = 问题类别；Class 2 = 问题分类。'
  }
};
if(typeof I18N_V7!=='undefined'){
  Object.assign(I18N_V7.id,HIER_I18N.id);
  Object.assign(I18N_V7.zh,HIER_I18N.zh);
}
if(typeof V8_REVERSE!=='undefined' && typeof I18N_V7!=='undefined'){
  V8_REVERSE.id=Object.fromEntries(Object.entries(I18N_V7.id).map(([a,b])=>[b,a]));
  V8_REVERSE.zh=Object.fromEntries(Object.entries(I18N_V7.zh).map(([a,b])=>[b,a]));
}
if(typeof V7_BASE_PICKER_TITLES!=='undefined'){
  V7_BASE_PICKER_TITLES.category='Issue Category (Class 1)';
  V7_BASE_PICKER_TITLES.issue='Issue Classification (Class 2)';
}
const ht=s=>typeof trV8==='function'?trV8(s):(typeof trV7==='function'?trV7(s):s);

/* ----------------------------- data mapping ----------------------------- */
function issueCategory(r){return sourceName(r?.issue_category || r?.material || 'Unspecified')}
function hydrateIssueCategories(rows=ISSUES){for(const r of rows||[]){if(!String(r.issue_category||'').trim())r.issue_category=String(r.material||'').trim();}}
hydrateIssueCategories();

const normalizeIssueBase=normalizeIssueV3;
normalizeIssueV3=function(rows){let out=normalizeIssueBase(rows);hydrateIssueCategories(out);return out};

const reconcileV4BaseHierarchy=reconcileV4;
reconcileV4=function(){let out=reconcileV4BaseHierarchy();hydrateIssueCategories();return out};

/* ----------------------------- hierarchy filter ----------------------------- */
if(!PICKERS.has('category')){
  new MultiPicker('category','Issue Category (Class 1)',function(){
    syncIssueClassificationOptions();
    STATE.pageIndex={};
    applyV4();
  });
}
STATE.issueHierarchyLevel=STATE.issueHierarchyLevel==='class1'?'class1':'class2';

function categoryCatalog(rows){
  let m=new Map();
  for(const r of rows||[]){let k=issueCategory(r);if(!m.has(k))m.set(k,{value:k,label:k,search:k})}
  return [...m.values()].sort((a,b)=>a.label.localeCompare(b.label));
}
function syncIssueClassificationOptions(){
  let cp=PICKERS.get('category'), ip=PICKERS.get('issue'); if(!ip)return;
  let selectedCats=cp?.selected||new Set();
  let scope=!selectedCats.size?ISSUES:ISSUES.filter(r=>selectedCats.has(issueCategory(r)));
  ip.setOptions(catalog(scope,'issue_class'));
}
const refreshOptionsBaseHierarchy=refreshOptions;
refreshOptions=function(resetDates=false){
  hydrateIssueCategories();
  refreshOptionsBaseHierarchy(resetDates);
  let cp=PICKERS.get('category'); if(cp)cp.setOptions(categoryCatalog(ISSUES));
  syncIssueClassificationOptions();
};

const catScopeBaseHierarchy=catScope;
catScope=function(r){return catScopeBaseHierarchy(r)&&accepts('category',issueCategory(r))};

refreshChips=function(){
  let out=[];
  for(const id of ['work','dist','sku','category','issue','batchFilter']){
    let p=PICKERS.get(id);if(!p)continue;let vals=[...p.selected];
    for(const v of vals.slice(0,3)){let title=p.map.get(v)?.label||v;out.push(`<button class="filter-chip" data-clear-picker="${id}" data-value="${esc(v)}" title="${esc(title)}">${esc(p.title)}: ${esc(title.length>88?title.slice(0,85)+'…':title)}<b>×</b></button>`)}
    if(vals.length>3)out.push(`<button class="filter-chip" ${safeAction('clear-picker',id)}>+${vals.length-3} ${esc(p.title)} · clear all ×</button>`)
  }
  $('activeFilters').innerHTML=out.join('');
};

/* ----------------------------- dimension helpers ----------------------------- */
const dimValue=r=>STATE.issueHierarchyLevel==='class1'?issueCategory(r):sourceName(r.issue_class);
const dimPickerId=()=>STATE.issueHierarchyLevel==='class1'?'category':'issue';
const dimShort=()=>STATE.issueHierarchyLevel==='class1'?'Issue Category':'Issue Classification';
function dimRank(rows,metric='oa',limit=8){
  let arr=[...groupRowsV3(rows,r=>dimValue(r))].map(([name,rs])=>({name,value:metricForRowsV5(rs,metric),rows:rs})).sort((a,b)=>b.value-a.value);
  return arr.slice(0,limit);
}
function periodMetricDim(rows,period,name,grain,metric){return metricForRowsV5(rows.filter(r=>issuePeriodV5(r,grain)===period&&dimValue(r)===name),metric)}
function topBy(rows,keyFn,metric='qty'){
  return [...groupRowsV3(rows,keyFn)].map(([name,rs])=>({name,value:metricForRowsV5(rs,metric),rows:rs})).sort((a,b)=>b.value-a.value)[0]||null;
}
function metricTextV9(x,metric){if(!x)return'';return metric==='qty'?`${fmt(x.value,3)} ${V7_LANG==='zh'?'箱':V7_LANG==='id'?'karton':'cartons'}`:`${fmt(x.value)} OA`}

/* ----------------------------- overview hierarchy ----------------------------- */
function categoryRowsV9(rows){
  let total=v3sum(rows,'qty');
  return [...groupRowsV3(rows,r=>issueCategory(r))].map(([name,rs])=>({name,oa:v3oaCount(rs),qty:v3sum(rs,'qty'),share:total?v3sum(rs,'qty')/total:0,rows:rs})).sort((a,b)=>b.qty-a.qty);
}
function hierarchyRowsV9(rows){
  let cats=categoryRowsV9(rows),out=[];
  for(const cat of cats){
    let cg=[...groupRowsV3(cat.rows,r=>sourceName(r.issue_class))].map(([name,rs])=>({name,oa:v3oaCount(rs),qty:v3sum(rs,'qty')})).sort((a,b)=>b.qty-a.qty);
    for(const cls of cg)out.push({category:cat.name,classification:cls.name,oa:cls.oa,qty:cls.qty,share:cat.qty?cls.qty/cat.qty:0,catQty:cat.qty});
  }
  return out;
}
function renderHierarchyOverviewV9(rows){
  let chart=$('categoryChartV9'),catTable=$('categoryTableV9'),hier=$('hierarchyTableV9'); if(!chart||!catTable||!hier)return;
  let cats=categoryRowsV9(rows),detail=x=>`${fmt(x.oa)} ${ht('Distinct OA cases')}<br>${fmt(x.qty,4)} ${V7_LANG==='zh'?'箱':V7_LANG==='id'?'karton':'cartons'}`;
  barChart('categoryChartV9',cats,{value:'oa',detail,onSelect:x=>selectCategory('category',x.name)});
  catTable.innerHTML=table(['Issue Category (Class 1)','OA Cases','Issue Qty','Qty Share'],cats.map(x=>`<tr><td class="wide-cell"><button class="table-link" data-v9-category="${esc(x.name)}">${esc(x.name)}</button></td><td class="num">${fmt(x.oa)}</td><td class="num">${fmt(x.qty,3)}</td><td class="num">${fmt(x.share*100,1)}%</td></tr>`));
  let hr=hierarchyRowsV9(rows);
  hier.innerHTML=table(['Issue Category (Class 1)','Issue Classification (Class 2)','OA Cases','Issue Qty','Qty Share within Category'],hr.map(x=>`<tr><td class="wide-cell"><button class="table-link" data-v9-category="${esc(x.category)}">${esc(x.category)}</button></td><td class="wide-cell"><button class="table-link" data-v9-classification="${esc(x.classification)}" data-v9-parent-category="${esc(x.category)}">${esc(x.classification)}</button></td><td class="num">${fmt(x.oa)}</td><td class="num">${fmt(x.qty,3)}</td><td class="num">${fmt(x.share*100,1)}%</td></tr>`));
}

/* ----------------------------- source stacks ----------------------------- */
renderSourceStacksV5=function(rows){
  let grid=$('sourceStackGrid');if(!grid)return;let sources=sourceRowsV6(rows),grain=STATE.grain,metric=STATE.stackMetric,labels=periodSequenceV5(grain);
  grid.innerHTML=sources.map((src,i)=>`<div class="source-row-card"><div class="source-chart-wrap"><div class="source-row-title"><div><h3>${esc(src.name)}</h3><div class="source-summary">${fmt(v3oaCount(src.rows))} ${V7_LANG==='zh'?'个唯一OA':V7_LANG==='id'?'OA unik':'distinct OA'} · ${fmt(v3sum(src.rows,'qty'),3)} ${V7_LANG==='zh'?'箱':V7_LANG==='id'?'karton':'cartons'}</div></div></div><div id="sourceStack${i}" class="chart"></div></div>${sourceInsightV6(src,labels,metric)}</div>`).join('')||'<div class="empty">No Quality Issue Source in this selection.</div>';
  sources.forEach((src,i)=>{
    let top=dimRank(src.rows,metric,6).map(x=>x.name),topSet=new Set(top),series=top.map(name=>({name,values:labels.map(period=>periodMetricDim(src.rows,period,name,grain,metric))}));
    let other=src.rows.filter(r=>!topSet.has(dimValue(r)));if(other.length)series.push({name:'Other',values:labels.map(period=>metricForRowsV5(other.filter(r=>issuePeriodV5(r,grain)===period),metric))});
    stackedChartV5('sourceStack'+i,labels,series,{format:metric==='qty'?v=>fmt(v,3)+' cartons':v=>fmt(v)+' OA',onSelect:name=>name!=='Other'&&selectCategory(dimPickerId(),name)});
  });
};

/* ----------------------------- hierarchy-aware AI/read ----------------------------- */
sourceInsightV6=function(src,labels,metric){
  let totals=labels.map(p=>metricForRowsV5(src.rows.filter(r=>issuePeriodV5(r,STATE.grain)===p),metric)),active=totals.map((v,i)=>({v,i})).filter(x=>x.v>0),last=active.at(-1),prev=active.length>1?active.at(-2):null,latestPeriod=last?labels[last.i]:'N/A',latestRows=last?src.rows.filter(r=>issuePeriodV5(r,STATE.grain)===latestPeriod):[];
  let catLatest=topBy(latestRows,r=>issueCategory(r),metric),catAll=topBy(src.rows,r=>issueCategory(r),metric),clsLatest=catLatest?topBy(catLatest.rows,r=>sourceName(r.issue_class),metric):null;
  let dimNames=dimRank(src.rows,metric,8).map(x=>x.name),risers=[];
  if(last&&prev){for(const name of dimNames){let c=periodMetricDim(src.rows,labels[last.i],name,STATE.grain,metric),p=periodMetricDim(src.rows,labels[prev.i],name,STATE.grain,metric),d=pctDeltaV6(c,p);if(d!=null)risers.push({name,c,p,d})}risers.sort((a,b)=>b.d-a.d)}
  let riser=risers[0],sourceDelta=last&&prev?pctDeltaV6(last.v,prev.v):null,data,watch;
  let catVal=metricTextV9(catLatest,metric),clsVal=metricTextV9(clsLatest,metric);
  if(V7_LANG==='id'){
    data=`${latestPeriod}: ${catLatest?`Kategori Isu terbesar adalah ${esc(catLatest.name)} (${catVal})${clsLatest?`, terutama didorong oleh ${esc(clsLatest.name)} (${clsVal})`:''}`:'tidak ada kategori isu'}. Kategori historis utama: ${catAll?esc(catAll.name):'N/A'}.`;
    if(riser&&riser.d>.25&&riser.c>0)watch=`${esc(riser.name)} meningkat ${fmt(riser.d*100,1)}% dibanding periode aktif sebelumnya pada level ${STATE.issueHierarchyLevel==='class1'?'Class 1':'Class 2'}. ${sourceDelta!=null?`Total source ${sourceDelta>0?'juga meningkat':'bergerak'} ${fmt(Math.abs(sourceDelta)*100,1)}%.`:''}`;else if(sourceDelta!=null&&sourceDelta<-.2)watch=`Secara keseluruhan ${esc(src.name)} membaik ${fmt(Math.abs(sourceDelta)*100,1)}% dibanding periode aktif sebelumnya. Tetap monitor potensi recurrence.`;else watch=`Tidak ada ${STATE.issueHierarchyLevel==='class1'?'kategori':'klasifikasi'} yang menunjukkan lonjakan material >25% secara period-on-period pada filter saat ini.`;
  }else if(V7_LANG==='zh'){
    data=`${latestPeriod}：${catLatest?`最大问题类别为 ${esc(catLatest.name)}（${catVal}）${clsLatest?`，主要由 ${esc(clsLatest.name)}（${clsVal}）驱动`:''}`:'没有问题类别'}。历史主要类别：${catAll?esc(catAll.name):'N/A'}。`;
    if(riser&&riser.d>.25&&riser.c>0)watch=`${esc(riser.name)} 在 ${STATE.issueHierarchyLevel==='class1'?'Class 1':'Class 2'} 层级较上一活跃期间上升 ${fmt(riser.d*100,1)}%。${sourceDelta!=null?`Source 总量${sourceDelta>0?'也上升':'变化'} ${fmt(Math.abs(sourceDelta)*100,1)}%。`:''}`;else if(sourceDelta!=null&&sourceDelta<-.2)watch=`整体 ${esc(src.name)} 较上一活跃期间改善 ${fmt(Math.abs(sourceDelta)*100,1)}%。仍需关注是否再次发生。`;else watch=`当前筛选下，没有${STATE.issueHierarchyLevel==='class1'?'类别':'分类'}出现 >25% 的显著 period-on-period 上升。`;
  }else{
    data=`${latestPeriod}: ${catLatest?`${esc(catLatest.name)} is the largest Issue Category (${catVal})${clsLatest?`, driven by ${esc(clsLatest.name)} (${clsVal})`:''}`:'no Issue Category is available'}. Historical leading category: ${catAll?esc(catAll.name):'N/A'}.`;
    if(riser&&riser.d>.25&&riser.c>0)watch=`${esc(riser.name)} increased ${fmt(riser.d*100,1)}% versus the prior active period at the ${STATE.issueHierarchyLevel==='class1'?'Class 1':'Class 2'} level. ${sourceDelta!=null?`Total source ${sourceDelta>0?'also increased':'moved'} ${fmt(Math.abs(sourceDelta)*100,1)}%.`:''}`;else if(sourceDelta!=null&&sourceDelta<-.2)watch=`Overall ${esc(src.name)} improved ${fmt(Math.abs(sourceDelta)*100,1)}% versus the prior active period. Keep monitoring for recurrence.`;else watch=`No ${STATE.issueHierarchyLevel==='class1'?'category':'classification'} shows a material >25% period-on-period spike in the current filtered view.`;
  }
  let targetClass=clsLatest?.name||'';if(riser&&STATE.issueHierarchyLevel==='class2'&&riser.d>.25)targetClass=riser.name;else if(riser&&STATE.issueHierarchyLevel==='class1'&&riser.d>.25){let rr=latestRows.filter(r=>issueCategory(r)===riser.name),tc=topBy(rr,r=>sourceName(r.issue_class),metric);if(tc)targetClass=tc.name}
  return `<div class="insight-card"><h4><span class="ai-badge">AI READ</span> ${ht('Trend interpretation')}</h4><div class="insight-block"><div class="insight-label">${ht('Data Read')}</div><div class="insight-text">${data}</div></div><div class="insight-block watchout"><div class="insight-label">${ht('Watch Out')}</div><div class="insight-text">${watch}</div></div><div class="insight-block suggestion"><div class="insight-label">${ht('Suggested Review')}</div><div class="insight-text">${esc(actionSuggestionV6(targetClass))}</div></div></div>`;
};

ratioInsightV6=function(src,labels){
  let vals=labels.map(p=>aggregateRatio(src.rows.filter(r=>prodPeriodV5(r,STATE.ratioGrain)===p)).rate),active=vals.map((v,i)=>({v,i})).filter(x=>x.v!=null),last=active.at(-1),prev=active.length>1?active.at(-2):null,d=last&&prev?pctDeltaV6(last.v,prev.v):null,period=last?labels[last.i]:'N/A',ready=src.rows.filter(r=>r.readiness==='READY');
  let topCat=topBy(ready,r=>issueCategory(r),'qty'),topCls=topCat?topBy(topCat.rows,r=>sourceName(r.issue_class),'qty'):null,watch,driver;
  if(V7_LANG==='id'){watch=d!=null&&d>.25?`Rasio ${src.name} meningkat ${fmt(d*100,1)}% dibanding periode aktif sebelumnya.`:d!=null&&d<-.2?`Rasio ${src.name} membaik ${fmt(Math.abs(d)*100,1)}% dibanding periode aktif sebelumnya.`:'Rasio relatif stabil dibanding periode aktif sebelumnya pada pilihan saat ini.';driver=topCat?`${esc(topCat.name)} adalah Kategori Isu dengan Matched Issue Qty terbesar${topCls?`, terutama didorong oleh ${esc(topCls.name)}`:''}.`:'Tidak tersedia kategori matched.';}
  else if(V7_LANG==='zh'){watch=d!=null&&d>.25?`${src.name} 比率较上一活跃期间上升 ${fmt(d*100,1)}%。`:d!=null&&d<-.2?`${src.name} 比率较上一活跃期间改善 ${fmt(Math.abs(d)*100,1)}%。`:'当前筛选下，比率相较上一活跃期间较为稳定。';driver=topCat?`${esc(topCat.name)} 是 Matched Issue Qty 最大的问题类别${topCls?`，主要由 ${esc(topCls.name)} 驱动`:''}。`:'当前没有可用的 matched 类别。';}
  else{watch=d!=null&&d>.25?`${src.name} ratio increased ${fmt(d*100,1)}% versus the prior active period.`:d!=null&&d<-.2?`${src.name} ratio improved ${fmt(Math.abs(d)*100,1)}% versus the prior active period.`:'Ratio is relatively stable versus the prior active period in the current selection.';driver=topCat?`${esc(topCat.name)} is the largest matched Issue Category${topCls?`, driven by ${esc(topCls.name)}`:''}.`:'No matched Issue Category is available.';}
  return `<div class="insight-card"><h4><span class="ai-badge">RATIO READ</span> ${esc(src.name)}</h4><div class="insight-block"><div class="insight-label">${ht('Latest')}</div><div class="insight-text">${esc(period)}: ${last?ratioText(last.v):'N/A'}.</div></div><div class="insight-block watchout"><div class="insight-label">${ht('Watch Out')}</div><div class="insight-text">${watch}</div></div><div class="insight-block suggestion"><div class="insight-label">${ht('Primary Driver')}</div><div class="insight-text">${driver}</div></div></div>`;
};

/* ----------------------------- ratio contribution stacks ----------------------------- */
renderRatioContributionGridV6=function(containerId,rows){
  let grid=$(containerId);if(!grid)return;let sources=sourceRowsV6(rows),labels=periodSequenceV5(STATE.ratioGrain),summary=STATE.issueHierarchyLevel==='class1'?'Stack = Issue Category contribution to the source ratio · shared source-period denominator':'Stack = Issue Classification contribution to the source ratio · shared source-period denominator';
  grid.innerHTML=sources.map((src,i)=>`<div class="source-row-card"><div class="source-chart-wrap"><div class="source-row-title"><div><h3>${esc(src.name)}</h3><div class="source-summary">${ht(summary)}</div></div></div><div id="${containerId}Chart${i}" class="chart"></div></div>${ratioInsightV6(src,labels)}</div>`).join('')||'<div class="empty">No production-dated Quality Issue Source in this selection.</div>';
  sources.forEach((src,i)=>{
    let ready=src.rows.filter(r=>r.readiness==='READY'),top=dimRank(ready,'qty',6).map(x=>x.name),topSet=new Set(top),series=top.map(name=>({name,values:labels.map(p=>{let prs=src.rows.filter(r=>prodPeriodV5(r,STATE.ratioGrain)===p),den=aggregateRatio(prs).production_qty,qty=v3sum(prs.filter(r=>r.readiness==='READY'&&dimValue(r)===name),'qty');return den?qty/den*100:0})}));
    if(ready.some(r=>!topSet.has(dimValue(r))))series.push({name:'Other',values:labels.map(p=>{let prs=src.rows.filter(r=>prodPeriodV5(r,STATE.ratioGrain)===p),den=aggregateRatio(prs).production_qty,qty=v3sum(prs.filter(r=>r.readiness==='READY'&&!topSet.has(dimValue(r))),'qty');return den?qty/den*100:0})});
    stackedChartV5(containerId+'Chart'+i,labels,series,{format:v=>fmt(v,5)+'%',totalLabel:'Source ratio',onSelect:name=>name!=='Other'&&selectCategory(dimPickerId(),name)});
  });
};

/* ----------------------------- row detail / audit ----------------------------- */
let claimClassIndex=CLAIM_HEADERS.indexOf('Issue Classification');
if(claimClassIndex<0)claimClassIndex=CLAIM_HEADERS.findIndex(x=>String(x).includes('Issue Classification'));
if(claimClassIndex>=0){
  CLAIM_HEADERS[claimClassIndex]='Issue Classification (Class 2)';
  if(!CLAIM_HEADERS.includes('Issue Category (Class 1)'))CLAIM_HEADERS.splice(claimClassIndex,0,'Issue Category (Class 1)');
}
claimRowHTML=function(r){let unpaid=r.claim!=null&&r.paid!=null?r.claim-r.paid:null;return `<tr><td class="oa-cell">${link(r.oa_code||'Missing OA','oa',r.oa_code)}</td><td>${esc(prettyDate(r.event_date))}</td><td>${esc(r.work_order)}</td><td class="sku-cell">${esc(skuLabel(r))}</td><td class="batch-cell">${r.recon_key?link(batchLabel(r),'batch',r.recon_key):`<span class="pill amber">Unresolved</span><small>${esc(r.batch_original)}</small>`}</td><td>${esc(factoryName(r.resolved_plant))}</td><td class="wide-cell">${esc(issueCategory(r))}</td><td class="wide-cell">${esc(r.issue_class)}</td><td class="num">${fmt(r.qty,4)}</td><td class="num">${moneyCell(r.claim)}</td><td class="num">${moneyCell(r.paid)}</td><td class="num">${moneyCell(unpaid)}</td><td class="num">${paymentText(paymentRatio(r))}</td><td>${esc(r.evidence_status)}</td></tr>`};

auditRows=function(){let q=readVal('reconSearch').trim().toLowerCase();return occurrenceRows().filter(r=>accepts('reconStatus',r.match_status)&&(!q||[r.oa_code,skuLabel(r),issueCategory(r),r.issue_class,r.batch_original,r.scm_batches,r.recon_key,factoryName(r.resolved_plant),r.resolved_plant,r.dq_flags].join(' ').toLowerCase().includes(q)))};
renderAudit=function(){
  let scope=occurrenceRows(),rows=auditRows(),counts=[...groupRowsV3(scope,'match_status')].sort((a,b)=>b[1].length-a[1].length);
  $('auditScopeText').textContent=`${fmt(scope.length)} Quality records under the active filters · ${fmt(scope.filter(r=>r.readiness==='READY').length)} READY. Period based on Quality Issue Date.`;
  $('reconStatusTable').innerHTML=table(['Match Status','Records','Readiness','Meaning'],counts.map(([status,rs])=>`<tr data-click="status" data-value="${esc(status)}"><td>${link(status,'status',status)}</td><td class="num">${fmt(rs.length)}</td><td><span class="pill ${rs[0].readiness==='READY'?'green':'amber'}">${rs[0].readiness}</span></td><td class="wide-cell">${esc(STATUS_MEANING[status]||'')}</td></tr>`));
  $('auditRules').innerHTML=[['Decode actual production date','A valid trailing production day overrides the weekly/reference date. Cross-month dates are resolved around the reference week.'],['Match SKU, date, plant and shift','Explicit shift → same shift. Coding plant without explicit shift → all valid shifts. No code → infer only a unique SCM plant.'],['Separate coding tokens from display names','Factory mapping used from decoding through reconciliation: SMD → K103; RCK → K104; MJL → K118. K103/K104/K118 are retained internally; SMD/RCK/MJL are shown to users. Other alphabetic tokens such as SOR are treated as non-factory/machine codes unless SCM uniquely resolves the plant.'],['Count production once','The underlying SCM records are de-duplicated across OA cases and across overlapping single-shift / all-shift selections.'],['Keep unresolved records visible','Unresolved rows stay in occurrence reporting and audit. They are excluded from production ratio numerators and denominators.']].map(([title,body])=>`<div class="rule"><b>${title}</b>${body}</div>`).join('');
  $('reconShown').textContent=`${fmt(rows.length)} matching rows`;
  $('reconTable').innerHTML=table(['Row','OA Code','Issue Date','SKU','Issue Category (Class 1)','Issue Classification (Class 2)','Quality Batch Raw','Reference Date','Actual Production Date','Coding Token','Factory','Internal Plant','Shift Scope','Match Status','Readiness','SCM Batch','Production Qty','Issue Qty','Unresolved Reason','Reconstructed Batch'],paginate('recon',rows,80).map(r=>`<tr><td>${r.row_sequence}</td><td class="oa-cell">${link(r.oa_code,'oa',r.oa_code)}</td><td>${esc(r.event_date)}</td><td>${esc(r.sku)}</td><td class="wide-cell">${esc(issueCategory(r))}</td><td class="wide-cell">${esc(r.issue_class)}</td><td class="wide-cell">${esc(r.batch_original)}</td><td>${esc(r.weekly_code_date)}</td><td>${esc(r.production_date||'Unavailable')}</td><td>${esc(r.coding_token)}</td><td>${esc(factoryName(r.resolved_plant))}</td><td>${esc(r.resolved_plant)}</td><td>${r.shift_decoded?'Shift '+esc(r.shift_decoded):'All shifts'}</td><td>${esc(r.match_status)}</td><td><span class="pill ${r.readiness==='READY'?'green':'amber'}">${esc(r.readiness)}</span></td><td>${esc(r.scm_batches)}</td><td class="num">${r.production_qty?fmt(r.production_qty,3):'N/A'}</td><td class="num">${fmt(r.qty,4)}</td><td class="wide-cell">${esc(r.dq_flags)}</td><td class="batch-cell">${r.recon_key?link(batchLabel(r),'batch',r.recon_key):'Unresolved'}</td></tr>`));
};

/* ----------------------------- exports ----------------------------- */
const issueExportRowBaseHierarchy=issueExportRow;
issueExportRow=function(r){
  let base=issueExportRowBaseHierarchy(r),out={};
  for(const [k,v] of Object.entries(base)){
    if(k==='Issue Classification'){
      out['Issue Category (Class 1)']=issueCategory(r);
      out['Issue Classification (Class 2)']=r.issue_class;
    }else out[k]=v;
  }
  if(!Object.prototype.hasOwnProperty.call(out,'Issue Category (Class 1)')){out['Issue Category (Class 1)']=issueCategory(r);out['Issue Classification (Class 2)']=r.issue_class}
  return out;
};

const filterExportBaseHierarchy=filterExport;
filterExport=function(){let out=filterExportBaseHierarchy(),p=PICKERS.get('category');if(p){let val=[...p.selected].map(v=>p.map.get(v)?.label||v).join('; ')||'All',idx=out.findIndex(x=>String(x.Setting).includes('Issue Classification'));out.splice(idx>=0?idx:out.length,0,{Setting:p.title,Value:val})}out.push({Setting:ht('Issue hierarchy'),Value:ht('Class 1 = Issue Category; Class 2 = Issue Classification.')});return out};

const sheetsForPageBaseHierarchy=sheetsForPage;
sheetsForPage=function(page=STATE.page){
  let sh=sheetsForPageBaseHierarchy(page),rows=page==='batch'?productionRows(true):page==='distributor'?claimRows():page==='reconciliation'?auditRows():occurrenceRows();
  if(page==='overview'){
    sh.Issue_Category=categoryRowsV9(rows).map(x=>({'Issue Category (Class 1)':x.name,'OA Cases':x.oa,'Issue Qty Carton':x.qty,'Qty Share':x.share}));
    sh.Category_Classification=hierarchyRowsV9(rows).map(x=>({'Issue Category (Class 1)':x.category,'Issue Classification (Class 2)':x.classification,'OA Cases':x.oa,'Issue Qty Carton':x.qty,'Qty Share within Category':x.share}));
    sh.Source_Category_Trend=[];sh.Source_Classification_Trend=[];
    for(const src of sourceRowsV6(rows))for(const p of periodSequenceV5(STATE.grain)){
      let prs=src.rows.filter(r=>issuePeriodV5(r,STATE.grain)===p);if(!prs.length)continue;
      for(const [cat,crs] of groupRowsV3(prs,r=>issueCategory(r)))sh.Source_Category_Trend.push({Period:p,'Quality Issue Source':src.name,'Issue Category (Class 1)':cat,'OA Cases':v3oaCount(crs),'Issue Qty':v3sum(crs,'qty')});
      for(const [pair,crs] of groupRowsV3(prs,r=>issueCategory(r)+'\u0001'+sourceName(r.issue_class))){let [cat,cls]=pair.split('\u0001');sh.Source_Classification_Trend.push({Period:p,'Quality Issue Source':src.name,'Issue Category (Class 1)':cat,'Issue Classification (Class 2)':cls,'OA Cases':v3oaCount(crs),'Issue Qty':v3sum(crs,'qty')})}
    }
  }
  if(page==='overview'||page==='batch'){
    let prod=productionRows(true,page==='batch'),labels=periodSequenceV5(STATE.ratioGrain);sh.Source_Category_Ratio_Contribution=[];sh.Source_Ratio_Contribution_Trend=[];
    for(const src of sourceRowsV6(prod))for(const p of labels){let prs=src.rows.filter(r=>prodPeriodV5(r,STATE.ratioGrain)===p),a=aggregateRatio(prs);if(!a.rows.length||!(a.production_qty>0))continue;
      for(const [cat,rs] of groupRowsV3(prs.filter(r=>r.readiness==='READY'),r=>issueCategory(r)))sh.Source_Category_Ratio_Contribution.push({Period:p,'Quality Issue Source':src.name,'Issue Category (Class 1)':cat,'Matched Issue Qty':v3sum(rs,'qty'),'Shared Source Production Qty':a.production_qty,'Ratio Contribution':v3sum(rs,'qty')/a.production_qty});
      for(const [pair,rs] of groupRowsV3(prs.filter(r=>r.readiness==='READY'),r=>issueCategory(r)+'\u0001'+sourceName(r.issue_class))){let [cat,cls]=pair.split('\u0001');sh.Source_Ratio_Contribution_Trend.push({Period:p,'Quality Issue Source':src.name,'Issue Category (Class 1)':cat,'Issue Classification (Class 2)':cls,'Matched Issue Qty':v3sum(rs,'qty'),'Shared Source Production Qty':a.production_qty,'Ratio Contribution':v3sum(rs,'qty')/a.production_qty})}
    }
  }
  return sh;
};

/* ----------------------------- upload template guidance ----------------------------- */
if(typeof qualityInstructionsV7==='function'){
  const qualityInstructionsBaseHierarchy=qualityInstructionsV7;
  qualityInstructionsV7=function(){let rows=qualityInstructionsBaseHierarchy(),ix=rows.findIndex(x=>x.Field==='Class 2');if(ix>=0){rows[ix]={Field:'Class 2',Use:'Issue Classification (Class 2)',Notes:'Detailed issue classification under Class 1. Keep the current master wording.'};rows.splice(ix,0,{Field:'Class 1',Use:'Issue Category (Class 1)',Notes:'Higher-level parent category for Class 2. Keep the current master wording.'})}return rows};
}

/* ----------------------------- UI sync ----------------------------- */
function syncDimensionUI(){
  let class1=STATE.issueHierarchyLevel==='class1';
  document.querySelectorAll('[data-issue-dim]').forEach(b=>b.classList.toggle('active',b.dataset.issueDim===STATE.issueHierarchyLevel));
  let sourceTitle=$('sourceDimensionTitleV9'),sourceDesc=$('sourceDimensionDescV9'),note=$('hierarchyStackNoteV9'),eTitle=$('execRatioDimensionTitleV9'),eDesc=$('execRatioDimensionDescV9'),bTitle=$('batchRatioDimensionTitleV9'),bDesc=$('batchRatioDimensionDescV9');
  if(sourceTitle)sourceTitle.textContent=ht(class1?'Quality Issue Source × Issue Category':'Quality Issue Source × Issue Classification (Class 2)');
  if(sourceDesc)sourceDesc.textContent=ht(class1?'Three source views shown vertically. Stacks show which Issue Categories drive each period.':'Three source views shown vertically. Stacks show which Issue Classifications drive each period.');
  if(note)note.textContent=ht(class1?'Category stacks are a drill view. One OA may contain more than one Issue Category, so stacked OA counts can overlap and may not equal the grand distinct OA total.':'Classification stacks are a drill view. One OA may contain more than one Issue Classification, so stacked OA counts can overlap and may not equal the grand distinct OA total.');
  if(eTitle)eTitle.textContent=ht(class1?'Quality Issue Ratio by Source × Issue Category':'Quality Issue Ratio by Source × Issue Classification (Class 2)');
  if(eDesc)eDesc.textContent=ht(class1?'Stacked ratio-contribution view: categories share each source-period denominator, so the stack totals to that source ratio.':'Stacked ratio-contribution view: classifications share each source-period denominator, so the stack totals to that source ratio.');
  if(bTitle)bTitle.textContent=ht(class1?'Quality Issue Ratio by Source × Issue Category':'Quality Issue Ratio by Source × Issue Classification (Class 2)');
  if(bDesc)bDesc.textContent=ht(class1?'Stack = category contribution to each source-period ratio using the same source denominator. This avoids overlapping lines.':'Stack = classification contribution to each source-period ratio using the same source denominator. This avoids overlapping lines.');
}
function syncHierarchyStaticText(){
  let pairs=[['issueHierarchyTitleV9','Issue Hierarchy Overview'],['issueHierarchyDescV9','Class 1 category → Class 2 classification'],['categoryBreakdownTitleV9','Issue Category Breakdown (Class 1)'],['hierarchyTableTitleV9','Category → Classification Hierarchy'],['hierarchyDefinitionV9','Class 1 is the higher-level Issue Category. Class 2 remains the detailed Issue Classification.'],['hierarchyOverlapV9','OA counts can overlap because one OA may contain multiple categories or classifications.']];
  for(const [id,key] of pairs){let e=$(id);if(e)e.textContent=ht(key)}
  let catLabel=$('category-label');if(catLabel)catLabel.textContent=ht('Issue Category (Class 1)');let issueLabel=$('issue-label');if(issueLabel)issueLabel.textContent=ht('Issue Classification (Class 2)');
  syncDimensionUI();
}

document.querySelectorAll('[data-issue-dim]').forEach(b=>b.addEventListener('click',()=>{STATE.issueHierarchyLevel=b.dataset.issueDim==='class1'?'class1':'class2';syncDimensionUI();renderPage()}));
document.addEventListener('click',e=>{
  let c=e.target.closest('[data-v9-category]');if(c){selectCategory('category',c.dataset.v9Category);return}
  let cl=e.target.closest('[data-v9-classification]');if(cl){let cp=PICKERS.get('category'),cat=cl.dataset.v9ParentCategory;if(cp&&cat)cp.set([cat]);syncIssueClassificationOptions();selectCategory('issue',cl.dataset.v9Classification)}
});

const renderOverviewBaseHierarchy=renderOverview;
renderOverview=function(){let r=renderOverviewBaseHierarchy();renderHierarchyOverviewV9(occurrenceRows());syncDimensionUI();return r};
const renderRateBaseHierarchy=renderRate;
renderRate=function(){let r=renderRateBaseHierarchy();syncDimensionUI();return r};

if(typeof setLanguageV7==='function'){
  const setLanguageBaseHierarchy=setLanguageV7;
  setLanguageV7=function(lang){let r=setLanguageBaseHierarchy(lang);syncHierarchyStaticText();if(STATE.page==='overview')renderHierarchyOverviewV9(occurrenceRows());return r};
}

/* Ensure any current LIVE rows receive the alias without a Supabase migration. */
hydrateIssueCategories();
refreshOptions(false);
syncHierarchyStaticText();
if(typeof translateUIV8==='function')translateUIV8();
applyV4();
console.info('China QA Class 1 hierarchy extension loaded. Class 1=Issue Category; Class 2=Issue Classification.');
})();
