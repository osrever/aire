'use strict';
(() => {
  if (new URLSearchParams(location.search).get('compact') === '1') document.documentElement.classList.add('compact');
  const $ = id => document.getElementById(id);
  const fields = ['pm2_5', 'pm10', 'nitrogen_dioxide', 'ozone'];
  const categories = [
    {max:20, label:'Buena', color:'#208579', tint:'#e5f5ee', text:'Las condiciones son favorables para disfrutar de las actividades al aire libre.'},
    {max:40, label:'Razonablemente buena', color:'#527c27', tint:'#f0f6e4', text:'La calidad del aire es razonablemente buena. Mantente al tanto si eres especialmente sensible a la contaminación.'},
    {max:60, label:'Moderada', color:'#8b6b12', tint:'#faf3d9', text:'La calidad del aire es moderada. Si eres sensible a la contaminación, considera adaptar los esfuerzos prolongados al aire libre.'},
    {max:80, label:'Mala', color:'#b8552c', tint:'#fff0e3', text:'La calidad del aire es mala. Considera reducir los esfuerzos intensos al aire libre, especialmente si eres sensible a la contaminación.'},
    {max:100, label:'Muy mala', color:'#b13550', tint:'#fce7ec', text:'La calidad del aire es muy mala. Valora posponer los esfuerzos al aire libre y consulta las recomendaciones locales.'},
    {max:Infinity, label:'Extremadamente mala', color:'#803d7d', tint:'#f4e8f6', text:'La calidad del aire es extremadamente mala. Evita los esfuerzos al aire libre y sigue las indicaciones de las autoridades locales.'}
  ];
  const valid = n => typeof n === 'number' && Number.isFinite(n) && n >= 0;
  const format = n => valid(n) ? new Intl.NumberFormat('es-ES', {maximumFractionDigits:1}).format(n) : '—';
  const date = t => new Intl.DateTimeFormat('es-ES',{timeZone:'Europe/Madrid',day:'numeric',month:'short',hour:'2-digit',minute:'2-digit',timeZoneName:'short'}).format(new Date(t*1000));
  const clock = t => new Intl.DateTimeFormat('es-ES',{timeZone:'Europe/Madrid',hour:'2-digit',minute:'2-digit'}).format(new Date(t*1000));
  const endpoint = new URL('https://air-quality-api.open-meteo.com/v1/air-quality');
  endpoint.search = new URLSearchParams({latitude:'37.3891',longitude:'-5.9845',current:['european_aqi',...fields].join(','),hourly:'european_aqi',past_days:'2',forecast_days:'2',timezone:'Europe/Madrid',timeformat:'unixtime'});
  let data = null, mode = 'history', series = [], pending = false, lastAttempt = 0;
  function inspect() {
    const i = Number($('hour').value), point = series[i];
    $('hour-value').textContent = point ? `${date(point.time)} · ${format(point.value)} AQI` : 'Sin datos disponibles';
    document.querySelectorAll('.chart-point').forEach((node,index) => node.setAttribute('r', Number(node.dataset.index) === i ? '4' : '0'));
  }
  function chart() {
    const currentTime = data?.current?.time;
    const times = data?.hourly?.time, values = data?.hourly?.european_aqi;
    const anchor = Number.isFinite(currentTime) ? Math.floor(currentTime/3600)*3600 : null;
    const start = mode === 'history' ? anchor-23*3600 : anchor+3600;
    const lookup = new Map();
    if (Array.isArray(times) && Array.isArray(values)) times.forEach((t,i) => { if (Number.isFinite(t)) lookup.set(t, values[i]); });
    series = anchor === null ? [] : Array.from({length:24},(_,i)=>({time:start+i*3600,value:lookup.get(start+i*3600)}));
    $('history').setAttribute('aria-pressed', String(mode === 'history'));
    $('forecast').setAttribute('aria-pressed', String(mode === 'forecast'));
    $('chart-caption').textContent = mode === 'history' ? 'Últimas 24 horas hasta la fecha de los datos · estimaciones modelizadas' : 'Próximas 24 horas desde la fecha de los datos · previsión del modelo';
    $('hour').disabled = !series.some(p=>valid(p.value));
    $('hour').max = Math.max(0,series.length-1);
    if ($('hour').disabled) {
      $('chart').innerHTML = '<p class="chart-caption">No hay datos horarios disponibles para este periodo.</p>';
      $('hour-value').textContent = 'Sin datos disponibles'; return;
    }
    const max = Math.max(40,...series.filter(p=>valid(p.value)).map(p=>p.value));
    const ceiling = Math.ceil(max/20)*20, x = i => 32+i*640/23, y = v => 98-v/ceiling*82;
    let path = '', open = false;
    series.forEach((p,i)=>{ if(valid(p.value)){path += `${open?'L':'M'}${x(i).toFixed(2)},${y(p.value).toFixed(2)} `;open=true;}else open=false; });
    const grid = [0,ceiling/2,ceiling].map(v=>`<line x1="32" x2="672" y1="${y(v)}" y2="${y(v)}" stroke="#e2eae5" stroke-dasharray="3 4"/><text x="2" y="${y(v)+3}">${v}</text>`).join('');
    const labels = [0,6,12,18,23].map(i=>`<text x="${x(i)}" y="122" text-anchor="${i===0?'start':i===23?'end':'middle'}">${clock(series[i].time)}</text>`).join('');
    const points = series.map((p,i)=>valid(p.value)?`<circle class="chart-point" cx="${x(i)}" cy="${y(p.value)}" r="0" fill="var(--accent)"/>`:'').join('');
    $('chart').innerHTML = `<svg viewBox="0 0 690 130" role="img" aria-label="${mode==='history'?'Evolución reciente':'Previsión'} del índice europeo. Explora los valores con el control de hora.">${grid}<path d="${path}" fill="none" stroke="var(--accent)" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" ${mode==='forecast'?'stroke-dasharray="5 4"':''}/>${points}${labels}</svg>`;
    // Keep the markers aligned with all 24 slots, including gaps in the series.
    $('chart').querySelectorAll('.chart-point').forEach(node => {
      const index = Math.round((Number(node.getAttribute('cx'))-32)*23/640);
      node.dataset.index = String(index);
    });
    inspect();
  }
  function render() {
    const c = data.current, aqi = c.european_aqi;
    $('aqi').textContent = format(aqi);
    const category = valid(aqi) ? categories.find(item=>aqi<=item.max) : null;
    $('category').textContent = category?.label || 'Índice no disponible';
    $('description').textContent = category?.text || 'El proveedor no ofrece un índice válido para esta hora. Los contaminantes disponibles se muestran a continuación.';
    document.querySelector('.air-widget').style.setProperty('--accent', category?.color || '#60756f');
    document.querySelector('.air-widget').style.setProperty('--tint', category?.tint || '#eef2f0');
    $('gauge-fill').style.strokeDashoffset = String(590.62*(1-Math.min(valid(aqi)?aqi:0,120)/120));
    fields.forEach(key=>$ (key).textContent=format(c[key]));
    $('data-time').textContent = `Datos del ${date(c.time)}`;
    chart();
  }
  async function refresh() {
    if(pending) return;
    pending=true; lastAttempt=Date.now(); $('refresh').disabled=true;
    $('notice').className='notice'; $('notice').textContent='Actualizando la estimación atmosférica…';
    const controller = new AbortController(), timeout = setTimeout(()=>controller.abort(),15000);
    try {
      const response = await fetch(endpoint,{signal:controller.signal,credentials:'omit'});
      if(!response.ok) throw new Error(`HTTP ${response.status}`);
      const next = await response.json();
      if(!next.current || !Number.isFinite(next.current.time)) throw new Error('Respuesta sin fecha válida');
      // Numeric timestamps avoid ambiguous local times at daylight saving transitions.
      if(next.current.time > Date.now()/1000+3600) throw new Error('Fecha futura inesperada');
      data=next; render();
      const age = Date.now()/1000-data.current.time;
      $('notice').textContent = age>10800 ? 'Datos antiguos: la última estimación disponible tiene más de 3 horas.' : 'Estimación atmosférica · actualización automática cada 30 min';
      $('checked').textContent=`Consulta: ${date(Date.now()/1000)}.`;
    } catch(error) {
      $('notice').className='notice error';
      $('notice').textContent=data?'No se ha podido actualizar. Se conservan los datos anteriores con su fecha original.':'No se pueden consultar los datos en este momento. Inténtalo de nuevo con el botón de actualizar.';
      if(!data){$('category').textContent='Datos no disponibles';$('description').textContent='La información volverá a mostrarse cuando podamos conectar con el proveedor.';chart();}
    } finally {clearTimeout(timeout);pending=false;$('refresh').disabled=false;}
  }
  $('refresh').addEventListener('click',refresh);
  $('history').addEventListener('click',()=>{mode='history';chart();});
  $('forecast').addEventListener('click',()=>{mode='forecast';chart();});
  $('hour').addEventListener('input',inspect);
  setInterval(()=>{if(!document.hidden && Date.now()-lastAttempt>=1800000) refresh();},60000);
  document.addEventListener('visibilitychange',()=>{if(!document.hidden && Date.now()-lastAttempt>=1800000) refresh();});
  refresh();
})();
