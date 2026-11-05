/* The runtime assets and private cue text are prepared locally. */
window.createXiangYuTimeline = () => {
  const fps = 30;
  const duration = 20.9;
  const timeline = window.gsap.timeline({paused: true});
  const cues = window.__CUES || [];
  const embers = document.getElementById('embers');
  for (let i = 0; i < 18; i += 1) {
    const ember = document.createElement('div');
    ember.className = 'ember';
    ember.style.left = `${130 + (i * 307) % 1640}px`;
    ember.style.top = `${670 - (i * 89) % 440}px`;
    ember.style.width = `${3 + i % 3}px`;
    ember.style.height = `${3 + i % 3}px`;
    ember.style.opacity = String(0.14 + ((i * 7) % 12) / 100);
    embers.appendChild(ember);
    timeline.fromTo(ember, {y: 0}, {y: -(180 + (i % 3) * 48), duration, ease: 'none'}, 0);
  }

  timeline.fromTo('#world', {scale: 1.02}, {scale: 1.075, duration, ease: 'none'}, 0);
  timeline.set('#woman', {scaleX: -1}, 0);
  timeline.fromTo('#river', {opacity: 0}, {opacity: 1, duration: 38 / fps, ease: 'none'}, 292 / fps);
  timeline.fromTo('#closeup', {opacity: 0}, {opacity: 1, duration: 18 / fps, ease: 'none'}, 150 / fps);
  timeline.to('#closeup', {opacity: 0, duration: 28 / fps, ease: 'none'}, 292 / fps);
  timeline.fromTo('#closeup', {scale: 1.01}, {scale: 1.065, duration: 170 / fps, ease: 'none'}, 150 / fps);
  timeline.fromTo('#warrior-side', {opacity: 1}, {opacity: 0, duration: 8 / fps, ease: 'none'}, 163 / fps);
  timeline.fromTo('#warrior-bow', {opacity: 0}, {opacity: 1, duration: 8 / fps, ease: 'none'}, 163 / fps);
  timeline.fromTo('#woman-side', {opacity: 1}, {opacity: 0, duration: 8 / fps, ease: 'none'}, 163 / fps);
  timeline.fromTo('#woman-bow', {opacity: 0}, {opacity: 1, duration: 8 / fps, ease: 'none'}, 163 / fps);
  timeline.fromTo('#warrior-bow', {opacity: 1}, {opacity: 0, duration: 8 / fps, ease: 'none', immediateRender: false}, 320 / fps);
  timeline.fromTo('#warrior-back', {opacity: 0}, {opacity: 1, duration: 8 / fps, ease: 'none'}, 320 / fps);
  timeline.fromTo('#warrior', {x: 0}, {x: 20, duration: 480 / fps, ease: 'none'}, 0);
  timeline.fromTo('#warrior', {x: 20}, {x: 130, duration: 147 / fps, ease: 'none'}, 480 / fps);
  timeline.fromTo('#woman', {x: 0}, {x: -30, duration: 320 / fps, ease: 'none'}, 0);
  timeline.fromTo('#woman', {x: -30}, {x: -35, duration: 307 / fps, ease: 'none'}, 320 / fps);
  timeline.fromTo('#title', {opacity: 0}, {opacity: 1, duration: 18 / fps, ease: 'none'}, 0);
  timeline.to('#title', {opacity: 0, duration: 33 / fps, ease: 'none'}, 72 / fps);
  timeline.fromTo('#ending', {opacity: 0}, {opacity: 0.48, duration: 36 / fps, ease: 'none'}, 590 / fps);

  cues.forEach((cue, index) => {
    const element = document.createElement('div');
    element.id = `caption-${index}`;
    element.className = 'caption';
    element.textContent = cue.text;
    document.getElementById('caption-area').appendChild(element);
    const start = cue.startFrame / fps;
    const end = cue.endFrame / fps;
    timeline.fromTo(element, {opacity: 0}, {opacity: 1, duration: 8 / fps, ease: 'none', immediateRender: false}, start);
    timeline.to(element, {opacity: 0, duration: 8 / fps, ease: 'none'}, Math.max(start, end - 8 / fps));
  });

  return timeline;
};
