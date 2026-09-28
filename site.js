(() => {
  const config = window.__INVITE__?.config;
  if (!config) return;

  const byId = (id) => document.getElementById(id);
  const arabicDigits = (value) => String(value).replace(/[0-9]/g, (digit) => '٠١٢٣٤٥٦٧٨٩'[Number(digit)]);
  const phoneLink = config.whatsappUrl || `https://wa.me/${String(config.contactPhone || '').replace(/[^0-9]/g, '')}`;

  document.title = `دعوة زفاف ${config.groom} & ${config.bride}`;
  document.querySelector('meta[name="description"]')?.setAttribute('content', `${config.groom} و${config.bride} — ${config.dateText}`);
  document.querySelector('meta[property="og:title"]')?.setAttribute('content', document.title);
  document.querySelector('meta[property="og:description"]')?.setAttribute('content', `${config.groom} و${config.bride} — ${config.dateText}`);
  document.querySelector('meta[property="og:url"]')?.setAttribute('content', config.siteUrl || location.href);

  const orderLinks = [byId('orderLink'), byId('orderWhatsapp')].filter(Boolean);
  orderLinks.forEach((link) => { link.href = phoneLink; });

  const cal = document.querySelector('#da3wa-cal');
  if (cal) {
    const date = new Date(config.date);
    const dateParts = new Intl.DateTimeFormat('ar', {
      timeZone: config.calendar?.timezone || 'Asia/Baghdad',
      year: 'numeric', month: 'long', day: 'numeric', weekday: 'long',
    }).formatToParts(date);
    const part = (type) => dateParts.find((item) => item.type === type)?.value || '';
    const monthYear = `${part('month')} ${part('year')}`;
    const durationMs = (config.calendar?.durationHours || 4) * 60 * 60 * 1000;
    const end = new Date(date.getTime() + durationMs);
    cal.querySelector('.cal-top').textContent = monthYear;
    cal.querySelector('.cal-wd').textContent = part('weekday');
    cal.querySelector('.cal-day').textContent = arabicDigits(part('day'));
    cal.querySelector('.cal-time').textContent = config.timeText;
    const startLocal = config.date.replace(/[-:]/g, '').slice(0, 15);
    const endLocalDate = new Date(date.getTime() + durationMs);
    const pad = (part) => String(part).padStart(2, '0');
    const endLocal = `${endLocalDate.getFullYear()}${pad(endLocalDate.getMonth() + 1)}${pad(endLocalDate.getDate())}T${pad(endLocalDate.getHours())}${pad(endLocalDate.getMinutes())}00`;
    const details = `${config.invitationText}\n${config.siteUrl || location.href}`;
    const google = new URL('https://calendar.google.com/calendar/render');
    google.search = new URLSearchParams({
      action: 'TEMPLATE', text: `دعوة زفاف ${config.groom} & ${config.bride}`,
      dates: `${startLocal}/${endLocal}`, ctz: config.calendar?.timezone || 'Asia/Baghdad',
      location: `${config.venueName} — ${config.venueAddr}`, details,
    }).toString();
    const googleLink = cal.querySelector('a[href*="calendar.google.com"]');
    if (googleLink) googleLink.href = google.toString();
    const icsLink = cal.querySelector('a[href="/cal/demo-vangogh"]');
    if (icsLink) {
      const ics = [
        'BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Wedding Invitation//AR', 'BEGIN:VEVENT',
        `DTSTART;TZID=${config.calendar?.timezone || 'Asia/Baghdad'}:${startLocal}`, `DTEND;TZID=${config.calendar?.timezone || 'Asia/Baghdad'}:${endLocal}`,
        `SUMMARY:${`دعوة زفاف ${config.groom} & ${config.bride}`.replace(/([,;])/g, '\\$1')}`,
        `LOCATION:${`${config.venueName} — ${config.venueAddr}`.replace(/([,;])/g, '\\$1')}`,
        `DESCRIPTION:${details.replace(/\\/g, '\\\\').replace(/\n/g, '\\n').replace(/([,;])/g, '\\$1')}`,
        'END:VEVENT', 'END:VCALENDAR', '',
      ].join('\r\n');
      icsLink.href = URL.createObjectURL(new Blob([ics], { type: 'text/calendar;charset=utf-8' }));
      icsLink.download = 'wedding-invitation.ics';
    }
  }

  const rsvpConfig = config.rsvp || {};
  const rsvp = byId('da3wa-rsvp');
  if (rsvp) {
    const cap = rsvpConfig.capacity || 3;
    const capNote = rsvp.querySelector('.cap-note');
    if (capNote) capNote.textContent = `👥 هذه الدعوة تتّسع لـ ${arabicDigits(cap)} أشخاص كحدٍّ أقصى — شاملاً حضورك`;
    const wishes = byId('da3wa-wish-list');
    if (wishes) {
      wishes.replaceChildren(...(rsvpConfig.wishes || []).map((wish) => {
        const item = document.createElement('div'); item.className = 'wish';
        const avatar = document.createElement('div'); avatar.className = 'wish-av'; avatar.style.background = wish.color || '#e8c060';
        avatar.textContent = [...(wish.name || ' ')[0]];
        const body = document.createElement('div'); body.className = 'wish-body';
        const name = document.createElement('div'); name.className = 'wish-name'; name.textContent = wish.name;
        const message = document.createElement('div'); message.className = 'wish-msg'; message.textContent = wish.message;
        body.append(name, message); item.append(avatar, body); return item;
      }));
    }

    let attendance = 'yes';
    let companions = 0;
    const form = byId('da3wa-rsvp-form');
    const companionCount = byId('da3wa-guests');
    const maxCompanions = Math.max(0, cap - 1);
    const capState = () => {
      const atLimit = companions >= maxCompanions;
      byId('da3wa-step')?.classList.toggle('at-cap', atLimit);
      byId('da3wa-plus')?.setAttribute('aria-disabled', String(atLimit));
      if (companionCount) companionCount.textContent = arabicDigits(companions);
    };
    rsvp.querySelectorAll('#da3wa-att .pill').forEach((button) => button.addEventListener('click', () => {
      attendance = button.dataset.v;
      rsvp.querySelectorAll('#da3wa-att .pill').forEach((item) => item.setAttribute('aria-pressed', String(item === button)));
    }));
    byId('da3wa-minus')?.addEventListener('click', () => { companions = Math.max(0, companions - 1); capState(); });
    byId('da3wa-plus')?.addEventListener('click', () => {
      if (companions < maxCompanions) companions += 1;
      else byId('da3wa-capmax')?.classList.add('on');
      capState();
    });
    capState();
    form?.addEventListener('submit', (event) => {
      event.preventDefault();
      const name = String(new FormData(form).get('guest_name') || '').trim();
      const message = String(new FormData(form).get('message') || '').trim();
      if (!name) { form.reportValidity(); return; }
      const answer = { yes: 'نعم، سأحضر', no: 'أعتذر عن الحضور', maybe: 'ربما أحضر' }[attendance];
      const body = [`تأكيد حضور زفاف ${config.groom} و${config.bride}`, `الاسم: ${name}`, `الحضور: ${answer}`];
      if (attendance === 'yes') body.push(`عدد الحضور: ${companions + 1}`);
      if (message) body.push(`رسالة: ${message}`);
      window.open(`${phoneLink}?text=${encodeURIComponent(body.join('\n'))}`, '_blank', 'noopener,noreferrer');
    });
  }

  const music = byId('da3wa-music');
  const audio = byId('introAudio');
  let isPlaying = false;
  const paintMusic = () => {
    if (music) music.textContent = isPlaying ? '🔊' : '🎵';
    if (music) music.setAttribute('aria-label', isPlaying ? 'كتم الموسيقى' : 'تشغيل الموسيقى');
  };
  window.__da3waMusicPrime = () => { if (audio) audio.loop = true; };
  window.__da3waMusicGo = () => {
    if (!audio) return;
    audio.loop = true; audio.muted = false; audio.volume = 1;
    if (audio.ended || (Number.isFinite(audio.duration) && audio.duration - audio.currentTime < 0.2)) audio.currentTime = 0;
    audio.play().then(() => { isPlaying = true; paintMusic(); }).catch(() => { isPlaying = false; paintMusic(); });
  };
  const toggleMusic = () => {
    if (!audio) return;
    if (isPlaying) { audio.pause(); isPlaying = false; paintMusic(); }
    else window.__da3waMusicGo();
  };
  music?.addEventListener('click', toggleMusic);
  music?.addEventListener('keydown', (event) => {
    if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); toggleMusic(); }
  });
})();
