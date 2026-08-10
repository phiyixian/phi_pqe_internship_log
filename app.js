const KEY = 'internship-progress-v1';
const prompts = ['What did you discover today that will make tomorrow easier?', 'Which small result deserves to be shared with your team?', 'What question should guide your next experiment?'];
let selected = new Date(); selected.setHours(12,0,0,0);
let cursor = new Date(selected.getFullYear(), selected.getMonth(), 1);
let entries = JSON.parse(localStorage.getItem(KEY) || '{}');
const $ = id => document.getElementById(id);
const key = d => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
const fmt = (d, options) => new Intl.DateTimeFormat('en-GB', options).format(d);
function save(){ localStorage.setItem(KEY, JSON.stringify(entries)); }
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
$('entry-form').onsubmit=e=>{e.preventDefault();entries[key(selected)]={done:$('done').value.trim(),planned:$('planned').value.trim(),learning:$('learning').value.trim()};if(!entries[key(selected)].done&&!entries[key(selected)].planned&&!entries[key(selected)].learning)delete entries[key(selected)];save();$('save-message').textContent='Saved just now';renderAll()};
['prev-month','next-month'].forEach(id=>$(id).onclick=()=>{cursor.setMonth(cursor.getMonth()+(id==='next-month'?1:-1));renderCalendar()});
document.querySelectorAll('.tab').forEach(t=>t.onclick=()=>{document.querySelectorAll('.tab').forEach(x=>x.classList.remove('active'));t.classList.add('active');$('daily-view').classList.toggle('hidden',t.dataset.tab!=='daily');$('weekly-view').classList.toggle('hidden',t.dataset.tab!=='weekly');renderReport()});
$('week-prev').onclick=()=>{selected.setDate(selected.getDate()-7);cursor=new Date(selected.getFullYear(),selected.getMonth(),1);renderAll()};$('week-next').onclick=()=>{selected.setDate(selected.getDate()+7);cursor=new Date(selected.getFullYear(),selected.getMonth(),1);renderAll()};$('print-report').onclick=()=>window.print();
renderAll();
