/* China QA Production bridge: GitHub Pages + Supabase.
   Keeps the validated V8 dashboard/reconciliation engine in the browser.
   Admin uploads one full Excel/CSV file; this bridge chunks normalized rows automatically. */
(function(){
'use strict';
const MODE=window.QA_APP_MODE||'viewer', CFG=window.QA_APP_CONFIG||{};
const configured=()=>/^https:\/\/.+\.supabase\.co\/?$/.test(CFG.supabaseUrl||'') && /^(sb_publishable_|eyJ)/.test(CFG.supabasePublishableKey||'');
let sb=null, session=null, liveVersion=null;
let recoveryIntent=(()=>{try{const h=new URLSearchParams((location.hash||'').replace(/^#/,'')),q=new URLSearchParams(location.search||'');return h.get('type')==='recovery'||q.get('type')==='recovery'}catch(_){return false}})();
const $q=s=>document.querySelector(s), escP=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
const lang=()=>typeof V7_LANG!=='undefined'?V7_LANG:'en';
const TXT={
 en:{login:'Sign in to China QA Control Tower',email:'Company email',password:'Password',signin:'Sign in',logout:'Sign out',loading:'Loading published QA data…',noLive:'No published version exists yet. Admin must publish the first version.',adminOnly:'This account is not an administrator.',localStage:'ADMIN STAGING — uploads and reconciliation are local until you click Publish.',publish:'Publish Current Dataset',history:'Refresh Version History',live:'Load LIVE Version',publishing:'Publishing new version…',published:'Published successfully.',failed:'Publish failed',confirm:'Publish the current Quality + SCM + Evidence snapshot as the new LIVE version?',rollback:'Rollback / publish this historical version?',current:'Current working data',quality:'Quality rows',prod:'SCM rows',evidence:'Evidence',ready:'READY',unresolved:'Unresolved',version:'Data Version',last:'Last Published',recon:'Reconciliation',status:'Status',role:'Mode',viewer:'VIEW',admin:'ADMIN',resetTitle:'Set a new password',resetIntro:'Your recovery link is valid. Enter a new password for this account.',newPassword:'New password',confirmPassword:'Confirm new password',updatePassword:'Update password',cancelReset:'Cancel and sign out',passwordMismatch:'Passwords do not match.',passwordShort:'Password must be at least 6 characters.',passwordUpdated:'Password updated successfully. Returning to sign in…'},
 id:{login:'Masuk ke China QA Control Tower',email:'Email perusahaan',password:'Password',signin:'Masuk',logout:'Keluar',loading:'Memuat data QA yang sudah dipublish…',noLive:'Belum ada versi yang dipublish. Admin perlu publish versi pertama.',adminOnly:'Akun ini bukan administrator.',localStage:'ADMIN STAGING — upload dan rekonsiliasi masih lokal sampai tombol Publish ditekan.',publish:'Publish Dataset Saat Ini',history:'Refresh Riwayat Versi',live:'Muat Versi LIVE',publishing:'Mempublish versi baru…',published:'Berhasil dipublish.',failed:'Publish gagal',confirm:'Publish snapshot Quality + SCM + Evidence saat ini menjadi versi LIVE baru?',rollback:'Rollback / publish versi historis ini?',current:'Data kerja saat ini',quality:'Baris Quality',prod:'Baris SCM',evidence:'Evidence',ready:'READY',unresolved:'Unresolved',version:'Versi Data',last:'Terakhir Publish',recon:'Rekonsiliasi',status:'Status',role:'Mode',viewer:'VIEW',admin:'ADMIN',resetTitle:'Buat password baru',resetIntro:'Link recovery valid. Masukkan password baru untuk akun ini.',newPassword:'Password baru',confirmPassword:'Konfirmasi password baru',updatePassword:'Simpan password baru',cancelReset:'Batal dan keluar',passwordMismatch:'Password tidak sama.',passwordShort:'Password minimal 6 karakter.',passwordUpdated:'Password berhasil diperbarui. Kembali ke halaman login…'},
 zh:{login:'登录 China QA Control Tower',email:'公司邮箱',password:'密码',signin:'登录',logout:'退出',loading:'正在加载已发布的QA数据…',noLive:'尚无已发布版本。管理员需要先发布第一个版本。',adminOnly:'此账号不是管理员。',localStage:'管理员暂存模式 — 上传和对账仅保存在本地，点击 Publish 后才会上线。',publish:'发布当前数据集',history:'刷新版本历史',live:'加载 LIVE 版本',publishing:'正在发布新版本…',published:'发布成功。',failed:'发布失败',confirm:'将当前 Quality + SCM + Evidence 快照发布为新的 LIVE 版本？',rollback:'回滚/发布此历史版本？',current:'当前工作数据',quality:'Quality 行数',prod:'SCM 行数',evidence:'Evidence',ready:'READY',unresolved:'未解决',version:'数据版本',last:'最后发布',recon:'对账',status:'状态',role:'模式',viewer:'查看',admin:'管理员',resetTitle:'设置新密码',resetIntro:'恢复链接有效。请输入此账号的新密码。',newPassword:'新密码',confirmPassword:'确认新密码',updatePassword:'更新密码',cancelReset:'取消并退出',passwordMismatch:'两次输入的密码不一致。',passwordShort:'密码至少需要6个字符。',passwordUpdated:'密码更新成功。正在返回登录页面…'}
};
const t=k=>(TXT[lang()]||TXT.en)[k]||TXT.en[k]||k;
function addAuthGate(msg=''){
 let e=$q('#qaAuthGate'); if(e)return e;
 e=document.createElement('div');e.id='qaAuthGate';e.className='qa-auth-gate';e.innerHTML=`<div class="qa-auth-card"><h2>${escP(t('login'))}</h2><p>Supabase authentication · ${MODE==='admin'?'Admin':'Viewer'} Mode</p><input id="qaLoginEmail" type="email" autocomplete="username" placeholder="${escP(t('email'))}"><input id="qaLoginPassword" type="password" autocomplete="current-password" placeholder="${escP(t('password'))}"><button class="btn" id="qaLoginBtn">${escP(t('signin'))}</button><div class="qa-auth-msg" id="qaAuthMsg">${escP(msg)}</div></div>`;document.body.appendChild(e);$q('#qaLoginBtn').onclick=login;return e;
}
function hideAuth(){let e=$q('#qaAuthGate');if(e)e.remove()}
function clearRecoveryUrl(){try{history.replaceState({},document.title,location.pathname)}catch(_){}}
function recoveryGate(msg=''){
 let old=$q('#qaAuthGate');if(old)old.remove();
 let e=document.createElement('div');e.id='qaAuthGate';e.className='qa-auth-gate';
 const who=session?.user?.email||'';
 e.innerHTML=`<div class="qa-auth-card"><h2>${escP(t('resetTitle'))}</h2><p>${escP(t('resetIntro'))}${who?`<br><b>${escP(who)}</b>`:''}</p><input id="qaNewPassword" type="password" autocomplete="new-password" placeholder="${escP(t('newPassword'))}"><input id="qaConfirmPassword" type="password" autocomplete="new-password" placeholder="${escP(t('confirmPassword'))}"><button class="btn" id="qaUpdatePasswordBtn">${escP(t('updatePassword'))}</button><button class="btn ghost" id="qaCancelRecoveryBtn">${escP(t('cancelReset'))}</button><div class="qa-auth-msg" id="qaRecoveryMsg">${escP(msg)}</div></div>`;
 document.body.appendChild(e);
 $q('#qaUpdatePasswordBtn').onclick=updateRecoveredPassword;
 $q('#qaCancelRecoveryBtn').onclick=async()=>{try{await sb.auth.signOut()}catch(_){}clearRecoveryUrl();location.replace(location.pathname)};
 setTimeout(()=>$q('#qaNewPassword')?.focus(),0);
 return e;
}
async function updateRecoveredPassword(){
 const p1=$q('#qaNewPassword')?.value||'',p2=$q('#qaConfirmPassword')?.value||'',msg=$q('#qaRecoveryMsg'),btn=$q('#qaUpdatePasswordBtn');
 if(p1.length<6){if(msg)msg.textContent=t('passwordShort');return}
 if(p1!==p2){if(msg)msg.textContent=t('passwordMismatch');return}
 if(btn){btn.disabled=true;btn.textContent='…'} if(msg)msg.textContent='';
 try{
   const {error}=await sb.auth.updateUser({password:p1});if(error)throw error;
   if(msg)msg.textContent=t('passwordUpdated');clearRecoveryUrl();
   setTimeout(async()=>{try{await sb.auth.signOut()}catch(_){}location.replace(location.pathname)},1200);
 }catch(e){if(msg)msg.textContent=e.message||String(e);if(btn){btn.disabled=false;btn.textContent=t('updatePassword')}}
}
function overlay(label,percent=0){let e=$q('#qaProdOverlay');if(!e){e=document.createElement('div');e.id='qaProdOverlay';e.className='qa-prod-overlay';e.innerHTML='<div><b id="qaOverlayLabel"></b><div class="qa-progress"><i id="qaOverlayBar"></i></div><small id="qaOverlaySub"></small></div>';document.body.appendChild(e)}$q('#qaOverlayLabel').textContent=label;$q('#qaOverlayBar').style.width=Math.max(0,Math.min(100,percent))+'%';return e}
function overlaySub(s){if($q('#qaOverlaySub'))$q('#qaOverlaySub').textContent=s||''}
function closeOverlay(){let e=$q('#qaProdOverlay');if(e)e.remove()}
function versionBar(){let e=$q('#qaProdBar');if(!e){e=document.createElement('div');e.id='qaProdBar';e.className='qa-prod-bar';let header=document.querySelector('header,.topbar,.header');(header?.parentNode||document.body).insertBefore(e,header?.nextSibling||document.body.firstChild)}let v=liveVersion;e.innerHTML=`<span class="qa-prod-pill"><b>${escP(t('role'))}:</b> ${escP(MODE==='admin'?t('admin'):t('viewer'))}</span><span><b>${escP(t('version'))}:</b> ${escP(v?.version_code||'—')}</span><span><b>${escP(t('last'))}:</b> ${escP(v?.published_at?new Date(v.published_at).toLocaleString():'—')}</span><span><b>${escP(t('recon'))}:</b> ${escP(v?'Completed':'—')}</span><button class="btn ghost" id="qaLogoutBtn" style="margin-left:auto;width:auto;padding:6px 10px">${escP(t('logout'))}</button>`;$q('#qaLogoutBtn').onclick=()=>sb.auth.signOut().then(()=>location.reload())}
async function login(){let email=$q('#qaLoginEmail').value.trim(),password=$q('#qaLoginPassword').value; $q('#qaAuthMsg').textContent='';let {error}=await sb.auth.signInWithPassword({email,password});if(error){$q('#qaAuthMsg').textContent=error.message;return}await bootAfterAuth()}
async function profile(){let {data,error}=await sb.from('qa_profiles').select('user_id,email,role').eq('user_id',session.user.id).maybeSingle();if(error)throw error;return data}
async function getAppState(){let {data,error}=await sb.from('qa_app_state').select('published_version_id').eq('id',1).maybeSingle();if(error)throw error;return data}
async function getVersion(id){if(!id)return null;let {data,error}=await sb.from('qa_versions').select('*').eq('id',id).single();if(error)throw error;return data}
function replaceObjectContents(target,source){if(!target||typeof target!=='object'||!source||typeof source!=='object')return;for(const k of Object.keys(target))delete target[k];Object.assign(target,source)}
async function loadEngineConfig(){try{let {data,error}=await sb.from('qa_engine_config').select('payload').eq('config_key','decode_overrides').maybeSingle();if(error)throw error;if(data?.payload&&typeof BASE_DECODE_OVERRIDES!=='undefined')replaceObjectContents(BASE_DECODE_OVERRIDES,data.payload);return !!data?.payload}catch(e){console.warn('Engine config unavailable',e);return false}}
async function fetchRows(table,versionId,expectedCount=0,onProgress){
 const size=Math.max(100,Math.min(1000,CFG.chunkSize||1000));
 // Published versions already store row counts. Use bounded parallel page reads so a
 // 60k+ row SCM dataset does not require 60+ strictly sequential HTTP round trips.
 if(Number(expectedCount)>0){
   const total=Number(expectedCount), pages=Math.ceil(total/size), concurrency=6, chunks=new Array(pages);
   for(let base=0;base<pages;base+=concurrency){
     const jobs=[];
     for(let page=base;page<Math.min(pages,base+concurrency);page++){
       const from=page*size;
       jobs.push((async()=>{let {data,error}=await sb.from(table).select('row_no,payload').eq('version_id',versionId).order('row_no',{ascending:true}).range(from,Math.min(total-1,from+size-1));if(error)throw error;chunks[page]=(data||[]).map(x=>x.payload)})());
     }
     await Promise.all(jobs);
     if(onProgress)onProgress(Math.min(total,(base+jobs.length)*size),total);
     // Let the browser paint progress between network batches.
     await new Promise(r=>setTimeout(r,0));
   }
   return chunks.flat();
 }
 let all=[];for(let from=0;;from+=size){let {data,error}=await sb.from(table).select('row_no,payload').eq('version_id',versionId).order('row_no',{ascending:true}).range(from,from+size-1);if(error)throw error;all.push(...(data||[]).map(x=>x.payload));if(onProgress)onProgress(all.length,0);if(!data||data.length<size)break;await new Promise(r=>setTimeout(r,0))}return all
}
async function hydrateEvidence(rows){
 let paths=rows.map(x=>x.storage_path).filter(Boolean);if(!paths.length)return rows;
 // Signed URL creation is batched to avoid one oversized request when Evidence grows.
 const map=new Map(), batch=100;
 for(let i=0;i<paths.length;i+=batch){let part=paths.slice(i,i+batch),{data,error}=await sb.storage.from(CFG.evidenceBucket||'qa-evidence').createSignedUrls(part,3600);if(error){console.warn(error);continue}(data||[]).forEach(x=>map.set(x.path,x.signedUrl));await new Promise(r=>setTimeout(r,0))}
 return rows.map(x=>{if(x.storage_path&&map.get(x.storage_path)){let u=map.get(x.storage_path);return {...x,asset_path:u,object_url:/^(JPG|JPEG|PNG|WEBP|GIF)$/i.test(x.file_type||'')?u:''}}return x})
}
function rebuildPublishedDerivedState(){
 // IMPORTANT: published Quality rows already contain validated reconciliation fields.
 // Re-loading LIVE must NOT decode/reconcile 9k Quality rows again. We only rebuild the
 // lightweight indexes needed by drilldowns and denominator de-duplication.
 if(typeof buildProdIndex==='function')buildProdIndex();
 if(typeof RECON!=='undefined')RECON=ISSUES;
 if(typeof BATCH_MASTER!=='undefined'){
   const g=new Map();
   for(const r of ISSUES){if(r.readiness!=='READY'||!r.recon_key)continue;let k=r.recon_key;if(!g.has(k))g.set(k,{recon_key:k,sku:r.sku,sku_group:r.sku_group,product_name:r.product_name,production_date:r.production_date,production_month:r.production_month,factory:r.resolved_plant,shift_scope:r.shift_decoded?`SHIFT${r.shift_decoded}`:'ALL_SHIFT',coding_token:r.coding_token,scm_batches:new Set(),production_qty:Number(r.production_qty)||0,issue_qty:0,events:0,oas:new Set(),classes:new Set()});let b=g.get(k);b.issue_qty+=Number(r.qty)||0;b.events++;if(r.oa_code)b.oas.add(r.oa_code);if(r.issue_class)b.classes.add(r.issue_class);String(r.scm_batches||'').split(';').filter(Boolean).forEach(x=>b.scm_batches.add(x))}
   BATCH_MASTER=[...g.values()].map(b=>({...b,scm_batches:[...b.scm_batches].join(';'),oa_count:b.oas.size,issue_classes:[...b.classes].join('; '),rate:b.production_qty?b.issue_qty/b.production_qty:null,ppm:b.production_qty?b.issue_qty/b.production_qty*1e6:null}));
 }
 if(typeof MEMBERS!=='undefined'){
   MEMBERS.clear();
   for(const r of ISSUES){if(r.readiness!=='READY'||!r.recon_key||MEMBERS.has(r.recon_key))continue;let key=r.shift_decoded?v3keyps(r.sku,r.production_date,r.resolved_plant,r.shift_decoded):v3keyp(r.sku,r.production_date,r.resolved_plant);let rows=(r.shift_decoded?PROD_INDEX?.bySkuDatePlantShift:PROD_INDEX?.bySkuDatePlant)?.get(key)||[];MEMBERS.set(r.recon_key,rows)}
 }
 if(typeof relinkEvidence==='function')relinkEvidence();
}
async function loadPublished(show=true){
 const started=performance.now();
 try{
   if(show){overlay(t('loading'),5);overlaySub('Checking LIVE version…')}
   let st=await getAppState();
   if(!st?.published_version_id){if(show){overlaySub(t('noLive'));setTimeout(closeOverlay,2500)}return false}
   let v=await getVersion(st.published_version_id);
   if(show){overlay(t('loading'),12);overlaySub(`LIVE ${v.version_code}`)}

   // Quality, SCM and Evidence are independent tables: fetch them in parallel.
   let qProgress=0,pProgress=0,eProgress=0;
   const updateProgress=()=>{if(!show)return;let qTot=Math.max(1,Number(v.quality_count)||1),pTot=Math.max(1,Number(v.production_count)||1),eTot=Math.max(1,Number(v.evidence_count)||1);let weighted=.18*(qProgress/qTot)+.55*(pProgress/pTot)+.07*(eProgress/eTot);overlay(t('loading'),12+Math.min(.80,weighted)*72);overlaySub(`${qProgress.toLocaleString()} Quality · ${pProgress.toLocaleString()} SCM · ${eProgress.toLocaleString()} Evidence rows`)};
   const qPromise=fetchRows('qa_quality_rows',v.id,v.quality_count,(n)=>{qProgress=n;updateProgress()});
   const pPromise=fetchRows('qa_production_rows',v.id,v.production_count,(n)=>{pProgress=n;updateProgress()});
   const ePromise=fetchRows('qa_evidence_rows',v.id,v.evidence_count,(n)=>{eProgress=n;updateProgress()});
   let [q,p,ev]=await Promise.all([qPromise,pPromise,ePromise]);
   qProgress=q.length;pProgress=p.length;eProgress=ev.length;updateProgress();
   if(show){overlay(t('loading'),86);overlaySub('Preparing evidence links…')}
   ev=await hydrateEvidence(ev);

   if(show){overlay(t('loading'),90);overlaySub('Building dashboard indexes…')}
   ISSUES=q;PROD=p;EVIDENCE=ev;
   if(typeof DATA_SOURCES!=='undefined')Object.assign(DATA_SOURCES,{quality:`Supabase LIVE ${v.version_code}`,production:`Supabase LIVE ${v.version_code}`,evidence:`Supabase LIVE ${v.version_code}`});
   if(typeof NOTES!=='undefined'){NOTES.quality='Central published version';NOTES.production='Central published version';NOTES.evidence='Central published version'};
   await new Promise(r=>setTimeout(r,0));
   rebuildPublishedDerivedState();

   if(show){overlay(t('loading'),95);overlaySub('Rendering dashboard…')}
   await new Promise(r=>setTimeout(r,0));
   if(typeof refreshOptions==='function')refreshOptions(true);
   if(typeof applyV4==='function')applyV4();else if(typeof apply==='function')apply();

   liveVersion=v;versionBar();
   if(show){overlay(t('loading'),100);overlaySub(`Ready in ${((performance.now()-started)/1000).toFixed(1)}s`);setTimeout(closeOverlay,500)}
   return true;
 }catch(e){
   console.error('LIVE load failed',e);
   if(show){overlay('LIVE load failed',100);overlaySub(e.message||String(e));setTimeout(closeOverlay,8000)}
   throw e;
 }
}
function countStats(){let ready=(typeof ISSUES!=='undefined'?ISSUES:[]).filter(x=>x.readiness==='READY').length;let total=(typeof ISSUES!=='undefined'?ISSUES:[]).length;return {q:total,p:(typeof PROD!=='undefined'?PROD:[]).length,e:(typeof EVIDENCE!=='undefined'?EVIDENCE:[]).length,ready,unresolved:total-ready}}
function adminPanel(){let page=document.getElementById('readiness');if(!page||$q('#qaAdminPanel'))return;let panel=document.createElement('div');panel.id='qaAdminPanel';panel.className='qa-admin-panel';page.insertBefore(panel,page.firstChild);renderAdminPanel();}
function renderAdminPanel(){let e=$q('#qaAdminPanel');if(!e)return;let s=countStats();e.innerHTML=`<h3>Production Data Management</h3><div class="qa-live-note">${escP(t('localStage'))}</div><div class="qa-admin-grid"><div class="qa-admin-stat"><small>${escP(t('quality'))}</small><b>${s.q.toLocaleString()}</b></div><div class="qa-admin-stat"><small>${escP(t('prod'))}</small><b>${s.p.toLocaleString()}</b></div><div class="qa-admin-stat"><small>${escP(t('ready'))}</small><b>${s.ready.toLocaleString()}</b></div><div class="qa-admin-stat"><small>${escP(t('unresolved'))}</small><b>${s.unresolved.toLocaleString()}</b></div></div><div class="qa-admin-actions"><button class="btn" id="qaPublishBtn">${escP(t('publish'))}</button><button class="btn ghost" id="qaLoadLiveBtn">${escP(t('live'))}</button><button class="btn ghost" id="qaHistoryBtn">${escP(t('history'))}</button><label class="btn ghost" style="width:auto;cursor:pointer">Import Engine Config<input id="qaEngineConfigFile" type="file" accept="application/json,.json" hidden></label></div><div class="qa-version-list" id="qaVersionList"></div>`;$q('#qaPublishBtn').onclick=publishCurrent;$q('#qaLoadLiveBtn').onclick=()=>loadPublished(true).then(()=>renderAdminPanel());$q('#qaHistoryBtn').onclick=renderHistory;$q('#qaEngineConfigFile').onchange=importEngineConfig;}
function cleanPayload(obj){return JSON.parse(JSON.stringify(obj,(k,v)=>typeof v==='string'&&v.startsWith('blob:')?'':v))}
function safeName(s){return String(s||'file').replace(/[^A-Za-z0-9_.!$@=;+?()&,' -]/g,'_').replace(/\s+/g,'_').slice(-150)}
async function persistEvidence(rows,versionId,progress){let out=[];for(let i=0;i<rows.length;i++){let r={...rows[i]},existing=r.storage_path||'';if(!existing){let src=(r.asset_path||r.object_url||'');if(!src && r.thumb_path && typeof EMBEDDED_THUMBS!=='undefined')src=EMBEDDED_THUMBS[r.thumb_path]||'';if(src && (/^(blob:|data:)/.test(src))){try{let blob=await (await fetch(src)).blob();if(blob.size>50*1024*1024)throw new Error('Evidence file exceeds Supabase Free 50MB per-file limit: '+r.file_name);let path=`${versionId}/${String(r.attachment_id||i).replace(/[^A-Za-z0-9_-]/g,'_')}_${safeName(r.file_name)}`;let {error}=await sb.storage.from(CFG.evidenceBucket||'qa-evidence').upload(path,blob,{upsert:false,contentType:blob.type||undefined});if(error)throw error;r.storage_path=path}catch(e){console.warn('Evidence persistence skipped',r.file_name,e);r.storage_error=String(e.message||e)}}}r.asset_path='';r.object_url='';out.push(cleanPayload(r));if(progress)progress(i+1,rows.length)}return out}
async function insertChunks(table,versionId,rows,label,startPct,endPct){let size=Math.max(100,Math.min(1000,CFG.chunkSize||1000));for(let i=0;i<rows.length;i+=size){let part=rows.slice(i,i+size).map((payload,j)=>({version_id:versionId,row_no:i+j+1,payload:cleanPayload(payload)}));let {error}=await sb.from(table).insert(part);if(error)throw error;let pct=startPct+(endPct-startPct)*Math.min(1,(i+part.length)/Math.max(1,rows.length));overlay(t('publishing'),pct);overlaySub(`${label}: ${Math.min(i+part.length,rows.length).toLocaleString()} / ${rows.length.toLocaleString()} rows`)}}
async function importEngineConfig(e){let f=e.target.files?.[0];if(!f)return;try{let obj=JSON.parse(await f.text());if(!obj||Array.isArray(obj)||typeof obj!=='object')throw new Error('Invalid decode override JSON');let {error}=await sb.from('qa_engine_config').upsert({config_key:'decode_overrides',payload:obj,updated_by:session.user.id,updated_at:new Date().toISOString()},{onConflict:'config_key'});if(error)throw error;if(typeof BASE_DECODE_OVERRIDES!=='undefined')replaceObjectContents(BASE_DECODE_OVERRIDES,obj);alert('Engine config imported: '+Object.keys(obj).length.toLocaleString()+' decode overrides.');}catch(err){alert('Engine config import failed: '+(err.message||err))}finally{e.target.value=''}}
async function publishCurrent(){
 if(!confirm(t('confirm')))return;
 let s=countStats(), publishedCommitted=false, createdVersion=null;
 overlay(t('publishing'),2);
 try{
   let now=new Date(),code=now.toISOString().replace(/[-:TZ.]/g,'').slice(0,14);
   let {data:v,error:e}=await sb.from('qa_versions').insert({version_code:code,status:'staging',created_by:session.user.id,quality_count:s.q,production_count:s.p,evidence_count:s.e,ready_count:s.ready,unresolved_count:s.unresolved,notes:'Published from China QA Admin Mode'}).select().single();
   if(e)throw e; createdVersion=v;
   let ev=await persistEvidence(typeof EVIDENCE!=='undefined'?EVIDENCE:[],v.id,(n,total)=>{overlay(t('publishing'),3+7*n/Math.max(1,total));overlaySub(`Evidence: ${n}/${total}`)});
   await insertChunks('qa_quality_rows',v.id,typeof ISSUES!=='undefined'?ISSUES:[],'Quality',10,42);
   await insertChunks('qa_production_rows',v.id,typeof PROD!=='undefined'?PROD:[],'SCM',42,84);
   await insertChunks('qa_evidence_rows',v.id,ev,'Evidence metadata',84,94);
   overlay(t('publishing'),96);
   let {error:pe}=await sb.rpc('qa_publish_version',{p_version:v.id});if(pe)throw pe;
   publishedCommitted=true;
   // Do not re-download 70k+ rows after a successful publish. The current Admin
   // working set is already the exact snapshot just written. Only refresh version metadata.
   try{liveVersion=await getVersion(v.id)}catch(_){liveVersion={...v,status:'published',published_at:new Date().toISOString()}}
   if(CFG.keepVersions){let {error:pruneErr}=await sb.rpc('qa_prune_versions',{p_keep:Number(CFG.keepVersions)});if(pruneErr)console.warn('Version prune warning',pruneErr)}
   versionBar();renderAdminPanel();overlay(t('published'),100);overlaySub(`LIVE ${liveVersion?.version_code||code} · Q ${s.q.toLocaleString()} · SCM ${s.p.toLocaleString()}`);setTimeout(closeOverlay,1200);
 }catch(e){
   console.error(e);
   // Never report “Publish failed” if the atomic publish RPC already succeeded.
   if(publishedCommitted){overlay(t('published'),100);overlaySub('LIVE publish succeeded. A post-publish refresh step reported: '+(e.message||String(e)));setTimeout(closeOverlay,5000);return}
   overlay(t('failed'),100);overlaySub(e.message||String(e));setTimeout(closeOverlay,6500)
 }
}
async function renderHistory(){let el=$q('#qaVersionList');if(!el)return;el.innerHTML='Loading…';let {data,error}=await sb.from('qa_versions').select('*').order('created_at',{ascending:false}).limit(12);if(error){el.textContent=error.message;return}el.innerHTML=(data||[]).map(v=>`<div class="qa-version-row"><b>${escP(v.version_code)}</b><span>${escP(v.status)}</span><span>Q ${Number(v.quality_count||0).toLocaleString()} · SCM ${Number(v.production_count||0).toLocaleString()}</span><span>${escP(v.published_at?new Date(v.published_at).toLocaleString():'—')}</span>${v.status==='published'?'<span>LIVE</span>':`<button class="btn ghost qaRollback" data-id="${escP(v.id)}">Rollback</button>`}</div>`).join('')||'No versions';el.querySelectorAll('.qaRollback').forEach(b=>b.onclick=async()=>{if(!confirm(t('rollback')))return;overlay(t('publishing'),60);let {error}=await sb.rpc('qa_publish_version',{p_version:b.dataset.id});if(error){overlay(t('failed'),100);overlaySub(error.message);setTimeout(closeOverlay,3000);return}await loadPublished(false);renderAdminPanel();versionBar();closeOverlay()})}
async function bootAfterAuth(){let {data:{session:s}}=await sb.auth.getSession();session=s;if(recoveryIntent&&session){recoveryGate();return}if(!session){addAuthGate();return}let p=await profile();if(MODE==='admin'&&p?.role!=='admin'){addAuthGate(t('adminOnly'));return}hideAuth();versionBar();await loadEngineConfig();if(MODE==='viewer'){document.body.classList.add('qa-viewer-mode');await loadPublished(true)}else{document.body.classList.add('qa-admin-mode');adminPanel();let had=await loadPublished(true);adminPanel();renderAdminPanel();if(!had)versionBar()}wrapLanguage()}
function wrapLanguage(){if(typeof setLanguageV7==='function'&&!setLanguageV7.__qaWrapped){let base=setLanguageV7;let wrapped=function(x){let r=base(x);versionBar();if(MODE==='admin')renderAdminPanel();return r};wrapped.__qaWrapped=true;setLanguageV7=wrapped}}
async function boot(){if(!configured()){let msg='Supabase is not configured. Edit site/app-config.js first.';console.warn(msg);if(MODE==='admin'){adminPanel();let e=$q('#qaAdminPanel');if(e)e.insertAdjacentHTML('afterbegin',`<div class="qa-live-note">${escP(msg)} Local V8 upload/reconciliation still works, but Publish is disabled.</div>`)}else addAuthGate(msg);return}if(!window.supabase?.createClient){addAuthGate('Supabase client failed to load.');return}sb=window.supabase.createClient(CFG.supabaseUrl,CFG.supabasePublishableKey,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}});sb.auth.onAuthStateChange((evt,s)=>{session=s;if(evt==='PASSWORD_RECOVERY'){recoveryIntent=true;setTimeout(()=>{if(s)recoveryGate()},0)}});await bootAfterAuth()}
window.QA_PROD={loadPublished,publishCurrent,recoveryGate};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(boot,50));else setTimeout(boot,50);
})();
