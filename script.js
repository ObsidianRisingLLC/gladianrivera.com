(function () {
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduceMotion) document.body.classList.add('no-motion');

  var header = document.getElementById('site-header');
  var onScroll = function () {
    header.classList.toggle('scrolled', window.scrollY > 40);
  };
  document.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  var heroVideo = document.querySelector('.hero-video');
  if (heroVideo && reduceMotion) {
    heroVideo.removeAttribute('autoplay');
    heroVideo.pause();
  }

  var toggle = document.getElementById('nav-toggle');
  var panel = document.getElementById('mobile-panel');
  toggle.addEventListener('click', function () {
    var open = panel.classList.toggle('open');
    toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
  });
  panel.querySelectorAll('a').forEach(function (a) {
    a.addEventListener('click', function () {
      panel.classList.remove('open');
      toggle.setAttribute('aria-expanded', 'false');
    });
  });

  document.querySelectorAll('.pathway-card').forEach(function (card) {
    card.addEventListener('click', function (e) {
      if (e.target.closest('a')) return;
      card.classList.toggle('flipped');
    });
  });

  var contactForm = document.getElementById('contact-form');
  if (contactForm) {
    var note = document.getElementById('contact-form-note');
    var submitBtn = contactForm.querySelector('button[type="submit"]');
    contactForm.addEventListener('submit', function (e) {
      e.preventDefault();
      submitBtn.setAttribute('disabled', 'true');
      note.textContent = 'Sending…';
      note.className = 'contact-form-note';
      fetch(contactForm.action, {
        method: 'POST',
        body: new FormData(contactForm),
        headers: { Accept: 'application/json' }
      }).then(function (response) {
        if (response.ok) {
          contactForm.reset();
          note.textContent = "Thanks — your message is on its way. I'll get back to you soon.";
          note.className = 'contact-form-note is-success';
        } else {
          response.json().then(function (data) {
            var msg = (data && data.errors && data.errors.length) ? data.errors.map(function (er) { return er.message; }).join(', ') : 'Something went wrong.';
            note.textContent = msg + ' You can also email gladian.rivera@gmail.com directly.';
            note.className = 'contact-form-note is-error';
          }).catch(function () {
            note.textContent = 'Something went wrong. You can also email gladian.rivera@gmail.com directly.';
            note.className = 'contact-form-note is-error';
          });
        }
      }).catch(function () {
        note.textContent = 'Something went wrong. You can also email gladian.rivera@gmail.com directly.';
        note.className = 'contact-form-note is-error';
      }).finally(function () {
        submitBtn.removeAttribute('disabled');
      });
    });
  }

    var revealEls = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window && !reduceMotion) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12 });
    revealEls.forEach(function (el) { io.observe(el); });
  } else {
    revealEls.forEach(function (el) { el.classList.add('is-visible'); });
  }
})();
