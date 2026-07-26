// ==========================================================
// 0. INTERACTIVE INK/CHARCOAL CANVAS TRAIL (DRAWING PHYSICS)
// ==========================================================
const inkCanvas = document.getElementById("ink-canvas");
if (inkCanvas) {
    const ctx = inkCanvas.getContext("2d");
    let points = [];

    function resizeCanvas() {
        inkCanvas.width = window.innerWidth;
        inkCanvas.height = window.innerHeight;
    }
    window.addEventListener("resize", resizeCanvas);
    resizeCanvas();

    // Capture mouse movements to append points to trail
    window.addEventListener("mousemove", (e) => {
        points.push({
            x: e.clientX,
            y: e.clientY,
            age: 0,
            vx: (Math.random() - 0.5) * 1.5,
            vy: (Math.random() - 0.5) * 1.5,
            size: Math.random() * 5 + 3
        });
    });

    function drawInkTrail() {
        ctx.clearRect(0, 0, inkCanvas.width, inkCanvas.height);
        
        ctx.lineCap = "round";
        ctx.lineJoin = "round";

        // Draw charcoal sketchy particles/lines
        for (let i = 0; i < points.length; i++) {
            const p = points[i];
            p.x += p.vx;
            p.y += p.vy;
            p.age += 1;

            const alpha = Math.max(0, 1 - p.age / 80);
            ctx.fillStyle = `rgba(255, 255, 255, ${alpha * 0.25})`;
            
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size * (1 - p.age / 80), 0, Math.PI * 2);
            ctx.fill();
        }

        // Draw connected sketched line segment
        if (points.length > 2) {
            ctx.beginPath();
            ctx.strokeStyle = "rgba(255, 255, 255, 0.08)";
            ctx.lineWidth = 2;
            ctx.moveTo(points[0].x, points[0].y);
            
            // Render smooth quadratic curves between drawing nodes
            for (let i = 1; i < points.length - 2; i++) {
                const xc = (points[i].x + points[i + 1].x) / 2;
                const yc = (points[i].y + points[i + 1].y) / 2;
                ctx.quadraticCurveTo(points[i].x, points[i].y, xc, yc);
            }
            ctx.stroke();
        }

        points = points.filter(p => p.age < 80);
        requestAnimationFrame(drawInkTrail);
    }
    requestAnimationFrame(drawInkTrail);
}

// ==========================================================
// 1. SMOOTH SCROLLING (LENIS)
// ==========================================================
const lenis = new Lenis({
    duration: 1.2,
    easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)), 
    direction: 'vertical',
    gestureDirection: 'vertical',
    smooth: true,
    mouseMultiplier: 1,
    smoothTouch: false,
    touchMultiplier: 2,
    infinite: false,
});

// Lenis update is managed solely by GSAP ticker loop below to prevent duplicate update loops

// ==========================================================
// 2. MAGNÉTICO & CURSOR GSAP (TACTILE MICRO-MOTION)
// ==========================================================
gsap.registerPlugin(ScrollTrigger);

const cursor = document.querySelector('.cursor');
const magnetics = document.querySelectorAll('[data-magnetic]');
const navLinks = document.querySelectorAll('.nav-center .nav-link');
const scrollContainer = document.getElementById("scroll-container");
const panels = gsap.utils.toArray("#scroll-container > .panel");
let scrollTriggerInstance;

const xTo = gsap.quickTo(cursor, "x", {duration: 0.15, ease: "power3"});
const yTo = gsap.quickTo(cursor, "y", {duration: 0.15, ease: "power3"});

window.addEventListener('mousemove', (e) => {
    if (cursor) {
        if(cursor.style.opacity === '0') cursor.style.opacity = '1';
        xTo(e.clientX);
        yTo(e.clientY);
    }
});

// Bind magnetic hover effects only on devices supporting hover pointers (prevents mobile sticky tap states)
if (window.matchMedia('(hover: hover)').matches) {
    magnetics.forEach((el) => {
        // Buttons and links: scale-only hover, NO x/y translation (preserves click hitbox)
        const isClickable = el.matches('a, button, [role="button"]');

        el.addEventListener('mouseenter', () => {
            if (cursor) cursor.classList.add('active');
            gsap.to(el, { scale: 1.04, duration: 0.3, ease: 'power3.out' });
        });
        
        el.addEventListener('mouseleave', () => {
            if (cursor) cursor.classList.remove('active');
            gsap.to(el, { x: 0, y: 0, scale: 1, duration: 0.5, ease: 'elastic.out(1, 0.4)' });
        });

        el.addEventListener('mousedown', () => {
            gsap.to(el, { scale: 0.96, duration: 0.1, ease: 'power3.out' });
        });

        el.addEventListener('mouseup', () => {
            gsap.to(el, { scale: 1.04, duration: 0.3, ease: 'power3.out' });
        });

        // Only non-clickable decorative elements get the full magnetic x/y pull
        if (!isClickable) {
            el.addEventListener('mousemove', (e) => {
                const rect = el.getBoundingClientRect();
                const centerX = rect.left + rect.width / 2;
                const centerY = rect.top + rect.height / 2;
                const distX = e.clientX - centerX;
                const distY = e.clientY - centerY;
                gsap.to(el, {
                    x: distX * 0.35,
                    y: distY * 0.35,
                    duration: 0.4,
                    ease: "power2.out"
                });
            });
        }
    });
}

// ==========================================================
// 3. GSAP HORIZONTAL PAN & DYNAMIC SCROLL ANIMATIONS
// ==========================================================
lenis.on('scroll', ScrollTrigger.update);
gsap.ticker.add((time) => {
  lenis.raf(time * 1000);
});
gsap.ticker.lagSmoothing(0);

function initScrollAnimation() {
    // Clean up all existing ScrollTriggers to prevent leaks on resize
    ScrollTrigger.getAll().forEach(t => t.kill());

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (scrollContainer && panels.length > 0 && !prefersReducedMotion) {
        document.body.classList.remove("reduced-motion");
        
        // Reset properties to initial zoom states before building the timeline
        gsap.set(panels, { opacity: 0, scale: 1, xPercent: 0, yPercent: 0, rotate: 0, pointerEvents: "none", zIndex: 1 });
        gsap.set(panels[0], { opacity: 1, scale: 1, pointerEvents: "auto", zIndex: 2 });

        const tl = gsap.timeline();

        // Safety: ensure all panels are invisible and cannot intercept events at start
        gsap.set(panels.slice(1), { opacity: 0, pointerEvents: "none", zIndex: 1 });

        // 1. Hero (0) -> About (1) [HORIZONTAL SLIDE LEFT]
        tl.set("#about", { xPercent: 100, opacity: 1, zIndex: 3 })
          .to("#home", { xPercent: -100, duration: 1, ease: "power2.inOut" })
          .to("#about", { xPercent: 0, duration: 1, ease: "power2.inOut" }, "<")
          .fromTo("#about .about-image", { rotate: -8 }, { rotate: 4, duration: 1 }, "<");

        // 2. About (1) -> Stacks (2) [3D ZOOM DEEP DIVE]
        // #stacks starts at zIndex:1 so cannot overlap #about while it's transitioning out
        tl.set("#stacks", { scale: 2, opacity: 0, rotate: -4, zIndex: 2 })
          .to("#about", { scale: 0.5, opacity: 0, rotate: 4, duration: 1, ease: "power2.inOut" })
          .to("#stacks", 
              { scale: 1, opacity: 1, rotate: 0, zIndex: 4, duration: 1, ease: "power2.inOut" },
              "<"
          )
          .fromTo("#stacks .bento-cell", { scale: 0.7 }, { scale: 1, stagger: 0.05, duration: 1 }, "<");

        // 3. Stacks (2) -> Project 1 (3) [VERTICAL LIFT UP]
        tl.set("#proj-1", { yPercent: 100, opacity: 1, zIndex: 3 })
          .to("#stacks", { yPercent: -100, duration: 1, ease: "power2.inOut" })
          .to("#proj-1", { yPercent: 0, zIndex: 5, duration: 1, ease: "power2.inOut" }, "<")
          .fromTo("#proj-1 .project-visual", { scale: 0.8 }, { scale: 1.08, duration: 1 }, "<")
          .fromTo("#proj-1 .project-info", { y: 60 }, { y: -60, duration: 1 }, "<");

        // 4. Project 1 (3) -> Project 2 (4) [3D ZOOM DEEP DIVE]
        tl.set("#proj-2", { scale: 2, opacity: 0, rotate: 4, zIndex: 3 })
          .to("#proj-1", { scale: 0.5, opacity: 0, rotate: -4, duration: 1, ease: "power2.inOut" })
          .to("#proj-2", 
              { scale: 1, opacity: 1, rotate: 0, zIndex: 6, duration: 1, ease: "power2.inOut" },
              "<"
          )
          .fromTo("#proj-2 .project-visual", { scale: 0.8 }, { scale: 1.08, duration: 1 }, "<")
          .fromTo("#proj-2 .project-info", { y: 60 }, { y: -60, duration: 1 }, "<");

        // 5. Project 2 (4) -> Project 3 (5) [HORIZONTAL SLIDE LEFT]
        tl.set("#proj-3", { xPercent: 100, opacity: 1, zIndex: 3 })
          .to("#proj-2", { xPercent: -100, duration: 1, ease: "power2.inOut" })
          .to("#proj-3", { xPercent: 0, zIndex: 7, duration: 1, ease: "power2.inOut" }, "<")
          .fromTo("#proj-3 .project-visual", { scale: 0.8 }, { scale: 1.08, duration: 1 }, "<")
          .fromTo("#proj-3 .project-info", { y: 60 }, { y: -60, duration: 1 }, "<");

        // 6. Project 3 (5) -> Contact (6) [VERTICAL LIFT UP]
        tl.set("#contact", { yPercent: 100, opacity: 1, zIndex: 3 })
          .to("#proj-3", { yPercent: -100, duration: 1, ease: "power2.inOut" })
          .to("#contact", { yPercent: 0, zIndex: 8, duration: 1, ease: "power2.inOut" }, "<");

        // Create the master ScrollTrigger to control the zoom timeline
        scrollTriggerInstance = ScrollTrigger.create({
            trigger: "#scroll-container",
            pin: true,
            scrub: 1.5,
            start: "top top",
            end: "+=600%",
            animation: tl,
            invalidateOnRefresh: true,
            snap: {
                snapTo: 1 / 6,
                duration: { min: 0.5, max: 1.2 },
                delay: 0.6,  // wider dead zone — user must pause before snap commits
                ease: "power2.inOut"
            },
            onUpdate: self => {
                checkActivePanel(self.progress);
            }
        });
        
        // Immediately sync panel visibility and active state on init
        checkActivePanel(0);
    } else {
        // Fallback layout for prefers-reduced-motion or missing containers
        document.body.classList.add("reduced-motion");
        gsap.set(panels, { opacity: 1, scale: 1, xPercent: 0, yPercent: 0, rotate: 0, pointerEvents: "auto", zIndex: "auto" });
        gsap.set("#about .about-image", { rotate: -2, scale: 1 });
        gsap.set("#stacks .bento-cell", { scale: 1 });
        gsap.set(".project-visual", { scale: 1 });
        gsap.set(".project-info", { y: 0 });
    }
}

// Highlight navbar links based on 3D transition state progress (uses globally cached elements)
function checkActivePanel(progress) {
    const activeState = Math.min(6, Math.max(0, Math.round(progress * 6)));
    
    // Set pointer-events dynamically based on activeState to avoid GSAP timeline string-toggle bugs on load
    panels.forEach((panel, idx) => {
        if (idx === activeState) {
            panel.style.pointerEvents = "auto";
        } else {
            panel.style.pointerEvents = "none";
        }
    });

    let linkIndexToHighlight = 0;
    if (activeState === 0) linkIndexToHighlight = 0;
    else if (activeState === 1) linkIndexToHighlight = 1;
    else if (activeState === 2) linkIndexToHighlight = 2;
    else if (activeState >= 3 && activeState <= 5) linkIndexToHighlight = 3;
    else if (activeState === 6) linkIndexToHighlight = 4;

    navLinks.forEach((link, idx) => {
        if (idx === linkIndexToHighlight) {
            link.classList.add('active');
        } else {
            link.classList.remove('active');
        }
    });
}

// Scroll smooth action on navbar click (links + logo, uses globally cached elements)
const navTriggerButtons = document.querySelectorAll('.logo-braces, .nav-center .nav-link');
navTriggerButtons.forEach((link) => {
    link.addEventListener('click', (e) => {
        e.preventDefault();
        
        if (scrollTriggerInstance) {
            let targetState = 0; // Default to home for logo
            
            if (link.classList.contains('nav-link')) {
                const linkArray = Array.from(navLinks);
                const idx = linkArray.indexOf(link);
                targetState = idx;
                if (idx === 3) targetState = 3; // First project
                if (idx === 4) targetState = 6; // Contact Form
            }
            
            const targetScrollY = scrollTriggerInstance.start + 
                (targetState / 6) * (scrollTriggerInstance.end - scrollTriggerInstance.start);
            
            lenis.scrollTo(targetScrollY, {
                duration: 1.5,
                ease: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t))
            });
        }
    });
});

// -------------------------------------------------------
// Shared helper: scroll to a panel by its index (0–6)
// Retries briefly if ScrollTrigger isn't initialized yet (race condition on load)
// -------------------------------------------------------
function scrollToPanel(panelIndex, attempt = 0) {
    if (!scrollTriggerInstance) {
        if (attempt < 10) setTimeout(() => scrollToPanel(panelIndex, attempt + 1), 100);
        return;
    }
    const targetScrollY = scrollTriggerInstance.start +
        (panelIndex / 6) * (scrollTriggerInstance.end - scrollTriggerInstance.start);
    lenis.scrollTo(targetScrollY, {
        duration: 1.5,
        ease: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t))
    });
}

// Map panel IDs -> timeline index
const panelIndexMap = {
    '#home':    0,
    '#about':   1,
    '#stacks':  2,
    '#proj-1':  3,
    '#proj-2':  4,
    '#proj-3':  5,
    '#contact': 6
};

// Intercept ALL anchor links that point to panel IDs (Ver Projetos, CTA, etc.)
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    const href = anchor.getAttribute('href');
    if (panelIndexMap[href] !== undefined) {
        anchor.addEventListener('click', (e) => {
            e.preventDefault();
            scrollToPanel(panelIndexMap[href]);
        });
    }
});

// -------------------------------------------------------
// Manifesto CTA — click cycles through quotes
// -------------------------------------------------------
const manifestoEl = document.getElementById('manifesto-cta-text');
const heroBlueprintEl = document.querySelector('.hero-blueprint');

const manifestoQuotes = [
    '"Escrevo código limpo. Desenho sistemas rápidos. Resolvo problemas de ponta a ponta sem firulas."',
    '"Cada linha tem um motivo. Cada feature tem um propósito."',
    '"Backend, frontend, infra — o que precisar, entrego."',
    '"Sistemas que escalam começam com decisões simples."',
    '"Não terceirizo a atenção ao detalhe."',
];

let manifestoIndex = 0;

if (manifestoEl) {
    manifestoEl.addEventListener('click', () => {
        // Flash opacity to mask the text swap (feels instant, not jarring)
        manifestoEl.classList.add('text-flash');

        setTimeout(() => {
            manifestoIndex = (manifestoIndex + 1) % manifestoQuotes.length;
            manifestoEl.textContent = manifestoQuotes[manifestoIndex];
            manifestoEl.classList.remove('text-flash');
        }, 120);

        // Hide the "clique para mudar" hint permanently after first use
        if (heroBlueprintEl) {
            heroBlueprintEl.classList.add('manifesto-hint-used');
        }
    });
}


const nameSpans = document.querySelectorAll('.hero-name-span');
const heroSubtitle = document.querySelector('.hero-subtitle');
const glitchZone = document.getElementById('hero-glitch-zone');

const fonts = [
    { name: "'Oswald', sans-serif",              subtitle: "Desenvolvedor Full Stack" },
    { name: "'Special Elite', cursive",           subtitle: "Full Stack Developer" },
    { name: "'Architects Daughter', cursive",     subtitle: "— código. design. sistemas." },
    { name: "'Permanent Marker', cursive",         subtitle: "Builder. Solver. Dev." },
    { name: "'Courier Prime', monospace",          subtitle: "$ build --ship --repeat" }
];

const subtitleFonts = [
    "'Oswald', sans-serif",
    "'Special Elite', cursive",
    "'Architects Daughter', cursive",
    "'Permanent Marker', cursive",
    "'Courier Prime', monospace"
];

let fontIndex = 0;
let glitchTimeout = null;
let glitchIntervalId = null;

function triggerGlitchCycle() {
    if (!glitchZone) return;

    // Kick off glitch visuals
    glitchZone.classList.add('glitch-active');

    // Swap font mid-glitch (imperceptible under the artifact)
    glitchTimeout = setTimeout(() => {
        fontIndex = (fontIndex + 1) % fonts.length;
        const nextFont = fonts[fontIndex];

        nameSpans.forEach(span => {
            span.style.fontFamily = nextFont.name;
            // keep ::before/::after text in sync via data-text (it inherits font-family)
        });

        if (heroSubtitle) {
            heroSubtitle.style.fontFamily = subtitleFonts[fontIndex];
            heroSubtitle.textContent = nextFont.subtitle;
        }

        // Remove glitch after a short burst
        setTimeout(() => {
            glitchZone.classList.remove('glitch-active');
        }, 160);

    }, 80); // swap font 80ms into the 240ms glitch burst
}

// Click on the actual name text triggers glitch + font cycle
// Hover is indicated by CSS cursor:pointer on .hero-name-span (width:fit-content)
let glitchCooldown = false;
nameSpans.forEach(span => {
    span.addEventListener('click', () => {
        if (glitchCooldown) return;
        glitchCooldown = true;
        triggerGlitchCycle();
        // Cooldown matches glitch duration (80ms + 160ms) + small buffer
        setTimeout(() => { glitchCooldown = false; }, 600);
    });
});


// ==========================================================
// 4. I18N - INTERNATIONALIZATION & PREMIUM COPYWRITING
// ==========================================================
const translations = {
    pt: {
        'nav.home': 'Home',
        'nav.about': 'Sobre',
        'nav.stacks': 'Stacks',
        'nav.projects': 'Projetos',
        'nav.contact': 'Contato',
        'home.subtitle': 'Desenvolvedor Full Stack',
        'home.action': 'Ver Projetos',
        'home.manifesto': '"Escrevo código limpo. Desenho sistemas rápidos. Resolvo problemas de ponta a ponta sem firulas."',
        'home.cta.label': 'Disponível para projetos',
        'home.cta.quote': 'Tem uma ideia?<br>Vamos construir juntos.',
        'home.cta.talk': 'Fala comigo',
        'about.title': 'Sobre',
        'about.desc': 'Sou desenvolvedor Full Stack. Construo APIs eficientes com Node.js e Java Spring Boot, crio frontends rápidos e responsivos com React/Next.js e automatizo infraestruturas na nuvem AWS. Meu foco é entregar software resiliente, com arquitetura limpa e performance pura, resolvendo problemas técnicos sem rodeios.',
        'about.resume': 'Currículo',
        'stacks.title': 'Stacks',
        'projects.title': 'Projetos',
        'projects.ixamina.desc': 'Plataforma SaaS Médica End-to-End inovadora. Integrada à Inteligência Artificial do Google Gemini, gera Laudos Clínicos de Hemogramas, Raios-X e ECGs em segundos, com infraestrutura de limites de uso, alertas de urgências e Painel Administrativo em tempo real.',
        'projects.ixamina.link': 'Acesso Antecipado',
        'projects.taskflow.desc': 'Plataforma Kanban completa com API REST em Java 21 e Spring Boot 3.5. Inclui segurança com Spring Security e JWT, upload de avatares com Amazon S3, banco relacional PostgreSQL, e infraestrutura elástica na nuvem AWS via ECS Fargate, ECR e Load Balancer (ALB).',
        'projects.taskflow.link': 'Código Fonte',
        'projects.rodizzio.desc': 'Aplicação gamificada em tempo real para acompanhar pontuações e consumo em rodízios. Desenvolvida em Flutter e Firebase, conta com sincronização de lobby, votação de fim de rodada e roasts com estimativa de calorias via Gemini API.',
        'projects.rodizzio.link': 'Visite a Plataforma',
        'contact.title': 'Fale Comigo.',
        'contact.name': 'Seu Nome',
        'contact.email': 'Seu Email',
        'contact.message': 'Sua Mensagem',
        'contact.send': 'Enviar',
        'footer.rights': 'Todos os direitos reservados.',
        'thanks.title': 'Mensagem Enviada!',
        'thanks.desc': 'Obrigado por entrar em contato. Retornarei o mais breve possível.',
        'thanks.back': 'Voltar para o Início'
    },
    en: {
        'nav.home': 'Home',
        'nav.about': 'About',
        'nav.stacks': 'Stacks',
        'nav.projects': 'Projects',
        'nav.contact': 'Contact',
        'home.subtitle': 'Full Stack Developer',
        'home.action': 'View Projects',
        'home.manifesto': '"I write clean code. I build fast systems. I solve problems end-to-end without the fluff."',
        'home.cta.label': 'Available for projects',
        'home.cta.quote': 'Have an idea?<br>Let\'s build it together.',
        'home.cta.talk': 'Get in touch',
        'about.title': 'About',
        'about.desc': 'I am a Full Stack developer. I build efficient APIs with Node.js and Java Spring Boot, create fast, responsive frontends with React/Next.js, and automate AWS cloud infrastructures. My focus is delivering resilient software with clean architecture and pure performance, solving technical problems straight to the point.',
        'about.resume': 'Download CV',
        'stacks.title': 'Stacks',
        'projects.title': 'Projects',
        'projects.ixamina.desc': 'Innovative End-to-End Medical SaaS. Integrated with Google Gemini AI to generate Clinic Reports from Blood Tests, X-Rays, and ECGs in seconds, featuring rate limiting, urgency alerts, and a real-time Admin Panel.',
        'projects.ixamina.link': 'Early Access',
        'projects.taskflow.desc': 'Full Kanban platform powered by a REST API built in Java 21 and Spring Boot 3.5. Features security with Spring Security and JWT, avatar uploads with Amazon S3, PostgreSQL database, and cloud infrastructure on AWS utilizing ECS Fargate, ECR, and Application Load Balancer (ALB).',
        'projects.taskflow.link': 'Source Code',
        'projects.rodizzio.desc': 'Real-time gamified app to track scores and food consumption at rodízios. Built with Flutter and Firebase, featuring lobby synchronization, majority vote session end, and Gemini AI-generated roasts/calorie estimations.',
        'projects.rodizzio.link': 'Visit Platform',
        'contact.title': 'Get in Touch.',
        'contact.name': 'Your Name',
        'contact.email': 'Your Email',
        'contact.message': 'Your Message',
        'contact.send': 'Send',
        'footer.rights': 'All rights reserved.',
        'thanks.title': 'Message Sent!',
        'thanks.desc': 'Thanks for reaching out. I will get back to you as soon as possible.',
        'thanks.back': 'Back to Home'
    }
};

const langPtBtn = document.getElementById('lang-pt');
const langEnBtn = document.getElementById('lang-en');

function setLanguage(lang) {
    if(lang === 'pt') {
        if (langPtBtn) langPtBtn.classList.add('active');
        if (langEnBtn) langEnBtn.classList.remove('active');
    } else {
        if (langEnBtn) langEnBtn.classList.add('active');
        if (langPtBtn) langPtBtn.classList.remove('active');
    }
    
    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        if(translations[lang][key]) {
            if (translations[lang][key].includes('<') || el.getAttribute('data-i18n-html') !== null) {
                el.innerHTML = translations[lang][key];
            } else {
                el.textContent = translations[lang][key];
            }
        }
    });
    
    document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
        const key = el.getAttribute('data-i18n-placeholder');
        if(translations[lang][key]) {
            if(el.tagName === 'LABEL') {
                el.textContent = translations[lang][key];
            } else {
                el.setAttribute('placeholder', translations[lang][key]);
            }
        }
    });

    document.querySelectorAll('[data-i18n-title]').forEach(el => {
        const key = el.getAttribute('data-i18n-title');
        if(translations[lang][key]) {
            el.setAttribute('title', translations[lang][key]);
        }
    });
    
    localStorage.setItem('lang', lang);
    document.documentElement.setAttribute('lang', lang === 'pt' ? 'pt-BR' : 'en-US');
    
    setTimeout(() => {
        initScrollAnimation();
        ScrollTrigger.refresh();
    }, 150);
}

if(langPtBtn) langPtBtn.addEventListener('click', () => setLanguage('pt'));
if(langEnBtn) langEnBtn.addEventListener('click', () => setLanguage('en'));

const savedLang = localStorage.getItem('lang') || 'pt';
setLanguage(savedLang);

// Single init entry point — setLanguage already calls initScrollAnimation
// Resize is debounced to avoid thrashing during window drag
window.addEventListener("resize", () => {
    clearTimeout(window._resizeTimer);
    window._resizeTimer = setTimeout(initScrollAnimation, 250);
});
