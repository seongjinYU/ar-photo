/* sprite-overlay — 이미지 스프라이트를 "빛/오브젝트"로 얹는다 (v2: 만들지 말고 얹기).
   <a-entity sprite-overlay="src:URL; w:1; h:1; crush:0.35; blend:add; billboard:false;
                             opacity:1; pulse:0; pulseMs:2400; bob:0; bobMs:2600; phase:0">
   - blend  : 'add'(기본, 빛 — 검정=투명) | 'normal'(알파 PNG 오브젝트 — 버블 등)
   - crush > 0 : 로드 시 캔버스 luma-crush — 밝기 crush 이하는 검정으로, 이상은 재스케일.
     체커보드/회색 배경이 구워진 JPEG를 additive용으로 정리하는 용도.
   - pulse > 0 : opacity 맥동. bob > 0 : 위아래 부유(진폭 m, phase로 개체별 위상차). */
AFRAME.registerComponent('sprite-overlay', {
  schema: { src: { type: 'string' }, w: { default: 1 }, h: { default: 1 },
            crush: { default: 0 }, blend: { default: 'add' }, billboard: { default: false },
            opacity: { default: 1.0 }, pulse: { default: 0 }, pulseMs: { default: 2400 },
            bob: { default: 0 }, bobMs: { default: 2600 }, phase: { default: 0 } },
  init: function () {
    if (!this.data.src) { console.warn('[sprite-overlay] no src'); return; }
    this.y0 = this.el.object3D.position.y;
    // 탭하면 터짐(pop): 'pop' 이벤트 받으면 tick에서 부풀며 페이드아웃 후 제거
    this.popT = null;
    this.el.addEventListener('pop', () => { if (this.mesh && this.popT === null) this.popStart = true; });
    const img = new Image(); img.crossOrigin = 'anonymous';
    img.onload = () => {
      let tex;
      if (this.data.crush > 0) {
        const cv = document.createElement('canvas'); cv.width = img.width; cv.height = img.height;
        const g = cv.getContext('2d'); g.drawImage(img, 0, 0);
        const im = g.getImageData(0, 0, cv.width, cv.height), px = im.data;
        const T = this.data.crush * 255;
        for (let i = 0; i < px.length; i += 4) {
          const lum = 0.299 * px[i] + 0.587 * px[i + 1] + 0.114 * px[i + 2];
          const k = lum <= T ? 0 : (lum - T) / (255 - T);   // 배경 크러시 + 하이라이트 재스케일
          px[i] *= k; px[i + 1] *= k; px[i + 2] *= k;
        }
        g.putImageData(im, 0, 0);
        tex = new THREE.CanvasTexture(cv);
      } else {
        tex = new THREE.Texture(img); tex.needsUpdate = true;
      }
      tex.colorSpace = THREE.SRGBColorSpace;
      const add = this.data.blend !== 'normal';
      const mat = new THREE.MeshBasicMaterial({ map: tex,
        blending: add ? THREE.AdditiveBlending : THREE.NormalBlending,
        transparent: true, depthWrite: false, opacity: this.data.opacity, toneMapped: false });
      this.mesh = new THREE.Mesh(new THREE.PlaneGeometry(this.data.w, this.data.h), mat);
      this.el.setObject3D('sprite', this.mesh);
      console.log('[sprite-overlay] active:', this.data.src, add ? '(add)' : '(normal)', this.data.crush > 0 ? '(crushed)' : '');
    };
    img.onerror = () => console.warn('[sprite-overlay] image load failed:', this.data.src);
    img.src = this.data.src;
  },
  tick: function (t) {
    if (!this.mesh) return;
    // 터짐 애니메이션: 살짝 부풀며 빠르게 페이드아웃 → 제거
    if (this.popStart) { this.popT = t; this.popStart = false; }
    if (this.popT !== null) {
      if (this.data.billboard && this.el.sceneEl.camera)
        this.mesh.quaternion.copy(this.el.sceneEl.camera.getWorldQuaternion(this._q || (this._q = new THREE.Quaternion())));
      const e = (t - this.popT) / 200;
      if (e >= 1) { this.el.removeObject3D('sprite'); this.mesh = null; return; }
      const s = 1 + 0.7 * e; this.mesh.scale.set(s, s, 1);
      this.mesh.material.opacity = this.data.opacity * (1 - e) * (1 - e);
      return;
    }
    const tt = t + this.data.phase;
    if (this.data.billboard && this.el.sceneEl.camera)
      this.mesh.quaternion.copy(this.el.sceneEl.camera.getWorldQuaternion(this._q || (this._q = new THREE.Quaternion())));
    if (this.data.pulse > 0)
      this.mesh.material.opacity = this.data.opacity - this.data.pulse * (0.5 + 0.5 * Math.sin(tt / this.data.pulseMs * Math.PI * 2));
    if (this.data.bob > 0)
      this.el.object3D.position.y = this.y0 + this.data.bob * Math.sin(tt / this.data.bobMs * Math.PI * 2);
  },
  remove: function () { this.el.removeObject3D('sprite'); }
});
