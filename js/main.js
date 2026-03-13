const navToggle = document.querySelector('.nav-toggle');
const siteNav = document.querySelector('.site-nav');
const siteHeader = document.querySelector('.site-header');

if (navToggle && siteNav) {
  navToggle.addEventListener('click', () => {
    const isOpen = siteNav.classList.toggle('open');
    navToggle.setAttribute('aria-expanded', String(isOpen));
  });

  siteNav.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => {
      siteNav.classList.remove('open');
      navToggle.setAttribute('aria-expanded', 'false');
    });
  });
}

window.addEventListener('scroll', () => {
  if (!siteHeader) return;
  siteHeader.classList.toggle('scrolled', window.scrollY > 12);
}, { passive: true });

const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('in-view');
      observer.unobserve(entry.target);
    }
  });
}, {
  threshold: 0.15,
  rootMargin: '0px 0px -40px 0px'
});

document.querySelectorAll('.reveal').forEach(el => observer.observe(el));

document.querySelectorAll('.tilt-card').forEach(card => {
  card.addEventListener('mousemove', (event) => {
    const rect = card.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    const midX = rect.width / 2;
    const midY = rect.height / 2;
    const rotateY = ((x - midX) / midX) * 4;
    const rotateX = ((midY - y) / midY) * 4;
    card.style.transform = `perspective(1200px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-4px)`;
  });

  card.addEventListener('mouseleave', () => {
    card.style.transform = 'perspective(1200px) rotateX(0deg) rotateY(0deg) translateY(0)';
  });
});

const contactForm = document.querySelector('.contact-form');
if (contactForm) {
  contactForm.addEventListener('submit', (event) => {
    event.preventDefault();
    const submitButton = contactForm.querySelector('button[type="submit"]');
    const originalText = submitButton.textContent;
    submitButton.textContent = 'Richiesta inviata';
    submitButton.disabled = true;

    setTimeout(() => {
      submitButton.textContent = originalText;
      submitButton.disabled = false;
      contactForm.reset();
    }, 2200);
  });
}

/* ===== WOW HERO DEMO CLEAN ===== */

document.addEventListener('DOMContentLoaded', () => {
  const typedUrl = document.getElementById('typedUrl');
  const siteLoader = document.getElementById('siteLoader');
  const loaderProgress = document.getElementById('loaderProgress');
  const miniSiteContent = document.getElementById('miniSiteContent');
  const miniSiteInner = document.getElementById('miniSiteInner');
  const demoCursor = document.getElementById('demoCursor');
  const cursorClickRing = document.getElementById('cursorClickRing');
  const miniSiteCta = document.getElementById('miniSiteCta');
  const miniCard1 = document.getElementById('miniCard1');
  const miniCard2 = document.getElementById('miniCard2');
  const miniCard3 = document.getElementById('miniCard3');
  const miniEstimatorCard = document.getElementById('miniEstimatorCard');
  const miniEstimatorProgressBar = document.getElementById('miniEstimatorProgressBar');
  const miniChatQuestion = document.getElementById('miniChatQuestion');
  const miniChatAnswer = document.getElementById('miniChatAnswer');

  if (
    !typedUrl ||
    !siteLoader ||
    !loaderProgress ||
    !miniSiteContent ||
    !miniSiteInner ||
    !demoCursor ||
    !cursorClickRing
  ) {
    return;
  }

  const urlText = 'www.ilmionuovosito.it';

  let typingTimer = null;
  let mainLoopTimer = null;
  let stepTimers = [];

  function clearAllTimers() {
    if (typingTimer) {
      clearInterval(typingTimer);
      typingTimer = null;
    }

    if (mainLoopTimer) {
      clearTimeout(mainLoopTimer);
      mainLoopTimer = null;
    }

    stepTimers.forEach(timer => clearTimeout(timer));
    stepTimers = [];
  }

  function wait(fn, delay) {
    const timer = setTimeout(fn, delay);
    stepTimers.push(timer);
  }

  function resetStates() {
    clearAllTimers();

    typedUrl.textContent = '';

    siteLoader.classList.remove('active');
    loaderProgress.style.transition = 'none';
    loaderProgress.style.width = '0%';

    miniSiteContent.classList.remove('visible');
    miniSiteInner.style.transition = 'none';
    miniSiteInner.style.transform = 'translateY(0)';

    miniSiteCta?.classList.remove('active');
    miniCard1?.classList.remove('active');
    miniCard2?.classList.remove('active');
    miniCard3?.classList.remove('active');
    miniEstimatorCard?.classList.remove('active');
    miniChatQuestion?.classList.remove('show');
    miniChatAnswer?.classList.remove('show');

    if (miniChatQuestion) {
      miniChatQuestion.textContent = '';
      miniChatQuestion.style.opacity = '';
      miniChatQuestion.style.transform = '';
    }

    if (miniChatAnswer) {
      miniChatAnswer.textContent = '';
      miniChatAnswer.style.opacity = '';
      miniChatAnswer.style.transform = '';
    }

    if (miniEstimatorProgressBar) {
      miniEstimatorProgressBar.style.transition = 'none';
      miniEstimatorProgressBar.style.width = '0%';
    }

    demoCursor.style.transition = 'none';
    demoCursor.style.opacity = '0';
    demoCursor.style.transform = 'translate(24px, 24px)';

    cursorClickRing.classList.remove('active');
    cursorClickRing.style.opacity = '0';
  }

  function setCursor(x, y, duration = 430) {
    demoCursor.style.transition = `transform ${duration}ms ease, opacity .25s ease`;
    demoCursor.style.opacity = '1';
    demoCursor.style.transform = `translate(${x}px, ${y}px)`;
  }

  function clickAt(x, y) {
    cursorClickRing.style.setProperty('--ring-x', `${x - 8}px`);
    cursorClickRing.style.setProperty('--ring-y', `${y - 8}px`);
    cursorClickRing.classList.remove('active');
    void cursorClickRing.offsetWidth;
    cursorClickRing.classList.add('active');
  }

  function typeURL(onComplete) {
    let i = 0;
    typedUrl.textContent = '';

    typingTimer = setInterval(() => {
      typedUrl.textContent = urlText.slice(0, i + 1);
      i++;

      if (i >= urlText.length) {
        clearInterval(typingTimer);
        typingTimer = null;
        wait(onComplete, 350);
      }
    }, 75);
  }

  function typeMiniMessage(element, text, onComplete, speed = 40) {
    if (!element) {
      onComplete?.();
      return;
    }

    let i = 0;
    element.textContent = '';
    element.classList.add('show');
    element.style.opacity = '1';
    element.style.transform = 'translateY(0)';

    const timer = setInterval(() => {
      element.textContent = text.slice(0, i + 1);
      i++;

      if (i >= text.length) {
        clearInterval(timer);
        onComplete?.();
      }
    }, speed);

    stepTimers.push(timer);
  }

  function showLoader(onComplete) {
    siteLoader.classList.add('active');

    wait(() => {
      loaderProgress.style.transition = 'width 1.2s ease';
      loaderProgress.style.width = '100%';
    }, 40);

    wait(() => {
      siteLoader.classList.remove('active');
      onComplete();
    }, 1450);
  }

  function revealSite() {
    miniSiteContent.classList.add('visible');

    wait(() => {
      setCursor(210, 178, 430);
    }, 500);

    wait(() => {
      miniSiteCta?.classList.add('active');
      clickAt(210, 178);
    }, 1450);

    wait(() => {
      miniSiteCta?.classList.remove('active');
      miniSiteInner.style.transition = 'transform .8s ease';
      miniSiteInner.style.transform = 'translateY(-84px)';
    }, 2200);

    wait(() => {
      setCursor(120, 250, 400);
    }, 2850);

    wait(() => {
      miniCard1?.classList.add('active');
    }, 3220);

    wait(() => {
      miniCard1?.classList.remove('active');
      setCursor(292, 250, 400);
    }, 4150);

    wait(() => {
      miniCard2?.classList.add('active');
    }, 4480);

    wait(() => {
      miniCard2?.classList.remove('active');
      miniSiteInner.style.transition = 'transform .8s ease';
      miniSiteInner.style.transform = 'translateY(-290px)';
    }, 5600);

    wait(() => {
      setCursor(316, 384, 400);
    }, 6500);

    wait(() => {
      miniEstimatorCard?.classList.add('active');
      clickAt(316, 384);
    }, 6840);

    wait(() => {
      typeMiniMessage(
        miniChatQuestion,
        'Quanto mi costa un sito premium?',
        () => {},
        36
      );
    }, 7700);

    wait(() => {
      if (miniEstimatorProgressBar) {
        miniEstimatorProgressBar.style.transition = 'width 1.6s linear';
        miniEstimatorProgressBar.style.width = '100%';
      }
    }, 8450);

    wait(() => {
      if (miniChatAnswer) {
        miniChatAnswer.classList.remove('show');
        miniChatAnswer.textContent = '';
        miniChatAnswer.style.opacity = '0';
        miniChatAnswer.style.transform = 'translateY(6px)';
      }
    }, 8600);

    wait(() => {
      if (miniChatAnswer) {
        miniChatAnswer.textContent = 'Il costo stimato è 340 euro.';
        miniChatAnswer.classList.add('show');
        miniChatAnswer.style.opacity = '1';
        miniChatAnswer.style.transform = 'translateY(0)';
      }
    }, 10350);

    wait(() => {
      miniEstimatorCard?.classList.remove('active');
      miniSiteInner.style.transition = 'transform .9s ease';
      miniSiteInner.style.transform = 'translateY(0)';
    }, 12950);

    wait(() => {
      setCursor(24, 24, 430);
      demoCursor.style.opacity = '0';
    }, 13950);

    mainLoopTimer = setTimeout(() => {
      startDemo();
    }, 15200);
  }

  function startDemo() {
    resetStates();

    wait(() => {
      typeURL(() => {
        showLoader(() => {
          revealSite();
        });
      });
    }, 300);
  }

  startDemo();
});


document.addEventListener('DOMContentLoaded', () => {
  const slides = document.querySelectorAll('.hero-slide');
  const dots = document.querySelectorAll('.hero-dot');

  if (!slides.length || !dots.length) return;

  let currentSlide = 0;
  let autoplayTimer = null;

  // slide 1 = 10s, slide 2 = 6s, slide 3 = 6s
  // const slideTimes = [10000, 9000, 6000];

  function showSlide(index) {
    slides.forEach((slide, i) => {
      slide.classList.toggle('active', i === index);
    });

    dots.forEach((dot, i) => {
      dot.classList.toggle('active', i === index);
    });

    currentSlide = index;
  }

  function clearAutoplay() {
    if (autoplayTimer !== null) {
      clearTimeout(autoplayTimer);
      autoplayTimer = null;
    }
  }

  function scheduleNext() {
    clearAutoplay();

    const delay = slideTimes[currentSlide] || 6000;

    autoplayTimer = setTimeout(() => {
      const nextIndex = (currentSlide + 1) % slides.length;
      showSlide(nextIndex);
      scheduleNext();
    }, delay);
  }

  dots.forEach(dot => {
    dot.addEventListener('click', () => {
      const index = Number(dot.dataset.slide);
      showSlide(index);
      scheduleNext();
    });
  });

  showSlide(0);
  scheduleNext();
});

/* ===== PREMIUM CLIENT LOGOS CAROUSEL ===== */

document.addEventListener('DOMContentLoaded', () => {
  const track = document.getElementById('clientLogosTrack');
  const prevBtn = document.querySelector('.client-logos-prev');
  const nextBtn = document.querySelector('.client-logos-next');
  const carousel = document.querySelector('.client-logos-carousel');

  if (!track || !prevBtn || !nextBtn || !carousel) return;

  const cards = Array.from(track.querySelectorAll('.client-logo-card'));
  if (!cards.length) return;

  let currentIndex = 0;
  let autoplayTimer = null;

  function getVisibleCards() {
    if (window.innerWidth <= 820) return 2;
    if (window.innerWidth <= 1080) return 3;
    return 4;
  }

  function getMaxIndex() {
    return Math.max(0, cards.length - getVisibleCards());
  }

  function updateCarousel() {
    const visibleCards = getVisibleCards();
    const gap = 16; // 1rem approx
    const cardWidth = track.parentElement.offsetWidth / visibleCards - ((gap * (visibleCards - 1)) / visibleCards);
    const offset = currentIndex * (cardWidth + gap);

    track.style.transform = `translateX(-${offset}px)`;

    prevBtn.disabled = false;
    nextBtn.disabled = false;
  }

  function goNext() {
    const maxIndex = getMaxIndex();
    if (currentIndex >= maxIndex) {
      currentIndex = 0;
    } else {
      currentIndex += 1;
    }
    updateCarousel();
  }

  function goPrev() {
    const maxIndex = getMaxIndex();
    if (currentIndex <= 0) {
      currentIndex = maxIndex;
    } else {
      currentIndex -= 1;
    }
    updateCarousel();
  }

  function startAutoplay() {
    stopAutoplay();
    autoplayTimer = setInterval(() => {
      goNext();
    }, 3200);
  }

  function stopAutoplay() {
    if (autoplayTimer) {
      clearInterval(autoplayTimer);
      autoplayTimer = null;
    }
  }

  nextBtn.addEventListener('click', () => {
    goNext();
    startAutoplay();
  });

  prevBtn.addEventListener('click', () => {
    goPrev();
    startAutoplay();
  });

  carousel.addEventListener('mouseenter', stopAutoplay);
  carousel.addEventListener('mouseleave', startAutoplay);

  window.addEventListener('resize', () => {
    const maxIndex = getMaxIndex();
    if (currentIndex > maxIndex) currentIndex = maxIndex;
    updateCarousel();
  });

  updateCarousel();
  startAutoplay();
});

/* ===== LOGOS MARQUEE SMOOTH NO BUG ===== */

document.addEventListener('DOMContentLoaded', () => {
  const marquee = document.getElementById('logosMarquee');
  const track = document.getElementById('logosMarqueeTrack');

  if (!marquee || !track) return;

  const originalItems = Array.from(track.children);
  if (!originalItems.length) return;

  // duplica una volta i loghi
  originalItems.forEach(item => {
    const clone = item.cloneNode(true);
    clone.setAttribute('aria-hidden', 'true');
    track.appendChild(clone);
  });

  let offset = 0;
  let speed = 0.45; // più basso = più lento
  let animationId = null;
  let isPaused = false;
  let singleSetWidth = 0;

  function measure() {
    singleSetWidth = 0;
    for (let i = 0; i < originalItems.length; i++) {
      singleSetWidth += originalItems[i].getBoundingClientRect().width;
    }

    const styles = getComputedStyle(track);
    const gap = parseFloat(styles.columnGap || styles.gap || 0);
    singleSetWidth += gap * (originalItems.length - 1);
  }

  function tick() {
    if (!isPaused) {
      offset += speed;

      if (offset >= singleSetWidth) {
        offset = 0;
      }

      track.style.transform = `translate3d(${-offset}px, 0, 0)`;
    }

    animationId = requestAnimationFrame(tick);
  }

  function start() {
    if (animationId) cancelAnimationFrame(animationId);
    measure();
    tick();
  }

  marquee.addEventListener('mouseenter', () => {
    isPaused = true;
  });

  marquee.addEventListener('mouseleave', () => {
    isPaused = false;
  });

  window.addEventListener('resize', () => {
    measure();
  });

  start();
});
