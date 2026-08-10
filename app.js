const KEY = 'internship-progress-v1';
const REPOSITORY = 'phiyixian/phi_pqe_internship_log';
const DATA_FILE = 'data/progress.json';
const BRANCH = 'main';
const prompts = ['What did you discover today that will make tomorrow easier?', 'Which small result deserves to be shared with your team?', 'What question should guide your next experiment?'];
let selected = new Date(); selected.setHours(12,0,0,0);
let cursor = new Date(selected.getFullYear(), selected.getMonth(), 1);
let entries = JSON.parse(localStorage.getItem(KEY) || '{}');
let githubToken = sessionStorage.getItem('internship-github-token') || '';
const $ = id => document.getElementById(id);
const key = d => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
const fmt = (d, options) => new Intl.DateTimeFormat('en-GB', options).format(d);
function localSave(){ localStorage.setItem(KEY, JSON.stringify(entries)); }
function setStatus(message){ $('sync-status').textContent = message; }
function decodeBase64(value){ return decodeURIComponent(Array.prototype.map.call(atob(value.replace(/\n/g,'')), c => `%${c.charCodeAt(0).toString(16).padStart(2,'0')}`).join('')); }
function encodeBase64(value){ return btoa(unescape(encodeURIComponent(value))); }
async function loadFromGithub(){
  try {
    const response = await fetch(`https://api.github.com/repos/${REPOSITORY}/contents/${DATA_FILE}?ref=${BRANCH}`, {cache:'no-store'});
    if(!response.ok) throw new Error('not available');
    const file = await response.json();
    entries = JSON.parse(decodeBase64(file.content) || '{}');
    localSave(); setStatus('Live data');
  } catch { setStatus('Offline copy'); }
}
async function saveToGithub(){
  if(!githubToken){ setStatus('Editor access required'); return false; }
  const url = `https://api.github.com/repos/${REPOSITORY}/contents/${DATA_FILE}`;
  const headers = {Authorization:`Bearer ${githubToken}`,Accept:'application/vnd.github+json','Content-Type':'application/json'};
  const current = await fetch(`${url}?ref=${BRANCH}`, {headers});
  if(!current.ok) throw new Error('Could not read the current progress file.');
  const file = await current.json();
  const response = await fetch(url,{method:'PUT',headers,body:JSON.stringify({message:'Update internship progress',content:encodeBase64(JSON.stringify(entries,null,2)+'\n'),sha:file.sha,branch:BRANCH})});
  if(!response.ok){const result=await response.json();throw new Error(result.message || 'GitHub could not save this update.');}
  return true;
}
function weekStart(d){ const x = new Date(d); const day = (x.getDay()+6)%7; x.setDate(x.getDate()-day); x.setHours(12,0,0,0); return x; }
function datesOfWeek(d){ const start=weekStart(d); return [...Array(7)].map((_,i)=>{const x=new Date(start);x.setDate(start.getDate()+i);return x}) }
function renderCalendar(){
  $('month-label').textContent=fmt(cursor,{month:'long',year:'numeric'}); const box=$('calendar-days');box.innerHTML='';
  const offset=(cursor.getDay()+6)%7, days=new Date(cursor.getFullYear(),cursor.getMonth()+1,0).getDate();
  for(let i=0;i<offset;i++)box.appendChild(Object.assign(document.createElement('button'),{className:'empty',tabIndex:-1}));
  for(let day=1;day<=days;day++){const d=new Date(cursor.getFullYear(),cursor.getMonth(),day,12);const b=document.createElement('button');b.textContent=day;if(entries[key(d)])b.classList.add('logged');if(key(d)===key(selected))b.classList.add('selected');if(key(d)===key(new Date()))b.classList.add('today');b.onclick=()=>{selected=d;renderAll()};box.appendChild(b)}
}
function renderEntry(){ const e=entries[key(selected)]||{}; $('entry-weekday').textContent=fmt(selected,{weekday:'long'}).toUpperCase();$('entry-date').textContent=fmt(selected,{day:'numeric',month:'long'});$('done').value=e.done||'';$('planned').value=e.planned||'';$('learning').value=e.learning||'';$('entry-status').textContent=e.done||e.planned||e.learning?'Updated':'Draft';$('reflection-prompt').textContent=prompts[selected.getDate()%prompts.length] }
function renderInsights(){const week=datesOfWeek(selected).slice(0,5), count=week.filter(d=>entries[key(d)]).length;$('progress-number').innerHTML=`${count}<small>/5</small>`;$('progress-bar').style.width=`${count*20}%`;
 const recent=Object.entries(entries).sort(([a],[b])=>b.localeCompare(a)).slice(0,3);$('recent-entries').innerHTML=recent.length?recent.map(([k,e])=>`<div class="recent-entry" data-date="${k}"><strong>${fmt(new Date(k+'T12:00:00'),{day:'numeric',month:'short'}).toUpperCase()}</strong><span>${e.done||e.learning||e.planned||'Update added'}</span></div>`).join(''):'<p class="empty-report">Your updates will appear here.</p>';
 document.querySelectorAll('.recent-entry').forEach(el=>el.onclick=()=>{selected=new Date(el.dataset.date+'T12:00:00');cursor=new Date(selected.getFullYear(),selected.getMonth(),1);renderAll()}) }
function renderReport(){const week=datesOfWeek(selected), start=week[0],end=week[6];$('report-week').textContent=`${fmt(start,{day:'numeric',month:'short'})}–${fmt(end,{day:'numeric',month:'short',year:'numeric'})}`;$('report-range').textContent=`${fmt(start,{day:'numeric',month:'long'})} — ${fmt(end,{day:'numeric',month:'long',year:'numeric'})}`;const records=week.map(d=>({d,e:entries[key(d)]})).filter(x=>x.e);$('report-days').textContent=records.length;$('report-intro').textContent=records.length?`This week, I documented ${records.length} day${records.length===1?'':'s'} of focused internship progress, combining delivery work with research and reflection.`:'Add daily updates to build your weekly report.';
 const field=(id,name)=>$(id).innerHTML=records.filter(x=>x.e[name]).map(x=>`<div class="report-item"><strong>${fmt(x.d,{weekday:'short',day:'numeric',month:'short'}).toUpperCase()}</strong><p>${escapeHtml(x.e[name])}</p></div>`).join('')||'<p class="empty-report">No notes added yet.</p>';field('report-done','done');field('report-planned','planned');field('report-learning','learning') }
function escapeHtml(s){const d=document.createElement('div');d.textContent=s;return d.innerHTML}
function renderAll(){renderCalendar();renderEntry();renderInsights();renderReport()}
$('entry-form').onsubmit=async e=>{e.preventDefault();if(!githubToken){$('editor-access').click();if(!githubToken)return;}entries[key(selected)]={done:$('done').value.trim(),planned:$('planned').value.trim(),learning:$('learning').value.trim()};if(!entries[key(selected)].done&&!entries[key(selected)].planned&&!entries[key(selected)].learning)delete entries[key(selected)];localSave();$('save-message').textContent='Saving to GitHub...';try{await saveToGithub();$('save-message').textContent='Saved permanently to GitHub';setStatus('Live data');renderAll()}catch(error){$('save-message').textContent=error.message;setStatus('Save failed')}};
['prev-month','next-month'].forEach(id=>$(id).onclick=()=>{cursor.setMonth(cursor.getMonth()+(id==='next-month'?1:-1));renderCalendar()});
document.querySelectorAll('.tab').forEach(t=>t.onclick=()=>{document.querySelectorAll('.tab').forEach(x=>x.classList.remove('active'));t.classList.add('active');$('daily-view').classList.toggle('hidden',t.dataset.tab!=='daily');$('weekly-view').classList.toggle('hidden',t.dataset.tab!=='weekly');renderReport()});
$('week-prev').onclick=()=>{selected.setDate(selected.getDate()-7);cursor=new Date(selected.getFullYear(),selected.getMonth(),1);renderAll()};$('week-next').onclick=()=>{selected.setDate(selected.getDate()+7);cursor=new Date(selected.getFullYear(),selected.getMonth(),1);renderAll()};$('print-report').onclick=()=>window.print();
$('editor-access').onclick=()=>{const token=prompt('Paste a GitHub fine-grained personal access token with Contents: Read and write access for this repository. It is kept only for this browser session.');if(token){githubToken=token.trim();sessionStorage.setItem('internship-github-token',githubToken);setStatus('Editor access enabled');}};
loadFromGithub().finally(renderAll);
